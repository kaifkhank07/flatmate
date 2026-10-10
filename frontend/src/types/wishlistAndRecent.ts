/**
 * Wishlist and Recently Viewed Types & Interfaces
 * Matches Backend Wishlist & RecentlyViewed API response contracts
 * Modeled after `@/types/listing.ts`
 */

import {
  UnifiedListingItem,
  PaginationInfo,
  FlatmateListingItem,
  mapUnifiedListingToCard,
} from "./listing";

export type WishlistTargetType = "property" | "flatmaterequirement";

export interface WishlistItem {
  _id: string;
  userId: string;
  targetType: WishlistTargetType;
  targetModel: "Property" | "FlatmateRequirement";
  targetId: UnifiedListingItem;
  createdAt: string;
  updatedAt?: string;
}

export interface GetWishlistResponseData {
  items: WishlistItem[];
  total: number;
  page: number;
  limit: number;
  pagination?: PaginationInfo;
}

export type RecentlyViewedTargetType = "property" | "flatmaterequirement";

export interface RecentlyViewedItem {
  _id: string;
  userId: string;
  targetType: RecentlyViewedTargetType;
  targetModel: "Property" | "FlatmateRequirement";
  targetId: UnifiedListingItem;
  viewedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetRecentlyViewedResponseData {
  items: RecentlyViewedItem[];
  total: number;
  page: number;
  limit: number;
  pagination?: PaginationInfo;
}

/**
 * Maps a WishlistItem doc (with populated targetId) to FlatmateListingItem for ListingCard rendering
 */
export function mapWishlistItemToCard(item: WishlistItem): FlatmateListingItem | null {
  if (!item || !item.targetId) return null;

  const target =
    item.targetType === "property"
      ? ({ ...item.targetId, sourceType: "property" } as any)
      : ({ ...item.targetId, sourceType: "flatmate_requirement" } as any);

  return mapUnifiedListingToCard(target);
}

/**
 * Maps a RecentlyViewedItem doc (with populated targetId) to FlatmateListingItem for ListingCard rendering
 */
export function mapRecentlyViewedItemToCard(item: RecentlyViewedItem): FlatmateListingItem | null {
  if (!item || !item.targetId) return null;

  const target =
    item.targetType === "property"
      ? ({ ...item.targetId, sourceType: "property" } as any)
      : ({ ...item.targetId, sourceType: "flatmate_requirement" } as any);

  return mapUnifiedListingToCard(target);
}
