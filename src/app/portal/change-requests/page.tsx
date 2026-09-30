"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Pagination,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  notification,
  Typography,
  Button,
  Space,
  Tooltip,
  Tag,
  Empty,
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
  Search,
  Plus,
  GitPullRequest,
  Calendar,
  Clock,
  LayoutGrid,
  List as ListIcon,
  FolderOpen,
  Send,
  MessageCircle,
  Receipt,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  portalCrService,
  PortalCrListItem,
  PortalCrMeta,
  CrPriority,
} from "@/services/portalCrService";
import {
  STATUS_META,
  PRIORITY_META,
  fmtCurrency,
  fmtRelative,
} from "./_crUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";
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

const STATUS_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "estimated", label: "Estimate ready" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const PRIORITY_FORM_OPTIONS: { value: CrPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function estimateText(cr: PortalCrListItem): string {
  if (cr.estimatedCost) return fmtCurrency(cr.estimatedCost, cr.estimatedCurrency);
  if (cr.estimatedHoursMin || cr.estimatedHoursMax)
    return `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`;
  return "—";
}

function getCrStatusTag(status: string) {
  switch (status) {
    case "approved":
    case "delivered":
      return { color: "#10b981", bg: "#d1fae5", label: STATUS_META[status]?.label || "APPROVED" };
    case "estimated":
      return { color: "#d97706", bg: "#fef3c7", label: "ESTIMATE READY" };
    case "in_progress":
    case "scheduled":
      return { color: "#3b82f6", bg: "#eff6ff", label: STATUS_META[status]?.label || "IN PROGRESS" };
    case "under_review":
      return { color: "#8b5cf6", bg: "#f5f3ff", label: "UNDER REVIEW" };
    case "rejected":
      return { color: "#ef4444", bg: "#fee2e2", label: "REJECTED" };
    case "closed":
    case "cancelled":
      return { color: "#64748b", bg: "#f1f5f9", label: STATUS_META[status]?.label || status.toUpperCase() };
    case "submitted":
    default:
      return { color: "#0284c7", bg: "#e0f2fe", label: "SUBMITTED" };
  }
}

function getCrPriorityTag(priority: string) {
  switch (priority) {
    case "critical":
      return { color: "#dc2626", bg: "#fef2f2", label: "CRITICAL" };
    case "high":
      return { color: "#d97706", bg: "#fffbeb", label: "HIGH" };
    case "medium":
      return { color: "#2563eb", bg: "#eff6ff", label: "MEDIUM" };
    case "low":
    default:
      return { color: "#475569", bg: "#f1f5f9", label: "LOW" };
  }
}

/* --------------------------------------------------------------- */
/*  Main Page Component                                            */
/* --------------------------------------------------------------- */

export default function PortalCrListPage() {
  const [items, setItems] = useState<PortalCrListItem[]>([]);
  const [meta, setMeta] = useState<PortalCrMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [notify, contextHolder] = notification.useNotification();
  const [limit, setLimit] = useState(15);

  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalCrService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        priority: priority || undefined,
        search: search || undefined,
        projectId,
        from: fromIso,
        to: toIso,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, priority, projectId, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const projectOptions: FilterPillOption[] = useMemo(() => {
    return (
      meta?.projects?.map((proj) => ({
        value: proj.id,
        label: proj.code ? `${proj.name} · ${proj.code}` : proj.name,
      })) || []
    );
  }, [meta?.projects]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "ALL") count++;
    if (priority) count++;
    if (projectId) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [status, priority, projectId, datePicked]);

  const total = meta?.total ?? items.length;
  const counts = meta?.counts || {};
  const underReviewCount =
    (counts as any)?.under_review ??
    items.filter((c) => c.status === "under_review").length;
  const estimatedCount =
    (counts as any)?.estimated ??
    items.filter((c) => c.status === "estimated").length;
  const approvedCount =
    (counts as any)?.approved ??
    items.filter((c) => c.status === "approved").length;
  const inProgressCount =
    (counts as any)?.in_progress ??
    items.filter((c) => c.status === "in_progress").length;
  const deliveredCount =
    (counts as any)?.delivered ??
    items.filter((c) => c.status === "delivered").length;

  const resolvedCount = approvedCount + deliveredCount;
  const completedPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const activeStatusLabel = useMemo(() => {
    if (status === "ALL") return "All change requests";
    const found = STATUS_FILTER_OPTIONS.find((s) => s.value === status);
    return found ? found.label : "All change requests";
  }, [status]);

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
      {contextHolder}

      {/* ── Top Header Toolbar matching Invoices, Meetings, Documents & Milestones ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <GitPullRequest size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Change Requests</span>
            <span className="pm2-head-sub">OVERSEE SCOPE & ESTIMATES</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search CR # or subject..."
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
            onClick={() => setCreateOpen(true)}
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
            New change request
          </Button>

          <Tooltip title="Refresh change requests">
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

      {/* ── Inline filter row (when opened) ── */}
      {isFilterRowOpen && (
        <div className="tl-filter-row">
          <div className="tl-filter-row-label">
            <FilterOutlined style={{ fontSize: 11 }} />
            <span>Filters</span>
            <span className="tl-filter-row-count">{activeFilterCount}</span>
          </div>

          <div className="tl-filter-row-pills">
            {/* Status Pill */}
            <TicketFilterPill
              icon={<CheckCircle2 size={12} />}
              label="Status"
              value={status === "ALL" ? "" : status}
              options={STATUS_FILTER_OPTIONS}
              onChange={(val: any) => {
                setStatus(val || "ALL");
                setPage(1);
              }}
              itemNoun="statuses"
              multiple={false}
            />

            {/* Priority Pill */}
            <TicketFilterPill
              icon={<AlertTriangle size={12} />}
              label="Priority"
              value={priority || ""}
              options={PRIORITY_FILTER_OPTIONS}
              onChange={(val: any) => {
                setPriority(val || undefined);
                setPage(1);
              }}
              itemNoun="priorities"
              width={200}
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
                  setStatus("ALL");
                  setPriority(undefined);
                  setProjectId(undefined);
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
              Change requests — {activeStatusLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} REQUESTS
              </span>
              {estimatedCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {estimatedCount} ESTIMATES READY
                </span>
              )}
              {underReviewCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {underReviewCount} UNDER REVIEW
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{items.length}</b>{" "}
            {items.length === 1 ? "result" : "results"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{underReviewCount}</b> under review
          </span>
          <span className="tl-sprint-meta">
            <b>{estimatedCount}</b> estimate ready
          </span>
          <span className="tl-sprint-meta">
            <b>{inProgressCount}</b> in progress
          </span>
          <span className="tl-sprint-meta">
            <b>{resolvedCount}</b> approved/delivered
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${Math.min(100, completedPct)}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{completedPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-cr-content"
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
        ) : items.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No change requests match your filter criteria."
                    : "No change requests yet."}
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
                  "minmax(240px, 2fr) 130px 100px 140px 120px 120px 120px",
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
              <div>CR # / SUBJECT</div>
              <div>STATUS</div>
              <div>PRIORITY</div>
              <div>PROJECT</div>
              <div style={{ textAlign: "right" }}>ESTIMATE</div>
              <div>TARGET</div>
              <div>UPDATED</div>
            </div>

            <div>
              {items.map((cr, idx) => (
                <CrTableRow
                  key={cr.id}
                  cr={cr}
                  isLast={idx === items.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 14,
              padding: "16px 24px",
            }}
          >
            {items.map((cr) => (
              <CrCard key={cr.id} cr={cr} />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-cr-pagination-footer"
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
              {items.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            change request{total !== 1 ? "s" : ""}
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

      <RaiseCrModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        notify={notify}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
          load();
        }}
      />

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
          color: #d97706;
          border-color: rgba(217, 119, 6, 0.32);
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

        .portal-cr-pagination-footer .ant-pagination-item,
        .portal-cr-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-cr-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-cr-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-cr-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component                                            */
/* --------------------------------------------------------------- */

function CrTableRow({
  cr,
  isLast,
}: {
  cr: PortalCrListItem;
  isLast: boolean;
}) {
  const statusTag = getCrStatusTag(cr.status);
  const priorityTag = getCrPriorityTag(cr.priority);
  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;

  return (
    <Link
      href={`/portal/change-requests/${cr.id}`}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 130px 100px 140px 120px 120px 120px",
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
      {/* 1. CR # / Subject */}
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
            color: "#3B82F6",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.16)",
          }}
        >
          <GitPullRequest size={13} />
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
            title={cr.subject}
          >
            {cr.subject}
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
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 10,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {cr.crNumber}
            </span>
            {awaitingDecision && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "0 5px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Decide
              </span>
            )}
            {cr.messageCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <MessageCircle size={10} />
                {cr.messageCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Status */}
      <div>
        <Tag
          style={{
            borderRadius: 6,
            padding: "1px 8px",
            fontWeight: 700,
            fontSize: 10,
            textTransform: "uppercase",
            border: "none",
            margin: 0,
            color: statusTag.color,
            background: statusTag.bg,
          }}
        >
          {statusTag.label}
        </Tag>
      </div>

      {/* 3. Priority */}
      <div>
        <Tag
          style={{
            borderRadius: 6,
            padding: "1px 8px",
            fontWeight: 700,
            fontSize: 10,
            textTransform: "uppercase",
            border: "none",
            margin: 0,
            color: priorityTag.color,
            background: priorityTag.bg,
          }}
        >
          {priorityTag.label}
        </Tag>
      </div>

      {/* 4. Project */}
      <div>
        {cr.projectName ? (
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
            title={cr.projectName}
          >
            <FolderOpen size={11} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cr.projectName}
            </span>
          </span>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* 5. Estimate */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "#0f172a",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {estimateText(cr)}
      </div>

      {/* 6. Target Date */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#475569",
        }}
      >
        <Calendar size={12} color="#94a3b8" />
        <span>{fmtDateShort(cr.targetDeliveryDate)}</span>
      </div>

      {/* 7. Updated */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#64748b",
        }}
      >
        <Clock size={12} color="#94a3b8" />
        <span>{fmtRelative(cr.lastActivityAt)}</span>
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component (Card View)                                     */
/* --------------------------------------------------------------- */

function CrCard({ cr }: { cr: PortalCrListItem }) {
  const statusTag = getCrStatusTag(cr.status);
  const priorityTag = getCrPriorityTag(cr.priority);
  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;

  return (
    <Link
      href={`/portal/change-requests/${cr.id}`}
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
        textDecoration: "none",
        color: "inherit",
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
              width: 26,
              height: 26,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3B82F6",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.16)",
            }}
          >
            <GitPullRequest size={13} />
          </div>
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
            {cr.crNumber}
          </span>
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: priorityTag.color,
              background: priorityTag.bg,
            }}
          >
            {priorityTag.label}
          </Tag>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {awaitingDecision && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                borderRadius: 6,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Decide
            </span>
          )}
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: statusTag.color,
              background: statusTag.bg,
            }}
          >
            {statusTag.label}
          </Tag>
        </div>
      </div>

      {/* Subject */}
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
          {cr.subject}
        </div>
      </div>

      {/* Project & Linked Invoice */}
      {(cr.projectName || cr.linkedInvoiceNumber) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {cr.projectName && (
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
              {cr.projectName}
            </span>
          )}
          {cr.linkedInvoiceNumber && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 7px",
                borderRadius: 6,
                background: "#f1f5f9",
                color: "#475569",
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              <Receipt size={10} />
              {cr.linkedInvoiceNumber}
            </span>
          )}
        </div>
      )}

      {/* Estimate & Target */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "#f8fafc",
          padding: "8px 12px",
          borderRadius: 6,
        }}
      >
        <div>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Estimate
          </span>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            {estimateText(cr)}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            Target Delivery
          </span>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
            {fmtDateShort(cr.targetDeliveryDate)}
          </div>
        </div>
      </div>

      {/* Footer Info */}
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
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color="#94a3b8" />
          <span>Updated {fmtRelative(cr.lastActivityAt)}</span>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <MessageCircle size={12} color="#94a3b8" />
          <span>{cr.messageCount} messages</span>
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- */
/*  Raise CR Modal                                                 */
/* --------------------------------------------------------------- */

function RaiseCrModal({
  open,
  onClose,
  onCreated,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);
  const [projects, setProjects] = useState<
    { id: string; name: string; code: string | null }[]
  >([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFiles([]);
      return;
    }
    portalCrService
      .projectOptions()
      .then((ps) => setProjects(ps || []))
      .catch(() => setProjects([]));
    form.setFieldsValue({ priority: "medium" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: `${f.name} exceeds 10 MB` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFiles((prev) => [
        ...prev,
        { dataUrl: String(reader.result), name: f.name, size: f.size },
      ]);
    reader.readAsDataURL(f);
  };

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await portalCrService.create({
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        projectId: values.projectId || undefined,
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      notify.success({ message: "Change request submitted" });
      onCreated();
    } catch (err: any) {
      notify.error({ message: "Submit failed", description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={620}
      closable={false}
      styles={{
        content: {
          background: "#ffffff",
          border: `1px solid ${p.border}`,
          padding: 0,
          borderRadius: 12,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: p.accentBg,
            color: p.accent,
            border: `1px solid ${p.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <GitPullRequest size={16} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: p.text }}>
            Raise a change request
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              color: p.textSubtle,
              fontWeight: 500,
            }}
          >
            Tell us what you&apos;d like to change. We&apos;ll come back with
            an impact analysis, time and cost estimate for you to approve.
          </div>
        </div>
      </div>

      <div style={{ padding: 22 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          requiredMark={false}
        >
          <Form.Item
            name="subject"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                Subject
              </span>
            }
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Short summary (e.g. Add bulk-export to admin)"
              maxLength={200}
              style={{ height: 36, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                What would you like changed?
              </span>
            }
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Describe the change. Why it matters, who needs it, any references…"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Form.Item
              name="priority"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                  Priority
                </span>
              }
            >
              <Select options={PRIORITY_FORM_OPTIONS} style={{ height: 36 }} />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                  Project (optional)
                </span>
              }
            >
              <Select
                allowClear
                placeholder="Select project"
                style={{ height: 36 }}
                options={projects.map((pr) => ({
                  value: pr.id,
                  label: pr.code ? `${pr.name} · ${pr.code}` : pr.name,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 18, marginTop: 10 }}>
            <div
              style={{
                fontSize: 12.5,
                color: p.textMuted,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Attachments
              <span style={{ color: p.textFaint, fontSize: 11.5, fontWeight: 400 }}>
                {" "}
                · optional · 10 MB each
              </span>
            </div>
            <AttachmentPicker
              files={files}
              onAdd={handleFile}
              onRemove={(i) =>
                setFiles((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${p.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                background: "#ffffff",
                border: `1px solid ${p.border}`,
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: p.textMuted,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#3b82f6",
                color: "#ffffff",
                border: "1px solid #2563eb",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Send size={13} />
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
