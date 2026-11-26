"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/lib/toast";
import {
  fetchUsers,
  fetchPropertyAmenities,
  savePlaceLocationApi,
  uploadImageApi,
  uploadVideoApi,
  deleteImageApi,
  deleteVideoApi,
  createPropertyApi,
  UserItem,
  PropertyAmenityItem,
  PropertyMediaItem,
  AutocompleteSuggestion,
  SavePlacePayload,
  ListingStatus,
} from "@/lib/api";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import Icon from "@/components/icons";

interface PropertyCreateDialogProps {
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

interface PropertyFormData {
  userId: string;
  title: string;
  description: string;
  propertyType:
    | "flat_apartment"
    | "house"
    | "villa";
  floor?: number | "";
  totalFloors?: number | "";
  facing?: string;
  bedrooms?: string;
  brokerage: boolean;
  postedBy: "owner" | "flatmate" | "agent" | "builder";
  location: string;
  rentAmount: number;
  securityDeposit: number;
  maintenanceAmount: number;
  maintenanceFrequency: "monthly" | "yearly" | "included" | "one_time";
  furnishing: "fully_furnished" | "semi_furnished" | "unfurnished";
  availableFrom: string;
  tenantPreference: "anyone" | "bachelors" | "family";
  parkingAvailable: boolean;
  areaValue: number;
  amenities: string[];
  status: ListingStatus;
  rejectionReason?: string;
}

const DEFAULT_FORM_DATA: PropertyFormData = {
  userId: "",
  title: "",
  description: "",
  propertyType: "flat_apartment",
  floor: "",
  totalFloors: "",
  facing: "",
  bedrooms: "",
  brokerage: false,
  postedBy: "owner",
  location: "",
  rentAmount: 0,
  securityDeposit: 0,
  maintenanceAmount: 0,
  maintenanceFrequency: "yearly",
  furnishing: "semi_furnished",
  availableFrom: "",
  tenantPreference: "anyone",
  parkingAvailable: false,
  areaValue: 0,
  amenities: [],
  status: "approved",
  rejectionReason: "",
};

export default function PropertyCreateDialog({
  isOpen,
  onClose,
  onSuccess,
}: PropertyCreateDialogProps) {
  const toast = useToast();

  const [formData, setFormData] = useState<PropertyFormData>(DEFAULT_FORM_DATA);

  // Searchable Owner State
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userOptions, setUserOptions] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  // Frontend Google Location State
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<SavePlacePayload | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Amenities Master Data
  const [amenityOptions, setAmenityOptions] = useState<PropertyAmenityItem[]>([]);

  // Media State (With local preview object URLs)
  const [imageItems, setImageItems] = useState<MediaItemState[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItemState[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // Reset Form State
  const resetForm = useCallback(() => {
    imageItems.forEach((img) => {
      if (img.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    videoItems.forEach((vid) => {
      if (vid.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(vid.previewUrl);
      }
    });

    setFormData(DEFAULT_FORM_DATA);
    setUserSearchTerm("");
    setLocationSearchTerm("");
    setSelectedGooglePlace(null);
    setUserOptions([]);
    setLocationSuggestions([]);
    setLocationSearchError(null);
    setIsOwnerDropdownOpen(false);
    setIsLocationDropdownOpen(false);
    setImageItems([]);
    setVideoItems([]);
  }, [imageItems, videoItems]);

  // Handle Dialog Close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Search Users
  const searchUsers = useCallback(async (query: string) => {
    setLoadingUsers(true);
    const res = await fetchUsers({ limit: 50, search: query });
    if (res.success && res.data) {
      setUserOptions(res.data.users || []);
    }
    setLoadingUsers(false);
  }, []);

  // Fetch Amenities
  useEffect(() => {
    if (!isOpen) return;
    fetchPropertyAmenities({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setAmenityOptions(res.data.items || []);
      }
    });
    searchUsers("");
  }, [isOpen, searchUsers]);

  // Debounced User Search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchUsers(userSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, searchUsers, isOpen]);

  // Frontend Google Places Autocomplete Search
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

  // Click Outside Dropdown Handler
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setIsOwnerDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Select Place Suggestion -> Retrieve Google Place details in browser
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

  // Image Selection Handler (Local state only - no S3 upload yet)
  const handleAddImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMediaItems: MediaItemState[] = Array.from(files).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setImageItems((prev) => [...prev, ...newMediaItems]);
    e.target.value = "";
  };

  const handleRemoveImageItem = (id: string) => {
    setImageItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove && itemToRemove.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Video Selection Handler (Local state only - no S3 upload yet)
  const handleAddVideoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMediaItems: MediaItemState[] = Array.from(files).map((file) => ({
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setVideoItems((prev) => [...prev, ...newMediaItems]);
    e.target.value = "";
  };

  const handleRemoveVideoItem = (id: string) => {
    setVideoItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove && itemToRemove.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Toggle Amenity Selection
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

  // Submit Handler (Uploads media, saves location, and creates property upon submit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedOwnerId = formData.userId;
    if (!resolvedOwnerId && userSearchTerm.trim() && userOptions.length > 0) {
      const match =
        userOptions.find(
          (u) =>
            u.email?.toLowerCase() === userSearchTerm.trim().toLowerCase() ||
            u.mobile === userSearchTerm.trim() ||
            u._id === userSearchTerm.trim()
        ) || userOptions[0];
      if (match) {
        resolvedOwnerId = match._id;
        setFormData((prev) => ({ ...prev, userId: match._id }));
        setUserSearchTerm(match.email || match.mobile || match._id);
      }
    }

    if (!resolvedOwnerId) {
      toast("Please select a valid property owner user.");
      return;
    }

    if (!formData.title.trim()) {
      toast("Please enter a property title.");
      return;
    }

    if (!formData.description.trim()) {
      toast("Please enter a property description.");
      return;
    }

    if (!selectedGooglePlace) {
      toast("Please search and select a location from Google suggestions.");
      return;
    }

    if (formData.rentAmount <= 0) {
      toast("Rent amount must be greater than 0.");
      return;
    }

    if (formData.status === "rejected" && !formData.rejectionReason?.trim()) {
      toast("Rejection reason is required when status is set to rejected.");
      return;
    }

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

    setSubmitting(true);
    const createdImageIds: string[] = [];
    const createdVideoIds: string[] = [];

    // Cleanup helper function if any submission step fails
    const cleanupUploadedMedia = async () => {
      if (createdImageIds.length > 0) {
        await Promise.all(createdImageIds.map((id) => deleteImageApi(id))).catch(() => { });
      }
      if (createdVideoIds.length > 0) {
        await Promise.all(createdVideoIds.map((id) => deleteVideoApi(id))).catch(() => { });
      }
    };

    try {
      // Step 1: Upload Image files to S3 & create Image documents
      if (imageItems.length > 0) {
        toast("Uploading property photos…");
        for (const imgItem of imageItems) {
          if (imgItem.file) {
            const res = await uploadImageApi(imgItem.file, "property", "image");
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

      // Step 2: Upload Video files to S3 & create Video documents
      if (videoItems.length > 0) {
        toast("Uploading walkthrough videos…");
        for (const vidItem of videoItems) {
          if (vidItem.file) {
            const res = await uploadVideoApi(vidItem.file, "property", "video");
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

      // Step 3: Save selected Google Place Location
      toast("Saving location…");
      const locRes = await savePlaceLocationApi(selectedGooglePlace);
      if (!locRes.success || !locRes.data?._id) {
        await cleanupUploadedMedia();
        setSubmitting(false);
        toast(locRes.message || "Failed to save selected Google location");
        return;
      }

      const resolvedLocationId = locRes.data._id;

      // Step 4: Create Property Listing with media and location IDs attached
      toast("Creating property listing…");
      const payload: any = {
        userId: resolvedOwnerId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        propertyType: formData.propertyType,
        propertyDetails:
          formData.floor !== "" ||
            formData.totalFloors !== "" ||
            formData.facing ||
            formData.bedrooms
            ? {
              ...(formData.floor !== "" && { floor: Number(formData.floor) }),
              ...(formData.totalFloors !== "" && {
                totalFloors: Number(formData.totalFloors),
              }),
              ...(formData.facing && { facing: formData.facing }),
              ...(formData.bedrooms && { bedrooms: formData.bedrooms }),
            }
            : undefined,
        brokerage: formData.brokerage,
        postedBy: formData.postedBy,
        location: resolvedLocationId,
        rent: Number(formData.rentAmount),
        securityDeposit: Number(formData.securityDeposit),
        maintenanceCharges: {
          amount: Number(formData.maintenanceAmount),
          frequency: formData.maintenanceFrequency,
        },
        furnishing: formData.furnishing,
        availableFrom: formData.availableFrom || new Date().toISOString().split("T")[0],
        tenantPreference: formData.tenantPreference,
        parking: formData.parkingAvailable,
        area: Number(formData.areaValue),
        amenities: formData.amenities,
        images: createdImageIds,
        videos: createdVideoIds,
        status: formData.status,
        rejectionReason: formData.status === "rejected" ? formData.rejectionReason : undefined,
      };

      const res = await createPropertyApi(payload);

      if (!res.success) {
        await cleanupUploadedMedia();
        setSubmitting(false);
        toast(res.message || "Failed to create property listing");
        return;
      }

      setSubmitting(false);
      toast("Property listing created successfully!");
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
            <h3 className="text-lg font-bold text-slate-900">Add New Property Listing</h3>
            <p className="text-xs text-slate-500">Fill in details, resolve location, and upload media assets.</p>
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
        <form id="create-property-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Administrative & Owner Information */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Administrative & Owner Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Property Owner (User) <span className="text-rose-500">*</span>
                </label>
                <div className="relative" ref={ownerDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="Search user by email, mobile, or ID…"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setIsOwnerDropdownOpen(true);
                        if (!e.target.value.trim()) {
                          setFormData((prev) => ({ ...prev, userId: "" }));
                        }
                      }}
                      onFocus={() => setIsOwnerDropdownOpen(true)}
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
                          setIsOwnerDropdownOpen(false);
                        }}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>

                  {/* Owner Dropdown */}
                  {isOwnerDropdownOpen && (
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
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 border-b border-slate-100 last:border-0 ${isSelected ? "bg-amber-100 font-semibold" : ""
                                }`}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, userId: u._id }));
                                setUserSearchTerm(displayLabel);
                                setIsOwnerDropdownOpen(false);
                              }}
                            >
                              <div>
                                <div className="text-slate-900 font-medium">{displayLabel}</div>
                                <div className="text-[10px] text-slate-400">ID: {u._id.slice(-6)} • {u.userType || u.role}</div>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.postedBy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postedBy: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="owner">Owner</option>
                  <option value="flatmate">Flatmate</option>
                  <option value="agent">Agent / Broker</option>
                  <option value="builder">Builder</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 1: Basic Overview */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              1. Basic Overview
            </h4>

            {/* Google Maps Location */}
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Property Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="e.g. Spacious 2BHK Apartment in Koramangala"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 2: Property Details */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              2. Property Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Property Type <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.propertyType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      propertyType: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="flat_apartment">Flat / Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Area (sqft)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  placeholder="e.g. 1200"
                  value={formData.areaValue || ""}
                  onChange={(e) => setFormData({ ...formData, areaValue: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Furnishing <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.furnishing}
                  onChange={(e) => setFormData({ ...formData, furnishing: e.target.value as any })}
                >
                  <option value="fully_furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Parking Facility
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.parkingAvailable ? "yes" : "no"}
                  onChange={(e) => setFormData({ ...formData, parkingAvailable: e.target.value === "yes" })}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Property Structural & Configuration Details */}
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
                      setFormData({ ...formData, bedrooms: e.target.value })
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
                      setFormData({ ...formData, facing: e.target.value })
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
                      setFormData({
                        ...formData,
                        floor: e.target.value === "" ? "" : Number(e.target.value),
                      })
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
                      setFormData({
                        ...formData,
                        totalFloors: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Rental Specifications */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              3. Rental Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Rent Amount (₹/mo) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Security Deposit (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brokerage Applicable
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.brokerage ? "yes" : "no"}
                  onChange={(e) => setFormData({ ...formData, brokerage: e.target.value === "yes" })}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Available From <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Maintenance Charges (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.maintenanceAmount}
                  onChange={(e) => setFormData({ ...formData, maintenanceAmount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Maintenance Frequency
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.maintenanceFrequency}
                  onChange={(e) => setFormData({ ...formData, maintenanceFrequency: e.target.value as any })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="included">Included in Rent</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Preferences */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              4. Preferences
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tenant Preference
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                value={formData.tenantPreference}
                onChange={(e) => setFormData({ ...formData, tenantPreference: e.target.value as any })}
              >
                <option value="anyone">Anyone</option>
                <option value="bachelors">Bachelor's</option>
                <option value="family">Family</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                rows={3}
                placeholder="Provide property highlights, rules, nearby landmarks…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 5: Amenities */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              5. Amenities
            </h4>

            {amenityOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Property Amenities ({formData.amenities.length} Selected)
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {amenityOptions.map((am) => {
                    const isSelected = formData.amenities.includes(am._id);
                    return (
                      <button
                        key={am._id}
                        type="button"
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${isSelected
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                          }`}
                        onClick={() => toggleAmenity(am._id)}
                      >
                        {am.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Media Assets Management */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              6. Media Assets Management
            </h4>
            {/* Images Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Property Photos ({imageItems.length})
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
                  No property photos attached yet. Click &quot;+ Select Photos&quot; to upload high-res images.
                </div>
              )}
            </div>

            {/* Videos Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Property Walkthrough Videos ({videoItems.length})
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
                  No property videos attached yet. Click &quot;+ Select Video&quot; to upload walkthrough clips.
                </div>
              )}
            </div>
          </div>

          {/* Section 7: Listing Management & Moderation */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              7. Listing Management & Moderation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
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
                  className="w-full px-3.5 py-2 bg-rose-50 border border-rose-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                  rows={2}
                  placeholder="Provide explicit reasons for rejecting this listing…"
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
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
            className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-property-form"
            className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            disabled={submitting || imageItems.some((img) => img.uploading) || videoItems.some((vid) => vid.uploading)}
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Property…</span>
              </>
            ) : (
              <span>Create Property</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
