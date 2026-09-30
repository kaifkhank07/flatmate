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

export default function SuperAdminDashboardPage() {
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
        title="Super Admin Dashboard"
        sub="Full administrative control over flatmate marketplace, admin staff, and platform operations."
        actions={
          <>
            <button className="btn btn-ghost sm" onClick={() => window.location.reload()}>
              <Icon name="refresh" size={13} /> Refresh
            </button>
            <Link className="btn btn-brand sm" href="/super-admin/admins">
              Manage Admins
            </Link>
          </>
        }
      />

      <Band
        eyebrow="Super Admin Panel · Master Overview"
        title={`Welcome back, <em>${currentAdmin?.name || "Super Admin"}</em>.`}
        body={`${stats?.totalUsers || 0} total marketplace users. ${stats?.totalAdmins || 0} registered admin staff members.`}
        metrics={[
          { label: "Total Users", value: "0", count: String(stats?.totalUsers || 0) },
          { label: "Active Users", value: "0", count: String(stats?.activeUsers || 0) },
          { label: "Verified Users", value: "0", count: String(stats?.verifiedUsers || 0) },
          { label: "Total Admins", value: "0", count: String(stats?.totalAdmins || 0) },
        ]}
        tiles={[
          { icon: "★", value: "0", label: "Admin Staff", count: String(stats?.totalAdmins || 0) },
          { icon: "✓", value: "0", label: "New Users Today", count: String(stats?.newUsersToday || 0) },
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
              label="Total Users"
              spark="M0 30 L15 26 L30 28 L45 19 L60 22 L75 13 L90 16 L105 8 L120 11"
            />
            <Kpi
              icon="✓"
              iconBg="var(--mint)"
              iconInk="var(--mint-ink)"
              chip="Active"
              value="0"
              count={String(stats?.activeUsers || 0)}
              label="Active Users"
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
              iconBg="var(--iris)"
              iconInk="var(--iris-ink)"
              chip="Staff"
              value="0"
              count={String(stats?.totalAdmins || 0)}
              label="Admin Accounts"
              spark="M0 28 L15 24 L30 26 L45 17 L60 20 L75 11 L90 14 L105 7 L120 9"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <Card>
              <CardHead title="Super Admin Controls" sub="Direct platform access" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Manage Platform Users</span>
                  <Link className="btn btn-ghost sm" href="/super-admin/users">
                    Go to Users ({stats?.totalUsers || 0})
                  </Link>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Manage Admin Staff</span>
                  <Link className="btn btn-ghost sm" href="/super-admin/admins">
                    Go to Admins ({stats?.totalAdmins || 0})
                  </Link>
                </div>
              </div>
            </Card>

            <Card>
              <CardHead title="Quick Operations" sub="Super Admin Shortcuts" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <Link className="btn btn-brand" href="/super-admin/admins">
                  Manage Staff Admins
                </Link>
                <Link className="btn btn-ghost" href="/super-admin/users">
                  Manage Marketplace Users
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
