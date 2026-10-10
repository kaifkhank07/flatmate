"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  boxed?: boolean;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  title,
  message,
  icon = <Sparkles className="w-8 h-8 text-[#0066F9]" />,
  actionLabel,
  actionIcon,
  onAction,
  boxed = false,
  compact = false,
  className = "",
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className={`text-center py-4 text-xs text-gray-400 font-normal ${className}`}>
        {message || title || "No items available."}
      </div>
    );
  }

  const containerStyle = boxed
    ? "bg-[#F8FBFE] border border-[#E2EFF8] rounded-3xl p-8 max-w-md mx-auto shadow-xs"
    : "py-10 px-4 max-w-md mx-auto";

  return (
    <div className={`text-center flex flex-col items-center justify-center ${containerStyle} ${className}`}>
      {icon && <div className="mb-3 flex items-center justify-center">{icon}</div>}
      {title && <h4 className="text-base font-medium text-gray-800 mb-1">{title}</h4>}
      {message && <p className="text-xs text-gray-500 max-w-sm mb-4">{message}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0066F9] hover:bg-[#0052C7] text-white text-xs font-medium transition cursor-pointer active:scale-95 shadow-xs"
        >
          {actionIcon}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

