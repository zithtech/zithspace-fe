'use client';

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Select, message, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CaretRightOutlined,
  CheckSquareOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  CalendarOutlined,
  CheckCircleOutlined as PresentIcon,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CoffeeOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import BreakPickerModal from '@/components/attendance/BreakPickerModal';
import { breakLabel } from '@/components/attendance/breakTypes';
import {
  AttendanceService,
  Attendance,
  TodayAttendance,
  AttendanceState,
} from '@/services/attendanceService';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { getDeviceLocation } from '@/lib/geolocation';
import { useSocket } from '@/providers/SocketProvider';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

// ── Module palette: blue / green / amber / red / grey ───────────────────────
const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  grey: '#94A3B8',
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  amber: 'rgba(245,158,11,0.12)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

interface TodayStatus extends TodayAttendance {
  shift?: { id: string; name: string; startTime: string; endTime: string; isFlexible?: boolean };
  isClockIn: boolean;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  totalWorkMinutes: number;
}

const STATUS_META: Record<string, { label: string; color: string; tint: string; icon: React.ReactNode }> = {
  present: { label: 'Present', color: PALETTE.green, tint: TINT.green, icon: <PresentIcon /> },
  late: { label: 'Late', color: PALETTE.amber, tint: TINT.amber, icon: <ExclamationCircleOutlined /> },
  absent: { label: 'Absent', color: PALETTE.red, tint: TINT.red, icon: <CloseCircleOutlined /> },
};

const STATE_META: Record<AttendanceState, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: PALETTE.grey },
  working: { label: 'Working', color: PALETTE.green },
  paused: { label: 'On break', color: PALETTE.amber },
  complete: { label: 'Complete', color: PALETTE.blue },
};

const formatDuration = (minutes?: number) => {
  if (!minutes && minutes !== 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

// Clock In / Out panel — 5 stacked full-width sections:
//   1) Header   2) Clock band (horizontal)   3) Work Hours Insights (horizontal)
//   4) Current-month table   5) Sticky bottom pager
export default function ClockInOutPanel() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { canClockInOut, canReadAttendance, canReadMyHubAttendance } = usePermission();
  console.log("Forcing HMR reload for ClockInOutPanel");

  const [today, setToday] = useState<TodayStatus | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<Attendance[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const [breakModalOpen, setBreakModalOpen] = useState(false);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const monthStart = useMemo(() => dayjs().startOf('month'), []);
  const monthEnd = useMemo(() => dayjs().endOf('month'), []);
  const monthLabel = monthStart.format('MMMM YYYY');

  // Today status + summary (the header band + insights).
  const loadTop = useCallback(async () => {
    setLoading(true);
    try {
      const [status, sum] = await Promise.all([
        AttendanceService.getTodayAttendance(),
        AttendanceService.getMySummary(),
      ]);
      setToday(status as any);
      setSummary(sum);
    } catch (err: any) {
      message.error(err?.message || 'Failed to load today’s status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Current-month records (paginated).
  const loadMonth = useCallback(async () => {
    if (!user?.id) return;
    setTableLoading(true);
    try {
      const res = await AttendanceService.getAttendance({
        page: tablePage,
        limit: tablePageSize,
        member: user.id,
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      });
      setRows(res.data);
      setServerTotal(res.pagination.total);
    } catch (err: any) {
      message.error(err?.message || 'Failed to load this month’s records');
    } finally {
      setTableLoading(false);
    }
  }, [user?.id, tablePage, tablePageSize, monthStart, monthEnd]);

  useEffect(() => {
    if (canClockInOut || canReadAttendance || canReadMyHubAttendance) loadTop();
  }, [canClockInOut, canReadAttendance, canReadMyHubAttendance, loadTop]);

  useEffect(() => {
    if (canClockInOut || canReadAttendance || canReadMyHubAttendance) loadMonth();
  }, [canClockInOut, canReadAttendance, canReadMyHubAttendance, loadMonth]);

  const refresh = useCallback(() => {
    loadTop();
    loadMonth();
  }, [loadTop, loadMonth]);

  useEffect(() => {
    if (!socket) return;
    socket.on('attendance:updated', refresh);
    return () => {
      socket.off('attendance:updated', refresh);
    };
  }, [socket, refresh]);

  useEffect(() => {
    window.addEventListener('attendance:refresh', refresh);
    return () => window.removeEventListener('attendance:refresh', refresh);
  }, [refresh]);

  const runAction = async (fn: () => Promise<unknown>, okMsg: string) => {
    setActing(true);
    try {
      await fn();
      message.success(okMsg);
      // Wait for socket to trigger refresh, or trigger it manually
      refresh();
    } catch (err: any) {
      message.error(err?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  // Work timers paused alongside the break — used to ask whether to resume them.
  const activeEntries = useTimeTrackerStore((s) => s.activeEntries);
  const fetchActiveTimer = useTimeTrackerStore((s) => s.fetchActiveTimer);
  const syncTimer = useTimeTrackerStore((s) => s.syncTimer);
  const pausedTimerCount = activeEntries.filter((e) => e.status === 'PAUSED').length;

  const clockIn = () =>
    runAction(async () => {
      const loc = await getDeviceLocation(); // best-effort; null if denied/unavailable
      await AttendanceService.clockIn(loc ?? undefined);
    }, 'Clocked in');
  const pause = (breakType?: string, reason?: string) =>
    runAction(() => AttendanceService.pause({ breakType, reason }), 'Paused — enjoy your break');
  const resume = (resumeTimers = true) =>
    runAction(async () => {
      const loc = await getDeviceLocation(); // capture where work resumed (best-effort)
      if (resumeTimers) {
        // Optimistically flip paused timers to RUNNING so the header widget ticks
        // the instant the user confirms; the socket + refetch reconcile right after.
        const nowIso = new Date().toISOString();
        activeEntries
          .filter((e) => e.status === 'PAUSED')
          .forEach((e) =>
            syncTimer({
              ...e,
              status: 'RUNNING',
              logs: [{ id: `optimistic-${e.id}`, action: 'RESUMED', createdAt: nowIso }, ...(e.logs || [])],
            }),
          );
      }
      await AttendanceService.resume({ resumeTimers, ...(loc ?? {}) });
      await fetchActiveTimer(); // reconcile the widget with server truth
    }, resumeTimers ? 'Welcome back — time tracking resumed' : 'Welcome back — time tracking stays paused');
  const complete = () => runAction(() => AttendanceService.complete(), 'Day completed');

  // ── Pager ──────────────────────────────────────────────────────────────────
  const total = serverTotal;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);

  useEffect(() => {
    setTablePage(1);
  }, [tablePageSize]);

  const insights = [
    { key: 'week', title: 'This Week', value: summary?.thisWeek?.workHours || '0h 0m', sub: 'hours worked', icon: <FieldTimeOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'month', title: 'This Month', value: summary?.thisMonth?.workHours || '0h 0m', sub: 'hours worked', icon: <CalendarOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'avg', title: 'Daily Average', value: summary?.thisWeek?.averagePerDay || '0h 0m', sub: 'per working day', icon: <DashboardOutlined />, color: PALETTE.amber, tint: TINT.amber },
    { key: 'ot', title: 'Overtime (Week)', value: summary?.thisWeek?.overtimeHours || '0h', sub: 'beyond schedule', icon: <ThunderboltOutlined />, color: PALETTE.grey, tint: TINT.grey },
  ];

  const columns: ColumnsType<Attendance> = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v) => (v ? dayjs(v).format('ddd, MMM DD') : '-') },
    { title: 'Clock In', dataIndex: 'clockIn', key: 'clockIn', render: (v) => (v ? dayjs(v).format('HH:mm') : '-') },
    { title: 'Clock Out', dataIndex: 'clockOut', key: 'clockOut', render: (v) => (v ? dayjs(v).format('HH:mm') : '-') },
    {
      title: 'Work Hours',
      key: 'workHours',
      render: (_, r: any) => formatDuration(r.effectiveWorkMinutes ?? r.totalWorkMinutes),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const meta = STATUS_META[v] || STATUS_META.absent;
        return (
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px',
              borderRadius: 999, background: meta.tint, color: meta.color, fontSize: 12, fontWeight: 600,
            }}
          >
            {meta.icon} {meta.label}
          </span>
        );
      },
    },
  ];

  // Expandable child row — lists every work session + the breaks between them.
  const renderSessions = (record: Attendance) => {
    const sessions = record.sessions || [];
    if (!sessions.length) {
      return <div className="cio-sub-empty">No session details for this day.</div>;
    }
    return (
      <div className="cio-sub">
        {sessions.map((s, i) => {
          const next = sessions[i + 1];
          const gap = next && s.clockOut ? Math.max(0, dayjs(next.clockIn).diff(dayjs(s.clockOut), 'minute')) : 0;
          return (
            <React.Fragment key={s.id || i}>
              <div className="cio-sub-row">
                <span className="cio-sub-dot" style={{ background: s.isOpen ? PALETTE.green : PALETTE.blue }} />
                <span className="cio-sub-idx">Session {i + 1}</span>
                <span className="cio-sub-time">
                  {dayjs(s.clockIn).format('HH:mm')}
                  <span className="cio-sub-arrow">→</span>
                  {s.clockOut ? dayjs(s.clockOut).format('HH:mm') : <em>ongoing</em>}
                </span>
                <span className="cio-sub-dur">{formatDuration(s.workMinutes)}</span>
              </div>
              {gap > 0 && (
                <div className="cio-sub-break">
                  <CoffeeOutlined /> {breakLabel(s.breakType)} · {formatDuration(gap)}
                  {s.breakReason ? <span className="cio-sub-break-reason">— {s.breakReason}</span> : null}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (!canClockInOut && !canReadAttendance && !canReadMyHubAttendance) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view this page.</div>;
  }

  const state: AttendanceState = today?.state ?? 'not_started';
  const stateMeta = STATE_META[state];
  const sessionCount = today?.sessionCount ?? today?.sessions?.length ?? 0;
  const completeDescription = `You've worked ${formatDuration(today?.totalWorkMinutes ?? 0)}${sessionCount ? ` across ${sessionCount} session${sessionCount === 1 ? '' : 's'}` : ''
    }. You won't be able to clock in again today.`;

  return (
    <div className="cio">
      {/* ── 1) HEADER ─────────────────────────────────────────────────────────── */}
      <div className="cio-header">
        <div className="cio-header-about">
          <div className="cio-header-icon"><ClockCircleOutlined /></div>
          <div>
            <div className="cio-header-title">Clock In / Out</div>
            <div className="cio-header-sub">Track your daily working hours and attendance status</div>
          </div>
        </div>
        <Tooltip title="Refresh">
          <button type="button" className="cio-ghost-btn" onClick={refresh}><ReloadOutlined spin={loading || tableLoading} /></button>
        </Tooltip>
      </div>

      {/* ── 2) CLOCK BAND (horizontal, full width) ───────────────────────────── */}
      <div className="cio-band">
        {/* shift */}
        <div className="cio-band-shift">
          <div className="cio-band-eyebrow">Current Shift</div>
          <div className="cio-band-shift-name">{today?.shift?.name || 'General Shift'}</div>
          <div className="cio-band-shift-time">
            {today?.shift?.startTime && today?.shift?.endTime
              ? `${today.shift.startTime} – ${today.shift.endTime}`
              : 'Flexible hours'}
          </div>
        </div>

        {/* action */}
        <div className="cio-band-action">
          {!today ? (
            <ZukvoLoader size="md" />
          ) : state === 'not_started' ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={clockIn}
              loading={acting}
              className="cio-action-btn cio-action-in"
            >
              Clock In
            </Button>
          ) : state === 'working' ? (
            <div className="cio-action-group">
              <Button
                icon={<PauseCircleOutlined />}
                onClick={() => setBreakModalOpen(true)}
                loading={acting}
                className="cio-action-btn cio-action-pause"
              >
                Pause
              </Button>
              <ConfirmDialog
                tone="warning"
                icon={<CheckSquareOutlined />}
                title="Complete your day?"
                description={completeDescription}
                confirmText="Yes, complete day"
                placement="bottom"
                onConfirm={complete}
              >
                <Button
                  type="primary"
                  icon={<CheckSquareOutlined />}
                  loading={acting}
                  className="cio-action-btn cio-action-done"
                >
                  Day Complete
                </Button>
              </ConfirmDialog>
            </div>
          ) : state === 'paused' ? (
            <div className="cio-action-group">
              {pausedTimerCount > 0 ? (
                <ConfirmDialog
                  tone="primary"
                  icon={<FieldTimeOutlined />}
                  title="Resume time tracking too?"
                  description={`You paused ${pausedTimerCount} work timer${pausedTimerCount > 1 ? 's' : ''} with your break. Resume ${pausedTimerCount > 1 ? 'them' : 'it'} along with your day, or keep tracking paused?`}
                  confirmText="Resume tracking"
                  cancelText="Keep paused"
                  placement="top"
                  width={340}
                  onConfirm={() => resume(true)}
                  onCancel={() => resume(false)}
                >
                  <Button
                    type="primary"
                    icon={<CaretRightOutlined />}
                    loading={acting}
                    className="cio-action-btn cio-action-in"
                  >
                    Resume
                  </Button>
                </ConfirmDialog>
              ) : (
                <Button
                  type="primary"
                  icon={<CaretRightOutlined />}
                  onClick={() => resume(true)}
                  loading={acting}
                  className="cio-action-btn cio-action-in"
                >
                  Resume
                </Button>
              )}
              <ConfirmDialog
                tone="warning"
                icon={<CheckSquareOutlined />}
                title="Complete your day?"
                description={completeDescription}
                confirmText="Yes, complete day"
                placement="bottom"
                onConfirm={complete}
              >
                <Button
                  icon={<CheckSquareOutlined />}
                  loading={acting}
                  className="cio-action-btn cio-action-done-ghost"
                >
                  Day Complete
                </Button>
              </ConfirmDialog>
            </div>
          ) : (
            <div className="cio-complete">
              <CheckCircleOutlined style={{ fontSize: 20, color: PALETTE.green }} />
              <span>Day Complete</span>
            </div>
          )}
        </div>

        {/* today mini-stats */}
        <div className="cio-band-stats">
          <div className="cio-mini">
            <div className="cio-mini-label">Today’s Hours</div>
            <div className="cio-mini-value">{formatDuration(today?.totalWorkMinutes ?? 0)}</div>
          </div>
          <div className="cio-mini">
            <div className="cio-mini-label">Status</div>
            <div className="cio-mini-value" style={{ color: stateMeta.color }}>
              {state === 'paused' && <span className="cio-break-dot" />}
              {state === 'paused' && today?.breakType ? breakLabel(today.breakType) : stateMeta.label}
            </div>
          </div>
          <div className="cio-mini">
            <div className="cio-mini-label">Sessions</div>
            <div className="cio-mini-value">{sessionCount || '--'}</div>
          </div>
          <div className="cio-mini">
            <div className="cio-mini-label">Break</div>
            <div className="cio-mini-value">{formatDuration(today?.breakMinutes ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* ── 3) WORK HOURS INSIGHTS (horizontal, full width) ──────────────────── */}
      <div className="cio-section-label"><FieldTimeOutlined /> Work Hours Insights</div>
      <div className="cio-insights">
        {insights.map((s) => (
          <div key={s.key} className="cio-insight-card">
            <div className="cio-insight-top">
              <span className="cio-insight-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="cio-insight-title">{s.title}</span>
            </div>
            <div className="cio-insight-value">{s.value}</div>
            <div className="cio-insight-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 4) CURRENT MONTH TABLE ───────────────────────────────────────────── */}
      <div className="cio-section-label cio-table-label">
        <CalendarOutlined /> {monthLabel} · My Attendance
        <span className="cio-table-count">{total} record{total === 1 ? '' : 's'}</span>
      </div>
      <div className="cio-table-wrap" style={{ overflowX: 'auto' }}>
        <ZukvoLoadingOverlay loading={tableLoading} message="">
          <Table
            rowKey="id"
            size="small"
            className="cio-table"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            onRow={() => ({ className: 'cio-row' })}
            expandable={{
              expandedRowRender: renderSessions,
              rowExpandable: (record) => (record.sessions?.length || 0) > 0,
            }} locale={{ emptyText: <NoData /> }}
          />
        </ZukvoLoadingOverlay>
      </div>

      {/* ── 5) STICKY BOTTOM PAGER ───────────────────────────────────────────── */}
      {total > 0 && (
        <div className="cio-footer cio-footer--sticky">
          <div className="cio-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="cio-pager">
            <button type="button" className="cio-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5)
              .map((p) => (
                <button key={p} type="button" className={`cio-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
              ))}
            <button type="button" className="cio-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="cio-pagesize"
              size="small"
              value={tablePageSize}
              onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      <BreakPickerModal
        open={breakModalOpen}
        loading={acting}
        onCancel={() => setBreakModalOpen(false)}
        onConfirm={async (breakType, reason) => {
          await pause(breakType, reason);
          setBreakModalOpen(false);
        }}
      />

      <style jsx global>{`
        .cio { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .cio > * { flex-shrink: 0; }

        /* 1) Header */
        .cio-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap;
        }
        .cio-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .cio-header-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .cio-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .cio-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .cio-ghost-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cio-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }

        /* 2) Clock band — horizontal full width */
        .cio-band {
          display: flex; align-items: stretch; gap: 0; margin-bottom: 20px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; box-shadow: 0 1px 2px rgba(15,23,42,0.04); overflow: hidden;
        }
        .cio-band-shift {
          flex: 0 0 240px; padding: 12px 20px; display: flex; flex-direction: column; justify-content: center;
          background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0));
          border-right: 1px solid var(--border-slate-100);
        }
        .cio-band-eyebrow {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-slate-400);
        }
        .cio-band-shift-name { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; margin-top: 2px; line-height: 1.15; }
        .cio-band-shift-time { font-size: 12px; font-weight: 600; color: ${PALETTE.blue}; margin-top: 2px; }
        .cio-band-action {
          flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px 20px;
          border-right: 1px solid var(--border-slate-100); min-width: 220px;
        }
        .cio-action-btn {
          height: 36px !important; border-radius: 6px !important;
          font-size: 13px !important; font-weight: 600 !important; padding: 0 16px !important;
        }
        .cio-action-in { background: ${PALETTE.blue} !important; border: 1px solid ${PALETTE.blue} !important; color: #fff !important; box-shadow: none !important; }
        .cio-action-in:hover { background: #2f6fe0 !important; border-color: #2f6fe0 !important; }
        .cio-action-out { background: ${PALETTE.red} !important; border: 1px solid ${PALETTE.red} !important; color: #fff !important; box-shadow: none !important; }
        .cio-action-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .cio-action-pause {
          background: var(--bg-pure-white) !important; color: ${PALETTE.amber} !important;
          border: 1px solid rgba(245,158,11,0.4) !important; box-shadow: none !important;
        }
        .cio-action-pause:hover { border-color: ${PALETTE.amber} !important; background: ${TINT.amber} !important; }
        .cio-action-done { background: ${PALETTE.green} !important; border: 1px solid ${PALETTE.green} !important; color: #fff !important; box-shadow: none !important; }
        .cio-action-done:hover { background: #0ea372 !important; border-color: #0ea372 !important; }
        .cio-action-done-ghost {
          background: var(--bg-pure-white) !important; color: ${PALETTE.green} !important;
          border: 1px solid rgba(16,185,129,0.4) !important; box-shadow: none !important;
        }
        .cio-action-done-ghost:hover { border-color: ${PALETTE.green} !important; background: ${TINT.green} !important; }
        .cio-break-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px;
          background: ${PALETTE.amber}; box-shadow: 0 0 0 3px ${TINT.amber};
          animation: cio-pulse 1.4s ease-in-out infinite;
        }
        @keyframes cio-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Expandable session child rows */
        .cio-sub { padding: 4px 8px 8px 36px; display: flex; flex-direction: column; gap: 4px; }
        .cio-sub-empty { padding: 10px 36px; color: var(--text-slate-400); font-size: 12px; }
        .cio-sub-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
        .cio-sub-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cio-sub-idx { font-size: 12px; font-weight: 700; color: var(--text-slate-700); min-width: 78px; }
        .cio-sub-time { font-size: 12.5px; color: var(--text-slate-900); display: inline-flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; }
        .cio-sub-arrow { color: var(--text-slate-400); }
        .cio-sub-time em { color: ${PALETTE.green}; font-style: normal; font-weight: 600; }
        .cio-sub-dur { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--text-slate-700); font-variant-numeric: tabular-nums; }
        .cio-sub-break {
          display: inline-flex; align-items: center; gap: 7px; margin-left: 90px;
          font-size: 11.5px; font-weight: 600; color: ${PALETTE.amber};
        }
        .cio-sub-break-reason { color: var(--text-slate-400); font-weight: 500; font-style: italic; }
        .cio-complete {
          display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 6px;
          background: ${TINT.green}; border: 1px solid rgba(16,185,129,0.2);
          color: ${PALETTE.green}; font-size: 13px; font-weight: 700;
        }
        .cio-band-stats {
          flex: 0 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
        }
        .cio-mini {
          padding: 10px 18px; display: flex; flex-direction: column; justify-content: center; gap: 2px;
          border-right: 1px solid var(--border-slate-100); min-width: 104px;
        }
        .cio-mini:last-child { border-right: none; }
        .cio-mini-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400); }
        .cio-mini-value { font-size: 15px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; }

        /* Section label */
        .cio-section-label {
          display: flex; align-items: center; gap: 7px; margin-bottom: 10px;
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-700);
        }
        .cio-section-label .anticon { color: var(--text-slate-400); }
        .cio-table-label { margin-top: 4px; }
        .cio-table-count { margin-left: auto; font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); }

        /* 3) Insights — horizontal full width */
        .cio-insights { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .cio-insight-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 14px 16px; min-height: 96px;
          display: flex; flex-direction: column; gap: 8px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .cio-insight-top { display: flex; align-items: center; gap: 8px; }
        .cio-insight-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .cio-insight-title { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .cio-insight-value { font-size: 24px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .cio-insight-sub { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* 4) Table */
        .cio-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .cio-table, .cio-table.ant-table-wrapper, .cio-table .ant-table, .cio-table .ant-table-container, .cio-table .ant-table-content, .cio-table .ant-table-header, .cio-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .cio-table .ant-table-thead > tr > th,
        .cio-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .cio-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .cio-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .cio-table .ant-table-tbody > tr.cio-row:hover > td { background: var(--bg-slate-50) !important; }

        /* 5) Sticky footer pager */
        .cio-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          height: 52px; box-sizing: border-box;
        }
        .cio-footer--sticky {
          position: sticky; bottom: 0; z-index: 20; margin: auto -32px 0; padding: 0 32px;
          background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .cio-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .cio-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .cio-pager { display: flex; align-items: center; gap: 3px; }
        .cio-pager-btn, .cio-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .cio-pager-btn:hover:not(:disabled), .cio-pager-num:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .cio-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cio-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .cio-pagesize { margin-left: 5px; }
        .cio-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Responsive: stack the band on narrow screens */
        @media (max-width: 1100px) {
          .cio-band { flex-wrap: wrap; }
          .cio-band-shift { flex: 1 1 100%; border-right: none; border-bottom: 1px solid var(--border-slate-100); }
          .cio-band-action { flex: 1 1 100%; border-right: none; border-bottom: 1px solid var(--border-slate-100); }
          .cio-band-stats { flex: 1 1 100%; }
          .cio-insights { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .cio-insights { grid-template-columns: 1fr; }
          .cio-band-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
