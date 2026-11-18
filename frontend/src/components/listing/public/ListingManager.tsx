"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ListingCategory,
  GenderFilter,
  ListingSortOption,
  FurnishingType,
  mapUnifiedListingToCard,
  getCategoryFilters,
} from "@/types/listing";
import { useListingStore } from "@/store/useListingStore";
import ListingFilterBar from "./ListingFilterBar";
import ListingCard from "@/components/listing/shared/ListingCard";
import { Loader2 } from "lucide-react";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import { ViewReveal } from "@/components/animation";

export default function ListingManager() {
  const {
    listings,
    loading,
    loadingMore,
    error,
    pagination,
    fetchListings,
    setFilters,
    resetFilters,
  } = useListingStore();

  const searchParams = useSearchParams();
  const router = useRouter();
  const cityParam = searchParams.get("city");
  const categoryParam = searchParams.get("category");
  const propertyTypeParam = searchParams.get("propertyType") || searchParams.get("listingType");

  const [selectedCategory, setSelectedCategory] =
    useState<ListingCategory>("All");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("Any");
  const [selectedSort, setSelectedSort] = useState<ListingSortOption>("relevance");
  const [selectedFurnishing, setSelectedFurnishing] = useState<FurnishingType>("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedBhk, setSelectedBhk] = useState<string>("all");
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{
    placeId: string;
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);

  // Helper to remove ?city=... / ?category=... / ?listingType=... / ?propertyType=... from URL if present
  const clearCityUrlParam = () => {
    if (
      searchParams.get("city") ||
      searchParams.get("category") ||
      searchParams.get("listingType") ||
      searchParams.get("propertyType")
    ) {
      router.replace("/listing", { scroll: false });
    }
  };

  // Sync city, category, and propertyType params from URL on initial load or URL change
  useEffect(() => {
    let categoryToSet: ListingCategory = "All";
    if (
      categoryParam === "Flat" ||
      categoryParam === "Flatmate" ||
      categoryParam === "Property"
    ) {
      categoryToSet = categoryParam as ListingCategory;
    }
    setSelectedCategory(categoryToSet);

    const catFilters = getCategoryFilters(categoryToSet);
    if (propertyTypeParam && categoryToSet === "Property") {
      setSelectedPropertyType(propertyTypeParam);
      catFilters.propertyType = propertyTypeParam as any;
      catFilters.listingType = propertyTypeParam as any;
    }

    if (cityParam && cityParam.trim()) {
      const trimmedCity = cityParam.trim();
      setSearchQuery(trimmedCity);

      searchFrontendGooglePlaces(trimmedCity)
        .then(async (suggestions) => {
          if (suggestions && suggestions.length > 0) {
            try {
              const details = await getFrontendPlaceDetails(suggestions[0].placeId);
              setSelectedPlace({
                placeId: details.placeId,
                latitude: details.latitude,
                longitude: details.longitude,
                name: details.name || suggestions[0].mainText || trimmedCity,
              });
              setFilters({
                ...catFilters,
                locationPlaceId: details.placeId,
                latitude: details.latitude,
                longitude: details.longitude,
                searchLocationName: details.name || suggestions[0].mainText || trimmedCity,
                q: undefined,
                page: 1,
              });
              return;
            } catch (e) {
              // Fallback to q text search
            }
          }
          setFilters({ ...catFilters, q: trimmedCity, page: 1 });
        })
        .catch(() => {
          setFilters({ ...catFilters, q: trimmedCity, page: 1 });
        });
    } else {
      if (categoryParam || propertyTypeParam) {
        setFilters({ ...catFilters, page: 1 });
      } else {
        fetchListings();
      }
    }
  }, [cityParam, categoryParam, propertyTypeParam, fetchListings, setFilters]);

  // Debounced text search query handler (only active when no Google Place is selected)
  useEffect(() => {
    if (selectedPlace) return;
    if (cityParam && searchQuery === cityParam.trim()) return;

    const timer = setTimeout(() => {
      setFilters({ q: searchQuery.trim() || undefined, page: 1 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlace, setFilters, cityParam]);

  // Handle Google Place selection
  const handleSelectPlace = (
    place: {
      placeId: string;
      latitude: number;
      longitude: number;
      name: string;
    } | null
  ) => {
    setSelectedPlace(place);

    if (place) {
      setFilters({
        locationPlaceId: place.placeId,
        latitude: place.latitude,
        longitude: place.longitude,
        searchLocationName: place.name,
        q: undefined,
        page: 1,
      });
    } else {
      clearCityUrlParam();
      setFilters({
        locationPlaceId: undefined,
        latitude: undefined,
        longitude: undefined,
        searchLocationName: undefined,
        q: searchQuery.trim() || undefined,
        page: 1,
      });
    }
  };

  // Handle Category Selection
  const handleSelectCategory = (cat: ListingCategory) => {
    setSelectedCategory(cat);
    const catFilters = getCategoryFilters(cat);

    const nextPropertyType = cat === "Property" ? selectedPropertyType : "all";
    const nextBhk = cat === "Property" ? selectedBhk : "all";
    if (cat !== "Property") {
      setSelectedPropertyType("all");
      setSelectedBhk("all");
    }

    setFilters({
      ...catFilters,
      listingType: undefined,
      partnerType: undefined,
      propertyType: nextPropertyType === "all" ? undefined : (nextPropertyType as any),
      bhk: nextBhk === "all" ? undefined : (nextBhk as any),
      page: 1,
    });
  };

  // Handle Gender Filter Selection
  const handleSelectGender = (gender: GenderFilter) => {
    setSelectedGender(gender);
    const genderPreference =
      gender === "Male" ? "male" : gender === "Female" ? "female" : "any";

    setFilters({ genderPreference, page: 1 });
  };

  // Handle Sort Selection
  const handleSelectSort = (sort: ListingSortOption) => {
    setSelectedSort(sort);
    setFilters({ sortBy: sort, page: 1 });
  };

  // Handle Furnishing Selection
  const handleSelectFurnishing = (furnishing: FurnishingType) => {
    setSelectedFurnishing(furnishing);
    setFilters({
      furnishing: furnishing === "all" ? undefined : furnishing,
      page: 1,
    });
  };

  // Handle Property Type Filter Selection
  const handleSelectPropertyType = (type: string) => {
    setSelectedPropertyType(type);
    setFilters({
      propertyType: type === "all" ? undefined : (type as any),
      page: 1,
    });
  };

  // Handle BHK Filter Selection
  const handleSelectBhk = (bhk: string) => {
    setSelectedBhk(bhk);
    setFilters({
      bhk: bhk === "all" ? undefined : (bhk as any),
      page: 1,
    });
  };

  // Handle Budget Range Application
  const handleApplyBudget = (min?: number, max?: number) => {
    setMinBudget(min);
    setMaxBudget(max);
    setFilters({
      minBudget: min,
      maxBudget: max,
      budget: undefined,
      rent: undefined,
      page: 1,
    });
  };

  // Handle Search Input Change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      clearCityUrlParam();
    }
  };

  // Handle Filter Reset
  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedGender("Any");
    setSelectedSort("relevance");
    setSelectedFurnishing("all");
    setSelectedPropertyType("all");
    setSelectedBhk("all");
    setMinBudget(undefined);
    setMaxBudget(undefined);
    setSearchQuery("");
    setSelectedPlace(null);
    clearCityUrlParam();
    resetFilters();
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedGender !== "Any" ||
    selectedSort !== "relevance" ||
    selectedFurnishing !== "all" ||
    minBudget !== undefined ||
    maxBudget !== undefined ||
    !!searchQuery.trim() ||
    selectedPlace !== null;

  useEffect(() => {
    // Reset to default filters when opening the listing page
    if (!cityParam && !categoryParam && !propertyTypeParam) {
      setSelectedCategory("All");
      setSelectedGender("Any");
      setSelectedSort("relevance");
      setSelectedFurnishing("all");
      setSelectedPropertyType("all");
      setSelectedBhk("all");
      setMinBudget(undefined);
      setMaxBudget(undefined);
      setSearchQuery("");
      setSelectedPlace(null);

      resetFilters();
      fetchListings();
    }
  }, [
    cityParam,
    categoryParam,
    propertyTypeParam,
    resetFilters,
    fetchListings,
  ]);

  return (
    <section className="w-full">
      {/* Category Tabs, Filters, Sort & Search Bar */}
      <ListingFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        selectedGender={selectedGender}
        onSelectGender={handleSelectGender}
        selectedSort={selectedSort}
        onSelectSort={handleSelectSort}
        selectedFurnishing={selectedFurnishing}
        onSelectFurnishing={handleSelectFurnishing}
        selectedPropertyType={selectedPropertyType}
        onSelectPropertyType={handleSelectPropertyType}
        selectedBhk={selectedBhk}
        onSelectBhk={handleSelectBhk}
        minBudget={minBudget}
        maxBudget={maxBudget}
        onApplyBudget={handleApplyBudget}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Listing Cards Grid */}
      <ViewReveal duration={800}>
        <div className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16 pb-24 sm:pb-28 lg:pb-12">
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
                {/* {pagination.totalPages > 1 && (
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
                )} */}
                {/* Load More Button */}
                {pagination.hasNextPage && (
                  <div className="flex justify-center pt-6">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() =>
                        fetchListings(
                          { page: pagination.page + 1 },
                          true
                        )
                      }
                      className="text-white text-sm sm:text-base py-3.5 px-7 rounded-full bg-brand-blue hover:bg-[#0052c7] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {loadingMore ? "Loading..." : "Load More"}
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
      </ViewReveal>
    </section>
  );
}
