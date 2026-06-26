"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Table, Tag, Typography, Space, Row, Col, Select, Avatar, Tooltip, Button, DatePicker, Collapse, Popover } from "antd";
import {
  ClockCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FallOutlined,
  DashOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  StarOutlined,
  FireOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  BulbOutlined,
  TeamOutlined,
  FilterOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
const { RangePicker } = DatePicker;
import {
  TimeTrackingService,
  TimeTrackingEntry,
  PerformanceRow,
  PerformanceLegend,
} from "@/services/timeTracking.service";
import { ProjectService } from "@/services/projectService";
import { useMembers, useUserProjects } from "@/hooks/useGlobalData";
import dayjs from "dayjs";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import SearchableDropdown from "@/components/common/SearchableDropdown";

const { Text } = Typography;

/** Status → accent color. Weekday tiers ascend; weekend gets a distinct violet. */
// Only four color families: red (under target), blue (on target),
// green light→dark (above target, ascending), grey (weekend).
const STATUS_COLORS: Record<string, string> = {
  "Minimal Activity": "#991b1b",      // dark red
  "Low Activity": "#dc2626",          // red
  "Moderate Activity": "#f87171",     // lite red
  "Expected Hours": "#2563eb",        // blue
  "High Engagement": "#4ade80",       // lite green
  "Outstanding": "#22c55e",           // green
  "Exceptional": "#16a34a",           // green
  "Champion": "#15803d",              // dark green
  "Elite Performer": "#166534",       // darker green
  "Power Contributor": "#14532d",     // darkest green
  "Weekend Warrior (Sat)": "#64748b", // grey
  "Weekend Warrior (Sun)": "#94a3b8", // lite grey
};
const statusColor = (s: string) => STATUS_COLORS[s] || "#64748b";

/** Icon per status type, ascending from low activity to top performer. */
const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Minimal Activity": <WarningOutlined />,
  "Low Activity": <FallOutlined />,
  "Moderate Activity": <DashOutlined />,
  "Expected Hours": <CheckCircleOutlined />,
  "High Engagement": <RiseOutlined />,
  "Outstanding": <StarOutlined />,
  "Exceptional": <FireOutlined />,
  "Champion": <TrophyOutlined />,
  "Elite Performer": <CrownOutlined />,
  "Power Contributor": <ThunderboltOutlined />,
  "Weekend Warrior (Sat)": <CalendarOutlined />,
  "Weekend Warrior (Sun)": <CalendarOutlined />,
};
const statusIcon = (s: string) => STATUS_ICONS[s] || <TrophyOutlined />;

/** Decimal hours → "H:MM" with whole hours shown without minutes (4.5 → "4:30", 6 → "6"). */
const fmtHourLabel = (dec: number) => {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, "0")}`;
};
const legendRangeLabel = (min: number, max: number | null) => {
  if (min === 0 && max !== null) return `Below ${fmtHourLabel(max)} hrs`;
  if (max === null) return `${fmtHourLabel(min)}+ hrs`;
  return `${fmtHourLabel(min)} - ${fmtHourLabel(max)} hrs`;
};

/** Mirror of the Team Tracking timeline session builder (read-only here). */
const processLogsToSessions = (logs: TimeTrackingEntry["logs"], startTime: string, endTime?: string | null) => {
  const sessions: any[] = [];
  if (logs && logs.length > 0) {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let current: any = null;
    for (const log of sortedLogs) {
      if (log.action === "STARTED" || log.action === "RESUMED") {
        current = { id: log.id, start: log.createdAt, end: null, endAction: null, startLogId: log.id };
      } else if ((log.action === "PAUSED" || log.action === "STOPPED") && current) {
        current.end = log.createdAt;
        current.endAction = log.action;
        current.endLogId = log.id;
        sessions.push(current);
        current = null;
      }
    }
    if (current) {
      if (endTime && !current.end) {
        current.end = endTime;
        current.endAction = "STOPPED";
        sessions.push(current);
      } else {
        sessions.push(current);
      }
    }
  }
  if (sessions.length === 0 && startTime && endTime) {
    return [{ id: "fallback-" + startTime, start: startTime, end: endTime, endAction: "STOPPED", isManual: true }];
  }
  return sessions.reverse();
};

interface PerformanceTrackerProps {
  refreshKey?: number;
}

export const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({ refreshKey }) => {
  const { open: openTicketDrawer } = useTicketDrawer();
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [legend, setLegend] = useState<PerformanceLegend | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [filters, setFilters] = useState(() => ({
    userIds: [] as string[],
    projectId: undefined as string | undefined,
    // Default to the current month so data loads on open.
    dateRange: [dayjs().startOf("month"), dayjs().endOf("month")] as [dayjs.Dayjs, dayjs.Dayjs] | null,
  }));
  // Quick month range (from month → to month). Defaults to the current month.
  const [monthRange, setMonthRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("month"),
    dayjs().startOf("month"),
  ]);

  const { data: members = [] } = useMembers();
  const { data: projects = [] } = useUserProjects();

  const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const browserTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  // Effective range to query: an explicit date range wins, otherwise fall back
  // to the pre-selected month. The month is selected by default for convenience,
  // but data is NOT loaded until the user acts (see the mount guard below).
  const effectiveRange = useMemo<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => {
    if (filters.dateRange?.[0] && filters.dateRange?.[1]) return filters.dateRange;
    if (monthRange?.[0] && monthRange?.[1]) {
      return [monthRange[0].startOf("month"), monthRange[1].endOf("month")];
    }
    return null;
  }, [filters.dateRange, monthRange]);

  // Becomes true once the user has triggered a load at least once.
  const [hasLoaded, setHasLoaded] = useState(false);
  // Only auto-load after a real user action. The effect never sets this itself,
  // so the default month never triggers an API call on open (even in StrictMode).
  const hasInteractedRef = useRef(false);
  const markInteracted = () => {
    hasInteractedRef.current = true;
  };

  const fetchPerformance = async () => {
    if (!effectiveRange) {
      setRows([]);
      setLegend(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setHasLoaded(true);
      const startDate = effectiveRange[0].startOf("day").toISOString();
      const endDate = effectiveRange[1].endOf("day").toISOString();
      const data = await TimeTrackingService.getPerformance({
        userIds: filters.userIds,
        projectId: filters.projectId,
        startDate,
        endDate,
        timezone: browserTz,
      });
      setRows(data?.rows || []);
      setLegend(data?.legend || null);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Never auto-load until the user has interacted. The default month is
    // pre-selected for convenience but must not trigger any API call on open.
    if (!hasInteractedRef.current) return;
    fetchPerformance();
    setTablePage(1);
    // Value-based deps so changing/deselecting members always re-fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.userIds.join(","),
    filters.projectId,
    filters.dateRange?.[0]?.valueOf(),
    filters.dateRange?.[1]?.valueOf(),
    refreshKey,
  ]);

  // Live ticker for running sessions in the expanded timeline.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMonthChange = (vals: any) => {
    markInteracted();
    const range = vals as [dayjs.Dayjs, dayjs.Dayjs] | null;
    setMonthRange(range);
    if (range && range[0] && range[1]) {
      setFilters((f) => ({ ...f, dateRange: [range[0].startOf("month"), range[1].endOf("month")] }));
    }
  };

  const handleClearFilters = () => {
    // Reset back to the default: current month selected, no data loaded.
    hasInteractedRef.current = false;
    setMonthRange([dayjs().startOf("month"), dayjs().startOf("month")]);
    setFilters({
      userIds: [],
      projectId: undefined,
      dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],
    });
    setRows([]);
    setLegend(null);
    setHasLoaded(false);
    setTablePage(1);
  };

  const hasActiveFilters = !!(filters.userIds.length || filters.projectId || monthRange || filters.dateRange);

  // How many member-days landed in each status — drives the counts in the guide.
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.status] = (m[r.status] || 0) + 1;
    return m;
  }, [rows]);

  // Full status scale (weekday tiers + weekend) with color, range and live count.
  const guideItems = useMemo(() => {
    if (!legend) return [] as { label: string; range: string; color: string; count: number }[];
    const base = [
      ...legend.weekday.map((t) => ({ label: t.label, range: legendRangeLabel(t.minHours, t.maxHours) })),
      ...legend.weekend.map((w) => ({ label: w.label, range: `${w.day}` })),
    ];
    return base.map((it) => ({ ...it, color: statusColor(it.label), count: statusCounts[it.label] || 0 }));
  }, [legend, statusCounts]);

  // Plain-language insight shown above the summary card.
  const insight = useMemo(() => {
    const totalDays = rows.length;
    if (!legend || totalDays === 0) return null;

    const subject = filters.userIds.length === 1 ? "This member" : "Employees";
    const sat = statusCounts["Weekend Warrior (Sat)"] || 0;
    const sun = statusCounts["Weekend Warrior (Sun)"] || 0;
    const weekendDays = sat > 0 && sun > 0 ? "Saturday and Sunday" : sat > 0 ? "Saturday" : sun > 0 ? "Sunday" : "";

    const weekdayTiers = legend.weekday.map((t) => ({
      label: t.label,
      range: legendRangeLabel(t.minHours, t.maxHours),
      count: statusCounts[t.label] || 0,
    }));
    const top = weekdayTiers.reduce((a, b) => (b.count > a.count ? b : a), weekdayTiers[0]);

    if (!top || top.count === 0) {
      if (!weekendDays) return null;
      return (
        <>
          {subject} tracked time only on <b>{weekendDays}</b> in this period.
        </>
      );
    }

    const pct = Math.round((top.count / totalDays) * 100);
    return (
      <>
        {subject} spent <b>{pct}%</b> of tracked time between <b>{top.range}</b>{" "}
        <span className="perf-insight__band">({top.label})</span>
        {weekendDays && <> — including <b>{weekendDays}</b></>}.
      </>
    );
  }, [legend, statusCounts, rows, filters.userIds]);

  // Label for the active selection — month range takes precedence, else the date range.
  const rangeLabel = useMemo(() => {
    if (monthRange && monthRange[0] && monthRange[1]) {
      const a = monthRange[0].format("MMM YYYY");
      const b = monthRange[1].format("MMM YYYY");
      return a === b ? a : `${a} – ${b}`;
    }
    const dr = filters.dateRange;
    if (dr && dr[0] && dr[1]) {
      if (dr[0].isSame(dr[1], "day")) return dr[0].format("MMM D, YYYY");
      const sameYear = dr[0].year() === dr[1].year();
      const a = dr[0].format(sameYear ? "MMM D" : "MMM D, YYYY");
      const b = dr[1].format("MMM D, YYYY");
      return `${a} – ${b}`;
    }
    return null;
  }, [monthRange, filters.dateRange]);

  // Position lookup from the global members list (rows carry name + email, not position).
  const positionByMember = useMemo(() => {
    const map = new Map<string, string>();
    (members as any[]).forEach((m) => map.set(m.value, m.position));
    return map;
  }, [members]);

  // Unique members present in the current results, enriched with position.
  const memberDetails = useMemo(() => {
    const seen = new Map<
      string,
      { id: string; name: string; email: string; position: string; avatarUrl?: string | null }
    >();
    rows.forEach((r) => {
      if (!r.userId || seen.has(r.userId)) return;
      seen.set(r.userId, {
        id: r.userId,
        name: r.user?.name || "Unknown",
        email: r.user?.workEmail || "",
        position: positionByMember.get(r.userId) || "—",
        avatarUrl: r.user?.avatarUrl,
      });
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, positionByMember]);

  // Members chosen in the "All members" filter — shown as info cards under the filter bar.
  const selectedMembers = useMemo(() => {
    if (!filters.userIds.length) return [];
    const byId = new Map((members as any[]).map((m) => [m.value, m]));
    return filters.userIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((m: any) => ({
        id: m.value,
        name: m.label,
        email: m.email,
        position: m.position,
        avatarUrl: m.avatarUrl,
      }));
  }, [filters.userIds, members]);

  // Members of the selected project — shown as info cards under the filter bar.
  const [projectMembers, setProjectMembers] = useState<
    { id: string; name: string; email: string; position: string; avatarUrl?: string | null; isProjectManager: boolean }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    if (!filters.projectId) {
      setProjectMembers([]);
      return;
    }
    (async () => {
      try {
        const data = await ProjectService.getProjectMembers(filters.projectId!);
        if (cancelled) return;
        const byId = new Map((members as any[]).map((m) => [m.value, m]));
        setProjectMembers(
          (data || []).map((m) => ({
            id: m.value,
            name: m.label,
            email: m.workEmail,
            position: m.position,
            avatarUrl: byId.get(m.value)?.avatarUrl ?? null,
            isProjectManager: m.isProjectManager,
          })),
        );
        // Drop any selected members who aren't part of this project.
        const validIds = new Set((data || []).map((m) => m.value));
        setFilters((f) => {
          const pruned = f.userIds.filter((id) => validIds.has(id));
          return pruned.length === f.userIds.length ? f : { ...f, userIds: pruned };
        });
      } catch {
        if (!cancelled) setProjectMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters.projectId, members]);

  // Members shown in the "All members" dropdown — limited to the project's
  // members when a project is selected, so off-project members can't be picked.
  const memberOptions = useMemo(() => {
    if (filters.projectId && projectMembers.length > 0) {
      return projectMembers.map((m) => ({ value: m.id, label: m.name, avatarUrl: m.avatarUrl }));
    }
    return (members as any[]).map((m) => ({ value: m.value, label: m.label, avatarUrl: m.avatarUrl }));
  }, [filters.projectId, projectMembers, members]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const columns = [
    {
      title: "Day and Date",
      key: "date",
      width: 150,
      render: (_: any, record: PerformanceRow) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-slate-700)" }}>{dayjs(record.date).format("ddd, MMM D")}</div>
          {record.isWeekend && (
            <Tag color="default" style={{ marginTop: 2, borderRadius: 4, fontSize: 9, lineHeight: "16px" }}>
              WEEKEND
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Team Member",
      key: "user",
      render: (_: any, record: PerformanceRow) => (
        <Space>
          <Avatar src={record.user?.avatarUrl} style={{ backgroundColor: "var(--bg-holiday)", color: "var(--text-holiday)" }}>
            {record.user?.name?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>{record.user?.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-slate-400)" }}>{record.user?.workEmail}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Tickets",
      dataIndex: "ticketCount",
      key: "ticketCount",
      width: 100,
      render: (count: number) => (
        <Space size={4}>
          <Text strong style={{ color: "var(--text-slate-700)" }}>{count}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{count === 1 ? "ticket" : "tickets"}</Text>
        </Space>
      ),
    },
    {
      title: "Activity",
      dataIndex: "sessionCount",
      key: "sessionCount",
      width: 110,
      render: (count: number) => {
        if (!count) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        return (
          <Tooltip title="Click the row to expand the timeline">
            <span className="mtt-activity-pill">
              <HistoryOutlined />
              <span className="mtt-activity-pill__count">{count}</span>
              <span className="mtt-activity-pill__label">{count === 1 ? "session" : "sessions"}</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Hours Worked",
      key: "hours",
      width: 130,
      render: (_: any, record: PerformanceRow) => (
        <Tooltip
          title={
            <div style={{ padding: 4 }}>
              <div style={{ marginBottom: 4, opacity: 0.6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Project Breakdown
              </div>
              {(record.projectBreakdown || []).map((p) => (
                <div key={p.projectId} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 11, marginBottom: 2 }}>
                  <span>{p.projectName}</span>
                  <span style={{ opacity: 0.8 }}>{formatTime(p.seconds)}</span>
                </div>
              ))}
            </div>
          }
          overlayInnerStyle={{ borderRadius: 12, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(4px)" }}
        >
          <Text strong style={{ fontFamily: "monospace", color: "var(--text-slate-800)", cursor: "help" }}>
            {record.formattedDuration}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status: string) => {
        const color = statusColor(status);
        return (
          <Tag
            icon={<TrophyOutlined />}
            style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 600, color, background: `${color}1c`, border: `1px solid ${color}40` }}
          >
            {status}
          </Tag>
        );
      },
    },
  ];

  const expandedRowRender = (record: PerformanceRow) => {
    const allUserSessions: any[] = [];
    record.entries.forEach((entry) => {
      const sessions = processLogsToSessions(entry.logs, entry.startTime, entry.endTime);
      sessions.forEach((session) => {
        allUserSessions.push({
          ...session,
          entryId: entry.id,
          project: entry.project,
          ticket: entry.ticket,
          description: entry.description,
          ticketId: entry.ticketId,
          entryStatus: entry.status,
          isLive: !session.end && entry.status === "RUNNING",
        });
      });
    });

    allUserSessions.sort((a, b) => {
      const diff = new Date(b.start).getTime() - new Date(a.start).getTime();
      if (diff !== 0) return diff;
      return String(b.entryId).localeCompare(String(a.entryId));
    });

    return (
      <div style={{ padding: "10px 16px", backgroundColor: "var(--bg-pure-white)", border: "1px solid var(--border-slate-100)" }}>
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <ClockCircleOutlined style={{ color: "#2563eb", fontSize: 14 }} />
          <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>Activity Timeline</Text>
        </div>

        <div style={{ position: "relative", paddingLeft: 24 }}>
          <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1.5, background: "linear-gradient(to bottom, #2563eb, var(--border-slate-100))", borderRadius: 1 }} />

          {allUserSessions.map((session, idx) => (
            <div key={`${session.id}-${idx}`} style={{ position: "relative", marginBottom: 8 }}>
              <div style={{ position: "absolute", left: -24, top: 4, width: 12, height: 12, borderRadius: "50%", background: session.isLive ? "#22c55e" : session.endAction === "PAUSED" ? "#64748b" : "#2563eb", border: "3px solid var(--bg-pure-white)", boxShadow: "0 0 0 1px var(--border-slate-200)", zIndex: 2 }} />

              <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border-slate-200)" }}>
                <Row gutter={12} align="middle">
                  <Col flex="auto">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <Tag color="blue" style={{ borderRadius: 4, border: "none", fontWeight: 600, fontSize: 10 }}>
                        {session.project?.name || "No Project"}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(session.start).format("h:mm:ss A")} - {session.end ? dayjs(session.end).format("h:mm:ss A") : "Running"}
                      </Text>
                    </div>
                    <div>
                      {session.ticket?.title ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (session.ticketId) openTicketDrawer(session.ticketId);
                          }}
                          style={{ display: "flex", gap: 6, cursor: "pointer", alignItems: "center" }}
                        >
                          {session.ticket.ticketNumber && (
                            <Text strong style={{ fontSize: 13, color: "var(--premium-blue)", whiteSpace: "nowrap" }}>
                              [{session.ticket.ticketNumber}]
                            </Text>
                          )}
                          <Text strong style={{ fontSize: 13, color: "var(--text-slate-900)" }}>{session.ticket.title}</Text>
                        </div>
                      ) : (
                        <Text strong style={{ fontSize: 13, color: "var(--text-slate-900)" }}>{session.description || "No description provided"}</Text>
                      )}
                    </div>
                  </Col>
                  <Col style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ padding: "2px 10px", background: session.isLive ? "var(--bg-holiday)" : "var(--bg-table-header)", borderRadius: 12, color: session.isLive ? "#16a34a" : "var(--text-slate-700)", fontWeight: 700, fontSize: 12, fontFamily: "monospace", border: "1px solid var(--border-slate-100)" }}>
                        {(() => {
                          const start = new Date(session.start).getTime();
                          const end = session.end ? new Date(session.end).getTime() : currentTime.getTime();
                          const diff = Math.floor((end - start) / 1000);
                          const h = Math.floor(diff / 3600);
                          const m = Math.floor((diff % 3600) / 60);
                          const s = diff % 60;
                          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                        })()}
                      </div>
                      <Tag color={session.isLive ? "processing" : session.endAction === "PAUSED" ? "blue" : "default"} style={{ borderRadius: 4, fontSize: 9 }}>
                        {session.isLive ? "LIVE" : session.endAction === "PAUSED" ? "PAUSED" : session.entryStatus === "MANUAL_UPDATED" ? "MANUAL" : "STOPPED"}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          ))}

          {allUserSessions.length === 0 && (
            <div style={{ color: "#94a3b8", fontStyle: "italic", padding: "20px 0" }}>No activity recorded for this period.</div>
          )}
        </div>
      </div>
    );
  };

  // Pagination
  const total = rows.length;
  // Average tracked hours per tracked day, across all members in range.
  const totalTrackedSeconds = rows.reduce((sum, r) => sum + (r.totalSeconds || 0), 0);
  const avgSecondsPerDay = total > 0 ? Math.round(totalTrackedSeconds / total) : 0;
  const avgPerDayLabel = formatTime(avgSecondsPerDay);
  // Verbose form for the insight banner, e.g. "6 hours 23 mins".
  const avgPerDayVerbose = (() => {
    const h = Math.floor(avgSecondsPerDay / 3600);
    const m = Math.floor((avgSecondsPerDay % 3600) / 60);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
    parts.push(`${m} ${m === 1 ? "min" : "mins"}`);
    return parts.join(" ");
  })();
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pagedData = rows.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  // Main summary table — one row per status type.
  const summaryData = guideItems.map((item) => {
    const memberCount = new Set(
      rows.filter((r) => r.status === item.label).map((r) => r.userId)
    ).size;
    const pct = total > 0 ? (item.count / total) * 100 : 0;
    return { ...item, memberCount, pct };
  });

  const summaryColumns = [
    {
      title: "Type",
      key: "type",
      render: (_: any, r: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="perf-type-icon" style={{ background: `${r.color}1c`, color: r.color }}>
            {statusIcon(r.label)}
          </span>
          <span style={{ fontWeight: 600, color: "var(--text-slate-800)" }}>{r.label}</span>
        </div>
      ),
    },
    {
      title: "Hours Between",
      dataIndex: "range",
      key: "range",
      width: 120,
      render: (v: string) => <span style={{ color: "var(--text-slate-500)" }}>{v}</span>,
    },
    {
      title: "Days",
      dataIndex: "count",
      key: "count",
      width: 70,
      render: (c: number, r: any) => (
        <span style={{ fontWeight: 700, color: c > 0 ? r.color : "var(--text-slate-400)", fontVariantNumeric: "tabular-nums" }}>{c}</span>
      ),
    },
    {
      title: "Members",
      dataIndex: "memberCount",
      key: "memberCount",
      width: 84,
      render: (m: number) => <span style={{ color: "var(--text-slate-600)", fontWeight: 600 }}>{m}</span>,
    },
    {
      title: "Share",
      key: "share",
      width: 80,
      render: (_: any, r: any) => (
        <span className="perf-share__num" style={{ color: r.pct > 0 ? r.color : undefined }}>
          {Math.round(r.pct)}%
        </span>
      ),
    },
  ];

  // 12 status types — split 6 / 6 across two side-by-side tables.
  const fullSummary = summaryData;
  const half = Math.ceil(fullSummary.length / 2);
  const leftData = fullSummary.slice(0, half);
  const rightData = fullSummary.slice(half);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* ── Page header ── */}
      <div className="perf-page-head">
        <div className="perf-page-head__icon">
          <DashboardOutlined />
        </div>
        <div>
          <div className="perf-page-head__title">Performance Tracker</div>
          <div className="perf-page-head__subtitle">
            Daily tracked hours and performance tiers across your team
          </div>
        </div>
      </div>

      {/* ── Filters (top, box-shaped bar) ── */}
      <div className="perf-filterbar">
          <div className="mtt-team-filters">
            <span className="perf-filterbar__label">
              <FilterOutlined />
              Filters
            </span>
            <SearchableDropdown
              value={filters.projectId}
              onChange={(v) => { markInteracted(); setFilters((f) => ({ ...f, projectId: v as string | undefined })); }}
              placeholder="All projects"
              searchPlaceholder="Search by name"
              itemNoun="projects"
              width={240}
              className="perf-filter-ctl"
              style={{ borderRadius: 6 }}
              options={projects.map((p) => ({ value: p.value, label: p.label }))}
            />
            <SearchableDropdown
              mode="multiple"
              value={filters.userIds}
              onChange={(v) => { markInteracted(); setFilters((f) => ({ ...f, userIds: (v as string[]) || [] })); }}
              placeholder="All members"
              searchPlaceholder="Search by name"
              itemNoun="members"
              width={240}
              className="perf-filter-ctl"
              style={{ borderRadius: 6 }}
              options={memberOptions}
            />

            <RangePicker
              picker="month"
              className="mtt-team-filters__month perf-filter-ctl"
              placeholder={["From month", "To month"]}
              format="MMM YYYY"
              allowClear
              value={monthRange}
              onChange={handleMonthChange}
            />

            <RangePicker
              className="mtt-team-filters__range perf-filter-ctl"
              allowClear
              value={filters.dateRange}
              onChange={(dates) => {
                markInteracted();
                setMonthRange(null);
                setFilters((f) => ({ ...f, dateRange: dates as any }));
              }}
            />

            {hasActiveFilters && (
              <Button onClick={handleClearFilters} className="mtt-team-filters__clear" size="small">
                Clear filters
              </Button>
            )}

            <Tooltip title="Reload data (keeps your filters)">
              <Button onClick={() => { markInteracted(); fetchPerformance(); }} icon={<ReloadOutlined />} loading={loading} className="mtt-tracker-card__action mtt-team-card__refresh" size="small" />
            </Tooltip>
          </div>
      </div>

      {/* ── Selected member info cards ── */}
      {selectedMembers.length > 0 && (
        <div className="perf-selected-members">
          {selectedMembers.map((m) => (
            <div key={m.id} className="perf-selected-card">
              <Avatar
                size={40}
                src={m.avatarUrl || undefined}
                style={{ backgroundColor: "var(--bg-holiday)", color: "var(--text-holiday)", flexShrink: 0 }}
              >
                {m.name?.[0]?.toUpperCase()}
              </Avatar>
              <div className="perf-selected-card__info">
                <div className="perf-selected-card__name">
                  <span className="perf-selected-card__name-text">{m.name}</span>
                </div>
                <div className="perf-selected-card__email" title={m.email || undefined}>{m.email || "—"}</div>
                <div className="perf-selected-card__position" title={m.position || undefined}>{m.position || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Selected project member info cards ── */}
      {filters.projectId && projectMembers.length > 0 && (
        <div className="perf-member-group">
          <div className="perf-member-group__label">
            <TeamOutlined /> Project members <span className="perf-member-group__count">{projectMembers.length}</span>
          </div>
          <div className="perf-selected-members">
            {projectMembers.map((m) => (
              <div key={m.id} className="perf-selected-card">
                <Avatar
                  size={40}
                  src={m.avatarUrl || undefined}
                  style={{ backgroundColor: "var(--bg-holiday)", color: "var(--text-holiday)", flexShrink: 0 }}
                >
                  {m.name?.[0]?.toUpperCase()}
                </Avatar>
                <div className="perf-selected-card__info">
                  <div className="perf-selected-card__name">
                    <span className="perf-selected-card__name-text">{m.name}</span>
                    {m.isProjectManager && <span className="perf-selected-card__pm">PM</span>}
                  </div>
                  <div className="perf-selected-card__email" title={m.email || undefined}>{m.email || "—"}</div>
                  <div className="perf-selected-card__position" title={m.position || undefined}>{m.position || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Insight banner ── */}
      {(insight || avgSecondsPerDay > 0) && (
        <div className="perf-insight">
          <BulbOutlined className="perf-insight__icon" />
          {insight && <span className="perf-insight__text">{insight}</span>}
          {avgSecondsPerDay > 0 && (
            <>
              {insight && <span className="perf-insight__divider" />}
              <span className="perf-insight__avg">
                AVERAGE <b>{avgPerDayVerbose}</b> per day
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Main summary table: status types ── */}
      <div className="perf-summary">
        <div className="perf-summary__head">
          <div className="perf-summary__heading">
            <div className="perf-summary__title">Performance Summary</div>
            {total > 0 && (
              <span className="perf-summary__avg">
                <ClockCircleOutlined style={{ fontSize: 11 }} />
                Avg <strong>{avgPerDayLabel}</strong> / day
              </span>
            )}
          </div>
          <div className="perf-summary__meta">
            {rangeLabel && (
              <span className="perf-guide__range">
                <CalendarOutlined style={{ fontSize: 11 }} />
                {rangeLabel}
              </span>
            )}
            {memberDetails.length > 0 && (
              <Popover
                trigger="click"
                placement="bottomRight"
                overlayClassName="perf-members-pop"
                content={
                  <div className="perf-members-list">
                    {memberDetails.map((m) => (
                      <div key={m.id} className="perf-members-item">
                        <Avatar
                          size={34}
                          src={m.avatarUrl || undefined}
                          style={{ backgroundColor: "var(--bg-holiday)", color: "var(--text-holiday)", flexShrink: 0 }}
                        >
                          {m.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <div className="perf-members-item__info">
                          <div className="perf-members-item__name">{m.name}</div>
                          <div className="perf-members-item__email">{m.email || "—"}</div>
                          <div className="perf-members-item__position">{m.position}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                <span className="perf-summary__members" role="button" tabIndex={0}>
                  <TeamOutlined style={{ fontSize: 11 }} />
                  <strong>{memberDetails.length}</strong> {memberDetails.length === 1 ? "member" : "members"}
                </span>
              </Popover>
            )}
            <span className="perf-summary__total">
              <strong>{total}</strong> tracked {total === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
        {fullSummary.length === 0 ? (
          <Table
            className="mtt-team-table perf-summary-table"
            columns={summaryColumns}
            dataSource={[]}
            rowKey="label"
            loading={loading}
            pagination={false}
            size="small"
            locale={{
              emptyText: (
                <div className="mtt-tracker-card__empty">
                  <div className="mtt-tracker-card__empty-icon">
                    {hasLoaded ? <TrophyOutlined /> : <CalendarOutlined />}
                  </div>
                  <div className="mtt-tracker-card__empty-title">
                    {hasLoaded ? "No performance data in this range" : "Select filters to view performance"}
                  </div>
                  <div className="mtt-tracker-card__empty-sub">
                    {hasLoaded
                      ? "Pick a project, members and a date range to see results."
                      : "Adjust the filters or hit refresh to load the selected month."}
                  </div>
                </div>
              ),
            }}
          />
        ) : (
          <div className="perf-summary__split">
            <div className="perf-summary__col">
              <Table
                className="mtt-team-table perf-summary-table"
                columns={summaryColumns}
                dataSource={leftData}
                rowKey="label"
                pagination={false}
                size="small"
              />
            </div>
            <div className="perf-summary__col">
              <Table
                className="mtt-team-table perf-summary-table"
                columns={summaryColumns}
                dataSource={rightData}
                rowKey="label"
                pagination={false}
                size="small"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Detailed tracking (accordion) ── */}
      <Collapse
        className="perf-detail"
        bordered={false}
        items={[
          {
            key: "detail",
            label: (
              <span className="perf-detail__label">
                <HistoryOutlined />
                Detailed Tracking
                <span className="perf-detail__badge">{total}</span>
              </span>
            ),
            children: (
              <div className="perf-detail__body">
                <div style={{ overflow: "auto" }}>
                  <Table
                    className="mtt-team-table"
                    columns={columns}
                    dataSource={pagedData}
                    loading={loading}
                    rowKey={(record) => `${record.userId}_${record.date}`}
                    expandable={{ expandedRowRender }}
                    pagination={false}
                    size="small"
                    scroll={{ x: 950 }}
                    locale={{
                      emptyText: loading ? <></> : (
                        <div className="mtt-tracker-card__empty">
                          <div className="mtt-tracker-card__empty-icon"><HistoryOutlined /></div>
                          <div className="mtt-tracker-card__empty-title">No tracking records</div>
                          <div className="mtt-tracker-card__empty-sub">Adjust the filters above to see detailed records.</div>
                        </div>
                      ),
                    }}
                  />
                </div>

                {total > 0 && (
                  <div className="mtt-footer">
                    <div className="mtt-footer-info">
                      Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                    </div>
                    <div className="mtt-pager">
                      <button type="button" className="mtt-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                      {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                        <button key={p} type="button" className={`mtt-pager-num ${p === tablePage ? "is-active" : ""}`} onClick={() => setTablePage(p)}>{p}</button>
                      ))}
                      <button type="button" className="mtt-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                      <Select
                        className="mtt-pagesize"
                        value={tablePageSize}
                        onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                        options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                        popupMatchSelectWidth={120}
                      />
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      <style jsx global>{`
        /* Page header */
        .perf-page-head {
          display: flex; align-items: center; gap: 12px;
          padding: 0 2px 12px 2px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .perf-page-head__icon {
          width: 38px; height: 38px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; font-size: 18px; color: #3b82f6;
          background: rgba(59, 130, 246, 0.10);
          border: 1px solid rgba(59, 130, 246, 0.18);
        }
        [data-theme='dark'] .perf-page-head__icon {
          background: rgba(59, 130, 246, 0.16); border-color: rgba(59, 130, 246, 0.28); color: #93c5fd;
        }
        .perf-page-head__title {
          font-size: 16px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15;
          color: var(--text-slate-900);
        }
        .perf-page-head__subtitle {
          margin-top: 2px; font-size: 12px; font-weight: 500; color: var(--text-slate-500);
        }

        .perf-filterbar {
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .mtt-team-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .perf-filterbar__label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; color: var(--text-slate-600);
          padding-right: 4px; white-space: nowrap;
        }
        .perf-filterbar__label .anticon { color: #3b82f6; font-size: 13px; }
        /* Uniform width + height for every filter control */
        .mtt-team-filters .perf-filter-ctl { width: 210px !important; min-width: 210px !important; }
        .mtt-team-filters .sd-trigger.perf-filter-ctl { height: 36px !important; }
        .mtt-team-filters .ant-picker.perf-filter-ctl { height: 36px !important; border-radius: 6px !important; }
        /* Selected member info cards */
        .perf-member-group { margin-top: 8px; }
        .perf-member-group__label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--text-slate-500); margin-bottom: 2px;
        }
        .perf-member-group__label .anticon { color: #3b82f6; }
        .perf-member-group__count {
          font-size: 10.5px; font-weight: 700; color: var(--text-slate-600);
          background: var(--bg-secondary); border: 1px solid var(--border-slate-200);
          border-radius: 999px; padding: 0 7px; line-height: 16px;
        }
        .perf-selected-card__pm {
          flex-shrink: 0; margin-left: 0; font-size: 9.5px; font-weight: 800; letter-spacing: 0.03em;
          color: #2563eb; background: rgba(37, 99, 235, 0.10);
          border: 1px solid rgba(37, 99, 235, 0.22); border-radius: 4px; padding: 1px 5px;
          vertical-align: middle;
        }
        .perf-selected-members {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
          gap: 8px; margin-top: 8px;
        }
        .perf-selected-card {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          border-radius: 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .perf-selected-card:hover {
          border-color: var(--border-slate-300, #cbd5e1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.07);
        }
        .perf-selected-card .ant-avatar {
          width: 34px !important; height: 34px !important; line-height: 34px !important;
          font-size: 14px !important; font-weight: 700;
        }
        .perf-selected-card__info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .perf-selected-card__name {
          display: flex; align-items: center; gap: 5px;
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2;
        }
        .perf-selected-card__name-text {
          min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .perf-selected-card__email {
          font-size: 11px; color: var(--text-slate-500); line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .perf-selected-card__position {
          font-size: 10.5px; font-weight: 500; color: var(--text-slate-400); line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }

        /* Insight banner */
        .perf-insight {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
          padding: 10px 14px;
          border: 1px solid rgba(37, 99, 235, 0.22);
          border-left: 3px solid #2563eb;
          background: rgba(37, 99, 235, 0.06);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .perf-insight__icon { color: #2563eb; font-size: 16px; flex-shrink: 0; }
        .perf-insight__text { font-size: 13px; color: var(--text-slate-700); line-height: 1.45; }
        .perf-insight__text b { color: var(--text-slate-900); font-weight: 700; }
        .perf-insight__band { color: var(--text-slate-500); font-weight: 600; }
        .perf-insight__divider { width: 1px; align-self: stretch; background: rgba(37, 99, 235, 0.25); margin: 0 2px; }
        .perf-insight__avg {
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-slate-500); white-space: nowrap;
        }
        .perf-insight__avg b { color: #16a34a; font-weight: 800; }
        [data-theme='dark'] .perf-insight { background: rgba(37, 99, 235, 0.12); border-color: rgba(96, 165, 250, 0.3); }

        /* Main summary table */
        .perf-summary {
          margin-top: 6px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .perf-summary__head {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
          padding: 11px 14px; border-bottom: 1px solid var(--border-slate-100);
        }
        .perf-summary__heading { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .perf-summary__title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .perf-summary__avg {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; color: var(--text-slate-600);
          background: var(--bg-secondary); border: 1px solid var(--border-slate-200);
          border-radius: 999px; padding: 3px 10px; white-space: nowrap;
        }
        .perf-summary__avg .anticon { color: #16a34a; }
        .perf-summary__avg strong { color: var(--text-slate-800); font-weight: 800; }
        .perf-summary__meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .perf-summary__total { font-size: 11.5px; font-weight: 500; color: var(--text-slate-400); }
        .perf-summary__total strong { color: var(--text-slate-700); font-weight: 800; font-size: 14px; }
        .perf-summary__members {
          display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
          font-size: 11px; font-weight: 600; color: var(--text-slate-600);
          background: var(--bg-secondary); border: 1px solid var(--border-slate-200);
          border-radius: 999px; padding: 3px 10px; white-space: nowrap;
          transition: border-color 0.15s, color 0.15s;
        }
        .perf-summary__members:hover { border-color: #2563eb; color: #2563eb; }
        .perf-summary__members .anticon { color: #2563eb; }
        .perf-summary__members strong { color: var(--text-slate-800); font-weight: 800; }
        .perf-members-list { display: flex; flex-direction: column; max-height: 320px; overflow-y: auto; min-width: 240px; }
        .perf-members-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 4px; border-bottom: 1px solid var(--border-slate-100);
        }
        .perf-members-item:last-child { border-bottom: none; }
        .perf-members-item__info { min-width: 0; }
        .perf-members-item__name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); line-height: 1.3; }
        .perf-members-item__email { font-size: 11.5px; color: var(--text-slate-500); line-height: 1.3; word-break: break-all; }
        .perf-members-item__position { font-size: 11px; color: var(--text-slate-400); line-height: 1.3; }
        .perf-guide__range {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; color: var(--text-slate-600);
          background: var(--bg-secondary); border: 1px solid var(--border-slate-200);
          border-radius: 999px; padding: 3px 10px; white-space: nowrap;
        }
        .perf-guide__range .anticon { color: #2563eb; }
        .perf-summary__split { display: flex; align-items: flex-start; }
        .perf-summary__col { flex: 1; min-width: 0; }
        .perf-summary__col + .perf-summary__col { border-left: 1px solid var(--border-slate-200); }
        .perf-summary-table .perf-row-total > td {
          background: var(--bg-secondary) !important;
          font-weight: 700 !important;
          border-top: 1px solid var(--border-slate-200) !important;
        }
        @media (max-width: 880px) {
          .perf-summary__split { flex-direction: column; }
          .perf-summary__col + .perf-summary__col { border-left: none; border-top: 1px solid var(--border-slate-200); }
        }
        .perf-type-icon {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .perf-share__num {
          font-size: 13px; font-weight: 700; color: var(--text-slate-600);
          font-variant-numeric: tabular-nums;
        }

        /* Detailed tracking accordion */
        .perf-detail {
          margin-top: 6px;
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 0 !important;
          background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .perf-detail .ant-collapse-item { border: none !important; }
        .perf-detail .ant-collapse-header { padding: 12px 14px !important; align-items: center !important; }
        .perf-detail__label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: var(--text-slate-800);
        }
        .perf-detail__label .anticon { color: #2563eb; }
        .perf-detail__badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 18px; padding: 0 6px;
          background: var(--bg-secondary); border: 1px solid var(--border-slate-200);
          font-size: 11px; font-weight: 700; color: var(--text-slate-600); font-variant-numeric: tabular-nums;
        }
        .perf-detail .ant-collapse-content { border-top: 1px solid var(--border-slate-100) !important; }
        .perf-detail .ant-collapse-content-box { padding: 0 !important; }
        .perf-detail__body { display: flex; flex-direction: column; }
        .ant-table-thead > tr > th {
          background: var(--bg-table-header) !important;
          color: var(--text-slate-600) !important;
          font-weight: 600 !important;
          font-size: 10.5px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          padding: 7px 14px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 7px 14px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          background-color: var(--bg-pure-white) !important;
          font-size: 13px !important;
          color: var(--text-slate-900) !important;
        }
        /* Compact member avatar in the dense table */
        .mtt-team-table .ant-avatar { width: 26px !important; height: 26px !important; line-height: 26px !important; font-size: 12px !important; }
        .ant-table-row:hover > td { background-color: var(--bg-table-header) !important; }
        .mtt-team-card { overflow: visible !important; }
        .mtt-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 12px 20px; border-top: 1px solid var(--border-slate-200);
        }
        .mtt-footer--fixed {
          position: sticky; bottom: 0; z-index: 100; margin-top: auto;
          margin-left: -20px; margin-right: -20px; margin-bottom: -14px;
          padding: 12px 20px; background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .mtt-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .mtt-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .mtt-pager { display: flex; align-items: center; gap: 3px; }
        .mtt-pager-btn, .mtt-pager-num {
          display: flex; align-items: center; justify-content: center;
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; padding: 0;
        }
        .mtt-pager-btn:hover:not(:disabled), .mtt-pager-num:hover:not(.is-active) {
          border-color: #cbd5e1; color: var(--text-slate-900); background: var(--bg-slate-50);
        }
        .mtt-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .mtt-pager-num.is-active { background: #3B82F6; color: white; border-color: #3B82F6; }
        .mtt-pagesize { margin-left: 5px; }
        .mtt-pagesize.ant-select .ant-select-selector {
          height: 28px !important; border-radius: 7px !important; font-size: 12.5px !important; font-weight: 600 !important;
        }
        [data-theme='dark'] .mtt-footer, [data-theme='dark'] .mtt-footer--fixed { background: var(--bg-secondary); border-color: rgba(255,255,255,0.06); }
        [data-theme='dark'] .mtt-pager-btn, [data-theme='dark'] .mtt-pager-num { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); color: var(--text-slate-400); }
        [data-theme='dark'] .mtt-pager-num.is-active { background: #3B82F6; color: white; border-color: #3B82F6; }
      `}</style>
    </div>
  );
};

export default PerformanceTracker;
