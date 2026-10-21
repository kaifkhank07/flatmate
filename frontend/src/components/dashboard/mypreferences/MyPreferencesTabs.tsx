'use client';

import React, { useState } from 'react';
import PreferencesManager from './PreferencesManager';
import NotificationPreferences from '../notification/NotificationPreferences';
import PropertyMatchPreferences from '../notification/PropertyMatchPreferences';
import { Sliders, Bell, Sparkles } from 'lucide-react';
import SectionHeading from '../../utils/SectionHeading';
import { ViewReveal } from '../../animation';

export default function MyPreferencesTabs() {
  const [activeTab, setActiveTab] = useState<'lifestyle' | 'notifications' | 'match'>('lifestyle');

  return (
    <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-8 sm:space-y-10">
      {/* Switcher Navigation */}
      <ViewReveal duration={800}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 sm:pt-6">
          <SectionHeading
            title="Account & Lifestyle Preferences"
            description="Manage your flatmate lifestyle compatibility, communication channels, and search alerts."
          />

          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-[#E2EFF8] shadow-xs self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('lifestyle')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${activeTab === 'lifestyle'
                ? 'bg-[#0066F9] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Flatmate Lifestyle</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${activeTab === 'notifications'
                ? 'bg-[#0066F9] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notification Channels</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('match')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${activeTab === 'match'
                ? 'bg-[#0066F9] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Match Alerts</span>
            </button>
          </div>
        </div>
      </ViewReveal>

      <ViewReveal duration={900} startDelay={100}>
        {activeTab === 'lifestyle' && <PreferencesManager />}
        {activeTab === 'notifications' && <NotificationPreferences />}
        {activeTab === 'match' && <PropertyMatchPreferences />}
      </ViewReveal>
    </div>
  );
}
