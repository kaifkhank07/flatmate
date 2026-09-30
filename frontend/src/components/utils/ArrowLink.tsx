"use client";

import React, { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";

interface ArrowLinkProps {
  href: string;
  text: string;
  className?: string;
  lineClassName?: string;
  showDefaultLine?: boolean;
  showArrow?: boolean;
}

export default function ArrowLink({
  href,
  text,
  className = "",
  lineClassName = "bg-current",
  showDefaultLine = false,
  showArrow = false,
}: ArrowLinkProps) {
  const arrow1 = useRef<HTMLSpanElement>(null);
  const arrow2 = useRef<HTMLSpanElement>(null);
  const underline = useRef<HTMLSpanElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (showArrow && arrow1.current && arrow2.current) {
      gsap.set(arrow1.current, {
        x: 0,
        y: 0,
        opacity: 1,
      });

      gsap.set(arrow2.current, {
        x: -18,
        y: 18,
        opacity: 0,
      });
    }

    if (underline.current) {
      gsap.set(underline.current, {
        xPercent: showDefaultLine ? 0 : -100,
      });
    }
  }, [showDefaultLine, showArrow]);

  const handleMouseEnter = () => {
    if (hoverTl.current) {
      hoverTl.current.kill();
    }

    const tl = gsap.timeline({
      defaults: {
        ease: "power4.out",
      },
    });

    // Arrow animation (only executed if showArrow is true)
    if (showArrow && arrow1.current && arrow2.current) {
      tl.to(
        arrow1.current,
        {
          x: 22,
          y: -22,
          opacity: 0,
          duration: 0.45,
        },
        0
      ).to(
        arrow2.current,
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.45,
        },
        0
      );
    }

    // Underline animation
    if (underline.current) {
      if (showDefaultLine) {
        tl.to(
          underline.current,
          {
            xPercent: 100,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.05
        )
          .set(underline.current, {
            xPercent: -100,
          })
          .to(underline.current, {
            xPercent: 0,
            duration: 0.5,
            ease: "expo.out",
          });
      } else {
        tl.to(
          underline.current,
          {
            xPercent: 0,
            duration: 0.45,
            ease: "expo.out",
          },
          0.05
        );
      }
    }

    hoverTl.current = tl;
  };

  const handleMouseLeave = () => {
    if (hoverTl.current) {
      hoverTl.current.kill();
    }

    const tl = gsap.timeline({
      defaults: {
        ease: "power2.inOut",
      },
    });

    // Reset arrows (only executed if showArrow is true)
    if (showArrow && arrow1.current && arrow2.current) {
      tl.to(
        arrow1.current,
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.35,
        },
        0
      ).to(
        arrow2.current,
        {
          x: -18,
          y: 18,
          opacity: 0,
          duration: 0.35,
        },
        0
      );
    }

    // Reset underline
    if (!showDefaultLine && underline.current) {
      tl.to(
        underline.current,
        {
          xPercent: 100,
          duration: 0.3,
        },
        0
      ).set(underline.current, {
        xPercent: -100,
      });
    }

    hoverTl.current = tl;
  };

  const hasDisplayClass = /\b(hidden|flex|inline-flex|block|inline-block|grid|inline-grid)\b/.test(className);
  const displayClass = hasDisplayClass ? "" : "inline-flex";

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${displayClass} items-center justify-center font-medium transition-all duration-300 active:scale-95 cursor-pointer ${className}`}
    >
      <span className="relative inline-flex items-center justify-center gap-2">
        {/* Text */}
        <span className="relative z-10 whitespace-nowrap">
          {text}
        </span>

        {/* Animated Arrow */}
        {showArrow && (
          <span className="relative w-[20px] h-[20px] overflow-hidden shrink-0 z-10">
            <span
              ref={arrow1}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </span>

            <span
              ref={arrow2}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </span>
          </span>
        )}

        {/* Animated Bottom Line */}
        <span className="absolute left-0 right-0 bottom-0 h-[1.5px] overflow-hidden pointer-events-none">
          <span
            ref={underline}
            className={`absolute inset-0 ${lineClassName}`}
          />
        </span>
      </span>
    </Link>
  );
}
