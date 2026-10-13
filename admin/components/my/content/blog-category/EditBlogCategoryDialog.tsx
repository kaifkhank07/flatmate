"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast";
import { BlogCategoryItem, updateBlogCategoryApi } from "@/lib/api";
import { X } from "lucide-react";

export type EditBlogCategoryDialogProps = {
  category: BlogCategoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditBlogCategoryDialog({
  category,
  onClose,
  onSuccess,
}: EditBlogCategoryDialogProps) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIsActive(category.isActive);
    }
  }, [category]);

  if (!category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await updateBlogCategoryApi(category._id, {
        name: trimmedName,
        isActive,
      });

      if (res.success) {
        toast(res.message || "Blog category updated successfully!");
        onClose();
        onSuccess();
      } else {
        toast(res.message || "Failed to update blog category");
      }
    } catch (error) {
      console.error("Failed to update blog category:", error);
      toast("Failed to update blog category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[440px] space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Edit Blog Category
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Category Name *
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lifestyle, Property Tips, Flatmate Advice"
              maxLength={100}
              required
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />

            {/* <p className="mt-1.5 text-[11px] text-slate-400">
              Slug is automatically updated when the category name changes.
            </p> */}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editBlogCategoryIsActive"
              className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
            />
            <label htmlFor="editBlogCategoryIsActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Mark as Active
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}