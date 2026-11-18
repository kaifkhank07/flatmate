"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { createUserApi } from "@/lib/api";
import { X } from "lucide-react";

export type CreateUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function CreateUserDialog({
  open,
  onClose,
  onSuccess,
}: CreateUserDialogProps) {
  const toast = useToast();

  const [createForm, setCreateForm] = useState<{
    email: string;
    mobile: string;
    password: string;
    userType: "owner" | "flatmate" | "agent" | "builder";
  }>({
    email: "",
    mobile: "",
    password: "",
    userType: "flatmate",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCreateForm({ email: "", mobile: "", password: "", userType: "flatmate" });
      setCreateSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() && !createForm.mobile.trim()) {
      toast("Please provide either email address or mobile number");
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      toast("Password must be at least 6 characters");
      return;
    }

    setCreateSubmitting(true);
    const res = await createUserApi({
      email: createForm.email.trim() || undefined,
      mobile: createForm.mobile.trim() || undefined,
      password: createForm.password,
      userType: createForm.userType,
    });

    if (res.success) {
      toast("User account created successfully!");
      onClose();
      setCreateForm({ email: "", mobile: "", password: "", userType: "flatmate" });
      await onSuccess();
    } else {
      toast(res.message || "Failed to create user account");
    }
    setCreateSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Create User Account</h3>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Address (Optional)
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="email"
              placeholder="user@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Mobile Number (Optional)
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="text"
              placeholder="e.g. +91 9876543210"
              value={createForm.mobile}
              onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              User Type *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={createForm.userType}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  userType: e.target.value as "owner" | "flatmate" | "agent" | "builder",
                })
              }
            >
              <option value="flatmate">Flatmate</option>
              <option value="owner">Owner</option>
              <option value="agent">Agent</option>
              <option value="builder">Builder</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="password"
              placeholder="At least 6 characters"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
              onClick={onClose}
              disabled={createSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              disabled={createSubmitting}
            >
              {createSubmitting ? "Creating…" : "Create User Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
