"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Typography,
  message,
  Modal,
  Card,
  Empty,
  Tooltip,
  Badge,
} from "antd";
import {
  SendOutlined,
  DeleteOutlined,
  FolderOutlined,
  RocketOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SprintCompletionSummary, BulkResolveAction, BulkActionType } from "@/services/sprintCompletionService";
import { useBulkResolveTickets } from "@/hooks/useSprintCompletion";
import SprintCompletionService from "@/services/sprintCompletionService";

const { Text } = Typography;
const { Option } = Select;

interface PendingTicketsTabProps {
  sprintId: string;
  summary: SprintCompletionSummary;
  onActionComplete: () => void;
}

interface TicketAction {
  ticketId: string;
  action: BulkActionType | null;
  destinationId?: string;
}

export const PendingTicketsTab: React.FC<PendingTicketsTabProps> = ({
  sprintId,
  summary,
  onActionComplete,
}) => {
  const [ticketActions, setTicketActions] = useState<Record<string, TicketAction>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const bulkResolve = useBulkResolveTickets();

  // Update action for a ticket
  const handleActionChange = (ticketId: string, action: BulkActionType | null) => {
    setTicketActions((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        ticketId,
        action,
        destinationId: undefined, // Reset destination when action changes
      },
    }));
  };

  // Update destination for a ticket
  const handleDestinationChange = (ticketId: string, destinationId: string) => {
    setTicketActions((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        destinationId,
      },
    }));
  };

  // Bulk apply action to selected tickets
  const handleBulkAction = (action: BulkActionType, destinationId?: string) => {
    const updates: Record<string, TicketAction> = {};
    selectedRowKeys.forEach((ticketId) => {
      updates[ticketId as string] = {
        ticketId: ticketId as string,
        action,
        destinationId,
      };
    });
    setTicketActions((prev) => ({ ...prev, ...updates }));
    message.success(`Applied ${SprintCompletionService.getActionLabel(action)} to ${selectedRowKeys.length} ticket(s)`);
  };

  // Submit bulk resolve
  const handleSubmit = async () => {
    // Collect all actions
    const actions: BulkResolveAction[] = Object.values(ticketActions)
      .filter((ta) => ta.action !== null)
      .map((ta) => ({
        ticketId: ta.ticketId,
        action: ta.action!,
        destinationId: ta.destinationId,
      }));

    if (actions.length === 0) {
      message.warning("Please assign actions to at least one ticket");
      return;
    }

    // Validate actions
    const validation = SprintCompletionService.validateBulkActions(actions);
    if (!validation.valid) {
      validation.errors.forEach((error) => message.error(error));
      return;
    }

    Modal.confirm({
      title: "Confirm Bulk Resolution",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>You are about to resolve <strong>{actions.length}</strong> pending ticket(s):</p>
          <ul style={{ marginTop: 12 }}>
            <li>Move to Backlog: {actions.filter(a => a.action === 'move_to_backlog').length}</li>
            <li>Move to Next Sprint: {actions.filter(a => a.action === 'move_to_sprint').length}</li>
            <li>Move to Bucket: {actions.filter(a => a.action === 'move_to_bucket').length}</li>
            <li>Move to Trash: {actions.filter(a => a.action === 'move_to_trash').length}</li>
          </ul>
          <p style={{ marginTop: 12 }}>This action cannot be easily undone. Continue?</p>
        </div>
      ),
      okText: "Resolve Tickets",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await bulkResolve.mutateAsync({ sprintId, actions });
          setTicketActions({});
          setSelectedRowKeys([]);
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
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_, record) => {
        const ticketAction = ticketActions[record.id];
        return (
          <Select
            placeholder="Select action"
            style={{ width: "100%" }}
            value={ticketAction?.action}
            onChange={(value) => handleActionChange(record.id, value)}
            size="small"
          >
            <Option value="move_to_backlog">
              <Space>
                <ArrowLeftOutlined />
                <span>To Backlog</span>
              </Space>
            </Option>
            <Option value="move_to_sprint">
              <Space>
                <RocketOutlined />
                <span>To Next Sprint</span>
              </Space>
            </Option>
            <Option value="move_to_bucket">
              <Space>
                <FolderOutlined />
                <span>To Bucket</span>
              </Space>
            </Option>
            <Option value="move_to_trash">
              <Space>
                <DeleteOutlined />
                <span>To Trash</span>
              </Space>
            </Option>
          </Select>
        );
      },
    },
    {
      title: "Destination",
      key: "destination",
      width: 200,
      render: (_, record) => {
        const ticketAction = ticketActions[record.id];
        
        if (!ticketAction?.action) return null;
        
        if (ticketAction.action === 'move_to_backlog' || ticketAction.action === 'move_to_trash') {
          return <Text type="secondary">-</Text>;
        }

        if (ticketAction.action === 'move_to_sprint') {
          return (
            <Select
              placeholder="Select sprint"
              style={{ width: "100%" }}
              value={ticketAction.destinationId}
              onChange={(value) => handleDestinationChange(record.id, value)}
              size="small"
            >
              {summary.destinations.sprints.map((sprint) => (
                <Option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </Option>
              ))}
            </Select>
          );
        }

        if (ticketAction.action === 'move_to_bucket') {
          return (
            <Select
              placeholder="Select bucket"
              style={{ width: "100%" }}
              value={ticketAction.destinationId}
              onChange={(value) => handleDestinationChange(record.id, value)}
              size="small"
            >
              {summary.destinations.buckets.map((bucket) => (
                <Option key={bucket.id} value={bucket.id}>
                  <Space>
                    {bucket.color && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: bucket.color,
                        }}
                      />
                    )}
                    <span>{bucket.name}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          );
        }

        return null;
      },
    },
  ];

  // Count tickets by action
  const actionCounts = {
    backlog: Object.values(ticketActions).filter(ta => ta.action === 'move_to_backlog').length,
    sprint: Object.values(ticketActions).filter(ta => ta.action === 'move_to_sprint').length,
    bucket: Object.values(ticketActions).filter(ta => ta.action === 'move_to_bucket').length,
    trash: Object.values(ticketActions).filter(ta => ta.action === 'move_to_trash').length,
  };

  const totalAssigned = Object.values(actionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ padding: 24, height: "calc(85vh - 220px)", overflow: "auto" }}>
      {summary.tickets.pending.length === 0 ? (
        <Empty
          description="No pending tickets"
          style={{ marginTop: 100 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Bulk Action Toolbar */}
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <Text strong>Bulk Actions</Text>
                  <Text type="secondary">
                    ({selectedRowKeys.length} selected)
                  </Text>
                </Space>
                <Space>
                  <Text type="secondary">
                    {totalAssigned} / {summary.tickets.pending.length} tickets assigned
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
                  {summary.destinations.sprints.length > 0 && (
                    <Select
                      placeholder="Move to Sprint"
                      style={{ width: 180 }}
                      size="small"
                      onChange={(value) => handleBulkAction('move_to_sprint', value)}
                      suffixIcon={<RocketOutlined />}
                    >
                      {summary.destinations.sprints.map((sprint) => (
                        <Option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                  {summary.destinations.buckets.length > 0 && (
                    <Select
                      placeholder="Move to Bucket"
                      style={{ width: 180 }}
                      size="small"
                      onChange={(value) => handleBulkAction('move_to_bucket', value)}
                      suffixIcon={<FolderOutlined />}
                    >
                      {summary.destinations.buckets.map((bucket) => (
                        <Option key={bucket.id} value={bucket.id}>
                          {bucket.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleBulkAction('move_to_trash')}
                  >
                    Move to Trash
                  </Button>
                </Space>
              )}

              {totalAssigned > 0 && (
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  {actionCounts.backlog > 0 && (
                    <Tag color="orange">Backlog: {actionCounts.backlog}</Tag>
                  )}
                  {actionCounts.sprint > 0 && (
                    <Tag color="blue">Next Sprint: {actionCounts.sprint}</Tag>
                  )}
                  {actionCounts.bucket > 0 && (
                    <Tag color="purple">Bucket: {actionCounts.bucket}</Tag>
                  )}
                  {actionCounts.trash > 0 && (
                    <Tag color="red">Trash: {actionCounts.trash}</Tag>
                  )}
                </div>
              )}
            </Space>
          </Card>

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
            scroll={{ x: 1200 }}
            size="small"
          />

          {/* Submit Button */}
          {totalAssigned > 0 && (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                padding: "16px 0",
                background: "#fff",
                borderTop: "1px solid #f0f0f0",
                marginTop: 16,
              }}
            >
              <Space>
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={bulkResolve.isPending}
                >
                  Resolve {totalAssigned} Ticket{totalAssigned > 1 ? 's' : ''}
                </Button>
                <Button
                  size="large"
                  onClick={() => {
                    setTicketActions({});
                    setSelectedRowKeys([]);
                  }}
                >
                  Clear All
                </Button>
              </Space>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PendingTicketsTab;
