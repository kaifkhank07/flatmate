"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  MessageSquare,
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
  PartyPopper,
  CigaretteOff,
  Sun,
  Dog,
  Wine,
  Heart,
  Maximize2,
  Check,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { FlatmateRequirementItem } from "@/types/listing";
import { useAssets } from "@/data/assets";
import { useListingStore } from "@/store/useListingStore";
import { getMediaUrl } from "@/lib/api";
import { deleteFlatmateRequirementApi } from "@/lib/apiServices";
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

interface FlatmateRequirementPropertyDetailsProps {
  listing: FlatmateRequirementItem;
  slug?: string;
  listingData?: any;
}

export default function FlatmateRequirementPropertyDetails({
  listing,
  listingData,
}: FlatmateRequirementPropertyDetailsProps) {
  const router = useRouter();
  const assets = useAssets();
  const { options } = useListingStore();
  const resolveImageUrl = (url?: string) => getMediaUrl(url);

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const userObj = listing.userId;
  const name = listingData?.name || userObj?.name || "Requirement Creator";
  const userMobile = listingData?.userMobile || userObj?.mobile || userObj?.contact || "+91 98765 43210";
  const uAny = userObj as any;
  const userImage =
    (typeof uAny?.image === "string" ? uAny.image : uAny?.image?.url) ||
    (typeof uAny?.profileImage === "string" ? uAny.profileImage : uAny?.profileImage?.url) ||
    (typeof uAny?.avatar === "string" ? uAny.avatar : uAny?.avatar?.image?.url) ||
    undefined;

  const postTitle = listing.title || listingData?.pgName || "Flatmate Requirement for Property";
  const pType = listing.propertyType || (listing as any).housingType || "property";
  const furnishing = listing.furnishing || "semi_furnished";
  const categoryHeader = `FLATMATE NEEDED | ${pType.replace(/_/g, " ").toUpperCase()} | ${furnishing.replace(/_/g, " ").toUpperCase()}`;

  let locationText = "Location N/A";
  if (typeof listing.location === "object" && listing.location) {
    locationText = listing.location.formattedAddress || listing.location.city || "Location N/A";
  } else if (typeof listing.location === "string") {
    locationText = listing.location;
  }

  const rentVal = typeof listing.rent === "number" ? listing.rent : 0;
  const rentFormatted = rentVal ? `${rentVal.toLocaleString("en-IN")}` : "N/A";

  const genderPreference = listing.genderPreference
    ? listing.genderPreference.charAt(0).toUpperCase() + listing.genderPreference.slice(1)
    : "Any";
  const occupationPreference = listing.occupationPreference
    ? listing.occupationPreference.replace(/_/g, " ").toUpperCase()
    : "Any";
  const availableFromDate = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Immediate";

  // Images
  const backendImages = listing.images?.map((i) => i.url) || [];
  const imageList = backendImages.length > 0
    ? backendImages
    : listingData?.images && listingData.images.length > 0
      ? listingData.images
      : [assets.property01, assets.property02, assets.property03];

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

  const description = listing.description || "Looking for a flatmate to share this property.";


  return (
    <section className="w-full py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border-1 border-gray-200 drop-shadow-md p-6 sm:p-10 md:p-14 transition-all bg-white">
        <div className="flex flex-col lg:flex-row items-center md:items-start gap-8 md:gap-14 lg:gap-16">

          {/* LEFT SIDE: Creator Avatar & Action Buttons */}
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

          {/* RIGHT SIDE: Property & Flatmate Requirement Info */}
          <div className="flex-1 w-full space-y-7 sm:space-y-8 md:space-y-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-black text-xl sm:text-2xl md:text-3xl font-regular">
                  {postTitle}
                </h2>
                <p className="text-gray-500 text-sm sm:text-base font-regular">
                  {categoryHeader}
                </p>
              </div>

              {/* Edit & Delete Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-1">
                {(listing?.status === "pending" || listing?.status === "rejected") && (
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

            {/* Location */}
            <div className="space-y-1.5">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Location</h3>
              <div className="flex items-start gap-1.5 text-gray-500 text-sm sm:text-lg font-regular">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                <span>{locationText}</span>
              </div>
            </div>

            <hr className="border-gray-200 border-t my-4" />

            {/* Financial Details */}
            <div className="space-y-3">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Rent & Availability</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Approx Rent</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full border-2 border-accent">
                      <IndianRupee size={13} strokeWidth={2} className="text-accent" />
                    </span>
                    <span className="text-black text-sm sm:text-lg md:text-xl font-medium">{rentFormatted}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Available From</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{availableFromDate}</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-3">
              <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Preferences</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Gender Preference</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{genderPreference}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm sm:text-lg font-regular">Occupation Preference</span>
                  <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{occupationPreference}</p>
                </div>
              </div>
            </div>

            {/* Lifestyle Preferences */}
            {preferencesList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Lifestyle Preferences</h3>
                <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
                  {preferencesList.map((pref, idx) => (
                    <div key={pref._id || idx} className="flex flex-col items-center min-w-[72px]">
                      <div className="relative w-20 sm:w-24 md:w-28 h-14 sm:h-16">
                        <div className="absolute bottom-0 left-0 w-full h-10 sm:h-11 md:h-12 bg-accent rounded-full" />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 sm:-top-2 z-10">
                          {pref.image ? (
                            <img src={pref.image} alt={pref.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                          ) : (
                            getPreferenceVisual(pref.name)
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm sm:text-base md:text-lg font-regular mt-1 capitalize">
                        {pref.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {imageList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">Photos</h3>
                <div className="w-full overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-max">
                    {imageList.map((imgSrc: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className="relative group h-36 sm:h-44 md:h-52 w-48 sm:w-60 md:w-72 rounded-[20px] sm:rounded-[24px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 cursor-pointer shrink-0 transition-all hover:shadow-md hover:scale-[1.01]"
                      >
                        <img
                          src={imgSrc}
                          alt={`${postTitle} ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-gray-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-100 scale-95 shadow-md">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
        images={imageList}
        selectedIndex={selectedImageIndex ?? 0}
        onSelectIndex={(idx) => setSelectedImageIndex(idx)}
        title={postTitle}
      />

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
