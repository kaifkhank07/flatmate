"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  MessageSquare,
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
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PropertyListingItem } from "@/types/listing";
import { useAssets } from "@/data/assets";
import { useListingStore } from "@/store/useListingStore";
import { getMediaUrl } from "@/lib/api";
import { deletePropertyApi } from "@/lib/apiServices";
import { ImageGalleryModal } from "@/components/listing/shared/modals";
import DeleteConfirmModal from "@/components/listing/shared/modals/DeleteConfirmModal";

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
  const assets = useAssets();
  const { options } = useListingStore();
  const resolveImageUrl = (url?: string) => getMediaUrl(url);

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const userObj = listing.userId || listing.ownerId;
  const name = listingData?.name || userObj?.name || "Property Owner";
  const userMobile = listingData?.userMobile || userObj?.mobile || userObj?.contact || "+91 98765 43210";
  const uAny = userObj as any;
  const userImage =
    (typeof uAny?.image === "string" ? uAny.image : uAny?.image?.url) ||
    (typeof uAny?.profileImage === "string" ? uAny.profileImage : uAny?.profileImage?.url) ||
    (typeof uAny?.avatar === "string" ? uAny.avatar : uAny?.avatar?.image?.url) ||
    undefined;

  const propertyTitle = listing.title || listingData?.pgName || "Property Listing";
  const pType = listing.propertyType || listing.listingType || "property";
  const furnishing = listing.furnishing || "semi_furnished";
  const categoryHeader = `${pType.replace(/_/g, " ").toUpperCase()} | ${furnishing.replace(/_/g, " ").toUpperCase()}`;

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
  if (typeof listing.parking === "boolean") {
    parkingText = listing.parking ? "Available" : "Not Available";
  } else if (listing.parking && typeof listing.parking === "object" && listing.parking.available !== undefined) {
    parkingText = listing.parking.available ? "Available" : "Not Available";
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

  const genderPreference = listing.genderPreference ? listing.genderPreference.charAt(0).toUpperCase() + listing.genderPreference.slice(1) : "Any";
  const occupationPreference = listing.occupationPreference ? listing.occupationPreference.replace(/_/g, " ").toUpperCase() : "Any";
  const availableFromDate = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Immediate";

  // Images
  const backendImages = listing.images?.map((i: any) => (typeof i === "string" ? i : i.url)).filter(Boolean) || [];
  const imageList = backendImages.length > 0
    ? backendImages
    : listingData?.images && listingData.images.length > 0
      ? listingData.images
      : [];

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <section className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border-1 border-gray-200 drop-shadow-md p-6 sm:p-10 md:p-14 transition-all bg-white">
        <div className="flex flex-col lg:flex-row items-center md:items-start gap-8 md:gap-14 lg:gap-16">

          {/* LEFT SIDE: Owner Avatar & Action Buttons */}
          {/* <div className="flex flex-col items-center gap-3 md:gap-4 shrink-0 w-full md:w-56 lg:w-64">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#3BB799] shadow-inner">
              {userImage ? (
                <img src={userImage} alt={name} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <circle cx="50" cy="50" r="50" fill="#3BB799" />
                  <circle cx="50" cy="44" r="19" fill="#F8B195" />
                  <path d="M18 96C18 76 32 68 50 68C68 68 82 76 82 96V100H18V96Z" fill="#EC4899" />
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

          {/* RIGHT SIDE: Property Information */}
          <div className="flex-1 w-full space-y-7 sm:space-y-8 md:space-y-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-black text-xl sm:text-2xl md:text-3xl font-regular">
                    {propertyTitle}
                  </h2>
                  {status && (
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-medium capitalize border ${
                        status === "approved"
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

            {/* Location */}
            <div className="space-y-1.5">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Location</h3>
              <div className="flex items-start gap-1.5 text-gray-500 text-sm sm:text-lg font-regular">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                <span>{locationText}</span>
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* Rent Info */}
            <div className="space-y-4">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Rent Info</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Monthly Rent</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-lg md:text-xl font-medium">{monthlyRent}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Deposit</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-lg md:text-xl font-medium">{deposit}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Area (sqft)</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <LandPlot size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-lg md:text-xl font-medium">{areaFormatted}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Parking</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{parkingText}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Maintenance Charges</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-lg md:text-xl font-medium">{maintenanceChargesText}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Maintenance Frequency</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{maintenanceFrequencyText}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Furnishing</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1 capitalize">
                    {furnishing.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="space-y-3">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Tenant Preferences</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Gender Preference</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{genderPreference}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Occupation Preference</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{occupationPreference}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Available From</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{availableFromDate}</p>
                </div>
              </div>
            </div>

            {/* Images */}
            {imageList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Property Media</h3>
                <div className="w-full overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-max">
                    {imageList.map((imgSrc: string, idx: number) => {
                      const displaySrc = imgSrc.startsWith("http") || imgSrc.startsWith("blob:") || imgSrc.startsWith("data:") ? imgSrc : resolveImageUrl(imgSrc);
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className="relative group h-36 sm:h-44 md:h-52 w-48 sm:w-60 md:w-72 rounded-[20px] sm:rounded-[24px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 cursor-pointer shrink-0 transition-all hover:shadow-md hover:scale-[1.01]"
                        >
                          <img
                            src={displaySrc}
                            alt={`${propertyTitle} ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-gray-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-100 scale-95 shadow-md">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Amenities</h3>
                <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
                  {amenitiesList.map((am, idx) => (
                    <div key={am._id || idx} className="flex flex-col items-center min-w-[72px]">
                      <div className="relative w-20 sm:w-24 md:w-28 h-14 sm:h-16">
                        <div className="absolute bottom-0 left-0 w-full h-10 sm:h-11 md:h-12 bg-accent rounded-full" />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 sm:-top-2 z-10">
                          {am.image ? (
                            <img src={am.image} alt={am.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                          ) : (
                            getAmenityIcon(am.name)
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm sm:text-base md:text-lg font-regular mt-1 capitalize">
                        {am.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {houseRulesList.length > 0 && (
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
            )}

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Description</h3>
              <p className="text-gray-800 text-sm sm:text-lg font-regular leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
      </div>

      <ImageGalleryModal
        isOpen={selectedImageIndex !== null && selectedImageIndex !== undefined && imageList.length > 0}
        onClose={() => setSelectedImageIndex(null)}
        images={imageList.map((img: string) => img.startsWith("http") || img.startsWith("blob:") || img.startsWith("data:") ? img : resolveImageUrl(img))}
        selectedIndex={selectedImageIndex ?? 0}
        onSelectIndex={(idx) => setSelectedImageIndex(idx)}
        title={propertyTitle}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        targetType="property"
        targetId={listing._id}
        itemTitle={propertyTitle}
      />
    </section>
  );
}
