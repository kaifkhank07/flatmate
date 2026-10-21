"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageHead from "../ui/PageHead";
import AdminNotificationList from "./AdminNotificationList";
import AdminNotificationPreferences from "./AdminNotificationPreferences";
import { fetchAdminUnreadCount } from "@/lib/api";
import { Bell, Sliders, ChevronDown, Mail, ShieldAlert, ArrowLeft } from "lucide-react";

type NotificationTab = "inbox" | "preferences";

interface AdminNotificationsManagerProps {
  eyebrow?: string;
  title?: string;
  sub?: string;
  baseRoute?: string;
}

export default function AdminNotificationsManager({
  eyebrow = "Administration",
  title = "Notifications & Alerts",
  sub = "Manage incoming moderation notices, platform activities, and configure staff delivery channels.",
  baseRoute = "/admin",
}: AdminNotificationsManagerProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>("inbox");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSettingsOpen]);

  // Initial fetch unread count
  useEffect(() => {
    fetchAdminUnreadCount()
      .then((res) => {
        if (res.success && res.data) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  const getHeading = () => {
    if (activeTab === "preferences") {
      return {
        title: "Notification Channels & Preferences",
        sub: "Configure master delivery channels (Email, SMS, WhatsApp) and category delivery rules.",
      };
    }
    return {
      title,
      sub,
    };
  };

  const currentHeading = getHeading();

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <PageHead
        eyebrow={eyebrow}
        title={currentHeading.title}
        sub={currentHeading.sub}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Unread Badge (when on inbox) */}
            {activeTab === "inbox" && unreadCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--canvas-2)] border border-[var(--hair)] text-xs font-semibold text-[var(--ember)]">
                <span className="w-2 h-2 rounded-full bg-[var(--ember)] animate-pulse" />
                <span>{unreadCount > 99 ? "99+" : unreadCount} Unread</span>
              </div>
            )}

            {/* View Switcher / Settings Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none ${
                  activeTab === "preferences" || isSettingsOpen
                    ? "bg-[var(--ember)] text-white border-[var(--ember)] shadow-xs"
                    : "bg-[var(--card)] text-[var(--ink-2)] hover:text-[var(--ink-1)] border-[var(--hair)]"
                }`}
              >
                <Sliders size={13} />
                <span>{activeTab === "preferences" ? "Preferences" : "Settings"}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    isSettingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSettingsOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 p-1.5 rounded-xl bg-[var(--card)] border border-[var(--hair)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider">
                    Staff Notification Options
                  </div>

                  {activeTab !== "inbox" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("inbox");
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink-1)] transition cursor-pointer"
                    >
                      <Bell size={14} className="text-[var(--ink-3)]" />
                      <div>
                        <div className="font-semibold">Back to Inbox</div>
                        <div className="text-[10px] text-[var(--ink-4)]">
                          View incoming alert feed
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("preferences");
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition cursor-pointer ${
                      activeTab === "preferences"
                        ? "bg-[var(--canvas-2)] text-[var(--ember)] font-semibold"
                        : "text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink-1)]"
                    }`}
                  >
                    <Sliders size={14} />
                    <div>
                      <div className="font-semibold">Channels & Delivery</div>
                      <div className="text-[10px] text-[var(--ink-4)]">
                        In-App, Email, SMS & WhatsApp
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Main Tab Panels */}
      <div style={{ display: activeTab === "inbox" ? "block" : "none" }}>
        <AdminNotificationList
          onUnreadCountChange={handleUnreadCountChange}
          onOpenSettings={() => setActiveTab("preferences")}
        />
      </div>

      <div style={{ display: activeTab === "preferences" ? "block" : "none" }}>
        <AdminNotificationPreferences onBack={() => setActiveTab("inbox")} />
      </div>
    </div>
  );
}
