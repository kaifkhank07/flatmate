"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchPropertyAmenities,
  PropertyAmenityItem,
  PaginationMeta,
} from "@/lib/api";
import { Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import CreatePropertyAmenityDialog from "./CreatePropertyAmenityDialog";
import EditPropertyAmenityDialog from "./EditPropertyAmenityDialog";
import DeletePropertyAmenityDialog from "./DeletePropertyAmenityDialog";
import TogglePropertyAmenityDialog from "./TogglePropertyAmenityDialog";
import { ListSortDescending, Plus, RotateCw } from "lucide-react";

const LIMIT = 10;
const AMENITY_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "basic", label: "Basic" },
  { value: "security", label: "Security" },
  { value: "parking", label: "Parking" },
  { value: "fitness", label: "Fitness" },
  { value: "recreation", label: "Recreation" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function PropertyAmenitiesManager({
  eyebrow = "Management Panel",
  title = "Property Amenities Options",
  sub = "Configure master property amenity categories (Basic, Security, Parking, Fitness, etc.) and options for property listings.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PropertyAmenityItem[]>([]);
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
  const [editAmenity, setEditAmenity] = useState<PropertyAmenityItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyAmenityItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<PropertyAmenityItem | null>(null);

  // Fetch Property Amenities List from Backend
  const loadAmenities = useCallback(async () => {
    setLoading(true);
    const res = await fetchPropertyAmenities({
      category: categoryFilter,
      page,
      limit: LIMIT,
      search,
    });

    if (res.success && res.data) {
      let filteredItems = res.data.items || [];
      if (statusFilter === "active") {
        filteredItems = filteredItems.filter((i) => i.isActive !== false);
      } else if (statusFilter === "inactive") {
        filteredItems = filteredItems.filter((i) => i.isActive === false);
      }

      setItems(filteredItems);
      const total = res.data.total || 0;
      setPagination({
        page: res.data.page || 1,
        limit: res.data.limit || LIMIT,
        total,
        totalPages: res.data.totalPages || Math.ceil(total / (res.data.limit || LIMIT)) || 1,
      });
    } else {
      toast(res.message || "Failed to load property amenities");
    }
    setLoading(false);
  }, [categoryFilter, statusFilter, search, page, toast]);

  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

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
      case "basic":
        return "sand";
      case "security":
        return "rose";
      case "parking":
        return "iris";
      case "fitness":
        return "mint";
      case "recreation":
        return "sand";
      case "utilities":
        return "mint";
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
            <button className="btn btn-ghost sm" onClick={loadAmenities}>
              <RotateCw size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={13} /> Add Property Amenity
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
              placeholder="Search property amenities…"
            />

            <SegmentedFilter
              value={categoryFilter}
              options={AMENITY_CATEGORIES.map((cat) => ({
                value: cat.value,
                label: cat.label,
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
                  <th>Amenity Name</th>
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
                      Loading property amenities…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No property amenities found.
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
                            /* eslint-disable-next-line @next/next/no-img-element */
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
                            onClick={() => setEditAmenity(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost sm"
                            style={{ color: item.isActive !== false ? "var(--sand-ink)" : "var(--mint-ink)" }}
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

      <CreatePropertyAmenityDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAmenities}
      />

      <EditPropertyAmenityDialog
        amenity={editAmenity}
        onClose={() => setEditAmenity(null)}
        onSuccess={loadAmenities}
      />

      <DeletePropertyAmenityDialog
        amenity={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadAmenities}
      />

      <TogglePropertyAmenityDialog
        amenity={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSuccess={loadAmenities}
      />
    </>
  );
}
