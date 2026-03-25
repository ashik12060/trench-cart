import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function ProductCard({ product, onAddToCart }) {
  const mainImage = product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
  const isOnSale = product.sale_price && product.sale_price < product.price;
  const discount = isOnSale ? Math.round((1 - product.sale_price / product.price) * 100) : 0;
  const displayPrice = isOnSale ? product.sale_price : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500"
    >
      <Link to={`${createPageUrl("ProductDetail")}/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {isOnSale && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 text-xs font-bold px-2.5 py-1 rounded-full">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 text-xs font-bold px-2.5 py-1 rounded-full">
              Featured
            </Badge>
          )}
          {product.stock_quantity <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm bg-black/60 px-4 py-2 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        {product.brand && (
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{product.brand}</p>
        )}
        <Link to={`${createPageUrl("ProductDetail")}/${product.id}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">({product.review_count || 0})</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">${displayPrice?.toFixed(2)}</span>
            {isOnSale && (
              <span className="text-sm text-gray-400 line-through">${product.price?.toFixed(2)}</span>
            )}
          </div>
          {product.stock_quantity > 0 && onAddToCart && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="w-9 h-9 rounded-full bg-gray-900 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors duration-300"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
