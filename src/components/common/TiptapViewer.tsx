"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Spin } from "antd";

interface TiptapViewerProps {
  content: string;
  minHeight?: number;
}

export default function TiptapViewer({
  content,
  minHeight = 0,
}: TiptapViewerProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: "tiptap-viewer-content",
        style: minHeight > 0 ? `min-height: ${minHeight}px;` : "",
      },
    },
  });

  // Update content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <Spin />;
  }

  return (
    <div className="tiptap-viewer-wrapper  prose prose-lg max-w-none focus:outline-none ">
        <EditorContent editor={editor} />

      <style jsx global>{`
        .tiptap-viewer-content {
          padding: 0;
          outline: none;
          cursor: default;
          color: var(--text-primary);
        }

        .tiptap-viewer-content p {
          margin: 0 0 8px 0;
          line-height: 1.6;
          color: inherit;
        }

        .tiptap-viewer-content p:last-child {
          margin-bottom: 0;
        }

        .tiptap-viewer-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 16px 0 8px 0;
          line-height: 1.3;
          color: var(--text-primary);
        }

        .tiptap-viewer-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 14px 0 8px 0;
          line-height: 1.3;
          color: var(--text-primary);
        }

        .tiptap-viewer-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 12px 0 8px 0;
          line-height: 1.3;
          color: var(--text-primary);
        }

        .tiptap-viewer-content h1:first-child,
        .tiptap-viewer-content h2:first-child,
        .tiptap-viewer-content h3:first-child {
          margin-top: 0;
        }

        .tiptap-viewer-content ul,
        .tiptap-viewer-content ol {
          padding-left: 24px;
          margin: 8px 0;
        }

        .tiptap-viewer-content li {
          margin: 4px 0;
          line-height: 1.6;
        }

        .tiptap-viewer-content a {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap-viewer-content a:hover {
          color: #60a5fa;
        }

        .tiptap-viewer-content code {
          background-color: var(--bg-slate-100);
          color: var(--text-primary);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          font-size: 0.9em;
        }

        .tiptap-viewer-content pre {
          background-color: var(--bg-slate-100);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }

        /* Dark theme fixes */
        [data-theme='dark'] .tiptap-viewer-content code {
          background-color: var(--bg-slate-800);
          color: var(--text-primary);
        }

        [data-theme='dark'] .tiptap-viewer-content pre {
          background-color: var(--bg-slate-800);
          color: var(--text-primary);
        }

        .tiptap-viewer-content pre code {
          background: none;
          padding: 0;
        }

        .tiptap-viewer-content mark {
          background-color: #fff566;
          padding: 2px 0;
        }

        /* Dark theme fixes for highlights */
        [data-theme='dark'] .tiptap-viewer-content mark {
          background-color: #713f12;
          color: #fef3c7;
        }

        .tiptap-viewer-content .tiptap-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
          display: inline-block;
          cursor: pointer;
        }

        .tiptap-viewer-content blockquote {
          border-left: 3px solid var(--border-color);
          padding-left: 12px;
          margin: 8px 0;
          color: var(--text-secondary);
          font-style: italic;
        }

        .tiptap-viewer-content strong {
          font-weight: 600;
          color: var(--text-primary);
        }

        .tiptap-viewer-content em {
          font-style: italic;
          color: var(--text-primary);
        }

        .tiptap-viewer-content u {
          text-decoration: underline;
          color: var(--text-primary);
        }

        .tiptap-viewer-content s {
          text-decoration: line-through;
          color: var(--text-primary);
        }

        /* Ensure all text elements inherit proper colors in dark theme */
        [data-theme='dark'] .tiptap-viewer-content p,
        [data-theme='dark'] .tiptap-viewer-content li,
        [data-theme='dark'] .tiptap-viewer-content span,
        [data-theme='dark'] .tiptap-viewer-content div {
          color: var(--text-primary);
        }

        [data-theme='dark'] .tiptap-viewer-content strong,
        [data-theme='dark'] .tiptap-viewer-content em,
        [data-theme='dark'] .tiptap-viewer-content u,
        [data-theme='dark'] .tiptap-viewer-content s {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
