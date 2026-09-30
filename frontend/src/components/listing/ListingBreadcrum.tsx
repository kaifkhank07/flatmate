import React from "react";
import Link from "next/link";

export default function ListingBreadcrum() {
    return (
        <section className="w-full pt-8 md:pt-12 overflow-hidden">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-16 bg-background">
                <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto flex justify-start items-center gap-2 py-4 sm:py-6">
                    <Link href="/" className="text-sm sm:text-base text-gray-500 font-medium hover:text-brand-blue transition-colors">
                        Home
                    </Link>
                    <span className="text-sm sm:text-base text-gray-500 font-medium">/</span>
                    <span className="text-sm sm:text-base text-gray-900 font-medium">Listing</span>
                </div>
            </div>
        </section>
    )
}