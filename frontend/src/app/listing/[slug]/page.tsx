import React, { Suspense } from "react";
import ListingBreadcrum from "@/components/listing/public/ListingBreadcrum";
import ListingDetails from "@/components/listing/public/ListingDetails";
import Faq from "@/components/ui/Faq";

export default function ListingPage() {
    return (
        <main className="w-full min-h-screen pt-16 sm:pt-20">
            <Suspense fallback={null}>
                <ListingBreadcrum />
            </Suspense>
            <ListingDetails />
            <Faq />
        </main>
    );
}