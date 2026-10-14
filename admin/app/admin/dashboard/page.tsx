"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  getAdminDashboardStats,
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
  ModerationWorkloadSummary,
  RevenueDashboard,
  NewUserRegistrations,
} from "@/components/dashboard";

export default function AdminDashboardPage() {
  usePageMotion();
  const toast = useToast();

  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await getAdminDashboardStats();
        if (!isMountedRef.current) return;

        if (res.success && res.data) {
          setData(res.data);
          if (isRefresh) {
            toast("Dashboard operational metrics updated");
          }
        } else {
          toast(res.message || "Failed to load admin dashboard data");
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          toast(err?.message || "Error fetching admin dashboard statistics");
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
        title="Admin Staff Dashboard"
        sub="Flatmate Marketplace user metrics, listing moderation, and operational workload."
        role="admin"
        onRefresh={handleRefresh}
        refreshing={refreshing}
        manageLink={{ href: "/admin/users", label: "Manage Users" }}
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
          <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading operational metrics…</div>
        </div>
      ) : data ? (
        <>
          <DashboardWelcomeBand
            adminName={currentAdmin?.name || "Admin"}
            role="admin"
            summary={data.summary}
          />

          <div className="stream mt-4 sm:mt-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Dynamic 4-Column KPI Grid */}
            <DashboardKpiGrid role="admin" summary={data.summary} />

            {/* Revenue Dashboard */}
            {/* <RevenueDashboard revenue={data.revenue} /> */}

            {/* Status and Listing Dynamic Breakdowns */}
            {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <UserStatusSummary
                users={data.breakdown.users}
                usersLink="/admin/users"
                role="admin"
              />
              <ListingStatistics
                listings={data.breakdown.listings}
                role="admin"
              />
            </div> */}

            {/* Dynamic 6-Month Trend & Status Distribution */}
            <DashboardCharts charts={data.charts} title="User Growth Analytics" />

            {/* New User Registrations */}
            <NewUserRegistrations
              recentUsers={data.recentActivity?.recentUsers}
              usersLink="/admin/users"
            />

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
