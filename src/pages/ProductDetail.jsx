import React, { useMemo, useState, useEffect } from 'react';
import { storeApi } from '@/api/storeClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, Truck, RotateCcw, ShieldCheck, Minus, Plus, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from '@/components/shared/ProductCard';
import { createPageUrl } from '@/utils';
import { useCart } from "@/lib/CartContext";
import { useParams, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { getProductPrimaryImage } from "@/utils/productImages";
import { getRootCategories } from "@/utils/categoryTree";

export default function ProductDetail() {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const productId = searchParams.get("id") || paramId;
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const { addToCart } = useCart();


  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => storeApi.entities.Product.filter({ id: productId }),
    enabled: !!productId,
    select: (data) => data[0],
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related', product?.category_id],
    queryFn: () => storeApi.entities.Product.filter({ category_id: product.category_id }, '-created_date', 5),
    enabled: !!product?.category_id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => storeApi.entities.Category.filter({ is_active: true }),
  });
  const rootCategories = getRootCategories(categories);
  const categoryMap = useMemo(() => {
    const map = {};
    rootCategories.forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [rootCategories]);

  const variants = product?.variants || [];
  const variantChecksum = useMemo(
    () =>
      variants
        .map((variant) => `${variant.size || "One Size"}-${variant.color || ""}-${variant.quantity || 0}-${variant.sku || ""}`)
        .join("|"),
    [variants],
  );

  const sizeOptions = useMemo(() => {
    const map = new Map();
    variants.forEach((variant, index) => {
      const sizeLabel = (variant.size && variant.size.trim()) || "One Size";
      const sizeEntry = map.get(sizeLabel) ?? { size: sizeLabel, totalQuantity: 0, colors: [] };
      const qty = Number(variant.quantity || 0);
      sizeEntry.totalQuantity += qty;
      sizeEntry.colors.push({ variant, index, qty });
      map.set(sizeLabel, sizeEntry);
    });
    return Array.from(map.values());
  }, [variants]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);
  useEffect(() => {
    if (!variants.length) {
      setSelectedVariantIndex(null);
      return;
    }
    const availableIndex = variants.findIndex((variant) => Number(variant.quantity || 0) > 0);
    setSelectedVariantIndex(availableIndex >= 0 ? availableIndex : 0);
  }, [product?.id, variantChecksum]);

  const selectedVariant = selectedVariantIndex !== null ? variants[selectedVariantIndex] : null;
  const selectedSize = selectedVariant?.size?.trim() || sizeOptions[0]?.size || "";
  const selectedSizeEntry =
    sizeOptions.find((entry) => entry.size === selectedSize) || sizeOptions[0] || null;
  const selectionStock = selectedSizeEntry?.totalQuantity ?? Number(product?.stock_quantity || 0);
  const availableStock = selectedVariant
    ? Math.max(0, Number(selectedVariant.quantity || 0))
    : Math.max(0, selectionStock);
  const isOutOfStock = availableStock <= 0;

  const colorOptions = selectedSizeEntry?.colors || [];

  const selectVariant = (variantIndex, nextImage = "") => {
    setSelectedVariantIndex(variantIndex);
    if (nextImage) {
      setActiveImage(nextImage);
    }
  };

  const handleSizeSelect = (sizeEntry) => {
    if (!sizeEntry?.colors?.length) return;
    const highlight = sizeEntry.colors.find((entry) => entry.qty > 0) || sizeEntry.colors[0];
    if (highlight) {
      const nextVariantImages = Array.isArray(highlight.variant?.images) ? highlight.variant.images.filter(Boolean) : [];
      selectVariant(highlight.index, nextVariantImages[0] || "");
    }
  };

  const handleColorSelect = (colorEntry) => {
    if (!colorEntry) return;
    const nextVariantImages = Array.isArray(colorEntry.variant?.images) ? colorEntry.variant.images.filter(Boolean) : [];
    selectVariant(colorEntry.index, nextVariantImages[0] || "");
  };

  const galleryImages = useMemo(() => {
    const collected = [];
    variants.forEach((variant) => {
      (Array.isArray(variant?.images) ? variant.images : []).forEach((image) => {
        const normalized = String(image || "").trim();
        if (normalized && !collected.includes(normalized)) {
          collected.push(normalized);
        }
      });
    });
    return collected;
  }, [variants]);
  const imageVariantMap = useMemo(() => {
    const map = new Map();
    variants.forEach((variant, index) => {
      (Array.isArray(variant?.images) ? variant.images : []).forEach((image) => {
        const normalized = String(image || "").trim();
        if (normalized && !map.has(normalized)) {
          map.set(normalized, index);
        }
      });
    });
    return map;
  }, [variants]);
  const selectedVariantImages = useMemo(
    () => (Array.isArray(selectedVariant?.images) ? selectedVariant.images.filter(Boolean) : []),
    [selectedVariant?.images],
  );
  const activeGalleryImage =
    activeImage ||
    selectedVariantImages[0] ||
    galleryImages[0] ||
    getProductPrimaryImage(product, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80");

  useEffect(() => {
    if (!galleryImages.length) {
      setActiveImage("");
      return;
    }

    if (selectedVariantImages.length > 0) {
      if (selectedVariantImages.includes(activeImage)) {
        return;
      }
      if (!activeImage || !galleryImages.includes(activeImage)) {
        setActiveImage(selectedVariantImages[0]);
      }
      return;
    }

    if (!activeImage || !galleryImages.includes(activeImage)) {
      setActiveImage(galleryImages[0]);
    }
  }, [activeImage, galleryImages, product?.id, selectedVariantImages, selectedVariantIndex]);

  useEffect(() => {
    setQty(1);
  }, [selectedVariantIndex]);

  useEffect(() => {
    setQty((prev) => Math.max(1, Math.min(prev, Math.max(availableStock, 1))));
  }, [availableStock]);

  const adjustQuantity = (delta) => {
    setQty((prev) => {
      if (availableStock <= 0) {
        return 1;
      }
      const next = Math.max(1, prev + delta);
      return Math.min(next, availableStock);
    });
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    const productImage = getProductPrimaryImage(product, "");
    const extras = selectedVariant
      ? {
          variant: selectedVariant,
          image_url:
            selectedVariantImages[0] ||
            activeGalleryImage ||
            productImage ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        }
      : {
          image_url: productImage || activeGalleryImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        };
    addToCart(product, qty, extras);
  };

  const handleImageMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoom({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      active: true,
    });
  };

  const handleImageEnter = () => {
    setZoom((prev) => ({ ...prev, active: true }));
  };

  const handleImageLeave = () => {
    setZoom((prev) => ({ ...prev, active: false }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
          <div className="space-y-4">
            <div className="bg-gray-100 rounded h-8 w-3/4 animate-pulse" />
            <div className="bg-gray-100 rounded h-6 w-1/2 animate-pulse" />
            <div className="bg-gray-100 rounded h-20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-gray-800">Product not found</h2>
        <a href={createPageUrl("Home")} className="text-blue-700 font-medium mt-2 inline-block">Go back to shop</a>
      </div>
    );
  }

  const discount = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const related = relatedProducts.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href={createPageUrl("Home")} className="hover:text-blue-700">Home</a>
        <ChevronRight className="w-3 h-3" />
        <a
          href={createPageUrl(`ProductListing?category=${product.category_id}`)}
          className="hover:text-blue-700 capitalize"
        >
          {categoryMap[product.category_id] || 'Category'}
        </a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium truncate max-w-48">{product.name}</span>
      </nav>

        <div className="grid items-start md:grid-cols-2 gap-8">
        {/* Product image */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 relative">
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1">
                -{discount}%
              </Badge>
            )}
            <div className="w-full">
              <div
                className="group relative flex min-h-[17rem] md:min-h-[20rem] items-center justify-center overflow-hidden rounded-3xl bg-gray-50 p-3"
                onMouseMove={handleImageMove}
                onMouseEnter={handleImageEnter}
                onMouseLeave={handleImageLeave}
              >
                <img
                  src={activeGalleryImage}
                  alt={product.name}
                  className={`block w-[420px] h-[420px] mx-auto object-contain transition-transform duration-200 ${
                    zoom.active ? "scale-110" : "scale-100"
                  }`}
                  style={{
                    transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  }}
                />

                {zoom.active ? (
                  <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-52 overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-sm">
                      <div
                        className="h-52 w-full"
                        style={{
                          backgroundImage: `url(${activeGalleryImage})`,
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "260%",
                          backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                        }}
                      />
                      <div className="border-t border-gray-100 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Zoom
                        </p>
                        <p className="text-xs text-gray-500">Hover preview</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              {galleryImages.length > 0 ? (
                <div className="mt-2 flex flex-wrap justify-start gap-2">
                  {galleryImages.map((image, index) => {
                    const isActive = image === activeGalleryImage;
                    const linkedVariantIndex = imageVariantMap.get(image);
                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => {
                          if (linkedVariantIndex !== undefined) {
                            selectVariant(linkedVariantIndex, image);
                          } else {
                            setActiveImage(image);
                          }
                        }}
                        className={`h-12 w-12 overflow-hidden rounded-lg border bg-white transition-all ${
                          isActive ? "border-blue-800 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                        }`}
                        aria-label={`Show variant image ${index + 1}`}
                      >
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">This variant does not have any uploaded images yet.</p>
              )}
            </div>
        </div>

        {/* Product info */}
        <div className="w-full">
          <p className="text-sm text-blue-700 font-semibold uppercase tracking-wider mb-1">{product.brand}</p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating || 0} ({product.reviews_count || 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2.5 mb-3">
            <span className="text-2xl font-extrabold text-gray-900">
              ${(product.sale_price || product.price)?.toFixed(2)}
            </span>
            {product.sale_price && (
              <>
                <span className="text-lg text-gray-400 line-through">${product.price?.toFixed(2)}</span>
                <Badge className="bg-green-100 text-green-800 font-bold">Save ${(product.price - product.sale_price).toFixed(2)}</Badge>
              </>
            )}
          </div>

          <Separator className="mb-3" />

          <p className="text-sm text-gray-600 leading-relaxed mb-3">{product.description}</p>

          {variants.length > 0 && (
            <div className="mb-3 space-y-2.5 bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-900">Sizes</p>
                  <span className={`text-xs ${selectionStock > 0 ? "text-gray-500" : "text-red-500"}`}>
                    {selectionStock > 0 ? `${selectionStock} available` : "Out of stock"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((entry) => {
                    const isSelectedSize = entry.size === selectedSize;
                    const isAvailable = entry.totalQuantity > 0;
                    return (
                      <button
                        key={entry.size}
                        type="button"
                        onClick={() => handleSizeSelect(entry)}
                        className={clsx(
                          "flex-1 min-w-[92px] rounded-2xl border px-2.5 py-2 text-left transition-colors",
                          {
                            "border-gray-200 bg-white text-gray-900 hover:border-gray-300": !isSelectedSize,
                            "border-blue-800 bg-blue-50 text-blue-900 shadow-inner": isSelectedSize,
                            "cursor-not-allowed opacity-60": !isAvailable,
                          },
                        )}
                        disabled={!isAvailable}
                      >
                        <span className="text-sm font-semibold block">{entry.size}</span>
                        <span className="text-[11px] text-gray-500">
                          {isAvailable ? `${entry.totalQuantity} in stock` : "Unavailable"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">Colors</p>
                  <span
                    className={`text-xs ${colorOptions.some((entry) => entry.qty > 0) ? "text-gray-500" : "text-red-500"}`}
                  >
                    {colorOptions.some((entry) => entry.qty > 0) ? "Pick a color" : "Out of stock"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colorOptions.map((colorEntry) => {
                    const colorVariant = colorEntry.variant;
                    const isSelectedColor = selectedVariantIndex === colorEntry.index;
                    const colorLabel = colorVariant.color || "Default";
                    const swatchStyle = colorVariant.color
                      ? { backgroundColor: colorVariant.color }
                      : undefined;
                    return (
                      <button
                        key={`${colorLabel}-${colorEntry.index}`}
                        type="button"
                        onClick={() => handleColorSelect(colorEntry)}
                        className={clsx(
                          "flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-left transition-colors",
                          {
                            "border-gray-200 hover:border-gray-300": !isSelectedColor,
                            "border-blue-800 bg-blue-50 shadow-inner": isSelectedColor,
                            "cursor-not-allowed opacity-60": colorEntry.qty <= 0,
                          },
                        )}
                        disabled={colorEntry.qty <= 0}
                      >
                        <span
                          className="w-[18px] h-[18px] rounded-full border border-gray-200"
                          style={swatchStyle}
                        />
                        <div>
                          <p className="text-[11px] font-semibold text-gray-900">{colorLabel}</p>
                          <p className="text-[10px] text-gray-500">{colorEntry.qty} pcs</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center border border-gray-200 rounded-full">
                <button
                  onClick={() => adjustQuantity(-1)}
                  className="w-[34px] h-[34px] flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-[34px] text-center font-semibold text-gray-900">{qty}</span>
                <button
                  onClick={() => adjustQuantity(1)}
                  className="w-[34px] h-[34px] flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <Button
                size="lg"
                className="bg-blue-800 hover:bg-blue-900 rounded-full px-5 flex-1 md:flex-none shadow-lg shadow-blue-800/20"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-3 h-[38px] w-[38px]">
                <Heart className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {selectedVariant
                ? `${selectedVariant.color || "Default color"} · ${selectedVariant.size || "One size"} · ${availableStock} in stock`
                : `Stock: ${availableStock} units available`}
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: Truck, label: "Free Delivery" },
              { icon: RotateCcw, label: "30-Day Return" },
              { icon: ShieldCheck, label: "2-Year Warranty" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-[7px]">
                <Icon className="w-3.5 h-3.5 text-blue-700" />
                <span className="text-[11px] font-medium text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Description / Specs */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
            <p className="text-gray-600 leading-relaxed">{product.description || "No description available."}</p>
          </TabsContent>
          <TabsContent value="specs" className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
            {product.specs ? (
              <div className="space-y-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex border-b border-gray-50 pb-2">
                    <span className="w-40 font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No specifications available.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
