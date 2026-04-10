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
  Table,
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
  ProjectOutlined,
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
    } catch (error: any) {
      console.error("Error deleting bucket:", error);
    }
  };

  const handleView = (bucketId: string) => {
    router.push(`/projects/buckets/${bucketId}`);
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingBucket(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    refetch();
  };

  const columns = [
    {
      title: "BUCKET NAME",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Bucket) => (
        <Space size="middle">
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: `${record.color || "#1677ff"}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${record.color || "#1677ff"}20`
          }}>
            <FolderOutlined style={{ fontSize: 18, color: record.color || "#1677ff" }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-primary)" }}>{text}</Text>
            {record.isShared && (
              <Tag color="purple" style={{ margin: 0, fontSize: 10, borderRadius: 4, transform: "scale(0.9)", transformOrigin: "left center" }}>
                SHARED
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "PROJECT",
      dataIndex: "project",
      key: "project",
      render: (project: any) => project ? (
        <Space size={6}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1677ff" }} />
          <Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>{project.name}</Text>
        </Space>
      ) : (
        <Tag color="default" style={{ borderRadius: 4, fontSize: 11, fontWeight: 500 }}>CROSS-PROJECT</Tag>
      ),
    },
    {
      title: "DESCRIPTION",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Text type="secondary" style={{ fontSize: 13, maxWidth: 300 }} ellipsis={{ tooltip: text }}>
          {text || "No description provided"}
        </Text>
      ),
    },
    {
      title: "STATISTICS",
      key: "stats",
      render: (_: any, record: Bucket) => (
        <Space size="large">
          <Tooltip title="Tickets">
            <Space size={6}>
              <FileTextOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
              <Text strong style={{ fontSize: 13 }}>{(record as any)._count?.tickets || 0}</Text>
            </Space>
          </Tooltip>
          {record.isShared && (
            <Tooltip title="Members">
              <Space size={6}>
                <TeamOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
                <Text type="secondary" style={{ fontSize: 13 }}>{record.members?.length || 0}</Text>
              </Space>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: Bucket) => (
        <Space size={0}>
          <Tooltip title="View Details">
            <Button
              type="text"
              shape="circle"
              icon={<EyeOutlined style={{ color: "#1677ff" }} />}
              onClick={() => handleView(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined style={{ color: "#8c8c8c" }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Bucket"
            description="Are you sure? Tickets will not be deleted."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              shape="circle"
              danger
              icon={<DeleteOutlined />}
              loading={deleteBucket.isPending && deleteBucket.variables === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 32px 32px", background: "var(--bg-pure-white)", minHeight: "100vh" }}>
      {contextHolder}

      {/* Header Section */}
      <div style={{ 
        padding: "24px 0 32px", 
        background: "var(--bg-pure-white)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 24]}>
          <Col xs={24} md={12}>
            <Space size={16} align="center">
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 14, 
                background: "linear-gradient(135deg, #1677ff 0%, #0050b3 100%)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(22, 119, 255, 0.25)"
              }}>
                <FolderOpenOutlined style={{ fontSize: 24, color: "#fff" }} />
              </div>
              <Space direction="vertical" size={0}>
                <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                  Buckets
                </Title>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  Organize and group tickets across your projects
                </Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            <Space size="middle" wrap>
              <Select
                placeholder={
                  <Space size={8}>
                    <ProjectOutlined style={{ color: "#bfbfbf" }} />
                    <span>Filter by Project</span>
                  </Space>
                }
                style={{ width: 240 }}
                value={selectedProject}
                onChange={setSelectedProject}
                allowClear
                size="large"
                styles={{ 
                  popup: { root: { borderRadius: 12, boxShadow: "0 6px 16px rgba(0,0,0,0.08)" } }
                }}
              >
                <Option value={null}>
                  <Space>
                    <ProjectOutlined />
                    <span>All Projects</span>
                  </Space>
                </Option>
                {projects?.map((project: any) => (
                  <Option key={project.value} value={project.value}>
                    <Space>
                      <Badge status="processing" color="#1677ff" />
                      {project.label}
                    </Space>
                  </Option>
                ))}
              </Select>
              <Tooltip title="Refresh List">
                <Button
                  icon={<ReloadOutlined style={{ color: "#595959" }} />}
                  onClick={() => refetch()}
                  loading={isLoading}
                  size="large"
                  style={{ 
                    borderRadius: 10, 
                    border: "1px solid #e8e8e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-pure-white)"
                  }}
                />
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
                style={{ 
                  borderRadius: 10, 
                  fontWeight: 700, 
                  boxShadow: "0 4px 12px rgba(22, 119, 255, 0.2)",
                  background: "#1677ff",
                  padding: "0 24px"
                }}
              >
                Create Bucket
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Summary Statistics Row */}
      {!isLoading && buckets.length > 0 && (
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 14, 
                  background: "#e6f7ff", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <FolderOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Total Buckets</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{buckets.length}</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 14, 
                  background: "#f9f0ff", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <TeamOutlined style={{ fontSize: 24, color: "#722ed1" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Shared</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    {buckets.filter(b => b.isShared).length}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 14, 
                  background: "#fff7e6", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <FileTextOutlined style={{ fontSize: 24, color: "#fa8c16" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Total Tickets</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    {buckets.reduce((acc, b) => acc + ((b as any)._count?.tickets || 0), 0)}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 14, 
                  background: "#f6ffed", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <ProjectOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Cross-Project</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    {buckets.filter(b => !b.projectId).length}
                  </Title>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Buckets Table */}
      <Card 
        bodyStyle={{ padding: 0 }} 
        style={{ 
          borderRadius: 20, 
          overflow: "hidden", 
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-pure-white)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}
      >
        <Table
          dataSource={buckets}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          className="premium-table"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            style: { padding: "16px 24px" }
          }}
          onRow={(record) => ({
            onClick: () => handleView(record.id),
            style: { cursor: "pointer" }
          })}
          locale={{
            emptyText: (
              <div style={{ padding: "60px 0" }}>
                <Empty
                  image={<FolderOpenOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />}
                  description={
                    <div style={{ marginTop: 12 }}>
                      <Text strong style={{ fontSize: 16 }}>No buckets found</Text>
                      <br />
                      <Text type="secondary">Start organizing your tasks by creating your first bucket.</Text>
                    </div>
                  }
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleCreate}
                    style={{ borderRadius: 8, marginTop: 8 }}
                  >
                    Create Bucket
                  </Button>
                </Empty>
              </div>
            )
          }}
        />
      </Card>

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
