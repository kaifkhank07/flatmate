import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/utils/SectionHeading";

export const metadata: Metadata = {
  title: "Privacy Policy | Flat & Flatmate",
  description: "Read the Privacy Policy for the Flat & Flatmate platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <section className="w-full py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="border-b border-gray-200 pb-8 sm:pb-12">
            <SectionHeading
              title="Privacy Policy"
              description="Last updated: October 2026"
              className="text-black max-w-2xl"
            />
            <p className="mt-4 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl">
              At Flat &amp; Flatmate, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information when you use our services.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 sm:space-y-10 text-gray-800 text-sm sm:text-base leading-relaxed max-w-4xl">
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us when creating an account, completing your user profile, or listing a property:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
                <li>Personal details including your name, mobile number, email address, gender, and occupation.</li>
                <li>Lifestyle and roommate preferences to assist in finding compatible flatmates.</li>
                <li>Property and listing information including photos, location, and rent details.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
                <li>Verify your identity via mobile OTP and maintain your secure session.</li>
                <li>Match you with compatible flatmates based on your shared preferences.</li>
                <li>Enable communication between prospective roommates and property hosts.</li>
                <li>Maintain, secure, and improve platform performance and user experience.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                3. Cookies and Session Storage
              </h2>
              <p>
                We use secure, HTTP-only cookies strictly for session authentication and token management. These cookies ensure your login session remains secure across your visits and are never shared with advertising networks or third-party trackers.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                4. Data Security
              </h2>
              <p>
                We implement industry-standard encryption, secure HTTP protocols, and restricted database access to safeguard your data against unauthorized access, alteration, or disclosure.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                5. Contact Us
              </h2>
              <p>
                If you have questions or concerns regarding our privacy practices, please contact us at{" "}
                <Link href="mailto:info@flatandflatmate.in" className="text-[#0066F9] hover:underline font-medium">
                  info@flatandflatmate.in
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

