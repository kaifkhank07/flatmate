"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import apiClient from "@/lib/api";
import {
  ChevronRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  User as UserIcon,
  Briefcase,
  FileText,
  Plus,
  X,
} from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import LoadingState from "@/components/utils/LoadingState";
import EmptyState from "@/components/utils/EmptyState";
import { ViewReveal } from "@/components/animation";
import { useOtpInput } from "@/hooks/useOtpInput";
import { useWebOTP } from "@/hooks/useWebOTP";

type GenderType = "male" | "female" | "other" | "any" | "";
type OccupationType =
  | "student"
  | "working_professional"
  | "self_employed"
  | "business_owner"
  | "freelancer"
  | "other"
  | "";

const COMMON_LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Other",
];

const OCCUPATION_OPTIONS: { label: string; value: OccupationType }[] = [
  { label: "Student", value: "student" },
  { label: "Working Professional", value: "working_professional" },
  { label: "Self Employed", value: "self_employed" },
  { label: "Business Owner", value: "business_owner" },
  { label: "Freelancer", value: "freelancer" },
  { label: "Other", value: "other" },
];

export default function ManageProfile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    user,
    profile,
    masterPreferences,
    avatars,
    isAvatarsLoading,
    isAuthenticated,
    isInitialized,
    isProfileLoading,
    fetchProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    fetchAvatars,
    selectAvatar,
    requestAccountDeletionOTP,
    deleteAccountWithOTP,
    logout,
  } = useAuthStore();

  // Local Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<GenderType>("");
  const [occupation, setOccupation] = useState<OccupationType>("");
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [customLanguage, setCustomLanguage] = useState("");
  const [aboutMe, setAboutMe] = useState("");

  // Status & Modal States
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "otp">("confirm");
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [deleteDestination, setDeleteDestination] = useState("");
  const [deleteOtpError, setDeleteOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deleteResendCount, setDeleteResendCount] = useState(0);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // 6-digit OTP controller for Account Deletion
  const {
    otp: deleteOtp,
    fullOtp: deleteFullOtp,
    applyFullOtp: applyDeleteFullOtp,
    resetOtp: resetDeleteOtp,
    getInputProps: getDeleteInputProps,
  } = useOtpInput({
    idPrefix: "delete-otp-input",
    onChange: () => {
      if (deleteOtpError) setDeleteOtpError("");
    },
  });

  // Android WebOTP listener for Account Deletion
  useWebOTP({
    enabled: showDeleteModal && deleteStep === "otp",
    triggerKey: deleteResendCount,
    onReceiveOTP: (code) => {
      applyDeleteFullOtp(code);
    },
  });
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Deletion OTP Resend Cooldown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (showAvatarModal && avatars.length === 0) {
      fetchAvatars();
    }
  }, [showAvatarModal, avatars, fetchAvatars]);

  // Sync auth state
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!profile) {
        fetchProfile();
      }
    }
  }, [isInitialized, isAuthenticated, profile, fetchProfile, router]);

  // Populate local form from store profile
  useEffect(() => {
    if (profile || user) {
      setFirstName(profile?.firstName || "");
      setLastName(profile?.lastName || "");
      setContactNumber(user?.mobile || "");
      setGender((profile?.gender as GenderType) || "");
      setOccupation((profile?.occupation as OccupationType) || "");
      setAboutMe(profile?.aboutMe || "");
      setLanguagesKnown(profile?.languagesKnown || []);

      if (profile?.dateOfBirth) {
        try {
          const dobDate = new Date(profile.dateOfBirth);
          if (!isNaN(dobDate.getTime())) {
            setDateOfBirth(dobDate.toISOString().split("T")[0]);
          }
        } catch {
          setDateOfBirth("");
        }
      }
    }
  }, [profile, user]);

  const handleLanguageToggle = (lang: string) => {
    setLanguagesKnown((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
    if (statusMessage) setStatusMessage(null);
  };

  const handleAddCustomLanguage = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customLanguage.trim();
    if (trimmed && !languagesKnown.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setLanguagesKnown((prev) => [...prev, trimmed]);
      setCustomLanguage("");
      if (statusMessage) setStatusMessage(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Image size must be less than 5MB.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    setStatusMessage(null);
    try {
      const success = await uploadProfileImage(file);
      if (success) {
        setStatusMessage({
          type: "success",
          text: "Profile photo updated successfully!",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: useAuthStore.getState().profileError || "Failed to upload photo.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to upload photo.",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    setIsUploadingPhoto(true);
    setStatusMessage(null);
    try {
      const success = await deleteProfileImage();
      if (success) {
        setStatusMessage({
          type: "success",
          text: "Profile photo / avatar removed.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to delete photo / avatar.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    setIsUploadingPhoto(true);
    setStatusMessage(null);
    try {
      const success = await selectAvatar(avatarId);
      if (success) {
        setStatusMessage({
          type: "success",
          text: "Avatar selected successfully!",
        });
        setShowAvatarModal(false);
      } else {
        setStatusMessage({
          type: "error",
          text: useAuthStore.getState().profileError || "Failed to select avatar.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to select avatar.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload: Record<string, any> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender || undefined,
        occupation: occupation || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        languagesKnown: languagesKnown,
        aboutMe: aboutMe.trim(),
      };

      const success = await updateProfile(payload);

      if (success) {
        setStatusMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
      } else {
        const storeError = useAuthStore.getState().profileError;
        setStatusMessage({
          type: "error",
          text: storeError || "Failed to update profile.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    }
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteStep("confirm");
    resetDeleteOtp();
    setDeleteOtpError("");
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting || isSendingDeleteOtp) return;
    setShowDeleteModal(false);
    setDeleteStep("confirm");
    resetDeleteOtp();
    setDeleteOtpError("");
  };

  const handleRequestDeleteOtp = async () => {
    setIsSendingDeleteOtp(true);
    setDeleteOtpError("");
    const result = await requestAccountDeletionOTP();
    setIsSendingDeleteOtp(false);
    if (result.success) {
      setDeleteDestination(result.destination || "");
      setDeleteStep("otp");
      setResendCooldown(60);
      setDeleteResendCount((c) => c + 1);
      resetDeleteOtp();
    } else {
      setDeleteOtpError(result.message);
    }
  };

  const handleConfirmDeleteWithOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (deleteFullOtp.length < 6) {
      setDeleteOtpError("Please enter all 6 digits of your verification code.");
      return;
    }
    setIsDeleting(true);
    setDeleteOtpError("");
    const result = await deleteAccountWithOTP(deleteFullOtp);
    if (result.success) {
      setShowDeleteModal(false);
      router.push("/login");
    } else {
      setDeleteOtpError(result.message);
      setIsDeleting(false);
    }
  };

  const completionPercentage = profile?.profileCompletion ?? 0;

  if (!isInitialized || (isProfileLoading && !profile)) {
    return <LoadingState message="Loading your profile details..." fullPage />;
  }

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Page Title & Profile Completion */}
        <ViewReveal duration={800}>
          <SectionHeading title="Your Profile" />
        </ViewReveal>

        {/* Notification Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm transition-all duration-300 animate-in fade-in-50 ${statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
              }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Profile Avatar / Photo & Completion Card */}
        <ViewReveal duration={900} startDelay={150}>
          <div className="bg-[#F8FBFE] border border-[#E2EFF8] rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Avatar & User Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left w-full sm:w-auto flex-1 min-w-0">
              {/* Avatar Container */}
              <div className="relative shrink-0 group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-[#0066F9]/30 bg-white shadow-sm flex items-center justify-center relative">
                  {profile?.image?.url || (profile?.avatar && typeof profile.avatar === "object" && profile.avatar.image?.url) ? (
                    <Image
                      src={profile?.image?.url || (profile?.avatar && typeof profile.avatar === "object" ? profile.avatar.image?.url! : "")}
                      alt="Profile Visual"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#0066F9]/50" />
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  aria-label="Upload photo"
                  className="absolute bottom-0 right-0 p-1.5 sm:p-2 rounded-full bg-[#0066F9] hover:bg-[#0052C7] text-white shadow-md transition-transform active:scale-90 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* User Info & Photo / Avatar Action Links */}
              <div className="space-y-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {firstName ? `${firstName} ${lastName}`.trim() : "Your Name"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md">
                  Upload a custom photo or choose a preset avatar to personalize your profile visual.
                </p>
                {/* <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5 sm:pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="text-xs sm:text-sm font-medium text-[#0066F9] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  disabled={isUploadingPhoto}
                  className="text-xs sm:text-sm font-medium text-[#0066F9] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Choose Avatar</span>
                </button>
                {(profile?.image?.url || profile?.avatar) && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={handlePhotoDelete}
                      disabled={isUploadingPhoto}
                      className="text-xs sm:text-sm font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div> */}
              </div>
            </div>

            {/* Right: Profile Completion Badge */}
            <div className="bg-white sm:bg-[#F3F9FD] border border-[#E2EFF8] rounded-2xl p-4 sm:px-6 sm:py-4 flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto shrink-0 shadow-xs">
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Profile Completion
                </span>
                <span className="text-base sm:text-lg font-bold text-[#0066F9]">
                  {completionPercentage}% Complete
                </span>
              </div>
              {/* <div className="w-24 sm:w-32 bg-gray-100 sm:bg-gray-200 h-2.5 rounded-full overflow-hidden shrink-0">
              <div
                className="bg-[#0066F9] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, completionPercentage)}%` }}
              />
            </div> */}
            </div>
          </div>
        </ViewReveal>


        {/* Profile Details Form */}
        <ViewReveal duration={900} startDelay={150}>
          <form onSubmit={handleSaveChanges} className="space-y-10">
            {/* SECTION 1: Personal Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserIcon className="w-5 h-5 text-[#0066F9]" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Personal Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* First Name Field */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    placeholder="e.g. Neha"
                    required
                    className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] placeholder:text-gray-400 transition-all"
                  />
                  <p className="text-sm text-gray-500 mt-2 font-normal">
                    Note: Users With Real Names Get{" "}
                    <span className="text-[#0066F9] font-medium">90% More Engagement.</span>
                  </p>
                </div>

                {/* Last Name Field */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    placeholder="e.g. Shah"
                    className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] placeholder:text-gray-400 transition-all"
                  />
                </div>

                {/* Contact Number Field */}
                <div>
                  <label
                    htmlFor="contactNumber"
                    className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                  >
                    Contact Number
                  </label>
                  <input
                    type="text"
                    id="contactNumber"
                    name="contactNumber"
                    value={contactNumber}
                    readOnly
                    placeholder="Contact number"
                    className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-700 text-base focus:outline-none cursor-default select-none"
                  />
                </div>

                {/* Date of Birth Field */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                  >
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (statusMessage) setStatusMessage(null);
                      }}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] transition-all"
                    />
                  </div>
                </div>

                {/* Gender Field */}
                <div className="md:col-span-2">
                  <label className="block text-base sm:text-lg font-regular text-gray-800 mb-2">
                    Gender
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {(["male", "female", "other"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGender(gender === g ? "" : g);
                          if (statusMessage) setStatusMessage(null);
                        }}
                        className={`px-7 py-2.5 rounded-full text-base font-regular capitalize transition-all cursor-pointer ${gender === g
                          ? "bg-accent text-white"
                          : "bg-background text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Professional & Languages */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Briefcase className="w-5 h-5 text-[#0066F9]" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Profession & Languages
                </h3>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-base sm:text-lg font-regular text-gray-800 mb-3">
                  Occupation
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {OCCUPATION_OPTIONS.map((occ) => (
                    <button
                      key={occ.value}
                      type="button"
                      onClick={() => {
                        setOccupation(occupation === occ.value ? "" : occ.value);
                        if (statusMessage) setStatusMessage(null);
                      }}
                      className={`px-5 py-2.5 rounded-full text-base font-regular capitalize transition-all cursor-pointer ${occupation === occ.value
                        ? "bg-accent text-white"
                        : "bg-background text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
                        }`}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages Known */}
              <div>
                <label className="block text-base sm:text-lg font-regular text-gray-800 mb-3">
                  Languages You Speak
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_LANGUAGES.map((lang) => {
                    const isSelected = languagesKnown.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageToggle(lang)}
                        className={`px-5 py-2.5 rounded-full text-base font-regular capitalize transition-all cursor-pointer ${isSelected
                          ? "bg-accent text-white"
                          : "bg-background text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
                          }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: About Me */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-5 h-5 text-[#0066F9]" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  About Me / Bio
                </h3>
              </div>

              <div>
                <label
                  htmlFor="aboutMe"
                  className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                >
                  Introduce Yourself to Flatmates
                </label>
                <textarea
                  id="aboutMe"
                  name="aboutMe"
                  rows={4}
                  maxLength={1000}
                  value={aboutMe}
                  onChange={(e) => {
                    setAboutMe(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="Tell potential flatmates about your daily routine, lifestyle, cleanliness habits, hobbies, and what you look for in a flatmate..."
                  className="w-full px-6 py-4 rounded-3xl bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] placeholder:text-gray-400 transition-all resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">
                    {aboutMe.length}/1000 characters
                  </span>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-10 py-3.5 rounded-full bg-[#0066F9] hover:bg-[#0055D4] text-white text-base font-medium transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving changes...</span>
                  </>
                ) : (
                  <>
                    <span>Save changes</span>
                    <ChevronRight className="w-5 h-5 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </ViewReveal>

        {/* Divider */}
        <hr className="my-10 border-[#ECEFF3]" />

        {/* Delete Account Section */}
        <ViewReveal duration={900}>
          <div className="mt-14">
            <p className="text-sm text-gray-500 font-regular mb-3">
              If You Are No Longer Interested In Using Your Account Click The Button Below
              To Delete Your Account.
            </p>
            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className="px-6 py-3 rounded-full bg-[#FF0000] hover:bg-[#DE0000] text-white text-sm sm:text-base font-regular transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Delete account</span>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </ViewReveal>

        {/* Delete Account Modal (Step 1: Confirm -> Step 2: OTP Verification) */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              {deleteStep === "confirm" ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Delete your account?
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    This action cannot be undone. All your listings, profile data, and preferences
                    will be permanently removed. To confirm your identity, a 6-digit verification code
                    will be sent to your registered contact details.
                  </p>

                  {deleteOtpError && (
                    <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
                      {deleteOtpError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={isSendingDeleteOtp}
                      onClick={handleCloseDeleteModal}
                      className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSendingDeleteOtp}
                      onClick={handleRequestDeleteOtp}
                      className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingDeleteOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <span>Send Verification Code</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    Verify Account Deletion
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">
                    Enter the 6-digit verification code sent to your registered contact
                    {deleteDestination ? ` (${deleteDestination})` : ""}.
                  </p>

                  <form onSubmit={handleConfirmDeleteWithOtp} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center gap-1.5 sm:gap-2 py-1">
                        {deleteOtp.map((_, index) => (
                          <input
                            {...getDeleteInputProps(index, {
                              disabled: isDeleting,
                              className:
                                "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border border-gray-300 rounded-xl sm:rounded-2xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition-all bg-white text-gray-900",
                            })}
                          />
                        ))}
                      </div>

                      {deleteOtpError && (
                        <p className="text-xs text-red-500 text-center font-medium mt-2">
                          {deleteOtpError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span>Didn't receive code?</span>
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || isSendingDeleteOtp}
                        onClick={handleRequestDeleteOtp}
                        className="text-[#0066F9] hover:underline font-medium disabled:text-gray-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isSendingDeleteOtp
                          ? "Sending..."
                          : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend Code"}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleCloseDeleteModal}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isDeleting || deleteFullOtp.length < 6}
                        className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Deleting Account...</span>
                          </>
                        ) : (
                          <span>Verify & Delete</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Choose Profile Avatar</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Select a master avatar for your profile visual</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 overflow-y-auto flex-1">
                {isAvatarsLoading ? (
                  <LoadingState message="Loading avatars..." className="py-10" />
                ) : avatars.length === 0 ? (
                  <EmptyState message="No avatars available right now. Please upload a custom image." className="py-10" />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {avatars.map((avatarItem) => {
                      const isSelected =
                        profile?.avatar &&
                        typeof profile.avatar === "object" &&
                        profile.avatar._id === avatarItem._id;
                      return (
                        <button
                          key={avatarItem._id}
                          type="button"
                          onClick={() => handleAvatarSelect(avatarItem._id)}
                          disabled={isUploadingPhoto}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer group ${isSelected
                            ? "border-[#0066F9] bg-[#F0F7FF] ring-2 ring-[#0066F9]/20"
                            : "border-gray-100 bg-gray-50/50 hover:border-[#0066F9]/40 hover:bg-white shadow-xs"
                            }`}
                        >
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                            {avatarItem.image?.url ? (
                              <Image
                                src={avatarItem.image.url}
                                alt={avatarItem.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <UserIcon className="w-8 h-8 text-[#0066F9]/50" />
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#0066F9]/30 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-[#0066F9] truncate w-full text-center">
                            {avatarItem.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
