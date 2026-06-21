"use client";

import React, { type ReactNode } from "react";
import { Drawer, Button, Tooltip, Avatar, Tag } from "antd";
import {
  History,
  User,
  RefreshCw,
  X,
  Inbox,
  Edit3,
  PlusCircle,
  Trash2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect } from "react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { TransactionRow } from "@/services/transactionHistoryService";
import { useSocket } from "@/providers/SocketProvider";

dayjs.extend(relativeTime);

/* ─────────────────── Action palette ─────────────────── */
interface ActionStyle {
  color: string;
  bg: string;
  border: string;
  icon: ReactNode;
  label: string;
}

function actionStyle(action: string): ActionStyle {
  const ico = (c: ReactNode) => c;
  if (action === "delete" || action === "permanent_delete")
    return { color: "#b91c1c", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", icon: ico(<Trash2 size={13} />), label: "Deleted" };
  if (["create"].includes(action))
    return { color: "#047857", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", icon: ico(<PlusCircle size={13} />), label: "Created" };
  if (["restore", "verify", "complete"].includes(action))
    return { color: "#047857", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", icon: ico(<CheckCircle size={13} />), label: action.charAt(0).toUpperCase() + action.slice(1) };
  if (["update", "status_change", "move", "convert", "generate_ai", "archive", "reopen"].includes(action))
    return { color: "#b45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", icon: ico(<Edit3 size={13} />), label: "Updated" };
  if (action.startsWith("bulk_"))
    return { color: "#475569", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.22)", icon: ico(<Edit3 size={13} />), label: action.replace(/_/g, " ") };
  return { color: "#475569", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.22)", icon: ico(<History size={13} />), label: action.replace(/_/g, " ") };
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

/* ─────────────────── HistoryRow (ticket-timeline style) ─────────────────── */
function HistoryRow({ row, isLast }: { row: TransactionRow; isLast: boolean }) {
  const created = dayjs(row.createdAt);
  const st = actionStyle(row.action);
  const actorName = row.actor?.name || row.actor?.email || "System";
  const label = row.actionLabel || row.action.replace(/_/g, " ");

  // Build diff rows
  const diffRows: ReactNode[] = [];
  const fields = row.changedFields ?? [];

  fields.forEach((field) => {
    const before = row.beforeData?.[field];
    const after = row.afterData?.[field];

    // Try expanding object/JSON blobs first
    const expanded = expandDiff(field, before, after);
    if (expanded) {
      expanded.forEach(({ key, bv, av }) => {
        const bStr = fmtVal(bv, key);
        const aStr = fmtVal(av, key);
        const lbl = humanField(key);
        const isEmpty = (x: unknown) => x === null || x === undefined || x === "";
        diffRows.push(
          <div key={`${field}.${key}`} className="thd-change-row">
            <span className="thd-change-field">{lbl}</span>
            {!isEmpty(bv) && (
              <Tooltip title={String(bv)}>
                <Tag bordered={false} className="thd-tag thd-tag--from">{bStr}</Tag>
              </Tooltip>
            )}
            {!isEmpty(bv) && !isEmpty(av) && <ArrowRight size={10} className="thd-arrow" />}
            {!isEmpty(av) && (
              <Tooltip title={String(av)}>
                <Tag bordered={false} className="thd-tag thd-tag--to">{aStr}</Tag>
              </Tooltip>
            )}
          </div>
        );
      });
      return;
    }

    // Scalar diff
    const bStr = fmtVal(before, field);
    const aStr = fmtVal(after, field);
    const lbl = humanField(field);
    const isEmpty = (x: unknown) => x === null || x === undefined || x === "";
    diffRows.push(
      <div key={field} className="thd-change-row">
        <span className="thd-change-field">{lbl}</span>
        {!isEmpty(before) && (
          <Tooltip title={String(before)}>
            <Tag bordered={false} className="thd-tag thd-tag--from">{bStr}</Tag>
          </Tooltip>
        )}
        {!isEmpty(before) && !isEmpty(after) && <ArrowRight size={10} className="thd-arrow" />}
        {!isEmpty(after) && (
          <Tooltip title={String(after)}>
            <Tag bordered={false} className="thd-tag thd-tag--to">{aStr}</Tag>
          </Tooltip>
        )}
      </div>
    );
  });

  return (
    <div className={`thd-event${isLast ? " thd-event--last" : ""}`}>
      {/* Rail dot */}
      <div
        className="thd-dot"
        style={{
          background: st.bg,
          color: st.color,
          boxShadow: `0 0 0 4px var(--bg-slate-50, #f8fafc), 0 0 0 5px ${st.border}`,
        }}
      >
        {st.icon}
      </div>

      {/* Card */}
      <div className="thd-card" style={{ borderLeft: `3px solid ${st.color}` }}>
        {/* Header */}
        <div className="thd-card-head">
          <div className="thd-card-user">
            <Avatar
              size={22}
              icon={<User size={12} />}
              style={{ backgroundColor: "#3b82f6", fontSize: 10, fontWeight: 700, flexShrink: 0 }}
            >
              {initials(row.actor?.name, row.actor?.email)}
            </Avatar>
            <span className="thd-actor">{actorName}</span>
            <span className="thd-pill" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
              {st.label.toUpperCase()}
            </span>
          </div>
          <Tooltip title={created.format("MMM D, YYYY · h:mm:ss A")}>
            <span className="thd-time">{created.fromNow()}</span>
          </Tooltip>
        </div>

        {/* Action label */}
        <div className="thd-card-label">• {label}</div>

        {/* Diff rows */}
        {diffRows.length > 0 && (
          <div className="thd-diffs">{diffRows}</div>
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
        body: { padding: 0, display: "flex", flexDirection: "column", background: "var(--bg-slate-50, #f8fafc)" },
      }}
    >
      <style>{styles}</style>

      {/* Header */}
      <header className="thd-head">
        <span className="thd-head-icon">
          <History size={17} strokeWidth={2} />
        </span>
        <div className="thd-head-text">
          <div className="thd-head-title-row">
            <span className="thd-head-title">{title}</span>
            {rows.length > 0 && (
              <span className="thd-head-count">{rows.length}{hasMore ? "+" : ""}</span>
            )}
          </div>
          <div className="thd-head-sub">{subtitle || "Chronological record of every change"}</div>
        </div>
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
            <span className="thd-state-icon thd-state-icon--err"><User size={26} strokeWidth={1.6} /></span>
            <div className="thd-state-title">Couldn't load activity</div>
            <div className="thd-state-sub">{error}</div>
            <Button size="small" onClick={() => refresh()} className="thd-retry">Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="thd-state">
            <span className="thd-state-icon"><Inbox size={26} strokeWidth={1.6} /></span>
            <div className="thd-state-title">No activity yet</div>
            <div className="thd-state-sub">Changes to this record will appear here.</div>
          </div>
        ) : (
          <div className="thd-timeline">
            {(() => {
              let lastKey = "";
              const nodes: ReactNode[] = [];
              rows.forEach((row, idx) => {
                const d = dayjs(row.createdAt);
                const key = d.format("YYYY-MM-DD");
                if (key !== lastKey) {
                  lastKey = key;
                  nodes.push(
                    <div className="thd-day" key={`day-${key}`}>
                      <span className="thd-day-label">{dayLabel(d)}</span>
                      <span className="thd-day-line" />
                    </div>
                  );
                }
                nodes.push(
                  <HistoryRow key={row.id} row={row} isLast={idx === rows.length - 1} />
                );
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

  /* Header */
  .thd-head {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 18px;
    background: radial-gradient(120% 140% at 0% 0%, rgba(59,130,246,0.06) 0%, transparent 55%), var(--bg-pure-white, #fff);
    border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
    flex-shrink: 0;
  }
  .thd-head-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 4px 12px -4px rgba(29,78,216,0.5);
  }
  .thd-head-text { flex: 1; min-width: 0; }
  .thd-head-title-row { display: flex; align-items: center; gap: 8px; }
  .thd-head-title { font-size: 14.5px; font-weight: 800; color: var(--text-slate-900, #0f172a); letter-spacing: -0.02em; }
  .thd-head-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 20px; height: 18px; padding: 0 6px; border-radius: 999px;
    font-size: 11px; font-weight: 800; color: #1d4ed8;
    background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  }
  .thd-head-sub { font-size: 11px; color: var(--text-slate-500, #64748b); margin-top: 1px; }
  .thd-head-btn {
    width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px;
    border: 1px solid var(--border-slate-200, #e2e8f0);
    background: var(--bg-slate-50, #f8fafc); color: var(--text-slate-500, #64748b);
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    transition: all .15s ease;
  }
  .thd-head-btn:hover { color: #3b82f6; border-color: #bfdbfe; background: #eff6ff; }
  .thd-head-btn.is-spin svg { animation: thd-spin 0.9s linear infinite; }
  @keyframes thd-spin { to { transform: rotate(360deg); } }

  /* Scroll */
  .thd-scroll { flex: 1; overflow-y: auto; padding: 16px 18px 24px; }
  .thd-scroll::-webkit-scrollbar { width: 6px; }
  .thd-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200, #e2e8f0); border-radius: 4px; }

  /* Day divider */
  .thd-day {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px; margin-top: 6px;
    padding-left: 44px;
  }
  .thd-day-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-slate-500, #64748b);
    background: var(--bg-pure-white, #fff);
    border: 1px solid var(--border-slate-200, #e2e8f0);
    padding: 2px 10px; border-radius: 999px;
    white-space: nowrap;
  }
  .thd-day-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-slate-200, #e2e8f0), transparent); }

  /* Timeline rail */
  .thd-timeline { position: relative; padding-left: 44px; }
  .thd-timeline::before {
    content: ''; position: absolute;
    left: 17px; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(180deg, var(--border-slate-200, #e2e8f0) 80%, transparent);
  }

  /* Event */
  .thd-event { position: relative; margin-bottom: 14px; }
  .thd-event--last { margin-bottom: 0; }

  /* Dot (colored icon circle on rail) */
  .thd-dot {
    position: absolute;
    left: -40px; top: 10px;
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: transform .18s ease;
    z-index: 2;
  }
  .thd-event:hover .thd-dot { transform: scale(1.1); }

  /* Card */
  .thd-card {
    background: var(--bg-pure-white, #fff);
    border: 1px solid var(--border-slate-200, #e2e8f0);
    border-radius: 10px;
    padding: 10px 13px;
    transition: all .18s ease;
  }
  .thd-event:hover .thd-card { transform: translateX(2px); box-shadow: 0 4px 16px -8px rgba(15,23,42,0.12); }

  /* Card header */
  .thd-card-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; flex-wrap: wrap;
  }
  .thd-card-user { display: flex; align-items: center; gap: 7px; min-width: 0; }
  .thd-actor { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900, #0f172a); }
  .thd-pill {
    display: inline-flex; align-items: center; height: 18px;
    padding: 0 7px; border-radius: 5px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
    white-space: nowrap;
  }
  .thd-time { font-size: 11px; color: var(--text-slate-400, #94a3b8); white-space: nowrap; margin-left: auto; }

  /* Action label */
  .thd-card-label {
    margin-top: 5px; font-size: 12px;
    color: var(--text-slate-500, #64748b); line-height: 1.5;
  }

  /* Diff rows */
  .thd-diffs {
    margin-top: 8px; padding: 8px 10px;
    background: var(--bg-slate-50, #f8fafc);
    border: 1px solid var(--border-slate-200, #e2e8f0);
    border-radius: 6px;
    display: flex; flex-direction: column; gap: 5px;
  }
  .thd-change-row {
    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  }
  .thd-change-field {
    font-size: 11px; font-weight: 700;
    color: var(--text-slate-500, #64748b);
    text-transform: capitalize; margin-right: 2px;
    white-space: nowrap;
  }
  .thd-arrow { color: var(--text-slate-400, #94a3b8); flex-shrink: 0; }
  .thd-tag.ant-tag { margin: 0 !important; font-size: 11px; font-weight: 600; border-radius: 5px; padding: 0 7px; line-height: 18px; }
  .thd-tag--from.ant-tag {
    background: rgba(148,163,184,0.15) !important;
    color: var(--text-slate-500, #64748b) !important;
    text-decoration: line-through;
    text-decoration-color: rgba(148,163,184,0.7);
  }
  .thd-tag--to.ant-tag {
    background: rgba(16,185,129,0.12) !important;
    color: #047857 !important;
  }

  /* Load more */
  .thd-loadmore { padding: 8px 0 0; }
  .thd-loadmore-btn.ant-btn {
    height: 34px !important; border-radius: 8px !important;
    border: 1px solid var(--border-slate-200, #e2e8f0) !important;
    background: var(--bg-pure-white, #fff) !important;
    color: var(--text-slate-600, #475569) !important;
    font-weight: 600 !important; font-size: 12.5px !important;
  }
  .thd-loadmore-btn.ant-btn:hover { color: #3b82f6 !important; border-color: #bfdbfe !important; background: #eff6ff !important; }

  /* Empty / error */
  .thd-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; }
  .thd-state-icon {
    width: 52px; height: 52px; border-radius: 14px;
    display: inline-flex; align-items: center; justify-content: center;
    background: rgba(59,130,246,0.1); color: #3b82f6; margin-bottom: 14px;
  }
  .thd-state-icon--err { background: rgba(239,68,68,0.1); color: #ef4444; }
  .thd-state-title { font-size: 14px; font-weight: 700; color: var(--text-slate-800, #1e293b); }
  .thd-state-sub { font-size: 12px; color: var(--text-slate-500, #64748b); margin-top: 4px; max-width: 280px; line-height: 1.5; }
  .thd-retry.ant-btn { margin-top: 14px; border-radius: 8px !important; }

  /* Skeleton */
  .thd-skel-wrap { padding: 4px 0; }
  .thd-skel-item { display: flex; gap: 12px; margin-bottom: 18px; align-items: flex-start; }
  .thd-skel-dot { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
  .thd-skel-body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 3px; }
  .thd-shimmer {
    display: block; border-radius: 6px;
    background: linear-gradient(90deg, var(--bg-slate-50, #f8fafc) 25%, var(--border-slate-100, #f1f5f9) 37%, var(--bg-slate-50, #f8fafc) 63%);
    background-size: 400% 100%;
    animation: thd-shimmer 1.3s ease infinite;
  }
  @keyframes thd-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

  /* Dark mode */
  [data-theme='dark'] .thd-head,
  [data-theme='dark'] .thd-card { background: var(--bg-secondary, #141414); border-color: var(--border-slate-100, #303030); }
  [data-theme='dark'] .thd-diffs { background: #0b0f1a; border-color: #303030; }
  [data-theme='dark'] .thd-day-label { background: var(--bg-secondary, #141414); border-color: #303030; }
`;
