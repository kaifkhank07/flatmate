"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchRentalGuides,
  deleteRentalGuideApi,
  RentalGuideItem,
  PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, PageHead, Chip } from "@/components/ui";

import CreateRentalGuideDialog from "./CreateRentalGuideDialog";
import EditRentalGuideDialog from "./EditRentalGuideDialog";

const LIMIT = 10;

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function RentalGuideManager({
  eyebrow = "Management Panel",
  title = "Rental Guides Management",
  sub = "Create, edit, review, and manage rental guides and informative articles.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RentalGuideItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEditGuide, setSelectedEditGuide] = useState<RentalGuideItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<RentalGuideItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRentalGuides = useCallback(async () => {
    setLoading(true);
    const res = await fetchRentalGuides({
      isActive:
        selectedStatusFilter === "all"
          ? undefined
          : selectedStatusFilter === "active",
      search: q.trim() || undefined,
      page,
      limit: LIMIT,
    });

    if (res.success && res.data) {
      setItems(res.data.rentalGuides || []);
      const total = res.data.pagination?.total || 0;
      setPagination({
        page: res.data.pagination?.page || page,
        limit: res.data.pagination?.limit || LIMIT,
        total,
        totalPages: res.data.pagination?.totalPages || Math.ceil(total / LIMIT) || 1,
      });
    } else {
      toast(res.message || "Failed to load rental guides");
    }
    setLoading(false);
  }, [selectedStatusFilter, q, page, toast]);

  useEffect(() => {
    loadRentalGuides();
  }, [loadRentalGuides]);

  const handleResetFilters = () => {
    setSelectedStatusFilter("all");
    setQ("");
    setPage(1);
  };

  const handleOpenEditModal = (item: RentalGuideItem) => {
    setSelectedEditGuide(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    const res = await deleteRentalGuideApi(deleteTarget._id);
    setSubmitting(false);

    if (res.success) {
      toast(`Rental guide "${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);
      loadRentalGuides();
    } else {
      toast(res.message || "Failed to delete rental guide");
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatusFilter !== "all") count++;
    if (q.trim() !== "") count++;
    return count;
  }, [selectedStatusFilter, q]);

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadRentalGuides}>
              <Icon name="refresh" size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setIsCreateDialogOpen(true)}>
              + Add Rental Guide
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools flex-wrap gap-3">
            <div className="table-search" style={{ minWidth: 220, flex: 1 }}>
              <Icon name="search" size={14} />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search guide title, description, or content…"
              />
            </div>

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

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="px-2.5 py-1.5 text-xs font-medium text-[var(--rose-ink)] hover:underline"
                  onClick={handleResetFilters}
                >
                  Reset Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Rental Guide</th>
                  <th>Description Excerpt</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading rental guides…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No rental guides found matching parameters.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const cover = item.image?.url;
                    return (
                      <tr key={item._id}>
                        <td className="td-person">
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
                          <div style={{ maxWidth: 220 }}>
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

                        <td style={{ maxWidth: 260 }}>
                          <p className="text-xs text-[var(--ink-2)] line-clamp-2 truncate">
                            {item.description || item.content.slice(0, 100)}
                          </p>
                        </td>

                        <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          <code className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            {item.slug}
                          </code>
                        </td>

                        <td>
                          <Chip tone={item.isActive ? "mint" : "rose"} dot>
                            {item.isActive ? "ACTIVE" : "INACTIVE"}
                          </Chip>
                        </td>

                        <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>

                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              className="btn btn-ghost sm"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              Edit
                            </button>
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

          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--hair-2)] text-xs text-[var(--ink-3)]">
              <div>
                <span>
                  Showing <strong className="font-semibold text-[var(--ink)]">{(page - 1) * pagination.limit + 1}</strong> to{" "}
                  <strong className="font-semibold text-[var(--ink)]">
                    {Math.min(page * pagination.limit, pagination.total)}
                  </strong>{" "}
                  of <strong className="font-semibold text-[var(--ink)]">{pagination.total}</strong> entries
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <Icon name="chevLeft" size={12} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => {
                    const pNum = i + 1;
                    const isCurrent = page === pNum;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        className={`min-w-[32px] h-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${isCurrent
                            ? "bg-[var(--ember)] text-white shadow-sm"
                            : "border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)]"
                          }`}
                        onClick={() => setPage(pNum)}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  <span>Next</span>
                  <Icon name="arrow" size={12} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <CreateRentalGuideDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={loadRentalGuides}
      />

      <EditRentalGuideDialog
        isOpen={isEditDialogOpen}
        guide={selectedEditGuide}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedEditGuide(null);
        }}
        onSuccess={loadRentalGuides}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-rose-600">Delete Rental Guide</h3>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="text-sm text-slate-700">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">&quot;{deleteTarget.title}&quot;</strong>?
            </div>
            <div className="text-xs text-slate-500">
              This action cannot be undone and will permanently remove the guide article.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-all disabled:opacity-50"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
