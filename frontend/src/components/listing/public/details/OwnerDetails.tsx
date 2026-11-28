"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageSquare, BriefcaseBusiness } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getMediaUrl } from "@/lib/api";
import { CallModal, ChatModal } from "@/components/listing/shared/modals";

export interface OwnerDetailsProps {
  listing?: any;
  userObj?: any;
  listingData?: any;
  targetId?: string;
  targetType?: "property" | "flatmaterequirement";
  name?: string;
  occupation?: string;
  gender?: string;
  userMobile?: string;
  userImage?: string;
  isOwner?: boolean;
}

export default function OwnerDetails({
  listing,
  userObj: propUserObj,
  listingData,
  targetId: propTargetId,
  targetType: propTargetType,
  name: propName,
  occupation: propOccupation,
  gender: propGender,
  userMobile: propUserMobile,
  userImage: propUserImage,
  isOwner: propIsOwner,
}: OwnerDetailsProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const userObj = propUserObj || listing?.userId || listing?.ownerId;
  const ownerId = typeof userObj === "object" ? userObj?._id : userObj;
  const isOwner =
    propIsOwner !== undefined
      ? propIsOwner
      : Boolean(user?._id && ownerId && String(user._id) === String(ownerId));

  const targetId = propTargetId || listing?._id || "";
  const targetType =
    propTargetType ||
    (listing?.postType ? "flatmaterequirement" : "property");

  const name =
    propName ||
    listingData?.name ||
    userObj?.name ||
    "Property Owner";

  const rawOccupation =
    propOccupation !== undefined
      ? propOccupation
      : listingData?.occupation ||
      userObj?.occupation ||
      userObj?.profile?.occupation;

  // Format occupation: ignore fallback strings, handle snake_case like working_professional -> Working Professional
  const formatOccupation = (occ?: string): string | undefined => {
    if (!occ || typeof occ !== "string") return undefined;
    const trimmed = occ.trim();
    if (!trimmed || trimmed.toLowerCase() === "occupation") return undefined;
    return trimmed
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const occupation = formatOccupation(rawOccupation);

  // Resolved gender for future UI usage (kept unrendered per requirements)
  const gender =
    propGender ||
    listingData?.gender ||
    userObj?.gender ||
    userObj?.profile?.gender ||
    undefined;

  const userMobile =
    propUserMobile ||
    listingData?.userMobile ||
    userObj?.mobile ||
    userObj?.contact ||
    "+91 98765 43210";

  const uAny = userObj as any;
  const rawImage =
    propUserImage !== undefined
      ? propUserImage
      : (typeof uAny?.image === "string" ? uAny.image : uAny?.image?.url) ||
      (typeof uAny?.profileImage === "string" ? uAny.profileImage : uAny?.profileImage?.url) ||
      (typeof uAny?.avatar === "string" ? uAny.avatar : uAny?.avatar?.image?.url) ||
      undefined;

  const userImage = rawImage ? (getMediaUrl(rawImage) || rawImage) : undefined;

  const handleCallClick = () => {
    setShowCallModal(true);
  };

  const handleChatClick = () => {
    setShowChatModal(true);
  };

  return (
    <>
      <div className="flex flex-row lg:flex-col items-center gap-3 sm:gap-5 lg:gap-4 shrink-0 w-full lg:w-64 pb-5 lg:pb-0 border-b border-gray-100 lg:border-b-0">
        {/* Avatar */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-56 lg:h-56 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#3BB799] shadow-inner">
          {userImage ? (
            <img src={userImage} alt={name} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <circle cx="50" cy="50" r="50" fill="#3BB799" />
              <circle cx="50" cy="44" r="19" fill="#F8B195" />
              <path
                d="M18 96C18 76 32 68 50 68C68 68 82 76 82 96V100H18V96Z"
                fill="#EC4899"
              />
            </svg>
          )}
        </div>

        {/* User Information */}
        <div className="flex-1 min-w-0 lg:w-full flex flex-col items-start lg:items-center gap-2 lg:gap-3">
          <h2 className="w-full text-base sm:text-xl lg:text-2xl font-medium text-[#1E3A8A] text-left lg:text-center tracking-tight leading-tight break-words">
            {name}
          </h2>

          {/* Occupation & Contact Actions */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            {occupation && (
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white text-[11px] sm:text-sm font-medium text-gray-700 max-w-full min-w-0 mx-auto">
                <BriefcaseBusiness className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                <span className="truncate">{occupation}</span>
              </div>
            )}

            {!isOwner && (
              <>
                {/* Contact */}
                <button
                  type="button"
                  onClick={handleCallClick}
                  className="w-8 h-8 sm:w-auto sm:h-auto sm:min-w-[112px] sm:py-2 sm:px-4 bg-blue-700 hover:bg-accent text-white font-medium text-xs sm:text-sm lg:text-base rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                  <Phone className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  <span className="hidden sm:inline">Contact</span>
                </button>

                {/* Chat */}
                <button
                  type="button"
                  onClick={handleChatClick}
                  className="w-8 h-8 sm:w-auto sm:h-auto sm:min-w-[112px] sm:py-2 sm:px-4 bg-accent hover:bg-blue-700 text-white font-medium text-xs sm:text-sm lg:text-base rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                  <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        name={name}
        userMobile={userMobile}
      />

      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        name={name}
        userImage={userImage}
        receiverId={ownerId}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
}
