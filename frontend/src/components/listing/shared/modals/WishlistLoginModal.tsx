"use client";

import React from "react";
import { Heart } from "lucide-react";
import BaseModal from "./BaseModal";
import LoginRequiredView from "./LoginRequiredView";

export interface WishlistLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function WishlistLoginModal({
  isOpen,
  onClose,
  title = "Save to Wishlist",
  description = "Please log in to your account to save this listing to your wishlist and access it anytime.",
}: WishlistLoginModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" className="text-center">
      <LoginRequiredView
        title={title}
        description={description}
        icon={<Heart className="w-8 h-8 text-rose-500 fill-rose-100 stroke-[2.2]" />}
        iconBgClassName="bg-rose-50 text-rose-500"
        actionText="Log In to Save"
        onClose={onClose}
      />
    </BaseModal>
  );
}
