"use client";
import type { ReactNode } from "react";
import Icon from "./icons";

export type Tone = "iris" | "mint" | "rose" | "sea" | "sand" | "amber" | "gold" | "accent" | "ember";

export function Card({ children, className = "", span, hoverable }: {
  children: ReactNode; className?: string; span?: 2 | 3 | 4 | 6; hoverable?: boolean;
}) {
  return (
    <div className={`card gs ${span ? `b${span}` : ""} ${hoverable ? "hoverable" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <span className="card-title">{title}</span>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function Chip({ tone = "iris", children, dot, pulse }: {
  tone?: Tone | "line" | "white" | "glass"; children: ReactNode; dot?: boolean; pulse?: boolean;
}) {
  return (
    <span className={`chip ${tone}`}>
      {dot && <span className={`dot ${pulse ? "pulse" : ""}`} />}
      {children}
    </span>
  );
}

export function IconBtn({ name, onClick, variant = "", size = "", label }: {
  name: string; onClick?: () => void; variant?: "dark" | "plain" | ""; size?: "sm" | ""; label?: string;
}) {
  return (
    <button className={`icon-btn ${variant} ${size}`} onClick={onClick} aria-label={label ?? name}>
      <Icon name={name} size={size === "sm" ? 13 : 15} />
    </button>
  );
}

export function Avatar({ name, src, size = 40, ring, className = "" }: {
  name?: string; src?: string; size?: number; ring?: boolean; className?: string;
}) {
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img className={`ava ${ring ? "ring" : ""} ${className}`} src={src} width={size} height={size} alt={name || ""} loading="lazy" />;
  }

  const initial = (name || "U").trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-black/20 text-sm font-semibold aspect-square ${ring ? "ring" : ""} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.floor(size * 0.38)) }}
    >
      {initial}
    </div>
  );
}

export function PageHead({ eyebrow, title, sub, actions }: {
  eyebrow?: string; title: string; sub?: string; actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title" dangerouslySetInnerHTML={{ __html: title }} />
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  );
}

export function SelectPill({ children }: { children: ReactNode }) {
  return <button className="select-pill">{children}<Icon name="chev" size={10} /></button>;
}
