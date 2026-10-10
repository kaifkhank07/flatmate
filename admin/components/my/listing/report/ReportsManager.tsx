"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
    fetchReports,
    fetchTargetReports,
    updateReportStatus,
    updatePropertyStatusApi,
    updateFlatmateRequirementStatusApi,
    ReportGroupItem,
    SingleReportItem,
    PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, Chip, Tone } from "@/components/ui";

import PageHead from "../../ui/PageHead";

const LIMIT = 10;

const TARGET_TYPE_FILTERS = [
    { value: "all", label: "All Types" },
    { value: "property", label: "Property" },
    { value: "flatmaterequirement", label: "Flatmate Requirement" },
] as const;

const TARGET_STATUS_FILTERS = [
    { value: "all", label: "All Target Statuses" },
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "blocked", label: "Blocked" },
    { value: "closed", label: "Closed" },
    { value: "expired", label: "Expired" },
] as const;

export default function ReportsManager({
    eyebrow = "Admin Staff Panel",
    title = "Reports",
    sub = "Review, inspect details, update target status, and manage marketplace reports.",
}: {
    eyebrow?: string;
    title?: string;
    sub?: string;
}) {
    usePageMotion();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ReportGroupItem[]>([]);

    const [pagination, setPagination] = useState<PaginationMeta>({
        page: 1,
        limit: LIMIT,
        total: 0,
        totalPages: 1,
    });

    const [selectedTargetType, setSelectedTargetType] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);

    // Reports details modal state
    const [reportsModalTarget, setReportsModalTarget] = useState<ReportGroupItem | null>(null);
    const [reportsModalTargetDetails, setReportsModalTargetDetails] = useState<any>(null);
    const [reportsList, setReportsList] = useState<SingleReportItem[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Block action state inside modal
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [blockingTarget, setBlockingTarget] = useState(false);

    const loadReports = useCallback(async () => {
        try {
            setLoading(true);

            const res = await fetchReports({
                targetType: selectedTargetType === "all" ? undefined : selectedTargetType,
                status: selectedStatus === "all" ? undefined : selectedStatus,
                search: q.trim() || undefined,
                page,
                limit: LIMIT,
            });

            if (res.success && res.data) {
                setItems(res.data.items || []);
                setPagination({
                    page: res.data.page || page,
                    limit: res.data.limit || LIMIT,
                    total: res.data.total || 0,
                    totalPages:
                        res.data.totalPages ||
                        Math.ceil((res.data.total || 0) / (res.data.limit || LIMIT)) ||
                        1,
                });
            } else {
                toast(res.message || "Failed to load reports");
            }
        } catch (error) {
            console.error("[ReportsManager] Load error:", error);
            toast("Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, [selectedTargetType, selectedStatus, q, page, toast]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const handleResetFilters = () => {
        setSelectedTargetType("all");
        setSelectedStatus("all");
        setQ("");
        setPage(1);
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedTargetType !== "all") count++;
        if (selectedStatus !== "all") count++;
        if (q.trim()) count++;
        return count;
    }, [selectedTargetType, selectedStatus, q]);

    const getTargetTypeLabel = (type: string) => {
        if (type === "property") return "Property";
        if (type === "flatmaterequirement") return "Flatmate Requirement";
        return type;
    };

    const getTargetTone = (status?: string): Tone => {
        switch (status) {
            case "approved":
                return "mint";
            case "rejected":
            case "blocked":
                return "rose";
            case "closed":
                return "iris";
            case "pending":
            case "draft":
            case "expired":
                return "sand";
            default:
                return "sand";
        }
    };

    // Open reports details modal and fetch all reports for target
    const handleOpenReportsDialog = async (item: ReportGroupItem) => {
        setReportsModalTarget(item);
        setReportsModalTargetDetails(item.target || null);
        setLoadingReports(true);
        setReportsList([]);
        setShowBlockConfirm(false);

        try {
            const res = await fetchTargetReports(item.targetType, item.targetId);
            if (res.success && res.data) {
                setReportsList(res.data.reports || []);
                if (res.data.target) {
                    setReportsModalTargetDetails(res.data.target);
                }
            } else {
                toast(res.message || "Failed to fetch individual reports");
            }
        } catch (error) {
            console.error("[ReportsManager] fetchTargetReports error:", error);
            toast("Failed to fetch individual reports");
        } finally {
            setLoadingReports(false);
        }
    };

    const handleCloseReportsModal = () => {
        setReportsModalTarget(null);
        setReportsModalTargetDetails(null);
        setReportsList([]);
        setShowBlockConfirm(false);
    };

    // Update status of an individual report inside details modal
    const handleUpdateIndividualReportStatus = async (reportId: string, status: string) => {
        try {
            const res = await updateReportStatus(reportId, { status });
            if (res.success) {
                toast(`Report marked as ${status}`);
                // Refresh modal reports
                if (reportsModalTarget) {
                    handleOpenReportsDialog(reportsModalTarget);
                }
                loadReports();
            } else {
                toast(res.message || "Failed to update report status");
            }
        } catch (error) {
            console.error("[ReportsManager] updateReportStatus error:", error);
            toast("Failed to update report status");
        }
    };

    // Confirm block action for target (Property or Flatmate Requirement)
    const handleConfirmBlockTarget = async () => {
        if (!reportsModalTarget) return;

        try {
            setBlockingTarget(true);
            const { targetType, targetId } = reportsModalTarget;

            let res;
            if (targetType === "property") {
                res = await updatePropertyStatusApi(targetId, "blocked");
            } else {
                res = await updateFlatmateRequirementStatusApi(targetId, "blocked");
            }

            if (res.success) {
                toast(`${getTargetTypeLabel(targetType)} blocked successfully.`);
                setShowBlockConfirm(false);
                // Refresh parent table
                loadReports();
                // Refresh target details displayed in the modal
                await handleOpenReportsDialog(reportsModalTarget);
            } else {
                toast(res.message || "Failed to block listing");
            }
        } catch (error) {
            console.error("[ReportsManager] Block target error:", error);
            toast("Failed to block listing");
        } finally {
            setBlockingTarget(false);
        }
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }) + ", " + d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
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
                            onClick={loadReports}
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
                    {/* Filters */}
                    <div className="table-tools flex-wrap gap-3">
                        <div
                            className="table-search"
                            style={{ minWidth: 220, flex: 1 }}
                        >
                            <Icon name="search" size={14} />
                            <input
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search title, slug, reason..."
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
                                {TARGET_TYPE_FILTERS.map((filter) => (
                                    <option key={filter.value} value={filter.value}>
                                        {filter.label}
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
                                {TARGET_STATUS_FILTERS.map((filter) => (
                                    <option key={filter.value} value={filter.value}>
                                        {filter.label}
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

                    {/* Main Table */}
                    <div style={{ overflowX: "auto" }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Reports</th>
                                    <th>Latest Report</th>
                                    <th>Listing Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            style={{
                                                textAlign: "center",
                                                padding: 34,
                                                color: "var(--ink-4)",
                                            }}
                                        >
                                            Loading reports...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            style={{
                                                textAlign: "center",
                                                padding: 34,
                                                color: "var(--ink-4)",
                                            }}
                                        >
                                            No reports found.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => {
                                        const currentTargetStatus =
                                            item.targetStatus || item.target?.status || "unknown";

                                        return (
                                            <tr key={`${item.targetType}-${item.targetId}`}>
                                                {/* Name */}
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-[var(--ink)]">
                                                            {item.title || item.target?.title || "Unnamed Item"}
                                                        </span>

                                                        {item.slug && (
                                                            <span className="text-[11px] text-[var(--ink-4)]">
                                                                /{item.slug}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td>
                                                    <Chip tone={item.targetType === "property" ? "iris" : "sand"}>
                                                        {getTargetTypeLabel(item.targetType)}
                                                    </Chip>
                                                </td>

                                                {/* Reports Count Button */}
                                                <td>
                                                    <Chip>
                                                        {item.reportCount} {item.reportCount === 1 ? "Report" : "Reports"}
                                                    </Chip>
                                                </td>

                                                {/* Latest Report Date */}
                                                <td>
                                                    <span className="text-xs text-[var(--ink-3)] font-medium">
                                                        {formatDateTime(item.latestReport?.createdAt || item.createdAt)}
                                                    </span>
                                                </td>

                                                {/* Status (Target Status) */}
                                                <td>
                                                    <Chip tone={getTargetTone(currentTargetStatus)} dot>
                                                        {currentTargetStatus.charAt(0).toUpperCase() + currentTargetStatus.slice(1)}
                                                    </Chip>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost sm"
                                                        onClick={() => handleOpenReportsDialog(item)}
                                                    >
                                                        Check Reports
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
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
                                reported items
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
                    )}
                </Card>
            </div>

            {/* Reports Details Modal */}
            {reportsModalTarget && (() => {
                const currentTargetStatus =
                    reportsModalTargetDetails?.status ||
                    reportsModalTarget.targetStatus ||
                    reportsModalTarget.target?.status ||
                    "unknown";
                const isBlocked = currentTargetStatus === "blocked";

                return (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                        <div className="w-full max-w-[850px] max-h-[85vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            Reports - {reportsModalTargetDetails?.title || reportsModalTarget.title || reportsModalTarget.target?.title || "Unnamed Target"}
                                        </h3>
                                        <Chip tone={reportsModalTarget.targetType === "property" ? "iris" : "sand"}>
                                            {getTargetTypeLabel(reportsModalTarget.targetType)}
                                        </Chip>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Displaying {reportsList.length} individual report{reportsList.length !== 1 ? "s" : ""} filed for this target.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    onClick={handleCloseReportsModal}
                                    aria-label="Close"
                                >
                                    <Icon name="x" size={14} />
                                </button>
                            </div>

                            {/* Target Details Card */}
                            {/* {reportsModalTargetDetails && (
                                <div className="p-4 bg-slate-50/80 border-b border-slate-200 text-slate-800 space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">Target Details</span>
                                            <Chip tone={getTargetTone(reportsModalTargetDetails.status)} dot>
                                                {reportsModalTargetDetails.status || "unknown"}
                                            </Chip>
                                        </div>
                                        {reportsModalTargetDetails.slug && (
                                            <span className="text-[11px] text-slate-500 font-mono">/{reportsModalTargetDetails.slug}</span>
                                        )}
                                    </div>

                                    {reportsModalTargetDetails.description && (
                                        <p className="text-xs text-slate-600 line-clamp-2 bg-white/60 p-2 rounded-lg border border-slate-100">
                                            {reportsModalTargetDetails.description}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
                                            <span className="font-semibold text-slate-800">
                                                {typeof reportsModalTargetDetails.location === "object" && reportsModalTargetDetails.location?.name
                                                    ? reportsModalTargetDetails.location.name
                                                    : typeof reportsModalTargetDetails.location === "object" && reportsModalTargetDetails.location?.city
                                                        ? reportsModalTargetDetails.location.city
                                                        : typeof reportsModalTargetDetails.location === "string"
                                                            ? reportsModalTargetDetails.location
                                                            : "-"}
                                            </span>
                                        </div>

                                        {reportsModalTarget.targetType === "flatmaterequirement" ? (
                                            <>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Post Type</span>
                                                    <span className="font-semibold text-slate-800 capitalize">
                                                        {reportsModalTargetDetails.postType || "-"}
                                                        {reportsModalTargetDetails.postType === "property" && reportsModalTargetDetails.propertyType && (
                                                            <span className="text-slate-500 font-normal"> ({reportsModalTargetDetails.propertyType})</span>
                                                        )}
                                                        {reportsModalTargetDetails.postType === "partner" && reportsModalTargetDetails.partnerType && (
                                                            <span className="text-slate-500 font-normal"> ({reportsModalTargetDetails.partnerType})</span>
                                                        )}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preferences</span>
                                                    <span className="font-semibold text-slate-800 capitalize">
                                                        {[
                                                            reportsModalTargetDetails.genderPreference && `Gender: ${reportsModalTargetDetails.genderPreference}`,
                                                            reportsModalTargetDetails.occupationPreference && `Role: ${reportsModalTargetDetails.occupationPreference.replace(/_/g, " ")}`,
                                                        ].filter(Boolean).join(" • ") || "-"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Range</span>
                                                    <span className="font-semibold text-slate-800">
                                                        {reportsModalTargetDetails.budget !== undefined && reportsModalTargetDetails.budget !== null
                                                            ? `₹${(typeof reportsModalTargetDetails.budget === "number" ? reportsModalTargetDetails.budget : ((reportsModalTargetDetails.budget as any).max || (reportsModalTargetDetails.budget as any).min || 0)).toLocaleString()}`
                                                            : "-"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {reportsModalTargetDetails.rent !== undefined && (
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rent</span>
                                                        <span className="font-semibold text-slate-800">₹{reportsModalTargetDetails.rent.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )} */}

                            {/* Body Table */}
                            <div className="p-5 overflow-y-auto flex-1">
                                {loadingReports ? (
                                    <div className="py-12 text-center text-xs text-slate-400">Loading report details...</div>
                                ) : reportsList.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-slate-400">No individual reports found.</div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                                                <th className="pb-2">Reporter</th>
                                                <th className="pb-2">Reason</th>
                                                <th className="pb-2">Description</th>
                                                <th className="pb-2">Reported At</th>
                                                <th className="pb-2 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reportsList.map((r) => {
                                                const reporterName =
                                                    typeof r.userId === "object" && r.userId?.name
                                                        ? r.userId.name
                                                        : "Anonymous User";

                                                const reporterContact =
                                                    typeof r.userId === "object"
                                                        ? r.userId?.email || r.userId?.mobile || "-"
                                                        : r.userId || "-";

                                                return (
                                                    <tr key={r._id} className="hover:bg-slate-50/60">
                                                        <td className="py-3 pr-2">
                                                            <div className="font-semibold text-slate-900">{reporterName}</div>
                                                            <div className="text-[11px] text-slate-500">{reporterContact}</div>
                                                        </td>
                                                        <td className="py-3 pr-2">
                                                            <span className="font-medium text-slate-800 capitalize">
                                                                {r.reason ? r.reason.replace(/_/g, " ") : "Other"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 pr-2 max-w-[220px]">
                                                            <p className="text-slate-600 truncate" title={r.description || "-"}>
                                                                {r.description || "-"}
                                                            </p>
                                                        </td>
                                                        <td className="py-3 pr-2 text-slate-500 whitespace-nowrap">
                                                            {formatDateTime(r.createdAt)}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <select
                                                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                                                                value={r.status}
                                                                onChange={(e) => handleUpdateIndividualReportStatus(r._id, e.target.value)}
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="reviewed">Reviewed</option>
                                                                <option value="resolved">Resolved</option>
                                                                <option value="dismissed">Dismissed</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Block Action Below Reports List */}
                            <div className="mx-5 mb-4 p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Target Listing Action</span>
                                        <Chip tone={getTargetTone(currentTargetStatus)} dot>
                                            {currentTargetStatus}
                                        </Chip>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        {isBlocked
                                            ? "This listing is currently blocked and is hidden from marketplace users."
                                            : "Block this listing if it violates community guidelines. This will prevent users from viewing or contacting this listing."}
                                    </p>
                                </div>

                                <div>
                                    {isBlocked ? (
                                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                            Listing Blocked
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                            onClick={() => setShowBlockConfirm(true)}
                                        >
                                            Block Listing
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                                <button
                                    type="button"
                                    className="px-5 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all"
                                    onClick={handleCloseReportsModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Block Confirmation Dialog */}
            {showBlockConfirm && reportsModalTarget && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-full bg-red-100 text-red-600 shrink-0">
                                <Icon name="x" size={20} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Block Listing</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {reportsModalTargetDetails?.title || reportsModalTarget.title || reportsModalTarget.target?.title || "Target Listing"}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Are you sure you want to block this listing? It may no longer be available to marketplace users.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                                onClick={() => setShowBlockConfirm(false)}
                                disabled={blockingTarget}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                onClick={handleConfirmBlockTarget}
                                disabled={blockingTarget}
                            >
                                {blockingTarget ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Blocking...
                                    </>
                                ) : (
                                    "Confirm Block"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}