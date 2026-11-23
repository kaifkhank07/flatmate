import {
    ShieldCheck,
    House,
    Headset,
    LucideIcon,
    FaceSlightlySmiling,
    Check,
    UserGroup
} from "lucide-react";

export interface WhyChooseUsItem {
    title: string;
    description: string;
    icon: LucideIcon;
    iconBg?: string;
}

export const useWhyChooseUs = (): WhyChooseUsItem[] => {
    return [
        {
            title: "Verified Listings",
            description: "Truly genuine & verified properties and users.",
            icon: Check,
            iconBg: "#09B300"
        },
        {
            title: "Safe & Secure",
            description: "Background checks for peace of mind.",
            icon: ShieldCheck,
            iconBg: "#FF8800"
        },
        {
            title: "Community Driven",
            description: "Connect, share & belong",
            icon: UserGroup,
            iconBg: "#0196FD"
        },
        {
            title: "Hassle-Free Process",
            description: "Truly genuine & verified properties and users.",
            icon: FaceSlightlySmiling,
            iconBg: "#FFC116"
        },
        {
            title: "More Than Just A Stay",
            description: "Background checks for peace of mind.",
            icon: House,
            iconBg: "#B5B5B5"
        },
        {
            title: "Dedicated Support",
            description: "We're here when you need us.",
            icon: Headset,
            iconBg: "#F90004"
        },
    ];
};