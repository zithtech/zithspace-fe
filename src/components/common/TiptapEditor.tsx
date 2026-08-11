"use client";

import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { message } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  CodeOutlined,
  HighlightOutlined,
  UndoOutlined,
  RedoOutlined
} from "@ant-design/icons";
import { apiClient } from "@/lib/axios";
import ZukvoLoader from "./ZukvoLoader";


interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export interface TiptapEditorRef {
  insertContentAtCursor: (html: string) => void;
}

const TiptapEditor = React.forwardRef<TiptapEditorRef, TiptapEditorProps>(({
  content = "",
  onChange,
  placeholder = "Start typing...",
  editable = true,
  minHeight = 200,
  maxHeight = 600 }, ref) => {
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "tiptap-image"
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Highlight.configure({
        multicolor: false
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
        style: `min-height: ${minHeight}px; max-height: ${maxHeight}px; overflow-y: auto;`
      }
    }
  });

  React.useImperativeHandle(ref, () => ({
    insertContentAtCursor: (html: string) => {
      if (editor) {
        editor.chain().focus().insertContent(html).run();
      }
    }
  }));

  // Update editor content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const handleImageUpload = useCallback(async () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        message.error("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        message.error("Please select a valid image file");
        return;
      }

      try {
        setUploading(true);

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;

          try {
            // Upload to backend
            const response = await apiClient.post("/api/tickets/upload-image", {
              image: base64
            });

            if (response.data.success && response.data.data.url) {
              // Insert image at cursor position
              editor
                .chain()
                .focus()
                .setImage({ src: response.data.data.url })
                .run();
              message.success("Image uploaded successfully");
            } else {
              throw new Error("Upload failed");
            }
          } catch (error: any) {
            console.error("Image upload error:", error);
            message.error(
              error.response?.data?.error || "Failed to upload image",
            );
          } finally {
            setUploading(false);
          }
        };

        reader.onerror = () => {
          message.error("Failed to read image file");
          setUploading(false);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Image upload error:", error);
        message.error("Failed to upload image");
        setUploading(false);
      }
    };

    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <ZukvoLoader size="md" />;
  }

  return (
    <div
      className="tiptap-editor-wrapper"
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: "6px",
        overflow: "hidden",
        background: "var(--bg-primary)"
      }}
    >
      {editable && (
        <div
          className="tiptap-toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            padding: "8px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-secondary)"
          }}
        >
          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}
            style={buttonStyle}
            title="Bold"
          >
            <BoldOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}
            style={buttonStyle}
            title="Italic"
          >
            <ItalicOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "is-active" : ""}
            style={buttonStyle}
            title="Underline"
          >
            <UnderlineOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is-active" : ""}
            style={buttonStyle}
            title="Strikethrough"
          >
            <StrikethroughOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            disabled={!editor.can().chain().focus().toggleHighlight().run()}
            className={editor.isActive("highlight") ? "is-active" : ""}
            style={buttonStyle}
            title="Highlight"
          >
            <HighlightOutlined />
          </button>

          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "var(--border-color)",
              margin: "0 4px"
            }}
          />

          {/* Headings */}
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive("heading", { level: 1 }) ? "is-active" : ""
            }
            style={buttonStyle}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive("heading", { level: 2 }) ? "is-active" : ""
            }
            style={buttonStyle}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={
              editor.isActive("heading", { level: 3 }) ? "is-active" : ""
            }
            style={buttonStyle}
            title="Heading 3"
          >
            H3
          </button>

          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "var(--border-color)",
              margin: "0 4px"
            }}
          />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "is-active" : ""}
            style={buttonStyle}
            title="Bullet List"
          >
            <UnorderedListOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "is-active" : ""}
            style={buttonStyle}
            title="Ordered List"
          >
            <OrderedListOutlined />
          </button>

          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "var(--border-color)",
              margin: "0 4px"
            }}
          />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={
              editor.isActive({ textAlign: "left" }) ? "is-active" : ""
            }
            style={buttonStyle}
            title="Align Left"
          >
            <AlignLeftOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? "is-active" : ""
            }
            style={buttonStyle}
            title="Align Center"
          >
            <AlignCenterOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? "is-active" : ""
            }
            style={buttonStyle}
            title="Align Right"
          >
            <AlignRightOutlined />
          </button>

          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "var(--border-color)",
              margin: "0 4px"
            }}
          />

          {/* Link & Image */}
          <button
            type="button"
            onClick={setLink}
            className={editor.isActive("link") ? "is-active" : ""}
            style={buttonStyle}
            title="Add Link"
          >
            <LinkOutlined />
          </button>
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploading}
            style={buttonStyle}
            title="Upload Image"
          >
            {uploading ? <ZukvoLoader size="sm" /> : <PictureOutlined />}
          </button>

          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "var(--border-color)",
              margin: "0 4px"
            }}
          />

          {/* Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "is-active" : ""}
            style={buttonStyle}
            title="Code Block"
          >
            <CodeOutlined />
          </button>

          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "var(--border-color)",
              margin: "0 4px"
            }}
          />

          {/* Undo/Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            style={buttonStyle}
            title="Undo"
          >
            <UndoOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            style={buttonStyle}
            title="Redo"
          >
            <RedoOutlined />
          </button>
        </div>
      )}

      <div className="prose prose-lg max-w-none focus:outline-none" style={{ color: 'var(--text-primary)' }}>
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .tiptap-editor-content {
          padding: 12px;
          outline: none;
          color: var(--text-primary);
        }

        .tiptap-editor-content p {
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }

        /* Bold text inherits the theme's primary color in BOTH modes.
           Without this, Tailwind's prose plugin sets a near-black --tw-prose-bold
           that disappears against the dark-mode background. */
        .tiptap-editor-content strong,
        .tiptap-editor-content b {
          color: var(--text-primary);
          font-weight: 700;
        }

        .tiptap-editor-content em,
        .tiptap-editor-content i,
        .tiptap-editor-content u,
        .tiptap-editor-content s {
          color: var(--text-primary);
        }

        .tiptap-editor-content li {
          color: var(--text-primary);
        }

        .tiptap-editor-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 16px 0 8px 0;
          color: var(--text-primary);
        }

        .tiptap-editor-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 14px 0 8px 0;
          color: var(--text-primary);
        }

        .tiptap-editor-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 12px 0 8px 0;
          color: var(--text-primary);
        }

        .tiptap-editor-content ul,
        .tiptap-editor-content ol {
          padding-left: 24px;
          margin: 8px 0;
        }

        .tiptap-editor-content li {
          margin: 4px 0;
        }

        .tiptap-editor-content a {
          color: var(--premium-blue);
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap-editor-content a:hover {
          opacity: 0.8;
        }

        .tiptap-editor-content code {
          background-color: var(--bg-slate-100);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          color: var(--text-primary);
        }

        .tiptap-editor-content pre {
          background-color: var(--bg-slate-100);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
          color: var(--text-primary);
        }

        .tiptap-editor-content pre code {
          background: none;
          padding: 0;
        }

        .tiptap-editor-content mark {
          background-color: rgba(255, 230, 0, 0.4);
          padding: 2px 0;
        }

        .tiptap-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
          display: inline-block;
        }

        .tiptap-editor-content blockquote {
          border-left: 3px solid var(--border-color);
          padding-left: 12px;
          margin: 8px 0;
          color: var(--text-slate-500);
        }

        .tiptap-editor-content:empty:before {
          content: attr(data-placeholder);
          color: var(--text-slate-400);
          pointer-events: none;
          position: absolute;
        }

        .is-active {
          background-color: var(--bg-blue-50) !important;
          color: var(--premium-blue) !important;
        }
      `}</style>
    </div>
  );
});

export default TiptapEditor;

const buttonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "4px 8px",
  cursor: "pointer",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  color: "var(--text-slate-500)",
  transition: "all 0.2s",
  minWidth: "32px",
  height: "32px"
};
