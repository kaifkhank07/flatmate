"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import SectionHeading from "@/components/utils/SectionHeading";
import { useWhyChooseUs, WhyChooseUsItem } from "@/data/whychooseus";
import { ViewReveal } from "../animation";

function WhyChooseUsCard({ item }: { item: WhyChooseUsItem }) {
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

    const tl = gsap.timeline({ defaults: { duration: 0.45, ease: "power4.out" } });

    if (cardRef.current) {
      tl.to(cardRef.current, {
        backgroundColor: "#0066F9",
        borderColor: "#0066F9",
        y: -4,
      }, 0);
    }

    if (titleRef.current) {
      tl.to(titleRef.current, {
        color: "#FFFFFF",
      }, 0);
    }

    if (descriptionRef.current) {
      tl.to(descriptionRef.current, {
        color: "rgba(255, 255, 255, 0.85)",
      }, 0);
    }

    // if (iconContainerRef.current) {
    //   tl.to(iconContainerRef.current, {
    //     backgroundColor: "rgba(255, 255, 255, 0.2)",
    //   }, 0);
    // }

    // if (iconRef.current) {
    //   tl.to(iconRef.current, {
    //     color: "#FFFFFF",
    //   }, 0);
    // }
    if (iconContainerRef.current) {
      tl.to(iconContainerRef.current, {
        // backgroundColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "#FFFFFF",
      }, 0);
    }

    if (iconRef.current) {
      tl.to(iconRef.current, {
        color: "#000000",
      }, 0);
    }

    hoverTl.current = tl;
  };

  const handleMouseLeave = () => {
    if (hoverTl.current) {
      hoverTl.current.kill();
    }

    const tl = gsap.timeline({ defaults: { duration: 0.45, ease: "power4.out" } });

    if (cardRef.current) {
      tl.to(cardRef.current, {
        backgroundColor: "#FFFFFF",
        borderColor: "rgba(243, 244, 246, 0.9)",
        y: 0,
      }, 0);
    }

    if (titleRef.current) {
      tl.to(titleRef.current, {
        color: "#073A81",
      }, 0);
    }

    if (descriptionRef.current) {
      tl.to(descriptionRef.current, {
        color: "rgba(0, 0, 0, 0.4)",
      }, 0);
    }

    // if (iconContainerRef.current) {
    //   tl.to(iconContainerRef.current, {
    //     backgroundColor: "rgba(0, 102, 249, 0.1)",
    //   }, 0);
    // }

    // if (iconRef.current) {
    //   tl.to(iconRef.current, {
    //     color: "#0066F9",
    //   }, 0);
    // }
    if (iconContainerRef.current) {
      tl.to(iconContainerRef.current, {
        backgroundColor: iconBackground,
      }, 0);
    }

    if (iconRef.current) {
      tl.to(iconRef.current, {
        color: iconColor,
      }, 0);
    }

    hoverTl.current = tl;
  };

  const IconComponent = item.icon;

  const iconColor = "#FFFFFF";
  // const iconBackground = item.iconBg
  //   ? `${item.iconBg}1A`
  //   : "rgba(0, 102, 249, 0.1)";
  const iconBackground = item.iconBg
    ? `${item.iconBg}`
    : "rgba(0, 102, 249, 0.1)";

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="h-full rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col items-start gap-4 drop-shadow-md bg-white text-brand-dark shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100/90 cursor-pointer"
    >
      {/* <div
        ref={iconContainerRef}
        className="p-1 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-brand-blue/10"
      >
        <div ref={iconRef} className="text-brand-blue flex items-center justify-center">
          <IconComponent className="w-5 h-5" />
        </div>
      </div> */}

      <div
        ref={iconContainerRef}
        style={{ backgroundColor: iconBackground }}
        className="p-1 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
      >
        <div
          ref={iconRef}
          style={{ color: iconColor }}
          className="flex items-center justify-center"
        >
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      <h3
        ref={titleRef}
        className="text-lg sm:text-xl md:text-2xl font-regular tracking-tight text-brand-dark"
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
