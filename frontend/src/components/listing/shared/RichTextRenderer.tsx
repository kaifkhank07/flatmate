"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";

interface RichTextRendererProps {
  content?: string;
  className?: string;
}

export default function RichTextRenderer({
  content = "",
  className = "",
}: RichTextRendererProps) {
  const isHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(content), [content]);

  const sanitizedContent = useMemo(() => {
    if (!content) return "";
    if (typeof window !== "undefined") {
      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "b",
          "i",
          "em",
          "strong",
          "u",
          "s",
          "strike",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "a",
          "blockquote",
          "span",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "class"],
      });
    }
    return content;
  }, [content]);

  if (!content || !content.trim()) {
    return <p className="text-gray-400 italic text-sm">No description provided.</p>;
  }

  if (isHtml) {
    return (
      <div
        className={`rich-text-content text-gray-700 text-sm sm:text-base leading-relaxed font-regular
          [&>h1]:text-xl sm:[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-2 [&>h1]:mt-3 first:[&>h1]:mt-0
          [&>h2]:text-lg sm:[&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-2 [&>h2]:mt-2.5 first:[&>h2]:mt-0
          [&>h3]:text-base sm:[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-gray-900 [&>h3]:mb-1.5 [&>h3]:mt-2 first:[&>h3]:mt-0
          [&>p]:mb-2.5 [&>p:last-child]:mb-0
          [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul]:space-y-1
          [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ol]:space-y-1
          [&>li]:text-gray-700
          [&>a]:text-[#0066FF] [&>a]:underline hover:[&>a]:text-blue-700
          [&>strong]:font-semibold [&>strong]:text-gray-900
          [&>em]:italic
          [&>u]:underline
          [&>s]:line-through
          [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-3 ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }

  return (
    <p
      className={`text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-regular ${className}`}
    >
      {content}
    </p>
  );
}
