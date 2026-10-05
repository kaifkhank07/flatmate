"use client";

import React, { useEffect, useState } from "react";
import { ListingCategory } from "@/types/listing";
import { useListingStore } from "@/store/useListingStore";
import MyListingFilterBar, { StatusFilter } from "./MyListingFilterBar";
import MyListingCard from "./MyListingCard";
import { Loader2 } from "lucide-react";

interface SelectedPlace {
  placeId: string;
  latitude: number;
  longitude: number;
  name: string;
}

export default function MyListings() {
  const {
    myListings,
    loadingMyListings,
    myListingsError,
    myListingsPagination,
    fetchMyListings,
  } = useListingStore();

  const [selectedCategory, setSelectedCategory] =
    useState<ListingCategory>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [page, setPage] = useState(1);

  /**
   * Fetch My Listings whenever page, filters or search location change
   */
  useEffect(() => {
    let sourceType: "all" | "property" | "flatmate_requirement" = "all";
    let postType: "property" | "partner" | undefined;

    if (selectedCategory === "Flat") {
      sourceType = "flatmate_requirement";
      postType = "property";
    } else if (selectedCategory === "Flatmate") {
      sourceType = "flatmate_requirement";
      postType = "partner";
    } else if (selectedCategory === "Property") {
      sourceType = "property";
      postType = undefined;
    }

    fetchMyListings({
      page,
      limit: 10,
      sourceType,
      postType,
      status: statusFilter,
      ...(selectedPlace
        ? {
            locationPlaceId: selectedPlace.placeId,
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
          }
        : {
            q: searchQuery.trim() || undefined,
          }),
      sortBy: selectedPlace ? "distance" : "createdAt",
      order: "desc",
    });
  }, [
    page,
    selectedCategory,
    statusFilter,
    selectedPlace,
    searchQuery,
    fetchMyListings,
  ]);

  const handleSelectCategory = (cat: ListingCategory) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleSelectStatus = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleSelectPlace = (place: SelectedPlace | null) => {
    setSelectedPlace(place);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setStatusFilter("all");
    setSearchQuery("");
    setSelectedPlace(null);
    setPage(1);
  };

  const handleRetry = () => {
    let sourceType: "all" | "property" | "flatmate_requirement" = "all";
    let postType: "property" | "partner" | undefined;

    if (selectedCategory === "Flat") {
      sourceType = "flatmate_requirement";
      postType = "property";
    } else if (selectedCategory === "Flatmate") {
      sourceType = "flatmate_requirement";
      postType = "partner";
    } else if (selectedCategory === "Property") {
      sourceType = "property";
    }

    fetchMyListings({
      page,
      limit: 10,
      sourceType,
      postType,
      status: statusFilter,
      ...(selectedPlace
        ? {
            locationPlaceId: selectedPlace.placeId,
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
          }
        : {
            q: searchQuery.trim() || undefined,
          }),
      sortBy: selectedPlace ? "distance" : "createdAt",
      order: "desc",
    });
  };

  return (
    <section className="w-full">
      {/* Category Tabs, Status Filter & Search Bar */}
      <MyListingFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        statusFilter={statusFilter}
        onSelectStatus={handleSelectStatus}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
      />

      {/* Listing Cards Grid */}
      <div className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-8xl mx-auto">
          {loadingMyListings ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
              <p className="text-gray-500 font-medium text-sm">
                Fetching listings...
              </p>
            </div>
          ) : myListingsError ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-red-100 shadow-sm max-w-md mx-auto my-8 p-6">
              <p className="text-red-500 font-medium text-base mb-3">
                {myListingsError}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : myListings.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myListings.map((item: any) => (
                  <MyListingCard
                    key={`${item.sourceType}-${item._id}`}
                    listing={item}
                  />
                ))}
              </div>

              {/* Backend Pagination Bar */}
              {myListingsPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <button
                    type="button"
                    disabled={!myListingsPagination.hasPreviousPage}
                    onClick={() => setPage(myListingsPagination.page - 1)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 font-medium px-2">
                    Page {myListingsPagination.page} of {myListingsPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!myListingsPagination.hasNextPage}
                    onClick={() => setPage(myListingsPagination.page + 1)}
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