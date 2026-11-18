"use client";

import React, { useState } from "react";
import { User as UserIcon, Mail, Phone, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import LineRoll from "../utils/LineRoll";
import { useAuthStore } from "@/store/useAuthStore";
import { UserType } from "@/types/auth";

interface SignUpProps {
  onSwitchToLogin?: () => void;
}

export default function SignUp({ onSwitchToLogin }: SignUpProps) {
  const router = useRouter();
  const { register, verifyRegistrationOTP, checkProfileCompletionStatus, tempOtp, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    userType: UserType;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    userType: "flatmate",
  });
  const [step, setStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [localError, setLocalError] = useState("");

  const activeError = localError || error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localError) setLocalError("");
    if (error) clearError();
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      setLocalError("Please enter your first name");
      return;
    }
    if (!formData.lastName.trim()) {
      setLocalError("Please enter your last name");
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setLocalError("Please enter a valid email address");
      return;
    }
    if (!formData.mobileNumber || formData.mobileNumber.replace(/\D/g, "").length < 10) {
      setLocalError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!formData.userType) {
      setLocalError("Please select your user type");
      return;
    }

    setLocalError("");
    clearError();

    const success = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobile: formData.mobileNumber,
      userType: formData.userType,
    });

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
      const nextInput = document.getElementById(`signup-otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`signup-otp-input-${index - 1}`);
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

    const success = await verifyRegistrationOTP({
      mobile: formData.mobileNumber,
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
      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <h1 className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl font-regular tracking-tight mb-2">
              Create An Account
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Register with your email & mobile number to get started with Flat & Flatmate
            </p>
          </div>

          {/* First & Last Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 px-4 py-3 border border-gray-400 rounded-full focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
              <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                disabled={isLoading}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 outline-none text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center gap-2.5 px-4 py-3 border border-gray-400 rounded-full focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
              <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                disabled={isLoading}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 outline-none text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="flex items-center gap-3 px-4 py-3 border border-gray-400 rounded-full focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
            <Mail className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled={isLoading}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 outline-none text-sm sm:text-base"
            />
          </div>

          {/* Mobile Number Input */}
          <div className="flex items-center gap-3 px-4 py-3 border border-gray-400 rounded-full focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
            <Phone className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="tel"
              name="mobileNumber"
              maxLength={10}
              value={formData.mobileNumber}
              disabled={isLoading}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setFormData((prev) => ({ ...prev, mobileNumber: val }));
                if (localError) setLocalError("");
                if (error) clearError();
              }}
              placeholder="9999 999 999"
              className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 outline-none text-sm sm:text-base tracking-wider"
            />
          </div>

          {/* User Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700 ml-1">
              I am registering as <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Owner", value: "owner" as UserType },
                { label: "Flatmate", value: "flatmate" as UserType },
                { label: "Agent", value: "agent" as UserType },
                { label: "Builder", value: "builder" as UserType },
              ].map((item) => {
                const isSelected = formData.userType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, userType: item.value }));
                      if (localError) setLocalError("");
                      if (error) clearError();
                    }}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-full border transition-all text-center cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeError && <p className="text-xs text-red-500 pl-4">{activeError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/80 text-white font-medium py-3.5 rounded-full transition-colors text-base shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          {onSwitchToLogin && (
            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  onSwitchToLogin();
                }}
                className="text-gray-900 font-semibold cursor-pointer bg-transparent border-none p-0 inline"
              >
                <LineRoll text="Log In" lineClassName="bg-gray-900" />
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
                setStep("details");
              }}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Edit Registration Details
            </button>
            <h1 className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl font-regular tracking-tight mb-3">
              Verification Code
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Enter the 6-digit verification code sent to +91 {formData.mobileNumber}
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
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`signup-otp-input-${index}`}
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
            {isLoading ? "Verifying..." : "Verify & Register"}
          </button>
        </form>
      )}
    </div>
  );
}
