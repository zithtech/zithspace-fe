"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  TableOutlined,
  UndoOutlined,
  RedoOutlined,
  FileImageOutlined,
  MinusOutlined,
  BlockOutlined,
  LoadingOutlined,
  BorderOutlined,
  LayoutOutlined,
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  DeleteRowOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  DeleteColumnOutlined,
  DeleteOutlined,
  BorderlessTableOutlined,
  VerticalAlignMiddleOutlined,
  FieldNumberOutlined,
  FontColorsOutlined,
  BgColorsOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { Modal, Radio, Select } from "antd";
import { toast } from "react-hot-toast";
import { LettersService, DocumentStructure } from "@/services/lettersService";
import { AppstoreAddOutlined, ScissorOutlined } from "@ant-design/icons";
import SearchableDropdown from "@/components/common/SearchableDropdown";

const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  parseHTML() {
    return [{ tag: 'div.html2pdf__page-break' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'html2pdf__page-break', style: 'page-break-after: always; break-after: page; height: 1px; width: 100%; border-top: 1px dashed #cbd5e1; margin: 20px 0;' })];
  },
  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({ type: this.name });
      },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    }
  }
}

const FontSizeExtension = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    }
  }
}

const PlaceholderAttr = Extension.create({
  name: "placeholderAttr",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          "data-placeholder-key": {
            default: null,
            parseHTML: (element) => element.getAttribute("data-placeholder-key"),
            renderHTML: (attributes) => {
              if (!attributes["data-placeholder-key"]) {
                return {};
              }
              return {
                "data-placeholder-key": attributes["data-placeholder-key"],
              };
            },
          },
          "class": {
            default: null,
            parseHTML: (element) => element.getAttribute("class"),
            renderHTML: (attributes) => {
              if (!attributes["class"]) {
                return {};
              }
              return {
                "class": attributes["class"],
              };
            },
          },
        },
      },
    ];
  },
});

interface LetterTiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeight?: number;
  onEditorReady?: (editor: any) => void;
}

export default function LetterTiptapEditor({
  content = "",
  onChange,
  editable = true,
  minHeight = 450,
  onEditorReady,
}: LetterTiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [structures, setStructures] = useState<DocumentStructure[]>([]);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);

  useEffect(() => {
    const fetchStructures = async () => {
      try {
        const data = await LettersService.getStructures();
        setStructures(data);
      } catch (error) {
        console.error("Failed to load structures", error);
      }
    };
    fetchStructures();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      if (!base64Str) return;

      try {
        setUploadingImage(true);
        const toastId = toast.loading("Uploading image to R2...");
        try {
          const url = await LettersService.uploadTemplateImage(base64Str);
          editor.chain().focus().setImage({ src: url }).run();
          toast.success("Image added from R2 storage!", { id: toastId });
        } catch (apiErr) {
          console.warn("R2 upload fallback to base64:", apiErr);
          editor.chain().focus().setImage({ src: base64Str }).run();
          toast.success("Image embedded!", { id: toastId });
        }
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      PageBreak,
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      FontSizeExtension,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false }),
      PlaceholderAttr,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      Table.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute("style"),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
            "data-layout": {
              default: null,
              parseHTML: (el) => el.getAttribute("data-layout"),
              renderHTML: (attrs) => (attrs["data-layout"] ? { "data-layout": attrs["data-layout"] } : {}),
            },
          };
        },
      }).configure({ resizable: true }),
      TableRow.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute("style"),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }),
      TableHeader,
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute("style"),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      if (Math.abs(editor.getHTML().length - content.length) > 5) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div
        style={{
          minHeight,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
        }}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      {editable && (
        <div
          style={{
            padding: "8px 12px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
          }}
        >
          <SearchableDropdown
            placeholder="Default Font"
            onOpenChange={(open) => {
              if (open) {
                setSavedSelection({ from: editor.state.selection.from, to: editor.state.selection.to });
              }
            }}
            onChange={(val) => {
              const newVal = val || "";
              if (savedSelection) {
                editor.chain().setTextSelection(savedSelection).setFontFamily(newVal).focus().run();
              } else {
                editor.chain().focus().setFontFamily(newVal).run();
              }
            }}
            value={editor.getAttributes("textStyle").fontFamily || ""}
            style={{ width: 140 }}
            options={[
              { value: "", label: "Default Font" },
              { value: "Arial", label: "Arial" },
              { value: "Courier New", label: "Courier New" },
              { value: "Times New Roman", label: "Times New Roman" },
              { value: "Georgia", label: "Georgia" },
              { value: "Verdana", label: "Verdana" },
            ]}
            hideAvatar={true}
          />

          <SearchableDropdown
            placeholder="Size"
            onOpenChange={(open) => {
              if (open) {
                setSavedSelection({ from: editor.state.selection.from, to: editor.state.selection.to });
              }
            }}
            onChange={(val) => {
              const chain = savedSelection
                ? editor.chain().setTextSelection(savedSelection)
                : editor.chain().focus();

              if (val) {
                chain.setFontSize(val).run();
              } else {
                chain.unsetFontSize().run();
              }
            }}
            value={editor.getAttributes("textStyle").fontSize || ""}
            style={{ width: 80 }}
            options={[
              { value: "", label: "Size" },
              { value: "8pt", label: "8" },
              { value: "10pt", label: "10" },
              { value: "12pt", label: "12" },
              { value: "14pt", label: "14" },
              { value: "18pt", label: "18" },
              { value: "24pt", label: "24" },
              { value: "36pt", label: "36" },
            ]}
            hideAvatar={true}
          />

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("bold") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("bold") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("bold") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Bold"
          >
            <BoldOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("italic") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("italic") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("italic") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Italic"
          >
            <ItalicOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("underline") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("underline") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("underline") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Underline"
          >
            <UnderlineOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("strike") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("strike") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("strike") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Strikethrough"
          >
            <StrikethroughOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("subscript") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("subscript") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("subscript") ? "#2563eb" : "#475569",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
            }}
            title="Subscript"
          >
            x₂
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("superscript") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("superscript") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("superscript") ? "#2563eb" : "#475569",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
            }}
            title="Superscript"
          >
            x²
          </button>
          <button
            type="button"
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href
              const url = window.prompt('URL', previousUrl)
              if (url === null) {
                return
              }
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("link") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("link") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("link") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Link"
          >
            <LinkOutlined />
          </button>

          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
            style={{
              width: "28px",
              height: "28px",
              padding: "0",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              background: "#ffffff",
            }}
            title="Text Color"
          />

          <input
            type="color"
            onInput={(e) => editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()}
            value={editor.getAttributes("highlight").color || "#ffffff"}
            style={{
              width: "28px",
              height: "28px",
              padding: "0",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              background: "#ffffff",
            }}
            title="Highlight Color"
          />

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("heading", { level: 1 }) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("heading", { level: 1 }) ? "#eff6ff" : "#ffffff",
              color: editor.isActive("heading", { level: 1 }) ? "#2563eb" : "#475569",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
            }}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("heading", { level: 2 }) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("heading", { level: 2 }) ? "#eff6ff" : "#ffffff",
              color: editor.isActive("heading", { level: 2 }) ? "#2563eb" : "#475569",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
            }}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("heading", { level: 3 }) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("heading", { level: 3 }) ? "#eff6ff" : "#ffffff",
              color: editor.isActive("heading", { level: 3 }) ? "#2563eb" : "#475569",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
            }}
            title="Heading 3"
          >
            H3
          </button>

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive({ textAlign: "left" }) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive({ textAlign: "left" }) ? "#eff6ff" : "#ffffff",
              color: editor.isActive({ textAlign: "left" }) ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Align Left"
          >
            <AlignLeftOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive({ textAlign: "center" }) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive({ textAlign: "center" }) ? "#eff6ff" : "#ffffff",
              color: editor.isActive({ textAlign: "center" }) ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Align Center"
          >
            <AlignCenterOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive({ textAlign: "right" }) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive({ textAlign: "right" }) ? "#eff6ff" : "#ffffff",
              color: editor.isActive({ textAlign: "right" }) ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Align Right"
          >
            <AlignRightOutlined />
          </button>

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("bulletList") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("bulletList") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("bulletList") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Bullet List"
          >
            <UnorderedListOutlined />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("orderedList") ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("orderedList") ? "#eff6ff" : "#ffffff",
              color: editor.isActive("orderedList") ? "#2563eb" : "#475569",
              cursor: "pointer",
            }}
            title="Numbered List"
          >
            <OrderedListOutlined />
          </button>

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Table"
          >
            <TableOutlined />
          </button>

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent(`<table data-layout="side-by-side" style="width: 100%; border: none !important; border-collapse: collapse; margin: 0;"><tbody><tr style="border: none !important; background: transparent !important;"><td style="width: 50%; border: none !important; padding: 4px; vertical-align: top;"><p>Enter left header details here...</p></td><td style="width: 50%; border: none !important; padding: 4px; vertical-align: top; text-align: right;"><p style="text-align: right;">[Insert Logo here ->]</p></td></tr></tbody></table>`)
                .run()
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Side-by-Side Row (2 Columns)"
          >
            <LayoutOutlined />
          </button>

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().addRowBefore().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#475569" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Insert Row Above"
          >
            <InsertRowAboveOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().addRowAfter().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#475569" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Insert Row Below"
          >
            <InsertRowBelowOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().deleteRow().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#ef4444" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Delete Row"
          >
            <DeleteRowOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().addColumnBefore().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#475569" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Insert Column Left"
          >
            <InsertRowLeftOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().addColumnAfter().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#475569" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Insert Column Right"
          >
            <InsertRowRightOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().deleteColumn().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#ef4444" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Delete Column"
          >
            <DeleteColumnOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.isActive("table") && editor.chain().focus().deleteTable().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: editor.isActive("table") ? "#dc2626" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Delete Entire Table"
          >
            <DeleteOutlined />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!editor.isActive("table")) return;
              const tableAttrs = editor.getAttributes("table");
              const isBorderless = tableAttrs["data-layout"] === "side-by-side" || tableAttrs["data-layout"] === "borderless" || (tableAttrs.style && tableAttrs.style.includes("border: none"));
              if (isBorderless) {
                editor.chain().focus().updateAttributes("table", { "data-layout": null, style: "width: 100%; border-collapse: collapse; margin: 1.5em 0;" }).run();
              } else {
                editor.chain().focus().updateAttributes("table", { "data-layout": "borderless", style: "width: 100%; border: none !important; border-collapse: collapse; margin: 1.5em 0;" }).run();
              }
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("table") && (editor.getAttributes("table")["data-layout"] === "borderless" || editor.getAttributes("table")["data-layout"] === "side-by-side" || (editor.getAttributes("table").style && editor.getAttributes("table").style.includes("border: none"))) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("table") && (editor.getAttributes("table")["data-layout"] === "borderless" || editor.getAttributes("table")["data-layout"] === "side-by-side" || (editor.getAttributes("table").style && editor.getAttributes("table").style.includes("border: none"))) ? "#eff6ff" : "#ffffff",
              color: editor.isActive("table") ? "#2563eb" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Toggle Table Borders (Show / Hide)"
          >
            <BorderlessTableOutlined />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!editor.isActive("table")) return;
              const cellAttrs = editor.getAttributes("tableCell");
              const headerAttrs = editor.getAttributes("tableHeader");
              let currentStyle = cellAttrs.style || headerAttrs.style || "";

              if (currentStyle.includes("vertical-align: middle")) {
                currentStyle = currentStyle.replace(/vertical-align:\s*middle;?/g, "").trim();
              } else {
                currentStyle += (currentStyle.length && !currentStyle.endsWith(";")) ? "; vertical-align: middle;" : " vertical-align: middle;";
              }

              if (editor.isActive("tableCell")) {
                editor.chain().focus().updateAttributes("tableCell", { style: currentStyle }).run();
              }
              if (editor.isActive("tableHeader")) {
                editor.chain().focus().updateAttributes("tableHeader", { style: currentStyle }).run();
              }
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("table") && ((editor.getAttributes("tableCell").style || "").includes("vertical-align: middle") || (editor.getAttributes("tableHeader").style || "").includes("vertical-align: middle")) ? "#3b82f6" : "#e2e8f0",
              background: editor.isActive("table") && ((editor.getAttributes("tableCell").style || "").includes("vertical-align: middle") || (editor.getAttributes("tableHeader").style || "").includes("vertical-align: middle")) ? "#eff6ff" : "#ffffff",
              color: editor.isActive("table") ? "#2563eb" : "#cbd5e1",
              cursor: editor.isActive("table") ? "pointer" : "not-allowed",
            }}
            title="Vertical Align Center"
          >
            <VerticalAlignMiddleOutlined />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: uploadingImage ? "wait" : "pointer",
            }}
            title="Insert Picture"
          >
            {uploadingImage ? <LoadingOutlined /> : <FileImageOutlined />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => editor.chain().focus().setPageBreak().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Page Break"
          >
            <ScissorOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Horizontal Line"
          >
            <MinusOutlined />
          </button>

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent(`<div data-type="callout" style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin: 12px 0;"><p>Note: Enter callout content here...</p></div>`)
                .run()
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Callout Box"
          >
            <BlockOutlined />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().insertContent('<span class="pageNumber" style="font-weight: bold; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; border: 1px dashed #cbd5e1; color: #64748b;">[Page #]</span>').run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Auto Page Number (Header/Footer Only)"
          >
            <FieldNumberOutlined />
          </button>

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent(`<div data-type="textbox" style="border: 1px solid #cbd5e1; padding: 12px 16px; border-radius: 6px; margin: 12px 0; background: #ffffff; display: inline-block; min-width: 250px;"><p>Enter text box content here...</p></div>`)
                .run()
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
            }}
            title="Insert Text Box"
          >
            <BorderOutlined />
          </button>

          <button
            type="button"
            onClick={() => setIsStructureModalOpen(true)}
            disabled={structures.length === 0}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: structures.length > 0 ? "#475569" : "#cbd5e1",
              cursor: structures.length > 0 ? "pointer" : "not-allowed",
            }}
            title="Insert Custom Structure"
          >
            <AppstoreAddOutlined />
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: editor.can().undo() ? "#ffffff" : "#f1f5f9",
                color: editor.can().undo() ? "#475569" : "#cbd5e1",
                cursor: editor.can().undo() ? "pointer" : "not-allowed",
              }}
              title="Undo"
            >
              <UndoOutlined />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: editor.can().redo() ? "#ffffff" : "#f1f5f9",
                color: editor.can().redo() ? "#475569" : "#cbd5e1",
                cursor: editor.can().redo() ? "pointer" : "not-allowed",
              }}
              title="Redo"
            >
              <RedoOutlined />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div
        style={{
          padding: "24px 32px",
          minHeight: `${minHeight}px`,
          maxHeight: "750px",
          overflowY: "auto",
          background: "#ffffff",
        }}
        className="letter-tiptap-content"
      >
        <EditorContent editor={editor} />
      </div>

      <Modal
        title="Insert Custom Structure"
        open={isStructureModalOpen}
        onOk={() => {
          if (!selectedStructureId) {
            toast.error('Please select a structure');
            return;
          }
          const structure = structures.find(s => s.id === selectedStructureId);
          if (structure) {
            editor.chain().focus().insertContent('<br/>' + structure.htmlContent + '<p></p>').run();
            toast.success(`Inserted structure: ${structure.name}`);
          }
          setIsStructureModalOpen(false);
          setSelectedStructureId('');
        }}
        onCancel={() => {
          setIsStructureModalOpen(false);
          setSelectedStructureId('');
        }}
        okText="Insert"
        cancelText="Cancel"
        destroyOnClose
        width={750}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: '16px', color: '#475569' }}>
            Choose a custom structure to insert into the editor:
          </p>
          <Radio.Group
            onChange={(e) => setSelectedStructureId(e.target.value)}
            value={selectedStructureId}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {structures.map(cs => (
              <Radio value={cs.id} key={cs.id}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <strong>{cs.name}</strong>
                  {cs.tenantId === 'GLOBAL' && (
                    <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 600 }}>GLOBAL</span>
                  )}
                </div>
              </Radio>
            ))}
          </Radio.Group>

          {selectedStructureId && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Preview
              </div>
              <div className="letter-tiptap-content" style={{ background: 'transparent' }}>
                <div
                  className="ProseMirror"
                  style={{ minHeight: 'auto', outline: 'none' }}
                  dangerouslySetInnerHTML={{
                    __html: structures.find(s => s.id === selectedStructureId)?.htmlContent || ''
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .letter-tiptap-content .ProseMirror {
          outline: none;
          min-height: ${minHeight - 48}px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #1e293b;
        }
        .letter-tiptap-content .ProseMirror p {
          margin-bottom: 1em;
        }
        .letter-tiptap-content .ProseMirror h1 {
          font-size: 1.8em;
          font-weight: 700;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          color: #0f172a;
          page-break-before: always;
          break-before: page;
        }
        .letter-tiptap-content .ProseMirror > h1:first-child {
          page-break-before: auto;
          break-before: auto;
        }
        .letter-tiptap-content .ProseMirror h2 {
          font-size: 1.4em;
          font-weight: 600;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          color: #1e293b;
        }
        .letter-tiptap-content .ProseMirror h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #334155;
        }
        .letter-tiptap-content .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5em 0;
          overflow: hidden;
        }
        .letter-tiptap-content .ProseMirror td,
        .letter-tiptap-content .ProseMirror th {
          min-width: 1em;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .letter-tiptap-content .ProseMirror table[data-layout="side-by-side"] td,
        .letter-tiptap-content .ProseMirror table[style*="border: none"] td,
        .letter-tiptap-content .ProseMirror table[style*="border-style: none"] td,
        .letter-tiptap-content .ProseMirror table[style*="border-width: 0"] td {
          border: 1px dashed #e2e8f0 !important;
          background: transparent !important;
        }
        .letter-tiptap-content .ProseMirror th {
          font-weight: 600;
          text-align: left;
          background-color: #f1f5f9;
        }
        .letter-tiptap-content .ProseMirror ul,
        .letter-tiptap-content .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 1em;
        }
        .letter-tiptap-content .ProseMirror img[style*="text-align: center"],
        .letter-tiptap-content .ProseMirror img[data-text-align="center"],
        .letter-tiptap-content .ProseMirror p[style*="text-align: center"] img,
        .letter-tiptap-content .ProseMirror p[style*="text-align: center;"] img {
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .letter-tiptap-content .ProseMirror img[style*="text-align: right"],
        .letter-tiptap-content .ProseMirror img[data-text-align="right"],
        .letter-tiptap-content .ProseMirror p[style*="text-align: right"] img,
        .letter-tiptap-content .ProseMirror p[style*="text-align: right;"] img {
          display: block;
          margin-left: auto;
          margin-right: 0;
        }
      `}</style>
    </div>
  );
}
