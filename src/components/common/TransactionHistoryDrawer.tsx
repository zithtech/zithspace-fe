"use client";

import React, { type ReactNode } from "react";
import { Drawer, Button, Tooltip, Avatar } from "antd";
import { History, User, RefreshCw, X, Inbox } from "lucide-react";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UndoOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ActivityDiff, { InlineDiff } from "@/components/common/ActivityDiff";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { TransactionRow } from "@/services/transactionHistoryService";
import { useSocket } from "@/providers/SocketProvider";

dayjs.extend(relativeTime);

/* ─────────────────── Action palette ─────────────────── */
interface ActionStyle {
  color: string;
  bg: string;
  border: string;
  dot: string;
  icon: React.ReactNode;
  label: string;
  zIndex?: number;
}
const GREEN_ICON = <PlusCircleOutlined style={{ fontSize: 13 }} />;
const BLUE_ICON = <EditOutlined style={{ fontSize: 13 }} />;
const RED_ICON = <DeleteOutlined style={{ fontSize: 13 }} />;
const ASH_ICON = <ClockCircleOutlined style={{ fontSize: 13 }} />;

const GREEN = { color: "#047857", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.22)", dot: "#10b981", icon: GREEN_ICON };
const BLUE = { color: "#1d4ed8", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.22)", dot: "#3b82f6", icon: BLUE_ICON };
const RED = { color: "#b91c1c", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)", dot: "#ef4444", icon: RED_ICON };
const ASH = { color: "#475569", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.20)", dot: "#94a3b8", icon: ASH_ICON };

function actionStyle(action: string): ActionStyle {
  let label = action.replace(/_/g, " ");
  label = label.charAt(0).toUpperCase() + label.slice(1);

  if (action === "delete" || action === "permanent_delete") {
    return { ...RED, label };
  }
  if (["create", "restore", "verify", "start", "complete"].includes(action)) {
    const icon = action === "restore" ? <UndoOutlined style={{ fontSize: 13 }} /> : GREEN.icon;
    const resolvedLabel = action === "create" ? "Created" : label;
    return { ...GREEN, icon, label: resolvedLabel };
  }
  if (action.startsWith("bulk_")) {
    return { ...ASH, label };
  }
  if (["update", "status_change", "move", "convert", "generate_ai", "archive", "reopen"].includes(action)) {
    const resolvedLabel = action === "update" ? "Updated" : label;
    return { ...BLUE, label: resolvedLabel };
  }
  return { ...ASH, label };
}

/* ─────────────────── Helpers ─────────────────── */
function dayLabel(d: dayjs.Dayjs): string {
  const diff = dayjs().startOf("day").diff(d.startOf("day"), "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (d.year() === dayjs().year()) return d.format("ddd, MMM D");
  return d.format("MMM D, YYYY");
}

function initials(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  const parts = src.split(/\s+|@/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || src[0].toUpperCase();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const MAX_LEN = 48;

const FIELD_LABELS: Record<string, string> = {
  logoUrl: "Logo", logo_url: "Logo",
  faviconUrl: "Favicon", favicon_url: "Favicon",
  primaryColor: "Primary color", primary_color: "Primary color",
  companyName: "Company name", company_name: "Company name",
  tenantName: "Company name", tenant_name: "Company name",
  website: "Website", address: "Address", phone: "Phone", email: "Email",
  timezone: "Timezone", currency: "Currency",
  dateFormat: "Date format", date_format: "Date format",
  language: "Language", locale: "Locale",
  invoicePrefix: "Invoice prefix", invoice_prefix: "Invoice prefix",
  taxRate: "Tax rate", tax_rate: "Tax rate",
  smtpHost: "SMTP host", smtp_host: "SMTP host",
  smtpPort: "SMTP port", smtp_port: "SMTP port",
  smtpUser: "SMTP user", smtp_user: "SMTP user",
  fromEmail: "From email", from_email: "From email",
  fromName: "From name", from_name: "From name",
  name: "Name", title: "Title", status: "Status", priority: "Priority",
  description: "Description", type: "Type", role: "Role",
  assigneeId: "Assignee", assignee_id: "Assignee",
  storyPoint: "Story points", dueDate: "Due date", startDate: "Start date",
  isActive: "Active", is_active: "Active",
  isArchived: "Archived", isDeleted: "Deleted",
};

function humanField(f: string): string {
  if (FIELD_LABELS[f]) return FIELD_LABELS[f];
  return f.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).replace(/\bId\b$/, "").trim();
}

function isUrl(s: string): boolean {
  try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}

function fmtVal(v: unknown, fieldHint?: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.length === 0 ? "—" : `${v.length} items`;
  if (typeof v === "object") {
    const keys = Object.keys(v as object).filter(k => (v as any)[k] != null && (v as any)[k] !== "");
    if (keys.length === 0) return "—";
    if (keys.length <= 2) return keys.map(k => `${humanField(k)}: ${fmtVal((v as any)[k])}`).join(", ");
    return `${keys.length} fields`;
  }
  const s = String(v);
  // URL: show filename or host
  if (isUrl(s)) {
    const hint = (fieldHint || "").toLowerCase();
    if (hint.includes("logo") || hint.includes("favicon") || hint.includes("url") || hint.includes("image")) {
      try {
        const u = new URL(s);
        const fn = u.pathname.split("/").filter(Boolean).pop() || "";
        if (fn && fn.length <= 36) return fn;
        return u.hostname;
      } catch { /**/ }
    }
    return s.length > MAX_LEN ? s.slice(0, MAX_LEN) + "…" : s;
  }
  // JSON blob
  if (s.trimStart().startsWith("{") || s.trimStart().startsWith("[")) {
    try {
      const p = JSON.parse(s);
      return fmtVal(p, fieldHint);
    } catch { /**/ }
  }
  if (UUID_RE.test(s)) return s.slice(0, 8) + "…";
  if (ISO_DATE_RE.test(s)) return dayjs(s).format("MMM D, YYYY");
  return s.length > MAX_LEN ? s.slice(0, MAX_LEN) + "…" : s;
}

/** Expand a before/after pair that are JSON objects into per-key diff rows */
function expandDiff(field: string, before: unknown, after: unknown): Array<{ key: string; bv: unknown; av: unknown }> | null {
  const toObj = (v: unknown): Record<string, unknown> | null => {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    if (typeof v === "string" && (v.trimStart().startsWith("{") || v.trimStart().startsWith("["))) {
      try { return JSON.parse(v); } catch { /**/ }
    }
    return null;
  };
  const bObj = toObj(before);
  const aObj = toObj(after);
  if (!bObj && !aObj) return null;
  const allKeys = Array.from(new Set([...Object.keys(bObj ?? {}), ...Object.keys(aObj ?? {})]));
  const changed = allKeys.filter(k => JSON.stringify((bObj ?? {})[k]) !== JSON.stringify((aObj ?? {})[k]));
  if (changed.length === 0) return null;
  return changed.slice(0, 8).map(k => ({ key: k, bv: (bObj ?? {})[k], av: (aObj ?? {})[k] }));
}

/* ─────────────────── HistoryRow (flat timeline entry) ───────────────────── */
/**
 * Deliberately card-less: one hairline rail, one avatar per entry, and type set
 * in a strict hierarchy. Colour is carried by a single 7px status dot and the
 * action word — no boxes, borders or shadows competing with the content.
 */
function HistoryRow({ row }: { row: TransactionRow }) {
  const created = dayjs(row.createdAt);
  const st = actionStyle(row.action);
  const singleField =
    row.changedFields && row.changedFields.length === 1 ? row.changedFields[0] : null;
  const displayLabel = singleField
    ? (row.actionLabel || row.action).replace(/\s*\(.*?\)\s*$/, "")
    : row.actionLabel || row.action;

  const actorName = row.actor?.name || row.actor?.email || "System";

  return (
    <div className="thd-item">
      <div className="thd-rail">
        <span className="thd-avatar-wrap">
          <Avatar
            size={24}
            // antd prefers `icon` over children, so only fall back to the glyph
            // when there is no name/email to derive initials from.
            icon={row.actor?.name || row.actor?.email ? undefined : <UserOutlined />}
            src={(row.actor as any)?.avatarUrl || (row.actor as any)?.avatar}
            style={{
              backgroundColor: row.actor?.name ? "rgba(59,130,246,0.12)" : "rgba(100,116,139,0.12)",
              color: row.actor?.name ? "#2563eb" : "#64748b",
              fontSize: 9.5,
              fontWeight: 700,
            }}
          >
            {initials(row.actor?.name, row.actor?.email)}
          </Avatar>
          <Tooltip title={st.label}>
            <span className="thd-status-dot" style={{ background: st.dot }} />
          </Tooltip>
        </span>
      </div>

      <div className="thd-body">
        <div className="thd-row-top">
          <span className="thd-actor">{actorName}</span>
          <span className="thd-action" style={{ color: st.color }}>{st.label}</span>
          <Tooltip title={created.format("MMM D, YYYY · h:mm:ss A")}>
            <span className="thd-time">{created.fromNow()}</span>
          </Tooltip>
        </div>

        <div className="thd-label">{displayLabel}</div>

        {row.action === "update" && (
          <div className="thd-diff">
            {singleField ? (
              <InlineDiff row={row} field={singleField} />
            ) : (
              <ActivityDiff row={row} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Main Drawer ─────────────────── */
export default function TransactionHistoryDrawer({
  open,
  onClose,
  entityType,
  entityId,
  section,
  module,
  title = "Activity history",
  subtitle,
  zIndex = 1000,
}: Props) {
  const { rows, loading, loadingMore, hasMore, error, loadMore, refresh } =
    useTransactionHistory({ entityType, entityId, section, module, enabled: open, limit: 20 });

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !open) return;
    const handler = (row: any) => {
      if (
        (entityType && entityId && row?.entityType === entityType && row?.entityId === entityId) ||
        (!entityId && module && row?.module === module) ||
        (!entityId && !module && section && row?.section === section)
      ) refresh();
    };
    socket.on("transaction:created", handler);
    return () => { socket.off("transaction:created", handler); };
  }, [socket, open, entityType, entityId, section, module, refresh]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      zIndex={zIndex}
      width={520}
      closable={false}
      className="thd-drawer"
      styles={{
        header: { display: "none" },
        body: { padding: 0, display: "flex", flexDirection: "column", background: "var(--bg-pure-white, #fff)" },
      }}
    >
      <style>{styles}</style>

      {/* Header — typographic, no tile or gradient */}
      <header className="thd-head">
        <div className="thd-head-text">
          <div className="thd-eyebrow">
            <History size={12} strokeWidth={2.2} />
            <span>Activity</span>
          </div>
          <div className="thd-head-title-row">
            <span className="thd-head-title">{title}</span>
            {rows.length > 0 && (
              <span className="thd-head-count">{rows.length}{hasMore ? "+" : ""}</span>
            )}
          </div>
          <div className="thd-head-sub">{subtitle || "Chronological record of every change"}</div>
        </div>
        <div className="thd-head-actions">
          <Tooltip title="Refresh">
            <button
              type="button"
              className={`thd-head-btn${loading ? " is-spin" : ""}`}
              onClick={() => refresh()}
              aria-label="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </Tooltip>
          <button type="button" className="thd-head-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="thd-scroll">
        {loading && rows.length === 0 ? (
          <div className="thd-skel-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="thd-skel-item">
                <span className="thd-skel-dot thd-shimmer" />
                <div className="thd-skel-body">
                  <span className="thd-shimmer" style={{ width: "55%", height: 12 }} />
                  <span className="thd-shimmer" style={{ width: "82%", height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="thd-state">
            <span className="thd-state-icon thd-state-icon--err"><User size={20} strokeWidth={1.6} /></span>
            <div className="thd-state-title">Couldn&apos;t load activity</div>
            <div className="thd-state-sub">{error}</div>
            <Button size="small" onClick={() => refresh()} className="thd-retry">Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="thd-state">
            <span className="thd-state-icon"><Inbox size={20} strokeWidth={1.6} /></span>
            <div className="thd-state-title">No activity yet</div>
            <div className="thd-state-sub">Changes to this record will appear here.</div>
          </div>
        ) : (
          <div className="thd-timeline">
            {(() => {
              let lastKey = "";
              const nodes: ReactNode[] = [];
              rows.forEach((row) => {
                const d = dayjs(row.createdAt);
                const key = d.format("YYYY-MM-DD");
                if (key !== lastKey) {
                  const isFirst = lastKey === "";
                  lastKey = key;
                  nodes.push(
                    <div className={`thd-day${isFirst ? " is-first" : ""}`} key={`day-${key}`}>
                      <span className="thd-day-label">{dayLabel(d)}</span>
                      <span className="thd-day-line" />
                    </div>
                  );
                }
                nodes.push(<HistoryRow key={row.id} row={row} />);
              });
              return nodes;
            })()}
            {hasMore && (
              <div className="thd-loadmore">
                <Button onClick={loadMore} loading={loadingMore} className="thd-loadmore-btn" block>
                  Load earlier activity
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string;
  section?: string;
  module?: string;
  title?: string;
  subtitle?: string;
  zIndex?: number;
}

/* ─────────────────── Styles ─────────────────── */
const styles = `
  .thd-drawer .ant-drawer-body { overflow: hidden !important; }

  /* ── Header: typographic, hairline separated ─────────────────────────── */
  .thd-head {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 20px 22px 16px;
    background: var(--bg-pure-white, #fff);
    border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
    flex-shrink: 0;
  }
  .thd-head-text { flex: 1; min-width: 0; }
  .thd-eyebrow {
    display: inline-flex; align-items: center; gap: 6px; margin-bottom: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-slate-400, #94a3b8);
  }
  .thd-head-title-row { display: flex; align-items: baseline; gap: 8px; }
  .thd-head-title {
    font-size: 16px; font-weight: 650; letter-spacing: -0.02em;
    color: var(--text-slate-900, #0f172a);
  }
  .thd-head-count { font-size: 12px; font-weight: 600; color: var(--text-slate-400, #94a3b8); }
  .thd-head-sub { font-size: 11.5px; color: var(--text-slate-500, #64748b); margin-top: 3px; line-height: 1.5; }
  .thd-head-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
  .thd-head-btn {
    width: 30px; height: 30px; border-radius: 8px;
    border: none; background: transparent;
    color: var(--text-slate-400, #94a3b8);
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    transition: color .15s ease, background .15s ease;
  }
  .thd-head-btn:hover { color: var(--text-slate-700, #334155); background: var(--bg-slate-50, #f8fafc); }
  .thd-head-btn.is-spin svg { animation: thd-spin 0.9s linear infinite; }
  @keyframes thd-spin { to { transform: rotate(360deg); } }

  /* ── Scroll area ─────────────────────────────────────────────────────── */
  .thd-scroll { flex: 1; overflow-y: auto; padding: 4px 22px 28px; }
  .thd-scroll::-webkit-scrollbar { width: 5px; }
  .thd-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200, #e2e8f0); border-radius: 4px; }
  .thd-scroll::-webkit-scrollbar-track { background: transparent; }

  /* ── Day divider: label + hairline, no chip ──────────────────────────── */
  .thd-day { display: flex; align-items: center; gap: 12px; padding: 22px 0 10px 38px; }
  .thd-day.is-first { padding-top: 16px; }
  .thd-day-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-slate-400, #94a3b8); white-space: nowrap;
  }
  .thd-day-line { flex: 1; height: 1px; background: var(--border-slate-200, #e2e8f0); opacity: .7; }

  /* ── Timeline entry: flat, card-less ─────────────────────────────────── */
  .thd-timeline { position: relative; }
  .thd-item {
    display: flex; gap: 14px; position: relative;
    padding: 11px 10px 11px 8px;
    margin: 0 -10px 0 -8px;
    border-radius: 10px;
    transition: background .15s ease;
  }
  .thd-item:hover { background: var(--bg-slate-50, #f8fafc); }

  .thd-rail { position: relative; width: 24px; flex-shrink: 0; display: flex; justify-content: center; }
  /* One continuous hairline threading the entries together. */
  .thd-rail::after {
    content: ''; position: absolute; top: 30px; bottom: -22px;
    width: 1px; background: var(--border-slate-200, #e2e8f0);
  }
  .thd-item:last-child .thd-rail::after { display: none; }

  .thd-avatar-wrap { position: relative; height: 24px; z-index: 1; }
  .thd-avatar-wrap .ant-avatar { border: none; }
  /* The only colour on the row: a 7px dot typing the action. */
  .thd-status-dot {
    position: absolute; right: -1px; bottom: -1px;
    width: 7px; height: 7px; border-radius: 50%;
    box-shadow: 0 0 0 2px var(--bg-pure-white, #fff);
  }
  .thd-item:hover .thd-status-dot { box-shadow: 0 0 0 2px var(--bg-slate-50, #f8fafc); }

  .thd-body { flex: 1; min-width: 0; padding-top: 1px; }
  .thd-row-top { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .thd-actor { font-size: 12.5px; font-weight: 650; color: var(--text-primary); letter-spacing: -0.01em; }
  .thd-action {
    font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
  }
  .thd-time { font-size: 11px; color: var(--text-slate-400, #94a3b8); white-space: nowrap; margin-left: auto; }
  .thd-label {
    margin-top: 3px;
    font-size: 12.5px; line-height: 1.55;
    color: var(--text-slate-600, #475569);
  }
  .thd-diff { margin-top: 7px; }

  /* ── Change rows inside this drawer: chips only, no container ────────── */
  .thd-drawer .activity-change-row {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 2px 0;
    gap: 7px;
  }
  .thd-drawer .activity-change-row__field {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-slate-400, #94a3b8);
  }
  .thd-drawer .activity-change-row__tag.ant-tag {
    font-size: 11px; font-weight: 600; border-radius: 5px;
    padding: 0 7px; line-height: 18px;
  }
  .thd-drawer .activity-change-row__tag--from.ant-tag {
    background: transparent;
    color: var(--text-slate-400, #94a3b8);
    padding-left: 0;
  }
  .thd-drawer .activity-change-row__tag--to.ant-tag {
    background: rgba(16, 185, 129, 0.10);
    color: #047857;
  }

  /* ---------- Change Row defaults (shared by other activity views) ------ */
  .activity-change-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 5px 10px;
  }
  .activity-change-row__field {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-slate-500);
    text-transform: capitalize;
    margin-right: 2px;
  }
  .activity-change-row__tag.ant-tag {
    margin: 0 !important;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    padding: 0 8px;
    line-height: 18px;
  }
  .activity-change-row__tag--from.ant-tag {
    background: rgba(148, 163, 184, 0.15);
    color: var(--text-slate-500);
    text-decoration: line-through;
    text-decoration-color: rgba(148, 163, 184, 0.7);
  }
  .activity-change-row__tag--to.ant-tag {
    background: rgba(16, 185, 129, 0.14);
    color: #059669;
  }
  .thd-dot-sep { color: var(--text-slate-300); }
  .thd-inline { font-size: 12px; }

  .thd-collapse.ant-collapse { margin-top: 6px; }
  .thd-collapse .ant-collapse-header { padding: 4px 0 !important; }
  .thd-collapse .ant-collapse-content-box { padding: 0 !important; }
  .thd-raw-toggle { font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
  .thd-raw-toggle:hover { color: #3b82f6; }
  .thd-raw { font-size: 11px; line-height: 1.5; }
  .ax-raw-pre {
    background: var(--bg-slate-50) !important;
    color: var(--text-slate-700) !important;
    border: 1px solid var(--border-slate-200) !important;
    border-radius: 8px !important;
    padding: 9px 10px !important;
    margin-top: 5px !important;
    overflow: auto;
    font-size: 11px;
  }
  [data-theme='dark'] .ax-raw-pre {
    background: #141414 !important;
    color: #e2e8f0 !important;
    border: 1px solid #303030 !important;
  }
  [data-theme='dark'] .ax-raw-pre .ant-typography-secondary {
    color: rgba(255, 255, 255, 0.45) !important;
  }

  /* ── Load more: text action, not a button block ──────────────────────── */
  .thd-loadmore { padding: 18px 0 0; display: flex; justify-content: center; }
  .thd-loadmore-btn.ant-btn {
    height: 30px !important; border-radius: 8px !important;
    border: none !important; background: transparent !important;
    color: var(--text-slate-500, #64748b) !important;
    font-weight: 600 !important; font-size: 12px !important;
    box-shadow: none !important;
  }
  .thd-loadmore-btn.ant-btn:hover {
    color: var(--text-slate-800, #1e293b) !important;
    background: var(--bg-slate-50, #f8fafc) !important;
  }

  /* ── Empty / error ───────────────────────────────────────────────────── */
  .thd-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 72px 24px; }
  .thd-state-icon {
    width: 44px; height: 44px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--border-slate-200, #e2e8f0);
    background: transparent; color: var(--text-slate-400, #94a3b8);
    margin-bottom: 14px;
  }
  .thd-state-icon--err { color: #f87171; border-color: rgba(248, 113, 113, 0.35); }
  .thd-state-title { font-size: 13.5px; font-weight: 650; color: var(--text-slate-800, #1e293b); }
  .thd-state-sub { font-size: 12px; color: var(--text-slate-500, #64748b); margin-top: 5px; max-width: 280px; line-height: 1.55; }
  .thd-retry.ant-btn {
    margin-top: 16px; border-radius: 8px !important;
    border-color: var(--border-slate-200, #e2e8f0) !important;
    font-weight: 600 !important;
  }

  /* ── Skeleton ────────────────────────────────────────────────────────── */
  .thd-skel-wrap { padding: 16px 0 4px; }
  .thd-skel-item { display: flex; gap: 14px; margin-bottom: 22px; align-items: flex-start; }
  .thd-skel-dot { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
  .thd-skel-body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 3px; }
  .thd-shimmer {
    display: block; border-radius: 5px;
    background: linear-gradient(90deg, var(--bg-slate-50, #f8fafc) 25%, var(--border-slate-100, #f1f5f9) 37%, var(--bg-slate-50, #f8fafc) 63%);
    background-size: 400% 100%;
    animation: thd-shimmer 1.3s ease infinite;
  }
  @keyframes thd-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

  /* ── Dark mode ───────────────────────────────────────────────────────── */
  [data-theme='dark'] .thd-head { background: var(--bg-secondary, #141414); border-color: #303030; }
  [data-theme='dark'] .thd-item:hover { background: rgba(255, 255, 255, 0.04); }
  [data-theme='dark'] .thd-rail::after,
  [data-theme='dark'] .thd-day-line { background: #303030; }
  [data-theme='dark'] .thd-status-dot { box-shadow: 0 0 0 2px var(--bg-secondary, #141414); }
  [data-theme='dark'] .thd-item:hover .thd-status-dot { box-shadow: 0 0 0 2px #1d1d1d; }
  [data-theme='dark'] .thd-state-icon { border-color: #303030; }
  [data-theme='dark'] .thd-head-btn:hover,
  [data-theme='dark'] .thd-loadmore-btn.ant-btn:hover { background: rgba(255, 255, 255, 0.06) !important; }
`;
