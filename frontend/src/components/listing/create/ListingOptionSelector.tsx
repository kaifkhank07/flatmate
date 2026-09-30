"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Info, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import { useAssets } from "@/data/assets";
import Image from "next/image";

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
          backgroundColor: "#FFFFFF",
          color: "#000000",
          scale: 1.05,
        },
        0
      );
    }

    if (buttonIconRef.current) {
      tl.to(
        buttonIconRef.current,
        {
          x: 3,
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
          backgroundColor: "#FFFFFF",
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
          backgroundColor: "#0066F9",
          color: "#FFFFFF",
          scale: 1,
        },
        0
      );
    }

    if (buttonIconRef.current) {
      tl.to(
        buttonIconRef.current,
        {
          x: 0,
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
      className="group relative bg-white rounded-3xl sm:rounded-[36px] p-7 sm:p-10 flex flex-col justify-between min-h-[380px] sm:min-h-[420px] drop-shadow-md cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectOption(item.type);
        }
      }}
    >
      {/* Top text & button */}
      <div className="space-y-4 sm:space-y-6">
        <h2
          ref={titleRef}
          className="font-roboto-serif text-3xl sm:text-4xl text-gray-900 font-regular tracking-tight"
        >
          {item.title}
        </h2>

        <div>
          <span
            ref={buttonRef}
            className="inline-flex items-center gap-2 bg-[#0066F9] text-white text-sm sm:text-base font-medium px-6 py-2.5 rounded-full shadow-sm"
          >
            {item.buttonText}

            <span ref={buttonIconRef} className="inline-flex">
              <ChevronRight className="w-4 h-4" />
            </span>
          </span>
        </div>
      </div>

      {/* Bottom Illustration */}
      <div
        ref={imageRef}
        className="self-end z-10 origin-center"
      >
        <Image
          src={item.image}
          alt={item.title}
          className="object-contain drop-shadow-sm"
          width={140}
          height={140}
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
      title: "Need Room/Flat",
      buttonText: "With Roommate",
      type: "flatmate-room",
      image: assets.listingicon1,
    },
    {
      title: "Have a Roommate",
      buttonText: "For Your Room",
      type: "flatmate-roommate",
      image: assets.listingicon2,
    },
    {
      title: "Add Property",
      buttonText: "Add Your Property",
      type: "property",
      image: assets.listingicon3,
    },
  ];

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        {/* Top Header Section */}
        <SectionHeading
          title="Post Your Requirement"
          description="Find Your Perfect Roommate Or Room Effortlessly. Just Post Your Requirement And Let The Matching Begin!"
          align="center"
        />

        {/* Listing Options */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {selectOptions.map((item, index) => (
            <ListingOptionCard
              key={index}
              item={item}
              onSelectOption={onSelectOption}
            />
          ))}
        </div>

        {/* Bottom Safety / Warning Badge */}
        <div className="flex justify-center items-center">
          <div className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent/80 text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-md transition-all cursor-pointer select-none active:scale-98">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
              <Info className="w-3 h-3 text-white" />
            </div>

            <span>Beware Of Scams, Verify Flatmates/Tenants</span>
          </div>
        </div>
      </div>
    </section>
  );
}