'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Alert, Button, Empty, Skeleton, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCheck, RotateCw } from 'lucide-react';

import OpeningV2Service, { type ClosureCandidate } from '@/services/openingV2Service';
import { OpeningStyles, PALETTE, PanelHeader, StatusChip, TINT, ViewModeToggle } from './ui';

// Phase 7 — openings that have met their hiring target but are still open.
//
// Closing is deliberately NOT automatic on the backend: it cuts off candidates
// still in the pipeline. This page is the prompt that replaces that automation.
export default function ClosingQueuePanel() {
  const { message } = App.useApp();

  const router = useRouter();
  const [rows, setRows] = useState<ClosureCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await OpeningV2Service.closureCandidates());
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the closing queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<ClosureCandidate> = [
    {
      title: 'Opening',
      width: 280,
      render: (_: any, r) => (
        <div className="omp-title-cell">
          <span className="omp-title-main">{r.jobTitle}</span>
          <span className="omp-title-sub">
            <span className="omp-code">{r.openingCode}</span>
            {r.departmentName ? ` · ${r.departmentName}` : ''}
          </span>
        </div>
      ),
    },
    { title: 'Status', width: 140, render: (_: any, r) => <StatusChip status={r.status} /> },
    {
      title: 'Hired',
      width: 110,
      align: 'center',
      render: (_: any, r) => (
        <strong style={{ color: PALETTE.green }}>
          {r.hired}/{r.openPositions}
        </strong>
      ),
    },
    {
      title: 'Still in pipeline',
      width: 130,
      align: 'center',
      render: (_: any, r) =>
        r.openApplications ? (
          <span style={{ color: PALETTE.blue, fontWeight: 700 }}>{r.openApplications}</span>
        ) : (
          <span className="omp-muted">0</span>
        ),
    },
    {
      title: 'Hiring manager',
      dataIndex: 'hiringManagerName',
      width: 160,
      render: (v: string | null) => v ?? <span className="omp-muted">—</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, r) => (
        <Button size="small" type="primary" onClick={() => router.push(`/openings/${r.openingId}`)}>
          Review & close
        </Button>
      ),
    },
  ];

  return (
    <div className="omp">
      <OpeningStyles />

      <PanelHeader
        icon={<CheckCheck size={17} />}
        color={PALETTE.green}
        tint={TINT.green}
        title="Ready to Close"
        subtitle="Openings that have met their hiring target"
      >
        <ViewModeToggle mode={viewMode} setMode={setViewMode} />
        <Button icon={<RotateCw size={14} />} loading={loading} onClick={load} />
      </PanelHeader>

      {rows.some((r) => r.openApplications > 0) && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="Some of these still have candidates in the pipeline"
          description="Closing an opening takes its postings down. You can reject the remaining candidates as part of closing, or decide on them first."
        />
      )}

      {loading && rows.length === 0 ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <div className="opn-table-wrap">
          {viewMode === 'list' ? (
            <Table<ClosureCandidate>
              rowKey="openingId"
              size="small"
              columns={columns}
              dataSource={rows}
              scroll={{ x: 1000 }}
              pagination={false}
              onRow={(record) => ({ onClick: () => router.push(`/openings/${record.openingId}`) })}
              locale={{
                emptyText: (
                  <div className="omp-empty">
                    <NoData description={
                                                <>
                                                  <div className="omp-empty-title">Nothing ready to close</div>
                                                  <div className="omp-empty-sub">
                                                    Openings appear here once hires reach the number of positions.
                                                  </div>
                                                </>
                                              } />
                  </div>
                ),
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {rows.length === 0 ? (
                  <div className="omp-empty">
                    <NoData description={
                                                <>
                                                  <div className="omp-empty-title">Nothing ready to close</div>
                                                  <div className="omp-empty-sub">
                                                    Openings appear here once hires reach the number of positions.
                                                  </div>
                                                </>
                                              } />
                  </div>
                ) : (
                  <div className="omp-grid">
                    {rows.map((r) => (
                      <div key={r.openingId} className="omp-list-card" onClick={() => router.push(`/openings/${r.openingId}`)}>
                        <div className="omp-list-card-head">
                          <div className="omp-list-card-avatar" style={{ background: '#10b981' }}>
                            {r.jobTitle?.[0]?.toUpperCase() || 'O'}
                          </div>
                          <div className="omp-list-card-body">
                            <div className="omp-list-card-title">
                              <span>{r.jobTitle}</span>
                              <StatusChip status={r.status} />
                            </div>
                            <div className="omp-list-card-sub">
                              <span className="omp-list-card-key">Code:</span>
                              <span className="omp-list-card-val">{r.openingCode}</span>
                              {r.departmentName && <span>· {r.departmentName}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="omp-list-card-footer" onClick={e => e.stopPropagation()}>
                          <div className="omp-list-card-row">
                            <span className="omp-list-card-item">
                              <span className="omp-list-card-key">Hired:</span>
                              <span className="omp-list-card-val"><strong style={{ color: PALETTE.green }}>{r.hired}/{r.openPositions}</strong></span>
                            </span>
                            <span className="omp-list-card-div" />
                            <span className="omp-list-card-item">
                              <span className="omp-list-card-key">In Pipeline:</span>
                              <span className="omp-list-card-val">
                                {r.openApplications ? (
                                  <span style={{ color: PALETTE.blue, fontWeight: 700 }}>{r.openApplications}</span>
                                ) : (
                                  <span className="omp-muted">0</span>
                                )}
                              </span>
                            </span>
                            <span className="omp-list-card-div" />
                            <span className="omp-list-card-item">
                              <span className="omp-list-card-key">HM:</span>
                              <span className="omp-list-card-val">{r.hiringManagerName ?? '—'}</span>
                            </span>
                          </div>
                          
                          <div className="omp-list-card-row" style={{ justifyContent: 'flex-end', background: 'var(--bg-pure-white)' }}>
                            <Button size="small" type="primary" onClick={() => router.push(`/openings/${r.openingId}`)}>
                              Review & close
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
