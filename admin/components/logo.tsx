"use client";
import { useState } from "react";
import { brand } from "@/brand.config";

type Props = { variant?: "light" | "dark"; className?: string; height?: number };

/**
 * Renders the configured logo with an automatic wordmark fallback.
 * `variant="dark"` = the asset that sits on the DARK sidebar.
 */
export default function Logo({ variant = "dark", className = "", height }: Props) {
  const [failed, setFailed] = useState(false);
  const src = variant === "dark" ? brand.logo.dark : brand.logo.light;
  // Dark artwork on the dark sidebar → flip to white.
  const invert = variant === "dark" && brand.logo.invertOnDark;

  if (!src || failed) {
    return (
      <span className="brand-fallback" style={{ display: "flex" }}>
        <span className="brand-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>
        <span>{brand.name}</span>
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={brand.name}
      className={`brand-logo ${invert ? "invert" : ""} ${className}`}
      style={{ ...(height ? { height } : {}), ...(invert ? { filter: "brightness(0) invert(1)" } : {}) }}
      onError={() => setFailed(true)}
    />
  );
}
