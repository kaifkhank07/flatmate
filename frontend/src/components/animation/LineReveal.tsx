"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface LineRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  duration?: number;
  delay?: number;
  stagger?: number;
  start?: string;
  ease?: string;
  replayOnScroll?: boolean;
}

/**
 * LineReveal: Splits text dynamically into visual lines and animates them line-by-line out of overflow masks.
 */
export default function LineReveal({
  text,
  as: Component = "h2",
  className = "",
  duration = 1.2,
  delay = 0,
  stagger = 0.18,
  start = "top 85%",
  ease = "power4.out",
  replayOnScroll = false,
}: LineRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const headingEl = containerRef.current;
    if (!headingEl || !text) return;

    let ctx: gsap.Context;

    const setupLinesAnimation = () => {
      if (ctx) ctx.revert();

      ctx = gsap.context(() => {
        const words = text.trim().split(/\s+/);
        headingEl.innerHTML = words
          .map(
            (word) =>
              `<span class="line-word" style="display: inline-block; margin-right: 0.25em;">${word}</span>`
          )
          .join("");

        const wordSpans = headingEl.querySelectorAll(".line-word");
        const linesMap: { [key: number]: HTMLElement[] } = {};

        wordSpans.forEach((span) => {
          const top = (span as HTMLElement).offsetTop;
          if (!linesMap[top]) {
            linesMap[top] = [];
          }
          linesMap[top].push(span as HTMLElement);
        });

        headingEl.innerHTML = "";
        Object.keys(linesMap).forEach((key) => {
          const lineContainer = document.createElement("div");
          lineContainer.className = "line-mask block overflow-hidden py-1";

          const lineInner = document.createElement("span");
          lineInner.className =
            "line-inner inline-block transform translate-y-full opacity-0 will-change-transform";

          linesMap[Number(key)].forEach((span) => {
            lineInner.appendChild(span);
          });

          lineContainer.appendChild(lineInner);
          headingEl.appendChild(lineContainer);
        });

        const lines = headingEl.querySelectorAll(".line-inner");

        gsap.to(lines, {
          y: "0%",
          opacity: 1,
          duration,
          delay,
          stagger,
          ease,
          scrollTrigger: {
            trigger: headingEl,
            start,
            toggleActions: replayOnScroll ? "play reverse play reverse" : "play none none none",
          },
        });
      }, containerRef);
    };

    setupLinesAnimation();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setupLinesAnimation();
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.revert();
    };
  }, [text, duration, delay, stagger, start, ease, replayOnScroll]);

  return (
    <Component ref={containerRef as any} className={className}>
      {text}
    </Component>
  );
}
