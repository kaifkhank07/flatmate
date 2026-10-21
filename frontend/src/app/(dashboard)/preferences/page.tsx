import React from "react";
import PreferencesManager from "@/components/dashboard/mypreferences/PreferencesManager";
import { Metadata } from "next";
import Faq from "@/components/ui/Faq";
// import MyPreferencesTabs from "@/components/dashboard/MyPreferencesTabs";

export const metadata: Metadata = {
  title: "My Preferences",
  description: "Set your flatmate dietary, lifestyle, and living preferences.",
};

export default function MyPreferencesPage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <PreferencesManager />
      {/* <MyPreferencesTabs /> */}
      <Faq />
    </main>
  );
}
