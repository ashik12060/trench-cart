import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown, TrendingUp, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import StatsCard from "@/components/admin/StatsCard";
import SearchBar from "@/components/store/SearchBar";

const getVariantSummary = (product) => {
  if (!Array.isArray(product?.variants) || product.variants.length === 0) {
    return ["No size/color variants"];
  }

  return product.variants.map((variant) =>
    [
      variant.size ? `Size: ${variant.size}` : "",
      variant.color ? `Color: ${variant.color}` : "",
      `Qty: ${Number(variant.quantity || 0)}`,
    ]
      .filter(Boolean)
      .join(" | "),
  );
};

export default function AdminInventory() {
  const [search, setSearch] = useState("");
  const deferredSearch = React.useDeferredValue(search);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products", "inventory"],
    queryFn: () =>
      storeApi.entities.Product.adminList(
        "-created_date",
        undefined,
        "name,sku,category_id,images,price,sale_price,stock_quantity,low_stock_threshold,variants",
      ),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list("-created_date"),
  });

  const categoryMap = React.useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categories]);

  const totals = React.useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0);
    const lowStock = products.filter(
      (product) => Number(product.stock_quantity || 0) <= Number(product.low_stock_threshold || 5) && Number(product.stock_quantity || 0) > 0,
    );
    const outOfStock = products.filter((product) => Number(product.stock_quantity || 0) <= 0);
    return { totalStock, lowStock, outOfStock };
  }, [products]);

  const filtered = React.useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q),
    );
  }, [deferredSearch, products]);

  const filteredTotals = React.useMemo(() => {
    const filteredTotalStock = filtered.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0);
    const filteredTotalValue = filtered.reduce(
      (sum, product) => sum + (Number(product.sale_price || product.price || 0) * Number(product.stock_quantity || 0)),
      0,
    );
    return { filteredTotalStock, filteredTotalValue };
  }, [filtered]);

  const downloadStockReport = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const reportLowStock = filtered.filter(
      (product) => Number(product.stock_quantity || 0) <= Number(product.low_stock_threshold || 5) && Number(product.stock_quantity || 0) > 0,
    );
    const reportOutOfStock = filtered.filter((product) => Number(product.stock_quantity || 0) <= 0);
    let y = margin;

    const ensureSpace = (height = 20) => {
      if (y + height > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const drawStatCard = (x, top, width, label, value, tone = "slate") => {
      const tones = {
        slate: { fill: [248, 250, 252], border: [226, 232, 240], label: [100, 116, 139], value: [15, 23, 42] },
        amber: { fill: [255, 251, 235], border: [253, 230, 138], label: [180, 83, 9], value: [120, 53, 15] },
        red: { fill: [254, 242, 242], border: [254, 202, 202], label: [185, 28, 28], value: [127, 29, 29] },
      };
      const palette = tones[tone] || tones.slate;
      doc.setFillColor(...palette.fill);
      doc.setDrawColor(...palette.border);
      doc.roundedRect(x, top, width, 58, 8, 8, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...palette.label);
      doc.text(label, x + 12, top + 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...palette.value);
      doc.text(String(value), x + 12, top + 42);
    };

    const columns = [
      { label: "SL", width: 28, align: "left" },
      { label: "Product", width: 180, align: "left" },
      { label: "Size / Color Stock", width: 245, align: "left" },
      { label: "Price", width: 55, align: "left" },
      { label: "Current Stock", width: 60, align: "left" },
      { label: "Total Value", width: 70, align: "left" },
      { label: "Stock Status", width: 64, align: "left" },
    ];

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 76, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Product Stock Report", margin + 18, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("MegaMart Inventory", margin + 18, y + 50);
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy h:mm a")}`, pageWidth - margin - 18, y + 30, { align: "right" });
    doc.text(`Search Scope: ${search || "All inventory items"}`, pageWidth - margin - 18, y + 50, { align: "right" });
    y += 96;

    const cardGap = 14;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    drawStatCard(margin, y, cardWidth, "Visible Products", filtered.length, "slate");
    drawStatCard(margin + cardWidth + cardGap, y, cardWidth, "Low Stock", reportLowStock.length, "amber");
    drawStatCard(margin + (cardWidth + cardGap) * 2, y, cardWidth, "Out of Stock", reportOutOfStock.length, "red");
    y += 82;

    ensureSpace(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Inventory Breakdown", margin, y);
    y += 18;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 24, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    let x = margin + 8;
    columns.forEach((column) => {
      const textX = column.align === "right" ? x + column.width - 6 : x;
      doc.text(column.label, textX, y + 16, { align: column.align === "right" ? "right" : "left" });
      x += column.width;
    });
    y += 34;

    filtered.forEach((product, index) => {
      const stock = Number(product.stock_quantity || 0);
      const unitPrice = Number(product.sale_price || product.price || 0);
      const totalValue = unitPrice * stock;
      const threshold = Number(product.low_stock_threshold || 5);
      const status = stock <= 0 ? "Out of Stock" : stock <= threshold ? "Low Stock" : "In Stock";
      const statusColor =
        status === "Out of Stock"
          ? [127, 29, 29]
          : status === "Low Stock"
            ? [120, 53, 15]
            : [22, 101, 52];
      const rowValues = [
        String(index + 1),
        [product.name || "-", product.sku ? `SKU: ${product.sku}` : "", categoryMap[product.category_id] ? `Category: ${categoryMap[product.category_id]}` : ""].filter(Boolean).join("\n"),
        getVariantSummary(product).join("\n"),
        `$${unitPrice.toFixed(2)}`,
        String(stock),
        `$${totalValue.toFixed(2)}`,
        status,
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lineCounts = rowValues.map((value, index) =>
        doc.splitTextToSize(String(value), columns[index].width - 10).length,
      );
      const rowHeight = Math.max(28, Math.max(...lineCounts) * 12);
      ensureSpace(rowHeight + 8);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 6, pageWidth - margin, y - 6);

      x = margin + 8;
      rowValues.forEach((value, index) => {
        const column = columns[index];
        const lines = doc.splitTextToSize(String(value), column.width - 10);
        if (index === 6) {
          doc.setTextColor(...statusColor);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
        }
        const textX = column.align === "right" ? x + column.width - 6 : x;
        doc.text(lines, textX, y + 4, { align: column.align === "right" ? "right" : "left" });
        x += column.width;
      });

      y += rowHeight;
    });

    if (filtered.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text("No products match the current inventory search.", margin, y + 6);
      y += 24;
    } else {
      ensureSpace(30);
      doc.setDrawColor(148, 163, 184);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const totalColumnsWidth = columns.reduce((sum, column) => sum + column.width, 0);
      const tableRight = margin + 8 + totalColumnsWidth;
      let totalsX = margin + 8;
      doc.text("Grand Totals", totalsX, y);
      totalsX += columns[0].width + columns[1].width + columns[2].width + columns[3].width;
      doc.text(String(filteredTotals.filteredTotalStock), totalsX, y);
      totalsX += columns[4].width;
      doc.text(`$${filteredTotals.filteredTotalValue.toFixed(2)}`, totalsX, y);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y + 10, tableRight, y + 10);
      y += 10;
    }

    ensureSpace(26);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("This report reflects the products currently visible in the inventory view, including size, color, and quantity-based stock.", margin, y);

    doc.save(`product-stock-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage your product stock levels</p>
        </div>
        <Button type="button" variant="outline" className="rounded-full" onClick={downloadStockReport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download Stock Report
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total Items" value={totals.totalStock} icon={Package} color="indigo" index={0} />
        <StatsCard title="Products" value={products.length} icon={TrendingUp} color="green" index={1} />
        <StatsCard title="Low Stock" value={totals.lowStock.length} subtitle="Below threshold" icon={TrendingDown} color="amber" index={2} />
        <StatsCard title="Out of Stock" value={totals.outOfStock.length} subtitle="Need restocking" icon={AlertTriangle} color="red" index={3} />
      </div>

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Search inventory..." />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">SL</th>
                <th className="px-6 py-3 font-medium text-gray-500">Product</th>
                <th className="px-6 py-3 font-medium text-gray-500">Size / Color Stock</th>
                <th className="px-6 py-3 font-medium text-gray-500">Price</th>
                <th className="px-6 py-3 font-medium text-gray-500">Current Stock</th>
                <th className="px-6 py-3 font-medium text-gray-500">Total Value</th>
                <th className="px-6 py-3 font-medium text-gray-500"> Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, index) => {
                const stockQuantity = Number(product.stock_quantity || 0);
                const threshold = Number(product.low_stock_threshold || 5);
                const isLow = stockQuantity <= threshold && stockQuantity > 0;
                const isOut = stockQuantity <= 0;
                const unitPrice = Number(product.sale_price || product.price || 0);
                const totalValue = unitPrice * stockQuantity;

                return (
                  <tr key={product.id} className={`border-b last:border-0 hover:bg-gray-50 ${isOut ? "bg-red-50/30" : isLow ? "bg-amber-50/30" : ""}`}>
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&q=80"}
                          alt=""
                          className="h-10 w-10 rounded-lg bg-gray-100 object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-400">
                            {product.sku || "No SKU"} • {categoryMap[product.category_id] || "Uncategorized"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="space-y-1">
                        {getVariantSummary(product).map((line) => (
                          <p key={`${product.id}-${line}`} className="text-xs leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">${unitPrice.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-lg font-bold">{stockQuantity}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${totalValue.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {isOut ? (
                        <Badge className="border-0 bg-red-100 text-red-700">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge className="border-0 bg-amber-100 text-amber-700">Low Stock</Badge>
                      ) : (
                        <Badge className="border-0 bg-green-100 text-green-700">In Stock</Badge>
                      )}
                    </td>
                    
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : null}
            </tbody>
            {filtered.length > 0 ? (
              <tfoot>
                <tr className="bg-indigo-600">
                  <td className="px-6 py-4 font-semibold text-white" colSpan={4}>
                    Grand Totals
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">{filteredTotals.filteredTotalStock}</td>
                  <td className="px-6 py-4 font-semibold text-white">${filteredTotals.filteredTotalValue.toFixed(2)}</td>
                  
                  <td className="px-6 py-4 font-semibold text-white"></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}
