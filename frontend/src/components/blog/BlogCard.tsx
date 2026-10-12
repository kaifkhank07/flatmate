"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface BlogCardProps {
  id?: string;
  title: string;
  date: string;
  image: string;
  category?: string;
  slug?: string;
  targetUrl?: string;
  onClick?: () => void;
}

export default function BlogCard({
  title,
  date,
  image,
  category,
  slug,
  targetUrl,
  onClick,
}: BlogCardProps) {
  const url = targetUrl || (slug ? `/blog/${slug}` : "#");

  const CardContent = (
    <article className="group flex flex-col space-y-3 cursor-pointer">
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] rounded-[22px] sm:rounded-[26px] overflow-hidden bg-gray-100 shadow-2xs border border-gray-100/80">
        <Image
          src={image}
          alt={title}
          fill
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      {/* Author & Date Line */}
      <div className="flex items-center gap-2 sm:gap-4 pt-1">
        <span className="text-sm sm:text-lg font-semibold text-gray-900">{category}</span>
        <span className="text-xs sm:text-sm font-regular text-gray-500">{date}</span>
      </div>

      {/* Blog Title */}
      <h3 className="font-roboto-serif text-base sm:text-lg md:text-2xl font-medium text-gray-900 group-hover:text-[#0066FF] transition-colors leading-snug tracking-tight line-clamp-3">
        {title}
      </h3>
    </article>
  );

  if (onClick) {
    return <div onClick={onClick}>{CardContent}</div>;
  }

  return <Link href={url}>{CardContent}</Link>;
}
