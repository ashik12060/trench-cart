import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import CartDrawer from "@/components/store/CartDrawer";
import { getProductPrimaryImage } from "@/utils/productImages";

const CART_STORAGE_KEY = "megamart_cart";

const buildVariantKey = (variant) => {
  if (!variant) return "";
  const color = variant.color || "";
  const size = variant.size || "";
  const sku = variant.sku || "";
  return `${sku}|${color}|${size}`;
};

const buildCartItemId = (productId, variantKey) => `${productId}::${variantKey || "default"}`;

const readStoredCart = () => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((item) => ({
      ...item,
      variant: item.variant || null,
      cart_item_id:
        item.cart_item_id || buildCartItemId(item.id, buildVariantKey(item.variant)),
    }));
  } catch (error) {
    console.error("Failed to read cart from localStorage", error);
    return [];
  }
};

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => readStoredCart());
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
    window.dispatchEvent(new Event("cartUpdated"));
  }, [cart]);

  const openCart = useCallback(() => setDrawerOpen(true), []);
  const closeCart = useCallback(() => setDrawerOpen(false), []);
  const toggleCart = useCallback(() => setDrawerOpen((prev) => !prev), []);

  const addToCart = useCallback(
    (product, quantity = 1, extras = {}) => {
      if (!product) {
        return;
      }
      const qty = Math.max(1, quantity);
      const variantKey = buildVariantKey(extras.variant);
      const cartItemId = buildCartItemId(product.id, variantKey);
      setCart((prev) => {
        const existing = prev.find((item) => item.cart_item_id === cartItemId);
        if (existing) {
          return prev.map((item) =>
            item.cart_item_id === cartItemId ? { ...item, quantity: item.quantity + qty } : item
          );
        }
        const imageUrl =
          extras.image_url ||
          (Array.isArray(extras.variant?.images) ? extras.variant.images.find((image) => String(image || "").trim()) : "") ||
          getProductPrimaryImage(product, "");
        return [
          ...prev,
          {
            ...product,
            ...extras,
            image_url: imageUrl,
            variant: extras.variant,
            variant_key: variantKey,
            cart_item_id: cartItemId,
            quantity: qty,
          },
        ];
      });
      openCart();
    },
    [openCart]
  );

  const updateQuantity = useCallback((cartItemId, quantity) => {
    setCart((prev) =>
      prev
        .map((item) => (item.cart_item_id === cartItemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cart_item_id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + (item.quantity || 0), 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + ((item.sale_price || item.price || 0) * (item.quantity || 0)),
        0
      ),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
      <CartDrawer
        open={isDrawerOpen}
        onClose={closeCart}
        cart={cart}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
