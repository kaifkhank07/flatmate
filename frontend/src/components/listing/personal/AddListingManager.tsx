"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useListingStore } from "@/store/useListingStore";
import ListingOptionSelector from "./create/ListingOptionSelector";
import ListingLimitReached from "./create/ListingLimitReached";
import PropertyCreationForm from "./create/PropertyCreationForm";
import FlatmateCreationForm1 from "./create/FlatmateCreationForm1";
import FlatmateCreationForm2 from "./create/FlatmateCreationForm2";

export type ListingMode = "select" | "property" | "flatmate-room" | "flatmate-roommate";

const MAX_LISTING_LIMIT = 3;

export default function AddListingManager() {
  const [mode, setMode] = useState<ListingMode>("select");
  const [resetKey, setResetKey] = useState(0);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  const {
    myListings,
    myListingsPagination,
    loadingMyListings,
    myListingsError,
    fetchMyListings,
  } = useListingStore();

  const loadListingStatus = useCallback(async () => {
    try {
      await fetchMyListings({ page: 1, limit: 10 });
    } catch {
      // Error handled in store myListingsError
    } finally {
      setIsCheckingLimit(false);
    }
  }, [fetchMyListings]);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let isMounted = true;

    const runInitialCheck = async () => {
      try {
        await fetchMyListings({ page: 1, limit: 10 });
      } catch {
        // Error captured in store
      } finally {
        if (isMounted) {
          setIsCheckingLimit(false);
        }
      }
    };

    runInitialCheck();

    // Re-check count on window focus ONLY if user is on the option selector screen.
    // Never re-fetch while the user is actively filling out a creation form (e.g. when OS file picker opens/closes).
    const handleFocus = () => {
      if (modeRef.current === "select") {
        fetchMyListings({ page: 1, limit: 10 });
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchMyListings]);

  useEffect(() => {
    const handleReset = () => {
      setMode("select");
      setResetKey((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("reset-add-listing-form", handleReset);
    return () => window.removeEventListener("reset-add-listing-form", handleReset);
  }, []);

  const handleSelectOption = (
    selectedOption: "property" | "flatmate-room" | "flatmate-roommate"
  ) => {
    setMode(selectedOption);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToOptions = () => {
    setMode("select");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalListings = myListingsPagination?.total ?? myListings.length;
  const hasReachedLimit = totalListings >= MAX_LISTING_LIMIT;

  // 1. Loading State: Only block the screen during initial limit verification on mount
  if (isCheckingLimit) {
    return (
      <section className="w-full py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[420px] text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#0066F9] animate-spin" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 font-roboto-serif">
              Checking listing limit...
            </h3>
            <p className="text-sm text-gray-500">
              Verifying your listing allowance before proceeding.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // 2. Error State: If the count check failed on the selection screen, show error with retry option
  if (mode === "select" && myListingsError && !loadingMyListings && totalListings === 0) {
    return (
      <section className="w-full py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-8 border border-rose-100 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-roboto-serif">
              Unable to Verify Listing Limit
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {myListingsError ||
                "Failed to retrieve your current listing count. Please check your network connection and try again."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCheckingLimit(true);
                loadListingStatus();
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066F9] hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 3. Limit Reached State: Display dedicated limit UI if user has reached max allowed listings
  if (mode === "select" && hasReachedLimit) {
    return (
      <div className="w-full" key={resetKey}>
        <ListingLimitReached
          totalCount={totalListings}
          maxLimit={MAX_LISTING_LIMIT}
        />
      </div>
    );
  }

  // 4. Normal Creation State (fewer than 3 listings): Display existing options and forms
  return (
    <div className="w-full" key={resetKey}>
      {/* 1st Component: Two Options Selection Screen (Default) */}
      {mode === "select" && (
        <ListingOptionSelector onSelectOption={handleSelectOption} />
      )}

      {/* 2nd Component: Property Creation Form */}
      {mode === "property" && (
        <PropertyCreationForm onBack={handleBackToOptions} />
      )}

      {/* 3rd Component: Flatmate Requirement Creation Form */}
      {mode === "flatmate-room" && (
        <FlatmateCreationForm1 onBack={handleBackToOptions} />
      )}

      {mode === "flatmate-roommate" && (
        <FlatmateCreationForm2 onBack={handleBackToOptions} />
      )}
    </div>
  );
}
