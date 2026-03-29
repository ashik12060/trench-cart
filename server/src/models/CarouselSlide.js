import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const CarouselSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    cta_label: { type: String, default: "Shop Now", trim: true },
    image_url: { type: String, required: true, trim: true },
    link_url: { type: String, default: "/", trim: true },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    created_date: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

CarouselSlideSchema.index({ is_active: 1, sort_order: 1, created_date: -1 });
CarouselSlideSchema.index({ created_date: -1 });

export const CarouselSlide = mongoose.model("CarouselSlide", CarouselSlideSchema);
