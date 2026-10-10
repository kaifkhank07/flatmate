"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import {
  UserItem,
  UserProfileItem,
  UserProfileImage,
  UserPreferenceItem,
  fetchUserPreferences,
  updateUserProfileByAdmin,
} from "@/lib/api";
import { Avatar } from "@/components/ui";
import { Upload, X } from "lucide-react";

export type EditUserProfileDialogProps = {
  user: UserItem | null;
  profile: UserProfileItem | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function EditUserProfileDialog({
  user,
  profile,
  onClose,
  onSuccess,
}: EditUserProfileDialogProps) {
  const toast = useToast();

  const [masterPreferences, setMasterPreferences] = useState<UserPreferenceItem[]>([]);
  const [loadingMasterPrefs, setLoadingMasterPrefs] = useState(false);
  const [profileImage, setProfileImage] = useState<UserProfileImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "any",
    occupation: "other",
    languagesKnown: "",
    aboutMe: "",
    selectedPreferences: [] as string[],
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingMasterPrefs(true);
      setProfileImage(profile?.image || null);
      setImagePreview(profile?.image?.url || null);
      setSelectedFile(null);
      setImageRemoved(false);

      const initialPrefIds: string[] = (profile?.preferences || []).map((p) =>
        typeof p === "object" && p !== null ? p._id : (p as string)
      );

      setProfileForm({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split("T")[0] : "",
        gender: profile?.gender || "any",
        occupation: profile?.occupation || "other",
        languagesKnown: profile?.languagesKnown ? profile.languagesKnown.join(", ") : "",
        aboutMe: profile?.aboutMe || "",
        selectedPreferences: initialPrefIds,
      });

      fetchUserPreferences({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setMasterPreferences(res.data.items.filter((item) => item.isActive));
        } else {
          toast(res.message || "Failed to load master preferences");
        }
        setLoadingMasterPrefs(false);
      });
    }
  }, [user, profile, toast]);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setProfileImage(null);
    setImagePreview(null);
    setImageRemoved(true);
    toast("Avatar marked for removal. Click Save to apply.");
  };

  const handleTogglePref = (prefId: string) => {
    setProfileForm((prev) => {
      const exists = prev.selectedPreferences.includes(prefId);
      if (exists) {
        return {
          ...prev,
          selectedPreferences: prev.selectedPreferences.filter((id) => id !== prefId),
        };
      } else {
        return {
          ...prev,
          selectedPreferences: [...prev.selectedPreferences, prefId],
        };
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileSubmitting(true);

    const languagesArray = profileForm.languagesKnown
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    let payload: FormData | any;

    if (selectedFile) {
      const body = new FormData();
      body.append("firstName", profileForm.firstName.trim());
      body.append("lastName", profileForm.lastName.trim());
      if (profileForm.dateOfBirth) {
        body.append("dateOfBirth", new Date(profileForm.dateOfBirth).toISOString());
      }
      body.append("gender", profileForm.gender);
      body.append("occupation", profileForm.occupation);
      body.append("languagesKnown", JSON.stringify(languagesArray));
      body.append("aboutMe", profileForm.aboutMe.trim());
      body.append("preferences", JSON.stringify(profileForm.selectedPreferences));
      body.append("file", selectedFile);
      payload = body;
    } else {
      payload = {
        firstName: profileForm.firstName.trim() || undefined,
        lastName: profileForm.lastName.trim() || undefined,
        dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toISOString() : null,
        gender: profileForm.gender,
        occupation: profileForm.occupation,
        languagesKnown: languagesArray,
        aboutMe: profileForm.aboutMe.trim() || undefined,
        preferences: profileForm.selectedPreferences,
        image: imageRemoved ? null : profileImage,
      };
    }

    const res = await updateUserProfileByAdmin(user._id, payload);

    if (res.success) {
      toast("User profile and preferences updated successfully!");
      setSelectedFile(null);
      setImageRemoved(false);
      onClose();
      await onSuccess();
    } else {
      toast(res.message || "Failed to update user profile");
    }
    setProfileSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity overflow-y-auto">
      <div className="w-full max-w-[620px] max-h-[90vh] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Edit User Profile & Preferences
            </h3>
            <p className="text-xs text-slate-500">
              User: {user.email || user.mobile} (ID: {user._id.slice(-6)})
            </p>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="relative flex-shrink-0">
              <Avatar src={imagePreview || ""} name={profile?.firstName + " " + profile?.lastName} size={64} ring />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Profile Image / Avatar
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer transition-all disabled:opacity-50">
                  <Upload size={13} />
                  <span>{selectedFile ? "Change Avatar" : "Upload Avatar"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={profileSubmitting}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
                    onClick={handleRemoveImage}
                    disabled={profileSubmitting}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                type="text"
                placeholder="First Name"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                type="text"
                placeholder="Last Name"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
              >
                <option value="male" className="text-slate-900 bg-white">Male</option>
                <option value="female" className="text-slate-900 bg-white">Female</option>
                <option value="other" className="text-slate-900 bg-white">Other</option>
                <option value="any" className="text-slate-900 bg-white">Any</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Occupation
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                value={profileForm.occupation}
                onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
              >
                <option value="student" className="text-slate-900 bg-white">Student</option>
                <option value="working_professional" className="text-slate-900 bg-white">Working Professional</option>
                <option value="self_employed" className="text-slate-900 bg-white">Self Employed</option>
                <option value="business_owner" className="text-slate-900 bg-white">Business Owner</option>
                <option value="freelancer" className="text-slate-900 bg-white">Freelancer</option>
                <option value="other" className="text-slate-900 bg-white">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Languages Known (comma separated)
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                type="text"
                placeholder="e.g. English, Hindi, Spanish"
                value={profileForm.languagesKnown}
                onChange={(e) => setProfileForm({ ...profileForm, languagesKnown: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              About Me
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              rows={3}
              placeholder="Tell us about yourself…"
              value={profileForm.aboutMe}
              onChange={(e) => setProfileForm({ ...profileForm, aboutMe: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select User Preferences
            </label>

            {loadingMasterPrefs ? (
              <div className="text-xs text-slate-500 py-3 text-center">Loading master preference options…</div>
            ) : masterPreferences.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">No active preference options available.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {masterPreferences.map((pref) => {
                  const isChecked = profileForm.selectedPreferences.includes(pref._id);
                  return (
                    <button
                      key={pref._id}
                      type="button"
                      onClick={() => handleTogglePref(pref._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isChecked
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer pointer-events-none"
                      />
                      <span>{pref.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              disabled={profileSubmitting}
            >
              {profileSubmitting ? "Saving Profile…" : "Save Profile & Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
