import React, { useState, useEffect, useRef } from "react";
import { storeApi } from "@/api/storeClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, CreditCard, Banknote, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { downloadOrderInvoice } from "@/lib/invoice";

export default function Checkout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);
  const invoiceDownloadStarted = useRef(false);
  const { cart, subtotal, clearCart } = useCart();
  const { customer } = useCustomerAuth();

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    payment_method: "cod",
    notes: "",
  });

  useEffect(() => {
    if (!customer) return;
    setForm((prev) => ({
      ...prev,
      customer_name: customer.full_name || prev.customer_name,
      customer_email: customer.email || prev.customer_email,
      phone: customer.phone || prev.phone,
      street: customer.street || prev.street,
      city: customer.city || prev.city,
      state: customer.state || prev.state,
      zip: customer.zip || prev.zip,
      country: customer.country || prev.country,
    }));
  }, [customer]);

  useEffect(() => {
    if (!orderPlaced || !placedOrder || invoiceDownloadStarted.current) return;
    invoiceDownloadStarted.current = true;
    downloadOrderInvoice(placedOrder);
  }, [orderPlaced, placedOrder]);

  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const updateField = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    invoiceDownloadStarted.current = false;

    const orderNum = "ORD-" + Date.now().toString(36).toUpperCase();
    const normalizedEmail = (form.customer_email || customer?.email || "").trim().toLowerCase();
    const normalizedName =
      (form.customer_name || customer?.full_name || "Guest Shopper").trim() || "Guest Shopper";

    const createdOrder = await storeApi.entities.Order.create({
      order_number: orderNum,
      customer_email: normalizedEmail,
      customer_name: normalizedName,
      customer_phone: form.phone,
      customer_id: customer?.id,
      items: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.sale_price || item.price,
        image_url: item.images?.[0] || "",
        variant_color: item.variant?.color || null,
        variant_size: item.variant?.size || null,
        variant_sku: item.variant?.sku || null,
        status: "pending",
      })),
      subtotal,
      shipping_cost: shipping,
      tax,
      total,
      status: "pending",
      shipping_address: {
        phone: form.phone,
        street: form.street,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
      payment_method: form.payment_method,
      notes: form.notes,
    });

    clearCart();
    setOrderNumber(orderNum);
    setPlacedOrder(createdOrder);
    setOrderPlaced(true);
    setIsSubmitting(false);
  };

  if (orderPlaced) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-20"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500 mt-3">
          Your order <span className="font-semibold text-gray-900">{orderNumber}</span> has been placed successfully.
        </p>
        <p className="text-gray-400 text-sm mt-2">You'll receive an email confirmation shortly.</p>
        <p className="text-gray-500 text-sm mt-2">
          Your invoice will download automatically. If it does not start, use the download button below.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-6"
            onClick={() => placedOrder && downloadOrderInvoice(placedOrder)}
            disabled={!placedOrder}
          >
            Download Invoice
          </Button>
          <Link to={createPageUrl("MyOrders")}>
            <Button variant="outline" className="rounded-full px-6">View My Orders</Button>
          </Link>
          <Link to={createPageUrl("Shop")}>
            <Button className="rounded-full px-6 bg-gray-900 hover:bg-indigo-600">Continue Shopping</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
        <Link to={createPageUrl("Shop")}>
          <Button className="mt-4 rounded-full">Go Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Link to={createPageUrl("Shop")} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" /> Continue Shopping
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Contact */}
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input required value={form.customer_name} onChange={(e) => updateField("customer_name", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input required type="email" value={form.customer_email} onChange={(e) => updateField("customer_email", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input required value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
            <div>
              <Label>Street Address *</Label>
              <Input required value={form.street} onChange={(e) => updateField("street", e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>City *</Label>
                <Input required value={form.city} onChange={(e) => updateField("city", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>ZIP Code *</Label>
                <Input required value={form.zip} onChange={(e) => updateField("zip", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <div>
              <Label>Country *</Label>
              <Input required value={form.country} onChange={(e) => updateField("country", e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
            <RadioGroup value={form.payment_method} onValueChange={(v) => updateField("payment_method", v)} className="space-y-3">
              {[
                { value: "cod", icon: Banknote, label: "Cash on Delivery" },
                { value: "card", icon: CreditCard, label: "Credit / Debit Card" },
                { value: "bank_transfer", icon: Building2, label: "Bank Transfer" },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.payment_method === method.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <RadioGroupItem value={method.value} />
                  <method.icon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-sm">{method.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Order Notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="mt-1.5 rounded-xl" placeholder="Any special instructions..." />
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.cart_item_id} className="flex gap-3">
                  <img
                    src={item.image_url || item.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80"}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover bg-gray-50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.variant && (item.variant.color || item.variant.size) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {[item.variant.color && `Color: ${item.variant.color}`, item.variant.size && `Size: ${item.variant.size}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">${((item.sale_price || item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${tax.toFixed(2)}</span></div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 h-12 rounded-full bg-gray-900 hover:bg-indigo-600 font-semibold transition-colors duration-300"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
