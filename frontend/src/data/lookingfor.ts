import { useAssets } from "./assets";

export interface LookingFirItem {
    title: string;
    subtitle: string;
    href: string;
    icon: string;
}

export const useLookingFor = (): LookingFirItem[] => {
    const assets = useAssets();
    return [
        {
            title: "Rooms Available",
            subtitle: "Find Rooms & Shared Flats",
            href: "/listing?category=Flat",
            icon: assets.listingicon1,
        },
        {
            title: "Accommodation Seekers",
            subtitle: "Find People Looking for a Room or Flat",
            href: "/listing?category=Flatmate",
            icon: assets.listingicon2,
        },
        {
            title: "Entire Properties",
            subtitle: "Find Complete Flats & Properties",
            href: "/listing?category=Property",
            icon: assets.listingicon3,
        },
    ];
};
