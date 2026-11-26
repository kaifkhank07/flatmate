"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  UploadCloud,
  Loader2,
  X,
  MapPin,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  ArrowLeft,
  Eye,
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
  fetchPropertyAmenitiesApi,
  AutocompleteSuggestion,
  SavePlacePayload,
  UserPreferenceItem,
  PropertyAmenityItem,
} from "@/lib/apiServices";
import { ViewReveal } from "@/components/animation";
import RichTextEditor, { isRichTextEmpty } from "@/components/listing/shared/RichTextEditor";
import { validateDescriptionContact } from "@/utils/contactFilter";

interface FlatmateEditForm2Props {
  initialData: any;
  onBack: () => void;
}

interface PhotoStateItem {
  id: string;
  file?: File | null;
  previewUrl: string;
  imageId?: string;
}

interface VideoStateItem {
  id: string;
  file?: File | null;
  previewUrl: string;
  videoId?: string;
}

export default function FlatmateEditForm2({
  initialData,
  onBack,
}: FlatmateEditForm2Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateFlatmateRequirement } = useListingStore();

  const status = initialData?.status;
  const isEditable = !status || status === "pending" || status === "rejected";

  // Location Autocomplete State
  const initialLocObj =
    initialData?.location && typeof initialData.location === "object"
      ? initialData.location
      : null;

  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<SavePlacePayload | null>(
    initialLocObj
      ? {
        placeId: initialLocObj.placeId || "",
        name: initialLocObj.name || "",
        formattedAddress: initialLocObj.formattedAddress || "",
        latitude: initialLocObj.latitude || 0,
        longitude: initialLocObj.longitude || 0,
      }
      : null
  );
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Master Data State
  const [preferenceOptions, setPreferenceOptions] = useState<UserPreferenceItem[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [amenityOptions, setAmenityOptions] = useState<PropertyAmenityItem[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  // Form Fields State (Post Type: 'partner')
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [rent, setRent] = useState(
    initialData?.rent ? String(initialData.rent) : initialData?.budget ? String(initialData.budget) : ""
  );
  const [availableFrom, setAvailableFrom] = useState(
    initialData?.availableFrom
      ? new Date(initialData.availableFrom).toISOString().split("T")[0]
      : initialData?.moveInDate
        ? new Date(initialData.moveInDate).toISOString().split("T")[0]
        : ""
  );
  const [furnishing, setFurnishing] = useState<"fully_furnished" | "semi_furnished" | "unfurnished">(
    initialData?.furnishing || "semi_furnished"
  );
  const [area, setArea] = useState(initialData?.area ? String(initialData.area) : "");
  const [securityDeposit, setSecurityDeposit] = useState(
    initialData?.securityDeposit ? String(initialData.securityDeposit) : ""
  );
  const [maintenanceAmount, setMaintenanceAmount] = useState(
    initialData?.maintenanceCharges?.amount ? String(initialData.maintenanceCharges.amount) : ""
  );
  const [maintenanceFrequency, setMaintenanceFrequency] = useState<"monthly" | "yearly" | "included" | "one_time">(
    initialData?.maintenanceCharges?.frequency || "yearly"
  );
  const [parkingAvailable, setParkingAvailable] = useState<boolean>(initialData?.parking ?? false);
  const [brokerageAvailable, setBrokerageAvailable] = useState<boolean>(initialData?.brokerage ?? false);
  const [genderPreference, setGenderPreference] = useState<"male" | "female" | "any">(
    initialData?.genderPreference || "any"
  );
  const [occupancyPreference, setOccupancyPreference] = useState<"single" | "double" | "triple" | "four_or_more">(
    initialData?.occupancyPreference || "single"
  );
  const [occupationPreference, setOccupationPreference] = useState<
    "student" | "working_professional" | "self_employed" | "business_owner" | "freelancer" | "any"
  >(initialData?.occupationPreference || "any");

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(
    Array.isArray(initialData?.userPreferences) && initialData.userPreferences.length > 0
      ? initialData.userPreferences.map((p: any) => (typeof p === "object" ? p._id : p)).filter(Boolean)
      : Array.isArray(initialData?.lifestylePreferences)
        ? initialData.lifestylePreferences.map((p: any) => (typeof p === "object" ? p._id : p)).filter(Boolean)
        : []
  );

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    Array.isArray(initialData?.amenities)
      ? initialData.amenities.map((a: any) => (typeof a === "object" ? a._id : a)).filter(Boolean)
      : []
  );

  // Property Details State (partner post)
  const [floor, setFloor] = useState(
    initialData?.propertyDetails?.floor !== undefined && initialData?.propertyDetails?.floor !== null
      ? String(initialData.propertyDetails.floor)
      : ""
  );
  const [totalFloors, setTotalFloors] = useState(
    initialData?.propertyDetails?.totalFloors !== undefined && initialData?.propertyDetails?.totalFloors !== null
      ? String(initialData.propertyDetails.totalFloors)
      : ""
  );
  const [facing, setFacing] = useState(initialData?.propertyDetails?.facing || "");
  const [bedrooms, setBedrooms] = useState(initialData?.propertyDetails?.bedrooms || "");

  // Media State
  const [photoItems, setPhotoItems] = useState<PhotoStateItem[]>(
    Array.isArray(initialData?.images)
      ? initialData.images.map((img: any) => ({
        id: (typeof img === "object" ? img._id : img) || `existing-img-${Math.random()}`,
        previewUrl: typeof img === "object" ? img.url || "" : img,
        imageId: typeof img === "object" ? img._id : img,
      }))
      : []
  );

  // Submission & Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Preferences and Amenities on Mount
  useEffect(() => {
    setLoadingPreferences(true);
    fetchUserPreferencesApi({ limit: 100 })
      .then((res) => {
        if (res.success && res.data?.items) {
          setPreferenceOptions(res.data.items);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingPreferences(false));

    setLoadingAmenities(true);
    fetchPropertyAmenitiesApi({ limit: 100 })
      .then((res) => {
        if (res.success && res.data?.items) {
          setAmenityOptions(res.data.items);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingAmenities(false));
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

  // Toggle Amenity Selection
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

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

  const renderAmenityImage = (amenity: PropertyAmenityItem) => {
    if (amenity.image?.url) {
      return (
        <div className="relative w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 flex-shrink-0">
          <Image
            src={amenity.image.url}
            alt={amenity.name}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      );
    }
    return <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 text-[#0066F9] flex-shrink-0" />;
  };

  // Photos Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newItems: PhotoStateItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotoItems((prev) => [...prev, ...newItems]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotoItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item && item.file) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Handle Form Submission
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEditable) {
      setErrorMessage(`This listing cannot be edited because its status is ${status || "not allowed"}.`);
      return;
    }

    if (!selectedGooglePlace) {
      setErrorMessage("Please search and select a valid location.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Headline Title is required.");
      return;
    }

    if (isRichTextEmpty(description)) {
      setErrorMessage("Description is required.");
      return;
    }

    const contactCheck = validateDescriptionContact(description);
    if (contactCheck.hasContact) {
      setErrorMessage(contactCheck.message || "Contact details are not allowed in the listing description.");
      return;
    }

    if (!rent || isNaN(Number(rent)) || Number(rent) <= 0) {
      setErrorMessage("Please enter a valid monthly rent amount.");
      return;
    }

    if (!availableFrom) {
      setErrorMessage("Available From date is required.");
      return;
    }

    if (selectedPreferences.length < 3) {
      setErrorMessage("Please select at least 3 user preferences.");
      return;
    }

    if (selectedAmenities.length < 3) {
      setErrorMessage("Please select at least 3 amenities.");
      return;
    }

    if (photoItems.length === 0) {
      setErrorMessage("At least one photo is required.");
      return;
    }

    if (floor !== "" && totalFloors !== "" && Number(floor) > Number(totalFloors)) {
      setErrorMessage("Floor cannot be greater than Total Floors.");
      return;
    }

    setIsSubmitting(true);
    const newlyUploadedImageIds: string[] = [];

    const cleanupUploadedMedia = async () => {
      for (const imgId of newlyUploadedImageIds) {
        try {
          await deleteImageApi(imgId);
        } catch { }
      }
    };

    try {
      // Step 1: Upload new photo files
      const existingImageIds = photoItems.filter((p) => p.imageId).map((p) => p.imageId as string);
      for (const item of photoItems) {
        if (item.file) {
          const res = await uploadImageApi(item.file, "flatmate", "photo");
          if (!res.success || !res.data?._id) {
            await cleanupUploadedMedia();
            setIsSubmitting(false);
            setErrorMessage(`Failed to upload photo "${item.file.name}"`);
            return;
          }
          newlyUploadedImageIds.push(res.data._id);
        }
      }
      const createdImageIds = [...existingImageIds, ...newlyUploadedImageIds];

      // Step 2: Save Location to DB if changed or new
      const locRes = await savePlaceLocationApi(selectedGooglePlace);
      if (!locRes.success || !locRes.data?._id) {
        await cleanupUploadedMedia();
        setIsSubmitting(false);
        setErrorMessage(locRes.message || "Failed to save selected location.");
        return;
      }

      const locationId = locRes.data._id;

      // Step 3: Update Flatmate Requirement (Post Type: 'partner')
      const payload: any = {
        userId: user?._id,
        title: title.trim(),
        description: description.trim() || undefined,
        postType: "partner",
        partnerType: initialData?.partnerType || "flatmate",
        postedBy: initialData?.postedBy || "flatmate",
        location: locationId,
        rent: Number(rent),
        budget: Number(rent),
        availableFrom: new Date(availableFrom).toISOString(),
        moveInDate: new Date(availableFrom).toISOString(),
        furnishing,
        area: area ? Number(area) : 0,
        securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
        maintenanceCharges: maintenanceAmount ? {
          amount: Number(maintenanceAmount),
          frequency: maintenanceFrequency,
        } : undefined,
        parking: parkingAvailable,
        brokerage: brokerageAvailable,
        occupancyPreference,
        occupationPreference,
        genderPreference,
        userPreferences: selectedPreferences,
        lifestylePreferences: selectedPreferences,
        amenities: selectedAmenities,
        images: createdImageIds,
        propertyDetails: (floor !== "" || totalFloors !== "" || facing || bedrooms) ? {
          floor: floor !== "" ? Number(floor) : undefined,
          totalFloors: totalFloors !== "" ? Number(totalFloors) : undefined,
          facing: facing || undefined,
          bedrooms: bedrooms || undefined,
        } : undefined,
      };

      if (initialData?.status === "rejected") {
        payload.status = "pending";
        payload.rejectionReason = null;
      }

      const result = await updateFlatmateRequirement(initialData._id, payload);

      if (!result) {
        await cleanupUploadedMedia();
        setIsSubmitting(false);
        setErrorMessage("Failed to update flatmate partner requirement. Please try again.");
        return;
      }

      setIsSubmitting(false);
      router.push(`/my-listings/${(result as any).slug || (result as any)._id || ""}`);
    } catch (err: any) {
      await cleanupUploadedMedia();
      setIsSubmitting(false);
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  if (!isEditable) {
    const slugOrId = initialData?.slug || initialData?._id;
    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-3xl mx-auto py-12 px-4 sm:px-6">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-10 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Editing Not Allowed
              </h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                This partner requirement listing is currently{" "}
                <span className="font-semibold uppercase text-amber-800">
                  {status}
                </span>{" "}
                and cannot be edited. Only listings with <strong>pending</strong> or{" "}
                <strong>rejected</strong> status can be modified.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {slugOrId && (
                <Link
                  href={`/my-listings/${slugOrId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Eye size={16} />
                  View Listing Details
                </Link>
              )}
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
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
        <div className="bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 md:p-12 space-y-8 sm:space-y-10 md:space-y-12">
          <ViewReveal duration={800}>
            <SectionHeading
              title="Edit Flatmate Requirement"
              description="Find your ideal roommate or flatmate by specifying location, preferences, amenities, and budget"
              align="center"
            />
          </ViewReveal>

          <form onSubmit={handlePublish} className="space-y-8">
            {/* SECTION 1: REQUIREMENT OVERVIEW */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                REQUIREMENT OVERVIEW
              </h3>

              {/* Location Autocomplete Field */}
              <div className="space-y-2 relative" ref={locationDropdownRef}>
                <label className="block text-sm sm:text-base font-regular text-black">
                  Location <span className="text-rose-500">*</span>
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

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Looking for a Flatmate in Indiranagar, Bangalore"
                  className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  required
                />
              </div>
            </div>

            {/* SECTION 2 : SPACE DETAILS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                SPACE DETAILS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Area */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Area (sq.ft)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                </div>

                {/* Furnishing Status */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Furnishing Status
                  </label>
                  <select
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                  >
                    <option value="fully_furnished">Fully Furnished</option>
                    <option value="semi_furnished">Semi Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>

                {/* Parking Facility */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Parking Facility
                  </label>
                  <select
                    value={parkingAvailable ? "yes" : "no"}
                    onChange={(e) => setParkingAvailable(e.target.value === "yes")}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* BHK */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Bedrooms / BHK
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
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

                {/* Facing */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Facing
                  </label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
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

                {/* Floor */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Floor
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="0 for Ground floor"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                </div>

                {/* Total Floors */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: RENTAL SPECIFICATIONS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                RENTAL SPECIFICATIONS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Occupancy Preference */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Occupancy Preference <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={occupancyPreference}
                    onChange={(e) => setOccupancyPreference(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                    required
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="four_or_more">Four or More</option>
                  </select>
                </div>

                {/* Rent Amount */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Rent Amount (₹/mo) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                    required
                  />
                </div>

                {/* Security Deposit */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="e.g. 24000"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                </div>

                {/* Brokerage Applicable */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Brokerage Applicable
                  </label>
                  <select
                    value={brokerageAvailable ? "yes" : "no"}
                    onChange={(e) => setBrokerageAvailable(e.target.value === "yes")}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {/* Available From */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Available From <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                    required
                  />
                </div>

                {/* Maintenance Amount */}
                {/* <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Maintenance Charges (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maintenanceAmount}
                    onChange={(e) => setMaintenanceAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none"
                  />
                </div> */}

                {/* Maintenance Frequency */}
                {/* {maintenanceAmount && maintenanceAmount.trim() !== "" && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="block text-sm sm:text-base font-regular text-black">
                      Maintenance Frequency
                    </label>
                    <select
                      value={maintenanceFrequency}
                      onChange={(e) => setMaintenanceFrequency(e.target.value as any)}
                      className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="included">Included in Rent</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                )} */}
              </div>
            </div>

            {/* SECTION 4: PREFERENCES */}
            <div className="space-y-4 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                PREFERENCES
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Gender Preference */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Gender Preference <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                    required
                  >
                    <option value="any">Any Gender</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>

                {/* Occupation Preference */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Occupation Preference <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={occupationPreference}
                    onChange={(e) => setOccupationPreference(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all border-none cursor-pointer"
                    required
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

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Description <span className="text-rose-500">*</span>
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="e.g. I am looking for a flatmate."
                  restrictContactInfo={true}
                />
              </div>

              {/* Lifestyle Preferences Grid */}
              <div className="space-y-3">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Lifestyle Preferences ({selectedPreferences.length} /3 minimum selected) <span className="text-rose-500">*</span>
                </label>

                {loadingPreferences ? (
                  <div className="p-8 bg-[#F8FBFE] rounded-3xl border border-[#E2EFF8] text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0066F9]" />
                    Loading preferences…
                  </div>
                ) : preferenceOptions.length > 0 ? (
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3.5 md:gap-4 justify-items-center">
                    {preferenceOptions.map((pref) => {
                      const isSelected = selectedPreferences.includes(pref._id);

                      return (
                        <button
                          key={pref._id}
                          type="button"
                          onClick={() => togglePreference(pref._id)}
                          aria-label={`Select ${pref.name}`}
                          aria-pressed={isSelected}
                          title={pref.name}
                          className={`group relative flex aspect-square w-full flex-col items-center justify-center p-1 sm:p-2 md:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0066F9]/40 ${isSelected
                            ? "bg-[#F0F7FF] border-1 border-[#0066F9]"
                            : "bg-white border border-gray-200/90 hover:bg-slate-50/70 hover:border-gray-300"
                            }`}
                        >
                          {/* Blue circular check badge in top-right when selected */}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#0066F9] text-white shadow-xs animate-in zoom-in-75 duration-150">
                              <Check className="h-2 w-2 sm:h-3 sm:w-3 stroke-[3]" />
                            </span>
                          )}

                          {/* Centered preference icon */}
                          <div className="flex items-center justify-center">
                            {renderPreferenceImage(pref)}
                          </div>

                          {/* Preference label inside the card */}
                          <span
                            className={`mt-1 sm:mt-1.5 w-full text-center text-[9px] sm:text-xs md:text-sm font-medium leading-tight tracking-tight line-clamp-1 whitespace-nowrap break-words transition-colors ${isSelected ? "text-slate-900" : "text-slate-700"
                              }`}
                          >
                            {pref.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-[#F8FBFE] rounded-3xl border border-[#E2EFF8] text-xs text-gray-400 text-center">
                    No preferences available
                  </div>
                )}
              </div>

              {/* Property Amenities Grid */}
              <div className="space-y-3">
                <label className="block text-sm sm:text-base font-regular text-black">
                  Amenities ({selectedAmenities.length} /3 minimum selected) <span className="text-rose-500">*</span>
                </label>

                {loadingAmenities ? (
                  <div className="p-8 bg-[#F8FBFE] rounded-3xl border border-[#E2EFF8] text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0066F9]" />
                    Loading amenities…
                  </div>
                ) : amenityOptions.length > 0 ? (
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3.5 md:gap-4 justify-items-center">
                    {amenityOptions.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity._id);

                      return (
                        <button
                          key={amenity._id}
                          type="button"
                          onClick={() => toggleAmenity(amenity._id)}
                          aria-label={`Select ${amenity.name}`}
                          aria-pressed={isSelected}
                          title={amenity.name}
                          className={`group relative flex aspect-square w-full flex-col items-center justify-center p-1 sm:p-2 md:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0066F9]/40 ${isSelected
                            ? "bg-[#F0F7FF] border-1 border-[#0066F9]"
                            : "bg-white border border-gray-200/90 hover:bg-slate-50/70 hover:border-gray-300"
                            }`}
                        >
                          {/* Blue circular check badge in top-right when selected */}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#0066F9] text-white shadow-xs animate-in zoom-in-75 duration-150">
                              <Check className="h-2 w-2 sm:h-3 sm:w-3 stroke-[3]" />
                            </span>
                          )}

                          {/* Centered amenity icon */}
                          <div className="flex items-center justify-center">
                            {renderAmenityImage(amenity)}
                          </div>

                          {/* Amenity label inside the card */}
                          <span
                            className={`mt-1 sm:mt-1.5 w-full text-center text-[9px] sm:text-xs md:text-sm font-medium leading-tight tracking-tight line-clamp-1 whitespace-nowrap break-words transition-colors ${isSelected ? "text-slate-900" : "text-slate-700"
                              }`}
                          >
                            {amenity.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-[#F8FBFE] rounded-3xl border border-[#E2EFF8] text-xs text-gray-400 text-center">
                    No amenities available
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: MEDIA ASSETS MANAGEMENT */}
            <div className="space-y-6 pt-2">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                MEDIA ASSETS MANAGEMENT
              </h3>

              {/* Photos Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm sm:text-base font-regular text-black">
                    Photos ({photoItems.length}) <span className="text-rose-500">*</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-regular rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white cursor-pointer transition-all shadow-xs">
                    <Plus className="w-3.5 h-3.5 stroke-0.5" />
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
            </div>

            {/* Submit Button */}
            <div className="flex justify-center sm:justify-start items-center gap-2 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent/80 text-white py-3.5 px-10 md:px-14 rounded-2xl font-regular text-base md:text-lg transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Updating…" : "Update"}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="bg-[#F3F9FD] border border-[#E2EFF8] hover:bg-[#EAF4FC] hover:border-[#D0E6F7] text-[#407B9D] py-3.5 px-10 md:px-14 rounded-2xl font-regular text-base md:text-lg transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
