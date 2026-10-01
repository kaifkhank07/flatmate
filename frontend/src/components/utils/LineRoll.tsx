"use client";

import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";

interface LineRollProps {
    text: string;
    className?: string;
    lineClassName?: string;
    showDefaultLine?: boolean;
}

/**
 * LineRoll component:
 * - If showDefaultLine is true, underline is visible by default and rolls on hover.
 * - If showDefaultLine is false, underline is hidden by default and animates in/out on hover.
 *
 * Can be used directly or inside a parent .group.
 */
export default function LineRoll({
    text,
    className = "",
    lineClassName = "bg-text",
    showDefaultLine = false,
}: LineRollProps) {
    const underline = useRef<HTMLSpanElement>(null);
    const hoverTl = useRef<gsap.core.Timeline | null>(null);

    useLayoutEffect(() => {
        if (!underline.current) return;

        gsap.set(underline.current, {
            xPercent: showDefaultLine ? 0 : -100,
        });
    }, [showDefaultLine]);

    const handleMouseEnter = () => {
        if (!underline.current) return;
        if (hoverTl.current) hoverTl.current.kill();

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        if (showDefaultLine) {
            tl.to(underline.current, {
                xPercent: 100,
                duration: 0.38,
                ease: "power2.inOut",
            })
                .set(underline.current, {
                    xPercent: -100,
                })
                .to(underline.current, {
                    xPercent: 0,
                    duration: 0.7,
                    ease: "expo.out",
                });
        } else {
            tl.to(underline.current, {
                xPercent: 0,
                duration: 0.45,
                ease: "expo.out",
            });
        }

        hoverTl.current = tl;
    };

    const handleMouseLeave = () => {
        if (!underline.current) return;

        if (!showDefaultLine) {
            if (hoverTl.current) hoverTl.current.kill();
            const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

            tl.to(underline.current, {
                xPercent: 100,
                duration: 0.35,
            }).set(underline.current, {
                xPercent: -100,
            });

            hoverTl.current = tl;
        }
    };

    return (
        <span
            className={`group relative inline-block overflow-hidden leading-tight align-bottom ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span className="block pointer-events-none mb-0.5">{text}</span>

            {/* Underline */}
            <span className="absolute left-0 bottom-0 w-full h-[2px] overflow-hidden pointer-events-none">
                <span
                    ref={underline}
                    className={`absolute inset-0 ${lineClassName}`}
                />
            </span>
        </span>
    );
}
