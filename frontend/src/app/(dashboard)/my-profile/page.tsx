import React from "react";
import { Metadata } from "next";
import MyProfile from "@/components/dashboard/profile/MyProfile";
import Faq from "@/components/ui/Faq";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your Flatmate user profile and subscription plans.",
};

export default function MyProfilePage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <MyProfile />
      <Faq />
    </main>
  );
}
