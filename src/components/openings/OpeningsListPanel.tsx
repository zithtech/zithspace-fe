'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Table, Tooltip, Empty } from 'antd';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { ColumnsType } from 'antd/es/table';
import {
  Briefcase,
  Plus,
  RotateCw,
  Trash2,
  Users,
  ArchiveRestore,
  FileEdit,
  Clock,
  Megaphone,
  UserCheck,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Archive,
  Layers,
  AlertCircle,
  FileText,
} from 'lucide-react';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { FilterBar, FilterToggleButton, TicketFilterPill, initialsFor } from '@/components/common/FilterBar';
import { usePermission } from '@/hooks/usePermission';
import OpeningV2Service, {
  type OpeningListItem,
  type OpeningStatus,
  type OpeningPriority,
  type EmploymentType,
} from '@/services/openingV2Service';
import {
  EMPLOYMENT_TYPE_LABELS,
  OpeningStyles,
  PALETTE,
  PanelHeader,
  PriorityChip,
  STATUS_META,
  STATUS_ORDER,
  StatusChip,
  StatCards,
  TINT,
  WORK_MODE_LABELS,
  experienceRange,
  fmtDate,
  salaryRange,
  tablePaginationConfig,
} from './ui';
import { useReferenceData } from './useReferenceData';
import OpeningFormDrawer from './OpeningFormDrawer';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

// The working list of openings. `archived` is a prop rather than a filter here
// so the Archive page can reuse this panel wholesale — the two views differ only
// in which slice of the data they show and which actions make sense.
export default function OpeningsListPanel({
  archived = false,
}: {
  archived?: boolean;
}) {
  const { message } = App.useApp();

  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;
  const reference = useReferenceData();

  const [rows, setRows] = useState<OpeningListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<OpeningStatus[]>([]);
  const [priority, setPriority] = useState<OpeningPriority[]>([]);
  const [employmentType, setEmploymentType] = useState<EmploymentType[]>([]);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [recruiters, setRecruiters] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});

  // Typing in the search box should not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await OpeningV2Service.list({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: status.length ? status : undefined,
        priority: priority.length ? priority : undefined,
        employmentType: employmentType.length ? employmentType : undefined,
        departmentId: departmentId || undefined,
        recruiters: recruiters.length ? recruiters : undefined,
        experience: experience.length ? experience : undefined,
        jobTitles: jobTitles.length ? jobTitles : undefined,
        archived: archived ? 'only' : 'exclude',
      });
      setRows(res.items);
      setTotal(res.total);

      // Same `archived` slice as the list, so the tiles and the table can never
      // disagree about what they are counting.
      OpeningV2Service.statusSummary(archived ? 'only' : 'exclude')
        .then(setSummary)
        .catch(() => setSummary({}));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load openings');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, priority, employmentType, departmentId, recruiters, experience, jobTitles, archived]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await OpeningV2Service.remove(id);
      message.success('Opening deleted');
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not delete the opening');
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await OpeningV2Service.unarchive(id);
      message.success('Opening restored from the archive');
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not un-archive the opening');
    }
  };

  const columns: ColumnsType<OpeningListItem> = useMemo(() => {
    const base: ColumnsType<OpeningListItem> = [
      {
        title: 'Code',
        dataIndex: 'openingCode',
        width: 100,
        render: (code: string) => <span className="omp-code">{code}</span>,
      },
      {
        title: 'Opening',
        dataIndex: 'jobTitle',
        width: 260,
        render: (_: any, r) => (
          <div className="omp-title-cell">
            <span className="omp-title-main">{r.jobTitle}</span>
            <span className="omp-title-sub">
              {[r.departmentName, r.clientName].filter(Boolean).join(' · ') || '—'}
            </span>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 140,
        render: (s: OpeningStatus) => (
          <Tooltip title={STATUS_META[s]?.hint}>
            <span>
              <StatusChip status={s} />
            </span>
          </Tooltip>
        ),
      },
      {
        title: 'Priority',
        dataIndex: 'priority',
        width: 96,
        render: (p: OpeningPriority) => <PriorityChip priority={p} />,
      },
      {
        title: 'Positions',
        dataIndex: 'numberOfPositions',
        width: 84,
        align: 'center',
        render: (n: number) => <strong>{n}</strong>,
      },
      {
        title: 'Type',
        dataIndex: 'employmentType',
        width: 150,
        render: (_: any, r) => (
          <span>
            {EMPLOYMENT_TYPE_LABELS[r.employmentType] ?? r.employmentType}
            <span className="omp-muted"> · {WORK_MODE_LABELS[r.workMode] ?? r.workMode}</span>
          </span>
        ),
      },
      {
        title: 'Experience',
        width: 110,
        render: (_: any, r) => experienceRange(r.minExperience, r.maxExperience),
      },
      {
        title: 'Salary',
        width: 160,
        render: (_: any, r) =>
          salaryRange(r.salaryMin, r.salaryMax, r.salaryCurrency, r.salaryPeriod),
      },
      {
        title: 'Recruiters',
        width: 170,
        render: (_: any, r) => {
          if (!r.recruiters?.length) return <span className="omp-muted">Unassigned</span>;
          const primary = r.recruiters.find((x) => x.isPrimary) ?? r.recruiters[0];
          const extra = r.recruiters.length - 1;
          return (
            <span>
              {primary.recruiterName ?? '—'}
              {extra > 0 && <span className="omp-muted"> +{extra}</span>}
            </span>
          );
        },
      },
      {
        title: 'Hiring Manager',
        dataIndex: 'hiringManagerName',
        width: 150,
        render: (v: string | null) => v ?? <span className="omp-muted">—</span>,
      },
      {
        title: archived ? 'Archived' : 'Created',
        width: 110,
        render: (_: any, r) => fmtDate(archived ? r.archivedAt : r.createdAt),
      },
    ];

    const actions: ColumnsType<OpeningListItem> = [
      {
        title: '',
        key: 'actions',
        width: 56,
        fixed: 'right',
        onCell: () => ({
          // The row navigates on click; the actions cell must not. Stopping at the
          // <td> covers the padding around the buttons too, which a wrapper <div>
          // does not — a click landing there used to navigate instead of acting.
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
        }),
        render: (_: any, r) => (
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
            {archived
              ? perms.canManageOpenings && (
                <Tooltip title="Restore from archive">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArchiveRestore size={14} />}
                    onClick={() => handleUnarchive(r.id)}
                  />
                </Tooltip>
              )
              : perms.canDeleteOpening && (
                <ConfirmDialog
                  tone="danger"
                  icon={<Trash2 size={18} />}
                  title="Delete this opening?"
                  description="It will be removed from the list."
                  confirmText="Delete"
                  onConfirm={() => handleDelete(r.id)}
                >
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                    />
                  </Tooltip>
                </ConfirmDialog>
              )}
          </div>
        ),
      },
    ];

    return [...base, ...actions];
  }, [archived, perms.canDeleteOpening, perms.canManageOpenings]);

  const activeFilters =
    status.length + priority.length + employmentType.length + recruiters.length + experience.length + jobTitles.length + (departmentId ? 1 : 0);

  /**
   * Tiles are derived from the status summary and differ by view: the working
   * list cares about what is in flight, the archive about how things ended.
   */
  const tiles = useMemo(() => {
    const n = (...keys: OpeningStatus[]) =>
      keys.reduce((sum, k) => sum + (summary[k] ?? 0), 0);

    if (archived) {
      return [
        { label: 'Archived', value: Object.values(summary).reduce((a, b) => a + b, 0), tone: 'ash' as const, icon: <Archive size={17} />, statuses: [] as OpeningStatus[] },
        { label: 'Filled', value: n('filled'), tone: 'green' as const, icon: <CheckCircle2 size={17} />, statuses: ['filled'] as OpeningStatus[] },
        { label: 'Closed', value: n('closed'), tone: 'ash' as const, icon: <Archive size={17} />, statuses: ['closed'] as OpeningStatus[] },
        { label: 'Cancelled', value: n('cancelled'), tone: 'red' as const, icon: <XCircle size={17} />, statuses: ['cancelled'] as OpeningStatus[] },
        { label: 'On hold', value: n('on_hold'), tone: 'ash' as const, icon: <PauseCircle size={17} />, statuses: ['on_hold'] as OpeningStatus[] },
      ];
    }

    return [
      {
        label: 'Active',
        value: n('approved', 'internal_posting', 'external_posting', 'in_progress'),
        tone: 'blue' as const,
        icon: <Briefcase size={17} />,
        statuses: ['approved', 'internal_posting', 'external_posting', 'in_progress'] as OpeningStatus[],
      },
      { label: 'Drafts', value: n('draft'), tone: 'ash' as const, icon: <FileEdit size={17} />, statuses: ['draft'] as OpeningStatus[] },
      { label: 'Awaiting approval', value: n('pending_approval'), tone: 'blue' as const, icon: <Clock size={17} />, statuses: ['pending_approval'] as OpeningStatus[] },
      {
        label: 'Posted',
        value: n('internal_posting', 'external_posting'),
        tone: 'blue' as const,
        icon: <Megaphone size={17} />,
        statuses: ['internal_posting', 'external_posting'] as OpeningStatus[],
      },
      { label: 'Interviewing', value: n('in_progress'), tone: 'green' as const, icon: <UserCheck size={17} />, statuses: ['in_progress'] as OpeningStatus[] },
    ];
  }, [summary, archived]);

  return (
    <div className="omp">
      <OpeningStyles />

      <PanelHeader
        icon={<Briefcase size={17} />}
        color={archived ? PALETTE.ash : PALETTE.blue}
        tint={archived ? TINT.ash : TINT.blue}
        title={archived ? 'Archive' : 'Openings'}
        subtitle={
          archived
            ? 'Closed and cancelled openings, kept for the record'
            : 'Job requisitions and their hiring pipeline'
        }
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search code, title or location…"
      >
        <FilterToggleButton
          isOpen={isFilterRowOpen}
          onToggle={() => setIsFilterRowOpen(!isFilterRowOpen)}
          activeCount={activeFilters}
        />
        <Tooltip title="Refresh">
          <Button icon={<RotateCw size={14} />} onClick={load} loading={loading} />
        </Tooltip>
        {!archived && perms.canCreateOpening && (
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New Opening
          </Button>
        )}
      </PanelHeader>

      <StatCards
        title={archived ? 'Archive Overview' : 'Openings Overview'}
        statusText="ACTIVE"
        progressPct={(() => {
          const totalOpenings = Object.values(summary).reduce((a, b) => a + Number(b || 0), 0) || total;
          const activeOpenings = (summary.approved || 0) + (summary.internal_posting || 0) + (summary.external_posting || 0) + (summary.in_progress || 0) + (summary.filled || 0);
          return totalOpenings > 0 ? Math.round(((archived ? (summary.filled || 0) : activeOpenings) / totalOpenings) * 100) : 0;
        })()}
        cells={tiles.map((tile) => ({
          label: tile.label,
          value: tile.value,
          icon: tile.icon,
          color: PALETTE[tile.tone],
          tint: TINT[tile.tone],
        }))}
      />

      {isFilterRowOpen && (
        <FilterBar
          activeCount={activeFilters}
          onReset={() => {
            setStatus([]);
            setPriority([]);
            setEmploymentType([]);
            setDepartmentId(null);
            setRecruiters([]);
            setExperience([]);
            setJobTitles([]);
            setPage(1);
          }}
          onClose={() => setIsFilterRowOpen(false)}
          actions={
            <span className="omp-filter-count" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-slate-500)' }}>
              {total} opening{total === 1 ? '' : 's'}
            </span>
          }
        >
          <TicketFilterPill
            label="Status"
            icon={<CheckCircle2 size={14} />}
            values={status}
            multiple
            options={STATUS_ORDER.map((s) => ({
              value: s,
              label: STATUS_META[s].label,
              dotColor: STATUS_META[s].tone === 'blue' ? '#3b82f6' : STATUS_META[s].tone === 'green' ? '#10b981' : STATUS_META[s].tone === 'red' ? '#ef4444' : '#64748b',
            }))}
            onChange={(v) => {
              setStatus(Array.isArray(v) ? (v as OpeningStatus[]) : v ? [v as OpeningStatus] : []);
              setPage(1);
            }}
          />

          <TicketFilterPill
            label="Priority"
            icon={<AlertCircle size={14} />}
            values={priority}
            multiple
            options={[
              { value: 'critical', label: 'Critical', dotColor: '#ef4444' },
              { value: 'high', label: 'High', dotColor: '#3b82f6' },
              { value: 'medium', label: 'Medium', dotColor: '#64748b' },
              { value: 'low', label: 'Low', dotColor: '#94a3b8' },
            ]}
            onChange={(v) => {
              setPriority(Array.isArray(v) ? (v as OpeningPriority[]) : v ? [v as OpeningPriority] : []);
              setPage(1);
            }}
          />

          <TicketFilterPill
            label="Employment Type"
            icon={<Briefcase size={14} />}
            values={employmentType}
            multiple
            options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(v) => {
              setEmploymentType(Array.isArray(v) ? (v as EmploymentType[]) : v ? [v as EmploymentType] : []);
              setPage(1);
            }}
          />

          <TicketFilterPill
            label="Department"
            icon={<Layers size={14} />}
            value={departmentId || undefined}
            options={reference.departments.map((d) => ({
              value: String(d.value),
              label: d.label,
            }))}
            onChange={(v) => {
              setDepartmentId(Array.isArray(v) ? v[0] : (v || null));
              setPage(1);
            }}
          />

          <TicketFilterPill
            label="Recruiters"
            icon={<Users size={14} />}
            values={recruiters}
            multiple
            showAvatar
            options={reference.people.map((p) => ({
              value: String(p.value),
              label: p.label,
            }))}
            onChange={(v) => {
              setRecruiters(Array.isArray(v) ? v : v ? [v] : []);
              setPage(1);
            }}
          />

          <TicketFilterPill
            label="Experience"
            icon={<Clock size={14} />}
            values={experience}
            multiple
            options={[
              { label: '0 - 2 Years', value: '0-2' },
              { label: '3 - 5 Years', value: '3-5' },
              { label: '5+ Years', value: '5+' },
            ]}
            onChange={(v) => {
              setExperience(Array.isArray(v) ? v : v ? [v] : []);
              setPage(1);
            }}
          />

          <TicketFilterPill
            label="Position"
            icon={<FileText size={14} />}
            values={jobTitles}
            multiple
            options={Array.from(new Set([...rows.map((r) => r.jobTitle), ...jobTitles]))
              .filter(Boolean)
              .map((t) => ({ label: t, value: t }))}
            onChange={(v) => {
              setJobTitles(Array.isArray(v) ? v : v ? [v] : []);
              setPage(1);
            }}
          />
        </FilterBar>
      )}

      <div className="opn-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
          <Table<OpeningListItem>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={rows}
            scroll={{ x: 1500 }}
            onRow={(record) => ({
              onClick: () => router.push(`/openings/${record.id}`),
            })}
            locale={{
              emptyText: (
                <div className="omp-empty">
                  <NoData description={
                                              <>
                                                <div className="omp-empty-title">
                                                  {archived ? 'Nothing archived yet' : 'No openings yet'}
                                                </div>
                                                <div className="omp-empty-sub">
                                                  {archived
                                                    ? 'Closed openings land here once they are archived.'
                                                    : 'Create a requisition to start hiring.'}
                                                </div>
                                              </>
                                            } />
                </div>
              ),
            }}
            pagination={{
              ...tablePaginationConfig,
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </ZukvoLoadingOverlay>
      </div>

      <style jsx global>{`
        .omp-stats-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        @media (max-width: 1200px) { .omp-stats-5 { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px) { .omp-stats-5 { grid-template-columns: repeat(2, 1fr); } }
        .omp-stat-btn {
          text-align: left; cursor: pointer; font: inherit;
          transition: border-color .12s ease, background .12s ease;
        }
        .omp-stat-btn:hover { border-color: ${PALETTE.blue}66; background: var(--bg-slate-50); }
        .omp-stat-btn.is-on {
          border-color: ${PALETTE.blue}; background: ${TINT.blue};
        }
        .omp-stat-btn .omp-stat-body { display: flex; flex-direction: column; }
      `}</style>

      <OpeningFormDrawer
        open={formOpen}
        openingId={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(opening) => {
          setFormOpen(false);
          load();
          if (!editing) router.push(`/openings/${opening.id}`);
        }}
      />
    </div>
  );
}
