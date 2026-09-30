"use client";

import React from "react";
import Image from "next/image";
import { ListingItem, useListingsData } from "@/data/listings";
import SectionHeading from "../utils/SectionHeading";
import { Check, Sofa } from "lucide-react";
import ArrowLink from "../utils/ArrowLink";
import { ViewReveal } from "../animation";

function ListingCard({ item }: { item: ListingItem }) {
  return (
    <div
      key={item.id}
      className="h-full bg-[#F2FAFD] rounded-2xl sm:rounded-3xl border border-gray-100/80 overflow-hidden shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
    >
      {/* Property Image + Verified Badge */}
      <div className="relative h-56 sm:h-64 w-full">
        {/* Image */}
        <div className="relative w-full h-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Verified Badge - centered on image/details boundary */}
        {item.isVerified && (
          <span className="absolute -bottom-4 left-4 z-50 bg-brand-blue text-white text-sm sm:text-base font-medium px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
            Verified
            <Check size={16} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Property Content Details */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <h3 className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight uppercase mb-1">
            {item.title}
          </h3>
          <p className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight">
            Location: <span className="text-black/80 font-regular">{item.location}</span>
          </p>
          <p className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight">
            Price: <span className="text-black/80 font-regular">{item.price}</span>
          </p>
          <p className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight">
            Details: <span className="text-black/80 font-regular">{item.details}</span>
          </p>
        </div>

        {/* Showcase Button/Badge */}
        {item.showcaseAvailable && (
          <div className="bg-brand-blue text-white text-base sm:text-lg font-regular px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 w-fit shadow-sm mt-3">
            <Sofa size={20} />
            Showcase Available
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExploreListings() {
  const listings = useListingsData();

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
          <SectionHeading
            title="Explore Homes & Flatmates"
            description="Discover Verified Listings Near You."
          />

          <ArrowLink
            text="View All Listings"
            href="/listing"
            className="hidden sm:inline-flex text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
          />
        </div>

        {/* Listings Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {listings.map((item, index) => (
            <ViewReveal key={index} duration={800} startDelay={100} className="h-full">
              <ListingCard item={item} />
            </ViewReveal>
          ))}
        </div>

        <ArrowLink
          text="View All Listings"
          href="/listing"
          className="flex sm:hidden w-fit mx-auto text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
        />
      </div>
    </section>
  );
}
