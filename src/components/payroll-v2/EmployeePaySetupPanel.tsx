'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Table, Tag, Drawer, Input, InputNumber, Select, message, Tooltip, Space, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, ReloadOutlined, SearchOutlined, CloseOutlined, FilterOutlined,
  CloseCircleOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, DollarOutlined, StopOutlined,
  IdcardOutlined, HistoryOutlined, PieChartOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmployeeProfileDrawer from './EmployeeProfileDrawer';
import AssignmentHistoryDrawer from './AssignmentHistoryDrawer';
import PayrollV2Service, {
  MemberOption, EmployeeAssignmentListItem, PayStructureListItem, AssignmentComponent, StructureTotals, ComponentCategory, EmployeeProfile,
} from '@/services/payrollV2Service';

const PALETTE = { slate: '#64748B', blue: '#3B82F6', green: '#10B981', red: '#EF4444', violet: '#8B5CF6', amber: '#F59E0B', grey: '#94A3B8' } as const;
const TINT = { slate: 'rgba(100,116,139,0.12)', blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', amber: 'rgba(245,158,11,0.10)' } as const;
const CAT_COLOR: Record<ComponentCategory, string> = { earning: PALETTE.green, deduction: PALETTE.red, reimbursement: PALETTE.blue, benefit: PALETTE.violet };

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
type StatusFilter = 'all' | 'assigned' | 'unassigned';

interface Row {
  employee: MemberOption;
  assignment: EmployeeAssignmentListItem | null;
}

// Divided settings row (General-Settings style): label + hint on the left,
// control on the right.
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pvep-frow">
      <div className="pvep-frow-meta">
        <div className="pvep-frow-label">{label}</div>
        {hint && <div className="pvep-frow-hint">{hint}</div>}
      </div>
      <div className="pvep-frow-ctrl">{children}</div>
    </div>
  );
}

// Rounded section card with an icon-chip header + optional right-side action.
function DrawerCard({ icon, tint, color, title, subtitle, action, children }: {
  icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="pvep-card">
      <div className="pvep-card-head">
        <div className="pvep-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div className="pvep-card-title">{title}</div><div className="pvep-card-sub">{subtitle}</div></div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function EmployeePaySetupPanel() {
  const { canReadPayrollEmployees, canCreatePayrollEmployees, canUpdatePayrollEmployees, canDeletePayrollEmployees } = usePermission();
  console.log("Forcing HMR reload for EmployeePaySetupPanel");

  const [employees, setEmployees] = useState<MemberOption[]>([]);
  const [assignments, setAssignments] = useState<EmployeeAssignmentListItem[]>([]);
  const [structures, setStructures] = useState<PayStructureListItem[]>([]);
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // profile drawer
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<MemberOption | null>(null);

  // history drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEmp, setHistoryEmp] = useState<MemberOption | null>(null);

  // drawer
  const [open, setOpen] = useState(false);
  const [emp, setEmp] = useState<MemberOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [structureId, setStructureId] = useState<string | undefined>(undefined);
  const [monthlyCtc, setMonthlyCtc] = useState<number>(0);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<{ components: AssignmentComponent[]; totals: StructureTotals } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, asg, structs, profs] = await Promise.all([
        PayrollV2Service.getEmployeesForSelect(),
        PayrollV2Service.listAssignments(),
        PayrollV2Service.listStructures(false),
        PayrollV2Service.listEmployeeProfiles(),
      ]);
      setEmployees(emps); setAssignments(asg); setStructures(structs); setProfiles(profs);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load employees');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (canReadPayrollEmployees) load(); }, [canReadPayrollEmployees, load]);

  const assignByEmployee = useMemo(() => {
    const m = new Map<string, EmployeeAssignmentListItem>();
    assignments.forEach((a) => m.set(a.employeeId, a));
    return m;
  }, [assignments]);

  const profileByEmployee = useMemo(() => {
    const m = new Map<string, EmployeeProfile>();
    profiles.forEach((p) => m.set(p.employeeId, p));
    return m;
  }, [profiles]);

  const openProfile = (e: MemberOption) => { setProfileEmp(e); setProfileOpen(true); };
  const openHistory = (e: MemberOption) => { setHistoryEmp(e); setHistoryOpen(true); };
  // A profile is "complete enough" for payroll when PAN + bank account are present.
  const profileReady = (p?: EmployeeProfile) => !!(p && p.pan && p.bankAccountNumber);

  const rows: Row[] = useMemo(
    () => employees.map((e) => ({ employee: e, assignment: assignByEmployee.get(e.value) ?? null })),
    [employees, assignByEmployee]
  );

  const stats = useMemo(() => {
    const totalEmp = rows.length;
    const assigned = rows.filter((r) => r.assignment).length;
    const ctcs = rows.filter((r) => r.assignment).map((r) => r.assignment!.monthlyCtc);
    const avg = ctcs.length ? ctcs.reduce((s, n) => s + n, 0) / ctcs.length : 0;
    return { totalEmp, assigned, unassigned: totalEmp - assigned, avg };
  }, [rows]);

  const statCells = [
    { key: 'emp', title: 'Employees', value: String(stats.totalEmp), period: 'total', icon: <TeamOutlined />, color: PALETTE.slate, tint: TINT.slate },
    { key: 'assigned', title: 'Assigned', value: String(stats.assigned), period: `of ${stats.totalEmp}`, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'unassigned', title: 'Not set up', value: String(stats.unassigned), period: 'pending', icon: <StopOutlined />, color: PALETTE.amber, tint: TINT.amber },
    { key: 'avg', title: 'Avg Monthly CTC', value: money(stats.avg), period: 'assigned', icon: <DollarOutlined />, color: PALETTE.blue, tint: TINT.blue },
  ];

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => rows.filter((r) => {
    if (q && !r.employee.label.toLowerCase().includes(q) && !(r.employee.position ?? '').toLowerCase().includes(q)) return false;
    if (statusFilter === 'assigned' && !r.assignment) return false;
    if (statusFilter === 'unassigned' && r.assignment) return false;
    return true;
  }), [rows, q, statusFilter]);

  const hasFilters = !!search || statusFilter !== 'all';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(total, page * pageSize);
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // ── drawer ───────────────────────────────────────────────────────────────
  const openAssign = (r: Row) => {
    setEmp(r.employee);
    setNotes(r.assignment?.notes ?? '');
    setEffectiveFrom(r.assignment?.effectiveFrom ?? '');
    if (r.assignment) {
      setStructureId(r.assignment.structureId);
      setMonthlyCtc(r.assignment.monthlyCtc);
    } else {
      const first = structures[0];
      setStructureId(first?.id);
      setMonthlyCtc(first?.monthlyCtc ?? 0);
    }
    setPreview(null);
    setOpen(true);
  };

  // live preview (debounced)
  useEffect(() => {
    if (!open || !structureId) { setPreview(null); return; }
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      try {
        const res = await PayrollV2Service.previewAssignment({ structureId, monthlyCtc: monthlyCtc || 0 });
        setPreview(res);
      } catch { /* best-effort */ }
    }, 300);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [open, structureId, monthlyCtc]);

  const submit = async () => {
    if (!emp) return;
    if (!structureId) { message.error('Select a salary structure'); return; }
    if (!monthlyCtc || monthlyCtc <= 0) { message.error('Enter a monthly CTC'); return; }
    setSaving(true);
    try {
      await PayrollV2Service.assign({
        employeeId: emp.value, structureId, monthlyCtc,
        effectiveFrom: effectiveFrom || undefined, notes: notes.trim() || null,
      });
      message.success('Salary assigned');
      setOpen(false); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to assign salary'); }
    finally { setSaving(false); }
  };

  const revoke = async (a: EmployeeAssignmentListItem) => {
    try { await PayrollV2Service.revokeAssignment(a.id); message.success('Assignment revoked'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to revoke'); }
  };

  const initials = (name: string) => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const columns: ColumnsType<Row> = [
    {
      title: 'Employee', key: 'employee',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={30} src={r.employee.avatarUrl || undefined} style={{ background: TINT.slate, color: PALETTE.slate, fontSize: 12, fontWeight: 700 }}>
            {!r.employee.avatarUrl && (r.employee.label ? initials(r.employee.label) : <UserOutlined />)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>{r.employee.label}</div>
            {r.employee.position && <div style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>{r.employee.position}</div>}
          </div>
        </div>
      ),
    },
    { title: 'Structure', key: 'structure', render: (_, r) => r.assignment?.structureName ? <Tag color="geekblue">{r.assignment.structureName}</Tag> : <span style={{ color: 'var(--text-slate-300)' }}>—</span> },
    { title: 'Monthly CTC', key: 'monthly', render: (_, r) => r.assignment ? <span style={{ fontWeight: 600 }}>{money(r.assignment.monthlyCtc)}</span> : <span style={{ color: 'var(--text-slate-300)' }}>—</span> },
    { title: 'Annual CTC', key: 'annual', render: (_, r) => r.assignment ? money(r.assignment.annualCtc) : <span style={{ color: 'var(--text-slate-300)' }}>—</span> },
    { title: 'Status', key: 'status', render: (_, r) => r.assignment ? <Tag color="green">Assigned</Tag> : <Tag>Not set up</Tag> },
    {
      title: 'IDs & Bank', key: 'profile', align: 'center', width: 110,
      render: (_, r) => {
        const ready = profileReady(profileByEmployee.get(r.employee.value));
        return ready
          ? <Tooltip title="PAN & bank on file"><CheckCircleOutlined style={{ color: PALETTE.green, fontSize: 16 }} /></Tooltip>
          : <Tooltip title="Missing PAN / bank"><span style={{ color: 'var(--text-slate-300)' }}>—</span></Tooltip>;
      },
    },
    {
      title: '', key: 'actions', width: 200, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {r.assignment && <Tooltip title="Compensation history"><Button size="small" type="text" icon={<HistoryOutlined />} onClick={() => openHistory(r.employee)} /></Tooltip>}
          <Tooltip title="Statutory & bank IDs"><Button size="small" type="text" icon={<IdcardOutlined />} onClick={() => openProfile(r.employee)} /></Tooltip>
          {canCreatePayrollEmployees && (
            <Button size="small" type={r.assignment ? 'default' : 'primary'} icon={r.assignment ? <EditOutlined /> : <PlusOutlined />} onClick={() => openAssign(r)}>
              {r.assignment ? 'Revise' : 'Assign'}
            </Button>
          )}
          {canDeletePayrollEmployees && r.assignment && (
            <ConfirmDialog tone="danger" icon={<StopOutlined />} title="Revoke this assignment?" description={`${r.employee.label}'s salary setup will be cleared.`} confirmText="Revoke" placement="bottomRight" onConfirm={() => revoke(r.assignment!)}>
              <Tooltip title="Revoke"><Button size="small" type="text" danger icon={<StopOutlined />} /></Tooltip>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadPayrollEmployees) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view employee pay setup.</div>;
  }

  const structureOptions = structures.map((s) => ({ value: s.id, label: `${s.name} · ${money(s.monthlyCtc)}/mo` }));
  const selectedStructure = structures.find((s) => s.id === structureId);
  const annualPreview = (monthlyCtc || 0) * 12;

  return (
    <div className="pvep">
      <div className="pvep-header">
        <div className="pvep-header-about">
          <div className="pvep-header-icon"><TeamOutlined /></div>
          <div>
            <div className="pvep-header-title">Employee Pay Setup</div>
            <div className="pvep-header-sub">Assign salary structures and CTC to employees</div>
          </div>
        </div>
        <div className="pvep-header-actions">
          <div className="pvep-search-wrap">
            <SearchOutlined className="pvep-search-icon" />
            <input className="pvep-search" placeholder="Search name or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="pvep-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
        </div>
      </div>

      <div className="pvep-stats">
        {statCells.map((s) => (
          <div key={s.key} className="pvep-stat-card">
            <div className="pvep-stat-left"><span className="pvep-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span><span className="pvep-stat-label">{s.title}</span></div>
            <div className="pvep-stat-value-wrap"><span className="pvep-stat-value">{s.value}</span><span className="pvep-stat-period">{s.period}</span></div>
          </div>
        ))}
      </div>

      <div className="pvep-filters">
        <span className="pvep-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown className="pvep-dd" placeholder="Status" searchPlaceholder="Search" itemNoun="statuses"
          value={statusFilter === 'all' ? undefined : statusFilter} onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
          options={[{ value: 'assigned', label: 'Assigned' }, { value: 'unassigned', label: 'Not set up' }]} style={{ width: 170 }} width={210} />
        <span className="pvep-filter-count">{filtered.length} of {rows.length}</span>
        {hasFilters && <button type="button" className="pvep-clear" onClick={() => { setSearch(''); setStatusFilter('all'); }}><CloseCircleOutlined /> Clear</button>}
      </div>

      <div className="pvep-table-wrap">
        <Table rowKey={(r) => r.employee.value} size="small" className="pvep-table" loading={loading} columns={columns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvep-row' })} />
      </div>

      {total > 0 && (
        <div className="pvep-footer pvep-footer--sticky">
          <div className="pvep-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="pvep-pager">
            <button type="button" className="pvep-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pvep-pager-num ${p === page ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="pvep-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select className="pvep-pagesize" size="small" value={pageSize} onChange={(v) => { setPageSize(v); setPage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
          </div>
        </div>
      )}

      {/* ── STATUTORY & BANK PROFILE DRAWER ─────────────────────────────────── */}
      <EmployeeProfileDrawer
        open={profileOpen}
        employee={profileEmp}
        canEdit={canUpdatePayrollEmployees}
        onClose={() => setProfileOpen(false)}
        onSaved={load}
      />

      {/* ── COMPENSATION HISTORY DRAWER ─────────────────────────────────────── */}
      <AssignmentHistoryDrawer open={historyOpen} employee={historyEmp} onClose={() => setHistoryOpen(false)} />

      {/* ── ASSIGN DRAWER ───────────────────────────────────────────────────── */}
      <Drawer title={null} open={open} onClose={() => setOpen(false)} width={760} closable={false} destroyOnClose
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvep-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <Avatar size={40} src={emp?.avatarUrl || undefined} style={{ background: TINT.slate, color: PALETTE.slate, fontWeight: 700, flexShrink: 0 }}>
                {emp && !emp.avatarUrl && initials(emp.label)}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <div className="pvep-drawer-title">{emp?.label}</div>
                <div className="pvep-drawer-sub">{emp?.position || 'Assign salary structure & CTC'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setOpen(false)} />
          </div>

          <div className="pvep-drawer-body">
            <DrawerCard icon={<DollarOutlined />} tint={TINT.blue} color={PALETTE.blue} title="Compensation" subtitle="Structure, CTC and when it takes effect">
              <Field label="Salary structure" hint="Frozen as a snapshot when you assign">
                <SearchableDropdown className="pvep-ddf" placeholder="Select structure" searchPlaceholder="Search structures" itemNoun="structures" allowClear={false}
                  value={structureId} onChange={(v) => { setStructureId(v as string); const s = structures.find((x) => x.id === v); if (s && (!monthlyCtc || monthlyCtc === 0)) setMonthlyCtc(s.monthlyCtc); }}
                  options={structureOptions} style={{ width: '100%', height: 40 }} width={360} />
              </Field>
              <Field label="Monthly CTC" hint="Cost-to-company per month">
                <InputNumber size="large" min={0} max={100000000} step={1000} style={{ width: '100%' }} value={monthlyCtc}
                  formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v || '').replace(/[^\d.]/g, '')) as any}
                  onChange={(v) => setMonthlyCtc(Number(v ?? 0))} />
              </Field>
              <Field label="Annual CTC" hint="Monthly CTC × 12">
                <div className="pvep-readout">{money(annualPreview)}</div>
              </Field>
              <Field label="Effective from" hint="When this compensation applies">
                <input type="date" className="pvep-date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
              </Field>
              <Field label="Notes" hint="e.g. joining or revision reason">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="e.g. Joining / revision reason" />
              </Field>
            </DrawerCard>

            <div style={{ height: 14 }} />

            {/* live breakdown */}
            <DrawerCard icon={<PieChartOutlined />} tint={TINT.slate} color={PALETTE.slate} title="Breakdown" subtitle={selectedStructure ? selectedStructure.name : 'Live preview of the salary split'}>
              {!preview ? (
                <div className="pvep-empty">Pick a structure and CTC to preview the breakdown.</div>
              ) : (
                <>
                  <div className="pvep-bd">
                    {preview.components.map((c) => (
                      <div key={c.componentId} className="pvep-bd-row">
                        <span className="pvep-bd-dot" style={{ background: CAT_COLOR[c.category] }} />
                        <span className="pvep-bd-name">{c.name}</span>
                        <span className="pvep-bd-rule">{c.calculationType === 'percentage' ? `${c.value}% of ${c.percentageOf}` : 'fixed'}</span>
                        <span className="pvep-bd-amt" style={{ color: c.category === 'deduction' ? PALETTE.red : 'var(--text-slate-900)' }}>
                          {c.category === 'deduction' ? '−' : ''}{money(c.calculatedAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pvep-totals">
                    <div><span>Gross</span><strong>{money(preview.totals.grossSalary)}</strong></div>
                    <div><span>Deductions</span><strong style={{ color: PALETTE.red }}>−{money(preview.totals.totalDeductions)}</strong></div>
                    <div><span>Net pay</span><strong>{money(preview.totals.netSalary)}</strong></div>
                    <div><span>CTC</span><strong>{money(preview.totals.ctc)}</strong></div>
                    {!preview.totals.balanced && <div className="pvep-warn">⚠ {preview.totals.warning || 'Unbalanced'}</div>}
                  </div>
                </>
              )}
            </DrawerCard>
          </div>

          <div className="pvep-drawer-foot">
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>Breakdown is frozen at assignment time</span>
            <Space size={10}>
              <Button onClick={() => setOpen(false)} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={submit} icon={<CheckCircleOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Assign Salary</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvep { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvep-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .pvep-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .pvep-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.slate}; color: ${PALETTE.slate}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvep-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvep-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvep-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pvep-search-wrap { display: flex; align-items: center; height: 34px; width: 230px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pvep-search-wrap:focus-within { border-color: #cbd5e1; box-shadow: 0 0 0 3px rgba(100,116,139,0.10); }
        .pvep-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pvep-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pvep-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }

        .pvep-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pvep-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 86px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvep-stat-left { display: flex; align-items: center; gap: 8px; }
        .pvep-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pvep-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pvep-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pvep-stat-value { font-size: 22px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pvep-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        .pvep-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .pvep-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .pvep-filter-label .anticon { color: var(--text-slate-400); font-size: 13px; }
        .pvep-filter-count { font-size: 12px; color: var(--text-slate-500); }
        .pvep-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }

        .pvep-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pvep-table, .pvep-table.ant-table-wrapper, .pvep-table .ant-table, .pvep-table .ant-table-container, .pvep-table .ant-table-content, .pvep-table .ant-table-header, .pvep-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pvep-table .ant-table-thead > tr > th,
        .pvep-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .pvep-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .pvep-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pvep-table .ant-table-tbody > tr.pvep-row:hover > td { background: var(--bg-slate-50) !important; }

        .pvep-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .pvep-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .pvep-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pvep-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pvep-pager { display: flex; align-items: center; gap: 3px; }
        .pvep-pager-btn, .pvep-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .pvep-pager-btn:hover:not(:disabled), .pvep-pager-num:hover { border-color: #cbd5e1; color: ${PALETTE.slate}; }
        .pvep-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pvep-pager-num.is-active { background: ${PALETTE.slate}; border-color: ${PALETTE.slate}; color: #fff; }
        .pvep-pagesize { margin-left: 5px; }
        .pvep-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        .pvep-drawer-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; background: var(--bg-pure-white); }
        .pvep-drawer-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .pvep-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
        .pvep-drawer-body { padding: 16px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); }
        .pvep-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 20px 16px; }
        .pvep-card-head { display: flex; align-items: center; gap: 11px; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--border-slate-100); }
        .pvep-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .pvep-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvep-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvep-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvep-frow:first-child { padding-top: 6px; }
        .pvep-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvep-frow-meta { min-width: 0; flex: 1; }
        .pvep-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvep-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvep-frow-ctrl { width: 340px; flex-shrink: 0; }
        @media (max-width: 640px) { .pvep-frow { flex-direction: column; align-items: stretch; gap: 8px; } .pvep-frow-ctrl { width: 100%; } }
        .pvep-readout { height: 40px; width: 100%; display: flex; align-items: center; padding: 0 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-slate-50); font-weight: 700; color: var(--text-slate-700); }
        .pvep-date { height: 40px; width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0 12px; font-size: 13px; color: var(--text-slate-900); background: var(--bg-pure-white); }
        .pvep-drawer-body .ant-input, .pvep-drawer-body .ant-input-number, .pvep-drawer-body .pvep-ddf.sd-trigger { border-radius: 6px !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-color) !important; box-shadow: none !important; }
        .pvep-drawer-body .ant-input-number-lg { height: 40px; }
        .pvep-drawer-body .pvep-ddf.sd-trigger { display: flex; align-items: center; }

        .pvep-empty { padding: 18px; text-align: center; color: var(--text-slate-400); font-size: 13px; }
        .pvep-bd { display: flex; flex-direction: column; }
        .pvep-bd-row { display: grid; grid-template-columns: 14px 1fr auto auto; gap: 10px; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvep-bd-row:last-child { border-bottom: none; }
        .pvep-bd-dot { width: 8px; height: 8px; border-radius: 2px; }
        .pvep-bd-name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .pvep-bd-rule { font-size: 11px; color: var(--text-slate-400); }
        .pvep-bd-amt { font-size: 13px; font-weight: 700; min-width: 90px; text-align: right; }
        .pvep-totals { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-slate-200); align-items: center; }
        .pvep-totals > div { display: flex; flex-direction: column; gap: 2px; }
        .pvep-totals span { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); }
        .pvep-totals strong { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .pvep-warn { margin-left: auto; color: ${PALETTE.amber}; font-size: 12px; font-weight: 700; }
        .pvep-drawer-foot { padding: 14px 22px; border-top: 1px solid var(--border-color); background: var(--bg-pure-white); display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; }
      `}</style>
    </div>
  );
}
