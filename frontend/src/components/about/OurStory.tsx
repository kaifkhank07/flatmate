"use client";

import React from "react";
import { useAssets } from "@/data/assets";
import SectionHeading from "../utils/SectionHeading";
import { AnimatedImage } from "../animation";

export default function OurStory() {
  const assets = useAssets();

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-0">
        {/* Left Column - Text Content */}
        <div className="space-y-4 sm:space-y-6">
          <SectionHeading title="Our Story" />

          <div className="space-y-4">
            <p className="text-black text-base md:text-lg lg:text-xl font-regular leading-relaxed">
              It all started with a simple, frustrating reality: finding a decent flat and a compatible flatmate in the city felt harder than it needed to be.
              Between endless broker fees, misleading photos, and awkward living situations with incompatible roommates, we knew there had to be a better way. We wanted a platform where transparency comes first, where finding a place to live feels exciting rather than exhausting, and where safety isn’t an afterthought.
            </p>

            <p className="text-black text-base md:text-lg lg:text-xl font-regular leading-relaxed">
              So, we built Flat & Flatmate.
              We set out to create more than just a real estate directory. Flat & Flatmate is a community-first ecosystem designed for modern professionals, students, and urban movers. We combine verified property listings with lifestyle-based roommate matching—helping you filter by work habits, sleep schedules, and living preferences so you don't just find a room, you find people you actually enjoy living with.
              Today, we’re proud to help thousands of people skip the middleman, cut out broker markups, and move into spaces where they feel safe, settled, and right at home.
            </p>
          </div>
        </div>

        {/* Right Column - Portrait Image */}
        <div className="relative w-full lg:pl-12">
          <div className="relative w-full rounded-2xl sm:rounded-3xl lg:rounded-4xl overflow-hidden shadow-lg aspect-[4/3] sm:aspect-[1.15/1]">
            <AnimatedImage
              src={assets.ourstory}
              alt="Community That Grows Together"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
