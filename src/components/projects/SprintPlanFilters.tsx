"use client";

import React from "react";
import { Typography } from "antd";
import {
  ProjectOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  NumberOutlined,
  ReloadOutlined,
  FilterOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import TicketFilterPill from "@/components/projects/TicketFilterPill";

const { Text } = Typography;

export interface SprintPlanFiltersState {
  projectId?: string;
  status?: string;
  fromMonth?: string;
  toMonth?: string;
  minTickets?: string;
  maxTickets?: string;
}

interface SprintPlanFiltersProps {
  filters: SprintPlanFiltersState;
  onFilterChange: (key: keyof SprintPlanFiltersState, value: any) => void;
  onReset?: () => void;
  projectOptions: { value: string; label: string; description?: string }[];
  statusOptions: { value: string; label: string }[];
  /** Month values are 'YYYY-MM' strings; the picker speaks dayjs. */
  monthToDayjs: (m: string) => Dayjs;
}

/**
 * The Filters popover for Sprint Plans — the same panel shape the Ticket List
 * and the QA lists use. Project and Status used to live in the left rail; the
 * rail is gone, so they filter from here.
 */
const SprintPlanFilters: React.FC<SprintPlanFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  projectOptions,
  statusOptions,
  monthToDayjs,
}) => {
  const activeCount =
    (filters.projectId ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.fromMonth || filters.toMonth ? 1 : 0) +
    (filters.minTickets || filters.maxTickets ? 1 : 0);

  return (
    <div className="tf-panel">
      <style dangerouslySetInnerHTML={{ __html: SPRINT_FILTERS_CSS }} />

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
            <ProjectOutlined className="tf-row-icon" />
            <span>Project</span>
          </div>
          <TicketFilterPill
            label="Project"
            value={filters.projectId || ""}
            options={projectOptions}
            onChange={(val) => onFilterChange("projectId", val)}
            placeholder="All"
            itemNoun="projects"
            width={240}
            multiple={false}
            searchPlaceholder="Search projects..."
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <AppstoreOutlined className="tf-row-icon" />
            <span>Status</span>
          </div>
          <TicketFilterPill
            label="Status"
            value={filters.status || ""}
            options={statusOptions}
            onChange={(val) => onFilterChange("status", val)}
            placeholder="Any"
            itemNoun="states"
            width={220}
            multiple={false}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <CalendarOutlined className="tf-row-icon" />
            <span>Months</span>
          </div>
          <div className="spf-range">
            <DatePicker
              picker="month"
              size="small"
              allowClear
              format="MMM YY"
              placeholder="From"
              value={filters.fromMonth ? monthToDayjs(filters.fromMonth) : null}
              disabledDate={(d) => !!filters.toMonth && d.isAfter(monthToDayjs(filters.toMonth), "month")}
              onChange={(d) => onFilterChange("fromMonth", d ? d.format("YYYY-MM") : "")}
              style={{ width: 92 }}
            />
            <ArrowRightOutlined className="spf-range-arrow" />
            <DatePicker
              picker="month"
              size="small"
              allowClear
              format="MMM YY"
              placeholder="To"
              value={filters.toMonth ? monthToDayjs(filters.toMonth) : null}
              disabledDate={(d) => !!filters.fromMonth && d.isBefore(monthToDayjs(filters.fromMonth), "month")}
              onChange={(d) => onFilterChange("toMonth", d ? d.format("YYYY-MM") : "")}
              style={{ width: 92 }}
            />
          </div>
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <NumberOutlined className="tf-row-icon" />
            <span>Tickets</span>
          </div>
          <div className="spf-range">
            <input
              className="spf-num"
              type="number"
              min={0}
              placeholder="Min"
              aria-label="Minimum tickets"
              value={filters.minTickets || ""}
              onChange={(e) => onFilterChange("minTickets", e.target.value)}
            />
            <span className="spf-range-arrow">to</span>
            <input
              className="spf-num"
              type="number"
              min={0}
              placeholder="Max"
              aria-label="Maximum tickets"
              value={filters.maxTickets || ""}
              onChange={(e) => onFilterChange("maxTickets", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tf-foot">
        <Text className="tf-foot-hint">
          {activeCount === 0
            ? "No filters applied — showing every sprint."
            : `${activeCount} filter${activeCount === 1 ? "" : "s"} active.`}
        </Text>
      </div>
    </div>
  );
};

export default SprintPlanFilters;

const SPRINT_FILTERS_CSS = `
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

/* Paired inputs — months and the ticket range */
.spf-range { display: inline-flex; align-items: center; gap: 6px; }
.spf-range-arrow { font-size: 10px; color: var(--text-slate-400); font-weight: 600; }
.spf-num {
  width: 62px; height: 24px; padding: 0 8px;
  border: 1px solid var(--border-slate-200); border-radius: 7px;
  background: var(--bg-pure-white); color: var(--text-slate-700);
  font-family: inherit; font-size: 11.5px; font-weight: 600;
}
.spf-num:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
.spf-num::-webkit-outer-spin-button, .spf-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.spf-num[type=number] { -moz-appearance: textfield; }
[data-theme='dark'] .spf-num { background: #111720; border-color: #2d3748; color: #cbd5e1; }
`;
