"use client";

import React, { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import BaseModal from "@/components/listing/shared/modals/BaseModal";

export interface DeleteNotificationDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  notificationTitle?: string;
  itemTitle?: string;
  title?: string;
  description?: string;
  isDeleting?: boolean;
  loading?: boolean;
}

export default function DeleteNotificationDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  notificationTitle,
  itemTitle,
  title = "Delete Notification?",
  description = "Are you sure you want to delete this notification? This action is permanent and cannot be undone.",
  isDeleting: externalIsDeleting = false,
  loading: externalLoading = false,
}: DeleteNotificationDialogProps) {
  const [internalDeleting, setInternalDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const displayTitle = notificationTitle || itemTitle;
  const isLoading = internalDeleting || externalIsDeleting || externalLoading;

  const handleClose = () => {
    if (isLoading) return;
    setDeleteError(null);
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    try {
      setInternalDeleting(true);
      await onConfirm();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete notification.");
    } finally {
      setInternalDeleting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-inner">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
          {title}
        </h3>

        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
          {description}
        </p>

        {displayTitle && (
          <div className="w-full p-3 mb-4 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium truncate text-center">
            &ldquo;{displayTitle}&rdquo;
          </div>
        )}
      </div>

      {deleteError && (
        <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
          {deleteError}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm sm:text-base rounded-full transition-all disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleConfirmDelete}
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium text-sm sm:text-base rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <span>Delete</span>
          )}
        </button>
      </div>
    </BaseModal>
  );
}

