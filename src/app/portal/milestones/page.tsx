"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spin, Empty } from "antd";
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
} from "lucide-react";
import {
  portalMilestoneService,
  PortalMilestone,
  PortalMilestoneStatus,
} from "@/services/portalMilestoneService";

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
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
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
    bg: p.warningBg,
    border: p.warningBorder,
    color: p.warningText,
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

function fmtDate(iso: string | null | undefined): string {
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

export default function PortalMilestonesPage() {
  const [items, setItems] = useState<PortalMilestone[]>([]);
  const [loading, setLoading] = useState(true);

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

  const counts = useMemo(() => {
    const total = items.length;
    const completed = items.filter((m) => m.status === "completed").length;
    const inProgress = items.filter((m) => m.status === "in_progress").length;
    const itemsTotal = items.reduce((a, m) => a + m.itemsTotal, 0);
    const itemsDone = items.reduce((a, m) => a + m.itemsDone, 0);
    const overallPct =
      itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 100) : 0;
    return { total, completed, inProgress, itemsTotal, itemsDone, overallPct };
  }, [items]);

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
          Milestones
        </h1>
        <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
          Where each milestone of your delivery stands today, with a transparent
          breakdown of the work behind it.
        </div>
      </div>

      {/* Summary strip */}
      {items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <SummaryCard
            icon={Flag}
            label="Milestones"
            value={String(counts.total)}
            tone={{ bg: p.accentBg, border: p.accentBorder, color: p.accentText }}
          />
          <SummaryCard
            icon={Clock}
            label="In progress"
            value={String(counts.inProgress)}
            tone={{ bg: p.warningBg, border: p.warningBorder, color: p.warningText }}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={String(counts.completed)}
            tone={{ bg: p.successBg, border: p.successBorder, color: p.successText }}
          />
          <SummaryCard
            icon={ListChecks}
            label="Overall progress"
            value={`${counts.overallPct}%`}
            tone={{ bg: p.purpleBg, border: p.purpleBorder, color: p.purpleText }}
          />
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div style={{ padding: 80, textAlign: "center" }}>
          <Spin />
        </div>
      ) : items.length === 0 ? (
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
                Your delivery plan hasn't been set up yet. Your account team
                will publish it here soon.
              </span>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: { bg: string; border: string; color: string };
}) {
  return (
    <div
      style={{
        padding: 14,
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          color: tone.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div
          style={{
            fontSize: 10.5,
            color: p.textSubtle,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 18,
            fontWeight: 700,
            color: p.text,
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: PortalMilestone }) {
  const [open, setOpen] = useState(milestone.status !== "completed");
  const meta = STATUS_META[milestone.status] || STATUS_META.not_started;
  const StatusIcon = meta.icon;
  const overdue =
    milestone.estEndDate &&
    milestone.status !== "completed" &&
    milestone.status !== "cancelled" &&
    new Date(milestone.estEndDate).getTime() < Date.now();

  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            color: meta.color,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <StatusIcon size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
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
                fontSize: 14.5,
                fontWeight: 600,
                color: p.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 480,
              }}
            >
              {milestone.name}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 8px",
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                color: meta.color,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {meta.label}
            </span>
            {milestone.projectName && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: p.textSubtle,
                }}
              >
                <FolderKanban size={11} />
                {milestone.projectName}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 11.5,
              color: p.textSubtle,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} />
              {fmtDate(milestone.estStartDate)} → {fmtDate(milestone.estEndDate)}
            </span>
            {milestone.actualEndDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: p.successText,
                }}
              >
                <CheckCircle2 size={11} />
                Delivered {fmtDate(milestone.actualEndDate)}
              </span>
            )}
            {overdue && (
              <span
                style={{
                  color: p.dangerText,
                  fontWeight: 600,
                }}
              >
                Overdue
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ListChecks size={11} />
              {milestone.itemsDone}/{milestone.itemsTotal} items
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                position: "relative",
                height: 6,
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${milestone.progress}%`,
                  background:
                    milestone.status === "completed"
                      ? "linear-gradient(90deg, #10b981, #14b8a6)"
                      : "linear-gradient(90deg, #8b5cf6, #6366f1)",
                  transition: "width 220ms ease",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: p.textFaint,
                fontWeight: 500,
              }}
            >
              {milestone.progress}% complete
            </div>
          </div>
        </div>
        {open ? (
          <ChevronDown size={16} color={p.textFaint} />
        ) : (
          <ChevronRight size={16} color={p.textFaint} />
        )}
      </div>

      {open && (
        <div
          style={{
            padding: "0 18px 18px",
            borderTop: `1px solid ${p.border}`,
          }}
        >
          {milestone.description && (
            <div
              style={{
                marginTop: 14,
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
                  marginTop: 14,
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSubtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ListChecks size={12} />
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
                      padding: "8px 10px",
                      background: it.isCompleted ? p.successBg : p.surfaceMuted,
                      border: `1px solid ${
                        it.isCompleted ? p.successBorder : p.border
                      }`,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: it.isCompleted ? p.successText : p.surfaceElevated,
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
                      {it.isCompleted && <CheckSquare size={14} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: p.text,
                          textDecoration: it.isCompleted ? "line-through" : "none",
                          opacity: it.isCompleted ? 0.7 : 1,
                        }}
                      >
                        {it.name}
                      </div>
                      {it.description && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 11.5,
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
