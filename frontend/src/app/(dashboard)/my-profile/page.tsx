import React from "react";
import ProfileManager from "@/components/dashboard/ProfileManager";
import { Metadata } from "next";
import Faq from "@/components/ui/Faq";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your Flatmate user profile and subscription plans.",
};

export default function MyProfilePage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <ProfileManager />
      <Faq />
    </main>
  );
}
