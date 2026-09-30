"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/lib/toast";
import {
  fetchPropertyById,
  fetchUsers,
  fetchPropertyAmenities,
  savePlaceLocationApi,
  uploadImageApi,
  uploadVideoApi,
  deleteImageApi,
  deleteVideoApi,
  updatePropertyApi,
  PropertyItem,
  UserItem,
  LocationItem,
  PropertyAmenityItem,
  PropertyMediaItem,
  AutocompleteSuggestion,
  SavePlacePayload,
  ListingStatus,
} from "@/lib/api";
import { searchFrontendGooglePlaces, getFrontendPlaceDetails } from "@/lib/googlePlaces";
import Icon from "@/components/icons";

interface PropertyEditDialogProps {
  isOpen: boolean;
  propertyId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface MediaItemState {
  id: string;
  isExisting: boolean;
  file?: File;
  previewUrl: string;
  mediaObject?: PropertyMediaItem;
  uploading: boolean;
  error?: string;
}

interface PropertyFormData {
  ownerId: string;
  title: string;
  description: string;
  listingType: "flat" | "room" | "pg" | "shared_apartment" | "entire_property";
  location: string;
  rentAmount: number;
  securityDeposit: number;
  maintenanceAmount: number;
  maintenanceFrequency: "monthly" | "yearly" | "included" | "one_time";
  furnishing: "fully_furnished" | "semi_furnished" | "unfurnished";
  availableFrom: string;
  availableUntil: string;
  genderPreference: "male" | "female" | "other" | "any";
  occupationPreference: "student" | "working_professional" | "any";
  parkingAvailable: boolean;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  floors: number;
  areaValue: number;
  areaUnit: "sqft" | "sqm";
  houseRules: string;
  amenities: string[];
  status: ListingStatus;
  rejectionReason?: string;
  expiresAt?: string;
}

export default function PropertyEditDialog({
  isOpen,
  propertyId,
  onClose,
  onSuccess,
}: PropertyEditDialogProps) {
  const toast = useToast();

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    ownerId: "",
    title: "",
    description: "",
    listingType: "flat",
    location: "",
    rentAmount: 0,
    securityDeposit: 0,
    maintenanceAmount: 0,
    maintenanceFrequency: "monthly",
    furnishing: "semi_furnished",
    availableFrom: "",
    availableUntil: "",
    genderPreference: "any",
    occupationPreference: "any",
    parkingAvailable: false,
    bedrooms: 0,
    bathrooms: 0,
    balconies: 0,
    floors: 0,
    areaValue: 0,
    areaUnit: "sqft",
    houseRules: "",
    amenities: [],
    status: "pending",
    rejectionReason: "",
    expiresAt: "",
  });

  // Searchable Owner State
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userOptions, setUserOptions] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  // Frontend Google Location State
  const [existingLocation, setExistingLocation] = useState<LocationItem | null>(null);
  const [newSelectedGooglePlace, setNewSelectedGooglePlace] = useState<SavePlacePayload | null>(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Amenities Master Data
  const [amenityOptions, setAmenityOptions] = useState<PropertyAmenityItem[]>([]);

  // Media State
  const [imageItems, setImageItems] = useState<MediaItemState[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItemState[]>([]);

  // Explicit Deletion Trackers for existing media
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedVideoIds, setRemovedVideoIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // Reset & Clean up
  const handleClose = useCallback(() => {
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

    setImageItems([]);
    setVideoItems([]);
    setRemovedImageIds([]);
    setRemovedVideoIds([]);
    setUserSearchTerm("");
    setLocationSearchTerm("");
    setExistingLocation(null);
    setNewSelectedGooglePlace(null);
    setIsChangingLocation(false);
    setIsOwnerDropdownOpen(false);
    setIsLocationDropdownOpen(false);
    setLocationSearchError(null);
    onClose();
  }, [imageItems, videoItems, onClose]);

  // Search Users
  const searchUsers = useCallback(async (query: string) => {
    setLoadingUsers(true);
    const res = await fetchUsers({ limit: 50, search: query });
    if (res.success && res.data) {
      setUserOptions(res.data.users || []);
    }
    setLoadingUsers(false);
  }, []);

  // Populate Property Data
  const loadPropertyDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    const [propRes, amensRes] = await Promise.all([
      fetchPropertyById(id),
      fetchPropertyAmenities({ limit: 100 }),
    ]);

    if (amensRes.success && amensRes.data) {
      setAmenityOptions(amensRes.data.items || []);
    }

    if (propRes.success && propRes.data) {
      const item: PropertyItem = propRes.data;

      const ownerObj = typeof item.ownerId === "object" ? item.ownerId : null;
      const ownerIdStr = ownerObj?._id || (typeof item.ownerId === "string" ? item.ownerId : "");
      const ownerLabel = ownerObj?.email || ownerObj?.mobile || ownerIdStr || "";

      const locObj = typeof item.location === "object" ? item.location : null;
      const locIdStr = locObj?._id || (typeof item.location === "string" ? item.location : "");

      setUserSearchTerm(ownerLabel);
      setExistingLocation(
        locObj && locObj._id
          ? ({
              _id: locObj._id,
              name: locObj.name || "Location",
              formattedAddress: locObj.formattedAddress || "",
              city: locObj.city,
              state: locObj.state,
              country: locObj.country,
            } as LocationItem)
          : null
      );
      setNewSelectedGooglePlace(null);
      setIsChangingLocation(false);
      setLocationSearchTerm("");

      setFormData({
        ownerId: ownerIdStr,
        title: item.title || "",
        description: item.description || "",
        listingType: item.listingType || "flat",
        location: locIdStr,
        rentAmount: typeof item.rent === "number" ? item.rent : ((item.rent as any)?.amount || 0),
        securityDeposit: item.securityDeposit || 0,
        maintenanceAmount: item.maintenanceCharges?.amount || 0,
        maintenanceFrequency: (item.maintenanceCharges?.frequency as any) || "monthly",
        furnishing: item.furnishing || "semi_furnished",
        availableFrom: item.availableFrom
          ? new Date(item.availableFrom).toISOString().split("T")[0]
          : "",
        availableUntil: item.availableUntil
          ? new Date(item.availableUntil).toISOString().split("T")[0]
          : "",
        genderPreference: item.genderPreference || "any",
        occupationPreference: item.occupationPreference || "any",
        parkingAvailable: Boolean(item.parking?.available),
        bedrooms: item.bedrooms ?? 0,
        bathrooms: item.bathrooms ?? 0,
        balconies: item.balconies ?? 0,
        floors: item.floors ?? 0,
        areaValue: item.area?.value || 0,
        areaUnit: item.area?.unit || "sqft",
        houseRules: Array.isArray((item as any).houseRules) ? (item as any).houseRules.join(", ") : "",
        amenities: Array.isArray(item.amenities)
          ? item.amenities.map((a: any) => (typeof a === "object" ? a._id || "" : a)).filter(Boolean)
          : [],
        status: item.status || "pending",
        rejectionReason: item.rejectionReason || "",
        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : "",
      });

      // Populate existing images
      if (Array.isArray(item.images)) {
        const existingImgs: MediaItemState[] = item.images.map((img: any) => ({
          id: img._id,
          isExisting: true,
          previewUrl: img.url,
          mediaObject: img,
          uploading: false,
        }));
        setImageItems(existingImgs);
      }

      // Populate existing videos
      if (Array.isArray(item.videos)) {
        const existingVids: MediaItemState[] = item.videos.map((vid: any) => ({
          id: vid._id,
          isExisting: true,
          previewUrl: vid.url,
          mediaObject: vid,
          uploading: false,
        }));
        setVideoItems(existingVids);
      }
    }
    setLoadingDetails(false);
  }, []);

  // Fetch when dialog opens
  useEffect(() => {
    if (isOpen && propertyId) {
      loadPropertyDetails(propertyId);
      searchUsers("");
    }
  }, [isOpen, propertyId, loadPropertyDetails, searchUsers]);

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

  // Select Google Place Suggestion -> Retrieve Google Place details in browser
  const handleSelectPlaceSuggestion = async (suggestion: AutocompleteSuggestion) => {
    try {
      setLoadingLocationSuggestions(true);
      setIsLocationDropdownOpen(false);
      const placeDetails = await getFrontendPlaceDetails(suggestion.placeId);
      setNewSelectedGooglePlace(placeDetails);
      setIsChangingLocation(false);
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
      isExisting: false,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setImageItems((prev) => [...prev, ...newMediaItems]);
    e.target.value = "";
  };

  const handleRemoveImageItem = (itemToRemove: MediaItemState) => {
    if (itemToRemove.isExisting && itemToRemove.mediaObject?._id) {
      setRemovedImageIds((prev) => [...prev, itemToRemove.mediaObject!._id]);
    }
    if (itemToRemove.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    setImageItems((prev) => prev.filter((item) => item.id !== itemToRemove.id));
  };

  // Video Selection Handler (Local state only - no S3 upload yet)
  const handleAddVideoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMediaItems: MediaItemState[] = Array.from(files).map((file) => ({
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isExisting: false,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setVideoItems((prev) => [...prev, ...newMediaItems]);
    e.target.value = "";
  };

  const handleRemoveVideoItem = (itemToRemove: MediaItemState) => {
    if (itemToRemove.isExisting && itemToRemove.mediaObject?._id) {
      setRemovedVideoIds((prev) => [...prev, itemToRemove.mediaObject!._id]);
    }
    if (itemToRemove.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    setVideoItems((prev) => prev.filter((item) => item.id !== itemToRemove.id));
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

  // Submit Handler (Uploads new media, saves location, and updates property upon submit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    let resolvedOwnerId = formData.ownerId;
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
        setFormData((prev) => ({ ...prev, ownerId: match._id }));
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

    if (formData.rentAmount <= 0) {
      toast("Rent amount must be greater than 0.");
      return;
    }

    if (formData.status === "rejected" && !formData.rejectionReason?.trim()) {
      toast("Rejection reason is required when status is set to rejected.");
      return;
    }

    setSubmitting(true);
    const finalImageIds: string[] = [];
    const finalVideoIds: string[] = [];
    const newlyCreatedImageIds: string[] = [];
    const newlyCreatedVideoIds: string[] = [];

    // Cleanup helper function if any submission step fails
    const cleanupNewlyUploadedMedia = async () => {
      if (newlyCreatedImageIds.length > 0) {
        await Promise.all(newlyCreatedImageIds.map((id) => deleteImageApi(id))).catch(() => {});
      }
      if (newlyCreatedVideoIds.length > 0) {
        await Promise.all(newlyCreatedVideoIds.map((id) => deleteVideoApi(id))).catch(() => {});
      }
    };

    try {
      // Step 1: Process images (re-use existing IDs or upload new File objects)
      if (imageItems.length > 0) {
        const hasNewImages = imageItems.some((img) => !img.isExisting && img.file);
        if (hasNewImages) toast("Uploading new property photos…");

        for (const imgItem of imageItems) {
          if (imgItem.isExisting && imgItem.mediaObject?._id) {
            finalImageIds.push(imgItem.mediaObject._id);
          } else if (imgItem.file) {
            const res = await uploadImageApi(imgItem.file, "property", "image");
            if (!res.success || !res.data?._id) {
              await cleanupNewlyUploadedMedia();
              setSubmitting(false);
              toast(`Failed to upload image "${imgItem.file.name}": ${res.message || "Upload error"}`);
              return;
            }
            finalImageIds.push(res.data._id);
            newlyCreatedImageIds.push(res.data._id);
          }
        }
      }

      // Step 2: Process videos (re-use existing IDs or upload new File objects)
      if (videoItems.length > 0) {
        const hasNewVideos = videoItems.some((vid) => !vid.isExisting && vid.file);
        if (hasNewVideos) toast("Uploading new walkthrough videos…");

        for (const vidItem of videoItems) {
          if (vidItem.isExisting && vidItem.mediaObject?._id) {
            finalVideoIds.push(vidItem.mediaObject._id);
          } else if (vidItem.file) {
            const res = await uploadVideoApi(vidItem.file, "property", "video");
            if (!res.success || !res.data?._id) {
              await cleanupNewlyUploadedMedia();
              setSubmitting(false);
              toast(`Failed to upload video "${vidItem.file.name}": ${res.message || "Upload error"}`);
              return;
            }
            finalVideoIds.push(res.data._id);
            newlyCreatedVideoIds.push(res.data._id);
          }
        }
      }

      // Step 3: Resolve / Save Location
      let resolvedLocationId = existingLocation?._id || formData.location || "";
      if (newSelectedGooglePlace) {
        toast("Saving new location…");
        const locRes = await savePlaceLocationApi(newSelectedGooglePlace);
        if (!locRes.success || !locRes.data?._id) {
          await cleanupNewlyUploadedMedia();
          setSubmitting(false);
          toast(locRes.message || "Failed to save new Google location");
          return;
        }
        resolvedLocationId = locRes.data._id;
      }

      if (!resolvedLocationId) {
        await cleanupNewlyUploadedMedia();
        setSubmitting(false);
        toast("Please select a valid property location.");
        return;
      }

      // Step 4: Submit Property Update
      toast("Saving property changes…");
      const payload: any = {
        ownerId: resolvedOwnerId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        listingType: formData.listingType,
        location: resolvedLocationId,
        rent: Number(formData.rentAmount),
        securityDeposit: Number(formData.securityDeposit),
        maintenanceCharges: {
          amount: Number(formData.maintenanceAmount),
          frequency: formData.maintenanceFrequency,
        },
        furnishing: formData.furnishing,
        availableFrom: formData.availableFrom,
        availableUntil: formData.availableUntil || undefined,
        genderPreference: formData.genderPreference,
        occupationPreference: formData.occupationPreference,
        parking: {
          available: formData.parkingAvailable,
        },
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        balconies: Number(formData.balconies),
        floors: Number(formData.floors),
        area: {
          value: Number(formData.areaValue),
          unit: formData.areaUnit,
        },
        houseRules: formData.houseRules
          ? formData.houseRules
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean)
          : [],
        amenities: formData.amenities,
        images: finalImageIds,
        videos: finalVideoIds,
        status: formData.status,
        rejectionReason: formData.status === "rejected" ? formData.rejectionReason : undefined,
        expiresAt: formData.expiresAt || undefined,
      };

      const res = await updatePropertyApi(propertyId, payload);

      if (!res.success) {
        await cleanupNewlyUploadedMedia();
        setSubmitting(false);
        toast(res.message || "Failed to update property listing");
        return;
      }

      // Execute explicit backend cleanup for unreferenced removed media items
      if (removedImageIds.length > 0) {
        Promise.all(removedImageIds.map((id) => deleteImageApi(id))).catch((err) =>
          console.error("Removed image cleanup error:", err)
        );
      }
      if (removedVideoIds.length > 0) {
        Promise.all(removedVideoIds.map((id) => deleteVideoApi(id))).catch((err) =>
          console.error("Removed video cleanup error:", err)
        );
      }

      setSubmitting(false);
      toast("Property listing updated successfully!");
      handleClose();
      onSuccess();
    } catch (err: any) {
      await cleanupNewlyUploadedMedia();
      setSubmitting(false);
      toast(err.message || "An unexpected error occurred during property update.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Property Listing</h3>
            <p className="text-xs text-slate-500">Update details, location, amenities, and media assets.</p>
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

        {/* Scrollable Content Body */}
        {loadingDetails ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching complete property details…</span>
          </div>
        ) : (
          <form id="edit-property-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Owner Selection */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                1. Property Owner (User) <span className="text-rose-500">*</span>
              </h4>
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
                        setFormData((prev) => ({ ...prev, ownerId: "" }));
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
                        setFormData((prev) => ({ ...prev, ownerId: "" }));
                        setIsOwnerDropdownOpen(false);
                      }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>

                {isOwnerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1100] max-h-52 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-3 text-xs text-slate-500 text-center">Searching users…</div>
                    ) : userOptions.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">No matching users found</div>
                    ) : (
                      userOptions.map((u) => {
                        const isSelected = formData.ownerId === u._id;
                        const displayLabel = u.email || u.mobile || u._id;
                        return (
                          <button
                            key={u._id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 border-b border-slate-100 last:border-0 ${
                              isSelected ? "bg-amber-100 font-semibold" : ""
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, ownerId: u._id }));
                              setUserSearchTerm(displayLabel);
                              setIsOwnerDropdownOpen(false);
                            }}
                          >
                            <div>
                              <div className="text-slate-900 font-medium">{displayLabel}</div>
                              <div className="text-[10px] text-slate-400">ID: {u._id.slice(-6)} • {u.role}</div>
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

            {/* Section 2: Google Maps Location */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                2. Location / Area (Frontend Google Places API) <span className="text-rose-500">*</span>
              </h4>

              {!isChangingLocation && (newSelectedGooglePlace || existingLocation) ? (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0 mt-0.5">
                      <Icon name="home" size={16} />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-slate-900 truncate">
                        📍 {newSelectedGooglePlace ? newSelectedGooglePlace.name : (existingLocation?.name || "Current Location")}
                      </strong>
                      <span className="block text-[11px] text-slate-600 font-medium truncate">
                        {newSelectedGooglePlace
                          ? newSelectedGooglePlace.formattedAddress
                          : (existingLocation?.formattedAddress || existingLocation?.city || "Property Location")}
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
                          setNewSelectedGooglePlace(null);
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

            {/* Section 3: Basic Details */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">3. Basic Property Details</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Listing Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Listing Type
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value as any })}
                  >
                    <option value="flat">Flat</option>
                    <option value="room">Room</option>
                    <option value="pg">PG</option>
                    <option value="shared_apartment">Shared Apartment</option>
                    <option value="entire_property">Entire Property</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Listing Status
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                    className="w-full px-3.5 py-2 bg-rose-50 border border-rose-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                    rows={2}
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            {/* Section 4: Pricing & Maintenance */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">4. Pricing & Maintenance</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Rent Amount (₹/mo) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Furnishing Status
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.furnishing}
                    onChange={(e) => setFormData({ ...formData, furnishing: e.target.value as any })}
                  >
                    <option value="fully_furnished">Fully Furnished</option>
                    <option value="semi_furnished">Semi Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Maintenance Charges (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.maintenanceAmount}
                    onChange={(e) => setFormData({ ...formData, maintenanceAmount: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Maintenance Frequency
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
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

            {/* Section 5: Availability */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">5. Availability & Dates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Available From
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Available Until (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.availableUntil}
                    onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Preferences */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">6. Tenant Preferences & Parking</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gender Preference
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.genderPreference}
                    onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value as any })}
                  >
                    <option value="any">Any Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Occupation Preference
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.occupationPreference}
                    onChange={(e) => setFormData({ ...formData, occupationPreference: e.target.value as any })}
                  >
                    <option value="any">Any Occupation</option>
                    <option value="student">Student</option>
                    <option value="working_professional">Working Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Parking Facility
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 accent-amber-500"
                      checked={formData.parkingAvailable}
                      onChange={(e) => setFormData({ ...formData, parkingAvailable: e.target.checked })}
                    />
                    <span className="text-sm text-slate-800 font-medium">Parking Available</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 7: Property Specifications */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">7. Specifications & Dimensions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Balconies
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.balconies}
                    onChange={(e) => setFormData({ ...formData, balconies: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Floors
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                    value={formData.floors}
                    onChange={(e) => setFormData({ ...formData, floors: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Area ({formData.areaUnit})
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                      value={formData.areaValue}
                      onChange={(e) => setFormData({ ...formData, areaValue: Number(e.target.value) })}
                    />
                    <select
                      className="px-1.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 shrink-0"
                      value={formData.areaUnit}
                      onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value as any })}
                    >
                      <option value="sqft">sqft</option>
                      <option value="sqm">sqm</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 8: House Rules & Amenities */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">8. House Rules & Amenities</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  House Rules (Comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
                  value={formData.houseRules}
                  onChange={(e) => setFormData({ ...formData, houseRules: e.target.value })}
                />
              </div>

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
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            isSelected
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

            {/* Section 9: Media Management */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">9. Media Assets Management</h4>

              {/* Images Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Photos ({imageItems.length})
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
                          alt="Property Image"
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
                    No property photos attached yet. Click &quot;+ Add Photos&quot; to upload images.
                  </div>
                )}
              </div>

              {/* Videos Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Walkthrough Videos ({videoItems.length})
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
                    No property videos attached yet. Click &quot;+ Add Video&quot; to upload walkthrough clips.
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

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
            form="edit-property-form"
            className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            disabled={submitting || loadingDetails || imageItems.some((img) => img.uploading) || videoItems.some((vid) => vid.uploading)}
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
