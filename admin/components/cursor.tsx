"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { brand } from "@/brand.config";
import { motionOff } from "@/lib/motion";

/** Dot + trailing ring that grows over interactive elements. Desktop only. */
export default function Cursor() {
  useEffect(() => {
    if (!brand.motion.customCursor || motionOff() || !matchMedia("(pointer:fine)").matches) return;
    const dot = Object.assign(document.createElement("div"), { className: "cur-dot" });
    const ring = Object.assign(document.createElement("div"), { className: "cur-ring" });
    document.body.append(dot, ring);
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.32, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.32, ease: "power3" });
    const move = (e: MouseEvent) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); };
    const sel = "a,button,tr,.kb-card,.status-tile,.cal-day,input,select,textarea";
    const over = (e: Event) => (e.target as HTMLElement).closest(sel) && ring.classList.add("hover");
    const out = (e: Event) => (e.target as HTMLElement).closest(sel) && ring.classList.remove("hover");
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      dot.remove(); ring.remove();
    };
  }, []);
  return null;
}
