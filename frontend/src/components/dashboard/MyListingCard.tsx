"use client";

import React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import AvatarIllustration from "../listing/AvatarIllustration";
import { mapUnifiedListingToCard, UnifiedListingItem } from "@/types/listing";

export const getStatusClasses = (status?: string) => {
  switch (status) {
    case "approved":
      return "bg-green-50 text-green-700 border-green-200";
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "rejected":
    case "blocked":
      return "bg-red-50 text-red-700 border-red-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "expired":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "draft":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

interface MyListingCardProps {
  listing: UnifiedListingItem | any;
}

export default function MyListingCard({ listing }: MyListingCardProps) {
  const cardData = mapUnifiedListingToCard(listing);
  const status = listing.status || "draft";
  const isProperty = listing.sourceType === "property";

  // Extract listing image if available from images array or user image
  const getListingImage = (item: any): string | null => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const firstImg = item.images[0];
      if (typeof firstImg === "string") return firstImg;
      if (firstImg?.url) return firstImg.url;
      if (firstImg?.image?.url) return firstImg.image.url;
    }
    return item.userImage || cardData.userImage || null;
  };

  const image = getListingImage(listing);

  // Format creation date
  const createdDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/my-listings/${cardData.id}`}
      className="bg-white rounded-[24px] sm:rounded-[32px] flex flex-row items-stretch overflow-hidden transition-all duration-300 drop-shadow-md border border-gray-200/90 hover:-translate-y-1 w-full relative group"
    >
      {/* Avatar Container Box Left */}
      <div className="w-24 xs:w-28 sm:w-36 md:w-44 shrink-0 relative flex items-center justify-center rounded-[24px] sm:rounded-[32px] drop-shadow-md border border-gray-200/90 overflow-hidden self-stretch min-h-full bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={cardData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <AvatarIllustration
            type={cardData.avatarType}
            bg={cardData.avatarBg}
            className="w-full h-full"
          />
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
          <span
            className={`inline-flex px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-semibold capitalize backdrop-blur-sm shadow-xs ${getStatusClasses(
              status
            )}`}
          >
            {status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Info Content Right */}
      <div className="flex-1 min-w-0 w-full flex flex-col justify-between gap-2.5 sm:gap-4 lg:gap-8 p-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
          {/* Name & Location */}
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h3 className="text-base sm:text-xl lg:text-2xl font-medium text-[#1E2B4D] tracking-tight truncate">
              {cardData.name}
            </h3>
            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500 text-xs sm:text-base md:text-lg font-regular">
              <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400 shrink-0" strokeWidth={2} />
              <span className="truncate max-w-[12ch] xs:max-w-[18ch] sm:max-w-[25ch]">{cardData.location}</span>
            </div>
          </div>

          {/* Created Date */}
          {createdDate && (
            <div className="flex flex-col items-end text-right shrink-0">
              <span className="text-[10px] xs:text-xs text-gray-400">Created</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                {createdDate}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Details Grid */}
        <div className="w-full pt-1.5 grid grid-cols-3 gap-1 sm:gap-4 border-t-2 border-accent border-dashed">
          {/* Rent / Budget */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              {isProperty ? "Rent" : "Budget"}
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {cardData.rent}
            </span>
          </div>

          {/* Looking For (Gender) */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              Looking For
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {cardData.lookingForGender}
            </span>
          </div>

          {/* Looking For (Type) */}
          <div className="min-w-0">
            <span className="block text-gray-400 text-[10px] xs:text-xs sm:text-base font-regular truncate">
              Looking For
            </span>
            <span className="block text-xs sm:text-base font-medium text-gray-900 mt-0.5 sm:mt-1 truncate">
              {cardData.lookingForType}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}