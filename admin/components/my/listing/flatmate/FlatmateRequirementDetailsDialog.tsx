"use client";

import { FlatmateRequirementItem, FlatmateRequirementMediaItem } from "@/lib/api";
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
      return loc.name || loc.formattedAddress || loc.address?.city || loc.address?.locality || "Location";
    }
    return String(loc);
  };

  const getUserLabel = (user: any): string => {
    if (!user) return "Unknown User";
    if (typeof user === "object") {
      return user.email || user.mobile || user._id || "User";
    }
    return String(user);
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return "mint";
      case "pending":
      case "draft":
      case "expired":
        return "sand";
      case "rejected":
      case "blocked":
      case "closed":
        return "rose";
      default:
        return "glass";
    }
  };

  return (
    <>
      {/* Veil */}
      <div className={`drawer-veil ${isOpen ? "open" : ""}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`drawer ${isOpen ? "open" : ""}`} style={{ width: 540 }}>
        <div className="drawer-head">
          <span className="card-title">Flatmate Requirement Details</span>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-4)" }}>
            Loading requirement details…
          </div>
        ) : requirement ? (
          <>
            {/* Hero Cover */}
            <div className="d-hero">
              <div
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 10,
                  background: "var(--bg-card-hover, rgba(255,255,255,0.06))",
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
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Icon name="fileText" size={36} />
                )}
              </div>
              <div className="d-name">{requirement.title}</div>
              <div className="d-sub">
                {getLocationName(requirement.location)} • ₹{(typeof requirement.budget === "number" ? requirement.budget : 0).toLocaleString("en-IN")}
              </div>

              {/* Action Toolbar */}
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
                <button className="btn btn-brand sm" onClick={() => onEdit(requirement)}>
                  Edit Requirement
                </button>
                {requirement.status === "pending" && (
                  <>
                    <button
                      className="btn btn-ghost sm"
                      style={{ color: "var(--mint-ink)" }}
                      onClick={() => onStatusChange(requirement, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-ghost sm"
                      style={{ color: "var(--rose-ink)" }}
                      onClick={() => onStatusChange(requirement, "rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}
                {(requirement.status === "approved" || (requirement.status as string) === "active") && (
                  <>
                    <button
                      className="btn btn-ghost sm text-amber-600"
                      onClick={() => onStatusChange(requirement, "blocked")}
                    >
                      Block
                    </button>
                    <button
                      className="btn btn-ghost sm text-slate-600"
                      onClick={() => onStatusChange(requirement, "closed")}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="d-stats">
              <div className="d-stat">
                <span>STATUS</span>
                <Chip tone={getStatusTone(requirement.status)}>{requirement.status.toUpperCase()}</Chip>
              </div>
              <div className="d-stat">
                <span>POST TYPE</span>
                <b>{requirement.postType.toUpperCase()}</b>
              </div>
              <div className="d-stat">
                <span>SUB TYPE</span>
                <b>
                  {requirement.postType === "property"
                    ? (requirement.propertyType || "N/A").replace(/_/g, " ").toUpperCase()
                    : (requirement.partnerType || "N/A").toUpperCase()}
                </b>
              </div>
              <div className="d-stat">
                <span>BUDGET</span>
                <b>
                  ₹{(typeof requirement.budget === "number" ? requirement.budget : 0).toLocaleString("en-IN")}
                </b>
              </div>
            </div>

            {/* Basic Specifications */}
            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Requirement Overview
            </div>
            <div className="d-row">
              <span>Requirement ID</span>
              <b style={{ fontSize: 11, fontFamily: "monospace" }}>{requirement._id}</b>
            </div>
            {requirement.slug && (
              <div className="d-row">
                <span>Slug</span>
                <b style={{ fontSize: 11, fontFamily: "monospace" }}>{requirement.slug}</b>
              </div>
            )}
            {requirement.description && (
              <div style={{ margin: "8px 0 14px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                <strong>Description:</strong> {requirement.description}
              </div>
            )}

            {/* User Details */}
            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Posted By (User)
            </div>
            <div className="d-row">
              <span>User Email / Mobile</span>
              <b>{getUserLabel(requirement.userId)}</b>
            </div>
            {typeof requirement.userId === "object" && requirement.userId !== null && (
              <>
                {requirement.userId._id && (
                  <div className="d-row">
                    <span>User ID</span>
                    <b style={{ fontSize: 11, fontFamily: "monospace" }}>{requirement.userId._id}</b>
                  </div>
                )}
                {requirement.userId.accountStatus && (
                  <div className="d-row">
                    <span>Account Status</span>
                    <b>{requirement.userId.accountStatus.toUpperCase()}</b>
                  </div>
                )}
                {requirement.userId.profileVerified !== undefined && (
                  <div className="d-row">
                    <span>Profile Verified</span>
                    <b>{requirement.userId.profileVerified ? "Yes" : "No"}</b>
                  </div>
                )}
              </>
            )}

            {/* Location Details */}
            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Location Information
            </div>
            <div className="d-row">
              <span>Location Name</span>
              <b>{getLocationName(requirement.location)}</b>
            </div>
            {typeof requirement.location === "object" && requirement.location !== null && (
              <>
                {requirement.location.formattedAddress && (
                  <div className="d-row">
                    <span>Address</span>
                    <b>{requirement.location.formattedAddress}</b>
                  </div>
                )}
                {requirement.location.googleMaps?.mapsUrl && (
                  <div style={{ marginTop: 6 }}>
                    <a
                      href={requirement.location.googleMaps.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost sm"
                      style={{ fontSize: 12 }}
                    >
                      <Icon name="mapPin" size={13} /> Open in Google Maps
                    </a>
                  </div>
                )}
              </>
            )}

            {/* Preferences */}
            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Preferences & Parameters
            </div>
            <div className="d-row">
              <span>Occupation Preference</span>
              <b>{(requirement.occupationPreference || "any").replace(/_/g, " ").toUpperCase()}</b>
            </div>
            <div className="d-row">
              <span>Gender Preference</span>
              <b>{(requirement.genderPreference || "any").toUpperCase()}</b>
            </div>
            {requirement.peopleCount !== undefined && requirement.peopleCount > 0 && (
              <div className="d-row">
                <span>People Count</span>
                <b>{requirement.peopleCount} Person(s)</b>
              </div>
            )}
            {requirement.moveInDate && (
              <div className="d-row">
                <span>Move-in Date</span>
                <b>{new Date(requirement.moveInDate).toLocaleDateString()}</b>
              </div>
            )}
            {requirement.expiresAt && (
              <div className="d-row">
                <span>Expires At</span>
                <b>{new Date(requirement.expiresAt).toLocaleDateString()}</b>
              </div>
            )}

            {/* Lifestyle Preferences */}
            {Array.isArray(requirement.lifestylePreferences) && requirement.lifestylePreferences.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>
                  Lifestyle Preferences:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {requirement.lifestylePreferences.map((pref, idx) => {
                    const label = typeof pref === "object" && pref !== null ? pref.name || pref._id : String(pref);
                    return <Chip key={idx} tone="glass">{label || "Preference"}</Chip>;
                  })}
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {Array.isArray(requirement.images) && requirement.images.length > 0 && (
              <>
                <div className="card-title" style={{ margin: "16px 0 8px" }}>
                  Attached Images ({requirement.images.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {requirement.images.map((img: FlatmateRequirementMediaItem | string, index: number) => {
                    const src = typeof img === "string" ? img : img.url;
                    if (!src) return null;
                    return (
                      <div
                        key={typeof img === "string" ? index : img._id || index}
                        style={{
                          height: 90,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "var(--canvas-2)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Requirement Image ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Video Player Section */}
            {Array.isArray(requirement.videos) && requirement.videos.length > 0 && (
              <>
                <div className="card-title" style={{ margin: "16px 0 8px" }}>
                  Attached Videos ({requirement.videos.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {requirement.videos.map((vid: FlatmateRequirementMediaItem | string, index: number) => {
                    const src = typeof vid === "string" ? vid : vid.url;
                    if (!src) return null;
                    return (
                      <div
                        key={typeof vid === "string" ? index : vid._id || index}
                        style={{
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "#000",
                        }}
                      >
                        <video src={src} controls playsInline style={{ width: "100%", maxHeight: 240 }} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Timestamps */}
            <div className="card-title" style={{ margin: "20px 0 6px" }}>
              System Timestamps
            </div>
            <div className="d-row">
              <span>Created Date</span>
              <b>{new Date(requirement.createdAt).toLocaleString()}</b>
            </div>
            <div className="d-row">
              <span>Last Updated</span>
              <b>{new Date(requirement.updatedAt).toLocaleString()}</b>
            </div>
          </>
        ) : (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-4)" }}>
            Requirement file not found.
          </div>
        )}
      </div>
    </>
  );
}
