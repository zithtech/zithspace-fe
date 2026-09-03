"use client";

/**
 * Bug List → ticket history drawer.
 *
 * The full lineage of a bug's tickets: where it lives now, everywhere it has
 * lived before, and a jump-off point into each one. Palette stays blue /
 * green / ash / gray; brand marks are the only colour that escapes it.
 */

import React, { useMemo } from "react";
import { Drawer } from "antd";
import dayjs from "dayjs";
import {
  History,
  FileText,
  ExternalLink,
  X,
  Bug as BugIcon,
  Ticket as TicketIcon,
  Clock,
  Layers,
  User as UserIcon,
  ArrowUpRight,
} from "lucide-react";
import { stripHtml } from "@/utils/stringUtils";
import type { BugListItem } from "@/services/bugListService";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import { useTheme } from "@/context/ThemeContext";
import { ZukvoLogo, LinearMark } from "./ticket-flow";

interface TicketHistoryDrawerProps {
  bug: BugListItem | null;
  open: boolean;
  onClose: () => void;
}

type Entry = {
  key: string;
  ticketNumber: string;
  status: string;
  timestamp?: string;
  isCurrent: boolean;
  source: "zukvo" | "linear" | "jira";
  /** External link (Linear) — takes priority over the internal ticket drawer. */
  url?: string | null;
  /** Internal ticket id for the in-app drawer. */
  ticketId?: string | null;
};

const SEVERITY_COLOR: Record<string, string> = {
  blocker: "#EF4444",
  critical: "#EF4444",
  major: "#3B82F6",
  minor: "#94A3B8",
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(iso?: string) {
  if (!iso) return null;
  const d = dayjs(iso);
  if (!d.isValid()) return null;
  const mins = dayjs().diff(d, "minute");
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function TicketHistoryDrawer({ bug, open, onClose }: TicketHistoryDrawerProps) {
  const { open: openTicketDrawer } = useTicketDrawer();
  const { theme } = useTheme();

  const entries = useMemo<Entry[]>(() => {
    if (!bug) return [];

    const past: Entry[] = [...(bug.ticketHistory || [])]
      .reverse()
      .map((h, i) => ({
        key: `${h.ticketId || h.ticketNumber || "past"}-${i}`,
        ticketNumber: h.ticketNumber,
        status: h.status || "Unknown",
        timestamp: h.timestamp,
        isCurrent: false,
        source: "zukvo" as const,
        ticketId: h.ticketId,
      }));

    const current: Entry | null = bug.ticketId
      ? {
          key: `current-${bug.ticketId}`,
          ticketNumber: bug.ticketNumber || bug.ticketId,
          status: bug.ticketStatus || "Active",
          timestamp: bug.updatedAt,
          isCurrent: true,
          source: "zukvo",
          ticketId: bug.ticketId,
        }
      : bug.linearIssueIdentifier
        ? {
            key: `current-${bug.linearIssueIdentifier}`,
            ticketNumber: bug.linearIssueIdentifier,
            status: "Linear issue",
            timestamp: bug.updatedAt,
            isCurrent: true,
            source: "linear",
            url: bug.linearIssueUrl,
          }
      : bug.jiraIssueKey
        ? {
            key: `current-${bug.jiraIssueKey}`,
            ticketNumber: bug.jiraIssueKey,
            status: "Jira issue",
            timestamp: bug.updatedAt,
            isCurrent: true,
            source: "jira" as const,
            url: bug.jiraIssueUrl,
          }
        : null;

    return current ? [current, ...past] : past;
  }, [bug]);

  if (!bug) return null;

  const openEntry = (e: Entry) => {
    if (e.url) {
      window.open(e.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (e.ticketId) openTicketDrawer(e.ticketId);
  };

  const currentEntry = entries.find((e) => e.isCurrent) || null;
  const pastCount = entries.filter((e) => !e.isCurrent).length;
  const firstSeen = entries.length
    ? entries.reduce<string | undefined>((oldest, e) => {
        if (!e.timestamp) return oldest;
        if (!oldest) return e.timestamp;
        return dayjs(e.timestamp).isBefore(dayjs(oldest)) ? e.timestamp : oldest;
      }, undefined)
    : undefined;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width="min(760px, 96vw)"
      closable={false}
      title={null}
      destroyOnHidden
      rootClassName={`thd-root ${theme === "dark" ? "thd-dark" : "thd-light"}`}
      styles={{
        header: { display: "none" },
        body: { padding: 0 },
        mask: {
          backdropFilter: "blur(4px)",
          background: theme === "dark" ? "rgba(7,10,18,0.58)" : "rgba(15,23,42,0.32)",
        },
      }}
    >
      <style>{historyStyles}</style>

      <div className="thd">
        {/* ── Header ── */}
        <header className="thd-head">
          <div className="thd-head-glow" aria-hidden />

          <div className="thd-head-row">
            <div className="thd-mark">
              <History size={20} />
            </div>

            <div className="thd-head-text">
              <div className="thd-eyebrow">
                <span className="thd-eyebrow-dot" />
                Ticket lineage
              </div>
              <h2 className="thd-title">Ticket History</h2>
              <div className="thd-sub">
                Every ticket this bug has been attached to, newest first.
              </div>
            </div>

            <button className="thd-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* Bug identity */}
          <div className="thd-bugcard">
            <span
              className="thd-bugcard-sev"
              style={{ background: SEVERITY_COLOR[bug.severity as string] ?? "#94A3B8" }}
              title={(bug.severity as string) || "unspecified severity"}
            />
            <span className="thd-bugcard-icon">
              <BugIcon size={14} />
            </span>

            <div className="thd-bugcard-main">
              <div className="thd-bugcard-title">
                {bug.title || stripHtml(bug.description)?.slice(0, 120) || "Untitled bug"}
              </div>
              <div className="thd-bugcard-meta">
                <span className="thd-tag is-strong">{bug.bugNumber ?? bug.id.slice(0, 6)}</span>
                {bug.module && (
                  <span className="thd-tag">
                    <Layers size={10} />
                    {bug.module}
                  </span>
                )}
                {bug.severity && (
                  <span className={`thd-tag sev-${bug.severity}`}>{bug.severity}</span>
                )}
                <span className={`thd-tag st-${bug.status}`}>{bug.status}</span>
              </div>
            </div>

            <span className="thd-bugcard-who" title={bug.assignee?.name || "Unassigned"}>
              {bug.assignee ? (
                <span className="thd-avatar">{initials(bug.assignee.name)}</span>
              ) : (
                <span className="thd-avatar is-empty">
                  <UserIcon size={11} />
                </span>
              )}
            </span>
          </div>

          {/* Summary */}
          <div className="thd-stats">
            <div className="thd-stat">
              <span className="thd-stat-icon">
                <TicketIcon size={13} />
              </span>
              <span className="thd-stat-value">{entries.length}</span>
              <span className="thd-stat-label">
                Ticket{entries.length === 1 ? "" : "s"} linked
              </span>
            </div>

            <div className="thd-stat">
              <span className="thd-stat-icon tone-ash">
                <History size={13} />
              </span>
              <span className="thd-stat-value">{pastCount}</span>
              <span className="thd-stat-label">Previous</span>
            </div>

            <div className="thd-stat">
              <span className="thd-stat-icon tone-plate">
                {currentEntry?.source === "linear" ? <LinearMark size={14} /> : <ZukvoLogo size={14} />}
              </span>
              <span className="thd-stat-value thd-stat-text">
                {currentEntry ? (currentEntry.source === "linear" ? "Linear" : "Zukvo") : "—"}
              </span>
              <span className="thd-stat-label">Lives in</span>
            </div>

            <div className="thd-stat">
              <span className="thd-stat-icon tone-ash">
                <Clock size={13} />
              </span>
              <span className="thd-stat-value thd-stat-text">
                {firstSeen ? dayjs(firstSeen).format("MMM D, YYYY") : "—"}
              </span>
              <span className="thd-stat-label">First linked</span>
            </div>
          </div>
        </header>

        {/* ── Timeline ── */}
        <div className="thd-body">
          {entries.length === 0 ? (
            <div className="thd-empty">
              <FileText size={22} />
              <div className="thd-empty-title">No ticket history yet</div>
              <div className="thd-empty-sub">
                This bug has never been converted into a ticket. Create one from the
                bug list and its lineage will show up here.
              </div>
            </div>
          ) : (
            <ol className="thd-timeline">
              {entries.map((e, i) => (
                <li
                  key={e.key}
                  className={`thd-item ${e.isCurrent ? "is-current" : ""} ${
                    i === entries.length - 1 ? "is-last" : ""
                  }`}
                >
                  <span className="thd-node">
                    {e.isCurrent ? <TicketIcon size={12} /> : <History size={12} />}
                  </span>

                  <div className="thd-card">
                    <div className="thd-card-top">
                      <span className="thd-card-logo">
                        {e.source === "linear" ? <LinearMark size={16} /> : <ZukvoLogo size={16} />}
                      </span>
                      <span className="thd-card-num">{e.ticketNumber}</span>
                      <span className={`thd-badge ${e.isCurrent ? "is-current" : "is-past"}`}>
                        {e.isCurrent ? "Current" : "Previous"}
                      </span>
                      {e.timestamp && (
                        <span className="thd-card-when" title={dayjs(e.timestamp).format("MMM D, YYYY HH:mm")}>
                          {relativeTime(e.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="thd-card-body">
                      <span className="thd-field">
                        <span className="thd-field-label">Status</span>
                        <span className="thd-field-value">{e.status}</span>
                      </span>
                      <span className="thd-field">
                        <span className="thd-field-label">Date</span>
                        <span className="thd-field-value">
                          {e.timestamp ? dayjs(e.timestamp).format("MMM D, YYYY") : "—"}
                        </span>
                      </span>
                      <span className="thd-field">
                        <span className="thd-field-label">Source</span>
                        <span className="thd-field-value">
                          {e.source === "linear" ? "Linear" : "Zukvo"}
                        </span>
                      </span>
                    </div>

                    <button
                      className={`thd-open ${e.isCurrent ? "is-primary" : ""}`}
                      onClick={() => openEntry(e)}
                      disabled={!e.url && !e.ticketId}
                    >
                      {e.url ? <ExternalLink size={13} /> : <ArrowUpRight size={13} />}
                      {e.url
                        ? "Open in Linear"
                        : e.isCurrent
                          ? "Open current ticket"
                          : "Open previous ticket"}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="thd-foot">
          <span className="thd-foot-note">
            {entries.length === 0
              ? "Nothing linked yet"
              : `${entries.length} ticket${entries.length === 1 ? "" : "s"} in this bug's lineage`}
          </span>
          <button className="thd-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </Drawer>
  );
}

/* ────────────────────────── Styles ────────────────────────── */

const historyStyles = `
.thd-root .ant-drawer-content { background: transparent; }
.thd-root .ant-drawer-body { overflow: hidden; }

.thd {
  --d-bg: #0B0F1A;
  --d-panel: #10151F;
  --d-soft: #141A26;
  --d-hover: #1A2231;
  --d-border: #1F2937;
  --d-border-strong: #2C3849;
  --d-text: #F1F5F9;
  --d-text-soft: #94A3B8;
  --d-text-muted: #64748B;
  --d-accent: #3B82F6;
  --d-accent-soft: rgba(59,130,246,0.14);
  --d-success: #10B981;
  --d-success-soft: rgba(16,185,129,0.14);
  --d-danger: #EF4444;
  --d-plate: #FFFFFF;

  display: flex; flex-direction: column;
  height: 100%;
  background: var(--d-bg);
  color: var(--d-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
}
.thd-light .thd {
  --d-bg: #FFFFFF;
  --d-panel: #FFFFFF;
  --d-soft: #F8FAFC;
  --d-hover: #F1F5F9;
  --d-border: #E5E7EB;
  --d-border-strong: #CBD5E1;
  --d-text: #0F172A;
  --d-text-soft: #475569;
  --d-text-muted: #94A3B8;
  --d-accent: #2563EB;
  --d-accent-soft: rgba(37,99,235,0.10);
  --d-success-soft: rgba(16,185,129,0.10);
  --d-plate: #F1F5F9;
}

/* ── Header ── */
.thd-head {
  position: relative; flex-shrink: 0;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--d-border);
  overflow: hidden;
}
.thd-head-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 130% at 92% -20%, rgba(59,130,246,0.18) 0%, transparent 62%),
    radial-gradient(50% 110% at 2% 120%, rgba(16,185,129,0.12) 0%, transparent 62%);
  pointer-events: none;
}
.thd-light .thd-head-glow { opacity: 0.55; }

.thd-head-row { position: relative; display: flex; align-items: flex-start; gap: 14px; }
.thd-mark {
  width: 44px; height: 44px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 13px;
  background: var(--d-accent-soft);
  border: 1px solid color-mix(in oklab, var(--d-accent) 32%, transparent);
  color: var(--d-accent);
}
.thd-head-text { flex: 1; min-width: 0; }
.thd-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--d-accent);
  margin-bottom: 7px;
}
.thd-eyebrow-dot {
  width: 5px; height: 5px; border-radius: 999px;
  background: var(--d-accent);
  box-shadow: 0 0 0 3px var(--d-accent-soft);
}
.thd-title {
  margin: 0 0 3px;
  font-size: 20px; font-weight: 650; line-height: 1.2;
  letter-spacing: -0.025em; color: var(--d-text);
}
.thd-sub { font-size: 12.5px; color: var(--d-text-muted); }
.thd-close {
  width: 30px; height: 30px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: transparent;
  border: 1px solid var(--d-border);
  color: var(--d-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.thd-close:hover {
  background: var(--d-hover); color: var(--d-text); border-color: var(--d-border-strong);
}

/* ── Bug identity ── */
.thd-bugcard {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  margin-top: 16px; padding: 11px 13px;
  border-radius: 12px;
  border: 1px solid var(--d-border);
  background: var(--d-soft);
}
.thd-bugcard-sev { width: 3px; height: 32px; border-radius: 999px; flex-shrink: 0; }
.thd-bugcard-icon {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--d-accent-soft);
  border: 1px solid color-mix(in oklab, var(--d-accent) 26%, transparent);
  color: var(--d-accent);
}
.thd-bugcard-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.thd-bugcard-title {
  font-size: 13px; font-weight: 600; color: var(--d-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.thd-bugcard-meta { display: flex; flex-wrap: wrap; gap: 5px; }
.thd-bugcard-who { flex-shrink: 0; }

.thd-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--d-panel);
  border: 1px solid var(--d-border);
  color: var(--d-text-muted);
  font-size: 10.5px; text-transform: capitalize;
}
.thd-light .thd-tag { background: #FFFFFF; }
.thd-tag.is-strong {
  color: var(--d-text-soft); font-weight: 620;
  font-variant-numeric: tabular-nums; text-transform: none;
}
.thd-tag.sev-blocker, .thd-tag.sev-critical {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.32);
  color: var(--d-danger);
}
.thd-tag.st-verified {
  background: var(--d-success-soft);
  border-color: color-mix(in oklab, var(--d-success) 30%, transparent);
  color: var(--d-success);
}
.thd-tag.st-converted {
  background: var(--d-accent-soft);
  border-color: color-mix(in oklab, var(--d-accent) 30%, transparent);
  color: var(--d-accent);
}

.thd-avatar {
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  background: var(--d-accent-soft);
  border: 1px solid color-mix(in oklab, var(--d-accent) 28%, transparent);
  color: var(--d-accent);
  font-size: 10px; font-weight: 700;
}
.thd-avatar.is-empty {
  background: var(--d-panel); border-color: var(--d-border); color: var(--d-text-muted);
}

/* ── Summary ── */
.thd-stats {
  position: relative;
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;
  margin-top: 10px;
}
.thd-stat {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 11px;
  border-radius: 11px;
  border: 1px solid var(--d-border);
  background: var(--d-soft);
  min-width: 0;
}
.thd-stat-icon {
  width: 26px; height: 26px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--d-accent-soft);
  color: var(--d-accent);
  border: 1px solid color-mix(in oklab, var(--d-accent) 26%, transparent);
}
.thd-stat-icon.tone-ash {
  background: var(--d-panel); color: var(--d-text-muted); border-color: var(--d-border);
}
.thd-stat-icon.tone-plate {
  background: var(--d-plate); border-color: var(--d-border-strong);
}
.thd-stat-value {
  font-size: 16px; font-weight: 650; color: var(--d-text);
  font-variant-numeric: tabular-nums;
}
.thd-stat-value.thd-stat-text {
  font-size: 12.5px; font-weight: 620;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.thd-stat-label {
  font-size: 11px; color: var(--d-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── Timeline ── */
.thd-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px 22px; }
.thd-body::-webkit-scrollbar { width: 8px; }
.thd-body::-webkit-scrollbar-thumb { background: var(--d-border-strong); border-radius: 999px; }

.thd-timeline { list-style: none; margin: 0; padding: 0; }
.thd-item { position: relative; padding-left: 38px; padding-bottom: 14px; }
.thd-item::before {
  content: "";
  position: absolute; left: 13px; top: 30px; bottom: 0;
  width: 2px;
  background: var(--d-border);
}
.thd-item.is-last { padding-bottom: 0; }
.thd-item.is-last::before { display: none; }
.thd-node {
  position: absolute; left: 0; top: 4px;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  background: var(--d-soft);
  border: 1px solid var(--d-border);
  color: var(--d-text-muted);
}
.thd-item.is-current .thd-node {
  background: var(--d-accent);
  border-color: var(--d-accent);
  color: #FFFFFF;
  box-shadow: 0 0 0 4px var(--d-accent-soft);
}

.thd-card {
  border-radius: 13px;
  border: 1px solid var(--d-border);
  background: var(--d-panel);
  padding: 13px 14px;
  transition: border-color 150ms ease, box-shadow 160ms ease, transform 150ms ease;
}
.thd-light .thd-card { background: #FFFFFF; }
.thd-card:hover {
  border-color: var(--d-border-strong);
  transform: translateX(2px);
}
.thd-item.is-current .thd-card {
  border-color: color-mix(in oklab, var(--d-accent) 42%, var(--d-border));
  box-shadow: 0 12px 30px rgba(8,12,24,0.24);
}
.thd-light .thd-item.is-current .thd-card { box-shadow: 0 8px 22px rgba(15,23,42,0.08); }

.thd-card-top {
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  margin-bottom: 11px;
}
.thd-card-logo {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--d-plate);
  border: 1px solid var(--d-border-strong);
}
.thd-card-num {
  font-size: 14px; font-weight: 650; color: var(--d-text);
  font-variant-numeric: tabular-nums;
}
.thd-badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10px; font-weight: 650;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.thd-badge.is-current {
  background: var(--d-accent-soft);
  border: 1px solid color-mix(in oklab, var(--d-accent) 34%, transparent);
  color: var(--d-accent);
}
.thd-badge.is-past {
  background: var(--d-soft);
  border: 1px solid var(--d-border);
  color: var(--d-text-muted);
}
.thd-card-when {
  margin-left: auto;
  font-size: 11.5px; color: var(--d-text-muted);
  white-space: nowrap;
}

.thd-card-body {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  background: var(--d-soft);
  border: 1px solid var(--d-border);
  margin-bottom: 11px;
}
.thd-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.thd-field-label {
  font-size: 9.5px; font-weight: 650;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--d-text-muted);
}
.thd-field-value {
  font-size: 12.5px; font-weight: 550; color: var(--d-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-transform: capitalize;
}

.thd-open {
  width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 33px;
  border-radius: 9px;
  border: 1px solid var(--d-border-strong);
  background: var(--d-soft);
  color: var(--d-text);
  font-size: 12.5px; font-weight: 600;
  cursor: pointer;
  transition: background 130ms ease, border-color 130ms ease, filter 130ms ease, transform 130ms ease;
}
.thd-open:hover:not(:disabled) { background: var(--d-hover); transform: translateY(-1px); }
.thd-open.is-primary {
  background: var(--d-accent);
  border-color: var(--d-accent);
  color: #FFFFFF;
}
.thd-open.is-primary:hover:not(:disabled) { filter: brightness(1.08); }
.thd-open:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Empty ── */
.thd-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 60px 20px; text-align: center;
  color: var(--d-text-muted);
}
.thd-empty > svg { margin-bottom: 4px; }
.thd-empty-title { font-size: 14px; font-weight: 600; color: var(--d-text-soft); }
.thd-empty-sub { font-size: 12.5px; max-width: 44ch; line-height: 1.55; }

/* ── Footer ── */
.thd-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-shrink: 0;
  padding: 12px 24px;
  border-top: 1px solid var(--d-border);
  background: var(--d-soft);
}
.thd-foot-note { font-size: 11.5px; color: var(--d-text-muted); }
.thd-secondary {
  height: 32px; padding: 0 16px;
  border-radius: 8px;
  border: 1px solid var(--d-border-strong);
  background: var(--d-panel);
  color: var(--d-text);
  font-size: 12.5px; font-weight: 550;
  cursor: pointer;
  transition: background 130ms ease;
}
.thd-secondary:hover { background: var(--d-hover); }

/* ── Responsive ── */
@media (max-width: 640px) {
  .thd-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .thd-card-body { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .thd-head, .thd-body, .thd-foot { padding-left: 16px; padding-right: 16px; }
}
`;
