import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeApi } from "@/api/storeClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function MyOrders() {
  const { customer, loginCustomer, registerCustomer, logoutCustomer, updateProfile } = useCustomerAuth();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [message, setMessage] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestOrderNumber, setGuestOrderNumber] = useState("");
  const [guestOrders, setGuestOrders] = useState([]);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [guestLookupError, setGuestLookupError] = useState(null);

  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch,
  } = useQuery({
    queryKey: ["customer-orders", customer?.id],
    queryFn: async () => {
      try {
        return await storeApi.customers.orders();
      } catch (error) {
        if (error?.status === 401) return [];
        throw error;
      }
    },
    enabled: !!customer?.id,
  });

  useEffect(() => {
    if (!customer) return;
    setProfileForm((prev) => ({
      ...prev,
      full_name: customer.full_name || prev.full_name,
      email: customer.email || prev.email,
      phone: customer.phone || prev.phone,
      street: customer.street || prev.street,
      city: customer.city || prev.city,
      state: customer.state || prev.state,
      zip: customer.zip || prev.zip,
      country: customer.country || prev.country,
    }));
    refetch();
  }, [customer, refetch]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError(null);
    try {
      await loginCustomer(loginForm);
    } catch (error) {
      setLoginError(error?.message || "Unable to login");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setRegisterError(null);
    try {
      await registerCustomer(registerForm);
    } catch (error) {
      setRegisterError(error?.message || "Unable to register");
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await updateProfile(profileForm);
      setMessage("Profile updated");
    } catch (error) {
      setMessage(error?.message || "Failed to update profile");
    }
  };

  const filteredGuestOrders = guestOrders.filter((order) => {
    if (!guestOrderNumber) return true;
    return order.order_number?.toLowerCase().includes(guestOrderNumber.toLowerCase());
  });

  const handleGuestLookup = async (event) => {
    event.preventDefault();
    setGuestLookupError(null);
    const normalizedEmail = (guestEmail || "").trim().toLowerCase();
    if (!normalizedEmail) {
      setGuestOrders([]);
      setGuestLookupError("Please enter the email you used at checkout.");
      return;
    }
    setIsGuestLoading(true);
    try {
      const results = await storeApi.entities.Order.filter({ customer_email: normalizedEmail });
      setGuestOrders(results);
      if (results.length === 0) {
        setGuestLookupError("No orders were found for that email.");
      }
    } catch (error) {
      setGuestOrders([]);
      setGuestLookupError(error?.message || "Failed to fetch orders.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome back</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleLogin} className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">Login</p>
                <p className="text-xs text-gray-500">Access your orders and profile</p>
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            {loginError && <p className="text-xs text-red-500">{loginError}</p>}
            <Button type="submit" className="w-full rounded-full bg-gray-900 hover:bg-blue-900">
              Login
            </Button>
          </form>
          <form onSubmit={handleRegister} className="bg-blue-50 rounded-2xl border border-blue-100 p-6 space-y-4">
            <div>
              <p className="text-lg font-semibold text-blue-900">Create account</p>
              <p className="text-xs text-blue-600">Register to save your details</p>
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={registerForm.full_name}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, full_name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={registerForm.phone}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
            {registerError && <p className="text-xs text-red-600">{registerError}</p>}
            <Button type="submit" className="w-full rounded-full bg-blue-900 text-white">
              Create account
            </Button>
          </form>
        </div>
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">Track your order without logging in</p>
              <p className="text-sm text-gray-500">Provide the email you used during checkout and we will show your recent orders.</p>
            </div>
            <Badge className="border-0 bg-blue-100 text-blue-800 uppercase text-[10px] tracking-[0.3em]">Guest</Badge>
          </div>
          <form onSubmit={handleGuestLookup} className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Email address *</Label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  if (guestLookupError) setGuestLookupError(null);
                }}
                placeholder="you@example.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Order number</Label>
              <Input
                value={guestOrderNumber}
                onChange={(e) => setGuestOrderNumber(e.target.value)}
                placeholder="ORD-123"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" className="rounded-full bg-gray-900 text-white" disabled={isGuestLoading}>
                {isGuestLoading ? "Searching..." : "Find my orders"}
              </Button>
            </div>
          </form>
          {guestLookupError && (
            <p className="text-xs text-red-500">{guestLookupError}</p>
          )}
          {filteredGuestOrders.length > 0 && (
            <div className="space-y-3">
              {filteredGuestOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-2xl p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-[11px] text-gray-500">
                        {order.created_date && format(new Date(order.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} border-0 capitalize text-[11px]`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-[12px] text-gray-500 mt-2">
                    <p>{order.items?.length || 0} items · ${order.total?.toFixed(2)}</p>
                    {order.tracking_number && (
                      <p className="text-xs text-blue-600">Tracking: {order.tracking_number}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {!isGuestLoading && filteredGuestOrders.length === 0 && !guestLookupError && guestOrders.length > 0 && (
            <p className="text-xs text-gray-500">No orders match that order number.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hi, {customer.full_name}</h1>
            <p className="text-sm text-gray-500">Track your orders and keep your info up to date.</p>
          </div>
          <Button variant="outline" onClick={logoutCustomer} className="rounded-full">
            Logout
          </Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-gray-900">Your profile</p>
              <Badge className="border-0 bg-blue-100 text-blue-800">Customer</Badge>
            </div>
            {message && <p className="text-xs text-green-600">{message}</p>}
            <div>
              <Label>Full name</Label>
              <Input value={profileForm.full_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))} className="mt-1" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} className="mt-1" type="email" required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} className="mt-1" />
            </div>
            <Separator />
            <div>
              <Label>Street</Label>
              <Input value={profileForm.street} onChange={(e) => setProfileForm((prev) => ({ ...prev, street: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>City</Label>
                <Input value={profileForm.city} onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={profileForm.state} onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Zip</Label>
                <Input value={profileForm.zip} onChange={(e) => setProfileForm((prev) => ({ ...prev, zip: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <Input value={profileForm.country} onChange={(e) => setProfileForm((prev) => ({ ...prev, country: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="rounded-full bg-gray-900 text-white">
                Save changes
              </Button>
            </div>
          </form>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-semibold text-gray-900">Your orders</p>
              <span className="text-xs text-gray-500">{orders.length} orders</span>
            </div>
            <div className="space-y-3">
              {ordersLoading && Array(3).fill(0).map((_, index) => (
                <div key={index} className="animate-pulse h-28 bg-gray-100 rounded-2xl" />
              ))}
              {!ordersLoading && orders.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-500">
                  No orders yet
                  <Link to={createPageUrl("Shop")} className="text-blue-600 block mt-2">Start shopping</Link>
                </div>
              )}
              {!ordersLoading && orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-500">
                        {order.created_date && format(new Date(order.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} border-0 capitalize`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{order.items?.length || 0} items · ${order.total?.toFixed(2)}</p>
                    {order.tracking_number && (
                      <p className="text-xs text-blue-600">Tracking: {order.tracking_number}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    {(order.items || []).slice(0, 3).map((item) => (
                      <div key={item.product_id} className="flex items-center gap-2">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80"} alt={item.product_name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{item.product_name}</p>
                          <p className="text-[11px]">
                            Qty {item.quantity} · ${item.price?.toFixed(2)}
                          </p>
                          {item.variant_color || item.variant_size ? (
                            <p className="text-[10px] text-gray-400">
                              {item.variant_color ? `Color: ${item.variant_color}` : ""}
                              {item.variant_color && item.variant_size ? " · " : ""}
                              {item.variant_size ? `Size: ${item.variant_size}` : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>${order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Shipping</span>
                    <span>${order.shipping_cost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Tax</span>
                    <span>${order.tax?.toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
