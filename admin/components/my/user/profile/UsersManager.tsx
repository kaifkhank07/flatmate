"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchUsers,
  fetchUserDetails,
  UserItem,
  UserProfileItem,
  PaginationMeta,
  getStoredAdminUser,
} from "@/lib/api";
import { Avatar, Card, Chip } from "@/components/ui";

import PageHead from "../../ui/PageHead";
import SearchInput from "../../ui/SearchInput";
import SegmentedFilter from "../../ui/SegmentedFilter";
import ResetFilterButton from "../../ui/ResetFilterButton";
import Pagination from "../../ui/Pagination";

import CreateUserDialog from "./CreateUserDialog";
import EditUserDialog from "./EditUserDialog";
import DeleteUserDialog from "./DeleteUserDialog";
import ToggleUserStatusDialog from "./ToggleUserStatusDialog";
import EditUserProfileDialog from "./EditUserProfileDialog";
import UserDetailsDrawer from "./UserDetailsDrawer";

import { Plus, RotateCw } from "lucide-react";

const LIMIT = 10;
const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deleted", label: "Deleted" },
] as const;

const USER_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "flatmate", label: "Flatmate" },
  { value: "owner", label: "Owner" },
  { value: "agent", label: "Agent" },
  { value: "builder", label: "Builder" },
] as const;

export default function UsersManager({
  eyebrow = "User Management",
  title = "User Management",
  sub = "View, verify, update, block, and manage platform flatmate users.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const adminUser = getStoredAdminUser();
  const isSuperAdmin = adminUser?.role === "super_admin";

  // Selected User Drawer / Details state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);

  // Dialog Selection States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleteModeTarget, setDeleteModeTarget] = useState<"soft" | "hard" | "restore">("soft");
  const [statusTarget, setStatusTarget] = useState<UserItem | null>(null);
  const [editProfileUser, setEditProfileUser] = useState<UserItem | null>(null);
  const [editProfileData, setEditProfileData] = useState<UserProfileItem | null>(null);

  const hasActiveFilters = Boolean(search.trim() || filter !== "all" || userTypeFilter !== "all");

  const handleResetFilters = () => {
    setSearch("");
    setFilter("all");
    setUserTypeFilter("all");
    setPage(1);
  };

  // Open Edit Profile Modal
  const handleOpenProfileEdit = async (u: UserItem, prof?: UserProfileItem | null) => {
    setEditProfileUser(u);
    if (prof !== undefined) {
      setEditProfileData(prof);
    } else {
      const res = await fetchUserDetails(u._id);
      if (res.success && res.data) {
        setEditProfileData(res.data.profile);
      } else {
        setEditProfileData(null);
      }
    }
  };

  // Fetch Users List
  const loadUsers = useCallback(async () => {
    setLoading(true);
    let isDeletedParam: boolean | string | undefined = undefined;
    let accountStatusParam: string | undefined = undefined;

    if (filter === "deleted") {
      isDeletedParam = true;
      accountStatusParam = undefined;
    } else if (filter === "active" || filter === "inactive") {
      isDeletedParam = false;
      accountStatusParam = filter;
    } else {
      // "all": Normal list shows all entries (active, inactive, deleted)
      isDeletedParam = "all";
      accountStatusParam = undefined;
    }

    const res = await fetchUsers({
      page,
      limit: LIMIT,
      search: search,
      accountStatus: accountStatusParam,
      userType: userTypeFilter !== "all" ? userTypeFilter : undefined,
      isDeleted: isDeletedParam,
    });

    if (res.success && res.data) {
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } else {
      toast(res.message || "Failed to load users");
    }
    setLoading(false);
  }, [page, search, filter, userTypeFilter, toast]);

  const handleUserUpdated = useCallback(() => {
    loadUsers();
    setDrawerRefreshKey((prev) => prev + 1);
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const getUserTypeTone = (type?: string) => {
    switch (type) {
      case "owner":
        return "iris";
      case "flatmate":
        return "mint";
      case "agent":
        return "amber";
      case "builder":
        return "sand";
      default:
        return "sand";
    }
  };

  const formatUserType = (type?: string) => {
    if (!type) return "Flatmate";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "active":
        return "mint";
      case "inactive":
      case "deleted":
        return "rose";
      default:
        return "sand";
    }
  };

  const getVerificationTone = (status: string) => {
    switch (status) {
      case "not_submitted":
        return "sand";
      case "pending":
        return "amber";
      case "approved":
        return "mint";
      case "rejected":
        return "rose";
      default:
        return "sand";
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
            <button className="btn btn-ghost sm" onClick={loadUsers}>
              <RotateCw size={13} /> Refresh
            </button>
            <button className="btn btn-brand sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={13} /> Add New User
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
              placeholder="Search by email or mobile…"
            />

            <SegmentedFilter
              value={filter}
              options={STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
            />

            <select
              className="px-3 py-1.5 bg-[var(--canvas-2)] border border-[var(--hair-2)] rounded-lg text-xs font-semibold text-[var(--ink-2)] focus:outline-none focus:border-[var(--ember)]"
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              {USER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <ResetFilterButton
              visible={hasActiveFilters}
              onClick={handleResetFilters}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>User Name</th>
                  <th>Email / Mobile</th>
                  <th>User Type</th>
                  <th>Status</th>
                  <th>Completion</th>
                  {/* <th>Verification</th> */}
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      Loading users…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 34, color: "var(--ink-4)" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => {
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
                    const avatarSrc =
                      u.image?.url ||
                      (typeof u.image === "string" ? u.image : null) ||
                      (typeof u.avatar === "string" ? u.avatar : u.avatar?.image?.url) ||
                      u.photoUrl ||
                      u.profile?.image?.url ||
                      (u.profile?.avatar as any)?.image?.url ||
                      undefined;

                    return (
                      <tr key={u._id}>
                        <td
                          className="td-person"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedUserId(u._id)}
                        >
                          <Avatar src={avatarSrc} name={fullName || u.email || u.mobile} size={48} />
                          <div>
                            <strong className="whitespace-nowrap">{fullName || u.email || u.mobile || "Unnamed User"}</strong>
                            {/* <span>ID: {u._id.slice(-6)} • {formatUserType(u.userType)}</span> */}
                            <span>ID: {u._id.slice(-6)}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
                            {u.email && <span>{u.email}</span>}
                            {u.mobile && <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{u.mobile}</span>}
                            {!u.email && !u.mobile && <span style={{ color: "var(--ink-4)" }}>N/A</span>}
                          </div>
                        </td>
                        <td>
                          <Chip tone={getUserTypeTone(u.userType)} dot>
                            {formatUserType(u.userType)}
                          </Chip>
                        </td>
                        <td>
                          {u.isDeleted ? (
                            <Chip tone="rose" dot>
                              Deleted
                            </Chip>
                          ) : (
                            <Chip tone={getStatusTone(u.accountStatus)} dot>
                              {u.accountStatus === "active" ? "Active" : "Inactive"}
                            </Chip>
                          )}
                        </td>
                        <td>
                          <Chip tone={u.profileCompletion && u.profileCompletion >= 80 ? "mint" : u.profileCompletion && u.profileCompletion >= 50 ? "amber" : "sand"}>
                            {u.profileCompletion || 0}%
                          </Chip>
                        </td>
                        {/* <td>
                          <Chip tone={getVerificationTone(u.verificationStatus || "not_submitted")}>
                            {u.verificationStatus.charAt(0).toUpperCase() + u.verificationStatus.slice(1) || "not_submitted"}
                          </Chip>
                        </td> */}
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-ghost sm whitespace-nowrap"
                              onClick={() => setSelectedUserId(u._id)}
                              title="View Details"
                            >
                              Profile
                            </button>
                            <button
                              className="btn btn-ghost sm whitespace-nowrap"
                              onClick={() => setEditUser(u)}
                              title="Edit Status"
                            >
                              Edit Account
                            </button>

                            {u.isDeleted ? (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  className="btn btn-ghost sm whitespace-nowrap"
                                  style={{ color: "var(--mint-ink)" }}
                                  onClick={() => {
                                    setDeleteModeTarget("restore");
                                    setDeleteTarget(u);
                                  }}
                                  title="Restore soft-deleted user account"
                                >
                                  Restore
                                </button>
                                <button
                                  className="btn btn-ghost sm whitespace-nowrap"
                                  style={{ color: "var(--rose-ink)" }}
                                  onClick={() => {
                                    setDeleteModeTarget("hard");
                                    setDeleteTarget(u);
                                  }}
                                  title="Permanently hard-delete user and cascade all data"
                                >
                                  Hard Delete
                                </button>
                              </div>
                            ) : (
                              <>
                                {u.accountStatus === "inactive" ? (
                                  <button
                                    className="btn btn-ghost sm"
                                    style={{ color: "var(--mint-ink)" }}
                                    onClick={() => setStatusTarget(u)}
                                  >
                                    Activate
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-ghost sm"
                                    style={{ color: "var(--rose-ink)" }}
                                    onClick={() => setStatusTarget(u)}
                                  >
                                    Deactivate
                                  </button>
                                )}
                                <button
                                  className="btn btn-ghost sm"
                                  style={{ color: "var(--rose-ink)" }}
                                  onClick={() => {
                                    setDeleteModeTarget("soft");
                                    setDeleteTarget(u);
                                  }}
                                  title="Delete user account"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      <UserDetailsDrawer
        selectedUserId={selectedUserId}
        refreshKey={drawerRefreshKey}
        onClose={() => setSelectedUserId(null)}
        onOpenProfileEdit={(user, profile) => handleOpenProfileEdit(user, profile)}
        onOpenStatusEdit={(user) => setEditUser(user)}
      />

      <CreateUserDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUsers}
      />

      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={handleUserUpdated}
      />

      <DeleteUserDialog
        user={deleteTarget}
        initialMode={deleteModeTarget}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleUserUpdated}
      />

      <ToggleUserStatusDialog
        user={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSuccess={handleUserUpdated}
      />

      <EditUserProfileDialog
        user={editProfileUser}
        profile={editProfileData}
        onClose={() => setEditProfileUser(null)}
        onSuccess={handleUserUpdated}
      />
    </>
  );
}
