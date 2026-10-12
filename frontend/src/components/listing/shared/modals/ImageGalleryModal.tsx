"use client";

import React, { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  title?: string;
}

export default function ImageGalleryModal({
  isOpen,
  onClose,
  images = [],
  selectedIndex,
  onSelectIndex,
  title = "Listing Image",
}: ImageGalleryModalProps) {
  const handlePrevImage = useCallback(() => {
    if (images.length === 0) return;
    onSelectIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  }, [selectedIndex, images.length, onSelectIndex]);

  const handleNextImage = useCallback(() => {
    if (images.length === 0) return;
    onSelectIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
  }, [selectedIndex, images.length, onSelectIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    },
    [isOpen, handlePrevImage, handleNextImage, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image gallery`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <h4 className="truncate text-xl font-bold text-gray-900">{title}</h4>
            <p className="mt-1 text-sm text-gray-500">
              Image {selectedIndex + 1} of {images.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close image gallery"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Image */}
        <div className="relative flex h-[45vh] min-h-[240px] max-h-[560px] shrink-0 items-center justify-center bg-gray-50 p-4 sm:h-[60vh] sm:p-6">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
            <img
              src={images[selectedIndex]}
              alt={`${title} image ${selectedIndex + 1}`}
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-[#0066FF] shadow-md transition-colors hover:bg-blue-50 sm:left-5 sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-[#0066FF] shadow-md transition-colors hover:bg-blue-50 sm:right-5 sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex shrink-0 items-center justify-center gap-3 overflow-x-auto border-t border-gray-100 px-4 py-4">
            {images.map((imgSrc, idx) => (
              <button
                key={`${imgSrc}-${idx}`}
                type="button"
                onClick={() => onSelectIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-current={selectedIndex === idx ? "true" : undefined}
                className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${selectedIndex === idx
                    ? "border-[#0066FF] opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                  }`}
              >
                <img src={imgSrc} alt="" draggable={false} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 sm:px-8">
          <span className="text-sm font-medium text-gray-500">
            {selectedIndex + 1} / {images.length} images
          </span>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full bg-[#0066FF] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
