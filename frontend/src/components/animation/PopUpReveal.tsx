"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface PopUpRevealProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  scale?: number;
  y?: number;
  ease?: string;
  start?: string;
  className?: string;
  replayOnScroll?: boolean;
}

/**
 * PopUpReveal component:
 * Animates children with a smooth spring scale and pop-up transition on scroll or delay.
 */
export default function PopUpReveal({
  children,
  duration = 0.7,
  delay = 0,
  scale = 0.7,
  y = 25,
  ease = "back.out(1.7)",
  start = "top 85%",
  className = "",
  replayOnScroll = false,
}: PopUpRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.set(el, {
        scale,
        opacity: 0,
        y,
      });

      gsap.to(el, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: replayOnScroll
            ? "play reverse play reverse"
            : "play none none none",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [duration, delay, scale, y, ease, start, replayOnScroll]);

  return (
    <div ref={containerRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
