'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import TicketService from '@/services/ticketService';
import {
  Table,
  Tag,
  Button,
  Input,
  App,
  Popconfirm
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HistoryOutlined,
  UndoOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserProjects } from '@/hooks/useGlobalData';
import { useTickets, useBulkUnarchiveTickets } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { Ticket } from '@/services/ticketService';
import { Avatar, Tooltip, Typography, Select } from 'antd';
import TicketLifecycleShell, { ProjectFilterOption } from '@/components/projects/TicketLifecycleShell';


const { Text } = Typography;

const PROJECT_PALETTE = [
  '#0ea5e9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#6366f1', '#ec4899', '#14b8a6', '#a855f7', '#84cc16',
];

export default function TicketsArchivedPage() {
  console.log("Forcing HMR reload for TicketsArchivedPage");
  const { message } = App.useApp();
  const { data: projects } = useUserProjects();
  const { isLoading: authLoading } = useAuth();
  const { canReadTicketArchive, canRestoreTicketArchive, canDeleteTicket } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadTicketArchive) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTicketArchive, router]);

  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: ticketsData, isLoading, refetch, isFetching } = useTickets({
    archivedOnly: true,
    projectId: selectedProject || undefined,
    search: searchText,
    page,
    limit: pageSize
  });

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await TicketService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReload = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), loadStats()]);
      message.success('Archived tickets refreshed');
    } catch (e) {
      message.error('Failed to refresh archived tickets');
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalArchived = ticketsData?.pagination?.total || 0;

  // Build project filter options with archived count per project
  const projectFilterOptions = useMemo<ProjectFilterOption[]>(() => {
    if (!projects) return [];
    return (projects as any[])
      .map((p, i) => {
        const stats = dashboardStats?.projectStats?.find((s: any) => s.id === p.value);
        const archivedCount =
          stats?.statuses?.reduce((acc: number, s: any) => {
            const statusStr = s.status?.toLowerCase() || '';
            if (statusStr === 'completed' || statusStr === 'archived' || statusStr === 'finished') {
              return acc + s.count;
            }
            return acc;
          }, 0) || 0;
        return {
          value: p.value,
          label: p.label,
          code: p.code,
          count: archivedCount,
          color: PROJECT_PALETTE[i % PROJECT_PALETTE.length]
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [dashboardStats, projects]);

  const totalAcrossProjects = useMemo(
    () => projectFilterOptions.reduce((acc, p) => acc + p.count, 0),
    [projectFilterOptions]
  );

  const { mutateAsync: moveToTrash, isPending: isDeleting } = useMoveToTrash();
  const { mutateAsync: bulkRestore, isPending: isRestoring } = useBulkUnarchiveTickets();

  // Tell the BE that any mutations from this page belong to the Archived module.
  useActivitySource({ section: 'WORK', module: 'Archived', page: 'ArchivedView' });

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets to delete');
      return;
    }
    try {
      await moveToTrash(selectedRowKeys as string[]);
      message.success('Tickets moved to trash successfully');
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      console.error('Error moving to trash:', error);
    }
  };

  const handleRestore = async (ids?: string[]) => {
    const targetIds = ids || (selectedRowKeys as string[]);
    if (targetIds.length === 0) {
      message.warning('Please select tickets to restore');
      return;
    }
    try {
      await bulkRestore(targetIds);
      message.success('Tickets restored successfully');
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      console.error('Error restoring tickets:', error);
    }
  };

  const tickets = ticketsData?.data || [];
  const pagination = ticketsData?.pagination;
  const isFiltered = !!(selectedProject || searchText);
  const hasItems = tickets.length > 0;

  const pageStart = totalArchived === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalArchived);
  const pageCount = Math.max(1, Math.ceil(totalArchived / pageSize));

  const columns: ColumnsType<Ticket> = [
    {
      title: 'Ticket',
      key: 'ticket',
      render: (_: any, record: Ticket) => (
        <div className="ar2-ticket-cell">
          <div className="ar2-ticket-meta">
            <span className="ar2-ticket-id">{record.ticketNumber}</span>
            <Text className="ar2-ticket-title">{record.title}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Project',
      key: 'project',
      width: 200,
      render: (_: any, record: Ticket) => {
        const project = typeof record.project === 'object' ? record.project : null;
        return (
          <div className="ar2-project-chip">
            <Tag className="ar2-project-code-tag">{project?.code || 'GLB'}</Tag>
            <Text ellipsis className="ar2-project-name">
              {project?.name || 'Global Repository'}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag className={`ar2-status-tag ${status === 'completed' ? 'green' : 'slate'}`}>
          {status?.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: 180,
      render: (_: any, record: Ticket) => {
        const name = record.assignee?.name || 'Unassigned';
        const isUnassigned = !record.assignee?.name;
        return (
          <div className="ar2-actor-cell">
            <Avatar
              size={24}
              src={record.assignee?.avatarUrl}
              className={`ar2-actor-avatar ${isUnassigned ? 'unassigned' : ''}`}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text className={`ar2-actor-name ${isUnassigned ? 'muted' : ''}`}>{name}</Text>
          </div>
        );
      }
    },
    {
      title: 'Archived',
      dataIndex: 'updatedAt',
      key: 'archivedAt',
      width: 140,
      render: (date: string) => (
        <div className="ar2-date-cell">
          <HistoryOutlined className="ar2-date-icon" />
          <div className="ar2-date-meta">
            <Text className="ar2-date-primary">{dayjs(date).format('MMM D, YYYY')}</Text>
            <Text className="ar2-date-secondary">{dayjs(date).fromNow()}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right',
      fixed: 'right' as const,
      render: (_: any, record: Ticket) => (
        <div className="ar2-action-cell">
          {canRestoreTicketArchive && (
            <Popconfirm
              title="Restore Ticket"
              description="Move this ticket back to active status?"
              onConfirm={() => handleRestore([record.id])}
              okText="Restore"
              cancelText="Cancel"
            >
              <Tooltip title="Restore">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<UndoOutlined />}
                  style={{ color: '#10b981' }}
                  loading={isRestoring && selectedRowKeys.includes(record.id)}
                />
              </Tooltip>
            </Popconfirm>
          )}
          {canDeleteTicket && (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined />}
              title="Delete Ticket?"
              description={`Move ${record.ticketNumber} to trash?`}
              confirmText="Delete"
              cancelText="Cancel"
              placement="bottomRight"
              onConfirm={async () => {
                try {
                  await moveToTrash([record.id]);
                  message.success('Ticket moved to trash successfully');
                  refetch();
                } catch (error) {
                  console.error('Error deleting ticket:', error);
                  message.error('Failed to delete ticket');
                }
              }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={isDeleting && selectedRowKeys.includes(record.id)}
                />
              </Tooltip>
            </ConfirmDialog>
          )}
        </div>
      )
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div
          style={{
            margin: '0 -8px',
            padding: '24px 32px',
            background: 'var(--bg-pure-white)',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <LoadingSpinner message="Loading archived repository..." size="large" fullScreen={false} />
        </div>
      </MainLayout>
    );
  }

  if (!canReadTicketArchive) return null;

  return (
    <MainLayout>
      <TicketLifecycleShell
        eyebrow="Workspace · Archive"
        title="Archived Repository"
        subtitle="Browse completed historical tickets for audit and reporting."
        icon={<FolderOpenOutlined />}
        projects={projectFilterOptions}
        selectedProjectId={selectedProject}
        onSelectProject={setSelectedProject}
        totalCount={totalAcrossProjects}
        activeFilterCount={(selectedProject ? 1 : 0) + (searchText ? 1 : 0)}
        onClearFilters={() => {
          setSelectedProject(null);
          setSearchText('');
        }}
        headerActions={
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={handleReload}
              loading={isRefreshing || isFetching || statsLoading}
              style={{ height: 32, fontWeight: 600 }}
            />
          </Tooltip>
        }
        toolbar={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
            <Input
              placeholder="Search archived tickets…"
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 320, height: 32, borderRadius: 8 }}
            />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-slate-500)' }}>
              <b style={{ color: 'var(--text-slate-900)' }}>{totalArchived}</b>{' '}
              {totalArchived === 1 ? 'ticket' : 'tickets'}
            </span>
            <div style={{ flex: 1 }} />
            {selectedRowKeys.length > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1d4ed8' }}>
                  {selectedRowKeys.length} selected
                </span>
                {canRestoreTicketArchive && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<UndoOutlined />}
                    onClick={() => handleRestore()}
                    loading={isRestoring}
                  >
                    Restore
                  </Button>
                )}
                {canDeleteTicket && (
                  <ConfirmDialog
                    tone="danger"
                    icon={<DeleteOutlined />}
                    title="Move to Trash?"
                    description={`Move ${selectedRowKeys.length} selected ticket(s) to trash?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    placement="bottomRight"
                    onConfirm={handleDelete}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} loading={isDeleting}>
                      Move to Trash
                    </Button>
                  </ConfirmDialog>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedRowKeys([])}
                />
              </div>
            )}
          </div>
        }
        footerSlot={
          totalArchived > 0 ? (
            <>
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{totalArchived}</strong>
                {selectedRowKeys.length > 0 && <span className="pp-footer-sel"> · {selectedRowKeys.length} selected</span>}
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                  .map((p) => (
                    <button key={p} type="button" className={`pp-pager-num ${p === page ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                <button type="button" className="pp-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => { setPageSize(v); setPage(1); }}
                  options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </>
          ) : undefined
        }
      >
        <div style={{ position: 'relative' }}>
          {(isLoading || isFetching || isRefreshing || statsLoading) && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <LoadingSpinner size="medium" fullScreen={false} />
            </div>
          )}
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={false}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys
            }}
            className="ar2-table"

            locale={{
              emptyText: isLoading ? null : (
                <div className="ar2-empty">
                  <div className="ar2-empty-icon">
                    <FolderOpenOutlined />
                  </div>
                  <Text className="ar2-empty-title">
                    {isFiltered ? 'No matching tickets' : 'No archived tickets yet'}
                  </Text>
                  <Text className="ar2-empty-sub">
                    {isFiltered
                      ? 'Try adjusting your filters or search query.'
                      : 'Tickets are automatically archived when sprints are completed.'}
                  </Text>
                  {isFiltered && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchText('');
                        setSelectedProject(null);
                      }}
                      style={{ marginTop: 12 }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )
            }}
            pagination={false}
            scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
          />
        </div>

        <style jsx global>{`
          /* ── Table sized + framed ─────────────────────────── */
          .ar2-table {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 0;
            overflow: hidden;
          }
          .ar2-table .ant-table, .ar2-table .ant-table-wrapper, .ar2-table .ant-table-container, .ar2-table .ant-table-content, .ar2-table .ant-table-header, .ar2-table .ant-table-body {
            background: transparent !important;
            border-radius: 0 !important;
          }
          [data-theme='dark'] .ar2-table {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          .ar2-table .ant-table-thead > tr > th,
          .ar2-table .ant-table-thead > tr > td {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-500) !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            padding: 5px 14px !important;
            border-bottom: 1px solid var(--border-slate-200) !important;
            border-radius: 0 !important;
            border-start-start-radius: 0 !important;
            border-start-end-radius: 0 !important;
          }
          [data-theme='dark'] .ar2-table .ant-table-thead > tr > th,
          [data-theme='dark'] .ar2-table .ant-table-thead > tr > td {
            background: #161B22 !important;
            color: #94A3B8 !important;
            border-bottom-color: #374151 !important;
          }
          .ar2-table .ant-table-thead > tr > th::before { display: none !important; }
          .ar2-table .ant-table-tbody > tr > td {
            padding: 8px 14px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            font-size: 12.5px;
          }
          [data-theme='dark'] .ar2-table .ant-table-tbody > tr > td {
            background: #0B0F1A !important;
            border-bottom-color: #1F2937 !important;
          }
          .ar2-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .ar2-table .ant-table-tbody > tr:hover > td {
            background: #161B22 !important;
          }
          .ar2-table .ant-pagination {
            margin: 12px 0 !important;
            padding: 0 14px;
          }

          /* ── Cells ─────────────────────────────────────────── */
          .ar2-ticket-cell { display: flex; flex-direction: column; }
          .ar2-ticket-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
          .ar2-ticket-id {
            display: inline-block;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 10.5px;
            font-weight: 700;
            color: #1d4ed8;
            background: rgba(59,130,246,0.08);
            border: 1px solid rgba(59,130,246,0.18);
            padding: 1px 6px;
            border-radius: 4px;
            width: fit-content;
            letter-spacing: -0.01em;
          }
          [data-theme='dark'] .ar2-ticket-id {
            background: rgba(59,130,246,0.16);
            border-color: rgba(59,130,246,0.32);
            color: #93c5fd;
          }
          .ar2-ticket-title {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.01em !important;
            line-height: 1.4 !important;
          }
          [data-theme='dark'] .ar2-ticket-title { color: #f1f5f9 !important; }

          .ar2-project-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-slate-50);
            padding: 3px 8px 3px 4px;
            border-radius: 6px;
            border: 1px solid var(--border-slate-200);
            max-width: 100%;
          }
          [data-theme='dark'] .ar2-project-chip {
            background: #111720;
            border-color: #2d3748;
          }
          .ar2-project-code-tag {
            margin: 0 !important;
            font-size: 9.5px !important;
            font-weight: 800 !important;
            background: var(--bg-pure-white) !important;
            border: 1px solid var(--border-slate-200) !important;
            color: #1d4ed8 !important;
            border-radius: 4px !important;
            padding: 0 6px !important;
            letter-spacing: 0.02em !important;
          }
          [data-theme='dark'] .ar2-project-code-tag {
            background: #0f1419 !important;
            border-color: #2d3748 !important;
            color: #93c5fd !important;
          }
          .ar2-project-name {
            font-size: 11.5px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
          }
          [data-theme='dark'] .ar2-project-name { color: #cbd5e1 !important; }

          .ar2-status-tag {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            margin: 0 !important;
            border-radius: 4px !important;
            padding: 1px 6px !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.6;
          }
          .ar2-status-tag.green {
            background: rgba(16,185,129,0.08) !important;
            color: #047857 !important;
            border: 1px solid rgba(16,185,129,0.22) !important;
          }
          .ar2-status-tag.slate {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-600) !important;
            border: 1px solid var(--border-slate-200) !important;
          }
          [data-theme='dark'] .ar2-status-tag.green { color: #34d399 !important; }
          [data-theme='dark'] .ar2-status-tag.slate {
            background: #111720 !important;
            border-color: #2d3748 !important;
            color: #94a3b8 !important;
          }

          .ar2-actor-cell { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
          .ar2-actor-avatar {
            background: #1d4ed8 !important;
            color: #fff !important;
            font-weight: 800 !important;
            font-size: 10px !important;
            flex-shrink: 0;
          }
          .ar2-actor-avatar.unassigned {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-400) !important;
            border: 1px dashed var(--border-slate-200) !important;
          }
          .ar2-actor-name {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .ar2-actor-name.muted {
            color: var(--text-slate-400) !important;
            font-style: italic;
          }
          [data-theme='dark'] .ar2-actor-name { color: #cbd5e1 !important; }

          .ar2-date-cell { display: inline-flex; align-items: center; gap: 8px; }
          .ar2-date-icon { font-size: 11px; color: var(--text-slate-400); }
          .ar2-date-meta { display: flex; flex-direction: column; gap: 1px; }
          .ar2-date-primary {
            font-size: 11.5px !important;
            font-weight: 700 !important;
            color: var(--text-slate-700) !important;
            font-variant-numeric: tabular-nums;
          }
          [data-theme='dark'] .ar2-date-primary { color: #cbd5e1 !important; }
          .ar2-date-secondary {
            font-size: 10.5px !important;
            color: var(--text-slate-400) !important;
            font-weight: 500;
          }

          .ar2-action-cell { display: inline-flex; align-items: center; justify-content: flex-end; gap: 2px; }

          .ar2-empty {
            padding: 56px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
          }
          .ar2-empty-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-400);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            margin-bottom: 6px;
          }
          .ar2-empty-title {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: var(--text-slate-700) !important;
          }
          .ar2-empty-sub {
            font-size: 12px !important;
            color: var(--text-slate-500) !important;
            max-width: 320px;
            line-height: 1.5;
          }

          /* Footer + pager */
          .pp-footer {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
            padding: 0 14px; border-top: 1px solid var(--border-slate-200);
            height: 52px !important;
            box-sizing: border-box;
          }
          .pp-footer--sticky {
            position: sticky; bottom: 0; z-index: 30; margin: 8px -16px -24px; padding: 0 16px;
            background: var(--bg-pure-white);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
            height: 52px !important;
            box-sizing: border-box;
          }
          [data-theme='dark'] .pp-footer--sticky {
            background: #0B0F1A !important;
            border-top: 1px solid #1F2937 !important;
            box-shadow: 0 -4px 14px rgba(0,0,0,0.2);
          }
          [data-theme='dark'] .pp-footer {
            background: #0B0F1A !important;
            border-top-color: #1F2937 !important;
          }
          .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
          [data-theme='dark'] .pp-footer-info { color: #94a3b8; }
          .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          [data-theme='dark'] .pp-footer-info strong { color: #cbd5e1; }
          .pp-footer-sel { color: #3B82F6; font-weight: 600; }
          .pp-pager { display: flex; align-items: center; gap: 3px; }
          .pp-pager-btn, .pp-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          }
          [data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num {
            background: #161B22 !important; border-color: #1F2937 !important; color: #94A3B8 !important;
          }
          .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
          .pp-pagesize { margin-left: 5px; }
          .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
          [data-theme='dark'] .pp-pagesize .ant-select-selector {
            background: #161B22 !important; border-color: #1F2937 !important; color: #94A3B8 !important;
          }
        `}</style>
      </TicketLifecycleShell>
    </MainLayout>
  );
}
