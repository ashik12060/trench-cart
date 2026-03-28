import bcrypt from "bcryptjs";
import { AdminUser } from "../models/AdminUser.js";

export const ensureAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[server] ADMIN_EMAIL or ADMIN_PASSWORD not set. Admin login disabled.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await AdminUser.findOne({ email });

  if (!existing) {
    await AdminUser.create({
      email,
      password_hash: passwordHash,
      role: "admin",
      is_active: true,
    });
    console.log("[server] admin user created from env");
    return;
  }

  existing.password_hash = passwordHash;
  existing.role = "admin";
  existing.is_active = true;
  await existing.save();
  console.log("[server] admin user updated from env");
};
