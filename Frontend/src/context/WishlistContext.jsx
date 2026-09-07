import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as wishlistApi from "../api/wishlistApi";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

const EMPTY_WISHLIST = { products: [] };

export function WishlistProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [wishlist, setWishlist] = useState(EMPTY_WISHLIST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Same rule as cart: wishlist is customer-only, and a vendor/admin
  // session (or no session) should never show a leftover customer's
  // saved items.
  const canUseWishlist = isAuthenticated && role === "customer";

  const refresh = useCallback(async () => {
    if (!canUseWishlist) {
      setWishlist(EMPTY_WISHLIST);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await wishlistApi.getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canUseWishlist]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function isWishlisted(productId) {
    return wishlist.products.some((product) => product._id === productId);
  }

  async function addItem(productId) {
    try {
      const data = await wishlistApi.addToWishlist(productId);
      setWishlist(data);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  async function removeItem(productId) {
    try {
      const data = await wishlistApi.removeFromWishlist(productId);
      setWishlist(data);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  // The heart icon everywhere in the app is a single toggle button —
  // this is the one function all of them call.
  async function toggle(productId) {
    return isWishlisted(productId) ? removeItem(productId) : addItem(productId);
  }

  const value = {
    wishlist,
    loading,
    error,
    isWishlisted,
    addItem,
    removeItem,
    toggle,
    refresh,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside a WishlistProvider");
  }

  return context;
}
