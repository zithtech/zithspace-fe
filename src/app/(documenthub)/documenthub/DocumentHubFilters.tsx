"use client";

import React from "react";
import { Typography, DatePicker } from "antd";
import {
  ProjectOutlined,
  TagOutlined,
  TeamOutlined,
  CalendarOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import TicketFilterPill from "@/components/projects/TicketFilterPill";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export interface DocumentHubFiltersState {
  filterProjectId?: string;
  filterTicketId?: string;
  selectedUser?: string;
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

interface FilterOption {
  value: string;
  label: string;
  description?: string;
  avatarUrl?: string | null;
}

interface DocumentHubFiltersProps {
  filters: DocumentHubFiltersState;
  onFilterChange: (key: keyof DocumentHubFiltersState, value: any) => void;
  onReset?: () => void;
  projectOptions: FilterOption[];
  ticketOptions: FilterOption[];
  memberOptions: FilterOption[];
  projectsLoading?: boolean;
  ticketsLoading?: boolean;
  membersLoading?: boolean;
}

/**
 * The Filters popover for Document Hub — the same panel shape the Ticket List
 * and the QA lists use. These four used to live in the left rail; the rail now
 * keeps only navigation.
 */
const DocumentHubFilters: React.FC<DocumentHubFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  projectOptions,
  ticketOptions,
  memberOptions,
}) => {
  const activeCount =
    (filters.filterProjectId ? 1 : 0) +
    (filters.filterTicketId ? 1 : 0) +
    (filters.selectedUser ? 1 : 0) +
    (filters.dateRange && (filters.dateRange[0] || filters.dateRange[1]) ? 1 : 0);

  return (
    <div className="tf-panel">
      <style dangerouslySetInnerHTML={{ __html: DH_FILTERS_CSS }} />

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
            value={filters.filterProjectId || ""}
            options={projectOptions}
            onChange={(val) => onFilterChange("filterProjectId", val)}
            placeholder="Any"
            itemNoun="projects"
            width={220}
            multiple={false}
            searchPlaceholder="Search by name or code"
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <TagOutlined className="tf-row-icon" />
            <span>Ticket</span>
          </div>
          <TicketFilterPill
            label="Ticket"
            value={filters.filterTicketId || ""}
            options={ticketOptions}
            onChange={(val) => onFilterChange("filterTicketId", val)}
            placeholder="Any"
            itemNoun="tickets"
            width={260}
            multiple={false}
            searchPlaceholder="Search by number or title"
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <TeamOutlined className="tf-row-icon" />
            <span>Created by</span>
          </div>
          <TicketFilterPill
            label="Created by"
            value={filters.selectedUser || ""}
            options={memberOptions}
            onChange={(val) => onFilterChange("selectedUser", val)}
            placeholder="Anyone"
            itemNoun="people"
            width={220}
            showAvatar
            multiple={false}
            searchPlaceholder="Search by name"
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <CalendarOutlined className="tf-row-icon" />
            <span>Date</span>
          </div>
          <RangePicker
            size="small"
            className="premium-range-picker"
            value={(filters.dateRange as any) ?? null}
            onChange={(v) => onFilterChange("dateRange", v)}
            format="DD MMM YYYY"
            allowEmpty={[true, true]}
            style={{ fontSize: 12 }}
          />
        </div>
      </div>

      <div className="tf-foot">
        <Text className="tf-foot-hint">
          {activeCount === 0
            ? "No filters applied — showing every hub."
            : `${activeCount} filter${activeCount === 1 ? "" : "s"} active.`}
        </Text>
      </div>
    </div>
  );
};

export default DocumentHubFilters;

const DH_FILTERS_CSS = `
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
