"use client";

/**
 * Shared chrome for the QA Submissions pages.
 *
 * The QA Space pages each inline their own <style> block; this module holds the
 * parts the three submission pages (list, form, detail) genuinely share, so the
 * dashboard, the create form and the read-only record stay visually identical
 * without three copies of the same CSS drifting apart.
 *
 * Palette is the product standard: blue for active/primary, green for good
 * outcomes, ash for neutral/inert, and red reserved for destructive actions and
 * genuine failure states.
 */

import React from "react";
import dayjs from "dayjs";
import type {
  QaRecommendation,
  RetestingStatus,
  SubmissionStatus,
} from "@/services/qaSubmissionService";

// ─── Formatting helpers ──────────────────────────────────────────────────────

export const fmtDate = (v?: string | null, withTime = false) =>
  v ? dayjs(v).format(withTime ? "DD MMM YYYY, HH:mm" : "DD MMM YYYY") : "—";

export const fmtDateTimeShort = (v?: string | null) =>
  v ? dayjs(v).format("MMM DD, HH:mm") : "—";

export const initialsOf = (name?: string | null) => {
  if (!name) return "QS";
  const parts = String(name).split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

export const fmtBytes = (bytes?: number | null) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

/** Strips tags so a rich-text field can be tested for real content. */
export const hasRichText = (html?: string | null) =>
  !!String(html || "").replace(/<[^>]*>/g, "").trim();

// ─── Status vocabulary ───────────────────────────────────────────────────────

type Tone = "blue" | "green" | "ash" | "amber" | "red";

/**
 * Colour is meaning here, not decoration: blue = in flight, green = a good
 * terminal state, amber = needs QA's attention, ash = not started yet.
 * Red is deliberately unused for statuses — "Sent Back" is a normal part of the
 * workflow, not an error.
 */
const STATUS_TONE: Record<SubmissionStatus, Tone> = {
  Draft: "ash",
  Submitted: "blue",
  "Under Review": "blue",
  Retesting: "amber",
  "Ready for QA Sign-off": "blue",
  "QA Signed-off": "green",
  Approved: "green",
  "Sent Back": "amber",
};

/** One line explaining what each status actually means (§31). */
export const STATUS_HELP: Record<SubmissionStatus, string> = {
  Draft: "Being prepared — not yet reported to anyone.",
  Submitted: "QA reported the testing results; issues may still remain.",
  "Under Review": "The reviewer is going through the reported results.",
  Retesting: "Development fixes are available and QA is validating them.",
  "Ready for QA Sign-off": "Required testing and retesting are complete.",
  "QA Signed-off": "QA has closed this submission with its final recommendation.",
  Approved: "The approver has accepted the QA result — QA's sign-off closes it.",
  "Sent Back": "Returned to QA with a reason — see the timeline.",
};

export const StatusPill = ({
  status,
  size = "md",
}: {
  status?: SubmissionStatus | string | null;
  size?: "sm" | "md";
}) => {
  const tone = STATUS_TONE[status as SubmissionStatus] || "ash";
  return (
    <span className={`qs-pill qs-pill--${tone} ${size === "sm" ? "qs-pill--sm" : ""}`}>
      <span className="qs-pill__dot" />
      {status || "—"}
    </span>
  );
};

const RECOMMENDATION_TONE: Record<QaRecommendation, Tone> = {
  Pass: "green",
  "Pass with Known Issues": "amber",
  Fail: "red",
  Blocked: "amber",
};

export const RecommendationPill = ({
  value,
  size = "md",
}: {
  value?: QaRecommendation | string | null;
  size?: "sm" | "md";
}) => {
  if (!value) return <span className="qs-muted">Not set</span>;
  const tone = RECOMMENDATION_TONE[value as QaRecommendation] || "ash";
  return (
    <span className={`qs-pill qs-pill--${tone} ${size === "sm" ? "qs-pill--sm" : ""}`}>
      <span className="qs-pill__dot" />
      {value}
    </span>
  );
};

const RETEST_TONE: Record<RetestingStatus, Tone> = {
  "Not Started": "ash",
  "Retesting In Progress": "blue",
  "Partially Retested": "amber",
  "Retesting Completed": "green",
};

export const RetestPill = ({ value }: { value?: RetestingStatus | string | null }) => (
  <span className={`qs-pill qs-pill--${RETEST_TONE[value as RetestingStatus] || "ash"} qs-pill--sm`}>
    <span className="qs-pill__dot" />
    {value || "Not Started"}
  </span>
);

// ─── Building blocks ─────────────────────────────────────────────────────────

export const StatTile = ({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  sub,
  compact = false,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
  sub?: string;
  /**
   * Icon and value share the top line and the label wraps beneath, so the tile
   * stays readable down to ~130px — which is what lets the full lifecycle sit
   * on a single row.
   */
  compact?: boolean;
}) =>
  compact ? (
    <div className="pp-stat-card pp-stat-card--compact">
      <div className="pp-stat-top">
        <span className="pp-stat-icon" style={{ background: bgColor, color }}>
          <Icon size={13} style={{ fontSize: 13 }} />
        </span>
        <span className="pp-stat-value">{value}</span>
      </div>
      <span className="pp-stat-label">{label}</span>
    </div>
  ) : (
    <div className="pp-stat-card">
      <div className="pp-stat-top">
        <div className="pp-stat-left">
          <span className="pp-stat-icon" style={{ background: bgColor, color }}>
            <Icon size={14} style={{ fontSize: 14 }} />
          </span>
          <span className="pp-stat-label">{label}</span>
        </div>
      </div>
      <div className="pp-stat-bottom">
        <div className="pp-stat-value-wrap">
          <span className="pp-stat-value">{value}</span>
        </div>
        {sub && <span className="pp-stat-period">{sub}</span>}
      </div>
    </div>
  );

/** A compact number cell used across the execution and bug summaries. */
export const MetricCell = ({
  label,
  value,
  tone = "ash",
  onClick,
  suffix,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  onClick?: () => void;
  suffix?: string;
}) => {
  const clickable = !!onClick;
  return (
    <div
      className={`qs-metric qs-metric--${tone}${clickable ? " is-clickable" : ""}`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick!();
        }
      }}
    >
      <span className="qs-metric__label">{label}</span>
      <span className="qs-metric__value">
        {value}
        {suffix && <span className="qs-metric__suffix">{suffix}</span>}
      </span>
    </div>
  );
};

/** Section wrapper used by both the form and the read-only record. */
export const Section = ({
  index,
  title,
  description,
  actions,
  children,
  id,
}: {
  index?: number;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) => (
  <section className="qs-section" id={id}>
    <header className="qs-section__head">
      <div className="qs-section__title">
        {index !== undefined && <span className="qs-section__num">{index}</span>}
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="qs-section__actions">{actions}</div>}
    </header>
    <div className="qs-section__body">{children}</div>
  </section>
);

export const EmptyNote = ({ children }: { children: React.ReactNode }) => (
  <p className="qs-empty-note">{children}</p>
);

/** Advisory banner for the §17 recommendation warnings. */
export const WarningBanner = ({
  level,
  children,
}: {
  level: "critical" | "warning" | "info";
  children: React.ReactNode;
}) => (
  <div className={`qs-warn qs-warn--${level}`}>
    <span className="qs-warn__dot" />
    <span>{children}</span>
  </div>
);

// ─── Shared stylesheet ───────────────────────────────────────────────────────

/**
 * Injected once per page. Kept as a string (rather than a CSS module) to match
 * how the rest of QA Space styles its pages.
 */
export const QA_SUBMISSION_STYLES = `
/* ── Page shell (shared with Runs / Suites) ───────────────────────── */
.dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
/* Wider than the other QA Space pages: these nav labels are longer
   ("Ready for Sign-off", "Quality Signals") and were truncating at 194px. */
.dh-sidebar { width: 216px; background: transparent; border-right: 1px solid var(--border-slate-200); display: flex; flex-direction: column; z-index: 10; flex-shrink: 0; }
.dh-sidebar-top { padding: 12px 10px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border-slate-100); }
.pp-side-head { display: flex; align-items: center; gap: 9px; padding: 0 2px; }
.pp-side-logo { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; background: var(--bg-blue-50); color: #3B82F6; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(59,130,246,.16); }
.pp-side-title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.15; margin: 0; }
.pp-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; margin: 1px 0 0; letter-spacing: .02em; }
.pp-side-cta { margin-top: 12px; height: 34px !important; border-radius: 8px !important; font-size: 12.5px; font-weight: 600; }
.dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px 8px 16px; }
.pp-nav-caption { display: block; padding: 0 8px; margin: 0 0 6px; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-slate-400); }
.pp-nav-item { position: relative; display: flex; align-items: center; gap: 9px; width: 100%; height: 33px; padding: 0 9px; border-radius: 7px; border: none; background: transparent; color: var(--text-slate-600); font-size: 12.5px; font-weight: 500; cursor: pointer; text-align: left; transition: background .15s ease, color .15s ease; margin-bottom: 2px; }
.pp-nav-icon { flex-shrink: 0; color: var(--text-slate-400); transition: color .15s ease; }
.pp-nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-nav-count { flex-shrink: 0; min-width: 20px; padding: 1px 6px; border-radius: 999px; font-size: 10.5px; font-weight: 700; text-align: center; background: var(--bg-slate-50); color: var(--text-slate-500); border: 1px solid var(--border-slate-100); transition: all .15s ease; }
.pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
.pp-nav-item:hover .pp-nav-icon { color: var(--text-slate-600); }
.pp-nav-item.is-active { background: var(--bg-blue-50); color: #3B82F6; font-weight: 650; }
.pp-nav-item.is-active .pp-nav-icon { color: #3B82F6; }
.pp-nav-item.is-active .pp-nav-count { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }
.pp-nav-item.is-active::before { content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px; width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6; }

.dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
.dh-main-topbar { height: auto; min-height: 64px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; padding: 12px 24px; justify-content: space-between; }
.dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; background: transparent; }
.sc-topbar { min-height: 52px !important; padding: 8px 20px !important; }
.sc-topbar__title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sc-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); white-space: nowrap; }
.sc-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
.sc-topbar__sub { font-size: 12px; color: var(--text-slate-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 860px) { .sc-topbar__div, .sc-topbar__sub { display: none; } }
.sc-topbar .dh-main-controls { display: flex; align-items: center; gap: 8px; }
.sc-topbar .dh-main-controls .ant-btn { height: 32px !important; border-radius: 8px; }
.sc-topbar .pp-segmented { height: 32px; display: inline-flex; align-items: center; border-radius: 8px; overflow: hidden; }
.sc-topbar .pp-segmented button { height: 32px; width: 34px; display: inline-flex; align-items: center; justify-content: center; }

/* ── Stat tiles ───────────────────────────────────────────────────── */
.pp-stat-card { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; padding: 10px 12px; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
.pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
.pp-stat-left { display: flex; align-items: center; gap: 8px; }
.pp-stat-icon { width: 26px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
.pp-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); }
.pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
.pp-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
.pp-stat-period { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; }
.sc-stat-hit { cursor: pointer; outline: none; }
.sc-stat-hit .pp-stat-card { transition: border-color .15s ease, background .15s ease; }
.sc-stat-hit:hover .pp-stat-card { border-color: #bfdbfe; background: var(--bg-slate-50); }
.sc-stat-hit.is-active .pp-stat-card { border-color: #3b82f6; box-shadow: inset 0 -2px 0 #3b82f6; }
.sc-stat-hit:focus-visible .pp-stat-card { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

/* ── Lifecycle strip: the whole workflow on one row ───────────────── */
/* grid-auto-flow: column keeps every tile on a single line. The tiles share
   the width evenly while they fit and stop shrinking at 130px, past which the
   strip scrolls sideways rather than squashing into something unreadable. */
.qs-statrow {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
@media (min-width: 1024px) {
  .qs-statrow {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (min-width: 1280px) {
  .qs-statrow {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

.qs-statrow > * { min-width: 0; display: flex; }
.qs-statrow .pp-stat-card { width: 100%; height: 100%; }

.pp-stat-card--compact { min-height: 0; padding: 9px 10px; gap: 7px; }
.pp-stat-card--compact .pp-stat-top { align-items: center; gap: 8px; }
.pp-stat-card--compact .pp-stat-icon { width: 22px; height: 22px; border-radius: 5px; flex-shrink: 0; }
.pp-stat-card--compact .pp-stat-value { font-size: 17px; }
/* Clamped at two lines as a backstop for a longer label; every label in the
   current set fits on one, and the row equalises the heights either way. */
.pp-stat-card--compact .pp-stat-label {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 11px; font-weight: 600; line-height: 1.32; color: var(--text-slate-500);
}

/* ── Filters ──────────────────────────────────────────────────────── */
.sc-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.sc-filters__search { width: 240px; }
.sc-filters .ant-input-affix-wrapper { height: 32px !important; border-radius: 8px; }
.sc-filters__field { min-width: 150px; }
.sc-filters .sd-trigger { height: 32px !important; min-height: 32px !important; border-radius: 8px !important; padding-block: 0 !important; }
.sc-filters .ant-picker { height: 32px; border-radius: 8px; }
.sc-clear { height: 32px; display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; color: #3b82f6; padding: 0 11px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: transparent; cursor: pointer; transition: all .15s ease; }
.sc-clear:hover { background: var(--bg-blue-50); border-color: #bfdbfe; }

/* ── Table ────────────────────────────────────────────────────────── */
.sc-tablewrap { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
.sc-table .ant-table { background: transparent; }
.sc-table, .sc-table.ant-table-wrapper, .sc-table .ant-table, .sc-table .ant-table-container, .sc-table .ant-table-content, .sc-table .ant-table-header, .sc-table .ant-table-body { border-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th, .sc-table .ant-table-thead > tr > td { border-radius: 0 !important; border-start-start-radius: 0 !important; border-start-end-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; padding: 8px 14px !important; letter-spacing: .06em !important; font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; color: var(--text-slate-500) !important; white-space: nowrap !important; border-bottom: 1px solid var(--border-slate-200) !important; }
.sc-table .ant-table-tbody > tr > td { padding: 8px 14px !important; border-bottom: 1px solid var(--border-slate-100) !important; background: var(--bg-pure-white) !important; }
.sc-table .ant-table-cell-fix-left, .sc-table .ant-table-cell-fix-right { background-color: var(--bg-pure-white, #ffffff) !important; }
.sc-table .ant-table-tbody > tr { cursor: pointer; }
.sc-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
.sc-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left, .sc-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right { background-color: var(--bg-slate-50) !important; }
.sc-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
.sc-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sc-name__badge { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 27px; height: 27px; border-radius: 7px; background: rgba(59,130,246,.1); color: #2563eb; font-size: 10px; font-weight: 700; letter-spacing: .02em; }
.sc-name__text { display: flex; flex-direction: column; min-width: 0; }
.sc-name__title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.sc-name__meta { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
.qs-muted { color: var(--text-slate-400); font-size: 12.5px; }
.qs-num { font-variant-numeric: tabular-nums; font-size: 12.5px; font-weight: 600; color: var(--text-slate-800); }
.qs-num--zero { color: var(--text-slate-300); font-weight: 500; }
.sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.sc-rowactions button.qs-iconbtn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--text-slate-400); transition: all .15s ease; }
.sc-rowactions button.qs-iconbtn:hover { color: #2563eb; background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.25); }
.sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }
.sc-empty { padding: 44px 24px; text-align: center; }
.sc-empty__icon { font-size: 26px; color: var(--border-slate-200); display: inline-block; }
.sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
.sc-empty__desc { margin: 0 auto 14px; max-width: 360px; font-size: 12.5px; color: var(--text-slate-400); }

/* ── Pills ────────────────────────────────────────────────────────── */
.qs-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; white-space: nowrap; font-size: 11.5px; font-weight: 600; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-600); }
.qs-pill--sm { padding: 2px 8px; font-size: 11px; }
.qs-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; flex-shrink: 0; }
.qs-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
.qs-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
.qs-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }
.qs-pill--amber { color: #b45309; background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.26); }
.qs-pill--red { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.24); }

/* ── Metric cells ─────────────────────────────────────────────────── */
.qs-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 8px; }
.qs-metric { border: 1px solid var(--border-slate-200); padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; background: transparent; text-align: left; }
.qs-metric__label { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-slate-400); }
.qs-metric__value { font-size: 20px; font-weight: 800; line-height: 1; letter-spacing: -.02em; color: var(--text-slate-900); font-variant-numeric: tabular-nums; }
.qs-metric__suffix { font-size: 12px; font-weight: 600; margin-left: 2px; color: var(--text-slate-400); }
.qs-metric.is-clickable { cursor: pointer; outline: none; transition: border-color .15s ease, background .15s ease; }
.qs-metric.is-clickable:hover { border-color: #bfdbfe; background: var(--bg-slate-50); }
.qs-metric.is-clickable:focus-visible { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
.qs-metric--green .qs-metric__value { color: #047857; }
.qs-metric--red .qs-metric__value { color: #dc2626; }
.qs-metric--amber .qs-metric__value { color: #b45309; }
.qs-metric--blue .qs-metric__value { color: #2563eb; }

/* Result distribution bar (§11) */
.qs-resultbar { display: flex; height: 8px; border-radius: 999px; overflow: hidden; background: var(--border-slate-100); margin-bottom: 10px; }
.qs-resultbar span { display: block; height: 100%; }
.qs-resultbar .is-pass { background: #10b981; }
.qs-resultbar .is-fail { background: #ef4444; }
.qs-resultbar .is-blocked { background: #f59e0b; }
.qs-resultbar .is-none { background: #cbd5e1; }

/* ── Sections ─────────────────────────────────────────────────────── */
.qs-section { border: 1px solid var(--border-slate-200); background: transparent; margin-bottom: 14px; }
.qs-section__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100); background: var(--bg-slate-50); }
.qs-section__title { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.qs-section__num { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 22px; height: 22px; border-radius: 6px; background: rgba(59,130,246,.1); color: #2563eb; font-size: 11px; font-weight: 700; margin-top: 1px; }
.qs-section__title h3 { margin: 0; font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
.qs-section__title p { margin: 2px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-500); }
.qs-section__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.qs-section__actions .ant-btn { height: 28px; border-radius: 7px; font-size: 11.5px; font-weight: 600; }
.qs-section__body { padding: 14px 16px; }
.qs-empty-note { margin: 0; font-size: 12.5px; color: var(--text-slate-400); }

/* ── Form fields ──────────────────────────────────────────────────── */
.qs-field { margin-bottom: 16px; }
.qs-field:last-child { margin-bottom: 0; }
.qs-label { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
.qs-req { color: #ef4444; }
.qs-hint { margin: 5px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-400); }
.qs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.qs-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 900px) { .qs-grid2, .qs-grid3 { grid-template-columns: 1fr; } }
.qs-section__body .ant-input, .qs-section__body .ant-picker { border-radius: 8px; font-size: 12.5px; }
.qs-section__body .ant-input:not(textarea) { height: 34px; }
.qs-section__body .sd-trigger { height: 34px !important; min-height: 34px !important; border-radius: 8px !important; padding: 0 12px !important; }

/* Scope facts panel shown once a scope is chosen (§7) */
.qs-scopecard { padding: 12px 14px; border: 1px solid rgba(59,130,246,.22); background: rgba(59,130,246,.06); display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px 18px; }
.qs-scopecard dt { font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #2563eb; margin-bottom: 3px; }
.qs-scopecard dd { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-800); }
/* The card doubles as the way into the scope drawer, so it has to look like it
   can be pressed rather than only revealing that on hover. */
.qs-scopecard.is-clickable { cursor: pointer; outline: none; transition: border-color .15s ease, background .15s ease, box-shadow .15s ease; }
.qs-scopecard.is-clickable:hover { border-color: rgba(59,130,246,.45); background: rgba(59,130,246,.1); }
.qs-scopecard.is-clickable:focus-visible { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

/* A value in a fact grid that opens something. */
.qs-inlinelink { padding: 0; border: none; background: none; font: inherit; color: #2563eb; font-weight: 600; cursor: pointer; text-align: left; border-bottom: 1px solid rgba(37,99,235,.28); transition: border-color .15s ease, color .15s ease; }
.qs-inlinelink:hover { color: #1d4ed8; border-bottom-color: #1d4ed8; }
.qs-inlinelink:focus-visible { outline: 2px solid rgba(59,130,246,.4); outline-offset: 2px; }

/* ── Warnings (§17) ───────────────────────────────────────────────── */
.qs-warn { display: flex; align-items: flex-start; gap: 9px; padding: 9px 12px; font-size: 12.5px; line-height: 1.5; border: 1px solid; margin-bottom: 8px; }
.qs-warn:last-child { margin-bottom: 0; }
.qs-warn__dot { width: 7px; height: 7px; border-radius: 999px; background: currentColor; flex-shrink: 0; margin-top: 6px; }
.qs-warn--critical { color: #b91c1c; background: rgba(239,68,68,.07); border-color: rgba(239,68,68,.28); }
.qs-warn--warning { color: #b45309; background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.28); }
.qs-warn--info { color: #2563eb; background: rgba(59,130,246,.06); border-color: rgba(59,130,246,.22); }
.qs-warn span:last-child { color: var(--text-slate-700); }
.qs-warn--critical span:last-child { color: #991b1b; font-weight: 500; }

/* ── Run picker (§8) ──────────────────────────────────────────────── */
.qs-runrow { display: flex; align-items: flex-start; gap: 11px; padding: 11px 12px; border: 1px solid var(--border-slate-200); margin-bottom: 8px; transition: border-color .15s ease, background .15s ease; }
.qs-runrow:last-child { margin-bottom: 0; }
.qs-runrow.is-selected { border-color: #3b82f6; background: rgba(59,130,246,.04); }
.qs-runrow.is-disabled { opacity: .55; }
.qs-runrow.is-clickable { cursor: pointer; outline: none; }
.qs-runrow.is-clickable:hover { border-color: #bfdbfe; background: var(--bg-slate-50); }
.qs-runrow.is-clickable:focus-visible { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
.qs-runrow__body { flex: 1; min-width: 0; }
.qs-runrow__top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.qs-runrow__name { font-size: 13px; font-weight: 650; color: var(--text-slate-900); }
.qs-runrow__meta { margin-top: 3px; font-size: 11.5px; color: var(--text-slate-400); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.qs-runrow__stats { margin-top: 8px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 11.5px; font-variant-numeric: tabular-nums; }
.qs-runrow__stat { display: inline-flex; align-items: center; gap: 5px; color: var(--text-slate-500); }
.qs-runrow__stat b { color: var(--text-slate-800); font-weight: 700; }
.qs-runrow__stat.is-pass b { color: #047857; }
.qs-runrow__stat.is-fail b { color: #dc2626; }
.qs-runrow__stat.is-blocked b { color: #b45309; }
.qs-runrow__role { flex-shrink: 0; }
.qs-runlist-caption { display: flex; align-items: center; gap: 8px; margin: 14px 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); }
.qs-runlist-caption:first-child { margin-top: 0; }
.qs-runlist-caption::after { content: ''; flex: 1; height: 1px; background: var(--border-slate-100); }

/* ── Detail header ────────────────────────────────────────────────── */
.qs-header { border: 1px solid var(--border-slate-200); padding: 16px 18px; margin-bottom: 14px; background: transparent; }
.qs-header__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.qs-header__id { display: flex; align-items: center; gap: 12px; min-width: 0; }
.qs-header__avatar { width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: rgba(59,130,246,.1); color: #2563eb; font-size: 13px; font-weight: 800; }
.qs-header__name { margin: 0; font-size: 17px; font-weight: 750; letter-spacing: -.02em; color: var(--text-slate-900); }
.qs-header__sub { margin: 3px 0 0; font-size: 12px; color: var(--text-slate-500); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.qs-header__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.qs-header__actions .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; font-weight: 600; }
.qs-header__facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px 20px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-slate-100); }
.qs-fact dt { font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--text-slate-400); margin-bottom: 3px; }
.qs-fact dd { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-800); }

/* ── Timeline (§27) ───────────────────────────────────────────────── */
.qs-timeline { position: relative; padding-left: 22px; }
.qs-timeline::before { content: ''; position: absolute; left: 5px; top: 6px; bottom: 6px; width: 1px; background: var(--border-slate-200); }
.qs-tl-item { position: relative; padding-bottom: 16px; }
.qs-tl-item:last-child { padding-bottom: 0; }
.qs-tl-item::before { content: ''; position: absolute; left: -21px; top: 5px; width: 9px; height: 9px; border-radius: 999px; background: var(--bg-pure-white); border: 2px solid #cbd5e1; }
.qs-tl-item.is-key::before { border-color: #3b82f6; }
.qs-tl-item.is-good::before { border-color: #10b981; }
.qs-tl-time { font-size: 11px; color: var(--text-slate-400); font-variant-numeric: tabular-nums; }
.qs-tl-title { font-size: 12.5px; font-weight: 650; color: var(--text-slate-900); margin-top: 1px; }
.qs-tl-detail { font-size: 12px; color: var(--text-slate-600); margin-top: 2px; line-height: 1.5; }
.qs-tl-actor { font-size: 11.5px; color: var(--text-slate-400); margin-top: 2px; }

/* ── Inline help ──────────────────────────────────────────────────── */
.qs-infobtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; flex-shrink: 0;
  border-radius: 8px; border: 1px solid transparent; background: transparent;
  color: var(--text-slate-400); cursor: pointer; transition: all .15s ease;
}
.qs-infobtn:hover { color: #2563eb; background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.22); }
.qs-infobtn:focus-visible { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

.qs-infopop .ant-popover-inner { max-width: 340px; border-radius: 10px; }
.qs-infopop .ant-popover-inner-content { padding: 13px 15px; }
.qs-infopop__body h4 {
  margin: 0 0 6px; font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em;
}
.qs-infopop__body h5 {
  margin: 12px 0 4px; font-size: 10px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--text-slate-400);
}
.qs-infopop__body p { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-slate-600); }
.qs-infopop__body ol { margin: 0; padding-left: 17px; }
.qs-infopop__body li {
  font-size: 12.5px; line-height: 1.55; color: var(--text-slate-600); margin-bottom: 5px;
}
.qs-infopop__body li:last-child { margin-bottom: 0; }
.qs-infopop__body strong { color: var(--text-slate-900); font-weight: 650; }

/* ── Send Back modal ──────────────────────────────────────────────── */
/* globals.css already gives every modal its header and footer bars, including
   backgrounds set with !important. Only the padding and the inner layout are
   overridden here, so this dialog stays consistent with the rest of the app
   instead of inventing a second modal style that half-applies. */
.qs-sbm .ant-modal-content { border-radius: 12px; padding: 0; overflow: hidden; }
/* Square off the inner corners — .ant-modal-content clips them anyway, and the
   radii globals sets on the bars show through as a double curve otherwise. */
.qs-sbm .ant-modal-header { margin: 0; padding: 14px 18px; border-radius: 0; }
.qs-sbm .ant-modal-body { padding: 16px 18px; }
.qs-sbm .ant-modal-close { top: 13px; inset-inline-end: 13px; }

.qs-sbm__head { display: flex; align-items: center; gap: 11px; padding-right: 26px; }
.qs-sbm__icon {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(59,130,246,.1); color: #2563eb; border: 1px solid rgba(59,130,246,.18);
}
.qs-sbm__headtext { min-width: 0; }
.qs-sbm__headtext h3 {
  margin: 0; font-size: 14.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em;
}
.qs-sbm__headtext span {
  display: block; margin-top: 1px; font-size: 11.5px; color: var(--text-slate-500);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.qs-sbm__caption {
  display: block; margin-bottom: 7px;
  font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-slate-400);
}

.qs-sbm__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.qs-sbm__chip {
  display: inline-flex; align-items: center; gap: 5px; text-align: left;
  padding: 5px 10px 5px 8px; border-radius: 999px; cursor: pointer;
  font-size: 11.5px; line-height: 1.35; font-weight: 500;
  color: var(--text-slate-600); background: var(--bg-slate-50);
  border: 1px solid var(--border-slate-200);
  transition: all .15s ease;
}
.qs-sbm__chip svg { flex-shrink: 0; color: var(--text-slate-400); transition: color .15s ease; }
.qs-sbm__chip:hover {
  color: #2563eb; background: rgba(59,130,246,.07); border-color: rgba(59,130,246,.28);
}
.qs-sbm__chip:hover svg { color: #2563eb; }
.qs-sbm__chip:focus-visible { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

.qs-sbm__next { padding: 11px 13px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); }
.qs-sbm__next ol { margin: 0; padding-left: 16px; }
.qs-sbm__next li { font-size: 12px; line-height: 1.55; color: var(--text-slate-600); margin-bottom: 3px; }
.qs-sbm__next li:last-child { margin-bottom: 0; }
.qs-sbm__next strong { color: var(--text-slate-900); font-weight: 650; }

/* antd renders the footer as a sibling of the body, so the bar is styled on
   .ant-modal-footer itself rather than faked with negative margins inside it. */
.qs-sbm .ant-modal-footer { margin: 0; padding: 11px 18px; border-radius: 0; }
.qs-sbm__foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.qs-sbm__foot .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; font-weight: 600; }

/* antd gives a textarea only 4px of top padding, which pins the placeholder and
   the first line to the top edge. Same defect on every textarea in the module,
   so it is fixed once here rather than per dialog. */
.qs-sbm textarea.ant-input,
.qs-field textarea.ant-input {
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.6;
}

/* ── Misc ─────────────────────────────────────────────────────────── */
.qs-linkbtn { border: none; background: none; padding: 0; font-size: 12.5px; font-weight: 600; color: #2563eb; cursor: pointer; }
.qs-linkbtn:hover { text-decoration: underline; }
.qs-confirmbox { padding: 12px 14px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); font-size: 12.5px; line-height: 1.6; color: var(--text-slate-700); }
.qs-snapshot-note { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--text-slate-500); margin-bottom: 10px; }
.qs-prose { font-size: 13px; line-height: 1.65; color: var(--text-slate-700); }
.qs-prose p { margin: 0 0 10px; }
.qs-prose p:last-child { margin-bottom: 0; }

/* ── Pager ────────────────────────────────────────────────────────── */
.pp-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 10px; padding: 0 20px; border-top: 1px solid var(--border-slate-200); height: 52px; min-height: 52px; box-sizing: border-box; flex-shrink: 0; background: var(--bg-pure-white); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
.pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
.pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
.pp-pager { display: flex; align-items: center; gap: 3px; }
.pp-pager-btn, .pp-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
.pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
.pp-pagesize { margin-left: 5px; }
.pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
.pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); margin-left: 12px; }
.pp-segmented button { width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
.pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
.pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
@media (max-width: 1024px) { .pp-grid { grid-template-columns: 1fr; } }
`;
