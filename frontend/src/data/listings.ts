import { useAssets } from "./assets";

/* ==========================================================================
   Home Page Property Listings Types & Data
   ========================================================================== */
export interface ListingItem {
  id: string;
  title: string;
  location: string;
  price: string;
  details: string;
  isVerified: boolean;
  showcaseAvailable: boolean;
  image: string;
}

export const useListingsData = (): ListingItem[] => {
  const assets = useAssets();

  return [
    {
      id: "1",
      title: "1 BHK APARTMENT",
      location: "Andheri West, Mumbai",
      price: "₹ 25,000 / month",
      details: "1 BHK | 1 Bath | 1 Parking",
      isVerified: true,
      showcaseAvailable: true,
      image: assets.property01,
    },
    {
      id: "2",
      title: "2 BHK APARTMENT",
      location: "Andheri West, Mumbai",
      price: "₹ 35,000 / month",
      details: "2 BHK | 2 Bath | 1 Parking",
      isVerified: true,
      showcaseAvailable: true,
      image: assets.property02,
    },
    {
      id: "3",
      title: "1 BHK APARTMENT",
      location: "Andheri West, Mumbai",
      price: "₹ 25,000 / month",
      details: "1 BHK | 1 Bath | 1 Parking",
      isVerified: true,
      showcaseAvailable: true,
      image: assets.property03,
    },
  ];
};

/* ==========================================================================
   Listing Page Flatmate & Property Search Types & Data
   ========================================================================== */
export type ListingCategory = "All" | "Flat" | "Flatmate" | "Property";
export type GenderFilter = "All" | "Male" | "Female";

export interface FlatmateListingItem {
  id: string;
  name: string;
  gender: "Male" | "Female";
  userImage?: string;
  location: string;
  city: string;
  distance: string;
  matchPercentage: number;
  rent: string;
  lookingForGender: string;
  lookingForType: string;
  category: "Flat" | "Flatmate" | "Property";
  avatarBg: string;
  avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4";
}

export const useFlatmateListingsData = (): FlatmateListingItem[] => {
  return [
    {
      id: "1",
      name: "Yash Singh",
      gender: "Male",
      location: "Delhi, India",
      city: "Banglore",
      distance: "2.8 Km From Your Search",
      matchPercentage: 52,
      rent: "₹ 5000",
      lookingForGender: "Any",
      lookingForType: "Roommate",
      category: "Flatmate",
      avatarBg: "#4585C5",
      avatarType: "male1",
    },
    {
      id: "2",
      name: "Yash Singh",
      gender: "Female",
      location: "Delhi, India",
      city: "Banglore",
      distance: "2.8 Km From Your Search",
      matchPercentage: 52,
      rent: "₹ 5000",
      lookingForGender: "Any",
      lookingForType: "Roommate",
      category: "Flatmate",
      avatarBg: "#E83D55",
      avatarType: "female1",
    },
    {
      id: "3",
      name: "Yash Singh",
      gender: "Female",
      location: "Delhi, India",
      city: "Banglore",
      distance: "2.8 Km From Your Search",
      matchPercentage: 52,
      rent: "₹ 5000",
      lookingForGender: "Any",
      lookingForType: "Roommate",
      category: "Flatmate",
      avatarBg: "#E3B887",
      avatarType: "female2",
    },
    {
      id: "4",
      name: "Yash Singh",
      gender: "Female",
      location: "Delhi, India",
      city: "Banglore",
      distance: "2.8 Km From Your Search",
      matchPercentage: 52,
      rent: "₹ 5000",
      lookingForGender: "Any",
      lookingForType: "Roommate",
      category: "Flatmate",
      avatarBg: "#2B5F66",
      avatarType: "female3",
    },
    {
      id: "5",
      name: "Rohan Verma",
      gender: "Male",
      location: "Indiranagar, Banglore",
      city: "Banglore",
      distance: "1.5 Km From Your Search",
      matchPercentage: 88,
      rent: "₹ 8500",
      lookingForGender: "Male",
      lookingForType: "Flatmate",
      category: "Flat",
      avatarBg: "#4585C5",
      avatarType: "male2",
    },
    {
      id: "6",
      name: "Priya Sharma",
      gender: "Female",
      location: "Koramangala, Banglore",
      city: "Banglore",
      distance: "3.1 Km From Your Search",
      matchPercentage: 76,
      rent: "₹ 6500",
      lookingForGender: "Female",
      lookingForType: "Property",
      category: "Property",
      avatarBg: "#E83D55",
      avatarType: "female4",
    },
  ];
};

import { UnifiedListingItem, PropertyListingItem, FlatmateRequirementItem } from "@/types/listing";

export function mapUnifiedListingToCard(item: UnifiedListingItem): FlatmateListingItem {
  if (item.sourceType === "property") {
    const property = item as PropertyListingItem;

    const rentVal = typeof property.rent === "number" ? property.rent : (property.rent as any)?.amount;
    const rentFormatted = rentVal ? `₹ ${rentVal}` : "Contact Owner";

    let locString = "Location N/A";
    let cityName = "";
    if (typeof property.location === "object" && property.location) {
      locString = property.location.formattedAddress || property.location.city || "Location N/A";
      cityName = property.location.city || "";
    } else if (typeof property.location === "string") {
      locString = property.location;
    }

    const ownerName = property.ownerId?.name || property.title || "Property Listing";

    const gender: "Male" | "Female" = property.genderPreference === "female"
      ? "Female"
      : property.genderPreference === "male"
      ? "Male"
      : "Female";

    const lookingForGender = property.genderPreference === "male"
      ? "Male"
      : property.genderPreference === "female"
      ? "Female"
      : "Any";

    const lookingForType = property.listingType
      ? property.listingType.replace(/_/g, " ").toUpperCase()
      : "Roommate";

    const category: "Flat" | "Flatmate" | "Property" = property.listingType === "flat"
      ? "Flat"
      : "Property";

    const avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4" =
      gender === "Male" ? "male1" : "female1";

    const userImg = property.ownerId?.image || property.ownerId?.profileImage || property.ownerId?.avatar;

    return {
      id: property.slug || property._id,
      name: ownerName,
      gender,
      userImage: userImg,
      location: locString,
      city: cityName,
      distance: "2.8 Km From Your Search",
      matchPercentage: property.favoriteCount ? Math.min(99, 50 + property.favoriteCount * 5) : 75,
      rent: rentFormatted,
      lookingForGender,
      lookingForType,
      category,
      avatarBg: gender === "Male" ? "#4585C5" : "#E83D55",
      avatarType,
    };
  } else {
    const req = item as FlatmateRequirementItem;

    const budgetVal = typeof req.budget === "number" ? req.budget : (req.budget as any)?.max ?? (req.budget as any)?.min;
    const rentFormatted = budgetVal !== undefined && budgetVal !== null ? `₹ ${budgetVal}` : "Flexible";

    let locString = "Location N/A";
    let cityName = "";
    if (typeof req.location === "object" && req.location) {
      locString = req.location.formattedAddress || req.location.city || "Location N/A";
      cityName = req.location.city || "";
    } else if (typeof req.location === "string") {
      locString = req.location;
    }

    const userName = req.userId?.name || req.title || "Flatmate Listing";

    const gender: "Male" | "Female" = req.genderPreference === "female"
      ? "Female"
      : req.genderPreference === "male"
      ? "Male"
      : "Female";

    const lookingForGender = req.genderPreference === "male"
      ? "Male"
      : req.genderPreference === "female"
      ? "Female"
      : "Any";

    const lookingForType = req.partnerType
      ? req.partnerType.charAt(0).toUpperCase() + req.partnerType.slice(1)
      : req.propertyType
      ? req.propertyType.toUpperCase()
      : "Roommate";

    const avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4" =
      gender === "Male" ? "male2" : "female2";

    const userImg = req.userId?.image || req.userId?.profileImage || req.userId?.avatar;

    return {
      id: req.slug || req._id,
      name: userName,
      gender,
      userImage: userImg,
      location: locString,
      city: cityName,
      distance: "2.8 Km From Your Search",
      matchPercentage: 82,
      rent: rentFormatted,
      lookingForGender,
      lookingForType,
      category: "Flatmate",
      avatarBg: gender === "Male" ? "#4585C5" : "#E3B887",
      avatarType,
    };
  }
}

