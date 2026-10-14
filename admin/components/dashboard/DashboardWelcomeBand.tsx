"use client";
import Band, { BandMetric, BandTile } from "@/components/band";
import { SuperAdminDashboardData, AdminDashboardData } from "@/lib/api";

export interface DashboardWelcomeBandProps {
  adminName: string;
  role: "super_admin" | "admin";
  summary: SuperAdminDashboardData["summary"] | AdminDashboardData["summary"];
}

export default function DashboardWelcomeBand({
  adminName,
  role,
  summary,
}: DashboardWelcomeBandProps) {
  const isSuperAdmin = role === "super_admin";
  const superSummary = summary as SuperAdminDashboardData["summary"];
  const adminSummary = summary as AdminDashboardData["summary"];

  const eyebrow = isSuperAdmin
    ? "Super Admin Panel · Master Overview"
    : "Admin Panel · Operational Overview";

  const title = `Welcome back, <em>${adminName || (isSuperAdmin ? "Super Admin" : "Admin")}</em>.`;

  const body = isSuperAdmin
    ? `Here is the master overview of the Flatmate marketplace.`
    : `Analyze market trends and manage all the administrative operations from here`;

  const metrics: BandMetric[] = isSuperAdmin
    ? [
        {
          label: "Total Users",
          value: String(summary.totalUsers),
          count: String(summary.totalUsers),
        },
        {
          label: "Active Users",
          value: String(summary.activeUsers),
          count: String(summary.activeUsers),
        },
        {
          label: "Verified Users",
          value: String(summary.verifiedUsers),
          count: String(summary.verifiedUsers),
        },
        {
          label: "Total Admins",
          value: String(superSummary.totalAdmins ?? 0),
          count: String(superSummary.totalAdmins ?? 0),
        },
      ]
    : [
        {
          label: "Total Users",
          value: String(summary.totalUsers),
          count: String(summary.totalUsers),
        },
        {
          label: "Active Users",
          value: String(summary.activeUsers),
          count: String(summary.activeUsers),
        },
        // {
        //   label: "Verified Users",
        //   value: String(summary.verifiedUsers),
        //   count: String(summary.verifiedUsers),
        // },
        // {
        //   label: "Pending Workload",
        //   value: String(adminSummary.totalPendingWorkload ?? 0),
        //   count: String(adminSummary.totalPendingWorkload ?? 0),
        // },
        {
          label: "Total Listing",
          value: String(summary.totalListings),
          count: String(summary.totalListings),
        },
        {
          label: "Active Listing",
          value: String(summary.activeListings),
          count: String(summary.activeListings),
        },
      ];

  const tiles: BandTile[] = isSuperAdmin
    ? [
        {
          icon: "★",
          value: String(superSummary.totalAdmins ?? 0),
          label: "Admin Staff",
          count: String(superSummary.totalAdmins ?? 0),
        },
        {
          icon: "✓",
          value: String(summary.newUsersToday),
          label: "New Users Today",
          count: String(summary.newUsersToday),
        },
      ]
    : [
        {
          icon: "✓",
          value: String(summary.newUsersToday),
          label: "New Today",
          count: String(summary.newUsersToday),
        },
        {
          icon: "★",
          value: String(summary.newUsersThisMonth),
          label: "New This Month",
          count: String(summary.newUsersThisMonth),
        },
      ];

  return (
    <Band
      eyebrow={eyebrow}
      title={title}
      body={body}
      metrics={metrics}
      tiles={tiles}
    />
  );
}
