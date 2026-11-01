"use client";

import { useState, useEffect, useRef } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";
import { Send } from "lucide-react";

const initials = (name = "") =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export default function ChatRoomPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, author: "System", content: "Welcome to the NewtonBotics chat room!", time: new Date().toLocaleTimeString() },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      author: user?.firstName || user?.email || "You",
      content: input.trim(),
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const me = user?.firstName || user?.email || "You";

  return (
    <ProtectedRoute>
      <main className="bg-paper text-ink">
        <div className="nb-container flex flex-col gap-6 pb-16 pt-10">
          <header className="flex flex-col gap-1.5">
            <span className="nb-eyebrow">Members only</span>
            <h1 className="m-0 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em]">Chat room</h1>
            <p className="m-0 text-[15px] text-ink-muted">Be respectful and collaborative.</p>
          </header>

          <div className="nb-card flex flex-wrap overflow-hidden">
            <nav
              aria-label="Channels"
              className="hidden flex-[1_1_240px] flex-col gap-1 border-r border-line px-3 py-6 lg:flex"
            >
              <span className="px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">Channels</span>
              <span
                aria-current="page"
                className="flex h-9 items-center gap-2 rounded-md bg-paper px-3 text-sm font-semibold shadow-[inset_2px_0_0_#FF5A1F]"
              >
                <span className="font-mono text-ink-muted" aria-hidden="true">#</span>
                general
              </span>
              <span className="px-3 pb-1 pt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                Online
              </span>
              <span className="flex h-9 items-center gap-2 px-3 text-sm text-ink-body">
                <span className="h-2 w-2 rounded-full bg-[#166534]" aria-hidden="true" />
                <span className="truncate">{me}</span>
              </span>
            </nav>

            <section className="flex h-[70vh] min-h-[480px] min-w-0 flex-[999_1_400px] flex-col">
              <div className="flex h-[72px] shrink-0 items-center border-b border-line bg-paper px-5 sm:px-7">
                <span className="flex flex-col">
                  <span className="font-display text-lg font-semibold"># general</span>
                  <span className="text-[13px] text-ink-muted">Lab-wide chat</span>
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6 sm:px-7" aria-live="polite">
                {messages.map((m) => {
                  const isSystem = m.author === "System";
                  return (
                    <article key={m.id} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                          isSystem ? "bg-ink text-paper" : "bg-[#E6E7E1] text-ink"
                        }`}
                      >
                        {isSystem ? "NB" : initials(m.author)}
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold">{m.author}</span>
                          <span className="font-mono text-[11px] text-ink-muted">{m.time}</span>
                        </span>
                        <span className="whitespace-pre-wrap break-words text-[15px] leading-[1.55] text-ink-body">
                          {m.content}
                        </span>
                      </div>
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="shrink-0 px-4 pb-5 pt-3 sm:px-7">
                <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-2 focus-within:border-ink focus-within:ring-[3px] focus-within:ring-signal/35">
                  <label htmlFor="chat-message" className="nb-sr-only">
                    Message #general
                  </label>
                  <input
                    id="chat-message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message #general"
                    autoComplete="off"
                    className="h-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-[15px] text-ink placeholder:text-ink-subtle focus:outline-none"
                  />
                  <button type="submit" className="nb-btn nb-btn-primary nb-btn-sm h-11">
                    <Send size={16} aria-hidden="true" /> Send
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
