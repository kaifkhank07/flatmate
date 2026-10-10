import React from "react";
import { Metadata } from "next";
import MyListingManager from "@/components/listing/personal/MyListingManager";
import Faq from "@/components/ui/Faq";

export const metadata: Metadata = {
    title: "My Listings",
    description: "View and manage your listings.",
};

export default function MyListingPage() {
    return (
        <main className="w-full min-h-screen pt-20">
            <MyListingManager />
            <Faq />
        </main>
    );
}