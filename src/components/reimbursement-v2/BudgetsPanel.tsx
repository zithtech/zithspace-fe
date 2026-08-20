'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Form, Input, InputNumber, Select, Switch, DatePicker, Tooltip, message, Alert
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AimOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { Permissions } from '@/types/permissions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ReimbursementV2Service, { Budget, ExpenseCategory, SaveBudgetInput } from '@/services/reimbursementV2Service';
import { userService } from '@/services/userService';
import { DepartmentService } from '@/services/departmentService';
import { ProjectService } from '@/services/projectService';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, fmtDate, CurrencySelect, currencySymbol, tablePaginationConfig, preventInvalidNumberKeys } from './ui';
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const scopeType = Form.useWatch('scopeType', form);
  const cur = Form.useWatch('currency', form);

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async (p = page, l = limit, s = debouncedSearch) => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        ReimbursementV2Service.listBudgets({ includeInactive: true, page: p, limit: l, search: s }),
        ReimbursementV2Service.listCategories({ includeInactive: true, limit: 1000 }),
      ]);
      setRows(b.data);
      setTotal(b.pagination.total);
      setCats(c.data);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load budgets'); }
    finally { setLoading(false); }
  }, [page, limit, debouncedSearch]);

  const loadOptions = useCallback(async () => {
    try {
      const [uRes, dRes, pRes] = await Promise.all([
        userService.getUsers(),
        DepartmentService.getAll(),
        ProjectService.getProjectsForSelect(),
      ]);
      const u = (uRes as any).data?.data || (uRes as any).data || uRes;
      const d = (dRes as any).data?.data || (dRes as any).data || dRes;
      const p = (pRes as any).data?.data || (pRes as any).data || pRes;
      setUsers(Array.isArray(u) ? u : []);
      setDepartments(Array.isArray(d) ? d : []);
      setProjects(Array.isArray(p) ? p : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (canRead) {
      load();
      loadOptions();
    }
  }, [canRead, load, loadOptions]);

  const stats = useMemo(() => ({
    total: total,
    budgeted: rows.reduce((s, r) => s + r.amount, 0),
    spent: rows.reduce((s, r) => s + r.spent, 0),
    over: rows.filter((r) => r.utilization >= 1).length,
  }), [rows, total]);

  const openCreate = () => {
    setEditingId(null);
    setSubmitError(null);
    form.resetFields();
    form.setFieldsValue({ scopeType: 'org', currency: 'INR', isActive: true });
    setDrawerOpen(true);
  };
  const openEdit = (r: Budget) => {
    setEditingId(r.id);
    setSubmitError(null);
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
    } catch (e: any) {
      const errMsg = e?.response?.data?.error || e?.message || 'Failed to save budget';
      setSubmitError(errMsg);
    }
    finally { setSaving(false); }
  };

  const remove = async (r: Budget) => {
    try { await ReimbursementV2Service.deleteBudget(r.id); message.success('Budget deleted'); await load(); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to delete'); }
  };

  const columns: ColumnsType<Budget> = [
    {
      title: 'Budget', dataIndex: 'name', render: (v, r) => (
        <div><div style={{ fontWeight: 600 }}>{v}</div>
          <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{SCOPES.find((s) => s.value === r.scopeType)?.label}</div></div>)
    },
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
      title: 'Actions', key: 'actions', width: 90, align: 'right',
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
        {canManage && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New Budget</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Budgets', value: stats.total, icon: <AimOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Budgeted', value: money(stats.budgeted), icon: <AimOutlined />, color: PALETTE.violet, tint: TINT.violet },
        { label: 'Spent', value: money(stats.spent), icon: <AimOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Over budget', value: stats.over, icon: <InfoCircleOutlined />, color: PALETTE.red, tint: TINT.red },
      ]} />

      <div className="rvp-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
          <Table rowKey="id" size="middle" columns={columns} dataSource={rows}
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
        </ZukvoLoadingOverlay>
      </div>

      <Drawer
        {...commonDrawerProps}
        title={null}
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
              {editingId ? 'Save Changes' : 'Create Budget'}
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
                background: editingId ? TINT.amber : TINT.red,
                color: editingId ? PALETTE.amber : PALETTE.red,
                border: '1px solid var(--border-red-200)',
              }}
            >
              {editingId ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {editingId ? 'Edit Budget' : 'New Budget'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {editingId ? `Update details for this budget` : 'Define a budget to track spend'}
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
          {submitError && (
            <Alert
              message={submitError}
              type="error"
              showIcon
              closable
              onClose={() => setSubmitError(null)}
              style={{ marginBottom: 16 }}
            />
          )}
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
            <SectionCard icon={<AimOutlined />} title="Budget" subtitle="Scope, period and cap">
              <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }, { pattern: /^[a-zA-Z0-9\s\-_.,()&/]*$/, message: 'Special characters are not allowed' }]}>
                <Input placeholder="e.g. Q3 Travel Budget" />
              </Form.Item>
              <Form.Item name="scopeType" label="Scope"><SearchableDropdown options={SCOPES} /></Form.Item>
              {scopeType === 'category' && (
                <Form.Item name="scopeId" label="Category" rules={[{ required: true, message: 'Pick a category' }]}>
                  <SearchableDropdown options={cats.map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
              )}
              {scopeType === 'user' && (
                <Form.Item name="scopeId" label="User" rules={[{ required: true, message: 'Pick a user' }]}>
                  <SearchableDropdown options={users.map((u) => ({ value: u.id, label: u.name, avatarUrl: u.avatarUrl }))} />
                </Form.Item>
              )}
              {scopeType === 'department' && (
                <Form.Item name="scopeId" label="Department" rules={[{ required: true, message: 'Pick a department' }]}>
                  <SearchableDropdown options={departments.map((d) => ({ value: d.id, label: d.name }))} />
                </Form.Item>
              )}
              {scopeType === 'project' && (
                <Form.Item name="scopeId" label="Project" rules={[{ required: true, message: 'Pick a project' }]}>
                  <SearchableDropdown options={projects.map((p) => ({ value: p.value || p.id, label: p.label || p.name }))} />
                </Form.Item>
              )}
              {scopeType && !['org', 'category', 'user', 'department', 'project'].includes(scopeType) && (
                <Form.Item name="scopeId" label={`${SCOPES.find((s) => s.value === scopeType)?.label} ID`} rules={[{ required: true, message: 'ID required' }]}>
                  <Input placeholder="Target ID (UUID)" />
                </Form.Item>
              )}
              <Form.Item name="period" label="Period" rules={[{ required: true, message: 'Period required' }]}>
                <DatePicker.RangePicker inputReadOnly style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <>
                <Form.Item name="amount" label="Amount"
                  rules={[{ required: true, message: 'Amount required' }, { type: 'number', min: 1, message: 'Must be at least 1' }]}>
                  <InputNumber min={1} prefix={currencySymbol(cur)} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
                </Form.Item>
                <Form.Item name="currency" label="Currency"><CurrencySelect style={{ width: '100%' }} /></Form.Item>
              </>
              <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
            </SectionCard>
          </Form>
        </div>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
