import React, { Suspense } from "react";
import ListingBreadcrum from "@/components/listing/ListingBreadcrum";
import ListingDetails from "@/components/listing/ListingDetails";
import Faq from "@/components/ui/Faq";

export default function ListingPage() {
    return (
        <main className="w-full min-h-screen pt-20">
            <Suspense fallback={null}>
                <ListingBreadcrum />
            </Suspense>
            <ListingDetails />
            <Faq />
        </main>
    );
}