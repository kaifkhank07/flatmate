"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ListingCategory,
  GenderFilter,
  ListingSortOption,
  FurnishingType,
} from "@/types/listing";
import {
  Home,
  Bed,
  Users,
  Building,
  ChevronDown,
  MapPin,
  X,
  Loader2,
  ArrowUpDown,
  Armchair,
  IndianRupee,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  searchFrontendGooglePlaces,
  getFrontendPlaceDetails,
} from "@/lib/googlePlaces";
import { AutocompleteSuggestion } from "@/lib/apiServices";

interface SelectedPlace {
  placeId: string;
  latitude: number;
  longitude: number;
  name: string;
}

interface ListingFilterBarProps {
  selectedCategory: ListingCategory;
  onSelectCategory: (cat: ListingCategory) => void;

  selectedGender: GenderFilter;
  onSelectGender: (gender: GenderFilter) => void;

  selectedSort: ListingSortOption;
  onSelectSort: (sort: ListingSortOption) => void;

  selectedFurnishing: FurnishingType;
  onSelectFurnishing: (furnishing: FurnishingType) => void;

  minBudget?: number;
  maxBudget?: number;
  onApplyBudget: (min?: number, max?: number) => void;

  searchQuery: string;
  onSearchChange: (query: string) => void;

  selectedPlace: SelectedPlace | null;
  onSelectPlace: (place: SelectedPlace | null) => void;

  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export default function ListingFilterBar({
  selectedCategory,
  onSelectCategory,
  selectedGender,
  onSelectGender,
  selectedSort,
  onSelectSort,
  selectedFurnishing,
  onSelectFurnishing,
  minBudget,
  maxBudget,
  onApplyBudget,
  searchQuery,
  onSearchChange,
  selectedPlace,
  onSelectPlace,
  onResetFilters,
  hasActiveFilters,
}: ListingFilterBarProps) {
  // Dropdown open states
  const [sortOpen, setSortOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [furnishingOpen, setFurnishingOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);

  // Local state for budget inputs
  const [localMin, setLocalMin] = useState<string>(
    minBudget !== undefined ? String(minBudget) : ""
  );
  const [localMax, setLocalMax] = useState<string>(
    maxBudget !== undefined ? String(maxBudget) : ""
  );

  // Synchronize local budget inputs when props change
  useEffect(() => {
    setLocalMin(minBudget !== undefined ? String(minBudget) : "");
    setLocalMax(maxBudget !== undefined ? String(maxBudget) : "");
  }, [minBudget, maxBudget]);

  // Google Places search states
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Refs for click outside
  const sortRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const furnishingRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const categories: {
    label: ListingCategory;
    displayLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      label: "All",
      displayLabel: "All Listing",
      icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      label: "Flat",
      displayLabel: "Flat",
      icon: <Bed className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      label: "Flatmate",
      displayLabel: "Flatmate",
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      label: "Property",
      displayLabel: "Property",
      icon: <Building className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  const sortOptions: { label: string; value: ListingSortOption }[] = [
    { label: "Relevance", value: "relevance" },
    { label: "Most Recent", value: "recent" },
    { label: "Price: Low to High", value: "price_low_high" },
    { label: "Price: High to Low", value: "price_high_low" },
  ];

  const sortLabels: Record<ListingSortOption, string> = {
    relevance: "Relevance",
    recent: "Most Recent",
    price_low_high: "Price: Low to High",
    price_high_low: "Price: High to Low",
  };

  const furnishingOptions: { label: string; value: FurnishingType }[] = [
    { label: "All Furnishing", value: "all" },
    { label: "Fully Furnished", value: "fully_furnished" },
    { label: "Semi Furnished", value: "semi_furnished" },
    { label: "Unfurnished", value: "unfurnished" },
  ];

  const furnishingLabels: Record<FurnishingType, string> = {
    all: "Furnishing",
    fully_furnished: "Fully Furnished",
    semi_furnished: "Semi Furnished",
    unfurnished: "Unfurnished",
  };

  const genderOptions: GenderFilter[] = ["Any", "Male", "Female"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
      if (budgetRef.current && !budgetRef.current.contains(target)) {
        setBudgetOpen(false);
      }
      if (furnishingRef.current && !furnishingRef.current.contains(target)) {
        setFurnishingOpen(false);
      }
      if (genderRef.current && !genderRef.current.contains(target)) {
        setGenderOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
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

  const handleSelectSuggestion = async (
    suggestion: AutocompleteSuggestion
  ) => {
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
      onSearchChange(
        details.name || suggestion.mainText || suggestion.description
      );
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

  // Helper for budget label formatting
  const formatAmount = (val: number) => {
    if (val >= 1000 && val % 1000 === 0) {
      return `₹${val / 1000}k`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const isBudgetActive = minBudget !== undefined || maxBudget !== undefined;
  let budgetButtonText = "Budget";
  if (minBudget !== undefined && maxBudget !== undefined) {
    budgetButtonText = `${formatAmount(minBudget)} - ${formatAmount(maxBudget)}`;
  } else if (minBudget !== undefined) {
    budgetButtonText = `${formatAmount(minBudget)}+`;
  } else if (maxBudget !== undefined) {
    budgetButtonText = `Up to ${formatAmount(maxBudget)}`;
  }

  // Budget preset chip click handler
  const handlePresetBudget = (presetMin?: number, presetMax?: number) => {
    setLocalMin(presetMin !== undefined ? String(presetMin) : "");
    setLocalMax(presetMax !== undefined ? String(presetMax) : "");
    onApplyBudget(presetMin, presetMax);
    setBudgetOpen(false);
  };

  // Budget apply action
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMin = localMin.trim() !== "" ? parseFloat(localMin.trim()) : undefined;
    const parsedMax = localMax.trim() !== "" ? parseFloat(localMax.trim()) : undefined;

    if (
      parsedMin !== undefined &&
      parsedMax !== undefined &&
      parsedMin > parsedMax
    ) {
      return;
    }

    onApplyBudget(
      parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : undefined,
      parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : undefined
    );
    setBudgetOpen(false);
  };

  const handleClearBudget = () => {
    setLocalMin("");
    setLocalMax("");
    onApplyBudget(undefined, undefined);
    setBudgetOpen(false);
  };

  const isBudgetRangeInvalid =
    localMin.trim() !== "" &&
    localMax.trim() !== "" &&
    parseFloat(localMin.trim()) > parseFloat(localMax.trim());

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Category Tabs & Filter Controls Bar */}
      <div className="w-full py-2 sm:py-3 px-4 sm:px-6 lg:px-16 relative z-20">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
          {/* Left: Category Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 lg:gap-10 overflow-x-auto no-scrollbar scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => onSelectCategory(cat.label)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-1 transition-all cursor-pointer relative shrink-0 ${
                    isActive
                      ? "text-black font-semibold"
                      : "text-gray-400 hover:text-gray-600 font-medium"
                  }`}
                >
                  {cat.icon}
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    {cat.displayLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Filter & Sort Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0 lg:overflow-visible lg:flex-wrap">
            {/* 1. Sorting Dropdown */}
            <div className="relative shrink-0" ref={sortRef}>
              <button
                type="button"
                onClick={() => {
                  setSortOpen(!sortOpen);
                  setBudgetOpen(false);
                  setFurnishingOpen(false);
                  setGenderOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${
                  selectedSort !== "relevance"
                    ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>
                  {selectedSort === "relevance"
                    ? "Sort"
                    : sortLabels[selectedSort]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    sortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Desktop (lg and up) Dropdown */}
              {sortOpen && (
                <div className="hidden lg:block absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Sort By
                  </div>
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelectSort(opt.value);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                        selectedSort === opt.value
                          ? "bg-blue-50 text-[#0066FF] font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Mobile & Tablet Modal Dialog */}
              {sortOpen && (
                <div
                  className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden bg-black/50 backdrop-blur-xs p-0"
                  onClick={() => setSortOpen(false)}
                >
                  <div
                    className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Sort Listings
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSortOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="divide-y divide-gray-50 py-1">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            onSelectSort(opt.value);
                            setSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                            selectedSort === opt.value
                              ? "bg-blue-50 text-[#0066FF] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selectedSort === opt.value && (
                            <Check className="w-4 h-4 text-[#0066FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Budget Range Filter Popover */}
            <div className="relative shrink-0" ref={budgetRef}>
              <button
                type="button"
                onClick={() => {
                  setBudgetOpen(!budgetOpen);
                  setSortOpen(false);
                  setFurnishingOpen(false);
                  setGenderOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${
                  isBudgetActive
                    ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>{budgetButtonText}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    budgetOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Desktop (lg and up) Popover */}
              {budgetOpen && (
                <div className="hidden lg:block absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">
                      Monthly Budget (₹)
                    </span>
                    {isBudgetActive && (
                      <button
                        type="button"
                        onClick={handleClearBudget}
                        className="text-[11px] text-red-500 hover:text-red-600 font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleBudgetSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                          Min Budget
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-gray-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            placeholder="0"
                            value={localMin}
                            onChange={(e) => setLocalMin(e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#0066FF] focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                          Max Budget
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-gray-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            placeholder="Any"
                            value={localMax}
                            onChange={(e) => setLocalMax(e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#0066FF] focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {isBudgetRangeInvalid && (
                      <p className="text-[11px] text-red-500 font-medium">
                        Min budget cannot be greater than Max budget
                      </p>
                    )}

                    {/* Quick Budget Presets */}
                    <div className="pt-1">
                      <p className="text-[11px] font-medium text-gray-400 mb-1.5">
                        Quick Ranges
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePresetBudget(undefined, 10000)}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-600 transition-colors text-center cursor-pointer border border-gray-100"
                        >
                          Under ₹10k
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetBudget(10000, 20000)}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-600 transition-colors text-center cursor-pointer border border-gray-100"
                        >
                          ₹10k - ₹20k
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetBudget(20000, 35000)}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-600 transition-colors text-center cursor-pointer border border-gray-100"
                        >
                          ₹20k - ₹35k
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetBudget(35000, undefined)}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-600 transition-colors text-center cursor-pointer border border-gray-100"
                        >
                          Above ₹35k
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setBudgetOpen(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isBudgetRangeInvalid}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer shadow-xs transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Mobile & Tablet Modal Dialog */}
              {budgetOpen && (
                <div
                  className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden bg-black/50 backdrop-blur-xs p-0"
                  onClick={() => setBudgetOpen(false)}
                >
                  <div
                    className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Monthly Budget (₹)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBudgetOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleBudgetSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Min Budget
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm text-gray-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              placeholder="0"
                              value={localMin}
                              onChange={(e) => setLocalMin(e.target.value)}
                              className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0066FF] focus:bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Max Budget
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm text-gray-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              placeholder="Any"
                              value={localMax}
                              onChange={(e) => setLocalMax(e.target.value)}
                              className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0066FF] focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {isBudgetRangeInvalid && (
                        <p className="text-xs text-red-500 font-medium">
                          Min budget cannot be greater than Max budget
                        </p>
                      )}

                      {/* Quick Budget Presets on Mobile/Tablet */}
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2">
                          Quick Ranges
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handlePresetBudget(undefined, 10000)}
                            className="py-2.5 px-3 text-xs rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-700 font-medium border border-gray-100 text-center cursor-pointer transition-colors"
                          >
                            Under ₹10,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetBudget(10000, 20000)}
                            className="py-2.5 px-3 text-xs rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-700 font-medium border border-gray-100 text-center cursor-pointer transition-colors"
                          >
                            ₹10,000 - ₹20,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetBudget(20000, 35000)}
                            className="py-2.5 px-3 text-xs rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-700 font-medium border border-gray-100 text-center cursor-pointer transition-colors"
                          >
                            ₹20,000 - ₹35,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetBudget(35000, undefined)}
                            className="py-2.5 px-3 text-xs rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-[#0066FF] text-gray-700 font-medium border border-gray-100 text-center cursor-pointer transition-colors"
                          >
                            Above ₹35,000
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {isBudgetActive && (
                          <button
                            type="button"
                            onClick={handleClearBudget}
                            className="w-1/3 py-2.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer transition-colors"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isBudgetRangeInvalid}
                          className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 rounded-xl cursor-pointer shadow-sm transition-colors text-center"
                        >
                          Apply Budget
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Furnishing Dropdown */}
            <div className="relative shrink-0" ref={furnishingRef}>
              <button
                type="button"
                onClick={() => {
                  setFurnishingOpen(!furnishingOpen);
                  setSortOpen(false);
                  setBudgetOpen(false);
                  setGenderOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${
                  selectedFurnishing !== "all"
                    ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Armchair className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>{furnishingLabels[selectedFurnishing]}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    furnishingOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Desktop (lg and up) Dropdown */}
              {furnishingOpen && (
                <div className="hidden lg:block absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Furnishing
                  </div>
                  {furnishingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelectFurnishing(opt.value);
                        setFurnishingOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                        selectedFurnishing === opt.value
                          ? "bg-blue-50 text-[#0066FF] font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Mobile & Tablet Modal Dialog */}
              {furnishingOpen && (
                <div
                  className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden bg-black/50 backdrop-blur-xs p-0"
                  onClick={() => setFurnishingOpen(false)}
                >
                  <div
                    className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-2">
                        <Armchair className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Furnishing
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFurnishingOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="divide-y divide-gray-50 py-1">
                      {furnishingOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            onSelectFurnishing(opt.value);
                            setFurnishingOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                            selectedFurnishing === opt.value
                              ? "bg-blue-50 text-[#0066FF] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selectedFurnishing === opt.value && (
                            <Check className="w-4 h-4 text-[#0066FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Gender Dropdown Pill */}
            <div className="relative shrink-0" ref={genderRef}>
              <button
                type="button"
                onClick={() => {
                  setGenderOpen(!genderOpen);
                  setSortOpen(false);
                  setBudgetOpen(false);
                  setFurnishingOpen(false);
                }}
                className="bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-2 cursor-pointer transition-colors shadow-sm whitespace-nowrap"
              >
                <span>Gender: {selectedGender}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    genderOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Desktop (lg and up) Dropdown */}
              {genderOpen && (
                <div className="hidden lg:block absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Gender Preference
                  </div>
                  {genderOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onSelectGender(opt);
                        setGenderOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                        selectedGender === opt
                          ? "bg-blue-50 text-[#0066FF] font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt === "Any" ? "Any Gender" : opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Mobile & Tablet Modal Dialog */}
              {genderOpen && (
                <div
                  className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden bg-black/50 backdrop-blur-xs p-0"
                  onClick={() => setGenderOpen(false)}
                >
                  <div
                    className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Gender Preference
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGenderOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="divide-y divide-gray-50 py-1">
                      {genderOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            onSelectGender(opt);
                            setGenderOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                            selectedGender === opt
                              ? "bg-blue-50 text-[#0066FF] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt === "Any" ? "Any Gender" : opt}</span>
                          {selectedGender === opt && (
                            <Check className="w-4 h-4 text-[#0066FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Reset Filters button */}
            {hasActiveFilters && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs sm:text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                title="Reset all filters and sorting to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Input Bar with Google Places Autocomplete */}
      <div className="w-full py-2 sm:py-3 px-4 sm:px-6 lg:px-16 bg-background overflow-visible">
        <div
          ref={searchContainerRef}
          className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto relative"
        >
          <div className="w-full flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 bg-white rounded-full shadow-xs">
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
