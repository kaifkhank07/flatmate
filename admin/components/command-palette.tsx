"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { nav } from "@/lib/nav";
import { customers } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import Icon from "./icons";

type Item = { section: string; label: string; run: () => void; badge?: string };

/** ⌘K / Ctrl-K palette: pages, actions and recent customers. */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { toggle } = useTheme();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const items: Item[] = useMemo(() => [
    ...nav.map((n) => ({ section: "Go to", label: n.label, badge: "↵", run: () => router.push(n.href) })),
    { section: "Actions", label: "Toggle dark mode", run: toggle },
    { section: "Actions", label: "Add a new lead", run: () => router.push("/forms") },
    { section: "Actions", label: "Export customer CSV", run: () => toast("Export started") },
    ...customers.slice(0, 4).map((c) => ({ section: "Recent", label: `${c.name} — ${c.debt}`, run: () => router.push("/customers") })),
  ], [router, toast, toggle]);

  const shown = items.filter((i) => (i.label + i.section).toLowerCase().includes(q.toLowerCase()));

  useEffect(() => { setCursor(0); }, [q]);
  useEffect(() => { if (open) setQ(""); }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, shown.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter") { shown[cursor]?.run(); onClose(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, shown, cursor, onClose]);

  let lastSection = "";
  return (
    <div className={`cmd-veil ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmd" role="dialog" aria-label="Command palette">
        <div className="cmd-in">
          <Icon name="search" size={17} />
          <input autoFocus={open} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, actions, customers…" />
          <span className="kbd">ESC</span>
        </div>
        <div className="cmd-list">
          {shown.length === 0 && <div className="cmd-empty">Nothing matches. Try “leads” or “export”.</div>}
          {shown.map((it, i) => {
            const head = it.section !== lastSection ? ((lastSection = it.section), it.section) : null;
            return (
              <div key={it.label + i}>
                {head && <div className="cmd-sec">{head}</div>}
                <div className={`cmd-item ${i === cursor ? "on" : ""}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => { it.run(); onClose(); }}>
                  <span className="ico">{it.section === "Go to" ? "▦" : it.section === "Actions" ? "⌘" : "◍"}</span>
                  {it.label}
                  {it.badge && <small>{it.badge}</small>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
