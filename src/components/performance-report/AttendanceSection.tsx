'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { CalendarCheck } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { AttendanceService, Attendance } from '@/services/attendanceService';
import LeaveV2Service from '@/services/leaveV2Service';
import PerformanceReportService, { ReportLeave } from '@/services/performanceReportService';
import { pointsColor, fmtHM } from './moduleScores';
import EmptyState from './EmptyState';
import ZukvoLoader from "../common/ZukvoLoader";


// Full hours earns full marks for a present day.
const TARGET_HOURS = 7;

interface Props {
  projectId?: string;
  userId?: string;
  range: [Dayjs, Dayjs];
}

const norm = (d: string | Date) => dayjs(d).format('YYYY-MM-DD');
const isWeekend = (d: string) => {
  const wd = dayjs(d).day();
  return wd === 0 || wd === 6; // Sun / Sat
};
const fmtTime = (d?: string | null) => (d ? dayjs(d).format('h:mm A') : '—');

const STATUS_META: Record<string, { label: string; color: string }> = {
  present: { label: 'Present', color: 'green' },
  wfh: { label: 'WFH', color: 'cyan' },
  late: { label: 'Late', color: 'red' },
  'half-day': { label: 'Half day', color: 'gold' },
  absent: { label: 'Absent', color: 'default' }
};

const workMins = (r: Attendance) =>
  r.effectiveWorkMinutes ?? r.workingMinutes ?? r.totalWorkMinutes ?? 0;

// Attendance section — calendar-based. Expected = every weekday in range that
// isn't a government holiday or a leave day. Each expected day scores 0 if the
// member didn't clock in, else hours-worked vs the 7h target (capped at 100).
export default function AttendanceSection({ projectId, userId, range }: Props) {
  const [rows, setRows] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [leaves, setLeaves] = useState<ReportLeave[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const from = range[0].format('YYYY-MM-DD');
        const to = range[1].format('YYYY-MM-DD');
        const [att, hol, lv] = await Promise.all([
          AttendanceService.getAttendance({
            member: userId || undefined,
            projectId: projectId || undefined,
            startDate: range[0].startOf('day').toISOString(),
            endDate: range[1].endOf('day').toISOString(),
            page: 1,
            limit: 500
          }),
          LeaveV2Service.getLeaveHolidayDates().catch(() => [] as string[]),
          PerformanceReportService.getLeaveReport({ from, to, memberId: userId || undefined }).catch(
            () => [] as ReportLeave[]
          ),
        ]);
        if (cancelled) return;
        setRows(((att?.data as Attendance[]) || []) as Attendance[]);
        setHolidays(new Set((hol || []).map((d) => norm(d))));
        setLeaves(lv || []);
      } catch (err: any) {
        if (!cancelled)
          message.error(err?.response?.data?.error || err?.message || 'Failed to load attendance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId, range[0]?.valueOf(), range[1]?.valueOf()]);

  // Every calendar day in the range (YYYY-MM-DD).
  const datesInRange = useMemo(() => {
    const out: string[] = [];
    let cur = range[0].startOf('day');
    const end = range[1].startOf('day');
    let guard = 0;
    while ((cur.isSame(end) || cur.isBefore(end)) && guard++ < 400) {
      out.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range[0]?.valueOf(), range[1]?.valueOf()]);

  const stats = useMemo(() => {
    // Attendance keyed per member+date; member set = whoever has records.
    const attByKey = new Map<string, Attendance>();
    const users = new Set<string>();
    for (const a of rows) {
      const uid = (a as any).userId ?? (a as any).member?.id;
      if (!uid) continue;
      attByKey.set(`${uid}_${norm(a.date)}`, a);
      users.add(uid);
    }
    if (userId) users.add(userId); // count a filtered member even with no records

    // Approved leave dates per member (excluded from expected days).
    const leaveByUser = new Map<string, Set<string>>();
    for (const lv of leaves) {
      if (lv.status !== 'approved') continue;
      const set = leaveByUser.get(lv.userId) ?? new Set<string>();
      let cur = dayjs(lv.fromDate);
      const end = dayjs(lv.toDate);
      let guard = 0;
      while ((cur.isSame(end) || cur.isBefore(end)) && guard++ < 400) {
        set.add(cur.format('YYYY-MM-DD'));
        cur = cur.add(1, 'day');
      }
      leaveByUser.set(lv.userId, set);
    }

    let expected = 0;
    let present = 0;
    let dayScoreSum = 0;
    let presentMins = 0;
    for (const uid of users) {
      const leaveSet = leaveByUser.get(uid);
      for (const d of datesInRange) {
        if (isWeekend(d) || holidays.has(d) || leaveSet?.has(d)) continue;
        expected += 1;
        const rec = attByKey.get(`${uid}_${d}`);
        const isPresent = !!rec && rec.status !== 'absent';
        if (isPresent) {
          present += 1;
          const mins = workMins(rec!);
          presentMins += mins;
          dayScoreSum += Math.min(100, (mins / 60 / TARGET_HOURS) * 100);
        }
        // absent expected day contributes 0
      }
    }

    const absent = expected - present;
    const score = expected ? Math.round(dayScoreSum / expected) : null;
    const avgMins = present ? presentMins / present : 0;
    const pct = (n: number) => (expected ? Math.round((n / expected) * 100) : 0);
    return { expected, present, absent, score, avgMins, presentPct: pct(present), absentPct: pct(absent) };
  }, [rows, holidays, leaves, datesInRange, userId]);

  const rangeLabel = `${range[0].format('MMM D')} – ${range[1].format('MMM D, YYYY')}`;

  const columns: ColumnsType<Attendance> = [
    {
      title: 'Member',
      key: 'member',
      render: (_, r) => {
        const m = (r as any).member || {};
        const position = typeof m.position === 'string' ? m.position : m.position?.title || '—';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              size={30}
              src={m.avatarUrl || undefined}
              style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', fontSize: 12, fontWeight: 700 }}
            >
              {m.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-900)' }}>{m.name || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{position}</div>
            </div>
          </div>
        );
      }
    },
    { title: 'Date', key: 'date', width: 120, render: (_, r) => dayjs(r.date).format('MMM D, YYYY') },
    { title: 'Clock In', key: 'in', width: 100, render: (_, r) => fmtTime(r.clockIn) },
    { title: 'Clock Out', key: 'out', width: 100, render: (_, r) => fmtTime(r.clockOut) },
    {
      title: 'Hours',
      key: 'hours',
      width: 90,
      render: (_, r) => <strong style={{ color: 'var(--text-slate-700)' }}>{fmtHM(workMins(r) * 60)}</strong>
    },
    {
      title: 'Late by',
      key: 'late',
      width: 90,
      render: (_, r) =>
        (r.lateMinutes ?? 0) > 0 ? (
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{fmtHM(r.lateMinutes! * 60)}</span>
        ) : (
          <span style={{ color: 'var(--text-slate-400)' }}>—</span>
        )
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, r) => {
        const m = STATUS_META[r.status] || { label: r.status, color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      }
    },
  ];

  if (loading) {
    return (
      <div className="prr-center">
        <ZukvoLoader message="Loading attendance…" />
      </div>
    );
  }

  if (rows.length === 0 && stats.expected === 0) {
    return (
      <EmptyState
        accent="#3B82F6"
        icon={<CalendarCheck size={28} />}
        title="No attendance records"
        subtitle="No clock-ins were found for this window. Punctuality and presence will be scored here once attendance is logged."
      />
    );
  }

  return (
    <div className="prr-att">
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
            <Tooltip title={`Clocked-in expected working days × hours vs ${TARGET_HOURS}h target. Excludes weekends, holidays and leave.`}>
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
            <span className="prr-stat-num">{stats.present}</span>
            <span className="prr-pct prr-pct--green">{stats.presentPct}%</span>
          </div>
          <div className="prr-stat-label">Present</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{stats.absent}</span>
            <span className="prr-pct prr-pct--red">{stats.absentPct}%</span>
          </div>
          <div className="prr-stat-label">Absent</div>
        </div>
        <div className="prr-stat prr-stat--points">
          <div className="prr-stat-top">
            <span className="prr-stat-num" style={{ fontSize: 18 }}>{fmtHM(stats.avgMins * 60)}</span>
            <span className="prr-pts-max">/ {TARGET_HOURS}h</span>
          </div>
          <div className="prr-stat-label">Avg hours / day</div>
        </div>
        <div className="prr-statbar-caption">
          <CalendarOutlined style={{ color: 'var(--text-slate-400)' }} />
          {rangeLabel}
        </div>
      </div>

      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
        scroll={{ x: 760 }}
      />
    </div>
  );
}
