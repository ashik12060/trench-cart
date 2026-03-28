import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const SupplierSchema = new mongoose.Schema(
  {
    supplier_code: { type: String, default: "", trim: true },
    supplier_name: { type: String, required: true, trim: true },
    company_name: { type: String, default: "", trim: true },
    supplier_type: {
      type: String,
      default: "Wholesaler",
      enum: ["Manufacturer", "Wholesaler", "Distributor"],
    },
    contact_person_name: { type: String, default: "", trim: true },
    phone_number: { type: String, default: "", trim: true },
    email_address: { type: String, default: "", trim: true, lowercase: true },
    website: { type: String, default: "", trim: true },
    address_line_1: { type: String, default: "", trim: true },
    address_line_2: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state_division: { type: String, default: "", trim: true },
    postal_code: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    trade_license_image: { type: String, default: "" },
    product_categories_supplied: { type: [String], default: [] },
    minimum_order_quantity: { type: Number, default: 0 },
    lead_time: { type: String, default: "", trim: true },
    pricing_notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive", "Blacklisted"],
    },
    rating: { type: Number, default: null, min: 0, max: 5 },
    notes_remarks: { type: String, default: "", trim: true },
    created_by: { type: String, default: "", trim: true },
    purchase_history: { type: [String], default: [] },
  },
  baseSchemaOptions,
);

export const Supplier = mongoose.model("Supplier", SupplierSchema);
