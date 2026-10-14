"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  getSuperAdminDashboardStats,
  SuperAdminDashboardData,
  getStoredAdminUser,
  AdminItem,
} from "@/lib/api";
import {
  DashboardHeader,
  DashboardWelcomeBand,
  DashboardKpiGrid,
  UserStatusSummary,
  ListingStatistics,
  DashboardQuickActions,
  DashboardCharts,
  DashboardRecentActivity,
  PlatformMastersSummary,
  AdminStaffSummary,
} from "@/components/dashboard";

export default function SuperAdminDashboardPage() {
  usePageMotion();
  const toast = useToast();

  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await getSuperAdminDashboardStats();
        if (!isMountedRef.current) return;

        if (res.success && res.data) {
          setData(res.data);
          if (isRefresh) {
            toast("Dashboard metrics updated successfully");
          }
        } else {
          toast(res.message || "Failed to load super admin dashboard data");
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          toast(err?.message || "Error fetching super admin dashboard statistics");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    isMountedRef.current = true;
    setCurrentAdmin(getStoredAdminUser());
    loadDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboard]);

  const handleRefresh = () => {
    loadDashboard(true);
  };

  return (
    <>
      <DashboardHeader
        title="Super Admin Dashboard"
        sub="Full administrative control over flatmate marketplace, admin staff, and platform operations."
        role="super_admin"
        onRefresh={handleRefresh}
        refreshing={refreshing}
        manageLink={{ href: "/super-admin/admins", label: "Manage Admins" }}
      />

      {loading && !data ? (
        <div
          className="band gs"
          style={{
            minHeight: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading live dashboard metrics…</div>
        </div>
      ) : data ? (
        <>
          <DashboardWelcomeBand
            adminName={currentAdmin?.name || "Super Admin"}
            role="super_admin"
            summary={data.summary}
          />

          <div className="canvas-grid">
            <div className="stream" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Dynamic 4-Column KPI Grid */}
              <DashboardKpiGrid role="super_admin" summary={data.summary} />

              {/* Status and Listing Dynamic Breakdowns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <UserStatusSummary
                  users={data.breakdown.users}
                  usersLink="/super-admin/users"
                  role="super_admin"
                />
                <ListingStatistics
                  listings={data.breakdown.listings}
                  role="super_admin"
                />
              </div>

              {/* Dynamic 6-Month Trend & Status Distribution */}
              <DashboardCharts charts={data.charts} title="Marketplace Registration Trend" />

              {/* Dynamic Moderation Queue & Recent Activity */}
              <DashboardRecentActivity
                role="super_admin"
                recentActivity={data.recentActivity}
              />
            </div>

            {/* Purely Dynamic Right Rail */}
            <aside className="rail" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <DashboardQuickActions
                role="super_admin"
                pendingWorkload={data.summary.pendingModerationCount}
              />
              <AdminStaffSummary admins={data.breakdown.admins} />
              <PlatformMastersSummary masters={data.breakdown.platformMasters} />
            </aside>
          </div>
        </>
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-4)" }}>
          Failed to load dashboard data. Click{" "}
          <button className="btn btn-ghost sm" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}
    </>
  );
}
