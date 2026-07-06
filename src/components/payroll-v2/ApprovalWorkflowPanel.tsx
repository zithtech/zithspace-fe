'use client';

import { Menu } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Drawer, Input, Switch, Select, message, Tooltip, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, CloseOutlined,
  InfoCircleOutlined, BranchesOutlined, ArrowUpOutlined, ArrowDownOutlined, StarFilled,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PayrollV2Service, {
  ApprovalWorkflowListItem, ApprovalStep, ApproverType, ApproverOption,
} from '@/services/payrollV2Service';

const PALETTE = { sky: '#0EA5E9', green: '#10B981', red: '#EF4444', violet: '#8B5CF6', amber: '#F59E0B', grey: '#94A3B8' } as const;
const TINT = { sky: 'rgba(14,165,233,0.10)', green: 'rgba(16,185,129,0.10)' } as const;

const APPROVER_OPTIONS: { value: ApproverType; label: string }[] = [
  { value: 'manager', label: 'Reporting Manager' },
  { value: 'role', label: 'Anyone with Role' },
  { value: 'specific_user', label: 'Specific User' },
];
const APPROVER_LABEL: Record<ApproverType, string> = { manager: 'Reporting Manager', role: 'Role', specific_user: 'Specific User' };
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

type StepDraft = { approverType: ApproverType; roleId: string | null; specificUserId: string | null; fallbackUserId: string | null };

// Divided settings row (General-Settings style): label + hint on the left,
// control on the right. `inline` drops the control (a Switch) straight at right.
function Field({ label, hint, children, inline }: { label: string; hint?: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <div className="pvw-frow">
      <div className="pvw-frow-meta">
        <div className="pvw-frow-label">{label}</div>
        {hint && <div className="pvw-frow-hint">{hint}</div>}
      </div>
      {inline ? children : <div className="pvw-frow-ctrl">{children}</div>}
    </div>
  );
}

// Rounded section card with an icon-chip header + optional right-side action.
function DrawerCard({ icon, tint, color, title, subtitle, action, children }: {
  icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="pvw-card">
      <div className="pvw-card-head">
        <div className="pvw-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div className="pvw-card-title">{title}</div><div className="pvw-card-sub">{subtitle}</div></div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ApprovalWorkflowPanel() {
  const { canReadPayrollWorkflows, canCreatePayrollWorkflows, canUpdatePayrollWorkflows, canDeletePayrollWorkflows } = usePermission();
  console.log("Forcing HMR reload for ApprovalWorkflowPanel");

  const [rows, setRows] = useState<ApprovalWorkflowListItem[]>([]);
  const [roles, setRoles] = useState<ApproverOption[]>([]);
  const [users, setUsers] = useState<ApproverOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalWorkflowListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wf, rl, us] = await Promise.all([
        PayrollV2Service.listWorkflows(true),
        PayrollV2Service.getApproverRoles().catch(() => []),
        PayrollV2Service.getApproverUsers().catch(() => []),
      ]);
      setRows(wf); setRoles(rl); setUsers(us);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load workflows');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (canReadPayrollWorkflows) load(); }, [canReadPayrollWorkflows, load]);

  const roleName = (id: string | null) => roles.find((r) => r.value === id)?.label ?? (id ? 'Unknown role' : '—');
  const userName = (id: string | null) => users.find((u) => u.value === id)?.label ?? (id ? 'Unknown user' : '—');

  const openCreate = () => {
    setEditing(null); setName(''); setDescription(''); setIsActive(true); setIsDefault(rows.length === 0);
    setSteps([{ approverType: 'manager', roleId: null, specificUserId: null, fallbackUserId: null }]);
    setOpen(true);
  };
  const openEdit = async (r: ApprovalWorkflowListItem) => {
    setEditing(r);
    try {
      const d = await PayrollV2Service.getWorkflow(r.id);
      setName(d.name); setDescription(d.description ?? ''); setIsActive(d.isActive); setIsDefault(d.isDefault);
      setSteps(d.steps.map((s: ApprovalStep) => ({ approverType: s.approverType, roleId: s.roleId, specificUserId: s.specificUserId, fallbackUserId: s.fallbackUserId })));
      setOpen(true);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load workflow'); }
  };

  const addStep = () => setSteps((p) => [...p, { approverType: 'manager', roleId: null, specificUserId: null, fallbackUserId: null }]);
  const updateStep = (i: number, patch: Partial<StepDraft>) => setSteps((p) => p.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeStep = (i: number) => setSteps((p) => p.filter((_, idx) => idx !== i));
  const moveStep = (i: number, dir: -1 | 1) => setSteps((p) => {
    const j = i + dir;
    if (j < 0 || j >= p.length) return p;
    const next = [...p];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const submit = async () => {
    if (!name.trim()) { message.error('Workflow name is required'); return; }
    if (steps.length === 0) { message.error('Add at least one approval step'); return; }
    for (const [i, s] of steps.entries()) {
      if (s.approverType === 'role' && !s.roleId) { message.error(`Step ${i + 1}: select a role`); return; }
      if (s.approverType === 'specific_user' && !s.specificUserId) { message.error(`Step ${i + 1}: select a user`); return; }
    }
    const payload = {
      name: name.trim(), description: description.trim() || null, isActive, isDefault,
      steps: steps.map((s) => ({
        approverType: s.approverType,
        roleId: s.approverType === 'role' ? s.roleId : null,
        specificUserId: s.approverType === 'specific_user' ? s.specificUserId : null,
        fallbackUserId: s.fallbackUserId,
      })),
    };
    setSaving(true);
    try {
      if (editing) { await PayrollV2Service.updateWorkflow(editing.id, payload); message.success('Workflow updated'); }
      else { await PayrollV2Service.createWorkflow(payload); message.success('Workflow created'); }
      setOpen(false); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to save workflow'); }
    finally { setSaving(false); }
  };

  const remove = async (r: ApprovalWorkflowListItem) => {
    try { await PayrollV2Service.deleteWorkflow(r.id); message.success('Workflow deleted'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete workflow'); }
  };

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => rows.filter((r) => !q || r.name.toLowerCase().includes(q)), [rows, q]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [search, pageSize]);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(total, page * pageSize);
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  const columns: ColumnsType<ApprovalWorkflowListItem> = [
    {
      title: 'Workflow', dataIndex: 'name', key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE.sky, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          {r.isDefault && <Tag color="cyan" style={{ marginInlineStart: 2 }}><StarFilled style={{ fontSize: 9 }} /> Default</Tag>}
        </div>
      ),
    },
    { title: 'Steps', dataIndex: 'stepCount', key: 'stepCount', render: (v) => <Tag><BranchesOutlined /> {v} step{v === 1 ? '' : 's'}</Tag> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdatePayrollWorkflows && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>}
          {canDeletePayrollWorkflows && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this workflow?" description={`"${r.name}" will be removed.`} confirmText="Delete" placement="bottomRight" onConfirm={() => remove(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadPayrollWorkflows) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view approval workflows.</div>;
  }

  return (
    <div className="pvw">
      <div className="pvw-header">
        <div className="pvw-header-about">
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="pvw-header-icon"><BranchesOutlined /></div>
          <div>
            <div className="pvw-header-title">Approval Workflows</div>
            <div className="pvw-header-sub">Multi-step approval chains for payroll runs</div>
          </div>
        </div>
        <div className="pvw-header-actions">
          <div className="pvw-search-wrap">
            <SearchOutlined className="pvw-search-icon" />
            <input className="pvw-search" placeholder="Search workflows…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="pvw-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreatePayrollWorkflows && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="pvw-add-btn">New Workflow</Button>}
        </div>
      </div>

      <div className="pvw-table-wrap">
        <Table rowKey="id" size="small" className="pvw-table" loading={loading} columns={columns} dataSource={pagedRows} pagination={false} onRow={() => ({ className: 'pvw-row' })} />
      </div>

      {total > 0 && (
        <div className="pvw-footer pvw-footer--sticky">
          <div className="pvw-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="pvw-pager">
            <button type="button" className="pvw-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pvw-pager-num ${p === page ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="pvw-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select className="pvw-pagesize" size="small" value={pageSize} onChange={(v) => { setPageSize(v); setPage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
          </div>
        </div>
      )}

      {/* DRAWER */}
      <Drawer title={null} open={open} onClose={() => setOpen(false)} width={760} closable={false} destroyOnClose
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvw-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="pvw-drawer-chip" style={{ background: editing ? TINT.green : TINT.sky, color: editing ? PALETTE.green : PALETTE.sky }}>{editing ? <EditOutlined /> : <PlusOutlined />}</div>
              <div>
                <div className="pvw-drawer-title">{editing ? 'Edit Workflow' : 'New Workflow'}</div>
                <div className="pvw-drawer-sub">{editing ? `Update ${editing.name}` : 'Define an ordered approval chain'}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setOpen(false)} />
          </div>

          <div className="pvw-drawer-body">
            {/* details */}
            <DrawerCard icon={<InfoCircleOutlined />} tint={TINT.sky} color={PALETTE.sky} title="Details" subtitle="Name this workflow and set its defaults">
              <Field label="Workflow name" hint="Shown when a payroll run picks an approval chain"><Input size="large" maxLength={120} placeholder="e.g. Standard Payroll Approval" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Description" hint="When does this workflow apply?"><Input.TextArea rows={2} maxLength={500} placeholder="When does this workflow apply?" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
              <Field label="Default workflow" hint="Used by payroll runs when none is set" inline><Switch checked={isDefault} onChange={setIsDefault} /></Field>
              <Field label="Active" hint="Available for payroll runs" inline><Switch checked={isActive} onChange={setIsActive} /></Field>
            </DrawerCard>

            <div style={{ height: 14 }} />

            {/* steps */}
            <DrawerCard icon={<BranchesOutlined />} tint={TINT.green} color={PALETTE.green} title="Approval Steps" subtitle="Approvals run top → bottom"
              action={<Button size="small" icon={<PlusOutlined />} onClick={addStep}>Add step</Button>}>
              <div className="pvw-steps">
                {steps.map((s, i) => (
                  <div key={i} className="pvw-step">
                    <div className="pvw-step-rail">
                      <div className="pvw-step-num">{i + 1}</div>
                      {i < steps.length - 1 && <div className="pvw-step-line" />}
                    </div>
                    <div className="pvw-step-body">
                      <div className="pvw-step-row">
                        <SearchableDropdown className="pvw-dd" placeholder="Approver" searchPlaceholder="Search" itemNoun="approver types" allowClear={false}
                          value={s.approverType} onChange={(v) => updateStep(i, { approverType: (v as ApproverType) ?? 'manager', roleId: null, specificUserId: null })}
                          options={APPROVER_OPTIONS} style={{ width: 190, height: 36 }} width={220} />
                        {s.approverType === 'role' && (
                          <SearchableDropdown className="pvw-dd" placeholder="Select role" searchPlaceholder="Search roles" itemNoun="roles" allowClear={false}
                            value={s.roleId ?? undefined} onChange={(v) => updateStep(i, { roleId: (v as string) ?? null })} options={roles} style={{ flex: 1, height: 36 }} width={260} />
                        )}
                        {s.approverType === 'specific_user' && (
                          <SearchableDropdown className="pvw-dd" placeholder="Select user" searchPlaceholder="Search users" itemNoun="users" allowClear={false}
                            value={s.specificUserId ?? undefined} onChange={(v) => updateStep(i, { specificUserId: (v as string) ?? null })} options={users} style={{ flex: 1, height: 36 }} width={260} />
                        )}
                        {s.approverType === 'manager' && <div className="pvw-step-note">The employee’s reporting manager approves.</div>}
                        <div className="pvw-step-tools">
                          <Tooltip title="Move up"><Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => moveStep(i, -1)} /></Tooltip>
                          <Tooltip title="Move down"><Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)} /></Tooltip>
                          <Tooltip title="Remove"><Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={steps.length === 1} onClick={() => removeStep(i)} /></Tooltip>
                        </div>
                      </div>
                      <div className="pvw-step-fallback">
                        <span className="pvw-hint">Fallback (optional)</span>
                        <SearchableDropdown className="pvw-dd" placeholder="No fallback" searchPlaceholder="Search users" itemNoun="users" allowClear
                          value={s.fallbackUserId ?? undefined} onChange={(v) => updateStep(i, { fallbackUserId: (v as string) ?? null })} options={users} style={{ width: 240, height: 32 }} width={260} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerCard>
          </div>

          <div className="pvw-drawer-foot">
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>{steps.length} step{steps.length === 1 ? '' : 's'} · approvals run top → bottom</span>
            <Space size={10}>
              <Button onClick={() => setOpen(false)} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={submit} icon={editing ? <EditOutlined /> : <PlusOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>{editing ? 'Save Changes' : 'Create Workflow'}</Button>
            </Space>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvw { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvw-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .pvw-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .pvw-header-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: ${TINT.sky}; color: ${PALETTE.sky}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvw-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvw-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvw-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pvw-search-wrap { display: flex; align-items: center; height: 34px; width: 220px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pvw-search-wrap:focus-within { border-color: #7dd3fc; box-shadow: 0 0 0 3px rgba(14,165,233,0.10); }
        .pvw-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pvw-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pvw-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .pvw-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .pvw-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pvw-table, .pvw-table.ant-table-wrapper, .pvw-table .ant-table, .pvw-table .ant-table-container, .pvw-table .ant-table-content, .pvw-table .ant-table-header, .pvw-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pvw-table .ant-table-thead > tr > th,
        .pvw-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .pvw-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .pvw-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pvw-table .ant-table-tbody > tr.pvw-row:hover > td { background: var(--bg-slate-50) !important; }
        .pvw-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; box-sizing: border-box; }
        .pvw-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: auto -22px 0; padding: 0 22px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .pvw-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pvw-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pvw-pager { display: flex; align-items: center; gap: 3px; }
        .pvw-pager-btn, .pvw-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .pvw-pager-btn:hover:not(:disabled), .pvw-pager-num:hover { border-color: #7dd3fc; color: ${PALETTE.sky}; }
        .pvw-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pvw-pager-num.is-active { background: ${PALETTE.sky}; border-color: ${PALETTE.sky}; color: #fff; }
        .pvw-pagesize { margin-left: 5px; }
        .pvw-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        .pvw-drawer-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; background: var(--bg-pure-white); }
        .pvw-drawer-chip { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .pvw-drawer-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .pvw-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
        .pvw-drawer-body { padding: 16px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); }
        .pvw-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 20px 16px; }
        .pvw-card-head { display: flex; align-items: center; gap: 11px; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--border-slate-100); }
        .pvw-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .pvw-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvw-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvw-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvw-frow:first-child { padding-top: 6px; }
        .pvw-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvw-frow-meta { min-width: 0; flex: 1; }
        .pvw-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvw-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvw-frow-ctrl { width: 340px; flex-shrink: 0; }
        @media (max-width: 640px) { .pvw-frow { flex-direction: column; align-items: stretch; gap: 8px; } .pvw-frow-ctrl { width: 100%; } }
        .pvw-hint { font-size: 11px; color: var(--text-slate-400); }
        .pvw-drawer-body .ant-input, .pvw-drawer-body .ant-input-affix-wrapper, .pvw-drawer-body .pvw-dd.sd-trigger { border-radius: 6px !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-color) !important; box-shadow: none !important; }
        .pvw-drawer-body .pvw-dd.sd-trigger { display: flex; align-items: center; }

        .pvw-steps { display: flex; flex-direction: column; margin-top: 8px; }
        .pvw-step { display: flex; gap: 12px; }
        .pvw-step-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .pvw-step-num { width: 26px; height: 26px; border-radius: 50%; background: ${TINT.sky}; color: ${PALETTE.sky}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; flex-shrink: 0; }
        .pvw-step-line { flex: 1; width: 2px; background: var(--border-slate-200); margin: 2px 0; }
        .pvw-step-body { flex: 1; min-width: 0; border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-pure-white); padding: 12px; margin-bottom: 12px; transition: border-color .12s ease, box-shadow .12s ease; }
        .pvw-step-body:hover { border-color: #7dd3fc; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .pvw-step-row { display: flex; align-items: center; gap: 8px; }
        .pvw-step-note { flex: 1; font-size: 12px; color: var(--text-slate-500); font-style: italic; }
        .pvw-step-tools { display: flex; align-items: center; gap: 0; margin-left: auto; }
        .pvw-step-fallback { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
        .pvw-drawer-foot { padding: 14px 22px; border-top: 1px solid var(--border-color); background: var(--bg-pure-white); display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; }

        @media (max-width: 900px) {
          .pvw-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pvw-header-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .pvw-search-wrap {
            flex: 1;
            min-width: 200px;
          }
        }
        @media (max-width: 500px) {
          .pvw-add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
