"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Check,
  IndianRupee,
  Tv,
  Refrigerator,
  UtensilsCrossed,
  Wifi,
  Dumbbell,
  Wind,
  ShieldCheck,
  Flame,
  Zap,
  Shirt,
  Car,
  Sparkles,
  LandPlot,
  Maximize2,
  Heart,
  Loader2,
} from "lucide-react";
import LineRoll from "@/components/utils/LineRoll";
import { PropertyListingItem } from "@/types/listing";
import { useListingStore } from "@/store/useListingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getMediaUrl } from "@/lib/api";
import { toggleWishlistApi, checkWishlistStatusApi, addRecentlyViewedApi } from "@/lib/apiServices";
import { ReportModal, WishlistLoginModal } from "@/components/listing/shared/modals";
import ListingMediaGallery from "@/components/listing/shared/ListingMediaGallery";
import RichTextRenderer from "@/components/listing/shared/RichTextRenderer";
import OwnerDetails from "./OwnerDetails";
import ContactAction from "./ContactAction";

const getAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("tv") || lower.includes("television")) return <Tv className="w-6 h-6 text-amber-300 stroke-[2]" />;
  if (lower.includes("fridge") || lower.includes("refrigerator")) return <Refrigerator className="w-6 h-6 text-slate-100 stroke-[2]" />;
  if (lower.includes("kitchen") || lower.includes("cooking") || lower.includes("food")) return <UtensilsCrossed className="w-6 h-6 text-red-300 stroke-[2]" />;
  if (lower.includes("wifi") || lower.includes("internet")) return <Wifi className="w-6 h-6 text-emerald-300 stroke-[2]" />;
  if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell className="w-6 h-6 text-cyan-300 stroke-[2]" />;
  if (lower.includes("ac") || lower.includes("air condition")) return <Wind className="w-6 h-6 text-blue-300 stroke-[2]" />;
  if (lower.includes("parking")) return <Car className="w-6 h-6 text-purple-300 stroke-[2]" />;
  if (lower.includes("security") || lower.includes("cctv")) return <ShieldCheck className="w-6 h-6 text-yellow-300 stroke-[2]" />;
  if (lower.includes("geyser") || lower.includes("heater") || lower.includes("hot water")) return <Flame className="w-6 h-6 text-orange-400 stroke-[2]" />;
  if (lower.includes("power") || lower.includes("backup") || lower.includes("generator")) return <Zap className="w-6 h-6 text-yellow-400 stroke-[2]" />;
  if (lower.includes("washing") || lower.includes("laundry")) return <Shirt className="w-6 h-6 text-teal-300 stroke-[2]" />;
  return <Sparkles className="w-6 h-6 text-sky-300 stroke-[2]" />;
};

interface PropertyDetailsProps {
  listing: PropertyListingItem;
  slug?: string;
  listingData?: any;
}

export default function PropertyDetails({ listing, listingData }: PropertyDetailsProps) {
  const router = useRouter();
  const { options } = useListingStore();
  const { user, isAuthenticated } = useAuthStore();
  const resolveImageUrl = (url?: string) => getMediaUrl(url);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showWishlistLoginModal, setShowWishlistLoginModal] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState<string | null>(null);

  const targetId = listing._id;
  const targetType = "property";

  useEffect(() => {
    if (!targetId) return;

    if (isAuthenticated) {
      addRecentlyViewedApi(targetType, targetId).catch(() => { });
    }

    if (!isAuthenticated) return;
    let isMounted = true;
    checkWishlistStatusApi(targetType, targetId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setIsWishlisted(res.data.isWishlisted);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, targetId]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      setShowWishlistLoginModal(true);
      return;
    }
    if (!targetId || wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const res = await toggleWishlistApi(targetType, targetId);
      if (res.success && res.data) {
        setIsWishlisted(res.data.wishlisted);
        setWishlistMessage(res.data.wishlisted ? "Added to wishlist!" : "Removed from wishlist");
      } else {
        setWishlistMessage(res.message || "Failed to update wishlist");
      }
    } catch (err: any) {
      setWishlistMessage(err.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setWishlistMessage(null), 3000);
    }
  };

  const userObj = listing.userId || listing.ownerId;
  const ownerId = typeof userObj === "object" ? userObj?._id : userObj;
  const isOwner = Boolean(user?._id && ownerId && String(user._id) === String(ownerId));
  const name = listingData?.name || userObj?.name || "Property Owner";
  const occupation = listingData?.occupation || (userObj as any)?.occupation;
  const gender = listingData?.gender || (userObj as any)?.gender;
  const userMobile = listingData?.userMobile || userObj?.mobile || userObj?.contact || "+91 98765 43210";
  const uAny = userObj as any;
  const userImage =
    (typeof uAny?.image === "string" ? uAny.image : uAny?.image?.url) ||
    (typeof uAny?.profileImage === "string" ? uAny.profileImage : uAny?.profileImage?.url) ||
    (typeof uAny?.avatar === "string" ? uAny.avatar : uAny?.avatar?.image?.url) ||
    undefined;

  const propertyTitle = listing.title || listingData?.pgName || "Property Listing";
  const pType = listing.propertyType || listing.listingType || "property";
  const pTypeStr =
    typeof pType === "object"
      ? ((pType as any).category || (pType as any).type || "").replace(/_/g, " ")
      : String(pType).replace(/_/g, " ");
  const furnishing = listing.furnishing || "semi_furnished";
  const categoryHeader = `${pTypeStr.toUpperCase()} | ${furnishing.replace(/_/g, " ").toUpperCase()}`;

  let locationText = "Location N/A";
  if (typeof listing.location === "object" && listing.location) {
    locationText = listing.location.formattedAddress || listing.location.city || "Location N/A";
  } else if (typeof listing.location === "string") {
    locationText = listing.location;
  }

  const areaVal = typeof listing.area === "number" ? listing.area : 0;
  const areaFormatted = areaVal ? `${areaVal.toLocaleString("en-IN")}` : "N/A";
  const rentVal = typeof listing.rent === "number" ? listing.rent : 0;
  const monthlyRent = rentVal ? `${rentVal.toLocaleString("en-IN")}` : "N/A";
  const depositVal = typeof listing.securityDeposit === "number" ? listing.securityDeposit : 0;
  const deposit = depositVal ? `${depositVal.toLocaleString("en-IN")}` : "N/A";

  let parkingText = "Available";
  if (typeof listing.parking === "boolean") {
    parkingText = listing.parking ? "Available" : "Not Available";
  } else if (listing.parking && typeof listing.parking === "object" && listing.parking.available !== undefined) {
    parkingText = listing.parking.available ? "Available" : "Not Available";
  }

  let brokerageText = "No";
  if (typeof listing.brokerage === "boolean") {
    brokerageText = listing.brokerage ? "Yes" : "No";
  } else if (listing.brokerageDetails && typeof listing.brokerageDetails === "object") {
    if (listing.brokerageDetails.applicable) {
      if (listing.brokerageDetails.type === "percentage" && listing.brokerageDetails.value) {
        brokerageText = `Yes (${listing.brokerageDetails.value}%)`;
      } else if (listing.brokerageDetails.value) {
        brokerageText = `Yes (₹${listing.brokerageDetails.value.toLocaleString("en-IN")})`;
      } else {
        brokerageText = "Yes";
      }
    } else {
      brokerageText = "No";
    }
  }

  let maintenanceChargesText = "Included in Rent";
  if (listing.maintenanceCharges?.amount) {
    maintenanceChargesText = `${listing.maintenanceCharges.amount.toLocaleString("en-IN")}`;
  }

  let maintenanceFrequencyText = "Monthly";
  const rawFreq = listing.maintenanceCharges?.frequency;
  if (rawFreq) {
    if (rawFreq === "included") maintenanceFrequencyText = "Included in Rent";
    else if (rawFreq === "one_time") maintenanceFrequencyText = "One Time";
    else maintenanceFrequencyText = rawFreq.charAt(0).toUpperCase() + rawFreq.slice(1);
  }

  const availableFromDate = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Immediate";

  let tenantPrefText = "Anyone";
  if (listing.tenantPreference === "bachelors") tenantPrefText = "Bachelor's";
  else if (listing.tenantPreference === "family") tenantPrefText = "Family";
  else if (listing.tenantPreference === "anyone") tenantPrefText = "Anyone";
  else if (listing.tenantPreference) tenantPrefText = String(listing.tenantPreference);

  // Images
  const backendImages = listing.images?.map((i: any) => (typeof i === "string" ? i : i.url)).filter(Boolean) || [];
  const rawImages = backendImages.length > 0
    ? backendImages
    : listingData?.images && listingData.images.length > 0
      ? listingData.images
      : [];
  const imageList = rawImages.map((img: string) => resolveImageUrl(img) || img);

  // Amenities
  const rawAmenities = listing.amenities || listingData?.amenities || [];
  const amenitiesList: { _id?: string; name: string; image?: string }[] = [];
  if (Array.isArray(rawAmenities) && rawAmenities.length > 0) {
    rawAmenities.forEach((item: any) => {
      let aName = "";
      let imgUrl: string | undefined;
      let aId: string | undefined;
      if (typeof item === "string") {
        aId = item;
        const matched = options.amenities.find((opt) => opt._id === item || opt.name.toLowerCase() === item.toLowerCase());
        aName = matched ? matched.name : item;
        imgUrl = matched ? (matched.image?.url || (typeof matched.image === "string" ? matched.image : undefined)) : undefined;
      } else if (item && typeof item === "object") {
        aId = item._id;
        aName = item.name || "Amenity";
        imgUrl = item.image?.url || (typeof item.image === "string" ? item.image : undefined);
      }
      if (aName) amenitiesList.push({ _id: aId, name: aName, image: resolveImageUrl(imgUrl) });
    });
  }

  // House Rules
  const rawHouseRules = listing.houseRules || listingData?.houseRules || [];
  const houseRulesList = Array.isArray(rawHouseRules) ? rawHouseRules.filter(Boolean) : [];

  const description = listing.description || "Property details and information provided by owner.";

  return (
    <section className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16 overflow-hidden">

      {/* Top Image Gallery */}
      {imageList.length > 0 && (
        <div className="lg:hidden w-full max-w-8xl 3xl:max-w-[1450px] mx-auto mb-6 sm:mb-8 md:mb-10">
          <ListingMediaGallery images={imageList} title={propertyTitle} />
        </div>
      )}

      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border-1 border-gray-200 drop-shadow-md p-4 sm:p-10 md:p-14 transition-all bg-white overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center md:items-start gap-8 md:gap-14 lg:gap-16 w-full min-w-0">

          {/* LEFT SIDE / TOP (Mobile): Owner Avatar & Action Buttons */}
          <OwnerDetails
            userObj={userObj}
            listingData={listingData}
            targetId={listing._id}
            targetType="property"
            name={name}
            occupation={occupation}
            gender={gender}
            userMobile={userMobile}
            userImage={userImage}
            isOwner={isOwner}
          />


          {/* RIGHT SIDE: Property Information */}
          <div className="flex-1 w-full min-w-0 space-y-7 sm:space-y-8 md:space-y-10">
            {/* SECTION 1: BASIC OVERVIEW */}
            <div className="space-y-4 min-w-0">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                BASIC OVERVIEW  <span className="lg:hidden mb-0.5 px-3 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  Posted by {listing.postedBy}
                </span>
              </h3>

              <div className="flex items-start justify-between gap-4 min-w-0">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-black text-xl sm:text-2xl md:text-3xl font-regular break-words">
                      {propertyTitle}
                    </h2>
                    {listing.postedBy && (
                      <span className="hidden lg:block px-3 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        Posted by {listing.postedBy}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base font-regular break-words">
                    {categoryHeader}
                  </p>
                </div>

                {/* Wishlist Button */}
                {!isOwner && (
                  <div className="relative shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading}
                      className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer ${isWishlisted
                        ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-rose-600"
                        }`}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {wishlistLoading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-rose-500" />
                      ) : (
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-400 group-hover:text-rose-500"}`} />
                      )}
                      <span className="hidden sm:inline">{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
                    </button>
                    {wishlistMessage && (
                      <div className="absolute right-0 top-full mt-1.5 px-3 py-1 bg-slate-800 text-white text-xs rounded-md shadow-md whitespace-nowrap z-10 animate-in fade-in duration-200">
                        {wishlistMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6 pt-1 min-w-0">
                <div className="min-w-0">
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Location</span>
                  <div className="flex items-start gap-1.5 text-gray-800 text-sm sm:text-base font-medium mt-1 min-w-0">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="break-words min-w-0">{locationText}</span>
                  </div>
                </div>

                {/* <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Property Title</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{propertyTitle}</p>
                </div> */}
              </div>
            </div>

            {/* SECTION 2: MEDIA ASSETS MANAGEMENT (Conditional) */}
            {imageList.length > 0 && (
              <div className="hidden lg:block min-w-0 w-full">
                <hr className="border-gray-200 border-t my-4" />
                <div className="space-y-4 min-w-0 w-full">
                  <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                    MEDIA ASSETS MANAGEMENT
                  </h3>

                  {imageList.length > 0 && (
                    <div className="w-full min-w-0 mb-6 sm:mb-8 md:mb-10">
                      <ListingMediaGallery images={imageList} title={propertyTitle} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <hr className="border-gray-200 border-t my-4" />

            {/* SECTION 3: PROPERTY DETAILS */}
            <div className="space-y-4 min-w-0">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                PROPERTY DETAILS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-1 min-w-0">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Property Type</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1 capitalize">
                    {pTypeStr || "Property"}
                  </p>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Area (sqft)</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <LandPlot size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-base md:text-lg font-medium">{areaFormatted}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Furnishing Status</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1 capitalize">
                    {furnishing.replace(/_/g, " ")}
                  </p>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Parking Facility</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{parkingText}</p>
                </div>

                {listing.propertyDetails?.bedrooms && (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Bedrooms / BHK</span>
                    <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1 uppercase">
                      {listing.propertyDetails.bedrooms.replace(/_/g, " ")}
                    </p>
                  </div>
                )}

                {listing.propertyDetails?.facing && (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Facing</span>
                    <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1 capitalize">
                      {listing.propertyDetails.facing.replace(/_/g, "-")}
                    </p>
                  </div>
                )}

                {listing.propertyDetails?.floor !== undefined && (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Floor</span>
                    <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">
                      {listing.propertyDetails.floor === 0 ? "Ground Floor (0)" : `${listing.propertyDetails.floor}`}
                      {listing.propertyDetails.totalFloors !== undefined ? ` of ${listing.propertyDetails.totalFloors}` : ""}
                    </p>
                  </div>
                )}

                {listing.propertyDetails?.totalFloors !== undefined && (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Total Floors</span>
                    <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">
                      {listing.propertyDetails.totalFloors}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* SECTION 4: RENTAL SPECIFICATIONS */}
            <div className="space-y-4 min-w-0">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                RENTAL SPECIFICATIONS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-1 min-w-0">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Monthly Rent (₹)</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-base md:text-lg font-medium">{monthlyRent}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Security Deposit (₹)</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-base md:text-lg font-medium">{deposit}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Brokerage Applicable</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{brokerageText}</p>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Available From</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{availableFromDate}</p>
                </div>

                {listing.maintenanceCharges?.amount != 0 && (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Maintenance Charges (₹)</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                        <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                      </span>
                      <span className="text-black text-sm sm:text-base md:text-lg font-medium">{maintenanceChargesText}</span>
                    </div>
                  </div>
                )}

                {listing.maintenanceCharges?.amount != 0 && (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Maintenance Frequency</span>
                    <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{maintenanceFrequencyText}</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* SECTION 5: PREFERENCES */}
            <div className="space-y-4 min-w-0">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                PREFERENCES
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1 min-w-0">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Tenant Preference</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1 capitalize">
                    {tenantPrefText}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2 min-w-0">
                <span className="block text-gray-500 text-xs sm:text-sm font-medium">Description</span>
                <div className="mt-1 break-words min-w-0">
                  <RichTextRenderer content={description} />
                </div>
              </div>
            </div>

            {/* SECTION 6: AMENITIES */}
            {amenitiesList.length > 0 && (
              <>
                <hr className="border-gray-200 border-t my-4" />
                <div className="space-y-4 min-w-0">
                  <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                    AMENITIES
                  </h3>

                  <div className="flex flex-wrap items-start gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 pt-1 min-w-0">
                    {amenitiesList.map((am, idx) => (
                      <div
                        key={am._id || idx}
                        className="flex w-[64px] min-w-0 flex-col items-center sm:w-20 md:w-24"
                      >
                        <div className="relative h-10 w-14 sm:h-14 sm:w-20 md:h-16 md:w-24">
                          <div className="absolute bottom-0 left-0 h-7 w-full rounded-full bg-accent sm:h-10 md:h-11" />

                          <div className="absolute left-1/2 -top-1 z-10 -translate-x-1/2 sm:-top-2">
                            {am.image ? (
                              <img
                                src={am.image}
                                alt={am.name}
                                className="h-9 w-9 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14"
                              />
                            ) : (
                              getAmenityIcon(am.name)
                            )}
                          </div>
                        </div>

                        <span className="mt-1.5 w-full break-words text-center text-[11px] font-normal leading-tight text-gray-500 capitalize sm:text-sm md:text-base">
                          {am.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* House Rules */}
            {/* {houseRulesList && houseRulesList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">House Rules</h3>
                <ul className="space-y-2.5 pt-1">
                  {houseRulesList.map((rule: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <Check size={20} className="text-gray-900 shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm sm:text-base md:text-lg font-normal">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )} */}

            {/* Contact Action & Report Footer */}
            {!isOwner && (
              <>
                <hr className="lg:hidden border-gray-200 border-t my-4" />
                <div className="lg:hidden space-y-4 min-w-0">
                  <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                    {`Contact ${userObj?.name}`}
                  </h3>

                  <ContactAction
                    userObj={userObj}
                    listing={listing}
                    listingData={listingData}
                    targetId={listing._id}
                    targetType="property"
                    userMobile={String(userMobile)}
                    userImage={userImage}
                    isOwner={isOwner}
                  />
                </div>

                <hr className="border-gray-200 border-t my-4" />
                <div className="pt-2 text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                  <span>Found Wrong Information?</span>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="text-[#0066FF] cursor-pointer font-semibold transition-all"
                  >
                    <LineRoll text="Report Listing" lineClassName="bg-[#0066FF]" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="property"
        targetId={listing._id}
        ownerId={ownerId ? String(ownerId) : undefined}
      />

      <WishlistLoginModal
        isOpen={showWishlistLoginModal}
        onClose={() => setShowWishlistLoginModal(false)}
      />
    </section>
  );
}
