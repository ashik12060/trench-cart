import { Product } from "../models/Product.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const getProductPrimaryImage = (product = {}) => {
  const directImages = Array.isArray(product?.images) ? product.images : [];
  const variantImages = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) => (Array.isArray(variant?.images) ? variant.images : []))
    : [];

  const firstImage = [...directImages, ...variantImages].find((image) => normalizeString(image));
  return firstImage || normalizeString(product?.image_url) || "";
};

export const enrichOrdersWithItemImages = async (orders = []) => {
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  const productIds = [...new Set(
    normalizedOrders.flatMap((order) =>
      (Array.isArray(order?.items) ? order.items : [])
        .map((item) => normalizeString(item?.product_id))
        .filter(Boolean),
    ),
  )];

  if (productIds.length === 0) {
    return normalizedOrders;
  }

  const products = await Product.find({ _id: { $in: productIds } }).select("images variants image_url").lean().exec();
  const imageMap = new Map(products.map((product) => [String(product._id), getProductPrimaryImage(product)]));

  return normalizedOrders.map((order) => ({
    ...order,
    items: Array.isArray(order?.items)
      ? order.items.map((item) => ({
          ...item,
          image_url: normalizeString(item?.image_url) || imageMap.get(normalizeString(item?.product_id)) || "",
        }))
      : [],
  }));
};
