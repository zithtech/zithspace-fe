"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Table, Select, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  PackageOpen,
} from "lucide-react";
import ZukvoLoader from "../common/ZukvoLoader";

/**
 * Shared content-area scaffold for every Org-structure data submodule
 * (Grades, Employment Types, Departments, Sub Departments, Positions).
 *
 * It mirrors the Proposals main page: a search / view-toggle topbar, a row of
 * sparkline stat cards, a grid (card) ⇄ table (list) switch, and a sticky
 * pager. Each page supplies its own stats, table columns and card renderer;
 * the scaffold owns the layout, the view toggle, pagination and the styling.
 */

export type OrgView = "grid" | "list";

export interface OrgStatDef {
  key: string;
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  /** Accent colour for the icon + sparkline. */
  color: string;
  /** Soft background tint behind the icon. */
  tint: string;
  /** Optional 7-point sparkline series. Falls back to a decorative shape. */
  trend?: number[];
  /** Optional "+N" badge shown top-right. */
  delta?: number;
}

interface OrgModuleScaffoldProps<T> {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  /** Inline meta shown next to the search box (e.g. counts). */
  meta?: React.ReactNode;
  /** Optional filter controls rendered inline in the topbar, between the
   *  search box and the view toggle (keeps filters + search + view in one row). */
  filters?: React.ReactNode;
  view: OrgView;
  onViewChange: (v: OrgView) => void;
  onRefresh?: () => void;
  loading?: boolean;

  stats: OrgStatDef[];

  columns: ColumnsType<T>;
  data: T[];
  rowKey: string;
  renderCard: (record: T) => React.ReactNode;
  onRowClick?: (record: T) => void;

  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;

  pageSizeOptions?: number[];
  defaultPageSize?: number;
}

const DEFAULT_PAGE_SIZES = [10, 20, 25, 50, 100];

// Smooth area sparkline used inside the stat cards (Proposals style).
const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `omx-spk-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Deterministic decorative series for stats that have no real time data.
const decorativeTrend = (seed: string): number[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: 7 }, (_, i) => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return 3 + (h % 7) + Math.round(Math.sin(i) * 1.5 + 1.5);
  });
};

export function OrgModuleScaffold<T extends Record<string, any>>({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  meta,
  filters,
  view,
  onViewChange,
  onRefresh,
  loading,
  stats,
  columns,
  data,
  rowKey,
  renderCard,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptySubtitle = "Items you create will show up here.",
  emptyAction,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  defaultPageSize,
}: OrgModuleScaffoldProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize ?? 20);

  // Reset to first page whenever the result set shrinks/changes.
  useEffect(() => {
    setPage(1);
  }, [data.length, search]);

  const total = data.length;
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize],
  );

  const emptyState = (
    <div className="omx-empty">
      <div className="omx-empty-orb"><PackageOpen size={26} /></div>
      <div className="omx-empty-title">{emptyTitle}</div>
      <div className="omx-empty-sub">{emptySubtitle}</div>
      {emptyAction && <div style={{ marginTop: 14 }}>{emptyAction}</div>}
    </div>
  );

  const pagerNums = Array.from({ length: pageCount }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5,
  );

  return (
    <div className="omx-main">
      {/* ── Topbar ── */}
      <div className="omx-topbar">
        <div className="omx-search-wrap">
          <Search size={14} className="omx-search-icon" />
          <input
            className="omx-search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {filters && <div className="omx-topbar-filters">{filters}</div>}

        {meta && <div className="omx-topbar-meta">{meta}</div>}

        <div className="omx-topbar-actions">
          <div className="omx-segmented">
            <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => onViewChange("grid")} aria-label="Card view">
              <LayoutGrid size={15} />
            </button>
            <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => onViewChange("list")} aria-label="Table view">
              <ListIcon size={15} />
            </button>
          </div>
          {onRefresh && (
            <Tooltip title="Refresh">
              <button type="button" className="omx-ghost-btn" onClick={onRefresh}>
                <RefreshCw size={14} className={loading ? "omx-spin" : ""} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="omx-divider" />

      {/* ── Stat cards ── */}
      {stats.length > 0 && (
        <div className="omx-stats">
          {stats.map((s) => {
            const trend = s.trend && s.trend.length ? s.trend : decorativeTrend(s.key + String(s.value));
            return (
              <div key={s.key} className="omx-stat-card">
                <div className="omx-stat-top">
                  <div className="omx-stat-left">
                    <span className="omx-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                    <span className="omx-stat-label">{s.label}</span>
                  </div>
                  {!!s.delta && s.delta > 0 && <span className="omx-stat-delta">+{s.delta}</span>}
                </div>
                <div className="omx-stat-bottom">
                  <div className="omx-stat-value-wrap">
                    <span className="omx-stat-value">{s.value}{s.suffix}</span>
                  </div>
                  <div className="omx-stat-spark"><AreaSparkline values={trend} color={s.color} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Body ── */}
      <div className="omx-body">
        {view === "list" ? (
          <div className="omx-table-wrap" style={{ position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ZukvoLoader size="md" />
              </div>
            )}
            <Table
              className="omx-table"
              rowKey={rowKey}
              columns={columns}
              dataSource={paged}
              loading={false}
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: emptyState }}
              onRow={(record) =>
                onRowClick
                  ? {
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest("button, input, .ant-select, .ant-dropdown-trigger, .ant-popover-open")) return;
                      onRowClick(record);
                    },
                    className: "omx-row",
                  }
                  : {}
              }
            />
          </div>
        ) : (
          <div className="omx-grid">
            {loading ? (
              <div className="omx-grid-loading">Loading…</div>
            ) : total === 0 ? (
              <div style={{ gridColumn: "1 / -1" }}>{emptyState}</div>
            ) : (
              paged.map((record) => (
                <React.Fragment key={record[rowKey]}>{renderCard(record)}</React.Fragment>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Sticky pager ── */}
      {total > 0 && (
        <div className="omx-footer">
          <div className="omx-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="omx-pager">
            <button type="button" className="omx-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            {pagerNums.map((p) => (
              <button key={p} type="button" className={`omx-pager-num ${p === page ? "is-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="omx-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="omx-pagesize"
              value={pageSize}
              onChange={(v) => { setPageSize(v); setPage(1); }}
              options={pageSizeOptions.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .omx-main { display: flex; flex-direction: column; padding: 4px 32px 0; min-width: 0; }
        .omx-body { flex: 1 0 auto; min-width: 0; }

        /* Topbar */
        .omx-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .omx-search-wrap {
          position: relative; flex: 1 1 200px; min-width: 170px; max-width: 320px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .omx-topbar-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .omx-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .omx-search-icon { color: var(--text-slate-400); flex-shrink: 0; }
        .omx-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .omx-search::placeholder { color: var(--text-slate-400); }
        .omx-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .omx-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .omx-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .omx-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .omx-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .omx-segmented button.is-active { background: var(--bg-blue-50); color: #3b82f6; }
        .omx-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .omx-ghost-btn:hover { color: #3b82f6; border-color: #bfdbfe; }
        .omx-spin { animation: omx-spin 1s linear infinite; }
        @keyframes omx-spin { to { transform: rotate(360deg); } }

        .omx-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px; }

        /* Stat cards */
        .omx-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .omx-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .omx-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .omx-stat-left { display: flex; align-items: center; gap: 8px; }
        .omx-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
        .omx-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .omx-stat-delta {
          display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
          color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
        }
        .omx-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .omx-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .omx-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .omx-stat-spark { opacity: 0.95; }

        /* Table */
        .omx-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); overflow: hidden; }
        .omx-table .ant-table { background: transparent; font-size: 12px; }
        .omx-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .omx-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .omx-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .omx-table .ant-table-tbody > tr.omx-row { cursor: pointer; }
        .omx-table .ant-table-tbody > tr.omx-row:hover > td { background: var(--bg-slate-50) !important; }

        /* Grid (compact / minimized cards) — 2 per row */
        .omx-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .omx-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .omx-card {
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          display: flex; flex-direction: column; overflow: hidden;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .omx-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
        .omx-card-top { display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; }
        .omx-card-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 11px;
        }
        .omx-card-id { display: flex; flex-direction: column; min-width: 0; gap: 2px; flex: 1; }
        .omx-card-title { font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .omx-card-sub { font-size: 11px; color: var(--text-slate-400); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .omx-card-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .omx-card-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .omx-card-desc {
          font-size: 11.5px; color: var(--text-slate-500); line-height: 1.45; padding: 0 12px 11px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 17px;
        }
        .omx-card-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 8px 12px; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50);
        }
        .omx-card-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }

        /* Status pill (shared) */
        .omx-pill { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; border: 1px solid transparent; }
        .omx-pill.is-active { color: #10b981; background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.22); }
        .omx-pill.is-inactive { color: #64748b; background: rgba(100,116,139,0.10); border-color: rgba(100,116,139,0.22); }
        .omx-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .omx-chip { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: var(--bg-blue-50); color: #3b82f6; white-space: nowrap; }
        .omx-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        /* Table Overrides */
        :global(.ant-table-thead > tr > th) {
          border-radius: 0px !important;
        }
        :global(.ant-table-wrapper .ant-table-container) {
          border-radius: 0px !important;
        }

        /* Empty */
        .omx-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .omx-empty-orb { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: var(--bg-blue-50); color: #3b82f6; margin-bottom: 16px; }
        .omx-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .omx-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }

        /* Footer + pager */
        .omx-footer {
          position: sticky; bottom: 0; z-index: 30; margin: 24px -32px 0; padding: 12px 32px;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .omx-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .omx-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .omx-pager { display: flex; align-items: center; gap: 3px; }
        .omx-pager-btn, .omx-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .omx-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .omx-pager-num.is-active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .omx-pagesize { margin-left: 5px; }
        .omx-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        @media (max-width: 1100px) { .omx-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 820px) { .omx-topbar-meta { display: none; } }
        @media (max-width: 620px) {
          .omx-grid { grid-template-columns: 1fr; }
          .omx-stats { grid-template-columns: 1fr; }
          .omx-topbar { flex-direction: column; align-items: stretch; }
          .omx-search-wrap { max-width: none; flex: 1 1 auto; }
          .omx-topbar-actions { justify-content: space-between; width: 100%; margin-left: 0; margin-top: 4px; }
          .omx-footer { flex-direction: column; align-items: flex-start; margin: 24px -16px 0; padding: 12px 16px; }
        }
      `}</style>
    </div>
  );
}

export default OrgModuleScaffold;
