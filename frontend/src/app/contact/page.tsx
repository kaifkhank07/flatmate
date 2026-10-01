import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageSquare, ArrowLeft } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl sm:rounded-4xl p-8 sm:p-12 shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-brand-ice rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-brand-blue" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Have questions or feedback? We&apos;d love to hear from you. Contact page data will be here.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <Mail className="w-6 h-6 text-brand-blue mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Email Us</p>
              <p className="text-sm font-semibold text-gray-800">info@gmail.com</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <Phone className="w-6 h-6 text-brand-blue mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Call Us</p>
              <p className="text-sm font-semibold text-gray-800">+91 1234567890</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <MapPin className="w-6 h-6 text-brand-blue mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Location</p>
              <p className="text-sm font-semibold text-gray-800">Mumbai, India</p>
            </div>
          </div>

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
