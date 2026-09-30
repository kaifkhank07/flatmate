"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchFaqs,
  FAQItem,
  FAQPage,
  PaginationMeta,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import CreateFAQDialog from "./CreateFAQDialog";
import EditFAQDialog from "./EditFAQDialog";
import DeleteFAQDialog from "./DeleteFAQDialog";

const LIMIT = 10;

const PAGE_TABS: { value: FAQPage; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "property", label: "Property" },
  { value: "flatmate", label: "Flatmate" },
  { value: "rental", label: "Rental" },
  { value: "contact", label: "Contact" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function FAQManager({
  eyebrow = "Management Panel",
  title = "FAQ Management",
  sub = "Manage page FAQs by selecting a page category below.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [selectedPage, setSelectedPage] = useState<FAQPage>("home");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FAQItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEditFaq, setSelectedEditFaq] = useState<FAQItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    const res = await fetchFaqs({
      faqPage: selectedPage,
      isActive:
        selectedStatusFilter === "all"
          ? undefined
          : selectedStatusFilter === "active",
      search: q.trim() || undefined,
      page,
      limit: LIMIT,
    });

    if (res.success && res.data) {
      setItems(res.data.faqs || []);
      const total = res.data.pagination?.total || 0;
      setPagination({
        page: res.data.pagination?.page || page,
        limit: res.data.pagination?.limit || LIMIT,
        total,
        totalPages: res.data.pagination?.totalPages || Math.ceil(total / LIMIT) || 1,
      });
    } else {
      toast(res.message || "Failed to load FAQs");
    }
    setLoading(false);
  }, [selectedPage, selectedStatusFilter, q, page, toast]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleSearch = (value: string) => {
    setQ(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatusFilter(value);
    setPage(1);
  };

  const handlePageTabChange = (pageTab: FAQPage) => {
    setSelectedPage(pageTab);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedStatusFilter("all");
    setQ("");
    setPage(1);
  };

  const handleOpenEditModal = (item: FAQItem) => {
    setSelectedEditFaq(item);
    setIsEditDialogOpen(true);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatusFilter !== "all") count++;
    if (q.trim() !== "") count++;
    return count;
  }, [selectedStatusFilter, q]);

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadFaqs}>
              <Icon name="refresh" size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setIsCreateDialogOpen(true)}>
              + Add FAQ
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        {/* Page Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {PAGE_TABS.map((tab) => {
            const isSelected = selectedPage === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handlePageTabChange(tab.value)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${isSelected
                  ? "bg-[var(--ember)] text-white shadow-md font-bold"
                  : "bg-[var(--card)] text-[var(--ink-2)] border border-[var(--hair-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)]"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <Card>
          <div className="table-tools">
            <SearchInput
              value={q}
              onChange={handleSearch}
              placeholder="Search FAQs…"
            />

            <SegmentedFilter
              options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
              value={selectedStatusFilter}
              onChange={handleStatusFilter}
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
                  <th>Question</th>
                  <th>Answer Preview</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading {selectedPage.toUpperCase()} FAQs…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No FAQs found for page &quot;{selectedPage}&quot;.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      <td style={{ maxWidth: 280 }}>
                        <strong className="block text-xs font-bold text-[var(--ink)] truncate">
                          {item.question}
                        </strong>
                        <span className="text-[11px] text-[var(--ink-3)]">
                          ID: {item._id.slice(-6)}
                        </span>
                      </td>

                      <td style={{ maxWidth: 350 }}>
                        <p className="text-xs text-[var(--ink-2)] line-clamp-2 truncate">
                          {item.answer}
                        </p>
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
                            onClick={() => handleOpenEditModal(item)}
                          >
                            Edit
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

      <CreateFAQDialog
        isOpen={isCreateDialogOpen}
        page={selectedPage}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={loadFaqs}
      />

      <EditFAQDialog
        isOpen={isEditDialogOpen}
        faq={selectedEditFaq}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedEditFaq(null);
        }}
        onSuccess={loadFaqs}
      />

      <DeleteFAQDialog
        faq={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadFaqs}
      />
    </>
  );
}

