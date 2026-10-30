import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// New page -> start at the top (the browser doesn't do this for client routes)
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
