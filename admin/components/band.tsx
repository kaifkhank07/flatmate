"use client";
import type { ReactNode } from "react";

export type BandMetric = { label: string; value: string; count?: string; prefix?: string; suffix?: string };
export type BandTile = { icon: ReactNode; value: string; label: string; count?: string; prefix?: string; suffix?: string };

/**
 * The dark hero that opens every page: aurora blobs, film grain,
 * parallax rings, counting metrics and glass tiles.
 */
export default function Band({ eyebrow, title, body, metrics = [], tiles = [], bar }: {
  eyebrow: string; title: string; body: string;
  metrics?: BandMetric[]; tiles?: BandTile[];
  bar?: { pct: number; left: string; right: string };
}) {
  return (
    <div className="band gs">
      <div className="aur a1" /><div className="aur a2" /><div className="aur a3" />
      <div className="rings"><i /><i /><i /></div>
      <div className="band-inner">
        <div>
          <div className="band-eyebrow">{eyebrow}</div>
          <h2 dangerouslySetInnerHTML={{ __html: title }} />
          <p>{body}</p>
          <div className="band-metrics">
            {metrics.map((m) => (
              <div className="bm" key={m.label}>
                <span>{m.label}</span>
                <b className="num" data-count={m.count} data-prefix={m.prefix} data-suffix={m.suffix}>{m.value}</b>
              </div>
            ))}
          </div>
          {bar && (
            <>
              <div className="band-bar"><i data-w={bar.pct} /></div>
              <div className="band-foot"><span>{bar.left}</span><span>{bar.right}</span></div>
            </>
          )}
        </div>
        <div className="band-side">
          {tiles.map((t) => (
            <div className="glass-tile" key={t.label}>
              <span className="gi">{t.icon}</span>
              <div>
                <b className="num" data-count={t.count} data-prefix={t.prefix} data-suffix={t.suffix}>{t.value}</b>
                <span>{t.label}</span>
              </div>
              <svg className="mini" width="70" height="30" viewBox="0 0 70 30">
                <path className="draw-line" d="M0 24 L14 19 L28 22 L42 12 L56 15 L70 6"
                  fill="none" stroke="var(--ember-2)" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
