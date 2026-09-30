"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchReviews,
  fetchReviewById,
  updateReviewStatusApi,
  deleteReviewApi,
  ReviewItem,
  PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, Chip, Tone } from "@/components/ui";

import PageHead from "../../ui/PageHead";

const LIMIT = 10;

const TARGET_TYPE_FILTERS = [
  { value: "all", label: "All Target Types" },
  { value: "property", label: "Property" },
  { value: "flatmaterequirement", label: "Flatmate Requirement" },
  { value: "user", label: "User Profile" },
] as const;

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "hidden", label: "Hidden" },
  { value: "rejected", label: "Rejected" },
] as const;

const RATING_FILTERS = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars ★★★★★" },
  { value: "4", label: "4 Stars ★★★★☆" },
  { value: "3", label: "3 Stars ★★★☆☆" },
  { value: "2", label: "2 Stars ★★☆☆☆" },
  { value: "1", label: "1 Star ★☆☆☆☆" },
] as const;

export default function ReviewsManager({
  eyebrow = "Admin Staff Panel",
  title = "Reviews",
  sub = "Inspect, moderate, approve, or reject user and listing reviews.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReviewItem[]>([]);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedTargetType, setSelectedTargetType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Review Details Modal
  const [detailsModalReview, setDetailsModalReview] = useState<ReviewItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalReviewId, setDeleteModalReviewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchReviews({
        targetType: selectedTargetType === "all" ? undefined : selectedTargetType,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        rating: selectedRating === "all" ? undefined : parseInt(selectedRating, 10),
        search: q.trim() || undefined,
        page,
        limit: LIMIT,
      });

      if (res.success && res.data) {
        setItems(res.data.reviews || []);
        setPagination(
          res.data.pagination || {
            page,
            limit: LIMIT,
            total: res.data.reviews?.length || 0,
            totalPages: 1,
          }
        );
      } else {
        toast(res.message || "Failed to load reviews");
      }
    } catch (error) {
      console.error("[ReviewsManager] Load error:", error);
      toast("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [selectedTargetType, selectedStatus, selectedRating, q, page, toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleResetFilters = () => {
    setSelectedTargetType("all");
    setSelectedStatus("all");
    setSelectedRating("all");
    setQ("");
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTargetType !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedRating !== "all") count++;
    if (q.trim()) count++;
    return count;
  }, [selectedTargetType, selectedStatus, selectedRating, q]);

  const getTargetTypeLabel = (type: string) => {
    if (type === "property") return "Property";
    if (type === "flatmaterequirement") return "Flatmate Requirement";
    if (type === "user") return "User Profile";
    return type;
  };

  const getStatusTone = (status?: string): Tone => {
    switch (status) {
      case "published":
        return "mint";
      case "pending":
        return "sand";
      case "hidden":
        return "amber" as Tone;
      case "rejected":
        return "rose";
      default:
        return "sand";
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      const res = await updateReviewStatusApi(reviewId, newStatus);
      if (res.success) {
        toast(`Review status updated to "${newStatus}"`);
        if (detailsModalReview && detailsModalReview._id === reviewId) {
          setDetailsModalReview((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
        loadReviews();
      } else {
        toast(res.message || "Failed to update status");
      }
    } catch (error) {
      console.error("[ReviewsManager] Status update error:", error);
      toast("Failed to update status");
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteModalReviewId) return;
    try {
      setDeleting(true);
      const res = await deleteReviewApi(deleteModalReviewId);
      if (res.success) {
        toast("Review deleted successfully");
        setDeleteModalReviewId(null);
        if (detailsModalReview && detailsModalReview._id === deleteModalReviewId) {
          setDetailsModalReview(null);
        }
        loadReviews();
      } else {
        toast(res.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("[ReviewsManager] Delete error:", error);
      toast("Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenDetails = async (review: ReviewItem) => {
    setDetailsModalReview(review);
    setLoadingDetails(true);
    try {
      const res = await fetchReviewById(review._id);
      if (res.success && res.data) {
        setDetailsModalReview(res.data);
      }
    } catch (error) {
      console.error("[ReviewsManager] Details error:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= rating ? "text-amber-400 font-bold" : "text-slate-300"}
        >
          ★
        </span>
      );
    }
    return <span className="text-sm tracking-wider">{stars}</span>;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return (
      d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={loadReviews}
              disabled={loading}
            >
              <Icon name="refresh" size={13} />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          {/* Filters Bar */}
          <div className="table-tools flex-wrap gap-3">
            <div className="table-search" style={{ minWidth: 220, flex: 1 }}>
              <Icon name="search" size={14} />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search title, comment, reviewer..."
                className="ml-2 border-none outline-none"
                style={{ background: "transparent" }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedTargetType}
                onChange={(e) => {
                  setSelectedTargetType(e.target.value);
                  setPage(1);
                }}
              >
                {TARGET_TYPE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
                value={selectedRating}
                onChange={(e) => {
                  setSelectedRating(e.target.value);
                  setPage(1);
                }}
              >
                {RATING_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
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

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Target Type</th>
                  <th>Rating</th>
                  <th>Title & Comment</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 34,
                        color: "var(--ink-4)",
                      }}
                    >
                      Loading reviews...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 34,
                        color: "var(--ink-4)",
                      }}
                    >
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const reviewerName =
                      typeof item.reviewerId === "object"
                        ? [item.reviewerId.firstName, item.reviewerId.lastName].filter(Boolean).join(" ") || "User"
                        : "User";

                    const reviewerContact =
                      typeof item.reviewerId === "object"
                        ? item.reviewerId.email || item.reviewerId.mobile || "-"
                        : "-";

                    return (
                      <tr key={item._id}>
                        {/* Reviewer */}
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[var(--ink)]">
                              {reviewerName}
                            </span>
                            <span className="text-[11px] text-[var(--ink-4)]">
                              {reviewerContact}
                            </span>
                          </div>
                        </td>

                        {/* Target Type */}
                        <td>
                          <Chip
                            tone={
                              item.targetType === "property"
                                ? "iris"
                                : item.targetType === "flatmaterequirement"
                                ? "sand"
                                : "mint"
                            }
                          >
                            {getTargetTypeLabel(item.targetType)}
                          </Chip>
                        </td>

                        {/* Rating Stars */}
                        <td>{renderStars(item.rating)}</td>

                        {/* Title & Comment */}
                        <td className="max-w-[260px]">
                          <div className="flex flex-col gap-0.5">
                            {item.title && (
                              <span className="font-semibold text-xs text-[var(--ink)] truncate">
                                {item.title}
                              </span>
                            )}
                            <p
                              className="text-xs text-[var(--ink-3)] line-clamp-2"
                              title={item.comment || "-"}
                            >
                              {item.comment || "-"}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <Chip tone={getStatusTone(item.status)} dot>
                            {item.status}
                          </Chip>
                        </td>

                        {/* Created At */}
                        <td>
                          <span className="text-xs text-[var(--ink-3)] font-medium">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </td>

                        {/* Action */}
                        <td>
                          <div className="flex items-center gap-2">
                            <select
                              className="px-2 py-1 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded text-[11px] font-medium text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)] cursor-pointer"
                              value={item.status}
                              onChange={(e) => handleStatusChange(item._id, e.target.value)}
                            >
                              <option value="published">Published</option>
                              <option value="pending">Pending</option>
                              <option value="hidden">Hidden</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            <button
                              type="button"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              onClick={() => handleOpenDetails(item)}
                              title="View Details"
                            >
                              <Icon name="info" size={14} />
                            </button>

                            <button
                              type="button"
                              className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              onClick={() => setDeleteModalReviewId(item._id)}
                              title="Delete Review"
                            >
                              <Icon name="x" size={14} />
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
          {/* {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--hair-2)] text-xs text-[var(--ink-3)]">
              <div>
                Showing{" "}
                <strong className="font-semibold text-[var(--ink)]">
                  {pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1}
                </strong>{" "}
                to{" "}
                <strong className="font-semibold text-[var(--ink)]">
                  {Math.min(page * pagination.limit, pagination.total)}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-[var(--ink)]">
                  {pagination.total}
                </strong>{" "}
                reviews
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <Icon name="chevLeft" size={12} />
                  Previous
                </button>

                <span className="px-3 text-xs font-semibold text-[var(--ink-2)]">
                  Page {page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <Icon name="arrow" size={12} />
                </button>
              </div>
            </div>
          )} */}
        </Card>
      </div>

      {/* Review Details Modal */}
      {detailsModalReview && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-[640px] max-h-[85vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Review Details
                </h3>
                <Chip tone={getStatusTone(detailsModalReview.status)} dot>
                  {detailsModalReview.status}
                </Chip>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setDetailsModalReview(null)}
                aria-label="Close"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingDetails ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading review details...
                </div>
              ) : (
                <>
                  {/* Rating & Target */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Rating Given
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(detailsModalReview.rating)}
                        <span className="text-xs font-bold text-slate-700">
                          {detailsModalReview.rating} / 5
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Target Type
                      </span>
                      <Chip
                        tone={
                          detailsModalReview.targetType === "property"
                            ? "iris"
                            : detailsModalReview.targetType === "flatmaterequirement"
                            ? "sand"
                            : "mint"
                        }
                      >
                        {getTargetTypeLabel(detailsModalReview.targetType)}
                      </Chip>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Date Submitted
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatDateTime(detailsModalReview.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Details */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Reviewer Information
                    </h4>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div>
                        <span className="text-slate-400">Name: </span>
                        <span className="font-semibold text-slate-800">
                          {typeof detailsModalReview.reviewerId === "object"
                            ? [
                                detailsModalReview.reviewerId.firstName,
                                detailsModalReview.reviewerId.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ") || "User"
                            : "User"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Email: </span>
                        <span className="font-semibold text-slate-800">
                          {typeof detailsModalReview.reviewerId === "object"
                            ? detailsModalReview.reviewerId.email || "-"
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Mobile: </span>
                        <span className="font-semibold text-slate-800">
                          {typeof detailsModalReview.reviewerId === "object"
                            ? detailsModalReview.reviewerId.mobile || "-"
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Review Content
                    </h4>
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                      {detailsModalReview.title && (
                        <h5 className="text-sm font-semibold text-slate-900">
                          {detailsModalReview.title}
                        </h5>
                      )}
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {detailsModalReview.comment || "No comment provided."}
                      </p>
                    </div>
                  </div>

                  {/* Target Details if available */}
                  {detailsModalReview.target && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Target Details
                      </h4>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-800">
                        <div>
                          <span className="text-slate-400">Title: </span>
                          <span className="font-semibold">
                            {detailsModalReview.target.title ||
                              detailsModalReview.target.email ||
                              "Target Item"}
                          </span>
                        </div>
                        {detailsModalReview.target.slug && (
                          <div>
                            <span className="text-slate-400">Slug: </span>
                            <span className="font-mono text-slate-600">
                              /{detailsModalReview.target.slug}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                onClick={() => setDeleteModalReviewId(detailsModalReview._id)}
              >
                Delete Review
              </button>
              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all"
                onClick={() => setDetailsModalReview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalReviewId && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <h3 className="text-base font-semibold text-slate-900">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this review permanently? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setDeleteModalReviewId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleDeleteReview}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
