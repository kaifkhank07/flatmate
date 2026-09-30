"use client";

import { useState } from "react";
import { CityItem, deleteCityApi } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { X } from "lucide-react";

export type DeleteCityDialogProps = {
  city: CityItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteCityDialog({
  city,
  onClose,
  onSuccess,
}: DeleteCityDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!city) return null;

  const handleDeleteConfirm = async () => {
    setSubmitting(true);

    try {
      const res = await deleteCityApi(city._id);

      if (res.success) {
        toast("City deleted successfully.");
        onClose();
        onSuccess();
      } else {
        toast(res.message || "Failed to delete city");
      }
    } catch (error) {
      console.error("Delete city error:", error);
      toast("Failed to delete city");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-rose-600">Delete City Entry</h3>

          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 font-semibold">
              &quot;{city.name}&quot;
            </strong>
            ?
          </p>

          <p className="text-xs text-slate-500">
            This action cannot be undone and will permanently remove this city.
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
