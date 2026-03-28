import { v2 as cloudinary } from "cloudinary";

export const configureCloudinary = ({ cloudName, apiKey, apiSecret }) => {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("[server] Cloudinary is not configured. Upload endpoint will fail until configured.");
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  console.log("[server] Cloudinary configured");
};

export { cloudinary };
