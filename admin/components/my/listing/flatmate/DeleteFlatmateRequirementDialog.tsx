"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { FlatmateRequirementItem, deleteFlatmateRequirementApi } from "@/lib/api";
import Icon from "@/components/icons";

interface DeleteFlatmateRequirementDialogProps {
  requirement: FlatmateRequirementItem | null;
  onClose: () => void;
  onSuccess: (deletedRequirementId: string) => void;
}

export default function DeleteFlatmateRequirementDialog({
  requirement,
  onClose,
  onSuccess,
}: DeleteFlatmateRequirementDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!requirement) return null;

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    const res = await deleteFlatmateRequirementApi(requirement._id);
    setSubmitting(false);

    if (res.success) {
      toast(`Flatmate Requirement "${requirement.title}" deleted successfully.`);
      onSuccess(requirement._id);
      onClose();
    } else {
      toast(res.message || "Failed to delete requirement");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-rose-600">Delete Flatmate Requirement</h3>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="text-sm text-slate-700">
          Are you sure you want to delete <strong className="text-slate-900 font-semibold">&quot;{requirement.title}&quot;</strong>?
        </div>
        <div className="text-xs text-slate-500">
          This action cannot be undone and will permanently remove the flatmate requirement record.
        </div>

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
            className="px-5 py-2 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            onClick={handleDeleteConfirm}
            disabled={submitting}
          >
            {submitting ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
