"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input, Empty, Spin, Tooltip } from "antd";
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
    <div style={{ padding: "32px 40px 56px", maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}
        >
          Zukvo · Knowledge
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: p.text,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Documents
        </h1>
        <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
          Every document your account team has shared — agreements, SOWs,
          architecture, release notes and more.
        </div>
      </div>

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
        <Input
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<Search size={14} color={p.textFaint} />}
          placeholder="Search file name, type, or tag…"
          style={{ width: 300 }}
        />
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
            />
          ))}
        </div>
      )}
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
        background: active ? p.text : p.surfaceElevated,
        color: active ? "#ffffff" : p.textMuted,
        border: `1px solid ${active ? p.text : p.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 120ms ease",
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "1px 7px",
            borderRadius: 999,
            background: active ? "rgba(255,255,255,0.15)" : p.neutralBg,
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
}: {
  category: string;
  count: number;
  docs: PortalDocument[];
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
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
        background: p.surfaceElevated,
        border: `1px solid ${hover ? p.borderStrong : p.border}`,
        borderRadius: 12,
        transition: "border-color 120ms ease",
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
              color: p.text,
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
                color: p.textSubtle,
                fontWeight: 500,
              }}
            >
              {doc.documentType}
            </span>
            {doc.version > 1 && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 6px",
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  color: p.accentText,
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
                    background: p.neutralBg,
                    border: `1px solid ${p.neutralBorder}`,
                    color: p.neutralText,
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
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                color: p.textMuted,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <TagIcon size={9} />
              {t}
            </span>
          ))}
          {doc.tags.length > 4 && (
            <span
              style={{
                fontSize: 10.5,
                color: p.textFaint,
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
          borderTop: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            color: p.textSubtle,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Clock size={11} />
          {fmtRelative(doc.updatedAt)}
          {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Tooltip title={looksExternal ? "Open link" : "Open"}>
            <button
              onClick={() => onOpen(doc, "view")}
              style={iconButtonStyle(p)}
              aria-label="Open"
            >
              {looksExternal ? <ExternalLink size={13} /> : <Eye size={13} />}
            </button>
          </Tooltip>
          {!looksExternal && (
            <Tooltip title="Download">
              <button
                onClick={() => onOpen(doc, "download")}
                style={iconButtonStyle(p)}
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
