"use client";

import React, { useState } from "react";
import { Maximize2, Images } from "lucide-react";
import ImageGalleryModal from "./modals/ImageGalleryModal";

interface ListingMediaGalleryProps {
  images: string[];
  title?: string;
  className?: string;
}

export default function ListingMediaGallery({
  images = [],
  title = "Listing Photos",
  className = "",
}: ListingMediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handleOpenGallery = (index: number = 0) => {
    setSelectedImageIndex(index);
  };

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      setMobileActiveIndex(newIndex);
    }
  };

  return (
    <>
      <div className={`w-full min-w-0 relative group ${className}`}>
        {/* DESKTOP / TABLET: Responsive Grid Layout (sm and up) */}
        <div className="hidden sm:block w-full min-w-0">
          {/* 1 Image: Full width single image */}
          {images.length === 1 && (
            <div
              onClick={() => handleOpenGallery(0)}
              className="relative h-[340px] md:h-[440px] lg:h-[500px] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 cursor-pointer transition-all hover:shadow-md group/single"
            >
              <img
                src={images[0]}
                alt={`${title} 1`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/single:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/single:bg-black/10 transition-colors" />
            </div>
          )}

          {/* 2 Images: Balanced two-column grid */}
          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-2.5 h-[340px] md:h-[440px] lg:h-[500px] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 relative">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenGallery(idx)}
                  className="relative h-full w-full overflow-hidden cursor-pointer group/item"
                >
                  <img
                    src={img}
                    alt={`${title} ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/15 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* 3 Images: 1 large on left (spans 2 rows) + 2 stacked on right */}
          {images.length === 3 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-2.5 h-[340px] md:h-[440px] lg:h-[500px] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 relative">
              {/* Featured main image (Left, spans 2 rows) */}
              <div
                onClick={() => handleOpenGallery(0)}
                className="col-span-1 row-span-2 relative h-full w-full overflow-hidden cursor-pointer group/hero"
              >
                <img
                  src={images[0]}
                  alt={`${title} 1`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/hero:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/hero:bg-black/15 transition-colors" />
              </div>

              {/* Secondary top image (Right top) */}
              <div
                onClick={() => handleOpenGallery(1)}
                className="col-span-1 row-span-1 relative h-full w-full overflow-hidden cursor-pointer group/thumb"
              >
                <img
                  src={images[1]}
                  alt={`${title} 2`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/15 transition-colors" />
              </div>

              {/* Secondary bottom image (Right bottom) */}
              <div
                onClick={() => handleOpenGallery(2)}
                className="col-span-1 row-span-1 relative h-full w-full overflow-hidden cursor-pointer group/thumb"
              >
                <img
                  src={images[2]}
                  alt={`${title} 3`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/15 transition-colors" />
              </div>
            </div>
          )}

          {/* 4 Images: Balanced 2x2 grid */}
          {images.length === 4 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-2.5 h-[340px] md:h-[440px] lg:h-[500px] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 relative">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenGallery(idx)}
                  className="col-span-1 row-span-1 relative h-full w-full overflow-hidden cursor-pointer group/item"
                >
                  <img
                    src={img}
                    alt={`${title} ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/15 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* 5 or More Images: 1 Main (2x2) + 4 Thumbnails on right */}
          {images.length >= 5 && (
            <div className="grid grid-cols-4 grid-rows-2 gap-2.5 h-[340px] md:h-[440px] lg:h-[500px] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 relative">
              {/* Primary Main Image (2 cols, 2 rows) */}
              <div
                onClick={() => handleOpenGallery(0)}
                className="col-span-2 row-span-2 relative h-full w-full overflow-hidden cursor-pointer group/hero"
              >
                <img
                  src={images[0]}
                  alt={`${title} main`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/hero:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/hero:bg-black/15 transition-colors" />
              </div>

              {/* Secondary Images (up to 4 thumbnails on the right) */}
              {images.slice(1, 5).map((img, idx) => {
                const actualIndex = idx + 1;
                const isFourth = actualIndex === 4;
                const hasMore = images.length > 5 && isFourth;

                return (
                  <div
                    key={actualIndex}
                    onClick={() => handleOpenGallery(actualIndex)}
                    className="col-span-1 row-span-1 relative h-full w-full overflow-hidden cursor-pointer group/thumb"
                  >
                    <img
                      src={img}
                      alt={`${title} ${actualIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors" />

                    {hasMore && (
                      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-center p-2">
                        <span className="text-xl md:text-2xl font-bold tracking-tight">
                          +{images.length - 5}
                        </span>
                        <span className="text-xs font-medium text-white/90">more photos</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* View All Photos Button - Only show when images.length > 5 */}
              {images.length > 5 && (
                <button
                  type="button"
                  onClick={() => handleOpenGallery(0)}
                  className="absolute bottom-5 right-5 bg-white/95 hover:bg-white text-gray-900 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-lg border border-gray-200 backdrop-blur-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 z-10"
                >
                  <Images className="w-4 h-4 text-gray-700" />
                  <span>Show all {images.length} photos</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* MOBILE: Swipeable slider with snap and counter (below sm) */}
        <div className="block sm:hidden">
          <div className="relative h-[280px] w-full rounded-[24px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
            <div
              onScroll={handleMobileScroll}
              className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenGallery(idx)}
                  className="w-full h-full shrink-0 snap-center relative cursor-pointer"
                >
                  <img
                    src={img}
                    alt={`${title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Floating Photo Counter Badge */}
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
              <Images className="w-3.5 h-3.5" />
              <span>
                {mobileActiveIndex + 1} / {images.length}
              </span>
            </div>

            {/* Tap hint icon */}
            <button
              type="button"
              onClick={() => handleOpenGallery(mobileActiveIndex)}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              aria-label="View full screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen gallery modal */}
      <ImageGalleryModal
        isOpen={selectedImageIndex !== null && selectedImageIndex !== undefined}
        onClose={() => setSelectedImageIndex(null)}
        images={images}
        selectedIndex={selectedImageIndex ?? 0}
        onSelectIndex={(idx) => setSelectedImageIndex(idx)}
        title={title}
      />
    </>
  );
}
