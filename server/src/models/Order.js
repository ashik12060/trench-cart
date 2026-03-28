import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const OrderItemSchema = new mongoose.Schema(
  {
    product_id: { type: String, default: "" },
    product_name: { type: String, default: "" },
    image_url: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    variant_color: { type: String, default: "" },
    variant_size: { type: String, default: "" },
    variant_sku: { type: String, default: "" },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled", "refunded"],
    },
    inventory_restocked: { type: Boolean, default: false },
    restocked_at: { type: Date, default: null },
  },
  { _id: false },
);

const AddressSchema = new mongoose.Schema(
  {
    phone: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zip: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { _id: false },
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
    },
    label: { type: String, default: "Order placed" },
    note: { type: String, default: "We received your order and are waiting for the first review." },
    changed_at: { type: Date, default: Date.now },
    changed_by: { type: String, default: "system" },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    order_number: { type: String, default: "" },
    customer_name: { type: String, default: "" },
    customer_email: { type: String, default: "" },
    customer_phone: { type: String, default: "" },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
    },
    payment_method: { type: String, default: "" },
    shipping_address: { type: AddressSchema, default: {} },
    customer_id: { type: String, default: "" },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    tracking_number: { type: String, default: "" },
    status_history: {
      type: [StatusHistorySchema],
      default: () => [
        {
          status: "pending",
          label: "Order placed",
          note: "We received your order and are waiting for the first review.",
          changed_at: new Date(),
          changed_by: "system",
        },
      ],
    },
    inventory_restocked: { type: Boolean, default: false },
    restocked_at: { type: Date, default: null },
    created_date: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

export const Order = mongoose.model("Order", OrderSchema);
