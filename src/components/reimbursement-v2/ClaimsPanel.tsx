'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Table, Tag, Drawer, Form, Input, InputNumber, Select, DatePicker, Tooltip,
  message, Upload, Descriptions, Divider, Empty, Checkbox,
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
import { PALETTE, TINT, PanelHeader, StatCards, SectionCard, RmbStyles, money, fmtDate, StatusTag, CurrencySelect } from './ui';

export default function ClaimsPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursement || perms.canManageReimbursements;
  const canCreate = perms.canCreateReimbursement || perms.canManageReimbursements;

  const [rows, setRows] = useState<Claim[]>([]);
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
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

  const catById = useCallback((id: string) => cats.find((c) => c.id === id), [cats]);
  const selectedCatId = Form.useWatch('categoryId', itemForm);
  const selectedCat = selectedCatId ? catById(selectedCatId) : undefined;
  const headerCurrency = (Form.useWatch('currency', headerForm) as string) || 'INR';
  const newItemsTotal = useMemo(() => newItems.reduce((s, i) => s + i.preview, 0), [newItems]);
  const previewAmount = (cat: ExpenseCategory | undefined, amount: number | null, distance: number | null) =>
    cat?.kind === 'mileage' ? (distance || 0) * (cat.mileageRate || 0) : (amount || 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cat] = await Promise.all([
        ReimbursementV2Service.listMyClaims(),
        ReimbursementV2Service.listCategories(false),
      ]);
      setRows(c); setCats(cat);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load claims');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: rows.length,
    draft: rows.filter((r) => r.status === 'draft').length,
    pending: rows.filter((r) => r.status === 'pending').length,
    paidAmt: rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.baseAmount, 0),
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => !q || r.claimNo.toLowerCase().includes(q) || (r.title || '').toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = async () => {
    setCurrent(null);
    setCreating(true);
    headerForm.resetFields();
    itemForm.resetFields();
    setNewItems([]);
    setNewFiles([]);
    setMultiCurrency(false);
    headerForm.setFieldsValue({ currency: 'INR', exchangeRate: 1 });
    // Refresh reference data so newly-added categories/advances show up.
    try { setCats(await ReimbursementV2Service.listCategories(false)); } catch { /* non-fatal */ }
    try {
      setAdvances((await ReimbursementV2Service.listMyAdvances()).filter((a) => a.status === 'paid' || a.status === 'partially_reconciled'));
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
      if (newFiles.length) await ReimbursementV2Service.uploadReceipts(detail.id, newFiles); // claim-level
      if (submitAfter) {
        const done = await ReimbursementV2Service.submitClaim(detail.id);
        message.success(done.status === 'approved' ? `Auto-approved (${done.claimNo})` : `Submitted ${done.claimNo}`);
      } else {
        message.success(`Draft ${detail.claimNo} saved`);
      }
      setDrawerOpen(false);
      setNewItems([]); setNewFiles([]);
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to save claim');
    } finally { setBusy(false); }
  };

  // Shared line-item field grid (used in the create build + the draft manager).
  const renderItemFields = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Pick a category' }]}>
        <Select showSearch optionFilterProp="label" placeholder="Category"
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          notFoundContent={cats.length === 0 ? 'No categories yet — ask an admin to add expense categories' : 'No match'} />
      </Form.Item>
      <Form.Item name="expenseDate" label="Date" rules={[{ required: true, message: 'Date required' }]}>
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>
      {selectedCat?.kind === 'mileage' ? (
        <Form.Item name="distance" label={`Distance (${selectedCat.mileageUnit || 'units'})`} rules={[{ required: true, message: 'Distance required' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      ) : (
        <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Amount required' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      )}
      <Form.Item name="merchant" label="Merchant"><Input placeholder="Optional" /></Form.Item>
      <Form.Item name="billNo" label="Bill no."><Input placeholder="Optional" /></Form.Item>
      <Form.Item name="description" label="Description"><Input placeholder="Optional" /></Form.Item>
    </div>
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
      message.error(e?.response?.data?.error || 'Failed to submit');
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
    { title: 'Claim', dataIndex: 'claimNo', render: (v, r) => (
      <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.title || '—'}</div></div>) },
    { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag status={v} /> },
    { title: 'Amount', dataIndex: 'totalAmount', align: 'right', render: (v, r) => (
      <div><div style={{ fontWeight: 600 }}>{money(v, r.currency)}</div>
      {r.currency !== r.baseCurrency && <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{money(r.baseAmount, r.baseCurrency)}</div>}</div>) },
    { title: 'Created', dataIndex: 'createdAt', render: (v) => fmtDate(v) },
    {
      title: '', key: 'actions', width: 120, align: 'right',
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
        icon={<SolutionOutlined />} color={PALETTE.green} tint={TINT.green}
        title="My Claims" subtitle="Create, submit and track expense claims"
        search={search} onSearch={setSearch} searchPlaceholder="Search claims…"
        onRefresh={load} loading={loading}
      >
        {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Claim</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total claims', value: stats.total, icon: <FileTextOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Drafts', value: stats.draft, icon: <SolutionOutlined />, color: PALETTE.grey, tint: TINT.grey },
        { label: 'Pending', value: stats.pending, icon: <SendOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Paid (base)', value: money(stats.paidAmt), icon: <DollarOutlined />, color: PALETTE.green, tint: TINT.green },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }} />
      </div>

      <Drawer
        title={creating ? 'New claim' : current ? `${current.claimNo} · ${current.status}` : 'Claim'}
        width={640} open={drawerOpen} onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={
          <div className="rvp-drawer-foot">
            <Button onClick={() => setDrawerOpen(false)}>{creating ? 'Cancel' : 'Close'}</Button>
            {creating && (
              <>
                <Button loading={busy} onClick={() => saveNew(false)}>Save as draft</Button>
                <Button type="primary" icon={<SendOutlined />} loading={busy}
                  disabled={newItems.length === 0} onClick={() => saveNew(true)}>Save &amp; submit</Button>
              </>
            )}
            {!creating && isDraft && (
              <Button type="primary" icon={<SendOutlined />} loading={busy}
                disabled={!current || current.items.length === 0} onClick={submitClaim}>Submit</Button>
            )}
          </div>
        }
      >
        {creating && (
          <>
            <Form form={headerForm} layout="vertical">
              <SectionCard icon={<FileTextOutlined />} tint={TINT.blue} color={PALETTE.blue}
                title="Claim details" subtitle="What is this claim for? The total is calculated from the line items below." step="STEP 1">
                <Form.Item name="title" label="Title"><Input placeholder="e.g. Client visit — Mumbai" /></Form.Item>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    <Form.Item name="currency" label="Currency"><CurrencySelect style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="exchangeRate" label={<span>Exchange rate → INR{' '}
                      <Tooltip title="How many INR one unit of the chosen currency is worth. The claim is stored in INR for reporting."><span style={{ color: 'var(--text-slate-400)' }}>ⓘ</span></Tooltip>
                    </span>}>
                      <InputNumber min={0} step={0.0001} style={{ width: '100%' }} placeholder="e.g. 83" />
                    </Form.Item>
                  </div>
                )}
              </SectionCard>
            </Form>

            <SectionCard icon={<SolutionOutlined />} tint={TINT.green} color={PALETTE.green}
              title="Line items" subtitle="Add each expense — saved with the claim" step="STEP 2">
              {newItems.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items added yet" />}
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
              <Form form={itemForm} layout="vertical">
                {renderItemFields()}
                <Button icon={<PlusOutlined />} onClick={addLocalItem} block>Add item</Button>
              </Form>
            </SectionCard>

            <SectionCard icon={<PaperClipOutlined />} tint={TINT.cyan} color={PALETTE.cyan}
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

            <SectionCard icon={<SolutionOutlined />} tint={TINT.green} color={PALETTE.green}
              title="Line items" subtitle={isDraft ? 'Add expenses to this claim' : 'Expenses on this claim'}>
              {current.items.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items yet" />}
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
                  <Form form={itemForm} layout="vertical">
                    {renderItemFields()}
                    <Button icon={<PlusOutlined />} loading={busy} onClick={addItem} block>Add item</Button>
                  </Form>
                </>
              )}
            </SectionCard>

            <SectionCard icon={<PaperClipOutlined />} tint={TINT.cyan} color={PALETTE.cyan}
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
      </Drawer>
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
