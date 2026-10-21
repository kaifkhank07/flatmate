'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { IPropertyMatchPreferences } from '@/types/notification.types';
import {
  Sparkles,
  MapPin,
  IndianRupee,
  Home,
  Sofa,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';

export interface PropertyMatchPreferencesProps {
  onBack?: () => void;
}

const COMMON_CITIES = [
  'Hyderabad',
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Pune',
  'Kolkata',
  'Chennai',
  'Gurugram',
  'Noida',
];

const PROPERTY_TYPES: Array<{
  value: 'flat' | 'room' | 'pg' | 'shared_apartment' | 'entire_property';
  label: string;
}> = [
  { value: 'flat', label: 'Flat' },
  { value: 'room', label: 'Single Room' },
  { value: 'pg', label: 'PG' },
  { value: 'shared_apartment', label: 'Shared Apartment' },
  { value: 'entire_property', label: 'Entire Property' },
];

const FURNISHING_TYPES: Array<{
  value: 'fully_furnished' | 'semi_furnished' | 'unfurnished';
  label: string;
}> = [
  { value: 'fully_furnished', label: 'Fully Furnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

export default function PropertyMatchPreferences({ onBack }: PropertyMatchPreferencesProps = {}) {
  const {
    preferences,
    isPreferencesLoading,
    isSavingPreferences,
    preferencesError,
    fetchPreferences,
    updatePropertyMatchPreferences,
  } = useNotificationStore();

  const [formData, setFormData] = useState<IPropertyMatchPreferences>({
    enabled: false,
    cities: [],
    localities: [],
    budget: { min: undefined, max: undefined },
    propertyTypes: [],
    furnishing: [],
    availableFrom: undefined,
    immediateOnly: false,
    genderPreference: 'any',
    occupationPreference: 'any',
    postType: 'both',
  });

  const [localityInput, setLocalityInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences?.propertyMatch) {
      setFormData({
        enabled: preferences.propertyMatch.enabled ?? false,
        cities: preferences.propertyMatch.cities || [],
        localities: preferences.propertyMatch.localities || [],
        budget: {
          min: preferences.propertyMatch.budget?.min,
          max: preferences.propertyMatch.budget?.max,
        },
        propertyTypes: preferences.propertyMatch.propertyTypes || [],
        furnishing: preferences.propertyMatch.furnishing || [],
        availableFrom: preferences.propertyMatch.availableFrom
          ? preferences.propertyMatch.availableFrom.split('T')[0]
          : undefined,
        immediateOnly: preferences.propertyMatch.immediateOnly ?? false,
        genderPreference: preferences.propertyMatch.genderPreference || 'any',
        occupationPreference: preferences.propertyMatch.occupationPreference || 'any',
        postType: preferences.propertyMatch.postType || 'both',
      });
      setLocalityInput((preferences.propertyMatch.localities || []).join(', '));
    }
  }, [preferences]);

  // Toggle master enabled flag
  const handleToggleEnabled = () => {
    setFormData((prev) => ({ ...prev, enabled: !prev.enabled }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Toggle city in selection
  const handleToggleCity = (city: string) => {
    setFormData((prev) => {
      const exists = prev.cities.includes(city);
      const updated = exists ? prev.cities.filter((c) => c !== city) : [...prev.cities, city];
      return { ...prev, cities: updated };
    });
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleAddCustomCity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && cityInput.trim()) {
      e.preventDefault();
      const trimmed = cityInput.trim();
      if (!formData.cities.includes(trimmed)) {
        setFormData((prev) => ({ ...prev, cities: [...prev.cities, trimmed] }));
        setHasChanges(true);
      }
      setCityInput('');
    }
  };

  // Toggle property type
  const handleTogglePropertyType = (type: any) => {
    setFormData((prev) => {
      const exists = prev.propertyTypes.includes(type);
      const updated = exists
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type];
      return { ...prev, propertyTypes: updated };
    });
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Toggle furnishing type
  const handleToggleFurnishing = (type: any) => {
    setFormData((prev) => {
      const exists = prev.furnishing.includes(type);
      const updated = exists
        ? prev.furnishing.filter((t) => t !== type)
        : [...prev.furnishing, type];
      return { ...prev, furnishing: updated };
    });
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Save form
  const handleSave = async () => {
    setValidationError(null);

    // Validate budget
    const min = formData.budget?.min;
    const max = formData.budget?.max;
    if (min !== undefined && max !== undefined && min > max) {
      setValidationError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    // Process localities from comma-separated input
    const processedLocalities = localityInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      localities: processedLocalities,
    };

    const ok = await updatePropertyMatchPreferences(payload);
    if (ok) {
      setHasChanges(false);
      setSuccessMessage('Property match criteria saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  if (isPreferencesLoading && !preferences) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E2EFF8]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066F9] mb-3" />
        <p className="text-sm font-medium text-gray-600">Loading match criteria...</p>
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

      {(validationError || preferencesError) && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError || preferencesError}</span>
        </div>
      )}

      {/* MASTER TOGGLE CARD */}
      <div className="flex items-center justify-between p-6 sm:p-8 rounded-3xl bg-white border border-[#E2EFF8] shadow-xs">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              formData.enabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Smart Property Match Alerts
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Receive automatic in-app alerts and WhatsApp notifications when newly published listings
              match your preferences.
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={handleToggleEnabled}
          aria-label="Toggle Smart Property Match Alerts"
          className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-4 ${
            formData.enabled ? 'bg-[#0066F9]' : 'bg-gray-300'
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
              formData.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* FORM FIELDS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2EFF8] shadow-xs space-y-8">
        {/* Preferred Cities */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0066F9]" />
            <label className="text-sm font-bold text-gray-900">Preferred Cities</label>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMMON_CITIES.map((city) => {
              const isSelected = formData.cities.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleToggleCity(city)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-[#0066F9] text-[#0066F9]'
                      : 'bg-white border-[#E2EFF8] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>

          {/* Add custom city input */}
          <div className="pt-1">
            <input
              type="text"
              placeholder="Or type another city and press Enter..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleAddCustomCity}
              className="w-full max-w-md px-4 py-2 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20"
            />
          </div>
        </div>

        {/* Localities / Neighborhoods */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Preferred Localities</label>
          <p className="text-xs text-gray-500">
            Enter specific neighborhoods separated by commas (e.g. Hitec City, Gachibowli, Madhapur).
          </p>
          <input
            type="text"
            placeholder="e.g. Koramangala, Indiranagar, HSR Layout"
            value={localityInput}
            onChange={(e) => {
              setLocalityInput(e.target.value);
              setHasChanges(true);
            }}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20"
          />
        </div>

        {/* Budget Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-[#0066F9]" />
            <label className="text-sm font-bold text-gray-900">Monthly Budget (₹)</label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Minimum Rent (₹)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 5000"
                value={formData.budget?.min ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setFormData((prev) => ({
                    ...prev,
                    budget: { ...prev.budget, min: val },
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Maximum Rent (₹)</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 25000"
                value={formData.budget?.max ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setFormData((prev) => ({
                    ...prev,
                    budget: { ...prev.budget, max: val },
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20"
              />
            </div>
          </div>
        </div>

        {/* Property Types */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-[#0066F9]" />
            <label className="text-sm font-bold text-gray-900">Property Type</label>
          </div>

          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map(({ value, label }) => {
              const isSelected = formData.propertyTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTogglePropertyType(value)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-[#0066F9] text-[#0066F9] font-semibold'
                      : 'bg-white border-[#E2EFF8] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Furnishing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sofa className="w-4 h-4 text-[#0066F9]" />
            <label className="text-sm font-bold text-gray-900">Furnishing</label>
          </div>

          <div className="flex flex-wrap gap-2">
            {FURNISHING_TYPES.map(({ value, label }) => {
              const isSelected = formData.furnishing.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleToggleFurnishing(value)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-[#0066F9] text-[#0066F9] font-semibold'
                      : 'bg-white border-[#E2EFF8] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability & Move-in */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0066F9]" />
              <label className="text-xs sm:text-sm font-bold text-gray-900">
                Move-in Date Preference
              </label>
            </div>
            <input
              type="date"
              value={formData.availableFrom || ''}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, availableFrom: e.target.value || undefined }));
                setHasChanges(true);
              }}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20"
            />
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.immediateOnly}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, immediateOnly: e.target.checked }));
                  setHasChanges(true);
                }}
                className="w-4 h-4 rounded text-[#0066F9] focus:ring-[#0066F9]"
              />
              <span>Immediate move-in properties only</span>
            </label>
          </div>
        </div>

        {/* Preferences (Gender & Occupation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0066F9]" />
              <label className="text-xs sm:text-sm font-bold text-gray-900">Gender Preference</label>
            </div>
            <select
              value={formData.genderPreference}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, genderPreference: e.target.value as any }));
                setHasChanges(true);
              }}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 bg-white"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#0066F9]" />
              <label className="text-xs sm:text-sm font-bold text-gray-900">
                Occupation Preference
              </label>
            </div>
            <select
              value={formData.occupationPreference}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, occupationPreference: e.target.value as any }));
                setHasChanges(true);
              }}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E2EFF8] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 bg-white"
            >
              <option value="any">Any Occupation</option>
              <option value="working_professional">Working Professional</option>
              <option value="student">Student</option>
              <option value="self_employed">Self Employed</option>
              <option value="business_owner">Business Owner</option>
              <option value="freelancer">Freelancer</option>
              <option value="other">Other</option>
            </select>
          </div>
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
              <span>Saving criteria...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Match Criteria</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
