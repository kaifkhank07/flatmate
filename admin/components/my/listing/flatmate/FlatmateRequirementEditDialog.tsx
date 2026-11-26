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
  fetchPropertyAmenities,
  FlatmateRequirementItem,
  PropertyMediaItem,
  UserPreferenceItem,
  PropertyAmenityItem,
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
  const [partnerType, setPartnerType] = useState<"roommate" | "flatmate">("flatmate");
  const [postedBy, setPostedBy] = useState<"owner" | "flatmate">("flatmate");
  const [floor, setFloor] = useState<number | "">("");
  const [totalFloors, setTotalFloors] = useState<number | "">("");
  const [facing, setFacing] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [area, setArea] = useState(0);
  const [rent, setRent] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [maintenanceAmount, setMaintenanceAmount] = useState(0);
  const [maintenanceFrequency, setMaintenanceFrequency] = useState<"monthly" | "yearly" | "included" | "one_time">("yearly");
  const [furnishing, setFurnishing] = useState<"fully_furnished" | "semi_furnished" | "unfurnished">("semi_furnished");
  const [parking, setParking] = useState(false);
  const [brokerage, setBrokerage] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [occupationPreference, setOccupationPreference] = useState<any>("any");
  const [genderPreference, setGenderPreference] = useState<any>("any");
  const [occupancyPreference, setOccupancyPreference] = useState<any>("any");
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [status, setStatus] = useState<ListingStatus>("pending");
  const [rejectionReason, setRejectionReason] = useState("");

  // Location State
  const [existingLocation, setExistingLocation] = useState<any>(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<SavePlacePayload | null>(null);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Master Options
  const [preferenceOptions, setPreferenceOptions] = useState<UserPreferenceItem[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<PropertyAmenityItem[]>([]);

  // Media Items State
  const [imageItems, setImageItems] = useState<MediaItemState[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItemState[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchUserPreferences({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setPreferenceOptions(res.data.items || []);
      }
    });
    fetchPropertyAmenities({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setAmenityOptions(res.data.items || []);
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
      setPartnerType(item.partnerType || "flatmate");
      setPostedBy((item.postedBy as any) || "flatmate");
      setFloor(
        item.propertyDetails?.floor !== undefined
          ? item.propertyDetails.floor
          : ""
      );
      setTotalFloors(
        item.propertyDetails?.totalFloors !== undefined
          ? item.propertyDetails.totalFloors
          : ""
      );
      setFacing(item.propertyDetails?.facing || "");
      setBedrooms(item.propertyDetails?.bedrooms || "");
      setArea(item.area || 0);
      setRent(typeof item.rent === "number" ? item.rent : (item as any).budget || 0);
      setSecurityDeposit(item.securityDeposit || 0);
      setMaintenanceAmount(item.maintenanceCharges?.amount || 0);
      setMaintenanceFrequency((item.maintenanceCharges?.frequency as any) || "yearly");
      setFurnishing(item.furnishing || "semi_furnished");
      setParking(Boolean(item.parking));
      setBrokerage(Boolean(item.brokerage));
      setOccupationPreference(item.occupationPreference || "any");
      setGenderPreference(item.genderPreference || "any");
      setOccupancyPreference(item.occupancyPreference || "any");

      const prefSource = item.userPreferences || (item as any).lifestylePreferences || [];
      const prefIds: string[] = prefSource
        .map((p: any) => (typeof p === "object" && p !== null ? p._id || "" : String(p)))
        .filter(Boolean);
      setUserPreferences(prefIds);

      const amenIds: string[] = (item.amenities || [])
        .map((a: any) => (typeof a === "object" && a !== null ? a._id || "" : String(a)))
        .filter(Boolean);
      setAmenities(amenIds);

      const dateStr = item.availableFrom || (item as any).moveInDate;
      if (dateStr) {
        setAvailableFrom(new Date(dateStr).toISOString().split("T")[0]);
      } else {
        setAvailableFrom("");
      }

      setStatus((item.status as ListingStatus) || "pending");
      setRejectionReason(item.rejectionReason || "");

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

  const handleRemoveImageItem = (id: string) => {
    setImageItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
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

  const handleRemoveVideoItem = (id: string) => {
    setVideoItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClose = () => {
    imageItems.forEach((img) => {
      if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
    });
    videoItems.forEach((vid) => {
      if (vid.previewUrl.startsWith("blob:")) URL.revokeObjectURL(vid.previewUrl);
    });
    onClose();
  };

  const handlePostTypeChange = (newPostType: "property" | "partner") => {
    if (newPostType === postType) return;

    if (newPostType === "property") {
      imageItems.forEach((img) => {
        if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
      });
      videoItems.forEach((vid) => {
        if (vid.previewUrl.startsWith("blob:")) URL.revokeObjectURL(vid.previewUrl);
      });
      setImageItems([]);
      setVideoItems([]);

      setPostType("property");
      setPropertyType(propertyType || "flat");
      setArea(0);
      setSecurityDeposit(0);
      setFurnishing("semi_furnished");
      setParking(false);
      setMaintenanceAmount(0);
      setMaintenanceFrequency("yearly");
      setAmenities([]);
    } else {
      setPostType("partner");
      setPartnerType(partnerType || "flatmate");
    }
  };

  const toggleUserPreference = (prefId: string) => {
    setUserPreferences((prev) =>
      prev.includes(prefId) ? prev.filter((id) => id !== prefId) : [...prev, prefId]
    );
  };

  const toggleAmenity = (amenityId: string) => {
    setAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requirementId) return;

    if (!title.trim()) {
      toast("Please enter a title.");
      return;
    }

    if (rent <= 0) {
      toast("Please enter a valid monthly rent amount.");
      return;
    }

    if (!availableFrom) {
      toast("Please select an available from date.");
      return;
    }

    if (preferenceOptions.length >= 3 && userPreferences.length < 3) {
      toast("Please select at least 3 user preferences.");
      return;
    }

    if (postType === "partner") {
      if (amenityOptions.length >= 3 && amenities.length < 3) {
        toast("Please select at least 3 property amenities.");
        return;
      }

      if (imageItems.length === 0) {
        toast("At least one requirement photo is required for partner requirements.");
        return;
      }
    }

    if (postType === "partner") {
      if (
        floor !== "" &&
        floor !== undefined &&
        totalFloors !== "" &&
        totalFloors !== undefined
      ) {
        if (Number(floor) > Number(totalFloors)) {
          toast("Floor cannot exceed total floors.");
          return;
        }
      }
    }

    if (status === "rejected" && !rejectionReason.trim()) {
      toast("Rejection reason is required when status is set to rejected.");
      return;
    }

    setSubmitting(true);

    const newlyUploadedImageIds: string[] = [];
    const newlyUploadedVideoIds: string[] = [];

    const cleanupNewlyUploadedMedia = async () => {
      if (newlyUploadedImageIds.length > 0) {
        await Promise.all(newlyUploadedImageIds.map((id) => deleteImageApi(id))).catch(() => {});
      }
      if (newlyUploadedVideoIds.length > 0) {
        await Promise.all(newlyUploadedVideoIds.map((id) => deleteVideoApi(id))).catch(() => {});
      }
    };

    try {
      const finalImageIds: string[] = [];
      const finalVideoIds: string[] = [];

      for (const item of imageItems) {
        if (item.file) {
          toast(`Uploading photo "${item.file.name}"…`);
          const res = await uploadImageApi(item.file, "flatmate", "image");
          if (!res.success || !res.data?._id) {
            await cleanupNewlyUploadedMedia();
            setSubmitting(false);
            toast(`Failed to upload photo "${item.file.name}": ${res.message || "Upload error"}`);
            return;
          }
          newlyUploadedImageIds.push(res.data._id);
          finalImageIds.push(res.data._id);
        } else if (item.mediaObject?._id) {
          finalImageIds.push(item.mediaObject._id);
        }
      }

      for (const item of videoItems) {
        if (item.file) {
          toast(`Uploading video "${item.file.name}"…`);
          const res = await uploadVideoApi(item.file, "flatmate", "video");
          if (!res.success || !res.data?._id) {
            await cleanupNewlyUploadedMedia();
            setSubmitting(false);
            toast(`Failed to upload video "${item.file.name}": ${res.message || "Upload error"}`);
            return;
          }
          newlyUploadedVideoIds.push(res.data._id);
          finalVideoIds.push(res.data._id);
        } else if (item.mediaObject?._id) {
          finalVideoIds.push(item.mediaObject._id);
        }
      }

      let locationId = typeof existingLocation === "object" && existingLocation !== null ? existingLocation._id : existingLocation;

      if (isChangingLocation && selectedGooglePlace) {
        toast("Saving new location…");
        const locRes = await savePlaceLocationApi(selectedGooglePlace);
        if (!locRes.success || !locRes.data?._id) {
          await cleanupNewlyUploadedMedia();
          setSubmitting(false);
          toast(locRes.message || "Failed to save selected Google location");
          return;
        }
        locationId = locRes.data._id;
      }

      toast("Updating flatmate requirement…");
      const isProperty = postType === "property";

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        postType,
        location: locationId,
        rent: Number(rent),
        availableFrom,
        genderPreference,
        occupancyPreference,
        brokerage,
        occupationPreference,
        userPreferences,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
      };

      if (isProperty) {
        payload.propertyType = propertyType || "flat";
        payload.postedBy = postedBy || "flatmate";
        payload.area = 0;
        payload.securityDeposit = 0;
        payload.maintenanceCharges = { amount: 0, frequency: "yearly" };
        payload.furnishing = "semi_furnished";
        payload.parking = false;
        payload.amenities = [];
        payload.images = finalImageIds;
        payload.videos = finalVideoIds;
      } else {
        payload.partnerType = partnerType || "flatmate";
        payload.postedBy = postedBy || "flatmate";
        if (floor !== "" || totalFloors !== "" || facing || bedrooms) {
          payload.propertyDetails = {
            ...(floor !== "" && { floor: Number(floor) }),
            ...(totalFloors !== "" && { totalFloors: Number(totalFloors) }),
            ...(facing && { facing }),
            ...(bedrooms && { bedrooms }),
          };
        }
        payload.area = Number(area) || 0;
        payload.securityDeposit = Number(securityDeposit) || 0;
        payload.maintenanceCharges =
          Number(maintenanceAmount) > 0
            ? {
                amount: Number(maintenanceAmount),
                frequency: maintenanceFrequency || "yearly",
              }
            : { amount: 0, frequency: "yearly" };
        payload.furnishing = furnishing;
        payload.parking = parking;
        payload.amenities = amenities;
        payload.images = finalImageIds;
        payload.videos = finalVideoIds;
      }

      const res = await updateFlatmateRequirementApi(requirementId, payload);

      if (!res.success || !res.data) {
        await cleanupNewlyUploadedMedia();
        setSubmitting(false);
        toast(res.message || "Failed to update requirement");
        return;
      }

      setSubmitting(false);
      toast("Flatmate requirement updated successfully!");
      handleClose();
      onSuccess();
    } catch (err: any) {
      await cleanupNewlyUploadedMedia();
      setSubmitting(false);
      toast(err.message || "An unexpected error occurred during update.");
    }
  };

  const getUserDisplayLabel = (u: any): string => {
    if (!u) return "N/A";
    if (typeof u === "object") {
      return u.email || u.mobile || u._id || "N/A";
    }
    return String(u);
  };

  const renderLocationField = () => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Location <span className="text-rose-500">*</span>
      </label>
      {!isChangingLocation ? (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0 mt-0.5">
              <Icon name="home" size={16} />
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-bold text-slate-900 truncate">
                📍 {typeof existingLocation === "object" && existingLocation?.name ? existingLocation.name : "Current Location"}
              </strong>
              <span className="block text-[11px] text-slate-600 truncate">
                {typeof existingLocation === "object" && existingLocation?.formattedAddress
                  ? existingLocation.formattedAddress
                  : "Location ID: " + String(existingLocation)}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
            onClick={() => setIsChangingLocation(true)}
          >
            Change Location
          </button>
        </div>
      ) : selectedGooglePlace ? (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0 mt-0.5">
              <Icon name="home" size={16} />
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-bold text-slate-900 truncate">
                📍 {selectedGooglePlace.name}
              </strong>
              <span className="block text-[11px] text-slate-600 font-medium truncate">
                {selectedGooglePlace.formattedAddress}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
            onClick={() => {
              setSelectedGooglePlace(null);
              setLocationSearchTerm("");
            }}
          >
            Reselect Location
          </button>
        </div>
      ) : (
        <div className="relative" ref={locationDropdownRef}>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
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
            <button
              type="button"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0"
              onClick={() => {
                setIsChangingLocation(false);
                setSelectedGooglePlace(null);
              }}
            >
              Keep Current
            </button>
          </div>

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
      )}
    </div>
  );

  const renderMediaSection = (photosRequired: boolean) => (
    <div className="space-y-4 pt-3 border-t border-slate-100">
      <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
        {postType === "property" ? "4. Media Assets Management" : "5. Media Assets Management"}
      </h4>

      {/* Images */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Requirement Photos ({imageItems.length})
            {photosRequired ? (
              <span className="text-rose-500"> * (Min 1)</span>
            ) : (
              <span className="text-slate-400 font-normal"> (Optional)</span>
            )}
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-all shadow-sm">
            <Icon name="refresh" size={12} />
            <span>+ Select Photos</span>
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
                  alt="Image Preview"
                  className={`w-full h-full object-cover transition-opacity ${
                    item.uploading ? "opacity-40" : "opacity-100"
                  }`}
                />
                {item.uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-[10px] font-bold">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1" />
                    <span>Uploading…</span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors z-10"
                  onClick={() => handleRemoveImageItem(item.id)}
                  title="Remove Image"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400">
            {photosRequired
              ? 'No photos attached. At least 1 photo is required for partner requirements. Click "+ Select Photos" to upload.'
              : 'No photos attached (optional). Click "+ Select Photos" if you wish to upload photos.'}
          </div>
        )}
      </div>

      {/* Videos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Requirement Walkthrough Videos ({videoItems.length})
            <span className="text-slate-400 font-normal"> (Optional)</span>
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white cursor-pointer transition-all shadow-sm">
            <Icon name="refresh" size={12} />
            <span>+ Select Video</span>
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
                      onClick={() => handleRemoveVideoItem(item.id)}
                      title="Remove Video"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>

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
            No videos attached. Click &quot;+ Select Video&quot; to upload walkthrough clips.
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Flatmate Requirement</h3>
            <p className="text-xs text-slate-500">
              {postType === "property"
                ? "Update flat requirement, location, and lifestyle preferences."
                : "Update room details, location, amenities, and media assets."}
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={handleClose}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading requirement details…</div>
        ) : (
          <form id="edit-requirement-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Administrative & Owner Information */}
            <div className="space-y-4 pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Administrative & Owner Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Requirement Owner (User) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Requirement Owner (User)
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium truncate">
                    {getUserDisplayLabel(requirement?.userId)}
                  </div>
                </div>

                {/* Posted By */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Posted By <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium cursor-pointer"
                    value={postedBy}
                    onChange={(e) => setPostedBy(e.target.value as any)}
                  >
                    <option value="flatmate">Flatmate</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Post Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Post Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                    value={postType}
                    onChange={(e) => handlePostTypeChange(e.target.value as "property" | "partner")}
                  >
                    <option value="property">Property (Need Room / Flat)</option>
                    <option value="partner">Partner (Have Room / Flat, Need Flatmate)</option>
                  </select>
                </div>

                {/* Sub-Type (Property Type vs Partner Type) */}
                <div className="space-y-1.5">
                  {postType === "property" ? (
                    <>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Property Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value as any)}
                      >
                        <option value="room">Room</option>
                        <option value="flat">Flat</option>
                        <option value="pg">PG</option>
                        <option value="shared_apartment">Shared Apartment</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Partner Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value as any)}
                      >
                        <option value="flatmate">Flatmate</option>
                        <option value="roommate">Roommate</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Conditional Sections: Property vs Partner */}
            {postType === "property" ? (
              <>
                {/* SECTION 1: REQUIREMENT OVERVIEW */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    1. Requirement Overview
                  </h4>

                  {renderLocationField()}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="e.g. Looking for 2 BHK Flat / Room in Koramangala"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* SECTION 2: RENTAL SPECIFICATIONS */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    2. Rental Specifications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Occupancy Preference <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={occupancyPreference}
                        onChange={(e) => setOccupancyPreference(e.target.value as any)}
                      >
                        <option value="any">Any</option>
                        <option value="single">Single</option>
                        <option value="shared">Shared</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Approx Rent Amount (₹/mo) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="e.g. 15000"
                        value={rent === 0 ? "" : rent}
                        onChange={(e) => setRent(Number(e.target.value))}
                        min={0}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Move-in Date / Available From <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Brokerage Applicable <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={brokerage ? "true" : "false"}
                        onChange={(e) => setBrokerage(e.target.value === "true")}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PREFERENCES */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    3. Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender Preference <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={genderPreference}
                        onChange={(e) => setGenderPreference(e.target.value as any)}
                      >
                        <option value="any">Any</option>
                        <option value="male">Male Only</option>
                        <option value="female">Female Only</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Occupation Preference <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={occupationPreference}
                        onChange={(e) => setOccupationPreference(e.target.value as any)}
                      >
                        <option value="any">Any</option>
                        <option value="student">Student</option>
                        <option value="working_professional">Working Professional</option>
                        <option value="self_employed">Self Employed</option>
                        <option value="business_owner">Business Owner</option>
                        <option value="freelancer">Freelancer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                      rows={3}
                      placeholder="e.g. I am looking for a room with roommate..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {preferenceOptions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        User / Lifestyle Preferences ({userPreferences.length} / 3 min selected) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {preferenceOptions.map((pref) => {
                          const selected = userPreferences.includes(pref._id);
                          return (
                            <button
                              type="button"
                              key={pref._id}
                              onClick={() => toggleUserPreference(pref._id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                selected
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {pref.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: MEDIA ASSETS MANAGEMENT */}
                {renderMediaSection(false)}
              </>
            ) : (
              <>
                {/* SECTION 1: REQUIREMENT OVERVIEW */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    1. Requirement Overview
                  </h4>

                  {renderLocationField()}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="e.g. Looking for a Flatmate in Indiranagar, Bangalore"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* SECTION 2: SPACE DETAILS */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    2. Space Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Area (sq.ft) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="e.g. 1000"
                        value={area === 0 ? "" : area}
                        onChange={(e) => setArea(Number(e.target.value))}
                        min={0}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Furnishing Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value as any)}
                      >
                        <option value="fully_furnished">Fully Furnished</option>
                        <option value="semi_furnished">Semi Furnished</option>
                        <option value="unfurnished">Unfurnished</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Parking Facility <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={parking ? "true" : "false"}
                        onChange={(e) => setParking(e.target.value === "true")}
                      >
                        <option value="false">No Parking</option>
                        <option value="true">Parking Available</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Configuration Details (Optional)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Bedrooms / BHK
                        </label>
                        <select
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                          value={bedrooms || ""}
                          onChange={(e) => setBedrooms(e.target.value)}
                        >
                          <option value="">Select BHK</option>
                          <option value="1_rk">1 RK</option>
                          <option value="1_bhk">1 BHK</option>
                          <option value="2_bhk">2 BHK</option>
                          <option value="3_bhk">3 BHK</option>
                          <option value="4_bhk">4 BHK</option>
                          <option value="5_bhk">5 BHK</option>
                          <option value="5_plus_bhk">5+ BHK</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Facing
                        </label>
                        <select
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                          value={facing || ""}
                          onChange={(e) => setFacing(e.target.value)}
                        >
                          <option value="">Select Facing</option>
                          <option value="east">East</option>
                          <option value="west">West</option>
                          <option value="north">North</option>
                          <option value="south">South</option>
                          <option value="north_east">North-East</option>
                          <option value="north_west">North-West</option>
                          <option value="south_east">South-East</option>
                          <option value="south_west">South-West</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Floor (0=Ground)
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                          placeholder="e.g. 0, 1, 2"
                          value={floor !== undefined ? floor : ""}
                          onChange={(e) =>
                            setFloor(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Total Floors
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                          placeholder="e.g. 4"
                          value={totalFloors !== undefined ? totalFloors : ""}
                          onChange={(e) =>
                            setTotalFloors(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: RENTAL SPECIFICATIONS */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    3. Rental Specifications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Occupancy Preference <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={occupancyPreference}
                        onChange={(e) => setOccupancyPreference(e.target.value as any)}
                      >
                        <option value="any">Any</option>
                        <option value="single">Single</option>
                        <option value="shared">Shared</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rent Amount (₹/mo) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="e.g. 12000"
                        value={rent === 0 ? "" : rent}
                        onChange={(e) => setRent(Number(e.target.value))}
                        min={0}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Security Deposit (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="e.g. 24000"
                        value={securityDeposit === 0 ? "" : securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Brokerage Applicable <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={brokerage ? "true" : "false"}
                        onChange={(e) => setBrokerage(e.target.value === "true")}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Available From <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Maintenance Charges (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="e.g. 1500"
                        value={maintenanceAmount === 0 ? "" : maintenanceAmount}
                        onChange={(e) => setMaintenanceAmount(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Maintenance Frequency
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={maintenanceFrequency}
                        onChange={(e) => setMaintenanceFrequency(e.target.value as any)}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="included">Included in Rent</option>
                        <option value="one_time">One Time</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: PREFERENCES */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    4. Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender Preference <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={genderPreference}
                        onChange={(e) => setGenderPreference(e.target.value as any)}
                      >
                        <option value="any">Any</option>
                        <option value="male">Male Only</option>
                        <option value="female">Female Only</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Occupation Preference <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                        value={occupationPreference}
                        onChange={(e) => setOccupationPreference(e.target.value as any)}
                      >
                        <option value="any">Any</option>
                        <option value="student">Student</option>
                        <option value="working_professional">Working Professional</option>
                        <option value="self_employed">Self Employed</option>
                        <option value="business_owner">Business Owner</option>
                        <option value="freelancer">Freelancer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                      rows={3}
                      placeholder="e.g. I am looking for a flatmate..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {preferenceOptions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        User / Lifestyle Preferences ({userPreferences.length} / 3 min selected) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {preferenceOptions.map((pref) => {
                          const selected = userPreferences.includes(pref._id);
                          return (
                            <button
                              type="button"
                              key={pref._id}
                              onClick={() => toggleUserPreference(pref._id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                selected
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {pref.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {amenityOptions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Property Amenities ({amenities.length} / 3 min selected) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {amenityOptions.map((amenity) => {
                          const selected = amenities.includes(amenity._id);
                          return (
                            <button
                              type="button"
                              key={amenity._id}
                              onClick={() => toggleAmenity(amenity._id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                selected
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {amenity.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 5: MEDIA ASSETS MANAGEMENT */}
                {renderMediaSection(true)}
              </>
            )}

            {/* LISTING MANAGEMENT & MODERATION */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Listing Management & Moderation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Listing Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
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

                {status === "rejected" && (
                  <div>
                    <label className="block text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1.5">
                      Rejection Reason <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-300 rounded-xl text-sm text-slate-900 placeholder:text-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
                      rows={2}
                      placeholder="Specify the reason for rejection…"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-requirement-form"
            className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            disabled={
              submitting ||
              (postType === "partner" &&
                (imageItems.some((img) => img.uploading) || videoItems.some((vid) => vid.uploading)))
            }
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
