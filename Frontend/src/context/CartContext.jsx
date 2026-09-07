import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as cartApi from "../api/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const EMPTY_CART = { items: [], subtotal: 0, totalItems: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The backend cart is customer-only. A vendor/admin session, or no
  // session at all, should never show a leftover cart from a previous
  // customer — so we reset to empty rather than fetching in that case.
  const canUseCart = isAuthenticated && role === "customer";

  const refresh = useCallback(async () => {
    if (!canUseCart) {
      setCart(EMPTY_CART);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canUseCart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(productId, quantity = 1) {
    setError("");

    try {
      const data = await cartApi.addToCart(productId, quantity);
      setCart(data);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, message: err.message };
    }
  }

  async function updateItem(productId, quantity) {
    setError("");

    try {
      const data = await cartApi.updateCartItem(productId, quantity);
      setCart(data);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, message: err.message };
    }
  }

  async function removeItem(productId) {
    setError("");

    try {
      const data = await cartApi.removeFromCart(productId);
      setCart(data);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, message: err.message };
    }
  }

  async function clear() {
    setError("");

    try {
      const data = await cartApi.clearCart();
      setCart(data);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, message: err.message };
    }
  }

  const value = { cart, loading, error, addItem, updateItem, removeItem, clear, refresh };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
