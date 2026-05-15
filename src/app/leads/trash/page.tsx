"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Typography,
  Space,
  Tooltip,
  Tag,
  Popconfirm,
  App,
  Empty,
  Card,
  Input,
  Skeleton,
  Badge
} from "antd";
import {
  UndoOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  InboxOutlined,
  SearchOutlined,
  CloseOutlined
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import LeadService, { Lead } from "@/services/leadService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

dayjs.extend(relativeTime);

const { Text } = Typography;
export default function LeadsTrashPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { message } = App.useApp();
  const { leads, loading, fetchTrashLeads, emptyTrash, bulkRestoreLeads, bulkDeleteLeads } = useLeads();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { canReadLeadTrash, canRestoreLeadTrash, canDeleteLeadTrash } = usePermission();

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthLoading && user && !canReadLeadTrash) {
      router.push("/dashboard");
    }
  }, [user, isAuthLoading, canReadLeadTrash, router]);

  useEffect(() => {
    fetchTrashLeads();
  }, [fetchTrashLeads]);

  const handleRestore = async (id: string) => {
    try {
      await LeadService.restore(id);
      message.success("Lead restored successfully");
      fetchTrashLeads();
    } catch (error: any) {
      message.error(error.message || "Failed to restore lead");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await LeadService.permanentDelete(id);
      message.success("Lead permanently deleted");
      fetchTrashLeads();
    } catch (error: any) {
      message.error(error.message || "Failed to delete lead permanently");
    }
  };

  const filteredLeads = leads?.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns = [
    {
      title: "Lead Details",
      key: "lead",
      render: (record: Lead) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ fontSize: 14 }}>{record.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.client_name}</Text>
        </div>
      ),
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
      render: (platform: string) => (
        <Tag color="blue">{platform || 'Upwork'}</Tag>
      ),
    },
    {
      title: "Deleted At",
      key: "deletedAt",
      width: 180,
      render: (record: any) => (
        <Tooltip title={record.deleted_at ? dayjs(record.deleted_at).format("YYYY-MM-DD HH:mm:ss") : "N/A"}>
          <Text style={{ fontSize: 13 }}>
            {record.deleted_at ? dayjs(record.deleted_at).fromNow() : "Recently"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Auto-Purge",
      key: "purge",
      width: 150,
      render: (record: any) => {
        if (!record.deleted_at) return <Tag color="warning">N/A</Tag>;
        const purgeDate = dayjs(record.deleted_at).add(7, 'days');
        const daysLeft = purgeDate.diff(dayjs(), 'day');
        return (
          <Tag color={daysLeft <= 1 ? "error" : "warning"}>
            {daysLeft <= 0 ? "Purging soon" : `${daysLeft} days left`}
          </Tag>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 120,
      render: (record: Lead) => (
        <Space size={8}>
          {canRestoreLeadTrash && (
            <Tooltip title="Restore Lead">
              <Button
                type="text"
                icon={<UndoOutlined style={{ color: "#52c41a" }} />}
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          )}
          {canDeleteLeadTrash && (
            <Popconfirm
              title="Permanently delete lead?"
              description="This action cannot be undone."
              onConfirm={() => handlePermanentDelete(record.id)}
              okText="Yes, delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
            >
              <Tooltip title="Permanent Delete">
                <Button
                  type="text"
                  icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="leads-trash-container">
          <TimeTrackingHeader
            style={{
              padding: "9.5px 24px",
              margin: "0 -8px",
              borderBottom: "1px solid var(--border-color)",
              marginBottom: 20
            }}
            icon={<InboxOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />}
            title="Leads Trash Repository"
            description="Recover deleted leads or permanently purge them from the system."
            extra={
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Input
                  placeholder="Search leads..."
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
                      await fetchTrashLeads();
                      setIsRefreshing(false);
                      message.success("Trash view synchronized");
                    }}
                    loading={loading && !isRefreshing}
                    style={{
                      borderRadius: 8,
                      background: "transparent",
                      borderColor: "var(--border-color)"
                    }}
                  />
                </Tooltip>

                {canDeleteLeadTrash && (
                  <Popconfirm
                    title="Empty lead trash repository?"
                    description="This will permanently delete all leads currently in the trash. This action cannot be undone."
                    onConfirm={async () => {
                      try {
                        await emptyTrash();
                        message.success("Leads trash emptied successfully");
                      } catch (error: any) {
                        message.error(error.message || "Failed to empty trash");
                      }
                    }}
                    okText="Yes, empty all"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading }}
                    icon={<DeleteOutlined style={{ color: "red" }} />}
                    disabled={filteredLeads.length === 0 || loading}
                  >
                    <Button
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      loading={loading && !isRefreshing}
                      style={{ borderRadius: 8, height: 32 }}
                      disabled={filteredLeads.length === 0 || loading}
                    >
                      Empty Trash
                    </Button>
                  </Popconfirm>
                )}
              </div>
            }
          />

          <div style={{ padding: "0 24px", marginTop: 24 }}>
            {selectedRowKeys.length > 0 && (
              <div className="saas-bulk-actions">
                <div className="saas-bulk-content">
                  <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1890ff' }} />
                  <Text strong style={{ marginLeft: 8 }}>Leads Selected</Text>
                </div>
                <div className="saas-bulk-buttons">
                  {canRestoreLeadTrash && (
                    <Button
                      type="text"
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={async () => {
                        try {
                          await bulkRestoreLeads(selectedRowKeys as string[]);
                          setSelectedRowKeys([]);
                          message.success("Selected leads restored");
                        } catch (err: any) {
                          message.error("Failed to restore leads");
                        }
                      }}
                      loading={loading}
                      className="saas-bulk-btn restore"
                    >
                      Restore
                    </Button>
                  )}
                  {canDeleteLeadTrash && (
                    <Popconfirm
                      title={`Purge ${selectedRowKeys.length} leads?`}
                      description="This will permanently delete the selected leads. This action cannot be undone."
                      onConfirm={async () => {
                        try {
                          await bulkDeleteLeads(selectedRowKeys as string[]);
                          setSelectedRowKeys([]);
                          message.success("Selected leads purged");
                        } catch (err: any) {
                          message.error("Failed to purge leads");
                        }
                      }}
                      okText="Purge Selected"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true, loading }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={loading}
                        className="saas-bulk-btn purge"
                      >
                        Purge
                      </Button>
                    </Popconfirm>
                  )}
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
                rowSelection={(loading || isRefreshing) ? undefined : {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys)
                }}
                columns={columns.map(col => ({
                  ...col,
                  render: (text: any, record: any, index: number) => {
                    if (loading || isRefreshing) {
                      return <Skeleton.Input active size="small" block style={{ height: 24 }} />;
                    }
                    return col.render ? (col.render as any)(text, record, index) : text;
                  }
                }))}
                dataSource={(loading || isRefreshing) ? Array(5).fill({}) : filteredLeads}
                loading={false}
                rowKey={(record: any) => record.id || Math.random()}
                pagination={{ pageSize: 10, size: "small" }}
                className="saas-table"
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<Text type="secondary">No trashed leads found</Text>}
                    />
                  )
                }}
              />
            </Card>
          </div>
        </div>

        <style jsx global>{`
          .leads-trash-container {
            min-height: calc(100vh - 64px);
            background: var(--bg-primary);
            transition: background 0.3s ease;
          }

          .saas-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            font-weight: 700 !important;
            color: var(--text-slate-500) !important;
            border-bottom: 1px solid var(--border-color) !important;
          }

          .saas-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-color) !important;
          }

          .saas-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }

          [data-theme='dark'] .leads-trash-container {
            background: #0B0F1A;
          }

          [data-theme='dark'] .ant-table {
            background: transparent !important;
            color: #E2E8F0 !important;
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

          [data-theme='dark'] .ant-typography {
            color: #E2E8F0 !important;
          }

          [data-theme='dark'] .ant-typography-secondary {
            color: #94A3B8 !important;
          }

          [data-theme='dark'] .ant-empty-description {
            color: #94A3B8 !important;
          }

          /* Autofill fix for dark mode */
          [data-theme='dark'] input:-webkit-autofill,
          [data-theme='dark'] input:-webkit-autofill:hover,
          [data-theme='dark'] input:-webkit-autofill:focus,
          [data-theme='dark'] textarea:-webkit-autofill,
          [data-theme='dark'] textarea:-webkit-autofill:hover,
          [data-theme='dark'] textarea:-webkit-autofill:focus,
          [data-theme='dark'] select:-webkit-autofill,
          [data-theme='dark'] select:-webkit-autofill:hover,
          [data-theme='dark'] select:-webkit-autofill:focus {
            -webkit-text-fill-color: #c9d1d9 !important;
            -webkit-box-shadow: 0 0 0px 1000px #0d1117 inset !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
