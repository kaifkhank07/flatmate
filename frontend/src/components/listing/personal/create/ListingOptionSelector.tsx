"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Info, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import { useAssets } from "@/data/assets";
import Image from "next/image";
import { ViewReveal } from "@/components/animation";

interface ListingOptionSelectorProps {
  onSelectOption: (
    option: "property" | "flatmate-room" | "flatmate-roommate"
  ) => void;
}

interface ListingOptionItem {
  title: string;
  buttonText: string;
  type: "property" | "flatmate-room" | "flatmate-roommate";
  image: string;
}

function ListingOptionCard({
  item,
  onSelectOption,
}: {
  item: ListingOptionItem;
  onSelectOption: (
    option: "property" | "flatmate-room" | "flatmate-roommate"
  ) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const buttonIconRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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

    if (buttonRef.current) {
      tl.to(
        buttonRef.current,
        {
          color: "#FFFFFF",
        },
        0
      );
    }

    if (buttonIconRef.current) {
      tl.to(
        buttonIconRef.current,
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

    if (buttonRef.current) {
      tl.to(
        buttonRef.current,
        {
          color: "#0066F9",
        },
        0
      );
    }

    if (buttonIconRef.current) {
      tl.to(
        buttonIconRef.current,
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
      onClick={() => onSelectOption(item.type)}
      className="group relative bg-white rounded-3xl sm:rounded-[36px] p-7 sm:p-9 flex flex-col justify-between min-h-[260px] sm:min-h-[260px] lg:min-h-[340px] cursor-pointer overflow-hidden transition-shadow shadow-sm hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectOption(item.type);
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
          <span ref={buttonRef}>{item.buttonText}</span>
          <span ref={buttonIconRef} className="inline-flex items-center">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </span>
        </div>
      </div>

      {/* Bottom Right Illustration */}
      <div
        ref={imageRef}
        className="absolute bottom-0 right-2 sm:right-4 z-10 origin-bottom-right pointer-events-none"
      >
        <Image
          src={item.image}
          alt={item.title}
          className="object-contain max-h-[120px] sm:max-h-[80px] lg:max-h-[140px] w-auto drop-shadow-sm"
          width={150}
          height={150}
        />
      </div>
    </div>
  );
}

export default function ListingOptionSelector({
  onSelectOption,
}: ListingOptionSelectorProps) {
  const assets = useAssets();

  const selectOptions: ListingOptionItem[] = [
    {
      title: "Find a Room / Flat",
      buttonText: "With Roommate",
      type: "flatmate-room",
      image: assets.listingicon1,
    },
    {
      title: "Find a Flatmate",
      buttonText: "For Your Room",
      type: "flatmate-roommate",
      image: assets.listingicon2,
    },
    {
      title: "List an Entire Property",
      buttonText: "Add Your Property",
      type: "property",
      image: assets.listingicon3,
    },
  ];

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        {/* Top Header Section */}
        <ViewReveal duration={800}>
          <SectionHeading
            title="Post Your Requirement"
            description="Find Your Perfect Flat & Flatmate Effortlessly. Just Post Your Requirement And Let The Matching Begin!"
            align="center"
          />
        </ViewReveal>

        {/* Listing Options */}
        <ViewReveal duration={900} startDelay={150}>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {selectOptions.map((item, index) => (
              <ListingOptionCard
                key={index}
                item={item}
                onSelectOption={onSelectOption}
              />
            ))}
          </div>
        </ViewReveal>

        {/* Bottom Safety / Warning Badge */}
        <div className="flex justify-center items-center pt-2">
          <div className="inline-flex items-center gap-2.5 bg-[#0066F9] px-7 py-3 sm:px-9 sm:py-3.5 rounded-full transition-transform cursor-pointer select-none">
            <Info className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
            <span className="text-white text-sm sm:text-base md:text-lg font-regular">
              Beware Of Scams, Verify Flatmates/Tenants
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}