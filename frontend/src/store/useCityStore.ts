import { create } from 'zustand';
import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/listing';
import { CityItem, GetCitiesQueryParams, GetCitiesResponseData } from '@/types/city';

interface CityState {
  // State
  cities: CityItem[];
  popularCities: CityItem[];
  loadingCities: boolean;
  loadingPopularCities: boolean;
  errorCities: string | null;
  errorPopularCities: string | null;

  // Actions
  fetchCities: (params?: GetCitiesQueryParams) => Promise<void>;
  fetchPopularCities: (limit?: number) => Promise<void>;
  resetCityStore: () => void;
}

export const useCityStore = create<CityState>((set) => ({
  cities: [],
  popularCities: [],
  loadingCities: false,
  loadingPopularCities: false,
  errorCities: null,
  errorPopularCities: null,

  /**
   * Fetch active cities for user pages (GET /api/cities?isActive=true)
   */
  fetchCities: async (params?: GetCitiesQueryParams) => {
    set({ loadingCities: true, errorCities: null });

    try {
      const response = await apiClient.get<ApiResponse<GetCitiesResponseData | CityItem[]>>(
        '/cities',
        {
          params: {
            isActive: true,
            page: params?.page || 1,
            limit: params?.limit || 50,
            search: params?.search || params?.q,
          },
        }
      );

      const data = response.data?.data;
      let items: CityItem[] = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
      }

      set({
        cities: items,
        loadingCities: false,
        errorCities: null,
      });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to fetch cities';
      set({
        cities: [],
        loadingCities: false,
        errorCities: errorMsg,
      });
    }
  },

  /**
   * Fetch popular active cities separately (GET /api/cities?isActive=true&isPopular=true)
   * Does NOT slice or filter from client state
   */
  fetchPopularCities: async (limit = 20) => {
    set({ loadingPopularCities: true, errorPopularCities: null });

    try {
      const response = await apiClient.get<ApiResponse<GetCitiesResponseData | CityItem[]>>(
        '/cities',
        {
          params: {
            isActive: true,
            isPopular: true,
            page: 1,
            limit,
          },
        }
      );

      const data = response.data?.data;
      let items: CityItem[] = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
      }

      set({
        popularCities: items,
        loadingPopularCities: false,
        errorPopularCities: null,
      });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to fetch popular cities';
      set({
        popularCities: [],
        loadingPopularCities: false,
        errorPopularCities: errorMsg,
      });
    }
  },

  resetCityStore: () => {
    set({
      cities: [],
      popularCities: [],
      loadingCities: false,
      loadingPopularCities: false,
      errorCities: null,
      errorPopularCities: null,
    });
  },
}));
