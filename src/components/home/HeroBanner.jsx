import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { storeApi } from "@/api/storeClient";

const fallbackSlides = [
  {
    id: "fallback-1",
    title: "Discover the Finest Products",
    subtitle: "Curated collections of premium products, handpicked for quality and style.",
    cta_label: "Shop Now",
    image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    link_url: createPageUrl("Shop"),
  },
];

const resolveHref = (linkUrl = "") => {
  const raw = String(linkUrl || "").trim();
  if (!raw) return createPageUrl("Shop");
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `/${raw}`;
};

const isExternalLink = (value = "") => /^https?:\/\//i.test(String(value || "").trim());

function SlideLink({ href, children, className }) {
  if (isExternalLink(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const { data: slidesData = [] } = useQuery({
    queryKey: ["carousel-slides"],
    queryFn: () => storeApi.carouselSlides.list("sort_order,created_date"),
  });

  const slides = useMemo(() => (slidesData.length > 0 ? slidesData : fallbackSlides), [slidesData]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  const slide = slides[current % slides.length];
  const href = resolveHref(slide.link_url);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl shadow-slate-950/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || slide.image_url || current}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="relative min-h-[290px] sm:min-h-[330px] lg:min-h-[380px]"
        >
          <div className="absolute inset-0">
            <SlideLink href={href} className="block h-full w-full">
              <img
                src={slide.image_url}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
            </SlideLink>
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
          </div>

          <div className="relative z-10 min-h-[290px] px-4 py-5 sm:min-h-[330px] sm:px-6 sm:py-7 lg:min-h-[380px] lg:pl-14 lg:pr-10 lg:py-10">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="mt-6 max-w-2xl text-white sm:mt-8 lg:mt-12"
            >
             
              <h1 className="mt-2 text-xl font-black leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
                {slide.title}
              </h1>
              {slide.subtitle ? (
                <p className="mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">
                  {slide.subtitle}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 lg:mt-10">
                <SlideLink
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
                >
                  {slide.cta_label || "Shop Now"}
                  <ArrowRight className="h-4 w-4" />
                </SlideLink>
              </div>
            </motion.div>

          </div>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-sm sm:bottom-5 lg:bottom-6">
            {slides.map((item, index) => (
              <button
                key={item.id || `${item.title}-${index}`}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === current ? "w-8 bg-orange-400" : "w-2.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
