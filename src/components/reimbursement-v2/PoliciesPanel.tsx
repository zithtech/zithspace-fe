'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Form, Input, InputNumber, Select, Switch, Tooltip, message, Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AuditOutlined, InfoCircleOutlined,
  ApartmentOutlined, ProfileOutlined, MinusCircleOutlined, ThunderboltOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { Permissions } from '@/types/permissions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ReimbursementV2Service, {
  ExpenseCategory, ReimbursementPolicyListItem, SavePolicyInput, ScopeOption,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, SectionCard, RmbStyles, money } from './ui';

const SCOPE_OPTIONS = [
  { value: 'org', label: 'Whole organization' },
  { value: 'department', label: 'Department' },
  { value: 'subdepartment', label: 'Sub-department' },
  { value: 'grade', label: 'Grade' },
  { value: 'position', label: 'Position' },
  { value: 'user', label: 'Specific user' },
];

// Derive a stable CODE from a name, e.g. "Field Staff Policy" → "FIELD_STAFF_POLICY".
const toCode = (s: string) =>
  (s || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

export default function PoliciesPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursementConfig || perms.canManageReimbursements;
  const canManage = perms.can(Permissions.REIMBURSEMENT_CONFIG_UPDATE) || perms.canManageReimbursements;

  const [rows, setRows] = useState<ReimbursementPolicyListItem[]>([]);
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SavePolicyInput>();
  const [scopeOpts, setScopeOpts] = useState<Record<string, ScopeOption[]>>({});
  const [scopeLoading, setScopeLoading] = useState(false);

  // A field label with a hover info icon.
  const labelInfo = (text: React.ReactNode, info: string) => (
    <span>
      {text}{' '}
      <Tooltip title={info}>
        <QuestionCircleOutlined style={{ color: 'var(--text-slate-400)', cursor: 'help' }} />
      </Tooltip>
    </span>
  );

  // Load the pickable targets (departments, grades, positions, users…) once.
  const ensureScopeOpts = useCallback(async () => {
    if (Object.keys(scopeOpts).length) return;
    setScopeLoading(true);
    const types = ['department', 'subdepartment', 'grade', 'position', 'user'];
    try {
      const results = await Promise.all(
        types.map((t) => ReimbursementV2Service.getScopeOptions(t).catch(() => [] as ScopeOption[]))
      );
      const map: Record<string, ScopeOption[]> = {};
      types.forEach((t, i) => { map[t] = results[i]; });
      setScopeOpts(map);
    } finally { setScopeLoading(false); }
  }, [scopeOpts]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        ReimbursementV2Service.listPolicies(true),
        ReimbursementV2Service.listCategories(true),
      ]);
      setRows(p); setCats(c);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load policies');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.isActive).length,
    autoApprove: rows.filter((r) => r.autoApproveBelow != null).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, assignments: [{ scopeType: 'org' }], lines: [] } as any);
    ensureScopeOpts();
    setDrawerOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      ensureScopeOpts();
      const detail = await ReimbursementV2Service.getPolicy(id);
      setEditingId(id);
      form.setFieldsValue({
        name: detail.name, code: detail.code, description: detail.description ?? undefined,
        autoApproveBelow: detail.autoApproveBelow ?? undefined, isActive: detail.isActive,
        assignments: detail.assignments.length ? detail.assignments.map((a) => ({ scopeType: a.scopeType, scopeId: a.scopeId ?? undefined })) : [{ scopeType: 'org' }],
        lines: detail.lines.map((l) => ({
          categoryId: l.categoryId, maxPerClaim: l.maxPerClaim ?? undefined,
          monthlyLimit: l.monthlyLimit ?? undefined, yearlyLimit: l.yearlyLimit ?? undefined, perDayLimit: l.perDayLimit ?? undefined,
        })),
      } as any);
      setDrawerOpen(true);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load policy');
    }
  };

  const submit = async () => {
    let values: SavePolicyInput;
    try { values = await form.validateFields(); } catch { return; }
    // Drop scopeId for org scope.
    values.assignments = (values.assignments || []).map((a) =>
      a.scopeType === 'org' ? { scopeType: 'org' } : a);
    setSaving(true);
    try {
      if (editingId) {
        await ReimbursementV2Service.updatePolicy(editingId, values);
        message.success('Policy updated');
      } else {
        await ReimbursementV2Service.createPolicy(values);
        message.success('Policy created');
      }
      setDrawerOpen(false);
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to save policy');
    } finally { setSaving(false); }
  };

  const remove = async (r: ReimbursementPolicyListItem) => {
    try {
      await ReimbursementV2Service.deletePolicy(r.id);
      message.success('Policy deleted');
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to delete policy');
    }
  };

  const columns: ColumnsType<ReimbursementPolicyListItem> = [
    { title: 'Name', dataIndex: 'name', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Code', dataIndex: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Applies to', dataIndex: 'assignmentCount', render: (v) => `${v} scope${v === 1 ? '' : 's'}` },
    { title: 'Overrides', dataIndex: 'lineCount', render: (v) => `${v} categor${v === 1 ? 'y' : 'ies'}` },
    { title: 'Auto-approve', dataIndex: 'autoApproveBelow', render: (v) => (v != null ? `≤ ${money(v)}` : '—') },
    { title: 'Status', dataIndex: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canManage && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r.id)} /></Tooltip>}
          {canManage && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this policy?"
              description={`"${r.name}" and its overrides will be removed.`} confirmText="Delete"
              placement="bottomRight" onConfirm={() => remove(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canRead) return <div className="rvp-empty">You don’t have permission to view policies.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<AuditOutlined />} color={PALETTE.orange} tint={TINT.orange}
        title="Reimbursement Policies" subtitle="Per-scope limit overrides & auto-approval"
        search={search} onSearch={setSearch} searchPlaceholder="Search policies…"
        onRefresh={load} loading={loading}
      >
        {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Policy</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total', value: stats.total, icon: <AuditOutlined />, color: PALETTE.orange, tint: TINT.orange },
        { label: 'Active', value: stats.active, icon: <ProfileOutlined />, color: PALETTE.green, tint: TINT.green },
        { label: 'Auto-approve', value: stats.autoApprove, icon: <ThunderboltOutlined />, color: PALETTE.amber, tint: TINT.amber },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }} />
      </div>

      <Drawer
        title={editingId ? 'Edit policy' : 'New policy'} width={760} open={drawerOpen}
        onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={<div className="rvp-drawer-foot">
          <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={submit}>{editingId ? 'Save changes' : 'Create'}</Button>
        </div>}
      >
        <Form form={form} layout="vertical">
          <SectionCard icon={<InfoCircleOutlined />} tint={TINT.blue} color={PALETTE.blue}
            title="Basics" subtitle="Identity and auto-approval" step="STEP 1">
            <Form.Item name="name" label="Name"
              rules={[{ required: true, message: 'Name is required' }, { max: 120, message: 'Too long' }]}>
              <Input placeholder="e.g. Field Staff Policy"
                onChange={(e) => form.setFieldsValue({ code: toCode(e.target.value) })} />
            </Form.Item>
            <Form.Item name="code"
              label={labelInfo('Code', 'Auto-generated from the name and used as a unique key. It cannot be edited.')}
              rules={[{ required: true, message: 'Enter a name to generate the code' },
                { pattern: /^[A-Z0-9_-]+$/, message: 'Invalid code' }]}>
              <Input placeholder="FIELD_STAFF_POLICY" disabled />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ max: 500, message: 'Max 500 characters' }]}>
              <Input.TextArea rows={2} maxLength={500} placeholder="Optional" />
            </Form.Item>
            <Form.Item name="autoApproveBelow"
              label={labelInfo(
                'Auto-approve claims at or below (₹)',
                'An amount threshold. If a submitted claim’s total is at or below this value, it is approved automatically and skips the manager. Leave empty to always require approval.'
              )}
              rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="e.g. 500 — leave empty to always require approval" />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
          </SectionCard>

          <SectionCard icon={<ApartmentOutlined />} tint={TINT.cyan} color={PALETTE.cyan}
            title="Applies to" subtitle="Who this policy governs" step="STEP 2">
            <Form.List name="assignments">
              {(fields, { add, remove: rm }) => (
                <>
                  {fields.map((f) => (
                    <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                      <Form.Item name={[f.name, 'scopeType']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select style={{ width: 180 }} options={SCOPE_OPTIONS}
                          onChange={() => form.setFields([{ name: ['assignments', f.name, 'scopeId'], value: undefined }])} />
                      </Form.Item>
                      <Form.Item noStyle
                        shouldUpdate={(p, c) => p.assignments?.[f.name]?.scopeType !== c.assignments?.[f.name]?.scopeType}>
                        {() => {
                          const st = form.getFieldValue(['assignments', f.name, 'scopeType']);
                          if (!st || st === 'org') return null;
                          return (
                            <Form.Item name={[f.name, 'scopeId']} rules={[{ required: true, message: 'Select a target' }]} style={{ marginBottom: 0 }}>
                              <Select showSearch optionFilterProp="label" loading={scopeLoading}
                                placeholder={`Select ${SCOPE_OPTIONS.find((s) => s.value === st)?.label?.toLowerCase()}`}
                                options={scopeOpts[st] || []} style={{ width: 320 }}
                                notFoundContent={scopeLoading ? 'Loading…' : 'None found'} />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => rm(f.name)} style={{ color: 'var(--text-slate-400)' }} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ scopeType: 'department' })} icon={<PlusOutlined />} block>Add scope</Button>
                </>
              )}
            </Form.List>
          </SectionCard>

          <SectionCard icon={<ProfileOutlined />} tint={TINT.orange} color={PALETTE.orange}
            title="Category limit overrides" subtitle="Spend caps for this policy — override the category defaults" step="STEP 3">
            <div style={{ fontSize: 12, color: 'var(--text-slate-500)', marginBottom: 10 }}>
              All values are <b>amounts</b> (₹), not counts. Leave a box empty to keep the category’s own limit.
            </div>
            <Form.List name="lines">
              {(fields, { add, remove: rm }) => (
                <>
                  {fields.map((f) => (
                    <div key={f.key} style={{ border: '1px solid var(--border-slate-100)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                      <Space align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                        <Form.Item name={[f.name, 'categoryId']} rules={[{ required: true, message: 'Pick a category' }]} style={{ marginBottom: 0, flex: 1 }}>
                          <Select style={{ width: 320 }} placeholder="Category" showSearch optionFilterProp="label"
                            options={cats.map((c) => ({ value: c.id, label: c.name }))} />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => rm(f.name)} style={{ color: 'var(--text-slate-400)' }} />
                      </Space>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                        <Form.Item name={[f.name, 'maxPerClaim']} style={{ marginBottom: 0 }}
                          label={labelInfo('Per-claim limit', 'Max amount for a single expense of this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" />
                        </Form.Item>
                        <Form.Item name={[f.name, 'perDayLimit']} style={{ marginBottom: 0 }}
                          label={labelInfo('Per-day limit', 'Max total amount per day for this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" />
                        </Form.Item>
                        <Form.Item name={[f.name, 'monthlyLimit']} style={{ marginBottom: 0 }}
                          label={labelInfo('Monthly limit', 'Max total amount per calendar month for this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" />
                        </Form.Item>
                        <Form.Item name={[f.name, 'yearlyLimit']} style={{ marginBottom: 0 }}
                          label={labelInfo('Yearly limit', 'Max total amount per calendar year for this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" />
                        </Form.Item>
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add({})} icon={<PlusOutlined />} block>Add category override</Button>
                </>
              )}
            </Form.List>
          </SectionCard>
        </Form>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
