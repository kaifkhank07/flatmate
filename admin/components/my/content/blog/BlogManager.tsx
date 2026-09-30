"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BlogCategoryItem,
  BlogItem,
  PaginationMeta,
  fetchBlogs,
  fetchBlogCategories,
} from "@/lib/api";

import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";

import { Card, Chip } from "@/components/ui";
import { Eye, FileText, Plus, RotateCw } from "lucide-react";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import SelectFilter from "../../ui/SelectFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import DeleteBlogDialog from "./DeleteBlogDialog";
import ToggleBlogStatusDialog from "./ToggleBlogStatusDialog";

const LIMIT = 10;
const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function BlogManager({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();

  const pathname = usePathname();
  const toast = useToast();

  const basePath = pathname.startsWith("/super-admin")
    ? "/super-admin/blogs"
    : "/admin/blogs";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlogItem[]>([]);

  const [, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<BlogItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<BlogItem | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const res = await fetchBlogCategories({
        page: 1,
        limit: 100,
      });

      if (res.success && res.data) {
        setCategories(res.data.items || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to load blog categories:", error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadBlogs = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetchBlogs({
        page,
        limit: LIMIT,
        search: q.trim() || undefined,
        isActive:
          selectedStatusFilter === "all"
            ? undefined
            : selectedStatusFilter === "active",
        categoryId: selectedCategoryFilter || undefined,
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
        toast(res.message || "Failed to load blogs");
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
      setItems([]);
      toast("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [selectedStatusFilter, selectedCategoryFilter, page, q, toast]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      map.set(cat._id, cat.name);
    });
    return map;
  }, [categories]);

  const getCategoryName = (blog: BlogItem): string => {
    if (!blog.categoryId) return "Uncategorized";

    if (typeof blog.categoryId === "string") {
      return categoryMap.get(blog.categoryId) || "Uncategorized";
    }

    if (typeof blog.categoryId === "object" && blog.categoryId !== null) {
      if ("name" in blog.categoryId && typeof blog.categoryId.name === "string") {
        return blog.categoryId.name;
      }
      if ("_id" in blog.categoryId && typeof blog.categoryId._id === "string") {
        return categoryMap.get(blog.categoryId._id) || "Uncategorized";
      }
    }

    return "Uncategorized";
  };

  const handleSearch = (value: string) => {
    setQ(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatusFilter(value);
    setPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategoryFilter(value);
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count++;
    if (selectedStatusFilter !== "all") count++;
    if (selectedCategoryFilter) count++;
    return count;
  }, [q, selectedStatusFilter, selectedCategoryFilter]);

  const handleResetFilters = () => {
    setQ("");
    setSelectedStatusFilter("all");
    setSelectedCategoryFilter("");
    setPage(1);
  };

  const handleRefresh = async () => {
    await Promise.all([loadCategories(), loadBlogs()]);
  };

  return (
    <>
      <PageHead
        eyebrow={eyebrow || "Manage all blogs"}
        title={title || "Blog Management"}
        sub={sub || "Manage your blog posts and categories."}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RotateCw size={13} />
              {loading ? "Loading..." : "Refresh"}
            </button>

            <Link href={`${basePath}/create`} className="btn btn-brand sm">
              <Plus size={13} /> Add Blog
            </Link>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools">
            <SearchInput
              value={q}
              onChange={handleSearch}
              placeholder="Search blogs…"
            />

            <SegmentedFilter
              options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
              value={selectedStatusFilter}
              onChange={handleStatusFilter}
            />

            <SelectFilter
              value={selectedCategoryFilter}
              placeholder="All Categories"
              options={categories.map((category) => ({
                value: category._id,
                label: category.name,
              }))}
              onChange={(val) => {
                handleCategoryFilter(val);
                setPage(1);
              }}
            />

            <ResetFilterButton
              visible={activeFiltersCount > 0}
              onClick={handleResetFilters}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Blog Title & Slug</th>
                  <th>Category</th>
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
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 34,
                        color: "var(--ink-4)",
                      }}
                    >
                      Loading blogs…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 34,
                        color: "var(--ink-4)",
                      }}
                    >
                      No blogs found.
                    </td>
                  </tr>
                ) : (
                  items.map((blog) => (
                    <tr key={blog._id}>
                      <td className="td-person">
                        <Link
                          href={`${basePath}/${blog._id}`}
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
                          {blog.image?.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={blog.image.url}
                              alt={blog.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <FileText size={16} />
                          )}
                        </Link>

                        <div style={{ minWidth: 0 }}>
                          <Link
                            href={`${basePath}/${blog._id}`}
                            style={{
                              display: "block",
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                              color: "inherit",
                              textDecoration: "none",
                            }}
                            className="hover:underline"
                          >
                            {blog.title}
                          </Link>

                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink-4)",
                              marginTop: 3,
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            /{blog.slug}
                          </div>
                        </div>
                      </td>

                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {getCategoryName(blog)}
                      </td>

                      <td>
                        <Chip tone={blog.isActive ? "mint" : "rose"} dot>
                          {blog.isActive ? "Active" : "Inactive"}
                        </Chip>
                      </td>

                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {new Date(blog.createdAt).toLocaleDateString("en-IN")}
                      </td>

                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {new Date(blog.updatedAt).toLocaleDateString("en-IN")}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link
                            href={`${basePath}/${blog._id}`}
                            className="btn btn-ghost sm"
                          >
                            <Eye size={13} /> View
                          </Link>

                          <Link
                            href={`${basePath}/${blog._id}/edit`}
                            className="btn btn-ghost sm"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className="btn btn-ghost sm"
                            onClick={() => setToggleTarget(blog)}
                            style={{
                              color: blog.isActive
                                ? "var(--rose-ink)"
                                : "var(--mint-ink)",
                            }}
                          >
                            {blog.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost sm"
                            style={{ color: "var(--rose-ink)" }}
                            onClick={() => setDeleteTarget(blog)}
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

      <ToggleBlogStatusDialog
        blog={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSuccess={loadBlogs}
      />

      <DeleteBlogDialog
        blog={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={async () => {
          setDeleteTarget(null);
          if (items.length === 1 && page > 1) {
            setPage((p) => Math.max(1, p - 1));
          } else {
            await loadBlogs();
          }
        }}
      />
    </>
  );
}
