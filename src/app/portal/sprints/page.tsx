"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Empty,
  Pagination,
  DatePicker,
  Button,
  Space,
  Tooltip,
  Typography,
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
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  Layers,
  Pause,
  Flag,
  Sparkles,
  Target,
  Clock,
  LayoutGrid,
  List as ListIcon,
  ArrowUpRight,
  Ban,
  Hash,
  X,
  Folder,
  CalendarCheck,
} from "lucide-react";
import {
  portalSprintService,
  PortalSprintListItem,
  PortalSprintMeta,
} from "@/services/portalSprintService";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";
import { FilterBar, FilterToggleButton } from "@/components/common/FilterBar";

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

/* --------------------------------------------------------------- */
/*  Theme palette                                                  */
/* --------------------------------------------------------------- */

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceTinted: "#fafbff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  borderHover: "#a5b4fc",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#0d9488",
  accentBg: "#f0fdfa",
  accentBorder: "#99f6e4",
  accentText: "#0f766e",
  indigo: "#4f46e5",
  indigoBg: "#eef2ff",
  indigoBorder: "#c7d2fe",
  indigoText: "#4338ca",
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
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_META: Record<
  string,
  {
    label: string;
    tone: "accent" | "success" | "warning" | "danger" | "neutral" | "indigo";
    icon: any;
  }
> = {
  planned: { label: "Planned", tone: "neutral", icon: Calendar },
  planning: { label: "Planning", tone: "neutral", icon: Calendar },
  active: { label: "Active", tone: "accent", icon: Activity },
  in_progress: { label: "In progress", tone: "accent", icon: Activity },
  paused: { label: "Paused", tone: "warning", icon: Pause },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  done: { label: "Completed", tone: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "neutral", icon: AlertTriangle },
};

const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  indigo: { bg: p.indigoBg, border: p.indigoBorder, text: p.indigoText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

const isActive = (s: string) =>
  s.toLowerCase() === "active" || s.toLowerCase() === "in_progress";
const isPlanning = (s: string) =>
  s.toLowerCase() === "planning" || s.toLowerCase() === "planned";
const isCompleted = (s: string) =>
  s.toLowerCase() === "completed" || s.toLowerCase() === "done";

function fmtDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
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

function sprintTiming(s: PortalSprintListItem):
  | { label: string; tone: "indigo" | "warning" | "danger" | "neutral" | "success" | "accent"; icon: any }
  | null {
  if (isCompleted(s.status) && s.completedAt) {
    const days = daysBetween(s.completedAt);
    if (days != null && days <= 0) {
      const ago = -days;
      return {
        label: ago === 0 ? "Shipped today" : `Shipped ${ago}d ago`,
        tone: "success",
        icon: CheckCircle2,
      };
    }
  }
  if (isActive(s.status) && s.endDate) {
    const days = daysBetween(s.endDate);
    if (days == null) return null;
    if (days < 0) {
      return {
        label: `${-days}d overdue`,
        tone: "danger",
        icon: AlertTriangle,
      };
    }
    if (days === 0) return { label: "Ends today", tone: "warning", icon: Clock };
    if (days <= 3) return { label: `${days}d left`, tone: "warning", icon: Clock };
    return { label: `${days}d left`, tone: "accent", icon: Clock };
  }
  if (isPlanning(s.status) && s.startDate) {
    const days = daysBetween(s.startDate);
    if (days == null) return null;
    if (days < 0) return null;
    if (days === 0) return { label: "Starts today", tone: "accent", icon: Clock };
    return { label: `Starts in ${days}d`, tone: "neutral", icon: Clock };
  }
  return null;
}

function StatusPill({ status, compact }: { status: string; compact?: boolean }) {
  const meta =
    STATUS_META[status.toLowerCase()] || {
      label: status,
      tone: "neutral" as const,
      icon: Layers,
    };
  const tone = TONE[meta.tone];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "1px 7px" : "2px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: compact ? 10.5 : 11,
        fontWeight: 600,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

function TimingChip({
  tone,
  icon: Icon,
  label,
  compact,
}: {
  tone: "indigo" | "warning" | "danger" | "neutral" | "success" | "accent";
  icon: any;
  label: string;
  compact?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: compact ? "1px 6px" : "1px 7px",
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.text,
        borderRadius: 999,
        fontSize: 10.5,
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

function SegmentedProgress({
  ticketCount,
  doneCount,
  blockedCount,
  height = 5,
}: {
  ticketCount: number;
  doneCount: number;
  blockedCount: number;
  height?: number;
}) {
  const total = Math.max(ticketCount, 1);
  const donePct = Math.min(100, (doneCount / total) * 100);
  const blockedPct = Math.min(100 - donePct, (blockedCount / total) * 100);
  const openPct = Math.max(0, 100 - donePct - blockedPct);
  return (
    <div
      style={{
        width: "100%",
        height,
        background: p.neutralBg,
        borderRadius: 999,
        overflow: "hidden",
        display: "flex",
      }}
    >
      {donePct > 0 && (
        <div
          style={{
            width: `${donePct}%`,
            background: p.success,
            transition: "width 200ms ease",
          }}
        />
      )}
      {blockedPct > 0 && (
        <div
          style={{
            width: `${blockedPct}%`,
            background: p.danger,
            transition: "width 200ms ease",
          }}
        />
      )}
      {openPct > 0 && ticketCount > 0 && (
        <div
          style={{
            width: `${openPct}%`,
            background: p.indigo,
            opacity: 0.22,
            transition: "width 200ms ease",
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

type ViewMode = "table" | "card";
const VIEW_STORAGE_KEY = "portal.sprints.view";

export default function PortalSprintsPage() {
  const [items, setItems] = useState<PortalSprintListItem[]>([]);
  const [meta, setMeta] = useState<PortalSprintMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [limit, setLimit] = useState(15);

  const fromIso = dateRange?.[0] ? dateRange[0]!.format("YYYY-MM-DD") : undefined;
  const toIso = dateRange?.[1] ? dateRange[1]!.format("YYYY-MM-DD") : undefined;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "card" || stored === "table") setViewMode(stored as ViewMode);
    } catch { }
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setViewMode(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch { }
  };

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalSprintService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        projectId,
        search: search || undefined,
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
  }, [page, limit, status, projectId, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const projectOptions: FilterPillOption[] = useMemo(() => {
    if (!meta?.projects) return [];
    return meta.projects.map((proj) => ({
      value: proj.id,
      label: proj.code ? `${proj.name} (${proj.code})` : proj.name,
    }));
  }, [meta?.projects]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "ALL") count++;
    if (projectId) count++;
    if (dateRange && (dateRange[0] || dateRange[1])) count++;
    return count;
  }, [status, projectId, dateRange]);

  const total = meta?.total ?? items.length;
  const activeCount =
    (meta?.counts?.active || 0) + (meta?.counts?.in_progress || 0) ||
    items.filter((s) => isActive(s.status)).length;
  const planningCount =
    (meta?.counts?.planning || 0) + (meta?.counts?.planned || 0) ||
    items.filter((s) => isPlanning(s.status)).length;
  const completedCount =
    (meta?.counts?.completed || 0) + (meta?.counts?.done || 0) ||
    items.filter((s) => isCompleted(s.status)).length;

  const totalCommittedPts = useMemo(
    () => items.reduce((a, s) => a + (s.committedPoints || 0), 0),
    [items],
  );
  const totalCompletedPts = useMemo(
    () => items.reduce((a, s) => a + (s.completedPoints || 0), 0),
    [items],
  );
  const velocityPct =
    totalCommittedPts > 0
      ? Math.round((totalCompletedPts / totalCommittedPts) * 100)
      : 0;

  const totalTickets = useMemo(
    () => items.reduce((a, s) => a + (s.ticketCount || 0), 0),
    [items],
  );
  const totalDoneTickets = useMemo(
    () => items.reduce((a, s) => a + (s.doneCount || 0), 0),
    [items],
  );
  const completionPct =
    totalTickets > 0
      ? Math.round((totalDoneTickets / totalTickets) * 100)
      : total > 0 && completedCount > 0
        ? Math.round((completedCount / total) * 100)
        : 0;

  const activeStatusLabel = useMemo(() => {
    if (status === "ALL") return "All Sprints";
    const found = STATUS_FILTER_OPTIONS.find(
      (opt) => opt.value.toLowerCase() === status.toLowerCase(),
    );
    return found ? found.label : status;
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

  // Featured current sprints: any active sprints, shown above the grid
  // only on the All tab with no search so we don't double-render filtered views.
  const currentSprints = useMemo(() => {
    if (search || status !== "ALL") return [];
    return items.filter((s) => isActive(s.status));
  }, [items, search, status]);

  const restItems = useMemo(() => {
    if (currentSprints.length === 0) return items;
    const ids = new Set(currentSprints.map((s) => s.id));
    return items.filter((s) => !ids.has(s.id));
  }, [items, currentSprints]);

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
      {/* ── Top Header Toolbar matching Invoices UI ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span
            className="pm2-head-ic"
            style={{
              background: "rgba(13, 148, 136, 0.1)",
              borderColor: "rgba(13, 148, 136, 0.2)",
              color: "#0d9488",
            }}
          >
            <CalendarCheck size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Sprints</span>
            <span className="pm2-head-sub">OVERSEE SPRINT CYCLES & PROGRESS</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search sprint name or goal..."
            prefix={<Search size={13} style={{ color: "var(--text-slate-400)", marginRight: 4 }} />}
            className="saas-input"
            style={{ maxWidth: 280, borderRadius: 8, height: 32, background: "transparent", fontSize: 12.5 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />

          <FilterToggleButton
            isOpen={isFilterRowOpen}
            onToggle={() => setIsFilterRowOpen((v) => !v)}
            activeCount={activeFilterCount}
          />

          {/* View Toggle */}
          <div className="premium-view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              data-active={viewMode === "table" ? "true" : "false"}
              onClick={() => setViewPersist("table")}
              title="Table View"
            >
              <ListIcon size={13} />
            </button>
            <button
              type="button"
              data-active={viewMode === "card" ? "true" : "false"}
              onClick={() => setViewPersist("card")}
              title="Card View"
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>

        <Space size={10} className="sc-header-right">
          <Tooltip title="Refresh sprints">
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
      <FilterBar
        isOpen={isFilterRowOpen}
        activeCount={activeFilterCount}
        onClose={() => setIsFilterRowOpen(false)}
        onReset={() => {
          setStatus("ALL");
          setProjectId(undefined);
          setDateRange(null);
          setPage(1);
        }}
      >
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
            icon={<Folder size={12} />}
            label="Project"
            value={projectId || ""}
            options={projectOptions}
            onChange={(val: any) => {
              setProjectId(val || undefined);
              setPage(1);
            }}
            itemNoun="projects"
            width={260}
            multiple={false}
          />
        )}

        {/* Date Range Picker */}
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates as [Dayjs | null, Dayjs | null] | null);
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
      </FilterBar>

      {/* ── Main Overview Banner (Sprint head style matching Invoices) ── */}
      <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{
                background: "#0d9488",
                boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.2)",
              }}
            />
            <span className="tl-sprint-title pm2-banner-title">
              Sprints — {activeStatusLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} SPRINTS
              </span>
              {activeCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {activeCount} ACTIVE
                </span>
              )}
              {planningCount > 0 && (
                <span
                  className="tl-sprint-tag"
                  style={{
                    color: "#475569",
                    borderColor: "rgba(100, 116, 139, 0.32)",
                  }}
                >
                  {planningCount} PLANNING
                </span>
              )}
              {completedCount > 0 && (
                <span
                  className="tl-sprint-tag"
                  style={{
                    color: "#059669",
                    borderColor: "rgba(5, 150, 105, 0.32)",
                  }}
                >
                  {completedCount} COMPLETED
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
            <b>{activeCount}</b> active
          </span>
          <span className="tl-sprint-meta">
            <b>{planningCount}</b> planning
          </span>
          <span className="tl-sprint-meta">
            <b>{completedCount}</b> completed
          </span>
          {totalCommittedPts > 0 && (
            <span className="tl-sprint-meta">
              <b>{totalCompletedPts}</b> / <b>{totalCommittedPts}</b> pts delivered ({velocityPct}%)
            </span>
          )}
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{
                width: `${Math.min(100, completionPct)}%`,
                background: "linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)",
              }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{completionPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-sprints-content"
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
                    ? "No sprints match your filter criteria."
                    : "No sprints yet."}
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
                  "minmax(220px, 1.8fr) minmax(180px, 1.8fr) 110px minmax(160px, 1.4fr) 100px 140px 36px",
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
              <div>SPRINT / PROJECT</div>
              <div>GOAL</div>
              <div>STATUS</div>
              <div>PROGRESS</div>
              <div style={{ textAlign: "right" }}>POINTS</div>
              <div>DATES</div>
              <div />
            </div>

            <div>
              {items.map((s, idx) => (
                <SprintRow
                  key={s.id}
                  sprint={s}
                  isLast={idx === items.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div style={{ padding: "16px 24px" }}>
            {/* Current sprint(s) — focused detail card(s) */}
            {currentSprints.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <SectionLabel
                  icon={Activity}
                  label="Current sprint"
                  count={currentSprints.length}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      currentSprints.length === 1
                        ? "1fr"
                        : "repeat(auto-fit, minmax(440px, 1fr))",
                    gap: 12,
                  }}
                >
                  {currentSprints.map((s) => (
                    <CurrentSprintCard key={s.id} sprint={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest of sprints heading when featured exists */}
            {currentSprints.length > 0 && restItems.length > 0 && (
              <SectionLabel icon={Layers} label="All sprints" count={restItems.length} />
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 12,
              }}
            >
              {restItems.map((s) => (
                <SprintCardCompact key={s.id} sprint={s} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer (matching Invoices UI) ── */}
      <div
        className="portal-sprints-pagination-footer"
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
            sprint{total !== 1 ? "s" : ""}
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
          color: #0d9488;
          background: rgba(13, 148, 136, 0.1);
          border: 1px solid rgba(13, 148, 136, 0.18);
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
        .tl-sprint-tag-done {
          background: transparent;
          color: #059669;
          border-color: rgba(5, 150, 105, 0.32);
        }
        .tl-sprint-tag-delayed {
          background: transparent;
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.32);
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
          background: linear-gradient(90deg, #0d9488, #14b8a6);
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
          color: #0d9488;
          border-color: rgba(13, 148, 136, 0.45);
          background: rgba(13, 148, 136, 0.06);
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
          background: #f1f5f9;
          color: #0f172a;
        }

        /* ── View toggle ── */
        .premium-view-toggle {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 2px;
        }
        .premium-view-toggle button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 24px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          transition: all 120ms ease;
        }
        .premium-view-toggle button:hover {
          color: #0d9488;
        }
        .premium-view-toggle button[data-active='true'] {
          background: #f0fdfa;
          color: #0d9488;
        }

        /* List row hover */
        .premium-sprint-row {
          transition: background 120ms ease;
        }
        .premium-sprint-row:hover {
          background: #f8fafc;
        }
        .premium-sprint-row:hover .premium-sprint-arrow {
          transform: translateX(2px);
          color: #0d9488;
        }
        .premium-sprint-arrow {
          transition: transform 140ms ease, color 140ms ease;
        }

        /* Compact sprint card hover */
        .premium-sprint-card {
          position: relative;
        }
        .premium-sprint-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: transparent;
          border-radius: 10px 0 0 10px;
          transition: background 120ms ease;
        }
        .premium-sprint-card[data-active='true']::before {
          background: #0d9488;
        }
        .premium-sprint-card[data-completed='true']::before {
          background: #10b981;
        }
        .premium-sprint-card:hover {
          border-color: #99f6e4 !important;
        }
        .premium-sprint-card:hover .premium-sprint-arrow {
          transform: translateX(2px);
          color: #0d9488;
        }

        /* Current sprint card hover */
        .premium-current-card:hover {
          border-color: #5eead4 !important;
        }
        .premium-current-card:hover .premium-current-cta {
          background: #0f766e;
          gap: 6px;
        }

        .saas-tag-blue {
          color: #0d9488 !important;
          border-color: #99f6e4 !important;
          background: #f0fdfa !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */

function SprintRow({
  sprint,
  isLast,
}: {
  sprint: PortalSprintListItem;
  isLast: boolean;
}) {
  const timing = sprintTiming(sprint);
  return (
    <Link
      href={`/portal/sprints/${sprint.id}`}
      className="premium-sprint-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(220px, 1.8fr) minmax(180px, 1.8fr) 110px minmax(160px, 1.4fr) 100px 140px 36px",
        minWidth: 920,
        gap: 12,
        padding: "12px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : `1px solid ${p.border}`,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Sprint / Project */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sprint.project.name}
          {sprint.project.code ? ` · ${sprint.project.code}` : ""}
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13.5,
            fontWeight: 700,
            color: p.text,
            letterSpacing: "-0.01em",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sprint.version}
        </div>
      </div>

      {/* Goal */}
      <div
        style={{
          fontSize: 12.5,
          color: sprint.goal ? p.textMuted : p.textFaint,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {sprint.goal || "—"}
      </div>

      {/* Status + timing */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <StatusPill status={sprint.status} compact />
        {timing && (
          <TimingChip
            tone={timing.tone}
            icon={timing.icon}
            label={timing.label}
            compact
          />
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
              fontSize: 11,
              color: p.textSubtle,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sprint.doneCount}/{sprint.ticketCount} tickets
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: p.text,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sprint.completionPercent}%
          </span>
        </div>
        <SegmentedProgress
          ticketCount={sprint.ticketCount}
          doneCount={sprint.doneCount}
          blockedCount={sprint.blockedCount}
          height={5}
        />
        {sprint.blockedCount > 0 && (
          <div
            style={{
              marginTop: 4,
              fontSize: 10.5,
              color: p.dangerText,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <AlertTriangle size={10} />
            {sprint.blockedCount} blocker{sprint.blockedCount === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {/* Points */}
      <div
        style={{
          textAlign: "right",
          fontSize: 12.5,
          fontWeight: 600,
          color: p.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{sprint.completedPoints}</span>
        <span style={{ color: p.textFaint, margin: "0 2px" }}>/</span>
        <span style={{ color: p.textMuted, fontWeight: 500 }}>
          {sprint.committedPoints}
        </span>
      </div>

      {/* Dates */}
      <div
        style={{
          fontSize: 12,
          color: p.textSubtle,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontWeight: 500,
        }}
      >
        <Calendar size={12} color={p.textFaint} />
        {dateRange(sprint.startDate, sprint.endDate)}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChevronRight
          size={15}
          color={p.textFaint}
          className="premium-sprint-arrow"
        />
      </div>
    </Link>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  count,
}: {
  icon: any;
  label: string;
  count?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <Icon size={13} color={p.accent} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: p.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
        }}
      >
        {label}
      </span>
      {count != null && (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: p.textSubtle,
            padding: "0 6px",
            background: p.neutralBg,
            borderRadius: 999,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      )}
      <div
        style={{
          flex: 1,
          height: 1,
          background: p.neutralBorder,
          marginLeft: 2,
        }}
      />
    </div>
  );
}

function SprintCardCompact({ sprint }: { sprint: PortalSprintListItem }) {
  const timing = sprintTiming(sprint);
  const active = isActive(sprint.status);
  const completed = isCompleted(sprint.status);

  return (
    <Link
      href={`/portal/sprints/${sprint.id}`}
      className="premium-sprint-card"
      data-active={active ? "true" : "false"}
      data-completed={completed ? "true" : "false"}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 16px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 140ms ease, box-shadow 140ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sprint.project.name}
            {sprint.project.code ? ` · ${sprint.project.code}` : ""}
          </div>
          <div
            style={{
              marginTop: 2,
              display: "flex",
              alignItems: "baseline",
              gap: 7,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13.5,
                fontWeight: 700,
                color: p.text,
                letterSpacing: "-0.01em",
              }}
            >
              {sprint.version}
            </span>
            {timing && (
              <TimingChip
                tone={timing.tone}
                icon={timing.icon}
                label={timing.label}
                compact
              />
            )}
          </div>
        </div>
        <StatusPill status={sprint.status} compact />
      </div>

      {sprint.goal && (
        <div
          style={{
            fontSize: 12,
            color: p.textMuted,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <Flag
            size={10}
            color={p.textFaint}
            style={{ verticalAlign: -1, marginRight: 4 }}
          />
          {sprint.goal}
        </div>
      )}

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
              color: p.textSubtle,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sprint.doneCount}/{sprint.ticketCount} tickets
          </span>
          <span
            style={{
              fontSize: 11,
              color: p.text,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sprint.completionPercent}%
          </span>
        </div>
        <SegmentedProgress
          ticketCount={sprint.ticketCount}
          doneCount={sprint.doneCount}
          blockedCount={sprint.blockedCount}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 10.5,
          color: p.textSubtle,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            gap: 3,
            alignItems: "center",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Sparkles size={10} color={p.accent} />
          {sprint.completedPoints}/{sprint.committedPoints} pts
        </span>
        {sprint.blockedCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              gap: 3,
              alignItems: "center",
              color: p.dangerText,
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={10} />
            {sprint.blockedCount}
          </span>
        )}
        <span
          style={{
            display: "inline-flex",
            gap: 3,
            alignItems: "center",
            fontWeight: 500,
          }}
        >
          <Calendar size={10} />
          {dateRange(sprint.startDate, sprint.endDate)}
        </span>
      </div>
    </Link>
  );
}

function CurrentSprintCard({ sprint }: { sprint: PortalSprintListItem }) {
  const timing = sprintTiming(sprint);
  const openCount = Math.max(
    0,
    sprint.ticketCount - sprint.doneCount - sprint.blockedCount,
  );
  const endDays =
    sprint.endDate != null ? daysBetween(sprint.endDate) : null;

  return (
    <Link
      href={`/portal/sprints/${sprint.id}`}
      className="premium-current-card"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "16px 18px 16px 22px",
        background:
          "linear-gradient(180deg, #fafbff 0%, #ffffff 70%)",
        border: `1px solid ${p.accentBorder}`,
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        transition: "border-color 140ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${p.accent}, ${p.accentText})`,
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sprint.project.name}
            {sprint.project.code ? ` · ${sprint.project.code}` : ""}
          </div>
          <div
            style={{
              marginTop: 3,
              display: "flex",
              alignItems: "baseline",
              gap: 9,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 18,
                fontWeight: 700,
                color: p.text,
                letterSpacing: "-0.02em",
              }}
            >
              {sprint.version}
            </span>
            {timing && (
              <TimingChip
                tone={timing.tone}
                icon={timing.icon}
                label={timing.label}
              />
            )}
          </div>
        </div>
        <span
          className="premium-current-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 11px",
            background: p.accent,
            color: "#ffffff",
            borderRadius: 7,
            fontSize: 11.5,
            fontWeight: 600,
            flexShrink: 0,
            transition: "background 140ms ease, gap 140ms ease",
          }}
        >
          Open
          <ArrowUpRight size={12} />
        </span>
      </div>

      {/* Goal */}
      {sprint.goal && (
        <div
          style={{
            fontSize: 12.5,
            color: p.textMuted,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <Flag
            size={11}
            color={p.accent}
            style={{ verticalAlign: -1, marginRight: 5 }}
          />
          {sprint.goal}
        </div>
      )}

      {/* Progress */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Legend dot={p.success} label={`${sprint.doneCount} done`} />
            {sprint.blockedCount > 0 && (
              <Legend
                dot={p.danger}
                label={`${sprint.blockedCount} blocked`}
              />
            )}
            {openCount > 0 && (
              <Legend
                dot={p.indigo}
                dotOpacity={0.45}
                label={`${openCount} open`}
              />
            )}
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: p.text,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {sprint.completionPercent}%
          </span>
        </div>
        <SegmentedProgress
          ticketCount={sprint.ticketCount}
          doneCount={sprint.doneCount}
          blockedCount={sprint.blockedCount}
          height={7}
        />
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          background: p.surface,
          border: `1px solid ${p.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <CurrentStat
          icon={Hash}
          label="Tickets"
          value={`${sprint.doneCount}/${sprint.ticketCount}`}
          tone={p.text}
        />
        <CurrentStat
          icon={Sparkles}
          label="Points"
          value={`${sprint.completedPoints}/${sprint.committedPoints}`}
          tone={p.accentText}
          divider
        />
        <CurrentStat
          icon={Ban}
          label="Blockers"
          value={String(sprint.blockedCount)}
          tone={sprint.blockedCount > 0 ? p.dangerText : p.text}
          divider
        />
        <CurrentStat
          icon={Calendar}
          label={
            endDays != null && endDays >= 0
              ? "Ends in"
              : endDays != null && endDays < 0
                ? "Overdue"
                : "Ends"
          }
          value={
            endDays == null
              ? fmtDateShort(sprint.endDate)
              : endDays > 0
                ? `${endDays}d`
                : endDays === 0
                  ? "today"
                  : `${-endDays}d`
          }
          tone={
            endDays != null && endDays < 0
              ? p.dangerText
              : endDays != null && endDays <= 3
                ? p.warningText
                : p.text
          }
          divider
        />
      </div>
    </Link>
  );
}

function Legend({
  dot,
  dotOpacity = 1,
  label,
}: {
  dot: string;
  dotOpacity?: number;
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color: p.textMuted,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 2,
          background: dot,
          opacity: dotOpacity,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

function CurrentStat({
  icon: Icon,
  label,
  value,
  tone,
  divider,
}: {
  icon: any;
  label: string;
  value: string;
  tone: string;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        padding: "9px 12px",
        borderLeft: divider ? `1px solid ${p.border}` : "none",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 9.5,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <Icon size={10} />
        {label}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 13,
          fontWeight: 700,
          color: tone,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}
