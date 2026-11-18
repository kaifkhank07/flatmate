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
  userType?: 'owner' | 'flatmate' | 'agent' | 'builder';
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
  isActive?: boolean;
}

/**
 * Fetch Property Amenities
 * GET /api/property-amenities
 */
export async function fetchPropertyAmenitiesApi(params?: { page?: number; limit?: number; search?: string }) {
  const res = await apiClient.get<ApiResponse<{ items: PropertyAmenityItem[]; total: number }>>("/property-amenities", { params });
  return res.data;
}

export interface UserPreferenceItem {
  _id: string;
  name: string;
  image?: any;
  isActive?: boolean;
}

/**
 * Fetch Lifestyle User Preferences
 * GET /api/user-preferences
 */
export async function fetchUserPreferencesApi(params?: { page?: number; limit?: number; search?: string }) {
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

export type ReportReason = 'spam' | 'fraud' | 'inappropriate' | 'misleading' | 'other';
export type ReportTargetType = 'property' | 'flatmaterequirement';

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

/**
 * Submit a Report for a Property or Flatmate Requirement
 * POST /api/reports
 */
export async function createReportApi(payload: CreateReportPayload) {
  const res = await apiClient.post<ApiResponse<any>>('/reports', payload);
  return res.data;
}

export type WishlistTargetType = 'property' | 'flatmaterequirement';

/**
 * Toggle Wishlist for a Property or Flatmate Requirement
 * POST /api/wishlist/toggle
 */
export async function toggleWishlistApi(targetType: WishlistTargetType, targetId: string) {
  const res = await apiClient.post<ApiResponse<{ wishlisted: boolean; data?: any }>>('/wishlist/toggle', {
    targetType,
    targetId,
  });
  return res.data;
}

/**
 * Check if a Property or Flatmate Requirement is wishlisted by authenticated user
 * GET /api/wishlist/check
 */
export async function checkWishlistStatusApi(targetType: WishlistTargetType, targetId: string) {
  const res = await apiClient.get<ApiResponse<{ isWishlisted: boolean; wishlistId: string | null }>>('/wishlist/check', {
    params: { targetType, targetId },
  });
  return res.data;
}

/**
 * Fetch Wishlist Items for authenticated user
 * GET /api/wishlist
 */
export async function getWishlistApi(params?: { targetType?: WishlistTargetType; page?: number; limit?: number }) {
  const res = await apiClient.get<ApiResponse<{ items: any[]; total: number; page: number; limit: number }>>('/wishlist', { params });
  return res.data;
}

/**
 * Delete a wishlist item by document ID or target details
 * DELETE /api/wishlist/:id or DELETE /api/wishlist/by-target
 */
export async function deleteWishlistApi(id: string) {
  const res = await apiClient.delete<ApiResponse<any>>(`/wishlist/${id}`);
  return res.data;
}


export type RecentlyViewedTargetType = 'property' | 'flatmaterequirement';

/**
 * Record Recently Viewed Listing for authenticated user
 * POST /api/recently-viewed
 */
export async function addRecentlyViewedApi(targetType: RecentlyViewedTargetType, targetId: string) {
  const res = await apiClient.post<ApiResponse<any>>('/recently-viewed', {
    targetType,
    targetId,
  });
  return res.data;
}

/**
 * Fetch Recently Viewed Listings for authenticated user
 * GET /api/recently-viewed
 */
export async function getRecentlyViewedApi(params?: { targetType?: RecentlyViewedTargetType; page?: number; limit?: number }) {
  const res = await apiClient.get<ApiResponse<{ items: any[]; total: number }>>('/recently-viewed', { params });
  return res.data;
}

export interface GetMyListingsParams {
  page?: number;
  limit?: number;
  sourceType?: 'all' | 'property' | 'flatmate_requirement';
  targetType?: 'all' | 'property' | 'flatmate_requirement' | 'flatmaterequirement';
  postType?: 'property' | 'partner';
  status?: string;
  q?: string;
  search?: string;
  locationPlaceId?: string;
  latitude?: number;
  longitude?: number;
  sortBy?: string;
  order?: string;
}

/**
 * Fetch My Listings for authenticated user
 * GET /api/listings/my-listings
 */
export async function getMyListingsApi(params?: GetMyListingsParams) {
  const res = await apiClient.get<ApiResponse<{ listings: any[]; items?: any[]; total: number; page: number; limit: number; pagination?: any }>>('/listings/my-listings', { params });
  return res.data;
}


/**
 * Create or retrieve an existing chat conversation with a receiver
 * POST /api/chat-conversations
 */
export async function createConversationApi(receiverId: string) {
  const res = await apiClient.post<ApiResponse<any>>(
    "/chat-conversations",
    { receiverId }
  );
  return res.data;
}

/**
 * Fetch paginated user conversations
 * GET /api/chat-conversations
 */
export async function getConversationsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const res = await apiClient.get<ApiResponse<any>>("/chat-conversations", {
    params,
  });
  return res.data;
}

/**
 * Fetch details for a specific conversation
 * GET /api/chat-conversations/:conversationId
 */
export async function getConversationByIdApi(conversationId: string) {
  const res = await apiClient.get<ApiResponse<any>>(
    `/chat-conversations/${conversationId}`
  );
  return res.data;
}

/**
 * Fetch paginated message history for a conversation
 * GET /api/chat-messages/conversations/:conversationId/messages
 */
export async function getMessagesApi(
  conversationId: string,
  params?: { page?: number; limit?: number; before?: string }
) {
  const res = await apiClient.get<ApiResponse<any>>(
    `/chat-messages/conversations/${conversationId}/messages`,
    { params }
  );
  return res.data;
}

/**
 * Send a message in a conversation
 * POST /api/chat-messages/conversations/:conversationId/messages
 */
export async function sendChatMessageApi(
  conversationId: string,
  payload: {
    text: string;
    type?: "text" | "image" | "property" | "flatmate-post" | string;
    attachment?: any;
    property?: any;
    flatmate?: any;
  }
) {
  const res = await apiClient.post<ApiResponse<any>>(
    `/chat-messages/conversations/${conversationId}/messages`,
    {
      type: "text",
      ...payload,
    }
  );
  return res.data;
}

/**
 * Mark messages in a conversation as read
 * PATCH /api/chat-messages/conversations/:conversationId/read
 */
export async function markMessagesReadApi(conversationId: string) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `/chat-messages/conversations/${conversationId}/read`
  );
  return res.data;
}

/**
 * Mark a message as delivered
 * PATCH /api/chat-messages/messages/:messageId/delivered
 */
export async function markMessageDeliveredApi(messageId: string) {
  const res = await apiClient.patch<ApiResponse<any>>(
    `/chat-messages/messages/${messageId}/delivered`
  );
  return res.data;
}

/**
 * Delete a chat message
 * DELETE /api/chat-messages/messages/:messageId
 */
export async function deleteChatMessageApi(messageId: string) {
  const res = await apiClient.delete<ApiResponse<any>>(
    `/chat-messages/messages/${messageId}`
  );
  return res.data;
}

/**
 * Block a user
 * POST /api/chat-blocks/blocks
 */
export async function blockUserApi(blockedUserId: string, reason?: string) {
  const res = await apiClient.post<ApiResponse<any>>("/chat-blocks/blocks", {
    blockedUserId,
    reason,
  });
  return res.data;
}

/**
 * Unblock a user
 * DELETE /api/chat-blocks/blocks/:userId
 */
export async function unblockUserApi(userId: string) {
  const res = await apiClient.delete<ApiResponse<any>>(
    `/chat-blocks/blocks/${userId}`
  );
  return res.data;
}

/**
 * Get list of blocked users
 * GET /api/chat-blocks/blocks
 */
export async function getBlockedUsersApi(params?: {
  page?: number;
  limit?: number;
}) {
  const res = await apiClient.get<ApiResponse<any>>("/chat-blocks/blocks", {
    params,
  });
  return res.data;
}

export type ChatReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'fraud'
  | 'fake_profile'
  | 'scam'
  | 'other';

export interface CreateChatReportPayload {
  reportedUserId: string;
  reason: ChatReportReason;
  description?: string;
}

/**
 * Report a chat user/conversation
 * POST /api/chat-reports
 */
export async function reportChatUserApi(payload: CreateChatReportPayload) {
  const res = await apiClient.post<ApiResponse<any>>("/chat-reports", payload);
  return res.data;
}

