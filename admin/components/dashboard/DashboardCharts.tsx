"use client";
import { useMemo } from "react";
import { Card, CardHead } from "@/components/ui";
import { AreaChart } from "@/components/charts";
import { SuperAdminDashboardData, AdminDashboardData } from "@/lib/api";

export interface DashboardChartsProps {
  charts: SuperAdminDashboardData["charts"] | AdminDashboardData["charts"];
  title?: string;
}

export default function DashboardCharts({
  charts,
  title = "Growth & Registration Analytics",
}: DashboardChartsProps) {
  const { userRegistrationTrend, listingStatusDistribution } = charts;

  // Compute SVG line & fill for user registration trend
  const { line, fill, labels, values } = useMemo(() => {
    const rawValues = userRegistrationTrend.map((t) => t.count);
    const maxVal = Math.max(...rawValues, 1);
    const n = userRegistrationTrend.length;
    const width = 600;
    const height = 240;
    const paddingBottom = 20;
    const paddingTop = 30;
    const usableHeight = height - paddingBottom - paddingTop;

    const coords = userRegistrationTrend.map((t, i) => {
      const x = n > 1 ? Math.round(i * (width / (n - 1))) : width / 2;
      const y = Math.round(
        height - paddingBottom - (t.count / maxVal) * usableHeight
      );
      return { x, y };
    });

    const linePath = coords.reduce(
      (acc, pt, i) => (i === 0 ? `M${pt.x} ${pt.y}` : `${acc} L${pt.x} ${pt.y}`),
      ""
    );
    const fillPath = `${linePath} L${width} ${height} L0 ${height} Z`;

    const monthLabels = userRegistrationTrend.map((t) => {
      const parts = t.month.split("-");
      if (parts.length === 2) {
        const monthNum = parseInt(parts[1], 10);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${monthNames[monthNum - 1] || parts[1]} '${parts[0].slice(2)}`;
      }
      return t.month;
    });

    return {
      line: linePath,
      fill: fillPath,
      labels: monthLabels,
      values: rawValues.map(String),
    };
  }, [userRegistrationTrend]);

  const totalListings = useMemo(() => {
    return listingStatusDistribution.reduce((acc, curr) => acc + curr.count, 0);
  }, [listingStatusDistribution]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
      {/* 6-Month User Trend Area Chart */}
      <Card>
        <CardHead
          title={title}
          sub="New user registrations over the last 6 months"
        />
        <div style={{ padding: "12px 0 6px" }}>
          <AreaChart labels={labels} values={values} line={line} fill={fill} id="userTrendGrad" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--ink-4)",
              marginTop: 8,
              padding: "0 6px",
            }}
          >
            {labels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </Card>

      {/* Listing Status Breakdown */}
      <Card>
        <CardHead
          title="Listing Distribution"
          sub={`Status distribution across ${totalListings} listings`}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
          {listingStatusDistribution.map((item) => {
            const pct = totalListings > 0 ? Math.round((item.count / totalListings) * 100) : 0;
            const barTone =
              item.status === "approved"
                ? "var(--mint-ink)"
                : item.status === "pending"
                ? "var(--sand-ink)"
                : item.status === "rejected"
                ? "var(--rose-ink)"
                : "var(--lav-ink)";

            return (
              <div key={item.status} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--ink-2)" }}>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>
                    {item.count} <span style={{ color: "var(--ink-4)", fontSize: 10 }}>({pct}%)</span>
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background: "var(--canvas-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: barTone,
                      borderRadius: 3,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
