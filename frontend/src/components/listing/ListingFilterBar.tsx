"use client";

import React, { useState, useRef, useEffect } from "react";
import { ListingCategory, GenderFilter } from "@/data/listings";
import { Home, Bed, Users, Building, ChevronDown, MapPin } from "lucide-react";

interface ListingFilterBarProps {
  selectedCategory: ListingCategory;
  onSelectCategory: (cat: ListingCategory) => void;
  selectedGender: GenderFilter;
  onSelectGender: (gender: GenderFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ListingFilterBar({
  selectedCategory,
  onSelectCategory,
  selectedGender,
  onSelectGender,
  searchQuery,
  onSearchChange,
}: ListingFilterBarProps) {
  const [genderOpen, setGenderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories: { label: ListingCategory; displayLabel: string; icon: React.ReactNode }[] = [
    { label: "All", displayLabel: "All Listing", icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: "Flat", displayLabel: "Flat", icon: <Bed className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: "Flatmate", displayLabel: "Flatmate", icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: "Property", displayLabel: "Property", icon: <Building className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  const genderOptions: GenderFilter[] = ["All", "Male", "Female"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setGenderOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Category Tabs & Gender Filter Bar */}
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
                  className={`flex flex-col items-center justify-center gap-1.5 py-1 transition-all cursor-pointer relative shrink-0 ${
                    isActive
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

          {/* Right Gender Dropdown Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setGenderOpen(!genderOpen)}
              className="bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded-full flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Gender{selectedGender !== "All" ? `: ${selectedGender}` : ""}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${genderOpen ? "rotate-180" : ""}`}
              />
            </button>

            {genderOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
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
                    {opt === "All" ? "All Genders" : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="w-full py-3 px-4 sm:px-6 lg:px-16 bg-background overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto flex items-center gap-3 px-5 sm:px-6 py-3 border border-gray-200 bg-white rounded-full">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Banglore, Karnataka,India"
            className="w-full bg-transparent text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 outline-none font-medium"
          />
        </div>
      </div>
    </div>
  );
}
