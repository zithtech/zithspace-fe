'use client';

import React from 'react';
import { Tag } from 'antd';

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

function extractNumericValue(val: React.ReactNode): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }
  if (React.isValidElement(val)) {
    const props = val.props as any;
    if (props?.children) {
      if (Array.isArray(props.children)) {
        for (const child of props.children) {
          const res = extractNumericValue(child);
          if (res !== null) return res;
        }
      } else {
        return extractNumericValue(props.children);
      }
    }
  }
  return null;
}

// ── Shared StatCards Component ───────────────────────────────────────────────
export function StatCards({
  cells,
  progressPct,
  title = "Onboarding Status",
  statusText = "ACTIVE",
  statusColor = "#10b981",
  statusBorder = "rgba(16, 185, 129, 0.32)",
  extra,
}: {
  cells: { label: React.ReactNode; value: React.ReactNode; icon: React.ReactNode; color: string; tint: string }[];
  progressPct?: string | number;
  title?: string;
  statusText?: string;
  statusColor?: string;
  statusBorder?: string;
  extra?: React.ReactNode;
}) {
  const { pctNumber, pctString } = React.useMemo(() => {
    if (progressPct !== undefined && progressPct !== null && progressPct !== "") {
      const parsed = typeof progressPct === "number" ? progressPct : parseFloat(String(progressPct));
      if (!isNaN(parsed)) {
        const clamped = Math.min(100, Math.max(0, parsed));
        return { pctNumber: clamped, pctString: `${clamped}%` };
      }
    }
    if (cells && cells.length > 0) {
      let total = 0;
      let completed = 0;
      let hasTotal = false;
      let hasCompleted = false;

      for (const item of cells) {
        const lbl = String(item.label || "").toLowerCase();
        const numVal = extractNumericValue(item.value);
        if (numVal !== null) {
          if (lbl.includes("total") || lbl.includes("all") || lbl.includes("count") || lbl.includes("employees") || lbl.includes("invites") || lbl.includes("documents")) {
            total = numVal;
            hasTotal = true;
          } else if (lbl.includes("completed") || lbl.includes("active") || lbl.includes("approved") || lbl.includes("uploaded") || lbl.includes("submitted")) {
            completed += numVal;
            hasCompleted = true;
          }
        }
      }

      if (hasTotal && total > 0 && hasCompleted) {
        const computed = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
        return { pctNumber: computed, pctString: `${computed}%` };
      }
    }
    return { pctNumber: 0, pctString: "0%" };
  }, [progressPct, cells]);

  return (
    <>
      <OnbStyles />
      <div className="onb-sprint-header-v2">
        <div className="onb-sprint-row1">
          <div className="onb-sprint-title-block">
            <div
              className="onb-sprint-dot"
              style={{ background: "#3b82f6", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)" }}
            />
            <h2 className="onb-sprint-title">{title}</h2>
            <div className="onb-sprint-tags">
              <span
                className="onb-sprint-tag onb-sprint-tag-active"
                style={{ color: statusColor, borderColor: statusBorder }}
              >
                {statusText}
              </span>
            </div>
          </div>
          {extra && <div className="onb-sprint-extra">{extra}</div>}
        </div>
        <div className="onb-sprint-row2">
          {cells.map((c, i) => (
            <div key={i} className="onb-sprint-meta">
              <span style={{ color: c.color, display: "inline-flex", alignItems: "center" }}>
                {c.icon}
              </span>
              <span>
                <b>{c.value}</b> {c.label}
              </span>
            </div>
          ))}
        </div>
        <div className="onb-sprint-row3">
          <div className="onb-sprint-progress-bar">
            <div
              className="onb-sprint-progress-fill"
              style={{ width: `${pctNumber}%` }}
            />
          </div>
          <div className="onb-sprint-progress-pct">{pctString}</div>
        </div>
      </div>
    </>
  );
}

// ── Shared Onboarding Styles ─────────────────────────────────────────────────
export function OnbStyles() {
  return (
    <style jsx global>{`
      /* Sprint Header (Stats) */
      .onb-sprint-header-v2 {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 24px;
        background: var(--bg-slate-50, #f8fafc) !important;
        border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        flex-shrink: 0;
      }
      .onb-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .onb-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
      .onb-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
      .onb-sprint-title { font-size: 13.5px !important; font-weight: 800 !important; color: var(--text-slate-900, #0f172a) !important; letter-spacing: -0.01em; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .onb-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
      .onb-sprint-tag { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px; border: 1px solid transparent; text-transform: uppercase; line-height: 1; }
      .onb-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16, 185, 129, 0.32); }
      .onb-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
      .onb-sprint-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: var(--text-slate-500, #64748b); letter-spacing: -0.005em; }
      .onb-sprint-meta b { color: var(--text-slate-900, #0f172a); font-weight: 800; }
      .onb-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 15px; }
      .onb-sprint-progress-bar { flex: 1 1 auto; position: relative; height: 6px; background: var(--bg-slate-100, #f1f5f9); border-radius: 999px; overflow: hidden; min-width: 60px; }
      .onb-sprint-progress-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 999px; transition: width 0.4s ease; }
      .onb-sprint-progress-pct { flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900, #0f172a); font-variant-numeric: tabular-nums; min-width: 36px; }

      /* Dark theme for sprint header */
      [data-theme='dark'] .onb-sprint-header-v2 {
        background: var(--bg-card, #1e293b) !important;
        border-bottom-color: var(--border-color, rgba(255, 255, 255, 0.08)) !important;
      }
      [data-theme='dark'] .onb-sprint-title,
      [data-theme='dark'] .onb-sprint-meta b,
      [data-theme='dark'] .onb-sprint-progress-pct {
        color: var(--text-primary, #f8fafc) !important;
      }
      [data-theme='dark'] .onb-sprint-meta {
        color: var(--text-secondary, #94a3b8) !important;
      }
      [data-theme='dark'] .onb-sprint-progress-bar {
        background: rgba(255, 255, 255, 0.08) !important;
      }

      /* Onboarding Global Table Wrap */
      .onb-table-wrap {
        display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
      }
      .onb-table-wrap .ant-table-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .onb-table-wrap .zlo,
      .onb-table-wrap .zlo__content { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .onb-table-wrap .ant-spin-nested-loading { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .onb-table-wrap .ant-spin-container { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
      .onb-table-wrap .ant-table {
        flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column;
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-200);
        border-radius: 0 !important;
        margin-bottom: 0;
        border-left: none; border-right: none;
      }
      .onb-table-wrap .ant-table-container { overflow: hidden !important; display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .onb-table-wrap .ant-table-content { overflow-y: auto !important; overflow-x: auto !important; flex: 1; min-height: 0; }
      .onb-table-wrap .ant-table table { min-width: 800px; }
      
      .onb-table-wrap .ant-table-thead > tr > th:first-child,
      .onb-table-wrap .ant-table-thead > tr > th:last-child {
        border-radius: 0 !important;
      }
      
      /* Table headers fixed */
      .onb-table-wrap .ant-table-thead > tr > th,
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
      .onb-table-wrap .ant-table-thead > tr > th::before,
      .ant-drawer-content .ant-table-thead > tr > th::before {
        display: none !important;
      }
      [data-theme='dark'] .onb-table-wrap .ant-table-thead > tr > th,
      [data-theme='dark'] .ant-drawer-content .ant-table-thead > tr > th {
        background: #0f1419 !important;
        color: #94a3b8 !important;
      }
      .onb-table-wrap .ant-table-tbody > tr > td,
      .ant-drawer-content .ant-table-tbody > tr > td {
        padding: 4px 10px !important;
        font-size: 11.5px !important;
        text-align: left !important;
      }

      /* Fixed footer / pagination */
      .onb-table-wrap .ant-pagination {
        margin: 0 !important;
        padding: 12px 20px;
        background: var(--bg-pure-white);
        border-top: 1px solid var(--border-slate-200);
        display: flex; align-items: center;
        flex-shrink: 0;
      }
      .onb-table-wrap .ant-pagination-total-text { margin-right: auto; color: var(--text-slate-500); font-size: 13px; }
      
    `}</style>
  );
}
