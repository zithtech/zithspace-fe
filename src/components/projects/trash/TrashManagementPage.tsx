"use client";

import React, { useState, useMemo } from "react";
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

dayjs.extend(relativeTime);

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
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
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

  const stats = useMemo(() => {
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
    } catch (error) {
      console.error("Error restoring ticket:", error);
    }
  };

  const handlePermanentDelete = async (ticketId: string) => {
    try {
      await permanentlyDelete.mutateAsync([ticketId]);
      refetch();
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error("Error bulk deleting tickets:", error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash.mutateAsync(false);
      setSelectedRowKeys([]);
      refetch();
    } catch (error) {
      console.error("Error emptying trash:", error);
    }
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
          <Avatar size="small" style={{ backgroundColor: "#87d068" }}>
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
        const daysRemaining = calculateDaysRemaining(record.deletedAt || record.createdAt);
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
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-pure-white)",
          padding: "16px 0",
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar size={40} icon={<DeleteOutlined />} style={{ backgroundColor: "#ff4d4f", boxShadow: "0 4px 12px rgba(255, 77, 79, 0.2)" }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>Trash Repository</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Recover deleted items or purge them permanently</Text>
            </div>
          </div>
          <Popconfirm
            title="Empty Trash"
            description="Permanently delete ALL tickets? This cannot be undone."
            onConfirm={handleEmptyTrash}
            okText="Confirm Purge"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<ClearOutlined />}
              loading={emptyTrash.isPending}
              disabled={!trashData?.tickets?.length}
              style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
            >
              Empty Trash
            </Button>
          </Popconfirm>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 12, border: "1px solid var(--border-color)" }}>
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>Total Deleted</Text>
                <Title level={3} style={{ margin: 0 }}>{stats.total}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 12, border: "1px solid var(--border-color)" }}>
              <Space direction="vertical" size={2}>
                <Space size={6}>
                  <WarningOutlined style={{ color: stats.purgingSoon > 0 ? "#faad14" : "#52c41a", fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>Purging Soon</Text>
                </Space>
                <Title level={3} style={{ margin: 0, color: stats.purgingSoon > 0 ? "#faad14" : "inherit" }}>
                  {stats.purgingSoon} <span style={{ fontSize: 13, fontWeight: 400, color: "#8c8c8c" }}>(&le; 48h)</span>
                </Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card style={{ borderRadius: 12, border: "1px solid rgba(250, 173, 20, 0.2)", background: "rgba(250, 173, 20, 0.1)" }}>
              <Space size={12}>
                <InfoCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
                <div>
                  <Text strong style={{ fontSize: 13 }}>Maintenance Active</Text>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Items are automatically purged after 7 days.</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <Row gutter={16}>
            <Col flex="auto">
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter Project"
                size="large"
                style={{ width: "100%" }}
                value={projectFilter}
                onChange={setProjectFilter}
                allowClear
                options={projects.map((p) => ({ label: `${p.label} - ${p.code}`, value: p.value }))}
                suffixIcon={<ProjectOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {selectedRowKeys.length > 0 && (
          <Alert
            message={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong>{selectedRowKeys.length} items selected</Text>
                <Space size={16}>
                  <Button type="primary" size="small" icon={<UndoOutlined />} onClick={handleBulkRestore} loading={bulkRestore.isPending}>Restore</Button>
                  <Button danger size="small" icon={<DeleteOutlined />} onClick={handleBulkDelete} loading={bulkDelete.isPending}>Purge</Button>
                </Space>
              </div>
            }
            type="info"
            showIcon
          />
        )}

        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)" }}>
          <Table
            rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
            columns={columns}
            dataSource={trashData?.tickets || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: limit,
              total: trashData?.pagination.total || 0,
              onChange: (p) => setPage(p),
              showTotal: (total) => `Total ${total} items`
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Space>
    </div>
  );
}
