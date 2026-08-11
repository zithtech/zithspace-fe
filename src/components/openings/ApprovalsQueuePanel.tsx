'use client';

import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouter } from 'next/navigation';
import { App, Button, Empty, Input, Modal, Segmented, Skeleton, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BadgeCheck, CheckCircle2, RotateCw, XCircle } from 'lucide-react';

import { usePermission } from '@/hooks/usePermission';
import OpeningV2Service, { type PendingApprovalItem } from '@/services/openingV2Service';
import {
  OpeningStyles,
  PALETTE,
  PanelHeader,
  PriorityChip,
  TINT,
  fmtDate,
  relativeDays,
} from './ui';

// Phase 2 — the approval queue. HR/admins see everything pending; everyone else
// sees only the steps they can actually decide, which is exactly what the
// backend returns for them.
export default function ApprovalsQueuePanel() {
  const { message } = App.useApp();

  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;
  const canSeeAll = !!perms.canManageOpenings;

  const [rows, setRows] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'mine' | 'all'>(canSeeAll ? 'all' : 'mine');
  const [busy, setBusy] = useState<string | null>(null);

  const [rejectingItem, setRejectingItem] = useState<PendingApprovalItem | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await OpeningV2Service.listPendingApprovals(scope === 'mine'));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the approval queue');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (item: PendingApprovalItem, approve: boolean) => {
    if (approve) {
      setBusy(item.openingId);
      try {
        await OpeningV2Service.approve(item.openingId);
        message.success(`Approved “${item.approval.stepName}”`);
        load();
      } catch (err: any) {
        message.error(err?.response?.data?.error || 'Could not approve');
      } finally {
        setBusy(null);
      }
      return;
    }
    setRejectNote('');
    setRejectingItem(item);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingItem) return;
    if (!rejectNote.trim()) {
      message.error('A rejection note is required');
      return;
    }
    setRejectBusy(true);
    try {
      await OpeningV2Service.reject(rejectingItem.openingId, rejectNote.trim());
      message.success('Rejected — returned to draft');
      setRejectingItem(null);
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not reject');
    } finally {
      setRejectBusy(false);
    }
  };

  const columns: ColumnsType<PendingApprovalItem> = [
    {
      title: 'Opening',
      width: 260,
      render: (_: any, r) => (
        <div className="omp-title-cell">
          <span className="omp-title-main">{r.jobTitle}</span>
          <span className="omp-title-sub">
            <span className="omp-code">{r.openingCode}</span>
            {r.departmentName ? ` · ${r.departmentName}` : ''}
            {r.clientName ? ` · ${r.clientName}` : ''}
          </span>
        </div>
      ),
    },
    {
      title: 'Waiting on',
      width: 220,
      render: (_: any, r) => (
        <div className="omp-title-cell">
          <span className="omp-title-main">{r.approval.stepName}</span>
          <span className="omp-title-sub">
            {r.approval.approverName ??
              (r.approval.roleName ? `Anyone with ${r.approval.roleName}` : '—')}
            {r.approval.isOptional && ' · optional'}
          </span>
        </div>
      ),
    },
    { title: 'Priority', width: 90, render: (_: any, r) => <PriorityChip priority={r.priority} /> },
    { title: 'Positions', dataIndex: 'numberOfPositions', width: 90, align: 'center' },
    {
      title: 'Submitted',
      width: 160,
      render: (_: any, r) => (
        <span>
          {fmtDate(r.submittedAt)}
          <span className="omp-muted"> · {relativeDays(r.submittedAt)}</span>
        </span>
      ),
    },
    {
      title: 'By',
      dataIndex: 'submittedByName',
      width: 130,
      render: (v: string | null) => v ?? <span className="omp-muted">—</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 170,
      fixed: 'right',
      onCell: () => ({
        // The row navigates on click; the actions cell must not. Stopping at the
        // <td> covers the padding around the buttons too, which a wrapper <div>
        // does not — a click landing there used to navigate instead of acting.
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }),
      render: (_: any, r) =>
        perms.canUpdateOpening ? (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircle2 size={13} />}
              loading={busy === r.openingId}
              onClick={() => decide(r, true)}
            >
              Approve
            </Button>
            <Button size="small" danger icon={<XCircle size={13} />} onClick={() => decide(r, false)}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="omp">
      <OpeningStyles />

      <PanelHeader
        icon={<BadgeCheck size={17} />}
        color={PALETTE.green}
        tint={TINT.green}
        title="Approvals"
        subtitle="Openings waiting on a decision"
      >
        {canSeeAll && (
          <Segmented
            className="pb-seg"
            size="small"
            value={scope}
            onChange={(v) => setScope(v as 'mine' | 'all')}
            options={[
              { label: 'All pending', value: 'all' },
              { label: 'Mine', value: 'mine' },
            ]}
          />
        )}
        <Button icon={<RotateCw size={14} />} loading={loading} onClick={load} />
      </PanelHeader>

      {loading && rows.length === 0 ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : (
        <div className="omp-table-wrap" style={{ position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <LoadingSpinner size="medium" fullScreen={false} />
            </div>
          )}
          <Table<PendingApprovalItem>
            rowKey={(r) => r.approval.id}
            size="small"
            columns={columns}
            dataSource={rows}
            scroll={{ x: 1200 }}
            pagination={false}
            onRow={(record) => ({ onClick: () => router.push(`/openings/${record.openingId}`) })}
            locale={{
              emptyText: (
                <div className="omp-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <>
                        <div className="omp-empty-title">Nothing waiting on you</div>
                        <div className="omp-empty-sub">
                          Openings appear here when they reach a step you can decide.
                        </div>
                      </>
                    }
                  />
                </div>
              ),
            }}
          />
        </div>
      )}

      <Modal
        title={rejectingItem ? `Reject ${rejectingItem.openingCode}?` : 'Reject'}
        open={!!rejectingItem}
        onOk={handleRejectConfirm}
        onCancel={() => setRejectingItem(null)}
        okText="Reject"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectBusy}
      >
        <div className="pt-4">
          <Input.TextArea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Why is it being rejected? (required)"
          />
        </div>
      </Modal>
    </div>
  );
}
