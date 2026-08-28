"use client";

/**
 * Calendar → day detail drawer.
 *
 * A wide, filterable panel for everything that happened on one day: headline
 * counts, a severity read-out, search, and rich bug rows. Palette stays on
 * blue / green / ash / gray, with red reserved for blocker-grade severity.
 */

import React, { useMemo, useState } from "react";
import { Drawer } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Bug as BugIcon,
  CheckCircle2,
  Ticket as TicketIcon,
  ShieldCheck,
  Info,
  User as UserIcon,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type { BugListItem } from "@/services/bugListService";
import { useTheme } from "@/context/ThemeContext";

export interface DayBucketShape {
  created: BugListItem[];
  completed: BugListItem[];
  verified: BugListItem[];
  tickets: BugListItem[];
  bySeverity: Record<string, number>;
}

type LaneKey = "created" | "completed" | "tickets" | "verified";
type FilterKey = "all" | LaneKey;

const LANES: {
  key: LaneKey;
  title: string;
  tone: "blue" | "green" | "ash";
  icon: React.ReactNode;
}[] = [
  { key: "created", title: "Created", tone: "blue", icon: <BugIcon size={13} /> },
  { key: "completed", title: "Completed", tone: "green", icon: <CheckCircle2 size={13} /> },
  { key: "tickets", title: "Tickets created", tone: "blue", icon: <TicketIcon size={13} /> },
  { key: "verified", title: "Verified", tone: "green", icon: <ShieldCheck size={13} /> },
];

const SEVERITY_ORDER = ["blocker", "critical", "major", "minor"];
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

function relativeDayLabel(day: Dayjs) {
  const today = dayjs().startOf("day");
  const d = day.startOf("day");
  const diff = d.diff(today, "day");
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

export interface BugDayDrawerProps {
  day: Dayjs | null;
  bucket: DayBucketShape | null;
  onClose: () => void;
  onSelectBug: (bug: BugListItem) => void;
  /** Step to the previous/next day without closing the drawer. */
  onChangeDay?: (day: Dayjs) => void;
}

export default function BugDayDrawer({
  day,
  bucket,
  onClose,
  onSelectBug,
  onChangeDay,
}: BugDayDrawerProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(
    () => ({
      created: bucket?.created.length ?? 0,
      completed: bucket?.completed.length ?? 0,
      tickets: bucket?.tickets.length ?? 0,
      verified: bucket?.verified.length ?? 0,
    }),
    [bucket]
  );

  const total = counts.created + counts.completed + counts.tickets + counts.verified;

  const severities = useMemo(() => {
    const raw = bucket?.bySeverity ?? {};
    const sum = Object.values(raw).reduce((a, b) => a + b, 0);
    if (!sum) return [];
    return SEVERITY_ORDER.filter((s) => raw[s]).map((s) => ({
      key: s,
      count: raw[s],
      pct: Math.round((raw[s] / sum) * 100),
      color: SEVERITY_COLOR[s] ?? "#94A3B8",
    }));
  }, [bucket]);

  const q = query.trim().toLowerCase();

  const matches = (b: BugListItem) =>
    !q ||
    `${b.bugNumber ?? ""} ${b.title ?? ""} ${b.description ?? ""} ${b.module ?? ""} ${
      b.assignee?.name ?? ""
    }`
      .toLowerCase()
      .includes(q);

  const visibleLanes = useMemo(
    () =>
      LANES.filter((l) => filter === "all" || filter === l.key)
        .map((l) => ({ ...l, items: (bucket?.[l.key] ?? []).filter(matches) }))
        .filter((l) => l.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucket, filter, q]
  );

  const shownCount = visibleLanes.reduce((n, l) => n + l.items.length, 0);

  const reset = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <Drawer
      open={!!day}
      onClose={onClose}
      width="min(860px, 96vw)"
      closable={false}
      title={null}
      destroyOnHidden
      rootClassName={`bdd-root ${theme === "dark" ? "bdd-dark" : "bdd-light"}`}
      styles={{
        header: { display: "none" },
        body: { padding: 0 },
        mask: {
          backdropFilter: "blur(4px)",
          background: theme === "dark" ? "rgba(7,10,18,0.58)" : "rgba(15,23,42,0.32)",
        },
      }}
      afterOpenChange={(o) => {
        if (!o) reset();
      }}
    >
      <style>{dayDrawerStyles}</style>

      {day && (
        <div className="bdd">
          {/* ── Header ── */}
          <header className="bdd-head">
            <div className="bdd-head-glow" aria-hidden />

            <div className="bdd-head-row">
              <div className="bdd-datechip">
                <span className="bdd-datechip-mon">{day.format("MMM").toUpperCase()}</span>
                <span className="bdd-datechip-day">{day.format("D")}</span>
              </div>

              <div className="bdd-head-text">
                <div className="bdd-eyebrow">
                  <span className="bdd-eyebrow-dot" />
                  {relativeDayLabel(day)}
                </div>
                <h2 className="bdd-title">{day.format("dddd")}</h2>
                <div className="bdd-sub">{day.format("MMMM D, YYYY")}</div>
              </div>

              <div className="bdd-head-actions">
                {onChangeDay && (
                  <div className="bdd-daynav">
                    <button
                      onClick={() => onChangeDay(day.subtract(1, "day"))}
                      aria-label="Previous day"
                      title="Previous day"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() => onChangeDay(day.add(1, "day"))}
                      aria-label="Next day"
                      title="Next day"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
                <button className="bdd-close" onClick={onClose} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Headline counts double as filters */}
            <div className="bdd-stats">
              {LANES.map((l) => {
                const value = counts[l.key];
                const active = filter === l.key;
                return (
                  <button
                    key={l.key}
                    className={`bdd-stat tone-${l.tone} ${active ? "is-active" : ""} ${
                      value === 0 ? "is-empty" : ""
                    }`}
                    onClick={() => setFilter(active || value === 0 ? "all" : l.key)}
                    disabled={value === 0}
                    title={value === 0 ? `No ${l.title.toLowerCase()}` : `Show ${l.title.toLowerCase()}`}
                  >
                    <span className="bdd-stat-icon">{l.icon}</span>
                    <span className="bdd-stat-value">{value}</span>
                    <span className="bdd-stat-label">{l.title}</span>
                  </button>
                );
              })}
            </div>

            {severities.length > 0 && (
              <div className="bdd-sev">
                <div className="bdd-sev-bar">
                  {severities.map((s) => (
                    <span
                      key={s.key}
                      style={{ width: `${s.pct}%`, background: s.color }}
                      title={`${s.count} ${s.key}`}
                    />
                  ))}
                </div>
                <div className="bdd-sev-legend">
                  {severities.map((s) => (
                    <span key={s.key} className="bdd-sev-item">
                      <i style={{ background: s.color }} />
                      {s.key}
                      <b>{s.count}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* ── Toolbar ── */}
          {total > 0 && (
            <div className="bdd-toolbar">
              <label className="bdd-search">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this day — number, title, module, assignee…"
                  aria-label="Search bugs on this day"
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search">
                    <X size={12} />
                  </button>
                )}
              </label>

              <div className="bdd-seg" role="tablist" aria-label="Filter activity">
                <button
                  role="tab"
                  aria-selected={filter === "all"}
                  className={`bdd-seg-btn ${filter === "all" ? "is-active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All
                  <span className="bdd-seg-count">{total}</span>
                </button>
                {LANES.map((l) => (
                  <button
                    key={l.key}
                    role="tab"
                    aria-selected={filter === l.key}
                    disabled={counts[l.key] === 0}
                    className={`bdd-seg-btn ${filter === l.key ? "is-active" : ""}`}
                    onClick={() => setFilter(l.key)}
                  >
                    {l.title}
                    <span className="bdd-seg-count">{counts[l.key]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Body ── */}
          <div className="bdd-body">
            {total === 0 && (
              <div className="bdd-empty">
                <Info size={22} />
                <div className="bdd-empty-title">Nothing happened on this day</div>
                <div className="bdd-empty-sub">
                  No bugs were created, completed, verified or turned into tickets.
                </div>
              </div>
            )}

            {total > 0 && shownCount === 0 && (
              <div className="bdd-empty">
                <Search size={22} />
                <div className="bdd-empty-title">No matches</div>
                <div className="bdd-empty-sub">
                  Nothing on this day matches your search or filter.
                </div>
                <button className="bdd-empty-btn" onClick={reset}>
                  Clear filters
                </button>
              </div>
            )}

            {visibleLanes.map((lane) => (
              <section key={lane.key} className={`bdd-section tone-${lane.tone}`}>
                <header className="bdd-section-head">
                  <span className="bdd-section-icon">{lane.icon}</span>
                  <span className="bdd-section-title">{lane.title}</span>
                  <span className="bdd-section-count">{lane.items.length}</span>
                </header>

                <ul className="bdd-list">
                  {lane.items.map((b) => (
                    <li key={`${lane.key}-${b.id}`}>
                      <button className="bdd-row" onClick={() => onSelectBug(b)}>
                        <span
                          className="bdd-row-sev"
                          style={{
                            background: SEVERITY_COLOR[b.severity as string] ?? "#94A3B8",
                          }}
                          title={(b.severity as string) || "unspecified severity"}
                        />

                        <span className="bdd-row-num">
                          {b.bugNumber ?? b.id.slice(0, 6)}
                        </span>

                        <span className="bdd-row-main">
                          <span className="bdd-row-title">
                            {b.title || b.description?.slice(0, 120) || "Untitled bug"}
                          </span>
                          <span className="bdd-row-meta">
                            {b.module && (
                              <span className="bdd-tag">
                                <Layers size={10} />
                                {b.module}
                              </span>
                            )}
                            {b.bugType && <span className="bdd-tag">{b.bugType}</span>}
                            {b.severity && (
                              <span className={`bdd-tag sev-${b.severity}`}>{b.severity}</span>
                            )}
                            {b.ticketNumber && (
                              <span className="bdd-tag is-link">
                                <TicketIcon size={10} />
                                {b.ticketNumber}
                              </span>
                            )}
                            {b.linearIssueIdentifier && (
                              <span className="bdd-tag is-link">{b.linearIssueIdentifier}</span>
                            )}
                          </span>
                        </span>

                        <span className={`bdd-status st-${b.status}`}>{b.status}</span>

                        <span className="bdd-row-who" title={b.assignee?.name || "Unassigned"}>
                          {b.assignee ? (
                            <span className="bdd-avatar">{initials(b.assignee.name)}</span>
                          ) : (
                            <span className="bdd-avatar is-empty">
                              <UserIcon size={11} />
                            </span>
                          )}
                        </span>

                        <ArrowUpRight size={14} className="bdd-row-go" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* ── Footer ── */}
          <footer className="bdd-foot">
            <span className="bdd-foot-note">
              {shownCount === total
                ? `${total} record${total === 1 ? "" : "s"} on this day`
                : `Showing ${shownCount} of ${total}`}
            </span>
            <button className="bdd-secondary" onClick={onClose}>
              Close
            </button>
          </footer>
        </div>
      )}
    </Drawer>
  );
}

/* ────────────────────────── Styles ────────────────────────── */

const dayDrawerStyles = `
.bdd-root .ant-drawer-content { background: transparent; }
.bdd-root .ant-drawer-body { overflow: hidden; }

.bdd {
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

  display: flex; flex-direction: column;
  height: 100%;
  background: var(--d-bg);
  color: var(--d-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
}
.bdd-light .bdd {
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
}

/* ── Header ── */
.bdd-head {
  position: relative;
  flex-shrink: 0;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--d-border);
  overflow: hidden;
}
.bdd-head-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 130% at 92% -20%, rgba(59,130,246,0.18) 0%, transparent 62%),
    radial-gradient(50% 110% at 2% 120%, rgba(16,185,129,0.12) 0%, transparent 62%);
  pointer-events: none;
}
.bdd-light .bdd-head-glow { opacity: 0.55; }

.bdd-head-row {
  position: relative;
  display: flex; align-items: flex-start; gap: 14px;
}
.bdd-datechip {
  width: 54px; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center;
  border-radius: 13px;
  overflow: hidden;
  border: 1px solid var(--d-border-strong);
  background: var(--d-panel);
  box-shadow: 0 8px 20px rgba(8,12,24,0.24);
}
.bdd-light .bdd-datechip { box-shadow: 0 3px 10px rgba(15,23,42,0.08); }
.bdd-datechip-mon {
  width: 100%;
  padding: 3px 0;
  text-align: center;
  background: var(--d-accent);
  color: #FFFFFF;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em;
}
.bdd-datechip-day {
  padding: 5px 0 7px;
  font-size: 21px; font-weight: 650; line-height: 1;
  color: var(--d-text);
  font-variant-numeric: tabular-nums;
}

.bdd-head-text { flex: 1; min-width: 0; }
.bdd-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--d-accent);
  margin-bottom: 7px;
}
.bdd-eyebrow-dot {
  width: 5px; height: 5px; border-radius: 999px;
  background: var(--d-accent);
  box-shadow: 0 0 0 3px var(--d-accent-soft);
}
.bdd-title {
  margin: 0 0 3px;
  font-size: 20px; font-weight: 650; line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--d-text);
}
.bdd-sub { font-size: 12.5px; color: var(--d-text-muted); }

.bdd-head-actions { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
.bdd-daynav {
  display: inline-flex;
  border: 1px solid var(--d-border);
  border-radius: 9px;
  overflow: hidden;
  background: var(--d-soft);
}
.bdd-daynav button {
  width: 28px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: var(--d-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.bdd-daynav button:hover { background: var(--d-hover); color: var(--d-text); }
.bdd-daynav button + button { border-left: 1px solid var(--d-border); }
.bdd-close {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: transparent;
  border: 1px solid var(--d-border);
  color: var(--d-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.bdd-close:hover {
  background: var(--d-hover); color: var(--d-text); border-color: var(--d-border-strong);
}

/* ── Headline stats ── */
.bdd-stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}
.bdd-stat {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 11px;
  border-radius: 11px;
  border: 1px solid var(--d-border);
  background: var(--d-soft);
  cursor: pointer;
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
}
.bdd-stat:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--d-border-strong); }
.bdd-stat.is-empty { opacity: 0.45; cursor: default; }
.bdd-stat-icon {
  width: 26px; height: 26px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--d-accent-soft);
  color: var(--d-accent);
  border: 1px solid color-mix(in oklab, var(--d-accent) 28%, transparent);
}
.bdd-stat.tone-green .bdd-stat-icon {
  background: var(--d-success-soft);
  color: var(--d-success);
  border-color: color-mix(in oklab, var(--d-success) 28%, transparent);
}
.bdd-stat-value {
  font-size: 16px; font-weight: 650; color: var(--d-text);
  font-variant-numeric: tabular-nums;
}
.bdd-stat-label {
  font-size: 11px; color: var(--d-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bdd-stat.is-active {
  border-color: color-mix(in oklab, var(--d-accent) 50%, transparent);
  background: var(--d-accent-soft);
}
.bdd-stat.tone-green.is-active {
  border-color: color-mix(in oklab, var(--d-success) 50%, transparent);
  background: var(--d-success-soft);
}

/* ── Severity read-out ── */
.bdd-sev { position: relative; margin-top: 14px; }
.bdd-sev-bar {
  display: flex; gap: 2px;
  height: 6px; border-radius: 999px; overflow: hidden;
  background: var(--d-soft);
}
.bdd-sev-bar span { display: block; height: 100%; }
.bdd-sev-legend {
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-top: 8px;
}
.bdd-sev-item {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--d-text-muted);
  text-transform: capitalize;
}
.bdd-sev-item i { width: 7px; height: 7px; border-radius: 2px; }
.bdd-sev-item b { color: var(--d-text-soft); font-weight: 620; }

/* ── Toolbar ── */
.bdd-toolbar {
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0; flex-wrap: wrap;
  padding: 12px 24px;
  border-bottom: 1px solid var(--d-border);
  background: var(--d-soft);
}
.bdd-search {
  flex: 1; min-width: 200px;
  display: flex; align-items: center; gap: 8px;
  height: 34px; padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--d-border);
  background: var(--d-panel);
  color: var(--d-text-muted);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.bdd-search:focus-within {
  border-color: var(--d-accent);
  box-shadow: 0 0 0 3px var(--d-accent-soft);
}
.bdd-search input {
  flex: 1; min-width: 0;
  border: none; outline: none; background: transparent;
  color: var(--d-text); font-size: 13px;
}
.bdd-search input::placeholder { color: var(--d-text-muted); }
.bdd-search button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px;
  border: none; border-radius: 999px;
  background: var(--d-hover); color: var(--d-text-soft);
  cursor: pointer;
}

.bdd-seg {
  display: inline-flex; gap: 2px; flex-wrap: wrap;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--d-border);
  background: var(--d-panel);
}
.bdd-seg-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px;
  border: none; border-radius: 7px;
  background: transparent;
  color: var(--d-text-muted);
  font-size: 12px; font-weight: 550;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.bdd-seg-btn:hover:not(:disabled) { color: var(--d-text); }
.bdd-seg-btn:disabled { opacity: 0.4; cursor: default; }
.bdd-seg-btn.is-active { background: var(--d-accent); color: #FFFFFF; }
.bdd-seg-count {
  min-width: 16px; padding: 0 4px;
  border-radius: 999px;
  background: var(--d-soft);
  color: var(--d-text-muted);
  font-size: 10px; font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.bdd-seg-btn.is-active .bdd-seg-count {
  background: rgba(255,255,255,0.22); color: #FFFFFF;
}

/* ── Body ── */
.bdd-body { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 24px 20px; }
.bdd-body::-webkit-scrollbar { width: 8px; }
.bdd-body::-webkit-scrollbar-thumb { background: var(--d-border-strong); border-radius: 999px; }

.bdd-section + .bdd-section { margin-top: 20px; }
.bdd-section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 9px;
}
.bdd-section-icon {
  width: 24px; height: 24px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 7px;
  background: var(--d-accent-soft);
  color: var(--d-accent);
  border: 1px solid color-mix(in oklab, var(--d-accent) 26%, transparent);
}
.bdd-section.tone-green .bdd-section-icon {
  background: var(--d-success-soft);
  color: var(--d-success);
  border-color: color-mix(in oklab, var(--d-success) 26%, transparent);
}
.bdd-section-title {
  font-size: 11px; font-weight: 650;
  letter-spacing: 0.11em; text-transform: uppercase;
  color: var(--d-text-soft);
}
.bdd-section-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 999px;
  background: var(--d-soft);
  border: 1px solid var(--d-border);
  color: var(--d-text-muted);
  font-size: 10px; font-weight: 650;
}

.bdd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.bdd-row {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 11px;
  border: 1px solid var(--d-border);
  background: var(--d-panel);
  cursor: pointer;
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease, box-shadow 160ms ease;
}
.bdd-light .bdd-row { background: #FFFFFF; }
.bdd-row:hover {
  border-color: color-mix(in oklab, var(--d-accent) 42%, var(--d-border));
  background: var(--d-hover);
  transform: translateX(2px);
}
.bdd-row:focus-visible {
  outline: none;
  border-color: var(--d-accent);
  box-shadow: 0 0 0 3px var(--d-accent-soft);
}
.bdd-row-sev { width: 3px; height: 30px; border-radius: 999px; flex-shrink: 0; }
.bdd-row-num {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--d-soft);
  border: 1px solid var(--d-border);
  color: var(--d-text-soft);
  font-size: 11px; font-weight: 620;
  font-variant-numeric: tabular-nums;
}
.bdd-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.bdd-row-title {
  font-size: 13px; font-weight: 550; color: var(--d-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bdd-row-meta { display: flex; flex-wrap: wrap; gap: 5px; }
.bdd-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--d-soft);
  border: 1px solid var(--d-border);
  color: var(--d-text-muted);
  font-size: 10.5px; text-transform: capitalize;
}
.bdd-tag.is-link {
  background: var(--d-accent-soft);
  border-color: color-mix(in oklab, var(--d-accent) 30%, transparent);
  color: var(--d-accent);
  text-transform: none;
}
.bdd-tag.sev-blocker, .bdd-tag.sev-critical {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.32);
  color: var(--d-danger);
}

.bdd-status {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--d-border);
  background: var(--d-soft);
  color: var(--d-text-muted);
  font-size: 10px; font-weight: 650;
  letter-spacing: 0.06em; text-transform: uppercase;
}
.bdd-status.st-verified {
  background: var(--d-success-soft);
  border-color: color-mix(in oklab, var(--d-success) 32%, transparent);
  color: var(--d-success);
}
.bdd-status.st-converted {
  background: var(--d-accent-soft);
  border-color: color-mix(in oklab, var(--d-accent) 32%, transparent);
  color: var(--d-accent);
}

.bdd-row-who { flex-shrink: 0; }
.bdd-avatar {
  width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  background: var(--d-accent-soft);
  border: 1px solid color-mix(in oklab, var(--d-accent) 28%, transparent);
  color: var(--d-accent);
  font-size: 10px; font-weight: 700;
}
.bdd-avatar.is-empty {
  background: var(--d-soft);
  border-color: var(--d-border);
  color: var(--d-text-muted);
}
.bdd-row-go { color: var(--d-text-muted); flex-shrink: 0; opacity: 0; transition: opacity 140ms ease; }
.bdd-row:hover .bdd-row-go { opacity: 1; color: var(--d-accent); }

/* ── Empty ── */
.bdd-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 60px 20px; text-align: center;
  color: var(--d-text-muted);
}
.bdd-empty > svg { margin-bottom: 4px; }
.bdd-empty-title { font-size: 14px; font-weight: 600; color: var(--d-text-soft); }
.bdd-empty-sub { font-size: 12.5px; max-width: 42ch; line-height: 1.5; }
.bdd-empty-btn {
  margin-top: 10px; height: 30px; padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--d-border-strong);
  background: var(--d-panel);
  color: var(--d-text);
  font-size: 12px; font-weight: 550;
  cursor: pointer;
}
.bdd-empty-btn:hover { background: var(--d-hover); }

/* ── Footer ── */
.bdd-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-shrink: 0;
  padding: 12px 24px;
  border-top: 1px solid var(--d-border);
  background: var(--d-soft);
}
.bdd-foot-note { font-size: 11.5px; color: var(--d-text-muted); }
.bdd-secondary {
  height: 32px; padding: 0 16px;
  border-radius: 8px;
  border: 1px solid var(--d-border-strong);
  background: var(--d-panel);
  color: var(--d-text);
  font-size: 12.5px; font-weight: 550;
  cursor: pointer;
  transition: background 130ms ease;
}
.bdd-secondary:hover { background: var(--d-hover); }

/* ── Responsive ── */
@media (max-width: 720px) {
  .bdd-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bdd-head, .bdd-toolbar, .bdd-body, .bdd-foot { padding-left: 16px; padding-right: 16px; }
  .bdd-status, .bdd-row-who { display: none; }
}
`;
