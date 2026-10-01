"use client";

import React from "react";
import { FlatmateListingItem } from "@/types/listing";
import AvatarIllustration from "./AvatarIllustration";
import { MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

interface ListingCardProps {
  item: FlatmateListingItem;
}

export default function ListingCard({ item }: ListingCardProps) {
  // Format distance text to make the distance number bold (e.g. "2.8 Km" bold, "From Your Search" normal)
  const renderDistance = (distanceStr: string) => {
    if (!distanceStr) return null;
    const match = distanceStr.match(/^([\d.]+\s*\w+)\s*(.*)$/);
    if (match) {
      return (
        <span className="text-[10px] xs:text-xs sm:text-sm text-gray-500 whitespace-nowrap">
          <strong className="font-bold text-gray-900 mr-1">{match[1]}</strong>
          {match[2]}
        </span>
      );
    }
    return <span className="text-[10px] xs:text-xs sm:text-sm text-gray-500 whitespace-nowrap">{distanceStr}</span>;
  };

  return (
    <Link
      href={`/listing/${item.id}`}
      className="bg-white rounded-[24px] sm:rounded-[32px] flex flex-row items-stretch overflow-hidden transition-all duration-300 drop-shadow-md border border-gray-200/90 hover:-translate-y-1 w-full"
    >
      {/* Avatar Container Box Left */}
      <div className="w-24 xs:w-28 sm:w-36 md:w-44 shrink-0 relative flex items-center justify-center rounded-[24px] sm:rounded-[32px] drop-shadow-md border border-gray-200/90 overflow-hidden self-stretch min-h-full bg-gray-100">
        {item.userImage ? (
          <img
            src={item.userImage}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <AvatarIllustration
            type={item.avatarType}
            bg={item.avatarBg}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Info Content Right */}
      <div className="flex-1 min-w-0 w-full flex flex-col justify-between gap-2.5 sm:gap-4 lg:gap-8 p-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
          {/* Name & Location */}
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h3 className="text-base sm:text-xl lg:text-2xl font-medium text-[#1E2B4D] tracking-tight truncate">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500 text-xs sm:text-base md:text-lg font-regular">
              <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400 shrink-0" strokeWidth={2} />
              <span className="truncate max-w-[12ch] xs:max-w-[18ch] sm:max-w-[25ch]">{item.location}</span>
            </div>
          </div>

          {/* Distance, Match & Chat Button */}
          <div className="flex flex-col items-end gap-1 sm:gap-2 text-right shrink-0">
            <div>{renderDistance(item.distance)}</div>

            <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-gray-900 text-xs sm:text-base font-regular whitespace-nowrap">
                {item.matchPercentage}% Match
              </span>
              <button
                type="button"
                aria-label={`Chat with ${item.name}`}
                className="p-1.5 sm:p-2 bg-background hover:bg-primary/10 text-accent rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Details Grid */}
        <div className="w-full pt-1.5 grid grid-cols-3 gap-1 sm:gap-4 border-t-2 border-accent border-dashed">
          {/* Rent */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              Rent
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {item.rent}
            </span>
          </div>

          {/* Looking For (Gender) */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              Looking For
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {item.lookingForGender}
            </span>
          </div>

          {/* Looking For (Type) */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              Looking For
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {item.lookingForType}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
