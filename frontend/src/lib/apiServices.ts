import apiClient from "@/lib/api";
import { ApiResponse, PropertyListingItem, FlatmateRequirementItem } from "@/types/listing";

export interface AutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types?: string[];
}

export interface SavePlacePayload {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  address?: {
    streetNumber?: string;
    route?: string;
    subLocality?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    stateCode?: string;
    country?: string;
    countryCode?: string;
    postalCode?: string;
  };
  googleMaps?: {
    placeId?: string;
    mapsUrl?: string;
    location?: { lat: number; lng: number };
  };
}

export interface LocationItem {
  _id: string;
  name: string;
  formattedAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  isActive?: boolean;
}

export interface UserItem {
  _id: string;
  email?: string;
  mobile?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Save Google Place to backend locations collection
 * POST /api/locations/save-place
 */
export async function savePlaceLocationApi(payload: SavePlacePayload) {
  const res = await apiClient.post<ApiResponse<LocationItem>>("/locations/save-place", payload);
  return res.data;
}

/**
 * Upload Image File
 * POST /api/images
 */
export async function uploadImageApi(file: File, folder = "property", subFolder = "image") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("subFolder", subFolder);

  const res = await apiClient.post<ApiResponse<{ _id: string; url: string; key?: string }>>("/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

/**
 * Upload Video File
 * POST /api/videos
 */
export async function uploadVideoApi(file: File, folder = "property", subFolder = "video") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("subFolder", subFolder);

  const res = await apiClient.post<ApiResponse<{ _id: string; url: string; key?: string }>>("/videos", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

/**
 * Delete Image Document & File
 * DELETE /api/images/:id
 */
export async function deleteImageApi(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`/images/${id}`);
  return res.data;
}

/**
 * Delete Video Document & File
 * DELETE /api/videos/:id
 */
export async function deleteVideoApi(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`/videos/${id}`);
  return res.data;
}

/**
 * Create Property Listing
 * POST /api/properties
 */
export async function createPropertyApi(payload: any) {
  const res = await apiClient.post<ApiResponse<PropertyListingItem>>("/properties", payload);
  return res.data;
}

/**
 * Create Flatmate Requirement Listing
 * POST /api/flatmate-requirements
 */
export async function createFlatmateRequirementApi(payload: any) {
  const res = await apiClient.post<ApiResponse<FlatmateRequirementItem>>("/flatmate-requirements", payload);
  return res.data;
}

/**
 * Search Users by query
 * GET /api/users
 */
export async function fetchUsersApi(params?: { search?: string; limit?: number }) {
  const res = await apiClient.get<ApiResponse<{ users: UserItem[] }>>("/users", { params });
  return res.data;
}

export interface PropertyAmenityItem {
  _id: string;
  name: string;
  image?: any;
  category?: string;
  isActive?: boolean;
}

/**
 * Fetch Property Amenities
 * GET /api/property-amenities
 */
export async function fetchPropertyAmenitiesApi(params?: { category?: string; page?: number; limit?: number; search?: string }) {
  const res = await apiClient.get<ApiResponse<{ items: PropertyAmenityItem[]; total: number }>>("/property-amenities", { params });
  return res.data;
}

export interface UserPreferenceItem {
  _id: string;
  name: string;
  category?: string;
  image?: any;
  isActive?: boolean;
}

/**
 * Fetch Lifestyle User Preferences
 * GET /api/user-preferences
 */
export async function fetchUserPreferencesApi(params?: { category?: string; page?: number; limit?: number; search?: string }) {
  const res = await apiClient.get<ApiResponse<{ items: UserPreferenceItem[]; total: number }>>("/user-preferences", { params });
  return res.data;
}

/**
 * Delete Property Listing
 * DELETE /api/properties/:id
 */
export async function deletePropertyApi(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`/properties/${id}`);
  return res.data;
}

/**
 * Delete Flatmate Requirement Listing
 * DELETE /api/flatmate-requirements/:id
 */
export async function deleteFlatmateRequirementApi(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`/flatmate-requirements/${id}`);
  return res.data;
}

/**
 * Update Property Listing
 * PUT /api/properties/:id
 */
export async function updatePropertyApi(id: string, payload: any) {
  const res = await apiClient.put<ApiResponse<PropertyListingItem>>(`/properties/${id}`, payload);
  return res.data;
}

/**
 * Update Flatmate Requirement Listing
 * PUT /api/flatmate-requirements/:id
 */
export async function updateFlatmateRequirementApi(id: string, payload: any) {
  const res = await apiClient.put<ApiResponse<FlatmateRequirementItem>>(`/flatmate-requirements/${id}`, payload);
  return res.data;
}




