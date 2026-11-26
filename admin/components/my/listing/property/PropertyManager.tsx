"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchProperties,
  fetchPropertyById,
  PropertyItem,
  PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import PropertyCreateDialog from "./PropertyCreateDialog";
import PropertyEditDialog from "./PropertyEditDialog";
import PropertyDetailsDialog from "./PropertyDetailsDialog";
import PropertyStatusChangeDialog from "./PropertyStatusChangeDialog";
import PropertyBulkStatusDialog from "./PropertyBulkStatusDialog";
import DeletePropertyDialog from "./DeletePropertyDialog";

const LIMIT = 10;

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
  { value: "closed", label: "Closed" },
  { value: "expired", label: "Expired" },
] as const;

const LISTING_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "flat_apartment", label: "Flat / Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
] as const;

const FURNISHING_FILTERS = [
  { value: "all", label: "All Furnishing" },
  { value: "fully_furnished", label: "Fully Furnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

export default function PropertyManager({
  eyebrow = "Management Panel",
  title = "Properties Management",
  sub = "Review, create, update, approve, reject, manage statuses, and inspect all property listings.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Filter States
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedListingTypeFilter, setSelectedListingTypeFilter] = useState<string>("all");
  const [selectedFurnishingFilter, setSelectedFurnishingFilter] = useState<string>("all");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Dialog Controls
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEditPropertyId, setSelectedEditPropertyId] = useState<string | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDetailsPropertyId, setSelectedDetailsPropertyId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<PropertyItem | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Status Change Modal State
  const [statusModalTarget, setStatusModalTarget] = useState<PropertyItem | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<string>("approved");

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<PropertyItem | null>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>("approved");

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((it) => it._id)));
    }
  };

  const handleOpenBulkStatusModal = (status: string) => {
    if (selectedIds.size === 0) {
      toast("Please select at least one property listing first.");
      return;
    }
    setBulkTargetStatus(status);
    setIsBulkStatusModalOpen(true);
  };

  // Load Properties
  const loadProperties = useCallback(async () => {
    setLoading(true);
    const res = await fetchProperties({
      status: selectedStatusFilter,
      propertyType: selectedListingTypeFilter,
      listingType: selectedListingTypeFilter,
      furnishing: selectedFurnishingFilter,
      location: selectedLocationFilter,
      search: q,
      page,
      limit: LIMIT,
    });

    if (res.success && res.data) {
      setItems(res.data.items || []);
      const total = res.data.total || 0;
      setPagination({
        page: res.data.page || 1,
        limit: res.data.limit || LIMIT,
        total,
        totalPages: res.data.totalPages || Math.ceil(total / LIMIT) || 1,
      });
    } else {
      toast(res.message || "Failed to load property listings");
    }
    setLoading(false);
  }, [
    selectedStatusFilter,
    selectedListingTypeFilter,
    selectedFurnishingFilter,
    selectedLocationFilter,
    q,
    page,
    toast,
  ]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStatusFilter("all");
    setSelectedListingTypeFilter("all");
    setSelectedFurnishingFilter("all");
    setSelectedLocationFilter("all");
    setQ("");
    setPage(1);
    setSelectedIds(new Set());
  };

  // Open Details Drawer
  const handleOpenDetails = async (id: string) => {
    setSelectedDetailsPropertyId(id);
    setIsDetailsDialogOpen(true);
    setDrawerLoading(true);
    const res = await fetchPropertyById(id);
    if (res.success && res.data) {
      setDrawerData(res.data);
    } else {
      toast(res.message || "Failed to fetch property details");
    }
    setDrawerLoading(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: PropertyItem) => {
    setSelectedEditPropertyId(item._id);
    setIsEditDialogOpen(true);
  };

  // Open Status Modal
  const handleOpenStatusModal = (item: PropertyItem, newStatus: string) => {
    setStatusModalTarget(item);
    setTargetNewStatus(newStatus);
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "approved":
        return "mint";
      case "pending":
      case "draft":
        return "sand";
      case "rejected":
      case "blocked":
      case "closed":
        return "rose";
      case "expired":
        return "sand";
      default:
        return "glass";
    }
  };

  const getCoverImageUrl = (item: PropertyItem): string | null => {
    if (item.images && item.images.length > 0 && item.images[0].url) {
      return item.images[0].url;
    }
    return null;
  };

  const getLocationName = (loc: unknown): string => {
    if (!loc) return "Unknown Location";
    if (typeof loc === "object" && loc !== null) {
      const l = loc as Record<string, unknown>;
      return String(l.name || l.formattedAddress || l.city || "Location");
    }
    return String(loc);
  };

  const getOwnerLabel = (owner: unknown): string => {
    if (!owner) return "Unknown Owner";
    if (typeof owner === "object" && owner !== null) {
      const o = owner as Record<string, unknown>;
      return String(o.email || o.mobile || o._id || "User");
    }
    return String(owner);
  };


  const hasActiveFilters = Boolean(selectedStatusFilter !== "all" ||
    selectedListingTypeFilter !== "all" ||
    selectedFurnishingFilter !== "all" ||
    q.trim() !== "");



  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadProperties}>
              <Icon name="refresh" size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setIsCreateDialogOpen(true)}>
              + Add Property
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools flex-wrap gap-3">
            {/* Search Input */}
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search title, description, or slug…"
            />

            {/* Filter Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Listing Type Filter */}
              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedListingTypeFilter}
                onChange={(e) => {
                  setSelectedListingTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                {LISTING_TYPE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Furnishing Filter */}
              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedFurnishingFilter}
                onChange={(e) => {
                  setSelectedFurnishingFilter(e.target.value);
                  setPage(1);
                }}
              >
                {FURNISHING_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Reset Filters */}
              <ResetFilterButton
                visible={hasActiveFilters}
                onClick={handleResetFilters}
              />

            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2.5 p-3 mx-4 mb-3 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-1)]">
                <span>Total {selectedIds.size} propert{selectedIds.size === 1 ? "y" : "ies"} selected</span>
                {/* <button
                  type="button"
                  className="btn btn-ghost sm text-xs"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Unselect All
                </button> */}
              </div>
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  className="btn btn-brand sm"
                  onClick={() => handleOpenBulkStatusModal("approved")}
                >
                  Select Status
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 42, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-[var(--hair-2)] accent-[var(--ember)]"
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onChange={handleSelectAll}
                      aria-label="Select all properties on this page"
                    />
                  </th>
                  <th>Property</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Rent & Deposit</th>
                  <th>Furnishing</th>
                  <th>Available From</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading property listings…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No property listings found matching parameters.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const cover = getCoverImageUrl(item);
                    return (
                      <tr key={item._id}>
                        <td style={{ textAlign: "center", width: 42 }}>
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded border-[var(--hair-2)] accent-[var(--ember)]"
                            checked={selectedIds.has(item._id)}
                            onChange={() => handleToggleSelect(item._id)}
                            aria-label={`Select ${item.title}`}
                          />
                        </td>
                        <td
                          className="td-person"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleOpenDetails(item._id)}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              background: "var(--bg-card-hover, rgba(255,255,255,0.06))",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {cover ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={cover}
                                alt={item.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Icon name="home" size={18} />
                            )}
                          </div>
                          <div style={{ maxWidth: 200 }}>
                            <strong
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.title}
                            </strong>
                            <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", }}>
                              {item.slug}
                            </span>
                          </div>
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {getOwnerLabel(item.userId || item.ownerId)}
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {getLocationName(item.location)}
                        </td>

                        <td>
                          <Chip tone="iris">
                            {String(item.propertyType || item.listingType || "flat_apartment").replace(/_/g, " ").toUpperCase()}
                          </Chip>
                        </td>

                        <td>
                          <div>
                            <strong>₹{(typeof item.rent === "number" ? item.rent : 0).toLocaleString("en-IN")}/mo</strong>
                            <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)" }}>
                              Dep: ₹{(item.securityDeposit || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {(item.furnishing || "").replace(/_/g, " ").toUpperCase()}
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                          {item.availableFrom
                            ? new Date(item.availableFrom).toLocaleDateString()
                            : "Immediate"}
                        </td>

                        <td>
                          <Chip tone={getStatusTone(item.status)} dot>
                            {item.status.toUpperCase()}
                          </Chip>
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>

                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                            <button
                              className="btn btn-ghost sm"
                              onClick={() => handleOpenDetails(item._id)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-ghost sm"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              Edit
                            </button>
                            {item.status === "pending" && (
                              <>
                                <button
                                  className="btn btn-ghost sm"
                                  style={{ color: "var(--mint-ink)" }}
                                  onClick={() => handleOpenStatusModal(item, "approved")}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-ghost sm"
                                  style={{ color: "var(--rose-ink)" }}
                                  onClick={() => handleOpenStatusModal(item, "rejected")}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {item.status === "approved" && (
                              <>
                                <button
                                  className="btn btn-ghost sm text-amber-600"
                                  onClick={() => handleOpenStatusModal(item, "blocked")}
                                >
                                  Block
                                </button>
                                <button
                                  className="btn btn-ghost sm text-slate-600"
                                  onClick={() => handleOpenStatusModal(item, "closed")}
                                >
                                  Close
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-ghost sm"
                              style={{ color: "var(--rose-ink)" }}
                              onClick={() => setDeleteTarget(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </Card>
      </div>

      {/* Property Create Dialog */}
      <PropertyCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={loadProperties}
      />

      {/* Property Edit Dialog */}
      <PropertyEditDialog
        isOpen={isEditDialogOpen}
        propertyId={selectedEditPropertyId}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedEditPropertyId(null);
        }}
        onSuccess={() => {
          loadProperties();
          if (selectedDetailsPropertyId) {
            handleOpenDetails(selectedDetailsPropertyId);
          }
        }}
      />

      {/* Property Details Dialog */}
      <PropertyDetailsDialog
        isOpen={isDetailsDialogOpen}
        property={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedDetailsPropertyId(null);
        }}
        onEdit={(item) => handleOpenEditModal(item)}
        onStatusChange={(item, newStatus) => handleOpenStatusModal(item, newStatus)}
      />

      {/* Property Status Change Dialog */}
      <PropertyStatusChangeDialog
        property={statusModalTarget}
        newStatus={targetNewStatus}
        onClose={() => setStatusModalTarget(null)}
        onSuccess={(updatedPropertyId) => {
          loadProperties();
          if (updatedPropertyId && selectedDetailsPropertyId === updatedPropertyId) {
            handleOpenDetails(updatedPropertyId);
          }
        }}
      />

      {/* Property Bulk Status Dialog */}
      <PropertyBulkStatusDialog
        isOpen={isBulkStatusModalOpen}
        selectedIds={Array.from(selectedIds)}
        initialStatus={bulkTargetStatus}
        onClose={() => setIsBulkStatusModalOpen(false)}
        onSuccess={() => {
          setSelectedIds(new Set());
          loadProperties();
        }}
      />

      {/* Property Delete Dialog */}
      <DeletePropertyDialog
        property={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={(deletedPropertyId) => {
          if (selectedDetailsPropertyId === deletedPropertyId) {
            setIsDetailsDialogOpen(false);
            setSelectedDetailsPropertyId(null);
          }
          loadProperties();
        }}
      />
    </>
  );
}
