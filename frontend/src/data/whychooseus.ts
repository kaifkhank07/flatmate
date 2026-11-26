import { useAssets } from "./assets";

export interface WhyChooseUsItem {
    title: string;
    description: string;
    icon: string;
}


const assets = useAssets();

export const useWhyChooseUs = (): WhyChooseUsItem[] => {
    return [
        {
            title: "Flatmate Matchmaking",
            description: "Find people seeking a flatmate or shared spaces.",
            icon: assets.whychooseus1,
        },
        {
            title: "Two-Way Discovery",
            description: "Explore requirements and available listings.",
            icon: assets.whychooseus2,
        },
        {
            title: "Flexible Accommodation",
            description: "From shared rooms to complete rental properties.",
            icon: assets.whychooseus3,
        },
        {
            title: "Communnity Network",
            description: "Connect through accommodation communities.",
            icon: assets.whychooseus4,
        },
        {
            title: "People-First Approach",
            description: "Built around people and their accommodation needs.",
            icon: assets.whychooseus5,
        },
        {
            title: "Easy Connections",
            description: "Bringing accommodation seekers and providers together.",
            icon: assets.whychooseus6,
        },
    ];
};