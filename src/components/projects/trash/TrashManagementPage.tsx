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
  Progress,
  Select,
  Dropdown,
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
  TagOutlined,
  ClockCircleOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Trash2, AlertTriangle, Clock, Ticket, CheckCircle2 } from "lucide-react";
import {
  useTrashTickets,
  useRestoreFromTrash,
  usePermanentlyDelete,
  useBulkRestoreFromTrash,
  useBulkPermanentlyDelete,
  useEmptyTrash,
} from "@/hooks/useTrash";
import { useUserProjects, useTicketConfig, useMembers } from "@/hooks/useGlobalData";
import { usePermission } from "@/hooks/usePermission";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import { useQueryClient } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTheme } from "@/context/ThemeContext";
import StatCards from "@/components/common/StatCards";
import { FilterBar, FilterToggleButton, TicketFilterPill } from "@/components/common/FilterBar";

dayjs.extend(relativeTime);

const { Text } = Typography;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Filter states
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [deletedByFilter, setDeletedByFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { open: openTicketDrawer } = useTicketDrawer();
  const { canRestoreTicketTrash, canDeleteTicketTrash } = usePermission();

  // Reference datasets for filter dropdowns
  const { data: userProjectsData } = useUserProjects();
  const userProjects: any[] = userProjectsData || [];

  const { data: ticketConfig } = useTicketConfig();
  const statusesList = ticketConfig?.statuses || [];

  const { data: membersData } = useMembers();
  const membersList = membersData || [];

  // Fetch all trashed tickets for stats summary
  const { data: allTrashRes } = useTrashTickets({ limit: 1000 });
  // Fetch paginated tickets according to current filters & page
  const { data: paginatedTrashRes, isLoading, refetch } = useTrashTickets({
    page: pagination.current,
    limit: pagination.pageSize,
    projectId: projectFilter,
    search: searchQuery || undefined,
    status: statusFilter,
    deletedBy: deletedByFilter,
    startDate: dateRange?.[0] ? dateRange[0].startOf("day").toISOString() : undefined,
    endDate: dateRange?.[1] ? dateRange[1].endOf("day").toISOString() : undefined,
  });

  const restoreTicket = useRestoreFromTrash();
  const permanentDelete = usePermanentlyDelete();
  const bulkRestore = useBulkRestoreFromTrash();
  const bulkDelete = useBulkPermanentlyDelete();
  const emptyTrash = useEmptyTrash();

  const allTrashTickets: any[] = allTrashRes?.tickets || [];
  const paginatedTrashTickets: any[] = paginatedTrashRes?.tickets || [];
  const totalTrashItems = paginatedTrashRes?.pagination?.total || 0;

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalTrashItems;
    const tickets = allTrashTickets.length > 0 ? allTrashTickets : paginatedTrashTickets;
    const purgingSoon = tickets.filter((t) => {
      const days = calculateDaysRemaining(t.deletedAt || t.createdAt);
      return days <= 2;
    }).length;
    const recoverable = Math.max(0, total - purgingSoon);
    return { total, purgingSoon, recoverable };
  }, [totalTrashItems, allTrashTickets, paginatedTrashTickets]);

  const projectDropdownOptions: any[] = useMemo(
    () =>
      (userProjects || [])
        .filter((p: any) => p && (p.id || p.value))
        .map((p: any) => ({
          value: p.id || p.value,
          label: p.name || p.label || "Unnamed Project",
          description: p.code ? `#${p.code}` : undefined,
        })),
    [userProjects]
  );

  const selectedProj = useMemo(
    () => (userProjects || []).find((p: any) => (p.id || p.value) === projectFilter),
    [userProjects, projectFilter]
  );
  const displayCode = selectedProj
    ? (selectedProj.code || (selectedProj.name || selectedProj.label || "").slice(0, 3)?.toUpperCase() || "PRJ")
    : "ALL";
  const displayName = selectedProj ? (selectedProj.name || selectedProj.label || "Project") : "All Projects";

  const projectMenuItems = useMemo(() => {
    const allOption = {
      key: "all",
      label: (
        <div className="pp-menu-item" style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 9px" }}>
          <span
            className="pp-menu-ic"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: !projectFilter ? "#fff" : "var(--text-slate-500)",
              background: !projectFilter ? "var(--premium-gradient, #3b82f6)" : "var(--bg-slate-100)",
              fontWeight: 800,
            }}
          >
            ALL
          </span>
          <span className="pp-menu-text" style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span className="pp-menu-title" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-900)" }}>
              All Projects
            </span>
            <span className="pp-menu-desc" style={{ fontSize: 11, color: "var(--text-slate-400)", marginTop: 1 }}>
              Workspace tickets
            </span>
          </span>
          {!projectFilter && <CheckCircleOutlined style={{ color: "#10b981", fontSize: 12, marginLeft: "auto" }} />}
        </div>
      ),
      onClick: () => {
        setProjectFilter(undefined);
        setPagination((prev) => ({ ...prev, current: 1 }));
      },
    };

    const projectItems = (userProjects || []).map((p: any) => {
      const pId = p.id || p.value;
      const pName = p.name || p.label || "Unnamed Project";
      const isSelected = pId === projectFilter;
      const pCode = (p.code || pName || "?").slice(0, 3).toUpperCase();
      return {
        key: pId,
        label: (
          <div className="pp-menu-item" style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 9px" }}>
            <span
              className="pp-menu-ic"
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: isSelected ? "#fff" : "var(--text-slate-500)",
                background: isSelected ? "var(--premium-gradient, #3b82f6)" : "var(--bg-slate-100)",
                fontWeight: 800,
              }}
            >
              {pCode}
            </span>
            <span className="pp-menu-text" style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span className="pp-menu-title" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-900)" }}>
                {pName}
              </span>
              {p.code && <span className="pp-menu-desc" style={{ fontSize: 11, color: "var(--text-slate-400)", marginTop: 1 }}>#{p.code}</span>}
            </span>
            {isSelected && <CheckCircleOutlined style={{ color: "#10b981", fontSize: 12, marginLeft: "auto" }} />}
          </div>
        ),
        onClick: () => {
          setProjectFilter(pId);
          setPagination((prev) => ({ ...prev, current: 1 }));
        },
      };
    });

    return [allOption, ...projectItems];
  }, [userProjects, projectFilter]);

  const activeFilterCount =
    (projectFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (deletedByFilter ? 1 : 0) +
    (dateRange ? 1 : 0);

  const handleResetFilters = () => {
    setProjectFilter(undefined);
    setStatusFilter(undefined);
    setDeletedByFilter(undefined);
    setDateRange(null);
    setSearchQuery("");
  };

  const statCells = useMemo(() => {
    return [
      {
        key: "total",
        label: "Total Trashed Tickets",
        value: stats.total,
        icon: <Ticket size={15} />,
        color: "#3b82f6",
        tint: "rgba(59,130,246,0.10)",
      },
      {
        key: "purgingSoon",
        label: "Purging Soon",
        value: stats.purgingSoon,
        suffix: stats.purgingSoon > 0 ? " (≤ 2d)" : "",
        icon: <AlertTriangle size={15} />,
        color: "#ef4444",
        tint: "rgba(239,68,68,0.10)",
      },
      {
        key: "recoverable",
        label: "Recoverable",
        value: stats.recoverable,
        icon: <CheckCircle2 size={15} />,
        color: "#10b981",
        tint: "rgba(16,185,129,0.10)",
      },
      {
        key: "retention",
        label: "Retention Period",
        value: "7 Days",
        icon: <Clock size={15} />,
        color: "#f59e0b",
        tint: "rgba(245,158,11,0.10)",
      },
    ];
  }, [stats]);

  // Table Columns
  const columns = [
    {
      title: "Ticket Details",
      key: "ticket",
      width: 320,
      render: (record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className="trs2-ticket-id"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#1d4ed8",
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.18)",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              {record.ticketNumber}
            </span>
            <Tag color={record.status === "completed" ? "green" : "blue"} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
              {(record.status || "open").replace("_", " ").toUpperCase()}
            </Tag>
          </div>
          <span
            onClick={() => openTicketDrawer(record.id)}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-slate-900)",
              cursor: "pointer",
              lineHeight: 1.35,
            }}
            className="hover:underline"
          >
            {record.title}
          </span>
        </div>
      ),
    },
    {
      title: "Project",
      key: "project",
      width: 200,
      render: (record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tag color="geekblue" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
            {record.project?.code || record.project?.name?.slice(0, 3)?.toUpperCase() || "PRJ"}
          </Tag>
          <Text style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-slate-700)" }}>
            {record.project?.name || "Global"}
          </Text>
        </div>
      ),
    },
    {
      title: "Deleted By",
      key: "deletedBy",
      width: 200,
      render: (record: any) => {
        const actor = record.deletedBy;
        const actorName = actor?.name || "System";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar src={actor?.avatarUrl} size="small" style={{ background: "#475569", color: "#fff", fontSize: 10, fontWeight: 800 }}>
              {actorName.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-slate-800)" }}>{actorName}</Text>
              <Text style={{ fontSize: "10.5px", color: "var(--text-slate-400)" }}>
                {dayjs(record.deletedAt || record.createdAt).fromNow()}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Auto-Purge Retention",
      key: "purge",
      width: 220,
      render: (record: any) => {
        const daysRemaining = calculateDaysRemaining(record.deletedAt || record.createdAt);
        const progress = calculatePurgeProgress(record.deletedAt || record.createdAt);
        const isUrgent = daysRemaining <= 2;
        return (
          <Tooltip title={`Permanently purged in approx. ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", maxWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isUrgent ? "#ef4444" : "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <ClockCircleOutlined />
                  {daysRemaining === 0 ? "Purging today" : `${daysRemaining}d remaining`}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-slate-400)", fontWeight: 600 }}>{Math.round(progress)}%</span>
              </div>
              <Progress
                percent={progress}
                showInfo={false}
                size="small"
                strokeColor={isUrgent ? "#ef4444" : "#10b981"}
                trailColor={isDark ? "#1f2937" : "#e2e8f0"}
                style={{ margin: 0 }}
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      align: "right" as const,
      fixed: "right" as const,
      render: (record: any) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {canRestoreTicketTrash && (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmDialog
                tone="primary"
                title="Restore ticket?"
                description="This will restore the ticket back to active status."
                confirmText="Restore"
                cancelText="Cancel"
                placement="bottomRight"
                onConfirm={() =>
                  new Promise<void>((resolve) => {
                    restoreTicket.mutate([record.id], {
                      onSuccess: () => {
                        message.success("Ticket restored successfully");
                        refetch();
                        resolve();
                      },
                      onError: () => resolve(),
                    });
                  })
                }
              >
                <Tooltip title="Restore Ticket">
                  <Button
                    type="text"
                    icon={<UndoOutlined style={{ color: "#10b981" }} />}
                    loading={restoreTicket.isPending}
                  />
                </Tooltip>
              </ConfirmDialog>
            </div>
          )}
          {canDeleteTicketTrash && (
            <ConfirmDialog
              tone="danger"
              title="Permanently delete ticket?"
              description={`Permanently delete ticket ${record.ticketNumber}? This action cannot be undone.`}
              onConfirm={() =>
                new Promise<void>((resolve, reject) => {
                  permanentDelete.mutate([record.id], {
                    onSuccess: () => {
                      message.success("Ticket permanently deleted");
                      refetch();
                      resolve();
                    },
                    onError: (err) => reject(err),
                  });
                })
              }
              confirmText="Yes, Delete"
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="pm2-page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", maxHeight: "calc(100vh - 60px)", overflow: "hidden" }}>
      {/* ── Top Header Toolbar ── */}
      <div className="pm2-toolbar" style={{ margin: 0, padding: "10px 24px", position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
        {/* Title & Icon */}
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
              Tickets Trash
            </span>
            <span style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>
              Recover or purge tickets
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 22, background: "var(--border-slate-200)", flexShrink: 0 }} />

        {/* Project Switcher Dropdown (identical to TicketList) */}
        <Dropdown
          menu={{ items: projectMenuItems }}
          overlayClassName="project-switch-pop"
          trigger={["click"]}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 8,
            }}
            className="project-switch-trigger transition-colors"
          >
            <div
              style={{
                padding: "0 6px",
                height: 26,
                borderRadius: 6,
                background: "var(--premium-gradient, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 9,
                fontWeight: 800,
                boxShadow: "var(--premium-shadow-lg, 0 2px 6px rgba(59,130,246,0.3))",
                minWidth: 30,
              }}
            >
              {displayCode}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-slate-500)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                Switch Project <CaretRightOutlined style={{ fontSize: 7 }} />
              </div>
            </div>
          </div>
        </Dropdown>

        <div style={{ width: 1, height: 22, background: "var(--border-slate-200)", flexShrink: 0 }} />

        {/* Search input */}
        <div className="pp-search-wrap" style={{ maxWidth: 320 }}>
          <SearchOutlined className="pp-search-icon" />
          <input
            className="pp-search"
            placeholder="Search ticket #, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Counter */}
        <div className="pm2-main-stats">
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
            <span
              className="pm2-pulse-dot"
              style={{ background: "#ff4d4f", boxShadow: "none", animation: "none", width: 6, height: 6, borderRadius: "50%" }}
            />
            <span className="font-semibold" style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>
              {totalTrashItems}
            </span>{" "}
            {totalTrashItems === 1 ? "ticket in trash" : "tickets in trash"}
          </span>
        </div>

        {/* Header Actions */}
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
                await refetch();
                setIsRefreshing(false);
                message.success("Trash view refreshed");
              }}
              disabled={isLoading || isRefreshing}
            >
              <ReloadOutlined spin={isRefreshing} />
            </button>
          </Tooltip>

          {canDeleteTicketTrash && (
            <ConfirmDialog
              tone="danger"
              title="Empty trash repository?"
              description="This will permanently delete all tickets currently in the trash. This action cannot be undone."
              onConfirm={() =>
                new Promise<void>((resolve, reject) => {
                  emptyTrash.mutate(
                    { projectId: projectFilter, force: true },
                    {
                      onSuccess: () => {
                        message.success("Trash emptied successfully");
                        refetch();
                        resolve();
                      },
                      onError: (err) => reject(err),
                    }
                  );
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
                  color: totalTrashItems === 0 || isLoading ? "#8c8c8c" : "#ff4d4f",
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
          )}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-slate-200)", margin: 0, flexShrink: 0 }} />

      {/* ── Stat Cards ── */}
      <div style={{ flexShrink: 0 }}>
        <StatCards
          title="Tickets Trash Overview"
          statusText="TRASHED"
          statusColor="#ef4444"
          statusBorder="rgba(239, 68, 68, 0.32)"
          progressPct={totalTrashItems > 0 ? Math.round((stats.purgingSoon / totalTrashItems) * 100) : 0}
          cards={statCells}
        />
      </div>

      {/* ── Collapsible FilterBar (with Project select retained) ── */}
      {isFilterOpen && (
        <div style={{ flexShrink: 0 }}>
          <FilterBar
            activeCount={activeFilterCount}
            onReset={handleResetFilters}
            onClose={() => setIsFilterOpen(false)}
            actions={
              <span style={{ fontSize: 12, color: "var(--text-slate-500)", whiteSpace: "nowrap" }}>
                <b>{paginatedTrashTickets.length}</b> of <b>{totalTrashItems}</b> tickets
              </span>
            }
          >
            {/* Project Select Filter Pill */}
            <TicketFilterPill
              label="Project"
              icon={<ProjectOutlined />}
              value={projectFilter || ""}
              options={userProjects.map((p: any) => ({
                value: p.value || p.id,
                label: p.label || p.name,
              }))}
              onChange={(val) => {
                setProjectFilter(val ? String(val) : undefined);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              itemNoun="projects"
              multiple={false}
            />

            {/* Status Filter Pill */}
            <TicketFilterPill
              label="Status"
              icon={<TagOutlined />}
              value={statusFilter || ""}
              options={statusesList.map((st: any) => {
                const val = typeof st === "string" ? st : st?.key || st?.value || st?.id || String(st || "");
                const rawLabel = typeof st === "string" ? st : st?.name || st?.label || st?.key || String(st || "");
                const labelStr = typeof rawLabel === "string" ? rawLabel.replace(/_/g, " ") : String(rawLabel);
                return { value: val, label: labelStr };
              })}
              onChange={(val) => {
                setStatusFilter(val ? String(val) : undefined);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              itemNoun="statuses"
              multiple={false}
            />

            {/* Deleted By Filter Pill */}
            <TicketFilterPill
              label="Deleted By"
              icon={<UserOutlined />}
              value={deletedByFilter || ""}
              options={membersList.map((m: any) => ({
                value: m.value || m.id,
                label: m.label || m.name || m.email,
                avatarUrl: m.avatarUrl || undefined,
              }))}
              onChange={(val) => {
                setDeletedByFilter(val ? String(val) : undefined);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              itemNoun="members"
              width={240}
              multiple={false}
              showAvatar
            />

            {/* Date Range Picker */}
            <DatePicker.RangePicker
              className="premium-range-picker"
              size="small"
              style={{ height: 28, borderRadius: 6 }}
              placeholder={["Start", "End"]}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as any);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              format="MMM D, YYYY"
              allowEmpty={[true, true]}
            />
          </FilterBar>
        </div>
      )}

      {/* ── Main Content Area (Table and Card Views) ── */}
      <div
        className="pm2-main-content"
        style={{
          padding: 0,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Single-line Inline Bulk Selection Bar */}
        {selectedRowKeys.length > 0 && (
          <div
            className="saas-bulk-actions"
            style={{
              margin: "8px 24px",
              padding: "4px 14px",
              height: 38,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div className="saas-bulk-content" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: "#3b82f6",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "0 5px",
                }}
              >
                {selectedRowKeys.length}
              </span>
              <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-slate-900)" }}>
                {selectedRowKeys.length === 1 ? "1 Ticket Selected" : `${selectedRowKeys.length} Tickets Selected`}
              </Text>
            </div>
            <div className="saas-bulk-buttons" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {canRestoreTicketTrash && (
                <ConfirmDialog
                  tone="primary"
                  title="Restore tickets?"
                  description={`This will restore ${selectedRowKeys.length} ticket${selectedRowKeys.length > 1 ? 's' : ''} to active status.`}
                  confirmText="Restore"
                  cancelText="Cancel"
                  placement="bottomRight"
                  onConfirm={() =>
                    new Promise<void>((resolve) => {
                      bulkRestore.mutate(selectedRowKeys as string[], {
                        onSuccess: () => {
                          message.success("Tickets restored successfully");
                          setSelectedRowKeys([]);
                          refetch();
                          resolve();
                        },
                        onError: () => resolve(),
                      });
                    })
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<UndoOutlined style={{ color: "#10b981" }} />}
                    loading={bulkRestore.isPending}
                    style={{
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 12,
                      color: "#059669",
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      height: 28,
                      padding: "0 10px",
                    }}
                  >
                    Restore
                  </Button>
                </ConfirmDialog>
              )}
              {canDeleteTicketTrash && (
                <ConfirmDialog
                  tone="danger"
                  title={`Purge ${selectedRowKeys.length} ticket${selectedRowKeys.length === 1 ? "" : "s"}?`}
                  description="This will permanently delete the selected tickets. This action cannot be undone."
                  onConfirm={() =>
                    new Promise<void>((resolve, reject) => {
                      bulkDelete.mutate(selectedRowKeys as string[], {
                        onSuccess: () => {
                          message.success("Tickets permanently deleted");
                          setSelectedRowKeys([]);
                          refetch();
                          resolve();
                        },
                        onError: (err) => reject(err),
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
                    icon={<DeleteOutlined style={{ color: "#ef4444" }} />}
                    loading={bulkDelete.isPending}
                    style={{
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 12,
                      color: "#dc2626",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      height: 28,
                      padding: "0 10px",
                    }}
                  >
                    Purge
                  </Button>
                </ConfirmDialog>
              )}
              <Tooltip title="Clear selection">
                <button
                  type="button"
                  onClick={() => setSelectedRowKeys([])}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text-slate-400)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4,
                    borderRadius: 4,
                    marginLeft: 2,
                  }}
                >
                  <CloseOutlined style={{ fontSize: 12 }} />
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Table View */}
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
              overflowX: "auto",
              width: "100%",
              boxSizing: "border-box",
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
              dataSource={isLoading || isRefreshing ? Array(5).fill({}) : paginatedTrashTickets}
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
                emptyText: <NoData description={<Text type="secondary">No tickets found in trash</Text>} />,
              }}
            />
          </div>
        ) : (
          /* Card / Grid View */
          <div className="pm2-grid" style={{ padding: "16px 24px" }}>
            {isLoading || isRefreshing ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="pm2-list-card pm2-list-card-skel" style={{ borderRadius: 0 }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))
            ) : paginatedTrashTickets.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", padding: "40px 0" }}>
                <NoData description={<Text type="secondary">No tickets found in trash</Text>} />
              </div>
            ) : (
              paginatedTrashTickets.map((ticket: any) => {
                const daysRemaining = calculateDaysRemaining(ticket.deletedAt || ticket.createdAt);
                const progress = calculatePurgeProgress(ticket.deletedAt || ticket.createdAt);
                const isUrgent = daysRemaining <= 2;
                const actor = ticket.deletedBy;
                const actorName = actor?.name || "System";

                return (
                  <article
                    key={ticket.id}
                    className="pm2-list-card"
                    style={{ ["--row-accent" as any]: isUrgent ? "#ef4444" : "#3b82f6", borderRadius: 0 }}
                  >
                    <header className="pm2-list-head" style={{ padding: "10px 14px" }}>
                      <div className="pm2-list-row" style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1d4ed8",
                            background: "rgba(59,130,246,0.08)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          {ticket.ticketNumber}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span
                            onClick={() => openTicketDrawer(ticket.id)}
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: "var(--text-slate-900)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                            }}
                          >
                            {ticket.title}
                          </span>
                          <span style={{ fontSize: 11.5, color: "var(--text-slate-500)", marginTop: 2 }}>
                            {ticket.project?.name || "Global"}
                          </span>
                        </div>
                      </div>
                    </header>
                    <div className="pm2-list-foot" style={{ padding: "10px 14px" }}>
                      <div className="pm2-list-foot-row" style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                          <Avatar src={actor?.avatarUrl} size={18} style={{ fontSize: 9, background: "#475569", color: "#fff" }}>
                            {actorName.charAt(0).toUpperCase()}
                          </Avatar>
                          <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text-slate-600)" }}>
                            Deleted by {actorName} ({dayjs(ticket.deletedAt || ticket.createdAt).fromNow()})
                          </span>
                        </div>
                      </div>

                      <div className="pm2-list-foot-row" style={{ gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
                            <span style={{ color: isUrgent ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                              {daysRemaining === 0 ? "Purging today" : `${daysRemaining}d remaining`}
                            </span>
                            <span style={{ color: "var(--text-slate-400)", fontWeight: 600 }}>{Math.round(progress)}%</span>
                          </div>
                          <Progress
                            percent={progress}
                            showInfo={false}
                            size="small"
                            strokeColor={isUrgent ? "#ef4444" : "#10b981"}
                            trailColor={isDark ? "#1f2937" : "#e2e8f0"}
                          />
                        </div>

                        <div style={{ display: "flex", gap: 4 }}>
                          {canRestoreTicketTrash && (
                            <ConfirmDialog
                              tone="success"
                              title="Restore ticket?"
                              description="This will restore the ticket back to active status."
                              onConfirm={() =>
                                new Promise<void>((resolve, reject) => {
                                  restoreTicket.mutate([ticket.id], {
                                    onSuccess: () => {
                                      message.success("Ticket restored successfully");
                                      refetch();
                                      resolve();
                                    },
                                    onError: (err) => reject(err),
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
                                className="pc-view-btn"
                                style={{ color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <UndoOutlined />
                                Restore
                              </button>
                            </ConfirmDialog>
                          )}

                          {canDeleteTicketTrash && (
                            <ConfirmDialog
                              tone="danger"
                              title="Permanently delete ticket?"
                              description="This action cannot be undone."
                              onConfirm={() =>
                                new Promise<void>((resolve, reject) => {
                                  permanentDelete.mutate([ticket.id], {
                                    onSuccess: () => {
                                      message.success("Ticket permanently deleted");
                                      refetch();
                                      resolve();
                                    },
                                    onError: (err) => reject(err),
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
                                className="pc-view-btn"
                                style={{ color: "#ff4d4f", display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <DeleteOutlined />
                                Purge
                              </button>
                            </ConfirmDialog>
                          )}
                        </div>
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
            of <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>{totalTrashItems}</span> ticket
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
          background: var(--bg-slate-100);
          border-color: var(--border-slate-300);
        }
        .premium-table.ant-table-wrapper .ant-table-selection-column,
        .premium-table .ant-table-selection-column {
          padding-left: 16px !important;
          padding-right: 12px !important;
        }
        .premium-table.ant-table-wrapper .ant-table-tbody > tr > td:first-child,
        .premium-table.ant-table-wrapper .ant-table-thead > tr > th:first-child {
          padding-left: 16px !important;
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
          border-bottom-color: #1e293b !important;
        }
        .premium-table .ant-table-row:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td {
          background: rgba(255, 255, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
}
