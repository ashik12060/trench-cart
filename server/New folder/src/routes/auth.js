import { Router } from "express";
import bcrypt from "bcryptjs";
import { AdminUser } from "../models/AdminUser.js";
import { AUTH_COOKIE, requireAdmin, signAdminToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await AdminUser.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAdminToken(user);
    res.cookie(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(204).send();
});

authRouter.get("/me", requireAdmin, (req, res) => {
  res.json(req.admin);
});
