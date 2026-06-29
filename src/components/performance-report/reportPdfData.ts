// src/components/performance-report/reportPdfData.ts
//
// Gathers EVERYTHING the printable report needs in one shot: the five modules'
// data, their scores, and the table rows — so the PDF/Word export mirrors the
// on-screen report. Reuses the same pure scorers as the live report.

import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import PerformanceReportService, { ReportTicket, ReportLeave } from '@/services/performanceReportService';
import { DailyUpdateService } from '@/services/dailyUpdateService';
import { AttendanceService } from '@/services/attendanceService';
import { TimeTrackingService } from '@/services/timeTracking.service';
import LeaveV2Service from '@/services/leaveV2Service';
import { ticketPoints, StatusMarks } from './ticketPoints';
import {
  scoreTickets,
  scoreDailyUpdates,
  scoreAttendance,
  scoreLeaves,
  timeTrackingPoints,
  avgTrackedSeconds,
  performanceBand,
} from './moduleScores';

export interface StageScore {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  enabled: boolean;
}

export interface ReportModel {
  overall: number | null;
  stages: StageScore[];
  tickets: { rows: ReportTicket[]; score: number | null };
  timeTracking: {
    score: number | null;
    avgSeconds: number;
    trackedDays: number;
    summaryTiers: { label: string; range: string; days: number; members: number }[];
    detailed: any[];
  };
  dailyUpdates: {
    score: number | null;
    expected: number;
    posted: number;
    missed: number;
    rows: any[];
  };
  attendance: {
    score: number | null;
    expected: number;
    present: number;
    absent: number;
    avgMins: number;
    rows: any[];
  };
  leaves: {
    score: number | null;
    leaveDays: number;
    paidDays: number;
    lopDays: number;
    rows: ReportLeave[];
  };
}

interface Opts {
  projectId?: string;
  userId?: string;
  range: [Dayjs, Dayjs];
  statusMarks: StatusMarks;
  bodEnabled: boolean;
  eodEnabled: boolean;
  weights: { key: string; weight: number; enabled: boolean }[];
  tickets: ReportTicket[];
}

const norm = (d: any) => dayjs(d).format('YYYY-MM-DD');
const isWeekend = (d: string) => [0, 6].includes(dayjs(d).day());

const fmtHourLabel = (dec: number) => {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, '0')}`;
};
const tierRange = (min: number, max: number | null) => {
  if (min === 0 && max !== null) return `Below ${fmtHourLabel(max)} hrs`;
  if (max === null) return `${fmtHourLabel(min)}+ hrs`;
  return `${fmtHourLabel(min)} – ${fmtHourLabel(max)} hrs`;
};

const STAGE_LABELS: Record<string, string> = {
  tickets: 'Tickets',
  time_tracking: 'Time Tracking',
  daily_updates: 'Daily Updates',
  attendance: 'Attendance',
  leaves: 'Leaves',
};

export async function gatherReportData(opts: Opts): Promise<ReportModel> {
  const from = opts.range[0].format('YYYY-MM-DD');
  const to = opts.range[1].format('YYYY-MM-DD');
  const browserTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  })();

  const [ttRes, updates, attRes, leaves, hol] = await Promise.all([
    TimeTrackingService.getPerformance({
      userIds: opts.userId ? [opts.userId] : [],
      projectId: opts.projectId || undefined,
      startDate: opts.range[0].startOf('day').toISOString(),
      endDate: opts.range[1].endOf('day').toISOString(),
      timezone: browserTz,
    }).catch(() => ({ rows: [], legend: { weekday: [], weekend: [] } } as any)),
    DailyUpdateService.getTeamUpdates({
      startDate: from,
      endDate: to,
      projectId: opts.projectId || undefined,
      userId: opts.userId || undefined,
    }).catch(() => []),
    AttendanceService.getAttendance({
      member: opts.userId || undefined,
      projectId: opts.projectId || undefined,
      startDate: opts.range[0].startOf('day').toISOString(),
      endDate: opts.range[1].endOf('day').toISOString(),
      page: 1,
      limit: 500,
    }).catch(() => ({ data: [] } as any)),
    PerformanceReportService.getLeaveReport({ from, to, memberId: opts.userId || undefined }).catch(
      () => [] as ReportLeave[]
    ),
    LeaveV2Service.getLeaveHolidayDates().catch(() => [] as string[]),
  ]);

  const holidays = new Set((hol || []).map((d: string) => d.slice(0, 10)));
  const ttRows = (ttRes as any)?.rows || [];
  const legend = (ttRes as any)?.legend || { weekday: [], weekend: [] };
  const updateRows = Array.isArray(updates) ? updates : [];
  const attendance = ((attRes as any)?.data as any[]) || [];

  // ── Tickets ────────────────────────────────────────────────────────────────
  const ticketsScore = scoreTickets(opts.tickets, opts.statusMarks);

  // ── Time Tracking ──────────────────────────────────────────────────────────
  const avgSeconds = avgTrackedSeconds(ttRows);
  const ttScore = ttRows.length ? timeTrackingPoints(avgSeconds / 3600) : null;
  const trackedDays = ttRows.length;
  const summaryTiers = (legend.weekday || []).map((t: any) => {
    const days = ttRows.filter((r: any) => r.status === t.label).length;
    const members = new Set(ttRows.filter((r: any) => r.status === t.label).map((r: any) => r.userId)).size;
    return { label: t.label, range: tierRange(t.minHours, t.maxHours), days, members };
  });

  // ── Daily Updates ──────────────────────────────────────────────────────────
  const inRange = (d: string) => d >= from && d <= to;
  const postedDate = (u: any) =>
    norm(u.is_missed && u.missed_updateAt ? u.missed_updateAt : u.createdAt);
  const realUpdates = updateRows.filter((u: any) => {
    if (u.is_missed) return false;
    const t = u.updateType || 'EOD';
    if (t === 'BOD') return opts.bodEnabled;
    if (t === 'EOD') return opts.eodEnabled;
    return true;
  });
  const visibleUpdates = realUpdates.filter((u: any) => inRange(postedDate(u)));
  const duScore = scoreDailyUpdates({
    updates: updateRows,
    attendance,
    holidays,
    range: opts.range,
    bodEnabled: opts.bodEnabled,
    eodEnabled: opts.eodEnabled,
  });
  // recompute expected/posted for the summary line
  const postedKeys = new Set<string>();
  for (const u of visibleUpdates) {
    const d = postedDate(u);
    if (isWeekend(d) || holidays.has(d)) continue;
    postedKeys.add(`${u.userId}_${d}`);
  }
  const expectedKeys = new Set<string>();
  for (const a of attendance) {
    if (a.status === 'absent') continue;
    const d = norm(a.date);
    if (!inRange(d) || isWeekend(d) || holidays.has(d)) continue;
    expectedKeys.add(`${a.userId ?? a.member?.id}_${d}`);
  }
  const duExpected = expectedKeys.size;
  const duPosted = Math.min(postedKeys.size, duExpected || postedKeys.size);

  // ── Attendance ─────────────────────────────────────────────────────────────
  const attScore = scoreAttendance({
    attendance,
    holidays,
    leaves,
    range: opts.range,
    memberId: opts.userId,
  });
  const workMins = (r: any) =>
    r.effectiveWorkMinutes ?? r.workingMinutes ?? r.totalWorkMinutes ?? 0;
  const presentRecs = attendance.filter((r: any) => r.status !== 'absent');
  const presentMins = presentRecs.reduce((s: number, r: any) => s + workMins(r), 0);
  const attAvgMins = presentRecs.length ? presentMins / presentRecs.length : 0;

  // ── Leaves ─────────────────────────────────────────────────────────────────
  const lvScore = scoreLeaves({ leaves, holidays, range: opts.range, memberId: opts.userId });
  const approvedLv = leaves.filter((l) => l.status === 'approved');
  const leaveDays = approvedLv.reduce((s, r) => s + (r.totalUnits || 0), 0);
  const paidDays = approvedLv.reduce((s, r) => s + (r.paidUnits || 0), 0);
  const lopDays = approvedLv.reduce((s, r) => s + (r.lopUnits || 0), 0);

  // ── Overview blend ─────────────────────────────────────────────────────────
  const scoreByKey: Record<string, number | null> = {
    tickets: ticketsScore,
    time_tracking: ttScore,
    daily_updates: duScore,
    attendance: attScore,
    leaves: lvScore,
  };
  const stages: StageScore[] = ['tickets', 'time_tracking', 'daily_updates', 'attendance', 'leaves'].map(
    (key) => {
      const w = opts.weights.find((x) => x.key === key);
      return {
        key,
        label: STAGE_LABELS[key],
        score: scoreByKey[key],
        weight: w?.weight ?? 0,
        enabled: w?.enabled ?? true,
      };
    }
  );
  let wsum = 0;
  let acc = 0;
  for (const s of stages) {
    if (!s.enabled || s.score === null) continue;
    acc += s.score * s.weight;
    wsum += s.weight;
  }
  const overall = wsum > 0 ? Math.round(acc / wsum) : null;

  return {
    overall,
    stages,
    tickets: { rows: opts.tickets, score: ticketsScore },
    timeTracking: { score: ttScore, avgSeconds, trackedDays, summaryTiers, detailed: ttRows },
    dailyUpdates: {
      score: duScore,
      expected: duExpected,
      posted: duPosted,
      missed: Math.max(0, duExpected - duPosted),
      rows: visibleUpdates,
    },
    attendance: {
      score: attScore,
      expected: attendance.length,
      present: presentRecs.length,
      absent: attendance.filter((r: any) => r.status === 'absent').length,
      avgMins: attAvgMins,
      rows: attendance,
    },
    leaves: { score: lvScore, leaveDays, paidDays, lopDays, rows: leaves },
  };
}

// Re-exported for the printable's per-ticket points column.
export function ticketRowPoints(t: ReportTicket, statusMarks: StatusMarks): number {
  return ticketPoints(
    { status: t.status, estimateHours: t.estimateHours ?? 0, trackedSeconds: t.trackedSeconds ?? 0 },
    statusMarks
  );
}

export { performanceBand };
