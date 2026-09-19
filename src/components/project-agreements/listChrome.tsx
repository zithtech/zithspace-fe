'use client';

/**
 * The two bits of list-page furniture both Agreements and Templates need,
 * shaped like the Tickets list (see TicketList.tsx: renderCustomPagination and
 * the tl-menu-* action rows). The CSS for both lives on the module layout.
 */

import React from 'react';
import { Select } from 'antd';

const PAGE_SIZES = [10, 15, 20, 25, 50, 100];

interface ListFooterProps {
  current: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** What is being counted, e.g. "agreements". Shown when the list is empty. */
  noun?: string;
}

/**
 * Count on the left, pager on the right.
 *
 * Rendered even when the list is empty, unlike the Tickets version — a filter
 * that matched nothing should still show the bar that says so, otherwise the
 * page appears to have lost its footer.
 */
export function ListFooter({
  current,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  noun = 'rows',
}: ListFooterProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(current, pageCount);
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  // A window of five around the current page. Anything wider turns the pager
  // into its own scroll problem on a tenant with hundreds of documents.
  const windowStart = Math.max(0, Math.min(page - 3, pageCount - 5));
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).slice(
    windowStart,
    windowStart + 5
  );

  return (
    <div className="pp-footer">
      <div className="pp-footer-info">
        {total === 0 ? (
          <>No {noun}</>
        ) : (
          <>
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </>
        )}
      </div>
      <div className="pp-pager">
        <button
          type="button"
          className="pp-pager-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`pp-pager-num ${p === page ? 'is-active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="pp-pager-btn"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          aria-label="Next page"
        >
          ›
        </button>
        <Select
          className="pp-pagesize"
          value={pageSize}
          onChange={onPageSizeChange}
          options={PAGE_SIZES.map((n) => ({ value: n, label: `${n} / page` }))}
          popupMatchSelectWidth={120}
          size="small"
        />
      </div>
    </div>
  );
}

/**
 * One row of an action menu: icon, what it is, what it does.
 *
 * The description is not decoration — "Archive" and "Delete" look alike in a
 * list of verbs, and the line underneath is what tells you which one keeps the
 * documents already raised from it.
 */
export function menuLabel(
  icon: React.ReactNode,
  title: string,
  description: string,
  tint?: string
): React.ReactNode {
  return (
    <div className="tl-menu-item">
      <span
        className="tl-menu-ic"
        style={tint ? { color: tint, background: `${tint}1f` } : undefined}
      >
        {icon}
      </span>
      <span className="tl-menu-text">
        <span className="tl-menu-title">{title}</span>
        <span className="tl-menu-desc">{description}</span>
      </span>
    </div>
  );
}
