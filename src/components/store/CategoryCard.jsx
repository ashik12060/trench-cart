import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function CategoryCard({ category, index }) {
  const defaultImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link
        to={createPageUrl("Shop") + `?category=${category.id}`}
        className="group relative block aspect-[4/3] rounded-2xl overflow-hidden"
      >
        <img
          src={category.image_url || defaultImages[index % defaultImages.length]}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{category.name}</h3>
            {category.description && (
              <p className="text-white/70 text-sm mt-0.5 line-clamp-1">{category.description}</p>
            )}
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:text-gray-900 text-white transition-all duration-300">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}