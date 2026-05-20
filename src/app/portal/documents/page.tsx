"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input, Empty, Spin, Tooltip, Modal, message, ConfigProvider, theme as antdTheme, Row, Col, Divider, Button, Typography } from "antd";
import { FolderOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
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
  Loader2,
  LayoutGrid,
  List as ListIcon,
  X,
} from "lucide-react";
import {
  portalDocumentService,
  PortalDocument,
  PortalDocumentMeta,
} from "@/services/portalDocumentService";

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

/* --------------------------------------------------------------- */

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
  if (
    ["json", "xml", "yml", "yaml", "ts", "js", "tsx", "jsx", "md"].includes(ext)
  )
    return { Icon: FileCode2, color: "#7c3aed" };
  return { Icon: FileText, color: p.textSubtle };
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

/* --------------------------------------------------------------- */

export default function PortalDocumentsPage() {
  const [docs, setDocs] = useState<PortalDocument[]>([]);
  const [meta, setMeta] = useState<PortalDocumentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalDocumentService.list({
        category: activeCategory === "ALL" ? undefined : activeCategory,
        search: search || undefined,
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
  }, [activeCategory]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const categoryPills = useMemo(() => {
    // When a category filter narrows the result, the response no longer
    // contains all categories. Keep the full set from the most recent
    // unfiltered fetch sticky if available.
    return meta?.categories || [];
  }, [meta]);

  const handleOpen = async (doc: PortalDocument, mode: "view" | "download") => {
    // Fire tracking, don't block the click
    portalDocumentService.track(doc.id, mode);
    if (mode === "download") {
      // Force download by creating a link with download attr.
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || "document";
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Workstation Header */}
      <div
        className="saas-header-container portal-mom-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          padding: "20px 40px 20px 40px",
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="1 1 auto" style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(37, 99, 235, 0.08))",
                    color: "#3b82f6",
                  }}
                >
                  <FolderOutlined style={{ fontSize: 18, color: "#3b82f6" }} />
                </div>
                <Title
                  level={4}
                  className="portal-mom-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Documents
                </Title>
              </div>

              <Divider
                type="vertical"
                style={{
                  height: 20,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  margin: "0 12px",
                }}
              />

              <div>
                <Text
                  className="portal-mom-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600,
                  }}
                >
                  Every document your account team has shared — and anything you upload here for them.
                </Text>
              </div>
            </div>
          </Col>

          <Col flex="0 0 auto">
            <Row gutter={8} align="middle">
              <Col>
                <button
                  onClick={() => setUploadOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Plus size={14} />
                  Add document
                </button>
              </Col>
              <Col>
                <Button
                  className="portal-mom-reload-btn"
                  icon={<ReloadOutlined />}
                  onClick={load}
                  style={{
                    height: 34,
                    width: 34,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    borderColor: "#e2e8f0",
                    color: "#64748b",
                  }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Content Container */}
      <div style={{ padding: "16px 40px 56px", width: "100%", boxSizing: "border-box" }}>

        {/* Category pills + search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <CategoryPill
              label="All"
              active={activeCategory === "ALL"}
              onClick={() => setActiveCategory("ALL")}
              count={meta?.total ?? undefined}
            />
            {categoryPills.map((cat) => {
              const count =
                meta?.groups.find((g) => g.category === cat)?.count ?? 0;
              return (
                <CategoryPill
                  key={cat}
                  label={cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  count={count}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                style={{
                  display: "inline-flex", padding: 6, borderRadius: 6, border: "none",
                  background: viewMode === "list" ? "#ffffff" : "transparent",
                  color: viewMode === "list" ? "#0f172a" : "#94a3b8",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer", transition: "all 0.2s ease"
                }}
              >
                <ListIcon size={15} />
              </button>
              <button
                onClick={() => setViewMode("card")}
                title="Card view"
                style={{
                  display: "inline-flex", padding: 6, borderRadius: 6, border: "none",
                  background: viewMode === "card" ? "#ffffff" : "transparent",
                  color: viewMode === "card" ? "#0f172a" : "#94a3b8",
                  boxShadow: viewMode === "card" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer", transition: "all 0.2s ease"
                }}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<Search size={14} color={p.textFaint} />}
              placeholder="Search file name, type, or tag…"
              style={{ width: 300 }}
            />
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 80, textAlign: "center" }}>
            <Spin />
          </div>
        ) : docs.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px dashed ${p.border}`,
              borderRadius: 12,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle, fontSize: 13 }}>
                  {search
                    ? `No documents match "${search}".`
                    : activeCategory === "ALL"
                      ? "Your team hasn't shared any documents yet."
                      : `Nothing in ${activeCategory} yet.`}
                </span>
              }
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {(meta?.groups || []).map((group) => (
              <DocGroup
                key={group.category}
                category={group.category}
                count={group.count}
                docs={group.items}
                onOpen={handleOpen}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            setUploadOpen(false);
            load();
          }}
        />
        <style jsx global>{`
        .ant-input {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
          border-radius: 8px !important;
        }
        .ant-input::placeholder {
          color: #94a3b8 !important;
        }
        .ant-input-affix-wrapper {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
        }
        .ant-input-affix-wrapper .ant-input {
          background-color: transparent !important;
          color: #0f172a !important;
        }
        .ant-input-affix-wrapper:hover, .ant-input:hover {
          border-color: #cbd5e1 !important;
        }
        .ant-input-affix-wrapper-focused, .ant-input-focused {
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
        }
        .ant-input-clear-icon {
          color: #94a3b8 !important;
        }
        .ant-input-clear-icon:hover {
          color: #64748b !important;
        }
        .portal-mom-header-container,
        [data-theme='dark'] .portal-mom-header-container,
        [data-theme='dark'] .saas-header-container.portal-mom-header-container,
        .saas-header-container.portal-mom-header-container {
          background: #ffffff !important;
          border-bottom: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
        }
        .portal-mom-header-title {
          color: #0f172a !important;
        }
        .portal-mom-header-desc {
          color: #475569 !important;
        }
        .portal-mom-reload-btn {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #475569 !important;
        }
        .portal-mom-reload-btn:hover {
          color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          background-color: #eff6ff !important;
        }
      `}</style>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function CategoryPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        background: active ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "transparent",
        color: active ? "#ffffff" : p.textMuted,
        border: active ? "1px solid #4f46e5" : "1px solid #e2e8f0",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 550,
        cursor: "pointer",
        transition: "all 120ms ease",
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "1px 7px",
            borderRadius: 999,
            background: active ? "rgba(255,255,255,0.2)" : "rgba(15, 23, 42, 0.05)",
            color: active ? "#ffffff" : p.textSubtle,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function DocGroup({
  category,
  count,
  docs,
  onOpen,
  viewMode,
}: {
  category: string;
  count: number;
  docs: PortalDocument[];
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  viewMode: "list" | "card";
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: p.text,
            margin: 0,
            letterSpacing: "-0.005em",
          }}
        >
          {category}
        </h2>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "1px 8px",
            background: p.neutralBg,
            border: `1px solid ${p.neutralBorder}`,
            borderRadius: 999,
            color: p.textSubtle,
          }}
        >
          {count}
        </span>
      </div>
      {viewMode === "card" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 10,
          }}
        >
          {docs.map((d) => (
            <DocCard key={d.id} doc={d} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(250px, 1.5fr) 150px 150px 120px 100px",
              gap: 12,
              padding: "12px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 11.5,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <div>File Name</div>
            <div>Tags</div>
            <div>Uploaded By</div>
            <div>Date</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>
          {docs.map((d, i) => (
            <DocRow key={d.id} doc={d} onOpen={onOpen} isLast={i === docs.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocRow({
  doc,
  onOpen,
  isLast,
}: {
  doc: PortalDocument;
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  isLast: boolean;
}) {
  const [hover, setHover] = useState(false);
  const { Icon, color } = iconForFile(doc.fileName);
  const looksExternal = !/r2\.dev|cloudflarestorage/.test(doc.fileUrl);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(250px, 1.5fr) 150px 150px 120px 100px",
        gap: 12,
        padding: "12px 16px",
        background: hover ? "rgba(99, 102, 241, 0.02)" : "#ffffff",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        alignItems: "center",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
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
          <Icon size={14} />
        </div>
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={doc.fileName}
          >
            {doc.fileName}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {doc.documentType} {doc.version > 1 && `· v${doc.version}`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", overflow: "hidden" }}>
        {doc.tags?.slice(0, 2).map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              padding: "2px 6px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#475569",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </span>
        ))}
        {doc.tags && doc.tags.length > 2 && (
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            +{doc.tags.length - 2}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#475569",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {doc.uploadedByName || "—"}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {fmtDate(doc.createdAt)}
      </div>

      <div style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Tooltip title={looksExternal ? "Open link" : "Open"}>
          <button
            onClick={() => onOpen(doc, "view")}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: hover ? "rgba(99, 102, 241, 0.08)" : "transparent",
              border: `1px solid ${hover ? "#bfdbfe" : "#e2e8f0"}`,
              color: hover ? "#2563eb" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            aria-label="Open"
          >
            {looksExternal ? <ExternalLink size={13} /> : <Eye size={13} />}
          </button>
        </Tooltip>
        {!looksExternal && (
          <Tooltip title="Download">
            <button
              onClick={() => onOpen(doc, "download")}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: hover ? "rgba(99, 102, 241, 0.08)" : "transparent",
                border: `1px solid ${hover ? "#bfdbfe" : "#e2e8f0"}`,
                color: hover ? "#2563eb" : "#475569",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              aria-label="Download"
            >
              <Download size={13} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function DocCard({
  doc,
  onOpen,
}: {
  doc: PortalDocument;
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
}) {
  const [hover, setHover] = useState(false);
  const { Icon, color } = iconForFile(doc.fileName);
  // If the URL doesn't look like our R2-hosted file, treat it as an external
  // reference (e.g. a Google Drive / Notion link added via the "external URL"
  // path on the staff document uploader). External links open in a new tab
  // without forcing a download.
  const looksExternal = !/r2\.dev|cloudflarestorage/.test(doc.fileUrl);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 16,
        background: hover ? "rgba(99, 102, 241, 0.02)" : "transparent",
        border: `1px solid ${hover ? "#818cf8" : "#e2e8f0"}`,
        borderRadius: 16,
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 40,
            height: 40,
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
          <Icon size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "#0f172a",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
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
              gap: 6,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              {doc.documentType}
            </span>
            {doc.version > 1 && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "1px 6px",
                  background: "rgba(99, 102, 241, 0.06)",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  color: "#4f46e5",
                  borderRadius: 999,
                }}
              >
                v{doc.version}
              </span>
            )}
            {doc.lastEvent && (
              <Tooltip
                title={`Last opened ${fmtRelative(doc.lastViewedAt)}`}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    padding: "1px 6px",
                    background: "rgba(15, 23, 42, 0.05)",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    color: "#475569",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Eye size={10} />
                  Opened
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {doc.tags && doc.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            paddingTop: 2,
          }}
        >
          {doc.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                background: "transparent",
                border: "1px solid #e2e8f0",
                color: "#475569",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <TagIcon size={9} color="#64748b" />
              {t}
            </span>
          ))}
          {doc.tags.length > 4 && (
            <span
              style={{
                fontSize: 10.5,
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              +{doc.tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            color: "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Clock size={11} color="#64748b" />
          {fmtRelative(doc.updatedAt)}
          {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Tooltip title={looksExternal ? "Open link" : "Open"}>
            <button
              onClick={() => onOpen(doc, "view")}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: hover ? "rgba(99, 102, 241, 0.08)" : "transparent",
                border: `1px solid ${hover ? "#bfdbfe" : "#e2e8f0"}`,
                color: hover ? "#2563eb" : "#475569",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              aria-label="Open"
            >
              {looksExternal ? <ExternalLink size={13} /> : <Eye size={13} />}
            </button>
          </Tooltip>
          {!looksExternal && (
            <Tooltip title="Download">
              <button
                onClick={() => onOpen(doc, "download")}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: hover ? "rgba(99, 102, 241, 0.08)" : "transparent",
                  border: `1px solid ${hover ? "#bfdbfe" : "#e2e8f0"}`,
                  color: hover ? "#2563eb" : "#475569",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                aria-label="Download"
              >
                <Download size={13} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function iconButtonStyle(palette: typeof p): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: palette.surfaceElevated,
    border: `1px solid ${palette.border}`,
    color: palette.textMuted,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 120ms ease",
  };
}

/* --------------------------------------------------------------- */

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

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
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [docType, setDocType] = useState("");
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
      if (mode === "file") {
        const base64 = await fileToDataUrl(file!);
        await portalDocumentService.upload({
          base64,
          fileName: displayName.trim() || file!.name,
          documentType: docType.trim() || undefined,
        });
      } else {
        await portalDocumentService.upload({
          externalUrl: url.trim(),
          fileName: displayName.trim() || undefined,
          documentType: docType.trim() || undefined,
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
          Modal: {
            contentBg: "#ffffff",
            headerBg: "#ffffff",
          },
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
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${p.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  color: p.accentText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileUp size={17} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: p.text,
                    lineHeight: 1.2,
                  }}
                >
                  Add a document
                </div>
                <div
                  style={{ marginTop: 3, fontSize: 12.5, color: p.textSubtle }}
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
                background: p.surfaceElevated,
                border: `1px solid ${p.border}`,
                color: p.textMuted,
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
        </div>

        {/* Mode toggle */}
        <div
          style={{
            padding: "16px 24px 0",
            display: "flex",
            gap: 8,
          }}
        >
          <ModeTab
            active={mode === "file"}
            icon={<UploadCloud size={14} />}
            label="Upload file"
            onClick={() => setMode("file")}
          />
          <ModeTab
            active={mode === "url"}
            icon={<LinkIcon size={14} />}
            label="Paste link"
            onClick={() => setMode("url")}
          />
        </div>

        {/* Body */}
        <div style={{ padding: "16px 24px 0" }}>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  style={{
                    border: `1px dashed ${dragging ? "#4f46e5" : "#e2e8f0"
                      }`,
                    borderRadius: 16,
                    background: dragging ? "rgba(99, 102, 241, 0.04)" : "transparent",
                    padding: 28,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: "rgba(99, 102, 241, 0.06)",
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                      color: "#4f46e5",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <UploadCloud size={20} />
                  </div>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 600, color: p.text }}
                  >
                    Drop a file here, or click to browse
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11.5,
                      color: p.textSubtle,
                    }}
                  >
                    Up to {fmtBytes(MAX_FILE_BYTES)} · PDF, images, docs, archives
                  </div>
                </div>
              ) : (
                <SelectedFile
                  file={file}
                  onRemove={() => {
                    setFile(null);
                    setDisplayName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
            </>
          ) : (
            <FieldBlock label="Link">
              <Input
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                prefix={<LinkIcon size={14} color={p.textFaint} />}
                size="large"
              />
            </FieldBlock>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 10,
              marginTop: 14,
            }}
          >
            <FieldBlock
              label="Display name"
              hint={mode === "file" ? "auto-filled" : "optional"}
            >
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  mode === "file" ? "Same as file" : "Friendly name for the link"
                }
                maxLength={200}
              />
            </FieldBlock>
            <FieldBlock label="Label" hint="optional">
              <Input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Brief, Reference, etc."
                maxLength={120}
              />
            </FieldBlock>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 11.5,
              color: p.textSubtle,
              lineHeight: 1.5,
            }}
          >
            Your account team will see this document under{" "}
            <span style={{ color: p.textMuted, fontWeight: 600 }}>
              Client Uploads
            </span>
            .
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 20,
            padding: "14px 24px",
            borderTop: `1px solid ${p.border}`,
            background: p.surfaceMuted,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "#475569",
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
              gap: 7,
              padding: "8px 16px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "1px solid #4f46e5",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.75 : 1,
              boxShadow: "0 4px 12px -2px rgba(99, 102, 241, 0.15)",
            }}
          >
            {submitting ? (
              <Loader2
                size={14}
                style={{ animation: "spin 0.9s linear infinite" }}
              />
            ) : (
              <Plus size={14} />
            )}
            {submitting ? "Adding…" : "Add document"}
          </button>
        </div>
        <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      </Modal>
    </ConfigProvider>
  );
}

function ModeTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        background: active ? "rgba(99, 102, 241, 0.05)" : "transparent",
        border: `1px solid ${active ? "rgba(99, 102, 241, 0.15)" : "transparent"}`,
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 600,
        color: active ? "#4f46e5" : "#64748b",
        cursor: "pointer",
        transition: "all 120ms ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: p.textMuted,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {label}
        {hint && (
          <span
            style={{
              fontSize: 11,
              color: p.textFaint,
              fontWeight: 400,
            }}
          >
            · {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SelectedFile({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const { Icon, color } = iconForFile(file.name);
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 14,
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 11,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
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
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: p.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.name}
        </div>
        <div style={{ marginTop: 2, fontSize: 11.5, color: p.textSubtle }}>
          {fmtBytes(file.size)}
        </div>
      </div>
      <button
        onClick={onRemove}
        style={{
          padding: "6px 10px",
          background: p.surfaceMuted,
          border: `1px solid ${p.border}`,
          borderRadius: 7,
          fontSize: 12,
          color: p.textMuted,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <X size={12} />
        Remove
      </button>
    </div>
  );
}
