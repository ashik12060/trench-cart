import { Router } from "express";
import { Supplier } from "../models/Supplier.js";
import { Product } from "../models/Product.js";
import { parseFilters, parseSort } from "../utils/query.js";

const router = Router();

const normalizeProductCategories = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildSupplierCode = () => `SUP-${Date.now().toString().slice(-8)}`;

const normalizeSupplierPayload = (body = {}, admin) => {
  const payload = { ...body };

  payload.supplier_name = String(payload.supplier_name || "").trim();
  payload.company_name = String(payload.company_name || "").trim();
  payload.contact_person_name = String(payload.contact_person_name || "").trim();
  payload.phone_number = String(payload.phone_number || "").trim();
  payload.email_address = String(payload.email_address || "").trim().toLowerCase();
  payload.website = String(payload.website || "").trim();
  payload.address_line_1 = String(payload.address_line_1 || "").trim();
  payload.address_line_2 = String(payload.address_line_2 || "").trim();
  payload.city = String(payload.city || "").trim();
  payload.state_division = String(payload.state_division || "").trim();
  payload.postal_code = String(payload.postal_code || "").trim();
  payload.country = String(payload.country || "").trim();
  payload.trade_license_image = String(payload.trade_license_image || "").trim();
  payload.lead_time = String(payload.lead_time || "").trim();
  payload.pricing_notes = String(payload.pricing_notes || "").trim();
  payload.notes_remarks = String(payload.notes_remarks || "").trim();
  payload.supplier_code = String(payload.supplier_code || "").trim() || buildSupplierCode();
  payload.product_categories_supplied = normalizeProductCategories(payload.product_categories_supplied);
  payload.minimum_order_quantity = Number(payload.minimum_order_quantity || 0);
  payload.rating =
    payload.rating === "" || payload.rating === undefined || payload.rating === null
      ? null
      : Number(payload.rating);
  payload.created_by = String(payload.created_by || admin?.email || "").trim();

  return payload;
};

const getSupplierStatsMap = async () => {
  const rows = await Product.aggregate([
    {
      $match: {
        supplier_available: true,
        supplier_id: { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: "$supplier_id",
        linked_products_count: { $sum: 1 },
        purchased_units_total: { $sum: { $ifNull: ["$supplier_purchase_quantity", 0] } },
        current_stock_total: { $sum: { $ifNull: ["$stock_quantity", 0] } },
      },
    },
  ]);

  return rows.reduce((acc, row) => {
    acc[row._id] = {
      linked_products_count: row.linked_products_count || 0,
      purchased_units_total: row.purchased_units_total || 0,
      current_stock_total: row.current_stock_total || 0,
    };
    return acc;
  }, {});
};

const withStats = (supplier, statsMap) => {
  const stats = statsMap[supplier.id] || {
    linked_products_count: 0,
    purchased_units_total: 0,
    current_stock_total: 0,
  };

  return {
    ...supplier.toJSON(),
    ...stats,
  };
};

router.get("/", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const sort = parseSort(req.query.sort);
    const limit = req.query.limit ? Number(req.query.limit) : 0;

    let query = Supplier.find(filters).sort(sort);
    if (limit > 0) query = query.limit(limit);

    const [suppliers, statsMap] = await Promise.all([query.exec(), getSupplierStatsMap()]);
    res.json(suppliers.map((supplier) => withStats(supplier, statsMap)));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const supplier = await Supplier.create(normalizeSupplierPayload(req.body, req.admin));
    const statsMap = await getSupplierStatsMap();
    res.status(201).json(withStats(supplier, statsMap));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      normalizeSupplierPayload(req.body, req.admin),
      { new: true, runValidators: true },
    );

    if (!supplier) {
      return res.status(404).json({ error: "Not found" });
    }

    await Product.updateMany(
      { supplier_id: supplier.id },
      {
        $set: {
          supplier_name: supplier.supplier_name,
          supplier_code: supplier.supplier_code,
        },
      },
    );

    const statsMap = await getSupplierStatsMap();
    res.json(withStats(supplier, statsMap));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const linkedProducts = await Product.countDocuments({
      supplier_available: true,
      supplier_id: req.params.id,
    });

    if (linkedProducts > 0) {
      return res.status(400).json({
        error: "This supplier is linked to products. Remove those assignments before deleting it.",
      });
    }

    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const suppliersRouter = router;
