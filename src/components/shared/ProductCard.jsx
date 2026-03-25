import React from 'react';
import { Link } from "react-router-dom";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useCart } from "@/lib/CartContext";

export default function ProductCard({ product, onAddToCart }) {
  const isOnSale = product.sale_price && product.sale_price < product.price;
  const discount = isOnSale
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;
  const displayPrice = isOnSale ? product.sale_price : product.price;
  const { addToCart: contextAddToCart } = useCart();

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const callback = onAddToCart || contextAddToCart;
    callback?.(product);
  };
  return (
    <Link
      to={`${createPageUrl("ProductDetail")}/${product.id}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-transparent transition-all duration-300 flex flex-col"
    >
      <div className="relative bg-gray-50 p-4 flex items-center justify-center h-48">
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </button>
        <img
          src={product.images?.[0] || product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80"}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.brand || product.category}</p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          {Array(5).fill(0).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">({product.reviews_count || 0})</span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div>
            {isOnSale ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">${displayPrice?.toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through">${product.price?.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">${product.price?.toFixed(2)}</span>
            )}
          </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-800 shadow-lg shadow-blue-700/30"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
      </div>
    </Link>
  );
}
