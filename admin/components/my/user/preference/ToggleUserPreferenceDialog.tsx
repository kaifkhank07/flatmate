"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { toggleUserPreferenceStatus, UserPreferenceItem } from "@/lib/api";
import { X } from "lucide-react";

type ToggleUserPreferenceDialogProps = {
  preference: UserPreferenceItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ToggleUserPreferenceDialog({
  preference,
  onClose,
  onSuccess,
}: ToggleUserPreferenceDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!preference) return null;

  const isActive = preference.isActive !== false;
  const actionText = isActive ? "Deactivate" : "Activate";

  const handleToggleConfirm = async () => {
    setSubmitting(true);
    const res = await toggleUserPreferenceStatus(preference._id);
    setSubmitting(false);

    if (res.success) {
      toast(`Preference ${isActive ? "deactivated" : "activated"} successfully!`);
      onClose();
      onSuccess();
    } else {
      toast(res.message || "Failed to toggle preference status");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[400px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Confirm {actionText} Preference
          </h3>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Are you sure you want to {actionText.toLowerCase()} <strong className="text-slate-900 font-semibold">&quot;{preference.name}&quot;</strong>?
          </p>
        </div>

        {/* Footer Action Buttons */}
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
            className={`px-5 py-2 text-xs font-semibold rounded-full text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${isActive
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-amber-500 hover:bg-amber-600"
              }`}
            onClick={handleToggleConfirm}
            disabled={submitting}
          >
            {submitting ? "Processing…" : `Confirm ${actionText}`}
          </button>
        </div>
      </div>
    </div>
  );
}
