"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useListingStore } from "@/store/useListingStore";
import PropertyEditForm from "./edit/PropertyEditForm";
import FlatmateEditForm1 from "./edit/FlatmateEditForm1";
import FlatmateEditForm2 from "./edit/FlatmateEditForm2";

interface EditListingManagerProps {
  slug?: string;
}

export default function EditListingManager({ slug: propSlug }: EditListingManagerProps) {
  const params = useParams();
  const router = useRouter();
  const activeSlug = propSlug || (params?.slug as string);

  const { selectedListing, loadingDetails, fetchListingBySlug, error } = useListingStore();

  useEffect(() => {
    if (activeSlug) {
      fetchListingBySlug(activeSlug);
    }
  }, [activeSlug, fetchListingBySlug]);

  const handleBack = () => {
    if (selectedListing) {
      const slugOrId = selectedListing.slug || selectedListing._id;
      router.push(`/my-listings/${slugOrId}`);
    } else {
      router.push("/my-listings");
    }
  };

  if (loadingDetails) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
        <p className="text-gray-500 font-medium text-sm">Loading listing details for editing...</p>
      </div>
    );
  }

  if (error || !selectedListing) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <p className="text-gray-600 font-medium text-base">
          {error || "Listing not found or failed to load."}
        </p>
        <Link
          href="/my-listings"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Listings
        </Link>
      </div>
    );
  }

  const isProperty = selectedListing.sourceType === "property";
  const postType = (selectedListing as any).postType || "property";

  return (
    <div className="w-full py-6 md:py-8 lg:py-12">
      {isProperty && (
        <PropertyEditForm onBack={handleBack} initialData={selectedListing} />
      )}

      {!isProperty && postType === "property" && (
        <FlatmateEditForm1 onBack={handleBack} initialData={selectedListing} />
      )}

      {!isProperty && postType === "partner" && (
        <FlatmateEditForm2 onBack={handleBack} initialData={selectedListing} />
      )}
    </div>
  );
}
