"use client";

import React from "react";
import { Typography } from "antd";
import {
  FolderOutlined,
  ApartmentOutlined,
  LinkOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import TicketFilterPill from "@/components/projects/TicketFilterPill";

const { Text } = Typography;

export interface TestSuiteFiltersState {
  scenarioFilter?: string;
  moduleFilter?: string;
  coverageFilter?: string;
}

interface TestSuiteFiltersProps {
  filters: TestSuiteFiltersState;
  onFilterChange: (key: keyof TestSuiteFiltersState, value: any) => void;
  onReset?: () => void;
  scenarioOptions: { value: string; label: string }[];
  moduleOptions: { value: string; label: string }[];
  coverageOptions: { value: string; label: string }[];
  /** Scenarios are searched server-side — the list holds only the first page. */
  onScenarioSearch?: (term: string) => void;
}

/**
 * The Filters popover for the Test Suites list — the same panel shape the
 * Ticket List and the other QA lists use, so every list filters alike.
 */
const TestSuiteFilters: React.FC<TestSuiteFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  scenarioOptions,
  moduleOptions,
  coverageOptions,
  onScenarioSearch,
}) => {
  const activeCount =
    (filters.scenarioFilter ? 1 : 0) +
    (filters.moduleFilter ? 1 : 0) +
    (filters.coverageFilter ? 1 : 0);

  return (
    <div className="tf-panel">
      <style dangerouslySetInnerHTML={{ __html: SUITE_FILTERS_CSS }} />

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
            <FolderOutlined className="tf-row-icon" />
            <span>Scenario</span>
          </div>
          <TicketFilterPill
            label="Scenario"
            value={filters.scenarioFilter || ""}
            options={scenarioOptions}
            onChange={(val) => onFilterChange("scenarioFilter", val)}
            placeholder="Any"
            itemNoun="scenarios"
            width={240}
            multiple={false}
            searchPlaceholder="Search scenarios..."
            onSearch={onScenarioSearch}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <ApartmentOutlined className="tf-row-icon" />
            <span>Module</span>
          </div>
          <TicketFilterPill
            label="Module"
            value={filters.moduleFilter || ""}
            options={moduleOptions}
            onChange={(val) => onFilterChange("moduleFilter", val)}
            placeholder="Any"
            itemNoun="modules"
            width={220}
            multiple={false}
            searchPlaceholder="Search modules..."
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <LinkOutlined className="tf-row-icon" />
            <span>Coverage</span>
          </div>
          <TicketFilterPill
            label="Coverage"
            value={filters.coverageFilter || ""}
            options={coverageOptions}
            onChange={(val) => onFilterChange("coverageFilter", val)}
            placeholder="Any"
            itemNoun="options"
            width={220}
            multiple={false}
          />
        </div>
      </div>

      <div className="tf-foot">
        <Text className="tf-foot-hint">
          {activeCount === 0
            ? "No filters applied — showing all suites."
            : `${activeCount} filter${activeCount === 1 ? "" : "s"} active.`}
        </Text>
      </div>
    </div>
  );
};

export default TestSuiteFilters;

const SUITE_FILTERS_CSS = `
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
  background: #0f1419;
  border-color: #2d3748;
}

/* Head */
.tf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .tf-head {
  background: #111720;
  border-bottom-color: #1f2937;
}
.tf-head-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-slate-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
[data-theme='dark'] .tf-head-title { color: #94a3b8; }
.tf-head-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  color: var(--text-slate-500);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
}
[data-theme='dark'] .tf-head-count {
  background: #1c232e;
  border-color: #2d3748;
  color: #cbd5e1;
}
.tf-reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  background: transparent;
  border: 1px dashed var(--border-slate-200);
  border-radius: 999px;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 800;
  color: var(--text-slate-500);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.tf-reset:hover {
  color: #1d4ed8;
  border-color: rgba(59,130,246,0.4);
  background: rgba(59,130,246,0.06);
  border-style: solid;
}
[data-theme='dark'] .tf-reset {
  border-color: #2d3748;
  color: #94a3b8;
}

/* Body */
.tf-body {
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tf-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.tf-row-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-slate-700);
  letter-spacing: -0.005em;
  min-width: 0;
}
[data-theme='dark'] .tf-row-label { color: #cbd5e1; }
.tf-row-icon {
  color: var(--text-slate-400);
  font-size: 12px;
}
[data-theme='dark'] .tf-row-icon { color: #64748b; }

/* Foot */
.tf-foot {
  padding: 8px 14px;
  border-top: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .tf-foot {
  border-top-color: #1f2937;
  background: #111720;
}
.tf-foot-hint {
  font-size: 10.5px !important;
  font-weight: 600;
  color: var(--text-slate-500) !important;
  letter-spacing: 0;
}
[data-theme='dark'] .tf-foot-hint { color: #94a3b8 !important; }
`;
