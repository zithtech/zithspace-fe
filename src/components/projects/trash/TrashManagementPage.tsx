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
  Row,
  Col,
  Avatar,
} from "antd";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ClearOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  useTrashTickets,
  useRestoreFromTrash,
  usePermanentlyDelete,
  useBulkRestoreFromTrash,
  useBulkPermanentlyDelete,
  useEmptyTrash,
} from "@/hooks/useTrash";
import { useUserProjects } from "@/hooks/useGlobalData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Title, Text } = Typography;

const calculateDaysRemaining = (deletedAt: string) => {
  const deleteDate = dayjs(deletedAt);
  const purgeDate = deleteDate.add(7, "days");
  const daysRemaining = purgeDate.diff(dayjs(), "days");
  return Math.max(0, daysRemaining);
};

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

  const { data: userProjectsData } = useUserProjects();
  const projects = userProjectsData || [];

  const restoreTicket = useRestoreFromTrash();
  const permanentlyDelete = usePermanentlyDelete();
  const bulkRestore = useBulkRestoreFromTrash();
  const bulkDelete = useBulkPermanentlyDelete();
  const emptyTrash = useEmptyTrash();

  // Stats calculation
  const stats = React.useMemo(() => {
    const tickets = trashData?.tickets || [];
    const purgingSoon = tickets.filter(t => {
      const days = calculateDaysRemaining(t.deletedAt || t.createdAt);
      return days <= 2;
    }).length;

    return {
      total: trashData?.pagination.total || 0,
      purgingSoon
    };
  }, [trashData]);

  const handleRestore = async (ticketId: string) => {
    try {
      await restoreTicket.mutateAsync([ticketId]);
      refetch();
    } catch (error: any) {
      // Error already handled by the hook
      console.error("Error restoring ticket:", error);
    }
  };

  const handlePermanentDelete = async (ticketId: string) => {
    try {
      await permanentlyDelete.mutateAsync([ticketId]);
      refetch();
    } catch (error: any) {
      // Error already handled by the hook
      console.error("Error permanently deleting ticket:", error);
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
      // Error already handled by the hook
      console.error("Error bulk restoring tickets:", error);
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
      // Error already handled by the hook
      console.error("Error bulk deleting tickets:", error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash.mutateAsync(false);
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      // Error already handled by the hook
      console.error("Error emptying trash:", error);
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



  const columns = [
    {
      title: "ID",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 100,
      render: (text: string) => <Text strong style={{ color: "#1677ff", fontFamily: "monospace" }}>{text}</Text>,
    },
    {
      title: "Ticket Details",
      key: "details",
      render: (_: any, record: any) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 14 }}>{record.title}</Text>
          <Space size={8}>
            <Tag icon={<ProjectOutlined />} style={{ borderRadius: 4, fontSize: 11, background: "var(--bg-secondary)", border: "none" }}>
              {record.project?.name || "Global"}
            </Tag>
            <Tag color={record.status === 'completed' ? 'success' : 'processing'} style={{ borderRadius: 4, fontSize: 10, border: "none" }}>
              {record.status?.replace("_", " ").toUpperCase()}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: "Deleted By",
      key: "deletedBy",
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Avatar
            size="small"
            style={{ backgroundColor: "#87d068" }}
          >
            {record.deletedBy?.name?.charAt(0) || "U"}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13, display: "block" }}>{record.deletedBy?.name || "System"}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(record.deletedAt || record.createdAt).fromNow()}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Auto-Purge In",
      key: "purge",
      width: 150,
      render: (_: any, record: any) => {
        const daysRemaining = calculateDaysRemaining(
          record.deletedAt || record.createdAt
        );
        const isUrgent = daysRemaining <= 2;
        return (
          <Tooltip title={`Permanently purged in approx. ${daysRemaining} days`}>
            <div style={{
              padding: "4px 12px",
              borderRadius: 6,
              background: isUrgent ? "rgba(255, 77, 79, 0.1)" : "rgba(82, 196, 26, 0.1)",
              border: `1px solid ${isUrgent ? "rgba(255, 77, 79, 0.2)" : "rgba(82, 196, 26, 0.2)"}`,
              display: "inline-flex",
              alignItems: "center",
              gap: 8
            }}>
              <ClockCircleOutlined style={{ color: isUrgent ? "#ff4d4f" : "#52c41a" }} />
              <Text strong style={{ color: isUrgent ? "#ff4d4f" : "#52c41a", fontSize: 13 }}>
                {daysRemaining}d Left
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Popconfirm
            title="Restore Ticket"
            description="Move this ticket back to active status?"
            onConfirm={() => handleRestore(record.id)}
            okText="Restore"
            cancelText="Cancel"
          >
            <Tooltip title="Restore">
              <Button
                type="text"
                shape="circle"
                icon={<UndoOutlined />}
                loading={restoreTicket.isPending && restoreTicket.variables?.[0] === record.id}
                style={{ color: "#52c41a" }}
              />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Purge Permanently"
            description="This action is irreversible. Continue?"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="Purge"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Purge Permanently">
              <Button
                type="text"
                shape="circle"
                danger
                icon={<DeleteOutlined />}
                loading={permanentlyDelete.isPending && permanentlyDelete.variables?.[0] === record.id}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0", background: "var(--bg-pure-white)", minHeight: "100%" }}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Premium Header - Reduced Height */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-pure-white)",
          padding: "16px 0",
          borderRadius: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={40}
              icon={<DeleteOutlined />}
              style={{ backgroundColor: "#ff4d4f", boxShadow: "0 4px 12px rgba(255, 77, 79, 0.2)" }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>Trash Repository</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Recover deleted items or purge them permanently
              </Text>
            </div>
          </div>
          <Space size={12}>
            <Popconfirm
              title="Empty Trash"
              description="This will permanently delete ALL tickets in trash. This action cannot be undone."
              onConfirm={handleEmptyTrash}
              okText="Confirm Purge"
              cancelText="Cancel"
              okButtonProps={{ danger: true, size: "middle" }}
            >
              <Button
                danger
                size="middle"
                icon={<ClearOutlined />}
                loading={emptyTrash.isPending}
                disabled={!trashData?.tickets?.length}
                style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
              >
                Empty Trash
              </Button>
            </Popconfirm>
          </Space>
        </div>

        {/* Summary Stats Row - Reduced Card Heights */}
        <Row gutter={[16, 16]} style={{ display: 'flex' }}>
          <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
            <Card styles={{ body: { padding: "16px 20px" } }} style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "none", width: "100%", display: 'flex', flexDirection: 'column' }}>
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Deleted</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{stats.total}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
            <Card styles={{ body: { padding: "16px 20px" } }} style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "none", width: "100%", display: 'flex', flexDirection: 'column' }}>
              <Space direction="vertical" size={2}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WarningOutlined style={{ color: stats.purgingSoon > 0 ? "#faad14" : "#52c41a", fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Purging Soon</Text>
                </div>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: stats.purgingSoon > 0 ? "#faad14" : "inherit" }}>
                  {stats.purgingSoon} <span style={{ fontSize: 13, fontWeight: 400, color: "#8c8c8c" }}>(&le; 48h)</span>
                </Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} style={{ display: 'flex' }}>
            <Card styles={{ body: { padding: "16px 20px" } }} style={{ borderRadius: 12, border: "1px solid rgba(250, 173, 20, 0.2)", backgroundColor: "rgba(250, 173, 20, 0.1)", boxShadow: "none", width: "100%", display: 'flex', alignItems: 'center' }}>
              <Space size={12}>
                <InfoCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
                <div>
                  <Text strong style={{ display: "block", color: "var(--text-primary)", fontSize: 13 }}>Automatic Maintenance Active</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Items in trash are automatically purged after 7 days to keep your workspace clean.
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Filters Row */}
        <Card styles={{ body: { padding: "16px 24px" } }} style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "none" }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by ticket number or title..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: 8, height: 45 }}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by Project"
                size="large"
                style={{ width: "100%", height: 45 }}
                value={projectFilter}
                onChange={setProjectFilter}
                allowClear
                options={[
                  { label: "All Projects", value: undefined },
                  ...projects.map((p) => ({
                    label: p.label,
                    value: p.value,
                  })),
                ]}
                suffixIcon={<ProjectOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Bulk Actions Alert */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong>{selectedRowKeys.length} ticket(s) selected for processing</Text>
                <Space size={16}>
                  <Popconfirm
                    title="Bulk Restore"
                    description={`Restore ${selectedRowKeys.length} ticket(s) from trash?`}
                    onConfirm={handleBulkRestore}
                    okText="Restore"
                    cancelText="Cancel"
                  >
                    <Button
                      type="primary"
                      size="small"
                      icon={<UndoOutlined />}
                      loading={bulkRestore.isPending}
                      style={{ borderRadius: 6, backgroundColor: "#52c41a", border: "none" }}
                    >
                      Bulk Restore
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Bulk Delete"
                    description={`Permanently delete ${selectedRowKeys.length} ticket(s)? This cannot be undone.`}
                    onConfirm={handleBulkDelete}
                    okText="Delete Permanently"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={bulkDelete.isPending}
                      style={{ borderRadius: 6 }}
                    >
                      Bulk Purge
                    </Button>
                  </Popconfirm>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setSelectedRowKeys([])}
                  >
                    Clear
                  </Button>
                </Space>
              </div>
            }
            type="info"
            showIcon
            style={{ borderRadius: 8, padding: "12px 20px" }}
          />
        )}

        {/* Results Table */}
        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
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
              showTotal: (total) => <Text type="secondary">Total {total} removed items</Text>,
              onChange: (newPage) => setPage(newPage),
              style: { padding: "16px 24px" }
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size="small">
                      <Text style={{ fontSize: 16, fontWeight: 600 }}>Trash is clear</Text>
                      <Text type="secondary">Deleted items will stay here for 7 days before being purged.</Text>
                    </Space>
                  }
                  style={{ padding: "40px 0" }}
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
