"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchAvatars,
  AvatarItem,
  PaginationMeta,
} from "@/lib/api";
import { Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import CreateAvatarDialog from "./CreateAvatarDialog";
import EditAvatarDialog from "./EditAvatarDialog";
import DeleteAvatarDialog from "./DeleteAvatarDialog";
import ToggleAvatarDialog from "./ToggleAvatarDialog";
import { User, Plus, RotateCw } from "lucide-react";

const LIMIT = 10;
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function AvatarManager({
  eyebrow = "Management Panel",
  title = "Avatar Master Collection",
  sub = "Configure preset profile avatars with image uploads and active status control.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "all");

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  // Dialog Selection States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAvatar, setEditAvatar] = useState<AvatarItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AvatarItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AvatarItem | null>(null);

  // Fetch Avatars List from Backend
  const loadAvatars = useCallback(async () => {
    setLoading(true);
    const res = await fetchAvatars({
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
      toast(res.message || "Failed to load avatars");
    }
    setLoading(false);
  }, [statusFilter, search, page, toast]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const getImageUrl = (img: unknown): string => {
    if (!img) return "";
    if (typeof img === "string") return img;
    if (typeof img === "object" && img !== null && "url" in img && typeof (img as { url: unknown }).url === "string") {
      return (img as { url: string }).url;
    }
    return "";
  };

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadAvatars}>
              <RotateCw size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={13} /> Add Avatar
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
              placeholder="Search avatars by name…"
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
                  <th>Avatar Details</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading avatars…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No avatars found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      <td className="td-person">
                        <div
                          style={{
                            width: 44,
                            height: 44,
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <span>ID: {item._id.slice(-6)}</span>
                        </div>
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
                            onClick={() => setEditAvatar(item)}
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

      <CreateAvatarDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAvatars}
      />

      <EditAvatarDialog
        avatar={editAvatar}
        onClose={() => setEditAvatar(null)}
        onSuccess={loadAvatars}
      />

      <DeleteAvatarDialog
        avatar={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadAvatars}
      />

      <ToggleAvatarDialog
        avatar={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSuccess={loadAvatars}
      />
    </>
  );
}
