import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, RefreshCw, ScanLine } from "lucide-react";
import { storeApi } from "@/api/storeClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BarcodeLabel from "@/components/admin/BarcodeLabel";

const buildBarcodeEntries = (products = []) =>
  products.flatMap((product) => {
    const unitPrice = Number(product.sale_price || product.price || 0);
    const entries = [];

    if (product.barcode) {
      entries.push({
        id: `product-${product.id}`,
        kind: "product",
        barcode: product.barcode,
        barcodeImageUrl: product.barcode_image_url || "",
        title: product.name || "Untitled Product",
        sku: product.sku || "",
        quantity: Number(product.stock_quantity || 0),
        price: unitPrice,
      });
    }

    (Array.isArray(product.variants) ? product.variants : []).forEach((variant, index) => {
      if (!variant?.barcode) return;
      entries.push({
        id: `variant-${product.id}-${index}`,
        kind: "variant",
        barcode: variant.barcode,
        barcodeImageUrl: variant.barcode_image_url || "",
        title: product.name || "Untitled Product",
        sku: variant.sku || product.sku || "",
        size: variant.size || "",
        color: variant.color || "",
        quantity: Number(variant.quantity || 0),
        price: unitPrice,
      });
    });

    return entries;
  });

export default function AdminBarcodes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [labelType, setLabelType] = React.useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => storeApi.entities.Product.adminList("-created_date"),
  });

  const generateMutation = useMutation({
    mutationFn: () => storeApi.entities.Product.generateBarcodes(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`Barcode sync complete. ${result?.updated || 0} products updated.`);
    },
    onError: (error) => {
      toast.error(error.message || "Unable to generate barcodes");
    },
  });

  const entries = React.useMemo(() => buildBarcodeEntries(products), [products]);

  const filtered = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return entries.filter((entry) => {
      if (labelType !== "all" && entry.kind !== labelType) return false;
      if (!normalizedSearch) return true;

      return [
        entry.barcode,
        entry.title,
        entry.sku,
        entry.size,
        entry.color,
        entry.kind,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [entries, labelType, search]);

  const totalVisibleUnits = filtered.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
          }

          .barcode-print-controls,
          .barcode-print-header {
            display: none !important;
          }

          .barcode-print-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(3in, 3in)) !important;
            gap: 0.15in !important;
          }

          .barcode-label-card {
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
            width: 3in !important;
            height: 2in !important;
            padding: 0.12in !important;
          }
        }
      `}</style>

      <div className="barcode-print-header flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            <ScanLine className="h-3.5 w-3.5" />
            Barcode Center
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Search, manage, and print barcode labels</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Print barcode images for products and variants so your team can track stock by size, color, and quantity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            {generateMutation.isPending ? "Syncing..." : "Generate Missing Barcodes"}
          </Button>
          <Button type="button" className="rounded-full bg-slate-900 hover:bg-slate-700" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Visible Labels
          </Button>
        </div>
      </div>

      <div className="barcode-print-controls grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.6fr_220px_auto_auto] lg:items-end">
        <div>
          <Label>Search barcode</Label>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by barcode, product name, SKU, size, or color"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Label type</Label>
          <Select value={labelType} onValueChange={setLabelType}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All labels</SelectItem>
              <SelectItem value="product">Product only</SelectItem>
              <SelectItem value="variant">Variant only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible Labels</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tracked Units</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{totalVisibleUnits}</p>
        </div>
      </div>

      <div className="barcode-print-controls flex flex-wrap gap-2">
        <Badge className="border-0 bg-slate-900 text-white">{products.length} products loaded</Badge>
        <Badge className="border border-slate-200 bg-white text-slate-700">{entries.filter((entry) => entry.kind === "product").length} product labels</Badge>
        <Badge className="border border-slate-200 bg-white text-slate-700">{entries.filter((entry) => entry.kind === "variant").length} variant labels</Badge>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
          Loading barcode labels...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-900">No barcode labels found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another search, change the label type, or generate missing barcodes for older products.
          </p>
        </div>
      ) : (
        <div className="barcode-print-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <BarcodeLabel key={entry.id} {...entry} />
          ))}
        </div>
      )}
    </div>
  );
}
