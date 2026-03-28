import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { customer, registerCustomer } = useCustomerAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      navigate(createPageUrl("MyOrders"));
    }
  }, [customer, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerCustomer(form);
      navigate(createPageUrl("MyOrders"));
    } catch (err) {
      setError(err?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 px-4 py-12 md:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-700">Customer account</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Create account</h1>
          <p className="mt-2 text-sm text-gray-500">Register to save your details and track orders faster.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <Label>Full name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your name"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Optional"
              className="mt-1"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button type="submit" className="w-full rounded-full bg-gray-900 hover:bg-blue-900" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Already have an account?</span>
            <Link to={createPageUrl("Login")} className="font-medium text-blue-700 hover:text-blue-900">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
