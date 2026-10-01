"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import SectionHeading from "@/components/utils/SectionHeading";
import { useLookingFor, LookingFirItem } from "@/data/lookingfor";
import { ViewReveal } from "../animation";

function LookingForCard({ item }: { item: LookingFirItem }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTl.current) {
        hoverTl.current.kill();
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTl.current) {
      hoverTl.current.kill();
    }

    const tl = gsap.timeline({
      defaults: {
        duration: 0.45,
        ease: "power4.out",
      },
    });

    if (cardRef.current) {
      tl.to(
        cardRef.current,
        {
          backgroundColor: "#0066F9",
          borderColor: "#0066F9",
          y: -4,
        },
        0
      );
    }

    if (titleRef.current) {
      tl.to(
        titleRef.current,
        {
          color: "#FFFFFF",
        },
        0
      );
    }

    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        {
          color: "rgba(255, 255, 255, 0.85)",
        },
        0
      );
    }

    if (iconContainerRef.current) {
      tl.to(
        iconContainerRef.current,
        {
          backgroundColor: "rgba(255, 255, 255, 0.2)",
        },
        0
      );
    }

    if (iconRef.current) {
      tl.to(
        iconRef.current,
        {
          color: "#FFFFFF",
        },
        0
      );
    }

    hoverTl.current = tl;
  };

  const handleMouseLeave = () => {
    if (hoverTl.current) {
      hoverTl.current.kill();
    }

    const tl = gsap.timeline({
      defaults: {
        duration: 0.45,
        ease: "power4.out",
      },
    });

    if (cardRef.current) {
      tl.to(
        cardRef.current,
        {
          backgroundColor: "#F2FAFD",
          borderColor: "rgba(243, 244, 246, 0.9)",
          y: 0,
        },
        0
      );
    }

    if (titleRef.current) {
      tl.to(
        titleRef.current,
        {
          color: "#000000",
        },
        0
      );
    }

    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        {
          color: "#000000",
        },
        0
      );
    }

    if (iconContainerRef.current) {
      tl.to(
        iconContainerRef.current,
        {
          backgroundColor: "#FFFFFF",
        },
        0
      );
    }

    if (iconRef.current) {
      tl.to(
        iconRef.current,
        {
          color: "#0066F9",
        },
        0
      );
    }

    hoverTl.current = tl;
  };

  const IconComponent = item.icon;

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="h-full bg-[#F2FAFD] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col items-start gap-4 drop-shadow-md border border-gray-100/90 cursor-pointer"
    >
      <div
        ref={iconContainerRef}
        className="p-4 rounded-full w-fit flex items-center justify-center bg-white text-brand-blue shadow-sm border border-brand-blue/15 mb-6 sm:mb-10 md:mb-16"
      >
        <div
          ref={iconRef}
          className="text-brand-blue flex items-center justify-center"
        >
          <IconComponent className="w-6 h-6" />
        </div>
      </div>

      <h3
        ref={titleRef}
        className="text-black text-lg sm:text-xl md:text-2xl font-regular tracking-tight"
      >
        {item.title}
      </h3>

      <p
        ref={descriptionRef}
        className="text-black text-sm sm:text-base md:text-lg font-regular leading-relaxed tracking-wide"
      >
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
