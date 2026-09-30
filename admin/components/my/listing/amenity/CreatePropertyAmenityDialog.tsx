"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { createPropertyAmenityApi } from "@/lib/api";
import { X } from "lucide-react";

export type AmenityCategory = "basic" | "security" | "parking" | "fitness" | "recreation" | "utilities" | "other";

export type AmenityFormData = {
  name: string;
  category: AmenityCategory;
  isActive: boolean;
};

type CreatePropertyAmenityDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreatePropertyAmenityDialog({
  open,
  onClose,
  onSuccess,
}: CreatePropertyAmenityDialogProps) {
  const toast = useToast();

  const [formData, setFormData] = useState<AmenityFormData>({
    name: "",
    category: "basic",
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({ name: "", category: "basic", isActive: true });
      setSelectedFile(null);
      setPreviewUrl(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast("Amenity name is required");
      return;
    }

    setSubmitting(true);

    let payload: FormData | { name: string; category: AmenityCategory; isActive: boolean };
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

    const res = await createPropertyAmenityApi(payload);

    setSubmitting(false);
    if (res.success) {
      toast("Property amenity created successfully!");
      onClose();
      setSelectedFile(null);
      setPreviewUrl(null);
      onSuccess();
    } else {
      toast(res.message || "Failed to create property amenity");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Add Property Amenity</h3>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as AmenityCategory })}
            >
              <option value="basic" className="text-slate-900 bg-white">Basic (WiFi, AC, TV, Lift)</option>
              <option value="security" className="text-slate-900 bg-white">Security (CCTV, Gated, Guard)</option>
              <option value="parking" className="text-slate-900 bg-white">Parking (Car, Bike)</option>
              <option value="fitness" className="text-slate-900 bg-white">Fitness (Gym, Swimming Pool)</option>
              <option value="recreation" className="text-slate-900 bg-white">Recreation (Clubhouse, Garden)</option>
              <option value="utilities" className="text-slate-900 bg-white">Utilities (Power Backup, Water Supply)</option>
              <option value="other" className="text-slate-900 bg-white">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Amenity Name *
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="text"
              placeholder="e.g. WiFi, Swimming Pool, 24/7 Security"
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
                  alt="Amenity preview"
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
                    Click to upload amenity image
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
              {submitting ? "Creating…" : "Create Amenity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
