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
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ReimbursementV2Service, {
  ExpenseCategory, ReimbursementPolicyListItem, SavePolicyInput, ScopeOption,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, tablePaginationConfig, preventInvalidNumberKeys } from './ui';
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async (p = page, l = limit, s = debouncedSearch) => {
    setLoading(true);
    try {
      const [pRes, c] = await Promise.all([
        ReimbursementV2Service.listPolicies({ includeInactive: true, page: p, limit: l, search: s }),
        ReimbursementV2Service.listCategories({ includeInactive: true, limit: 1000 }),
      ]);
      setRows(pRes.data);
      setTotal(pRes.pagination.total);
      setCats(c.data);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load policies');
    } finally { setLoading(false); }
  }, [page, limit, debouncedSearch]);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: total,
    active: rows.filter((r) => r.isActive).length,
    autoApprove: rows.filter((r) => r.autoApproveBelow != null).length,
  }), [rows, total]);

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
      title: 'Actions', key: 'actions', width: 90, align: 'right',
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
        {canManage && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New Policy</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total', value: stats.total, icon: <AuditOutlined />, color: PALETTE.orange, tint: TINT.orange },
        { label: 'Active', value: stats.active, icon: <ProfileOutlined />, color: PALETTE.green, tint: TINT.green },
        { label: 'Auto-approve', value: stats.autoApprove, icon: <ThunderboltOutlined />, color: PALETTE.amber, tint: TINT.amber },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={rows}
          pagination={{
            ...tablePaginationConfig,
            current: page,
            pageSize: limit,
            total,
            onChange: (p, s) => {
              setPage(p);
              setLimit(s ?? limit);
            },
          }} />
      </div>

      <Drawer
        {...commonDrawerProps}
        title={null}
        width={760}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500, marginRight: 'auto' }}>
              Fields marked required must be filled
            </span>
            <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 8, height: 36 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={submit}
              loading={saving}
              icon={editingId ? <EditOutlined /> : <PlusOutlined />}
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editingId ? 'Save Changes' : 'Create Policy'}
            </Button>
          </div>
        }
      >
        <style>{formStyles}</style>
        {/* HEADER */}
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: editingId ? TINT.amber : TINT.orange,
                color: editingId ? PALETTE.amber : PALETTE.orange,
                border: '1px solid var(--border-orange-200)',
              }}
            >
              {editingId ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {editingId ? 'Edit Policy' : 'New Policy'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {editingId ? `Update details for this policy` : 'Define per-scope limit overrides'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ display: 'inline-block', transform: 'rotate(45deg)', fontSize: 18, lineHeight: 1 }}>+</span>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5 pb-24">
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            labelAlign="left"
            colon={false}
            requiredMark="optional"
            className="customer-drawer-form"
          >
          <SectionCard icon={<InfoCircleOutlined />}
            title="Basics" subtitle="Identity and auto-approval" step="STEP 1">
            <Form.Item name="name" label="Name"
              rules={[{ required: true, message: 'Name is required' }, { max: 120, message: 'Too long' }, { pattern: /^[a-zA-Z0-9\s\-_.,()&/]*$/, message: 'Special characters are not allowed' }]}>
              <Input placeholder="e.g. Field Staff Policy"
                onChange={(e) => form.setFieldsValue({ code: toCode(e.target.value) })} />
            </Form.Item>
            <Form.Item name="code"
              label={labelInfo('Code', 'Auto-generated from the name and used as a unique key. It cannot be edited.')}
              rules={[{ required: true, message: 'Enter a name to generate the code' },
                { pattern: /^[A-Z0-9_-]+$/, message: 'Invalid code' }]}>
              <Input placeholder="FIELD_STAFF_POLICY" disabled />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ max: 500, message: 'Max 500 characters' }, { pattern: /^[a-zA-Z0-9\s\-_.,()&/]*$/, message: 'Special characters are not allowed' }]}>
              <Input.TextArea rows={2} maxLength={500} placeholder="Optional" />
            </Form.Item>
            <Form.Item name="autoApproveBelow"
              label={labelInfo(
                'Auto-approve claims at or below (₹)',
                'An amount threshold. If a submitted claim’s total is at or below this value, it is approved automatically and skips the manager. Leave empty to always require approval.'
              )}
              rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="e.g. 500 — leave empty to always require approval" onKeyDown={preventInvalidNumberKeys as any} />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
          </SectionCard>

          <SectionCard icon={<ApartmentOutlined />}
            title="Applies to" subtitle="Who this policy governs" step="STEP 2">
            <Form.List name="assignments">
              {(fields, { add, remove: rm }) => (
                <>
                  {fields.map((f) => (
                    <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                      <Form.Item name={[f.name, 'scopeType']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <SearchableDropdown style={{ width: 180, minHeight: 38 }} options={SCOPE_OPTIONS}
                          onChange={() => form.setFields([{ name: ['assignments', f.name, 'scopeId'], value: undefined }])} />
                      </Form.Item>
                      <Form.Item noStyle
                        shouldUpdate={(p, c) => p.assignments?.[f.name]?.scopeType !== c.assignments?.[f.name]?.scopeType}>
                        {() => {
                          const st = form.getFieldValue(['assignments', f.name, 'scopeType']);
                          if (!st || st === 'org') return null;
                          return (
                            <Form.Item name={[f.name, 'scopeId']} rules={[{ required: true, message: 'Select a target' }]} style={{ marginBottom: 0 }}>
                              <SearchableDropdown
                                placeholder={`Select ${SCOPE_OPTIONS.find((s) => s.value === st)?.label?.toLowerCase()}`}
                                options={scopeOpts[st] || []} style={{ width: 320, minHeight: 38 }} />
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

          <SectionCard icon={<ProfileOutlined />}
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
                          <SearchableDropdown style={{ minHeight: 38 }} placeholder="Category"
                            options={cats.map((c) => ({ value: c.id, label: c.name }))} />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => rm(f.name)} style={{ color: 'var(--text-slate-400)' }} />
                      </Space>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                        <Form.Item name={[f.name, 'maxPerClaim']} style={{ marginBottom: 0 }}
                          label={labelInfo('Per-claim limit', 'Max amount for a single expense of this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                        </Form.Item>
                        <Form.Item name={[f.name, 'perDayLimit']} style={{ marginBottom: 0 }}
                          label={labelInfo('Per-day limit', 'Max total amount per day for this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                        </Form.Item>
                        <Form.Item name={[f.name, 'monthlyLimit']} style={{ marginBottom: 0 }}
                          label={labelInfo('Monthly limit', 'Max total amount per calendar month for this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                        </Form.Item>
                        <Form.Item name={[f.name, 'yearlyLimit']} style={{ marginBottom: 0 }}
                          label={labelInfo('Yearly limit', 'Max total amount per calendar year for this category.')}
                          rules={[{ type: 'number', min: 0, message: '≥ 0' }]}>
                          <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
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
        </div>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
