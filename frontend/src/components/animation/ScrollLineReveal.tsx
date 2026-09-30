"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollLineRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;

  lineOpacity?: number;
  scrub?: number;
  lineScrollDistance?: number;

  start?: string;
  end?: string;
  triggerSelector?: string;
  pin?: boolean;
  pinSpacing?: boolean;
  refreshPriority?: number;
}

export default function ScrollLineReveal({
  text,
  as: Component = "h2",
  className = "",

  lineOpacity = 0.2,
  scrub = 1.2,
  lineScrollDistance = 120,

  start = "top top",
  end,
  triggerSelector,
  pin = true,
  pinSpacing = true,
  refreshPriority = -1,
}: ScrollLineRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const element = containerRef.current;

    if (!element || !text?.trim()) return;

    let destroyed = false;
    let ctx: gsap.Context | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let revertSplit: (() => void) | null = null;

    const originalText = text;

    const cleanup = () => {
      if (ctx) {
        ctx.revert();
        ctx = null;
      }

      if (revertSplit) {
        revertSplit();
        revertSplit = null;
      }
    };

    const splitIntoLines = () => {
      /*
       * Restore original text before rebuilding.
       */
      element.textContent = originalText;

      /*
       * Create word spans.
       *
       * Each word remains inline-block so the browser can determine
       * the actual visual line wrapping.
       */
      const words = originalText.trim().split(/\s+/);

      element.innerHTML = words
        .map(
          (word) =>
            `<span class="scroll-line-word" style="display:inline-block;margin-right:0.25em;">${word}</span>`
        )
        .join("");

      const wordSpans =
        element.querySelectorAll<HTMLElement>(".scroll-line-word");

      if (!wordSpans.length) {
        element.textContent = originalText;
        return [];
      }

      /*
       * Force browser layout calculation.
       */
      void element.offsetWidth;
      void element.offsetHeight;

      /*
       * Group words according to their actual visual top position.
       */
      const linesMap = new Map<number, HTMLElement[]>();

      wordSpans.forEach((word) => {
        const rect = word.getBoundingClientRect();

        /*
         * Small rounding prevents sub-pixel differences from
         * creating unnecessary lines.
         */
        const top = Math.round(rect.top);

        const currentLine = linesMap.get(top);

        if (currentLine) {
          currentLine.push(word);
        } else {
          linesMap.set(top, [word]);
        }
      });

      /*
       * Rebuild the element using visual line containers.
       */
      element.innerHTML = "";

      Array.from(linesMap.values()).forEach((lineWords) => {
        const lineContainer = document.createElement("span");

        lineContainer.className =
          "scroll-line-container block w-full text-center";

        const line = document.createElement("span");

        line.className =
          "scroll-line inline-block will-change-transform";

        lineWords.forEach((word, idx) => {
          if (idx === lineWords.length - 1) {
            word.style.marginRight = "0";
          }
          line.appendChild(word);
        });

        lineContainer.appendChild(line);
        element.appendChild(lineContainer);
      });

      return Array.from(
        element.querySelectorAll<HTMLElement>(".scroll-line")
      );
    };

    const createAnimation = () => {
      if (destroyed) return;

      cleanup();

      /*
       * Check reduced-motion preference.
       */
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        element.textContent = originalText;
        return;
      }

      /*
       * Make sure the browser has calculated the current layout
       * before detecting visual lines.
       */
      void element.offsetWidth;
      void element.offsetHeight;

      const lines = splitIntoLines();

      if (!lines.length || destroyed) {
        element.textContent = originalText;
        return;
      }

      /*
       * Create GSAP animation.
       */
      ctx = gsap.context(() => {
        /*
         * Every line starts partially visible.
         */
        gsap.set(lines, {
          opacity: lineOpacity,
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: triggerSelector ? document.querySelector(triggerSelector) : element,

            start,

            /*
             * Scroll distance depends on the number of visual lines, unless explicitly overridden.
             */
            end: end || `+=${lines.length * lineScrollDistance}`,

            /*
             * Vertical scrolling controls the timeline.
             */
            scrub,

            /*
             * Pin the text while the lines are being revealed.
             */
            pin,

            pinSpacing,

            /*
             * Recalculate when ScrollTrigger.refresh() occurs.
             */
            invalidateOnRefresh: true,

            refreshPriority,

            anticipatePin: 1,

            markers: false,
          },
        });

        /*
         * Reveal lines sequentially.
         *
         * The "-0.25" overlap keeps the transition between
         * lines smooth instead of making each line wait completely.
         */
        lines.forEach((line) => {
          timeline.to(
            line,
            {
              opacity: 1,
              duration: 1,
              ease: "none",
            },
            ">-0.25"
          );
        });
      }, element);
    };

    const initialize = async () => {
      if (destroyed) return;

      /*
       * Wait for fonts because font metrics affect line wrapping.
       */
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Continue if font loading fails.
      }

      if (destroyed) return;

      /*
       * Wait for the browser to finish layout/paint.
       */
      requestAnimationFrame(() => {
        if (destroyed) return;

        requestAnimationFrame(() => {
          if (destroyed) return;

          createAnimation();

          /*
           * Make ScrollTrigger recalculate after the DOM
           * has been rebuilt.
           */
          requestAnimationFrame(() => {
            if (!destroyed) {
              ScrollTrigger.refresh();
            }
          });
        });
      });
    };

    initialize();

    /*
     * Rebuild when the text width changes.
     */
    let lastWidth = element.getBoundingClientRect().width;

    const scheduleResize = () => {
      if (destroyed) return;

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(() => {
        if (destroyed) return;

        const newWidth = element.getBoundingClientRect().width;

        /*
         * Don't rebuild if width didn't actually change.
         */
        if (Math.abs(newWidth - lastWidth) < 1) {
          return;
        }

        lastWidth = newWidth;

        createAnimation();

        requestAnimationFrame(() => {
          if (!destroyed) {
            ScrollTrigger.refresh();
          }
        });
      }, 150);
    };

    window.addEventListener("resize", scheduleResize);

    /*
     * ResizeObserver handles layout changes that don't come
     * directly from window resizing.
     */
    const resizeObserver = new ResizeObserver(() => {
      scheduleResize();
    });

    resizeObserver.observe(element);

    return () => {
      destroyed = true;

      window.removeEventListener("resize", scheduleResize);

      resizeObserver.disconnect();

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      cleanup();

      /*
       * Refresh remaining ScrollTriggers after this component
       * has been removed.
       */
      requestAnimationFrame(() => {
        if (typeof window !== "undefined") {
          ScrollTrigger.refresh();
        }
      });
    };
  }, [
    text,
    lineOpacity,
    scrub,
    lineScrollDistance,
    start,
    pin,
    pinSpacing,
    refreshPriority,
  ]);

  return React.createElement(Component, {
    ref: containerRef,
    className,
  }, text);
}