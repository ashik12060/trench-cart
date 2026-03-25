import React from 'react';
import { ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import ProductCard from "../shared/ProductCard";

export default function DealSection({ title, products, loading }) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <a
          href={createPageUrl("ProductListing")}
          className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        >
          View All <ChevronRight className="w-4 h-4" />
        </a>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}