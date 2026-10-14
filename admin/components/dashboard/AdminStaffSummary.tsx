"use client";
import Link from "next/link";
import { Card, CardHead } from "@/components/ui";

export interface AdminStaffSummaryProps {
  admins: {
    total: number;
    active: number;
    inactive: number;
    superAdminCount: number;
    regularAdminCount: number;
  };
}

export default function AdminStaffSummary({ admins }: AdminStaffSummaryProps) {
  return (
    <Card>
      <CardHead
        title="Admin Staff Overview"
        sub="Privileged platform accounts"
        right={
          <Link className="btn btn-ghost sm" href="/super-admin/admins">
            Manage ({admins.total})
          </Link>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Super Admin</span>
          <strong style={{ color: "var(--iris-ink)" }}>{admins.superAdminCount}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Staff Admins</span>
          <strong style={{ color: "var(--ink)" }}>{admins.regularAdminCount}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Active Accounts</span>
          <strong style={{ color: "var(--mint-ink)" }}>{admins.active}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Inactive / Suspended</span>
          <strong style={{ color: admins.inactive > 0 ? "var(--rose-ink)" : "var(--ink-4)" }}>
            {admins.inactive}
          </strong>
        </div>
      </div>
    </Card>
  );
}
