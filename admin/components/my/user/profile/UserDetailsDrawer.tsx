"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/lib/toast";
import {
  fetchUserDetails,
  UserItem,
  UserProfileItem,
} from "@/lib/api";
import { Avatar, Chip } from "@/components/ui";
import { X } from "lucide-react";

type UserDetailsDrawerProps = {
  selectedUserId: string | null;
  refreshKey?: number;
  onClose: () => void;
  onOpenProfileEdit: (user: UserItem, profile: UserProfileItem | null) => void;
  onOpenStatusEdit: (user: UserItem) => void;
};

export default function UserDetailsDrawer({
  selectedUserId,
  refreshKey,
  onClose,
  onOpenProfileEdit,
  onOpenStatusEdit,
}: UserDetailsDrawerProps) {
  const toast = useToast();
  const [drawerData, setDrawerData] = useState<{
    user: UserItem;
    profile: UserProfileItem | null;
    sessionsSummary: { activeSessionsCount: number };
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const loadUserDetails = useCallback(() => {
    if (selectedUserId) {
      setDrawerLoading(true);
      fetchUserDetails(selectedUserId).then((res) => {
        if (res.success && res.data) {
          setDrawerData(res.data);
        } else {
          toast(res.message || "Failed to fetch user details");
        }
        setDrawerLoading(false);
      });
    } else {
      setDrawerData(null);
    }
  }, [selectedUserId, toast]);

  useEffect(() => {
    loadUserDetails();
  }, [loadUserDetails, refreshKey]);

  return (
    <>
      <div
        className={`drawer-veil ${selectedUserId ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`drawer ${selectedUserId ? "open" : ""}`}>
        {selectedUserId && (
          <>
            <div className="drawer-head">
              <span className="card-title">User File Details</span>
              <button
                className="icon-btn sm"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {drawerLoading ? (
              <div style={{ padding: 24, textAlign: "center" }}>Loading user file…</div>
            ) : drawerData ? (
              <>
                <div className="d-hero">
                  <Avatar
                    src={drawerData.profile?.image?.url}
                    name={[drawerData.profile?.firstName, drawerData.profile?.lastName].filter(Boolean).join(" ") || drawerData.user.email || drawerData.user.mobile}
                    size={72}
                    ring
                    className="mx-auto"
                  />

                  <div className="d-name">
                    {[drawerData.profile?.firstName, drawerData.profile?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      drawerData.user.email ||
                      drawerData.user.mobile ||
                      "Marketplace User"}
                  </div>
                  <div className="d-sub">
                    Joined {new Date(drawerData.user.createdAt).toLocaleDateString()}
                  </div>
                  <div className="d-actions" style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      className="btn btn-brand sm"
                      onClick={() => onOpenProfileEdit(drawerData.user, drawerData.profile)}
                    >
                      Edit Profile & Preferences
                    </button>
                    <button
                      className="btn btn-ghost sm"
                      onClick={() => onOpenStatusEdit(drawerData.user)}
                    >
                      Update Status
                    </button>
                  </div>
                </div>

                <div className="d-stats">
                  <div className="d-stat">
                    <span>ACCOUNT STATUS</span>
                    <b>{drawerData.user.accountStatus}</b>
                  </div>
                  <div className="d-stat">
                    <span>PROFILE COMPLETION</span>
                    <b>{drawerData.profile?.profileCompletion || 0}%</b>
                  </div>
                  <div className="d-stat">
                    <span>VERIFICATION</span>
                    <b>{drawerData.user.verificationStatus}</b>
                  </div>
                  <div className="d-stat">
                    <span>ACTIVE SESSIONS</span>
                    <b>{drawerData.sessionsSummary.activeSessionsCount}</b>
                  </div>
                </div>

                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  Account Credentials & Verification
                </div>
                <div className="d-row">
                  <span>Email</span>
                  <b>{drawerData.user.email || "N/A"}</b>
                </div>
                <div className="d-row">
                  <span>Mobile</span>
                  <b>{drawerData.user.mobile || "N/A"}</b>
                </div>
                <div className="d-row">
                  <span>Email Verified</span>
                  <b>{drawerData.user.emailVerified ? "Yes" : "No"}</b>
                </div>
                <div className="d-row">
                  <span>Mobile Verified</span>
                  <b>{drawerData.user.mobileVerified ? "Yes" : "No"}</b>
                </div>

                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  User Profile Information
                </div>
                <div className="d-row">
                  <span>First Name</span>
                  <b>{drawerData.profile?.firstName || "N/A"}</b>
                </div>
                <div className="d-row">
                  <span>Last Name</span>
                  <b>{drawerData.profile?.lastName || "N/A"}</b>
                </div>
                <div className="d-row">
                  <span>Date of Birth</span>
                  <b>
                    {drawerData.profile?.dateOfBirth
                      ? new Date(drawerData.profile.dateOfBirth).toLocaleDateString()
                      : "N/A"}
                  </b>
                </div>
                <div className="d-row">
                  <span>Gender</span>
                  <b>
                    {drawerData.profile?.gender
                      ? drawerData.profile.gender.replace(/_/g, " ").toUpperCase()
                      : "N/A"}
                  </b>
                </div>
                <div className="d-row">
                  <span>Occupation</span>
                  <b>
                    {drawerData.profile?.occupation
                      ? drawerData.profile.occupation.replace(/_/g, " ").toUpperCase()
                      : "N/A"}
                  </b>
                </div>
                <div className="d-row">
                  <span>Languages Known</span>
                  <b>
                    {drawerData.profile?.languagesKnown && drawerData.profile.languagesKnown.length > 0
                      ? drawerData.profile.languagesKnown.join(", ")
                      : "N/A"}
                  </b>
                </div>
                <div className="d-row">
                  <span>About Me</span>
                  <b>{drawerData.profile?.aboutMe || "N/A"}</b>
                </div>

                <div className="card-title" style={{ margin: "16px 0 6px" }}>
                  Selected User Preferences
                </div>
                {drawerData.profile?.preferences && drawerData.profile.preferences.length > 0 ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {drawerData.profile.preferences.map((p) =>
                      typeof p === "object" && p !== null ? (
                        <Chip key={p._id} tone="iris">
                          {p.name}
                        </Chip>
                      ) : (
                        <Chip key={p} tone="iris">
                          ID: {p.slice(-6)}
                        </Chip>
                      )
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 4 }}>
                    No preferences selected yet.
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
