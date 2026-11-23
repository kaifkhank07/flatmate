"use client";

import React from "react";
import { useAssets } from "@/data/assets";
import SearchSection from "@/components/home/SearchSection";
import { ViewReveal, LineReveal } from "../animation";

export default function Hero() {
  const assets = useAssets();

  return (
    <section
      id="hero"
      className="relative min-h-screen h-screen flex flex-col lg:justify-between gap-4 sm:gap-6 md:gap-8 lg:gap-12 overflow-hidden pt-40 sm:pt-60 lg:pt-32 pb-4 sm:pb-6 lg:pb-8"
    >
      {/* HERO BACKGROUND IMAGE */}
      {/* <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${assets.homeherobg})`,
        }}
        aria-hidden="true"
      /> */}

      <picture className="absolute inset-0" aria-hidden="true">
        <source
          media="(max-width: 767px)"
          srcSet={assets.homeherobgmobile}
        />
        <img
          src={assets.homeherobg}
          alt=""
          className="w-full h-full object-cover object-center"
        />
      </picture>

      {/* OVERLAY */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-black/40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Middle Hero Content: Heading & Supporting Text */}
      <div className="relative z-10 w-full max-w-8xl 3xl:max-w-[1450px] mx-auto lg:mt-auto px-4 sm:px-6 lg:px-16 space-y-4 sm:space-y-6 md:space-y-8">
        {/* White Heading Card */}
        <ViewReveal duration={800} startDelay={100}>
          <div className="bg-white rounded-2xl sm:rounded-4xl p-6 sm:p-8 md:py-10 w-fit">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] leading-[1.15] tracking-tight">
              <span className="text-brand-dark font-medium">Find Your </span>
              <span className="text-brand-dark font-bold">Home.</span>
            </h1>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] leading-[1.15] tracking-tight mt-1 sm:mt-2">
              <span className="text-brand-blue font-medium">Find Your </span>
              <span className="text-brand-blue font-bold">People.</span>
            </h1>
          </div>
        </ViewReveal>

        {/* Supporting Text */}
        <LineReveal
          as="p"
          text="Verified Homes, Compatible Flatmates, And A Community That Feels Like Home."
          className="text-white text-base sm:text-lg md:text-xl lg:text-[22px] font-semibold leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] max-w-2xl tracking-tight"
          delay={0.3}
          start="top 90%"
        />
      </div>

      {/* Bottom Search Section */}
      <ViewReveal
        duration={700}
        startDelay={300}
        slideDistance={25}
        threshold={0.01}
        className="w-full relative z-20"
      >
        <SearchSection />
      </ViewReveal>
    </section>
  );
}
