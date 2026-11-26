"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/lib/toast";
import {
  fetchUsers,
  fetchUserPreferences,
  fetchPropertyAmenities,
  savePlaceLocationApi,
  uploadImageApi,
  uploadVideoApi,
  deleteImageApi,
  deleteVideoApi,
  createFlatmateRequirementApi,
  UserItem,
  UserPreferenceItem,
  PropertyAmenityItem,
  PropertyMediaItem,
  AutocompleteSuggestion,
  SavePlacePayload,
  ListingStatus,
} from "@/lib/api";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import Icon from "@/components/icons";

interface FlatmateRequirementCreateDialogProps {
  isOpen: boolean;
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

interface FormDataState {
  userId: string;
  title: string;
  description: string;
  postType: "property" | "partner";
  propertyType: "room" | "flat" | "pg" | "shared_apartment";
  partnerType: "roommate" | "flatmate";
  postedBy: "owner" | "flatmate";
  floor?: number | "";
  totalFloors?: number | "";
  facing?: string;
  bedrooms?: string;
  area: number;
  rent: number;
  securityDeposit: number;
  maintenanceCharges: {
    amount: number;
    frequency: "monthly" | "yearly" | "included" | "one_time";
  };
  furnishing: "fully_furnished" | "semi_furnished" | "unfurnished";
  parking: boolean;
  brokerage: boolean;
  availableFrom: string;
  genderPreference: "male" | "female" | "other" | "any";
  occupancyPreference: "any" | "single" | "shared";
  occupationPreference:
    | "student"
    | "working_professional"
    | "self_employed"
    | "business_owner"
    | "freelancer"
    | "other"
    | "any";
  userPreferences: string[];
  amenities: string[];
  status: ListingStatus;
  rejectionReason?: string;
}

const DEFAULT_FORM: FormDataState = {
  userId: "",
  title: "",
  description: "",
  postType: "property",
  propertyType: "flat",
  partnerType: "flatmate",
  postedBy: "flatmate",
  floor: "",
  totalFloors: "",
  facing: "",
  bedrooms: "",
  area: 0,
  rent: 0,
  securityDeposit: 0,
  maintenanceCharges: {
    amount: 0,
    frequency: "yearly",
  },
  furnishing: "semi_furnished",
  parking: false,
  brokerage: false,
  availableFrom: "",
  genderPreference: "any",
  occupancyPreference: "any",
  occupationPreference: "any",
  userPreferences: [],
  amenities: [],
  status: "approved",
  rejectionReason: "",
};

export default function FlatmateRequirementCreateDialog({
  isOpen,
  onClose,
  onSuccess,
}: FlatmateRequirementCreateDialogProps) {
  const toast = useToast();

  const [formData, setFormData] = useState<FormDataState>(DEFAULT_FORM);

  // User Searchable Picker
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userOptions, setUserOptions] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Location Google Places Autocomplete
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<SavePlacePayload | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Master Options
  const [preferenceOptions, setPreferenceOptions] = useState<UserPreferenceItem[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<PropertyAmenityItem[]>([]);

  // Media Items
  const [imageItems, setImageItems] = useState<MediaItemState[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItemState[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    imageItems.forEach((img) => {
      if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
    });
    videoItems.forEach((vid) => {
      if (vid.previewUrl.startsWith("blob:")) URL.revokeObjectURL(vid.previewUrl);
    });

    setFormData(DEFAULT_FORM);
    setUserSearchTerm("");
    setLocationSearchTerm("");
    setSelectedGooglePlace(null);
    setUserOptions([]);
    setLocationSuggestions([]);
    setLocationSearchError(null);
    setIsUserDropdownOpen(false);
    setIsLocationDropdownOpen(false);
    setImageItems([]);
    setVideoItems([]);
  }, [imageItems, videoItems]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePostTypeChange = (newPostType: "property" | "partner") => {
    if (newPostType === formData.postType) return;

    if (newPostType === "property") {
      imageItems.forEach((img) => {
        if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
      });
      videoItems.forEach((vid) => {
        if (vid.previewUrl.startsWith("blob:")) URL.revokeObjectURL(vid.previewUrl);
      });
      setImageItems([]);
      setVideoItems([]);

      setFormData((prev) => ({
        ...prev,
        postType: "property",
        propertyType: prev.propertyType || "flat",
        area: 0,
        securityDeposit: 0,
        furnishing: "semi_furnished",
        parking: false,
        maintenanceCharges: {
          amount: 0,
          frequency: "yearly",
        },
        amenities: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        postType: "partner",
        partnerType: prev.partnerType || "flatmate",
      }));
    }
  };

  const searchUsers = useCallback(async (query: string) => {
    setLoadingUsers(true);
    const res = await fetchUsers({ limit: 50, search: query });
    if (res.success && res.data) {
      setUserOptions(res.data.users || []);
    }
    setLoadingUsers(false);
  }, []);

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
    searchUsers("");
  }, [isOpen, searchUsers]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchUsers(userSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, searchUsers, isOpen]);

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
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
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

  const toggleUserPreference = (prefId: string) => {
    setFormData((prev) => {
      const exists = prev.userPreferences.includes(prefId);
      return {
        ...prev,
        userPreferences: exists
          ? prev.userPreferences.filter((id) => id !== prefId)
          : [...prev.userPreferences, prefId],
      };
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenityId);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((id) => id !== amenityId)
          : [...prev.amenities, amenityId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedUserId = formData.userId;
    if (!resolvedUserId && userSearchTerm.trim() && userOptions.length > 0) {
      const match =
        userOptions.find(
          (u) =>
            u.email?.toLowerCase() === userSearchTerm.trim().toLowerCase() ||
            u.mobile === userSearchTerm.trim() ||
            u._id === userSearchTerm.trim()
        ) || userOptions[0];
      if (match) {
        resolvedUserId = match._id;
      }
    }

    if (!resolvedUserId) {
      toast("Please select a valid user for this requirement.");
      return;
    }

    if (!selectedGooglePlace) {
      toast("Please search and select a location from Google suggestions.");
      return;
    }

    if (!formData.title.trim()) {
      toast("Please enter a title.");
      return;
    }

    if (formData.rent <= 0) {
      toast("Please enter a valid monthly rent amount.");
      return;
    }

    if (!formData.availableFrom) {
      toast("Please select an available from date.");
      return;
    }

    if (preferenceOptions.length >= 3 && formData.userPreferences.length < 3) {
      toast("Please select at least 3 user preferences.");
      return;
    }

    if (formData.postType === "partner") {
      if (amenityOptions.length >= 3 && formData.amenities.length < 3) {
        toast("Please select at least 3 property amenities.");
        return;
      }

      if (imageItems.length === 0) {
        toast("At least one requirement photo is required for partner requirements.");
        return;
      }
    }

    if (formData.postType === "partner") {
      if (
        formData.floor !== "" &&
        formData.floor !== undefined &&
        formData.totalFloors !== "" &&
        formData.totalFloors !== undefined
      ) {
        if (Number(formData.floor) > Number(formData.totalFloors)) {
          toast("Floor cannot exceed total floors.");
          return;
        }
      }
    }

    if (formData.status === "rejected" && !formData.rejectionReason?.trim()) {
      toast("Rejection reason is required when status is set to rejected.");
      return;
    }

    setSubmitting(true);
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
      if (imageItems.length > 0) {
        toast("Uploading requirement photos…");
        for (const imgItem of imageItems) {
          if (imgItem.file) {
            const res = await uploadImageApi(imgItem.file, "flatmate", "image");
            if (!res.success || !res.data?._id) {
              await cleanupUploadedMedia();
              setSubmitting(false);
              toast(`Failed to upload image "${imgItem.file.name}": ${res.message || "Upload error"}`);
              return;
            }
            createdImageIds.push(res.data._id);
          } else if (imgItem.mediaObject?._id) {
            createdImageIds.push(imgItem.mediaObject._id);
          }
        }
      }

      if (videoItems.length > 0) {
        toast("Uploading walkthrough videos…");
        for (const vidItem of videoItems) {
          if (vidItem.file) {
            const res = await uploadVideoApi(vidItem.file, "flatmate", "video");
            if (!res.success || !res.data?._id) {
              await cleanupUploadedMedia();
              setSubmitting(false);
              toast(`Failed to upload video "${vidItem.file.name}": ${res.message || "Upload error"}`);
              return;
            }
            createdVideoIds.push(res.data._id);
          } else if (vidItem.mediaObject?._id) {
            createdVideoIds.push(vidItem.mediaObject._id);
          }
        }
      }

      toast("Saving location…");
      const locRes = await savePlaceLocationApi(selectedGooglePlace);
      if (!locRes.success || !locRes.data?._id) {
        await cleanupUploadedMedia();
        setSubmitting(false);
        toast(locRes.message || "Failed to save selected Google location");
        return;
      }

      const locationId = locRes.data._id;

      toast("Creating flatmate requirement…");
      const isProperty = formData.postType === "property";

      const payload: any = {
        userId: resolvedUserId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        postType: formData.postType,
        location: locationId,
        rent: Number(formData.rent),
        availableFrom: formData.availableFrom || new Date().toISOString().split("T")[0],
        genderPreference: formData.genderPreference,
        occupancyPreference: formData.occupancyPreference,
        brokerage: formData.brokerage,
        occupationPreference: formData.occupationPreference,
        userPreferences: formData.userPreferences,
        status: formData.status,
        rejectionReason: formData.status === "rejected" ? formData.rejectionReason : undefined,
      };

      if (isProperty) {
        payload.propertyType = formData.propertyType || "flat";
        payload.postedBy = formData.postedBy || "flatmate";
        payload.area = 0;
        payload.securityDeposit = 0;
        payload.maintenanceCharges = { amount: 0, frequency: "yearly" };
        payload.furnishing = "semi_furnished";
        payload.parking = false;
        payload.amenities = [];
        payload.images = createdImageIds;
        payload.videos = createdVideoIds;
      } else {
        payload.partnerType = formData.partnerType || "flatmate";
        payload.postedBy = formData.postedBy || "flatmate";
        if (
          formData.floor !== "" ||
          formData.totalFloors !== "" ||
          formData.facing ||
          formData.bedrooms
        ) {
          payload.propertyDetails = {
            ...(formData.floor !== "" && { floor: Number(formData.floor) }),
            ...(formData.totalFloors !== "" && {
              totalFloors: Number(formData.totalFloors),
            }),
            ...(formData.facing && { facing: formData.facing }),
            ...(formData.bedrooms && { bedrooms: formData.bedrooms }),
          };
        }
        payload.area = Number(formData.area) || 0;
        payload.securityDeposit = Number(formData.securityDeposit) || 0;
        payload.maintenanceCharges =
          Number(formData.maintenanceCharges.amount) > 0
            ? {
                amount: Number(formData.maintenanceCharges.amount),
                frequency: formData.maintenanceCharges.frequency || "yearly",
              }
            : { amount: 0, frequency: "yearly" };
        payload.furnishing = formData.furnishing;
        payload.parking = formData.parking;
        payload.amenities = formData.amenities;
        payload.images = createdImageIds;
        payload.videos = createdVideoIds;
      }

      const res = await createFlatmateRequirementApi(payload);

      if (!res.success || !res.data) {
        await cleanupUploadedMedia();
        setSubmitting(false);
        toast(res.message || "Failed to create Flatmate Requirement");
        return;
      }

      setSubmitting(false);
      toast("Flatmate Requirement created successfully!");
      handleClose();
      onSuccess();
    } catch (err: any) {
      await cleanupUploadedMedia();
      setSubmitting(false);
      toast(err.message || "An unexpected error occurred during creation.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Flatmate Requirement</h3>
            <p className="text-xs text-slate-500">
              {formData.postType === "property"
                ? "Fill in flat requirement, select location, and set lifestyle preferences."
                : "Fill in room details, select location, amenities, and upload media assets."}
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

        {/* Scrollable Form Content */}
        <form id="create-requirement-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Administrative & Owner Information */}
          <div className="space-y-4 pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Administrative & Owner Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requirement Owner (User) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Requirement Owner (User) <span className="text-rose-500">*</span>
                </label>
                <div className="relative" ref={userDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="Search user by email, mobile, or ID…"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setIsUserDropdownOpen(true);
                        if (!e.target.value.trim()) {
                          setFormData((prev) => ({ ...prev, userId: "" }));
                        }
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                    />
                    <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                      <Icon name="search" size={14} />
                    </div>
                    {userSearchTerm && (
                      <button
                        type="button"
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => {
                          setUserSearchTerm("");
                          setFormData((prev) => ({ ...prev, userId: "" }));
                          setIsUserDropdownOpen(false);
                        }}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>

                  {/* User Options Dropdown */}
                  {isUserDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1100] max-h-52 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="p-3 text-xs text-slate-500 text-center">Searching users…</div>
                      ) : userOptions.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">No matching users found</div>
                      ) : (
                        userOptions.map((u) => {
                          const isSelected = formData.userId === u._id;
                          const displayLabel = u.email || u.mobile || u._id;
                          return (
                            <button
                              key={u._id}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 border-b border-slate-100 last:border-0 ${
                                isSelected ? "bg-amber-100 font-semibold" : ""
                              }`}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, userId: u._id }));
                                setUserSearchTerm(displayLabel);
                                setIsUserDropdownOpen(false);
                              }}
                            >
                              <div>
                                <div className="text-slate-900 font-medium">{displayLabel}</div>
                                <div className="text-[10px] text-slate-500">ID: {u._id}</div>
                              </div>
                              {isSelected && <span className="text-amber-600 font-bold text-xs">Selected</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Posted By */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Posted By <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                  value={formData.postedBy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postedBy: e.target.value as any }))}
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
                  value={formData.postType}
                  onChange={(e) =>
                    handlePostTypeChange(e.target.value as "property" | "partner")
                  }
                >
                  <option value="property">Property (Need Room / Flat)</option>
                  <option value="partner">Partner (Have Room / Flat, Need Flatmate)</option>
                </select>
              </div>

              {/* Sub-Type (Property Type vs Partner Type) */}
              <div className="space-y-1.5">
                {formData.postType === "property" ? (
                  <>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Property Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.propertyType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, propertyType: e.target.value as any }))}
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
                      value={formData.partnerType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, partnerType: e.target.value as any }))}
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
          {formData.postType === "property" ? (
            <>
              {/* SECTION 1: REQUIREMENT OVERVIEW */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  1. Requirement Overview
                </h4>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Location <span className="text-rose-500">*</span>
                  </label>

                  {selectedGooglePlace ? (
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
                        Change Location
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    placeholder="e.g. Looking for 2 BHK Flat / Room in Koramangala"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                      Occupancy Preference
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
                      value={formData.occupancyPreference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, occupancyPreference: e.target.value as any }))}
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
                      value={formData.rent === 0 ? "" : formData.rent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rent: Number(e.target.value) }))}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Move-in Date / Available From <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData((prev) => ({ ...prev, availableFrom: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Brokerage Applicable
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.brokerage ? "true" : "false"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, brokerage: e.target.value === "true" }))}
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
                      Gender Preference
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
                      value={formData.genderPreference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, genderPreference: e.target.value as any }))}
                    >
                      <option value="any">Any</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Occupation Preference
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
                      value={formData.occupationPreference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, occupationPreference: e.target.value as any }))}
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
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {preferenceOptions.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      User / Lifestyle Preferences ({formData.userPreferences.length} / 3 min selected) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {preferenceOptions.map((pref) => {
                        const selected = formData.userPreferences.includes(pref._id);
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

              {/* SECTION 4: MEDIA ASSETS MANAGEMENT (Optional) */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  4. Media Assets Management
                </h4>

                {/* Images */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Requirement Photos ({imageItems.length})
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
                          {item.error && (
                            <div className="absolute inset-0 flex items-center justify-center p-1 bg-rose-900/80 text-white text-[9px] text-center font-semibold">
                              Upload Failed
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
                      No requirement photos attached yet. Click &quot;+ Select Photos&quot; to upload high-res images (optional).
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Requirement Walkthrough Videos ({videoItems.length})
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
                      No requirement videos attached yet. Click &quot;+ Select Video&quot; to upload walkthrough clips.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* SECTION 1: REQUIREMENT OVERVIEW */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  1. Requirement Overview
                </h4>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Location <span className="text-rose-500">*</span>
                  </label>

                  {selectedGooglePlace ? (
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
                        Change Location
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    placeholder="e.g. Looking for a Flatmate in Indiranagar, Bangalore"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                      Area (sq.ft)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="e.g. 1000"
                      value={formData.area === 0 ? "" : formData.area}
                      onChange={(e) => setFormData((prev) => ({ ...prev, area: Number(e.target.value) }))}
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Furnishing Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.furnishing}
                      onChange={(e) => setFormData((prev) => ({ ...prev, furnishing: e.target.value as any }))}
                    >
                      <option value="fully_furnished">Fully Furnished</option>
                      <option value="semi_furnished">Semi Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Parking Facility
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.parking ? "true" : "false"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, parking: e.target.value === "true" }))}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Configuration Details Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Configuration Details (Optional)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Bedrooms / BHK
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                        value={formData.bedrooms || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bedrooms: e.target.value }))
                        }
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
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                        value={formData.facing || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, facing: e.target.value }))
                        }
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
                        value={formData.floor !== undefined ? formData.floor : ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            floor: e.target.value === "" ? "" : Number(e.target.value),
                          }))
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
                        value={formData.totalFloors !== undefined ? formData.totalFloors : ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            totalFloors: e.target.value === "" ? "" : Number(e.target.value),
                          }))
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Occupancy Preference
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.occupancyPreference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, occupancyPreference: e.target.value as any }))}
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                      placeholder="e.g. 12000"
                      value={formData.rent === 0 ? "" : formData.rent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rent: Number(e.target.value) }))}
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                      placeholder="e.g. 24000"
                      value={formData.securityDeposit === 0 ? "" : formData.securityDeposit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, securityDeposit: Number(e.target.value) }))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Brokerage Applicable
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.brokerage ? "true" : "false"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, brokerage: e.target.value === "true" }))}
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData((prev) => ({ ...prev, availableFrom: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Maintenance Charges (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                      placeholder="e.g. 1500"
                      value={formData.maintenanceCharges.amount === 0 ? "" : formData.maintenanceCharges.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maintenanceCharges: {
                            ...prev.maintenanceCharges,
                            amount: Number(e.target.value),
                          },
                        }))
                      }
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Maintenance Frequency
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.maintenanceCharges.frequency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maintenanceCharges: {
                            ...prev.maintenanceCharges,
                            frequency: e.target.value as any,
                          },
                        }))
                      }
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
                      Gender Preference
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.genderPreference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, genderPreference: e.target.value as any }))}
                    >
                      <option value="any">Any</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Occupation Preference
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer font-medium"
                      value={formData.occupationPreference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, occupationPreference: e.target.value as any }))}
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none font-medium"
                    rows={3}
                    placeholder="e.g. I am looking for a flatmate..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {preferenceOptions.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      User / Lifestyle Preferences ({formData.userPreferences.length} / 3 min selected) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {preferenceOptions.map((pref) => {
                        const selected = formData.userPreferences.includes(pref._id);
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
                      Property Amenities ({formData.amenities.length} / 3 min selected) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {amenityOptions.map((amenity) => {
                        const selected = formData.amenities.includes(amenity._id);
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
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  5. Media Assets Management
                </h4>

                {/* Images */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Requirement Photos ({imageItems.length}) <span className="text-rose-500">*</span>
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
                          {item.error && (
                            <div className="absolute inset-0 flex items-center justify-center p-1 bg-rose-900/80 text-white text-[9px] text-center font-semibold">
                              Upload Failed
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
                      No requirement photos attached yet. At least 1 photo is required for partner requirements. Click &quot;+ Select Photos&quot; to upload high-res images.
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Requirement Walkthrough Videos ({videoItems.length})
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
                      No requirement videos attached yet. Click &quot;+ Select Video&quot; to upload walkthrough clips.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Listing Management & Moderation */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Listing Management & Moderation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
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

            {formData.status === "rejected" && (
              <div>
                <label className="block text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="w-full px-3.5 py-2 bg-rose-50 border border-rose-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                  rows={2}
                  placeholder="Provide explicit reasons for rejecting this requirement…"
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                  required
                />
              </div>
            )}
          </div>
        </form>

        {/* Sticky Footer */}
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
            form="create-requirement-form"
            className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            disabled={
              submitting ||
              (formData.postType === "partner" &&
                (imageItems.some((img) => img.uploading) || videoItems.some((vid) => vid.uploading)))
            }
          >
            {submitting ? "Creating…" : "Create Requirement"}
          </button>
        </div>
      </div>
    </div>
  );
}
