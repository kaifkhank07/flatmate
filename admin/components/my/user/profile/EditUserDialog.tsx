"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { UserItem, updateUserStatus } from "@/lib/api";
import { X } from "lucide-react";

export type EditUserDialogProps = {
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function EditUserDialog({
  user,
  onClose,
  onSuccess,
}: EditUserDialogProps) {
  const toast = useToast();

  const [editForm, setEditForm] = useState<{
    accountStatus: string;
    profileVerified: boolean;
    verificationStatus: string;
  }>({
    accountStatus: "active",
    profileVerified: false,
    verificationStatus: "not_submitted",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setEditForm({
        accountStatus: user.accountStatus,
        profileVerified: user.profileVerified,
        verificationStatus: user.verificationStatus || "not_submitted",
      });
      setEditSubmitting(false);
    }
  }, [user]);

  if (!user) return null;

  const handleSaveEdit = async () => {
    if (!user) return;
    setEditSubmitting(true);
    const res = await updateUserStatus(user._id, editForm);
    if (res.success) {
      toast("User updated successfully");
      onClose();
      await onSuccess();
    } else {
      toast(res.message || "Failed to update user");
    }
    setEditSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Edit User Account Status</h3>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Account Status
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={editForm.accountStatus}
              onChange={(e) =>
                setEditForm({ ...editForm, accountStatus: e.target.value })
              }
            >
              <option value="active" className="text-slate-900 bg-white">Active</option>
              <option value="inactive" className="text-slate-900 bg-white">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Verification Status
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={editForm.verificationStatus}
              onChange={(e) =>
                setEditForm({ ...editForm, verificationStatus: e.target.value })
              }
            >
              <option value="not_submitted" className="text-slate-900 bg-white">Not Submitted</option>
              <option value="pending" className="text-slate-900 bg-white">Pending Review</option>
              <option value="approved" className="text-slate-900 bg-white">Approved</option>
              <option value="rejected" className="text-slate-900 bg-white">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="profileVerifiedCheckAdmin"
              className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
              checked={editForm.profileVerified}
              onChange={(e) =>
                setEditForm({ ...editForm, profileVerified: e.target.checked })
              }
            />
            <label htmlFor="profileVerifiedCheckAdmin" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Profile Verified Badge
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
              onClick={onClose}
              disabled={editSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              onClick={handleSaveEdit}
              disabled={editSubmitting}
            >
              {editSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
