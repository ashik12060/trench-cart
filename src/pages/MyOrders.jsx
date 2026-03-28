import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeApi } from "@/api/storeClient";
import { Link, Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import OrderTrackingCard from "@/components/shared/OrderTrackingCard";

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
  const { customer, logoutCustomer, updateProfile } = useCustomerAuth();
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

  if (!customer) {
    return <Navigate to={createPageUrl("Login")} replace />;
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
                  <Link to={createPageUrl("Shop")} className="text-blue-600 block mt-2">
                    Start shopping
                  </Link>
                </div>
              )}
              {!ordersLoading && orders.map((order) => (
                <OrderTrackingCard key={order.id} order={order} statusColors={statusColors} compactItemLimit={2} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
