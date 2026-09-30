"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchUserPreferences,
  UserPreferenceItem,
  PaginationMeta,
} from "@/lib/api";
import { Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import CreateUserPreferenceDialog from "./CreateUserPreferenceDialog";
import EditUserPreferenceDialog from "./EditUserPreferenceDialog";
import DeleteUserPreferenceDialog from "./DeleteUserPreferenceDialog";
import ToggleUserPreferenceDialog from "./ToggleUserPreferenceDialog";
import { ListSortDescending, Plus, RotateCw } from "lucide-react";

const LIMIT = 10;
const PREFERENCE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "food", label: "Food" },
  { value: "pets", label: "Pets" },
  { value: "drink", label: "Drink" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function UserPreferencesManager({
  eyebrow = "Management Panel",
  title = "User Preference Master Data",
  sub = "Configure master preferences (Food, Pets, Drink) with image uploads and active status control.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UserPreferenceItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const hasActiveFilters = Boolean(search.trim() || categoryFilter !== "all" || statusFilter !== "all");

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  // Dialog Selection States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPreference, setEditPreference] = useState<UserPreferenceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserPreferenceItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserPreferenceItem | null>(null);

  // Fetch User Preferences List from Backend
  const loadPreferences = useCallback(async () => {
    setLoading(true);
    const res = await fetchUserPreferences({
      category: categoryFilter,
      status: statusFilter,
      search: search,
      page,
      limit: LIMIT,
    });

    if (res.success && res.data) {
      setItems(res.data.items || []);
      const total = res.data.total || 0;
      setPagination({
        page: res.data.page || 1,
        limit: res.data.limit || LIMIT,
        total,
        totalPages: Math.ceil(total / (res.data.limit || LIMIT)) || 1,
      });
    } else {
      toast(res.message || "Failed to load user preferences");
    }
    setLoading(false);
  }, [categoryFilter, statusFilter, search, page, toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);


  const getImageUrl = (img: unknown): string => {
    if (!img) return "";
    if (typeof img === "string") return img;
    if (typeof img === "object" && img !== null && "url" in img && typeof (img as { url: unknown }).url === "string") {
      return (img as { url: string }).url;
    }
    return "";
  };

  const getCategoryTone = (cat: string) => {
    switch (cat) {
      case "food":
        return "sand";
      case "pets":
        return "mint";
      case "drink":
        return "iris";
      default:
        return "iris";
    }
  };

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadPreferences}>
              <RotateCw size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={13} /> Add User Preference
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search user preferences…"
            />

            <SegmentedFilter
              value={categoryFilter}
              options={PREFERENCE_CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              }))}
              onChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            />

            <SegmentedFilter
              value={statusFilter}
              options={STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />

            <ResetFilterButton
              visible={hasActiveFilters}
              onClick={handleResetFilters}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Preference Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading user preferences…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No user preferences found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      <td className="td-person">
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: "var(--bg-card-hover, rgba(255,255,255,0.06))",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {getImageUrl(item.image) ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <ListSortDescending size={16} />
                          )}
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <span>ID: {item._id.slice(-6)}</span>
                        </div>
                      </td>
                      <td>
                        <Chip tone={getCategoryTone(item.category)} dot>
                          {item.category.toUpperCase()}
                        </Chip>
                      </td>
                      <td>
                        <Chip tone={item.isActive !== false ? "mint" : "rose"} dot>
                          {item.isActive !== false ? "Active" : "Inactive"}
                        </Chip>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-ghost sm"
                            onClick={() => setEditPreference(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost sm"
                            style={{ color: item.isActive !== false ? "var(--mint-ink)" : "var(--rose-ink)" }}
                            onClick={() => setToggleTarget(item)}
                          >
                            {item.isActive !== false ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="btn btn-ghost sm"
                            style={{ color: "var(--rose-ink)" }}
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </Card>
      </div>

      <CreateUserPreferenceDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadPreferences}
      />

      <EditUserPreferenceDialog
        preference={editPreference}
        onClose={() => setEditPreference(null)}
        onSuccess={loadPreferences}
      />

      <DeleteUserPreferenceDialog
        preference={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadPreferences}
      />

      <ToggleUserPreferenceDialog
        preference={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSuccess={loadPreferences}
      />
    </>
  );
}
