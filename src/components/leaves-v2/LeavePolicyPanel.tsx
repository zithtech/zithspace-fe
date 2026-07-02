'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Row,
  Col,
  Space,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  BookOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  UsergroupAddOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LeaveV2Service, {
  LeavePolicyListItem,
  LeavePolicyDetail,
  LeaveTypeV2,
  PolicyScopeType,
  ScopeOption,
  TermCycle,
  AccrualMethod,
  TERM_MONTHS,
} from '@/services/leaveV2Service';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
} as const;

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const SCOPE_TYPES: { value: PolicyScopeType; label: string }[] = [
  { value: 'grade', label: 'Grade' },
  { value: 'department', label: 'Department' },
  { value: 'subdepartment', label: 'Sub-department' },
  { value: 'position', label: 'Position' },
  { value: 'user', label: 'User' },
  { value: 'org', label: 'Everyone (org-wide)' },
];
const scopeLabel = (t: PolicyScopeType) => SCOPE_TYPES.find((s) => s.value === t)?.label ?? t;

const TERM_OPTIONS: { value: TermCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly (1 mo)' },
  { value: 'quarterly', label: 'Quarterly (3 mo)' },
  { value: 'half_yearly', label: 'Half-yearly (6 mo)' },
  { value: 'yearly', label: 'Yearly (12 mo)' },
];
const termLabel = (t: TermCycle) => TERM_OPTIONS.find((o) => o.value === t)?.label ?? t;
const ACCRUAL_OPTIONS: { value: AccrualMethod; label: string }[] = [
  { value: 'monthly', label: 'Monthly accrual' },
  { value: 'term_total', label: 'Whole term' },
];

const slugifyCode = (name: string): string =>
  (name || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

const fieldLabel = (t: string) => (
  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>{t}</span>
);

// ── Sparkline (canonical) ────────────────────────────────────────────────────
const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96, h = 34;
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * stepX, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const gid = `lvpspk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
const TRENDS = { a: [3, 5, 4, 6, 7, 6, 8], b: [2, 3, 3, 4, 5, 6, 7], c: [4, 4, 5, 5, 6, 6, 7], d: [1, 2, 2, 3, 3, 4, 5] };

type StatusFilter = 'all' | 'active' | 'inactive';

interface DraftAssignment { scopeType: PolicyScopeType; scopeId: string | null }
interface DraftLine {
  key: string;
  leaveTypeId?: string;
  accrualMethod: AccrualMethod;
  countPerPeriod: number;
  carryForward: boolean;
  carryForwardMax: number | null;
}

// Stable, collision-proof row id (survives dev Fast Refresh, unlike a module counter).
const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `l-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const newLine = (): DraftLine => ({ key: uid(), accrualMethod: 'monthly', countPerPeriod: 1, carryForward: false, carryForwardMax: null });

export default function LeavePolicyPanel() {
  const { canReadLeavePolicy, canCreateLeavePolicy, canUpdateLeavePolicy, canDeleteLeavePolicy } = usePermission();

  const [rows, setRows] = useState<LeavePolicyListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // pagination
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicyListItem | null>(null);

  // drawer fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [termCycle, setTermCycle] = useState<TermCycle>('yearly');
  const [lopOnExhaustion, setLopOnExhaustion] = useState(true);
  const [assignments, setAssignments] = useState<DraftAssignment[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([]);

  // assignment picker
  const [scopeTypePick, setScopeTypePick] = useState<PolicyScopeType | undefined>();
  const [scopeCache, setScopeCache] = useState<Record<string, ScopeOption[]>>({});
  const [scopeLoading, setScopeLoading] = useState(false);

  // leave types for allocation lines (all, so names resolve in expanded rows)
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeV2[]>([]);

  // expandable child-row detail cache
  const [expandedCache, setExpandedCache] = useState<Record<string, LeavePolicyDetail>>({});
  const [expandLoading, setExpandLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await LeaveV2Service.listPolicies(true));
      setExpandedCache({}); // invalidate child-row cache on refresh
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadLeavePolicy) load();
  }, [canReadLeavePolicy, load]);

  // Load all leave types once (active ones drive the dropdown; all resolve names).
  useEffect(() => {
    LeaveV2Service.listLeaveTypes(true).then(setLeaveTypes).catch(() => {});
  }, []);

  const onExpandRow = async (expanded: boolean, record: LeavePolicyListItem) => {
    if (!expanded || expandedCache[record.id]) return;
    setExpandLoading((s) => ({ ...s, [record.id]: true }));
    try {
      const d = await LeaveV2Service.getPolicy(record.id);
      setExpandedCache((c) => ({ ...c, [record.id]: d }));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load policy details');
    } finally {
      setExpandLoading((s) => ({ ...s, [record.id]: false }));
    }
  };

  const ensureScopeOptions = useCallback(
    async (type: PolicyScopeType) => {
      if (type === 'org' || scopeCache[type]) return;
      setScopeLoading(true);
      try {
        const opts = await LeaveV2Service.getScopeOptions(type);
        setScopeCache((c) => ({ ...c, [type]: opts }));
      } catch {
        // leave empty on failure
      } finally {
        setScopeLoading(false);
      }
    },
    [scopeCache]
  );

  const labelFor = (a: DraftAssignment): string => {
    if (a.scopeType === 'org') return 'Everyone';
    const opt = (scopeCache[a.scopeType] || []).find((o) => o.value === a.scopeId);
    return opt?.label ?? a.scopeId ?? '—';
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.isActive).length,
    allocations: rows.reduce((s, r) => s + r.lineCount, 0),
    targets: rows.reduce((s, r) => s + r.assignmentCount, 0),
  }), [rows]);

  const statCells = [
    { key: 'total', title: 'Total Policies', value: stats.total, period: 'configured', icon: <ProfileOutlined />, color: PALETTE.blue, tint: TINT.blue, trend: TRENDS.a },
    { key: 'active', title: 'Active', value: stats.active, period: `of ${stats.total}`, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green, trend: TRENDS.b },
    { key: 'alloc', title: 'Allocations', value: stats.allocations, period: 'leave lines', icon: <BookOutlined />, color: PALETTE.grey, tint: TINT.grey, trend: TRENDS.c },
    { key: 'targets', title: 'Targets', value: stats.targets, period: 'groups covered', icon: <TeamOutlined />, color: PALETTE.red, tint: TINT.red, trend: TRENDS.d },
  ];

  // ── Filtering + paging ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      if (statusFilter === 'active' && !r.isActive) return false;
      if (statusFilter === 'inactive' && r.isActive) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const pagedRows = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  useEffect(() => { setTablePage(1); }, [search, statusFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);

  const hasActiveFilters = !!search || statusFilter !== 'active';
  const clearFilters = () => { setSearch(''); setStatusFilter('active'); };

  // ── Drawer open/reset ────────────────────────────────────────────────────────
  const resetForm = () => {
    setName(''); setCode(''); setCodeTouched(false); setDescription(''); setIsActive(true);
    setTermCycle('yearly'); setLopOnExhaustion(true);
    setAssignments([]); setLines([newLine()]);
    setScopeTypePick(undefined);
  };

  const monthsInTerm = TERM_MONTHS[termCycle];
  const lineTotal = (l: DraftLine) => (l.accrualMethod === 'monthly' ? l.countPerPeriod * monthsInTerm : l.countPerPeriod);
  const policyTotal = lines.filter((l) => l.leaveTypeId).reduce((s, l) => s + lineTotal(l), 0);

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = async (row: LeavePolicyListItem) => {
    setEditingId(row.id);
    resetForm();
    setCodeTouched(true);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const d = await LeaveV2Service.getPolicy(row.id);
      setName(d.name); setCode(d.code); setDescription(d.description ?? ''); setIsActive(d.isActive);
      setTermCycle(d.termCycle); setLopOnExhaustion(d.lopOnExhaustion);
      setAssignments(d.assignments.map((a) => ({ scopeType: a.scopeType, scopeId: a.scopeId })));
      setLines(
        d.lines.length
          ? d.lines.map((l) => ({ key: uid(), leaveTypeId: l.leaveTypeId, accrualMethod: l.accrualMethod, countPerPeriod: l.countPerPeriod, carryForward: l.carryForward, carryForwardMax: l.carryForwardMax }))
          : [newLine()]
      );
      // resolve chip labels
      const types = Array.from(new Set(d.assignments.map((a) => a.scopeType)));
      await Promise.all(types.filter((t) => t !== 'org').map(ensureScopeOptions));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load policy');
      setDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const onNameChange = (v: string) => {
    setName(v);
    if (!editingId && !codeTouched) setCode(slugifyCode(v));
  };

  // ── Assignment helpers ───────────────────────────────────────────────────────
  const onScopeTypeChange = (v?: PolicyScopeType) => {
    setScopeTypePick(v);
    if (v) ensureScopeOptions(v);
  };

  // Currently-selected ids for a scope type (drives the multi-select value).
  const scopeIdsFor = (type: PolicyScopeType) =>
    assignments.filter((a) => a.scopeType === type && a.scopeId).map((a) => a.scopeId as string);

  // Replace all assignments of a scope type with the new selection (auto-commit).
  const setScopeSelection = (type: PolicyScopeType, ids: string[]) =>
    setAssignments((prev) => [
      ...prev.filter((a) => a.scopeType !== type),
      ...ids.map((id) => ({ scopeType: type, scopeId: id })),
    ]);

  const toggleOrg = (on: boolean) =>
    setAssignments((prev) =>
      on
        ? [...prev.filter((a) => a.scopeType !== 'org'), { scopeType: 'org', scopeId: null }]
        : prev.filter((a) => a.scopeType !== 'org')
    );

  const removeAssignment = (a: DraftAssignment) =>
    setAssignments((prev) => prev.filter((x) => !(x.scopeType === a.scopeType && x.scopeId === a.scopeId)));

  // ── Line helpers ─────────────────────────────────────────────────────────────
  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));
  const addLine = () => {
    const l = newLine();
    setLines((prev) => [...prev, l]);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!name.trim()) return message.error('Policy name is required');
    if (!code.trim()) return message.error('Code is required');
    if (assignments.length === 0) return message.error('Add at least one target under "Applies To"');
    const validLines = lines.filter((l) => l.leaveTypeId);
    if (validLines.length === 0) return message.error('Add at least one leave allocation');

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || null,
        isActive,
        termCycle,
        lopOnExhaustion,
        assignments: assignments.map((a) => ({ scopeType: a.scopeType, scopeId: a.scopeId })),
        lines: validLines.map((l) => ({
          leaveTypeId: l.leaveTypeId!,
          accrualMethod: l.accrualMethod,
          countPerPeriod: l.countPerPeriod || 0,
          carryForward: l.carryForward,
          carryForwardMax: l.carryForward ? l.carryForwardMax ?? null : null,
        })),
      };
      if (editingId) {
        await LeaveV2Service.updatePolicy(editingId, payload);
        message.success('Policy updated');
      } else {
        await LeaveV2Service.createPolicy(payload);
        message.success('Policy created');
      }
      setDrawerOpen(false);
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: LeavePolicyListItem) => {
    try {
      await LeaveV2Service.deletePolicy(row.id);
      message.success('Policy deleted');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete policy');
    }
  };

  // ── Table ──────────────────────────────────────────────────────────────────
  const columns: ColumnsType<LeavePolicyListItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: r.isActive ? PALETTE.blue : PALETTE.grey, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Term', dataIndex: 'termCycle', key: 'termCycle', render: (v: TermCycle) => <span style={{ color: 'var(--text-slate-600)' }}>{termLabel(v).split(' ')[0]}</span> },
    {
      title: 'Applies To',
      dataIndex: 'assignmentCount',
      key: 'assignmentCount',
      render: (v) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-slate-600)' }}>
          <ApartmentOutlined style={{ color: PALETTE.grey }} /> {v} target{v === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      title: 'Leave Types',
      dataIndex: 'lineCount',
      key: 'lineCount',
      render: (v) => <Tag color="blue">{v} mapped</Tag>,
    },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '',
      key: 'actions',
      width: 90,
      align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdateLeavePolicy && (
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
          )}
          {canDeleteLeavePolicy && (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined />}
              title="Delete this policy?"
              description={`"${r.name}" and its assignments & allocations will be removed.`}
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

  if (!canReadLeavePolicy) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view leave policies.</div>;
  }

  const leaveTypeMeta = (id: string) => leaveTypes.find((t) => t.id === id);
  const leaveTypeName = (id?: string) => leaveTypes.find((t) => t.id === id)?.name ?? id ?? '';
  const usedLeaveTypeIds = (exceptKey: string) =>
    new Set(lines.filter((l) => l.key !== exceptKey && l.leaveTypeId).map((l) => l.leaveTypeId));

  // Group a policy's assignments by scope type → "2 Departments · 1 Grade · Everyone".
  const targetSummary = (d: LeavePolicyDetail): string => {
    const counts: Record<string, number> = {};
    d.assignments.forEach((a) => { counts[a.scopeType] = (counts[a.scopeType] || 0) + 1; });
    return Object.entries(counts)
      .map(([t, n]) => (t === 'org' ? 'Everyone' : `${n} ${scopeLabel(t as PolicyScopeType)}${n > 1 ? 's' : ''}`))
      .join(' · ') || '—';
  };

  // Expanded child row — the policy's leave-type allocation details.
  const expandedRowRender = (record: LeavePolicyListItem) => {
    const d = expandedCache[record.id];
    if (expandLoading[record.id] || !d) {
      return <div style={{ padding: '14px 16px', color: 'var(--text-slate-400)', fontSize: 12.5 }}><Spin size="small" /> &nbsp;Loading details…</div>;
    }
    const childCols: ColumnsType<typeof d.lines[number]> = [
      {
        title: 'Leave Type',
        key: 'lt',
        render: (_, l) => {
          const t = leaveTypeMeta(l.leaveTypeId);
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: t?.color || PALETTE.grey, display: 'inline-block' }} />
              <span style={{ fontWeight: 600 }}>{t?.name ?? l.leaveTypeId}</span>
            </span>
          );
        },
      },
      { title: 'Accrual', key: 'accrual', render: (_, l) => (l.accrualMethod === 'monthly' ? 'Monthly accrual' : 'Whole term') },
      { title: 'Count', key: 'count', render: (_, l) => `${l.countPerPeriod} ${l.accrualMethod === 'monthly' ? '/ month' : '/ term'}` },
      { title: `Total / ${termLabel(d.termCycle).split(' ')[0].toLowerCase()}`, key: 'total', render: (_, l) => <strong style={{ color: PALETTE.blue }}>{l.allocation ?? '—'}</strong> },
      { title: 'Carry Forward', key: 'cf', render: (_, l) => (l.carryForward ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>) },
      { title: 'Max Carry', key: 'max', render: (_, l) => (l.carryForward ? (l.carryForwardMax ?? '∞') : '—') },
      { title: 'Paid', key: 'paid', render: (_, l) => { const t = leaveTypeMeta(l.leaveTypeId); return t ? (t.isPaid ? <Tag color="green">Paid</Tag> : <Tag>Unpaid</Tag>) : '—'; } },
    ];
    return (
      <div className="lvp-child">
        <div className="lvp-child-meta">
          <span><b>Term:</b> {termLabel(d.termCycle).split(' ')[0]}</span>
          <span className="lvp-child-dot">·</span>
          <span><b>Loss of Pay:</b> {d.lopOnExhaustion ? <Tag color="red">On</Tag> : <Tag>Off</Tag>}</span>
          <span className="lvp-child-dot">·</span>
          <span><b>Applies to:</b> {targetSummary(d)}</span>
        </div>
        <Table rowKey={(l) => l.id ?? l.leaveTypeId} size="small" className="lvp-child-table" columns={childCols} dataSource={d.lines} pagination={false} />
      </div>
    );
  };

  return (
    <div className="lvp">
      {/* 1) HEADER */}
      <div className="lvp-header">
        <div className="lvp-header-about">
          <div className="lvp-header-icon"><BookOutlined /></div>
          <div>
            <div className="lvp-header-title">Leave Policy</div>
            <div className="lvp-header-sub">Assign leave entitlements to grades, departments, positions and people</div>
          </div>
        </div>
        <div className="lvp-header-actions">
          <div className="lvp-search-wrap">
            <SearchOutlined className="lvp-search-icon" />
            <input className="lvp-search" placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="lvp-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreateLeavePolicy && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="lvp-add-btn">New Policy</Button>
          )}
        </div>
      </div>

      {/* 2) STAT CARDS */}
      <div className="lvp-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvp-stat-card">
            <div className="lvp-stat-top">
              <div className="lvp-stat-left">
                <span className="lvp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                <span className="lvp-stat-label">{s.title}</span>
              </div>
            </div>
            <div className="lvp-stat-bottom">
              <div className="lvp-stat-value-wrap">
                <span className="lvp-stat-value">{s.value}</span>
                <span className="lvp-stat-period">{s.period}</span>
              </div>
              <div className="lvp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* 3) FILTERS */}
      <div className="lvp-filters">
        <span className="lvp-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown
          className="lvp-filter-dd"
          placeholder="Status"
          searchPlaceholder="Search statuses"
          itemNoun="statuses"
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(v) => setStatusFilter((v as StatusFilter) ?? 'all')}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          style={{ width: 160 }}
          width={210}
        />
        <span className="lvp-filter-count">{filtered.length} of {rows.length}</span>
        {hasActiveFilters && (
          <button type="button" className="lvp-clear" onClick={clearFilters}><CloseCircleOutlined /> Clear</button>
        )}
      </div>

      {/* 4) TABLE */}
      <div className="lvp-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="lvp-table"
          loading={loading}
          columns={columns}
          dataSource={pagedRows}
          pagination={false}
          onRow={() => ({ className: 'lvp-row' })}
          expandable={{
            expandedRowRender,
            onExpand: onExpandRow,
            rowExpandable: (r) => r.lineCount > 0,
          }}
        />
      </div>

      {total > 0 && (
        <div className="lvp-footer lvp-footer--sticky">
          <div className="lvp-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="lvp-pager">
            <button type="button" className="lvp-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`lvp-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="lvp-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select className="lvp-pagesize" size="small" value={tablePageSize} onChange={(v) => { setTablePageSize(v); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
          </div>
        </div>
      )}

      {/* DRAWER */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        closable={false}
        destroyOnClose
        styles={{ body: { padding: 0, background: 'var(--bg-pure-white)' }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          {/* header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-pure-white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 0, background: editingId ? TINT.green : TINT.blue, color: editingId ? PALETTE.green : PALETTE.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {editingId ? <EditOutlined /> : <PlusOutlined />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{editingId ? 'Edit Leave Policy' : 'New Leave Policy'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>Map leave entitlements to a group of employees</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)} style={{ color: 'var(--text-slate-500)' }} />
          </div>

          {/* content */}
          <div className="lvp-drawer-form" style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
            <Spin spinning={detailLoading}>
              {/* STEP 1 — Basic Details */}
              <Section icon={<InfoCircleOutlined />} tint={TINT.blue} color={PALETTE.blue} title="Basic Details" subtitle="Identify this policy" step="STEP 1">
                <Row gutter={16}>
                  <Col span={24} style={{ marginBottom: 14 }}>
                    {fieldLabel('Policy name')}
                    <Input size="large" style={{ marginTop: 6 }} value={name} maxLength={160} placeholder="e.g. Standard Full-time Policy" onChange={(e) => onNameChange(e.target.value)} />
                  </Col>
                  <Col span={24} style={{ marginBottom: 14 }}>
                    {fieldLabel('Code')}
                    <Input size="large" style={{ marginTop: 6, fontFamily: 'monospace', color: 'var(--text-slate-600)' }} value={code} maxLength={40} placeholder="STANDARD_FULLTIME" disabled={!!editingId} onChange={(e) => { setCode(e.target.value); setCodeTouched(true); }} />
                  </Col>
                  <Col span={24} style={{ marginBottom: 14 }}>
                    {fieldLabel('Description')}
                    <Input.TextArea rows={2} style={{ marginTop: 6 }} value={description} maxLength={500} placeholder="What this policy is for" onChange={(e) => setDescription(e.target.value)} />
                  </Col>
                </Row>
                <div className="lvp-toggle-row">
                  <div><div className="lvp-toggle-title">Active</div><div className="lvp-toggle-desc">Available to assign to employees</div></div>
                  <Switch checked={isActive} onChange={setIsActive} />
                </div>
              </Section>

              {/* STEP 2 — Applies To */}
              <Section icon={<UsergroupAddOutlined />} tint={TINT.green} color={PALETTE.green} title="Applies To" subtitle="Who this policy covers (add one or more targets)" step="STEP 2">
                <Row gutter={12} align="top">
                  <Col span={10}>
                    {fieldLabel('Scope')}
                    <div style={{ marginTop: 6 }}>
                      <SearchableDropdown placeholder="Pick scope" itemNoun="scopes" allowClear={false} value={scopeTypePick} onChange={(v) => onScopeTypeChange(v as PolicyScopeType)} options={SCOPE_TYPES} style={{ width: '100%', height: 38 }} width={220} />
                    </div>
                  </Col>
                  <Col span={14}>
                    {scopeTypePick && scopeTypePick !== 'org' && (
                      <>
                        {fieldLabel(`Select ${scopeLabel(scopeTypePick).toLowerCase()}(s)`)}
                        <Select
                          mode="multiple"
                          style={{ marginTop: 6, width: '100%' }}
                          placeholder={`Select ${scopeLabel(scopeTypePick).toLowerCase()}`}
                          loading={scopeLoading}
                          value={scopeIdsFor(scopeTypePick)}
                          onChange={(ids) => setScopeSelection(scopeTypePick, ids as string[])}
                          options={(scopeCache[scopeTypePick] || []).map((o) => ({ value: o.value, label: o.label }))}
                          filterOption={(i, o) => (o?.label as string).toLowerCase().includes(i.toLowerCase())}
                          maxTagCount="responsive"
                          notFoundContent={scopeLoading ? 'Loading…' : 'No options'}
                        />
                      </>
                    )}
                    {scopeTypePick === 'org' && (
                      <div className="lvp-toggle-row" style={{ marginTop: 22 }}>
                        <div><div className="lvp-toggle-title">Apply org-wide</div><div className="lvp-toggle-desc">Covers every employee</div></div>
                        <Switch checked={assignments.some((a) => a.scopeType === 'org')} onChange={toggleOrg} />
                      </div>
                    )}
                  </Col>
                </Row>

                <div className="lvp-chips">
                  {assignments.length === 0 ? (
                    <div className="lvp-chips-empty">No targets yet — pick a scope and add.</div>
                  ) : (
                    assignments.map((a, i) => (
                      <Tag key={`${a.scopeType}-${a.scopeId}-${i}`} closable onClose={(e) => { e.preventDefault(); removeAssignment(a); }} className="lvp-chip">
                        <span className="lvp-chip-scope">{scopeLabel(a.scopeType)}</span>
                        <span className="lvp-chip-val">{labelFor(a)}</span>
                      </Tag>
                    ))
                  )}
                </div>
              </Section>

              {/* STEP 3 — Accrual & Allocations */}
              <Section icon={<BookOutlined />} tint={TINT.blue} color={PALETTE.blue} title="Accrual & Allocations" subtitle="Term, leave types, and Loss-of-Pay behaviour" step="STEP 3">
                {/* Term + LOP */}
                <Row gutter={12} align="top" style={{ marginBottom: 6 }}>
                  <Col span={12}>
                    {fieldLabel('Accrual term')}
                    <div style={{ marginTop: 6 }}>
                      <SearchableDropdown placeholder="Term" itemNoun="terms" allowClear={false} value={termCycle} onChange={(v) => setTermCycle(v as TermCycle)} options={TERM_OPTIONS} style={{ width: '100%', height: 38 }} width={220} />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="lvp-toggle-row" style={{ marginTop: 26 }}>
                      <div><div className="lvp-toggle-title">Loss of Pay on exhaustion</div><div className="lvp-toggle-desc">Extra leave beyond balance = LOP</div></div>
                      <Switch checked={lopOnExhaustion} onChange={setLopOnExhaustion} />
                    </div>
                  </Col>
                </Row>

                <div className="lvp-alloc-list">
                  {lines.map((l) => {
                    const used = usedLeaveTypeIds(l.key);
                    const opts = leaveTypes.filter((t) => t.isActive && !used.has(t.id)).map((t) => ({ value: t.id, label: t.name }));
                    const total = lineTotal(l);
                    return (
                      <div key={l.key} className="lvp-alloc">
                        <div className="lvp-alloc-row">
                          <div style={{ flex: 1 }}>
                            <SearchableDropdown placeholder="Select leave type" itemNoun="leave types" allowClear={false} value={l.leaveTypeId} onChange={(v) => updateLine(l.key, { leaveTypeId: v as string })} options={opts} style={{ width: '100%', height: 36 }} width={240} />
                          </div>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={lines.length === 1} onClick={() => removeLine(l.key)} />
                        </div>
                        <div className="lvp-alloc-fields">
                          <div className="lvp-field" style={{ width: 168 }}>
                            <span className="lvp-field-label">Accrual</span>
                            <SearchableDropdown placeholder="Accrual" itemNoun="methods" allowClear={false} value={l.accrualMethod} onChange={(v) => updateLine(l.key, { accrualMethod: v as AccrualMethod })} options={ACCRUAL_OPTIONS} style={{ width: '100%', height: 34 }} width={180} />
                          </div>
                          <div className="lvp-field" style={{ width: 96 }}>
                            <span className="lvp-field-label">{l.accrualMethod === 'monthly' ? 'Per month' : 'Per term'}</span>
                            <InputNumber style={{ width: '100%' }} min={0} max={9999} value={l.countPerPeriod} onChange={(v) => updateLine(l.key, { countPerPeriod: Number(v ?? 0) })} />
                          </div>
                          <div className="lvp-field lvp-field-switch" style={{ width: 96 }}>
                            <span className="lvp-field-label">Carry fwd</span>
                            <Switch checked={l.carryForward} onChange={(v) => updateLine(l.key, { carryForward: v, carryForwardMax: v ? l.carryForwardMax : null })} />
                          </div>
                          <div className="lvp-field" style={{ width: 96 }}>
                            <span className="lvp-field-label">Max</span>
                            <InputNumber style={{ width: '100%' }} min={0} max={9999} placeholder="∞" disabled={!l.carryForward} value={l.carryForwardMax ?? undefined} onChange={(v) => updateLine(l.key, { carryForwardMax: v == null ? null : Number(v) })} />
                          </div>
                          <div className="lvp-field lvp-field-total">
                            <span className="lvp-field-label">Total</span>
                            <div className="lvp-alloc-total">= <strong>{total}</strong> / {termLabel(termCycle).split(' ')[0].toLowerCase()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="lvp-alloc-footer">
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addLine} style={{ borderRadius: 6 }}>Add leave type</Button>
                  <span className="lvp-alloc-grand">Total entitlement: <strong>{policyTotal}</strong> / {termLabel(termCycle).split(' ')[0].toLowerCase()}</span>
                </div>
              </Section>
            </Spin>
          </div>

          {/* footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-pure-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>At least one target and one allocation are required</span>
            <Space size={10}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>Cancel</Button>
              <Button type="primary" onClick={submit} loading={saving} icon={editingId ? <EditOutlined /> : <PlusOutlined />} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>{editingId ? 'Save Changes' : 'Create Policy'}</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .lvp { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lvp-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .lvp-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .lvp-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .lvp-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .lvp-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvp-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        .lvp-search-wrap { display: flex; align-items: center; height: 34px; width: 240px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .lvp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lvp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lvp-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .lvp-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .lvp-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvp-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .lvp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .lvp-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; padding: 12px 14px; min-height: 92px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .lvp-stat-left { display: flex; align-items: center; gap: 8px; }
        .lvp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lvp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lvp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .lvp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .lvp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .lvp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .lvp-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .lvp-filter-label { display: inline-flex; align-items: center; gap: 6px; margin-right: 2px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .lvp-filter-label .anticon { color: var(--text-slate-400); font-size: 13px; }
        .lvp-filter-count { font-size: 12px; color: var(--text-slate-500); margin-left: 2px; }
        .lvp-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }
        .lvp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .lvp-table .ant-table { background: transparent; font-size: 12px; }
        .lvp-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important; white-space: nowrap !important; }
        .lvp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .lvp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lvp-table .ant-table-tbody > tr.lvp-row:hover > td { background: var(--bg-slate-50) !important; }
        /* expanded child row */
        .lvp-child { padding: 12px 14px; background: var(--bg-slate-50); }
        .lvp-child-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; font-size: 12px; color: var(--text-slate-600); }
        .lvp-child-meta b { color: var(--text-slate-700); font-weight: 700; }
        .lvp-child-dot { color: var(--text-slate-300); }
        .lvp-child-table .ant-table { background: var(--bg-pure-white) !important; font-size: 12px; border: 1px solid var(--border-slate-200); }
        .lvp-child-table .ant-table-thead > tr > th { background: var(--bg-pure-white) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 7px 12px !important; }
        .lvp-child-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 7px 12px !important; }
        .lvp-child-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lvp-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .lvp-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .lvp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .lvp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .lvp-pager { display: flex; align-items: center; gap: 3px; }
        .lvp-pager-btn, .lvp-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .lvp-pager-btn:hover:not(:disabled), .lvp-pager-num:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .lvp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lvp-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .lvp-pagesize { margin-left: 5px; }
        .lvp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* drawer fields — outlined white */
        .lvp-drawer-form .ant-input, .lvp-drawer-form .ant-input-number, .lvp-drawer-form .lvp-line .sd-trigger, .lvp-drawer-form .ant-select-selector { border-radius: 6px !important; border-color: var(--border-color) !important; box-shadow: none !important; }
        .lvp-drawer-form .ant-input:hover, .lvp-drawer-form .ant-input-number:hover, .lvp-drawer-form .ant-select-selector:hover { border-color: #93c5fd !important; }
        .lvp-drawer-form .ant-input:focus, .lvp-drawer-form .ant-input-focused { border-color: ${PALETTE.blue} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.10) !important; }
        .lvp-drawer-form .ant-input-number { width: 100%; }
        .lvp-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0 2px; }
        .lvp-toggle-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .lvp-toggle-desc { font-size: 11.5px; color: var(--text-slate-400); margin-top: 1px; }
        .lvp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .lvp-chips-empty { font-size: 12px; color: var(--text-slate-400); padding: 4px 2px; }
        .lvp-chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; padding: 3px 8px; background: var(--bg-slate-50); border-color: var(--border-slate-200); }
        .lvp-chip-scope { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${PALETTE.blue}; }
        .lvp-chip-val { font-size: 12px; color: var(--text-slate-700); }
        .lvp-alloc-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .lvp-alloc { border: 1px solid var(--border-slate-200); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-pure-white); }
        .lvp-alloc-row { display: flex; align-items: center; gap: 10px; }
        /* aligned field row: each group = label on top + control, columns line up */
        .lvp-alloc-fields { display: flex; align-items: flex-end; gap: 14px; }
        .lvp-field { display: flex; flex-direction: column; gap: 5px; }
        .lvp-field-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); }
        .lvp-field-switch { align-items: flex-start; }
        .lvp-field-switch .ant-switch { margin-top: 5px; }
        .lvp-field-total { margin-left: auto; align-items: flex-end; }
        .lvp-alloc-total { font-size: 13px; color: var(--text-slate-500); white-space: nowrap; line-height: 32px; }
        .lvp-alloc-total strong { color: ${PALETTE.blue}; font-size: 16px; }
        .lvp-alloc-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; }
        .lvp-alloc-grand { font-size: 12.5px; color: var(--text-slate-600); }
        .lvp-alloc-grand strong { color: var(--text-slate-900); font-size: 15px; }

        @media (max-width: 1024px) {
          .lvp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lvp-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

// Section card (ProjectFormDrawer style).
function Section({ icon, tint, color, title, subtitle, step, children }: { icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; step: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-color)', borderRadius: 0, padding: '12px 22px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 0, background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--bg-secondary, #f1f5f9)', color: 'var(--text-slate-500)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>{step}</span>
      </div>
      {children}
    </div>
  );
}
