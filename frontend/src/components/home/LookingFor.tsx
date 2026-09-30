"use client";

import React from "react";
import SectionHeading from "@/components/utils/SectionHeading";
import { useLookingFor, LookingFirItem } from "@/data/lookingfor";
import { ViewReveal } from "../animation";

function LookingForCard({ item }: { item: LookingFirItem }) {
  const IconComponent = item.icon;

  return (
    <div className="h-full bg-[#F2FAFD] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col items-start gap-4 drop-shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="p-4 rounded-full bg-white text-brand-blue shadow-sm border border-brand-blue/15 group-hover:scale-110 transition-transform mb-6 sm:mb-10 md:mb-16">
        <IconComponent className="w-6 h-6" />
      </div>

      <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular tracking-tight">
        {item.title}
      </h3>

      <p className="text-black text-sm sm:text-base md:text-lg font-regular leading-relaxed tracking-wide">
        {item.subtitle}
      </p>
    </div>
  );
}

export default function LookingFor() {
  const options = useLookingFor();

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        <SectionHeading
          title="What Are You Looking For?"
          description="Choose Your Path. We'll Help You Find The Perfect Match."
          align="center"
        />

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {options.map((item, index) => (
            <ViewReveal key={index} duration={800} startDelay={100} className="h-full">
              <LookingForCard item={item} />
            </ViewReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
