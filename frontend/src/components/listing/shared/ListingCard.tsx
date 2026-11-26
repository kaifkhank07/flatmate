"use client";

import React, { useState, useEffect } from "react";
import { FlatmateListingItem } from "@/types/listing";
import AvatarIllustration from "./AvatarIllustration";
import { MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/api";

interface ListingCardProps {
  item: FlatmateListingItem;
  isMylisting?: boolean;
  className?: string;
}

export default function ListingCard({
  item,
  isMylisting = false,
  className = "",
}: ListingCardProps) {
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

  const href = isMylisting ? `/my-listings/${item.id}` : `/listing/${item.id}`;

  // const isProperty = item.sourceType === "property" || item.category === "Property";
  // // If property, show property image (with fallback to user image). Otherwise show user image.
  // const rawImage = isProperty ? (item.propertyImage || item.userImage) : item.userImage;
  // const displayImage = getMediaUrl(rawImage);

  const isProperty = item.sourceType === "property" || item.category === "Property";
  const isFlatmateRequirement = item.sourceType === "flatmate_requirement";
  const isPostTypePartner = item.postType === "partner";

  // Select image based on listing source
  const rawImage = isProperty
    ? item.propertyImage || item.userImage
    : isFlatmateRequirement
      ? item.propertyImage || item.userImage
      : item.userImage;

  const displayImage = getMediaUrl(rawImage);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [displayImage]);

  const showImage = Boolean(displayImage && !imageError);

  return (
    <Link
      href={href}
      className={`bg-white rounded-[24px] sm:rounded-[32px] flex flex-row items-stretch overflow-hidden transition-all duration-300 drop-shadow-md border border-gray-200/90 ${isMylisting ? "" : "hover:-translate-y-1"
        } w-full h-full min-h-[140px] xs:min-h-[150px] sm:min-h-[175px] md:min-h-[190px] lg:min-h-[204px] ${className}`}
    >
      {/* Avatar / Property Image Container Box Left */}
      <div className="w-24 xs:w-28 sm:w-36 md:w-44 shrink-0 relative flex items-center justify-center rounded-[24px] sm:rounded-[32px] drop-shadow-md border border-gray-200/90 overflow-hidden self-stretch bg-gray-100">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={item.name}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            <AvatarIllustration
              type={item.avatarType}
              bg={item.avatarBg}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Info Content Right */}
      <div className="flex-1 min-w-0 w-full flex flex-col justify-between gap-2.5 sm:gap-4 lg:gap-6 p-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Top Header Row */}
        <div className="space-y-0.5 sm:space-y-1 w-full min-w-0">
          {/* Title & Distance */}
          <div className="flex items-start justify-between gap-1.5 sm:gap-3">
            <h3 className="text-base sm:text-xl lg:text-2xl font-medium text-[#1E2B4D] tracking-tight truncate flex-1 min-w-0">
              {(isFlatmateRequirement && item.postType === "partner")
                ? item.title || item.name
                : item.name}
            </h3>

            {renderDistance(item.distance) ? (
              <div className="flex flex-col items-end gap-1 sm:gap-2 text-right shrink-0">
                <div>{renderDistance(item.distance)}</div>
              </div>
            ) : null}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500 text-xs sm:text-base md:text-lg font-normal w-full min-w-0">
            <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400 shrink-0" strokeWidth={2} />
            <span className="truncate flex-1 min-w-0">{item.location}</span>
          </div>
        </div>

        {/* Badges row with fixed height for consistent card height across all listing types */}
        <div className="hidden lg:flex items-center gap-1.5 h-[26px] min-h-[26px] -mt-1 sm:-mt-2 overflow-hidden">
          {item.bhk && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-medium border border-blue-100 shrink-0">
              {item.bhk}
            </span>
          )}
          {item.floor && (
            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-medium border border-slate-200 shrink-0">
              {item.floor}
            </span>
          )}
          {/* {item.furnishing && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-medium border border-purple-100 shrink-0">
              {item.furnishing}
            </span>
          )}
          {item.postedBy && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-medium border border-emerald-100 capitalize shrink-0">
              By {item.postedBy}
            </span>
          )}
          {item.brokerage && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-medium border border-amber-100 shrink-0">
              {item.brokerage}
            </span>
          )} */}

          {/* For flatmate requirements with no property details badges, show category badge to maintain balanced card content */}
          {item.sourceType === "flatmate_requirement" &&
            !item.bhk &&
            !item.floor &&
            !item.furnishing &&
            !item.postedBy && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-medium border border-indigo-100 shrink-0">
                {item.category || "Flatmate"} Requirement
              </span>
            )}
        </div>

        {/* Bottom Details Grid - Mobile Only */}
        <div className="w-full pt-1.5 grid grid-cols-1 gap-1 border-t-2 border-accent border-dashed sm:hidden">
          {/* Rent */}
          <div className="min-w-0 flex items-center gap-1">
            <span className="text-gray-400 text-[10px] xs:text-xs font-regular shrink-0">
              Rent:
            </span>
            <span className="text-xs font-medium text-gray-900 truncate">
              {item.rent}
            </span>
          </div>

          {/* Looking For / Preferred Tenant */}
          <div className="min-w-0 flex items-center gap-1">
            <span className="text-gray-400 text-[10px] xs:text-xs font-regular shrink-0">
              {isProperty ? "Preferred Tenant:" : "Looking For:"}
            </span>
            <span className="text-xs font-medium text-gray-900 truncate">
              {isProperty ? (item.tenantPreference || item.lookingForGender) : item.lookingForGender}
            </span>
          </div>

          {/* Property Type / Occupancy */}
          <div className="min-w-0 flex items-center gap-1">
            {/* <span className="text-gray-400 text-[10px] xs:text-xs font-regular shrink-0">
              {isFlatmateRequirement ? "Occupancy:" : "Property Type:"}
            </span> */}
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              {isFlatmateRequirement
                ? !isPostTypePartner
                  ? "Preferred Occupancy"
                  : "Occupancy"
                : "Property Type"}
            </span>
            <span className="text-xs font-medium text-gray-900 truncate">
              {isFlatmateRequirement ? (item.occupancyPreference || item.lookingForType) : item.lookingForType}
            </span>
          </div>
        </div>

        {/* Bottom Details Grid */}
        <div className="w-full pt-1.5 hidden sm:grid grid-cols-[1fr_1.75fr_1.75fr] gap-1 sm:gap-4 border-t-2 border-accent border-dashed">
          {/* Rent */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              Rent
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {item.rent}
            </span>
          </div>

          {/* Looking For / Preferred Tenant */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              {isProperty ? "Preferred Tenant" : "Looking For"}
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {isProperty ? (item.tenantPreference || item.lookingForGender) : item.lookingForGender}
            </span>
          </div>

          {/* Property Type / Occupancy */}
          <div className={`min-w-0 ${isMylisting ? "pr-14 sm:pr-20" : ""}`}>
            {/* <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              {isFlatmateRequirement ? "Occupancy" : "Property Type"}
            </span> */}
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              {isFlatmateRequirement
                ? !isPostTypePartner
                  ? "Preferred Occupancy"
                  : "Occupancy"
                : "Property Type"}
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {isFlatmateRequirement ? (item.occupancyPreference || item.lookingForType) : item.lookingForType}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}



