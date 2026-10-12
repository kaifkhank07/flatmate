"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Loader2,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Filter,
} from "lucide-react";
import ListingCard from "@/components/listing/shared/ListingCard";
import { FlatmateListingItem } from "@/types/listing";
import {
  MyListingSourceType,
  MyListingStatus,
  mapMyListingItemToCard,
} from "@/types/myListing";
import {
  getMyListingsApi,
  deletePropertyApi,
  deleteFlatmateRequirementApi,
} from "@/lib/apiServices";
import SectionHeading from "@/components/utils/SectionHeading";
import DeleteConfirmModal from "@/components/listing/shared/modals/DeleteConfirmModal";
import { ViewReveal } from "@/components/animation";

export type MyListingTab = "all" | "property" | "flatmate_requirement";

export type StatusFilter =
  | "all"
  | "approved"
  | "pending"
  | "draft"
  | "rejected"
  | "closed"
  | "expired";

interface MappedMyListingItem {
  id: string;
  sourceType: "property" | "flatmate_requirement";
  status: string;
  cardData: FlatmateListingItem;
  rawItem: any;
  createdAt?: string;
}

export default function MyListingManager() {
  const [items, setItems] = useState<MappedMyListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MyListingTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sourceTypeParam = activeTab === "all" ? undefined : activeTab;
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const response = await getMyListingsApi({
        sourceType: sourceTypeParam,
        status: statusParam,
        q: searchQuery.trim() || undefined,
        page,
        limit: 12,
      });

      if (response.success && response.data) {
        const rawItems: any[] = response.data.items || response.data.listings || [];
        const mapped: MappedMyListingItem[] = [];

        rawItems.forEach((doc: any) => {
          const cardData = mapMyListingItemToCard(doc);
          if (cardData) {
            mapped.push({
              id: doc._id || doc.id,
              sourceType: doc.sourceType || (doc.propertyType ? "property" : "flatmate_requirement"),
              status: doc.status || "draft",
              cardData,
              rawItem: doc,
              createdAt: doc.createdAt,
            });
          }
        });

        setItems(mapped);
        const total = response.data.pagination?.total ?? response.data.total ?? mapped.length;
        setTotalCount(total);
        const limit = response.data.pagination?.limit ?? response.data.limit ?? 12;
        const pages = response.data.pagination?.totalPages ?? Math.ceil(total / limit) ?? 1;
        setTotalPages(pages || 1);
      } else {
        setError(response.message || "Failed to load listings");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching listings");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleTabChange = (tab: MyListingTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    sourceType: "property" | "flatmate_requirement";
    title?: string;
  } | null>(null);

  const openDeleteModal = (
    e: React.MouseEvent,
    item: MappedMyListingItem
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget({
      id: item.id,
      sourceType: item.sourceType,
      title: item.cardData.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, sourceType } = deleteTarget;

    setDeletingId(id);

    // Optimistically update UI
    const previousItems = [...items];
    setItems((prev) => prev.filter((item) => item.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));

    try {
      const res =
        sourceType === "property"
          ? await deletePropertyApi(id)
          : await deleteFlatmateRequirementApi(id);

      if (!res.success) {
        // Rollback on failure
        setItems(previousItems);
        setTotalCount(previousItems.length);
        alert(res.message || "Failed to delete listing.");
      }
    } catch (err: any) {
      // Rollback on error
      setItems(previousItems);
      setTotalCount(previousItems.length);
      alert(err.message || "Failed to delete listing.");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
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

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: "All Status", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Draft", value: "draft" },
    { label: "Closed", value: "closed" },
    { label: "Expired", value: "expired" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <section className="w-full min-h-[100vh] py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Header Title & CTA Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <ViewReveal duration={800}>
            <SectionHeading
              title="My Listings"
              description="Manage all your posted properties and flatmate requirement listings. View status, update details, or add new listings anytime."
            />
          </ViewReveal>

          {/* <Link
            href="/my-listings/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full font-medium text-sm shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Listing</span>
          </Link> */}
        </div>

        {/* Filter Controls Bar */}
        {/* <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange("all")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-[#0066FF] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Listings
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("property")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "property"
                    ? "bg-white text-[#0066FF] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Properties</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("flatmate_requirement")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "flatmate_requirement"
                    ? "bg-white text-[#0066FF] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Flatmate Requirements</span>
              </button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, location or preference..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto no-scrollbar">
            <span className="text-xs font-medium text-gray-400 shrink-0 inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === opt.value
                    ? "bg-[#0066FF] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div> */}

        {/* Content Section */}
        <ViewReveal duration={900} startDelay={150}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
              <p className="text-gray-500 font-medium text-sm">
                Loading your listings...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-red-100 shadow-sm max-w-md mx-auto p-6">
              <p className="text-red-500 font-medium text-base mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchListings}
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
                  <div key={item.id} className="relative group w-full">
                    <ListingCard item={item.cardData} isMylisting={true} />

                    {/* Actions Overlay Row (Edit & Delete buttons) */}
                    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                      <Link
                        href={`/my-listings/edit/${item.id}`}
                        className="p-2 sm:p-2.5 bg-white/90 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-full shadow-md border border-gray-100 transition-all duration-200 cursor-pointer hover:scale-110"
                        title="Edit listing"
                        aria-label="Edit listing"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </Link>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={(e) => openDeleteModal(e, item)}
                        className="p-2 sm:p-2.5 bg-white/90 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-full shadow-md border border-gray-100 transition-all duration-200 cursor-pointer hover:scale-110 disabled:opacity-50"
                        title="Delete listing"
                        aria-label="Delete listing"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                        )}
                      </button>
                    </div>
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
              <div className="w-16 h-16 bg-blue-50 text-[#0066FF] rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  No listings found
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== "all" || activeTab !== "all"
                    ? "No listings match your current filters. Try changing or clearing your search criteria."
                    : "You haven't posted any property or flatmate requirement listings yet."}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/my-listings/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full text-sm font-medium shadow-md transition-all cursor-pointer"
                >
                  <span>Create New Listing</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </ViewReveal>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        itemTitle={deleteTarget?.title}
        loading={!!deletingId}
      />
    </section>
  );
}
