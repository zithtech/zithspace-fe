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
  Divider,
  Input,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOutlined,
  TeamOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { useBuckets, useDeleteBucket, useMoveBucketToSprint, useMoveBucketToBacklog } from "@/hooks/useBuckets";
import { CreateBucketModal } from "./CreateBucketModal";
import { BucketDetailDrawer } from "./BucketDetailDrawer";
import { MoveToSprintAction } from "./MoveToSprintAction";
import type { Bucket } from "@/services/bucketService";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Option } = Select;

export default function BucketManagementPage() {
  const [api, contextHolder] = notification.useNotification({
    placement: 'top',
  });
  const router = useRouter();

  // State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "shared" | "private">("all");

  // Queries
  const { data: projects } = useUserProjects();
  const {
    data: bucketsData,
    isLoading,
    refetch,
  } = useBuckets(selectedProject || undefined);

  const deleteBucket = useDeleteBucket();
  const moveBucketToSprint = useMoveBucketToSprint();
  const moveBucketToBacklog = useMoveBucketToBacklog();

  const buckets = (bucketsData || []).filter(bucket => {
    const matchesSearch = bucket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bucket.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    const matchesType = typeFilter === "all" ? true :
      typeFilter === "shared" ? bucket.isShared : !bucket.isShared;

    return matchesSearch && matchesType;
  });

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
      title: "REPOSITORY",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Bucket) => (
        <Space size="middle">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            background: `${record.color || "#1677ff"}08`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${record.color || "#1677ff"}15`
          }}>
            <FolderOutlined style={{ fontSize: 15, color: record.color || "#1677ff" }} />
          </div>
          <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)', letterSpacing: '-0.012em' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "VISIBILITY",
      dataIndex: "isShared",
      key: "visibility",
      width: 120,
      render: (isShared: boolean) => isShared ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
          <Text style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Public Hub</Text>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }} />
          <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Private</Text>
        </div>
      ),
    },
    {
      title: "CONNECTED PROJECT",
      dataIndex: "project",
      key: "project",
      width: 220,
      render: (project: any) => project ? (
        <div className="bh-project-tag">
          <ProjectOutlined style={{ fontSize: 11, color: 'var(--text-slate-600)' }} />
          <Text style={{ fontSize: 11, color: 'var(--text-slate-700)', fontWeight: 700 }}>{project.name}</Text>
        </div>
      ) : (
        <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, fontStyle: 'italic' }}>Cross-Project</Text>
      ),
    },
    {
      title: "ALLOCATION",
      key: "stats",
      width: 180,
      render: (_: any, record: Bucket) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tooltip title="Tickets Allocated">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileTextOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
              <Text strong style={{ fontSize: 12, color: 'var(--text-slate-600)' }}>{(record as any)._count?.tickets || 0}</Text>
            </div>
          </Tooltip>
          {record.isShared && (
            <Tooltip title="Collaborators">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border-slate-100)', paddingLeft: 12 }}>
                <TeamOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
                <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{record.members?.length || 0}</Text>
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "ACTION",
      key: "actions",
      align: "right" as const,
      width: 120,
      render: (_: any, record: Bucket) => (
        <Space size={4}>
          <Tooltip title="Deep Dive">
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: 14, color: "#3b82f6" }} />}
              onClick={(e) => { e.stopPropagation(); handleView(record.id); }}
              className="saas-action-btn"
            />
          </Tooltip>
          <Tooltip title="Configure">
            <Button
              type="text"
              icon={<EditOutlined style={{ fontSize: 14, color: "#64748b" }} />}
              onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
              className="saas-action-btn"
            />
          </Tooltip>
          <Popconfirm
            title="Decommission Hub"
            description="Proceed with hard delete?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, style: { borderRadius: 2, fontSize: 11, fontWeight: 700 } }}
            cancelButtonProps={{ style: { borderRadius: 2, fontSize: 11, fontWeight: 700 } }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              loading={deleteBucket.isPending && deleteBucket.variables === record.id}
              onClick={(e) => e.stopPropagation()}
              className="saas-action-btn"
            />
          </Popconfirm>

          <MoveToSprintAction
            bucket={record}
            onMove={(sprintId) => moveBucketToSprint.mutate({ bucketId: record.id, sprintId })}
            loading={moveBucketToSprint.isPending && moveBucketToSprint.variables?.bucketId === record.id}
          />

          <Popconfirm
            title="Move to Backlog"
            description="Move all tickets in this hub back to the backlog?"
            onConfirm={(e) => { e?.stopPropagation(); moveBucketToBacklog.mutate(record.id); }}
            okText="Move"
            cancelText="Cancel"
            okButtonProps={{ style: { borderRadius: 2, fontSize: 11, fontWeight: 700 } }}
            cancelButtonProps={{ style: { borderRadius: 2, fontSize: 11, fontWeight: 700 } }}
          >
            <Button
              type="text"
              icon={<RollbackOutlined style={{ fontSize: 14, color: "#64748b" }} />}
              onClick={(e) => e.stopPropagation()}
              loading={moveBucketToBacklog.isPending && moveBucketToBacklog.variables === record.id}
              className="saas-action-btn"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{
      background: "var(--bg-pure-white)",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {contextHolder}

      {/* Workstation Header */}
      <div className="saas-header-container" style={{
        backdropFilter: 'blur(12px)',
        padding: '10.5px 12px',
        flexShrink: 0,
        zIndex: 100
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size={16}>
              <div className="bh-header-icon-box">
                <FolderOpenOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />
              </div>
              <Space split={<Divider type="vertical" className="bh-header-divider" />} size={16}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                  Buckets Hub
                </Title>
                <Text style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>
                  Strategic task organization and cross-project categorization
                </Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space size={12}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="saas-button-item"
                style={{ height: 36, fontWeight: 600 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                className="saas-button-item"
                style={{
                  height: 36,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  border: 'none',
                  padding: '0 20px'
                }}
              >
                Create New Bucket
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "16px 12px 32px", flex: 1, overflowY: "auto" }}>


        {/* Unified High-Density Buckets Control Bar */}
        <div className="bh-control-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
            {/* 1. Technical Metrics Group */}
            <div className="bh-metrics-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="bh-metric-icon purple">
                  <FolderOpenOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />
                </div>
                <div>
                  <Text style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>{buckets.length}</Text>
                  <Text style={{ fontSize: 8, color: 'var(--text-slate-400)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hubs</Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="bh-metric-icon slate">
                  <FileTextOutlined style={{ color: '#64748b', fontSize: 14 }} />
                </div>
                <div>
                  <Text style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>
                    {buckets.reduce((acc, b) => acc + ((b as any)._count?.tickets || 0), 0)}
                  </Text>
                  <Text style={{ fontSize: 8, color: 'var(--text-slate-400)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tickets</Text>
                </div>
              </div>
            </div>

            {/* 2. Advanced Selectors Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="bh-filter-select-wrap">
                <ProjectOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                <Select
                  placeholder="All Projects"
                  variant="borderless"
                  style={{ width: 160, fontSize: 12, fontWeight: 700 }}
                  allowClear
                  value={selectedProject}
                  onChange={setSelectedProject}
                  dropdownMatchSelectWidth={false}
                >
                  {projects?.map((project: any) => (
                    <Option key={project.value} value={project.value}>
                      <Text style={{ fontSize: 11, fontWeight: 600 }}>{project.label}</Text>
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="bh-filter-select-wrap">
                <FilterOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                <Select
                  variant="borderless"
                  style={{ width: 140, fontSize: 12, fontWeight: 700 }}
                  value={typeFilter}
                  onChange={setTypeFilter}
                >
                  <Option value="all">All Visibility</Option>
                  <Option value="shared">Public Only</Option>
                  <Option value="private">Private Only</Option>
                </Select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`bh-search-box ${searchQuery ? 'active' : ''}`}>
              <SearchOutlined style={{ color: searchQuery ? '#8b5cf6' : 'var(--text-slate-400)', fontSize: 13 }} />
              <Input
                placeholder="Search hub..."
                variant="borderless"
                style={{ fontSize: 12, fontWeight: 600, padding: 0 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
            </div>

            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined style={{ fontSize: 12 }} />}
              onClick={() => {
                setSelectedProject(null);
                setSearchQuery("");
                setTypeFilter("all");
              }}
              style={{ color: '#94a3b8', fontWeight: 800, fontSize: 10, height: 32, borderRadius: 6 }}
            >
              RESET
            </Button>
          </div>
        </div>

        {/* Buckets Table */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 0,
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            backgroundColor: "transparent",
            boxShadow: "none"
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
              size: "small",
              showTotal: (total) => <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{total} Operations Found</Text>,
              style: { padding: "8px 16px", margin: 0 }
            }}
            onRow={(record) => ({
              onClick: () => handleView(record.id),
            })}
            locale={{
              emptyText: (
                <div style={{ padding: "60px 0" }}>
                  <Empty
                    image={<FolderOpenOutlined style={{ fontSize: 48, color: "#cbd5e1" }} />}
                    description={
                      <div style={{ marginTop: 12 }}>
                        <Text strong style={{ fontSize: 16, color: 'var(--text-slate-900)' }}>No buckets found</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 13 }}>Start organizing your tasks by creating your first bucket.</Text>
                      </div>
                    }
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreate}
                      style={{ borderRadius: 6, marginTop: 8, height: 40, fontWeight: 700 }}
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

        <style jsx global>{`
        /* ── Header ─────────────────────────────────────────────── */
        .bh-header-icon-box {
          width: 36px; height: 36px;
          background: var(--bg-purple-50);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(139,92,246,0.2);
        }
        [data-theme='dark'] .bh-header-icon-box {
          background: rgba(139,92,246,0.15) !important;
          border-color: rgba(139,92,246,0.25) !important;
        }
        .bh-header-divider {
          height: 18px;
          border-left: 1.5px solid var(--border-slate-200);
          margin: 0;
        }

        /* ── Control bar ────────────────────────────────────────── */
        .bh-control-bar {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          margin-bottom: 20px;
        }
        [data-theme='dark'] .bh-control-bar {
          background: #161b22 !important;
          border-color: #1f2937 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
        }

        /* ── Metrics ─────────────────────────────────────────────── */
        .bh-metrics-group {
          display: flex; align-items: center; gap: 16px;
          padding-right: 20px;
          border-right: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .bh-metrics-group {
          border-right-color: #1f2937 !important;
        }
        .bh-metric-icon {
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .bh-metric-icon.purple {
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.12);
        }
        .bh-metric-icon.slate {
          background: rgba(100,116,139,0.08);
          border: 1px solid rgba(100,116,139,0.12);
        }
        [data-theme='dark'] .bh-metric-icon.purple {
          background: rgba(139,92,246,0.18) !important;
          border-color: rgba(139,92,246,0.25) !important;
        }
        [data-theme='dark'] .bh-metric-icon.slate {
          background: rgba(100,116,139,0.18) !important;
          border-color: rgba(100,116,139,0.25) !important;
        }

        /* ── Filter dropdowns ───────────────────────────────────── */
        .bh-filter-select-wrap {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-slate-50);
          padding: 0 10px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-100);
          height: 38px;
        }
        [data-theme='dark'] .bh-filter-select-wrap {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .bh-filter-select-wrap .ant-select-selector {
          background: transparent !important;
          border: none !important;
          color: var(--text-slate-900) !important;
        }

        /* ── Search box ─────────────────────────────────────────── */
        .bh-search-box {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-slate-50);
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-100);
          width: 240px; height: 38px;
          transition: all 0.2s ease;
        }
        .bh-search-box.active {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
        }
        [data-theme='dark'] .bh-search-box {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .bh-search-box.active {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
        }

        /* ── Project tag chip ───────────────────────────────────── */
        .bh-project-tag {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-slate-50);
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid var(--border-slate-100);
          width: fit-content;
        }
        [data-theme='dark'] .bh-project-tag {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }

        /* ── Premium table ──────────────────────────────────────── */
        .bh-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          font-weight: 700;
          color: var(--text-secondary) !important;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
        }
        [data-theme='dark'] .bh-table .ant-table-thead > tr > th {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .bh-table .ant-table-tbody > tr > td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-slate-100) !important;
          transition: all 0.2s;
        }
        [data-theme='dark'] .bh-table .ant-table-tbody > tr > td {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .bh-table .ant-table-row:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .bh-table .ant-table-row:hover > td {
          background: #1f2937 !important;
        }
        [data-theme='dark'] .bh-table .ant-table {
          background: #161b22 !important;
        }
        .bh-table .ant-card {
          border-color: var(--border-color) !important;
        }

        /* ── Action buttons ─────────────────────────────────────── */
        .saas-action-btn {
          display: flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 4px !important;
          transition: all 0.2s;
        }
        .saas-action-btn:hover {
          background: var(--bg-slate-100) !important;
          transform: translateY(-1px);
        }
        [data-theme='dark'] .saas-action-btn:hover {
          background: #1f2937 !important;
        }
      `}</style>
      </div>
    </div>
  );
}
