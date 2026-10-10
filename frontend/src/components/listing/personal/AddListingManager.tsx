"use client";

import React, { useState, useEffect } from "react";
import ListingOptionSelector from "./create/ListingOptionSelector";
import PropertyCreationForm from "./create/PropertyCreationForm";
import FlatmateCreationForm1 from "./create/FlatmateCreationForm1";
import FlatmateCreationForm2 from "./create/FlatmateCreationForm2";

export type ListingMode = "select" | "property" | "flatmate-room" | "flatmate-roommate";

export default function AddListingManager() {
  const [mode, setMode] = useState<ListingMode>("select");
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handleReset = () => {
      setMode("select");
      setResetKey((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("reset-add-listing-form", handleReset);
    return () => window.removeEventListener("reset-add-listing-form", handleReset);
  }, []);

  const handleSelectOption = (selectedOption: "property" | "flatmate-room" | "flatmate-roommate") => {
    setMode(selectedOption);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToOptions = () => {
    setMode("select");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
