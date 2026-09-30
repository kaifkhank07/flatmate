"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast";
import { createBlogCategoryApi } from "@/lib/api";
import { X } from "lucide-react";

export type CreateBlogCategoryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateBlogCategoryDialog({
  open,
  onClose,
  onSuccess,
}: CreateBlogCategoryDialogProps) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setIsActive(true);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await createBlogCategoryApi({
        name: trimmedName,
        isActive,
      });

      if (res.success) {
        toast(res.message || "Blog category created successfully!");
        setName("");
        setIsActive(true);
        onClose();
        onSuccess();
      } else {
        toast(res.message || "Failed to create blog category");
      }
    } catch (error) {
      console.error("Failed to create blog category:", error);
      toast("Failed to create blog category");
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
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold">Create Blog Category</h2>
            <p className="text-sm text-slate-500 mt-1">
              Add a new blog category.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              maxLength={100}
              disabled={submitting}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
            />

            <p className="text-xs text-slate-400 mt-1.5">
              Slug will be generated automatically from the category name.
            </p>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-700">Active</p>
              <p className="text-xs text-slate-400">
                Make this category available for blogs.
              </p>
            </div>

            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 accent-amber-500"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 h-10 rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 h-10 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}