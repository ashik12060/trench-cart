import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image_url: { type: String, default: "" },
    parent_category_id: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    created_date: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

CategorySchema.index({ parent_category_id: 1, sort_order: 1 });

export const Category = mongoose.model("Category", CategorySchema);
