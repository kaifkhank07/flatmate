"use client";

import React, { useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle } from "lucide-react";
import "react-quill-new/dist/quill.snow.css";
import {
  validateDescriptionContact,
  ContactValidationResult,
} from "@/utils/contactFilter";

/**
 * Check if the rich-text editor content is effectively empty
 * (e.g., whitespace, "<p><br></p>", or empty tags).
 */
export const isRichTextEmpty = (html?: string): boolean => {
  if (!html) return true;
  const stripped = html
    .replace(/<(.|\n)*?>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length === 0;
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  error?: string;
  restrictContactInfo?: boolean;
  onContactValidationChange?: (result: ContactValidationResult) => void;
}

// Dynamically import ReactQuill to prevent SSR window/document undefined errors
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return RQ;
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-36 rounded-2xl bg-[#F3F4F6] border border-gray-200 animate-pulse flex items-center justify-center text-xs text-gray-400">
        Loading rich text editor...
      </div>
    ),
  }
);

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Provide detailed description...",
  id,
  className = "",
  error,
  restrictContactInfo = false,
  onContactValidationChange,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
      ],
    }),
    []
  );

  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "strike", "list", "link"],
    []
  );

  // Validate contact info in real-time when enabled
  const contactValidation = useMemo<ContactValidationResult | null>(() => {
    if (!restrictContactInfo) return null;
    return validateDescriptionContact(value);
  }, [restrictContactInfo, value]);

  useEffect(() => {
    if (restrictContactInfo && contactValidation && onContactValidationChange) {
      onContactValidationChange(contactValidation);
    }
  }, [restrictContactInfo, contactValidation, onContactValidationChange]);

  const isContactRestricted = restrictContactInfo && Boolean(contactValidation?.hasContact);

  return (
    <div className={`rich-text-editor-wrapper space-y-2 ${className}`}>
      <div
        className={`w-full bg-[#F3F4F6] rounded-2xl overflow-hidden border transition-all ${
          error
            ? "border-rose-400 focus-within:ring-2 focus-within:ring-rose-200"
            : isContactRestricted
            ? "border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 bg-amber-50/20"
            : "border-transparent focus-within:bg-white focus-within:border-brand-blue/30 focus-within:ring-2 focus-within:ring-brand-blue/20"
        }`}
      >
        <ReactQuill
          id={id}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="rich-text-quill"
        />
      </div>

      {/* Contact Restriction Warning Banner */}
      {isContactRestricted && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50/95 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm animate-in fade-in duration-200 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <span className="font-semibold block text-amber-950">
              Contact Details Detected
            </span>
            <p className="text-amber-800 text-xs leading-relaxed">
              {contactValidation?.message}
            </p>
          </div>
        </div>
      )}

      {error && !isContactRestricted && (
        <p className="text-xs text-rose-500 pl-1">{error}</p>
      )}

      <style jsx global>{`
        .rich-text-quill .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #f9fafb !important;
          border-top-left-radius: 1rem !important;
          border-top-right-radius: 1rem !important;
          padding: 8px 12px !important;
        }
        .rich-text-quill .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 0.875rem !important;
          min-height: 120px !important;
        }
        .rich-text-quill .ql-editor {
          min-height: 120px !important;
          max-height: 320px !important;
          overflow-y: auto !important;
          padding: 12px 16px !important;
          line-height: 1.6 !important;
          color: #1f2937 !important;
        }
        .rich-text-quill .ql-editor.ql-blank::before {
          color: #9ca3af !important;
          font-style: normal !important;
          left: 16px !important;
          right: 16px !important;
        }
        .rich-text-quill .ql-editor h1 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
        }
        .rich-text-quill .ql-editor h2 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin-bottom: 0.375rem !important;
        }
        .rich-text-quill .ql-editor h3 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-quill .ql-editor ul,
        .rich-text-quill .ql-editor ol {
          padding-left: 1.25rem !important;
        }
      `}</style>
    </div>
  );
}
