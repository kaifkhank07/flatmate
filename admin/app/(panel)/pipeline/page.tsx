"use client";
import { useState } from "react";
import Link from "next/link";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { kanbanColumns } from "@/lib/data";
import Band from "@/components/band";
import Icon from "@/components/icons";
import { Avatar, Card, CardHead, PageHead, SelectPill } from "@/components/ui";
import { Kpi } from "@/components/charts";
import { FollowUpTasks, QuickConnects, RailHead } from "@/components/rail";

type Card = (typeof kanbanColumns)[number]["cards"][number];

export default function PipelinePage() {
  usePageMotion();
  const toast = useToast();
  const [cols, setCols] = useState(kanbanColumns);
  const [drag, setDrag] = useState<{ col: string; name: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const drop = (colId: string) => {
    if (!drag || drag.col === colId) { setOver(null); return; }
    setCols((prev) => {
      let moved: Card | undefined;
      const stripped = prev.map((c) =>
        c.id !== drag.col ? c : { ...c, cards: c.cards.filter((k) => { if (k.name === drag.name) { moved = k; return false; } return true; }) });
      return stripped.map((c) => (c.id === colId && moved ? { ...c, cards: [...c.cards, moved] } : c));
    });
    setOver(null);
    toast("Stage updated");
  };

  return (
    <>
      <PageHead eyebrow="Deals board" title="Business pipeline"
        sub="Drag a case between stages — the CRM syncs instantly."
        actions={<><SelectPill>All owners</SelectPill><Link className="btn btn-brand sm" href="/forms">+ Add case</Link></>} />

      <Band eyebrow="Deals board · live"
        title='<em class="num" data-count="18">0</em> cases in play, worth ₹<em class="num" data-count="2.4" data-suffix=" Cr">0</em>.'
        body="Five cases signed this week. Three are stuck at fee-sharing for more than four days — worth a nudge today."
        metrics={[
          { label: "Advocate calls", value: "0", count: "9" },
          { label: "Fees awaiting", value: "0", count: "3" },
          { label: "Avg. days to sign", value: "0", count: "18" },
        ]}
        tiles={[
          { icon: "◈", value: "0", label: "Signed this week", count: "5" },
          { icon: "◷", value: "0", label: "Stalled > 4 days", count: "3" },
        ]}
        bar={{ pct: 62, left: "62% of monthly signing target", right: "18 of 29 cases" }} />

      <div className="canvas-grid">
        <div className="stream">
          <div className="kpis">
            <Kpi icon={<Icon name="flow" />} iconBg="var(--lav)" iconInk="var(--lav-ink)" chip="6 open" chipTone="iris" value="0" count="18" label="Cases in play" spark="M0 30 L20 25 L40 27 L60 18 L80 21 L100 12 L120 14" />
            <Kpi icon="◷" iconBg="var(--sea)" iconInk="var(--sea-ink)" chip="This week" chipTone="sea" value="0" count="9" label="Advocate calls" spark="M0 28 L20 24 L40 26 L60 20 L80 22 L100 15 L120 17" stroke="var(--sea-ink)" />
            <Kpi icon="₹" iconBg="var(--sand)" iconInk="var(--sand-ink)" chip="3 pending" chipTone="sand" value="0" count="1.4" prefix="₹" suffix=" L" label="Fees awaiting" spark="M0 16 L20 20 L40 18 L60 24 L80 21 L100 26 L120 24" />
            <Kpi icon="✓" iconBg="var(--mint)" iconInk="var(--mint-ink)" chip="▲ 4" value="0" count="5" label="Signed this week" spark="M0 32 L20 28 L40 30 L60 22 L80 25 L100 16 L120 18" stroke="var(--mint-ink)" />
          </div>

          <Card>
            <CardHead title="Deals board" sub="Sept 2026 · Hyderabad + Bengaluru"
              right={<div className="seg"><button className="on">Board</button><button onClick={() => toast("Table view is on Customers")}>Table</button></div>} />
            <div className="kanban">
              {cols.map((col) => (
                <div key={col.id}
                  className={`kb-col ${over === col.id ? "over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => { e.preventDefault(); drop(col.id); }}>
                  <div className="kb-head">
                    <span className="dot" style={{ background: col.dot }} />{col.title}
                    <span className="kb-count">{col.cards.length}</span>
                  </div>
                  {col.cards.map((c) => (
                    <div key={c.name} className="kb-card" draggable
                      onDragStart={() => setDrag({ col: col.id, name: c.name })}
                      onDragEnd={() => setDrag(null)}>
                      <span className={`chip ${c.tone}`}>{c.chip}</span>
                      <div className="kb-t">{c.name}</div>
                      <div className="kb-s">{c.sub}</div>
                      <div className="kb-foot"><Avatar src={c.photo} size={26} /><span className="kb-amt">{c.amount}</span></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <aside className="rail"><RailHead title="Board activity" /><FollowUpTasks /><QuickConnects /></aside>
      </div>
    </>
  );
}
