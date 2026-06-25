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
    <div className="po-footer po-footer--sticky">
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
        .po-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px 14px;
          border-top: 1px solid var(--border-slate-200);
        }
        .po-footer--sticky {
          position: sticky;
          bottom: 0;
          z-index: 30;
          margin: 12px -18px 0;
          padding: 12px 18px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.05);
        }
        .po-footer-info {
          font-size: 12px;
          color: var(--text-slate-500);
        }
        .po-footer-info strong {
          color: var(--text-slate-700);
          font-weight: 700;
        }
        .po-pager {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .po-pager-btn,
        .po-pager-num {
          min-width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
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
