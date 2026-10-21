"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  INotificationItem,
  NotificationCategory,
  NotificationPagination,
  GetNotificationsFilters,
} from "@/types/notification.types";
import {
  fetchAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
} from "@/lib/api";
import { useToast } from "@/lib/toast";
import AdminNotificationItem from "./AdminNotificationItem";
import Pagination from "../ui/Pagination";
import {
  Bell,
  CheckCheck,
  Filter,
  Loader2,
  RotateCw,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import SegmentedFilter from "../ui/SegmentedFilter";

interface AdminNotificationListProps {
  onUnreadCountChange?: (count: number) => void;
  onOpenSettings?: () => void;
}

const CATEGORY_OPTIONS: Array<{
  key: NotificationCategory | "ALL";
  label: string;
}> = [
    { key: "ALL", label: "All Categories" },
    { key: "ADMINISTRATIVE", label: "Administrative" },
    { key: "LISTING_UPDATES", label: "Listings Moderation" },
    { key: "REPORTS_AND_REVIEWS", label: "Reports & Reviews" },
    { key: "ACCOUNT_AND_VERIFICATION", label: "Accounts & KYC" },
    { key: "INQUIRIES_AND_REQUESTS", label: "Inquiries & Contact" },
    { key: "SYSTEM", label: "System Alerts" },
    { key: "CHAT", label: "Chat" },
  ];

const TAB_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
    { value: "ALL", label: "All Categories" },
    { value: "UNREAD", label: "Unread" },
  ];

const LIMIT = 15;

export default function AdminNotificationList({
  onUnreadCountChange,
  onOpenSettings,
}: AdminNotificationListProps) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "UNREAD">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<
    NotificationCategory | "ALL"
  >("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<NotificationPagination>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const onUnreadRef = useRef(onUnreadCountChange);
  useEffect(() => {
    onUnreadRef.current = onUnreadCountChange;
  }, [onUnreadCountChange]);

  // Fetch notifications
  const loadNotifications = useCallback(
    async (currentPage = page, tab = selectedTab, cat = selectedCategory) => {
      setLoading(true);
      setError(null);

      const filters: GetNotificationsFilters = {
        page: currentPage,
        limit: LIMIT,
        isRead: tab === "UNREAD" ? false : undefined,
        category: cat === "ALL" ? undefined : cat,
      };

      try {
        const res = await fetchAdminNotifications(filters);
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setPagination(
            res.data.pagination || {
              page: currentPage,
              limit: LIMIT,
              total: 0,
              totalPages: 1,
            }
          );
          setUnreadCount(res.data.unreadCount || 0);
          onUnreadRef.current?.(res.data.unreadCount || 0);
        } else {
          setError(res.message || "Failed to load notifications");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [page, selectedTab, selectedCategory]
  );

  useEffect(() => {
    loadNotifications(page, selectedTab, selectedCategory);
  }, [page, selectedTab, selectedCategory, loadNotifications]);

  // Handle Tab Switch (All vs Unread)
  const handleTabChange = (tab: "ALL" | "UNREAD") => {
    setSelectedTab(tab);
    setPage(1);
  };

  // Handle Category Filter
  const handleCategoryChange = (cat: NotificationCategory | "ALL") => {
    setSelectedCategory(cat);
    setPage(1);
  };

  // Mark single notification read
  const handleMarkAsRead = async (id: string): Promise<boolean> => {
    try {
      const res = await markAdminNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      const res = await markAllAdminNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        onUnreadCountChange?.(0);
        toast("All alerts marked as read");
      } else {
        toast(res.message || "Failed to mark all as read");
      }
    } catch {
      toast("Error marking all alerts as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: string): Promise<boolean> => {
    try {
      const res = await deleteAdminNotification(id);
      if (res.success) {
        const item = notifications.find((n) => n._id === id);
        const wasUnread = item && !item.isRead;
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (wasUnread) {
          setUnreadCount((c) => Math.max(0, c - 1));
          onUnreadCountChange?.(Math.max(0, unreadCount - 1));
        }
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast("Notification deleted");
        return true;
      }
      toast(res.message || "Failed to delete notification");
      return false;
    } catch {
      toast("Error deleting notification");
      return false;
    }
  };

  const handleResetFilters = () => {
    setSelectedTab("ALL");
    setSelectedCategory("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filters & Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--hair)]">
        {/* All vs Unread Tabs */}
        <div className="flex items-center gap-2">
          {/* <button
            type="button"
            onClick={() => handleTabChange("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${selectedTab === "ALL"
                ? "bg-[var(--ember)] text-white shadow-xs"
                : "bg-[var(--card)] text-[var(--ink-3)] hover:text-[var(--ink-1)] border border-[var(--hair)]"
              }`}
          >
            All Alerts
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("UNREAD")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${selectedTab === "UNREAD"
                ? "bg-[var(--ember)] text-white shadow-xs"
                : "bg-[var(--card)] text-[var(--ink-3)] hover:text-[var(--ink-1)] border border-[var(--hair)]"
              }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${selectedTab === "UNREAD"
                    ? "bg-white text-[var(--ember)]"
                    : "bg-[var(--ember)] text-white"
                  }`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button> */}

          <SegmentedFilter
            value={selectedTab}
            options={TAB_OPTIONS.map((item) => ({
              value: item.value,
              label: item.label
            }))}
            onChange={(value) => {
              setSelectedTab(value as any);
              setPage(1);
            }}
          />
        </div>

        {/* Action Controls & Category Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          {/* <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as any)}
              aria-label="Filter by category"
              className="appearance-none bg-[var(--card)] border border-[var(--hair)] rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-[var(--ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ember)] cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-[var(--ink-4)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div> */}

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ember)] hover:opacity-80 px-2.5 py-1.5 rounded-lg hover:bg-[var(--canvas-2)] transition cursor-pointer disabled:opacity-50"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            className="btn btn-ghost sm"
            onClick={() => loadNotifications(page, selectedTab, selectedCategory)}
            disabled={loading}
          >
            <RotateCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadNotifications()}
            className="underline font-semibold hover:text-rose-950 cursor-pointer ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && notifications.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-start gap-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--hair)]"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--card)] rounded-2xl border border-[var(--hair)] text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--canvas-2)] flex items-center justify-center text-[var(--ember)] mb-3">
            <Bell size={24} />
          </div>
          <h3 className="text-sm font-bold text-[var(--ink-1)]">
            {selectedTab === "UNREAD"
              ? "No unread staff notifications"
              : selectedCategory !== "ALL"
                ? "No alerts found in this category"
                : "No notifications found"}
          </h3>
          <p className="text-xs text-[var(--ink-3)] max-w-sm mt-1">
            {selectedTab === "UNREAD"
              ? "You are caught up with all moderation notices and alerts."
              : "When new listings, reports, or verification requests arrive, they will appear here."}
          </p>

          {(selectedTab === "UNREAD" || selectedCategory !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--canvas-2)] hover:bg-[var(--canvas)] text-[var(--ink-1)] border border-[var(--hair)] transition active:scale-95 cursor-pointer"
            >
              View all alerts
            </button>
          )}
        </div>
      )}

      {/* Notification Items List */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <AdminNotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}
    </div>
  );
}
