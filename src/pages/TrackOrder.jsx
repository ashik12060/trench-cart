import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeApi } from "@/api/storeClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [lookupError, setLookupError] = useState(null);

  const {
    data: orders = [],
    isFetching,
  } = useQuery({
    queryKey: ["guest-order-tracking", submittedOrderNumber],
    queryFn: async () => {
      if (!submittedOrderNumber) return [];
      return storeApi.entities.Order.filter({ order_number: submittedOrderNumber });
    },
    enabled: !!submittedOrderNumber,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const handleTrack = async (event) => {
    event.preventDefault();
    const normalizedOrderNumber = orderNumber.trim();

    if (!normalizedOrderNumber) {
      setLookupError("Please enter your order number.");
      return;
    }

    setLookupError(null);
    setSubmittedOrderNumber(normalizedOrderNumber);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-700">Guest tracking</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Track your order</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter your order number to see the latest status and tracking details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleTrack} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <Label>Order number</Label>
            <Input
              value={orderNumber}
              onChange={(e) => {
                setOrderNumber(e.target.value);
                if (lookupError) setLookupError(null);
              }}
              placeholder="ORD-123"
              className="mt-1"
              required
            />
          </div>

          {lookupError && <p className="text-xs text-red-500">{lookupError}</p>}

          <Button type="submit" className="w-full rounded-full bg-gray-900 hover:bg-blue-900" disabled={isFetching}>
            {isFetching ? "Searching..." : "Track order"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Want full account access?</span>
            <Link to={createPageUrl("Login")} className="font-medium text-blue-700 hover:text-blue-900">
              Login
            </Link>
          </div>
        </form>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-semibold text-gray-900">Results</p>
            <span className="text-xs text-gray-500">{orders.length} orders</span>
          </div>

          {!submittedOrderNumber && (
            <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              Submit your order number to see matching orders.
            </div>
          )}

          {submittedOrderNumber && orders.length === 0 && !isFetching && !lookupError && (
            <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              No orders found for that order number.
            </div>
          )}

          <div className="space-y-3">
            {orders.map((order) => (
              <OrderTrackingCard key={order.id} order={order} statusColors={statusColors} compactItemLimit={2} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
