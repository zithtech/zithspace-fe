'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Form, Input, InputNumber, Select, Switch, DatePicker, Tooltip, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AimOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { Permissions } from '@/types/permissions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ReimbursementV2Service, { Budget, ExpenseCategory, SaveBudgetInput } from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, SectionCard, RmbStyles, money, fmtDate, CurrencySelect, currencySymbol } from './ui';

const SCOPES = [
  { value: 'org', label: 'Whole organization' },
  { value: 'department', label: 'Department' },
  { value: 'project', label: 'Project' },
  { value: 'category', label: 'Category' },
  { value: 'user', label: 'User' },
];

function barColor(u: number) {
  if (u >= 1) return PALETTE.red;
  if (u >= 0.8) return PALETTE.amber;
  return PALETTE.green;
}

export default function BudgetsPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursementConfig || perms.canReadReimbursementDashboard || perms.canManageReimbursements;
  const canManage = perms.can(Permissions.REIMBURSEMENT_CONFIG_UPDATE) || perms.canManageReimbursements;

  const [rows, setRows] = useState<Budget[]>([]);
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const scopeType = Form.useWatch('scopeType', form);
  const cur = Form.useWatch('currency', form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        ReimbursementV2Service.listBudgets(true),
        ReimbursementV2Service.listCategories(true),
      ]);
      setRows(b); setCats(c);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load budgets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: rows.length,
    budgeted: rows.reduce((s, r) => s + r.amount, 0),
    spent: rows.reduce((s, r) => s + r.spent, 0),
    over: rows.filter((r) => r.utilization >= 1).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = () => {
    setEditingId(null); form.resetFields();
    form.setFieldsValue({ scopeType: 'org', currency: 'INR', isActive: true });
    setDrawerOpen(true);
  };
  const openEdit = (r: Budget) => {
    setEditingId(r.id);
    form.setFieldsValue({
      name: r.name, scopeType: r.scopeType, scopeId: r.scopeId ?? undefined,
      period: [dayjs(r.periodStart), dayjs(r.periodEnd)], amount: r.amount, currency: r.currency, isActive: r.isActive,
    });
    setDrawerOpen(true);
  };

  const submit = async () => {
    let v: any;
    try { v = await form.validateFields(); } catch { return; }
    const payload: SaveBudgetInput = {
      name: v.name, scopeType: v.scopeType, scopeId: v.scopeType === 'org' ? null : v.scopeId,
      periodStart: dayjs(v.period[0]).format('YYYY-MM-DD'), periodEnd: dayjs(v.period[1]).format('YYYY-MM-DD'),
      amount: v.amount, currency: v.currency, isActive: v.isActive,
    };
    setSaving(true);
    try {
      if (editingId) { await ReimbursementV2Service.updateBudget(editingId, payload); message.success('Budget updated'); }
      else { await ReimbursementV2Service.createBudget(payload); message.success('Budget created'); }
      setDrawerOpen(false); await load();
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to save budget'); }
    finally { setSaving(false); }
  };

  const remove = async (r: Budget) => {
    try { await ReimbursementV2Service.deleteBudget(r.id); message.success('Budget deleted'); await load(); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to delete'); }
  };

  const columns: ColumnsType<Budget> = [
    { title: 'Budget', dataIndex: 'name', render: (v, r) => (
      <div><div style={{ fontWeight: 600 }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{SCOPES.find((s) => s.value === r.scopeType)?.label}</div></div>) },
    { title: 'Period', key: 'period', render: (_, r) => `${fmtDate(r.periodStart)} – ${fmtDate(r.periodEnd)}` },
    { title: 'Budget', dataIndex: 'amount', align: 'right', render: (v, r) => money(v, r.currency) },
    {
      title: 'Utilization', key: 'util', width: 220,
      render: (_, r) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>{money(r.spent, r.currency)}</span>
            <span style={{ color: 'var(--text-slate-500)' }}>{Math.round(r.utilization * 100)}%</span>
          </div>
          <div className="rvp-bar"><span style={{ width: `${Math.min(100, r.utilization * 100)}%`, background: barColor(r.utilization) }} /></div>
        </div>
      ),
    },
    { title: 'Remaining', dataIndex: 'remaining', align: 'right', render: (v, r) => <span style={{ fontWeight: 600, color: v < 0 ? PALETTE.red : undefined }}>{money(v, r.currency)}</span> },
    { title: 'Status', dataIndex: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canManage && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>}
          {canManage && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this budget?" confirmText="Delete"
              placement="bottomRight" onConfirm={() => remove(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canRead) return <div className="rvp-empty">You don’t have permission to view budgets.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<AimOutlined />} color={PALETTE.red} tint={TINT.red}
        title="Budgets" subtitle="Track spend against caps by scope & period"
        search={search} onSearch={setSearch} searchPlaceholder="Search budgets…"
        onRefresh={load} loading={loading}
      >
        {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Budget</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Budgets', value: stats.total, icon: <AimOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Budgeted', value: money(stats.budgeted), icon: <AimOutlined />, color: PALETTE.violet, tint: TINT.violet },
        { label: 'Spent', value: money(stats.spent), icon: <AimOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Over budget', value: stats.over, icon: <InfoCircleOutlined />, color: PALETTE.red, tint: TINT.red },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }} />
      </div>

      <Drawer title={editingId ? 'Edit budget' : 'New budget'} width={520} open={drawerOpen} onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={<div className="rvp-drawer-foot">
          <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={submit}>{editingId ? 'Save changes' : 'Create'}</Button>
        </div>}>
        <Form form={form} layout="vertical">
          <SectionCard icon={<AimOutlined />} tint={TINT.red} color={PALETTE.red} title="Budget" subtitle="Scope, period and cap">
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder="e.g. Q3 Travel Budget" />
            </Form.Item>
            <Form.Item name="scopeType" label="Scope"><Select options={SCOPES} /></Form.Item>
            {scopeType === 'category' && (
              <Form.Item name="scopeId" label="Category" rules={[{ required: true, message: 'Pick a category' }]}>
                <Select showSearch optionFilterProp="label" options={cats.map((c) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            )}
            {scopeType && scopeType !== 'org' && scopeType !== 'category' && (
              <Form.Item name="scopeId" label={`${SCOPES.find((s) => s.value === scopeType)?.label} ID`} rules={[{ required: true, message: 'ID required' }]}>
                <Input placeholder="Target ID (UUID)" />
              </Form.Item>
            )}
            <Form.Item name="period" label="Period" rules={[{ required: true, message: 'Period required' }]}>
              <DatePicker.RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="amount" label="Amount"
                rules={[{ required: true, message: 'Amount required' }, { type: 'number', min: 1, message: 'Must be at least 1' }]}>
                <InputNumber min={1} prefix={currencySymbol(cur)} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="currency" label="Currency"><CurrencySelect style={{ width: '100%' }} /></Form.Item>
            </div>
            <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
          </SectionCard>
        </Form>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
