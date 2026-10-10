/**
 * My Listing Types & Interfaces
 * Matches Backend getMyListings API response contract
 * Modeled after `@/types/wishlistAndRecent.ts` and `@/types/listing.ts`
 */

import {
  UnifiedListingItem,
  PaginationInfo,
  FlatmateListingItem,
  mapUnifiedListingToCard,
} from "./listing";

export type MyListingSourceType = "all" | "property" | "flatmate_requirement";

export type MyListingStatus =
  | "all"
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "blocked"
  | "closed"
  | "expired";

export type MyListingItem = UnifiedListingItem & {
  _id: string;
  sourceType: "property" | "flatmate_requirement";
  status: string;
  createdAt: string;
  updatedAt?: string;
};

export interface GetMyListingsResponseData {
  items: UnifiedListingItem[];
  listings: UnifiedListingItem[];
  total: number;
  page: number;
  limit: number;
  pagination?: PaginationInfo;
}

/**
 * Maps a MyListing item doc to FlatmateListingItem for ListingCard rendering
 */
export function mapMyListingItemToCard(item: any): FlatmateListingItem | null {
  if (!item) return null;

  const target = {
    ...item,
    sourceType: item.sourceType || (item.propertyType ? "property" : "flatmate_requirement"),
  };

  return mapUnifiedListingToCard(target);
}
