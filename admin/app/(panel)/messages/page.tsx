"use client";
import { useEffect, useRef, useState } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { conversations, W } from "@/lib/data";
import Icon from "@/components/icons";
import { Avatar, Card, PageHead } from "@/components/ui";

type Msg = { me: boolean; text: string; time: string };

export default function MessagesPage() {
  usePageMotion();
  const toast = useToast();
  const [active, setActive] = useState(0);
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { me: false, text: "Arjun's advocate call went really well. He's ready to sign — just wants the fee split over two months.", time: "11:38 am" },
    { me: true, text: "Great work. Two-month split is fine for a ₹21.5L case. Send him the standard sheet with the revised schedule.", time: "11:40 am" },
    { me: false, text: "On it. Also — Divya Rao's docs cleared verification, moving her to signed 🎉", time: "11:42 am" },
  ]);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!draft.trim()) return;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toLowerCase();
    setMsgs((m) => [...m, { me: true, text: draft, time }]);
    setDraft("");
    setTimeout(() => setMsgs((m) => [...m, { me: false, text: "Noted 👍 will update the tracker.", time: "now" }]), 900);
  };

  return (
    <>
      <PageHead eyebrow="Workspace" title="Messages" sub="Coordinate with advocates and the telecalling floor." />
      <div className="canvas-grid no-rail">
        <div className="stream">
          <div className="chat-grid gs">
            <Card className="chat-list pad-sm">
              {conversations.map((c, i) => (
                <div key={c.name} className={`chat-item ${i === active ? "on" : ""}`} onClick={() => setActive(i)}>
                  <Avatar src={c.photo} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ci-name">{c.name} <time>{c.time}</time></div>
                    <div className="ci-sub">{c.last}</div>
                  </div>
                </div>
              ))}
            </Card>
            <Card className="chat-main">
              <div className="chat-head">
                <Avatar src={conversations[active].photo} size={44} ring />
                <div><div style={{ fontWeight: 700, letterSpacing: "-.02em" }}>{conversations[active].name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--mint-ink)", fontWeight: 600 }}>● Online</div></div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button className="icon-btn" onClick={() => toast("Calling…")} aria-label="Call"><Icon name="phone" size={14} /></button>
                  <button className="icon-btn" aria-label="More"><Icon name="dots" size={14} /></button>
                </div>
              </div>
              <div className="chat-body" ref={body}>
                {msgs.map((m, i) => (
                  <div key={i} className={`msg ${m.me ? "me" : "them"}`}>{m.text}<time>{m.time}</time></div>
                ))}
              </div>
              <div className="chat-input">
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a message…" />
                <button className="icon-btn dark" onClick={send} aria-label="Send"><Icon name="send" size={14} /></button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
