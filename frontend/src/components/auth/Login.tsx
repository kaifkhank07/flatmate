"use client";

import React, { useState, useEffect } from "react";
import { Phone, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import LineRoll from "../utils/LineRoll";
import { useAuthStore } from "@/store/useAuthStore";
import { useOtpInput } from "@/hooks/useOtpInput";
import { useWebOTP } from "@/hooks/useWebOTP";

interface LoginProps {
  onSwitchToSignUp?: () => void;
  redirectUrl?: string;
  redirectTo?: string;
}

export default function Login({
  onSwitchToSignUp,
  redirectUrl,
  redirectTo,
}: LoginProps) {
  const router = useRouter();
  const { sendLoginOTP, verifyLoginOTP, checkProfileCompletionStatus, isLoading, error, clearError } = useAuthStore();

  const [mobileNumber, setMobileNumber] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [localError, setLocalError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const activeError = localError || error;

  // 6-digit OTP input controller with native iOS & Android autofill support
  const {
    otp,
    fullOtp,
    applyFullOtp,
    resetOtp,
    getInputProps,
  } = useOtpInput({
    idPrefix: "otp-input",
    onChange: () => {
      if (localError) setLocalError("");
      if (error) clearError();
    },
  });

  // Android WebOTP API listener (automatically canceled on step change or unmount)
  useWebOTP({
    enabled: step === "otp",
    triggerKey: resendCount,
    onReceiveOTP: (receivedCode) => {
      applyFullOtp(receivedCode);
    },
  });

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.replace(/\D/g, "").length < 10) {
      setLocalError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLocalError("");
    clearError();

    const success = await sendLoginOTP(mobileNumber);
    if (success) {
      resetOtp();
      setResendCooldown(30);
      setResendCount((c) => c + 1);
      setStep("otp");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setLocalError("");
    clearError();

    const success = await sendLoginOTP(mobileNumber);
    if (success) {
      setResendCooldown(30);
      setResendCount((c) => c + 1);
      resetOtp();
    }
  };

  const getDestinationUrl = (): string => {
    const propTarget = redirectUrl || redirectTo;
    if (propTarget && propTarget.startsWith("/") && !propTarget.startsWith("//")) {
      return propTarget;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTarget = params.get("redirect") || params.get("redirectTo");
      if (queryTarget && queryTarget.startsWith("/") && !queryTarget.startsWith("//")) {
        return queryTarget;
      }
    }
    return "/";
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullOtp.length < 6) {
      setLocalError("Please enter complete 6-digit verification code");
      return;
    }
    setLocalError("");
    clearError();

    const success = await verifyLoginOTP({
      mobile: mobileNumber,
      otp: fullOtp,
    });

    if (success) {
      const destination = getDestinationUrl();
      const isCompleted = await checkProfileCompletionStatus();
      if (!isCompleted) {
        router.push(destination !== "/" ? `/profile?redirect=${encodeURIComponent(destination)}` : "/profile");
      } else {
        router.push(destination);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 my-auto py-4 sm:py-6">
      {step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <h1 className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl font-regular tracking-tight mb-3">
              Enter Mobile Number
            </h1>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg leading-relaxed">
              We Will Send On Sms With A 6-Digit Verification Code On This Number
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 px-5 py-3.5 border border-gray-400 rounded-full focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
              <Phone className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                disabled={isLoading}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMobileNumber(val);
                  if (localError) setLocalError("");
                  if (error) clearError();
                }}
                placeholder="9999 999 999"
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 outline-none text-base sm:text-lg tracking-wider"
              />
            </div>
            {activeError && <p className="text-xs text-red-500 pl-4">{activeError}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/80 text-white font-medium py-3.5 rounded-full transition-colors text-base shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending OTP..." : "Get OTP"}
          </button>

          {onSwitchToSignUp && (
            <p className="text-center text-sm text-gray-500 pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  onSwitchToSignUp();
                }}
                className="text-gray-900 font-semibold cursor-pointer bg-transparent border-none p-0 inline"
              >
                <LineRoll text="Create Account" lineClassName="bg-gray-900" />
              </button>
            </p>
          )}
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div>
            <button
              type="button"
              onClick={() => {
                clearError();
                setLocalError("");
                setStep("phone");
              }}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Change Number ({mobileNumber})
            </button>
            <h1 className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl font-regular tracking-tight mb-3">
              Verification Code
            </h1>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg leading-relaxed">
              Enter the 6-digit code sent to +91 {mobileNumber}
            </p>

            {/* Commented: Real OTP is now dispatched via MSG91, so hiding OTP render / auto-fill banner */}
            {/* {tempOtp && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                    Verification OTP
                  </p>
                  <p className="text-xl font-bold text-blue-900 tracking-widest mt-0.5">
                    {tempOtp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = tempOtp.split("");
                    setOtp(digits);
                    if (localError) setLocalError("");
                    if (error) clearError();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors cursor-pointer shrink-0"
                >
                  Auto-fill OTP
                </button>
              </div>
            )} */}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-1.5 sm:gap-2 py-2">
              {otp.map((_, index) => (
                <input
                  {...getInputProps(index, {
                    disabled: isLoading,
                    className:
                      "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border border-gray-300 rounded-xl sm:rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-900",
                  })}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-1">
              <span>Didn't receive code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendOtp}
                className="text-blue-600 hover:underline font-medium disabled:text-gray-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            {activeError && <p className="text-xs text-red-500 text-center">{activeError}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading || fullOtp.length < 6}
            className="w-full bg-accent hover:bg-accent/80 text-white font-medium py-3.5 rounded-full transition-colors text-base shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify & Proceed"}
          </button>
        </form>
      )}
    </div>
  );
}
