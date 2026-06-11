"use client";

import React from "react";
import { Switch, Typography } from "antd";
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  UserOutlined,
  InboxOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/utils/ticketUtils";
import TicketFilterPill from "./TicketFilterPill";

const { Text } = Typography;

interface FilterState {
  status: string[];
  priority: string[];
  assignee: string[];
  type?: string[];
  showArchived?: boolean;
}

interface TicketFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  members: Array<{ value: string; label: string; position?: string; avatarUrl?: string | null }>;
  onReset?: () => void;
  showArchivedToggle?: boolean;
  statusOptions?: { label: string; value: string }[];
  priorityOptions?: { label: string; value: string }[];
  typeOptions?: { label: string; value: string }[];
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onFilterChange,
  members,
  onReset,
  showArchivedToggle = false,
  statusOptions = STATUS_OPTIONS,
  priorityOptions = PRIORITY_OPTIONS,
  typeOptions = TYPE_OPTIONS,
}) => {
  const activeCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.assignee?.length || 0) +
    (filters.type?.length || 0) +
    (filters.showArchived ? 1 : 0);

  const memberOptions = members.map((m) => ({
    label: m.label,
    value: m.value,
    description: m.position || undefined,
    avatarUrl: m.avatarUrl || null,
  }));

  return (
    <div className="tf-panel">
      <style dangerouslySetInnerHTML={{ __html: TICKET_FILTERS_CSS }} />

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
            <CheckCircleOutlined className="tf-row-icon" />
            <span>Status</span>
          </div>
          <TicketFilterPill
            label="Status"
            values={filters.status || []}
            options={statusOptions}
            onChange={(val) => onFilterChange("status", val)}
            placeholder="Any"
            itemNoun="statuses"
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
            values={filters.priority || []}
            options={priorityOptions}
            onChange={(val) => onFilterChange("priority", val)}
            placeholder="Any"
            itemNoun="priorities"
            width={260}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <AppstoreOutlined className="tf-row-icon" />
            <span>Type</span>
          </div>
          <TicketFilterPill
            label="Type"
            values={filters.type || []}
            options={typeOptions}
            onChange={(val) => onFilterChange("type", val)}
            placeholder="Any"
            itemNoun="types"
            width={260}
          />
        </div>

        <div className="tf-row">
          <div className="tf-row-label">
            <UserOutlined className="tf-row-icon" />
            <span>Assignee</span>
          </div>
          <TicketFilterPill
            label="Assignee"
            values={filters.assignee || []}
            options={memberOptions}
            onChange={(val) => onFilterChange("assignee", val)}
            placeholder="All members"
            itemNoun="members"
            width={290}
            showAvatar
            searchPlaceholder="Search people..."
          />
        </div>

        {showArchivedToggle && (
          <>
            <div className="tf-divider" />
            <div className={`tf-toggle ${filters.showArchived ? "is-on" : ""}`}>
              <div className="tf-toggle-label">
                <InboxOutlined className="tf-row-icon" />
                <div>
                  <div className="tf-toggle-title">Show archived</div>
                  <div className="tf-toggle-sub">Include tickets moved out of the active board</div>
                </div>
              </div>
              <Switch
                size="small"
                checked={filters.showArchived}
                onChange={(checked) => onFilterChange("showArchived", checked)}
              />
            </div>
          </>
        )}
      </div>

      <div className="tf-foot">
        <Text className="tf-foot-hint">
          {activeCount === 0
            ? "No filters applied — showing all tickets."
            : `${activeCount} filter${activeCount === 1 ? "" : "s"} active.`}
        </Text>
      </div>
    </div>
  );
};

export default TicketFilters;

const TICKET_FILTERS_CSS = `
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

.tf-divider {
  height: 1px;
  background: var(--border-slate-200);
  margin: 4px -14px;
}
[data-theme='dark'] .tf-divider { background: #1f2937; }

/* Show-archived toggle */
.tf-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg-slate-50);
  border: 1px solid var(--border-slate-200);
  border-radius: 8px;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.tf-toggle.is-on {
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.25);
}
[data-theme='dark'] .tf-toggle {
  background: #111720;
  border-color: #2d3748;
}
[data-theme='dark'] .tf-toggle.is-on {
  background: rgba(59,130,246,0.14);
  border-color: rgba(59,130,246,0.35);
}
.tf-toggle-label {
  display: inline-flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
}
.tf-toggle-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-slate-900);
  letter-spacing: -0.005em;
}
[data-theme='dark'] .tf-toggle-title { color: #f1f5f9; }
.tf-toggle-sub {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-slate-500);
  margin-top: 1px;
}
[data-theme='dark'] .tf-toggle-sub { color: #94a3b8; }

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
