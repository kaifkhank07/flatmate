"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { updateUserPreference, UserPreferenceItem } from "@/lib/api";
import { X } from "lucide-react";

export type PreferenceCategory = "food" | "pets" | "drink";

export type PreferenceFormData = {
  name: string;
  category: PreferenceCategory;
  isActive: boolean;
};

type EditUserPreferenceDialogProps = {
  preference: UserPreferenceItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

const getImageUrl = (img: unknown): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null && "url" in img && typeof (img as { url: unknown }).url === "string") {
    return (img as { url: string }).url;
  }
  return "";
};

export default function EditUserPreferenceDialog({
  preference,
  onClose,
  onSuccess,
}: EditUserPreferenceDialogProps) {
  const toast = useToast();

  const [formData, setFormData] = useState<PreferenceFormData>({
    name: "",
    category: "food",
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preference) {
      setFormData({
        name: preference.name,
        category: preference.category as PreferenceCategory,
        isActive: preference.isActive !== false,
      });
      setSelectedFile(null);
      setPreviewUrl(getImageUrl(preference.image) || null);
      setSubmitting(false);
    }
  }, [preference]);

  if (!preference) return null;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preference) return;
    if (!formData.name.trim()) {
      toast("Preference name is required");
      return;
    }

    setSubmitting(true);

    let payload: FormData | { name: string; category: PreferenceCategory; isActive: boolean };
    if (selectedFile) {
      const body = new FormData();
      body.append("name", formData.name.trim());
      body.append("category", formData.category);
      body.append("isActive", String(formData.isActive));
      body.append("file", selectedFile);
      payload = body;
    } else {
      payload = {
        name: formData.name.trim(),
        category: formData.category,
        isActive: formData.isActive,
      };
    }

    const res = await updateUserPreference(preference._id, payload);

    setSubmitting(false);
    if (res.success) {
      toast("User preference updated successfully!");
      onClose();
      setSelectedFile(null);
      setPreviewUrl(null);
      onSuccess();
    } else {
      toast(res.message || "Failed to update user preference");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Edit User Preference</h3>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as PreferenceCategory })}
            >
              <option value="food" className="text-slate-900 bg-white">Food Preference</option>
              <option value="pets" className="text-slate-900 bg-white">Pet Preference</option>
              <option value="drink" className="text-slate-900 bg-white">Drink Preference</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Preference Name *
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="text"
              placeholder="e.g. Vegetarian, Dog Lover, Social Drinker"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Upload Image (Optional)
            </label>

            {previewUrl ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preference preview"
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={submitting}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <span className="text-xs font-semibold text-slate-600">
                    Click to upload preference image
                  </span>

                  <span className="text-[11px] text-slate-400 mt-1">
                    SVG, PNG, JPG, WEBP
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  disabled={submitting}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="editPrefIsActive"
              className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="editPrefIsActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Is Active
            </label>
          </div>

          {/* Form Action Buttons */}
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
              {submitting ? "Updating…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
