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

  selectedTenantPreference?: string;
  onSelectTenantPreference?: (pref: string) => void;

  selectedSort: ListingSortOption;
  onSelectSort: (sort: ListingSortOption) => void;

  selectedFurnishing: FurnishingType;
  onSelectFurnishing: (furnishing: FurnishingType) => void;

  selectedPropertyType?: string;
  onSelectPropertyType?: (type: string) => void;

  selectedBhk?: string;
  onSelectBhk?: (bhk: string) => void;

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
  selectedTenantPreference = "Any",
  onSelectTenantPreference,
  selectedSort,
  onSelectSort,
  selectedFurnishing,
  onSelectFurnishing,
  selectedPropertyType = "all",
  onSelectPropertyType,
  selectedBhk = "all",
  onSelectBhk,
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [furnishingOpen, setFurnishingOpen] = useState(false);
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  const [bhkOpen, setBhkOpen] = useState(false);
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
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const sortMobileRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const furnishingRef = useRef<HTMLDivElement>(null);
  const propertyTypeRef = useRef<HTMLDivElement>(null);
  const bhkRef = useRef<HTMLDivElement>(null);
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
        displayLabel: "Room",
        icon: <Bed className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        label: "Flatmate",
        displayLabel: "Flatmate",
        icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        label: "Property",
        displayLabel: "Entire Property",
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

  const propertyTypeOptions: { label: string; value: string }[] = [
    { label: "All Property Types", value: "all" },
    { label: "Flat / Apartment", value: "flat_apartment" },
    { label: "House", value: "house" },
    { label: "Villa", value: "villa" },
  ];

  const propertyTypeLabels: Record<string, string> = {
    all: "Property Type",
    flat_apartment: "Flat / Apartment",
    house: "House",
    villa: "Villa",
    flats_apartments: "Flat / Apartment",
    houses_villas: "House",
    office_spaces: "Office Spaces",
    shops_commercial: "Shops / Commercial",
  };

  const bhkOptions: { label: string; value: string }[] = [
    { label: "All BHK", value: "all" },
    { label: "1 RK", value: "1_rk" },
    { label: "1 BHK", value: "1_bhk" },
    { label: "2 BHK", value: "2_bhk" },
    { label: "3 BHK", value: "3_bhk" },
    { label: "4 BHK", value: "4_bhk" },
    { label: "5 BHK", value: "5_bhk" },
    { label: "5+ BHK", value: "5_plus_bhk" },
  ];

  const bhkLabels: Record<string, string> = {
    all: "BHK",
    "1_rk": "1 RK",
    "1_bhk": "1 BHK",
    "2_bhk": "2 BHK",
    "3_bhk": "3 BHK",
    "4_bhk": "4 BHK",
    "5_bhk": "5 BHK",
    "5_plus_bhk": "5+ BHK",
  };

  const genderOptions: GenderFilter[] = ["Any", "Male", "Female"];
  const tenantOptions: string[] = ["Any", "Bachelor's", "Family", "Anyone"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setCategoryOpen(false);
      }
      if (
        sortRef.current &&
        !sortRef.current.contains(target) &&
        (!sortMobileRef.current || !sortMobileRef.current.contains(target))
      ) {
        setSortOpen(false);
      }
      if (budgetRef.current && !budgetRef.current.contains(target)) {
        setBudgetOpen(false);
      }
      if (furnishingRef.current && !furnishingRef.current.contains(target)) {
        setFurnishingOpen(false);
      }
      if (propertyTypeRef.current && !propertyTypeRef.current.contains(target)) {
        setPropertyTypeOpen(false);
      }
      if (bhkRef.current && !bhkRef.current.contains(target)) {
        setBhkOpen(false);
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

  // Close property type and BHK dropdowns when category changes
  useEffect(() => {
    setPropertyTypeOpen(false);
    setBhkOpen(false);
  }, [selectedCategory]);

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
        {/* Row 1: Category Tabs (Left) & Sorting (Right) - Desktop/Tablet */}
        <div className="hidden md:flex w-full max-w-8xl 3xl:max-w-[1450px] mx-auto items-center justify-between gap-3 lg:gap-4">
          {/* Left: Category Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 lg:gap-10 overflow-x-auto no-scrollbar scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0 min-w-0 flex-1">
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
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    {cat.displayLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Sorting Dropdown (Desktop / Tablet) */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => {
                setSortOpen(!sortOpen);
                setCategoryOpen(false);
                setBudgetOpen(false);
                setFurnishingOpen(false);
                setPropertyTypeOpen(false);
                setBhkOpen(false);
                setGenderOpen(false);
              }}
              className="bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-2 cursor-pointer transition-colors shadow-sm whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-white shrink-0" />
              <span>
                {selectedSort === "relevance"
                  ? "Sort"
                  : sortLabels[selectedSort]}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-white transition-transform ${sortOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Desktop (lg and up) Dropdown */}
            {sortOpen && (
              <div className="hidden lg:block absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
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
                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${selectedSort === opt.value
                      ? "bg-blue-50 text-[#0066FF] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tablet Modal Dialog (hidden on mobile & desktop, visible on md to lg) */}
            {sortOpen && (
              <div
                className="fixed inset-0 z-[70] hidden md:flex lg:hidden items-end justify-center bg-black/50 backdrop-blur-xs p-0"
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
                        className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedSort === opt.value
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
        </div>

        {/* Row 2: Filter Controls, Reset & Mobile Sort */}
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto md:mt-2.5 md:pt-2.5 md:border-t md:border-gray-100 flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0 lg:overflow-visible lg:flex-wrap">
          {/* Mobile Category Filter Pill (First Position on Mobile) */}
          <div className="relative shrink-0 md:hidden" ref={categoryRef}>
            <button
              type="button"
              onClick={() => {
                setCategoryOpen(!categoryOpen);
                setSortOpen(false);
                setBudgetOpen(false);
                setFurnishingOpen(false);
                setPropertyTypeOpen(false);
                setBhkOpen(false);
                setGenderOpen(false);
              }}
              className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedCategory !== "All"
                ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
            >
              {selectedCategory === "Flat" ? (
                <Bed className="w-3.5 h-3.5 shrink-0 text-[#0066FF]" />
              ) : selectedCategory === "Flatmate" ? (
                <Users className="w-3.5 h-3.5 shrink-0 text-[#0066FF]" />
              ) : selectedCategory === "Property" ? (
                <Building className="w-3.5 h-3.5 shrink-0 text-[#0066FF]" />
              ) : (
                <Home className="w-3.5 h-3.5 shrink-0 text-gray-500" />
              )}
              <span>
                {selectedCategory === "All"
                  ? "Category"
                  : categories.find((c) => c.label === selectedCategory)
                    ?.displayLabel || selectedCategory}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${categoryOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Mobile Category Modal Dialog */}
            {categoryOpen && (
              <div
                className="fixed inset-0 z-[70] flex items-end justify-center md:hidden bg-black/50 backdrop-blur-xs p-0"
                onClick={() => setCategoryOpen(false)}
              >
                <div
                  className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-[#0066FF]" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Select Category
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50 py-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.label);
                          setCategoryOpen(false);
                        }}
                        className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedCategory === cat.label
                          ? "bg-blue-50 text-[#0066FF] font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              selectedCategory === cat.label
                                ? "text-[#0066FF]"
                                : "text-gray-500"
                            }
                          >
                            {cat.icon}
                          </span>
                          <span>{cat.displayLabel}</span>
                        </div>
                        {selectedCategory === cat.label && (
                          <Check className="w-4 h-4 text-[#0066FF]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Budget Range Filter Popover */}
          <div className="relative shrink-0" ref={budgetRef}>
            <button
              type="button"
              onClick={() => {
                setBudgetOpen(!budgetOpen);
                setCategoryOpen(false);
                setSortOpen(false);
                setFurnishingOpen(false);
                setGenderOpen(false);
              }}
              className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${isBudgetActive
                ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
            >
              <IndianRupee className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{budgetButtonText}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${budgetOpen ? "rotate-180" : ""
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
                setCategoryOpen(false);
                setSortOpen(false);
                setBudgetOpen(false);
                setGenderOpen(false);
              }}
              className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedFurnishing !== "all"
                ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
            >
              <Armchair className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{furnishingLabels[selectedFurnishing]}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${furnishingOpen ? "rotate-180" : ""
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
                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${selectedFurnishing === opt.value
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
                        className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedFurnishing === opt.value
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

          {/* Property Type Dropdown */}
          {onSelectPropertyType && selectedCategory === "Property" && (
            <div className="relative shrink-0" ref={propertyTypeRef}>
              <button
                type="button"
                onClick={() => {
                  setPropertyTypeOpen(!propertyTypeOpen);
                  setCategoryOpen(false);
                  setSortOpen(false);
                  setBudgetOpen(false);
                  setFurnishingOpen(false);
                  setBhkOpen(false);
                  setGenderOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedPropertyType !== "all"
                  ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>{propertyTypeLabels[selectedPropertyType] || "Property Type"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${propertyTypeOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Desktop (lg and up) Dropdown */}
              {propertyTypeOpen && (
                <div className="hidden lg:block absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Property Type
                  </div>
                  {propertyTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelectPropertyType(opt.value);
                        setPropertyTypeOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${selectedPropertyType === opt.value
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
              {propertyTypeOpen && (
                <div
                  className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden bg-black/50 backdrop-blur-xs p-0"
                  onClick={() => setPropertyTypeOpen(false)}
                >
                  <div
                    className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Property Type
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPropertyTypeOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="divide-y divide-gray-50 py-1">
                      {propertyTypeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            onSelectPropertyType(opt.value);
                            setPropertyTypeOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedPropertyType === opt.value
                            ? "bg-blue-50 text-[#0066FF] font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <span>{opt.label}</span>
                          {selectedPropertyType === opt.value && (
                            <Check className="w-4 h-4 text-[#0066FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BHK Dropdown */}
          {onSelectBhk && selectedCategory === "Property" && (
            <div className="relative shrink-0" ref={bhkRef}>
              <button
                type="button"
                onClick={() => {
                  setBhkOpen(!bhkOpen);
                  setCategoryOpen(false);
                  setSortOpen(false);
                  setBudgetOpen(false);
                  setFurnishingOpen(false);
                  setPropertyTypeOpen(false);
                  setGenderOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedBhk !== "all"
                  ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <Bed className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>{bhkLabels[selectedBhk] || "BHK"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${bhkOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Desktop (lg and up) Dropdown */}
              {bhkOpen && (
                <div className="hidden lg:block absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    BHK / Bedrooms
                  </div>
                  {bhkOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelectBhk(opt.value);
                        setBhkOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${selectedBhk === opt.value
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
              {bhkOpen && (
                <div
                  className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden bg-black/50 backdrop-blur-xs p-0"
                  onClick={() => setBhkOpen(false)}
                >
                  <div
                    className="w-full sm:max-w-md bg-white rounded-t-3xl rounded-b-none p-5 pb-28 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <div className="flex items-center gap-2">
                        <Bed className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-base font-semibold text-gray-900">
                          BHK / Bedrooms
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBhkOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="divide-y divide-gray-50 py-1">
                      {bhkOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            onSelectBhk(opt.value);
                            setBhkOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedBhk === opt.value
                            ? "bg-blue-50 text-[#0066FF] font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <span>{opt.label}</span>
                          {selectedBhk === opt.value && (
                            <Check className="w-4 h-4 text-[#0066FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Gender / Tenant Preference Dropdown Pill */}
          <div className="relative shrink-0" ref={genderRef}>
            {selectedCategory === "Property" ? (
              <button
                type="button"
                onClick={() => {
                  setGenderOpen(!genderOpen);
                  setCategoryOpen(false);
                  setSortOpen(false);
                  setBudgetOpen(false);
                  setFurnishingOpen(false);
                  setPropertyTypeOpen(false);
                  setBhkOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedTenantPreference && selectedTenantPreference !== "Any"
                  ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <Users
                  className={`w-3.5 h-3.5 shrink-0 ${selectedTenantPreference && selectedTenantPreference !== "Any"
                    ? "text-[#0066FF]"
                    : "text-gray-500"
                    }`}
                />
                <span>Preferred Tenant: {selectedTenantPreference || "Any"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${genderOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setGenderOpen(!genderOpen);
                  setCategoryOpen(false);
                  setSortOpen(false);
                  setBudgetOpen(false);
                  setFurnishingOpen(false);
                  setPropertyTypeOpen(false);
                  setBhkOpen(false);
                }}
                className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedGender !== "Any"
                  ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <Users
                  className={`w-3.5 h-3.5 shrink-0 ${selectedGender !== "Any" ? "text-[#0066FF]" : "text-gray-500"
                    }`}
                />
                <span>Gender: {selectedGender}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${genderOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
            )}

            {/* Desktop (lg and up) Dropdown */}
            {genderOpen && (
              <div className="hidden lg:block absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {selectedCategory === "Property" ? "Preferred Tenant" : "Gender Preference"}
                </div>
                {selectedCategory === "Property"
                  ? tenantOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onSelectTenantPreference?.(opt);
                        setGenderOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${(selectedTenantPreference || "Any") === opt
                        ? "bg-blue-50 text-[#0066FF] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {opt === "Any" ? "Any Tenant" : opt}
                    </button>
                  ))
                  : genderOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onSelectGender(opt);
                        setGenderOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${selectedGender === opt
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
                        {selectedCategory === "Property" ? "Preferred Tenant" : "Gender Preference"}
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
                    {selectedCategory === "Property"
                      ? tenantOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            onSelectTenantPreference?.(opt);
                            setGenderOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${(selectedTenantPreference || "Any") === opt
                            ? "bg-blue-50 text-[#0066FF] font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <span>{opt === "Any" ? "Any Tenant" : opt}</span>
                          {(selectedTenantPreference || "Any") === opt && (
                            <Check className="w-4 h-4 text-[#0066FF]" />
                          )}
                        </button>
                      ))
                      : genderOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            onSelectGender(opt);
                            setGenderOpen(false);
                          }}
                          className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedGender === opt
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

          {/* Mobile Sorting Filter Pill */}
          <div className="relative shrink-0 md:hidden" ref={sortMobileRef}>
            <button
              type="button"
              onClick={() => {
                setSortOpen(!sortOpen);
                setCategoryOpen(false);
                setBudgetOpen(false);
                setFurnishingOpen(false);
                setPropertyTypeOpen(false);
                setBhkOpen(false);
                setGenderOpen(false);
              }}
              className={`text-xs sm:text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border shadow-xs whitespace-nowrap ${selectedSort !== "relevance"
                ? "bg-blue-50 text-[#0066FF] border-blue-200 font-semibold"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
            >
              <ArrowUpDown
                className={`w-3.5 h-3.5 shrink-0 ${selectedSort !== "relevance"
                  ? "text-[#0066FF]"
                  : "text-gray-500"
                  }`}
              />
              <span>
                {selectedSort === "relevance"
                  ? "Sort"
                  : sortLabels[selectedSort]}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Mobile Modal Dialog */}
            {sortOpen && (
              <div
                className="fixed inset-0 z-[70] flex items-end justify-center md:hidden bg-black/50 backdrop-blur-xs p-0"
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
                        className={`w-full flex items-center justify-between py-3.5 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${selectedSort === opt.value
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

          {/* Reset Filters button */}
          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs sm:text-sm text-red-500 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap hover:bg-red-50"
              title="Reset all filters and sorting to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
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
