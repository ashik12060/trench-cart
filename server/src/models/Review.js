import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const ReviewSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true, index: true },
    order_id: { type: String, default: "", index: true },
    order_number: { type: String, default: "" },
    customer_id: { type: String, default: "", index: true },
    customer_name: { type: String, default: "" },
    customer_email: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "rejected"],
      index: true,
    },
    admin_note: { type: String, default: "" },
    moderated_by: { type: String, default: "" },
    moderated_at: { type: Date, default: null },
    approved_at: { type: Date, default: null },
    created_date: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

ReviewSchema.index({ product_id: 1, status: 1, created_date: -1 });
ReviewSchema.index({ product_id: 1, customer_id: 1, order_id: 1 }, { unique: true });

export const Review = mongoose.model("Review", ReviewSchema);
