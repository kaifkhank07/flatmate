"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { brand } from "@/brand.config";
import { M } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import {
  getStoredAdminUser,
  adminLogout,
  AdminItem,
  fetchAdminUnreadCount,
  fetchAdminNotifications,
  markAllAdminNotificationsAsRead,
  markAdminNotificationAsRead,
  INotificationItem,
} from "@/lib/api";
import Icon from "./icons";
import { Avatar, Chip } from "./ui";
import { Bell, CheckCheck, Loader2, Settings, ExternalLink } from "lucide-react";

export default function Topbar({ onSearch }: { onSearch: () => void }) {
  const { toggle } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [pop, setPop] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);

  // Notification state
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<INotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState<boolean>(false);

  const ref = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const baseRoute = pathname.startsWith("/super-admin") ? "/super-admin" : "/admin";

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetchAdminUnreadCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore background error
    }
  }, []);

  const loadRecentNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetchAdminNotifications({ limit: 6 });
      if (res.success && res.data) {
        setRecentNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore background error
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentAdmin(getStoredAdminUser());
    refreshUnread();

    const interval = setInterval(refreshUnread, 30000); // 30s background sync

    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPop(false);
      if (!userRef.current?.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener("click", h);
    return () => {
      clearInterval(interval);
      document.removeEventListener("click", h);
    };
  }, [refreshUnread]);

  // Load notifications whenever popover opens
  useEffect(() => {
    if (pop) {
      loadRecentNotifications();
    }
  }, [pop, loadRecentNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllAdminNotificationsAsRead();
      if (res.success) {
        setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast("All marked read");
      }
    } catch {
      toast("Failed to mark all read");
    }
  };

  const handleNotificationClick = async (n: INotificationItem) => {
    if (!n.isRead) {
      markAdminNotificationAsRead(n._id).catch(() => { });
      setRecentNotifications((prev) =>
        prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setPop(false);
    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else {
      router.push(`${baseRoute}/notifications`);
    }
  };

  const formatShortTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      toast("Logged out successfully");
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="topbar">
      <div className="searchbar" onClick={onSearch}>
        <Icon name="search" size={15} />
        <input placeholder="Search users, admins, statistics…" readOnly />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-right">
        {brand.features.themeToggle && (
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
            <Icon name="sun" size={15} />
          </button>
        )}

        {brand.features.notifications && (
          <div className="pop-wrap" ref={ref}>
            <button
              // className="icon-btn notif relative"
              className="icon-btn relative"
              // onClick={(e) => {
              //   e.stopPropagation();
              //   setPop(!pop);
              // }}
              onClick={() => {
                setPop(false);
                router.push(`${baseRoute}/notifications`);
              }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Icon name="bell" size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-bold text-white bg-[var(--ember)] rounded-full border border-[var(--card)] shadow-xs animate-in zoom-in-50">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <div className={`pop ${pop ? "open" : ""}`} style={{ width: 340 }}>
              <div className="pop-head" style={{ borderBottom: "1px solid var(--hair)", paddingBottom: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <b>Notifications</b>
                  {unreadCount > 0 && (
                    <span className="chip ember" style={{ fontSize: 10, padding: "1px 6px" }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ fontSize: 11, cursor: "pointer" }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div style={{ maxHeight: 330, overflowY: "auto", margin: "-4px 0" }}>
                {notifLoading && recentNotifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>
                    <Loader2 size={16} className="animate-spin" style={{ margin: "0 auto 6px" }} />
                    <span>Loading alerts…</span>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>
                    <Bell size={20} style={{ margin: "0 auto 6px", opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>No notifications yet</p>
                    <small>Staff alerts and reports will show up here</small>
                  </div>
                ) : (
                  recentNotifications.map((n) => (
                    <div
                      className="n-item"
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        position: "relative",
                        background: !n.isRead ? "var(--canvas-2)" : undefined,
                        marginBottom: 4,
                      }}
                    >
                      {!n.isRead && (
                        <span
                          style={{
                            position: "absolute",
                            left: 2,
                            top: 8,
                            bottom: 8,
                            width: 3,
                            borderRadius: 2,
                            backgroundColor: "var(--ember)",
                          }}
                        />
                      )}
                      <span
                        className="n-ic"
                        style={{
                          background:
                            n.category === "REPORTS_AND_REVIEWS"
                              ? "var(--rose-soft)"
                              : n.category === "LISTING_UPDATES"
                                ? "var(--mint-soft)"
                                : n.category === "SYSTEM"
                                  ? "var(--ember-soft)"
                                  : "var(--canvas-2)",
                          color:
                            n.category === "REPORTS_AND_REVIEWS"
                              ? "var(--rose)"
                              : n.category === "LISTING_UPDATES"
                                ? "var(--mint-ink)"
                                : n.category === "SYSTEM"
                                  ? "var(--ember)"
                                  : "var(--ink-2)",
                        }}
                      >
                        {n.category === "REPORTS_AND_REVIEWS"
                          ? "🚩"
                          : n.category === "LISTING_UPDATES"
                            ? "🏠"
                            : n.category === "ACCOUNT_AND_VERIFICATION"
                              ? "👤"
                              : n.category === "SYSTEM"
                                ? "⚙️"
                                : "🔔"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.title}
                        </b>
                        <p
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {n.message}
                        </p>
                        <time>{formatShortTime(n.createdAt)}</time>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div
                style={{
                  borderTop: "1px solid var(--hair)",
                  marginTop: 6,
                  paddingTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Link
                  href={`${baseRoute}/notifications`}
                  onClick={() => setPop(false)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ember)",
                    textDecoration: "none",
                  }}
                >
                  View all alerts →
                </Link>

                <Link
                  href={`${baseRoute}/notifications`}
                  onClick={() => setPop(false)}
                  title="Notification Settings"
                  style={{
                    color: "var(--ink-3)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Settings size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="pop-wrap" ref={userRef}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setUserMenu(!userMenu);
            }}
          >
            {/* <Avatar src={M(32)} size={38} ring /> */}
            <div className="flex h-12 w-12 aspect-square items-center justify-center rounded-full bg-black/20 text-sm font-semibold icon-btn relative">
              {currentAdmin?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            {/* <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
              <strong style={{ lineHeight: 1.2 }}>{currentAdmin?.name || "Admin"}</strong>
              <Chip tone={currentAdmin?.role === "super_admin" ? "rose" : "iris"}>
                {currentAdmin?.role === "super_admin" ? "Super Admin" : "Admin"}
              </Chip>
            </div> */}
          </div>

          <div className={`pop ${userMenu ? "open" : ""}`} style={{ right: 0, width: 200, padding: 8 }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{currentAdmin?.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{currentAdmin?.email}</div>
            </div>
            <button
              className="btn btn-ghost sm"
              style={{ width: "100%", justifyContent: "flex-start", color: "var(--rose-ink)" }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
