"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import { useLookingFor, LookingFirItem } from "@/data/lookingfor";
import { ViewReveal } from "../animation";
import { useRouter } from "next/navigation";

function LookingForCard({ item }: { item: LookingFirItem }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const chevronRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);

  const router = useRouter();

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

    if (subtitleRef.current) {
      tl.to(
        subtitleRef.current,
        {
          color: "#FFFFFF",
        },
        0
      );
    }

    if (chevronRef.current) {
      tl.to(
        chevronRef.current,
        {
          x: 4,
          color: "#FFFFFF",
        },
        0
      );
    }

    if (imageRef.current) {
      tl.to(
        imageRef.current,
        {
          scale: 1.08,
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
          backgroundColor: "#F2F8FE",
          y: 0,
        },
        0
      );
    }

    if (titleRef.current) {
      tl.to(
        titleRef.current,
        {
          color: "#111827",
        },
        0
      );
    }

    if (subtitleRef.current) {
      tl.to(
        subtitleRef.current,
        {
          color: "#0066F9",
        },
        0
      );
    }

    if (chevronRef.current) {
      tl.to(
        chevronRef.current,
        {
          x: 0,
          color: "#0066F9",
        },
        0
      );
    }

    if (imageRef.current) {
      tl.to(
        imageRef.current,
        {
          scale: 1,
        },
        0
      );
    }

    hoverTl.current = tl;
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(item.href)}
      className="group relative bg-[#F2F8FE] rounded-3xl sm:rounded-[36px] p-7 sm:p-9 flex flex-col justify-between min-h-[260px] sm:min-h-[260px] lg:min-h-[340px] cursor-pointer overflow-hidden transition-shadow shadow-sm hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(item.href);
        }
      }}
    >
      {/* Top text & link */}
      <div className="space-y-2 sm:space-y-3 lg:space-y-4 z-10">
        <h2
          ref={titleRef}
          className="font-roboto-serif text-2xl sm:text-2xl lg:text-[30px] text-[#111827] font-normal tracking-tight leading-tight"
        >
          {item.title}
        </h2>

        <div className="flex items-center gap-1.5 font-regular text-[#0066F9] text-base sm:text-base lg:text-xl">
          <span ref={subtitleRef}>{item.subtitle}</span>
          {/* <span ref={chevronRef} className="inline-flex items-center">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </span> */}
        </div>
      </div>

      {/* Bottom Right Illustration */}
      <div
        ref={imageRef}
        className="absolute bottom-0 right-2 sm:right-4 z-10 origin-bottom-right pointer-events-none"
      >
        <Image
          src={item.icon}
          alt={item.title}
          className="object-contain max-h-[120px] sm:max-h-[80px] lg:max-h-[140px] w-auto drop-shadow-sm"
          width={150}
          height={150}
        />
      </div>
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
