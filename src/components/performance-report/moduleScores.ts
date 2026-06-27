// src/components/performance-report/moduleScores.ts
//
// Per-module scoring helpers for the report's "Avg points" cards. Each module
// scores 0–100 so they can be blended by their Settings weights (Overview tab).

import dayjs, { Dayjs } from 'dayjs';
import { ticketPoints, StatusMarks } from './ticketPoints';

/**
 * Time Tracking — average tracked hours/day → score. 6h = 100 (Expected Hours);
 * lower tiers fall toward "concern", mirroring the Performance Tracker legend:
 *   ≥ 6h        → 100  (Expected Hours and above)
 *   4:30 – 6h   →  70  (Moderate Activity)
 *   3 – 4:30h   →  40  (Low Activity — concern)
 *   < 3h        →  25  (Minimal Activity — concern)
 */
export function timeTrackingPoints(avgHoursPerDay: number): number {
  const h = avgHoursPerDay;
  if (h >= 6) return 100;
  if (h >= 4.5) return 70;
  if (h >= 3) return 40;
  return 25;
}

/** Shared colour ramp for a 0–100 score: ≥90 green, ≥75 amber, else red. */
export function pointsColor(p: number | null): string {
  if (p === null) return '#94a3b8';
  return p >= 90 ? '#059669' : p >= 75 ? '#b45309' : '#dc2626';
}

/** "Xh Ym" from seconds. */
export function fmtHM(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// ─── Shared date helpers ─────────────────────────────────────────────────────
const normDay = (d: string | Date) => dayjs(d).format('YYYY-MM-DD');
const isWeekendDay = (d: string) => {
  const wd = dayjs(d).day();
  return wd === 0 || wd === 6;
};
function listDates(range: [Dayjs, Dayjs]): string[] {
  const out: string[] = [];
  let cur = range[0].startOf('day');
  const end = range[1].startOf('day');
  let guard = 0;
  while ((cur.isSame(end) || cur.isBefore(end)) && guard++ < 400) {
    out.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  return out;
}
function expandApprovedLeaves(leaves: any[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const lv of leaves) {
    if (lv.status !== 'approved') continue;
    const set = map.get(lv.userId) ?? new Set<string>();
    let cur = dayjs(lv.fromDate);
    const end = dayjs(lv.toDate);
    let guard = 0;
    while ((cur.isSame(end) || cur.isBefore(end)) && guard++ < 400) {
      set.add(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    map.set(lv.userId, set);
  }
  return map;
}

const attWorkMins = (r: any) =>
  r.effectiveWorkMinutes ?? r.workingMinutes ?? r.totalWorkMinutes ?? 0;

// ─── Per-module scorers (mirror each section's own computation) ───────────────

/** Tickets: mean ticketPoints across distinct tickets (rows pre-aggregated). */
export function scoreTickets(rows: any[], statusMarks?: StatusMarks): number | null {
  const byId = new Map<string, any>();
  for (const t of rows) {
    const cur = byId.get(t.id);
    if (cur) cur.trackedSeconds += t.trackedSeconds || 0;
    else
      byId.set(t.id, {
        status: t.status,
        estimateHours: t.estimateHours || 0,
        trackedSeconds: t.trackedSeconds || 0,
      });
  }
  const scores: number[] = [];
  byId.forEach((v) => scores.push(ticketPoints(v, statusMarks)));
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

/** Daily Updates: posted ÷ present working days. */
export function scoreDailyUpdates(p: {
  updates: any[];
  attendance: any[];
  holidays: Set<string>;
  range: [Dayjs, Dayjs];
  bodEnabled: boolean;
  eodEnabled: boolean;
}): number | null {
  const from = p.range[0].format('YYYY-MM-DD');
  const to = p.range[1].format('YYYY-MM-DD');
  const inRange = (d: string) => d >= from && d <= to;
  const postedDate = (u: any) =>
    normDay(u.is_missed && u.missed_updateAt ? u.missed_updateAt : u.createdAt);
  const real = p.updates.filter((u) => {
    if (u.is_missed) return false;
    const t = u.updateType || 'EOD';
    if (t === 'BOD') return p.bodEnabled;
    if (t === 'EOD') return p.eodEnabled;
    return true;
  });
  const postedKeys = new Set<string>();
  for (const u of real) {
    const d = postedDate(u);
    if (!inRange(d) || isWeekendDay(d) || p.holidays.has(d)) continue;
    postedKeys.add(`${u.userId}_${d}`);
  }
  const expectedKeys = new Set<string>();
  for (const a of p.attendance) {
    if (a.status === 'absent') continue;
    const d = normDay(a.date);
    if (!inRange(d) || isWeekendDay(d) || p.holidays.has(d)) continue;
    const uid = a.userId ?? a.member?.id;
    expectedKeys.add(`${uid}_${d}`);
  }
  const expected = expectedKeys.size;
  if (!expected) return postedKeys.size ? 100 : null;
  return Math.round((Math.min(postedKeys.size, expected) / expected) * 100);
}

/** Attendance: per expected day absent→0, present→min(100, hours/7×100); averaged. */
export function scoreAttendance(p: {
  attendance: any[];
  holidays: Set<string>;
  leaves: any[];
  range: [Dayjs, Dayjs];
  memberId?: string;
}): number | null {
  const TARGET = 7;
  const dates = listDates(p.range);
  const attByKey = new Map<string, any>();
  const users = new Set<string>();
  for (const a of p.attendance) {
    const uid = a.userId ?? a.member?.id;
    if (!uid) continue;
    attByKey.set(`${uid}_${normDay(a.date)}`, a);
    users.add(uid);
  }
  if (p.memberId) users.add(p.memberId);
  const leaveByUser = expandApprovedLeaves(p.leaves);
  let expected = 0;
  let dayScoreSum = 0;
  for (const uid of users) {
    const leaveSet = leaveByUser.get(uid);
    for (const d of dates) {
      if (isWeekendDay(d) || p.holidays.has(d) || leaveSet?.has(d)) continue;
      expected += 1;
      const rec = attByKey.get(`${uid}_${d}`);
      if (rec && rec.status !== 'absent') {
        dayScoreSum += Math.min(100, (attWorkMins(rec) / 60 / TARGET) * 100);
      }
    }
  }
  return expected ? Math.round(dayScoreSum / expected) : null;
}

/** Leaves: only LOP reduces, against the working month. */
export function scoreLeaves(p: {
  leaves: any[];
  holidays: Set<string>;
  range: [Dayjs, Dayjs];
  memberId?: string;
}): number | null {
  let workingDays = 0;
  for (const d of listDates(p.range)) if (!isWeekendDay(d) && !p.holidays.has(d)) workingDays += 1;
  const approved = p.leaves.filter((l) => l.status === 'approved');
  const lopDays = approved.reduce((s, r) => s + (r.lopUnits || 0), 0);
  const members = p.memberId ? 1 : Math.max(1, new Set(p.leaves.map((l) => l.userId)).size);
  const denom = workingDays * members;
  if (!denom) return 100;
  return Math.max(0, Math.round(100 - (lopDays / denom) * 100));
}

/** Average tracked seconds/day from the Time Tracking performance rows. */
export function avgTrackedSeconds(rows: any[]): number {
  if (!rows || rows.length === 0) return 0;
  const total = rows.reduce((s, r) => s + (r.totalSeconds || 0), 0);
  return Math.round(total / rows.length);
}

/** Qualitative band for a 0–100 score. */
export function performanceBand(score: number | null): { label: string; color: string } {
  if (score === null) return { label: 'No data', color: '#94a3b8' };
  if (score >= 90) return { label: 'Excellent', color: '#059669' };
  if (score >= 75) return { label: 'Good', color: '#16a34a' };
  if (score >= 60) return { label: 'Fair', color: '#b45309' };
  if (score >= 40) return { label: 'Needs attention', color: '#ea580c' };
  return { label: 'Critical', color: '#dc2626' };
}
