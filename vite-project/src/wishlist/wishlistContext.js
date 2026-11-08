import { createContext, useContext } from "react";

export const WishlistContext = createContext(null);

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return value;
}
