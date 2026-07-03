'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tabs, Modal, Input, Drawer, message, Descriptions, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BadgeCheck as BadgeIcon,
} from 'lucide-react';
import {
  CheckOutlined, CloseOutlined, RollbackOutlined, EyeOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ReimbursementV2Service, {
  ApprovalInboxItem, AdvanceInboxItem, ClaimDetail,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, RmbStyles, money, fmtDate, StatusTag } from './ui';

type Pending = { kind: 'claim' | 'advance'; action: 'approve' | 'reject' | 'send-back'; id: string; label: string } | null;

export default function ApprovalsPanel() {
  const perms = usePermission() as any;
  const canApprove = perms.canApproveReimbursement || perms.canManageReimbursements;

  const [claims, setClaims] = useState<ApprovalInboxItem[]>([]);
  const [advances, setAdvances] = useState<AdvanceInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<ClaimDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        ReimbursementV2Service.listPendingClaims(),
        ReimbursementV2Service.listPendingAdvances(),
      ]);
      setClaims(c); setAdvances(a);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load approvals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canApprove) load(); }, [canApprove, load]);

  const openDecision = (p: Pending) => { setPending(p); setRemarks(''); };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const { kind, action, id } = pending;
      if (kind === 'claim') {
        if (action === 'approve') await ReimbursementV2Service.approveClaim(id, remarks);
        else if (action === 'reject') await ReimbursementV2Service.rejectClaim(id, remarks);
        else await ReimbursementV2Service.sendBackClaim(id, remarks);
      } else {
        if (action === 'approve') await ReimbursementV2Service.approveAdvance(id, remarks);
        else await ReimbursementV2Service.rejectAdvance(id, remarks);
      }
      message.success('Done');
      setPending(null);
      await load();
    } catch (e: any) { message.error(e?.response?.data?.error || 'Action failed'); }
    finally { setBusy(false); }
  };

  const view = async (id: string) => {
    try { setDetail(await ReimbursementV2Service.getApprovalClaim(id)); }
    catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load claim'); }
  };

  const claimCols: ColumnsType<ApprovalInboxItem> = [
    { title: 'Claim', dataIndex: 'claimNo', render: (v, r) => (
      <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
      <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.requesterName || r.requesterEmail || r.userId}</div></div>) },
    { title: 'Title', dataIndex: 'title', render: (v) => v || '—' },
    { title: 'Items', dataIndex: 'itemCount', align: 'center' },
    { title: 'Amount', dataIndex: 'totalAmount', align: 'right', render: (v, r) => money(v, r.currency) },
    { title: 'Submitted', dataIndex: 'submittedAt', render: (v) => fmtDate(v) },
    {
      title: '', key: 'actions', width: 170, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => view(r.id)} />
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openDecision({ kind: 'claim', action: 'approve', id: r.id, label: `Approve ${r.claimNo}` })}>Approve</Button>
          <Button size="small" icon={<RollbackOutlined />} onClick={() => openDecision({ kind: 'claim', action: 'send-back', id: r.id, label: `Send back ${r.claimNo}` })} />
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => openDecision({ kind: 'claim', action: 'reject', id: r.id, label: `Reject ${r.claimNo}` })} />
        </div>
      ),
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
      title: '', key: 'actions', width: 150, align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openDecision({ kind: 'advance', action: 'approve', id: r.id, label: `Approve ${r.advanceNo}` })}>Approve</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => openDecision({ kind: 'advance', action: 'reject', id: r.id, label: `Reject ${r.advanceNo}` })} />
        </div>
      ),
    },
  ];

  if (!canApprove) return <div className="rvp-empty">You don’t have approval permission.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<BadgeIcon size={18} />} color={PALETTE.amber} tint={TINT.amber}
        title="Approvals" subtitle="Decide claims & advances from your team"
        onRefresh={load} loading={loading}
      />

      <Tabs
        items={[
          {
            key: 'claims', label: `Claims (${claims.length})`,
            children: (
              <div className="rvp-table-wrap">
                <Table rowKey="id" size="middle" loading={loading} columns={claimCols} dataSource={claims}
                  locale={{ emptyText: <Empty description="No pending claims" /> }} pagination={{ pageSize: 12, hideOnSinglePage: true }} />
              </div>
            ),
          },
          {
            key: 'advances', label: `Advances (${advances.length})`,
            children: (
              <div className="rvp-table-wrap">
                <Table rowKey="id" size="middle" loading={loading} columns={advanceCols} dataSource={advances}
                  locale={{ emptyText: <Empty description="No pending advances" /> }} pagination={{ pageSize: 12, hideOnSinglePage: true }} />
              </div>
            ),
          },
        ]}
      />

      <Modal open={!!pending} title={pending?.label} onCancel={() => setPending(null)} onOk={confirm} confirmLoading={busy} okText="Confirm">
        <Input.TextArea rows={3} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Modal>

      <Drawer title={detail?.claimNo} width={520} open={!!detail} onClose={() => setDetail(null)} destroyOnClose>
        {detail && (
          <>
            <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Status"><StatusTag status={detail.status} /></Descriptions.Item>
              <Descriptions.Item label="Total">{money(detail.totalAmount, detail.currency)}</Descriptions.Item>
              <Descriptions.Item label="Title">{detail.title || '—'}</Descriptions.Item>
            </Descriptions>
            {detail.items.map((it) => (
              <div key={it.id} style={{ padding: '8px 10px', border: '1px solid var(--border-slate-100)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{it.categoryName || it.categoryCode} · {money(it.amount, detail.currency)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{fmtDate(it.expenseDate)}{it.merchant ? ` · ${it.merchant}` : ''}</div>
              </div>
            ))}
            {detail.attachments.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Receipts</div>
                {detail.attachments.map((a) => (
                  <div key={a.id}><a href={a.fileUrl} target="_blank" rel="noreferrer">{a.fileName}</a></div>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>
      <RmbStyles />
    </div>
  );
}
