"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { getDashboardStats, DashboardStatsData, getStoredAdminUser, AdminItem } from "@/lib/api";
import Band from "@/components/band";
import Icon from "@/components/icons";
import { Card, CardHead, PageHead } from "@/components/ui";
import { Kpi } from "@/components/charts";
import { FollowUpTasks, MiniCalendar, QuickConnects, RailHead } from "@/components/rail";

export default function AdminDashboardPage() {
  usePageMotion();
  const toast = useToast();

  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentAdmin(getStoredAdminUser());

    const loadStats = async () => {
      const res = await getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        toast(res.message || "Failed to load dashboard statistics");
      }
      setLoading(false);
    };

    loadStats();
  }, [toast]);

  return (
    <>
      <PageHead
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        title="Admin Staff Dashboard"
        sub="Flatmate Marketplace user metrics, account status, and verifications."
        actions={
          <>
            <button className="btn btn-ghost sm" onClick={() => window.location.reload()}>
              <Icon name="refresh" size={13} /> Refresh
            </button>
            <Link className="btn btn-brand sm" href="/admin/users">
              Manage Users
            </Link>
          </>
        }
      />

      <Band
        eyebrow="Admin Panel · Operational"
        title={`Welcome back, <em>${currentAdmin?.name || "Admin"}</em>.`}
        body={`${stats?.totalUsers || 0} total marketplace users. ${stats?.activeUsers || 0} active user accounts.`}
        metrics={[
          { label: "Total Users", value: "0", count: String(stats?.totalUsers || 0) },
          { label: "Active Users", value: "0", count: String(stats?.activeUsers || 0) },
          { label: "Verified Users", value: "0", count: String(stats?.verifiedUsers || 0) },
          { label: "Blocked Users", value: "0", count: String(stats?.blockedUsers || 0) },
        ]}
        tiles={[
          { icon: "✓", value: "0", label: "New Today", count: String(stats?.newUsersToday || 0) },
          { icon: "★", value: "0", label: "New This Month", count: String(stats?.newUsersThisMonth || 0) },
        ]}
      />

      <div className="canvas-grid">
        <div className="stream">
          <div className="kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <Kpi
              icon={<Icon name="users" />}
              iconBg="var(--lav)"
              iconInk="var(--lav-ink)"
              chip="Live"
              value="0"
              count={String(stats?.totalUsers || 0)}
              label="Total Registered Users"
              spark="M0 30 L15 26 L30 28 L45 19 L60 22 L75 13 L90 16 L105 8 L120 11"
            />
            <Kpi
              icon="✓"
              iconBg="var(--mint)"
              iconInk="var(--mint-ink)"
              chip="Active"
              value="0"
              count={String(stats?.activeUsers || 0)}
              label="Active Accounts"
              spark="M0 32 L15 29 L30 30 L45 23 L60 26 L75 19 L90 21 L105 13 L120 15"
              stroke="var(--mint-ink)"
            />
            <Kpi
              icon="!"
              iconBg="var(--rose)"
              iconInk="var(--rose-ink)"
              chip="Blocked"
              chipTone="rose"
              value="0"
              count={String(stats?.blockedUsers || 0)}
              label="Blocked Users"
              spark="M0 13 L15 17 L30 15 L45 22 L60 18 L75 24 L90 21 L105 28 L120 26"
            />
            <Kpi
              icon="◍"
              iconBg="var(--sea)"
              iconInk="var(--sea-ink)"
              chip="Verified"
              value="0"
              count={String(stats?.verifiedUsers || 0)}
              label="Verified Profiles"
              spark="M0 28 L15 24 L30 26 L45 17 L60 20 L75 11 L90 14 L105 7 L120 9"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <Card>
              <CardHead title="User Status Summary" sub="Account status distribution" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Active Users</span>
                  <strong style={{ color: "var(--mint-ink)" }}>{stats?.activeUsers || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Pending Verification</span>
                  <strong style={{ color: "var(--sand-ink)" }}>{stats?.pendingUsers || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Blocked Accounts</span>
                  <strong style={{ color: "var(--rose-ink)" }}>{stats?.blockedUsers || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Deleted Accounts</span>
                  <strong style={{ color: "var(--ink-4)" }}>{stats?.deletedUsers || 0}</strong>
                </div>
              </div>
            </Card>

            <Card>
              <CardHead title="Quick Actions" sub="Admin Operations" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <Link className="btn btn-brand" href="/admin/users">
                  Manage Users Page
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <aside className="rail">
          <RailHead title="System Summary" />
          <QuickConnects />
          <FollowUpTasks />
          <MiniCalendar />
        </aside>
      </div>
    </>
  );
}
