"use client";

import React from "react";
import { Typography } from "antd";
import {
  CheckCircleOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import TicketFilterPill from "@/components/projects/TicketFilterPill";

const { Text } = Typography;

export interface SuiteCaseFiltersState {
  typeFilter?: string[];
  priorityFilter?: string[];
  statusFilter?: string[];
}

interface SuiteCaseFiltersProps {
  filters: SuiteCaseFiltersState;
  onFilterChange: (key: keyof SuiteCaseFiltersState, value: any) => void;
  onReset?: () => void;
  typeOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
}

/**
 * The Filters popover for a suite's linked test cases — matching the Ticket List
 * and Scenario filters layout.
 */
const SuiteCaseFilters: React.FC<SuiteCaseFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  typeOptions,
  priorityOptions,
  statusOptions,
}) => {
  const activeCount =
    (filters.typeFilter?.length || 0) +
    (filters.priorityFilter?.length || 0) +
    (filters.statusFilter?.length || 0);

  return (
    <div className="tf-panel">
      <style dangerouslySetInnerHTML={{ __html: SUITE_CASE_FILTERS_CSS }} />

      {/* Header */}
      <div className="tf-head">
        <div className="tf-head-title">
          <FilterOutlined style={{ fontSize: 12 }} />
          <span>View Filters</span>
          <span className="tf-head-count">{activeCount}</span>
        </div>
        {activeCount > 0 && onReset && (
          <button type="button" className="tf-reset" onClick={onReset}>
            <ReloadOutlined style={{ fontSize: 10 }} />
            Reset
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="tf-body">
        <div className="tf-row">
          <div className="tf-row-label">
            <AppstoreOutlined className="tf-row-icon" />
            <span>Test Type</span>
          </div>
          <TicketFilterPill
            label="Test Type"
            values={filters.typeFilter || []}
            options={typeOptions}
            onChange={(val) => onFilterChange("typeFilter", val)}
            itemNoun="types"
            width={260}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <ThunderboltOutlined className="tf-row-icon" />
            <span>Priority</span>
          </div>
          <TicketFilterPill
            label="Priority"
            values={filters.priorityFilter || []}
            options={priorityOptions}
            onChange={(val) => onFilterChange("priorityFilter", val)}
            itemNoun="levels"
            width={260}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <CheckCircleOutlined className="tf-row-icon" />
            <span>Status</span>
          </div>
          <TicketFilterPill
            label="Status"
            values={filters.statusFilter || []}
            options={statusOptions}
            onChange={(val) => onFilterChange("statusFilter", val)}
            itemNoun="statuses"
            width={260}
          />
        </div>
      </div>

      <div className="tf-foot">
        <Text className="tf-foot-hint">
          {activeCount === 0
            ? "No filters applied — showing all linked cases."
            : `${activeCount} filter${activeCount === 1 ? "" : "s"} active.`}
        </Text>
      </div>
    </div>
  );
};

export default SuiteCaseFilters;

const SUITE_CASE_FILTERS_CSS = `
/* Make Ant's Popover wrapper invisible — the panel draws its own border */
.tf-popover-overlay .ant-popover-inner {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 12px !important;
}
.tf-popover-overlay .ant-popover-arrow { display: none !important; }

.tf-panel {
  width: 320px;
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
[data-theme='dark'] .tf-panel {
  background: var(--bg-surface-slate-850);
  border-color: var(--border-slate-700);
}

.tf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-slate-200);
  background: var(--bg-surface-slate-50);
}
[data-theme='dark'] .tf-head {
  background: var(--bg-surface-slate-900);
  border-color: var(--border-slate-700);
}

.tf-head-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-slate-600);
}
[data-theme='dark'] .tf-head-title { color: var(--text-slate-300); }

.tf-head-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: #3b82f6;
  color: #fff;
}

.tf-reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-slate-500);
  background: transparent;
  border: 0;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tf-reset:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.tf-body {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tf-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 2px;
}

.tf-row-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-slate-600);
  min-width: 70px;
}
[data-theme='dark'] .tf-row-label { color: var(--text-slate-300); }

.tf-row-icon {
  font-size: 11px;
  color: var(--text-slate-400);
}

.tf-foot {
  padding: 6px 12px;
  border-top: 1px solid var(--border-slate-200);
  background: var(--bg-surface-slate-50);
}
[data-theme='dark'] .tf-foot {
  background: var(--bg-surface-slate-900);
  border-color: var(--border-slate-700);
}

.tf-foot-hint {
  font-size: 10px !important;
  color: var(--text-slate-400) !important;
}
`;
