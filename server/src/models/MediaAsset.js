import mongoose from "mongoose";
import { baseSchemaOptions } from "./schemaOptions.js";

const MediaAssetSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    url: { type: String, required: true, trim: true },
    size: { type: Number, default: 0 },
    type: { type: String, default: "image", trim: true },
    source: { type: String, default: "upload", trim: true },
    folder: { type: String, default: "digitrench", trim: true },
    cloudinary_public_id: { type: String, default: "", trim: true },
  },
  baseSchemaOptions,
);

MediaAssetSchema.index({ createdAt: -1 });
MediaAssetSchema.index({ cloudinary_public_id: 1 });
MediaAssetSchema.index({ url: 1 });

export const MediaAsset = mongoose.model("MediaAsset", MediaAssetSchema);
