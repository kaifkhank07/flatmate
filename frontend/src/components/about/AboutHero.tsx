"use client";

import React from "react";
import Image from "next/image";
import ViewReveal from "@/components/animation/ViewReveal";
import { useAssets } from "@/data/assets";
import SectionHeading from "../utils/SectionHeading";

export default function AboutHero() {
  const assets = useAssets();

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto">
        <ViewReveal duration={800}>
          {/* Header Top Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-12">
            {/* Left Title */}
            <SectionHeading
              title="About flat & flatmate"
              className="text-black uppercase max-w-xl"
            />

            {/* Right Subtitle */}
            <p className="text-black text-sm sm:text-base md:text-lg lg:text-xl font-regular leading-relaxed max-w-md lg:max-w-lg md:text-right">
              We Connect Verified Working Professionals And Students With Hassle-Free Shared Apartments And Compatible Roomies. No Broker Drama, No Hidden Fees.
            </p>
          </div>
        </ViewReveal>

        {/* Hero Image */}
        <ViewReveal duration={900} startDelay={150} className="mt-8 sm:mt-12">
          <div className="relative w-full h-[280px] sm:h-[400px] md:h-[500px] lg:h-[580px] rounded-2xl sm:rounded-3xl md:rounded-[36px] overflow-hidden shadow-sm border border-gray-100/80">
            <Image
              src={assets.aboutbg}
              alt="About Flat & Flatmate"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1200px) 100vw, 1450px"
            />
          </div>
        </ViewReveal>
      </div>
    </section>
  );
}
