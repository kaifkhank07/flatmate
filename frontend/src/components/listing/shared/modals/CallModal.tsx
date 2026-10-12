"use client";

import React from "react";
import { Phone } from "lucide-react";
import BaseModal from "./BaseModal";

export interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  userMobile: string;
}

export default function CallModal({ isOpen, onClose, name, userMobile }: CallModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" className="text-center">
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
          className="block w-full py-3 bg-[#0066FF] hover:bg-blue-700 text-white font-semibold rounded-full text-sm shadow-md transition-colors text-center"
        >
          Call {userMobile}
        </a>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </BaseModal>
  );
}
