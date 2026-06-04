"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  message,
  Input,
  Avatar,
  Empty,
  Tag,
  App,
  Skeleton,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  useProjectTrash,
  useRestoreProject,
  usePermanentDeleteProject,
  useEmptyTrash,
  useBulkRestoreProjects,
  useBulkPermanentDeleteProjects,
} from "@/hooks/useProjectTrash";
import { useQueryClient } from "@tanstack/react-query";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function ProjectTrashManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data: trashProjects, isLoading, refetch } = useProjectTrash();
  const restoreProject = useRestoreProject();
  const permanentDelete = usePermanentDeleteProject();
  const emptyTrash = useEmptyTrash();
  const bulkRestore = useBulkRestoreProjects();
  const bulkDelete = useBulkPermanentDeleteProjects();

  const filteredProjects = trashProjects?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns = [
    {
      title: "Project",
      key: "project",
      width: 250,
      render: (record: any) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ fontSize: 14 }}>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
        </div>
      ),
    },
    {
      title: "Project Manager",
      dataIndex: "projectManager",
      key: "manager",
      width: 200,
      render: (manager: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar src={manager?.avatarUrl} size="small">
            {manager?.name?.[0]}
          </Avatar>
          <Text style={{ fontSize: 13 }}>{manager?.name}</Text>
        </div>
      ),
    },
    {
      title: "Deleted At",
      dataIndex: "updatedAt",
      key: "deletedAt",
      width: 180,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Text style={{ fontSize: 13 }}>{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: () => <Tag color="error">DELETED</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: "right" as const,
      fixed: "right" as const,
      render: (record: any) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Tooltip title="Restore Project">
            <Button
              type="text"
              icon={<UndoOutlined style={{ color: "#52c41a" }} />}
              onClick={() => restoreProject.mutate(record.id, {
                onSuccess: () => {
                  message.success("Project restored successfully");
                }
              })}
              loading={restoreProject.isPending}
            />
          </Tooltip>
          <Popconfirm
            title="Permanently delete project?"
            description="This action cannot be undone. All associated data will be lost."
            onConfirm={() => permanentDelete.mutate(record.id, {
              onSuccess: () => {
                message.success("Project permanently deleted");
              }
            })}
            okText="Yes, delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
          >
            <Tooltip title="Permanent Delete">
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                loading={permanentDelete.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="project-trash-container">
      <TimeTrackingHeader
        style={{
          padding: "9.5px 24px",
          margin: "0 -8px",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: 20
        }}
        icon={<InboxOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />}
        title="Project Trash Repository"
        description="Recover deleted projects or permanently purge them from the system."
        extra={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Input
              placeholder="Search projects..."
              prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
              style={{
                width: 240,
                borderRadius: 8,
                background: "transparent",
                borderColor: "var(--border-color)"
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Tooltip title="Refresh view">
              <Button
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={async () => {
                  setIsRefreshing(true);
                  await queryClient.invalidateQueries({ queryKey: ["projects-trash"] });
                  setIsRefreshing(false);
                  message.success("Trash view refreshed");
                }}
                loading={isLoading || isRefreshing}
                style={{
                  borderRadius: 8,
                  background: "transparent",
                  borderColor: "var(--border-color)"
                }}
              />
            </Tooltip>

            <Popconfirm
              title="Empty trash repository?"
              description="This will permanently delete all projects currently in the trash. This action cannot be undone."
              onConfirm={() => emptyTrash.mutate()}
              okText="Yes, empty all"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: emptyTrash.isPending }}
              icon={<DeleteOutlined style={{ color: "red" }} />}
              disabled={filteredProjects.length === 0 || isLoading}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                loading={emptyTrash.isPending}
                style={{ borderRadius: 8, height: 32 }}
                disabled={filteredProjects.length === 0 || isLoading}
              >
                Empty Trash
              </Button>
            </Popconfirm>
          </div>
        }
      />

      <div style={{ padding: "0 24px", marginTop: 24 }}>
        {selectedRowKeys.length > 0 && (
          <div className="saas-bulk-actions">
            <div className="saas-bulk-content">
              <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1890ff' }} />
              <Text strong style={{ marginLeft: 8 }}>Projects Selected</Text>
            </div>
            <div className="saas-bulk-buttons">
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => {
                  bulkRestore.mutate(selectedRowKeys as string[], {
                    onSuccess: () => setSelectedRowKeys([])
                  });
                }}
                loading={bulkRestore.isPending}
                className="saas-bulk-btn restore"
              >
                Restore
              </Button>
              <Popconfirm
                title={`Purge ${selectedRowKeys.length} projects?`}
                description="This will permanently delete the selected projects. This action cannot be undone."
                onConfirm={() => {
                  bulkDelete.mutate(selectedRowKeys as string[], {
                    onSuccess: () => setSelectedRowKeys([])
                  });
                }}
                okText="Purge Selected"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: bulkDelete.isPending }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={bulkDelete.isPending}
                  className="saas-bulk-btn purge"
                >
                  Purge
                </Button>
              </Popconfirm>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setSelectedRowKeys([])}
                className="saas-bulk-btn cancel"
              />
            </div>
          </div>
        )}

        <Card
          styles={{ body: { padding: 0 } }}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            background: "var(--bg-pure-white)",
            transition: "all 0.3s ease",
            boxShadow: "var(--premium-shadow)"
          }}
        >
          <Table
            rowSelection={(isLoading || isRefreshing) ? undefined : {
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys)
            }}
            dataSource={(isLoading || isRefreshing) ? Array(5).fill({}) : filteredProjects}
            columns={columns.map(col => ({
              ...col,
              render: (text: any, record: any, index: number) => {
                if (isLoading || isRefreshing) {
                  return <Skeleton.Input active size="small" block style={{ height: 20 }} />;
                }
                return col.render ? (col.render as any)(text, record, index) : text;
              }
            }))}
            loading={false}
            rowKey={(record: any) => record.id || Math.random()}
            pagination={{ pageSize: 10, size: "small" }}
            scroll={{ x: "max-content" }}
            className="saas-table"
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<Text type="secondary">No projects found in trash</Text>}
                />
              ),
            }}
          />
        </Card>
      </div>

      <style jsx global>{`
        .project-trash-container {
          min-height: calc(100vh - 64px);
          background: var(--bg-primary);
          transition: background 0.3s ease;
        }
        
        .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 700 !important;
          color: var(--text-slate-500) !important;
          border-bottom: 1px solid var(--border-color) !important;
        }

        .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-color) !important;
        }

        .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }

        [data-theme='dark'] .project-trash-container {
          background: #0B0F1A;
        }

        [data-theme='dark'] .ant-table-thead > tr > th {
          background: #161B22 !important;
          color: #94A3B8 !important;
          border-bottom-color: #1F2937 !important;
        }

        [data-theme='dark'] .ant-table-tbody > tr > td {
          border-bottom-color: #1F2937 !important;
        }

        [data-theme='dark'] .ant-table-tbody > tr:hover > td {
          background: #1F2937 !important;
        }

        [data-theme='dark'] .ant-card {
          background: #161B22 !important;
          border-color: #1F2937 !important;
        }

        .saas-bulk-actions {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--premium-shadow);
          animation: slideIn 0.3s ease-out;
        }

        .saas-bulk-content {
          display: flex;
          align-items: center;
        }

        .saas-bulk-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .saas-bulk-btn {
          border-radius: 6px !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          height: 32px !important;
          padding: 4px 12px !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }

        .saas-bulk-btn.restore {
          color: #52c41a !important;
        }
        .saas-bulk-btn.restore:hover {
          background: #f6ffed !important;
        }

        .saas-bulk-btn.purge {
          color: #ff4d4f !important;
        }
        .saas-bulk-btn.purge:hover {
          background: #fff1f0 !important;
        }

        .saas-bulk-btn.cancel {
          color: var(--text-slate-400) !important;
        }
        .saas-bulk-btn.cancel:hover {
          background: var(--bg-slate-50) !important;
        }

        [data-theme='dark'] .saas-bulk-actions {
          background: #161B22;
          border-color: #1F2937;
        }
        [data-theme='dark'] .saas-bulk-btn.restore:hover {
          background: rgba(82, 196, 26, 0.1) !important;
        }
        [data-theme='dark'] .saas-bulk-btn.purge:hover {
          background: rgba(255, 77, 79, 0.1) !important;
        }
        [data-theme='dark'] .saas-bulk-btn.cancel:hover {
          background: #1F2937 !important;
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}



// comments added for testing
