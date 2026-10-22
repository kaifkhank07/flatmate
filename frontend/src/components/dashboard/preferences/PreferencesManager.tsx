"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore, UserPreferenceItem } from "@/store/useAuthStore";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Check,
} from "lucide-react";
import SectionHeading from "../../utils/SectionHeading";
import LoadingState from "../../utils/LoadingState";
import EmptyState from "../../utils/EmptyState";
import { ViewReveal } from "../../animation";

export default function PreferencesManager() {
  const router = useRouter();
  const {
    profile,
    masterPreferences,
    isAuthenticated,
    isInitialized,
    isProfileLoading,
    isPreferencesLoading,
    fetchProfile,
    fetchMasterPreferences,
    updateUserPreferences,
  } = useAuthStore();

  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch user profile & master preferences directly from MongoDB
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        if (!profile) {
          fetchProfile();
        }
        fetchMasterPreferences();
      }
    }
  }, [isInitialized, isAuthenticated, profile, fetchProfile, fetchMasterPreferences, router]);

  // 2. Sync selected preference IDs from current user profile in store
  useEffect(() => {
    if (profile?.preferences && Array.isArray(profile.preferences)) {
      const selectedIds = profile.preferences.map((p: any) =>
        typeof p === "object" && p?._id ? p._id.toString() : p.toString()
      );
      setSelectedPreferenceIds(selectedIds);
    }
  }, [profile]);

  // 3. Toggle selection of a preference ID
  const handleTogglePreference = (prefId: string) => {
    setSelectedPreferenceIds((prev) =>
      prev.includes(prefId) ? prev.filter((id) => id !== prefId) : [...prev, prefId]
    );
    if (statusMessage) setStatusMessage(null);
  };

  // 4. Save/update user preferences to backend database
  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (selectedPreferenceIds.length < 5) {
      setStatusMessage({
        type: "error",
        text: `Please select at least 5 preferences to update (Selected: ${selectedPreferenceIds.length}).`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const success = await updateUserPreferences(selectedPreferenceIds);

      if (success) {
        setStatusMessage({
          type: "success",
          text: "Your preferences have been updated successfully!",
        });
      } else {
        const storeError = useAuthStore.getState().preferencesError;
        setStatusMessage({
          type: "error",
          text: storeError || "Failed to update preferences.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update preferences. Please try again.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    }
  };

  // 5. Helper to render image / icon for each preference fetched from DB
  const renderPreferenceImage = (pref: UserPreferenceItem) => {
    if (pref.image?.url) {
      return (
        <div className="relative w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 flex-shrink-0">
          <Image
            src={pref.image.url}
            alt={pref.name}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      );
    }

    return <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 text-[#0066F9] flex-shrink-0" />;
  };

  if (!isInitialized || (isProfileLoading && !profile)) {
    return <LoadingState message="Loading preferences from database..." fullPage />;
  }

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Header matching design */}
        <ViewReveal duration={800}>
          <SectionHeading
            title="Your Preferences"
            description="It Will Show Others What Kind Of Flatmate You Prefer. Please Select At Least 5 Preferences To Update."
            align="center"
          />
        </ViewReveal>

        {/* Notification Banner */}
        {statusMessage && (
          <div
            className={`max-w-2xl mx-auto mb-8 p-4 rounded-2xl flex items-center gap-3 text-sm transition-all duration-300 animate-in fade-in-50 ${statusMessage.type === "success"
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

        {/* Database Preferences Loading & Grid Display */}
        <ViewReveal duration={900} startDelay={150}>
          {isPreferencesLoading && masterPreferences.length === 0 ? (
            <LoadingState message="Fetching preferences from database..." className="py-16" />
          ) : masterPreferences.length === 0 ? (
            <EmptyState
              title="No preferences found in database"
              message="Please add user preferences from Admin or seed them to display them here."
              actionLabel="Reload Preferences"
              actionIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onAction={() => fetchMasterPreferences()}
              boxed
            />
          ) : (
            <form onSubmit={handleUpdatePreferences}>
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5 justify-items-center">
                  {masterPreferences.map((pref) => {
                    const isSelected = selectedPreferenceIds.includes(pref._id);

                    return (
                      <button
                        key={pref._id}
                        type="button"
                        onClick={() => handleTogglePreference(pref._id)}
                        aria-label={`Select ${pref.name}`}
                        aria-pressed={isSelected}
                        title={pref.name}
                        className={`group relative flex aspect-square w-full flex-col items-center justify-center p-1.5 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066F9]/40 ${isSelected
                            ? "bg-[#F0F7FF] border-2 border-[#0066F9] shadow-xs"
                            : "bg-white border border-gray-200/90 hover:bg-slate-50/70 hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          }`}
                      >
                        {/* Blue circular check badge in top-right when selected */}
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#0066F9] text-white shadow-xs animate-in zoom-in-75 duration-150">
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
                          </span>
                        )}

                        {/* Centered preference icon */}
                        <div className="flex items-center justify-center">
                          {renderPreferenceImage(pref)}
                        </div>

                        {/* Preference label inside the card */}
                        <span
                          className={`mt-1 sm:mt-1.5 w-full text-center text-[10px] sm:text-xs md:text-sm font-medium leading-tight tracking-tight line-clamp-1 break-words px-0.5 transition-colors ${isSelected ? "text-slate-900" : "text-slate-700"
                            }`}
                        >
                          {pref.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Update Preferences Button */}
              <div className="mt-10 sm:mt-14 text-center flex flex-col items-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 sm:px-10 py-3 rounded-full bg-[#0066F9] hover:bg-[#0055D4] text-white text-sm font-medium shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Preferences"
                  )}
                </button>

                {/* Selection Counter Note */}
                <span className="text-xs text-gray-400 mt-3">
                  {selectedPreferenceIds.length}/5 minimum selected
                </span>
              </div>
            </form>
          )}
        </ViewReveal>
      </div>
    </section>
  );
}
