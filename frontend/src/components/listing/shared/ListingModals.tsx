"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Phone, MessageSquare, AlertCircle, X, Check, Send, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { createReportApi, ReportReason, ReportTargetType } from "@/lib/apiServices";

interface ListingModalsProps {
  name: string;
  userMobile: string;
  userImage?: string;
  showCallModal: boolean;
  setShowCallModal: (val: boolean) => void;
  showChatModal: boolean;
  setShowChatModal: (val: boolean) => void;
  showReportModal: boolean;
  setShowReportModal: (val: boolean) => void;
  targetType?: ReportTargetType;
  targetId?: string;
  images?: string[];
  selectedImageIndex?: number | null;
  setSelectedImageIndex?: (val: number | null) => void;
  title?: string;
}

export default function ListingModals({
  name,
  userMobile,
  userImage,
  showCallModal,
  setShowCallModal,
  showChatModal,
  setShowChatModal,
  showReportModal,
  setShowReportModal,
  targetType,
  targetId,
  images = [],
  selectedImageIndex = null,
  setSelectedImageIndex,
  title = "Listing Image",
}: ListingModalsProps) {
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);

    if (!isAuthenticated) {
      setReportError("Authentication required. Please log in to report listings.");
      return;
    }

    if (!targetType || !targetId) {
      setReportError("Listing target information is missing.");
      return;
    }

    if (!reason) {
      setReportError("Please select a report reason.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await createReportApi({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });

      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReason("spam");
        setDescription("");
        setReportError(null);
      }, 2000);
    } catch (err: any) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message || err.message;
      if (status === 409 || (apiMessage && apiMessage.toLowerCase().includes("pending"))) {
        setReportError("You have already submitted a pending report for this listing.");
      } else if (status === 401) {
        setReportError("Authentication required. Please log in to report listings.");
      } else if (status === 404) {
        setReportError("Listing could not be found.");
      } else if (status === 400) {
        setReportError(apiMessage || "Invalid report data provided.");
      } else {
        setReportError(apiMessage || "Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handlePrevImage = useCallback(() => {
    if (!setSelectedImageIndex || selectedImageIndex === null || selectedImageIndex === undefined) return;
    setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const handleNextImage = useCallback(() => {
    if (!setSelectedImageIndex || selectedImageIndex === null || selectedImageIndex === undefined) return;
    setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1);
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedImageIndex === null || selectedImageIndex === undefined) return;
      if (e.key === "Escape") {
        if (setSelectedImageIndex) setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    },
    [selectedImageIndex, handlePrevImage, handleNextImage, setSelectedImageIndex]
  );

  useEffect(() => {
    if (selectedImageIndex !== null && selectedImageIndex !== undefined) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImageIndex, handleKeyDown]);

  const showImageModal = selectedImageIndex !== null && selectedImageIndex !== undefined && images.length > 0;

  return (
    <>
      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0066FF]">
              <Phone className="w-8 h-8 fill-current" />
            </div>

            <h4 className="text-xl font-bold text-gray-900">Contact {name}</h4>
            <p className="text-sm text-gray-500 mt-2">
              Click below to initiate a phone call or view phone number.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href={`tel:${userMobile.replace(/\s+/g, "")}`}
                className="block w-full py-3 bg-[#0066FF] hover:bg-blue-700 text-white font-semibold rounded-full text-sm shadow-md transition-colors"
              >
                Call {userMobile}
              </a>
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="w-full py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowChatModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b pb-4">
              <div className="w-12 h-12 rounded-full bg-[#3BB799] flex items-center justify-center overflow-hidden shrink-0">
                {userImage ? (
                  <img src={userImage} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="50" fill="#3BB799" />
                    <circle cx="50" cy="44" r="20" fill="#F8B195" />
                    <path d="M20 95C20 76 34 68 50 68C66 68 80 76 80 95V100H20V95Z" fill="#EC4899" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{name}</h4>
                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Active Now
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="bg-gray-100 p-3 rounded-2xl text-xs text-gray-700 max-w-[80%]">
                Hi! Interested in the listing? Feel free to send me a message.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-[#0066FF]"
              />
              <button
                type="button"
                onClick={() => {
                  if (chatMessage.trim()) {
                    setChatMessage("");
                    alert("Message sent!");
                    setShowChatModal(false);
                  }
                }}
                className="p-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Listing Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowReportModal(false);
                setReportError(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {reportSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Report Submitted</h4>
                <p className="text-xs sm:text-sm text-gray-500">
                  Thank you for helping us keep the community safe. Our team will review this report shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-lg">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <h4>Report Listing</h4>
                </div>

                <p className="text-xs sm:text-sm text-gray-500">
                  Please specify why you are reporting this listing.
                </p>

                {reportError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {reportError}
                  </div>
                )}

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0066FF] bg-white cursor-pointer"
                  >
                    <option value="spam">Spam</option>
                    <option value="fraud">Fraud</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="misleading">Misleading Information</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Optional Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Description (Optional)</span>
                    <span className="text-gray-400 font-normal">{description.length}/1000</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the issue (e.g., incorrect rent amount, fake photos, unreachable contact)..."
                    className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#0066FF] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportError(null);
                    }}
                    className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white font-semibold rounded-full text-xs shadow-md transition-colors cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Image View Lightbox Modal */}
      {showImageModal &&
        setSelectedImageIndex &&
        selectedImageIndex !== null &&
        selectedImageIndex !== undefined && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} image gallery`}
            onClick={() => setSelectedImageIndex(null)}
            className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:px-8">
                <div className="min-w-0">
                  <h4 className="truncate text-xl font-bold text-gray-900">
                    {title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Image {selectedImageIndex + 1} of {images.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedImageIndex(null)}
                  aria-label="Close image gallery"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Main Image — Fixed Dimensions */}
              <div className="relative flex h-[45vh] min-h-[240px] max-h-[560px] shrink-0 items-center justify-center bg-gray-50 p-4 sm:h-[60vh] sm:p-6">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
                  <img
                    src={images[selectedImageIndex]}
                    alt={`${title} image ${selectedImageIndex + 1}`}
                    draggable={false}
                    className="h-full w-full select-none object-contain"
                  />
                </div>

                {/* Previous Image */}
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

                {/* Next Image */}
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

              {/* Equal-Sized Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex shrink-0 items-center justify-center gap-3 overflow-x-auto border-t border-gray-100 px-4 py-4">
                  {images.map((imgSrc, idx) => (
                    <button
                      key={`${imgSrc}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                      aria-current={selectedImageIndex === idx ? "true" : undefined}
                      className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${selectedImageIndex === idx
                          ? "border-[#0066FF] opacity-100"
                          : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                    >
                      <img
                        src={imgSrc}
                        alt=""
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 sm:px-8">
                <span className="text-sm font-medium text-gray-500">
                  {selectedImageIndex + 1} / {images.length} images
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedImageIndex(null)}
                  className="cursor-pointer rounded-full bg-[#0066FF] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

    </>
  );
}
