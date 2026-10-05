/**
 * Listing Types & Interfaces
 * Matches Backend models and API response contracts
 */

export type SourceType = 'all' | 'property' | 'flatmate_requirement';

export type ListingType =
  | 'flat'
  | 'room'
  | 'pg'
  | 'shared_apartment'
  | 'entire_property'
  | 'all';

export type FurnishingType =
  | 'fully_furnished'
  | 'semi_furnished'
  | 'unfurnished'
  | 'all';

export type GenderPreference = 'male' | 'female' | 'other' | 'any' | 'all';

export type OccupationPreference =
  | 'student'
  | 'working_professional'
  | 'self_employed'
  | 'business_owner'
  | 'freelancer'
  | 'any'
  | 'all';

export type PostType = 'property' | 'partner' | 'all';

export type PropertyType = 'room' | 'flat' | 'pg' | 'shared_apartment' | 'all';

export type PartnerType = 'roommate' | 'flatmate' | 'all';

export interface LocationItem {
  _id: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface AmenityItem {
  _id: string;
  name: string;
  category: string;
  image?: {
    url?: string;
    key?: string;
  };
  isActive: boolean;
}

export interface UserPreferenceItem {
  _id: string;
  name: string;
  category: string;
  icon?: string;
  image?: {
    url?: string;
    key?: string;
  } | string;
  isActive: boolean;
}

export interface CityItem {
  _id: string;
  name: string;
  slug: string;
  state?: string;
  isActive?: boolean;
  image?: {
    url?: string;
  };
}

export interface MediaItem {
  _id: string;
  url: string;
  key?: string;
  caption?: string;
}

export interface PropertyListingItem {
  _id: string;
  sourceType: 'property';
  ownerId: {
    _id: string;
    name?: string;
    gender?: string;
    email?: string;
    mobile?: string;
    contact?: string;
    image?: string;
    avatar?: string;
    profileImage?: string;
    role?: string;
    profileVerified?: boolean;
    isOnline?: boolean;
  };
  title: string;
  slug: string;
  description: string;
  listingType: ListingType;
  location: LocationItem;
  rent: number;
  securityDeposit?: number;
  maintenanceCharges?: {
    amount: number;
    frequency: string;
  };
  furnishing: FurnishingType;
  availableFrom: string;
  availableUntil?: string;
  genderPreference: GenderPreference;
  occupationPreference: OccupationPreference;
  amenities?: AmenityItem[];
  houseRules?: string[];
  parking?: {
    available: boolean;
  };
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floors?: number;
  area?: {
    value: number;
    unit: 'sqft' | 'sqm';
  };
  images?: MediaItem[];
  videos?: MediaItem[];
  status: string;
  favoriteCount?: number;
  distance?: number;
  distanceUnit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlatmateRequirementItem {
  _id: string;
  sourceType: 'flatmate_requirement';
  userId: {
    _id: string;
    name?: string;
    gender?: string;
    email?: string;
    mobile?: string;
    contact?: string;
    image?: string;
    avatar?: string;
    profileImage?: string;
    role?: string;
    profileVerified?: boolean;
    isOnline?: boolean;
  };
  title: string;
  slug: string;
  description?: string;
  postType: PostType;
  propertyType?: PropertyType;
  partnerType?: PartnerType;
  location: LocationItem;
  budget: number;
  occupationPreference: OccupationPreference;
  genderPreference: GenderPreference;
  lifestylePreferences?: UserPreferenceItem[];
  moveInDate: string;
  peopleCount?: number;
  images?: MediaItem[];
  videos?: MediaItem[];
  status: string;
  distance?: number;
  distanceUnit?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnifiedListingItem = PropertyListingItem | FlatmateRequirementItem;

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SearchLocationInfo {
  placeId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  name?: string;
}

export interface ListingQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  sourceType?: SourceType;
  location?: string;
  locationPlaceId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  searchLocationName?: string;
  budget?: number;
  genderPreference?: GenderPreference;
  occupationPreference?: OccupationPreference;
  moveInDate?: string;
  availableFrom?: string;
  listingType?: ListingType;
  furnishing?: FurnishingType;
  postType?: PostType;
  propertyType?: PropertyType;
  partnerType?: PartnerType;
  peopleCount?: number;
  sortBy?: string;
  order?: 'asc' | 'desc' | '1' | '-1';
}

export interface ListingOptions {
  amenities: AmenityItem[];
  cities: CityItem[];
  lifestylePreferences: UserPreferenceItem[];
  listingTypes: { label: string; value: ListingType }[];
  furnishingTypes: { label: string; value: FurnishingType }[];
  genderPreferences: { label: string; value: GenderPreference }[];
  occupationPreferences: { label: string; value: OccupationPreference }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface GetListingsResponseData {
  listings: UnifiedListingItem[];
  searchLocation?: SearchLocationInfo;
  pagination: PaginationInfo;
}

export type ListingCategory = "All" | "Flat" | "Flatmate" | "Property";
export type GenderFilter = "All" | "Male" | "Female";

export function getCategoryFilters(cat: ListingCategory): {
  sourceType: SourceType;
  postType: PostType | undefined;
  listingType?: ListingType;
} {
  if (cat === "Flat") {
    return { sourceType: "flatmate_requirement", postType: "property" };
  } else if (cat === "Flatmate") {
    return { sourceType: "flatmate_requirement", postType: "partner" };
  } else if (cat === "Property") {
    return { sourceType: "property", postType: undefined };
  } else {
    return { sourceType: "all", postType: undefined };
  }
}

export function getCategoryMappingFromLookingFor(lookingForLabel: string): {
  category?: ListingCategory;
  listingType?: ListingType;
} {
  switch (lookingForLabel) {
    case "A Flat":
      return { category: "Flat" };
    case "A Flatmate":
      return { category: "Flatmate" };
    case "Single Room":
      return { category: "Flat", listingType: "room" };
    case "Shared Room":
      return { category: "Flatmate", listingType: "room" };
    default:
      return { category: "Flat" };
  }
}

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

export function mapUnifiedListingToCard(item: UnifiedListingItem): FlatmateListingItem {
  const itemDistanceStr =
    typeof item.distance === "number" ? `${item.distance} Km From Your Search` : "";

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

    const getUserAvatarUrl = (userObj: any): string | undefined => {
      if (!userObj) return undefined;
      if (typeof userObj.image === "string" && userObj.image) return userObj.image;
      if (typeof userObj.image === "object" && userObj.image?.url) return userObj.image.url;
      if (typeof userObj.profileImage === "string" && userObj.profileImage) return userObj.profileImage;
      if (typeof userObj.profileImage === "object" && userObj.profileImage?.url) return userObj.profileImage.url;
      if (typeof userObj.avatar === "string" && userObj.avatar) return userObj.avatar;
      if (typeof userObj.avatar === "object" && userObj.avatar?.image?.url) return userObj.avatar.image.url;
      return undefined;
    };

    const userImg = getUserAvatarUrl(property.ownerId);

    return {
      id: property.slug || property._id,
      name: ownerName,
      gender,
      userImage: userImg,
      location: locString,
      city: cityName,
      distance: itemDistanceStr,
      matchPercentage: 0,
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

    const getUserAvatarUrl = (userObj: any): string | undefined => {
      if (!userObj) return undefined;
      if (typeof userObj.image === "string" && userObj.image) return userObj.image;
      if (typeof userObj.image === "object" && userObj.image?.url) return userObj.image.url;
      if (typeof userObj.profileImage === "string" && userObj.profileImage) return userObj.profileImage;
      if (typeof userObj.profileImage === "object" && userObj.profileImage?.url) return userObj.profileImage.url;
      if (typeof userObj.avatar === "string" && userObj.avatar) return userObj.avatar;
      if (typeof userObj.avatar === "object" && userObj.avatar?.image?.url) return userObj.avatar.image.url;
      return undefined;
    };

    const userImg = getUserAvatarUrl(req.userId);

    return {
      id: req.slug || req._id,
      name: userName,
      gender,
      userImage: userImg,
      location: locString,
      city: cityName,
      distance: itemDistanceStr,
      matchPercentage: 0,
      rent: rentFormatted,
      lookingForGender,
      lookingForType,
      category: "Flatmate",
      avatarBg: gender === "Male" ? "#4585C5" : "#E3B887",
      avatarType,
    };
  }
}
