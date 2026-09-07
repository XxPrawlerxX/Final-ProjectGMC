import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../api/paymentApi";
import { useCart } from "../context/CartContext";

// This page exists purely to read ?reference= from the URL Paystack
// redirects to, and ask the BACKEND whether the payment actually
// succeeded. Landing here is never treated as proof of payment —
// verifyPayment() below is the only source of truth.
export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useCart();

  const [status, setStatus] = useState("loading"); // loading | success | pending | failed | error
  const [message, setMessage] = useState("");

  const reference = searchParams.get("reference") || searchParams.get("trxref");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference was provided.");
      return;
    }

    let cancelled = false;

    verifyPayment(reference)
      .then((data) => {
        if (cancelled) return;

        if (data.data.status === "success") {
          setStatus("success");
        } else {
          setStatus("pending");
        }

        setMessage(data.message);
        refresh();
      })
      .catch((err) => {
        if (cancelled) return;

        setStatus("failed");
        setMessage(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="payment-callback-page">
      <div className="payment-callback-card">
        {status === "loading" && (
          <>
            <h1>Confirming your payment…</h1>
            <p>Please wait while we verify this with Paystack.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="payment-status-success">Payment successful</h1>
            <p>Your order has been paid for. Thank you for shopping with Marketfind.</p>
            <button onClick={() => navigate("/orders")}>View my orders</button>
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="payment-status-pending">Payment not yet confirmed</h1>
            <p>{message}</p>
            <button onClick={() => navigate("/orders")}>View my orders</button>
          </>
        )}

        {(status === "failed" || status === "error") && (
          <>
            <h1 className="payment-status-failed">Payment could not be verified</h1>
            <p>{message}</p>
            <button onClick={() => navigate("/cart")}>Return to cart</button>
          </>
        )}

        <button className="payment-callback-home" onClick={() => navigate("/")}>
          ← Return to marketplace
        </button>
      </div>
    </div>
  );
}
