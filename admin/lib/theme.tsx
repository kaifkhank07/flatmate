"use client";
import { useCallback, useEffect, useState } from "react";

/** Dark-mode toggle. Persists to localStorage, applied on <html data-theme>. */
export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ls-theme") : null;
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      try { localStorage.setItem("ls-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  return { dark, toggle };
}
