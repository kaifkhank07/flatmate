import { create } from 'zustand';
import apiClient from '@/lib/api';
import {
  deletePropertyApi,
  deleteFlatmateRequirementApi,
  updatePropertyApi,
  updateFlatmateRequirementApi,
} from '@/lib/apiServices';
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
  myListings: UnifiedListingItem[];

  selectedListing: UnifiedListingItem | null;

  loading: boolean;
  loadingMore: boolean;
  loadingLatestListings: boolean;
  loadingDetails: boolean;
  loadingOptions: boolean;
  loadingMyListings: boolean;

  error: string | null;
  latestListingsError: string | null;
  optionsError: string | null;
  myListingsError: string | null;

  pagination: PaginationInfo;
  myListingsPagination: PaginationInfo;

  filters: ListingQueryParams;
  options: ListingOptions;

  // Actions
  // fetchListings: (customParams?: ListingQueryParams) => Promise<void>;
  fetchListings: (
    customParams?: ListingQueryParams,
    append?: boolean
  ) => Promise<void>;
  fetchLatestListings: () => Promise<void>;

  fetchMyListings: (params?: {
    page?: number;
    limit?: number;

    sourceType?: 'all' | 'property' | 'flatmate_requirement';

    q?: string;
    search?: string;

    location?: string;
    locationPlaceId?: string;

    latitude?: number;
    longitude?: number;
    radius?: number;

    budget?: number;

    genderPreference?:
    | 'male'
    | 'female'
    | 'other'
    | 'any'
    | 'all';

    occupationPreference?:
    | 'student'
    | 'working_professional'
    | 'self_employed'
    | 'business_owner'
    | 'freelancer'
    | 'any'
    | 'all';

    moveInDate?: string;
    availableFrom?: string;

    listingType?:
    | 'flat'
    | 'room'
    | 'pg'
    | 'shared_apartment'
    | 'entire_property'
    | 'all';

    furnishing?:
    | 'fully_furnished'
    | 'semi_furnished'
    | 'unfurnished'
    | 'all';

    postType?: 'property' | 'partner' | 'all';

    propertyType?:
    | 'room'
    | 'flat'
    | 'pg'
    | 'shared_apartment'
    | 'all';

    partnerType?:
    | 'roommate'
    | 'flatmate'
    | 'all';

    peopleCount?: number;

    status?:
    | 'all'
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'blocked'
    | 'closed'
    | 'expired';

    sortBy?: 'createdAt' | 'updatedAt' | 'distance';

    order?: 'asc' | 'desc' | '1' | '-1';
  }) => Promise<number | null | void>;

  fetchListingBySlug: (
    slug: string,
    sourceType?: 'property' | 'flatmate_requirement'
  ) => Promise<UnifiedListingItem | null>;
  fetchListingOptions: () => Promise<void>;

  createProperty: (payload: any) => Promise<PropertyListingItem | null>;
  createFlatmateRequirement: (payload: any) => Promise<FlatmateRequirementItem | null>;
  updateProperty: (id: string, payload: any) => Promise<PropertyListingItem | null>;
  updateFlatmateRequirement: (id: string, payload: any) => Promise<FlatmateRequirementItem | null>;
  deleteListing: (id: string, sourceType: 'property' | 'flatmate_requirement' | string) => Promise<boolean>;

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
  genderPreference: 'any',
  furnishing: 'all',
  minBudget: undefined,
  maxBudget: undefined,
  sortBy: 'relevance',
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
  myListings: [],

  selectedListing: null,

  loading: false,
  loadingMore: false,
  loadingLatestListings: false,
  loadingMyListings: false,
  loadingDetails: false,
  loadingOptions: false,

  error: null,
  latestListingsError: null,
  myListingsError: null,
  optionsError: null,

  pagination: initialPagination,
  myListingsPagination: initialPagination,

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
        set((state) => ({
          loading: false,
          myListingsPagination: {
            ...state.myListingsPagination,
            total: (state.myListingsPagination?.total ?? 0) + 1,
          },
        }));
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
        set((state) => ({
          loading: false,
          myListingsPagination: {
            ...state.myListingsPagination,
            total: (state.myListingsPagination?.total ?? 0) + 1,
          },
        }));
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
   * Update existing Property listing
   */
  updateProperty: async (id: string, payload: any) => {
    set({ loading: true, error: null });
    try {
      const res = await updatePropertyApi(id, payload);
      if (res.success && res.data) {
        set({ loading: false });
        return res.data;
      } else {
        const errorMsg = res.message || 'Failed to update property';
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to update property';
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  /**
   * Update existing Flatmate Requirement listing
   */
  updateFlatmateRequirement: async (id: string, payload: any) => {
    set({ loading: true, error: null });
    try {
      const res = await updateFlatmateRequirementApi(id, payload);
      if (res.success && res.data) {
        set({ loading: false });
        return res.data;
      } else {
        const errorMsg = res.message || 'Failed to update flatmate requirement';
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to update flatmate requirement';
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  /**
   * Delete listing (Property or Flatmate Requirement)
   */
  deleteListing: async (id: string, sourceType: 'property' | 'flatmate_requirement' | string) => {
    set({ loading: true, error: null });
    try {
      const normalizedType = sourceType === 'property' ? 'property' : 'flatmate_requirement';
      if (normalizedType === 'property') {
        await deletePropertyApi(id);
      } else {
        await deleteFlatmateRequirementApi(id);
      }
      set((state) => {
        const updatedListings = state.myListings.filter(
          (item: any) => (item._id || item.id) !== id
        );
        const currentTotal =
          state.myListingsPagination?.total ?? state.myListings.length;
        const newTotal = Math.max(0, currentTotal - 1);

        return {
          myListings: updatedListings,
          selectedListing:
            (state.selectedListing?._id || (state.selectedListing as any)?.id) === id
              ? null
              : state.selectedListing,
          myListingsPagination: {
            ...state.myListingsPagination,
            total: newTotal,
          },
          loading: false,
        };
      });
      return true;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to delete listing';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  /**
   * Fetch listings from GET /api/listings using active filters
   */
  // fetchListings: async (customParams?: ListingQueryParams) => {
  //   set({ loading: true, error: null });

  //   try {
  //     const activeFilters = {
  //       ...get().filters,
  //       ...customParams,
  //     };

  //     // Clean empty / undefined filter values before sending
  //     const cleanParams: Record<string, any> = {};
  //     Object.entries(activeFilters).forEach(([key, val]) => {
  //       if (val !== undefined && val !== '' && val !== 'all') {
  //         cleanParams[key] = val;
  //       }
  //     });

  //     if (cleanParams.listingType && !cleanParams.propertyType) {
  //       cleanParams.propertyType = cleanParams.listingType;
  //       delete cleanParams.listingType;
  //     }

  //     // Maintain explicit pagination and sorting params
  //     cleanParams.page = activeFilters.page || 1;
  //     cleanParams.limit = activeFilters.limit || 10;
  //     cleanParams.sortBy = activeFilters.sortBy || 'createdAt';
  //     cleanParams.order = activeFilters.order || 'desc';

  //     if (activeFilters.sourceType && activeFilters.sourceType !== 'all') {
  //       cleanParams.sourceType = activeFilters.sourceType;
  //     }

  //     const response = await apiClient.get<
  //       ApiResponse<GetListingsResponseData>
  //     >('/listings', {
  //       params: cleanParams,
  //     });

  //     const responseData = response.data?.data;

  //     if (responseData) {
  //       set({
  //         listings: responseData.listings || [],
  //         pagination: responseData.pagination || initialPagination,
  //         loading: false,
  //         error: null,
  //       });
  //     } else {
  //       set({
  //         listings: [],
  //         pagination: initialPagination,
  //         loading: false,
  //         error: null,
  //       });
  //     }
  //   } catch (err: any) {
  //     set({
  //       loading: false,
  //       error: err.message || 'Failed to fetch listings',
  //     });
  //   }
  // },

  fetchListings: async (
    customParams?: ListingQueryParams,
    append = false
  ) => {
    set({
      ...(append ? {} : { loading: true }),
      loadingMore: append,
      error: null,
    });

    try {
      const activeFilters = {
        ...get().filters,
        ...customParams,
      };

      const cleanParams: Record<string, any> = {};

      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val !== undefined && val !== "" && val !== "all") {
          cleanParams[key] = val;
        }
      });

      if (cleanParams.listingType && !cleanParams.propertyType) {
        cleanParams.propertyType = cleanParams.listingType;
        delete cleanParams.listingType;
      }

      cleanParams.page = activeFilters.page || 1;
      cleanParams.limit = activeFilters.limit || 10;
      cleanParams.sortBy = activeFilters.sortBy || "relevance";
      cleanParams.order = activeFilters.order || "desc";

      if (activeFilters.sourceType && activeFilters.sourceType !== "all") {
        cleanParams.sourceType = activeFilters.sourceType;
      }

      const response = await apiClient.get<
        ApiResponse<GetListingsResponseData>
      >("/listings", {
        params: cleanParams,
      });

      const responseData = response.data?.data;

      if (responseData) {
        const newListings = responseData.listings || [];

        set((state) => ({
          listings: append
            ? [
              ...state.listings,
              ...newListings.filter(
                (item) =>
                  !state.listings.some(
                    (existing) => existing._id === item._id
                  )
              ),
            ]
            : newListings,
          pagination: responseData.pagination || initialPagination,
          loading: false,
          loadingMore: false,
          error: null,
        }));
      } else {
        set({
          ...(append ? {} : { listings: [] }),
          pagination: append ? get().pagination : initialPagination,
          loading: false,
          loadingMore: false,
          error: null,
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        loadingMore: false,
        error: err.message || "Failed to fetch listings",
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
   * Fetch authenticated user's own listings
   *
   * GET /api/listings/my-listings
   *
   * Uses the same filters, geographic search,
   * sorting and pagination options as GET /api/listings.
   *
   * Additional filter:
   * - status
   */
  fetchMyListings: async (params = {}) => {
    set({
      loadingMyListings: true,
      myListingsError: null,
    });

    try {
      const cleanParams: Record<string, any> = {};

      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== '' &&
          value !== 'all'
        ) {
          cleanParams[key] = value;
        }
      });

      // Maintain explicit pagination
      cleanParams.page = params.page || 1;
      cleanParams.limit = params.limit || 10;

      // Maintain same sorting defaults as public listings
      if (params.sortBy) {
        cleanParams.sortBy = params.sortBy;
      } else {
        cleanParams.sortBy = 'createdAt';
      }

      if (params.order) {
        cleanParams.order = params.order;
      } else {
        cleanParams.order = 'desc';
      }

      // Source type
      if (
        params.sourceType &&
        params.sourceType !== 'all'
      ) {
        cleanParams.sourceType =
          params.sourceType;
      }

      // Status is additional for My Listings
      if (
        params.status &&
        params.status !== 'all'
      ) {
        cleanParams.status = params.status;
      }

      const response = await apiClient.get<
        ApiResponse<GetListingsResponseData>
      >('/listings/my-listings', {
        params: cleanParams,
      });

      const responseData =
        response.data?.data;

      if (responseData) {
        const rawPagination = responseData.pagination;
        const total =
          typeof rawPagination?.total === 'number'
            ? rawPagination.total
            : typeof (responseData as any).total === 'number'
            ? (responseData as any).total
            : (responseData.listings?.length ?? 0);

        const pagination: PaginationInfo = {
          page: rawPagination?.page ?? (responseData as any).page ?? cleanParams.page,
          limit: rawPagination?.limit ?? (responseData as any).limit ?? cleanParams.limit,
          total,
          totalPages:
            rawPagination?.totalPages ??
            (responseData as any).totalPages ??
            Math.max(1, Math.ceil(total / (cleanParams.limit || 10))),
          hasNextPage: rawPagination?.hasNextPage ?? false,
          hasPreviousPage: rawPagination?.hasPreviousPage ?? false,
        };

        set({
          myListings:
            responseData.listings || (responseData as any).items || [],

          myListingsPagination: pagination,

          loadingMyListings: false,
          myListingsError: null,
        });

        return total;
      } else {
        set({
          myListings: [],
          myListingsPagination:
            initialPagination,
          loadingMyListings: false,
          myListingsError: null,
        });
        return 0;
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch your listings';

      set({
        myListings: [],
        myListingsPagination:
          initialPagination,
        loadingMyListings: false,
        myListingsError: errorMsg,
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
      myListings: [],

      loadingLatestListings: false,
      loadingMyListings: false,

      latestListingsError: null,
      myListingsError: null,

      selectedListing: null,

      loading: false,
      loadingDetails: false,

      error: null,
      pagination: initialPagination,
      myListingsPagination: initialPagination,
      filters: initialFilters,
    });
  },
}));
