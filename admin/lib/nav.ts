import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: string;      // key into components/icons.tsx
  badge?: string;
  section?: string;  // starts a new labelled group
  mobile?: boolean;  // show in the mobile bottom tab bar
  superAdminOnly?: boolean;
};

/** Navigation for Regular Admin Staff Panel (/admin/*) */
export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "grid", section: "Menu", mobile: true },
  { href: "/admin/preferences", label: "Preferences Options", icon: "filter", section: "User Management", mobile: true },
  { href: "/admin/avatars", label: "Avatars Master", icon: "user", mobile: true },
  { href: "/admin/users", label: "User", icon: "users", mobile: true },
  { href: "/admin/chats", label: "Chat Management", icon: "chat", mobile: true },
  { href: "/admin/amenities", label: "Property Amenities", icon: "grid", section: "Listing Management", mobile: true },
  { href: "/admin/properties", label: "Property Listings", icon: "home", mobile: true },
  { href: "/admin/flatmate-requirements", label: "Flatmate Requirements", icon: "fileText", mobile: true },
  { href: "/admin/reports", label: "Reports", icon: "flag", mobile: true },
  // { href: "/admin/reviews", label: "Reviews", icon: "star", mobile: true },
  { href: "/admin/blogs-category", label: "Blogs Category", icon: "list", section: "Content Management", mobile: true },
  { href: "/admin/blogs", label: "Blogs", icon: "pen", mobile: true },
  { href: "/admin/faqs", label: "FAQs", icon: "fileText", mobile: true },
  { href: "/admin/rental-guides", label: "Rental Guides", icon: "fileText", mobile: true },
  { href: "/admin/cities", label: "City", icon: "building2", mobile: true },
];

/** Navigation for Super Admin Panel (/super-admin/*) */
export const superAdminNav: NavItem[] = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: "grid", section: "Menu", mobile: true },
  { href: "/super-admin/admins", label: "Admin Staff", icon: "head", section: "Staff Management", superAdminOnly: true, mobile: true },
  { href: "/super-admin/preferences", label: "Preferences Options", icon: "filter", section: "User Management", mobile: true },
  { href: "/super-admin/avatars", label: "Avatars Master", icon: "user", mobile: true },
  { href: "/super-admin/users", label: "User", icon: "users", mobile: true },
  { href: "/super-admin/chats", label: "Chat Management", icon: "chat", mobile: true },
  { href: "/super-admin/amenities", label: "Property Amenities", icon: "grid", section: "Listing Management", mobile: true },
  { href: "/super-admin/properties", label: "Property Listings", icon: "home", mobile: true },
  { href: "/super-admin/flatmate-requirements", label: "Flatmate Requirements", icon: "fileText", mobile: true },
  { href: "/super-admin/reports", label: "Reports", icon: "flag", mobile: true },
  // { href: "/super-admin/reviews", label: "Reviews", icon: "star", mobile: true },
  { href: "/super-admin/blogs-category", label: "Blogs Category", icon: "list", section: "Content Management", mobile: true },
  { href: "/super-admin/blogs", label: "Blogs", icon: "pen", mobile: true },
  { href: "/super-admin/faqs", label: "FAQs", icon: "fileText", mobile: true },
  { href: "/super-admin/rental-guides", label: "Rental Guides", icon: "fileText", mobile: true },
  { href: "/super-admin/cities", label: "City", icon: "building2", mobile: true },
];

/** Template Panel Navigation (kept for reference) */
export const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", section: "Menu", mobile: true },
  { href: "/users", label: "User Management", icon: "users", section: "Management", mobile: true },
  { href: "/admins", label: "Admin Staff", icon: "head", superAdminOnly: true, mobile: true },
  { href: "/pipeline", label: "Pipeline", icon: "flow", section: "Workspace" },
  { href: "/customers", label: "Customers", icon: "users", badge: "398" },
  { href: "/analytics", label: "Analytics", icon: "chart", section: "Insights" },
  { href: "/campaigns", label: "Campaigns", icon: "mega" },
  { href: "/payments", label: "Payments", icon: "card" },
  { href: "/messages", label: "Messages", icon: "chat", badge: "3" },
  { href: "/settings", label: "Settings", icon: "cog" },
];
