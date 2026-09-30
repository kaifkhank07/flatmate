"use client";

import React from "react";
import Image from "next/image";
import { useAssets } from "@/data/assets";
import ArrowLink from "../utils/ArrowLink";

export default function JoinCommunityBanner() {
  const assets = useAssets();

  return (
    <section className="relative w-full h-[420px] sm:h-[480px] md:h-[520px] lg:h-[580px] overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <Image
        src={assets.ctabg || "/assets/Images/ctabg.png"}
        alt="Join The Flat & Flatmates Community"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-6">
        <h2 className="font-roboto-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight">
          Join The <span className="font-bold">Flat & Flatmates</span> Community
        </h2>

        <p className="text-sm sm:text-base md:text-lg font-regular text-white/90 tracking-wide max-w-2xl mx-auto">
          Find Your Space. Find Your People. Belong.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
          <ArrowLink
            text="Find a Home"
            href="/listing"
            lineClassName="bg-black"
            className="bg-white text-black font-medium text-xs sm:text-sm px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-gray-100 shadow-md"
          />

          <ArrowLink
            text="Find a Flatmate"
            href="/community"
            lineClassName="bg-white"
            className="bg-transparent text-white font-medium text-xs sm:text-sm px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-white hover:bg-white/10"
          />
        </div>
      </div>
    </section>
  );
}
