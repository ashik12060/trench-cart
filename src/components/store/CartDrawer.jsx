import React from "react";
import { createPageUrl } from "@/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose, cart, updateQuantity, removeItem }) {
  const subtotal = cart.reduce((sum, item) => sum + (item.sale_price || item.price) * item.quantity, 0);
  const navigate = useNavigate();
  const handleCheckout = () => {
    onClose();
    navigate(createPageUrl("Checkout"));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="w-5 h-5" />
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.cart_item_id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4 py-4 border-b last:border-0"
                >
                  <img
                    src={item.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80"}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-gray-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                    {item.variant && (
                      <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                        {item.variant.color && <span>Color: {item.variant.color}</span>}
                        {item.variant.size && <span>Size: {item.variant.size}</span>}
                      </div>
                    )}
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      ${((item.sale_price || item.price) * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border rounded-full">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.cart_item_id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t px-6 py-5 space-y-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
          <Button
            onClick={handleCheckout}
            className="w-full h-12 rounded-full bg-gray-900 hover:bg-indigo-600 text-white font-semibold text-sm transition-colors duration-300"
          >
            Checkout <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </SheetContent>
  </Sheet>
);
}
