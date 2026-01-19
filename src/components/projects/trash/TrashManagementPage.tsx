"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Empty,
  Alert,
  Input,
  Select,
  Divider,
} from "antd";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import {
  useTrashTickets,
  useRestoreFromTrash,
  usePermanentlyDelete,
  useBulkRestoreFromTrash,
  useBulkPermanentlyDelete,
  useEmptyTrash,
} from "@/hooks/useTrash";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Title, Text } = Typography;

// Mock projects data - replace with actual useProjects hook when available
const mockProjects = [
  { label: "Project 1", value: "project-1" },
  { label: "Project 2", value: "project-2" },
];

export default function TrashManagementPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | undefined>(
    undefined
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const {
    data: trashData,
    isLoading,
    refetch,
  } = useTrashTickets({
    page,
    limit,
    projectId: projectFilter,
    search: searchQuery,
  });
  const restoreTicket = useRestoreFromTrash();
  const permanentlyDelete = usePermanentlyDelete();
  const bulkRestore = useBulkRestoreFromTrash();
  const bulkDelete = useBulkPermanentlyDelete();
  const emptyTrash = useEmptyTrash();

  const handleRestore = async (ticketId: string) => {
    try {
      await restoreTicket.mutateAsync(ticketId);
      message.success("Ticket restored successfully");
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to restore ticket");
    }
  };

  const handlePermanentDelete = async (ticketId: string) => {
    try {
      await permanentlyDelete.mutateAsync(ticketId);
      message.success("Ticket permanently deleted");
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to delete ticket");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select tickets to restore");
      return;
    }

    try {
      await bulkRestore.mutateAsync(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to restore tickets");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select tickets to delete");
      return;
    }

    try {
      await bulkDelete.mutateAsync(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to delete tickets");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash.mutateAsync(false);
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to empty trash");
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: any) => ({
      name: record.ticketNumber,
    }),
  };

  const calculateDaysRemaining = (deletedAt: string) => {
    const deleteDate = dayjs(deletedAt);
    const purgeDate = deleteDate.add(7, "days");
    const daysRemaining = purgeDate.diff(dayjs(), "days");
    return Math.max(0, daysRemaining);
  };

  const columns = [
    {
      title: "Ticket",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 130,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      filteredValue: searchQuery ? [searchQuery] : null,
      onFilter: (value: any, record: any) =>
        record.title.toLowerCase().includes(value.toLowerCase()) ||
        record.ticketNumber.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Project",
      key: "project",
      width: 150,
      render: (_: any, record: any) => (
        <Text>{record.project?.name || "N/A"}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          completed: "success",
          in_progress: "processing",
          in_testing: "warning",
          not_started: "default",
        };
        return (
          <Tag color={colorMap[status] || "default"}>
            {status.replace("_", " ").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Deleted",
      key: "deletedAt",
      width: 150,
      render: (_: any, record: any) => {
        const daysRemaining = calculateDaysRemaining(
          record.deletedAt || record.createdAt
        );
        return (
          <Space direction="vertical" size={0}>
            <Tooltip
              title={dayjs(record.deletedAt || record.createdAt).format(
                "MMM DD, YYYY HH:mm"
              )}
            >
              <Text type="secondary">
                {dayjs(record.deletedAt || record.createdAt).fromNow()}
              </Text>
            </Tooltip>
            <Tooltip title={`Auto-purge in ${daysRemaining} days`}>
              <Space size={4}>
                <ClockCircleOutlined
                  style={{
                    color: daysRemaining <= 2 ? "#ff4d4f" : "#faad14",
                    fontSize: 12,
                  }}
                />
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    color: daysRemaining <= 2 ? "#ff4d4f" : undefined,
                  }}
                >
                  {daysRemaining}d left
                </Text>
              </Space>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "Deleted By",
      key: "deletedBy",
      width: 150,
      render: (_: any, record: any) => (
        <Text>{record.deletedBy?.name || "Unknown"}</Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Restore ticket">
            <Button
              type="text"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => handleRestore(record.id)}
              loading={
                restoreTicket.isPending &&
                restoreTicket.variables === record.id
              }
            />
          </Tooltip>
          <Popconfirm
            title="Permanently Delete"
            description="This action cannot be undone. Are you sure?"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Permanently delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={
                  permanentlyDelete.isPending &&
                  permanentlyDelete.variables === record.id
                }
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <DeleteOutlined /> Trash
            </Title>
            <Text type="secondary">
              Deleted tickets are permanently removed after 7 days
            </Text>
          </div>
          <Popconfirm
            title="Empty Trash"
            description="This will permanently delete ALL tickets in trash. This action cannot be undone."
            onConfirm={handleEmptyTrash}
            okText="Empty Trash"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<ClearOutlined />}
              loading={emptyTrash.isPending}
              disabled={!trashData || !trashData.tickets || trashData.tickets.length === 0}
            >
              Empty Trash
            </Button>
          </Popconfirm>
        </div>

        {/* Warning Alert */}
        {trashData && trashData.tickets && trashData.tickets.length > 0 && (
          <Alert
            message="Auto-Purge Active"
            description="Tickets in trash are automatically permanently deleted after 7 days. Restore them before the countdown expires."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        {/* Filters */}
        <Card>
          <Space size="middle" style={{ width: "100%" }}>
            <Input
              placeholder="Search by ticket number or title..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Filter by project"
              style={{ width: 200 }}
              value={projectFilter}
              onChange={setProjectFilter}
              allowClear
              options={[
                { label: "All Projects", value: undefined },
                ...mockProjects.map((p: { label: string; value: string }) => ({
                  label: p.label,
                  value: p.value,
                })),
              ]}
            />
          </Space>
        </Card>

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={
              <Space split={<Divider type="vertical" />}>
                <Text strong>{selectedRowKeys.length} ticket(s) selected</Text>
                <Button
                  type="link"
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={handleBulkRestore}
                  loading={bulkRestore.isPending}
                >
                  Bulk Restore
                </Button>
                <Popconfirm
                  title="Bulk Delete"
                  description={`Permanently delete ${selectedRowKeys.length} ticket(s)? This cannot be undone.`}
                  onConfirm={handleBulkDelete}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={bulkDelete.isPending}
                  >
                    Bulk Delete
                  </Button>
                </Popconfirm>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setSelectedRowKeys([])}
                >
                  Clear Selection
                </Button>
              </Space>
            }
            type="info"
            showIcon
          />
        )}

        {/* Trash Table */}
        <Card>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={trashData?.tickets || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: limit,
              total: trashData?.pagination.total || 0,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} deleted tickets`,
              onChange: (newPage) => setPage(newPage),
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size="small">
                      <Text>No deleted tickets</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Deleted tickets will appear here for 7 days
                      </Text>
                    </Space>
                  }
                />
              ),
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    </div>
  );
}
