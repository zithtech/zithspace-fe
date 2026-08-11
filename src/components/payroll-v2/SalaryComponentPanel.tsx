'use client';

import { Menu } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
  InputNumber,
  message,
  Tooltip,
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
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
  PieChartOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PayrollV2Service, {
  CreateComponentInput,
  PayComponent,
  ComponentCategory,
  ComponentCalcType,
  ComponentPercentageOf,
} from '@/services/payrollV2Service';

const { TextArea } = Input;

const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  grey: '#94A3B8',
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  red: 'rgba(239,68,68,0.10)',
  violet: 'rgba(139,92,246,0.10)',
  amber: 'rgba(245,158,11,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

type CategoryFilter = 'all' | ComponentCategory;
type StatusFilter = 'all' | 'active' | 'inactive';

const CATEGORY_META: Record<ComponentCategory, { label: string; color: string; tint: string }> = {
  earning: { label: 'Earning', color: PALETTE.green, tint: TINT.green },
  deduction: { label: 'Deduction', color: PALETTE.red, tint: TINT.red },
  reimbursement: { label: 'Reimbursement', color: PALETTE.blue, tint: TINT.blue },
  benefit: { label: 'Benefit', color: PALETTE.violet, tint: TINT.violet },
};

const PERCENT_OF_LABEL: Record<ComponentPercentageOf, string> = {
  gross: 'Gross',
  basic: 'Basic',
  ctc: 'CTC',
};

// Common Indian-payroll components. Selecting one prefills sensible defaults;
// users can type their own name freely and override anything.
interface Suggestion extends Partial<CreateComponentInput> {
  name: string;
}
const COMPONENT_SUGGESTIONS: Suggestion[] = [
  { name: 'Basic', category: 'earning', calculationType: 'percentage', percentageOf: 'ctc', defaultValue: 40, isTaxable: true, considerForPf: true, considerForEsi: true },
  { name: 'House Rent Allowance', category: 'earning', calculationType: 'percentage', percentageOf: 'basic', defaultValue: 50, isTaxable: true },
  { name: 'Conveyance Allowance', category: 'earning', calculationType: 'fixed', defaultValue: 1600, isTaxable: true },
  { name: 'Medical Allowance', category: 'earning', calculationType: 'fixed', defaultValue: 1250, isTaxable: true },
  { name: 'Special Allowance', category: 'earning', calculationType: 'fixed', isTaxable: true },
  { name: 'Dearness Allowance', category: 'earning', calculationType: 'percentage', percentageOf: 'basic', defaultValue: 10, isTaxable: true, considerForPf: true },
  { name: 'Leave Travel Allowance', category: 'earning', calculationType: 'fixed', isTaxable: true },
  { name: 'Performance Bonus', category: 'earning', calculationType: 'fixed', isTaxable: true, isProRata: false },
  { name: 'Provident Fund', category: 'deduction', calculationType: 'percentage', percentageOf: 'basic', defaultValue: 12, isTaxable: false, partOfCtc: false },
  { name: 'Professional Tax', category: 'deduction', calculationType: 'fixed', defaultValue: 200, isTaxable: false, partOfCtc: false },
  { name: 'Employee State Insurance', category: 'deduction', calculationType: 'percentage', percentageOf: 'gross', defaultValue: 0.75, isTaxable: false, partOfCtc: false },
  { name: 'Income Tax (TDS)', category: 'deduction', calculationType: 'fixed', isTaxable: false, partOfCtc: false, isProRata: false },
  { name: 'Loan Repayment', category: 'deduction', calculationType: 'fixed', isTaxable: false, partOfCtc: false, isProRata: false },
  { name: 'Fuel Reimbursement', category: 'reimbursement', calculationType: 'fixed', isTaxable: false, isProRata: false },
  { name: 'Telephone Reimbursement', category: 'reimbursement', calculationType: 'fixed', isTaxable: false, isProRata: false },
  { name: 'Gratuity', category: 'benefit', calculationType: 'percentage', percentageOf: 'basic', defaultValue: 4.81, isTaxable: false },
  { name: 'Employer PF Contribution', category: 'benefit', calculationType: 'percentage', percentageOf: 'basic', defaultValue: 12, isTaxable: false },
];

// "House Rent Allowance" → "HOUSE_RENT_ALLOWANCE"
const slugifyCode = (name: string): string =>
  (name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const TRENDS: Record<string, number[]> = {
  total: [3, 5, 4, 6, 7, 6, 8],
  earning: [2, 3, 3, 4, 5, 6, 7],
  deduction: [4, 4, 5, 5, 5, 6, 6],
  reimb: [1, 2, 2, 3, 3, 4, 5],
};

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
  const gid = `pvcspk-${color.replace(/[^a-z0-9]/gi, '')}`;
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

// Section card — icon chip + title + subtitle + STEP pill, wrapping fields.
function SectionCard({
  icon, tint, color, title, subtitle, step, children,
}: {
  icon: React.ReactNode; tint: string; color: string;
  title: string; subtitle: string; step: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)', borderRadius: 12, padding: '14px 20px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-slate-100)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--bg-secondary, #f1f5f9)', color: 'var(--text-slate-500)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>
          {step}
        </span>
      </div>
      {children}
    </div>
  );
}

// Divided settings row (General-Settings style): label + hint on the left, the
// field control on the right. The control is a Form.Item so inline validation
// still works — we just omit its top label.
function DrawerRow({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="pvc-frow">
      <div className="pvc-frow-meta">
        <div className="pvc-frow-label">{label}{required && <span className="pvc-req">*</span>}</div>
        {hint && <div className="pvc-frow-hint">{hint}</div>}
      </div>
      <div className="pvc-frow-ctrl">{children}</div>
    </div>
  );
}

function ToggleRow({
  title, desc, name,
}: { title: string; desc: string; name: keyof CreateComponentInput }) {
  return (
    <div className="pvc-toggle-row">
      <div className="pvc-toggle-text">
        <div className="pvc-toggle-title">{title}</div>
        <div className="pvc-toggle-desc">{desc}</div>
      </div>
      <Form.Item name={name as string} valuePropName="checked" noStyle><Switch /></Form.Item>
    </div>
  );
}

// Salary Component panel — header + stat cards + filters + table + create/edit drawer.
export default function SalaryComponentPanel() {
    const {
      canReadPayrollComponents,
      canCreatePayrollComponents,
      canUpdatePayrollComponents,
      canDeletePayrollComponents,
    } = usePermission();

    console.log("Forcing HMR update for SalaryComponentPanel...");

    const [rows, setRows] = useState<PayComponent[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PayComponent | null>(null);
  const [saving, setSaving] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [form] = Form.useForm<CreateComponentInput>();
  const calcType = Form.useWatch('calculationType', form) as ComponentCalcType | undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PayrollV2Service.listComponents(true);
      setRows(data);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load salary components');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadPayrollComponents) load();
  }, [canReadPayrollComponents, load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const earning = rows.filter((r) => r.category === 'earning').length;
    const deduction = rows.filter((r) => r.category === 'deduction').length;
    const reimb = rows.filter((r) => r.category === 'reimbursement' || r.category === 'benefit').length;
    return { total, earning, deduction, reimb };
  }, [rows]);

  const statCells = [
    { key: 'total', title: 'Total Components', value: stats.total, period: 'configured', icon: <PieChartOutlined />, color: PALETTE.blue, tint: TINT.blue, trend: TRENDS.total },
    { key: 'earning', title: 'Earnings', value: stats.earning, period: `of ${stats.total}`, icon: <RiseOutlined />, color: PALETTE.green, tint: TINT.green, trend: TRENDS.earning },
    { key: 'deduction', title: 'Deductions', value: stats.deduction, period: `of ${stats.total}`, icon: <FallOutlined />, color: PALETTE.red, tint: TINT.red, trend: TRENDS.deduction },
    { key: 'reimb', title: 'Reimb. & Benefits', value: stats.reimb, period: `of ${stats.total}`, icon: <WalletOutlined />, color: PALETTE.violet, tint: TINT.violet, trend: TRENDS.reimb },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (statusFilter === 'active' && !r.isActive) return false;
      if (statusFilter === 'inactive' && r.isActive) return false;
      return true;
    });
  }, [rows, search, categoryFilter, statusFilter]);

  const hasActiveFilters = !!search || categoryFilter !== 'all' || statusFilter !== 'active';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('active');
  };

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const pagedRows = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  useEffect(() => { setTablePage(1); }, [search, categoryFilter, statusFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);

  const DEFAULTS: Partial<CreateComponentInput> = {
    category: 'earning',
    calculationType: 'fixed',
    isTaxable: true,
    isProRata: true,
    partOfCtc: true,
    considerForPf: false,
    considerForEsi: false,
    showOnPayslip: true,
    isActive: true,
    displayOrder: 0,
  };

  const openCreate = () => {
    setEditing(null);
    setCodeTouched(false);
    form.resetFields();
    form.setFieldsValue(DEFAULTS);
    setDrawerOpen(true);
  };

  const openEdit = (record: PayComponent) => {
    setEditing(record);
    setCodeTouched(true);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      category: record.category,
      calculationType: record.calculationType,
      percentageOf: record.percentageOf ?? undefined,
      defaultValue: record.defaultValue ?? undefined,
      isTaxable: record.isTaxable,
      isProRata: record.isProRata,
      partOfCtc: record.partOfCtc,
      considerForPf: record.considerForPf,
      considerForEsi: record.considerForEsi,
      showOnPayslip: record.showOnPayslip,
      displayOrder: record.displayOrder,
      description: record.description ?? undefined,
      isActive: record.isActive,
    });
    setDrawerOpen(true);
  };

  const applySuggestion = (name: string) => {
    const s = COMPONENT_SUGGESTIONS.find((x) => x.name === name);
    if (!s) return;
    const { name: _n, ...rest } = s;
    form.setFieldsValue({ ...DEFAULTS, ...rest });
  };

  const submit = async () => {
    let values: CreateComponentInput;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    // Percentage requires a base; clear it for non-percentage so payload is clean.
    if (values.calculationType !== 'percentage') {
      values.percentageOf = null;
    }
    setSaving(true);
    try {
      if (editing) {
        await PayrollV2Service.updateComponent(editing.id, values);
        message.success('Component updated');
      } else {
        await PayrollV2Service.createComponent(values);
        message.success('Component created');
      }
      setDrawerOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: PayComponent) => {
    try {
      await PayrollV2Service.deleteComponent(record.id);
      message.success('Component deleted');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete component');
    }
  };

  const renderCalc = (r: PayComponent) => {
    if (r.calculationType === 'formula') return <span style={{ color: 'var(--text-slate-500)' }}>Formula</span>;
    if (r.calculationType === 'percentage') {
      return (
        <span>
          {r.defaultValue ?? '—'}% <span style={{ color: 'var(--text-slate-400)' }}>of {r.percentageOf ? PERCENT_OF_LABEL[r.percentageOf] : '—'}</span>
        </span>
      );
    }
    return <span>{r.defaultValue != null ? r.defaultValue.toLocaleString() : <span style={{ color: 'var(--text-slate-400)' }}>Variable</span>}</span>;
  };

  const columns: ColumnsType<PayComponent> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_META[r.category].color, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: (v: ComponentCategory) => {
        const m = CATEGORY_META[v];
        return <Tag style={{ color: m.color, background: m.tint, border: 'none', fontWeight: 600 }}>{m.label}</Tag>;
      },
    },
    { title: 'Calculation', key: 'calc', render: (_, r) => renderCalc(r) },
    { title: 'Taxable', dataIndex: 'isTaxable', key: 'isTaxable', render: (v) => (v ? <Tag color="orange">Taxable</Tag> : <Tag>Exempt</Tag>) },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollComponents && (
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
          )}
          {canDeletePayrollComponents && (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined />}
              title="Delete this component?"
              description={`"${r.name}" will no longer be available for new salary structures.`}
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

  if (!canReadPayrollComponents) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view salary components.</div>;
  }

  const suggestionOptions = COMPONENT_SUGGESTIONS.map((s) => ({ value: s.name }));
  const isPercent = calcType === 'percentage';

  return (
    <div className="pvc">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="pvc-header">
        <div className="pvc-header-about">
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="pvc-header-icon"><PieChartOutlined /></div>
          <div>
            <div className="pvc-header-title">Salary Components</div>
            <div className="pvc-header-sub">Reusable earnings, deductions, reimbursements &amp; benefits</div>
          </div>
        </div>
        <div className="pvc-header-actions">
          <div className="pvc-search-wrap">
            <SearchOutlined className="pvc-search-icon" />
            <input className="pvc-search" placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="pvc-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreatePayrollComponents && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="pvc-add-btn">New Component</Button>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="pvc-stats">
        {statCells.map((s) => (
          <div key={s.key} className="pvc-stat-card">
            <div className="pvc-stat-top">
              <div className="pvc-stat-left">
                <span className="pvc-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                <span className="pvc-stat-label">{s.title}</span>
              </div>
            </div>
            <div className="pvc-stat-bottom">
              <div className="pvc-stat-value-wrap">
                <span className="pvc-stat-value">{s.value}</span>
                <span className="pvc-stat-period">{s.period}</span>
              </div>
              <div className="pvc-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ────────────────────────────────────────────────────────── */}
      <div className="pvc-filters">
        <span className="pvc-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="pvc-filter-dd"
          placeholder="Category"
          searchPlaceholder="Search categories"
          itemNoun="categories"
          value={categoryFilter === 'all' ? undefined : categoryFilter}
          onChange={(v) => setCategoryFilter((v as CategoryFilter) ?? 'all')}
          options={[
            { value: 'earning', label: 'Earning' },
            { value: 'deduction', label: 'Deduction' },
            { value: 'reimbursement', label: 'Reimbursement' },
            { value: 'benefit', label: 'Benefit' },
          ]}
          style={{ width: 170 }}
          width={210}
        />
        <SearchableDropdown
          className="pvc-filter-dd"
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
        <span className="pvc-filter-count">{filtered.length} of {rows.length}</span>
        {hasActiveFilters && (
          <button type="button" className="pvc-clear" onClick={clearFilters}><CloseCircleOutlined /> Clear</button>
        )}
      </div>

      {/* ── TABLE ──────────────────────────────────────────────────────────── */}
      <div className="pvc-table-wrap" style={{ position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner size="medium" fullScreen={false} />
          </div>
        )}
        <Table
          rowKey="id"
          size="small"
          className="pvc-table"
          loading={false}
          columns={columns}
          dataSource={pagedRows}
          pagination={false}
          onRow={() => ({ className: 'pvc-row' })}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {total > 0 && (
        <div className="pvc-footer pvc-footer--sticky">
          <div className="pvc-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="pvc-pager">
            <button type="button" className="pvc-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5)
              .map((p) => (
                <button key={p} type="button" className={`pvc-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
              ))}
            <button type="button" className="pvc-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="pvc-pagesize"
              size="small"
              value={tablePageSize}
              onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT DRAWER ───────────────────────────────────────────── */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
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
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-pure-white)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 0, background: editing ? TINT.green : TINT.blue, color: editing ? PALETTE.green : PALETTE.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {editing ? <EditOutlined /> : <PlusOutlined />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {editing ? 'Edit Component' : 'New Component'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                  {editing ? `Update details for ${editing.name}` : 'Define a reusable pay component'}
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
              className="pvc-drawer-form"
              onValuesChange={(changed) => {
                if (!editing && 'name' in changed && !codeTouched) {
                  form.setFieldValue('code', slugifyCode(changed.name || ''));
                }
              }}
            >
              {/* STEP 1 — Basic Details */}
              <SectionCard icon={<InfoCircleOutlined />} tint={TINT.blue} color={PALETTE.blue} title="Basic Details" subtitle="What this component is and where it belongs" step="STEP 1">
                <DrawerRow label="Component name" hint="Pick a common component or type your own" required>
                  <Form.Item style={{ marginBottom: 0 }} name="name" rules={[{ required: true, message: 'Name is required' }]}>
                    <AutoComplete
                      options={suggestionOptions}
                      onSelect={applySuggestion}
                      filterOption={(input, option) => (option?.value as string).toLowerCase().includes(input.toLowerCase())}
                      allowClear
                    >
                      <Input size="large" maxLength={120} placeholder="e.g. House Rent Allowance" />
                    </AutoComplete>
                  </Form.Item>
                </DrawerRow>
                <DrawerRow label="Code" hint="Auto-generated from the name — override if needed" required>
                  <Form.Item style={{ marginBottom: 0 }} name="code" rules={[{ required: true, message: 'Code is required' }, { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Letters, numbers, - and _ only' }]}>
                    <Input size="large" placeholder="HRA" maxLength={40} disabled={!!editing} onChange={() => setCodeTouched(true)} style={{ fontFamily: 'monospace', color: 'var(--text-slate-600)' }} />
                  </Form.Item>
                </DrawerRow>
                <DrawerRow label="Category" hint="Which bucket this component belongs to" required>
                  <Form.Item style={{ marginBottom: 0 }} name="category" rules={[{ required: true, message: 'Category is required' }]}>
                    <SearchableDropdown
                      className="pvc-dd-flat"
                      placeholder="Select category"
                      searchPlaceholder="Search"
                      itemNoun="categories"
                      allowClear={false}
                      options={[
                        { value: 'earning', label: 'Earning' },
                        { value: 'deduction', label: 'Deduction' },
                        { value: 'reimbursement', label: 'Reimbursement' },
                        { value: 'benefit', label: 'Benefit' },
                      ]}
                      style={{ width: '100%', height: 40 }}
                      width={240}
                    />
                  </Form.Item>
                </DrawerRow>
                <DrawerRow label="Description" hint="A short note on what this component is for">
                  <Form.Item style={{ marginBottom: 0 }} name="description">
                    <TextArea rows={2} maxLength={500} placeholder="What is this component for?" />
                  </Form.Item>
                </DrawerRow>
              </SectionCard>

              {/* STEP 2 — Calculation */}
              <SectionCard icon={<CalculatorOutlined />} tint={TINT.violet} color={PALETTE.violet} title="Calculation" subtitle="How the amount is derived" step="STEP 2">
                <DrawerRow label="Type" hint="Fixed rupee amount or a percentage of a base">
                  <Form.Item style={{ marginBottom: 0 }} name="calculationType">
                    <SearchableDropdown
                      className="pvc-dd-flat"
                      placeholder="Select type"
                      searchPlaceholder="Search"
                      itemNoun="types"
                      allowClear={false}
                      options={[
                        { value: 'fixed', label: 'Fixed amount' },
                        { value: 'percentage', label: 'Percentage' },
                      ]}
                      style={{ width: '100%', height: 40 }}
                      width={240}
                    />
                  </Form.Item>
                </DrawerRow>
                <DrawerRow label={isPercent ? 'Percentage (%)' : 'Default amount'} hint="Salary structures can override this value">
                  <Form.Item style={{ marginBottom: 0 }} name="defaultValue">
                    <InputNumber min={0} max={isPercent ? 100 : 100000000} step={isPercent ? 0.5 : 100} style={{ width: '100%', height: 40 }} placeholder={isPercent ? 'e.g. 40' : 'e.g. 15000'} />
                  </Form.Item>
                </DrawerRow>
                {isPercent && (
                  <DrawerRow label="Percentage of" hint="The base the percentage is applied to" required>
                    <Form.Item style={{ marginBottom: 0 }} name="percentageOf" rules={[{ required: true, message: 'Select a base' }]}>
                      <SearchableDropdown
                        className="pvc-dd-flat"
                        placeholder="Select base"
                        searchPlaceholder="Search"
                        itemNoun="bases"
                        allowClear={false}
                        options={[
                          { value: 'basic', label: 'Basic' },
                          { value: 'gross', label: 'Gross' },
                          { value: 'ctc', label: 'CTC' },
                        ]}
                        style={{ width: '100%', height: 40 }}
                        width={240}
                      />
                    </Form.Item>
                  </DrawerRow>
                )}
                <DrawerRow label="Display order" hint="Lower numbers appear first on the payslip">
                  <Form.Item style={{ marginBottom: 0 }} name="displayOrder">
                    <InputNumber min={0} max={9999} style={{ width: '100%', height: 40 }} />
                  </Form.Item>
                </DrawerRow>
              </SectionCard>

              {/* STEP 3 — Tax, Statutory & Visibility */}
              <SectionCard icon={<SafetyCertificateOutlined />} tint={TINT.green} color={PALETTE.green} title="Tax, Statutory & Visibility" subtitle="How this component behaves in payroll" step="STEP 3">
                <div className="pvc-toggles">
                  <ToggleRow name="isTaxable" title="Taxable" desc="Counts toward taxable income" />
                  <ToggleRow name="isProRata" title="Pro-rata" desc="Prorate on loss of pay / partial month" />
                  <ToggleRow name="partOfCtc" title="Part of CTC" desc="Included in cost-to-company" />
                  <ToggleRow name="considerForPf" title="Consider for PF" desc="Included in provident-fund wages" />
                  <ToggleRow name="considerForEsi" title="Consider for ESI" desc="Included in ESI wages" />
                  <ToggleRow name="showOnPayslip" title="Show on payslip" desc="Visible as a line item to employees" />
                  <ToggleRow name="isActive" title="Active" desc="Available for new salary structures" />
                </div>
              </SectionCard>
            </Form>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-pure-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>Fields marked required must be filled</span>
            <Space size={10}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>Cancel</Button>
              <Button type="primary" onClick={submit} loading={saving} icon={editing ? <EditOutlined /> : <PlusOutlined />} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
                {editing ? 'Save Changes' : 'Create Component'}
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvc { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .pvc-header-about { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 250px; }
        .pvc-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvc-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvc-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvc-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pvc-search-wrap { position: relative; display: flex; align-items: center; height: 34px; width: 240px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pvc-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pvc-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pvc-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pvc-search::placeholder { color: var(--text-slate-400); }
        .pvc-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .pvc-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .pvc-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }

        .pvc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pvc-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; padding: 12px 14px; min-height: 92px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvc-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pvc-stat-left { display: flex; align-items: center; gap: 8px; }
        .pvc-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pvc-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pvc-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pvc-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pvc-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pvc-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        .pvc-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .pvc-filter-label { display: inline-flex; align-items: center; gap: 6px; margin-right: 2px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .pvc-filter-label .anticon { color: var(--text-slate-400); font-size: 13px; }
        .pvc-filter-count { font-size: 12px; color: var(--text-slate-500); margin-left: 2px; }
        .pvc-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }

        .pvc-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pvc-table, .pvc-table.ant-table-wrapper, .pvc-table .ant-table, .pvc-table .ant-table-container, .pvc-table .ant-table-content, .pvc-table .ant-table-header, .pvc-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pvc-table .ant-table-thead > tr > th,
        .pvc-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .pvc-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .pvc-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pvc-table .ant-table-tbody > tr.pvc-row:hover > td { background: var(--bg-slate-50) !important; }

        .pvc-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .pvc-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .pvc-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pvc-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pvc-pager { display: flex; align-items: center; gap: 3px; }
        .pvc-pager-btn, .pvc-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .pvc-pager-btn:hover:not(:disabled), .pvc-pager-num:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .pvc-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pvc-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .pvc-pagesize { margin-left: 5px; }
        .pvc-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        .pvc-drawer-form .ant-input-affix-wrapper,
        .pvc-drawer-form .ant-input-affix-wrapper-lg,
        .pvc-drawer-form input.ant-input-lg,
        .pvc-drawer-form .ant-input-lg,
        .pvc-drawer-form .ant-input-number,
        .pvc-drawer-form .pvc-dd-flat.sd-trigger {
          height: 40px; border-radius: 6px !important; background: var(--bg-pure-white) !important;
          border: 1px solid var(--border-color) !important; box-shadow: none !important;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .pvc-drawer-form .ant-input-number-input { height: 38px; }
        .pvc-drawer-form textarea.ant-input { border-radius: 6px !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-color) !important; padding: 8px 11px; box-shadow: none !important; }
        .pvc-drawer-form .ant-input-affix-wrapper:hover,
        .pvc-drawer-form .ant-input:hover,
        .pvc-drawer-form .ant-input-number:hover,
        .pvc-drawer-form textarea.ant-input:hover,
        .pvc-drawer-form .pvc-dd-flat.sd-trigger:hover { border-color: #93c5fd !important; }
        .pvc-drawer-form .ant-input-disabled { background: var(--bg-slate-50) !important; color: var(--text-slate-400) !important; }
        .pvc-drawer-form .pvc-dd-flat.sd-trigger { display: flex; align-items: center; }

        .pvc-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvc-frow:first-child { padding-top: 2px; }
        .pvc-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvc-frow-meta { min-width: 0; flex: 1; }
        .pvc-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvc-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvc-req { color: ${PALETTE.red}; margin-left: 3px; font-weight: 700; }
        .pvc-frow-ctrl { width: 360px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .pvc-frow { flex-direction: column; align-items: stretch; gap: 8px; }
          .pvc-frow-ctrl { width: 100%; }
        }

        .pvc-toggles { display: flex; flex-direction: column; }
        .pvc-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvc-toggle-row:first-child { padding-top: 2px; }
        .pvc-toggle-row:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvc-toggle-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .pvc-toggle-desc { font-size: 11.5px; color: var(--text-slate-400); margin-top: 1px; }

        @media (max-width: 900px) {
          .pvc-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pvc-header-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .pvc-search-wrap {
            flex: 1;
            min-width: 200px;
          }
          .pvc-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .pvc-stats {
            grid-template-columns: 1fr;
          }
          .pvc-add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
