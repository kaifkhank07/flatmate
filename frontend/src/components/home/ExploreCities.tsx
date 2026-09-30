"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CityItem, useCitiesData } from "@/data/cities";
import SectionHeading from "../utils/SectionHeading";
import ArrowLink from "../utils/ArrowLink";

function CityCard({ item }: { item: CityItem }) {
  return (
    <Link
      href={`/listing?city=${item.title}`}
      className="group hover:-translate-y-1 transition-all duration-300 overflow-hidden shrink-0 w-[220px] sm:w-[260px] md:w-[280px]"
    >
      <div className="w-full h-64 sm:h-72 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 280px"
        />
      </div>

      <h3 className="mt-3 text-center font-roboto-serif text-black text-base sm:text-lg font-regular tracking-tight">
        {item.title}
      </h3>
    </Link>
  );
}

export default function ExploreCities() {
  const cities = useCitiesData();
  const trackCities = [...cities, ...cities];

  return (
    // <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
    //   <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
          <SectionHeading
            title="Find Flat & Flatmates Across India"
            description="Present in major cities and growing fast."
            className="text-black max-w-3xl"
          />

          <ArrowLink
            text="View All Cities"
            href="/cities"
            className="hidden sm:inline-flex text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
          />
        </div>
      </div>

      {/* Auto-loop marquee container with fade overlays */}
      <div className="relative w-full overflow-hidden mt-8 sm:mt-10 py-2">
        {/* Left & Right Fade Overlays */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 z-10 bg-gradient-to-r from-white/50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 z-10 bg-gradient-to-l from-white/50 to-transparent" />

        <div className="animate-marquee-cities flex items-center gap-6 sm:gap-8 cursor-pointer">
          {trackCities.map((item, index) => (
            <CityCard key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-8 px-4 sm:hidden">
        <ArrowLink
          text="View All Cities"
          href="/cities"
          className="flex sm:hidden w-fit mx-auto text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
        />
      </div>

      <style>{`
          @keyframes marqueeCities {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-cities {
            display: flex;
            width: max-content;
            animation: marqueeCities 35s linear infinite;
            will-change: transform;
          }
          .animate-marquee-cities:hover {
            animation-play-state: paused;
          }
        `}</style>
    </section>
  );
}
