"use client";

import { PropertyItem } from "@/lib/api";
import Icon from "@/components/icons";
import { Chip } from "@/components/ui";

interface PropertyDetailsDialogProps {
  isOpen: boolean;
  property: PropertyItem | null;
  loading: boolean;
  onClose: () => void;
  onEdit: (item: PropertyItem) => void;
  onStatusChange: (item: PropertyItem, newStatus: string) => void;
}

export default function PropertyDetailsDialog({
  isOpen,
  property,
  loading,
  onClose,
  onEdit,
  onStatusChange,
}: PropertyDetailsDialogProps) {
  if (!isOpen) return null;

  const getCoverImageUrl = (item: PropertyItem): string | null => {
    if (item.images && item.images.length > 0 && item.images[0].url) {
      return item.images[0].url;
    }
    return null;
  };

  const getLocationName = (loc: any): string => {
    if (!loc) return "Unknown Location";
    if (typeof loc === "object") {
      return loc.name || loc.formattedAddress || loc.city || loc.state || "Location";
    }
    return String(loc);
  };

  const getOwnerLabel = (owner: any): string => {
    if (!owner) return "Unknown Owner";
    if (typeof owner === "object") {
      return owner.email || owner.mobile || owner._id || "User";
    }
    return String(owner);
  };

  return (
    <>
      {/* Property Details Drawer Veil */}
      <div
        className={`drawer-veil ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className={`drawer ${isOpen ? "open" : ""}`} style={{ width: 520 }}>
        <div className="drawer-head">
          <span className="card-title">Property Details File</span>
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
            Loading property details…
          </div>
        ) : property ? (
          <>
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
                {getCoverImageUrl(property) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getCoverImageUrl(property)!}
                    alt={property.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Icon name="home" size={32} />
                )}
              </div>
              <div className="d-name">{property.title}</div>
              <div className="d-sub">
                {getLocationName(property.location)} • ₹{(typeof property.rent === "number" ? property.rent : 0).toLocaleString("en-IN")}/mo
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
                  onClick={() => onEdit(property)}
                >
                  Edit Property
                </button>
                {property.status !== "approved" && (
                  <button
                    className="btn btn-ghost sm"
                    style={{ color: "var(--mint-ink)" }}
                    onClick={() => onStatusChange(property, "approved")}
                  >
                    Approve
                  </button>
                )}
                {property.status !== "rejected" && (
                  <button
                    className="btn btn-ghost sm"
                    style={{ color: "var(--rose-ink)" }}
                    onClick={() => onStatusChange(property, "rejected")}
                  >
                    Reject
                  </button>
                )}
                {property.status === "approved" && (
                  <>
                    <button
                      className="btn btn-ghost sm text-amber-600"
                      onClick={() => onStatusChange(property, "blocked")}
                    >
                      Block
                    </button>
                    <button
                      className="btn btn-ghost sm text-slate-600"
                      onClick={() => onStatusChange(property, "closed")}
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
                <b>{property.status.toUpperCase()}</b>
              </div>
              <div className="d-stat">
                <span>RENT</span>
                <b>₹{(typeof property.rent === "number" ? property.rent : 0).toLocaleString("en-IN")}</b>
              </div>
              {Boolean(property.securityDeposit && property.securityDeposit > 0) && (
                <div className="d-stat">
                  <span>DEPOSIT</span>
                  <b>₹{(property.securityDeposit || 0).toLocaleString("en-IN")}</b>
                </div>
              )}

            </div>

            {property.rejectionReason && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(255,80,80,0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,80,80,0.2)",
                  margin: "14px 0",
                }}
              >
                <strong style={{ color: "var(--rose-ink)", fontSize: 13 }}>Rejection Reason:</strong>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
                  {property.rejectionReason}
                </div>
              </div>
            )}

            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Property Specifications & Overview
            </div>

            {property.slug && (
              <div className="d-row">
                <span>Slug</span>
                <b style={{ fontSize: 12, fontFamily: "monospace" }}>{property.slug}</b>
              </div>
            )}

            {(property.propertyType || property.listingType) && (
              <div className="d-row">
                <span>Property Type</span>
                <b>{(property.propertyType || property.listingType)?.replace(/_/g, " ").toUpperCase()}</b>
              </div>
            )}

            {property.furnishing && (
              <div className="d-row">
                <span>Furnishing</span>
                <b>{property.furnishing.replace(/_/g, " ").toUpperCase()}</b>
              </div>
            )}

            {Boolean(property.maintenanceCharges?.amount && property.maintenanceCharges.amount > 0) && (
              <div className="d-row">
                <span>Maintenance</span>
                <b>
                  ₹{property.maintenanceCharges!.amount.toLocaleString("en-IN")} (
                  {property.maintenanceCharges?.frequency || "monthly"})
                </b>
              </div>
            )}

            {property.parking !== undefined && (
              <div className="d-row">
                <span>Parking</span>
                <b>{property.parking ? "Available" : "Not Available"}</b>
              </div>
            )}

            {property.availableFrom && (
              <div className="d-row">
                <span>Available From</span>
                <b>{new Date(property.availableFrom).toLocaleDateString()}</b>
              </div>
            )}

            {Boolean(property.area && property.area > 0) && (
              <div className="d-row">
                <span>Area Size</span>
                <b>{property.area} sqft</b>
              </div>
            )}

            <div className="card-title" style={{ margin: "16px 0 6px" }}>
              Preferences & Owner
            </div>

            {property.genderPreference && (
              <div className="d-row">
                <span>Gender Preference</span>
                <b>{property.genderPreference.toUpperCase()}</b>
              </div>
            )}

            {property.occupationPreference && (
              <div className="d-row">
                <span>Occupation Preference</span>
                <b>{property.occupationPreference.replace(/_/g, " ").toUpperCase()}</b>
              </div>
            )}

            <div className="d-row">
              <span>Owner / User</span>
              <b>{getOwnerLabel(property.userId || property.ownerId)}</b>
            </div>

            {Array.isArray((property as any).houseRules) &&
              (property as any).houseRules.length > 0 && (
                <div className="d-row">
                  <span>House Rules</span>
                  <b>{(property as any).houseRules.join(", ")}</b>
                </div>
              )}

            {property.description && (
              <>
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  Description
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, padding: "8px 0" }}>
                  {property.description}
                </div>
              </>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <>
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  Attached Amenities ({property.amenities.length})
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {property.amenities.map((am: any, i) => (
                    <Chip key={i} tone="mint">
                      {typeof am === "object" ? am.name : `Amenity ID: ${String(am).slice(-6)}`}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {/* Attached Images */}
            {property.images && property.images.length > 0 && (
              <>
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  Property Images ({property.images.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                  {property.images.map((img, idx) => (
                    <a
                      key={img._id || idx}
                      href={img.url}
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
                      <img src={img.url} alt={`Image ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Attached Videos */}
            {property.videos && property.videos.length > 0 && (
              <>
                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  Property Videos ({property.videos.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {property.videos.map((vid, idx) => (
                    <div key={vid._id || idx} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "#000" }}>
                      <video src={vid.url} controls style={{ width: "100%", maxHeight: 200, objectFit: "contain" }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
