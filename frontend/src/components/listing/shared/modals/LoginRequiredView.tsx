"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogIn, Lock } from "lucide-react";

export interface LoginRequiredViewProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  iconBgClassName?: string;
  actionText?: string;
  onClose?: () => void;
  className?: string;
}

export default function LoginRequiredView({
  title = "Login Required",
  description = "Please log in to your account to continue.",
  icon,
  iconBgClassName = "bg-blue-50 text-[#0066FF]",
  actionText = "Log In to Continue",
  onClose,
  className = "",
}: LoginRequiredViewProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "";
    if (onClose) onClose();
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <div className={`py-4 text-center ${className}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs ${iconBgClassName}`}>
        {icon || <Lock className="w-8 h-8 stroke-[2.2]" />}
      </div>

      <h4 className="text-xl font-bold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={handleLoginClick}
          className="w-full py-3 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-full text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4 shrink-0" />
          <span>{actionText}</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
