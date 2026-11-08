import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../auth/authContext";
import { WishlistContext } from "./wishlistContext";

// Wishlist ids for the signed-in shopper. Signed-out visitors are sent to sign in.
export default function WishlistProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ids, setIds] = useState([]);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    api
      .get("/api/wishlist")
      .then((data) => active && setIds(data.ids))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  const has = useCallback((id) => Boolean(userId) && ids.includes(id), [ids, userId]);

  // Returns true if the item is now saved, false if removed (or sent to sign in)
  const toggle = useCallback(
    async (id) => {
      if (!userId) {
        navigate("/signin", { state: { from: location.pathname + location.search, reason: "wishlist" } });
        return false;
      }
      const saved = ids.includes(id);
      setIds((current) => (saved ? current.filter((x) => x !== id) : [...current, id])); // instant
      try {
        const data = saved ? await api.delete(`/api/wishlist/${id}`) : await api.put(`/api/wishlist/${id}`);
        setIds(data.ids);
      } catch {
        setIds((current) => (saved ? [...current, id] : current.filter((x) => x !== id))); // undo
      }
      return !saved;
    },
    [ids, userId, navigate, location],
  );

  const value = useMemo(() => ({ ids: userId ? ids : [], has, toggle }), [ids, userId, has, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
