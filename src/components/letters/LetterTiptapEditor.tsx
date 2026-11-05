"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
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
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Modal, Popover, Radio, Select } from "antd";
import { toast } from "react-hot-toast";
import { LettersService, DocumentStructure } from "@/services/lettersService";
import { AppstoreAddOutlined, ScissorOutlined } from "@ant-design/icons";

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


const LogoUploadComponent = (props: any) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      setUploading(true);
      const toastId = toast.loading("Uploading logo...");
      try {
        const url = await LettersService.uploadTemplateImage(base64Str);
        props.editor.chain().focus().insertContentAt({ from: props.getPos(), to: props.getPos() + 1 }, {
          type: 'image',
          attrs: {
            src: url,
            width: '140px',
            style: 'width: 140px; max-width: 100%; height: auto; object-fit: contain;',
          }
        }).run();
        toast.success("Logo uploaded!", { id: toastId });
      } catch (err) {
        props.editor.chain().focus().insertContentAt({ from: props.getPos(), to: props.getPos() + 1 }, {
          type: 'image',
          attrs: {
            src: base64Str,
            width: '140px',
            style: 'width: 140px; max-width: 100%; height: auto; object-fit: contain;',
          }
        }).run();
        toast.success("Logo embedded!", { id: toastId });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ padding: '6px 12px', border: '1px dashed #3b82f6', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        {uploading ? <LoadingOutlined /> : <UploadOutlined />} Upload Logo
      </button>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
    </NodeViewWrapper>
  );
};

const ImageNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, editor } = props;
  const src = node.attrs.src;
  const rawWidth = node.attrs.width || '';
  const numericWidth = parseInt(rawWidth, 10);

  const setWidth = (w: string) => {
    updateAttributes({
      width: w,
      style: `width: ${w}; max-width: 100%; height: auto; object-fit: contain;`,
    });
  };

  const handleReduce = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = !isNaN(numericWidth) && numericWidth > 0 ? numericWidth : 140;
    const next = Math.max(40, current - 20);
    setWidth(`${next}px`);
  };

  const handleEnlarge = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = !isNaN(numericWidth) && numericWidth > 0 ? numericWidth : 140;
    const next = Math.min(800, current + 20);
    setWidth(`${next}px`);
  };

  const popoverContent = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => e.stopPropagation()}
    >
      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, paddingRight: '2px' }}>
        Size:
      </span>

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth('80px'); }}
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: rawWidth === '80px' ? '#3b82f6' : '#e2e8f0',
          background: rawWidth === '80px' ? '#eff6ff' : '#ffffff',
          color: rawWidth === '80px' ? '#2563eb' : '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 500,
        }}
        title="Extra Small (80px)"
      >
        XS
      </button>

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth('140px'); }}
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: (rawWidth === '140px' || !rawWidth) ? '#3b82f6' : '#e2e8f0',
          background: (rawWidth === '140px' || !rawWidth) ? '#eff6ff' : '#ffffff',
          color: (rawWidth === '140px' || !rawWidth) ? '#2563eb' : '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
        title="Logo / Small (140px)"
      >
        S (Logo)
      </button>

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth('220px'); }}
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: rawWidth === '220px' ? '#3b82f6' : '#e2e8f0',
          background: rawWidth === '220px' ? '#eff6ff' : '#ffffff',
          color: rawWidth === '220px' ? '#2563eb' : '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 500,
        }}
        title="Medium (220px)"
      >
        M
      </button>

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth('360px'); }}
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: rawWidth === '360px' ? '#3b82f6' : '#e2e8f0',
          background: rawWidth === '360px' ? '#eff6ff' : '#ffffff',
          color: rawWidth === '360px' ? '#2563eb' : '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 500,
        }}
        title="Large (360px)"
      >
        L
      </button>

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth('100%'); }}
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: rawWidth === '100%' ? '#3b82f6' : '#e2e8f0',
          background: rawWidth === '100%' ? '#eff6ff' : '#ffffff',
          color: rawWidth === '100%' ? '#2563eb' : '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 500,
        }}
        title="Full Width (100%)"
      >
        100%
      </button>

      <span style={{ width: '1px', height: '14px', background: '#e2e8f0', margin: '0 2px' }} />

      <button
        type="button"
        onClick={handleReduce}
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          color: '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
        }}
        title="Reduce size (-20px)"
      >
        <ZoomOutOutlined style={{ fontSize: '11px' }} /> -20px
      </button>

      <button
        type="button"
        onClick={handleEnlarge}
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          color: '#334155',
          cursor: 'pointer',
          fontSize: '11px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
        }}
        title="Enlarge size (+20px)"
      >
        <ZoomInOutlined style={{ fontSize: '11px' }} /> +20px
      </button>

      <span style={{ width: '1px', height: '14px', background: '#e2e8f0', margin: '0 2px' }} />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (deleteNode) deleteNode();
        }}
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #fecaca',
          background: '#fef2f2',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: '11px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
        title="Delete Image"
      >
        <DeleteOutlined style={{ fontSize: '11px' }} />
      </button>
    </div>
  );

  return (
    <NodeViewWrapper
      as="span"
      className="tiptap-image-view-wrapper"
      style={{
        display: 'inline-block',
        position: 'relative',
        maxWidth: '100%',
        verticalAlign: 'middle',
        lineHeight: 1,
        margin: '2px 0',
      }}
    >
      <Popover
        open={Boolean(selected && editor?.isEditable)}
        placement="bottom"
        content={popoverContent}
        trigger={[]}
        arrow={false}
      >
        <img
          src={src}
          alt={node.attrs.alt || ''}
          style={{
            width: rawWidth || undefined,
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'inline-block',
            verticalAlign: 'middle',
            borderRadius: '4px',
            outline: selected ? '2px solid #2563eb' : 'none',
            outlineOffset: '2px',
            cursor: 'pointer',
            transition: 'outline 0.15s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (props.selectNode) props.selectNode();
          }}
        />
      </Popover>
    </NodeViewWrapper>
  );
};

const CustomImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width') || (element.style && element.style.width) || null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width,
            style: `width: ${attributes.width}; max-width: 100%; height: auto; object-fit: contain;`,
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => {
          if (attributes.style) return { style: attributes.style };
          if (attributes.width) return { style: `width: ${attributes.width}; max-width: 100%; height: auto; object-fit: contain;` };
          return { style: 'max-width: 100%; height: auto; object-fit: contain;' };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

const LogoUploadNode = Node.create({
  name: 'logoUpload',
  group: 'inline',
  inline: true,
  atom: true,
  parseHTML() {
    return [{ tag: 'button[data-type="logo-upload"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['button', mergeAttributes(HTMLAttributes, { 'data-type': 'logo-upload' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(LogoUploadComponent);
  },
});

const FONT_FAMILIES = [
  { value: "", label: "Default Font" },
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Roboto", label: "Roboto" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Courier New", label: "Courier New" },
  { value: "Verdana", label: "Verdana" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
];

const FONT_SIZES = [
  { value: "", label: "Size" },
  { value: "9px", label: "9px" },
  { value: "10px", label: "10px" },
  { value: "11px", label: "11px" },
  { value: "12px", label: "12px" },
  { value: "13px", label: "13px" },
  { value: "14px", label: "14px" },
  { value: "15px", label: "15px" },
  { value: "16px", label: "16px" },
  { value: "18px", label: "18px" },
  { value: "20px", label: "20px" },
  { value: "24px", label: "24px" },
  { value: "28px", label: "28px" },
  { value: "32px", label: "32px" },
  { value: "36px", label: "36px" },
  { value: "48px", label: "48px" },
];

interface LetterTiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeight?: number;
  onEditorReady?: (editor: any) => void;
  bordered?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function LetterTiptapEditor({
  content = "",
  onChange,
  editable = true,
  minHeight = 450,
  onEditorReady,
  bordered = true,
  style,
  className,
}: LetterTiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [structures, setStructures] = useState<DocumentStructure[]>([]);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);
  const [, setSelectionTick] = useState(0);

  useEffect(() => {
    const fetchStructures = async () => {
      try {
        const res = await LettersService.getStructures();
        setStructures(Array.isArray(res) ? res : (res as any).data || []);
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
          editor.chain().focus().setImage({
            src: url,
            width: '220px',
            style: 'width: 220px; max-width: 100%; height: auto; object-fit: contain;',
          } as any).run();
          toast.success("Image added from R2 storage!", { id: toastId });
        } catch (apiErr) {
          console.warn("R2 upload fallback to base64:", apiErr);
          editor.chain().focus().setImage({
            src: base64Str,
            width: '220px',
            style: 'width: 220px; max-width: 100%; height: auto; object-fit: contain;',
          } as any).run();
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
    onSelectionUpdate: () => {
      setSelectionTick((t) => t + 1);
    },
    onTransaction: () => {
      setSelectionTick((t) => t + 1);
    },
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
      TableHeader.extend({
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
      LogoUploadNode,
      CustomImageExtension.configure({
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
      // if (Math.abs(editor.getHTML().length - content.length) > 5) {
      if (!editor.isFocused || Math.abs(editor.getHTML().length - content.length) > 5) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div
        style={{
          minHeight,
          background: "var(--editor-bg, #ffffff)",
          border: "1px solid var(--btn-border-color, #e2e8f0)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--btn-icon-color, #94a3b8)",
        }}
      >
        Loading editor...
      </div>
    );
  }

  const rawFont = editor?.getAttributes("textStyle")?.fontFamily || "";
  const primaryFont = rawFont
    ? rawFont.split(",")[0].replace(/['"]/g, "").trim()
    : "";
  const matchedFont = FONT_FAMILIES.find(
    (f) => f.value && f.value.toLowerCase() === primaryFont.toLowerCase()
  );
  const currentFontValue = matchedFont ? matchedFont.value : primaryFont;
  const fontOptions =
    currentFontValue && !FONT_FAMILIES.some((f) => f.value.toLowerCase() === currentFontValue.toLowerCase())
      ? [...FONT_FAMILIES, { value: currentFontValue, label: currentFontValue }]
      : FONT_FAMILIES;

  const rawSize = editor?.getAttributes("textStyle")?.fontSize || "";
  const currentSizeValue = rawSize;
  const sizeOptions =
    currentSizeValue && !FONT_SIZES.some((s) => s.value.toLowerCase() === currentSizeValue.toLowerCase())
      ? [...FONT_SIZES, { value: currentSizeValue, label: currentSizeValue }]
      : FONT_SIZES;

  const isTableActive = Boolean(
    editor && (
      editor.isActive("table") ||
      editor.isActive("tableCell") ||
      editor.isActive("tableHeader") ||
      editor.can().addRowAfter?.()
    )
  );

  return (
    <div
      className={className}
      style={{
        border: bordered ? "1px solid var(--editor-border, #cbd5e1)" : "none",
        borderRadius: bordered ? "10px" : "0",
        background: "var(--editor-bg, #ffffff)",
        boxShadow: bordered ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Toolbar */}
      {editable && (
        <div
          className="tiptap-toolbar"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            padding: "8px 12px",
            background: "var(--toolbar-bg, #f8fafc)",
            borderBottom: "1px solid var(--editor-border, #e2e8f0)",
            borderRadius: "0px 0px 0px 0px",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Select
            size="small"
            style={{ width: 135 }}
            popupMatchSelectWidth={false}
            value={currentFontValue || ""}
            onDropdownVisibleChange={(open) => {
              if (open && editor) {
                setSavedSelection({ from: editor.state.selection.from, to: editor.state.selection.to });
              }
            }}
            onChange={(val) => {
              if (!editor) return;
              const chain = savedSelection
                ? editor.chain().setTextSelection(savedSelection)
                : editor.chain().focus();

              if (val) {
                chain.setFontFamily(val).focus().run();
              } else {
                chain.unsetFontFamily().focus().run();
              }
            }}
            options={fontOptions}
          />

          <Select
            size="small"
            style={{ width: 80 }}
            popupMatchSelectWidth={false}
            value={currentSizeValue || ""}
            onDropdownVisibleChange={(open) => {
              if (open && editor) {
                setSavedSelection({ from: editor.state.selection.from, to: editor.state.selection.to });
              }
            }}
            onChange={(val) => {
              if (!editor) return;
              const chain = savedSelection
                ? editor.chain().setTextSelection(savedSelection)
                : editor.chain().focus();

              if (val) {
                chain.setFontSize(val).focus().run();
              } else {
                chain.unsetFontSize().focus().run();
              }
            }}
            options={sizeOptions}
          />

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("bold") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("bold") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("bold") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("italic") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("italic") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("italic") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("underline") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("underline") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("underline") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("strike") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("strike") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("strike") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("subscript") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("subscript") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("subscript") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("superscript") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("superscript") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("superscript") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("link") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("link") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("link") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
              cursor: "pointer",
            }}
            title="Link"
          >
            <LinkOutlined />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
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

          {editor.isActive("image") && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                background: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: "6px",
                padding: "2px 6px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#1d4ed8" }}>Logo/Img:</span>
              <button
                type="button"
                className="tiptap-btn-auto"
                onClick={() => {
                  const current = parseInt(editor.getAttributes("image").width || "140", 10);
                  const next = Math.max(40, (isNaN(current) ? 140 : current) - 20) + "px";
                  editor.chain().focus().updateAttributes("image", { width: next, style: `width: ${next}; max-width: 100%; height: auto; object-fit: contain;` }).run();
                }}
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #bfdbfe",
                  background: "#ffffff",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
                title="Reduce size (-20px)"
              >
                <ZoomOutOutlined style={{ fontSize: "11px" }} /> -20px
              </button>
              <button
                type="button"
                className="tiptap-btn-auto"
                onClick={() => {
                  const current = parseInt(editor.getAttributes("image").width || "140", 10);
                  const next = Math.min(800, (isNaN(current) ? 140 : current) + 20) + "px";
                  editor.chain().focus().updateAttributes("image", { width: next, style: `width: ${next}; max-width: 100%; height: auto; object-fit: contain;` }).run();
                }}
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #bfdbfe",
                  background: "#ffffff",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
                title="Enlarge size (+20px)"
              >
                <ZoomInOutlined style={{ fontSize: "11px" }} /> +20px
              </button>
              <Select
                size="small"
                style={{ width: 105 }}
                popupMatchSelectWidth={false}
                value={editor.getAttributes("image").width || "140px"}
                onChange={(val) => {
                  editor.chain().focus().updateAttributes("image", { width: val, style: `width: ${val}; max-width: 100%; height: auto; object-fit: contain;` }).run();
                }}
                options={[
                  { value: "80px", label: "XS (80px)" },
                  { value: "140px", label: "Logo (140px)" },
                  { value: "220px", label: "Med (220px)" },
                  { value: "360px", label: "Large (360px)" },
                  { value: "100%", label: "Full (100%)" },
                ]}
              />
            </div>
          )}

          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
            style={{
              width: "28px",
              height: "28px",
              padding: "0",
              border: "1px solid var(--editor-border, #cbd5e1)",
              borderRadius: "6px",
              cursor: "pointer",
              background: "var(--editor-bg, #ffffff)",
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
              border: "1px solid var(--editor-border, #cbd5e1)",
              borderRadius: "6px",
              cursor: "pointer",
              background: "var(--editor-bg, #ffffff)",
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
              borderColor: editor.isActive("heading", { level: 1 }) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("heading", { level: 1 }) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("heading", { level: 1 }) ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("heading", { level: 2 }) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("heading", { level: 2 }) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("heading", { level: 2 }) ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive("heading", { level: 3 }) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("heading", { level: 3 }) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("heading", { level: 3 }) ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive({ textAlign: "left" }) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive({ textAlign: "left" }) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive({ textAlign: "left" }) ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive({ textAlign: "center" }) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive({ textAlign: "center" }) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive({ textAlign: "center" }) ? "#3b82f6" : "var(--btn-icon-color, #475569)",
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
              borderColor: editor.isActive({ textAlign: "right" }) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive({ textAlign: "right" }) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive({ textAlign: "right" }) ? "#3b82f6" : "var(--btn-icon-color, #475569)",
              cursor: "pointer",
            }}
            title="Align Right"
          >
            <AlignRightOutlined />
          </button>

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("bulletList") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("bulletList") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("bulletList") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
              cursor: "pointer",
            }}
            title="Bullet List"
          >
            <UnorderedListOutlined />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: editor.isActive("orderedList") ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: editor.isActive("orderedList") ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: editor.isActive("orderedList") ? "#3b82f6" : "var(--btn-icon-color, #475569)",
              cursor: "pointer",
            }}
            title="Numbered List"
          >
            <OrderedListOutlined />
          </button>

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
              cursor: "pointer",
            }}
            title="Insert Table (3x3)"
          >
            <TableOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent(`<table data-layout="side-by-side" style="width: 100%; border: none !important; border-collapse: collapse; margin: 0;"><tbody><tr style="border: none !important; background: transparent !important;"><td style="width: 50%; border: none !important; padding: 4px; vertical-align: top;"><p>Enter left header details here...</p></td><td style="width: 50%; border: none !important; padding: 4px; vertical-align: top; text-align: right;"><p style="text-align: right;"><button data-type="logo-upload"></button></p></td></tr></tbody></table>`)
                .run()
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
              cursor: "pointer",
            }}
            title="Insert Side-by-Side Row (2 Columns)"
          >
            <LayoutOutlined />
          </button>

          {isTableActive && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "6px",
                padding: "2px 8px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534" }}>Table:</span>
              <button
                type="button"
                className="tiptap-btn-auto"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addRowAfter().run()}
                style={{
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "1px solid #86efac",
                  background: "#ffffff",
                  color: "#15803d",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                title="Add a new row below current cell (or press Tab in last cell)"
              >
                <InsertRowBelowOutlined /> + Add Row
              </button>
              <button
                type="button"
                className="tiptap-btn-auto"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                style={{
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "1px solid #86efac",
                  background: "#ffffff",
                  color: "#15803d",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                title="Add a new column to the right of current cell"
              >
                <InsertRowRightOutlined /> + Add Column
              </button>
              <button
                type="button"
                className="tiptap-btn-auto"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteRow().run()}
                style={{
                  padding: "3px 6px",
                  borderRadius: "4px",
                  border: "1px solid #fecaca",
                  background: "#ffffff",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
                title="Delete current row"
              >
                <DeleteRowOutlined /> - Row
              </button>
              <button
                type="button"
                className="tiptap-btn-auto"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteColumn().run()}
                style={{
                  padding: "3px 6px",
                  borderRadius: "4px",
                  border: "1px solid #fecaca",
                  background: "#ffffff",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
                title="Delete current column"
              >
                <DeleteColumnOutlined /> - Col
              </button>
            </div>
          )}

          <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addRowBefore().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Insert Row Above"
          >
            <InsertRowAboveOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Insert Row Below"
          >
            <InsertRowBelowOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "#ef4444" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Delete Row"
          >
            <DeleteRowOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Insert Column Left"
          >
            <InsertRowLeftOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Insert Column Right"
          >
            <InsertRowRightOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "#ef4444" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Delete Column"
          >
            <DeleteColumnOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!isTableActive}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: isTableActive ? "#dc2626" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Delete Entire Table"
          >
            <DeleteOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            disabled={!isTableActive}
            onClick={() => {
              if (!isTableActive) return;
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
              borderColor: isTableActive && (editor.getAttributes("table")["data-layout"] === "borderless" || editor.getAttributes("table")["data-layout"] === "side-by-side" || (editor.getAttributes("table").style && editor.getAttributes("table").style.includes("border: none"))) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: isTableActive && (editor.getAttributes("table")["data-layout"] === "borderless" || editor.getAttributes("table")["data-layout"] === "side-by-side" || (editor.getAttributes("table").style && editor.getAttributes("table").style.includes("border: none"))) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: isTableActive ? "#3b82f6" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Toggle Table Borders (Show / Hide)"
          >
            <BorderlessTableOutlined />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            disabled={!isTableActive}
            onClick={() => {
              if (!isTableActive) return;
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
              borderColor: isTableActive && ((editor.getAttributes("tableCell").style || "").includes("vertical-align: middle") || (editor.getAttributes("tableHeader").style || "").includes("vertical-align: middle")) ? "#3b82f6" : "var(--btn-border-color, #e2e8f0)",
              background: isTableActive && ((editor.getAttributes("tableCell").style || "").includes("vertical-align: middle") || (editor.getAttributes("tableHeader").style || "").includes("vertical-align: middle")) ? "var(--btn-active-bg, #eff6ff)" : "var(--btn-inactive-bg, transparent)",
              color: isTableActive ? "#3b82f6" : "var(--btn-icon-disabled, #cbd5e1)",
              cursor: isTableActive ? "pointer" : "not-allowed",
            }}
            title="Vertical Align Center"
          >
            <VerticalAlignMiddleOutlined />
          </button>



          <button
            type="button"
            onClick={() => editor.chain().focus().setPageBreak().run()}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
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
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
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
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
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
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
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
                .insertContent(`<div data-type="textbox" style="border: 1px solid var(--editor-border, #cbd5e1); padding: 12px 16px; border-radius: 6px; margin: 12px 0; background: #ffffff; display: inline-block; min-width: 250px;"><p>Enter text box content here...</p></div>`)
                .run()
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: "var(--btn-icon-color, #475569)",
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
              border: "1px solid var(--btn-border-color, #e2e8f0)",
              background: "var(--editor-bg, #ffffff)",
              color: structures.length > 0 ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
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
                border: "1px solid var(--btn-border-color, #e2e8f0)",
                background: editor.can().undo() ? "var(--btn-inactive-bg, transparent)" : "var(--btn-disabled-bg, #f1f5f9)",
                color: editor.can().undo() ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
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
                border: "1px solid var(--btn-border-color, #e2e8f0)",
                background: editor.can().redo() ? "var(--btn-inactive-bg, transparent)" : "var(--btn-disabled-bg, #f1f5f9)",
                color: editor.can().redo() ? "var(--btn-icon-color, #475569)" : "var(--btn-icon-disabled, #cbd5e1)",
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
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          background: "var(--editor-bg, #ffffff)",
          borderRadius: "0 0 10px 10px",
        }}
        className="letter-tiptap-content bg-transparent text-slate-800 dark:text-slate-200"
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
          <p style={{ marginBottom: '16px', color: 'var(--btn-icon-color, #475569)' }}>
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
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--toolbar-bg, #f8fafc)', border: '1px solid var(--btn-border-color, #e2e8f0)', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--btn-icon-color, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Preview
              </div>
              <div className="letter-tiptap-content bg-transparent text-slate-800 dark:text-slate-200" style={{ background: 'transparent' }}>
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
          color: var(--editor-text, #1e293b);
        }
        .letter-tiptap-content .ProseMirror p {
          margin-bottom: 1em;
        }
        .letter-tiptap-content .ProseMirror > *:first-child {
          margin-top: 1em !important;
        }
        .letter-tiptap-content .ProseMirror h1 {
          font-size: 1.8em;
          font-weight: 700;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          color: var(--editor-text-heading, #0f172a);
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
          color: var(--editor-text-heading, #1e293b);
        }
        .letter-tiptap-content .ProseMirror h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: var(--editor-text-heading, #334155);
        }
        .letter-tiptap-content .ProseMirror hr {
          margin-top: 4px !important;
          margin-bottom: 1em;
          border: 0;
          border-top: 1px solid var(--editor-border, #cbd5e1);
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
          border: 1px solid var(--editor-border, #cbd5e1);
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .letter-tiptap-content .ProseMirror table[data-layout="side-by-side"] td,
        .letter-tiptap-content .ProseMirror table[style*="border: none"] td,
        .letter-tiptap-content .ProseMirror table[style*="border-style: none"] td,
        .letter-tiptap-content .ProseMirror table[style*="border-width: 0"] td {
          border: 1px dashed var(--editor-border, #e2e8f0) !important;
          padding: 2px 4px !important;
          background: transparent !important;
        }
        .letter-tiptap-content .ProseMirror th {
          font-weight: 600;
          text-align: left;
          background-color: var(--editor-th-bg, #f1f5f9);
        }
        .letter-tiptap-content .ProseMirror ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          padding-left: 1.75rem !important;
          margin-top: 0.5em !important;
          margin-bottom: 1em !important;
        }
        .letter-tiptap-content .ProseMirror ul ul {
          list-style-type: circle !important;
          margin-top: 0.25em !important;
          margin-bottom: 0.25em !important;
        }
        .letter-tiptap-content .ProseMirror ul ul ul {
          list-style-type: square !important;
        }
        .letter-tiptap-content .ProseMirror ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          padding-left: 1.75rem !important;
          margin-top: 0.5em !important;
          margin-bottom: 1em !important;
        }
        .letter-tiptap-content .ProseMirror ol ol {
          list-style-type: lower-alpha !important;
          margin-top: 0.25em !important;
          margin-bottom: 0.25em !important;
        }
        .letter-tiptap-content .ProseMirror ol ol ol {
          list-style-type: lower-roman !important;
        }
        .letter-tiptap-content .ProseMirror li {
          display: list-item !important;
          margin-bottom: 0.3em !important;
          line-height: 1.6;
        }
        .letter-tiptap-content .ProseMirror li p {
          margin-top: 0 !important;
          margin-bottom: 0.25em !important;
        }
        .letter-tiptap-content .ProseMirror img {
          max-width: 100% !important;
          height: auto !important;
          object-fit: contain;
          display: inline-block;
          vertical-align: middle;
        }
        .letter-tiptap-content .ProseMirror td img,
        .letter-tiptap-content .ProseMirror th img {
          max-width: 100% !important;
          max-height: 140px !important;
          height: auto !important;
          object-fit: contain;
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

        .tiptap-toolbar button:not(.tiptap-btn-auto), .tiptap-toolbar input[type="color"] {
          width: 26px !important;
          height: 26px !important;
          min-width: 26px !important;
          min-height: 26px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }
        .tiptap-toolbar button svg, .tiptap-toolbar button .anticon {
          width: 14px !important;
          height: 14px !important;
          font-size: 14px !important;
        }
        .tiptap-toolbar button[title^="Heading"] {
          font-size: 13px !important;
          font-weight: 700 !important;
        }
      `}</style>
    </div>
  );
}
