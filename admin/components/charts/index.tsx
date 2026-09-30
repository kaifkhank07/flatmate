"use client";
import type { ReactNode } from "react";

/* ── Sparkline ─────────────────────────────────────────────────────────── */
export function Spark({ d, stroke = "var(--ember)" }: { d: string; stroke?: string }) {
  return (
    <svg className="spark" viewBox="0 0 120 40" preserveAspectRatio="none">
      <path className="draw-line" d={d} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── KPI card ──────────────────────────────────────────────────────────── */
export function Kpi({ icon, iconBg, iconInk, chip, chipTone = "mint", value, count, prefix, suffix, label, spark, stroke }: {
  icon: ReactNode; iconBg: string; iconInk: string; chip: string; chipTone?: string;
  value: string; count?: string; prefix?: string; suffix?: string; label: string; spark: string; stroke?: string;
}) {
  return (
    <div className="card kpi gs hoverable">
      <div className="kpi-top">
        <div className="kpi-ic" style={{ background: iconBg, color: iconInk }}>{icon}</div>
        <span className={`chip ${chipTone}`}>{chip}</span>
      </div>
      <div>
        <div className="kpi-num num" data-count={count} data-prefix={prefix} data-suffix={suffix}>{value}</div>
        <div className="kpi-lbl">{label}</div>
      </div>
      <Spark d={spark} stroke={stroke} />
    </div>
  );
}

/* ── Area chart with pulse dot + hover tooltip ─────────────────────────── */
export function AreaChart({ labels, values, line, fill, id = "ag" }: {
  labels: string[]; values: string[]; line: string; fill: string; id?: string;
}) {
  return (
    <div className="chart-wrap" data-labels={labels.join(",")} data-vals={values.join(",")}>
      <svg className="chart-area" viewBox="0 0 600 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--ember)" stopOpacity=".3" />
            <stop offset="1" stopColor="var(--ember)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="var(--hair)" strokeWidth="1">
          {[48, 96, 144, 192].map((y) => <line className="grid-line" key={y} x1="0" y1={y} x2="600" y2={y} />)}
        </g>
        <path className="fill-reveal" d={fill} fill={`url(#${id})`} />
        <path className="draw-line" d={line} fill="none" stroke="var(--ember)" strokeWidth="3" strokeLinecap="round" />
        <circle className="pulse-dot" r="6" fill="var(--ember)" stroke="var(--card)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

/* ── Vertical bars ─────────────────────────────────────────────────────── */
export function Bars({ data }: { data: { label: string; pct: number }[] }) {
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-col" key={d.label}>
          <div className="bar-wrap">
            <div className="bar" data-h={d.pct}><span className="bar-pct">{Math.round(d.pct * 100)}%</span></div>
          </div>
          <span className="bar-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Radial gauge ──────────────────────────────────────────────────────── */
export function Gauge({ value, caption, fill }: { value: number; caption: string; fill: number }) {
  return (
    <svg className="gauge-svg" width="132" height="132" viewBox="0 0 132 132">
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--ember-2)" /><stop offset="1" stopColor="var(--ember)" />
        </linearGradient>
      </defs>
      <circle cx="66" cy="66" r="52" fill="none" stroke="var(--canvas-2)" strokeWidth="13" />
      <circle className="ring-live" cx="66" cy="66" r="61" fill="none" stroke="var(--ember)" strokeWidth="1.5" strokeDasharray="3 9" opacity=".45" />
      <circle className="donut-seg" cx="66" cy="66" r="52" fill="none" stroke="url(#gg)" strokeWidth="13" strokeLinecap="round"
        strokeDasharray="326.7" strokeDashoffset="326.7" data-fill={fill} transform="rotate(-90 66 66)" />
      <text x="66" y="63" textAnchor="middle" fontSize="25" fontWeight="750" fill="var(--ink)" fontFamily="Inter">{value}</text>
      <text x="66" y="82" textAnchor="middle" fontSize="9.5" fontWeight="650" fill="var(--ink-3)" fontFamily="Inter">{caption}</text>
    </svg>
  );
}

/* ── Donut ─────────────────────────────────────────────────────────────── */
export function Donut({ segments, center, size = 150 }: {
  segments: { fill: number; color: string; rotate: number }[]; center?: string; size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" style={{ margin: "0 auto 16px" }}>
      <circle cx="75" cy="75" r="58" fill="none" stroke="var(--canvas-2)" strokeWidth="20" />
      {segments.map((s, i) => (
        <circle key={i} className="donut-seg" cx="75" cy="75" r="58" fill="none" stroke={s.color} strokeWidth="20"
          strokeDasharray="364.4" strokeDashoffset="364.4" data-fill={s.fill} strokeLinecap="round"
          transform={`rotate(${s.rotate} 75 75)`} />
      ))}
      {center && <text x="75" y="82" textAnchor="middle" fontSize="25" fontWeight="750" fill="var(--ink)" fontFamily="Inter">{center}</text>}
    </svg>
  );
}

/* ── Segmented funnel ──────────────────────────────────────────────────── */
export function Funnel({ rows }: { rows: { label: string; pct: number; value: string; hot?: boolean }[] }) {
  return (
    <div className="funnel">
      {rows.map((r) => (
        <div className={`fn-row ${r.hot ? "hot" : ""}`} key={r.label}>
          <span className="fn-lbl">{r.label}</span>
          <div className="fn-track"><div className="fn-fill" data-w={r.pct} /></div>
          <span className="fn-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Heatmap ───────────────────────────────────────────────────────────── */
export function Heatmap({ cells = 60 }: { cells?: number }) {
  const vals = Array.from({ length: cells }, (_, i) =>
    [0.12, 0.22, 0.38, 0.55, 0.75, 0.95][Math.floor(Math.abs(Math.sin(i * 7.13)) * 6)] ?? 0.2);
  return (
    <>
      <div className="heat">{vals.map((o, i) => <i key={i} data-o={o} style={{ opacity: 0 }} />)}</div>
      <div className="heat-lbls"><span>9 am</span><span>12 pm</span><span>3 pm</span><span>6 pm</span><span>9 pm</span></div>
    </>
  );
}
