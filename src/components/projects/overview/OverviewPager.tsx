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
  sticky?: boolean;
}

export const OverviewPager: React.FC<OverviewPagerProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  noun = "items",
  pageSizeOptions = [10, 15, 20, 25, 50, 100],
  sticky = true,
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const windowed = Array.from({ length: pageCount }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className={`pp-footer ${sticky ? "pp-footer--sticky" : ""}`}>
      <div className="pp-footer-info">
        Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong> {noun}
      </div>
      <div className="pp-pager">
        <button
          type="button"
          className="pp-pager-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          ‹
        </button>
        {windowed.map((p) => (
          <button
            key={p}
            type="button"
            className={`pp-pager-num ${p === page ? "is-active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="pp-pager-btn"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          ›
        </button>
        <Select
          className="pp-pagesize"
          value={pageSize}
          onChange={(v) => onPageSizeChange(v)}
          options={pageSizeOptions.map((n) => ({ value: n, label: `${n} / page` }))}
          popupMatchSelectWidth={120}
          size="small"
        />
      </div>

      <style jsx global>{`
        /* Footer + pager matching standard app style */
        .pp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 0 16px;
          border-top: 1px solid var(--border-slate-200);
          height: 52px !important;
          box-sizing: border-box;
        }
        .pp-footer--sticky {
          position: sticky;
          bottom: 0;
          z-index: 30;
          margin-top: auto;
          margin-left: -16px;
          margin-right: -16px;
          margin-bottom: -18px;
          padding: 0 16px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.05);
          height: 52px !important;
          box-sizing: border-box;
        }
        [data-theme='dark'] .pp-footer,
        [data-theme='dark'] .pp-footer--sticky {
          background: #0f1419;
          border-top-color: #1f2937;
          box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.3);
        }
        .pp-footer-info {
          font-size: 12px;
          color: var(--text-slate-500);
        }
        .pp-footer-info strong {
          color: var(--text-slate-700);
          font-weight: 700;
        }
        [data-theme='dark'] .pp-footer-info strong {
          color: #f1f5f9;
        }
        .pp-pager {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .pp-pager-btn,
        .pp-pager-num {
          min-width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background .12s ease, border-color .12s ease, color .12s ease;
        }
        .pp-pager-btn:hover:not(:disabled),
        .pp-pager-num:hover:not(.is-active) {
          border-color: #3b82f6;
          color: #3b82f6;
          background: var(--bg-blue-50);
        }
        .pp-pager-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pp-pager-num.is-active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        [data-theme='dark'] .pp-pager-btn,
        [data-theme='dark'] .pp-pager-num {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        [data-theme='dark'] .pp-pager-num.is-active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        .pp-pagesize {
          margin-left: 5px;
        }
        .pp-pagesize .ant-select-selector {
          border-radius: 7px !important;
          height: 28px !important;
        }
      `}</style>
    </div>
  );
};
