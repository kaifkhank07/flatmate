import React from "react";
import { Metadata } from "next";
import DetailsListingManager from "@/components/listing/personal/DetailsListingManager";

export const metadata: Metadata = {
  title: "Details My Listing | FlatMate",
  description:
    "Details My Listing",
};

export default function DetailsMyListingPage() {
  return (
    <main className="w-full min-h-screen pt-20 sm:pt-20">
      <DetailsListingManager />
    </main>
  );
}