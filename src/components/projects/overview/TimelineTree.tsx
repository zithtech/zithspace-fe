"use client";

import NoData from "@/components/common/NoData";
import React, { useMemo, useState } from "react";
import { Typography, Avatar, Empty, Tooltip } from "antd";
import {
  CalendarOutlined,
  RightOutlined,
  CheckCircleFilled,
  SyncOutlined,
  ClockCircleOutlined,
  StopOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { Text } = Typography;

interface TimelineTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string | null;
  type: string | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  dueDate: string | Date | null;
  sprintName?: string | null;
  estimateHours?: number;
  trackedSeconds?: number;
  /**
   * Optional override for the month-grouping anchor. When set, the ticket is
   * grouped under THIS date's month instead of its start/due/end date. Used by
   * the performance report so tickets bucket under the month they were worked.
   */
  timelineAnchor?: string | Date | null;
}

interface TimelineTreeProps {
  tickets: TimelineTicket[];
  /** Hide the column-header row (Start/End/Est/…). Default: shown. */
  hideColumnHeader?: boolean;
  /** Hide the toolbar (title, assignee filter, group-by toggle, collapse-all). */
  hideToolbar?: boolean;
  /**
   * When provided, renders a "Points" column per ticket using this scorer.
   * Returns 0–100 (or null to show a dash). Used by the performance report.
   */
  pointsOf?: (t: TimelineTicket) => number | null;
  /** When set, renders a "How points work" button in the header that calls this. */
  onPointsInfo?: () => void;
  hideAvatar?: boolean;
  flatView?: boolean;
}

// Ticket Points (0–100) → percentage text + colour. Palette: green / amber / red.
const pointMeta = (p: number | null | undefined) => {
  if (p === null || p === undefined) return { text: "—", color: "var(--text-slate-400)" };
  const color = p >= 90 ? "#10b981" : p >= 75 ? "#f59e0b" : "#ef4444";
  return { text: `${p}%`, color };
};

// Palette: blue / green / red / grey only
const statusMeta = (status: string) => {
  const s = (status || "").toLowerCase();
  if (["completed", "done", "live", "live (deployed)"].includes(s))
    return { label: "Done", color: "#10b981", icon: <CheckCircleFilled /> };
  if (["in_progress", "in_testing", "started", "active"].includes(s))
    return { label: "In progress", color: "#3b82f6", icon: <SyncOutlined /> };
  if (["blocked", "on_hold", "on-hold"].includes(s))
    return { label: "Blocked", color: "#ef4444", icon: <StopOutlined /> };
  return { label: (status || "To do").replace(/_/g, " "), color: "#64748b", icon: <ClockCircleOutlined /> };
};

const fmtDate = (d: string | Date | null) => (d ? dayjs(d as any).format("MMM D") : "—");

// Compact "Xh Ym" from a number of seconds.
const fmtHM = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

// Estimate vs tracked → delay (over-estimate) signal. Palette: blue / green / red / grey.
const effortMeta = (estimateHours: number, trackedSeconds: number) => {
  const hasEst = estimateHours > 0;
  const hasTracked = trackedSeconds > 0;
  const est = hasEst ? `${estimateHours}h` : null;
  const tracked = hasTracked ? fmtHM(trackedSeconds) : null;

  if (!hasEst || !hasTracked) {
    return { est, tracked, delayText: "—", delayColor: "var(--text-slate-400)" };
  }
  const deltaSec = trackedSeconds - estimateHours * 3600;
  if (deltaSec > 60) return { est, tracked, delayText: `+${fmtHM(deltaSec)}`, delayColor: "#ef4444" };
  if (deltaSec < -60) return { est, tracked, delayText: `−${fmtHM(-deltaSec)}`, delayColor: "#10b981" };
  return { est, tracked, delayText: "On time", delayColor: "#10b981" };
};

interface FlatTicket extends TimelineTicket {
  monthKey: string;
  monthLabel: string;
  monthSort: number;
  memberKey: string;
  memberLabel: string;
}

export const TimelineTree: React.FC<TimelineTreeProps> = ({ tickets, hideColumnHeader, hideToolbar, pointsOf, onPointsInfo, hideAvatar, flatView }) => {
  const { open: openTicket } = useTicketDrawer();
  const [groupBy, setGroupBy] = useState<"month" | "member">("month");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Assignee filter options (unique assignees across the tickets).
  const assigneeOptions = useMemo(() => {
    const byKey = new Map<string, { value: string; label: string; avatarUrl?: string | null }>();
    (tickets || []).forEach((t) => {
      const key = t.assigneeName || "__unassigned__";
      if (!byKey.has(key)) {
        byKey.set(key, {
          value: key,
          label: t.assigneeName || "Unassigned",
          avatarUrl: t.assigneeAvatar,
        });
      }
    });
    return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [tickets]);

  const filteredTickets = useMemo(
    () => (!assignee ? tickets || [] : (tickets || []).filter((t) => (t.assigneeName || "__unassigned__") === assignee)),
    [tickets, assignee]
  );

  const flat = useMemo<FlatTicket[]>(() => {
    return filteredTickets.map((t) => {
      const anchor = t.timelineAnchor || t.startDate || t.dueDate || t.endDate;
      const m = anchor ? dayjs(anchor as any) : null;
      return {
        ...t,
        monthKey: m ? m.format("YYYY-MM") : "undated",
        monthLabel: m ? m.format("MMMM YYYY") : "Undated",
        monthSort: m ? m.startOf("month").valueOf() : -1,
        memberKey: t.assigneeName || "__unassigned__",
        memberLabel: t.assigneeName || "Unassigned",
      };
    });
  }, [filteredTickets]);

  const avatarFor = useMemo(() => {
    const m = new Map<string, string | null>();
    flat.forEach((t) => {
      if (!m.has(t.memberKey)) m.set(t.memberKey, t.assigneeAvatar);
    });
    return m;
  }, [flat]);

  // Build two-level grouping based on the active axis.
  const groups = useMemo(() => {
    const outerOf = (t: FlatTicket) =>
      groupBy === "month"
        ? { key: t.monthKey, label: t.monthLabel, sort: -t.monthSort }
        : { key: t.memberKey, label: t.memberLabel, sort: 0 };
    const innerOf = (t: FlatTicket) =>
      groupBy === "month"
        ? { key: t.memberKey, label: t.memberLabel }
        : { key: t.monthKey, label: t.monthLabel, sort: -t.monthSort };

    const outerMap = new Map<
      string,
      { key: string; label: string; sort: number; inner: Map<string, { key: string; label: string; sort: number; items: FlatTicket[] }> }
    >();

    flat.forEach((t) => {
      const o = outerOf(t);
      const i = innerOf(t) as any;
      if (!outerMap.has(o.key)) outerMap.set(o.key, { ...o, inner: new Map() });
      const oEntry = outerMap.get(o.key)!;
      if (!oEntry.inner.has(i.key)) oEntry.inner.set(i.key, { key: i.key, label: i.label, sort: i.sort ?? 0, items: [] });
      oEntry.inner.get(i.key)!.items.push(t);
    });

    return Array.from(outerMap.values())
      .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))
      .map((o) => ({
        ...o,
        innerGroups: Array.from(o.inner.values()).sort(
          (a, b) => a.sort - b.sort || b.items.length - a.items.length
        ),
      }));
  }, [flat, groupBy]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    groups.forEach((o) => {
      keys.push(o.key);
      o.innerGroups.forEach((i) => keys.push(`${o.key}::${i.key}`));
    });
    return keys;
  }, [groups]);

  const allCollapsed = collapsed.size >= allKeys.length && allKeys.length > 0;

  if ((tickets || []).length === 0) {
    return (
      <div className="tl-card">
        <div style={{ padding: "48px 0" }}>
          <NoData description={<Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No tickets to chart on the timeline</Text>} />
        </div>
      </div>
    );
  }

  const renderTicket = (t: TimelineTicket) => {
    const meta = statusMeta(t.status);
    const eff = effortMeta(t.estimateHours || 0, t.trackedSeconds || 0);
    return (
      <div key={t.id} className="tl-ticket">
        <span className="tl-guide" />
        <div className="tl-ticket-main">
          <span className="tl-dot" style={{ background: meta.color }} />
          <Tooltip title="Open ticket details">
            <button type="button" className="tl-num" onClick={() => openTicket(t.id)}>
              {t.ticketNumber}
            </button>
          </Tooltip>
          <Tooltip title={t.title}>
            <button type="button" className="tl-title" onClick={() => openTicket(t.id)}>
              {t.title}
            </button>
          </Tooltip>
          {t.sprintName && <span className="tl-sprint">{t.sprintName}</span>}
        </div>
        <span className="tl-col" style={{ textTransform: "capitalize" }}>{t.type || "—"}</span>
        <span className="tl-col">{fmtDate(t.startDate)}</span>
        <span className="tl-col">{fmtDate(t.endDate || t.dueDate)}</span>
        <span className="tl-col" style={!eff.est ? { color: "var(--text-slate-400)" } : undefined}>
          {eff.est || "No est"}
        </span>
        {eff.tracked ? (
          <span className="tl-col" style={{ color: "var(--text-slate-700)", fontWeight: 600 }}>
            {eff.tracked}
          </span>
        ) : (
          <Tooltip title="No time tracked">
            <span className="tl-col" style={{ color: "var(--text-slate-400)" }}>
              No time
            </span>
          </Tooltip>
        )}
        <span className="tl-col" style={{ color: eff.delayColor, fontWeight: 700 }}>
          {eff.delayText}
        </span>
        {pointsOf && (() => {
          const pm = pointMeta(pointsOf(t));
          return (
            <span className="tl-col" style={{ color: pm.color, fontWeight: 700 }}>
              {pm.text}
            </span>
          );
        })()}
        <span className="tl-status-col">
          <span className="tl-status" style={{ color: meta.color, background: `${meta.color}14` }}>
            {meta.icon}
            {meta.label}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div className="tl-card">
      {/* Toolbar */}
      {!hideToolbar && (
      <div className="tl-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="tl-toolbar-ic">
            <CalendarOutlined />
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-slate-900)" }}>Timeline</Text>
            <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>
              {flat.length} tickets · grouped by {groupBy}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <SearchableDropdown
            placeholder="All assignees"
            searchPlaceholder="Search members"
            itemNoun="members"
            value={assignee ?? undefined}
            onChange={(v) => setAssignee(v ?? null)}
            options={assigneeOptions}
            width={240}
          />
          <div className="tl-seg">
            <button className={groupBy === "month" ? "is-active" : ""} onClick={() => setGroupBy("month")}>
              By Month
            </button>
            <button className={groupBy === "member" ? "is-active" : ""} onClick={() => setGroupBy("member")}>
              By Member
            </button>
          </div>
          <button
            className="tl-ghost"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(allKeys))}
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
        </div>
      </div>
      )}

      {/* Column header */}
      {!hideColumnHeader && (
        <div className="tl-colhead">
          <span className="tl-h-main">
            {groupBy === "month" ? "Month / Member / Ticket" : "Member / Month / Ticket"}
            {onPointsInfo && (
              <button type="button" className="tl-pts-info" onClick={onPointsInfo}>
                <InfoCircleOutlined /> How points work
              </button>
            )}
          </span>
          <span className="tl-col">Type</span>
          <span className="tl-col">Start</span>
          <span className="tl-col">End</span>
          <span className="tl-col">Est</span>
          <span className="tl-col">Tracked</span>
          <span className="tl-col">Delay</span>
          {pointsOf && <span className="tl-col">Points</span>}
          <span className="tl-status-col">Status</span>
        </div>
      )}

      {/* Tree */}
      <div className="tl-body">
        {groups.length === 0 && (
          <div style={{ padding: "40px 0" }}>
            <NoData description={<Text style={{ color: "var(--text-slate-400)" }}>No matches found</Text>} />
          </div>
        )}
        
        {flatView ? (
          <div className="tl-tickets" style={{ paddingLeft: 0, border: "none" }}>
            {flat.map((t) => renderTicket(t))}
          </div>
        ) : (
          groups.map((o) => {
            const ticketCount = o.innerGroups.reduce((acc, i) => acc + i.items.length, 0);
            const oOpen = !collapsed.has(o.key);
            const isMemberOuter = groupBy === "member";
            return (
              <div key={o.key} className="tl-month">
                <button className="tl-month-head" onClick={() => toggle(o.key)}>
                  <RightOutlined className={`tl-chev ${oOpen ? "open" : ""}`} />
                  {!hideAvatar && isMemberOuter && (
                    <Avatar
                      shape="square"
                      size={22}
                      src={avatarFor.get(o.key) || undefined}
                      style={{ background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 6 }}
                    >
                      {o.label.substring(0, 2).toUpperCase()}
                    </Avatar>
                  )}
                  <span className="tl-month-title">{o.label}</span>
                  <span className="tl-badge">{ticketCount} tickets</span>
                  <span className="tl-badge tl-badge--soft">{o.innerGroups.length} {isMemberOuter ? "months" : "members"}</span>
                </button>

                {oOpen && (
                  <div className="tl-month-body">
                    {o.innerGroups.map((i) => {
                      const ikey = `${o.key}::${i.key}`;
                      const iOpen = !collapsed.has(ikey);
                      const innerIsMember = groupBy === "month";
                      const done = i.items.filter((t) => statusMeta(t.status).label === "Done").length;
                      return (
                        <div key={ikey} className="tl-member">
                          <button className="tl-member-head" onClick={() => toggle(ikey)}>
                            <RightOutlined className={`tl-chev sm ${iOpen ? "open" : ""}`} />
                            {!hideAvatar && innerIsMember && (
                              <Avatar
                                shape="square"
                                size={20}
                                src={avatarFor.get(i.key) || undefined}
                                style={{ background: "#3b82f6", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 5 }}
                              >
                                {i.label.substring(0, 2).toUpperCase()}
                              </Avatar>
                            )}
                            <span className="tl-member-name">{i.label}</span>
                            <span className="tl-mini">{i.items.length}</span>
                            <span className="tl-progress-mini">
                              <span style={{ width: `${(done / i.items.length) * 100}%` }} />
                            </span>
                            <span className="tl-done-txt">{done}/{i.items.length} done</span>
                          </button>

                          {iOpen && (
                            <div className="tl-tickets">
                              {i.items.map((t) => renderTicket(t))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style jsx global>{`
        .tl-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        .tl-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 10px;
          flex-shrink: 0;
        }
        .tl-toolbar-ic {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #3b82f612;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .tl-seg {
          display: inline-flex;
          gap: 2px;
          padding: 3px;
          border-radius: 9px;
          background: var(--bg-slate-100, #f1f5f9);
          border: 1px solid var(--border-slate-200);
        }
        .tl-seg button {
          height: 28px;
          padding: 0 12px;
          border: none;
          border-radius: 7px;
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-500);
          transition: all 0.12s ease;
        }
        .tl-seg button:hover {
          color: var(--text-slate-900);
        }
        .tl-seg button.is-active {
          background: var(--bg-pure-white);
          color: #3b82f6;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
        }
        .tl-ghost {
          height: 28px;
          padding: 0 12px;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .tl-ghost:hover {
          color: #3b82f6;
          border-color: #bfdbfe;
        }

        /* Column header + shared right columns */
        .tl-colhead {
          display: flex;
          align-items: stretch;
          padding: 0 16px 0 0;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .tl-h-main {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px 9px 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .tl-pts-info {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: #3b82f6;
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: none;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-pts-info:hover {
          background: var(--bg-blue-50);
          border-color: #bfdbfe;
        }
        .tl-col {
          width: 70px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          font-size: 12px;
          color: var(--text-slate-600);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          border-left: 1px solid var(--border-slate-100);
        }
        .tl-colhead .tl-col,
        .tl-colhead .tl-status-col {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .tl-status-col {
          width: 132px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 6px 0 12px;
          border-left: 1px solid var(--border-slate-100);
        }

        .tl-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }

        /* Month (outer) */
        .tl-month {
          border-bottom: 1px solid var(--border-slate-100);
        }
        .tl-month:last-child {
          border-bottom: none;
        }
        .tl-month-head {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.12s ease;
        }
        .tl-month-head:hover {
          background: var(--bg-slate-50);
        }
        .tl-month-title {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }
        .tl-badge {
          font-size: 10.5px;
          font-weight: 700;
          color: #3b82f6;
          background: var(--bg-blue-50);
          border-radius: 999px;
          padding: 1px 9px;
        }
        .tl-badge--soft {
          color: var(--text-slate-500);
          background: var(--bg-slate-100, #f1f5f9);
        }

        .tl-month-body {
          padding: 0 0 6px 0;
        }

        /* Member (inner) */
        .tl-member {
          margin: 0 12px 2px 30px;
          border-left: 1.5px solid var(--border-slate-200);
          padding-left: 4px;
        }
        .tl-member-head {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 7px 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          border-radius: 7px;
          transition: background 0.12s ease;
        }
        .tl-member-head:hover {
          background: var(--bg-slate-50);
        }
        .tl-member-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-800, #334155);
        }
        .tl-mini {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-500);
          background: var(--bg-slate-100, #f1f5f9);
          border-radius: 999px;
          padding: 0 7px;
          min-width: 18px;
          text-align: center;
        }
        .tl-progress-mini {
          width: 60px;
          height: 4px;
          border-radius: 999px;
          background: var(--border-slate-200);
          overflow: hidden;
          margin-left: auto;
        }
        .tl-progress-mini > span {
          display: block;
          height: 100%;
          background: #10b981;
          border-radius: 999px;
        }
        .tl-done-txt {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-400);
          min-width: 64px;
          text-align: right;
        }

        /* Tickets (leaf) */
        .tl-tickets {
          display: flex;
          flex-direction: column;
        }
        .tl-ticket {
          position: relative;
          display: flex;
          align-items: stretch;
          padding: 0 16px 0 0;
          border-top: 1px solid var(--border-slate-100);
          transition: background 0.12s ease;
        }
        .tl-tickets > .tl-ticket:first-child {
          border-top: none;
        }
        .tl-ticket:hover {
          background: var(--bg-slate-50);
        }
        .tl-guide {
          position: absolute;
          left: 4px;
          top: 50%;
          width: 12px;
          height: 1.5px;
          background: var(--border-slate-200);
        }
        .tl-ticket-main {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px 8px 22px;
        }
        .tl-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tl-num {
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          flex-shrink: 0;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }
        .tl-num:hover {
          text-decoration: underline;
        }
        .tl-title {
          font-size: 12.5px;
          color: var(--text-slate-700);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          text-align: left;
          min-width: 0;
        }
        .tl-title:hover {
          color: #3b82f6;
        }
        .tl-sprint {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-slate-400);
          background: var(--bg-slate-100, #f1f5f9);
          border-radius: 5px;
          padding: 1px 7px;
          flex-shrink: 0;
        }
        .tl-ongoing {
          font-size: 8.5px;
          font-weight: 700;
          color: #3b82f6;
          background: var(--bg-blue-50);
          border-radius: 4px;
          padding: 0 4px;
          margin-left: 4px;
          text-transform: uppercase;
          vertical-align: middle;
        }
        .tl-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .tl-status .anticon {
          font-size: 9px;
        }

        .tl-chev {
          font-size: 11px;
          color: var(--text-slate-400);
          transition: transform 0.15s ease;
          flex-shrink: 0;
        }
        .tl-chev.sm {
          font-size: 10px;
        }
        .tl-chev.open {
          transform: rotate(90deg);
        }

        @media (max-width: 760px) {
          .tl-col {
            width: 56px;
            font-size: 11px;
          }
          .tl-status-col {
            width: 40px;
          }
          .tl-status span:not(.anticon) {
            display: none;
          }
          .tl-sprint,
          .tl-done-txt {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
