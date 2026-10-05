"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Loader2, X } from "lucide-react";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import { AutocompleteSuggestion } from "@/lib/apiServices";
import { ListingCategory } from "@/types/listing";

interface SelectedPlace {
  placeId: string;
  latitude: number;
  longitude: number;
  name: string;
}

interface SearchSectionProps {
  className?: string;
  onSearch?: (searchData: {
    location: string;
    lookingFor: string;
    selectedPlace?: SelectedPlace | null;
  }) => void;
}

export default function SearchSection({
  className = "",
  onSearch,
}: SearchSectionProps) {
  const router = useRouter();
  const [locationInput, setLocationInput] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory>("All");

  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const categories: { label: ListingCategory; displayLabel: string }[] = [
    { label: "All", displayLabel: "All Listing" },
    { label: "Flat", displayLabel: "Flat" },
    { label: "Flatmate", displayLabel: "Flatmate" },
    { label: "Property", displayLabel: "Property" },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
        setCategoryOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Google Places Autocomplete search as user types
  useEffect(() => {
    if (!locationInput || locationInput.trim().length < 2 || selectedPlace) {
      setSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingPlaces(true);
        const results = await searchFrontendGooglePlaces(locationInput);
        setSuggestions(results);
        setShowPredictions(results.length > 0);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationInput, selectedPlace]);

  const handleSelectSuggestion = async (suggestion: AutocompleteSuggestion) => {
    setShowPredictions(false);
    setIsSearchingPlaces(true);
    try {
      const details = await getFrontendPlaceDetails(suggestion.placeId);
      const place: SelectedPlace = {
        placeId: details.placeId,
        latitude: details.latitude,
        longitude: details.longitude,
        name: details.name || suggestion.mainText || suggestion.description,
      };
      setSelectedPlace(place);
      setLocationInput(place.name);
    } catch (err) {
      console.error("Failed to fetch place details:", err);
      setSelectedPlace(null);
      const fallbackName = suggestion.mainText || suggestion.description;
      setLocationInput(fallbackName);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleClearLocation = () => {
    setSelectedPlace(null);
    setLocationInput("");
    setSuggestions([]);
    setShowPredictions(false);
  };

  const handleSearchSubmit = () => {
    const selectedLocationName = selectedPlace?.name || locationInput.trim();
    const searchParams = new URLSearchParams();

    if (selectedLocationName) {
      searchParams.set("city", selectedLocationName);
    }

    if (selectedCategory && selectedCategory !== "All") {
      searchParams.set("category", selectedCategory);
    }

    if (onSearch) {
      onSearch({
        location: selectedLocationName,
        lookingFor: selectedCategory,
        selectedPlace,
      });
    }

    const queryString = searchParams.toString();
    const targetUrl = queryString ? `/listing?${queryString}` : "/listing";
    router.push(targetUrl);
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-30 w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 ${className}`}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl flex flex-col md:grid md:grid-cols-4 items-stretch p-2 md:p-0 md:pl-2 lg:pl-4">
        {/* Direct Location Search Input - Takes 2 Columns */}
        <div className="relative md:col-span-2 px-4 lg:px-6 py-3 lg:py-5 border-b md:border-b-0 md:border-r border-gray-200 flex items-center justify-between group rounded-2xl md:rounded-none transition-colors">
          <div className="w-full pr-2">
            <label
              htmlFor="search-location-input"
              className="block text-gray-800 text-xs sm:text-sm lg:text-xl font-medium tracking-tight cursor-pointer"
            >
              Choose Location
            </label>

            <div className="relative flex items-center mt-0.5 w-full">
              <input
                id="search-location-input"
                type="text"
                value={locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value);
                  if (selectedPlace) setSelectedPlace(null);
                  setShowPredictions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowPredictions(true);
                }}
                placeholder="(E.G., Mumbai)"
                className="block text-xs lg:text-sm text-gray-600 font-medium bg-transparent outline-none placeholder:text-gray-400 w-full truncate"
              />

              {isSearchingPlaces ? (
                <Loader2 className="w-4 h-4 text-brand-blue animate-spin shrink-0 ml-1" />
              ) : (locationInput || selectedPlace) ? (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Location Predictions Autocomplete Popup - Matches exact parent width */}
          {showPredictions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 md:top-auto md:bottom-full md:mt-0 md:mb-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in-50 slide-in-from-top-2 md:slide-in-from-bottom-2 duration-150 max-h-60 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.placeId}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand-ice text-gray-700 hover:text-brand-blue transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                      {item.mainText}
                    </p>
                    {item.secondaryText && (
                      <p className="text-[11px] text-gray-500 truncate">
                        {item.secondaryText}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category (Looking For) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCategoryOpen(!categoryOpen);
              setShowPredictions(false);
            }}
            className="w-full text-left px-4 lg:px-6 py-3 lg:py-5 border-b md:border-b-0 md:border-r border-gray-200 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl md:rounded-none transition-colors"
          >
            <div>
              <span className="block text-gray-800 text-xs sm:text-sm lg:text-xl font-medium tracking-tight">
                Looking For
              </span>

              <span className="block text-xs lg:text-sm text-gray-600 font-medium mt-0.5">
                {selectedCategory === "All" ? "All Listing" : selectedCategory}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${categoryOpen ? "rotate-180 text-brand-dark" : ""
                }`}
            />
          </button>

          {categoryOpen && (
            <div className="absolute left-0 top-full mt-2 md:top-auto md:bottom-full md:mt-0 md:mb-2 w-full md:w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 md:slide-in-from-bottom-2 duration-150">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.label);
                    setCategoryOpen(false);
                  }}
                  className={`w-full text-left px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${selectedCategory === cat.label
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                    }`}
                >
                  {cat.displayLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="w-full md:w-auto self-stretch flex items-stretch mt-2 md:mt-0">
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="w-full min-w-[160px] lg:min-w-[220px] bg-brand-blue hover:bg-[#0052c7] text-white text-xs sm:text-sm lg:text-xl font-medium tracking-tight py-3.5 sm:py-4 md:py-0 px-8 lg:px-12 rounded-2xl md:rounded-3xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
