"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { brand } from "@/brand.config";
import { motionOff } from "@/lib/motion";
import Icon from "./icons";

/** Dual-panel curtain that plays on every route change. */
export default function PageWipe() {
  const path = usePathname();
  useEffect(() => {
    if (!brand.motion.pageTransitions || motionOff()) return;
    const w = document.querySelector(".wipe");
    if (!w) return;
    gsap.set(w.querySelectorAll(".panel"), { y: 0 });
    gsap.set(w.querySelector(".mark"), { opacity: 1 });
    gsap.timeline()
      .to(w.querySelector(".mark"), { opacity: 0, scale: 0.7, duration: 0.3, delay: 0.1, ease: "power2.in" })
      .to(w.querySelector(".p2"), { yPercent: -101, duration: 0.6, ease: "power4.inOut" }, "-=.08")
      .to(w.querySelector(".p1"), { yPercent: -101, duration: 0.6, ease: "power4.inOut" }, "-=.5");
  }, [path]);

  return (
    <div className="wipe">
      <div className="panel p1" /><div className="panel p2" />
      <div className="mark"><span className="brand-mark"><Icon name="grid" size={26} /></span></div>
    </div>
  );
}
