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
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ReimbursementV2Service, {
  ExpenseCategory, SaveCategoryInput,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, tablePaginationConfig, preventInvalidNumberKeys } from './ui';
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async (p = page, l = limit, s = debouncedSearch) => {
    setLoading(true);
    try {
      const res = await ReimbursementV2Service.listCategories({ includeInactive: true, page: p, limit: l, search: s });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: total,
    active: rows.filter((r) => r.isActive).length,
    mileage: rows.filter((r) => r.kind === 'mileage').length,
    receipt: rows.filter((r) => r.receiptRequired).length,
  }), [rows, total]);

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
      title: 'Actions', key: 'actions', width: 90, align: 'right',
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
        {canCreate && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New Category</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total', value: stats.total, icon: <TagsOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Active', value: stats.active, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
        { label: 'Mileage', value: stats.mileage, icon: <CarOutlined />, color: PALETTE.cyan, tint: TINT.cyan },
        { label: 'Receipt required', value: stats.receipt, icon: <InfoCircleOutlined />, color: PALETTE.amber, tint: TINT.amber },
      ]} />

      <div className="rvp-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
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
              icon={editing ? <EditOutlined /> : <PlusOutlined />}
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editing ? 'Save Changes' : 'Create Category'}
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
                background: editing ? TINT.amber : TINT.blue,
                color: editing ? PALETTE.amber : PALETTE.blue,
                border: '1px solid var(--border-blue-200)',
              }}
            >
              {editing ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {editing ? 'Edit Category' : 'New Category'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {editing ? `Update details for ${editing.name}` : 'Define a category for expenses'}
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
              title="Basics" subtitle="Identity and type" step="STEP 1">
              <Form.Item name="name" label="Name"
                rules={[{ required: true, message: 'Name is required' }, { max: 120, message: 'Too long' }, { pattern: /^[a-zA-Z0-9\s\-_.,()&/]*$/, message: 'Special characters are not allowed' }]}>
                <SearchableDropdown
                  freeText
                  placeholder="Start typing, e.g. Flight Travel"
                  options={NAME_SUGGESTIONS.map((v) => ({ value: v, label: v }))}
                  onChange={(val) => {
                    const s = String(val || '');
                    const patch: any = { name: s, code: toCode(s) };
                    const gl = guessGl(s);
                    if (gl) patch.glCode = gl;
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
                <SearchableDropdown
                  freeText
                  placeholder="Suggested from the name — or pick / type your own"
                  options={GL_CATALOG.map((g) => ({ value: g.code, label: g.label }))}
                />
              </Form.Item>
              <Form.Item name="description" label="Description" rules={[{ max: 500, message: 'Max 500 characters' }, { pattern: /^[a-zA-Z0-9\s\-_.,()&/]*$/, message: 'Special characters are not allowed' }]}>
                <Input.TextArea rows={2} maxLength={500} placeholder="Optional" />
              </Form.Item>
              <Form.Item name="kind" label="Type">
                <SearchableDropdown options={[{ value: 'amount', label: 'Amount (normal expense)' }, { value: 'mileage', label: 'Mileage (per distance)' }]} />
              </Form.Item>
              {kind === 'mileage' && (
                <>
                  <Form.Item name="mileageRate"
                    label={labelInfo('Rate per unit', 'Amount reimbursed per unit of distance. Claim amount = distance × this rate.')}
                    rules={[{ required: true, message: 'Rate is required' },
                    { type: 'number', min: 0.01, message: 'Must be greater than 0' }]}>
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="12" onKeyDown={preventInvalidNumberKeys as any} />
                  </Form.Item>
                  <Form.Item name="mileageUnit" label="Unit"
                    rules={[{ required: true, message: 'Unit is required' },
                    { pattern: /^[A-Za-z]{1,10}$/, message: 'Letters only (e.g. km)' }]}>
                    <Input placeholder="km" maxLength={10} />
                  </Form.Item>
                </>
              )}
            </SectionCard>

            <SectionCard icon={<SettingOutlined />}
              title="Limits & receipts" subtitle="Caps enforced at submission" step="STEP 2">
              {kind !== 'mileage' && (
                <Form.Item name="maxPerClaim"
                  label={labelInfo('Max per line item', 'The largest single expense allowed in this category. Claims above this are blocked at submission.')}
                  rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                </Form.Item>
              )}
              <>
                <Form.Item name="perDayLimit" label="Per-day limit" rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                </Form.Item>
                <Form.Item name="monthlyLimit" label="Monthly limit" rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                </Form.Item>
                <Form.Item name="yearlyLimit" label="Yearly limit" rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" onKeyDown={preventInvalidNumberKeys as any} />
                </Form.Item>
                <Form.Item name="receiptRequiredAbove"
                  label={labelInfo('Receipt required above', 'A receipt is required only when a single expense exceeds this amount. Leave empty to never require one this way.')}
                  rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="Threshold" onKeyDown={preventInvalidNumberKeys as any} />
                </Form.Item>
              </>
              <Form.Item name="receiptRequired"
                label={labelInfo('Always require a receipt', 'When on, every expense in this category needs a receipt regardless of amount.')} valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
            </SectionCard>
          </Form>
        </div>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
