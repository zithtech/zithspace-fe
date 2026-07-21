'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, DatePicker, Tooltip, message } from 'antd';
import {
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  HomeOutlined,
  RiseOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { AttendanceService } from '@/services/attendanceService';

const { RangePicker } = DatePicker;

// ── Module palette ──────────────────────────────────────────────────────────
const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  grey: '#94A3B8',
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  amber: 'rgba(245,158,11,0.12)',
  red: 'rgba(239,68,68,0.10)',
  purple: 'rgba(139,92,246,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

type DateFilter = 'today' | 'week' | 'month' | 'custom';

interface DashboardSummary {
  totalMembers: number;
  expectedToday: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  wfhToday: number;
  attendanceRate: number;
}

interface PresentEmployee {
  id: string;
  name: string;
  avatarUrl?: string;
  position: string | { id: string; title: string; code: string } | null;
  status: string;
  clockInTime: string;
  shift: { name: string; startTime: string; endTime: string };
  workHours: number;
}

const STATUS_META: Record<string, { label: string; color: string; tint: string; icon: React.ReactNode }> = {
  present: { label: 'Present', color: PALETTE.green, tint: TINT.green, icon: <CheckCircleOutlined /> },
  late: { label: 'Late', color: PALETTE.amber, tint: TINT.amber, icon: <ExclamationCircleOutlined /> },
  wfh: { label: 'WFH', color: PALETTE.purple, tint: TINT.purple, icon: <HomeOutlined /> },
  absent: { label: 'Absent', color: PALETTE.red, tint: TINT.red, icon: <CloseCircleOutlined /> },
};

const formatDuration = (minutes?: number) => {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const positionLabel = (p: PresentEmployee['position']) =>
  typeof p === 'object' && p ? p.title : (p as string) || 'Team Member';

// Decorative sparklines (no per-stat time-series yet).
const TRENDS: Record<string, number[]> = {
  members: [6, 6, 7, 7, 8, 8, 8],
  present: [4, 5, 5, 6, 6, 7, 8],
  absent: [3, 2, 2, 1, 2, 1, 1],
  late: [1, 2, 1, 2, 3, 2, 2],
};

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => [i * stepX, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `adbspk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Circular progress ring for the attendance rate.
const Ring = ({ value, color }: { value: number; color: string }) => {
  const size = 150;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-slate-100)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .6s ease' }}
      />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 800, fill: 'var(--text-slate-900)' }}>
        {Math.round(pct)}%
      </text>
      <text x="50%" y="63%" textAnchor="middle" style={{ fontSize: 9.5, fontWeight: 700, fill: 'var(--text-slate-400)', letterSpacing: '0.1em' }}>
        ATTENDANCE
      </text>
    </svg>
  );
};

// Attendance Dashboard — org-wide overview with a date filter, stat cards,
// a "who's in" list and an attendance-health ring.
export default function AttendanceDashboardPanel() {
  const { canReadAttendanceDashboard } = usePermission();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [present, setPresent] = useState<PresentEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const range = useMemo(() => {
    if (dateFilter === 'week') return [dayjs().startOf('week'), dayjs().endOf('day')] as const;
    if (dateFilter === 'month') return [dayjs().startOf('month'), dayjs().endOf('day')] as const;
    if (dateFilter === 'custom' && customRange) return [customRange[0].startOf('day'), customRange[1].endOf('day')] as const;
    return [dayjs().startOf('day'), dayjs().endOf('day')] as const;
  }, [dateFilter, customRange]);

  const filterLabel = useMemo(() => {
    if (dateFilter === 'today') return 'today';
    if (dateFilter === 'week') return 'this week';
    if (dateFilter === 'month') return 'this month';
    if (dateFilter === 'custom' && customRange) return `${customRange[0].format('MMM DD')} – ${customRange[1].format('MMM DD')}`;
    return 'today';
  }, [dateFilter, customRange]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        AttendanceService.getDashboardSummary(range[0].toISOString(), range[1].toISOString()),
        AttendanceService.getPresentMembers(range[0].toISOString(), range[1].toISOString()),
      ]);
      setSummary(s as any);
      setPresent(p as any);
    } catch (err: any) {
      message.error(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (canReadAttendanceDashboard) load();
  }, [canReadAttendanceDashboard, load]);

  const isToday = dateFilter === 'today';
  const rate = summary?.attendanceRate || 0;
  const rateColor = rate >= 90 ? PALETTE.green : rate >= 75 ? PALETTE.amber : PALETTE.red;

  const statCells = [
    { key: 'members', title: 'Total Members', value: summary?.totalMembers ?? 0, period: 'in organization', icon: <TeamOutlined />, color: PALETTE.blue, tint: TINT.blue, trend: TRENDS.members },
    { key: 'present', title: isToday ? 'Present Today' : 'Present', value: summary?.presentToday ?? 0, period: `of ${summary?.expectedToday ?? 0} expected`, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green, trend: TRENDS.present },
    { key: 'absent', title: isToday ? 'Absent Today' : 'Absent', value: summary?.absentToday ?? 0, period: filterLabel, icon: <CloseCircleOutlined />, color: PALETTE.red, tint: TINT.red, trend: TRENDS.absent },
    { key: 'late', title: isToday ? 'Late Today' : 'Late', value: summary?.lateToday ?? 0, period: filterLabel, icon: <ExclamationCircleOutlined />, color: PALETTE.amber, tint: TINT.amber, trend: TRENDS.late },
  ];

  const SEGMENTS: { key: DateFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  const insights = [
    { label: 'Expected', value: summary?.expectedToday ?? 0, color: PALETTE.purple, tint: TINT.purple, icon: <ClockCircleOutlined /> },
    { label: 'Present', value: summary?.presentToday ?? 0, color: PALETTE.green, tint: TINT.green, icon: <CheckCircleOutlined /> },
    { label: 'Late', value: summary?.lateToday ?? 0, color: PALETTE.amber, tint: TINT.amber, icon: <ExclamationCircleOutlined /> },
    { label: 'Work from Home', value: summary?.wfhToday ?? 0, color: PALETTE.purple, tint: TINT.purple, icon: <HomeOutlined /> },
  ];

  if (!canReadAttendanceDashboard) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view this dashboard.</div>;
  }

  return (
    <div className="adb">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="adb-header">
        <div className="adb-header-about">
          <div className="adb-header-icon"><TeamOutlined /></div>
          <div>
            <div className="adb-header-title">Attendance Dashboard</div>
            <div className="adb-header-sub">Organization attendance overview · {filterLabel}</div>
          </div>
        </div>
        <div className="adb-header-actions">
          <div className="adb-seg">
            {SEGMENTS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`adb-seg-btn ${dateFilter === s.key ? 'is-active' : ''}`}
                onClick={() => setDateFilter(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <RangePicker
            className="adb-range"
            value={customRange}
            onChange={(dates) => {
              setCustomRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
              if (dates && dates[0] && dates[1]) setDateFilter('custom');
            }}
          />
          <Tooltip title="Refresh"><button type="button" className="adb-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="adb-stats">
        {statCells.map((s) => (
          <div key={s.key} className="adb-stat-card">
            <div className="adb-stat-top">
              <div className="adb-stat-left">
                <span className="adb-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                <span className="adb-stat-label">{s.title}</span>
              </div>
            </div>
            <div className="adb-stat-bottom">
              <div className="adb-stat-value-wrap">
                <span className="adb-stat-value">{s.value}</span>
                <span className="adb-stat-period">{s.period}</span>
              </div>
              <div className="adb-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TWO COLUMNS: who's in · health ─────────────────────────────────── */}
      <div className="adb-grid">
        {/* Present employees */}
        <div className="adb-card adb-people">
          <div className="adb-card-head">
            <div className="adb-card-title"><TeamOutlined /> Who’s in <span className="adb-muted">· {filterLabel}</span></div>
            <span className="adb-count">{present.length}</span>
          </div>
          <div className="adb-people-list">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="adb-emp-row adb-skeleton">
                  <span className="adb-sk-avatar" />
                  <span className="adb-sk-line" />
                </div>
              ))
            ) : present.length === 0 ? (
              <div className="adb-empty"><CalendarOutlined style={{ fontSize: 22, opacity: 0.5 }} /><div>No one is marked present {filterLabel}.</div></div>
            ) : (
              present.map((e) => {
                const meta = STATUS_META[e.status] || STATUS_META.present;
                return (
                  <div key={e.id} className="adb-emp-row">
                    <Avatar size={40} src={e.avatarUrl} style={{ background: meta.color, borderRadius: 11, fontWeight: 700, flexShrink: 0 }}>
                      {e.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="adb-emp-main">
                      <div className="adb-emp-name-row">
                        <span className="adb-emp-name">{e.name}</span>
                        <span className="adb-emp-status" style={{ background: meta.tint, color: meta.color }}>{meta.icon} {meta.label}</span>
                      </div>
                      <div className="adb-emp-meta">{positionLabel(e.position)}</div>
                    </div>
                    <div className="adb-emp-side">
                      <div className="adb-emp-in"><ClockCircleOutlined /> {e.clockInTime ? dayjs(e.clockInTime).format('HH:mm') : '—'}</div>
                      <div className="adb-emp-hours">{formatDuration(e.workHours)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance health */}
        <div className="adb-card adb-health">
          <div className="adb-card-head">
            <div className="adb-card-title"><RiseOutlined /> Attendance Health</div>
          </div>
          <div className="adb-ring-wrap">
            <Ring value={rate} color={rateColor} />
            <div className="adb-ring-caption" style={{ color: rateColor }}>
              {rate >= 90 ? 'Excellent' : rate >= 75 ? 'Healthy' : 'Needs attention'}
            </div>
          </div>
          <div className="adb-insights">
            {insights.map((i) => (
              <div key={i.label} className="adb-insight-row">
                <span className="adb-insight-icon" style={{ background: i.tint, color: i.color }}>{i.icon}</span>
                <span className="adb-insight-label">{i.label}</span>
                <span className="adb-insight-value">{i.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .adb { display: flex; flex-direction: column; flex: 1; min-height: 0; }

        /* Header */
        .adb-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap;
        }
        .adb-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .adb-header-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .adb-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .adb-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .adb-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; max-width: 100%; }
        .adb-seg { display: inline-flex; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: 9px; padding: 3px; gap: 2px; }
        .adb-seg-btn {
          border: none; background: transparent; cursor: pointer; height: 28px; padding: 0 14px; border-radius: 7px;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-500);
        }
        .adb-seg-btn:hover { color: var(--text-slate-800); }
        .adb-seg-btn.is-active { background: var(--bg-pure-white); color: ${PALETTE.blue}; box-shadow: 0 1px 3px rgba(15,23,42,0.10); }
        .adb-range.ant-picker { border-radius: 8px; height: 36px; max-width: 100%; }
        .adb-ghost-btn {
          width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .adb-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }

        /* Stat cards */
        .adb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .adb-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .adb-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .adb-stat-left { display: flex; align-items: center; gap: 8px; }
        .adb-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .adb-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .adb-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .adb-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
        .adb-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .adb-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* Two-column grid */
        .adb-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px; align-items: start; }
        .adb-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .adb-card-head {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 13px 16px; border-bottom: 1px solid var(--border-slate-100);
        }
        .adb-card-title { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-slate-800); }
        .adb-card-title .anticon { color: var(--text-slate-400); }
        .adb-muted { color: var(--text-slate-400); font-weight: 500; }
        .adb-count {
          min-width: 24px; height: 22px; padding: 0 8px; border-radius: 999px; background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;
        }

        /* People list */
        .adb-people-list { max-height: 460px; overflow-y: auto; }
        .adb-emp-row { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .adb-emp-row:last-child { border-bottom: none; }
        .adb-emp-row:hover { background: var(--bg-slate-50); }
        .adb-emp-main { flex: 1; min-width: 0; }
        .adb-emp-name-row { display: flex; align-items: center; gap: 8px; }
        .adb-emp-name { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); }
        .adb-emp-status { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700; }
        .adb-emp-meta { font-size: 11.5px; color: var(--text-slate-400); margin-top: 2px; }
        .adb-emp-side { text-align: right; flex-shrink: 0; }
        .adb-emp-in { font-size: 11.5px; color: var(--text-slate-500); display: inline-flex; align-items: center; gap: 5px; }
        .adb-emp-in .anticon { color: var(--text-slate-400); }
        .adb-emp-hours { font-size: 13px; font-weight: 800; color: var(--text-slate-900); margin-top: 2px; font-variant-numeric: tabular-nums; }
        .adb-empty { padding: 40px 16px; text-align: center; color: var(--text-slate-400); font-size: 12.5px; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        /* Skeleton */
        .adb-skeleton { pointer-events: none; }
        .adb-sk-avatar { width: 40px; height: 40px; border-radius: 11px; background: var(--bg-slate-50); flex-shrink: 0; }
        .adb-sk-line { flex: 1; height: 12px; border-radius: 6px; background: var(--bg-slate-50); }
        .adb-skeleton .adb-sk-avatar, .adb-skeleton .adb-sk-line { animation: adb-pulse 1.3s ease-in-out infinite; }
        @keyframes adb-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }

        /* Health */
        .adb-ring-wrap { display: flex; flex-direction: column; align-items: center; padding: 22px 16px 6px; }
        .adb-ring-caption { font-size: 13px; font-weight: 700; margin-top: 6px; }
        .adb-insights { padding: 8px 16px 16px; display: flex; flex-direction: column; }
        .adb-insight-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-slate-100); }
        .adb-insight-row:last-child { border-bottom: none; }
        .adb-insight-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .adb-insight-label { flex: 1; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .adb-insight-value { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }

        @media (max-width: 1100px) {
          .adb-stats { grid-template-columns: repeat(2, 1fr); }
          .adb-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .adb-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
