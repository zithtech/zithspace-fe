"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Input,
  Empty,
  Pagination,
  DatePicker,
  Modal,
  message,
  notification,
  Typography,
  Button,
  Space,
  Tooltip,
  Tag,
  ConfigProvider,
  theme as antdTheme,
  Select,
} from "antd";
import {
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import {
  FolderOpen,
  Search,
  Calendar,
  Users,
  Briefcase,
  Clock,
  Plus,
  UploadCloud,
  Link as LinkIcon,
  FileUp,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileCode2,
  FileType2,
  ExternalLink,
  Eye,
  Download,
  Pencil,
  Trash2,
  List as ListIcon,
  LayoutGrid,
  Tag as TagIcon,
  ArrowUpRight,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  portalDocumentService,
  PortalDocument,
  PortalDocumentMeta,
  DocumentSource,
} from "@/services/portalDocumentService";
import { usePortalSocket } from "@/providers/PortalSocketProvider";
import { portalClient } from "@/lib/portalAxios";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

/* --------------------------------------------------------------- */
/*  Theme palette                                                  */
/* --------------------------------------------------------------- */

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceSubtle: "#f1f5f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const SOURCE_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "all", label: "All documents" },
  { value: "internal", label: "From Zukvo" },
  { value: "client", label: "From your team" },
];

/* --------------------------------------------------------------- */
/*  File extension helpers & formatters                            */
/* --------------------------------------------------------------- */

function extOf(fileName: string): string {
  const m = fileName.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

function iconForFile(fileName: string) {
  const ext = extOf(fileName);
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "heic"].includes(ext))
    return { Icon: ImageIcon, color: "#0d9488", bg: "#ccfbf1" };
  if (["pdf"].includes(ext))
    return { Icon: FileType2, color: "#b91c1c", bg: "#fee2e2" };
  if (["xls", "xlsx", "csv", "ods"].includes(ext))
    return { Icon: FileSpreadsheet, color: "#047857", bg: "#d1fae5" };
  if (["doc", "docx", "rtf", "odt"].includes(ext))
    return { Icon: FileText, color: "#1d4ed8", bg: "#dbeafe" };
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
    return { Icon: FileArchive, color: "#7c2d12", bg: "#ffedd5" };
  if (["json", "xml", "yml", "yaml", "ts", "js", "tsx", "jsx", "md"].includes(ext))
    return { Icon: FileCode2, color: "#7c3aed", bg: "#ede9fe" };
  return { Icon: FileText, color: "#64748b", bg: "#f1f5f9" };
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

/* --------------------------------------------------------------- */
/*  Main Component                                                 */
/* --------------------------------------------------------------- */

export default function PortalDocumentsPage() {
  const [docs, setDocs] = useState<PortalDocument[]>([]);
  const [meta, setMeta] = useState<PortalDocumentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<DocumentSource>("all");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<PortalDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<PortalDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalDocumentService.list({
        page,
        limit,
        category: category || undefined,
        search: search || undefined,
        projectId: projectId || undefined,
        source: source === "all" ? undefined : source,
        from: fromIso,
        to: toIso,
      });
      setDocs(res.data);
      setMeta(res.meta);
    } catch {
      setDocs([]);
      setMeta(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, category, projectId, source, fromIso, toIso]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Real-time socket updates
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
    mode: "view" | "download"
  ) => {
    portalDocumentService.track(doc.id, mode);
    if (mode === "download") {
      const external = isExternalLink(doc.fileUrl);
      if (external) {
        window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }

      try {
        message.loading({
          content: "Downloading file...",
          key: "portal-doc-download",
          duration: 0,
        });

        const response = await portalClient.get(
          `/api/client-portal/documents/${doc.id}/download`,
          { responseType: "blob" }
        );

        const blob = new Blob([response.data], {
          type: response.headers["content-type"]?.toString(),
        });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", doc.fileName || "document");
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);

        message.success({
          content: "Downloaded successfully",
          key: "portal-doc-download",
        });
      } catch {
        message.error({
          content: "Failed to download",
          key: "portal-doc-download",
        });
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

  const projectOptions: FilterPillOption[] = useMemo(() => {
    return (
      meta?.projects?.map((proj) => ({
        value: proj.id,
        label: proj.name,
      })) || []
    );
  }, [meta?.projects]);

  const categoryOptions: FilterPillOption[] = useMemo(() => {
    return (
      meta?.categories?.map((c) => ({
        value: c,
        label: c,
      })) || []
    );
  }, [meta?.categories]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (source !== "all") count++;
    if (projectId) count++;
    if (category) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [source, projectId, category, datePicked]);

  const total = meta?.total ?? docs.length;
  const paginatedDocs = docs;

  const sourceCounts = meta?.sourceCounts || {
    all: total,
    client: docs.filter((d) => d.uploadedByPortal).length,
    internal: docs.filter((d) => !d.uploadedByPortal).length,
  };

  const stats = useMemo(() => {
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const thisMonth = docs.filter(
      (d) => d.createdAt && dayjs(d.createdAt).isAfter(startOfMonth)
    ).length;
    const categoriesCount = (meta?.categories || []).length || new Set(
      docs.map((d) => d.category).filter(Boolean)
    ).size;
    return {
      total: sourceCounts.all,
      client: sourceCounts.client,
      internal: sourceCounts.internal,
      thisMonth,
      categories: categoriesCount,
    };
  }, [docs, sourceCounts, meta?.categories]);

  const activeSourceLabel = useMemo(() => {
    if (source === "client") return "From your team";
    if (source === "internal") return "From Zukvo";
    return "All documents";
  }, [source]);

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Last 7 days", value: [dayjs().subtract(6, "day"), dayjs()] },
    { label: "Last 30 days", value: [dayjs().subtract(29, "day"), dayjs()] },
    {
      label: "This month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
    {
      label: "Last month",
      value: [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ],
    },
    {
      label: "This quarter",
      value: [dayjs().startOf("quarter"), dayjs().endOf("quarter")],
    },
  ];

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* ── Top Header Toolbar matching Invoices & Meetings ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <FolderOpen size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Documents</span>
            <span className="pm2-head-sub">OVERSEE ASSETS & FILES</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search document name..."
            prefix={
              <Search
                size={13}
                style={{ color: "var(--text-slate-400)", marginRight: 4 }}
              />
            }
            className="saas-input"
            style={{
              maxWidth: 280,
              borderRadius: 8,
              height: 32,
              background: "transparent",
              fontSize: 12.5,
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />

          <Space.Compact className="ticket-filter-group">
            <Button
              icon={<FilterOutlined />}
              className={activeFilterCount > 0 ? "saas-tag-blue" : ""}
              style={{ height: 32, fontWeight: 600, fontSize: 12 }}
              onClick={() => setIsFilterRowOpen((v) => !v)}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <Button
              icon={<ExpandAltOutlined />}
              style={{ height: 32 }}
              aria-label="Expand filters"
              onClick={() => setIsFilterRowOpen((v) => !v)}
            />
          </Space.Compact>

          {/* View Toggle */}
          <div
            className="premium-view-toggle"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              data-active={viewMode === "table" ? "true" : "false"}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={13} />
            </button>
            <button
              type="button"
              data-active={viewMode === "card" ? "true" : "false"}
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>

        <Space size={10} className="sc-header-right">
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setUploadOpen(true)}
            style={{
              height: 32,
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#3b82f6",
              borderColor: "#3b82f6",
            }}
          >
            Add document
          </Button>

          <Tooltip title="Refresh documents">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => load(true)}
              disabled={loading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* ── Inline filter row (when opened) matching Invoices & Meetings ── */}
      {isFilterRowOpen && (
        <div className="tl-filter-row">
          <div className="tl-filter-row-label">
            <FilterOutlined style={{ fontSize: 11 }} />
            <span>Filters</span>
            <span className="tl-filter-row-count">{activeFilterCount}</span>
          </div>

          <div className="tl-filter-row-pills">
            {/* Source Pill */}
            <TicketFilterPill
              icon={<CheckCircle2 size={12} />}
              label="Source"
              value={source === "all" ? "" : source}
              options={SOURCE_FILTER_OPTIONS}
              onChange={(val: any) => {
                setSource(val || "all");
                setPage(1);
              }}
              itemNoun="sources"
              multiple={false}
            />

            {/* Project Pill */}
            {projectOptions.length > 0 && (
              <TicketFilterPill
                icon={<FolderOpen size={12} />}
                label="Project"
                value={projectId}
                options={projectOptions}
                onChange={(val: any) => {
                  setProjectId(val || undefined);
                  setPage(1);
                }}
                itemNoun="projects"
                width={240}
                multiple={false}
              />
            )}

            {/* Category Pill */}
            {categoryOptions.length > 0 && (
              <TicketFilterPill
                icon={<TagIcon size={12} />}
                label="Category"
                value={category}
                options={categoryOptions}
                onChange={(val: any) => {
                  setCategory(val || undefined);
                  setPage(1);
                }}
                itemNoun="categories"
                width={220}
                multiple={false}
              />
            )}

            {/* Date Range Picker */}
            <RangePicker
              value={datePicked}
              onChange={(dates) => {
                setDatePicked(dates as [Dayjs | null, Dayjs | null] | null);
                setPage(1);
              }}
              presets={rangePresets}
              className="premium-rangepicker"
              style={{ height: 28, borderRadius: 6, fontSize: 12 }}
              placeholder={["Start", "End"]}
              format="DD MMM YY"
              suffixIcon={<Calendar size={12} color={p.textFaint} />}
              allowClear
            />
          </div>

          <div className="tl-filter-row-actions">
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="tl-filter-row-reset"
                onClick={() => {
                  setSource("all");
                  setProjectId(undefined);
                  setCategory(undefined);
                  setDatePicked(null);
                  setPage(1);
                }}
              >
                <ReloadOutlined style={{ fontSize: 10 }} />
                Reset
              </button>
            )}
            <button
              type="button"
              className="tl-filter-row-close"
              onClick={() => setIsFilterRowOpen(false)}
              aria-label="Close filters"
              title="Close filters"
            >
              <CloseOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Overview Banner (Sprint head style) ── */}
      <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{
                background: "#3b82f6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
              }}
            />
            <span className="tl-sprint-title pm2-banner-title">
              Documents — {activeSourceLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} DOCUMENTS
              </span>
              {stats.internal > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {stats.internal} FROM ZUKVO
                </span>
              )}
              {stats.client > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {stats.client} CLIENT UPLOADED
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{paginatedDocs.length}</b>{" "}
            {paginatedDocs.length === 1 ? "result" : "results"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.internal}</b> from Zukvo
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.client}</b> client uploads
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.categories}</b> categories
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.thisMonth}</b> this month
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{
                width: `${
                  total > 0
                    ? Math.min(
                        100,
                        Math.round((stats.internal / total) * 100)
                      )
                    : 100
                }%`,
              }}
            />
          </div>
          <span className="tl-sprint-progress-pct">
            {total > 0
              ? Math.round((stats.internal / total) * 100)
              : 100}
            %
          </span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-documents-content"
        style={{
          padding: 0,
          width: "100%",
          flex: "1 0 auto",
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <ZukvoLoader size="md" />
          </div>
        ) : paginatedDocs.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No documents match your filter criteria."
                    : source === "client"
                    ? "You haven't uploaded any documents yet."
                    : source === "internal"
                    ? "Your account team hasn't shared any documents yet."
                    : "No documents yet."}
                </span>
              }
            />
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div
            className="pm-table-wrap"
            style={{
              background: "#ffffff",
              overflowX: "auto",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(260px, 2.5fr) 150px 130px 120px 140px 130px",
                minWidth: 920,
                gap: 12,
                padding: "7px 16px",
                background: "var(--bg-slate-50, #f8fafc)",
                borderBottom: "1px solid var(--border-slate-200, #e2e8f0)",
                fontSize: 10,
                fontWeight: 800,
                color: "var(--text-slate-400, #94a3b8)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                alignItems: "center",
              }}
            >
              <div>DOCUMENT / FILE</div>
              <div>PROJECT</div>
              <div>CATEGORY</div>
              <div>SOURCE</div>
              <div>UPLOADED BY</div>
              <div>DATE</div>
            </div>

            <div>
              {paginatedDocs.map((doc, idx) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isLast={idx === paginatedDocs.length - 1}
                  onOpen={handleOpen}
                  onEdit={() => setEditingDoc(doc)}
                  onDelete={() => setDeletingDoc(doc)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
              padding: "16px 24px",
            }}
          >
            {paginatedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onOpen={handleOpen}
                onEdit={() => setEditingDoc(doc)}
                onDelete={() => setDeletingDoc(doc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-documents-pagination-footer"
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: "#ffffff",
          borderTop: `1px solid ${p.border}`,
          boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.04)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Text style={{ fontSize: 13, color: p.textSubtle }}>
            Showing{" "}
            <span style={{ color: p.text, fontWeight: 700 }}>
              {paginatedDocs.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            document{total !== 1 ? "s" : ""}
          </Typography.Text>
        </div>

        <Pagination
          current={page}
          pageSize={limit}
          total={total}
          showSizeChanger
          pageSizeOptions={["10", "15", "20", "25", "50", "100"]}
          onChange={(p, size) => {
            setPage(p);
            if (size && size !== limit) {
              setLimit(size);
            }
          }}
          onShowSizeChange={(current, size) => {
            setPage(1);
            setLimit(size);
          }}
        />
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        projects={meta?.projects ?? []}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false);
          load();
        }}
      />

      {/* Edit Modal */}
      <EditDocumentModal
        doc={editingDoc}
        projects={meta?.projects ?? []}
        onClose={() => setEditingDoc(null)}
        onSaved={() => {
          setEditingDoc(null);
          load();
        }}
      />

      {/* Delete Confirmation Modal */}
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
        <p style={{ color: p.textMuted, fontSize: 13, margin: 0 }}>
          <strong style={{ color: p.text }}>
            {deletingDoc?.fileName || "This document"}
          </strong>{" "}
          will be permanently removed from the portal and storage. This can't
          be undone.
        </p>
      </Modal>

      <style jsx global>{`
        /* ── Header Toolbar ── */
        .pm2-toolbar.sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: auto;
          min-height: 0;
          margin: 0;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .sc-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .sc-header-right {
          flex-shrink: 0;
        }

        .pm2-head-id {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          flex-shrink: 0;
        }
        .pm2-head-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 14px;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.18);
        }
        .pm2-head-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .pm2-head-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .pm2-head-sub {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-top: 1px;
        }

        /* ── Overview Banner ── */
        .tl-section-head {
          padding: 10px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tl-sprint-head-v2 {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pm2-banner-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tl-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 4px;
          border: 1px solid transparent;
          text-transform: uppercase;
          line-height: 1;
        }
        .tl-sprint-tag-active {
          background: transparent;
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .tl-sprint-tag-neutral {
          background: transparent;
          color: #64748b;
          border-color: rgba(100, 116, 139, 0.32);
        }
        .tl-sprint-tag-delayed {
          background: transparent;
          color: #8b5cf6;
          border-color: rgba(139, 92, 246, 0.32);
        }

        .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-left: 15px;
        }
        .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: -0.005em;
        }
        .tl-sprint-meta b {
          color: #0f172a;
          font-weight: 800;
        }
        .pm2-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: right;
        }

        /* ── Inline Filter Row ── */
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .tl-filter-row-actions {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tl-filter-row-reset {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.45);
          background: rgba(59, 130, 246, 0.06);
          border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-close:hover {
          color: #0f172a;
          background: #ffffff;
          border-color: #94a3b8;
        }

        .saas-tag-blue {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border-color: #bfdbfe !important;
        }

        /* ── View Toggle ── */
        .premium-view-toggle {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 2px;
        }
        .premium-view-toggle button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 4px;
          cursor: pointer;
          transition: all 120ms ease;
        }
        .premium-view-toggle button:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .premium-view-toggle button[data-active='true'] {
          background: #eff6ff;
          color: #1d4ed8;
        }

        /* Card hover */
        .pm2-card {
          transition: all 140ms ease;
        }
        .pm2-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }

        /* Row hover */
        .pm2-table-row {
          transition: background 120ms ease;
        }
        .pm2-table-row:hover {
          background: #f8fafc !important;
        }

        .portal-documents-pagination-footer .ant-pagination-item,
        .portal-documents-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-documents-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-documents-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-documents-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component                                            */
/* --------------------------------------------------------------- */

function DocumentRow({
  doc,
  isLast,
  onOpen,
  onEdit,
  onDelete,
}: {
  doc: PortalDocument;
  isLast: boolean;
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { Icon, color, bg } = iconForFile(doc.fileName);
  const looksExternal = isExternalLink(doc.fileUrl);

  return (
    <div
      onClick={() => onOpen(doc, "view")}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(260px, 2.5fr) 150px 130px 120px 140px 130px",
        minWidth: 920,
        gap: 12,
        padding: "8px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {/* 1. File Name & Details */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            background: bg,
            border: `1px solid ${color}33`,
          }}
        >
          <Icon size={14} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={doc.fileName}
          >
            {doc.fileName}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 1,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {doc.documentType || "Document"}
            </span>
            {doc.version > 1 && (
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  padding: "0 4px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 4,
                  color: "#1d4ed8",
                  fontWeight: 700,
                  fontSize: 9,
                }}
              >
                v{doc.version}
              </span>
            )}
            {doc.tags?.slice(0, 2).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 9.5,
                  padding: "0 4px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  borderRadius: 4,
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Project */}
      <div>
        {doc.projectName ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 11,
              fontWeight: 600,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={doc.projectName}
          >
            <FolderOpen size={11} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.projectName}
            </span>
          </span>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* 3. Category */}
      <div>
        {doc.category ? (
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: "#475569",
              background: "#f1f5f9",
            }}
          >
            {doc.category}
          </Tag>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* 4. Source */}
      <div>
        {doc.uploadedByPortal ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              padding: "1.5px 7px",
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              color: "#6d28d9",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            <Users size={10} />
            Client
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              padding: "1.5px 7px",
              background: "#ccfbf1",
              border: "1px solid #99f6e4",
              color: "#0d9488",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            <Briefcase size={10} />
            Zukvo
          </span>
        )}
      </div>

      {/* 5. Uploaded By */}
      <div
        style={{
          fontSize: 12,
          color: "#0f172a",
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {doc.uploadedByName || "—"}
      </div>

      {/* 6. Date */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#475569",
        }}
        title={fmtDate(doc.createdAt)}
      >
        <Calendar size={12} color="#94a3b8" />
        <span>{fmtRelative(doc.createdAt)}</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component (Card View)                                     */
/* --------------------------------------------------------------- */

function DocumentCard({
  doc,
  onOpen,
  onEdit,
  onDelete,
}: {
  doc: PortalDocument;
  onOpen: (doc: PortalDocument, mode: "view" | "download") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { Icon, color, bg } = iconForFile(doc.fileName);
  const looksExternal = isExternalLink(doc.fileUrl);

  return (
    <div
      onClick={() => onOpen(doc, "view")}
      className="pm2-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
      }}
    >
      {/* Card Top */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
              background: bg,
              border: `1px solid ${color}33`,
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                fontWeight: 600,
                color: "#64748b",
                background: "#f1f5f9",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {doc.documentType || "FILE"}
            </span>
          </div>
        </div>

        {doc.uploadedByPortal ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              padding: "1.5px 7px",
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              color: "#6d28d9",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            <Users size={10} />
            Client
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              padding: "1.5px 7px",
              background: "#ccfbf1",
              border: "1px solid #99f6e4",
              color: "#0d9488",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            <Briefcase size={10} />
            Zukvo
          </span>
        )}
      </div>

      {/* File Name */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            wordBreak: "break-word",
          }}
        >
          {doc.fileName}
        </div>
      </div>

      {/* Project & Category Pills */}
      {(doc.projectName || doc.category) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {doc.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 7px",
                borderRadius: 6,
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              <FolderOpen size={10} />
              {doc.projectName}
            </span>
          )}
          {doc.category && (
            <Tag
              style={{
                borderRadius: 6,
                padding: "1px 7px",
                fontWeight: 700,
                fontSize: 9.5,
                textTransform: "uppercase",
                border: "none",
                margin: 0,
                color: "#475569",
                background: "#f1f5f9",
              }}
            >
              {doc.category}
            </Tag>
          )}
        </div>
      )}

      {/* Footer Info & Quick Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 11.5,
          color: "#64748b",
          marginTop: "auto",
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color="#94a3b8" />
          <span>{fmtRelative(doc.createdAt)}</span>
          {doc.uploadedByName && <span>· {doc.uploadedByName}</span>}
        </div>

        <div
          style={{ display: "flex", gap: 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title={looksExternal ? "Open link" : "Open"}>
            <button
              onClick={() => onOpen(doc, "view")}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#64748b",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {looksExternal ? <ExternalLink size={12} /> : <Eye size={12} />}
            </button>
          </Tooltip>
          {!looksExternal && (
            <Tooltip title="Download">
              <button
                onClick={() => onOpen(doc, "download")}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#64748b",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Download size={12} />
              </button>
            </Tooltip>
          )}
          {doc.uploadedByPortal && (
            <>
              <Tooltip title="Edit details">
                <button
                  onClick={onEdit}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={12} />
                </button>
              </Tooltip>
              <Tooltip title="Delete">
                <button
                  onClick={onDelete}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid #fecaca",
                    background: "#ffffff",
                    color: "#dc2626",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
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
}

/* --------------------------------------------------------------- */
/*  Upload Modal                                                   */
/* --------------------------------------------------------------- */

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
            borderBottom: `1px solid ${p.border}`,
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
                background: p.accentBg,
                border: `1px solid ${p.accentBorder}`,
                color: p.accent,
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
                  color: p.text,
                  letterSpacing: "-0.015em",
                }}
              >
                Add a document
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: p.textSubtle,
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
              background: p.surface,
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
                    border: `1.5px dashed ${dragging ? p.accent : p.border}`,
                    borderRadius: 12,
                    background: dragging ? p.accentBg : "#fafbfc",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  <UploadCloud
                    size={26}
                    color={dragging ? p.accent : p.textSubtle}
                    style={{ marginBottom: 8 }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: p.text,
                      marginBottom: 4,
                    }}
                  >
                    Drop a file or click to browse
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: p.textSubtle,
                      fontWeight: 500,
                    }}
                  >
                    Up to {fmtBytes(MAX_FILE_BYTES)}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#fafbfc",
                    border: `1px solid ${p.border}`,
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
                      background: p.accentBg,
                      color: p.accent,
                      border: `1px solid ${p.accentBorder}`,
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
                        color: p.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: p.textSubtle,
                        fontWeight: 500,
                      }}
                    >
                      {fmtBytes(file.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: p.surface,
                      border: `1px solid ${p.border}`,
                      color: p.textMuted,
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
              prefix={<LinkIcon size={13} color={p.textSubtle} />}
              style={{ height: 38 }}
            />
          )}

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
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
              background: p.surface,
              border: `1px solid ${p.border}`,
              color: p.textMuted,
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
                ? p.borderStrong
                : "#3b82f6",
              border: "1px solid #2563eb",
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
      border: `1px solid ${active ? p.accentBorder : p.border}`,
      background: active ? p.accentBg : p.surface,
      color: active ? p.accentText : p.textMuted,
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
        color: p.textSubtle,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

/* --------------------------------------------------------------- */
/*  Edit Modal                                                     */
/* --------------------------------------------------------------- */

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
            borderBottom: `1px solid ${p.border}`,
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
              background: p.accentBg,
              border: `1px solid ${p.accentBorder}`,
              color: p.accent,
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
                color: p.text,
                letterSpacing: "-0.015em",
              }}
            >
              Edit document
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: p.textSubtle,
                fontWeight: 500,
              }}
            >
              Update name and classification. The file itself isn&apos;t replaced.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: p.surface,
              border: `1px solid ${p.border}`,
              color: p.textMuted,
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

        <div
          style={{
            padding: "16px 22px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
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
              background: p.surface,
              border: `1px solid ${p.border}`,
              color: p.textMuted,
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
                ? p.borderStrong
                : "#3b82f6",
              border: "1px solid #2563eb",
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
