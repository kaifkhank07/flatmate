"use client";

import React, { useEffect } from "react";
import LatestBlog from "./LatestBlog";
import BlogCard from "./BlogCard";
import { useBlogStore } from "@/store/useBlogStore";
import { getMediaUrl } from "@/lib/api";
import { Newspaper } from "lucide-react";
import { ViewReveal } from "../animation";

const FALLBACK_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200";

/**
 * Extracts a clean text excerpt from rich HTML content without dummy data
 */
function extractExcerptParagraphs(html?: string): string[] {
  if (!html) return [];

  const cleanText = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return [];

  if (cleanText.length <= 260) {
    return [cleanText];
  }

  const excerptCut = cleanText.slice(0, 240);
  const lastSpace = excerptCut.lastIndexOf(" ");
  const preview = (lastSpace > 0 ? excerptCut.slice(0, lastSpace) : excerptCut) + "...";

  return [preview];
}

export default function BlogManager() {
  const { blogs, featuredBlog, loadingBlogs, errorBlogs, fetchPublicBlogs } =
    useBlogStore();

  useEffect(() => {
    fetchPublicBlogs();
  }, [fetchPublicBlogs]);

  // Loading Skeleton State
  if (loadingBlogs) {
    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-12">
          {/* Featured Blog Skeleton */}
          <div className="w-full bg-gray-50 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 border border-gray-100 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 aspect-[4/3] bg-gray-200 rounded-[24px]" />
              <div className="lg:col-span-7 space-y-4">
                <div className="h-4 w-28 bg-gray-200 rounded-md" />
                <div className="h-6 w-40 bg-gray-200 rounded-md" />
                <div className="h-8 w-3/4 bg-gray-200 rounded-md" />
                <div className="h-4 w-full bg-gray-200 rounded-md" />
                <div className="h-4 w-2/3 bg-gray-200 rounded-md" />
                <div className="h-10 w-32 bg-gray-200 rounded-full mt-4" />
              </div>
            </div>
          </div>

          {/* Grid Skeletons */}
          <div className="w-full pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="w-full aspect-[4/3] bg-gray-200 rounded-[22px]" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty State (No public blogs published yet)
  if (!loadingBlogs && blogs.length === 0) {
    return (
      <section className="w-full py-24 px-4 sm:px-6 lg:px-16 text-center">
        <div className="max-w-md mx-auto space-y-4 bg-gray-50/70 border border-gray-100 p-8 rounded-3xl">
          <Newspaper className="w-12 h-12 text-[#0066FF] mx-auto opacity-70" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            No Articles Yet
          </h2>
          <p className="text-sm text-gray-500">
            {errorBlogs || "Our team is crafting fresh articles. Check back soon for the latest tips and rental guides!"}
          </p>
        </div>
      </section>
    );
  }

  // The remaining regular blog posts (excluding the featured one if available)
  const regularBlogs = featuredBlog
    ? blogs.filter((b) => b._id !== featuredBlog._id)
    : blogs;

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto">
        {/* Top Featured / Latest Blog Section */}
        {featuredBlog && (
          <ViewReveal duration={800}>
            <LatestBlog
              id={featuredBlog._id}
              title={featuredBlog.title}
              category={
                typeof featuredBlog.categoryId === "object"
                  ? featuredBlog.categoryId.name
                  : "Flatmate Advice"
              }
              date={new Date(featuredBlog.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              image={getMediaUrl(featuredBlog.image?.url) || FALLBACK_BLOG_IMAGE}
              paragraphs={extractExcerptParagraphs(featuredBlog.content)}
              slug={featuredBlog.slug}
            />
          </ViewReveal>

        )}

        {/* Bottom Blog Cards Grid Section */}
        {regularBlogs.length > 0 && (
          <ViewReveal duration={900} startDelay={150}>
            <div
              className={`w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 lg:gap-y-16 ${featuredBlog ? "pt-16 md:pt-20" : ""
                }`}
            >
              {regularBlogs.map((blog) => {
                const categoryName =
                  typeof blog.categoryId === "object"
                    ? blog.categoryId.name
                    : "Flatmate Guide";

                const formattedDate = new Date(blog.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                );

                return (
                  <BlogCard
                    key={blog._id}
                    id={blog._id}
                    title={blog.title}
                    date={formattedDate}
                    image={getMediaUrl(blog.image?.url) || FALLBACK_BLOG_IMAGE}
                    category={categoryName}
                    slug={blog.slug}
                  />
                );
              })}
            </div>
          </ViewReveal>
        )}
      </div>
    </section>
  );
}