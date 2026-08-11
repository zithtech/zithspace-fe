'use client';

import { Menu } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Drawer,
  Input,
  Switch,
  Select,
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
  CloseCircleOutlined,
  FilterOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ApartmentOutlined,
  WarningOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PayrollV2Service, {
  PayComponent,
  PayStructureListItem,
  PayStructureDetail,
  StructureCalcType,
  StructureLineInput,
  ComponentCategory,
  ComponentPercentageOf,
} from '@/services/payrollV2Service';
import ZukvoLoader from '../common/ZukvoLoader';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', violet: '#8B5CF6', amber: '#F59E0B', grey: '#94A3B8' } as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)',
  violet: 'rgba(139,92,246,0.10)', amber: 'rgba(245,158,11,0.10)', grey: 'rgba(148,163,184,0.12)',
} as const;

const CATEGORY_META: Record<ComponentCategory, { label: string; color: string; tint: string }> = {
  earning: { label: 'Earning', color: PALETTE.green, tint: TINT.green },
  deduction: { label: 'Deduction', color: PALETTE.red, tint: TINT.red },
  reimbursement: { label: 'Reimbursement', color: PALETTE.blue, tint: TINT.blue },
  benefit: { label: 'Benefit', color: PALETTE.violet, tint: TINT.violet },
};

type StatusFilter = 'all' | 'active' | 'inactive';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;

const slugifyCode = (name: string): string =>
  (name || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

// A draft line in the drawer editor (carries component meta for display).
interface DraftLine {
  componentId: string;
  code: string;
  name: string;
  category: ComponentCategory;
  calculationType: StructureCalcType;
  percentageOf: ComponentPercentageOf | null;
  value: number;
}

function SectionCard({ icon, tint, color, title, subtitle, step, children }: {
  icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; step: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)', borderRadius: 12, padding: '14px 20px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-slate-100)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)' }}>{title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--bg-secondary, #f1f5f9)', color: 'var(--text-slate-500)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>{step}</span>
      </div>
      {children}
    </div>
  );
}

// Divided settings row (General-Settings style): label + hint on the left, the
// control on the right. `inlineControl` places the control (e.g. a Switch)
// directly at the right instead of in a fixed-width column.
function DrawerRow({ label, hint, inlineControl, children }: {
  label: string; hint?: string; inlineControl?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="pvs-frow">
      <div className="pvs-frow-meta">
        <div className="pvs-frow-label">{label}</div>
        {hint && <div className="pvs-frow-hint">{hint}</div>}
      </div>
      {inlineControl ? children : <div className="pvs-frow-ctrl">{children}</div>}
    </div>
  );
}

export default function SalaryStructurePanel() {
  const {
    canReadPayrollStructures,
    canCreatePayrollStructures,
    canUpdatePayrollStructures,
    canDeletePayrollStructures,
  } = usePermission();

  const [rows, setRows] = useState<PayStructureListItem[]>([]);
  const [components, setComponents] = useState<PayComponent[]>([]);
  const [loading, setLoading] = useState(false);
  console.log("Forcing HMR reload for SalaryStructurePanel");

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PayStructureListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  // structure header state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyCtc, setMonthlyCtc] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState<DraftLine[]>([]);

  // live preview
  const [previewTotals, setPreviewTotals] = useState<PayStructureDetail['totals'] | null>(null);
  const [amountById, setAmountById] = useState<Record<string, number>>({});
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [structs, comps] = await Promise.all([
        PayrollV2Service.listStructures(true),
        PayrollV2Service.listComponents(false),
      ]);
      setRows(structs);
      setComponents(comps);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (canReadPayrollStructures) load(); }, [canReadPayrollStructures, load]);

  // ── live preview (debounced) ───────────────────────────────────────────────
  useEffect(() => {
    if (!drawerOpen) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    if (lines.length === 0) {
      setPreviewTotals(null);
      setAmountById({});
      return;
    }
    previewTimer.current = setTimeout(async () => {
      try {
        const payload: StructureLineInput[] = lines.map((l, i) => ({
          componentId: l.componentId,
          calculationType: l.calculationType,
          percentageOf: l.calculationType === 'percentage' ? l.percentageOf : null,
          value: l.value || 0,
          displayOrder: i,
        }));
        const res = await PayrollV2Service.previewStructure({ monthlyCtc: monthlyCtc || 0, lines: payload });
        setPreviewTotals(res);
        const map: Record<string, number> = {};
        res.lines.forEach((l) => { map[l.componentId] = l.calculatedAmount; });
        setAmountById(map);
      } catch {
        /* preview is best-effort */
      }
    }, 350);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [drawerOpen, lines, monthlyCtc]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.isActive).length;
    const avgCtc = total ? rows.reduce((s, r) => s + r.monthlyCtc, 0) / total : 0;
    return { total, active, avgCtc };
  }, [rows]);

  const statCells = [
    { key: 'total', title: 'Total Structures', value: String(stats.total), period: 'grades', icon: <ApartmentOutlined />, color: PALETTE.violet, tint: TINT.violet },
    { key: 'active', title: 'Active', value: String(stats.active), period: `of ${stats.total}`, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'avg', title: 'Avg Monthly CTC', value: money(stats.avgCtc), period: 'per grade', icon: <DollarOutlined />, color: PALETTE.blue, tint: TINT.blue },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      if (statusFilter === 'active' && !r.isActive) return false;
      if (statusFilter === 'inactive' && r.isActive) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const hasActiveFilters = !!search || statusFilter !== 'active';
  const clearFilters = () => { setSearch(''); setStatusFilter('active'); };

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const pagedRows = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  useEffect(() => { setTablePage(1); }, [search, statusFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);

  const resetForm = () => {
    setName(''); setCode(''); setDescription(''); setMonthlyCtc(0); setIsActive(true);
    setLines([]); setCodeTouched(false); setPreviewTotals(null); setAmountById({});
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = async (record: PayStructureListItem) => {
    setEditing(record);
    setCodeTouched(true);
    try {
      const detail = await PayrollV2Service.getStructure(record.id);
      setName(detail.name);
      setCode(detail.code);
      setDescription(detail.description ?? '');
      setMonthlyCtc(detail.monthlyCtc);
      setIsActive(detail.isActive);
      setLines(detail.lines.map((l) => ({
        componentId: l.componentId, code: l.code, name: l.name, category: l.category,
        calculationType: l.calculationType, percentageOf: l.percentageOf, value: l.value,
      })));
      setDrawerOpen(true);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load structure');
    }
  };

  const availableComponents = useMemo(() => {
    const used = new Set(lines.map((l) => l.componentId));
    return components.filter((c) => !used.has(c.id));
  }, [components, lines]);

  const addComponent = (componentId: string) => {
    const c = components.find((x) => x.id === componentId);
    if (!c) return;
    setLines((prev) => [
      ...prev,
      {
        componentId: c.id,
        code: c.code,
        name: c.name,
        category: c.category,
        calculationType: c.calculationType === 'formula' ? 'fixed' : c.calculationType,
        percentageOf: c.percentageOf,
        value: c.defaultValue ?? 0,
      },
    ]);
  };

  const updateLine = (componentId: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.componentId === componentId ? { ...l, ...patch } : l)));
  };
  const removeLine = (componentId: string) => setLines((prev) => prev.filter((l) => l.componentId !== componentId));

  const submit = async () => {
    if (!name.trim()) { message.error('Structure name is required'); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) { message.error('Code may only contain letters, numbers, - and _'); return; }
    if (lines.length === 0) { message.error('Add at least one component'); return; }
    for (const l of lines) {
      if (l.calculationType === 'percentage' && !l.percentageOf) {
        message.error(`Select a base for "${l.name}"`); return;
      }
    }
    const payload = {
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || null,
      monthlyCtc: monthlyCtc || 0,
      isActive,
      lines: lines.map((l, i) => ({
        componentId: l.componentId,
        calculationType: l.calculationType,
        percentageOf: l.calculationType === 'percentage' ? l.percentageOf : null,
        value: l.value || 0,
        displayOrder: i,
      })),
    };
    setSaving(true);
    try {
      if (editing) {
        await PayrollV2Service.updateStructure(editing.id, payload);
        message.success('Structure updated');
      } else {
        await PayrollV2Service.createStructure(payload);
        message.success('Structure created');
      }
      setDrawerOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save structure');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: PayStructureListItem) => {
    try {
      await PayrollV2Service.deleteStructure(record.id);
      message.success('Structure deleted');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete structure');
    }
  };

  const columns: ColumnsType<PayStructureListItem> = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE.violet, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Components', dataIndex: 'componentCount', key: 'componentCount', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Monthly CTC', dataIndex: 'monthlyCtc', key: 'monthlyCtc', render: (v) => money(v) },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollStructures && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>}
          {canDeletePayrollStructures && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this structure?" description={`"${r.name}" will no longer be available for assignment.`} confirmText="Delete" placement="bottomRight" onConfirm={() => remove(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadPayrollStructures) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view salary structures.</div>;
  }

  const totals = previewTotals;

  return (
    <div className="pvs">
      {/* HEADER */}
      <div className="pvs-header">
        <div className="pvs-header-about">
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="pvs-header-icon"><ApartmentOutlined /></div>
          <div>
            <div className="pvs-header-title">Salary Structures</div>
            <div className="pvs-header-sub">Reusable CTC templates (grades) built from components</div>
          </div>
        </div>
        <div className="pvs-header-actions">
          <div className="pvs-search-wrap">
            <SearchOutlined className="pvs-search-icon" />
            <input className="pvs-search" placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="pvs-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreatePayrollStructures && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="pvs-add-btn">New Structure</Button>}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="pvs-stats">
        {statCells.map((s) => (
          <div key={s.key} className="pvs-stat-card">
            <div className="pvs-stat-left">
              <span className="pvs-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="pvs-stat-label">{s.title}</span>
            </div>
            <div className="pvs-stat-value-wrap">
              <span className="pvs-stat-value">{s.value}</span>
              <span className="pvs-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="pvs-filters">
        <span className="pvs-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="pvs-filter-dd" placeholder="Status" searchPlaceholder="Search statuses" itemNoun="statuses"
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          style={{ width: 160 }} width={210}
        />
        <span className="pvs-filter-count">{filtered.length} of {rows.length}</span>
        {hasActiveFilters && <button type="button" className="pvs-clear" onClick={clearFilters}><CloseCircleOutlined /> Clear</button>}
      </div>

      {/* TABLE */}
      <div className="pvs-table-wrap" style={{ position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ZukvoLoader size="md" />
          </div>
        )}
        <Table rowKey="id" size="small" className="pvs-table" loading={false} columns={columns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvs-row' })} scroll={{ x: 'max-content' }} />
      </div>

      {total > 0 && (
        <div className="pvs-footer pvs-footer--sticky">
          <div className="pvs-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="pvs-pager">
            <button type="button" className="pvs-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pvs-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="pvs-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select className="pvs-pagesize" size="small" value={tablePageSize} onChange={(v) => { setTablePageSize(v); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
          </div>
        </div>
      )}

      {/* DRAWER */}
      <Drawer
        title={null} open={drawerOpen} onClose={() => setDrawerOpen(false)} width={760} closable={false} destroyOnClose
        styles={{ body: { padding: 0, background: 'var(--bg-pure-white)' }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          {/* Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-pure-white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, background: editing ? TINT.green : TINT.violet, color: editing ? PALETTE.green : PALETTE.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {editing ? <EditOutlined /> : <PlusOutlined />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>{editing ? 'Edit Structure' : 'New Structure'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>{editing ? `Update ${editing.name}` : 'Compose components into a salary grade'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)} style={{ color: 'var(--text-slate-500)' }} />
          </div>

          {/* Content */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }} className="pvs-drawer">
            {/* STEP 1 — Details */}
            <SectionCard icon={<InfoCircleOutlined />} tint={TINT.blue} color={PALETTE.blue} title="Structure Details" subtitle="Identify this grade and its reference CTC" step="STEP 1">
              <DrawerRow label="Structure name" hint="Grade / template name shown when assigning">
                <Input size="large" maxLength={160} placeholder="e.g. Grade A — Engineering" value={name}
                  onChange={(e) => { const v = e.target.value; setName(v); if (!editing && !codeTouched) setCode(slugifyCode(v)); }} />
              </DrawerRow>
              <DrawerRow label="Code" hint="Auto-generated from the name — override if needed">
                <Input size="large" maxLength={40} placeholder="GRADE_A" value={code} disabled={!!editing}
                  onChange={(e) => { setCodeTouched(true); setCode(e.target.value); }} style={{ fontFamily: 'monospace', color: 'var(--text-slate-600)' }} />
              </DrawerRow>
              <DrawerRow label="Reference monthly gross" hint="Used to preview each component's amount">
                <InputNumber size="large" min={0} max={100000000} step={1000} style={{ width: '100%' }} value={monthlyCtc}
                  formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v || '').replace(/[^\d.]/g, '')) as any}
                  onChange={(v) => setMonthlyCtc(Number(v ?? 0))} />
              </DrawerRow>
              <DrawerRow label="Active" hint="Available for assignment to employees" inlineControl>
                <Switch checked={isActive} onChange={setIsActive} />
              </DrawerRow>
              <DrawerRow label="Description" hint="A short note on who this grade is for">
                <Input.TextArea rows={2} maxLength={500} placeholder="Who is this grade for?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </DrawerRow>
            </SectionCard>

            {/* STEP 2 — Components */}
            <SectionCard icon={<AppstoreOutlined />} tint={TINT.violet} color={PALETTE.violet} title="Components" subtitle="Pick components and set how each is calculated" step="STEP 2">
              <div style={{ marginBottom: 12 }}>
                <SearchableDropdown
                  className="pvs-add-dd" placeholder="+ Add a component" searchPlaceholder="Search components" itemNoun="components"
                  value={undefined}
                  onChange={(v) => v && addComponent(v as string)}
                  options={availableComponents.map((c) => ({ value: c.id, label: `${c.name} · ${CATEGORY_META[c.category].label}` }))}
                  style={{ width: '100%', height: 40 }} width={360}
                />
              </div>

              {lines.length === 0 ? (
                <div className="pvs-empty">No components yet. Add one above to build the structure.</div>
              ) : (
                <div className="pvs-lines">
                  {lines.map((l) => (
                    <div key={l.componentId} className="pvs-line">
                      <div className="pvs-line-main">
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_META[l.category].color, display: 'inline-block', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="pvs-line-name">{l.name}</div>
                          <div className="pvs-line-cat" style={{ color: CATEGORY_META[l.category].color }}>{CATEGORY_META[l.category].label}</div>
                        </div>
                      </div>
                      <Select
                        size="small" className="pvs-line-calc" value={l.calculationType}
                        onChange={(v) => updateLine(l.componentId, { calculationType: v, percentageOf: v === 'percentage' ? (l.percentageOf ?? 'basic') : null })}
                        options={[{ value: 'fixed', label: 'Fixed' }, { value: 'percentage', label: '%' }]}
                        style={{ width: 92 }}
                      />
                      {l.calculationType === 'percentage' && (
                        <Select
                          size="small" value={l.percentageOf ?? undefined} placeholder="of…"
                          onChange={(v) => updateLine(l.componentId, { percentageOf: v })}
                          options={[{ value: 'basic', label: 'of Basic' }, { value: 'gross', label: 'of Gross' }, { value: 'ctc', label: 'of CTC' }]}
                          style={{ width: 104 }}
                        />
                      )}
                      <InputNumber
                        size="small" min={0} max={l.calculationType === 'percentage' ? 100 : 100000000}
                        value={l.value} onChange={(v) => updateLine(l.componentId, { value: Number(v ?? 0) })}
                        style={{ width: 92 }} placeholder={l.calculationType === 'percentage' ? '%' : '₹'}
                      />
                      <div className="pvs-line-amount">{money(amountById[l.componentId] ?? 0)}</div>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeLine(l.componentId)} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Totals */}
            {totals && (
              <div className="pvs-totals">
                <div className="pvs-total-cell"><span>Gross</span><strong>{money(totals.grossSalary)}</strong></div>
                <div className="pvs-total-cell"><span>Deductions</span><strong style={{ color: PALETTE.red }}>−{money(totals.totalDeductions)}</strong></div>
                <div className="pvs-total-cell"><span>Net Pay</span><strong>{money(totals.netSalary)}</strong></div>
                <div className="pvs-total-cell"><span>CTC</span><strong>{money(totals.ctc)}</strong></div>
                <div className={`pvs-balance ${totals.balanced ? 'ok' : 'warn'}`}>
                  {totals.balanced ? <><CheckOutlined /> Balanced</> : <><WarningOutlined /> {totals.warning || 'Unbalanced'}</>}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-pure-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>{lines.length} component{lines.length === 1 ? '' : 's'}</span>
            <Space size={10}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>Cancel</Button>
              <Button type="primary" onClick={submit} loading={saving} icon={editing ? <EditOutlined /> : <PlusOutlined />} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
                {editing ? 'Save Changes' : 'Create Structure'}
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvs { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvs-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .pvs-header-about { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 250px; }
        .pvs-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.violet}; color: ${PALETTE.violet}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvs-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvs-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvs-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pvs-search-wrap { position: relative; display: flex; align-items: center; height: 34px; width: 240px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pvs-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pvs-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pvs-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pvs-search::placeholder { color: var(--text-slate-400); }
        .pvs-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .pvs-ghost-btn:hover { color: ${PALETTE.violet}; border-color: #ddd6fe; }
        .pvs-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }

        .pvs-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
        .pvs-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 86px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvs-stat-left { display: flex; align-items: center; gap: 8px; }
        .pvs-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pvs-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pvs-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pvs-stat-value { font-size: 22px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pvs-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        .pvs-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .pvs-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .pvs-filter-label .anticon { color: var(--text-slate-400); font-size: 13px; }
        .pvs-filter-count { font-size: 12px; color: var(--text-slate-500); }
        .pvs-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }

        .pvs-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pvs-table, .pvs-table.ant-table-wrapper, .pvs-table .ant-table, .pvs-table .ant-table-container, .pvs-table .ant-table-content, .pvs-table .ant-table-header, .pvs-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pvs-table .ant-table-thead > tr > th,
        .pvs-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .pvs-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .pvs-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pvs-table .ant-table-tbody > tr.pvs-row:hover > td { background: var(--bg-slate-50) !important; }

        .pvs-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .pvs-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .pvs-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pvs-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pvs-pager { display: flex; align-items: center; gap: 3px; }
        .pvs-pager-btn, .pvs-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .pvs-pager-btn:hover:not(:disabled), .pvs-pager-num:hover { border-color: #c4b5fd; color: ${PALETTE.violet}; }
        .pvs-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pvs-pager-num.is-active { background: ${PALETTE.violet}; border-color: ${PALETTE.violet}; color: #fff; }
        .pvs-pagesize { margin-left: 5px; }
        .pvs-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Drawer form — divided rows (General-Settings style) */
        .pvs-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvs-frow:first-child { padding-top: 2px; }
        .pvs-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvs-frow-meta { min-width: 0; flex: 1; }
        .pvs-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvs-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvs-frow-ctrl { width: 360px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .pvs-frow { flex-direction: column; align-items: stretch; gap: 8px; }
          .pvs-frow-ctrl { width: 100%; }
        }
        .pvs-drawer .ant-input, .pvs-drawer .ant-input-affix-wrapper, .pvs-drawer .ant-input-number, .pvs-drawer .ant-input-lg, .pvs-drawer .pvs-add-dd.sd-trigger {
          border-radius: 6px !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-color) !important; box-shadow: none !important;
        }
        .pvs-drawer .ant-input-lg, .pvs-drawer .ant-input-number-lg { height: 40px; }
        .pvs-drawer .pvs-add-dd.sd-trigger { display: flex; align-items: center; }

        .pvs-empty { padding: 22px; text-align: center; color: var(--text-slate-400); font-size: 13px; border: 1px dashed var(--border-color); border-radius: 10px; background: var(--bg-slate-50); }
        .pvs-lines { display: flex; flex-direction: column; gap: 8px; }
        .pvs-line { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 10px; transition: border-color .12s ease, box-shadow .12s ease; }
        .pvs-line:hover { border-color: #c4b5fd; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .pvs-line-main { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .pvs-line-name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pvs-line-cat { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .pvs-line-amount { width: 92px; text-align: right; font-weight: 700; font-size: 12.5px; color: var(--text-slate-900); }

        .pvs-totals { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 14px 18px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; }
        .pvs-total-cell { display: flex; flex-direction: column; gap: 2px; }
        .pvs-total-cell span { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); }
        .pvs-total-cell strong { font-size: 16px; font-weight: 800; color: var(--text-slate-900); }
        .pvs-balance { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 6px; }
        .pvs-balance.ok { color: ${PALETTE.green}; background: ${TINT.green}; }
        .pvs-balance.warn { color: ${PALETTE.amber}; background: ${TINT.amber}; }

        @media (max-width: 900px) {
          .pvs-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pvs-header-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .pvs-search-wrap {
            flex: 1;
            min-width: 200px;
          }
          .pvs-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .pvs-stats {
            grid-template-columns: 1fr;
          }
          .pvs-add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
