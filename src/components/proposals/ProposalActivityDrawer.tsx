"use client";

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from "react";
import { Drawer, Avatar, Empty, Tooltip, Skeleton, Typography } from "antd";
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
  UserOutlined,
} from "@ant-design/icons";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import {
  TransactionHistoryService,
  TransactionRow,
} from "@/services/transactionHistoryService";
import ActivityDiff from "@/components/common/ActivityDiff";

const { Text } = Typography;

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

interface ActionStyle {
  color: string;
  bg: string;
  icon: React.ReactNode;
  label: string;
}

const getActionStyle = (action: string): ActionStyle => {
  const a = (action || "").toLowerCase();
  const iconStyle = { fontSize: 13 };
  if (a.includes("create")) {
    return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: <PlusCircleOutlined style={iconStyle} />, label: 'Created' };
  }
  if (a.includes("delete") || a.includes("trash")) {
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', icon: <DeleteOutlined style={iconStyle} />, label: 'Deleted' };
  }
  if (a.includes("complete") || a.includes("accept") || a.includes("resolve")) {
    return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: <CheckCircleOutlined style={iconStyle} />, label: 'Completed' };
  }
  if (a.includes("comment")) {
    return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: <MessageOutlined style={iconStyle} />, label: 'Commented' };
  }
  if (a.includes("mail") || a.includes("sent") || a.includes("send")) {
    return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: <SendOutlined style={iconStyle} />, label: 'Sent' };
  }
  if (a.includes("attach") || a.includes("export")) {
    return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', icon: <FileOutlined style={iconStyle} />, label: 'Attachment' };
  }
  if (a.includes("update") || a.includes("edit")) {
    return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: <EditOutlined style={iconStyle} />, label: 'Updated' };
  }
  return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', icon: <ClockCircleOutlined style={iconStyle} />, label: action || 'Activity' };
};

const dateGroupLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'MMM d, yyyy');
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
        const res = await TransactionHistoryService.list({ entityType: "proposal", entityId: proposal.id, limit: 100 });
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
      styles={{ body: { padding: 0 }, header: { display: "none" } }}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-2.5"
          style={{ borderBottom: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)' }}
        >
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 30,
              height: 30,
              background: 'var(--bg-blue-50)',
              color: 'var(--text-blue-700)',
            }}
          >
            <HistoryOutlined style={{ fontSize: 14 }} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span
              className="text-[14px] font-semibold tracking-tight truncate"
              style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
            >
              Activity timeline
            </span>
            <span
              className="text-[11.5px] truncate"
              style={{ color: 'var(--text-slate-400)' }}
            >
              {proposal?.title || "Proposal"}
            </span>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <ZukvoLoader size="md" message="Loading history" />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 32 }}>
            <NoData description={<Text type="secondary" style={{ fontSize: 13 }}>No activity recorded yet</Text>} />
          </div>
        ) : (
          <div className="activity-timeline-v2">
            {groups.map((group, gIdx) => (
              <div key={group.label} className="activity-timeline-v2__group">
                <div className="activity-timeline-v2__day-divider">
                  <span className="activity-timeline-v2__day-label">{group.label}</span>
                  <span className="activity-timeline-v2__day-line" />
                </div>

                <div className="activity-timeline-v2__rail">
                  {group.items.map((r, idx) => {
                    const style = getActionStyle(r.action);
                    const isLast = gIdx === groups.length - 1 && idx === group.items.length - 1;
                    const date = new Date(r.createdAt);
                    const userName = r.actor?.name || 'System';

                    return (
                      <div key={r.id} className={`activity-event ${isLast ? 'is-last' : ''}`}>
                        <div
                          className="activity-event__dot"
                          style={{ background: style.bg, color: style.color, boxShadow: `0 0 0 4px var(--bg-pure-white), 0 0 0 5px ${style.bg}` }}
                        >
                          {style.icon}
                        </div>

                        <div className="activity-event__card" style={{ borderLeft: `2px solid ${style.color}` }}>
                          <div className="activity-event__head">
                            <div className="activity-event__user">
                              <Avatar
                                size={22}
                                icon={<UserOutlined />}
                                style={{
                                  backgroundColor: userName !== 'System' ? '#3b82f6' : '#94a3b8',
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                {initialsOf(userName)}
                              </Avatar>
                              <Text strong className="activity-event__name" style={{ whiteSpace: 'nowrap' }}>{userName}</Text>
                              <span className="activity-event__action-pill" style={{ background: style.bg, color: style.color }}>
                                {style.label}
                              </span>
                            </div>
                            <Tooltip title={format(date, 'MMM d, yyyy h:mm a')}>
                              <Text className="activity-event__time">
                                {formatDistanceToNow(date, { addSuffix: true })}
                              </Text>
                            </Tooltip>
                          </div>
                          
                          {r.actionLabel && r.actionLabel.toLowerCase() !== style.label.toLowerCase() && (
                            <div style={{ marginTop: 8 }}>
                              <Text style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                {r.actionLabel}
                              </Text>
                            </div>
                          )}

                          {r.changedFields && r.changedFields.length > 0 && (
                            <div style={{ marginTop: 12 }}>
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
      </div>

      <style jsx global>{`
        .activity-timeline-v2 {
          padding: 16px 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .activity-timeline-v2__day-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
          margin-bottom: 8px;
        }
        .activity-timeline-v2__day-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-slate-500);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 3px 10px;
          border-radius: 999px;
        }
        .activity-timeline-v2__day-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--border-slate-200), transparent);
        }
        .activity-timeline-v2__rail {
          position: relative;
          padding-left: 44px;
        }
        .activity-timeline-v2__rail::before {
          content: '';
          position: absolute;
          left: 17px;
          top: 4px;
          bottom: 4px;
          width: 2px;
          background: linear-gradient(180deg, var(--border-slate-200), transparent);
          border-radius: 2px;
        }
        .activity-event {
          position: relative;
          margin-bottom: 14px;
        }
        .activity-event:last-child { margin-bottom: 0; }
        .activity-event__dot {
          position: absolute;
          left: -40px;
          top: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s ease;
        }
        .activity-event:hover .activity-event__dot {
          transform: scale(1.08);
        }
        .activity-event__card {
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-left-width: 2px;
          border-radius: 10px;
          padding: 10px 12px;
          transition: all 0.18s ease;
        }
        .activity-event:hover .activity-event__card {
          transform: translateX(2px);
          box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.18);
        }
        .activity-event__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .activity-event__user {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .activity-event__name {
          font-size: 12.5px;
          color: var(--text-slate-900);
          font-weight: 700;
        }
        .activity-event__action-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.4;
        }
        .activity-event__time {
          font-size: 11px;
          color: var(--text-slate-400);
          white-space: nowrap;
          cursor: default;
        }
      `}</style>
    </Drawer>
  );
};

export default ProposalActivityDrawer;
