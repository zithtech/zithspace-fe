'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tabs, Modal, Input, Form, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BankOutlined, DollarOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ReimbursementV2Service, { ApprovalInboxItem, AdvanceInboxItem } from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, RmbStyles, money, fmtDate } from './ui';

type PayTarget = { kind: 'claim' | 'advance'; id: string; label: string } | null;

export default function FinancePanel() {
  const perms = usePermission() as any;
  const canPay = perms.canPayReimbursement || perms.canManageReimbursements;

  const [claims, setClaims] = useState<ApprovalInboxItem[]>([]);
  const [claimsTotal, setClaimsTotal] = useState(0);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsSize, setClaimsSize] = useState(20);

  const [advances, setAdvances] = useState<AdvanceInboxItem[]>([]);
  const [advancesTotal, setAdvancesTotal] = useState(0);
  const [advancesPage, setAdvancesPage] = useState(1);
  const [advancesSize, setAdvancesSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<PayTarget>(null);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async (cPage = claimsPage, cSize = claimsSize, aPage = advancesPage, aSize = advancesSize) => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        ReimbursementV2Service.listPayableClaims({ page: cPage, limit: cSize }),
        ReimbursementV2Service.listPayableAdvances({ page: aPage, limit: aSize }),
      ]);
      setClaims(c.data);
      setClaimsTotal(c.pagination.total);
      setAdvances(a.data);
      setAdvancesTotal(a.pagination.total);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load payables'); }
    finally { setLoading(false); }
  }, [claimsPage, claimsSize, advancesPage, advancesSize]);

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
      title: 'Actions', key: 'actions', width: 130, align: 'right',
      render: (_, r) => <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => openPay({ kind: 'claim', id: r.id, label: `Pay ${r.claimNo}` })}>Mark paid</Button>,
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
      title: 'Actions', key: 'actions', width: 130, align: 'right',
      render: (_, r) => <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => openPay({ kind: 'advance', id: r.id, label: `Pay ${r.advanceNo}` })}>Mark paid</Button>,
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
            key: 'claims', label: `Claims (${claimsTotal})`,
            children: (
              <div className="rvp-table-wrap">
                <Table rowKey="id" size="middle" loading={loading} columns={claimCols} dataSource={claims}
                  locale={{ emptyText: <NoData description="Nothing to pay" /> }}
                  pagination={{
                    current: claimsPage,
                    pageSize: claimsSize,
                    total: claimsTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (t) => `${t} claims`,
                    onChange: (page, size) => {
                      setClaimsPage(page);
                      setClaimsSize(size ?? claimsSize);
                      load(page, size ?? claimsSize, advancesPage, advancesSize);
                    },
                  }} />
              </div>
            ),
          },
          {
            key: 'advances', label: `Advances (${advancesTotal})`,
            children: (
              <div className="rvp-table-wrap">
                <Table rowKey="id" size="middle" loading={loading} columns={advanceCols} dataSource={advances}
                  locale={{ emptyText: <NoData description="Nothing to pay" /> }}
                  pagination={{
                    current: advancesPage,
                    pageSize: advancesSize,
                    total: advancesTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (t) => `${t} advances`,
                    onChange: (page, size) => {
                      setAdvancesPage(page);
                      setAdvancesSize(size ?? advancesSize);
                      load(claimsPage, claimsSize, page, size ?? advancesSize);
                    },
                  }} />
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!target}
        onCancel={() => setTarget(null)}
        title={null}
        closable={false}
        footer={null}
        width={420}
        styles={{
          content: {
            padding: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            borderRadius: 12,
          },
        }}
      >
        <div className="flex flex-col">
          <div
            className="px-5 py-4 border-b flex justify-between items-center"
            style={{
              borderColor: 'var(--border-color)',
              background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            }}
          >
            <div className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
              {target?.label}
            </div>
            <button
              type="button"
              onClick={() => setTarget(null)}
              aria-label="Close"
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span style={{ display: 'inline-block', transform: 'rotate(45deg)', fontSize: 18, lineHeight: 1 }}>+</span>
            </button>
          </div>

          <div className="p-5 pb-1">
            <Form form={form} layout="vertical" requiredMark={false}>
              <Form.Item 
                name="paymentReference" 
                label={<span style={{ color: 'var(--text-secondary)' }}>Payment reference</span>} 
                rules={[{ required: true, message: 'Reference required' }]}
              >
                <Input 
                  placeholder="e.g. NEFT-2024-00123" 
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }} 
                />
              </Form.Item>
              <Form.Item 
                name="remarks" 
                label={<span style={{ color: 'var(--text-secondary)' }}>Remarks</span>}
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Optional" 
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    boxShadow: 'none',
                  }}
                />
              </Form.Item>
            </Form>
          </div>

          <div
            className="px-5 py-3 border-t flex justify-end gap-2"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
          >
            <Button onClick={() => setTarget(null)} style={{ borderRadius: 8, height: 36 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={confirmPay}
              loading={busy}
              style={{ borderRadius: 8, height: 36 }}
            >
              Mark paid
            </Button>
          </div>
        </div>
      </Modal>
      <RmbStyles />
    </div>
  );
}
