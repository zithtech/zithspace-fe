'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Form, Input, InputNumber, Select, Switch, Tooltip, AutoComplete, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined, InfoCircleOutlined,
  SettingOutlined, CheckCircleOutlined, CarOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { Permissions } from '@/types/permissions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ReimbursementV2Service, {
  ExpenseCategory, SaveCategoryInput,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, SectionCard, RmbStyles, money } from './ui';

// Common expense-category names shown as suggestions in the name field.
const NAME_SUGGESTIONS = [
  'Flight Travel', 'Train Travel', 'Local Conveyance', 'Cab / Taxi', 'Fuel / Mileage',
  'Accommodation', 'Hotel Stay', 'Meals & Food', 'Client Entertainment', 'Office Supplies',
  'Mobile / Telephone', 'Internet / Broadband', 'Medical', 'Books & Subscriptions',
  'Training & Courses', 'Team Outing', 'Relocation', 'Visa & Immigration',
  'Printing & Stationery', 'Courier & Postage', 'Software & Tools', 'Miscellaneous',
];

// Derive a stable CODE from a name, e.g. "Flight Travel" → "FLIGHT_TRAVEL".
const toCode = (s: string) =>
  (s || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

// A default chart-of-accounts the GL field suggests. Companies can still type
// their own code — these are only convenient starting points.
const GL_CATALOG: { code: string; label: string }[] = [
  { code: '5001', label: '5001 · Travel' },
  { code: '5002', label: '5002 · Accommodation' },
  { code: '5003', label: '5003 · Meals & Entertainment' },
  { code: '5004', label: '5004 · Fuel & Mileage' },
  { code: '5005', label: '5005 · Telephone & Internet' },
  { code: '5006', label: '5006 · Medical' },
  { code: '5007', label: '5007 · Office Supplies' },
  { code: '5008', label: '5008 · Training & Development' },
  { code: '5009', label: '5009 · Software & Subscriptions' },
  { code: '5010', label: '5010 · Courier & Postage' },
  { code: '5011', label: '5011 · Printing & Stationery' },
  { code: '5012', label: '5012 · Relocation' },
  { code: '5013', label: '5013 · Visa & Immigration' },
  { code: '5099', label: '5099 · Miscellaneous' },
];

// Best-guess GL code from a category name (keyword match). Empty → no guess.
function guessGl(name: string): string {
  const n = (name || '').toLowerCase();
  const has = (...ks: string[]) => ks.some((k) => n.includes(k));
  if (has('flight', 'air ', 'train', 'travel', 'cab', 'taxi', 'conveyance', 'toll', 'parking')) return '5001';
  if (has('hotel', 'stay', 'accommodation', 'lodging')) return '5002';
  if (has('meal', 'food', 'lunch', 'dinner', 'entertain')) return '5003';
  if (has('fuel', 'mileage', 'petrol', 'diesel')) return '5004';
  if (has('phone', 'mobile', 'telephone', 'internet', 'broadband', 'data')) return '5005';
  if (has('medical', 'health', 'doctor', 'pharmacy')) return '5006';
  if (has('office', 'supplies')) return '5007';
  if (has('training', 'course', 'certification', 'learning')) return '5008';
  if (has('software', 'subscription', 'tool', 'saas', 'book')) return '5009';
  if (has('courier', 'postage', 'shipping')) return '5010';
  if (has('print', 'stationery')) return '5011';
  if (has('relocation', 'moving')) return '5012';
  if (has('visa', 'immigration', 'passport')) return '5013';
  return '';
}

export default function CategoriesPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursementPolicy || perms.canManageReimbursements;
  const canCreate = perms.can(Permissions.REIMBURSEMENT_CATEGORY_CREATE) || perms.canManageReimbursements;
  const canUpdate = perms.can(Permissions.REIMBURSEMENT_CATEGORY_UPDATE) || perms.canManageReimbursements;
  const canDelete = perms.can(Permissions.REIMBURSEMENT_CATEGORY_DELETE) || perms.canManageReimbursements;

  const [rows, setRows] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SaveCategoryInput>();
  const kind = Form.useWatch('kind', form);

  // A field label with a hover info icon.
  const labelInfo = (text: string, info: string) => (
    <span>
      {text}{' '}
      <Tooltip title={info}>
        <QuestionCircleOutlined style={{ color: 'var(--text-slate-400)', cursor: 'help' }} />
      </Tooltip>
    </span>
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await ReimbursementV2Service.listCategories(true));
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.isActive).length,
    mileage: rows.filter((r) => r.kind === 'mileage').length,
    receipt: rows.filter((r) => r.receiptRequired).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ kind: 'amount', receiptRequired: false, isActive: true });
    setDrawerOpen(true);
  };
  const openEdit = (r: ExpenseCategory) => {
    setEditing(r);
    form.setFieldsValue({
      name: r.name, code: r.code, description: r.description ?? undefined, glCode: r.glCode ?? undefined,
      kind: r.kind, mileageRate: r.mileageRate ?? undefined, mileageUnit: r.mileageUnit ?? undefined,
      maxPerClaim: r.maxPerClaim ?? undefined, monthlyLimit: r.monthlyLimit ?? undefined,
      yearlyLimit: r.yearlyLimit ?? undefined, perDayLimit: r.perDayLimit ?? undefined,
      receiptRequired: r.receiptRequired, receiptRequiredAbove: r.receiptRequiredAbove ?? undefined,
      isActive: r.isActive,
    });
    setDrawerOpen(true);
  };

  const submit = async () => {
    let values: SaveCategoryInput;
    try { values = await form.validateFields(); } catch { return; }
    setSaving(true);
    try {
      if (editing) {
        await ReimbursementV2Service.updateCategory(editing.id, values);
        message.success('Category updated');
      } else {
        await ReimbursementV2Service.createCategory(values);
        message.success('Category created');
      }
      setDrawerOpen(false);
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to save category');
    } finally { setSaving(false); }
  };

  const remove = async (r: ExpenseCategory) => {
    try {
      await ReimbursementV2Service.deleteCategory(r.id);
      message.success('Category deleted');
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to delete category');
    }
  };

  const columns: ColumnsType<ExpenseCategory> = [
    {
      title: 'Name', dataIndex: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          {r.kind === 'mileage' && <Tag color="cyan">Mileage</Tag>}
        </div>
      ),
    },
    { title: 'Code', dataIndex: 'code', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'GL', dataIndex: 'glCode', render: (v) => v || <span style={{ color: 'var(--text-slate-400)' }}>—</span> },
    {
      title: 'Per-claim cap', dataIndex: 'maxPerClaim',
      render: (v, r) => (r.kind === 'mileage' ? `${money(r.mileageRate)}/${r.mileageUnit || 'unit'}` : v != null ? money(v) : '—'),
    },
    { title: 'Monthly', dataIndex: 'monthlyLimit', render: (v) => (v != null ? money(v) : '—') },
    {
      title: 'Receipt', dataIndex: 'receiptRequired',
      render: (v, r) => (v ? <Tag color="gold">Required</Tag> : r.receiptRequiredAbove != null ? <Tag>Above {money(r.receiptRequiredAbove)}</Tag> : <Tag>Optional</Tag>),
    },
    { title: 'Status', dataIndex: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '', key: 'actions', width: 90, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdate && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>}
          {canDelete && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this category?"
              description={`"${r.name}" will no longer be selectable on new claims.`} confirmText="Delete"
              placement="bottomRight" onConfirm={() => remove(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canRead) return <div className="rvp-empty">You don’t have permission to view categories.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<TagsOutlined />} color={PALETTE.pink} tint={TINT.pink}
        title="Expense Categories" subtitle="Define categories, limits and receipt rules"
        search={search} onSearch={setSearch} searchPlaceholder="Search categories…"
        onRefresh={load} loading={loading}
      >
        {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Category</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total', value: stats.total, icon: <TagsOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Active', value: stats.active, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
        { label: 'Mileage', value: stats.mileage, icon: <CarOutlined />, color: PALETTE.cyan, tint: TINT.cyan },
        { label: 'Receipt required', value: stats.receipt, icon: <InfoCircleOutlined />, color: PALETTE.amber, tint: TINT.amber },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }} />
      </div>

      <Drawer
        title={editing ? 'Edit category' : 'New category'} width={520} open={drawerOpen}
        onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={<div className="rvp-drawer-foot">
          <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={submit}>{editing ? 'Save changes' : 'Create'}</Button>
        </div>}
      >
        <Form form={form} layout="vertical">
          <SectionCard icon={<InfoCircleOutlined />} tint={TINT.blue} color={PALETTE.blue}
            title="Basics" subtitle="Identity and type" step="STEP 1">
            <Form.Item name="name" label="Name"
              rules={[{ required: true, message: 'Name is required' }, { max: 120, message: 'Too long' }]}>
              <AutoComplete
                placeholder="Start typing, e.g. Flight Travel"
                options={NAME_SUGGESTIONS.map((v) => ({ value: v }))}
                filterOption={(input, option) =>
                  String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                onChange={(val) => {
                  const s = String(val || '');
                  const patch: any = { code: toCode(s) };
                  const gl = guessGl(s);
                  if (gl) patch.glCode = gl; // suggest; don't clear a manual value
                  form.setFieldsValue(patch);
                }}
              />
            </Form.Item>
            <Form.Item name="code" label={labelInfo('Code', 'Auto-generated from the name and used as a unique key. It cannot be edited.')}
              rules={[{ required: true, message: 'Enter a name to generate the code' },
                { pattern: /^[A-Z0-9_-]+$/, message: 'Invalid code' }]}>
              <Input placeholder="FLIGHT_TRAVEL" disabled />
            </Form.Item>
            <Form.Item name="glCode"
              label={labelInfo('GL / accounting code', 'General Ledger code that maps this expense to your finance books (e.g. 5001-Travel). Suggested from the name — edit or pick your own. Optional.')}
              rules={[{ max: 60, message: 'Max 60 characters' },
                { pattern: /^[A-Za-z0-9 _./-]*$/, message: 'Letters, numbers and . _ / - only' }]}>
              <AutoComplete
                placeholder="Suggested from the name — or pick / type your own"
                options={GL_CATALOG.map((g) => ({ value: g.code, label: g.label }))}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                  String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ max: 500, message: 'Max 500 characters' }]}>
              <Input.TextArea rows={2} maxLength={500} placeholder="Optional" />
            </Form.Item>
            <Form.Item name="kind" label="Type">
              <Select options={[{ value: 'amount', label: 'Amount (normal expense)' }, { value: 'mileage', label: 'Mileage (per distance)' }]} />
            </Form.Item>
            {kind === 'mileage' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item name="mileageRate"
                  label={labelInfo('Rate per unit', 'Amount reimbursed per unit of distance. Claim amount = distance × this rate.')}
                  rules={[{ required: true, message: 'Rate is required' },
                    { type: 'number', min: 0.01, message: 'Must be greater than 0' }]}>
                  <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="12" />
                </Form.Item>
                <Form.Item name="mileageUnit" label="Unit"
                  rules={[{ required: true, message: 'Unit is required' },
                    { pattern: /^[A-Za-z]{1,10}$/, message: 'Letters only (e.g. km)' }]}>
                  <Input placeholder="km" maxLength={10} />
                </Form.Item>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={<SettingOutlined />} tint={TINT.amber} color={PALETTE.amber}
            title="Limits & receipts" subtitle="Caps enforced at submission" step="STEP 2">
            {kind !== 'mileage' && (
              <Form.Item name="maxPerClaim"
                label={labelInfo('Max per line item', 'The largest single expense allowed in this category. Claims above this are blocked at submission.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" />
              </Form.Item>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="perDayLimit" label="Per-day limit" rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" />
              </Form.Item>
              <Form.Item name="monthlyLimit" label="Monthly limit" rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" />
              </Form.Item>
              <Form.Item name="yearlyLimit" label="Yearly limit" rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" />
              </Form.Item>
              <Form.Item name="receiptRequiredAbove"
                label={labelInfo('Receipt required above', 'A receipt is required only when a single expense exceeds this amount. Leave empty to never require one this way.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Threshold" />
              </Form.Item>
            </div>
            <Form.Item name="receiptRequired"
              label={labelInfo('Always require a receipt', 'When on, every expense in this category needs a receipt regardless of amount.')} valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
          </SectionCard>
        </Form>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
