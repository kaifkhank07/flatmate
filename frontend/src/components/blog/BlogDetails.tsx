"use client";

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import DOMPurify from "dompurify";
import { ViewReveal } from "../animation";
import SectionHeading from "../utils/SectionHeading";
import BlogCard from "./BlogCard";
import BlogFaq from "./BlogFaq";
import { useBlogStore } from "@/store/useBlogStore";
import { getMediaUrl } from "@/lib/api";

const FALLBACK_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200";

export interface BlogDetailsProps {
  slug?: string;
}

export default function BlogDetails({ slug: propSlug }: BlogDetailsProps = {}) {
  const params = useParams();
  const slug = propSlug || (params?.slug as string);

  const {
    currentBlog,
    relatedBlogs,
    loadingCurrentBlog,
    errorCurrentBlog,
    fetchPublicBlogBySlug,
  } = useBlogStore();

  useEffect(() => {
    if (slug) {
      fetchPublicBlogBySlug(slug);
    }
  }, [slug, fetchPublicBlogBySlug]);

  const sanitizedHtml = useMemo(() => {
    if (!currentBlog?.content) return "";
    if (typeof window !== "undefined") {
      return DOMPurify.sanitize(currentBlog.content);
    }
    return currentBlog.content;
  }, [currentBlog?.content]);

  // Loading skeleton state
  if (loadingCurrentBlog) {
    return (
      <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
        <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12 animate-pulse">
          <div className="h-10 w-3/4 max-w-4xl bg-gray-200 rounded-xl mx-auto" />
          <div className="relative w-full h-[280px] sm:h-[400px] md:h-[500px] lg:h-[580px] rounded-2xl sm:rounded-3xl md:rounded-[36px] bg-gray-200" />
          <div className="w-full space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-4 w-4/6 bg-gray-200 rounded" />
          </div>
        </div>
      </section>
    );
  }

  // Not found or error state
  if (!loadingCurrentBlog && !currentBlog && errorCurrentBlog) {
    return (
      <section className="w-full py-20 px-4 sm:px-6 lg:px-16 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Article Not Found</h2>
          <p className="text-sm text-gray-500">
            {errorCurrentBlog || "The blog article could not be found."}
          </p>
        </div>
      </section>
    );
  }

  const heroImage =
    getMediaUrl(currentBlog?.image?.url) || FALLBACK_BLOG_IMAGE;

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        <ViewReveal duration={800}>
          {/* Header Top Row */}
          <SectionHeading
            title={currentBlog?.title || "Blog Details"}
            align="center"
            className="text-black max-w-6xl mx-auto"
          />
        </ViewReveal>

        {/* Hero Image */}
        <ViewReveal duration={900} startDelay={150}>
          <div className="relative w-full h-[280px] sm:h-[400px] md:h-[500px] lg:h-[580px] rounded-2xl sm:rounded-3xl md:rounded-[36px] overflow-hidden shadow-sm border border-gray-100/80">
            <Image
              src={heroImage}
              alt={currentBlog?.title || "Blog Image"}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1200px) 100vw, 1450px"
            />
          </div>
        </ViewReveal>

        {/* Content */}
        <ViewReveal duration={800}>
          {/* <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-regular text-gray-700 leading-snug tracking-tight">
              {blog.content}
            </p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-regular text-gray-700 leading-snug tracking-tight">
              {blog.content}
            </p>
          </div> */}
          <div
            className="w-full min-w-0 max-w-full overflow-hidden text-sm sm:text-base md:text-lg lg:text-xl font-regular text-gray-700 leading-relaxed tracking-normal break-words [&_*]:max-w-full [&_p]:mb-4 [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066FF] [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#0066FF] [&_a]:underline [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-4 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            style={{ overflowWrap: "break-word", wordBreak: "normal" }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

        </ViewReveal>

        {/* Related blogs */}
        {relatedBlogs.length > 0 && (
          <ViewReveal duration={900} startDelay={150}>
            <div className="w-full pt-6 sm:pt-8 md:pt-10 space-y-8">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900">
                Related Articles
              </h3>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 lg:gap-y-16">
                {relatedBlogs.map((blog) => (
                  <BlogCard
                    key={blog._id}
                    id={blog._id}
                    title={blog.title}
                    date={new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    image={
                      getMediaUrl(blog.image?.url) || FALLBACK_BLOG_IMAGE
                    }
                    category={
                      typeof blog.categoryId === "object"
                        ? blog.categoryId.name
                        : "Flatmate Advice"
                    }
                    slug={blog.slug}
                  />
                ))}
              </div>
            </div>
          </ViewReveal>
        )}

        {/* FAQ using BlogFaq */}
        {(currentBlog?.faqs?.length ?? 0) > 0 && (
          <BlogFaq faqs={currentBlog?.faqs} embedded={true} />
        )}
      </div>
    </section>
  );
}