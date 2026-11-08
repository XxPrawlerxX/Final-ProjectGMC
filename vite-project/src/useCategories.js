import { useEffect, useState } from "react";
import { api } from "./lib/api";

// Categories are needed by the header on every page, so fetch them once and share.
let cached = null;
let pending = null;

export function useCategories() {
  const [categories, setCategories] = useState(cached || []);

  useEffect(() => {
    if (cached) return undefined;
    let active = true;
    pending ??= api
      .get("/api/categories")
      .then((data) => (cached = data.items))
      .catch(() => {
        pending = null; // try again next time
        return [];
      });
    pending.then((items) => active && setCategories(items));
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
