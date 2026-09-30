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
            title: "Find A Home",
            subtitle: "Flats • Apartments • PG • Rooms",
            href: "/listing",
            icon: House,
        },
        {
            title: "Find A Flatmate",
            subtitle: "Compatible People • Shared Living",
            href: "/flatmates",
            icon: Users,
        },
        {
            title: "Real Estate Services",
            subtitle: "Buy • Sell • Rent • Invest",
            href: "/services",
            icon: Building2,
        },
    ]
}