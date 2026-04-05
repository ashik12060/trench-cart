import { createCrudRouter } from "./crud.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { findVariantByAttributes, recalcStockFromVariants } from "../utils/inventory.js";
import { enrichOrdersWithItemImages } from "../utils/orderImages.js";

const RESTOCK_STATUSES = new Set(["cancelled", "refunded"]);
const ITEM_RESTOCK_STATUSES = new Set(["returned", "cancelled", "refunded"]);
const STATUS_LABELS = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
const STATUS_NOTES = {
  pending: "We received your order and are waiting for the first review.",
  confirmed: "Our team contacted the customer and confirmed the order details.",
  processing: "Your items are being packed and prepared for dispatch.",
  shipped: "The package has been handed to the courier.",
  delivered: "The order has been delivered to the customer.",
  cancelled: "The order was cancelled before completion.",
  refunded: "The payment has been refunded back to the customer.",
};

const buildStatusHistoryEntry = (status) => ({
  status,
  label: STATUS_LABELS[status] || status,
  note: STATUS_NOTES[status] || "Order status updated by the admin.",
  changed_at: new Date(),
  changed_by: "admin",
});

const restockOrderItem = async (item) => {
  if (!item?.product_id || !item?.quantity) return;
  const qty = Number(item.quantity || 0);
  if (qty <= 0) return;

  const product = await Product.findById(item.product_id);
  if (!product) return;

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const variant = findVariantByAttributes(product, item);

  if (hasVariants) {
    if (variant) {
      variant.quantity = Math.max(0, (variant.quantity || 0) + qty);
      recalcStockFromVariants(product);
    } else {
      product.stock_quantity = Math.max(0, (product.stock_quantity || 0) + qty);
    }
  } else {
    product.stock_quantity = Math.max(0, (product.stock_quantity || 0) + qty);
  }

  await product.save();
};

export const ordersRouter = createCrudRouter(Order, {
  afterFindMany: enrichOrdersWithItemImages,
  afterUpdate: async ({ prevDoc, updatedDoc }) => {
    if (!updatedDoc) return;
    const previousStatus = prevDoc?.status;
    const nextStatus = updatedDoc?.status;
    let docChanged = false;

    if (previousStatus !== nextStatus && nextStatus) {
      const existingHistory = Array.isArray(updatedDoc.status_history) ? updatedDoc.status_history : [];
      updatedDoc.status_history = [...existingHistory, buildStatusHistoryEntry(nextStatus)];
      docChanged = true;
    }

    const prevItems = Array.isArray(prevDoc?.items) ? prevDoc.items : [];
    const updatedItems = Array.isArray(updatedDoc.items) ? updatedDoc.items : [];

    for (let index = 0; index < updatedItems.length; index += 1) {
      const item = updatedItems[index];
      const prevItem = prevItems[index];
      const statusChanged = prevItem?.status !== item.status;

      if (ITEM_RESTOCK_STATUSES.has(item.status) && !item.inventory_restocked) {
        await restockOrderItem(item);
        item.inventory_restocked = true;
        item.restocked_at = new Date();
        docChanged = true;
      } else if (statusChanged && !ITEM_RESTOCK_STATUSES.has(item.status) && item.inventory_restocked) {
        item.inventory_restocked = false;
        item.restocked_at = null;
        docChanged = true;
      }
    }

    if (RESTOCK_STATUSES.has(updatedDoc.status) && !updatedDoc.inventory_restocked) {
      for (const item of updatedItems) {
        if (!item.inventory_restocked) {
          await restockOrderItem(item);
          item.inventory_restocked = true;
          item.restocked_at = new Date();
          docChanged = true;
        }
      }

      updatedDoc.inventory_restocked = true;
      updatedDoc.restocked_at = new Date();
      docChanged = true;
    } else if (!RESTOCK_STATUSES.has(updatedDoc.status) && updatedDoc.inventory_restocked) {
      updatedDoc.inventory_restocked = false;
      updatedDoc.restocked_at = null;
      docChanged = true;
    }

    if (docChanged) {
      await updatedDoc.save();
    }
  },
});
