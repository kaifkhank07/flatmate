import React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl sm:rounded-4xl p-8 sm:p-12 shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-brand-ice rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-brand-blue" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Flatmate Blogs & Articles
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Discover tips for finding flatmates, renting guides, and living space advice. Blog posts data will be here.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-[#0052c7] text-white px-7 py-3 rounded-full font-medium transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
