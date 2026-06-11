"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  FileText,
  CalendarCheck,
  GitPullRequest,
  CheckSquare,
  LifeBuoy,
  Rocket,
  ChevronRight,
  ArrowUpRight,
  CalendarDays,
  AlertCircle,
  Sparkles,
  Target,
  Activity,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  Building2,
  Users,
} from "lucide-react";
import { Spin } from "antd";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";

import {
  portalInvoiceService,
  PortalInvoiceListItem,
  PortalInvoiceListMeta,
} from "@/services/portalInvoiceService";
import {
  portalSprintService,
  PortalSprintListItem,
} from "@/services/portalSprintService";
import {
  portalDocumentService,
  PortalDocument,
} from "@/services/portalDocumentService";
import { portalCrService, PortalCrListItem } from "@/services/portalCrService";
import {
  portalApprovalsService,
  PortalApprovalListItem,
} from "@/services/portalApprovalsService";
import {
  portalTicketService,
  PortalTicketListItem,
} from "@/services/portalTicketService";
import {
  portalReleaseService,
  PortalRelease,
} from "@/services/portalReleaseService";
import {
  portalMilestoneService,
  PortalMilestone,
} from "@/services/portalMilestoneService";

/* ─────────────────────────────────────────────────────────
 * Design tokens — tight, dense, premium
 * ─────────────────────────────────────────────────────── */
const T = {
  pageBg: "#f6f7f9",
  cardBg: "#ffffff",
  border: "#e5e7eb",
  borderHover: "#cbd5e1",
  borderSoft: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  numFont:
    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

const GAP = 12;
const PAGE_PAD_X = 28;
const PAGE_PAD_Y = 24;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const formatLongDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const fmtCurrency = (n: number, currency: string | null) => {
  const sym =
    currency === "USD" || !currency
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : currency === "INR"
            ? "₹"
            : "";
  return `${sym}${Number(n).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
};

const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 86_400_000);

/* ─────────────────────────────────────────────────────────
 * Shared primitives
 * ─────────────────────────────────────────────────────── */
const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  href?: string;
  accent?: string;
  trailing?: React.ReactNode;
}> = ({ title, icon, href, accent = T.textMuted, trailing }) => (
  <div
    style={{
      padding: "11px 14px",
      borderBottom: `1px solid ${T.borderSoft}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#fcfcfd",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 600,
        color: T.text,
        fontSize: 12.5,
        letterSpacing: "-0.005em",
      }}
    >
      <span style={{ color: accent, display: "inline-flex" }}>{icon}</span>
      {title}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {trailing}
      {href && (
        <Link
          href={href}
          style={{
            fontSize: 11.5,
            color: T.textSubtle,
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            padding: "2px 5px",
            borderRadius: 5,
            transition: "background 120ms ease, color 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.borderSoft;
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = T.textSubtle;
          }}
        >
          View all
          <ArrowUpRight size={11} />
        </Link>
      )}
    </div>
  </div>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      padding: "22px 16px",
      textAlign: "center",
      color: T.textFaint,
      fontSize: 12,
      fontWeight: 500,
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: T.borderSoft,
        border: `1px solid ${T.border}`,
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.textFaint,
      }}
    >
      <Sparkles size={13} />
    </div>
    {label}
  </div>
);

const LoadingState: React.FC = () => (
  <div style={{ padding: "22px 16px", textAlign: "center", flex: 1 }}>
    <Spin size="small" />
  </div>
);

const RowItem: React.FC<{
  href: string;
  children: React.ReactNode;
  dense?: boolean;
}> = ({ href, children, dense }) => (
  <Link
    href={href}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: dense ? "9px 14px" : "10px 14px",
      borderBottom: `1px solid ${T.borderSoft}`,
      textDecoration: "none",
      color: "inherit",
      transition: "background 120ms ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <div
      style={{
        display: "flex",
        flex: 1,
        minWidth: 0,
        alignItems: "center",
        gap: 10,
      }}
    >
      {children}
    </div>
    <ChevronRight
      size={14}
      color={T.textFaint}
      style={{ flexShrink: 0, marginLeft: 8 }}
    />
  </Link>
);

const StatusPill: React.FC<{
  label: string;
  tone?: "neutral" | "success" | "warn" | "danger" | "info";
}> = ({ label, tone = "neutral" }) => {
  const palette = {
    neutral: { bg: "#f1f5f9", fg: "#334155", border: "#e2e8f0" },
    success: { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" },
    warn: { bg: "#fffbeb", fg: "#b45309", border: "#fde68a" },
    danger: { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" },
    info: { bg: "#eef2ff", fg: "#4338ca", border: "#c7d2fe" },
  }[tone];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: palette.fg,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        padding: "1.5px 6px",
        borderRadius: 999,
        textTransform: "capitalize",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {label.replaceAll("_", " ").toLowerCase()}
    </span>
  );
};

const toneFor = (
  status: string,
): "neutral" | "success" | "warn" | "danger" | "info" => {
  const s = status?.toLowerCase();
  if (
    ["paid", "approved", "delivered", "resolved", "closed", "completed"].includes(s)
  )
    return "success";
  if (["overdue", "rejected", "cancelled", "expired", "critical"].includes(s))
    return "danger";
  if (
    ["partially_paid", "in_review", "under_review", "waiting_on_client", "scheduled", "on_hold"].includes(s)
  )
    return "warn";
  if (["sent", "viewed", "submitted", "estimated", "in_progress", "new", "active"].includes(s))
    return "info";
  return "neutral";
};

/* ─────────────────────────────────────────────────────────
 * KPI Tile
 * ─────────────────────────────────────────────────────── */
const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  context: string;
  icon: React.ReactNode;
  href: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  trailing?: React.ReactNode;
  loading?: boolean;
}> = ({ label, value, context, icon, href, accent, accentBg, accentBorder, trailing, loading }) => (
  <Link
    href={href}
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      textDecoration: "none",
      transition: "border-color 150ms ease, transform 150ms ease",
      position: "relative",
      minHeight: 122,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = T.borderHover;
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = T.border;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: accentBg,
          color: accent,
          border: `1px solid ${accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <ArrowUpRight size={14} color={T.textFaint} />
    </div>
    <div>
      <div
        style={{
          fontSize: 10,
          color: T.textSubtle,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.03em",
          marginTop: 5,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          minHeight: 24,
          display: "flex",
          alignItems: "center",
        }}
      >
        {loading ? (
          <span style={{ color: T.textFaint, fontSize: 16, fontWeight: 500 }}>—</span>
        ) : (
          value
        )}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: T.textSubtle,
          marginTop: 5,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {context}
        </span>
        {trailing}
      </div>
    </div>
  </Link>
);

/* ─────────────────────────────────────────────────────────
 * Recent activity helpers
 * ─────────────────────────────────────────────────────── */
type ActivitySource = "zukvo" | "team";
type ActivityModuleKey =
  | "documents"
  | "tickets"
  | "milestones"
  | "releases"
  | "approvals"
  | "change-requests"
  | "invoices"
  | "sprints";

interface ActivityItem {
  id: string;
  module: ActivityModuleKey;
  moduleLabel: string;
  href: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  Icon: any;
  action: string;
  target?: string | null;
  source: ActivitySource;
  actorName?: string | null;
  occurredAt: string;
}

const MODULE_META: Record<
  ActivityModuleKey,
  {
    label: string;
    accent: string;
    accentBg: string;
    accentBorder: string;
    Icon: any;
  }
> = {
  documents: { label: "Documents", accent: "#0d9488", accentBg: "#ccfbf1", accentBorder: "#99f6e4", Icon: FileText },
  tickets: { label: "Tickets", accent: "#be123c", accentBg: "#ffe4e6", accentBorder: "#fecdd3", Icon: LifeBuoy },
  milestones: { label: "Milestones", accent: "#7c3aed", accentBg: "#f5f3ff", accentBorder: "#ddd6fe", Icon: Flag },
  releases: { label: "Releases", accent: "#5b21b6", accentBg: "#ede9fe", accentBorder: "#ddd6fe", Icon: Rocket },
  approvals: { label: "Approvals", accent: "#b45309", accentBg: "#fffbeb", accentBorder: "#fde68a", Icon: CheckSquare },
  "change-requests": { label: "Change request", accent: "#7c2d12", accentBg: "#fff7ed", accentBorder: "#fed7aa", Icon: GitPullRequest },
  invoices: { label: "Invoices", accent: "#4338ca", accentBg: "#eef2ff", accentBorder: "#c7d2fe", Icon: Receipt },
  sprints: { label: "Sprints", accent: "#0d9488", accentBg: "#ccfbf1", accentBorder: "#99f6e4", Icon: CalendarCheck },
};

function relativeTimeShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffMs = Date.now() - ts;
  const sec = Math.round(diffMs / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(day / 365);
  return `${yr}y ago`;
}

function fmtAbsDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────────────────
 * Data hook
 * ─────────────────────────────────────────────────────── */
function useDashboardData() {
  const [invoiceMeta, setInvoiceMeta] = useState<PortalInvoiceListMeta | null>(null);
  const [invoices, setInvoices] = useState<PortalInvoiceListItem[]>([]);
  const [sprints, setSprints] = useState<PortalSprintListItem[]>([]);
  const [milestones, setMilestones] = useState<PortalMilestone[]>([]);
  const [approvals, setApprovals] = useState<PortalApprovalListItem[]>([]);
  const [tickets, setTickets] = useState<PortalTicketListItem[]>([]);
  const [crs, setCrs] = useState<PortalCrListItem[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [releases, setReleases] = useState<PortalRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalInvoiceService
        .list({ limit: 6 })
        .then((r) => {
          setInvoices(r.data);
          setInvoiceMeta(r.meta);
        })
        .catch(() => {}),
      portalSprintService
        .list({ limit: 6 })
        .then((r) => setSprints(r.data))
        .catch(() => {}),
      portalMilestoneService
        .list()
        .then((r) => setMilestones(r))
        .catch(() => {}),
      portalApprovalsService
        .list({ status: "open", limit: 6 })
        .then((r) => setApprovals(r.data))
        .catch(() => {}),
      portalTicketService
        .list({ limit: 50 })
        .then((r) => setTickets(r.data))
        .catch(() => {}),
      portalCrService
        .list({ limit: 6 })
        .then((r) => setCrs(r.data))
        .catch(() => {}),
      portalDocumentService
        .list({})
        .then((r) => setDocuments(r.data as PortalDocument[]))
        .catch(() => {}),
      portalReleaseService
        .list({ limit: 6 })
        .then((r) => setReleases(r.data))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return {
    invoiceMeta,
    invoices,
    sprints,
    milestones,
    approvals,
    tickets,
    crs,
    documents,
    releases,
    loading,
  };
}

/* ─────────────────────────────────────────────────────────
 * Hero — compact one-row banner
 * ─────────────────────────────────────────────────────── */
const Hero: React.FC<{
  companyName?: string;
  displayName?: string;
  summary: {
    invoicesOpen: number;
    sprintsActive: number;
    milestonesActive: number;
    ticketsOpen: number;
  };
}> = ({ companyName, displayName, summary }) => {
  const greeting = useMemo(getGreeting, []);
  const today = useMemo(() => new Date(), []);
  return (
    <div
      className="portal-hero-container"
      style={{
        background: T.cardBg,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(180deg, #4338ca 0%, #0d9488 100%)",
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.022em",
            lineHeight: 1.2,
          }}
        >
          {greeting},{" "}
          <span style={{ color: "#4338ca" }}>
            {displayName?.split(" ")[0] || "there"}
          </span>
          <span style={{ color: T.textFaint, fontWeight: 500, marginLeft: 8 }}>
            · {companyName || "Workspace"}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: T.textSubtle,
            marginTop: 4,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CalendarDays size={12} />
          {formatLongDate(today)}
        </div>
      </div>
      <div className="portal-hero-stats" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {[
          { label: "Invoices", value: summary.invoicesOpen, accent: "#4338ca" },
          { label: "Sprints", value: summary.sprintsActive, accent: "#0d9488" },
          { label: "Milestones", value: summary.milestonesActive, accent: "#7c3aed" },
          { label: "Tickets", value: summary.ticketsOpen, accent: "#be123c" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "8px 14px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              background: "#fafbfc",
              minWidth: 70,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: T.textSubtle,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: s.accent,
                marginTop: 2,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
 * Active Sprint hero card
 * ─────────────────────────────────────────────────────── */
const ActiveSprintCard: React.FC<{
  sprint: PortalSprintListItem | null;
  loading: boolean;
}> = ({ sprint, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Active Sprint" icon={<CalendarCheck size={13} />} accent="#0d9488" />
        <LoadingState />
      </Card>
    );
  }
  if (!sprint) {
    return (
      <Card>
        <CardHeader title="Active Sprint" icon={<CalendarCheck size={13} />} href="/portal/sprints" accent="#0d9488" />
        <EmptyState label="No active sprint in flight" />
      </Card>
    );
  }

  const pct = sprint.completionPercent ?? 0;
  const daysLeft = sprint.endDate ? daysBetween(new Date(), new Date(sprint.endDate)) : null;

  return (
    <Card>
      <CardHeader
        title="Active Sprint"
        icon={<CalendarCheck size={13} />}
        href={`/portal/sprints/${sprint.id}`}
        accent="#0d9488"
        trailing={<StatusPill label={sprint.status} tone={toneFor(sprint.status)} />}
      />
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: T.text,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              {sprint.version}
            </div>
            <div
              style={{
                fontSize: 12,
                color: T.textSubtle,
                marginTop: 2,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {sprint.project?.name || "Project sprint"}
              {sprint.goal ? ` · ${sprint.goal}` : ""}
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: T.text,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.025em",
              lineHeight: 1,
            }}
          >
            {pct}
            <span style={{ fontSize: 14, color: T.textFaint, fontWeight: 600 }}>%</span>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 7,
              borderRadius: 999,
              background: "#f1f5f9",
              border: `1px solid ${T.borderSoft}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, pct))}%`,
                background:
                  "linear-gradient(90deg, #0d9488 0%, #14b8a6 60%, #2dd4bf 100%)",
                transition: "width 600ms ease",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          {[
            { label: "Done", value: sprint.doneCount, total: sprint.ticketCount, tone: "#059669" },
            { label: "Blocked", value: sprint.blockedCount, tone: "#dc2626" },
            { label: "Points", value: `${sprint.completedPoints}/${sprint.committedPoints}`, tone: T.text },
            {
              label: "Days left",
              value: daysLeft != null ? Math.max(0, daysLeft) : "—",
              tone: daysLeft != null && daysLeft < 3 ? "#b45309" : T.text,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "8px 10px",
                background: "#fafbfc",
                border: `1px solid ${T.borderSoft}`,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: T.textSubtle,
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: s.tone,
                  marginTop: 2,
                  letterSpacing: "-0.015em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.value}
                {s.total != null && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: T.textFaint,
                      marginLeft: 3,
                    }}
                  >
                    /{s.total}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/* ─────────────────────────────────────────────────────────
 * Milestones panel — individual + aggregate progress
 * ─────────────────────────────────────────────────────── */
const MilestonesPanel: React.FC<{
  milestones: PortalMilestone[];
  loading: boolean;
}> = ({ milestones, loading }) => {
  const activeMilestones = milestones.filter(
    (m) => m.status !== "completed" && m.status !== "cancelled",
  );
  const display = (activeMilestones.length ? activeMilestones : milestones).slice(0, 5);

  const totals = milestones.reduce(
    (acc, m) => {
      acc.itemsDone += m.itemsDone || 0;
      acc.itemsTotal += m.itemsTotal || 0;
      return acc;
    },
    { itemsDone: 0, itemsTotal: 0 },
  );
  const overallPct = totals.itemsTotal
    ? Math.round((totals.itemsDone / totals.itemsTotal) * 100)
    : 0;
  const completedCount = milestones.filter((m) => m.status === "completed").length;

  return (
    <Card>
      <CardHeader
        title="Milestones"
        icon={<Flag size={13} />}
        href="/portal/milestones"
        accent="#7c3aed"
        trailing={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11.5,
              color: T.textMuted,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                color: T.text,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {overallPct}%
            </span>
            <span style={{ color: T.textFaint, fontWeight: 500 }}>
              {completedCount}/{milestones.length} done
            </span>
          </div>
        }
      />

      {/* Aggregate progress bar */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${T.borderSoft}`,
          background: "#fcfcfd",
        }}
      >
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "#f1f5f9",
            border: `1px solid ${T.borderSoft}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, overallPct))}%`,
              background:
                "linear-gradient(90deg, #6d28d9 0%, #7c3aed 60%, #a78bfa 100%)",
              transition: "width 600ms ease",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10.5,
            color: T.textSubtle,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <span>Overall delivery</span>
          <span style={{ fontVariantNumeric: "tabular-nums", color: T.textMuted }}>
            {totals.itemsDone} / {totals.itemsTotal} items
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : display.length === 0 ? (
        <EmptyState label="No milestones yet" />
      ) : (
        <div>
          {display.map((m) => {
            const pct = m.progress ?? 0;
            const statusIcon =
              m.status === "completed" ? (
                <CheckCircle2 size={14} color="#059669" />
              ) : m.status === "in_progress" ? (
                <Activity size={14} color="#4338ca" />
              ) : m.status === "on_hold" ? (
                <Clock size={14} color="#b45309" />
              ) : (
                <Circle size={14} color={T.textFaint} />
              );
            return (
              <Link
                key={m.id}
                href="/portal/milestones"
                style={{
                  display: "block",
                  padding: "10px 14px",
                  borderBottom: `1px solid ${T.borderSoft}`,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{statusIcon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: T.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: T.textSubtle,
                          marginTop: 1,
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.projectName || "—"}
                        {" · "}
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {m.itemsDone}/{m.itemsTotal} items
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: T.text,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.01em",
                      minWidth: 36,
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 5,
                    borderRadius: 999,
                    background: "#f1f5f9",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, Math.max(0, pct))}%`,
                      background:
                        m.status === "completed"
                          ? "#10b981"
                          : m.status === "on_hold"
                            ? "#f59e0b"
                            : "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
                      transition: "width 600ms ease",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
};


/* ─────────────────────────────────────────────────────────
 * Recent activity widgets
 * ─────────────────────────────────────────────────────── */
const InvoicesWidget: React.FC<{
  data: PortalInvoiceListItem[];
  loading: boolean;
}> = ({ data, loading }) => (
  <Card>
    <CardHeader title="Recent Invoices" icon={<Receipt size={13} />} href="/portal/invoices" accent="#4338ca" />
    {loading ? (
      <LoadingState />
    ) : data.length === 0 ? (
      <EmptyState label="No invoices yet" />
    ) : (
      <div>
        {data.slice(0, 6).map((inv) => (
          <RowItem key={inv.id} href={`/portal/invoices/${inv.id}`} dense>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: T.text,
                  fontFamily: T.numFont,
                  letterSpacing: "-0.01em",
                }}
              >
                {inv.invoiceNumber}
              </div>
              <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 1, fontWeight: 500 }}>
                Due {new Date(inv.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 3,
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: T.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtCurrency(Number(inv.grandTotal || inv.subtotal || 0), inv.currency)}
              </div>
              <StatusPill
                label={inv.isOverdue ? "Overdue" : inv.status}
                tone={inv.isOverdue ? "danger" : toneFor(inv.status)}
              />
            </div>
          </RowItem>
        ))}
      </div>
    )}
  </Card>
);



const DocumentsWidget: React.FC<{
  data: PortalDocument[];
  loading: boolean;
}> = ({ data, loading }) => (
  <Card>
    <CardHeader title="Documents" icon={<FileText size={13} />} href="/portal/documents" accent="#b45309" />
    {loading ? (
      <LoadingState />
    ) : data.length === 0 ? (
      <EmptyState label="No documents shared" />
    ) : (
      <div>
        {data.slice(0, 6).map((doc) => (
          <RowItem key={doc.id} href={`/portal/documents`} dense>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={11} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {doc.title || doc.fileName}
              </div>
              <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 1, fontWeight: 500 }}>
                {new Date(doc.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </RowItem>
        ))}
      </div>
    )}
  </Card>
);


/* ─────────────────────────────────────────────────────────
 * Recent Activities — unified feed from loaded portal data
 * ─────────────────────────────────────────────────────── */
const RecentActivities: React.FC<{
  data: {
    documents: PortalDocument[];
    tickets: PortalTicketListItem[];
    milestones: PortalMilestone[];
    releases: PortalRelease[];
    approvals: PortalApprovalListItem[];
    crs: PortalCrListItem[];
    invoices: PortalInvoiceListItem[];
    sprints: PortalSprintListItem[];
  };
  loading: boolean;
}> = ({ data, loading }) => {
  const items: ActivityItem[] = useMemo(() => {
    const out: ActivityItem[] = [];

    const base = (mod: ActivityModuleKey) => {
      const meta = MODULE_META[mod];
      return {
        module: mod,
        moduleLabel: meta.label,
        href: `/portal/${mod}`,
        accent: meta.accent,
        accentBg: meta.accentBg,
        accentBorder: meta.accentBorder,
        Icon: meta.Icon,
      };
    };

    for (const d of data.documents) {
      const occurredAt = d.updatedAt || d.createdAt;
      if (!occurredAt) continue;
      out.push({
        ...base("documents"),
        id: `doc:${d.id}`,
        action:
          d.updatedAt && d.updatedAt !== d.createdAt
            ? "Document updated"
            : "New document added",
        target: d.fileName,
        source: d.uploadedByPortal ? "team" : "zukvo",
        actorName: d.uploadedByName,
        occurredAt,
      });
    }

    for (const t of data.tickets) {
      if (!t.createdAt) continue;
      out.push({
        ...base("tickets"),
        id: `tkt:${t.id}`,
        action: "Ticket raised",
        target:
          (t as any).title || (t as any).subject || (t as any).code || null,
        source: "team",
        occurredAt: t.createdAt,
      });
    }

    for (const m of data.milestones) {
      const occurredAt = m.updatedAt || m.createdAt;
      if (!occurredAt) continue;
      const action =
        m.status === "completed"
          ? "Milestone completed"
          : m.status === "in_progress"
            ? "Milestone in progress"
            : m.updatedAt && m.updatedAt !== m.createdAt
              ? "Milestone updated"
              : "Milestone added";
      out.push({
        ...base("milestones"),
        id: `ms:${m.id}`,
        action,
        target: m.name,
        source: "zukvo",
        occurredAt,
      });
    }

    for (const r of data.releases) {
      const occurredAt = r.updatedAt || r.releaseDate || r.createdAt;
      if (!occurredAt) continue;
      out.push({
        ...base("releases"),
        id: `rel:${r.id}`,
        action: r.version ? `Release ${r.version} published` : "Release published",
        target: r.title,
        source: "zukvo",
        occurredAt,
      });
    }

    for (const a of data.approvals) {
      if (!a.createdAt) continue;
      out.push({
        ...base("approvals"),
        id: `app:${a.id}`,
        action: "Approval requested",
        target: (a as any).title || (a as any).subject || null,
        source: "zukvo",
        occurredAt: a.createdAt,
      });
    }

    for (const c of data.crs) {
      if (!c.createdAt) continue;
      out.push({
        ...base("change-requests"),
        href: `/portal/change-requests`,
        id: `cr:${c.id}`,
        action: "Change request submitted",
        target: (c as any).title || (c as any).subject || null,
        source: "team",
        occurredAt: c.createdAt,
      });
    }

    for (const i of data.invoices) {
      const sentAt = (i as any).sentAt as string | null;
      const paidAt = (i as any).paidAt as string | null;
      const occurredAt = paidAt || sentAt || (i as any).dueDate;
      if (!occurredAt) continue;
      out.push({
        ...base("invoices"),
        id: `inv:${i.id}`,
        action: paidAt
          ? "Invoice paid"
          : sentAt
            ? "Invoice sent"
            : "Invoice due",
        target: (i as any).invoiceNumber || null,
        source: "zukvo",
        occurredAt,
      });
    }

    for (const s of data.sprints) {
      const occurredAt = (s as any).updatedAt || (s as any).createdAt;
      if (!occurredAt) continue;
      const lower = (s.status || "").toLowerCase();
      const action =
        lower === "completed"
          ? "Sprint completed"
          : lower === "active"
            ? "Sprint started"
            : "Sprint updated";
      out.push({
        ...base("sprints"),
        id: `spr:${s.id}`,
        action,
        target: (s as any).version || (s as any).name || null,
        source: "zukvo",
        occurredAt,
      });
    }

    return out
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, 40);
  }, [data]);

  return (
    <Card>
      <CardHeader
        title="Recent activity"
        icon={<Activity size={13} />}
        accent="#4338ca"
      />
      <div
        style={{
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          marginTop: 4,
        }}
      >
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState label="No activity yet" />
        ) : (
          <div>
            {items.map((it) => (
              <ActivityRow key={it.id} item={it} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

const ActivityRow: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        textDecoration: "none",
        color: "inherit",
        borderBottom: `1px solid ${T.borderSoft}`,
        padding: "10px 4px",
        transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "#fafbfc";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
      }}
    >
      {/* Icon tile — fixed width, never wraps */}
      <span
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 8,
          background: item.accentBg,
          border: `1px solid ${item.accentBorder}`,
          color: item.accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={14} strokeWidth={2.2} />
      </span>

      {/* Main content column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title line: action — target */}
        <div
          style={{
            fontSize: 13,
            color: T.text,
            fontWeight: 600,
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
          }}
        >
          {item.action}
          {item.target && (
            <>
              {" "}
              <span style={{ color: T.textMuted, fontWeight: 500 }}>
                — {item.target}
              </span>
            </>
          )}
        </div>

        {/* Meta line: module · date */}
        <div
          style={{
            marginTop: 4,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "3px 6px",
            fontSize: 11,
            color: T.textSubtle,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: item.accent, fontWeight: 600 }}>
            {item.moduleLabel}
          </span>
          <span style={{ color: T.textFaint }}>·</span>
          <span>{fmtAbsDateTime(item.occurredAt)}</span>
        </div>
      </div>

      <ChevronRight
        size={13}
        color={T.textFaint}
        style={{ marginTop: 8, flexShrink: 0 }}
      />
    </Link>
  );
};

/* ─────────────────────────────────────────────────────────
 * Page
 * ─────────────────────────────────────────────────────── */
export default function PortalDashboardPage() {
  const { user } = useClientPortalAuth();
  const {
    invoiceMeta,
    invoices,
    sprints,
    milestones,
    approvals,
    tickets,
    crs,
    documents,
    releases,
    loading,
  } = useDashboardData();

  const activeSprint = useMemo(
    () =>
      sprints.find((s) => s.status?.toLowerCase() === "active") ||
      sprints.find((s) => s.status?.toLowerCase() === "in_progress") ||
      sprints[0] ||
      null,
    [sprints],
  );

  const openTicketCount = useMemo(
    () => tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length,
    [tickets],
  );

  const activeMilestoneCount = useMemo(
    () =>
      milestones.filter(
        (m) => m.status !== "completed" && m.status !== "cancelled",
      ).length,
    [milestones],
  );

  const milestoneAggregate = useMemo(() => {
    const totals = milestones.reduce(
      (acc, m) => {
        acc.itemsDone += m.itemsDone || 0;
        acc.itemsTotal += m.itemsTotal || 0;
        return acc;
      },
      { itemsDone: 0, itemsTotal: 0 },
    );
    const pct = totals.itemsTotal
      ? Math.round((totals.itemsDone / totals.itemsTotal) * 100)
      : 0;
    const completed = milestones.filter((m) => m.status === "completed").length;
    return { pct, completed, total: milestones.length, ...totals };
  }, [milestones]);

  const balanceDue = invoiceMeta?.summary?.totalBalanceDue ?? 0;
  const currency = invoiceMeta?.summary?.currency ?? null;
  const openInvoiceCount = invoices.filter(
    (i) => !["PAID", "CANCELLED"].includes(i.status),
  ).length;

  return (
    <div
      style={{
        background: T.pageBg,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          padding: `${PAGE_PAD_Y}px ${PAGE_PAD_X}px ${PAGE_PAD_Y + 8}px`,
          maxWidth: 1480,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: GAP,
        }}
      >
        {/* Hero with inline summary chips */}
        <Hero
          companyName={user?.client?.companyName}
          displayName={user?.displayName || user?.username}
          summary={{
            invoicesOpen: openInvoiceCount,
            sprintsActive: sprints.filter((s) => s.status?.toLowerCase() === "active").length,
            milestonesActive: activeMilestoneCount,
            ticketsOpen: openTicketCount,
          }}
        />

        {/* KPI strip — tight 4 cols */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: GAP,
          }}
        >
          <StatTile
            label="Outstanding"
            value={fmtCurrency(Number(balanceDue), currency)}
            context={Number(balanceDue) > 0 ? "Across open invoices" : "All caught up"}
            icon={<Receipt size={15} strokeWidth={2.2} />}
            href="/portal/invoices"
            accent="#4338ca"
            accentBg="#eef2ff"
            accentBorder="#c7d2fe"
            loading={loading}
          />
          <StatTile
            label="Active Sprint"
            value={activeSprint ? `${activeSprint.completionPercent}%` : "—"}
            context={
              activeSprint
                ? activeSprint.project?.name || activeSprint.version
                : "No active sprint"
            }
            icon={<Activity size={15} strokeWidth={2.2} />}
            href="/portal/sprints"
            accent="#0d9488"
            accentBg="#ccfbf1"
            accentBorder="#99f6e4"
            trailing={
              activeSprint ? (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#0d9488",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {activeSprint.doneCount}/{activeSprint.ticketCount}
                </span>
              ) : null
            }
            loading={loading}
          />
          <StatTile
            label="Milestone Progress"
            value={`${milestoneAggregate.pct}%`}
            context={
              milestoneAggregate.total > 0
                ? `${milestoneAggregate.itemsDone}/${milestoneAggregate.itemsTotal} items delivered`
                : "No milestones yet"
            }
            icon={<Flag size={15} strokeWidth={2.2} />}
            href="/portal/milestones"
            accent="#7c3aed"
            accentBg="#f5f3ff"
            accentBorder="#ddd6fe"
            trailing={
              milestoneAggregate.total > 0 ? (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#7c3aed",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {milestoneAggregate.completed}/{milestoneAggregate.total}
                </span>
              ) : null
            }
            loading={loading}
          />
          <StatTile
            label="Open Tickets"
            value={openTicketCount}
            context={openTicketCount > 0 ? "In flight or new" : "Inbox is clear"}
            icon={<Target size={15} strokeWidth={2.2} />}
            href="/portal/tickets"
            accent="#be123c"
            accentBg="#ffe4e6"
            accentBorder="#fecdd3"
            loading={loading}
          />
        </div>

        {/* Main grid — left: Sprint + Milestones + secondary widgets, right: Recent Activities (tall) */}
        <div
          className="portal-home-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
            gap: GAP,
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GAP,
              minWidth: 0,
            }}
          >
            <ActiveSprintCard sprint={activeSprint} loading={loading} />
            <MilestonesPanel milestones={milestones} loading={loading} />
            <div
              className="portal-home-secondary-row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: GAP,
                alignItems: "stretch",
              }}
            >
              <DocumentsWidget data={documents} loading={loading} />
              <InvoicesWidget data={invoices} loading={loading} />
            </div>
          </div>

          {/* Right column — tall Recent Activities */}
          <RecentActivities
            data={{
              documents,
              tickets,
              milestones,
              releases,
              approvals,
              crs,
              invoices,
              sprints,
            }}
            loading={loading}
          />
        </div>
      </div>

      <style jsx global>{`
        .portal-hero-container {
          position: sticky;
          top: 0;
          z-index: 50;
        }
        @media (max-width: 900px) {
          .portal-hero-container {
            flex-direction: column;
            align-items: stretch !important;
          }
          .portal-hero-stats {
            flex-wrap: wrap;
            justify-content: flex-start;
          }
          .portal-hero-stats > div {
            flex: 1;
            min-width: calc(50% - 6px);
          }
        }
        @media (max-width: 1280px) {
          .portal-home-secondary-row {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .portal-home-secondary-row > :nth-child(3) {
            grid-column: span 2;
          }
        }
        @media (max-width: 1080px) {
          .portal-home-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 900px) {
          .portal-home-secondary-row {
            grid-template-columns: 1fr !important;
          }
          .portal-home-secondary-row > :nth-child(3) {
            grid-column: auto;
          }
        }
        .ant-empty-img-simple path,
        .ant-empty-image svg path,
        .ant-empty-image path {
          fill: #f8fafc !important;
          stroke: #cbd5e1 !important;
        }
        .ant-empty-img-simple ellipse,
        .ant-empty-image svg ellipse,
        .ant-empty-image ellipse {
          fill: #e2e8f0 !important;
          stroke: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
}
