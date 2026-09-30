"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SectionHeadingProps {
  heading?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  animateTitle?: boolean;
}

export default function SectionHeading({
  heading,
  title,
  description,
  align = "left",
  className = "text-black",
  animateTitle = false,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const pingRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (pingRef.current) {
        gsap.to(pingRef.current, {
          scale: 2.2,
          opacity: 0,
          duration: 1.5,
          repeat: -1,
          ease: "power2.out",
        });
      }

      if (dotRef.current) {
        gsap.to(dotRef.current, {
          scale: 1.2,
          opacity: 0.7,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (animateTitle && titleRef.current && title) {
        const headingEl = titleRef.current;
        const originalText = title;

        const words = originalText.trim().split(/\s+/);
        headingEl.innerHTML = words
          .map(
            (word) =>
              `<span class="heading-word" style="display: inline-block; margin-right: 0.22em;">${word}</span>`
          )
          .join("");

        const wordSpans = headingEl.querySelectorAll(".heading-word");
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
          lineContainer.className = "line-container";
          lineContainer.style.overflow = "hidden";
          lineContainer.style.display = "block";

          const lineInner = document.createElement("span");
          lineInner.className = "heading-line inline-block";

          linesMap[Number(key)].forEach((span) => {
            lineInner.appendChild(span);
          });

          lineContainer.appendChild(lineInner);
          headingEl.appendChild(lineContainer);
        });

        const lines = headingEl.querySelectorAll(".heading-line");
        gsap.set(lines, { yPercent: 100, opacity: 0 });

        gsap.to(lines, {
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.15,
          ease: "power4.out",
          scrollTrigger: {
            trigger: headingEl,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    });

    return () => ctx.revert();
  }, [animateTitle, title]);

  return (
    <div className={`w-full space-y-2 ${isCenter ? "text-center" : "text-left"} ${className}`}>
      {heading && (
        <div className={`flex items-center gap-2 ${isCenter ? "justify-center" : "justify-start"}`}>
          <span className="text-base sm:text-lg font-regular tracking-[0.2em] uppercase">
            {heading}
          </span>
        </div>
      )}

      <div className="space-y-4">
        {title && (
          <h2
            ref={titleRef}
            className={`font-roboto-serif font-medium tracking-tight leading-tight text-4xl md:text-5xl`}
          >
            {title}
          </h2>
        )}
        {description && (
          <p className={`font-regular leading-relaxed max-w-2xl text-base md:text-xl ${isCenter ? "mx-auto text-center" : "text-left"}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
