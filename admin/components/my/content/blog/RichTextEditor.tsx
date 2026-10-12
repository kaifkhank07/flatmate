"use client";

import React, { useEffect, useRef, useState } from "react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string | number;
  className?: string;
}

/**
 * Helper to determine if HTML content contains meaningful text or media
 * Avoids accepting empty paragraph tags like <p><br></p> as valid content
 */
export function isBlogContentEmpty(html: string): boolean {
  if (!html || !html.trim()) return true;
  // Strip all HTML tags and non-breaking space entities
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const hasMedia = /<(img|iframe|video|audio|svg|table|pre)\b/i.test(html);
  return text.length === 0 && !hasMedia;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write blog content...",
  disabled = false,
  minHeight = "260px",
  className = "",
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const lastHtmlRef = useRef<string>(value || "");
  const valueRef = useRef<string>(value || "");
  valueRef.current = value || "";
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [isReady, setIsReady] = useState(false);

  const minHeightStyle = typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  // Initialize Quill client-side only
  useEffect(() => {
    let isMounted = true;

    const initQuill = async () => {
      try {
        const QuillModule = await import("quill");
        const Quill = QuillModule.default;

        if (!isMounted || !containerRef.current) return;

        // Custom undo and redo SVG icons for Quill's toolbar
        const icons = Quill.import("ui/icons") as any;
        if (icons) {
          if (!icons["undo"]) {
            icons["undo"] =
              '<svg viewBox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"/><path class="ql-stroke" d="M8.09,13.92A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"/></svg>';
          }
          if (!icons["redo"]) {
            icons["redo"] =
              '<svg viewBox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"/><path class="ql-stroke" d="M9.91,13.92A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"/></svg>';
          }
        }

        // Clean container to prevent duplicate elements on React StrictMode re-mount
        containerRef.current.innerHTML = "";

        const editorElement = document.createElement("div");
        containerRef.current.appendChild(editorElement);

        const toolbarOptions = [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ["link", "blockquote", "code-block"],
          ["clean"],
          ["undo", "redo"],
        ];

        const quill = new Quill(editorElement, {
          theme: "snow",
          placeholder,
          readOnly: disabled,
          modules: {
            toolbar: {
              container: toolbarOptions,
              handlers: {
                undo: function (this: any) {
                  const hist = this.quill.history || this.quill.getModule("history");
                  if (hist) hist.undo();
                },
                redo: function (this: any) {
                  const hist = this.quill.history || this.quill.getModule("history");
                  if (hist) hist.redo();
                },
              },
            },
            history: {
              delay: 500,
              maxStack: 100,
              userOnly: true,
            },
          },
        });

        quillRef.current = quill;

        // Populate initial content if present
        if (valueRef.current) {
          quill.clipboard.dangerouslyPasteHTML(valueRef.current);
          const initialHtml =
            typeof quill.getSemanticHTML === "function"
              ? quill.getSemanticHTML()
              : quill.root.innerHTML;
          lastHtmlRef.current = initialHtml;
        }

        // Listen for user text changes
        quill.on("text-change", (_delta, _oldDelta, source) => {
          if (source === "user") {
            const text = quill.getText().trim();
            const hasMedia = !!quill.root.querySelector("img, iframe, video, audio, svg, table, pre");
            const rawHtml =
              typeof quill.getSemanticHTML === "function"
                ? quill.getSemanticHTML()
                : quill.root.innerHTML;
            const finalHtml = text.length === 0 && !hasMedia ? "" : rawHtml;

            lastHtmlRef.current = finalHtml;
            onChangeRef.current(finalHtml);
          }
        });

        if (isMounted) {
          setIsReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize Quill editor:", err);
      }
    };

    initQuill();

    return () => {
      isMounted = false;
      if (quillRef.current) {
        quillRef.current.off("text-change");
        quillRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [placeholder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize external value updates (e.g. async fetch in edit mode)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml =
      typeof quill.getSemanticHTML === "function"
        ? quill.getSemanticHTML()
        : quill.root.innerHTML;
    const currentText = quill.getText().trim();
    const hasMedia = !!quill.root.querySelector("img, iframe, video, audio, svg, table, pre");
    const isCurrentlyEmpty = currentText.length === 0 && !hasMedia;

    if (value !== lastHtmlRef.current) {
      lastHtmlRef.current = value || "";
      // If external value is empty and editor is already empty, avoid resetting DOM
      if (!value && isCurrentlyEmpty) {
        return;
      }
      // If content differs from what's currently in Quill, update it safely
      if (value !== currentHtml) {
        const selection = quill.getSelection();
        quill.clipboard.dangerouslyPasteHTML(value || "");
        if (selection) {
          quill.setSelection(selection);
        }
      }
    }
  }, [value]);

  // Handle disabled prop state changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  return (
    <div
      className={`rich-text-editor-wrapper relative w-full rounded-xl border border-slate-200 bg-white transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 ${
        disabled ? "opacity-60 pointer-events-none bg-slate-50" : ""
      } ${className}`}
    >
      <style jsx global>{`
        .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background-color: #f8fafc;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          padding: 8px 12px;
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }
        .rich-text-editor-wrapper .ql-toolbar.ql-snow .ql-formats {
          margin-right: 8px;
          display: inline-flex;
          align-items: center;
        }
        .rich-text-editor-wrapper .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${minHeightStyle};
          padding: 14px 16px;
          font-size: 0.875rem;
          line-height: 1.625;
          color: #1e293b;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
          left: 16px;
          right: 16px;
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker-options {
          z-index: 50;
          background-color: #ffffff;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          padding: 4px;
        }
        .rich-text-editor-wrapper .ql-snow .ql-stroke {
          stroke: #475569;
        }
        .rich-text-editor-wrapper .ql-snow .ql-fill {
          fill: #475569;
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker {
          color: #475569;
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          color: #d97706;
          border-color: #d97706;
        }
        .rich-text-editor-wrapper .ql-snow button:hover .ql-stroke,
        .rich-text-editor-wrapper .ql-snow .ql-picker-label:hover .ql-stroke,
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #d97706;
        }
        .rich-text-editor-wrapper .ql-snow button:hover .ql-fill,
        .rich-text-editor-wrapper .ql-snow .ql-picker-label:hover .ql-fill,
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #d97706;
        }
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button:hover,
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button.ql-active {
          color: #d97706;
        }
      `}</style>

      {!isReady && (
        <div
          className="w-full flex items-center justify-center text-slate-400 text-xs gap-2 py-12"
          style={{ minHeight: minHeightStyle }}
        >
          <span className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading editor...</span>
        </div>
      )}

      <div ref={containerRef} className={isReady ? "block" : "hidden"} />
    </div>
  );
}
