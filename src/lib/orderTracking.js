const ORDER_PROGRESS_STEPS = [
  {
    status: "pending",
    label: "Order placed",
    description: "We received your order and are waiting for the first review.",
  },
  {
    status: "confirmed",
    label: "Confirmed",
    description: "Our team has contacted the customer and confirmed the order details.",
  },
  {
    status: "processing",
    label: "Processing",
    description: "Your items are being packed and prepared for dispatch.",
  },
  {
    status: "shipped",
    label: "Shipped",
    description: "The package has been handed to the courier and is on the way.",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "The order has reached the customer successfully.",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    description: "The order was cancelled before completion.",
  },
  {
    status: "refunded",
    label: "Refunded",
    description: "The payment was refunded back to the customer.",
  },
];

const TRACKING_NOTE_BY_STATUS = {
  pending: "Order received",
  confirmed: "Customer contacted and order confirmed",
  processing: "Order is being prepared",
  shipped: "Handed to the courier",
  delivered: "Delivered to the customer",
  cancelled: "Order cancelled",
  refunded: "Refund issued",
};

const normalizeHistory = (history = []) =>
  [...history]
    .filter(Boolean)
    .map((entry) => ({
      ...entry,
      changed_at: entry.changed_at || entry.created_at || null,
    }))
    .sort((a, b) => new Date(a.changed_at || 0) - new Date(b.changed_at || 0));

export const getTrackingStatusMeta = (status) =>
  ORDER_PROGRESS_STEPS.find((step) => step.status === status) || ORDER_PROGRESS_STEPS[0];

export const getTrackingTimeline = (order) => {
  const history = normalizeHistory(order?.status_history);
  const historyMap = new Map(history.map((entry) => [entry.status, entry]));
  const currentStatus = order?.status || "pending";
  const currentStatusIndex = ORDER_PROGRESS_STEPS.findIndex((step) => step.status === currentStatus);
  const hasHistory = history.length > 0;

  return ORDER_PROGRESS_STEPS.map((step, index) => {
    const historyEntry = historyMap.get(step.status);
    const inferredCompleted =
      !hasHistory &&
      (currentStatusIndex >= 0 ? index < currentStatusIndex : step.status === "pending" || step.status === currentStatus);
    const isCurrent = currentStatus === step.status;
    const isCompleted = Boolean(historyEntry) || inferredCompleted;
    const state = isCurrent ? "current" : isCompleted ? "completed" : "upcoming";

    return {
      ...step,
      state,
      note: historyEntry?.note || TRACKING_NOTE_BY_STATUS[step.status] || step.description,
      changedAt: historyEntry?.changed_at || null,
      changedBy: historyEntry?.changed_by || null,
    };
  });
};

export const getLatestTrackingUpdate = (order) => {
  const history = normalizeHistory(order?.status_history);
  if (history.length > 0) return history[history.length - 1];
  if (!order?.created_date && !order?.status) return null;
  return {
    status: order?.status || "pending",
    changed_at: order?.created_date || null,
    note: TRACKING_NOTE_BY_STATUS[order?.status || "pending"],
  };
};
