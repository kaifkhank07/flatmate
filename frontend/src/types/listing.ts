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
  | 'other'
  | 'any'
  | 'all';

export type PostType = 'property' | 'partner' | 'all';

export type PropertyType = 'room' | 'flat' | 'pg' | 'shared_apartment' | 'entire_property' | 'all';

export type PartnerType = 'roommate' | 'flatmate' | 'all';

export interface LocationItem {
  _id: string;
  name?: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  address?: {
    city?: string;
    subLocality?: string;
    locality?: string;
    state?: string;
    country?: string;
  };
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
  image?: {
    url?: string;
    key?: string;
  };
  isActive: boolean;
}

export interface UserPreferenceItem {
  _id: string;
  name: string;
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

export interface PropertyUser {
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
}

export interface PropertyListingItem {
  _id: string;
  sourceType: 'property';
  userId?: PropertyUser;
  ownerId?: PropertyUser;
  title: string;
  slug: string;
  description: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  location: LocationItem;
  rent: number;
  securityDeposit?: number;
  maintenanceCharges?: {
    amount: number;
    frequency: string;
  };
  furnishing?: FurnishingType;
  availableFrom: string;
  genderPreference?: GenderPreference;
  occupationPreference?: OccupationPreference;
  amenities?: AmenityItem[];
  houseRules?: string[];
  parking?: boolean | { available?: boolean };
  area?: number | { value?: number; unit?: string };
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
  userId: PropertyUser;
  title: string;
  slug: string;
  description?: string;
  postType: PostType;
  propertyType?: PropertyType;
  partnerType?: PartnerType;
  location: LocationItem;
  area?: number;
  rent: number;
  securityDeposit?: number;
  maintenanceCharges?: {
    amount: number;
    frequency: string;
  };
  furnishing?: FurnishingType;
  parking?: boolean;
  availableFrom: string;
  genderPreference: GenderPreference;
  occupationPreference: OccupationPreference;
  userPreferences?: UserPreferenceItem[];
  amenities?: AmenityItem[];
  images?: MediaItem[];
  videos?: MediaItem[];
  status: string;
  favoriteCount?: number;
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
  rent?: number;
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
  propertyType?: PropertyType;
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
  propertyType?: PropertyType;
  listingType?: ListingType;
} {
  switch (lookingForLabel) {
    case "A Flat":
      return { category: "Flat" };
    case "A Flatmate":
      return { category: "Flatmate" };
    case "Single Room":
      return { category: "Flat", propertyType: "room", listingType: "room" };
    case "Shared Room":
      return { category: "Flatmate", propertyType: "room", listingType: "room" };
    default:
      return { category: "Flat" };
  }
}

export interface FlatmateListingItem {
  id: string;
  sourceType: 'property' | 'flatmate_requirement';
  postType?: PostType;
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

  const getFirstMediaUrl = (images?: MediaItem[]): string | undefined => {
    if (!images || !Array.isArray(images) || images.length === 0) return undefined;
    const first = images[0];
    if (typeof first === "string") return first;
    return first?.url || undefined;
  };

  if (item.sourceType === "property") {
    const property = item as PropertyListingItem;

    const rentVal = typeof property.rent === "number" ? property.rent : (property.rent as any)?.amount;
    const rentFormatted = rentVal ? `₹ ${rentVal.toLocaleString("en-IN")}` : "Contact Owner";

    let locString = "Location N/A";
    let cityName = "";
    if (typeof property.location === "object" && property.location) {
      locString = property.location.formattedAddress || property.location.name || property.location.city || "Location N/A";
      cityName = property.location.city || property.location.address?.city || property.location.name || "";
    } else if (typeof property.location === "string") {
      locString = property.location;
    }

    const userObj = property.userId || property.ownerId;
    const ownerName = property.title || userObj?.name || "Property Listing";

    const gender: "Male" | "Female" = userObj?.gender === "female" || property.genderPreference === "female"
      ? "Female"
      : "Male";

    const lookingForGender = property.genderPreference === "male"
      ? "Male"
      : property.genderPreference === "female"
      ? "Female"
      : "Any";

    const pType = property.propertyType || property.listingType;
    const lookingForType = pType
      ? pType.replace(/_/g, " ").toUpperCase()
      : "PROPERTY";

    const category: "Flat" | "Flatmate" | "Property" = "Property";

    const avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4" =
      gender === "Male" ? "male1" : "female1";

    const displayImage = getFirstMediaUrl(property.images) || getUserAvatarUrl(userObj);

    return {
      id: property.slug || property._id,
      sourceType: "property",
      name: ownerName,
      gender,
      userImage: displayImage,
      location: locString,
      city: cityName,
      distance: itemDistanceStr,
      matchPercentage: 0,
      rent: rentFormatted,
      lookingForGender,
      lookingForType,
      category,
      avatarBg: "bg-[#EBF5FF]",
      avatarType,
    };
  } else {
    const flatmate = item as FlatmateRequirementItem;
    const isPropertyPost = flatmate.postType === "property";

    const rentVal = typeof flatmate.rent === "number" ? flatmate.rent : (flatmate as any).budget;
    const rentFormatted = rentVal ? `₹ ${rentVal.toLocaleString("en-IN")}` : "N/A";

    let locString = "Location N/A";
    let cityName = "";
    if (typeof flatmate.location === "object" && flatmate.location) {
      locString = flatmate.location.formattedAddress || flatmate.location.name || flatmate.location.city || "Location N/A";
      cityName = flatmate.location.city || flatmate.location.address?.city || flatmate.location.name || "";
    } else if (typeof flatmate.location === "string") {
      locString = flatmate.location;
    }

    const titleOrName = flatmate.userId?.name || flatmate.title || "Flatmate Requirement";

    const gender: "Male" | "Female" = flatmate.userId?.gender === "female"
      ? "Female"
      : flatmate.userId?.gender === "male"
      ? "Male"
      : flatmate.genderPreference === "female"
      ? "Female"
      : "Male";

    const lookingForGender = flatmate.genderPreference === "male"
      ? "Male"
      : flatmate.genderPreference === "female"
      ? "Female"
      : "Any";

    let lookingForType = "FLATMATE";
    if (isPropertyPost) {
      lookingForType = flatmate.propertyType
        ? flatmate.propertyType.replace(/_/g, " ").toUpperCase()
        : "FLAT";
    } else {
      lookingForType = flatmate.partnerType
        ? flatmate.partnerType.toUpperCase()
        : "ROOMMATE";
    }

    const category: "Flat" | "Flatmate" | "Property" = isPropertyPost ? "Flat" : "Flatmate";

    const avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4" =
      gender === "Male" ? "male1" : "female1";

    const displayImage = isPropertyPost
      ? getFirstMediaUrl(flatmate.images) || getUserAvatarUrl(flatmate.userId)
      : getUserAvatarUrl(flatmate.userId) || getFirstMediaUrl(flatmate.images);

    return {
      id: flatmate.slug || flatmate._id,
      sourceType: "flatmate_requirement",
      postType: flatmate.postType,
      name: titleOrName,
      gender,
      userImage: displayImage,
      location: locString,
      city: cityName,
      distance: itemDistanceStr,
      matchPercentage: 0,
      rent: rentFormatted,
      lookingForGender,
      lookingForType,
      category,
      avatarBg: isPropertyPost ? "bg-[#FFF5EB]" : "bg-[#F0FDF4]",
      avatarType,
    };
  }
}
