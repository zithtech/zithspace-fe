"use client";

import React, { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  Bug as BugIcon,
  Ticket as TicketIcon,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Drawer, Tooltip } from "antd";
import { useBugs } from "@/hooks/useBugList";
import type { BugListItem, BugSeverity } from "@/services/bugListService";
import type { BugScope } from "./HivebugSidebar";

interface Props {
  projectId: string | null;
  folderId: string | null;
  sheetId: string | null;
  scope: BugScope;
  onSelectBug: (bug: BugListItem) => void;
}

interface DayBucket {
  created: BugListItem[];
  completed: BugListItem[];
  verified: BugListItem[];
  tickets: BugListItem[];
  bySeverity: Record<string, number>;
}

const EMPTY_BUCKET = (): DayBucket => ({
  created: [],
  completed: [],
  verified: [],
  tickets: [],
  bySeverity: {},
});

const SEVERITY_TONE: Record<string, string> = {
  blocker: "#ef4444",
  critical: "#f97316",
  major: "#f59e0b",
  minor: "#3b82f6",
};

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function BugCalendarView({
  projectId,
  folderId,
  sheetId,
  scope,
  onSelectBug,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);

  const monthStart = currentMonth.startOf("month");
  const firstWeekday = monthStart.day(); // 0=Sun..6=Sat
  const daysToShift = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const gridStart = monthStart.subtract(daysToShift, "day");
  const gridEnd = gridStart.add(41, "day");

  const rangeFrom = gridStart.startOf("day").toISOString();
  const rangeTo = gridEnd.endOf("day").toISOString();

  const baseFilters = {
    projectId: projectId || undefined,
    folderId: folderId || undefined,
    sheetId: sheetId || undefined,
    scope,
    limit: 2000,
    page: 1,
  } as const;

  const { data: createdResp, isFetching: loadingCreated } = useBugs({
    ...baseFilters,
    createdFrom: rangeFrom,
    createdTo: rangeTo,
  });

  const { data: updatedResp, isFetching: loadingUpdated } = useBugs({
    ...baseFilters,
    updatedFrom: rangeFrom,
    updatedTo: rangeTo,
  });

  const buckets = useMemo(() => {
    const map: Record<string, DayBucket> = {};
    const dayKey = (iso: string) => dayjs(iso).format("YYYY-MM-DD");
    const get = (key: string) => {
      if (!map[key]) map[key] = EMPTY_BUCKET();
      return map[key];
    };

    (createdResp?.bugs || []).forEach((b) => {
      if (!b.createdAt) return;
      const bucket = get(dayKey(b.createdAt));
      bucket.created.push(b);
      const sev = (b.severity || "minor") as string;
      bucket.bySeverity[sev] = (bucket.bySeverity[sev] || 0) + 1;
    });

    (updatedResp?.bugs || []).forEach((b) => {
      if (!b.updatedAt) return;
      const bucket = get(dayKey(b.updatedAt));
      if (b.bugStatus === "completed") bucket.completed.push(b);
      if (b.status === "verified") bucket.verified.push(b);
      if (b.ticketId) bucket.tickets.push(b);
    });

    return map;
  }, [createdResp, updatedResp]);

  const monthBuckets = useMemo(() => {
    const result = {
      created: 0,
      completed: 0,
      verified: 0,
      tickets: 0,
      bySeverity: {} as Record<string, number>,
    };
    const monthKey = currentMonth.format("YYYY-MM");
    Object.entries(buckets).forEach(([k, b]) => {
      if (!k.startsWith(monthKey)) return;
      result.created += b.created.length;
      result.completed += b.completed.length;
      result.verified += b.verified.length;
      result.tickets += b.tickets.length;
      Object.entries(b.bySeverity).forEach(([sev, n]) => {
        result.bySeverity[sev] = (result.bySeverity[sev] || 0) + n;
      });
    });
    return result;
  }, [buckets, currentMonth]);

  const rows: Dayjs[][] = [];
  {
    let d = gridStart;
    let row: Dayjs[] = [];
    for (let i = 0; i < 42; i++) {
      row.push(d);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
      d = d.add(1, "day");
    }
  }

  const isLoading = loadingCreated || loadingUpdated;
  const selectedBucket = selectedDay
    ? buckets[selectedDay.format("YYYY-MM-DD")] || EMPTY_BUCKET()
    : null;

  const daysInMonth = currentMonth.daysInMonth();
  const avgCreated = daysInMonth > 0 ? monthBuckets.created / daysInMonth : 0;
  const avgCompleted = daysInMonth > 0 ? monthBuckets.completed / daysInMonth : 0;
  const formatAvg = (n: number) =>
    n === 0 ? "0" : n >= 10 ? Math.round(n).toString() : n.toFixed(1);

  return (
    <div className="hb-cal">
      <div className="hb-cal-toolbar">
        <div className="hb-cal-nav">
          <Tooltip title="Previous month">
            <button
              className="hb-cal-nav-btn"
              onClick={() => setCurrentMonth((m) => m.subtract(1, "month"))}
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
          </Tooltip>
          <button
            className="hb-cal-today"
            onClick={() => setCurrentMonth(dayjs())}
          >
            Today
          </button>
          <Tooltip title="Next month">
            <button
              className="hb-cal-nav-btn"
              onClick={() => setCurrentMonth((m) => m.add(1, "month"))}
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </Tooltip>
          <div className="hb-cal-month-label">
            <span className="hb-cal-month-name">{currentMonth.format("MMMM")}</span>
            <span className="hb-cal-month-year">{currentMonth.format("YYYY")}</span>
          </div>
          <div className="hb-cal-avgs" aria-label="Per-day averages">
            <Tooltip
              title={`Average bugs created per day across ${daysInMonth} days in ${currentMonth.format("MMMM")}`}
            >
              <span className="hb-cal-avg tone-info">
                <BugIcon size={11} />
                <strong>{formatAvg(avgCreated)}</strong>
                <span className="hb-cal-avg-unit">/day created</span>
              </span>
            </Tooltip>
            <Tooltip
              title={`Average bugs completed per day across ${daysInMonth} days in ${currentMonth.format("MMMM")}`}
            >
              <span className="hb-cal-avg tone-success">
                <CheckCircle2 size={11} />
                <strong>{formatAvg(avgCompleted)}</strong>
                <span className="hb-cal-avg-unit">/day completed</span>
              </span>
            </Tooltip>
          </div>
          {isLoading && <span className="hb-cal-loading">Loading…</span>}
        </div>

        <div className="hb-cal-summary">
          <SummaryStat
            tone="info"
            icon={<BugIcon size={12} />}
            label="Created"
            value={monthBuckets.created}
          />
          <SummaryStat
            tone="success"
            icon={<CheckCircle2 size={12} />}
            label="Completed"
            value={monthBuckets.completed}
          />
          {/* <SummaryStat
            tone="accent"
            icon={<ShieldCheck size={12} />}
            label="Verified"
            value={monthBuckets.verified}
          /> */}
          <SummaryStat
            tone="warning"
            icon={<TicketIcon size={12} />}
            label="Tickets"
            value={monthBuckets.tickets}
          />
          <Tooltip
            title="Completed / Verified / Tickets are aggregated by the bug's last activity day, since these events don't yet have dedicated timestamps in the schema."
            placement="bottomRight"
          >
            <span className="hb-cal-approx" aria-label="Approximation note">
              <Info size={12} />
            </span>
          </Tooltip>
        </div>
      </div>

      <div className="hb-cal-weekdays">
        {DAY_NAMES.map((name) => (
          <div key={name} className="hb-cal-weekday">
            {name}
          </div>
        ))}
      </div>

      <div className="hb-cal-grid">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="hb-cal-row">
            {row.map((date) => {
              const key = date.format("YYYY-MM-DD");
              const bucket = buckets[key];
              const isCurrentMonth = date.isSame(currentMonth, "month");
              const isToday = date.isSame(dayjs(), "day");
              const isWeekend = date.day() === 0 || date.day() === 6;
              const isSelected =
                selectedDay && date.isSame(selectedDay, "day");
              const activity =
                (bucket?.created.length || 0) +
                (bucket?.completed.length || 0) +
                (bucket?.verified.length || 0) +
                (bucket?.tickets.length || 0);

              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    "hb-cal-cell",
                    !isCurrentMonth ? "is-other-month" : "",
                    isWeekend && isCurrentMonth ? "is-weekend" : "",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : "",
                    activity > 0 ? "has-activity" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedDay(date)}
                >
                  <div className="hb-cal-cell-head">
                    <span className="hb-cal-cell-date">{date.date()}</span>
                    {date.date() === 1 && (
                      <span className="hb-cal-cell-monthtag">
                        {date.format("MMM")}
                      </span>
                    )}
                  </div>

                  {bucket && activity > 0 && (
                    <div className="hb-cal-cell-body">
                      {bucket.created.length > 0 && (
                        <MetricChip
                          tone="info"
                          icon={<BugIcon size={11} />}
                          label="Created"
                          count={bucket.created.length}
                        />
                      )}
                      {bucket.completed.length > 0 && (
                        <MetricChip
                          tone="success"
                          icon={<CheckCircle2 size={11} />}
                          label="Completed"
                          count={bucket.completed.length}
                        />
                      )}
                      {bucket.tickets.length > 0 && (
                        <MetricChip
                          tone="warning"
                          icon={<TicketIcon size={11} />}
                          label="Tickets"
                          count={bucket.tickets.length}
                        />
                      )}
                      {bucket.verified.length > 0 && (
                        <MetricChip
                          tone="accent"
                          icon={<ShieldCheck size={11} />}
                          label="Verified"
                          count={bucket.verified.length}
                        />
                      )}
                    </div>
                  )}

                  {bucket && Object.keys(bucket.bySeverity).length > 0 && (
                    <div className="hb-cal-cell-strip">
                      {(["blocker", "critical", "major", "minor"] as const).map(
                        (sev) => {
                          const n = bucket.bySeverity[sev] || 0;
                          if (!n) return null;
                          return (
                            <span
                              key={sev}
                              className="hb-cal-cell-strip-seg"
                              style={{
                                background: SEVERITY_TONE[sev],
                                flex: n,
                              }}
                              title={`${n} ${sev}`}
                            />
                          );
                        }
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <Drawer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        width={460}
        title={
          selectedDay ? (
            <div className="hb-cal-drawer-title">
              <span className="hb-cal-drawer-day">
                {selectedDay.format("dddd")}
              </span>
              <span className="hb-cal-drawer-date">
                {selectedDay.format("MMM D, YYYY")}
              </span>
            </div>
          ) : null
        }
        styles={{ body: { padding: 0 } }}
      >
        {selectedBucket && (
          <DaySections
            bucket={selectedBucket}
            onSelectBug={(bug) => {
              setSelectedDay(null);
              onSelectBug(bug);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function SummaryStat({
  tone,
  icon,
  label,
  value,
}: {
  tone: "info" | "success" | "warning" | "accent" | "danger";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={`hb-cal-summary-stat tone-${tone}`}>
      <span className="hb-cal-summary-icon">{icon}</span>
      <span className="hb-cal-summary-value">{value}</span>
      <span className="hb-cal-summary-label">{label}</span>
    </div>
  );
}

function MetricChip({
  tone,
  icon,
  label,
  count,
}: {
  tone: "info" | "success" | "warning" | "accent";
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <span className={`hb-cal-chip tone-${tone}`} title={`${count} ${label}`}>
      <span className="hb-cal-chip-icon">{icon}</span>
      <span className="hb-cal-chip-count">{count}</span>
      <span className="hb-cal-chip-label">{label}</span>
    </span>
  );
}

function DaySections({
  bucket,
  onSelectBug,
}: {
  bucket: DayBucket;
  onSelectBug: (bug: BugListItem) => void;
}) {
  const sections: Array<{
    key: string;
    title: string;
    tone: "info" | "success" | "warning" | "accent";
    icon: React.ReactNode;
    items: BugListItem[];
  }> = [
    { key: "created", title: "Created", tone: "info", icon: <BugIcon size={13} />, items: bucket.created },
    { key: "completed", title: "Completed", tone: "success", icon: <CheckCircle2 size={13} />, items: bucket.completed },
    { key: "tickets", title: "Tickets created", tone: "warning", icon: <TicketIcon size={13} />, items: bucket.tickets },
    { key: "verified", title: "Verified", tone: "accent", icon: <ShieldCheck size={13} />, items: bucket.verified },
  ];

  const hasAny = sections.some((s) => s.items.length > 0);

  if (!hasAny) {
    return (
      <div className="hb-cal-drawer-empty">
        <Info size={18} />
        <p>No activity on this day.</p>
      </div>
    );
  }

  return (
    <div className="hb-cal-drawer-body">
      {sections.map((s) =>
        s.items.length === 0 ? null : (
          <section key={s.key} className={`hb-cal-section tone-${s.tone}`}>
            <header className="hb-cal-section-head">
              <span className="hb-cal-section-icon">{s.icon}</span>
              <span className="hb-cal-section-title">{s.title}</span>
              <span className="hb-cal-section-count">{s.items.length}</span>
            </header>
            <ul className="hb-cal-section-list">
              {s.items.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="hb-cal-bug-row"
                    onClick={() => onSelectBug(b)}
                  >
                    <span className="hb-cal-bug-num">
                      {b.bugNumber ?? b.id.slice(0, 6)}
                    </span>
                    <span className="hb-cal-bug-title">
                      {b.title || b.description?.slice(0, 80) || "Untitled bug"}
                    </span>
                    {b.severity && (
                      <span
                        className="hb-cal-bug-sev"
                        style={{ background: SEVERITY_TONE[b.severity as string] || "#94a3b8" }}
                        title={b.severity as string}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </div>
  );
}
