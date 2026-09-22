'use client';

import React from 'react';
import { Button, Input, Tag, Tooltip, Select } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import SearchableDropdown from '@/components/common/SearchableDropdown';

// Shared visual kit for every Reimbursement 2.0 panel. Keeps panels lean and the
// look consistent. Class prefix `rvp-`; the header class contains "-header" so
// the layout shell (.rv-content > * > [class*="-header"]) stretches it edge-to-edge.

/** Prevent invalid keystrokes in numeric input fields. */
export const preventInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Only intercept single-character keys that aren't digits, comma, or period, and aren't modified by Ctrl/Cmd
  if (!/^[0-9.,]$/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
};

export const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316',
  red: '#EF4444',
  grey: '#94A3B8',
} as const;

export const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  cyan: 'rgba(6,182,212,0.10)',
  amber: 'rgba(245,158,11,0.10)',
  violet: 'rgba(139,92,246,0.10)',
  pink: 'rgba(236,72,153,0.10)',
  orange: 'rgba(249,115,22,0.10)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

/** Format a number as currency (base symbol from the currency code). */
export function money(n: number | null | undefined, currency = 'INR'): string {
  const v = Number(n ?? 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}

// ── Currencies ───────────────────────────────────────────────────────────────
export interface CurrencyDef { code: string; symbol: string; name: string; flag: string; }

export const CURRENCIES: CurrencyDef[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee', flag: '🇳🇵' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
];

const CURRENCY_MAP: Record<string, CurrencyDef> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

/** Symbol for a currency code (falls back to the code itself). */
export function currencySymbol(code?: string | null): string {
  return (code && CURRENCY_MAP[code]?.symbol) || code || '₹';
}

/** A searchable currency picker: flag + code + name. Form-friendly (value/onChange). */
export function CurrencySelect(props: {
  value?: string;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  return (
    <div style={props.style}>
      <SearchableDropdown
        placeholder="Select currency"
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        options={CURRENCIES.map((c) => ({
          value: c.code,
          label: `${c.flag}  ${c.code} · ${c.name}`,
        }))}
        hideAvatar
        width="100%"
      />
    </div>
  );
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  pending: 'gold',
  approved: 'blue',
  paid: 'green',
  rejected: 'red',
  cancelled: 'default',
  partially_reconciled: 'cyan',
  reconciled: 'green',
};

export function StatusTag({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <Tag color={STATUS_COLORS[status] ?? 'default'} style={{ margin: 0 }}>{label}</Tag>;
}

// ── Header ─────────────────────────────────────────────────────────────────
export function PanelHeader({
  icon,
  color = PALETTE.blue,
  tint = TINT.blue,
  title,
  subtitle,
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  onRefresh,
  loading,
  hideSidebarToggle,
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
  onRefresh?: () => void;
  loading?: boolean;
  hideSidebarToggle?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rvp-header">
      <div className="rvp-head-about">
        {!hideSidebarToggle && (
          <button 
            className="rvp-mobile-toggle" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-reimbursement-sidebar'))}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <span className="rvp-head-icon" style={{ background: tint, color }}>
          {icon}
        </span>
        <div>
          <div className="rvp-head-title">{title}</div>
          {subtitle && <div className="rvp-head-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="rvp-head-actions">
        {onSearch && (
          <Input
            className="rvp-search"
            allowClear
            prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
        {onRefresh && (
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined spin={loading} />} onClick={onRefresh} />
          </Tooltip>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Stat cards ─────────────────────────────────────────────────────────────
export interface StatCell {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  color: string;
  tint: string;
}

export function StatCards({ cells, title = "Reimbursement Overview", tag = "LIVE", dotColor = "#3b82f6", progressPct = "100%" }: { cells: StatCell[], title?: string, tag?: string, dotColor?: string, progressPct?: string }) {
  return (
    <div className="rvp-sprint-header-v2">
      <div className="rvp-sprint-row1">
        <div className="rvp-sprint-title-block">
          <div className="rvp-sprint-dot" style={{ background: dotColor }} />
          <h2 className="rvp-sprint-title">{title}</h2>
          <div className="rvp-sprint-tags">
            <span className="rvp-sprint-tag rvp-sprint-tag-active">{tag}</span>
          </div>
        </div>
      </div>
      <div className="rvp-sprint-row2">
        {cells.map((c) => (
          <span key={c.label} className="rvp-sprint-meta">
            <span style={{ color: c.color, display: 'flex', alignItems: 'center' }}>{c.icon}</span>
            {c.label}: <b>{c.value}</b>
            {c.hint && <span style={{ color: 'var(--text-slate-400)', marginLeft: 4, fontWeight: 400 }}>{c.hint}</span>}
          </span>
        ))}
      </div>
      <div className="rvp-sprint-row3">
        <div className="rvp-sprint-progress-bar">
          <div
            className="rvp-sprint-progress-fill"
            style={{ width: progressPct, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
          />
        </div>
        <span className="rvp-sprint-progress-pct">{progressPct}</span>
      </div>
    </div>
  );
}

// ── Section card (drawer form groups) ────────────────────────────────────────
export function SectionCard({
  icon,
  tint = TINT.blue,
  color = PALETTE.blue,
  title,
  subtitle,
  step,
  children,
}: {
  icon: React.ReactNode;
  tint?: string;
  color?: string;
  title: string;
  subtitle?: string;
  step?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rvp-section">
      <div className="rvp-section-head">
        <span className="rvp-section-icon" style={{ background: tint, color }}>
          {icon}
        </span>
        <div className="rvp-section-titles">
          <div className="rvp-section-title">{title}</div>
          {subtitle && <div className="rvp-section-sub">{subtitle}</div>}
        </div>
        {step && <span className="rvp-section-step">{step}</span>}
      </div>
      <div className="rvp-section-body">{children}</div>
    </div>
  );
}

export const tablePaginationConfig = {
  pageSize: 15,
  showTotal: (total: number, range: [number, number]) => (
    <>Showing <strong>{range[0]}–{range[1]}</strong> of <strong>{total}</strong></>
  ),
  showSizeChanger: true,
  pageSizeOptions: ['10', '15', '20', '25', '50', '100']
};

// ── Shared styles (render once per panel) ────────────────────────────────────
export function RmbStyles() {
  return (
    <style jsx global>{`
      .rvp { display: flex; flex-direction: column; min-height: 0; flex: 1; overflow: hidden; }
      .rvp-header {
        display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        padding: 16px 20px 20px !important; border-bottom: 1px solid var(--border-slate-100); margin-bottom: 0px;
        position: sticky; top: 0; z-index: 30; background: var(--bg-pure-white);
      }
      .rvp-head-about { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .rvp-mobile-toggle {
        display: none; background: transparent; border: none; color: var(--text-slate-700);
        cursor: pointer; padding: 4px; border-radius: 6px;
      }
      .rvp-mobile-toggle:hover { background: var(--bg-slate-50); }
      @media (max-width: 1024px) {
        .rvp-mobile-toggle { display: flex; align-items: center; justify-content: center; }
      }
      .rvp-head-icon {
        width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center;
        justify-content: center; font-size: 16px; flex-shrink: 0;
      }
      .rvp-head-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.15; }
      .rvp-head-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; margin-top: 1px; }
      .rvp-head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .rvp-head-actions .ant-btn { height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
      .rvp-search.ant-input-affix-wrapper { width: 240px; height: 32px; border-radius: 8px; }
      /* Sprint Header (Stats) */
      .rvp-sprint-header-v2 { display: flex; flex-direction: column; gap: 2px; padding: 8px 20px 10px; background: var(--bg-pure-white); border-bottom: 1px solid var(--border-slate-200); margin-bottom: 0px; flex-shrink: 0; }
      .rvp-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
      .rvp-sprint-title-block { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1 1 auto; }
      .rvp-sprint-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .rvp-sprint-title { font-size: 13px !important; font-weight: 800 !important; color: var(--text-slate-900) !important; letter-spacing: -0.01em; margin: 0; }
      .rvp-sprint-tags { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; }
      .rvp-sprint-tag { display: inline-flex; align-items: center; height: 16px; padding: 0 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px; border: 1px solid transparent; text-transform: uppercase; line-height: 1; }
      .rvp-sprint-tag-active { background: transparent; color: #34d399; border-color: rgba(16, 185, 129, 0.32); }
      .rvp-sprint-row2 { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding-left: 14px; margin-bottom: 4px; }
      .rvp-sprint-meta { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em; }
      .rvp-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
      .rvp-sprint-row3 { display: flex; align-items: center; gap: 10px; padding-left: 14px; }
      .rvp-sprint-progress-bar { flex: 1 1 auto; position: relative; height: 5px; background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px; }
      .rvp-sprint-progress-fill { position: absolute; inset: 0; border-radius: 999px; transition: width 0.4s ease; }
      .rvp-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; padding: 0 20px; }
      .rvp-filter-count { font-size: 12px; color: var(--text-slate-500); margin-left: auto; }
      .rvp > .ant-tabs { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .rvp > .ant-tabs > .ant-tabs-nav { padding: 0 20px; margin-bottom: 12px; }
      .rvp > .ant-tabs > .ant-tabs-content-holder,
      .rvp > .ant-tabs > .ant-tabs-content-holder > .ant-tabs-content,
      .rvp > .ant-tabs > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane-active {
        display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
      }
      .rvp-table-wrap {
        display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
      }
      .rvp-table-wrap .ant-table-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .rvp-table-wrap .ant-spin-nested-loading { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .rvp-table-wrap .ant-spin-container { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .rvp-table-wrap .ant-table {
        flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column;
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-200);
        border-radius: 0 !important;
        margin-bottom: 0;
      }
      .rvp-table-wrap .ant-table-container { overflow: hidden !important; display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .rvp-table-wrap .ant-table-content { overflow-y: auto !important; overflow-x: auto !important; flex: 1; min-height: 0; }
      .rvp-table-wrap .ant-table table { min-width: 800px; }
      .rvp-table-wrap .ant-table-thead > tr > th:first-child,
      .rvp-table-wrap .ant-table-thead > tr > th:last-child {
        border-radius: 0 !important;
      }
      
      /* Ticket style table headers for ALL v2 tables (in rv-shell and drawers) */
      .rvp-table-wrap .ant-table-thead > tr > th,
      .ant-drawer-content .ant-table-thead > tr > th,
      .ant-table-thead > tr > th {
        position: sticky; top: 0; z-index: 10;
        padding: 5px 10px !important;
        font-size: 10px !important;
        font-weight: 800 !important;
        background: var(--bg-slate-50, #f8fafc) !important;
        color: var(--text-slate-500, #64748b) !important;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: left !important;
        border-bottom: 1px solid var(--border-slate-200) !important;
        /* Remove vertical separator lines between header cells */
        border-inline-end: none !important;
      }
      .rvp-table-wrap .ant-table-thead > tr > th::before,
      .ant-drawer-content .ant-table-thead > tr > th::before {
        display: none !important;
      }
      [data-theme='dark'] .rvp-table-wrap .ant-table-thead > tr > th,
      [data-theme='dark'] .ant-drawer-content .ant-table-thead > tr > th {
        background: #0f1419 !important;
        color: #94a3b8 !important;
      }
      .rvp-table-wrap .ant-table-tbody > tr > td,
      .ant-drawer-content .ant-table-tbody > tr > td {
        padding: 4px 10px !important;
        font-size: 11.5px !important;
        text-align: left !important;
      }

      /* Square pagination buttons */
      .rvp-table-wrap .ant-pagination .ant-pagination-item,
      .rvp-table-wrap .ant-pagination .ant-pagination-prev .ant-pagination-item-link,
      .rvp-table-wrap .ant-pagination .ant-pagination-next .ant-pagination-item-link {
        border-radius: 4px !important;
      }
      .rvp-table-wrap .ant-pagination .ant-pagination-item-active {
        border-radius: 4px !important;
      }

      .rvp-table-wrap .ant-pagination {
        margin: 0 !important;
        padding: 12px 20px;
        background: var(--bg-pure-white);
        border-top: 1px solid var(--border-slate-200);
        display: flex; align-items: center;
        flex-shrink: 0;
      }
      .rvp-table-wrap .ant-pagination-total-text { margin-right: auto; color: var(--text-slate-500); font-size: 13px; }
      .rvp-empty { padding: 48px; text-align: center; color: var(--text-slate-400); }
      .rvp-section {
        border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-pure-white);
        margin-bottom: 16px; overflow: hidden;
      }
      .rvp-section-head {
        display: flex; align-items: center; gap: 12px; padding: 14px 16px;
        border-bottom: 1px solid var(--border-slate-100); background: var(--bg-slate-50);
      }
      .rvp-section-icon {
        width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center;
        justify-content: center; font-size: 15px; flex-shrink: 0;
      }
      .rvp-section-titles { flex: 1; min-width: 0; }
      .rvp-section-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
      .rvp-section-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
      .rvp-section-step {
        font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: var(--text-slate-500);
        background: var(--bg-slate-100); border-radius: 999px; padding: 3px 9px;
      }
      .rvp-section-body { padding: 16px; }
      .rvp-drawer-foot { display: flex; justify-content: flex-end; gap: 8px; }
      .rvp-line-row {
        display: grid; grid-template-columns: 1fr 130px 120px 36px; gap: 8px; align-items: center; margin-bottom: 8px;
      }
      .rvp-bar { height: 8px; border-radius: 999px; background: var(--bg-slate-100); overflow: hidden; }
      .rvp-bar > span { display: block; height: 100%; border-radius: 999px; }
    `}</style>
  );
}
