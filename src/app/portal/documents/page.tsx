"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Input,
  Empty,
  Tooltip,
  Modal,
  message,
  ConfigProvider,
  theme as antdTheme,
  Select,
} from "antd";
import {
  Search,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileCode2,
  FileType2,
  ExternalLink,
  Eye,
  Clock,
  Tag as TagIcon,
  Plus,
  UploadCloud,
  Link as LinkIcon,
  FileUp,
  LayoutGrid,
  List as ListIcon,
  X,
  FolderOpen,
  RefreshCw,
  Users,
  Building2,
  Briefcase,
  ChevronDown,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  portalDocumentService,
  PortalDocument,
  PortalDocumentMeta,
  DocumentSource,
} from "@/services/portalDocumentService";
import { usePortalSocket } from "@/providers/PortalSocketProvider";
import { portalClient } from "@/lib/portalAxios";

/* ─────────────────────────────────────────────────────────
 * Design tokens — premium dense
 * ─────────────────────────────────────────────────────── */
const T = {
  pageBg: "#f6f7f9",
  cardBg: "#ffffff",
  border: "#e5e7eb",
  borderHover: "#cbd5e1",
  borderSoft: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#4338ca",
  accentBg: "#eef2ff",
  accentBorder: "#c7d2fe",
  numFont:
    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

const GAP = 12;
const PAGE_PAD_X = 28;
const PAGE_PAD_Y = 24;

/* ─────────────────────────────────────────────────────────
 * Formatters & helpers
 * ─────────────────────────────────────────────────────── */
function extOf(fileName: string): string {
  const m = fileName.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

function iconForFile(fileName: string) {
  const ext = extOf(fileName);
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "heic"].includes(ext))
    return { Icon: ImageIcon, color: "#0d9488" };
  if (["pdf"].includes(ext)) return { Icon: FileType2, color: "#b91c1c" };
  if (["xls", "xlsx", "csv", "ods"].includes(ext))
    return { Icon: FileSpreadsheet, color: "#047857" };
  if (["doc", "docx", "rtf", "odt"].includes(ext))
    return { Icon: FileText, color: "#1d4ed8" };
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
    return { Icon: FileArchive, color: "#7c2d12" };
  if (["json", "xml", "yml", "yaml", "ts", "js", "tsx", "jsx", "md"].includes(ext))
    return { Icon: FileCode2, color: "#7c3aed" };
  return { Icon: FileText, color: T.textSubtle };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

function isExternalLink(url: string): boolean {
  return !/r2\.dev|cloudflarestorage/.test(url);
}

/* ─────────────────────────────────────────────────────────
 * Page
 * ─────────────────────────────────────────────────────── */
export default function PortalDocumentsPage() {
  const [docs, setDocs] = useState<PortalDocument[]>([]);
  const [meta, setMeta] = useState<PortalDocumentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<DocumentSource>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [editingDoc, setEditingDoc] = useState<PortalDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<PortalDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalDocumentService.list({
        category,
        search: search || undefined,
        projectId,
        source,
      });
      setDocs(res.data);
      setMeta(res.meta);
    } catch {
      setDocs([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, projectId, source]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Real-time: staff/another portal user mutates a document → reload here.
  const { socket, connected } = usePortalSocket();
  useEffect(() => {
    if (!socket || !connected) return;
    const handler = () => load();
    socket.on("client_document:created", handler);
    socket.on("client_document:updated", handler);
    socket.on("client_document:deleted", handler);
    return () => {
      socket.off("client_document:created", handler);
      socket.off("client_document:updated", handler);
      socket.off("client_document:deleted", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected]);

  const handleOpen = async (
    doc: PortalDocument,
    mode: "view" | "download",
  ) => {
    portalDocumentService.track(doc.id, mode);
    if (mode === "download") {
      const external = isExternalLink(doc.fileUrl);
      if (external) {
        window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }

      try {
        message.loading({ content: "Downloading file...", key: "portal-doc-download", duration: 0 });

        const response = await portalClient.get(
          `/api/client-portal/documents/${doc.id}/download`,
          { responseType: "blob" }
        );

        const blob = new Blob([response.data], { type: response.headers["content-type"]?.toString() });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", doc.fileName || "document");
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);

        message.success({ content: "Downloaded successfully", key: "portal-doc-download" });
      } catch (err) {
        message.error({ content: "Failed to download", key: "portal-doc-download" });
        window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setDeleting(true);
    try {
      await portalDocumentService.remove(deletingDoc.id);
      message.success("Document removed");
      setDeletingDoc(null);
      load();
    } catch (err: any) {
      message.error(err?.message || "Could not remove document");
    } finally {
      setDeleting(false);
    }
  };

  const sourceCounts = meta?.sourceCounts || {
    all: docs.length,
    client: 0,
    internal: 0,
  };

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = docs.filter(
      (d) => new Date(d.createdAt) >= startOfMonth,
    ).length;
    const categoriesCount = new Set(docs.map((d) => d.category).filter(Boolean))
      .size;
    return {
      total: sourceCounts.all,
      client: sourceCounts.client,
      internal: sourceCounts.internal,
      thisMonth,
      categories: categoriesCount,
    };
  }, [docs, sourceCounts]);

  return (
    <div
      style={{
        background: T.pageBg,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        className="portal-docs-inner"
        style={{
          padding: `${PAGE_PAD_Y}px ${PAGE_PAD_X}px ${PAGE_PAD_Y + 8}px`,
          maxWidth: 1480,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: GAP,
        }}
      >
        <style>{`
          @media (max-width: 768px) {
            .portal-docs-inner { padding: 16px 16px 24px !important; }
          }
          @media (max-width: 480px) {
            .portal-docs-inner { padding: 12px 12px 20px !important; }
          }
        `}</style>
        {/* Hero with stats + actions */}
        <Hero
          stats={stats}
          loading={loading}
          onReload={load}
          onUpload={() => setUploadOpen(true)}
        />

        {/* Source tabs — prominent above the filter row */}
        <SourceTabs source={source} setSource={setSource} counts={sourceCounts} />

        {/* Filter bar */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          projectId={projectId}
          setProjectId={setProjectId}
          projects={meta?.projects ?? []}
          category={category}
          setCategory={setCategory}
          categories={meta?.categories ?? []}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 80,
              textAlign: "center",
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
            }}
          >
            <ZukvoLoader size="md" />
          </div>
        ) : docs.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: T.cardBg,
              border: `1px dashed ${T.border}`,
              borderRadius: 12,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: T.textSubtle, fontSize: 13 }}>
                  {search
                    ? `No documents match "${search}".`
                    : source === "client"
                      ? "You haven't uploaded any documents yet."
                      : source === "internal"
                        ? "Your account team hasn't shared any documents yet."
                        : "No documents yet."}
                </span>
              }
            />
          </div>
        ) : viewMode === "list" ? (
          <DocumentsTable
            docs={docs}
            onOpen={handleOpen}
            onEdit={(d) => setEditingDoc(d)}
            onDelete={(d) => setDeletingDoc(d)}
          />
        ) : (
          <DocumentsGrid
            docs={docs}
            onOpen={handleOpen}
            onEdit={(d) => setEditingDoc(d)}
            onDelete={(d) => setDeletingDoc(d)}
          />
        )}

        <UploadModal
          open={uploadOpen}
          projects={meta?.projects ?? []}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            setUploadOpen(false);
            load();
          }}
        />

        <EditDocumentModal
          doc={editingDoc}
          projects={meta?.projects ?? []}
          onClose={() => setEditingDoc(null)}
          onSaved={() => {
            setEditingDoc(null);
            load();
          }}
        />

        <Modal
          open={!!deletingDoc}
          onCancel={() => setDeletingDoc(null)}
          onOk={handleDelete}
          okText="Delete"
          okButtonProps={{ danger: true, loading: deleting }}
          cancelButtonProps={{ disabled: deleting }}
          title="Delete this document?"
          centered
          width={420}
        >
          <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
            <strong style={{ color: T.text }}>
              {deletingDoc?.fileName || "This document"}
            </strong>{" "}
            will be permanently removed from the portal and storage. This can't
            be undone.
          </p>
        </Modal>
      </div>

      <style>{`
        .portal-docs-page .ant-select:not(.ant-select-customize-input)
          .ant-select-selector {
          background: ${T.cardBg} !important;
          border: 1px solid ${T.border} !important;
          color: ${T.text} !important;
          border-radius: 8px !important;
          height: 34px !important;
        }
        .portal-docs-page .ant-select .ant-select-selection-placeholder,
        .portal-docs-page .ant-select .ant-select-selection-item {
          line-height: 32px !important;
        }
        .portal-docs-page .ant-input,
        .portal-docs-page .ant-input-affix-wrapper {
          background: ${T.cardBg} !important;
          color: ${T.text} !important;
          border-color: ${T.border} !important;
          border-radius: 8px !important;
        }
        .portal-docs-page .ant-input::placeholder,
        .portal-docs-page .ant-input-affix-wrapper .ant-input::placeholder {
          color: ${T.textFaint} !important;
        }
        .portal-docs-page .ant-input-clear-icon {
          color: ${T.textFaint} !important;
        }
        /* Project filter — prominent */
        .portal-docs-project-select.ant-select .ant-select-selector {
          border: 1px solid ${T.border} !important;
        }
        .portal-docs-project-select.is-active.ant-select .ant-select-selector {
          background: ${T.accentBg} !important;
          border-color: ${T.accentBorder} !important;
        }
        /* Popup — force light theme */
        html body .portal-docs-popup,
        html[data-theme='dark'] body .portal-docs-popup,
        [data-theme='dark'] .portal-docs-popup {
          background: ${T.cardBg} !important;
          border: 1px solid ${T.border} !important;
          padding: 4px !important;
        }
        html body .portal-docs-popup .ant-select-item,
        html[data-theme='dark'] body .portal-docs-popup .ant-select-item,
        [data-theme='dark'] .portal-docs-popup .ant-select-item {
          color: ${T.text} !important;
          background: transparent !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          margin: 1px 0 !important;
        }
        html body .portal-docs-popup .ant-select-item-option-active,
        html[data-theme='dark'] body .portal-docs-popup .ant-select-item-option-active {
          background: ${T.borderSoft} !important;
        }
        html body .portal-docs-popup .ant-select-item-option-selected,
        html[data-theme='dark'] body .portal-docs-popup .ant-select-item-option-selected {
          background: ${T.accentBg} !important;
        }
        /* Table */
        .docs-table {
          width: 100%;
          border-collapse: collapse;
        }
        .docs-table thead th {
          padding: 10px 16px;
          font-size: 10.5px;
          font-weight: 600;
          color: ${T.textSubtle};
          letter-spacing: 0.07em;
          text-transform: uppercase;
          background: #fafbfc;
          border-bottom: 1px solid ${T.borderSoft};
          text-align: left;
          white-space: nowrap;
        }
        .docs-table tbody td {
          padding: 11px 16px;
          font-size: 12.5px;
          color: ${T.text};
          border-bottom: 1px solid ${T.borderSoft};
          vertical-align: middle;
        }
        .docs-table tbody tr {
          transition: background 120ms ease;
        }
        .docs-table tbody tr:hover {
          background: #f8fafc;
        }
        .docs-table tbody tr:hover .docs-row-name {
          color: ${T.accent};
        }
        .docs-table tbody tr:last-child td {
          border-bottom: none;
        }
        .ant-empty-img-simple path,
        .ant-empty-image svg path {
          fill: #f8fafc !important;
          stroke: ${T.borderHover} !important;
        }
        .ant-empty-img-simple ellipse,
        .ant-empty-image svg ellipse {
          fill: #e2e8f0 !important;
          stroke: ${T.borderHover} !important;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Hero with stats + actions
 * ─────────────────────────────────────────────────────── */
const Hero: React.FC<{
  stats: { total: number; client: number; internal: number; thisMonth: number; categories: number };
  loading: boolean;
  onReload: () => void;
  onUpload: () => void;
}> = ({ stats, loading, onReload, onUpload }) => (
  <div
    className="portal-docs-page portal-docs-hero"
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      position: "relative",
      overflow: "hidden",
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: "linear-gradient(180deg, #4338ca 0%, #0d9488 100%)",
      }}
    />
    {/* Title + description */}
    <div
      className="portal-docs-hero-title-row"
      style={{
        minWidth: 0,
        flex: "1 1 200px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: T.accentBg,
          color: T.accent,
          border: `1px solid ${T.accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FolderOpen size={19} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.022em",
            lineHeight: 1.2,
          }}
        >
          Documents
        </div>
        <div
          className="portal-docs-hero-desc"
          style={{
            fontSize: 12,
            color: T.textSubtle,
            marginTop: 3,
            fontWeight: 500,
          }}
        >
          Every document your account team has shared — and anything you upload here for them.
        </div>
      </div>
    </div>

    {/* Stats + actions */}
    <div
      className="portal-docs-hero-right"
      style={{
        display: "flex",
        gap: 6,
        flexShrink: 0,
        alignItems: "stretch",
        flexWrap: "wrap",
      }}
    >
      {/* Stat cards */}
      <div
        className="portal-docs-stat-cards"
        style={{
          display: "flex",
          gap: 6,
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Total", value: stats.total, accent: "#4338ca" },
          { label: "Categories", value: stats.categories, accent: "#0d9488" },
          { label: "This month", value: stats.thisMonth, accent: "#7c3aed" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "8px 12px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              background: "#fafbfc",
              minWidth: 72,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: T.textSubtle,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: s.accent,
                marginTop: 2,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div
        className="portal-docs-hero-actions"
        style={{ display: "flex", gap: 6, alignItems: "stretch" }}
      >
        <button
          type="button"
          onClick={onUpload}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "0 14px",
            height: 38,
            background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
            color: "#ffffff",
            border: "1px solid #3730a3",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add document
        </button>
        <button
          type="button"
          onClick={onReload}
          aria-label="Reload"
          style={{
            height: 38,
            minWidth: 38,
            background: T.cardBg,
            border: `1px solid ${T.border}`,
            color: T.textMuted,
            borderRadius: 8,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: loading ? "portal-docs-spin 1s linear infinite" : undefined,
            }}
          />
        </button>
      </div>
    </div>
    <style>{`
      @keyframes portal-docs-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      /* ── Responsive: tablet (≤ 768px) ── */
      @media (max-width: 768px) {
        .portal-docs-hero {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 12px !important;
          padding: 14px 16px !important;
        }
        .portal-docs-hero-title-row {
          flex: 1 1 auto !important;
        }
        .portal-docs-hero-desc {
          white-space: normal !important;
        }
        .portal-docs-hero-right {
          flex-wrap: wrap !important;
          width: 100% !important;
          justify-content: space-between !important;
        }
        .portal-docs-stat-cards {
          flex: 1 1 auto !important;
          justify-content: flex-start !important;
        }
        .portal-docs-hero-actions {
          flex-shrink: 0 !important;
          align-self: flex-end !important;
        }
      }
      /* ── Responsive: mobile (≤ 480px) ── */
      @media (max-width: 480px) {
        .portal-docs-hero {
          padding: 12px 14px !important;
          gap: 10px !important;
        }
        .portal-docs-hero-right {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 8px !important;
        }
        .portal-docs-stat-cards {
          width: 100% !important;
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 6px !important;
        }
        .portal-docs-hero-actions {
          width: 100% !important;
          display: flex !important;
          gap: 6px !important;
          align-self: auto !important;
        }
        .portal-docs-hero-actions button:first-child {
          flex: 1 !important;
          justify-content: center !important;
        }
      }
    `}</style>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Source segmented tabs
 * ─────────────────────────────────────────────────────── */
const SourceTabs: React.FC<{
  source: DocumentSource;
  setSource: (s: DocumentSource) => void;
  counts: { all: number; client: number; internal: number };
}> = ({ source, setSource, counts }) => {
  const tabs: {
    key: DocumentSource;
    label: string;
    sub: string;
    icon: any;
    accent: string;
    accentBg: string;
    accentBorder: string;
    count: number;
  }[] = [
    {
      key: "all",
      label: "All documents",
      sub: "Everything shared",
      icon: FolderOpen,
      accent: "#4338ca",
      accentBg: "#eef2ff",
      accentBorder: "#c7d2fe",
      count: counts.all,
    },
    {
      key: "internal",
      label: "From Zukvo",
      sub: "Shared by your account team",
      icon: Briefcase,
      accent: "#0d9488",
      accentBg: "#ccfbf1",
      accentBorder: "#99f6e4",
      count: counts.internal,
    },
    {
      key: "client",
      label: "From your team",
      sub: "Uploaded via the portal",
      icon: Users,
      accent: "#7c3aed",
      accentBg: "#f5f3ff",
      accentBorder: "#ddd6fe",
      count: counts.client,
    },
  ];

  return (
    <>
      <div
        className="portal-docs-source-tabs"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: GAP,
        }}
      >
        {tabs.map((tab) => {
          const active = source === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSource(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: active ? tab.accentBg : T.cardBg,
                border: `1px solid ${active ? tab.accent : T.border}`,
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 150ms ease",
                minHeight: 64,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: tab.accentBg,
                  border: `1px solid ${tab.accentBorder}`,
                  color: tab.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} strokeWidth={2.3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: active ? tab.accent : T.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {tab.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.textSubtle,
                    marginTop: 1,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.sub}
                </div>
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: active ? tab.accent : T.text,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                  flexShrink: 0,
                }}
              >
                {tab.count}
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .portal-docs-source-tabs {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .portal-docs-source-tabs button {
            min-height: 52px !important;
            padding: 10px 14px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .portal-docs-source-tabs {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
};

/* ─────────────────────────────────────────────────────────
 * Filter bar

 * ─────────────────────────────────────────────────────── */
const FilterBar: React.FC<{
  search: string;
  setSearch: (v: string) => void;
  projectId: string | undefined;
  setProjectId: (v: string | undefined) => void;
  projects: { id: string; name: string; code: string | null }[];
  category: string | undefined;
  setCategory: (v: string | undefined) => void;
  categories: string[];
  viewMode: "list" | "card";
  setViewMode: (v: "list" | "card") => void;
}> = ({
  search,
  setSearch,
  projectId,
  setProjectId,
  projects,
  category,
  setCategory,
  categories,
  viewMode,
  setViewMode,
}) => (
  <div
    className="portal-docs-page portal-docs-filterbar"
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "10px 12px",
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >
    <style>{`
      @media (max-width: 640px) {
        .portal-docs-filterbar { padding: 10px !important; gap: 8px !important; }
        .portal-docs-filterbar .ant-select { width: 100% !important; }
        .portal-docs-filterbar .ant-input-affix-wrapper { min-width: 0 !important; width: 100% !important; }
        .portal-docs-filterbar > div:last-child { margin-left: auto; }
      }
    `}</style>
    {/* Project filter */}
    <Select
      className={`portal-docs-project-select${projectId ? " is-active" : ""}`}
      popupClassName="portal-docs-popup"
      allowClear
      placeholder={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: T.textSubtle,
            fontWeight: 500,
          }}
        >
          <FolderOpen size={14} />
          {projects.length === 0
            ? "No projects yet"
            : `All projects · ${projects.length}`}
        </span>
      }
      value={projectId}
      onChange={(v) => setProjectId(v as string | undefined)}
      style={{ width: 240 }}
      options={projects.map((proj) => ({
        value: proj.id,
        label: proj.name,
        code: proj.code,
      }))}
      optionRender={(option) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FolderOpen size={13} color={T.textSubtle} />
          <span style={{ fontWeight: 600, color: T.text }}>
            {String(option.label)}
          </span>
          {(option.data as any)?.code && (
            <span
              style={{
                marginLeft: "auto",
                fontFamily: T.numFont,
                fontSize: 11,
                color: T.textFaint,
              }}
            >
              {(option.data as any).code}
            </span>
          )}
        </div>
      )}
      labelRender={(label) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: T.accent,
            fontWeight: 600,
          }}
        >
          <FolderOpen size={14} />
          {String(label.label ?? "")}
        </span>
      )}
    />

    {/* Category filter */}
    <Select
      popupClassName="portal-docs-popup"
      allowClear
      placeholder={
        <span style={{ color: T.textSubtle, fontWeight: 500 }}>
          All categories
        </span>
      }
      value={category}
      onChange={(v) => setCategory(v as string | undefined)}
      style={{ width: 180 }}
      options={categories.map((c) => ({ value: c, label: c }))}
    />

    <Input
      allowClear
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      prefix={<Search size={14} color={T.textSubtle} />}
      placeholder="Search file name, type, or tag…"
      style={{
        flex: 1,
        minWidth: 240,
        height: 34,
      }}
    />

    <div
      style={{
        display: "inline-flex",
        background: T.borderSoft,
        padding: 3,
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        height: 34,
        boxSizing: "border-box",
        alignItems: "center",
      }}
    >
      {[
        { mode: "list" as const, icon: <ListIcon size={13} />, label: "List" },
        {
          mode: "card" as const,
          icon: <LayoutGrid size={13} />,
          label: "Cards",
        },
      ].map(({ mode, icon, label }) => {
        const active = viewMode === mode;
        return (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "0 10px",
              height: 26,
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 5,
              border: active ? `1px solid ${T.border}` : "1px solid transparent",
              cursor: "pointer",
              background: active ? T.cardBg : "transparent",
              color: active ? T.text : T.textSubtle,
              transition: "background 120ms ease, color 120ms ease",
            }}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Single flat table
 * ─────────────────────────────────────────────────────── */
const DocumentsTable: React.FC<{
  docs: PortalDocument[];
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  onEdit: (doc: PortalDocument) => void;
  onDelete: (doc: PortalDocument) => void;
}> = ({ docs, onOpen, onEdit, onDelete }) => (
  <div
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
    }}
  >
    <div style={{ overflowX: "auto" }}>
      <table className="docs-table">
        <thead>
          <tr>
            <th style={{ minWidth: 280 }}>File</th>
            <th style={{ width: 140 }}>Category</th>
            <th style={{ width: 140 }}>Project</th>
            <th style={{ width: 110 }}>Source</th>
            <th style={{ width: 160 }}>Uploaded by</th>
            <th style={{ width: 110 }}>Date</th>
            <th style={{ width: 100, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const { Icon, color } = iconForFile(doc.fileName);
            const looksExternal = isExternalLink(doc.fileUrl);
            return (
              <tr key={doc.id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: `${color}14`,
                        color,
                        border: `1px solid ${color}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div
                        className="docs-row-name"
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: T.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          letterSpacing: "-0.005em",
                          transition: "color 120ms ease",
                        }}
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: T.textSubtle,
                          marginTop: 1,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{doc.documentType}</span>
                        {doc.version > 1 && (
                          <span
                            style={{
                              fontFamily: T.numFont,
                              padding: "1px 5px",
                              background: T.accentBg,
                              border: `1px solid ${T.accentBorder}`,
                              borderRadius: 4,
                              color: T.accent,
                              fontWeight: 600,
                              fontSize: 10,
                            }}
                          >
                            v{doc.version}
                          </span>
                        )}
                        {doc.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 10,
                              padding: "1px 5px",
                              background: T.borderSoft,
                              border: `1px solid ${T.border}`,
                              color: T.textMuted,
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                        {doc.tags && doc.tags.length > 2 && (
                          <span style={{ fontSize: 10, color: T.textFaint }}>
                            +{doc.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {doc.category ? (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        background: T.borderSoft,
                        border: `1px solid ${T.border}`,
                        color: T.textMuted,
                        borderRadius: 6,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.category}
                    </span>
                  ) : (
                    <span style={{ color: T.textFaint }}>—</span>
                  )}
                </td>
                <td>
                  {doc.projectName ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        maxWidth: 130,
                        background: T.accentBg,
                        border: `1px solid ${T.accentBorder}`,
                        color: T.accent,
                        padding: "2px 7px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={doc.projectName}
                    >
                      <FolderOpen size={10} />
                      {doc.projectName}
                    </span>
                  ) : (
                    <span style={{ color: T.textFaint }}>—</span>
                  )}
                </td>
                <td>
                  <SourcePill uploadedByPortal={!!doc.uploadedByPortal} />
                </td>
                <td>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.text,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.uploadedByName || "—"}
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.textMuted,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                    title={fmtDate(doc.createdAt)}
                  >
                    {fmtRelative(doc.createdAt)}
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Tooltip title={looksExternal ? "Open link" : "Open"}>
                      <button
                        onClick={() => onOpen(doc, "view")}
                        style={iconBtn(false)}
                        aria-label="Open"
                      >
                        {looksExternal ? (
                          <ExternalLink size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    </Tooltip>
                    {!looksExternal && (
                      <Tooltip title="Download">
                        <button
                          onClick={() => onOpen(doc, "download")}
                          style={iconBtn(false)}
                          aria-label="Download"
                        >
                          <Download size={12} />
                        </button>
                      </Tooltip>
                    )}
                    {doc.uploadedByPortal && (
                      <>
                        <Tooltip title="Edit details">
                          <button
                            onClick={() => onEdit(doc)}
                            style={iconBtn(false)}
                            aria-label="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <button
                            onClick={() => onDelete(doc)}
                            style={{
                              ...iconBtn(false),
                              color: "#b91c1c",
                              borderColor: "#fecaca",
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const iconBtn = (hover: boolean): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: 7,
  background: hover ? T.accentBg : T.cardBg,
  border: `1px solid ${hover ? T.accentBorder : T.border}`,
  color: hover ? T.accent : T.textMuted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 120ms ease",
});

const SourcePill: React.FC<{ uploadedByPortal: boolean }> = ({
  uploadedByPortal,
}) => {
  if (uploadedByPortal) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10.5,
          fontWeight: 700,
          padding: "1.5px 7px",
          background: "#f5f3ff",
          border: "1px solid #ddd6fe",
          color: "#6d28d9",
          borderRadius: 999,
        }}
      >
        <Users size={10} />
        Client
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        padding: "1.5px 7px",
        background: "#ccfbf1",
        border: "1px solid #99f6e4",
        color: "#0d9488",
        borderRadius: 999,
      }}
    >
      <Briefcase size={10} />
      Zukvo
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
 * Grid view
 * ─────────────────────────────────────────────────────── */
const DocumentsGrid: React.FC<{
  docs: PortalDocument[];
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  onEdit: (doc: PortalDocument) => void;
  onDelete: (doc: PortalDocument) => void;
}> = ({ docs, onOpen, onEdit, onDelete }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: GAP,
    }}
  >
    {docs.map((doc) => (
      <DocCard
        key={doc.id}
        doc={doc}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </div>
);

const DocCard: React.FC<{
  doc: PortalDocument;
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  onEdit: (doc: PortalDocument) => void;
  onDelete: (doc: PortalDocument) => void;
}> = ({ doc, onOpen, onEdit, onDelete }) => {
  const [hover, setHover] = useState(false);
  const { Icon, color } = iconForFile(doc.fileName);
  const looksExternal = isExternalLink(doc.fileUrl);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 14,
        background: T.cardBg,
        border: `1px solid ${hover ? T.borderHover : T.border}`,
        borderRadius: 12,
        transition: "border-color 150ms ease, transform 150ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 178,
      }}
    >
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: `${color}14`,
            color,
            border: `1px solid ${color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: hover ? T.accent : T.text,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              transition: "color 150ms ease",
            }}
            title={doc.fileName}
          >
            {doc.fileName}
          </div>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: T.textSubtle, fontWeight: 500 }}>
              {doc.documentType}
            </span>
            {doc.version > 1 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  background: T.accentBg,
                  border: `1px solid ${T.accentBorder}`,
                  color: T.accent,
                  borderRadius: 999,
                  fontFamily: T.numFont,
                }}
              >
                v{doc.version}
              </span>
            )}
          </div>
        </div>
        <SourcePill uploadedByPortal={!!doc.uploadedByPortal} />
      </div>

      {(doc.category || doc.projectName) && (
        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {doc.category && (
            <span
              style={{
                fontSize: 10.5,
                padding: "1.5px 7px",
                background: T.borderSoft,
                border: `1px solid ${T.border}`,
                color: T.textMuted,
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              {doc.category}
            </span>
          )}
          {doc.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10.5,
                padding: "1.5px 7px",
                background: T.accentBg,
                border: `1px solid ${T.accentBorder}`,
                color: T.accent,
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              <FolderOpen size={10} />
              {doc.projectName}
            </span>
          )}
        </div>
      )}

      {doc.tags && doc.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {doc.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "1px 6px",
                background: "transparent",
                border: `1px solid ${T.border}`,
                color: T.textMuted,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <TagIcon size={9} color={T.textSubtle} />
              {t}
            </span>
          ))}
          {doc.tags.length > 4 && (
            <span style={{ fontSize: 10, color: T.textFaint, fontWeight: 500 }}>
              +{doc.tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          borderTop: `1px solid ${T.borderSoft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: T.textSubtle,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          <Clock size={10} />
          {fmtRelative(doc.createdAt)}
          {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <Tooltip title={looksExternal ? "Open link" : "Open"}>
            <button
              onClick={() => onOpen(doc, "view")}
              style={iconBtn(hover)}
              aria-label="Open"
            >
              {looksExternal ? <ExternalLink size={12} /> : <Eye size={12} />}
            </button>
          </Tooltip>
          {!looksExternal && (
            <Tooltip title="Download">
              <button
                onClick={() => onOpen(doc, "download")}
                style={iconBtn(hover)}
                aria-label="Download"
              >
                <Download size={12} />
              </button>
            </Tooltip>
          )}
          {doc.uploadedByPortal && (
            <>
              <Tooltip title="Edit details">
                <button
                  onClick={() => onEdit(doc)}
                  style={iconBtn(hover)}
                  aria-label="Edit"
                >
                  <Pencil size={12} />
                </button>
              </Tooltip>
              <Tooltip title="Delete">
                <button
                  onClick={() => onDelete(doc)}
                  style={{
                    ...iconBtn(hover),
                    color: "#b91c1c",
                    borderColor: "#fecaca",
                  }}
                  aria-label="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
 * Upload modal
 * ─────────────────────────────────────────────────────── */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function UploadModal({
  open,
  projects,
  onClose,
  onUploaded,
}: {
  open: boolean;
  projects: { id: string; name: string; code: string | null }[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [docType, setDocType] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("file");
      setFile(null);
      setDragging(false);
      setUrl("");
      setDisplayName("");
      setDocType("");
      setProjectId(undefined);
      setSubmitting(false);
    }
  }, [open]);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      message.error(`File is too large. Max ${fmtBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    setFile(f);
    if (!displayName) setDisplayName(f.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const submit = async () => {
    if (mode === "file") {
      if (!file) {
        message.warning("Pick a file to upload");
        return;
      }
    } else {
      if (!url.trim()) {
        message.warning("Paste a link");
        return;
      }
      try {
        // eslint-disable-next-line no-new
        new URL(url.trim());
      } catch {
        message.error("That doesn't look like a valid URL");
        return;
      }
    }
    setSubmitting(true);
    try {
      const common = {
        documentType: docType.trim() || undefined,
        projectId: projectId || null,
      };
      if (mode === "file") {
        const base64 = await fileToDataUrl(file!);
        await portalDocumentService.upload({
          ...common,
          base64,
          fileName: displayName.trim() || file!.name,
        });
      } else {
        await portalDocumentService.upload({
          ...common,
          externalUrl: url.trim(),
          fileName: displayName.trim() || undefined,
        });
      }
      message.success("Document added");
      onUploaded();
    } catch (err: any) {
      message.error(err?.message || "Failed to add document");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        components: {
          Modal: { contentBg: "#ffffff", headerBg: "#ffffff" },
          Input: {
            colorBgContainer: "#ffffff",
            colorText: "#0f172a",
            colorTextPlaceholder: "#94a3b8",
            colorBorder: "#e2e8f0",
          },
        },
      }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={560}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: T.accentBg,
                border: `1px solid ${T.accentBorder}`,
                color: T.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileUp size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.text,
                  letterSpacing: "-0.015em",
                }}
              >
                Add a document
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: T.textSubtle,
                  fontWeight: 500,
                }}
              >
                Upload a file, or paste a link to one stored elsewhere.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "14px 22px 0", display: "flex", gap: 6 }}>
          <ModeTab
            active={mode === "file"}
            icon={<UploadCloud size={13} />}
            label="Upload file"
            onClick={() => setMode("file")}
          />
          <ModeTab
            active={mode === "url"}
            icon={<LinkIcon size={13} />}
            label="Paste link"
            onClick={() => setMode("url")}
          />
        </div>

        {/* Body */}
        <div style={{ padding: "14px 22px 0" }}>
          {mode === "file" ? (
            <>
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: "32px 20px",
                    border: `1.5px dashed ${dragging ? T.accent : T.border}`,
                    borderRadius: 12,
                    background: dragging ? T.accentBg : "#fafbfc",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  <UploadCloud
                    size={26}
                    color={dragging ? T.accent : T.textSubtle}
                    style={{ marginBottom: 8 }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                      marginBottom: 4,
                    }}
                  >
                    Drop a file or click to browse
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textSubtle, fontWeight: 500 }}>
                    Up to {fmtBytes(MAX_FILE_BYTES)}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#fafbfc",
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: T.accentBg,
                      color: T.accent,
                      border: `1px solid ${T.accentBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.textSubtle, fontWeight: 500 }}>
                      {fmtBytes(file.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: T.cardBg,
                      border: `1px solid ${T.border}`,
                      color: T.textMuted,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Remove file"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
            </>
          ) : (
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/…"
              prefix={<LinkIcon size={13} color={T.textSubtle} />}
              style={{ height: 38 }}
            />
          )}

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <FieldLabel label="Display name">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  mode === "file" ? file?.name || "Document name" : "Optional"
                }
                style={{ height: 34 }}
              />
            </FieldLabel>
            <FieldLabel label="Document type">
              <Input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="e.g. Attachment, Report, NDA"
                style={{ height: 34 }}
              />
            </FieldLabel>
            <FieldLabel label="Project (optional)">
              <Select
                popupClassName="portal-docs-popup"
                allowClear
                placeholder="Link to a project"
                value={projectId}
                onChange={(v) => setProjectId(v as string | undefined)}
                style={{ width: "100%", height: 34 }}
                options={projects.map((proj) => ({
                  value: proj.id,
                  label: proj.name,
                  code: proj.code,
                }))}
              />
            </FieldLabel>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px 16px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "8px 14px",
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: submitting
                ? T.borderHover
                : "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
              border: "1px solid #3730a3",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Adding…" : "Add document"}
            {!submitting && <ArrowUpRight size={13} />}
          </button>
        </div>
      </Modal>
    </ConfigProvider>
  );
}

const ModeTab: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 11px",
      borderRadius: 8,
      border: `1px solid ${active ? T.accentBorder : T.border}`,
      background: active ? T.accentBg : T.cardBg,
      color: active ? T.accent : T.textMuted,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 120ms ease",
    }}
  >
    {icon}
    {label}
  </button>
);

const FieldLabel: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: T.textSubtle,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Edit modal — metadata-only (file is not replaced)
 * ─────────────────────────────────────────────────────── */
function EditDocumentModal({
  doc,
  projects,
  onClose,
  onSaved,
}: {
  doc: PortalDocument | null;
  projects: { id: string; name: string; code: string | null }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [docType, setDocType] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doc) {
      setFileName(doc.fileName || "");
      setCategory(doc.category || "");
      setDocType(doc.documentType || "");
      setProjectId(doc.projectId || undefined);
    }
  }, [doc]);

  const handleSave = async () => {
    if (!doc) return;
    if (!fileName.trim()) {
      message.warning("Display name is required");
      return;
    }
    setSaving(true);
    try {
      await portalDocumentService.update(doc.id, {
        fileName: fileName.trim(),
        category: category.trim() || undefined,
        documentType: docType.trim() || undefined,
        projectId: projectId ?? null,
      });
      message.success("Document updated");
      onSaved();
    } catch (err: any) {
      message.error(err?.message || "Could not update document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        components: {
          Modal: { contentBg: "#ffffff", headerBg: "#ffffff" },
          Input: {
            colorBgContainer: "#ffffff",
            colorText: "#0f172a",
            colorTextPlaceholder: "#94a3b8",
            colorBorder: "#e2e8f0",
          },
        },
      }}
    >
      <Modal
        open={!!doc}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={520}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: T.accentBg,
              border: `1px solid ${T.accentBorder}`,
              color: T.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Pencil size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: T.text,
                letterSpacing: "-0.015em",
              }}
            >
              Edit document
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: T.textSubtle,
                fontWeight: 500,
              }}
            >
              Update name and classification. The file itself isn't replaced.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: "16px 22px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
          <FieldLabel label="Display name">
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Document name"
              style={{ height: 34 }}
            />
          </FieldLabel>
          <FieldLabel label="Category">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Client Uploads, Specs"
              style={{ height: 34 }}
            />
          </FieldLabel>
          <FieldLabel label="Document type">
            <Input
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. Attachment, Report"
              style={{ height: 34 }}
            />
          </FieldLabel>
          <FieldLabel label="Project (optional)">
            <Select
              popupClassName="portal-docs-popup"
              allowClear
              placeholder="Link to a project"
              value={projectId}
              onChange={(v) => setProjectId(v as string | undefined)}
              style={{ width: "100%", height: 34 }}
              options={projects.map((proj) => ({
                value: proj.id,
                label: proj.name,
                code: proj.code,
              }))}
            />
          </FieldLabel>
        </div>

        <div
          style={{
            padding: "14px 22px 16px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 14px",
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 14px",
              background: saving
                ? T.borderHover
                : "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
              border: "1px solid #3730a3",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
