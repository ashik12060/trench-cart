import React from 'react';
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              <span className="text-orange-400">Trench</span>Cart
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop shop for premium electronics at unbeatable prices.
            </p>
            <div className="flex gap-3 mt-4">
              {["f", "t", "in", "ig"].map((s) => (
                <div key={s} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400 hover:bg-blue-700 hover:text-white transition cursor-pointer">
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {["Home", "Shop", "Deals", "New Arrivals", "Best Sellers"].map(l => (
                <li key={l} className="hover:text-white transition cursor-pointer">{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              {["My Account", "Track Order", "Returns", "FAQs", "Warranty"].map(l => (
                <li key={l} className="hover:text-white transition cursor-pointer">{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> 123 Tech Street, NY</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400" /> +1 (555) 123-4567</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400" /> support@trenchcart.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © 2026 TrenchCart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}