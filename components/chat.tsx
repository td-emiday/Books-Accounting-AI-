"use client";

import { useState } from "react";
import { Icon } from "./icon";
import {
  CHAT_SUGGESTIONS,
  CHAT_THREAD,
  type ChatMessage,
} from "@/lib/data/chat";

type Channel = "web" | "whatsapp" | "email";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

export function Chat({ open, setOpen }: Props) {
  const [channel, setChannel] = useState<Channel>("web");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [thread, setThread] = useState<ChatMessage[]>(CHAT_THREAD);

  const send = async () => {
    const q = text.trim();
    if (!q || typing) return;
    const userMsg: ChatMessage = { id: Date.now(), me: true, text: q };
    setThread((t) => [...t, userMsg]);
    setText("");
    setTyping(true);
    try {
      const res = await fetch("/api/cfo/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        answer?: string;
        reason?: string;
      };
      const reply = json.ok && json.answer
        ? json.answer
        : json.reason === "openai_429"
          ? "I'm rate-limited right now. Try again in a few seconds."
          : json.reason === "missing_key"
            ? "Ask-the-CFO isn't switched on in this environment yet."
            : "Sorry, something went wrong reading your books. Try again.";
      setThread((t) => [...t, { id: Date.now() + 1, me: false, text: reply }]);
    } catch {
      setThread((t) => [
        ...t,
        {
          id: Date.now() + 1,
          me: false,
          text: "Network hiccup — try that again.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  if (!open) {
    return (
      <div className="chat-fab" data-tour="chat">
        <button type="button" className="chat-bubble" onClick={() => setOpen(true)}>
          <span className="pulse" />
          Ask your CFO
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              opacity: 0.5,
              marginLeft: 4,
            }}
          >
            ⌘J
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="chat-fab">
      <div className="chat-panel">
        <div className="chat-head">
          <div className="who">
            <div className="av">e</div>
            <div>
              <div className="nm">Emiday · Your CFO</div>
              <div className="st">
                <span className="d" />
                Online · reading your books
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <button type="button" className="icon-btn" title="Expand">
              <Icon name="expand" size={14} />
            </button>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} title="Close">
              <Icon name="close2" size={14} />
            </button>
          </div>
        </div>

        <div className="chan-seg">
          <button
            type="button"
            className={channel === "web" ? "on" : ""}
            onClick={() => setChannel("web")}
          >
            <Icon name="globe" size={12} /> Web
          </button>
          <button
            type="button"
            className={channel === "whatsapp" ? "on" : ""}
            onClick={() => setChannel("whatsapp")}
          >
            <span className="wa-dot" /> WhatsApp
          </button>
          <button
            type="button"
            className={channel === "email" ? "on" : ""}
            onClick={() => setChannel("email")}
          >
            <Icon name="mail" size={12} /> Email
          </button>
        </div>

        {channel === "whatsapp" ? (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                fontSize: 12,
                color: "var(--muted)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              Forward any receipt, question or document to{" "}
              <b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                +234 700 EMIDAY
              </b>{" "}
              — Emiday replies in WhatsApp and syncs to your books.
            </div>
            <div
              style={{
                flex: 1,
                padding: 20,
                display: "grid",
                placeItems: "center",
                background: "var(--whatsapp-soft)",
              }}
            >
              <WhatsappMini />
            </div>
          </div>
        ) : (
          <>
            <div className="chat-body">
              {thread.map((m) => (
                <div key={m.id} className={`msg ${m.me ? "me" : ""}`}>
                  <div className="bub">
                    {m.text}
                    {m.data && (
                      <div className="data-block">
                        {m.data.map(([k, v], i) => (
                          <div key={i} className="row-l">
                            <span className="muted">{k}</span>
                            <span className="v">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="t">{m.me ? "You" : "Emiday"} · just now</div>
                </div>
              ))}
              {typing && (
                <div className="msg">
                  <div className="bub typing">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "6px 14px",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                borderTop: "1px solid var(--line)",
              }}
            >
              {CHAT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="cat"
                  style={{ fontSize: 11 }}
                  onClick={() => setText(s)}
                >
                  <Icon name="sparkle" size={10} /> {s}
                </button>
              ))}
            </div>
            <div className="chat-input">
              <button type="button" className="icon-btn" title="Attach">
                <Icon name="paperclip" size={14} />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about your numbers…"
              />
              <button type="button" className="send" onClick={send}>
                <Icon name="send" size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WhatsappMini() {
  return (
    <div className="wa-phone">
      <div className="wa-screen">
        <div className="wa-head">
          <div className="av">e</div>
          <div>
            <div>Emiday CFO</div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>
              online
            </div>
          </div>
        </div>
        <div className="wa-msgs">
          <div className="wa-bub me">
            Here&apos;s a receipt from the Ikeja office lunch.
            <div className="tm">10:24 ✓✓</div>
          </div>
          <div className="wa-bub">
            Got it — ₦18,400 at Terra Kulture. I&apos;ve filed it under Travel
            &amp; entertainment. OK?
            <div className="tm">10:24</div>
          </div>
          <div className="wa-bub me">
            👍 and how much VAT do I owe this quarter?
            <div className="tm">10:25 ✓✓</div>
          </div>
          <div className="wa-bub">
            ₦3.24M, due the 21st. Want me to prepare the draft?
            <div className="tm">10:25</div>
          </div>
        </div>
        <div className="wa-input">
          <div className="box">Message</div>
          <div className="mic">
            <Icon name="mic" size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
