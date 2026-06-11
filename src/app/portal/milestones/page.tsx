"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spin, Select, DatePicker, Row, Col, Divider, Typography } from "antd";
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
  X,
  LayoutGrid,
  List as ListIcon,
  Folder,
  CalendarRange,
  SlidersHorizontal,
  Target,
  AlertTriangle,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  portalMilestoneService,
  PortalMilestone,
  PortalMilestoneStatus,
} from "@/services/portalMilestoneService";

dayjs.extend(quarterOfYear);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceTinted: "#fafbff",
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
  indigo: "#4f46e5",
  indigoBg: "#eef2ff",
  indigoBorder: "#c7d2fe",
  indigoText: "#4338ca",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  success: "#059669",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  warning: "#d97706",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  danger: "#dc2626",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const STATUS_META: Record<
  PortalMilestoneStatus,
  {
    label: string;
    icon: any;
    bg: string;
    border: string;
    color: string;
  }
> = {
  not_started: {
    label: "Not started",
    icon: Circle,
    bg: p.neutralBg,
    border: p.neutralBorder,
    color: p.neutralText,
  },
  in_progress: {
    label: "In progress",
    icon: Clock,
    bg: p.indigoBg,
    border: p.indigoBorder,
    color: p.indigoText,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bg: p.successBg,
    border: p.successBorder,
    color: p.successText,
  },
  on_hold: {
    label: "On hold",
    icon: PauseCircle,
    bg: p.purpleBg,
    border: p.purpleBorder,
    color: p.purpleText,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bg: p.dangerBg,
    border: p.dangerBorder,
    color: p.dangerText,
  },
};

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "not_started", label: "Not started" },
  { key: "completed", label: "Completed" },
  { key: "on_hold", label: "On hold" },
  { key: "cancelled", label: "Cancelled" },
];

function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
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

function StatusPill({
  status,
  compact,
}: {
  status: PortalMilestoneStatus;
  compact?: boolean;
}) {
  const meta = STATUS_META[status] || STATUS_META.not_started;
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "1px 7px" : "2px 8px",
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.color,
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
}: {
  tone: "indigo" | "warning" | "danger" | "neutral" | "success";
  icon: any;
  label: string;
}) {
  const toneMap = {
    indigo: { bg: p.indigoBg, border: p.indigoBorder, color: p.indigoText },
    warning: { bg: p.warningBg, border: p.warningBorder, color: p.warningText },
    danger: { bg: p.dangerBg, border: p.dangerBorder, color: p.dangerText },
    neutral: { bg: p.neutralBg, border: p.neutralBorder, color: p.neutralText },
    success: { bg: p.successBg, border: p.successBorder, color: p.successText },
  };
  const t = toneMap[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 7px",
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
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
    tone === "success" ? p.success : tone === "warning" ? p.warning : p.indigo;
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div
      style={{
        width: "100%",
        height,
        background: p.neutralBg,
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

type ViewMode = "card" | "list";
const VIEW_STORAGE_KEY = "portal.milestones.view";

export default function PortalMilestonesPage() {
  const [items, setItems] = useState<PortalMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [view, setView] = useState<ViewMode>("card");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "card" || stored === "list") setView(stored);
    } catch {}
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portalMilestoneService
      .list()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Projects derived from loaded milestones — only include ones with a real
  // name so the filter never shows raw IDs.
  const projects = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const m of items) {
      if (m.projectId && m.projectName && !seen.has(m.projectId)) {
        seen.set(m.projectId, {
          id: m.projectId,
          name: m.projectName,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [items]);

  // Date range overlap (milestone overlaps the picked window)
  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : null;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : null;

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (status !== "ALL" && m.status !== status) return false;
      if (projectId && m.projectId !== projectId) return false;
      if (q) {
        const haystack = `${m.name} ${m.description || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (fromIso || toIso) {
        const ms = m.estStartDate || null;
        const me = m.estEndDate || null;
        if (!ms && !me) return false;
        const effEnd = me || ms;
        const effStart = ms || me;
        if (fromIso && effEnd && effEnd < fromIso) return false;
        if (toIso && effStart && effStart > toIso) return false;
      }
      return true;
    });
  }, [items, status, projectId, search, fromIso, toIso]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: items.length,
      in_progress: 0,
      not_started: 0,
      completed: 0,
      on_hold: 0,
      cancelled: 0,
    };
    for (const m of items) c[m.status] = (c[m.status] || 0) + 1;
    return c;
  }, [items]);

  // Featured "Current milestones" — in_progress, only on All tab with no filters
  const hasAnyFilter =
    status !== "ALL" || !!projectId || !!search || !!fromIso || !!toIso;
  const currentMilestones = useMemo(() => {
    if (hasAnyFilter) return [];
    return filteredAll.filter((m) => m.status === "in_progress");
  }, [filteredAll, hasAnyFilter]);

  const restItems = useMemo(() => {
    if (currentMilestones.length === 0) return filteredAll;
    const ids = new Set(currentMilestones.map((m) => m.id));
    return filteredAll.filter((m) => !ids.has(m.id));
  }, [filteredAll, currentMilestones]);

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Workstation Header */}
      <div
        className="saas-header-container portal-milestones-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(67, 56, 202, 0.08))",
                    color: p.indigo,
                    border: `1px solid ${p.indigoBorder}`,
                  }}
                >
                  <Flag size={17} color={p.indigo} />
                </div>
                <Title
                  level={4}
                  className="portal-milestones-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Milestones
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
                  className="portal-milestones-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600,
                  }}
                >
                  Where each milestone of your delivery stands today, with a transparent breakdown of the work behind it.
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <div
        className="portal-milestones-content-container"
        style={{ padding: "20px 40px 56px", maxWidth: 1280 }}
      >
        {/* Tabs + view toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTER_TABS.map((tab) => {
              const active = status === tab.key;
              const count = statusCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  className="premium-filter-tab"
                  data-active={active ? "true" : "false"}
                  onClick={() => setStatus(tab.key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 11px",
                    background: active ? p.indigo : p.surfaceElevated,
                    color: active ? "#ffffff" : p.textMuted,
                    border: `1px solid ${active ? p.indigo : p.border}`,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: active
                          ? "rgba(255,255,255,0.18)"
                          : p.neutralBg,
                        color: active ? "#ffffff" : p.textSubtle,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <ViewToggle view={view} onChange={setViewPersist} />
        </div>

        {/* Premium filter bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          projects={projects}
          projectId={projectId}
          onProjectChange={setProjectId}
          datePicked={datePicked}
          onDateChange={setDatePicked}
        />

        {/* Active filter chips */}
        <ActiveFilterChips
          search={search}
          onClearSearch={() => setSearch("")}
          projectName={
            projectId
              ? projects.find((pr) => pr.id === projectId)?.name
              : undefined
          }
          onClearProject={() => setProjectId(undefined)}
          datePicked={datePicked}
          onClearDateRange={() => setDatePicked(null)}
          statusFilter={status !== "ALL" ? status : undefined}
          onClearStatus={() => setStatus("ALL")}
        />

        {/* Current milestones (in_progress) — shown only when no active filters */}
        {!loading && currentMilestones.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel
              icon={Activity}
              label="In progress now"
              count={currentMilestones.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  currentMilestones.length === 1
                    ? "1fr"
                    : "repeat(auto-fit, minmax(440px, 1fr))",
                gap: 12,
              }}
            >
              {currentMilestones.map((m) => (
                <CurrentMilestoneCard key={m.id} milestone={m} />
              ))}
            </div>
          </div>
        )}

        {/* Body label when featured exists */}
        {!loading && currentMilestones.length > 0 && restItems.length > 0 && (
          <SectionLabel
            icon={ListChecks}
            label="All milestones"
            count={restItems.length}
          />
        )}

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px solid ${p.border}`,
              borderRadius: 12,
            }}
          >
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            body="Your delivery plan hasn't been set up yet. Your account team will publish it here soon."
          />
        ) : filteredAll.length === 0 ? (
          <EmptyState
            title={
              search
                ? `No milestones match "${search}"`
                : "No milestones match these filters"
            }
            body="Try clearing or adjusting the filters above."
          />
        ) : restItems.length === 0 ? null : view === "card" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
              gap: 12,
            }}
          >
            {restItems.map((m) => (
              <MilestoneCardCompact key={m.id} milestone={m} />
            ))}
          </div>
        ) : (
          <MilestoneList items={restItems} />
        )}

        <style jsx global>{`
          .portal-milestones-header-container,
          [data-theme='dark'] .portal-milestones-header-container,
          [data-theme='dark'] .saas-header-container.portal-milestones-header-container,
          .saas-header-container.portal-milestones-header-container {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .portal-milestones-header-title {
            color: #0f172a !important;
          }
          .portal-milestones-header-desc {
            color: #475569 !important;
          }

          .ant-input, .ant-select-selector, .ant-input-affix-wrapper, .ant-input-textarea, textarea.ant-input {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .ant-input::placeholder, .ant-select-selection-placeholder {
            color: #94a3b8 !important;
          }
          .ant-select-selection-item {
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper .ant-input {
            background-color: transparent !important;
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper:hover, .ant-input:hover, .ant-select-selector:hover {
            border-color: #cbd5e1 !important;
          }
          .ant-input-affix-wrapper-focused, .ant-input-focused, .ant-select-focused .ant-select-selector {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          }
          .ant-select-arrow {
            color: #94a3b8 !important;
          }

          /* Premium search input */
          .premium-search:hover {
            border-color: #cbd5e1 !important;
          }
          .premium-search[data-focused='true']:hover {
            border-color: #4f46e5 !important;
          }
          .premium-search input::placeholder {
            color: #94a3b8;
            font-weight: 500;
          }

          /* Premium select */
          .premium-select .ant-select-selector {
            height: 34px !important;
            padding: 0 11px !important;
            border-radius: 8px !important;
            border-color: #e5e7eb !important;
            display: flex;
            align-items: center;
          }
          .premium-select .ant-select-selection-search-input,
          .premium-select .ant-select-selection-item,
          .premium-select .ant-select-selection-placeholder {
            line-height: 32px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
          }
          .premium-select.ant-select-focused .ant-select-selector,
          .premium-select .ant-select-selector:hover {
            border-color: #a5b4fc !important;
          }
          .premium-select.ant-select-focused .ant-select-selector {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
          }
          .premium-select .ant-select-arrow {
            right: 11px;
          }

          /* Premium range picker */
          .premium-rangepicker.ant-picker {
            height: 34px !important;
            padding: 0 11px !important;
            border-radius: 8px !important;
            border-color: #e5e7eb !important;
          }
          .premium-rangepicker.ant-picker:hover {
            border-color: #a5b4fc !important;
          }
          .premium-rangepicker.ant-picker-focused {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
          }
          .premium-rangepicker .ant-picker-input > input {
            font-size: 13px !important;
            font-weight: 500 !important;
            color: #0f172a !important;
          }
          .premium-rangepicker .ant-picker-input > input::placeholder {
            color: #94a3b8 !important;
            font-weight: 500 !important;
          }
          .premium-rangepicker .ant-picker-range-separator {
            padding: 0 6px !important;
          }
          .ant-picker-presets > ul > li {
            font-size: 12.5px !important;
            font-weight: 500 !important;
            color: #475569 !important;
            border-radius: 6px !important;
          }
          .ant-picker-presets > ul > li:hover {
            background: #eef2ff !important;
            color: #4338ca !important;
          }

          /* Filter chips */
          .premium-filter-chip button:hover {
            background: rgba(67, 56, 202, 0.12) !important;
          }
          .premium-clear-all:hover {
            text-decoration: underline;
          }

          /* Filter tab hover */
          .premium-filter-tab[data-active='false']:hover {
            border-color: #a5b4fc !important;
            color: #4338ca !important;
          }

          /* Milestone card hover + accent */
          .premium-ms-card {
            position: relative;
          }
          .premium-ms-card::before {
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
          .premium-ms-card[data-state='in_progress']::before {
            background: #4f46e5;
          }
          .premium-ms-card[data-state='completed']::before {
            background: #a7f3d0;
          }
          .premium-ms-card[data-state='on_hold']::before {
            background: #ddd6fe;
          }
          .premium-ms-card:hover {
            border-color: #a5b4fc !important;
          }

          /* List row hover */
          .premium-ms-row {
            transition: background 120ms ease;
          }
          .premium-ms-row:hover {
            background: #fafbff;
          }
          .premium-ms-row:hover .premium-ms-arrow {
            transform: translateX(2px);
            color: #4f46e5;
          }
          .premium-ms-arrow {
            transition: transform 140ms ease, color 140ms ease;
          }

          /* Featured card */
          .premium-current-ms-card:hover {
            border-color: #818cf8 !important;
          }
          .premium-current-ms-card:hover .premium-current-ms-cta {
            background: #4338ca;
            gap: 6px;
          }

          /* View toggle */
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
            color: #4338ca;
          }
          .premium-view-toggle button[data-active='true'] {
            background: #eef2ff;
            color: #4338ca;
          }

          @media (max-width: 640px) {
            .portal-milestones-header-container,
            .saas-header-container.portal-milestones-header-container {
              padding: 12px 16px !important;
            }
            .portal-milestones-content-container {
              padding: 16px 16px 40px !important;
            }
            .portal-milestones-current-stats {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="premium-view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        data-active={view === "card" ? "true" : "false"}
        onClick={() => onChange("card")}
        title="Card view"
        aria-label="Card view"
      >
        <LayoutGrid size={13} />
      </button>
      <button
        type="button"
        data-active={view === "list" ? "true" : "false"}
        onClick={() => onChange("list")}
        title="List view"
        aria-label="List view"
      >
        <ListIcon size={13} />
      </button>
    </div>
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
      <Icon size={13} color={p.indigo} />
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

function FilterBar({
  search,
  onSearchChange,
  projects,
  projectId,
  onProjectChange,
  datePicked,
  onDateChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  projects: { id: string; name: string }[];
  projectId: string | undefined;
  onProjectChange: (v: string | undefined) => void;
  datePicked: [Dayjs | null, Dayjs | null] | null;
  onDateChange: (r: [Dayjs | null, Dayjs | null] | null) => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const today = dayjs();
  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Last 7 days", value: [today.subtract(6, "day"), today] },
    { label: "Last 30 days", value: [today.subtract(29, "day"), today] },
    { label: "This month", value: [today.startOf("month"), today.endOf("month")] },
    {
      label: "Last month",
      value: [
        today.subtract(1, "month").startOf("month"),
        today.subtract(1, "month").endOf("month"),
      ],
    },
    { label: "This quarter", value: [today.startOf("quarter"), today.endOf("quarter")] },
    { label: "Next 30 days", value: [today, today.add(30, "day")] },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "stretch",
        flexWrap: "wrap",
        marginBottom: 10,
      }}
    >
      <div
        className="premium-search"
        data-focused={searchFocused ? "true" : "false"}
        style={{
          flex: "1 1 280px",
          minWidth: 240,
          maxWidth: 480,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 34,
          padding: "0 10px 0 12px",
          background: p.surface,
          border: `1px solid ${searchFocused ? p.indigo : p.border}`,
          borderRadius: 8,
          boxShadow: searchFocused
            ? "0 0 0 3px rgba(99, 102, 241, 0.12)"
            : "none",
          transition: "border-color 140ms ease, box-shadow 140ms ease",
        }}
      >
        <Search
          size={14}
          color={searchFocused ? p.indigo : p.textFaint}
          style={{ flexShrink: 0, transition: "color 140ms ease" }}
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search milestone or description…"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: p.text,
            fontSize: 13,
            fontWeight: 500,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            style={{
              flexShrink: 0,
              width: 18,
              height: 18,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: p.neutralBg,
              border: "none",
              borderRadius: 999,
              color: p.textSubtle,
              cursor: "pointer",
            }}
          >
            <X size={11} />
          </button>
        )}
        <kbd
          aria-hidden
          style={{
            flexShrink: 0,
            display: search ? "none" : "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 18,
            minWidth: 22,
            padding: "0 5px",
            background: p.surfaceMuted,
            border: `1px solid ${p.border}`,
            borderRadius: 4,
            color: p.textFaint,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          /
        </kbd>
      </div>

      <Select
        allowClear
        showSearch
        placeholder={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.textSubtle,
              fontWeight: 500,
            }}
          >
            <Folder size={13} color={p.textFaint} />
            {projects.length > 0
              ? `All projects · ${projects.length}`
              : "Projects"}
          </span>
        }
        suffixIcon={<Folder size={13} color={p.textFaint} />}
        value={projectId}
        onChange={(v) => onProjectChange(v)}
        optionFilterProp="label"
        className="premium-select"
        style={{ width: 220, height: 34 }}
        options={projects.map((proj) => ({
          value: proj.id,
          label: proj.name,
        }))}
        notFoundContent={
          <div style={{ padding: 8, fontSize: 12, color: p.textSubtle }}>
            No projects available
          </div>
        }
      />

      <RangePicker
        value={datePicked as any}
        onChange={(r) => onDateChange(r as any)}
        format="MMM D, YYYY"
        allowEmpty={[true, true]}
        placeholder={["From", "To"]}
        className="premium-rangepicker"
        suffixIcon={<CalendarRange size={13} color={p.textFaint} />}
        separator={<span style={{ color: p.textFaint }}>→</span>}
        presets={rangePresets}
        style={{ height: 34 }}
      />
    </div>
  );
}

function ActiveFilterChips({
  search,
  onClearSearch,
  projectName,
  onClearProject,
  datePicked,
  onClearDateRange,
  statusFilter,
  onClearStatus,
}: {
  search: string;
  onClearSearch: () => void;
  projectName: string | undefined;
  onClearProject: () => void;
  datePicked: [Dayjs | null, Dayjs | null] | null;
  onClearDateRange: () => void;
  statusFilter: string | undefined;
  onClearStatus: () => void;
}) {
  const hasDates = !!(datePicked && (datePicked[0] || datePicked[1]));
  const any = !!search || !!projectName || hasDates || !!statusFilter;
  if (!any) return null;

  const dateLabel = hasDates
    ? `${datePicked?.[0] ? datePicked[0].format("MMM D") : "Any"} → ${
        datePicked?.[1] ? datePicked[1].format("MMM D, YYYY") : "Any"
      }`
    : "";

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginRight: 2,
        }}
      >
        <SlidersHorizontal size={11} />
        Active
      </span>
      {statusFilter && (
        <FilterChip
          icon={Activity}
          label={`Status: ${statusFilter.replace("_", " ")}`}
          onClear={onClearStatus}
        />
      )}
      {projectName && (
        <FilterChip
          icon={Folder}
          label={`Project: ${projectName}`}
          onClear={onClearProject}
        />
      )}
      {hasDates && (
        <FilterChip
          icon={CalendarRange}
          label={dateLabel}
          onClear={onClearDateRange}
        />
      )}
      {search && (
        <FilterChip
          icon={Search}
          label={`"${search}"`}
          onClear={onClearSearch}
        />
      )}
      <button
        type="button"
        onClick={() => {
          if (search) onClearSearch();
          if (projectName) onClearProject();
          if (hasDates) onClearDateRange();
          if (statusFilter) onClearStatus();
        }}
        className="premium-clear-all"
        style={{
          marginLeft: 4,
          padding: "2px 8px",
          background: "transparent",
          border: "none",
          color: p.indigoText,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Clear all
      </button>
    </div>
  );
}

function FilterChip({
  icon: Icon,
  label,
  onClear,
}: {
  icon: any;
  label: string;
  onClear: () => void;
}) {
  return (
    <span
      className="premium-filter-chip"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 4px 3px 9px",
        background: p.indigoBg,
        border: `1px solid ${p.indigoBorder}`,
        color: p.indigoText,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1.2,
      }}
    >
      <Icon size={10} />
      <span
        style={{
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove filter"
        style={{
          width: 16,
          height: 16,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderRadius: 999,
          color: p.indigoText,
          cursor: "pointer",
        }}
      >
        <X size={10} />
      </button>
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: 56,
        textAlign: "center",
        background: p.surfaceTinted,
        border: `1px dashed ${p.neutralBorder}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: p.surface,
          border: `1px solid ${p.border}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Target size={18} color={p.textFaint} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: p.textSubtle, marginTop: 4 }}>
        {body}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function CurrentMilestoneCard({ milestone }: { milestone: PortalMilestone }) {
  const timing = milestoneTiming(milestone);
  const endDays = milestone.estEndDate
    ? daysBetween(milestone.estEndDate)
    : null;
  const remaining = Math.max(0, milestone.itemsTotal - milestone.itemsDone);

  return (
    <div
      className="premium-current-ms-card"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "16px 18px 16px 22px",
        background: "linear-gradient(180deg, #fafbff 0%, #ffffff 70%)",
        border: `1px solid ${p.indigoBorder}`,
        borderRadius: 12,
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
          background: `linear-gradient(180deg, ${p.indigo}, ${p.accent})`,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {milestone.projectName && (
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
              {milestone.projectName}
            </div>
          )}
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
                fontSize: 16,
                fontWeight: 700,
                color: p.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {milestone.name}
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
          className="premium-current-ms-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 11px",
            background: p.indigo,
            color: "#ffffff",
            borderRadius: 7,
            fontSize: 11.5,
            fontWeight: 600,
            flexShrink: 0,
            transition: "background 140ms ease, gap 140ms ease",
          }}
        >
          View details
          <ArrowUpRight size={12} />
        </span>
      </div>

      {milestone.description && (
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
          {milestone.description}
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
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textMuted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {milestone.itemsDone} of {milestone.itemsTotal} items complete
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: p.text,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {milestone.progress}%
          </span>
        </div>
        <ProgressBar percent={milestone.progress} tone="indigo" height={7} />
      </div>

      {/* Stats strip */}
      <div
        className="portal-milestones-current-stats"
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
          icon={ListChecks}
          label="Done"
          value={`${milestone.itemsDone}/${milestone.itemsTotal}`}
          tone={p.text}
        />
        <CurrentStat
          icon={Circle}
          label="Remaining"
          value={String(remaining)}
          tone={p.indigoText}
          divider
        />
        <CurrentStat
          icon={Calendar}
          label="Started"
          value={fmtDateShort(milestone.estStartDate)}
          tone={p.text}
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
              ? fmtDateShort(milestone.estEndDate)
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
    </div>
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

/* --------------------------------------------------------------- */

function MilestoneCardCompact({ milestone }: { milestone: PortalMilestone }) {
  const [open, setOpen] = useState(false);
  const timing = milestoneTiming(milestone);

  return (
    <div
      className="premium-ms-card"
      data-state={milestone.status}
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 140ms ease",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 9,
          padding: "12px 14px 12px 15px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "inherit",
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
            {milestone.projectName && (
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
                <FolderKanban
                  size={10}
                  style={{ verticalAlign: -1, marginRight: 4 }}
                />
                {milestone.projectName}
              </div>
            )}
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
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: p.text,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.3,
                }}
              >
                {milestone.name}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <StatusPill status={milestone.status} compact />
            {open ? (
              <ChevronDown size={14} color={p.textFaint} />
            ) : (
              <ChevronRight size={14} color={p.textFaint} />
            )}
          </div>
        </div>

        {milestone.description && !open && (
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
            {milestone.description}
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
              {milestone.itemsDone}/{milestone.itemsTotal} items
            </span>
            <span
              style={{
                fontSize: 11,
                color: p.text,
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
              gap: 4,
              alignItems: "center",
              fontWeight: 500,
            }}
          >
            <Calendar size={10} />
            {dateRange(milestone.estStartDate, milestone.estEndDate)}
          </span>
          {milestone.actualEndDate && (
            <span
              style={{
                display: "inline-flex",
                gap: 4,
                alignItems: "center",
                color: p.successText,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={10} />
              Delivered {fmtDateShort(milestone.actualEndDate)}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div
          style={{
            padding: "0 14px 14px 15px",
            borderTop: `1px solid ${p.border}`,
          }}
        >
          {milestone.description && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                borderRadius: 8,
                fontSize: 12.5,
                color: p.textMuted,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {milestone.description}
            </div>
          )}
          {milestone.items.length > 0 && (
            <>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ListChecks size={11} />
                Breakdown
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {milestone.items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      background: it.isCompleted
                        ? p.successBg
                        : p.surfaceMuted,
                      border: `1px solid ${
                        it.isCompleted ? p.successBorder : p.border
                      }`,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        background: it.isCompleted
                          ? p.successText
                          : p.surfaceElevated,
                        border: `1px solid ${
                          it.isCompleted ? p.successText : p.borderStrong
                        }`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        flexShrink: 0,
                      }}
                    >
                      {it.isCompleted && <CheckSquare size={11} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: p.text,
                          fontWeight: 500,
                          textDecoration: it.isCompleted
                            ? "line-through"
                            : "none",
                          opacity: it.isCompleted ? 0.7 : 1,
                        }}
                      >
                        {it.name}
                      </div>
                      {it.description && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 11,
                            color: p.textSubtle,
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
          )}
        </div>
      )}
    </div>
  );
}

function MilestoneList({ items }: { items: PortalMilestone[] }) {
  return (
    <div
      style={{
        background: p.surface,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(220px, 1.8fr) minmax(140px, 1fr) 110px minmax(180px, 1.4fr) 90px 130px 16px",
          minWidth: 860,
          gap: 12,
          padding: "8px 16px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          fontSize: 10,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <div>Milestone</div>
        <div>Project</div>
        <div>Status</div>
        <div>Progress</div>
        <div style={{ textAlign: "right" }}>Items</div>
        <div>Dates</div>
        <div />
      </div>
      {items.map((m, idx) => (
        <MilestoneRow
          key={m.id}
          milestone={m}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
}

function MilestoneRow({
  milestone,
  isLast,
}: {
  milestone: PortalMilestone;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timing = milestoneTiming(milestone);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="premium-ms-row"
        style={{
          width: "100%",
          textAlign: "left",
          display: "grid",
          gridTemplateColumns:
            "minmax(220px, 1.8fr) minmax(140px, 1fr) 110px minmax(180px, 1.4fr) 90px 130px 16px",
          minWidth: 860,
          gap: 12,
          padding: "11px 16px",
          alignItems: "center",
          background: "transparent",
          border: "none",
          borderBottom: isLast && !open ? "none" : `1px solid ${p.border}`,
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {milestone.name}
          </div>
          {milestone.description && (
            <div
              style={{
                marginTop: 1,
                fontSize: 11.5,
                color: p.textSubtle,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {milestone.description}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            color: milestone.projectName ? p.textMuted : p.textFaint,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <FolderKanban size={11} color={p.textFaint} />
          {milestone.projectName || "—"}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
          }}
        >
          <StatusPill status={milestone.status} compact />
          {timing && (
            <TimingChip
              tone={timing.tone}
              icon={timing.icon}
              label={timing.label}
            />
          )}
        </div>

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
              {milestone.itemsDone}/{milestone.itemsTotal}
            </span>
            <span
              style={{
                fontSize: 11,
                color: p.text,
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
                : "indigo"
            }
            height={4}
          />
        </div>

        <div
          style={{
            textAlign: "right",
            fontSize: 12,
            fontWeight: 600,
            color: p.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {milestone.itemsDone}
          <span style={{ color: p.textFaint, margin: "0 2px" }}>/</span>
          <span style={{ color: p.textMuted, fontWeight: 500 }}>
            {milestone.itemsTotal}
          </span>
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: p.textSubtle,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
          }}
        >
          <Calendar size={11} color={p.textFaint} />
          {dateRange(milestone.estStartDate, milestone.estEndDate)}
        </div>

        {open ? (
          <ChevronDown
            size={14}
            color={p.textFaint}
            className="premium-ms-arrow"
          />
        ) : (
          <ChevronRight
            size={14}
            color={p.textFaint}
            className="premium-ms-arrow"
          />
        )}
      </button>

      {open && (
        <div
          style={{
            padding: "14px 16px 16px",
            background: p.surfaceTinted,
            borderBottom: isLast ? "none" : `1px solid ${p.border}`,
          }}
        >
          {milestone.description && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                background: p.surface,
                border: `1px solid ${p.border}`,
                borderRadius: 8,
                fontSize: 12.5,
                color: p.textMuted,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {milestone.description}
            </div>
          )}
          {milestone.items.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ListChecks size={11} />
                Breakdown
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {milestone.items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      background: it.isCompleted ? p.successBg : p.surface,
                      border: `1px solid ${
                        it.isCompleted ? p.successBorder : p.border
                      }`,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        background: it.isCompleted
                          ? p.successText
                          : p.surfaceElevated,
                        border: `1px solid ${
                          it.isCompleted ? p.successText : p.borderStrong
                        }`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        flexShrink: 0,
                      }}
                    >
                      {it.isCompleted && <CheckSquare size={11} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: p.text,
                          fontWeight: 500,
                          textDecoration: it.isCompleted
                            ? "line-through"
                            : "none",
                          opacity: it.isCompleted ? 0.7 : 1,
                        }}
                      >
                        {it.name}
                      </div>
                      {it.description && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 11,
                            color: p.textSubtle,
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
          )}
        </div>
      )}
    </>
  );
}
