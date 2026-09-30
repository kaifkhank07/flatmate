export interface StatItem {
    id: string;
    value: number;
    suffix: string;
    title: string;
    description: string;
}

export const useStatsData = (): StatItem[] => {
    return [
        {
            id: "experience",
            value: 50,
            suffix: "k",
            title: "Verified Listings",
            description:
                "Verified listings and profiles helping urban professionals find their ideal homes across major cities.",
        },
        {
            id: "projects",
            value: 100,
            suffix: "%",
            title: "Zero Brokerage",
            description:
                "Zero brokerage charges, saving users millions in upfront move-in costs and hidden fees.",
        },
        {
            id: "cities",
            value: 98,
            suffix: "%",
            title: "Successful Matches",
            description:
                "Successful match rate between roommates based on shared lifestyles, preferences, and house rules.",
        },
    ];
};