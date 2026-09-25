"use client";

import NoData from "@/components/common/NoData";
import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Typography,
  Tooltip,
  Avatar,
  Tag,
  App,
  Skeleton,
  Badge,
  DatePicker,
  Pagination,
} from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ProjectOutlined,
  UserOutlined,
  CloseOutlined,
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
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTheme } from "@/context/ThemeContext";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import StatCards from "@/components/common/StatCards";
import { FilterBar, FilterToggleButton, TicketFilterPill } from "@/components/common/FilterBar";

dayjs.extend(relativeTime);

const { Text } = Typography;

export default function ProjectTrashManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filters, setFilters] = useState<{
    projectId?: string;
    projectManagerId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // Fetch all for stats and dropdown options
  const { data: allTrashRes } = useProjectTrash();
  // Fetch paginated for the table / cards
  const { data: paginatedTrashRes, isLoading } = useProjectTrash({
    page: pagination.current,
    limit: pagination.pageSize,
    search: searchQuery || undefined,
  });

  const restoreProject = useRestoreProject();
  const permanentDelete = usePermanentDeleteProject();
  const emptyTrash = useEmptyTrash();
  const bulkRestore = useBulkRestoreProjects();
  const bulkDelete = useBulkPermanentDeleteProjects();

  const allTrashProjects: any[] = Array.isArray(allTrashRes)
    ? allTrashRes
    : allTrashRes?.data || [];
  const paginatedTrashProjects: any[] = Array.isArray(paginatedTrashRes)
    ? paginatedTrashRes
    : paginatedTrashRes?.data || [];
  const totalTrashItems = Array.isArray(paginatedTrashRes)
    ? paginatedTrashRes.length
    : paginatedTrashRes?.pagination?.total || 0;

  const uniqueProjects = useMemo(() => {
    return Array.from(new Map(allTrashProjects.map((p: any) => [p.id, p.name])).entries());
  }, [allTrashProjects]);

  const uniqueManagers = useMemo(() => {
    return Array.from(
      new Map(
        allTrashProjects
          .filter((p: any) => p.projectManager)
          .map((p: any) => [
            p.projectManager.id,
            { name: p.projectManager.name, avatarUrl: p.projectManager.avatarUrl },
          ])
      ).entries()
    );
  }, [allTrashProjects]);

  // Client-side filtering on all projects for statistics
  const filteredProjectsForStats = useMemo(() => {
    return (
      allTrashProjects.filter((p: any) => {
        const matchesSearch =
          !searchQuery ||
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProject = !filters.projectId || p.id === filters.projectId;
        const matchesManager =
          !filters.projectManagerId || p.projectManager?.id === filters.projectManagerId;

        let matchesDate = true;
        if (filters.startDate && filters.endDate && p.updatedAt) {
          const deletedAt = dayjs(p.updatedAt);
          const start = dayjs(filters.startDate).startOf("day");
          const end = dayjs(filters.endDate).endOf("day");
          matchesDate =
            (deletedAt.isAfter(start) || deletedAt.isSame(start)) &&
            (deletedAt.isBefore(end) || deletedAt.isSame(end));
        }

        return matchesSearch && matchesProject && matchesManager && matchesDate;
      }) || []
    );
  }, [allTrashProjects, searchQuery, filters]);

  const stats = useMemo(() => {
    const total = filteredProjectsForStats.length;
    const recent = filteredProjectsForStats.filter(
      (p: any) => dayjs().diff(dayjs(p.updatedAt), "day") <= 7
    ).length;
    const older = filteredProjectsForStats.filter(
      (p: any) =>
        dayjs().diff(dayjs(p.updatedAt), "day") > 7 &&
        dayjs().diff(dayjs(p.updatedAt), "day") <= 30
    ).length;
    const purgeReady = filteredProjectsForStats.filter(
      (p: any) => dayjs().diff(dayjs(p.updatedAt), "day") > 30
    ).length;
    return { total, recent, older, purgeReady };
  }, [filteredProjectsForStats]);

  const activeFilterCount =
    (filters.projectId ? 1 : 0) +
    (filters.projectManagerId ? 1 : 0) +
    (filters.startDate ? 1 : 0);

  const handleResetFilters = () => {
    setFilters({});
    setDateRange(null);
    setSearchQuery("");
  };

  const statCells = useMemo(() => {
    return [
      {
        key: "total",
        label: "Total Trashed",
        value: stats.total,
        icon: <FolderKanban size={15} />,
        color: "#3b82f6",
        tint: "rgba(59,130,246,0.10)",
      },
      {
        key: "recent",
        label: "Recently Deleted",
        value: stats.recent,
        suffix: stats.recent > 0 ? " (≤ 7d)" : "",
        icon: <Trash2 size={15} />,
        color: "#ef4444",
        tint: "rgba(239,68,68,0.10)",
      },
      {
        key: "older",
        label: "Older than 7 days",
        value: stats.older,
        icon: <Clock size={15} />,
        color: "#64748b",
        tint: "rgba(100,116,139,0.10)",
      },
      {
        key: "purgeReady",
        label: "Pending Purge",
        value: stats.purgeReady,
        suffix: stats.purgeReady > 0 ? " (> 30d)" : "",
        icon: <AlertTriangle size={15} />,
        color: "#f59e0b",
        tint: "rgba(245,158,11,0.10)",
      },
    ];
  }, [stats]);

  // Original columns as before
  const columns = [
    {
      title: "Project",
      key: "project",
      width: 250,
      render: (record: any) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-slate-900)" }}>
            {record.name}
          </Text>
        </div>
      ),
    },
    {
      title: "Project Code",
      dataIndex: "code",
      key: "code",
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
          <Text style={{ fontSize: "12px", color: "var(--text-slate-500)" }}>
            {dayjs(date).fromNow()}
          </Text>
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
              onClick={() =>
                restoreProject.mutate(record.id, {
                  onSuccess: () => {
                    message.success("Project restored successfully");
                  },
                })
              }
              loading={restoreProject.isPending}
            />
          </Tooltip>
          <ConfirmDialog
            tone="danger"
            title="Permanently delete project?"
            description="This action cannot be undone. All associated data will be lost."
            onConfirm={() =>
              new Promise<void>((resolve, reject) => {
                permanentDelete.mutate(record.id, {
                  onSuccess: () => {
                    message.success("Project permanently deleted");
                    resolve();
                  },
                  onError: (err) => {
                    reject(err);
                  },
                });
              })
            }
            confirmText="Yes, delete"
            cancelText="Cancel"
            placement="left"
            icon={<AlertTriangle size={16} />}
          >
            <Tooltip title="Permanent Delete">
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                loading={permanentDelete.isPending}
              />
            </Tooltip>
          </ConfirmDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="pm2-page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", maxHeight: "calc(100vh - 60px)", overflow: "hidden" }}>
      {/* ── Top Header Toolbar ── */}
      <div className="pm2-toolbar" style={{ margin: 0, padding: "10px 24px", position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
        {/* Title before search */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fff1f0",
              color: "#ff4d4f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #ffccc7",
            }}
          >
            <Trash2 size={16} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-slate-900)", letterSpacing: "-0.01em" }}>
              Trash Repository
            </span>
            <span style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>
              Recover or purge
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 22, background: "var(--border-slate-200)", flexShrink: 0 }} />

        <div className="pp-search-wrap" style={{ maxWidth: 360 }}>
          <SearchOutlined className="pp-search-icon" />
          <input
            className="pp-search"
            placeholder="Search project name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pm2-main-stats">
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
            <span
              className="pm2-pulse-dot"
              style={{ background: "#ff4d4f", boxShadow: "none", animation: "none", width: 6, height: 6, borderRadius: "50%" }}
            />
            <span className="font-semibold" style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>
              {totalTrashItems}
            </span>{" "}
            {totalTrashItems === 1 ? "project in trash" : "projects in trash"}
          </span>
        </div>

        <div className="pm2-main-controls" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <FilterToggleButton
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen((prev) => !prev)}
            activeCount={activeFilterCount}
          />

          <div className="pp-segmented">
            <button
              type="button"
              className={viewMode === "card" ? "is-active" : ""}
              onClick={() => setViewMode("card")}
              aria-label="Grid view"
              title="Card view"
            >
              <AppstoreOutlined />
            </button>
            <button
              type="button"
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
              aria-label="List view"
              title="Table view"
            >
              <UnorderedListOutlined />
            </button>
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

          <ConfirmDialog
            tone="danger"
            title="Empty trash repository?"
            description="This will permanently delete all projects currently in the trash. This action cannot be undone."
            onConfirm={() =>
              new Promise<void>((resolve, reject) => {
                emptyTrash.mutate(undefined, {
                  onSuccess: () => {
                    message.success("Trash emptied successfully");
                    resolve();
                  },
                  onError: (err) => {
                    reject(err);
                  },
                });
              })
            }
            confirmText="Yes, empty all"
            cancelText="Cancel"
            placement="bottomRight"
            icon={<AlertTriangle size={16} />}
            disabled={totalTrashItems === 0 || isLoading}
          >
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              loading={emptyTrash.isPending}
              disabled={totalTrashItems === 0 || isLoading}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                height: 36,
                backgroundColor:
                  totalTrashItems === 0 || isLoading
                    ? isDark
                      ? "#1f1f1f"
                      : "#f5f5f5"
                    : isDark
                    ? "transparent"
                    : "#fff2f0",
                color:
                  totalTrashItems === 0 || isLoading
                    ? "#8c8c8c"
                    : "#ff4d4f",
                borderColor:
                  totalTrashItems === 0 || isLoading
                    ? "#d9d9d9"
                    : isDark
                    ? "#ff4d4f"
                    : "transparent",
              }}
            >
              Empty Trash
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-slate-200)", margin: 0, flexShrink: 0 }} />

      {/* ── Stat Cards ── */}
      <div style={{ flexShrink: 0 }}>
        <StatCards
          title="Project Trash Overview"
          statusText="TRASHED"
          statusColor="#ef4444"
          statusBorder="rgba(239, 68, 68, 0.32)"
          progressPct={totalTrashItems > 0 ? Math.round((stats.recent / totalTrashItems) * 100) : 0}
          cards={statCells}
        />
      </div>

      {/* ── Collapsible Unified FilterBar ── */}
      {isFilterOpen && (
        <div style={{ flexShrink: 0 }}>
          <FilterBar
            activeCount={activeFilterCount}
            onReset={handleResetFilters}
            onClose={() => setIsFilterOpen(false)}
            actions={
              <span style={{ fontSize: 12, color: "var(--text-slate-500)", whiteSpace: "nowrap" }}>
                <b>{paginatedTrashProjects.length}</b> of <b>{totalTrashItems}</b> projects
              </span>
            }
          >
          <TicketFilterPill
            label="Project"
            icon={<ProjectOutlined />}
            value={filters.projectId || ""}
            options={uniqueProjects.map(([id, name]) => ({
              value: id as string,
              label: name as string,
            }))}
            onChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                projectId: val ? String(val) : undefined,
              }))
            }
            itemNoun="projects"
            multiple={false}
          />
          <TicketFilterPill
            label="Project Manager"
            icon={<UserOutlined />}
            value={filters.projectManagerId || ""}
            options={uniqueManagers.map(([id, pm]) => ({
              value: id as string,
              label: (pm as any).name as string,
              avatarUrl: (pm as any).avatarUrl || undefined,
            }))}
            onChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                projectManagerId: val ? String(val) : undefined,
              }))
            }
            itemNoun="managers"
            width={240}
            multiple={false}
            showAvatar
          />
          <DatePicker.RangePicker
            className="premium-range-picker"
            size="small"
            style={{ height: 28, borderRadius: 6 }}
            placeholder={["Start", "End"]}
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates as any);
              if (dates && dates.length === 2) {
                setFilters((prev) => ({
                  ...prev,
                  startDate: dates[0]?.format("YYYY-MM-DD"),
                  endDate: dates[1]?.format("YYYY-MM-DD"),
                }));
              } else {
                setFilters((prev) => ({
                  ...prev,
                  startDate: undefined,
                  endDate: undefined,
                }));
              }
            }}
            format="MMM D, YYYY"
            allowEmpty={[true, true]}
          />
        </FilterBar>
      </div>
    )}

      {/* ── Main Content Area with Original Table and Card Views ── */}
      <div className="pm2-main-content" style={{ padding: 0, flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {selectedRowKeys.length > 0 && (
          <div className="saas-bulk-actions" style={{ margin: "12px 16px 8px 16px" }}>
            <div className="saas-bulk-content">
              <Badge count={selectedRowKeys.length} style={{ backgroundColor: "#1890ff" }} />
              <Text strong style={{ marginLeft: 8 }}>
                Projects Selected
              </Text>
            </div>
            <div className="saas-bulk-buttons">
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => {
                  bulkRestore.mutate(selectedRowKeys as string[], {
                    onSuccess: () => setSelectedRowKeys([]),
                  });
                }}
                loading={bulkRestore.isPending}
                className="saas-bulk-btn restore"
              >
                Restore
              </Button>
              <ConfirmDialog
                tone="danger"
                title={`Purge ${selectedRowKeys.length} projects?`}
                description="This will permanently delete the selected projects. This action cannot be undone."
                onConfirm={() =>
                  new Promise<void>((resolve, reject) => {
                    bulkDelete.mutate(selectedRowKeys as string[], {
                      onSuccess: () => {
                        setSelectedRowKeys([]);
                        resolve();
                      },
                      onError: (err) => {
                        reject(err);
                      },
                    });
                  })
                }
                confirmText="Purge Selected"
                cancelText="Cancel"
                placement="bottomRight"
                icon={<AlertTriangle size={16} />}
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
              </ConfirmDialog>
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

        {/* ── Original Table View (Flush edge-to-edge with 0 top/left/right spacing) ── */}
        {viewMode === "table" ? (
          <div
            className="pm2-table-shell"
            style={{
              background: "var(--bg-pure-white)",
              border: "1px solid var(--border-slate-200)",
              borderLeft: "none",
              borderRight: "none",
              borderTop: "none",
              borderRadius: 0,
              overflow: "visible",
            }}
          >
            <Table
              size="small"
              className="premium-table"
              sticky={{ offsetHeader: 0 }}
              rowSelection={
                isLoading || isRefreshing
                  ? undefined
                  : {
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys),
                    }
              }
              dataSource={isLoading || isRefreshing ? Array(5).fill({}) : paginatedTrashProjects}
              columns={columns.map((col) => ({
                ...col,
                render: (text: any, record: any, index: number) => {
                  if (isLoading || isRefreshing) {
                    return <Skeleton.Input active size="small" block style={{ height: 20 }} />;
                  }
                  return col.render ? (col.render as any)(text, record, index) : text;
                },
              }))}
              loading={false}
              rowKey={(record: any) => record.id || Math.random()}
              pagination={false}
              scroll={{ x: "max-content" }}
              locale={{
                emptyText: <NoData description={<Text type="secondary">No projects found in trash</Text>} />,
              }}
            />
          </div>
        ) : (
          /* ── Original Card View (0 border-radius) ── */
          <div className="pm2-grid" style={{ padding: "16px 24px" }}>
            {isLoading || isRefreshing ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="pm2-list-card pm2-list-card-skel" style={{ borderRadius: 0 }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))
            ) : paginatedTrashProjects.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", padding: "40px 0" }}>
                <NoData description={<Text type="secondary">No projects found in trash</Text>} />
              </div>
            ) : (
              paginatedTrashProjects.map((project: any) => {
                const pm = project.projectManager;
                const pmFullName = pm?.name ? pm.name : "Unassigned";

                return (
                  <article
                    key={project.id}
                    className="pm2-list-card"
                    style={{ ["--row-accent" as any]: "#ff4d4f", borderRadius: 0 }}
                  >
                    <header className="pm2-list-head" style={{ padding: "8px 12px" }}>
                      <div
                        className="pm2-list-row"
                        style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
                      >
                        <div className="pm2-list-avatar" style={{ background: "#3b82f6", color: "#fff", top: "-3px" }}>
                          <span className="pm2-list-avatar-letter">
                            {(project.code || project.name).slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: "var(--text-slate-900)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {project.name}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-slate-500)",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 2,
                            }}
                          >
                            <span>Deleted: {dayjs(project.updatedAt).fromNow()}</span>
                          </span>
                        </div>
                      </div>
                    </header>
                    <div className="pm2-list-foot">
                      <div className="pm2-list-foot-row">
                        <Typography.Paragraph
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-slate-500)",
                            margin: 0,
                            lineHeight: 1.5,
                            minHeight: 36,
                          }}
                          ellipsis={{ rows: 2 }}
                        >
                          {project.description || "No description provided."}
                        </Typography.Paragraph>
                      </div>

                      <div className="pm2-list-foot-row">
                        <span className="pm2-list-foot-item">
                          <span className="pm2-list-foot-key">Manager:</span>
                          <Avatar
                            size={18}
                            src={pm?.avatarUrl}
                            style={{ fontSize: 9, background: "#e2e8f0", color: "#64748b" }}
                          >
                            {pmFullName.charAt(0)}
                          </Avatar>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-slate-700)" }}>
                            {pmFullName.split(" ")[0]}
                          </span>
                          <ConfirmDialog
                            tone="success"
                            title="Restore project?"
                            description="This will restore the project back to active status."
                            onConfirm={() =>
                              new Promise<void>((resolve, reject) => {
                                restoreProject.mutate(project.id, {
                                  onSuccess: () => {
                                    message.success("Project restored successfully");
                                    resolve();
                                  },
                                  onError: (err) => {
                                    reject(err);
                                  },
                                });
                              })
                            }
                            confirmText="Yes, restore"
                            cancelText="Cancel"
                            placement="topRight"
                            icon={<UndoOutlined />}
                          >
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="pc-view-btn"
                              style={{ color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <UndoOutlined />
                              Restore
                            </button>
                          </ConfirmDialog>
                          <ConfirmDialog
                            tone="danger"
                            title="Permanently delete project?"
                            description="This action cannot be undone."
                            onConfirm={() =>
                              new Promise<void>((resolve, reject) => {
                                permanentDelete.mutate(project.id, {
                                  onSuccess: () => {
                                    message.success("Project permanently deleted");
                                    resolve();
                                  },
                                  onError: (err) => {
                                    reject(err);
                                  },
                                });
                              })
                            }
                            confirmText="Yes, Delete"
                            cancelText="Cancel"
                            placement="topRight"
                            icon={<AlertTriangle size={16} />}
                          >
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="pc-view-btn"
                              style={{ color: "#ff4d4f", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <DeleteOutlined />
                              Purge
                            </button>
                          </ConfirmDialog>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Pagination Footer ── */}
      {totalTrashItems > 0 && (
        <div className="pm2-pagination" style={{ marginTop: "auto", flexShrink: 0 }}>
          <Typography.Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>
            Showing{" "}
            <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>
              {(pagination.current - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.current * pagination.pageSize, totalTrashItems)}
            </span>{" "}
            of <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>{totalTrashItems}</span> project
            {totalTrashItems !== 1 ? "s" : ""}
          </Typography.Text>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={totalTrashItems}
            onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
            showSizeChanger
            pageSizeOptions={[10, 15, 20, 25, 50, 100]}
          />
        </div>
      )}

      <style jsx global>{`
        .pp-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 9px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .pp-segmented button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .pp-segmented button.is-active {
          background: var(--bg-blue-50);
          color: #3b82f6;
        }
        .pp-search-wrap {
          position: relative;
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          max-width: 480px;
          width: 100%;
          height: 38px;
          min-height: 38px;
          border-radius: 8px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 0 12px;
          transition: all 0.2s;
        }
        .pp-search-wrap:focus-within {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          max-width: 520px;
        }
        .pp-search-icon {
          color: var(--text-slate-400);
          font-size: 14px;
        }
        .pp-search {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          margin-left: 9px;
          font-size: 13px;
          color: var(--text-slate-900);
          min-width: 0;
        }
        .pp-search::placeholder {
          color: var(--text-slate-400);
        }
        .pp-ghost-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          color: var(--text-slate-700);
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .pp-ghost-btn:hover {
          color: #3b82f6;
          border-color: #bfdbfe;
        }

        [data-theme='dark'] .pp-segmented {
          background: #0b0f1a !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .pp-segmented button.is-active {
          background: #161b22 !important;
          color: #ffffff !important;
        }
        [data-theme='dark'] .pp-search-wrap {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
        [data-theme='dark'] .pp-search-wrap:focus-within {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
        }
        [data-theme='dark'] .pp-search {
          color: #ffffff !important;
        }
        [data-theme='dark'] .pp-ghost-btn {
          background: #0b0f1a !important;
          border-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .pp-ghost-btn:hover {
          background: #161b22 !important;
          border-color: #1f2937 !important;
          color: #3b82f6 !important;
        }
        [data-theme='dark'] .pm2-main-stats {
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .pm2-main-stats .font-semibold {
          color: #cbd5e1 !important;
        }

        .pm2-table-shell {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          overflow: visible;
          margin-top: 0px !important;
        }

        .premium-table .ant-table,
        .premium-table .ant-table-wrapper,
        .premium-table .ant-table-container,
        .premium-table .ant-table-content,
        .premium-table .ant-table-header,
        .premium-table .ant-table-body {
          background: transparent !important;
          border-radius: 0 !important;
        }
        .premium-table .ant-table-thead > tr > th,
        .premium-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          color: var(--text-slate-400) !important;
          padding: 6px 10px !important;
          white-space: nowrap !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
        }
        .premium-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th,
        [data-theme='dark'] .premium-table .ant-table-thead > tr > td {
          background: #161b22 !important;
          border-bottom-color: #374151 !important;
          color: #94a3b8 !important;
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

        .pm2-list-card,
        .pm2-list-card:hover,
        .pm2-list-card-skel {
          border-radius: 0 !important;
        }

        [data-theme='dark'] .saas-bulk-actions {
          background: #161b22;
          border-color: #1f2937;
        }
        [data-theme='dark'] .saas-bulk-btn.restore:hover {
          background: rgba(82, 196, 26, 0.1) !important;
        }
        [data-theme='dark'] .saas-bulk-btn.purge:hover {
          background: rgba(255, 77, 79, 0.1) !important;
        }
        [data-theme='dark'] .saas-bulk-btn.cancel:hover {
          background: #1f2937 !important;
        }
      `}</style>
    </div>
  );
}
