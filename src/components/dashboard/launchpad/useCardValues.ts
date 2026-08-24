"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { useCalendar } from "@/hooks/useCalendar";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { DailyUpdateService } from "@/services/dailyUpdateService";
import { AttendanceService } from "@/services/attendanceService";
import TicketService from "@/services/ticketService";
import PayrollV2Service, { PayPayslip } from "@/services/payrollV2Service";

/** One value chip under a card title. An empty label renders the value alone. */
export interface CardValue {
  label: string;
  value: string;
}

export type CardValues = Record<string, CardValue[]>;

/** An inline button rendered on the same line as a card's values. */
export interface CardAction {
  label: string;
  loading: boolean;
  onClick: () => void;
}

export type CardActions = Record<string, CardAction>;

const hhmm = (iso?: string | null) =>
  iso && dayjs(iso).isValid() ? dayjs(iso).format("h:mm A") : null;

/** "7.4" hours → "07:24". */
const hoursToClock = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const minutesToClock = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
    Math.round(mins % 60),
  ).padStart(2, "0")}`;

const ATT_STATE_LABEL: Record<string, string> = {
  working: "Clocked in",
  paused: "On a break",
  complete: "Shift complete",
  not_started: "Not started",
};

/**
 * Fetches every value the launchpad's card list renders inline.
 *
 * Each source is probed independently — one failing endpoint leaves that card
 * without lines rather than blanking the whole panel.
 */
export function useCardValues() {
  const { user } = useAuth();
  const { events: calendarEvents } = useCalendar();

  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [updates, setUpdates] = useState<{ bod: any; eod: any }>({
    bod: null,
    eod: null,
  });
  const [attendance, setAttendance] = useState<any>(null);
  const [avgHours, setAvgHours] = useState<string | null>(null);
  const [ticketStats, setTicketStats] = useState<{
    open: number;
    closed: number;
    total: number;
  } | null>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<PayPayslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const settle = async <T,>(fn: () => Promise<T>, onOk: (v: T) => void) => {
      try {
        onOk(await fn());
      } catch (error) {
        console.error("[launchpad] value fetch failed", error);
      }
    };

    await Promise.all([
      settle(() => dashboardService.getDashboardSummary(), setSummary),

      settle(
        () =>
          DailyUpdateService.getMyUpdates({
            date: new Date().toISOString().split("T")[0],
          }),
        (rows: any[]) =>
          setUpdates({
            bod: rows.find((r) => r.updateType === "BOD") || null,
            eod: rows.find((r) => r.updateType === "EOD") || null,
          }),
      ),

      settle(() => AttendanceService.getTodayAttendance(), setAttendance),

      settle(
        () => AttendanceService.getLast5DaysAverage(),
        (res: any) => {
          const avg = res?.averageHours;
          if (typeof avg === "number") setAvgHours(hoursToClock(avg));
          else if (typeof avg === "string") setAvgHours(avg);
        },
      ),

      settle(
        () =>
          Promise.all([
            TicketService.getMyTickets({ limit: 1 }),
            TicketService.getMyTickets({ status: "completed", limit: 1 }),
            TicketService.getMyTickets({ status: "live", limit: 1 }),
          ]),
        ([all, completed, live]: any[]) => {
          const total = all.pagination.total;
          const closed = completed.pagination.total + live.pagination.total;
          setTicketStats({ open: total - closed, closed, total });
        },
      ),

      settle(
        () => TicketService.getMyTickets({ page: 1, limit: 6 }),
        (res: any) => setRecentTickets(res.data || []),
      ),

      settle(() => PayrollV2Service.getMyPayslips(), setPayslips),
    ]);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const clockIn = useCallback(async () => {
    setClocking(true);
    try {
      setAttendance(await AttendanceService.clockIn());
      // Other surfaces (the classic dashboard, the top nav timer) listen for this.
      window.dispatchEvent(new Event("attendance:refresh"));
    } catch (error) {
      console.error("Failed to clock in", error);
    } finally {
      setClocking(false);
    }
  }, []);

  /** Day-state derived the same way the classic dashboard derives it. */
  const attState: string =
    attendance?.state ??
    (attendance?.canClockIn
      ? "not_started"
      : attendance?.canClockOut
        ? "working"
        : attendance
          ? "complete"
          : "not_started");

  /** Today's meetings the signed-in user actually attends. */
  const todaysMeetings = useMemo(() => {
    const today = dayjs().startOf("day");
    return (calendarEvents || []).filter((event: any) => {
      const attends =
        (Array.isArray(event.attendees) &&
          event.attendees.some(
            (email: any) =>
              typeof email === "string" &&
              email.toLowerCase() === user?.email?.toLowerCase(),
          )) ||
        event.userId === user?.id;
      return attends && dayjs(event.startTime).isSame(today, "day");
    });
  }, [calendarEvents, user]);

  const actions = useMemo<CardActions>(() => {
    const out: CardActions = {};
    if (attendance?.canClockIn) {
      out.dailyAttendanceCard = {
        label: "Clock in",
        loading: clocking,
        onClick: clockIn,
      };
    }
    return out;
  }, [attendance, clocking, clockIn]);

  const values = useMemo<CardValues>(() => {
    const out: CardValues = {};
    const stats = summary?.stats;
    const leaves = summary?.todayLeaves;

    /* ── Me · status ─────────────────────────────────────────────── */

    out.metricDailyUpdates = [
      {
        label: "BOD",
        value: updates.bod
          ? `Submitted ${hhmm(updates.bod.submittedAt) || ""}`.trim()
          : "Not submitted",
      },
      {
        label: "EOD",
        value: updates.eod
          ? `Submitted ${hhmm(updates.eod.submittedAt) || ""}`.trim()
          : "Not submitted",
      },
    ];

    if (avgHours) {
      out.metricAvgHours = [{ label: "Last 5 days average", value: avgHours }];
    }

    if (ticketStats) {
      const rate = ticketStats.total
        ? Math.round((ticketStats.closed / ticketStats.total) * 100)
        : 0;
      const myTickets: CardValue[] = [
        { label: "Open", value: String(ticketStats.open) },
        { label: "Closed", value: String(ticketStats.closed) },
        { label: "Total", value: String(ticketStats.total) },
        { label: "Completion", value: `${rate}%` },
      ];
      out.metricMyTickets = myTickets;
      out.myTicketsProgress = myTickets;
    }

    if (leaves) {
      out.metricTeamToday = [
        { label: "On leave", value: String(leaves.onLeave?.length ?? 0) },
        {
          label: "Work from home",
          value: String(leaves.workingFromHome?.length ?? 0),
        },
        {
          label: "On permission",
          value: String(leaves.onPermission?.length ?? 0),
        },
      ];
    }

    /* ── Me · cards ──────────────────────────────────────────────── */

    out.heroSection = [
      { label: "Today", value: dayjs().format("dddd, MMM D") },
      { label: "Signed in as", value: user?.name || "—" },
    ];

    if (attendance) {
      // The status reads as a standalone phrase, so it carries no label.
      const lines: CardValue[] = [
        { label: "", value: ATT_STATE_LABEL[attState] || attState },
      ];

      if (attState !== "not_started") {
        // Worked time leads — it is the number people actually look for, and
        // only the first two values stay inline before "Show more".
        lines.push({
          label: "Worked",
          value: minutesToClock(attendance.totalWorkMinutes ?? 0),
        });
        const inAt = hhmm(attendance.clockIn || attendance.clockInTime);
        if (inAt) lines.push({ label: "Since", value: inAt });
        const outAt = hhmm(attendance.clockOut || attendance.clockOutTime);
        if (outAt) lines.push({ label: "Out", value: outAt });
        if (attendance.breakMinutes) {
          lines.push({
            label: "Break",
            value: minutesToClock(attendance.breakMinutes),
          });
        }
      }

      out.dailyAttendanceCard = lines;
    }

    if (recentTickets.length) {
      out.recentTickets = recentTickets.map((t: any) => ({
        label: t.ticketNumber || "Ticket",
        value: t.title || "Untitled",
      }));
    }

    if (todaysMeetings.length) {
      out.calendar = todaysMeetings.map((m: any) => ({
        label: hhmm(m.startTime) || "Today",
        value: m.title || m.summary || "Untitled meeting",
      }));
    } else {
      out.calendar = [{ label: "Today", value: "No meetings scheduled" }];
    }

    if (payslips.length) {
      out.cardSalarySlip = payslips.slice(0, 6).map((p) => ({
        label: p.periodLabel || `${p.month}/${p.year}`,
        value: `Net ${Math.round(p.net).toLocaleString()}`,
      }));
    }

    /* ── Organization ────────────────────────────────────────────── */

    if (stats) {
      out.metricTotalMembers = [
        { label: "Active members", value: String(stats.totalMembers ?? 0) },
      ];
      out.metricActiveProjects = [
        { label: "Active projects", value: String(stats.activeProjects ?? 0) },
      ];
      out.metricOrgTickets = [
        { label: "Assigned", value: String(stats.tickets?.assigned ?? 0) },
        { label: "Closed", value: String(stats.tickets?.closed ?? 0) },
        { label: "Total", value: String(stats.tickets?.total ?? 0) },
        {
          label: "Completion",
          value: `${Math.round(stats.tickets?.completionRate ?? 0)}%`,
        },
      ];
      out.metricOrgTeamToday = [
        { label: "Present", value: String(stats.attendance?.present ?? 0) },
        { label: "Absent", value: String(stats.attendance?.absent ?? 0) },
        { label: "Late", value: String(stats.attendance?.late ?? 0) },
        {
          label: "Attendance rate",
          value: `${Math.round(stats.attendance?.attendanceRate ?? 0)}%`,
        },
      ];
    }

    if (summary?.projectProgress?.length) {
      out.cardProjectPulse = summary.projectProgress.map((p) => ({
        label: p.name,
        value: `${Math.round(p.progress)}% · ${p.completedTickets}/${p.totalTickets} tickets`,
      }));
    }

    if (summary?.upcomingBirthdays?.length) {
      out.upcomingBirthdays = summary.upcomingBirthdays.map((b) => ({
        label: b.name,
        value:
          b.daysUntil === 0
            ? "Today 🎉"
            : b.daysUntil === 1
              ? "Tomorrow"
              : `In ${b.daysUntil} days`,
      }));
    }

    if (leaves) {
      const rows: CardValue[] = [
        ...(leaves.onLeave || []).map((l) => ({
          label: l.user?.name || "—",
          value: `On leave · ${l.type}`,
        })),
        ...(leaves.workingFromHome || []).map((l) => ({
          label: l.user?.name || "—",
          value: "Work from home",
        })),
        ...(leaves.onPermission || []).map((l) => ({
          label: l.user?.name || "—",
          value: "On permission",
        })),
      ];
      out.cardTodayLeaves = rows.length
        ? rows
        : [{ label: "Today", value: "Everyone is in" }];
    }

    if (summary?.recentActivities?.length) {
      out.cardRecentActivities = summary.recentActivities.map((a) => ({
        label: a.user,
        value: `${a.action} ${a.ticketNumber || a.target || ""}`.trim(),
      }));
    }

    return out;
  }, [
    summary,
    updates,
    attendance,
    avgHours,
    ticketStats,
    recentTickets,
    payslips,
    todaysMeetings,
    attState,
    user,
  ]);

  return { values, actions, loading, reload: load };
}
