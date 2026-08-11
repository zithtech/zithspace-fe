"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pagination, Select, DatePicker, Row as AntRow, Col, Divider, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
dayjs.extend(quarterOfYear);
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
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  ArrowUpRight,
  CircleDot,
  Ban,
  Hash,
  X,
  Folder,
  CalendarRange,
  SlidersHorizontal
} from "lucide-react";

const { RangePicker } = DatePicker;
import {

  portalSprintService,
  PortalSprintListItem,
  PortalSprintMeta
} from "@/services/portalSprintService";

const { Title, Text } = Typography;

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceTinted: "#fafbff",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  borderHover: "#a5b4fc",
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
  neutralText: "#475569"
};

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
  cancelled: { label: "Cancelled", tone: "neutral", icon: AlertTriangle }
};

const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  indigo: { bg: p.indigoBg, border: p.indigoBorder, text: p.indigoText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText }
};

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "active", label: "Active" },
  { key: "planning", label: "Planning" },
  { key: "completed", label: "Completed" },
];

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
      day: "numeric"
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
        icon: CheckCircle2
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
        icon: AlertTriangle
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
      icon: Layers
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
        whiteSpace: "nowrap"
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
  compact }: {
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
        whiteSpace: "nowrap"
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
  height = 5 }: {
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
        display: "flex"
      }}
    >
      {donePct > 0 && (
        <div
          style={{
            width: `${donePct}%`,
            background: p.success,
            transition: "width 200ms ease"
          }}
        />
      )}
      {blockedPct > 0 && (
        <div
          style={{
            width: `${blockedPct}%`,
            background: p.danger,
            transition: "width 200ms ease"
          }}
        />
      )}
      {openPct > 0 && ticketCount > 0 && (
        <div
          style={{
            width: `${openPct}%`,
            background: p.indigo,
            opacity: 0.22,
            transition: "width 200ms ease"
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

type ViewMode = "card" | "list";
const VIEW_STORAGE_KEY = "portal.sprints.view";

export default function PortalSprintsPage() {
  const [items, setItems] = useState<PortalSprintListItem[]>([]);
  const [meta, setMeta] = useState<PortalSprintMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("card");
  const limit = 20;

  const fromIso = dateRange?.[0] ? dateRange[0]!.format("YYYY-MM-DD") : undefined;
  const toIso = dateRange?.[1] ? dateRange[1]!.format("YYYY-MM-DD") : undefined;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "card" || stored === "list") setView(stored);
    } catch { }
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch { }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalSprintService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        projectId,
        search: search || undefined,
        from: fromIso,
        to: toIso
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, projectId, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    <div style={{ height: "100vh", overflowY: "auto", backgroundColor: "#ffffff" }}>
      {/* Workstation Header */}
      <div
        className="saas-header-container portal-mom-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "20px 40px 20px 40px",
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)"
        }}
      >
        <AntRow justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="1 1 auto" style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8
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
                      "linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(67, 56, 202, 0.08))",
                    color: p.indigo,
                    border: `1px solid ${p.indigoBorder}`
                  }}
                >
                  <Activity size={18} color={p.indigo} />
                </div>
                <Title
                  level={4}
                  className="portal-mom-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em"
                  }}
                >
                  Sprints
                </Title>
              </div>

              <Divider
                type="vertical"
                style={{
                  height: 20,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  margin: "0 12px"
                }}
              />

              <div>
                <Text
                  className="portal-mom-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600
                  }}
                >
                  Track sprint goals, planned vs delivered work, blockers, and what shipped each cycle.
                </Text>
              </div>
            </div>
          </Col>
          {meta && meta.total > 0 && totalCommittedPts > 0 && (
            <Col flex="0 0 auto">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 11px",
                  background: p.surfaceTinted,
                  border: `1px solid ${p.neutralBorder}`,
                  borderRadius: 999
                }}
              >
                <TrendingUp size={12} color={p.indigo} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: p.textSubtle
                  }}
                >
                  Velocity
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: p.text,
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  {totalCompletedPts}/{totalCommittedPts}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: velocityPct >= 80 ? p.successText : velocityPct >= 50 ? p.indigoText : p.warningText,
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  {velocityPct}%
                </span>
              </div>
            </Col>
          )}
        </AntRow>
      </div>

      <div style={{ padding: "20px 40px 56px", maxWidth: 1280 }}>

        {/* Filter tabs + view toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 10
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTER_TABS.map((tab) => {
              const active = status === tab.key;
              const count =
                tab.key === "ALL"
                  ? meta?.total
                  : tab.key === "completed"
                    ? (meta?.counts?.completed || 0) + (meta?.counts?.done || 0)
                    : meta?.counts?.[tab.key];
              return (
                <button
                  key={tab.key}
                  className="premium-filter-tab"
                  data-active={active ? "true" : "false"}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
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
                    transition: "all 120ms ease"
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
                        fontVariantNumeric: "tabular-nums"
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
          projects={meta?.projects || []}
          projectId={projectId}
          onProjectChange={(v) => {
            setProjectId(v);
            setPage(1);
          }}
          dateRange={dateRange}
          onDateRangeChange={(r) => {
            setDateRange(r);
            setPage(1);
          }}
        />

        {/* Active filter chips */}
        <ActiveFilterChips
          search={search}
          onClearSearch={() => setSearch("")}
          projectName={
            projectId
              ? meta?.projects.find((p) => p.id === projectId)?.name
              : undefined
          }
          onClearProject={() => {
            setProjectId(undefined);
            setPage(1);
          }}
          dateRange={dateRange}
          onClearDateRange={() => {
            setDateRange(null);
            setPage(1);
          }}
          statusFilter={status !== "ALL" ? status : undefined}
          onClearStatus={() => {
            setStatus("ALL");
            setPage(1);
          }}
        />

        {/* Current sprint(s) — focused detail card(s) */}
        {!loading && currentSprints.length > 0 && (
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
                gap: 12
              }}
            >
              {currentSprints.map((s) => (
                <CurrentSprintCard key={s.id} sprint={s} />
              ))}
            </div>
          </div>
        )}

        {/* Rest of sprints heading when featured exists */}
        {!loading && currentSprints.length > 0 && restItems.length > 0 && (
          <SectionLabel icon={Layers} label="All sprints" count={restItems.length} />
        )}

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px solid ${p.border}`,
              borderRadius: 12
            }}
          >
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 56,
              textAlign: "center",
              background: p.surfaceTinted,
              border: `1px dashed ${p.neutralBorder}`,
              borderRadius: 12
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
                marginBottom: 12
              }}
            >
              <Target size={18} color={p.textFaint} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text }}>
              {search
                ? `No sprints match "${search}"`
                : status !== "ALL"
                  ? `No ${status} sprints`
                  : "No sprints yet"}
            </div>
            <div style={{ fontSize: 12, color: p.textSubtle, marginTop: 4 }}>
              {search
                ? "Try a different search term or clear filters."
                : "Sprints will appear here as the team plans and ships work."}
            </div>
          </div>
        ) : restItems.length === 0 ? null : view === "card" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 10
            }}
          >
            {restItems.map((s) => (
              <SprintCardCompact key={s.id} sprint={s} />
            ))}
          </div>
        ) : (
          <SprintList items={restItems} />
        )}

        {/* Pagination */}
        {meta && meta.total > limit && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end"
            }}
          >
            <Pagination
              current={page}
              pageSize={limit}
              total={meta.total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
        <style jsx global>{`
          .portal-mom-header-container,
          [data-theme='dark'] .portal-mom-header-container,
          [data-theme='dark'] .saas-header-container.portal-mom-header-container,
          .saas-header-container.portal-mom-header-container {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .portal-mom-header-title {
            color: #0f172a !important;
          }
          .portal-mom-header-desc {
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
            background: #3b82f6;
          }
          .premium-sprint-card[data-completed='true']::before {
            background: #10b981;
          }
          .premium-sprint-card:hover {
            border-color: #93c5fd !important;
          }
          .premium-sprint-card:hover .premium-sprint-arrow {
            transform: translateX(2px);
            color: #3b82f6;
          }
          .premium-sprint-arrow {
            transition: transform 140ms ease, color 140ms ease;
          }

          /* Current sprint card hover */
          .premium-current-card:hover {
            border-color: #60a5fa !important;
          }
          .premium-current-card:hover .premium-current-cta {
            background: #2563eb;
            gap: 6px;
          }

          /* List row hover */
          .premium-sprint-row {
            transition: background 120ms ease;
          }
          .premium-sprint-row:hover {
            background: #fafbff;
          }
          .premium-sprint-row:hover .premium-sprint-arrow {
            transform: translateX(2px);
            color: #4f46e5;
          }

          /* Filter tab hover */
          .premium-filter-tab[data-active='false']:hover {
            border-color: #a5b4fc !important;
            color: #4338ca !important;
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

          /* Premium select (project dropdown) */
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
          .premium-rangepicker .ant-picker-clear {
            color: #94a3b8 !important;
          }
          /* Preset list inside the panel */
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
        `}</style>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ViewToggle({
  view,
  onChange }: {
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
        gap: 9,
        padding: "12px 14px 12px 15px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 140ms ease"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8
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
              whiteSpace: "nowrap"
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
              flexWrap: "wrap"
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13.5,
                fontWeight: 700,
                color: p.text,
                letterSpacing: "-0.01em"
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
            overflow: "hidden"
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
            marginBottom: 4
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              color: p.textSubtle,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {sprint.doneCount}/{sprint.ticketCount} tickets
          </span>
          <span
            style={{
              fontSize: 11,
              color: p.text,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums"
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
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            gap: 3,
            alignItems: "center",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums"
          }}
        >
          <Sparkles size={10} color={p.indigo} />
          {sprint.completedPoints}/{sprint.committedPoints} pts
        </span>
        {sprint.blockedCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              gap: 3,
              alignItems: "center",
              color: p.dangerText,
              fontWeight: 600
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
            fontWeight: 500
          }}
        >
          <Calendar size={10} />
          {dateRange(sprint.startDate, sprint.endDate)}
        </span>
      </div>
    </Link>
  );
}

function SprintList({ items }: { items: PortalSprintListItem[] }) {
  return (
    <div
      style={{
        background: p.surface,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        overflow: "hidden"
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(180px, 1.5fr) minmax(160px, 1.6fr) 110px minmax(180px, 1.4fr) 90px 130px 16px",
          gap: 12,
          padding: "8px 16px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          fontSize: 10,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        }}
      >
        <div>Sprint</div>
        <div>Goal</div>
        <div>Status</div>
        <div>Progress</div>
        <div style={{ textAlign: "right" }}>Points</div>
        <div>Dates</div>
        <div />
      </div>
      {items.map((s, idx) => (
        <SprintRow key={s.id} sprint={s} isLast={idx === items.length - 1} />
      ))}
    </div>
  );
}

function SprintRow({
  sprint,
  isLast }: {
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
          "minmax(180px, 1.5fr) minmax(160px, 1.6fr) 110px minmax(180px, 1.4fr) 90px 130px 16px",
        gap: 12,
        padding: "11px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : `1px solid ${p.border}`,
        textDecoration: "none",
        color: "inherit"
      }}
    >
      {/* Sprint */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {sprint.project.name}
          {sprint.project.code ? ` · ${sprint.project.code}` : ""}
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            fontWeight: 700,
            color: p.text,
            letterSpacing: "-0.01em",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {sprint.version}
        </div>
      </div>

      {/* Goal */}
      <div
        style={{
          fontSize: 12,
          color: sprint.goal ? p.textMuted : p.textFaint,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
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
            marginBottom: 4
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              color: p.textSubtle,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {sprint.doneCount}/{sprint.ticketCount}
          </span>
          <span
            style={{
              fontSize: 11,
              color: p.text,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {sprint.completionPercent}%
          </span>
        </div>
        <SegmentedProgress
          ticketCount={sprint.ticketCount}
          doneCount={sprint.doneCount}
          blockedCount={sprint.blockedCount}
          height={4}
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
              gap: 3
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
          fontSize: 12,
          fontWeight: 600,
          color: p.text,
          fontVariantNumeric: "tabular-nums"
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
          fontSize: 11.5,
          color: p.textSubtle,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontWeight: 500
        }}
      >
        <Calendar size={11} color={p.textFaint} />
        {dateRange(sprint.startDate, sprint.endDate)}
      </div>

      <ChevronRight
        size={14}
        color={p.textFaint}
        className="premium-sprint-arrow"
      />
    </Link>
  );
}

/* --------------------------------------------------------------- */

function SectionLabel({
  icon: Icon,
  label,
  count }: {
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
        marginBottom: 10
      }}
    >
      <Icon size={13} color={p.indigo} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: p.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.09em"
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
            fontVariantNumeric: "tabular-nums"
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
          marginLeft: 2
        }}
      />
    </div>
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
        transition: "border-color 140ms ease"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${p.accent}, ${p.accentText})`
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start"
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
              whiteSpace: "nowrap"
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
              flexWrap: "wrap"
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 18,
                fontWeight: 700,
                color: p.text,
                letterSpacing: "-0.02em"
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
            transition: "background 140ms ease, gap 140ms ease"
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
            overflow: "hidden"
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
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap"
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
              letterSpacing: "-0.01em"
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
          overflow: "hidden"
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
          tone={p.indigoText}
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
  label }: {
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
        fontVariantNumeric: "tabular-nums"
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 2,
          background: dot,
          opacity: dotOpacity,
          display: "inline-block"
        }}
      />
      {label}
    </span>
  );
}

function FilterBar({
  search,
  onSearchChange,
  projects,
  projectId,
  onProjectChange,
  dateRange,
  onDateRangeChange }: {
    search: string;
    onSearchChange: (v: string) => void;
    projects: { id: string; name: string; code: string | null }[];
    projectId: string | undefined;
    onProjectChange: (v: string | undefined) => void;
    dateRange: [Dayjs | null, Dayjs | null] | null;
    onDateRangeChange: (r: [Dayjs | null, Dayjs | null] | null) => void;
  }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const projectsValue = projectId;
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
      ]
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
        marginBottom: 10
      }}
    >
      {/* Premium search input */}
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
          transition: "border-color 140ms ease, box-shadow 140ms ease"
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
          placeholder="Search sprint, goal, or version…"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: p.text,
            fontSize: 13,
            fontWeight: 500
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
              cursor: "pointer"
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
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
          }}
        >
          /
        </kbd>
      </div>

      {/* Project dropdown */}
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
              fontWeight: 500
            }}
          >
            <Folder size={13} color={p.textFaint} />
            {projects.length > 0
              ? `All projects · ${projects.length}`
              : "Projects"}
          </span>
        }
        suffixIcon={<Folder size={13} color={p.textFaint} />}
        value={projectsValue}
        onChange={(v) => onProjectChange(v)}
        optionFilterProp="label"
        className="premium-select"
        style={{ width: 220, height: 34 }}
        options={projects.map((proj) => ({
          value: proj.id,
          label: proj.code ? `${proj.name} · ${proj.code}` : proj.name
        }))}
        notFoundContent={
          <div style={{ padding: 8, fontSize: 12, color: p.textSubtle }}>
            No projects available
          </div>
        }
      />

      {/* Date range picker */}
      <RangePicker
        value={dateRange as any}
        onChange={(r) => onDateRangeChange(r as any)}
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
  dateRange,
  onClearDateRange,
  statusFilter,
  onClearStatus }: {
    search: string;
    onClearSearch: () => void;
    projectName: string | undefined;
    onClearProject: () => void;
    dateRange: [Dayjs | null, Dayjs | null] | null;
    onClearDateRange: () => void;
    statusFilter: string | undefined;
    onClearStatus: () => void;
  }) {
  const hasDates = !!(dateRange && (dateRange[0] || dateRange[1]));
  const any = !!search || !!projectName || hasDates || !!statusFilter;
  if (!any) return null;

  const dateLabel = hasDates
    ? `${dateRange?.[0] ? dateRange[0].format("MMM D") : "Any"} → ${dateRange?.[1] ? dateRange[1].format("MMM D, YYYY") : "Any"
    }`
    : "";

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 14
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
          marginRight: 2
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
          cursor: "pointer"
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
  onClear }: {
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
        lineHeight: 1.2
      }}
    >
      <Icon size={10} />
      <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
          cursor: "pointer"
        }}
      >
        <X size={10} />
      </button>
    </span>
  );
}

function CurrentStat({
  icon: Icon,
  label,
  value,
  tone,
  divider }: {
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
        minWidth: 0
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
          letterSpacing: "0.08em"
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
          textOverflow: "ellipsis"
        }}
      >
        {value}
      </div>
    </div>
  );
}
