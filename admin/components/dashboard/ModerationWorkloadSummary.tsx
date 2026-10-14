"use client";
import Link from "next/link";
import { Card, CardHead } from "@/components/ui";

export interface ModerationWorkloadSummaryProps {
  workload: {
    pendingListings: number;
    pendingListingReports: number;
    pendingChatReports: number;
    pendingReviews: number;
    totalPendingWorkload: number;
  };
}

export default function ModerationWorkloadSummary({
  workload,
}: ModerationWorkloadSummaryProps) {
  return (
    <Card>
      <CardHead
        title="Moderation Backlog"
        sub="Pending items requiring review"
        right={
          <span
            className={`chip ${workload.totalPendingWorkload > 0 ? "rose" : "mint"}`}
            style={{ fontSize: 10 }}
          >
            {workload.totalPendingWorkload} pending
          </span>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sand-ink)" }} />
            Pending Listings
          </span>
          <Link className="btn btn-ghost sm" href="/listings" style={{ padding: "2px 8px", fontSize: 11 }}>
            {workload.pendingListings} review
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rose-ink)" }} />
            Listing Reports
          </span>
          <Link className="btn btn-ghost sm" href="/reports" style={{ padding: "2px 8px", fontSize: 11 }}>
            {workload.pendingListingReports} open
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rose-ink)" }} />
            Chat Reports
          </span>
          <Link className="btn btn-ghost sm" href="/reports" style={{ padding: "2px 8px", fontSize: 11 }}>
            {workload.pendingChatReports} open
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber-ink)" }} />
            User Reviews
          </span>
          <Link className="btn btn-ghost sm" href="/reviews" style={{ padding: "2px 8px", fontSize: 11 }}>
            {workload.pendingReviews} pending
          </Link>
        </div>
      </div>
    </Card>
  );
}
