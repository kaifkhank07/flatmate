"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHead, Chip } from "@/components/ui";
import { DashboardRecentUserItem } from "@/lib/api";

const getUserTypeTone = (type?: string) => {
  switch (type) {
    case "owner":
      return "iris";
    case "agent":
      return "amber";
    case "builder":
      return "sand";
    case "flatmate":
    default:
      return "mint";
  }
};

export interface NewUserRegistrationsProps {
  recentUsers?: DashboardRecentUserItem[];
  usersLink?: string;
}

export default function NewUserRegistrations({
  recentUsers = [],
  usersLink = "/admin/users",
}: NewUserRegistrationsProps) {

  return (
    <Card>
      <CardHead
        title="Recent Registrations"
        sub="Newly registered marketplace user accounts"
        right={
          <Link
            className="btn btn-ghost sm"
            href={usersLink}
          >
            {`View Users`}
          </Link>
        }
      />

      {/* Recent Registr ations List - Matches DashboardRecentActivity */}
      <div style={{ padding: "8px 0" }}>
        {recentUsers.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentUsers.slice(0, 5).map((u) => {
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
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    {/* User Information */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong
                        style={{
                          fontSize: 12,
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                        }}
                      >
                        {u.name || u.email || u.mobile || "User Account"}
                      </strong>

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

                  {/* Status and Details */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Chip tone={getUserTypeTone(u.userType)}>
                      {u.userType ? u.userType.charAt(0).toUpperCase() + u.userType.slice(1) : "Flatmate"}
                    </Chip>
                    <Chip tone={u.accountStatus === "active" ? "mint" : "rose"}>
                      {u.accountStatus}
                    </Chip>

                    {/* <Link
                      className="btn btn-ghost sm"
                      href={`${usersLink}?search=${encodeURIComponent(
                        u.email || u.mobile || ""
                      )}`}
                      style={{
                        padding: "3px 8px",
                        fontSize: 11,
                        height: 24,
                      }}
                    >
                      Details
                    </Link> */}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Card>
  );
}
