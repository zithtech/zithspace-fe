"use client";

import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Table,
  Button,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Input,
  Select,
  Avatar,
  Progress,
  Badge,
  Skeleton,
} from "antd";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  ClearOutlined,
  ProjectOutlined,
  ReloadOutlined,
  FireFilled,
  FilterOutlined,
  SafetyCertificateFilled,
  InboxOutlined,
  ThunderboltFilled,
  CloseOutlined,
} from "@ant-design/icons";
import {
  useTrashTickets,
  useRestoreFromTrash,
  usePermanentlyDelete,
  useBulkRestoreFromTrash,
  useBulkPermanentlyDelete,
  useEmptyTrash,
  trashKeys,
} from "@/hooks/useTrash";
import { useUserProjects } from "@/hooks/useGlobalData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const RETENTION_DAYS = 7;

const calculateDaysRemaining = (deletedAt: string) => {
  const deleteDate = dayjs(deletedAt);
  const purgeDate = deleteDate.add(RETENTION_DAYS, "days");
  const daysRemaining = purgeDate.diff(dayjs(), "days");
  return Math.max(0, daysRemaining);
};

const calculatePurgeProgress = (deletedAt: string) => {
  const deleteDate = dayjs(deletedAt);
  const elapsedHours = dayjs().diff(deleteDate, "hour");
  const totalHours = RETENTION_DAYS * 24;
  return Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100));
};

export default function TrashManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    const purgingSoon = tickets.filter((t) => {
      const days = calculateDaysRemaining(t.deletedAt || t.createdAt);
      return days <= 2;
    }).length;
    const recoverable = tickets.length - purgingSoon;

    return {
      total: trashData?.pagination.total || 0,
      purgingSoon,
      recoverable,
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
      await emptyTrash.mutateAsync({ projectId: projectFilter, force: true });
      setSelectedRowKeys([]);
      refetch();
    } catch (error) {
      console.error("Error emptying trash:", error);
    }
  };

  const columns = [
    {
      title: "Ticket",
      key: "ticket",
      render: (_: any, record: any) => {
        const daysRemaining = calculateDaysRemaining(record.deletedAt || record.createdAt);
        const isUrgent = daysRemaining <= 2;
        return (
          <div className="tr-ticket-cell">
            <span className={`tr-row-rail ${isUrgent ? "urgent" : ""}`} />
            <div className="tr-ticket-meta">
              <span className="tr-ticket-id">{record.ticketNumber}</span>
              <Text className="tr-ticket-title">{record.title}</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Project",
      key: "project",
      width: 170,
      render: (_: any, record: any) => (
        <div className="tr-project-chip">
          <span className="tr-project-dot" />
          <Text className="tr-project-text">{record.project?.name || "Global"}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_: any, record: any) => (
        <Tag className={`tr-status-tag ${record.status === "completed" ? "green" : "slate"}`}>
          {record.status?.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Deleted By",
      key: "deletedBy",
      width: 200,
      render: (_: any, record: any) => (
        <div className="tr-actor-cell">
          <Avatar
            size={28}
            src={record.deletedBy?.avatarUrl}
            className="tr-actor-avatar"
          >
            {record.deletedBy?.name?.charAt(0) || "S"}
          </Avatar>
          <div className="tr-actor-meta">
            <Text className="tr-actor-name">{record.deletedBy?.name || "System"}</Text>
            <Text className="tr-actor-time">
              {dayjs(record.deletedAt || record.createdAt).fromNow()}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Auto-Purge",
      key: "purge",
      width: 200,
      render: (_: any, record: any) => {
        const daysRemaining = calculateDaysRemaining(record.deletedAt || record.createdAt);
        const progress = calculatePurgeProgress(record.deletedAt || record.createdAt);
        const isUrgent = daysRemaining <= 2;
        return (
          <Tooltip
            title={`Permanently purged in approx. ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"
              }`}
          >
            <div className="tr-purge-cell">
              <div className="tr-purge-row">
                <ClockCircleOutlined
                  className={`tr-purge-icon ${isUrgent ? "urgent" : "safe"}`}
                />
                <Text className={`tr-purge-text ${isUrgent ? "urgent" : "safe"}`}>
                  {daysRemaining === 0 ? "Purging today" : `${daysRemaining}d remaining`}
                </Text>
              </div>
              <Progress
                percent={progress}
                showInfo={false}
                size="small"
                strokeColor={isUrgent ? "#ef4444" : "#10b981"}
                trailColor="var(--bg-slate-100)"
                className="tr-purge-progress"
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 96,
      align: "right" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div className="tr-action-cell">
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
                size="small"
                icon={<UndoOutlined />}
                loading={restoreTicket.isPending && restoreTicket.variables?.[0] === record.id}
                className="tr-icon-btn restore"
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
                size="small"
                icon={<DeleteOutlined />}
                loading={
                  permanentlyDelete.isPending &&
                  permanentlyDelete.variables?.[0] === record.id
                }
                className="tr-icon-btn purge"
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const isFiltered = !!(projectFilter || searchQuery);
  const hasItems = (trashData?.pagination.total || 0) > 0;

  return (
    <div className="tr-page">
      {/* Hero Header */}
      <div className="tr-hero">
        <div className="tr-hero-glow" />
        <div className="tr-hero-inner">
          <div className="tr-hero-left">
            <div className="tr-hero-badge">
              <DeleteOutlined />
            </div>
            <div className="tr-hero-text">

              <Title level={3} className="tr-hero-title">
                Trash Repository
              </Title>
              <Text className="tr-hero-sub">
                Restore deleted tickets within {RETENTION_DAYS} days. After that, items are
                permanently purged from the workspace.
              </Text>
            </div>
          </div>

          <div className="tr-hero-actions">
            <Tooltip title="Refresh">
              <Button
                type="text"
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={async () => {
                  setIsRefreshing(true);
                  await queryClient.invalidateQueries({ queryKey: trashKeys.all });
                  setIsRefreshing(false);
                  message.success("Trash refreshed");
                }}
                loading={isLoading}
                className="tr-hero-ghost"
              />
            </Tooltip>
            <Popconfirm
              title="Empty Trash"
              description="This will permanently purge ALL items. This action cannot be undone."
              onConfirm={handleEmptyTrash}
              okText="Purge All"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              disabled={!hasItems}
            >
              <Button
                danger
                icon={<ClearOutlined />}
                loading={emptyTrash.isPending}
                disabled={!hasItems}
                className="tr-hero-danger"
              >
                Empty Trash
              </Button>
            </Popconfirm>
          </div>
        </div>

        {/* Stat Strip */}
        <div className="tr-stat-strip">
          <div className="tr-stat">
            <div className="tr-stat-icon slate">
              <InboxOutlined />
            </div>
            <div className="tr-stat-body">
              <Text className="tr-stat-label">Total in Trash</Text>
              <div className="tr-stat-value">
                {stats.total}
                <span className="tr-stat-unit">items</span>
              </div>
            </div>
          </div>

          <div className="tr-stat-divider" />

          <div className="tr-stat">
            <div className="tr-stat-icon green">
              <SafetyCertificateFilled />
            </div>
            <div className="tr-stat-body">
              <Text className="tr-stat-label">Recoverable</Text>
              <div className="tr-stat-value">
                {stats.recoverable}
                <span className="tr-stat-unit">safe to restore</span>
              </div>
            </div>
          </div>

          <div className="tr-stat-divider" />

          <div className="tr-stat">
            <div className={`tr-stat-icon ${stats.purgingSoon > 0 ? "red pulse" : "slate"}`}>
              <FireFilled />
            </div>
            <div className="tr-stat-body">
              <Text className="tr-stat-label">Purging Soon</Text>
              <div
                className={`tr-stat-value ${stats.purgingSoon > 0 ? "danger" : ""}`}
              >
                {stats.purgingSoon}
                <span className="tr-stat-unit">≤ 2 days left</span>
              </div>
            </div>
          </div>

          <div className="tr-stat-divider" />

          <div className="tr-stat">
            <div className="tr-stat-icon blue">
              <ThunderboltFilled />
            </div>
            <div className="tr-stat-body">
              <Text className="tr-stat-label">Retention Window</Text>
              <div className="tr-stat-value">
                {RETENTION_DAYS}
                <span className="tr-stat-unit">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="tr-body">
        {/* Filter / Search Bar */}
        <div className="tr-control-bar">
          <div className="tr-filter-cluster">
            <div className="tr-filter-label">
              <FilterOutlined />
              <span>Filters</span>
              {isFiltered && (
                <Badge
                  count={(projectFilter ? 1 : 0) + (searchQuery ? 1 : 0)}
                  color="#3b82f6"
                  size="small"
                />
              )}
            </div>

            <div className={`tr-filter-field ${projectFilter ? "active" : ""}`}>
              <ProjectOutlined className="tr-filter-icon" />
              <Select
                placeholder="All projects"
                variant="borderless"
                className="tr-filter-select"
                allowClear
                value={projectFilter}
                onChange={setProjectFilter}
                popupMatchSelectWidth={280}
              >
                {projects?.map((project: any) => (
                  <Option key={project.value} value={project.value} label={project.label}>
                    <div className="tr-project-option">
                      <Text className="tr-project-option-label">{project.label}</Text>
                      <Tag className="tr-project-code-tag">{project.code}</Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            <div className={`tr-filter-field tr-filter-search ${searchQuery ? "active" : ""}`}>
              <SearchOutlined className="tr-filter-icon" />
              <Input
                placeholder="Search deleted tickets…"
                variant="borderless"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
            </div>

            {isFiltered && (
              <Button
                size="small"
                type="text"
                className="tr-filter-reset"
                icon={<CloseOutlined />}
                onClick={() => {
                  setSearchQuery("");
                  setProjectFilter(undefined);
                  refetch();
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="tr-result-count">
            <Text className="tr-result-count-text">
              <strong>{trashData?.pagination.total || 0}</strong>{" "}
              {(trashData?.pagination.total || 0) === 1 ? "item" : "items"}
            </Text>
          </div>
        </div>

        {/* Bulk Action Belt */}
        {selectedRowKeys.length > 0 && (
          <div className="tr-bulk-belt">
            <div className="tr-bulk-left">
              <span className="tr-bulk-count-pill">{selectedRowKeys.length}</span>
              <Text className="tr-bulk-label">
                {selectedRowKeys.length === 1 ? "ticket" : "tickets"} selected
              </Text>
            </div>
            <div className="tr-bulk-actions">
              <Button
                size="small"
                type="primary"
                icon={<UndoOutlined />}
                onClick={handleBulkRestore}
                loading={bulkRestore.isPending}
                className="tr-bulk-btn restore"
              >
                Restore
              </Button>
              <Popconfirm
                title="Purge Selected?"
                description="This action is irreversible."
                onConfirm={handleBulkDelete}
                okText="Purge"
                okButtonProps={{ danger: true }}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={bulkDelete.isPending}
                  className="tr-bulk-btn purge"
                >
                  Purge
                </Button>
              </Popconfirm>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setSelectedRowKeys([])}
                className="tr-bulk-btn cancel"
              />
            </div>
          </div>
        )}

        <Card
          styles={{ body: { padding: 0 } }}
          className="tr-table-card"
        >
          <Table
            rowSelection={(isLoading || isRefreshing) ? undefined : { selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
            columns={columns.map(col => ({
              ...col,
              render: (text: any, record: any, index: number) => {
                if (isLoading || isRefreshing) {
                  return <Skeleton.Input active size="small" block style={{ height: 24 }} />;
                }
                return col.render ? (col.render as any)(text, record, index) : text;
              }
            }))}
            dataSource={(isLoading || isRefreshing) ? Array(5).fill({}) : (trashData?.tickets || [])}
            rowKey={(record: any) => record.id || Math.random()}
            loading={false}
            className="tr-table"
            locale={{
              emptyText: isLoading ? null : (
                <div className="tr-empty">
                  <div className="tr-empty-icon">
                    <InboxOutlined />
                  </div>
                  <Text className="tr-empty-title">
                    {isFiltered ? "No matching tickets" : "Trash is empty"}
                  </Text>
                  <Text className="tr-empty-sub">
                    {isFiltered
                      ? "Try adjusting your filters or search query."
                      : "Deleted tickets appear here for 7 days before permanent purge."}
                  </Text>
                  {isFiltered && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchQuery("");
                        setProjectFilter(undefined);
                      }}
                      className="tr-empty-action"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ),
            }}
            pagination={
              hasItems
                ? {
                  current: page,
                  pageSize: limit,
                  total: trashData?.pagination.total || 0,
                  onChange: (p) => setPage(p),
                  showTotal: (total, range) => (
                    <Text className="tr-pagination-total">
                      Showing {range[0]}–{range[1]} of {total}
                    </Text>
                  ),
                  style: { padding: "16px 24px", margin: 0 },
                }
                : false
            }
            scroll={{ x: 1100 }}
          />
        </Card>
      </div>

      <style jsx global>{`
        /* ── Page ────────────────────────────────────────────────── */
        .tr-page {
          background: var(--bg-pure-white);
          min-height: 100vh;
          margin: 0 -8px;
        }

        /* ── Hero ────────────────────────────────────────────────── */
        .tr-hero {
          position: relative;
          margin-bottom: 20px;
          padding: 14px 32px 0;
          background:
            linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0) 60%),
            var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          overflow: hidden;
        }
        [data-theme='dark'] .tr-hero {
          background:
            linear-gradient(180deg, rgba(239, 68, 68, 0.07) 0%, rgba(239, 68, 68, 0) 60%),
            var(--bg-pure-white);
          border-bottom-color: #1f2937;
        }
        .tr-hero-glow {
          position: absolute;
          top: -160px;
          right: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.10) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        [data-theme='dark'] .tr-hero-glow {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.16) 0%, transparent 70%);
        }
        .tr-hero-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 7px;
        }
        .tr-hero-left {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .tr-hero-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04));
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-size: 16px;
          box-shadow: 0 6px 16px -8px rgba(239, 68, 68, 0.3);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tr-hero-badge {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.20), rgba(239, 68, 68, 0.06));
          border-color: rgba(239, 68, 68, 0.30);
          box-shadow: 0 8px 24px -8px rgba(239, 68, 68, 0.5);
        }
        .tr-hero-text {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tr-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--text-slate-500);
          padding: 3px 8px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 4px;
        }
        [data-theme='dark'] .tr-hero-eyebrow {
          background: #1f2937;
          border-color: #374151;
        }
        .tr-hero-eyebrow-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
        }
        .tr-hero-title {
          margin: 0 !important;
          font-weight: 700 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.02em !important;
          font-size: 16px !important;
          line-height: 1.2 !important;
        }
        .tr-hero-sub {
          font-size: 12px;
          color: var(--text-slate-500);
          line-height: 1.4;
          padding-left: 12px;
          border-left: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tr-hero-sub {
          border-left-color: #1f2937;
        }
        .tr-hero-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tr-hero-ghost {
          height: 30px !important;
          width: 30px !important;
          border-radius: 6px !important;
          color: var(--text-slate-500) !important;
          border: 1px solid var(--border-slate-200) !important;
        }
        .tr-hero-ghost:hover {
          color: var(--text-slate-900) !important;
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .tr-hero-ghost {
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .tr-hero-ghost:hover {
          background: #1f2937 !important;
        }
        .tr-hero-danger {
          height: 30px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          padding: 0 12px !important;
          box-shadow: 0 1px 2px rgba(239, 68, 68, 0.05);
        }

        /* ── Stat Strip ──────────────────────────────────────────── */
        .tr-stat-strip {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 0;
          padding: 10px 32px;
          margin: 0 -32px;
          border-top: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tr-stat-strip {
          border-top-color: #1f2937;
        }
        .tr-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          min-width: 0;
        }
        .tr-stat:first-child {
          padding-left: 0;
        }
        .tr-stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .tr-stat-icon.slate {
          background: var(--bg-slate-50);
          color: var(--text-slate-500);
          border: 1px solid var(--border-slate-200);
        }
        .tr-stat-icon.green {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .tr-stat-icon.red {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .tr-stat-icon.blue {
          background: rgba(59, 130, 246, 0.08);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .tr-stat-icon.pulse {
          animation: trPulse 2s ease-in-out infinite;
        }
        [data-theme='dark'] .tr-stat-icon.slate {
          background: #1f2937;
          border-color: #374151;
          color: #94a3b8;
        }
        [data-theme='dark'] .tr-stat-icon.green {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.25);
        }
        [data-theme='dark'] .tr-stat-icon.red {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.25);
        }
        [data-theme='dark'] .tr-stat-icon.blue {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.25);
        }
        @keyframes trPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        .tr-stat-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .tr-stat-label {
          font-size: 10px !important;
          font-weight: 600 !important;
          color: var(--text-slate-500) !important;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .tr-stat-value {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.02em;
          line-height: 1.1;
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-variant-numeric: tabular-nums;
        }
        .tr-stat-value.danger {
          color: #ef4444;
        }
        .tr-stat-unit {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-slate-400);
          text-transform: none;
          letter-spacing: 0;
        }
        .tr-stat-divider {
          width: 1px;
          height: 28px;
          background: var(--border-slate-200);
        }
        [data-theme='dark'] .tr-stat-divider {
          background: #1f2937;
        }

        /* ── Body ────────────────────────────────────────────────── */
        .tr-body {
          padding: 0 32px 32px;
        }

        /* ── Control bar ─────────────────────────────────────────── */
        .tr-control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .tr-filter-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 10px;
        }
        [data-theme='dark'] .tr-filter-cluster {
          background: #0f1620;
          border-color: #1f2937;
        }
        .tr-filter-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px 0 8px;
          height: 32px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-right: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tr-filter-label {
          border-right-color: #1f2937;
        }
        .tr-filter-field {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 32px;
          padding: 0 10px;
          background: transparent !important;
          border: 1px solid var(--border-slate-100);
          border-radius: 7px;
          transition: all 0.15s ease;
        }
        .tr-filter-field:hover {
          border-color: var(--border-slate-200);
        }
        .tr-filter-field.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }
        [data-theme='dark'] .tr-filter-field {
          background: transparent !important;
          border-color: #1f2937;
        }
        [data-theme='dark'] .tr-filter-field:hover {
          border-color: #374151;
        }
        [data-theme='dark'] .tr-filter-field.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .tr-filter-icon {
          font-size: 12px;
          color: var(--text-slate-400);
        }
        .tr-filter-field.active .tr-filter-icon {
          color: #3b82f6;
        }
        .tr-filter-search {
          width: 280px;
        }
        .tr-filter-search .ant-input,
        .tr-filter-search .ant-input-affix-wrapper,
        .tr-filter-search .ant-input-affix-wrapper-focused,
        .tr-filter-search .ant-input-affix-wrapper:hover {
          font-size: 12px;
          font-weight: 500;
          padding: 0;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
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
          font-weight: 500 !important;
          line-height: 30px !important;
        }
        .tr-project-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .tr-project-option-label {
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .tr-project-code-tag {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
          background: var(--bg-slate-100);
          border: none;
          color: var(--text-slate-600);
        }
        [data-theme='dark'] .tr-project-code-tag {
          background: #374151;
          color: #94a3b8;
        }
        .tr-filter-reset {
          height: 32px !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          border-radius: 6px !important;
        }
        .tr-filter-reset:hover {
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.06) !important;
        }
        .tr-result-count-text {
          font-size: 12px !important;
          color: var(--text-slate-500) !important;
          font-weight: 500;
        }
        .tr-result-count-text strong {
          color: var(--text-slate-900);
          font-weight: 700;
        }

        /* ── Bulk action belt ────────────────────────────────────── */
        .tr-bulk-belt {
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(59, 130, 246, 0.02));
          padding: 8px 14px 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          animation: trSlideDown 0.2s ease-out;
        }
        [data-theme='dark'] .tr-bulk-belt {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
          border-color: rgba(59, 130, 246, 0.3);
        }
        @keyframes trSlideDown {
          from { transform: translateY(-4px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .tr-bulk-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tr-bulk-count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 26px;
          height: 26px;
          padding: 0 8px;
          background: #3b82f6;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          border-radius: 7px;
          font-variant-numeric: tabular-nums;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }
        .tr-bulk-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #1d4ed8 !important;
        }
        [data-theme='dark'] .tr-bulk-label {
          color: #93c5fd !important;
        }
        .tr-bulk-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .tr-bulk-btn.restore {
          height: 30px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          border-radius: 7px !important;
          padding: 0 12px !important;
        }
        .tr-bulk-btn.purge {
          height: 30px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          border-radius: 7px !important;
          padding: 0 12px !important;
        }
        .tr-bulk-btn.cancel {
          height: 30px !important;
          width: 30px !important;
          border-radius: 7px !important;
          color: var(--text-slate-500) !important;
        }
        .tr-bulk-btn.cancel:hover {
          background: rgba(59, 130, 246, 0.1) !important;
        }

        /* ── Table Card ──────────────────────────────────────────── */
        .tr-table-card {
          border-radius: 12px !important;
          overflow: hidden !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02) !important;
        }
        [data-theme='dark'] .tr-table-card {
          border-color: #1f2937 !important;
          background: #161b22 !important;
        }

        /* ── Premium table ───────────────────────────────────────── */
        .tr-table .ant-table {
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .tr-table .ant-table {
          background: #161b22;
        }
        .tr-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50);
          font-weight: 600;
          color: var(--text-slate-500);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tr-table .ant-table-thead > tr > th {
          background: #0f1620;
          border-bottom-color: #1f2937;
          color: #94a3b8;
        }
        .tr-table .ant-table-thead > tr > th::before {
          display: none;
        }
        .tr-table .ant-table-tbody > tr > td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-slate-100);
          transition: background-color 0.15s ease;
        }
        [data-theme='dark'] .tr-table .ant-table-tbody > tr > td {
          background: #161b22;
          border-bottom-color: #1f2937;
        }
        .tr-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .tr-table .ant-table-tbody > tr:hover > td {
          background: #1a2230 !important;
        }
        .tr-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgba(59, 130, 246, 0.04) !important;
        }
        [data-theme='dark'] .tr-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgba(59, 130, 246, 0.08) !important;
        }

        /* ── Ticket cell ─────────────────────────────────────────── */
        .tr-ticket-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          padding-left: 12px;
        }
        .tr-row-rail {
          position: absolute;
          left: 0;
          top: -14px;
          bottom: -14px;
          width: 3px;
          background: transparent;
          border-radius: 0 2px 2px 0;
        }
        .tr-row-rail.urgent {
          background: linear-gradient(180deg, #ef4444, #f87171);
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
        }
        .tr-ticket-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .tr-ticket-id {
          display: inline-block;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--premium-blue);
          background: rgba(59, 130, 246, 0.06);
          padding: 2px 7px;
          border-radius: 5px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          width: fit-content;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .tr-ticket-id {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.25);
        }
        .tr-ticket-title {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.01em !important;
          line-height: 1.4 !important;
        }

        /* ── Project chip ────────────────────────────────────────── */
        .tr-project-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-slate-50);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-200);
          width: fit-content;
        }
        [data-theme='dark'] .tr-project-chip {
          background: #1f2937;
          border-color: #374151;
        }
        .tr-project-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-slate-400);
        }
        .tr-project-text {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: var(--text-slate-700) !important;
          letter-spacing: 0.01em;
        }
        [data-theme='dark'] .tr-project-text {
          color: #cbd5e1 !important;
        }

        /* ── Status tags ─────────────────────────────────────────── */
        .tr-status-tag {
          font-size: 10px !important;
          font-weight: 700 !important;
          margin: 0 !important;
          border-radius: 5px !important;
          padding: 3px 8px !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.4;
        }
        .tr-status-tag.green {
          background: rgba(16, 185, 129, 0.08) !important;
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
        }
        .tr-status-tag.slate {
          background: var(--bg-slate-100) !important;
          color: var(--text-slate-600) !important;
          border: 1px solid var(--border-slate-200) !important;
        }
        [data-theme='dark'] .tr-status-tag.green {
          background: rgba(16, 185, 129, 0.15) !important;
          color: #34d399 !important;
          border-color: rgba(16, 185, 129, 0.25) !important;
        }
        [data-theme='dark'] .tr-status-tag.slate {
          background: #1f2937 !important;
          color: #94a3b8 !important;
          border-color: #374151 !important;
        }

        /* ── Actor cell ──────────────────────────────────────────── */
        .tr-actor-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tr-actor-avatar {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          color: #fff !important;
          flex-shrink: 0;
        }
        .tr-actor-meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .tr-actor-name {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: var(--text-slate-700) !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme='dark'] .tr-actor-name {
          color: #cbd5e1 !important;
        }
        .tr-actor-time {
          font-size: 11px !important;
          color: var(--text-slate-400) !important;
          font-weight: 500;
        }

        /* ── Purge cell ──────────────────────────────────────────── */
        .tr-purge-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tr-purge-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tr-purge-icon {
          font-size: 12px;
        }
        .tr-purge-icon.urgent {
          color: #ef4444;
        }
        .tr-purge-icon.safe {
          color: #10b981;
        }
        .tr-purge-text {
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em;
        }
        .tr-purge-text.urgent {
          color: #ef4444 !important;
        }
        .tr-purge-text.safe {
          color: #10b981 !important;
        }
        .tr-purge-progress .ant-progress-inner {
          background: var(--bg-slate-100) !important;
          height: 4px !important;
          border-radius: 4px !important;
        }
        [data-theme='dark'] .tr-purge-progress .ant-progress-inner {
          background: #1f2937 !important;
        }
        .tr-purge-progress .ant-progress-bg {
          height: 4px !important;
          border-radius: 4px !important;
        }

        /* ── Action cell ─────────────────────────────────────────── */
        .tr-action-cell {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
          align-items: center;
        }
        .tr-icon-btn {
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          transition: all 0.15s ease;
        }
        .tr-icon-btn.restore {
          color: #10b981 !important;
        }
        .tr-icon-btn.restore:hover {
          background: rgba(16, 185, 129, 0.1) !important;
          color: #059669 !important;
        }
        .tr-icon-btn.purge {
          color: var(--text-slate-400) !important;
        }
        .tr-icon-btn.purge:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
        }

        /* ── Empty state ─────────────────────────────────────────── */
        .tr-empty {
          padding: 64px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }
        .tr-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: var(--bg-slate-50);
          color: var(--text-slate-400);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 8px;
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tr-empty-icon {
          background: #1f2937;
          border-color: #374151;
        }
        .tr-empty-title {
          font-size: 15px !important;
          font-weight: 700 !important;
          color: var(--text-slate-700) !important;
        }
        [data-theme='dark'] .tr-empty-title {
          color: #cbd5e1 !important;
        }
        .tr-empty-sub {
          font-size: 13px !important;
          color: var(--text-slate-500) !important;
          max-width: 360px;
          line-height: 1.5;
        }
        .tr-empty-action {
          margin-top: 12px;
          height: 32px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-radius: 7px !important;
        }

        /* ── Pagination ──────────────────────────────────────────── */
        .tr-pagination-total {
          font-size: 12px !important;
          color: var(--text-slate-500) !important;
          font-weight: 500;
        }
        .tr-table .ant-pagination {
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .tr-table .ant-pagination {
          border-top-color: #1f2937;
        }

        /* ── Responsive ──────────────────────────────────────────── */
        @media (max-width: 1100px) {
          .tr-stat-strip {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .tr-stat-divider {
            display: none;
          }
          .tr-stat {
            padding: 0;
          }
        }
        @media (max-width: 768px) {
          .tr-hero {
            padding: 20px 24px 0;
          }
          .tr-hero-inner {
            flex-direction: column;
            align-items: stretch;
          }
          .tr-stat-strip {
            grid-template-columns: 1fr;
          }
          .tr-control-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .tr-filter-cluster {
            flex-wrap: wrap;
          }
          .tr-filter-search {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
