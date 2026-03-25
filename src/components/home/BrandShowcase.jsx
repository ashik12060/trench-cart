import React from 'react';

const brands = [
  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
  { name: "Samsung", logo: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=120&h=60&fit=crop&q=80" },
  { name: "Sony", logo: "https://images.unsplash.com/photo-1617802690658-1173a812650d?w=120&h=60&fit=crop&q=80" },
  { name: "Dell", logo: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=120&h=60&fit=crop&q=80" },
  { name: "Bose", logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=60&fit=crop&q=80" },
  { name: "Canon", logo: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&h=60&fit=crop&q=80" },
];

export default function BrandShowcase() {
  return (
    <section className="py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Top Electronics Brands</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer group"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="w-16 h-16 object-contain rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-700 transition-colors">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}