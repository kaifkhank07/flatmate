"use client";
import Link from "next/link";
import { Card, CardHead } from "@/components/ui";

export interface UserStatusSummaryProps {
  users: {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
    verified: number;
    pendingVerification: number;
  };
  usersLink: string;
  role?: "super_admin" | "admin";
}

export default function UserStatusSummary({
  users,
  usersLink,
}: UserStatusSummaryProps) {
  return (
    <Card>
      <CardHead
        title="User Status Distribution"
        sub="Account status breakdown across platform"
        right={
          <Link className="btn btn-ghost sm" href={usersLink}>
            View All ({users.total})
          </Link>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mint-ink)" }} />
            Active Accounts
          </span>
          <strong style={{ color: "var(--mint-ink)" }}>{users.active}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sand-ink)" }} />
            Pending Verification
          </span>
          <strong style={{ color: "var(--sand-ink)" }}>{users.pendingVerification}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--rose-ink)" }} />
            Blocked / Inactive
          </span>
          <strong style={{ color: "var(--rose-ink)" }}>{users.inactive}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sea-ink)" }} />
            Verified Profiles
          </span>
          <strong style={{ color: "var(--sea-ink)" }}>{users.verified}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink-4)" }} />
            Deleted Accounts
          </span>
          <strong style={{ color: "var(--ink-4)" }}>{users.deleted}</strong>
        </div>
      </div>
    </Card>
  );
}
