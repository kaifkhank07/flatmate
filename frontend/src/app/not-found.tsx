import React from "react";
import Link from "next/link";
import { Home, Search, ArrowLeft, Compass, HelpCircle, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* 404 Hero Card */}
        <div className="relative bg-white/80 backdrop-blur-md rounded-3xl sm:rounded-4xl p-8 sm:p-12 shadow-xl border border-gray-100 overflow-hidden">
          {/* Subtle Ambient Background Orbs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

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

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-[#0052c7] text-white px-7 py-3.5 rounded-full text-sm sm:text-base font-medium shadow-md shadow-brand-blue/25 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>

            <Link
              href="/listing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-brand-blue border border-gray-200 px-7 py-3.5 rounded-full text-sm sm:text-base font-medium transition-all active:scale-95 cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              Explore Listings
            </Link>
          </div>
        </div>

        {/* Quick Links Suggestions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Or try visiting these popular sections
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/listing"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-brand-ice hover:text-brand-blue text-gray-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4 text-brand-blue" />
              Listings
            </Link>

            <Link
              href="/about"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-brand-ice hover:text-brand-blue text-gray-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <Compass className="w-4 h-4 text-brand-blue" />
              About Us
            </Link>

            <Link
              href="/blog"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-brand-ice hover:text-brand-blue text-gray-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-brand-blue" />
              Blogs
            </Link>

            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-brand-ice hover:text-brand-blue text-gray-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-brand-blue" />
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
