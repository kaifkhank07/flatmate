import React, { Suspense } from "react";
import ListingBreadcrum from "@/components/listing/public/ListingBreadcrum";
import ListingManager from "@/components/listing/public/ListingManager";
import Faq from "@/components/ui/Faq";
import JoinCommunityBanner from "@/components/ui/JoinCommunityBanner";

export default function ListingPage() {
  return (
    <main className="w-full min-h-screen pt-16 sm:pt-20">
      <ListingBreadcrum />
      <Suspense fallback={null}>
        <ListingManager />
      </Suspense>
      <Faq />
      <JoinCommunityBanner />
    </main>
  );
}
