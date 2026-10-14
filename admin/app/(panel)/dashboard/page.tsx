"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  getSuperAdminDashboardStats,
  getAdminDashboardStats,
  SuperAdminDashboardData,
  AdminDashboardData,
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
  ModerationWorkloadSummary,
  AdminStaffSummary,
} from "@/components/dashboard";

export default function DashboardPage() {
  usePageMotion();
  const toast = useToast();

  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);
  const [data, setData] = useState<SuperAdminDashboardData | AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      const admin = getStoredAdminUser();
      const isSuper = admin?.role === "super_admin";

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = isSuper
          ? await getSuperAdminDashboardStats()
          : await getAdminDashboardStats();

        if (!isMountedRef.current) return;

        if (res.success && res.data) {
          setData(res.data);
          if (isRefresh) {
            toast("Dashboard operational metrics updated");
          }
        } else {
          toast(res.message || "Failed to load dashboard statistics");
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          toast(err?.message || "Error fetching dashboard statistics");
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
    const admin = getStoredAdminUser();
    setCurrentAdmin(admin);
    loadDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboard]);

  const handleRefresh = () => {
    loadDashboard(true);
  };

  const isSuperAdmin = currentAdmin?.role === "super_admin";
  const role: "super_admin" | "admin" = isSuperAdmin ? "super_admin" : "admin";

  return (
    <>
      <DashboardHeader
        title={isSuperAdmin ? "Super Admin Command Centre" : "Admin Staff Dashboard"}
        sub="Flatmate Marketplace real-time user metrics, listing moderation, and system overview."
        role={role}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        manageLink={
          isSuperAdmin
            ? { href: "/super-admin/admins", label: "Manage Admins" }
            : { href: "/admin/users", label: "Manage Users" }
        }
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
            adminName={currentAdmin?.name || "Admin"}
            role={role}
            summary={data.summary}
          />

          <div className="canvas-grid">
            <div className="stream" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Dynamic 4-Column KPI Grid */}
              <DashboardKpiGrid role={role} summary={data.summary} />

              {/* Status and Listing Dynamic Breakdowns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <UserStatusSummary
                  users={data.breakdown.users}
                  usersLink={isSuperAdmin ? "/super-admin/users" : "/admin/users"}
                  role={role}
                />
                <ListingStatistics
                  listings={data.breakdown.listings}
                  role={role}
                />
              </div>

              {/* Dynamic 6-Month Trend & Status Distribution Charts */}
              <DashboardCharts charts={data.charts} />

              {/* Dynamic Moderation Workload & Pending Review Items */}
              <DashboardRecentActivity
                role={role}
                recentActivity={data.recentActivity}
              />
            </div>

            {/* Purely Dynamic Right Rail */}
            <aside className="rail" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <DashboardQuickActions
                role={role}
                pendingWorkload={
                  isSuperAdmin
                    ? (data as SuperAdminDashboardData).summary.pendingModerationCount
                    : (data as AdminDashboardData).summary.totalPendingWorkload
                }
              />
              {isSuperAdmin ? (
                <>
                  <AdminStaffSummary admins={(data as SuperAdminDashboardData).breakdown.admins} />
                  <PlatformMastersSummary masters={(data as SuperAdminDashboardData).breakdown.platformMasters} />
                </>
              ) : (
                <ModerationWorkloadSummary workload={(data as AdminDashboardData).breakdown.workload} />
              )}
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
