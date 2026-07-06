'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tabs, Modal, Input, Form, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BankOutlined, DollarOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ReimbursementV2Service, { ApprovalInboxItem, AdvanceInboxItem } from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, RmbStyles, money, fmtDate, tablePaginationConfig } from './ui';

type PayTarget = { kind: 'claim' | 'advance'; id: string; label: string } | null;

export default function FinancePanel() {
  const perms = usePermission() as any;
  const canPay = perms.canPayReimbursement || perms.canManageReimbursements;

  const [claims, setClaims] = useState<ApprovalInboxItem[]>([]);
  const [advances, setAdvances] = useState<AdvanceInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<PayTarget>(null);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        ReimbursementV2Service.listPayableClaims(),
        ReimbursementV2Service.listPayableAdvances(),
      ]);
      setClaims(c); setAdvances(a);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load payables'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canPay) load(); }, [canPay, load]);

  const openPay = (t: PayTarget) => { setTarget(t); form.resetFields(); };

  const confirmPay = async () => {
    if (!target) return;
    let v: any;
    try { v = await form.validateFields(); } catch { return; }
    setBusy(true);
    try {
      if (target.kind === 'claim') await ReimbursementV2Service.markClaimPaid(target.id, v.paymentReference, v.remarks);
      else await ReimbursementV2Service.markAdvancePaid(target.id, v.paymentReference, v.remarks);
      message.success('Marked paid');
      setTarget(null);
      await load();
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to mark paid'); }
    finally { setBusy(false); }
  };

  const claimCols: ColumnsType<ApprovalInboxItem> = [
    { title: 'Claim', dataIndex: 'claimNo', render: (v, r) => (
      <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.requesterName || r.requesterEmail || r.userId}</div></div>) },
    { title: 'Title', dataIndex: 'title', render: (v) => v || '—' },
    { title: 'Amount', dataIndex: 'baseAmount', align: 'right', render: (v, r) => (
      <div><div style={{ fontWeight: 600 }}>{money(v, r.baseCurrency)}</div>
      {r.currency !== r.baseCurrency && <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{money(r.totalAmount, r.currency)}</div>}</div>) },
    { title: 'Approved', dataIndex: 'decidedAt', render: (v) => fmtDate(v) },
    {
      title: '', key: 'actions', width: 130, align: 'right',
      render: (_, r) => <Button size="small" type="primary" size="small" icon={<DollarOutlined />} onClick={() => openPay({ kind: 'claim', id: r.id, label: `Pay ${r.claimNo}` })}>Mark paid</Button>,
    },
  ];

  const advanceCols: ColumnsType<AdvanceInboxItem> = [
    { title: 'Advance', dataIndex: 'advanceNo', render: (v, r) => (
      <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.requesterName || r.requesterEmail || r.userId}</div></div>) },
    { title: 'Purpose', dataIndex: 'purpose', render: (v) => v || '—' },
    { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v, r) => money(v, r.currency) },
    { title: 'Needed by', dataIndex: 'neededBy', render: (v) => fmtDate(v) },
    {
      title: '', key: 'actions', width: 130, align: 'right',
      render: (_, r) => <Button size="small" type="primary" size="small" icon={<DollarOutlined />} onClick={() => openPay({ kind: 'advance', id: r.id, label: `Pay ${r.advanceNo}` })}>Mark paid</Button>,
    },
  ];

  if (!canPay) return <div className="rvp-empty">You don’t have finance permission.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<BankOutlined />} color={PALETTE.violet} tint={TINT.violet}
        title="Finance" subtitle="Settle approved claims & advances"
        onRefresh={load} loading={loading}
      />

      <Tabs
        items={[
          {
            key: 'claims', label: `Claims (${claims.length})`,
            children: (
              <div className="rvp-table-wrap">
                <Table rowKey="id" size="middle" loading={loading} columns={claimCols} dataSource={claims}
                  locale={{ emptyText: <Empty description="Nothing to pay" /> }} pagination={tablePaginationConfig} />
              </div>
            ),
          },
          {
            key: 'advances', label: `Advances (${advances.length})`,
            children: (
              <div className="rvp-table-wrap">
                <Table rowKey="id" size="middle" loading={loading} columns={advanceCols} dataSource={advances}
                  locale={{ emptyText: <Empty description="Nothing to pay" /> }} pagination={tablePaginationConfig} />
              </div>
            ),
          },
        ]}
      />

      <Modal open={!!target} title={target?.label} onCancel={() => setTarget(null)} onOk={confirmPay} confirmLoading={busy} okText="Mark paid">
        <Form form={form} layout="vertical">
          <Form.Item name="paymentReference" label="Payment reference" rules={[{ required: true, message: 'Reference required' }]}>
            <Input placeholder="e.g. NEFT-2024-00123" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} placeholder="Optional" /></Form.Item>
        </Form>
      </Modal>
      <RmbStyles />
    </div>
  );
}
