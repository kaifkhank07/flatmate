"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import {
  FlatmateRequirementItem,
  updateFlatmateRequirementStatusApi,
} from "@/lib/api";
import Icon from "@/components/icons";

interface FlatmateRequirementStatusChangeDialogProps {
  requirement: FlatmateRequirementItem | null;
  newStatus: string;
  onClose: () => void;
  onSuccess: (updatedRequirementId?: string) => void;
}

export default function FlatmateRequirementStatusChangeDialog({
  requirement,
  newStatus,
  onClose,
  onSuccess,
}: FlatmateRequirementStatusChangeDialogProps) {
  const toast = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [targetStatus, setTargetStatus] = useState(newStatus);

  useEffect(() => {
    if (requirement) {
      setRejectionReason(requirement.rejectionReason || "");
      setTargetStatus(newStatus || "active");
    } else {
      setRejectionReason("");
    }
  }, [requirement, newStatus]);

  if (!requirement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetStatus === "rejected" && !rejectionReason.trim()) {
      toast("Rejection reason is required when rejecting a flatmate requirement.");
      return;
    }

    setSubmitting(true);
    const res = await updateFlatmateRequirementStatusApi(
      requirement._id,
      targetStatus,
      targetStatus === "rejected" ? rejectionReason.trim() : undefined
    );
    setSubmitting(false);

    if (res.success) {
      toast(`Requirement status updated to "${targetStatus.toUpperCase()}".`);
      onSuccess(requirement._id);
      onClose();
    } else {
      toast(res.message || "Failed to update requirement status");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Change Status: <span className="uppercase text-amber-600">{targetStatus}</span>
          </h3>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs text-slate-700">
            Target Requirement: <strong className="text-slate-900 font-semibold">&quot;{requirement.title}&quot;</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Target Status *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
              <option value="blocked">Blocked</option>
              <option value="closed">Closed</option>
              <option value="expired">Expired</option>
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
                placeholder="Provide feedback on why this post is rejected…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
          )}

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
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Updating…" : `Confirm ${targetStatus.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
