"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useListingStore } from "@/store/useListingStore";

interface ListingBreadcrumProps {
  city?: string;
  title?: string;
  slug?: string;
}

function BreadcrumbContent({ city: propCity, title: propTitle, slug: propSlug }: ListingBreadcrumProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const { selectedListing } = useListingStore();

  const urlCity = searchParams?.get("city");
  const routeSlug = (params?.slug as string) || propSlug;

  // Resolve dynamic values
  const cityName =
    propCity ||
    urlCity ||
    (typeof selectedListing?.location === "object" ? selectedListing.location?.city : undefined);

  const itemTitle =
    propTitle ||
    selectedListing?.title ||
    (routeSlug ? routeSlug.replace(/-/g, " ") : undefined);

  // Build breadcrumb segments array
  const segments: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
  ];

  // Listing segment
  const isListingActive = !cityName && !routeSlug;
  segments.push({
    label: "Listing",
    href: isListingActive ? undefined : "/listing",
  });

  // City segment
  if (cityName) {
    const isCityActive = !routeSlug;
    segments.push({
      label: cityName,
      href: isCityActive ? undefined : `/listing?city=${encodeURIComponent(cityName)}`,
    });
  }

  // Detail / Slug segment
  if (routeSlug && itemTitle) {
    segments.push({
      label: itemTitle,
      href: undefined,
    });
  }

  return (
    <section className="w-full pt-8 md:pt-12 overflow-hidden">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-16 bg-background">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto flex justify-start items-center gap-2 py-4 sm:py-6 flex-wrap">
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-gray-500 text-sm sm:text-base font-medium">/</span>
                )}
                {segment.href && !isLast ? (
                  <Link
                    href={segment.href}
                    className="text-gray-900 text-sm sm:text-base font-medium hover:text-brand-blue transition-colors capitalize truncate max-w-[150px] sm:max-w-[250px]"
                  >
                    {segment.label}
                  </Link>
                ) : (
                  <span className="text-gray-500 text-sm sm:text-base font-medium capitalize truncate max-w-[150px] sm:max-w-[300px]">
                    {segment.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function ListingBreadcrum(props: ListingBreadcrumProps) {
  return (
    <Suspense
      fallback={
        <section className="w-full pt-8 md:pt-12 overflow-hidden">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-16 bg-background">
            <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto flex justify-start items-center gap-2 py-4 sm:py-6">
              <Link href="/" className="text-gray-900 text-sm sm:text-base font-medium hover:text-brand-blue transition-colors">
                Home
              </Link>
              <span className="text-gray-500 text-sm sm:text-base font-medium">/</span>
              <span className="text-gray-500 text-sm sm:text-base font-medium">Listing</span>
            </div>
          </div>
        </section>
      }
    >
      <BreadcrumbContent {...props} />
    </Suspense>
  );
}