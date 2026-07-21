'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Spin, message } from 'antd';
import { Ticket, Timer, NotebookPen, CalendarCheck, Plane } from 'lucide-react';
import { Dayjs } from 'dayjs';
import PerformanceReportService, { ReportTicket } from '@/services/performanceReportService';
import { DailyUpdateService } from '@/services/dailyUpdateService';
import { AttendanceService } from '@/services/attendanceService';
import { TimeTrackingService } from '@/services/timeTracking.service';
import LeaveV2Service from '@/services/leaveV2Service';
import {
  scoreTickets,
  scoreDailyUpdates,
  scoreAttendance,
  scoreLeaves,
  timeTrackingPoints,
  avgTrackedSeconds,
  pointsColor,
  performanceBand,
} from './moduleScores';

export interface ModuleWeight {
  key: 'tickets' | 'time_tracking' | 'daily_updates' | 'attendance' | 'leaves';
  weight: number;
  enabled: boolean;
}

interface Props {
  projectId?: string;
  userId?: string;
  range: [Dayjs, Dayjs];
  statusMarks: Record<string, number>;
  bodEnabled: boolean;
  eodEnabled: boolean;
  weights: ModuleWeight[];
  tickets: ReportTicket[]; // already fetched by the report
}

const META: Record<
  ModuleWeight['key'],
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  tickets: {
    label: 'Tickets',
    icon: <Ticket size={18} />,
    color: '#EC4899',
    desc: 'Efficiency & completion versus estimates.',
  },
  time_tracking: {
    label: 'Time Tracking',
    icon: <Timer size={18} />,
    color: '#F59E0B',
    desc: 'Tracked hours against the daily target.',
  },
  daily_updates: {
    label: 'Daily Updates',
    icon: <NotebookPen size={18} />,
    color: '#8B5CF6',
    desc: 'BOD/EOD posting on present working days.',
  },
  attendance: {
    label: 'Attendance',
    icon: <CalendarCheck size={18} />,
    color: '#3B82F6',
    desc: 'Punctual presence on working days.',
  },
  leaves: {
    label: 'Leaves',
    icon: <Plane size={18} />,
    color: '#10B981',
    desc: 'Leave kept within entitlement (LOP-free).',
  },
};

const ORDER: ModuleWeight['key'][] = [
  'tickets',
  'time_tracking',
  'daily_updates',
  'attendance',
  'leaves',
];

// Overview — blends the five module scores into one combined performance score,
// weighted by the Settings module weights, with a per-stage breakdown.
export default function OverviewSection({
  projectId,
  userId,
  range,
  statusMarks,
  bodEnabled,
  eodEnabled,
  weights,
  tickets,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    ttRows: any[];
    updates: any[];
    attendance: any[];
    leaves: any[];
    holidays: Set<string>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const from = range[0].format('YYYY-MM-DD');
        const to = range[1].format('YYYY-MM-DD');
        const browserTz = (() => {
          try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          } catch {
            return 'UTC';
          }
        })();
        const [tt, updates, att, leaves, hol] = await Promise.all([
          TimeTrackingService.getPerformance({
            userIds: userId ? [userId] : [],
            projectId: projectId || undefined,
            startDate: range[0].startOf('day').toISOString(),
            endDate: range[1].endOf('day').toISOString(),
            timezone: browserTz,
          }).catch(() => ({ rows: [] })),
          DailyUpdateService.getTeamUpdates({
            startDate: from,
            endDate: to,
            projectId: projectId || undefined,
            userId: userId || undefined,
          }).catch(() => []),
          AttendanceService.getAttendance({
            member: userId || undefined,
            projectId: projectId || undefined,
            startDate: range[0].startOf('day').toISOString(),
            endDate: range[1].endOf('day').toISOString(),
            page: 1,
            limit: 500,
          }).catch(() => ({ data: [] } as any)),
          PerformanceReportService.getLeaveReport({ from, to, memberId: userId || undefined }).catch(
            () => []
          ),
          LeaveV2Service.getLeaveHolidayDates().catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        setData({
          ttRows: (tt as any)?.rows || [],
          updates: Array.isArray(updates) ? updates : [],
          attendance: ((att as any)?.data as any[]) || [],
          leaves: leaves || [],
          holidays: new Set((hol || []).map((d: string) => d.slice(0, 10))),
        });
      } catch (err: any) {
        if (!cancelled) message.error(err?.message || 'Failed to build overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId, range[0]?.valueOf(), range[1]?.valueOf()]);

  const scores = useMemo<Record<ModuleWeight['key'], number | null>>(() => {
    if (!data) {
      return { tickets: null, time_tracking: null, daily_updates: null, attendance: null, leaves: null };
    }
    return {
      tickets: scoreTickets(tickets, statusMarks),
      time_tracking: data.ttRows.length
        ? timeTrackingPoints(avgTrackedSeconds(data.ttRows) / 3600)
        : null,
      daily_updates: scoreDailyUpdates({
        updates: data.updates,
        attendance: data.attendance,
        holidays: data.holidays,
        range,
        bodEnabled,
        eodEnabled,
      }),
      attendance: scoreAttendance({
        attendance: data.attendance,
        holidays: data.holidays,
        leaves: data.leaves,
        range,
        memberId: userId,
      }),
      leaves: scoreLeaves({ leaves: data.leaves, holidays: data.holidays, range, memberId: userId }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tickets, statusMarks, bodEnabled, eodEnabled, userId]);

  // Weighted blend across enabled modules with a score.
  const combined = useMemo(() => {
    let wsum = 0;
    let acc = 0;
    for (const w of weights) {
      const s = scores[w.key];
      if (!w.enabled || s === null) continue;
      acc += s * w.weight;
      wsum += w.weight;
    }
    return wsum > 0 ? Math.round(acc / wsum) : null;
  }, [scores, weights]);

  const weightOf = (k: ModuleWeight['key']) => weights.find((w) => w.key === k);

  if (loading) {
    return (
      <div className="prr-center">
        <Spin tip="Building overview…" />
      </div>
    );
  }

  const band = performanceBand(combined);

  return (
    <div className="ov-wrap">
      {/* ── Combined headline ───────────────────────────────────────────────── */}
      <div className="ov-hero">
        <div className="ov-hero-score">
          <span className="ov-hero-num" style={{ color: pointsColor(combined) }}>
            {combined ?? '—'}
          </span>
          <span className="ov-hero-max">/ 100</span>
        </div>
        <div className="ov-hero-text">
          <div className="ov-hero-band" style={{ color: band.color }}>{band.label}</div>
          <div className="ov-hero-label">Overall performance</div>
          <div className="ov-hero-sub">
            Weighted average across the {weights.filter((w) => w.enabled).length} enabled stages,
            using the weights set in Settings.
          </div>
        </div>
      </div>

      {/* ── 5 stages ────────────────────────────────────────────────────────── */}
      <div className="ov-section-label">Performance by stage</div>
      <div className="ov-grid">
        {ORDER.map((key) => {
          const meta = META[key];
          const s = scores[key];
          const w = weightOf(key);
          const b = performanceBand(s);
          const disabled = !w?.enabled;
          return (
            <div key={key} className={`ov-card ${disabled ? 'is-off' : ''}`} style={{ ['--accent' as any]: meta.color }}>
              <div className="ov-card-top">
                <span className="ov-card-ic">{meta.icon}</span>
                <span className="ov-card-name">{meta.label}</span>
                <span className="ov-card-weight">{w ? `${Number(w.weight)}%` : '—'}</span>
              </div>
              <div className="ov-card-score">
                <span style={{ color: pointsColor(s) }}>{s ?? '—'}</span>
                <span className="ov-card-score-max">/ 100</span>
                <span className="ov-card-band" style={{ color: b.color, background: `${b.color}14` }}>
                  {disabled ? 'Excluded' : b.label}
                </span>
              </div>
              <div className="ov-bar">
                <div
                  className="ov-bar-fill"
                  style={{ width: `${Math.max(0, Math.min(100, s ?? 0))}%`, background: meta.color }}
                />
              </div>
              <div className="ov-card-desc">{meta.desc}</div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .ov-wrap { display: flex; flex-direction: column; gap: 16px; }
        .ov-hero {
          display: flex; align-items: center; gap: 22px;
          padding: 22px 24px; border: 1px solid var(--border-slate-200); background: transparent;
        }
        .ov-hero-score { display: flex; align-items: baseline; gap: 6px; }
        .ov-hero-num { font-size: 56px; font-weight: 800; line-height: 1; letter-spacing: -0.03em; }
        .ov-hero-max { font-size: 16px; font-weight: 700; color: var(--text-slate-400); }
        .ov-hero-band { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
        .ov-hero-label { font-size: 13px; font-weight: 700; color: var(--text-slate-900); margin-top: 2px; }
        .ov-hero-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 3px; max-width: 520px; line-height: 1.5; }

        .ov-section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-400); margin-top: 2px;
        }
        .ov-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
        .ov-card {
          border: 1px solid var(--border-slate-200); background: transparent; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .ov-card.is-off { opacity: 0.55; }
        .ov-card-top { display: flex; align-items: center; gap: 10px; }
        .ov-card-ic {
          width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
          color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, #fff);
        }
        .ov-card-name { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); flex: 1; }
        .ov-card-weight { font-size: 11px; font-weight: 700; color: var(--text-slate-500); background: var(--bg-slate-100); padding: 2px 8px; }
        .ov-card-score { display: flex; align-items: baseline; gap: 6px; }
        .ov-card-score > span:first-child { font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
        .ov-card-score-max { font-size: 12px; font-weight: 700; color: var(--text-slate-400); }
        .ov-card-band { margin-left: auto; font-size: 11px; font-weight: 800; padding: 2px 9px; align-self: center; }
        .ov-bar { height: 6px; background: var(--bg-slate-100); overflow: hidden; }
        .ov-bar-fill { height: 100%; transition: width .25s ease; }
        .ov-card-desc { font-size: 12px; color: var(--text-slate-500); line-height: 1.45; }
      `}</style>
    </div>
  );
}
