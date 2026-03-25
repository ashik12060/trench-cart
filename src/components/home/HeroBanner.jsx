import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";

const slides = [
  {
    title: "SMART WEARABLE.",
    subtitle: "Best Deal Online on smart watches",
    discount: "UP TO 80% OFF",
    image: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&q=80",
    bg: "from-blue-900 to-blue-700",
    cta: "Shop Now"
  },
  {
    title: "PREMIUM LAPTOPS.",
    subtitle: "Powerful performance for creators",
    discount: "UP TO 40% OFF",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    bg: "from-slate-900 to-slate-700",
    cta: "Explore"
  },
  {
    title: "SMARTPHONES.",
    subtitle: "Flagship phones at unbeatable prices",
    discount: "UP TO 50% OFF",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
    bg: "from-indigo-900 to-indigo-700",
    cta: "Buy Now"
  }
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <div className={`relative bg-gradient-to-r ${slide.bg} rounded-2xl overflow-hidden transition-all duration-700`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-white z-10">
          <p className="text-sm md:text-base font-medium text-blue-200 mb-2">{slide.subtitle}</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-3">
            {slide.title}
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-orange-400 mb-6">{slide.discount}</p>
          <a href={createPageUrl("ProductListing")}>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 rounded-full shadow-lg shadow-orange-500/30">
              {slide.cta}
            </Button>
          </a>
          <div className="flex gap-2 mt-8">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 rounded-full transition-all ${i === current ? 'bg-orange-400 w-8' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
      <button
        onClick={() => setCurrent(p => (p - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full p-2 text-white transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrent(p => (p + 1) % slides.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full p-2 text-white transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}