import { Router } from "express";
import multer from "multer";
import { cloudinary } from "../config/cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });

const uploadBufferToCloudinary = (buffer, folder = "digitrench") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

export const uploadsRouter = Router();

uploadsRouter.post("/image", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const hasCloudinaryConfig =
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinaryConfig) {
      return res.status(500).json({
        error: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
      });
    }

    const uploaded = await uploadBufferToCloudinary(req.file.buffer);
    return res.json({ file_url: uploaded.secure_url });
  } catch (error) {
    next(error);
  }
});
