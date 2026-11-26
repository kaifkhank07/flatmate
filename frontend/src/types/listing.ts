/**
 * Listing Types & Interfaces
 * Matches Backend models and API response contracts
 */

export type SourceType = 'all' | 'property' | 'flatmate_requirement';

export type PropertyType =
  | 'flat_apartment'
  | 'house'
  | 'villa';

export type PropertyCategory = PropertyType;

export type FlatmatePropertyType = 'room' | 'flat' | 'pg' | 'shared_apartment';

export interface PropertyListingType {
  type?: string;
  category?: PropertyType;
}

export type FacingDirection =
  | 'east'
  | 'west'
  | 'north'
  | 'south'
  | 'north_east'
  | 'north_west'
  | 'south_east'
  | 'south_west';

export type BedroomConfiguration =
  | '1_rk'
  | '1_bhk'
  | '2_bhk'
  | '3_bhk'
  | '4_bhk'
  | '5_bhk'
  | '5_plus_bhk';

export interface PropertyDetails {
  floor?: number;
  totalFloors?: number;
  facing?: FacingDirection;
  bedrooms?: BedroomConfiguration;
}

export interface BrokerageDetails {
  applicable: boolean;
  type?: 'fixed' | 'percentage';
  value?: number;
}

export type PropertyPostedBy = 'owner' | 'flatmate' | 'agent' | 'builder';
export type FlatmatePostedBy = 'owner' | 'flatmate';

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

export type OccupancyPreference =
  | 'any'
  | 'single'
  | 'shared';

export type TenantPreference = 'anyone' | 'bachelors' | 'family';

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

export type FilterPropertyType =
  | 'room'
  | 'flat'
  | 'pg'
  | 'shared_apartment'
  | 'entire_property'
  | PropertyType
  | 'all';

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
  userType?: 'owner' | 'flatmate' | 'agent' | 'builder';
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
  propertyType?: PropertyType | PropertyListingType | string;
  listingType?: PropertyType | PropertyListingType | string;
  propertyDetails?: PropertyDetails;
  brokerage?: boolean;
  brokerageDetails?: BrokerageDetails;
  postedBy?: PropertyPostedBy;
  location: LocationItem;
  rent: number;
  securityDeposit?: number;
  maintenanceCharges?: {
    amount: number;
    frequency: string;
  };
  furnishing?: FurnishingType;
  availableFrom: string;
  tenantPreference?: TenantPreference;
  genderPreference?: GenderPreference;
  occupationPreference?: OccupationPreference;
  amenities?: AmenityItem[];
  houseRules?: string[];
  parking?: boolean | { available?: boolean };
  area?: number | { value?: number; unit?: string };
  images?: MediaItem[];
  videos?: MediaItem[];
  status: string;
  rejectionReason?: string;
  favoriteCount?: number;
  viewsCount?: number;
  approvedAt?: string;
  publishedAt?: string;
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
  propertyType?: FlatmatePropertyType;
  partnerType?: PartnerType;
  propertyDetails?: PropertyDetails;
  postedBy?: FlatmatePostedBy;
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
  brokerage?: boolean;
  availableFrom: string;
  genderPreference: GenderPreference;
  occupancyPreference?: OccupancyPreference;
  occupationPreference: OccupationPreference;
  userPreferences?: UserPreferenceItem[];
  amenities?: AmenityItem[];
  images?: MediaItem[];
  videos?: MediaItem[];
  status: string;
  rejectionReason?: string;
  favoriteCount?: number;
  viewsCount?: number;
  approvedAt?: string;
  publishedAt?: string;
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
  minBudget?: number;
  maxBudget?: number;
  minPrice?: number;
  maxPrice?: number;
  genderPreference?: GenderPreference;
  tenantPreference?: TenantPreference | 'all';
  occupancyPreference?: OccupancyPreference | 'all';
  occupationPreference?: OccupationPreference;
  moveInDate?: string;
  availableFrom?: string;
  listingType?: ListingType;
  furnishing?: FurnishingType;
  postType?: PostType;
  propertyType?: PropertyType | FlatmatePropertyType | 'all';
  partnerType?: PartnerType;
  bhk?: BedroomConfiguration | 'all';
  peopleCount?: number;
  sortBy?: string;
  order?: 'asc' | 'desc' | '1' | '-1';
}

export type ListingSortOption =
  | 'relevance'
  | 'recent'
  | 'price_low_high'
  | 'price_high_low';

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
export type GenderFilter = "Any" | "Male" | "Female" | "All";

export function getCategoryFilters(cat: ListingCategory): {
  sourceType: SourceType;
  postType: PostType | undefined;
  propertyType?: PropertyType;
  listingType?: ListingType;
} {
  if (cat === "Flat") {
    return { sourceType: "flatmate_requirement", postType: "partner" };
  } else if (cat === "Flatmate") {
    return { sourceType: "flatmate_requirement", postType: "property" };
  } else if (cat === "Property") {
    return { sourceType: "property", postType: undefined };
  } else {
    return { sourceType: "all", postType: undefined };
  }
}

export function getCategoryMappingFromLookingFor(lookingForLabel: string): {
  category?: ListingCategory;
  propertyType?: PropertyType | FlatmatePropertyType;
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
  title?: string;
  tenantPreference?: string;
  occupancyPreference?: string;
  name: string;
  gender: "Male" | "Female";
  userImage?: string;
  propertyImage?: string;
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
  status?: string;
  bhk?: string;
  floor?: string;
  facing?: string;
  postedBy?: string;
  brokerage?: string;
  furnishing?: string;
}

export function mapUnifiedListingToCard(item: UnifiedListingItem): FlatmateListingItem {
  const itemDistanceStr =
    typeof item.distance === "number"
      ? item.distance === 0
        ? "Same Location"
        : `${item.distance} Km Away`
      : "";

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

    let lookingForGender = "Any";
    let tenantPreferenceFormatted = "Anyone";
    if (property.tenantPreference) {
      tenantPreferenceFormatted = property.tenantPreference === "bachelors"
        ? "Bachelor's"
        : property.tenantPreference === "family"
          ? "Family"
          : "Anyone";
      lookingForGender = tenantPreferenceFormatted;
    } else if (property.genderPreference === "male") {
      lookingForGender = "Male";
      tenantPreferenceFormatted = "Male";
    } else if (property.genderPreference === "female") {
      lookingForGender = "Female";
      tenantPreferenceFormatted = "Female";
    }

    let lookingForType = "PROPERTY";
    if (property.propertyType) {
      if (typeof property.propertyType === "object" && property.propertyType !== null) {
        lookingForType = (
          (property.propertyType as any).category ||
          (property.propertyType as any).type ||
          "PROPERTY"
        ).replace(/_/g, " ").toUpperCase();
      } else {
        lookingForType = String(property.propertyType).replace(/_/g, " ").toUpperCase();
      }
    } else if (property.listingType) {
      lookingForType = String(property.listingType).replace(/_/g, " ").toUpperCase();
    }

    const bhk = property.propertyDetails?.bedrooms
      ? property.propertyDetails.bedrooms.replace(/_/g, " ").toUpperCase()
      : undefined;

    let floorStr: string | undefined = undefined;
    if (property.propertyDetails?.floor !== undefined) {
      floorStr =
        property.propertyDetails.floor === 0
          ? "Ground"
          : `Floor ${property.propertyDetails.floor}`;
      if (property.propertyDetails.totalFloors !== undefined) {
        floorStr += `/${property.propertyDetails.totalFloors}`;
      }
    }

    const facing = property.propertyDetails?.facing
      ? property.propertyDetails.facing.replace(/_/g, " ").toUpperCase()
      : undefined;

    const postedBy = property.postedBy ? property.postedBy.toUpperCase() : undefined;

    const furnishingStr = property.furnishing
      ? String(property.furnishing).replace(/_/g, " ").toUpperCase()
      : undefined;

    let brokerageStr: string | undefined = undefined;
    if (typeof property.brokerage === "boolean") {
      brokerageStr = property.brokerage ? "Brokerage Applicable" : "Zero Brokerage";
    } else if (property.brokerageDetails) {
      brokerageStr = property.brokerageDetails.applicable
        ? property.brokerageDetails.type === "percentage"
          ? `${property.brokerageDetails.value}% Brokerage`
          : `₹${(property.brokerageDetails.value || 0).toLocaleString("en-IN")} Brokerage`
        : "Zero Brokerage";
    }

    const category: "Flat" | "Flatmate" | "Property" = "Property";

    const avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4" =
      gender === "Male" ? "male1" : "female1";

    const propertyImage = getFirstMediaUrl(property.images);
    const userAvatar = getUserAvatarUrl(userObj);

    const status = property.status || "status";

    return {
      id: property.slug || property._id,
      sourceType: "property",
      title: property.title,
      tenantPreference: tenantPreferenceFormatted,
      name: ownerName,
      gender,
      userImage: userAvatar,
      propertyImage: propertyImage,
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
      status,
      bhk,
      floor: floorStr,
      facing,
      postedBy,
      brokerage: brokerageStr,
      furnishing: furnishingStr,
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

    // For partner requirement, name should be listing title instead of user's name
    const titleOrName =
      flatmate.postType === "partner"
        ? flatmate.title || flatmate.userId?.name || "Flatmate Requirement"
        : flatmate.userId?.name || flatmate.title || "Flatmate Requirement";

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

    let occupancyPrefFormatted = "Any";
    if (flatmate.occupancyPreference) {
      const occ = String(flatmate.occupancyPreference).toLowerCase();
      occupancyPrefFormatted = occ.charAt(0).toUpperCase() + occ.slice(1);
    }

    let lookingForType = occupancyPrefFormatted;
    if (!flatmate.occupancyPreference) {
      if (isPropertyPost) {
        lookingForType = flatmate.propertyType
          ? flatmate.propertyType.replace(/_/g, " ").toUpperCase()
          : "FLAT";
      } else {
        lookingForType = flatmate.partnerType
          ? flatmate.partnerType.toUpperCase()
          : "ROOMMATE";
      }
    }

    const bhk = flatmate.propertyDetails?.bedrooms
      ? flatmate.propertyDetails.bedrooms.replace(/_/g, " ").toUpperCase()
      : undefined;

    let floorStr: string | undefined = undefined;
    if (flatmate.propertyDetails?.floor !== undefined) {
      floorStr =
        flatmate.propertyDetails.floor === 0
          ? "Ground"
          : `Floor ${flatmate.propertyDetails.floor}`;
      if (flatmate.propertyDetails.totalFloors !== undefined) {
        floorStr += `/${flatmate.propertyDetails.totalFloors}`;
      }
    }

    const facing = flatmate.propertyDetails?.facing
      ? flatmate.propertyDetails.facing.replace(/_/g, " ").toUpperCase()
      : undefined;

    const postedBy = flatmate.postedBy ? flatmate.postedBy.toUpperCase() : undefined;

    const furnishingStr = flatmate.furnishing
      ? String(flatmate.furnishing).replace(/_/g, " ").toUpperCase()
      : undefined;

    const category: "Flat" | "Flatmate" | "Property" = isPropertyPost ? "Flatmate" : "Flat";

    const avatarType: "male1" | "female1" | "female2" | "female3" | "male2" | "female4" =
      gender === "Male" ? "male1" : "female1";

    const propertyImage = getFirstMediaUrl(flatmate.images);
    const userAvatar = getUserAvatarUrl(flatmate.userId);

    const status = flatmate.status || "status";

    let flatmateBrokerageStr: string | undefined = undefined;
    if (typeof flatmate.brokerage === "boolean") {
      flatmateBrokerageStr = flatmate.brokerage ? "Brokerage Applicable" : "Zero Brokerage";
    }

    return {
      id: flatmate.slug || flatmate._id,
      sourceType: "flatmate_requirement",
      postType: flatmate.postType,
      title: flatmate.title,
      occupancyPreference: occupancyPrefFormatted,
      name: titleOrName,
      gender,
      userImage: userAvatar,
      propertyImage: propertyImage,
      location: locString,
      city: cityName,
      distance: itemDistanceStr,
      matchPercentage: 0,
      rent: rentFormatted,
      lookingForGender,
      lookingForType,
      category,
      avatarBg: isPropertyPost ? "bg-[#F0FDF4]" : "bg-[#FFF5EB]",
      avatarType,
      status,
      bhk,
      floor: floorStr,
      facing,
      postedBy,
      brokerage: flatmateBrokerageStr,
      furnishing: furnishingStr,
    };
  }
}
