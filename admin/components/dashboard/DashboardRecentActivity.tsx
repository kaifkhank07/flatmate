"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHead, Chip } from "@/components/ui";
import {
  SuperAdminDashboardData,
  AdminDashboardData,
  DashboardPendingListingItem,
  DashboardRecentUserItem,
  DashboardRecentReportItem,
} from "@/lib/api";

export interface DashboardRecentActivityProps {
  role: "super_admin" | "admin";
  recentActivity:
    | SuperAdminDashboardData["recentActivity"]
    | AdminDashboardData["recentActivity"];
}

export default function DashboardRecentActivity({
  role,
  recentActivity,
}: DashboardRecentActivityProps) {
  const isSuperAdmin = role === "super_admin";
  const usersLink = isSuperAdmin ? "/super-admin/users" : "/admin/users";

  const pendingListings: DashboardPendingListingItem[] =
    recentActivity.pendingModerationListings || [];

  const recentUsers: DashboardRecentUserItem[] =
    recentActivity.recentUsers || [];

  const reports: DashboardRecentReportItem[] =
    ("pendingReports" in recentActivity
      ? recentActivity.pendingReports
      : "recentReports" in recentActivity
      ? (recentActivity as any).recentReports
      : []) || [];

  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
      {/* Pending Moderation Queue */}
      {/* <Card>
        <CardHead
          title="Pending Moderation Queue"
          sub="Listings requiring admin review and approval"
          right={
            <Link className="btn btn-ghost sm" href="/listings">
              View All Queue ({pendingListings.length})
            </Link>
          }
        />
        <div style={{ padding: "8px 0" }}>
          {pendingListings.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--ink-4)",
                fontSize: 13,
              }}
            >
              No pending listings currently awaiting review.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingListings.map((item) => {
                const isProperty = item.listingType === "property";
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "";

                return (
                  <div
                    key={item._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--canvas-2)",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          className={`chip ${isProperty ? "iris" : "amber"}`}
                          style={{ fontSize: 10, padding: "2px 6px" }}
                        >
                          {isProperty ? "Property" : "Flatmate"}
                        </span>
                        <strong
                          style={{
                            fontSize: 12,
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </strong>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-3)",
                          marginTop: 3,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {item.rent > 0 && <span>₹{item.rent.toLocaleString()}/mo</span>}
                        {item.location?.city && <span>· {item.location.city}</span>}
                        {item.userId?.email && <span>· {item.userId.email}</span>}
                        {dateStr && <span>· {dateStr}</span>}
                      </div>
                    </div>

                    <Link
                      className="btn btn-ghost sm"
                      href="/listings"
                      style={{ flexShrink: 0 }}
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card> */}

      {/* Side Activity Card: Recent Users & Moderation Reports */}
      <Card>
        <CardHead
          title={activeTab === "users" ? "Recent Registrations" : "Moderation Reports"}
          sub={
            activeTab === "users"
              ? "Newly registered marketplace user accounts"
              : "Reports submitted by users requiring action"
          }
          right={
            <Link
              className="btn btn-ghost sm"
              href={activeTab === "users" ? usersLink : "/reports"}
            >
              {activeTab === "users" ? `All Users (${recentUsers.length})` : "Reports"}
            </Link>
          }
        />

        <div style={{ padding: "8px 0" }}>
          {/* Sub-tabs if reports exist */}
          {reports.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`btn sm ${activeTab === "users" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: 11, padding: "3px 10px", height: 26 }}
              >
                Recent Users ({recentUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className={`btn sm ${activeTab === "reports" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: 11, padding: "3px 10px", height: 26 }}
              >
                Pending Reports ({reports.length})
              </button>
            </div>
          )}

          {activeTab === "users" ? (
            recentUsers.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--ink-4)",
                  fontSize: 12,
                }}
              >
                No recent user registrations found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentUsers.map((u) => {
                  const initial = (
                    u.name?.trim()?.charAt(0) ||
                    u.email?.charAt(0) ||
                    "U"
                  ).toUpperCase();

                  const formattedDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "";

                  return (
                    <div
                      key={u._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--canvas-2)",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--iris-subtle, rgba(99, 102, 241, 0.12))",
                            color: "var(--iris-ink, #4f46e5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {u.image || u.avatar ? (
                            <img
                              src={(u.image || u.avatar) as string}
                              alt={u.name || "User"}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            initial
                          )}
                        </div>

                        {/* User info */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong
                              style={{
                                fontSize: 12,
                                color: "var(--ink)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {u.name || u.email || u.mobile || "User Account"}
                            </strong>
                            {u.profileVerified && (
                              <span
                                className="chip mint"
                                style={{ fontSize: 9, padding: "1px 5px", flexShrink: 0 }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--ink-3)",
                              marginTop: 2,
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {u.name && u.email && <span>{u.email}</span>}
                            {!u.name && u.mobile && <span>{u.mobile}</span>}
                            {formattedDate && <span>· Joined {formattedDate}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status and Action */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <Chip tone={u.accountStatus === "active" ? "mint" : "rose"}>
                          {u.accountStatus}
                        </Chip>
                        <Link
                          className="btn btn-ghost sm"
                          href={`${usersLink}?search=${encodeURIComponent(u.email || u.mobile || "")}`}
                          style={{ padding: "3px 8px", fontSize: 11, height: 24 }}
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Reports Tab */
            reports.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--ink-4)",
                  fontSize: 12,
                }}
              >
                No open moderation reports.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {reports.map((r) => (
                  <div
                    key={r._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--canvas-2)",
                      fontSize: 11,
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "var(--ink)" }}>
                        {r.reason?.toUpperCase()}
                      </strong>
                      <span style={{ color: "var(--ink-4)", fontSize: 10 }}>
                        Target: {r.targetType} ·{" "}
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <Chip tone="rose">{r.status}</Chip>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
