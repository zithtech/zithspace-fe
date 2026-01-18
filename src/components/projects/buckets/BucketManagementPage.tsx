"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Avatar,
  Tooltip,
  Empty,
  Spin,
  notification,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOutlined,
  TeamOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useBuckets, useDeleteBucket } from "@/hooks/useBuckets";
import { CreateBucketModal } from "./CreateBucketModal";
import { BucketDetailDrawer } from "./BucketDetailDrawer";
import type { Bucket } from "@/services/bucketService";

const { Title, Text } = Typography;

export default function BucketManagementPage() {
  const [api, contextHolder] = notification.useNotification();

  // State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Queries
  const {
    data: bucketsData,
    isLoading,
    refetch,
  } = useBuckets();

  const deleteBucket = useDeleteBucket();

  const buckets = bucketsData || [];

  // Handlers
  const handleCreate = () => {
    setEditingBucket(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (bucket: Bucket) => {
    setEditingBucket(bucket);
    setCreateModalOpen(true);
  };

  const handleDelete = async (bucketId: string) => {
    try {
      await deleteBucket.mutateAsync(bucketId);
      api.success({
        message: "Success",
        description: "Bucket deleted successfully",
        placement: "bottomRight",
      });
    } catch (error: any) {
      api.error({
        message: "Error",
        description: error.message || "Failed to delete bucket",
        placement: "bottomRight",
      });
    }
  };

  const handleView = (bucketId: string) => {
    setSelectedBucketId(bucketId);
    setDrawerOpen(true);
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingBucket(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    refetch();
    api.success({
      message: "Success",
      description: editingBucket
        ? "Bucket updated successfully"
        : "Bucket created successfully",
      placement: "bottomRight",
    });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedBucketId(null);
  };

  // Table columns
  const columns = [
    {
      title: "Bucket Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Bucket) => (
        <Space>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: record.color || "#1890ff",
            }}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Text type="secondary" ellipsis>
          {text || "-"}
        </Text>
      ),
    },
    {
      title: "Project",
      key: "project",
      width: 200,
      render: (_: any, record: Bucket) => {
        const project =
          typeof record.project === "string" ? null : record.project;
        return project ? (
          <Space>
            <Tag color="blue">{project.code}</Tag>
            <Text>{project.name}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: "Tickets",
      dataIndex: "ticketCount",
      key: "ticketCount",
      width: 100,
      render: (count: number) => (
        <Space>
          <FileTextOutlined />
          <Text>{count || 0}</Text>
        </Space>
      ),
    },
    {
      title: "Members",
      dataIndex: "memberCount",
      key: "memberCount",
      width: 100,
      render: (count: number, record: Bucket) => {
        const members = record.members || [];
        return (
          <Space>
            <TeamOutlined />
            <Text>{members.length}</Text>
            {members.length > 0 && (
              <Avatar.Group maxCount={3} size="small">
                {members.slice(0, 5).map((member: any) => (
                  <Tooltip
                    key={member.id}
                    title={member.user?.name || member.user?.email}
                  >
                    <Avatar
                      size="small"
                      style={{ backgroundColor: "#1890ff" }}
                    >
                      {(member.user?.name || member.user?.email)
                        ?.charAt(0)
                        .toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </Avatar.Group>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: Bucket) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Bucket"
            description="Are you sure you want to delete this bucket? Tickets will not be deleted."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={
                  deleteBucket.isPending &&
                  deleteBucket.variables === record.id
                }
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>
              <FolderOutlined style={{ marginRight: 8 }} />
              Buckets
            </Title>
            <Text type="secondary">
              Organize tickets across projects with shared access
            </Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Bucket
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
          </div>
        ) : buckets.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">No buckets created yet</Text>
                <br />
                <Text type="secondary">
                  Create a bucket to organize tickets across projects
                </Text>
              </div>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Create Your First Bucket
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={buckets}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} buckets`,
            }}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <CreateBucketModal
        open={createModalOpen}
        bucket={editingBucket}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Detail Drawer */}
      <BucketDetailDrawer
        bucketId={selectedBucketId}
        open={drawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
