"use client";

import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen || images.length === 0) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} full-screen image gallery`}
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex h-screen h-[100dvh] w-screen w-full flex-col overflow-hidden bg-black/95 text-white animate-in fade-in duration-200 select-none"
    >
      {/* Top Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-8 py-3 sm:py-4 z-20"
      >
        <div className="min-w-0 flex items-center gap-3">
          <h4 className="truncate text-sm sm:text-base md:text-lg font-semibold text-white tracking-wide max-w-xs sm:max-w-md md:max-w-xl">
            {title}
          </h4>
          <span className="shrink-0 text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/90">
            {selectedIndex + 1} / {images.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image gallery"
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport — uses maximum available screen width & height */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6 md:p-8"
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <img
            key={images[selectedIndex]}
            src={images[selectedIndex]}
            alt={`${title} image ${selectedIndex + 1}`}
            draggable={false}
            className="max-h-full max-w-full h-auto w-auto object-contain drop-shadow-2xl transition-all duration-300 select-none"
          />
        </div>

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevImage();
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-6 top-1/2 z-20 flex h-10 w-10 sm:h-14 sm:w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-6 top-1/2 z-20 flex h-10 w-10 sm:h-14 sm:w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto border-t border-white/10 bg-black/50 backdrop-blur-md px-4 py-3 sm:py-4 z-20 scrollbar-thin scrollbar-thumb-white/20"
        >
          {images.map((imgSrc, idx) => (
            <button
              key={`${imgSrc}-${idx}`}
              type="button"
              onClick={() => onSelectIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              aria-current={selectedIndex === idx ? "true" : undefined}
              className={`h-14 w-14 sm:h-16 sm:w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${selectedIndex === idx
                  ? "border-[#0066FF] ring-2 ring-white/60 opacity-100 scale-105"
                  : "border-transparent opacity-40 hover:opacity-80"
                }`}
            >
              <img src={imgSrc} alt="" draggable={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
