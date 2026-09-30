'use client';

import React from "react";
import { useStatsData } from "@/data/stats";
import SectionHeading from "../utils/SectionHeading";
import NumberRoller from "@/components/animation/NumberRoller";

export default function Stats() {
    const stats = useStatsData();

    return (
        <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 bg-accent overflow-hidden">
            <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12">
                {/* Left Content */}
                <div className="flex flex-col justify-start">
                    <SectionHeading
                        title="Measured by trust, safety, and community."
                        className="text-white max-w-lg"
                    />
                </div>

                {/* Right Stats */}
                <div className="space-y-12 lg:space-y-24">
                    {stats.map((item, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-[minmax(180px,auto)_1fr] gap-12 lg:gap-x-16 items-start"
                        >
                            {/* Number */}
                            <div className="flex-shrink-0">
                                <NumberRoller
                                    value={item.value}
                                    suffix={item.suffix}
                                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium text-white -tracking-[0.03em]"
                                />
                            </div>

                            {/* Description */}
                            <div className="max-w-sm lg:ml-auto">
                                <p className="text-white text-xs sm:text-sm md:text-base text-text-light mt-2 md:mt-4 font-regular opacity-90">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}