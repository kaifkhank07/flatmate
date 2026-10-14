"use client";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import Icon from "@/components/icons";

export interface DashboardHeaderProps {
  title: string;
  sub: string;
  role: "super_admin" | "admin";
  onRefresh: () => void;
  refreshing?: boolean;
  manageLink?: {
    href: string;
    label: string;
  };
  eyebrow?: string;
}

export default function DashboardHeader({
  title,
  sub,
  role,
  onRefresh,
  refreshing = false,
  manageLink,
  eyebrow,
}: DashboardHeaderProps) {
  const defaultEyebrow = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const defaultManageLink =
    manageLink ||
    (role === "super_admin"
      ? { href: "/super-admin/admins", label: "Manage Admins" }
      : { href: "/admin/users", label: "Manage Users" });

  return (
    <PageHead
      eyebrow={eyebrow || defaultEyebrow}
      title={title}
      sub={sub}
      actions={
        <>
          <button
            className="btn btn-ghost sm"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh dashboard metrics"
          >
            <span
              style={{
                display: "inline-flex",
                transform: refreshing ? "rotate(180deg)" : "none",
                transition: "transform 0.5s ease",
              }}
            >
              <Icon name="refresh" size={13} />
            </span>{" "}
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <Link className="btn btn-brand sm" href={defaultManageLink.href}>
            {defaultManageLink.label}
          </Link>
        </>
      }
    />
  );
}
