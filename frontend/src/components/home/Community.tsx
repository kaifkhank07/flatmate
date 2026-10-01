"use client";

import React from "react";
import { useAssets } from "@/data/assets";
import SectionHeading from "../utils/SectionHeading";
import ArrowLink from "../utils/ArrowLink";
import { AnimatedImage, PopUpReveal } from "../animation";

export default function Community() {
  const assets = useAssets();

  return (
    <section className="w-full py-8 md:py-12 px-4 sm:px-6 lg:px-16 bg-background overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-0">
        {/* Left Column: Lifestyle Community Image */}
        <div className="relative w-full lg:pr-12">
          <div className="relative w-full rounded-2xl sm:rounded-3xl lg:rounded-4xl overflow-hidden shadow-lg aspect-[4/3] sm:aspect-[1.15/1]">
            <AnimatedImage
              src={assets.community}
              alt="Community That Grows Together"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* Floating Badge Card inside Image */}
            <PopUpReveal
              delay={0.5}
              duration={0.7}
              className="absolute bottom-4 right-4 sm:bottom-36 sm:right-12 z-20"
            >
              <div className="max-w-xs bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2 sm:p-3 sm:px-4 shadow-xl border border-white/80 text-center">
                <p className="text-base sm:text-lg lg:text[18px] font-regular text-black">
                  Choose Your Path. We'll Help You Find The Perfect Match.
                </p>
              </div>
            </PopUpReveal>
          </div>
        </div>

        {/* Right Column: Heading, Description & CTA */}
        <div className="flex flex-col items-start justify-between space-y-4 sm:space-y-6">
          <SectionHeading
            heading="MORE THAN JUST LISTINGS"
            title="A Community That Grows Together"
            animateTitle={true}
          />

          <div className="space-y-4">
            <p className="text-black text-base md:text-xl font-regular leading-relaxed max-w-2xl">
              Flat & Flatmates Isn't Just A Platform; It's A Community. Whether You're A Student, A Working Professional, Or A Homeowner - We Help You Find The Right Space, The Right People, And The Right Support.
            </p>

            <ArrowLink
              text="Join the Community"
              href="/community"
              lineClassName="bg-white"
              showArrow={true}
              className="bg-brand-blue hover:bg-[#0052c7] text-white text-sm sm:text-base py-3.5 px-7 rounded-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
