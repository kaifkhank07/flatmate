"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "../icons";

/* ── Field wrapper ─────────────────────────────────────────────────────── */
export function Field({ label, hint, tone, full, children }: {
  label?: string; hint?: string; tone?: "ok" | "err"; full?: boolean; children: ReactNode;
}) {
  return (
    <div className={`fld ${full ? "full" : ""}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && <div className={`hint ${tone ?? ""}`}>{hint}</div>}
    </div>
  );
}

/* ── Text input, optionally with lead/trail adornments ─────────────────── */
export function Input({ lead, trail, action, state, ...props }: {
  lead?: ReactNode; trail?: ReactNode; action?: { label: string; onClick: () => void };
  state?: "ok" | "err";
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const cls = `inp ${state === "ok" ? "is-ok" : state === "err" ? "is-err" : ""}`;
  if (!lead && !trail && !action) return <input className={cls} {...props} />;
  return (
    <div className="igroup">
      {lead && <span className="adorn lead">{lead}</span>}
      <input className={cls} {...props} />
      {trail && <span className="adorn trail">{trail}</span>}
      {action && <button className="ghost-btn" onClick={action.onClick} type="button">{action.label}</button>}
    </div>
  );
}

/* ── Floating-label input ──────────────────────────────────────────────── */
export function FloatInput({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="fld fl">
      <input id={id} className="inp" placeholder=" " {...props} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="inp" {...props}>{children}</select>;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="inp" {...props} />;
}

/* ── Live-validated input (email / phone) ──────────────────────────────── */
export function ValidatedInput({ kind, base, ...props }: {
  kind: "email" | "phone"; base: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [v, setV] = useState("");
  const ok = kind === "email" ? /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v) : v.replace(/\D/g, "").length === 10;
  const msg = !v ? base : ok ? (kind === "email" ? "Looks good" : "Valid mobile number") : (kind === "email" ? "Enter a valid email address" : "Needs 10 digits");
  return { input: <input className={`inp ${v ? (ok ? "is-ok" : "is-err") : ""}`} value={v} onChange={(e) => setV(e.target.value)} {...props} />, msg, tone: (v ? (ok ? "ok" : "err") : undefined) as "ok" | "err" | undefined };
}

/* ── Checkbox / radio card ─────────────────────────────────────────────── */
export function OptionCard({ type = "checkbox", name, title, desc, defaultChecked }: {
  type?: "checkbox" | "radio"; name?: string; title: string; desc: string; defaultChecked?: boolean;
}) {
  return (
    <label className="opt">
      <input type={type} name={name} defaultChecked={defaultChecked} />
      <span className={`box ${type === "radio" ? "round" : ""}`}>
        {type === "checkbox" && <Icon name="check" size={12} />}
      </span>
      <div><b>{title}</b><p>{desc}</p></div>
    </label>
  );
}

/* ── Switch ────────────────────────────────────────────────────────────── */
export function Switch({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return <button type="button" className={`switch ${on ? "on" : ""}`} onClick={() => setOn(!on)} aria-pressed={on} />;
}

/* ── Slider with live output ───────────────────────────────────────────── */
export function Slider({ min, max, step, defaultValue, format }: {
  min: number; max: number; step: number; defaultValue: number; format: (v: number) => string;
}) {
  const [v, setV] = useState(defaultValue);
  const pct = ((v - min) / (max - min)) * 100;
  return (
    <div className="slider-wrap">
      <input className="slider" type="range" min={min} max={max} step={step} value={v}
        style={{ ["--pct" as string]: `${pct}%` }} onChange={(e) => setV(+e.target.value)} />
      <div className="slider-out">
        <span>{format(min)}</span><b>{format(v)}</b><span>{format(max)}</span>
      </div>
    </div>
  );
}

/* ── Stepper ───────────────────────────────────────────────────────────── */
export function Stepper({ defaultValue = 1 }: { defaultValue?: number }) {
  const [n, setN] = useState(defaultValue);
  return (
    <div className="stepper">
      <button type="button" onClick={() => setN(Math.max(0, n - 1))} aria-label="Decrease">−</button>
      <input value={n} readOnly />
      <button type="button" onClick={() => setN(n + 1)} aria-label="Increase">+</button>
    </div>
  );
}

/* ── Chip multi-select ─────────────────────────────────────────────────── */
export function ChipSelect({ options, single, defaultSelected = [] }: {
  options: string[]; single?: boolean; defaultSelected?: string[];
}) {
  const [sel, setSel] = useState<string[]>(defaultSelected);
  const toggle = (o: string) =>
    setSel(single ? [o] : sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]);
  return (
    <div className="chip-select">
      {options.map((o) => (
        <button type="button" key={o} className={`chip-opt ${sel.includes(o) ? "on" : ""}`} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

/* ── Tag input ─────────────────────────────────────────────────────────── */
export function TagInput({ defaultTags = [], placeholder }: { defaultTags?: string[]; placeholder?: string }) {
  const [tags, setTags] = useState(defaultTags);
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="tags" onClick={() => ref.current?.focus()}>
      {tags.map((t) => (
        <span className="tag" key={t}>{t}
          <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>✕</button>
        </span>
      ))}
      <input ref={ref} value={v} placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && v.trim()) { e.preventDefault(); setTags([...tags, v.trim()]); setV(""); }
          if (e.key === "Backspace" && !v) setTags(tags.slice(0, -1));
        }} />
    </div>
  );
}

/* ── OTP ───────────────────────────────────────────────────────────────── */
export function Otp({ length = 4, onComplete }: { length?: number; onComplete?: () => void }) {
  const [vals, setVals] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { if (vals.every(Boolean)) onComplete?.(); }, [vals, onComplete]);
  return (
    <div className="otp">
      {vals.map((v, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1} value={v}
          className={v ? "filled" : ""}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 1);
            const next = [...vals]; next[i] = d; setVals(next);
            if (d && refs.current[i + 1]) refs.current[i + 1]!.focus();
          }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !vals[i] && refs.current[i - 1]) refs.current[i - 1]!.focus(); }} />
      ))}
    </div>
  );
}

/* ── Autocomplete ──────────────────────────────────────────────────────── */
export function Autocomplete({ items, placeholder }: { items: { label: string; photo?: string }[]; placeholder?: string }) {
  const [v, setV] = useState(""); const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", h); return () => document.removeEventListener("click", h);
  }, []);
  const shown = items.filter((i) => i.label.toLowerCase().includes(v.toLowerCase()));
  return (
    <div className="ac" ref={box}>
      <input className="inp" value={v} placeholder={placeholder} onFocus={() => setOpen(true)} onChange={(e) => { setV(e.target.value); setOpen(true); }} />
      <div className={`ac-list ${open && shown.length ? "open" : ""}`}>
        {shown.map((i) => (
          <div className="ac-item" key={i.label} onClick={() => { setV(i.label); setOpen(false); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {i.photo && <img className="ava" src={i.photo} width={26} height={26} alt="" />}
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Dropzone ──────────────────────────────────────────────────────────── */
export function Dropzone({ initial = [], onAdd }: { initial?: { name: string; meta: string }[]; onAdd?: () => void }) {
  const [files, setFiles] = useState(initial);
  const [over, setOver] = useState(false);
  const push = (name: string) => { setFiles((f) => [...f, { name, meta: "Uploaded just now" }]); onAdd?.(); };
  return (
    <>
      <div className={`drop ${over ? "over" : ""}`}
        onClick={() => push("salary-slip-august.pdf")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); Array.from(e.dataTransfer.files).forEach((f) => push(f.name)); }}>
        <span className="di"><Icon name="upload" size={20} /></span>
        <b>Drop files here, or tap to browse</b>
        <span>PAN, salary slips, loan statements · PDF, JPG up to 10 MB</span>
      </div>
      <div>
        {files.map((f, i) => (
          <div className="file-row" key={f.name + i}>
            <span className="fi">{(f.name.split(".").pop() ?? "FILE").toUpperCase().slice(0, 4)}</span>
            <div><b>{f.name}</b><span>{f.meta}</span></div>
            <button className="icon-btn sm plain" style={{ marginLeft: "auto" }}
              onClick={() => setFiles(files.filter((_, x) => x !== i))} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Wizard header ─────────────────────────────────────────────────────── */
export function Wizard({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="wiz">
      {steps.map((s, i) => (
        <div key={s} className={`wiz-step ${i < current ? "done" : i === current ? "now" : ""}`}>
          <span className="wiz-dot">{i < current ? <Icon name="check" size={12} /> : i + 1}</span>
          <span className="wiz-lbl">{s}</span>
          {i < steps.length - 1 && <span className="wiz-line" />}
        </div>
      ))}
    </div>
  );
}

export function FormSection({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <>
      <div className="fsec"><span className="n">{n}</span><div><b>{title}</b><span>{sub}</span></div></div>
      <div className="fdiv" />
    </>
  );
}
