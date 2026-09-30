"use client";

import React, { useEffect, useState } from "react";
import {
  ListingCategory,
  GenderFilter,
  mapUnifiedListingToCard,
} from "@/data/listings";
import { useListingStore } from "@/store/useListingStore";
import ListingFilterBar from "./ListingFilterBar";
import ListingCard from "./ListingCard";
import { Loader2 } from "lucide-react";

export default function ListingManager() {
  const {
    listings,
    loading,
    error,
    pagination,
    fetchListings,
    setFilters,
    resetFilters,
  } = useListingStore();

  const [selectedCategory, setSelectedCategory] =
    useState<ListingCategory>("All");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch listings when component mounts
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Debounced search query handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ q: searchQuery.trim() || undefined, page: 1 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, setFilters]);

  // Handle Category Selection
  const handleSelectCategory = (cat: ListingCategory) => {
    setSelectedCategory(cat);

    let sourceType: "all" | "property" | "flatmate_requirement" = "all";
    let postType: "property" | "partner" | undefined = undefined;

    if (cat === "Flat") {
      sourceType = "flatmate_requirement";
      postType = "property";
    } else if (cat === "Flatmate") {
      sourceType = "flatmate_requirement";
      postType = "partner";
    } else if (cat === "Property") {
      sourceType = "property";
      postType = undefined;
    } else {
      sourceType = "all";
      postType = undefined;
    }

    setFilters({
      sourceType,
      postType,
      listingType: undefined,
      partnerType: undefined,
      propertyType: undefined,
      page: 1,
    });
  };

  // Handle Gender Filter Selection
  const handleSelectGender = (gender: GenderFilter) => {
    setSelectedGender(gender);
    const genderPreference =
      gender === "Male" ? "male" : gender === "Female" ? "female" : undefined;

    setFilters({ genderPreference, page: 1 });
  };

  // Handle Filter Reset
  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedGender("All");
    setSearchQuery("");
    resetFilters();
  };

  return (
    <section className="w-full">
      {/* Category Tabs, Gender Filter & Search Bar */}
      <ListingFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        selectedGender={selectedGender}
        onSelectGender={handleSelectGender}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Listing Cards Grid */}
      <div className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-8xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
              <p className="text-gray-500 font-medium text-sm">
                Fetching listings...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-red-100 shadow-sm max-w-md mx-auto my-8 p-6">
              <p className="text-red-500 font-medium text-base mb-3">
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchListings()}
                className="px-5 py-2 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {listings.map((item) => {
                  const cardData = mapUnifiedListingToCard(item);
                  return <ListingCard key={item._id} item={cardData} />;
                })}
              </div>

              {/* Backend Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setFilters({ page: pagination.page - 1 })}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 font-medium px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setFilters({ page: pagination.page + 1 })}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto my-8">
              <p className="text-gray-500 font-medium text-base">
                No listings found matching your filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-5 py-2 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
