"use client";

import React from "react";
import ViewReveal from "@/components/animation/ViewReveal";

interface BrandHeadingProps {
  title: string;
  description?: string;
  timeline?: string;
  className?: string;
}

export default function BrandHeading({
  title,
  description,
  timeline,
  className = "",
}: BrandHeadingProps) {
  return (
    <div className={`w-full ${className}`}>
      <ViewReveal duration={1200} startDelay={0}>
        <h1 className="text-center text-text-white/75 whitespace-nowrap text-[32px] sm:text-[36px] md:text-[64px] lg:text-[144px] font-roboto-serif font-semibold leading-none -tracking-[0.03em]">
          {title}
        </h1>
      </ViewReveal>
      {description && (
        <ViewReveal duration={1200} startDelay={900}>
          <p className="text-center lg:text-left text-text-white text-lg md:text-xl font-light leading-[1.65] tracking-wide mt-2">
            {description}
          </p>
        </ViewReveal>
      )}
      {timeline && (
        <ViewReveal duration={1200} startDelay={900}>
          <p className="text-center lg:text-right text-white font-light">{timeline}</p>
        </ViewReveal>
      )}
    </div>
  );
}
