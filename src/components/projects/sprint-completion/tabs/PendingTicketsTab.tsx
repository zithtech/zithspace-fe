"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Typography,
  Card,
  Empty,
  Tooltip,
  Badge,
  Alert,
  App,
  Modal,
  Dropdown,
  Divider,
} from "antd";
import {
  SendOutlined,
  DeleteOutlined,
  FolderOutlined,
  RocketOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SprintCompletionSummary, BulkResolveAction, BulkActionType } from "@/services/sprintCompletionService";
import { useBulkResolveTickets } from "@/hooks/useSprintCompletion";
import { useCreateBucket } from "@/hooks/useBuckets";
import SprintCompletionService from "@/services/sprintCompletionService";
import { SprintSelector } from "../SprintSelector";
import { BucketSelector } from "../BucketSelector";
import { SprintCreationForm, type SprintFormData } from "../SprintCreationForm";
import { BucketCreationForm, type BucketFormData } from "../BucketCreationForm";
import ReleasePlanService, { type ReleasePlan } from "@/services/releasePlanService";
import BucketService, { type Bucket } from "@/services/bucketService";

const { Text } = Typography;
const { Option } = Select;

interface PendingTicketsTabProps {
  sprintId: string;
  summary: SprintCompletionSummary;
  onActionComplete: () => void;
}

export const PendingTicketsTab: React.FC<PendingTicketsTabProps> = ({
  sprintId,
  summary,
  onActionComplete,
}) => {
  const { modal, message } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeBulkAction, setActiveBulkAction] = useState<{
    action: BulkActionType;
    destinationId?: string;
    destinationName?: string;
  } | null>(null);
  
  // Modal state for creation forms
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [creatingSprintLoading, setCreatingSprintLoading] = useState(false);
  const [creatingBucketLoading, setCreatingBucketLoading] = useState(false);
  
  const bulkResolve = useBulkResolveTickets();

  // Handle sprint creation
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
      message.success(`Sprint "${newSprint.version}" created successfully! You can now select it from the dropdown.`);
      // Refresh the summary to update available sprints list
      onActionComplete();
    } catch (error: any) {
      message.error(error.message || 'Failed to create sprint');
    } finally {
      setCreatingSprintLoading(false);
    }
  };

  // Handle bucket creation
  const handleCreateBucket = async (data: BucketFormData) => {
    try {
      setCreatingBucketLoading(true);
      const newBucket = await BucketService.createBucket({
        name: data.name,
        description: data.description || '',
        projectId: summary.sprint.project.id,
      });
      setShowBucketModal(false);
      message.success(`Bucket "${newBucket.name}" created successfully! You can now select it from the dropdown.`);
      // Refresh the summary to update available buckets list
      onActionComplete();
    } catch (error: any) {
      message.error(error.message || 'Failed to create bucket');
    } finally {
      setCreatingBucketLoading(false);
    }
  };

  // Set bulk action to apply to selected tickets
  const handleBulkAction = (action: BulkActionType, destinationId?: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select tickets first");
      return;
    }
    
    if ((action === 'move_to_sprint' || action === 'move_to_bucket') && !destinationId) {
      message.error(`Please select a destination for ${SprintCompletionService.getActionLabel(action)}`);
      return;
    }
    
    // Get destination name for display
    let destinationName = '';
    if (destinationId) {
      if (action === 'move_to_sprint') {
        const sprint = summary.availableDestinations.sprints.find(s => s.id === destinationId);
        destinationName = sprint?.name || '';
      } else if (action === 'move_to_bucket') {
        const bucket = summary.availableDestinations.buckets.find(b => b.id === destinationId);
        destinationName = bucket?.name || '';
      }
    }
    
    setActiveBulkAction({ action, destinationId, destinationName });
    message.success(
      `Ready to ${SprintCompletionService.getActionLabel(action).toLowerCase()}${destinationName ? ` to ${destinationName}` : ''} for ${selectedRowKeys.length} selected ticket(s). Click "Resolve" to apply.`
    );
  };

  // Submit bulk resolve
  const handleSubmit = async () => {
    if (!activeBulkAction || selectedRowKeys.length === 0) {
      message.warning("Please select tickets and choose an action");
      return;
    }

    // Build actions for all selected tickets
    const actions: BulkResolveAction[] = selectedRowKeys.map((ticketId) => ({
      ticketId: ticketId as string,
      action: activeBulkAction.action,
      destinationId: activeBulkAction.destinationId,
    }));

    // Validate actions
    const validation = SprintCompletionService.validateBulkActions(actions);
    if (!validation.valid) {
      validation.errors.forEach((error) => message.error(error));
      return;
    }

    // Calculate action breakdown
    const actionBreakdown = {
      backlog: actions.filter(a => a.action === 'move_to_backlog').length,
      sprint: actions.filter(a => a.action === 'move_to_sprint').length,
      bucket: actions.filter(a => a.action === 'move_to_bucket').length,
      trash: actions.filter(a => a.action === 'move_to_trash').length,
    };

    modal.confirm({
      title: "Confirm Bulk Resolution",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>You are about to resolve <strong>{actions.length}</strong> pending ticket(s):</p>
          <ul style={{ marginTop: 12 }}>
            {actionBreakdown.backlog > 0 && <li>Move to Backlog: {actionBreakdown.backlog}</li>}
            {actionBreakdown.sprint > 0 && <li>Move to Sprint: {actionBreakdown.sprint}</li>}
            {actionBreakdown.bucket > 0 && <li>Move to Bucket: {actionBreakdown.bucket}</li>}
            {actionBreakdown.trash > 0 && <li>Move to Trash: {actionBreakdown.trash}</li>}
          </ul>
          <p style={{ marginTop: 12, color: '#8c8c8c' }}>This action cannot be easily undone. Continue?</p>
        </div>
      ),
      okText: "Resolve Tickets",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await bulkResolve.mutateAsync({ sprintId, actions });
          setSelectedRowKeys([]);
          setActiveBulkAction(null);
          message.success(`${actions.length} ticket(s) resolved successfully`);
          onActionComplete();
        } catch (error: any) {
          message.error(error.message || "Failed to resolve tickets");
        }
      },
    });
  };

  // Table columns
  const columns: ColumnsType<any> = [
    {
      title: "Ticket",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 120,
      fixed: "left",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      width: 250,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : status === 'in_progress' ? 'processing' : 'default'}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'orange' : 'default'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: "Points",
      dataIndex: "storyPoint",
      key: "storyPoint",
      width: 80,
      align: "center",
      render: (points) => (
        <Badge count={points} showZero style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: "Assignee",
      dataIndex: ["assignee", "name"],
      key: "assignee",
      width: 150,
      ellipsis: true,
      render: (name) => name || <Text type="secondary">Unassigned</Text>,
    },
  ];

  const pendingTickets = summary?.tickets?.pending || [];
  const hasPendingTickets = pendingTickets.length > 0;

  return (
    <div style={{ padding: 24, height: "calc(85vh - 220px)", overflow: "auto" }}>
      {!hasPendingTickets ? (
        <Empty
          description="No pending tickets"
          style={{ marginTop: 100 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Empty State Warning */}
          {(summary.availableDestinations.sprints.length === 0 ||
            summary.availableDestinations.buckets.length === 0) && (
            <Alert
              message="Limited Resolution Options"
              description={
                <Space direction="vertical" size={4}>
                  {summary.availableDestinations.sprints.length === 0 && (
                    <Text>• No upcoming sprints available. You can move tickets to Backlog or Trash.</Text>
                  )}
                  {summary.availableDestinations.buckets.length === 0 && (
                    <Text>• No buckets found. Create a bucket in the Buckets page to organize tickets.</Text>
                  )}
                </Space>
              }
              type="warning"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Bulk Action Toolbar */}
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <Text strong>Select Tickets & Choose Action</Text>
                  <Text type="secondary">
                    ({selectedRowKeys.length} of {summary.tickets.pending.length} tickets selected)
                  </Text>
                </Space>
              </div>

              {selectedRowKeys.length > 0 && (
                <Space wrap>
                  <Button
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => handleBulkAction('move_to_backlog')}
                  >
                    Move to Backlog
                  </Button>
                  <Select
                    placeholder="Move to Sprint"
                    style={{ width: 180 }}
                    size="small"
                    onChange={(value) => {
                      if (value === '__create_new__') {
                        setShowSprintModal(true);
                      } else {
                        handleBulkAction('move_to_sprint', value);
                      }
                    }}
                    suffixIcon={<RocketOutlined />}
                  >
                    {summary.availableDestinations.sprints.map((sprint) => (
                      <Option key={sprint.id} value={sprint.id}>
                        {sprint.version}
                      </Option>
                    ))}
                    <Option value="__create_new__" style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                      <PlusOutlined style={{ marginRight: 8 }} />
                      Create New Sprint
                    </Option>
                  </Select>
                  <Select
                    placeholder="Move to Bucket"
                    style={{ width: 180 }}
                    size="small"
                    onChange={(value) => {
                      if (value === '__create_new__') {
                        setShowBucketModal(true);
                      } else {
                        handleBulkAction('move_to_bucket', value);
                      }
                    }}
                    suffixIcon={<FolderOutlined />}
                  >
                    {summary.availableDestinations.buckets.map((bucket) => (
                      <Option key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </Option>
                    ))}
                    <Option value="__create_new__" style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                      <PlusOutlined style={{ marginRight: 8 }} />
                      Create New Bucket
                    </Option>
                  </Select>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleBulkAction('move_to_trash')}
                  >
                    Move to Trash
                  </Button>

                  {/* Inline Resolve & Clear Buttons */}
                  {activeBulkAction && (
                    <>
                      <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        onClick={handleSubmit}
                        loading={bulkResolve.isPending}
                      >
                        Resolve ({selectedRowKeys.length})
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedRowKeys([]);
                          setActiveBulkAction(null);
                        }}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </Space>
              )}
            </Space>
          </Card>

          {/* Active Bulk Action Banner */}
          {activeBulkAction && selectedRowKeys.length > 0 && (
            <Alert
              message={
                <Space>
                  <Text strong>Active Action:</Text>
                  <Tag color={SprintCompletionService.getActionColor(activeBulkAction.action)}>
                    {SprintCompletionService.getActionLabel(activeBulkAction.action)}
                    {activeBulkAction.destinationName && ` → ${activeBulkAction.destinationName}`}
                  </Tag>
                  <Text type="secondary">
                    for {selectedRowKeys.length} selected ticket(s)
                  </Text>
                </Space>
              }
              type="info"
              showIcon
              closable
              onClose={() => setActiveBulkAction(null)}
              action={
                <Button size="small" onClick={() => setActiveBulkAction(null)}>
                  Clear
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Tickets Table */}
          <Table
            columns={columns}
            dataSource={summary.tickets.pending}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tickets`,
            }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            scroll={{ x: 1000 }}
            size="small"
          />

          {/* Sprint Creation Modal */}
          <Modal
            title="Create New Sprint"
            open={showSprintModal}
            onCancel={() => setShowSprintModal(false)}
            footer={null}
            width={500}
          >
            <SprintCreationForm
              projectId={summary.sprint.project.id}
              loading={creatingSprintLoading}
              onSubmit={handleCreateSprint}
              onCancel={() => setShowSprintModal(false)}
            />
          </Modal>

          {/* Bucket Creation Modal */}
          <Modal
            title="Create New Bucket"
            open={showBucketModal}
            onCancel={() => setShowBucketModal(false)}
            footer={null}
            width={500}
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
    </div>
  );
};

export default PendingTicketsTab;
