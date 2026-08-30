"use client";

import React from "react";
import { Select } from "antd";

interface OverviewPagerProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  noun?: string;
  pageSizeOptions?: number[];
}

export const OverviewPager: React.FC<OverviewPagerProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  noun = "items",
  pageSizeOptions = [10, 20, 25, 50, 100],
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const windowed = Array.from({ length: pageCount }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className="po-footer">
      <div className="po-footer-info">
        Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong> {noun}
      </div>
      <div className="po-pager">
        <button
          type="button"
          className="po-pager-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          ‹
        </button>
        {windowed.map((p) => (
          <button
            key={p}
            type="button"
            className={`po-pager-num ${p === page ? "is-active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="po-pager-btn"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          ›
        </button>
        <Select
          className="po-pagesize"
          value={pageSize}
          onChange={(v) => onPageSizeChange(v)}
          options={pageSizeOptions.map((n) => ({ value: n, label: `${n} / page` }))}
          popupMatchSelectWidth={120}
          size="small"
        />
      </div>

      <style jsx global>{`
        /* A footer band for the bottom of a .po-panel — full width, flush to
           the panel's rounded corners, no negative margins. */
        .po-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
          padding: 9px 14px;
          background: var(--bg-slate-50);
          border-top: 1px solid var(--border-slate-200);
          border-radius: 0 0 10px 10px;
          flex-shrink: 0;
        }
        [data-theme='dark'] .po-footer {
          background: #0f1419;
          border-top-color: #1f2937;
        }
        .po-footer-info {
          font-size: 12px;
          color: var(--text-slate-500);
        }
        .po-footer-info strong {
          color: var(--text-slate-700);
          font-weight: 700;
        }
        [data-theme='dark'] .po-footer-info strong { color: #f1f5f9; }
        .po-pager {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .po-pager-btn,
        .po-pager-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
          border-radius: 7px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          cursor: pointer;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          transition: background .12s ease, border-color .12s ease, color .12s ease;
        }
        .po-pager-btn:hover:not(:disabled),
        .po-pager-num:hover:not(.is-active) {
          border-color: #bfdbfe;
          color: #2563eb;
          background: var(--bg-blue-50);
        }
        .po-pager-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .po-pager-num.is-active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        [data-theme='dark'] .po-pager-btn,
        [data-theme='dark'] .po-pager-num {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        [data-theme='dark'] .po-pager-num.is-active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        .po-pagesize {
          margin-left: 5px;
        }
        .po-pagesize .ant-select-selector {
          border-radius: 7px !important;
          height: 28px !important;
        }
      `}</style>
    </div>
  );
};
