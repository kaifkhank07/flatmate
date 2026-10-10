import React from "react";
import { Metadata } from "next";
import WishlistManager from "@/components/dashboard/wishlist/WishlistManager";
import Faq from "@/components/ui/Faq";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View and manage your saved flatmate listings and properties.",
};

export default function WishlistPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <WishlistManager />
      <Faq />
    </main>
  );
}

