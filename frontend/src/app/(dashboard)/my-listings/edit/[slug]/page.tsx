import React from "react";
import { Metadata } from "next";
import EditListingManager from "@/components/listing/personal/EditListingManager";

export const metadata: Metadata = {
  title: "Edit Listing | FlatMate",
  description: "Edit your listing details",
};

export default function EditListingPage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <EditListingManager />
    </main>
  );
}
