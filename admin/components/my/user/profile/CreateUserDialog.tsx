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
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    userType: "owner" | "flatmate" | "agent" | "builder";
  }>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    userType: "flatmate",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        userType: "flatmate",
      });
      setCreateSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName.trim()) {
      toast("Please enter first name");
      return;
    }
    if (!createForm.lastName.trim()) {
      toast("Please enter last name");
      return;
    }
    if (!createForm.email.trim() || !/\S+@\S+\.\S+/.test(createForm.email)) {
      toast("Please enter a valid email address");
      return;
    }
    const cleanDigits = createForm.mobile.replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length < 10) {
      toast("Please enter a valid 10-digit mobile number");
      return;
    }

    setCreateSubmitting(true);
    const res = await createUserApi({
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
      email: createForm.email.trim().toLowerCase(),
      mobile: createForm.mobile.trim(),
      userType: createForm.userType,
    });

    if (res.success) {
      toast("User account created successfully!");
      onClose();
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        userType: "flatmate",
      });
      await onSuccess();
    } else {
      toast(res.message || "Failed to create user account");
    }
    setCreateSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Create User Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a new user directly without requiring OTP verification
            </p>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* First Name & Last Name Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                type="text"
                placeholder="First Name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                type="text"
                placeholder="Last Name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="email"
              placeholder="user@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Mobile Number (10 Digits) *
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="tel"
              placeholder="9876543210"
              maxLength={15}
              value={createForm.mobile}
              onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
              required
            />
          </div>

          {/* User Type */}
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
