"use client";
import { Kpi } from "@/components/charts";
import Icon from "@/components/icons";
import { SuperAdminDashboardData, AdminDashboardData } from "@/lib/api";

export interface DashboardKpiGridProps {
  role: "super_admin" | "admin";
  summary: SuperAdminDashboardData["summary"] | AdminDashboardData["summary"];
}

export default function DashboardKpiGrid({
  role,
  summary,
}: DashboardKpiGridProps) {
  const isSuperAdmin = role === "super_admin";
  const superSummary = summary as SuperAdminDashboardData["summary"];
  const adminSummary = summary as AdminDashboardData["summary"];

  if (isSuperAdmin) {
    return (
      <div className="kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi
          icon={<Icon name="users" />}
          iconBg="var(--lav)"
          iconInk="var(--lav-ink)"
          chip="Live"
          value={String(summary.totalUsers)}
          count={String(summary.totalUsers)}
          label="Total Users"
          spark="M0 30 L15 26 L30 28 L45 19 L60 22 L75 13 L90 16 L105 8 L120 11"
        />
        <Kpi
          icon="✓"
          iconBg="var(--mint)"
          iconInk="var(--mint-ink)"
          chip="Approved"
          chipTone="mint"
          value={String(summary.activeListings)}
          count={String(summary.activeListings)}
          label="Active Listings"
          spark="M0 32 L15 29 L30 30 L45 23 L60 26 L75 19 L90 21 L105 13 L120 15"
          stroke="var(--mint-ink)"
        />
        <Kpi
          icon="!"
          iconBg="var(--sand)"
          iconInk="var(--sand-ink)"
          chip="Action"
          chipTone="sand"
          value={String(superSummary.pendingModerationCount ?? 0)}
          count={String(superSummary.pendingModerationCount ?? 0)}
          label="Pending Moderation"
          spark="M0 13 L15 17 L30 15 L45 22 L60 18 L75 24 L90 21 L105 28 L120 26"
          stroke="var(--sand-ink)"
        />
        <Kpi
          icon="★"
          iconBg="var(--iris)"
          iconInk="var(--iris-ink)"
          chip="Staff"
          chipTone="iris"
          value={String(superSummary.totalAdmins ?? 0)}
          count={String(superSummary.totalAdmins ?? 0)}
          label="Admin Staff"
          spark="M0 28 L15 24 L30 26 L45 17 L60 20 L75 11 L90 14 L105 7 L120 9"
        />
      </div>
    );
  }

  return (
    <div className="kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      <Kpi
        icon={<Icon name="users" />}
        iconBg="var(--lav)"
        iconInk="var(--lav-ink)"
        chip="Total"
        value={String(summary.totalUsers)}
        count={String(summary.totalUsers)}
        label="Total Users"
        spark="M0 30 L15 26 L30 28 L45 19 L60 22 L75 13 L90 16 L105 8 L120 11"
      />

      <Kpi
        icon={<Icon name="user-check" />}
        iconBg="var(--mint)"
        iconInk="var(--mint-ink)"
        chip="Active"
        chipTone="mint"
        value={String(summary.activeUsers)}
        count={String(summary.activeUsers)}
        label="Active Users"
        spark="M0 32 L15 29 L30 30 L45 23 L60 26 L75 19 L90 21 L105 13 L120 15"
        stroke="var(--mint-ink)"
      />
      <Kpi
        icon="✓"
        iconBg="var(--mint)"
        iconInk="var(--mint-ink)"
        chip="Approved"
        chipTone="mint"
        value={String(summary.activeListings)}
        count={String(summary.activeListings)}
        label="Active Listings"
        spark="M0 32 L15 29 L30 30 L45 23 L60 26 L75 19 L90 21 L105 13 L120 15"
        stroke="var(--mint-ink)"
      />
      <Kpi
        icon="⏳"
        iconBg="var(--sand)"
        iconInk="var(--sand-ink)"
        chip="Pending"
        chipTone="sand"
        value={String(summary.pendingListings)}
        count={String(summary.pendingListings)}
        label="Pending Approval"
        spark="M0 13 L15 17 L30 15 L45 22 L60 18 L75 24 L90 21 L105 28 L120 26"
        stroke="var(--sand-ink)"
      />
      {/* <Kpi
        icon="!"
        iconBg="var(--rose)"
        iconInk="var(--rose-ink)"
        chip="Workload"
        chipTone="rose"
        value={String(adminSummary.totalPendingWorkload ?? 0)}
        count={String(adminSummary.totalPendingWorkload ?? 0)}
        label="Pending Moderation"
        spark="M0 28 L15 24 L30 26 L45 17 L60 20 L75 11 L90 14 L105 7 L120 9"
      /> */}
    </div>
  );
}
