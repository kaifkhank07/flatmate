import React from "react";
import { Metadata } from "next";
import AddListingManager from "@/components/listing/create/AddListingManager";

export const metadata: Metadata = {
  title: "Post Your Requirement | FlatMate",
  description:
    "Post your room, flat, or flatmate requirement effortlessly and connect with verified flatmates and tenants.",
};

export default function CreateListingPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <AddListingManager />
    </main>
  );
}
