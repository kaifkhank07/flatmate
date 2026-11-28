"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getMediaUrl } from "@/lib/api";
import { CallModal, ChatModal } from "@/components/listing/shared/modals";

export interface ContactActionProps {
    listing?: any;
    userObj?: any;
    listingData?: any;
    targetId?: string;
    targetType?: "property" | "flatmaterequirement";
    name?: string;
    userMobile?: string;
    userImage?: string;
    isOwner?: boolean;
    contactLabel?: string;
    chatLabel?: string;
    className?: string;
}

export default function ContactAction({
    listing,
    userObj: propUserObj,
    listingData,
    targetId: propTargetId,
    targetType: propTargetType,
    name: propName,
    userMobile: propUserMobile,
    userImage: propUserImage,
    isOwner: propIsOwner,
    contactLabel = "Call",
    chatLabel = "Chat",
    className = "",
}: ContactActionProps) {
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

    if (isOwner) {
        return null;
    }

    return (
        <>
            <div className={`flex items-center gap-3 sm:gap-4 w-full ${className}`}>
                {/* Contact Owner */}
                <button
                    type="button"
                    onClick={handleCallClick}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm sm:text-base rounded-full shadow-sm transition-all cursor-pointer"
                >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-white text-white" />
                    <span>{contactLabel}</span>
                </button>

                {/* Get Details */}
                <button
                    type="button"
                    onClick={handleChatClick}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-blue-50/60 active:scale-[0.98] border-2 border-[#0066FF] text-[#0066FF] font-medium text-sm sm:text-base rounded-full shadow-sm transition-all cursor-pointer"
                >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#0066FF]" />
                    <span>{chatLabel}</span>
                </button>
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
