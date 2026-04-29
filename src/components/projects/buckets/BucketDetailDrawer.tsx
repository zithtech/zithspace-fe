"use client";

import React, { useState } from "react";
import {
  Drawer,
  Space,
  Typography,
  Spin,
  Empty,
  Tabs,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Descriptions,
  Button,
  Table,
  Avatar,
  Tooltip,
  message,
  Popconfirm,
} from "antd";
import {
  FolderOutlined,
  TeamOutlined,
  FileTextOutlined,
  UserAddOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useBucket, useRemoveBucketMember } from "@/hooks/useBuckets";
import { BucketMemberManager } from "./BucketMemberManager";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface BucketDetailDrawerProps {
  bucketId: string | null;
  open: boolean;
  onClose: () => void;
}

export function BucketDetailDrawer({
  bucketId,
  open,
  onClose,
}: BucketDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [memberManagerOpen, setMemberManagerOpen] = useState(false);

  const { data: bucket, isLoading, refetch } = useBucket(bucketId || '', !!bucketId);
  const removeMember = useRemoveBucketMember();

  if (!bucketId) return null;

  const handleRemoveMember = async (userId: string) => {
    if (!bucket) return;
    try {
      await removeMember.mutateAsync({ bucketId: bucket.id, userId });
      message.success("Member removed successfully");
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to remove member");
    }
  };

  const handleMemberManagerSuccess = () => {
    setMemberManagerOpen(false);
    refetch();
  };

  // Member columns
  const memberColumns = [
    {
      title: "Member",
      key: "member",
      render: (_: any, record: any) => {
        const user = record.user;
        return (
          <Space>
            <Avatar style={{ backgroundColor: "#1890ff" }}>
              {(user?.name || user?.email)?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div>
                <Text strong>{user?.name || "Unknown"}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.email}
                </Text>
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => (
        <Tag color={role === "editor" ? "blue" : "default"}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Added",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("MMM DD, YYYY HH:mm")}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: any, record: any) => {
        return (
          <Popconfirm
            title="Remove Member"
            description="Are you sure you want to remove this member from the bucket?"
            onConfirm={() => handleRemoveMember(record.userId)}
            okText="Remove"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Remove member">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={
                  removeMember.isPending && removeMember.variables?.userId === record.userId
                }
              />
            </Tooltip>
          </Popconfirm>
        );
      },
    },
  ];

  // Ticket columns
  const ticketColumns = [
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
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          P1: "red",
          P2: "orange",
          P3: "green",
        };
        return <Tag color={colorMap[priority] || "default"}>{priority}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: any, record: any) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              // Open ticket detail drawer (to be implemented)
              message.info("Ticket detail view coming soon");
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          isLoading ? (
            "Loading..."
          ) : (
            <Space>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: bucket?.color || "#1890ff",
                }}
              />
              <Text strong style={{ fontSize: 16 }}>
                {bucket?.name || "Bucket"}
              </Text>
            </Space>
          )
        }
        placement="right"
        onClose={onClose}
        open={open}
        width={720}
        closeIcon={<CloseOutlined />}
      >
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
          </div>
        ) : !bucket ? (
          <Empty description="Bucket not found" />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "overview",
                label: (
                  <span>
                    <FolderOutlined />
                    Overview
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* Statistics */}
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="Total Tickets"
                            value={bucket._count?.tickets || 0}
                            prefix={<FileTextOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="Members"
                            value={bucket._count?.members || bucket.members?.length || 0}
                            prefix={<TeamOutlined />}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Details */}
                    <Card title="Details">
                      <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Description">
                          {bucket.description || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Project">
                          {typeof bucket.project === "string"
                            ? bucket.project
                            : bucket.project?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Created">
                          {dayjs(bucket.createdAt).format("MMM DD, YYYY HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Updated">
                          {dayjs(bucket.updatedAt).format("MMM DD, YYYY HH:mm")}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Space>
                ),
              },
              {
                key: "members",
                label: (
                  <span>
                    <TeamOutlined />
                    Members ({bucket._count?.members || bucket.members?.length || 0})
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => setMemberManagerOpen(true)}
                      >
                        Add Members
                      </Button>
                    </div>
                    <Table
                      columns={memberColumns}
                      dataSource={bucket.members || []}
                      rowKey="id"
                      pagination={false}
                      locale={{
                        emptyText: (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No members yet"
                          />
                        ),
                      }}
                    />
                  </Space>
                ),
              },
              {
                key: "tickets",
                label: (
                  <span>
                    <FileTextOutlined />
                    Tickets ({bucket._count?.tickets || 0})
                  </span>
                ),
                children: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Ticket list view coming soon"
                    style={{ marginTop: 40 }}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Member Manager Modal */}
      {bucket && (
        <BucketMemberManager
          bucketId={bucket.id}
          open={memberManagerOpen}
          onClose={() => setMemberManagerOpen(false)}
          onSuccess={handleMemberManagerSuccess}
        />
      )}
      <style jsx global>{`
        [data-theme='dark'] .ant-drawer-content {
          background-color: #0d1117 !important;
        }
        [data-theme='dark'] .ant-drawer-header {
          background-color: #0d1117 !important;
          border-bottom: 1px solid #30363d !important;
        }
        [data-theme='dark'] .ant-drawer-title {
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .ant-tabs-nav::before {
          border-bottom-color: #30363d !important;
        }
        [data-theme='dark'] .ant-card {
          background: #161b22 !important;
          border-color: #30363d !important;
        }
        [data-theme='dark'] .ant-card-head {
          border-bottom-color: #30363d !important;
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .ant-statistic-title {
          color: #8b949e !important;
        }
        [data-theme='dark'] .ant-statistic-content {
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .ant-descriptions-bordered .ant-descriptions-item-label {
          background-color: #161b22 !important;
          border-color: #30363d !important;
          color: #8b949e !important;
        }
        [data-theme='dark'] .ant-descriptions-bordered .ant-descriptions-item-content {
          border-color: #30363d !important;
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .ant-table {
          background: transparent !important;
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .ant-table-thead > tr > th {
          background: #161b22 !important;
          border-bottom-color: #30363d !important;
          color: #8b949e !important;
        }
        [data-theme='dark'] .ant-table-tbody > tr > td {
          border-bottom-color: #21262d !important;
        }
        [data-theme='dark'] .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #1c2128 !important;
        }
      `}</style>
    </>
  );
}
