"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Empty, Tooltip } from "antd";
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
} from "lucide-react";
import {
  portalSprintService,
  PortalSprintDetail,
  PortalSprintTicket,
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
        gap: 6,
        padding: "4px 11px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 500,
      }}
    >
      <Icon size={12} />
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

function priorityColor(priority: string) {
  const p2 = priority.toLowerCase();
  if (p2.includes("critical") || p2.includes("p0")) return p.danger;
  if (p2.includes("high") || p2.includes("p1")) return p.warning;
  if (p2.includes("medium") || p2.includes("p2")) return p.accent;
  return p.textSubtle;
}

/* --------------------------------------------------------------- */

export default function PortalSprintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [sprint, setSprint] = useState<PortalSprintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<
    "all" | "completed" | "open" | "blocked" | "addedAfter"
  >("all");

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const data = await portalSprintService.detail(id);
        if (!cancel) setSprint(data);
      } catch {
        if (!cancel) setSprint(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ZukvoLoader size="lg" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Sprint not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button onClick={() => router.push("/portal/sprints")}>
            Back to sprints
          </Button>
        </div>
      </div>
    );
  }

  const filteredTickets: PortalSprintTicket[] =
    activeBucket === "all"
      ? sprint.tickets
      : activeBucket === "addedAfter"
      ? sprint.tickets.filter((t) => t.addedAfterSprint)
      : sprint.tickets.filter((t) => t.category === activeBucket);

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1200 }}>
      {/* Back */}
      <Button
        type="text"
        icon={<ArrowLeft size={14} />}
        onClick={() => router.push("/portal/sprints")}
        style={{
          padding: "4px 8px",
          height: 28,
          color: p.textMuted,
          marginBottom: 14,
        }}
      >
        Back to sprints
      </Button>

      {/* Header card */}
      <div
        style={{
          padding: 24,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {sprint.project.name}
              {sprint.project.code ? ` · ${sprint.project.code}` : ""}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 24,
                fontWeight: 600,
                color: p.text,
                letterSpacing: "-0.02em",
              }}
            >
              {sprint.version}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <StatusPill status={sprint.status} />
              <span
                style={{
                  fontSize: 12,
                  color: p.textSubtle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Calendar size={12} />
                {dateRange(sprint.startDate, sprint.endDate)}
              </span>
              {sprint.completedAt && (
                <span
                  style={{
                    fontSize: 12,
                    color: p.successText,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={12} />
                  Closed {fmtDate(sprint.completedAt)}
                </span>
              )}
            </div>
            {sprint.goal && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  borderRadius: 10,
                  color: p.accentText,
                  fontSize: 13,
                  lineHeight: 1.55,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <Flag size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong style={{ fontWeight: 600 }}>Sprint goal · </strong>
                  {sprint.goal}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <MetricBlock
            label="Ticket completion"
            primary={`${sprint.counts.completed} / ${sprint.counts.total}`}
            sub={`${sprint.completionPercent}%`}
            percent={sprint.completionPercent}
            tone={
              sprint.completionPercent >= 100
                ? "success"
                : sprint.completionPercent >= 70
                ? "accent"
                : "warning"
            }
          />
          <MetricBlock
            label="Story points"
            primary={`${sprint.completedPoints} / ${sprint.committedPoints}`}
            sub={`${sprint.pointsPercent}%`}
            percent={sprint.pointsPercent}
            tone="accent"
            icon={Sparkles}
          />
          <MetricBlock
            label="Blockers"
            primary={String(sprint.counts.blocked)}
            sub={sprint.counts.blocked === 0 ? "None — looking good" : "Active blockers"}
            tone={sprint.counts.blocked === 0 ? "success" : "danger"}
            icon={AlertTriangle}
          />
          <MetricBlock
            label="Added mid-sprint"
            primary={String(sprint.counts.addedAfter)}
            sub={
              sprint.counts.addedAfter === 0
                ? "Scope held"
                : "After sprint start"
            }
            tone={sprint.counts.addedAfter > 0 ? "warning" : "neutral"}
            icon={Plus}
          />
        </div>
      </div>

      {/* Links strip (demo / staging / repos) */}
      {sprint.links.length > 0 && (
        <div
          style={{
            padding: 16,
            background: p.surfaceElevated,
            border: `1px solid ${p.border}`,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            Links
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
                  padding: "7px 12px",
                  background: p.surfaceMuted,
                  border: `1px solid ${p.border}`,
                  borderRadius: 8,
                  color: p.accentText,
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                <ExternalLink size={12} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Ticket bucket pills */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        {[
          { key: "all" as const, label: "All", count: sprint.counts.total },
          {
            key: "completed" as const,
            label: "Completed",
            count: sprint.counts.completed,
          },
          { key: "open" as const, label: "In progress", count: sprint.counts.open },
          {
            key: "blocked" as const,
            label: "Blocked",
            count: sprint.counts.blocked,
          },
          {
            key: "addedAfter" as const,
            label: "Added mid-sprint",
            count: sprint.counts.addedAfter,
          },
        ].map((tab) => {
          const active = activeBucket === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveBucket(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 11px",
                background: active ? p.text : p.surfaceElevated,
                color: active ? "#ffffff" : p.textMuted,
                border: `1px solid ${active ? p.text : p.border}`,
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {tab.label}
              {tab.count > 0 && (
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
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ticket list */}
      <div
        style={{
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {filteredTickets.length === 0 ? (
          <div
            style={{
              padding: 56,
              textAlign: "center",
              color: p.textSubtle,
              fontSize: 13,
            }}
          >
            No tickets in this view.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 1.6fr) 110px 80px 70px 90px",
                gap: 14,
                padding: "12px 18px",
                background: p.surfaceMuted,
                borderBottom: `1px solid ${p.border}`,
                fontSize: 11,
                fontWeight: 600,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <div>Ticket</div>
              <div>Status</div>
              <div>Priority</div>
              <div style={{ textAlign: "right" }}>Points</div>
              <div style={{ textAlign: "right" }}>Due</div>
            </div>
            {filteredTickets.map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MetricBlock({
  label,
  primary,
  sub,
  percent,
  tone,
  icon: Icon,
}: {
  label: string;
  primary: string;
  sub: string;
  percent?: number;
  tone: "accent" | "success" | "warning" | "danger" | "neutral";
  icon?: any;
}) {
  const t = TONE[tone];
  return (
    <div
      style={{
        padding: 14,
        background: p.surfaceMuted,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 20,
          fontWeight: 600,
          color: p.text,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        }}
      >
        {primary}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11.5,
          fontWeight: 500,
          color: t.text,
          background: t.bg,
          border: `1px solid ${t.border}`,
          padding: "1px 8px",
          borderRadius: 999,
          display: "inline-block",
        }}
      >
        {sub}
      </div>
      {percent != null && (
        <div style={{ marginTop: 10 }}>
          <ProgressBar
            percent={percent}
            tone={
              tone === "success" || tone === "warning" || tone === "accent"
                ? tone
                : "accent"
            }
          />
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: PortalSprintTicket }) {
  const [hover, setHover] = useState(false);
  const due = ticket.dueDate ? new Date(ticket.dueDate) : null;
  const dueDays =
    due && ticket.category !== "completed"
      ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
  const dueColor =
    dueDays != null
      ? dueDays < 0
        ? p.dangerText
        : dueDays <= 3
        ? p.warningText
        : p.textMuted
      : p.textFaint;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(220px, 1.6fr) 110px 80px 70px 90px",
        gap: 14,
        padding: "14px 18px",
        borderBottom: `1px solid ${p.border}`,
        background: hover ? p.surfaceMuted : "transparent",
        alignItems: "center",
        transition: "background 120ms ease",
      }}
    >
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
              padding: "1px 7px",
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 6,
              color: p.textMuted,
            }}
          >
            {ticket.ticketNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 500,
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
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 6px",
                  background: p.warningBg,
                  border: `1px solid ${p.warningBorder}`,
                  color: p.warningText,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
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
                  fontSize: 10.5,
                  padding: "1px 6px",
                  background: p.surfaceMuted,
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
      <div>
        {ticket.category === "completed" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontWeight: 500,
              padding: "3px 8px",
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
              fontWeight: 500,
              padding: "3px 8px",
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
              fontWeight: 500,
              padding: "3px 8px",
              background: p.surfaceMuted,
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
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: priorityColor(ticket.priority),
        }}
      >
        {ticket.priority.replace(/\s*\(.*\)/, "")}
      </div>
      <div
        style={{
          textAlign: "right",
          fontSize: 13,
          fontWeight: 600,
          color: p.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ticket.storyPoint || "—"}
      </div>
      <div
        style={{
          textAlign: "right",
          fontSize: 12,
          color: dueColor,
          fontWeight: dueDays != null && dueDays < 0 ? 600 : 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          justifyContent: "flex-end",
        }}
      >
        {ticket.dueDate ? (
          <>
            <Clock size={11} />
            {dueDays != null && dueDays < 0
              ? `${Math.abs(dueDays)}d over`
              : dueDays === 0
              ? "Today"
              : dueDays != null && dueDays <= 7
              ? `${dueDays}d`
              : fmtDate(ticket.dueDate)}
          </>
        ) : (
          <span style={{ color: p.textFaint }}>—</span>
        )}
      </div>
    </div>
  );
}
