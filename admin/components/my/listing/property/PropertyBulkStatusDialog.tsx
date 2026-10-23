"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { bulkUpdatePropertyStatusApi } from "@/lib/api";
import Icon from "@/components/icons";

interface PropertyBulkStatusDialogProps {
  isOpen: boolean;
  selectedIds: string[];
  initialStatus?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
] as const;

export default function PropertyBulkStatusDialog({
  isOpen,
  selectedIds,
  initialStatus = "approved",
  onClose,
  onSuccess,
}: PropertyBulkStatusDialogProps) {
  const toast = useToast();
  const [targetStatus, setTargetStatus] = useState<string>(initialStatus);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetStatus(initialStatus);
      setRejectionReason("");
    }
  }, [isOpen, initialStatus]);

  if (!isOpen || selectedIds.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetStatus === "rejected" && !rejectionReason.trim()) {
      toast("Rejection reason is required when rejecting property listings.");
      return;
    }

    setSubmitting(true);
    const res = await bulkUpdatePropertyStatusApi(
      selectedIds,
      targetStatus,
      targetStatus === "rejected" ? rejectionReason.trim() : undefined
    );
    setSubmitting(false);

    if (res.success && res.data) {
      const { updatedCount, skippedCount } = res.data;
      toast(`Successfully updated ${updatedCount} property listing(s) to ${targetStatus.toUpperCase()}.`);
      if (skippedCount > 0) {
        toast(`Note: ${skippedCount} listing(s) were already in ${targetStatus} status.`);
      }
      onSuccess();
      onClose();
    } else {
      toast(res.message || "Failed to perform bulk status update");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Icon name="sliders" size={16} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Bulk Update Status
              </h3>
              <p className="text-xs text-slate-500">
                Applying status to <strong className="text-slate-800 font-semibold">{selectedIds.length}</strong> selected propert{selectedIds.length === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Target Status *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              disabled={submitting}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {targetStatus === "rejected" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                rows={3}
                placeholder="Reason for rejecting these listings (included in user notifications)…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          )}

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <span className="text-amber-500 flex items-center">
                <Icon name="shield" size={13} />
              </span>
              <span>Bulk Action Summary</span>
            </div>
            <p>
              Target listings: <strong className="text-slate-900">{selectedIds.length}</strong> item(s).
              Listing owners will receive automated status notifications where applicable.
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
              type="submit"
              className={`px-5 py-2 text-xs font-semibold rounded-full text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                targetStatus === "rejected"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : targetStatus === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
              disabled={submitting}
            >
              {submitting
                ? "Updating…"
                : `Apply ${targetStatus.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
