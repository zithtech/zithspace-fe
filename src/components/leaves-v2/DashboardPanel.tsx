'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tag, Tooltip, message } from 'antd';
import {
  LucideIcon,
  Menu,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Laptop,
  CreditCard,
  Users,
  HeartPulse,
  Coffee,
  Plane,
  PartyPopper,
  CalendarDays,
  CalendarCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  PlusOutlined,
  AuditOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import LeaveV2Service, { Holiday, LeaveBalanceItem, LeaveRequest } from '@/services/leaveV2Service';

import ApplyLeaveDrawer from './ApplyLeaveDrawer';
import { PALETTE, TINT, StatCards } from '@/components/leaves-v2/ui';

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: 'Pending' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

interface LeaveBalanceTheme {
  color: string;
  bgTint: string;
  borderColor: string;
  darkBg: string;
  darkBorder: string;
  icon: LucideIcon;
}

const THEME_4_COLORS = {
  red: '#dc2626',
  orange: '#ea580c',
  green: '#059669',
  blue: '#2563eb',
} as const;

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return 'transparent';
  if (hex.startsWith('rgb')) return hex;
  const lower = hex.toLowerCase();
  const matched = (THEME_4_COLORS as Record<string, string>)[lower] || hex;
  let c = matched.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length === 6) {
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
  return hex;
}

function resolveLeaveColor(name?: string, rawColor?: string | null): string {
  const n = (name || '').toLowerCase();
  
  // 1. Check leave name first
  if (n.includes('loss') || n.includes('lop') || n.includes('unpaid') || n.includes('without pay')) {
    return THEME_4_COLORS.red;
  }
  if (n.includes('sick') || n.includes('medic') || n.includes('health')) {
    return THEME_4_COLORS.orange;
  }
  if (n.includes('earn') || n.includes('privilege') || n.includes('annual') || n.includes('vacation')) {
    return THEME_4_COLORS.green;
  }
  if (n.includes('casual') || n.includes('work') || n.includes('general')) {
    return THEME_4_COLORS.blue;
  }
  if (n.includes('comp') || n.includes('off') || n.includes('overtime')) {
    return THEME_4_COLORS.orange;
  }
  if (n.includes('matern') || n.includes('patern') || n.includes('parent') || n.includes('family')) {
    return THEME_4_COLORS.green;
  }

  // 2. Map any existing custom/raw color strictly to one of: red, orange, green, blue
  const c = (rawColor || '').trim().toLowerCase();
  if (c.includes('red') || c.includes('rose') || c.includes('f5222d') || c.includes('dc2626') || c.includes('ef4444')) {
    return THEME_4_COLORS.red;
  }
  if (c.includes('orange') || c.includes('amber') || c.includes('yellow') || c.includes('gold') || c.includes('volcano') || c.includes('ea580c') || c.includes('f97316')) {
    return THEME_4_COLORS.orange;
  }
  if (c.includes('green') || c.includes('lime') || c.includes('emerald') || c.includes('52c41a') || c.includes('059669') || c.includes('10b981')) {
    return THEME_4_COLORS.green;
  }

  // Default fallback is Blue
  return THEME_4_COLORS.blue;
}

function createTheme(color: string, bgTint: string, borderColor: string, icon: LucideIcon): LeaveBalanceTheme {
  return {
    color,
    bgTint,
    borderColor,
    darkBg: hexToRgba(color, 0.16),
    darkBorder: hexToRgba(color, 0.32),
    icon,
  };
}

const DEFAULT_THEMES: LeaveBalanceTheme[] = [
  createTheme(THEME_4_COLORS.blue, '#eff6ff', '#bfdbfe', Coffee),      // Blue
  createTheme(THEME_4_COLORS.orange, '#fff7ed', '#fed7aa', HeartPulse),// Orange
  createTheme(THEME_4_COLORS.green, '#ecfdf5', '#a7f3d0', Plane),      // Green
  createTheme(THEME_4_COLORS.red, '#fef2f2', '#fecaca', AlertCircle),  // Red
];

function getBalanceTheme(balance: LeaveBalanceItem, index: number): LeaveBalanceTheme {
  const name = (balance.name || '').toLowerCase();
  
  if (name.includes('loss') || name.includes('lop') || name.includes('unpaid') || name.includes('without pay')) {
    return createTheme(THEME_4_COLORS.red, '#fef2f2', '#fecaca', AlertCircle);
  }
  if (name.includes('sick') || name.includes('medic') || name.includes('health')) {
    return createTheme(THEME_4_COLORS.orange, '#fff7ed', '#fed7aa', HeartPulse);
  }
  if (name.includes('earn') || name.includes('privilege') || name.includes('annual') || name.includes('vacation')) {
    return createTheme(THEME_4_COLORS.green, '#ecfdf5', '#a7f3d0', Plane);
  }
  if (name.includes('casual') || name.includes('work') || name.includes('general')) {
    return createTheme(THEME_4_COLORS.blue, '#eff6ff', '#bfdbfe', Coffee);
  }
  if (name.includes('comp') || name.includes('off') || name.includes('overtime')) {
    return createTheme(THEME_4_COLORS.orange, '#fff7ed', '#fed7aa', Clock);
  }
  if (name.includes('matern') || name.includes('patern') || name.includes('parent') || name.includes('family')) {
    return createTheme(THEME_4_COLORS.green, '#ecfdf5', '#a7f3d0', Users);
  }

  return DEFAULT_THEMES[index % DEFAULT_THEMES.length];
}

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
  const totalCredited = useMemo(() => balances.reduce((s, b) => s + (b.credited || b.available), 0), [balances]);
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
    { key: 'hol', title: 'Upcoming Holidays', value: holidayCount, period: 'ahead', icon: <CalendarOutlined />, color: PALETTE.violet, tint: TINT.violet },
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
            <div className="lvd-header-sub">Your time off and leave balances at a glance</div>
          </div>
        </div>
        <div className="lvd-header-actions">
          <Tooltip title="Refresh">
            <button type="button" className="lvd-ghost-btn" onClick={load}>
              <ReloadOutlined spin={loading} />
            </button>
          </Tooltip>
          {canCreateLeave && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setApplyDrawerOpen(true)} 
              className="lvd-add-btn"
            >
              Apply Leave
            </Button>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <StatCards
        title="Leave Balances & Status"
        statusText="LIVE"
        progressPct={totalCredited > 0 ? Math.round((totalAvailable / totalCredited) * 100) : 0}
        cells={statCells.map(s => ({
          label: s.title,
          value: <>{s.value} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-slate-400)' }}>{s.period}</span></>,
          icon: s.icon,
          color: s.color,
          tint: s.tint
        }))}
      />

      <div className="lvd-content-wrap">

        {/* ── 1. MY BALANCES CARDS ─────────────────────────────────── */}
        <div className="lvd-section-head">
          <div className="lvd-section-title-wrap">
            <span>My Balances</span>
            {balances.length > 0 && <span className="lvd-count-chip">{balances.length} types</span>}
          </div>
          {balances.length > BAL_LIMIT && (
            <button type="button" className="lvd-section-toggle" onClick={() => setShowAllBalances((v) => !v)}>
              {showAllBalances ? 'Show less' : `Show all ${balances.length}`}
            </button>
          )}
        </div>

        {balances.length === 0 ? (
          <div className="lvd-empty-card"><NoData description="No leave balances configured yet" /></div>
        ) : (
          <div className="dept-cards-grid">
            {(showAllBalances ? balances : balances.slice(0, BAL_LIMIT)).map((b, idx) => {
              const theme = getBalanceTheme(b, idx);
              const Icon = theme.icon;
              const used = b.used;
              const credited = b.credited || (b.used + b.available);
              const pct = credited > 0 ? Math.min(100, Math.round((used / credited) * 100)) : 0;
              const unitStr = b.unit === 'hour' ? (b.available === 1 ? 'Hour' : 'Hours') : (b.available === 1 ? 'Day' : 'Days');

              return (
                <div
                  key={b.leaveTypeId}
                  className="dept-card"
                  style={{
                    ['--dept-color' as any]: theme.color,
                    ['--dept-bg' as any]: theme.bgTint,
                    ['--dept-border' as any]: theme.borderColor,
                    ['--dept-dark-bg' as any]: theme.darkBg,
                    ['--dept-dark-border' as any]: theme.darkBorder,
                  }}
                >
                  <div className="dept-card-top">
                    <div className="dept-card-icon">
                      <Icon size={18} />
                    </div>
                    <span className="dept-card-badge">
                      {b.available} {unitStr}
                    </span>
                  </div>

                  <div className="dept-card-body">
                    <h4 className="dept-card-title">{b.name}</h4>
                    <p className="dept-card-desc">
                      {used > 0 ? `${used} used of ${credited} ${b.unit || 'days'}` : `0 of ${credited} ${b.unit || 'days'} used`}
                      {credited > 0 ? ` · ${Math.max(0, credited - used)} remaining` : ''}
                    </p>
                    <div className="dept-card-progress-track">
                      <div 
                        className="dept-card-progress-bar" 
                        style={{ width: `${pct}%`, background: theme.color }} 
                      />
                    </div>
                  </div>

                  <div className="dept-card-footer">
                    <span className="dept-card-scope">
                      {b.isPaid ? 'Paid Leave' : 'Unpaid Leave'}{b.code ? ` • ${b.code}` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 2. THREE ENHANCED PANELS: HOLIDAYS / RECENT / APPROVALS ─── */}
        <div className="lvd-panels-grid">
          
          {/* Upcoming Holidays */}
          {canReadLeaveHoliday && (
            <div className="lvd-modern-panel">
              <div className="lvd-panel-header">
                <div className="lvd-panel-header-left">
                  <div className="lvd-panel-avatar" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="lvd-panel-title">Upcoming Holidays</h3>
                    <p className="lvd-panel-sub">{upcomingHolidays.length} upcoming scheduled</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="lvd-panel-link"
                  onClick={() => router.push('/government-holidays')}
                >
                  Calendar <ArrowRight size={13} />
                </button>
              </div>

              <div className="lvd-panel-content">
                {upcomingHolidays.length === 0 ? (
                  <div className="lvd-panel-empty">
                    <Calendar size={28} className="lvd-empty-icon" style={{ color: '#c4b5fd' }} />
                    <span className="lvd-empty-title">No upcoming holidays</span>
                    <span className="lvd-empty-sub">No official holidays scheduled for the near future.</span>
                  </div>
                ) : (
                  <div className="lvd-panel-list">
                    {upcomingHolidays.map((h) => {
                      const away = daysAway(h.fromDate);
                      const isSoon = away === 'Today' || away === 'Tomorrow' || away.includes('in 1 ') || away.includes('in 2 ') || away.includes('in 3 ');
                      return (
                        <div key={h.id} className="lvd-holiday-item">
                          <div className="lvd-date-badge">
                            <span className="lvd-date-month">{dayjs(h.fromDate).format('MMM')}</span>
                            <span className="lvd-date-day">{dayjs(h.fromDate).format('D')}</span>
                          </div>
                          <div className="lvd-holiday-details">
                            <div className="lvd-holiday-title-row">
                              <span className="lvd-holiday-title" title={h.name}>{h.name}</span>
                              <span className={`lvd-away-chip ${isSoon ? 'is-urgent' : ''}`}>
                                <Clock size={10} /> {away}
                              </span>
                            </div>
                            <div className="lvd-holiday-meta">
                              <span>{fmtFull(h.fromDate)}</span>
                              {h.toDate && h.toDate !== h.fromDate && (
                                <span> — {fmtFull(h.toDate)}</span>
                              )}
                            </div>
                          </div>
                          <div className="lvd-holiday-tag-cell">
                            {h.type === 'National' || h.type === 'ALL' ? (
                              <span className="lvd-chip-pill chip-national">
                                <GlobalOutlined style={{ fontSize: 11 }} /> National
                              </span>
                            ) : (
                              <span className="lvd-chip-pill chip-default">{h.type || 'General'}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Recent Requests */}
          <div className="lvd-modern-panel">
            <div className="lvd-panel-header">
              <div className="lvd-panel-header-left">
                <div className="lvd-panel-avatar" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="lvd-panel-title">My Recent Requests</h3>
                  <p className="lvd-panel-sub">{requests.length} submitted requests</p>
                </div>
              </div>
              <button 
                type="button" 
                className="lvd-panel-link"
                onClick={() => router.push('/leaves-v2/apply')}
              >
                View all <ArrowRight size={13} />
              </button>
            </div>

            <div className="lvd-panel-content">
              {recentRequests.length === 0 ? (
                <div className="lvd-panel-empty">
                  <CalendarCheck size={28} className="lvd-empty-icon" style={{ color: '#93c5fd' }} />
                  <span className="lvd-empty-title">No leave requests yet</span>
                  <span className="lvd-empty-sub">Submit your first request using the Apply button above.</span>
                  {canCreateLeave && (
                    <button 
                      type="button" 
                      className="lvd-quick-apply-btn"
                      onClick={() => setApplyDrawerOpen(true)}
                    >
                      <PlusOutlined /> Apply Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="lvd-panel-list">
                  {recentRequests.map((r) => {
                    const resolvedColor = resolveLeaveColor(r.leaveTypeName, r.leaveTypeColor);
                    const initials = (r.leaveTypeName || 'LV').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
                    return (
                      <div key={r.id} className="lvd-request-item">
                        <div 
                          className="lvd-leave-type-icon-box"
                          style={{
                            color: resolvedColor,
                            background: hexToRgba(resolvedColor, 0.12),
                            border: `1px solid ${hexToRgba(resolvedColor, 0.28)}`,
                            ['--req-dark-bg' as any]: hexToRgba(resolvedColor, 0.18),
                            ['--req-dark-border' as any]: hexToRgba(resolvedColor, 0.35),
                          }}
                        >
                          {initials}
                        </div>
                        <div className="lvd-request-details">
                          <div className="lvd-request-title-row">
                            <span className="lvd-request-title" title={r.leaveTypeName}>{r.leaveTypeName || 'Leave'}</span>
                            <span className="lvd-units-pill">
                              {r.totalUnits} {r.totalUnits === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                          <div className="lvd-request-meta">
                            <span>{fmt(r.fromDate)}{r.toDate !== r.fromDate ? ` → ${fmt(r.toDate)}` : ''}</span>
                            {r.lopUnits > 0 && <span className="lvd-mini-chip lop">{r.lopUnits} LOP</span>}
                            {r.dayPortion && r.dayPortion !== 'full' && (
                              <span className="lvd-mini-chip portion">
                                {r.dayPortion === 'first_half' ? '1st Half' : '2nd Half'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="lvd-status-cell">
                          <span className={`lvd-status-pill status-${r.status}`}>
                            {r.status === 'approved' && <CheckCircle2 size={12} />}
                            {r.status === 'pending' && <Clock size={12} />}
                            {r.status === 'rejected' && <AlertCircle size={12} />}
                            <span>{STATUS_TAG[r.status]?.label ?? r.status}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals (Managers) */}
          {canApproveLeave && (
            <div className="lvd-modern-panel">
              <div className="lvd-panel-header">
                <div className="lvd-panel-header-left">
                  <div className="lvd-panel-avatar" style={{ background: '#fffbeb', color: '#d97706' }}>
                    <AuditOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <h3 className="lvd-panel-title">Awaiting My Approval</h3>
                    <p className="lvd-panel-sub">{approvals.length > 0 ? `${approvals.length} pending review` : 'All caught up'}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="lvd-panel-link"
                  onClick={() => router.push('/leaves-v2/approvals')}
                >
                  Review <ArrowRight size={13} />
                </button>
              </div>

              <div className="lvd-panel-content">
                {approvals.length === 0 ? (
                  <div className="lvd-panel-empty celebratory">
                    <PartyPopper size={30} className="lvd-celebrate-icon" />
                    <span className="lvd-empty-title">All caught up! 🎉</span>
                    <span className="lvd-empty-sub">No pending leave requests awaiting your decision.</span>
                  </div>
                ) : (
                  <div className="lvd-panel-list">
                    {approvals.slice(0, 5).map((r) => {
                      const initials = (r.userName || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      const reqColor = resolveLeaveColor(r.leaveTypeName, r.leaveTypeColor);
                      return (
                        <div key={r.id} className="lvd-approval-item">
                          <div className="lvd-user-avatar">
                            {r.userAvatarUrl ? (
                              <img src={r.userAvatarUrl} alt={r.userName || ''} className="lvd-avatar-img" />
                            ) : (
                              <div className="lvd-avatar-fallback">{initials}</div>
                            )}
                          </div>
                          <div className="lvd-approval-details">
                            <div className="lvd-approval-title-row">
                              <span className="lvd-approval-name" title={r.userName}>{r.userName || 'Team Member'}</span>
                              <span 
                                className="lvd-leave-type-micro-tag"
                                style={{
                                  color: reqColor,
                                  background: hexToRgba(reqColor, 0.12),
                                  borderColor: hexToRgba(reqColor, 0.28),
                                }}
                              >
                                {r.leaveTypeName}
                              </span>
                            </div>
                            <div className="lvd-approval-meta">
                              <span>{r.totalUnits} {r.totalUnits === 1 ? 'day' : 'days'}</span>
                              <span>•</span>
                              <span>{fmt(r.fromDate)}{r.toDate !== r.fromDate ? ` → ${fmt(r.toDate)}` : ''}</span>
                              {r.reason && (
                                <>
                                  <span>•</span>
                                  <span className="lvd-reason-text" title={r.reason}>"{r.reason}"</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="lvd-approval-action-cell">
                            <button 
                              type="button" 
                              className="lvd-review-action-btn"
                              onClick={() => router.push('/leaves-v2/approvals')}
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <ApplyLeaveDrawer
        open={applyDrawerOpen}
        onClose={() => setApplyDrawerOpen(false)}
        onSuccess={() => load()}
        balances={balances}
        holidaySet={holidaySet}
      />

      <style jsx global>{`
        .lvd { 
          display: flex; 
          flex-direction: column; 
          flex: 1; 
          min-height: 0; 
          overflow-y: auto; 
        }
        .lvd-content-wrap { 
          padding: 0 20px 24px; 
          display: flex; 
          flex-direction: column; 
          flex: 1; 
          min-height: 0; 
        }

        /* ── Header ── */
        .lvd-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 16px; 
          padding: 0 20px 14px; 
          margin-bottom: 16px; 
          border-bottom: 1px solid var(--border-slate-200); 
          flex-wrap: wrap; 
        }
        .lvd-header-about { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          min-width: 0; 
        }
        .lvd-header-title { 
          font-size: 19px; 
          font-weight: 800; 
          color: var(--text-slate-900); 
          letter-spacing: -0.02em; 
        }
        .lvd-header-sub { 
          font-size: 12.5px; 
          color: var(--text-slate-500); 
          margin-top: 2px; 
        }
        .lvd-header-actions { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          flex-wrap: wrap; 
        }
        .lvd-ghost-btn { 
          width: 34px; 
          height: 34px; 
          border-radius: 8px; 
          border: 1px solid var(--border-slate-200); 
          background: var(--bg-slate-50); 
          color: var(--text-slate-700); 
          cursor: pointer; 
          font-size: 14px; 
          transition: all 0.15s ease;
        }
        .lvd-ghost-btn:hover { 
          color: ${PALETTE.blue}; 
          border-color: #bfdbfe; 
          background: #eff6ff;
        }
        [data-theme="dark"] .lvd-header {
          border-bottom-color: #1f2937;
        }
        [data-theme="dark"] .lvd-header-title {
          color: #f1f5f9;
        }
        [data-theme="dark"] .lvd-header-sub {
          color: #94a3b8;
        }
        [data-theme="dark"] .lvd-ghost-btn {
          background: #111720;
          border-color: #1f2937;
          color: #cbd5e1;
        }
        [data-theme="dark"] .lvd-ghost-btn:hover {
          background: #161f2e;
          color: #60a5fa;
          border-color: #2563eb;
        }
        .lvd-add-btn { 
          height: 34px !important; 
          border-radius: 8px !important; 
          font-weight: 600 !important; 
        }

        /* ── Section Title ── */
        .lvd-section-head { 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          gap: 8px; 
          margin: 10px 0 12px; 
        }
        .lvd-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px; 
          font-weight: 700; 
          color: var(--text-slate-800); 
        }
        .lvd-count-chip {
          font-size: 11px;
          font-weight: 600;
          padding: 1px 8px;
          border-radius: 12px;
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-600, #475569);
        }
        .lvd-section-toggle { 
          background: none; 
          border: none; 
          cursor: pointer; 
          font-size: 12px; 
          font-weight: 600; 
          color: #2563eb; 
          transition: opacity 0.15s;
        }
        .lvd-section-toggle:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        [data-theme="dark"] .lvd-section-title-wrap {
          color: #f1f5f9;
        }
        [data-theme="dark"] .lvd-count-chip {
          background: #1e293b;
          color: #94a3b8;
        }
        [data-theme="dark"] .lvd-section-toggle {
          color: #60a5fa;
        }
        [data-theme="dark"] .lvd-empty-card {
          background: #111720;
          border-color: #1f2937;
        }

        /* ── 1. Department Cards Style (Matching Image) ── */
        .dept-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
          align-items: stretch;
        }
        @media (max-width: 1200px) {
          .dept-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dept-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .dept-card {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          background: var(--bg-pure-white, #ffffff);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 148px;
          min-height: 148px;
          max-height: 148px;
          cursor: default;
          position: relative;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          text-align: left;
          box-sizing: border-box;
          overflow: hidden;
        }

        [data-theme="dark"] .dept-card {
          background: #111720 !important;
          border-color: #1f2937 !important;
        }

        .dept-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .dept-card-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--dept-bg);
          color: var(--dept-color);
          border: 1px solid transparent;
        }
        .dept-card-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2.5px 9px;
          border-radius: 20px;
          letter-spacing: 0.02em;
          line-height: 1.2;
          background: var(--dept-bg);
          color: var(--dept-color);
          border: 1px solid transparent;
        }

        [data-theme="dark"] .dept-card-icon {
          background: var(--dept-dark-bg, rgba(255, 255, 255, 0.06)) !important;
          color: var(--dept-color) !important;
          border-color: var(--dept-dark-border, rgba(255, 255, 255, 0.12)) !important;
        }
        [data-theme="dark"] .dept-card-badge {
          background: var(--dept-dark-bg, rgba(255, 255, 255, 0.06)) !important;
          color: var(--dept-color) !important;
          border-color: var(--dept-dark-border, rgba(255, 255, 255, 0.12)) !important;
        }

        .dept-card-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          justify-content: center;
          min-height: 0;
          overflow: hidden;
        }
        .dept-card-title {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
        }
        [data-theme="dark"] .dept-card-title {
          color: #f1f5f9;
        }
        .dept-card-desc {
          font-size: 11.5px;
          color: var(--text-slate-500, #64748b);
          margin: 1px 0 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .dept-card-desc {
          color: #94a3b8;
        }
        .dept-card-progress-track {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--bg-slate-100, #f1f5f9);
          overflow: hidden;
          margin-top: 5px;
          flex-shrink: 0;
        }
        [data-theme="dark"] .dept-card-progress-track {
          background: #1e293b;
        }
        .dept-card-progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .dept-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100, #f1f5f9);
          margin-top: auto;
          white-space: nowrap;
          overflow: hidden;
          flex-shrink: 0;
          height: 24px;
          box-sizing: border-box;
        }
        [data-theme="dark"] .dept-card-footer {
          border-top-color: #1f2937;
        }
        .dept-card-scope {
          font-size: 11px;
          color: var(--text-slate-400, #94a3b8);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          line-height: 1;
        }
        [data-theme="dark"] .dept-card-scope {
          color: #94a3b8;
        }

        /* ── 2. Enhanced Panels Grid ── */
        .lvd-panels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        .lvd-modern-panel {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 14px;
          background: var(--bg-pure-white, #ffffff);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        [data-theme="dark"] .lvd-modern-panel {
          background: #111720 !important;
          border-color: #1f2937 !important;
        }

        .lvd-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          background: var(--bg-slate-50, #f8fafc);
          gap: 12px;
        }
        [data-theme="dark"] .lvd-panel-header {
          background: #0d121a !important;
          border-bottom-color: #1f2937 !important;
        }
        .lvd-panel-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .lvd-panel-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid transparent;
        }
        [data-theme="dark"] .lvd-panel-avatar {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .lvd-panel-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          letter-spacing: -0.01em;
        }
        [data-theme="dark"] .lvd-panel-title {
          color: #f1f5f9;
        }
        .lvd-panel-sub {
          font-size: 11.5px;
          color: var(--text-slate-500, #64748b);
          margin: 1px 0 0;
        }
        [data-theme="dark"] .lvd-panel-sub {
          color: #94a3b8;
        }
        .lvd-panel-link {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .lvd-panel-link:hover {
          color: #1d4ed8;
          transform: translateX(2px);
        }
        [data-theme="dark"] .lvd-panel-link {
          color: #60a5fa;
        }
        [data-theme="dark"] .lvd-panel-link:hover {
          color: #93c5fd;
        }

        .lvd-panel-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .lvd-panel-list {
          display: flex;
          flex-direction: column;
        }

        /* ── Upcoming Holidays Items ── */
        .lvd-holiday-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          transition: background 0.15s ease;
        }
        .lvd-holiday-item:last-child {
          border-bottom: none;
        }
        .lvd-holiday-item:hover {
          background: var(--bg-slate-50, #f8fafc);
        }
        [data-theme="dark"] .lvd-holiday-item {
          border-bottom-color: #1f2937;
        }
        [data-theme="dark"] .lvd-holiday-item:hover {
          background: #161f2e;
        }

        .lvd-date-badge {
          width: 44px;
          height: 46px;
          border-radius: 10px;
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          line-height: 1;
        }
        [data-theme="dark"] .lvd-date-badge {
          background: rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.25);
        }
        [data-theme="dark"] .lvd-date-month {
          color: #a78bfa;
        }
        [data-theme="dark"] .lvd-date-day {
          color: #c4b5fd;
        }
        .lvd-date-month {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: #7c3aed;
          letter-spacing: 0.05em;
        }
        .lvd-date-day {
          font-size: 16px;
          font-weight: 800;
          color: #7c3aed;
          margin-top: 2px;
        }

        .lvd-holiday-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lvd-holiday-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lvd-holiday-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-900, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .lvd-holiday-title {
          color: #f1f5f9;
        }
        .lvd-away-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 10px;
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-600, #475569);
          white-space: nowrap;
        }
        [data-theme="dark"] .lvd-away-chip {
          background: #1e293b;
          color: #94a3b8;
        }
        .lvd-away-chip.is-urgent {
          background: #fef3c7;
          color: #b45309;
        }
        [data-theme="dark"] .lvd-away-chip.is-urgent {
          background: rgba(217, 119, 6, 0.2);
          color: #fbbf24;
        }

        .lvd-holiday-meta {
          font-size: 11px;
          color: var(--text-slate-400, #94a3b8);
        }
        [data-theme="dark"] .lvd-holiday-meta {
          color: #94a3b8;
        }
        .lvd-holiday-tag-cell {
          flex-shrink: 0;
        }
        .lvd-chip-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
        }
        .lvd-chip-pill.chip-national {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        [data-theme="dark"] .lvd-chip-pill.chip-national {
          background: rgba(5, 150, 105, 0.15);
          color: #34d399;
          border-color: rgba(5, 150, 105, 0.3);
        }
        .lvd-chip-pill.chip-default {
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-600, #475569);
          border: 1px solid var(--border-slate-200, #e2e8f0);
        }
        [data-theme="dark"] .lvd-chip-pill.chip-default {
          background: #1e293b;
          color: #94a3b8;
          border-color: #334155;
        }

        /* ── My Recent Requests Items ── */
        .lvd-request-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          transition: background 0.15s ease;
        }
        .lvd-request-item:last-child {
          border-bottom: none;
        }
        .lvd-request-item:hover {
          background: var(--bg-slate-50, #f8fafc);
        }
        [data-theme="dark"] .lvd-request-item {
          border-bottom-color: #1f2937;
        }
        [data-theme="dark"] .lvd-request-item:hover {
          background: #161f2e;
        }

        .lvd-leave-type-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        [data-theme="dark"] .lvd-leave-type-icon-box {
          background: var(--req-dark-bg, rgba(255, 255, 255, 0.06)) !important;
          border-color: var(--req-dark-border, rgba(255, 255, 255, 0.12)) !important;
        }
        .lvd-request-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lvd-request-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lvd-request-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-900, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .lvd-request-title {
          color: #f1f5f9;
        }
        .lvd-units-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 10px;
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-700, #334155);
        }
        [data-theme="dark"] .lvd-units-pill {
          background: #1e293b;
          color: #cbd5e1;
        }
        .lvd-request-meta {
          font-size: 11.5px;
          color: var(--text-slate-400, #94a3b8);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        [data-theme="dark"] .lvd-request-meta {
          color: #94a3b8;
        }
        .lvd-mini-chip {
          font-size: 10px;
          font-weight: 600;
          padding: 0 5px;
          border-radius: 4px;
        }
        .lvd-mini-chip.lop {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        [data-theme="dark"] .lvd-mini-chip.lop {
          background: rgba(220, 38, 38, 0.15);
          color: #f87171;
          border-color: rgba(220, 38, 38, 0.3);
        }
        .lvd-mini-chip.portion {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        [data-theme="dark"] .lvd-mini-chip.portion {
          background: rgba(22, 163, 74, 0.15);
          color: #4ade80;
          border-color: rgba(22, 163, 74, 0.3);
        }

        .lvd-status-cell {
          flex-shrink: 0;
        }
        .lvd-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 12px;
        }
        .lvd-status-pill.status-approved {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        [data-theme="dark"] .lvd-status-pill.status-approved {
          background: rgba(5, 150, 105, 0.15);
          color: #34d399;
          border-color: rgba(5, 150, 105, 0.3);
        }
        .lvd-status-pill.status-pending {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        [data-theme="dark"] .lvd-status-pill.status-pending {
          background: rgba(37, 99, 235, 0.15);
          color: #60a5fa;
          border-color: rgba(37, 99, 235, 0.3);
        }
        .lvd-status-pill.status-rejected {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        [data-theme="dark"] .lvd-status-pill.status-rejected {
          background: rgba(220, 38, 38, 0.15);
          color: #f87171;
          border-color: rgba(220, 38, 38, 0.3);
        }
        .lvd-status-pill.status-cancelled {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        [data-theme="dark"] .lvd-status-pill.status-cancelled {
          background: #1e293b;
          color: #94a3b8;
          border-color: #334155;
        }

        /* ── Pending Approvals Items ── */
        .lvd-approval-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          transition: background 0.15s ease;
        }
        .lvd-approval-item:last-child {
          border-bottom: none;
        }
        .lvd-approval-item:hover {
          background: var(--bg-slate-50, #f8fafc);
        }
        [data-theme="dark"] .lvd-approval-item {
          border-bottom-color: #1f2937;
        }
        [data-theme="dark"] .lvd-approval-item:hover {
          background: #161f2e;
        }

        .lvd-user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        .lvd-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .lvd-avatar-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
        }
        .lvd-approval-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lvd-approval-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lvd-approval-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-900, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .lvd-approval-name {
          color: #f1f5f9;
        }
        .lvd-leave-type-micro-tag {
          font-size: 10.5px;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 8px;
          border: 1px solid;
          white-space: nowrap;
        }
        .lvd-approval-meta {
          font-size: 11.5px;
          color: var(--text-slate-400, #94a3b8);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        [data-theme="dark"] .lvd-approval-meta {
          color: #94a3b8;
        }
        .lvd-reason-text {
          font-style: italic;
          color: var(--text-slate-500, #64748b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        [data-theme="dark"] .lvd-reason-text {
          color: #cbd5e1;
        }
        .lvd-approval-action-cell {
          flex-shrink: 0;
        }
        .lvd-review-action-btn {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .lvd-review-action-btn:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        [data-theme="dark"] .lvd-review-action-btn {
          background: rgba(37, 99, 235, 0.15);
          color: #60a5fa;
          border-color: rgba(37, 99, 235, 0.3);
        }
        [data-theme="dark"] .lvd-review-action-btn:hover {
          background: #2563eb;
          color: #ffffff;
        }

        /* ── Empty States ── */
        .lvd-panel-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          text-align: center;
          gap: 6px;
        }
        .lvd-panel-empty.celebratory {
          background: linear-gradient(180deg, transparent, rgba(245, 158, 11, 0.03));
        }
        .lvd-celebrate-icon {
          color: #f59e0b;
          margin-bottom: 4px;
        }
        .lvd-empty-icon {
          margin-bottom: 4px;
        }
        .lvd-empty-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-800, #1e293b);
        }
        [data-theme="dark"] .lvd-empty-title {
          color: #f1f5f9;
        }
        .lvd-empty-sub {
          font-size: 11.5px;
          color: var(--text-slate-400, #94a3b8);
          max-width: 260px;
          line-height: 1.4;
        }
        [data-theme="dark"] .lvd-empty-sub {
          color: #94a3b8;
        }
        .lvd-quick-apply-btn {
          margin-top: 10px;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s ease;
        }
        .lvd-quick-apply-btn:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        [data-theme="dark"] .lvd-quick-apply-btn {
          background: rgba(37, 99, 235, 0.15);
          color: #60a5fa;
          border-color: rgba(37, 99, 235, 0.3);
        }

        @media (max-width: 640px) {
          .lvd-content-wrap {
            padding: 0 12px 20px;
          }
          .lvd-header {
            padding: 0 12px 14px;
          }
        }
      `}</style>
    </div>
  );
}
