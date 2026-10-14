"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  HelpCircle,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { FAQPage, createFaqApi } from "@/lib/api";
import { useToast } from "@/lib/toast";

interface CreateFAQDialogProps {
  isOpen: boolean;
  page: FAQPage;
  onClose: () => void;
  onSuccess: () => void;
}

interface FAQInput {
  question: string;
  answer: string;
}

const PAGE_LABELS: Record<FAQPage, string> = {
  home: "Home",
  property: "Property",
  flatmate: "Flatmate",
  rental: "Rental",
  contact: "Contact",
};

const EMPTY_FAQ: FAQInput = {
  question: "",
  answer: "",
};

export default function CreateFAQDialog({
  isOpen,
  page,
  onClose,
  onSuccess,
}: CreateFAQDialogProps) {
  const toast = useToast();

  // FAQs added to the preview list, but not yet saved to the database.
  const [faqs, setFaqs] = useState<FAQInput[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFaqs([]);
      setFaqQuestion("");
      setFaqAnswer("");
      setEditingFaqIndex(null);
      setIsActive(true);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearFaqForm = () => {
    setFaqQuestion("");
    setFaqAnswer("");
    setEditingFaqIndex(null);
  };

  // Add the current input to the preview list, or update an existing FAQ.
  const handleAddOrUpdateFaq = () => {
    if (!faqQuestion.trim()) {
      toast("Question is required");
      return;
    }

    if (!faqAnswer.trim()) {
      toast("Answer is required");
      return;
    }

    const faq = {
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
    };

    if (editingFaqIndex !== null) {
      setFaqs((prev) =>
        prev.map((item, index) =>
          index === editingFaqIndex ? faq : item
        )
      );
      toast("FAQ updated");
    } else {
      setFaqs((prev) => [...prev, faq]);
      toast("FAQ added");
    }

    clearFaqForm();
  };

  const handleEditFaq = (index: number) => {
    setFaqQuestion(faqs[index].question);
    setFaqAnswer(faqs[index].answer);
    setEditingFaqIndex(index);
  };

  const handleCancelFaqEdit = () => {
    clearFaqForm();
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));

    if (editingFaqIndex === index) {
      clearFaqForm();
    } else if (editingFaqIndex !== null && editingFaqIndex > index) {
      setEditingFaqIndex((prev) => (prev === null ? null : prev - 1));
    }

    toast("FAQ removed");
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    setFaqs((prev) => {
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];
      return updated;
    });

    // Keep the edit selection associated with the same FAQ.
    setEditingFaqIndex((current) => {
      if (current === index) return targetIndex;
      if (current === targetIndex) return index;
      return current;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentQuestion = faqQuestion.trim();
    const currentAnswer = faqAnswer.trim();

    // Include the current input even if Add FAQ has not been clicked.
    const faqsToSubmit = [...faqs];

    if (currentQuestion || currentAnswer) {
      if (!currentQuestion || !currentAnswer) {
        toast("Please enter both question and answer for the current FAQ");
        return;
      }

      if (editingFaqIndex !== null) {
        faqsToSubmit[editingFaqIndex] = {
          question: currentQuestion,
          answer: currentAnswer,
        };
      } else {
        faqsToSubmit.push({
          question: currentQuestion,
          answer: currentAnswer,
        });
      }
    }

    if (faqsToSubmit.length === 0) {
      toast("Please add at least one FAQ");
      return;
    }

    const invalidIndex = faqsToSubmit.findIndex(
      (faq) => !faq.question.trim() || !faq.answer.trim()
    );

    if (invalidIndex !== -1) {
      toast(`Question and answer are required for FAQ ${invalidIndex + 1}`);
      return;
    }

    setSubmitting(true);

    try {
      const results = await Promise.allSettled(
        faqsToSubmit.map((faq) =>
          createFaqApi({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            page,
            isActive,
          })
        )
      );

      const failedIndexes = results.reduce<number[]>(
        (indexes, result, index) => {
          if (
            result.status === "rejected" ||
            (result.status === "fulfilled" && !result.value.success)
          ) {
            indexes.push(index);
          }

          return indexes;
        },
        []
      );

      const createdCount = faqsToSubmit.length - failedIndexes.length;

      if (failedIndexes.length === 0) {
        toast(
          `${createdCount} FAQ${createdCount === 1 ? "" : "s"} created successfully!`
        );
        onSuccess();
        onClose();
      } else {
        // Keep only failed FAQs available for retry.
        setFaqs(failedIndexes.map((index) => faqsToSubmit[index]));
        clearFaqForm();

        toast(
          createdCount > 0
            ? `${createdCount} FAQ(s) created. ${failedIndexes.length} failed. Please retry the remaining FAQs.`
            : "Failed to create FAQs. Please try again."
        );
      }
    } catch (error) {
      console.error("Create FAQs error:", error);
      toast("An error occurred while creating FAQs");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add New FAQs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adding FAQs under{" "}
              <strong className="text-slate-700">
                {PAGE_LABELS[page] || page}
              </strong>{" "}
              page.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* FAQ Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="space-y-4">
              {/* Card heading */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <HelpCircle size={18} className="text-amber-500" />
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add multiple FAQs before creating them.
                  </p>
                </div>

                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">
                  {faqs.length} FAQ{faqs.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Added FAQs preview list */}
              {faqs.length > 0 && (
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition ${editingFaqIndex === index
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-start gap-1.5">
                            <span className="text-amber-600 text-xs font-bold mt-0.5">
                              Q{index + 1}.
                            </span>
                            <span className="break-words">
                              {faq.question}
                            </span>
                          </h4>

                          <p className="text-xs text-slate-600 whitespace-pre-wrap break-words">
                            {faq.answer}
                          </p>
                        </div>

                        {/* FAQ actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(index, "up")}
                            disabled={index === 0 || submitting}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveFaq(index, "down")}
                            disabled={
                              index === faqs.length - 1 || submitting
                            }
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditFaq(index)}
                            disabled={submitting}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-100 transition disabled:opacity-50"
                            title="Edit FAQ"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(index)}
                            disabled={submitting}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                            title="Remove FAQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Current FAQ input form */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {editingFaqIndex !== null
                    ? `Edit FAQ #${editingFaqIndex + 1}`
                    : "Add New FAQ"}
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Question <span className="text-rose-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="Enter question..."
                    maxLength={500}
                    disabled={submitting}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Answer <span className="text-rose-500">*</span>
                  </label>

                  <textarea
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="Enter answer..."
                    rows={3}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none transition resize-y focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  {editingFaqIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelFaqEdit}
                      disabled={submitting}
                      className="px-3.5 h-9 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                    >
                      Cancel Edit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddOrUpdateFaq}
                    disabled={
                      submitting ||
                      !faqQuestion.trim() ||
                      !faqAnswer.trim()
                    }
                    className="px-4 h-9 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shared status for all FAQs */}
          {/* <div className="rounded-xl border border-slate-200 p-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Status
            </label>

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
          </div> */}

          {/* Dialog footer */}
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
              disabled={
                submitting ||
                (faqs.length === 0 &&
                  (!faqQuestion.trim() || !faqAnswer.trim()))
              }
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Creating..."
                : `Create ${faqs.length +
                (faqQuestion.trim() && faqAnswer.trim() &&
                  editingFaqIndex === null
                  ? 1
                  : 0)
                } FAQ${faqs.length +
                  (faqQuestion.trim() &&
                    faqAnswer.trim() &&
                    editingFaqIndex === null
                    ? 1
                    : 0) ===
                  1
                  ? ""
                  : "s"
                }`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
