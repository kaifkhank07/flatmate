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
  BlogSeo,
  createBlogApi,
  fetchBlogCategories,
  uploadImageApi,
} from "@/lib/api";

import { Card, PageHead } from "@/components/ui";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export default function CreateBlogPage({ eyebrow }: { eyebrow?: string }) {
  usePageMotion();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const basePath = pathname.startsWith("/super-admin")
    ? "/super-admin/blogs"
    : "/admin/blogs";

  const [submitting, setSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
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

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddOrUpdateFaq = () => {
    const trimmedQuestion = faqQuestion.trim();
    const trimmedAnswer = faqAnswer.trim();

    if (!trimmedQuestion || !trimmedAnswer) {
      toast("Both FAQ question and answer are required");
      return;
    }

    if (editingFaqIndex !== null) {
      const updated = [...faqs];
      updated[editingFaqIndex] = {
        question: trimmedQuestion,
        answer: trimmedAnswer,
      };
      setFaqs(updated);
      setEditingFaqIndex(null);
      toast("FAQ updated");
    } else {
      setFaqs([...faqs, { question: trimmedQuestion, answer: trimmedAnswer }]);
      toast("FAQ added");
    }

    setFaqQuestion("");
    setFaqAnswer("");
  };

  const handleEditFaq = (index: number) => {
    const target = faqs[index];
    setFaqQuestion(target.question);
    setFaqAnswer(target.answer);
    setEditingFaqIndex(index);
  };

  const handleCancelFaqEdit = () => {
    setFaqQuestion("");
    setFaqAnswer("");
    setEditingFaqIndex(null);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
    if (editingFaqIndex === index) {
      handleCancelFaqEdit();
    }
    toast("FAQ removed");
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const [movedItem] = newFaqs.splice(index, 1);
    newFaqs.splice(targetIndex, 0, movedItem);
    setFaqs(newFaqs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent || !categoryId) {
      toast("Title, content and category are required");
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
        if (faqs.length > 0) {
          body.append("faqs", JSON.stringify(faqs));
        }
        body.append("file", imageFile);

        res = await createBlogApi(body);
      } else {
        res = await createBlogApi({
          title: trimmedTitle,
          content: trimmedContent,
          categoryId,
          isActive,
          seo: Object.keys(seo).length > 0 ? seo : undefined,
          faqs: faqs.length > 0 ? faqs : undefined,
        });
      }

      if (!res.success) {
        toast(res.message || "Failed to create blog");
        return;
      }

      toast("Blog created successfully");
      router.push(basePath);
    } catch (error) {
      console.error("Create blog error:", error);
      toast("Failed to create blog");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow={eyebrow || "Blog Management"}
        title="Create Blog Post"
        sub="Create a new blog article with media, category, SEO settings, and FAQs."
        actions={
          <Link
            href={basePath}
            className="btn btn-ghost sm"
          >
            <ArrowLeft size={13} /> Back to Blogs
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
                {imagePreview ? (
                  <div className="relative w-full max-w-md h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
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
                          Click to select featured image
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
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write blog content..."
                  rows={12}
                  disabled={submitting}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none transition resize-y focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Publication Status
                </label>
                <div className="flex items-center gap-3 h-11">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((v) => !v)}
                    disabled={submitting}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-slate-300"
                      } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-slate-700">
                    {isActive ? "Active (Published)" : "Inactive (Draft)"}
                  </span>
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
                    Add FAQs related to this blog post for your readers.
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {faqs.length} FAQ{faqs.length === 1 ? "" : "s"}
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
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="text-amber-600 text-xs font-bold">
                              Q{index + 1}.
                            </span>{" "}
                            {faq.question}
                          </h4>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">
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
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-100 transition"
                            title="Edit FAQ"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(index)}
                            disabled={submitting}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-100 transition"
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
                    placeholder="Enter question (e.g. What amenities are included?)"
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

                <div className="flex justify-end gap-2 pt-1">
                  {editingFaqIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelFaqEdit}
                      disabled={submitting}
                      className="px-3.5 h-9 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
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
              href={basePath}
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
              {submitting ? "Creating Blog..." : "Publish Blog Post"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
