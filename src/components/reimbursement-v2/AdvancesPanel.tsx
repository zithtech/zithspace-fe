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
import { PALETTE, TINT, PanelHeader, StatCards, SectionCard, RmbStyles, money, fmtDate, StatusTag, CurrencySelect, currencySymbol } from './ui';

export default function AdvancesPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursement || perms.canManageReimbursements;
  const canCreate = perms.canCreateReimbursement || perms.canManageReimbursements;

  const [rows, setRows] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const cur = Form.useWatch('currency', form);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await ReimbursementV2Service.listMyAdvances()); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load advances'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const stats = useMemo(() => ({
    total: rows.length,
    outstanding: rows.reduce((s, r) => s + (r.status === 'paid' || r.status === 'partially_reconciled' ? r.outstanding : 0), 0),
    pending: rows.filter((r) => r.status === 'pending').length,
    reconciled: rows.filter((r) => r.status === 'reconciled').length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => !q || r.advanceNo.toLowerCase().includes(q) || (r.purpose || '').toLowerCase().includes(q));
  }, [rows, search]);

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
      title: '', key: 'actions', width: 60, align: 'right',
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
        {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Request Advance</Button>}
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total', value: stats.total, icon: <WalletOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Outstanding', value: money(stats.outstanding), icon: <DollarOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Pending', value: stats.pending, icon: <InfoCircleOutlined />, color: PALETTE.orange, tint: TINT.orange },
        { label: 'Reconciled', value: stats.reconciled, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
      ]} />

      <div className="rvp-table-wrap">
        <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }} />
      </div>

      <Drawer title="Request advance" width={480} open={drawerOpen} onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={<div className="rvp-drawer-foot">
          <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={submit}>Request</Button>
        </div>}>
        <Form form={form} layout="vertical">
          <SectionCard icon={<WalletOutlined />} tint={TINT.cyan} color={PALETTE.cyan} title="Advance details" subtitle="Sent to your reporting manager">
            <Form.Item name="purpose" label="Purpose"><Input.TextArea rows={2} placeholder="e.g. Onsite travel to Bangalore" /></Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="amount" label="Amount"
                rules={[{ required: true, message: 'Amount required' }, { type: 'number', min: 1, message: 'Must be at least 1' }]}>
                <InputNumber min={1} prefix={currencySymbol(cur)} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="currency" label="Currency"><CurrencySelect style={{ width: '100%' }} /></Form.Item>
            </div>
            <Form.Item name="neededBy" label="Needed by"><DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
          </SectionCard>
        </Form>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
