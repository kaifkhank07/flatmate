"use client";
import Link from "next/link";
import { Card, CardHead } from "@/components/ui";
import { ListingStatusCounts } from "@/lib/api";

export interface ListingStatisticsProps {
  listings: {
    combined: ListingStatusCounts;
    property: ListingStatusCounts & { byType?: Record<string, number> };
    flatmate: ListingStatusCounts & { byPostType?: Record<string, number> };
  };
  role: "super_admin" | "admin";
}

export default function ListingStatistics({
  listings,
  role,
}: ListingStatisticsProps) {
  const listingsLink =
    role === "super_admin" ? "/super-admin/listings" : "/admin/listings";

  return (
    <Card>
      <CardHead
        title="Listing Statistics"
        sub="Properties & Flatmate Requirements"
        right={
          <Link className="btn btn-ghost sm" href={listingsLink}>
            Total ({listings.combined.total})
          </Link>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>
        {/* Status Pills Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <div
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--canvas-2)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Active</span>
            <strong style={{ fontSize: 15, color: "var(--mint-ink)" }}>
              {listings.combined.approved}
            </strong>
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--canvas-2)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Pending</span>
            <strong style={{ fontSize: 15, color: "var(--sand-ink)" }}>
              {listings.combined.pending}
            </strong>
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--canvas-2)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Rejected</span>
            <strong style={{ fontSize: 15, color: "var(--rose-ink)" }}>
              {listings.combined.rejected}
            </strong>
          </div>
        </div>

        {/* Source Breakdown Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              paddingBottom: 6,
              borderBottom: "1px solid var(--hair)",
            }}
          >
            <div>
              <strong style={{ display: "block", color: "var(--ink)" }}>Properties</strong>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {listings.property.approved} live · {listings.property.pending} pending
              </span>
            </div>
            <strong style={{ fontSize: 13 }}>{listings.property.total}</strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <div>
              <strong style={{ display: "block", color: "var(--ink)" }}>Flatmate Requirements</strong>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {listings.flatmate.approved} live · {listings.flatmate.pending} pending
              </span>
            </div>
            <strong style={{ fontSize: 13 }}>{listings.flatmate.total}</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}
