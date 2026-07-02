'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Drawer,
  Form,
  Input,
  Switch,
  Select,
  AutoComplete,
  ColorPicker,
  message,
  Tooltip,
  Row,
  Col,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  AuditOutlined,
  TagsOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LeaveV2Service, {
  CreateLeaveTypeInput,
  LeaveTypeV2,
} from '@/services/leaveV2Service';

const { TextArea } = Input;

// ── Module palette: blue / green / red / grey only ──────────────────────────
const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  grey: '#94A3B8',
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

type UnitFilter = 'all' | 'day' | 'hour';
type PaidFilter = 'all' | 'paid' | 'unpaid';
type StatusFilter = 'all' | 'active' | 'inactive';

// Common leave types used across companies. Selecting one prefills sensible
// defaults; users can also type their own name freely.
interface Suggestion {
  name: string;
  paid: boolean;
  requiresApproval: boolean;
  unit: 'day' | 'hour';
  color: string;
}
const LEAVE_SUGGESTIONS: Suggestion[] = [
  { name: 'Annual Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.blue },
  { name: 'Sick Leave', paid: true, requiresApproval: false, unit: 'day', color: PALETTE.red },
  { name: 'Casual Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.blue },
  { name: 'Earned Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.green },
  { name: 'Privilege Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.green },
  { name: 'Maternity Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.green },
  { name: 'Paternity Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.green },
  { name: 'Parental Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.green },
  { name: 'Bereavement Leave', paid: true, requiresApproval: false, unit: 'day', color: PALETTE.grey },
  { name: 'Compensatory Off', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.blue },
  { name: 'Work From Home', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.blue },
  { name: 'Marriage Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.green },
  { name: 'Study Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.blue },
  { name: 'Unpaid Leave', paid: false, requiresApproval: true, unit: 'day', color: PALETTE.grey },
  { name: 'Loss of Pay', paid: false, requiresApproval: true, unit: 'day', color: PALETTE.grey },
  { name: 'Sabbatical Leave', paid: false, requiresApproval: true, unit: 'day', color: PALETTE.grey },
  { name: 'Menstrual Leave', paid: true, requiresApproval: false, unit: 'day', color: PALETTE.red },
  { name: 'Jury Duty Leave', paid: true, requiresApproval: true, unit: 'day', color: PALETTE.grey },
];

// "Sick Leave" → "SICK_LEAVE"
const slugifyCode = (name: string): string =>
  (name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

const fieldLabel = (t: string) => (
  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>{t}</span>
);

// Section card — matches the ProjectFormDrawer pattern (icon chip + title +
// subtitle + STEP pill, wrapping its fields in a square white card).
function SectionCard({
  icon,
  tint,
  color,
  title,
  subtitle,
  step,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  title: string;
  subtitle: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-pure-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 0,
        padding: '12px 22px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            background: tint,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
            {title}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--bg-secondary, #f1f5f9)',
            color: 'var(--text-slate-500)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {step}
        </span>
      </div>
      {children}
    </div>
  );
}

// Smooth area sparkline — identical to the Proposals stat cards.
const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `lvtspk-${color.replace(/[^a-z0-9]/gi, '')}`;
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

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

// Decorative sparkline shapes (no leave-type time-series exists yet).
const TRENDS: Record<string, number[]> = {
  total: [3, 5, 4, 6, 7, 6, 8],
  active: [2, 3, 3, 4, 5, 6, 7],
  paid: [4, 4, 5, 5, 6, 6, 7],
  approval: [1, 2, 2, 3, 3, 4, 5],
};

// Leave Type panel — mirrors the Proposal main-page right-side structure:
//   1) Header (about + search + add)   2) Stat cards   3) Filters   4) Table
export default function LeaveTypePanel() {
  const {
    canReadLeaveType,
    canCreateLeaveType,
    canUpdateLeaveType,
    canDeleteLeaveType,
  } = usePermission();

  const [rows, setRows] = useState<LeaveTypeV2[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('all');
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeV2 | null>(null);
  const [saving, setSaving] = useState(false);
  const [color, setColor] = useState<string>(PALETTE.blue);
  const [codeTouched, setCodeTouched] = useState(false);
  const [form] = Form.useForm<CreateLeaveTypeInput>();

  // Fetch ALL types once (incl. inactive); filter in-memory for instant UX.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LeaveV2Service.listLeaveTypes(true);
      setRows(data);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadLeaveType) load();
  }, [canReadLeaveType, load]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.isActive).length;
    const paid = rows.filter((r) => r.isPaid).length;
    const approval = rows.filter((r) => r.requiresApproval).length;
    return { total, active, paid, approval };
  }, [rows]);

  const statCells = [
    { key: 'total', title: 'Total Types', value: stats.total, period: 'configured', icon: <TagsOutlined />, color: PALETTE.blue, tint: TINT.blue, trend: TRENDS.total },
    { key: 'active', title: 'Active', value: stats.active, period: `of ${stats.total}`, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green, trend: TRENDS.active },
    { key: 'paid', title: 'Paid', value: stats.paid, period: `of ${stats.total}`, icon: <DollarOutlined />, color: PALETTE.grey, tint: TINT.grey, trend: TRENDS.paid },
    { key: 'approval', title: 'Needs Approval', value: stats.approval, period: `of ${stats.total}`, icon: <AuditOutlined />, color: PALETTE.red, tint: TINT.red, trend: TRENDS.approval },
  ];

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      if (unitFilter !== 'all' && r.unit !== unitFilter) return false;
      if (paidFilter === 'paid' && !r.isPaid) return false;
      if (paidFilter === 'unpaid' && r.isPaid) return false;
      if (statusFilter === 'active' && !r.isActive) return false;
      if (statusFilter === 'inactive' && r.isActive) return false;
      return true;
    });
  }, [rows, search, unitFilter, paidFilter, statusFilter]);

  const hasActiveFilters =
    !!search || unitFilter !== 'all' || paidFilter !== 'all' || statusFilter !== 'active';

  const clearFilters = () => {
    setSearch('');
    setUnitFilter('all');
    setPaidFilter('all');
    setStatusFilter('active');
  };

  // ── Pagination (sticky footer, proposal-style) ────────────────────────────
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const pagedRows = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  // Reset to first page on filter/search/page-size change.
  useEffect(() => {
    setTablePage(1);
  }, [search, unitFilter, paidFilter, statusFilter, tablePageSize]);

  // Clamp current page if rows shrink (e.g. after a delete).
  useEffect(() => {
    if (tablePage > pageCount) setTablePage(pageCount);
  }, [pageCount, tablePage]);

  // ── Drawer handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setCodeTouched(false);
    setColor(PALETTE.blue);
    form.resetFields();
    form.setFieldsValue({ unit: 'day', isPaid: true, requiresApproval: true, isActive: true });
    setDrawerOpen(true);
  };

  const openEdit = (record: LeaveTypeV2) => {
    setEditing(record);
    setCodeTouched(true); // code is locked on edit anyway
    setColor(record.color || PALETTE.blue);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      unit: record.unit,
      isPaid: record.isPaid,
      requiresApproval: record.requiresApproval,
      description: record.description ?? undefined,
      isActive: record.isActive,
    });
    setDrawerOpen(true);
  };

  // Pick a suggestion → prefill name + defaults; code auto-derives via onValuesChange.
  const applySuggestion = (name: string) => {
    const s = LEAVE_SUGGESTIONS.find((x) => x.name === name);
    if (!s) return;
    setColor(s.color);
    form.setFieldsValue({
      isPaid: s.paid,
      requiresApproval: s.requiresApproval,
      unit: s.unit,
    });
  };

  const submit = async () => {
    let values: CreateLeaveTypeInput;
    try {
      values = await form.validateFields();
    } catch {
      return; // form validation error
    }
    setSaving(true);
    try {
      const payload = { ...values, color };
      if (editing) {
        await LeaveV2Service.updateLeaveType(editing.id, payload);
        message.success('Leave type updated');
      } else {
        await LeaveV2Service.createLeaveType(payload);
        message.success('Leave type created');
      }
      setDrawerOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save leave type');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: LeaveTypeV2) => {
    try {
      await LeaveV2Service.deleteLeaveType(record.id);
      message.success('Leave type deleted');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete leave type');
    }
  };

  const columns: ColumnsType<LeaveTypeV2> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color || PALETTE.grey, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (v) => (v === 'hour' ? 'Hourly' : 'Daily') },
    { title: 'Paid', dataIndex: 'isPaid', key: 'isPaid', render: (v) => (v ? <Tag color="green">Paid</Tag> : <Tag>Unpaid</Tag>) },
    { title: 'Approval', dataIndex: 'requiresApproval', key: 'requiresApproval', render: (v) => (v ? <Tag color="blue">Required</Tag> : <Tag>Auto</Tag>) },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '',
      key: 'actions',
      width: 90,
      align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdateLeaveType && (
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
          )}
          {canDeleteLeaveType && (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined />}
              title="Delete this leave type?"
              description={`"${r.name}" will no longer be available for new requests.`}
              confirmText="Delete"
              placement="bottomRight"
              onConfirm={() => remove(r)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadLeaveType) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view leave types.</div>;
  }

  const suggestionOptions = LEAVE_SUGGESTIONS.map((s) => ({ value: s.name }));

  return (
    <div className="lvt">
      {/* ── 1) HEADER: about + search + add ─────────────────────────────────── */}
      <div className="lvt-header">
        <div className="lvt-header-about">
          <div className="lvt-header-icon"><TagsOutlined /></div>
          <div>
            <div className="lvt-header-title">Leave Type</div>
            <div className="lvt-header-sub">Configure the types of leave employees can request</div>
          </div>
        </div>
        <div className="lvt-header-actions">
          <div className="lvt-search-wrap">
            <SearchOutlined className="lvt-search-icon" />
            <input className="lvt-search" placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="lvt-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreateLeaveType && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="lvt-add-btn">New Leave Type</Button>
          )}
        </div>
      </div>

      {/* ── 2) STAT CARDS (square — exact Proposal stat-card UI) ─────────────── */}
      <div className="lvt-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvt-stat-card">
            <div className="lvt-stat-top">
              <div className="lvt-stat-left">
                <span className="lvt-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                <span className="lvt-stat-label">{s.title}</span>
              </div>
            </div>
            <div className="lvt-stat-bottom">
              <div className="lvt-stat-value-wrap">
                <span className="lvt-stat-value">{s.value}</span>
                <span className="lvt-stat-period">{s.period}</span>
              </div>
              <div className="lvt-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3) FILTERS ──────────────────────────────────────────────────────── */}
      <div className="lvt-filters">
        <span className="lvt-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="lvt-filter-dd"
          placeholder="Unit"
          searchPlaceholder="Search units"
          itemNoun="units"
          value={unitFilter === 'all' ? undefined : unitFilter}
          onChange={(v) => setUnitFilter((v as UnitFilter) ?? 'all')}
          options={[
            { value: 'day', label: 'Daily' },
            { value: 'hour', label: 'Hourly' },
          ]}
          style={{ width: 160 }}
          width={210}
        />
        <SearchableDropdown
          className="lvt-filter-dd"
          placeholder="Payment"
          searchPlaceholder="Search"
          itemNoun="options"
          value={paidFilter === 'all' ? undefined : paidFilter}
          onChange={(v) => setPaidFilter((v as PaidFilter) ?? 'all')}
          options={[
            { value: 'paid', label: 'Paid only' },
            { value: 'unpaid', label: 'Unpaid only' },
          ]}
          style={{ width: 160 }}
          width={210}
        />
        <SearchableDropdown
          className="lvt-filter-dd"
          placeholder="Status"
          searchPlaceholder="Search statuses"
          itemNoun="statuses"
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          style={{ width: 160 }}
          width={210}
        />
        <span className="lvt-filter-count">{filtered.length} of {rows.length}</span>
        {hasActiveFilters && (
          <button type="button" className="lvt-clear" onClick={clearFilters}><CloseCircleOutlined /> Clear</button>
        )}
      </div>

      {/* ── 4) TABLE (Proposal table UI) ────────────────────────────────────── */}
      <div className="lvt-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="lvt-table"
          loading={loading}
          columns={columns}
          dataSource={pagedRows}
          pagination={false}
          onRow={() => ({ className: 'lvt-row' })}
        />
      </div>

      {/* Sticky footer pager (proposal-style) */}
      {total > 0 && (
        <div className="lvt-footer lvt-footer--sticky">
          <div className="lvt-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="lvt-pager">
            <button type="button" className="lvt-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5)
              .map((p) => (
                <button key={p} type="button" className={`lvt-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
              ))}
            <button type="button" className="lvt-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="lvt-pagesize"
              size="small"
              value={tablePageSize}
              onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      {/* ── Create / Edit DRAWER (ProjectFormDrawer-style sections) ──────────── */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          header: { display: 'none' },
          mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' },
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          {/* Header */}
          <div
            style={{
              padding: '16px 18px 12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-pure-white)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: editing ? TINT.green : TINT.blue,
                  color: editing ? PALETTE.green : PALETTE.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {editing ? <EditOutlined /> : <PlusOutlined />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {editing ? 'Edit Leave Type' : 'New Leave Type'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                  {editing ? `Update details for ${editing.name}` : 'Define a type of leave employees can request'}
                </div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)} style={{ color: 'var(--text-slate-500)' }} />
          </div>

          {/* Content */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
            <Form
              form={form}
              layout="vertical"
              requiredMark="optional"
              className="lvt-drawer-form"
              onValuesChange={(changed) => {
                if (!editing && 'name' in changed && !codeTouched) {
                  form.setFieldValue('code', slugifyCode(changed.name || ''));
                }
              }}
            >
              {/* STEP 1 — Basic Details */}
              <SectionCard
                icon={<InfoCircleOutlined />}
                tint={TINT.blue}
                color={PALETTE.blue}
                title="Basic Details"
                subtitle="The essentials that identify this leave type"
                step="STEP 1"
              >
                <Row gutter={16} align="top">
                  <Col span={24}>
                    <Form.Item
                      style={{ marginBottom: 14 }}
                      name="name"
                      label={fieldLabel('Leave name')}
                      tooltip="Pick a common type or type your own"
                      rules={[{ required: true, message: 'Name is required' }]}
                    >
                      <AutoComplete
                        options={suggestionOptions}
                        onSelect={applySuggestion}
                        filterOption={(input, option) =>
                          (option?.value as string).toLowerCase().includes(input.toLowerCase())
                        }
                        allowClear
                      >
                        <Input size="large" maxLength={120} placeholder="e.g. Sick Leave" />
                      </AutoComplete>
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      style={{ marginBottom: 14 }}
                      name="code"
                      label={fieldLabel('Code')}
                      tooltip="Auto-generated from the name. You can override it."
                      rules={[
                        { required: true, message: 'Code is required' },
                        { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Letters, numbers, - and _ only' },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="SICK_LEAVE"
                        maxLength={40}
                        disabled={!!editing}
                        onChange={() => setCodeTouched(true)}
                        style={{ fontFamily: 'monospace', color: 'var(--text-slate-600)' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item style={{ marginBottom: 14 }} name="unit" label={fieldLabel('Unit')}>
                      <SearchableDropdown
                        className="lvt-dd-flat"
                        placeholder="Select unit"
                        searchPlaceholder="Search units"
                        itemNoun="units"
                        allowClear={false}
                        options={[{ value: 'day', label: 'Daily' }, { value: 'hour', label: 'Hourly' }]}
                        style={{ width: '100%', height: 40 }}
                        width={210}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item style={{ marginBottom: 14 }} label={fieldLabel('Color')}>
                      <div className="lvt-color-field">
                        <ColorPicker
                          value={color}
                          onChange={(_, hex) => setColor(hex)}
                          presets={[{ label: 'Leaves palette', colors: [PALETTE.blue, PALETTE.green, PALETTE.red, PALETTE.grey] }]}
                          showText={(c) => <span className="lvt-color-hex">{c.toHexString().toUpperCase()}</span>}
                          size="large"
                        />
                      </div>
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item style={{ marginBottom: 0 }} name="description" label={fieldLabel('Description')}>
                      <TextArea rows={2} maxLength={500} placeholder="What is this leave for?" />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              {/* STEP 2 — Policy & Settings */}
              <SectionCard
                icon={<SettingOutlined />}
                tint={TINT.green}
                color={PALETTE.green}
                title="Policy & Settings"
                subtitle="How this leave behaves"
                step="STEP 2"
              >
                <div className="lvt-toggles">
                  <div className="lvt-toggle-row">
                    <div className="lvt-toggle-text">
                      <div className="lvt-toggle-title">Paid leave</div>
                      <div className="lvt-toggle-desc">Counts as paid time off</div>
                    </div>
                    <Form.Item name="isPaid" valuePropName="checked" noStyle><Switch /></Form.Item>
                  </div>
                  <div className="lvt-toggle-row">
                    <div className="lvt-toggle-text">
                      <div className="lvt-toggle-title">Requires approval</div>
                      <div className="lvt-toggle-desc">Manager must approve each request</div>
                    </div>
                    <Form.Item name="requiresApproval" valuePropName="checked" noStyle><Switch /></Form.Item>
                  </div>
                  <div className="lvt-toggle-row">
                    <div className="lvt-toggle-text">
                      <div className="lvt-toggle-title">Active</div>
                      <div className="lvt-toggle-desc">Available for new requests</div>
                    </div>
                    <Form.Item name="isActive" valuePropName="checked" noStyle><Switch /></Form.Item>
                  </div>
                </div>
              </SectionCard>
            </Form>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-pure-white)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>
              Fields marked required must be filled
            </span>
            <Space size={10}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={submit}
                loading={saving}
                icon={editing ? <EditOutlined /> : <PlusOutlined />}
                style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}
              >
                {editing ? 'Save Changes' : 'Create Leave Type'}
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .lvt { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        /* 1) Header */
        .lvt-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200);
          flex-wrap: wrap;
        }
        .lvt-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .lvt-header-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .lvt-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .lvt-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvt-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        .lvt-search-wrap {
          position: relative; display: flex; align-items: center; height: 34px; width: 240px;
          border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .lvt-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lvt-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lvt-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .lvt-search::placeholder { color: var(--text-slate-400); }
        .lvt-ghost-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .lvt-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvt-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }

        /* 2) Stat cards — square, exact Proposal pp-stat-card */
        .lvt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .lvt-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .lvt-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .lvt-stat-left { display: flex; align-items: center; gap: 8px; }
        .lvt-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lvt-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lvt-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .lvt-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .lvt-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .lvt-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .lvt-stat-spark { opacity: 0.95; }

        /* 3) Filters */
        .lvt-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .lvt-filter-label {
          display: inline-flex; align-items: center; gap: 6px; margin-right: 2px;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-600);
        }
        .lvt-filter-label .anticon { color: var(--text-slate-400); font-size: 13px; }
        .lvt-filter-count { font-size: 12px; color: var(--text-slate-500); margin-left: 2px; }
        .lvt-clear {
          display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer;
          padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto;
        }

        /* 4) Table — exact Proposal pp-table */
        .lvt-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .lvt-table .ant-table { background: transparent; font-size: 12px; }
        .lvt-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important;
        }
        .lvt-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .lvt-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lvt-table .ant-table-tbody > tr.lvt-row:hover > td { background: var(--bg-slate-50) !important; }
        .lvt-table .ant-pagination { margin: 12px 12px 8px !important; }

        /* Sticky footer pager — mirrors proposal pp-footer--sticky */
        .lvt-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          height: 52px; box-sizing: border-box;
        }
        .lvt-footer--sticky {
          position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px;
          background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .lvt-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .lvt-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .lvt-pager { display: flex; align-items: center; gap: 3px; }
        .lvt-pager-btn, .lvt-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .lvt-pager-btn:hover:not(:disabled), .lvt-pager-num:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .lvt-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lvt-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .lvt-pagesize { margin-left: 5px; }
        .lvt-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Drawer form fields — clean OUTLINED white (matches the project form):
           white bg, light border, 6px radius, blue border + ring on focus.
           All controls share 40px height. */
        .lvt-drawer-form .ant-input-affix-wrapper,
        .lvt-drawer-form .ant-input-affix-wrapper-lg,
        .lvt-drawer-form input.ant-input-lg,
        .lvt-drawer-form .ant-input-lg,
        .lvt-drawer-form .lvt-dd-flat.sd-trigger,
        .lvt-color-field .ant-color-picker-trigger {
          height: 40px;
          border-radius: 6px !important;
          background: var(--bg-pure-white) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: none !important;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .lvt-drawer-form textarea.ant-input {
          border-radius: 6px !important; background: var(--bg-pure-white) !important;
          border: 1px solid var(--border-color) !important; padding: 8px 11px; box-shadow: none !important;
        }
        .lvt-drawer-form .ant-input-affix-wrapper:hover,
        .lvt-drawer-form .ant-input:hover,
        .lvt-drawer-form textarea.ant-input:hover,
        .lvt-drawer-form .lvt-dd-flat.sd-trigger:hover,
        .lvt-color-field .ant-color-picker-trigger:hover { border-color: #93c5fd !important; }
        .lvt-drawer-form .ant-input-affix-wrapper-focused,
        .lvt-drawer-form .ant-input-focused,
        .lvt-drawer-form .ant-input:focus,
        .lvt-drawer-form textarea.ant-input:focus {
          border-color: ${PALETTE.blue} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.10) !important;
        }
        .lvt-drawer-form .ant-input-disabled { background: var(--bg-slate-50) !important; color: var(--text-slate-400) !important; }

        /* Unit dropdown trigger — outlined + 40px, centered */
        .lvt-drawer-form .lvt-dd-flat.sd-trigger { display: flex; align-items: center; }

        /* Color picker rendered as a full-width outlined field (matches Unit) */
        .lvt-color-field { width: 100%; }
        .lvt-color-field .ant-color-picker-trigger {
          width: 100% !important; justify-content: flex-start; gap: 10px; padding: 0 12px;
        }
        .lvt-color-field .ant-color-picker-color-block { width: 22px; height: 22px; border-radius: 6px; }
        .lvt-color-hex { font-family: monospace; font-weight: 600; letter-spacing: 0.04em; color: var(--text-slate-600); }

        /* Drawer toggles (inside STEP 2 section card) */
        .lvt-toggles { display: flex; flex-direction: column; }
        .lvt-toggle-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 11px 0; border-bottom: 1px solid var(--border-slate-100);
        }
        .lvt-toggle-row:first-child { padding-top: 2px; }
        .lvt-toggle-row:last-child { border-bottom: none; padding-bottom: 2px; }
        .lvt-toggle-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .lvt-toggle-desc { font-size: 11.5px; color: var(--text-slate-400); margin-top: 1px; }

        @media (max-width: 1024px) {
          .lvt-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lvt-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
