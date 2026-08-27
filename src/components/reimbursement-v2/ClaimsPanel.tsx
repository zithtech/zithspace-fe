'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Form, Input, InputNumber, Select, DatePicker, Tooltip,
  message, notification, Upload, Descriptions, Divider, Empty, Checkbox, Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  PlusOutlined, DeleteOutlined, SolutionOutlined, SendOutlined, PaperClipOutlined,
  FileTextOutlined, InboxOutlined, EyeOutlined, CloseCircleOutlined, DollarOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { Permissions } from '@/types/permissions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ReimbursementV2Service, {
  Claim, ClaimDetail, ExpenseCategory, Advance,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, fmtDate, StatusTag, CurrencySelect, preventInvalidNumberKeys } from './ui';
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'partially_reconciled', label: 'Partially Reconciled' },
  { value: 'reconciled', label: 'Reconciled' },
];

export default function ClaimsPanel({ hideSidebarToggle }: { hideSidebarToggle?: boolean } = {}) {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursement || perms.canManageReimbursements || perms.canReadMyHubClaims;
  const canCreate = perms.canCreateReimbursement || perms.canManageReimbursements || perms.canReadMyHubClaims;

  const [rows, setRows] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState<ClaimDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [headerForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  // Local build for the single-step "New claim" flow (saved together on submit).
  const [newItems, setNewItems] = useState<Array<{
    key: string; categoryId: string; categoryName: string; kind: 'amount' | 'mileage';
    expenseDate: string; amount: number | null; distance: number | null;
    merchant: string | null; billNo: string | null; description: string | null; preview: number;
  }>>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter]);

  const catById = useCallback((id: string) => cats.find((c) => c.id === id), [cats]);
  const selectedCatId = Form.useWatch('categoryId', itemForm);
  const selectedCat = selectedCatId ? catById(selectedCatId) : undefined;
  const headerCurrency = (Form.useWatch('currency', headerForm) as string) || 'INR';
  const newItemsTotal = useMemo(() => newItems.reduce((s, i) => s + i.preview, 0), [newItems]);
  const previewAmount = (cat: ExpenseCategory | undefined, amount: number | null, distance: number | null) =>
    cat?.kind === 'mileage' ? (distance || 0) * (cat.mileageRate || 0) : (amount || 0);

  const load = useCallback(async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const [result, cat] = await Promise.all([
        ReimbursementV2Service.listMyClaims({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: debouncedSearch || undefined,
          page,
          limit,
        }),
        ReimbursementV2Service.listCategories({ includeInactive: false, limit: 1000 }),
      ]);
      setRows(result.data);
      setTotal(result.pagination.total);
      setCats(cat.data);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load claims');
    } finally { setLoading(false); }
  }, [statusFilter, debouncedSearch, currentPage, pageSize]);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total,
    draft: rows.filter((r) => r.status === 'draft').length,
    pending: rows.filter((r) => r.status === 'pending').length,
    paidAmt: rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.baseAmount, 0),
  }), [rows, total]);

  const openCreate = async () => {
    setCurrent(null);
    setCreating(true);
    headerForm.resetFields();
    itemForm.resetFields();
    setNewItems([]);
    setNewFiles([]);
    setMultiCurrency(false);
    headerForm.setFieldsValue({ currency: 'INR', exchangeRate: 1 });
    try { setCats((await ReimbursementV2Service.listCategories({ includeInactive: false, limit: 1000 })).data); } catch { /* non-fatal */ }
    try {
      setAdvances((await ReimbursementV2Service.listMyAdvances({ limit: 100 })).data.filter((a) => a.status === 'paid' || a.status === 'partially_reconciled'));
    } catch { /* non-fatal */ }
    setDrawerOpen(true);
  };

  const openManage = async (claimId: string) => {
    try {
      const detail = await ReimbursementV2Service.getClaim(claimId);
      setCurrent(detail);
      setCreating(false);
      itemForm.resetFields();
      setDrawerOpen(true);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to open claim');
    }
  };

  // ── Single-step create: build items/files locally, save all at once ─────────
  const addLocalItem = async () => {
    let v: any;
    try { v = await itemForm.validateFields(); } catch { return; }
    const cat = catById(v.categoryId);
    const amount = v.amount ?? null;
    const distance = v.distance ?? null;
    setNewItems((prev) => [...prev, {
      key: Math.random().toString(36).slice(2),
      categoryId: v.categoryId,
      categoryName: cat?.name || 'Category',
      kind: (cat?.kind as any) || 'amount',
      expenseDate: dayjs(v.expenseDate).format('YYYY-MM-DD'),
      amount, distance,
      merchant: v.merchant ?? null, billNo: v.billNo ?? null, description: v.description ?? null,
      preview: previewAmount(cat, amount, distance),
    }]);
    itemForm.resetFields();
  };

  const removeLocalItem = (key: string) => setNewItems((prev) => prev.filter((i) => i.key !== key));
  const addNewFile = (file: File) => setNewFiles((prev) => [...prev, file]);
  const removeNewFile = (idx: number) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  const saveNew = async (submitAfter: boolean) => {
    let v: any;
    try { v = await headerForm.validateFields(); } catch { return; }
    if (submitAfter && newItems.length === 0) { message.warning('Add at least one item to submit'); return; }

    // Validate limits on both Save Draft and Save & Submit
    try {
      await ReimbursementV2Service.validateClaim({
        title: v.title, currency: v.currency, exchangeRate: v.exchangeRate ?? 1, advanceId: v.advanceId ?? null,
        items: newItems.map((li) => ({
          categoryId: li.categoryId, expenseDate: li.expenseDate,
          amount: li.amount, distance: li.distance,
          merchant: li.merchant, billNo: li.billNo, description: li.description,
        })),
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to validate claim';
      setLimitError(msg);
      return;
    }

    setBusy(true);
    try {
      const detail = await ReimbursementV2Service.createClaim({
        title: v.title, currency: v.currency, exchangeRate: v.exchangeRate ?? 1, advanceId: v.advanceId ?? null,
        items: newItems.map((li) => ({
          categoryId: li.categoryId, expenseDate: li.expenseDate,
          amount: li.amount, distance: li.distance,
          merchant: li.merchant, billNo: li.billNo, description: li.description,
        })),
      });
      try {
        if (newFiles.length) await ReimbursementV2Service.uploadReceipts(detail.id, newFiles); // claim-level
        if (submitAfter) {
          const done = await ReimbursementV2Service.submitClaim(detail.id);
          message.success(done.status === 'approved' ? `Auto-approved (${done.claimNo})` : `Submitted ${done.claimNo}`);
        } else {
          message.success(`Draft ${detail.claimNo} saved`);
        }
      } catch (err: any) {
        if (submitAfter) {
          await ReimbursementV2Service.deleteClaim(detail.id).catch(() => { });
        }
        throw err;
      }
      setDrawerOpen(false);
      setNewItems([]); setNewFiles([]);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to save claim';
      if (msg.toLowerCase().includes('exceeds')) {
        Modal.error({ title: 'Limit Exceeded', content: msg, zIndex: 2000 });
      } else {
        message.error(msg);
      }
    } finally { setBusy(false); }
  };

  // Shared line-item field grid (used in the create build + the draft manager).
  const renderItemFields = () => (
    <>
      <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Pick a category' }]}>
        <SearchableDropdown
          placeholder="Select category"
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          itemNoun="categories"
          hideAvatar
          width="100%"
        />
      </Form.Item>
      <Form.Item name="expenseDate" label="Date" rules={[{ required: true, message: 'Date required' }]}>
        <DatePicker inputReadOnly style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>
      {selectedCat?.kind === 'mileage' ? (
        <Form.Item name="distance" label={`Distance (${selectedCat.mileageUnit || 'units'})`} rules={[{ required: true, message: 'Distance required' }]}>
          <InputNumber min={0} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
        </Form.Item>
      ) : (
        <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Amount required' }]}>
          <InputNumber min={0} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
        </Form.Item>
      )}
      <Form.Item name="merchant" label="Merchant" rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}><Input placeholder="Optional" /></Form.Item>
      <Form.Item name="billNo" label="Bill no." rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}><Input placeholder="Optional" /></Form.Item>
      <Form.Item name="description" label="Description" rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}><Input placeholder="Optional" /></Form.Item>
    </>
  );

  const addItem = async () => {
    if (!current) return;
    let v: any;
    try { v = await itemForm.validateFields(); } catch { return; }
    setBusy(true);
    try {
      const detail = await ReimbursementV2Service.addItem(current.id, {
        categoryId: v.categoryId,
        expenseDate: dayjs(v.expenseDate).format('YYYY-MM-DD'),
        amount: v.amount ?? null,
        distance: v.distance ?? null,
        merchant: v.merchant ?? null,
        billNo: v.billNo ?? null,
        description: v.description ?? null,
      });
      setCurrent(detail);
      itemForm.resetFields();
      message.success('Item added');
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to add item');
    } finally { setBusy(false); }
  };

  const removeItem = async (itemId: string) => {
    if (!current) return;
    try {
      setCurrent(await ReimbursementV2Service.removeItem(current.id, itemId));
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to remove item');
    }
  };

  const uploadReceipt = async (file: File, claimItemId?: string) => {
    if (!current) return;
    setBusy(true);
    try {
      setCurrent(await ReimbursementV2Service.uploadReceipts(current.id, [file], claimItemId));
      message.success('Receipt uploaded');
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to upload receipt');
    } finally { setBusy(false); }
  };

  const removeReceipt = async (attId: string) => {
    if (!current) return;
    try { setCurrent(await ReimbursementV2Service.removeReceipt(current.id, attId)); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to remove receipt'); }
  };

  const submitClaim = async () => {
    if (!current) return;


    setBusy(true);
    try {
      const detail = await ReimbursementV2Service.submitClaim(current.id);
      message.success(detail.status === 'approved' ? 'Auto-approved!' : 'Submitted for approval');
      setDrawerOpen(false);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to submit';
      setLimitError(msg);
    } finally { setBusy(false); }
  };

  const cancelClaim = async (id: string) => {
    try { await ReimbursementV2Service.cancelClaim(id); message.success('Claim cancelled'); await load(); if (current?.id === id) setDrawerOpen(false); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to cancel'); }
  };

  const deleteDraft = async (id: string) => {
    try { await ReimbursementV2Service.deleteClaim(id); message.success('Draft deleted'); await load(); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to delete'); }
  };

  const columns: ColumnsType<Claim> = [
    {
      title: 'Claim', dataIndex: 'claimNo', render: (v, r) => (
        <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.title || '—'}</div></div>)
    },
    { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag status={v} /> },
    {
      title: 'Amount', dataIndex: 'totalAmount', align: 'right', render: (v, r) => (
        <div><div style={{ fontWeight: 600 }}>{money(v, r.currency)}</div>
          {r.currency !== r.baseCurrency && <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{money(r.baseAmount, r.baseCurrency)}</div>}</div>)
    },
    { title: 'Created', dataIndex: 'createdAt', render: (v) => fmtDate(v) },
    {
      title: 'Actions', key: 'actions', width: 120, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <Tooltip title={r.status === 'draft' ? 'Edit' : 'View'}>
            <Button type="text" size="small" icon={r.status === 'draft' ? <SolutionOutlined /> : <EyeOutlined />} onClick={() => openManage(r.id)} />
          </Tooltip>
          {['draft', 'pending'].includes(r.status) && (
            <ConfirmDialog tone="warning" icon={<CloseCircleOutlined />} title="Cancel this claim?" confirmText="Cancel claim"
              placement="bottomRight" onConfirm={() => cancelClaim(r.id)}>
              <Button type="text" size="small" icon={<CloseCircleOutlined />} />
            </ConfirmDialog>
          )}
          {r.status === 'draft' && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this draft?" confirmText="Delete"
              placement="bottomRight" onConfirm={() => deleteDraft(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  const isDraft = current?.status === 'draft';

  if (!canRead) return <div className="rvp-empty">You don’t have permission to view claims.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        hideSidebarToggle={hideSidebarToggle}
        icon={<SolutionOutlined />} color={PALETTE.green} tint={TINT.green}
        title="My Claims" subtitle="Create, submit and track expense claims"
        search={search} onSearch={setSearch} searchPlaceholder="Search claims…"
        onRefresh={load} loading={loading}
      >
        <SearchableDropdown
          placeholder="All statuses"
          itemNoun="statuses"
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(v) => setStatusFilter((v as string) ?? 'all')}
          options={STATUS_OPTIONS}
          style={{ width: 160 }}
          width={220}
        />
        {canCreate && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New Claim</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total claims', value: stats.total, icon: <FileTextOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Drafts', value: stats.draft, icon: <SolutionOutlined />, color: PALETTE.grey, tint: TINT.grey },
        { label: 'Pending', value: stats.pending, icon: <SendOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Paid (base)', value: money(stats.paidAmt), icon: <DollarOutlined />, color: PALETTE.green, tint: TINT.green },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={rows}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t) => `${t} claims`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size ?? pageSize);
            },
          }} locale={{ emptyText: <NoData /> }} />
      </div>

      <Drawer
        {...commonDrawerProps}
        title={null}
        width={640}
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
              {creating ? 'Cancel' : 'Close'}
            </Button>
            {creating && (
              <>
                <Button loading={busy} onClick={() => saveNew(false)} style={{ borderRadius: 8, height: 36 }}>
                  Save as draft
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={busy}
                  disabled={newItems.length === 0}
                  onClick={() => saveNew(true)}
                  style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
                >
                  Save &amp; submit
                </Button>
              </>
            )}
            {!creating && isDraft && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={busy}
                disabled={!current || current.items.length === 0}
                onClick={submitClaim}
                style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
              >
                Submit
              </Button>
            )}
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
                background: creating ? TINT.blue : TINT.green,
                color: creating ? PALETTE.blue : PALETTE.green,
                border: creating ? '1px solid var(--border-blue-200)' : '1px solid var(--border-green-200)',
              }}
            >
              {creating ? <PlusOutlined style={{ fontSize: 18 }} /> : <SolutionOutlined style={{ fontSize: 18 }} />}
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {creating ? 'New claim' : current ? `${current.claimNo} · ${current.status}` : 'Claim'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {creating ? 'Create and submit a new expense claim' : 'View or update claim details'}
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
          {creating && (
            <>
              <Form form={headerForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left" colon={false} requiredMark="optional" className="customer-drawer-form">
                <SectionCard icon={<FileTextOutlined />}
                  title="Claim details" subtitle="What is this claim for? The total is calculated from the line items below." step="STEP 1">
                  <Form.Item name="title" label="Title" rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}><Input placeholder="e.g. Client visit — Mumbai" /></Form.Item>
                  {advances.length > 0 && (
                    <Form.Item name="advanceId" label="Settle against advance (optional)">
                      <Select allowClear placeholder="Pick a paid advance"
                        options={advances.map((a) => ({ value: a.id, label: `${a.advanceNo} · outstanding ${money(a.outstanding, a.currency)}` }))} />
                    </Form.Item>
                  )}
                  <Checkbox
                    checked={multiCurrency}
                    onChange={(e) => {
                      setMultiCurrency(e.target.checked);
                      if (!e.target.checked) headerForm.setFieldsValue({ currency: 'INR', exchangeRate: 1 });
                    }}
                  >
                    Expenses are in a currency other than INR
                  </Checkbox>
                  {multiCurrency && (
                    <div style={{ marginTop: 12 }}>
                      <Form.Item name="currency" label="Currency"><CurrencySelect style={{ width: '100%' }} /></Form.Item>
                      <Form.Item name="exchangeRate" label={<span>Exchange rate → INR{' '}
                        <Tooltip title="How many INR one unit of the chosen currency is worth. The claim is stored in INR for reporting."><span style={{ color: 'var(--text-slate-400)' }}>ⓘ</span></Tooltip>
                      </span>}>
                        <InputNumber min={0} step={0.0001} style={{ width: '100%' }} placeholder="e.g. 83" onKeyDown={preventInvalidNumberKeys as any} />
                      </Form.Item>
                    </div>
                  )}
                </SectionCard>
              </Form>

              <SectionCard icon={<SolutionOutlined />}
                title="Line items" subtitle="Add each expense — saved with the claim" step="STEP 2">
                {newItems.length === 0 && <NoData description="No items added yet" />}
                {newItems.map((li) => (
                  <div key={li.key} className="rvp-line-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{li.categoryName} · {money(li.preview, headerCurrency)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>
                        {fmtDate(li.expenseDate)}{li.merchant ? ` · ${li.merchant}` : ''}{li.distance ? ` · ${li.distance} units` : ''}
                      </div>
                    </div>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeLocalItem(li.key)} />
                  </div>
                ))}
                {newItems.length > 0 && (
                  <div style={{ textAlign: 'right', fontWeight: 700, margin: '6px 2px 2px' }}>
                    Total: {money(newItemsTotal, headerCurrency)}
                  </div>
                )}
                <Divider style={{ margin: '12px 0' }} />
                <Form form={itemForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left" colon={false} requiredMark="optional" className="customer-drawer-form">
                  {renderItemFields()}
                  <Button icon={<PlusOutlined />} onClick={addLocalItem} block>Add item</Button>
                </Form>
              </SectionCard>

              <SectionCard icon={<PaperClipOutlined />}
                title="Receipts" subtitle="Attach bills / invoices (optional)">
                {newFiles.map((f, i) => (
                  <div key={i} className="rvp-line-item">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><PaperClipOutlined /> {f.name}</span>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeNewFile(i)} />
                  </div>
                ))}
                <Upload.Dragger multiple showUploadList={false}
                  beforeUpload={(file) => { addNewFile(file as File); return false; }} style={{ marginTop: 8 }}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">Click or drag files to attach receipts</p>
                </Upload.Dragger>
              </SectionCard>
            </>
          )}

          {!creating && current && (
            <>
              <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Status"><StatusTag status={current.status} /></Descriptions.Item>
                <Descriptions.Item label="Total">{money(current.totalAmount, current.currency)}</Descriptions.Item>
                {current.decisionNote && <Descriptions.Item label="Note" span={2}>{current.decisionNote}</Descriptions.Item>}
                {current.paymentReference && <Descriptions.Item label="Payment ref" span={2}>{current.paymentReference}</Descriptions.Item>}
              </Descriptions>

              <SectionCard icon={<SolutionOutlined />}
                title="Line items" subtitle={isDraft ? 'Add expenses to this claim' : 'Expenses on this claim'}>
                {current.items.length === 0 && <NoData description="No items yet" />}
                {current.items.map((it) => (
                  <div key={it.id} className="rvp-line-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.categoryName || it.categoryCode} · {money(it.amount, current.currency)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>
                        {fmtDate(it.expenseDate)}{it.merchant ? ` · ${it.merchant}` : ''}{it.distance ? ` · ${it.distance} units` : ''}
                      </div>
                    </div>
                    {isDraft && <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(it.id)} />}
                  </div>
                ))}

                {isDraft && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Form form={itemForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left" colon={false} requiredMark="optional" className="customer-drawer-form">
                      {renderItemFields()}
                      <Button icon={<PlusOutlined />} loading={busy} onClick={addItem} block>Add item</Button>
                    </Form>
                  </>
                )}
              </SectionCard>

              <SectionCard icon={<PaperClipOutlined />}
                title="Receipts" subtitle="Attach bills / invoices">
                {current.attachments.map((a) => (
                  <div key={a.id} className="rvp-line-item">
                    <a href={a.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PaperClipOutlined /> {a.fileName}
                    </a>
                    {isDraft && <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeReceipt(a.id)} />}
                  </div>
                ))}
                {isDraft && (
                  <Upload.Dragger multiple showUploadList={false} disabled={busy}
                    beforeUpload={(file) => { uploadReceipt(file as File); return false; }} style={{ marginTop: 8 }}>
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p className="ant-upload-text">Click or drag files to upload receipts</p>
                  </Upload.Dragger>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </Drawer>
      <Modal
        title={null}
        open={!!limitError}
        onOk={() => setLimitError(null)}
        onCancel={() => setLimitError(null)}
        zIndex={2000}
        closeIcon={false}
        width={400}
        centered
        styles={{
          mask: { backdropFilter: 'blur(12px)', background: 'var(--modal-mask-bg, rgba(15, 23, 42, 0.65))' },
          content: {
            background: 'var(--bg-pure-white, #FFFFFF)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 24,
            padding: '36px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.05) inset',
            textAlign: 'center'
          },
          body: { padding: 0 },
          footer: { display: 'none' }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{
              position: 'absolute', inset: -14, background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '50%', filter: 'blur(16px)', zIndex: 0
            }} />
            <div style={{
              position: 'relative', zIndex: 1,
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '4px solid #ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px -4px rgba(239, 68, 68, 0.25)'
            }}>
              <CloseCircleOutlined style={{ fontSize: 32, color: '#ef4444' }} />
            </div>
          </div>

          <h3 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--text-slate-900, #0f172a)',
            marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2
          }}>
            Policy Limit Exceeded
          </h3>

          <div style={{
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.03) 0%, rgba(239, 68, 68, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 16,
            padding: '16px 20px',
            color: 'var(--text-slate-700, #334155)',
            fontSize: 14.5,
            lineHeight: 1.6,
            fontWeight: 500,
            marginBottom: 32,
            width: '100%',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            {limitError}
          </div>

          <Button
            type="primary"
            onClick={() => setLimitError(null)}
            block
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 16,
              height: 50,
              boxShadow: '0 8px 20px -6px rgba(239, 68, 68, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px -6px rgba(239, 68, 68, 0.65), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px -6px rgba(239, 68, 68, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
          >
            Acknowledge & Close
          </Button>
        </div>
      </Modal>
      <RmbStyles />
      <style jsx global>{`
        .rvp-line-item {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 8px 10px; border: 1px solid var(--border-slate-100); border-radius: 8px; margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
