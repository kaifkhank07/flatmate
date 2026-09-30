"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SequenceRevealProps {
  children: React.ReactNode;

  /** Animation duration for each child in seconds */
  duration?: number;

  /** Delay between each child's animation */
  stagger?: number;

  /** ScrollTrigger start position */
  start?: string;

  /** Initial Y position */
  distance?: number;

  /** Initial opacity */
  initialOpacity?: number;

  /** GSAP easing */
  ease?: string;

  /** Replay animation when scrolling back */
  replayOnScroll?: boolean;

  /** Extra wrapper classes */
  className?: string;
}

export default function SequenceReveal({
  children,
  duration = 0.8,
  stagger = 0.1,
  start = "top 85%",
  distance = 40,
  initialOpacity = 0,
  ease = "power3.out",
  replayOnScroll = false,
  className = "",
}: SequenceRevealProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) return;

    const ctx = gsap.context(() => {
      const items = Array.from(wrapper.children) as HTMLElement[];

      if (!items.length) return;

      // Initial state
      gsap.set(items, {
        opacity: initialOpacity,
        y: distance,
        scale: 0.98,
        willChange: "transform, opacity",
      });

      const animation = gsap.to(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        ease,
        stagger: {
          each: stagger,
          from: "start",
        },
        paused: true,
        onComplete: () => {
          gsap.set(items, {
            clearProps: "willChange",
          });
        },
      });

      ScrollTrigger.create({
        trigger: wrapper,
        start,
        once: !replayOnScroll,

        invalidateOnRefresh: true,

        onEnter: () => {
          animation.restart();
        },

        onEnterBack: () => {
          if (replayOnScroll) {
            animation.restart();
          }
        },

        onLeave: () => {
          if (replayOnScroll) {
            animation.pause(0);
          }
        },
      });
    }, wrapper);

    return () => {
      ctx.revert();
    };
  }, [
    duration,
    stagger,
    start,
    distance,
    initialOpacity,
    ease,
    replayOnScroll,
  ]);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
}