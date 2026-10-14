"use client";
import Link from "next/link";
import { Card, CardHead } from "@/components/ui";

export interface DashboardQuickActionsProps {
  role: "super_admin" | "admin";
  pendingWorkload?: number;
}

export default function DashboardQuickActions({
  role,
  pendingWorkload = 0,
}: DashboardQuickActionsProps) {
  const isSuperAdmin = role === "super_admin";

  return (
    <Card>
      <CardHead
        title="Quick Operations"
        sub={isSuperAdmin ? "Super Admin Shortcuts" : "Operational Shortcuts"}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {isSuperAdmin ? (
          <>
            <Link className="btn btn-brand" href="/super-admin/admins">
              Manage Staff Admins
            </Link>
            <Link className="btn btn-ghost" href="/super-admin/users">
              Manage Marketplace Users
            </Link>
            <Link
              className="btn btn-ghost"
              href="/listings"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>Moderate Listings</span>
              {pendingWorkload > 0 && (
                <span className="chip amber" style={{ fontSize: 10 }}>
                  {pendingWorkload} action
                </span>
              )}
            </Link>
            <Link className="btn btn-ghost" href="/reports">
              Platform Reports
            </Link>
          </>
        ) : (
          <>
            <Link
              className="btn btn-brand"
              href="/listings"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>Review Listings</span>
              {pendingWorkload > 0 && (
                <span className="chip white" style={{ fontSize: 10, color: "var(--ink)" }}>
                  {pendingWorkload} pending
                </span>
              )}
            </Link>
            <Link className="btn btn-ghost" href="/admin/users">
              Manage Users Page
            </Link>
            <Link className="btn btn-ghost" href="/reports">
              Reports & Moderation
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
