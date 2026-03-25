import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, ShoppingCart, Heart, User, Menu, X, Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { storeApi } from "@/api/storeClient";
import { useCart } from "@/lib/CartContext";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";

const selectNavCategories = (categories = []) =>
  categories
    .filter((cat) => cat.is_active !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .slice(0, 8);

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const { customer } = useCustomerAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: categories = [], isFetching: isLoadingCategories } = useQuery({
    queryKey: ["layout-categories"],
    queryFn: () => storeApi.entities.Category.filter({ is_active: true }, "sort_order"),
  });
  const navCategories = selectNavCategories(categories);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl(`ProductListing?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top announcement bar */}
      <div className="bg-blue-900 text-white text-xs py-2 px-4 text-center">
        <span className="font-medium">🎉 Free shipping on orders over $50! Use code: </span>
        <span className="font-bold text-orange-300">MEGADEAL</span>
      </div>

      {/* Main header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                <span className="text-orange-500">Trench</span>
                <span className="text-blue-900">Cart</span>
              </h1>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="flex w-full">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands and more..."
                  className="rounded-l-full rounded-r-none border-r-0 h-10 bg-gray-50 focus:bg-white"
                />
                <Button type="submit" className="rounded-l-none rounded-r-full bg-blue-800 hover:bg-blue-900 h-10 px-5">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-3 ml-auto">
            <Link to={createPageUrl("MyOrders")} className="hidden md:flex flex-col items-center px-2 py-1 text-gray-600 hover:text-blue-800 transition group">
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium mt-0.5">
                {customer ? "My Orders" : "Track Order"}
              </span>
            </Link>
              <button
                type="button"
                onClick={openCart}
                className="hidden md:flex flex-col items-center px-2 py-1 text-gray-600 hover:text-blue-800 transition group relative"
              >
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold text-white bg-red-500">
                    {cartCount}
                  </span>
                )}
                <span className="text-[10px] font-medium mt-0.5">Cart</span>
              </button>
              <Link to={createPageUrl("MyOrders")} className="hidden md:flex flex-col items-center px-2 py-1 text-gray-600 hover:text-blue-800 transition group">
                <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium mt-0.5">
                  {customer && customer.full_name
                    ? `Hi, ${customer.full_name.split(" ")[0]}`
                    : "Account"}
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category nav - desktop */}
        <nav className="hidden md:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <Link
                to={createPageUrl("Home")}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition whitespace-nowrap"
              >
                Home
              </Link>
              {isLoadingCategories ? (
                <div className="flex gap-2">
                  {Array(4)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="w-20 h-8 rounded-lg bg-gray-200 animate-pulse" />
                    ))}
                </div>
              ) : (
                navCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={createPageUrl(`ProductListing?category=${cat.id}`)}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition whitespace-nowrap"
                  >
                    {cat.name}
                  </Link>
                ))
              )}
              <Link
                to={createPageUrl("ProductListing?featured=true")}
                className="px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition whitespace-nowrap"
              >
                🔥 Deals
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-3">
            <form onSubmit={handleSearch} className="flex">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="rounded-l-full rounded-r-none border-r-0 h-10"
              />
              <Button type="submit" className="rounded-l-none rounded-r-full bg-blue-800 h-10 px-4">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {navCategories.map((cat) => (
                <a
                  key={cat.slug}
                  href={createPageUrl(`ProductListing?category=${cat.slug}`)}
                  className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.label}
                </a>
              ))}
            </div>
            <div className="flex justify-around pt-2 border-t">
              <Link to={createPageUrl("MyOrders")} className="flex flex-col items-center text-gray-600 text-xs gap-1" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="w-5 h-5" /> Orders
              </Link>
              <button
                type="button"
                onClick={() => {
                  openCart();
                  setMobileMenuOpen(false);
                }}
                className="flex flex-col items-center text-gray-600 text-xs gap-1"
              >
                <ShoppingCart className="w-5 h-5" /> Cart
                {cartCount > 0 && (
                  <span className="text-[10px] font-semibold text-red-500">{cartCount}</span>
                )}
              </button>
              <Link to={createPageUrl("MyOrders")} className="flex flex-col items-center text-gray-600 text-xs gap-1" onClick={() => setMobileMenuOpen(false)}>
                <User className="w-5 h-5" /> Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Trust bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500 gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Truck className="w-4 h-4 text-blue-700" />
              <span className="font-medium">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <RotateCcw className="w-4 h-4 text-blue-700" />
              <span className="font-medium">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Headphones className="w-4 h-4 text-blue-700" />
              <span className="font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}
