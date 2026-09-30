import React from "react";
import ListingBreadcrum from "@/components/listing/ListingBreadcrum";
import ListingManager from "@/components/listing/ListingManager";
import Faq from "@/components/ui/Faq";
import JoinCommunityBanner from "@/components/ui/JoinCommunityBanner";

export default function ListingPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <ListingBreadcrum />
      <ListingManager />
      <Faq />
      <JoinCommunityBanner />
    </main>
  );
}
