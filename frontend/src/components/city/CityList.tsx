"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SectionHeading from "../utils/SectionHeading";
import { ViewReveal } from "../animation";
import { useCityStore } from "@/store/useCityStore";
import { CityItem } from "@/types/city";

function CityCard({ item }: { item: CityItem }) {

  return (
    <Link
      href={`/listing?city=${encodeURIComponent(item.name)}`}
      className="group hover:-translate-y-1 transition-all duration-300 overflow-hidden shrink-0 w-full"
    >
      <div className="w-full h-40 xs:h-44 sm:h-56 md:h-64 lg:h-72 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md">
        <Image
          src={item.image?.url || "/assets/Images/cities/mumbai.png"}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      <h3 className="mt-3 text-center font-roboto-serif text-black text-sm sm:text-base md:text-lg font-regular tracking-tight">
        {item.name}
      </h3>
    </Link>
  );
}

export default function CityList() {
  const { cities, loadingCities, errorCities, fetchCities } = useCityStore();

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return (
    <section className="w-full py-12 sm:py-14 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
        {/* Header Bar */}
        <ViewReveal duration={800}>
          <SectionHeading
            title="Find Flat & Flatmates Across India"
            description="Present in major cities and growing fast."
            className="text-black max-w-3xl"
          />
        </ViewReveal>

        {/* City Grid / Loading / Error / Empty */}
        {loadingCities ? (
          <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-40 xs:h-44 sm:h-56 md:h-64 lg:h-72 bg-[#F2FAFD] rounded-2xl sm:rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : errorCities ? (
          <div className="text-center py-12 px-4 bg-[#F2FAFD] rounded-2xl sm:rounded-3xl border border-gray-100/80">
            <p className="text-gray-600 font-medium text-base mb-4">
              Unable to load cities right now.
            </p>
            <button
              type="button"
              onClick={() => fetchCities()}
              className="px-6 py-2.5 bg-brand-blue text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : cities.length > 0 ? (
          <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 cursor-pointer">
            {cities.map((item, index) => (
              <CityCard key={`${item._id || item.slug}-${index}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-[#F2FAFD] rounded-2xl sm:rounded-3xl border border-gray-100/80">
            <p className="text-gray-500 font-medium text-base">
              No cities available at the moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
