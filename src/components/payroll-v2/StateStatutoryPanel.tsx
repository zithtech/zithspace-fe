'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Drawer, Switch, Select, InputNumber, message, Tooltip, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined,
  CloseOutlined, ProfileOutlined, SafetyOutlined, BarsOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PayrollV2Service, {
  PtStateListItem, PtSlab, LwfState, LwfFrequency,
} from '@/services/payrollV2Service';

const PALETTE = { cyan: '#06B6D4', green: '#10B981', red: '#EF4444', amber: '#F59E0B', violet: '#8B5CF6', grey: '#94A3B8' } as const;
const TINT = { cyan: 'rgba(6,182,212,0.10)', green: 'rgba(16,185,129,0.10)', violet: 'rgba(139,92,246,0.10)' } as const;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

const FREQ_OPTIONS: { value: LwfFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'half_yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
];
const FREQ_LABEL: Record<LwfFrequency, string> = { monthly: 'Monthly', half_yearly: 'Half-yearly', yearly: 'Yearly' };

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

type View = 'pt' | 'lwf';
type SlabDraft = { fromAmount: number; toAmount: number | null; monthlyAmount: number };

// Divided settings row (General-Settings style): label + hint on the left,
// control on the right. `inline` drops the control (a Switch) straight at right.
function Field({ label, hint, children, inline }: { label: string; hint?: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <div className="pvss-frow">
      <div className="pvss-frow-meta">
        <div className="pvss-frow-label">{label}</div>
        {hint && <div className="pvss-frow-hint">{hint}</div>}
      </div>
      {inline ? children : <div className="pvss-frow-ctrl">{children}</div>}
    </div>
  );
}

// Rounded section card with an icon-chip header + optional right-side action.
function DrawerCard({ icon, tint, color, title, subtitle, action, children }: {
  icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="pvss-card">
      <div className="pvss-card-head">
        <div className="pvss-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div className="pvss-card-title">{title}</div><div className="pvss-card-sub">{subtitle}</div></div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function StateStatutoryPanel() {
  const { canReadPayrollStateStatutory, canCreatePayrollStateStatutory, canUpdatePayrollStateStatutory, canDeletePayrollStateStatutory } = usePermission();

  const [view, setView] = useState<View>('pt');
  const [ptStates, setPtStates] = useState<PtStateListItem[]>([]);
  const [lwf, setLwf] = useState<LwfState[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // PT drawer
  const [ptOpen, setPtOpen] = useState(false);
  const [ptEditing, setPtEditing] = useState<PtStateListItem | null>(null);
  const [ptSaving, setPtSaving] = useState(false);
  const [ptState, setPtState] = useState<string | undefined>(undefined);
  const [ptActive, setPtActive] = useState(true);
  const [slabs, setSlabs] = useState<SlabDraft[]>([]);

  // LWF drawer
  const [lwfOpen, setLwfOpen] = useState(false);
  const [lwfEditing, setLwfEditing] = useState<LwfState | null>(null);
  const [lwfSaving, setLwfSaving] = useState(false);
  const [lState, setLState] = useState<string | undefined>(undefined);
  const [lEe, setLEe] = useState(0); const [lEr, setLEr] = useState(0);
  const [lFreq, setLFreq] = useState<LwfFrequency>('half_yearly'); const [lActive, setLActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pt, l] = await Promise.all([PayrollV2Service.listPtStates(true), PayrollV2Service.listLwf(true)]);
      setPtStates(pt); setLwf(l);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load state statutory config');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (canReadPayrollStateStatutory) load(); }, [canReadPayrollStateStatutory, load]);

  // ── PT handlers ────────────────────────────────────────────────────────────
  const openCreatePt = () => {
    setPtEditing(null); setPtState(undefined); setPtActive(true);
    setSlabs([{ fromAmount: 0, toAmount: null, monthlyAmount: 0 }]);
    setPtOpen(true);
  };
  const openEditPt = async (r: PtStateListItem) => {
    setPtEditing(r);
    try {
      const detail = await PayrollV2Service.getPtState(r.id);
      setPtState(detail.state); setPtActive(detail.isActive);
      setSlabs(detail.slabs.map((s) => ({ fromAmount: s.fromAmount, toAmount: s.toAmount, monthlyAmount: s.monthlyAmount })));
      setPtOpen(true);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load PT'); }
  };
  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const from = last && last.toAmount != null ? last.toAmount + 1 : (last ? last.fromAmount : 0);
    setSlabs((p) => [...p, { fromAmount: from, toAmount: null, monthlyAmount: 0 }]);
  };
  const updateSlab = (i: number, patch: Partial<SlabDraft>) => setSlabs((p) => p.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSlab = (i: number) => setSlabs((p) => p.filter((_, idx) => idx !== i));

  const submitPt = async () => {
    if (!ptState) { message.error('Select a state'); return; }
    if (slabs.length === 0) { message.error('Add at least one slab'); return; }
    for (const s of slabs) {
      if (s.toAmount != null && s.toAmount < s.fromAmount) { message.error('Each slab’s "to" must be ≥ "from"'); return; }
    }
    const payload = {
      state: ptState, isActive: ptActive,
      slabs: slabs.map((s, i) => ({ fromAmount: s.fromAmount || 0, toAmount: s.toAmount, monthlyAmount: s.monthlyAmount || 0, displayOrder: i })),
    };
    setPtSaving(true);
    try {
      if (ptEditing) { await PayrollV2Service.updatePtState(ptEditing.id, payload); message.success('Professional Tax updated'); }
      else { await PayrollV2Service.createPtState(payload); message.success('Professional Tax created'); }
      setPtOpen(false); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to save PT'); }
    finally { setPtSaving(false); }
  };
  const removePt = async (r: PtStateListItem) => {
    try { await PayrollV2Service.deletePtState(r.id); message.success('Professional Tax deleted'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete PT'); }
  };

  // ── LWF handlers ───────────────────────────────────────────────────────────
  const openCreateLwf = () => {
    setLwfEditing(null); setLState(undefined); setLEe(0); setLEr(0); setLFreq('half_yearly'); setLActive(true);
    setLwfOpen(true);
  };
  const openEditLwf = (r: LwfState) => {
    setLwfEditing(r); setLState(r.state); setLEe(r.employeeAmount); setLEr(r.employerAmount); setLFreq(r.frequency); setLActive(r.isActive);
    setLwfOpen(true);
  };
  const submitLwf = async () => {
    if (!lState) { message.error('Select a state'); return; }
    const payload = { state: lState, employeeAmount: lEe || 0, employerAmount: lEr || 0, frequency: lFreq, isActive: lActive };
    setLwfSaving(true);
    try {
      if (lwfEditing) { await PayrollV2Service.updateLwf(lwfEditing.id, payload); message.success('LWF updated'); }
      else { await PayrollV2Service.createLwf(payload); message.success('LWF created'); }
      setLwfOpen(false); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to save LWF'); }
    finally { setLwfSaving(false); }
  };
  const removeLwf = async (r: LwfState) => {
    try { await PayrollV2Service.deleteLwf(r.id); message.success('LWF deleted'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete LWF'); }
  };

  // ── filtering / paging ─────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filteredPt = useMemo(() => ptStates.filter((r) => !q || r.state.toLowerCase().includes(q)), [ptStates, q]);
  const filteredLwf = useMemo(() => lwf.filter((r) => !q || r.state.toLowerCase().includes(q)), [lwf, q]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [view, search, pageSize]);
  const activeRows: any[] = view === 'pt' ? filteredPt : filteredLwf;
  const total = activeRows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(total, page * pageSize);
  const pagedRows = activeRows.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  const ptColumns: ColumnsType<PtStateListItem> = [
    {
      title: 'State', dataIndex: 'state', key: 'state',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE.cyan, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.state}</span>
        </div>
      ),
    },
    { title: 'Slabs', dataIndex: 'slabCount', key: 'slabCount', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="cyan">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollStateStatutory && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditPt(r)} /></Tooltip>}
          {canDeletePayrollStateStatutory && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this state’s PT?" description={`Professional Tax slabs for "${r.state}" will be removed.`} confirmText="Delete" placement="bottomRight" onConfirm={() => removePt(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  const lwfColumns: ColumnsType<LwfState> = [
    {
      title: 'State', dataIndex: 'state', key: 'state',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE.violet, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.state}</span>
        </div>
      ),
    },
    { title: 'Employee', dataIndex: 'employeeAmount', key: 'employeeAmount', render: (v) => money(v) },
    { title: 'Employer', dataIndex: 'employerAmount', key: 'employerAmount', render: (v) => money(v) },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', render: (v: LwfFrequency) => FREQ_LABEL[v] },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollStateStatutory && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditLwf(r)} /></Tooltip>}
          {canDeletePayrollStateStatutory && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this state’s LWF?" description={`LWF for "${r.state}" will be removed.`} confirmText="Delete" placement="bottomRight" onConfirm={() => removeLwf(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadPayrollStateStatutory) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view this page.</div>;
  }

  // exclude states already configured (for the create dropdown)
  const usedPt = new Set(ptStates.map((s) => s.state.toLowerCase()));
  const ptStateOptions = ptEditing ? STATE_OPTIONS : STATE_OPTIONS.filter((o) => !usedPt.has(o.value.toLowerCase()));
  const usedLwf = new Set(lwf.map((s) => s.state.toLowerCase()));
  const lwfStateOptions = lwfEditing ? STATE_OPTIONS : STATE_OPTIONS.filter((o) => !usedLwf.has(o.value.toLowerCase()));

  const onNew = () => (view === 'pt' ? openCreatePt() : openCreateLwf());

  return (
    <div className="pvss">
      <div className="pvss-header">
        <div className="pvss-header-about">
          <div className="pvss-header-icon"><ProfileOutlined /></div>
          <div>
            <div className="pvss-header-title">Professional Tax &amp; LWF</div>
            <div className="pvss-header-sub">State-wise PT slabs and Labour Welfare Fund contributions</div>
          </div>
        </div>
        <div className="pvss-header-actions">
          <div className="pvss-search-wrap">
            <SearchOutlined className="pvss-search-icon" />
            <input className="pvss-search" placeholder="Search state…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="pvss-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreatePayrollStateStatutory && <Button type="primary" icon={<PlusOutlined />} onClick={onNew} className="pvss-add-btn">{view === 'pt' ? 'New PT State' : 'New LWF State'}</Button>}
        </div>
      </div>

      <div className="pvss-toolbar">
        <div className="pvss-tabs">
          <button type="button" className={`pvss-tab ${view === 'pt' ? 'is-active' : ''}`} onClick={() => setView('pt')}>
            <ProfileOutlined /><span>Professional Tax ({ptStates.length})</span>
          </button>
          <button type="button" className={`pvss-tab ${view === 'lwf' ? 'is-active' : ''}`} onClick={() => setView('lwf')}>
            <SafetyOutlined /><span>LWF ({lwf.length})</span>
          </button>
        </div>
        <span className="pvss-count">{total} shown</span>
      </div>

      <div className="pvss-table-wrap">
        {view === 'pt'
          ? <Table rowKey="id" size="small" className="pvss-table" loading={loading} columns={ptColumns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvss-row' })} />
          : <Table rowKey="id" size="small" className="pvss-table" loading={loading} columns={lwfColumns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvss-row' })} />}
      </div>

      {total > 0 && (
        <div className="pvss-footer pvss-footer--sticky">
          <div className="pvss-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="pvss-pager">
            <button type="button" className="pvss-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pvss-pager-num ${p === page ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="pvss-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select className="pvss-pagesize" size="small" value={pageSize} onChange={(v) => { setPageSize(v); setPage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
          </div>
        </div>
      )}

      {/* ── PT DRAWER ───────────────────────────────────────────────────────── */}
      <Drawer title={null} open={ptOpen} onClose={() => setPtOpen(false)} width={720} closable={false} destroyOnClose
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvss-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="pvss-drawer-chip" style={{ background: ptEditing ? TINT.green : TINT.cyan, color: ptEditing ? PALETTE.green : PALETTE.cyan }}>{ptEditing ? <EditOutlined /> : <PlusOutlined />}</div>
              <div>
                <div className="pvss-drawer-title">{ptEditing ? 'Edit Professional Tax' : 'New Professional Tax'}</div>
                <div className="pvss-drawer-sub">{ptEditing ? `Update ${ptEditing.state}` : 'Define monthly PT slabs for a state'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setPtOpen(false)} />
          </div>
          <div className="pvss-drawer-body">
            <DrawerCard icon={<ProfileOutlined />} tint={TINT.cyan} color={PALETTE.cyan} title="State" subtitle="Which state these PT slabs apply to">
              <Field label="State" hint="Professional Tax is levied per state">
                <SearchableDropdown className="pvss-dd" placeholder="Select state" searchPlaceholder="Search states" itemNoun="states" allowClear={false}
                  value={ptState} onChange={(v) => setPtState(v as string)} options={ptStateOptions} style={{ width: '100%', height: 40 }} width={300} />
              </Field>
              <Field label="Active" hint="Apply these slabs in payroll" inline><Switch checked={ptActive} onChange={setPtActive} /></Field>
            </DrawerCard>

            <div style={{ height: 14 }} />

            <DrawerCard icon={<BarsOutlined />} tint={TINT.violet} color={PALETTE.violet} title="Monthly Slabs" subtitle="PT deducted per monthly-wage band"
              action={<Button size="small" icon={<PlusOutlined />} onClick={addSlab}>Add slab</Button>}>
              <div className="pvss-slab-cols"><span>From (₹)</span><span>To (₹, blank = &amp; above)</span><span>PT / month (₹)</span><span /></div>
              <div className="pvss-slabs">
                {slabs.map((s, i) => (
                  <div key={i} className="pvss-slab-row">
                    <InputNumber size="small" min={0} value={s.fromAmount} onChange={(v) => updateSlab(i, { fromAmount: Number(v ?? 0) })} style={{ width: '100%' }} />
                    <InputNumber size="small" min={0} value={s.toAmount ?? undefined} placeholder="∞" onChange={(v) => updateSlab(i, { toAmount: v == null ? null : Number(v) })} style={{ width: '100%' }} />
                    <InputNumber size="small" min={0} value={s.monthlyAmount} onChange={(v) => updateSlab(i, { monthlyAmount: Number(v ?? 0) })} style={{ width: '100%' }} />
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeSlab(i)} disabled={slabs.length === 1} />
                  </div>
                ))}
              </div>
            </DrawerCard>
          </div>
          <div className="pvss-drawer-foot">
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>{slabs.length} slab{slabs.length === 1 ? '' : 's'}</span>
            <Space size={10}>
              <Button onClick={() => setPtOpen(false)} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
              <Button type="primary" loading={ptSaving} onClick={submitPt} icon={ptEditing ? <EditOutlined /> : <PlusOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>{ptEditing ? 'Save Changes' : 'Create'}</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      {/* ── LWF DRAWER ──────────────────────────────────────────────────────── */}
      <Drawer title={null} open={lwfOpen} onClose={() => setLwfOpen(false)} width={720} closable={false} destroyOnClose
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvss-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="pvss-drawer-chip" style={{ background: lwfEditing ? TINT.green : TINT.violet, color: lwfEditing ? PALETTE.green : PALETTE.violet }}>{lwfEditing ? <EditOutlined /> : <PlusOutlined />}</div>
              <div>
                <div className="pvss-drawer-title">{lwfEditing ? 'Edit LWF' : 'New LWF'}</div>
                <div className="pvss-drawer-sub">{lwfEditing ? `Update ${lwfEditing.state}` : 'Labour Welfare Fund for a state'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setLwfOpen(false)} />
          </div>
          <div className="pvss-drawer-body">
            <DrawerCard icon={<SafetyOutlined />} tint={TINT.violet} color={PALETTE.violet} title="Labour Welfare Fund" subtitle="Per-state contribution and how often it's collected">
              <Field label="State" hint="LWF is levied per state">
                <SearchableDropdown className="pvss-dd" placeholder="Select state" searchPlaceholder="Search states" itemNoun="states" allowClear={false}
                  value={lState} onChange={(v) => setLState(v as string)} options={lwfStateOptions} style={{ width: '100%', height: 40 }} width={300} />
              </Field>
              <Field label="Employee amount (₹)" hint="Deducted from the employee each period">
                <InputNumber min={0} value={lEe} onChange={(v) => setLEe(Number(v ?? 0))} style={{ width: '100%' }} size="large" />
              </Field>
              <Field label="Employer amount (₹)" hint="Employer's matching contribution">
                <InputNumber min={0} value={lEr} onChange={(v) => setLEr(Number(v ?? 0))} style={{ width: '100%' }} size="large" />
              </Field>
              <Field label="Frequency" hint="How often LWF is collected">
                <SearchableDropdown className="pvss-dd" placeholder="Frequency" searchPlaceholder="Search" itemNoun="frequencies" allowClear={false}
                  value={lFreq} onChange={(v) => setLFreq((v as LwfFrequency) ?? 'half_yearly')} options={FREQ_OPTIONS} style={{ width: '100%', height: 40 }} width={220} />
              </Field>
              <Field label="Active" hint="Apply this contribution in payroll" inline><Switch checked={lActive} onChange={setLActive} /></Field>
            </DrawerCard>
          </div>
          <div className="pvss-drawer-foot">
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>Per-state contribution</span>
            <Space size={10}>
              <Button onClick={() => setLwfOpen(false)} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
              <Button type="primary" loading={lwfSaving} onClick={submitLwf} icon={lwfEditing ? <EditOutlined /> : <PlusOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>{lwfEditing ? 'Save Changes' : 'Create'}</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvss { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvss-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .pvss-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .pvss-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.cyan}; color: ${PALETTE.cyan}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvss-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvss-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvss-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pvss-search-wrap { display: flex; align-items: center; height: 34px; width: 220px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pvss-search-wrap:focus-within { border-color: #67e8f9; box-shadow: 0 0 0 3px rgba(6,182,212,0.10); }
        .pvss-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pvss-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pvss-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .pvss-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .pvss-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .pvss-count { font-size: 12px; color: var(--text-slate-500); }
        .pvss-tabs { display: inline-flex; gap: 4px; padding: 4px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: 12px; }
        .pvss-tab { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 16px; border: none; background: transparent; border-radius: 9px; font-size: 13px; font-weight: 600; line-height: 1; white-space: nowrap; color: var(--text-slate-500); cursor: pointer; transition: color .15s ease, background .15s ease, box-shadow .15s ease; }
        .pvss-tab .anticon { font-size: 14px; }
        .pvss-tab:hover { color: var(--text-slate-800); }
        .pvss-tab.is-active { background: var(--bg-pure-white); color: var(--text-slate-900); box-shadow: 0 1px 2px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.05); }
        .pvss-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); overflow: hidden; }
        .pvss-table .ant-table { background: transparent; font-size: 12px; }
        .pvss-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important; white-space: nowrap !important; }
        .pvss-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .pvss-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pvss-table .ant-table-tbody > tr.pvss-row:hover > td { background: var(--bg-slate-50) !important; }
        .pvss-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .pvss-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .pvss-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pvss-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pvss-pager { display: flex; align-items: center; gap: 3px; }
        .pvss-pager-btn, .pvss-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .pvss-pager-btn:hover:not(:disabled), .pvss-pager-num:hover { border-color: #67e8f9; color: ${PALETTE.cyan}; }
        .pvss-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pvss-pager-num.is-active { background: ${PALETTE.cyan}; border-color: ${PALETTE.cyan}; color: #fff; }
        .pvss-pagesize { margin-left: 5px; }
        .pvss-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
        .pvss-drawer-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; background: var(--bg-pure-white); }
        .pvss-drawer-chip { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .pvss-drawer-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .pvss-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
        .pvss-drawer-body { padding: 16px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); }
        .pvss-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 20px 16px; }
        .pvss-card-head { display: flex; align-items: center; gap: 11px; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--border-slate-100); }
        .pvss-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .pvss-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvss-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvss-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvss-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvss-frow-meta { min-width: 0; flex: 1; }
        .pvss-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvss-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvss-frow-ctrl { width: 340px; flex-shrink: 0; }
        @media (max-width: 640px) { .pvss-frow { flex-direction: column; align-items: stretch; gap: 8px; } .pvss-frow-ctrl { width: 100%; } }
        .pvss-drawer-body .ant-input, .pvss-drawer-body .ant-input-number, .pvss-drawer-body .pvss-dd.sd-trigger { border-radius: 6px !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-color) !important; box-shadow: none !important; }
        .pvss-drawer-body .ant-input-number-lg { height: 40px; }
        .pvss-drawer-body .pvss-dd.sd-trigger { display: flex; align-items: center; }
        .pvss-slab-cols { display: grid; grid-template-columns: 1fr 1fr 1fr 32px; gap: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); margin: 8px 0 6px; }
        .pvss-slabs { display: flex; flex-direction: column; gap: 6px; }
        .pvss-slab-row { display: grid; grid-template-columns: 1fr 1fr 1fr 32px; gap: 8px; align-items: center; }
        .pvss-drawer-foot { padding: 14px 22px; border-top: 1px solid var(--border-color); background: var(--bg-pure-white); display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; }
      `}</style>
    </div>
  );
}
