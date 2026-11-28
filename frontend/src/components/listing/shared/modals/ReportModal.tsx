"use client";

import React, { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { createReportApi, ReportReason, ReportTargetType } from "@/lib/apiServices";
import BaseModal from "./BaseModal";
import LoginRequiredView from "./LoginRequiredView";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: ReportTargetType;
  targetId?: string;
  ownerId?: string;
}

export default function ReportModal({ isOpen, onClose, targetType, targetId, ownerId }: ReportModalProps) {
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);

    if (!isAuthenticated) {
      setReportError("Authentication required. Please log in to report listings.");
      return;
    }

    if (ownerId && user?._id && String(user._id) === String(ownerId)) {
      setReportError("You cannot report your own listing.");
      return;
    }

    if (!targetType || !targetId) {
      setReportError("Listing target information is missing.");
      return;
    }

    if (!reason) {
      setReportError("Please select a report reason.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await createReportApi({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });

      setReportSubmitted(true);
      setTimeout(() => {
        onClose();
        setReportSubmitted(false);
        setReason("spam");
        setDescription("");
        setReportError(null);
      }, 2000);
    } catch (err: any) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message || err.message;
      if (apiMessage && apiMessage.toLowerCase().includes("own listing")) {
        setReportError("You cannot report your own listing.");
      } else if (status === 409 || (apiMessage && apiMessage.toLowerCase().includes("pending"))) {
        setReportError("You have already submitted a pending report for this listing.");
      } else if (status === 401) {
        setReportError("Authentication required. Please log in to report listings.");
      } else if (status === 404) {
        setReportError("Listing could not be found.");
      } else if (status === 400) {
        setReportError(apiMessage || "Invalid report data provided.");
      } else {
        setReportError(apiMessage || "Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {!isAuthenticated ? (
        <LoginRequiredView
          title="Login to Report Listing"
          description="Please log in to your account to submit a report for this listing."
          icon={<AlertCircle className="w-8 h-8 text-amber-500 stroke-[2.2]" />}
          actionText="Log In to Report"
          onClose={onClose}
        />
      ) : reportSubmitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h4 className="text-xl font-bold text-gray-900">Report Submitted</h4>
          <p className="text-xs sm:text-sm text-gray-500">
            Thank you for helping us keep the community safe. Our team will review this report shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-lg">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h4>Report Listing</h4>
          </div>

          <p className="text-xs sm:text-sm text-gray-500">
            Please specify why you are reporting this listing.
          </p>

          {reportError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {reportError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0066FF] bg-white cursor-pointer"
            >
              <option value="spam">Spam</option>
              <option value="fraud">Fraud</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="misleading">Misleading Information</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>Description (Optional)</span>
              <span className="text-gray-400 font-normal">{description.length}/1000</span>
            </div>
            <textarea
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the issue (e.g., incorrect rent amount, fake photos, unreachable contact)..."
              className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#0066FF] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingReport}
              className="px-5 py-2.5 text-gray-600 text-xs sm:text-sm font-medium hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReport}
              className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReport && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmittingReport ? "Submitting..." : "Submit Report"}</span>
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
