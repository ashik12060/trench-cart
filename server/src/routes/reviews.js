import { Router } from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Review } from "../models/Review.js";
import { requireAdmin, requireCustomer } from "../middleware/auth.js";
import { normalizeReviewText, syncProductReviewStats } from "../utils/reviewStats.js";

const ALLOWED_ORDER_STATUSES = new Set(["pending", "confirmed", "processing", "shipped", "delivered"]);

const normalizeReviewPayload = (body = {}) => ({
  product_id: String(body.product_id || "").trim(),
  order_id: String(body.order_id || "").trim(),
  order_number: String(body.order_number || "").trim(),
  rating: Math.max(1, Math.min(5, Number(body.rating || 0))),
  comment: normalizeReviewText(body.comment || ""),
});

const reviewToPublicJson = (review) => {
  const data = typeof review?.toJSON === "function" ? review.toJSON() : { ...(review || {}) };
  delete data.customer_email;
  delete data.customer_id;
  delete data.order_id;
  delete data.admin_note;
  delete data.moderated_by;
  delete data.status;
  return data;
};

const reviewToAdminJson = (review) => ({
  ...review,
  id: review?.id || review?._id?.toString?.() || "",
});

const findEligibleOrder = async (customerId, customerEmail, productId, orderId = "") => {
  const query = {
    $or: [{ customer_id: customerId }, { customer_email: customerEmail }],
    items: { $elemMatch: { product_id: productId } },
    status: { $in: [...ALLOWED_ORDER_STATUSES] },
  };

  if (orderId) {
    query._id = orderId;
  }

  return Order.findOne(query).sort({ created_date: -1 }).exec();
};

const updateProductStatsForReview = async (review, previousStatus = "") => {
  if (!review?.product_id) return;
  const shouldRecalculate = previousStatus === "approved" || review.status === "approved";
  if (shouldRecalculate) {
    await syncProductReviewStats(review.product_id);
  }
};

export const reviewsRouter = Router();
export const adminReviewsRouter = Router();

reviewsRouter.get("/", async (req, res, next) => {
  try {
    const productId = String(req.query.product_id || "").trim();
    if (!productId) {
      return res.json([]);
    }

    const reviews = await Review.find({ product_id: productId, status: "approved" })
      .sort({ created_date: -1 })
      .lean()
      .exec();
    res.json(reviews.map(reviewToPublicJson));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post("/", requireCustomer, async (req, res, next) => {
  try {
    const payload = normalizeReviewPayload(req.body);
    if (!payload.product_id || !payload.rating || !payload.comment) {
      return res.status(400).json({ error: "Product, rating and comment are required" });
    }

    const eligibleOrder = await findEligibleOrder(
      req.customer.id,
      req.customer.email,
      payload.product_id,
      payload.order_id,
    );

    if (!eligibleOrder) {
      return res.status(403).json({ error: "You can only review products you have purchased" });
    }

    const existing = await Review.findOne({
      product_id: payload.product_id,
      customer_id: req.customer.id,
      order_id: eligibleOrder.id,
    }).exec();

    const reviewData = {
      product_id: payload.product_id,
      order_id: eligibleOrder.id,
      order_number: eligibleOrder.order_number || payload.order_number || "",
      customer_id: req.customer.id,
      customer_name: req.customer.full_name || "",
      customer_email: req.customer.email || "",
      rating: payload.rating,
      comment: payload.comment,
      status: "pending",
      admin_note: "",
      moderated_by: "",
      moderated_at: null,
      approved_at: null,
    };

    let review;
    if (existing) {
      Object.assign(existing, reviewData);
      review = await existing.save();
    } else {
      review = await Review.create(reviewData);
    }

    res.status(existing ? 200 : 201).json(review);
  } catch (error) {
    next(error);
  }
});

adminReviewsRouter.use(requireAdmin);

adminReviewsRouter.get("/", async (req, res, next) => {
  try {
    const filters = {};
    const { status, product_id, search } = req.query || {};
    if (status && status !== "all") filters.status = String(status);
    if (product_id) filters.product_id = String(product_id);
    if (search) {
      const normalizedSearch = String(search).trim();
      if (normalizedSearch) {
        filters.$or = [
          { customer_name: { $regex: normalizedSearch, $options: "i" } },
          { customer_email: { $regex: normalizedSearch, $options: "i" } },
          { comment: { $regex: normalizedSearch, $options: "i" } },
          { order_number: { $regex: normalizedSearch, $options: "i" } },
        ];
      }
    }

    const reviews = await Review.find(filters).sort({ created_date: -1 }).lean().exec();
    res.json(reviews.map(reviewToAdminJson));
  } catch (error) {
    next(error);
  }
});

adminReviewsRouter.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid review id" });
    }
    const review = await Review.findById(req.params.id).exec();
    if (!review) {
      return res.status(404).json({ error: "Not found" });
    }

    const previousStatus = review.status;
    const nextStatus = String(req.body?.status || review.status).trim();
    if (nextStatus) {
      review.status = nextStatus;
    }
    if (req.body?.rating !== undefined) {
      review.rating = Math.max(1, Math.min(5, Number(req.body.rating || review.rating)));
    }
    if (req.body?.comment !== undefined) {
      review.comment = normalizeReviewText(req.body.comment);
    }
    if (req.body?.admin_note !== undefined) {
      review.admin_note = normalizeReviewText(req.body.admin_note);
    }

    review.moderated_by = req.admin?.email || "admin";
    review.moderated_at = new Date();
    review.approved_at = review.status === "approved" ? new Date() : null;

    const updated = await review.save();
    await updateProductStatsForReview(updated, previousStatus);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

adminReviewsRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid review id" });
    }
    const review = await Review.findById(req.params.id).exec();
    if (!review) {
      return res.status(404).json({ error: "Not found" });
    }

    await Review.deleteOne({ _id: review.id }).exec();
    await updateProductStatsForReview(review, review.status);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
