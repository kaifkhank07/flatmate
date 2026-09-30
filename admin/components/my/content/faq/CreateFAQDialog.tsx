"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FAQPage, createFaqApi } from "@/lib/api";
import { useToast } from "@/lib/toast";

interface CreateFAQDialogProps {
  isOpen: boolean;
  page: FAQPage;
  onClose: () => void;
  onSuccess: () => void;
}

const PAGE_LABELS: Record<FAQPage, string> = {
  home: "Home",
  property: "Property",
  flatmate: "Flatmate",
  rental: "Rental",
  contact: "Contact",
};

export default function CreateFAQDialog({
  isOpen,
  page,
  onClose,
  onSuccess,
}: CreateFAQDialogProps) {
  const toast = useToast();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuestion("");
      setAnswer("");
      setIsActive(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast("Question is required");
      return;
    }

    if (!answer.trim()) {
      toast("Answer is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await createFaqApi({
        question: question.trim(),
        answer: answer.trim(),
        page,
        isActive,
      });

      if (res.success) {
        toast("FAQ created successfully!");
        onSuccess();
        onClose();
      } else {
        toast(res.message || "Failed to create FAQ");
      }
    } catch (error) {
      console.error("Create FAQ error:", error);
      toast("An error occurred while creating FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New FAQ</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adding FAQ under <strong className="text-slate-700">{PAGE_LABELS[page] || page}</strong> page.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Question <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter FAQ question..."
              maxLength={500}
              disabled={submitting}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Answer <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter detailed FAQ answer..."
              rows={4}
              disabled={submitting}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <div className="flex items-center gap-3 h-10">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((prev) => !prev)}
                disabled={submitting}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-slate-700">
                {isActive ? "Active (Visible)" : "Inactive (Hidden)"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !question.trim() || !answer.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
