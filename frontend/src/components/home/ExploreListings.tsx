"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bike, Check } from "lucide-react";

import SectionHeading from "../utils/SectionHeading";
import ArrowLink from "../utils/ArrowLink";
import { useListingStore } from "@/store/useListingStore";

import {
  UnifiedListingItem,
  PropertyListingItem,
  FlatmateRequirementItem,
  LocationItem,
} from "@/types/listing";

interface ExploreListingCardItem {
  id: string;
  title: string;
  slug: string;
  location: string;
  price: string;
  details: string;
  isVerified: boolean;
  parkingAvailable: boolean;
  image: string;
}

/**
 * Convert unified listing data into the format
 * required by the Explore Listings card.
 */
function mapUnifiedToExploreCard(
  item: UnifiedListingItem
): ExploreListingCardItem {
  const id =
    item._id ||
    (item as any).id ||
    item.slug ||
    `listing-${item.sourceType}`;

  const title = item.title || "Listing";
  const slug = item.slug || "";

  // -----------------------------
  // Location
  // -----------------------------

  let location = "Location N/A";

  if (item.location) {
    if (typeof item.location === "object") {
      const loc = item.location as LocationItem;

      const parts = [
        loc.formattedAddress,
        loc.city,
        loc.state,
      ].filter(Boolean);

      if (parts.length > 0) {
        location = parts.join(", ");
      }
    } else if (typeof item.location === "string") {
      location = item.location;
    }
  }

  // -----------------------------
  // Image
  // -----------------------------

  let image = "/assets/Images/property-01.png";

  if (
    item.images &&
    Array.isArray(item.images) &&
    item.images.length > 0 &&
    item.images[0]?.url
  ) {
    image = item.images[0].url;
  }

  // -----------------------------
  // Property
  // -----------------------------

  if (item.sourceType === "property") {
    const property = item as PropertyListingItem;

    const price =
      typeof property.rent === "number" && property.rent > 0
        ? `₹ ${property.rent.toLocaleString("en-IN")} / month`
        : "Contact Owner";

    const detailParts: string[] = [];
    const pType = property.propertyType || property.listingType;

    if (pType) {
      detailParts.push(
        pType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      );
    }

    if (property.area) {
      const areaVal = typeof property.area === "object" ? (property.area as any).value : property.area;
      if (areaVal) detailParts.push(`${areaVal} sqft`);
    }

    if (property.furnishing) {
      detailParts.push(
        property.furnishing
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      );
    }

    const details =
      detailParts.length > 0
        ? detailParts.join(" | ")
        : "Property Listing";

    const isVerified = Boolean((property.userId || property.ownerId)?.profileVerified);

    const parkingAvailable = Boolean(
      typeof property.parking === "boolean" ? property.parking : property.parking?.available
    );

    return {
      id,
      title,
      slug,
      location,
      price,
      details,
      isVerified,
      parkingAvailable,
      image,
    };
  }

  // -----------------------------
  // Flatmate Requirement
  // -----------------------------

  const requirement = item as FlatmateRequirementItem;

  const reqRent = requirement.rent ?? (requirement as any).budget;
  const price =
    typeof reqRent === "number" && reqRent > 0
      ? `₹ ${reqRent.toLocaleString("en-IN")} / month`
      : "Flexible";

  const detailParts: string[] = [];

  if (
    requirement.propertyType &&
    requirement.propertyType !== "all"
  ) {
    detailParts.push(
      requirement.propertyType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  } else if (
    requirement.postType &&
    requirement.postType !== "all"
  ) {
    detailParts.push(
      requirement.postType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  } else {
    detailParts.push("Flatmate");
  }

  if (
    requirement.genderPreference &&
    requirement.genderPreference !== "any" &&
    requirement.genderPreference !== "all"
  ) {
    detailParts.push(
      `${requirement.genderPreference
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())} Preferred`
    );
  }

  if (
    requirement.occupationPreference &&
    requirement.occupationPreference !== "any" &&
    requirement.occupationPreference !== "all"
  ) {
    detailParts.push(
      requirement.occupationPreference
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  }

  const details =
    detailParts.length > 0
      ? detailParts.join(" | ")
      : "Flatmate Requirement";

  const isVerified = Boolean(
    requirement.userId?.profileVerified
  );

  const parkingAvailable = Boolean(
    requirement.parking ??
    ((requirement.userPreferences && requirement.userPreferences.length > 0) ||
      ((requirement as any).lifestylePreferences && (requirement as any).lifestylePreferences.length > 0))
  );

  return {
    id,
    title,
    slug,
    location,
    price,
    details,
    isVerified,
    parkingAvailable,
    image,
  };
}

/**
 * Listing Card
 */
function ListingCard({
  item,
}: {
  item: ExploreListingCardItem;
}) {
  return (
    <Link
      href={`/listing/${item.slug}`}
      className="group hover:-translate-y-1 transition-all duration-300 overflow-hidden shrink-0 w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] bg-[#F2FAFD] rounded-2xl sm:rounded-3xl border border-gray-100/80 shadow-md flex flex-col justify-between"
    >
      {/* Image */}
      <div className="relative h-56 sm:h-64 w-full">
        <div className="relative w-full h-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>

        {/* Verified Badge */}
        {/* {item.isVerified && ( */}
        <span className="absolute -bottom-4 left-4 z-20 bg-brand-blue text-white text-sm sm:text-base font-medium px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
          Verified
          <Check size={16} strokeWidth={3} />
        </span>
        {/* )} */}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <h3 className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight uppercase mb-1">
            {item.title}
          </h3>

          <p className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight">
            Location:{" "}
            <span className="text-black/80 font-regular">
              {item.location}
            </span>
          </p>

          <p className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight">
            Price:{" "}
            <span className="text-black/80 font-regular">
              {item.price}
            </span>
          </p>

          <p className="text-black text-sm sm:text-base md:text-lg font-medium tracking-tight">
            Details:{" "}
            <span className="text-black/80 font-regular">
              {item.details}
            </span>
          </p>
        </div>

        {/* Parking */}
        {item.parkingAvailable && (
          <div className="bg-brand-blue text-white text-base sm:text-lg font-regular px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 w-fit shadow-sm mt-3">
            <Bike size={20} />
            Parking Available
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ExploreListings() {
  const {
    latestListings,
    loadingLatestListings,
    latestListingsError,
    fetchLatestListings,
  } = useListingStore();

  useEffect(() => {
    fetchLatestListings();
  }, [fetchLatestListings]);

  /**
   * Backend already returns 12 latest listings.
   * Slice again as a defensive frontend safeguard.
   */
  const displayListings = latestListings.slice(0, 12);

  /**
   * Duplicate the listings so the marquee can
   * continuously loop just like ExploreCities.
   */
  const trackListings = displayListings.length
    ? [...displayListings, ...displayListings]
    : [];



  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
          <SectionHeading
            title="Explore Flat & Flatmate"
            description="Discover Verified Listings Near You."
          />

          <ArrowLink
            text="View All Listings"
            href="/listing"
            className="hidden sm:inline-flex text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
          />
        </div>
      </div>

      {/* Listings */}
      <div className="relative w-full overflow-hidden mt-8 sm:mt-10 py-2">
        {/* Loading */}
        {loadingLatestListings && (
          <div className="flex gap-6 sm:gap-8 px-4 sm:px-6 lg:px-16">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="shrink-0 w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] h-[420px] bg-[#F2FAFD] rounded-2xl sm:rounded-3xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loadingLatestListings && latestListingsError && (
          <div className="max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16">
            <div className="text-center py-12 px-4 bg-[#F2FAFD] rounded-2xl sm:rounded-3xl border border-gray-100/80">
              <p className="text-gray-600 font-medium text-base mb-4">
                Unable to load latest listings right now.
              </p>

              <button
                type="button"
                onClick={fetchLatestListings}
                className="px-6 py-2.5 bg-brand-blue text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loadingLatestListings &&
          !latestListingsError &&
          displayListings.length === 0 && (
            <div className="max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16">
              <div className="text-center py-12 px-4 bg-[#F2FAFD] rounded-2xl sm:rounded-3xl border border-gray-100/80">
                <p className="text-gray-500 font-medium text-base">
                  No listings available at the moment.
                </p>
              </div>
            </div>
          )}

        {/* Marquee */}
        {!loadingLatestListings &&
          !latestListingsError &&
          displayListings.length > 0 && (
            <>
              {/* Left Fade */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 z-10 bg-gradient-to-r from-white/50 to-transparent" />

              {/* Right Fade */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 z-10 bg-gradient-to-l from-white/50 to-transparent" />

              <div className="animate-marquee-listings flex items-center gap-6 sm:gap-8 cursor-pointer">
                {trackListings.map((item, index) => {
                  const cardData = mapUnifiedToExploreCard(item);

                  return (
                    <ListingCard
                      key={`${cardData.id}-${index}`}
                      item={cardData}
                    />
                  );
                })}
              </div>
            </>
          )}
      </div>

      {/* Mobile View All */}
      <div className="mt-8 px-4 sm:hidden">
        <ArrowLink
          text="View All Listings"
          href="/listing"
          className="flex sm:hidden w-fit mx-auto text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
        />
      </div>

      {/* Marquee Animation */}
      <style>{`
        @keyframes marqueeListings {
          0% {
            transform: translateX(0%);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee-listings {
          display: flex;
          width: max-content;
          animation: marqueeListings 35s linear infinite;
          will-change: transform;
        }

        .animate-marquee-listings:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
