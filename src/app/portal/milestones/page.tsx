"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Empty,
  Pagination,
  DatePicker,
  Typography,
  Button,
  Space,
  Tooltip,
  Tag,
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
  Flag,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  PauseCircle,
  XCircle,
  ListChecks,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Search,
  LayoutGrid,
  List as ListIcon,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";
import {
  portalMilestoneService,
  PortalMilestone,
  PortalMilestoneStatus,
} from "@/services/portalMilestoneService";
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
  { value: "in_progress", label: "In progress" },
  { value: "not_started", label: "Not started" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
];

/* --------------------------------------------------------------- */
/*  Formatters & helpers                                           */
/* --------------------------------------------------------------- */

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

function dateRange(start: string | null, end: string | null) {
  if (!start && !end) return "No dates";
  if (start && end) return `${fmtDateShort(start)} → ${fmtDateShort(end)}`;
  return fmtDateShort(start || end);
}

function daysBetween(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function milestoneTiming(m: PortalMilestone):
  | { label: string; tone: "indigo" | "warning" | "danger" | "neutral" | "success"; icon: any }
  | null {
  if (m.status === "completed" && m.actualEndDate) {
    const days = daysBetween(m.actualEndDate);
    if (days != null && days <= 0) {
      const ago = -days;
      return {
        label: ago === 0 ? "Delivered today" : `Delivered ${ago}d ago`,
        tone: "success",
        icon: CheckCircle2,
      };
    }
  }
  if (m.status === "in_progress" && m.estEndDate) {
    const days = daysBetween(m.estEndDate);
    if (days == null) return null;
    if (days < 0)
      return { label: `${-days}d overdue`, tone: "danger", icon: AlertTriangle };
    if (days === 0) return { label: "Due today", tone: "warning", icon: Clock };
    if (days <= 3) return { label: `${days}d left`, tone: "warning", icon: Clock };
    return { label: `${days}d left`, tone: "indigo", icon: Clock };
  }
  if (m.status === "not_started" && m.estStartDate) {
    const days = daysBetween(m.estStartDate);
    if (days == null || days < 0) return null;
    if (days === 0) return { label: "Starts today", tone: "indigo", icon: Clock };
    return { label: `Starts in ${days}d`, tone: "neutral", icon: Clock };
  }
  return null;
}

function getStatusMeta(status: PortalMilestoneStatus) {
  switch (status) {
    case "completed":
      return { color: "#10b981", bg: "#d1fae5", label: "COMPLETED" };
    case "in_progress":
      return { color: "#3b82f6", bg: "#eff6ff", label: "IN PROGRESS" };
    case "on_hold":
      return { color: "#8b5cf6", bg: "#f5f3ff", label: "ON HOLD" };
    case "cancelled":
      return { color: "#ef4444", bg: "#fee2e2", label: "CANCELLED" };
    case "not_started":
    default:
      return { color: "#64748b", bg: "#f1f5f9", label: "NOT STARTED" };
  }
}

function TimingChip({
  tone,
  icon: Icon,
  label,
}: {
  tone: "indigo" | "warning" | "danger" | "neutral" | "success";
  icon: any;
  label: string;
}) {
  const toneMap = {
    indigo: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
    warning: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    danger: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c" },
    neutral: { bg: "#f1f5f9", border: "#e2e8f0", color: "#475569" },
    success: { bg: "#ecfdf5", border: "#a7f3d0", color: "#047857" },
  };
  const t = toneMap[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 6px",
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={9} />
      {label}
    </span>
  );
}

function ProgressBar({
  percent,
  tone = "indigo",
  height = 5,
}: {
  percent: number;
  tone?: "indigo" | "success" | "warning";
  height?: number;
}) {
  const color =
    tone === "success" ? "#10b981" : tone === "warning" ? "#f59e0b" : "#3b82f6";
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#f1f5f9",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${safe}%`,
          height: "100%",
          background: color,
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Main Page Component                                            */
/* --------------------------------------------------------------- */

export default function PortalMilestonesPage() {
  const [items, setItems] = useState<PortalMilestone[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [limit, setLimit] = useState(15);

  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalMilestoneService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        projectId,
        search: search || undefined,
        from: fromIso,
        to: toIso,
      });
      setItems(res.data || []);
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
  }, [page, limit, status, projectId, fromIso, toIso]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Projects derived from meta or loaded milestones
  const projectOptions: FilterPillOption[] = useMemo(() => {
    if (meta?.projects && meta.projects.length > 0) {
      return meta.projects.map((p: any) => ({ value: p.id, label: p.name }));
    }
    const seen = new Map<string, string>();
    for (const m of items) {
      if (m.projectId && m.projectName && !seen.has(m.projectId)) {
        seen.set(m.projectId, m.projectName);
      }
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, meta?.projects]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "ALL") count++;
    if (projectId) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [status, projectId, datePicked]);

  const total = meta?.total ?? items.length;
  const paginatedItems = items;

  const inProgressCount = meta?.counts?.in_progress ?? items.filter((m) => m.status === "in_progress").length;
  const completedCount = meta?.counts?.completed ?? items.filter((m) => m.status === "completed").length;
  const onHoldCount = meta?.counts?.on_hold ?? items.filter((m) => m.status === "on_hold").length;
  const notStartedCount = meta?.counts?.not_started ?? items.filter((m) => m.status === "not_started").length;

  const completedPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const activeStatusLabel = useMemo(() => {
    if (status === "ALL") return "All milestones";
    const found = STATUS_FILTER_OPTIONS.find((s) => s.value === status);
    return found ? found.label : "All milestones";
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
      {/* ── Top Header Toolbar matching Invoices, Meetings & Documents ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <Flag size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Milestones</span>
            <span className="pm2-head-sub">OVERSEE DELIVERY & PROGRESS</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search milestone name..."
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
          <Tooltip title="Refresh milestones">
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
              Milestones — {activeStatusLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} MILESTONES
              </span>
              {inProgressCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {inProgressCount} IN PROGRESS
                </span>
              )}
              {completedCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {completedCount} COMPLETED
                </span>
              )}
              {onHoldCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {onHoldCount} ON HOLD
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{paginatedItems.length}</b>{" "}
            {paginatedItems.length === 1 ? "result" : "results"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{inProgressCount}</b> in progress
          </span>
          <span className="tl-sprint-meta">
            <b>{completedCount}</b> completed
          </span>
          <span className="tl-sprint-meta">
            <b>{onHoldCount}</b> on hold
          </span>
          <span className="tl-sprint-meta">
            <b>{notStartedCount}</b> not started
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
        className="portal-milestones-content"
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
        ) : paginatedItems.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No milestones match your filter criteria."
                    : "No milestones yet."}
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
                  "minmax(240px, 2fr) 130px 140px minmax(160px, 1.4fr) 90px 150px",
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
              <div>MILESTONE</div>
              <div>STATUS</div>
              <div>PROJECT</div>
              <div>PROGRESS</div>
              <div style={{ textAlign: "right" }}>ITEMS</div>
              <div>DATES</div>
            </div>

            <div>
              {paginatedItems.map((m, idx) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  isLast={idx === paginatedItems.length - 1}
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
            {paginatedItems.map((m) => (
              <MilestoneCard key={m.id} milestone={m} />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-milestones-pagination-footer"
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
              {paginatedItems.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            milestone{total !== 1 ? "s" : ""}
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

        .portal-milestones-pagination-footer .ant-pagination-item,
        .portal-milestones-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-milestones-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-milestones-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-milestones-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component                                            */
/* --------------------------------------------------------------- */

function MilestoneRow({
  milestone,
  isLast,
}: {
  milestone: PortalMilestone;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const statusMeta = getStatusMeta(milestone.status);
  const timing = milestoneTiming(milestone);

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        className="pm2-table-row"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(240px, 2fr) 130px 140px minmax(160px, 1.4fr) 90px 150px",
          minWidth: 920,
          gap: 12,
          padding: "8px 16px",
          alignItems: "center",
          borderBottom: isLast && !open ? "none" : "1px solid #f1f5f9",
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {/* 1. Milestone */}
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
            <Flag size={13} />
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
              title={milestone.name}
            >
              {milestone.name}
            </span>
            {milestone.description && (
              <span
                style={{
                  fontSize: 10.5,
                  color: "#64748b",
                  marginTop: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {milestone.description}
              </span>
            )}
          </div>
        </div>

        {/* 2. Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: statusMeta.color,
              background: statusMeta.bg,
            }}
          >
            {statusMeta.label}
          </Tag>
          {timing && (
            <TimingChip
              tone={timing.tone}
              icon={timing.icon}
              label={timing.label}
            />
          )}
        </div>

        {/* 3. Project */}
        <div>
          {milestone.projectName ? (
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
              title={milestone.projectName}
            >
              <FolderKanban size={11} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {milestone.projectName}
              </span>
            </span>
          ) : (
            <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
          )}
        </div>

        {/* 4. Progress */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                color: "#64748b",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {milestone.itemsDone}/{milestone.itemsTotal} done
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#0f172a",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {milestone.progress}%
            </span>
          </div>
          <ProgressBar
            percent={milestone.progress}
            tone={
              milestone.status === "completed"
                ? "success"
                : milestone.status === "in_progress"
                ? "indigo"
                : "indigo"
            }
            height={4}
          />
        </div>

        {/* 5. Items Count */}
        <div
          style={{
            textAlign: "right",
            fontSize: 12,
            fontWeight: 600,
            color: "#0f172a",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {milestone.itemsDone}
          <span style={{ color: "#94a3b8", margin: "0 2px" }}>/</span>
          <span style={{ color: "#64748b", fontWeight: 500 }}>
            {milestone.itemsTotal}
          </span>
        </div>

        {/* 6. Dates */}
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
          <span>{dateRange(milestone.estStartDate, milestone.estEndDate)}</span>
          {open ? (
            <ChevronDown size={14} color="#94a3b8" style={{ marginLeft: "auto" }} />
          ) : (
            <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: "auto" }} />
          )}
        </div>
      </div>

      {/* Expanded Breakdown */}
      {open && (
        <div
          style={{
            padding: "12px 16px 16px 54px",
            background: "#f8fafc",
            borderBottom: isLast ? "none" : "1px solid #f1f5f9",
          }}
        >
          {milestone.items.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ListChecks size={12} />
                Breakdown ({milestone.itemsDone}/{milestone.itemsTotal})
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {milestone.items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 10px",
                      background: it.isCompleted ? "#ecfdf5" : "#ffffff",
                      border: `1px solid ${
                        it.isCompleted ? "#a7f3d0" : "#e2e8f0"
                      }`,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: it.isCompleted
                          ? "#047857"
                          : "#ffffff",
                        border: `1px solid ${
                          it.isCompleted ? "#047857" : "#cbd5e1"
                        }`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        flexShrink: 0,
                      }}
                    >
                      {it.isCompleted && <CheckSquare size={10} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#0f172a",
                          fontWeight: 500,
                          textDecoration: it.isCompleted
                            ? "line-through"
                            : "none",
                          opacity: it.isCompleted ? 0.7 : 1,
                        }}
                      >
                        {it.name}
                      </span>
                      {it.description && (
                        <div
                          style={{
                            marginTop: 1,
                            fontSize: 10.5,
                            color: "#64748b",
                          }}
                        >
                          {it.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#64748b" }}>
              No breakdown items attached to this milestone.
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component (Card View)                                     */
/* --------------------------------------------------------------- */

function MilestoneCard({ milestone }: { milestone: PortalMilestone }) {
  const [open, setOpen] = useState(false);
  const statusMeta = getStatusMeta(milestone.status);
  const timing = milestoneTiming(milestone);

  return (
    <div
      className="pm2-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px",
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
            <Flag size={13} />
          </div>
          {milestone.projectName && (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 10.5,
                fontWeight: 600,
                color: "#2563eb",
                background: "#eff6ff",
                padding: "2px 6px",
                borderRadius: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 160,
              }}
            >
              {milestone.projectName}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {timing && (
            <TimingChip
              tone={timing.tone}
              icon={timing.icon}
              label={timing.label}
            />
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
              color: statusMeta.color,
              background: statusMeta.bg,
            }}
          >
            {statusMeta.label}
          </Tag>
        </div>
      </div>

      {/* Name & Description */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
        >
          {milestone.name}
        </div>
        {milestone.description && (
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 4,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {milestone.description}
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              color: "#64748b",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {milestone.itemsDone}/{milestone.itemsTotal} items completed
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#0f172a",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {milestone.progress}%
          </span>
        </div>
        <ProgressBar
          percent={milestone.progress}
          tone={
            milestone.status === "completed"
              ? "success"
              : milestone.status === "in_progress"
              ? "indigo"
              : "indigo"
          }
          height={5}
        />
      </div>

      {/* Dates & Breakdown Toggle */}
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
          <Calendar size={12} color="#94a3b8" />
          <span>{dateRange(milestone.estStartDate, milestone.estEndDate)}</span>
        </div>

        {milestone.items.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              background: "transparent",
              border: "none",
              color: "#3b82f6",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: 0,
            }}
          >
            {open ? "Hide tasks" : `View ${milestone.items.length} tasks`}
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
      </div>

      {/* Expanded items */}
      {open && milestone.items.length > 0 && (
        <div
          style={{
            marginTop: 4,
            paddingTop: 8,
            borderTop: "1px dashed #e2e8f0",
            display: "grid",
            gap: 5,
          }}
        >
          {milestone.items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                background: it.isCompleted ? "#ecfdf5" : "#f8fafc",
                border: `1px solid ${
                  it.isCompleted ? "#a7f3d0" : "#e2e8f0"
                }`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: it.isCompleted ? "#047857" : "#ffffff",
                  border: `1px solid ${
                    it.isCompleted ? "#047857" : "#cbd5e1"
                  }`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                {it.isCompleted && <CheckSquare size={9} />}
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  color: "#0f172a",
                  fontWeight: 500,
                  textDecoration: it.isCompleted ? "line-through" : "none",
                  opacity: it.isCompleted ? 0.7 : 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {it.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
