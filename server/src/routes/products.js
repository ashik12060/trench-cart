import { Router } from "express";
import { Product } from "../models/Product.js";
import { Supplier } from "../models/Supplier.js";
import { parseFields, parseFilters, parseSort } from "../utils/query.js";
import { buildProductBarcodeBase, buildVariantBarcode, generateProductBarcode, normalizeBarcodeValue } from "../utils/barcodes.js";

const router = Router();

const normalizeLeanDoc = (doc) => {
  if (!doc || doc.id) return doc;
  if (!doc._id) return doc;
  return {
    ...doc,
    id: String(doc._id),
  };
};

const computeVariantStock = (variants = []) =>
  variants.reduce((sum, variant) => sum + (Number(variant?.quantity) || 0), 0);

const PRODUCT_BARCODE_PATTERN = /^TC\d{2}[A-Z0-9]{0,8}\d{4,5}$/;

const normalizeVariants = (variants = []) =>
  (Array.isArray(variants) ? variants : []).map((variant) => ({
    sku: String(variant?.sku || "").trim(),
    size: String(variant?.size || "").trim(),
    color: String(variant?.color || "").trim(),
    quantity: Number(variant?.quantity || 0),
    barcode: normalizeBarcodeValue(variant?.barcode || ""),
    barcode_image_url: String(variant?.barcode_image_url || "").trim(),
  }));

const getUsedBarcodes = async (excludeId = null) => {
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};
  const products = await Product.find(filter).select("barcode variants.barcode").lean().exec();
  const used = new Set();

  for (const product of products) {
    if (product?.barcode) {
      used.add(normalizeBarcodeValue(product.barcode));
    }

    for (const variant of Array.isArray(product?.variants) ? product.variants : []) {
      if (variant?.barcode) {
        used.add(normalizeBarcodeValue(variant.barcode));
      }
    }
  }

  return used;
};

const createUniqueProductBarcode = (productPayload, usedBarcodes, preferredBarcode = "") => {
  const normalizedPreferred = normalizeBarcodeValue(preferredBarcode);
  const expectedBase = buildProductBarcodeBase(productPayload);
  if (
    normalizedPreferred &&
    PRODUCT_BARCODE_PATTERN.test(normalizedPreferred) &&
    normalizedPreferred.startsWith(expectedBase) &&
    !usedBarcodes.has(normalizedPreferred)
  ) {
    usedBarcodes.add(normalizedPreferred);
    return normalizedPreferred;
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = generateProductBarcode(productPayload);
    if (usedBarcodes.has(candidate)) continue;
    usedBarcodes.add(candidate);
    return candidate;
  }

  throw new Error("Unable to generate a unique product barcode.");
};

const createVariantBarcodes = (variants = [], parentBarcode = "", usedBarcodes) =>
  variants.map((variant, index) => {
    let candidate = buildVariantBarcode({ parentBarcode, index });

    if (usedBarcodes.has(candidate)) {
      const fallbackParent = createUniqueProductBarcode({ sku: `${parentBarcode}${index}` }, usedBarcodes);
      candidate = buildVariantBarcode({ parentBarcode: fallbackParent, index });
    }

    usedBarcodes.add(candidate);

    return {
      ...variant,
      barcode: candidate,
    };
  });

const normalizeProductPayload = async (body = {}, existingDoc = null) => {
  const payload = {
    ...(existingDoc ? existingDoc.toObject() : {}),
    ...body,
  };
  const usedBarcodes = await getUsedBarcodes(existingDoc?.id || null);
  payload.variants = normalizeVariants(payload.variants);
  payload.barcode = createUniqueProductBarcode(payload, usedBarcodes, payload.barcode);
  payload.variants = createVariantBarcodes(payload.variants, payload.barcode, usedBarcodes);
  payload.stock_quantity = payload.variants.length
    ? computeVariantStock(payload.variants)
    : Number(payload.stock_quantity || 0);
  payload.low_stock_threshold = Number(payload.low_stock_threshold || 5);
  payload.price = Number(payload.price || 0);
  payload.sale_price =
    payload.sale_price === "" || payload.sale_price === null || payload.sale_price === undefined
      ? null
      : Number(payload.sale_price);
  payload.discount_amount = Number(payload.discount_amount || 0);
  payload.cost_price =
    payload.cost_price === "" || payload.cost_price === null || payload.cost_price === undefined
      ? null
      : Number(payload.cost_price);
  payload.weight =
    payload.weight === "" || payload.weight === null || payload.weight === undefined
      ? null
      : Number(payload.weight);
  payload.supplier_available = Boolean(payload.supplier_available);

  if (payload.discount_amount > 0 && payload.price > 0) {
    payload.discount_amount = Math.min(Math.max(payload.discount_amount, 0), payload.price);
    payload.sale_price = Number((payload.price - payload.discount_amount).toFixed(2));
  } else if (payload.sale_price && payload.sale_price < payload.price) {
    payload.discount_amount = Number((payload.price - payload.sale_price).toFixed(2));
  } else {
    payload.discount_amount = 0;
    payload.sale_price = null;
  }

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

router.post("/generate-barcodes", async (req, res, next) => {
  try {
    const products = await Product.find().exec();
    const usedBarcodes = new Set();
    let updated = 0;

    for (const product of products) {
      const nextBarcode = createUniqueProductBarcode(product, usedBarcodes);
      const nextVariants = createVariantBarcodes((Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
        sku: String(variant?.sku || "").trim(),
        size: String(variant?.size || "").trim(),
        color: String(variant?.color || "").trim(),
        quantity: Number(variant?.quantity || 0),
        barcode: normalizeBarcodeValue(variant?.barcode || ""),
        barcode_image_url: String(variant?.barcode_image_url || "").trim(),
      })), nextBarcode, usedBarcodes);

      const productChanged = nextBarcode !== String(product.barcode || "");
      const variantsChanged = nextVariants.some((variant, index) => variant.barcode !== String(product.variants?.[index]?.barcode || ""));

      if (!productChanged && !variantsChanged) continue;

      product.barcode = nextBarcode;
      product.variants = nextVariants;
      product.markModified("variants");
      await product.save();
      updated += 1;
    }

    res.json({ updated });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const sort = parseSort(req.query.sort);
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const fields = parseFields(req.query.fields);

    let query = Product.find(filters).sort(sort).lean();
    if (limit > 0) query = query.limit(limit);
    if (fields) query = query.select(fields);

    res.json((await query.exec()).map(normalizeLeanDoc));
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
