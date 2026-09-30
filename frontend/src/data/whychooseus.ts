import {
    BadgeCheck,
    ShieldCheck,
    Users,
    ClipboardCheck,
    House,
    Headset,
    LucideIcon
} from "lucide-react";

export interface WhyChooseUsItem {
    title: string;
    description: string;
    icon: LucideIcon;
}

export const useWhyChooseUs = (): WhyChooseUsItem[] => {
    return [
        {
            title: "Verified Listings",
            description: "Truly genuine & verified properties and users.",
            icon: BadgeCheck,
        },
        {
            title: "Safe & Secure",
            description: "Background checks for peace of mind.",
            icon: ShieldCheck,
        },
        {
            title: "Community Driven",
            description: "Connect, share & belong",
            icon: Users,
        },
        {
            title: "Hassle-Free Process",
            description: "Truly genuine & verified properties and users.",
            icon: ClipboardCheck,
        },
        {
            title: "More Than Just A Stay",
            description: "Background checks for peace of mind.",
            icon: House,
        },
        {
            title: "Dedicated Support",
            description: "We're here when you need us.",
            icon: Headset,
        },
    ];
};