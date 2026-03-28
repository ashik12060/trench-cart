import { Router } from "express";
import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { signCustomerToken, requireCustomer, CUSTOMER_COOKIE } from "../middleware/auth.js";

const router = Router();

const buildCustomerPayload = (customer) => ({
  id: customer.id,
  full_name: customer.full_name,
  email: customer.email,
  phone: customer.phone,
  street: customer.street,
  city: customer.city,
  state: customer.state,
  zip: customer.zip,
  country: customer.country,
});

const setCustomerCookie = (res, customer) => {
  const token = signCustomerToken(customer);
  res.cookie(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

router.post("/register", async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.full_name || !payload.email || !payload.password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    const email = String(payload.email).toLowerCase().trim();
    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const password_hash = await Customer.hashPassword(payload.password);
    const customer = await Customer.create({
      full_name: payload.full_name,
      email,
      password_hash,
      phone: payload.phone || "",
      street: payload.street || "",
      city: payload.city || "",
      state: payload.state || "",
      zip: payload.zip || "",
      country: payload.country || "",
    });
    setCustomerCookie(res, customer);
    res.status(201).json(buildCustomerPayload(customer));
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const customer = await Customer.findOne({ email: String(email).toLowerCase().trim() });
    if (!customer || !customer.is_active) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isMatching = await customer.matchesPassword(password);
    if (!isMatching) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    setCustomerCookie(res, customer);
    res.json(buildCustomerPayload(customer));
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(CUSTOMER_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(204).send();
});

router.get("/me", requireCustomer, (req, res) => {
  res.json(buildCustomerPayload(req.customer));
});

router.put("/me", requireCustomer, async (req, res, next) => {
  try {
    const updates = {};
    const body = req.body || {};
    ["full_name", "phone", "street", "city", "state", "zip", "country"].forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field];
    });
    if (body.password) {
      updates.password_hash = await Customer.hashPassword(body.password);
    }
    if (Object.keys(updates).length === 0) {
      return res.json(buildCustomerPayload(req.customer));
    }
    Object.assign(req.customer, updates);
    await req.customer.save();
    res.json(buildCustomerPayload(req.customer));
  } catch (error) {
    next(error);
  }
});

router.get("/me/orders", requireCustomer, async (req, res, next) => {
  try {
    const orders = await Order.find({ customer_id: req.customer.id }).sort({ created_date: -1 }).exec();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

export const usersRouter = router;
