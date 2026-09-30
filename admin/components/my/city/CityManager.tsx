"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchCities,
  toggleCityStatusApi,
  CityItem,
  PaginationMeta,
} from "@/lib/api";
import { Card, Chip } from "@/components/ui";

import PageHead from "../ui/PageHead";
import SearchInput from "../ui/SearchInput";
import SegmentedFilter from "../ui/SegmentedFilter";
import ResetFilterButton from "../ui/ResetFilterButton";
import Pagination from "../ui/Pagination";

import CreateCityDialog from "./CreateCityDialog";
import EditCityDialog from "./EditCityDialog";
import DeleteCityDialog from "./DeleteCityDialog";
import ImportCityDialog from "./ImportCityDialog";
import { Building, Download, Plus, RotateCw, Upload } from "lucide-react";

const LIMIT = 10;

const STATUS_FILTERS = [
  { value: "all", label: "All Cities" },
  { value: "popular", label: "Popular" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function CityManager({
  eyebrow = "Management Panel",
  title = "City Management",
  sub = "Configure supported marketplace cities, popular status, and SEO metadata.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CityItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedEditCity, setSelectedEditCity] = useState<CityItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CityItem | null>(null);

  const handleDownloadTemplate = () => {
    const templateCsv = `name,state,country,isPopular,isActive,slug,seoTitle,seoDescription,seoKeywords
Mumbai,Maharashtra,India,true,true,mumbai,Find Flatmates in Mumbai,Find rooms and flatmates in Mumbai,"mumbai,flatmates,rooms"
Pune,Maharashtra,India,false,true,pune,,, "pune,flatmates"
Nagpur,Maharashtra,India,true,true,nagpur,,, "nagpur,rooms"`;

    const blob = new Blob([templateCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cities-import-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadCities = useCallback(async () => {
    setLoading(true);

    let isActiveFilter: boolean | undefined = undefined;
    let isPopularFilter: boolean | undefined = undefined;

    if (selectedFilter === "active") isActiveFilter = true;
    if (selectedFilter === "inactive") isActiveFilter = false;
    if (selectedFilter === "popular") isPopularFilter = true;

    const res = await fetchCities({
      page,
      limit: LIMIT,
      search: q.trim() || undefined,
      isActive: isActiveFilter,
      isPopular: isPopularFilter,
    });

    if (res.success && res.data) {
      setItems(res.data.items || []);
      const total = res.data.total || 0;
      setPagination({
        page: res.data.page || page,
        limit: res.data.limit || LIMIT,
        total,
        totalPages: res.data.totalPages || Math.ceil(total / LIMIT) || 1,
      });
    } else {
      toast(res.message || "Failed to load cities");
    }
    setLoading(false);
  }, [selectedFilter, page, q, toast]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const handleSearch = (value: string) => {
    setQ(value);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedFilter("all");
    setQ("");
    setPage(1);
  };

  const handleToggleStatus = async (item: CityItem) => {
    const newStatus = !item.isActive;
    const res = await toggleCityStatusApi(item._id, newStatus);
    if (res.success) {
      toast(`City ${newStatus ? "activated" : "deactivated"} successfully!`);
      loadCities();
    } else {
      toast(res.message || "Failed to toggle city status");
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedFilter !== "all") count++;
    if (q.trim() !== "") count++;
    return count;
  }, [selectedFilter, q]);

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost sm" onClick={loadCities}>
              <RotateCw size={13} /> Refresh
            </button>
            <button className="btn btn-ghost sm" onClick={handleDownloadTemplate}>
              <Download size={13} /> Download Template
            </button>
            <button className="btn btn-ghost sm" onClick={() => setIsImportOpen(true)}>
              <Upload size={13} /> Import CSV
            </button>
            <button className="btn btn-brand sm" onClick={() => setIsCreateOpen(true)}>
              <Plus size={13} /> Add City
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools">
            <SearchInput
              value={q}
              onChange={handleSearch}
              placeholder="Search by city name, state, country, or slug…"
            />

            <SegmentedFilter
              options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
              value={selectedFilter}
              onChange={handleFilterChange}
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
                  <th>Image</th>
                  <th>City Name & Slug</th>
                  <th>State & Country</th>
                  <th>Popular</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading cities…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No cities found matching criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      <td style={{ width: 56 }}>
                        <div
                          className="relative w-10 h-10 rounded-xl overflow-hidden border border-[var(--hair-2)] bg-[var(--canvas-2)] flex items-center justify-center flex-shrink-0"
                        >
                          {item.image?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback icon on image load error
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Building size={18} />
                          )}
                        </div>
                      </td>

                      <td style={{ maxWidth: 220 }}>
                        <strong className="block text-xs font-bold text-[var(--ink)] truncate">
                          {item.name}
                        </strong>
                        <span className="text-[11px] text-[var(--ink-3)] font-mono">
                          /{item.slug}
                        </span>
                      </td>

                      <td style={{ maxWidth: 180 }}>
                        <strong className="block text-xs font-semibold text-[var(--ink-2)] truncate">
                          {item.state}
                        </strong>
                        <span className="text-[11px] text-[var(--ink-3)]">
                          {item.country || "India"}
                        </span>
                      </td>

                      <td>
                        <Chip tone={item.isPopular ? "mint" : "sand"}>
                          {item.isPopular ? "POPULAR" : "STANDARD"}
                        </Chip>
                      </td>

                      <td>
                        <Chip tone={item.isActive ? "mint" : "rose"} dot>
                          {item.isActive ? "ACTIVE" : "INACTIVE"}
                        </Chip>
                      </td>

                      <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            className="btn btn-ghost sm"
                            onClick={() => setSelectedEditCity(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost sm"
                            style={{ color: item.isActive ? "var(--sand-ink)" : "var(--mint-ink)" }}
                            onClick={() => handleToggleStatus(item)}
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
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
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </Card>
      </div>

      <CreateCityDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadCities}
      />

      <ImportCityDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadCities}
      />

      <EditCityDialog
        open={!!selectedEditCity}
        city={selectedEditCity}
        onClose={() => setSelectedEditCity(null)}
        onSuccess={loadCities}
      />

      <DeleteCityDialog
        city={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadCities}
      />
    </>
  );
}
