import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const VariantSchema = new mongoose.Schema(
  {
    sku: { type: String, default: "", trim: true },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
  },
  { _id: false },
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    short_description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    sale_price: { type: Number, default: null },
    discount_amount: { type: Number, default: 0 },
    cost_price: { type: Number, default: null },
    sku: { type: String, default: "", trim: true },
    category_id: { type: String, default: "" },
    stock_quantity: { type: Number, default: 0 },
    low_stock_threshold: { type: Number, default: 5 },
    is_active: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    brand: { type: String, default: "" },
    weight: { type: Number, default: null },
    supplier_available: { type: Boolean, default: false },
    supplier_id: { type: String, default: "" },
    supplier_name: { type: String, default: "" },
    supplier_code: { type: String, default: "" },
    supplier_purchase_quantity: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    variants: { type: [VariantSchema], default: [] },
    created_date: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

export const Product = mongoose.model("Product", ProductSchema);
