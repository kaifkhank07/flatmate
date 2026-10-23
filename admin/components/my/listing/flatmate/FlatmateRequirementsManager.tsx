"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchFlatmateRequirements,
  fetchFlatmateRequirementById,
  FlatmateRequirementItem,
  PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import FlatmateRequirementCreateDialog from "./FlatmateRequirementCreateDialog";
import FlatmateRequirementEditDialog from "./FlatmateRequirementEditDialog";
import FlatmateRequirementDetailsDialog from "./FlatmateRequirementDetailsDialog";
import FlatmateRequirementStatusChangeDialog from "./FlatmateRequirementStatusChangeDialog";
import FlatmateRequirementBulkStatusDialog from "./FlatmateRequirementBulkStatusDialog";
import DeleteFlatmateRequirementDialog from "./DeleteFlatmateRequirementDialog";

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

const POST_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "property", label: "Property" },
  { value: "partner", label: "Partner" },
] as const;

const PROPERTY_TYPE_FILTERS = [
  { value: "all", label: "All Property Types" },
  { value: "room", label: "Room" },
  { value: "flat", label: "Flat" },
  { value: "pg", label: "PG" },
  { value: "shared_apartment", label: "Shared Apartment" },
] as const;

const PARTNER_TYPE_FILTERS = [
  { value: "all", label: "All Partner Types" },
  { value: "roommate", label: "Roommate" },
  { value: "flatmate", label: "Flatmate" },
] as const;

export default function FlatmateRequirementsManager({
  eyebrow = "Management Panel",
  title = "Flatmate Requirements",
  sub = "Review, filter, inspect details, update status, and manage marketplace flatmate requirements.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FlatmateRequirementItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedPostTypeFilter, setSelectedPostTypeFilter] = useState<string>("all");
  const [selectedPropertyTypeFilter, setSelectedPropertyTypeFilter] = useState<string>("all");
  const [selectedPartnerTypeFilter, setSelectedPartnerTypeFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Dialog Controls
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEditRequirementId, setSelectedEditRequirementId] = useState<string | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDetailsRequirementId, setSelectedDetailsRequirementId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<FlatmateRequirementItem | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Status Change Modal State
  const [statusModalTarget, setStatusModalTarget] = useState<FlatmateRequirementItem | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<string>("approved");

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<FlatmateRequirementItem | null>(null);

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
      toast("Please select at least one flatmate requirement first.");
      return;
    }
    setBulkTargetStatus(status);
    setIsBulkStatusModalOpen(true);
  };

  // Load Requirements Callback
  const loadFlatmateRequirements = useCallback(async () => {
    setLoading(true);
    const res = await fetchFlatmateRequirements({
      status: selectedStatusFilter,
      postType: selectedPostTypeFilter,
      propertyType: selectedPropertyTypeFilter,
      partnerType: selectedPartnerTypeFilter,
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
      toast(res.message || "Failed to load flatmate requirements");
    }
    setLoading(false);
  }, [
    selectedStatusFilter,
    selectedPostTypeFilter,
    selectedPropertyTypeFilter,
    selectedPartnerTypeFilter,
    q,
    page,
    toast,
  ]);

  useEffect(() => {
    loadFlatmateRequirements();
  }, [loadFlatmateRequirements]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStatusFilter("all");
    setSelectedPostTypeFilter("all");
    setSelectedPropertyTypeFilter("all");
    setSelectedPartnerTypeFilter("all");
    setQ("");
    setPage(1);
    setSelectedIds(new Set());
  };

  // Open Details Drawer
  const handleOpenDetails = async (id: string) => {
    setSelectedDetailsRequirementId(id);
    setIsDetailsDialogOpen(true);
    setDrawerLoading(true);
    const res = await fetchFlatmateRequirementById(id);
    if (res.success && res.data) {
      setDrawerData(res.data);
    } else {
      toast(res.message || "Failed to fetch requirement details");
    }
    setDrawerLoading(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: FlatmateRequirementItem) => {
    setSelectedEditRequirementId(item._id);
    setIsEditDialogOpen(true);
  };

  // Open Status Modal
  const handleOpenStatusModal = (item: FlatmateRequirementItem, newStatus: string) => {
    setStatusModalTarget(item);
    setTargetNewStatus(newStatus);
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return "mint";
      case "pending":
      case "draft":
      case "expired":
        return "sand";
      case "rejected":
      case "blocked":
      case "closed":
        return "rose";
      default:
        return "glass";
    }
  };

  const getCoverImageUrl = (post: FlatmateRequirementItem): string | null => {
    if (post.images && post.images.length > 0) {
      const img = post.images[0] as any;
      if (typeof img === "string") return img;
      if (typeof img === "object" && img?.url) return img.url;
    }
    return null;
  };

  const getLocationName = (loc: any): string => {
    if (!loc) return "Unknown Location";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object" && (loc.name || loc.formattedAddress)) {
      return loc.name || loc.formattedAddress;
    }
    return "Unknown Location";
  };

  const getUserLabel = (user: any): string => {
    if (!user) return "Unknown User";
    if (typeof user === "string") return `ID: ${user.slice(-6)}`;
    if (typeof user === "object") {
      if (user.email) return user.email;
      if (user.mobile) return user.mobile;
      if (user._id) return `ID: ${user._id.slice(-6)}`;
    }
    return "Unknown User";
  };

  const hasActiveFilters = Boolean(
    selectedStatusFilter !== "all" ||
    selectedPostTypeFilter !== "all" ||
    selectedPropertyTypeFilter !== "all" ||
    selectedPartnerTypeFilter !== "all" ||
    q.trim() !== ""
  );

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadFlatmateRequirements}>
              <Icon name="refresh" size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setIsCreateDialogOpen(true)}>
              + Add Requirement
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

              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedPostTypeFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPostTypeFilter(val);
                  if (val !== "property") setSelectedPropertyTypeFilter("all");
                  if (val !== "partner") setSelectedPartnerTypeFilter("all");
                  setPage(1);
                }}
              >
                {POST_TYPE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {selectedPostTypeFilter === "property" && (
                <select
                  className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                  value={selectedPropertyTypeFilter}
                  onChange={(e) => {
                    setSelectedPropertyTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  {PROPERTY_TYPE_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              )}

              {selectedPostTypeFilter === "partner" && (
                <select
                  className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                  value={selectedPartnerTypeFilter}
                  onChange={(e) => {
                    setSelectedPartnerTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  {PARTNER_TYPE_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              )}

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
                <span>Total {selectedIds.size} flatmate requirement{selectedIds.size === 1 ? "" : "s"} selected</span>
                {/* <button
                  type="button"
                  className="btn btn-ghost sm text-xs"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Deselect All
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
                      aria-label="Select all flatmate requirements on this page"
                    />
                  </th>
                  <th>Requirement</th>
                  <th>User</th>
                  <th>Location</th>
                  <th>Post Type</th>
                  <th>Sub Type</th>
                  <th>Rent</th>
                  <th>Occupation</th>
                  <th>Available From</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading flatmate requirements…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No flatmate requirements found matching parameters.
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
                              <Icon name="fileText" size={18} />
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
                            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                              ID: {item._id.slice(-6)}
                            </span>
                          </div>
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {getUserLabel(item.userId)}
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {getLocationName(item.location)}
                        </td>

                        <td>
                          <Chip tone="glass">
                            {(item.postType || "property").toUpperCase()}
                          </Chip>
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {item.postType === "property"
                            ? (item.propertyType || "N/A").replace(/_/g, " ").toUpperCase()
                            : (item.partnerType || "N/A").toUpperCase()}
                        </td>

                        <td>
                          <div>
                            <strong>₹{(typeof item.rent === "number" ? item.rent : (item as any).budget || 0).toLocaleString("en-IN")}</strong>
                          </div>
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                          {(item.occupationPreference || "any").replace(/_/g, " ").toUpperCase()}
                        </td>

                        <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                          {item.availableFrom ? new Date(item.availableFrom).toLocaleDateString() : (item as any).moveInDate ? new Date((item as any).moveInDate).toLocaleDateString() : "N/A"}
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
                            {(item.status === "approved" || (item.status as string) === "active") && (
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

          <Pagination
            page={page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </Card>
      </div>

      {/* Create Dialog */}
      <FlatmateRequirementCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          loadFlatmateRequirements();
        }}
      />

      {/* Edit Dialog */}
      <FlatmateRequirementEditDialog
        isOpen={isEditDialogOpen}
        requirementId={selectedEditRequirementId}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedEditRequirementId(null);
        }}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setSelectedEditRequirementId(null);
          loadFlatmateRequirements();
          if (selectedDetailsRequirementId) {
            handleOpenDetails(selectedDetailsRequirementId);
          }
        }}
      />

      {/* Details Drawer */}
      <FlatmateRequirementDetailsDialog
        isOpen={isDetailsDialogOpen}
        requirement={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedDetailsRequirementId(null);
          setDrawerData(null);
        }}
        onEdit={(item) => {
          setIsDetailsDialogOpen(false);
          setSelectedDetailsRequirementId(null);
          setDrawerData(null);
          handleOpenEditModal(item);
        }}
        onStatusChange={(item, newStatus) => handleOpenStatusModal(item, newStatus)}
      />

      {/* Status Change Dialog */}
      <FlatmateRequirementStatusChangeDialog
        requirement={statusModalTarget}
        newStatus={targetNewStatus}
        onClose={() => setStatusModalTarget(null)}
        onSuccess={(updatedRequirementId) => {
          loadFlatmateRequirements();
          if (updatedRequirementId && selectedDetailsRequirementId === updatedRequirementId) {
            handleOpenDetails(updatedRequirementId);
          }
        }}
      />

      {/* Flatmate Requirement Bulk Status Dialog */}
      <FlatmateRequirementBulkStatusDialog
        isOpen={isBulkStatusModalOpen}
        selectedIds={Array.from(selectedIds)}
        initialStatus={bulkTargetStatus}
        onClose={() => setIsBulkStatusModalOpen(false)}
        onSuccess={() => {
          setSelectedIds(new Set());
          loadFlatmateRequirements();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteFlatmateRequirementDialog
        requirement={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={(deletedRequirementId) => {
          if (selectedDetailsRequirementId === deletedRequirementId) {
            setIsDetailsDialogOpen(false);
            setSelectedDetailsRequirementId(null);
            setDrawerData(null);
          }
          loadFlatmateRequirements();
        }}
      />
    </>
  );
}
