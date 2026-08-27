'use client';

import React from 'react';
import { App, Input, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type {
  ApplicationStage,
  IntakeSource,
  OpeningPriority,
  OpeningStatus,
} from '@/services/openingV2Service';

// Shared visual kit for every Opening Management panel. Class prefix `omp-`;
// the header class contains "-header" so the layout shell stretches it
// edge-to-edge, matching the other v2 modules.

// ── Palette ─────────────────────────────────────────────────────────────────
// Deliberately narrow: blue, green, ash and light grey, with red reserved for
// destructive actions only. Ten statuses cannot each get their own hue under
// that rule, so meaning is carried by GROUP — grey for not-started/parked, blue
// for in-flight, green for succeeded, red only for cancelled — and the label and
// icon do the fine-grained distinguishing.
export const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  ash: '#64748B',
  lightGray: '#94A3B8',
  /** Destructive only: delete, cancel, reject. */
  red: '#EF4444',
} as const;

export const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  ash: 'rgba(100,116,139,0.10)',
  lightGray: 'rgba(148,163,184,0.12)',
  red: 'rgba(239,68,68,0.10)',
} as const;

type Tone = keyof typeof PALETTE;

function toneStyle(tone: Tone): React.CSSProperties {
  return {
    color: PALETTE[tone],
    background: TINT[tone],
    border: `1px solid ${PALETTE[tone]}22`,
  };
}

// ── Status ──────────────────────────────────────────────────────────────────

export const STATUS_META: Record<OpeningStatus, { label: string; tone: Tone; hint: string }> = {
  draft: { label: 'Draft', tone: 'ash', hint: 'Still being prepared' },
  pending_approval: { label: 'Pending Approval', tone: 'blue', hint: 'Waiting for approval' },
  approved: { label: 'Approved', tone: 'green', hint: 'Ready to publish' },
  internal_posting: { label: 'Internal Posting', tone: 'blue', hint: 'Visible only to employees' },
  external_posting: { label: 'External Posting', tone: 'blue', hint: 'Published externally' },
  in_progress: { label: 'In Progress', tone: 'blue', hint: 'Candidates are being interviewed' },
  on_hold: { label: 'On Hold', tone: 'ash', hint: 'Hiring paused' },
  filled: { label: 'Filled', tone: 'green', hint: 'Position successfully closed' },
  cancelled: { label: 'Cancelled', tone: 'red', hint: 'Hiring cancelled' },
  closed: { label: 'Closed', tone: 'ash', hint: 'Recruitment completed' },
};

export const STATUS_ORDER: OpeningStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'internal_posting',
  'external_posting',
  'in_progress',
  'on_hold',
  'filled',
  'cancelled',
  'closed',
];

export function StatusChip({ status }: { status: OpeningStatus }) {
  const { message } = App.useApp();

  const meta = STATUS_META[status] ?? { label: status, tone: 'ash' as Tone };
  return (
    <span className="omp-chip" style={toneStyle(meta.tone)}>
      {meta.label}
    </span>
  );
}

// ── Priority ────────────────────────────────────────────────────────────────

export const PRIORITY_META: Record<OpeningPriority, { label: string; tone: Tone }> = {
  low: { label: 'Low', tone: 'lightGray' },
  medium: { label: 'Medium', tone: 'ash' },
  high: { label: 'High', tone: 'blue' },
  // Critical is the only priority that gets red — it is the "this is on fire"
  // signal, not a routine state.
  critical: { label: 'Critical', tone: 'red' },
};

export function PriorityChip({ priority }: { priority: OpeningPriority }) {
  const meta = PRIORITY_META[priority] ?? { label: priority, tone: 'ash' as Tone };
  return (
    <span className="omp-chip" style={toneStyle(meta.tone)}>
      {meta.label}
    </span>
  );
}

// ── Application stages ──────────────────────────────────────────────────────

export const STAGE_META: Record<ApplicationStage, { label: string; tone: Tone }> = {
  applied: { label: 'Applied', tone: 'lightGray' },
  screening: { label: 'Screening', tone: 'ash' },
  shortlisted: { label: 'Shortlisted', tone: 'blue' },
  interview: { label: 'Interview', tone: 'blue' },
  offer: { label: 'Offer', tone: 'blue' },
  hired: { label: 'Hired', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  withdrawn: { label: 'Withdrawn', tone: 'ash' },
  on_hold: { label: 'On Hold', tone: 'ash' },
};

/** The pipeline order shown on the board — terminal stages sit at the end. */
export const STAGE_ORDER: ApplicationStage[] = [
  'applied',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'on_hold',
  'rejected',
  'withdrawn',
];

export function StageChip({ stage }: { stage: ApplicationStage }) {
  const meta = STAGE_META[stage] ?? { label: stage, tone: 'ash' as Tone };
  return (
    <span className="omp-chip" style={toneStyle(meta.tone)}>
      {meta.label}
    </span>
  );
}

// ── Labels for the rest of the enumerations ─────────────────────────────────

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
};

export const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  office: 'Office',
};

export const HIRING_TYPE_LABELS: Record<string, string> = {
  replacement: 'Replacement',
  new_position: 'New Position',
  expansion: 'Expansion',
  backfill: 'Backfill',
};

export const VISIBILITY_LABELS: Record<string, string> = {
  internal_only: 'Internal Only',
  external_only: 'External Only',
  both: 'Internal & External',
};

export const SOURCE_LABELS: Record<IntakeSource, string> = {
  careers_page: 'Careers Page',
  employee_referral: 'Employee Referral',
  internal_transfer: 'Internal Transfer',
  internal_job_posting: 'Internal Job Posting',
  recruitment_agency: 'Recruitment Agency',
  linkedin: 'LinkedIn',
  naukri: 'Naukri',
  indeed: 'Indeed',
  manual_upload: 'Manual Upload',
  campus_hiring: 'Campus Hiring',
  other: 'Other',
};

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  hiring_manager: 'Hiring Manager',
  technical_panel: 'Technical Panel',
  hr: 'HR',
  client_interviewer: 'Client Interviewer',
};

export const APPROVER_TYPE_LABELS: Record<string, string> = {
  hiring_manager: 'Hiring Manager',
  department_head: 'Department Head',
  role: 'Anyone with a role',
  specific_user: 'A specific person',
};

/** Turn any snake_case enum value into a readable label. */
export function humanize(value?: string | null): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Formatting ──────────────────────────────────────────────────────────────

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "3 days ago" / "in 5 days" — for windows and ageing. */
export function relativeDays(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Math.round((d - Date.now()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff > 0) return `in ${diff} day${diff === 1 ? '' : 's'}`;
  return `${-diff} day${diff === -1 ? '' : 's'} ago`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
};

export function currencySymbol(code?: string | null): string {
  return (code && CURRENCY_SYMBOLS[code]) || code || '₹';
}

/** Compact money for table cells: ₹12L, ₹1.8Cr, $120K. */
export function compactMoney(n?: number | null, currency = 'INR'): string {
  if (n === null || n === undefined) return '—';
  const sym = currencySymbol(currency);
  const abs = Math.abs(n);
  if (currency === 'INR') {
    if (abs >= 1e7) return `${sym}${(n / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
    if (abs >= 1e5) return `${sym}${(n / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
    if (abs >= 1e3) return `${sym}${(n / 1e3).toFixed(0)}K`;
  } else {
    if (abs >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${sym}${(n / 1e3).toFixed(0)}K`;
  }
  return `${sym}${n.toLocaleString('en-IN')}`;
}

export function salaryRange(
  min?: number | null,
  max?: number | null,
  currency = 'INR',
  period = 'yearly'
): string {
  if (min === null && max === null) return '—';
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${compactMoney(min, currency)} – ${compactMoney(max, currency)} / ${period === 'yearly' ? 'yr' : period === 'monthly' ? 'mo' : 'hr'}`;
  }
  return compactMoney(min ?? max, currency);
}

export function experienceRange(min?: number | null, max?: number | null): string {
  if (min === null && max === null) return '—';
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${min}–${max} yrs`;
  }
  if (min !== null && min !== undefined) return `${min}+ yrs`;
  return `up to ${max} yrs`;
}

// ── Header ──────────────────────────────────────────────────────────────────

export function PanelHeader({
  icon,
  color = PALETTE.blue,
  tint = TINT.blue,
  title,
  subtitle,
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  hideHamburger = false,
  sidebarEvent = 'open-openings-sidebar',
  children,
}: {
  icon: React.ReactNode;
  color?: string;
  tint?: string;
  title: string;
  subtitle?: string;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  hideHamburger?: boolean;
  /** Window event the hamburger fires — each module shell listens for its own. */
  sidebarEvent?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="omp-header">
      <div className="omp-head-about">
        {!hideHamburger && (
          <button
            className="omp-mobile-toggle"
            onClick={() => window.dispatchEvent(new CustomEvent(sidebarEvent))}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <span className="omp-head-icon" style={{ background: tint, color }}>
          {icon}
        </span>
        <div>
          <div className="omp-head-title">{title}</div>
          {subtitle && <div className="omp-head-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="omp-head-actions">
        {onSearch && (
          <Input
            className="omp-search"
            allowClear
            prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
        {children}
      </div>
    </div>
  );
}

// ── Stat tile ───────────────────────────────────────────────────────────────

export function StatCard({
  icon,
  tone = 'blue',
  value,
  label,
  hint,
}: {
  icon?: React.ReactNode;
  tone?: Tone;
  value: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="omp-stat-card">
      {icon && (
        <span className="omp-stat-icon" style={{ background: TINT[tone], color: PALETTE[tone] }}>
          {icon}
        </span>
      )}
      <div className="omp-stat-body">
        <div className="omp-stat-value">{value}</div>
        <div className="omp-stat-label">{label}</div>
        {hint && <div className="omp-stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

/** A labelled read-only field, for detail views. */
export function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div className={`omp-field${span ? ' is-span' : ''}`}>
      <div className="omp-field-label">{label}</div>
      <div className="omp-field-value">{children ?? '—'}</div>
    </div>
  );
}

export function TagList({ items, empty = '—' }: { items?: string[] | null; empty?: string }) {
  if (!items || items.length === 0) return <span className="omp-muted">{empty}</span>;
  return (
    <span className="omp-taglist">
      {items.map((t) => (
        <Tag key={t} className="omp-tag">
          {t}
        </Tag>
      ))}
    </span>
  );
}

export const tablePaginationConfig = {
  pageSize: 20,
  showTotal: (total: number, range: [number, number]) => (
    <>
      Showing <strong>{range[0]}–{range[1]}</strong> of <strong>{total}</strong>
    </>
  ),
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '25', '50', '100'],
};

// ── Shared styles (render once per panel) ───────────────────────────────────

export function OpeningStyles() {
  return (
    <style jsx global>{`
      .omp { display: flex; flex-direction: column; min-height: 0; flex: 1; }
      .omp-header {
        display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        padding: 16px 0 20px !important; border-bottom: 1px solid var(--border-slate-100); margin-bottom: 20px;
        position: sticky; top: 0; z-index: 30; background: var(--bg-pure-white);
      }
      .omp-head-about { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .omp-mobile-toggle {
        display: none; background: transparent; border: none; color: var(--text-slate-700);
        cursor: pointer; padding: 4px; border-radius: 6px;
      }
      .omp-mobile-toggle:hover { background: var(--bg-slate-50); }
      @media (max-width: 1024px) {
        .omp-mobile-toggle { display: flex; align-items: center; justify-content: center; }
      }
      .omp-head-icon {
        width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center;
        justify-content: center; font-size: 16px; flex-shrink: 0;
      }
      .omp-head-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.15; }
      .omp-head-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; margin-top: 1px; }
      .omp-head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .omp-head-actions .ant-btn { height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
      .omp-head-actions .omp-chip { height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px; }
      .omp-search.ant-input-affix-wrapper { width: 240px; height: 32px; border-radius: 8px; }

      /* Chips — one shape for status, priority and stage. */
      .omp-chip {
        display: inline-flex; align-items: center; height: 20px; padding: 0 8px;
        border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap;
        letter-spacing: 0.01em;
      }
      .omp-code {
        font-size: 11px; font-weight: 700; color: var(--text-slate-500);
        font-variant-numeric: tabular-nums; letter-spacing: 0.02em;
      }
      .omp-muted { color: var(--text-slate-400); }
      .omp-title-cell { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .omp-title-main {
        font-size: 12.5px; font-weight: 700; color: var(--text-slate-900);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .omp-title-sub { font-size: 11px; color: var(--text-slate-400); }

      .omp-taglist { display: inline-flex; flex-wrap: wrap; gap: 6px; }
      .omp-tag.ant-tag {
        margin: 0; border-radius: 0; font-size: 11.5px; padding: 2px 8px; line-height: 20px;
        background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-700);
      }
      
      .omp-longtext {
        font-size: 13px; color: var(--text-slate-700); line-height: 1.6;
        padding: 14px 18px; background: var(--bg-slate-50, #f8fafc);
        border-left: 3px solid var(--border-slate-300, #cbd5e1);
        margin-top: 6px; white-space: pre-wrap;
      }

      /* Stats */
      .omp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
      @media (max-width: 1024px) { .omp-stats { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 640px) { .omp-stats { grid-template-columns: 1fr; } }
      .omp-stat-card {
        display: flex; align-items: center; gap: 12px; padding: 14px 16px;
        border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
      }
      .omp-stat-icon {
        width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center;
        justify-content: center; font-size: 17px; flex-shrink: 0;
      }
      .omp-stat-body { min-width: 0; }
      .omp-stat-value { font-size: 20px; font-weight: 800; color: var(--text-slate-900); line-height: 1.1; }
      .omp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); margin-top: 2px; }
      .omp-stat-hint { font-size: 10.5px; color: var(--text-slate-400); margin-top: 1px; }

      /* Filters */
      .omp-filters {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: nowrap;
        margin-bottom: 12px;
        overflow-x: auto;
        padding-bottom: 8px;
        /* Hide scrollbar for a cleaner look while maintaining scrollability */
        scrollbar-width: none;
      }
      .omp-filters::-webkit-scrollbar { display: none; }
      .omp-filter-count { font-size: 12px; color: var(--text-slate-500); margin-left: auto; flex-shrink: 0; }

      /* Read-only fields */
      .omp-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 32px; }
      @media (max-width: 1024px) { .omp-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .omp-fields { grid-template-columns: 1fr; } }
      .omp-field.is-span { grid-column: 1 / -1; }
      .omp-field-label {
        font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
        color: var(--text-slate-500); margin-bottom: 6px;
      }
      .omp-field-value { font-size: 13px; color: var(--text-slate-900); font-weight: 500; line-height: 1.5; }

      /* Footer UI like candidate page */
      .omp-table-wrap .ant-pagination {
        position: sticky;
        left: 0;
        bottom: 0;
        margin: auto -16px 0 -16px !important;
        padding: 12px 16px !important;
        background: var(--bg-pure-white);
        border-top: 1px solid var(--border-slate-200);
        z-index: 20;
        box-shadow: 0 -4px 14px rgba(15,23,42,0.02);
      }
      .omp-table-wrap .ant-pagination .ant-pagination-total-text {
        margin-right: auto;
      }

      /* Section card */
      .omp-section {
        border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
        padding: 24px; margin-bottom: 24px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
      }
      .omp-section-head {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        margin: -24px -24px 24px -24px;
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-slate-200);
        background: var(--bg-slate-50, #f8fafc);
      }
      .omp-section-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); margin-bottom: 2px; }
      .omp-section-sub { font-size: 12.5px; color: var(--text-slate-500); font-weight: 400; margin-top: 2px; }

      /* Tables — matches the ticket/reimbursement table look */
      .omp-table-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .omp-table-wrap .zlo,
      .omp-table-wrap .zlo__content,
      .omp-table-wrap .ant-table-wrapper,
      .omp-table-wrap .ant-spin-nested-loading,
      .omp-table-wrap .ant-spin-container { display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .omp-table-wrap .ant-table {
        flex: 0 1 auto; overflow: auto; background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-200); border-radius: 0 !important; margin-bottom: 0;
      }
      .omp-table-wrap .ant-table table { min-width: 900px; }
      .omp-table-wrap .ant-table-thead > tr > th,
      .ant-drawer-content .omp-inner-table .ant-table-thead > tr > th {
        padding: 5px 10px !important; font-size: 10px !important; font-weight: 800 !important;
        background: var(--bg-slate-50, #f8fafc) !important; color: var(--text-slate-500, #64748b) !important;
        text-transform: uppercase; letter-spacing: 0.04em; text-align: left !important;
        border-inline-end: none !important;
      }
      .omp-table-wrap .ant-table-thead > tr > th::before { display: none !important; }
      [data-theme='dark'] .omp-table-wrap .ant-table-thead > tr > th {
        background: #0f1419 !important; color: #94a3b8 !important;
      }
      .omp-table-wrap .ant-table-tbody > tr > td { padding: 4px 10px !important; font-size: 11.5px !important; }
      .omp-table-wrap .ant-table-tbody > tr { cursor: pointer; }
      .omp-table-wrap .ant-pagination .ant-pagination-item,
      .omp-table-wrap .ant-pagination .ant-pagination-prev .ant-pagination-item-link,
      .omp-table-wrap .ant-pagination .ant-pagination-next .ant-pagination-item-link {
        border-radius: 4px !important;
      }

      /* Empty state */
      .omp-empty { padding: 48px 16px; text-align: center; }
      .omp-empty-title { font-size: 13px; font-weight: 700; color: var(--text-slate-700); margin-top: 10px; }
      .omp-empty-sub { font-size: 12px; color: var(--text-slate-400); margin-top: 4px; }
    `}</style>
  );
}
