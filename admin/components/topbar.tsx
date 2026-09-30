"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/brand.config";
import { M } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import { getStoredAdminUser, adminLogout, AdminItem } from "@/lib/api";
import Icon from "./icons";
import { Avatar, Chip } from "./ui";

export default function Topbar({ onSearch }: { onSearch: () => void }) {
  const { toggle } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [pop, setPop] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentAdmin(getStoredAdminUser());
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPop(false);
      if (!userRef.current?.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const handleLogout = async () => {
    try {
      await adminLogout();
      toast("Logged out successfully");
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="topbar">
      <div className="searchbar" onClick={onSearch}>
        <Icon name="search" size={15} />
        <input placeholder="Search users, admins, statistics…" readOnly />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-right">
        {brand.features.themeToggle && (
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
            <Icon name="sun" size={15} />
          </button>
        )}

        {brand.features.notifications && (
          <div className="pop-wrap" ref={ref}>
            <button
              className="icon-btn notif"
              onClick={(e) => {
                e.stopPropagation();
                setPop(!pop);
              }}
              aria-label="Notifications"
            >
              <Icon name="bell" size={15} />
            </button>
            <div className={`pop ${pop ? "open" : ""}`}>
              <div className="pop-head">
                <b>Notifications</b>
                <button onClick={() => toast("All marked read")}>Mark all read</button>
              </div>
              {[
                {
                  ic: "✓",
                  bg: "var(--mint)",
                  ink: "var(--mint-ink)",
                  t: "System Active",
                  p: "Flatmate Backend API connected",
                  w: "Just now",
                },
              ].map((n) => (
                <div className="n-item" key={n.t}>
                  <span className="n-ic" style={{ background: n.bg, color: n.ink }}>
                    {n.ic}
                  </span>
                  <div>
                    <b>{n.t}</b>
                    <p>{n.p}</p>
                    <time>{n.w}</time>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pop-wrap" ref={userRef}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setUserMenu(!userMenu);
            }}
          >
            <Avatar src={M(32)} size={38} ring />
            <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
              <strong style={{ lineHeight: 1.2 }}>{currentAdmin?.name || "Admin"}</strong>
              <Chip tone={currentAdmin?.role === "super_admin" ? "rose" : "iris"}>
                {currentAdmin?.role === "super_admin" ? "Super Admin" : "Admin"}
              </Chip>
            </div>
          </div>

          <div className={`pop ${userMenu ? "open" : ""}`} style={{ right: 0, width: 200, padding: 8 }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{currentAdmin?.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{currentAdmin?.email}</div>
            </div>
            <button
              className="btn btn-ghost sm"
              style={{ width: "100%", justifyContent: "flex-start", color: "var(--rose-ink)" }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
