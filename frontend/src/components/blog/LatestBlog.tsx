"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ArrowLink from "../utils/ArrowLink";

export interface LatestBlogProps {
  id?: string;
  title: string;
  category: string;
  date: string;
  image: string;
  paragraphs: string[];
  slug?: string;
}

export default function LatestBlog({
  title,
  category,
  date,
  image,
  paragraphs,
  slug,
}: LatestBlogProps) {
  const targetUrl = slug ? `/blog/${slug}` : "#";

  return (
    <div className="w-full bg-background rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 md:p-10 lg:px-24 border border-blue-100/70 shadow-2xs transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 sm:gap-8 lg:gap-10">
        {/* Left: Featured Image */}
        <div className="relative lg:col-span-5 w-full min-h-[250px] lg:min-h-0 rounded-[20px] sm:rounded-[24px] overflow-hidden group">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        {/* Right: Text Details */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4">
          {/* Date */}
          <span className="text-sm sm:text-base md:text-lg font-regular text-black tracking-wide">
            {date}
          </span>

          {/* Category */}
          <h4 className="text-base sm:text-lg md:text-xl font-medium text-accent tracking-wide">
            {category}
          </h4>

          {/* Title */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-regular text-black leading-snug tracking-tight">
            {title}
          </h2>

          {/* Paragraphs */}
          <div className="space-y-2.5 sm:space-y-3 text-base sm:text-md text-gray-700 font-regular leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Read More Button */}
          <ArrowLink
            text="Read More"
            href={targetUrl}
            lineClassName="bg-white"
            showArrow={true}
            className="bg-brand-blue hover:bg-[#0052c7] text-white text-sm sm:text-base py-3.5 px-7 rounded-full w-fit"
          />
        </div>
      </div>
    </div>
  );
}
