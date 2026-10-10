"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
}

export default function LoadingState({
  message = "Loading...",
  fullPage = false,
  size = "md",
  className = "",
  iconClassName = "",
}: LoadingStateProps) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm font-medium",
    lg: "text-base font-medium",
  };

  if (fullPage) {
    return (
      <div className={`w-full max-w-4xl mx-auto py-20 px-4 flex flex-col items-center justify-center min-h-[50vh] ${className}`}>
        <Loader2 className={`${iconSizes[size]} text-[#0066F9] animate-spin mb-3 ${iconClassName}`} />
        {message && <p className={`${textSizes[size]} text-gray-500`}>{message}</p>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-6 px-4 ${className}`}>
      <Loader2 className={`${iconSizes[size]} text-[#0066F9] animate-spin mb-2 ${iconClassName}`} />
      {message && <p className={`${textSizes[size]} text-gray-500`}>{message}</p>}
    </div>
  );
}

