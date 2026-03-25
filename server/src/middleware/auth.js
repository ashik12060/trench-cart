import jwt from "jsonwebtoken";
import { AdminUser } from "../models/AdminUser.js";
import { Customer } from "../models/Customer.js";

export const AUTH_COOKIE = "admin_token";
export const CUSTOMER_COOKIE = "customer_token";

export const signAdminToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  );

export const signCustomerToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  );

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await AdminUser.findById(payload.sub);
    if (!user || !user.is_active || user.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.admin = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireCustomer = async (req, res, next) => {
  try {
    const token = req.cookies?.[CUSTOMER_COOKIE];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await Customer.findById(payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.customer = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const optionalCustomer = async (req, _res, next) => {
  const token = req.cookies?.[CUSTOMER_COOKIE];
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = await Customer.findById(payload.sub);
      if (user && user.is_active) {
        req.customer = user;
      }
    }
  }
  next();
};
