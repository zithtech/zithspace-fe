'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Drawer,
  Form,
  Input,
  DatePicker,
  App,
  Tooltip,
  Row,
  Col,
  Space,
} from 'antd';
import { Menu } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  WarningOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  StopOutlined,
  EditOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LeaveV2Service, {
  ApplyLeaveInput,
  DayPortion,
  LeaveBalanceItem,
  LeaveRequest,
} from '@/services/leaveV2Service';
import { drawerFormStyles as formStyles, SectionCard } from "@/components/common/DrawerSection";
import ApplyLeaveDrawer from './ApplyLeaveDrawer';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)' } as const;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const DAY_PORTION_OPTIONS: { value: DayPortion; label: string }[] = [
  { value: 'full', label: 'Full day' },
  { value: 'first_half', label: 'First half' },
  { value: 'second_half', label: 'Second half' },
];

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: 'Pending' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  cancelled: { color: 'default', label: 'Cancelled' },
  withdrawn: { color: 'orange', label: 'Withdrawn' },
};



// Working-day units (mirrors the server): excludes weekends AND holidays.
function computeUnits(from: Dayjs | null, to: Dayjs | null, portion: DayPortion, holidays: Set<string>): number {
  if (!from || !to) return 0;
  const iso = (d: Dayjs) => d.format('YYYY-MM-DD');
  if (portion !== 'full') {
    const dow = from.day();
    if (dow === 0 || dow === 6 || holidays.has(iso(from))) return 0; // working, non-holiday day only
    return 0.5;
  }
  let u = 0;
  let d = from.startOf('day');
  const end = to.startOf('day');
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    const dow = d.day();
    if (dow !== 0 && dow !== 6 && !holidays.has(iso(d))) u += 1;
    d = d.add(1, 'day');
  }
  return u;
}

export default function ApplyLeavePanel({ hideSidebarToggle }: { hideSidebarToggle?: boolean } = {}) {
  const { canReadLeave, canCreateLeave, canUpdateLeave, canReadMyHubApplyLeave } = usePermission();
  console.log("Forcing HMR reload for ApplyLeavePanel");
  const { message } = App.useApp(); // contextual toasts (static `message` ignores the <App> holder)

  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [holidaySet, setHolidaySet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  // drawer
  const [open, setOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

  // withdrawal drawer (release unused days of a multi-day approved leave)
  const [wOpen, setWOpen] = useState(false);
  const [wSaving, setWSaving] = useState(false);
  const [wRequest, setWRequest] = useState<LeaveRequest | null>(null);
  const [wRange, setWRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [wReason, setWReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, h] = await Promise.all([LeaveV2Service.getMyBalances(), LeaveV2Service.getMyRequests(), LeaveV2Service.getLeaveHolidayDates()]);
      setBalances(b);
      setRequests(r);
      setHolidaySet(new Set(h));
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message ||'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadLeave || canReadMyHubApplyLeave) load();
  }, [canReadLeave, canReadMyHubApplyLeave, load]);

  const openApply = () => {
    setEditingRequest(null);
    setOpen(true);
  };

  const openEdit = (r: LeaveRequest) => {
    setEditingRequest(r);
    setOpen(true);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const available = balances.reduce((s, b) => s + b.available, 0);
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const lop = requests.filter((r) => r.status !== 'rejected' && r.status !== 'cancelled').reduce((s, r) => s + r.lopUnits, 0);
    return { available, pending, approved, lop };
  }, [balances, requests]);

  const statCells = [
    { key: 'avail', title: 'Available', value: stats.available, period: 'days left', icon: <WalletOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'pending', title: 'Pending', value: stats.pending, period: 'requests', icon: <ClockCircleOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'approved', title: 'Approved', value: stats.approved, period: 'requests', icon: <CheckCircleOutlined />, color: PALETTE.grey, tint: TINT.grey },
    { key: 'lop', title: 'Loss of Pay', value: stats.lop, period: 'days', icon: <WarningOutlined />, color: PALETTE.red, tint: TINT.red },
  ];

  // ── Filtering + paging ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (q && !(r.leaveTypeName || '').toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [requests, search, statusFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const paged = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  useEffect(() => { setTablePage(1); }, [search, statusFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);

  const hasFilters = !!search || statusFilter !== 'all';

  const cancelRequest = async (r: LeaveRequest) => {
    try {
      await LeaveV2Service.cancelRequest(r.id);
      message.success('Request cancelled');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message ||'Failed to cancel');
    }
  };

  // ── Withdrawal (release unused days of an approved leave) ─────────────────────
  // A single-day leave has nothing to split → a plain confirm releases it whole.
  const isSingleDayReq = (r: LeaveRequest) => r.fromDate === r.toDate;

  const openWithdraw = (r: LeaveRequest) => {
    setWRequest(r);
    setWRange(null);
    setWReason('');
    setWOpen(true);
  };

  // The employee picks the FIRST unused day; everything from there to the leave's
  // end is released (a tail). So the effective withdraw range is [start, toDate].
  const wStart = wRange?.[0] ?? null;

  // Mirrors the server plan: release LOP days first (no balance impact), so only
  // released PAID days are credited back to the balance.
  const wPlan = useMemo(() => {
    if (!wRequest || !wStart) return null;
    const from = dayjs(wRequest.fromDate);
    const to = dayjs(wRequest.toDate);
    // Days actually kept = [from, dayBeforeStart]; 0 if withdrawing from day one.
    const keptEnd = wStart.subtract(1, 'day');
    const fullRelease = keptEnd.isBefore(from, 'day');
    const actualUnits = fullRelease ? 0 : computeUnits(from, keptEnd, 'full', holidaySet);
    const releasedTotal = Number((wRequest.totalUnits - actualUnits).toFixed(2));
    const releasedLop = Math.min(Math.max(releasedTotal, 0), wRequest.lopUnits);
    const releasedPaid = Number((Math.max(releasedTotal, 0) - releasedLop).toFixed(2));
    return { fullRelease, actualUnits, releasedTotal, releasedLop, releasedPaid, withdrawFrom: wStart, withdrawTo: to };
  }, [wRequest, wStart, holidaySet]);

  const wBlockReason: string | null =
    !wRequest
      ? null
      : !wStart
      ? 'Select the days you want to withdraw'
      : !wPlan || wPlan.releasedTotal <= 0
      ? 'These dates release no leave days'
      : null;

  // Submit a withdrawal request. `full` = release the whole leave (single-day or
  // withdrawing from day one); otherwise shorten to keep everything before wStart.
  const submitWithdraw = async (r: LeaveRequest, full: boolean) => {
    setWSaving(true);
    try {
      const payload =
        full || !wStart
          ? { releaseAll: true, reason: wReason.trim() || null }
          : { newToDate: wStart.subtract(1, 'day').format('YYYY-MM-DD'), reason: wReason.trim() || null };
      await LeaveV2Service.withdrawRequest(r.id, payload);
      message.success('Withdrawal request sent to your manager');
      setWOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message ||'Failed to submit withdrawal');
    } finally {
      setWSaving(false);
    }
  };

  const fmt = (d: string) => dayjs(d).format('MMM D, YYYY');

  const WITHDRAWAL_LABEL: Record<string, string> = { requested: 'Awaiting manager', confirmed: 'Confirmed', declined: 'Declined' };

  // Detail fields that don't fit the compact row live in the expandable child row.
  const expandedRow = (r: LeaveRequest) => (
    <div className="lva-detail">
      <div className="lva-detail-item">
        <span className="lva-detail-label">Paid / LOP</span>
        <span>
          <Tag color="green">{r.paidUnits} paid</Tag>
          {r.lopUnits > 0 && <Tag color="red">{r.lopUnits} LOP</Tag>}
        </span>
      </div>
      {typeof r.actualUnits === 'number' && (
        <div className="lva-detail-item">
          <span className="lva-detail-label">Actually taken</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-slate-700)', fontWeight: 600 }}>{r.actualUnits} day(s)</span>
        </div>
      )}
      {r.withdrawalStatus && (
        <div className="lva-detail-item">
          <span className="lva-detail-label">Withdrawal</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-slate-600)' }}>
            {WITHDRAWAL_LABEL[r.withdrawalStatus] ?? r.withdrawalStatus}
            {r.withdrawalRequestedUnits != null && ` · ${r.withdrawalRequestedUnits} day(s)`}
            {r.withdrawalNewToDate ? ` · shorten to ${fmt(r.withdrawalNewToDate)}` : ''}
          </span>
        </div>
      )}
      <div className="lva-detail-item" style={{ flex: 1 }}>
        <span className="lva-detail-label">Reason</span>
        <span style={{ fontSize: 12.5, color: r.reason ? 'var(--text-slate-600)' : 'var(--text-slate-400)' }}>{r.reason || 'No reason provided'}</span>
      </div>
    </div>
  );

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'Leave Type',
      key: 'lt',
      render: (_, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: r.leaveTypeColor || PALETTE.grey, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.leaveTypeName}</span>
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
      title: 'Status',
      key: 'status',
      render: (_, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Tag color={STATUS_TAG[r.status]?.color}>{STATUS_TAG[r.status]?.label ?? r.status}</Tag>
          {r.withdrawalStatus === 'requested' && (
            <Tooltip title={`Withdrawal of ${r.withdrawalRequestedUnits ?? ''} day(s) awaiting your manager`}>
              <Tag color="orange" style={{ marginInlineEnd: 0 }}>Withdrawal pending</Tag>
            </Tooltip>
          )}
        </span>
      ),
    },
    { title: 'Applied', dataIndex: 'createdAt', key: 'createdAt', render: (v) => <span style={{ color: 'var(--text-slate-500)' }}>{fmt(v)}</span> },
    {
      title: '',
      key: 'actions',
      width: 70,
      align: 'right',
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space size="small">
            {canUpdateLeave && (
              <Tooltip title="Edit">
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
              </Tooltip>
            )}
            <ConfirmDialog
              tone="danger"
              icon={<StopOutlined />}
              title="Cancel this request?"
              description={`Your ${r.leaveTypeName} request will be withdrawn.`}
              confirmText="Cancel request"
              cancelText="Keep"
              placement="bottomRight"
              onConfirm={() => cancelRequest(r)}
            >
              <Tooltip title="Cancel"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </ConfirmDialog>
          </Space>
        ) : r.status === 'approved' && (!r.withdrawalStatus || r.withdrawalStatus === 'declined') ? (
          isSingleDayReq(r) ? (
            <ConfirmDialog
              tone="primary"
              icon={<RollbackOutlined />}
              title="Withdraw this leave?"
              description={`Your ${r.leaveTypeName} on ${fmt(r.fromDate)} will be released for your manager to confirm.`}
              confirmText="Request withdrawal"
              cancelText="Keep"
              placement="bottomRight"
              onConfirm={() => submitWithdraw(r, true)}
            >
              <Tooltip title="Withdraw leave"><Button type="text" size="small" icon={<RollbackOutlined />} style={{ color: PALETTE.blue }} /></Tooltip>
            </ConfirmDialog>
          ) : (
            <Tooltip title="Withdraw / release unused days">
              <Button type="text" size="small" icon={<RollbackOutlined />} style={{ color: PALETTE.blue }} onClick={() => openWithdraw(r)} />
            </Tooltip>
          )
        ) : null,
    },
  ];

  if (!canReadLeave && !canReadMyHubApplyLeave) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view leave.</div>;
  }

  return (
    <div className="lva">
      {/* HEADER */}
      <div className="lva-header">
        <div className="lva-header-about">
          {!hideSidebarToggle && (
            <button 
              type="button"
              className="lv-mobile-menu-btn" 
              onClick={() => window.dispatchEvent(new Event('open-lv-sidebar'))}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="lva-header-icon"><WalletOutlined /></div>
          <div>
            <div className="lva-header-title">Apply Leave</div>
            <div className="lva-header-sub">Request time off against your balance</div>
          </div>
        </div>
        <div className="lva-header-actions">
          <div className="lva-search-wrap">
            <SearchOutlined className="lva-search-icon" />
            <input className="lva-search" placeholder="Search leave type…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="lva-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {(canCreateLeave || canReadMyHubApplyLeave) && <Button type="primary" icon={<PlusOutlined />} onClick={openApply} className="lva-add-btn">Apply Leave</Button>}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="lva-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lva-stat-card">
            <div className="lva-stat-top">
              <span className="lva-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="lva-stat-label">{s.title}</span>
            </div>
            <div className="lva-stat-bottom">
              <span className="lva-stat-value">{s.value}</span>
              <span className="lva-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* BALANCES STRIP */}
      {balances.length > 0 && (
        <div className="lva-balances">
          {balances.map((b) => (
            <div key={b.leaveTypeId} className="lva-bal">
              <span className="lva-bal-dot" style={{ background: b.color || PALETTE.grey }} />
              <span className="lva-bal-name">{b.name}</span>
              <span className="lva-bal-val">{b.available}</span>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="lva-filters">
        <span className="lva-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="lva-filter-dd"
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
            { value: 'withdrawn', label: 'Withdrawn' },
          ]}
          style={{ width: 160 }}
          width={210}
        />
        <span className="lva-filter-count">{filtered.length} of {requests.length}</span>
        {hasFilters && <button type="button" className="lva-clear" onClick={() => { setSearch(''); setStatusFilter('all'); }}><CloseCircleOutlined /> Clear</button>}
      </div>

      {/* TABLE */}
      <div className="lva-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="lva-table"
          loading={loading}
          columns={columns}
          dataSource={paged}
          pagination={false}
          expandable={{ expandedRowRender: expandedRow, expandRowByClick: true, columnWidth: 32 }}
          onRow={() => ({ className: 'lva-row' })}
        />
      </div>

      {total > 0 && (
        <div className="lva-footer lva-footer--sticky">
          <div className="lva-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="lva-pager">
            <button type="button" className="lva-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`lva-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="lva-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <SearchableDropdown className="lva-pagesize" placeholder="" allowClear={false} value={String(tablePageSize)} onChange={(v) => { setTablePageSize(Number(v)); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))} style={{ width: 110, height: 28 }} width={130} />
          </div>
        </div>
      )}

      {/* APPLY DRAWER */}
      <ApplyLeaveDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={load}
        editingRequest={editingRequest}
        balances={balances}
        holidaySet={holidaySet}
      />

      {/* WITHDRAWAL DRAWER */}
      <Drawer
        rootClassName="leave-drawer-root"
        title={null}
        open={wOpen}
        onClose={() => setWOpen(false)}
        width={720}
        closable={false}
        destroyOnClose
        styles={{
          header: { display: 'none' },
          body: { padding: 0, background: 'var(--customers-page-bg)' },
          footer: { padding: 0, border: 'none' },
          wrapper: { boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.08)' },
          mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
        }}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span style={{ fontSize: 11.5, color: wBlockReason ? PALETTE.red : 'var(--text-slate-400)', marginRight: 'auto' }}>
              {wBlockReason ? wBlockReason : 'Sent to your manager for confirmation'}
            </span>
            <Button onClick={() => setWOpen(false)} style={{ borderRadius: 8, height: 36 }}>Cancel</Button>
            <Button
              type="primary"
              loading={wSaving}
              disabled={!!wBlockReason}
              onClick={() => wRequest && submitWithdraw(wRequest, false)}
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              Request Withdrawal
            </Button>
          </div>
        }
      >
        <style>{formStyles}</style>
        {/* HEADER */}
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--bg-blue-50)',
                color: 'var(--text-blue-700)',
                border: '1px solid var(--border-blue-200)',
              }}
            >
              <RollbackOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Withdraw Leave
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {wRequest ? `${wRequest.leaveTypeName} · ${fmt(wRequest.fromDate)}${wRequest.toDate !== wRequest.fromDate ? ` → ${fmt(wRequest.toDate)}` : ''}` : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CloseOutlined />
          </button>
        </div>

        <Form
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          colon={false}
          className="customer-drawer-form"
        >
          <div className="px-6 py-6 space-y-5 pb-24">
            <SectionCard
              icon={<InfoCircleOutlined />}
              title="Days to withdraw"
              subtitle="Pick the unused days — released through the end of the leave"
              step="STEP 1"
            >
                <Form.Item
                  label={
                    <span>
                      Days to withdraw
                      {wRequest && <div style={{ color: 'var(--text-slate-400)', fontWeight: 400, fontSize: 10 }}>leave is {fmt(wRequest.fromDate)} → {fmt(wRequest.toDate)}</div>}
                    </span>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker
                    style={{ width: '100%' }}
                    value={wRange as any}
                    onChange={(v) => setWRange(v as [Dayjs | null, Dayjs | null] | null)}
                    format="MMM D, YYYY"
                    allowEmpty={[false, true]}
                    placeholder={['First day to withdraw', 'End of leave']}
                    disabledDate={(d) => {
                      if (!wRequest) return true;
                      return d.isBefore(dayjs(wRequest.fromDate), 'day') || d.isAfter(dayjs(wRequest.toDate), 'day');
                    }}
                  />
                </Form.Item>

                <Form.Item label="Reason" style={{ marginBottom: 0 }}>
                  <TextArea rows={2} style={{ borderRadius: 8, borderColor: 'var(--border-color)' }} value={wReason} maxLength={500} placeholder="Optional note for your manager" onChange={(e) => setWReason(e.target.value)} />
                </Form.Item>
              </SectionCard>

            {wRequest && wPlan && wPlan.releasedTotal > 0 && (
              <div
                className="customer-drawer-card rounded-none overflow-hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 16px',
                }}
              >
                <div className="lva-preview-row" style={{ fontSize: 13.5 }}>
                  <span style={{ color: PALETTE.blue, fontWeight: 600 }}>
                    <InfoCircleOutlined /> {fmt(wPlan.withdrawFrom.format('YYYY-MM-DD'))} → {fmt(wPlan.withdrawTo.format('YYYY-MM-DD'))}
                  </span>
                  <strong style={{ color: PALETTE.blue }}>Total {wPlan.releasedTotal} day(s)</strong>
                </div>
                <div className="lva-preview-row"><span>You are going to withdraw these days.</span><span /></div>
                <div className="lva-preview-row lva-preview-lop" style={{ borderTop: '1px dashed var(--border-slate-200)', paddingTop: 8, marginTop: 8 }}>
                  <span style={{ color: PALETTE.green }}><WalletOutlined /> Credited back to balance</span>
                  <strong style={{ color: PALETTE.green }}>{wPlan.releasedPaid}</strong>
                </div>
                {wPlan.releasedLop > 0 && (
                  <div className="lva-preview-row"><span style={{ color: 'var(--text-slate-400)' }}>Loss-of-Pay days removed (no balance impact)</span><strong style={{ color: 'var(--text-slate-400)' }}>{wPlan.releasedLop}</strong></div>
                )}
              </div>
            )}
          </div>
        </Form>

      </Drawer>

      <style jsx global>{`
        .lva { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lva-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .lva-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .lva-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.green}; color: ${PALETTE.green}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .lva-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lva-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lva-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .lva-search-wrap { display: flex; align-items: center; height: 34px; width: 220px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .lva-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lva-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lva-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; }
        .lva-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lva-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lva-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .lva-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
        .lva-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lva-stat-top { display: flex; align-items: center; gap: 8px; }
        .lva-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lva-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lva-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .lva-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); }
        .lva-stat-period { font-size: 11px; color: var(--text-slate-400); }
        .lva-balances { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .lva-bal { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--border-slate-200); border-radius: 8px; padding: 5px 10px; background: var(--bg-pure-white); }
        .lva-bal-dot { width: 8px; height: 8px; border-radius: 2px; }
        .lva-bal-name { font-size: 12px; color: var(--text-slate-600); }
        .lva-bal-val { font-size: 13px; font-weight: 800; color: var(--text-slate-900); }
        .lva-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .lva-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .lva-filter-label .anticon { color: var(--text-slate-400); }
        .lva-filter-count { font-size: 12px; color: var(--text-slate-500); }
        .lva-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }
        .lva-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .lva-table, .lva-table.ant-table-wrapper, .lva-table .ant-table, .lva-table .ant-table-container, .lva-table .ant-table-content, .lva-table .ant-table-header, .lva-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .lva-table .ant-table-thead > tr > th,
        .lva-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .lva-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .lva-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lva-table .ant-table-tbody > tr.lva-row:hover > td { background: var(--bg-slate-50) !important; }
        .lva-table .ant-table-expanded-row > td { background: var(--bg-slate-50) !important; padding: 0 !important; }
        .lva-detail { display: flex; flex-wrap: wrap; gap: 10px 40px; padding: 12px 16px 12px 46px; }
        .lva-detail-item { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
        .lva-detail-label { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400); }
        .lva-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .lva-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .lva-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .lva-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .lva-pager { display: flex; align-items: center; gap: 3px; }
        .lva-pager-btn, .lva-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .lva-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lva-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .lva-pagesize { margin-left: 5px; }
        /* drawer */
        .lva-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
        .lva-drawer-form .ant-input, .lva-drawer-form .ant-picker { border-radius: 6px !important; border-color: var(--border-color) !important; }
        .lva-drawer-form .ant-picker { height: 38px; width: 100%; }
        .lva-preview { margin-top: 14px; background: var(--bg-pure-white); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 7px; }
        .lva-preview-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-slate-600); }
        .lva-preview-row strong { font-size: 15px; color: var(--text-slate-900); }
        .lva-preview-lop { border-top: 1px dashed var(--border-slate-200); padding-top: 8px; }
        .lva-preview-lop span { color: ${PALETTE.red}; display: inline-flex; align-items: center; gap: 6px; }

        @media (max-width: 1024px) {
          .lva-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lva-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
