"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Tooltip,
  Empty,
  Spin,
  notification,
  Popconfirm,
  Select,
  Badge,
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
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useBuckets, useDeleteBucket } from "@/hooks/useBuckets";
import { CreateBucketModal } from "./CreateBucketModal";
import { BucketDetailDrawer } from "./BucketDetailDrawer";
import type { Bucket } from "@/services/bucketService";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Option } = Select;

export default function BucketManagementPage() {
  const [api, contextHolder] = notification.useNotification();
  const router = useRouter();

  // State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Queries
  const { data: projects } = useUserProjects();
  const {
    data: bucketsData,
    isLoading,
    refetch,
  } = useBuckets(selectedProject || undefined);

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
      // Success message is handled by the hook
    } catch (error: any) {
      // Error message is handled by the hook
      console.error("Error deleting bucket:", error);
    }
  };

  const handleView = (bucketId: string) => {
    // Navigate to bucket detail page instead of drawer
    router.push(`/projects/buckets/${bucketId}`);
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingBucket(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    refetch();
    // Success message is handled by the hook
  };

  return (
    <div style={{ padding: 20 }}>
      {contextHolder}

      {/* Header */}
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
            <Select
              placeholder="All Projects"
              style={{ width: 200 }}
              value={selectedProject}
              onChange={setSelectedProject}
              allowClear
            >
              <Option value={null}>All Projects</Option>
              {projects?.map((project: any) => (
                <Option key={project.value} value={project.value}>
                  {project.label}
                </Option>
              ))}
            </Select>
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

      {/* Bucket Cards Grid */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Spin size="large" />
        </div>
      ) : buckets.length === 0 ? (
        <Empty
          image={
            <FolderOpenOutlined style={{ fontSize: 80, color: "#d9d9d9" }} />
          }
          description={
            <div>
              <Text type="secondary">No buckets created yet</Text>
              <br />
              <Text type="secondary">
                Create a bucket to organize tickets across projects
              </Text>
            </div>
          }
          style={{ marginTop: 100 }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Your First Bucket
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {buckets.map((bucket: Bucket) => {
            const ticketCount = (bucket as any)._count?.tickets || 0;
            const memberCount = bucket.members?.length || 0;
            const project =
              typeof bucket.project === "object" ? bucket.project : null;

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={bucket.id}>
                <Card
                  hoverable
                  style={{
                    height: "100%",
                    borderLeft: `4px solid ${bucket.color || "#6366f1"}`,
                    cursor: "pointer",
                  }}
                  onClick={() => handleView(bucket.id)}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <FolderOutlined
                        style={{
                          fontSize: 32,
                          color: bucket.color || "#6366f1",
                        }}
                      />
                      <Space size="small">
                        <Tooltip title="Edit">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(bucket);
                            }}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete Bucket"
                          description="Are you sure? Tickets will not be deleted."
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDelete(bucket.id);
                          }}
                          onCancel={(e) => e?.stopPropagation()}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            loading={
                              deleteBucket.isPending &&
                              deleteBucket.variables === bucket.id
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      </Space>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {bucket.name}
                    </Text>
                  </div>

                  {bucket.description && (
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                        {bucket.description}
                      </Text>
                    </div>
                  )}

                  {project && (
                    <div style={{ marginBottom: 12 }}>
                      <Space size="small">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {project.name}
                        </Text>
                      </Space>
                    </div>
                  )}

                  {!project && (
                    <div style={{ marginBottom: 12 }}>
                      <Tag color="purple" style={{ margin: 0 }}>
                        Cross-Project
                      </Tag>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: 12,
                      marginTop: 12,
                    }}
                  >
                    <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
                      <Tooltip title="Tickets">
                        <Space size="small">
                          <FileTextOutlined style={{ color: "#1890ff" }} />
                          <Badge
                            count={ticketCount}
                            showZero
                            style={{ backgroundColor: "#52c41a" }}
                          />
                        </Space>
                      </Tooltip>
                      {bucket.isShared && (
                        <Tooltip title="Members">
                          <Space size="small">
                            <TeamOutlined style={{ color: "#722ed1" }} />
                            <Text type="secondary">{memberCount}</Text>
                          </Space>
                        </Tooltip>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Create/Edit Modal */}
      <CreateBucketModal
        open={createModalOpen}
        bucket={editingBucket}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Detail Drawer (kept for backward compatibility if needed) */}
      <BucketDetailDrawer
        bucketId={selectedBucketId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedBucketId(null);
        }}
      />
    </div>
  );
}
