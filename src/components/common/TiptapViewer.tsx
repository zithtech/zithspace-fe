'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Spin } from 'antd';

interface TiptapViewerProps {
  content: string;
  minHeight?: number;
}

export default function TiptapViewer({
  content,
  minHeight = 100,
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
          class: 'tiptap-image',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'tiptap-viewer-content',
        style: `min-height: ${minHeight}px;`,
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
    <div className="tiptap-viewer-wrapper">
      <EditorContent editor={editor} />

      <style jsx global>{`
        .tiptap-viewer-content {
          padding: 0;
          outline: none;
          cursor: default;
        }

        .tiptap-viewer-content p {
          margin: 0 0 8px 0;
          line-height: 1.6;
        }

        .tiptap-viewer-content p:last-child {
          margin-bottom: 0;
        }

        .tiptap-viewer-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 16px 0 8px 0;
          line-height: 1.3;
        }

        .tiptap-viewer-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 14px 0 8px 0;
          line-height: 1.3;
        }

        .tiptap-viewer-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 12px 0 8px 0;
          line-height: 1.3;
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
          color: #1890ff;
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap-viewer-content a:hover {
          color: #40a9ff;
        }

        .tiptap-viewer-content code {
          background-color: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .tiptap-viewer-content pre {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }

        .tiptap-viewer-content pre code {
          background: none;
          padding: 0;
        }

        .tiptap-viewer-content mark {
          background-color: #fff566;
          padding: 2px 0;
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
          border-left: 3px solid #d9d9d9;
          padding-left: 12px;
          margin: 8px 0;
          color: #595959;
          font-style: italic;
        }

        .tiptap-viewer-content strong {
          font-weight: 600;
        }

        .tiptap-viewer-content em {
          font-style: italic;
        }

        .tiptap-viewer-content u {
          text-decoration: underline;
        }

        .tiptap-viewer-content s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
