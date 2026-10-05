"use client";

import React, { useState, useRef, useEffect } from "react";
import { ListingCategory } from "@/types/listing";
import { Home, Bed, Users, Building, ChevronDown, MapPin, X, Loader2 } from "lucide-react";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import { AutocompleteSuggestion } from "@/lib/apiServices";

export type StatusFilter =
  | "all"
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "blocked"
  | "closed"
  | "expired";

interface SelectedPlace {
  placeId: string;
  latitude: number;
  longitude: number;
  name: string;
}

interface MyListingFilterBarProps {
  selectedCategory: ListingCategory;
  onSelectCategory: (cat: ListingCategory) => void;
  statusFilter: StatusFilter;
  onSelectStatus: (status: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlace: SelectedPlace | null;
  onSelectPlace: (place: SelectedPlace | null) => void;
}

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  // { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Blocked", value: "blocked" },
  { label: "Closed", value: "closed" },
  { label: "Expired", value: "expired" },
];

export default function MyListingFilterBar({
  selectedCategory,
  onSelectCategory,
  statusFilter,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  selectedPlace,
  onSelectPlace,
}: MyListingFilterBarProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const categories: { label: ListingCategory; displayLabel: string; icon: React.ReactNode }[] = [
    { label: "All", displayLabel: "All Listing", icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: "Flat", displayLabel: "Flat", icon: <Bed className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: "Flatmate", displayLabel: "Flatmate", icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: "Property", displayLabel: "Property", icon: <Building className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Google Places Autocomplete search on user typing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2 || selectedPlace) {
      setSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingPlaces(true);
        const results = await searchFrontendGooglePlaces(searchQuery);
        setSuggestions(results);
        setShowPredictions(results.length > 0);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlace]);

  const handleSelectSuggestion = async (suggestion: AutocompleteSuggestion) => {
    setShowPredictions(false);
    setIsSearchingPlaces(true);

    try {
      const details = await getFrontendPlaceDetails(suggestion.placeId);
      onSelectPlace({
        placeId: details.placeId,
        latitude: details.latitude,
        longitude: details.longitude,
        name: details.name || suggestion.mainText || suggestion.description,
      });
      onSearchChange(details.name || suggestion.mainText || suggestion.description);
    } catch (err) {
      console.error("Failed to fetch place details:", err);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleClearLocation = () => {
    onSelectPlace(null);
    onSearchChange("");
    setSuggestions([]);
    setShowPredictions(false);
  };

  const selectedStatusObj = statusOptions.find((opt) => opt.value === statusFilter);
  const selectedStatusLabel = selectedStatusObj?.label || "All Status";

  return (
    <div className="w-full space-y-4 pt-8 md:pt-12">
      {/* Category Tabs & Status Filter Bar */}
      <div className="w-full py-3 px-4 sm:px-6 lg:px-16 relative z-20">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          {/* Left Category Tabs */}
          <div className="flex items-center gap-6 sm:gap-10">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => onSelectCategory(cat.label)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-1 transition-all cursor-pointer relative shrink-0 ${isActive
                    ? "text-black font-semibold"
                    : "text-gray-400 hover:text-gray-600 font-medium"
                    }`}
                >
                  {cat.icon}
                  <span className="text-xs sm:text-sm">{cat.displayLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Right Filter Pills: Status Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className="bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <span>
                  Status{statusFilter !== "all" ? `: ${selectedStatusLabel}` : ""}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${statusOpen ? "rotate-180" : ""}`}
                />
              </button>

              {statusOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelectStatus(opt.value);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${statusFilter === opt.value
                        ? "bg-blue-50 text-[#0066FF] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar with Google Places Autocomplete */}
      <div className="w-full py-3 px-4 sm:px-6 lg:px-16 bg-background overflow-visible">
        <div
          ref={searchContainerRef}
          className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto relative"
        >
          <div className="w-full flex items-center gap-3 px-5 sm:px-6 py-3 border border-gray-200 bg-white rounded-full shadow-xs">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#0066FF] shrink-0" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                if (selectedPlace) {
                  onSelectPlace(null);
                }
                onSearchChange(e.target.value);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowPredictions(true);
              }}
              placeholder="Search location"
              className="w-full bg-transparent text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 outline-none font-medium"
            />

            {isSearchingPlaces && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}

            {(searchQuery || selectedPlace) && !isSearchingPlaces && (
              <button
                type="button"
                onClick={handleClearLocation}
                aria-label="Clear location search"
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Predictions Dropdown */}
          {showPredictions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-2 max-h-72 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.placeId}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-5 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {item.mainText}
                    </p>
                    {item.secondaryText && (
                      <p className="text-[11px] sm:text-xs text-gray-500">
                        {item.secondaryText}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
