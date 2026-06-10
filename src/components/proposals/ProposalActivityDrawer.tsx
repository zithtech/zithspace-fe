"use client";

import React, { useEffect, useState } from "react";
import { Drawer, Avatar, Spin, Empty, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  PlusCircleOutlined,
  EditOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  FileOutlined,
  DeleteOutlined,
  SendOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  TransactionHistoryService,
  TransactionRow,
} from "@/services/transactionHistoryService";
import ActivityDiff from "@/components/common/ActivityDiff";

interface ProposalLite {
  id: string;
  title?: string;
  client_name?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  proposal: ProposalLite | null;
}

const actionStyle = (action: string) => {
  const a = (action || "").toLowerCase();
  const s = { fontSize: 13 };
  const blue = { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  const green = { color: "#10b981", bg: "rgba(16,185,129,0.12)" };
  const ash = { color: "#64748b", bg: "rgba(100,116,139,0.12)" };
  if (a.includes("create")) return { ...green, icon: <PlusCircleOutlined style={s} /> };
  if (a.includes("delete") || a.includes("trash")) return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <DeleteOutlined style={s} /> };
  if (a.includes("complete") || a.includes("accept") || a.includes("resolve")) return { ...green, icon: <CheckCircleOutlined style={s} /> };
  if (a.includes("comment")) return { ...blue, icon: <MessageOutlined style={s} /> };
  if (a.includes("mail") || a.includes("sent") || a.includes("send")) return { ...blue, icon: <SendOutlined style={s} /> };
  if (a.includes("attach") || a.includes("export")) return { ...ash, icon: <FileOutlined style={s} /> };
  if (a.includes("update") || a.includes("edit")) return { ...ash, icon: <EditOutlined style={s} /> };
  return { ...ash, icon: <ClockCircleOutlined style={s} /> };
};

const dateGroupLabel = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
};

const initialsOf = (name: string) =>
  (name || "—").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

const ProposalActivityDrawer: React.FC<Props> = ({ open, onClose, proposal }) => {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !proposal?.id) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await TransactionHistoryService.list({ entityId: proposal.id, limit: 100 });
        if (active) setRows(res.data || []);
      } catch (e) {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, proposal?.id]);

  // Group rows by day-label, preserving order (rows arrive newest-first).
  const groups: { label: string; items: TransactionRow[] }[] = [];
  rows.forEach((r) => {
    const label = dateGroupLabel(new Date(r.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(r);
    else groups.push({ label, items: [r] });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      destroyOnClose
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32, height: 32, borderRadius: 9, display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(59,130,246,0.10)", color: "#3b82f6",
            }}
          >
            <HistoryOutlined style={{ fontSize: 16 }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-slate-900)", lineHeight: 1.15 }}>
              Activity timeline
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-slate-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>
              {proposal?.title || "Proposal"}
            </div>
          </div>
        </div>
      }
      styles={{ body: { padding: "16px 20px" } }}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Spin />
        </div>
      ) : rows.length === 0 ? (
        <Empty description="No activity recorded yet" style={{ marginTop: 48 }} />
      ) : (
        <div className="pad-timeline">
          {groups.map((g) => (
            <div key={g.label} className="pad-group">
              <div className="pad-group-label">{g.label}</div>
              <div className="pad-items">
                {g.items.map((r) => {
                  const st = actionStyle(r.action);
                  const when = new Date(r.createdAt);
                  return (
                    <div key={r.id} className="pad-item">
                      <span className="pad-icon" style={{ background: st.bg, color: st.color }}>
                        {st.icon}
                      </span>
                      <div className="pad-body">
                        <div className="pad-line">
                          <span className="pad-action">{r.actionLabel || r.action}</span>
                          <Tooltip title={format(when, "EEE, MMM d, yyyy · h:mm a")}>
                            <span className="pad-time">{formatDistanceToNow(when, { addSuffix: true })}</span>
                          </Tooltip>
                        </div>
                        <div className="pad-actor">
                          <Avatar size={18} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                            {initialsOf(r.actor?.name || "—")}
                          </Avatar>
                          <span>{r.actor?.name || "System"}</span>
                          {r.page && <span className="pad-page">· {r.page}</span>}
                        </div>
                        {r.changedFields && r.changedFields.length > 0 && (
                          <div className="pad-diff">
                            <ActivityDiff row={r} maxLines={5} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .pad-group { margin-bottom: 18px; }
        .pad-group-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-400); margin-bottom: 10px;
        }
        .pad-items { position: relative; display: flex; flex-direction: column; gap: 14px; }
        .pad-items::before {
          content: ""; position: absolute; left: 13px; top: 4px; bottom: 4px;
          width: 1px; background: var(--border-slate-200);
        }
        .pad-item { display: flex; gap: 12px; position: relative; }
        .pad-icon {
          width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; z-index: 1;
          display: inline-flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 3px var(--bg-pure-white);
        }
        .pad-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-top: 2px; }
        .pad-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pad-action { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .pad-time { font-size: 11px; color: var(--text-slate-400); white-space: nowrap; flex-shrink: 0; }
        .pad-actor { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-slate-600); }
        .pad-page { color: var(--text-slate-400); }
        .pad-diff { margin-top: 4px; }
      `}</style>
    </Drawer>
  );
};

export default ProposalActivityDrawer;
