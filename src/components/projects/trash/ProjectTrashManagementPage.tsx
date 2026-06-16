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
  Select,
  DatePicker,
  Pagination,
} from "antd";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { FolderKanban, Trash2, AlertTriangle, Clock } from "lucide-react";
import {
  useProjectTrash,
  useRestoreProject,
  usePermanentDeleteProject,
  useEmptyTrash,
  useBulkRestoreProjects,
  useBulkPermanentDeleteProjects,
} from "@/hooks/useProjectTrash";
import { useQueryClient } from "@tanstack/react-query";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { useTheme } from "@/context/ThemeContext";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const { Option } = Select;

const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 22 }) => {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;
  const width = 72;
  const bottomPadding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    let y = height - bottomPadding;
    if (max > min) {
      y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
    }
    return { x, y };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x},${points[i].y}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isFlat = data.every(d => d === data[0]);
  const flatY = 2;
  const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
  const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
      <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function ProjectTrashManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState<{
    projectId?: string;
    projectManagerId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data: trashProjects, isLoading, refetch } = useProjectTrash();
  const restoreProject = useRestoreProject();
  const permanentDelete = usePermanentDeleteProject();
  const emptyTrash = useEmptyTrash();
  const bulkRestore = useBulkRestoreProjects();
  const bulkDelete = useBulkPermanentDeleteProjects();

  const uniqueProjects = Array.from(new Map(trashProjects?.map(p => [p.id, p.name])).entries());
  const uniqueManagers = Array.from(new Map(trashProjects?.filter(p => p.projectManager).map(p => [p.projectManager.id, p.projectManager.name])).entries());

  const filteredProjects = trashProjects?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !filters.projectId || p.id === filters.projectId;
    const matchesManager = !filters.projectManagerId || p.projectManager?.id === filters.projectManagerId;

    let matchesDate = true;
    if (filters.startDate && filters.endDate && p.updatedAt) {
      const deletedAt = dayjs(p.updatedAt);
      const start = dayjs(filters.startDate).startOf('day');
      const end = dayjs(filters.endDate).endOf('day');
      matchesDate = deletedAt.isAfter(start) && deletedAt.isBefore(end);
    }

    return matchesSearch && matchesProject && matchesManager && matchesDate;
  }) || [];

  const stats = {
    total: filteredProjects.length,
    recent: filteredProjects.filter(p => dayjs().diff(dayjs(p.updatedAt), 'day') <= 7).length,
    older: filteredProjects.filter(p => dayjs().diff(dayjs(p.updatedAt), 'day') > 7 && dayjs().diff(dayjs(p.updatedAt), 'day') <= 30).length,
    purgeReady: filteredProjects.filter(p => dayjs().diff(dayjs(p.updatedAt), 'day') > 30).length,
  };

  const columns = [
    {
      title: "Project",
      key: "project",
      width: 250,
      render: (record: any) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-slate-900)" }}>{record.name}</Text>
        </div>
      ),
    },
    {
      title: 'Project Code',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text style={{ fontSize: "12px", color: "var(--text-slate-600)" }}>{code}</Text>
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
          <Avatar src={manager?.avatarUrl} size="small" style={{ background: "#3b82f6", color: "#fff" }}>
            {manager?.name?.[0]}
          </Avatar>
          <Text style={{ fontSize: "12px", fontWeight: 500 }}>{manager?.name}</Text>
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
          <Text style={{ fontSize: "12px", color: "var(--text-slate-500)" }}>{dayjs(date).fromNow()}</Text>
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
    <div className="pm2-page">
      <div className="pm2-shell-wrap">
        <div className="pm2-shell">
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="pm2-sidebar">
            <div className="pm2-sidebar-top">
              <div className="pm2-sidebar-brand">
                <div className="pm2-hero-icon-box">
                  <InboxOutlined style={{ fontSize: 24, color: 'var(--text-slate-900)' }} />
                </div>
                <div className="min-w-0">
                  <h1 className="pm2-sidebar-title">Trash Repository</h1>
                  <p className="pm2-sidebar-subtitle">Recover or purge</p>
                </div>
              </div>

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
                  block
                  style={{
                    borderRadius: 6,
                    fontWeight: 600,
                    height: 36,
                    backgroundColor: filteredProjects.length === 0 || isLoading
                      ? (isDark ? '#1f1f1f' : '#f5f5f5')
                      : (isDark ? 'transparent' : '#fff2f0'),
                    color: filteredProjects.length === 0 || isLoading
                      ? '#8c8c8c'
                      : '#ff4d4f',
                    borderColor: filteredProjects.length === 0 || isLoading
                      ? '#d9d9d9'
                      : (isDark ? '#ff4d4f' : 'transparent'),
                  }}
                  disabled={filteredProjects.length === 0 || isLoading}
                >
                  Empty Trash
                </Button>
              </Popconfirm>
            </div>

            <div className="pm2-sidebar-scroll">
              <div className="pm2-side-group">
                <div className="pm2-side-label">Filters</div>
                <div className="pm2-side-filters flex flex-col gap-2">
                  <SearchableDropdown
                    className="pm2-side-filter-select"
                    placeholder="Project"
                    searchPlaceholder="Search projects"
                    itemNoun="projects"
                    value={filters.projectId || undefined}
                    onChange={(val) => setFilters(prev => ({ ...prev, projectId: val ?? undefined }))}
                    options={uniqueProjects.map(([id, name]) => ({ value: id as string, label: name as string }))}
                    width="100%"
                  />

                  <SearchableDropdown
                    className="pm2-side-filter-select"
                    placeholder="Project Manager"
                    searchPlaceholder="Search managers"
                    itemNoun="managers"
                    value={filters.projectManagerId || undefined}
                    onChange={(val) => setFilters(prev => ({ ...prev, projectManagerId: val ?? undefined }))}
                    options={uniqueManagers.map(([id, name]) => ({ value: id as string, label: name as string }))}
                    width="100%"
                  />

                  <DatePicker.RangePicker
                    className="premium-range-picker"
                    placeholder={["Start", "End"]}
                    onChange={(dates) => {
                      if (dates && dates.length === 2) {
                        setFilters(prev => ({ ...prev, startDate: dates[0]?.format("YYYY-MM-DD"), endDate: dates[1]?.format("YYYY-MM-DD") }));
                      } else {
                        setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
                      }
                    }}
                    style={{ width: '100%', background: 'transparent', height: 35 }}
                    format="MMM D, YYYY"
                  />

                  {(filters.projectId || filters.projectManagerId || filters.startDate) && (
                    <button
                      type="button"
                      className="pm2-sidebar-clear"
                      onClick={() => setFilters({})}
                    >
                      <CloseCircleOutlined style={{ fontSize: 12 }} />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main ──────────────────────────────────────────────── */}
          <main className="pm2-main">
            <div className="pm2-toolbar">
              <div className="pp-search-wrap" style={{ flex: 1, maxWidth: 320 }}>
                <SearchOutlined className="pp-search-icon" />
                <input
                  className="pp-search"
                  placeholder="Search project name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* {!searchQuery && <span className="pp-kbd">⌘K</span>} */}
              </div>
              <div className="pm2-main-stats">
                <span className="inline-flex items-center gap-1.5">
                  <span className="pm2-pulse-dot" style={{ background: '#ff4d4f', boxShadow: 'none', animation: 'none' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{filteredProjects.length}</span> {filteredProjects.length === 1 ? "project in trash" : "projects in trash"}
                </span>
              </div>
              <div className="pm2-main-controls">
                <div className="pp-segmented">
                  <button type="button" className={viewMode === 'card' ? 'is-active' : ''} onClick={() => setViewMode('card')} aria-label="Grid view"><AppstoreOutlined /></button>
                  <button type="button" className={viewMode === 'table' ? 'is-active' : ''} onClick={() => setViewMode('table')} aria-label="List view"><UnorderedListOutlined /></button>
                </div>
                <Tooltip title="Refresh view">
                  <button
                    type="button"
                    className="pp-ghost-btn"
                    onClick={async () => {
                      setIsRefreshing(true);
                      await queryClient.invalidateQueries({ queryKey: ["projects-trash"] });
                      setIsRefreshing(false);
                      message.success("Trash view refreshed");
                    }}
                    disabled={isLoading || isRefreshing}
                  >
                    <ReloadOutlined spin={isRefreshing} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Premium KPI Hero Row */}
            <div className="pp-stats">
              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                      <FolderKanban size={14} />
                    </span>
                    <span className="pp-stat-label">Total Projects</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{stats.total}</span>
                    <span className="pp-stat-period">projects</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0].map(r => r * (stats.total || 1))} color="#3b82f6" />
                  </div>
                </div>
              </div>
              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </span>
                    <span className="pp-stat-label">Recently Deleted</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{stats.recent}</span>
                    <span className="pp-stat-period">last 7 days</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.1, 0.3, 0.5, 0.7, 0.8, 1.0].map(r => r * (stats.recent || 1))} color="#ef4444" />
                  </div>
                </div>
              </div>
              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(151, 151, 151, 0.10)', color: '#979797' }}>
                      <Clock size={14} />
                    </span>
                    <span className="pp-stat-label">Older than 7 days</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{stats.older}</span>
                    <span className="pp-stat-period">projects</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map(r => r * (stats.older || 1))} color="#979797" />
                  </div>
                </div>
              </div>
              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6' }}>
                      <AlertTriangle size={14} />
                    </span>
                    <span className="pp-stat-label">Pending Purge</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{stats.purgeReady}</span>
                    <span className="pp-stat-period">{">"} 30 days</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.2, 0.5, 0.8, 0.9, 0.95, 1.0].map(r => r * (stats.purgeReady || 1))} color="#3b82f6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pm2-main-content">
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

              {viewMode === "table" ? (
                <div className="pm2-table-shell" style={{ background: "var(--bg-pure-white)", border: "1px solid var(--border-slate-200)", borderRadius: 0, overflow: "hidden" }}>
                  <Table
                    size="small"
                    className="premium-table"
                    rowSelection={(isLoading || isRefreshing) ? undefined : {
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys)
                    }}
                    dataSource={(isLoading || isRefreshing) ? Array(5).fill({}) : filteredProjects.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize)}
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
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={<Text type="secondary">No projects found in trash</Text>}
                        />
                      ),
                    }}
                  />
                </div>
              ) : (
                <div className="pm2-grid">
                  {(isLoading || isRefreshing)
                    ? [1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="pm2-list-card pm2-list-card-skel">
                        <Skeleton active paragraph={{ rows: 2 }} />
                      </div>
                    ))
                    : filteredProjects.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '40px 0' }}>
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={<Text type="secondary">No projects found in trash</Text>}
                        />
                      </div>
                    ) : filteredProjects.map((project: any) => {
                      const pm = project.projectManager;
                      const pmFullName = pm?.name ? pm.name : "Unassigned";

                      return (
                        <article
                          key={project.id}
                          className="pm2-list-card"
                          style={{ ["--row-accent" as any]: "#ff4d4f", borderRadius: 6 }}
                        >
                          <header className="pm2-list-head" style={{ padding: '8px 12px' }}>
                            <div
                              className="pm2-list-row"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
                            >
                              <div className="pm2-list-avatar" style={{ background: '#3b82f6', color: '#fff', top: '-3px' }}>
                                <span className="pm2-list-avatar-letter">{(project.code || project.name).slice(0, 2).toUpperCase()}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {project.name}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-slate-500)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <span>Deleted: {dayjs(project.updatedAt).fromNow()}</span>
                                </span>
                              </div>
                            </div>
                          </header>
                          <div className="pm2-list-foot">
                            <div className="pm2-list-foot-row">
                              <Typography.Paragraph
                                style={{ fontSize: 12.5, color: "var(--text-slate-500)", margin: 0, lineHeight: 1.5, minHeight: 36 }}
                                ellipsis={{ rows: 2 }}
                              >
                                {project.description || "No description provided."}
                              </Typography.Paragraph>
                            </div>

                            <div className="pm2-list-foot-row" >
                              <span className="pm2-list-foot-item" >
                                <span className="pm2-list-foot-key">Manager:</span>
                                <Avatar size={18} src={pm?.avatarUrl} style={{ fontSize: 9, background: '#e2e8f0', color: '#64748b' }}>
                                  {pmFullName.charAt(0)}
                                </Avatar>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)' }}>
                                  {pmFullName.split(' ')[0]}
                                </span>
                              </span>
                              <span className="pm2-list-foot-div"></span>
                              <span className="pm2-list-foot-item" style={{ gap: 8 }}>
                                <Popconfirm
                                  title="Restore project?"
                                  description="This will restore the project back to active status."
                                  onConfirm={() => restoreProject.mutate(project.id)}
                                  okText="Yes, restore"
                                  cancelText="Cancel"
                                  okButtonProps={{ loading: restoreProject.isPending }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="pc-view-btn"
                                    style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <UndoOutlined />
                                    Restore
                                  </button>
                                </Popconfirm>
                                <Popconfirm
                                  title="Permanently delete project?"
                                  description="This action cannot be undone."
                                  onConfirm={() => permanentDelete.mutate(project.id)}
                                  okText="Yes, Delete"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true, loading: permanentDelete.isPending }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="pc-view-btn"
                                    style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <DeleteOutlined />
                                    Purge
                                  </button>
                                </Popconfirm>
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  }
                </div>
              )}
            </div>

            {filteredProjects.length > 0 && (
              <div className="pm2-pagination" style={{ marginTop: 'auto' }}>
                <Typography.Text style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>
                  Showing <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>
                    {(pagination.current - 1) * pagination.pageSize + 1}–{Math.min(pagination.current * pagination.pageSize, filteredProjects.length)}
                  </span> of <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
                </Typography.Text>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={filteredProjects.length}
                  onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                  showSizeChanger
                  pageSizeOptions={[10, 15, 25, 50, 100]}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx global>{`
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-search-wrap {
          position: relative; flex: 1; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900); min-width: 0;
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
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

        /* ── Proposals Status Cards ────────────────────────────────────────── */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; margin-top: 10px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-delta {
          display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
          color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .pp-stat-spark { opacity: 0.95; }

        @media (max-width: 1024px) {
          .pp-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .pp-stats {
            grid-template-columns: 1fr;
          }
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .pm2-side-filter-select .ant-select-selection-item,
        .pm2-side-filter-select .ant-select-selection-placeholder {
          font-size: 13px !important;
          height: 22px !important;
          line-height: 22px !important;
          display: flex;
          align-items: center;
        }

        .pm2-side-filter-select .ant-select-selector {
          height: 36px !important;
          padding: 0px 10px !important;
          display: flex;
          align-items: center;
        }
          
        .premium-range-picker{
          border: 1px dashed var(--border-color) !important;    
          height: 36px !important;
          border-radius: 6px !important;
        }

        .premium-range-picker .ant-picker-input > input {
          font-size: 13px !important;
          padding: 8px !important;
          
        }
        .premium-range-picker:hover{
          border: 1px dashed var(--border-color) !important;    
        }

        .pm2-table-shell{
           background: var(--bg-pure-white); 
        border: 1px solid var(--border-slate-200);
        border-radius: 0; 
        overflow: hidden;
        margin-top: 0px !important; 
      }

       .premium-table .ant-table {
          background: transparent !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before {
          display: none;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #1e293b;
          border-bottom-color: #334155;
          color: #94a3b8;
        }
        .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important; 
          padding: 6.5px 10px !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          border-bottom-color: #1e293b;
        }
        .premium-table .ant-table-row:hover > td {
           background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td {
          background: rgba(255, 255, 255, 0.02);
        }
        .premium-table .ant-table-row-expand-icon-cell {
          padding: 0 4px !important;
        }
        .premium-table .ant-table-expanded-row > td {
          padding: 0 !important;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        [data-theme='dark'] .premium-table .ant-table-expanded-row > td {
          background: rgba(15, 23, 42, 0.5);
          border-bottom-color: #1e293b;
        }
      `}</style>
    </div>
  );
}



// comments added for testing
