import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { productsRouter } from "./routes/products.js";
import { categoriesRouter } from "./routes/categories.js";
import { ordersRouter } from "./routes/orders.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { uploadsRouter } from "./routes/uploads.js";
import { authRouter } from "./routes/auth.js";
import { requireAdmin } from "./middleware/auth.js";
import { publicRouter } from "./routes/public.js";
import { ensureAdminUser } from "./utils/seedAdmin.js";
import { usersRouter } from "./routes/users.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "digitrench-api" });
});

app.use("/api/auth", authRouter);
app.use("/api", publicRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin/products", requireAdmin, productsRouter);
app.use("/api/admin/categories", requireAdmin, categoriesRouter);
app.use("/api/admin/orders", requireAdmin, ordersRouter);
app.use("/api/admin/suppliers", requireAdmin, suppliersRouter);
app.use("/api/uploads", requireAdmin, uploadsRouter);

app.use((error, _req, res, _next) => {
  console.error("[server] error", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

const start = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }
    await ensureAdminUser();
    configureCloudinary({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    });

    app.listen(port, () => {
      console.log(`[server] listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("[server] failed to start", error.message);
    process.exit(1);
  }
};

start();
