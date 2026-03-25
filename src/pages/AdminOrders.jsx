import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Eye, ShoppingCart, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import SearchBar from "@/components/store/SearchBar";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  returned: "bg-orange-100 text-orange-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const getOrderPhone = (order) => order?.customer_phone || order?.shipping_address?.phone || "-";
const itemStatusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled", "refunded"];
const orderStatusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => storeApi.entities.Order.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => storeApi.entities.Order.update(id, data),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (selectedOrder?.id === updatedOrder?.id) {
        setSelectedOrder(updatedOrder);
      }
      toast.success("Order updated");
    },
  });

  const filtered = orders.filter((order) => {
    const matchSearch =
      !search ||
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || order.status === statusFilter;
    const createdAt = order.created_date ? new Date(order.created_date) : null;
    const fromBoundary = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toBoundary = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    const matchFrom = !fromBoundary || (createdAt && createdAt >= fromBoundary);
    const matchTo = !toBoundary || (createdAt && createdAt <= toBoundary);
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const downloadSalesReport = () => {
    const deliveredOrders = filtered.filter((order) => order.status === "delivered");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalItems = deliveredOrders.reduce(
      (sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
      0,
    );
    let y = margin;

    const ensureSpace = (height = 20) => {
      if (y + height > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const drawStatCard = (x, top, width, label, value) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, top, width, 58, 8, 8, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + 12, top + 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(String(value), x + 12, top + 42);
    };

    const columns = [
      { label: "Order", width: 92 },
      { label: "Date", width: 70 },
      { label: "Customer", width: 120 },
      { label: "Status", width: 62 },
      { label: "Items", width: 46 },
      { label: "Total", width: 70 },
    ];

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 76, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Sales Report", margin + 18, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("MegaMart Admin", margin + 18, y + 50);
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy h:mm a")}`, pageWidth - margin - 18, y + 30, { align: "right" });
    const dateLabel = [dateFrom || "Start", dateTo || "End"].join(" to ");
    doc.text(`Filter: Delivered Only | ${dateLabel}`, pageWidth - margin - 18, y + 50, { align: "right" });
    y += 96;

    const cardGap = 14;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    drawStatCard(margin, y, cardWidth, "Orders", deliveredOrders.length);
    drawStatCard(margin + cardWidth + cardGap, y, cardWidth, "Units Sold", totalItems);
    drawStatCard(margin + (cardWidth + cardGap) * 2, y, cardWidth, "Revenue", formatCurrency(totalRevenue));
    y += 82;

    ensureSpace(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Order Summary", margin, y);
    y += 18;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 24, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    let x = margin + 10;
    columns.forEach((column) => {
      doc.text(column.label, x, y + 16);
      x += column.width;
    });
    y += 34;

    deliveredOrders.forEach((order) => {
      const customerText = [order.customer_name, order.customer_email].filter(Boolean).join(" / ");
      const rowValues = [
        order.order_number || "-",
        order.created_date ? format(new Date(order.created_date), "dd MMM yyyy") : "-",
        customerText || "-",
        order.status || "-",
        String((order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)),
        formatCurrency(order.total),
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lineCounts = rowValues.map((value, index) =>
        doc.splitTextToSize(String(value), columns[index].width - 8).length,
      );
      const rowHeight = Math.max(24, Math.max(...lineCounts) * 12);
      ensureSpace(rowHeight + 8);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 6, pageWidth - margin, y - 6);

      x = margin + 10;
      rowValues.forEach((value, index) => {
        const lines = doc.splitTextToSize(String(value), columns[index].width - 8);
        doc.setTextColor(index === 5 ? 15 : 51, index === 5 ? 23 : 65, index === 5 ? 42 : 85);
        doc.text(lines, x, y + 4);
        x += columns[index].width;
      });

      y += rowHeight;
    });

    if (deliveredOrders.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text("No delivered orders are available for the sales report.", margin, y + 6);
      y += 24;
    }

    ensureSpace(30);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("This report includes delivered orders only.", margin, y);

    doc.save(`sales-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const phone = getOrderPhone(order);
    let y = 16;

    const ensureSpace = (height = 10) => {
      if (y + height > pageHeight - 16) {
        doc.addPage();
        y = 16;
      }
    };

    const drawCard = (x, top, width, height, fillColor = [248, 250, 252]) => {
      doc.setFillColor(...fillColor);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, top, width, height, 4, 4, "FD");
    };

    const addSummaryRow = (label, value, bold = false) => {
      ensureSpace(7);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(bold ? 11 : 10);
      doc.setTextColor(bold ? 15 : 100, bold ? 23 : 116, bold ? 42 : 139);
      doc.text(label, margin, y);
      doc.text(String(value || "-"), pageWidth - margin, y, { align: "right" });
      y += bold ? 8 : 6;
    };

    const drawBlock = (title, lines, x, top, width) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(title.toUpperCase(), x, top);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      let cursorY = top + 6;
      lines.filter(Boolean).forEach((line) => {
        const wrapped = doc.splitTextToSize(String(line), width);
        doc.text(wrapped, x, cursorY);
        cursorY += wrapped.length * 5;
      });
      return cursorY;
    };

    const drawItemRow = (item) => {
      ensureSpace(14);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(item.product_name || "-", 88);
      doc.text(titleLines, margin, y + 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const meta = [
        item.variant_color ? `Color: ${item.variant_color}` : "",
        item.variant_size ? `Size: ${item.variant_size}` : "",
        item.variant_sku ? `SKU: ${item.variant_sku}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      const metaLines = meta ? doc.splitTextToSize(meta, 88) : [];
      if (metaLines.length) {
        doc.text(metaLines, margin, y + 8);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.quantity || 0), margin + 108, y + 3, { align: "right" });
      doc.text(formatCurrency(item.price), margin + 138, y + 3, { align: "right" });
      doc.text(formatCurrency((item.quantity || 0) * (item.price || 0)), pageWidth - margin, y + 3, { align: "right" });

      y += Math.max(12, 6 + titleLines.length * 5 + metaLines.length * 4);
    };

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 30, 5, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("INVOICE", margin + 6, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("TrenchCart", margin + 6, y + 20);
    doc.text(order.order_number || "-", pageWidth - margin - 6, y + 12, { align: "right" });
    doc.text(order.created_date ? format(new Date(order.created_date), "MMM d, yyyy") : "-", pageWidth - margin - 6, y + 20, { align: "right" });
    y += 38;

    const blockTop = y;
    drawCard(margin, blockTop, 84, 34);
    drawCard(margin + 90, blockTop, 92, 34);

    const billToEnd = drawBlock(
      "Bill To",
      [order.customer_name || "-", order.customer_email || "-", order.customer_phone],
      margin + 4,
      blockTop + 6,
      74,
    );

    const shipToEnd = drawBlock(
      "Ship To",
      [
        order.shipping_address?.street,
        order.shipping_address?.city,
        [order.shipping_address?.state, order.shipping_address?.zip].filter(Boolean).join(" "),
        order.shipping_address?.country,
      ],
      margin + 94,
      blockTop + 6,
      82,
    );

    y = Math.max(billToEnd, shipToEnd, blockTop + 34) + 6;

    addSummaryRow("Payment Method", order.payment_method?.replaceAll("_", " "));
    addSummaryRow("Status", order.status);
    addSummaryRow("Tracking Number", order.tracking_number || "Not assigned");
    y += 2;

    ensureSpace(16);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 10, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Item", margin + 3, y + 6);
    doc.text("Qty", margin + 108, y + 6, { align: "right" });
    doc.text("Price", margin + 138, y + 6, { align: "right" });
    doc.text("Amount", pageWidth - margin, y + 6, { align: "right" });
    y += 14;

    (order.items || []).forEach(drawItemRow);

    y += 4;
    ensureSpace(32);
    drawCard(pageWidth - margin - 76, y, 76, 28);
    y += 8;
    addSummaryRow("Subtotal", formatCurrency(order.subtotal));
    addSummaryRow("Shipping", formatCurrency(order.shipping_cost));
    addSummaryRow("Tax", formatCurrency(order.tax));
    addSummaryRow("Total", formatCurrency(order.total), true);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Thank you for shopping with TrenchCart.", margin, pageHeight - 8);

    doc.save(`${order.order_number || "invoice"}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="max-w-sm flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Search orders..." />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" className="rounded-full" onClick={downloadSalesReport}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download Sales Report
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_180px_auto] lg:items-end">
          <div>
            <Label>Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear Dates
            </Button>
            <div className="self-center text-xs text-slate-500">
              {filtered.length} matching orders
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Order</th>
                <th className="px-6 py-3 font-medium text-gray-500">Customer</th>
                <th className="px-6 py-3 font-medium text-gray-500">Items</th>
                <th className="px-6 py-3 font-medium text-gray-500">Total</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{order.order_number}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{order.items?.length || 0} items</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4">
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateMutation.mutate({ id: order.id, data: { status: value } })}
                    >
                      <SelectTrigger className="h-8 w-32 rounded-full text-xs">
                        <Badge className={`${statusColors[order.status]} border-0 capitalize`}>{order.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatusOptions.map((status) => (
                          <SelectItem key={status} value={status} className="capitalize">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {order.created_date ? format(new Date(order.created_date), "MMM d, yyyy") : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <ShoppingCart className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                    No orders found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => downloadInvoice(selectedOrder)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              </div>

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-400">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="font-medium">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="font-medium">{getOrderPhone(selectedOrder)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Payment</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method?.replaceAll("_", " ")}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Order Status</p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateMutation.mutate({ id: selectedOrder.id, data: { status: value } })}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl text-sm">
                      <Badge className={`${statusColors[selectedOrder.status]} border-0 capitalize`}>{selectedOrder.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatusOptions.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedOrder.shipping_address ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Shipping Address</p>
                    <p className="text-sm">
                      {[
                        selectedOrder.shipping_address.street,
                        selectedOrder.shipping_address.city,
                        [selectedOrder.shipping_address.state, selectedOrder.shipping_address.zip].filter(Boolean).join(" "),
                        selectedOrder.shipping_address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </>
              ) : null}

              <Separator />
              <div>
                <p className="mb-3 text-sm font-medium">Items</p>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="mb-3 rounded-2xl border border-slate-200 p-4 last:mb-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=50&q=80"}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-gray-400">
                              Qty: {item.quantity} x {formatCurrency(item.price)}
                            </p>
                            {(item.variant_color || item.variant_size || item.variant_sku) ? (
                              <p className="mt-1 text-xs text-gray-400">
                                {[item.variant_color && `Color: ${item.variant_color}`, item.variant_size && `Size: ${item.variant_size}`, item.variant_sku && `SKU: ${item.variant_sku}`]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-sm font-medium">{formatCurrency((item.quantity || 0) * (item.price || 0))}</p>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Item Status</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Update this product separately for return, refund, cancellation, or delivery tracking.
                            </p>
                          </div>
                          <Select
                            value={item.status || "pending"}
                            onValueChange={(value) => {
                              const nextItems = (selectedOrder.items || []).map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, status: value } : entry,
                              );
                              updateMutation.mutate({
                                id: selectedOrder.id,
                                data: { items: nextItems },
                              });
                            }}
                          >
                            <SelectTrigger className="h-10 rounded-xl text-sm">
                              <Badge className={`${statusColors[item.status || "pending"]} border-0 capitalize`}>
                                {item.status || "pending"}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {itemStatusOptions.map((status) => (
                                <SelectItem key={status} value={status} className="capitalize">
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div>
                <Label>Tracking Number</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input defaultValue={selectedOrder.tracking_number || ""} id="tracking" placeholder="Enter tracking number" />
                  <Button
                    onClick={() => {
                      const value = document.getElementById("tracking").value;
                      updateMutation.mutate({ id: selectedOrder.id, data: { tracking_number: value } });
                    }}
                    className="rounded-full"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
