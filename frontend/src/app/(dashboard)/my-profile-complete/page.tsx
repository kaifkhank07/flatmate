import React from "react";
import ProfileCompleteManager from "@/components/dashboard/ProfileCompleteManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Complete your profile to start using Flatmate.",
};

export default function MyProfileCompletePage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <ProfileCompleteManager />
    </main>
  );
}
