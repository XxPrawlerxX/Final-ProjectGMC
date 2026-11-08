import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "./lib/api";
import { useApi } from "./useApi";
import { useAuth } from "./auth/authContext";
import ChatThread from "./ChatThread";
import "./chat.css";

const QUICK = {
  retail: ["Is this still available?", "Can you deliver to my area?", "Is the price negotiable?"],
  bulk: ["Can I get a better price for a larger order?", "How long does delivery take for my quantity?", "Can I get samples first?"],
  secondhand: ["Is this still available?", "Would you accept a lower price?", "Where can we meet, or can you deliver?"],
};

// Shown on a product page: ask the seller a question, or carry on an existing chat.
export default function ChatPanel({ product, prefill = "" }) {
  const { user } = useAuth();
  const location = useLocation();
  const existing = useApi(user ? `/api/chat/conversations/for-product/${product.id}` : null);
  const [startedId, setStartedId] = useState(null);
  const [text, setText] = useState(prefill);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const storeName = product.seller.name;

  if (!user) {
    return (
      <div className="chat-panel">
        <h3>Chat with {storeName}</h3>
        <p>Sign in to ask the seller a question. Their replies appear right here and are emailed to you.</p>
        <Link className="chat-signin" to="/signin" state={{ from: location.pathname }}>Sign in to chat</Link>
      </div>
    );
  }

  const conversationId = startedId ?? existing.data?.conversation?.id;

  async function start(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    setBusy(true);
    setError("");
    try {
      const data = await api.post("/api/chat/conversations", { productId: product.id, message });
      setStartedId(data.conversation.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="chat-panel">
      <h3>Chat with {storeName}</h3>

      {existing.loading && <p className="chat-note">Loading…</p>}

      {conversationId && (
        <>
          <p>Replies from the seller appear below and are also emailed to you.</p>
          <ChatThread conversationId={conversationId} />
        </>
      )}

      {!existing.loading && !conversationId && (
        <form onSubmit={start}>
          <p>Ask about availability, delivery or anything else. {storeName} will reply here and by email.</p>
          <div className="chat-quick">
            {(QUICK[product.listingType] || QUICK.retail).map((q) => (
              <button type="button" key={q} onClick={() => setText(q)}>{q}</button>
            ))}
          </div>
          <label className="sr-only" htmlFor="chat-start">Your message to the seller</label>
          <textarea id="chat-start" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message to the seller…" disabled={busy} />
          {error && <p className="chat-error" role="alert">{error}</p>}
          <button className="chat-send" type="submit" disabled={busy || !text.trim()}>
            {busy ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
