'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Empty, Pagination, Progress, Skeleton, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  RotateCw,
  UserCheck,
  Users,
  XCircle,
  Layers,
} from 'lucide-react';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { FilterBar, FilterToggleButton, TicketFilterPill } from '@/components/common/FilterBar';
import OpeningV2Service, {
  type DashboardOverview,
  type OpeningMetrics,
  type OpeningStatus,
} from '@/services/openingV2Service';
import {
  OpeningStyles,
  PALETTE,
  PanelHeader,
  PriorityChip,
  SOURCE_LABELS,
  STAGE_META,
  STATUS_META,
  STATUS_ORDER,
  StatCards,
  StatusChip,
  TINT,
  tablePaginationConfig,
} from './ui';
import { useReferenceData } from './useReferenceData';

// Phase 6 — the hiring dashboard. Everything on this page comes from ONE request
// (`GET /dashboard`), which is also what keeps the panels consistent with each
// other: separate requests could straddle a pipeline change and show numbers
// that do not add up.

export default function DashboardPanel() {
  const { message } = App.useApp();

  const router = useRouter();
  const reference = useReferenceData();

  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OpeningStatus[]>([]);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(15);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await OpeningV2Service.dashboard({
          status: status.length ? status : undefined,
          departmentId: departmentId || undefined,
          includeClosed: includeClosed || undefined,
          page: tablePage,
          pageSize: tablePageSize,
          sortBy: 'applications',
          sortOrder: 'desc',
        })
      );
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the dashboard');
    } finally {
      setLoading(false);
    }
  }, [status, departmentId, includeClosed, tablePage, tablePageSize]);

  useEffect(() => {
    setTablePage(1);
  }, [status, departmentId, includeClosed, tablePageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;

  const columns: ColumnsType<OpeningMetrics> = [
    {
      title: 'Opening',
      width: 240,
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
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (v: OpeningStatus) => <StatusChip status={v} />,
    },
    { title: 'Priority', dataIndex: 'priority', width: 90, render: (p: any) => <PriorityChip priority={p} /> },
    {
      title: 'Positions',
      width: 110,
      align: 'center',
      render: (_: any, r) => (
        <Tooltip title={`${r.joined} joined of ${r.openPositions}`}>
          <div>
            <strong>
              {r.joined}/{r.openPositions}
            </strong>
          </div>
        </Tooltip>
      ),
    },
    { title: 'Applications', dataIndex: 'applications', width: 100, align: 'center' },
    { title: 'Screened', dataIndex: 'screened', width: 90, align: 'center' },
    { title: 'Interview', dataIndex: 'interview', width: 90, align: 'center' },
    { title: 'Offers', dataIndex: 'offers', width: 80, align: 'center' },
    {
      title: 'Rejected',
      dataIndex: 'rejected',
      width: 90,
      align: 'center',
      render: (v: number) => (v ? <span style={{ color: PALETTE.red }}>{v}</span> : v),
    },
    {
      title: 'Time to hire',
      width: 100,
      render: (_: any, r) =>
        r.avgDaysToHire !== null ? `${r.avgDaysToHire}d` : <span className="omp-muted">—</span>,
    },
    {
      title: 'Recruiter',
      dataIndex: 'primaryRecruiterName',
      width: 140,
      render: (v: string | null) => v ?? <span className="omp-muted">Unassigned</span>,
    },
  ];

  const activeFilterCount = status.length + (departmentId ? 1 : 0) + (includeClosed ? 1 : 0);

  return (
    <div className="omp">
      <OpeningStyles />

      <PanelHeader
        icon={<LayoutDashboard size={17} />}
        title="Hiring Dashboard"
        subtitle="Live funnel across every opening"
      >
        <FilterToggleButton
          isOpen={isFilterRowOpen}
          onToggle={() => setIsFilterRowOpen(!isFilterRowOpen)}
          activeCount={activeFilterCount}
        />
        <Button icon={<RotateCw size={14} />} loading={loading} onClick={load} />
      </PanelHeader>

      <StatCards
        title="Hiring Overview"
        statusText="ACTIVE"
        progressPct={(s?.applications || 0) > 0 ? Math.round(((s?.joined || 0) / s!.applications) * 100) : 0}
        cells={[
          { label: 'Active Openings', value: s?.openings ?? 0, icon: <Briefcase size={16} />, color: PALETTE.blue, tint: TINT.blue },
          { label: 'Open Positions', value: s?.openPositions ?? 0, icon: <Users size={16} />, color: PALETTE.ash, tint: TINT.ash },
          { label: 'Applications', value: s?.applications ?? 0, icon: <FileText size={16} />, color: PALETTE.blue, tint: TINT.blue },
          { label: 'Screened', value: s?.screened ?? 0, icon: <UserCheck size={16} />, color: PALETTE.blue, tint: TINT.blue },
          { label: 'Interview', value: s?.interview ?? 0, icon: <Calendar size={16} />, color: PALETTE.blue, tint: TINT.blue },
          { label: 'Offers', value: s?.offers ?? 0, icon: <Award size={16} />, color: PALETTE.blue, tint: TINT.blue },
          { label: 'Joined', value: s?.joined ?? 0, icon: <CheckCircle2 size={16} />, color: PALETTE.green, tint: TINT.green },
          { label: 'Rejected', value: s?.rejected ?? 0, icon: <XCircle size={16} />, color: PALETTE.red, tint: TINT.red },
        ]}
      />

      {isFilterRowOpen && (
        <FilterBar
          activeCount={activeFilterCount}
          onReset={() => {
            setStatus([]);
            setDepartmentId(null);
            setIncludeClosed(false);
          }}
          onClose={() => setIsFilterRowOpen(false)}
        >
          <TicketFilterPill
            label="Status"
            icon={<CheckCircle2 size={14} />}
            values={status}
            multiple
            options={STATUS_ORDER.map((x) => ({
              value: x,
              label: STATUS_META[x].label,
              dotColor: STATUS_META[x].tone === 'blue' ? '#3b82f6' : STATUS_META[x].tone === 'green' ? '#10b981' : STATUS_META[x].tone === 'red' ? '#ef4444' : '#64748b',
            }))}
            onChange={(v) => setStatus(Array.isArray(v) ? (v as OpeningStatus[]) : v ? [v as OpeningStatus] : [])}
          />

          <TicketFilterPill
            label="Department"
            icon={<Layers size={14} />}
            value={departmentId || undefined}
            options={reference.departments.map((d) => ({
              value: String(d.value),
              label: d.label,
            }))}
            onChange={(v) => setDepartmentId(Array.isArray(v) ? v[0] : (v || null))}
          />

          <TicketFilterPill
            label="Scope"
            icon={<Briefcase size={14} />}
            value={includeClosed ? 'all' : 'active'}
            options={[
              { value: 'active', label: 'Active only' },
              { value: 'all', label: 'Including closed' },
            ]}
            onChange={(v) => setIncludeClosed(v === 'all')}
          />
        </FilterBar>
      )}

      <div style={{ padding: '16px 20px 20px 20px' }}>

      {loading && !data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <div className="omp-dash-row">
            <div className="omp-section">
              <div className="omp-section-head">
                <div>
                  <div className="omp-section-title">Source effectiveness</div>
                  <div className="omp-section-sub">Which channels actually produce hires</div>
                </div>
              </div>
              {!data?.sources?.length ? (
                <div className="omp-muted">No applications yet.</div>
              ) : (
                <div className="omp-bars">
                  {data.sources.map((src) => (
                    <div className="omp-bar-row" key={src.source}>
                      <span className="omp-bar-label">{SOURCE_LABELS[src.source] ?? src.source}</span>
                      <div className="omp-bar-track">
                        <div
                          className="omp-bar-fill"
                          style={{
                            width: `${Math.min(100, (src.applications / Math.max(1, data.sources[0].applications)) * 100)}%`,
                            background: PALETTE.blue,
                          }}
                        />
                      </div>
                      <span className="omp-bar-value">
                        {src.applications}
                        <span className="omp-muted"> · {src.joined} hired</span>
                        <strong style={{ color: PALETTE.green, marginLeft: 6 }}>
                          {src.conversionRate}%
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="omp-section">
              <div className="omp-section-head">
                <div>
                  <div className="omp-section-title">Stage velocity</div>
                  <div className="omp-section-sub">
                    Average days before moving on — the bottleneck view
                  </div>
                </div>
              </div>
              {!data?.velocity?.length ? (
                <div className="omp-muted">Not enough movement to measure yet.</div>
              ) : (
                <div className="omp-bars">
                  {data.velocity.map((v) => (
                    <div className="omp-bar-row" key={v.stage}>
                      <span className="omp-bar-label">{STAGE_META[v.stage]?.label ?? v.stage}</span>
                      <div className="omp-bar-track">
                        <div
                          className="omp-bar-fill"
                          style={{
                            width: `${Math.min(100, (v.avgDays / Math.max(1, data.velocity[0].avgDays)) * 100)}%`,
                            background: PALETTE.ash,
                          }}
                        />
                      </div>
                      <span className="omp-bar-value">
                        {v.avgDays}d
                        <span className="omp-muted"> · {v.transitions} moved</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {s?.avgDaysToHire !== null && s?.avgDaysToHire !== undefined && (
                <div className="omp-dash-note">
                  Average time to hire: <strong>{s.avgDaysToHire} days</strong>
                  {s.offerAcceptanceRate !== null && (
                    <> · offer acceptance <strong>{s.offerAcceptanceRate}%</strong></>
                  )}
                </div>
              )}
            </div>
          </div>

          {!!data?.recruiters?.length && (
            <div className="omp-section">
              <div className="omp-section-head">
                <div>
                  <div className="omp-section-title">Recruiter load</div>
                  <div className="omp-section-sub">Openings and outcomes per recruiter</div>
                </div>
              </div>
              <div className="omp-recruiters">
                {data.recruiters.map((r) => (
                  <div className="omp-recruiter" key={r.recruiterId}>
                    <span className="omp-recruiter-avatar" style={{ background: TINT.blue, color: PALETTE.blue }}>
                      <Users size={14} />
                    </span>
                    <div>
                      <div className="omp-recruiter-name">{r.recruiterName ?? r.recruiterId}</div>
                      <div className="omp-recruiter-meta">
                        {r.activeOpenings} active of {r.openings} · {r.applications} applications ·{' '}
                        <strong style={{ color: PALETTE.green }}>{r.joined} hired</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="omp-table-wrap">
            <Table<OpeningMetrics>
              rowKey="openingId"
              size="small"
              columns={columns}
              dataSource={data?.openings.items ?? []}
              scroll={{ x: 1400 }}
              pagination={false}
              onRow={(record) => ({ onClick: () => router.push(`/openings/${record.openingId}`) })}
              locale={{
                emptyText: (
                  <div className="omp-empty">
                    <NoData description="No openings match this filter" />
                  </div>
                ),
              }}
            />
          </div>
        </>
      )}
      </div>

      <div className="omp-footer-bar">
        <Pagination
          current={tablePage}
          total={data?.openings.total ?? 0}
          pageSize={tablePageSize}
          pageSizeOptions={['10', '15', '20', '25', '50', '100']}
          showSizeChanger
          size="small"
          showTotal={(total, range) => `Showing ${range[0]}–${range[1]} of ${total}`}
          onChange={(page, size) => {
            setTablePage(page);
            if (size && size !== tablePageSize) {
              setTablePageSize(size);
              setTablePage(1);
            }
          }}
        />
      </div>

      <style jsx global>{`
        .omp { display: flex; flex-direction: column; min-height: calc(100vh - 60px); flex: 1; }
        .omp-footer-bar {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          padding: 12px 20px;
          margin-top: auto;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.04);
        }
        .omp-footer-bar .ant-pagination {
          width: 100%;
          display: flex;
          align-items: center;
        }
        .omp-footer-bar .ant-pagination-total-text {
          margin-right: auto;
          color: var(--text-slate-500);
          font-size: 13px;
          font-weight: 500;
        }
        .omp-stats-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
        @media (max-width: 1280px) { .omp-stats-7 { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 720px) { .omp-stats-7 { grid-template-columns: repeat(2, 1fr); } }
        .omp-dash-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        @media (max-width: 1024px) { .omp-dash-row { grid-template-columns: 1fr; } }
        .omp-bars { display: flex; flex-direction: column; gap: 10px; }
        .omp-bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
        .omp-bar-label { width: 130px; flex-shrink: 0; color: var(--text-slate-700); font-weight: 600; }
        .omp-bar-track { flex: 1; height: 8px; background: var(--bg-slate-50); border-radius: 4px; overflow: hidden; }
        .omp-bar-fill { height: 100%; border-radius: 4px; }
        .omp-bar-value { width: 170px; text-align: right; font-size: 11.5px; color: var(--text-slate-600); }
        .omp-dash-note {
          margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-slate-100);
          font-size: 12px; color: var(--text-slate-600);
        }
        .omp-recruiters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 1024px) { .omp-recruiters { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .omp-recruiters { grid-template-columns: 1fr; } }
        .omp-recruiter { display: flex; align-items: center; gap: 10px; }
        .omp-recruiter-avatar {
          width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .omp-recruiter-name { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
        .omp-recruiter-meta { font-size: 11px; color: var(--text-slate-500); margin-top: 1px; }
      `}</style>
    </div>
  );
}
