'use client';

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined } from '@ant-design/icons';
import { Plane } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import PerformanceReportService, { ReportLeave } from '@/services/performanceReportService';
import LeaveV2Service from '@/services/leaveV2Service';
import { pointsColor } from './moduleScores';
import EmptyState from './EmptyState';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

interface Props {
  userId?: string;
  range: [Dayjs, Dayjs];
}

const norm = (d: string | Date) => dayjs(d).format('YYYY-MM-DD');
const isWeekend = (d: string) => {
  const wd = dayjs(d).day();
  return wd === 0 || wd === 6;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  approved: { label: 'Approved', color: 'green' },
  pending: { label: 'Pending', color: 'gold' },
  rejected: { label: 'Rejected', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

const PORTION_LABEL: Record<string, string> = {
  full: 'Full day',
  first_half: 'First half',
  second_half: 'Second half',
};

const fmtUnits = (n: number) => `${Number(n.toFixed(2))}`;

// Leaves section of the report (Leave Management 2.0). Shows leave days taken,
// the paid vs LOP split, and pending requests for the applied filters.
export default function LeavesSection({ userId, range }: Props) {
  const [rows, setRows] = useState<ReportLeave[]>([]);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, hol] = await Promise.all([
          PerformanceReportService.getLeaveReport({
            from: range[0].format('YYYY-MM-DD'),
            to: range[1].format('YYYY-MM-DD'),
            memberId: userId || undefined,
          }),
          LeaveV2Service.getLeaveHolidayDates().catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        setRows(data);
        setHolidays(new Set((hol || []).map((d) => norm(d))));
      } catch (err: any) {
        if (!cancelled)
          message.error(err?.response?.data?.error || err?.message || 'Failed to load leaves');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, range[0]?.valueOf(), range[1]?.valueOf()]);

  // Working days in the range (weekdays minus government holidays) — the basis
  // LOP days are measured against.
  const workingDays = useMemo(() => {
    let cur = range[0].startOf('day');
    const end = range[1].startOf('day');
    let count = 0;
    let guard = 0;
    while ((cur.isSame(end) || cur.isBefore(end)) && guard++ < 400) {
      const d = cur.format('YYYY-MM-DD');
      if (!isWeekend(d) && !holidays.has(d)) count += 1;
      cur = cur.add(1, 'day');
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range[0]?.valueOf(), range[1]?.valueOf(), holidays]);

  const stats = useMemo(() => {
    const requests = rows.length;
    const approved = rows.filter((r) => r.status === 'approved');
    const pending = rows.filter((r) => r.status === 'pending').length;
    const leaveDays = approved.reduce((s, r) => s + (r.totalUnits || 0), 0);
    const paidDays = approved.reduce((s, r) => s + (r.paidUnits || 0), 0);
    const lopDays = approved.reduce((s, r) => s + (r.lopUnits || 0), 0);
    // Members the LOP is spread across (1 when filtered to a member).
    const members = userId ? 1 : Math.max(1, new Set(rows.map((r) => r.userId)).size);
    // Score: ONLY Loss-of-Pay reduces it. Paid/approved leave stays at 100. Each
    // LOP day costs its share of the working month; no LOP → 100.
    const denom = workingDays * members;
    const score = denom > 0 ? Math.max(0, Math.round(100 - (lopDays / denom) * 100)) : 100;
    return { requests, pending, leaveDays, paidDays, lopDays, score, approved: approved.length };
  }, [rows, workingDays, userId]);

  const rangeLabel = `${range[0].format('MMM D')} – ${range[1].format('MMM D, YYYY')}`;

  const columns: ColumnsType<ReportLeave> = [
    {
      title: 'Member',
      key: 'member',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={28} style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', fontSize: 12, fontWeight: 700 }}>
            {r.userName?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-900)' }}>
            {r.userName || '—'}
          </span>
        </div>
      ),
    },
    {
      title: 'Leave Type',
      key: 'type',
      render: (_, r) => <span style={{ fontWeight: 600 }}>{r.leaveTypeName || '—'}</span>,
    },
    { title: 'From', key: 'from', width: 110, render: (_, r) => dayjs(r.fromDate).format('MMM D') },
    { title: 'To', key: 'to', width: 110, render: (_, r) => dayjs(r.toDate).format('MMM D') },
    {
      title: 'Portion',
      key: 'portion',
      width: 110,
      render: (_, r) => <span style={{ color: 'var(--text-slate-500)' }}>{PORTION_LABEL[r.dayPortion] || r.dayPortion}</span>,
    },
    {
      title: 'Days',
      key: 'days',
      width: 70,
      render: (_, r) => <strong>{fmtUnits(r.totalUnits)}</strong>,
    },
    {
      title: 'LOP',
      key: 'lop',
      width: 70,
      render: (_, r) =>
        r.lopUnits > 0 ? (
          <span style={{ color: '#dc2626', fontWeight: 700 }}>{fmtUnits(r.lopUnits)}</span>
        ) : (
          <span style={{ color: 'var(--text-slate-400)' }}>—</span>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, r) => {
        const m = STATUS_META[r.status] || { label: r.status, color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="prr-center">
        <ZukvoLoader size="md" message="Loading leaves…" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        accent="#10B981"
        icon={<Plane size={28} />}
        title="No leaves taken"
        subtitle="No leave was requested in this window — a clean record. Leave usage and any loss-of-pay will appear here."
      />
    );
  }

  return (
    <div className="prr-lv">
      <div className="prr-statbar">
        <div className="prr-stat prr-stat--points">
          <div className="prr-stat-top">
            <span className="prr-stat-num" style={{ color: pointsColor(stats.score) }}>
              {stats.score}
            </span>
            <span className="prr-pts-max">/ 100</span>
          </div>
          <div className="prr-stat-label">Avg points</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{fmtUnits(stats.leaveDays)}</span>
            <span className="prr-pts-max">days</span>
          </div>
          <div className="prr-stat-label">Leave days (approved)</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{fmtUnits(stats.paidDays)}</span>
            <span className="prr-pct prr-pct--green">paid</span>
          </div>
          <div className="prr-stat-label">Paid days</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{fmtUnits(stats.lopDays)}</span>
            <span className="prr-pct prr-pct--red">LOP</span>
          </div>
          <div className="prr-stat-label">Loss of pay</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{stats.requests}</span>
          </div>
          <div className="prr-stat-label">Requests</div>
        </div>
        <div className="prr-stat">
          <div className="prr-stat-top">
            <span className="prr-stat-num">{stats.pending}</span>
            <span className="prr-pct prr-pct--amber">pending</span>
          </div>
          <div className="prr-stat-label">Pending</div>
        </div>
        <div className="prr-statbar-caption">
          <CalendarOutlined style={{ color: 'var(--text-slate-400)' }} />
          {rangeLabel}
        </div>
      </div>

      <ZukvoLoadingOverlay loading={loading} message="">
          <Table
                  rowKey="id"
                  size="small"
                  columns={columns}
                  dataSource={rows}
                  pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
                  scroll={{ x: 820 }} locale={{ emptyText: <NoData /> }}
                />
          </ZukvoLoadingOverlay>
    </div>
  );
}
