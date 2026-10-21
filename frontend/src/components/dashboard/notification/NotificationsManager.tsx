'use client';

import React, { useState, useRef, useEffect } from 'react';
import SectionHeading from '../../utils/SectionHeading';
import { ViewReveal } from '../../animation';
import NotificationList from './NotificationList';
import NotificationPreferences from './NotificationPreferences';
import PropertyMatchPreferences from './PropertyMatchPreferences';
import { Settings, Sliders, Sparkles, ChevronDown, ArrowLeft, Mail } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

type NotificationTab = 'inbox' | 'channels' | 'match_criteria';

export default function NotificationsManager() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('inbox');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotificationStore();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  // Contextual header info based on active tab
  const getHeading = () => {
    switch (activeTab) {
      case 'channels':
        return {
          title: 'Notification Channels & Alerts',
          description:
            'Configure global delivery channels and fine-tune delivery preferences by category.',
        };
      case 'match_criteria':
        return {
          title: 'Smart Property Match Criteria',
          description:
            'Set your search filters to receive automated in-app alerts and notifications when matching listings are published.',
        };
      case 'inbox':
      default:
        return {
          title: 'My Notifications & Alerts',
          description:
            'Manage your incoming activity alerts, delivery channels, and smart property match preferences.',
        };
    }
  };

  const headingInfo = getHeading();

  return (
    <section className="w-full min-h-[90vh] py-10 sm:py-16">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 space-y-8 sm:space-y-10">
        {/* Header */}
        <ViewReveal duration={800} className="relative z-30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeading
              title={headingInfo.title}
              description={headingInfo.description}
            />

            {/* Navigation Actions */}
            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              {/* Unread Badge (visible in Inbox view) */}
              {/* {activeTab === 'inbox' && unreadCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066F9] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#0066F9] animate-pulse" />
                  <span>{unreadCount > 99 ? '99+' : unreadCount} Unread</span>
                </div>
              )} */}

              {/* Settings Dropdown Popover */}
              <div className="relative z-40" ref={settingsMenuRef}>
                {/* <button
                  type="button"
                  id="notification-settings-btn"
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  aria-expanded={isSettingsOpen}
                  aria-haspopup="true"
                  aria-controls="notification-settings-menu"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border  select-none ${isSettingsOpen || activeTab !== 'inbox'
                    ? 'bg-[#0066F9] text-white border-[#0066F9]'
                    : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-[#E2EFF8]'
                    }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button> */}

                {isSettingsOpen && (
                  <div
                    id="notification-settings-menu"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="notification-settings-btn"
                    className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 p-1.5 rounded-2xl bg-white border border-[#E2EFF8] shadow-2xl shadow-gray-400/30 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Notification Settings
                    </div>

                    {
                      activeTab !== 'inbox' && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setActiveTab('inbox');
                            setIsSettingsOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition cursor-pointer text-gray-700 hover:bg-gray-50 hover:text-gray-900`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-600`}
                          >
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <div>
                              <div className="text-gray-900 font-semibold text-xs sm:text-sm">
                                Back to Inbox
                              </div>
                              <div className="text-gray-400 text-[11px] leading-tight mt-0.5">
                                Manage Inbox & Notification Settings
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    }

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveTab('channels');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition cursor-pointer ${activeTab === 'channels'
                        ? 'bg-[#F4F9FF] text-[#0066F9] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'channels'
                          ? 'bg-[#0066F9] text-white'
                          : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-gray-900 font-semibold text-xs sm:text-sm">
                          Channels & Alerts
                        </div>
                        <div className="text-gray-400 text-[11px] leading-tight mt-0.5">
                          Email, SMS, WhatsApp & In-App
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveTab('match_criteria');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition cursor-pointer mt-1 ${activeTab === 'match_criteria'
                        ? 'bg-[#F4F9FF] text-[#0066F9] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'match_criteria'
                          ? 'bg-[#0066F9] text-white'
                          : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-gray-900 font-semibold text-xs sm:text-sm">
                          Smart Match Criteria
                        </div>
                        <div className="text-gray-400 text-[11px] leading-tight mt-0.5">
                          City, budget & lifestyle alerts
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ViewReveal>

        {/* Tab Content Panels */}
        <ViewReveal duration={900} startDelay={100} className="relative z-10">
          {activeTab === 'inbox' && <NotificationList />}
          {activeTab === 'channels' && (
            <NotificationPreferences onBack={() => setActiveTab('inbox')} />
          )}
          {activeTab === 'match_criteria' && (
            <PropertyMatchPreferences onBack={() => setActiveTab('inbox')} />
          )}
        </ViewReveal>
      </div>
    </section>
  );
}