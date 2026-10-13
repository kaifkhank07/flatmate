"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { CityItem, updateCityApi } from "@/lib/api";
import { X, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";

type EditCityDialogProps = {
  open: boolean;
  city: CityItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditCityDialog({
  open,
  city,
  onClose,
  onSuccess,
}: EditCityDialogProps) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Image Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // SEO Fields
  const [showSeo, setShowSeo] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && city) {
      setName(city.name);
      setState(city.state);
      setCountry(city.country || "India");
      setIsPopular(!!city.isPopular);
      setIsActive(city.isActive !== false);
      setSelectedFile(null);
      setPreviewUrl(city.image?.url || null);
      setShowSeo(false);
      setSeoTitle(city.seo?.title || "");
      setSeoDescription(city.seo?.description || "");
      setSeoKeywords(city.seo?.keywords ? city.seo.keywords.join(", ") : "");
      setSubmitting(false);
    }
  }, [open, city]);

  if (!open || !city) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast("City name is required");
      return;
    }
    if (!state.trim()) {
      toast("State name is required");
      return;
    }

    setSubmitting(true);

    const keywordsArr = seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const seoObj =
      seoTitle.trim() || seoDescription.trim() || keywordsArr.length > 0
        ? {
          title: seoTitle.trim() || undefined,
          description: seoDescription.trim() || undefined,
          keywords: keywordsArr.length > 0 ? keywordsArr : undefined,
        }
        : null;

    let payload: FormData | any;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("state", state.trim());
      formData.append("country", country.trim() || "India");
      formData.append("isPopular", String(isPopular));
      formData.append("isActive", String(isActive));
      if (seoObj) {
        formData.append("seo", JSON.stringify(seoObj));
      } else {
        formData.append("seo", "null");
      }
      formData.append("file", selectedFile);
      payload = formData;
    } else {
      payload = {
        name: name.trim(),
        state: state.trim(),
        country: country.trim() || "India",
        isPopular,
        isActive,
        seo: seoObj,
        removeImage: previewUrl === null && !!city.image?.url,
      };
    }

    const res = await updateCityApi(city._id, payload);
    setSubmitting(false);

    if (res.success) {
      toast("City updated successfully!");
      onClose();
      onSuccess();
    } else {
      toast(res.message || "Failed to update city");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit City</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update city details, image, or SEO configuration.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mumbai"
                required
                disabled={submitting}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                required
                disabled={submitting}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India"
              disabled={submitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              City Image
            </label>

            {previewUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="City preview"
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
                <div className="flex flex-col items-center justify-center pt-3 pb-3">
                  <ImageIcon size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">
                    Click to upload city image
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
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

          {/* Settings Toggles */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsPopular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 text-amber-500 accent-amber-500 rounded border-slate-300 focus:ring-amber-500"
              />
              <label htmlFor="editIsPopular" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Mark as Popular City
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 text-amber-500 accent-amber-500 rounded border-slate-300 focus:ring-amber-500"
              />
              <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Active Status
              </label>
            </div>
          </div>

          {/* SEO Collapsible Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo((prev) => !prev)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider transition"
            >
              <span>SEO Metadata</span>
              {showSeo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSeo && (
              <div className="p-3.5 space-y-3 bg-white border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="e.g. Find Rooms & Flatmates in Mumbai"
                    disabled={submitting}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Brief SEO meta description..."
                    rows={2}
                    disabled={submitting}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="mumbai, flatmates, room rent, pg"
                    disabled={submitting}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Updating…" : "Update City"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
