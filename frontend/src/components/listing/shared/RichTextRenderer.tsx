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
  // Normalize non-breaking spaces (&nbsp; and Unicode \u00a0) to regular spaces so text wraps naturally across all devices
  const normalizedContent = useMemo(() => {
    if (!content) return "";
    return content.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ");
  }, [content]);

  const isHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(normalizedContent), [normalizedContent]);

  const sanitizedContent = useMemo(() => {
    if (!normalizedContent) return "";
    if (typeof window !== "undefined") {
      return DOMPurify.sanitize(normalizedContent, {
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
    return normalizedContent;
  }, [normalizedContent]);

  if (!normalizedContent || !normalizedContent.trim()) {
    return <p className="text-gray-400 italic text-sm">No description provided.</p>;
  }

  if (isHtml) {
    return (
      <div
        className={`rich-text-content text-gray-700 text-sm sm:text-base leading-relaxed font-regular break-words [overflow-wrap:anywhere] [word-break:break-word]
          [&>h1]:text-xl sm:[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-2 [&>h1]:mt-3 first:[&>h1]:mt-0 [&>h1]:break-words
          [&>h2]:text-lg sm:[&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-2 [&>h2]:mt-2.5 first:[&>h2]:mt-0 [&>h2]:break-words
          [&>h3]:text-base sm:[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-gray-900 [&>h3]:mb-1.5 [&>h3]:mt-2 first:[&>h3]:mt-0 [&>h3]:break-words
          [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>p]:break-words [&>p]:[overflow-wrap:anywhere]
          [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul]:space-y-1 [&>ul]:break-words
          [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ol]:space-y-1 [&>ol]:break-words
          [&>li]:text-gray-700 [&>li]:break-words
          [&>a]:text-[#0066FF] [&>a]:underline hover:[&>a]:text-blue-700 [&>a]:break-words
          [&>strong]:font-semibold [&>strong]:text-gray-900
          [&>em]:italic
          [&>u]:underline
          [&>s]:line-through
          [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-3 [&>blockquote]:break-words ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }

  return (
    <p
      className={`text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-regular break-words [overflow-wrap:anywhere] [word-break:break-word] ${className}`}
    >
      {normalizedContent}
    </p>
  );
}
