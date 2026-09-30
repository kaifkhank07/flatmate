"use client";

import React from "react";
import Image from "next/image";
import SectionHeading from "@/components/utils/SectionHeading";
import { useTestimonials, TestimonialItem } from "@/data/testimonials";
import { Star } from "lucide-react";

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-4 drop-shadow-lg border border-gray-100/90 hover:-translate-y-1 transition-all duration-300 group shrink-0 w-[300px] sm:w-[360px] md:w-[400px]">
      <div className="space-y-4 sm:space-y-6">
        {/* Author Info */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 border border-gray-200">
            <Image
              src={item.avatar}
              alt={item.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-medium text-black tracking-tight">
              {item.name}
            </h4>
            <p className="text-xs sm:text-sm font-regular text-black/50">
              {item.role}
            </p>
          </div>
        </div>

        {/* Testimonial Quote */}
        <p className="text-sm sm:text-base md:text-lg font-regular text-black leading-relaxed whitespace-normal">
          {item.content}
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 text-amber-400 pt-2">
        {Array.from({ length: item.rating }).map((_, idx) => (
          <Star
            key={idx}
            className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400"
          />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const testimonials = useTestimonials();
  const trackTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        <SectionHeading
          title="What Our Users Say"
          description="Real Stories. Real People."
          align="center"
        />
      </div>

      {/* Auto-loop marquee container with fade overlays */}
      <div className="relative w-full overflow-hidden mt-8 sm:mt-10 py-2">
        {/* Left & Right Fade Overlays */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 z-10 bg-gradient-to-r from-white/50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 z-10 bg-gradient-to-l from-white/50 to-transparent" />

        <div className="animate-marquee-testimonials flex items-stretch gap-6 sm:gap-8 cursor-pointer">
          {trackTestimonials.map((item, index) => (
            <TestimonialCard key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>

      <style>{`
          @keyframes marqueeTestimonials {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-testimonials {
            display: flex;
            width: max-content;
            animation: marqueeTestimonials 35s linear infinite;
            will-change: transform;
          }
          .animate-marquee-testimonials:hover {
            animation-play-state: paused;
          }
        `}</style>
    </section>
  );
}
