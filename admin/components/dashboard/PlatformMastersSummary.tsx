"use client";
import Link from "next/link";
import { Card, CardHead } from "@/components/ui";

export interface PlatformMastersSummaryProps {
  masters: {
    cities: { total: number; active: number };
    blogs: { total: number; active: number };
    faqs: { total: number };
    rentalGuides: { total: number };
    amenities: { active: number };
    preferences: { active: number };
  };
}

export default function PlatformMastersSummary({
  masters,
}: PlatformMastersSummaryProps) {
  return (
    <Card>
      <CardHead
        title="Platform Masters"
        sub="Master data and published content"
        right={
          <Link className="btn btn-ghost sm" href="/cities">
            Cities ({masters.cities.total})
          </Link>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Cities Supported</span>
          <strong style={{ color: "var(--ink)" }}>
            {masters.cities.active} active <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>({masters.cities.total} total)</span>
          </strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Published Blogs</span>
          <strong style={{ color: "var(--ink)" }}>
            {masters.blogs.active} live <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>({masters.blogs.total} total)</span>
          </strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Help & FAQs</span>
          <strong style={{ color: "var(--ink)" }}>{masters.faqs.total} items</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Rental Guides</span>
          <strong style={{ color: "var(--ink)" }}>{masters.rentalGuides.total} guides</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>Property Amenities</span>
          <strong style={{ color: "var(--mint-ink)" }}>{masters.amenities.active} active</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-2)" }}>User Preferences</span>
          <strong style={{ color: "var(--iris-ink)" }}>{masters.preferences.active} active</strong>
        </div>
      </div>
    </Card>
  );
}
