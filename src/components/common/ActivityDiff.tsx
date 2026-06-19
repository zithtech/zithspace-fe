"use client";

import { Tag, Typography, Tooltip } from "antd";
import dayjs from "dayjs";
import type { TransactionRow } from "@/services/transactionHistoryService";

const { Text } = Typography;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const MAX_LEN = 60;

const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  bugStatus: "Bug status",
  priority: "Priority",
  type: "Type",
  module: "Module",
  bugType: "Bug type",
  severity: "Severity",
  tags: "Tags",
  comments: "Comments",
  assigneeId: "Assignee",
  reportToId: "Reporter",
  projectId: "Project",
  sprintPlanId: "Sprint",
  releasePlanId: "Release",
  demoPlanId: "Demo plan",
  bucketId: "Bucket",
  folderId: "Folder",
  sheetId: "Sheet",
  storyPoint: "Story points",
  dueDate: "Due date",
  startDate: "Start date",
  endDate: "End date",
  releaseDate: "Release date",
  startedAt: "Started at",
  completedAt: "Completed at",
  completedPoints: "Completed points",
  goal: "Goal",
  version: "Version",
  name: "Name",
  code: "Code",
  color: "Color",
  isShared: "Shared",
  isArchived: "Archived",
  isDeleted: "Deleted",
  is_default: "Default",
  is_active: "Active",
  sort_order: "Sort order",
  isDefault: "Default",
  isActive: "Active",
  sortOrder: "Sort order",
  defaultPriority: "Default priority",
  projectManagerId: "Project manager",
  teamMembers: "Team members",
  label: "Label",
  ticketNumber: "Ticket number",
  folder_id: "Folder",
  sheet_id: "Sheet",
  bug_number: "Bug number",
  bug_type: "Bug type",
  bug_status: "Bug status",
  original_status: "Original status",
  ticket_id: "Ticket",
  assignee_id: "Assignee",
  created_by_id: "Created by",
  parent_entity_id: "Parent",
  user_id: "User",
  role: "Role",
};

function humanizeField(field: string): string {
  if (FIELD_LABEL[field]) return FIELD_LABEL[field];
  return field
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\bId\b$/, "")
    .trim();
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    if (v.every(x => x && typeof x === "object" && ("projectId" in x || "projectName" in x))) {
      return v.map(x => {
        const pId = (x as any).projectId;
        const formattedId = pId && UUID_RE.test(String(pId)) ? String(pId).slice(0, 8) + "…" : String(pId || "");
        const name = (x as any).projectName || formattedId || "Project";
        const hrs = (x as any).hoursWorked !== undefined ? ` (${(x as any).hoursWorked}h)` : "";
        const tasks = Array.isArray((x as any).tasks)
          ? ` [${(x as any).tasks.map((t: any) => {
            const desc = t.ticketNumber ? `${t.ticketNumber}: ${t.ticketTitle || ""}` : t.description || "Task";
            const statusStr = t.status ? ` (${t.status})` : "";
            return `${desc}${statusStr}`;
          }).join("; ")}]`
          : "";
        const blockers = (x as any).blockers ? ` (Blockers: ${(x as any).blockers})` : "";
        const notes = (x as any).notes ? ` (Notes: ${(x as any).notes})` : "";
        return `${name}${hrs}${tasks}${blockers}${notes}`;
      }).join(", ");
    }
    if (v.every(x => x && typeof x === "object" && ("ticketId" in x || "ticketNumber" in x || "description" in x))) {
      return v.map(x => {
        const desc = (x as any).ticketNumber ? `${(x as any).ticketNumber}: ${(x as any).ticketTitle || ""}` : (x as any).description || "Task";
        const statusStr = (x as any).status ? ` [${(x as any).status}]` : "";
        return `${desc}${statusStr}`;
      }).join(", ");
    }
    if (v.length <= 3) return v.map(formatValue).join(", ");
    return `${v.length} items`;
  }
  if (typeof v === "object") {
    const x = v as any;
    if ("projectId" in x || "projectName" in x) {
      const pId = x.projectId;
      const formattedId = pId && UUID_RE.test(String(pId)) ? String(pId).slice(0, 8) + "…" : String(pId || "");
      const name = x.projectName || formattedId || "Project";
      const hrs = x.hoursWorked !== undefined ? ` (${x.hoursWorked}h)` : "";
      const tasks = Array.isArray(x.tasks)
        ? ` [${x.tasks.map((t: any) => {
          const desc = t.ticketNumber ? `${t.ticketNumber}: ${t.ticketTitle || ""}` : t.description || "Task";
          const statusStr = t.status ? ` (${t.status})` : "";
          return `${desc}${statusStr}`;
        }).join("; ")}]`
        : "";
      const blockers = x.blockers ? ` (Blockers: ${x.blockers})` : "";
      const notes = x.notes ? ` (Notes: ${x.notes})` : "";
      return `${name}${hrs}${tasks}${blockers}${notes}`;
    }
    if ("ticketId" in x || "ticketNumber" in x || "description" in x) {
      const desc = x.ticketNumber ? `${x.ticketNumber}: ${x.ticketTitle || ""}` : x.description || "Task";
      const statusStr = x.status ? ` [${x.status}]` : "";
      return `${desc}${statusStr}`;
    }
    try {
      const s = JSON.stringify(v);
      if (s.length > MAX_LEN) return s.slice(0, MAX_LEN) + "…";
      return s;
    } catch {
      return "(object)";
    }
  }
  const s = String(v);
  if (UUID_RE.test(s)) return s.slice(0, 8) + "…";
  if (ISO_DATE_RE.test(s)) return dayjs(s).format("MMM D, YYYY");
  if (s.length > MAX_LEN) return s.slice(0, MAX_LEN) + "…";
  return s;
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

/**
 * Single-field diff rendered inline as one span (no block layout).
 * Used to fold a 1-field UPDATE onto the same line as the action label.
 */
export function InlineDiff({ row, field }: { row: TransactionRow; field: string }) {
  const before = row.beforeData?.[field];
  const after = row.afterData?.[field];
  const beforeStr = formatValue(before);
  const afterStr = formatValue(after);
  const label = humanizeField(field);

  if (isEmpty(before) && !isEmpty(after)) {
    return (
      <>
        <Text type="secondary">{label}: </Text>
        <Text strong>{afterStr}</Text>
      </>
    );
  }
  if (!isEmpty(before) && isEmpty(after)) {
    return (
      <>
        <Text type="secondary">{label}: </Text>
        <Tooltip title={String(before)}>
          <Text delete>{beforeStr}</Text>
        </Tooltip>
        <Text type="secondary"> (cleared)</Text>
      </>
    );
  }
  return (
    <>
      <Text type="secondary">{label}: </Text>
      <Tooltip title={String(before)}>
        <Text type="secondary" style={{ textDecoration: "line-through" }}>
          {beforeStr}
        </Text>
      </Tooltip>
      <Text type="secondary"> → </Text>
      <Tooltip title={String(after)}>
        <Text strong>{afterStr}</Text>
      </Tooltip>
    </>
  );
}

interface Props {
  row: TransactionRow;
  /** Maximum number of diff lines to render inline; rest are hidden with "+N more". */
  maxLines?: number;
}

/**
 * Renders the field-level diff for an UPDATE row in the form:
 *   <field>: <old> → <new>
 *
 * Falls back to nothing if the row isn't an update or has no changed fields
 * the caller cares about. Useful for both the drawer and the global activity page.
 */
export default function ActivityDiff({ row, maxLines = 6 }: Props) {
  const fields = row.changedFields ?? [];
  if (fields.length === 0) return null;

  const visible = fields.slice(0, maxLines);
  const overflow = fields.length - visible.length;

  return (
    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
      {visible.map((field) => {
        const before = row.beforeData?.[field];
        const after = row.afterData?.[field];
        const beforeStr = formatValue(before);
        const afterStr = formatValue(after);

        // For pure creations (no before snapshot) just show "set to X"
        if (isEmpty(before) && !isEmpty(after)) {
          return (
            <div key={field} style={{ fontSize: 12, lineHeight: 1.6 }}>
              <Text type="secondary">{humanizeField(field)}: </Text>
              <Text>{afterStr}</Text>
            </div>
          );
        }

        // For pure clearings (had a value, now empty)
        if (!isEmpty(before) && isEmpty(after)) {
          return (
            <div key={field} style={{ fontSize: 12, lineHeight: 1.6 }}>
              <Text type="secondary">{humanizeField(field)}: </Text>
              <Tooltip title={String(before)}>
                <Text delete>{beforeStr}</Text>
              </Tooltip>
              <Text type="secondary"> (cleared)</Text>
            </div>
          );
        }

        return (
          <div key={field} style={{ fontSize: 12, lineHeight: 1.6 }}>
            <Text type="secondary">{humanizeField(field)}: </Text>
            <Tooltip title={String(before)}>
              <Text type="secondary" style={{ textDecoration: "line-through" }}>
                {beforeStr}
              </Text>
            </Tooltip>
            <Text type="secondary"> → </Text>
            <Tooltip title={String(after)}>
              <Text strong>{afterStr}</Text>
            </Tooltip>
          </div>
        );
      })}
      {overflow > 0 && (
        <Tag style={{ alignSelf: "flex-start", marginTop: 2 }}>+{overflow} more</Tag>
      )}
    </div>
  );
}
