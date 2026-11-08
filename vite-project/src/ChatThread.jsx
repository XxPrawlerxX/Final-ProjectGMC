import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { api } from "./lib/api";
import { usePolling } from "./usePolling";
import "./chat.css";

const EMAIL_NOTE = {
  sent: "✓ Also emailed to the buyer",
  pending: "Sending email…",
  off: "Buyer has email alerts turned off",
  skipped: "Not emailed (email isn't set up on the server)",
  failed: "Email couldn't be sent. The buyer can still read it here",
};

function when(iso) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}, ${time}`;
}

// The conversation itself: messages (refreshed every few seconds) and the reply box.
export default function ChatThread({ conversationId, showHeader = false, onRead }) {
  const { data, error, loading, refresh } = usePolling(`/api/chat/conversations/${conversationId}/messages`, 5000);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const listRef = useRef(null);

  const messages = data?.messages ?? [];
  const conversation = data?.conversation;
  const unread = conversation?.unread ?? 0;

  // Stay scrolled to the newest message
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Opening a chat marks it read on the server; let the inbox know
  useEffect(() => {
    if (!onRead || unread === 0) return undefined;
    const timer = window.setTimeout(onRead, 600);
    return () => window.clearTimeout(timer);
  }, [unread, onRead]);

  async function send(event) {
    event?.preventDefault();
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setSendError("");
    try {
      await api.post(`/api/chat/conversations/${conversationId}/messages`, { message });
      setText("");
      refresh();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  if (error && !data) {
    return <p className="chat-note" role="alert">{error.status === 404 ? "This conversation wasn't found." : error.message}</p>;
  }

  return (
    <div className="chat">
      {showHeader && conversation && (
        <header className="chat-header">
          {conversation.productImage && <img src={conversation.productImage} alt="" />}
          <div>
            <strong>{conversation.with}</strong>
            <Link to={`/product/${conversation.productId}`}>{conversation.productName}</Link>
          </div>
        </header>
      )}

      <div className="chat-messages" ref={listRef} role="log" aria-live="polite" aria-label="Messages">
        {loading && <p className="chat-note">Loading messages…</p>}
        {data && messages.length === 0 && <p className="chat-note">No messages yet. Say hello!</p>}
        {messages.map((m) => {
          const mine = m.role === conversation.role;
          return (
            <div key={m.id} className={`chat-row ${mine ? "mine" : "theirs"}`}>
              <div className="chat-bubble">{m.body}</div>
              <span className="chat-meta">
                {when(m.createdAt)}
                {mine && conversation.role === "seller" && EMAIL_NOTE[m.emailStatus] && ` · ${EMAIL_NOTE[m.emailStatus]}`}
              </span>
            </div>
          );
        })}
      </div>

      <form className="chat-form" onSubmit={send}>
        <label className="sr-only" htmlFor={`chat-input-${conversationId}`}>Your message</label>
        <textarea
          id={`chat-input-${conversationId}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message…"
          rows={1}
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !text.trim()} aria-label="Send message">
          <Send size={18} />
        </button>
      </form>
      {sendError && <p className="chat-error" role="alert">{sendError}</p>}
    </div>
  );
}
