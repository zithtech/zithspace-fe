'use client';

import React from 'react';
import { Tag } from 'antd';

export interface StatCardCell {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  tint?: string;
}

export interface StatCardsProps {
  cells?: StatCardCell[];
  cards?: any[];
  title?: string;
  statusText?: string;
  statusColor?: string;
  statusBorder?: string;
  progressPct?: string;
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCards({
  cells,
  cards,
  title = "Overview",
  statusText = "ACTIVE",
  statusColor = "#34d399",
  statusBorder = "rgba(16, 185, 129, 0.32)",
  progressPct = "100%",
  extra,
  className = "",
  style,
}: StatCardsProps) {
  const displayItems = cells || cards || [];

  return (
    <div className={`common-sprint-header-v2 ${className}`} style={style}>
      <style jsx global>{`
        .common-sprint-header-v2 {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 24px 10px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          margin-bottom: 0px;
          flex-shrink: 0;
        }
        .common-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }
        .common-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .common-sprint-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .common-sprint-title {
          font-size: 13px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .common-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .common-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 16px;
          padding: 0 4px;
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
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .common-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding-left: 0px;
          margin-bottom: 4px;
        }
        .common-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
        }
        .common-sprint-meta b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        .common-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-left: 0px;
        }
        .common-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 5px;
          background: var(--bg-slate-100);
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        .common-sprint-progress-fill {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .common-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          min-width: 32px;
        }
      `}</style>
      <div className="common-sprint-row1">
        <div className="common-sprint-title-block">
          <div className="common-sprint-dot" style={{ background: '#3B82F6' }} />
          <h2 className="common-sprint-title">{title}</h2>
          <div className="common-sprint-tags">
            <Tag className="common-sprint-tag common-sprint-tag-active" bordered={false} style={{ color: statusColor, borderColor: statusBorder }}>{statusText}</Tag>
          </div>
        </div>
        {extra && <div className="common-sprint-extra">{extra}</div>}
      </div>
      <div className="common-sprint-row2">
        {displayItems.map((c: any, i: number) => {
          const itemLabel = c.label || c.title || '';
          const itemVal = c.value ?? 0;
          return (
            <div key={c.key || i} className="common-sprint-meta">
              {c.icon && <span style={{ color: c.color }}>{c.icon}</span>}
              <span>{itemLabel}: <b>{itemVal}</b></span>
            </div>
          );
        })}
      </div>
      <div className="common-sprint-row3">
        <div className="common-sprint-progress-bar">
          <div className="common-sprint-progress-fill" style={{ width: progressPct || '100%', background: '#3B82F6' }} />
        </div>
        <div className="common-sprint-progress-pct">{progressPct || '100%'}</div>
      </div>
    </div>
  );
}

export default StatCards;
