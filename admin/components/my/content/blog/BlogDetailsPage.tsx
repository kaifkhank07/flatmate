"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/lib/toast";
import { usePageMotion } from "@/lib/motion";
import {
  BlogItem,
  deleteBlogApi,
  fetchBlogById,
} from "@/lib/api";

import { Card, Chip, PageHead } from "@/components/ui";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  HelpCircle,
  Pencil,
  RotateCw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import DeleteBlogDialog from "./DeleteBlogDialog";

export default function BlogDetailsPage({
  blogId,
  eyebrow,
}: {
  blogId: string;
  eyebrow?: string;
}) {
  usePageMotion();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const basePath = pathname.startsWith("/super-admin")
    ? "/super-admin/blogs"
    : "/admin/blogs";

  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogItem | null>(null);

  const loadBlog = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchBlogById(blogId);
      if (res.success && res.data) {
        setBlog(res.data);
      } else {
        setErrorMsg(res.message || "Blog post not found");
      }
    } catch (error) {
      console.error("Failed to load blog details:", error);
      setErrorMsg("Failed to load blog details");
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  const categoryName = () => {
    if (!blog?.categoryId) return "Uncategorized";
    if (typeof blog.categoryId === "string") return blog.categoryId;
    if (typeof blog.categoryId === "object" && "name" in blog.categoryId) {
      return blog.categoryId.name;
    }
    return "Uncategorized";
  };

  if (loading) {
    return (
      <>
        <PageHead
          eyebrow={eyebrow || "Blog Management"}
          title="Blog Details"
          sub="View blog post content, SEO details, and FAQs."
        />
        <div className="stream" style={{ width: "100%" }}>
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <RotateCw className="animate-spin text-amber-500" size={24} />
              <p className="text-sm">Loading blog post details...</p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (errorMsg || !blog) {
    return (
      <>
        <PageHead
          eyebrow={eyebrow || "Blog Management"}
          title="Blog Details"
        />
        <div className="stream" style={{ width: "100%" }}>
          <Card>
            <div className="text-center py-12 space-y-4">
              <h3 className="text-base font-semibold text-rose-600">
                {errorMsg || "Blog post not found"}
              </h3>
              <button
                type="button"
                className="btn btn-brand sm"
                onClick={() => router.push(basePath)}
              >
                <ArrowLeft size={13} /> Back to Blog List
              </button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow={eyebrow || "Blog Management"}
        title={blog.title}
        sub={`Category: ${categoryName()} • Slug: /${blog.slug}`}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={basePath}
              className="btn btn-ghost sm"
            >
              <ArrowLeft size={13} /> Back
            </Link>

            <Link
              href={`${basePath}/${blog._id}/edit`}
              className="btn btn-ghost sm"
            >
              <Pencil size={13} /> Edit
            </Link>

            <button
              type="button"
              className="btn btn-ghost sm"
              style={{ color: "var(--rose-ink)" }}
              onClick={() => setDeleteTarget(blog)}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <div className="space-y-6">
          {/* Main Info Card */}
          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <Chip tone={blog.isActive ? "mint" : "rose"} dot>
                    {blog.isActive ? "Active (Published)" : "Inactive (Draft)"}
                  </Chip>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    <Tag size={12} className="text-amber-500" />
                    {categoryName()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    Created: {new Date(blog.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    Updated: {new Date(blog.updatedAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Image Banner */}
              {blog.image?.url && (
                <div className="w-full max-h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blog.image.url}
                    alt={blog.title}
                    className="w-full h-full object-cover max-h-80"
                  />
                </div>
              )}

              {/* Blog Content */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} /> Blog Content
                </h3>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[150px]">
                  {blog.content}
                </div>
              </div>
            </div>
          </Card>

          {/* SEO Details Card */}
          {blog.seo && (blog.seo.title || blog.seo.description || (blog.seo.keywords && blog.seo.keywords.length > 0)) && (
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Search size={16} className="text-amber-500" />
                  SEO Information
                </h3>

                {blog.seo.title && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">SEO Title:</span>
                    <p className="text-sm font-semibold text-slate-800">{blog.seo.title}</p>
                  </div>
                )}

                {blog.seo.description && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">SEO Description:</span>
                    <p className="text-xs text-slate-600 leading-normal">{blog.seo.description}</p>
                  </div>
                )}

                {blog.seo.keywords && blog.seo.keywords.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 block mb-1">Keywords:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {blog.seo.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* FAQs Card */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle size={16} className="text-amber-500" />
                  Frequently Asked Questions
                </h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {blog.faqs?.length || 0} FAQ{(blog.faqs?.length || 0) === 1 ? "" : "s"}
                </span>
              </div>

              {!blog.faqs || blog.faqs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No FAQs added for this blog post.
                </p>
              ) : (
                <div className="space-y-3">
                  {blog.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                    >
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span className="text-amber-600 text-xs font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                          Q{index + 1}
                        </span>
                        {faq.question}
                      </h4>
                      <p className="text-xs text-slate-600 pl-8 whitespace-pre-wrap leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <DeleteBlogDialog
        blog={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={async () => {
          setDeleteTarget(null);
          toast("Blog deleted successfully");
          router.push(basePath);
        }}
      />
    </>
  );
}
