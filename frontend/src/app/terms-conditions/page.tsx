import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/utils/SectionHeading";

export const metadata: Metadata = {
  title: "Terms & Conditions | Flat & Flatmate",
  description: "Read the terms and conditions for using the Flat & Flatmate platform.",
};

export default function TermsConditionsPage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <section className="w-full py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="border-b border-gray-200 pb-8 sm:pb-12">
            <SectionHeading
              title="Terms & Conditions"
              description="Last updated: October 2026"
              className="text-black max-w-2xl"
            />
            <p className="mt-4 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl">
              Welcome to Flat &amp; Flatmate. Please read these terms and conditions carefully before using our platform, website, and services.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 sm:space-y-10 text-gray-800 text-sm sm:text-base leading-relaxed max-w-4xl">
            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or using the Flat &amp; Flatmate website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, along with our Privacy Policy. If you do not agree with any part of these terms, you must not access or use the platform.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                2. User Eligibility and Registration
              </h2>
              <p>
                To register and create an account, you must be at least 18 years old. You agree to provide accurate, current, and complete information during registration and keep your account details updated. You are responsible for safeguarding your credentials and for all activities occurring under your account.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                3. Platform Services &amp; Listings
              </h2>
              <p>
                Flat &amp; Flatmate provides a peer-to-peer discovery platform designed to connect verified students and working professionals seeking shared accommodation, rooms, or compatible flatmates.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
                <li>Users who list rooms or properties certify that they have legitimate rights or permissions to do so.</li>
                <li>All listing descriptions, pricing, amenities, and media must be accurate, truthful, and not misleading.</li>
                <li>Flat &amp; Flatmate does not own, lease, manage, or inspect listed properties unless explicitly stated.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                4. Code of Conduct &amp; Prohibited Activities
              </h2>
              <p>
                We foster a respectful, inclusive, and safe community. When using Flat &amp; Flatmate, you agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
                <li>Post false, defamatory, fraudulent, or harassing content.</li>
                <li>Discriminate against any individual on the basis of race, religion, gender, sexual orientation, disability, or national origin.</li>
                <li>Attempt to harvest user data, send unsolicited spam, or compromise the platform&apos;s security or infrastructure.</li>
                <li>Request advance payments or conduct fraudulent transactions outside safe, verified channels.</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                5. Privacy &amp; Data Protection
              </h2>
              <p>
                Your privacy is paramount to us. Our collection, use, and disclosure of personal data are governed by our Privacy Policy. By using the service, you consent to our handling of data in compliance with relevant data protection laws.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                6. Limitation of Liability
              </h2>
              <p>
                Flat &amp; Flatmate acts solely as a discovery venue. We are not a party to rental agreements, lease contracts, or financial arrangements made directly between flatmates or landlords. To the maximum extent permitted by applicable law, Flat &amp; Flatmate shall not be liable for any direct, indirect, incidental, or consequential damages arising from interactions, agreements, or disputes between users.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                7. Changes to Terms
              </h2>
              <p>
                We reserve the right to update or modify these Terms &amp; Conditions at any time. Changes will be effective upon posting the updated terms on this page. Your continued use of the platform after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </div>

            {/* Section 8 */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                8. Contact Information
              </h2>
              <p>
                If you have questions or concerns regarding these Terms &amp; Conditions, please reach out to our team at{" "}
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

