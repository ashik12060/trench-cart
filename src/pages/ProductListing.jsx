import React, { useState, useMemo } from 'react';
import { storeApi } from '@/api/storeClient';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/shared/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryLabels = {
  smartphones: "Smartphones",
  laptops: "Laptops",
  tablets: "Tablets",
  smartwatches: "Smartwatches",
  headphones: "Headphones",
  cameras: "Cameras",
  gaming: "Gaming",
  accessories: "Accessories",
};

export default function ProductListing() {
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get("category") || "";
  const searchParam = params.get("search") || "";
  const featuredParam = params.get("featured") === "true";

  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-listing'],
    queryFn: () => storeApi.entities.Product.list('-created_date', 100),
  });

  const filtered = useMemo(() => {
    let result = [...products];

    if (categoryParam) {
      result = result.filter((p) => p.category_id === categoryParam);
    }
    if (featuredParam) {
      result = result.filter(p => p.featured);
    }
    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    result = result.filter(p => {
      const price = p.discount_price || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case "price_low": result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price)); break;
      case "price_high": result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price)); break;
      case "rating": result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: break;
    }
    return result;
  }, [products, categoryParam, searchParam, featuredParam, sortBy, priceRange]);

  const pageTitle = categoryParam
    ? categoryLabels[categoryParam] || categoryParam
    : featuredParam
    ? "Hot Deals"
    : searchParam
    ? `Results for "${searchParam}"`
    : "All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} products found</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-56 flex-shrink-0`}>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-6 sticky top-32">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryLabels).map(([slug, label]) => (
                  <a
                    key={slug}
                    href={`?category=${slug}`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      categoryParam === slug
                        ? 'bg-blue-800 text-white border-blue-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={5000}
                step={50}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
            {(categoryParam || searchParam) && (
              <a href="?" className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium">
                <X className="w-3 h-3" /> Clear all filters
              </a>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700">No products found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
