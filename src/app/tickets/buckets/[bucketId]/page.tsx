'use client';

import React, { useState, use, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import MainLayout from '@/components/layout/MainLayout';
import {
  Typography,
  Button,
  Input,
  Popconfirm,
  App,
  Avatar,
  Tooltip,
  Skeleton,
  Pagination,
  Checkbox,
  Popover,
  Badge,
  Divider,
} from 'antd';
import {
  FolderOpenOutlined,
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
  CheckCircleFilled,
  PlayCircleFilled,
  PauseCircleFilled,
  FlagOutlined,
  EyeOutlined,
  UserOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useBucket, useBucketTickets, bucketKeys } from '@/hooks/useBuckets';
import { useUpdateTicket, ticketKeys } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { useAvailableSprints } from '@/hooks/useAvailableSprints';
import { History as HistoryIcon } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';
import { TicketDetailDrawer } from '@/components/projects/drawer/TicketDetailDrawer';
import { SearchableDropdown, SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const ACCENT_FALLBACK = '#3b82f6';

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
  { label: string; color: string; bg: string; border: string }
> = {
  completed: { label: 'Completed', color: '#047857', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' },
  in_progress: { label: 'In Progress', color: '#1d4ed8', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)' },
  in_testing: { label: 'In Testing', color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  blocked: { label: 'Blocked', color: '#b91c1c', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' },
  todo: { label: 'To Do', color: '#475569', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)' },
  not_started: { label: 'Not Started', color: '#475569', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)' },
};
const statusMeta = (s: string) =>
  STATUS_META[s] || { label: (s || '—').replace(/_/g, ' '), color: '#475569', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)' };

const PRIORITY_META: Record<string, { color: string; bg: string; border: string }> = {
  HIGH: { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' },
  MEDIUM: { color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  LOW: { color: '#047857', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' },
  P1: { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' },
  P2: { color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  P3: { color: '#047857', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' },
};

export default function BucketDetailPage({ params }: { params: Promise<{ bucketId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: authLoading } = useAuth();
  const { canReadProject, canReadActivityLog } = usePermission();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { message: messageApi, modal } = App.useApp();

  const { bucketId } = use(params);

  useEffect(() => {
    if (!authLoading && !canReadProject) router.push('/dashboard');
  }, [authLoading, canReadProject, router]);

  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sprintPopoverOpen, setSprintPopoverOpen] = useState(false);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const { data: bucket, isLoading: bucketLoading, refetch: refetchBucket } = useBucket(bucketId);
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useBucketTickets(bucketId, 1, 200);
  const { data: sprints, isLoading: sprintsLoading } = useAvailableSprints(bucket?.project?.id);

  const { mutateAsync: updateTicket, isPending: isMovingToSprint } = useUpdateTicket();
  const { mutateAsync: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const accent = bucket?.color || ACCENT_FALLBACK;

  const allTickets: BucketTicket[] = ticketsData?.tickets || [];

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter) {
        if (assigneeFilter === '__unassigned__' && t.assignee) return false;
        if (assigneeFilter !== '__unassigned__' && t.assignee?.id !== assigneeFilter) return false;
      }
      if (searchText) {
        const q = searchText.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inNum = t.ticketNumber.toLowerCase().includes(q);
        if (!inTitle && !inNum) return false;
      }
      return true;
    });
  }, [allTickets, searchText, statusFilter, priorityFilter, assigneeFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchText, statusFilter, priorityFilter, assigneeFilter]);

  const pagedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  // Aggregate analytics over the unfiltered list
  const analytics = useMemo(() => {
    const total = allTickets.length;
    const statusBreakdown = allTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    const priorityBreakdown = allTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});
    const completed = statusBreakdown['completed'] || 0;
    const inProgress = statusBreakdown['in_progress'] || 0;
    const todo = (statusBreakdown['todo'] || 0) + (statusBreakdown['not_started'] || 0);
    const blocked = statusBreakdown['blocked'] || 0;
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
    const assigneeCount = new Set(allTickets.filter((t) => t.assignee).map((t) => t.assignee!.id)).size;
    return { total, completed, inProgress, todo, blocked, completion, assigneeCount, statusBreakdown, priorityBreakdown };
  }, [allTickets]);

  // Filter dropdown options
  const statusOptions = useMemo<SearchableDropdownOption[]>(
    () =>
      Object.entries(analytics.statusBreakdown).map(([s, n]) => {
        const m = statusMeta(s);
        return {
          value: s,
          label: m.label,
          description: `${n} ticket${n === 1 ? '' : 's'}`,
          badge: (
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: m.bg,
                border: `1px solid ${m.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: m.color }} />
            </span>
          ),
        };
      }),
    [analytics.statusBreakdown]
  );

  const priorityOptions = useMemo<SearchableDropdownOption[]>(
    () =>
      Object.entries(analytics.priorityBreakdown).map(([p, n]) => {
        const m = PRIORITY_META[p] || { color: '#475569', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)' };
        return {
          value: p,
          label: p,
          description: `${n} ticket${n === 1 ? '' : 's'}`,
          badge: (
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: m.bg,
                border: `1px solid ${m.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: m.color,
                fontSize: 9,
              }}
            >
              <FlagOutlined />
            </span>
          ),
        };
      }),
    [analytics.priorityBreakdown]
  );

  const assigneeOptions = useMemo<SearchableDropdownOption[]>(() => {
    const seen = new Map<string, { name: string; email?: string; count: number }>();
    let unassigned = 0;
    allTickets.forEach((t) => {
      if (t.assignee) {
        const cur = seen.get(t.assignee.id);
        if (cur) cur.count++;
        else seen.set(t.assignee.id, { name: t.assignee.name, email: t.assignee.workEmail, count: 1 });
      } else {
        unassigned++;
      }
    });
    const opts: SearchableDropdownOption[] = Array.from(seen.entries()).map(([id, a]) => ({
      value: id,
      label: a.name,
      description: `${a.count} ticket${a.count === 1 ? '' : 's'}`,
      badge: (
        <Avatar
          size={20}
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {initialsOf(a.name)}
        </Avatar>
      ),
    }));
    if (unassigned > 0) {
      opts.unshift({
        value: '__unassigned__',
        label: 'Unassigned',
        description: `${unassigned} ticket${unassigned === 1 ? '' : 's'}`,
        badge: (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              border: '1px dashed var(--border-slate-200)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-slate-400)',
              fontSize: 9,
            }}
          >
            <UserOutlined />
          </span>
        ),
      });
    }
    return opts;
  }, [allTickets, accent]);

  // Selection helpers
  const visibleIds = pagedTickets.map((t) => t.id);
  const selectedSet = new Set(selectedRowKeys);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const someVisibleSelected = !allVisibleSelected && visibleIds.some((id) => selectedSet.has(id));
  const toggleTicket = (id: string) => {
    setSelectedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedRowKeys((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedRowKeys((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };
  const clearSelection = () => setSelectedRowKeys([]);

  // Bulk handlers
  const handleMoveToSprint = async () => {
    if (!selectedSprintId || selectedRowKeys.length === 0) {
      messageApi.warning('Select tickets and a target sprint');
      return;
    }
    try {
      await Promise.all(
        selectedRowKeys.map((ticketId) =>
          updateTicket({
            id: ticketId,
            data: { sprintPlanId: selectedSprintId, bucketId: null },
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      messageApi.success(`${selectedRowKeys.length} ticket(s) moved to sprint`);
      setSelectedRowKeys([]);
      setSelectedSprintId(undefined);
      setSprintPopoverOpen(false);
      refetchTickets();
    } catch (error: any) {
      messageApi.error(`Failed to move tickets: ${error.message || 'Unknown error'}`);
    }
  };

  const handleMoveToTrash = () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: 'Move to trash',
      content: `Move ${selectedRowKeys.length} selected ticket(s) to trash?`,
      okText: 'Move to Trash',
      okType: 'danger',
      onOk: async () => {
        try {
          await moveToTrash(selectedRowKeys);
          queryClient.invalidateQueries({ queryKey: bucketKeys.all });
          queryClient.invalidateQueries({ queryKey: ticketKeys.all });
          setSelectedRowKeys([]);
          refetchTickets();
          messageApi.success(`${selectedRowKeys.length} ticket(s) moved to trash`);
        } catch (error: any) {
          messageApi.error(`Failed to move to trash: ${error.message || 'Unknown error'}`);
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter(null);
    setPriorityFilter(null);
    setAssigneeFilter(null);
  };

  const activeFilterCount =
    (searchText ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (priorityFilter ? 1 : 0) +
    (assigneeFilter ? 1 : 0);

  const sprintPopoverContent = (
    <div className="bd2-sprint-pop">
      <div className="bd2-sprint-pop-head">
        <div
          className="bd2-sprint-pop-icon"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <RocketOutlined />
        </div>
        <div>
          <div className="bd2-sprint-pop-title">Move to Sprint</div>
          <div className="bd2-sprint-pop-sub">
            Reassign {selectedRowKeys.length} ticket(s) to an active or planning sprint.
          </div>
        </div>
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <div className="bd2-sprint-pop-field">
        <span className="bd2-sprint-pop-label">
          <ThunderboltOutlined style={{ fontSize: 9 }} /> Target sprint
        </span>
        <SearchableDropdown
          placeholder={sprintsLoading ? 'Loading sprints…' : 'Select a sprint'}
          options={
            sprints?.map((s) => ({
              value: s.id,
              label: s.version,
              description: s.status === 'active' ? 'Active' : 'Planning',
              badge: <Badge status={s.status === 'active' ? 'processing' : 'default'} />,
            })) || []
          }
          value={selectedSprintId}
          onChange={(v) => setSelectedSprintId(v)}
          disabled={!sprints?.length || sprintsLoading}
          style={{ width: '100%', height: 36, borderRadius: 8 }}
          width={260}
        />
      </div>
      <div className="bd2-sprint-pop-preview">
        <span>
          <FileTextOutlined style={{ color: accent }} /> <b>{selectedRowKeys.length}</b> ticket(s)
        </span>
        <Tooltip title="Selected tickets will be reassigned to the chosen sprint.">
          <InfoCircleOutlined style={{ color: '#94a3b8' }} />
        </Tooltip>
      </div>
      <Button
        type="primary"
        block
        size="small"
        disabled={!selectedSprintId}
        loading={isMovingToSprint}
        onClick={handleMoveToSprint}
        style={{
          fontWeight: 700,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
          border: 'none',
        }}
      >
        Move to Sprint
      </Button>
    </div>
  );

  // ────────────────────────── Loading ──────────────────────────
  if (authLoading || (bucketLoading && !bucket)) {
    return (
      <MainLayout>
        <div className="bd2-page">
          <div className="bd2-header bd2-header-skeleton">
            <Skeleton.Input active size="small" style={{ width: 320, height: 28 }} />
          </div>
          <div className="bd2-content">
            <div className="bd2-kpi-strip">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bd2-kpi">
                  <Skeleton active paragraph={{ rows: 1 }} title={false} />
                </div>
              ))}
            </div>
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bd2-page" style={{ ['--accent' as any]: accent }}>
        {/* ─────────── Sticky Header ─────────── */}
        <header className="bd2-header">
          <span className="bd2-header-stripe" style={{ background: accent }} />
          <div className="bd2-header-left">
            <Tooltip title="Back to Buckets Hub">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/tickets/buckets')}
                className="bd2-back-btn"
              />
            </Tooltip>
            <div
              className="bd2-header-icon"
              style={{
                background: `linear-gradient(135deg, ${accent}22 0%, ${accent}3a 100%)`,
                color: accent,
                borderColor: `${accent}66`,
              }}
            >
              <FolderOpenOutlined />
            </div>
            <div className="bd2-header-text">
              <div className="bd2-header-title-row">
                <Title level={4} className="bd2-header-title">{bucket?.name}</Title>
                {bucket?.userRole === 'owner' && (
                  <Tooltip title="You own this bucket">
                    <CrownOutlined style={{ fontSize: 13, color: '#f59e0b' }} />
                  </Tooltip>
                )}
              </div>
              <div className="bd2-header-meta">
                {bucket?.project ? (
                  <span className="bd2-meta-pill">
                    <ProjectOutlined style={{ fontSize: 9 }} />
                    {bucket.project.name}
                  </span>
                ) : (
                  <span className="bd2-meta-pill muted">Cross-Project</span>
                )}
                {bucket?.isShared ? (
                  <span className="bd2-meta-pill" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.22)', color: '#047857' }}>
                    <GlobalOutlined style={{ fontSize: 9 }} /> Public
                  </span>
                ) : (
                  <span className="bd2-meta-pill" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.22)', color: '#b45309' }}>
                    <LockOutlined style={{ fontSize: 9 }} /> Private
                  </span>
                )}
                {bucket?.description && (
                  <span className="bd2-meta-pill muted" title={bucket.description}>
                    <FileTextOutlined style={{ fontSize: 9 }} />
                    {bucket.description.length > 56 ? `${bucket.description.slice(0, 56)}…` : bucket.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bd2-header-right">
            <div className="bd2-progress-tile">
              <div className="bd2-progress-bar">
                <div
                  className="bd2-progress-fill"
                  style={{ width: `${analytics.completion}%`, background: accent }}
                />
              </div>
              <span className="bd2-progress-text" style={{ color: accent }}>
                {analytics.completion}<span style={{ fontSize: 10 }}>%</span>
              </span>
            </div>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={async () => {
                  setIsRefreshing(true);
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: bucketKeys.all }),
                    refetchBucket(),
                    refetchTickets(),
                  ]);
                  setIsRefreshing(false);
                  messageApi.success('Bucket refreshed');
                }}
                loading={ticketsLoading && !isRefreshing}
                className="bd2-action-btn"
              />
            </Tooltip>
            {canReadActivityLog && bucket && (
              <Tooltip title="Activity history">
                <Button
                  icon={<HistoryIcon size={14} strokeWidth={1.75} />}
                  onClick={() => setHistoryOpen(true)}
                  className="bd2-action-btn"
                />
              </Tooltip>
            )}
          </div>
        </header>

        {bucket && (
          <TransactionHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            entityType="bucket"
            entityId={bucket.id}
            subtitle={bucket.name}
          />
        )}

        {/* ─────────── Content ─────────── */}
        <div className="bd2-content">
          {/* KPI strip */}
          <div className="bd2-kpi-strip">
            {[
              { key: 'total', label: 'Tickets', value: analytics.total, color: accent, icon: <FileTextOutlined /> },
              { key: 'completed', label: 'Completed', value: analytics.completed, color: '#10b981', icon: <CheckCircleFilled /> },
              { key: 'in_progress', label: 'In Progress', value: analytics.inProgress, color: '#3b82f6', icon: <PlayCircleFilled /> },
              { key: 'todo', label: 'To Do', value: analytics.todo, color: '#f59e0b', icon: <ClockCircleOutlined /> },
              { key: 'blocked', label: 'Blocked', value: analytics.blocked, color: '#ef4444', icon: <PauseCircleFilled /> },
              { key: 'assignees', label: 'Assignees', value: analytics.assigneeCount, color: '#64748b', icon: <TeamOutlined /> },
            ].map((k) => (
              <div key={k.key} className="bd2-kpi" style={{ ['--c1' as any]: k.color, ['--c-bg' as any]: `${k.color}14`, ['--c-border' as any]: `${k.color}33` }}>
                <div className="bd2-kpi-icon">{k.icon}</div>
                <div className="bd2-kpi-meta">
                  <Text className="bd2-kpi-value">{k.value}</Text>
                  <Text className="bd2-kpi-label">{k.label}</Text>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Toolbar */}
          <div className="bd2-toolbar">
            {selectedRowKeys.length > 0 ? (
              <div className="bd2-bulk-bar" style={{ borderColor: `${accent}55` }}>
                <div className="bd2-bulk-left">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleAllVisible}
                  />
                  <span className="bd2-bulk-count" style={{ color: accent }}>
                    {selectedRowKeys.length} selected
                  </span>
                  <button className="bd2-bulk-clear" onClick={clearSelection}>Clear</button>
                </div>
                <div className="bd2-bulk-actions">
                  <Popover
                    content={sprintPopoverContent}
                    title={null}
                    trigger="click"
                    open={sprintPopoverOpen}
                    onOpenChange={setSprintPopoverOpen}
                    placement="bottomRight"
                    overlayInnerStyle={{ borderRadius: 12, padding: 12, width: 320 }}
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={<RocketOutlined />}
                      loading={isMovingToSprint}
                      style={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                        border: 'none',
                      }}
                    >
                      Move to Sprint
                    </Button>
                  </Popover>
                  <Popconfirm
                    title="Move to trash?"
                    description={`Move ${selectedRowKeys.length} ticket(s) to trash?`}
                    onConfirm={handleMoveToTrash}
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                      style={{ fontWeight: 700 }}
                    >
                      Move to Trash
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ) : (
              <div className="bd2-filter-bar">
                <div className="bd2-toolbar-left">
                  <Tooltip title="Select all on this page">
                    <span className="bd2-select-all-wrap">
                      <Checkbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </span>
                  </Tooltip>
                  <span className="bd2-toolbar-count">
                    <b>{filteredTickets.length}</b> of <b>{analytics.total}</b>{' '}
                    {analytics.total === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
                <div className="bd2-filter-group">
                  <SearchableDropdown
                    placeholder="Status"
                    options={statusOptions}
                    value={statusFilter || undefined}
                    onChange={(v) => setStatusFilter(v || null)}
                    itemNoun="statuses"
                    style={{ height: 32, minWidth: 140, borderRadius: 8 }}
                    width={240}
                  />
                  <SearchableDropdown
                    placeholder="Priority"
                    options={priorityOptions}
                    value={priorityFilter || undefined}
                    onChange={(v) => setPriorityFilter(v || null)}
                    itemNoun="priorities"
                    style={{ height: 32, minWidth: 140, borderRadius: 8 }}
                    width={220}
                  />
                  <SearchableDropdown
                    placeholder="Assignee"
                    options={assigneeOptions}
                    value={assigneeFilter || undefined}
                    onChange={(v) => setAssigneeFilter(v || null)}
                    itemNoun="assignees"
                    style={{ height: 32, minWidth: 160, borderRadius: 8 }}
                    width={260}
                  />
                  {activeFilterCount > 0 && (
                    <button className="bd2-reset-btn" onClick={resetFilters}>
                      <ReloadOutlined style={{ fontSize: 10 }} />
                      Reset · {activeFilterCount}
                    </button>
                  )}
                </div>
                <div className={`bd2-search ${searchText ? 'active' : ''}`}>
                  <SearchOutlined style={{ color: searchText ? accent : '#94a3b8', fontSize: 13 }} />
                  <Input
                    placeholder="Search by # or title"
                    variant="borderless"
                    style={{ fontSize: 12.5, padding: '4px 0', background: 'transparent' }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ticket list */}
          <div className="bd2-list">
            {ticketsLoading && !pagedTickets.length ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bd2-ticket-row bd2-ticket-row-skel">
                  <Skeleton active paragraph={{ rows: 1 }} title={false} />
                </div>
              ))
            ) : pagedTickets.length === 0 ? (
              <div className="bd2-empty">
                <div className="bd2-empty-icon" style={{ background: `${accent}14`, borderColor: `${accent}33`, color: accent }}>
                  <FolderOpenOutlined style={{ fontSize: 28 }} />
                </div>
                <Title level={5} className="bd2-empty-title">
                  {activeFilterCount > 0 ? 'No tickets match these filters' : 'This bucket is empty'}
                </Title>
                <Text className="bd2-empty-sub">
                  {activeFilterCount > 0
                    ? 'Try adjusting search, status, priority, or assignee filters.'
                    : 'Drag tickets here from a sprint or backlog to start organizing.'}
                </Text>
                {activeFilterCount > 0 && (
                  <Button onClick={resetFilters} style={{ marginTop: 14, fontWeight: 700 }}>
                    Reset filters
                  </Button>
                )}
              </div>
            ) : (
              pagedTickets.map((t) => {
                const sCfg = statusMeta(t.status);
                const pCfg = PRIORITY_META[t.priority];
                const isSelected = selectedSet.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={`bd2-ticket-row ${isSelected ? 'selected' : ''}`}
                    style={isSelected ? { borderColor: accent, background: `${accent}0d` } : undefined}
                  >
                    <span className="bd2-ticket-check" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTicket(t.id)}
                      />
                    </span>
                    <button
                      type="button"
                      className="bd2-ticket-clickable"
                      onClick={() => setOpenTicketId(t.id)}
                    >
                      <span
                        className="bd2-ticket-num"
                        style={{ background: `${accent}10`, color: accent, borderColor: `${accent}33` }}
                      >
                        {t.ticketNumber}
                      </span>
                      <span className="bd2-ticket-title" title={t.title}>{t.title}</span>
                      <span className="bd2-ticket-meta">
                        {pCfg && (
                          <span
                            className="bd2-ticket-prio"
                            style={{ background: pCfg.bg, borderColor: pCfg.border, color: pCfg.color }}
                          >
                            <FlagOutlined style={{ fontSize: 8 }} />
                            {t.priority}
                          </span>
                        )}
                        <span
                          className="bd2-ticket-status"
                          style={{ background: sCfg.bg, borderColor: sCfg.border, color: sCfg.color }}
                        >
                          <span className="bd2-ticket-status-dot" style={{ background: sCfg.color }} />
                          {sCfg.label}
                        </span>
                        {t.assignee ? (
                          <Tooltip title={t.assignee.workEmail || t.assignee.name}>
                            <span className="bd2-ticket-assignee">
                              <Avatar
                                size={20}
                                style={{
                                  background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                                  fontSize: 9,
                                  fontWeight: 800,
                                }}
                              >
                                {initialsOf(t.assignee.name)}
                              </Avatar>
                              <span className="bd2-ticket-assignee-name">{t.assignee.name}</span>
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="bd2-ticket-assignee unassigned">
                            <span className="bd2-ticket-unassigned-dot">
                              <UserOutlined style={{ fontSize: 9 }} />
                            </span>
                            <span className="bd2-ticket-assignee-name muted">Unassigned</span>
                          </span>
                        )}
                        <Tooltip title={dayjs(t.createdAt).format('MMM D, YYYY h:mm A')}>
                          <span className="bd2-ticket-time">
                            <CalendarOutlined style={{ fontSize: 9 }} />
                            {dayjs(t.createdAt).fromNow()}
                          </span>
                        </Tooltip>
                        <span className="bd2-ticket-eye">
                          <EyeOutlined style={{ fontSize: 12 }} />
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky pagination */}
          {!ticketsLoading && filteredTickets.length > 0 && (
            <div className="bd2-pagination">
              <Text className="bd2-pagination-meta">
                <b>{(page - 1) * pageSize + 1}</b>–
                <b>{Math.min(page * pageSize, filteredTickets.length)}</b> of{' '}
                <b>{filteredTickets.length}</b>{' '}
                {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
              </Text>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredTickets.length}
                onChange={(p, s) => {
                  setPage(p);
                  setPageSize(s);
                }}
                showSizeChanger
                pageSizeOptions={[10, 20, 25, 50, 100]}
                size="small"
              />
            </div>
          )}
        </div>

        {openTicketId && (
          <TicketDetailDrawer
            ticketId={openTicketId}
            open={!!openTicketId}
            onClose={() => setOpenTicketId(null)}
            ticketIds={filteredTickets.map((t) => t.id)}
            onNavigate={(id) => setOpenTicketId(id)}
          />
        )}

        <style jsx global>{`
          /* ── Page shell ──────────────────────────────────── */
          .bd2-page {
            margin: 0 -24px;
            background: var(--bg-pure-white);
            min-height: calc(100vh - 64px);
            display: flex;
            flex-direction: column;
          }

          /* ── Sticky header ───────────────────────────────── */
          .bd2-header {
            position: sticky;
            top: 0;
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 12px 24px 12px 28px;
            background: var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .bd2-header {
            background: #0d1117 !important;
            border-bottom-color: #1f2937 !important;
          }
          .bd2-header-stripe {
            position: absolute;
            left: 0;
            top: 10px;
            bottom: 10px;
            width: 3px;
            border-radius: 0 999px 999px 0;
            opacity: 0.85;
          }
          .bd2-header-skeleton {
            justify-content: flex-start;
          }
          .bd2-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            flex: 1;
          }
          .bd2-back-btn {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            color: var(--text-slate-600) !important;
            border: 1px solid var(--border-slate-200) !important;
          }
          .bd2-back-btn:hover {
            color: var(--accent, #3b82f6) !important;
            border-color: var(--accent, #3b82f6) !important;
          }
          [data-theme='dark'] .bd2-back-btn {
            border-color: #2d3748 !important;
            color: #cbd5e1 !important;
          }
          .bd2-header-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: 1px solid;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
          }
          .bd2-header-text {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .bd2-header-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .bd2-header-title.ant-typography {
            margin: 0 !important;
            font-size: 16px !important;
            font-weight: 800 !important;
            letter-spacing: -0.025em;
            color: var(--text-slate-900);
            line-height: 1.2;
          }
          [data-theme='dark'] .bd2-header-title.ant-typography {
            color: #f1f5f9 !important;
          }
          .bd2-header-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            min-width: 0;
          }
          .bd2-meta-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50);
            font-size: 10.5px;
            font-weight: 700;
            color: var(--text-slate-700);
            max-width: 360px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .bd2-meta-pill.muted {
            color: var(--text-slate-500);
          }
          [data-theme='dark'] .bd2-meta-pill {
            background: #1c232e !important;
            border-color: #2d3748 !important;
            color: #cbd5e1 !important;
          }

          .bd2-header-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }
          .bd2-progress-tile {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 6px 12px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            border-radius: 9px;
          }
          [data-theme='dark'] .bd2-progress-tile {
            background: #1c232e !important;
            border-color: #2d3748 !important;
          }
          .bd2-progress-bar {
            position: relative;
            width: 100px;
            height: 6px;
            border-radius: 999px;
            background: var(--border-slate-100);
            overflow: hidden;
          }
          [data-theme='dark'] .bd2-progress-bar {
            background: #2d3748 !important;
          }
          .bd2-progress-fill {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            transition: width 0.3s ease;
          }
          .bd2-progress-text {
            font-size: 13px;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
          }
          .bd2-action-btn {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            background: var(--bg-pure-white) !important;
            border: 1px solid var(--border-slate-200) !important;
            color: var(--text-slate-600) !important;
          }
          .bd2-action-btn:hover {
            color: var(--accent, #3b82f6) !important;
            border-color: var(--accent, #3b82f6) !important;
          }
          [data-theme='dark'] .bd2-action-btn {
            background: #0d1117 !important;
            border-color: #2d3748 !important;
            color: #cbd5e1 !important;
          }

          /* ── Content body ────────────────────────────────── */
          .bd2-content {
            flex: 1;
            padding: 16px 28px 32px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          /* ── KPI strip ───────────────────────────────────── */
          .bd2-kpi-strip {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 10px;
          }
          @media (max-width: 1280px) {
            .bd2-kpi-strip { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 720px) {
            .bd2-kpi-strip { grid-template-columns: repeat(2, 1fr); }
          }
          .bd2-kpi {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            transition: border-color 0.18s ease;
            overflow: hidden;
          }
          .bd2-kpi:hover {
            border-color: var(--c1);
          }
          [data-theme='dark'] .bd2-kpi {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }
          .bd2-kpi-icon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--c-bg);
            border: 1px solid var(--c-border);
            color: var(--c1);
            font-size: 14px;
            flex-shrink: 0;
          }
          .bd2-kpi-meta {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }
          .bd2-kpi-value {
            font-size: 20px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.025em;
            font-variant-numeric: tabular-nums;
            line-height: 1;
          }
          [data-theme='dark'] .bd2-kpi-value {
            color: #f1f5f9 !important;
          }
          .bd2-kpi-label {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-slate-500) !important;
            margin-top: 4px;
          }

          /* ── Sticky toolbar ──────────────────────────────── */
          .bd2-toolbar {
            position: sticky;
            top: 60px;
            z-index: 20;
            background: var(--bg-pure-white);
            padding: 10px 0;
            margin: 0 -28px;
            padding-left: 28px;
            padding-right: 28px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          [data-theme='dark'] .bd2-toolbar {
            background: #0d1117 !important;
            border-bottom-color: #1f2937 !important;
          }
          .bd2-filter-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .bd2-toolbar-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .bd2-select-all-wrap {
            display: inline-flex;
            align-items: center;
            padding: 2px 4px 2px 4px;
          }
          .bd2-toolbar-count {
            font-size: 11.5px;
            font-weight: 600;
            color: var(--text-slate-500);
            letter-spacing: -0.005em;
          }
          .bd2-toolbar-count b {
            color: var(--text-slate-900);
            font-weight: 800;
          }
          [data-theme='dark'] .bd2-toolbar-count b {
            color: #f1f5f9 !important;
          }
          .bd2-filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-left: auto;
          }
          .bd2-reset-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            background: transparent;
            border: 1px dashed var(--border-slate-200);
            border-radius: 999px;
            color: var(--text-slate-500);
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: color 0.12s ease, border-color 0.12s ease;
          }
          .bd2-reset-btn:hover {
            color: var(--accent, #3b82f6);
            border-color: var(--accent, #3b82f6);
          }
          [data-theme='dark'] .bd2-reset-btn {
            border-color: #2d3748 !important;
            color: #94a3b8 !important;
          }
          .bd2-search {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 12px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 8px;
            width: 240px;
            transition: border-color 0.15s ease;
          }
          .bd2-search.active {
            border-color: var(--accent, #3b82f6);
          }
          [data-theme='dark'] .bd2-search {
            background: #161b22 !important;
            border-color: #2d3748 !important;
          }

          /* ── Bulk-action bar ─────────────────────────────── */
          .bd2-bulk-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 12px;
            background: var(--bg-pure-white);
            border: 1.5px solid;
            border-radius: 10px;
            flex-wrap: wrap;
          }
          [data-theme='dark'] .bd2-bulk-bar {
            background: #0d1117 !important;
          }
          .bd2-bulk-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .bd2-bulk-count {
            font-size: 12.5px;
            font-weight: 800;
            letter-spacing: -0.005em;
          }
          .bd2-bulk-clear {
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 3px;
            padding: 2px 4px;
          }
          .bd2-bulk-clear:hover {
            color: var(--text-slate-700);
          }
          .bd2-bulk-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          /* ── Sprint popover ──────────────────────────────── */
          .bd2-sprint-pop { width: 296px; }
          .bd2-sprint-pop-head {
            display: flex;
            align-items: flex-start;
            gap: 10px;
          }
          .bd2-sprint-pop-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 14px;
            flex-shrink: 0;
          }
          .bd2-sprint-pop-title {
            font-size: 13px;
            font-weight: 800;
            color: var(--text-slate-900);
          }
          [data-theme='dark'] .bd2-sprint-pop-title { color: #f1f5f9 !important; }
          .bd2-sprint-pop-sub {
            font-size: 11px;
            color: var(--text-slate-500);
            line-height: 1.4;
            margin-top: 1px;
          }
          .bd2-sprint-pop-field {
            margin-bottom: 10px;
          }
          .bd2-sprint-pop-label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 9.5px;
            font-weight: 800;
            color: var(--text-slate-500);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 5px;
          }
          .bd2-sprint-pop-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 7px 10px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            border-radius: 6px;
            margin-bottom: 10px;
            font-size: 11.5px;
            color: var(--text-slate-700);
          }
          [data-theme='dark'] .bd2-sprint-pop-preview {
            background: #1c232e !important;
            border-color: #2d3748 !important;
            color: #cbd5e1 !important;
          }

          /* ── Ticket list rows ────────────────────────────── */
          .bd2-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .bd2-ticket-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px 8px 10px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            transition: border-color 0.12s ease, background 0.12s ease;
          }
          .bd2-ticket-row:hover {
            border-color: var(--accent, #3b82f6);
          }
          [data-theme='dark'] .bd2-ticket-row {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }
          .bd2-ticket-row.selected {
            border-width: 1.5px;
          }
          .bd2-ticket-row-skel {
            padding: 14px;
          }
          .bd2-ticket-check {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            padding: 4px 2px 4px 6px;
          }
          .bd2-ticket-clickable {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 4px 0;
            background: transparent;
            border: none;
            cursor: pointer;
            font-family: inherit;
            text-align: left;
          }
          .bd2-ticket-num {
            font-family: ui-monospace, "SF Mono", Menlo, Monaco, monospace;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 9px;
            border-radius: 6px;
            border: 1px solid;
            flex-shrink: 0;
            letter-spacing: 0.005em;
          }
          .bd2-ticket-title {
            flex: 1;
            min-width: 0;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-slate-800);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: -0.005em;
          }
          [data-theme='dark'] .bd2-ticket-title {
            color: #e2e8f0 !important;
          }
          .bd2-ticket-meta {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }
          .bd2-ticket-prio,
          .bd2-ticket-status {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.01em;
          }
          .bd2-ticket-status-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
          }
          .bd2-ticket-assignee {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 2px 10px 2px 3px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            border-radius: 999px;
            max-width: 180px;
          }
          .bd2-ticket-assignee.unassigned {
            background: transparent;
            border-style: dashed;
          }
          [data-theme='dark'] .bd2-ticket-assignee {
            background: #1c232e !important;
            border-color: #2d3748 !important;
          }
          .bd2-ticket-assignee-name {
            font-size: 11.5px;
            font-weight: 700;
            color: var(--text-slate-700);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 110px;
          }
          [data-theme='dark'] .bd2-ticket-assignee-name {
            color: #cbd5e1 !important;
          }
          .bd2-ticket-assignee-name.muted {
            color: var(--text-slate-400);
            font-style: italic;
            font-weight: 600;
          }
          .bd2-ticket-unassigned-dot {
            width: 20px;
            height: 20px;
            border-radius: 999px;
            background: var(--bg-pure-white);
            border: 1px dashed var(--border-slate-200);
            color: var(--text-slate-400);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .bd2-ticket-time {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-slate-500);
          }
          .bd2-ticket-eye {
            color: var(--text-slate-400);
            display: inline-flex;
            align-items: center;
          }
          .bd2-ticket-row:hover .bd2-ticket-eye {
            color: var(--accent, #3b82f6);
          }

          /* ── Empty state ─────────────────────────────────── */
          .bd2-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 56px 24px;
            background: var(--bg-pure-white);
            border: 1px dashed var(--border-slate-200);
            border-radius: 14px;
          }
          [data-theme='dark'] .bd2-empty {
            background: #161b22 !important;
            border-color: #2d3748 !important;
          }
          .bd2-empty-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            border: 1px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
          }
          .bd2-empty-title.ant-typography {
            margin: 0 0 6px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900);
          }
          [data-theme='dark'] .bd2-empty-title.ant-typography {
            color: #f1f5f9 !important;
          }
          .bd2-empty-sub {
            font-size: 12.5px !important;
            color: var(--text-slate-500) !important;
            max-width: 360px;
            line-height: 1.5;
          }

          /* ── Sticky pagination ───────────────────────────── */
          .bd2-pagination {
            position: sticky;
            bottom: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: auto -28px -32px;
            padding: 0 28px;
            background: var(--bg-pure-white);
            border-top: 1px solid var(--border-slate-100);
            flex-shrink: 0;
            height: 56px;
          }
          [data-theme='dark'] .bd2-pagination {
            background: #0d1117 !important;
            border-top-color: #1f2937 !important;
          }
          .bd2-pagination-meta {
            font-size: 11.5px !important;
            font-weight: 500 !important;
            color: var(--text-slate-500) !important;
            letter-spacing: -0.005em;
          }
          .bd2-pagination-meta b {
            color: var(--text-slate-900);
            font-weight: 800;
          }
          [data-theme='dark'] .bd2-pagination-meta b {
            color: #f1f5f9 !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
