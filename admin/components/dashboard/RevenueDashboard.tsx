"use client";
import { Card, CardHead, Chip } from "@/components/ui";

export interface RevenueDashboardProps {
  revenue?: {
    supported: boolean;
    message: string;
  };
}

export default function RevenueDashboard({ revenue }: RevenueDashboardProps) {
  const message =
    revenue?.message ||
    "Payment gateway integration and platform revenue collection are currently not configured in the backend. Listing prices (such as monthly rent, security deposits, and maintenance charges) represent direct peer agreements between flatmates and property owners, not platform earnings.";

  return (
    <Card>
      <CardHead
        title="Revenue Dashboard"
        sub="Platform monetization, transactions, and payment gateway status"
        right={
          <Chip tone="sand">
            Unavailable / Not Configured
          </Chip>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>
        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--canvas-2)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Platform Revenue</span>
            <strong style={{ fontSize: 18, color: "var(--ink-3)" }}>
              Not Integrated
            </strong>
            <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
              No payment gateway connected
            </span>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--canvas-2)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Transaction Volume</span>
            <strong style={{ fontSize: 18, color: "var(--ink-3)" }}>
              0 Records
            </strong>
            <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
              No transaction ledger found
            </span>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--canvas-2)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Payment Gateway</span>
            <strong style={{ fontSize: 18, color: "var(--rose-ink)" }}>
              Offline
            </strong>
            <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
              Direct peer-to-peer marketplace
            </span>
          </div>
        </div>

        {/* Notice Info Box */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--canvas-2)",
            border: "1px dashed var(--hair)",
            fontSize: 12,
            color: "var(--ink-3)",
            lineHeight: 1.5,
          }}
        >
          ℹ️ <strong>System Notice:</strong> {message}
        </div>
      </div>
    </Card>
  );
}
