"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import SectionHeading from "@/components/utils/SectionHeading";
import { useWhyChooseUs, WhyChooseUsItem } from "@/data/whychooseus";
import { ViewReveal } from "../animation";
import Image from "next/image";


function WhyChooseUsCard({ item }: { item: WhyChooseUsItem }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    return () => {
      hoverTl.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => {
    hoverTl.current?.kill();

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

    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        {
          color: "rgba(255, 255, 255, 0.85)",
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
    hoverTl.current?.kill();

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

    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        {
          color: "rgba(0, 0, 0, 0.4)",
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
      className="group h-full bg-[#F2F8FE] rounded-3xl sm:rounded-[36px] p-7 sm:p-9 flex flex-col items-start gap-3 lg:gap-y-8 cursor-pointer overflow-hidden transition-shadow shadow-sm hover:shadow-md"
    >
      {/* Icon */}
      <div
        ref={imageRef}
        className="w-16 h-[42.67px] sm:w-[90px] sm:h-[60px] lg:w-[120px] lg:h-[80px] mx-auto flex items-center justify-center shrink-0 origin-center pointer-events-none"
      >
        <Image
          src={item.icon}
          alt={`${item.title} icon`}
          width={100}
          height={100}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Title and Description */}
      <div className="text-center space-y-3">
        <h3
          ref={titleRef}
          className="text-lg sm:text-xl md:text-2xl font-regular tracking-tight text-[#111827]"
        >
          {item.title}
        </h3>

        <p
          ref={descriptionRef}
          className="text-sm sm:text-base md:text-lg font-regular leading-relaxed text-black/40"
        >
          {item.description}
        </p>
      </div>
    </div>
  );
}


export default function WhyChooseUs() {
  const features = useWhyChooseUs();

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        <SectionHeading
          title="Why Choose Us"
          align="center"
        />

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {features.map((item, index) => (
            <ViewReveal key={index} duration={800} startDelay={100} className="h-full">
              <WhyChooseUsCard item={item} />
            </ViewReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
