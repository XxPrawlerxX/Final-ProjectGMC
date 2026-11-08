import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { ToastContext } from "./toastContext";
import "./toast.css";

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, options = {}) => {
    window.clearTimeout(timer.current);
    setToast({ message, ...options, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className={`toast ${toast.type === "error" ? "error" : ""}`} key={toast.id}>
            <span>{toast.message}</span>
            {toast.to && (
              <Link to={toast.to} onClick={() => setToast(null)}>
                {toast.label || "View"}
              </Link>
            )}
            <button onClick={() => setToast(null)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
