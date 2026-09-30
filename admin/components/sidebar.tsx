"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brand } from "@/brand.config";
import { nav, adminNav, superAdminNav, NavItem } from "@/lib/nav";
import { getStoredAdminUser, AdminItem, adminLogout } from "@/lib/api";
import Icon from "./icons";
import Logo from "./logo";
import { useToast } from "@/lib/toast";
import { LogOut } from "lucide-react";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const toast = useToast();
  const router = useRouter();
  const [mini, setMini] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminItem | null>(null);

  useEffect(() => {
    try { setMini(localStorage.getItem("ls-mini") === "1"); } catch { }
    setCurrentAdmin(getStoredAdminUser());
  }, []);

  useEffect(() => {
    document.querySelector(".shell")?.classList.toggle("mini", mini);
  }, [mini]);

  // Select navigation set based on route path
  let currentNav: NavItem[] = nav;
  let homeLink = "/dashboard";

  if (path.startsWith("/super-admin")) {
    currentNav = superAdminNav;
    homeLink = "/super-admin/dashboard";
  } else if (path.startsWith("/admin")) {
    currentNav = adminNav;
    homeLink = "/admin/dashboard";
  }

  const visibleNav = currentNav.filter(
    (item) => !item.superAdminOnly || currentAdmin?.role === "super_admin"
  );


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
    <aside className={`sidebar ${open ? "open" : ""}`}>
      {brand.features.collapsibleSidebar && (
        <button
          className="collapse-btn"
          aria-label={mini ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => {
            const n = !mini;
            setMini(n);
            try {
              localStorage.setItem("ls-mini", n ? "1" : "0");
            } catch { }
          }}
        >
          <Icon name="chevLeft" size={12} />
        </button>
      )}

      <div className="sidebar-scroll">
        <Link className="brand" href={homeLink} aria-label={brand.name}>
          <Logo variant="dark" />
        </Link>

        {visibleNav.map((item) => (
          <div key={item.href}>
            {item.section && <div className="nav-label">{item.section}</div>}
            <Link
              href={item.href}
              title={item.label}
              onClick={onClose}
              className={`nav-item ${path === item.href ? "active" : ""}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          </div>
        ))}
      </div>

      <div
        onClick={handleLogout} className="flex w-full h-14 items-center justify-between px-3 py-2 bg-white/10 rounded-lg group hover:bg-white/20 transition-all cursor-pointer">
        {/* User Details */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
            {currentAdmin?.name?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {currentAdmin?.name || "Admin"}
            </span>
            <span className="text-xs text-white/70">
              {currentAdmin?.role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 text-sm font-medium text-white transition-opacity hover:opacity-70 group-hover:text-red-500"
          title="Logout"
        >
          <LogOut size={18} />
        </div>
      </div>
    </aside>
  );
}
