"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchAdmins,
  AdminItem,
  PaginationMeta,
  getStoredAdminUser,
} from "@/lib/api";
import { Card, Chip } from "@/components/ui";

import PageHead from "../ui/PageHead";
import SearchInput from "../ui/SearchInput";
import SegmentedFilter from "../ui/SegmentedFilter";
import ResetFilterButton from "../ui/ResetFilterButton";
import Pagination from "../ui/Pagination";

import CreateAdminDialog from "./CreateAdminDialog";
import EditAdminDialog from "./EditAdminDialog";
import DeleteAdminDialog from "./DeleteAdminDialog";
import ToggleActionDialog, { ActionTarget } from "./ToggleActionDialog";
import { Plus, RotateCw } from "lucide-react";

const LIMIT = 10;
const ADMIN_ROLES = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deleted", label: "Deleted" },
] as const;

export default function AdminsManager({
  eyebrow = "Super Admin Panel",
  title = "Admin Staff Management",
  sub = "Create, modify, assign roles, and manage administrative access for system staff.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const adminUser = getStoredAdminUser();
  const isSuperAdmin = adminUser?.role === "super_admin";

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "all" || roleFilter !== "all");

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
    setPage(1);
  };

  // Dialog States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null);
  const [deleteModeTarget, setDeleteModeTarget] = useState<"soft" | "hard" | "restore">("soft");
  const [actionTarget, setActionTarget] = useState<ActionTarget>(null);

  // Fetch Admins List from Backend
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    let isDeletedParam: boolean | string | undefined = undefined;
    let statusParam: string | undefined = undefined;

    if (statusFilter === "deleted") {
      isDeletedParam = true;
      statusParam = undefined;
    } else if (statusFilter === "active" || statusFilter === "inactive") {
      isDeletedParam = false;
      statusParam = statusFilter;
    } else {
      // "all": Normal list shows all entries (active, inactive, deleted)
      isDeletedParam = "all";
      statusParam = undefined;
    }

    const res = await fetchAdmins({
      page,
      limit: LIMIT,
      search: search,
      status: statusParam,
      role: roleFilter,
      isDeleted: isDeletedParam,
    });

    if (res.success && res.data) {
      setAdmins(res.data.admins);
      setPagination(res.data.pagination);
    } else {
      toast(res.message || "Failed to load admins list");
    }
    setLoading(false);
  }, [page, search, statusFilter, roleFilter, toast]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  return (
    <>
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost sm" onClick={loadAdmins}>
              <RotateCw size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={13} /> Add New Admin
            </button>
          </div>
        }
      />

      <div className="stream mt-4" style={{ width: "100%" }}>
        <Card>
          <div className="table-tools">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search admins by name or email…"
            />

            <SegmentedFilter
              value={roleFilter}
              options={ADMIN_ROLES.map((item) => ({
                value: item.value,
                label: item.label
              }))}
              onChange={(value) => {
                setRoleFilter(value as any);
                setPage(1);
              }}
            />

            <SegmentedFilter
              value={statusFilter}
              options={STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label
              }))}
              onChange={(value) => {
                setStatusFilter(value as any);
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
                  <th>Admin Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading admin staff accounts…
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No admin accounts found.
                    </td>
                  </tr>
                ) : (
                  admins.map((adm, idx) => (
                    <tr key={adm._id}>
                      <td className="td-person">
                        {/* <Avatar src={idx % 2 === 0 ? M(idx + 1) : W(idx + 1)} size={38} /> */}
                        <div className="flex h-12 w-12 aspect-square items-center justify-center rounded-full bg-black/20 text-sm font-semibold">
                          {adm?.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div>
                          <strong>{adm.name}</strong>
                          <span>ID: {adm._id.slice(-6)}</span>
                        </div>
                      </td>
                      <td>{adm.email}</td>
                      <td>
                        <Chip tone={adm.role === "super_admin" ? "mint" : "iris"}>
                          {adm.role === "super_admin" ? "Super Admin" : "Admin"}
                        </Chip>
                      </td>
                      <td>
                        {adm.isDeleted ? (
                          <Chip tone="rose" dot>
                            Deleted
                          </Chip>
                        ) : (
                          <Chip tone={adm.status === "active" ? "mint" : "rose"} dot>
                            {adm.status === "active" ? "Active" : "Inactive"}
                          </Chip>
                        )}
                      </td>
                      <td>
                        {adm.lastLoginAt
                          ? new Date(adm.lastLoginAt).toLocaleString()
                          : "Never"}
                      </td>
                      <td>{new Date(adm.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {adm.isDeleted ? (
                            <>
                              <button
                                className="btn btn-ghost sm"
                                style={{ color: "var(--mint-ink)" }}
                                onClick={() => {
                                  setDeleteModeTarget("restore");
                                  setDeleteTarget(adm);
                                }}
                                title="Restore soft-deleted admin staff account"
                              >
                                Restore
                              </button>
                              <button
                                className="btn btn-ghost sm"
                                style={{ color: "var(--rose-ink)" }}
                                onClick={() => {
                                  setDeleteModeTarget("hard");
                                  setDeleteTarget(adm);
                                }}
                                title="Permanently delete admin account"
                              >
                                Hard Delete
                              </button>
                            </>
                          ) : (
                            <>
                              {adm.status === "inactive" ? (
                                <button
                                  className="btn btn-ghost sm"
                                  style={{ color: "var(--mint-ink)" }}
                                  onClick={() => setActionTarget({ type: "activate", admin: adm })}
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  className="btn btn-ghost sm"
                                  style={{ color: "var(--rose-ink)" }}
                                  onClick={() => setActionTarget({ type: "deactivate", admin: adm })}
                                >
                                  Deactivate
                                </button>
                              )}
                              <button
                                className="btn btn-ghost sm"
                                onClick={() => setEditAdmin(adm)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-ghost sm"
                                style={{ color: "var(--rose-ink)" }}
                                onClick={() => {
                                  setDeleteModeTarget("soft");
                                  setDeleteTarget(adm);
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
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

      <CreateAdminDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAdmins}
      />

      <EditAdminDialog
        admin={editAdmin}
        onClose={() => setEditAdmin(null)}
        onSuccess={loadAdmins}
      />

      <DeleteAdminDialog
        admin={deleteTarget}
        initialMode={deleteModeTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadAdmins}
      />

      <ToggleActionDialog
        actionTarget={actionTarget}
        onClose={() => setActionTarget(null)}
        onSuccess={loadAdmins}
      />
    </>
  );
}
