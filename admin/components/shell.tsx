"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/brand.config";
import { nav } from "@/lib/nav";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { MobileBar, MobileTabs } from "./mobile-nav";
import CommandPalette from "./command-palette";
import PageWipe from "./page-wipe";
import Cursor from "./cursor";

/**
 * App chrome shared by every page: sidebar, topbar, mobile header,
 * bottom tab bar, ⌘K palette, route curtain and cursor.
 */
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const title = nav.find((n) => n.href === path)?.label ?? brand.name;

  useEffect(() => { setNavOpen(false); }, [path]);

  useEffect(() => {
    if (!brand.features.commandPalette) return;
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      <PageWipe />
      <Cursor />
      <div className="shell">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="main">
          <MobileBar title={title} onMenu={() => setNavOpen(!navOpen)} onSearch={() => setCmdOpen(true)} />
          <Topbar onSearch={() => setCmdOpen(true)} />
          {children}
        </main>
      </div>
      {/* <MobileTabs /> */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} /> 
    </>
  );
}
