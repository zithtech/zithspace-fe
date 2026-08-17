'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Drawer, Form, Input, InputNumber, DatePicker, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  PlusOutlined, WalletOutlined, CloseCircleOutlined, InfoCircleOutlined,
  DollarOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ReimbursementV2Service, { Advance } from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, fmtDate, StatusTag, CurrencySelect, currencySymbol, preventInvalidNumberKeys } from './ui';
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

export default function AdvancesPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursement || perms.canManageReimbursements;
  const canCreate = perms.canCreateReimbursement || perms.canManageReimbursements;

  const [rows, setRows] = useState<Advance[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const cur = Form.useWatch('currency', form);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 on search change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const load = useCallback(async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const result = await ReimbursementV2Service.listMyAdvances({
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      setRows(result.data);
      setTotal(result.pagination.total);
    }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load advances'); }
    finally { setLoading(false); }
  }, [debouncedSearch, currentPage, pageSize]);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total,
    outstanding: rows.reduce((s, r) => s + (r.status === 'paid' || r.status === 'partially_reconciled' ? r.outstanding : 0), 0),
    pending: rows.filter((r) => r.status === 'pending').length,
    reconciled: rows.filter((r) => r.status === 'reconciled').length,
  }), [rows, total]);

  const openCreate = () => { form.resetFields(); form.setFieldsValue({ currency: 'INR' }); setDrawerOpen(true); };

  const submit = async () => {
    let v: any;
    try { v = await form.validateFields(); } catch { return; }
    setSaving(true);
    try {
      await ReimbursementV2Service.requestAdvance({
        purpose: v.purpose, amount: v.amount, currency: v.currency,
        neededBy: v.neededBy ? dayjs(v.neededBy).format('YYYY-MM-DD') : null,
      });
      message.success('Advance requested');
      setDrawerOpen(false);
      await load();
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to request advance'); }
    finally { setSaving(false); }
  };

  const cancel = async (r: Advance) => {
    try { await ReimbursementV2Service.cancelAdvance(r.id); message.success('Advance cancelled'); await load(); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to cancel'); }
  };

  const columns: ColumnsType<Advance> = [
    { title: 'Advance', dataIndex: 'advanceNo', render: (v, r) => (
      <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.purpose || '—'}</div></div>) },
    { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag status={v} /> },
    { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v, r) => money(v, r.currency) },
    { title: 'Reconciled', dataIndex: 'reconciledAmount', align: 'right', render: (v, r) => money(v, r.currency) },
    { title: 'Outstanding', dataIndex: 'outstanding', align: 'right', render: (v, r) => <span style={{ fontWeight: 600 }}>{money(v, r.currency)}</span> },
    { title: 'Needed by', dataIndex: 'neededBy', render: (v) => fmtDate(v) },
    {
      title: 'Actions', key: 'actions', width: 60, align: 'right',
      render: (_, r) => (['pending', 'approved'].includes(r.status) ? (
        <ConfirmDialog tone="warning" icon={<CloseCircleOutlined />} title="Cancel this advance?" confirmText="Cancel"
          placement="bottomRight" onConfirm={() => cancel(r)}>
          <Button type="text" size="small" icon={<CloseCircleOutlined />} />
        </ConfirmDialog>
      ) : null),
    },
  ];

  if (!canRead) return <div className="rvp-empty">You don’t have permission to view advances.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<WalletOutlined />} color={PALETTE.cyan} tint={TINT.cyan}
        title="Cash Advances" subtitle="Request money upfront, reconcile with claims"
        search={search} onSearch={setSearch} searchPlaceholder="Search advances…"
        onRefresh={load} loading={loading}
      >
        {canCreate && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Request Advance</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total', value: stats.total, icon: <WalletOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Outstanding', value: money(stats.outstanding), icon: <DollarOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Pending', value: stats.pending, icon: <InfoCircleOutlined />, color: PALETTE.orange, tint: TINT.orange },
        { label: 'Reconciled', value: stats.reconciled, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={rows}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t) => `${t} advances`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size ?? pageSize);
            },
          }} />
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
              icon={<PlusOutlined />}
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              Request
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
                background: TINT.cyan,
                color: PALETTE.cyan,
                border: '1px solid var(--border-cyan-200)',
              }}
            >
              <PlusOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Request Advance
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Request money upfront
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
          <SectionCard icon={<WalletOutlined />} title="Advance details" subtitle="Sent to your reporting manager">
            <Form.Item name="purpose" label="Purpose" rules={[{ pattern: /^[a-zA-Z0-9\s\-_.,()]*$/, message: 'Special characters are not allowed' }]}><Input.TextArea rows={2} placeholder="e.g. Onsite travel to Bangalore" /></Form.Item>
            <>
              <Form.Item name="amount" label="Amount"
                rules={[{ required: true, message: 'Amount required' }, { type: 'number', min: 1, message: 'Must be at least 1' }]}>
                <InputNumber min={1} prefix={currencySymbol(cur)} style={{ width: '100%' }} onKeyDown={preventInvalidNumberKeys as any} />
              </Form.Item>
              <Form.Item name="currency" label="Currency"><CurrencySelect style={{ width: '100%' }} /></Form.Item>
            </>
            <Form.Item name="neededBy" label="Needed by"><DatePicker inputReadOnly style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
          </SectionCard>
          </Form>
        </div>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
