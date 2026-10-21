"use client";

import { useEffect, useState } from "react";
import {
  IChannelPreferences,
  ICategoryPreferences,
  NotificationChannel,
  NotificationCategory,
  ADMIN_NOTIFICATION_CATEGORIES_META,
  NOTIFICATION_CHANNELS_META,
} from "@/types/notification.types";
import {
  fetchAdminNotificationPreferences,
  updateAdminNotificationPreferences,
} from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Card, Chip } from "@/components/ui";
import Icon from "@/components/icons";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowLeft,
  RotateCw,
} from "lucide-react";

interface AdminNotificationPreferencesProps {
  onBack?: () => void;
}

const CHANNELS_LIST: Array<{
  key: keyof IChannelPreferences;
  channel: NotificationChannel;
  icon: any;
}> = [
    { key: "inApp", channel: "IN_APP", icon: Bell },
    { key: "email", channel: "EMAIL", icon: Mail },
    { key: "sms", channel: "SMS", icon: Smartphone },
    { key: "whatsapp", channel: "WHATSAPP", icon: MessageSquare },
  ];

const ADMIN_CATEGORIES_ORDER: Array<{
  category: NotificationCategory;
  key: keyof ICategoryPreferences;
}> = [
    { category: "ADMINISTRATIVE", key: "administrative" },
    { category: "LISTING_UPDATES", key: "listingUpdates" },
    { category: "REPORTS_AND_REVIEWS", key: "reportsAndReviews" },
    { category: "INQUIRIES_AND_REQUESTS", key: "inquiriesAndRequests" },
    { category: "ACCOUNT_AND_VERIFICATION", key: "accountAndVerification" },
    { category: "SYSTEM", key: "system" },
    { category: "CHAT", key: "chat" },
  ];

export default function AdminNotificationPreferences({
  onBack,
}: AdminNotificationPreferencesProps) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [channels, setChannels] = useState<IChannelPreferences>({
    inApp: true,
    email: true,
    sms: false,
    whatsapp: false,
  });

  const [categories, setCategories] = useState<ICategoryPreferences | null>(null);

  // Load preferences
  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminNotificationPreferences();
      if (res.success && res.data) {
        if (res.data.channels) setChannels(res.data.channels);
        if (res.data.categories) setCategories(res.data.categories);
      } else {
        setError(res.message || "Failed to load preferences");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // Toggle Master Global Channel Switch
  const handleToggleGlobalChannel = (channelKey: keyof IChannelPreferences) => {
    setChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
    setHasChanges(true);
    setSuccess(null);
  };

  // Toggle Category Channel Switch
  const handleToggleCategoryChannel = (
    catKey: keyof ICategoryPreferences,
    channelKey: keyof IChannelPreferences
  ) => {
    if (!categories) return;
    setCategories((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [catKey]: {
          ...prev[catKey],
          [channelKey]: !prev[catKey][channelKey],
        },
      };
    });
    setHasChanges(true);
    setSuccess(null);
  };

  // Save changes
  const handleSave = async () => {
    if (!categories || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await updateAdminNotificationPreferences({
        channels,
        categories,
      });

      if (res.success && res.data) {
        setHasChanges(false);
        setSuccess("Staff notification preferences updated successfully!");
        toast("Notification preferences saved successfully");
        if (res.data.channels) setChannels(res.data.channels);
        if (res.data.categories) setCategories(res.data.categories);
      } else {
        setError(res.message || "Failed to save preferences");
        toast(res.message || "Failed to save preferences");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save preferences");
      toast("Error saving notification preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-14 bg-[var(--card)] rounded-2xl border border-[var(--hair)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ember)] mb-3" />
        <p className="text-sm font-medium text-[var(--ink-3)]">
          Loading notification settings…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Back button & Refresh */}
      <div className="flex items-center justify-between pb-2">
        {onBack ? (
          <button className="btn btn-ghost sm" onClick={onBack}>
            <ArrowLeft size={13} /> Back
          </button>
        ) : <div />}

        <button
          className="btn btn-ghost sm"
          onClick={loadPreferences}
          disabled={loading}
        >
          <RotateCw size={13} /> Refresh
        </button>
      </div>

      {/* Status Banners */}
      {success && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Master Delivery Channels */}
      <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--hair)] space-y-5">
        <div>
          <h3 className="text-base font-bold text-[var(--ink-1)]">
            Master Delivery Channels
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Global switches for your admin staff account. Turning off a channel here disables it for all alert categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHANNELS_LIST.map(({ key, channel, icon: IconComponent }) => {
            const meta = NOTIFICATION_CHANNELS_META[channel];
            const isEnabled = channels[key];

            return (
              <div
                key={key}
                onClick={() => handleToggleGlobalChannel(key)}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${isEnabled
                  ? "bg-[var(--canvas-2)] border-[var(--ember)]/40 shadow-xs"
                  : "bg-[var(--card)] border-[var(--hair)] opacity-60 hover:opacity-100"
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${isEnabled
                      ? "bg-[var(--ember)] text-white"
                      : "bg-[var(--canvas-2)] text-[var(--ink-4)]"
                      }`}
                  >
                    <IconComponent size={17} />
                  </div>

                  {/* Switch Pill */}
                  <div
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${isEnabled ? "bg-[var(--ember)]" : "bg-gray-300 dark:bg-gray-700"
                      }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--ink-1)]">
                    {meta.label}
                  </h4>
                  <p className="text-[11px] text-[var(--ink-4)] mt-0.5 leading-snug">
                    {meta.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Category Delivery Matrix */}
      <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--hair)] space-y-5">
        <div>
          <h3 className="text-base font-bold text-[var(--ink-1)]">
            Category Delivery Settings
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Configure delivery channels for each operational category. Channels disabled globally above cannot be activated per category.
          </p>
        </div>

        <div className="divide-y divide-[var(--hair)]">
          {ADMIN_CATEGORIES_ORDER.map(({ category, key: catKey }) => {
            const meta = ADMIN_NOTIFICATION_CATEGORIES_META[category];
            const catSettings = categories ? categories[catKey] : null;

            return (
              <div
                key={catKey}
                className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Category Info */}
                <div className="md:max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--ink-1)]">
                      {meta.label}
                    </span>
                    <Chip tone={meta.colorTone as any}>{category}</Chip>
                  </div>
                  <p className="text-xs text-[var(--ink-3)] mt-1">
                    {meta.description}
                  </p>
                </div>

                {/* Channel Toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                  {CHANNELS_LIST.map(({ key: channelKey, channel }) => {
                    const isGlobalEnabled = channels[channelKey];
                    const isCatEnabled = catSettings ? catSettings[channelKey] : true;
                    const isEffectivelyActive = isGlobalEnabled && isCatEnabled;

                    return (
                      <button
                        key={channelKey}
                        type="button"
                        onClick={() =>
                          isGlobalEnabled && handleToggleCategoryChannel(catKey, channelKey)
                        }
                        disabled={!isGlobalEnabled}
                        title={
                          !isGlobalEnabled
                            ? `${channel} is disabled globally in master switches`
                            : `Toggle ${channel}`
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${!isGlobalEnabled
                          ? "bg-[var(--canvas-2)] border-[var(--hair)] text-[var(--ink-4)] cursor-not-allowed opacity-50"
                          : isEffectivelyActive
                            ? "bg-[var(--canvas-2)] border-[var(--ember)] text-[var(--ink-1)] font-semibold shadow-2xs"
                            : "bg-[var(--card)] border-[var(--hair)] text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                          }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${isEffectivelyActive ? "bg-[var(--ember)]" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                        />
                        <span>{channel.replace("_", " ")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Override Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
        <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">
            Critical Administrative Security Policy
          </span>
          <p className="leading-relaxed text-amber-800">
            High-severity operational alerts, server exceptions, and critical security verification notices bypass user category opt-outs to ensure platform safety and reliability.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${hasChanges
            ? "bg-[var(--ember)] hover:opacity-90"
            : "bg-gray-400 dark:bg-gray-600"
            }`}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving preferences…</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
