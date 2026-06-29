'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Drawer, Input, InputNumber, DatePicker, message, Tooltip, Row, Col, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  CalculatorOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import LeaveV2Service, {
  AdjustmentKind,
  CreateAdjustmentInput,
  EmployeeOption,
  LeaveAdjustment,
  LeaveTypeV2,
} from '@/services/leaveV2Service';

const { TextArea } = Input;
const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)' } as const;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

// kind → { label, sign } (sign drives the live preview; server is authoritative)
const KINDS: { value: AdjustmentKind; label: string; sign: 1 | -1 }[] = [
  { value: 'credit', label: 'Credit (+)', sign: 1 },
  { value: 'debit', label: 'Debit (−)', sign: -1 },
  { value: 'comp_off', label: 'Comp-off (+)', sign: 1 },
  { value: 'opening', label: 'Opening balance (+)', sign: 1 },
  { value: 'encashment', label: 'Encashment (−)', sign: -1 },
];
const kindSign = (k: AdjustmentKind) => KINDS.find((x) => x.value === k)?.sign ?? 1;

const ENTRY_LABEL: Record<string, string> = {
  adjustment: 'Adjustment',
  credit: 'Comp-off',
  opening: 'Opening',
  encashment: 'Encashment',
  debit: 'Debit',
};

export default function LeaveAdjustmentPanel() {
  const { canReadLeaveAdjustment, canCreateLeaveAdjustment, canDeleteLeaveAdjustment } = usePermission();

  const [rows, setRows] = useState<LeaveAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dirFilter, setDirFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  // drawer
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeV2[]>([]);
  const [employeeId, setEmployeeId] = useState<string>();
  const [leaveTypeId, setLeaveTypeId] = useState<string>();
  const [kind, setKind] = useState<AdjustmentKind>('credit');
  const [amount, setAmount] = useState<number>(1);
  const [effectiveDate, setEffectiveDate] = useState<Dayjs>(dayjs());
  const [reason, setReason] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await LeaveV2Service.listAdjustments());
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadLeaveAdjustment) load();
  }, [canReadLeaveAdjustment, load]);

  // Load drawer option sources once.
  useEffect(() => {
    LeaveV2Service.getAdjustmentEmployees().then(setEmployees).catch(() => {});
    LeaveV2Service.listLeaveTypes(false).then(setLeaveTypes).catch(() => {});
  }, []);

  // Fetch balance when employee + type selected.
  useEffect(() => {
    if (open && employeeId && leaveTypeId) {
      setCurrentBalance(null);
      LeaveV2Service.getAdjustmentBalance(employeeId, leaveTypeId).then(setCurrentBalance).catch(() => setCurrentBalance(null));
    } else {
      setCurrentBalance(null);
    }
  }, [open, employeeId, leaveTypeId]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const credited = rows.filter((r) => r.units > 0).reduce((s, r) => s + r.units, 0);
    const debited = rows.filter((r) => r.units < 0).reduce((s, r) => s + Math.abs(r.units), 0);
    return { total: rows.length, credited, debited, net: credited - debited };
  }, [rows]);

  const statCells = [
    { key: 'total', title: 'Adjustments', value: stats.total, period: 'entries', icon: <CalculatorOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'cr', title: 'Credited', value: stats.credited, period: 'days', icon: <ArrowUpOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'dr', title: 'Debited', value: stats.debited, period: 'days', icon: <ArrowDownOutlined />, color: PALETTE.red, tint: TINT.red },
    { key: 'net', title: 'Net', value: stats.net, period: 'days', icon: <SwapOutlined />, color: PALETTE.grey, tint: TINT.grey },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.userName.toLowerCase().includes(q) && !r.leaveTypeName.toLowerCase().includes(q)) return false;
      if (dirFilter === 'credit' && r.units <= 0) return false;
      if (dirFilter === 'debit' && r.units >= 0) return false;
      return true;
    });
  }, [rows, search, dirFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const paged = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  useEffect(() => { setTablePage(1); }, [search, dirFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);
  const hasFilters = !!search || dirFilter !== 'all';

  // ── Drawer ──────────────────────────────────────────────────────────────────
  const signed = kindSign(kind) * (amount || 0);
  const projected = currentBalance == null ? null : currentBalance + signed;

  const openNew = () => {
    setEmployeeId(undefined);
    setLeaveTypeId(undefined);
    setKind('credit');
    setAmount(1);
    setEffectiveDate(dayjs());
    setReason('');
    setCurrentBalance(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!employeeId) return message.error('Pick an employee');
    if (!leaveTypeId) return message.error('Pick a leave type');
    if (!amount || amount <= 0) return message.error('Enter an amount greater than 0');
    setSaving(true);
    try {
      const payload: CreateAdjustmentInput = {
        employeeId,
        leaveTypeId,
        kind,
        amount,
        effectiveDate: effectiveDate.format('YYYY-MM-DD'),
        reason: reason.trim() || null,
      };
      const res = await LeaveV2Service.createAdjustment(payload);
      message.success(`Adjustment applied — new balance ${res.newBalance}`);
      setOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to apply adjustment');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: LeaveAdjustment) => {
    try {
      const res = await LeaveV2Service.deleteAdjustment(r.id);
      message.success(`Adjustment removed — new balance ${res.newBalance}`);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete adjustment');
      throw err; // keep the confirm popover open on failure
    }
  };

  const fmt = (d: string) => dayjs(d).format('MMM D, YYYY');

  const columns: ColumnsType<LeaveAdjustment> = [
    {
      title: 'User',
      key: 'emp',
      render: (_, r) => (
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.userName}</div>
          {r.userEmail && <div style={{ fontSize: 10.5, color: 'var(--text-slate-400)' }}>{r.userEmail}</div>}
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
    { title: 'Type', dataIndex: 'entryType', key: 'entryType', render: (v) => <Tag>{ENTRY_LABEL[v] ?? v}</Tag> },
    {
      title: 'Amount',
      dataIndex: 'units',
      key: 'units',
      render: (v: number) => <strong style={{ color: v >= 0 ? PALETTE.green : PALETTE.red }}>{v >= 0 ? `+${v}` : v}</strong>,
    },
    { title: 'Note', dataIndex: 'note', key: 'note', render: (v) => <span style={{ color: 'var(--text-slate-600)' }}>{v || '—'}</span> },
    { title: 'Effective', dataIndex: 'effectiveDate', key: 'eff', render: (v) => <span style={{ color: 'var(--text-slate-500)' }}>{fmt(v)}</span> },
    { title: 'Applied', dataIndex: 'createdAt', key: 'createdAt', render: (v) => <span style={{ color: 'var(--text-slate-400)' }}>{fmt(v)}</span> },
    ...(canDeleteLeaveAdjustment ? [{
      title: '',
      key: 'actions',
      width: 48,
      align: 'right' as const,
      render: (_: unknown, r: LeaveAdjustment) => (
        <ConfirmDialog
          tone="danger"
          icon={<DeleteOutlined />}
          title="Delete this adjustment?"
          description={`Reverses ${r.units >= 0 ? `+${r.units}` : r.units} day(s) for ${r.userName} on ${r.leaveTypeName}. The balance is recalculated.`}
          confirmText="Delete"
          placement="bottomRight"
          onConfirm={() => remove(r)}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
        </ConfirmDialog>
      ),
    }] : []),
  ];

  if (!canReadLeaveAdjustment) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view adjustments.</div>;
  }

  return (
    <div className="lvadj">
      <div className="lvadj-header">
        <div className="lvadj-header-about">
          <div className="lvadj-header-icon"><CalculatorOutlined /></div>
          <div>
            <div className="lvadj-header-title">Leave Adjustment</div>
            <div className="lvadj-header-sub">Manually credit or debit an employee’s balance</div>
          </div>
        </div>
        <div className="lvadj-header-actions">
          <div className="lvadj-search-wrap">
            <SearchOutlined className="lvadj-search-icon" />
            <input className="lvadj-search" placeholder="Search employee or type…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="lvadj-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreateLeaveAdjustment && <Button type="primary" icon={<PlusOutlined />} onClick={openNew} className="lvadj-add-btn">New Adjustment</Button>}
        </div>
      </div>

      <div className="lvadj-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvadj-stat-card">
            <div className="lvadj-stat-top">
              <span className="lvadj-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="lvadj-stat-label">{s.title}</span>
            </div>
            <div className="lvadj-stat-bottom">
              <span className="lvadj-stat-value">{s.value}</span>
              <span className="lvadj-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lvadj-filters">
        <span className="lvadj-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="lvadj-filter-dd"
          placeholder="Direction"
          searchPlaceholder="Search"
          itemNoun="directions"
          value={dirFilter === 'all' ? undefined : dirFilter}
          onChange={(v) => setDirFilter((v as any) ?? 'all')}
          options={[{ value: 'credit', label: 'Credits' }, { value: 'debit', label: 'Debits' }]}
          style={{ width: 160 }}
          width={210}
        />
        <span className="lvadj-filter-count">{filtered.length} of {rows.length}</span>
        {hasFilters && <button type="button" className="lvadj-clear" onClick={() => { setSearch(''); setDirFilter('all'); }}><CloseCircleOutlined /> Clear</button>}
      </div>

      <div className="lvadj-table-wrap">
        <Table rowKey="id" size="small" className="lvadj-table" loading={loading} columns={columns} dataSource={paged} pagination={false} onRow={() => ({ className: 'lvadj-row' })} />
      </div>

      {total > 0 && (
        <div className="lvadj-footer lvadj-footer--sticky">
          <div className="lvadj-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="lvadj-pager">
            <button type="button" className="lvadj-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`lvadj-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="lvadj-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <SearchableDropdown className="lvadj-pagesize" placeholder="" allowClear={false} value={String(tablePageSize)} onChange={(v) => { setTablePageSize(Number(v)); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))} style={{ width: 110, height: 28 }} width={130} />
          </div>
        </div>
      )}

      {/* DRAWER */}
      <Drawer
        title={null}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        closable={false}
        destroyOnClose
        styles={{ body: { padding: 0, background: 'var(--bg-pure-white)' }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-pure-white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, background: TINT.blue, color: PALETTE.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><CalculatorOutlined /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>New Adjustment</div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>Credit or debit a balance directly</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setOpen(false)} style={{ color: 'var(--text-slate-500)' }} />
          </div>

          <div className="lvadj-drawer-form" style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
            <div style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-color)', padding: '12px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, background: TINT.blue, color: PALETTE.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><InfoCircleOutlined /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)' }}>Adjustment Details</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)' }}>Who, what and how much</div>
                </div>
              </div>

              <Row gutter={16}>
                <Col span={24} style={{ marginBottom: 14 }}>
                  <span className="lvadj-label">User</span>
                  <div style={{ marginTop: 6 }}>
                    <SearchableDropdown placeholder="Select user" itemNoun="users" allowClear={false} value={employeeId} onChange={(v) => setEmployeeId(v as string)} options={employees.map((e) => ({ value: e.value, label: e.label, description: e.code ?? undefined }))} style={{ width: '100%', height: 38 }} width={300} />
                  </div>
                </Col>
                <Col span={12} style={{ marginBottom: 14 }}>
                  <span className="lvadj-label">Leave type</span>
                  <div style={{ marginTop: 6 }}>
                    <SearchableDropdown placeholder="Select type" itemNoun="leave types" allowClear={false} value={leaveTypeId} onChange={(v) => setLeaveTypeId(v as string)} options={leaveTypes.map((t) => ({ value: t.id, label: t.name }))} style={{ width: '100%', height: 38 }} width={240} />
                  </div>
                </Col>
                <Col span={12} style={{ marginBottom: 14 }}>
                  <span className="lvadj-label">Kind</span>
                  <div style={{ marginTop: 6 }}>
                    <SearchableDropdown placeholder="Kind" itemNoun="kinds" allowClear={false} value={kind} onChange={(v) => setKind(v as AdjustmentKind)} options={KINDS} style={{ width: '100%', height: 38 }} width={220} />
                  </div>
                </Col>
                <Col span={12} style={{ marginBottom: 14 }}>
                  <span className="lvadj-label">Amount (days)</span>
                  <InputNumber style={{ marginTop: 6, width: '100%' }} min={0.5} max={9999} step={0.5} value={amount} onChange={(v) => setAmount(Number(v ?? 0))} />
                </Col>
                <Col span={12} style={{ marginBottom: 14 }}>
                  <span className="lvadj-label">Effective date</span>
                  <DatePicker style={{ marginTop: 6, width: '100%' }} value={effectiveDate} onChange={(d) => d && setEffectiveDate(d)} format="MMM D, YYYY" allowClear={false} />
                </Col>
                <Col span={24}>
                  <span className="lvadj-label">Reason</span>
                  <TextArea rows={2} style={{ marginTop: 6 }} value={reason} maxLength={500} placeholder="e.g. Comp-off for weekend work" onChange={(e) => setReason(e.target.value)} />
                </Col>
              </Row>
            </div>

            {employeeId && leaveTypeId && (
              <div className="lvadj-preview">
                <div className="lvadj-preview-row"><span>Current balance</span><strong>{currentBalance == null ? '…' : currentBalance}</strong></div>
                <div className="lvadj-preview-row"><span>This adjustment</span><strong style={{ color: signed >= 0 ? PALETTE.green : PALETTE.red }}>{signed >= 0 ? `+${signed}` : signed}</strong></div>
                <div className="lvadj-preview-row lvadj-preview-net"><span>New balance</span><strong>{projected == null ? '…' : projected}</strong></div>
              </div>
            )}
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-pure-white)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Space size={10}>
              <Button onClick={() => setOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>Cancel</Button>
              <Button type="primary" loading={saving} icon={<PlusOutlined />} onClick={submit} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>Apply Adjustment</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .lvadj { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lvadj-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .lvadj-header-about { display: flex; align-items: center; gap: 12px; }
        .lvadj-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .lvadj-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvadj-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvadj-header-actions { display: flex; align-items: center; gap: 8px; }
        .lvadj-search-wrap { display: flex; align-items: center; height: 34px; width: 240px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .lvadj-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lvadj-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lvadj-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; }
        .lvadj-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lvadj-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvadj-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .lvadj-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .lvadj-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvadj-stat-top { display: flex; align-items: center; gap: 8px; }
        .lvadj-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lvadj-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lvadj-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .lvadj-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); }
        .lvadj-stat-period { font-size: 11px; color: var(--text-slate-400); }
        .lvadj-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .lvadj-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .lvadj-filter-label .anticon { color: var(--text-slate-400); }
        .lvadj-filter-count { font-size: 12px; color: var(--text-slate-500); }
        .lvadj-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }
        .lvadj-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); overflow: hidden; }
        .lvadj-table .ant-table { background: transparent; font-size: 12px; }
        .lvadj-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important; white-space: nowrap !important; }
        .lvadj-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .lvadj-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lvadj-table .ant-table-tbody > tr.lvadj-row:hover > td { background: var(--bg-slate-50) !important; }
        .lvadj-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .lvadj-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .lvadj-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .lvadj-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .lvadj-pager { display: flex; align-items: center; gap: 3px; }
        .lvadj-pager-btn, .lvadj-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .lvadj-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lvadj-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .lvadj-pagesize { margin-left: 5px; }
        .lvadj-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
        .lvadj-drawer-form .ant-input, .lvadj-drawer-form .ant-input-number, .lvadj-drawer-form .ant-picker { border-radius: 6px !important; border-color: var(--border-color) !important; }
        .lvadj-preview { margin-top: 14px; background: var(--bg-pure-white); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 7px; }
        .lvadj-preview-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-slate-600); }
        .lvadj-preview-row strong { font-size: 15px; color: var(--text-slate-900); }
        .lvadj-preview-net { border-top: 1px dashed var(--border-slate-200); padding-top: 8px; }
        .lvadj-preview-net strong { font-size: 17px; color: ${PALETTE.blue}; }
      `}</style>
    </div>
  );
}
