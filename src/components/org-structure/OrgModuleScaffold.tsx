"use client";

import NoData from "@/components/common/NoData";
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
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { StatCards, PALETTE, TINT } from "@/components/letters/ui";

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
  title?: string;
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
  progressPct?: string | number;

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

  serverPagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

const DEFAULT_PAGE_SIZES = [10, 15, 20, 25, 50, 100];

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
  title,
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
  progressPct,
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
  serverPagination,
}: OrgModuleScaffoldProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize ?? 15);

  const page = serverPagination ? serverPagination.current : internalPage;
  const pageSize = serverPagination ? serverPagination.pageSize : internalPageSize;

  const handlePageChange = (p: number) => {
    if (serverPagination) {
      serverPagination.onChange(p, pageSize);
    } else {
      setInternalPage(p);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (serverPagination) {
      serverPagination.onChange(1, size);
    } else {
      setInternalPageSize(size);
      setInternalPage(1);
    }
  };

  // Reset to first page whenever the result set shrinks/changes.
  useEffect(() => {
    if (!serverPagination) setInternalPage(1);
  }, [data.length, search, serverPagination]);

  const total = serverPagination ? serverPagination.total : data.length;
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  
  const paged = useMemo(
    () => serverPagination ? data : data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize, serverPagination],
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

  const statCells = useMemo(() => {
    return stats.map((s) => ({
      label: s.label,
      value: `${s.value}${s.suffix || ""}`,
      icon: s.icon,
      color: s.color || PALETTE.blue,
      tint: s.tint || TINT.blue,
    }));
  }, [stats]);

  return (
    <div className="omx-main" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 }}>
      {/* ── Topbar ── */}
      <div className="omx-topbar" data-tour="org-scaffold-topbar" style={{ padding: "10px 24px", background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-200)" }}>
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

      {/* ── Stat Cards ── */}
      {stats.length > 0 && (
        <StatCards
          title={title || "Org Structure Overview"}
          statusText="ACTIVE"
          progressPct={progressPct}
          cells={statCells}
        />
      )}

      {/* ── Body ── */}
      {view === "list" ? (
        <div className="doc-table-wrap">
          <ZukvoLoadingOverlay loading={!!loading} message="">
            <Table
              className="att-table flex-table omx-table"
              rowKey={rowKey}
              columns={columns}
              dataSource={paged}
              size="small"
              pagination={false}
              scroll={{ x: "max-content", y: "100%" }}
              locale={{ emptyText: <NoData description={emptyState} /> }}
              onRow={(record) =>
                onRowClick
                  ? {
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest("button, input, .ant-select, .ant-dropdown-trigger, .ant-popover-open")) return;
                      onRowClick(record);
                    },
                    className: "att-row omx-row",
                  }
                  : {}
              }
            />
          </ZukvoLoadingOverlay>
        </div>
      ) : (
        <div className="omx-grid-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div className="omx-grid">
            {loading ? (
              <div className="omx-grid-loading">Loading…</div>
            ) : total === 0 ? (
              <div style={{ gridColumn: "1 / -1" }}><NoData description={emptyState} /></div>
            ) : (
              paged.map((record) => (
                <React.Fragment key={record[rowKey]}>{renderCard(record)}</React.Fragment>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Footer ── */}
      {total > 0 && (
        <div className="pp-footer pp-footer--sticky">
          <div className="pp-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="pp-pager">
            <button type="button" className="pp-pager-btn" disabled={page <= 1} onClick={() => handlePageChange(Math.max(1, page - 1))}>‹</button>
            {pagerNums.map((p) => (
              <button key={p} type="button" className={`pp-pager-num ${p === page ? "is-active" : ""}`} onClick={() => handlePageChange(p)}>{p}</button>
            ))}
            <button type="button" className="pp-pager-btn" disabled={page >= pageCount} onClick={() => handlePageChange(Math.min(pageCount, page + 1))}>›</button>
            <Select
              className="pp-pagesize"
              value={pageSize}
              onChange={(v) => handlePageSizeChange(v)}
              options={pageSizeOptions.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .omx-main { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; height: 100%; position: relative; overflow: hidden; }
        .omx-body { flex: 1 0 auto; min-height: 0; }

        /* Topbar */
        .omx-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 0; flex-wrap: wrap; flex-shrink: 0; }
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

        /* Grid Layout */
        .omx-grid-scroll { flex: 1; min-height: 0; overflow-y: auto; }
        .omx-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          padding: 16px;
        }
        .omx-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        /* Modern Card UI */
        .omx-card {
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex; flex-direction: column;
          border-radius: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
          position: relative;
          overflow: hidden;
        }
        .omx-card:hover {
          box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.04);
          border-color: #93c5fd;
          transform: translateY(-2px);
        }
        .omx-card-top { display: flex; align-items: center; gap: 12px; padding: 14px 16px 10px; }
        .omx-card-avatar {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: #ffffff;
          font-weight: 800; font-size: 13px; letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .omx-card-id { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .omx-card-title {
          font-size: 14px; font-weight: 700; color: var(--text-slate-900);
          letter-spacing: -0.015em; line-height: 1.3;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .omx-card-sub {
          font-size: 11px; color: #64748b; font-weight: 600;
          background: var(--bg-slate-100, #f1f5f9); padding: 1.5px 7px;
          border-radius: 5px; display: inline-block; width: fit-content;
          max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .omx-card-actions {
          flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; border: 1px solid transparent; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s ease;
        }
        .omx-card-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); border-color: var(--border-slate-200); }
        .omx-card-desc {
          font-size: 12px; color: var(--text-slate-500); line-height: 1.5; padding: 0 16px 14px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 36px; flex: 1;
        }
        .omx-card-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 10px 16px; border-top: 1px solid var(--border-slate-100); background: var(--bg-slate-50, #f8fafc);
        }
        .omx-card-foot-key { font-size: 11px; font-weight: 600; color: var(--text-slate-500); }

        /* Status pill (shared) */
        .omx-pill {
          display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 9px;
          border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .omx-pill.is-active { color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; }
        .omx-pill.is-inactive { color: #475569; background: #f1f5f9; border: 1px solid #cbd5e1; }
        .omx-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .omx-chip {
          display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 9px;
          border-radius: 6px; font-size: 11px; font-weight: 600; background: #eff6ff;
          color: #2563eb; border: 1px solid #bfdbfe; white-space: nowrap; max-width: 170px;
          overflow: hidden; text-overflow: ellipsis;
        }
        .omx-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        /* Empty */
        .omx-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .omx-empty-orb { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: var(--bg-blue-50); color: #3b82f6; margin-bottom: 16px; }
        .omx-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .omx-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }

        /* Fixed Bottom Footer */
        .pp-footer {
          flex-shrink: 0; margin-top: auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 24px; background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05); z-index: 30;
          width: 100%; white-space: nowrap;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); display: flex; align-items: center; gap: 4px; }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 4px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .pp-pagesize { margin-left: 6px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; display: flex !important; align-items: center !important; }

        @media (max-width: 820px) { .omx-topbar-meta { display: none; } }
        @media (max-width: 620px) {
          .omx-grid { grid-template-columns: 1fr; }
          .omx-topbar { flex-direction: column; align-items: stretch; }
          .omx-search-wrap { max-width: none; flex: 1 1 auto; }
          .omx-topbar-actions { justify-content: space-between; width: 100%; margin-left: 0; margin-top: 4px; }
        }
      `}</style>
    </div>
  );
}

export default OrgModuleScaffold;
