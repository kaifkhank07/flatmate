"use client";

import { useAssets } from "./assets";

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export const useTestimonials = (): TestimonialItem[] => {
  const assets = useAssets();

  return [
    {
      id: "1",
      name: "Elora Queen",
      role: "Founder at Lee",
      avatar: assets.avatar1,
      content:
        '"Extremely satisfied with their service. They are listened to what I wanted and delivered exactly that. They made buying a property so much easier than I expected. I will definitely work with them again."',
      rating: 5,
    },
    {
      id: "2",
      name: "Aarav Sharma",
      role: "Software Engineer",
      avatar: assets.avatar2,
      content:
        '"Finding a compatible roommate in a new city used to be a nightmare until I found this platform. Verified profiles gave me total peace of mind and the process was smooth from start to finish."',
      rating: 5,
    },
    {
      id: "3",
      name: "Sophia Patel",
      role: "Product Designer",
      avatar: assets.avatar3,
      content:
        '"The platform connects real people with real spaces. The matching accuracy and user interface are top-notch. Highly recommended for anyone moving to a new city!"',
      rating: 5,
    },
  ];
};
