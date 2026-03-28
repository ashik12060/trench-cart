import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { customer, loginCustomer } = useCustomerAuth();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      navigate(createPageUrl("MyOrders"));
    }
  }, [customer, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      await loginCustomer(loginForm);
      navigate(createPageUrl("MyOrders"));
    } catch (error) {
      setLoginError(error?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 px-4 py-12 md:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-700">Customer account</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Login</h1>
          <p className="mt-2 text-sm text-gray-500">Access your orders, profile, and checkout details.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
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

          <Button type="submit" className="w-full rounded-full bg-gray-900 hover:bg-blue-900" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">New here?</span>
            <Link to={createPageUrl("Signup")} className="font-medium text-blue-700 hover:text-blue-900">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
