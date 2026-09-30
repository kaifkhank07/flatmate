import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View and manage your saved flatmate listings.",
};

export default function WishlistPage() {
  return (
    <main className="w-full min-h-[60vh] flex flex-col items-center justify-center pt-24 px-4">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900">Your Wishlist</h1>
        <p className="text-sm text-gray-500">
          Listings and flatmate profiles you have saved will appear here.
        </p>
      </div>
    </main>
  );
}
