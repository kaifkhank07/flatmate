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
            title: "Rooms",
            subtitle: "Explore rooms and shared flats.",
            href: "/listing?category=Flat",
            icon: assets.listingicon1,
        },
        {
            title: "Flatmates",
            subtitle: "Find someone to share your space.",
            href: "/listing?category=Flatmate",
            icon: assets.listingicon2,
        },
        {
            title: "Entire Properties",
            subtitle: "Explore flats and homes for rent.",
            href: "/listing?category=Property",
            icon: assets.listingicon3,
        },
    ];
};
