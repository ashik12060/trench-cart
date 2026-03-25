import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 rounded-3xl">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500 rounded-full blur-[120px]" />
      </div>
      <div className="relative grid md:grid-cols-2 gap-8 items-center px-8 md:px-16 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block text-indigo-400 text-sm font-semibold tracking-widest uppercase mb-4">
            New Collection 2026
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Discover the{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Finest
            </span>{" "}
            Products
          </h1>
          <p className="text-gray-400 text-lg mt-4 max-w-md leading-relaxed">
            Curated collections of premium products, handpicked for quality and style.
          </p>
          <div className="flex gap-4 mt-8">
            <Link
              to={createPageUrl("Shop")}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:bg-indigo-50 transition-colors duration-300"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={createPageUrl("Shop") + "?featured=true"}
              className="inline-flex items-center gap-2 text-white border border-white/20 px-7 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-colors duration-300"
            >
              Featured
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hidden md:flex justify-center"
        >
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80"
            alt="Hero"
            className="w-full max-w-md rounded-2xl object-cover shadow-2xl shadow-black/30"
          />
        </motion.div>
      </div>
    </div>
  );
}