"use client";

import React from "react";
import { useAssets } from "@/data/assets";
import ViewReveal from "@/components/animation/ViewReveal";

interface HeroProps {
  tagline?: string;
  title: string;
  backgroundImage?: string;
  className?: string;
  maxContentWidth?: string;
}

export default function Hero({
  tagline,
  title,
  backgroundImage,
  className = "",
  maxContentWidth = "max-w-3xl"
}: HeroProps) {
  const assets = useAssets();
  const bgImage = backgroundImage || assets.homeherobg;

  return (
    <section
      id="hero-utils"
      className={`relative w-full h-[85vh] overflow-hidden bg-zinc-950 text-white ${className}`}
    >
      {/* HERO BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
        aria-hidden="true"
      />

      {/* OVERLAY GRADIENT */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 via-black/40 to-transparent" aria-hidden="true" />

      {/* MAIN HERO CONTENT (NO NAVBAR) */}
      <div className="absolute inset-0 flex flex-col justify-end w-full px-4 sm:px-6 md:px-16 pb-28 md:pb-20 max-w-8xl 3xl:max-w-[1450px] mx-auto">
        <div className={`${maxContentWidth} flex flex-col items-start justify-end space-y-2 sm:space-y-3`}>
          {/* GOLD TAGLINE */}
          {tagline && (
            <ViewReveal duration={1000} startDelay={100}>
              <span className="text-[#F4AB2A] text-xs sm:text-sm md:text-base font-medium tracking-[0.15em] sm:tracking-[0.2em] uppercase lg:ml-1">
                {tagline}
              </span>
            </ViewReveal>
          )}

          {/* MAIN HEADING */}
          {title && (
            <ViewReveal duration={1200} startDelay={300}>
              <h1 className="text-white text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-roboto-serif font-normal leading-[1.15] sm:leading-[1.1] tracking-tight">
                {title}
              </h1>
            </ViewReveal>
          )}
        </div>
      </div>
    </section>
  );
}
