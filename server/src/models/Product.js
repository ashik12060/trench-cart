import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";
import { DEFAULT_COUNTRY_CODES, normalizeCountryList } from "../utils/countries.js";

const VariantSchema = new mongoose.Schema(
  {
    sku: { type: String, default: "", trim: true },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    barcode: { type: String, default: "", trim: true },
    barcode_image_url: { type: String, default: "", trim: true },
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
    barcode: { type: String, default: "", trim: true },
    barcode_image_url: { type: String, default: "", trim: true },
    category_id: { type: String, default: "" },
    subcategory_id: { type: String, default: "" },
    sub_subcategory_id: { type: String, default: "" },
    available_countries: {
      type: [String],
      default: () => [...DEFAULT_COUNTRY_CODES],
      validate: {
        validator: (value) => {
          const rawValue = Array.isArray(value) ? value : [];
          const normalized = normalizeCountryList(rawValue);
          return normalized.length > 0 && normalized.length === rawValue.length;
        },
        message: "Product availability must use valid country codes.",
      },
    },
    stock_quantity: { type: Number, default: 0 },
    low_stock_threshold: { type: Number, default: 5 },
    delivery_days: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviews_count: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
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

ProductSchema.index({ created_date: -1 });
ProductSchema.index({ category_id: 1, created_date: -1 });
ProductSchema.index({ subcategory_id: 1, created_date: -1 });
ProductSchema.index({ sub_subcategory_id: 1, created_date: -1 });
ProductSchema.index({ available_countries: 1, is_active: 1, created_date: -1 });
ProductSchema.index({ is_active: 1, created_date: -1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ barcode: 1 });

export const Product = mongoose.model("Product", ProductSchema);
