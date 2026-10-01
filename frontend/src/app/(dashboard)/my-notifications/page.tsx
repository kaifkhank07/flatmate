import React from "react";
import { Metadata } from "next";
import Notifications from "@/components/dashboard/Notifications";
import Faq from "@/components/ui/Faq";

export const metadata: Metadata = {
  title: "My Notifications",
  description: "View and manage your account notifications and match alerts.",
};

export default function MyNotificationsPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <Notifications />
      <Faq />
    </main>
  );
}
