import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock3, Package, PhoneCall, RotateCcw, Truck, XCircle } from "lucide-react";
import { getLatestTrackingUpdate, getTrackingStatusMeta, getTrackingTimeline } from "@/lib/orderTracking";

const defaultStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const stepIcons = {
  pending: Clock3,
  confirmed: PhoneCall,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  refunded: RotateCcw,
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const toValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);
const getItemDeliveryEstimate = (item, orderCreatedDate) => {
  const explicitDueDate = toValidDate(item?.delivery_due_date);
  if (explicitDueDate) return explicitDueDate;

  const deliveryDays = Number(item?.delivery_days || 0);
  if (!orderCreatedDate || deliveryDays <= 0) return null;

  return addDays(orderCreatedDate, deliveryDays);
};
const getOrderDeliveryEstimate = (order) => {
  const explicitDueDate = toValidDate(order?.delivery_due_date);
  if (explicitDueDate) return explicitDueDate;

  const orderCreatedDate = toValidDate(order?.created_date);
  if (!orderCreatedDate) return null;

  const itemDueDates = (order?.items || [])
    .map((item) => getItemDeliveryEstimate(item, orderCreatedDate))
    .filter(Boolean);

  if (itemDueDates.length === 0) return null;

  return itemDueDates.reduce((latest, date) => (date > latest ? date : latest));
};
const formatDeliveryEstimate = (order) => {
  const dueDate = getOrderDeliveryEstimate(order);
  if (!dueDate) return null;

  const createdDate = toValidDate(order?.created_date);
  const deliveryDays =
    createdDate && dueDate ? Math.max(0, Math.round((dueDate.getTime() - createdDate.getTime()) / MS_PER_DAY)) : null;

  return {
    dueDate,
    deliveryDays,
  };
};

export default function OrderTrackingCard({ order, statusColors = defaultStatusColors, compactItemLimit = 2 }) {
  const [open, setOpen] = useState(false);
  const timeline = getTrackingTimeline(order);
  const latestUpdate = getLatestTrackingUpdate(order);
  const currentStepIndex = timeline.findIndex((step) => step.state === "current");
  const lastCompletedStepIndex = [...timeline].reverse().findIndex((step) => step.state === "completed");
  const currentStepNumber =
    currentStepIndex >= 0
      ? currentStepIndex + 1
      : lastCompletedStepIndex >= 0
        ? timeline.length - lastCompletedStepIndex
        : 1;
  const itemCount = order.items?.length || 0;
  const previewItems = (order.items || []).slice(0, compactItemLimit);
  const deliveryEstimate = formatDeliveryEstimate(order);

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
            <p className="text-[11px] text-gray-500">
              {order.created_date && format(new Date(order.created_date), "MMM d, yyyy")}
            </p>
          </div>
          <Badge className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} border-0 capitalize text-[11px]`}>
            {order.status}
          </Badge>
        </div>

        <div className="mt-2 grid gap-2 text-[12px] text-gray-500 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p>
              {itemCount} items | {formatMoney(order.total)}
            </p>
            {order.tracking_number ? <p className="text-xs text-blue-600">Tracking: {order.tracking_number}</p> : null}
            {latestUpdate?.changed_at ? (
              <p className="text-xs text-gray-400">
                Updated {format(new Date(latestUpdate.changed_at), "MMM d, h:mm a")}
              </p>
            ) : null}
            {deliveryEstimate ? (
              <p className="text-xs text-emerald-700">
                Estimated delivery: {format(deliveryEstimate.dueDate, "MMM d, yyyy")}
                {deliveryEstimate.deliveryDays !== null ? ` (${deliveryEstimate.deliveryDays} day${deliveryEstimate.deliveryDays === 1 ? "" : "s"})` : ""}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
            View tracking
          </Button>
        </div>

        {previewItems.length > 0 ? (
          <>
            <Separator className="my-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {previewItems.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 rounded-xl bg-white p-2 text-xs">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80"}
                    alt={item.product_name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-[11px] text-gray-500">
                      Qty {item.quantity} | {formatMoney(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {order.order_number}</DialogTitle>
            <DialogDescription>
              {getTrackingStatusMeta(order.status)?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Current status</p>
                <p className="text-xs text-slate-500">
                  Step {currentStepNumber} of {timeline.length}
                </p>
              </div>
              <Badge className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} border-0 capitalize`}>
                {order.status}
              </Badge>
            </div>

            {deliveryEstimate ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
                <p className="font-medium text-emerald-900">Estimated delivery</p>
                <p className="mt-1 text-emerald-700">
                  {format(deliveryEstimate.dueDate, "MMM d, yyyy")}
                  {deliveryEstimate.deliveryDays !== null ? ` (${deliveryEstimate.deliveryDays} day${deliveryEstimate.deliveryDays === 1 ? "" : "s"})` : ""}
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              {timeline.map((step, stepIndex) => {
                const Icon = stepIcons[step.status] || Clock3;
                const isCompleted = step.state === "completed";
                const isCurrent = step.state === "current";

                return (
                  <div key={step.status} className="flex gap-3">
                    <div
                      className={[
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                        isCompleted
                          ? "border-green-200 bg-green-50 text-green-600"
                          : isCurrent
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-300",
                      ].join(" ")}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isCurrent ? (
                        <Icon className="h-4 w-4" />
                      ) : (
                        <span className="text-[11px] font-semibold">{stepIndex + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{step.label}</p>
                        {step.changedAt ? (
                          <span className="text-[11px] text-slate-400">
                            {format(new Date(step.changedAt), "MMM d, yyyy h:mm a")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{step.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {order.tracking_number ? (
              <>
                <Separator />
                <div className="text-sm">
                  <p className="text-slate-500">Tracking number</p>
                  <p className="font-medium text-slate-900">{order.tracking_number}</p>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
