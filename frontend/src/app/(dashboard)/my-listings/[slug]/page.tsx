import React from "react";
import { Metadata } from "next";
import DetailsMyListing from "@/components/dashboard/DetailsMyListing";
// import DetailsMyListingManager from "@/components/dashboard/DetailsMyListingManager";

export const metadata: Metadata = {
  title: "Details My Listing | FlatMate",
  description:
    "Details My Listing",
};

export default function DetailsMyListingPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <DetailsMyListing />
    </main>
  );
}