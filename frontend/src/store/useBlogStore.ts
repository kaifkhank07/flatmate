import { create } from 'zustand';
import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/listing';
import {
  BlogItem,
  BlogCategory,
  GetBlogsQueryParams,
  GetBlogsResponseData,
} from '@/types/blog';

interface BlogState {
  // State
  blogs: BlogItem[];
  featuredBlog: BlogItem | null;
  currentBlog: BlogItem | null;
  relatedBlogs: BlogItem[];
  categories: BlogCategory[];
  loadingBlogs: boolean;
  loadingCurrentBlog: boolean;
  loadingCategories: boolean;
  errorBlogs: string | null;
  errorCurrentBlog: string | null;
  total: number;
  page: number;
  totalPages: number;

  // Actions
  fetchPublicBlogs: (params?: GetBlogsQueryParams) => Promise<void>;
  fetchPublicBlogBySlug: (slug: string) => Promise<void>;
  fetchPublicCategories: () => Promise<void>;
  resetBlogStore: () => void;
}

export const useBlogStore = create<BlogState>((set) => ({
  blogs: [],
  featuredBlog: null,
  currentBlog: null,
  relatedBlogs: [],
  categories: [],
  loadingBlogs: false,
  loadingCurrentBlog: false,
  loadingCategories: false,
  errorBlogs: null,
  errorCurrentBlog: null,
  total: 0,
  page: 1,
  totalPages: 1,

  /**
   * Fetch active public blogs (GET /api/blogs/public)
   */
  fetchPublicBlogs: async (params?: GetBlogsQueryParams) => {
    set({ loadingBlogs: true, errorBlogs: null });

    try {
      const response = await apiClient.get<ApiResponse<GetBlogsResponseData>>(
        '/blogs/public',
        {
          params: {
            page: params?.page || 1,
            limit: params?.limit || 12,
            search: params?.search || params?.q,
            categoryId: params?.categoryId,
            category: params?.category,
          },
        }
      );

      const data = response.data?.data;
      let items: BlogItem[] = [];
      let total = 0;
      let page = 1;
      let totalPages = 1;

      if (data && Array.isArray((data as any).items)) {
        items = (data as any).items;
        total = (data as any).total || items.length;
        page = (data as any).page || 1;
        totalPages = (data as any).totalPages || 1;
      } else if (Array.isArray(data)) {
        items = data;
        total = items.length;
      }

      const featured = items.length > 0 ? items[0] : null;

      set({
        blogs: items,
        featuredBlog: featured,
        total,
        page,
        totalPages,
        loadingBlogs: false,
        errorBlogs: null,
      });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to fetch blogs';
      set({
        blogs: [],
        featuredBlog: null,
        loadingBlogs: false,
        errorBlogs: errorMsg,
      });
    }
  },

  /**
   * Fetch single active blog by slug (GET /api/blogs/public/:slug)
   */
  fetchPublicBlogBySlug: async (slug: string) => {
    if (!slug) return;
    set({ loadingCurrentBlog: true, errorCurrentBlog: null, currentBlog: null });

    try {
      const response = await apiClient.get<ApiResponse<BlogItem & { relatedBlogs?: BlogItem[] }>>(
        `/blogs/public/${encodeURIComponent(slug)}`
      );

      const blogData = response.data?.data;

      if (blogData) {
        set({
          currentBlog: blogData,
          relatedBlogs: blogData.relatedBlogs || [],
          loadingCurrentBlog: false,
          errorCurrentBlog: null,
        });
      } else {
        set({
          currentBlog: null,
          relatedBlogs: [],
          loadingCurrentBlog: false,
          errorCurrentBlog: 'Blog not found',
        });
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to fetch blog';
      set({
        currentBlog: null,
        relatedBlogs: [],
        loadingCurrentBlog: false,
        errorCurrentBlog: errorMsg,
      });
    }
  },

  /**
   * Fetch public blog categories (GET /api/blog-categories/public)
   */
  fetchPublicCategories: async () => {
    set({ loadingCategories: true });

    try {
      const response = await apiClient.get<ApiResponse<BlogCategory[]>>(
        '/blog-categories/public'
      );

      const categories = response.data?.data || [];
      set({
        categories: Array.isArray(categories) ? categories : [],
        loadingCategories: false,
      });
    } catch (err) {
      set({
        categories: [],
        loadingCategories: false,
      });
    }
  },

  resetBlogStore: () => {
    set({
      blogs: [],
      featuredBlog: null,
      currentBlog: null,
      relatedBlogs: [],
      categories: [],
      loadingBlogs: false,
      loadingCurrentBlog: false,
      loadingCategories: false,
      errorBlogs: null,
      errorCurrentBlog: null,
      total: 0,
      page: 1,
      totalPages: 1,
    });
  },
}));
