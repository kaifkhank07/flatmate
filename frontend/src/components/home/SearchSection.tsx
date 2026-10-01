"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

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

  const containerRef = useRef<HTMLDivElement>(null);

  const locations = ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Hyderabad"];
  const lookingForOptions = ["A Flat", "A Flatmate", "Single Room", "Shared Room"];
  const propertyTypes = ["1 BHK", "2 BHK", "3 BHK", "Studio", "Villa"];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

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
    <div
      ref={containerRef}
      className={`relative z-30 w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 ${className}`}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between p-2 md:p-0 md:pl-2 lg:pl-4">

        {/* Field 1: Choose Location */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => toggleDropdown("location")}
            className="w-full text-left px-4 lg:px-6 py-3 lg:py-5 border-b md:border-b-0 md:border-r border-gray-200 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl md:rounded-none transition-colors"
          >
            <div>
              <span className="block text-gray-800 text-xs sm:text-sm lg:text-xl font-medium tracking-tight">
                Choose Location
              </span>
              <span className="block text-xs lg:text-sm text-gray-500 font-regular mt-0.5">
                {location ? location : "(E.G., Mumbai)"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${openDropdown === "location" ? "rotate-180 text-brand-dark" : ""
                }`}
            />
          </button>

          {openDropdown === "location" && (
            <div className="absolute left-0 top-full mt-2 md:top-auto md:bottom-full md:mt-0 md:mb-2 w-full md:w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 md:slide-in-from-bottom-2 duration-150">
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelect("location", loc)}
                  className={`w-full text-left px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${location === loc
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                    }`}
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
            className="w-full text-left px-4 lg:px-6 py-3 lg:py-5 border-b md:border-b-0 md:border-r border-gray-200 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl md:rounded-none transition-colors"
          >
            <div>
              <span className="block text-gray-800 text-xs sm:text-sm lg:text-xl font-medium tracking-tight">
                Looking For
              </span>
              <span className="block text-xs lg:text-sm text-gray-600 font-regular mt-0.5">
                {lookingFor}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${openDropdown === "lookingFor" ? "rotate-180 text-brand-dark" : ""
                }`}
            />
          </button>

          {openDropdown === "lookingFor" && (
            <div className="absolute left-0 top-full mt-2 md:top-auto md:bottom-full md:mt-0 md:mb-2 w-full md:w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 md:slide-in-from-bottom-2 duration-150">
              {lookingForOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect("lookingFor", option)}
                  className={`w-full text-left px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${lookingFor === option
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                    }`}
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
            className="w-full text-left px-4 lg:px-6 py-3 lg:py-5 flex items-center justify-between group cursor-pointer hover:bg-gray-50/80 rounded-2xl md:rounded-none transition-colors"
          >
            <div>
              <span className="block text-gray-800 text-xs sm:text-sm lg:text-xl font-medium tracking-tight">
                Property Type
              </span>
              <span className="block text-xs lg:text-sm text-gray-600 font-regular mt-0.5">
                {propertyType}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-brand-dark transition-transform duration-200 ${openDropdown === "propertyType" ? "rotate-180 text-brand-dark" : ""
                }`}
            />
          </button>

          {openDropdown === "propertyType" && (
            <div className="absolute left-0 top-full mt-2 md:top-auto md:bottom-full md:mt-0 md:mb-2 w-full md:w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 md:slide-in-from-bottom-2 duration-150">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelect("propertyType", type)}
                  className={`w-full text-left px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${propertyType === type
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 4: Search Button */}
        <div className="w-full md:w-auto self-stretch flex items-stretch mt-2 md:mt-0">
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="w-full md:w-auto min-w-[160px] lg:min-w-[220px] bg-brand-blue hover:bg-[#0052c7] text-white text-xs sm:text-sm lg:text-xl font-medium tracking-tight py-3.5 sm:py-4 md:py-0 px-8 lg:px-12 rounded-2xl md:rounded-3xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
