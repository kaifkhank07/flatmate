import React from "react"
import { Metadata } from "next";
import MoreServices from "@/components/more/MoreServices";

export const metadata: Metadata = {
    title: "More",
    description: "View more about Flat & Flatmate.",
};

export default function MorePage() {
    return (
        <main className="w-full min-h-screen pt-8 sm:pt-20">
            <MoreServices />
        </main>
    );
}