/**
 * API Client Service for Flatmate Admin Panel
 * Interacts with backend Express APIs
 */

const getBaseServerUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
};

const API_BASE_URL = `${getBaseServerUrl()}/api`;

export interface UserItem {
  _id: string;
  email?: string;
  mobile?: string;
  userType?: "owner" | "flatmate" | "agent" | "builder";
  role?: string;
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
  deletedBy?: string;
  deactiveAt?: string;
  deactiveBy?: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  profileCompletion?: number;
  image?: UserProfileImage | null;
  avatar?: any;
  photoUrl?: string | null;
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
  avatar?: any;
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

export interface ListingStatusCounts {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
  closed: number;
  expired: number;
  total: number;
  totalFavorites: number;
}

export interface DashboardMonthlyTrendItem {
  month: string;
  year: number;
  monthNumber: number;
  count: number;
}

export interface DashboardListingTrendItem {
  month: string;
  year: number;
  monthNumber: number;
  properties: number;
  flatmates: number;
  totalListings: number;
}

export interface DashboardStatusDistributionItem {
  status: string;
  label: string;
  count: number;
}

export interface DashboardPendingListingItem {
  _id: string;
  title: string;
  slug: string;
  listingType: "property" | "flatmate_requirement";
  rent: number;
  createdAt: string;
  userId?: { email?: string; mobile?: string };
  location?: { name?: string; city?: string };
}

export interface DashboardRecentUserItem {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  userType?: "owner" | "flatmate" | "agent" | "builder";
  accountStatus: string;
  verificationStatus: string;
  profileVerified: boolean;
  image?: string | null;
  avatar?: string | null;
  avatarName?: string;
  createdAt: string;
}

export interface DashboardRecentReportItem {
  _id: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
  userId?: { email?: string; mobile?: string };
}

export interface DashboardRecentReviewItem {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  reviewerId?: { email?: string; mobile?: string };
}

export interface SuperAdminDashboardData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    deletedUsers: number;
    verifiedUsers: number;
    pendingVerifications: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    superAdmins: number;
    regularAdmins: number;
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    rejectedListings: number;
    newListingsToday: number;
    newListingsThisMonth: number;
    pendingModerationCount: number;
  };
  breakdown: {
    users: {
      total: number;
      active: number;
      inactive: number;
      deleted: number;
      verified: number;
      pendingVerification: number;
    };
    admins: {
      total: number;
      active: number;
      inactive: number;
      superAdminCount: number;
      regularAdminCount: number;
    };
    listings: {
      combined: ListingStatusCounts;
      property: ListingStatusCounts & { byType: Record<string, number> };
      flatmate: ListingStatusCounts & { byPostType: Record<string, number> };
    };
    moderation: {
      listingReports: { pending: number; reviewed: number; resolved: number; dismissed: number; total: number };
      chatReports: { pending: number; reviewed: number; resolved: number; rejected: number; total: number };
      reviews: { pending: number; published: number; hidden: number; rejected: number; total: number; averageRating: number };
    };
    platformMasters: {
      cities: { total: number; active: number };
      blogs: { total: number; active: number };
      faqs: { total: number };
      rentalGuides: { total: number };
      amenities: { active: number };
      preferences: { active: number };
    };
  };
  charts: {
    userRegistrationTrend: DashboardMonthlyTrendItem[];
    listingCreationTrend: DashboardListingTrendItem[];
    listingStatusDistribution: DashboardStatusDistributionItem[];
  };
  recentActivity: {
    pendingModerationListings: DashboardPendingListingItem[];
    recentUsers: DashboardRecentUserItem[];
    recentReports: DashboardRecentReportItem[];
  };
  revenue: {
    supported: boolean;
    message: string;
  };
}

export interface AdminDashboardData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    deletedUsers: number;
    verifiedUsers: number;
    pendingVerifications: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    rejectedListings: number;
    expiredListings: number;
    newListingsToday: number;
    newListingsThisMonth: number;
    pendingListingReports: number;
    pendingChatReports: number;
    pendingReviews: number;
    totalPendingWorkload: number;
  };
  breakdown: {
    users: {
      total: number;
      active: number;
      inactive: number;
      deleted: number;
      verified: number;
      pendingVerification: number;
    };
    listings: {
      combined: ListingStatusCounts;
      property: ListingStatusCounts & { byType: Record<string, number> };
      flatmate: ListingStatusCounts & { byPostType: Record<string, number> };
    };
    workload: {
      pendingListings: number;
      pendingListingReports: number;
      pendingChatReports: number;
      pendingReviews: number;
      totalPendingWorkload: number;
    };
  };
  charts: {
    userRegistrationTrend: DashboardMonthlyTrendItem[];
    listingCreationTrend: DashboardListingTrendItem[];
    listingStatusDistribution: DashboardStatusDistributionItem[];
  };
  recentActivity: {
    pendingModerationListings: DashboardPendingListingItem[];
    pendingReports: DashboardRecentReportItem[];
    pendingReviews: DashboardRecentReviewItem[];
    recentUsers: DashboardRecentUserItem[];
  };
  revenue?: {
    supported: boolean;
    message: string;
  };
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

export async function getSuperAdminDashboardStats() {
  return apiFetch<SuperAdminDashboardData>("/dashboard/super-admin");
}

export async function getAdminDashboardStats() {
  return apiFetch<AdminDashboardData>("/dashboard/admin");
}

// ==========================================
// User Management Services (Admin Side)
// ==========================================

export async function fetchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  accountStatus?: string;
  userType?: string;
  isDeleted?: boolean | string;
  sortBy?: string;
  order?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.accountStatus && params.accountStatus !== "all") query.append("accountStatus", params.accountStatus);
  if (params.userType && params.userType !== "all") query.append("userType", params.userType);
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
  payload: {
    accountStatus?: string;
    profileVerified?: boolean;
    verificationStatus?: string;
    userType?: "owner" | "flatmate" | "agent" | "builder";
  }
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

export async function softDeleteUser(userId: string) {
  return apiFetch(`/users/${userId}`, { method: "DELETE" });
}

export async function hardDeleteUser(userId: string) {
  return apiFetch(`/users/${userId}/hard`, { method: "DELETE" });
}

export async function restoreUser(userId: string) {
  return apiFetch(`/users/${userId}/restore`, { method: "PATCH" });
}

export async function createUserApi(payload: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  userType?: "owner" | "flatmate" | "agent" | "builder";
}) {
  return apiFetch<UserItem>("/users", {
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
  isDeleted?: boolean | string;
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

export async function softDeleteAdmin(adminId: string) {
  return apiFetch(`/admin/admins/${adminId}`, { method: "DELETE" });
}

export async function hardDeleteAdmin(adminId: string) {
  return apiFetch(`/admin/admins/${adminId}/hard`, { method: "DELETE" });
}

export async function restoreAdmin(adminId: string) {
  return apiFetch(`/admin/admins/${adminId}/restore`, { method: "PATCH" });
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
  name: string;
  image?: UserPreferenceImage | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchUserPreferences(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/user-preferences?${queryString}` : "/user-preferences";

  return apiFetch<{ items: UserPreferenceItem[]; total: number; page: number; limit: number }>(endpoint);
}

export async function createUserPreference(payload: FormData | { name: string; image?: any; isActive?: boolean }) {
  return apiFetch<UserPreferenceItem>("/user-preferences", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updateUserPreference(id: string, payload: FormData | { name?: string; image?: any; isActive?: boolean }) {
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
// Avatar Master Services (Admin Side)
// ==========================================

export interface AvatarImage {
  url: string;
  key: string;
}

export interface AvatarItem {
  _id: string;
  name: string;
  image: AvatarImage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAvatars(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/avatars?${queryString}` : "/avatars";

  return apiFetch<{ items: AvatarItem[]; total: number; page: number; limit: number; totalPages?: number }>(endpoint);
}

export async function createAvatarApi(payload: FormData | { name: string; image?: any; isActive?: boolean }) {
  return apiFetch<AvatarItem>("/avatars", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function updateAvatarApi(id: string, payload: FormData | { name?: string; image?: any; isActive?: boolean }) {
  return apiFetch<AvatarItem>(`/avatars/${id}`, {
    method: "PUT",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export async function toggleAvatarStatusApi(id: string, isActive: boolean) {
  return apiFetch<AvatarItem>(`/avatars/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteAvatarApi(id: string) {
  return apiFetch(`/avatars/${id}`, { method: "DELETE" });
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPropertyAmenities(params?: { page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);

  const queryString = query.toString();
  const endpoint = queryString ? `/property-amenities?${queryString}` : "/property-amenities";

  return apiFetch<{ items: PropertyAmenityItem[]; total: number; page: number; limit: number; totalPages?: number }>(endpoint);
}

export async function createPropertyAmenityApi(payload: FormData | {
  name: string;
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

export type PropertyType =
  | "flat_apartment"
  | "house"
  | "villa";

export type PropertyCategory = PropertyType;

export interface PropertyListingType {
  category: PropertyType;
}

export type FacingDirection =
  | "east"
  | "west"
  | "north"
  | "south"
  | "north_east"
  | "north_west"
  | "south_east"
  | "south_west";

export type BedroomConfiguration =
  | "1_rk"
  | "1_bhk"
  | "2_bhk"
  | "3_bhk"
  | "4_bhk"
  | "5_bhk"
  | "5_plus_bhk";

export interface PropertyDetails {
  floor?: number;
  totalFloors?: number;
  facing?: FacingDirection;
  bedrooms?: BedroomConfiguration;
}

export interface BrokerageDetails {
  applicable: boolean;
  type?: "fixed" | "percentage";
  value?: number;
}

export type PropertyPostedBy = "owner" | "flatmate" | "agent" | "builder";
export type FlatmatePostedBy = "owner" | "flatmate";
export type FlatmatePropertyType = "room" | "flat" | "pg" | "shared_apartment";

export type LegacyPropertyType = "flat" | "room" | "pg" | "shared_apartment" | "entire_property";
export type FurnishingType = "fully_furnished" | "semi_furnished" | "unfurnished";
export type GenderPreference = "male" | "female" | "other" | "any";
export type TenantPreference = "anyone" | "bachelors" | "family";
export type OccupancyPreference = "any" | "single" | "shared";
export type OccupationPreference = "student" | "working_professional" | "self_employed" | "business_owner" | "freelancer" | "other" | "any";
export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "blocked" | "closed" | "expired";

export interface PropertyItem {
  _id: string;
  userId?: any;
  ownerId?: any;
  title: string;
  slug: string;
  description: string;
  propertyType?: PropertyType | string;
  listingType?: PropertyType | string;
  propertyDetails?: PropertyDetails;
  brokerage?: boolean;
  brokerageDetails?: BrokerageDetails;
  postedBy?: PropertyPostedBy;
  location?: any;
  rent: number;
  securityDeposit?: number;
  maintenanceCharges?: {
    amount: number;
    frequency: string;
  };
  furnishing?: FurnishingType;
  parking?: boolean;
  availableFrom?: string;
  tenantPreference?: TenantPreference;
  genderPreference?: GenderPreference;
  occupationPreference?: OccupationPreference;
  area?: number;
  amenities?: Array<string | { _id?: string; name?: string; category?: string; image?: any }>;
  images?: PropertyMediaItem[];
  videos?: PropertyMediaItem[];
  status: ListingStatus;
  rejectionReason?: string;
  favoriteCount?: number;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchProperties(params?: {
  status?: string;
  propertyType?: string;
  listingType?: string;
  furnishing?: string;
  location?: string;
  userId?: string;
  ownerId?: string;
  genderPreference?: string;
  occupationPreference?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.append("status", params.status);
  const pType = params?.propertyType || params?.listingType;
  if (pType && pType !== "all") query.append("propertyType", pType);
  if (params?.furnishing && params.furnishing !== "all") query.append("furnishing", params.furnishing);
  if (params?.location && params.location !== "all") query.append("location", params.location);
  const uId = params?.userId || params?.ownerId;
  if (uId && uId !== "all") query.append("userId", uId);
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

export interface BulkStatusUpdateItemResult {
  id: string;
  title?: string;
  status: "updated" | "skipped" | "not_found";
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
}

export interface BulkStatusUpdateResponse {
  targetStatus: string;
  totalRequested: number;
  updatedCount: number;
  skippedCount: number;
  notFoundCount: number;
  results: BulkStatusUpdateItemResult[];
}

export async function bulkUpdatePropertyStatusApi(
  ids: string[],
  status: string,
  rejectionReason?: string
) {
  return apiFetch<BulkStatusUpdateResponse>("/properties/bulk-status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status, rejectionReason }),
  });
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
    userType?: string;
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

  genderPreference?: GenderPreference;
  occupancyPreference?: OccupancyPreference;

  occupationPreference?: OccupationPreference;

  userPreferences?: Array<
    | string
    | {
      _id?: string;
      name?: string;
      category?: string;
      image?: any;
    }
  >;

  amenities?: Array<
    | string
    | {
      _id?: string;
      name?: string;
      category?: string;
      image?: any;
    }
  >;

  images?: FlatmateRequirementMediaItem[];

  videos?: FlatmateRequirementMediaItem[];

  propertyDetails?: PropertyDetails;
  postedBy?: FlatmatePostedBy;

  status: ListingStatus;
  rejectionReason?: string;
  favoriteCount?: number;

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

export async function bulkUpdateFlatmateRequirementStatusApi(
  ids: string[],
  status: string,
  rejectionReason?: string
) {
  return apiFetch<BulkStatusUpdateResponse>("/flatmate-requirements/bulk-status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status, rejectionReason }),
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
    userType?: string;
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

// ==========================================
// Admin Notification Services
// ==========================================
import type {
  INotificationItem,
  INotificationPreferences,
  GetNotificationsFilters,
  GetNotificationsResponseData,
  UpdateNotificationPreferencesPayload,
} from "@/types/notification.types";

export * from "@/types/notification.types";

export async function fetchAdminNotifications(filters: GetNotificationsFilters = {}) {
  const query = new URLSearchParams();
  if (filters.page) query.append("page", filters.page.toString());
  if (filters.limit) query.append("limit", filters.limit.toString());
  if (filters.category) query.append("category", filters.category);
  if (filters.eventType) query.append("eventType", filters.eventType);
  if (filters.priority) query.append("priority", filters.priority);
  if (typeof filters.isRead === "boolean") query.append("isRead", filters.isRead.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/notifications?${queryString}` : "/notifications";

  return apiFetch<GetNotificationsResponseData>(endpoint);
}

export async function fetchAdminUnreadCount() {
  return apiFetch<{ unreadCount: number }>("/notifications/unread-count");
}

export async function markAdminNotificationAsRead(notificationId: string) {
  return apiFetch<INotificationItem>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllAdminNotificationsAsRead() {
  return apiFetch<{ updatedCount: number; readAt: string }>("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function deleteAdminNotification(notificationId: string) {
  return apiFetch(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

export async function fetchAdminNotificationPreferences() {
  return apiFetch<INotificationPreferences>("/notifications/preferences");
}

export async function updateAdminNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload
) {
  return apiFetch<INotificationPreferences>("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}