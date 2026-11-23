"use client";

import React, { useEffect, useState } from "react";
import SectionHeading from "@/components/utils/SectionHeading";
import ArrowLink from "@/components/utils/ArrowLink";
import { ViewReveal } from "@/components/animation";
import { getRelatedListingsApi } from "@/lib/apiServices";
import { UnifiedListingItem, mapUnifiedListingToCard } from "@/types/listing";
import ListingCard from "@/components/listing/shared/ListingCard";

interface RelatedListingsProps {
  listingId: string;
  limit?: number;
}

export default function RelatedListings({
  listingId,
  limit = 6,
}: RelatedListingsProps) {
  const [listings, setListings] = useState<UnifiedListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (!listingId) {
      setLoading(false);
      setListings([]);
      return;
    }

    const fetchRelated = async () => {
      try {
        setLoading(true);
        const res = await getRelatedListingsApi(listingId, limit);
        if (isMounted) {
          if (res?.success && Array.isArray(res.data?.listings)) {
            setListings(res.data.listings);
          } else {
            setListings([]);
          }
        }
      } catch {
        if (isMounted) {
          setListings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [listingId, limit]);

  if (loading) {
    return (
      <section className="w-full py-16 md:py-20 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
          <SectionHeading
            heading="SIMILAR PLACES"
            title="Related Listings"
            description="Finding verified listings near this location..."
            className="text-black max-w-3xl"
          />
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="w-full h-44 bg-[#F2FAFD] rounded-[24px] sm:rounded-[32px] animate-pulse border border-gray-100/80"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
          <SectionHeading
            // heading="SIMILAR PLACES"
            title="Related Listings"
            description="Explore more verified listings near this location."
            className="text-black max-w-3xl"
          />

          <ArrowLink
            text="View All Listings"
            href="/listing"
            className="hidden sm:inline-flex text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
          />
        </div>

        {/* Listings Grid with ViewReveal */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {listings.map((item) => {
            const cardData = mapUnifiedListingToCard(item);
            return (
              <ViewReveal key={item._id} duration={800} startDelay={100}>
                <ListingCard item={cardData} />
              </ViewReveal>
            );
          })}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 px-4 sm:hidden">
          <ArrowLink
            text="View All Listings"
            href="/listing"
            className="flex sm:hidden w-fit mx-auto text-black text-xs sm:text-sm font-medium px-6 py-2.5 bg-transparent hover:bg-brand-blue/5 transition-all cursor-pointer whitespace-nowrap rounded-full border-2 border-brand-blue"
          />
        </div>
      </div>
    </section>
  );
}
