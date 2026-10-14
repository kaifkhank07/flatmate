"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/lib/toast";
import { usePageMotion } from "@/lib/motion";
import {
  BlogCategoryItem,
  BlogFaq,
  BlogImage,
  BlogItem,
  BlogSeo,
  fetchBlogById,
  fetchBlogCategories,
  updateBlogApi,
  uploadImageApi,
} from "@/lib/api";

import { Card, PageHead } from "@/components/ui";
import RichTextEditor, { isBlogContentEmpty } from "./RichTextEditor";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";

export default function EditBlogPage({
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<BlogImage | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // SEO State
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // FAQs State
  const [faqs, setFaqs] = useState<BlogFaq[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetchBlogCategories({ page: 1, limit: 100 });
      if (res.success && res.data) {
        setCategories(res.data.items || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadBlogData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchBlogById(blogId);
      if (res.success && res.data) {
        const blog: BlogItem = res.data;
        setTitle(blog.title || "");
        setContent(blog.content || "");

        const catVal =
          typeof blog.categoryId === "string"
            ? blog.categoryId
            : blog.categoryId?._id || "";
        setCategoryId(catVal);

        setIsActive(blog.isActive ?? true);
        setImage(blog.image || null);
        setImagePreview(blog.image?.url || null);

        setSeoTitle(blog.seo?.title || "");
        setSeoDescription(blog.seo?.description || "");
        setSeoKeywords(
          Array.isArray(blog.seo?.keywords)
            ? blog.seo!.keywords!.join(", ")
            : ""
        );

        setFaqs(blog.faqs || []);
      } else {
        setErrorMsg(res.message || "Blog not found");
      }
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      setErrorMsg("Failed to load blog data");
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    loadCategories();
    loadBlogData();
  }, [loadCategories, loadBlogData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const clearFaqForm = () => {
    setFaqQuestion("");
    setFaqAnswer("");
    setEditingFaqIndex(null);
  };

  const handleAddOrUpdateFaq = () => {
    const trimmedQuestion = faqQuestion.trim();
    const trimmedAnswer = faqAnswer.trim();

    if (!trimmedQuestion) {
      toast("Question is required");
      return;
    }

    if (!trimmedAnswer) {
      toast("Answer is required");
      return;
    }

    const faq: BlogFaq = {
      question: trimmedQuestion,
      answer: trimmedAnswer,
    };

    if (editingFaqIndex !== null) {
      setFaqs((prev) =>
        prev.map((item, index) =>
          index === editingFaqIndex ? faq : item
        )
      );
      toast("FAQ updated");
    } else {
      setFaqs((prev) => [...prev, faq]);
      toast("FAQ added");
    }

    clearFaqForm();
  };

  const handleEditFaq = (index: number) => {
    const target = faqs[index];
    setFaqQuestion(target.question);
    setFaqAnswer(target.answer);
    setEditingFaqIndex(index);
  };

  const handleCancelFaqEdit = () => {
    clearFaqForm();
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));

    if (editingFaqIndex === index) {
      clearFaqForm();
    } else if (editingFaqIndex !== null && editingFaqIndex > index) {
      setEditingFaqIndex((prev) => (prev === null ? null : prev - 1));
    }

    toast("FAQ removed");
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    setFaqs((prev) => {
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];
      return updated;
    });

    setEditingFaqIndex((current) => {
      if (current === index) return targetIndex;
      if (current === targetIndex) return index;
      return current;
    });
  };

  const getFaqsToSubmit = (): BlogFaq[] | null => {
    const currentQuestion = faqQuestion.trim();
    const currentAnswer = faqAnswer.trim();

    // Include the current input even if Add FAQ has not been clicked.
    const faqsToSubmit: BlogFaq[] = [...faqs];

    if (currentQuestion || currentAnswer) {
      if (!currentQuestion || !currentAnswer) {
        toast("Please enter both question and answer for the current FAQ");
        return null;
      }

      if (editingFaqIndex !== null) {
        faqsToSubmit[editingFaqIndex] = {
          question: currentQuestion,
          answer: currentAnswer,
        };
      } else {
        faqsToSubmit.push({
          question: currentQuestion,
          answer: currentAnswer,
        });
      }
    } else if (editingFaqIndex !== null) {
      toast("Please enter both question and answer for the FAQ being edited, or cancel editing");
      return null;
    }

    const invalidIndex = faqsToSubmit.findIndex(
      (faq) => !faq.question.trim() || !faq.answer.trim()
    );

    if (invalidIndex !== -1) {
      toast(`Question and answer are required for FAQ ${invalidIndex + 1}`);
      return null;
    }

    return faqsToSubmit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || isBlogContentEmpty(content) || !categoryId) {
      toast("Title, content and category are required");
      return;
    }

    const faqsToSubmit = getFaqsToSubmit();
    if (faqsToSubmit === null) {
      return;
    }

    const keywords = seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const seo: BlogSeo = {};
    if (seoTitle.trim()) seo.title = seoTitle.trim();
    if (seoDescription.trim()) seo.description = seoDescription.trim();
    if (keywords.length > 0) seo.keywords = keywords;

    try {
      setSubmitting(true);

      let res;
      if (imageFile) {
        const body = new FormData();
        body.append("title", trimmedTitle);
        body.append("content", trimmedContent);
        body.append("categoryId", categoryId);
        body.append("isActive", String(isActive));

        if (Object.keys(seo).length > 0) {
          body.append("seo", JSON.stringify(seo));
        }
        body.append("faqs", JSON.stringify(faqsToSubmit));
        body.append("file", imageFile);

        res = await updateBlogApi(blogId, body);
      } else {
        res = await updateBlogApi(blogId, {
          title: trimmedTitle,
          content: trimmedContent,
          categoryId,
          isActive,
          image: image ?? null,
          seo: Object.keys(seo).length > 0 ? seo : undefined,
          faqs: faqsToSubmit,
        });
      }

      if (!res.success) {
        toast(res.message || "Failed to update blog");
        return;
      }

      toast("Blog updated successfully");
      router.push(`${basePath}/${blogId}`);
    } catch (error) {
      console.error("Update blog error:", error);
      toast("Failed to update blog");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHead
          eyebrow={eyebrow || "Blog Management"}
          title="Edit Blog Post"
          sub="Update blog post content, FAQs, media, and SEO settings."
        />
        <div className="stream" style={{ width: "100%" }}>
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <RotateCw className="animate-spin text-amber-500" size={24} />
              <p className="text-sm">Loading blog data...</p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (errorMsg) {
    return (
      <>
        <PageHead
          eyebrow={eyebrow || "Blog Management"}
          title="Edit Blog Post"
        />
        <div className="stream" style={{ width: "100%" }}>
          <Card>
            <div className="text-center py-12 space-y-4">
              <h3 className="text-base font-semibold text-rose-600">
                {errorMsg}
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

  const pendingNewFaq = Boolean(
    faqQuestion.trim() && faqAnswer.trim() && editingFaqIndex === null
  );
  const totalFaqsCount = faqs.length + (pendingNewFaq ? 1 : 0);

  return (
    <>
      <PageHead
        eyebrow={eyebrow || "Blog Management"}
        title="Edit Blog Post"
        sub="Modify content, category, FAQs, media, and search optimization."
        actions={
          <Link
            href={`${basePath}/${blogId}`}
            className="btn btn-ghost sm"
          >
            <ArrowLeft size={13} /> Cancel Edit
          </Link>
        }
      />

      <div className="stream" style={{ width: "100%" }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Blog Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog title"
                  maxLength={200}
                  disabled={submitting}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={submitting || categoriesLoading}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  required
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories..." : "Select category"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Featured Image
                </label>
                {imagePreview || image?.url ? (
                  <div className="relative w-full max-w-md h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview || image?.url}
                      alt="Featured preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={submitting}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full max-w-md h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <span className="text-xs font-semibold text-slate-600">
                          Click to select new featured image
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          (Uploaded on submitting)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={submitting}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Content <span className="text-rose-500">*</span>
                </label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write rich blog content..."
                  disabled={submitting}
                  minHeight={320}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Publication Status
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editBlogIsActive"
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 accent-amber-500 cursor-pointer"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={submitting}
                  />
                  <label htmlFor="editBlogIsActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    Mark as Public
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* SEO Card */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                SEO Settings (Optional)
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Meta title for search engines"
                  maxLength={200}
                  disabled={submitting}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  SEO Description
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description for search engine results"
                  rows={3}
                  maxLength={500}
                  disabled={submitting}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none transition resize-y focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="e.g. flatmate, rent room, pg near me"
                  disabled={submitting}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Separate keywords with commas.
                </p>
              </div>
            </div>
          </Card>

          {/* FAQs Card */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <HelpCircle size={18} className="text-amber-500" />
                    Frequently Asked Questions (Optional)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage FAQs associated with this blog post.
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">
                  {totalFaqsCount} FAQ{totalFaqsCount === 1 ? "" : "s"}
                </span>
              </div>

              {/* Added FAQs List */}
              {faqs.length > 0 && (
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition ${editingFaqIndex === index
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-start gap-1.5">
                            <span className="text-amber-600 text-xs font-bold mt-0.5">
                              Q{index + 1}.
                            </span>{" "}
                            <span className="break-words">
                              {faq.question}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap break-words">
                            {faq.answer}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(index, "up")}
                            disabled={index === 0 || submitting}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(index, "down")}
                            disabled={index === faqs.length - 1 || submitting}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditFaq(index)}
                            disabled={submitting}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-100 transition disabled:opacity-50"
                            title="Edit FAQ"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(index)}
                            disabled={submitting}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                            title="Remove FAQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add / Edit FAQ Form */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {editingFaqIndex !== null
                    ? `Edit FAQ #${editingFaqIndex + 1}`
                    : "Add New FAQ"}
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="Enter question"
                    maxLength={500}
                    disabled={submitting}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="Enter answer"
                    rows={3}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none transition resize-y focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  {editingFaqIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelFaqEdit}
                      disabled={submitting}
                      className="px-3.5 h-9 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddOrUpdateFaq}
                    disabled={
                      submitting ||
                      !faqQuestion.trim() ||
                      !faqAnswer.trim()
                    }
                    className="px-4 h-9 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              href={`${basePath}/${blogId}`}
              className="px-6 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                !title.trim() ||
                !content.trim() ||
                !categoryId
              }
              className="px-7 h-11 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
