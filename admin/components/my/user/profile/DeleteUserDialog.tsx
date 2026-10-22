"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { UserItem, deleteUser, hardDeleteUser, restoreUser } from "@/lib/api";
import { X, AlertTriangle, Trash2, RotateCcw, ShieldAlert } from "lucide-react";

export type DeleteUserDialogProps = {
  user: UserItem | null;
  initialMode?: "soft" | "hard" | "restore";
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function DeleteUserDialog({
  user,
  initialMode,
  onClose,
  onSuccess,
}: DeleteUserDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"soft" | "hard" | "restore">("soft");

  useEffect(() => {
    if (user) {
      if (initialMode) {
        setDeleteMode(initialMode);
      } else {
        setDeleteMode(user.isDeleted ? "restore" : "soft");
      }
    }
  }, [user, initialMode]);

  if (!user) return null;

  const isAlreadyDeleted = user.isDeleted;

  const handleExecuteAction = async () => {
    setSubmitting(true);
    try {
      let res;
      if (deleteMode === "restore") {
        res = await restoreUser(user._id);
        if (res?.success) {
          toast("User account restored successfully");
          onClose();
          await onSuccess();
        } else {
          toast(res?.message || "Failed to restore user");
        }
      } else if (deleteMode === "soft") {
        res = await deleteUser(user._id);
        if (res?.success) {
          toast("User account soft-deleted (archived) successfully");
          onClose();
          await onSuccess();
        } else {
          toast(res?.message || "Failed to soft delete user");
        }
      } else if (deleteMode === "hard") {
        res = await hardDeleteUser(user._id);
        if (res?.success) {
          toast("User account permanently deleted successfully");
          onClose();
          await onSuccess();
        } else {
          toast(res?.message || "Failed to permanently delete user");
        }
      }
    } catch (err: any) {
      toast(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {deleteMode === "restore" ? (
              <RotateCcw className="text-amber-600" size={18} />
            ) : deleteMode === "soft" ? (
              <AlertTriangle className="text-amber-600" size={18} />
            ) : (
              <Trash2 className="text-rose-600" size={18} />
            )}
            <h3
              className={`text-base font-semibold ${
                deleteMode === "hard" ? "text-rose-600" : "text-amber-600"
              }`}
            >
              {deleteMode === "restore"
                ? "Restore User Account"
                : deleteMode === "soft"
                ? "Soft Delete User (Archive)"
                : "Permanent Hard Delete"}
            </h3>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* User Info Preview */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
          <div>
            Target: <strong className="text-slate-900 font-medium">{user.email || user.mobile || user._id}</strong>
          </div>
          <div>
            Current Status:{" "}
            <span
              className={`font-semibold ${
                user.isDeleted ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {user.isDeleted ? "Soft Deleted" : user.accountStatus || "Active"}
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs (Available to both Normal and Super Admin) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          {isAlreadyDeleted ? (
            <>
              <button
                type="button"
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  deleteMode === "restore"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setDeleteMode("restore")}
              >
                Restore Account
              </button>
              <button
                type="button"
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  deleteMode === "hard"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setDeleteMode("hard")}
              >
                Permanent Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  deleteMode === "soft"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setDeleteMode("soft")}
              >
                Soft Delete (Safe)
              </button>
              <button
                type="button"
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  deleteMode === "hard"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setDeleteMode("hard")}
              >
                Hard Delete
              </button>
            </>
          )}
        </div>

        {/* Explanatory Description */}
        <div className="text-xs text-slate-600 leading-relaxed">
          {deleteMode === "restore" ? (
            <p>
              Restoring this user will reactivate their account, allowing them to log in again.
              Their existing listings will remain in their saved state.
            </p>
          ) : deleteMode === "soft" ? (
            <div className="space-y-1.5">
              <p>
                <strong>Soft Delete:</strong> Marks the user as deleted and revokes active sessions.
                All active property and flatmate listings are closed so they disappear from public search.
              </p>
              <p className="text-emerald-700 font-medium">
                Data is preserved and can be restored at any time.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <div className="flex items-center gap-1.5 font-semibold text-rose-700">
                <ShieldAlert size={14} /> Irreversible Permanent Action
              </div>
              <p>
                Permanently purges this user from the database. All user listings, uploaded media,
                reviews, wishlists, and sessions will be permanently deleted.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-5 py-2 text-xs font-semibold rounded-full text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${
              deleteMode === "hard"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
            onClick={handleExecuteAction}
            disabled={submitting}
          >
            {submitting
              ? "Processing…"
              : deleteMode === "restore"
              ? "Confirm Restore"
              : deleteMode === "soft"
              ? "Confirm Soft Delete"
              : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
