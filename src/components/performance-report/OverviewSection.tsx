'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useState } from 'react';
import {  message } from 'antd';
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
        <ZukvoLoader size="md" message="Building overview…" />
      </div>
    );
  }

  const band = performanceBand(combined);
  const enabled = weights.filter((w) => w.enabled);
  const scoredCount = ORDER.filter((k) => weightOf(k)?.enabled && scores[k] !== null).length;

  // Donut geometry — one ring, filled to the combined score.
  const RING_R = 54;
  const RING_C = 2 * Math.PI * RING_R;
  const ringPct = Math.max(0, Math.min(100, combined ?? 0));

  // Weight distribution across the enabled stages (stacked strip under the hero).
  const weightTotal = enabled.reduce((a, w) => a + (Number(w.weight) || 0), 0);

  return (
    <div className="ov-wrap">
      {/* ── Combined headline ───────────────────────────────────────────────── */}
      <div className="ov-hero">
        <div className="ov-hero-glow" />

        <div className="ov-ring">
          <svg viewBox="0 0 128 128" role="img" aria-label={`Overall score ${combined ?? 'unavailable'}`}>
            <circle className="ov-ring-track" cx="64" cy="64" r={RING_R} />
            <circle
              className="ov-ring-fill"
              cx="64"
              cy="64"
              r={RING_R}
              transform="rotate(-90 64 64)"
              style={{
                stroke: pointsColor(combined),
                strokeDasharray: `${(ringPct / 100) * RING_C} ${RING_C}`,
              }}
            />
          </svg>
          <div className="ov-ring-center">
            <span className="ov-ring-num" style={{ color: pointsColor(combined) }}>
              {combined ?? '—'}
            </span>
            <span className="ov-ring-max">/ 100</span>
          </div>
        </div>

        <div className="ov-hero-text">
          <span className="ov-hero-band" style={{ color: band.color, background: `${band.color}14` }}>
            <span className="ov-hero-band-dot" style={{ background: band.color }} />
            {band.label}
          </span>
          <div className="ov-hero-label">Overall performance</div>
          <div className="ov-hero-sub">
            Weighted average across the {enabled.length} enabled stage
            {enabled.length === 1 ? '' : 's'}, using the weights set in Settings.
          </div>

          {weightTotal > 0 && (
            <div className="ov-mix">
              <div className="ov-mix-bar">
                {ORDER.filter((k) => weightOf(k)?.enabled).map((k) => (
                  <span
                    key={k}
                    className="ov-mix-seg"
                    title={`${META[k].label} · ${Number(weightOf(k)!.weight)}%`}
                    style={{
                      width: `${((Number(weightOf(k)!.weight) || 0) / weightTotal) * 100}%`,
                      background: META[k].color,
                    }}
                  />
                ))}
              </div>
              <span className="ov-mix-note">
                {scoredCount} of {enabled.length} stages have data in this window
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 5 stages ────────────────────────────────────────────────────────── */}
      <div className="ov-section-head">
        <span className="ov-section-label">Performance by stage</span>
        <span className="ov-section-rule" />
      </div>
      <div className="ov-grid">
        {ORDER.map((key) => {
          const meta = META[key];
          const s = scores[key];
          const w = weightOf(key);
          const b = performanceBand(s);
          const disabled = !w?.enabled;
          return (
            <div
              key={key}
              className={`ov-card ${disabled ? 'is-off' : ''}`}
              style={{ ['--accent' as any]: meta.color }}
            >
              <div className="ov-card-top">
                <span className="ov-card-ic">{meta.icon}</span>
                <span className="ov-card-name">{meta.label}</span>
                <span className="ov-card-weight">{w ? `${Number(w.weight)}%` : '—'}</span>
              </div>
              <div className="ov-card-score">
                <span className="ov-card-score-num" style={{ color: pointsColor(s) }}>
                  {s ?? '—'}
                </span>
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
        .ov-wrap { display: flex; flex-direction: column; gap: 14px; }

        /* ── Hero: score donut + verdict ─────────────────────────────────────── */
        .ov-hero {
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: 26px;
          padding: 20px 24px; border-radius: 18px;
          border: 1px solid var(--border-slate-200);
          background:
            linear-gradient(120deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0) 46%),
            var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.04);
        }
        .ov-hero-glow {
          position: absolute; left: -40px; top: -90px; width: 300px; height: 220px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.14), transparent 70%);
          pointer-events: none;
        }

        .ov-ring { position: relative; width: 122px; height: 122px; flex-shrink: 0; z-index: 1; }
        .ov-ring svg { width: 100%; height: 100%; display: block; }
        .ov-ring-track { fill: none; stroke: var(--bg-slate-100); stroke-width: 11; }
        .ov-ring-fill {
          fill: none; stroke-width: 11; stroke-linecap: round;
          transition: stroke-dasharray .5s cubic-bezier(.4, 0, .2, 1), stroke .3s ease;
        }
        .ov-ring-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
        }
        .ov-ring-num {
          font-size: 34px; font-weight: 800; line-height: 1; letter-spacing: -0.035em;
          font-variant-numeric: tabular-nums;
        }
        .ov-ring-max { font-size: 11px; font-weight: 700; color: var(--text-slate-400); }

        .ov-hero-text { position: relative; z-index: 1; min-width: 0; flex: 1; }
        .ov-hero-band {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 800; letter-spacing: 0.02em;
          padding: 3px 10px 3px 8px; border-radius: 999px;
        }
        .ov-hero-band-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .ov-hero-label {
          font-size: 16px; font-weight: 800; color: var(--text-slate-900);
          margin-top: 8px; letter-spacing: -0.02em;
        }
        .ov-hero-sub {
          font-size: 12.5px; color: var(--text-slate-500); margin-top: 4px;
          max-width: 520px; line-height: 1.5;
        }

        .ov-mix { margin-top: 14px; max-width: 460px; }
        .ov-mix-bar {
          display: flex; gap: 2px; height: 7px; border-radius: 999px; overflow: hidden;
          background: var(--bg-slate-100);
        }
        .ov-mix-seg { display: block; height: 100%; opacity: 0.85; }
        .ov-mix-note {
          display: block; margin-top: 7px;
          font-size: 11px; font-weight: 600; color: var(--text-slate-400);
        }

        /* ── Section heading ────────────────────────────────────────────────── */
        .ov-section-head { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
        .ov-section-label {
          font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); flex-shrink: 0;
        }
        .ov-section-rule { flex: 1; height: 1px; background: var(--border-slate-100); }

        /* ── Stage cards ────────────────────────────────────────────────────── */
        .ov-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(258px, 1fr)); gap: 12px; }
        .ov-card {
          position: relative; overflow: hidden;
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white); padding: 14px 16px 15px;
          display: flex; flex-direction: column; gap: 11px;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }
        .ov-card::before {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: var(--accent); opacity: 0; transition: opacity .16s ease;
        }
        .ov-card:hover {
          border-color: color-mix(in srgb, var(--accent) 34%, var(--border-slate-200));
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
          transform: translateY(-2px);
        }
        .ov-card:hover::before { opacity: 1; }
        .ov-card.is-off {
          opacity: 0.62; border-style: dashed; background: var(--bg-slate-50);
        }
        .ov-card.is-off:hover { transform: none; box-shadow: none; }

        .ov-card-top { display: flex; align-items: center; gap: 10px; }
        .ov-card-ic {
          width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .ov-card-name {
          font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); flex: 1;
          letter-spacing: -0.01em; min-width: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ov-card-weight {
          font-size: 11px; font-weight: 700; color: var(--text-slate-500);
          background: var(--bg-slate-100); padding: 2px 8px; border-radius: 999px;
          font-variant-numeric: tabular-nums; flex-shrink: 0;
        }
        .ov-card-score { display: flex; align-items: baseline; gap: 6px; }
        .ov-card-score-num {
          font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
        }
        .ov-card-score-max { font-size: 12px; font-weight: 700; color: var(--text-slate-400); }
        .ov-card-band {
          margin-left: auto; align-self: center; border-radius: 999px;
          font-size: 10.5px; font-weight: 800; padding: 3px 9px; white-space: nowrap;
        }
        .ov-bar { height: 6px; border-radius: 999px; background: var(--bg-slate-100); overflow: hidden; }
        .ov-bar-fill { height: 100%; border-radius: 999px; transition: width .45s cubic-bezier(.4, 0, .2, 1); }
        .ov-card-desc {
          font-size: 12px; color: var(--text-slate-500); line-height: 1.45;
          padding-top: 10px; border-top: 1px dashed var(--border-slate-200);
        }

        @media (max-width: 720px) {
          .ov-hero { flex-direction: column; align-items: flex-start; gap: 16px; padding: 18px; }
          .ov-ring { width: 104px; height: 104px; }
          .ov-ring-num { font-size: 30px; }
        }
      `}</style>
    </div>
  );
}
