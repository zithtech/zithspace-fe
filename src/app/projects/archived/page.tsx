'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import TicketService from '@/services/ticketService';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Input,
  Select,
  App,
  Badge,
  Popconfirm,
  Spin,
} from 'antd';
import dayjs from 'dayjs';
import {
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ProjectOutlined,
  InboxOutlined,
  FilterOutlined,
  CloseOutlined,
  DatabaseFilled,
  CheckCircleFilled,
  AppstoreFilled,
  HistoryOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserProjects } from '@/hooks/useGlobalData';
import { useTickets } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { Ticket } from '@/services/ticketService';
import { Avatar, Tooltip } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ArchivedTicketsPage() {
  const { message } = App.useApp();
  const { data: projects } = useUserProjects();
  const { isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadProject, router]);

  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: ticketsData, isLoading, refetch, isFetching } = useTickets({
    archivedOnly: true,
    projectId: selectedProject,
    search: searchText,
    page,
    limit: pageSize,
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

  const projectStats = useMemo(() => {
    if (!dashboardStats?.projectStats || !projects) return [];

    return projects
      .map((p: any) => {
        const stats = dashboardStats.projectStats.find((s: any) => s.id === p.value);
        const archivedCount =
          stats?.statuses?.reduce((acc: number, s: any) => {
            const statusStr = s.status?.toLowerCase() || '';
            if (statusStr === 'completed' || statusStr === 'archived' || statusStr === 'finished') {
              return acc + s.count;
            }
            return acc;
          }, 0) || 0;

        return {
          id: p.value,
          code: p.code,
          name: p.label,
          count: archivedCount,
        };
      })
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [dashboardStats, projects]);

  const completedTotal = useMemo(() => {
    return projectStats.reduce((acc, p) => acc + p.count, 0);
  }, [projectStats]);

  const activeProjects = projectStats.length;

  const { mutateAsync: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets to delete');
      return;
    }

    try {
      await moveToTrash(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      console.error('Error moving to trash:', error);
    }
  };

  const tickets = ticketsData?.data || [];
  const pagination = ticketsData?.pagination;
  const isFiltered = !!(selectedProject || searchText);
  const hasItems = tickets.length > 0;

  const columns: ColumnsType<Ticket> = [
    {
      title: 'Ticket',
      key: 'ticket',
      render: (_: any, record: Ticket) => (
        <div className="ar-ticket-cell">
          <span className="ar-row-rail" />
          <div className="ar-ticket-meta">
            <span className="ar-ticket-id">{record.ticketNumber}</span>
            <Text className="ar-ticket-title">{record.title}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Project',
      key: 'project',
      width: 220,
      render: (_: any, record: Ticket) => {
        const project = typeof record.project === 'object' ? record.project : null;
        return (
          <div className="ar-project-chip">
            <Tag className="ar-project-code-tag">{project?.code || 'GLB'}</Tag>
            <Text ellipsis className="ar-project-name">
              {project?.name || 'Global Repository'}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag className={`ar-status-tag ${status === 'completed' ? 'green' : 'slate'}`}>
          {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => {
        const tone = priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'amber' : 'green';
        return (
          <div className={`ar-priority-pill ${tone}`}>
            <span className="ar-priority-dot" />
            <Text className="ar-priority-text">{priority}</Text>
          </div>
        );
      },
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: 200,
      render: (_: any, record: Ticket) => {
        const name = record.assignee?.name || 'Unassigned';
        const isUnassigned = !record.assignee?.name;
        return (
          <div className="ar-actor-cell">
            <Avatar
              size={28}
              src={record.assignee?.avatarUrl}
              className={`ar-actor-avatar ${isUnassigned ? 'unassigned' : ''}`}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text className={`ar-actor-name ${isUnassigned ? 'muted' : ''}`}>{name}</Text>
          </div>
        );
      },
    },
    {
      title: 'Archived',
      dataIndex: 'updatedAt',
      key: 'archivedAt',
      width: 160,
      render: (date) => (
        <div className="ar-date-cell">
          <HistoryOutlined className="ar-date-icon" />
          <div className="ar-date-meta">
            <Text className="ar-date-primary">{dayjs(date).format('MMM D, YYYY')}</Text>
            <Text className="ar-date-secondary">{dayjs(date).fromNow()}</Text>
          </div>
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div
          style={{
            margin: '0 -24px',
            padding: '24px 32px',
            background: 'var(--bg-pure-white)',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spin size="large" tip="Orchestrating archived repository..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadProject) {
    return null;
  }

  return (
    <MainLayout>
      <div className="ar-page">
        {/* Hero */}
        <div className="ar-hero">
          <div className="ar-hero-glow" />
          <div className="ar-hero-inner">
            <div className="ar-hero-left">
              <div className="ar-hero-badge">
                <FolderOpenOutlined />
              </div>
              <div className="ar-hero-text">
                <div className="ar-hero-eyebrow">
                  <span className="ar-hero-eyebrow-dot" />
                  <span>WORKSPACE / ARCHIVE</span>
                </div>
                <Title level={3} className="ar-hero-title">
                  Archived Repository
                </Title>
                <Text className="ar-hero-sub">
                  Browse completed historical tickets for audit and reporting.
                </Text>
              </div>
            </div>

            <div className="ar-hero-actions">
              <Tooltip title="Refresh">
                <Button
                  type="text"
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={handleReload}
                  loading={isRefreshing || isFetching || statsLoading}
                  className="ar-hero-ghost"
                />
              </Tooltip>
            </div>
          </div>

          {/* Stat Strip */}
          <div className="ar-stat-strip">
            <div className="ar-stat">
              <div className="ar-stat-icon blue">
                <InboxOutlined />
              </div>
              <div className="ar-stat-body">
                <Text className="ar-stat-label">Archived Tickets</Text>
                <div className="ar-stat-value">
                  {totalArchived}
                  <span className="ar-stat-unit">in view</span>
                </div>
              </div>
            </div>

            <div className="ar-stat-divider" />

            <div className="ar-stat">
              <div className="ar-stat-icon green">
                <CheckCircleFilled />
              </div>
              <div className="ar-stat-body">
                <Text className="ar-stat-label">Completed</Text>
                <div className="ar-stat-value">
                  {completedTotal}
                  <span className="ar-stat-unit">across projects</span>
                </div>
              </div>
            </div>

            <div className="ar-stat-divider" />

            <div className="ar-stat">
              <div className="ar-stat-icon violet">
                <AppstoreFilled />
              </div>
              <div className="ar-stat-body">
                <Text className="ar-stat-label">Active Projects</Text>
                <div className="ar-stat-value">
                  {activeProjects}
                  <span className="ar-stat-unit">contributing</span>
                </div>
              </div>
            </div>

            <div className="ar-stat-divider" />

            <div className="ar-stat">
              <div className="ar-stat-icon slate">
                <DatabaseFilled />
              </div>
              <div className="ar-stat-body">
                <Text className="ar-stat-label">Storage Status</Text>
                <div className="ar-stat-value">
                  Healthy
                  <span className="ar-stat-unit">retention OK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="ar-body">
          {/* Control bar */}
          <div className="ar-control-bar">
            <div className="ar-filter-cluster">
              <div className="ar-filter-label">
                <FilterOutlined />
                <span>Filters</span>
                {isFiltered && (
                  <Badge
                    count={(selectedProject ? 1 : 0) + (searchText ? 1 : 0)}
                    color="#3b82f6"
                    size="small"
                  />
                )}
              </div>

              <div className={`ar-filter-field ${selectedProject ? 'active' : ''}`}>
                <ProjectOutlined className="ar-filter-icon" />
                <Select
                  placeholder="All projects"
                  variant="borderless"
                  className="ar-filter-select"
                  allowClear
                  value={selectedProject}
                  onChange={(val) => setSelectedProject(val)}
                  loading={statsLoading}
                  popupMatchSelectWidth={320}
                >
                  {projects?.map((project: any) => {
                    const pStats = projectStats.find((s: any) => s.id === project.value);
                    return (
                      <Option key={project.value} value={project.value} label={project.label}>
                        <div className="ar-project-option">
                          <Text className="ar-project-option-label">{project.label}</Text>
                          <Tag className="ar-count-tag">{pStats?.count || 0}</Tag>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </div>

              <div className={`ar-filter-field ar-filter-search ${searchText ? 'active' : ''}`}>
                <SearchOutlined className="ar-filter-icon" />
                <Input
                  placeholder="Search archived tickets…"
                  variant="borderless"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>

              {isFiltered && (
                <Button
                  size="small"
                  type="text"
                  className="ar-filter-reset"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setSelectedProject(undefined);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="ar-result-count">
              <Text className="ar-result-count-text">
                <strong>{totalArchived}</strong> {totalArchived === 1 ? 'ticket' : 'tickets'}
              </Text>
            </div>
          </div>

          {/* Bulk action belt */}
          {selectedRowKeys.length > 0 && (
            <div className="ar-bulk-belt">
              <div className="ar-bulk-left">
                <span className="ar-bulk-count-pill">{selectedRowKeys.length}</span>
                <Text className="ar-bulk-label">
                  {selectedRowKeys.length === 1 ? 'ticket' : 'tickets'} selected
                </Text>
              </div>
              <div className="ar-bulk-actions">
                <Popconfirm
                  title="Move to Trash"
                  description={`Move ${selectedRowKeys.length} ticket${
                    selectedRowKeys.length === 1 ? '' : 's'
                  } to trash?`}
                  onConfirm={handleDelete}
                  okText="Move to Trash"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={isDeleting}
                    className="ar-bulk-btn purge"
                  >
                    Move to Trash
                  </Button>
                </Popconfirm>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedRowKeys([])}
                  className="ar-bulk-btn cancel"
                />
              </div>
            </div>
          )}

          <Card styles={{ body: { padding: 0 } }} className="ar-table-card">
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              loading={isLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              className="ar-table"
              locale={{
                emptyText: isLoading ? null : (
                  <div className="ar-empty">
                    <div className="ar-empty-icon">
                      <FolderOpenOutlined />
                    </div>
                    <Text className="ar-empty-title">
                      {isFiltered ? 'No matching tickets' : 'No archived tickets yet'}
                    </Text>
                    <Text className="ar-empty-sub">
                      {isFiltered
                        ? 'Try adjusting your filters or search query.'
                        : 'Tickets are automatically archived when sprints are completed.'}
                    </Text>
                    {isFiltered && (
                      <Button
                        size="small"
                        onClick={() => {
                          setSearchText('');
                          setSelectedProject(undefined);
                        }}
                        className="ar-empty-action"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ),
              }}
              pagination={
                hasItems
                  ? {
                      current: page,
                      pageSize,
                      total: pagination?.total || 0,
                      showSizeChanger: true,
                      showTotal: (total, range) => (
                        <Text className="ar-pagination-total">
                          Showing {range[0]}–{range[1]} of {total}
                        </Text>
                      ),
                      onChange: (newPage, newPageSize) => {
                        setPage(newPage);
                        setPageSize(newPageSize);
                      },
                      style: { padding: '16px 24px', margin: 0 },
                    }
                  : false
              }
              scroll={{ x: 1200 }}
            />
          </Card>
        </div>

        <style jsx global>{`
          /* ── Page ────────────────────────────────────────────── */
          .ar-page {
            margin: 0 -24px;
            padding: 0 24px 32px;
            background: var(--bg-pure-white);
            min-height: calc(100vh - 64px);
          }

          /* ── Hero ────────────────────────────────────────────── */
          .ar-hero {
            position: relative;
            margin: 0 -24px 20px;
            padding: 14px 48px 0;
            background:
              linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0) 60%),
              var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-200);
            overflow: hidden;
          }
          [data-theme='dark'] .ar-hero {
            background:
              linear-gradient(180deg, rgba(59, 130, 246, 0.07) 0%, rgba(59, 130, 246, 0) 60%),
              var(--bg-pure-white);
            border-bottom-color: #1f2937;
          }
          .ar-hero-glow {
            position: absolute;
            top: -160px;
            right: -80px;
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
          }
          [data-theme='dark'] .ar-hero-glow {
            background: radial-gradient(circle, rgba(59, 130, 246, 0.16) 0%, transparent 70%);
          }
          .ar-hero-inner {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 14px;
          }
          .ar-hero-left {
            display: flex;
            gap: 14px;
            align-items: center;
          }
          .ar-hero-badge {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
            border: 1px solid rgba(59, 130, 246, 0.2);
            color: #3b82f6;
            font-size: 16px;
            box-shadow: 0 6px 16px -8px rgba(59, 130, 246, 0.3);
            flex-shrink: 0;
          }
          [data-theme='dark'] .ar-hero-badge {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.20), rgba(59, 130, 246, 0.06));
            border-color: rgba(59, 130, 246, 0.30);
          }
          .ar-hero-text {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .ar-hero-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: var(--text-slate-500);
            padding: 3px 8px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            border-radius: 4px;
          }
          [data-theme='dark'] .ar-hero-eyebrow {
            background: #1f2937;
            border-color: #374151;
          }
          .ar-hero-eyebrow-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
          }
          .ar-hero-title {
            margin: 0 !important;
            font-weight: 700 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.02em !important;
            font-size: 16px !important;
            line-height: 1.2 !important;
          }
          .ar-hero-sub {
            font-size: 12px;
            color: var(--text-slate-500);
            line-height: 1.4;
            padding-left: 12px;
            border-left: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .ar-hero-sub {
            border-left-color: #1f2937;
          }
          .ar-hero-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .ar-hero-ghost {
            height: 30px !important;
            width: 30px !important;
            border-radius: 6px !important;
            color: var(--text-slate-500) !important;
            border: 1px solid var(--border-slate-200) !important;
          }
          .ar-hero-ghost:hover {
            color: var(--text-slate-900) !important;
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .ar-hero-ghost {
            border-color: #1f2937 !important;
          }
          [data-theme='dark'] .ar-hero-ghost:hover {
            background: #1f2937 !important;
          }

          /* ── Stat Strip ──────────────────────────────────────── */
          .ar-stat-strip {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
            align-items: center;
            gap: 0;
            padding: 12px 0;
            border-top: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .ar-stat-strip {
            border-top-color: #1f2937;
          }
          .ar-stat {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 16px;
            min-width: 0;
          }
          .ar-stat:first-child {
            padding-left: 0;
          }
          .ar-stat-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            flex-shrink: 0;
          }
          .ar-stat-icon.slate {
            background: var(--bg-slate-50);
            color: var(--text-slate-500);
            border: 1px solid var(--border-slate-200);
          }
          .ar-stat-icon.green {
            background: rgba(16, 185, 129, 0.08);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .ar-stat-icon.blue {
            background: rgba(59, 130, 246, 0.08);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          .ar-stat-icon.violet {
            background: rgba(139, 92, 246, 0.08);
            color: #8b5cf6;
            border: 1px solid rgba(139, 92, 246, 0.2);
          }
          [data-theme='dark'] .ar-stat-icon.slate {
            background: #1f2937;
            border-color: #374151;
            color: #94a3b8;
          }
          [data-theme='dark'] .ar-stat-icon.green {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.25);
          }
          [data-theme='dark'] .ar-stat-icon.blue {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.25);
          }
          [data-theme='dark'] .ar-stat-icon.violet {
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.25);
          }
          .ar-stat-body {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }
          .ar-stat-label {
            font-size: 10px !important;
            font-weight: 600 !important;
            color: var(--text-slate-500) !important;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .ar-stat-value {
            font-size: 17px;
            font-weight: 700;
            color: var(--text-slate-900);
            letter-spacing: -0.02em;
            line-height: 1.1;
            display: flex;
            align-items: baseline;
            gap: 6px;
            font-variant-numeric: tabular-nums;
          }
          .ar-stat-unit {
            font-size: 10px;
            font-weight: 500;
            color: var(--text-slate-400);
            text-transform: none;
            letter-spacing: 0;
          }
          .ar-stat-divider {
            width: 1px;
            height: 28px;
            background: var(--border-slate-200);
          }
          [data-theme='dark'] .ar-stat-divider {
            background: #1f2937;
          }

          /* ── Body ────────────────────────────────────────────── */
          .ar-body {
            padding: 0;
          }

          /* ── Control bar ─────────────────────────────────────── */
          .ar-control-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
          }
          .ar-filter-cluster {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            border-radius: 10px;
          }
          [data-theme='dark'] .ar-filter-cluster {
            background: #0f1620;
            border-color: #1f2937;
          }
          .ar-filter-label {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 10px 0 8px;
            height: 32px;
            font-size: 11px;
            font-weight: 700;
            color: var(--text-slate-500);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-right: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .ar-filter-label {
            border-right-color: #1f2937;
          }
          .ar-filter-field {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 32px;
            padding: 0 10px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 7px;
            transition: all 0.15s ease;
          }
          .ar-filter-field:hover {
            border-color: var(--border-slate-200);
          }
          .ar-filter-field.active {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
          }
          [data-theme='dark'] .ar-filter-field {
            background: #161b22;
            border-color: #1f2937;
          }
          [data-theme='dark'] .ar-filter-field:hover {
            border-color: #374151;
          }
          [data-theme='dark'] .ar-filter-field.active {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
          }
          .ar-filter-icon {
            font-size: 12px;
            color: var(--text-slate-400);
          }
          .ar-filter-field.active .ar-filter-icon {
            color: #3b82f6;
          }
          .ar-filter-search {
            width: 280px;
          }
          .ar-filter-search .ant-input {
            font-size: 12px;
            font-weight: 500;
            padding: 0;
          }
          .ar-filter-select {
            width: 200px;
          }
          .ar-filter-select .ant-select-selector {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            height: 30px !important;
          }
          .ar-filter-select .ant-select-selection-item,
          .ar-filter-select .ant-select-selection-placeholder {
            font-size: 12px !important;
            font-weight: 500 !important;
            line-height: 30px !important;
          }
          .ar-project-option {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            gap: 12px;
          }
          .ar-project-option-label {
            font-size: 12px !important;
            font-weight: 600 !important;
          }
          .ar-count-tag {
            margin: 0;
            font-size: 10px;
            font-weight: 700;
            background: var(--bg-slate-100);
            border: none;
            color: var(--text-slate-600);
          }
          [data-theme='dark'] .ar-count-tag {
            background: #374151;
            color: #94a3b8;
          }
          .ar-filter-reset {
            height: 32px !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
            font-size: 11px !important;
            border-radius: 6px !important;
          }
          .ar-filter-reset:hover {
            color: #ef4444 !important;
            background: rgba(239, 68, 68, 0.06) !important;
          }
          .ar-result-count-text {
            font-size: 12px !important;
            color: var(--text-slate-500) !important;
            font-weight: 500;
          }
          .ar-result-count-text strong {
            color: var(--text-slate-900);
            font-weight: 700;
          }

          /* ── Bulk action belt ────────────────────────────────── */
          .ar-bulk-belt {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(59, 130, 246, 0.02));
            padding: 8px 14px 8px 12px;
            border-radius: 10px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            animation: arSlideDown 0.2s ease-out;
          }
          [data-theme='dark'] .ar-bulk-belt {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
            border-color: rgba(59, 130, 246, 0.3);
          }
          @keyframes arSlideDown {
            from { transform: translateY(-4px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .ar-bulk-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .ar-bulk-count-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 26px;
            height: 26px;
            padding: 0 8px;
            background: #3b82f6;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            border-radius: 7px;
            font-variant-numeric: tabular-nums;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
          }
          .ar-bulk-label {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: #1d4ed8 !important;
          }
          [data-theme='dark'] .ar-bulk-label {
            color: #93c5fd !important;
          }
          .ar-bulk-actions {
            display: flex;
            gap: 6px;
            align-items: center;
          }
          .ar-bulk-btn.purge {
            height: 30px !important;
            font-weight: 600 !important;
            font-size: 12px !important;
            border-radius: 7px !important;
            padding: 0 12px !important;
          }
          .ar-bulk-btn.cancel {
            height: 30px !important;
            width: 30px !important;
            border-radius: 7px !important;
            color: var(--text-slate-500) !important;
          }
          .ar-bulk-btn.cancel:hover {
            background: rgba(59, 130, 246, 0.1) !important;
          }

          /* ── Table Card ──────────────────────────────────────── */
          .ar-table-card {
            border-radius: 12px !important;
            overflow: hidden !important;
            border: 1px solid var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02) !important;
          }
          [data-theme='dark'] .ar-table-card {
            border-color: #1f2937 !important;
            background: #161b22 !important;
          }

          /* ── Premium table ───────────────────────────────────── */
          .ar-table .ant-table {
            background: var(--bg-pure-white);
          }
          [data-theme='dark'] .ar-table .ant-table {
            background: #161b22;
          }
          .ar-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50);
            font-weight: 600;
            color: var(--text-slate-500);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .ar-table .ant-table-thead > tr > th {
            background: #0f1620;
            border-bottom-color: #1f2937;
            color: #94a3b8;
          }
          .ar-table .ant-table-thead > tr > th::before {
            display: none;
          }
          .ar-table .ant-table-tbody > tr > td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-slate-100);
            transition: background-color 0.15s ease;
          }
          [data-theme='dark'] .ar-table .ant-table-tbody > tr > td {
            background: #161b22;
            border-bottom-color: #1f2937;
          }
          .ar-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .ar-table .ant-table-tbody > tr:hover > td {
            background: #1a2230 !important;
          }
          .ar-table .ant-table-tbody > tr.ant-table-row-selected > td {
            background: rgba(59, 130, 246, 0.04) !important;
          }
          [data-theme='dark'] .ar-table .ant-table-tbody > tr.ant-table-row-selected > td {
            background: rgba(59, 130, 246, 0.08) !important;
          }

          /* ── Ticket cell ─────────────────────────────────────── */
          .ar-ticket-cell {
            position: relative;
            display: flex;
            flex-direction: column;
            padding-left: 12px;
          }
          .ar-row-rail {
            position: absolute;
            left: 0;
            top: -14px;
            bottom: -14px;
            width: 3px;
            background: linear-gradient(180deg, rgba(59, 130, 246, 0.5), rgba(59, 130, 246, 0.1));
            border-radius: 0 2px 2px 0;
            opacity: 0;
            transition: opacity 0.15s ease;
          }
          .ar-table .ant-table-tbody > tr:hover .ar-row-rail {
            opacity: 1;
          }
          .ar-ticket-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
          }
          .ar-ticket-id {
            display: inline-block;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 11px;
            font-weight: 600;
            color: var(--premium-blue);
            background: rgba(59, 130, 246, 0.06);
            padding: 2px 7px;
            border-radius: 5px;
            border: 1px solid rgba(59, 130, 246, 0.15);
            width: fit-content;
            letter-spacing: -0.01em;
          }
          [data-theme='dark'] .ar-ticket-id {
            background: rgba(59, 130, 246, 0.12);
            border-color: rgba(59, 130, 246, 0.25);
          }
          .ar-ticket-title {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.01em !important;
            line-height: 1.4 !important;
          }

          /* ── Project chip ────────────────────────────────────── */
          .ar-project-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-slate-50);
            padding: 4px 10px 4px 6px;
            border-radius: 6px;
            border: 1px solid var(--border-slate-200);
            width: fit-content;
            max-width: 100%;
          }
          [data-theme='dark'] .ar-project-chip {
            background: #1f2937;
            border-color: #374151;
          }
          .ar-project-code-tag {
            margin: 0 !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            background: var(--bg-pure-white) !important;
            border: 1px solid var(--border-slate-200) !important;
            color: var(--premium-blue) !important;
            border-radius: 4px !important;
            padding: 1px 6px !important;
            letter-spacing: 0.02em !important;
          }
          [data-theme='dark'] .ar-project-code-tag {
            background: #0b0f1a !important;
            border-color: #374151 !important;
            color: #60a5fa !important;
          }
          .ar-project-name {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
          }
          [data-theme='dark'] .ar-project-name {
            color: #cbd5e1 !important;
          }

          /* ── Status tags ─────────────────────────────────────── */
          .ar-status-tag {
            font-size: 10px !important;
            font-weight: 700 !important;
            margin: 0 !important;
            border-radius: 5px !important;
            padding: 3px 8px !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.4;
          }
          .ar-status-tag.green {
            background: rgba(16, 185, 129, 0.08) !important;
            color: #10b981 !important;
            border: 1px solid rgba(16, 185, 129, 0.2) !important;
          }
          .ar-status-tag.slate {
            background: var(--bg-slate-100) !important;
            color: var(--text-slate-600) !important;
            border: 1px solid var(--border-slate-200) !important;
          }
          [data-theme='dark'] .ar-status-tag.green {
            background: rgba(16, 185, 129, 0.15) !important;
            color: #34d399 !important;
            border-color: rgba(16, 185, 129, 0.25) !important;
          }
          [data-theme='dark'] .ar-status-tag.slate {
            background: #1f2937 !important;
            color: #94a3b8 !important;
            border-color: #374151 !important;
          }

          /* ── Priority pill ───────────────────────────────────── */
          .ar-priority-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 8px;
            border-radius: 5px;
            border: 1px solid;
            width: fit-content;
          }
          .ar-priority-pill.red {
            background: rgba(239, 68, 68, 0.08);
            border-color: rgba(239, 68, 68, 0.2);
          }
          .ar-priority-pill.amber {
            background: rgba(245, 158, 11, 0.08);
            border-color: rgba(245, 158, 11, 0.2);
          }
          .ar-priority-pill.green {
            background: rgba(16, 185, 129, 0.08);
            border-color: rgba(16, 185, 129, 0.2);
          }
          [data-theme='dark'] .ar-priority-pill.red {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.25);
          }
          [data-theme='dark'] .ar-priority-pill.amber {
            background: rgba(245, 158, 11, 0.15);
            border-color: rgba(245, 158, 11, 0.25);
          }
          [data-theme='dark'] .ar-priority-pill.green {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.25);
          }
          .ar-priority-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }
          .ar-priority-pill.red .ar-priority-dot {
            background: #ef4444;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
          }
          .ar-priority-pill.amber .ar-priority-dot {
            background: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
          }
          .ar-priority-pill.green .ar-priority-dot {
            background: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
          }
          .ar-priority-text {
            font-size: 10px !important;
            font-weight: 700 !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.4;
          }
          .ar-priority-pill.red .ar-priority-text {
            color: #ef4444 !important;
          }
          .ar-priority-pill.amber .ar-priority-text {
            color: #f59e0b !important;
          }
          .ar-priority-pill.green .ar-priority-text {
            color: #10b981 !important;
          }

          /* ── Actor cell ──────────────────────────────────────── */
          .ar-actor-cell {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .ar-actor-avatar {
            background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
            font-weight: 700 !important;
            font-size: 11px !important;
            color: #fff !important;
            flex-shrink: 0;
          }
          .ar-actor-avatar.unassigned {
            background: var(--bg-slate-100) !important;
            color: var(--text-slate-400) !important;
            border: 1px dashed var(--border-slate-300) !important;
          }
          [data-theme='dark'] .ar-actor-avatar.unassigned {
            background: #1f2937 !important;
            color: #64748b !important;
            border-color: #374151 !important;
          }
          .ar-actor-name {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .ar-actor-name.muted {
            color: var(--text-slate-400) !important;
            font-style: italic;
            font-weight: 500 !important;
          }
          [data-theme='dark'] .ar-actor-name {
            color: #cbd5e1 !important;
          }

          /* ── Date cell ───────────────────────────────────────── */
          .ar-date-cell {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .ar-date-icon {
            font-size: 13px;
            color: var(--text-slate-400);
          }
          .ar-date-meta {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
          }
          .ar-date-primary {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
            font-variant-numeric: tabular-nums;
          }
          [data-theme='dark'] .ar-date-primary {
            color: #cbd5e1 !important;
          }
          .ar-date-secondary {
            font-size: 11px !important;
            color: var(--text-slate-400) !important;
            font-weight: 500;
          }

          /* ── Empty state ─────────────────────────────────────── */
          .ar-empty {
            padding: 64px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-align: center;
          }
          .ar-empty-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: var(--bg-slate-50);
            color: var(--text-slate-400);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 8px;
            border: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .ar-empty-icon {
            background: #1f2937;
            border-color: #374151;
          }
          .ar-empty-title {
            font-size: 15px !important;
            font-weight: 700 !important;
            color: var(--text-slate-700) !important;
          }
          [data-theme='dark'] .ar-empty-title {
            color: #cbd5e1 !important;
          }
          .ar-empty-sub {
            font-size: 13px !important;
            color: var(--text-slate-500) !important;
            max-width: 360px;
            line-height: 1.5;
          }
          .ar-empty-action {
            margin-top: 12px;
            height: 32px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            border-radius: 7px !important;
          }

          /* ── Pagination ──────────────────────────────────────── */
          .ar-pagination-total {
            font-size: 12px !important;
            color: var(--text-slate-500) !important;
            font-weight: 500;
          }
          .ar-table .ant-pagination {
            border-top: 1px solid var(--border-slate-100);
          }
          [data-theme='dark'] .ar-table .ant-pagination {
            border-top-color: #1f2937;
          }

          /* ── Responsive ──────────────────────────────────────── */
          @media (max-width: 1100px) {
            .ar-stat-strip {
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .ar-stat-divider {
              display: none;
            }
            .ar-stat {
              padding: 0;
            }
          }
          @media (max-width: 768px) {
            .ar-hero {
              padding: 14px 24px 0;
            }
            .ar-hero-inner {
              flex-direction: column;
              align-items: stretch;
            }
            .ar-stat-strip {
              grid-template-columns: 1fr;
            }
            .ar-control-bar {
              flex-direction: column;
              align-items: stretch;
            }
            .ar-filter-cluster {
              flex-wrap: wrap;
            }
            .ar-filter-search {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
