"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    MapPin,
    Phone,
    MessageSquare,
    Check,
    Tv,
    Refrigerator,
    UtensilsCrossed,
    Wifi,
    Dumbbell,
    PartyPopper,
    CigaretteOff,
    Flame,
    AlertCircle,
    X,
    Send,
    IndianRupee,
    ChevronLeft,
    ChevronRight,
    Loader2,
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
} from "lucide-react";
import LineRoll from "../utils/LineRoll";
import { useAssets } from "@/data/assets";
import { useListingStore } from "@/store/useListingStore";
import { PropertyListingItem, FlatmateRequirementItem } from "@/types/listing";

// Helper function for amenity icon resolution
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

// Helper function for preference visual resolution
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

interface ListingDetailsProps {
    slug?: string;
    listingData?: {
        name?: string;
        pgName?: string;
        pgCategory?: string;
        location?: string;
        gender?: string;
        rent?: string;
        occupancy?: string;
        lookingFor?: string;
        singleSharing?: string;
        doubleSharing?: string;
        tripleSharing?: string;
        deposit?: string;
        electricity?: string;
        noticePeriod?: string;
        image?: string;
        images?: string[];
        description?: string;
        highlights?: string[];
        houseRules?: string[];
        userMobile?: string;
        userEmail?: string;
        amenities?: any[];
        preferences?: any[];
        lifestylePreferences?: any[];
    };
}

export default function ListingDetails({ slug: propSlug, listingData }: ListingDetailsProps) {
    const assets = useAssets();
    const params = useParams();
    const activeSlug = propSlug || (params?.slug as string);

    const { selectedListing, loadingDetails, fetchListingBySlug, options, fetchListingOptions, error } = useListingStore();

    // Fetch listing details and listing options on load
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

    // Image URL helper for relative/absolute paths
    const resolveImageUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
            return url;
        }
        const apiBase = (`${process.env.NEXT_PUBLIC_API_URL}/api`).replace(/\/api\/?$/, "");
        return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    // Compute dynamic values from selectedListing
    const isProperty = selectedListing?.sourceType === "property";
    const isFlatmate = selectedListing?.sourceType === "flatmate_requirement";

    const propertyDoc = isProperty ? (selectedListing as PropertyListingItem) : null;
    const flatmateDoc = isFlatmate ? (selectedListing as FlatmateRequirementItem) : null;

    // User details (Name, Contact, Email, Image/Avatar)
    const userObj = propertyDoc?.ownerId || flatmateDoc?.userId;
    const name = listingData?.name || userObj?.name || "Neha Shah";
    const gender = listingData?.gender || userObj?.gender || "Female";
    const userMobile = listingData?.userMobile || userObj?.mobile || userObj?.contact || "+91 98765 43210";
    const userEmail = listingData?.userEmail || userObj?.email || "";
    const userImage = userObj?.image || userObj?.profileImage || userObj?.avatar;

    // Listing Details (PG Name, Category, Location, Rent, etc.)
    const pgName = listingData?.pgName || propertyDoc?.title || flatmateDoc?.title || "Sumit PG";

    let computedCategory = "PG For Boys & Girls   |   For Students & Professionals";
    if (propertyDoc) {
        computedCategory = `${propertyDoc.listingType?.replace(/_/g, " ").toUpperCase() || "PROPERTY"} | ${propertyDoc.furnishing?.replace(/_/g, " ").toUpperCase() || "FURNISHED"}`;
    } else if (flatmateDoc) {
        computedCategory = `${flatmateDoc.partnerType?.toUpperCase() || flatmateDoc.postType?.toUpperCase() || "FLATMATE"} | ${flatmateDoc.occupationPreference?.replace(/_/g, " ").toUpperCase() || "ANY OCCUPATION"}`;
    }
    const pgCategory = listingData?.pgCategory || computedCategory;

    // Location
    let computedLocation = "Rohini Sector 16, Pocket 8, Sector 16G, Rohini, New Delhi, Delhi, India";
    const locObj = propertyDoc?.location || flatmateDoc?.location;
    if (locObj && typeof locObj === "object") {
        computedLocation = locObj.formattedAddress || locObj.city || computedLocation;
    }
    const location = listingData?.location || computedLocation;

    // Gender & Rent Info
    // const gender = listingData?.gender || propertyDoc?.genderPreference || flatmateDoc?.genderPreference || "Female";

    let computedRent = "₹15,000";
    if (typeof propertyDoc?.rent === "number") {
        computedRent = `₹${propertyDoc.rent.toLocaleString()}`;
    } else if (typeof flatmateDoc?.budget === "number") {
        computedRent = `₹${flatmateDoc.budget.toLocaleString()}`;
    }
    const rent = listingData?.rent || computedRent;

    const occupancy = listingData?.occupancy || (propertyDoc ? propertyDoc.bedrooms ? `${propertyDoc.bedrooms} BHK` : "Single" : flatmateDoc?.peopleCount ? `${flatmateDoc.peopleCount} Person` : "Single");
    const lookingFor = listingData?.lookingFor || (propertyDoc ? propertyDoc.genderPreference : flatmateDoc?.genderPreference) || "Any";

    const sourceType = selectedListing?.sourceType || 'property';

    const cleanAmount = (val?: string | number) => {
        if (!val) return "15000";
        const str = String(val).replace(/^(Rs\.?|INR)\s*/i, "").trim();
        return str || "15000";
    };

    // Rent Info entries
    const monthlyRent = cleanAmount(listingData?.rent || propertyDoc?.rent);
    const deposit = cleanAmount(listingData?.deposit || propertyDoc?.securityDeposit);

    let parkingText = "Available";
    if (propertyDoc?.parking?.available !== undefined) {
        parkingText = propertyDoc.parking.available ? "Available" : "Not Available";
    } else if ((propertyDoc as any)?.parkingAvailable !== undefined) {
        parkingText = (propertyDoc as any).parkingAvailable ? "Available" : "Available";
    }

    let maintenanceChargesText = "Included in Rent";
    if (propertyDoc?.maintenanceCharges?.amount) {
        maintenanceChargesText = `${propertyDoc.maintenanceCharges.amount}`;
    } else if ((propertyDoc as any)?.maintenanceAmount) {
        maintenanceChargesText = `${(propertyDoc as any).maintenanceAmount}`;
    }

    let maintenanceFrequencyText = "Monthly";
    const rawFreq = propertyDoc?.maintenanceCharges?.frequency || (propertyDoc as any)?.maintenanceFrequency;
    if (rawFreq) {
        if (rawFreq === "included") {
            maintenanceFrequencyText = "Included in Rent";
        } else if (rawFreq === "one_time") {
            maintenanceFrequencyText = "One Time";
        } else {
            maintenanceFrequencyText = rawFreq.charAt(0).toUpperCase() + rawFreq.slice(1);
        }
    }

    // Images list
    const backendImages = propertyDoc?.images?.map((i) => i.url) || flatmateDoc?.images?.map((i) => i.url);
    const imageList = listingData?.images && listingData.images.length > 0
        ? listingData.images
        : backendImages && backendImages.length > 0
            ? backendImages
            : listingData?.image
                ? [listingData.image]
                : [assets.property01, assets.property02, assets.property03];

    // House Rules (dynamic only)
    const rawHouseRules =
        listingData?.houseRules ||
        listingData?.highlights ||
        propertyDoc?.houseRules ||
        (flatmateDoc as any)?.houseRules;

    let houseRulesList: string[] = [];
    if (Array.isArray(rawHouseRules)) {
        houseRulesList = rawHouseRules.map((r: any) => String(r).trim()).filter(Boolean);
    } else if (typeof rawHouseRules === "string" && rawHouseRules.trim()) {
        houseRulesList = rawHouseRules.split(/,|\n/).map((r) => r.trim()).filter(Boolean);
    }

    // Dynamic Amenities Resolution
    const rawAmenities = listingData?.amenities || propertyDoc?.amenities || (flatmateDoc as any)?.amenities;
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
                    imgUrl = matchedOpt.image?.url || (typeof matchedOpt.image === "string" ? matchedOpt.image : undefined);
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

                if (!imgUrl && (id || name)) {
                    const matchedOpt = options.amenities.find(
                        (opt) => opt._id === id || opt.name.toLowerCase() === name.toLowerCase()
                    );
                    if (matchedOpt) {
                        imgUrl = matchedOpt.image?.url || (typeof matchedOpt.image === "string" ? matchedOpt.image : undefined);
                    }
                }
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
    } else {
        amenitiesList.push(
            { name: "Tv" },
            { name: "Fridge" },
            { name: "Kitchen" },
            { name: "Wifi" }
        );
    }

    // Dynamic Preferences Resolution
    const rawPreferences =
        listingData?.preferences ||
        listingData?.lifestylePreferences ||
        flatmateDoc?.lifestylePreferences ||
        (propertyDoc as any)?.lifestylePreferences ||
        (userObj as any)?.preferences ||
        (userObj as any)?.profile?.preferences;

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
                    imgUrl = typeof matchedOpt.image === "string" ? matchedOpt.image : matchedOpt.image?.url;
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

                if (!imgUrl && (id || name)) {
                    const matchedOpt = options.lifestylePreferences.find(
                        (opt) => opt._id === id || opt.name.toLowerCase() === name.toLowerCase()
                    );
                    if (matchedOpt) {
                        imgUrl = typeof matchedOpt.image === "string" ? matchedOpt.image : matchedOpt.image?.url;
                    }
                }
            }

            if (name) {
                preferencesList.push({
                    _id: id,
                    name,
                    image: resolveImageUrl(imgUrl),
                });
            }
        });
    } else if (options.lifestylePreferences.length > 0) {
        options.lifestylePreferences.slice(0, 6).forEach((pref) => {
            const imgUrl = typeof pref.image === "string" ? pref.image : pref.image?.url;
            preferencesList.push({
                _id: pref._id,
                name: pref.name,
                image: resolveImageUrl(imgUrl),
            });
        });
    } else {
        preferencesList.push(
            { name: "Night Owl" },
            { name: "Fitness" },
            { name: "Party Lover" },
            { name: "Non Smoker" }
        );
    }

    // Descriptions
    const descriptionText = propertyDoc?.description || flatmateDoc?.description;
    const defaultDescription1 = descriptionText ||
        "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua. Ut Enim Ad Minim Veniam, Quis Nostrud Exercitation Ullamco Laboris Nisi Ut Aliquip Ex Ea Commodo Consequat. Duis Aute Irure Dolor In Reprehenderet In Voluptate Velit Esse Cillum Dolore Eu Fugiat Nulla Pariatur. Excepteur Sint Occaecat Cupidatat Non Proident, Sunt In Culpa Qui Officia Deserunt Mollit Anim Id Est Laborum.";

    // Interactive states
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showCallModal, setShowCallModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [chatMessage, setChatMessage] = useState("");

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
    };

    const handleReportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportReason.trim()) return;
        setReportSubmitted(true);
        setTimeout(() => {
            setShowReportModal(false);
            setReportSubmitted(false);
            setReportReason("");
        }, 2000);
    };

    if (loadingDetails) {
        return (
            <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
                <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border-1 border-gray-200 drop-shadow-md p-12 flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin mb-3" />
                    <p className="text-gray-500 font-medium text-sm">Loading listing details...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
            {/* Main Container Card matching reference UI design */}
            <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto rounded-[32px] sm:rounded-[40px] border-1 border-gray-200 drop-shadow-md p-6 sm:p-10 md:p-14 transition-all">
                <div className="flex flex-col lg:flex-row items-center md:items-start gap-8 md:gap-14 lg:gap-16">

                    {/* LEFT SIDE: Avatar Profile & Action Buttons */}
                    <div className="flex flex-col items-center gap-3 md:gap-4 shrink-0 w-full md:w-56 lg:w-64">
                        {/* Avatar Illustration Circle or User Image */}
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#3BB799] shadow-inner transition-transform hover:scale-[1.02]">
                            {userImage ? (
                                <img src={userImage} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <svg
                                    viewBox="0 0 100 100"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-full h-full"
                                >
                                    {/* Background Teal Circle */}
                                    <circle cx="50" cy="50" r="50" fill="#3BB799" />

                                    {/* Pink/Magenta Shirt with V-Collar */}
                                    <path
                                        d="M18 96C18 76 32 68 50 68C68 68 82 76 82 96V100H18V96Z"
                                        fill="#EC4899"
                                    />
                                    {/* White Collar */}
                                    <path d="M40 68L50 82L60 68H40Z" fill="#FFFFFF" />
                                    <path d="M34 68L44 80L41 68H34Z" fill="#DB2777" />
                                    <path d="M66 68L56 80L59 68H66Z" fill="#DB2777" />

                                    {/* Neck */}
                                    <rect x="43" y="54" width="14" height="18" fill="#F8B195" />

                                    {/* Face */}
                                    <circle cx="50" cy="44" r="19" fill="#F8B195" />

                                    {/* Eyes */}
                                    <circle cx="43" cy="43" r="2.2" fill="#2D2D2D" />
                                    <circle cx="57" cy="43" r="2.2" fill="#2D2D2D" />

                                    {/* Eyebrows */}
                                    <path
                                        d="M40 38C42 37.2 45 37.2 46 38"
                                        stroke="#5C2D0C"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M54 38C55 37.2 58 37.2 60 38"
                                        stroke="#5C2D0C"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />

                                    {/* Smile / Mouth */}
                                    <path
                                        d="M45 52C47 54.5 53 54.5 55 52"
                                        stroke="#D84B4B"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    {/* Shoulder-length Brown Hair */}
                                    <path
                                        d="M28 44C26 26 36 18 50 18C64 18 74 26 72 44C74 62 72 82 70 88C66 88 64 72 64 54C60 48 54 45 50 45C46 45 40 48 36 54C36 72 34 88 30 88C28 82 26 62 28 44Z"
                                        fill="#8B4513"
                                    />
                                    {/* Hair Top Bangs */}
                                    <path
                                        d="M31 38C36 28 43 25 50 27C57 25 64 28 69 38C64 30 57 28 50 30C43 28 36 30 31 38Z"
                                        fill="#71360E"
                                    />
                                </svg>
                            )}
                        </div>

                        {/* Profile Name */}
                        <h2 className="text-xl sm:text-2xl font-regular text-[#1E3A8A] text-center tracking-tight">
                            {name}
                        </h2>

                        {/* Action Buttons Stacked Vertically */}
                        <div className="flex flex-col gap-3 w-full items-center">
                            {/* Call Button */}
                            <button
                                type="button"
                                onClick={() => setShowCallModal(true)}
                                className="w-28 py-2 px-3 bg-accent hover:bg-blue-700 text-white font-light text-sm sm:text-base md:text-lg rounded-full flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                                <Phone size={20} />
                                <span>Call</span>
                            </button>

                            {/* Chat Button */}
                            <button
                                type="button"
                                onClick={() => setShowChatModal(true)}
                                className="w-28 py-2 px-3 bg-accent/80 hover:bg-blue-700 text-white font-light text-sm sm:text-base md:text-lg rounded-full flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                                <MessageSquare size={20} />
                                <span>Chat</span>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Detailed Listing Information */}
                    <div className="flex-1 w-full space-y-7 sm:space-y-8 md:space-y-10">

                        {/* 1. Header PG Name & Category Section */}
                        <div className="space-y-1">
                            <h2 className="text-black text-xl sm:text-2xl md:text-3xl font-regular">
                                {pgName}
                            </h2>
                            <p className="text-gray-500 text-sm sm:text-base font-regular">
                                {pgCategory}
                            </p>
                        </div>

                        {/* 2. Location Section */}
                        <div className="space-y-1.5">
                            <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                Location
                            </h3>
                            <div className="flex items-start gap-1.5 text-gray-500 text-sm sm:text-lg font-regular">
                                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                <span>{location}</span>
                            </div>
                        </div>

                        <hr className="border-gray-200 border-t my-4" />

                        {/* 3. Rent Info Section */}
                        {sourceType === 'property' && (
                            <div className="space-y-4">
                                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                    Rent Info
                                </h3>
                                {/* Row 1: Monthly Rent, Deposit, Parking */}
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

                                {/* Row 2: Maintenance Charges & Maintenance Frequency */}
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                                <div>
                                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                                        Gender
                                    </span>
                                    <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">
                                        {gender}
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                                        Approx Rent
                                    </span>
                                    <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">{rent}</p>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                                        Occupancy
                                    </span>
                                    <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">
                                        {occupancy}
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-sm sm:text-lg font-regular">
                                        Looking For
                                    </span>
                                    <p className="text-black text-sm sm:text-lg md:text-xl font-medium mt-1">
                                        {lookingFor}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 5. Images Section */}
                        <div className="space-y-3">
                            <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                Images
                            </h3>
                            <div className="relative w-full h-64 sm:h-80 md:h-[480px] rounded-[28px] sm:rounded-[36px] overflow-hidden border border-gray-200 shadow-sm bg-gray-100 group">
                                {/* Images Track */}
                                <div
                                    className="flex w-full h-full transition-transform duration-500 ease-out"
                                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                                >
                                    {imageList.map((imgSrc, idx) => (
                                        <div key={idx} className="w-full h-full shrink-0 relative">
                                            <img
                                                src={imgSrc}
                                                alt={`Property Image ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Counter Badge */}
                                {imageList.length > 1 && (
                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full z-10 select-none">
                                        {currentImageIndex + 1} / {imageList.length}
                                    </div>
                                )}

                                {/* Navigation Arrows */}
                                {imageList.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handlePrevImage}
                                            aria-label="Previous Image"
                                            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 z-10"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextImage}
                                            aria-label="Next Image"
                                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 z-10"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                {/* Pagination Dots */}
                                {imageList.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                                        {imageList.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setCurrentImageIndex(idx)}
                                                aria-label={`Go to image ${idx + 1}`}
                                                className={`h-2 rounded-full transition-all cursor-pointer ${currentImageIndex === idx
                                                    ? "w-6 bg-white"
                                                    : "w-2 bg-white/50 hover:bg-white/80"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 6. Preferences Section */}
                        {sourceType !== 'property' && (<div className="space-y-3">
                            <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                Preferences
                            </h3>
                            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                                {preferencesList.map((pref, idx) => (
                                    <div
                                        key={pref._id || idx}
                                        className="flex flex-col items-center min-w-[72px]"
                                    >
                                        {/* Icon + Blue Pill */}
                                        <div className="relative w-20 sm:w-24 md:w-28 h-14 sm:h-16">
                                            {/* Blue Background */}
                                            <div className="absolute bottom-0 left-0 w-full h-10 sm:h-11 md:h-12 bg-accent rounded-full" />

                                            {/* Preference Image */}
                                            <div className="absolute left-1/2 -translate-x-1/2 -top-1 sm:-top-2 z-10">
                                                {pref.image ? (
                                                    <img
                                                        src={pref.image}
                                                        alt={pref.name}
                                                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                                                    />
                                                ) : (
                                                    getPreferenceVisual(pref.name)
                                                )}
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <span className="text-gray-500 text-sm sm:text-base md:text-lg font-regular mt-1 capitalize">
                                            {pref.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>)}

                        {/* 7. House Rules Section */}
                        {houseRulesList.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                    House Rules
                                </h3>
                                <ul className="space-y-2.5 pt-1">
                                    {houseRulesList.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5">
                                            <Check size={20} className="text-gray-900 shrink-0 mt-0.5" />
                                            <span className="text-gray-600 text-sm sm:text-base md:text-lg font-normal">
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 8. Amenities Section */}
                        {sourceType === 'property' && (<div className="space-y-3">
                            <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                Amenities
                            </h3>
                            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
                                {amenitiesList.map((am, idx) => (
                                    <div
                                        key={am._id || idx}
                                        className="flex flex-col items-center min-w-[72px]"
                                    >
                                        {/* Icon + Blue Pill */}
                                        <div className="relative w-20 sm:w-24 md:w-28 h-14 sm:h-16">
                                            {/* Blue Background */}
                                            <div className="absolute bottom-0 left-0 w-full h-10 sm:h-11 md:h-12 bg-accent rounded-full" />

                                            {/* Amenity Image */}
                                            <div className="absolute left-1/2 -translate-x-1/2 -top-1 sm:-top-2 z-10">
                                                {am.image ? (
                                                    <img
                                                        src={am.image}
                                                        alt={am.name}
                                                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                                                    />
                                                ) : (
                                                    getAmenityIcon(am.name)
                                                )}
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <span className="text-gray-500 text-sm sm:text-base md:text-lg font-regular mt-1 capitalize">
                                            {am.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>)}

                        {/* 9. Description Section */}
                        <div className="space-y-3">
                            <h3 className="text-black text-lg sm:text-xl md:text-2xl font-regular">
                                Description
                            </h3>
                            <div className="space-y-4 text-gray-800 text-sm sm:text-lg font-regular">
                                <p>{defaultDescription1}</p>
                            </div>
                        </div>

                        {/* 10. Footer: Found Wrong Information / Report Listing */}
                        <div className="pt-3 text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                            <span>Found Wrong Information?</span>
                            <button
                                type="button"
                                onClick={() => setShowReportModal(true)}
                                className="text-[#0066FF] cursor-pointer font-semibold transition-all"
                            >
                                <LineRoll text="Report Listing" lineClassName="bg-[#0066FF]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL 1: Call Modal */}
            {showCallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
                        <button
                            onClick={() => setShowCallModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0066FF]">
                            <Phone className="w-8 h-8 fill-current" />
                        </div>

                        <h4 className="text-xl font-bold text-gray-900">Contact {name}</h4>
                        <p className="text-sm text-gray-500 mt-2">
                            Click below to initiate a phone call or view phone number.
                        </p>

                        <div className="mt-6 space-y-3">
                            <a
                                href={`tel:${userMobile.replace(/\s+/g, "")}`}
                                className="block w-full py-3 bg-[#0066FF] hover:bg-blue-700 text-white font-semibold rounded-full text-sm shadow-md transition-colors"
                            >
                                Call {userMobile}
                            </a>
                            <button
                                type="button"
                                onClick={() => setShowCallModal(false)}
                                className="w-full py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Direct Chat Modal */}
            {showChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowChatModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4 border-b pb-4">
                            <div className="w-12 h-12 rounded-full bg-[#3BB799] flex items-center justify-center overflow-hidden shrink-0">
                                {userImage ? (
                                    <img src={userImage} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        <circle cx="50" cy="50" r="50" fill="#3BB799" />
                                        <circle cx="50" cy="44" r="20" fill="#F8B195" />
                                        <path d="M20 95C20 76 34 68 50 68C66 68 80 76 80 95V100H20V95Z" fill="#EC4899" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">{name}</h4>
                                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                                    Active Now
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="bg-gray-100 p-3 rounded-2xl text-xs text-gray-700 max-w-[80%]">
                                Hi! Interested in the listing? Feel free to send me a message.
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-[#0066FF]"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (chatMessage.trim()) {
                                        setChatMessage("");
                                        alert("Message sent!");
                                        setShowChatModal(false);
                                    }
                                }}
                                className="p-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full transition-colors cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: Report Listing Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowReportModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {reportSubmitted ? (
                            <div className="py-8 text-center space-y-3">
                                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-8 h-8 stroke-[3]" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Report Submitted</h4>
                                <p className="text-xs text-gray-500">
                                    Thank you for helping us keep the community safe. Our team will review this listing shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleReportSubmit} className="space-y-4">
                                <div className="flex items-center gap-2 text-amber-600 font-bold text-lg">
                                    <AlertCircle className="w-6 h-6" />
                                    <h4>Report Incorrect Info</h4>
                                </div>

                                <p className="text-xs text-gray-500">
                                    Please let us know what information is incorrect or misleading on {name}&apos;s listing.
                                </p>

                                <textarea
                                    required
                                    rows={4}
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Describe the issue (e.g. rent amount is different, wrong contact info, misleading photos)..."
                                    className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#0066FF] resize-none"
                                />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowReportModal(false)}
                                        className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white font-semibold rounded-full text-xs shadow-md transition-colors cursor-pointer"
                                    >
                                        Submit Report
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
