"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { deleteAvatarApi, AvatarItem } from "@/lib/api";
import { X, AlertTriangle } from "lucide-react";

type DeleteAvatarDialogProps = {
  avatar: AvatarItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteAvatarDialog({
  avatar,
  onClose,
  onSuccess,
}: DeleteAvatarDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!avatar) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    const res = await deleteAvatarApi(avatar._id);
    setSubmitting(false);

    if (res.success) {
      toast("Avatar deleted successfully!");
      onClose();
      onSuccess();
    } else {
      toast(res.message || "Failed to delete avatar");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[400px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={18} />
            <h3 className="text-base font-semibold text-slate-900">Delete Avatar</h3>
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
            Are you sure you want to delete the avatar <strong>&quot;{avatar.name}&quot;</strong>?
          </p>
          <p className="text-xs text-rose-500 font-medium">
            This action cannot be undone and will permanently remove its image from S3 storage.
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
            className="px-5 py-2 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting…" : "Delete Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}
