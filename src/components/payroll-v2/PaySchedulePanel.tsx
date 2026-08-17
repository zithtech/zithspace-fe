'use client';

import { Menu } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Input, Switch, Select, InputNumber, message, Tooltip, Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined,
  CloseOutlined, InfoCircleOutlined, CalendarOutlined, TeamOutlined, StarFilled, BankOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PayrollV2Service, {
  PayScheduleListItem, PayGroupListItem, PayFrequency,
} from '@/services/payrollV2Service';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', amber: '#F59E0B', violet: '#8B5CF6', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', amber: 'rgba(245,158,11,0.10)', violet: 'rgba(139,92,246,0.10)' } as const;

const FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'semi_monthly', label: 'Semi-monthly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
];
const FREQ_LABEL: Record<PayFrequency, string> = {
  monthly: 'Monthly', semi_monthly: 'Semi-monthly', biweekly: 'Bi-weekly', weekly: 'Weekly',
};
const ordinal = (n: number) => {
  if (n >= 11 && n <= 13) return `${n}th`;
  switch (n % 10) { case 1: return `${n}st`; case 2: return `${n}nd`; case 3: return `${n}rd`; default: return `${n}th`; }
};
const slugifyCode = (s: string) => (s || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

type View = 'schedules' | 'groups';

// Divided settings row (General-Settings style): label + hint on the left, the
// control on the right. `inline` drops the control (e.g. a Switch) straight at
// the right instead of in the fixed-width column.
function Field({ label, hint, children, inline }: { label: string; hint?: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <div className="pvg-frow">
      <div className="pvg-frow-meta">
        <div className="pvg-frow-label">{label}</div>
        {hint && <div className="pvg-frow-hint">{hint}</div>}
      </div>
      {inline ? children : <div className="pvg-frow-ctrl">{children}</div>}
    </div>
  );
}

// Rounded section card with an icon-chip header (mirrors General Settings).
function DrawerCard({ icon, tint, color, title, subtitle, children }: {
  icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="pvg-card">
      <div className="pvg-card-head">
        <div className="pvg-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div><div className="pvg-card-title">{title}</div><div className="pvg-card-sub">{subtitle}</div></div>
      </div>
      {children}
    </div>
  );
}

export default function PaySchedulePanel() {
  const { canReadPayrollSchedules, canCreatePayrollSchedules, canUpdatePayrollSchedules, canDeletePayrollSchedules } = usePermission();
  console.log("Forcing HMR reload for PaySchedulePanel");

  const [view, setView] = useState<View>('schedules');
  const [schedules, setSchedules] = useState<PayScheduleListItem[]>([]);
  const [groups, setGroups] = useState<PayGroupListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);

  // schedule drawer
  const [sOpen, setSOpen] = useState(false);
  const [sEditing, setSEditing] = useState<PayScheduleListItem | null>(null);
  const [sSaving, setSSaving] = useState(false);
  const [sCodeTouched, setSCodeTouched] = useState(false);
  const [sName, setSName] = useState(''); const [sCode, setSCode] = useState('');
  const [sFreq, setSFreq] = useState<PayFrequency>('monthly');
  const [sStart, setSStart] = useState(1); const [sEnd, setSEnd] = useState(31); const [sPayDay, setSPayDay] = useState(1);
  const [sNextMonth, setSNextMonth] = useState(false); const [sDefault, setSDefault] = useState(false);
  const [sDesc, setSDesc] = useState(''); const [sActive, setSActive] = useState(true);

  // group drawer
  const [gOpen, setGOpen] = useState(false);
  const [gEditing, setGEditing] = useState<PayGroupListItem | null>(null);
  const [gSaving, setGSaving] = useState(false);
  const [gCodeTouched, setGCodeTouched] = useState(false);
  const [gName, setGName] = useState(''); const [gCode, setGCode] = useState('');
  const [gSchedule, setGSchedule] = useState<string | undefined>(undefined);
  const [gLegal, setGLegal] = useState(''); const [gDesc, setGDesc] = useState(''); const [gActive, setGActive] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async (p = page, l = pageSize, s = debouncedSearch) => {
    setLoading(true);
    try {
      const [schedRes, groupRes] = await Promise.all([
        PayrollV2Service.listSchedules({ page: p, limit: l, search: s }),
        PayrollV2Service.listGroups({ page: p, limit: l, search: s }),
      ]);
      setSchedules(schedRes.data);
      setTotalSchedules(schedRes.pagination.total);
      setGroups(groupRes.data);
      setTotalGroups(groupRes.pagination.total);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load pay schedules');
    } finally { setLoading(false); }
  }, [page, pageSize, debouncedSearch]);
  useEffect(() => { if (canReadPayrollSchedules) load(); }, [canReadPayrollSchedules, load]);

  // ── schedule drawer handlers ───────────────────────────────────────────────
  const openCreateSchedule = () => {
    setSEditing(null); setSCodeTouched(false);
    setSName(''); setSCode(''); setSFreq('monthly'); setSStart(1); setSEnd(31); setSPayDay(1);
    setSNextMonth(false); setSDefault(schedules.length === 0); setSDesc(''); setSActive(true);
    setSOpen(true);
  };
  const openEditSchedule = (r: PayScheduleListItem) => {
    setSEditing(r); setSCodeTouched(true);
    setSName(r.name); setSCode(r.code); setSFreq(r.frequency); setSStart(r.cycleStartDay); setSEnd(r.cycleEndDay);
    setSPayDay(r.payDay); setSNextMonth(r.payInNextMonth); setSDefault(r.isDefault); setSDesc(r.description ?? ''); setSActive(r.isActive);
    setSOpen(true);
  };
  const submitSchedule = async () => {
    if (!sName.trim()) { message.error('Name is required'); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(sCode)) { message.error('Code may only contain letters, numbers, - and _'); return; }
    const payload = {
      name: sName.trim(), code: sCode.trim(), frequency: sFreq, cycleStartDay: sStart, cycleEndDay: sEnd,
      payDay: sPayDay, payInNextMonth: sNextMonth, isDefault: sDefault, description: sDesc.trim() || null, isActive: sActive,
    };
    setSSaving(true);
    try {
      if (sEditing) { await PayrollV2Service.updateSchedule(sEditing.id, payload); message.success('Schedule updated'); }
      else { await PayrollV2Service.createSchedule(payload); message.success('Schedule created'); }
      setSOpen(false); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to save schedule'); }
    finally { setSSaving(false); }
  };
  const removeSchedule = async (r: PayScheduleListItem) => {
    try { await PayrollV2Service.deleteSchedule(r.id); message.success('Schedule deleted'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete schedule'); }
  };

  // ── group drawer handlers ──────────────────────────────────────────────────
  const [activeSchedules, setActiveSchedules] = useState<PayScheduleListItem[]>([]);
  useEffect(() => {
    PayrollV2Service.listSchedules({ limit: 1000 }).then(res => setActiveSchedules(res.data.filter(s => s.isActive)));
  }, []);
  
  const openCreateGroup = () => {
    if (activeSchedules.length === 0) { message.warning('Create a pay schedule first'); setView('schedules'); return; }
    setGEditing(null); setGCodeTouched(false);
    setGName(''); setGCode(''); setGSchedule(activeSchedules.find((s) => s.isDefault)?.id ?? activeSchedules[0]?.id);
    setGLegal(''); setGDesc(''); setGActive(true);
    setGOpen(true);
  };
  const openEditGroup = (r: PayGroupListItem) => {
    setGEditing(r); setGCodeTouched(true);
    setGName(r.name); setGCode(r.code); setGSchedule(r.scheduleId); setGLegal(r.legalEntity ?? ''); setGDesc(r.description ?? ''); setGActive(r.isActive);
    setGOpen(true);
  };
  const submitGroup = async () => {
    if (!gName.trim()) { message.error('Name is required'); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(gCode)) { message.error('Code may only contain letters, numbers, - and _'); return; }
    if (!gSchedule) { message.error('Select a pay schedule'); return; }
    const payload = { name: gName.trim(), code: gCode.trim(), scheduleId: gSchedule, legalEntity: gLegal.trim() || null, description: gDesc.trim() || null, isActive: gActive };
    setGSaving(true);
    try {
      if (gEditing) { await PayrollV2Service.updateGroup(gEditing.id, payload); message.success('Group updated'); }
      else { await PayrollV2Service.createGroup(payload); message.success('Group created'); }
      setGOpen(false); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to save group'); }
    finally { setGSaving(false); }
  };
  const removeGroup = async (r: PayGroupListItem) => {
    try { await PayrollV2Service.deleteGroup(r.id); message.success('Group deleted'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete group'); }
  };

  // ── filtering ──────────────────────────────────────────────────────────────
  useEffect(() => { setPage(1); }, [view, search, pageSize]);
  const activeRows: any[] = view === 'schedules' ? schedules : groups;
  const total = view === 'schedules' ? totalSchedules : totalGroups;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(total, page * pageSize);
  const pagedRows = activeRows;
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  const scheduleColumns: ColumnsType<PayScheduleListItem> = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE.amber, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          {r.isDefault && <Tag color="gold" style={{ marginInlineStart: 2 }}><StarFilled style={{ fontSize: 9 }} /> Default</Tag>}
        </div>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', render: (v: PayFrequency) => FREQ_LABEL[v] },
    { title: 'Cycle', key: 'cycle', render: (_, r) => <span style={{ color: 'var(--text-slate-600)' }}>{ordinal(r.cycleStartDay)} – {ordinal(r.cycleEndDay)}</span> },
    { title: 'Pay day', dataIndex: 'payDay', key: 'payDay', render: (v, r) => <span>{ordinal(v)}{r.payInNextMonth ? ' (next mo.)' : ''}</span> },
    { title: 'Groups', dataIndex: 'groupCount', key: 'groupCount', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollSchedules && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditSchedule(r)} /></Tooltip>}
          {canDeletePayrollSchedules && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this schedule?" description={`"${r.name}" will be removed.`} confirmText="Delete" placement="bottomRight" onConfirm={() => removeSchedule(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  const groupColumns: ColumnsType<PayGroupListItem> = [
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
    { title: 'Schedule', key: 'schedule', render: (_, r) => r.scheduleName ? <Tag color="orange">{r.scheduleName}</Tag> : <span style={{ color: 'var(--text-slate-400)' }}>—</span> },
    { title: 'Legal entity', dataIndex: 'legalEntity', key: 'legalEntity', render: (v) => v || <span style={{ color: 'var(--text-slate-400)' }}>—</span> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollSchedules && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditGroup(r)} /></Tooltip>}
          {canDeletePayrollSchedules && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this group?" description={`"${r.name}" will be removed.`} confirmText="Delete" placement="bottomRight" onConfirm={() => removeGroup(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadPayrollSchedules) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view pay schedules.</div>;
  }

  const onNew = () => (view === 'schedules' ? openCreateSchedule() : openCreateGroup());

  return (
    <div className="pvg">
      {/* HEADER */}
      <div className="pvg-header">
        <div className="pvg-header-about">
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="pvg-header-icon"><CalendarOutlined /></div>
          <div>
            <div className="pvg-header-title">Pay Schedules &amp; Groups</div>
            <div className="pvg-header-sub">Payroll calendars and the employee groups that run on them</div>
          </div>
        </div>
        <div className="pvg-header-actions">
          <div className="pvg-search-wrap">
            <SearchOutlined className="pvg-search-icon" />
            <input className="pvg-search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="pvg-ghost-btn" onClick={() => load()}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreatePayrollSchedules && <Button type="primary" icon={<PlusOutlined />} onClick={onNew} className="pvg-add-btn">{view === 'schedules' ? 'New Schedule' : 'New Group'}</Button>}
        </div>
      </div>

      {/* TABS + count */}
      <div className="pvg-toolbar">
        <div className="pvg-tabs">
          <button type="button" className={`pvg-tab ${view === 'schedules' ? 'is-active' : ''}`} onClick={() => setView('schedules')}>
            <CalendarOutlined /><span>Schedules ({schedules.length})</span>
          </button>
          <button type="button" className={`pvg-tab ${view === 'groups' ? 'is-active' : ''}`} onClick={() => setView('groups')}>
            <TeamOutlined /><span>Groups ({groups.length})</span>
          </button>
        </div>
        <span className="pvg-count">{total} shown</span>
      </div>

      {/* TABLE */}
      <div className="pvg-table-wrap">
        {view === 'schedules'
          ? <ZukvoLoadingOverlay loading={loading} message="">
                  <Table rowKey="id" size="small" className="pvg-table" columns={scheduleColumns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvg-row' })} scroll={{ x: 'max-content' }} />
                  </ZukvoLoadingOverlay>
          : <ZukvoLoadingOverlay loading={loading} message="">
                  <Table rowKey="id" size="small" className="pvg-table" columns={groupColumns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvg-row' })} scroll={{ x: 'max-content' }} />
                  </ZukvoLoadingOverlay>}
      </div>

      {total > 0 && (
        <div className="pvg-footer pvg-footer--sticky">
          <div className="pvg-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="pvg-pager">
            <button type="button" className="pvg-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pvg-pager-num ${p === page ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="pvg-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select className="pvg-pagesize" size="small" value={pageSize} onChange={(v) => { setPageSize(v); setPage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
          </div>
        </div>
      )}

      {/* ── SCHEDULE DRAWER ─────────────────────────────────────────────────── */}
      <Drawer title={null} open={sOpen} onClose={() => setSOpen(false)} width={720} closable={false} destroyOnClose
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvg-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="pvg-drawer-chip" style={{ background: sEditing ? TINT.green : TINT.amber, color: sEditing ? PALETTE.green : PALETTE.amber }}>{sEditing ? <EditOutlined /> : <PlusOutlined />}</div>
              <div>
                <div className="pvg-drawer-title">{sEditing ? 'Edit Schedule' : 'New Schedule'}</div>
                <div className="pvg-drawer-sub">{sEditing ? `Update ${sEditing.name}` : 'Define a payroll calendar'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setSOpen(false)} />
          </div>
          <div className="pvg-drawer-body">
            <DrawerCard icon={<CalendarOutlined />} tint={TINT.amber} color={PALETTE.amber} title="Schedule Details" subtitle="Payroll calendar timing and cycle">
              <Field label="Schedule name" hint="Shown when assigning groups to this calendar"><Input size="large" maxLength={120} placeholder="e.g. Monthly — India" value={sName} onChange={(e) => { setSName(e.target.value); if (!sEditing && !sCodeTouched) setSCode(slugifyCode(e.target.value)); }} /></Field>
              <Field label="Code" hint="Auto-generated from the name — override if needed"><Input size="large" maxLength={40} placeholder="MON_IN" value={sCode} disabled={!!sEditing} onChange={(e) => { setSCodeTouched(true); setSCode(e.target.value); }} style={{ fontFamily: 'monospace' }} /></Field>
              <Field label="Frequency" hint="How often payroll runs on this calendar">
                <SearchableDropdown className="pvg-dd" placeholder="Frequency" searchPlaceholder="Search" itemNoun="frequencies" allowClear={false}
                  value={sFreq} onChange={(v) => setSFreq((v as PayFrequency) ?? 'monthly')} options={FREQUENCY_OPTIONS} style={{ width: '100%', height: 40 }} width={240} />
              </Field>
              <Field label="Cycle start day" hint="Day of month the pay cycle begins"><InputNumber min={1} max={31} value={sStart} onChange={(v) => setSStart(Number(v ?? 1))} style={{ width: '100%' }} size="large" /></Field>
              <Field label="Cycle end day" hint="Day the cycle ends (31 = last day)"><InputNumber min={1} max={31} value={sEnd} onChange={(v) => setSEnd(Number(v ?? 31))} style={{ width: '100%' }} size="large" /></Field>
              <Field label="Pay day" hint="Day of month salary is disbursed"><InputNumber min={1} max={31} value={sPayDay} onChange={(v) => setSPayDay(Number(v ?? 1))} style={{ width: '100%' }} size="large" /></Field>
              <Field label="Pay in next month" hint="Pay day falls after the cycle ends" inline><Switch checked={sNextMonth} onChange={setSNextMonth} /></Field>
              <Field label="Default schedule" hint="Used when a group has no schedule set" inline><Switch checked={sDefault} onChange={setSDefault} /></Field>
              <Field label="Active" hint="Available for new pay groups" inline><Switch checked={sActive} onChange={setSActive} /></Field>
              <Field label="Description" hint="Notes about this calendar"><Input.TextArea rows={2} maxLength={500} value={sDesc} onChange={(e) => setSDesc(e.target.value)} placeholder="Notes about this calendar" /></Field>
            </DrawerCard>
          </div>
          <div className="pvg-drawer-foot">
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>One default schedule per company</span>
            <Space size={10}>
              <Button onClick={() => setSOpen(false)} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
              <Button type="primary" loading={sSaving} onClick={submitSchedule} icon={sEditing ? <EditOutlined /> : <PlusOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>{sEditing ? 'Save Changes' : 'Create Schedule'}</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      {/* ── GROUP DRAWER ────────────────────────────────────────────────────── */}
      <Drawer title={null} open={gOpen} onClose={() => setGOpen(false)} width={720} closable={false} destroyOnClose
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvg-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="pvg-drawer-chip" style={{ background: gEditing ? TINT.green : TINT.violet, color: gEditing ? PALETTE.green : PALETTE.violet }}>{gEditing ? <EditOutlined /> : <PlusOutlined />}</div>
              <div>
                <div className="pvg-drawer-title">{gEditing ? 'Edit Group' : 'New Group'}</div>
                <div className="pvg-drawer-sub">{gEditing ? `Update ${gEditing.name}` : 'Bundle employees onto a schedule'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setGOpen(false)} />
          </div>
          <div className="pvg-drawer-body">
            <DrawerCard icon={<TeamOutlined />} tint={TINT.violet} color={PALETTE.violet} title="Group Details" subtitle="Employees and the schedule they run on">
              <Field label="Group name" hint="Shown when assigning employees"><Input size="large" maxLength={120} placeholder="e.g. India Full-time" value={gName} onChange={(e) => { setGName(e.target.value); if (!gEditing && !gCodeTouched) setGCode(slugifyCode(e.target.value)); }} /></Field>
              <Field label="Code" hint="Auto-generated from the name — override if needed"><Input size="large" maxLength={40} placeholder="IND_FT" value={gCode} disabled={!!gEditing} onChange={(e) => { setGCodeTouched(true); setGCode(e.target.value); }} style={{ fontFamily: 'monospace' }} /></Field>
              <Field label="Pay schedule" hint="Which calendar this group is paid on">
                <SearchableDropdown className="pvg-dd" placeholder="Select schedule" searchPlaceholder="Search schedules" itemNoun="schedules" allowClear={false}
                  value={gSchedule} onChange={(v) => setGSchedule(v as string)}
                  options={activeSchedules.map((s) => ({ value: s.id, label: `${s.name}${s.isDefault ? ' · default' : ''}` }))}
                  style={{ width: '100%', height: 40 }} width={300} />
              </Field>
              <Field label="Legal entity" hint="Registered entity that employs this group"><Input size="large" maxLength={160} prefix={<BankOutlined style={{ color: 'var(--text-slate-400)' }} />} placeholder="e.g. Acme India Pvt Ltd" value={gLegal} onChange={(e) => setGLegal(e.target.value)} /></Field>
              <Field label="Active" hint="Available for employee assignment" inline><Switch checked={gActive} onChange={setGActive} /></Field>
              <Field label="Description" hint="Who belongs to this group?"><Input.TextArea rows={2} maxLength={500} value={gDesc} onChange={(e) => setGDesc(e.target.value)} placeholder="Who belongs to this group?" /></Field>
            </DrawerCard>
          </div>
          <div className="pvg-drawer-foot">
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>Employees are assigned in Employee Pay Setup</span>
            <Space size={10}>
              <Button onClick={() => setGOpen(false)} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
              <Button type="primary" loading={gSaving} onClick={submitGroup} icon={gEditing ? <EditOutlined /> : <PlusOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>{gEditing ? 'Save Changes' : 'Create Group'}</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvg { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvg-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .pvg-header-about { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 250px; }
        .pvg-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.amber}; color: ${PALETTE.amber}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvg-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvg-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvg-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pvg-search-wrap { display: flex; align-items: center; height: 34px; width: 220px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pvg-search-wrap:focus-within { border-color: #fcd34d; box-shadow: 0 0 0 3px rgba(245,158,11,0.10); }
        .pvg-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pvg-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pvg-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .pvg-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }

        .pvg-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .pvg-count { font-size: 12px; color: var(--text-slate-500); }
        .pvg-tabs { display: inline-flex; gap: 4px; padding: 4px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: 12px; }
        .pvg-tab { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 16px; border: none; background: transparent; border-radius: 9px; font-size: 13px; font-weight: 600; line-height: 1; white-space: nowrap; color: var(--text-slate-500); cursor: pointer; transition: color .15s ease, background .15s ease, box-shadow .15s ease; }
        .pvg-tab .anticon { font-size: 14px; }
        .pvg-tab:hover { color: var(--text-slate-800); }
        .pvg-tab.is-active { background: var(--bg-pure-white); color: var(--text-slate-900); box-shadow: 0 1px 2px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.05); }

        .pvg-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pvg-table, .pvg-table.ant-table-wrapper, .pvg-table .ant-table, .pvg-table .ant-table-container, .pvg-table .ant-table-content, .pvg-table .ant-table-header, .pvg-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pvg-table .ant-table-thead > tr > th,
        .pvg-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .pvg-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .pvg-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pvg-table .ant-table-tbody > tr.pvg-row:hover > td { background: var(--bg-slate-50) !important; }

        .pvg-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .pvg-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .pvg-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pvg-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pvg-pager { display: flex; align-items: center; gap: 3px; }
        .pvg-pager-btn, .pvg-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .pvg-pager-btn:hover:not(:disabled), .pvg-pager-num:hover { border-color: #fcd34d; color: ${PALETTE.amber}; }
        .pvg-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pvg-pager-num.is-active { background: ${PALETTE.amber}; border-color: ${PALETTE.amber}; color: #fff; }
        .pvg-pagesize { margin-left: 5px; }
        .pvg-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        .pvg-drawer-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; background: var(--bg-pure-white); }
        .pvg-drawer-chip { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .pvg-drawer-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .pvg-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
        .pvg-drawer-body { padding: 16px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); }
        .pvg-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 20px 16px; }
        .pvg-card-head { display: flex; align-items: center; gap: 11px; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--border-slate-100); }
        .pvg-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .pvg-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvg-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvg-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvg-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvg-frow-meta { min-width: 0; flex: 1; }
        .pvg-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvg-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvg-frow-ctrl { width: 340px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .pvg-frow { flex-direction: column; align-items: stretch; gap: 8px; }
          .pvg-frow-ctrl { width: 100%; }
        }
        .pvg-drawer-body .ant-input, .pvg-drawer-body .ant-input-affix-wrapper, .pvg-drawer-body .ant-input-number, .pvg-drawer-body .pvg-dd.sd-trigger { border-radius: 6px !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-color) !important; box-shadow: none !important; }
        .pvg-drawer-body .ant-input-lg, .pvg-drawer-body .ant-input-number-lg { height: 40px; }
        .pvg-drawer-body .pvg-dd.sd-trigger { display: flex; align-items: center; }
        .pvg-drawer-foot { padding: 14px 22px; border-top: 1px solid var(--border-color); background: var(--bg-pure-white); display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; }

        @media (max-width: 900px) {
          .pvg-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pvg-header-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .pvg-search-wrap {
            flex: 1;
            min-width: 200px;
          }
          .pvg-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
        }
        @media (max-width: 500px) {
          .pvg-add-btn {
            width: 100%;
          }
          .pvg-tabs {
            flex-direction: column;
            align-items: stretch;
          }
          .pvg-tab {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
