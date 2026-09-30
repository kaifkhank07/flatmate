"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast";
import { AdminItem, updateAdmin } from "@/lib/api";
import { X } from "lucide-react";

export type EditAdminDialogProps = {
  admin: AdminItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditAdminDialog({
  admin,
  onClose,
  onSuccess,
}: EditAdminDialogProps) {
  const toast = useToast();

  const [editForm, setEditForm] = useState<{
    name: string;
    role: "admin" | "super_admin";
    status: "active" | "inactive";
  }>({ name: "", role: "admin", status: "active" });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (admin) {
      setEditForm({
        name: admin.name,
        role: admin.role,
        status: admin.status,
      });
    }
  }, [admin]);

  if (!admin) return null;

  const handleSaveEdit = async () => {
    setSubmitting(true);
    const res = await updateAdmin(admin._id, editForm);
    if (res.success) {
      toast("Admin updated successfully");
      onClose();
      onSuccess();
    } else {
      toast(res.message || "Failed to update admin");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Edit Admin Account
          </h3>
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
              Full Name
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={editForm.role}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  role: e.target.value as "admin" | "super_admin",
                })
              }
            >
              <option value="admin" className="text-slate-900 bg-white">
                Admin
              </option>
              <option value="super_admin" className="text-slate-900 bg-white">
                Super Admin
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Account Status
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  status: e.target.value as "active" | "inactive",
                })
              }
            >
              <option value="active" className="text-slate-900 bg-white">
                Active
              </option>
              <option value="inactive" className="text-slate-900 bg-white">
                Inactive
              </option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              onClick={handleSaveEdit}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditAdminDialog;
