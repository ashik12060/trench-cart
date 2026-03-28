import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { baseSchemaOptions } from "./schemaOptions.js";

const CustomerSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password_hash: { type: String, default: "" },
    phone: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zip: { type: String, default: "" },
    country: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    created_date: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

CustomerSchema.methods.matchesPassword = function (password) {
  if (!password) return false;
  if (!this.password_hash) return false;
  return bcrypt.compare(password, this.password_hash);
};

CustomerSchema.statics.hashPassword = async function (password) {
  if (!password) return "";
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const Customer = mongoose.model("Customer", CustomerSchema);
