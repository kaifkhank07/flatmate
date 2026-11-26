"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, AlertCircle, Eye } from "lucide-react";
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
  const status = selectedListing.status;
  const isEditable = status === "pending" || status === "rejected";

  if (!isEditable) {
    const slugOrId = selectedListing.slug || selectedListing._id;
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-10 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Editing Not Allowed
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
              This listing is currently{" "}
              <span className="font-semibold uppercase text-amber-800">
                {status || "not eligible"}
              </span>{" "}
              and cannot be edited. Only listings with <strong>pending</strong> or{" "}
              <strong>rejected</strong> status can be modified.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/my-listings/${slugOrId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Eye size={16} />
              View Listing Details
            </Link>
            <Link
              href="/my-listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to My Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
