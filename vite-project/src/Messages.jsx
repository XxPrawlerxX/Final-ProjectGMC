import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { usePolling } from "./usePolling";
import Layout from "./Layout";
import ChatThread from "./ChatThread";
import "./chat.css";

function ago(iso) {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

// Inbox for buyers and sellers: conversation list on the left, chat on the right
// (one at a time on phones).
export default function Messages() {
  const { id } = useParams();
  const list = usePolling("/api/chat/conversations", 15000);
  const items = list.data?.items ?? [];

  return (
    <Layout>
      <div className="site-container chat-page">
        <h1 className="page-title chat-title">Messages</h1>

        <div className={`chat-layout ${id ? "has-thread" : ""}`}>
          <aside className="chat-list" aria-label="Conversations">
            {list.loading && <p className="chat-note">Loading…</p>}
            {list.data && items.length === 0 && (
              <div className="chat-empty">
                <MessageCircle size={36} />
                <p>No conversations yet. Open a product and tap <b>Chat with seller</b> to start one.</p>
              </div>
            )}
            <ul>
              {items.map((c) => (
                <li key={c.id}>
                  <Link to={`/messages/${c.id}`} className={c.id === id ? "active" : ""}>
                    {c.productImage ? <img src={c.productImage} alt="" /> : <span className="chat-list-noimg" />}
                    <span className="chat-list-text">
                      <strong>{c.with}</strong>
                      <em>{c.productName}</em>
                      <span>{c.preview}</span>
                    </span>
                    <span className="chat-list-side">
                      <time dateTime={c.lastMessageAt}>{ago(c.lastMessageAt)}</time>
                      {c.unread > 0 && c.id !== id && <b>{c.unread}</b>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section className="chat-main">
            {id ? (
              <>
                <Link className="chat-back" to="/messages">← All messages</Link>
                <ChatThread key={id} conversationId={id} showHeader onRead={list.refresh} />
              </>
            ) : (
              <div className="chat-empty desktop-only">
                <MessageCircle size={40} />
                <p>Select a conversation to read and reply.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
