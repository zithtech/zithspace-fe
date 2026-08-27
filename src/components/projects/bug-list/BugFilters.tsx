"use client";

import React from "react";
import { Switch, Typography, DatePicker } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  UserOutlined,
  ReloadOutlined,
  FilterOutlined,
  FolderOutlined,
  ApartmentOutlined,
  LinkOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import TicketFilterPill from "../TicketFilterPill";
import type { FilterPillOption } from "../TicketFilterPill";

const { Text } = Typography;

export interface BugFilterState {
  search?: string;
  severity?: string;
  bugStatus?: string;
  bugType?: string;
  module?: string;
  assigneeId?: string;
  createdById?: string;
  ticketStatus?: string;
  createdRange?: [any, any] | null;
  updatedRange?: [any, any] | null;
}

interface BugFiltersProps {
  filters: BugFilterState;
  onFilterChange: (key: keyof BugFilterState, value: any) => void;
  onReset?: () => void;

  // Options
  folders?: FilterPillOption[];
  sheets?: FilterPillOption[];
  selectedFolderId?: string | null;
  selectedSheetId?: string | null;
  onFolderChange?: (id: string | null) => void;
  onSheetChange?: (id: string | null) => void;

  members?: FilterPillOption[];
  severityOptions?: FilterPillOption[];
  statusOptions?: FilterPillOption[];
  typeOptions?: FilterPillOption[];
  moduleOptions?: FilterPillOption[];
  ticketStatusOptions?: FilterPillOption[];
}

export const BugFilters: React.FC<BugFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  folders = [],
  sheets = [],
  selectedFolderId,
  selectedSheetId,
  onFolderChange,
  onSheetChange,
  members = [],
  severityOptions = [],
  statusOptions = [],
  typeOptions = [],
  moduleOptions = [],
  ticketStatusOptions = [],
}) => {
  const activeCount =
    (filters.severity ? 1 : 0) +
    (filters.bugStatus ? 1 : 0) +
    (filters.bugType ? 1 : 0) +
    (filters.module ? 1 : 0) +
    (filters.assigneeId ? 1 : 0) +
    (filters.createdById ? 1 : 0) +
    (filters.ticketStatus ? 1 : 0) +
    (selectedFolderId ? 1 : 0) +
    (selectedSheetId ? 1 : 0);

  return (
    <div className="tf-panel">
      <style dangerouslySetInnerHTML={{ __html: BUG_FILTERS_CSS }} />

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
        {onFolderChange && (
          <div className="tf-row">
            <div className="tf-row-label">
              <FolderOutlined className="tf-row-icon" />
              <span>Folder</span>
            </div>
            <TicketFilterPill
              label="Folder"
              value={selectedFolderId || ""}
              options={folders}
              onChange={(val) => {
                if (Array.isArray(val)) val = val[0];
                onFolderChange(val || null);
              }}
              placeholder="All folders"
              itemNoun="folders"
              width={260}
              multiple={false}
            />
          </div>
        )}

        {onSheetChange && (
          <div className="tf-row">
            <div className="tf-row-label">
              <ApartmentOutlined className="tf-row-icon" />
              <span>Sheet</span>
            </div>
            <TicketFilterPill
              label="Sheet"
              value={selectedSheetId || ""}
              options={sheets}
              onChange={(val) => {
                if (Array.isArray(val)) val = val[0];
                onSheetChange(val || null);
              }}
              placeholder="All sheets"
              itemNoun="sheets"
              width={260}
              multiple={false}
            />
          </div>
        )}

        <div className="tf-row">
          <div className="tf-row-label">
            <CheckCircleOutlined className="tf-row-icon" />
            <span>Status</span>
          </div>
          <TicketFilterPill
            label="Status"
            value={filters.bugStatus || ""}
            options={statusOptions}
            onChange={(val) => onFilterChange("bugStatus", val)}
            placeholder="Any"
            itemNoun="statuses"
            width={260}
            multiple={false}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <ThunderboltOutlined className="tf-row-icon" />
            <span>Severity</span>
          </div>
          <TicketFilterPill
            label="Severity"
            value={filters.severity || ""}
            options={severityOptions}
            onChange={(val) => onFilterChange("severity", val)}
            placeholder="Any"
            itemNoun="severities"
            width={260}
            multiple={false}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <AppstoreOutlined className="tf-row-icon" />
            <span>Type</span>
          </div>
          <TicketFilterPill
            label="Type"
            value={filters.bugType || ""}
            options={typeOptions}
            onChange={(val) => onFilterChange("bugType", val)}
            placeholder="Any"
            itemNoun="types"
            width={260}
            multiple={false}
          />
        </div>

        {moduleOptions.length > 0 && (
          <div className="tf-row">
            <div className="tf-row-label">
              <AppstoreOutlined className="tf-row-icon" />
              <span>Module</span>
            </div>
            <TicketFilterPill
              label="Module"
              value={filters.module || ""}
              options={moduleOptions}
              onChange={(val) => onFilterChange("module", val)}
              placeholder="Any"
              itemNoun="modules"
              width={260}
              multiple={false}
            />
          </div>
        )}

        <div className="tf-row">
          <div className="tf-row-label">
            <UserOutlined className="tf-row-icon" />
            <span>Assignee</span>
          </div>
          <TicketFilterPill
            label="Assignee"
            value={filters.assigneeId || ""}
            options={members}
            onChange={(val) => onFilterChange("assigneeId", val)}
            placeholder="Anyone"
            itemNoun="members"
            width={290}
            showAvatar
            searchPlaceholder="Search people..."
            multiple={false}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <UserOutlined className="tf-row-icon" />
            <span>Created By</span>
          </div>
          <TicketFilterPill
            label="Created By"
            value={filters.createdById || ""}
            options={members}
            onChange={(val) => onFilterChange("createdById", val)}
            placeholder="Anyone"
            itemNoun="members"
            width={290}
            showAvatar
            searchPlaceholder="Search people..."
            multiple={false}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <LinkOutlined className="tf-row-icon" />
            <span>Ticket</span>
          </div>
          <TicketFilterPill
            label="Ticket Status"
            value={filters.ticketStatus || ""}
            options={ticketStatusOptions}
            onChange={(val) => onFilterChange("ticketStatus", val)}
            placeholder="Any"
            itemNoun="ticket statuses"
            width={260}
            multiple={false}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <CalendarOutlined className="tf-row-icon" />
            <span>Created</span>
          </div>
          <div style={{ flex: 1 }}>
            <RangePicker
              size="small"
              style={{ width: "100%", borderRadius: 6 }}
              value={filters.createdRange ? [dayjs(filters.createdRange[0]), dayjs(filters.createdRange[1])] : null}
              onChange={(dates) => onFilterChange("createdRange", dates ? [dates[0]?.toDate(), dates[1]?.toDate()] : null)}
            />
          </div>
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <CalendarOutlined className="tf-row-icon" />
            <span>Updated</span>
          </div>
          <div style={{ flex: 1 }}>
            <RangePicker
              size="small"
              style={{ width: "100%", borderRadius: 6 }}
              value={filters.updatedRange ? [dayjs(filters.updatedRange[0]), dayjs(filters.updatedRange[1])] : null}
              onChange={(dates) => onFilterChange("updatedRange", dates ? [dates[0]?.toDate(), dates[1]?.toDate()] : null)}
            />
          </div>
        </div>
      </div>

      <div className="tf-foot">
        <Text className="tf-foot-hint">
          {activeCount === 0
            ? "No filters applied — showing all bugs."
            : `${activeCount} filter${activeCount === 1 ? "" : "s"} active.`}
        </Text>
      </div>
    </div>
  );
};

export default BugFilters;

const BUG_FILTERS_CSS = `
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
  max-height: 400px;
  overflow-y: auto;
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
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-slate-700);
  flex-shrink: 0;
  width: 85px;
}
[data-theme='dark'] .tf-row-label { color: #cbd5e1; }
.tf-row-icon {
  font-size: 11px;
  color: var(--text-slate-400);
}
[data-theme='dark'] .tf-row-icon { color: #64748b; }

.tf-divider {
  height: 1px;
  background: var(--border-slate-200);
  margin: 4px -14px;
}
[data-theme='dark'] .tf-divider { background: #1f2937; }

/* Foot */
.tf-foot {
  padding: 10px 14px;
  background: var(--bg-slate-50);
  border-top: 1px solid var(--border-slate-200);
  text-align: center;
}
[data-theme='dark'] .tf-foot {
  background: #111720;
  border-top-color: #1f2937;
}
.tf-foot-hint {
  font-size: 10.5px;
  color: var(--text-slate-400);
  font-weight: 500;
}
[data-theme='dark'] .tf-foot-hint { color: #64748b; }

.tf-body::-webkit-scrollbar {
  width: 6px;
}
.tf-body::-webkit-scrollbar-track {
  background: transparent;
}
.tf-body::-webkit-scrollbar-thumb {
  background: var(--border-slate-300);
  border-radius: 3px;
}
[data-theme='dark'] .tf-body::-webkit-scrollbar-thumb {
  background: #475569;
}
`;
