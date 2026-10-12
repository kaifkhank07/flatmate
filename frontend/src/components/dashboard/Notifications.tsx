import React from "react";
import SectionHeading from "../utils/SectionHeading";
import { MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import { ViewReveal } from "../animation";

export default function Notifications() {
    return (
        <section className="w-full min-h-[100vh] py-16 md:py-20 overflow-hidden">
            <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
                <ViewReveal duration={800}>
                    <SectionHeading
                        title="Notifications"
                        description="Your match alerts, messages, and listing updates will appear here."
                    // align="center"
                    />
                </ViewReveal>

                <ViewReveal duration={900} startDelay={150}>
                    <div className="flex flex-col justify-center items-center gap-2 p-8 sm:p-12 bg-background rounded-3xl border border-[#E2EFF8]">
                        <MessageCircle size={48} className="text-[#0066F9]" />
                        <p className=" text-black text-base sm:text-lg md:text-xl font-medium">You don't have any notifications</p>
                        <p className="text-sm sm:text-base text-gray-500">
                            We'll let you know when you have new updates or activity.
                        </p>
                    </div>
                </ViewReveal>
            </div>
        </section>
    );
}   