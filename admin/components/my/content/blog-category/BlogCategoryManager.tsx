"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchBlogCategories,
  BlogCategoryItem,
  PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, Chip } from "@/components/ui";
import { Plus, RotateCw } from "lucide-react";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import CreateBlogCategoryDialog from "./CreateBlogCategoryDialog";
import EditBlogCategoryDialog from "./EditBlogCategoryDialog";
import DeleteBlogCategoryDialog from "./DeleteBlogCategoryDialog";
import ToggleBlogCategoryStatusDialog from "./ToggleBlogCategoryStatusDialog";

const LIMIT = 10;
const BLOG_CATEGORY_STATUS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function BlogCategoryManager({
  eyebrow = "Management Panel",
  title = "Blog Categories",
  sub = "Manage blog categories used to organize and classify blog posts.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlogCategoryItem[]>([]);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCategory, setEditCategory] = useState<BlogCategoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategoryItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<BlogCategoryItem | null>(null);

  const hasActiveFilters = Boolean(q.trim() || selectedStatusFilter !== "all");

  const handleResetFilters = () => {
    setQ("");
    setSelectedStatusFilter("all");
    setPage(1);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetchBlogCategories({
        page,
        limit: LIMIT,
        search: q.trim() || undefined,
        isActive:
          selectedStatusFilter === "all"
            ? undefined
            : selectedStatusFilter === "active",
      });

      if (res.success && res.data) {
        setItems(res.data.items || []);
        const total = res.data.total || 0;

        setPagination({
          page: res.data.page || page,
          limit: res.data.limit || LIMIT,
          total,
          totalPages:
            res.data.totalPages ||
            Math.ceil(total / LIMIT) ||
            1,
        });
      } else {
        setItems([]);
        toast(res.message || "Failed to load blog categories");
      }
    } catch (error) {
      console.error("Failed to load blog categories:", error);
      setItems([]);
      toast("Failed to load blog categories");
    } finally {
      setLoading(false);
    }
  }, [selectedStatusFilter, page, q, toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={loadCategories}
              disabled={loading}
            >
              <RotateCw size={13} />
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className="btn btn-brand sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={13} /> Add Blog Category
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools">
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search blog categories…"
            />

            <SegmentedFilter
              value={selectedStatusFilter}
              options={BLOG_CATEGORY_STATUS.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
              onChange={(value) => {
                setSelectedStatusFilter(value);
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
                  <th>Category Name & Slug</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Updated Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 34,
                        color: "var(--ink-4)",
                      }}
                    >
                      Loading blog categories…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 34,
                        color: "var(--ink-4)",
                      }}
                    >
                      No blog categories found.
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
                            background:
                              "var(--bg-card-hover, rgba(255,255,255,0.06))",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="grid" size={16} />
                        </div>

                        <div>
                          <strong>{item.name}</strong>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink-4)",
                              marginTop: 3,
                            }}
                          >
                            /{item.slug}
                          </div>
                        </div>
                      </td>

                      <td>
                        <Chip tone={item.isActive ? "mint" : "rose"} dot>
                          {item.isActive ? "Active" : "Inactive"}
                        </Chip>
                      </td>

                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {new Date(item.createdAt).toLocaleDateString("en-IN")}
                      </td>

                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {new Date(item.updatedAt).toLocaleDateString("en-IN")}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-ghost sm"
                            onClick={() => setEditCategory(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost sm"
                            onClick={() => setToggleTarget(item)}
                            style={{
                              color: item.isActive
                                ? "var(--rose-ink)"
                                : "var(--mint-ink)",
                            }}
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
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
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </Card>
      </div>

      <CreateBlogCategoryDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async () => {
          if (page !== 1) {
            setPage(1);
          } else {
            await loadCategories();
          }
        }}
      />

      <EditBlogCategoryDialog
        category={editCategory}
        onClose={() => setEditCategory(null)}
        onSuccess={loadCategories}
      />

      <ToggleBlogCategoryStatusDialog
        category={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSuccess={loadCategories}
      />

      <DeleteBlogCategoryDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={async () => {
          if (items.length === 1 && page > 1) {
            setPage((p) => Math.max(1, p - 1));
          } else {
            await loadCategories();
          }
        }}
      />
    </>
  );
}