import { useCallback, useEffect, useMemo, useState } from "react";
import { unitPriceFor } from "./lib/pricing";
import { CartContext } from "./cartContext";

const STORAGE_KEY = "marketfind-cart";

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    // Ignore anything that doesn't look like a cart line (old/corrupt data)
    return saved.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.price === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

// What a cart line remembers about a product (bulk items also need their minimum
// order and price breaks so the price can change with the quantity)
const snapshot = (product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  oldPrice: product.oldPrice,
  image: product.image,
  stock: product.stock,
  listingType: product.listingType || "retail",
  unit: product.unit || "piece",
  minOrderQty: product.minOrderQty || 1,
  priceTiers: product.priceTiers || [],
});

export default function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  // Keep the cart across refreshes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* storage full or blocked - the cart still works for this visit */
    }
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((current) => {
      const min = product.minOrderQty || 1;
      const limit = product.stock > 0 ? product.stock : 99;
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, ...snapshot(product), quantity: Math.min(Math.max(item.quantity + quantity, min), limit) }
            : item,
        );
      }
      return [...current, { ...snapshot(product), quantity: Math.min(Math.max(quantity, min), limit) }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id, quantity) => {
      if (quantity < 1) {
        removeFromCart(id);
        return;
      }
      setCart((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          const limit = item.stock > 0 ? item.stock : Infinity;
          return { ...item, quantity: Math.min(Math.max(quantity, item.minOrderQty || 1), limit) };
        }),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);
  // Used by the cart page after checking prices/stock against the server
  const replaceCart = useCallback((items) => setCart(items), []);

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      replaceCart,
      cartCount: cart.length,
      // bulk price breaks are applied per line, based on its quantity
      subtotal: cart.reduce((total, item) => total + unitPriceFor(item, item.quantity) * item.quantity, 0),
    }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, replaceCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
