import { createCrudRouter } from "./crud.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { findVariantByAttributes, recalcStockFromVariants } from "../utils/inventory.js";

const RESTOCK_STATUSES = new Set(["cancelled", "refunded"]);
const ITEM_RESTOCK_STATUSES = new Set(["returned", "cancelled", "refunded"]);

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
  afterUpdate: async ({ prevDoc, updatedDoc }) => {
    if (!updatedDoc) return;
    const prevItems = Array.isArray(prevDoc?.items) ? prevDoc.items : [];
    const updatedItems = Array.isArray(updatedDoc.items) ? updatedDoc.items : [];
    let docChanged = false;

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
