"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FireOutlined,
  MessageOutlined,
  PaperClipOutlined,
  UserOutlined,
  AppstoreOutlined,
  RightOutlined,
  WarningOutlined,
  StarOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  DownOutlined,
  MoreOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Ticket, RecentCommentRow, RecentAttachmentRow, OverdueTicketRow } from "@/services/ticketService";
import { getTypeColor } from "@/utils/ticketUtils";

dayjs.extend(relativeTime);

interface TicketSidebarProps {
  activeSprint: { id?: string; version?: string; name?: string; endDate?: string; startDate?: string } | null;
  overallSprintTickets: Ticket[];
  totalBacklog: number;
  myBacklogCount?: number;
  currentUserId?: string;
  currentUserName?: string;
  typeOptions: Array<{ label: string; value: string }>;
  recentComments: RecentCommentRow[];
  recentAttachments: RecentAttachmentRow[];
  overdueTickets: OverdueTicketRow[];
  activeSection: "sprint" | "backlog" | "filtered" | null;
  isMySprintActive: boolean;
  isMyBacklogActive: boolean;
  commentedFilterActive: boolean;
  attachedFilterActive: boolean;
  overdueFilterActive: boolean;
  onNavigate: (section: "sprint" | "backlog") => void;
  onShowMySprintTickets: () => void;
  onShowMyBacklog: () => void;
  onShowCommentedTickets: () => void;
  onShowAttachedTickets: () => void;
  onShowOverdueTickets: () => void;
  onTicketClick: (ticketId: string) => void;
}

const SECTION_ICON_SIZE = 10;
const ACTIVITY_PREVIEW_LIMIT = 2;

function formatActivityTime(iso: string): string {
  const d = dayjs(iso);
  if (!d.isValid()) return "";
  return d.format("MMM D, h:mm A, YYYY");
}

export default function TicketSidebar({
  activeSprint,
  overallSprintTickets,
  totalBacklog,
  myBacklogCount = 0,
  currentUserId,
  currentUserName,
  typeOptions,
  recentComments,
  recentAttachments,
  overdueTickets,
  activeSection,
  isMySprintActive,
  isMyBacklogActive,
  commentedFilterActive,
  attachedFilterActive,
  overdueFilterActive,
  onShowOverdueTickets,
  onShowCommentedTickets,
  onShowAttachedTickets,
  onNavigate,
  onShowMySprintTickets,
  onShowMyBacklog,
  onTicketClick,
}: TicketSidebarProps) {
  // ── My sprint tickets (current user only, unfiltered sprint pool) ──
  // Tolerate whitespace / case differences and fall back to the raw
  // assigneeId field if the populated assignee relation is missing.
  const mySprintTickets = useMemo(() => {
    if (!currentUserId) return [];
    const me = currentUserId.toString().trim().toLowerCase();
    return overallSprintTickets.filter((t) => {
      const aid = (t.assignee?.id || (t as any).assigneeId || "").toString().trim().toLowerCase();
      return aid !== "" && aid === me;
    });
  }, [overallSprintTickets, currentUserId]);

  // ── Your Sprint Contribution stats ──
  const sprintStats = useMemo(() => {
    const completedStatuses = new Set(["completed", "done", "closed", "resolved"]);
    const notStartedStatuses = new Set(["todo", "open", "backlog", "to_do", "not_started", "new"]);
    const total = mySprintTickets.length;
    const storyPoints = mySprintTickets.reduce((sum, t) => sum + (t.storyPoint || 0), 0);
    const completed = mySprintTickets.filter((t) => completedStatuses.has((t.status || "").toLowerCase())).length;
    const notStarted = mySprintTickets.filter((t) => notStartedStatuses.has((t.status || "").toLowerCase())).length;
    return { total, storyPoints, completed, notStarted };
  }, [mySprintTickets]);

  // ── Type breakdown across active sprint (current user's tickets only) ──
  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of mySprintTickets) {
      const key = (t.type || "untyped").toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const ordered = (typeOptions || [])
      .map((opt) => ({
        label: opt.label,
        value: opt.value,
        count: counts.get(String(opt.value).toLowerCase()) || 0,
        color: getTypeColor(String(opt.value)),
      }))
      .filter((row) => row.count > 0);
    counts.forEach((n, key) => {
      if (!(typeOptions || []).some((o) => String(o.value).toLowerCase() === key)) {
        ordered.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value: key, count: n, color: getTypeColor(key) });
      }
    });
    return ordered.sort((a, b) => b.count - a.count);
  }, [mySprintTickets, typeOptions]);

  const hasUser = !!currentUserId;

  // Per-section collapse state. Only Overdue Tickets opens by default; if there
  // are no overdues, Type opens instead. Everything else starts closed.
  // Settles once on first observation of non-empty overdue data so a late-
  // arriving fetch doesn't stomp the user's manual toggles.
  const defaultSettledRef = useRef(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(() => overdueTickets.length === 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [overdueOpen, setOverdueOpen] = useState(() => overdueTickets.length > 0);
  const [typeShowAll, setTypeShowAll] = useState(false);

  useEffect(() => {
    if (defaultSettledRef.current) return;
    if (overdueTickets.length > 0) {
      defaultSettledRef.current = true;
      setOverdueOpen(true);
      setTypeOpen(false);
    }
  }, [overdueTickets.length]);

  const visibleComments = recentComments.slice(0, ACTIVITY_PREVIEW_LIMIT);
  const visibleAttachments = recentAttachments.slice(0, ACTIVITY_PREVIEW_LIMIT);
  const commentedTicketIds = useMemo(
    () => Array.from(new Set(recentComments.map((r) => r.ticket.id))),
    [recentComments]
  );
  const attachedTicketIds = useMemo(
    () => Array.from(new Set(recentAttachments.map((r) => r.ticket.id))),
    [recentAttachments]
  );

  // Contribution stat rows: pair the four numbers into two rows of two.
  const contributionRows: Array<Array<{ label: string; value: number; tone?: "amber" | "green" }>> = [
    [
      { label: "Tickets", value: sprintStats.total },
      { label: "Story Pts", value: sprintStats.storyPoints },
    ],
    [
      { label: "Not Started", value: sprintStats.notStarted, tone: "amber" },
      { label: "Completed", value: sprintStats.completed, tone: "green" },
    ],
  ];

  return (
    <aside className="tl-sidebar">
      <style dangerouslySetInnerHTML={{ __html: TL_SIDEBAR_CSS }} />

      {/* ── Sidebar Head ────────────────────────── */}
      <div className="tl-side-head">
        <div className="tl-side-logo"><ProjectOutlined /></div>
        <div className="tl-side-head-text">
          <div className="tl-side-title">Tickets</div>
          <div className="tl-side-subtitle">Sprint · backlog · insights</div>
        </div>
      </div>

      {/* ── All Tickets section label ────────────────────────── */}
      <div className="tl-side-section-label">All Tickets</div>

      {/* ── Top pinned nav (Sprint, Backlog) ─────────────────── */}
      <nav className="tl-pinned-nav">
        <button
          type="button"
          className={`tl-nav-row ${activeSection === "sprint" && !isMySprintActive ? "active" : ""}`}
          onClick={() => onNavigate("sprint")}
          disabled={!activeSprint}
          title={activeSprint ? "Jump to active sprint" : "No active sprint"}
        >
          <span className="tl-nav-row-icon">
            <ThunderboltOutlined style={{ fontSize: 14 }} />
          </span>
          <span className="tl-nav-row-label">Sprint</span>
          <span className="tl-nav-row-count">{overallSprintTickets.length}</span>
        </button>
        <button
          type="button"
          className={`tl-nav-row ${activeSection === "backlog" && !isMyBacklogActive ? "active" : ""}`}
          onClick={() => onNavigate("backlog")}
        >
          <span className="tl-nav-row-icon">
            <UnorderedListOutlined style={{ fontSize: 14 }} />
          </span>
          <span className="tl-nav-row-label">Backlog</span>
          <span className="tl-nav-row-count">{totalBacklog}</span>
        </button>
      </nav>

      {/* ── Dashed divider between ALL TICKETS and MY CORE ───── */}
      <div className="tl-sidebar-divider-blue" aria-hidden />

      {/* ── My Core section ──────────────────────────────────── */}
      <div className="tl-side-section-label">My Core</div>
      <div className="tl-groups">
        <button
          type="button"
          className={`tl-group-row tl-group-row-leaf ${isMySprintActive ? "active" : ""}`}
          onClick={onShowMySprintTickets}
          disabled={!hasUser}
          title={hasUser ? "Show tickets assigned to you in the active sprint" : "Sign in to use this filter"}
        >
          <span className="tl-group-icon">
            <ThunderboltOutlined style={{ fontSize: 13 }} />
          </span>
          <span className="tl-group-label">My Sprint Tickets</span>
          <span className="tl-group-count">{mySprintTickets.length}</span>
        </button>
        <button
          type="button"
          className={`tl-group-row tl-group-row-leaf ${isMyBacklogActive ? "active" : ""}`}
          onClick={onShowMyBacklog}
          disabled={!hasUser}
          title={hasUser ? "Show tickets assigned to you in the backlog" : "Sign in to use this filter"}
        >
          <span className="tl-group-icon">
            <UnorderedListOutlined style={{ fontSize: 13 }} />
          </span>
          <span className="tl-group-label">My Backlog Tickets</span>
          <span className="tl-group-count">{myBacklogCount}</span>
        </button>
      </div>

      {/* ── Blue cutting divider between MY CORE and SPRINT INSIGHTS ── */}
      <div className="tl-sidebar-divider-blue" aria-hidden />

      {/* ── Sprint Insights section ──────────────────────────── */}
      <div className="tl-side-section-label">Sprint Insights</div>

      {/* ── Expandable group tree ────────────────────────────── */}
      <div className="tl-groups">
        {/* Your Sprint Contribution */}
        <div className="tl-group">
          <button
            type="button"
            className="tl-group-row"
            onClick={() => setContribOpen((v) => !v)}
            aria-expanded={contribOpen}
          >
            <span className="tl-group-icon">
              <StarOutlined style={{ fontSize: 13 }} />
            </span>
            <span className="tl-group-label">Your Sprint Contribution</span>
            <DownOutlined
              className={`tl-group-caret ${contribOpen ? 'open' : 'closed'}`}
              style={{ fontSize: 9 }}
            />
          </button>
          {contribOpen && (
            <div className="tl-group-children">
              {hasUser ? (
                <div className="tl-contrib">
                  {contributionRows.map((row, ri) => (
                    <React.Fragment key={ri}>
                      <div className="tl-contrib-row">
                        {row.map((cell, ci) => (
                          <React.Fragment key={cell.label}>
                            <div className="tl-contrib-cell">
                              <div className="tl-contrib-label">{cell.label}</div>
                              <div className={`tl-contrib-value ${cell.tone ? `tl-contrib-value-${cell.tone}` : ""}`}>
                                {cell.value}
                              </div>
                            </div>
                            {ci === 0 && <div className="tl-contrib-vsep" aria-hidden />}
                          </React.Fragment>
                        ))}
                      </div>
                      {ri < contributionRows.length - 1 && <div className="tl-contrib-hsep" aria-hidden />}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="tl-sidebar-empty">Sign in to see your contribution</div>
              )}
            </div>
          )}
        </div>

        {/* Overdue Tickets */}
        <div className="tl-group">
          <button
            type="button"
            className="tl-group-row"
            onClick={() => setOverdueOpen((v) => !v)}
            aria-expanded={overdueOpen}
          >
            <span className="tl-group-icon" style={{ color: overdueTickets.length > 0 ? '#dc2626' : undefined }}>
              <WarningOutlined style={{ fontSize: 13 }} />
            </span>
            <span className="tl-group-label">Overdue Tickets</span>
            <span className={`tl-group-count ${overdueTickets.length > 0 ? 'is-warn' : ''}`}>
              {overdueTickets.length}
            </span>
            <DownOutlined
              className={`tl-group-caret ${overdueOpen ? 'open' : 'closed'}`}
              style={{ fontSize: 9 }}
            />
          </button>
          {overdueOpen && (
            <div className="tl-group-children">
              {overdueTickets.length === 0 ? (
                <div className="tl-sidebar-empty">Nothing overdue · nice work</div>
              ) : (
                <>
                  <div className="tl-activity-list">
                    {overdueTickets.slice(0, ACTIVITY_PREVIEW_LIMIT).map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className="tl-activity-row tl-activity-row-warn tl-overdue-row"
                        onClick={() => onTicketClick(row.id)}
                        title={`${row.ticketNumber} · ${row.daysOverdue} day${row.daysOverdue === 1 ? '' : 's'} overdue${row.endDate ? ` · due ${dayjs(row.endDate).format('MMM D')}` : ''}`}
                      >
                        <span className="tl-overdue-dot" />
                        <span className="tl-overdue-num">{row.ticketNumber}</span>
                        <span className="tl-overdue-days">{row.daysOverdue}d</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`tl-activity-cta ${overdueFilterActive ? "active" : ""}`}
                    onClick={onShowOverdueTickets}
                  >
                    {overdueFilterActive ? "Clear · show all tickets" : "Show overdue tickets"}
                    <RightOutlined style={{ fontSize: 10 }} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Type Breakdown */}
        <div className="tl-group">
          <button
            type="button"
            className="tl-group-row"
            onClick={() => setTypeOpen((v) => !v)}
            aria-expanded={typeOpen}
          >
            <span className="tl-group-icon">
              <FireOutlined style={{ fontSize: 13 }} />
            </span>
            <span className="tl-group-label">Type</span>
            <span className="tl-group-count">{mySprintTickets.length}</span>
            <DownOutlined
              className={`tl-group-caret ${typeOpen ? 'open' : 'closed'}`}
              style={{ fontSize: 9 }}
            />
          </button>
          {typeOpen && (
            <div className="tl-group-children">
              {typeBreakdown.length === 0 ? (
                <div className="tl-sidebar-empty">
                  {hasUser ? 'No tickets assigned to you in active sprint' : 'Sign in to see your tickets'}
                </div>
              ) : (
                <>
                  <div className="tl-type-list">
                    {(typeShowAll ? typeBreakdown : typeBreakdown.slice(0, 3)).map((row) => (
                      <div key={row.value} className="tl-type-line" title={`${row.label} · ${row.count}`}>
                        <span className="tl-type-dot" style={{ background: row.color }} />
                        <span className="tl-type-name">{row.label}</span>
                        <span className="tl-type-count">{row.count}</span>
                      </div>
                    ))}
                  </div>
                  {typeBreakdown.length > 3 && (
                    <button
                      type="button"
                      className="tl-activity-cta"
                      onClick={() => setTypeShowAll((v) => !v)}
                    >
                      {typeShowAll ? 'Show less' : `Show more types`}
                      <RightOutlined style={{ fontSize: 10 }} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Comments Added */}
        <div className="tl-group">
          <button
            type="button"
            className="tl-group-row"
            onClick={() => setCommentsOpen((v) => !v)}
            aria-expanded={commentsOpen}
          >
            <span className="tl-group-icon">
              <MessageOutlined style={{ fontSize: 13 }} />
            </span>
            <span className="tl-group-label">Comments Added</span>
            <span className="tl-group-count">{recentComments.length}</span>
            <DownOutlined
              className={`tl-group-caret ${commentsOpen ? 'open' : 'closed'}`}
              style={{ fontSize: 9 }}
            />
          </button>
          {commentsOpen && (
            <div className="tl-group-children">
              {visibleComments.length === 0 ? (
                <div className="tl-sidebar-empty">No recent comments</div>
              ) : (
                <div className="tl-activity-list">
                  {visibleComments.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="tl-activity-row"
                      onClick={() => onTicketClick(row.ticket.id)}
                      title={`${row.user?.name || "Someone"} · ${row.ticket.ticketNumber}`}
                    >
                      <Avatar
                        size={22}
                        src={row.user?.avatarUrl || undefined}
                        style={{ background: "var(--bg-slate-100)", color: "var(--text-slate-600)", fontSize: 10, flexShrink: 0 }}
                      >
                        {(row.user?.name || "?").charAt(0).toUpperCase()}
                      </Avatar>
                      <div className="tl-activity-body">
                        <div className="tl-activity-line1">
                          <span className="tl-activity-user">{row.user?.name || "Someone"}</span>
                        </div>
                        <div className="tl-activity-line2">
                          <span className="tl-activity-id">{row.ticket.ticketNumber}</span>
                          <span className="tl-activity-sep">·</span>
                          <span>{formatActivityTime(row.timestamp)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {commentedTicketIds.length > 0 && (
                <button
                  type="button"
                  className={`tl-activity-cta ${commentedFilterActive ? "active" : ""}`}
                  onClick={() => onShowCommentedTickets()}
                >
                  {commentedFilterActive ? "Clear · show all tickets" : "Show commented tickets"}
                  <RightOutlined style={{ fontSize: 10 }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Attachments Added */}
        <div className="tl-group">
          <button
            type="button"
            className="tl-group-row"
            onClick={() => setAttachmentsOpen((v) => !v)}
            aria-expanded={attachmentsOpen}
          >
            <span className="tl-group-icon">
              <PaperClipOutlined style={{ fontSize: 13 }} />
            </span>
            <span className="tl-group-label">Attachments Added</span>
            <span className="tl-group-count">{recentAttachments.length}</span>
            <DownOutlined
              className={`tl-group-caret ${attachmentsOpen ? 'open' : 'closed'}`}
              style={{ fontSize: 9 }}
            />
          </button>
          {attachmentsOpen && (
            <div className="tl-group-children">
              {visibleAttachments.length === 0 ? (
                <div className="tl-sidebar-empty">No recent attachments</div>
              ) : (
                <div className="tl-activity-list">
                  {visibleAttachments.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="tl-activity-row"
                      onClick={() => onTicketClick(row.ticket.id)}
                      title={`${row.uploadedBy?.name || "Someone"} · ${row.ticket.ticketNumber}`}
                    >
                      <Avatar
                        size={22}
                        src={row.uploadedBy?.avatarUrl || undefined}
                        style={{ background: "var(--bg-slate-100)", color: "var(--text-slate-600)", fontSize: 10, flexShrink: 0 }}
                      >
                        {(row.uploadedBy?.name || "?").charAt(0).toUpperCase()}
                      </Avatar>
                      <div className="tl-activity-body">
                        <div className="tl-activity-line1">
                          <span className="tl-activity-user">{row.uploadedBy?.name || "Someone"}</span>
                        </div>
                        <div className="tl-activity-line2">
                          <span className="tl-activity-id">{row.ticket.ticketNumber}</span>
                          <span className="tl-activity-sep">·</span>
                          <span>{formatActivityTime(row.uploadedAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {attachedTicketIds.length > 0 && (
                <button
                  type="button"
                  className={`tl-activity-cta ${attachedFilterActive ? "active" : ""}`}
                  onClick={() => onShowAttachedTickets()}
                >
                  {attachedFilterActive ? "Clear · show all tickets" : "Show tickets with attachments"}
                  <RightOutlined style={{ fontSize: 10 }} />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}

const TL_SIDEBAR_CSS = `
.tl-sidebar {
  background: var(--bg-pure-white) !important;
  border-right: 1px solid var(--border-slate-200) !important;
  /* Symmetric side padding on both left and right edges. */
  padding: 14px 14px 16px 14px !important;
  position: sticky;
  top: 0 !important;
  height: calc(100vh - 54px) !important;
  overflow-y: auto;
  align-self: start;
  display: flex;
  flex-direction: column;
}
[data-theme='dark'] .tl-sidebar {
  background: var(--bg-pure-white) !important;
  border-right-color: var(--border-slate-200) !important;
}
.tl-sidebar::-webkit-scrollbar {
  width: 5px;
}
.tl-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-slate-200);
  border-radius: 3px;
}

/* ── Sidebar Head ── */
.tl-side-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 2px 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-slate-100);
}
.tl-side-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-side-logo .anticon {
  font-size: 20px !important;
  color: var(--text-slate-900) !important;
}
[data-theme='dark'] .tl-side-logo .anticon {
  color: #cbd5e1 !important;
}
.tl-side-head-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tl-side-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-slate-900);
  letter-spacing: -0.025em;
  line-height: 1.1;
}
[data-theme='dark'] .tl-side-title {
  color: #f1f5f9;
}
.tl-side-subtitle {
  font-size: 10.5px;
  color: var(--text-slate-400);
  font-weight: 700;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

/* ── Top pinned nav (flat rows: Sprint, Backlog) ───────────── */
.tl-pinned-nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px 0 4px;
}
.tl-nav-row,
.tl-group-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 10px !important;
  border-radius: 8px !important;
  border: none !important;
  background: transparent !important;
  cursor: pointer;
  transition: background .12s ease;
  text-align: left;
  color: var(--text-slate-700) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  height: auto !important;
}
[data-theme='dark'] .tl-nav-row,
[data-theme='dark'] .tl-group-row {
  color: #cbd5e1 !important;
}

.tl-nav-row:hover:not(:disabled),
.tl-group-row:hover:not(:disabled) {
  background: var(--bg-slate-50) !important;
  color: var(--text-slate-900) !important;
}
[data-theme='dark'] .tl-nav-row:hover:not(:disabled),
[data-theme='dark'] .tl-group-row:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #f1f5f9 !important;
}

.tl-nav-row.active,
.tl-group-row.active {
  background: var(--bg-blue-50) !important;
  color: var(--text-slate-900) !important;
  font-weight: 600 !important;
}
[data-theme='dark'] .tl-nav-row.active,
[data-theme='dark'] .tl-group-row.active {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #93c5fd !important;
}

.tl-nav-row-icon,
.tl-group-icon {
  font-size: 14px;
  width: 16px;
  display: inline-flex;
  justify-content: center;
  color: var(--text-slate-400) !important;
  flex-shrink: 0;
}
.tl-nav-row.active .tl-nav-row-icon,
.tl-group-row.active .tl-group-icon {
  color: #3B82F6 !important;
}
[data-theme='dark'] .tl-nav-row.active .tl-nav-row-icon,
[data-theme='dark'] .tl-group-row.active .tl-group-icon {
  color: #93c5fd !important;
}

.tl-nav-row-label,
.tl-group-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
}

.tl-nav-row-count,
.tl-group-count {
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: var(--text-slate-400) !important;
  min-width: 18px;
  text-align: right;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  line-height: normal !important;
}
.tl-nav-row.active .tl-nav-row-count,
.tl-group-row.active .tl-group-count {
  color: #3B82F6 !important;
  font-weight: 700 !important;
  background: rgba(59, 130, 246, 0.12) !important;
  border-radius: 6px !important;
  padding: 1px 7px !important;
  min-width: 0 !important;
  text-align: center !important;
}
[data-theme='dark'] .tl-nav-row.active .tl-nav-row-count,
[data-theme='dark'] .tl-group-row.active .tl-group-count {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.22) !important;
}

/* ── Section label ── */
.tl-side-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-slate-400);
  padding: 0 8px;
  margin: 12px 0 4px;
}
.tl-sidebar > .tl-side-section-label:first-of-type {
  margin-top: 6px;
}

/* ── Dashed cutting divider between sections ──────────────── */
.tl-sidebar-divider-blue {
  display: none !important;
}

/* Children of an expanded group */
.tl-group-children {
  margin: 1px 0 4px 8px;
  padding: 2px 0 2px 6px;
  border-left: 1px solid var(--border-slate-200);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
[data-theme='dark'] .tl-group-children {
  border-left-color: #2d3748 !important;
}

.tl-sidebar-empty {
  padding: 6px 4px;
  font-size: 11px;
  color: var(--text-slate-400);
  font-style: italic;
}

/* ── Your Sprint Contribution ── */
.tl-contrib {
  padding: 0 2px;
}
.tl-contrib-row {
  display: flex;
  align-items: stretch;
  width: 100%;
}
.tl-contrib-cell {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 4px;
}
.tl-contrib-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-slate-600);
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-theme='dark'] .tl-contrib-label {
  color: #cbd5e1 !important;
}
.tl-contrib-value {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-slate-900);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.015em;
  line-height: 1.1;
}
[data-theme='dark'] .tl-contrib-value {
  color: #f1f5f9 !important;
}
.tl-contrib-value-amber {
  color: #b45309;
}
.tl-contrib-value-green {
  color: #047857;
}
[data-theme='dark'] .tl-contrib-value-amber {
  color: #fbbf24 !important;
}
[data-theme='dark'] .tl-contrib-value-green {
  color: #34d399 !important;
}
.tl-contrib-vsep {
  width: 1px;
  background: var(--border-slate-100);
  margin: 4px 8px;
}
[data-theme='dark'] .tl-contrib-vsep {
  background: #1f2937 !important;
}
.tl-contrib-hsep {
  height: 1px;
  background: var(--border-slate-100);
  margin: 0 2px;
}
[data-theme='dark'] .tl-contrib-hsep {
  background: #1f2937 !important;
}

/* Overdue tickets */
.tl-sidebar-section-count.is-warn {
  background: rgba(239, 68, 68, 0.10);
  border-color: rgba(239, 68, 68, 0.28);
  color: #b91c1c;
}
[data-theme='dark'] .tl-sidebar-section-count.is-warn {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.38);
  color: #fca5a5;
}
.tl-overdue-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.22);
  color: #dc2626;
  flex-shrink: 0;
}
[data-theme='dark'] .tl-overdue-icon {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}
.tl-activity-line2-warn {
  color: #b91c1c !important;
  font-weight: 700 !important;
}
.tl-activity-line2-warn b {
  color: #991b1b;
  font-weight: 800;
}
[data-theme='dark'] .tl-activity-line2-warn {
  color: #fca5a5 !important;
}
[data-theme='dark'] .tl-activity-line2-warn b {
  color: #fecaca;
}
.tl-activity-row-warn:hover {
  background: rgba(239, 68, 68, 0.05) !important;
  border-color: rgba(239, 68, 68, 0.22) !important;
}
[data-theme='dark'] .tl-activity-row-warn:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  border-color: rgba(239, 68, 68, 0.35) !important;
}

.tl-overdue-row {
  align-items: center !important;
  gap: 8px !important;
  padding: 5px 8px !important;
}
.tl-overdue-dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}
.tl-overdue-num {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-slate-900);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-theme='dark'] .tl-overdue-num {
  color: #f1f5f9;
}
.tl-overdue-days {
  flex: 0 0 auto;
  font-size: 10.5px;
  font-weight: 800;
  color: #b91c1c;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}
[data-theme='dark'] .tl-overdue-days {
  color: #fca5a5;
}

/* ── At Risk banner ── */
.tl-risk-banner {
  margin: 8px 2px 0;
  width: calc(100% - 4px);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.22);
  border-radius: 8px;
  color: #b91c1c;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.tl-risk-banner:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
}
[data-theme='dark'] .tl-risk-banner {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.32) !important;
  color: #fca5a5 !important;
}
.tl-risk-text {
  flex: 1;
  font-size: 11.5px;
  font-weight: 700;
  text-align: left;
}
.tl-risk-text b {
  font-weight: 800;
}

/* ── Type list ── */
.tl-type-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 2px 0 0;
}
.tl-type-line {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 4px;
  border: 0;
  background: transparent;
  position: relative;
}
.tl-type-line + .tl-type-line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 22px;
  right: 4px;
  height: 1px;
  background: var(--border-slate-100);
}
[data-theme='dark'] .tl-type-line + .tl-type-line::before {
  background: #1f2937;
}
.tl-type-line:hover {
  background: transparent;
}
.tl-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.4) inset;
}
[data-theme='dark'] .tl-type-dot {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25) inset;
}
.tl-type-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-slate-700);
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-theme='dark'] .tl-type-name {
  color: #cbd5e1 !important;
}
.tl-type-count {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 11px;
  color: var(--text-slate-500);
  background: transparent;
  border: 0;
  padding: 0 2px;
  line-height: 1.6;
  letter-spacing: 0.02em;
}
[data-theme='dark'] .tl-type-count {
  color: #94a3b8 !important;
}

/* ── Activity rows ── */
.tl-activity-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 2px;
}
.tl-activity-row {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s ease, border-color 0.12s ease;
  min-width: 0;
}
.tl-activity-row:hover {
  background: var(--bg-slate-50);
}
[data-theme='dark'] .tl-activity-row:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}
.tl-activity-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.tl-activity-line1 {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.tl-activity-user {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-slate-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
  min-width: 0;
}
[data-theme='dark'] .tl-activity-user {
  color: #f1f5f9 !important;
}
.tl-activity-id {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-slate-400);
  font-variant-numeric: tabular-nums;
  background: transparent;
  border: 0;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  letter-spacing: 0;
}
[data-theme='dark'] .tl-activity-id {
  color: #64748b !important;
}
.tl-activity-line2 {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-slate-500);
  font-variant-numeric: tabular-nums;
}
.tl-activity-line2 > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.tl-activity-sep {
  flex-shrink: 0;
  color: var(--text-slate-400);
}
[data-theme='dark'] .tl-activity-sep {
  color: #64748b !important;
}

/* CTA button */
.tl-activity-cta {
  margin: 6px 2px 0;
  width: calc(100% - 4px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: 1px dashed var(--border-slate-200);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #3b82f6;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.tl-activity-cta:hover {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.4);
  color: #1d4ed8;
}
.tl-activity-cta.active {
  background: rgba(59, 130, 246, 0.08);
  border-style: solid;
  border-color: rgba(59, 130, 246, 0.32);
  color: #1d4ed8;
}
[data-theme='dark'] .tl-activity-cta {
  border-color: #2d3748 !important;
  color: #60a5fa !important;
}
[data-theme='dark'] .tl-activity-cta:hover {
  background: rgba(59, 130, 246, 0.12) !important;
  border-color: rgba(59, 130, 246, 0.45) !important;
}
[data-theme='dark'] .tl-activity-cta.active {
  background: rgba(59, 130, 246, 0.18) !important;
  border-color: rgba(59, 130, 246, 0.4) !important;
  color: #93c5fd !important;
}

/* ── Responsive (< 1100px): horizontal pill bar ───────────── */
@media (max-width: 1099.98px) {
  .tl-side-head {
    display: none !important;
  }
  .tl-sidebar {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 0 !important;
    height: auto !important;
    overflow-y: hidden !important;
    background: transparent !important;
    border: none !important;
  }
  .tl-sidebar .tl-side-section-label,
  .tl-sidebar .tl-sidebar-divider-blue,
  .tl-sidebar .tl-group-children,
  .tl-sidebar .tl-group-caret,
  .tl-sidebar .tl-group-count.is-warn + .tl-group-caret {
    display: none !important;
  }
  .tl-sidebar .tl-pinned-nav,
  .tl-sidebar .tl-groups {
    display: inline-flex !important;
    flex-direction: row !important;
    gap: 6px !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
  }
  .tl-sidebar .tl-nav-row,
  .tl-sidebar .tl-group-row {
    width: auto !important;
    height: 32px !important;
    padding: 0 12px !important;
    border-radius: 999px !important;
    background: var(--bg-slate-50, #f8fafc) !important;
    border: 1px solid var(--border-slate-200, #e2e8f0) !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    gap: 6px !important;
    display: inline-flex !important;
  }
  .tl-sidebar .tl-nav-row:hover:not(:disabled),
  .tl-sidebar .tl-group-row:hover:not(:disabled) {
    background: var(--bg-pure-white, #ffffff) !important;
    border-color: var(--text-slate-400, #94a3b8) !important;
  }
  [data-theme='dark'] .tl-sidebar .tl-nav-row,
  [data-theme='dark'] .tl-sidebar .tl-group-row {
    background: #111720 !important;
    border-color: #2d3748 !important;
  }
  [data-theme='dark'] .tl-sidebar .tl-nav-row:hover:not(:disabled),
  [data-theme='dark'] .tl-sidebar .tl-group-row:hover:not(:disabled) {
    background: #1c232e !important;
    border-color: #475569 !important;
  }
  .tl-sidebar .tl-nav-row-label,
  .tl-sidebar .tl-group-label {
    font-size: 12.5px !important;
    flex: 0 0 auto !important;
  }
  .tl-sidebar .tl-nav-row-icon,
  .tl-sidebar .tl-group-icon {
    width: 14px !important;
  }
  .tl-sidebar .tl-nav-row-count,
  .tl-sidebar .tl-group-count {
    margin-left: 2px !important;
    padding: 0 6px !important;
    line-height: 1.4 !important;
  }
}
`;
