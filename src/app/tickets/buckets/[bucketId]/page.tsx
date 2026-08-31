'use client';

import NoData from "@/components/common/NoData";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import BucketTicketFilters from "./BucketTicketFilters";
import React, { useState, use, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import MainLayout from '@/components/layout/MainLayout';
import {
  Typography,
  Button,
  Input,
  App,
  Avatar,
  Tooltip,
  Skeleton,
  Pagination,
  Checkbox,
  Popover,
  Badge,
  Divider,
  Space,
} from 'antd';
import {
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  FlagOutlined,
  EyeOutlined,
  UserOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const { data: bucket, isLoading: bucketLoading, refetch: refetchBucket } = useBucket(bucketId);
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useBucketTickets(bucketId, page, pageSize);
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
    return filteredTickets;
  }, [filteredTickets]);

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
      refetchTickets();
    } catch (error: any) {
      messageApi.error(`Failed to move tickets: ${error.message || 'Unknown error'}`);
    }
  };

  /* The card is the shared ConfirmDialog; this only does the work. */
  const handleMoveToTrash = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await moveToTrash(selectedRowKeys);
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      const moved = selectedRowKeys.length;
      setSelectedRowKeys([]);
      refetchTickets();
      messageApi.success(`${moved} ticket(s) moved to trash`);
    } catch (error: any) {
      messageApi.error(`Failed to move to trash: ${error.message || 'Unknown error'}`);
    }
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

  /* The sprint picker rides inside the shared ConfirmDialog rather than a
     hand-rolled popover, so it confirms like every other action. */
  const sprintPickerBody = (
    <div className="bd2-sprint-pick">
      <span className="bd2-sprint-pick-label">
        <ThunderboltOutlined style={{ fontSize: 9 }} /> Target sprint
      </span>
      <SearchableDropdown
        placeholder={sprintsLoading ? 'Loading sprints…' : 'Select a sprint'}
        options={
          sprints?.map((sp) => ({
            value: sp.id,
            label: sp.version,
            description: sp.status === 'active' ? 'Active' : 'Planning',
            badge: <Badge status={sp.status === 'active' ? 'processing' : 'default'} />,
          })) || []
        }
        value={selectedSprintId}
        onChange={(v) => setSelectedSprintId(v)}
        disabled={!sprints?.length || sprintsLoading}
        style={{ width: '100%', height: 34, borderRadius: 8 }}
        width={252}
      />
      <span className="bd2-sprint-pick-note">
        <FileTextOutlined style={{ color: accent }} />
        <b>{selectedRowKeys.length}</b> ticket(s) will move out of this bucket.
      </span>
    </div>
  );

  // ────────────────────────── Loading ──────────────────────────
  if (authLoading || (bucketLoading && !bucket)) {
    return (
      <MainLayout noPadding>
        <div className="bd2-page">
          <div className="bd2-header sc-header bd2-header-skeleton">
            <Skeleton.Input active size="small" style={{ width: 320, height: 26 }} />
          </div>
          <div className="tl-section-head tl-sprint-head-v2">
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
          <div className="bd2-content">
            <div className="bd2-list">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <div className="bd2-page" style={{ ['--accent' as any]: accent }}>
        {/* ── Header row — back, breadcrumb, search, filters ─────────── */}
        <header className="bd2-header saas-header-container sc-header">
          <Tooltip title="Back to Buckets Hub">
            <Button
              type="text"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/tickets/buckets')}
              className="bd2-back-btn"
              aria-label="Back to Buckets Hub"
            />
          </Tooltip>

          <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

          {/* The bucket's place in the tree, where the list pages put their
              project switcher. */}
          <div className="bd2-crumbs">
            <button type="button" className="bd2-crumb" onClick={() => router.push('/tickets/buckets')}>Buckets</button>
            {bucket?.project?.name && (
              <>
                <span className="bd2-sep">›</span>
                <span className="bd2-crumb bd2-crumb--strong">{bucket.project.name}</span>
              </>
            )}
            <span className="bd2-sep">›</span>
            <span className="bd2-crumb-title" title={bucket?.name}>{bucket?.name}</span>
          </div>

          <div className="sc-header-controls">
            <Input
              placeholder="Quick search by # or title..."
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
              className="saas-input"
              style={{ maxWidth: 260, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Space.Compact className="ticket-filter-group">
              <Popover
                content={
                  <BucketTicketFilters
                    filters={{ status: statusFilter || undefined, priority: priorityFilter || undefined, assignee: assigneeFilter || undefined }}
                    onFilterChange={(key: any, val: any) => {
                      if (key === 'status') setStatusFilter(val || null);
                      if (key === 'priority') setPriorityFilter(val || null);
                      if (key === 'assignee') setAssigneeFilter(val || null);
                    }}
                    onReset={resetFilters}
                    statusOptions={statusOptions as any}
                    priorityOptions={priorityOptions as any}
                    assigneeOptions={assigneeOptions as any}
                  />
                }
                trigger="click"
                open={isFilterPanelOpen}
                onOpenChange={setIsFilterPanelOpen}
                placement="bottomLeft"
                overlayClassName="tf-popover-overlay"
                styles={{ body: { padding: 0 } }}
              >
                <Button
                  icon={<FilterOutlined />}
                  className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                  style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Popover>
              <Button
                icon={<ExpandAltOutlined />}
                style={{ height: 30 }}
                aria-label="Expand filters"
                onClick={() => setIsFilterRowOpen((v) => !v)}
              />
            </Space.Compact>
          </div>

          <Space size={10} className="sc-header-right">
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
                style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
            {canReadActivityLog && bucket && (
              <Tooltip title="Activity history">
                <Button
                  icon={<HistoryIcon size={14} strokeWidth={1.75} />}
                  onClick={() => setHistoryOpen(true)}
                  style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>
            )}
          </Space>
        </header>

        {/* ── Inline filter row — the pill strip the Ticket List uses ── */}
        {isFilterRowOpen && (
          <div className="tl-filter-row">
            <div className="tl-filter-row-label">
              <FilterOutlined style={{ fontSize: 11 }} />
              <span>Filters</span>
              <span className="tl-filter-row-count">{activeFilterCount > 0 ? activeFilterCount : '0'}</span>
            </div>
            <div className="tl-filter-row-pills">
              <TicketFilterPill
                icon={<CheckCircleFilled style={{ fontSize: 11 }} />}
                label="Status"
                value={statusFilter || ""}
                options={statusOptions as any}
                onChange={(val: any) => setStatusFilter(val || null)}
                itemNoun="statuses"
                multiple={false}
              />
              <TicketFilterPill
                icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
                label="Priority"
                value={priorityFilter || ""}
                options={priorityOptions as any}
                onChange={(val: any) => setPriorityFilter(val || null)}
                itemNoun="priorities"
                multiple={false}
              />
              <TicketFilterPill
                icon={<UserOutlined style={{ fontSize: 11 }} />}
                label="Assignee"
                value={assigneeFilter || ""}
                options={assigneeOptions as any}
                onChange={(val: any) => setAssigneeFilter(val || null)}
                itemNoun="assignees"
                width={260}
                multiple={false}
                showAvatar
              />
            </div>
            <div className="tl-filter-row-actions">
              {activeFilterCount > 0 && (
                <button type="button" className="tl-filter-row-reset" onClick={resetFilters}>
                  <ReloadOutlined style={{ fontSize: 10 }} />
                  Reset
                </button>
              )}
              <button
                type="button"
                className="tl-filter-row-close"
                onClick={() => setIsFilterRowOpen(false)}
                aria-label="Close filters"
                title="Close filters"
              >
                <CloseOutlined style={{ fontSize: 10 }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Overview banner — the Ticket List's sprint head, reading this
             bucket: what it holds and how much of it is done. ──────────── */}
        <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
          <div className="tl-sprint-row1">
            <div className="tl-sprint-title-block">
              <span className="tl-sprint-dot" style={{ background: accent, boxShadow: `0 0 0 3px ${accent}33` }} />
              <span className="tl-sprint-title bd2-banner-title">{bucket?.name}</span>
              <span className="tl-sprint-tags">
                <span className="tl-sprint-tag tl-sprint-tag-neutral">{analytics.total} TICKETS</span>
                {bucket?.isShared
                  ? <span className="tl-sprint-tag tl-sprint-tag-active">PUBLIC</span>
                  : <span className="tl-sprint-tag tl-sprint-tag-neutral">PRIVATE</span>}
                {bucket?.userRole === 'owner' && (
                  <span className="tl-sprint-tag tl-sprint-tag-running">OWNER</span>
                )}
              </span>
            </div>
          </div>

          <div className="tl-sprint-row2">
            <span className="tl-sprint-meta"><b>{analytics.completed}</b> completed</span>
            <span className="tl-sprint-meta"><b>{analytics.inProgress}</b> in progress</span>
            <span className="tl-sprint-meta"><b>{analytics.todo}</b> to do</span>
            <span className="tl-sprint-meta"><b>{analytics.blocked}</b> blocked</span>
            <span className="tl-sprint-meta"><b>{analytics.assigneeCount}</b> assignees</span>
            {bucket?.description && (
              <span className="tl-sprint-meta" title={bucket.description}>
                <FileTextOutlined style={{ fontSize: 10 }} />
                {bucket.description.length > 48 ? `${bucket.description.slice(0, 48)}…` : bucket.description}
              </span>
            )}
          </div>

          <div className="tl-sprint-row3">
            <div className="tl-sprint-progress-bar">
              <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, analytics.completion)}%` }} />
            </div>
            <span className="tl-sprint-progress-pct">{analytics.completion}%</span>
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

        {/* ─────────── Content ─────────── */}
        <div className="bd2-content">
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
                  <ConfirmDialog
                    tone="primary"
                    icon={<RocketOutlined />}
                    title="Move to Sprint"
                    description={sprintPickerBody}
                    confirmText="Move to Sprint"
                    confirmDisabled={!selectedSprintId}
                    width={300}
                    onConfirm={handleMoveToSprint}
                    onCancel={() => setSelectedSprintId(undefined)}
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={<RocketOutlined />}
                      loading={isMovingToSprint}
                      style={{ fontWeight: 700 }}
                    >
                      Move to Sprint
                    </Button>
                  </ConfirmDialog>
                  <ConfirmDialog
                    tone="danger"
                    title="Move to trash?"
                    description={`${selectedRowKeys.length} ticket(s) will be moved to trash. You can restore them from there.`}
                    confirmText="Move to Trash"
                    onConfirm={handleMoveToTrash}
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
                  </ConfirmDialog>
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
                    <b>{filteredTickets.length}</b> of <b>{ticketsData?.pagination?.total || 0}</b>{' '}
                    {(ticketsData?.pagination?.total || 0) === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
                {activeFilterCount > 0 && (
                  <button className="bd2-reset-btn" onClick={resetFilters}>
                    <ReloadOutlined style={{ fontSize: 10 }} />
                    Reset · {activeFilterCount}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ticket list */}
          <div className="bd2-list">
            {(ticketsLoading || isRefreshing) ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bd2-ticket-row bd2-ticket-row-skel">
                  <Skeleton active paragraph={{ rows: 1 }} title={false} />
                </div>
              ))
            ) : pagedTickets.length === 0 ? (
              <NoData description={
                <div className="bd2-empty pp-empty">
                  <div className="bd2-empty-icon pp-empty-orb" style={{ background: `${accent}14`, borderColor: `${accent}33`, color: accent }}>
                    <FolderOpenOutlined style={{ fontSize: 28 }} />
                  </div>
                  <Title level={5} className="bd2-empty-title pp-empty-title">
                    {activeFilterCount > 0 ? 'No tickets match these filters' : 'This bucket is empty'}
                  </Title>
                  <Text className="bd2-empty-sub pp-empty-sub">
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
              } />
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
          {!ticketsLoading && !isRefreshing && filteredTickets.length > 0 && (
            <div className="bd2-pagination">
              <Text className="bd2-pagination-meta">
                <b>{(page - 1) * pageSize + 1}</b>–
                <b>{Math.min(page * pageSize, ticketsData?.pagination?.total || 0)}</b> of{' '}
                <b>{ticketsData?.pagination?.total || 0}</b>{' '}
                {(ticketsData?.pagination?.total || 0) === 1 ? 'ticket' : 'tickets'}
              </Text>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={ticketsData?.pagination?.total || 0}
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
            margin: 0;
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

          /* ── Content body ────────────────────────────────── */
          .bd2-content {
            flex: 1;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0;
          }

          /* ── Header row, matched to the Ticket List ─────────────── */
          .bd2-header.sc-header {
            position: sticky;
            top: 0;
            z-index: 100;
            height: auto;
            min-height: 0;
            margin: 0;
            padding: 9.7px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            background: var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-200);
            flex-shrink: 0;
          }
          [data-theme='dark'] .bd2-header.sc-header { background: #0f1419; border-bottom-color: #1f2937; }
          .sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
          .sc-header-right { flex-shrink: 0; }
          .bd2-back-btn {
            width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
            display: inline-flex !important; align-items: center; justify-content: center;
            color: var(--text-slate-500);
          }
          .bd2-back-btn:hover { background: var(--bg-slate-100); color: #2563eb; }

          .bd2-crumbs { display: flex; align-items: center; gap: 6px; min-width: 0; max-width: 40%; }
          .bd2-crumb {
            font-size: 12px; font-weight: 600; color: var(--text-slate-500);
            background: none; border: none; padding: 0; cursor: pointer; white-space: nowrap;
            font-family: inherit;
          }
          button.bd2-crumb:hover { color: #2563eb; text-decoration: underline; }
          .bd2-crumb--strong { color: var(--text-slate-700); cursor: default; }
          .bd2-sep { color: var(--text-slate-300); font-size: 11px; flex-shrink: 0; }
          .bd2-crumb-title {
            font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em;
            min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          [data-theme='dark'] .bd2-crumb-title { color: #f1f5f9; }
          [data-theme='dark'] .bd2-crumb--strong { color: #cbd5e1; }

          /* ── Overview banner ────────────────────────────────────── */
          .tl-section-head {
            padding: 10px 16px;
            background: var(--bg-slate-50);
            border-bottom: 1px solid var(--border-slate-200);
            flex-shrink: 0;
          }
          [data-theme='dark'] .tl-section-head { background: #0f1419; border-bottom-color: #1f2937; }
          .tl-sprint-head-v2 { display: flex; flex-direction: column; gap: 6px; }
          .tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
          .tl-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
          .tl-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
          .bd2-banner-title {
            font-size: 14px; font-weight: 800; color: var(--text-slate-900);
            letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          [data-theme='dark'] .bd2-banner-title { color: #f1f5f9; }
          .tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
          .tl-sprint-tag {
            display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
            font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px;
            border: 1px solid transparent; text-transform: uppercase; line-height: 1;
          }
          .tl-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16,185,129,0.32); }
          .tl-sprint-tag-neutral { background: transparent; color: #64748b; border-color: rgba(100,116,139,0.32); }
          .tl-sprint-tag-running { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }
          [data-theme='dark'] .tl-sprint-tag-active { color: #34d399; }

          .tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
          .tl-sprint-meta {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
          }
          .tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
          [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
          [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

          .tl-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 15px; }
          .tl-sprint-progress-bar {
            flex: 1 1 auto; position: relative; height: 6px;
            background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px;
          }
          [data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
          .tl-sprint-progress-fill {
            position: absolute; inset: 0;
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            border-radius: 999px; transition: width 0.4s ease;
          }
          .tl-sprint-progress-pct {
            flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900);
            font-variant-numeric: tabular-nums; min-width: 36px; text-align: right;
          }
          [data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

          /* ── Inline filter row ──────────────────────────────────── */
          .tl-filter-row {
            display: flex; align-items: center; gap: 10px; padding: 8px 16px;
            background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
            flex-shrink: 0;
          }
          [data-theme='dark'] .tl-filter-row { background: #0f1419; border-bottom-color: #1f2937; }
          .tl-filter-row-label {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 10.5px; font-weight: 800; color: var(--text-slate-500);
            text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
          }
          .tl-filter-row-count {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 18px; height: 18px; padding: 0 6px;
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            color: var(--text-slate-500); border-radius: 999px;
            font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
          }
          .tl-filter-row-pills { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
          .tl-filter-row-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
          .tl-filter-row-reset {
            display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
            background: transparent; border: 1px dashed var(--border-slate-200); border-radius: 8px;
            font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-slate-500); cursor: pointer;
            transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
          }
          .tl-filter-row-reset:hover {
            color: #1d4ed8; border-color: rgba(59,130,246,0.45);
            background: rgba(59,130,246,0.06); border-style: solid;
          }
          .tl-filter-row-close {
            display: inline-flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; background: transparent;
            border: 1px solid var(--border-slate-200); border-radius: 8px;
            color: var(--text-slate-500); cursor: pointer;
            transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
          }
          .tl-filter-row-close:hover { color: var(--text-slate-900); background: var(--bg-pure-white); border-color: var(--text-slate-400); }
          [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
          [data-theme='dark'] .tl-filter-row-count { background: #111720; border-color: #2d3748; color: #cbd5e1; }
          [data-theme='dark'] .tl-filter-row-reset,
          [data-theme='dark'] .tl-filter-row-close { border-color: #2d3748; color: #94a3b8; }

          /* The selection bar and the list keep their own gutter. */
          .bd2-toolbar { padding: 10px 16px 0; }
          .bd2-list { padding: 10px 16px 16px; }

          /* The sprint picker, inside the shared confirm card. */
          .bd2-sprint-pick { display: flex; flex-direction: column; gap: 7px; margin-top: 4px; }
          .bd2-sprint-pick-label {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 9.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
            color: var(--text-slate-400);
          }
          .bd2-sprint-pick-note {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 11px; color: var(--text-slate-400);
          }
          .bd2-sprint-pick-note b { color: var(--text-slate-700); font-weight: 700; }

          @media (max-width: 900px) {
            .tl-filter-row-label { display: none; }
            .tl-sprint-row2, .tl-sprint-row3 { padding-left: 0; }
            .bd2-crumbs { max-width: 100%; }
            .bd2-crumb, .bd2-sep { display: none; }
            .bd2-crumb-title { display: block; }
          }

          /* ── Sticky toolbar ──────────────────────────────── */
          .bd2-toolbar {
            position: sticky;
            top: 60px;
            z-index: 20;
            background: var(--bg-pure-white);
            padding: 10px 16px 0;
            margin: 0;
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
            margin: auto 0 0 0;
            padding: 0 16px;
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
