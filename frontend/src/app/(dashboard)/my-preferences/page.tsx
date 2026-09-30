import React from "react";
import PreferencesManager from "@/components/profile/PreferencesManager";
import { Metadata } from "next";
import Faq from "@/components/ui/Faq";

export const metadata: Metadata = {
  title: "My Preferences",
  description: "Set your flatmate dietary, lifestyle, and living preferences.",
};

export default function MyPreferencesPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <PreferencesManager />
      <Faq />
    </main>
  );
}
