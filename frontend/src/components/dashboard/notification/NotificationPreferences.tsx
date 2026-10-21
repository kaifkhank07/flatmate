'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  IChannelPreferences,
  ICategoryPreferences,
  NotificationChannel,
  NotificationCategory,
  NOTIFICATION_CATEGORY_META,
  NOTIFICATION_CHANNELS_META,
} from '@/types/notification.types';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowLeft,
} from 'lucide-react';

export interface NotificationPreferencesProps {
  onBack?: () => void;
}

const CHANNELS_LIST: Array<{ key: keyof IChannelPreferences; channel: NotificationChannel; icon: any }> = [
  { key: 'inApp', channel: 'IN_APP', icon: Bell },
  { key: 'email', channel: 'EMAIL', icon: Mail },
  { key: 'sms', channel: 'SMS', icon: Smartphone },
  { key: 'whatsapp', channel: 'WHATSAPP', icon: MessageSquare },
];

const CATEGORIES_ORDER: Array<{ category: NotificationCategory; key: keyof ICategoryPreferences }> = [
  { category: 'ACCOUNT_AND_VERIFICATION', key: 'accountAndVerification' },
  { category: 'LISTING_UPDATES', key: 'listingUpdates' },
  { category: 'PROPERTY_MATCH', key: 'propertyMatch' },
  { category: 'CHAT', key: 'chat' },
  { category: 'INQUIRIES_AND_REQUESTS', key: 'inquiriesAndRequests' },
  { category: 'REPORTS_AND_REVIEWS', key: 'reportsAndReviews' },
  { category: 'SYSTEM', key: 'system' },
];

export default function NotificationPreferences({ onBack }: NotificationPreferencesProps = {}) {
  const {
    preferences,
    isPreferencesLoading,
    isSavingPreferences,
    preferencesError,
    fetchPreferences,
    updatePreferences,
  } = useNotificationStore();

  const [channels, setChannels] = useState<IChannelPreferences>({
    inApp: true,
    email: true,
    sms: true,
    whatsapp: true,
  });

  const [categories, setCategories] = useState<ICategoryPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Sync state from store preferences
  useEffect(() => {
    if (preferences) {
      if (preferences.channels) {
        setChannels(preferences.channels);
      }
      if (preferences.categories) {
        setCategories(preferences.categories);
      }
    }
  }, [preferences]);

  // Toggle Global Channel Master Switch
  const handleToggleGlobalChannel = (channelKey: keyof IChannelPreferences) => {
    setChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Toggle Granular Category Channel Switch
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
    setSuccessMessage(null);
  };

  // Save changes
  const handleSave = async () => {
    if (!categories) return;
    const ok = await updatePreferences({
      channels,
      categories,
    });
    if (ok) {
      setHasChanges(false);
      setSuccessMessage('Notification preferences updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  if (isPreferencesLoading && !preferences) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E2EFF8]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066F9] mb-3" />
        <p className="text-sm font-medium text-gray-600">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Back Navigation Button */}
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-[#E2EFF8] hover:bg-gray-50 hover:text-[#0066F9] transition cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inbox</span>
          </button>
        </div>
      )}
      {/* Feedback Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {preferencesError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{preferencesError}</span>
        </div>
      )}

      {/* SECTION 1: Global Channel Master Switches */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2EFF8] shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Delivery Channels (Master Controls)</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Toggle master delivery channels. Turning off a channel here disables it everywhere across
            all categories.
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
                className={`flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isEnabled
                    ? 'bg-[#F4F9FF] border-[#B9DCFF] shadow-xs'
                    : 'bg-gray-50 border-gray-200 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isEnabled ? 'bg-[#0066F9] text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Switch Pill */}
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isEnabled ? 'bg-[#0066F9]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{meta.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Category Preferences Matrix */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2EFF8] shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Category Delivery Settings</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Customize which channels you receive alerts for by category. Channels disabled globally
            above cannot be activated here.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {CATEGORIES_ORDER.map(({ category, key: catKey }) => {
            const meta = NOTIFICATION_CATEGORY_META[category];
            const catSettings = categories ? categories[catKey] : null;

            return (
              <div
                key={catKey}
                className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Category Info */}
                <div className="md:max-w-md">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900">{meta.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                </div>

                {/* Channel Checkbox Toggles */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
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
                            ? `${channel} is disabled globally above`
                            : `Toggle ${channel}`
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                          !isGlobalEnabled
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                            : isEffectivelyActive
                            ? 'bg-blue-50 border-blue-200 text-[#0066F9] font-semibold'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isEffectivelyActive ? 'bg-[#0066F9]' : 'bg-gray-300'
                          }`}
                        />
                        <span>{channel.replace('_', ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Transactional Notice */}
      <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm">
        <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Essential Transactional Security Notices</span>
          <p className="text-amber-800 text-xs leading-relaxed">
            Essential security notifications (such as Mobile OTPs, Email Verification codes, and critical
            account security alerts) are mandatory transactional messages and cannot be disabled to ensure
            account integrity.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSavingPreferences}
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-white transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            hasChanges ? 'bg-[#0066F9] hover:bg-[#0052C7]' : 'bg-gray-400'
          }`}
        >
          {isSavingPreferences ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving preferences...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
