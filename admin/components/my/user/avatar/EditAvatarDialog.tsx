"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { updateAvatarApi, AvatarItem } from "@/lib/api";
import { X } from "lucide-react";

type EditAvatarDialogProps = {
  avatar: AvatarItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditAvatarDialog({
  avatar,
  onClose,
  onSuccess,
}: EditAvatarDialogProps) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (avatar) {
      setName(avatar.name || "");
      setIsActive(avatar.isActive !== false);
      setSelectedFile(null);
      setPreviewUrl(avatar.image?.url || null);
      setSubmitting(false);
    }
  }, [avatar]);

  if (!avatar) return null;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Avatar name is required");
      return;
    }

    setSubmitting(true);

    let payload: FormData | { name: string; isActive: boolean };
    if (selectedFile) {
      const body = new FormData();
      body.append("name", name.trim());
      body.append("isActive", String(isActive));
      body.append("file", selectedFile);
      payload = body;
    } else {
      payload = {
        name: name.trim(),
        isActive,
      };
    }

    const res = await updateAvatarApi(avatar._id, payload);

    setSubmitting(false);
    if (res.success) {
      toast("Avatar updated successfully!");
      onClose();
      onSuccess();
    } else {
      toast(res.message || "Failed to update avatar");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Edit Avatar</h3>
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
              Avatar Name *
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Avatar Image
            </label>

            {previewUrl ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-28 h-28 object-cover rounded-full border-2 border-amber-500 shadow-sm"
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
                    Click to change avatar image
                  </span>

                  <span className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WEBP, SVG
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editAvatarIsActive"
              className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="editAvatarIsActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Mark as Active
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
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
