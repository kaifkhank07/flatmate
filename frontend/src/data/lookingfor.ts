import { Building2, House, LucideIcon, Users } from "lucide-react";

export interface LookingFirItem {
    title: string,
    subtitle: string,
    href: string,
    icon: LucideIcon;
}

export const useLookingFor = (): LookingFirItem[] => {
    return [
        {
            title: "Find a Room / Flat",
            subtitle: "Find a Room to Share with Others",
            href: "/listing?category=Flat",
            icon: House,
        },
        {
            title: "Find a Flatmate",
            subtitle: "Find Someone to Share Your Space",
            href: "/listing?category=Flatmate",
            icon: Users,
        },
        {
            title: "Find an Entire Flat / House",
            subtitle: "Find a Property Available for Rent",
            href: "/listing?category=Property",
            icon: Building2,
        },
    ]
}