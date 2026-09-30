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
import SectionHeading from "../utils/SectionHeading";

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
  "Punjabi",
  "Marathi",
  "Bengali",
  "Telugu",
  "Tamil",
  "Kannada",
  "Gujarati",
  "Malayalam",
  "French",
  "Spanish",
  "German",
];

const OCCUPATION_OPTIONS: { label: string; value: OccupationType }[] = [
  { label: "Student", value: "student" },
  { label: "Working Professional", value: "working_professional" },
  { label: "Self Employed", value: "self_employed" },
  { label: "Business Owner", value: "business_owner" },
  { label: "Freelancer", value: "freelancer" },
  { label: "Other", value: "other" },
];

export default function ProfileManager() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    user,
    profile,
    isAuthenticated,
    isInitialized,
    isProfileLoading,
    fetchProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
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
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
          text: "Profile photo removed.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to delete photo.",
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete("/users/me");
      await logout();
      router.push("/");
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to delete account. Please try again.",
      });
      setShowDeleteModal(false);
      setIsDeleting(false);
    }
  };

  const completionPercentage = profile?.profileCompletion ?? 0;

  if (!isInitialized || (isProfileLoading && !profile)) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-9 h-9 text-[#0066F9] animate-spin mb-3" />
        <p className="text-gray-500 text-base font-medium">Loading your profile details...</p>
      </div>
    );
  }

  return (
    <section className="w-full py-12 md:py-16 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-8 sm:space-y-12">
        {/* Page Title & Profile Completion */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <SectionHeading title="Your Profile" />

          {/* Profile Completion Badge */}
          <div className="bg-[#F3F9FD] border border-[#E2EFF8] rounded-2xl p-4 sm:px-6 flex items-center gap-4 w-fit">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Profile Completion
              </span>
              <span className="text-lg font-bold text-[#0066F9]">
                {completionPercentage}% Complete
              </span>
            </div>
            <div className="w-24 sm:w-32 bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0066F9] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, completionPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm transition-all duration-300 animate-in fade-in-50 ${
              statusMessage.type === "success"
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

        {/* Profile Avatar / Photo Section */}
        <div className="bg-[#F8FBFE] border border-[#E2EFF8] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#0066F9]/30 bg-white shadow-sm flex items-center justify-center relative">
              {profile?.image?.url ? (
                <Image
                  src={profile.image.url}
                  alt="Profile Photo"
                  fill
                  className="object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-[#0066F9]/50" />
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
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#0066F9] hover:bg-[#0052C7] text-white shadow-md transition-transform active:scale-90 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {firstName ? `${firstName} ${lastName}`.trim() : "Your Name"}
            </h3>
            <p className="text-sm text-gray-500">
              Upload a clear photo to build trust and increase match requests by 90%.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-xs sm:text-sm font-medium text-[#0066F9] hover:underline cursor-pointer"
              >
                Change Photo
              </button>
              {profile?.image?.url && (
                <>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handlePhotoDelete}
                    disabled={isUploadingPhoto}
                    className="text-xs sm:text-sm font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
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
                      className={`px-7 py-2.5 rounded-full text-base font-regular capitalize transition-all cursor-pointer ${
                        gender === g
                          ? "bg-[#E3F2FD] text-[#0066F9] border border-[#BCE0FD] shadow-xs"
                          : "bg-[#F3F9FD] text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
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
                    className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-regular transition-all cursor-pointer ${
                      occupation === occ.value
                        ? "bg-[#E3F2FD] text-[#0066F9] border border-[#BCE0FD] shadow-xs"
                        : "bg-[#F3F9FD] text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
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
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0066F9] text-white shadow-xs"
                          : "bg-[#F3F9FD] text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
                      }`}
                    >
                      {lang} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>

              {/* Custom Language Adder */}
              {/* <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  onKeyDown={handleAddCustomLanguage}
                  placeholder="Add other language..."
                  className="w-full px-5 py-2.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLanguage}
                  className="p-2.5 rounded-full bg-[#0066F9] text-white hover:bg-[#0055D4] transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div> */}

              {/* Selected custom tags */}
              {/* {languagesKnown.filter((l) => !COMMON_LANGUAGES.includes(l)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {languagesKnown
                    .filter((l) => !COMMON_LANGUAGES.includes(l))
                    .map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0066F9] text-xs font-medium border border-blue-200"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleLanguageToggle(lang)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>
              )} */}
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

        {/* Divider */}
        <hr className="my-10 border-[#ECEFF3]" />

        {/* Delete Account Section */}
        <div className="mt-14">
          <p className="text-sm text-gray-500 font-regular mb-3">
            If You Are No Longer Interested In Using Your Account Click The Button Below
            To Delete Your Account.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 rounded-full bg-[#FF0000] hover:bg-[#DE0000] text-white text-sm sm:text-base font-regular transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Delete account</span>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Delete your account?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All your listings, profile data, and preferences
                will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Account</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
