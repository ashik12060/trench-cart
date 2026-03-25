import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, Package } from "lucide-react";
import { toast } from "sonner";
import SearchBar from "@/components/store/SearchBar";
import { buildVariantBarcode, createBarcodeSvgFile, ensureClientBarcodes, generateProductBarcode, normalizeClientBarcode } from "@/lib/barcodes";

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => storeApi.entities.Product.adminList("-created_date"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: () => storeApi.entities.Supplier.list("-createdAt"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success("Product deleted");
    },
  });

  const filtered = products.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase()) ||
    product.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const categoryMap = {};
  categories.forEach((category) => {
    categoryMap[category.id] = category.name;
  });

  const supplierMap = {};
  suppliers.forEach((supplier) => {
    supplierMap[supplier.id] = supplier;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} products total</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-full bg-gray-900 hover:bg-indigo-600"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Product</th>
                <th className="px-6 py-3 font-medium text-gray-500">Category</th>
                <th className="px-6 py-3 font-medium text-gray-500">Supplier</th>
                <th className="px-6 py-3 font-medium text-gray-500">Price</th>
                <th className="px-6 py-3 font-medium text-gray-500">Stock</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const supplier = product.supplier_id ? supplierMap[product.supplier_id] : null;

                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&q=80"}
                          alt=""
                          className="h-10 w-10 rounded-lg bg-gray-100 object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.sku ? <p className="text-xs text-gray-400">SKU: {product.sku}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{categoryMap[product.category_id] || "-"}</td>
                    <td className="px-6 py-4">
                      {product.supplier_available && product.supplier_name ? (
                        <div>
                          <p className="font-medium text-gray-800">{product.supplier_name}</p>
                          <p className="text-xs text-gray-400">
                            {product.supplier_purchase_quantity || 0} units tracked
                            {supplier?.linked_products_count ? ` • ${supplier.linked_products_count} linked products` : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium">${product.price?.toFixed(2)}</span>
                        {product.sale_price ? (
                          <span className="ml-1 text-xs text-red-500">Sale: ${product.sale_price?.toFixed(2)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`border-0 ${
                          product.stock_quantity <= (product.low_stock_threshold || 5)
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.stock_quantity || 0}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`border-0 ${
                          product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.is_active ? "Active" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(product);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(product.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Package className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                    No products found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        product={editing}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}

function ProductFormDialog({ open, onClose, product, categories, suppliers }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  const computeVariantStock = (variants = []) =>
    variants.reduce((sum, variant) => sum + (parseInt(variant?.quantity, 10) || 0), 0);

  const syncStockWithVariants = (variants = [], current = {}) => ({
    ...current,
    variants,
    stock_quantity: computeVariantStock(variants),
  });

  const computeSalePrice = (price, discountPercentage) => {
    const parsedPrice = parseFloat(price) || 0;
    const parsedDiscount = parseFloat(discountPercentage) || 0;
    if (parsedPrice <= 0 || parsedDiscount <= 0) return "";
    return Math.max(parsedPrice - parsedDiscount, 0).toFixed(2);
  };

  React.useEffect(() => {
    if (product) {
      const normalizedProduct = ensureClientBarcodes({
        ...product,
        supplier_available: Boolean(product.supplier_available),
      });
      setForm(syncStockWithVariants(normalizedProduct.variants || [], normalizedProduct));
    } else {
      setForm(ensureClientBarcodes({
        name: "",
        description: "",
        short_description: "",
        price: "",
        sale_price: "",
        discount_amount: 0,
        cost_price: "",
        sku: "",
        category_id: "",
        stock_quantity: 0,
        low_stock_threshold: 5,
        is_active: true,
        is_featured: false,
        brand: "",
        weight: "",
        images: [],
        tags: [],
        variants: [],
        supplier_available: false,
        supplier_id: "",
        supplier_purchase_quantity: 0,
      }));
    }
  }, [product, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = { ...data };
      cleanData.price = parseFloat(cleanData.price) || 0;
      cleanData.discount_amount = parseFloat(cleanData.discount_amount) || 0;
      cleanData.sale_price = cleanData.discount_amount > 0
        ? parseFloat(computeSalePrice(cleanData.price, cleanData.discount_amount)) || null
        : null;
      cleanData.cost_price = cleanData.cost_price ? parseFloat(cleanData.cost_price) : null;
      cleanData.low_stock_threshold = parseInt(cleanData.low_stock_threshold, 10) || 5;
      cleanData.weight = cleanData.weight ? parseFloat(cleanData.weight) : null;
      cleanData.stock_quantity = computeVariantStock(cleanData.variants);
      cleanData.variants = (Array.isArray(cleanData.variants) ? cleanData.variants : []).map((variant) => ({
        sku: variant?.sku || "",
        size: variant?.size || "",
        color: variant?.color || "",
        quantity: parseInt(variant?.quantity, 10) || 0,
        barcode: normalizeClientBarcode(variant?.barcode || ""),
      }));
      cleanData.barcode = normalizeClientBarcode(cleanData.barcode || "");

      const uploadBarcodeImage = async (barcode, publicId, meta = {}) => {
        if (!barcode) return "";
        try {
          const file = await createBarcodeSvgFile(barcode, `${publicId || barcode}.svg`, meta);
          const { file_url } = await storeApi.uploads.image({
            file,
            folder: "digitrench/barcodes",
            publicId,
          });
          return file_url || "";
        } catch (error) {
          console.warn("[barcode] image upload skipped", error);
          return "";
        }
      };

      cleanData.barcode_image_url =
        (await uploadBarcodeImage(cleanData.barcode, cleanData.barcode, {
          title: cleanData.name,
          sku: cleanData.sku,
          kind: "Product",
          quantity: cleanData.stock_quantity,
          price: cleanData.sale_price || cleanData.price,
        })) || cleanData.barcode_image_url || "";
      cleanData.variants = await Promise.all(
        cleanData.variants.map(async (variant) => ({
          ...variant,
          barcode_image_url:
            (await uploadBarcodeImage(variant.barcode, variant.barcode, {
              title: cleanData.name,
              sku: variant.sku || cleanData.sku,
              size: variant.size,
              color: variant.color,
              kind: "Variant",
              quantity: variant.quantity,
              price: cleanData.sale_price || cleanData.price,
            })) || variant.barcode_image_url || "",
        })),
      );

      if (!cleanData.supplier_available) {
        cleanData.supplier_id = "";
        cleanData.supplier_purchase_quantity = 0;
      } else {
        cleanData.supplier_purchase_quantity = cleanData.stock_quantity || 0;
      }

      if (product) {
        return storeApi.entities.Product.update(product.id, cleanData);
      }
      return storeApi.entities.Product.create(cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success(product ? "Product updated" : "Product created");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to save product");
    },
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await storeApi.uploads.image({ file });
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), file_url] }));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, imageIndex) => imageIndex !== index) }));
  };

  const addVariant = () => {
    setForm((prev) => {
      const nextVariant = buildVariantBarcode({ parentBarcode: prev.barcode || generateProductBarcode(prev), index: (prev.variants || []).length });
      const variants = [...(prev.variants || []), { sku: "", size: "", color: "", quantity: 0, barcode: nextVariant }];
      return syncStockWithVariants(variants, prev);
    });
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      variants[index] = { ...variants[index], [field]: value };
      return syncStockWithVariants(variants, prev);
    });
  };

  const removeVariant = (index) => {
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      variants.splice(index, 1);
      const parentBarcode = prev.barcode || generateProductBarcode(prev);
      const syncedVariants = variants.map((variant, variantIndex) => ({
        ...variant,
        barcode: buildVariantBarcode({ parentBarcode, index: variantIndex }),
      }));
      return syncStockWithVariants(syncedVariants, prev);
    });
  };

  const update = (field, value) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "sku" || field === "name") {
        const nextBarcode = generateProductBarcode(next);
        const nextVariants = (next.variants || []).map((variant, index) => ({
          ...variant,
          barcode: buildVariantBarcode({ parentBarcode: nextBarcode, index }),
        }));
        return syncStockWithVariants(nextVariants, { ...next, barcode: nextBarcode });
      }

      return next;
    });
  const regenerateProductFormBarcode = () => setForm((prev) => {
    const nextBarcode = generateProductBarcode(prev);
    const nextVariants = (prev.variants || []).map((variant, index) => ({
      ...variant,
      barcode: buildVariantBarcode({ parentBarcode: nextBarcode, index }),
    }));

    return syncStockWithVariants(nextVariants, { ...prev, barcode: nextBarcode });
  });
  const regenerateVariantFormBarcode = (index) =>
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      variants[index] = {
        ...variants[index],
        barcode: buildVariantBarcode({ parentBarcode: prev.barcode || generateProductBarcode(prev), index }),
      };
      return syncStockWithVariants(variants, prev);
    });

  const selectedSupplier = suppliers.find((supplier) => supplier.id === form.supplier_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate(form);
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Product Name *</Label>
              <Input required value={form.name || ""} onChange={(e) => update("name", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku || ""} onChange={(e) => update("sku", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Barcode Tracking</p>
                <p className="mt-1 text-xs text-slate-500">
                  Product barcodes use the format TC + year + SKU-based code + random digits. Variant barcodes inherit the parent code and add A, B, C, D and more.
                </p>
              </div>
              <Button type="button" variant="outline" className="rounded-full" onClick={regenerateProductFormBarcode}>
                Regenerate Product Barcode
              </Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label>Product Barcode</Label>
                <Input value={form.barcode || ""} readOnly className="mt-1.5 bg-white" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Barcode image will be saved to Cloudinary after save
              </div>
            </div>
          </div>

          <div>
            <Label>Short Description</Label>
            <Input value={form.short_description || ""} onChange={(e) => update("short_description", e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} className="mt-1.5 h-24" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Price *</Label>
              <Input type="number" step="0.01" required value={form.price || ""} onChange={(e) => update("price", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Cost Price</Label>
              <Input type="number" step="0.01" value={form.cost_price || ""} onChange={(e) => update("cost_price", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-950">Discount Section</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Add a discount percentage and the storefront will show the old price crossed out with the new price and discount badge.
                </p>
              </div>
              {(parseFloat(form.discount_amount) || 0) > 0 ? (
                <Badge className="border-0 bg-emerald-600 text-white">
                  {form.price > 0
                    ? `${Math.round(((parseFloat(form.discount_amount) || 0) / (parseFloat(form.price) || 1)) * 100)}% OFF`
                    : "Discount"}
                </Badge>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <Label>Discount Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount_amount ?? 0}
                  onChange={(e) => update("discount_amount", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>New Price</Label>
                <Input
                  type="number"
                  value={computeSalePrice(form.price, form.discount_amount)}
                  readOnly
                  className="mt-1.5 bg-white"
                />
              </div>
              <div>
                <Label>Discount Percentage</Label>
                <Input
                  type="text"
                  value={
                    (parseFloat(form.discount_amount) || 0) > 0 && (parseFloat(form.price) || 0) > 0
                      ? `${Math.round(((parseFloat(form.discount_amount) || 0) / (parseFloat(form.price) || 1)) * 100)}%`
                      : "0%"
                  }
                  readOnly
                  className="mt-1.5 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category_id || ""} onValueChange={(value) => update("category_id", value)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input type="number" value={form.stock_quantity ?? 0} readOnly className="mt-1.5 bg-gray-50" />
            </div>
            <div>
              <Label>Low Stock Alert</Label>
              <Input type="number" value={form.low_stock_threshold ?? 5} onChange={(e) => update("low_stock_threshold", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Brand</Label>
              <Input value={form.brand || ""} onChange={(e) => update("brand", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.01" value={form.weight || ""} onChange={(e) => update("weight", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={(value) => update("is_active", value)} />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_featured ?? false} onCheckedChange={(value) => update("is_featured", value)} />
              <Label>Featured</Label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="supplier_available"
                    checked={Boolean(form.supplier_available)}
                    onCheckedChange={(checked) => {
                      const enabled = checked === true;
                      setForm((prev) => ({
                        ...prev,
                        supplier_available: enabled,
                        supplier_id: enabled ? prev.supplier_id || "" : "",
                        supplier_purchase_quantity: enabled ? prev.stock_quantity || 0 : 0,
                      }));
                    }}
                  />
                  <Label htmlFor="supplier_available" className="font-semibold text-slate-900">
                    Supplier Available
                  </Label>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Enable this when the product is sourced from a tracked supplier and you want purchase totals recorded.
                </p>
              </div>
              {selectedSupplier ? (
                <div className="rounded-xl border bg-white px-4 py-3 text-sm">
                  <p className="font-medium text-slate-900">{selectedSupplier.supplier_name}</p>
                  <p className="text-slate-500">
                    {selectedSupplier.linked_products_count || 0} linked products • {selectedSupplier.purchased_units_total || 0} units purchased
                  </p>
                </div>
              ) : null}
            </div>

            {form.supplier_available ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Supplier List</Label>
                  <Select value={form.supplier_id || ""} onValueChange={(value) => update("supplier_id", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={suppliers.length ? "Choose supplier" : "No suppliers yet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name} {supplier.supplier_code ? `(${supplier.supplier_code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {suppliers.length === 0 ? (
                    <p className="mt-2 text-xs text-amber-600">
                      Add a supplier from the Suppliers page first to use tracking here.
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label>Purchased Quantity</Label>
                  <Input type="number" value={form.stock_quantity ?? 0} readOnly className="mt-1.5 bg-gray-50" />
                  <p className="mt-2 text-xs text-slate-500">
                    This is calculated automatically from the total quantity across all variants.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Variants</p>
                <p className="text-xs text-gray-400">Size/color combinations with per-variant stock and barcode labels.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="gap-2 text-sm" onClick={addVariant}>
                <Plus className="h-4 w-4" />
                Add variant
              </Button>
            </div>
            {!form.variants || form.variants.length === 0 ? (
              <p className="text-sm text-gray-500">No variants yet. Add one to track size/color stock separately.</p>
            ) : (
              <div className="space-y-3">
                {form.variants.map((variant, index) => (
                  <div key={`variant-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="grid items-end gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_1.2fr_auto]">
                      <div>
                        <Label>Size</Label>
                        <Input value={variant.size || ""} onChange={(e) => updateVariant(index, "size", e.target.value)} placeholder="e.g. M, 9, 32" className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input value={variant.color || ""} onChange={(e) => updateVariant(index, "color", e.target.value)} placeholder="e.g. Black" className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input type="number" value={variant.quantity ?? ""} onChange={(e) => updateVariant(index, "quantity", e.target.value)} className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label>SKU (optional)</Label>
                        <Input value={variant.sku || ""} onChange={(e) => updateVariant(index, "sku", e.target.value)} className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label>Variant Barcode</Label>
                        <Input
                          value={variant.barcode || ""}
                          readOnly
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div className="flex gap-1 xl:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => regenerateVariantFormBarcode(index)}
                          className="rounded-full px-3 text-xs"
                        >
                          Refresh
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeVariant(index)} className="h-9 w-9 rounded-full">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      This barcode is used in the admin barcode print page for this exact size and color combination.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Images</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {form.images?.map((image, index) => (
                <div key={index} className="group relative h-20 w-20 overflow-hidden rounded-xl">
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-gray-400">
                <Upload className="h-5 w-5 text-gray-400" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {uploading ? <p className="mt-1 text-xs text-gray-400">Uploading...</p> : null}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="rounded-full bg-gray-900 hover:bg-indigo-600">
              {saveMutation.isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
