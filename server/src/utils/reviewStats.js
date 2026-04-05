import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";

export const normalizeReviewText = (value) => (typeof value === "string" ? value.trim() : "");

export const syncProductReviewStats = async (productId) => {
  if (!productId) return;

  const [stats] = await Review.aggregate([
    {
      $match: {
        product_id: String(productId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$product_id",
        reviews_count: { $sum: 1 },
        average_rating: { $avg: "$rating" },
      },
    },
  ]).exec();

  const reviewsCount = stats?.reviews_count || 0;
  const rating = reviewsCount > 0 ? Number((stats?.average_rating || 0).toFixed(1)) : 0;

  await Product.findByIdAndUpdate(productId, {
    rating,
    reviews_count: reviewsCount,
    review_count: reviewsCount,
  }).exec();
};
