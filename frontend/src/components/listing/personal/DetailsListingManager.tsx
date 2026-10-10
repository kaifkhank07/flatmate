"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useListingStore } from "@/store/useListingStore";
import { PropertyListingItem, FlatmateRequirementItem } from "@/types/listing";
import PropertyDetails from "./details/PropertyDetails";
import FlatmateRequirementPartnerDetails from "./details/FlatmateRequirementPartnerDetails";
import FlatmateRequirementPropertyDetails from "./details/FlatmateRequirementPropertyDetails";

interface DetailsListingManagerProps {
  slug?: string;
  listingData?: any;
}

export default function DetailsListingManager({ slug: propSlug, listingData }: DetailsListingManagerProps) {
  const params = useParams();
  const activeSlug = propSlug || (params?.slug as string);

  const {
    selectedListing,
    loadingDetails,
    fetchListingBySlug,
    options,
    fetchListingOptions,
  } = useListingStore();

  useEffect(() => {
    if (activeSlug) {
      fetchListingBySlug(activeSlug);
    }
  }, [activeSlug, fetchListingBySlug]);

  useEffect(() => {
    if (options.amenities.length === 0 || options.lifestylePreferences.length === 0) {
      fetchListingOptions();
    }
  }, [fetchListingOptions, options.amenities.length, options.lifestylePreferences.length]);

  if (loadingDetails) {
    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border border-gray-200 drop-shadow-md p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
          <p className="text-gray-500 font-medium text-sm">Loading listing details...</p>
        </div>
      </section>
    );
  }

  if (!selectedListing) {
    if (listingData) {
      return <PropertyDetails listing={{} as PropertyListingItem} slug={activeSlug} listingData={listingData} />;
    }

    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border border-gray-200 drop-shadow-md p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-gray-500 font-medium text-base mb-2">Listing not found or unavailable.</p>
        </div>
      </section>
    );
  }

  // 1. Property listing — sourceType: "property"
  if (selectedListing.sourceType === "property") {
    return (
      <PropertyDetails
        listing={selectedListing as PropertyListingItem}
        slug={activeSlug}
        listingData={listingData}
      />
    );
  }

  // 2 & 3. Flatmate Requirement listings — sourceType: "flatmate_requirement"
  if (selectedListing.sourceType === "flatmate_requirement") {
    const flatmateListing = selectedListing as FlatmateRequirementItem;

    if (flatmateListing.postType === "property") {
      return (
        <FlatmateRequirementPropertyDetails
          listing={flatmateListing}
          slug={activeSlug}
          listingData={listingData}
        />
      );
    }

    if (flatmateListing.postType === "partner") {
      return (
        <FlatmateRequirementPartnerDetails
          listing={flatmateListing}
          slug={activeSlug}
          listingData={listingData}
        />
      );
    }

    return (
      <FlatmateRequirementPropertyDetails
        listing={flatmateListing}
        slug={activeSlug}
        listingData={listingData}
      />
    );
  }

  return (
    <PropertyDetails
      listing={selectedListing as PropertyListingItem}
      slug={activeSlug}
      listingData={listingData}
    />
  );
}
