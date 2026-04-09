import { Router } from "express";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { CarouselSlide } from "../models/CarouselSlide.js";
import { parseFields, parseFilters, parseSort } from "../utils/query.js";
import { findVariantByAttributes, recalcStockFromVariants } from "../utils/inventory.js";
import { enrichOrdersWithItemImages, getProductPrimaryImage } from "../utils/orderImages.js";
import { optionalCustomer } from "../middleware/auth.js";
import { buildPublicAvailabilityFilter, getCountryName, isProductAvailableInCountry, resolveVisitorCountry } from "../utils/countries.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeEmail = (value) => normalizeString(value).toLowerCase();
const sanitizePublicProduct = (product) => {
  const data = typeof product?.toJSON === "function" ? product.toJSON() : { ...(product || {}) };
  if (!data.id && data._id) {
    data.id = String(data._id);
  }
  delete data.cost_price;
  delete data.barcode;
  delete data.supplier_available;
  delete data.supplier_id;
  delete data.supplier_name;
  delete data.supplier_code;
  delete data.supplier_purchase_quantity;
  delete data.barcode_image_url;
  delete data.available_countries;
  if (Array.isArray(data.variants)) {
    data.variants = data.variants.map((variant) => {
      const nextVariant = { ...variant };
      delete nextVariant.barcode;
      delete nextVariant.barcode_image_url;
      return nextVariant;
    });
  }
  return data;
};

export const publicRouter = Router();

publicRouter.use((req, res, next) => {
  req.visitorCountry = resolveVisitorCountry(req);
  res.locals.visitorCountry = req.visitorCountry;
  next();
});

const sanitizeCarouselSlide = (slide) => {
  const data = typeof slide?.toJSON === "function" ? slide.toJSON() : { ...(slide || {}) };
  if (!data.id && data._id) {
    data.id = String(data._id);
  }
  return data;
};

const normalizeShippingAddress = (shippingAddress = {}, fallbackPhone = "") => ({
  phone: normalizeString(shippingAddress.phone || fallbackPhone),
  street: normalizeString(shippingAddress.street),
  city: normalizeString(shippingAddress.city),
  state: normalizeString(shippingAddress.state),
  zip: normalizeString(shippingAddress.zip),
  country: normalizeString(shippingAddress.country),
});

publicRouter.get("/visitor-context", (req, res) => {
  res.json({
    country_code: req.visitorCountry?.code || "",
    country_name: getCountryName(req.visitorCountry?.code || ""),
    source: req.visitorCountry?.source || "unknown",
  });
});

publicRouter.get("/products", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const sort = parseSort(req.query.sort);
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const fields = parseFields(req.query.fields);
    const availabilityFilter = buildPublicAvailabilityFilter(req.visitorCountry?.code || "");
    const queryFilters = Object.keys(filters).length > 0 ? { $and: [filters, availabilityFilter] } : availabilityFilter;
    let query = Product.find(queryFilters).sort(sort).lean();
    if (limit > 0) query = query.limit(limit);
    if (fields) query = query.select(fields);
    const products = await query.exec();
    res.json(products.map(sanitizePublicProduct));
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/categories", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const sort = parseSort(req.query.sort);
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    let query = Category.find(filters).sort(sort).lean();
    if (limit > 0) query = query.limit(limit);
    const categories = await query.exec();
    res.json(
      categories.map((category) => ({
        ...category,
        id: category.id || String(category._id),
      })),
    );
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/carousel-slides", async (req, res, next) => {
  try {
    const slides = await CarouselSlide.find({ is_active: true }).sort({ sort_order: 1, created_date: -1 }).lean().exec();
    res.json(slides.map(sanitizeCarouselSlide));
  } catch (error) {
    next(error);
  }
});

publicRouter.post("/orders/checkout", optionalCustomer, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: "Invalid checkout payload" });
    }

    const customer = req.customer;
    const normalizedEmail = normalizeEmail(payload.customer_email || customer?.email || "");
    const rawName = payload.customer_name || customer?.full_name || "";
    const normalizedName = normalizeString(rawName) || "Guest Shopper";
    const normalizedPhone = normalizeString(payload.customer_phone || payload.phone || customer?.phone || "");
    const normalizedShippingAddress = normalizeShippingAddress(payload.shipping_address || {}, normalizedPhone);
    const createdAt = new Date();
    const visitorCountryCode = req.visitorCountry?.code || "";
    const visitorCountrySource = req.visitorCountry?.source || "unknown";
    const normalizedItems = [];
    const blockedItems = [];
    const missingItems = [];
    const invalidItems = [];
    let orderDeliveryDueDate = null;

    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        invalidItems.push({
          product_id: String(item.product_id || "").trim(),
          reason: "missing_product_id_or_quantity",
        });
        continue;
      }
      const qty = Number(item.quantity || 0);
      if (qty <= 0) {
        invalidItems.push({
          product_id: String(item.product_id || "").trim(),
          reason: "invalid_quantity",
        });
        continue;
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        missingItems.push({
          product_id: String(item.product_id || "").trim(),
          reason: "product_not_found",
        });
        continue;
      }

      if (!isProductAvailableInCountry(product.available_countries, visitorCountryCode)) {
        blockedItems.push({
          product_id: String(product.id || product._id || item.product_id || "").trim(),
          product_name: String(product.name || "").trim(),
          reason: visitorCountryCode ? `not_available_in_${visitorCountryCode.toLowerCase()}` : "not_available_for_detected_country",
        });
        continue;
      }

      const deliveryDays = Math.max(0, Number(product.delivery_days || 0));
      const deliveryDueDate = deliveryDays > 0
        ? new Date(createdAt.getTime() + deliveryDays * 24 * 60 * 60 * 1000)
        : null;

      if (deliveryDueDate && (!orderDeliveryDueDate || deliveryDueDate > orderDeliveryDueDate)) {
        orderDeliveryDueDate = deliveryDueDate;
      }

      normalizedItems.push({
        ...item,
        image_url: normalizeString(item.image_url) || getProductPrimaryImage(product),
        delivery_days: deliveryDays,
        delivery_due_date: deliveryDueDate,
      });
    }

    if (blockedItems.length > 0) {
      return res.status(403).json({
        error: "Some items are not available for your country",
        blocked_items: blockedItems,
      });
    }

    if (missingItems.length > 0 || invalidItems.length > 0) {
      return res.status(400).json({
        error: "Invalid checkout payload",
        missing_items: missingItems,
        invalid_items: invalidItems,
      });
    }

    if (normalizedItems.length === 0) {
      return res.status(400).json({ error: "Invalid checkout payload" });
    }

    const orderPayload = {
      ...payload,
      customer_id: customer?.id,
      customer_email: normalizedEmail,
      customer_name: normalizedName,
      customer_phone: normalizedPhone,
      shipping_address: normalizedShippingAddress,
      items: normalizedItems,
      delivery_due_date: orderDeliveryDueDate,
      visitor_country_code: visitorCountryCode,
      visitor_country_source: visitorCountrySource,
      created_date: createdAt,
    };

    const order = await Order.create(orderPayload);

    for (const item of normalizedItems) {
      const qty = Number(item.quantity || 0);
      const product = await Product.findById(item.product_id);
      if (!product) {
        continue;
      }
      const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
      const variant = findVariantByAttributes(product, item);
      if (hasVariants) {
        if (variant) {
          variant.quantity = Math.max(0, (variant.quantity || 0) - qty);
          recalcStockFromVariants(product);
        } else {
          product.stock_quantity = Math.max(0, (product.stock_quantity || 0) - qty);
        }
      } else {
        product.stock_quantity = Math.max(0, (product.stock_quantity || 0) - qty);
      }
      await product.save();
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/orders/my", async (req, res, next) => {
  try {
    const customerEmail = normalizeEmail(req.query.customer_email || "");
    const orderNumber = normalizeString(req.query.order_number || "");

    if (!customerEmail && !orderNumber) return res.json([]);

    const query = {};
    if (customerEmail) {
      query.customer_email = customerEmail;
    }
    if (orderNumber) {
      query.order_number = orderNumber;
    }

    const orders = await Order.find(query).sort({ created_date: -1 }).exec();
    res.json(await enrichOrdersWithItemImages(orders));
  } catch (error) {
    next(error);
  }
});
