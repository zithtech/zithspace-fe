"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input, Empty, Spin, Pagination, Select } from "antd";
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
} from "lucide-react";
import {
  portalSprintService,
  PortalSprintListItem,
  PortalSprintMeta,
} from "@/services/portalSprintService";

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

const STATUS_META: Record<
  string,
  {
    label: string;
    tone: "accent" | "success" | "warning" | "danger" | "neutral";
    icon: any;
  }
> = {
  planned: { label: "Planned", tone: "neutral", icon: Calendar },
  active: { label: "Active", tone: "accent", icon: Activity },
  in_progress: { label: "In progress", tone: "accent", icon: Activity },
  paused: { label: "Paused", tone: "warning", icon: Pause },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  done: { label: "Completed", tone: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "neutral", icon: AlertTriangle },
};

const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "active", label: "Active" },
  { key: "planned", label: "Planned" },
  { key: "completed", label: "Completed" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function dateRange(start: string | null, end: string | null) {
  if (!start && !end) return "No dates";
  if (start && end) return `${fmtDate(start)} → ${fmtDate(end)}`;
  return fmtDate(start || end);
}

function StatusPill({ status }: { status: string }) {
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
        gap: 5,
        padding: "3px 9px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function ProgressBar({
  percent,
  tone = "accent",
}: {
  percent: number;
  tone?: "accent" | "success" | "warning";
}) {
  const color =
    tone === "success" ? p.success : tone === "warning" ? p.warning : p.accent;
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div
      style={{
        width: "100%",
        height: 6,
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

export default function PortalSprintsPage() {
  const [items, setItems] = useState<PortalSprintListItem[]>([]);
  const [meta, setMeta] = useState<PortalSprintMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalSprintService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        projectId,
        search: search || undefined,
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
  }, [page, status, projectId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totals = useMemo(() => {
    const active =
      (meta?.counts?.active || 0) + (meta?.counts?.in_progress || 0);
    const completed =
      (meta?.counts?.completed || 0) + (meta?.counts?.done || 0);
    const planned = meta?.counts?.planned || 0;
    return { active, completed, planned };
  }, [meta]);

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
          Zukvo · Delivery
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
          Sprints
        </h1>
        <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
          Track sprint goals, planned vs delivered work, blockers, and what
          shipped each cycle.
        </div>
      </div>

      {/* Summary strip */}
      {meta && meta.total > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <SummaryCard
            label="Active"
            value={totals.active}
            sub="In progress"
            tone="accent"
          />
          <SummaryCard
            label="Planned"
            value={totals.planned}
            sub="Not started yet"
            tone="neutral"
          />
          <SummaryCard
            label="Completed"
            value={totals.completed}
            sub="Sprints delivered"
            tone="success"
          />
          <SummaryCard
            label="Total"
            value={meta.total}
            sub={`Across ${meta.projects.length} project${
              meta.projects.length === 1 ? "" : "s"
            }`}
            tone="warning"
          />
        </div>
      )}

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
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
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
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
                {tab.label}
                {count != null && count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: active
                        ? "rgba(255,255,255,0.15)"
                        : p.neutralBg,
                      color: active ? "#ffffff" : p.textSubtle,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {meta && meta.projects.length > 1 && (
            <Select
              allowClear
              placeholder="All projects"
              style={{ width: 200 }}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                setPage(1);
              }}
              options={meta.projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          )}
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={p.textFaint} />}
            placeholder="Search sprint or goal…"
            style={{ width: 260 }}
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div
          style={{
            padding: 80,
            textAlign: "center",
            background: p.surfaceElevated,
            border: `1px solid ${p.border}`,
            borderRadius: 12,
          }}
        >
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 56,
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
                  ? `No sprints match "${search}".`
                  : status !== "ALL"
                  ? `No ${status} sprints.`
                  : "No sprints yet."}
              </span>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((s) => (
            <SprintCard key={s.id} sprint={s} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > limit && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
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
    </div>
  );
}

/* --------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "accent" | "success" | "warning" | "neutral";
}) {
  const t = TONE[tone];
  return (
    <div
      style={{
        padding: "16px 18px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          fontWeight: 600,
          color: p.text,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          fontSize: 11.5,
          fontWeight: 500,
          background: t.bg,
          border: `1px solid ${t.border}`,
          color: t.text,
          borderRadius: 999,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function SprintCard({ sprint }: { sprint: PortalSprintListItem }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/portal/sprints/${sprint.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 18,
        background: p.surfaceElevated,
        border: `1px solid ${hover ? p.borderStrong : p.border}`,
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 120ms ease",
      }}
    >
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
              fontSize: 11,
              fontWeight: 600,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {sprint.project.name}
            {sprint.project.code ? ` · ${sprint.project.code}` : ""}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 15.5,
              fontWeight: 600,
              color: p.text,
              letterSpacing: "-0.01em",
            }}
          >
            {sprint.version}
          </div>
          {sprint.goal && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12.5,
                color: p.textMuted,
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              <Flag size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              {sprint.goal}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <StatusPill status={sprint.status} />
          <ChevronRight size={14} color={p.textFaint} />
        </div>
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
              fontWeight: 500,
            }}
          >
            Ticket completion
          </span>
          <span
            style={{
              fontSize: 12,
              color: p.text,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sprint.doneCount} / {sprint.ticketCount} ·{" "}
            {sprint.completionPercent}%
          </span>
        </div>
        <ProgressBar
          percent={sprint.completionPercent}
          tone={
            sprint.completionPercent >= 100
              ? "success"
              : sprint.completionPercent >= 70
              ? "accent"
              : "warning"
          }
        />
      </div>

      {/* Story points + dates */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 11.5,
          color: p.textSubtle,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          <Sparkles size={11} />
          {sprint.completedPoints} / {sprint.committedPoints} pts
        </span>
        {sprint.blockedCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              gap: 4,
              alignItems: "center",
              color: p.dangerText,
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={11} />
            {sprint.blockedCount} blocker
            {sprint.blockedCount === 1 ? "" : "s"}
          </span>
        )}
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          <Calendar size={11} />
          {dateRange(sprint.startDate, sprint.endDate)}
        </span>
      </div>
    </Link>
  );
}
