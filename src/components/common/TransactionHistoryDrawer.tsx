"use client";

import { Drawer, Typography, Button, Collapse, Tooltip, Avatar } from "antd";
import { History, User, RefreshCw, X, Inbox } from "lucide-react";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UndoOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { TransactionRow } from "@/services/transactionHistoryService";
import { useSocket } from "@/providers/SocketProvider";
import ActivityDiff, { InlineDiff } from "@/components/common/ActivityDiff";

dayjs.extend(relativeTime);

const { Text } = Typography;

/* Semantic action styling — stays within the brand palette:
   blue (changes) · green (creates/completes) · red (deletes) · ash (neutral). */
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

function initials(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  const parts = src.split(/\s+|@/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || src[0].toUpperCase();
}

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
        <span
          className="thd-rail-dot"
          style={{
            background: st.bg,
            color: st.color,
            borderColor: st.border,
            boxShadow: `0 0 0 3px var(--bg-pure-white), 0 0 0 4px ${st.bg}`
          }}
        >
          {st.icon}
        </span>
      </div>

      <div className="thd-card" style={{ borderLeft: `2px solid ${st.color}` }}>
        <div className="thd-row-top">
          <div className="thd-actor-wrap">
            <Avatar
              size={22}
              icon={<UserOutlined />}
              src={(row.actor as any)?.avatarUrl || (row.actor as any)?.avatar}
              style={{
                backgroundColor: row.actor?.name ? '#3b82f6' : '#94a3b8',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {initials(row.actor?.name, row.actor?.email)}
            </Avatar>
            <span className="thd-actor">{actorName}</span>
            <span
              className="thd-pill"
              style={{ color: st.color, background: st.bg, borderColor: st.border }}
            >
              {st.label}
            </span>
          </div>
          <Tooltip title={created.format("MMM D, YYYY · h:mm:ss A")}>
            <span className="thd-time">{created.fromNow()}</span>
          </Tooltip>
        </div>

        <div className="thd-label" style={{ marginTop: 8 }}>
          <span>{displayLabel}</span>
        </div>

        {row.action === "update" && (
          <div style={{ marginTop: 4 }}>
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
  const { rows, loading, loadingMore, hasMore, error, loadMore, refresh } = useTransactionHistory({
    entityType,
    entityId,
    section,
    module,
    enabled: open,
    limit: 20,
  });

  // Realtime: when a new transaction arrives for this entity while the drawer
  // is open, pull a fresh page so the user sees it without closing/reopening.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !open) return;
    const handler = (row: any) => {
      if (
        (entityType && entityId && row?.entityType === entityType && row?.entityId === entityId) ||
        (!entityId && module && row?.module === module) ||
        (!entityId && !module && section && row?.section === section)
      ) {
        refresh();
      }
    };
    socket.on("transaction:created", handler);
    return () => {
      socket.off("transaction:created", handler);
    };
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
        body: { padding: 0, display: "flex", flexDirection: "column", background: "var(--bg-slate-50)" },
      }}
    >
      <style>{styles}</style>

      {/* Premium header */}
      <header className="thd-head">
        <span className="thd-head-icon">
          <History size={17} strokeWidth={2} />
        </span>
        <div className="thd-head-text">
          <div className="thd-head-title">{title}</div>
          {subtitle && <div className="thd-head-sub">{subtitle}</div>}
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
                <span className="thd-skel-avatar thd-shimmer" />
                <div className="thd-skel-body">
                  <span className="thd-shimmer" style={{ width: "55%", height: 12 }} />
                  <span className="thd-shimmer" style={{ width: "82%", height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="thd-state">
            <span className="thd-state-icon thd-state-icon--err">
              <User size={26} strokeWidth={1.6} />
            </span>
            <div className="thd-state-title">Couldn’t load activity</div>
            <div className="thd-state-sub">{error}</div>
            <Button size="small" onClick={() => refresh()} className="thd-retry">
              Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="thd-state">
            <span className="thd-state-icon">
              <Inbox size={26} strokeWidth={1.6} />
            </span>
            <div className="thd-state-title">No activity yet</div>
            <div className="thd-state-sub">Changes to this record will appear here.</div>
          </div>
        ) : (
          <div className="thd-timeline">
            {rows.map((row) => (
              <HistoryRow key={row.id} row={row} />
            ))}
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
  /** Override title; defaults to "Activity history" */
  title?: string;
  /** Tag the entity label (e.g. "TKT-123 — login broken") shown under the title */
  subtitle?: string;
   zIndex?: number;
}

const styles = `
  .thd-drawer .ant-drawer-body { overflow: hidden !important; }

  /* ---------- Header ---------- */
  .thd-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    background: var(--bg-pure-white);
    border-bottom: 1px solid var(--border-slate-200);
    flex-shrink: 0;
  }
  .thd-head-icon {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 6px 14px -6px rgba(29, 78, 216, 0.55);
  }
  .thd-head-text { flex: 1; min-width: 0; }
  .thd-head-title {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-slate-900);
    letter-spacing: -0.02em;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .thd-head-sub {
    font-size: 11.5px;
    color: var(--text-slate-500);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .thd-head-btn {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 9px;
    border: 1px solid var(--border-slate-200);
    background: var(--bg-slate-50);
    color: var(--text-slate-500);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color .15s ease, border-color .15s ease, background .15s ease;
  }
  .thd-head-btn:hover { color: #3b82f6; border-color: #bfdbfe; background: var(--bg-blue-50); }
  .thd-head-btn.is-spin svg { animation: thd-spin 0.9s linear infinite; }
  @keyframes thd-spin { to { transform: rotate(360deg); } }

  /* ---------- Scroll area ---------- */
  .thd-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 18px 18px 24px;
  }
  .thd-scroll::-webkit-scrollbar { width: 7px; }
  .thd-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 4px; }

  /* ---------- Timeline ---------- */
  .thd-timeline { position: relative; }
  .thd-item { display: flex; gap: 12px; }
  .thd-rail { position: relative; width: 34px; flex-shrink: 0; display: flex; justify-content: center; }
  .thd-rail::after {
    content: "";
    position: absolute;
    top: 36px;
    bottom: -10px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: var(--border-slate-200);
  }
  .thd-item:last-child .thd-rail::after { display: none; }

  .thd-rail-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    border: 1px solid transparent;
    transition: transform 0.18s ease;
    margin-top: 8px;
  }
  .thd-item:hover .thd-rail-dot {
    transform: scale(1.08);
  }

  .thd-card {
    flex: 1;
    min-width: 0;
    background: var(--bg-pure-white);
    border: 1px solid var(--border-slate-200);
    border-radius: 12px;
    padding: 11px 13px;
    margin-bottom: 14px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition: all 0.18s ease;
  }
  .thd-card:hover {
    box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.18);
    border-color: #cbd5e1;
    transform: translateX(2px);
  }

  .thd-row-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .thd-actor-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .thd-actor {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }
  .thd-pill {
    display: inline-flex;
    align-items: center;
    height: 19px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    line-height: 1.4;
  }
  .thd-time { margin-left: auto; font-size: 11px; color: var(--text-slate-400); white-space: nowrap; font-weight: 500; }

  .thd-label {
    margin-top: 5px;
    font-size: 12.5px;
    color: var(--text-slate-600);
    line-height: 1.5;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
  }

  /* ---------- Change Row styling ---------- */
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
  .thd-raw-toggle {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-slate-400);
  }
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

  /* ---------- Load more ---------- */
  .thd-loadmore { padding: 4px 0 0; }
  .thd-loadmore-btn.ant-btn {
    height: 36px !important;
    border-radius: 10px !important;
    border: 1px solid var(--border-slate-200) !important;
    background: var(--bg-pure-white) !important;
    color: var(--text-slate-600) !important;
    font-weight: 600 !important;
    font-size: 12.5px !important;
  }
  .thd-loadmore-btn.ant-btn:hover {
    color: #3b82f6 !important;
    border-color: #bfdbfe !important;
    background: var(--bg-blue-50) !important;
  }

  /* ---------- Empty / error states ---------- */
  .thd-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 64px 24px;
  }
  .thd-state-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-blue-50);
    color: #3b82f6;
    margin-bottom: 14px;
  }
  .thd-state-icon--err { background: rgba(239, 68, 68, 0.10); color: #ef4444; }
  .thd-state-title { font-size: 14px; font-weight: 700; color: var(--text-slate-800); }
  .thd-state-sub { font-size: 12px; color: var(--text-slate-500); margin-top: 4px; max-width: 280px; line-height: 1.5; }
  .thd-retry.ant-btn { margin-top: 14px; border-radius: 8px !important; }

  /* ---------- Skeleton ---------- */
  .thd-skel-wrap { padding: 4px 0; }
  .thd-skel-item { display: flex; gap: 12px; margin-bottom: 18px; }
  .thd-skel-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }
  .thd-skel-body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 3px; }
  .thd-shimmer {
    display: block;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--bg-slate-50) 25%, var(--border-slate-100) 37%, var(--bg-slate-50) 63%);
    background-size: 400% 100%;
    animation: thd-shimmer 1.3s ease infinite;
  }
  @keyframes thd-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

  [data-theme='dark'] .thd-head,
  [data-theme='dark'] .thd-card { background: var(--bg-secondary); border-color: var(--border-slate-100); }
`;
