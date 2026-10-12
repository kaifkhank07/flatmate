"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Check } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { deletePropertyApi, deleteFlatmateRequirementApi } from "@/lib/apiServices";
import BaseModal from "./BaseModal";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: "property" | "flatmaterequirement" | "flatmate_requirement";
  targetId?: string;
  onSuccess?: () => void;
  onConfirm?: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemTitle?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  onSuccess,
  onConfirm,
  title = "Delete Listing?",
  description = "Are you sure you want to delete this listing? This action is permanent and cannot be undone.",
  itemTitle,
  loading: externalLoading = false,
}: DeleteConfirmModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const isLoading = isDeleting || externalLoading;

  const handleConfirmDelete = async () => {
    setDeleteError(null);

    if (!isAuthenticated) {
      setDeleteError("Authentication required. Please log in to delete this listing.");
      return;
    }

    if (onConfirm) {
      try {
        setIsDeleting(true);
        await onConfirm();
        setDeleteSuccess(true);
        setTimeout(() => {
          onClose();
          setDeleteSuccess(false);
        }, 1000);
      } catch (err: any) {
        setDeleteError(err.message || "Failed to delete listing.");
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (!targetType || !targetId) {
      setDeleteError("Listing target information is missing.");
      return;
    }

    setIsDeleting(true);
    try {
      if (targetType === "property") {
        await deletePropertyApi(targetId);
      } else {
        await deleteFlatmateRequirementApi(targetId);
      }

      setDeleteSuccess(true);
      setTimeout(() => {
        onClose();
        setDeleteSuccess(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/my-listings");
        }
      }, 1200);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message || "Failed to delete listing.";
      setDeleteError(apiMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {deleteSuccess ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Listing deleted successfully!</p>
        </div>
      ) : (
        <>
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

            {itemTitle && (
              <div className="w-full p-3 mb-4 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium truncate text-center">
                "{itemTitle}"
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
              onClick={onClose}
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
        </>
      )}
    </BaseModal>
  );
}
