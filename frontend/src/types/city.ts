/**
 * City Types & Interfaces
 * Matches Backend City model and API response contracts
 */

export interface CityImage {
  url?: string;
  key?: string;
}

export interface CitySeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface CityItem {
  _id: string;
  name: string;
  slug: string;
  state?: string;
  country?: string;
  image?: CityImage;
  isPopular?: boolean;
  isActive?: boolean;
  seo?: CitySeo;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetCitiesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  isActive?: boolean;
  isPopular?: boolean;
}

export interface GetCitiesResponseData {
  items: CityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
