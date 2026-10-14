"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FAQItem, FAQPage, updateFaqApi } from "@/lib/api";
import { useToast } from "@/lib/toast";

interface EditFAQDialogProps {
  isOpen: boolean;
  faq: FAQItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FAQ_PAGES: { value: FAQPage; label: string }[] = [
  { value: "home", label: "Home Page" },
  { value: "property", label: "Property Page" },
  { value: "flatmate", label: "Flatmate Page" },
  { value: "rental", label: "Rental Guide Page" },
  { value: "contact", label: "Contact Us Page" },
];

export default function EditFAQDialog({
  isOpen,
  faq,
  onClose,
  onSuccess,
}: EditFAQDialogProps) {
  const toast = useToast();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [page, setPage] = useState<FAQPage>("home");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !faq) return;

    setQuestion(faq.question);
    setAnswer(faq.answer);
    setPage(faq.page || "home");
    setIsActive(faq.isActive);
  }, [isOpen, faq]);

  if (!isOpen || !faq) return null;

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

    if (!page) {
      toast("Page selection is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await updateFaqApi(faq._id, {
        question: question.trim(),
        answer: answer.trim(),
        page,
        isActive,
      });

      if (res.success) {
        toast("FAQ updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast(res.message || "Failed to update FAQ");
      }
    } catch (error) {
      console.error("Update FAQ error:", error);
      toast("An error occurred while updating FAQ");
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
            <h2 className="text-lg font-bold text-slate-900">Edit FAQ</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update FAQ question, answer, target page, and status.
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
              Target Page <span className="text-rose-500">*</span>
            </label>
            <select
              value={page}
              onChange={(e) => setPage(e.target.value as FAQPage)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium disabled:opacity-50"
            >
              {FAQ_PAGES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editFaqIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
            />
            <label htmlFor="editFaqIsActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Mark as Active
            </label>
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
              {submitting ? "Updating..." : "Update FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
