'use client';

import React, { useState, use, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Typography,
  Table,
  Space,
  Button,
  Input,
  Select,
  Popconfirm,
  // message as message,
  App,
  Avatar,
  Tooltip,
  Skeleton,
  Segmented,
  Progress,
} from 'antd';
import {
  FolderOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  FileTextOutlined,
  ProjectOutlined,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CheckCircleFilled,
  PlayCircleFilled,
  PauseCircleFilled,
  FireFilled,
  FlagFilled,
  ThunderboltFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useBucket, useBucketTickets, bucketKeys } from '@/hooks/useBuckets';
import { useUpdateTicket, ticketKeys } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { useAvailableSprints } from '@/hooks/useAvailableSprints';
import { History as HistoryIcon } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const ACCENT_FALLBACK = '#8b5cf6';

interface BucketTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  storyPoint?: number;
  project: { id: string; name: string; code: string };
  assignee?: { id: string; name: string; workEmail: string };
  createdAt: string;
}

const initialsOf = (name?: string) =>
  (name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; Icon: React.ComponentType<any> }
> = {
  completed: { label: 'Completed', color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)', Icon: CheckCircleFilled },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.22)', Icon: PlayCircleFilled },
  blocked: { label: 'Blocked', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.22)', Icon: PauseCircleFilled },
  todo: { label: 'To Do', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.22)', Icon: ClockCircleOutlined },
};
const statusMeta = (s: string) =>
  STATUS_META[s] || { label: (s || '—').replace('_', ' '), color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.22)', Icon: ClockCircleOutlined };

const PRIORITY_META: Record<string, { color: string; bg: string; border: string; Icon: React.ComponentType<any> }> = {
  HIGH: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.22)', Icon: FireFilled },
  MEDIUM: { color: '#d97706', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)', Icon: ThunderboltFilled },
  LOW: { color: '#2563eb', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.22)', Icon: FlagFilled },
};
const priorityMeta = (p: string) =>
  PRIORITY_META[p] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.22)', Icon: FlagFilled };

export default function BucketDetailPage({ params }: { params: Promise<{ bucketId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: authLoading } = useAuth();
  const { canReadProject, canReadActivityLog } = usePermission();
  const [historyOpen, setHistoryOpen] = useState(false);
  // const [messageApi, contextHolder] = antdMessage.useMessage();


  const { message: messageApi } = App.useApp();

  const { bucketId } = use(params);

  useEffect(() => {
    if (!authLoading && !canReadProject) router.push('/dashboard');
  }, [authLoading, canReadProject, router]);

  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: bucket, isLoading: bucketLoading, refetch: refetchBucket } = useBucket(bucketId);
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useBucketTickets(bucketId, page, 100);
  const { data: sprints } = useAvailableSprints(bucket?.project?.id);

  const { mutateAsync: updateTicket, isPending: isMovingToSprint } = useUpdateTicket();
  const { mutateAsync: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const accent = bucket?.color || ACCENT_FALLBACK;

  const allTickets: BucketTicket[] = ticketsData?.tickets || [];

  const tickets = useMemo(() => {
    let res = allTickets;
    if (searchText) {
      const lower = searchText.toLowerCase();
      res = res.filter(
        (t) => t.title.toLowerCase().includes(lower) || t.ticketNumber.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== 'all') res = res.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') res = res.filter((t) => t.priority === priorityFilter);
    return res;
  }, [allTickets, searchText, statusFilter, priorityFilter]);

  // Aggregate analytics over the unfiltered list so the strip always reflects truth.
  const analytics = useMemo(() => {
    const total = allTickets.length;
    const points = allTickets.reduce((acc, t) => acc + (t.storyPoint || 0), 0);
    const statusBreakdown = allTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    const completed = statusBreakdown['completed'] || 0;
    const inProgress = statusBreakdown['in_progress'] || 0;
    const todo = (statusBreakdown['todo'] || 0) + (statusBreakdown['open'] || 0);
    const blocked = statusBreakdown['blocked'] || 0;
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
    const assigneeCount = new Set(allTickets.filter((t) => t.assignee).map((t) => t.assignee!.id)).size;
    const priorityBreakdown = allTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});
    return { total, points, completed, inProgress, todo, blocked, completion, assigneeCount, priorityBreakdown };
  }, [allTickets]);

  const handleMoveToSprint = async () => {
    if (!selectedSprint || selectedRowKeys.length === 0) {
      messageApi.warning('Please select tickets and a sprint');
      return;
    }
    try {
      await Promise.all(
        selectedRowKeys.map((ticketId) =>
          updateTicket({
            id: ticketId as string,
            data: { sprintPlanId: selectedSprint, bucketId: null } as any,
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      messageApi.success(`${selectedRowKeys.length} ticket(s) moved to sprint`);
      setSelectedRowKeys([]);
      setSelectedSprint(null);
      refetchTickets();
    } catch (error: any) {
      messageApi.error(`Failed to move tickets: ${error.message || 'Unknown error'}`);
    }
  };

  const handleMoveToTrash = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await moveToTrash(selectedRowKeys as string[]);
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      setSelectedRowKeys([]);
      refetchTickets();
      messageApi.success(`${selectedRowKeys.length} ticket(s) moved to trash`);
    } catch (error: any) {
      messageApi.error(`Failed to move tickets to trash: ${error.message || 'Unknown error'}`);
    }
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
  };

  const hasFilter = searchText || statusFilter !== 'all';

  // ────────────────────────── Table columns ──────────────────────────
  const columns: ColumnsType<BucketTicket> = [
    {
      title: 'TICKET',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 120,
      fixed: 'left',
      render: (text) => (
        <div className="bd-row-id">
          <span className="bd-row-id-tag" style={{ color: accent, background: `${accent}10`, borderColor: `${accent}28` }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      title: 'TITLE',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => <Text className="bd-row-title">{text}</Text>,
    },
    {
      title: 'PROJECT',
      dataIndex: 'project',
      key: 'project',
      width: 200,
      render: (project) =>
        project ? (
          <div className="bd-project-tag">
            <span className="bd-project-code-box">{project.code}</span>
            <span className="bd-project-name-text">{project.name}</span>
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
        ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const m = statusMeta(status);
        const Icon = m.Icon;
        return (
          <span className="bd-pill" style={{ color: m.color, background: m.bg, borderColor: m.border }}>
            <Icon style={{ fontSize: 9 }} />
            {m.label}
          </span>
        );
      },
    },
    {
      title: 'ASSIGNEE',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 200,
      render: (assignee) =>
        assignee ? (
          <div className="bd-assignee">
            <Avatar
              size={24}
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {initialsOf(assignee.name)}
            </Avatar>
            <Text className="bd-assignee-name" ellipsis>
              {assignee.name}
            </Text>
          </div>
        ) : (
          <Text className="bd-unassigned">Unassigned</Text>
        ),
    },
    {
      title: 'CREATED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
          <Text className="bd-time">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
  ];

  // ────────────────────────── Loading ──────────────────────────
  if (authLoading || bucketLoading) {
    return (
      <MainLayout>
        <div className="bd-page">
          <div className="bd-header">
            <Skeleton.Input active size="small" style={{ width: 320, height: 28 }} />
          </div>
          <div className="bd-body">
            <div className="bd-kpi-strip">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bd-kpi">
                  <Skeleton active paragraph={{ rows: 1 }} />
                </div>
              ))}
            </div>
            <Card className="bd-table-shell" styles={{ body: { padding: 16 } }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bd-page" style={{ ['--accent' as any]: accent }}>
        {/* {contextHolder} */}

        {/* ─────────── Slim header ─────────── */}
        <div className="bd-header">
          <div className="bd-header-left">
            <Tooltip title="Back to Buckets Hub">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                className="bd-back-icon-btn"
              />
            </Tooltip>
            <div
              className="bd-header-icon"
              style={{
                background: `${accent}14`,
                borderColor: `${accent}30`,
                color: accent,
              }}
            >
              <FolderOutlined />
            </div>
            <div className="bd-header-info">
              <div className="bd-header-title-row">
                <Title level={5} className="bd-header-title">
                  {bucket?.name}
                </Title>
                {bucket?.isShared ? (
                  <span className="bd-pill bd-pill-public">
                    <GlobalOutlined style={{ fontSize: 9 }} /> Public
                  </span>
                ) : (
                  <span className="bd-pill bd-pill-private">
                    <LockOutlined style={{ fontSize: 9 }} /> Private
                  </span>
                )}
                {bucket?.project ? (
                  <span className="bd-pill bd-pill-project">
                    <ProjectOutlined style={{ fontSize: 9 }} />
                    {bucket.project.name}
                  </span>
                ) : (
                  <span className="bd-pill bd-pill-cross">Cross-Project</span>
                )}
                {bucket?.userRole === 'owner' && (
                  <span className="bd-pill bd-pill-owner">
                    <CrownOutlined style={{ fontSize: 9 }} /> Owner
                  </span>
                )}
              </div>
              {bucket?.description && (
                <Text className="bd-header-desc" ellipsis={{ tooltip: bucket.description }}>
                  {bucket.description}
                </Text>
              )}
            </div>
          </div>

          <div className="bd-header-right">
            <Tooltip title={`${analytics.completion}% complete · ${analytics.completed}/${analytics.total} done`}>
              <div className="bd-header-progress">
                <Progress
                  percent={analytics.completion}
                  strokeColor={accent}
                  trailColor="var(--bg-slate-100)"
                  size={{ height: 6 }}
                  showInfo={false}
                  style={{ width: 120, margin: 0, lineHeight: 0 }}
                />
                <Text className="bd-header-progress-text">{analytics.completion}%</Text>
              </div>
            </Tooltip>
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={async () => {
                setIsRefreshing(true);
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: bucketKeys.all }),
                  refetchBucket(),
                  refetchTickets()
                ]);
                setIsRefreshing(false);
                messageApi.success('Bucket data refreshed');
              }}
              loading={ticketsLoading && !isRefreshing}
              className="bd-ghost-btn"
              size="small"
            />
            {canReadActivityLog && bucket && (
              <Tooltip title="Activity history">
                <Button
                  icon={<HistoryIcon size={14} strokeWidth={1.75} />}
                  onClick={() => setHistoryOpen(true)}
                  className="bd-ghost-btn"
                  size="small"
                />
              </Tooltip>
            )}
          </div>
        </div>

        {bucket && (
          <TransactionHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            entityType="bucket"
            entityId={bucket.id}
            subtitle={bucket.name}
          />
        )}

        <div className="bd-body">
          {/* ──────────────── KPI strip ──────────────── */}
          <div className="bd-kpi-strip">
            {(ticketsLoading || isRefreshing) && !tickets.length ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bd-kpi" style={{ padding: '14px 16px' }}>
                  <Skeleton.Avatar active size="small" shape="square" />
                  <Skeleton active paragraph={{ rows: 1 }} title={false} />
                </div>
              ))
            ) : (
              <>
                <div className="bd-kpi bd-kpi-purple">
                  <div className="bd-kpi-icon">
                    <FileTextOutlined />
                  </div>
                  <div className="bd-kpi-meta">
                    <Text className="bd-kpi-value">{analytics.total}</Text>
                    <Text className="bd-kpi-label">Tickets</Text>
                  </div>
                </div>
                <div className="bd-kpi bd-kpi-emerald">
                  <div className="bd-kpi-icon">
                    <CheckCircleFilled />
                  </div>
                  <div className="bd-kpi-meta">
                    <Text className="bd-kpi-value">{analytics.completed}</Text>
                    <Text className="bd-kpi-label">Completed</Text>
                  </div>
                </div>
                <div className="bd-kpi bd-kpi-blue">
                  <div className="bd-kpi-icon">
                    <PlayCircleFilled />
                  </div>
                  <div className="bd-kpi-meta">
                    <Text className="bd-kpi-value">{analytics.inProgress}</Text>
                    <Text className="bd-kpi-label">In Progress</Text>
                  </div>
                </div>
                <div className="bd-kpi bd-kpi-amber">
                  <div className="bd-kpi-icon">
                    <ClockCircleOutlined />
                  </div>
                  <div className="bd-kpi-meta">
                    <Text className="bd-kpi-value">{analytics.todo}</Text>
                    <Text className="bd-kpi-label">To Do</Text>
                  </div>
                </div>
                <div className="bd-kpi bd-kpi-rose">
                  <div className="bd-kpi-icon">
                    <PauseCircleFilled />
                  </div>
                  <div className="bd-kpi-meta">
                    <Text className="bd-kpi-value">{analytics.blocked}</Text>
                    <Text className="bd-kpi-label">Blocked</Text>
                  </div>
                </div>
                <div className="bd-kpi bd-kpi-slate">
                  <div className="bd-kpi-icon">
                    <TeamOutlined />
                  </div>
                  <div className="bd-kpi-meta">
                    <Text className="bd-kpi-value">{analytics.assigneeCount}</Text>
                    <Text className="bd-kpi-label">Assignees</Text>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─────────── Sticky control bar ─────────── */}
          <div className="bd-control-bar">
            {selectedRowKeys.length > 0 ? (
              <div className="bd-batch-bar">
                <div className="bd-batch-count">
                  <span className="bd-batch-dot" />
                  <Text className="bd-batch-count-text">
                    {selectedRowKeys.length} SELECTED
                  </Text>
                </div>
                <div className="bd-batch-actions">
                  <Text className="bd-batch-label">Ship to:</Text>
                  <Select
                    placeholder="Select sprint"
                    value={selectedSprint}
                    onChange={setSelectedSprint}
                    className="bd-sprint-select"
                    size="middle"
                    popupMatchSelectWidth={false}
                  >
                    {sprints?.map((sprint: any) => (
                      <Option key={sprint.id} value={sprint.id}>
                        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <RocketOutlined style={{ fontSize: 10, color: '#3b82f6' }} />
                          {sprint.version}
                        </span>
                      </Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    onClick={handleMoveToSprint}
                    loading={isMovingToSprint}
                    disabled={!selectedSprint}
                    className="bd-execute-btn"
                    icon={<ArrowRightOutlined />}
                  >
                    Execute Move
                  </Button>
                  <span className="bd-batch-divider" />
                  <Popconfirm
                    title="Move to Trash"
                    description={`Move ${selectedRowKeys.length} ticket(s) to trash?`}
                    onConfirm={handleMoveToTrash}
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={isDeleting} className="bd-trash-btn">
                      Trash
                    </Button>
                  </Popconfirm>
                  <Button type="text" size="small" onClick={() => setSelectedRowKeys([])} className="bd-clear-btn">
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bd-filters">
                <div className={`bd-search-box ${searchText ? 'active' : ''}`}>
                  <SearchOutlined style={{ color: searchText ? accent : 'var(--text-slate-400)', fontSize: 13 }} />
                  <Input
                    placeholder="Search tickets..."
                    variant="borderless"
                    style={{ fontSize: 12, fontWeight: 600, padding: 0 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </div>

                <div className="bd-filter-wrap">
                  <Text className="bd-filter-label">Status</Text>
                  <Select
                    variant="borderless"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 130 }}
                    size="small"
                  >
                    <Option value="all">All</Option>
                    <Option value="todo">To Do</Option>
                    <Option value="in_progress">In Progress</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="blocked">Blocked</Option>
                  </Select>
                </div>


                {hasFilter && (
                  <Button
                    size="small"
                    type="text"
                    icon={<ReloadOutlined style={{ fontSize: 11 }} />}
                    onClick={resetFilters}
                    className="bd-reset-btn"
                  >
                    RESET
                  </Button>
                )}

                <div style={{ flex: 1 }} />

                <Text className="bd-result-count">
                  {tickets.length} of {analytics.total} tickets
                </Text>

                {/* 
                <Segmented
                  value={viewMode}
                  onChange={(v) => setViewMode(v as 'table' | 'compact')}
                  className="bd-view-toggle"
                  options={[
                    { label: <Tooltip title="Comfortable"><UnorderedListOutlined /></Tooltip>, value: 'table' },
                    { label: <Tooltip title="Compact"><AppstoreOutlined /></Tooltip>, value: 'compact' },
                  ]}
                />
                */}
              </div>
            )}
          </div>

          {/* ─────────── Table ─────────── */}
          <Card styles={{ body: { padding: 0 } }} className="bd-table-shell">
            {isRefreshing || (ticketsLoading && !tickets.length) ? (
              <div style={{ padding: 32 }}>
                <Skeleton active paragraph={{ rows: 10 }} title />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={tickets}
                rowKey="id"
                loading={ticketsLoading}
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                  columnWidth: 44,
                }}
                pagination={{
                  pageSize: viewMode === 'compact' ? 30 : 15,
                  showSizeChanger: true,
                  showTotal: (total) => (
                    <Text className="bd-pagination-total">{total} TICKETS</Text>
                  ),
                  style: { padding: '12px 20px', margin: 0 },
                }}
                scroll={{ x: 1200 }}
                className={`bd-table ${viewMode === 'compact' ? 'bd-table-compact' : ''}`}
                locale={{
                  emptyText: (
                    <div className="bd-empty">
                      <div className="bd-empty-illust">
                        <FolderOutlined />
                        <span className="bd-empty-illust-glow" />
                      </div>
                      <Title level={4} className="bd-empty-title">
                        {hasFilter ? 'No tickets match these filters' : 'This bucket is empty'}
                      </Title>
                      <Text className="bd-empty-sub">
                        {hasFilter
                          ? 'Try adjusting search, status, or priority filters.'
                          : 'Drag tickets here from a sprint or backlog to start organizing.'}
                      </Text>
                      {hasFilter && (
                        <Button onClick={resetFilters} className="bd-ghost-btn" style={{ marginTop: 14 }}>
                          Reset filters
                        </Button>
                      )}
                    </div>
                  ),
                }}
              />
            )}
          </Card>
        </div>

        <style jsx global>{`
          /* ──────────────── Page shell ──────────────── */
          .bd-page {
            background: var(--bg-pure-white);
            min-height: 100vh;
            margin: 0 -24px;
            padding-bottom: 32px;
          }
          .bd-body {
            padding: 16px 32px 0;
          }

          /* ──────────────── Slim header ──────────────── */
          .bd-header {
            position: sticky;
            top: 0;
            z-index: 101;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 11px 32px 12px;
            background: var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-100);
            min-height: 56px;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          [data-theme='dark'] .bd-header {
            background: rgba(11, 15, 26, 0.8) !important;
            border-bottom-color: #1f2937 !important;
          }
          .bd-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            flex: 1;
          }
          .bd-back-icon-btn {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            color: var(--text-slate-500) !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .bd-back-icon-btn:hover {
            background: var(--bg-slate-100) !important;
            color: var(--accent) !important;
          }
          [data-theme='dark'] .bd-back-icon-btn:hover {
            background: #1f2937 !important;
          }
          .bd-header-icon {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 1px solid;
            flex-shrink: 0;
          }
          .bd-header-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
            gap: 2px;
          }
          .bd-header-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            min-width: 0;
          }
          .bd-header-title {
            margin: 0 !important;
            font-size: 15px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.012em;
            line-height: 1.2 !important;
          }
          .bd-header-desc {
            font-size: 11px !important;
            color: var(--text-slate-500) !important;
            font-weight: 500 !important;
            max-width: 520px;
            line-height: 1.4 !important;
          }
          .bd-header-right {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
          }
          .bd-header-progress {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 10px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            border-radius: 6px;
            height: 28px;
          }
          [data-theme='dark'] .bd-header-progress {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }
          .bd-header-progress-text {
            font-size: 11px !important;
            font-weight: 800 !important;
            color: var(--text-slate-700) !important;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.01em;
          }
          .bd-ghost-btn {
            height: 28px !important;
            border-radius: 6px !important;
            font-weight: 600 !important;
            font-size: 12px !important;
            background: var(--bg-pure-white) !important;
            border: 1px solid var(--border-slate-200) !important;
          }
          .bd-ghost-btn:hover {
            border-color: var(--accent) !important;
            color: var(--accent) !important;
          }

          /* ──────────────── KPI strip ──────────────── */
          .bd-kpi-strip {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }
          @media (max-width: 1280px) { .bd-kpi-strip { grid-template-columns: repeat(3, 1fr); } }
          @media (max-width: 720px)  { .bd-kpi-strip { grid-template-columns: repeat(2, 1fr); } }

          .bd-kpi {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            padding: 14px 16px;
            overflow: hidden;
            transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }
          [data-theme='dark'] .bd-kpi {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }
          .bd-kpi::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, var(--c1) 0%, transparent 60%);
            opacity: 0.06;
            pointer-events: none;
          }
          .bd-kpi:hover {
            transform: translateY(-2px);
            border-color: var(--c1);
          }
          .bd-kpi-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--c-bg);
            border: 1px solid var(--c-border);
            color: var(--c1);
            font-size: 15px;
            flex-shrink: 0;
          }
          .bd-kpi-meta { display: flex; flex-direction: column; min-width: 0; }
          .bd-kpi-value {
            font-size: 22px !important;
            font-weight: 800 !important;
            line-height: 1 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
          }
          .bd-kpi-label {
            font-size: 9px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-slate-400) !important;
            margin-top: 4px;
          }
          .bd-kpi-purple  { --c1: #8b5cf6; --c-bg: rgba(139,92,246,0.08); --c-border: rgba(139,92,246,0.18); }
          .bd-kpi-blue    { --c1: #3b82f6; --c-bg: rgba(59,130,246,0.08); --c-border: rgba(59,130,246,0.18); }
          .bd-kpi-emerald { --c1: #10b981; --c-bg: rgba(16,185,129,0.08); --c-border: rgba(16,185,129,0.18); }
          .bd-kpi-rose    { --c1: #f43f5e; --c-bg: rgba(244,63,94,0.08);  --c-border: rgba(244,63,94,0.18); }
          .bd-kpi-amber   { --c1: #f59e0b; --c-bg: rgba(245,158,11,0.08); --c-border: rgba(245,158,11,0.18); }
          .bd-kpi-slate   { --c1: #64748b; --c-bg: rgba(100,116,139,0.08); --c-border: rgba(100,116,139,0.18); }

          /* ──────────────── Control bar ──────────────── */
          .bd-control-bar {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            padding: 10px 14px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            backdrop-filter: blur(8px);
          }
          [data-theme='dark'] .bd-control-bar {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }

          .bd-filters {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .bd-search-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: transparent !important;
            padding: 0 12px;
            border-radius: 8px;
            border: 1px solid var(--border-slate-100);
            width: 280px;
            height: 36px;
            transition: all 0.2s ease;
          }
          .bd-search-box.active {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
          }
          [data-theme='dark'] .bd-search-box {
            background: transparent !important;
            border-color: #374151 !important;
          }
          .bd-filter-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
            // background: var(--bg-slate-50);
            background: transparent !important;
            padding: 0 6px 0 12px;
            border-radius: 8px;
            border: 1px solid var(--border-slate-100);
            height: 36px;
          }
          [data-theme='dark'] .bd-filter-wrap {
            // background: #1f2937 !important;
            background: transparent !important;
            border-color: #374151 !important;
          }
          .bd-filter-label {
            font-size: 10px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-slate-400) !important;
          }
          .bd-reset-btn {
            color: #94a3b8 !important;
            font-weight: 800 !important;
            font-size: 10px !important;
            letter-spacing: 0.08em;
            height: 32px;
            border-radius: 6px;
          }
          .bd-result-count {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: var(--text-slate-500) !important;
            font-variant-numeric: tabular-nums;
          }
          .bd-view-toggle.ant-segmented {
            background: var(--bg-slate-50) !important;
            padding: 3px !important;
            border-radius: 8px !important;
            border: 1px solid var(--border-slate-100);
          }
          [data-theme='dark'] .bd-view-toggle.ant-segmented {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }
          .bd-view-toggle .ant-segmented-item {
            min-width: 32px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px !important;
          }

          /* ──────────────── Batch bar ──────────────── */
          .bd-batch-bar {
            display: flex;
            align-items: center;
            gap: 16px;
            background: linear-gradient(135deg,
              color-mix(in srgb, var(--accent) 8%, transparent),
              color-mix(in srgb, var(--accent) 3%, transparent));
            border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
            border-radius: 8px;
            padding: 6px 12px;
            animation: bdSlideIn 0.25s ease-out;
          }
          @keyframes bdSlideIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .bd-batch-count {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-right: 14px;
            border-right: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
          }
          .bd-batch-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent);
            animation: bdPulse 1.6s ease-in-out infinite;
          }
          @keyframes bdPulse {
            0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent); }
            50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent) 5%, transparent); }
          }
          .bd-batch-count-text {
            font-size: 11px !important;
            font-weight: 800 !important;
            color: var(--accent) !important;
            letter-spacing: 0.06em;
          }
          .bd-batch-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .bd-batch-label {
            font-size: 10px !important;
            font-weight: 800 !important;
            color: var(--text-slate-500) !important;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .bd-sprint-select {
            min-width: 160px;
          }
          .bd-sprint-select .ant-select-selector {
            border-radius: 6px !important;
            background: var(--bg-pure-white) !important;
            border-color: var(--border-slate-200) !important;
          }
          .bd-execute-btn {
            background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 75%, black)) !important;
            border: none !important;
            font-weight: 700 !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 12px -4px var(--accent);
          }
          .bd-execute-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px -4px var(--accent) !important;
          }

          .bd-row-id-project { font-size: 10px; margin-left: 4px; font-weight: 600; }
          .bd-row-title { font-size: 13px !important; color: var(--text-slate-900) !important; font-weight: 600 !important; }

          /* ──────────────── Project tag ──────────────── */
          .bd-project-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 3px 10px 3px 3px;
            background: rgba(241, 245, 249, 0.8);
            border: 1px solid var(--border-slate-200);
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          [data-theme='dark'] .bd-project-tag {
            background: rgba(31, 41, 55, 0.4) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          .bd-project-code-box {
            background: #ffffff;
            color: #2563eb;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            min-width: 32px;
            text-align: center;
            border: 1px solid rgba(37, 99, 235, 0.15);
            letter-spacing: 0.02em;
          }
          [data-theme='dark'] .bd-project-code-box {
            background: #0d1117 !important;
            color: #60a5fa !important;
            border-color: rgba(96, 165, 250, 0.2) !important;
          }
          .bd-project-name-text {
            color: var(--text-slate-900) !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            letter-spacing: -0.01em;
          }
          .bd-execute-btn[disabled] {
            background: var(--bg-slate-100) !important;
            color: var(--text-slate-400) !important;
            box-shadow: none;
          }
          .bd-trash-btn {
            border-radius: 6px !important;
            font-weight: 700 !important;
          }
          .bd-clear-btn {
            color: var(--text-slate-500) !important;
            font-weight: 700 !important;
            font-size: 11px !important;
          }
          .bd-batch-divider {
            width: 1px;
            height: 22px;
            background: color-mix(in srgb, var(--accent) 25%, transparent);
          }

          /* ──────────────── Pills ──────────────── */
          .bd-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 5px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.4;
            white-space: nowrap;
            border: 1px solid;
          }
          .bd-pill-public {
            background: linear-gradient(135deg, rgba(139,92,246,0.10), rgba(139,92,246,0.04));
            color: #7c3aed;
            border-color: rgba(139,92,246,0.22);
          }
          .bd-pill-private {
            background: var(--bg-slate-50);
            color: #64748b;
            border-color: var(--border-slate-200);
          }
          .bd-pill-project {
            background: linear-gradient(135deg, rgba(59,130,246,0.10), rgba(59,130,246,0.04));
            color: #2563eb;
            border-color: rgba(59,130,246,0.22);
            text-transform: none;
            letter-spacing: 0;
            font-size: 11px;
          }
          .bd-pill-cross {
            background: linear-gradient(135deg, rgba(244,63,94,0.10), rgba(244,63,94,0.04));
            color: #e11d48;
            border-color: rgba(244,63,94,0.22);
          }
          .bd-pill-owner {
            background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04));
            color: #d97706;
            border-color: rgba(245,158,11,0.24);
          }
          [data-theme='dark'] .bd-pill-private {
            background: #1f2937 !important;
            border-color: #374151 !important;
            color: #94a3b8 !important;
          }

          /* ──────────────── Table ──────────────── */
          .bd-table-shell {
            border-radius: 12px !important;
            overflow: hidden;
            border: 1px solid var(--border-slate-200) !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          [data-theme='dark'] .bd-table-shell {
            border-color: #1f2937 !important;
            background: #161b22 !important;
          }
          .bd-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            font-weight: 800 !important;
            color: var(--text-slate-500) !important;
            font-size: 10px !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 14px 16px !important;
            border-bottom: 1px solid var(--border-slate-200) !important;
          }
          [data-theme='dark'] .bd-table .ant-table-thead > tr > th {
            background: #1f2937 !important;
            border-bottom-color: #374151 !important;
            color: #94a3b8 !important;
          }
          .bd-table .ant-table-tbody > tr > td {
            padding: 14px 16px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            transition: background 0.15s ease;
          }
          .bd-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .bd-table .ant-table-tbody > tr > td {
            background: #161b22 !important;
            border-bottom-color: #1f2937 !important;
          }
          [data-theme='dark'] .bd-table .ant-table-tbody > tr:hover > td {
            background: #1f2937 !important;
          }
          .bd-table-compact .ant-table-tbody > tr > td {
            padding: 8px 16px !important;
          }
          .bd-table .ant-table-tbody > tr.ant-table-row-selected > td {
            background: color-mix(in srgb, var(--accent) 8%, transparent) !important;
          }

          .bd-row-id {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .bd-row-id-tag {
            display: inline-block;
            font-family: ui-monospace, "SF Mono", Menlo, Monaco, monospace;
            font-size: 11px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid;
            width: fit-content;
            letter-spacing: -0.01em;
          }
          .bd-row-id-project {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: var(--text-slate-400) !important;
            letter-spacing: 0.04em;
          }
          .bd-row-title {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: var(--text-slate-800) !important;
            letter-spacing: -0.012em;
          }
          .bd-points {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 24px;
            padding: 0 8px;
            border-radius: 6px;
            background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04));
            border: 1px solid rgba(16,185,129,0.22);
            color: #059669;
            font-size: 12px;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
          }
          .bd-points-empty {
            font-size: 13px !important;
            color: var(--text-slate-300) !important;
          }
          .bd-assignee {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }
          .bd-assignee-name {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
            min-width: 0;
            max-width: 140px;
          }
          .bd-unassigned {
            font-size: 11px !important;
            color: var(--text-slate-400) !important;
            font-style: italic;
            font-weight: 600 !important;
          }
          .bd-time {
            font-size: 11px !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
          }
          .bd-pagination-total {
            font-size: 10px !important;
            font-weight: 800 !important;
            color: #94a3b8 !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          /* ──────────────── Empty ──────────────── */
          .bd-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 60px 24px;
          }
          .bd-empty-illust {
            position: relative;
            width: 88px;
            height: 88px;
            border-radius: 22px;
            background: linear-gradient(135deg,
              color-mix(in srgb, var(--accent) 14%, transparent),
              color-mix(in srgb, var(--accent) 4%, transparent));
            border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent);
            font-size: 36px;
            margin-bottom: 18px;
          }
          .bd-empty-illust-glow {
            position: absolute;
            inset: -20%;
            background: radial-gradient(circle, var(--accent), transparent 60%);
            filter: blur(20px);
            z-index: -1;
            opacity: 0.25;
            animation: bdGlow 2.6s ease-in-out infinite;
          }
          .bd-empty-title {
            margin: 0 !important;
            font-size: 18px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.01em;
          }
          .bd-empty-sub {
            font-size: 13px !important;
            color: var(--text-slate-500) !important;
            max-width: 380px;
            margin-top: 6px;
            line-height: 1.6;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
