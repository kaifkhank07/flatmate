"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { AdminItem, activateAdmin, deactivateAdmin } from "@/lib/api";
import { X } from "lucide-react";

export type ActionType = "activate" | "deactivate";

export type ActionTarget = {
  type: ActionType;
  admin: AdminItem;
} | null;

export type ToggleActionDialogProps = {
  actionTarget: ActionTarget;
  onClose: () => void;
  onSuccess: () => void;
};

export function ToggleActionDialog({
  actionTarget,
  onClose,
  onSuccess,
}: ToggleActionDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!actionTarget) return null;

  const { type, admin } = actionTarget;
  const isActivate = type === "activate";

  const handleExecuteAction = async () => {
    setSubmitting(true);
    let res;
    if (isActivate) {
      res = await activateAdmin(admin._id);
    } else {
      res = await deactivateAdmin(admin._id);
    }

    if (res.success) {
      toast(`Admin ${isActivate ? "activated" : "deactivated"} successfully`);
      onClose();
      onSuccess();
    } else {
      toast(res.message || `Failed to ${type} admin`);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[380px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900 capitalize">
            Confirm {type} Admin Staff
          </h3>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-sm text-slate-700">
          Are you sure you want to {type} admin staff account{" "}
          <strong className="text-slate-900 font-semibold">
            {admin.name} ({admin.email})
          </strong>
          ?
        </p>

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
            className={`px-5 py-2 text-xs font-semibold rounded-full text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${isActivate
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-rose-600 hover:bg-rose-700"
              }`}
            onClick={handleExecuteAction}
            disabled={submitting}
          >
            {submitting ? "Processing…" : `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ToggleActionDialog;
