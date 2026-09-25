'use client';

import React from 'react';

export interface StatCardCell {
  label?: React.ReactNode;
  title?: React.ReactNode;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  tint?: string;
  key?: string | number;
  hint?: React.ReactNode;
}

export interface StatCardsProps {
  cells?: StatCardCell[];
  cards?: any[];
  title?: string;
  statusText?: string;
  statusColor?: string;
  statusBorder?: string;
  progressPct?: string | number;
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  dotColor?: string;
}

export function StatCards({
  cells,
  cards,
  title = "Overview",
  statusText = "ACTIVE",
  statusColor = "#10b981",
  statusBorder = "rgba(16, 185, 129, 0.32)",
  progressPct,
  extra,
  className = "",
  style,
  dotColor = "#3b82f6",
}: StatCardsProps) {
  const displayItems = cells || cards || [];

  // Calculate or parse progress percentage safely
  const { pctNumber, pctString } = React.useMemo(() => {
    if (progressPct !== undefined && progressPct !== null && progressPct !== "") {
      const parsed = typeof progressPct === "number" ? progressPct : parseFloat(String(progressPct));
      if (!isNaN(parsed)) {
        const clamped = Math.min(100, Math.max(0, parsed));
        return { pctNumber: clamped, pctString: `${clamped}%` };
      }
    }

    // If no progressPct provided, compute from items if total/completed are present
    if (displayItems.length > 0) {
      let total = 0;
      let completed = 0;
      let hasTotal = false;
      let hasCompleted = false;

      for (const item of displayItems) {
        const lbl = String(item.label || item.title || "").toLowerCase();
        const rawVal = item.value;
        const numVal = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ""));

        if (!isNaN(numVal)) {
          if (!hasTotal && (lbl.includes("total") || lbl.includes("all") || lbl.includes("count"))) {
            total = numVal;
            hasTotal = true;
          } else if (
            lbl.includes("completed") ||
            lbl.includes("paid") ||
            lbl.includes("approved") ||
            lbl.includes("active") ||
            lbl.includes("present")
          ) {
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

    // Default to 0% if no data or no total
    return { pctNumber: 0, pctString: "0%" };
  }, [progressPct, displayItems]);

  return (
    <div className={`common-sprint-header-v2 ${className}`} style={style}>
      <style jsx global>{`
        .common-sprint-header-v2 {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 24px;
          background: var(--bg-slate-50, #f8fafc);
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          margin-bottom: 0px;
          flex-shrink: 0;
        }
        .common-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .common-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .common-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .common-sprint-title {
          font-size: 13.5px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900, #0f172a) !important;
          letter-spacing: -0.01em;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .common-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .common-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 4px;
          border: 1px solid transparent;
          text-transform: uppercase;
          line-height: 1;
        }
        .common-sprint-tag-active {
          background: transparent;
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .common-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-left: 15px;
        }
        .common-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500, #64748b);
          letter-spacing: -0.005em;
        }
        .common-sprint-meta b {
          color: var(--text-slate-900, #0f172a);
          font-weight: 800;
        }
        .common-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .common-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px;
          background: var(--bg-slate-100, #f1f5f9);
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        .common-sprint-progress-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .common-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-slate-900, #0f172a);
          font-variant-numeric: tabular-nums;
          min-width: 36px;
        }
      `}</style>
      <div className="common-sprint-row1">
        <div className="common-sprint-title-block">
          <div
            className="common-sprint-dot"
            style={{
              background: dotColor,
              boxShadow: `0 0 0 3px ${dotColor}33`,
            }}
          />
          <h2 className="common-sprint-title">{title}</h2>
          {statusText && (
            <div className="common-sprint-tags">
              <span
                className="common-sprint-tag common-sprint-tag-active"
                style={{
                  color: statusColor,
                  borderColor: statusBorder || `${statusColor}55`,
                }}
              >
                {statusText}
              </span>
            </div>
          )}
        </div>
        {extra && <div className="common-sprint-extra">{extra}</div>}
      </div>
      <div className="common-sprint-row2">
        {displayItems.map((c: any, i: number) => {
          const itemLabel = c.label || c.title || '';
          const itemVal = c.value ?? 0;
          return (
            <div key={c.key || i} className="common-sprint-meta">
              {c.icon && (
                <span style={{ color: c.color, display: 'inline-flex', alignItems: 'center' }}>
                  {c.icon}
                </span>
              )}
              <span>
                {itemLabel}: <b>{itemVal}</b>
              </span>
              {c.hint && (
                <span style={{ color: 'var(--text-slate-400)', marginLeft: 4, fontWeight: 400 }}>
                  {c.hint}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="common-sprint-row3">
        <div className="common-sprint-progress-bar">
          <div
            className="common-sprint-progress-fill"
            style={{ width: `${pctNumber}%` }}
          />
        </div>
        <div className="common-sprint-progress-pct">{pctString}</div>
      </div>
    </div>
  );
}

export default StatCards;

