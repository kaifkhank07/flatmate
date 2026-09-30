"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  X,
  MapPin,
  Video as VideoIcon,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import SectionHeading from "@/components/utils/SectionHeading";
import { useAuthStore } from "@/store/useAuthStore";
import { useListingStore } from "@/store/useListingStore";
import {
  searchFrontendGooglePlaces,
  getFrontendPlaceDetails,
} from "@/lib/googlePlaces";
import {
  savePlaceLocationApi,
  uploadImageApi,
  uploadVideoApi,
  deleteImageApi,
  deleteVideoApi,
  fetchUserPreferencesApi,
  AutocompleteSuggestion,
  SavePlacePayload,
  UserPreferenceItem,
} from "@/lib/apiServices";

interface FlatmateCreationFormProps {
  onBack: () => void;
}

interface PhotoStateItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface VideoStateItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function FlatmateCreationForm2({
  onBack,
}: FlatmateCreationFormProps) {
  const { user } = useAuthStore();
  const { createFlatmateRequirement } = useListingStore();

  // Location Autocomplete State
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<SavePlacePayload | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Master Preference Data State
  const [preferenceOptions, setPreferenceOptions] = useState<UserPreferenceItem[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  // Form Fields State (Post Type: 'partner')
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [partnerType, setPartnerType] = useState<"roommate" | "flatmate">("roommate");
  const [budget, setBudget] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [peopleCount, setPeopleCount] = useState("1");
  const [genderPreference, setGenderPreference] = useState<"male" | "female" | "any">("any");
  const [occupationPreference, setOccupationPreference] = useState<"student" | "working_professional" | "self_employed" | "business_owner" | "freelancer" | "any">("any");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // Media State
  const [photoItems, setPhotoItems] = useState<PhotoStateItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoStateItem[]>([]);

  // Submission & Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Lifestyle Preferences on Mount
  useEffect(() => {
    setLoadingPreferences(true);
    fetchUserPreferencesApi({ limit: 100 })
      .then((res) => {
        if (res.success && res.data?.items) {
          setPreferenceOptions(res.data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPreferences(false));
  }, []);

  // Debounced Google Places Location Search
  useEffect(() => {
    if (!locationSearchTerm || !locationSearchTerm.trim()) {
      setLocationSuggestions([]);
      setIsLocationDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingLocationSuggestions(true);
      try {
        const suggestions = await searchFrontendGooglePlaces(locationSearchTerm);
        setLocationSuggestions(suggestions);
        setIsLocationDropdownOpen(true);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setLoadingLocationSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearchTerm]);

  // Click Outside Listener for Location Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Location Selection
  const handleSelectPlaceSuggestion = async (suggestion: AutocompleteSuggestion) => {
    try {
      setLoadingLocationSuggestions(true);
      setIsLocationDropdownOpen(false);
      const placeDetails = await getFrontendPlaceDetails(suggestion.placeId);
      setSelectedGooglePlace(placeDetails);
      setLocationSearchTerm("");
      setLocationSuggestions([]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch place details");
    } finally {
      setLoadingLocationSuggestions(false);
    }
  };

  // Toggle Preference Selection
  const togglePreference = (prefId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(prefId)
        ? prev.filter((id) => id !== prefId)
        : [...prev, prefId]
    );
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newItems: PhotoStateItem[] = files.map((file) => ({
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPhotoItems((prev) => [...prev, ...newItems]);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotoItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Video Upload Handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newItems: VideoStateItem[] = files.map((file) => ({
        id: `video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setVideoItems((prev) => [...prev, ...newItems]);
      e.target.value = "";
    }
  };

  const handleRemoveVideo = (id: string) => {
    setVideoItems((prev) => {
      const item = prev.find((v) => v.id === id);
      if (item && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  // Form Submit Handler
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Requirement title is required.");
      return;
    }

    if (!selectedGooglePlace) {
      setErrorMessage("Please search and select a preferred location.");
      return;
    }

    if (!budget || Number(budget) <= 0) {
      setErrorMessage("Budget must be greater than 0.");
      return;
    }

    if (!moveInDate) {
      setErrorMessage("Move-in date is required.");
      return;
    }

    setIsSubmitting(true);
    const createdImageIds: string[] = [];
    const createdVideoIds: string[] = [];

    const cleanupUploadedMedia = async () => {
      if (createdImageIds.length > 0) {
        await Promise.all(createdImageIds.map((id) => deleteImageApi(id))).catch(() => {});
      }
      if (createdVideoIds.length > 0) {
        await Promise.all(createdVideoIds.map((id) => deleteVideoApi(id))).catch(() => {});
      }
    };

    try {
      // Step 1: Upload Photos
      if (photoItems.length > 0) {
        for (const item of photoItems) {
          const res = await uploadImageApi(item.file, "flatmate", "image");
          if (!res.success || !res.data?._id) {
            await cleanupUploadedMedia();
            setIsSubmitting(false);
            setErrorMessage(`Failed to upload photo "${item.file.name}"`);
            return;
          }
          createdImageIds.push(res.data._id);
        }
      }

      // Step 2: Upload Videos
      if (videoItems.length > 0) {
        for (const item of videoItems) {
          const res = await uploadVideoApi(item.file, "flatmate", "video");
          if (!res.success || !res.data?._id) {
            await cleanupUploadedMedia();
            setIsSubmitting(false);
            setErrorMessage(`Failed to upload video "${item.file.name}"`);
            return;
          }
          createdVideoIds.push(res.data._id);
        }
      }

      // Step 3: Save Location to DB
      const locRes = await savePlaceLocationApi(selectedGooglePlace);
      if (!locRes.success || !locRes.data?._id) {
        await cleanupUploadedMedia();
        setIsSubmitting(false);
        setErrorMessage(locRes.message || "Failed to save selected location.");
        return;
      }

      const locationId = locRes.data._id;

      // Step 4: Create Flatmate Requirement (Post Type: 'partner')
      const payload: any = {
        userId: user?._id,
        title: title.trim(),
        description: description.trim() || undefined,
        postType: "partner",
        partnerType,
        location: locationId,
        budget: Number(budget),
        occupationPreference,
        genderPreference,
        lifestylePreferences: selectedPreferences,
        moveInDate,
        peopleCount: Number(peopleCount || 1),
        images: createdImageIds,
        videos: createdVideoIds,
        status: "pending",
      };

      const result = await createFlatmateRequirement(payload);

      if (!result) {
        await cleanupUploadedMedia();
        setIsSubmitting(false);
        setErrorMessage("Failed to create flatmate partner requirement. Please try again.");
        return;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      await cleanupUploadedMedia();
      setIsSubmitting(false);
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-8">
        {/* Top Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-blue bg-white border border-gray-200 px-4 py-2 rounded-full shadow-xs hover:border-brand-blue/40 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Options
          </button>
        </div>

        {/* Success Banner */}
        {isSubmitted && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-emerald-900">
                Partner Requirement Posted Successfully
              </h3>
              <p className="text-sm text-emerald-700 mt-1">
                Your flatmate partner requirement has been submitted and is currently pending review.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-2 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
              >
                Post Another Requirement
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4 text-rose-700 text-sm">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Card Wrapper */}
        <div className="bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 md:p-12 shadow-sm space-y-8 sm:space-y-10 md:space-y-12">
          <SectionHeading
            title="Need Roommate Partner"
            description="Fill In Details Resolve Location And Upload Media Assets"
            align="center"
          />

          <form onSubmit={handlePublish} className="space-y-8">
            {/* Location Autocomplete Field */}
            <div className="space-y-2 relative" ref={locationDropdownRef}>
              <label className="block text-sm sm:text-base font-regular text-black">
                Preferred Location <span className="text-rose-500">*</span>
              </label>

              {selectedGooglePlace ? (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900 block truncate text-sm">
                        📍 {selectedGooglePlace.name}
                      </span>
                      <span className="text-gray-500 block truncate text-xs">
                        {selectedGooglePlace.formattedAddress}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGooglePlace(null);
                      setLocationSearchTerm("");
                    }}
                    className="px-3.5 py-1.5 bg-white border border-blue-200 text-brand-blue hover:bg-blue-100 rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
                  >
                    Change Location
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={locationSearchTerm}
                    onChange={(e) => setLocationSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (locationSearchTerm.trim()) setIsLocationDropdownOpen(true);
                    }}
                    placeholder="Search City, Area, Building Or Landmark…"
                    className="w-full pl-11 pr-10 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                  {locationSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationSearchTerm("");
                        setLocationSuggestions([]);
                        setIsLocationDropdownOpen(false);
                      }}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Google Location Predictions Dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto">
                  {loadingLocationSuggestions ? (
                    <div className="p-3 text-xs text-gray-500 text-center">Searching Google Places…</div>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((s) => (
                      <button
                        key={s.placeId}
                        type="button"
                        onClick={() => handleSelectPlaceSuggestion(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-none flex items-start gap-2 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-semibold text-gray-900">{s.mainText}</span>
                          <span className="block text-[11px] text-gray-500">{s.secondaryText || s.description}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-gray-500 text-center">No matching location suggestions found</div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 1: REQUIREMENT OVERVIEW */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                REQUIREMENT OVERVIEW
              </h3>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Headline Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Looking for Flatmate / Roommate to Hunt Flat in HSR"
                  className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Detailed Description & Expectations
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about your budget, lifestyle, and flat hunting preferences…"
                  className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none resize-none"
                />
              </div>

              {/* Partner Type Select */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Partner Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={partnerType}
                  onChange={(e) => setPartnerType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                >
                  <option value="roommate">Roommate</option>
                  <option value="flatmate">Flatmate</option>
                </select>
              </div>
            </div>

            {/* SECTION 2: BUDGET & MOVE-IN PARAMETERS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                BUDGET & MOVE-IN PARAMETERS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Budget */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Budget (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                    required
                  />
                </div>

                {/* Move-in Date */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Move-in Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                    required
                  />
                </div>

                {/* People Count */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    People Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: PREFERENCES & LIFESTYLE */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                PREFERENCES & LIFESTYLE
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Gender Preference */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Gender Preference
                  </label>
                  <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                  >
                    <option value="any">Any Gender</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>

                {/* Occupation Preference */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Occupation Preference
                  </label>
                  <select
                    value={occupationPreference}
                    onChange={(e) => setOccupationPreference(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                  >
                    <option value="any">Any Occupation</option>
                    <option value="student">Student</option>
                    <option value="working_professional">Working Professional</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>
              </div>

              {/* Lifestyle Preferences Pills */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Lifestyle Preferences ({selectedPreferences.length} Selected)
                </label>

                {loadingPreferences ? (
                  <div className="p-4 bg-[#F8FAFC] rounded-2xl text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                    Loading preferences…
                  </div>
                ) : preferenceOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 p-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl max-h-48 overflow-y-auto">
                    {preferenceOptions.map((pref) => {
                      const isSelected = selectedPreferences.includes(pref._id);
                      return (
                        <button
                          key={pref._id}
                          type="button"
                          onClick={() => togglePreference(pref._id)}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-brand-blue text-white shadow-xs"
                              : "bg-white text-gray-700 border border-gray-200 hover:border-brand-blue/40 hover:bg-blue-50/50"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {pref.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFC] rounded-2xl text-xs text-gray-400 text-center">
                    No lifestyle preferences available
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: MEDIA ASSETS MANAGEMENT */}
            <div className="space-y-6 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                MEDIA ASSETS MANAGEMENT
              </h3>

              {/* Photos Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Requirement Photos ({photoItems.length})
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white cursor-pointer transition-all shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {photoItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-[#F8FAFC] border border-gray-100 rounded-2xl max-h-56 overflow-y-auto">
                    {photoItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-900 flex items-center justify-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt="Photo Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(item.id)}
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors z-10"
                          title="Remove Photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-brand-blue rounded-2xl py-8 px-4 flex flex-col justify-center items-center cursor-pointer bg-[#F8FAFC] hover:bg-blue-50/40 transition-colors group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-brand-blue group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-xs text-gray-500 mt-2">
                      Click to upload photos (JPEG, PNG, WebP)
                    </span>
                  </label>
                )}
              </div>

              {/* Videos Upload Section */}
              {/* <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Walkthrough Videos ({videoItems.length})
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-gray-900 text-white cursor-pointer transition-all shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select Video</span>
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {videoItems.length > 0 ? (
                  <div className="space-y-3 p-3 bg-[#F8FAFC] border border-gray-100 rounded-2xl max-h-64 overflow-y-auto">
                    {videoItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 relative"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 truncate max-w-[280px]">
                            {item.file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(item.id)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="aspect-video w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden border border-gray-200">
                          <video
                            src={item.previewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-gray-800 rounded-2xl py-8 px-4 flex flex-col justify-center items-center cursor-pointer bg-[#F8FAFC] hover:bg-gray-100/60 transition-colors group">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <VideoIcon className="w-8 h-8 text-gray-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-xs text-gray-500 mt-2">
                      Click to upload walkthrough videos (MP4, WebM)
                    </span>
                  </label>
                )}
              </div> */}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent/80 text-white py-3.5 px-10 md:px-14 rounded-2xl font-medium text-base transition-all shadow-md active:scale-98 cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Submitting Requirement…" : "Submit Partner Requirement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
