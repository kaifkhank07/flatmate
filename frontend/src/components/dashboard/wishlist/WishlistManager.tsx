"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  Loader2,
  Search,
  Building2,
  Users,
  Bookmark,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ListingCard from "@/components/listing/shared/ListingCard";
import { FlatmateListingItem } from "@/types/listing";
import {
  WishlistItem,
  mapWishlistItemToCard,
} from "@/types/wishlistAndRecent";
import {
  getWishlistApi,
  deleteWishlistApi,
  WishlistTargetType,
} from "@/lib/apiServices";
import SectionHeading from "@/components/utils/SectionHeading";

export type WishlistTab = "all" | "property" | "flatmaterequirement";

interface MappedWishlistItem {
  wishlistId: string;
  targetType: WishlistTargetType;
  targetId: string;
  cardData: FlatmateListingItem;
  rawTarget: any;
  createdAt?: string;
}

export default function WishlistManager() {
  const [items, setItems] = useState<MappedWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WishlistTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetTypeParam = activeTab === "all" ? undefined : activeTab;
      const response = await getWishlistApi({
        targetType: targetTypeParam,
        page,
        limit: 12,
      });

      if (response.success && response.data) {
        const rawItems: WishlistItem[] = response.data.items || [];
        const mapped: MappedWishlistItem[] = [];

        rawItems.forEach((doc: WishlistItem) => {
          const cardData = mapWishlistItemToCard(doc);
          if (cardData) {
            mapped.push({
              wishlistId: doc._id,
              targetType: doc.targetType || "property",
              targetId: (doc.targetId as any)._id || (doc.targetId as any).id,
              cardData,
              rawTarget: doc.targetId,
              createdAt: doc.createdAt,
            });
          }
        });

        setItems(mapped);
        setTotalCount(response.data.total || mapped.length);
        const limit = response.data.limit || 12;
        setTotalPages(Math.ceil((response.data.total || mapped.length) / limit) || 1);
      } else {
        setError(response.message || "Failed to load wishlist");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching wishlist items");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleTabChange = (tab: WishlistTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRemoveFromWishlist = async (
    e: React.MouseEvent,
    wishlistId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (removingId === wishlistId) return;

    setRemovingId(wishlistId);

    // Optimistically update UI
    const previousItems = [...items];
    setItems((prev) => prev.filter((item) => item.wishlistId !== wishlistId));
    setTotalCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await deleteWishlistApi(wishlistId);
      if (!res.success) {
        // Rollback on failure
        setItems(previousItems);
        setTotalCount(previousItems.length);
      }
    } catch {
      // Rollback on error
      setItems(previousItems);
      setTotalCount(previousItems.length);
    } finally {
      setRemovingId(null);
    }
  };

  // Filter items client-side by search query if user types in search input
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.cardData.name.toLowerCase().includes(q) ||
      item.cardData.location.toLowerCase().includes(q) ||
      item.cardData.lookingForType.toLowerCase().includes(q)
    );
  });

  return (
    <section className="w-full min-h-[100vh] py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        <SectionHeading
          title="My Wishlist"
          description="Keep track of your favorite properties and flatmate posts. Save items to compare and contact owners anytime."
        />

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
            <p className="text-gray-500 font-medium text-sm">
              Loading your saved wishlist items...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-red-100 shadow-sm max-w-md mx-auto p-6">
            <p className="text-red-500 font-medium text-base mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchWishlist}
              className="px-5 py-2.5 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div key={item.wishlistId} className="relative group w-full">
                  <ListingCard item={item.cardData} />

                  {/* Remove Wishlist Button Overlay */}
                  <button
                    type="button"
                    disabled={removingId === item.wishlistId}
                    onClick={(e) => handleRemoveFromWishlist(e, item.wishlistId)}
                    className="absolute bottom-3 right-3 z-20 p-2 sm:p-2.5 bg-white/90 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-full shadow-md border border-gray-100 transition-all duration-200 cursor-pointer hover:scale-110 disabled:opacity-50"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    {removingId === item.wishlistId ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-red-500" />
                    ) : (
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-red-500 text-red-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-full disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs sm:text-sm text-gray-600 font-medium px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-full disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto p-8 space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900">
                Your wishlist is empty
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No wishlist items match "${searchQuery}".`
                  : "You haven't saved any listings to your wishlist yet. Explore available properties and flatmates to add favorites."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/listing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full text-sm font-medium shadow-md transition-all cursor-pointer"
              >
                <span>Browse Listings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
