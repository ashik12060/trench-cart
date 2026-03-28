import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, default: "admin" },
    is_active: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

export const AdminUser = mongoose.model("AdminUser", AdminUserSchema);
