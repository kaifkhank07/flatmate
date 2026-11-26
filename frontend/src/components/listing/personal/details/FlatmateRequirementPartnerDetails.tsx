"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  MessageSquare,
  IndianRupee,
  Dumbbell,
  PartyPopper,
  CigaretteOff,
  Sun,
  Dog,
  Wine,
  Heart,
  Eye,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  Hash,
  Copy,
  LandPlot,
  Sparkles,
  Tv,
  Refrigerator,
  UtensilsCrossed,
  Wifi,
  Wind,
  ShieldCheck,
  Flame,
  Zap,
  Shirt,
  Car,
  Maximize2,
  Check,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FlatmateRequirementItem } from "@/types/listing";
import { useListingStore } from "@/store/useListingStore";
import { getMediaUrl } from "@/lib/api";
import { deleteFlatmateRequirementApi } from "@/lib/apiServices";
import DeleteConfirmModal from "@/components/listing/shared/modals/DeleteConfirmModal";
import ListingMediaGallery from "@/components/listing/shared/ListingMediaGallery";
import RichTextRenderer from "@/components/listing/shared/RichTextRenderer";

const getPreferenceVisual = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("owl") || lower.includes("night")) return <span className="text-xl filter drop-shadow-sm select-none">🦉</span>;
  if (lower.includes("fitness") || lower.includes("gym")) return <Dumbbell className="w-6 h-6 text-cyan-300 stroke-[2.2]" />;
  if (lower.includes("party") || lower.includes("social")) return <PartyPopper className="w-6 h-6 text-yellow-300 stroke-[2.2]" />;
  if (lower.includes("smoker") || lower.includes("smoking")) return <CigaretteOff className="w-6 h-6 text-orange-400 stroke-[2.2]" />;
  if (lower.includes("early bird") || lower.includes("morning")) return <Sun className="w-6 h-6 text-amber-400 stroke-[2.2]" />;
  if (lower.includes("pet") || lower.includes("dog")) return <Dog className="w-6 h-6 text-amber-300 stroke-[2.2]" />;
  if (lower.includes("drink") || lower.includes("alcohol")) return <Wine className="w-6 h-6 text-purple-300 stroke-[2.2]" />;
  return <Heart className="w-6 h-6 text-rose-300 stroke-[2.2]" />;
};

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

interface FlatmateRequirementPartnerDetailsProps {
  listing: FlatmateRequirementItem;
  slug?: string;
  listingData?: any;
}

export default function FlatmateRequirementPartnerDetails({
  listing,
  listingData,
}: FlatmateRequirementPartnerDetailsProps) {
  const router = useRouter();
  const { options } = useListingStore();
  const resolveImageUrl = (url?: string) => getMediaUrl(url);

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (!listing._id) return;
    navigator.clipboard.writeText(listing._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatDateTime = (dateVal?: string | Date) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const userObj = listing.userId;
  const name = listingData?.name || userObj?.name || "Roommate Seeker";
  const userMobile = listingData?.userMobile || userObj?.mobile || userObj?.contact || "+91 98765 43210";
  const uAny = userObj as any;
  const userImage =
    (typeof uAny?.image === "string" ? uAny.image : uAny?.image?.url) ||
    (typeof uAny?.profileImage === "string" ? uAny.profileImage : uAny?.profileImage?.url) ||
    (typeof uAny?.avatar === "string" ? uAny.avatar : uAny?.avatar?.image?.url) ||
    undefined;

  const partnerType = listing.partnerType ? listing.partnerType.toUpperCase() : "FLATMATE";
  const postTitle = listing.title || `Looking for a ${partnerType} Partner`;
  const furnishing = listing.furnishing ? listing.furnishing.replace(/_/g, " ").toUpperCase() : "";
  const categoryHeader = furnishing ? `LOOKING FOR ${partnerType} | ${furnishing}` : `LOOKING FOR ${partnerType}`;

  const status = listing?.status || listingData?.status;
  const rejectionReason = listing?.rejectionReason || listingData?.rejectionReason;
  const isRejected = status === "rejected";

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
  const parkingObj = listing.parking as any;
  if (typeof parkingObj === "boolean") {
    parkingText = parkingObj ? "Available" : "Not Available";
  } else if (parkingObj && typeof parkingObj === "object" && parkingObj.available !== undefined) {
    parkingText = parkingObj.available ? "Available" : "Not Available";
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

  const genderPreference = listing.genderPreference
    ? listing.genderPreference.charAt(0).toUpperCase() + listing.genderPreference.slice(1)
    : "Any";
  const occupationPreference = listing.occupationPreference
    ? listing.occupationPreference.replace(/_/g, " ").toUpperCase()
    : "Any";
  const availableFromDate = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Immediate";

  // Photos if uploaded
  const rawImages = listing.images || listingData?.images || [];
  const imageList = Array.isArray(rawImages) && rawImages.length > 0
    ? rawImages
      .map((img: any) => {
        if (!img) return null;
        if (typeof img === "string") return resolveImageUrl(img);
        return resolveImageUrl(img.url);
      })
      .filter(Boolean) as string[]
    : [];

  // User Preferences
  const rawPreferences = listing.userPreferences || listingData?.lifestylePreferences || [];
  const preferencesList: { _id?: string; name: string; image?: string }[] = [];
  if (Array.isArray(rawPreferences) && rawPreferences.length > 0) {
    rawPreferences.forEach((item: any) => {
      let pName = "";
      let imgUrl: string | undefined;
      let pId: string | undefined;
      if (typeof item === "string") {
        pId = item;
        const matched = options.lifestylePreferences.find(
          (opt) => opt._id === item || opt.name.toLowerCase() === item.toLowerCase()
        );
        pName = matched ? matched.name : item;
        imgUrl = matched ? (typeof matched.image === "string" ? matched.image : matched.image?.url) : undefined;
      } else if (item && typeof item === "object") {
        pId = item._id;
        pName = item.name || "Preference";
        imgUrl = item.image?.url || (typeof item.image === "string" ? item.image : undefined);
      }
      if (pName) preferencesList.push({ _id: pId, name: pName, image: resolveImageUrl(imgUrl) });
    });
  }

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

  const description = listing.description || "Looking for a compatible roommate/flatmate to move in together or share a place.";


  return (
    <section className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16 overflow-hidden">
      {/* Top Image Gallery */}
      {imageList.length > 0 && (
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto mb-6 sm:mb-8 md:mb-10">
          <ListingMediaGallery images={imageList} title={postTitle} />
        </div>
      )}

      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border-1 border-gray-200 drop-shadow-md p-6 sm:p-10 md:p-14 transition-all bg-white">
        <div className="flex flex-col lg:flex-row items-center md:items-start gap-8 md:gap-14 lg:gap-16">

          {/* LEFT SIDE: Partner Seeker Avatar & Action Buttons */}
          {/* <div className="flex flex-col items-center gap-3 md:gap-4 shrink-0 w-full md:w-56 lg:w-64">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#10B981] shadow-inner">
              {userImage ? (
                <img src={userImage} alt={name} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <circle cx="50" cy="50" r="50" fill="#10B981" />
                  <circle cx="50" cy="44" r="19" fill="#F8B195" />
                  <path d="M18 96C18 76 32 68 50 68C68 68 82 76 82 96V100H18V96Z" fill="#6366F1" />
                </svg>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-regular text-[#1E3A8A] text-center tracking-tight">
              {name}
            </h2>

            <div className="flex flex-row lg:flex-col justify-center gap-3 w-full items-center">
              <button
                type="button"
                onClick={() => setShowCallModal(true)}
                className="w-28 py-2 px-3 bg-blue-700 hover:bg-accent text-white font-light text-sm sm:text-base md:text-lg rounded-full flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Phone size={20} />
                <span>Call</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChatModal(true)}
                className="w-28 py-2 px-3 bg-accent hover:bg-blue-700 text-white font-light text-sm sm:text-base md:text-lg rounded-full flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <MessageSquare size={20} />
                <span>Chat</span>
              </button>
            </div>
          </div> */}

          {/* RIGHT SIDE: Partner Requirement Info */}
          <div className="flex-1 w-full space-y-7 sm:space-y-8 md:space-y-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-black text-xl sm:text-2xl md:text-3xl font-regular">
                    {postTitle}
                  </h2>
                  {status && (
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-medium capitalize border ${status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                    >
                      {status}
                    </span>
                  )}
                  {listing.postedBy && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200">
                      Posted by {listing.postedBy}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm sm:text-base font-regular">
                  {categoryHeader}
                </p>
              </div>

              {/* Edit & Delete Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-1">
                {/* {(listing?.status === "pending" || listing?.status === "rejected") && ( */}
                {(listing?.status === "pending") && (
                  <Link
                    href={`/my-listings/edit/${listing._id}`}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
                    title="Edit Listing"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>

            {/* Rejection Alert Banner */}
            {isRejected && (
              <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border border-red-200 text-red-900 shadow-xs space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-semibold text-red-900">
                        Listing Rejected by Moderation
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-200/80 text-red-800 uppercase tracking-wide">
                        Action Required
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 border border-red-200/70 text-xs sm:text-sm text-red-900">
                      <span className="font-semibold text-red-800 block mb-0.5">Reason for rejection:</span>
                      <p className="leading-relaxed text-red-950 font-medium">
                        {rejectionReason || "This listing was reviewed and rejected because it did not meet our community posting guidelines. Please update your details and re-submit."}
                      </p>
                    </div>

                    <p className="text-xs text-red-700 leading-relaxed">
                      You can modify your listing details and submit it again for approval.
                    </p>

                    <div className="pt-1">
                      <Link
                        href={`/my-listings/edit/${listing._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Update & Re-submit Listing</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: REQUIREMENT OVERVIEW */}
            <div className="space-y-4">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                REQUIREMENT OVERVIEW
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Location</span>
                  <div className="flex items-start gap-1.5 text-gray-800 text-sm sm:text-base font-medium mt-1">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{locationText}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Title</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{postTitle}</p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* SECTION 2: SPACE DETAILS */}
            <div className="space-y-4">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                SPACE DETAILS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-1">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Area (sq.ft)</span>
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
                    {listing.furnishing ? listing.furnishing.replace(/_/g, " ") : "N/A"}
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

            {/* SECTION 3: RENTAL SPECIFICATIONS */}
            <div className="space-y-4">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                RENTAL SPECIFICATIONS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-1">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Occupancy Preference</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1 capitalize">
                    {listing.occupancyPreference ? listing.occupancyPreference.replace(/_/g, " ") : "Single"}
                  </p>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Rent Amount (₹/mo)</span>
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
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">
                    {listing.brokerage ? "Yes (Brokerage Applicable)" : "No (Zero Brokerage)"}
                  </p>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Available From</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{availableFromDate}</p>
                </div>

                {listing.maintenanceCharges?.amount ? (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Maintenance Charges (₹)</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                        <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                      </span>
                      <span className="text-black text-sm sm:text-base md:text-lg font-medium">{maintenanceChargesText}</span>
                    </div>
                  </div>
                ) : null}

                {listing.maintenanceCharges?.frequency ? (
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Maintenance Frequency</span>
                    <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{maintenanceFrequencyText}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* SECTION 4: PREFERENCES */}
            <div className="space-y-4">
              <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                PREFERENCES
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Gender Preference</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{genderPreference}</p>
                </div>

                <div>
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">Occupation Preference</span>
                  <p className="text-black text-sm sm:text-base md:text-lg font-medium mt-1">{occupationPreference}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <span className="block text-gray-500 text-xs sm:text-sm font-medium">Description</span>
                <div className="mt-1">
                  <RichTextRenderer content={description} />
                </div>
              </div>

              {/* Lifestyle Preferences */}
              {preferencesList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">
                    Lifestyle Preferences ({preferencesList.length} selected)
                  </span>

                  <div className="flex flex-wrap items-start gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 pt-1">
                    {preferencesList.map((pref, idx) => (
                      <div
                        key={pref._id || idx}
                        className="flex w-[64px] min-w-0 flex-col items-center sm:w-20 md:w-24"
                      >
                        <div className="relative h-10 w-14 sm:h-14 sm:w-20 md:h-16 md:w-24">
                          <div className="absolute bottom-0 left-0 h-7 w-full rounded-full bg-accent sm:h-10 md:h-11" />

                          <div className="absolute left-1/2 -top-1 z-10 -translate-x-1/2 sm:-top-2">
                            {pref.image ? (
                              <img
                                src={pref.image}
                                alt={pref.name}
                                className="h-9 w-9 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14"
                              />
                            ) : (
                              getPreferenceVisual(pref.name)
                            )}
                          </div>
                        </div>

                        <span className="mt-1.5 w-full break-words text-center text-[11px] font-normal leading-tight text-gray-500 capitalize sm:text-sm md:text-base">
                          {pref.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {amenitiesList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="block text-gray-500 text-xs sm:text-sm font-medium">
                    Amenities ({amenitiesList.length} selected)
                  </span>

                  <div className="flex flex-wrap items-start gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-8 pt-1">
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
              )}
            </div>

            {/* SECTION 5: MEDIA ASSETS MANAGEMENT (Conditional) */}
            {imageList.length > 0 && (
              <>
                <hr className="border-gray-200 border-t my-4" />
                <div className="space-y-4">
                  <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                    MEDIA ASSETS MANAGEMENT
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Photos uploaded for this requirement ({imageList.length})
                  </p>
                </div>
              </>
            )}

            <hr className="border-gray-200 border-t my-4" />

            {/* SECTION: LISTING INFORMATION & ACTIVITY */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-blue shrink-0" />
                <h3 className="text-brand-blue font-semibold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide uppercase">
                  LISTING INFORMATION & ACTIVITY
                </h3>
              </div>

              <div className="bg-[#F8FBFE] border border-[#E2EFF8] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Status */}
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Listing Status</span>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize border ${status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${status === "approved"
                            ? "bg-emerald-500"
                            : status === "rejected"
                              ? "bg-red-500"
                              : status === "pending"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                            }`}
                        />
                        {status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Favourite Count */}
                  <div>
                    <span className="block text-gray-500 text-xs sm:text-sm font-medium">Favourites</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                      <span className="text-black text-xs sm:text-sm md:text-base font-medium">
                        {listing.favoriteCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Listing ID */}
                  {/* {listing._id && (
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm font-medium">Listing ID</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="font-mono text-xs sm:text-sm text-gray-800 font-medium truncate max-w-[140px] sm:max-w-[180px]">
                          {listing._id}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyId}
                          className="text-gray-400 hover:text-brand-blue transition-colors p-1"
                          title="Copy Listing ID"
                        >
                          {copiedId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )} */}

                  {/* Created On */}
                  {listing.createdAt && (
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm font-medium">Created On</span>
                      <p className="text-black text-xs sm:text-sm md:text-base font-medium mt-1">
                        {formatDateTime(listing.createdAt)}
                      </p>
                    </div>
                  )}

                  {/* Last Updated */}
                  {/* {listing.updatedAt && (
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm font-medium">Last Updated</span>
                      <p className="text-black text-xs sm:text-sm md:text-base font-medium mt-1">
                        {formatDateTime(listing.updatedAt)}
                      </p>
                    </div>
                  )} */}

                  {/* Published / Approved Date */}
                  {(listing.approvedAt || listing.publishedAt) && (
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm font-medium">
                        {listing.approvedAt ? "Approved On" : "Published On"}
                      </span>
                      <p className="text-black text-xs sm:text-sm md:text-base font-medium mt-1">
                        {formatDateTime(listing.approvedAt || listing.publishedAt)}
                      </p>
                    </div>
                  )}

                  {/* Views Count (if available) */}
                  {/* {typeof listing.viewsCount === "number" && (
                    <div>
                      <span className="block text-gray-500 text-xs sm:text-sm font-medium">Views</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Eye className="w-4 h-4 text-brand-blue shrink-0" />
                        <span className="text-black text-xs sm:text-sm md:text-base font-medium">
                          {listing.viewsCount}
                        </span>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        targetType="flatmaterequirement"
        targetId={listing._id}
        itemTitle={postTitle}
      />
    </section>
  );
}
