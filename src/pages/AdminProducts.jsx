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
import { Plus, Pencil, Trash2, Upload, Package, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import SearchBar from "@/components/store/SearchBar";
import { getProductPrimaryImage } from "@/utils/productImages";
import { getCategoryById, getCategoryLineage, getRootCategories, getSubcategoriesByParent } from "@/utils/categoryTree";
import { buildVariantBarcode, createBarcodeSvgFile, ensureClientBarcodes, generateProductBarcode, normalizeClientBarcode } from "@/lib/barcodes";

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => storeApi.entities.Product.adminList("-created_date"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list("sort_order"),
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
  const subcategoryMap = {};
  categories.forEach((category) => {
    if (category.parent_category_id) {
      subcategoryMap[category.id] = category.name;
    }
  });

  const rootCategories = getRootCategories(categories);

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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImport(true)}
            className="rounded-full"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
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
                          src={getProductPrimaryImage(product, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&q=80")}
                          alt=""
                          className="h-10 w-10 rounded-lg bg-gray-100 object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.sku ? <p className="text-xs text-gray-400">SKU: {product.sku}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="space-y-0.5">
                        <p>{categoryMap[product.category_id] || "-"}</p>
                        {product.subcategory_id ? (
                          <p className="text-xs text-gray-400">
                            {subcategoryMap[product.subcategory_id] || product.subcategory_id}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.supplier_available && product.supplier_name ? (
                        <div>
                          <p className="font-medium text-gray-800">{product.supplier_name}</p>
                          <p className="text-xs text-gray-400">
                            {product.supplier_purchase_quantity || 0} units tracked
                            {supplier?.linked_products_count ? ` | ${supplier.linked_products_count} linked products` : ""}
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
        rootCategories={rootCategories}
        suppliers={suppliers}
      />

      <ProductCsvImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        categories={categories}
      />
    </div>
  );
}

function ProductFormDialog({ open, onClose, product, categories, rootCategories, suppliers }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  const computeVariantStock = (variants = []) =>
    variants.reduce((sum, variant) => sum + (parseInt(variant?.quantity, 10) || 0), 0);

  const normalizeImageList = (images = []) =>
    (Array.isArray(images) ? images : [])
      .map((image) => String(image || "").trim())
      .filter(Boolean);

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
      setForm({
        ...syncStockWithVariants(normalizedProduct.variants || [], normalizedProduct),
        images: normalizeImageList(normalizedProduct.images),
        subcategory_id: normalizedProduct.subcategory_id || "",
      });
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
        subcategory_id: "",
        sub_subcategory_id: "",
        stock_quantity: 0,
        low_stock_threshold: 5,
        delivery_days: 0,
        is_active: true,
        is_featured: false,
        brand: "",
        weight: "",
        tags: [],
        images: [],
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
      cleanData.delivery_days = Math.max(0, parseInt(cleanData.delivery_days, 10) || 0);
      cleanData.weight = cleanData.weight ? parseFloat(cleanData.weight) : null;
      cleanData.stock_quantity = computeVariantStock(cleanData.variants);
      cleanData.images = normalizeImageList(cleanData.images);
      cleanData.subcategory_id = String(cleanData.subcategory_id || "").trim();
      cleanData.sub_subcategory_id = String(cleanData.sub_subcategory_id || "").trim();
      if (!cleanData.subcategory_id) {
        throw new Error("Please select a subcategory for this product.");
      }
      cleanData.variants = (Array.isArray(cleanData.variants) ? cleanData.variants : []).map((variant) => ({
        sku: variant?.sku || "",
        size: variant?.size || "",
        color: variant?.color || "",
        quantity: parseInt(variant?.quantity, 10) || 0,
        images: Array.isArray(variant?.images)
          ? variant.images.map((image) => String(image || "").trim()).filter(Boolean)
          : [],
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

  const handleVariantImageUpload = async (variantIndex, event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await storeApi.uploads.image({ file });
        if (file_url) uploadedUrls.push(file_url);
      }
      if (uploadedUrls.length > 0) {
        setForm((prev) => {
          const variants = [...(prev.variants || [])];
          const currentImages = Array.isArray(variants[variantIndex]?.images) ? variants[variantIndex].images : [];
          variants[variantIndex] = {
            ...variants[variantIndex],
            images: [...currentImages, ...uploadedUrls].filter(Boolean),
          };
          return syncStockWithVariants(variants, prev);
        });
      }
    } catch (error) {
      toast.error(error.message || "Unable to upload variant image");
    } finally {
      event.target.value = "";
    }
  };

  const addProductImage = () => {
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), ""],
    }));
  };

  const updateProductImage = (imageIndex, value) => {
    setForm((prev) => {
      const images = [...(prev.images || [])];
      images[imageIndex] = value;
      return {
        ...prev,
        images,
      };
    });
  };

  const removeProductImage = (imageIndex) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== imageIndex),
    }));
  };

  const handleProductImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await storeApi.uploads.image({ file });
        if (file_url) uploadedUrls.push(file_url);
      }
      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls].filter(Boolean),
        }));
      }
    } catch (error) {
      toast.error(error.message || "Unable to upload product image");
    } finally {
      event.target.value = "";
    }
  };

  const copyMediaLink = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Media link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      const currentImages = Array.isArray(variants[variantIndex]?.images) ? variants[variantIndex].images : [];
      variants[variantIndex] = {
        ...variants[variantIndex],
        images: currentImages.filter((_, idx) => idx !== imageIndex),
      };
      return syncStockWithVariants(variants, prev);
    });
  };

  const addVariantImage = (variantIndex) => {
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      const currentImages = Array.isArray(variants[variantIndex]?.images) ? variants[variantIndex].images : [];
      variants[variantIndex] = {
        ...variants[variantIndex],
        images: [...currentImages, ""],
      };
      return syncStockWithVariants(variants, prev);
    });
  };

  const updateVariantImage = (variantIndex, imageIndex, value) => {
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      const currentImages = Array.isArray(variants[variantIndex]?.images) ? variants[variantIndex].images : [];
      currentImages[imageIndex] = value;
      variants[variantIndex] = {
        ...variants[variantIndex],
        images: currentImages,
      };
      return syncStockWithVariants(variants, prev);
    });
  };

  const addVariant = () => {
    setForm((prev) => {
      const nextVariant = buildVariantBarcode({ parentBarcode: prev.barcode || generateProductBarcode(prev), index: (prev.variants || []).length });
      const variants = [...(prev.variants || []), { sku: "", size: "", color: "", quantity: 0, images: [], barcode: nextVariant }];
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
  const selectedLeafCategory = getCategoryById(categories, form.sub_subcategory_id || form.subcategory_id || "");
  const selectedLineage = getCategoryLineage(categories, form.sub_subcategory_id || form.subcategory_id || "");
  const selectedRootCategory = selectedLineage[0] || null;
  const selectedSubcategory = selectedLineage[1] || null;
  const selectedSubsubcategory = selectedLineage[2] || null;
  const selectedCategoryId = String(form.category_id || selectedRootCategory?.id || "").trim();
  const availableSubcategories = selectedCategoryId
    ? getSubcategoriesByParent(categories, selectedCategoryId).filter((category) => category.is_active !== false)
    : [];
  const availableSubsubcategories = selectedSubcategory?.id
    ? getSubcategoriesByParent(categories, selectedSubcategory.id).filter((category) => category.is_active !== false)
    : [];
  const derivedCategoryId = selectedRootCategory?.id || selectedCategoryId;
  const derivedSubcategoryId = form.subcategory_id || selectedSubcategory?.id || (selectedLeafCategory && !selectedSubsubcategory ? selectedLeafCategory.id : "");

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

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Media</p>
                <p className="mt-1 text-xs text-slate-500">
                  Add images by upload or paste links. Every uploaded file becomes a media URL you can copy and reuse.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={addProductImage}>
                  Add media link
                </Button>
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
                  <Upload className="h-4 w-4" />
                  <span>Upload media</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleProductImageUpload} />
                </label>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(form.images || []).length === 0 ? (
                <p className="text-sm text-slate-500">No product images yet.</p>
              ) : (
                (form.images || []).map((image, imageIndex) => (
                  <div key={`product-image-${imageIndex}`} className="grid gap-3 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-white text-[10px] text-slate-400">
                      {image ? (
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>Preview</span>
                      )}
                    </div>
                    <Input
                      value={image || ""}
                      onChange={(e) => updateProductImage(imageIndex, e.target.value)}
                      placeholder="Paste media URL"
                      className="bg-white"
                    />
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => copyMediaLink(image)} className="rounded-full px-3 text-xs">
                        Copy link
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeProductImage(imageIndex)} className="h-9 w-9 rounded-full">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
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

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Category</Label>
              <Select
                value={derivedCategoryId || ""}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    category_id: value,
                    subcategory_id: "",
                    sub_subcategory_id: "",
                  }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {rootCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategory *</Label>
              <Select
                value={derivedSubcategoryId || ""}
                onValueChange={(value) => {
                  const nextSubcategory = categories.find((category) => String(category.id) === String(value));
                  setForm((prev) => ({
                    ...prev,
                    subcategory_id: value,
                    sub_subcategory_id: "",
                    category_id: nextSubcategory?.parent_category_id || prev.category_id || "",
                  }));
                }}
                disabled={!selectedCategoryId || availableSubcategories.length === 0}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={selectedCategoryId ? "Select" : "Choose category first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategoryId && availableSubcategories.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No subcategories found for this category yet.
                </p>
              ) : !selectedCategoryId ? (
                <p className="mt-2 text-xs text-slate-500">
                  Choose a category first, then pick a subcategory.
                </p>
              ) : null}
            </div>
            <div>
              <Label>Sub-subcategory</Label>
              <Select
                value={form.sub_subcategory_id || selectedSubsubcategory?.id || ""}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    sub_subcategory_id: value,
                    category_id: selectedCategoryId || prev.category_id || "",
                  }))
                }
                disabled={!selectedSubcategory?.id || availableSubsubcategories.length === 0}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={selectedSubcategory?.id ? "Optional" : "Choose subcategory first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubsubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubcategory?.id && availableSubsubcategories.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No sub-subcategories found under this subcategory.
                </p>
              ) : !selectedSubcategory?.id ? (
                <p className="mt-2 text-xs text-slate-500">
                  Pick a subcategory first if you want a third level.
                </p>
              ) : null}
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
            <div>
              <Label>Delivery in Days</Label>
              <Input
                type="number"
                min="0"
                value={form.delivery_days ?? 0}
                onChange={(e) => update("delivery_days", e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">
                The admin order due date will be calculated from the order date using this number of days.
              </p>
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
                    {selectedSupplier.linked_products_count || 0} linked products | {selectedSupplier.purchased_units_total || 0} units purchased
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
                    <div className="mt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Variant Media</p>
                          <p className="text-xs text-slate-500">Upload one or more files or paste links for this exact variant.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" className="rounded-full" onClick={() => addVariantImage(index)}>
                            Add media link
                          </Button>
                          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
                            <Upload className="h-4 w-4" />
                            <span>Upload media</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleVariantImageUpload(index, event)} />
                          </label>
                        </div>
                      </div>
                      <div className="mt-3 space-y-3">
                        {(variant.images || []).length === 0 ? (
                          <p className="text-sm text-slate-500">No variant images yet.</p>
                        ) : (
                          (variant.images || []).map((image, imageIndex) => (
                            <div key={`${index}-${imageIndex}`} className="grid gap-3 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center">
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-white text-[10px] text-slate-400">
                                {image ? (
                                  <img src={image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span>Preview</span>
                                )}
                              </div>
                              <Input
                                value={image || ""}
                                onChange={(e) => updateVariantImage(index, imageIndex, e.target.value)}
                                placeholder="Paste media URL"
                                className="bg-white"
                              />
                              <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => copyMediaLink(image)} className="rounded-full px-3 text-xs">
                                  Copy link
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariantImage(index, imageIndex)} className="h-9 w-9 rounded-full">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
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

const CSV_TEMPLATE_COLUMNS = [
  "name",
  "sku",
  "category_id",
  "subcategory_id",
  "price",
  "sale_price",
  "discount_amount",
  "cost_price",
  "stock_quantity",
  "low_stock_threshold",
  "delivery_days",
  "is_active",
  "is_featured",
  "brand",
  "weight",
  "short_description",
  "description",
  "supplier_available",
  "supplier_id",
  "supplier_purchase_quantity",
  "tags",
  "images",
  "variants",
];

const createCsvTemplate = () =>
  Papa.unparse([
    {
      name: "Classic T-Shirt",
      sku: "TSH-001",
      category_id: "category-id-here",
      subcategory_id: "",
      price: 25,
      sale_price: "",
      discount_amount: "",
      cost_price: 12,
      stock_quantity: 0,
      low_stock_threshold: 5,
      delivery_days: 4,
      is_active: true,
      is_featured: false,
      brand: "TrenchCart",
      weight: 0.25,
      short_description: "Soft cotton everyday shirt",
      description: "Use this row as a template for CSV imports.",
      supplier_available: false,
      supplier_id: "",
      supplier_purchase_quantity: 0,
      tags: "shirt|cotton|basic",
      images: "https://example.com/image-1.jpg|https://example.com/image-2.jpg",
      variants:
        '[{"sku":"TSH-001-BLK-M","size":"M","color":"Black","quantity":10,"images":["https://example.com/variant-1.jpg"]}]',
    },
  ], {
    columns: CSV_TEMPLATE_COLUMNS,
    quotes: true,
    header: true,
  });

const parseBooleanCell = (value, fallback = false) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "inactive"].includes(normalized)) return false;
  return fallback;
};

const parseNumberCell = (value, fallback = 0) => {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseListCell = (value) =>
  String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const parseVariantsCell = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((variant) => ({
      sku: String(variant?.sku || "").trim(),
      size: String(variant?.size || "").trim(),
      color: String(variant?.color || "").trim(),
      quantity: parseNumberCell(variant?.quantity, 0),
      images: Array.isArray(variant?.images)
        ? variant.images.map((image) => String(image || "").trim()).filter(Boolean)
        : parseListCell(variant?.images),
      barcode: String(variant?.barcode || "").trim(),
      barcode_image_url: String(variant?.barcode_image_url || "").trim(),
    }));
  } catch {
    return [];
  }
};

const normalizeImportedRow = (row) => ({
  name: String(row?.name || "").trim(),
  sku: String(row?.sku || "").trim(),
  category_id: String(row?.category_id || "").trim(),
  subcategory_id: String(row?.subcategory_id || "").trim(),
  price: parseNumberCell(row?.price, 0),
  sale_price: row?.sale_price === "" || row?.sale_price === null || row?.sale_price === undefined
    ? null
    : parseNumberCell(row?.sale_price, null),
  discount_amount: parseNumberCell(row?.discount_amount, 0),
  cost_price: row?.cost_price === "" || row?.cost_price === null || row?.cost_price === undefined
    ? null
    : parseNumberCell(row?.cost_price, null),
  stock_quantity: parseNumberCell(row?.stock_quantity, 0),
  low_stock_threshold: parseNumberCell(row?.low_stock_threshold, 5),
  delivery_days: parseNumberCell(row?.delivery_days, 0),
  is_active: parseBooleanCell(row?.is_active, true),
  is_featured: parseBooleanCell(row?.is_featured, false),
  brand: String(row?.brand || "").trim(),
  weight: row?.weight === "" || row?.weight === null || row?.weight === undefined
    ? null
    : parseNumberCell(row?.weight, null),
  short_description: String(row?.short_description || "").trim(),
  description: String(row?.description || "").trim(),
  supplier_available: parseBooleanCell(row?.supplier_available, false),
  supplier_id: String(row?.supplier_id || "").trim(),
  supplier_purchase_quantity: parseNumberCell(row?.supplier_purchase_quantity, 0),
  tags: parseListCell(row?.tags),
  images: parseListCell(row?.images),
  variants: parseVariantsCell(row?.variants),
  barcode: String(row?.barcode || "").trim(),
  barcode_image_url: String(row?.barcode_image_url || "").trim(),
});

function ProductCsvImportDialog({ open, onClose, categories }) {
  const queryClient = useQueryClient();
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (!open) {
      setSelectedFileName("");
      setPreviewRows([]);
      setParseError("");
      setIsParsing(false);
      setIsImporting(false);
      setResult(null);
    }
  }, [open]);

  const downloadTemplate = () => {
    const csv = createCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trenchcart-products-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const parseFile = async (file) => {
    setIsParsing(true);
    setParseError("");
    setResult(null);
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header) => header.trim(),
      });

      if (parsed.errors?.length) {
        throw new Error(parsed.errors[0].message || "Unable to parse CSV");
      }

      const rows = (parsed.data || [])
        .map((row) => normalizeImportedRow(row))
        .filter((row) => row.name);

      if (rows.length === 0) {
        throw new Error("No valid product rows found");
      }

      setPreviewRows(rows);
      setSelectedFileName(file.name);
      toast.success(`Parsed ${rows.length} row${rows.length > 1 ? "s" : ""}`);
    } catch (error) {
      setPreviewRows([]);
      setParseError(error.message || "Unable to parse CSV");
      toast.error(error.message || "Unable to parse CSV");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await parseFile(file);
    event.target.value = "";
  };

  const importRows = async () => {
    if (previewRows.length === 0) {
      toast.error("Upload a CSV file first");
      return;
    }

    setIsImporting(true);
    try {
      const response = await storeApi.entities.Product.import(previewRows);
      setResult(response);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success(`Imported ${response?.created || 0} product${response?.created === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error.message || "Unable to import products");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Use this when you already have product data in Excel. Keep one product per row, save the sheet as CSV, and upload it here.
            <div className="mt-2 text-xs text-slate-500">
              Categories must use the category ID from your Categories page and subcategories should use the subcategory ID. Images are separated with `|`. Variants should be JSON in one cell.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600">
              <FileSpreadsheet className="h-4 w-4" />
              {isParsing ? "Parsing..." : "Choose CSV file"}
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {selectedFileName ? (
            <p className="text-sm text-slate-500">Selected file: {selectedFileName}</p>
          ) : null}

          {parseError ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{parseError}</div>
          ) : null}

          {result?.errors?.length ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              Imported with {result.errors.length} error{result.errors.length > 1 ? "s" : ""}. Fix the rows below if needed.
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Subcategory</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Images</th>
                    <th className="px-4 py-3 font-medium">Variants</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        Upload a CSV file to preview your rows here.
                      </td>
                    </tr>
                  ) : (
                    previewRows.map((row, index) => (
                      <tr key={`${row.name}-${index}`} className="border-t">
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.sku || "-"}</td>
                        <td className="px-4 py-3">{categories.find((cat) => cat.id === row.category_id)?.name || row.category_id || "-"}</td>
                        <td className="px-4 py-3">{categories.find((cat) => cat.id === row.subcategory_id)?.name || row.subcategory_id || "-"}</td>
                        <td className="px-4 py-3">${Number(row.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">{Array.isArray(row.images) ? row.images.length : 0}</td>
                        <td className="px-4 py-3">{Array.isArray(row.variants) ? row.variants.length : 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              CSV rows ready: <span className="font-semibold text-slate-900">{previewRows.length}</span>
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-full bg-gray-900 hover:bg-indigo-600"
                disabled={previewRows.length === 0 || isImporting}
                onClick={importRows}
              >
                {isImporting ? "Importing..." : "Import CSV"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
