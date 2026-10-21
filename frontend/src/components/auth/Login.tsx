"use client";

import React, { useState } from "react";
import { Phone, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import LineRoll from "../utils/LineRoll";
import { useAuthStore } from "@/store/useAuthStore";

interface LoginProps {
  onSwitchToSignUp?: () => void;
}

export default function Login({ onSwitchToSignUp }: LoginProps) {
  const router = useRouter();
  const { sendLoginOTP, verifyLoginOTP, checkProfileCompletionStatus, tempOtp, isLoading, error, clearError } = useAuthStore();

  const [mobileNumber, setMobileNumber] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [localError, setLocalError] = useState("");

  const activeError = localError || error;

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
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
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
      const isCompleted = await checkProfileCompletionStatus();
      if (!isCompleted) {
        router.push("/profile");
      } else {
        router.push("/");
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

            {tempOtp && (
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
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-1.5 sm:gap-2 py-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => {
                    handleOtpChange(index, e.target.value);
                    if (localError) setLocalError("");
                    if (error) clearError();
                  }}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border border-gray-300 rounded-xl sm:rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-900"
                />
              ))}
            </div>
            {activeError && <p className="text-xs text-red-500 text-center">{activeError}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/80 text-white font-medium py-3.5 rounded-full transition-colors text-base shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify & Proceed"}
          </button>
        </form>
      )}
    </div>
  );
}
