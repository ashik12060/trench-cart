import React, { useState, useMemo } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Grid3X3, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/store/ProductCard";
import SearchBar from "@/components/store/SearchBar";
import { useCart } from "@/lib/CartContext";

export default function Shop() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFilter = urlParams.get("category");
  const featuredFilter = urlParams.get("featured") === "true";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(featuredFilter);
  const [gridCols, setGridCols] = useState(4);
  const { addToCart } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => storeApi.entities.Product.filter({ is_active: true }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => storeApi.entities.Category.filter({ is_active: true }),
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    if (showFeaturedOnly) {
      result = result.filter((p) => p.is_featured);
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((p) => {
        const price = p.sale_price || p.price;
        return price >= min && (max ? price <= max : true);
      });
    }

    switch (sortBy) {
      case "price_low": result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price)); break;
      case "price_high": result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price)); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "rating": result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return result;
  }, [products, search, selectedCategory, sortBy, priceRange, showFeaturedOnly]);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          {[
            { label: "All Prices", value: "all" },
            { label: "Under $25", value: "0-25" },
            { label: "$25 - $50", value: "25-50" },
            { label: "$50 - $100", value: "50-100" },
            { label: "$100 - $200", value: "100-200" },
            { label: "Over $200", value: "200-0" },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setPriceRange(range.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${priceRange === range.value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={showFeaturedOnly}
          onCheckedChange={setShowFeaturedOnly}
          id="featured"
        />
        <label htmlFor="featured" className="text-sm text-gray-700">Featured only</label>
      </div>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
        <p className="text-gray-500 mt-1">Explore our collection of {products.length} products</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 shrink-0">
          <FilterPanel />
        </div>

        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex-1 min-w-[200px]">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden rounded-full">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-6"><FilterPanel /></div>
              </SheetContent>
            </Sheet>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden md:flex border rounded-full overflow-hidden">
              <button
                onClick={() => setGridCols(3)}
                className={`p-2 ${gridCols === 3 ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-2 ${gridCols === 4 ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          <p className="text-sm text-gray-500 mb-4">{filteredProducts.length} products found</p>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className={`grid grid-cols-2 md:grid-cols-${gridCols} gap-5`}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
