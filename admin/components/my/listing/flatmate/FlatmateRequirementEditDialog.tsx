"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/lib/toast";
import {
  fetchFlatmateRequirementById,
  updateFlatmateRequirementApi,
  savePlaceLocationApi,
  uploadImageApi,
  uploadVideoApi,
  deleteImageApi,
  deleteVideoApi,
  fetchUserPreferences,
  FlatmateRequirementItem,
  PropertyMediaItem,
  UserPreferenceItem,
  AutocompleteSuggestion,
  SavePlacePayload,
  ListingStatus,
} from "@/lib/api";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import Icon from "@/components/icons";

interface FlatmateRequirementEditDialogProps {
  isOpen: boolean;
  requirementId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface MediaItemState {
  id: string;
  file?: File;
  previewUrl: string;
  mediaObject?: PropertyMediaItem;
  uploading: boolean;
  error?: string;
}

export default function FlatmateRequirementEditDialog({
  isOpen,
  requirementId,
  onClose,
  onSuccess,
}: FlatmateRequirementEditDialogProps) {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requirement, setRequirement] = useState<FlatmateRequirementItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postType, setPostType] = useState<"property" | "partner">("property");
  const [propertyType, setPropertyType] = useState<"room" | "flat" | "pg" | "shared_apartment">("flat");
  const [partnerType, setPartnerType] = useState<"roommate" | "flatmate">("roommate");
  const [budget, setBudget] = useState(0);
  const [occupationPreference, setOccupationPreference] = useState<any>("any");
  const [genderPreference, setGenderPreference] = useState<any>("any");
  const [lifestylePreferences, setLifestylePreferences] = useState<string[]>([]);
  const [moveInDate, setMoveInDate] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [status, setStatus] = useState<ListingStatus>("pending");
  const [expiresAt, setExpiresAt] = useState("");

  // Existing & New Location State
  const [existingLocation, setExistingLocation] = useState<any>(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<SavePlacePayload | null>(null);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Master Lifestyle Preferences Options
  const [preferenceOptions, setPreferenceOptions] = useState<UserPreferenceItem[]>([]);

  // Media Items State
  const [imageItems, setImageItems] = useState<MediaItemState[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItemState[]>([]);

  // Load master preferences
  useEffect(() => {
    if (!isOpen) return;
    fetchUserPreferences({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setPreferenceOptions(res.data.items || []);
      }
    });
  }, [isOpen]);

  // Load existing requirement details
  const loadRequirement = useCallback(async () => {
    if (!requirementId) return;
    setLoading(true);
    const res = await fetchFlatmateRequirementById(requirementId);
    if (res.success && res.data) {
      const item = res.data;
      setRequirement(item);
      setTitle(item.title || "");
      setDescription(item.description || "");
      setPostType(item.postType || "property");
      setPropertyType(item.propertyType || "flat");
      setPartnerType(item.partnerType || "roommate");
      setBudget(typeof item.budget === "number" ? item.budget : ((item.budget as any)?.max ?? (item.budget as any)?.min ?? 0));
      setOccupationPreference(item.occupationPreference || "any");
      setGenderPreference(item.genderPreference || "any");

      const prefIds: string[] = (item.lifestylePreferences || []).map((p: any) =>
        typeof p === "object" && p !== null ? p._id || "" : String(p)
      ).filter(Boolean);
      setLifestylePreferences(prefIds);

      if (item.moveInDate) {
        setMoveInDate(new Date(item.moveInDate).toISOString().split("T")[0]);
      } else {
        setMoveInDate("");
      }

      setPeopleCount(item.peopleCount || 1);
      setStatus((item.status as ListingStatus) || "pending");

      if (item.expiresAt) {
        setExpiresAt(new Date(item.expiresAt).toISOString().split("T")[0]);
      } else {
        setExpiresAt("");
      }

      setExistingLocation(item.location);
      setSelectedGooglePlace(null);
      setIsChangingLocation(false);
      setLocationSearchTerm("");

      const existingImgs: MediaItemState[] = ((item.images as any[]) || []).map((imgObj: any) => ({
        id: imgObj._id || imgObj.id || `img-${Math.random()}`,
        previewUrl: imgObj.url || imgObj.path,
        mediaObject: imgObj,
        uploading: false,
      }));
      setImageItems(existingImgs);

      const existingVids: MediaItemState[] = ((item.videos as any[]) || []).map((vidObj: any) => ({
        id: vidObj._id || vidObj.id || `vid-${Math.random()}`,
        previewUrl: vidObj.url || vidObj.path,
        mediaObject: vidObj,
        uploading: false,
      }));
      setVideoItems(existingVids);
    } else {
      toast(res.message || "Failed to load requirement details for editing");
      onClose();
    }
    setLoading(false);
  }, [requirementId, toast, onClose]);

  useEffect(() => {
    if (isOpen && requirementId) {
      loadRequirement();
    }
  }, [isOpen, requirementId, loadRequirement]);

  // Google Places Autocomplete Effect
  useEffect(() => {
    if (!isOpen) return;
    if (!locationSearchTerm || !locationSearchTerm.trim()) {
      setLocationSuggestions([]);
      setIsLocationDropdownOpen(false);
      setLocationSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingLocationSuggestions(true);
      setLocationSearchError(null);
      try {
        const suggestions = await searchFrontendGooglePlaces(locationSearchTerm);
        setLocationSuggestions(suggestions);
        setIsLocationDropdownOpen(true);
      } catch (err: any) {
        setLocationSuggestions([]);
        setLocationSearchError(err.message || "Unable to search Google Places");
      } finally {
        setLoadingLocationSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearchTerm, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectPlaceSuggestion = async (suggestion: AutocompleteSuggestion) => {
    try {
      setLoadingLocationSuggestions(true);
      setIsLocationDropdownOpen(false);
      const placeDetails = await getFrontendPlaceDetails(suggestion.placeId);
      setSelectedGooglePlace(placeDetails);
      setIsChangingLocation(false);
      setLocationSearchTerm("");
      setLocationSuggestions([]);
    } catch (err: any) {
      toast(err.message || "Failed to fetch details for selected Google Place");
    } finally {
      setLoadingLocationSuggestions(false);
    }
  };

  const handleAddImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItemState[] = Array.from(files).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setImageItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleRemoveImageItem = (item: MediaItemState) => {
    setImageItems((prev) => {
      if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== item.id);
    });
  };

  const handleAddVideoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItemState[] = Array.from(files).map((file) => ({
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setVideoItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleRemoveVideoItem = (item: MediaItemState) => {
    setVideoItems((prev) => {
      if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== item.id);
    });
  };

  const togglePreference = (prefId: string) => {
    setLifestylePreferences((prev) =>
      prev.includes(prefId) ? prev.filter((id) => id !== prefId) : [...prev, prefId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementId) return;

    if (!title.trim()) {
      toast("Please enter a title.");
      return;
    }

    if (budget < 0) {
      toast("Please enter a valid budget.");
      return;
    }

    if (!moveInDate) {
      toast("Please select a move-in date.");
      return;
    }

    setSubmitting(true);
    const newlyUploadedImageIds: string[] = [];
    const newlyUploadedVideoIds: string[] = [];

    const rollbackNewMedia = async () => {
      for (const imgId of newlyUploadedImageIds) {
        try {
          await deleteImageApi(imgId);
        } catch (_) { }
      }
      for (const vidId of newlyUploadedVideoIds) {
        try {
          await deleteVideoApi(vidId);
        } catch (_) { }
      }
    };

    try {
      const finalImageIds: string[] = [];
      for (const item of imageItems) {
        if (item.mediaObject?._id) {
          finalImageIds.push(item.mediaObject._id);
        } else if (item.file) {
          const uploadRes = await uploadImageApi(item.file, "flatmate", "image");
          if (!uploadRes.success || !uploadRes.data?._id) {
            await rollbackNewMedia();
            setSubmitting(false);
            toast(uploadRes.message || `Failed to upload image "${item.file.name}"`);
            return;
          }
          finalImageIds.push(uploadRes.data._id);
          newlyUploadedImageIds.push(uploadRes.data._id);
        }
      }

      const finalVideoIds: string[] = [];
      for (const item of videoItems) {
        if (item.mediaObject?._id) {
          finalVideoIds.push(item.mediaObject._id);
        } else if (item.file) {
          const uploadRes = await uploadVideoApi(item.file, "flatmate", "video");
          if (!uploadRes.success || !uploadRes.data?._id) {
            await rollbackNewMedia();
            setSubmitting(false);
            toast(uploadRes.message || `Failed to upload video "${item.file.name}"`);
            return;
          }
          finalVideoIds.push(uploadRes.data._id);
          newlyUploadedVideoIds.push(uploadRes.data._id);
        }
      }

      let locationId = "";
      if (selectedGooglePlace) {
        const locRes = await savePlaceLocationApi(selectedGooglePlace);
        if (!locRes.success || !locRes.data?._id) {
          await rollbackNewMedia();
          setSubmitting(false);
          toast(locRes.message || "Failed to save selected Google location");
          return;
        }
        locationId = locRes.data._id;
      } else if (existingLocation) {
        locationId = typeof existingLocation === "object" && existingLocation !== null
          ? String(existingLocation._id || existingLocation.id || existingLocation)
          : String(existingLocation);
      }

      if (!locationId) {
        await rollbackNewMedia();
        setSubmitting(false);
        toast("Please select a location for the requirement.");
        return;
      }

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        postType,
        location: locationId,
        budget: Number(budget),
        occupationPreference,
        genderPreference,
        lifestylePreferences,
        moveInDate: moveInDate || new Date().toISOString().split("T")[0],
        peopleCount: peopleCount && Number(peopleCount) > 0 ? Number(peopleCount) : undefined,
        status,
        expiresAt: expiresAt || undefined,
        images: finalImageIds,
        videos: finalVideoIds,
      };

      if (postType === "property") {
        payload.propertyType = propertyType;
      } else if (postType === "partner") {
        payload.partnerType = partnerType;
      }

      const res = await updateFlatmateRequirementApi(requirementId, payload);
      setSubmitting(false);

      if (res.success) {
        toast("Flatmate Requirement updated successfully!");
        onSuccess();
      } else {
        await rollbackNewMedia();
        toast(res.message || "Failed to update requirement");
      }
    } catch (err: any) {
      await rollbackNewMedia();
      setSubmitting(false);
      toast(err.message || "An unexpected error occurred while updating the requirement.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Flatmate Requirement</h3>
            <p className="text-xs text-slate-500">Update details, location, preferences, and media assets.</p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Form Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching requirement details…</span>
          </div>
        ) : requirement ? (
          <form id="edit-requirement-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Overview */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                1. Requirement Overview
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Post Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as "property" | "partner")}
                  >
                    <option value="property">Property</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>

                {postType === "property" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Property Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as any)}
                    >
                      <option value="flat">Flat</option>
                      <option value="room">Room</option>
                      <option value="pg">PG</option>
                      <option value="shared_apartment">Shared Apartment</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Partner Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value as any)}
                    >
                      <option value="roommate">Roommate</option>
                      <option value="flatmate">Flatmate</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Location / Area (Frontend Google Places API) */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                2. Location / Area (Frontend Google Places API) <span className="text-rose-500">*</span>
              </h4>

              {!isChangingLocation && (selectedGooglePlace || existingLocation) ? (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0 mt-0.5">
                      <Icon name="home" size={16} />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-slate-900 truncate">
                        📍 {selectedGooglePlace ? selectedGooglePlace.name : (existingLocation?.name || "Current Location")}
                      </strong>
                      <span className="block text-[11px] text-slate-600 font-medium truncate">
                        {selectedGooglePlace
                          ? selectedGooglePlace.formattedAddress
                          : (existingLocation?.formattedAddress || existingLocation?.city || "Requirement Location")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
                    onClick={() => {
                      setIsChangingLocation(true);
                      setLocationSearchTerm("");
                    }}
                  >
                    Change Location
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {existingLocation && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Search new Google location</span>
                      <button
                        type="button"
                        className="text-[11px] text-amber-600 hover:underline font-semibold"
                        onClick={() => {
                          setIsChangingLocation(false);
                          setSelectedGooglePlace(null);
                        }}
                      >
                        Cancel / Keep Current Location
                      </button>
                    </div>
                  )}

                  <div className="relative" ref={locationDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Search city, area, building or landmark..."
                        value={locationSearchTerm}
                        onChange={(e) => {
                          setLocationSearchTerm(e.target.value);
                          if (!e.target.value.trim()) {
                            setLocationSuggestions([]);
                            setIsLocationDropdownOpen(false);
                          }
                        }}
                        onFocus={() => {
                          if (locationSearchTerm.trim()) setIsLocationDropdownOpen(true);
                        }}
                      />
                      <div className="absolute left-3 top-2.5 text-amber-500 pointer-events-none">
                        <Icon name="search" size={15} />
                      </div>
                      {locationSearchTerm && (
                        <button
                          type="button"
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => {
                            setLocationSearchTerm("");
                            setLocationSuggestions([]);
                            setIsLocationDropdownOpen(false);
                          }}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      )}
                    </div>

                    {/* Location Autocomplete Dropdown */}
                    {isLocationDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1100] max-h-56 overflow-y-auto">
                        {loadingLocationSuggestions ? (
                          <div className="p-3 text-xs text-slate-500 text-center">Searching Google Places…</div>
                        ) : locationSearchError ? (
                          <div className="p-3 text-xs text-rose-500 text-center">{locationSearchError}</div>
                        ) : locationSuggestions.length > 0 ? (
                          locationSuggestions.map((s) => (
                            <button
                              key={s.placeId}
                              type="button"
                              className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-2.5"
                              onClick={() => handleSelectPlaceSuggestion(s)}
                            >
                              <div className="mt-0.5 text-amber-500 shrink-0">
                                <Icon name="home" size={14} />
                              </div>
                              <div>
                                <strong className="block text-xs font-semibold text-slate-900">📍 {s.mainText}</strong>
                                <span className="block text-[11px] text-slate-500">{s.secondaryText || s.description}</span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-slate-500 text-center">No matching Google Place suggestions found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Budget & Parameters */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                3. Budget & Parameters
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Budget (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Move-in Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    People Count
                  </label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ListingStatus)}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                    <option value="blocked">Blocked</option>
                    <option value="closed">Closed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Preferences & Lifestyle */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                4. Preferences & Lifestyle
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Occupation Preference
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={occupationPreference}
                    onChange={(e) => setOccupationPreference(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="student">Student</option>
                    <option value="working_professional">Working Professional</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender Preference
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>
              </div>

              {preferenceOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lifestyle Preferences
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {preferenceOptions.map((pref) => {
                      const selected = lifestylePreferences.includes(pref._id);
                      return (
                        <button
                          type="button"
                          key={pref._id}
                          onClick={() => togglePreference(pref._id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selected
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          {pref.name} ({pref.category})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Media Assets Management */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">5. Media Assets Management</h4>

              {/* Images Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Requirement Photos ({imageItems.length})
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-all shadow-sm">
                    <Icon name="refresh" size={12} />
                    <span>+ Add Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddImageFiles}
                    />
                  </label>
                </div>

                {imageItems.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {imageItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative group rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900 flex items-center justify-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt="Requirement Image"
                          className={`w-full h-full object-cover transition-opacity ${item.uploading ? "opacity-40" : "opacity-100"
                            }`}
                        />
                        {item.uploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-[10px] font-bold">
                            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1" />
                            <span>Uploading…</span>
                          </div>
                        )}
                        {item.error && (
                          <div className="absolute inset-0 flex items-center justify-center p-1 bg-rose-900/80 text-white text-[9px] text-center font-semibold">
                            Upload Failed
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors z-10"
                          onClick={() => handleRemoveImageItem(item)}
                          title="Remove Image"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400">
                    No requirement photos attached yet. Click &quot;+ Add Photos&quot; to upload images.
                  </div>
                )}
              </div>

              {/* Videos Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Requirement Walkthrough Videos ({videoItems.length})
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white cursor-pointer transition-all shadow-sm">
                    <Icon name="refresh" size={12} />
                    <span>+ Add Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={handleAddVideoFiles}
                    />
                  </label>
                </div>

                {videoItems.length > 0 ? (
                  <div className="space-y-3 max-h-52 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {videoItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2 relative"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-semibold text-slate-900 truncate max-w-[300px]">
                            {item.file?.name || item.mediaObject?.url || "Video Walkthrough"}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.uploading && (
                              <span className="text-[10px] text-amber-600 font-bold animate-pulse">
                                Uploading…
                              </span>
                            )}
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              onClick={() => handleRemoveVideoItem(item)}
                              title="Remove Video"
                            >
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        </div>

                        {/* HTML5 Video Player Preview */}
                        <div className="aspect-video w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden border border-slate-300">
                          <video
                            src={item.mediaObject?.url || item.previewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400">
                    No requirement videos attached yet. Click &quot;+ Add Video&quot; to upload walkthrough clips.
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">Requirement not found.</div>
        )}

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-requirement-form"
            className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            disabled={submitting || imageItems.some((img) => img.uploading) || videoItems.some((vid) => vid.uploading)}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
