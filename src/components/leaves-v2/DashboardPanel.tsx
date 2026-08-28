'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tag, Tooltip, message, Empty } from 'antd';
import { Menu } from 'lucide-react';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import LeaveV2Service, { Holiday, LeaveBalanceItem, LeaveRequest } from '@/services/leaveV2Service';

import ApplyLeaveDrawer from './ApplyLeaveDrawer';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8', amber: '#F59E0B' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)', amber: 'rgba(245,158,11,0.10)' } as const;

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: 'Pending' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

export default function DashboardPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const { canReadLeave, canApproveLeave, canReadLeaveHoliday, canCreateLeave } = usePermission();

  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaySet, setHolidaySet] = useState<Set<string>>(new Set());
  const [holidayCount, setHolidayCount] = useState(0);
  const [approvals, setApprovals] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllBalances, setShowAllBalances] = useState(false);
  
  const [applyDrawerOpen, setApplyDrawerOpen] = useState(false);

  const BAL_LIMIT = 8; // collapse the balances grid past this many

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, hd] = await Promise.all([
        LeaveV2Service.getMyBalances(),
        LeaveV2Service.getMyRequests(),
        LeaveV2Service.getLeaveHolidayDates(),
      ]);
      setBalances(b);
      setRequests(r);
      setHolidaySet(new Set(hd));
      const today = dayjs().format('YYYY-MM-DD');
      setHolidayCount(hd.filter((d) => d >= today).length);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
    if (canReadLeaveHoliday) LeaveV2Service.listHolidays({ year: dayjs().year() }).then(res => setHolidays(res.data)).catch(() => {});
    if (canApproveLeave) LeaveV2Service.getApprovals().then((a) => setApprovals(a.filter((x: any) => x.status === 'pending'))).catch(() => {});
  }, [canReadLeaveHoliday, canApproveLeave]);

  useEffect(() => {
    if (canReadLeave) load();
  }, [canReadLeave, load]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalAvailable = useMemo(() => balances.reduce((s, b) => s + b.available, 0), [balances]);
  const myPending = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);
  const daysTaken = useMemo(
    () => requests.filter((r) => r.status === 'approved').reduce((s, r) => s + r.paidUnits, 0),
    [requests]
  );
  const upcomingHolidays = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return holidays.filter((h) => h.fromDate >= today).sort((a, b) => a.fromDate.localeCompare(b.fromDate)).slice(0, 5);
  }, [holidays]);
  const recentRequests = useMemo(() => requests.slice(0, 5), [requests]);

  const statCells = [
    { key: 'avail', title: 'Available', value: totalAvailable, period: 'days', icon: <WalletOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'pending', title: 'My Pending', value: myPending, period: 'requests', icon: <ClockCircleOutlined />, color: PALETTE.blue, tint: TINT.blue },
    canApproveLeave
      ? { key: 'approve', title: 'To Approve', value: approvals.length, period: 'awaiting you', icon: <AuditOutlined />, color: PALETTE.amber, tint: TINT.amber }
      : { key: 'taken', title: 'Days Taken', value: daysTaken, period: 'approved', icon: <CheckCircleOutlined />, color: PALETTE.grey, tint: TINT.grey },
    { key: 'hol', title: 'Upcoming Holidays', value: holidayCount, period: 'ahead', icon: <CalendarOutlined />, color: PALETTE.red, tint: TINT.red },
  ];

  const fmt = (d: string) => dayjs(d).format('MMM D');
  const fmtFull = (d: string) => dayjs(d).format('ddd, MMM D');
  const daysAway = (d: string) => {
    const n = dayjs(d).startOf('day').diff(dayjs().startOf('day'), 'day');
    return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `in ${n} days`;
  };

  if (!canReadLeave) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view this.</div>;
  }

  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="lvd">
      {/* HEADER */}
      <div className="lvd-header">
        <div className="lvd-header-about">
          <button 
            type="button"
            className="lv-mobile-menu-btn" 
            onClick={() => window.dispatchEvent(new Event('open-lv-sidebar'))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="lvd-header-title">{firstName ? `Welcome back, ${firstName}` : 'Leave Dashboard'}</div>
            <div className="lvd-header-sub">Your time off at a glance</div>
          </div>
        </div>
        <div className="lvd-header-actions">
          <Tooltip title="Refresh"><button type="button" className="lvd-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreateLeave && <Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyDrawerOpen(true)} className="lvd-add-btn">Apply Leave</Button>}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="lvd-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvd-stat-card">
            <div className="lvd-stat-top">
              <span className="lvd-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="lvd-stat-label">{s.title}</span>
            </div>
            <div className="lvd-stat-bottom">
              <span className="lvd-stat-value">{s.value}</span>
              <span className="lvd-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MY BALANCES */}
      <div className="lvd-section-head">
        <span>My Balances{balances.length > 0 ? ` (${balances.length})` : ''}</span>
        {balances.length > BAL_LIMIT && (
          <button type="button" className="lvd-section-toggle" onClick={() => setShowAllBalances((v) => !v)}>
            {showAllBalances ? 'Show less' : `Show all ${balances.length}`}
          </button>
        )}
      </div>
      {balances.length === 0 ? (
        <div className="lvd-card"><NoData description="No leave balances yet" /></div>
      ) : (
        <div className="lvd-balances">
          {(showAllBalances ? balances : balances.slice(0, BAL_LIMIT)).map((b) => {
            const used = b.used;
            const total = b.used + b.available;
            const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            return (
              <div key={b.leaveTypeId} className="lvd-bal-card">
                <div className="lvd-bal-top">
                  <span className="lvd-bal-dot" style={{ background: b.color || PALETTE.grey }} />
                  <span className="lvd-bal-name" title={b.name}>{b.name}</span>
                </div>
                <div className="lvd-bal-mid">
                  <span className="lvd-bal-val">{b.available}<span className="lvd-bal-unit">avail</span></span>
                  <span className="lvd-bal-meta">{used}/{total}</span>
                </div>
                <div className="lvd-bal-bar"><div className="lvd-bal-bar-fill" style={{ width: `${pct}%`, background: b.color || PALETTE.blue }} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* GRID: holidays / recent / approvals */}
      <div className="lvd-grid">
        {/* Upcoming holidays */}
        {canReadLeaveHoliday && (
          <div className="lvd-panel">
            <div className="lvd-panel-head"><CalendarOutlined /> Upcoming Holidays</div>
            <div className="lvd-list">
              {upcomingHolidays.length === 0 ? <div className="lvd-empty">No upcoming holidays</div> : upcomingHolidays.map((h) => (
                <div key={h.id} className="lvd-list-row">
                  <div className="lvd-date-chip"><span className="lvd-date-d">{dayjs(h.fromDate).format('D')}</span><span className="lvd-date-m">{dayjs(h.fromDate).format('MMM')}</span></div>
                  <div className="lvd-list-body">
                    <div className="lvd-list-title">{h.name}</div>
                    <div className="lvd-list-sub">{fmtFull(h.fromDate)} · {daysAway(h.fromDate)}</div>
                  </div>
                  {h.type === 'National' || h.type === 'ALL' ? <Tag color="green" style={{ marginInlineEnd: 0 }}><GlobalOutlined /></Tag> : <Tag style={{ marginInlineEnd: 0 }}>{h.type}</Tag>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My recent requests */}
        <div className="lvd-panel">
          <div className="lvd-panel-head">
            <ClockCircleOutlined /> My Recent Requests
            <button type="button" className="lvd-link" onClick={() => router.push('/leaves-v2/apply')}>View all <ArrowRightOutlined /></button>
          </div>
          <div className="lvd-list">
            {recentRequests.length === 0 ? <div className="lvd-empty">No leave requests yet</div> : recentRequests.map((r) => (
              <div key={r.id} className="lvd-list-row">
                <span className="lvd-req-dot" style={{ background: r.leaveTypeColor || PALETTE.grey }} />
                <div className="lvd-list-body">
                  <div className="lvd-list-title">{r.leaveTypeName} · {r.totalUnits}d</div>
                  <div className="lvd-list-sub">{fmt(r.fromDate)}{r.toDate !== r.fromDate ? ` → ${fmt(r.toDate)}` : ''}{r.lopUnits > 0 ? ` · ${r.lopUnits} LOP` : ''}</div>
                </div>
                <Tag color={STATUS_TAG[r.status]?.color} style={{ marginInlineEnd: 0 }}>{STATUS_TAG[r.status]?.label ?? r.status}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals (managers) */}
        {canApproveLeave && (
          <div className="lvd-panel">
            <div className="lvd-panel-head">
              <AuditOutlined /> Awaiting My Approval
              <button type="button" className="lvd-link" onClick={() => router.push('/leaves-v2/approvals')}>Review <ArrowRightOutlined /></button>
            </div>
            <div className="lvd-list">
              {approvals.length === 0 ? <div className="lvd-empty">Nothing to approve 🎉</div> : approvals.slice(0, 5).map((r) => (
                <div key={r.id} className="lvd-list-row">
                  <span className="lvd-req-dot" style={{ background: r.leaveTypeColor || PALETTE.grey }} />
                  <div className="lvd-list-body">
                    <div className="lvd-list-title">{r.userName}</div>
                    <div className="lvd-list-sub">{r.leaveTypeName} · {r.totalUnits}d · {fmt(r.fromDate)}</div>
                  </div>
                  <Tag color="blue" style={{ marginInlineEnd: 0 }}>Pending</Tag>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ApplyLeaveDrawer
        open={applyDrawerOpen}
        onClose={() => setApplyDrawerOpen(false)}
        onSuccess={load}
        balances={balances}
        holidaySet={holidaySet}
      />

      <style jsx global>{`
        .lvd { display: flex; flex-direction: column; }
        .lvd-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .lvd-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .lvd-header-title { font-size: 19px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvd-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvd-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .lvd-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lvd-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvd-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .lvd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
        .lvd-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 14px 16px; min-height: 88px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvd-stat-top { display: flex; align-items: center; gap: 8px; }
        .lvd-stat-icon { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
        .lvd-stat-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .lvd-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .lvd-stat-value { font-size: 26px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvd-stat-period { font-size: 11.5px; color: var(--text-slate-400); }
        .lvd-section-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-slate-700); margin: 4px 0 10px; }
        .lvd-section-toggle { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 11.5px; font-weight: 600; color: ${PALETTE.blue}; }
        .lvd-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 24px; margin-bottom: 18px; }
        .lvd-balances { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
        .lvd-bal-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 9px 11px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvd-bal-top { display: flex; align-items: center; gap: 7px; }
        .lvd-bal-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
        .lvd-bal-name { font-size: 12px; font-weight: 600; color: var(--text-slate-700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lvd-bal-mid { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
        .lvd-bal-val { font-size: 19px; font-weight: 800; color: var(--text-slate-900); display: flex; align-items: baseline; gap: 4px; line-height: 1; }
        .lvd-bal-unit { font-size: 10px; font-weight: 500; color: var(--text-slate-400); }
        .lvd-bal-meta { font-size: 10.5px; color: var(--text-slate-400); white-space: nowrap; }
        .lvd-bal-bar { height: 4px; border-radius: 3px; background: var(--bg-slate-100); overflow: hidden; }
        .lvd-bal-bar-fill { height: 100%; border-radius: 3px; }
        .lvd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
        .lvd-panel { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); display: flex; flex-direction: column; }
        .lvd-panel-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100); font-size: 13px; font-weight: 700; color: var(--text-slate-800); }
        .lvd-panel-head .anticon:first-child { color: ${PALETTE.blue}; }
        .lvd-link { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 11.5px; font-weight: 600; color: ${PALETTE.blue}; display: inline-flex; align-items: center; gap: 4px; }
        .lvd-list { display: flex; flex-direction: column; }
        .lvd-list-row { display: flex; align-items: center; gap: 11px; padding: 10px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .lvd-list-row:last-child { border-bottom: none; }
        .lvd-list-body { flex: 1; min-width: 0; }
        .lvd-list-title { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lvd-list-sub { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .lvd-empty { padding: 22px; text-align: center; font-size: 12.5px; color: var(--text-slate-400); }
        .lvd-date-chip { width: 38px; height: 38px; border-radius: 8px; background: var(--bg-blue-50); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; line-height: 1; }
        .lvd-date-d { font-size: 14px; font-weight: 800; color: ${PALETTE.blue}; }
        .lvd-date-m { font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${PALETTE.blue}; opacity: 0.8; }
        .lvd-req-dot { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }
        
        @media (max-width: 1024px) {
          .lvd-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lvd-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
