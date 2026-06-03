"use client";

import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Space,
  Typography,
  Tooltip,
  notification,
  Popconfirm,
  Select,
  Table,
  Input,
  Segmented,
  Skeleton,
  Avatar,
  App,
  theme as antdTheme,
  ConfigProvider,
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
  AppstoreOutlined,
  UnorderedListOutlined,
  GlobalOutlined,
  LockOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import {
  useBuckets,
  useDeleteBucket,
  useMoveBucketToSprint,
  useMoveBucketToBacklog,
  bucketKeys,
} from "@/hooks/useBuckets";
import { CreateBucketModal } from "./CreateBucketModal";
import { MoveToSprintAction } from "./MoveToSprintAction";
import type { Bucket } from "@/services/bucketService";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useTheme } from "@/context/ThemeContext";

const { Title, Text } = Typography;
const { Option } = Select;

type ViewMode = "grid" | "table";

const PALETTE_FALLBACK = "#8b5cf6";

// Lightweight initials helper for avatar fallbacks
const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function BucketManagementPage() {
  const { theme } = useTheme();
  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canCreateTicketBucket, canUpdateTicketBucket, canDeleteTicketBucket } = usePermission();

  // State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "shared" | "private">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);



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

  const allBuckets = bucketsData || [];

  const buckets = useMemo(
    () =>
      allBuckets.filter((bucket) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          bucket.name.toLowerCase().includes(q) ||
          (bucket.description?.toLowerCase().includes(q) ?? false);
        const matchesType =
          typeFilter === "all"
            ? true
            : typeFilter === "shared"
              ? bucket.isShared
              : !bucket.isShared;
        return matchesSearch && matchesType;
      }),
    [allBuckets, searchQuery, typeFilter]
  );


  // Aggregate KPIs use the unfiltered list for true totals
  const kpis = useMemo(() => {
    const totalTickets = allBuckets.reduce(
      (acc, b) => acc + ((b as any)._count?.tickets || 0),
      0
    );
    const publicCount = allBuckets.filter((b) => b.isShared).length;
    const privateCount = allBuckets.length - publicCount;
    const collaborators = allBuckets.reduce(
      (acc, b) => acc + ((b as any)._count?.members || b.members?.length || 0),
      0
    );
    const crossProject = allBuckets.filter((b) => !b.project).length;
    return {
      hubs: allBuckets.length,
      tickets: totalTickets,
      publicCount,
      privateCount,
      collaborators,
      crossProject,
    };
  }, [allBuckets]);

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
    } catch (error) {
      console.error("Error deleting bucket:", error);
    }
  };
  const handleView = (bucketId: string) => {
    router.push(`/tickets/buckets/${bucketId}`);
  };
  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingBucket(null);
  };
  const handleModalSuccess = () => {
    handleModalClose();
    refetch();
  };
  const resetFilters = () => {
    setSelectedProject(null);
    setSearchQuery("");
    setTypeFilter("all");
  };

  // ───────────────────────────── Grid card ─────────────────────────────
  const BucketCard = ({ bucket }: { bucket: Bucket }) => {
    const accent = bucket.color || PALETTE_FALLBACK;
    const ticketCount = (bucket as any)._count?.tickets || 0;
    const memberCount =
      (bucket as any)._count?.members || bucket.members?.length || 0;
    const owner = bucket.createdBy;

    return (
      <div
        className="bh-card"
        onClick={() => {
          if (ticketCount > 0) handleView(bucket.id);
        }}
        style={{ ["--accent" as any]: accent, cursor: ticketCount > 0 ? 'pointer' : 'default' }}
      >
        <div className="bh-card-accent" />

        <div className="bh-card-head">
          <div className="bh-card-icon">
            <FolderOutlined style={{ fontSize: 18, color: accent }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="bh-card-title-row">
              <Text className="bh-card-title" ellipsis={{ tooltip: bucket.name }}>
                {bucket.name}
              </Text>
              {bucket.userRole === "owner" && (
                <Tooltip title="You own this hub">
                  <CrownOutlined className="bh-card-crown" />
                </Tooltip>
              )}
            </div>
            <div className="bh-card-sub">
              {bucket.isShared ? (
                <span className="bh-pill bh-pill-public">
                  <GlobalOutlined style={{ fontSize: 9 }} /> Public
                </span>
              ) : (
                <span className="bh-pill bh-pill-private">
                  <LockOutlined style={{ fontSize: 9 }} /> Private
                </span>
              )}
              {bucket.project ? (
                <span className="bh-pill bh-pill-project">
                  <ProjectOutlined style={{ fontSize: 9 }} />
                  <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bucket.project.name}
                  </span>
                </span>
              ) : (
                <span className="bh-pill bh-pill-cross">Cross-Project</span>
              )}
            </div>
          </div>
        </div>

        <div className="bh-card-desc">
          {bucket.description ? (
            <Text className="bh-card-desc-text" ellipsis={{ tooltip: bucket.description }}>
              {bucket.description}
            </Text>
          ) : (
            <Text className="bh-card-desc-empty">No description provided</Text>
          )}
        </div>

        <div className="bh-card-stats">
          <div className="bh-card-stat">
            <FileTextOutlined className="bh-card-stat-icon" />
            <div>
              <Text className="bh-card-stat-value">{ticketCount}</Text>
              <Text className="bh-card-stat-label">Tickets</Text>
            </div>
          </div>
          <div className="bh-card-stat-divider" />
          <div className="bh-card-stat">
            <TeamOutlined className="bh-card-stat-icon" />
            <div>
              <Text className="bh-card-stat-value">{memberCount}</Text>
              <Text className="bh-card-stat-label">Members</Text>
            </div>
          </div>
        </div>

        <div className="bh-card-foot">
          <div className="bh-card-owner">
            <Avatar
              size={22}
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {initialsOf(owner?.name)}
            </Avatar>
            <Text className="bh-card-owner-name" ellipsis>
              {owner?.name || "—"}
            </Text>
          </div>

          <div className="bh-card-actions" onClick={(e) => e.stopPropagation()}>
            {canUpdateTicketBucket && (
              <Tooltip title="Configure">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  className="bh-icon-btn"
                  onClick={() => handleEdit(bucket)}
                />
              </Tooltip>
            )}
            <MoveToSprintAction
              bucket={bucket}
              onMove={(sprintId) =>
                moveBucketToSprint.mutate(
                  { bucketId: bucket.id, sprintId },
                  {
                    onSuccess: (result) => {
                      if (result.movedCount > 0) {
                        message.success(`Ticket added to sprint successfully`);
                      } else {
                        message.info("This hub has no tickets to move");
                      }
                    },
                    onError: (err: any) => {
                      message.error(err.message || "Movement failed");
                    }
                  }
                )
              }
              loading={
                moveBucketToSprint.isPending &&
                moveBucketToSprint.variables?.bucketId === bucket.id
              }
              disabled={ticketCount === 0}
            />
            <Popconfirm
              title="Move to Backlog"
              description="Move all tickets back to the backlog?"
              onConfirm={(e) => {
                e?.stopPropagation();
                moveBucketToBacklog.mutate(bucket.id, {
                  onSuccess: (result) => {
                    if (result.movedCount > 0) {
                      message.success(`Ticket removed from sprint successfully`);
                    } else {
                      message.info("This hub has no tickets to move");
                    }
                  },
                  onError: (err: any) => {
                    message.error(err.message || "Movement failed");
                  }
                });
              }}
              okText="Move"
              cancelText="Cancel"
            >
              <Button
                type="text"
                size="small"
                icon={<RollbackOutlined />}
                className="bh-icon-btn"
                loading={
                  moveBucketToBacklog.isPending &&
                  moveBucketToBacklog.variables === bucket.id
                }
                disabled={ticketCount === 0}
              />
            </Popconfirm>
            {canDeleteTicketBucket && (
              <Popconfirm
                title="Decommission Hub"
                description="This permanently removes the hub."
                onConfirm={() => handleDelete(bucket.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="bh-icon-btn bh-icon-btn-danger"
                  loading={
                    deleteBucket.isPending &&
                    deleteBucket.variables === bucket.id
                  }
                />
              </Popconfirm>
            )}
            <Button
              type="text"
              size="small"
              icon={<ArrowRightOutlined />}
              className="bh-icon-btn bh-icon-btn-go"
              onClick={() => handleView(bucket.id)}
              disabled={ticketCount === 0}
            />
          </div>
        </div>
      </div>
    );
  };

  // ───────────────────────────── Table columns ─────────────────────────────
  const columns = [
    {
      title: "REPOSITORY",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Bucket) => {
        const accent = record.color || PALETTE_FALLBACK;
        return (
          <Space size="middle">
            <div
              className="bh-row-icon"
              style={{
                background: `${accent}10`,
                border: `1px solid ${accent}26`,
              }}
            >
              <FolderOutlined style={{ fontSize: 14, color: accent }} />
            </div>
            <div>
              <Text strong className="bh-row-title">
                {text}
              </Text>
              {record.description && (
                <div className="bh-row-desc">
                  <Text ellipsis style={{ fontSize: 11, color: "var(--text-slate-500)" }}>
                    {record.description}
                  </Text>
                </div>
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: "VISIBILITY",
      dataIndex: "isShared",
      key: "visibility",
      width: 130,
      render: (isShared: boolean) =>
        isShared ? (
          <span className="bh-pill bh-pill-public">
            <GlobalOutlined style={{ fontSize: 9 }} /> Public Hub
          </span>
        ) : (
          <span className="bh-pill bh-pill-private">
            <LockOutlined style={{ fontSize: 9 }} /> Private
          </span>
        ),
    },
    {
      title: "CONNECTED PROJECT",
      dataIndex: "project",
      key: "project",
      width: 220,
      render: (project: any) =>
        project ? (
          <span className="bh-pill bh-pill-project">
            <ProjectOutlined style={{ fontSize: 9 }} />
            {project.name}
          </span>
        ) : (
          <span className="bh-pill bh-pill-cross">Cross-Project</span>
        ),
    },
    {
      title: "ALLOCATION",
      key: "stats",
      width: 200,
      render: (_: any, record: Bucket) => (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Tooltip title="Tickets Allocated">
            <div className="bh-row-stat">
              <FileTextOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
              <Text className="bh-row-stat-value">
                {(record as any)._count?.tickets || 0}
              </Text>
            </div>
          </Tooltip>
          {record.isShared && (
            <Tooltip title="Collaborators">
              <div className="bh-row-stat" style={{ borderLeft: "1px solid var(--border-slate-100)", paddingLeft: 14 }}>
                <TeamOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
                <Text className="bh-row-stat-value">
                  {(record as any)._count?.members || record.members?.length || 0}
                </Text>
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "OWNER",
      key: "owner",
      width: 180,
      render: (_: any, record: Bucket) => {
        const accent = record.color || PALETTE_FALLBACK;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              size={24}
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {initialsOf(record.createdBy?.name)}
            </Avatar>
            <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }} ellipsis>
              {record.createdBy?.name || "—"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right" as const,
      width: 160,
      render: (_: any, record: Bucket) => (
        <Space size={2} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={record._count?.tickets === 0 ? "No tickets to view" : "Deep Dive"}>
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: 14 }} />}
              onClick={() => handleView(record.id)}
              className="saas-action-btn"
              disabled={record._count?.tickets === 0}
            />
          </Tooltip>
          {canUpdateTicketBucket && (
            <Tooltip title="Configure">
              <Button
                type="text"
                icon={<EditOutlined style={{ fontSize: 14 }} />}
                onClick={() => handleEdit(record)}
                className="saas-action-btn"
              />
            </Tooltip>
          )}
          <MoveToSprintAction
            bucket={record}
            onMove={(sprintId) =>
              moveBucketToSprint.mutate(
                { bucketId: record.id, sprintId },
                {
                  onSuccess: (result) => {
                    if (result.movedCount > 0) {
                      message.success(`Ticket added to sprint successfully`);
                    } else {
                      message.info("This hub has no tickets to move");
                    }
                  },
                  onError: (err: any) => {
                    message.error(err.message || "Movement failed");
                  }
                }
              )
            }
            loading={
              moveBucketToSprint.isPending &&
              moveBucketToSprint.variables?.bucketId === record.id
            }
            disabled={record._count?.tickets === 0}
          />
          <Popconfirm
            title="Move to Backlog"
            description="Move all tickets in this hub back to the backlog?"
            onConfirm={(e) => {
              e?.stopPropagation();
              moveBucketToBacklog.mutate(record.id, {
                onSuccess: (result) => {
                  if (result.movedCount > 0) {
                    message.success(`Ticket removed from sprint successfully`);
                  } else {
                    message.info("This hub has no tickets to move");
                  }
                },
                onError: (err: any) => {
                  message.error(err.message || "Movement failed");
                }
              });
            }}
            okText="Move"
            cancelText="Cancel"
          >
            <Button
              type="text"
              icon={<RollbackOutlined style={{ fontSize: 14 }} />}
              loading={
                moveBucketToBacklog.isPending &&
                moveBucketToBacklog.variables === record.id
              }
              className="saas-action-btn"
              disabled={record._count?.tickets === 0}
            />
          </Popconfirm>
          {canDeleteTicketBucket && (
            <Popconfirm
              title="Decommission Hub"
              description="Proceed with hard delete?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                loading={deleteBucket.isPending && deleteBucket.variables === record.id}
                className="saas-action-btn"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ───────────────────────────── Render ─────────────────────────────
  return (
    <div className="bh-page">
      {/* {contextHolder} */}

      <TimeTrackingHeader
        style={{ padding: "9.5px 32px" }}
        icon={<FolderOpenOutlined style={{ fontSize: 20, color: "#8b5cf6" }} />}
        title="Buckets Hub"
        description="Strategic task organization and cross-project categorization"
        extra={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={async () => {
                setIsRefreshing(true);
                await queryClient.invalidateQueries({ queryKey: bucketKeys.all });
                setIsRefreshing(false);
                message.success("Buckets refreshed");
              }}
              loading={isLoading && !isRefreshing}
              className="bh-header-btn"
              style={{ width: 38, padding: 0 }}
            />
            {canCreateTicketBucket && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                className="bh-create-btn"
              >
                Create New Bucket
              </Button>
            )}
          </div>
        }
      />

      <div className="bh-body">
        {/* ── KPI ribbon ───────────────────────────────────────────── */}
        <div className="bh-kpi-ribbon">
          <div className="bh-kpi bh-kpi-purple">
            <div className="bh-kpi-icon">
              <FolderOpenOutlined />
            </div>
            <div className="bh-kpi-meta">
              <Text className="bh-kpi-value">{kpis.hubs}</Text>
              <Text className="bh-kpi-label">Total Hubs</Text>
            </div>
          </div>

          <div className="bh-kpi bh-kpi-emerald">
            <div className="bh-kpi-icon">
              <GlobalOutlined />
            </div>
            <div className="bh-kpi-meta">
              <Text className="bh-kpi-value">{kpis.publicCount}</Text>
              <Text className="bh-kpi-label">Public</Text>
            </div>
          </div>

          <div className="bh-kpi bh-kpi-slate">
            <div className="bh-kpi-icon">
              <LockOutlined />
            </div>
            <div className="bh-kpi-meta">
              <Text className="bh-kpi-value">{kpis.privateCount}</Text>
              <Text className="bh-kpi-label">Private</Text>
            </div>
          </div>

          <div className="bh-kpi bh-kpi-blue">
            <div className="bh-kpi-icon">
              <FileTextOutlined />
            </div>
            <div className="bh-kpi-meta">
              <Text className="bh-kpi-value">{kpis.tickets}</Text>
              <Text className="bh-kpi-label">Tickets Allocated</Text>
            </div>
          </div>

          <div className="bh-kpi bh-kpi-amber">
            <div className="bh-kpi-icon">
              <TeamOutlined />
            </div>
            <div className="bh-kpi-meta">
              <Text className="bh-kpi-value">{kpis.collaborators}</Text>
              <Text className="bh-kpi-label">Collaborators</Text>
            </div>
          </div>

          <div className="bh-kpi bh-kpi-rose">
            <div className="bh-kpi-icon">
              <ThunderboltOutlined />
            </div>
            <div className="bh-kpi-meta">
              <Text className="bh-kpi-value">{kpis.crossProject}</Text>
              <Text className="bh-kpi-label">Cross-Project</Text>
            </div>
          </div>
        </div>

        {/* ── Control bar ───────────────────────────────────────────── */}
        <ConfigProvider
          theme={{
            algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              colorBgContainer: theme === 'dark' ? '#161B22' : '#ffffff',
              colorText: theme === 'dark' ? '#F1F5F9' : '#1E293B',
            }
          }}
        >
          <div className="bh-control-bar">
            <div className="bh-control-bar-left">
              <div className="bh-filter-select-wrap">
                <ProjectOutlined style={{ fontSize: 12, color: "var(--text-slate-400)" }} />
                <Select
                  placeholder="All Projects"
                  variant="borderless"
                  style={{ width: 170, fontSize: 12, fontWeight: 700 }}
                  allowClear
                  value={selectedProject}
                  onChange={setSelectedProject}
                  popupMatchSelectWidth={false}
                >
                  {projects?.map((project: any) => (
                    <Option key={project.value} value={project.value}>
                      <Text style={{ fontSize: 11, fontWeight: 600 }}>{project.label}</Text>
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="bh-segmented-wrap">
                <FilterOutlined style={{ fontSize: 12, color: "var(--text-slate-400)" }} />
                <Segmented
                  size="small"
                  value={typeFilter}
                  onChange={(v) => setTypeFilter(v as any)}
                  options={[
                    { label: "All", value: "all" },
                    {
                      label: (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <GlobalOutlined style={{ fontSize: 10 }} /> Public
                        </span>
                      ),
                      value: "shared",
                    },
                    {
                      label: (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <LockOutlined style={{ fontSize: 10 }} /> Private
                        </span>
                      ),
                      value: "private",
                    },
                  ]}
                />
              </div>

              {(searchQuery || selectedProject || typeFilter !== "all") && (
                <Button
                  size="small"
                  type="text"
                  icon={<ReloadOutlined style={{ fontSize: 11 }} />}
                  onClick={resetFilters}
                  className="bh-reset-btn"
                >
                  RESET
                </Button>
              )}
            </div>

            <div className="bh-control-bar-right">
              <div className={`bh-search-box ${searchQuery ? "active" : ""}`}>
                <SearchOutlined
                  style={{
                    color: searchQuery ? "#8b5cf6" : "var(--text-slate-400)",
                    fontSize: 13,
                  }}
                />
                <Input
                  placeholder="Search hub..."
                  variant="borderless"
                  style={{ fontSize: 12, fontWeight: 600, padding: 0, background: 'transparent' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                />
              </div>

              <Segmented
                value={viewMode}
                onChange={(v) => setViewMode(v as ViewMode)}
                className="bh-view-toggle"
                options={[
                  {
                    label: (
                      <Tooltip title="Grid view">
                        <AppstoreOutlined />
                      </Tooltip>
                    ),
                    value: "grid",
                  },
                  {
                    label: (
                      <Tooltip title="Table view">
                        <UnorderedListOutlined />
                      </Tooltip>
                    ),
                    value: "table",
                  },
                ]}
              />
            </div>
          </div>
        </ConfigProvider>
        {/* ── Content ───────────────────────────────────────────────── */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="bh-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bh-card bh-card-skeleton">
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : (
            <Card styles={{ body: { padding: 16 } }} className="bh-table-shell">
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          )
        ) : buckets.length === 0 ? (
          <div className="bh-empty">
            <div className="bh-empty-illust">
              <FolderOpenOutlined />
              <span className="bh-empty-illust-glow" />
            </div>
            <Title level={4} className="bh-empty-title">
              {allBuckets.length === 0
                ? "No buckets yet"
                : "No matches for these filters"}
            </Title>
            <Text className="bh-empty-sub">
              {allBuckets.length === 0
                ? "Organize tickets across projects with collaborative hubs."
                : "Try adjusting the visibility, project, or search query."}
            </Text>
            <Space size={12} style={{ marginTop: 18 }}>
              {allBuckets.length === 0 ? (
                canCreateTicketBucket && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    className="bh-create-btn"
                  >
                    Create your first bucket
                  </Button>
                )
              ) : (
                <Button onClick={resetFilters} className="bh-header-btn">
                  Reset filters
                </Button>
              )}
            </Space>
          </div>
        ) : viewMode === "grid" ? (
          <div className="bh-grid">
            {buckets.map((bucket) => (
              <BucketCard key={bucket.id} bucket={bucket} />
            ))}
          </div>
        ) : (
          <Card styles={{ body: { padding: 0 } }} className="bh-table-shell">
            <Table
              dataSource={buckets}
              columns={columns}
              loading={false}
              rowKey="id"
              className="bh-table"
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                size: "small",
                showTotal: (total) => (
                  <Text className="bh-pagination-total">{total} HUBS FOUND</Text>
                ),
                style: { padding: "12px 20px", margin: 0 },
              }}
              onRow={(record) => ({
                onClick: () => {
                  if ((record as any)._count?.tickets > 0) {
                    handleView(record.id);
                  }
                }
              })}
            />
          </Card>
        )}

        <CreateBucketModal
          open={createModalOpen}
          bucket={editingBucket}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />

        <style jsx global>{`
          /* ────────────────────────────── Page shell ────────────────────────────── */
          .bh-page {
            margin: 0 -24px;
            background: var(--bg-pure-white);
            height: calc(100vh - 64px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .bh-body {
            padding: 10px 32px 32px 32px;
            flex: 1;
            overflow-y: auto;
          }

          /* ────────────────────────────── Header buttons ────────────────────────── */
          .bh-header-btn {
            height: 38px !important;
            border-radius: 8px !important;
            font-weight: 600;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .bh-create-btn {
            height: 38px !important;
            border-radius: 8px !important;
            padding: 0 18px !important;
            font-weight: 700;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 8px;
            letter-spacing: -0.01em;
            background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.18);
            transition: all 0.2s ease;
          }
          .bh-create-btn:hover {
            transform: translateY(-1px);
            background: linear-gradient(135deg, #9b6dfd 0%, #7c3aed 100%) !important;
          }

          /* ────────────────────────────── KPI ribbon ────────────────────────────── */
          .bh-kpi-ribbon {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 12px;
          }
          @media (max-width: 1280px) {
            .bh-kpi-ribbon { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (max-width: 720px) {
            .bh-kpi-ribbon { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          .bh-kpi {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            padding: 14px 16px;
            overflow: hidden;
            transition: transform 0.18s ease, box-shadow 0.2s ease,
              border-color 0.2s ease;
          }
          .bh-kpi::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, var(--kpi-c1) 0%, transparent 60%);
            opacity: 0.06;
            pointer-events: none;
          }
          .bh-kpi:hover {
            transform: translateY(-2px);
            border-color: var(--kpi-c1);
          }
          .bh-kpi-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--kpi-bg);
            border: 1px solid var(--kpi-border);
            color: var(--kpi-c1);
            font-size: 16px;
            flex-shrink: 0;
          }
          .bh-kpi-meta { display: flex; flex-direction: column; min-width: 0; }
          .bh-kpi-value {
            font-size: 22px;
            font-weight: 800;
            line-height: 1;
            color: var(--text-slate-900);
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
          }
          .bh-kpi-label {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-slate-400);
            margin-top: 4px;
          }

          .bh-kpi-purple  { --kpi-c1: #8b5cf6; --kpi-bg: rgba(139,92,246,0.08); --kpi-border: rgba(139,92,246,0.18); }
          .bh-kpi-emerald { --kpi-c1: #10b981; --kpi-bg: rgba(16,185,129,0.08); --kpi-border: rgba(16,185,129,0.18); }
          .bh-kpi-slate   { --kpi-c1: #64748b; --kpi-bg: rgba(100,116,139,0.08); --kpi-border: rgba(100,116,139,0.18); }
          .bh-kpi-blue    { --kpi-c1: #3b82f6; --kpi-bg: rgba(59,130,246,0.08); --kpi-border: rgba(59,130,246,0.18); }
          .bh-kpi-amber   { --kpi-c1: #f59e0b; --kpi-bg: rgba(245,158,11,0.08); --kpi-border: rgba(245,158,11,0.18); }
          .bh-kpi-rose    { --kpi-c1: #f43f5e; --kpi-bg: rgba(244,63,94,0.08);  --kpi-border: rgba(244,63,94,0.18); }

          [data-theme='dark'] .bh-kpi {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }

          /* ────────────────────────────── Control bar ───────────────────────────── */
          .bh-control-bar {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
            margin-bottom: 12px;
          }
          [data-theme='dark'] .bh-control-bar {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }
          .bh-control-bar-left,
          .bh-control-bar-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .bh-filter-select-wrap,
          .bh-segmented-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            background: transparent !important;
            padding: 0 10px;
            border-radius: 8px;
            border: 1px solid var(--border-slate-100);
            height: 36px;
          }
          [data-theme='dark'] .bh-filter-select-wrap,
          [data-theme='dark'] .bh-segmented-wrap {
            background: transparent !important;
            border-color: #374151 !important;
          }
          [data-theme='dark'] .bh-filter-select-wrap .ant-select-selector {
            background: transparent !important;
            border: none !important;
            color: var(--text-slate-900) !important;
          }
          .bh-segmented-wrap .ant-segmented {
            background: transparent !important;
            padding: 0 !important;
          }
          .bh-segmented-wrap .ant-segmented-item-selected {
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08) !important;
            font-weight: 700 !important;
          }

          .bh-search-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: transparent !important;
            padding: 0 12px;
            border-radius: 8px;
            border: 1px solid var(--border-slate-100);
            width: 240px;
            height: 36px;
            transition: all 0.2s ease;
          }

          @media (max-width: 800px) {
            .bh-control-bar {
              flex-wrap: wrap;
              gap: 12px;
              justify-content: center;
            }
            .bh-control-bar-right {
              width: 100%;
              justify-content: center;
              flex-wrap: wrap;
            }
            .bh-search-box {
              flex: 1;
              min-width: 200px;
              max-width: 460px;
            }
          }
          .bh-search-box.active {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08);
          }
          [data-theme='dark'] .bh-search-box {
            background: transparent !important;
            border-color: #374151 !important;
          }

          .bh-view-toggle.ant-segmented {
            background: var(--bg-slate-50) !important;
            padding: 3px !important;
            border-radius: 8px !important;
            border: 1px solid var(--border-slate-100);
          }
          [data-theme='dark'] .bh-view-toggle.ant-segmented {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }
          .bh-view-toggle .ant-segmented-item {
            min-width: 36px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px !important;
          }

          .bh-reset-btn {
            color: #94a3b8 !important;
            font-weight: 800 !important;
            font-size: 10px !important;
            letter-spacing: 0.08em;
            height: 32px;
            border-radius: 6px;
          }

          /* ────────────────────────────── Bucket grid cards ─────────────────────── */
          .bh-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            padding-top: 0;
          }

          .bh-card {
            position: relative;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            border-radius: 14px;
            padding: 16px 16px 12px;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.18s ease, box-shadow 0.22s ease,
              border-color 0.2s ease;
            animation: bhCardIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
            display: flex;
            flex-direction: column;
            min-height: 188px;
          }
          @keyframes bhCardIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          [data-theme='dark'] .bh-card {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }
          .bh-card:hover {
            transform: translateY(-3px);
            border-color: var(--accent);
          }
          .bh-card-accent {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent), var(--accent) 60%, transparent);
            opacity: 0.85;
          }
          .bh-card-glow {
            position: absolute;
            top: -40px;
            right: -40px;
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
            opacity: 0.06;
            pointer-events: none;
            transition: opacity 0.25s ease;
          }
          .bh-card:hover .bh-card-glow { opacity: 0.12; }

          .bh-card-head {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }
          .bh-card-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: color-mix(in srgb, var(--accent) 10%, transparent);
            border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
            flex-shrink: 0;
          }
          .bh-card-title-row {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
          }
          .bh-card-title {
            font-size: 14px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.012em;
            min-width: 0;
            display: block;
          }
          .bh-card-crown {
            color: #f59e0b;
            font-size: 11px;
            flex-shrink: 0;
          }
          .bh-card-sub {
            display: flex;
            gap: 6px;
            margin-top: 6px;
            flex-wrap: wrap;
          }

          .bh-card-desc {
            margin-top: 12px;
            min-height: 32px;
          }
          .bh-card-desc-text {
            font-size: 12px !important;
            color: var(--text-slate-600) !important;
            line-height: 1.5 !important;
          }
          .bh-card-desc-empty {
            font-size: 11px !important;
            color: var(--text-slate-400) !important;
            font-style: italic;
          }

          .bh-card-stats {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 12px;
            margin-top: auto;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            border-radius: 8px;
          }
          [data-theme='dark'] .bh-card-stats {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }
          .bh-card-stat {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
          }
          .bh-card-stat-icon {
            color: #94a3b8;
            font-size: 13px;
          }
          .bh-card-stat-value {
            display: block;
            font-size: 14px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900) !important;
            line-height: 1;
            font-variant-numeric: tabular-nums;
          }
          .bh-card-stat-label {
            font-size: 9px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-slate-400) !important;
            margin-top: 3px;
            display: block;
          }
          .bh-card-stat-divider {
            width: 1px;
            height: 24px;
            background: var(--border-slate-200);
          }
          [data-theme='dark'] .bh-card-stat-divider { background: #374151; }

          .bh-card-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid var(--border-slate-100);
          }
          [data-theme='dark'] .bh-card-foot {
            border-top-color: #1f2937;
          }
          .bh-card-owner {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex: 1;
          }
          .bh-card-owner-name {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: var(--text-slate-700) !important;
            min-width: 0;
            max-width: 140px;
          }
          .bh-card-actions {
            display: flex;
            gap: 2px;
            opacity: 0.5;
            transform: translateX(4px);
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .bh-card:hover .bh-card-actions {
            opacity: 1;
            transform: translateX(0);
          }

          .bh-icon-btn {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            color: var(--text-slate-500) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 0 !important;
            cursor: pointer;
          }
          .bh-icon-btn:hover {
            background: var(--bg-slate-100) !important;
            color: var(--text-slate-900) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          [data-theme='dark'] .bh-icon-btn:hover {
            background: #1f2937 !important;
          }
          .bh-icon-btn-go {
            color: #8b5cf6 !important;
          }
          .bh-icon-btn-go:hover {
            background: rgba(139, 92, 246, 0.1) !important;
            color: #6d28d9 !important;
          }
          .bh-icon-btn-danger:hover {
            background: rgba(244, 63, 94, 0.1) !important;
          }

          .bh-card-skeleton {
            cursor: default;
            min-height: 188px;
          }
          .bh-card-skeleton:hover {
            transform: none;
            box-shadow: none;
            border-color: var(--border-slate-200);
          }

          /* ────────────────────────────── Status pills ──────────────────────────── */
          .bh-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            border-radius: 5px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.4;
            white-space: nowrap;
          }
          .bh-pill-public {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.10), rgba(139, 92, 246, 0.05));
            color: #7c3aed;
            border: 1px solid rgba(139, 92, 246, 0.18);
          }
          .bh-pill-private {
            background: var(--bg-slate-50);
            color: #64748b;
            border: 1px solid var(--border-slate-200);
          }
          .bh-pill-project {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04));
            color: #2563eb;
            border: 1px solid rgba(59, 130, 246, 0.18);
            text-transform: none;
            letter-spacing: 0;
            font-size: 11px;
          }
          .bh-pill-cross {
            background: linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(244, 63, 94, 0.04));
            color: #e11d48;
            border: 1px solid rgba(244, 63, 94, 0.16);
          }
          [data-theme='dark'] .bh-pill-private {
            background: #1f2937 !important;
            border-color: #374151 !important;
            color: #94a3b8 !important;
          }

          /* ────────────────────────────── Empty state ───────────────────────────── */
          .bh-empty {
            background: var(--bg-pure-white);
            border: 1px dashed var(--border-slate-200);
            border-radius: 16px;
            padding: 64px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          [data-theme='dark'] .bh-empty {
            background: #161b22 !important;
            border-color: #1f2937 !important;
          }
          .bh-empty-illust {
            position: relative;
            width: 88px;
            height: 88px;
            border-radius: 22px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.04));
            border: 1px solid rgba(139, 92, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
            color: #8b5cf6;
            font-size: 36px;
          }
          .bh-empty-illust-glow {
            position: absolute;
            inset: -20%;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 60%);
            filter: blur(20px);
            z-index: -1;
            animation: bhPulse 2.4s ease-in-out infinite;
          }
          @keyframes bhPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          .bh-empty-title {
            margin: 0 !important;
            font-size: 18px !important;
            font-weight: 800 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.01em;
          }
          .bh-empty-sub {
            font-size: 13px !important;
            color: var(--text-slate-500) !important;
            max-width: 380px;
            margin-top: 6px;
            line-height: 1.6;
          }

          /* ────────────────────────────── Table view ────────────────────────────── */
          .bh-table-shell {
            border-radius: 12px !important;
            overflow: hidden;
            border: 1px solid var(--border-slate-200) !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          }
          [data-theme='dark'] .bh-table-shell {
            border-color: #1f2937 !important;
            background: #161b22 !important;
          }

          .bh-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            font-weight: 800 !important;
            color: var(--text-slate-500) !important;
            font-size: 10px !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 14px 16px !important;
            white-space: nowrap;
            border-bottom: 1px solid var(--border-slate-200) !important;
            border-radius: 0 !important;
          }
          [data-theme='dark'] .bh-table .ant-table-thead > tr > th {
            background: #1f2937 !important;
            border-bottom-color: #374151 !important;
            color: #94a3b8 !important;
          }
          .bh-table .ant-table-tbody > tr > td {
            padding: 14px 16px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            transition: all 0.18s ease;
          }
          .bh-table .ant-table-tbody > tr {
            cursor: pointer;
          }
          .bh-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .bh-table .ant-table-tbody > tr > td {
            background: #161b22 !important;
            border-bottom-color: #1f2937 !important;
          }
          [data-theme='dark'] .bh-table .ant-table-tbody > tr:hover > td {
            background: #1f2937 !important;
          }

          .bh-row-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .bh-row-title {
            font-size: 13px !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.012em;
          }
          .bh-row-desc {
            margin-top: 2px;
            max-width: 320px;
          }
          .bh-row-stat {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .bh-row-stat-value {
            font-size: 12px !important;
            font-weight: 700 !important;
            color: var(--text-slate-700) !important;
            font-variant-numeric: tabular-nums;
          }

          .bh-pagination-total {
            font-size: 10px !important;
            font-weight: 800 !important;
            color: #94a3b8 !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          /* ────────────────────────────── Action buttons ────────────────────────── */
          .saas-action-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 32px !important;
            height: 32px !important;
            padding: 0 !important;
            border-radius: 8px !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            color: var(--text-slate-500) !important;
            cursor: pointer;
          }
          .saas-action-btn:hover {
            background: var(--bg-slate-100) !important;
            color: var(--text-slate-900) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          [data-theme='dark'] .saas-action-btn:hover {
            background: #1f2937 !important;
          }
        `}</style>
      </div>
    </div>
  );
}
