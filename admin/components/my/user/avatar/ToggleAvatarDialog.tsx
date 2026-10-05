"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { toggleAvatarStatusApi, AvatarItem } from "@/lib/api";
import { X, RefreshCw } from "lucide-react";

type ToggleAvatarDialogProps = {
  avatar: AvatarItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ToggleAvatarDialog({
  avatar,
  onClose,
  onSuccess,
}: ToggleAvatarDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!avatar) return null;

  const nextStatus = avatar.isActive !== false ? false : true;
  const actionLabel = nextStatus ? "Activate" : "Deactivate";

  const handleToggle = async () => {
    setSubmitting(true);
    const res = await toggleAvatarStatusApi(avatar._id, nextStatus);
    setSubmitting(false);

    if (res.success) {
      toast(`Avatar ${actionLabel.toLowerCase()}d successfully!`);
      onClose();
      onSuccess();
    } else {
      toast(res.message || `Failed to ${actionLabel.toLowerCase()} avatar`);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[400px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <RefreshCw size={18} />
            <h3 className="text-base font-semibold text-slate-900">{actionLabel} Avatar</h3>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2 text-slate-600 text-sm">
          <p>
            Are you sure you want to <strong>{actionLabel.toLowerCase()}</strong> the avatar <strong>&quot;{avatar.name}&quot;</strong>?
          </p>
          <p className="text-xs text-slate-500">
            {nextStatus
              ? "This avatar will become selectable for users in profile customization."
              : "This avatar will be hidden from users during profile customization."}
          </p>
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
            className={`px-5 py-2 text-xs font-semibold rounded-full text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${
              nextStatus ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
            }`}
            onClick={handleToggle}
            disabled={submitting}
          >
            {submitting ? "Updating…" : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
