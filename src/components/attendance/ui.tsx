'use client';

import React from 'react';
import { Tag } from 'antd';

export const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  purple: '#8B5CF6',
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
  purple: 'rgba(139,92,246,0.10)',
  pink: 'rgba(236,72,153,0.10)',
  orange: 'rgba(249,115,22,0.10)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

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

// ── Shared StatCards Component ───────────────────────────────────────────────
export function StatCards({
  cells,
  progressPct,
  title = "Payroll Status",
  statusText = "ACTIVE",
  statusColor = "#34d399",
  statusBorder = "rgba(16, 185, 129, 0.32)",
  extra,
}: {
  cells: { label: React.ReactNode; value: React.ReactNode; icon: React.ReactNode; color: string; tint: string }[];
  progressPct?: string;
  title?: string;
  statusText?: string;
  statusColor?: string;
  statusBorder?: string;
  extra?: React.ReactNode;
}) {
  return (
    <>
      <AttStyles />
      <div className="att-sprint-header-v2">
        <div className="att-sprint-row1">
          <div className="att-sprint-title-block">
            <div className="att-sprint-dot" style={{ background: '#3B82F6' }} />
            <h2 className="att-sprint-title">{title}</h2>
            <div className="att-sprint-tags">
              <Tag className="att-sprint-tag att-sprint-tag-active" bordered={false} style={{ color: statusColor, borderColor: statusBorder }}>{statusText}</Tag>
            </div>
          </div>
          {extra && <div className="att-sprint-extra">{extra}</div>}
        </div>
        <div className="att-sprint-row2">
          {cells.map((c, i) => (
            <div key={i} className="att-sprint-meta">
              <span style={{ color: c.color }}>{c.icon}</span>
              <span>{c.label}: <b>{c.value}</b></span>
            </div>
          ))}
        </div>
        <div className="att-sprint-row3">
          <div className="att-sprint-progress-bar">
            <div className="att-sprint-progress-fill" style={{ width: progressPct || '100%', background: '#3B82F6' }} />
          </div>
          <div className="att-sprint-progress-pct">{progressPct || '100%'}</div>
        </div>
      </div>
    </>
  );
}

// ── Shared Payroll V2 Styles ─────────────────────────────────────────────────
export function AttStyles() {
  return (
    <style jsx global>{`
      /* Sprint Header (Stats) */
      .att-sprint-header-v2 { display: flex; flex-direction: column; gap: 2px; padding: 4px 20px 6px; background: var(--bg-pure-white); border-bottom: 1px solid var(--border-slate-200); margin-top: 8px; margin-bottom: 8px; flex-shrink: 0; }
      .att-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
      .att-sprint-title-block { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1 1 auto; }
      .att-sprint-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .att-sprint-title { font-size: 13px !important; font-weight: 800 !important; color: var(--text-slate-900) !important; letter-spacing: -0.01em; margin: 0; }
      .att-sprint-tags { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; }
      .att-sprint-tag { display: inline-flex; align-items: center; height: 16px; padding: 0 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px; border: 1px solid transparent; text-transform: uppercase; line-height: 1; }
      .att-sprint-tag-active { background: transparent; color: #34d399; border-color: rgba(16, 185, 129, 0.32); }
      .att-sprint-row2 { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding-left: 14px; margin-bottom: 4px; }
      .att-sprint-meta { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em; }
      .att-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
      .att-sprint-row3 { display: flex; align-items: center; gap: 10px; padding-left: 14px; }
      .att-sprint-progress-bar { flex: 1 1 auto; position: relative; height: 5px; background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px; }
      .att-sprint-progress-fill { position: absolute; inset: 0; border-radius: 999px; transition: width 0.4s ease; }
      .att-sprint-progress-pct { flex-shrink: 0; font-size: 11px; font-weight: 800; color: var(--text-slate-900); font-variant-numeric: tabular-nums; min-width: 32px; }

      /* Payroll Global Table Wrap */
      .att-content-wrap { padding: 0 20px; display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .att-table-wrap {
        display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
      }
      .att-table-wrap .ant-table-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .att-table-wrap .zlo,
      .att-table-wrap .zlo__content { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .att-table-wrap .ant-spin-nested-loading { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .att-table-wrap .ant-spin-container { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .att-table-wrap .ant-table {
        flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column;
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-200);
        border-radius: 0 !important;
        margin-bottom: 0;
        border-left: none; border-right: none;
      }
      .att-table-wrap .ant-table-container { overflow: hidden !important; display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .att-table-wrap .ant-table-content { overflow-y: auto !important; overflow-x: auto !important; flex: 1; min-height: 0; }
      .att-table-wrap .ant-table table { min-width: 800px; }
      
      .att-table-wrap .ant-table-thead > tr > th:first-child,
      .att-table-wrap .ant-table-thead > tr > th:last-child {
        border-radius: 0 !important;
      }
      
      /* Table headers fixed */
      .att-table-wrap .ant-table-thead > tr > th,
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
        border-inline-end: none !important;
      }
      .att-table-wrap .ant-table-thead > tr > th::before,
      .ant-drawer-content .ant-table-thead > tr > th::before {
        display: none !important;
      }
      [data-theme='dark'] .att-table-wrap .ant-table-thead > tr > th,
      [data-theme='dark'] .ant-drawer-content .ant-table-thead > tr > th {
        background: #0f1419 !important;
        color: #94a3b8 !important;
      }
      .att-table-wrap .ant-table-tbody > tr > td,
      .ant-drawer-content .ant-table-tbody > tr > td {
        padding: 4px 10px !important;
        font-size: 11.5px !important;
        text-align: left !important;
      }

      /* Fixed footer / pagination */
      .att-table-wrap .ant-pagination {
        margin: 0 !important;
        padding: 12px 20px;
        background: var(--bg-pure-white);
        border-top: 1px solid var(--border-slate-200);
        display: flex; align-items: center;
        flex-shrink: 0;
      }
      .att-table-wrap .ant-pagination-total-text { margin-right: auto; color: var(--text-slate-500); font-size: 13px; }
      
    `}</style>
  );
}
