"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast";
import {
    BlogCategoryItem,
    BlogImage,
    BlogItem,
    BlogSeo,
    updateBlogApi,
    uploadImageApi,
} from "@/lib/api";
import { X } from "lucide-react";
import RichTextEditor, { isBlogContentEmpty } from "./RichTextEditor";

export interface EditBlogDialogProps {
    blog: BlogItem | null;
    categories: BlogCategoryItem[];
    onClose: () => void;
    onSuccess: () => Promise<void> | void;
}

export default function EditBlogDialog({
    blog,
    categories,
    onClose,
    onSuccess,
}: EditBlogDialogProps) {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState<BlogImage | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");

    useEffect(() => {
        if (!blog) return;

        setTitle(blog.title);
        setContent(blog.content);

        setCategoryId(
            typeof blog.categoryId === "string"
                ? blog.categoryId
                : blog.categoryId._id
        );

        setIsActive(blog.isActive);
        setImage(blog.image || null);
        setImagePreview(blog.image?.url || null);

        setSeoTitle(blog.seo?.title || "");
        setSeoDescription(blog.seo?.description || "");
        setSeoKeywords(blog.seo?.keywords?.join(", ") || "");
    }, [blog]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImagePreview(URL.createObjectURL(file));
        setUploadingImage(true);
        const res = await uploadImageApi(file);
        setUploadingImage(false);

        if (res.success && res.data) {
            setImage({ url: res.data.url, key: res.data.key });
            toast("Featured image uploaded successfully");
        } else {
            toast(res.message || "Failed to upload featured image");
            setImagePreview(blog?.image?.url || null);
        }
    };

    if (!blog) return null;

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (!trimmedTitle || isBlogContentEmpty(content) || !categoryId) {
            toast("Title, content and category are required");
            return;
        }

        const keywords = seoKeywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean);

        const seo: BlogSeo = {};

        if (seoTitle.trim()) {
            seo.title = seoTitle.trim();
        }

        if (seoDescription.trim()) {
            seo.description = seoDescription.trim();
        }

        if (keywords.length > 0) {
            seo.keywords = keywords;
        }

        try {
            setSubmitting(true);

            const res = await updateBlogApi(blog._id, {
                title: trimmedTitle,
                content: trimmedContent,
                categoryId,
                image: image ? image : null,
                isActive,
                seo: Object.keys(seo).length > 0 ? seo : undefined,
            });

            if (!res.success) {
                toast(
                    res.message ||
                    "Failed to update blog"
                );
                return;
            }

            toast(
                "Blog updated successfully"
            );

            await onSuccess();
        } catch (error) {
            console.error(
                "Update blog error:",
                error
            );

            toast(
                "Failed to update blog"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (
                    e.target ===
                    e.currentTarget &&
                    !submitting
                ) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-[720px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Edit Blog
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Update blog information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Blog Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value
                                )
                            }
                            placeholder="Enter blog title"
                            maxLength={200}
                            disabled={submitting}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                        />

                        <p className="text-xs text-slate-400 mt-1.5">
                            Slug is automatically
                            updated when the title
                            changes.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Category
                        </label>

                        <select
                            value={categoryId}
                            onChange={(e) =>
                                setCategoryId(
                                    e.target.value
                                )
                            }
                            disabled={submitting}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                        >
                            <option value="">
                                Select category
                            </option>

                            {categories.map(
                                (category) => (
                                    <option
                                        key={
                                            category._id
                                        }
                                        value={
                                            category._id
                                        }
                                    >
                                        {
                                            category.name
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Featured Image
                        </label>
                        {imagePreview || image?.url ? (
                            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreview || image?.url}
                                    alt="Featured preview"
                                    className="w-full h-full object-cover"
                                />
                                {uploadingImage && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                                        Uploading image…
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImage(null);
                                        setImagePreview(null);
                                    }}
                                    disabled={submitting || uploadingImage}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                        <span className="text-xs font-semibold text-slate-600">Click to upload featured image</span>
                                        <span className="text-[11px] text-slate-400 mt-1">SVG, PNG, JPG, WEBP</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        disabled={submitting || uploadingImage}
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
                            minHeight={240}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Status
                        </label>

                        <div className="flex items-center gap-3 h-11">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={
                                    isActive
                                }
                                onClick={() =>
                                    setIsActive(
                                        (value) =>
                                            !value
                                    )
                                }
                                disabled={
                                    submitting
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive
                                    ? "bg-emerald-500"
                                    : "bg-slate-300"
                                    } disabled:opacity-50`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                        }`}
                                />
                            </button>

                            <span className="text-sm text-slate-700">
                                {isActive
                                    ? "Active"
                                    : "Inactive"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            SEO Title
                        </label>

                        <input
                            type="text"
                            value={seoTitle}
                            onChange={(e) =>
                                setSeoTitle(
                                    e.target.value
                                )
                            }
                            placeholder="Enter SEO title"
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
                            value={
                                seoDescription
                            }
                            onChange={(e) =>
                                setSeoDescription(
                                    e.target.value
                                )
                            }
                            placeholder="Enter SEO description"
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
                            value={
                                seoKeywords
                            }
                            onChange={(e) =>
                                setSeoKeywords(
                                    e.target.value
                                )
                            }
                            placeholder="keyword one, keyword two, keyword three"
                            disabled={submitting}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                        />

                        <p className="text-xs text-slate-400 mt-1.5">
                            Separate keywords with
                            commas.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 h-10 rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                !title.trim() ||
                                !content.trim() ||
                                !categoryId
                            }
                            className="px-5 h-10 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? "Updating..."
                                : "Update Blog"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}