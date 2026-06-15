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
  BarsOutlined,
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
          <Avatar src={manager?.avatarUrl} size="small" style={{ background: "#3b82f6", color: "#fff" }}>
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
    <div className="pm2-page">
      <div className="pm2-shell-wrap">
        <div className="pm2-shell">
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="pm2-sidebar">
            <div className="pm2-sidebar-top">
              <div className="pm2-sidebar-brand">
                <div className="pm2-hero-icon-box" style={{ background: 'rgba(255, 77, 79, 0.08)', borderColor: 'rgba(255, 77, 79, 0.18)' }}>
                  <InboxOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
                </div>
                <div className="min-w-0">
                  <h1 className="pm2-sidebar-title">Trash Repository</h1>
                  <p className="pm2-sidebar-subtitle">Recover or purge projects</p>
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
                  style={{ borderRadius: 6, fontWeight: 600, height: 36 }}
                  disabled={filteredProjects.length === 0 || isLoading}
                >
                  Empty Trash
                </Button>
              </Popconfirm>
            </div>

            <div className="pm2-sidebar-scroll">
              <div className="pm2-side-group" style={{ marginTop: 22 }}>
                <div className="pm2-side-label">Filters</div>
                <div className="pm2-side-filters flex flex-col gap-2">
                  <Select
                    placeholder="Project"
                    value={filters.projectId}
                    onChange={(val) => setFilters(prev => ({ ...prev, projectId: val }))}
                    style={{ width: '100%', height: 35, borderRadius: "6px !important" }}
                    allowClear
                    showSearch
                    className="pm2-side-filter-select"
                  >
                    {uniqueProjects.map(([id, name]) => (
                      <Option key={id} value={id}>{name as string}</Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Project Manager"
                    value={filters.projectManagerId}
                    onChange={(val) => setFilters(prev => ({ ...prev, projectManagerId: val }))}
                    style={{ width: '100%', height: 35, borderRadius: "6px !important" }}
                    allowClear
                    showSearch
                    className="pm2-side-filter-select"
                  >
                    {uniqueManagers.map(([id, name]) => (
                      <Option key={id} value={id}>{name as string}</Option>
                    ))}
                  </Select>

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
                      className="pm2-side-clear"
                      onClick={() => setFilters({})}
                    >
                      <CloseOutlined style={{ fontSize: 10 }} />
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
              <div className="pm2-main-search" style={{ flex: 1, maxWidth: 320 }}>
                <Input
                  placeholder="Search project name..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                  className="premium-search-input rounded-lg transition-all"
                  style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', height: 38 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                />
              </div>
              <div className="pm2-main-stats">
                <span className="inline-flex items-center gap-1.5">
                  <span className="pm2-pulse-dot" style={{ background: '#ff4d4f', boxShadow: 'none', animation: 'none' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{filteredProjects.length}</span> {filteredProjects.length === 1 ? "project in trash" : "projects in trash"}
                </span>
              </div>
              <div className="pm2-main-controls">
                <div className="flex items-center gap-1 p-[3px] rounded-xl" style={{ border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', height: 38 }}>
                  <Tooltip title="List">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center justify-center rounded-[8px] transition-colors`}
                      style={{
                        width: 30, height: 30,
                        background: viewMode === 'table' ? 'var(--bg-blue-50)' : 'transparent',
                        color: viewMode === 'table' ? 'var(--bg-blue-500)' : 'var(--text-blue-400)'
                      }}
                    >
                      <BarsOutlined style={{ fontSize: 16, color: viewMode === 'table' ? 'var(--text-blue-700)' : 'var(--text-blue-500)' }} />
                    </button>
                  </Tooltip>
                  <Tooltip title="Cards">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`flex items-center justify-center rounded-[8px] transition-colors`}
                      style={{
                        width: 30, height: 30,
                        background: viewMode === 'card' ? 'var(--bg-blue-50)' : 'transparent',
                        color: viewMode === 'card' ? 'var(--bg-blue-500)' : 'var(--text-blue-400)'
                      }}
                    >
                      <AppstoreOutlined style={{ fontSize: 16, color: viewMode === 'card' ? 'var(--text-blue-700)' : 'var(--text-blue-500)' }} />
                    </button>
                  </Tooltip>
                </div>
                <Tooltip title="Refresh view">
                  <Button
                    icon={<ReloadOutlined spin={isRefreshing} />}
                    onClick={async () => {
                      setIsRefreshing(true);
                      await queryClient.invalidateQueries({ queryKey: ["projects-trash"] });
                      setIsRefreshing(false);
                      message.success("Trash view refreshed");
                    }}
                    className="flex items-center justify-center rounded-xl border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200"
                    style={{ height: 38, width: 38 }}
                    loading={isLoading || isRefreshing}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Premium KPI Hero Row */}
            <div className="pm2-stat-cards-grid">
              <div className="pm2-stat-card">
                <div className="pm2-stat-top">
                  <div className="pm2-stat-left">
                    <span className="pm2-stat-icon" style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                      <FolderKanban />
                    </span>
                    <span className="pm2-stat-label">Total Projects</span>
                  </div>
                  <span className="pm2-stat-pulse" />
                </div>
                <div className="pm2-stat-bottom">
                  <div className="pm2-stat-value-wrap">
                    <span className="pm2-stat-value">{stats.total}</span>
                    <span className="pm2-stat-period">projects</span>
                  </div>
                  <div className="shrink-0 mb-[2px] ml-auto">
                    <Sparkline data={[0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0].map(r => r * (stats.total || 1))} color="#3b82f6" />
                  </div>
                </div>
              </div>
              <div className="pm2-stat-card">
                <div className="pm2-stat-top">
                  <div className="pm2-stat-left">
                    <span className="pm2-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <Trash2 />
                    </span>
                    <span className="pm2-stat-label">Recently Deleted</span>
                  </div>
                </div>
                <div className="pm2-stat-bottom">
                  <div className="pm2-stat-value-wrap">
                    <span className="pm2-stat-value">{stats.recent}</span>
                    <span className="pm2-stat-period">last 7 days</span>
                  </div>
                  <div className="shrink-0 mb-[2px] ml-auto">
                    <Sparkline data={[0.0, 0.1, 0.3, 0.5, 0.7, 0.8, 1.0].map(r => r * (stats.recent || 1))} color="#ef4444" />
                  </div>
                </div>
              </div>
              <div className="pm2-stat-card">
                <div className="pm2-stat-top">
                  <div className="pm2-stat-left">
                    <span className="pm2-stat-icon" style={{ background: 'rgba(151, 151, 151, 0.10)', color: '#979797' }}>
                      <Clock />
                    </span>
                    <span className="pm2-stat-label">Older than 7 days</span>
                  </div>
                </div>
                <div className="pm2-stat-bottom">
                  <div className="pm2-stat-value-wrap">
                    <span className="pm2-stat-value">{stats.older}</span>
                    <span className="pm2-stat-period">projects</span>
                  </div>
                  <div className="shrink-0 mb-[2px] ml-auto">
                    <Sparkline data={[0.0, 0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map(r => r * (stats.older || 1))} color="#979797" />
                  </div>
                </div>
              </div>
              <div className="pm2-stat-card">
                <div className="pm2-stat-top">
                  <div className="pm2-stat-left">
                    <span className="pm2-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6' }}>
                      <AlertTriangle />
                    </span>
                    <span className="pm2-stat-label">Pending Purge</span>
                  </div>
                </div>
                <div className="pm2-stat-bottom">
                  <div className="pm2-stat-value-wrap">
                    <span className="pm2-stat-value">{stats.purgeReady}</span>
                    <span className="pm2-stat-period">{">"} 30 days</span>
                  </div>
                  <div className="shrink-0 mb-[2px] ml-auto">
                    <Sparkline data={[0.0, 0.2, 0.5, 0.8, 0.9, 0.95, 1.0].map(r => r * (stats.purgeReady || 1))} color="#3b82f6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pm2-main-content" style={{ marginTop: 24 }}>
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
                <Card
                  styles={{ body: { padding: 0 } }}
                  style={{
                    borderRadius: 6,
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-pure-white)",
                    transition: "all 0.3s ease",
                    boxShadow: "var(--premium-shadow)"
                  }}
                >
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
                </Card>
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
                              <div className="pm2-list-avatar" style={{ background: '#3b82f6', color: '#fff' }}>
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

                          <div style={{ padding: '8px 16px', background: 'var(--bg-slate-50)', alignItems: 'center', borderTop: '1px solid var(--border-slate-200)' }}>
                            <Typography.Paragraph
                              style={{ fontSize: 12.5, color: "var(--text-slate-500)", margin: 0, lineHeight: 1.5, minHeight: 36 }}
                              ellipsis={{ rows: 2 }}
                            >
                              {project.description || "No description provided."}
                            </Typography.Paragraph>
                          </div>

                          <div className="pm2-list-foot" style={{ padding: '8px 16px', background: 'var(--bg-slate-50)', borderTop: '1px solid var(--border-slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="pm2-list-foot-inline" style={{ display: 'flex', gap: 20 }}>
                              <span className="pm2-list-foot-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="pm2-list-foot-label" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-slate-400)', textTransform: 'uppercase' }}>MANAGER</span>
                                <Avatar size={18} src={pm?.avatarUrl} style={{ fontSize: 9, background: '#e2e8f0', color: '#64748b' }}>
                                  {pmFullName.charAt(0)}
                                </Avatar>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)' }}>
                                  {pmFullName.split(' ')[0]}
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Popconfirm
                                title="Restore project?"
                                description="This will restore the project back to active status."
                                onConfirm={() => restoreProject.mutate(project.id)}
                                okText="Yes, restore"
                                cancelText="Cancel"
                                okButtonProps={{ loading: restoreProject.isPending }}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<UndoOutlined />}
                                  loading={restoreProject.isPending}
                                  className="action-btn restore"
                                  style={{ color: '#10b981' }}
                                >
                                  Restore
                                </Button>
                              </Popconfirm>
                              <Popconfirm
                                title="Permanently delete project?"
                                description="This action cannot be undone."
                                onConfirm={() => permanentDelete.mutate(project.id)}
                                okText="Yes, purge"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, loading: permanentDelete.isPending }}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  loading={permanentDelete.isPending}
                                  className="action-btn purge"
                                  style={{ color: '#ff4d4f' }}
                                >
                                  Purge
                                </Button>
                              </Popconfirm>
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
          

        .premium-range-picker .ant-picker-input > input {
          font-size: 13px !important;
          padding: 8px !important;
          
        }
      `}</style>
    </div>
  );
}



// comments added for testing
