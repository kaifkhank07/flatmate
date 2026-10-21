"use client";

import React from "react";
import Link from "next/link";
import {
    BadgeCheck,
    KeyRound,
    Sofa,
    Building2,
    ReceiptText,
    Crown,
    Heart,
    UsersRound,
    Banknote,
    CircleUserRound,
    Bell,
    CloudDownload,
    Mail,
    LogOut,
    Info,
    Users,
    Search,
    MessageCircle,
    PlusCircle,
} from "lucide-react";
import ViewReveal from "@/components/animation/ViewReveal";
import SectionHeading from "../utils/SectionHeading";

// const services = [
//     { label: "Tenant Verification", icon: BadgeCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
//     { label: "Rental Agreement", icon: KeyRound, color: "text-amber-500", bg: "bg-orange-100" },
//     { label: "Buy Furniture", icon: Sofa, color: "text-amber-700", bg: "bg-orange-100" },
//     { label: "Manage Flat", icon: Building2, color: "text-slate-600", bg: "bg-orange-100" },
//     { label: "Rent Receipt", icon: ReceiptText, color: "text-sky-600", bg: "bg-orange-100", badge: "FREE" },
//     { label: "Premium Properties", icon: Crown, color: "text-pink-500", bg: "bg-orange-100" },
// ];

const services = [
    {
        label: "Find a Flatmate",
        icon: Users,
        color: "text-emerald-600",
        bg: "bg-emerald-100",
    },
    {
        label: "Explore Properties",
        icon: Building2,
        color: "text-blue-600",
        bg: "bg-blue-100",
    },
    {
        label: "Find a Room",
        icon: Search,
        color: "text-violet-600",
        bg: "bg-violet-100",
    },
    {
        label: "Chat with Flatmates",
        icon: MessageCircle,
        color: "text-sky-600",
        bg: "bg-sky-100",
    },
    {
        label: "Saved Listings",
        icon: Heart,
        color: "text-rose-600",
        bg: "bg-rose-100",
    },
    {
        label: "Post a Listing",
        icon: PlusCircle,
        color: "text-amber-600",
        bg: "bg-amber-100",
    },
];

const menuItems = [
    { label: "Preferences", description: "It shows other what kind of flatmate you prefer.", icon: Heart, href: "/preferences" },
    // { label: "Request Refund", description: "You haven't took any plan", icon: Banknote, href: "/request-refund" },
    { label: "Profile", description: "View or edit your profile details.", icon: CircleUserRound, href: "/profile" },
    { label: "Notifications", description: "Manage your notifications.", icon: Bell, href: "/notifications" },
    // { label: "Download App", description: "Get FlatMate App for better user experience.", icon: CloudDownload, href: "/download-app" },
    { label: "About Us", description: "Know who we are & what are we trying to do.", icon: Info, href: "/about-us" },
    // { label: "Contact Us", description: "We are always here for you.", icon: Mail, href: "/contact-us" },
    // { label: "Logout", description: "You can login anytime to your account.", icon: LogOut, href: "/logout" },
];

export default function MoreServices() {
    return (
        <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
            <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
                {/* Heading */}
                <ViewReveal duration={800}>
                    <SectionHeading
                        title="Our Services"
                        description="are designed to fulfill your needs."
                    />

                </ViewReveal>

                {/* Services */}
                <ViewReveal duration={900} startDelay={150}>
                    <div className="w-full grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-5 border-b border-gray-100 pb-6 sm:pb-8">
                        {services.map((service) => {
                            const Icon = service.icon;

                            return (
                                <button
                                    type="button"
                                    key={service.label}
                                    className="group flex flex-col items-center gap-2 text-center"
                                >
                                    <span
                                        className={`relative flex h-12 w-12 items-center justify-center rounded-full ${service.bg} transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 sm:h-6 sm:w-6 ${service.color}`}
                                            strokeWidth={1.8}
                                        />

                                        {/* {service?.badge && (
                                            <span className="absolute -right-2 top-0 rounded-full bg-green-600 px-1.5 py-0.5 text-[7px] font-bold leading-none text-white">
                                                {service?.badge}
                                            </span>
                                        )} */}
                                    </span>

                                    <span className="whitespace-pre-line text-[10px] font-medium leading-snug text-black sm:text-xs max-w-[100px]">
                                        {service.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </ViewReveal>

                {/* Account menu */}
                <ViewReveal duration={900} startDelay={150}>
                    <section>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isLogout = item.label === "Logout";

                                return (
                                    <Link
                                        href={item.href}
                                        key={item.label}
                                        className="group flex min-h-[54px] items-center gap-3 rounded-xl px-0 py-2 transition-colors duration-200 hover:bg-gray-50 sm:gap-4 sm:py-3"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors group-hover:bg-orange-100 sm:h-9 sm:w-9">
                                            <Icon
                                                className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block text-xs font-medium sm:text-sm ${isLogout ? "text-black" : "text-gray-900"
                                                    }`}
                                            >
                                                {item.label}
                                            </span>

                                            <span className="mt-0.5 block text-[10px] leading-relaxed text-gray-500 sm:text-xs">
                                                {item.description}
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </ViewReveal>
            </div>
        </section>
    );
}