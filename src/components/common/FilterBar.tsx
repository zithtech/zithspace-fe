"use client";

import React from "react";
import { Button, Space } from "antd";
import {
  FilterOutlined,
  ExpandAltOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import TicketFilterPill, {
  FilterPillOption,
  initialsFor,
  avatarColorFor,
} from "@/components/projects/TicketFilterPill";

export { TicketFilterPill, initialsFor, avatarColorFor };
export type { FilterPillOption };

/* ==========================================================================
   FilterToggleButton
   - Renders the compact toggle button group (Filters (count) + expand icon)
   ========================================================================== */
export interface FilterToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  activeCount?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  showExpandButton?: boolean;
  disabled?: boolean;
}

export const FilterToggleButton: React.FC<FilterToggleButtonProps> = ({
  isOpen,
  onToggle,
  activeCount = 0,
  label = "Filters",
  className = "",
  style,
  showExpandButton = true,
  disabled = false,
}) => {
  const hasActive = activeCount > 0;

  return (
    <Space.Compact className={`ticket-filter-group ${className}`} style={style}>
      <Button
        icon={<FilterOutlined />}
        className={hasActive ? "saas-tag-blue" : ""}
        style={{
          height: 32,
          fontWeight: 600,
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
        onClick={onToggle}
        disabled={disabled}
      >
        {label} {hasActive && `(${activeCount})`}
      </Button>
      {showExpandButton && (
        <Button
          icon={<ExpandAltOutlined />}
          style={{ height: 32 }}
          aria-label={isOpen ? "Collapse filters" : "Expand filters"}
          title={isOpen ? "Collapse filters" : "Expand filters"}
          onClick={onToggle}
          disabled={disabled}
        />
      )}
    </Space.Compact>
  );
};

/* ==========================================================================
   FilterBar (Inline Filter Row)
   - Renders the unified filter bar with count badge, pill list, reset, and close
   ========================================================================== */
export interface FilterBarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onReset?: () => void;
  activeCount?: number;
  label?: string;
  icon?: React.ReactNode;
  showCount?: boolean;
  resetText?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  pillsClassName?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  isOpen = true,
  onClose,
  onReset,
  activeCount = 0,
  label = "Filters",
  icon = <FilterOutlined style={{ fontSize: 11 }} />,
  showCount = true,
  resetText = "Reset",
  children,
  actions,
  className = "",
  style,
  pillsClassName = "",
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={`tl-filter-row ${className}`} style={style}>
        {/* Left: Section Label & Count */}
        <div className="tl-filter-row-label">
          {icon}
          <span>{label}</span>
          {showCount && (
            <span className="tl-filter-row-count">{activeCount}</span>
          )}
        </div>

        {/* Center: Filter Pills & Inputs */}
        <div className={`tl-filter-row-pills ${pillsClassName}`}>
          {children}
        </div>

        {/* Right: Reset & Close actions */}
        <div className="tl-filter-row-actions">
          {actions}

          {onReset && activeCount > 0 && (
            <button
              type="button"
              className="tl-filter-row-reset"
              onClick={onReset}
            >
              <ReloadOutlined style={{ fontSize: 10 }} />
              {resetText}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              className="tl-filter-row-close"
              onClick={onClose}
              aria-label="Close filters"
              title="Close filters"
            >
              <CloseOutlined style={{ fontSize: 10 }} />
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px;
          background: var(--bg-slate-50, #f8fafc);
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          flex-shrink: 0;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        [data-theme="dark"] .tl-filter-row {
          background: #111720 !important;
          border-bottom-color: #1f2937 !important;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-500, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        [data-theme="dark"] .tl-filter-row-label {
          color: #94a3b8 !important;
        }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-300, #cbd5e1);
          color: var(--text-slate-600, #475569);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        [data-theme="dark"] .tl-filter-row-count {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #f1f5f9 !important;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .tl-filter-row-actions {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tl-filter-row-reset {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: 1px dashed var(--border-slate-300, #cbd5e1);
          border-radius: 6px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-500, #64748b);
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.45);
          background: rgba(59, 130, 246, 0.06);
          border-style: solid;
        }
        [data-theme="dark"] .tl-filter-row-reset {
          border-color: #334155;
          color: #94a3b8;
        }
        [data-theme="dark"] .tl-filter-row-reset:hover {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.12);
          border-color: #3b82f6;
        }
        .tl-filter-row-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 6px;
          color: var(--text-slate-500, #64748b);
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-close:hover {
          color: var(--text-slate-900, #0f172a);
          background: var(--bg-pure-white, #ffffff);
          border-color: var(--border-slate-400, #94a3b8);
        }
        [data-theme="dark"] .tl-filter-row-close {
          border-color: #1f2937;
          color: #94a3b8;
        }
        [data-theme="dark"] .tl-filter-row-close:hover {
          color: #f1f5f9;
          background: #1e293b;
          border-color: #475569;
        }
        .saas-tag-blue {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border-color: #bfdbfe !important;
        }
        [data-theme="dark"] .saas-tag-blue {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
      `}</style>
    </>
  );
};

export default FilterBar;
