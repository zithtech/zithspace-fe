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
import { drawerFormStyles as formStyles, commonDrawerProps, SectionCard } from '@/components/common/DrawerSection';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

type Pending = { kind: 'claim' | 'advance'; action: 'approve' | 'reject' | 'send-back'; id: string; label: string } | null;

export default function ApprovalsPanel() {
  const perms = usePermission() as any;
  const canApprove = perms.canApproveReimbursement || perms.canManageReimbursements;

  const [claims, setClaims] = useState<ApprovalInboxItem[]>([]);
  const [claimsTotal, setClaimsTotal] = useState(0);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsSize, setClaimsSize] = useState(20);

  const [advances, setAdvances] = useState<AdvanceInboxItem[]>([]);
  const [advancesTotal, setAdvancesTotal] = useState(0);
  const [advancesPage, setAdvancesPage] = useState(1);
  const [advancesSize, setAdvancesSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<ClaimDetail | null>(null);

  const load = useCallback(async (cPage = claimsPage, cSize = claimsSize, aPage = advancesPage, aSize = advancesSize) => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        ReimbursementV2Service.listPendingClaims({ page: cPage, limit: cSize }),
        ReimbursementV2Service.listPendingAdvances({ page: aPage, limit: aSize }),
      ]);
      setClaims(c.data);
      setClaimsTotal(c.pagination.total);
      setAdvances(a.data);
      setAdvancesTotal(a.pagination.total);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load approvals'); }
    finally { setLoading(false); }
  }, [claimsPage, claimsSize, advancesPage, advancesSize]);

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
    {
      title: 'Claim', dataIndex: 'claimNo', render: (v, r) => (
        <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.requesterName || r.requesterEmail || r.userId}</div></div>)
    },
    { title: 'Title', dataIndex: 'title', render: (v) => v || '—' },
    { title: 'Items', dataIndex: 'itemCount', align: 'center' },
    { title: 'Amount', dataIndex: 'totalAmount', align: 'right', render: (v, r) => money(v, r.currency) },
    { title: 'Submitted', dataIndex: 'submittedAt', render: (v) => fmtDate(v) },
    {
      title: 'Actions', key: 'actions', width: 170, align: 'right',
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
    {
      title: 'Advance', dataIndex: 'advanceNo', render: (v, r) => (
        <div><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.requesterName || r.requesterEmail || r.userId}</div></div>)
    },
    { title: 'Purpose', dataIndex: 'purpose', render: (v) => v || '—' },
    { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v, r) => money(v, r.currency) },
    { title: 'Needed by', dataIndex: 'neededBy', render: (v) => fmtDate(v) },
    {
      title: 'Actions', key: 'actions', width: 150, align: 'right',
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
            key: 'claims', label: `Claims (${claimsTotal})`,
            children: (
              <div className="rvp-table-wrap">
                <ZukvoLoadingOverlay loading={loading} message="" minHeight={400}>
                  <Table rowKey="id" size="middle" loading={loading} columns={claimCols} dataSource={claims}
                    locale={{ emptyText: <Empty description="No pending claims" /> }}
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
                </ZukvoLoadingOverlay>
              </div>
            ),
          },
          {
            key: 'advances', label: `Advances (${advancesTotal})`,
            children: (
              <div className="rvp-table-wrap">
                <ZukvoLoadingOverlay loading={loading} message="" minHeight={400}>
                  <Table rowKey="id" size="middle" loading={loading} columns={advanceCols} dataSource={advances}
                    locale={{ emptyText: <Empty description="No pending advances" /> }}
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
                </ZukvoLoadingOverlay>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!pending}
        onCancel={() => setPending(null)}
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
              {pending?.label}
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              aria-label="Close"
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span style={{ display: 'inline-block', transform: 'rotate(45deg)', fontSize: 18, lineHeight: 1 }}>+</span>
            </button>
          </div>

          <div className="p-5">
            <label className="block mb-2 text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Remarks (optional)
            </label>
            <Input.TextArea
              rows={4}
              placeholder="Add any remarks for this decision..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                boxShadow: 'none',
              }}
            />
          </div>

          <div
            className="px-5 py-3 border-t flex justify-end gap-2"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
          >
            <Button onClick={() => setPending(null)} style={{ borderRadius: 8, height: 36 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={confirm}
              loading={busy}
              danger={pending?.action === 'reject'}
              style={{ borderRadius: 8, height: 36 }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Drawer
        {...commonDrawerProps}
        title={null}
        width={520}
        open={!!detail}
        onClose={() => setDetail(null)}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Button onClick={() => setDetail(null)} style={{ borderRadius: 8, height: 36 }}>
              Close
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
                background: TINT.amber,
                color: PALETTE.amber,
                border: '1px solid var(--border-amber-200)',
              }}
            >
              <EyeOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {detail ? detail.claimNo : 'Claim'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                View claim details
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDetail(null)}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ display: 'inline-block', transform: 'rotate(45deg)', fontSize: 18, lineHeight: 1 }}>+</span>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5 pb-24">
          {detail && (
            <>
              <SectionCard icon={<EyeOutlined />} title="Claim Info" subtitle="Basic details about this claim">
                <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Status"><StatusTag status={detail.status} /></Descriptions.Item>
                  <Descriptions.Item label="Total">{money(detail.totalAmount, detail.currency)}</Descriptions.Item>
                  <Descriptions.Item label="Title">{detail.title || '—'}</Descriptions.Item>
                </Descriptions>
              </SectionCard>
              <SectionCard icon={<EyeOutlined />} title="Line items" subtitle="Expenses on this claim">
                {detail.items.map((it) => (
                  <div key={it.id} style={{ padding: '8px 10px', border: '1px solid var(--border-slate-100)', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{it.categoryName || it.categoryCode} · {money(it.amount, detail.currency)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{fmtDate(it.expenseDate)}{it.merchant ? ` · ${it.merchant}` : ''}</div>
                  </div>
                ))}
              </SectionCard>
              {detail.attachments.length > 0 && (
                <SectionCard icon={<EyeOutlined />} title="Receipts" subtitle="Attached bills / invoices">
                  <div style={{ marginTop: 12 }}>
                    {detail.attachments.map((a) => (
                      <div key={a.id}><a href={a.fileUrl} target="_blank" rel="noreferrer">{a.fileName}</a></div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}
        </div>
      </Drawer>
      <RmbStyles />
    </div>
  );
}
