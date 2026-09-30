"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { customers, type Customer, type Status } from "@/lib/data";
import Band from "@/components/band";
import Icon from "@/components/icons";
import { Avatar, Card, PageHead } from "@/components/ui";
import { Kpi } from "@/components/charts";
import { FollowUpTasks, QuickConnects, RailHead } from "@/components/rail";

const PER = 8;

export default function CustomersPage() {
  usePageMotion();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Customer | null>(null);

  const rows = useMemo(() =>
    customers.filter((c) =>
      (filter === "all" || c.status === filter) &&
      (c.name + c.city).toLowerCase().includes(q.toLowerCase())), [q, filter]);

  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const slice = rows.slice((page - 1) * PER, page * PER);

  return (
    <>
      <PageHead eyebrow="CRM" title="Customers"
        sub="398 contacts across every campaign. Open a row for the full case file."
        actions={<>
          <button className="btn btn-ghost sm" onClick={() => toast("CSV export started")}>Export CSV</button>
          <Link className="btn btn-brand sm" href="/forms">+ New lead</Link>
        </>} />

      <Band eyebrow="CRM · 398 contacts" title="Every customer, <em>one file</em>."
        body="Search, filter and sort the full book. Open any row for creditors, fees, advocate and next step."
        metrics={[
          { label: "Total contacts", value: "0", count: "398" },
          { label: "Open cases", value: "0", count: "112" },
          { label: "Signed YTD", value: "0", count: "87" },
          { label: "Avg. debt", value: "0", count: "16.4", prefix: "₹", suffix: " L" },
        ]}
        tiles={[
          { icon: "◍", value: "0%", label: "Contactable this week", count: "64", suffix: "%" },
          { icon: "★", value: "0", label: "Hot prospects", count: "41" },
        ]} />

      <div className="canvas-grid">
        <div className="stream">
          <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <Kpi icon={<Icon name="users" />} iconBg="var(--lav)" iconInk="var(--lav-ink)" chip="▲ 12%" value="0" count="398" label="Total contacts" spark="M0 30 L20 25 L40 27 L60 18 L80 21 L100 12 L120 14" />
            <Kpi icon="◐" iconBg="var(--sea)" iconInk="var(--sea-ink)" chip="Live now" chipTone="sea" value="0" count="112" label="Open cases" spark="M0 26 L20 23 L40 25 L60 19 L80 21 L100 14 L120 16" stroke="var(--sea-ink)" />
            <Kpi icon="✓" iconBg="var(--mint)" iconInk="var(--mint-ink)" chip="▲ 6%" value="0" count="87" label="Signed YTD" spark="M0 32 L20 28 L40 30 L60 22 L80 25 L100 16 L120 18" stroke="var(--mint-ink)" />
          </div>

          <Card>
            <div className="table-tools">
              <div className="table-search">
                <Icon name="search" size={14} />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name or city…" />
              </div>
              <div className="seg">
                {(["all", "Hot", "Pending", "Signed"] as const).map((f) => (
                  <button key={f} className={filter === f ? "on" : ""} onClick={() => { setFilter(f); setPage(1); }}>
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>
                  <th>Customer</th><th>City</th><th>Salary</th><th>Debt</th><th>Campaign</th><th>Case progress</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {slice.map((c) => (
                    <tr key={c.id} onClick={() => setOpen(c)}>
                      <td className="td-person"><Avatar src={c.photo} size={38} /><div>{c.name}<span>Meta Ads lead</span></div></td>
                      <td>{c.city}</td><td>{c.salary}</td><td>{c.debt}</td>
                      <td><span className="chip line">{c.campaign}</span></td>
                      <td><div className="prog"><i style={{ width: `${c.progress}%` }} /></div></td>
                      <td><span className={`chip ${c.tone}`}><span className="dot" />{c.status}</span></td>
                    </tr>
                  ))}
                  {slice.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-4)", padding: 34 }}>No matches — clear the search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pager">
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={page === i + 1 ? "on" : ""} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          </Card>
        </div>

        <aside className="rail">
          <RailHead title="Recently viewed" />
          <QuickConnects />
          <FollowUpTasks />
        </aside>
      </div>

      {/* slide-over case file (bottom sheet on mobile) */}
      <div className={`drawer-veil ${open ? "open" : ""}`} onClick={() => setOpen(null)} />
      <div className={`drawer ${open ? "open" : ""}`}>
        {open && (
          <>
            <div className="drawer-head"><span className="card-title">Case file</span>
              <button className="icon-btn sm" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" size={14} /></button></div>
            <div className="d-hero">
              <Avatar src={open.photo} size={86} ring />
              <div className="d-name">{open.name}</div>
              <div className="d-sub">{open.city} · Campaign {open.campaign}</div>
              <div className="d-actions">
                <button className="btn btn-ink sm" onClick={() => toast("Calling…")}><Icon name="phone" size={13} /> Call</button>
                <Link className="btn btn-ghost sm" href="/messages">Message</Link>
              </div>
            </div>
            <div className="d-stats">
              <div className="d-stat"><span>MONTHLY SALARY</span><b>{open.salary}/mo</b></div>
              <div className="d-stat"><span>TOTAL DEBT</span><b>{open.debt}</b></div>
              <div className="d-stat"><span>CAMPAIGN</span><b>Meta {open.campaign}</b></div>
              <div className="d-stat"><span>STATUS</span><b>{open.status}</b></div>
            </div>
            <div className="card-title" style={{ margin: "6px 0 2px" }}>Details</div>
            <div className="d-row"><span>Assigned advocate</span><b>Srivalya T.</b></div>
            <div className="d-row"><span>Creditors</span><b>4 banks · 2 apps</b></div>
            <div className="d-row"><span>Last contact</span><b>Aug 30, 2026</b></div>
            <div className="d-row"><span>Next step</span><b>Advocate consult</b></div>
            <div className="d-row"><span>Case progress</span><b>{open.progress}%</b></div>
            <button className="btn btn-brand" style={{ width: "100%", justifyContent: "center", marginTop: 18 }}
              onClick={() => toast("Case file opened")}>Open full case</button>
          </>
        )}
      </div>
    </>
  );
}
