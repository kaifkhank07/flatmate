import { useAssets } from "./assets";

export interface CityItem {
    id: string;
    title: string;
    image: string;
}

export const useCitiesData = (): CityItem[] => {
    const assets = useAssets();

    return [
        {
            id: "1",
            title: "Mumbai",
            image: assets.city1,
        },
        {
            id: "2",
            title: "Pune",
            image: assets.city2,
        },
        {
            id: "3",
            title: "Bangalore",
            image: assets.city3,
        },
        {
            id: "4",
            title: "Hyderabad",
            image: assets.city4,
        },
        {
            id: "5",
            title: "Aurangabad",
            image: assets.city5,
        },
    ];
};
