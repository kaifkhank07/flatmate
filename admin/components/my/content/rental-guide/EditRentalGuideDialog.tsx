"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  RentalGuideItem,
  RentalGuideImage,
  RentalGuideSeo,
  updateRentalGuideApi,
  uploadImageApi,
} from "@/lib/api";
import { useToast } from "@/lib/toast";

interface EditRentalGuideDialogProps {
  isOpen: boolean;
  guide: RentalGuideItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRentalGuideDialog({
  isOpen,
  guide,
  onClose,
  onSuccess,
}: EditRentalGuideDialogProps) {
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<RentalGuideImage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !guide) return;

    setTitle(guide.title);
    setDescription(guide.description || "");
    setContent(guide.content);
    setImage(guide.image || null);
    setImagePreview(guide.image?.url || null);
    setUploadingImage(false);
    setIsActive(guide.isActive);
    setMetaTitle(guide.seo?.metaTitle || "");
    setMetaDescription(guide.seo?.metaDescription || "");
    setKeywords(guide.seo?.keywords?.join(", ") || "");
  }, [isOpen, guide]);

  if (!isOpen || !guide) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    const res = await uploadImageApi(file);
    setUploadingImage(false);

    if (res.success && res.data) {
      setImage({ url: res.data.url, key: res.data.key });
      toast("Guide featured image uploaded successfully");
    } else {
      toast(res.message || "Failed to upload image");
      setImagePreview(guide?.image?.url || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast("Guide title is required");
      return;
    }

    if (!content.trim()) {
      toast("Guide content is required");
      return;
    }

    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const seoObj: RentalGuideSeo = {};
    if (metaTitle.trim()) seoObj.metaTitle = metaTitle.trim();
    if (metaDescription.trim()) seoObj.metaDescription = metaDescription.trim();
    if (keywordList.length > 0) seoObj.keywords = keywordList;

    setSubmitting(true);

    try {
      const res = await updateRentalGuideApi(guide._id, {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        image: image ? image : null,
        isActive,
        seo: Object.keys(seoObj).length > 0 ? seoObj : undefined,
      });

      if (res.success) {
        toast("Rental Guide updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast(res.message || "Failed to update rental guide");
      }
    } catch (error) {
      console.error("Update rental guide error:", error);
      toast("An error occurred while updating rental guide");
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
      <div className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Rental Guide</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update guide title, description, content, featured image, or SEO options.
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
              Guide Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Tenant Rights & Lease Agreement Guide"
              maxLength={200}
              disabled={submitting}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Slug will be updated automatically when title changes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Short Description / Excerpt
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary of this guide..."
              rows={2}
              maxLength={500}
              disabled={submitting}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Featured Cover Image
            </label>
            {imagePreview || image?.url ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview || image?.url}
                  alt="Guide cover preview"
                  className="w-full h-full object-cover"
                />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                    Uploading image…
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  disabled={submitting || uploadingImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition shadow"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex flex-col items-center justify-center pt-4 pb-4">
                    <span className="text-xs font-semibold text-slate-600">Click to upload featured cover image</span>
                    <span className="text-[11px] text-slate-400 mt-1">SVG, PNG, JPG, WEBP</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={submitting || uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full guide content here..."
              rows={8}
              disabled={submitting}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editRentalIsActive"
                className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="editRentalIsActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Mark as Public
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">SEO Meta Settings</h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">SEO Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Meta title for search engines..."
                maxLength={200}
                disabled={submitting}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">SEO Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta description for search engine snippets..."
                rows={2}
                maxLength={500}
                disabled={submitting}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">SEO Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="rental, tenant guide, lease rules"
                disabled={submitting}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
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
              disabled={submitting || !title.trim() || !content.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating..." : "Update Rental Guide"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
