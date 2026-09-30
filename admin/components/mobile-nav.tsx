"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/brand.config";
import { nav } from "@/lib/nav";
import Icon from "./icons";
import Logo from "./logo";

export function MobileBar({ title, onMenu, onSearch }: { title: string; onMenu: () => void; onSearch: () => void }) {
  return (
    <div className="mobile-bar">
      <button className="icon-btn" onClick={onMenu} aria-label="Menu"><Icon name="menu" size={17} /></button>
      <span className="mtitle">{title}</span>
      <div className="right">
        <button className="icon-btn" onClick={onSearch} aria-label="Search"><Icon name="search" size={15} /></button>
        <button className="icon-btn notif" aria-label="Notifications"><Icon name="bell" size={15} /></button>
      </div>
    </div>
  );
}

/** Bottom tab bar with a raised FAB — the app-like mobile navigation. */
export function MobileTabs() {
  const path = usePathname();
  if (!brand.features.mobileTabBar) return null;
  const tabs = nav.filter((n) => n.mobile).slice(0, 4);
  const [a, b] = [tabs.slice(0, 2), tabs.slice(2)];
  return (
    <nav className="mtabs">
      {a.map((t) => (
        <Link key={t.href} href={t.href} className={`mtab ${path === t.href ? "active" : ""}`}>
          <Icon name={t.icon} size={21} /><span>{t.label}</span>
        </Link>
      ))}
      <Link href="/forms" className="mtab fab" aria-label="New">
        <span className="fabi"><Icon name="plus" size={21} /></span><span>New</span>
      </Link>
      {b.map((t) => (
        <Link key={t.href} href={t.href} className={`mtab ${path === t.href ? "active" : ""}`}>
          <Icon name={t.icon} size={21} /><span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
