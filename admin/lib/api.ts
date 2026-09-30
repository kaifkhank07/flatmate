/**
 * API Client Service for Flatmate Admin Panel
 * Interacts with backend Express APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface UserItem {
  _id: string;
  email?: string;
  mobile?: string;
  role: "user";
  accountStatus: "active" | "inactive";
  emailVerified: boolean;
  mobileVerified: boolean;
  profileVerified: boolean;
  verificationStatus: "not_submitted" | "pending" | "approved" | "rejected";
  lastLoginAt?: string;
  lastActiveAt?: string;
  isOnline: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  profileCompletion?: number;
  image?: UserProfileImage | null;
  profile?: UserProfileItem | null;
}

export interface UserProfileImage {
  url?: string;
  key?: string;
}

export interface UserProfileItem {
  _id?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "any";
  occupation?:
  | "student"
  | "working_professional"
  | "self_employed"
  | "business_owner"
  | "freelancer"
  | "other"
  | string;
  languagesKnown?: string[];
  aboutMe?: string;
  image?: UserProfileImage;
  preferences?: Array<UserPreferenceItem | string>;
  profileCompletion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminItem {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive";
  lastLoginAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStatsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers?: number;
  blockedUsers?: number;
  pendingUsers?: number;
  deletedUsers: number;
  verifiedUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  totalAdmins: number;
}

// Token & Admin Data Helpers
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_access_token");
};

export const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_access_token", token);
  }
};

export const removeStoredToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user_data");
  }
};

export const getStoredAdminUser = (): AdminItem | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("admin_user_data");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredAdminUser = (admin: AdminItem): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_user_data", JSON.stringify(admin));
  }
};

// Generic fetch handler
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; message?: string; data?: T; errors?: any }> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401 && endpoint !== "/admin/auth/login") {
        removeStoredToken();
      }
      return {
        success: false,
        message: json.message || "An error occurred",
        errors: json.errors,
      };
    }

    return json;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error. Please check backend server.",
    };
  }
}

// ==========================================
// Admin Auth Services
// ==========================================

export async function adminLogin(email: string, password: string) {
  const res = await apiFetch<{ admin: AdminItem; accessToken: string; refreshToken: string }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (res.success && res.data) {
    setStoredToken(res.data.accessToken);
    setStoredAdminUser(res.data.admin);
  }

  return res;
}

export async function getAdminProfile() {
  return apiFetch<AdminItem>("/admin/auth/me");
}

export async function adminLogout() {
  const res = await apiFetch("/admin/auth/logout", { method: "POST" });
  removeStoredToken();
  return res;
}

export async function getDashboardStats() {
  return apiFetch<DashboardStatsData>("/admin/dashboard/stats");
}

// ==========================================
// User Management Services (Admin Side)
// ==========================================

export async function fetchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  accountStatus?: string;
  isDeleted?: boolean;
  sortBy?: string;
  order?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.accountStatus && params.accountStatus !== "all") query.append("accountStatus", params.accountStatus);
  if (params.isDeleted !== undefined) query.append("isDeleted", params.isDeleted.toString());
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.order) query.append("order", params.order);

  return apiFetch<{ users: UserItem[]; pagination: PaginationMeta }>(`/users?${query.toString()}`);
}

export async function fetchUserDetails(userId: string) {
  return apiFetch<{
    user: UserItem;
    profile: UserProfileItem | null;
    sessionsSummary: { activeSessionsCount: number };
  }>(`/users/${userId}`);
}

export async function fetchUserProfileByAdmin(userId: string) {
  return apiFetch<{ user: UserItem; profile: UserProfileItem }>(`/users/${userId}/profile`);
}

export async function updateUserProfileByAdmin(
  userId: string,
  payload:
    | FormData
    | {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string | null;
      gender?: string;
      occupation?: string;
      languagesKnown?: string[];
      aboutMe?: string;
      preferences?: string[];
      image?: { url?: string; key?: string } | null;
      removeImage?: boolean;
    }
) {
  return apiFetch<{ user: UserItem; profile: UserProfileItem }>(`/users/${userId}/profile`, {
    method: "PUT",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updateUserStatus(
  userId: string,
  payload: { accountStatus?: string; profileVerified?: boolean; verificationStatus?: string }
) {
  return apiFetch<UserItem>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function blockUser(userId: string) {
  return apiFetch(`/users/${userId}/block`, { method: "PATCH" });
}

export async function unblockUser(userId: string) {
  return apiFetch(`/users/${userId}/unblock`, { method: "PATCH" });
}

export async function deleteUser(userId: string) {
  return apiFetch(`/users/${userId}`, { method: "DELETE" });
}

export async function restoreUser(userId: string) {
  return apiFetch(`/users/${userId}/restore`, { method: "PATCH" });
}

export async function createUserApi(payload: { email?: string; mobile?: string; password?: string }) {
  return apiFetch<UserItem>("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ==========================================
// Admin Staff Management Services (Super Admin)
// ==========================================

export async function fetchAdmins(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  isDeleted?: boolean;
  sortBy?: string;
  order?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.role && params.role !== "all") query.append("role", params.role);
  if (params?.isDeleted !== undefined) query.append("isDeleted", params.isDeleted.toString());
  if (params?.sortBy) query.append("sortBy", params.sortBy);
  if (params?.order) query.append("order", params.order);

  const queryString = query.toString();
  const endpoint = queryString ? `/admin/admins?${queryString}` : "/admin/admins";

  return apiFetch<{ admins: AdminItem[]; pagination: PaginationMeta }>(endpoint);
}

export async function createAdmin(payload: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "super_admin";
}) {
  return apiFetch<AdminItem>("/admin/admins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdmin(
  adminId: string,
  payload: { name?: string; role?: "admin" | "super_admin"; status?: "active" | "inactive" }
) {
  return apiFetch<AdminItem>(`/admin/admins/${adminId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Activate an admin account
export async function activateAdmin(adminId: string) {
  return apiFetch<AdminItem>(`/admin/admins/${adminId}/activate`, { method: "PATCH" });
}

// Deactivate an admin account
export async function deactivateAdmin(adminId: string) {
  return apiFetch<AdminItem>(`/admin/admins/${adminId}/deactivate`, { method: "PATCH" });
}

export async function deleteAdmin(adminId: string) {
  return apiFetch(`/admin/admins/${adminId}`, { method: "DELETE" });
}

// ==========================================
// User Preference Option Services (Admin Side)
// ==========================================

export interface UserPreferenceImage {
  url?: string;
  key?: string;
}

export interface UserPreferenceItem {
  _id: string;
  category: "food" | "pets" | "drink";
  name: string;
  image?: UserPreferenceImage | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchUserPreferences(params?: { category?: string; status?: string; search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") query.append("category", params.category);
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/user-preferences?${queryString}` : "/user-preferences";

  return apiFetch<{ items: UserPreferenceItem[]; total: number; page: number; limit: number }>(endpoint);
}

export async function createUserPreference(payload: FormData | { category: "food" | "pets" | "drink"; name: string; image?: any; isActive?: boolean }) {
  return apiFetch<UserPreferenceItem>("/user-preferences", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updateUserPreference(id: string, payload: FormData | { category?: "food" | "pets" | "drink"; name?: string; image?: any; isActive?: boolean }) {
  return apiFetch<UserPreferenceItem>(`/user-preferences/${id}`, {
    method: "PUT",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function toggleUserPreferenceStatus(id: string) {
  return apiFetch<UserPreferenceItem>(`/user-preferences/${id}/status`, {
    method: "PATCH",
  });
}

export async function deleteUserPreference(id: string) {
  return apiFetch(`/user-preferences/${id}`, { method: "DELETE" });
}

// ==========================================
// City Management Services (Admin Side)
// ==========================================

export interface CityImage {
  url?: string;
  key?: string;
}

export interface CitySEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface CityItem {
  _id: string;
  name: string;
  slug: string;
  image?: CityImage;
  state: string;
  country: string;
  isPopular: boolean;
  isActive: boolean;
  seo?: CitySEO;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCities(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isPopular?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.isActive !== undefined) query.append("isActive", params.isActive.toString());
  if (params?.isPopular !== undefined) query.append("isPopular", params.isPopular.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/cities?${queryString}` : "/cities";

  return apiFetch<{ items: CityItem[]; total: number; page: number; limit: number; totalPages?: number }>(endpoint);
}

export async function createCityApi(
  payload: FormData | {
    name: string;
    state: string;
    slug?: string;
    country?: string;
    isPopular?: boolean;
    isActive?: boolean;
    seo?: CitySEO;
  }
) {
  return apiFetch<CityItem>("/cities", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updateCityApi(
  cityId: string,
  payload: FormData | Partial<CityItem>
) {
  return apiFetch<CityItem>(`/cities/${cityId}`, {
    method: "PUT",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function toggleCityStatusApi(cityId: string, isActive: boolean) {
  return apiFetch<CityItem>(`/cities/${cityId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteCityApi(cityId: string) {
  return apiFetch(`/cities/${cityId}`, { method: "DELETE" });
}

export interface SkippedCityRow {
  rowNumber: number;
  name?: string;
  state?: string;
  country?: string;
  isPopular?: boolean | string;
  isActive?: boolean | string;
  slug?: string;
  reason: string;
}

export interface CityImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  skippedRows: SkippedCityRow[];
}

export async function importCitiesApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<CityImportResult>("/cities/import", {
    method: "POST",
    body: formData,
  });
}


// ==========================================
// Property Amenity Services (Admin Side)
// ==========================================

export interface AmenityImage {
  url?: string;
  key?: string;
}

export interface PropertyAmenityItem {
  _id: string;
  name: string;
  image?: AmenityImage | string;
  category: "basic" | "security" | "parking" | "fitness" | "recreation" | "utilities" | "other";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPropertyAmenities(params?: { category?: string; page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") query.append("category", params.category);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);

  const queryString = query.toString();
  const endpoint = queryString ? `/property-amenities?${queryString}` : "/property-amenities";

  return apiFetch<{ items: PropertyAmenityItem[]; total: number; page: number; limit: number; totalPages?: number }>(endpoint);
}

export async function createPropertyAmenityApi(payload: FormData | {
  name: string;
  category: "basic" | "security" | "parking" | "fitness" | "recreation" | "utilities" | "other";
  image?: any;
  isActive?: boolean;
}) {
  return apiFetch<PropertyAmenityItem>("/property-amenities", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updatePropertyAmenityApi(
  id: string,
  payload: FormData | {
    name?: string;
    category?: "basic" | "security" | "parking" | "fitness" | "recreation" | "utilities" | "other";
    image?: any;
    isActive?: boolean;
  }
) {
  return apiFetch<PropertyAmenityItem>(`/property-amenities/${id}`, {
    method: "PUT",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function togglePropertyAmenityStatusApi(id: string, isActive: boolean) {
  return apiFetch<PropertyAmenityItem>(`/property-amenities/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deletePropertyAmenityApi(id: string) {
  return apiFetch(`/property-amenities/${id}`, { method: "DELETE" });
}

// ==========================================
// Property Management Services (Admin Side)
// ==========================================

export interface PropertyMediaItem {
  _id: string;
  url?: string;
  key?: string;
  createdAt?: string;
}

export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "blocked" | "closed" | "expired";

export interface PropertyItem {
  _id: string;
  ownerId: any;
  title: string;
  slug: string;
  description: string;
  listingType: any;
  location?: any;
  rent: {
    amount: number;
    currency: string;
  };
  securityDeposit?: number;
  maintenanceCharges?: {
    amount: number;
    frequency: string;
  };
  furnishing?: any;
  availableFrom?: string;
  availableUntil?: string;
  genderPreference?: any;
  occupationPreference?: any;
  parking?: any;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floors?: number;
  totalFloors?: number;
  preferredTenants?: any;
  propertyType?: any;
  ageOfProperty?: any;
  facing?: any;
  totalArea?: number;
  carpetArea?: number;
  builtUpArea?: number;
  area?: {
    value: number;
    unit: "sqft" | "sqm";
  };
  amenities?: Array<string | { _id?: string; name?: string; category?: string; image?: any }>;
  images?: PropertyMediaItem[];
  videos?: PropertyMediaItem[];
  status: ListingStatus;
  rejectionReason?: string;
  favoriteCount?: number;
  expiresAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchProperties(params?: {
  status?: string;
  listingType?: string;
  furnishing?: string;
  location?: string;
  ownerId?: string;
  genderPreference?: string;
  occupationPreference?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.listingType && params.listingType !== "all") query.append("listingType", params.listingType);
  if (params?.furnishing && params.furnishing !== "all") query.append("furnishing", params.furnishing);
  if (params?.location && params.location !== "all") query.append("location", params.location);
  if (params?.ownerId && params.ownerId !== "all") query.append("ownerId", params.ownerId);
  if (params?.genderPreference && params.genderPreference !== "all") query.append("genderPreference", params.genderPreference);
  if (params?.occupationPreference && params.occupationPreference !== "all") query.append("occupationPreference", params.occupationPreference);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/properties?${queryString}` : "/properties";

  return apiFetch<{ items: PropertyItem[]; total: number; page: number; limit: number; totalPages: number }>(endpoint);
}

export async function fetchPropertyById(id: string) {
  return apiFetch<PropertyItem>(`/properties/${id}`);
}

export async function createPropertyApi(payload: any) {
  return apiFetch<PropertyItem>("/properties", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePropertyApi(id: string, payload: any) {
  return apiFetch<PropertyItem>(`/properties/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updatePropertyStatusApi(id: string, status: string, rejectionReason?: string) {
  return apiFetch<PropertyItem>(`/properties/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason }),
  });
}

export async function approvePropertyApi(id: string) {
  return apiFetch<PropertyItem>(`/properties/${id}/approve`, {
    method: "PATCH",
  });
}

export async function rejectPropertyApi(id: string, rejectionReason: string) {
  return apiFetch<PropertyItem>(`/properties/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
}


export async function deletePropertyApi(id: string) {
  return apiFetch(`/properties/${id}`, { method: "DELETE" });
}

// ==========================================
// Flatmate Requirement Management Services
// ==========================================

export interface FlatmateRequirementMediaItem {
  _id: string;
  url?: string;
  key?: string;
  createdAt?: string;
}

export interface FlatmateRequirementLocation {
  _id?: string;
  name?: string;
  formattedAddress?: string;
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
  latitude?: number;
  longitude?: number;
  placeId?: string;
  googleMaps?: {
    placeId?: string;
    mapsUrl?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface FlatmateRequirementItem {
  _id: string;

  userId?:
  | string
  | {
    _id?: string;
    email?: string;
    mobile?: string;
    role?: string;
    profileVerified?: boolean;
    accountStatus?: string;
  };

  title: string;
  slug: string;
  description?: string;

  postType: "property" | "partner";

  propertyType?: "room" | "flat" | "pg" | "shared_apartment";

  partnerType?: "roommate" | "flatmate";

  location?:
  | string
  | FlatmateRequirementLocation;

  budget: {
    min: number;
    max: number;
  };

  occupationPreference:
  | "student"
  | "working_professional"
  | "self_employed"
  | "business_owner"
  | "freelancer"
  | "any";

  genderPreference: "male" | "female" | "any";

  lifestylePreferences?: Array<
    | string
    | {
      _id?: string;
      name?: string;
      category?: string;
      image?: any;
    }
  >;

  moveInDate: string;

  peopleCount?: number;

  images?: FlatmateRequirementMediaItem[];

  videos?: FlatmateRequirementMediaItem[];

  expiresAt?: string;

  status: ListingStatus;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

export async function fetchFlatmateRequirements(params?: {
  status?: string;
  postType?: string;
  propertyType?: string;
  partnerType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.postType && params.postType !== "all") query.append("postType", params.postType);
  if (params?.propertyType && params.propertyType !== "all") query.append("propertyType", params.propertyType);
  if (params?.partnerType && params.partnerType !== "all") query.append("partnerType", params.partnerType);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/flatmate-requirements/admin/all?${queryString}` : "/flatmate-requirements/admin/all";

  return apiFetch<{ items: FlatmateRequirementItem[]; total: number; page: number; limit: number; totalPages: number }>(endpoint);
}

export async function fetchFlatmateRequirementById(requirementId: string) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/${requirementId}`);
}

export async function createFlatmateRequirementApi(payload: any) {
  return apiFetch<FlatmateRequirementItem>("/flatmate-requirements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFlatmateRequirementApi(requirementId: string, payload: any) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/${requirementId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateFlatmateRequirementStatusApi(requirementId: string, status: string, rejectionReason?: string) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/admin/${requirementId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason }),
  });
}

export async function deleteFlatmateRequirementApi(requirementId: string) {
  return apiFetch(`/flatmate-requirements/${requirementId}`, { method: "DELETE" });
}

export async function addImageToFlatmateRequirementApi(requirementId: string, imageId: string) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/${requirementId}/images`, {
    method: "POST",
    body: JSON.stringify({ imageId }),
  });
}

export async function removeImageFromFlatmateRequirementApi(requirementId: string, imageId: string) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/${requirementId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function addVideoToFlatmateRequirementApi(requirementId: string, videoId: string) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/${requirementId}/videos`, {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });
}

export async function removeVideoFromFlatmateRequirementApi(requirementId: string, videoId: string) {
  return apiFetch<FlatmateRequirementItem>(`/flatmate-requirements/${requirementId}/videos/${videoId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Location Management Services
// ==========================================

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

export async function savePlaceLocationApi(payload: SavePlacePayload) {
  return apiFetch<LocationItem>("/locations/save-place", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ==========================================
// Generic Media Upload APIs
// ==========================================

export async function uploadImageApi(file: File, folder?: string, subFolder?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  if (subFolder) formData.append("subFolder", subFolder);
  return apiFetch<PropertyMediaItem>("/images", {
    method: "POST",
    body: formData,
  });
}

export async function uploadVideoApi(file: File, folder?: string, subFolder?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  if (subFolder) formData.append("subFolder", subFolder);
  return apiFetch<PropertyMediaItem>("/videos", {
    method: "POST",
    body: formData,
  });
}

export async function deleteImageApi(id: string) {
  return apiFetch(`/images/${id}`, { method: "DELETE" });
}

export async function deleteVideoApi(id: string) {
  return apiFetch(`/videos/${id}`, { method: "DELETE" });
}

/* ==========================================*/
// Report Management Services (Admin Side)
// ==========================================

export interface ReportTargetInfo {
  _id: string;
  title?: string;
  slug?: string;
  status?: string;
  location?: any;
  ownerId?: any;
  userId?: any;
  images?: any;
}

export interface ReportLatest {
  _id: string;
  userId: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportGroupItem {
  targetId: string;
  targetType: string;
  reportCount: number;
  title?: string;
  slug?: string;
  targetStatus?: string;
  target: ReportTargetInfo | null;
  latestReport: ReportLatest;
  status: string;
  createdAt: string;
  updatedAt: string;
  reportIds: string[];
}

export interface SingleReportItem {
  _id: string;
  targetId: string;
  targetType: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
    mobile?: string;
    role?: string;
    accountStatus?: string;
  } | string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed" | string;
  resolutionNotes?: string;
  resolvedBy?: any;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchReports(params?: {
  page?: number;
  limit?: number;
  targetType?: string;
  status?: string;
  userId?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.targetType && params.targetType !== 'all') query.append('targetType', params.targetType);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.userId) query.append('userId', params.userId);
  if (params?.search) query.append('search', params.search);
  const endpoint = query.toString() ? `/reports?${query.toString()}` : '/reports';
  return apiFetch<{ items: ReportGroupItem[]; total: number; page: number; limit: number; totalPages: number }>(endpoint);
}

export async function fetchReportById(reportId: string) {
  return apiFetch<any>(`/reports/${reportId}`);
}

export async function fetchTargetReports(targetType: string, targetId: string) {
  return apiFetch<{ reports: SingleReportItem[]; target: any }>(`/reports/target/${targetType}/${targetId}`);
}

export async function updateReportStatus(reportId: string, payload: { status: string; resolutionNotes?: string }) {
  return apiFetch<any>(`/reports/${reportId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteReport(reportId: string) {
  return apiFetch<any>(`/reports/${reportId}`, { method: 'DELETE' });
}

// ==========================================
// Review Management Services (Admin Side)
// ==========================================

export interface ReviewerInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  image?: { url?: string; key?: string } | string;
}

export interface ReviewItem {
  _id: string;
  reviewerId: ReviewerInfo | string;
  targetType: "user" | "property" | "flatmaterequirement";
  targetModel: "User" | "Property" | "FlatmateRequirement";
  targetId: string;
  rating: number;
  title?: string;
  comment?: string;
  status: "pending" | "published" | "hidden" | "rejected";
  createdAt: string;
  updatedAt: string;
  target?: any;
}

export interface ReviewRatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export async function fetchReviews(params?: {
  page?: number;
  limit?: number;
  targetType?: string;
  targetId?: string;
  rating?: number;
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.targetType && params.targetType !== "all") query.append("targetType", params.targetType);
  if (params?.targetId) query.append("targetId", params.targetId);
  if (params?.rating) query.append("rating", params.rating.toString());
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);

  const endpoint = query.toString() ? `/reviews?${query.toString()}` : "/reviews";
  return apiFetch<{
    reviews: ReviewItem[];
    pagination: PaginationMeta;
    summary?: ReviewRatingSummary;
  }>(endpoint);
}

export async function fetchReviewById(reviewId: string) {
  return apiFetch<ReviewItem>(`/reviews/${reviewId}`);
}

export async function updateReviewStatusApi(reviewId: string, status: string) {
  return apiFetch<ReviewItem>(`/reviews/admin/${reviewId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteReviewApi(reviewId: string) {
  return apiFetch<any>(`/reviews/admin/${reviewId}`, { method: "DELETE" });
}

// ==========================================
// Blog Category APIs
// ==========================================

export interface BlogCategoryItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchBlogCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.page) {
    query.append("page", params.page.toString());
  }

  if (params?.limit) {
    query.append("limit", params.limit.toString());
  }

  if (params?.search) {
    query.append("search", params.search);
  }

  if (params?.isActive !== undefined) {
    query.append(
      "isActive",
      params.isActive.toString()
    );
  }

  const queryString = query.toString();

  const endpoint = queryString
    ? `/blog-categories?${queryString}`
    : "/blog-categories";

  return apiFetch<{
    items: BlogCategoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(endpoint);
}

export async function fetchBlogCategoryById(
  categoryId: string
) {
  return apiFetch<BlogCategoryItem>(
    `/blog-categories/${categoryId}`
  );
}

export async function createBlogCategoryApi(payload: {
  name: string;
  isActive?: boolean;
}) {
  return apiFetch<BlogCategoryItem>(
    "/blog-categories",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateBlogCategoryApi(
  categoryId: string,
  payload: {
    name?: string;
    isActive?: boolean;
  }
) {
  return apiFetch<BlogCategoryItem>(
    `/blog-categories/${categoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function toggleBlogCategoryStatusApi(
  categoryId: string,
  isActive: boolean
) {
  return apiFetch<BlogCategoryItem>(
    `/blog-categories/${categoryId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        isActive,
      }),
    }
  );
}

export async function deleteBlogCategoryApi(
  categoryId: string
) {
  return apiFetch(
    `/blog-categories/${categoryId}`,
    {
      method: "DELETE",
    }
  );
}

// ==========================================
// Blog APIs
// ==========================================

export interface BlogCategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface BlogImage {
  url?: string;
  key?: string;
}

export interface BlogSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  content: string;
  categoryId: BlogCategoryRef | string;
  image?: BlogImage;
  isActive: boolean;
  seo?: BlogSeo;
  faqs?: BlogFaq[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  items: BlogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchBlogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  if (params?.search) {
    query.set("search", params.search);
  }

  if (params?.categoryId) {
    query.set("categoryId", params.categoryId);
  }

  if (params?.isActive !== undefined) {
    query.set("isActive", String(params.isActive));
  }

  const queryString = query.toString();

  return apiFetch<BlogListResponse>(
    `/blogs${queryString ? `?${queryString}` : ""}`
  );
}

export async function fetchBlogById(blogId: string) {
  return apiFetch<BlogItem>(
    `/blogs/${blogId}`
  );
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  categoryId: string;
  image?: BlogImage;
  imageFile?: File | null;
  isActive?: boolean;
  seo?: BlogSeo;
  faqs?: BlogFaq[];
}

export interface UpdateBlogPayload {
  title?: string;
  content?: string;
  categoryId?: string;
  image?: BlogImage | null;
  imageFile?: File | null;
  isActive?: boolean;
  seo?: BlogSeo;
  faqs?: BlogFaq[];
}

export async function createBlogApi(payload: CreateBlogPayload | FormData) {
  return apiFetch<BlogItem>("/blogs", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updateBlogApi(
  blogId: string,
  payload: UpdateBlogPayload | FormData
) {
  return apiFetch<BlogItem>(`/blogs/${blogId}`, {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function toggleBlogStatusApi(
  blogId: string
) {
  return apiFetch<BlogItem>(
    `/blogs/${blogId}/toggle-status`,
    {
      method: "PATCH",
    }
  );
}

export async function deleteBlogApi(
  blogId: string
) {
  return apiFetch<null>(
    `/blogs/${blogId}`,
    {
      method: "DELETE",
    }
  );
}

// ==========================================
// Admin Chat Management APIs & Types
// ==========================================

export interface ChatParticipant {
  _id: string;
  email?: string;
  mobile?: string;
  accountStatus?: string;
  profileVerified?: boolean;
  verificationStatus?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  gender?: string;
}

export interface ChatAttachment {
  url: string;
  key?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface ChatProperty {
  propertyId: string;
  title: string;
  slug: string;
  image?: string;
  rent?: number;
}

export interface ChatFlatmate {
  flatmatePostId: string;
  title: string;
  slug: string;
  image?: string;
  budget?: {
    min: number;
    max: number;
  };
}

export interface ChatMessageItem {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image" | "property" | "flatmate-post";
  text?: string;
  attachment?: ChatAttachment;
  property?: ChatProperty;
  flatmate?: ChatFlatmate;
  status: "sent" | "delivered" | "read";
  deliveredAt?: string;
  readAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationItem {
  _id: string;
  participants: ChatParticipant[];
  otherParticipant?: ChatParticipant | null;
  lastMessage?: ChatMessageItem | null;
  lastMessageAt: string;
  unreadCount?: number;
  unreadCounts?: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationFilters {
  page?: number;
  limit?: number;
  search?: string;
  user1Id?: string;
  user2Id?: string;
}

export async function fetchChatConversations(params?: ChatConversationFilters) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search.trim());
  if (params?.user1Id) queryParams.append("user1Id", params.user1Id);
  if (params?.user2Id) queryParams.append("user2Id", params.user2Id);

  const queryString = queryParams.toString();
  const url = `/admin-chats/conversations${queryString ? `?${queryString}` : ""}`;

  return apiFetch<{
    conversations: ChatConversationItem[];
    pagination: PaginationMeta;
  }>(url);
}

export async function fetchChatConversationById(conversationId: string) {
  return apiFetch<ChatConversationItem>(`/admin-chats/conversations/${conversationId}`);
}

export async function fetchChatMessages(
  conversationId: string,
  params?: {
    page?: number;
    limit?: number;
    before?: string;
  }
) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.before) queryParams.append("before", params.before);

  const queryString = queryParams.toString();
  const url = `/admin-chats/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ""}`;

  return apiFetch<{
    messages: ChatMessageItem[];
    pagination: PaginationMeta;
  }>(url);
}

// ==========================================
// FAQ APIs
// ==========================================

export type FAQPage = "home" | "property" | "flatmate" | "rental" | "contact";

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  page?: FAQPage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchFaqs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  faqPage?: string;
  isActive?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.faqPage && params.faqPage !== "all") query.append("faqPage", params.faqPage);
  if (params?.isActive !== undefined) query.append("isActive", params.isActive.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/faqs?${queryString}` : "/faqs";

  return apiFetch<{
    faqs: FAQItem[];
    pagination: PaginationMeta;
  }>(endpoint);
}

export async function fetchFaqById(faqId: string) {
  return apiFetch<FAQItem>(`/faqs/${faqId}`);
}

export async function createFaqApi(payload: {
  question: string;
  answer: string;
  page: FAQPage;
  isActive?: boolean;
}) {
  return apiFetch<FAQItem>("/faqs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFaqApi(
  faqId: string,
  payload: {
    question?: string;
    answer?: string;
    page?: FAQPage;
    isActive?: boolean;
  }
) {
  return apiFetch<FAQItem>(`/faqs/${faqId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteFaqApi(faqId: string) {
  return apiFetch(`/faqs/${faqId}`, { method: "DELETE" });
}

// ==========================================
// Rental Guide APIs
// ==========================================

export interface RentalGuideImage {
  url?: string;
  key?: string;
}

export interface RentalGuideSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface RentalGuideItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  content: string;
  image?: RentalGuideImage;
  isActive: boolean;
  seo?: RentalGuideSeo;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRentalGuides(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.isActive !== undefined) query.append("isActive", params.isActive.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/rental-guides?${queryString}` : "/rental-guides";

  return apiFetch<{
    rentalGuides: RentalGuideItem[];
    pagination: PaginationMeta;
  }>(endpoint);
}

export async function fetchRentalGuideById(rentalGuideId: string) {
  return apiFetch<RentalGuideItem>(`/rental-guides/${rentalGuideId}`);
}

export async function createRentalGuideApi(payload: {
  title: string;
  description?: string;
  content: string;
  image?: RentalGuideImage;
  isActive?: boolean;
  seo?: RentalGuideSeo;
}) {
  return apiFetch<RentalGuideItem>("/rental-guides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRentalGuideApi(
  rentalGuideId: string,
  payload: {
    title?: string;
    description?: string;
    content?: string;
    image?: RentalGuideImage | null;
    isActive?: boolean;
    seo?: RentalGuideSeo;
  }
) {
  return apiFetch<RentalGuideItem>(`/rental-guides/${rentalGuideId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRentalGuideApi(rentalGuideId: string) {
  return apiFetch(`/rental-guides/${rentalGuideId}`, { method: "DELETE" });
}