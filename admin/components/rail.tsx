"use client";
import { quickConnects, tasks } from "@/lib/data";
import { useToast } from "@/lib/toast";
import Icon from "./icons";
import { Avatar, IconBtn } from "./ui";

export function RailHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="rail-head">
      <b>{title} {note && <span>({note})</span>}</b>
      <IconBtn name="dots" size="sm" variant="plain" />
    </div>
  );
}

export function QuickConnects() {
  const toast = useToast();
  return (
    <div className="card pad-sm gs">
      <div className="card-head" style={{ marginBottom: 14 }}>
        <span className="card-title">Quick connects</span>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn name="search" size="sm" variant="plain" />
          <IconBtn name="filter" size="sm" variant="plain" />
        </div>
      </div>
      <div className="feature" style={{ marginBottom: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://picsum.photos/seed/blrtower/640/380" alt="" />
        <span className="tag chip white">Expansion</span>
        <div className="meta-b"><b>Bengaluru desk</b><span>2 advocates onboarded · live today</span></div>
      </div>
      {quickConnects.map((q) => (
        <div className="qc" key={q.name}>
          <Avatar src={q.photo} size={38} />
          <div><div className="qc-name">{q.name}</div><div className="qc-sub">{q.sub}</div></div>
          <div className="qc-act">
            <IconBtn name="phone" size="sm" onClick={() => toast(`Calling ${q.name.split(" ")[0]}…`)} />
            <IconBtn name="expand" size="sm" variant="plain" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FollowUpTasks() {
  return (
    <div className="card pad-sm gs">
      <div className="card-head" style={{ marginBottom: 12 }}>
        <span className="card-title">Follow-up tasks</span>
        <button className="select-pill" style={{ padding: "6px 12px" }}>Today <Icon name="chev" size={10} /></button>
      </div>
      {tasks.map((t) => (
        <div className="row-item" key={t.name}>
          <Avatar src={t.photo} size={38} />
          <div><div className="row-name">{t.name}</div><div className="row-sub">{t.sub}</div></div>
          <span className="row-right">{t.time}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniCalendar() {
  const days = Array.from({ length: 13 }, (_, i) => i + 1);
  return (
    <div className="card pad-sm gs">
      <div className="card-head" style={{ marginBottom: 14 }}>
        <span className="card-title">September</span>
        <IconBtn name="chev" size="sm" variant="plain" />
      </div>
      <div className="mini-cal">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
        <b style={{ opacity: 0.3 }}>31</b>
        {days.map((d) => (
          <b key={d} className={`${d === 1 ? "on" : ""} ${[3, 7, 10].includes(d) ? "dot-day" : ""}`}>{d}</b>
        ))}
      </div>
    </div>
  );
}
