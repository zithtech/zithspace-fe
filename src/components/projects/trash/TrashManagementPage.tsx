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
  Divider,
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
  ReloadOutlined,
  FireFilled,
  FilterOutlined,
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
const { Option } = Select;

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
      width: 140,
      render: (text: string, record: any) => {
        const daysRemaining = calculateDaysRemaining(record.deletedAt || record.createdAt);
        const isUrgent = daysRemaining <= 2;
        return (
          <div style={{ position: 'relative', paddingLeft: 12, whiteSpace: 'nowrap' }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: -16,
              bottom: -16,
              width: 3,
              background: isUrgent ? '#ef4444' : 'transparent',
              opacity: 0.8
            }} />
            <Text strong style={{
              color: "var(--premium-blue)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              letterSpacing: '-0.02em',
              background: 'var(--bg-slate-100)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid var(--border-slate-200)'
            }}>
              {text}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Title",
      key: "title",
      render: (_: any, record: any) => (
        <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)', letterSpacing: '-0.01em', lineHeight: '1.2' }}>{record.title}</Text>
      ),
    },
    {
      title: "Project",
      key: "project",
      width: 160,
      render: (_: any, record: any) => (
        <div className="tr-project-chip">
          <ProjectOutlined style={{ fontSize: 11, color: 'var(--text-slate-600)' }} />
          <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {record.project?.name || "Global"}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (status: string, record: any) => (
        <Tag className={`tr-status-tag ${record.status === 'completed' ? 'green' : 'slate'}`}>
          {record.status?.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Deleted By",
      key: "deletedBy",
      width: 180,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={24}
            style={{
              backgroundColor: "#6366f1",
              fontSize: 10,
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
            }}
          >
            {record.deletedBy?.name?.charAt(0) || "U"}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 12, display: "block", color: 'var(--text-slate-700)' }}>{record.deletedBy?.name || "System"}</Text>
            <Text style={{ fontSize: 10, color: 'var(--text-slate-400)', fontWeight: 600 }}>{dayjs(record.deletedAt || record.createdAt).fromNow().toUpperCase()}</Text>
          </div>
        </div>
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
            <div className={`tr-purge-badge ${isUrgent ? 'urgent' : 'safe'}`}>
              <ClockCircleOutlined style={{ color: isUrgent ? "#ef4444" : "#10b981", fontSize: 12 }} />
              <Text strong style={{ color: isUrgent ? "#ef4444" : "#10b981", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
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
    <div style={{ background: "var(--bg-pure-white)", minHeight: "100vh" }}>
      {/* Workstation Header */}
      <div className="saas-header-container" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        padding: '10.5px 48px',
        margin: '0 -24px 24px',
        marginBottom: 24
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size={16}>
              <div className="tr-header-icon-box">
                <DeleteOutlined style={{ fontSize: 18, color: '#ef4444' }} />
              </div>
              <Space split={<Divider type="vertical" className="tr-header-divider" />} size={16}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                  Trash Repository
                </Title>
                <Text style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>
                  Manage deleted tickets and optimize workspace capacity
                </Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space size={12}>
              <Popconfirm
                title="Empty Trash"
                description="This action will permanently purge ALL items. Continue?"
                onConfirm={handleEmptyTrash}
                okText="Purge All"
                cancelText="Keep"
                okButtonProps={{ danger: true, style: { fontWeight: 700 } }}
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<ClearOutlined />}
                  loading={emptyTrash.isPending}
                  disabled={!trashData?.tickets?.length}
                  style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}
                >
                  Empty Trash
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "0 32px 32px" }}>
        {/* Unified High-Density Trash Control Bar */}
        <div className="tr-control-bar">
          {/* 1. Technical Metrics Group */}
          <div className="tr-metrics-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="tr-metric-icon slate">
                <DeleteOutlined style={{ color: '#64748b', fontSize: 16 }} />
              </div>
              <div>
                <Text style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>{stats.total}</Text>
                <Text style={{ fontSize: 9, color: 'var(--text-slate-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL DELETED</Text>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`tr-metric-icon ${stats.purgingSoon > 0 ? 'red' : 'slate'}`}>
                <FireFilled style={{ color: stats.purgingSoon > 0 ? '#ef4444' : '#94a3b8', fontSize: 16 }} />
              </div>
              <div>
                <Text style={{ fontSize: 15, fontWeight: 800, color: stats.purgingSoon > 0 ? '#ef4444' : 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>{stats.purgingSoon}</Text>
                <Text style={{ fontSize: 9, color: 'var(--text-slate-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PURGING SOON</Text>
              </div>
            </div>
          </div>

          {/* Filter Cluster */}
          <div className="tr-filter-cluster">
            <div className="tr-filter-label">
              <FilterOutlined style={{ fontSize: 11, color: 'var(--text-slate-500)' }} />
              <Text className="tr-filter-label-text">Filters</Text>
              {(projectFilter || searchQuery) && (
                <span className="tr-filter-count">{(projectFilter ? 1 : 0) + (searchQuery ? 1 : 0)}</span>
              )}
            </div>

            {/* Project Selector */}
            <div className={`tr-filter-field ${projectFilter ? 'active' : ''}`}>
              <ProjectOutlined style={{ fontSize: 12, color: projectFilter ? '#3b82f6' : 'var(--text-slate-400)' }} />
              <Select
                placeholder="All Sources"
                variant="borderless"
                className="tr-filter-select"
                allowClear
                value={projectFilter}
                onChange={setProjectFilter}
                popupMatchSelectWidth={280}
              >
                {projects?.map((project: any) => (
                  <Option key={project.value} value={project.value} label={project.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Text style={{ fontSize: 12, fontWeight: 600 }}>{project.label}</Text>
                      <Tag className="tr-project-code-tag">{project.code}</Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Search */}
            <div className={`tr-filter-field tr-filter-search ${searchQuery ? 'active' : ''}`}>
              <SearchOutlined style={{ fontSize: 12, color: searchQuery ? '#3b82f6' : 'var(--text-slate-400)' }} />
              <Input
                placeholder="Search deleted tickets…"
                variant="borderless"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
              {!searchQuery && (
                <kbd className="tr-search-kbd">⌘K</kbd>
              )}
            </div>

            {/* Reset */}
            {(projectFilter || searchQuery) && (
              <Button
                size="small"
                type="text"
                className="tr-filter-reset"
                icon={<ReloadOutlined style={{ fontSize: 11 }} />}
                onClick={() => {
                  setSearchQuery("");
                  setProjectFilter(undefined);
                  refetch();
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Action Belt */}
        {selectedRowKeys.length > 0 && (
          <div className="tr-bulk-belt">
            <Space size={16}>
              <Text style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>{selectedRowKeys.length} NODES SELECTED FOR OPERATIONAL RECOVERY</Text>
              <Divider type="vertical" style={{ height: 16, borderLeft: '1px solid #3b82f6' }} />
              <Button size="small" type="primary" icon={<UndoOutlined />} onClick={handleBulkRestore} loading={bulkRestore.isPending} style={{ height: 28, fontSize: 11, fontWeight: 700, borderRadius: 4 }}>RESTORE NODES</Button>
              <Popconfirm title="Purge Selected?" onConfirm={handleBulkDelete} okText="Purge" okButtonProps={{ danger: true }}>
                <Button size="small" danger ghost icon={<DeleteOutlined />} loading={bulkDelete.isPending} style={{ height: 28, fontSize: 11, fontWeight: 700, borderRadius: 4 }}>PURGE SELECTED</Button>
              </Popconfirm>
            </Space>
            <Button type="text" size="small" onClick={() => setSelectedRowKeys([])} style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>CANCEL</Button>
          </div>
        )}

        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <Table
            rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
            columns={columns}
            dataSource={trashData?.tickets || []}
            rowKey="id"
            loading={isLoading}
            className="premium-table"
            pagination={{
              current: page,
              pageSize: limit,
              total: trashData?.pagination.total || 0,
              onChange: (p) => setPage(p),
              showTotal: (total) => <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{total} TICKETS IN REPOSITORY</Text>,
              style: { padding: "16px 24px" }
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>

      <style jsx global>{`
        /* ── Header ─────────────────────────────────────────────── */
        .tr-header-icon-box {
          width: 36px; height: 36px;
          background: var(--bg-red-50);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(239,68,68,0.2);
        }
        [data-theme='dark'] .tr-header-icon-box {
          background: rgba(239,68,68,0.15) !important;
          border-color: rgba(239,68,68,0.25) !important;
        }
        .tr-header-divider {
          height: 18px;
          border-left: 1.5px solid var(--border-slate-200);
          margin: 0;
        }

        /* ── Control bar ────────────────────────────────────────── */
        .tr-control-bar {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }
        [data-theme='dark'] .tr-control-bar {
          background: #161b22 !important;
          border-color: #1f2937 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }

        /* ── Metrics ─────────────────────────────────────────────── */
        .tr-metrics-group {
          display: flex; align-items: center; gap: 24px;
        }
        .tr-metric-icon {
          width: 34px; height: 34px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .tr-metric-icon.slate {
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
        }
        .tr-metric-icon.red {
          background: var(--bg-red-50);
          border: 1px solid rgba(239,68,68,0.2);
        }
        [data-theme='dark'] .tr-metric-icon.slate {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .tr-metric-icon.red {
          background: rgba(239,68,68,0.15) !important;
          border-color: rgba(239,68,68,0.25) !important;
        }

        /* ── Filter cluster ─────────────────────────────────────── */
        .tr-filter-cluster {
          display: flex; align-items: center; gap: 8px;
          padding: 4px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 8px;
        }
        [data-theme='dark'] .tr-filter-cluster {
          background: #0f1620 !important;
          border-color: #1f2937 !important;
        }
        .tr-filter-label {
          display: flex; align-items: center; gap: 6px;
          padding: 0 10px 0 8px;
          border-right: 1px solid var(--border-slate-200);
          height: 24px;
        }
        [data-theme='dark'] .tr-filter-label {
          border-right-color: #1f2937 !important;
        }
        .tr-filter-label-text {
          font-size: 10px !important;
          font-weight: 800 !important;
          color: var(--text-slate-500) !important;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .tr-filter-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 16px; height: 16px; padding: 0 5px;
          background: #3b82f6; color: #fff;
          font-size: 10px; font-weight: 800;
          border-radius: 8px;
        }

        /* Individual filter field */
        .tr-filter-field {
          display: flex; align-items: center; gap: 8px;
          height: 32px;
          padding: 0 10px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 6px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .tr-filter-field:hover {
          border-color: var(--border-slate-200);
        }
        .tr-filter-field.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        [data-theme='dark'] .tr-filter-field {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .tr-filter-field:hover {
          border-color: #374151 !important;
        }
        [data-theme='dark'] .tr-filter-field.active {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important;
        }
        .tr-filter-search {
          width: 280px;
        }
        .tr-filter-search .ant-input {
          font-size: 12px;
          font-weight: 600;
          padding: 0;
        }

        /* Filter select */
        .tr-filter-select {
          width: 180px;
        }
        .tr-filter-select .ant-select-selector {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          height: 30px !important;
        }
        .tr-filter-select .ant-select-selection-item,
        .tr-filter-select .ant-select-selection-placeholder {
          font-size: 12px !important;
          font-weight: 600 !important;
          line-height: 30px !important;
        }
        .tr-project-code-tag {
          margin: 0; font-size: 10px; font-weight: 800;
          background: var(--bg-slate-100); border: none; color: var(--text-slate-600);
        }
        [data-theme='dark'] .tr-project-code-tag {
          background: #374151 !important;
          color: #94a3b8 !important;
        }

        /* Keyboard shortcut hint */
        .tr-search-kbd {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
          color: var(--text-slate-400);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 1px 6px; border-radius: 4px;
          line-height: 1.4;
        }
        [data-theme='dark'] .tr-search-kbd {
          background: #0b0f1a !important;
          border-color: #374151 !important;
          color: #6b7280 !important;
        }

        /* Reset button */
        .tr-filter-reset {
          height: 32px !important;
          color: var(--text-slate-500) !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 6px !important;
        }
        .tr-filter-reset:hover {
          color: #ef4444 !important;
          background: var(--bg-red-50) !important;
        }
        [data-theme='dark'] .tr-filter-reset:hover {
          background: rgba(239,68,68,0.1) !important;
        }

        /* ── Bulk action belt ───────────────────────────────────── */
        .tr-bulk-belt {
          margin-bottom: 16px;
          display: flex; justify-content: space-between; align-items: center;
          background: var(--bg-blue-50);
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid var(--border-blue-200);
        }
        [data-theme='dark'] .tr-bulk-belt {
          background: rgba(59,130,246,0.1) !important;
          border-color: rgba(59,130,246,0.2) !important;
        }

        /* ── Project chip ───────────────────────────────────────── */
        .tr-project-chip {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-slate-50);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-slate-200);
          width: fit-content;
        }
        [data-theme='dark'] .tr-project-chip {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }

        /* ── Status tags ────────────────────────────────────────── */
        .tr-status-tag {
          font-size: 10px; font-weight: 800;
          margin: 0; border-radius: 4;
          padding: 2px 8px; text-transform: uppercase;
        }
        .tr-status-tag.green {
          background: var(--bg-green-50); color: #10b981;
          border: 1px solid var(--border-green-200);
        }
        .tr-status-tag.slate {
          background: var(--bg-slate-100); color: var(--text-slate-600);
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tr-status-tag.green {
          background: rgba(16,185,129,0.15) !important;
          color: #34d399 !important;
          border-color: rgba(16,185,129,0.2) !important;
        }
        [data-theme='dark'] .tr-status-tag.slate {
          background: #1f2937 !important;
          color: #94a3b8 !important;
          border-color: #374151 !important;
        }

        /* ── Purge badge ────────────────────────────────────────── */
        .tr-purge-badge {
          padding: 4px 10px; border-radius: 4px;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .tr-purge-badge.urgent {
          background: var(--bg-red-50);
          border: 1px solid rgba(239,68,68,0.2);
        }
        .tr-purge-badge.safe {
          background: var(--bg-green-50);
          border: 1px solid var(--border-green-200);
        }
        [data-theme='dark'] .tr-purge-badge.urgent {
          background: rgba(239,68,68,0.12) !important;
          border-color: rgba(239,68,68,0.2) !important;
        }
        [data-theme='dark'] .tr-purge-badge.safe {
          background: rgba(16,185,129,0.1) !important;
          border-color: rgba(16,185,129,0.2) !important;
        }

        /* ── Ticket number badge ─────────────────────────────────── */
        /* handled via CSS var inline, but override background in dark */
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td:first-child .ant-typography {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }

        /* ── Premium table ───────────────────────────────────────── */
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-pure-white);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 16px;
          border-bottom: 2px solid var(--border-slate-100);
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-slate-100);
          transition: all 0.2s ease;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td {
          background: #1f2937 !important;
        }
        [data-theme='dark'] .premium-table .ant-table {
          background: #161b22 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-wrapper .ant-card {
          background: #161b22 !important;
        }

        /* ── Misc ───────────────────────────────────────────────── */
        .saas-header-container .ant-typography {
          margin-bottom: 0 !important;
        }
        .saas-button-item {
          border-radius: 4px !important;
          transition: all 0.2s ease;
          border: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
}
