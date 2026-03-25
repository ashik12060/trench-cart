import React from 'react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function PromoBanner() {
  return (
    <div className="grid md:grid-cols-2 gap-4 py-6">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 flex flex-col justify-center text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-orange-400 rounded-full opacity-30" />
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-300 rounded-full opacity-20" />
        <p className="text-sm font-medium text-orange-100 mb-1">Limited Time Offer</p>
        <h3 className="text-2xl md:text-3xl font-extrabold mb-2">Summer Sale</h3>
        <p className="text-orange-100 mb-4 text-sm">Get up to 60% off on selected items</p>
        <a href={createPageUrl("ProductListing")}>
          <Button className="bg-white text-orange-600 hover:bg-orange-50 font-semibold rounded-full px-6 w-fit">
            Shop Now
          </Button>
        </a>
      </div>
      <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-8 flex flex-col justify-center text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-700 rounded-full opacity-30" />
        <div className="absolute -left-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-20" />
        <p className="text-sm font-medium text-blue-200 mb-1">New Arrivals</p>
        <h3 className="text-2xl md:text-3xl font-extrabold mb-2">Latest Gadgets</h3>
        <p className="text-blue-200 mb-4 text-sm">Discover cutting-edge technology</p>
        <a href={createPageUrl("ProductListing")}>
          <Button className="bg-white text-blue-800 hover:bg-blue-50 font-semibold rounded-full px-6 w-fit">
            Explore
          </Button>
        </a>
      </div>
    </div>
  );
}