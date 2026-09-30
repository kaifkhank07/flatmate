"use client";

import React, { useState } from "react";

interface SearchSectionProps {
  className?: string;
  onSearch?: (searchData: { location: string; lookingFor: string; propertyType: string }) => void;
}

export default function SearchSection({ className = "", onSearch }: SearchSectionProps) {
  // Interactive dropdown states for search bar
  const [location, setLocation] = useState("");
  const [lookingFor, setLookingFor] = useState("A Flat");
  const [propertyType, setPropertyType] = useState("2 BHK");

  const [openDropdown, setOpenDropdown] = useState<"location" | "lookingFor" | "propertyType" | null>(null);

  const locations = ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Hyderabad"];
  const lookingForOptions = ["A Flat", "A Flatmate", "Single Room", "Shared Room"];
  const propertyTypes = ["1 BHK", "2 BHK", "3 BHK", "Studio", "Villa"];

  const toggleDropdown = (field: "location" | "lookingFor" | "propertyType") => {
    setOpenDropdown(openDropdown === field ? null : field);
  };

  const handleSelect = (field: "location" | "lookingFor" | "propertyType", val: string) => {
    if (field === "location") setLocation(val);
    if (field === "lookingFor") setLookingFor(val);
    if (field === "propertyType") setPropertyType(val);
    setOpenDropdown(null);
  };

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch({ location, lookingFor, propertyType });
    } else {
      alert(`Searching for ${lookingFor} (${propertyType}) in ${location || "Mumbai"}`);
    }
  };

  return (
    <div className={`relative z-20 w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 ${className}`}>
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-4 lg:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0">

        {/* Field 1: Choose Location */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => toggleDropdown("location")}
            className="w-full text-left px-4 lg:px-6 py-2.5 sm:py-3 md:border-r border-gray-200 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl transition-colors"
          >
            <div>
              <span className="block text-sm lg:text-base font-bold text-brand-dark tracking-tight">
                Choose Location
              </span>
              <span className="block text-xs lg:text-sm text-gray-400 font-normal mt-0.5">
                {location ? location : "(E.G., Mumbai)"}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${
                openDropdown === "location" ? "rotate-180 text-brand-dark" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDropdown === "location" && (
            <div className="absolute left-0 bottom-full mb-2 w-full md:w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelect("location", loc)}
                  className="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-ice hover:text-brand-blue transition-colors cursor-pointer"
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 2: Looking For */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => toggleDropdown("lookingFor")}
            className="w-full text-left px-4 lg:px-6 py-2.5 sm:py-3 md:border-r border-gray-200 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl transition-colors"
          >
            <div>
              <span className="block text-sm lg:text-base font-bold text-brand-dark tracking-tight">
                Looking For
              </span>
              <span className="block text-xs lg:text-sm text-gray-600 font-medium mt-0.5">
                {lookingFor}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${
                openDropdown === "lookingFor" ? "rotate-180 text-brand-dark" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDropdown === "lookingFor" && (
            <div className="absolute left-0 bottom-full mb-2 w-full md:w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              {lookingForOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect("lookingFor", option)}
                  className="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-ice hover:text-brand-blue transition-colors cursor-pointer"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 3: Property Type */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => toggleDropdown("propertyType")}
            className="w-full text-left px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl transition-colors"
          >
            <div>
              <span className="block text-sm lg:text-base font-bold text-brand-dark tracking-tight">
                Property Type
              </span>
              <span className="block text-xs lg:text-sm text-gray-600 font-medium mt-0.5">
                {propertyType}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${
                openDropdown === "propertyType" ? "rotate-180 text-brand-dark" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDropdown === "propertyType" && (
            <div className="absolute left-0 bottom-full mb-2 w-full md:w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelect("propertyType", type)}
                  className="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-ice hover:text-brand-blue transition-colors cursor-pointer"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 4: Search Button */}
        <div className="w-full md:w-auto pl-0 md:pl-4">
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="w-full md:w-auto min-w-[160px] lg:min-w-[210px] bg-brand-blue hover:bg-[#0052c7] text-white font-semibold text-base py-4 px-8 lg:px-10 rounded-[18px] sm:rounded-[22px] transition-all shadow-md shadow-brand-blue/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            Search
          </button>
        </div>

      </div>
    </div>
  );
}
