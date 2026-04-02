import jsPDF from "jspdf";
import { format } from "date-fns";

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value, pattern = "MMM d, yyyy") => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : format(date, pattern);
};

export const downloadOrderInvoice = (order) => {
  if (!order) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const phone = order.customer_phone || order.shipping_address?.phone || "-";
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
    doc.text(formatCurrency((item.quantity || 0) * (item.price || 0)), pageWidth - margin, y + 3, {
      align: "right",
    });

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
  doc.text(formatDate(order.created_date), pageWidth - margin - 6, y + 20, { align: "right" });
  y += 38;

  const blockTop = y;
  drawCard(margin, blockTop, 84, 34);
  drawCard(margin + 90, blockTop, 92, 34);

  const billToEnd = drawBlock(
    "Bill To",
    [order.customer_name || "-", order.customer_email || "-", phone],
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
