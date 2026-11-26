"use client";

import {
  FlatmateRequirementItem,
  FlatmateRequirementMediaItem,
} from "@/lib/api";
import Icon from "@/components/icons";
import { Chip } from "@/components/ui";

interface FlatmateRequirementDetailsDialogProps {
  isOpen: boolean;
  requirement: FlatmateRequirementItem | null;
  loading: boolean;
  onClose: () => void;
  onEdit: (item: FlatmateRequirementItem) => void;
  onStatusChange: (item: FlatmateRequirementItem, newStatus: string) => void;
}

export default function FlatmateRequirementDetailsDialog({
  isOpen,
  requirement,
  loading,
  onClose,
  onEdit,
  onStatusChange,
}: FlatmateRequirementDetailsDialogProps) {
  if (!isOpen) return null;

  const getCoverImageUrl = (item: FlatmateRequirementItem): string | null => {
    if (item.images && item.images.length > 0) {
      const img = item.images[0];
      if (typeof img === "string") return img;
      if (typeof img === "object" && img?.url) return img.url;
    }
    return null;
  };

  const getLocationName = (loc: any): string => {
    if (!loc) return "Unknown Location";
    if (typeof loc === "object") {
      return (
        loc.name ||
        loc.formattedAddress ||
        loc.city ||
        loc.state ||
        "Location"
      );
    }
    return String(loc);
  };

  const getOwnerLabel = (user: any): string => {
    if (!user) return "Unknown Owner";
    if (typeof user === "object") {
      return user.email || user.mobile || user._id || "User";
    }
    return String(user);
  };

  return (
    <>
      {/* Requirement Details Drawer Veil */}
      <div
        className={`drawer-veil ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className={`drawer ${isOpen ? "open" : ""}`} style={{ width: 520 }}>
        <div className="drawer-head">
          <span className="card-title">Flatmate Requirement Details File</span>

          <button
            className="icon-btn sm"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            Loading requirement details…
          </div>
        ) : requirement ? (
          <>
            <div className="d-hero">
              <div
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 10,
                  background:
                    "var(--bg-card-hover, rgba(255,255,255,0.06))",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                {getCoverImageUrl(requirement) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getCoverImageUrl(requirement)!}
                    alt={requirement.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Icon name="home" size={32} />
                )}
              </div>

              <div className="d-name">{requirement.title}</div>

              <div className="d-sub">
                {getLocationName(requirement.location)} • ₹
                {(
                  typeof requirement.rent === "number"
                    ? requirement.rent
                    : (requirement as any).budget || 0
                ).toLocaleString("en-IN")}
                /mo
              </div>

              <div
                className="d-actions"
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                <button
                  className="btn btn-brand sm"
                  onClick={() => onEdit(requirement)}
                >
                  Edit Requirement
                </button>

                {requirement.status !== "approved" &&
                  (requirement.status as string) !== "active" && (
                    <button
                      className="btn btn-ghost sm"
                      style={{ color: "var(--mint-ink)" }}
                      onClick={() =>
                        onStatusChange(requirement, "approved")
                      }
                    >
                      Approve
                    </button>
                  )}

                {requirement.status !== "rejected" && (
                  <button
                    className="btn btn-ghost sm"
                    style={{ color: "var(--rose-ink)" }}
                    onClick={() =>
                      onStatusChange(requirement, "rejected")
                    }
                  >
                    Reject
                  </button>
                )}

                {(requirement.status === "approved" ||
                  (requirement.status as string) === "active") && (
                    <>
                      <button
                        className="btn btn-ghost sm text-amber-600"
                        onClick={() =>
                          onStatusChange(requirement, "blocked")
                        }
                      >
                        Block
                      </button>

                      <button
                        className="btn btn-ghost sm text-slate-600"
                        onClick={() =>
                          onStatusChange(requirement, "closed")
                        }
                      >
                        Close
                      </button>
                    </>
                  )}
              </div>
            </div>

            <div className="d-stats">
              <div className="d-stat">
                <span>STATUS</span>
                <b>{requirement.status.toUpperCase()}</b>
              </div>

              <div className="d-stat">
                <span>RENT</span>
                <b>
                  ₹
                  {(
                    typeof requirement.rent === "number"
                      ? requirement.rent
                      : (requirement as any).budget || 0
                  ).toLocaleString("en-IN")}
                </b>
              </div>

              {/* Only show Deposit for property posts */}
              {requirement.postType !== "property" &&
                Boolean(
                  requirement.securityDeposit &&
                  requirement.securityDeposit > 0
                ) && (
                  <div className="d-stat">
                    <span>DEPOSIT</span>
                    <b>
                      ₹
                      {(requirement.securityDeposit || 0).toLocaleString(
                        "en-IN"
                      )}
                    </b>
                  </div>
                )}
            </div>

            {requirement.rejectionReason && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(255,80,80,0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,80,80,0.2)",
                  margin: "14px 0",
                }}
              >
                <strong
                  style={{
                    color: "var(--rose-ink)",
                    fontSize: 13,
                  }}
                >
                  Rejection Reason:
                </strong>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-2)",
                    marginTop: 4,
                  }}
                >
                  {requirement.rejectionReason}
                </div>
              </div>
            )}

            {/* Administrative & Owner Information */}
            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Administrative & Owner Information
            </div>

            <div className="d-row">
              <span>Owner / User</span>
              <b>{getOwnerLabel(requirement.userId)}</b>
            </div>

            {requirement.postedBy && (
              <div className="d-row">
                <span>Posted By</span>
                <b>{requirement.postedBy.toUpperCase()}</b>
              </div>
            )}

            <div className="d-row">
              <span>Post Type</span>
              <b>
                {requirement.postType === "property"
                  ? "PROPERTY (Need Room / Flat)"
                  : "PARTNER (Have Room / Flat, Need Flatmate)"}
              </b>
            </div>

            <div className="d-row">
              <span>
                {requirement.postType === "property" ? "Property Type" : "Partner Type"}
              </span>
              <b>
                {(requirement.postType === "property"
                  ? requirement.propertyType || "flat"
                  : requirement.partnerType || "flatmate"
                )
                  .replace(/_/g, " ")
                  .toUpperCase()}
              </b>
            </div>

            {requirement.slug && (
              <div className="d-row">
                <span>Slug</span>
                <b style={{ fontSize: 12, fontFamily: "monospace" }}>{requirement.slug}</b>
              </div>
            )}

            {/* Conditional Display: Property vs Partner */}
            {requirement.postType === "property" ? (
              <>
                {/* 1. Requirement Overview */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  1. Requirement Overview
                </div>

                <div className="d-row">
                  <span>Location</span>
                  <b>{getLocationName(requirement.location)}</b>
                </div>

                <div className="d-row">
                  <span>Title</span>
                  <b>{requirement.title}</b>
                </div>

                {/* 2. Rental Specifications */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  2. Rental Specifications
                </div>

                {requirement.occupancyPreference && (
                  <div className="d-row">
                    <span>Occupancy Preference</span>
                    <b>{requirement.occupancyPreference.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                <div className="d-row">
                  <span>Approx Rent Amount</span>
                  <b>
                    ₹
                    {(
                      typeof requirement.rent === "number"
                        ? requirement.rent
                        : (requirement as any).budget || 0
                    ).toLocaleString("en-IN")}
                    /mo
                  </b>
                </div>

                {(requirement.availableFrom || (requirement as any).moveInDate) && (
                  <div className="d-row">
                    <span>Move-in Date / Available From</span>
                    <b>
                      {new Date(
                        requirement.availableFrom || (requirement as any).moveInDate
                      ).toLocaleDateString()}
                    </b>
                  </div>
                )}

                {requirement.brokerage !== undefined && (
                  <div className="d-row">
                    <span>Brokerage</span>
                    <b>
                      {requirement.brokerage
                        ? "Brokerage Applicable"
                        : "Zero Brokerage / Not Applicable"}
                    </b>
                  </div>
                )}

                {/* 3. Preferences */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  3. Preferences
                </div>

                {requirement.genderPreference && (
                  <div className="d-row">
                    <span>Gender Preference</span>
                    <b>{requirement.genderPreference.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.occupationPreference && (
                  <div className="d-row">
                    <span>Occupation Preference</span>
                    <b>{requirement.occupationPreference.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.description && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                      Description
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, padding: "4px 0 8px" }}>
                      {requirement.description}
                    </div>
                  </>
                )}

                {((Array.isArray(requirement.userPreferences) && requirement.userPreferences.length > 0) ||
                  (Array.isArray((requirement as any).lifestylePreferences) &&
                    (requirement as any).lifestylePreferences.length > 0)) && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                      User / Lifestyle Preferences (
                      {(requirement.userPreferences || (requirement as any).lifestylePreferences).length})
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {(requirement.userPreferences || (requirement as any).lifestylePreferences || []).map(
                        (pref: any, i: number) => (
                          <Chip key={i} tone="mint">
                            {typeof pref === "object" ? pref.name || pref._id : `Preference ID: ${String(pref).slice(-6)}`}
                          </Chip>
                        )
                      )}
                    </div>
                  </>
                )}

                {/* 4. Media Assets */}
                {((requirement.images && requirement.images.length > 0) ||
                  (requirement.videos && requirement.videos.length > 0)) && (
                  <>
                    <div className="card-title" style={{ margin: "16px 0 6px" }}>
                      4. Media Assets
                    </div>

                    {requirement.images && requirement.images.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                          Requirement Photos ({requirement.images.length})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                          {requirement.images.map((img: FlatmateRequirementMediaItem | string, idx: number) => {
                            const src = typeof img === "string" ? img : img.url;
                            if (!src) return null;
                            return (
                              <a
                                key={typeof img === "string" ? idx : img._id || idx}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  height: 80,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                  background: "var(--bg-card-hover)",
                                  display: "block",
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt={`Requirement Image ${idx + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </a>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {requirement.videos && requirement.videos.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                          Requirement Videos ({requirement.videos.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                          {requirement.videos.map((vid: FlatmateRequirementMediaItem | string, idx: number) => {
                            const src = typeof vid === "string" ? vid : vid.url;
                            if (!src) return null;
                            return (
                              <div
                                key={typeof vid === "string" ? idx : vid._id || idx}
                                style={{
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                  background: "#000",
                                }}
                              >
                                <video src={src} controls style={{ width: "100%", maxHeight: 200, objectFit: "contain" }} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* 1. Requirement Overview */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  1. Requirement Overview
                </div>

                <div className="d-row">
                  <span>Location</span>
                  <b>{getLocationName(requirement.location)}</b>
                </div>

                <div className="d-row">
                  <span>Title</span>
                  <b>{requirement.title}</b>
                </div>

                {/* 2. Space Details */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  2. Space Details
                </div>

                {Boolean(requirement.area && requirement.area > 0) && (
                  <div className="d-row">
                    <span>Area Size</span>
                    <b>{requirement.area} sqft</b>
                  </div>
                )}

                {requirement.furnishing && (
                  <div className="d-row">
                    <span>Furnishing Status</span>
                    <b>{requirement.furnishing.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.parking !== undefined && (
                  <div className="d-row">
                    <span>Parking Facility</span>
                    <b>{requirement.parking ? "Available" : "Not Available"}</b>
                  </div>
                )}

                {requirement.propertyDetails?.bedrooms && (
                  <div className="d-row">
                    <span>Bedrooms / BHK</span>
                    <b>{requirement.propertyDetails.bedrooms.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.propertyDetails?.facing && (
                  <div className="d-row">
                    <span>Facing</span>
                    <b>{requirement.propertyDetails.facing.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.propertyDetails?.floor !== undefined && (
                  <div className="d-row">
                    <span>Floor</span>
                    <b>
                      {requirement.propertyDetails.floor === 0
                        ? "Ground Floor"
                        : `Floor ${requirement.propertyDetails.floor}`}
                      {requirement.propertyDetails.totalFloors !== undefined
                        ? ` of ${requirement.propertyDetails.totalFloors}`
                        : ""}
                    </b>
                  </div>
                )}

                {requirement.propertyDetails?.floor === undefined &&
                  requirement.propertyDetails?.totalFloors !== undefined && (
                    <div className="d-row">
                      <span>Total Floors</span>
                      <b>{requirement.propertyDetails.totalFloors} Floors</b>
                    </div>
                  )}

                {/* 3. Rental Specifications */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  3. Rental Specifications
                </div>

                {requirement.occupancyPreference && (
                  <div className="d-row">
                    <span>Occupancy Preference</span>
                    <b>{requirement.occupancyPreference.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                <div className="d-row">
                  <span>Rent Amount</span>
                  <b>
                    ₹
                    {(
                      typeof requirement.rent === "number"
                        ? requirement.rent
                        : (requirement as any).budget || 0
                    ).toLocaleString("en-IN")}
                    /mo
                  </b>
                </div>

                {Boolean(requirement.securityDeposit && requirement.securityDeposit > 0) && (
                  <div className="d-row">
                    <span>Security Deposit</span>
                    <b>₹{(requirement.securityDeposit || 0).toLocaleString("en-IN")}</b>
                  </div>
                )}

                {requirement.brokerage !== undefined && (
                  <div className="d-row">
                    <span>Brokerage</span>
                    <b>
                      {requirement.brokerage
                        ? "Brokerage Applicable"
                        : "Zero Brokerage / Not Applicable"}
                    </b>
                  </div>
                )}

                {(requirement.availableFrom || (requirement as any).moveInDate) && (
                  <div className="d-row">
                    <span>Available From</span>
                    <b>
                      {new Date(
                        requirement.availableFrom || (requirement as any).moveInDate
                      ).toLocaleDateString()}
                    </b>
                  </div>
                )}

                {Boolean(
                  requirement.maintenanceCharges?.amount && requirement.maintenanceCharges.amount > 0
                ) && (
                  <div className="d-row">
                    <span>Maintenance</span>
                    <b>
                      ₹{requirement.maintenanceCharges!.amount.toLocaleString("en-IN")} (
                      {requirement.maintenanceCharges?.frequency || "monthly"})
                    </b>
                  </div>
                )}

                {/* 4. Preferences */}
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  4. Preferences
                </div>

                {requirement.genderPreference && (
                  <div className="d-row">
                    <span>Gender Preference</span>
                    <b>{requirement.genderPreference.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.occupationPreference && (
                  <div className="d-row">
                    <span>Occupation Preference</span>
                    <b>{requirement.occupationPreference.replace(/_/g, " ").toUpperCase()}</b>
                  </div>
                )}

                {requirement.description && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                      Description
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, padding: "4px 0 8px" }}>
                      {requirement.description}
                    </div>
                  </>
                )}

                {((Array.isArray(requirement.userPreferences) && requirement.userPreferences.length > 0) ||
                  (Array.isArray((requirement as any).lifestylePreferences) &&
                    (requirement as any).lifestylePreferences.length > 0)) && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                      User / Lifestyle Preferences (
                      {(requirement.userPreferences || (requirement as any).lifestylePreferences).length})
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {(requirement.userPreferences || (requirement as any).lifestylePreferences || []).map(
                        (pref: any, i: number) => (
                          <Chip key={i} tone="mint">
                            {typeof pref === "object" ? pref.name || pref._id : `Preference ID: ${String(pref).slice(-6)}`}
                          </Chip>
                        )
                      )}
                    </div>
                  </>
                )}

                {requirement.amenities && requirement.amenities.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                      Property Amenities ({requirement.amenities.length})
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {requirement.amenities.map((am: any, i) => (
                        <Chip key={i} tone="mint">
                          {typeof am === "object" ? am.name || am._id : `Amenity ID: ${String(am).slice(-6)}`}
                        </Chip>
                      ))}
                    </div>
                  </>
                )}

                {/* 5. Media Assets */}
                {((requirement.images && requirement.images.length > 0) ||
                  (requirement.videos && requirement.videos.length > 0)) && (
                  <>
                    <div className="card-title" style={{ margin: "16px 0 6px" }}>
                      5. Media Assets
                    </div>

                    {requirement.images && requirement.images.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                          Requirement Photos ({requirement.images.length})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                          {requirement.images.map((img: FlatmateRequirementMediaItem | string, idx: number) => {
                            const src = typeof img === "string" ? img : img.url;
                            if (!src) return null;
                            return (
                              <a
                                key={typeof img === "string" ? idx : img._id || idx}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  height: 80,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                  background: "var(--bg-card-hover)",
                                  display: "block",
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt={`Requirement Image ${idx + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </a>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {requirement.videos && requirement.videos.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>
                          Requirement Videos ({requirement.videos.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                          {requirement.videos.map((vid: FlatmateRequirementMediaItem | string, idx: number) => {
                            const src = typeof vid === "string" ? vid : vid.url;
                            if (!src) return null;
                            return (
                              <div
                                key={typeof vid === "string" ? idx : vid._id || idx}
                                style={{
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                  background: "#000",
                                }}
                              >
                                <video src={src} controls style={{ width: "100%", maxHeight: 200, objectFit: "contain" }} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}

