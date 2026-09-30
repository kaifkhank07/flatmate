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

export interface ListingQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  sourceType?: SourceType;
  location?: string;
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
  pagination: PaginationInfo;
}
