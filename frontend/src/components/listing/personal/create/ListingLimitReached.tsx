"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Info } from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import { ViewReveal } from "@/components/animation";
import { useRouter } from "next/navigation";

interface ListingLimitReachedProps {
  totalCount?: number;
  maxLimit?: number;
}

export default function ListingLimitReached({
  totalCount = 3,
  maxLimit = 3,
}: ListingLimitReachedProps) {
  const router = useRouter();

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-12">
        {/* Section Heading */}
        <ViewReveal duration={800}>
          <SectionHeading
            // title="Listing Limit Reached"
            // description="You have reached the maximum allowed limit for creating listings on FlatMate."
            // align="center"
            title="Post Your Requirement"
            description="Find Your Perfect Roommate Or Room Effortlessly. Just Post Your Requirement And Let The Matching Begin!"
            align="center"
          />
        </ViewReveal>

        {/* Limit Message Card */}
        <ViewReveal duration={900} startDelay={100}>
          <div className="bg-white rounded-3xl sm:rounded-[36px] border border-gray-100 shadow-sm p-8 sm:p-12 md:p-14 text-center space-y-6 sm:space-y-8 max-w-2xl mx-auto">
            {/* Warning Shield Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
            </div>

            {/* Title & Message */}
            <div className="space-y-3">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wide">
                Maximum Limit Reached ({totalCount} / {maxLimit})
              </span>

              <h3 className="font-roboto-serif text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight leading-snug">
                You cannot create another listing
              </h3>

              <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
                FlatMate allows a maximum of <strong>{maxLimit} listings</strong> (Properties and Flatmate
                Requirements combined) per account. To create a new listing, please delete or manage one of
                your existing listings.
              </p>
            </div>

            {/* Action CTA: Navigate to My Listings */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => router.replace("/my-listings")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#0066F9] hover:bg-blue-700 text-white rounded-full font-medium text-base shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Manage My Listings</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </ViewReveal>
      </div>
    </section>
  );
}
