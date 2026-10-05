"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tv,
  Refrigerator,
  UtensilsCrossed,
  Wifi,
  Dumbbell,
  PartyPopper,
  CigaretteOff,
  Flame,
  Wind,
  ShieldCheck,
  Car,
  Sparkles,
  Sun,
  Dog,
  Heart,
  Wine,
  Shirt,
  Zap,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAssets } from "@/data/assets";
import { useListingStore } from "@/store/useListingStore";
import { PropertyListingItem, FlatmateRequirementItem } from "@/types/listing";
import { getStatusClasses } from "./MyListingCard";

// Helper for amenity icon resolution
const getAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("tv") || lower.includes("television"))
    return <Tv className="w-6 h-6 text-amber-300 stroke-[2]" />;
  if (lower.includes("fridge") || lower.includes("refrigerator"))
    return <Refrigerator className="w-6 h-6 text-slate-100 stroke-[2]" />;
  if (lower.includes("kitchen") || lower.includes("cooking") || lower.includes("food"))
    return <UtensilsCrossed className="w-6 h-6 text-red-300 stroke-[2]" />;
  if (lower.includes("wifi") || lower.includes("internet"))
    return <Wifi className="w-6 h-6 text-emerald-300 stroke-[2]" />;
  if (lower.includes("gym") || lower.includes("fitness"))
    return <Dumbbell className="w-6 h-6 text-cyan-300 stroke-[2]" />;
  if (lower.includes("ac") || lower.includes("air condition"))
    return <Wind className="w-6 h-6 text-blue-300 stroke-[2]" />;
  if (lower.includes("parking"))
    return <Car className="w-6 h-6 text-purple-300 stroke-[2]" />;
  if (lower.includes("security") || lower.includes("cctv"))
    return <ShieldCheck className="w-6 h-6 text-yellow-300 stroke-[2]" />;
  if (lower.includes("geyser") || lower.includes("heater") || lower.includes("hot water"))
    return <Flame className="w-6 h-6 text-orange-400 stroke-[2]" />;
  if (lower.includes("power") || lower.includes("backup") || lower.includes("generator"))
    return <Zap className="w-6 h-6 text-yellow-400 stroke-[2]" />;
  if (lower.includes("washing") || lower.includes("laundry"))
    return <Shirt className="w-6 h-6 text-teal-300 stroke-[2]" />;
  return <Sparkles className="w-6 h-6 text-sky-300 stroke-[2]" />;
};

// Helper for preference visual resolution
const getPreferenceVisual = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("owl") || lower.includes("night")) {
    return <span className="text-xl filter drop-shadow-sm select-none">🦉</span>;
  }
  if (lower.includes("fitness") || lower.includes("gym") || lower.includes("workout")) {
    return <Dumbbell className="w-6 h-6 text-cyan-300 stroke-[2.2]" />;
  }
  if (lower.includes("party") || lower.includes("social")) {
    return <PartyPopper className="w-6 h-6 text-yellow-300 stroke-[2.2]" />;
  }
  if (lower.includes("non smoker") || lower.includes("no smoking") || lower.includes("smoker")) {
    return <CigaretteOff className="w-6 h-6 text-orange-400 stroke-[2.2]" />;
  }
  if (lower.includes("early bird") || lower.includes("morning")) {
    return <Sun className="w-6 h-6 text-amber-400 stroke-[2.2]" />;
  }
  if (lower.includes("pet") || lower.includes("dog") || lower.includes("cat")) {
    return <Dog className="w-6 h-6 text-amber-300 stroke-[2.2]" />;
  }
  if (lower.includes("drink") || lower.includes("alcohol")) {
    return <Wine className="w-6 h-6 text-purple-300 stroke-[2.2]" />;
  }
  if (lower.includes("vegan") || lower.includes("veg")) {
    return <span className="text-xl filter drop-shadow-sm select-none">🥗</span>;
  }
  return <Heart className="w-6 h-6 text-rose-300 stroke-[2.2]" />;
};

interface DetailsMyListingProps {
  slug?: string;
}

export default function DetailsMyListing({ slug: propSlug }: DetailsMyListingProps) {
  const assets = useAssets();
  const params = useParams();
  const router = useRouter();
  const activeSlug = propSlug || (params?.slug as string);

  const {
    selectedListing,
    loadingDetails,
    fetchListingBySlug,
    options,
    fetchListingOptions,
    deleteListing,
    error,
  } = useListingStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch listing details and options
  useEffect(() => {
    if (activeSlug) {
      fetchListingBySlug(activeSlug);
    }
  }, [activeSlug, fetchListingBySlug]);

  useEffect(() => {
    if (options.amenities.length === 0 || options.lifestylePreferences.length === 0) {
      fetchListingOptions();
    }
  }, [fetchListingOptions, options.amenities.length, options.lifestylePreferences.length]);

  const resolveImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return url;
    }
    const apiBase = (`${process.env.NEXT_PUBLIC_API_URL}/api`).replace(/\/api\/?$/, "");
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const isProperty = selectedListing?.sourceType === "property";
  const isFlatmate = selectedListing?.sourceType === "flatmate_requirement";

  const propertyDoc = isProperty ? (selectedListing as PropertyListingItem) : null;
  const flatmateDoc = isFlatmate ? (selectedListing as FlatmateRequirementItem) : null;

  const pgName = propertyDoc?.title || flatmateDoc?.title || "My Listing";
  const status = selectedListing?.status || "draft";

  let computedCategory = "Property / Flatmate Listing";
  if (propertyDoc) {
    computedCategory = `${propertyDoc.listingType?.replace(/_/g, " ").toUpperCase() || "PROPERTY"} | ${
      propertyDoc.furnishing?.replace(/_/g, " ").toUpperCase() || "FURNISHED"
    }`;
  } else if (flatmateDoc) {
    computedCategory = `${
      flatmateDoc.partnerType?.toUpperCase() || flatmateDoc.postType?.toUpperCase() || "FLATMATE"
    } | ${
      flatmateDoc.occupationPreference?.replace(/_/g, " ").toUpperCase() || "ANY OCCUPATION"
    }`;
  }

  // Location
  let computedLocation = "Location not specified";
  const locObj = propertyDoc?.location || flatmateDoc?.location;
  if (locObj && typeof locObj === "object") {
    computedLocation = locObj.formattedAddress || locObj.city || computedLocation;
  } else if (typeof locObj === "string") {
    computedLocation = locObj;
  }

  // Financials
  const cleanAmount = (val?: string | number) => {
    if (!val) return "-";
    const str = String(val).replace(/^(Rs\.?|INR)\s*/i, "").trim();
    return str || "-";
  };

  const monthlyRent = cleanAmount(propertyDoc?.rent || flatmateDoc?.budget);
  const deposit = cleanAmount(propertyDoc?.securityDeposit);

  let parkingText = "Not Specified";
  if (propertyDoc?.parking?.available !== undefined) {
    parkingText = propertyDoc.parking.available ? "Available" : "Not Available";
  } else if ((propertyDoc as any)?.parkingAvailable !== undefined) {
    parkingText = (propertyDoc as any).parkingAvailable ? "Available" : "Not Available";
  }

  let maintenanceChargesText = "Included in Rent";
  if (propertyDoc?.maintenanceCharges?.amount) {
    maintenanceChargesText = `₹${propertyDoc.maintenanceCharges.amount}`;
  } else if ((propertyDoc as any)?.maintenanceAmount) {
    maintenanceChargesText = `₹${(propertyDoc as any).maintenanceAmount}`;
  }

  let maintenanceFrequencyText = "Monthly";
  const rawFreq =
    propertyDoc?.maintenanceCharges?.frequency || (propertyDoc as any)?.maintenanceFrequency;
  if (rawFreq) {
    if (rawFreq === "included") maintenanceFrequencyText = "Included in Rent";
    else if (rawFreq === "one_time") maintenanceFrequencyText = "One Time";
    else maintenanceFrequencyText = rawFreq.charAt(0).toUpperCase() + rawFreq.slice(1);
  }

  // Images list
  const backendImages =
    propertyDoc?.images?.map((i) => i.url) || flatmateDoc?.images?.map((i) => i.url);
  const userObj = propertyDoc?.ownerId || flatmateDoc?.userId;
  const uAny = userObj as any;
  const userImage =
    (typeof uAny?.image === "string" ? uAny.image : uAny?.image?.url) ||
    (typeof uAny?.profileImage === "string" ? uAny.profileImage : uAny?.profileImage?.url) ||
    (typeof uAny?.avatar === "string" ? uAny.avatar : uAny?.avatar?.image?.url) ||
    undefined;

  const imageList =
    backendImages && backendImages.length > 0
      ? backendImages
      : userImage
      ? [userImage]
      : [assets.property01, assets.property02, assets.property03];

  // House Rules
  const rawHouseRules = propertyDoc?.houseRules || (flatmateDoc as any)?.houseRules;
  let houseRulesList: string[] = [];
  if (Array.isArray(rawHouseRules)) {
    houseRulesList = rawHouseRules.map((r: any) => String(r).trim()).filter(Boolean);
  } else if (typeof rawHouseRules === "string" && rawHouseRules.trim()) {
    houseRulesList = rawHouseRules.split(/,|\n/).map((r) => r.trim()).filter(Boolean);
  }

  // Dynamic Amenities Resolution
  const rawAmenities = propertyDoc?.amenities || (flatmateDoc as any)?.amenities;
  const amenitiesList: { _id?: string; name: string; image?: string }[] = [];

  if (Array.isArray(rawAmenities) && rawAmenities.length > 0) {
    rawAmenities.forEach((item: any) => {
      let name = "";
      let imgUrl: string | undefined = undefined;
      let id: string | undefined = undefined;

      if (typeof item === "string") {
        id = item;
        const matchedOpt = options.amenities.find(
          (opt) => opt._id === item || opt.name.toLowerCase() === item.toLowerCase()
        );
        if (matchedOpt) {
          name = matchedOpt.name;
          imgUrl =
            matchedOpt.image?.url ||
            (typeof matchedOpt.image === "string" ? matchedOpt.image : undefined);
        } else {
          name = item;
        }
      } else if (item && typeof item === "object") {
        id = item._id;
        name = item.name || "Amenity";
        imgUrl =
          item.image?.url ||
          (typeof item.image === "string" ? item.image : undefined) ||
          item.icon ||
          item.url;
      }

      if (name) {
        amenitiesList.push({
          _id: id,
          name,
          image: resolveImageUrl(imgUrl),
        });
      }
    });
  } else if (options.amenities.length > 0) {
    options.amenities.slice(0, 6).forEach((am) => {
      const imgUrl = am.image?.url || (typeof am.image === "string" ? am.image : undefined);
      amenitiesList.push({
        _id: am._id,
        name: am.name,
        image: resolveImageUrl(imgUrl),
      });
    });
  }

  // Dynamic Preferences Resolution
  const rawPreferences =
    flatmateDoc?.lifestylePreferences || (propertyDoc as any)?.lifestylePreferences;
  const preferencesList: { _id?: string; name: string; image?: string }[] = [];

  if (Array.isArray(rawPreferences) && rawPreferences.length > 0) {
    rawPreferences.forEach((item: any) => {
      let name = "";
      let imgUrl: string | undefined = undefined;
      let id: string | undefined = undefined;

      if (typeof item === "string") {
        id = item;
        const matchedOpt = options.lifestylePreferences.find(
          (opt) => opt._id === item || opt.name.toLowerCase() === item.toLowerCase()
        );
        if (matchedOpt) {
          name = matchedOpt.name;
          imgUrl =
            typeof matchedOpt.image === "string" ? matchedOpt.image : matchedOpt.image?.url;
        } else {
          name = item;
        }
      } else if (item && typeof item === "object") {
        id = item._id;
        name = item.name || "Preference";
        imgUrl =
          item.image?.url ||
          (typeof item.image === "string" ? item.image : undefined) ||
          item.icon ||
          item.url;
      }

      if (name) {
        preferencesList.push({
          _id: id,
          name,
          image: resolveImageUrl(imgUrl),
        });
      }
    });
  }

  const descriptionText =
    propertyDoc?.description || flatmateDoc?.description || "No description provided.";

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteListing = async () => {
    if (!selectedListing) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const sourceType = selectedListing.sourceType || "property";
      await deleteListing(selectedListing._id, sourceType);
      setShowDeleteModal(false);
      router.push("/my-listings");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete listing.");
      setDeleting(false);
    }
  };

  if (loadingDetails) {
    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border border-gray-200 drop-shadow-md p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
          <p className="text-gray-500 font-medium text-sm">Loading listing details...</p>
        </div>
      </section>
    );
  }

  if (error || !selectedListing) {
    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-md mx-auto text-center p-8 bg-white rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <p className="text-gray-600 font-medium text-base">
            {error || "Listing not found or has been removed."}
          </p>
          <Link
            href="/my-listings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to My Listings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6">
        {/* Top Header Bar: Back navigation, Status badge, Edit and Delete Action Buttons */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 sm:px-6 rounded-2xl border border-gray-200 shadow-xs">
          <Link
            href="/my-listings"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Listings</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span
              className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold capitalize ${getStatusClasses(
                status
              )}`}
            >
              Status: {status.replace(/_/g, " ")}
            </span>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => router.push(`/my-listings/edit/${selectedListing?.slug || selectedListing?._id || activeSlug}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Main Listing Details Container Card (No Left Profile Section) */}
        <div className="w-full rounded-[32px] sm:rounded-[40px] border border-gray-200 bg-white drop-shadow-md p-6 sm:p-10 md:p-14 transition-all">
          <div className="w-full space-y-7 sm:space-y-8 md:space-y-10">
            {/* 1. Header PG Name & Category Section */}
            <div className="space-y-1">
              <h1 className="text-black text-2xl sm:text-3xl md:text-4xl font-semibold">
                {pgName}
              </h1>
              <p className="text-gray-500 text-sm sm:text-base font-regular">
                {computedCategory}
              </p>
            </div>

            {/* 2. Location Section */}
            <div className="space-y-1.5">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                Location
              </h3>
              <div className="flex items-start gap-1.5 text-gray-500 text-sm sm:text-lg font-regular">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                <span>{computedLocation}</span>
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* 3. Rent Info Section (Property Source) */}
            {isProperty && (
              <div className="space-y-4">
                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                  Rent Info
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                      Monthly Rent
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                        <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                      </span>
                      <span className="text-black text-sm sm:text-lg md:text-xl font-medium">
                        {monthlyRent}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                      Deposit
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                        <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                      </span>
                      <span className="text-black text-sm sm:text-lg md:text-xl font-medium">
                        {deposit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                      Parking
                    </span>
                    <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">
                      {parkingText}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                      Maintenance Charges
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                        <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                      </span>
                      <span className="text-black text-sm sm:text-lg md:text-xl font-medium">
                        {maintenanceChargesText}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                      Maintenance Frequency
                    </span>
                    <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">
                      {maintenanceFrequencyText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Information Grid Section */}
            <div className="space-y-3">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                Information
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-1">
                {isProperty ? (
                  <>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Listing Type
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {propertyDoc?.listingType?.replace(/_/g, " ") || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Furnishing
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {propertyDoc?.furnishing?.replace(/_/g, " ") || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Gender Preference
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {propertyDoc?.genderPreference || "Any"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Occupation Preference
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {propertyDoc?.occupationPreference?.replace(/_/g, " ") || "Any"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Looking For
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {flatmateDoc?.partnerType || flatmateDoc?.postType || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Budget
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base mt-0.5">
                        ₹{flatmateDoc?.budget?.toLocaleString() || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Gender Preference
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {flatmateDoc?.genderPreference || "Any"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm">
                        Occupation Preference
                      </span>
                      <p className="text-gray-900 font-medium text-sm sm:text-base capitalize mt-0.5">
                        {flatmateDoc?.occupationPreference?.replace(/_/g, " ") || "Any"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* 5. Description Section */}
            <div className="space-y-3">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                Description
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {descriptionText}
              </p>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* 6. Image Carousel Gallery Section */}
            <div className="space-y-4">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                Photos
              </h3>

              <div className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] rounded-3xl overflow-hidden bg-gray-100 group">
                <img
                  src={imageList[currentImageIndex]}
                  alt={`Listing photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {imageList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous Image"
                      className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next Image"
                      className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {imageList.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {imageList.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        currentImageIndex === idx
                          ? "border-[#0066FF] scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Amenities Section */}
            {amenitiesList.length > 0 && (
              <>
                <hr className="border-gray-200 border-t my-4" />
                <div className="space-y-4">
                  <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {amenitiesList.map((am, idx) => (
                      <div
                        key={am._id || idx}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                          {am.image ? (
                            <img src={am.image} alt={am.name} className="w-6 h-6 object-contain" />
                          ) : (
                            getAmenityIcon(am.name)
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800">
                          {am.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 8. Lifestyle Preferences Section */}
            {preferencesList.length > 0 && (
              <>
                <hr className="border-gray-200 border-t my-4" />
                <div className="space-y-4">
                  <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                    Lifestyle Preferences
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {preferencesList.map((pref, idx) => (
                      <div
                        key={pref._id || idx}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center shrink-0">
                          {pref.image ? (
                            <img
                              src={pref.image}
                              alt={pref.name}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            getPreferenceVisual(pref.name)
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800">
                          {pref.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 9. House Rules Section */}
            {houseRulesList.length > 0 && (
              <>
                <hr className="border-gray-200 border-t my-4" />
                <div className="space-y-4">
                  <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                    House Rules
                  </h3>
                  <ul className="space-y-2.5">
                    {houseRulesList.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-[#0066FF] mt-2 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Delete Listing?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete &quot;{pgName}&quot;? This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteListing}
                className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}