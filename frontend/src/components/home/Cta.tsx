"use client";

import React from "react";
import { useAssets } from "@/data/assets";
import SectionHeading from "../utils/SectionHeading";
import ArrowLink from "../utils/ArrowLink";
import { AnimatedImage } from "../animation";

export default function Cta() {
    const assets = useAssets();

    return (
        <section className="w-full py-8 md:py-12 px-4 sm:px-6 lg:px-16 bg-accent overflow-hidden">
            <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto grid grid-cols-1 lg:grid-cols-2  gap-6 sm:gap-8 lg:gap-0">
                {/* Left Column: Lifestyle Community Image */}
                <div className="relative w-full lg:pr-12">
                    <div className="relative w-full rounded-2xl sm:rounded-3xl lg:rounded-4xl overflow-hidden shadow-lg aspect-[4/3] sm:aspect-[1.15/1]">
                        {/* <Image
                            src={assets.cta}
                            alt="CTA Illustration"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        /> */}
                        <AnimatedImage
                            src={assets.cta}
                            alt="CTA Illustration"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                    </div>
                </div>

                {/* Right Column: Heading, Description & CTA */}
                <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                    <SectionHeading
                        title="Ready to Find Your Next Home or Flatmate?"
                        description="Join thousands of happy users who found their perfect match without hassles."
                        className="text-white"
                    />

                    <div className="flex flex-col sm:flex-row justify-start gap-3 sm:gap-4">
                        <ArrowLink
                            text="Find a Home"
                            href="/listing"
                            lineClassName="bg-black"
                            className="w-fit bg-white text-black font-medium text-base sm:text-lg py-2.5 px-8 rounded-full shadow-sm hover:bg-gray-100"
                        />

                        <ArrowLink
                            text="Find a Flatmate"
                            href="/community"
                            lineClassName="bg-white"
                            className="w-fit bg-transparent text-white font-medium text-base sm:text-lg py-2.5 px-8 rounded-full border-2 border-white hover:bg-white/10"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}