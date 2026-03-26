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


const BucketCard = ({ 
  bucket, 
  handleEdit, 
  handleDelete, 
  handleView, 
  deleteBucket 
}: { 
  bucket: Bucket; 
  handleEdit: (b: Bucket) => void; 
  handleDelete: (id: string) => void; 
  handleView: (id: string) => void;
  deleteBucket: any;
}) => {
  const [hovered, setHovered] = useState(false);
  const ticketCount = (bucket as any)._count?.tickets || 0;
  const memberCount = bucket.members?.length || 0;
  const project = typeof bucket.project === "object" ? bucket.project : null;

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => handleView(bucket.id)}
      style={{
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered 
          ? "0 12px 24px rgba(0,0,0,0.08)" 
          : "0 2px 8px rgba(0,0,0,0.02)",
        overflow: "hidden",
        cursor: "pointer",
        height: "100%"
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ padding: "24px" }}>
        {/* Card Handle (Color) */}
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 4, 
          background: bucket.color || "#1677ff",
          opacity: 0.8
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 12, 
            background: `${bucket.color || "#1677ff"}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <FolderOutlined style={{ fontSize: 22, color: bucket.color || "#1677ff" }} />
          </div>
          <Space>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ fontSize: 16, color: "#8c8c8c" }} />}
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
                icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                loading={
                  deleteBucket.isPending &&
                  deleteBucket.variables === bucket.id
                }
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }} ellipsis>
            {bucket.name}
          </Title>
          {project ? (
            <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.02em" }}>
              {project.name}
            </Text>
          ) : (
            <Tag color="purple" style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 600 }}>
              CROSS-PROJECT
            </Tag>
          )}
        </div>

        <Typography.Paragraph 
          type="secondary" 
          style={{ fontSize: 13, marginBottom: 20, height: 40, lineHeight: "1.5" }} 
          ellipsis={{ rows: 2 }}
        >
          {bucket.description || "No description provided for this bucket."}
        </Typography.Paragraph>

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          paddingTop: 16, 
          borderTop: "1px solid #f5f5f5" 
        }}>
          <Space size="middle">
            <Tooltip title="Total Tickets">
              <Space size={6}>
                <FileTextOutlined style={{ color: "#1677ff", fontSize: 14 }} />
                <Text strong style={{ fontSize: 13 }}>{ticketCount}</Text>
              </Space>
            </Tooltip>
            {bucket.isShared && (
              <Tooltip title="Bucket Members">
                <Space size={6}>
                  <TeamOutlined style={{ color: "#722ed1", fontSize: 14 }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>{memberCount}</Text>
                </Space>
              </Tooltip>
            )}
          </Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            style={{ padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleView(bucket.id);
            }}
          >
            View
          </Button>
        </div>
      </div>
    </Card>
  );
};

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

  return (
    <div style={{ padding: "0 32px 32px", background: "#ffffff", minHeight: "100vh" }}>
      {contextHolder}

      {/* Header Section */}
      <div style={{ 
        padding: "24px 0", 
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={2}>
              <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Buckets
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Organize and group tickets across your projects
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            <Space size="middle" wrap>
              <Select
                placeholder="Filter by Project"
                style={{ width: 220, height: 40 }}
                value={selectedProject}
                onChange={setSelectedProject}
                allowClear
                styles={{ popup: { root: { borderRadius: 12 } } }}
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
                style={{ height: 40, borderRadius: 8 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                style={{ height: 40, borderRadius: 8, fontWeight: 600, boxShadow: "0 2px 4px rgba(22, 119, 255, 0.15)" }}
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
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
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
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
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
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
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
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
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

      {/* Bucket Cards Grid */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "100px" }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading buckets">
            <div style={{ height: 40 }} />
          </Spin>
        </div>
        </div>
      ) : buckets.length === 0 ? (
        <div style={{ 
          padding: "100px 0", 
          textAlign: "center", 
          background: "#fafafa", 
          borderRadius: 20, 
          border: "1px dashed #d9d9d9" 
        }}>
          <Empty
            image={<FolderOpenOutlined style={{ fontSize: 64, color: "#bfbfbf" }} />}
            description={
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>No buckets found</Text>
                <Text type="secondary">Start organizing your tasks by creating your first bucket.</Text>
              </div>
            }
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
              style={{ height: 44, padding: "0 24px", borderRadius: 8, marginTop: 16 }}
            >
              Create Your First Bucket
            </Button>
          </Empty>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {buckets.map((bucket: Bucket) => (
            <Col xs={24} sm={12} md={8} lg={6} key={bucket.id}>
              <BucketCard 
                bucket={bucket}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleView={handleView}
                deleteBucket={deleteBucket}
              />
            </Col>
          ))}
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
