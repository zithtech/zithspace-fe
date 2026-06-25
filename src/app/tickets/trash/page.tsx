"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
  App,
  Avatar,
  Button,
  Input,
  Popconfirm,
  Progress,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import {
  ClearOutlined,
  CloseOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  UndoOutlined,
  RestOutlined,
} from "@ant-design/icons";
import {
  useTrashTickets,
  useBulkRestoreFromTrash,
  useBulkPermanentlyDelete,
  useEmptyTrash,
} from "@/hooks/useTrash";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import TicketLifecycleShell, { ProjectFilterOption } from "@/components/projects/TicketLifecycleShell";
import type { TrashTicket } from "@/services/trashService";

const { Text } = Typography;
const RETENTION_DAYS = 7;

const PROJECT_PALETTE = [
  "#0ea5e9", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#6366f1", "#ec4899", "#14b8a6", "#a855f7", "#84cc16",
];

const calculateDaysRemaining = (deletedAt: string) => {
  const purgeDate = dayjs(deletedAt).add(RETENTION_DAYS, "days");
  return Math.max(0, purgeDate.diff(dayjs(), "days"));
};

const calculatePurgeProgress = (deletedAt: string) => {
  const elapsedHours = dayjs().diff(dayjs(deletedAt), "hour");
  const totalHours = RETENTION_DAYS * 24;
  return Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100));
};

export default function TrashPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicketTrash, canRestoreTicketTrash, canDeleteTicketTrash } = usePermission();
  const router = useRouter();
  const { message } = App.useApp();
  const { open: openTicketDrawer } = useTicketDrawer();
  const { data: projects } = useUserProjects();

  useEffect(() => {
    if (!authLoading && !canReadTicketTrash) router.push("/dashboard");
  }, [authLoading, canReadTicketTrash, router]);

  useActivitySource({ section: "WORK", module: "Trash", page: "TrashView" });

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: trashData, isLoading, refetch, isFetching } = useTrashTickets({
    projectId: selectedProject || undefined,
    search: searchText,
    page,
    limit: pageSize,
  });

  const { mutateAsync: bulkRestore, isPending: isRestoring } = useBulkRestoreFromTrash();
  const { mutateAsync: bulkPermanent, isPending: isPurging } = useBulkPermanentlyDelete();
  const { mutateAsync: emptyTrash, isPending: isEmptying } = useEmptyTrash();

  const tickets = trashData?.tickets || [];
  const pagination = trashData?.pagination;
  const total = trashData?.summary?.total || 0;
  const expiringSoon = trashData?.summary?.expiringSoon || 0;

  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Per-project trash counts: derived from the projectCounts returned by the backend
  const projectFilterOptions = useMemo<ProjectFilterOption[]>(() => {
    if (!projects) return [];
    const projectCounts = trashData?.summary?.projectCounts || [];
    const countsMap = new Map<string, number>();
    projectCounts.forEach((pc) => {
      if (pc.projectId) countsMap.set(pc.projectId, pc.count);
    });
    return (projects as any[]).map((p, i) => ({
      value: p.value,
      label: p.label,
      code: p.code,
      count: countsMap.get(p.value) || 0,
      color: PROJECT_PALETTE[i % PROJECT_PALETTE.length],
    }));
  }, [projects, trashData?.summary?.projectCounts]);

  const totalAcrossProjects = trashData?.summary?.totalAllTrash ?? 0;

  const handleRestore = async (ids?: string[]) => {
    const ticketIds = ids || (selectedRowKeys as string[]);
    if (ticketIds.length === 0) {
      message.warning("Please select tickets to restore");
      return;
    }
    try {
      await bulkRestore(ticketIds);
      message.success(`Restored ${ticketIds.length} ticket${ticketIds.length === 1 ? "" : "s"}`);
      setSelectedRowKeys([]);
      refetch();
    } catch (err: any) {
      message.error(err?.message || "Failed to restore");
    }
  };

  const handlePermanentlyDelete = async (ids?: string[]) => {
    const ticketIds = ids || (selectedRowKeys as string[]);
    if (ticketIds.length === 0) {
      message.warning("Please select tickets to permanently delete");
      return;
    }
    try {
      await bulkPermanent(ticketIds);
      message.success(`Permanently deleted ${ticketIds.length} ticket${ticketIds.length === 1 ? "" : "s"}`);
      setSelectedRowKeys([]);
      refetch();
    } catch (err: any) {
      message.error(err?.message || "Failed to delete");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash({ projectId: selectedProject || undefined, force: false });
      message.success("Trash emptied");
      setSelectedRowKeys([]);
      refetch();
    } catch (err: any) {
      message.error(err?.message || "Failed to empty trash");
    }
  };

  const columns: ColumnsType<TrashTicket> = [
    {
      title: "Ticket",
      key: "ticket",
      render: (_: any, record: TrashTicket) => (
        <button
          type="button"
          onClick={() => openTicketDrawer(record.id)}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <span className="trs2-ticket-id">{record.ticketNumber}</span>
          <Text className="trs2-ticket-title">{record.title}</Text>
        </button>
      ),
    },
    {
      title: "Project",
      key: "project",
      width: 200,
      render: (_: any, record: TrashTicket) => {
        const project = typeof record.project === "object" ? record.project : null;
        return (
          <div className="trs2-project-chip">
            <Tag className="trs2-project-code-tag">{project?.code || "GLB"}</Tag>
            <Text ellipsis className="trs2-project-name">
              {project?.name || "Global"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Deleted",
      key: "deletedAt",
      width: 160,
      render: (_: any, record: TrashTicket) => (
        <div className="trs2-date-cell">
          <Text className="trs2-date-primary">{dayjs(record.deletedAt).format("MMM D, YYYY")}</Text>
          <Text className="trs2-date-secondary">{dayjs(record.deletedAt).fromNow()}</Text>
        </div>
      ),
    },
    {
      title: "Deleted By",
      key: "deletedBy",
      width: 200,
      render: (_: any, record: TrashTicket) => {
        const name = record.deletedBy?.name || "Unknown";
        return (
          <div className="trs2-actor-cell">
            <Avatar size={24} className="trs2-actor-avatar">
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text className="trs2-actor-name">{name}</Text>
          </div>
        );
      },
    },
    {
      title: "Retention",
      key: "retention",
      width: 170,
      render: (_: any, record: TrashTicket) => {
        const daysRemaining = calculateDaysRemaining(record.deletedAt);
        const progress = calculatePurgeProgress(record.deletedAt);
        const isUrgent = daysRemaining <= 2;
        return (
          <div className="trs2-retention-cell">
            <div className="trs2-retention-line">
              <span className={`trs2-retention-days ${isUrgent ? "urgent" : ""}`}>
                {daysRemaining}d
              </span>
              <span className="trs2-retention-label">remaining</span>
            </div>
            <Progress
              percent={progress}
              size="small"
              showInfo={false}
              strokeColor={isUrgent ? "#ef4444" : "#f59e0b"}
              trailColor="var(--bg-slate-100)"
            />
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right",
      fixed: "right" as const,
      render: (_: any, record: TrashTicket) => (
        <div className="trs2-action-cell">
          {canRestoreTicketTrash && (
            <Popconfirm
              title="Restore Ticket"
              description="Bring this ticket back to the project?"
              onConfirm={() => handleRestore([record.id])}
              okText="Restore"
              cancelText="Cancel"
            >
              <Tooltip title="Restore">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<UndoOutlined />}
                  style={{ color: "#10b981" }}
                />
              </Tooltip>
            </Popconfirm>
          )}
          {canDeleteTicketTrash && (
            <Popconfirm
              title="Delete Permanently"
              description="This action cannot be undone."
              onConfirm={() => handlePermanentlyDelete([record.id])}
              okText="Delete Forever"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete forever">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Spin size="large" tip="Loading trash repository..." />
        </div>
      </MainLayout>
    );
  }
  if (!canReadTicketTrash) return null;

  const isFiltered = !!(selectedProject || searchText);

  return (
    <MainLayout>
      <TicketLifecycleShell
        eyebrow="Workspace · Trash"
        title="Trash Repository"
        subtitle={`Tickets retained for ${RETENTION_DAYS} days before permanent deletion.`}
        icon={<RestOutlined />}
        projects={projectFilterOptions}
        selectedProjectId={selectedProject}
        onSelectProject={setSelectedProject}
        totalCount={totalAcrossProjects}
        activeFilterCount={(selectedProject ? 1 : 0) + (searchText ? 1 : 0)}
        onClearFilters={() => { setSelectedProject(null); setSearchText(""); }}
        headerActions={
          <>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
                loading={isFetching}
                style={{ height: 32, fontWeight: 600 }}
              />
            </Tooltip>
            {canDeleteTicketTrash && total > 0 && (
              <Popconfirm
                title="Empty Trash"
                description="Permanently delete ALL tickets in trash? This cannot be undone."
                onConfirm={handleEmptyTrash}
                okText="Empty Trash"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<ClearOutlined />}
                  loading={isEmptying}
                  style={{ height: 32, fontWeight: 700 }}
                >
                  Empty Trash
                </Button>
              </Popconfirm>
            )}
          </>
        }
        toolbar={
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" }}>
            <Input
              placeholder="Search trash…"
              prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 320, height: 32, borderRadius: 8 }}
            />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-slate-500)" }}>
              <b style={{ color: "var(--text-slate-900)" }}>{total}</b> in trash
              {expiringSoon > 0 && (
                <span style={{ marginLeft: 10, color: "#b91c1c" }}>
                  · <b>{expiringSoon}</b> expiring soon
                </span>
              )}
            </span>
            <div style={{ flex: 1 }} />
            {selectedRowKeys.length > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1d4ed8" }}>
                  {selectedRowKeys.length} selected
                </span>
                {canRestoreTicketTrash && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<UndoOutlined />}
                    onClick={() => handleRestore()}
                    loading={isRestoring}
                  >
                    Restore
                  </Button>
                )}
                {canDeleteTicketTrash && (
                  <Popconfirm
                    title="Delete Permanently"
                    description={`Permanently delete ${selectedRowKeys.length} ticket${selectedRowKeys.length === 1 ? "" : "s"}? This cannot be undone.`}
                    onConfirm={() => handlePermanentlyDelete()}
                    okText="Delete Forever"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} loading={isPurging}>
                      Delete Forever
                    </Button>
                  </Popconfirm>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedRowKeys([])}
                />
              </div>
            )}
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={isLoading}
          size="small"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          className="trs2-table"
          locale={{
            emptyText: isLoading ? null : (
              <div className="trs2-empty">
                <div className="trs2-empty-icon">
                  <RestOutlined />
                </div>
                <Text className="trs2-empty-title">
                  {isFiltered ? "No matching deleted tickets" : "Trash is empty"}
                </Text>
                <Text className="trs2-empty-sub">
                  {isFiltered
                    ? "Try adjusting your filters or search query."
                    : "Tickets you delete will appear here for 7 days before they are permanently removed."}
                </Text>
                {isFiltered && (
                  <Button
                    size="small"
                    onClick={() => { setSearchText(""); setSelectedProject(null); }}
                    style={{ marginTop: 12 }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ),
          }}
          pagination={
            tickets.length > 0
              ? {
                  current: page,
                  pageSize,
                  total: pagination?.total || 0,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 25, 50, 100],
                  showTotal: (t, range) => (
                    <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                      Showing {range[0]}–{range[1]} of {t}
                    </Text>
                  ),
                  onChange: (newPage, newPageSize) => {
                    setPage(newPage);
                    setPageSize(newPageSize);
                  },
                }
              : false
          }
          scroll={{ x: 1100 }}
        />

        <style jsx global>{`
          .trs2-table {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 0;
            overflow: hidden;
          }
          [data-theme='dark'] .trs2-table {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          .trs2-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-500) !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 9px 14px !important;
            border-bottom: 1px solid var(--border-slate-200) !important;
          }
          [data-theme='dark'] .trs2-table .ant-table-thead > tr > th {
            background: #0B0F1A !important;
            color: #94a3b8 !important;
            border-bottom-color: #1F2937 !important;
          }
          .trs2-table .ant-table-thead > tr > th::before { display: none; }
          .trs2-table .ant-table-tbody > tr > td {
            padding: 8px 14px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            font-size: 12.5px;
          }
          [data-theme='dark'] .trs2-table .ant-table-tbody > tr > td {
            background: #0B0F1A !important;
            border-bottom-color: #1F2937 !important;
          }
          .trs2-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .trs2-table .ant-table-tbody > tr:hover > td {
            background: #161B22 !important;
          }
          .trs2-table .ant-pagination { margin: 12px 0 !important; padding: 0 14px; }

          .trs2-ticket-id {
            display: inline-block;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 10.5px;
            font-weight: 700;
            color: #1d4ed8;
            background: rgba(59,130,246,0.08);
            border: 1px solid rgba(59,130,246,0.18);
            padding: 1px 6px;
            border-radius: 4px;
            width: fit-content;
            letter-spacing: -0.01em;
          }
          [data-theme='dark'] .trs2-ticket-id {
            background: rgba(59,130,246,0.16);
            border-color: rgba(59,130,246,0.32);
            color: #93c5fd;
          }
          .trs2-ticket-title {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.01em !important;
            line-height: 1.4 !important;
          }
          [data-theme='dark'] .trs2-ticket-title { color: #f1f5f9 !important; }

          .trs2-project-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-slate-50);
            padding: 3px 8px 3px 4px;
            border-radius: 6px;
            border: 1px solid var(--border-slate-200);
            max-width: 100%;
          }
          [data-theme='dark'] .trs2-project-chip { background: #111720; border-color: #2d3748; }
          .trs2-project-code-tag {
            margin: 0 !important;
            font-size: 9.5px !important;
            font-weight: 800 !important;
            background: var(--bg-pure-white) !important;
            border: 1px solid var(--border-slate-200) !important;
            color: #1d4ed8 !important;
            border-radius: 4px !important;
            padding: 0 6px !important;
            letter-spacing: 0.02em !important;
          }
          [data-theme='dark'] .trs2-project-code-tag { background: #0f1419 !important; border-color: #2d3748 !important; color: #93c5fd !important; }
          .trs2-project-name {
            font-size: 11.5px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
          }
          [data-theme='dark'] .trs2-project-name { color: #cbd5e1 !important; }

          .trs2-date-cell { display: flex; flex-direction: column; gap: 1px; }
          .trs2-date-primary { font-size: 11.5px !important; font-weight: 700 !important; color: var(--text-slate-700) !important; font-variant-numeric: tabular-nums; }
          .trs2-date-secondary { font-size: 10.5px !important; color: var(--text-slate-400) !important; font-weight: 500; }
          [data-theme='dark'] .trs2-date-primary { color: #cbd5e1 !important; }

          .trs2-actor-cell { display: inline-flex; align-items: center; gap: 8px; }
          .trs2-actor-avatar {
            background: #475569 !important;
            color: #fff !important;
            font-weight: 800 !important;
            font-size: 10px !important;
            flex-shrink: 0;
          }
          .trs2-actor-name {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          [data-theme='dark'] .trs2-actor-name { color: #cbd5e1 !important; }

          .trs2-retention-cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
          .trs2-retention-line { display: inline-flex; align-items: baseline; gap: 6px; }
          .trs2-retention-days {
            font-size: 13px;
            font-weight: 800;
            color: #b45309;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.015em;
          }
          .trs2-retention-days.urgent { color: #b91c1c; }
          [data-theme='dark'] .trs2-retention-days { color: #fbbf24; }
          [data-theme='dark'] .trs2-retention-days.urgent { color: #fca5a5; }
          .trs2-retention-label {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-slate-500);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .trs2-action-cell { display: inline-flex; align-items: center; justify-content: flex-end; gap: 2px; }

          .trs2-empty {
            padding: 56px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
          }
          .trs2-empty-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-400);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            margin-bottom: 6px;
          }
          .trs2-empty-title { font-size: 14px !important; font-weight: 700 !important; color: var(--text-slate-700) !important; }
          .trs2-empty-sub { font-size: 12px !important; color: var(--text-slate-500) !important; max-width: 320px; line-height: 1.5; }
        `}</style>
      </TicketLifecycleShell>
    </MainLayout>
  );
}
