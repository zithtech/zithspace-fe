"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Empty,
  Tooltip,
  Input,
  Space,
  Typography,
} from "antd";
import {
  ReloadOutlined,
} from "@ant-design/icons";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  Flag,
  Sparkles,
  Layers,
  ExternalLink,
  Plus,
  Tag as TagIcon,
  Clock,
  Search,
  CheckCircle,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";
import {
  portalSprintService,
  PortalSprintDetail,
  PortalSprintTicket,
} from "@/services/portalSprintService";

const { Text } = Typography;

/* --------------------------------------------------------------- */
/*  Theme Palette                                                  */
/* --------------------------------------------------------------- */

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceTinted: "#f0fdfa",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  borderHover: "#5eead4",
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

const STATUS_META: Record<
  string,
  {
    label: string;
    tone: "accent" | "success" | "warning" | "danger" | "neutral";
    icon: any;
  }
> = {
  planned: { label: "Planned", tone: "neutral", icon: Calendar },
  planning: { label: "Planning", tone: "neutral", icon: Calendar },
  active: { label: "Active", tone: "accent", icon: Activity },
  in_progress: { label: "In progress", tone: "accent", icon: Activity },
  paused: { label: "Paused", tone: "warning", icon: Clock },
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
  if (!start && !end) return "No dates set";
  if (start && end) return `${fmtDate(start)} → ${fmtDate(end)}`;
  return fmtDate(start || end);
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

function sprintTiming(sprint: PortalSprintDetail):
  | { label: string; tone: "accent" | "success" | "warning" | "danger" | "neutral"; icon: any }
  | null {
  const isCompleted =
    sprint.status?.toLowerCase() === "completed" ||
    sprint.status?.toLowerCase() === "done";
  const isActive =
    sprint.status?.toLowerCase() === "active" ||
    sprint.status?.toLowerCase() === "in_progress";
  const isPlanning =
    sprint.status?.toLowerCase() === "planning" ||
    sprint.status?.toLowerCase() === "planned";

  if (isCompleted && sprint.completedAt) {
    const days = daysBetween(sprint.completedAt);
    if (days != null && days <= 0) {
      const ago = -days;
      return {
        label: ago === 0 ? "Shipped today" : `Shipped ${ago}d ago`,
        tone: "success",
        icon: CheckCircle2,
      };
    }
  }
  if (isActive && sprint.endDate) {
    const days = daysBetween(sprint.endDate);
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
  if (isPlanning && sprint.startDate) {
    const days = daysBetween(sprint.startDate);
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
        gap: 5,
        padding: compact ? "2px 8px" : "3px 10px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: compact ? 11 : 12,
        fontWeight: 600,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={compact ? 11 : 12} />
      {meta.label}
    </span>
  );
}

function TimingChip({
  tone,
  icon: Icon,
  label,
}: {
  tone: "accent" | "success" | "warning" | "danger" | "neutral";
  icon: any;
  label: string;
}) {
  const t = TONE[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function SegmentedProgress({
  ticketCount,
  doneCount,
  blockedCount,
  height = 8,
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
            background: "#10b981",
            transition: "width 240ms ease",
          }}
        />
      )}
      {blockedPct > 0 && (
        <div
          style={{
            width: `${blockedPct}%`,
            background: "#ef4444",
            transition: "width 240ms ease",
          }}
        />
      )}
      {openPct > 0 && ticketCount > 0 && (
        <div
          style={{
            width: `${openPct}%`,
            background: "#0d9488",
            opacity: 0.35,
            transition: "width 240ms ease",
          }}
        />
      )}
    </div>
  );
}

function priorityColor(priority: string) {
  const p2 = (priority || "").toLowerCase();
  if (p2.includes("critical") || p2.includes("p0") || p2.includes("urgent"))
    return { text: p.dangerText, bg: p.dangerBg, border: p.dangerBorder };
  if (p2.includes("high") || p2.includes("p1"))
    return { text: p.warningText, bg: p.warningBg, border: p.warningBorder };
  if (p2.includes("medium") || p2.includes("p2"))
    return { text: p.accentText, bg: p.accentBg, border: p.accentBorder };
  return { text: p.textSubtle, bg: p.neutralBg, border: p.border };
}

/* --------------------------------------------------------------- */

export default function PortalSprintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [sprint, setSprint] = useState<PortalSprintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [activeBucket, setActiveBucket] = useState<
    "all" | "completed" | "open" | "blocked" | "addedAfter"
  >("all");

  const load = async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await portalSprintService.detail(id);
      setSprint(data);
    } catch {
      setSprint(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const timing = useMemo(() => {
    return sprint ? sprintTiming(sprint) : null;
  }, [sprint]);

  const filteredTickets: PortalSprintTicket[] = useMemo(() => {
    if (!sprint?.tickets) return [];
    let list = sprint.tickets;

    if (activeBucket === "completed") {
      list = list.filter((t) => t.category === "completed");
    } else if (activeBucket === "open") {
      list = list.filter((t) => t.category === "open");
    } else if (activeBucket === "blocked") {
      list = list.filter((t) => t.category === "blocked");
    } else if (activeBucket === "addedAfter") {
      list = list.filter((t) => t.addedAfterSprint);
    }

    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.ticketNumber?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [sprint?.tickets, activeBucket, ticketSearch]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <ZukvoLoader size="lg" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          padding: 48,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Sprint cycle not found or access is restricted."
        />
        <div style={{ marginTop: 20 }}>
          <Button
            type="primary"
            icon={<ArrowLeft size={14} />}
            onClick={() => router.push("/portal/sprints")}
            style={{
              background: "#0d9488",
              borderColor: "#0d9488",
              borderRadius: 8,
              height: 36,
              fontWeight: 600,
            }}
          >
            Return to Sprints
          </Button>
        </div>
      </div>
    );
  }

  const openTicketsCount = Math.max(
    0,
    sprint.counts.total - sprint.counts.completed - sprint.counts.blocked,
  );

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* ── Top Header Toolbar matching Invoices UI ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          minHeight: 54,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        {/* Left Side: Back + Title + Subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <Button
            type="text"
            icon={<ArrowLeft size={14} />}
            onClick={() => router.push("/portal/sprints")}
            style={{
              padding: "4px 10px",
              height: 32,
              color: p.textMuted,
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            Sprints
          </Button>

          <span style={{ color: p.textFaint, fontSize: 13 }}>/</span>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(13, 148, 136, 0.1)",
              border: "1px solid rgba(13, 148, 136, 0.2)",
              color: "#0d9488",
              flexShrink: 0,
            }}
          >
            <CalendarCheck size={16} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {sprint.version}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: "#f1f5f9",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {sprint.project.name}
              </span>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "#94a3b8",
                marginTop: 1,
              }}
            >
              {dateRange(sprint.startDate, sprint.endDate)}
            </span>
          </div>
        </div>

        {/* Right Side: Status + Timing + Refresh */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <StatusPill status={sprint.status} />
          {timing && (
            <TimingChip
              tone={timing.tone}
              icon={timing.icon}
              label={timing.label}
            />
          )}

          <Tooltip title="Refresh sprint details">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => load(true)}
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
        </div>
      </div>

      {/* ── Scrollable Body Area ── */}
      <div
        style={{
          flex: "1 0 auto",
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 24px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Hero Banner / Summary Card */}
        <div
          style={{
            padding: "20px 24px",
            background: "#ffffff",
            border: `1px solid ${p.border}`,
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                {sprint.project.name}
                {sprint.project.code ? ` · ${sprint.project.code}` : ""}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: p.text,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Sprint {sprint.version}
              </div>

              {sprint.goal ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    background: p.accentBg,
                    border: `1px solid ${p.accentBorder}`,
                    borderRadius: 10,
                    color: p.accentText,
                    fontSize: 13,
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <Flag
                    size={15}
                    style={{ flexShrink: 0, marginTop: 2, color: "#0d9488" }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, marginRight: 6 }}>
                      Sprint Goal:
                    </span>
                    <span>{sprint.goal}</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: p.textSubtle,
                    fontStyle: "italic",
                  }}
                >
                  No sprint goal defined for this cycle.
                </div>
              )}
            </div>

            {/* Quick Progress Indicator */}
            <div
              style={{
                minWidth: 220,
                flex: "0 0 auto",
                padding: "12px 16px",
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                borderRadius: 10,
              }}
            >
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
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: p.textSubtle,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Completion
                </span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: p.text,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {sprint.completionPercent}%
                </span>
              </div>
              <SegmentedProgress
                ticketCount={sprint.counts.total}
                doneCount={sprint.counts.completed}
                blockedCount={sprint.counts.blocked}
                height={7}
              />
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: p.textSubtle,
                  fontWeight: 600,
                }}
              >
                <span>{sprint.counts.completed} done</span>
                <span>{sprint.counts.total} tickets</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Metrics / KPI Cards Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {/* Card 1: Tickets Completion */}
          <div
            style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Tickets Delivered
              </span>
              <CheckCircle size={15} color="#10b981" />
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 800,
                color: p.text,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sprint.counts.completed}{" "}
              <span style={{ fontSize: 14, color: p.textFaint, fontWeight: 500 }}>
                / {sprint.counts.total}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background:
                    sprint.completionPercent >= 100
                      ? p.successBg
                      : sprint.completionPercent >= 60
                      ? p.accentBg
                      : p.warningBg,
                  color:
                    sprint.completionPercent >= 100
                      ? p.successText
                      : sprint.completionPercent >= 60
                      ? p.accentText
                      : p.warningText,
                }}
              >
                {sprint.completionPercent}% complete
              </span>
            </div>
          </div>

          {/* Card 2: Story Points */}
          <div
            style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Story Points
              </span>
              <Sparkles size={15} color="#0d9488" />
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 800,
                color: p.text,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sprint.completedPoints}{" "}
              <span style={{ fontSize: 14, color: p.textFaint, fontWeight: 500 }}>
                / {sprint.committedPoints} pts
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: p.accentBg,
                  color: p.accentText,
                }}
              >
                <TrendingUp size={11} />
                {sprint.pointsPercent}% velocity
              </span>
            </div>
          </div>

          {/* Card 3: Active Blockers */}
          <div
            style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Blockers
              </span>
              <AlertTriangle
                size={15}
                color={sprint.counts.blocked > 0 ? "#ef4444" : "#10b981"}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 800,
                color: sprint.counts.blocked > 0 ? p.dangerText : p.text,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sprint.counts.blocked}
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background:
                    sprint.counts.blocked > 0 ? p.dangerBg : p.successBg,
                  color:
                    sprint.counts.blocked > 0 ? p.dangerText : p.successText,
                }}
              >
                {sprint.counts.blocked === 0
                  ? "No active blockers"
                  : "Requires attention"}
              </span>
            </div>
          </div>

          {/* Card 4: Mid-sprint additions */}
          <div
            style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Mid-Sprint Additions
              </span>
              <Plus size={15} color={p.textSubtle} />
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 800,
                color: p.text,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sprint.counts.addedAfter}
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background:
                    sprint.counts.addedAfter > 0 ? p.warningBg : p.neutralBg,
                  color:
                    sprint.counts.addedAfter > 0
                      ? p.warningText
                      : p.textSubtle,
                }}
              >
                {sprint.counts.addedAfter === 0
                  ? "Scope strictly held"
                  : "Added after start"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Environment & Release Links Strip (if any) ── */}
        {sprint.links && sprint.links.length > 0 && (
          <div
            style={{
              padding: "14px 18px",
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Sprint Links & Artifacts
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sprint.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: p.surfaceMuted,
                    border: `1px solid ${p.border}`,
                    borderRadius: 8,
                    color: p.accentText,
                    textDecoration: "none",
                    fontSize: 12.5,
                    fontWeight: 600,
                    transition: "border-color 120ms ease, background 120ms ease",
                  }}
                >
                  <ExternalLink size={12} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Tickets Section ── */}
        <div
          style={{
            background: "#ffffff",
            border: `1px solid ${p.border}`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          {/* Section Toolbar */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${p.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                {
                  key: "all" as const,
                  label: "All Tickets",
                  count: sprint.counts.total,
                },
                {
                  key: "completed" as const,
                  label: "Completed",
                  count: sprint.counts.completed,
                },
                {
                  key: "open" as const,
                  label: "In Progress / Open",
                  count: openTicketsCount,
                },
                {
                  key: "blocked" as const,
                  label: "Blocked",
                  count: sprint.counts.blocked,
                },
                {
                  key: "addedAfter" as const,
                  label: "Mid-sprint",
                  count: sprint.counts.addedAfter,
                },
              ].map((tab) => {
                const active = activeBucket === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveBucket(tab.key)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      background: active ? "#0d9488" : "#ffffff",
                      color: active ? "#ffffff" : p.textMuted,
                      border: `1px solid ${active ? "#0d9488" : p.border}`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count != null && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "0 6px",
                          borderRadius: 999,
                          background: active
                            ? "rgba(255,255,255,0.22)"
                            : p.neutralBg,
                          color: active ? "#ffffff" : p.textSubtle,
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Input
              placeholder="Search sprint tickets..."
              prefix={
                <Search
                  size={13}
                  style={{ color: p.textFaint, marginRight: 4 }}
                />
              }
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              style={{
                maxWidth: 240,
                height: 32,
                borderRadius: 8,
                fontSize: 12.5,
              }}
              allowClear
            />
          </div>

          {/* Ticket Table */}
          {filteredTickets.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: p.textSubtle }}>
                    {ticketSearch
                      ? `No tickets match "${ticketSearch}".`
                      : "No tickets found for this filter category."}
                  </span>
                }
              />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(240px, 2fr) 130px 100px 90px 120px",
                  minWidth: 720,
                  gap: 12,
                  padding: "8px 18px",
                  background: "var(--bg-slate-50, #f8fafc)",
                  borderBottom: `1px solid ${p.border}`,
                  fontSize: 10,
                  fontWeight: 800,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  alignItems: "center",
                }}
              >
                <div>TICKET & SUMMARY</div>
                <div>STATUS</div>
                <div>PRIORITY</div>
                <div style={{ textAlign: "right" }}>POINTS</div>
                <div style={{ textAlign: "right" }}>DUE DATE</div>
              </div>

              {/* Table Rows */}
              <div>
                {filteredTickets.map((ticket, idx) => (
                  <TicketRowItem
                    key={ticket.id}
                    ticket={ticket}
                    isLast={idx === filteredTickets.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed Sticky Bottom Summary Footer ── */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Text style={{ fontSize: 13, color: p.textSubtle }}>
            Showing{" "}
            <span style={{ color: p.text, fontWeight: 700 }}>
              {filteredTickets.length}
            </span>{" "}
            of{" "}
            <span style={{ color: p.text, fontWeight: 700 }}>
              {sprint.tickets.length}
            </span>{" "}
            total ticket{sprint.tickets.length !== 1 ? "s" : ""}
          </Text>
          <span style={{ color: p.borderStrong }}>•</span>
          <Text style={{ fontSize: 12.5, color: p.textSubtle }}>
            <span style={{ color: p.text, fontWeight: 700 }}>
              {sprint.completedPoints}
            </span>{" "}
            of {sprint.committedPoints} pts delivered
          </Text>
        </div>

        <Button
          onClick={() => router.push("/portal/sprints")}
          style={{
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12.5,
          }}
          icon={<ArrowLeft size={13} />}
        >
          All Sprints
        </Button>
      </div>

      <style jsx global>{`
        .sc-ticket-row:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */

function TicketRowItem({
  ticket,
  isLast,
}: {
  ticket: PortalSprintTicket;
  isLast: boolean;
}) {
  const due = ticket.dueDate ? new Date(ticket.dueDate) : null;
  const dueDays =
    due && ticket.category !== "completed"
      ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  const priorityStyle = priorityColor(ticket.priority);

  return (
    <div
      className="sc-ticket-row"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(240px, 2fr) 130px 100px 90px 120px",
        minWidth: 720,
        gap: 12,
        padding: "12px 18px",
        borderBottom: isLast ? "none" : `1px solid ${p.border}`,
        alignItems: "center",
        transition: "background 120ms ease",
      }}
    >
      {/* Ticket & Summary */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11.5,
              fontWeight: 700,
              padding: "1px 7px",
              background: "#f1f5f9",
              border: `1px solid ${p.border}`,
              borderRadius: 6,
              color: p.textMuted,
            }}
          >
            {ticket.ticketNumber}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: p.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
            title={ticket.title}
          >
            {ticket.title}
          </span>
          {ticket.addedAfterSprint && (
            <Tooltip title="Added after sprint started">
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  background: p.warningBg,
                  border: `1px solid ${p.warningBorder}`,
                  color: p.warningText,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Plus size={9} />
                Mid-sprint
              </span>
            </Tooltip>
          )}
        </div>

        {ticket.tags && ticket.tags.length > 0 && (
          <div
            style={{
              marginTop: 4,
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            {ticket.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  background: "#f8fafc",
                  border: `1px solid ${p.border}`,
                  color: p.textSubtle,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <TagIcon size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        {ticket.category === "completed" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "2px 8px",
              background: p.successBg,
              border: `1px solid ${p.successBorder}`,
              color: p.successText,
              borderRadius: 999,
            }}
          >
            <CheckCircle2 size={11} />
            {ticket.status}
          </span>
        ) : ticket.category === "blocked" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "2px 8px",
              background: p.dangerBg,
              border: `1px solid ${p.dangerBorder}`,
              color: p.dangerText,
              borderRadius: 999,
            }}
          >
            <AlertTriangle size={11} />
            {ticket.status}
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "2px 8px",
              background: "#f1f5f9",
              border: `1px solid ${p.border}`,
              color: p.textMuted,
              borderRadius: 999,
            }}
          >
            <Activity size={11} />
            {ticket.status}
          </span>
        )}
      </div>

      {/* Priority */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            background: priorityStyle.bg,
            border: `1px solid ${priorityStyle.border}`,
            color: priorityStyle.text,
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {ticket.priority.replace(/\s*\(.*\)/, "")}
        </span>
      </div>

      {/* Story Points */}
      <div
        style={{
          textAlign: "right",
          fontSize: 13,
          fontWeight: 700,
          color: p.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ticket.storyPoint != null ? (
          <span
            style={{
              padding: "2px 7px",
              background: "#f1f5f9",
              borderRadius: 6,
              fontSize: 11.5,
            }}
          >
            {ticket.storyPoint} pt{ticket.storyPoint !== 1 ? "s" : ""}
          </span>
        ) : (
          <span style={{ color: p.textFaint }}>—</span>
        )}
      </div>

      {/* Due Date */}
      <div
        style={{
          textAlign: "right",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {ticket.dueDate ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color:
                dueDays != null && dueDays < 0
                  ? p.dangerText
                  : dueDays != null && dueDays <= 3
                  ? p.warningText
                  : p.textSubtle,
              fontWeight: dueDays != null && dueDays < 0 ? 700 : 500,
            }}
          >
            <Clock size={11} />
            {dueDays != null && dueDays < 0
              ? `${Math.abs(dueDays)}d overdue`
              : dueDays === 0
              ? "Due today"
              : dueDays != null && dueDays <= 7
              ? `${dueDays}d left`
              : fmtDate(ticket.dueDate)}
          </span>
        ) : (
          <span style={{ color: p.textFaint }}>—</span>
        )}
      </div>
    </div>
  );
}
