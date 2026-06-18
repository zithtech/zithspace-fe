"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Empty,
  Tooltip,
  Alert,
  App,
  Modal,
} from "antd";
import {
  SendOutlined,
  DeleteOutlined,
  RocketOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  SearchableDropdown,
  type SearchableDropdownOption,
} from "@/components/common/SearchableDropdown";
import { TicketDetailDrawer } from "../../drawer/TicketDetailDrawer";
import type { ColumnsType } from "antd/es/table";
import {
  SprintCompletionSummary,
  BulkResolveAction,
  BulkActionType,
} from "@/services/sprintCompletionService";
import { useBulkResolveTickets } from "@/hooks/useSprintCompletion";
import SprintCompletionService from "@/services/sprintCompletionService";
import { SprintCreationForm, type SprintFormData } from "../SprintCreationForm";
import { BucketCreationForm, type BucketFormData } from "../BucketCreationForm";
import ReleasePlanService from "@/services/releasePlanService";
import BucketService from "@/services/bucketService";

const { Text } = Typography;

interface PendingTicketsTabProps {
  sprintId: string;
  summary: SprintCompletionSummary;
  onActionComplete: () => void;
}

const PRIORITY_CHIP: Record<string, string> = {
  HIGH: 'sc-chip-pri-high',
  P1: 'sc-chip-pri-high',
  MEDIUM: 'sc-chip-pri-med',
  P2: 'sc-chip-pri-med',
  LOW: 'sc-chip-pri-low',
  P3: 'sc-chip-pri-low',
};

const STATUS_CHIP_CLASS = (status: string) => {
  if (status === 'completed') return 'sc-chip-status-success';
  if (status === 'in_progress') return 'sc-chip-status-progress';
  return 'sc-chip-status-default';
};

export const PendingTicketsTab: React.FC<PendingTicketsTabProps> = ({
  sprintId,
  summary,
  onActionComplete,
}) => {
  const { modal, message } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeBulkAction, setActiveBulkAction] = useState<{
    action: BulkActionType;
    destinationId?: string;
    destinationName?: string;
  } | null>(null);

  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [creatingSprintLoading, setCreatingSprintLoading] = useState(false);
  const [creatingBucketLoading, setCreatingBucketLoading] = useState(false);

  const bulkResolve = useBulkResolveTickets();

  const handleCreateSprint = async (data: SprintFormData) => {
    try {
      setCreatingSprintLoading(true);
      const newSprint = await ReleasePlanService.createReleasePlan({
        version: data.name,
        description: data.goal || '',
        projectId: summary.sprint.project.id,
        releaseDate: data.endDate.format('YYYY-MM-DD'),
        startDate: data.startDate.format('YYYY-MM-DD'),
        endDate: data.endDate.format('YYYY-MM-DD'),
        type: 'sprint_plan',
      });
      setShowSprintModal(false);
      message.success(`Sprint "${newSprint.version}" created successfully!`);
      onActionComplete();
    } catch (error: any) {
      message.error(error.message || 'Failed to create sprint');
    } finally {
      setCreatingSprintLoading(false);
    }
  };

  const handleCreateBucket = async (data: BucketFormData) => {
    try {
      setCreatingBucketLoading(true);
      const newBucket = await BucketService.createBucket({
        name: data.name,
        description: data.description || '',
        projectId: summary.sprint.project.id,
        isShared: true,
      });
      setShowBucketModal(false);
      message.success(`Bucket "${newBucket.name}" created successfully!`);
      onActionComplete();
    } catch (error: any) {
      message.error(error.message || 'Failed to create bucket');
    } finally {
      setCreatingBucketLoading(false);
    }
  };

  const handleBulkAction = (action: BulkActionType, destinationId?: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets first');
      return;
    }

    if ((action === 'move_to_sprint' || action === 'move_to_bucket') && !destinationId) {
      message.error(`Please select a destination for ${SprintCompletionService.getActionLabel(action)}`);
      return;
    }

    let destinationName = '';
    if (destinationId) {
      if (action === 'move_to_sprint') {
        const sprint = summary.availableDestinations.sprints.find((s) => s.id === destinationId);
        destinationName = sprint?.name || '';
      } else if (action === 'move_to_bucket') {
        const bucket = summary.availableDestinations.buckets.find((b) => b.id === destinationId);
        destinationName = bucket?.name || '';
      }
    }

    setActiveBulkAction({ action, destinationId, destinationName });
    message.success(
      `Ready to ${SprintCompletionService.getActionLabel(action).toLowerCase()}${destinationName ? ` to ${destinationName}` : ''
      } for ${selectedRowKeys.length} selected ticket(s). Click "Resolve" to apply.`
    );
  };

  const handleSubmit = async () => {
    if (!activeBulkAction || selectedRowKeys.length === 0) {
      message.warning('Please select tickets and choose an action');
      return;
    }

    const actions: BulkResolveAction[] = selectedRowKeys.map((ticketId) => ({
      ticketId: ticketId as string,
      action: activeBulkAction.action,
      destinationId: activeBulkAction.destinationId,
    }));

    const validation = SprintCompletionService.validateBulkActions(actions);
    if (!validation.valid) {
      validation.errors.forEach((error) => message.error(error));
      return;
    }

    const actionBreakdown = {
      backlog: actions.filter((a) => a.action === 'move_to_backlog').length,
      sprint: actions.filter((a) => a.action === 'move_to_sprint').length,
      bucket: actions.filter((a) => a.action === 'move_to_bucket').length,
      trash: actions.filter((a) => a.action === 'move_to_trash').length,
    };

    modal.confirm({
      title: 'Confirm Bulk Resolution',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            You are about to resolve <strong>{actions.length}</strong> pending ticket(s):
          </p>
          <ul style={{ marginTop: 12 }}>
            {actionBreakdown.backlog > 0 && <li>Move to Backlog: {actionBreakdown.backlog}</li>}
            {actionBreakdown.sprint > 0 && <li>Move to Sprint: {actionBreakdown.sprint}</li>}
            {actionBreakdown.bucket > 0 && <li>Move to Bucket: {actionBreakdown.bucket}</li>}
            {actionBreakdown.trash > 0 && <li>Move to Trash: {actionBreakdown.trash}</li>}
          </ul>
          <p style={{ marginTop: 12, color: '#8c8c8c' }}>This action cannot be easily undone. Continue?</p>
        </div>
      ),
      okText: 'Resolve Tickets',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await bulkResolve.mutateAsync({ sprintId, actions });
          setSelectedRowKeys([]);
          setActiveBulkAction(null);
          message.success(`${actions.length} ticket(s) resolved successfully`);
          onActionComplete();
        } catch (error: any) {
          message.error(error.message || 'Failed to resolve tickets');
        }
      },
    });
  };

  const columns: ColumnsType<any> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 120,
      fixed: 'left',
      render: (text, record) => (
        <span
          className="sc-chip sc-chip-ticket sc-chip-ticket-link"
          onClick={() => setSelectedTicketId(record.id)}
          role="button"
          tabIndex={0}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 280,
      render: (title) => (
        <Tooltip title={title}>
          <span style={{ fontWeight: 600, color: 'var(--sc-text)' }}>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <span className={`sc-chip ${STATUS_CHIP_CLASS(status)}`}>{(status || '').replace('_', ' ')}</span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: string) => (
        <span className={`sc-chip ${PRIORITY_CHIP[priority] || 'sc-chip-status-default'}`}>{priority || '—'}</span>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'storyPoint',
      key: 'storyPoint',
      width: 90,
      align: 'center',
      render: (points) => <span className="sc-points-pill">{points ?? 0}</span>,
    },
    {
      title: 'Assignee',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      width: 160,
      ellipsis: true,
      render: (name) =>
        name ? <Text style={{ color: 'var(--sc-text)' }}>{name}</Text> : <Text type="secondary">Unassigned</Text>,
    },
  ];

  const pendingTickets = summary?.tickets?.pending || [];
  const hasPendingTickets = pendingTickets.length > 0;
  const hasSelection = selectedRowKeys.length > 0;

  const sprintOptions: SearchableDropdownOption[] = [
    ...summary.availableDestinations.sprints.map((s) => ({
      value: s.id,
      label: s.version || s.name,
    })),
    {
      value: '__create_new__',
      label: 'Create new sprint',
      description: 'Add a new sprint plan',
      badge: <PlusOutlined />,
      pinned: true,
    },
  ];

  const bucketOptions: SearchableDropdownOption[] = [
    ...summary.availableDestinations.buckets.map((b) => ({
      value: b.id,
      label: b.name,
    })),
    {
      value: '__create_new__',
      label: 'Create new bucket',
      description: 'Add a new bucket',
      badge: <PlusOutlined />,
      pinned: true,
    },
  ];

  return (
    <div className="sc-tab">
      {!hasPendingTickets ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            background: 'var(--sc-surface)',
            border: '1px solid var(--sc-border)',
            borderRadius: 14,
            boxShadow: 'var(--sc-shadow-sm)',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ fontSize: 14, color: 'var(--sc-text-muted)' }}>
                All tickets have been resolved — you're ready to complete this sprint.
              </span>
            }
          />
        </div>
      ) : (
        <>
          {(summary.availableDestinations.sprints.length === 0 ||
            summary.availableDestinations.buckets.length === 0) && (
              <Alert
                message={<strong style={{ fontSize: 13 }}>Limited resolution options</strong>}
                description={
                  <Space direction="vertical" size={2}>
                    {summary.availableDestinations.sprints.length === 0 && (
                      <Text style={{ fontSize: 12 }}>
                        • No upcoming sprints available. Move tickets to Backlog or Trash, or create a new sprint.
                      </Text>
                    )}
                    {summary.availableDestinations.buckets.length === 0 && (
                      <Text style={{ fontSize: 12 }}>
                        • No buckets configured. Create a bucket to organize tickets.
                      </Text>
                    )}
                  </Space>
                }
                type="info"
                showIcon
                style={{ marginBottom: 12, borderRadius: 12, border: '1px solid rgba(37, 99, 235, 0.3)' }}
              />
            )}

          {/* Toolbar */}
          <div className="sc-toolbar">
            <div>
              <div className="sc-toolbar-title">Resolve Pending Tickets</div>
              <div className="sc-toolbar-sub">
                {hasSelection ? (
                  <>
                    Selected <b>{selectedRowKeys.length}</b> of {pendingTickets.length}
                  </>
                ) : (
                  <>
                    {pendingTickets.length} ticket{pendingTickets.length === 1 ? '' : 's'} need resolution
                  </>
                )}
              </div>
            </div>

            <div className="sc-toolbar-actions">
              {hasSelection ? (
                <>
                  <Tooltip title="Move to Backlog">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => handleBulkAction('move_to_backlog')}
                      className="sc-action-btn"
                    >
                      Move to Backlog
                    </Button>
                  </Tooltip>

                  <SearchableDropdown
                    placeholder="Move to Sprint"
                    searchPlaceholder="Search sprints"
                    itemNoun="sprints"
                    style={{ width: 180 }}
                    width={320}
                    avatarColor="#2563eb"
                    allowClear={false}
                    value={undefined}
                    options={sprintOptions}
                    onChange={(value) => {
                      if (!value) return;
                      if (value === '__create_new__') setShowSprintModal(true);
                      else handleBulkAction('move_to_sprint', value);
                    }}
                  />

                  <SearchableDropdown
                    placeholder="Move to Bucket"
                    searchPlaceholder="Search buckets"
                    itemNoun="buckets"
                    style={{ width: 180 }}
                    width={320}
                    avatarColor="#2563eb"
                    allowClear={false}
                    value={undefined}
                    options={bucketOptions}
                    onChange={(value) => {
                      if (!value) return;
                      if (value === '__create_new__') setShowBucketModal(true);
                      else handleBulkAction('move_to_bucket', value);
                    }}
                  />

                  <Tooltip title="Move to Trash">
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={() => handleBulkAction('move_to_trash')}
                      className="sc-action-btn sc-action-btn-danger"
                    />
                  </Tooltip>

                  {activeBulkAction && (
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSubmit}
                      loading={bulkResolve.isPending}
                      className="sc-resolve-btn"
                    >
                      Resolve {selectedRowKeys.length}
                    </Button>
                  )}
                </>
              ) : (
                <span className="sc-toolbar-empty">Select tickets below to take action</span>
              )}
            </div>
          </div>

          {/* Active action banner */}
          {activeBulkAction && hasSelection && (
            <div className="sc-action-banner">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--sc-text)' }}>
                <RocketOutlined style={{ color: 'var(--sc-brand)', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Pending action:</span>
                <span className="sc-action-banner-tag">
                  {SprintCompletionService.getActionLabel(activeBulkAction.action)}
                  {activeBulkAction.destinationName && ` → ${activeBulkAction.destinationName}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--sc-text-muted)' }}>
                  for {selectedRowKeys.length} ticket(s)
                </span>
              </span>
              <Button type="text" size="small" onClick={() => setActiveBulkAction(null)} style={{ color: 'var(--sc-brand)' }}>
                Cancel action
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="sc-table-shell">
            <Table
              columns={columns}
              dataSource={pendingTickets}
              rowKey="id"
              pagination={{
                pageSize,
                total: pendingTickets.length,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                onShowSizeChange: (_current, size) => setPageSize(size),
                onChange: (_page, size) => {
                  if (size !== pageSize) setPageSize(size);
                },
                showTotal: (total) => (
                  <Text style={{ fontSize: 12, color: 'var(--sc-text-muted)' }}>
                    Total <b style={{ color: 'var(--sc-text)' }}>{total}</b> pending
                  </Text>
                ),
              }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              scroll={{ x: 1000, y: 'calc(90vh - 400px)' }}
              size="middle"
            />
          </div>

          <Modal
            title={null}
            open={showSprintModal}
            onCancel={() => setShowSprintModal(false)}
            footer={null}
            width={680}
            centered
            destroyOnHidden
            className="sprint-creation-modal"
            styles={{
              body: { padding: 0 },
              content: { padding: 0, borderRadius: 14, overflow: "hidden" },
            }}
          >
            <SprintCreationForm
              projectId={summary.sprint.project.id}
              loading={creatingSprintLoading}
              onSubmit={handleCreateSprint}
              onCancel={() => setShowSprintModal(false)}
            />
          </Modal>

          <Modal
            title={null}
            open={showBucketModal}
            onCancel={() => setShowBucketModal(false)}
            footer={null}
            width={560}
            centered
            destroyOnHidden
            className="sprint-creation-modal"
            styles={{
              body: { padding: 0 },
              content: { padding: 0, borderRadius: 14, overflow: "hidden" },
            }}
          >
            <BucketCreationForm
              projectId={summary.sprint.project.id}
              loading={creatingBucketLoading}
              onSubmit={handleCreateBucket}
              onCancel={() => setShowBucketModal(false)}
            />
          </Modal>
        </>
      )}

      <TicketDetailDrawer
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketIds={pendingTickets.map((t) => t.id)}
        onNavigate={setSelectedTicketId}
      />
    </div>
  );
};

export default PendingTicketsTab;
