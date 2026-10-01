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
  Utensils,
  PawPrint,
  Wine,
  RefreshCw,
} from "lucide-react";
import SectionHeading from "../utils/SectionHeading";

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
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20">
          <Image
            src={pref.image.url}
            alt={pref.name}
            fill
            unoptimized
            className="object-contain p-1"
          />
        </div>
      );
    }

    // Category-based fallback if no image uploaded on preference record
    if (pref.category === "food") {
      return <Utensils className="w-10 h-10 text-emerald-500" />;
    }
    if (pref.category === "pets") {
      return <PawPrint className="w-10 h-10 text-amber-500" />;
    }
    if (pref.category === "drink") {
      return <Wine className="w-10 h-10 text-blue-500" />;
    }
    return <Sparkles className="w-10 h-10 text-[#0066F9]" />;
  };

  if (!isInitialized || (isProfileLoading && !profile)) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-9 h-9 text-[#0066F9] animate-spin mb-3" />
        <p className="text-gray-500 text-base font-medium">Loading preferences from database...</p>
      </div>
    );
  }

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Header matching design */}
        <SectionHeading
          title="Your Preferences"
          description="It Will Show Others What Kind Of Flatmate You Prefer. Please Select At Least 5 Preferences To Update."
          align="center"
        />

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
        {isPreferencesLoading && masterPreferences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0066F9] animate-spin mb-3" />
            <p className="text-sm text-gray-500">Fetching preferences from database...</p>
          </div>
        ) : masterPreferences.length === 0 ? (
          <div className="text-center py-16 bg-[#F8FBFE] rounded-3xl border border-[#E2EFF8] p-8 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-[#0066F9] mx-auto mb-3" />
            <p className="text-base font-medium text-gray-800 mb-2">No preferences found in database</p>
            <p className="text-xs text-gray-500 mb-4">
              Please add user preferences from Admin or seed them to display them here.
            </p>
            <button
              type="button"
              onClick={() => fetchMasterPreferences()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0066F9] text-white text-xs font-medium hover:bg-[#0052c7] transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Preferences
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePreferences}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 justify-items-center">
              {masterPreferences.map((pref) => {
                const isSelected = selectedPreferenceIds.includes(pref._id);

                return (
                  <div key={pref._id} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePreference(pref._id)}
                      aria-label={`Select ${pref.name}`}
                      className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${isSelected
                        ? "bg-[#E3F2FD] border-2 border-[#0066F9] ring-4 ring-[#0066F9]/15 shadow-sm scale-102"
                        : "bg-[#F3F9FD] border border-[#E2EFF8] hover:bg-[#EAF4FC] hover:border-[#D0E6F7]"
                        }`}
                    >
                      {renderPreferenceImage(pref)}
                    </button>

                    <span className="text-gray-800 text-sm sm:text-base md:text-lg font-regular mt-3 text-center tracking-tight">
                      {pref.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Update Preferences Button */}
            <div className="mt-12 sm:mt-16 text-center flex flex-col items-center">
              <button
                type="submit"
                disabled={isSaving}
                className="px-10 py-3 rounded-full bg-[#0066F9] hover:bg-[#0055D4] text-white text-sm font-medium shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
      </div>
    </section>
  );
}
