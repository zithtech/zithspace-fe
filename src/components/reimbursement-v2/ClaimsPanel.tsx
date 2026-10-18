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
import {
  X,
  Receipt,
  Calendar,
  Store,
  ExternalLink,
  XCircle,
  CheckCircle2,
  CreditCard,
  Trash2,
  Paperclip,
  FileText,
  Clock,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Copy,
  Eye,
  Download,
  Edit2,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { Permissions } from '@/types/permissions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ReimbursementV2Service, {
  Claim, ClaimDetail, ExpenseCategory, Advance, ClaimAttachment,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, fmtDate, StatusTag, CurrencySelect, preventInvalidNumberKeys, tablePaginationConfig } from './ui';
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { FilterBar, FilterToggleButton, TicketFilterPill, FilterPillOption } from '@/components/common/FilterBar';

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
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState<ClaimDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [headerForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [createItemsForm] = Form.useForm();
  const [editItemForm] = Form.useForm();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // Local build for the single-step "New claim" flow (saved together on submit).
  const [newItems, setNewItems] = useState<Array<{
    key: string; categoryId: string; categoryName: string; kind: 'amount' | 'mileage';
    expenseDate: string; amount: number | null; distance: number | null;
    merchant: string | null; billNo: string | null; description: string | null; preview: number;
  }>>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ClaimAttachment | null>(null);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Download started');
    } catch {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

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
  const editSelectedCatId = Form.useWatch('categoryId', editItemForm);
  const editSelectedCat = editSelectedCatId ? catById(editSelectedCatId) : undefined;
  const headerCurrency = (Form.useWatch('currency', headerForm) as string) || 'INR';
  const watchedCreateItems = Form.useWatch('items', createItemsForm);
  const previewAmount = (cat: ExpenseCategory | undefined, amount: number | null, distance: number | null) =>
    cat?.kind === 'mileage' ? (distance || 0) * (cat.mileageRate || 0) : (amount || 0);

  const createItemsTotal = useMemo(() => {
    if (!watchedCreateItems || !Array.isArray(watchedCreateItems)) return 0;
    return watchedCreateItems.reduce((sum: number, it: any) => {
      if (!it) return sum;
      const cat = catById(it.categoryId);
      const prev = previewAmount(cat, it.amount, it.distance);
      return sum + (prev || 0);
    }, 0);
  }, [watchedCreateItems, catById]);
  const newItemsTotal = useMemo(() => newItems.reduce((s, i) => s + i.preview, 0), [newItems]);

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
    createItemsForm.resetFields();
    createItemsForm.setFieldsValue({
      items: [{ expenseDate: dayjs() }],
    });
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
      setEditingItemId(null);
      itemForm.resetFields();
      editItemForm.resetFields();
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

    let itemsVal: any;
    try { itemsVal = await createItemsForm.validateFields(); } catch { return; }
    const rawItems: any[] = (itemsVal.items || []).filter(Boolean);
    if (rawItems.length === 0) { message.warning('Add at least one item to submit'); return; }

    const formattedItems = rawItems.map((li: any) => {
      const cat = catById(li.categoryId);
      const isMileage = cat?.kind === 'mileage';
      return {
        categoryId: li.categoryId,
        expenseDate: li.expenseDate ? dayjs(li.expenseDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        amount: isMileage ? null : (li.amount ?? null),
        distance: isMileage ? (li.distance ?? null) : null,
        merchant: li.merchant ?? null,
        billNo: li.billNo ?? null,
        description: li.description ?? null,
      };
    });

    // Validate limits on both Save Draft and Save & Submit
    try {
      await ReimbursementV2Service.validateClaim({
        title: v.title, currency: v.currency, exchangeRate: v.exchangeRate ?? 1, advanceId: v.advanceId ?? null,
        items: formattedItems,
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
        items: formattedItems,
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
      createItemsForm.resetFields();
      setNewFiles([]);
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

  const startEditItem = (it: any) => {
    setEditingItemId(it.id);
    editItemForm.setFieldsValue({
      categoryId: it.categoryId,
      expenseDate: it.expenseDate ? dayjs(it.expenseDate) : dayjs(),
      amount: it.amount ?? undefined,
      distance: it.distance ?? undefined,
      merchant: it.merchant ?? '',
      billNo: it.billNo ?? '',
      description: it.description ?? '',
    });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    editItemForm.resetFields();
  };

  const saveEditItem = async () => {
    if (!current || !editingItemId) return;
    let v: any;
    try {
      v = await editItemForm.validateFields();
    } catch {
      return;
    }
    const cat = catById(v.categoryId);
    const isMileage = cat?.kind === 'mileage';
    setBusy(true);
    try {
      const detail = await ReimbursementV2Service.updateItem(current.id, editingItemId, {
        categoryId: v.categoryId,
        expenseDate: dayjs(v.expenseDate).format('YYYY-MM-DD'),
        amount: isMileage ? null : (v.amount ?? null),
        distance: isMileage ? (v.distance ?? null) : null,
        merchant: v.merchant ?? null,
        billNo: v.billNo ?? null,
        description: v.description ?? null,
      });
      setCurrent(detail);
      setEditingItemId(null);
      editItemForm.resetFields();
      message.success('Line item updated successfully');
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to update item');
    } finally {
      setBusy(false);
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
        <div
          onClick={() => openManage(r.id)}
          className="cursor-pointer group"
          title="Click to view claim details"
        >
          <div style={{ fontWeight: 600, fontFamily: 'monospace' }} className="group-hover:text-blue-600 transition-colors">
            {v}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.title || '—'}</div>
        </div>
      )
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

  const activeFilterCount = statusFilter !== 'all' ? 1 : 0;

  const statusFilterOptions: FilterPillOption[] = [
    { value: 'draft', label: 'Draft', dotColor: '#94a3b8' },
    { value: 'submitted', label: 'Submitted', dotColor: '#3b82f6' },
    { value: 'pending', label: 'Pending', dotColor: '#f59e0b' },
    { value: 'approved', label: 'Approved', dotColor: '#10b981' },
    { value: 'paid', label: 'Paid', dotColor: '#059669' },
    { value: 'rejected', label: 'Rejected', dotColor: '#ef4444' },
    { value: 'cancelled', label: 'Cancelled', dotColor: '#64748b' },
    { value: 'partially_reconciled', label: 'Partially Reconciled', dotColor: '#8b5cf6' },
    { value: 'reconciled', label: 'Reconciled', dotColor: '#06b6d4' },
  ];

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
        <FilterToggleButton
          isOpen={isFilterRowOpen}
          onToggle={() => setIsFilterRowOpen((prev) => !prev)}
          activeCount={activeFilterCount}
        />
        {canCreate && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New Claim</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total claims', value: stats.total, icon: <FileTextOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Drafts', value: stats.draft, icon: <SolutionOutlined />, color: PALETTE.grey, tint: TINT.grey },
        { label: 'Pending', value: stats.pending, icon: <SendOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Paid (base)', value: money(stats.paidAmt), icon: <DollarOutlined />, color: PALETTE.green, tint: TINT.green },
      ]} />

      {isFilterRowOpen && (
        <FilterBar
          activeCount={activeFilterCount}
          onReset={() => setStatusFilter('all')}
          onClose={() => setIsFilterRowOpen(false)}
        >
          <TicketFilterPill
            label="Status"
            icon={<SolutionOutlined />}
            value={statusFilter === 'all' ? undefined : statusFilter}
            options={statusFilterOptions}
            onChange={(v) => setStatusFilter((v as string) || 'all')}
          />
        </FilterBar>
      )}

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={rows}
          pagination={{
            ...tablePaginationConfig,
            current: currentPage,
            pageSize,
            total,
            showTotal: (t) => `${t} claims`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size ?? pageSize);
              load(page, size ?? pageSize);
            },
          }} locale={{ emptyText: <NoData /> }} />
      </div>

      <Drawer
        {...commonDrawerProps}
        title={null}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="rvp-view-drawer"
        rootClassName="rvp-view-drawer-root"
        styles={{
          header: { display: 'none' },
          content: { background: 'var(--bg-pure-white, #ffffff)' },
          body: {
            padding: 0,
            background: 'var(--bg-pure-white, #ffffff)',
          },
          mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
        }}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3.5 flex items-center justify-between gap-3 border-t"
            style={{
              background: 'var(--bg-pure-white, #ffffff)',
              borderColor: 'var(--border-slate-200, #e2e8f0)',
            }}
          >
            {creating ? (
              <>
                <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>
                  Fields marked required must be filled
                </span>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 8, height: 36 }}>
                    Cancel
                  </Button>
                  <Button loading={busy} onClick={() => saveNew(false)} style={{ borderRadius: 8, height: 36 }}>
                    Save as draft
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={busy}
                    disabled={!watchedCreateItems || watchedCreateItems.length === 0}
                    onClick={() => saveNew(true)}
                    style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
                  >
                    Save &amp; submit
                  </Button>
                </div>
              </>
            ) : isDraft ? (
              <>
                <ConfirmDialog
                  tone="danger"
                  icon={<CloseCircleOutlined />}
                  title="Delete this draft?"
                  confirmText="Delete Draft"
                  placement="topLeft"
                  onConfirm={() => {
                    if (current) deleteDraft(current.id);
                  }}
                >
                  <Button danger type="text" icon={<DeleteOutlined />} style={{ borderRadius: 8, height: 36 }}>
                    Delete draft
                  </Button>
                </ConfirmDialog>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 8, height: 36 }}>
                    Close
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={busy}
                    disabled={!current || current.items.length === 0}
                    onClick={submitClaim}
                    style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
                  >
                    Submit Claim
                  </Button>
                </div>
              </>
            ) : (
              <>
                {['pending', 'submitted'].includes(current?.status || '') ? (
                  <ConfirmDialog
                    tone="warning"
                    icon={<CloseCircleOutlined />}
                    title="Cancel this submitted claim?"
                    confirmText="Cancel Claim"
                    placement="topLeft"
                    onConfirm={() => {
                      if (current) cancelClaim(current.id);
                    }}
                  >
                    <Button danger style={{ borderRadius: 8, height: 36 }}>
                      Cancel claim
                    </Button>
                  </ConfirmDialog>
                ) : (
                  <div />
                )}
                <Button
                  type="primary"
                  onClick={() => setDrawerOpen(false)}
                  style={{ borderRadius: 8, height: 36, padding: '0 24px', background: '#2563eb' }}
                >
                  Close
                </Button>
              </>
            )}
          </div>
        }
      >
        <style>{formStyles}</style>

        {/* ── ENHANCED DRAWER HEADER (Matching TransactionHistoryDrawer style) ── */}
        <header className="rvp-drawer-head">
          <div className={`rvp-head-icon rvp-head-icon--${
            creating
              ? 'blue'
              : current?.status === 'rejected'
                ? 'red'
                : current?.status === 'approved' || current?.status === 'paid'
                  ? 'green'
                  : 'blue'
          }`}>
            {creating ? <PlusOutlined style={{ fontSize: 18 }} /> : <Receipt size={19} strokeWidth={2.2} />}
          </div>

          <div className="rvp-head-text">
            <div className="rvp-head-title-row">
              <span className="rvp-head-title">
                {creating ? 'New Expense Claim' : current?.claimNo || 'Claim Details'}
              </span>
              {!creating && current && (
                <div className="flex items-center gap-1.5">
                  <Tooltip title="Copy Claim Number">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(current.claimNo);
                        message.success('Claim number copied to clipboard');
                      }}
                      className="rvp-copy-btn"
                    >
                      <Copy size={12} />
                    </button>
                  </Tooltip>
                  <StatusTag status={current.status} />
                </div>
              )}
            </div>
            <div className="rvp-head-sub">
              {creating
                ? 'Fill in line items and submit your claim for reimbursement'
                : current?.title
                  ? `${current.title} · Created on ${fmtDate(current.createdAt)}`
                  : `Expense Claim · Created on ${fmtDate(current?.createdAt || '')}`}
            </div>
          </div>

          <div className="rvp-head-actions">
            <button
              type="button"
              className="rvp-head-btn"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
              title="Close drawer"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="rvp-drawer-content">
          {creating && (
            <div className="px-1 py-1 space-y-5">
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
                {createItemsTotal > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 -mt-1 mb-2">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                      Estimated Total ({watchedCreateItems?.length || 1} {(watchedCreateItems?.length || 1) === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-[14px] font-extrabold text-blue-600 dark:text-blue-400">
                      {money(createItemsTotal, headerCurrency)}
                    </span>
                  </div>
                )}

                <Form
                  form={createItemsForm}
                  layout="horizontal"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 16 }}
                  labelAlign="left"
                  colon={false}
                  requiredMark="optional"
                  className="customer-drawer-form"
                >
                  <Form.List name="items">
                    {(fields, { add, remove }) => (
                      <div className="space-y-4">
                        {fields.map(({ key, name, ...restField }, index) => {
                          const itemCatId = watchedCreateItems?.[name]?.categoryId;
                          const itemCat = itemCatId ? catById(itemCatId) : undefined;
                          const isMileage = itemCat?.kind === 'mileage';
                          const itemAmt = watchedCreateItems?.[name]?.amount;
                          const itemDist = watchedCreateItems?.[name]?.distance;
                          const previewVal = previewAmount(itemCat, itemAmt, itemDist);

                          return (
                            <div key={key} className="rvp-create-item-card">
                              <div className="rvp-create-item-head">
                                <div className="flex items-center gap-2">
                                  <span className="rvp-create-item-badge">Item #{index + 1}</span>
                                  {itemCat && (
                                    <span className="rvp-create-item-cat-name">
                                      {itemCat.name}
                                    </span>
                                  )}
                                  {previewVal > 0 && (
                                    <span className="rvp-create-item-amt-pill">
                                      {money(previewVal, headerCurrency)}
                                    </span>
                                  )}
                                </div>
                                {fields.length > 1 && (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(name)}
                                    className="rvp-create-item-del-btn"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>

                              <div className="rvp-create-item-body">
                                <Form.Item
                                  {...restField}
                                  name={[name, 'categoryId']}
                                  label="Category"
                                  rules={[{ required: true, message: 'Pick a category' }]}
                                >
                                  <SearchableDropdown
                                    placeholder="Select category"
                                    options={cats.map((c) => ({ value: c.id, label: c.name }))}
                                    itemNoun="categories"
                                    hideAvatar
                                    width="100%"
                                  />
                                </Form.Item>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'expenseDate']}
                                  label="Date"
                                  rules={[{ required: true, message: 'Date required' }]}
                                >
                                  <DatePicker inputReadOnly style={{ width: '100%' }} format="YYYY-MM-DD" />
                                </Form.Item>

                                {isMileage ? (
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'distance']}
                                    label={`Distance (${itemCat?.mileageUnit || 'units'})`}
                                    rules={[{ required: true, message: 'Distance required' }]}
                                  >
                                    <InputNumber min={0} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
                                  </Form.Item>
                                ) : (
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'amount']}
                                    label="Amount"
                                    rules={[{ required: true, message: 'Amount required' }]}
                                  >
                                    <InputNumber min={0} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
                                  </Form.Item>
                                )}

                                <Form.Item
                                  {...restField}
                                  name={[name, 'merchant']}
                                  label="Merchant"
                                  rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}
                                >
                                  <Input placeholder="e.g. Uber, Restaurant, Hotel (Optional)" />
                                </Form.Item>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'billNo']}
                                  label="Bill no."
                                  rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}
                                >
                                  <Input placeholder="Invoice / receipt number (Optional)" />
                                </Form.Item>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'description']}
                                  label="Description"
                                  rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}
                                >
                                  <Input placeholder="Purpose or notes (Optional)" />
                                </Form.Item>
                              </div>
                            </div>
                          );
                        })}

                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => add({ expenseDate: dayjs() })}
                          block
                          style={{
                            height: 42,
                            borderRadius: 10,
                            fontWeight: 600,
                            borderColor: '#3b82f6',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          Add item
                        </Button>
                      </div>
                    )}
                  </Form.List>
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
            </div>
          )}

          {!creating && current && (
            <>
              {/* ── 1. STATUS WORKFLOW PROGRESS TRACKER ── */}
              {(() => {
                const isDraft = current.status === 'draft';
                const isSubmitted = current.status === 'submitted' || current.status === 'pending';
                const isApproved = current.status === 'approved';
                const isPaid = current.status === 'paid';
                const isRejected = current.status === 'rejected';

                const step2Done = !isDraft;
                const step3Done = isApproved || isPaid;
                const step4Done = isPaid;

                return (
                  <div className="rvp-stepper-box">
                    <div className="rvp-stepper-inner">
                      {/* Step 1: Created */}
                      <div className="rvp-stepper-step is-complete">
                        <div className="rvp-step-bubble">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <div className="rvp-step-meta">
                          <span className="rvp-step-label">Created</span>
                          <span className="rvp-step-timestamp">{fmtDate(current.createdAt)}</span>
                        </div>
                      </div>

                      <div className={`rvp-step-connector ${step2Done ? 'is-complete' : ''}`} />

                      {/* Step 2: Submitted */}
                      <div className={`rvp-stepper-step ${step2Done ? 'is-complete' : isDraft ? 'is-current' : 'is-pending'}`}>
                        <div className="rvp-step-bubble">
                          {step2Done ? <Check size={11} strokeWidth={3} /> : <Clock size={11} />}
                        </div>
                        <div className="rvp-step-meta">
                          <span className="rvp-step-label">Submitted</span>
                          <span className="rvp-step-timestamp">
                            {current.submittedAt ? fmtDate(current.submittedAt) : isDraft ? 'Draft' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className={`rvp-step-connector ${isRejected ? 'is-rejected' : step3Done ? 'is-complete' : ''}`} />

                      {/* Step 3: Approval / Decision */}
                      <div className={`rvp-stepper-step ${isRejected ? 'is-rejected' : step3Done ? 'is-complete' : isSubmitted ? 'is-current' : 'is-pending'}`}>
                        <div className="rvp-step-bubble">
                          {isRejected ? <X size={11} strokeWidth={3} /> : step3Done ? <Check size={11} strokeWidth={3} /> : <Clock size={11} />}
                        </div>
                        <div className="rvp-step-meta">
                          <span className="rvp-step-label">{isRejected ? 'Rejected' : 'Approval'}</span>
                          <span className="rvp-step-timestamp">
                            {current.decidedAt
                              ? fmtDate(current.decidedAt)
                              : isRejected
                                ? 'Declined'
                                : step3Done
                                  ? 'Approved'
                                  : 'In Review'}
                          </span>
                        </div>
                      </div>

                      <div className={`rvp-step-connector ${step4Done ? 'is-complete' : ''}`} />

                      {/* Step 4: Settlement / Payout */}
                      <div className={`rvp-stepper-step ${step4Done ? 'is-complete' : isApproved ? 'is-current' : 'is-pending'}`}>
                        <div className="rvp-step-bubble">
                          {step4Done ? <Check size={11} strokeWidth={3} /> : <Wallet size={11} />}
                        </div>
                        <div className="rvp-step-meta">
                          <span className="rvp-step-label">Disbursed</span>
                          <span className="rvp-step-timestamp">
                            {current.paidAt ? fmtDate(current.paidAt) : isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── 2. EXECUTIVE HERO METRICS CARD ── */}
              <div className="rvp-hero-card">
                <div className="rvp-hero-top">
                  <div>
                    <div className="rvp-hero-label-tag">
                      Total Reimbursement Amount
                      {current.currency !== 'INR' && (
                        <span className="rvp-hero-curr-tag">Foreign Currency</span>
                      )}
                    </div>
                    <div className="rvp-hero-amount-val">
                      {money(current.totalAmount, current.currency)}
                    </div>
                    {current.currency !== 'INR' && current.exchangeRate && (
                      <div className="rvp-hero-conversion">
                        Exchange: 1 {current.currency} = ₹{current.exchangeRate} · Base Total: <strong>{money(current.baseAmount, current.baseCurrency || 'INR')}</strong>
                      </div>
                    )}
                  </div>
                  <div className="rvp-hero-status-box">
                    <StatusTag status={current.status} />
                  </div>
                </div>

                <div className="rvp-hero-metrics-bar">
                  <div className="rvp-hero-metric">
                    <span className="rvp-hero-metric-label">Items Count</span>
                    <span className="rvp-hero-metric-val">{current.items.length} {current.items.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  <div className="rvp-hero-metric">
                    <span className="rvp-hero-metric-label">Total Tax</span>
                    <span className="rvp-hero-metric-val">
                      {money(
                        current.items.reduce((s, it) => s + (it.taxAmount || 0), 0),
                        current.currency
                      )}
                    </span>
                  </div>
                  <div className="rvp-hero-metric">
                    <span className="rvp-hero-metric-label">Settlement Mode</span>
                    <span className="rvp-hero-metric-val truncate" title={current.advanceId || 'Direct'}>
                      {current.advanceId ? 'Against Advance' : 'Direct Reimbursement'}
                    </span>
                  </div>
                  <div className="rvp-hero-metric">
                    <span className="rvp-hero-metric-label">Payment Status</span>
                    <span className="rvp-hero-metric-val font-semibold" style={{
                      color: current.status === 'paid' ? '#059669' : current.status === 'rejected' ? '#dc2626' : '#2563eb'
                    }}>
                      {current.paidAt ? `Paid (${fmtDate(current.paidAt)})` : current.status === 'paid' ? 'Paid' : 'Pending Settlement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 3. DECISION & APPROVER ALERTS (Strict Red, Green, Blue) ── */}
              {current.status === 'rejected' && (
                <div className="rvp-alert-card rvp-alert--rejected">
                  <div className="rvp-alert-icon-box">
                    <AlertCircle size={18} />
                  </div>
                  <div className="rvp-alert-body">
                    <div className="rvp-alert-title">Claim Rejected by Approver</div>
                    <div className="rvp-alert-text">
                      {current.decisionNote || 'No rejection reason was provided.'}
                    </div>
                    {current.decidedAt && (
                      <div className="rvp-alert-meta">
                        <Clock size={11} /> Decided on {fmtDate(current.decidedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {current.status === 'approved' && current.decisionNote && (
                <div className="rvp-alert-card rvp-alert--approved">
                  <div className="rvp-alert-icon-box">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="rvp-alert-body">
                    <div className="rvp-alert-title">Approver Remark</div>
                    <div className="rvp-alert-text">{current.decisionNote}</div>
                    {current.decidedAt && (
                      <div className="rvp-alert-meta">
                        <Clock size={11} /> Approved on {fmtDate(current.decidedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {current.paymentReference && (
                <div className="rvp-alert-card rvp-alert--paid">
                  <div className="rvp-alert-icon-box">
                    <CreditCard size={18} />
                  </div>
                  <div className="rvp-alert-body">
                    <div className="rvp-alert-title">Payment Settlement Reference</div>
                    <div className="rvp-alert-text font-mono font-bold tracking-wide">
                      {current.paymentReference}
                    </div>
                    {current.paidAt && (
                      <div className="rvp-alert-meta">
                        <Clock size={11} /> Disbursed on {fmtDate(current.paidAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 4. ITEMIZED EXPENSE LINE ITEMS ── */}
              <div className="rvp-card-section">
                <div className="rvp-section-header">
                  <div className="flex items-center gap-2.5">
                    <div className="rvp-section-icon">
                      <Receipt size={16} />
                    </div>
                    <div>
                      <h4 className="rvp-section-title">Expense Line Items</h4>
                      <p className="rvp-section-sub">{current.items.length} {current.items.length === 1 ? 'expense item' : 'expense items'} included</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rvp-section-right-label">Subtotal</span>
                    <span className="rvp-section-right-val">{money(current.totalAmount, current.currency)}</span>
                  </div>
                </div>

                <div className="rvp-itemized-list">
                  {current.items.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[13px]">
                      No line items attached to this claim
                    </div>
                  )}
                  {current.items.map((it, idx) => (
                    editingItemId === it.id ? (
                      <div key={it.id} className="rvp-item-edit-box">
                        <div className="rvp-item-edit-head">
                          <div className="flex items-center gap-2">
                            <span className="rvp-create-item-badge">Edit Item #{idx + 1}</span>
                            <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                              {it.categoryName || 'Line Item'}
                            </span>
                          </div>
                          <Button size="small" type="text" onClick={cancelEditItem} style={{ fontSize: 12 }}>
                            Cancel
                          </Button>
                        </div>

                        <div className="p-4">
                          <Form
                            form={editItemForm}
                            layout="horizontal"
                            labelCol={{ span: 8 }}
                            wrapperCol={{ span: 16 }}
                            labelAlign="left"
                            colon={false}
                            requiredMark="optional"
                            className="customer-drawer-form"
                          >
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

                            {editSelectedCat?.kind === 'mileage' ? (
                              <Form.Item
                                name="distance"
                                label={`Distance (${editSelectedCat.mileageUnit || 'units'})`}
                                rules={[{ required: true, message: 'Distance required' }]}
                              >
                                <InputNumber min={0} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
                              </Form.Item>
                            ) : (
                              <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Amount required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
                              </Form.Item>
                            )}

                            <Form.Item name="merchant" label="Merchant" rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}>
                              <Input placeholder="e.g. Uber, Restaurant, Hotel (Optional)" />
                            </Form.Item>

                            <Form.Item name="billNo" label="Bill no." rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}>
                              <Input placeholder="Invoice / receipt number (Optional)" />
                            </Form.Item>

                            <Form.Item name="description" label="Description" rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}>
                              <Input placeholder="Purpose or notes (Optional)" />
                            </Form.Item>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <Button size="small" onClick={cancelEditItem} style={{ borderRadius: 6 }}>
                                Cancel
                              </Button>
                              <Button
                                size="small"
                                type="primary"
                                loading={busy}
                                onClick={saveEditItem}
                                style={{ borderRadius: 6, background: '#2563eb', fontWeight: 600 }}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </Form>
                        </div>
                      </div>
                    ) : (
                      <div key={it.id} className="rvp-line-entry">
                        <div className="rvp-entry-num">{idx + 1}</div>

                        <div className="rvp-entry-body">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rvp-cat-tag">
                              {it.categoryName || it.categoryCode || 'Expense'}
                            </span>
                            <span className="rvp-date-chip">
                              <Calendar size={11} /> {fmtDate(it.expenseDate)}
                            </span>
                            {it.merchant && (
                              <span className="rvp-chip-item" title="Merchant / Vendor">
                                <Store size={11} /> {it.merchant}
                              </span>
                            )}
                            {it.billNo && (
                              <span className="rvp-chip-item" title="Invoice / Bill No">
                                Inv: {it.billNo}
                              </span>
                            )}
                            {it.distance != null && it.distance > 0 && (
                              <span className="rvp-chip-item" title="Mileage">
                                🚗 {it.distance} units
                              </span>
                            )}
                          </div>

                          {it.description && (
                            <div className="rvp-entry-desc">{it.description}</div>
                          )}
                        </div>

                        <div className="rvp-entry-price-col">
                          <div className="rvp-entry-amount">
                            {money(it.amount, current.currency)}
                          </div>
                          {it.taxAmount != null && it.taxAmount > 0 && (
                            <div className="rvp-entry-tax">
                              Tax: {money(it.taxAmount, current.currency)}
                            </div>
                          )}
                          {isDraft && (
                            <div className="flex items-center gap-1 mt-1">
                              <Button
                                type="text"
                                size="small"
                                icon={<Edit2 size={13} />}
                                onClick={() => startEditItem(it)}
                                className="rvp-edit-item-btn"
                                title="Edit item"
                              />
                              <ConfirmDialog
                                tone="danger"
                                title="Remove this line item?"
                                confirmText="Remove"
                                placement="topRight"
                                onConfirm={() => removeItem(it.id)}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<Trash2 size={13} />}
                                  className="rvp-del-item-btn"
                                  title="Delete item"
                                />
                              </ConfirmDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {isDraft && (
                  <div className="rvp-add-item-card-inner">
                    <div className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <PlusOutlined style={{ fontSize: 13, color: '#2563eb' }} /> Add Line Item
                    </div>
                    <Form
                      form={itemForm}
                      layout="horizontal"
                      labelCol={{ span: 8 }}
                      wrapperCol={{ span: 16 }}
                      labelAlign="left"
                      colon={false}
                      requiredMark="optional"
                      className="customer-drawer-form"
                    >
                      {renderItemFields()}
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        loading={busy}
                        onClick={addItem}
                        block
                        style={{ borderRadius: 8, height: 36, background: '#2563eb' }}
                      >
                        Add line item
                      </Button>
                    </Form>
                  </div>
                )}
              </div>

              {/* ── 5. RECEIPTS & ATTACHMENTS ── */}
              <div className="rvp-card-section">
                <div className="rvp-section-header">
                  <div className="flex items-center gap-2.5">
                    <div className="rvp-section-icon">
                      <Paperclip size={16} />
                    </div>
                    <div>
                      <h4 className="rvp-section-title">Receipts &amp; Attachments</h4>
                      <p className="rvp-section-sub">
                        {current.attachments.length} {current.attachments.length === 1 ? 'file uploaded' : 'files uploaded'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {current.attachments.length === 0 && !isDraft ? (
                    <div className="rvp-empty-receipts-state">
                      <div className="rvp-empty-icon-circle">
                        <Paperclip size={20} />
                      </div>
                      <div className="text-[13px] font-semibold text-slate-700">No receipts attached</div>
                      <div className="text-[11.5px] text-slate-400">Bills or invoice attachments will appear here.</div>
                    </div>
                  ) : (
                    <div className="rvp-receipts-grid">
                      {current.attachments.map((a) => {
                        const ext = a.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                        const isImg = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(ext);
                        const isPdf = ext === 'PDF';
                        const tone = isImg ? 'green' : isPdf ? 'red' : 'blue';

                        return (
                          <div key={a.id} className="rvp-receipt-card">
                            <div className={`rvp-file-type-badge rvp-file--${tone}`}>
                              {isImg ? 'IMG' : isPdf ? 'PDF' : ext.slice(0, 3)}
                            </div>

                            <div className="rvp-receipt-body">
                              <span
                                className="rvp-receipt-filename"
                                title={a.fileName}
                                onClick={() => setPreviewFile(a)}
                                style={{ cursor: 'pointer' }}
                              >
                                {a.fileName}
                              </span>
                              <div className="rvp-receipt-subrow">
                                {a.fileSize ? `${Math.round(a.fileSize / 1024)} KB` : `${ext} File`}
                              </div>
                            </div>

                            <div className="rvp-receipt-actions">
                              <button
                                type="button"
                                onClick={() => setPreviewFile(a)}
                                className="rvp-receipt-act-btn rvp-btn-view"
                                title="View in left drawer"
                              >
                                <Eye size={12} /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(a.fileUrl, a.fileName)}
                                className="rvp-receipt-act-btn rvp-btn-dl"
                                title="Download file"
                              >
                                <Download size={12} /> Download
                              </button>

                              {isDraft && (
                                <ConfirmDialog
                                  tone="danger"
                                  title="Delete this receipt?"
                                  confirmText="Delete"
                                  placement="topRight"
                                  onConfirm={() => removeReceipt(a.id)}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<Trash2 size={13} />}
                                    className="rvp-receipt-del-btn"
                                    title="Delete receipt"
                                  />
                                </ConfirmDialog>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isDraft && (
                    <div className="mt-3">
                      <Upload.Dragger
                        multiple
                        showUploadList={false}
                        disabled={busy}
                        beforeUpload={(file) => {
                          uploadReceipt(file as File);
                          return false;
                        }}
                        className="rvp-upload-dragger"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined style={{ color: '#2563eb' }} />
                        </p>
                        <p className="ant-upload-text">Click or drag bills / invoices to attach</p>
                        <p className="ant-upload-hint">Supports PNG, JPG, PDF up to 10MB</p>
                      </Upload.Dragger>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Drawer>

      {/* ── LEFT-SIDE ATTACHMENT PREVIEW DRAWER ── */}
      <Drawer
        placement="left"
        width={680}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        closable={false}
        destroyOnClose
        className="rvp-preview-left-drawer"
        rootClassName="rvp-preview-left-drawer-root"
        styles={{
          header: { display: 'none' },
          content: { background: 'var(--bg-pure-white, #ffffff)' },
          body: { padding: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white, #ffffff)' },
          mask: { background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)' },
        }}
      >
        {previewFile && (
          <div className="rvp-preview-container">
            {/* Left Drawer Header */}
            <div className="rvp-preview-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rvp-preview-icon-badge">
                  <Eye size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="rvp-preview-file-title" title={previewFile.fileName}>
                    {previewFile.fileName}
                  </div>
                  <div className="rvp-preview-file-meta">
                    {previewFile.fileName.split('.').pop()?.toUpperCase()} Document
                    {previewFile.fileSize ? ` · ${Math.round(previewFile.fileSize / 1024)} KB` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="small"
                  icon={<Download size={13} />}
                  onClick={() => handleDownload(previewFile.fileUrl, previewFile.fileName)}
                  style={{ borderRadius: 6, fontWeight: 500 }}
                >
                  Download
                </Button>
                <Button
                  size="small"
                  icon={<ExternalLink size={13} />}
                  href={previewFile.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ borderRadius: 6 }}
                  title="Open in new window"
                />
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="rvp-head-btn"
                  aria-label="Close preview"
                  title="Close preview"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Left Drawer Viewport */}
            <div className="rvp-preview-viewport">
              {(() => {
                const ext = previewFile.fileName.split('.').pop()?.toUpperCase() || '';
                const isImg = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext);
                const isPdf = ext === 'PDF';

                if (isImg) {
                  return (
                    <div className="rvp-preview-img-wrap">
                      <img
                        src={previewFile.fileUrl}
                        alt={previewFile.fileName}
                        className="rvp-preview-img-element"
                      />
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <div className="rvp-preview-pdf-wrap">
                      <iframe
                        src={`${previewFile.fileUrl}#toolbar=1`}
                        title={previewFile.fileName}
                        className="rvp-preview-iframe"
                      />
                    </div>
                  );
                }

                return (
                  <div className="rvp-preview-fallback">
                    <div className="rvp-fallback-icon">
                      <FileText size={48} strokeWidth={1.5} />
                    </div>
                    <div className="rvp-fallback-title">{previewFile.fileName}</div>
                    <div className="rvp-fallback-desc">
                      Inline preview is not supported for this file type. Click below to download or open in a new tab.
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        type="primary"
                        icon={<Download size={14} />}
                        onClick={() => handleDownload(previewFile.fileUrl, previewFile.fileName)}
                        style={{ borderRadius: 8, height: 38, background: '#2563eb' }}
                      >
                        Download File
                      </Button>
                      <Button
                        href={previewFile.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        icon={<ExternalLink size={14} />}
                        style={{ borderRadius: 8, height: 38 }}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
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

        /* ── VIEW CLAIM DRAWER ENHANCEMENTS (Pure White in White Theme) ── */
        .rvp-view-drawer-root .ant-drawer-content,
        .rvp-view-drawer-root .ant-drawer-wrapper-body,
        .rvp-view-drawer-root .ant-drawer-body,
        .rvp-view-drawer .ant-drawer-content,
        .rvp-view-drawer .ant-drawer-wrapper-body,
        .rvp-view-drawer .ant-drawer-body,
        .rvp-preview-left-drawer-root .ant-drawer-content,
        .rvp-preview-left-drawer-root .ant-drawer-wrapper-body,
        .rvp-preview-left-drawer-root .ant-drawer-body,
        .rvp-preview-left-drawer .ant-drawer-content,
        .rvp-preview-left-drawer .ant-drawer-wrapper-body,
        .rvp-preview-left-drawer .ant-drawer-body {
          padding: 0 !important;
          background: var(--bg-pure-white, #ffffff) !important;
        }

        .rvp-drawer-content {
          padding: 20px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: var(--bg-pure-white, #ffffff);
        }

        /* ── Drawer Header (TransactionHistoryDrawer Style) ── */
        .rvp-drawer-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 24px;
          background: var(--bg-pure-white, #ffffff);
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(8px);
        }

        .rvp-head-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rvp-head-icon--blue {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.22);
          box-shadow: 0 2px 8px -2px rgba(37, 99, 235, 0.2);
        }

        .rvp-head-icon--green {
          background: rgba(5, 150, 105, 0.1);
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.22);
          box-shadow: 0 2px 8px -2px rgba(5, 150, 105, 0.2);
        }

        .rvp-head-icon--red {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.22);
          box-shadow: 0 2px 8px -2px rgba(239, 68, 68, 0.2);
        }

        .rvp-head-text {
          flex: 1;
          min-width: 0;
        }

        .rvp-head-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rvp-head-title {
          font-size: 16px;
          font-weight: 750;
          letter-spacing: -0.02em;
          color: var(--text-slate-900, #0f172a);
          line-height: 1.25;
        }

        .rvp-copy-btn {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-200, #e2e8f0);
          background: transparent;
          color: var(--text-slate-400, #94a3b8);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .rvp-copy-btn:hover {
          color: #2563eb;
          border-color: #93c5fd;
          background: rgba(37, 99, 235, 0.05);
        }

        .rvp-head-sub {
          font-size: 12px;
          color: var(--text-slate-500, #64748b);
          margin-top: 2px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rvp-head-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .rvp-head-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #ffffff);
          color: var(--text-slate-500, #64748b);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .rvp-head-btn:hover {
          color: var(--text-slate-900, #0f172a);
          background: var(--bg-slate-50, #f8fafc);
          border-color: var(--border-slate-300, #cbd5e1);
        }

        /* ── Drawer Scroll Content ── */
        .rvp-drawer-content {
          padding: 20px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── 1. Workflow Progress Stepper ── */
        .rvp-stepper-box {
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          padding: 14px 20px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
        }

        .rvp-stepper-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .rvp-stepper-step {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
        }

        .rvp-step-bubble {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .rvp-stepper-step.is-complete .rvp-step-bubble {
          background: #059669;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
        }

        .rvp-stepper-step.is-current .rvp-step-bubble {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .rvp-stepper-step.is-rejected .rvp-step-bubble {
          background: #dc2626;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
        }

        .rvp-stepper-step.is-pending .rvp-step-bubble {
          background: var(--border-slate-200, #e2e8f0);
          color: var(--text-slate-400, #94a3b8);
        }

        .rvp-step-connector {
          flex: 1;
          height: 2px;
          background: var(--border-slate-200, #e2e8f0);
          margin: 0 10px;
          transition: background 0.2s ease;
        }

        .rvp-step-connector.is-complete {
          background: #059669;
        }

        .rvp-step-connector.is-rejected {
          background: #dc2626;
        }

        .rvp-step-meta {
          display: flex;
          flex-direction: column;
        }

        .rvp-step-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-slate-800, #1e293b);
          line-height: 1.2;
        }

        .rvp-step-timestamp {
          font-size: 10.5px;
          color: var(--text-slate-400, #94a3b8);
          margin-top: 1px;
          font-weight: 500;
        }

        /* ── 2. Executive Hero Metrics Card ── */
        .rvp-hero-card {
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          position: relative;
        }

        .rvp-hero-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb 0%, #059669 100%);
        }

        .rvp-hero-top {
          padding: 20px 22px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .rvp-hero-label-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-slate-400, #94a3b8);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rvp-hero-curr-tag {
          font-size: 10px;
          font-weight: 700;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          padding: 1.5px 6px;
          border-radius: 4px;
          text-transform: none;
          letter-spacing: 0;
        }

        .rvp-hero-amount-val {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-slate-900, #0f172a);
          margin-top: 4px;
          line-height: 1.15;
        }

        .rvp-hero-conversion {
          font-size: 11.5px;
          color: #2563eb;
          margin-top: 4px;
          font-weight: 500;
        }

        .rvp-hero-metrics-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 12px 20px;
          background: var(--bg-slate-50, #f8fafc);
          border-top: 1px solid var(--border-slate-200, #e2e8f0);
          gap: 12px;
        }

        .rvp-hero-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .rvp-hero-metric-label {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-slate-400, #94a3b8);
        }

        .rvp-hero-metric-val {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-800, #1e293b);
        }

        /* ── 3. Decision / Approver Alerts ── */
        .rvp-alert-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid;
        }

        .rvp-alert--rejected {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.22);
          color: #b91c1c;
        }

        .rvp-alert--approved {
          background: rgba(5, 150, 105, 0.05);
          border-color: rgba(5, 150, 105, 0.22);
          color: #047857;
        }

        .rvp-alert--paid {
          background: rgba(37, 99, 235, 0.05);
          border-color: rgba(37, 99, 235, 0.22);
          color: #1d4ed8;
        }

        .rvp-alert-icon-box {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .rvp-alert-body {
          flex: 1;
          min-width: 0;
        }

        .rvp-alert-title {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.3;
        }

        .rvp-alert-text {
          font-size: 13px;
          line-height: 1.5;
          margin-top: 2px;
        }

        .rvp-alert-meta {
          font-size: 11px;
          opacity: 0.8;
          margin-top: 4px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── 4. Card Section Containers ── */
        .rvp-card-section {
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.02);
        }

        .rvp-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
        }

        .rvp-section-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rvp-section-title {
          font-size: 13.5px;
          font-weight: 750;
          color: var(--text-slate-900, #0f172a);
          line-height: 1.2;
          margin: 0;
        }

        .rvp-section-sub {
          font-size: 11px;
          color: var(--text-slate-500, #64748b);
          margin-top: 2px;
          margin-bottom: 0;
        }

        .rvp-section-right-label {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-slate-400, #94a3b8);
          display: block;
        }

        .rvp-section-right-val {
          font-size: 14.5px;
          font-weight: 750;
          color: var(--text-slate-900, #0f172a);
        }

        /* ── 5. Line Entries List ── */
        .rvp-itemized-list {
          display: flex;
          flex-direction: column;
        }

        .rvp-line-entry {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          transition: background 0.15s ease;
        }

        .rvp-line-entry:last-child {
          border-bottom: none;
        }

        .rvp-line-entry:hover {
          background: rgba(37, 99, 235, 0.015);
        }

        .rvp-entry-num {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-500, #64748b);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .rvp-entry-body {
          flex: 1;
          min-width: 0;
        }

        .rvp-cat-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 5px;
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.18);
        }

        .rvp-date-chip {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-500, #64748b);
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
        }

        .rvp-chip-item {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-600, #475569);
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          padding: 1.5px 6.5px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
        }

        .rvp-entry-desc {
          font-size: 12px;
          color: var(--text-slate-600, #475569);
          margin-top: 5px;
          line-height: 1.45;
        }

        .rvp-entry-price-col {
          text-align: right;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .rvp-entry-amount {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
        }

        .rvp-entry-tax {
          font-size: 10.5px;
          color: var(--text-slate-500, #64748b);
          font-weight: 500;
          margin-top: 1px;
        }

        .rvp-del-item-btn {
          opacity: 0.6;
          transition: opacity 0.15s;
          margin-top: 2px;
        }

        .rvp-del-item-btn:hover {
          opacity: 1;
        }

        .rvp-add-item-card-inner {
          margin: 14px 18px 18px;
          padding: 14px 16px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px dashed var(--border-slate-200, #e2e8f0);
          border-radius: 10px;
        }

        /* ── 6. Receipts & Attachments ── */
        .rvp-empty-receipts-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          border: 1.5px dashed var(--border-slate-200, #e2e8f0);
          border-radius: 10px;
          text-align: center;
          gap: 6px;
        }

        .rvp-empty-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          color: var(--text-slate-400, #94a3b8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rvp-receipts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
        }

        .rvp-receipt-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 10px;
          transition: all 0.15s ease;
        }

        .rvp-receipt-card:hover {
          border-color: #3b82f6;
          background: rgba(37, 99, 235, 0.02);
        }

        .rvp-file-type-badge {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rvp-file--green {
          background: rgba(5, 150, 105, 0.1);
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.22);
        }

        .rvp-file--red {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.22);
        }

        .rvp-file--blue {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.22);
        }

        .rvp-receipt-body {
          flex: 1;
          min-width: 0;
        }

        .rvp-receipt-filename {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-800, #1e293b);
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
          transition: color 0.15s ease;
        }

        .rvp-receipt-filename:hover {
          color: #2563eb;
        }

        .rvp-receipt-subrow {
          font-size: 10.5px;
          color: var(--text-slate-400, #94a3b8);
          margin-top: 1px;
          font-weight: 500;
        }

        .rvp-receipt-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .rvp-receipt-act-btn {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .rvp-btn-view {
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        .rvp-btn-view:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .rvp-btn-dl {
          background: var(--bg-pure-white, #ffffff);
          color: var(--text-slate-600, #475569);
          border: 1px solid var(--border-slate-200, #e2e8f0);
        }

        .rvp-btn-dl:hover {
          background: var(--bg-slate-50, #f8fafc);
          color: var(--text-slate-900, #0f172a);
          border-color: var(--border-slate-300, #cbd5e1);
        }

        .rvp-receipt-del-btn {
          opacity: 0.6;
          transition: opacity 0.15s;
        }

        .rvp-receipt-del-btn:hover {
          opacity: 1;
        }

        /* ── MULTI-ITEM CARDS IN CREATE CLAIM ── */
        .rvp-create-item-card {
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
          transition: all 0.15s ease;
        }

        .rvp-create-item-card:focus-within {
          border-color: #93c5fd;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
        }

        .rvp-create-item-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--bg-slate-50, #f8fafc);
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
        }

        .rvp-create-item-badge {
          font-size: 11px;
          font-weight: 700;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.2);
          padding: 2px 7px;
          border-radius: 5px;
          letter-spacing: 0.02em;
        }

        .rvp-create-item-cat-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-800, #1e293b);
        }

        .rvp-create-item-amt-pill {
          font-size: 11.5px;
          font-weight: 700;
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
          border: 1px solid rgba(5, 150, 105, 0.22);
          padding: 1.5px 8px;
          border-radius: 999px;
        }

        .rvp-create-item-del-btn {
          font-size: 12px;
          height: 26px;
          padding: 0 8px;
        }

        .rvp-create-item-body {
          padding: 16px 16px 6px;
        }

        /* ── INLINE LINE ITEM EDITING ── */
        .rvp-item-edit-box {
          background: var(--bg-pure-white, #ffffff);
          border: 1.5px solid #93c5fd;
          border-radius: 12px;
          margin: 6px 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
        }

        .rvp-item-edit-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(37, 99, 235, 0.05);
          border-bottom: 1px solid rgba(37, 99, 235, 0.15);
        }

        .rvp-edit-item-btn {
          color: #2563eb;
          opacity: 0.8;
          transition: all 0.15s ease;
        }

        .rvp-edit-item-btn:hover {
          color: #1d4ed8;
          opacity: 1;
          background: rgba(37, 99, 235, 0.1);
        }

        /* ── LEFT-SIDE PREVIEW DRAWER ── */
        .rvp-preview-left-drawer .ant-drawer-body {
          padding: 0 !important;
          overflow: hidden !important;
        }

        .rvp-preview-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-pure-white, #ffffff);
        }

        .rvp-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #ffffff);
          flex-shrink: 0;
        }

        .rvp-preview-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rvp-preview-file-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 280px;
        }

        .rvp-preview-file-meta {
          font-size: 11px;
          color: var(--text-slate-500, #64748b);
          margin-top: 1px;
        }

        .rvp-preview-viewport {
          flex: 1;
          overflow: auto;
          background: var(--bg-slate-50, #f8fafc);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .rvp-preview-img-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
        }

        .rvp-preview-img-element {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
        }

        .rvp-preview-pdf-wrap {
          width: 100%;
          height: 100%;
          border-radius: 10px;
          overflow: hidden;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
        }

        .rvp-preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: #ffffff;
        }

        .rvp-preview-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 36px 24px;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          max-width: 420px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }

        .rvp-fallback-icon {
          color: #2563eb;
          margin-bottom: 12px;
        }

        .rvp-fallback-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin-bottom: 4px;
          word-break: break-all;
        }

        .rvp-fallback-desc {
          font-size: 12px;
          color: var(--text-slate-500, #64748b);
          line-height: 1.5;
        }

        /* ── DARK MODE OVERRIDES ── */
        [data-theme='dark'] .rvp-view-drawer-root .ant-drawer-content,
        [data-theme='dark'] .rvp-view-drawer-root .ant-drawer-body,
        [data-theme='dark'] .rvp-view-drawer .ant-drawer-content,
        [data-theme='dark'] .rvp-view-drawer .ant-drawer-body,
        [data-theme='dark'] .rvp-preview-left-drawer-root .ant-drawer-content,
        [data-theme='dark'] .rvp-preview-left-drawer-root .ant-drawer-body,
        [data-theme='dark'] .rvp-preview-left-drawer .ant-drawer-content,
        [data-theme='dark'] .rvp-preview-left-drawer .ant-drawer-body,
        [data-theme='dark'] .rvp-preview-container {
          background: #0f172a !important;
        }

        [data-theme='dark'] .rvp-drawer-content {
          background: #0f172a;
        }

        [data-theme='dark'] .rvp-drawer-head,
        [data-theme='dark'] .rvp-preview-header {
          background: #0f172a;
          border-color: #1e293b;
        }

        [data-theme='dark'] .rvp-head-title,
        [data-theme='dark'] .rvp-preview-file-title,
        [data-theme='dark'] .rvp-fallback-title {
          color: #f8fafc;
        }

        [data-theme='dark'] .rvp-head-btn,
        [data-theme='dark'] .rvp-copy-btn,
        [data-theme='dark'] .rvp-btn-dl {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }

        [data-theme='dark'] .rvp-stepper-box,
        [data-theme='dark'] .rvp-hero-card,
        [data-theme='dark'] .rvp-card-section,
        [data-theme='dark'] .rvp-preview-container,
        [data-theme='dark'] .rvp-preview-fallback {
          background: #1e293b;
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-step-label {
          color: #f8fafc;
        }

        [data-theme='dark'] .rvp-hero-amount-val,
        [data-theme='dark'] .rvp-section-title,
        [data-theme='dark'] .rvp-section-right-val,
        [data-theme='dark'] .rvp-entry-amount {
          color: #f8fafc;
        }

        [data-theme='dark'] .rvp-hero-metrics-bar {
          background: #0f172a;
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-hero-metric-val {
          color: #f1f5f9;
        }

        [data-theme='dark'] .rvp-section-header,
        [data-theme='dark'] .rvp-line-entry {
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-entry-num,
        [data-theme='dark'] .rvp-chip-item,
        [data-theme='dark'] .rvp-receipt-card {
          background: #0f172a;
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-receipt-card:hover {
          border-color: #475569;
        }

        [data-theme='dark'] .rvp-receipt-filename {
          color: #f1f5f9;
        }

        [data-theme='dark'] .rvp-entry-desc,
        [data-theme='dark'] .rvp-fallback-desc {
          color: #94a3b8;
        }

        [data-theme='dark'] .rvp-add-item-card-inner {
          background: #0f172a;
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-empty-receipts-state {
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-create-item-card {
          background: #1e293b;
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-create-item-head {
          background: #0f172a;
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-create-item-cat-name {
          color: #f1f5f9;
        }

        [data-theme='dark'] .rvp-item-edit-box {
          background: #1e293b;
          border-color: #3b82f6;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        }

        [data-theme='dark'] .rvp-item-edit-head {
          background: rgba(15, 23, 42, 0.9);
          border-color: #334155;
        }

        [data-theme='dark'] .rvp-edit-item-btn {
          color: #60a5fa;
        }

        [data-theme='dark'] .rvp-preview-viewport {
          background: #090d16;
        }

        [data-theme='dark'] .rvp-preview-img-wrap {
          background: #0f172a;
          border-color: #334155;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        }

        [data-theme='dark'] .rvp-preview-img-element {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        }

        [data-theme='dark'] .rvp-preview-pdf-wrap {
          background: #0f172a;
          border-color: #334155;
        }
      `}</style>
    </div>
  );
}
