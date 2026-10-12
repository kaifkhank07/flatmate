/**
 * Blog Types & Interfaces
 * Matches Backend Blog model and API response contracts
 */

export interface BlogImage {
  url?: string;
  key?: string;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface BlogSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogItem {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  content: string;
  categoryId?: BlogCategory | string;
  image?: BlogImage;
  isActive?: boolean;
  seo?: BlogSeo;
  faqs?: BlogFaq[];
  relatedBlogs?: BlogItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface GetBlogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  categoryId?: string;
  category?: string;
}

export interface GetBlogsResponseData {
  items: BlogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
