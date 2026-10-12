import React from "react";
import { MapPin } from "lucide-react";
import ArrowLink from "@/components/utils/ArrowLink";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* 404 Hero Card */}
      <div className="relative max-w-3xl w-full bg-white/80 rounded-3xl sm:rounded-4xl p-8 sm:p-12 border-2 border-gray-100 overflow-hidden text-center space-y-8">
        {/* Large Animated 404 Badge */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <span className="text-7xl sm:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-blue-600 to-indigo-600 tracking-wider">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <MapPin className="w-32 h-32 text-brand-blue" />
          </div>
        </div>

        {/* Heading & Subtext */}
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
          Oops! Page Not Found
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          The room or page you are looking for might have been moved, deleted, or never existed in the first place. Let&apos;s get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <ArrowLink className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-[#0052c7] text-white px-7 py-3.5 rounded-full text-sm sm:text-base font-medium shadow-md shadow-brand-blue/25 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            text="Go to Homepage" href="/"
          />

          <ArrowLink
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-brand-blue border border-gray-200 px-7 py-3.5 rounded-full text-sm sm:text-base font-medium transition-all active:scale-95 cursor-pointer"
            text="Explore Listings" href="/listing"
          />
        </div>
      </div>
    </main>
  );
}
