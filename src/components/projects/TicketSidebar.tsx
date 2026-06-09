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
  onNavigate,
  onShowMySprintTickets,
  onShowMyBacklog,
  onShowCommentedTickets,
  onShowAttachedTickets,
  onShowOverdueTickets,
  onTicketClick,
}: TicketSidebarProps) {
  // ── My sprint tickets (current user only, unfiltered sprint pool) ──
  // Tolerate whitespace / case differences and fall back to the raw
  // assigneeId field if the populated assignee relation is missing.
  const mySprintTickets = useMemo(() => {
    if (!currentUserId) return [];
    const me = currentUserId.trim().toLowerCase();
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

      {/* ── All Tickets section label ────────────────────────── */}
      <div className="tl-section-label">
        <AppstoreOutlined style={{ fontSize: SECTION_ICON_SIZE }} />
        <span className="tl-section-label-text">All Tickets</span>
        <button
          type="button"
          className="tl-section-overflow"
          aria-label="More options"
          title="More options"
        >
          <MoreOutlined style={{ fontSize: 12 }} />
        </button>
      </div>

      {/* ── Top pinned nav (Sprint, Backlog) ─────────────────── */}
      <nav className="tl-pinned-nav">
        <button
          type="button"
          className={`tl-nav-row ${activeSection === "sprint" ? "active" : ""}`}
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
          className={`tl-nav-row ${activeSection === "backlog" ? "active" : ""}`}
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
      <div className="tl-section-label">
        <UserOutlined style={{ fontSize: SECTION_ICON_SIZE }} />
        <span className="tl-section-label-text">My Core</span>
        <button
          type="button"
          className="tl-section-overflow"
          aria-label="More options"
          title="More options"
        >
          <MoreOutlined style={{ fontSize: 12 }} />
        </button>
      </div>
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
          <RightOutlined style={{ fontSize: 9, color: 'currentColor', opacity: 0.6 }} />
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
          <RightOutlined style={{ fontSize: 9, color: 'currentColor', opacity: 0.6 }} />
        </button>
      </div>

      {/* ── Blue cutting divider between MY CORE and SPRINT INSIGHTS ── */}
      <div className="tl-sidebar-divider-blue" aria-hidden />

      {/* ── Sprint Insights section ──────────────────────────── */}
      <div className="tl-section-label">
        <AppstoreOutlined style={{ fontSize: SECTION_ICON_SIZE }} />
        <span className="tl-section-label-text">Sprint Insights</span>
        <button
          type="button"
          className="tl-section-overflow"
          aria-label="More options"
          title="More options"
        >
          <MoreOutlined style={{ fontSize: 12 }} />
        </button>
      </div>

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
  background: var(--bg-slate-50);
  border-right: 1px solid var(--border-slate-200);
  border-top: 1px solid var(--border-slate-200);
  /* Left padding compensates for the outer wrapper's -24px margin overshoot
     so content never falls behind the global side-nav. Right padding stays
     small since the sidebar's own right border is the visible divider. */
  padding: 8px 8px 16px 28px;
  position: sticky;
  top: var(--tl-header-h, 56px);
  height: calc(100vh - 64px - var(--tl-header-h, 56px));
  overflow-y: auto;
  align-self: start;
  scrollbar-width: none;          /* Firefox */
  -ms-overflow-style: none;       /* IE / legacy Edge */
}
[data-theme='dark'] .tl-sidebar {
  background: #0f1419 !important;
  border-right-color: #1f2937 !important;
}
.tl-sidebar::-webkit-scrollbar { width: 0; height: 0; display: none; }

/* ── Top pinned nav (flat rows: Sprint, Backlog) ───────────── */
.tl-pinned-nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px 0 6px;
}
.tl-nav-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-slate-700);
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
  min-width: 0;
}
.tl-nav-row:hover:not(:disabled) { background: var(--bg-slate-100); color: var(--text-slate-900); }
.tl-nav-row:disabled { opacity: 0.45; cursor: not-allowed; }
.tl-nav-row.active {
  background: rgba(59,130,246,0.10);
  color: #1d4ed8;
}
[data-theme='dark'] .tl-nav-row { color: #cbd5e1 !important; }
[data-theme='dark'] .tl-nav-row:hover:not(:disabled) { background: #1c232e !important; color: #f1f5f9 !important; }
[data-theme='dark'] .tl-nav-row.active {
  background: rgba(59,130,246,0.18) !important;
  color: #93c5fd !important;
}
.tl-nav-row-icon {
  width: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-slate-500);
  flex-shrink: 0;
}
.tl-nav-row.active .tl-nav-row-icon { color: #1d4ed8; }
[data-theme='dark'] .tl-nav-row-icon { color: #94a3b8 !important; }
[data-theme='dark'] .tl-nav-row.active .tl-nav-row-icon { color: #93c5fd !important; }
.tl-nav-row-label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.tl-nav-row-count {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-slate-500);
  font-variant-numeric: tabular-nums;
  background: var(--bg-pure-white);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 1.7;
  border: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
.tl-nav-row.active .tl-nav-row-count {
  background: rgba(59,130,246,0.14);
  border-color: rgba(59,130,246,0.25);
  color: #1d4ed8;
}
[data-theme='dark'] .tl-nav-row-count {
  background: #1c232e !important;
  border-color: #2d3748 !important;
  color: #94a3b8 !important;
}
[data-theme='dark'] .tl-nav-row.active .tl-nav-row-count {
  background: rgba(59,130,246,0.22) !important;
  border-color: rgba(59,130,246,0.35) !important;
  color: #93c5fd !important;
}

/* ── Section label (uppercase title + overflow button) ────── */
.tl-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 6px 6px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-slate-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
/* First section label sits flush with the sidebar top — no extra top pad */
.tl-sidebar > .tl-section-label:first-child {
  padding-top: 4px;
}

/* ── Dashed cutting divider between sections ──────────────── */
.tl-sidebar-divider-blue {
  height: 0;
  margin: 12px -4px 4px;
  border-top: 1.5px dashed #94a3b8;
  opacity: 0.6;
}
[data-theme='dark'] .tl-sidebar-divider-blue {
  border-top-color: #64748b;
  opacity: 0.7;
}
[data-theme='dark'] .tl-section-label { color: #94a3b8 !important; }
.tl-section-label-text { flex: 1; min-width: 0; }
.tl-section-overflow {
  background: transparent;
  border: 0;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-slate-400);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s ease, color 0.12s ease;
}
.tl-section-overflow:hover {
  background: var(--bg-slate-100);
  color: var(--text-slate-700);
}
[data-theme='dark'] .tl-section-overflow { color: #64748b !important; }
[data-theme='dark'] .tl-section-overflow:hover { background: #1c232e !important; color: #cbd5e1 !important; }

/* ── Expandable group tree ────────────────────────────────── */
.tl-groups {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.tl-group {
  display: flex;
  flex-direction: column;
}
.tl-group-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-slate-700);
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
  min-width: 0;
}
.tl-group-row:hover:not(:disabled) { background: var(--bg-slate-100); color: var(--text-slate-900); }
.tl-group-row:disabled { opacity: 0.45; cursor: not-allowed; }
.tl-group-row.active {
  background: rgba(59,130,246,0.10);
  color: #1d4ed8;
}
[data-theme='dark'] .tl-group-row { color: #cbd5e1 !important; }
[data-theme='dark'] .tl-group-row:hover:not(:disabled) { background: #1c232e !important; color: #f1f5f9 !important; }
[data-theme='dark'] .tl-group-row.active {
  background: rgba(59,130,246,0.18) !important;
  color: #93c5fd !important;
}
.tl-group-icon {
  width: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-slate-500);
  flex-shrink: 0;
}
.tl-group-row.active .tl-group-icon { color: #1d4ed8; }
[data-theme='dark'] .tl-group-icon { color: #94a3b8 !important; }
[data-theme='dark'] .tl-group-row.active .tl-group-icon { color: #93c5fd !important; }
.tl-group-label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.tl-group-count {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-slate-500);
  font-variant-numeric: tabular-nums;
  background: var(--bg-pure-white);
  border-radius: 999px;
  padding: 0 6px;
  line-height: 1.7;
  border: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .tl-group-count {
  background: #1c232e !important;
  border-color: #2d3748 !important;
  color: #94a3b8 !important;
}
.tl-group-count.is-warn {
  background: rgba(239,68,68,0.10);
  border-color: rgba(239,68,68,0.28);
  color: #b91c1c;
}
[data-theme='dark'] .tl-group-count.is-warn {
  background: rgba(239,68,68,0.18) !important;
  border-color: rgba(239,68,68,0.38) !important;
  color: #fca5a5 !important;
}
.tl-group-caret {
  color: var(--text-slate-400);
  transition: transform 0.15s ease;
  flex-shrink: 0;
}
.tl-group-caret.open { transform: rotate(0deg); }
.tl-group-caret.closed { transform: rotate(-90deg); }
[data-theme='dark'] .tl-group-caret { color: #64748b !important; }

/* Children of an expanded group — indented under the parent
   with a thin left rail (mirrors the Linear-style guide line).
   Indent kept tight so nested content uses the available width. */
.tl-group-children {
  margin: 2px 0 6px 8px;
  padding: 2px 0 2px 6px;
  border-left: 1px solid var(--border-slate-200);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
[data-theme='dark'] .tl-group-children { border-left-color: #2d3748 !important; }

.tl-sidebar-empty {
  padding: 6px 4px;
  font-size: 11px;
  color: var(--text-slate-400);
  font-style: italic;
}

/* ── Your Sprint Contribution (flat, tight) ──────────────── */
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
[data-theme='dark'] .tl-contrib-label { color: #cbd5e1 !important; }
.tl-contrib-value {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-slate-900);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.015em;
  line-height: 1.1;
}
[data-theme='dark'] .tl-contrib-value { color: #f1f5f9 !important; }
.tl-contrib-value-amber { color: #b45309; }
.tl-contrib-value-green { color: #047857; }
[data-theme='dark'] .tl-contrib-value-amber { color: #fbbf24 !important; }
[data-theme='dark'] .tl-contrib-value-green { color: #34d399 !important; }
.tl-contrib-vsep {
  width: 1px;
  background: var(--border-slate-100);
  margin: 4px 8px;
}
[data-theme='dark'] .tl-contrib-vsep { background: #1f2937 !important; }
.tl-contrib-hsep {
  height: 1px;
  background: var(--border-slate-100);
  margin: 0 2px;
}
[data-theme='dark'] .tl-contrib-hsep { background: #1f2937 !important; }

/* Overdue tickets — warning treatment on count + row */
.tl-sidebar-section-count.is-warn {
  background: rgba(239,68,68,0.10);
  border-color: rgba(239,68,68,0.28);
  color: #b91c1c;
}
[data-theme='dark'] .tl-sidebar-section-count.is-warn {
  background: rgba(239,68,68,0.18);
  border-color: rgba(239,68,68,0.38);
  color: #fca5a5;
}
.tl-overdue-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(239,68,68,0.10);
  border: 1px solid rgba(239,68,68,0.22);
  color: #dc2626;
  flex-shrink: 0;
}
[data-theme='dark'] .tl-overdue-icon {
  background: rgba(239,68,68,0.18);
  border-color: rgba(239,68,68,0.35);
  color: #fca5a5;
}
.tl-activity-line2-warn {
  color: #b91c1c !important;
  font-weight: 700 !important;
}
.tl-activity-line2-warn b { color: #991b1b; font-weight: 800; }
[data-theme='dark'] .tl-activity-line2-warn { color: #fca5a5 !important; }
[data-theme='dark'] .tl-activity-line2-warn b { color: #fecaca; }
.tl-activity-row-warn:hover {
  background: rgba(239,68,68,0.05) !important;
  border-color: rgba(239,68,68,0.22) !important;
}
[data-theme='dark'] .tl-activity-row-warn:hover {
  background: rgba(239,68,68,0.12) !important;
  border-color: rgba(239,68,68,0.35) !important;
}

/* Single-line overdue row — minimal: red dot + number + Nd */
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
  box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
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
[data-theme='dark'] .tl-overdue-num { color: #f1f5f9; }
.tl-overdue-days {
  flex: 0 0 auto;
  font-size: 10.5px;
  font-weight: 800;
  color: #b91c1c;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}
[data-theme='dark'] .tl-overdue-days { color: #fca5a5; }

/* ── At Risk banner ──────────────────────────────────────── */
.tl-risk-banner {
  margin: 8px 2px 0;
  width: calc(100% - 4px);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.22);
  border-radius: 8px;
  color: #b91c1c;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.tl-risk-banner:hover {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.35);
}
[data-theme='dark'] .tl-risk-banner {
  background: rgba(239,68,68,0.15) !important;
  border-color: rgba(239,68,68,0.32) !important;
  color: #fca5a5 !important;
}
.tl-risk-text { flex: 1; font-size: 11.5px; font-weight: 700; text-align: left; }
.tl-risk-text b { font-weight: 800; }

/* ── Type list (minimalist, no card borders) ──────────────── */
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
[data-theme='dark'] .tl-type-line + .tl-type-line::before { background: #1f2937; }
.tl-type-line:hover { background: transparent; }
.tl-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.4) inset;
}
[data-theme='dark'] .tl-type-dot { box-shadow: 0 0 0 3px rgba(0,0,0,0.25) inset; }
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
[data-theme='dark'] .tl-type-name { color: #cbd5e1 !important; }
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
[data-theme='dark'] .tl-type-count { color: #94a3b8 !important; }

/* ── Activity rows (comments / attachments) ──────────────── */
.tl-activity-list { display: flex; flex-direction: column; gap: 2px; padding: 2px 2px; }
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
  background: var(--bg-pure-white);
  border-color: var(--border-slate-200);
}
[data-theme='dark'] .tl-activity-row:hover {
  background: #111720 !important;
  border-color: #2d3748 !important;
}
.tl-activity-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
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
[data-theme='dark'] .tl-activity-user { color: #f1f5f9 !important; }
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
[data-theme='dark'] .tl-activity-sep { color: #64748b !important; }

/* CTA button for "Show commented tickets" / "Show tickets with attachments" */
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
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.4);
  color: #1d4ed8;
}
.tl-activity-cta.active {
  background: rgba(59,130,246,0.08);
  border-style: solid;
  border-color: rgba(59,130,246,0.32);
  color: #1d4ed8;
}
[data-theme='dark'] .tl-activity-cta {
  border-color: #2d3748 !important;
  color: #60a5fa !important;
}
[data-theme='dark'] .tl-activity-cta:hover {
  background: rgba(59,130,246,0.12) !important;
  border-color: rgba(59,130,246,0.45) !important;
}
[data-theme='dark'] .tl-activity-cta.active {
  background: rgba(59,130,246,0.18) !important;
  border-color: rgba(59,130,246,0.4) !important;
  color: #93c5fd !important;
}

/* ── Responsive (< 1100px): horizontal pill bar ─────────────
   On tablets/phones the parent shell moves the sidebar above the
   main content. Everything inside the sidebar is collapsed into a
   single horizontally-scrolling row of compact pills (Sprint,
   Backlog, My Sprint Tickets, My Backlog Tickets, Overdue,
   Type, Comments Added, Attachments Added). Section labels,
   dividers, and the rich expandable group content (stat grids,
   activity lists, type breakdowns, CTAs) are hidden in this mode
   so the bar stays compact and skim-friendly. */
@media (max-width: 1099.98px) {
  .tl-sidebar {
    /* Override the sticky vertical column for horizontal layout. */
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding: 0;
    height: auto;
    overflow-y: hidden;
  }
  /* Hide chrome that only makes sense in vertical mode. */
  .tl-sidebar .tl-section-label,
  .tl-sidebar .tl-sidebar-divider-blue,
  .tl-sidebar .tl-group-children,
  .tl-sidebar .tl-group-caret,
  .tl-sidebar .tl-group-count.is-warn + .tl-group-caret {
    display: none !important;
  }
  /* Pinned nav and group lists become inline pill rows. */
  .tl-sidebar .tl-pinned-nav,
  .tl-sidebar .tl-groups {
    display: inline-flex;
    flex-direction: row;
    gap: 6px;
    padding: 0;
    flex-shrink: 0;
  }
  /* Every leaf becomes a horizontal pill (icon + label + count). */
  .tl-sidebar .tl-nav-row,
  .tl-sidebar .tl-group-row {
    width: auto;
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--bg-slate-50, #f8fafc);
    border: 1px solid var(--border-slate-200, #e2e8f0);
    white-space: nowrap;
    flex-shrink: 0;
    gap: 6px;
  }
  .tl-sidebar .tl-nav-row:hover:not(:disabled),
  .tl-sidebar .tl-group-row:hover:not(:disabled) {
    background: var(--bg-pure-white, #ffffff);
    border-color: var(--text-slate-400, #94a3b8);
  }
  [data-theme='dark'] .tl-sidebar .tl-nav-row,
  [data-theme='dark'] .tl-sidebar .tl-group-row {
    background: #111720;
    border-color: #2d3748;
  }
  [data-theme='dark'] .tl-sidebar .tl-nav-row:hover:not(:disabled),
  [data-theme='dark'] .tl-sidebar .tl-group-row:hover:not(:disabled) {
    background: #1c232e;
    border-color: #475569;
  }
  .tl-sidebar .tl-nav-row-label,
  .tl-sidebar .tl-group-label {
    font-size: 12.5px;
    flex: 0 0 auto;
  }
  .tl-sidebar .tl-nav-row-icon,
  .tl-sidebar .tl-group-icon {
    width: 14px;
  }
  .tl-sidebar .tl-nav-row-count,
  .tl-sidebar .tl-group-count {
    margin-left: 2px;
    padding: 0 6px;
    line-height: 1.4;
  }
}
`;
