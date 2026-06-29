'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Avatar, message, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  FilterOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LeaveV2Service, { LeaveRequest } from '@/services/leaveV2Service';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)' } as const;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';
const STATUS_TAG: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: 'Pending' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

const initials = (s?: string) => (s || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function ApprovalsPanel() {
  const { canApproveLeave } = usePermission();

  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await LeaveV2Service.getApprovals());
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canApproveLeave) load();
  }, [canApproveLeave, load]);

  const stats = useMemo(() => ({
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    lop: rows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.lopUnits, 0),
  }), [rows]);

  const statCells = [
    { key: 'pending', title: 'Pending', value: stats.pending, period: 'to review', icon: <ClockCircleOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'approved', title: 'Approved', value: stats.approved, period: 'requests', icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'rejected', title: 'Rejected', value: stats.rejected, period: 'requests', icon: <StopOutlined />, color: PALETTE.red, tint: TINT.red },
    { key: 'lop', title: 'Pending LOP', value: stats.lop, period: 'days', icon: <WarningOutlined />, color: PALETTE.grey, tint: TINT.grey },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !(r.userName || '').toLowerCase().includes(q) && !(r.leaveTypeName || '').toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const paged = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  useEffect(() => { setTablePage(1); }, [search, statusFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);
  const hasFilters = !!search || statusFilter !== 'pending';

  const decide = async (r: LeaveRequest, action: 'approve' | 'reject') => {
    setBusyId(r.id);
    try {
      if (action === 'approve') await LeaveV2Service.approveRequest(r.id);
      else await LeaveV2Service.rejectRequest(r.id);
      message.success(action === 'approve' ? 'Request approved' : 'Request rejected');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (d: string) => dayjs(d).format('MMM D, YYYY');

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'User',
      key: 'emp',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar size={26} style={{ background: TINT.blue, color: PALETTE.blue, fontSize: 11, fontWeight: 700 }}>{initials(r.userName)}</Avatar>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.userName || '—'}</div>
            {r.userEmail && <div style={{ fontSize: 10.5, color: 'var(--text-slate-400)' }}>{r.userEmail}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Leave Type',
      key: 'lt',
      render: (_, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: r.leaveTypeColor || PALETTE.grey, display: 'inline-block' }} />
          {r.leaveTypeName}
        </span>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, r) => (
        <span style={{ color: 'var(--text-slate-600)' }}>
          {fmt(r.fromDate)}{r.toDate !== r.fromDate ? ` → ${fmt(r.toDate)}` : ''}
          {r.dayPortion !== 'full' && <Tag style={{ marginLeft: 6 }}>{r.dayPortion === 'first_half' ? '1st half' : '2nd half'}</Tag>}
        </span>
      ),
    },
    { title: 'Days', dataIndex: 'totalUnits', key: 'days', render: (v) => <strong>{v}</strong> },
    {
      title: 'Paid / LOP',
      key: 'split',
      render: (_, r) => (
        <span>
          <Tag color="green">{r.paidUnits} paid</Tag>
          {r.lopUnits > 0 && <Tag color="red">{r.lopUnits} LOP</Tag>}
        </span>
      ),
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={STATUS_TAG[v]?.color}>{STATUS_TAG[v]?.label ?? v}</Tag> },
    {
      title: '',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, r) =>
        r.status === 'pending' ? (
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <ConfirmDialog
              tone="success"
              icon={<CheckOutlined />}
              title="Approve this request?"
              description={`${r.userName}'s ${r.totalUnits}-day ${r.leaveTypeName}${r.lopUnits > 0 ? ` (${r.lopUnits} day(s) Loss of Pay)` : ''}. Approving debits the balance.`}
              confirmText="Approve"
              placement="bottomRight"
              onConfirm={() => decide(r, 'approve')}
            >
              <Button size="small" type="primary" ghost icon={<CheckOutlined />} loading={busyId === r.id} style={{ borderColor: PALETTE.green, color: PALETTE.green }}>Approve</Button>
            </ConfirmDialog>
            <ConfirmDialog
              tone="danger"
              icon={<CloseOutlined />}
              title="Reject this request?"
              description={`${r.userName}'s ${r.leaveTypeName} request will be rejected.`}
              confirmText="Reject"
              placement="bottomRight"
              onConfirm={() => decide(r, 'reject')}
            >
              <Tooltip title="Reject"><Button size="small" danger icon={<CloseOutlined />} /></Tooltip>
            </ConfirmDialog>
          </div>
        ) : (
          <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>{r.status !== 'cancelled' ? fmt(r.createdAt) : '—'}</span>
        ),
    },
  ];

  if (!canApproveLeave) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to approve leave.</div>;
  }

  return (
    <div className="lvap">
      <div className="lvap-header">
        <div className="lvap-header-about">
          <div className="lvap-header-icon"><CheckCircleOutlined /></div>
          <div>
            <div className="lvap-header-title">Approvals</div>
            <div className="lvap-header-sub">Review and decide on team leave requests</div>
          </div>
        </div>
        <div className="lvap-header-actions">
          <div className="lvap-search-wrap">
            <SearchOutlined className="lvap-search-icon" />
            <input className="lvap-search" placeholder="Search employee or type…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="lvap-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
        </div>
      </div>

      <div className="lvap-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvap-stat-card">
            <div className="lvap-stat-top">
              <span className="lvap-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="lvap-stat-label">{s.title}</span>
            </div>
            <div className="lvap-stat-bottom">
              <span className="lvap-stat-value">{s.value}</span>
              <span className="lvap-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lvap-filters">
        <span className="lvap-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="lvap-filter-dd"
          placeholder="Status"
          searchPlaceholder="Search statuses"
          itemNoun="statuses"
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          style={{ width: 160 }}
          width={210}
        />
        <span className="lvap-filter-count">{filtered.length} of {rows.length}</span>
        {hasFilters && <button type="button" className="lvap-clear" onClick={() => { setSearch(''); setStatusFilter('pending'); }}><CloseCircleOutlined /> Clear</button>}
      </div>

      <div className="lvap-table-wrap">
        <Table rowKey="id" size="small" className="lvap-table" loading={loading} columns={columns} dataSource={paged} pagination={false} onRow={() => ({ className: 'lvap-row' })} />
      </div>

      {total > 0 && (
        <div className="lvap-footer lvap-footer--sticky">
          <div className="lvap-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="lvap-pager">
            <button type="button" className="lvap-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`lvap-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="lvap-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <SearchableDropdown className="lvap-pagesize" placeholder="" allowClear={false} value={String(tablePageSize)} onChange={(v) => { setTablePageSize(Number(v)); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))} style={{ width: 110, height: 28 }} width={130} />
          </div>
        </div>
      )}

      <style jsx global>{`
        .lvap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lvap-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .lvap-header-about { display: flex; align-items: center; gap: 12px; }
        .lvap-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .lvap-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvap-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvap-header-actions { display: flex; align-items: center; gap: 8px; }
        .lvap-search-wrap { display: flex; align-items: center; height: 34px; width: 240px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .lvap-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lvap-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lvap-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; }
        .lvap-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lvap-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvap-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .lvap-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvap-stat-top { display: flex; align-items: center; gap: 8px; }
        .lvap-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lvap-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lvap-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .lvap-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); }
        .lvap-stat-period { font-size: 11px; color: var(--text-slate-400); }
        .lvap-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .lvap-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .lvap-filter-label .anticon { color: var(--text-slate-400); }
        .lvap-filter-count { font-size: 12px; color: var(--text-slate-500); }
        .lvap-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }
        .lvap-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); overflow: hidden; }
        .lvap-table .ant-table { background: transparent; font-size: 12px; }
        .lvap-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important; white-space: nowrap !important; }
        .lvap-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .lvap-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lvap-table .ant-table-tbody > tr.lvap-row:hover > td { background: var(--bg-slate-50) !important; }
        .lvap-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .lvap-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .lvap-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .lvap-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .lvap-pager { display: flex; align-items: center; gap: 3px; }
        .lvap-pager-btn, .lvap-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .lvap-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lvap-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .lvap-pagesize { margin-left: 5px; }
      `}</style>
    </div>
  );
}
