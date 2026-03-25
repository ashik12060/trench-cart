import { Router } from "express";
import { Product } from "../models/Product.js";
import { Supplier } from "../models/Supplier.js";
import { parseFilters, parseSort } from "../utils/query.js";

const router = Router();

const computeVariantStock = (variants = []) =>
  variants.reduce((sum, variant) => sum + (Number(variant?.quantity) || 0), 0);

const normalizeVariants = (variants = []) =>
  (Array.isArray(variants) ? variants : []).map((variant) => ({
    sku: String(variant?.sku || "").trim(),
    size: String(variant?.size || "").trim(),
    color: String(variant?.color || "").trim(),
    quantity: Number(variant?.quantity || 0),
  }));

const normalizeProductPayload = async (body = {}, existingDoc = null) => {
  const payload = {
    ...(existingDoc ? existingDoc.toObject() : {}),
    ...body,
  };
  payload.variants = normalizeVariants(payload.variants);
  payload.stock_quantity = payload.variants.length
    ? computeVariantStock(payload.variants)
    : Number(payload.stock_quantity || 0);
  payload.low_stock_threshold = Number(payload.low_stock_threshold || 5);
  payload.price = Number(payload.price || 0);
  payload.sale_price =
    payload.sale_price === "" || payload.sale_price === null || payload.sale_price === undefined
      ? null
      : Number(payload.sale_price);
  payload.cost_price =
    payload.cost_price === "" || payload.cost_price === null || payload.cost_price === undefined
      ? null
      : Number(payload.cost_price);
  payload.weight =
    payload.weight === "" || payload.weight === null || payload.weight === undefined
      ? null
      : Number(payload.weight);
  payload.supplier_available = Boolean(payload.supplier_available);

  if (!payload.supplier_available) {
    payload.supplier_id = "";
    payload.supplier_name = "";
    payload.supplier_code = "";
    payload.supplier_purchase_quantity = 0;
    return payload;
  }

  const supplierId = String(payload.supplier_id || "").trim();
  const supplier = supplierId ? await Supplier.findById(supplierId) : null;
  if (!supplier) {
    throw new Error("Please select a valid supplier.");
  }

  payload.supplier_id = supplier.id;
  payload.supplier_name = supplier.supplier_name;
  payload.supplier_code = supplier.supplier_code;
  payload.supplier_purchase_quantity = Number(payload.stock_quantity || 0);

  return payload;
};

router.get("/", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const sort = parseSort(req.query.sort);
    const limit = req.query.limit ? Number(req.query.limit) : 0;

    let query = Product.find(filters).sort(sort);
    if (limit > 0) query = query.limit(limit);

    res.json(await query.exec());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const doc = await Product.create(await normalizeProductPayload(req.body));
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existingDoc = await Product.findById(req.params.id);
    if (!existingDoc) return res.status(404).json({ error: "Not found" });

    const doc = await Product.findByIdAndUpdate(req.params.id, await normalizeProductPayload(req.body, existingDoc), {
      new: true,
      runValidators: true,
    });
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const doc = await Product.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const productsRouter = router;
