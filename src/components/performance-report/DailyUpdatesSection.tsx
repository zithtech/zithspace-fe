'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useState } from 'react';
import {  Tooltip, message } from 'antd';
import { CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { NotebookPen } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import UpdateTable from '@/components/daily-updates/UpdateTable';
import UpdateDetailsDrawer from '@/components/daily-updates/UpdateDetailsDrawer';
import { DailyUpdateService } from '@/services/dailyUpdateService';
import { DailyStatusUpdate } from '@/types/dailyUpdate';
import { AttendanceService, Attendance } from '@/services/attendanceService';
import LeaveV2Service from '@/services/leaveV2Service';
import { pointsColor } from './moduleScores';
import EmptyState from './EmptyState';

interface Props {
  projectId?: string;
  userId?: string;
  range: [Dayjs, Dayjs];
  bodEnabled: boolean;
  eodEnabled: boolean;
}

const norm = (d: string | Date) => dayjs(d).format('YYYY-MM-DD');
const isWeekend = (d: string | Date) => {
  const wd = dayjs(d).day();
  return wd === 0 || wd === 6; // Sun / Sat
};

// Daily Updates section — day-based BOD/EOD compliance. A daily update is
// expected on every PRESENT working day (excluding weekends, government
// holidays, and leave — leave shows as not-present). Of those expected days,
// the score is the fraction the member actually posted an update.
export default function DailyUpdatesSection({
  projectId,
  userId,
  range,
  bodEnabled,
  eodEnabled,
}: Props) {
  const [updates, setUpdates] = useState<DailyStatusUpdate[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DailyStatusUpdate | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const from = range[0].format('YYYY-MM-DD');
        const to = range[1].format('YYYY-MM-DD');
        // Updates + attendance (present days) + holidays, in parallel. Attendance
        // and holidays are best-effort — score degrades gracefully without them.
        const [upd, att, hol] = await Promise.all([
          DailyUpdateService.getTeamUpdates({
            startDate: from,
            endDate: to,
            projectId: projectId || undefined,
            userId: userId || undefined,
          }),
          AttendanceService.getAttendance({
            member: userId || undefined,
            projectId: projectId || undefined,
            startDate: range[0].startOf('day').toISOString(),
            endDate: range[1].endOf('day').toISOString(),
            page: 1,
            limit: 500,
          }).catch(() => ({ data: [] as Attendance[] } as any)),
          LeaveV2Service.getLeaveHolidayDates().catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        setUpdates(Array.isArray(upd) ? upd : []);
        setAttendance(((att?.data as Attendance[]) || []) as Attendance[]);
        setHolidays(new Set((hol || []).map((d) => norm(d))));
      } catch (err: any) {
        if (!cancelled)
          message.error(err?.response?.data?.error || err?.message || 'Failed to load daily updates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId, range[0]?.valueOf(), range[1]?.valueOf()]);

  // Real submissions of an enabled type (BOD/EOD per Settings).
  const posted = useMemo(
    () =>
      updates.filter((u) => {
        if (u.is_missed) return false;
        const t = u.updateType || 'EOD';
        if (t === 'BOD') return bodEnabled;
        if (t === 'EOD') return eodEnabled;
        return true;
      }),
    [updates, bodEnabled, eodEnabled]
  );

  const fromStr = range[0].format('YYYY-MM-DD');
  const toStr = range[1].format('YYYY-MM-DD');
  // YYYY-MM-DD compares lexicographically = chronologically.
  const inRange = (d: string) => d >= fromStr && d <= toStr;
  // The work date the update belongs to — use dueDate (the day it was *due*)
  // as the authoritative work day. Fall back to createdAt only when dueDate is
  // absent so that late-night / next-morning submissions are still counted on
  // the correct calendar day rather than the submission day.
  const postedDate = (u: DailyStatusUpdate) =>
    norm((u.dueDate || u.createdAt) as any);

  // Drop anything outside the range (the backend can leak a boundary day via a
  // timezone edge, e.g. Mar 31 on an April query).
  const visible = useMemo(
    () => posted.filter((u) => inRange(postedDate(u))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posted, fromStr, toStr]
  );

  const displayableUpdates = useMemo(
    () =>
      updates.filter((u) => {
        const t = u.updateType || 'EOD';
        if (t === 'BOD') return bodEnabled;
        if (t === 'EOD') return eodEnabled;
        return true;
      }),
    [updates, bodEnabled, eodEnabled]
  );

  const tableData = useMemo(
    () => displayableUpdates.filter((u) => inRange(postedDate(u))),
    [displayableUpdates, fromStr, toStr]
  );

  const stats = useMemo(() => {
    // ── Posted & Missed ─────────────────────────────────────────────────────
    // Derived directly from update records (matches the table rows).
    //   Posted = unique due-date keys for NON-missed updates in the range.
    //   Missed = unique due-date keys for is_missed updates in the range.
    const postedKeys = new Set<string>();
    const missedKeys = new Set<string>();

    for (const u of updates) {
      const t = u.updateType || 'EOD';
      if (t === 'BOD' && !bodEnabled) continue;
      if (t === 'EOD' && !eodEnabled) continue;

      const d = norm((u.dueDate || u.missed_updateAt || u.createdAt) as any);
      if (!inRange(d) || isWeekend(d) || holidays.has(d)) continue;

      const key = `${u.userId}_${d}`;
      if (u.is_missed) {
        missedKeys.add(key);
      } else {
        postedKeys.add(key);
      }
    }

    const posted = postedKeys.size + missedKeys.size; // all records (non-missed + missed)
    const missed = missedKeys.size;

    // ── Expected ─────────────────────────────────────────────────────────────
    // Based on attendance: count working days (weekday, not holiday, in range)
    // where the employee was present (not absent / on leave).
    const expectedKeys = new Set<string>();
    for (const a of attendance) {
      if (a.status === 'absent') continue;
      const d = norm(a.date);
      if (!inRange(d) || isWeekend(d) || holidays.has(d)) continue;
      const aUserId = (a as any).userId ?? (a as any).member?.id;
      expectedKeys.add(`${aUserId}_${d}`);
    }
    const expected = expectedKeys.size;

    // ── Avg % ────────────────────────────────────────────────────────────────
    // Posted (non-missed) out of Expected (attendance-based present days).
    const score = expected ? Math.round((posted / expected) * 100) : posted ? 100 : null;

    return { expected, posted, missed, score };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates, attendance, bodEnabled, eodEnabled, holidays, fromStr, toStr]);

  const rangeLabel = `${range[0].format('MMM D')} – ${range[1].format('MMM D, YYYY')}`;

  if (loading) {
    return (
      <div className="prr-center">
        <ZukvoLoader size="md" message="Loading daily updates…" />
      </div>
    );
  }

  if (visible.length === 0 && stats.expected === 0) {
    return (
      <EmptyState
        accent="#8B5CF6"
        icon={<NotebookPen size={28} />}
        title="No daily updates yet"
        subtitle="No BOD/EOD updates were posted in this window. Once the member submits updates, their compliance score shows up here."
      />
    );
  }

  return (
    <div className="prr-du">
      <div className="prr-statbar">
        <div className="prr-stat prr-stat--points">
          <div className="prr-stat-top">
            <span className="prr-stat-num" style={{ color: pointsColor(stats.score) }}>
              {stats.score ?? '—'}
            </span>
            {stats.score !== null && <span className="prr-pts-max">/ 100</span>}
          </div>
          <div className="prr-stat-label">
            Avg points
            <Tooltip title="Posted ÷ present working days (excludes weekends, government holidays and leave).">
              <InfoCircleOutlined style={{ marginLeft: 6, color: 'var(--text-slate-400)', fontSize: 11 }} />
            </Tooltip>
          </div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{stats.expected}</span>
            <span className="prr-pct prr-pct--slate">100%</span>
          </div>
          <div className="prr-stat-label">Expected days</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{stats.posted}</span>
            <span className="prr-pct prr-pct--green">{stats.score ?? 0}%</span>
          </div>
          <div className="prr-stat-label">Posted</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{stats.missed}</span>
            <span className="prr-pct prr-pct--red">
              {stats.expected ? Math.round((stats.missed / stats.expected) * 100) : 0}%
            </span>
          </div>
          <div className="prr-stat-label">Missed</div>
        </div>
        <div className="prr-statbar-caption">
          <CalendarOutlined style={{ color: 'var(--text-slate-400)' }} />
          {rangeLabel}
        </div>
      </div>

      <UpdateTable updates={tableData} loading={loading} onViewDetails={setDetail} />

      <UpdateDetailsDrawer update={detail} open={!!detail} onClose={() => setDetail(null)} />
    </div>
  );
}
