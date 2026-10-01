import { create } from 'zustand';
import apiClient from '@/lib/api';
import {
  UnifiedListingItem,
  ListingQueryParams,
  PaginationInfo,
  ListingOptions,
  ApiResponse,
  GetListingsResponseData,
  AmenityItem,
  CityItem,
  UserPreferenceItem,
  PropertyListingItem,
  FlatmateRequirementItem,
} from '@/types/listing';

interface ListingState {
  // State
  listings: UnifiedListingItem[];
  latestListings: UnifiedListingItem[];
  selectedListing: UnifiedListingItem | null;
  loading: boolean;
  loadingLatestListings: boolean;
  loadingDetails: boolean;
  loadingOptions: boolean;
  error: string | null;
  latestListingsError: string | null;
  optionsError: string | null;
  pagination: PaginationInfo;
  filters: ListingQueryParams;
  options: ListingOptions;

  // Actions
  fetchListings: (customParams?: ListingQueryParams) => Promise<void>;
  fetchLatestListings: () => Promise<void>;
  fetchListingBySlug: (
    slug: string,
    sourceType?: 'property' | 'flatmate_requirement'
  ) => Promise<UnifiedListingItem | null>;
  fetchListingOptions: () => Promise<void>;
  createProperty: (payload: any) => Promise<PropertyListingItem | null>;
  createFlatmateRequirement: (payload: any) => Promise<FlatmateRequirementItem | null>;
  setFilters: (
    newFilters: Partial<ListingQueryParams>,
    refetch?: boolean
  ) => void;
  resetFilters: (refetch?: boolean) => void;
  resetListings: () => void;
}

const initialPagination: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const initialFilters: ListingQueryParams = {
  page: 1,
  limit: 10,
  sourceType: 'all',
  sortBy: 'createdAt',
  order: 'desc',
};

const initialOptions: ListingOptions = {
  amenities: [],
  cities: [],
  lifestylePreferences: [],
  listingTypes: [
    { label: 'All Types', value: 'all' },
    { label: 'Flat', value: 'flat' },
    { label: 'Room', value: 'room' },
    { label: 'PG / Hostel', value: 'pg' },
    { label: 'Shared Apartment', value: 'shared_apartment' },
    { label: 'Entire Property', value: 'entire_property' },
  ],
  furnishingTypes: [
    { label: 'All', value: 'all' },
    { label: 'Fully Furnished', value: 'fully_furnished' },
    { label: 'Semi Furnished', value: 'semi_furnished' },
    { label: 'Unfurnished', value: 'unfurnished' },
  ],
  genderPreferences: [
    { label: 'Any Gender', value: 'any' },
    { label: 'Male Only', value: 'male' },
    { label: 'Female Only', value: 'female' },
    { label: 'Other', value: 'other' },
  ],
  occupationPreferences: [
    { label: 'Any Occupation', value: 'any' },
    { label: 'Students', value: 'student' },
    { label: 'Working Professionals', value: 'working_professional' },
    { label: 'Self Employed', value: 'self_employed' },
    { label: 'Business Owner', value: 'business_owner' },
    { label: 'Freelancer', value: 'freelancer' },
  ],
};

export const useListingStore = create<ListingState>((set, get) => ({
  // Initial State
  listings: [],
  latestListings: [],
  selectedListing: null,
  loading: false,
  loadingLatestListings: false,
  loadingDetails: false,
  loadingOptions: false,
  error: null,
  latestListingsError: null,
  optionsError: null,
  pagination: initialPagination,
  filters: initialFilters,
  options: initialOptions,

  /**
   * Create new Property listing
   */
  createProperty: async (payload: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ApiResponse<PropertyListingItem>>('/properties', payload);
      if (response.data?.success && response.data.data) {
        set({ loading: false });
        return response.data.data;
      } else {
        const errorMsg = response.data?.message || 'Failed to create property';
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to create property';
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  /**
   * Create new Flatmate Requirement listing
   */
  createFlatmateRequirement: async (payload: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ApiResponse<FlatmateRequirementItem>>('/flatmate-requirements', payload);
      if (response.data?.success && response.data.data) {
        set({ loading: false });
        return response.data.data;
      } else {
        const errorMsg = response.data?.message || 'Failed to create flatmate requirement';
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to create flatmate requirement';
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  /**
   * Fetch listings from GET /api/listings using active filters
   */
  fetchListings: async (customParams?: ListingQueryParams) => {
    set({ loading: true, error: null });

    try {
      const activeFilters = {
        ...get().filters,
        ...customParams,
      };

      // Clean empty / undefined filter values before sending
      const cleanParams: Record<string, any> = {};
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val !== undefined && val !== '' && val !== 'all') {
          cleanParams[key] = val;
        }
      });

      // Maintain explicit pagination and sorting params
      cleanParams.page = activeFilters.page || 1;
      cleanParams.limit = activeFilters.limit || 10;
      cleanParams.sortBy = activeFilters.sortBy || 'createdAt';
      cleanParams.order = activeFilters.order || 'desc';

      if (activeFilters.sourceType && activeFilters.sourceType !== 'all') {
        cleanParams.sourceType = activeFilters.sourceType;
      }

      const response = await apiClient.get<
        ApiResponse<GetListingsResponseData>
      >('/listings', {
        params: cleanParams,
      });

      const responseData = response.data?.data;

      if (responseData) {
        set({
          listings: responseData.listings || [],
          pagination: responseData.pagination || initialPagination,
          loading: false,
          error: null,
        });
      } else {
        set({
          listings: [],
          pagination: initialPagination,
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || 'Failed to fetch listings',
      });
    }
  },

  /**
   * Fetch single listing by slug (Property or Flatmate Requirement)
   */
  fetchListingBySlug: async (
    slug: string,
    sourceType?: 'property' | 'flatmate_requirement'
  ) => {
    set({ loadingDetails: true, error: null });

    try {
      // 1. Unified endpoint GET /api/listings/slug/:slug
      try {
        const res = await apiClient.get<ApiResponse<UnifiedListingItem>>(
          `/listings/slug/${encodeURIComponent(slug)}`
        );
        if (res.data?.success && res.data.data) {
          set({ selectedListing: res.data.data, loadingDetails: false });
          return res.data.data;
        }
      } catch (unifiedErr) {
        // Fallback to model-specific endpoints
      }

      // 2. Fallback to /properties/slug/:slug
      if (sourceType === 'property' || !sourceType) {
        try {
          const res = await apiClient.get<ApiResponse<PropertyListingItem>>(
            `/properties/slug/${encodeURIComponent(slug)}`
          );
          if (res.data?.success && res.data.data) {
            const item: PropertyListingItem = {
              ...res.data.data,
              sourceType: 'property',
            };
            set({ selectedListing: item, loadingDetails: false });
            return item;
          }
        } catch (propErr) {
          if (sourceType === 'property') throw propErr;
        }
      }

      // 3. Fallback to /flatmate-requirements/slug/:slug
      if (sourceType === 'flatmate_requirement' || !sourceType) {
        const res = await apiClient.get<ApiResponse<FlatmateRequirementItem>>(
          `/flatmate-requirements/slug/${encodeURIComponent(slug)}`
        );
        if (res.data?.success && res.data.data) {
          const item: FlatmateRequirementItem = {
            ...res.data.data,
            sourceType: 'flatmate_requirement',
          };
          set({ selectedListing: item, loadingDetails: false });
          return item;
        }
      }

      set({ selectedListing: null, loadingDetails: false });
      return null;
    } catch (err: any) {
      set({
        selectedListing: null,
        loadingDetails: false,
        error: err.message || 'Failed to fetch listing details',
      });
      return null;
    }
  },

  /**
   * Fetch dynamic options (amenities, cities, lifestyle preferences) from backend
   */
  fetchListingOptions: async () => {
    set({ loadingOptions: true, optionsError: null });

    try {
      const [amenitiesRes, citiesRes, preferencesRes] = await Promise.allSettled(
        [
          apiClient.get<ApiResponse<{ items: AmenityItem[] } | AmenityItem[]>>(
            '/property-amenities'
          ),
          apiClient.get<ApiResponse<CityItem[]>>('/cities'),
          apiClient.get<ApiResponse<UserPreferenceItem[]>>('/user-preferences'),
        ]
      );

      let fetchedAmenities: AmenityItem[] = [];
      if (amenitiesRes.status === 'fulfilled' && amenitiesRes.value.data?.data) {
        const rawData: any = amenitiesRes.value.data.data;
        fetchedAmenities = Array.isArray(rawData) ? rawData : rawData.items || [];
      }

      let fetchedCities: CityItem[] = [];
      if (citiesRes.status === 'fulfilled' && citiesRes.value.data?.data) {
        const rawData: any = citiesRes.value.data.data;
        fetchedCities = Array.isArray(rawData) ? rawData : rawData.items || [];
      }

      let fetchedPreferences: UserPreferenceItem[] = [];
      if (
        preferencesRes.status === 'fulfilled' &&
        preferencesRes.value.data?.data
      ) {
        const rawData: any = preferencesRes.value.data.data;
        fetchedPreferences = Array.isArray(rawData)
          ? rawData
          : rawData.items || [];
      }

      set((state) => ({
        options: {
          ...state.options,
          amenities: fetchedAmenities,
          cities: fetchedCities,
          lifestylePreferences: fetchedPreferences,
        },
        loadingOptions: false,
        optionsError: null,
      }));
    } catch (err: any) {
      set({
        loadingOptions: false,
        optionsError: err.message || 'Failed to fetch listing options',
      });
    }
  },

  /**
   * Set filter parameters and optionally refetch listings
   */
  setFilters: (newFilters: Partial<ListingQueryParams>, refetch = true) => {
    const updatedFilters = {
      ...get().filters,
      ...newFilters,
    };
    set({ filters: updatedFilters });

    if (refetch) {
      get().fetchListings(updatedFilters);
    }
  },

  /**
   * Reset filters to initial defaults
   */
  resetFilters: (refetch = true) => {
    set({ filters: initialFilters });
    if (refetch) {
      get().fetchListings(initialFilters);
    }
  },

  /**
   * Fetch latest 12 listings for homepage (independent of normal listing state)
   */
  fetchLatestListings: async () => {
    set({ loadingLatestListings: true, latestListingsError: null });

    try {
      const response = await apiClient.get<
        ApiResponse<GetListingsResponseData>
      >('/listings', {
        params: {
          page: 1,
          limit: 12,
          // sourceType: 'all',
          sourceType: 'property',
          sortBy: 'createdAt',
          order: 'desc',
        },
      });

      const responseData = response.data?.data;

      if (responseData) {
        set({
          latestListings: responseData.listings || [],
          loadingLatestListings: false,
          latestListingsError: null,
        });
      } else {
        set({
          latestListings: [],
          loadingLatestListings: false,
          latestListingsError: null,
        });
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch latest listings';
      set({
        latestListings: [],
        loadingLatestListings: false,
        latestListingsError: errorMsg,
      });
    }
  },

  /**
   * Reset store state
   */
  resetListings: () => {
    set({
      listings: [],
      latestListings: [],
      loadingLatestListings: false,
      latestListingsError: null,
      selectedListing: null,
      loading: false,
      loadingDetails: false,
      error: null,
      pagination: initialPagination,
      filters: initialFilters,
    });
  },
}));
