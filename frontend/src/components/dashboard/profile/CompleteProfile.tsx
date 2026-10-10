"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  User as UserIcon,
  Briefcase,
  FileText,
  ImageIcon,
  X,
  ChevronRight,
} from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import LoadingState from "@/components/utils/LoadingState";
import EmptyState from "@/components/utils/EmptyState";

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

export default function CompleteProfile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    user,
    profile,
    avatars,
    isAvatarsLoading,
    isAuthenticated,
    isInitialized,
    isProfileLoading,
    fetchProfile,
    updateProfile,
    fetchAvatars,
    checkProfileCompletionStatus,
    completeProfile,
  } = useAuthStore();

  // Local Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<GenderType>("");
  const [occupation, setOccupation] = useState<OccupationType>("");
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [aboutMe, setAboutMe] = useState("");

  // Local Image & Avatar Selection State (Saved on Submit)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState<boolean>(false);

  // Status & UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch avatars on mount if not already loaded
  useEffect(() => {
    if (avatars.length === 0) {
      fetchAvatars();
    }
  }, [avatars.length, fetchAvatars]);

  // Auth & Completion check
  useEffect(() => {
    let isMounted = true;
    const verifyAccess = async () => {
      if (!isInitialized) return;

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      try {
        const completed = await checkProfileCompletionStatus();
        if (completed && isMounted) {
          router.push("/");
          return;
        }

        if (!useAuthStore.getState().profile) {
          await fetchProfile();
        }
      } catch (err) {
        console.error("Error verifying completion status:", err);
      } finally {
        if (isMounted) {
          setIsCheckingStatus(false);
        }
      }
    };

    verifyAccess();
    return () => {
      isMounted = false;
    };
  }, [isInitialized, isAuthenticated, router, checkProfileCompletionStatus, fetchProfile]);

  // Populate form with existing data
  useEffect(() => {
    if (profile || user) {
      setFirstName(profile?.firstName || "");
      setLastName(profile?.lastName || "");
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

      // Populate initial image / avatar preview if not locally edited
      if (!selectedFile && !selectedAvatarId && !isImageRemoved) {
        if (profile?.image?.url) {
          setPreviewUrl(profile.image.url);
        } else if (
          profile?.avatar &&
          typeof profile.avatar === "object" &&
          profile.avatar.image?.url
        ) {
          setPreviewUrl(profile.avatar.image.url);
          setSelectedAvatarId(profile.avatar._id);
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

  // Local File Selection Handler
  const handleFileSelected = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Image size must be less than 5MB.",
      });
      return;
    }

    setSelectedFile(file);
    setSelectedAvatarId(null);
    setIsImageRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
    if (statusMessage) setStatusMessage(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelected(file);
      } else {
        setStatusMessage({
          type: "error",
          text: "Please upload a valid image file (jpg or png).",
        });
      }
    }
  };

  // Local Image Removal Handler
  const handlePhotoDelete = () => {
    setSelectedFile(null);
    setSelectedAvatarId(null);
    setPreviewUrl(null);
    setIsImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (statusMessage) setStatusMessage(null);
  };

  // Local Avatar Selection Handler
  const handleAvatarSelect = (avatarId: string) => {
    const targetAvatar = avatars.find((a) => a._id === avatarId);
    setSelectedAvatarId(avatarId);
    setSelectedFile(null);
    setIsImageRemoved(false);
    setPreviewUrl(targetAvatar?.image?.url || null);
    if (statusMessage) setStatusMessage(null);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory Field Validation
    if (!firstName.trim()) {
      setStatusMessage({ type: "error", text: "First name is required." });
      return;
    }
    if (!lastName.trim()) {
      setStatusMessage({ type: "error", text: "Last name is required." });
      return;
    }
    if (!gender) {
      setStatusMessage({ type: "error", text: "Please select your gender." });
      return;
    }
    if (!dateOfBirth) {
      setStatusMessage({ type: "error", text: "Date of birth is required." });
      return;
    }
    if (!occupation) {
      setStatusMessage({ type: "error", text: "Please select your occupation (Who You Are)." });
      return;
    }
    if (languagesKnown.length === 0) {
      setStatusMessage({ type: "error", text: "Please select at least one language you speak." });
      return;
    }
    if (!previewUrl) {
      setStatusMessage({ type: "error", text: "Please upload a profile image or select a preset avatar." });
      return;
    }
    if (!aboutMe.trim()) {
      setStatusMessage({ type: "error", text: "Please introduce yourself in the bio section." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      let updateSuccess = false;

      if (selectedFile) {
        // User selected a local image file -> send as FormData with updateProfile
        const formData = new FormData();
        formData.append("firstName", firstName.trim());
        formData.append("lastName", lastName.trim());
        if (gender) formData.append("gender", gender);
        if (occupation) formData.append("occupation", occupation);
        if (dateOfBirth) formData.append("dateOfBirth", new Date(dateOfBirth).toISOString());
        formData.append("languagesKnown", JSON.stringify(languagesKnown));
        formData.append("aboutMe", aboutMe.trim());
        formData.append("image", selectedFile);

        updateSuccess = await updateProfile(formData);
      } else {
        // Send JSON payload to updateProfile
        const payload: Record<string, any> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender || undefined,
          occupation: occupation || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
          languagesKnown: languagesKnown,
          aboutMe: aboutMe.trim(),
        };

        if (selectedAvatarId) {
          payload.avatar = selectedAvatarId;
        } else if (isImageRemoved) {
          payload.removeImage = true;
          payload.removeAvatar = true;
          payload.avatar = null;
        }

        updateSuccess = await updateProfile(payload);
      }

      if (!updateSuccess) {
        const storeError = useAuthStore.getState().profileError;
        setStatusMessage({
          type: "error",
          text: storeError || "Failed to save profile information.",
        });
        setIsSaving(false);
        return;
      }

      // Mark profile as completed once profile details & image/avatar are saved
      const completeSuccess = await completeProfile();

      if (completeSuccess) {
        setStatusMessage({
          type: "success",
          text: "Profile completed successfully! Redirecting...",
        });
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setStatusMessage({
          type: "error",
          text: "Failed to mark profile as completed. Please try again.",
        });
        setIsSaving(false);
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "An error occurred while saving your profile.",
      });
      setIsSaving(false);
    }
  };

  if (!isInitialized || isCheckingStatus || (isProfileLoading && !profile)) {
    return <LoadingState message="Checking profile completion status..." fullPage />;
  }

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Page Title & Profile Completion */}
        <SectionHeading
          title="Complete Your Profile"
          description="Please complete your profile details to get started with Flat & Flatmate."
        />

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

        {/* Main Completion Form */}
        <form onSubmit={handleSubmitProfile} className="space-y-8 md:space-y-10">
          {/* SECTION 1: Personal Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <UserIcon className="w-5 h-5 text-[#0066F9]" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Personal Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* First Name */}
              <div>
                <label
                  htmlFor="complete-firstName"
                  className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                >
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="complete-firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="Please enter your name"
                  required
                  className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] placeholder:text-gray-400 transition-all"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2 font-normal">
                  Note: Users with real names gets{" "}
                  <span className="text-[#0066F9] font-semibold">90% more engagement.</span>
                </p>
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="complete-lastName"
                  className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="complete-lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="e.g. Shah"
                  required
                  className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] placeholder:text-gray-400 transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-base sm:text-lg font-regular text-gray-800 mb-2">
                  Your Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGender(gender === g ? "" : g);
                        if (statusMessage) setStatusMessage(null);
                      }}
                      className={`px-5 py-2.5 rounded-full text-base font-regular capitalize transition-all cursor-pointer ${gender === g
                        ? "bg-[#0066F9] text-white"
                        : "bg-[#F3F9FD] text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="complete-dateOfBirth"
                  className="block text-base sm:text-lg font-regular text-gray-800 mb-2"
                >
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="complete-dateOfBirth"
                  name="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-6 py-3.5 rounded-full bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Profession & Languages */}
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
                Who You Are <span className="text-red-500">*</span>
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
                      ? "bg-[#0066F9] text-white"
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
                Languages You Speak <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COMMON_LANGUAGES.map((lang) => {
                  const isSelected = languagesKnown.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-5 py-2.5 rounded-full text-base font-regular capitalize transition-all cursor-pointer ${isSelected
                        ? "bg-[#0066F9] text-white"
                        : "bg-[#F3F9FD] text-gray-600 border border-[#E2EFF8] hover:bg-[#EAF4FC]"
                        }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: Image & Avatar Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Camera className="w-5 h-5 text-[#0066F9]" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Upload Image/Select Avatar <span className="text-red-500">*</span>
              </h3>
            </div>

            <div className="p-2">
              {previewUrl ? (
                /* When an image or avatar IS selected -> Show ONLY the circular image with 'X' badge */
                <div className="flex justify-center sm:justify-start py-2">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#E2EFF8] bg-white relative shadow-sm">
                      <Image
                        src={previewUrl}
                        alt="Selected Visual Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handlePhotoDelete}
                      aria-label="Remove image"
                      title="Remove image / avatar"
                      className="absolute top-0 right-0 bg-[#1E293B] hover:bg-[#0F172A] text-white p-1.5 rounded-full shadow-md transition-transform active:scale-90 cursor-pointer border-2 border-white"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                /* When NO image/avatar is selected -> Show Dropzone + -- OR -- + Preset Avatars Row */
                <div className="space-y-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed ${isDragging
                      ? "border-[#0066F9] bg-blue-50/50"
                      : "border-gray-200 hover:border-[#0066F9] bg-white hover:bg-blue-50/30"
                      } rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] group`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-50 text-gray-400 group-hover:text-[#0066F9] flex items-center justify-center mb-3 transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-gray-600 group-hover:text-gray-900">
                      Click or Drop to upload profile image (jpg or png)
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* OR Divider */}
                  <div className="text-center text-xs sm:text-sm text-gray-400 font-medium tracking-wider">
                    -- OR --
                  </div>

                  {/* Preset Avatars Row */}
                  <div>
                    {isAvatarsLoading ? (
                      <LoadingState message="Loading avatars..." size="sm" className="py-4" />
                    ) : avatars.length === 0 ? (
                      <EmptyState message="No preset avatars available." compact />
                    ) : (
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
                        {avatars.map((avatarItem) => (
                          <button
                            key={avatarItem._id}
                            type="button"
                            onClick={() => handleAvatarSelect(avatarItem._id)}
                            title={avatarItem.name}
                            className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-300 hover:scale-105 transition-all cursor-pointer shadow-xs"
                          >
                            <Image
                              src={avatarItem.image?.url || ""}
                              alt={avatarItem.name}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Bio / About Me */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <FileText className="w-5 h-5 text-[#0066F9]" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Introduce Yourself <span className="text-red-500">*</span>
              </h3>
            </div>

            <div>
              <textarea
                id="complete-aboutMe"
                name="aboutMe"
                rows={4}
                maxLength={1000}
                value={aboutMe}
                onChange={(e) => {
                  setAboutMe(e.target.value);
                  if (statusMessage) setStatusMessage(null);
                }}
                placeholder="Tell potential flatmates about your daily routine, lifestyle, cleanliness habits, hobbies..."
                required
                className="w-full px-6 py-4 rounded-3xl bg-[#F3F9FD] border border-[#E2EFF8] text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 focus:border-[#0066F9] placeholder:text-gray-400 transition-all resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">{aboutMe.length}/1000 characters</span>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              disabled={isSaving}
              className="px-10 py-3.5 rounded-full bg-[#0066F9] hover:bg-[#0055D4] text-white text-base font-medium transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving changes...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue</span>
                  <ChevronRight className="w-5 h-5 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

