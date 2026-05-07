"use client";

import React, { useState } from "react";
import { Avatar, Dropdown, Tooltip, message, Select } from "antd";
import {
  MoreHorizontal,
  Link as LinkIcon,
  Plus,
  Archive,
} from "lucide-react";
import type {
  BugListItem,
  BugSeverity,
  BugStatus,
} from "@/services/bugListService";
import { useTicketDrawer } from "@/context/TicketDrawerContext";

const SEVERITY_DOT: Record<BugSeverity, string> = {
  blocker: "#ff4d6d",
  critical: "#ff5a4e",
  major: "#f59f3b",
  minor: "#e6c84d",
};

const SEVERITY_FG: Record<BugSeverity, string> = {
  blocker: "#ff8aa1",
  critical: "#ff8a7d",
  major: "#f9bd6c",
  minor: "#f0d97c",
};

// Display layer: collapse the 5 raw statuses into the 3 the user-facing table shows.
// new → New · converted/verified/reopened → Ticket created · ignored → Ignored
type DisplayStatus = "new" | "ticket-created" | "ignored";

function toDisplayStatus(s: BugStatus): DisplayStatus {
  if (s === "new") return "new";
  if (s === "ignored") return "ignored";
  return "ticket-created";
}

const STATUS_DOT: Record<DisplayStatus, string> = {
  new: "#9aa1ac",
  "ticket-created": "#3fbf8f",
  ignored: "#6b7280",
};

const STATUS_FG: Record<DisplayStatus, string> = {
  new: "#cbd0d9",
  "ticket-created": "#5fd7af",
  ignored: "#9ba1ac",
};

const STATUS_LABEL: Record<DisplayStatus, string> = {
  new: "New",
  "ticket-created": "Ticket created",
  ignored: "Ignored",
};

const BUG_STATUS_OPTIONS = [
  { value: "not started", label: "Not Started" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const BUG_STATUS_COLORS: Record<string, { dot: string; fg: string }> = {
  "not started": { dot: "#9aa1ac", fg: "#cbd0d9" },
  pending: { dot: "#f59f3b", fg: "#f9bd6c" },
  completed: { dot: "#3fbf8f", fg: "#5fd7af" },
};

function formatRelative(iso: string | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

function formatAbsolute(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface HivebugTableProps {
  bugs: BugListItem[];
  loading?: boolean;
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (bug: BugListItem) => void;
  onCreateTicket: (bug: BugListItem) => void;
  onVerify: (bug: BugListItem) => void;
  onReopen: (bug: BugListItem) => void;
  onIgnore: (bug: BugListItem) => void;
  onDelete: (bug: BugListItem) => void;
  onRestore: (bug: BugListItem) => void;
  onArchive: (bug: BugListItem) => void;
  onBugStatusUpdate?: (bugId: string, bugStatus: "not started" | "pending" | "completed") => void;
  isTrashView?: boolean;
  isArchiveView?: boolean;
}

export default function HivebugTable({
  bugs,
  loading,
  selectedIds,
  onToggleAll,
  onToggle,
  onEdit,
  onCreateTicket,
  onVerify,
  onReopen,
  onIgnore,
  onDelete,
  onRestore,
  onArchive,
  onBugStatusUpdate,
  isTrashView,
  isArchiveView,
}: HivebugTableProps) {
  const selectableBugs = bugs.filter((b) => !b.ticketId);
  const allChecked =
    selectableBugs.length > 0 &&
    selectableBugs.every((b) => selectedIds.has(b.id));
  const someChecked =
    selectableBugs.some((b) => selectedIds.has(b.id)) && !allChecked;

  return (
    <div className="hb-table-wrapper">
      <table className="hb-table">
        <thead>
          <tr>
            <th className="hb-th-check">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked;
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </th>
            <th>TITLE</th>
            <th style={{ width: 110 }}>SEVERITY</th>
            <th style={{ width: 120 }}>STATUS</th>
            <th style={{ width: 120 }}>BUG STATUS</th>
            <th style={{ width: 150 }}>ASSIGNEE</th>
            <th style={{ width: 160 }}>CREATED</th>
            <th style={{ width: 100 }}>UPDATED</th>
            <th style={{ width: 120 }}>TICKET</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading && bugs.length === 0 && (
            <tr>
              <td colSpan={8} className="hb-empty">
                Loading…
              </td>
            </tr>
          )}
          {!loading && bugs.length === 0 && (
            <tr>
              <td colSpan={8} className="hb-empty">
                No bugs in this view.
              </td>
            </tr>
          )}
          {bugs.map((bug) => (
            <BugRow
              key={bug.id}
              bug={bug}
              checked={selectedIds.has(bug.id)}
              onToggle={(c) => onToggle(bug.id, c)}
              onEdit={() => onEdit(bug)}
              onCreateTicket={() => onCreateTicket(bug)}
               onVerify={() => onVerify(bug)}
              onReopen={() => onReopen(bug)}
              onIgnore={() => onIgnore(bug)}
              onDelete={() => onDelete(bug)}
              onRestore={() => onRestore(bug)}
              onArchive={() => onArchive(bug)}
              onBugStatusUpdate={onBugStatusUpdate}
              isTrashView={isTrashView}
              isArchiveView={isArchiveView}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface BugRowProps {
  bug: BugListItem;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onCreateTicket: () => void;
  onVerify: () => void;
  onReopen: () => void;
  onIgnore: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onArchive: () => void;
  onBugStatusUpdate?: (bugId: string, bugStatus: "not started" | "pending" | "completed") => void;
  isTrashView?: boolean;
  isArchiveView?: boolean;
}

function BugRow({
  bug,
  checked,
  onToggle,
  onEdit,
  onCreateTicket,
  onVerify,
  onReopen,
  onIgnore,
  onDelete,
  onRestore,
  onArchive,
  onBugStatusUpdate,
  isTrashView,
  isArchiveView,
}: BugRowProps) {
  const { open: openTicketDrawer } = useTicketDrawer();
  const severity = bug.severity;
  const status = toDisplayStatus(bug.status);
  const creatorName = bug.createdBy?.name || "Unknown";
  const creatorId = bug.createdBy?.id || bug.createdById;
  const ticketLinked = !!bug.ticketId;

  return (
    <tr className="hb-tr" onClick={onEdit}>
      <td className="hb-td-check" onClick={(e) => e.stopPropagation()}>
        <Tooltip
          title={ticketLinked ? "Already linked to a ticket" : ""}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              if (ticketLinked) {
                message.info("Ticket already created");
              } else {
                onToggle(e.target.checked);
              }
            }}
          />
        </Tooltip>
      </td>
      <td>
        <div className="hb-title-cell">
          <span className="hb-bug-num">
            {bug.bugNumber || `BUG-${bug.id.slice(-3).toUpperCase()}`}
          </span>
          <span className="hb-bug-title" title={bug.title || bug.description}>
            {bug.title || bug.description}
          </span>
        </div>
      </td>
      <td>
        {severity ? (
          <Pill
            label={cap(severity)}
            dot={SEVERITY_DOT[severity]}
            fg={SEVERITY_FG[severity]}
          />
        ) : (
          <span className="hb-muted">—</span>
        )}
      </td>
      <td>
        <Pill
          label={STATUS_LABEL[status]}
          dot={STATUS_DOT[status]}
          fg={STATUS_FG[status]}
        />
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <BugStatusDropdown
          currentStatus={bug.bugStatus || "not started"}
          onUpdate={(value) => onBugStatusUpdate?.(bug.id, value)}
          canEdit={!!onBugStatusUpdate}
        />
      </td>
      <td>
        {bug.assignee ? (
          <div className="hb-assignee">
            <Avatar
              size={22}
              src={bug.assignee.avatarUrl}
              style={{
                background: avatarColor(bug.assignee.id),
                fontSize: 11,
              }}
            >
              {initials(bug.assignee.name)}
            </Avatar>
            <span>{bug.assignee.name}</span>
          </div>
        ) : (
          <span className="hb-muted">Unassigned</span>
        )}
      </td>
      <td>
        <div className="hb-meta-cell">
          <Avatar
            size={20}
            style={{
              background: avatarColor(creatorId || creatorName),
              fontSize: 10,
            }}
          >
            {initials(creatorName)}
          </Avatar>
          <div className="hb-meta-stack">
            <span className="hb-meta-name" title={creatorName}>
              {creatorName}
            </span>
            <Tooltip title={formatAbsolute(bug.createdAt)}>
              <span className="hb-meta-time">{formatRelative(bug.createdAt)}</span>
            </Tooltip>
          </div>
        </div>
      </td>
      <td>
        <Tooltip title={formatAbsolute(bug.updatedAt)}>
          <span className="hb-meta-time">{formatRelative(bug.updatedAt)}</span>
        </Tooltip>
      </td>
      <td>
        {bug.ticketNumber ? (
          <button
            type="button"
            className="hb-ticket-link"
            onClick={(e) => {
              e.stopPropagation();
              if (bug.ticketId) openTicketDrawer(bug.ticketId);
            }}
          >
            <LinkIcon size={11} />
            {bug.ticketNumber}
          </button>
        ) : (
          <button
            className="hb-create-ticket"
            onClick={(e) => {
              e.stopPropagation();
              onCreateTicket();
            }}
          >
            <Plus size={11} /> Create
          </button>
        )}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: isTrashView
              ? [
                  { key: "restore", label: "Restore" },
                  { type: "divider" as const },
                  { key: "delete", label: "Delete Permanently", danger: true },
                ]
              : isArchiveView
              ? [
                  { key: "restore", label: "Restore from Archive" },
                  { type: "divider" as const },
                  { key: "delete", label: "Delete", danger: true },
                ]
              : [
                  { key: "edit", label: "Edit" },
                  ...(bug.status === "converted" || bug.status === "reopened"
                    ? [
                        { key: "verify", label: "Mark verified" },
                        { key: "reopen", label: "Reopen" },
                      ]
                    : []),
                  {
                    key: "ignore",
                    label: "Ignore",
                    disabled: bug.status === "ignored",
                  },
                  { key: "archive", label: "Archive" },
                  { type: "divider" as const },
                  { key: "delete", label: "Delete", danger: true },
                ],
            onClick: ({ key }) => {
              if (key === "edit") onEdit();
              if (key === "verify") onVerify();
              if (key === "reopen") onReopen();
              if (key === "ignore") onIgnore();
              if (key === "delete") onDelete();
              if (key === "restore") onRestore();
              if (key === "archive") onArchive();
            },
          }}
        >
          <button className="hb-icon-btn">
            <MoreHorizontal size={14} />
          </button>
        </Dropdown>
      </td>
    </tr>
  );
}

function Pill({ label, dot, fg }: { label: string; dot: string; fg: string }) {
  return (
    <span
      className="hb-pill"
      style={{
        color: fg,
        background: `${dot}1a`,
        borderColor: `${dot}33`,
      }}
    >
      <span className="hb-pill-dot" style={{ background: dot }} />
      {label}
    </span>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BugStatusDropdown({ 
  currentStatus, 
  onUpdate, 
  canEdit 
}: { 
  currentStatus: string; 
  onUpdate?: (value: "not started" | "pending" | "completed") => void; 
  canEdit: boolean; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentOption = BUG_STATUS_OPTIONS.find(opt => opt.value === currentStatus);
  const currentColors = BUG_STATUS_COLORS[currentStatus] || BUG_STATUS_COLORS["not started"];

  if (!canEdit) {
    return currentStatus ? (
      <Pill
        label={currentOption?.label || currentStatus}
        dot={currentColors.dot}
        fg={currentColors.fg}
      />
    ) : (
      <span className="hb-muted">—</span>
    );
  }

  return (
    <Dropdown
      trigger={["click"]}
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottomLeft"
      menu={{
        items: BUG_STATUS_OPTIONS.map((option) => ({
          key: option.value,
          label: (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              padding: "4px 8px"
            }}>
              <span 
                style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  background: BUG_STATUS_COLORS[option.value].dot,
                  flexShrink: 0
                }} 
              />
              <span style={{ fontSize: "13px" }}>{option.label}</span>
            </div>
          ),
          onClick: () => {
            onUpdate?.(option.value as "not started" | "pending" | "completed");
            setIsOpen(false);
          },
        })),
        style: {
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      }}
    >
      <button 
        className="hb-bug-status-dropdown"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 8px",
          border: `1px solid ${currentColors.dot}33`,
          borderRadius: "12px",
          background: `${currentColors.dot}1a`,
          color: currentColors.fg,
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.15s ease",
          outline: "none",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${currentColors.dot}66`;
          e.currentTarget.style.background = `${currentColors.dot}26`;
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${currentColors.dot}33`;
          e.currentTarget.style.background = `${currentColors.dot}1a`;
          e.currentTarget.style.transform = "translateY(0)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = `${currentColors.dot}66`;
          e.currentTarget.style.boxShadow = `0 0 0 2px ${currentColors.dot}26`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span 
          style={{ 
            width: "6px", 
            height: "6px", 
            borderRadius: "50%", 
            background: currentColors.dot,
            flexShrink: 0
          }} 
        />
        <span>{currentOption?.label || currentStatus}</span>
        <span style={{ 
          marginLeft: "2px", 
          opacity: 0.7, 
          fontSize: "10px",
          transition: "transform 0.15s ease"
        }}>▼</span>
      </button>
    </Dropdown>
  );
}

function avatarColor(seed: string) {
  const palette = ["#7aa2f7", "#9c80ff", "#f59f3b", "#3fbf8f", "#ff7a8a", "#5fd7af"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
