"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export type DeleteNotificationDialogProps = {
  isOpen: boolean;
  notificationTitle?: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteNotificationDialog({
  isOpen,
  notificationTitle,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteNotificationDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[380px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900 capitalize">
            Confirm Delete Notification
          </h3>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-sm text-slate-700">
          Are you sure you want to delete notification alert{" "}
          <strong className="text-slate-900 font-semibold">
            {notificationTitle ? `"${notificationTitle}"` : "this notification"}
          </strong>
          ? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50 cursor-pointer"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-5 py-2 text-xs font-semibold rounded-full text-white shadow-md transition-all active:scale-95 disabled:opacity-50 bg-rose-600 hover:bg-rose-700 cursor-pointer"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Processing…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

