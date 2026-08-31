"use client";
import NoData from "@/components/common/NoData";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  Input,
  App,
  Skeleton,
  Avatar,
  DatePicker,
  Pagination,
  Dropdown,
  Table,
  Divider,
  Popover,
  Space,
  Segmented,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { SearchableDropdownOption } from "@/components/common/SearchableDropdown";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LockOutlined,
  ProjectOutlined,
  SearchOutlined,
  ReloadOutlined,
  RollbackOutlined,
  DownOutlined,
  FileTextOutlined,
  TeamOutlined,
  CrownOutlined,
  FilterOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UpOutlined,
  UnorderedListOutlined,
  CloseOutlined,
  EllipsisOutlined,
  CaretUpFilled,
  CaretDownFilled,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  RocketOutlined,
  ExpandAltOutlined,
  NumberOutlined,
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
import { BucketManageInlinePanel } from "./BucketManageInlinePanel";
import BucketFilters from "./BucketFilters";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import { QaProjectSwitcher } from "@/components/qa/QaProjectGate";
import BucketService, { type Bucket } from "@/services/bucketService";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";

/* -------------------------------------------------------------------------- */
/*                                Sparkline                                   */
/* -------------------------------------------------------------------------- */

import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Text } = Typography;
const PALETTE_FALLBACK = "#3b82f6";
const CROSS_PROJECT_KEY = "__cross_project__";

const PROJECT_PALETTE = [
  "#0ea5e9",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
];

type VisibilityKey = "all" | "public" | "private";
type SizeKey = "all" | "empty" | "1-10" | "11-20" | "21-30" | "31-50" | "50+";

const SIZE_BUCKETS: { key: SizeKey; label: string; color: string; test: (n: number) => boolean }[] = [
  { key: "all", label: "All Sizes", color: "#64748b", test: () => true },
  { key: "empty", label: "Empty Buckets", color: "#94a3b8", test: (n) => n === 0 },
  { key: "1-10", label: "1 – 10 Tickets", color: "#10b981", test: (n) => n >= 1 && n <= 10 },
  // { key: "11-20", label: "11 – 20 Tickets", color: "#3b82f6", test: (n) => n >= 11 && n <= 20 },
  { key: "21-30", label: "21 – 30 Tickets", color: "#3b82f6", test: (n) => n >= 21 && n <= 30 },
  // { key: "31-50", label: "31 – 50 Tickets", color: "#f59e0b", test: (n) => n >= 31 && n <= 50 },
  { key: "50+", label: "50+ Tickets", color: "#ef4444", test: (n) => n > 50 },
];

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const ColumnTitle: React.FC<{
  icon?: React.ReactNode;
  label: string;
}> = ({ icon, label }) => {
  return (
    <span className="inline-flex items-center gap-1.5 select-none">
      {icon && (
        <span className="dh-col-icon" aria-hidden>
          {icon}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};

const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
  <div className="pp-menu-item">
    <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
    <span className="pp-menu-text">
      <span className="pp-menu-title">{title}</span>
      <span className="pp-menu-desc">{desc}</span>
    </span>
  </div>
);

export default function BucketManagementPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canCreateTicketBucket, canUpdateTicketBucket, canDeleteTicketBucket } = usePermission();

  // ── State ────────────────────────────────────────────────────────
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityKey>("all");
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [defaultExpandSet, setDefaultExpandSet] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<SizeKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedBucketId, setExpandedBucketId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [tableBuckets, setTableBuckets] = useState<Bucket[]>([]);
  const [totalTableBuckets, setTotalTableBuckets] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Data ─────────────────────────────────────────────────────────
  const { data: projects } = useUserProjects();
  const { data: bucketsData, isLoading, refetch } = useBuckets(undefined);
  const allBuckets: Bucket[] = bucketsData || [];

  const deleteBucket = useDeleteBucket();
  const moveBucketToSprint = useMoveBucketToSprint();
  const moveBucketToBacklog = useMoveBucketToBacklog();

  // ── Derived: group by project ────────────────────────────────────
  const bucketsByProject = useMemo(() => {
    const map = new Map<string, { name: string; buckets: Bucket[] }>();
    allBuckets.forEach((b) => {
      const key = b.project?.id || CROSS_PROJECT_KEY;
      const name = b.project?.name || "Cross-Project";
      if (!map.has(key)) map.set(key, { name, buckets: [] });
      map.get(key)!.buckets.push(b);
    });
    return map;
  }, [allBuckets]);

  const projectOrder = useMemo(() => {
    const order: { key: string; name: string }[] = [];
    const seen = new Set<string>();
    (projects || []).forEach((p: any) => {
      if (bucketsByProject.has(p.value)) {
        order.push({ key: p.value, name: p.label });
        seen.add(p.value);
      }
    });
    bucketsByProject.forEach((v, k) => {
      if (!seen.has(k) && k !== CROSS_PROJECT_KEY) {
        order.push({ key: k, name: v.name });
      }
    });
    if (bucketsByProject.has(CROSS_PROJECT_KEY)) {
      order.push({ key: CROSS_PROJECT_KEY, name: "Cross-Project" });
    }
    return order;
  }, [projects, bucketsByProject]);

  // Default-expand first project once
  useEffect(() => {
    if (!defaultExpandSet && projectOrder.length > 0) {
      setExpandedProjects(new Set([projectOrder[0].key]));
      setDefaultExpandSet(true);
    }
  }, [projectOrder, defaultExpandSet]);

  // ── Counts ───────────────────────────────────────────────────────
  const visibilityCounts = useMemo(
    () => ({
      all: allBuckets.length,
      public: allBuckets.filter((b) => b.isShared).length,
      private: allBuckets.filter((b) => !b.isShared).length,
    }),
    [allBuckets]
  );

  const sizeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SIZE_BUCKETS.forEach((s) => {
      counts[s.key] = allBuckets.filter((b) => s.test(b._count?.tickets || 0)).length;
    });
    return counts;
  }, [allBuckets]);

  // ── Filtered list ────────────────────────────────────────────────
  const filteredBuckets = useMemo(() => {
    const sizeDef = SIZE_BUCKETS.find((s) => s.key === sizeFilter)!;
    const rangeStart = dateRange?.[0] ? dateRange[0].startOf("day") : null;
    const rangeEnd = dateRange?.[1] ? dateRange[1].endOf("day") : null;
    return allBuckets.filter((b) => {
      const ticketCount = b._count?.tickets || 0;
      if (visibilityFilter === "public" && !b.isShared) return false;
      if (visibilityFilter === "private" && b.isShared) return false;
      if (selectedProjectKey) {
        const bKey = b.project?.id || CROSS_PROJECT_KEY;
        if (bKey !== selectedProjectKey) return false;
      }
      if (!sizeDef.test(ticketCount)) return false;
      if (ownerFilter && b.createdBy?.id !== ownerFilter) return false;
      if (rangeStart && rangeEnd) {
        const created = dayjs(b.createdAt);
        if (created.isBefore(rangeStart) || created.isAfter(rangeEnd)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inName = b.name.toLowerCase().includes(q);
        const inDesc = b.description?.toLowerCase().includes(q) ?? false;
        if (!inName && !inDesc) return false;
      }
      return true;
    });
  }, [allBuckets, visibilityFilter, selectedProjectKey, sizeFilter, searchQuery, ownerFilter, dateRange]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [visibilityFilter, selectedProjectKey, sizeFilter, searchQuery, ownerFilter, dateRange]);

  const loadTableData = async () => {
    try {
      const pId = selectedProjectKey === "all" ? undefined : selectedProjectKey === "cross-project" ? "null" : (selectedProjectKey || undefined);
      const data = await BucketService.getBuckets(pId, {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
        size: sizeFilter !== "all" ? sizeFilter : undefined,
        owner: ownerFilter !== "all" ? ownerFilter : undefined,
        startDate: dateRange?.[0] ? dateRange[0].toISOString() : undefined,
        endDate: dateRange?.[1] ? dateRange[1].toISOString() : undefined
      });
      setTableBuckets(data?.data || []);
      setTotalTableBuckets(data?.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to load table buckets", error);
    }
  };

  useEffect(() => {
    loadTableData();
  }, [currentPage, pageSize, visibilityFilter, selectedProjectKey, sizeFilter, searchQuery, ownerFilter, dateRange]);

  const metrics = useMemo(() => {
    return {
      total: visibilityCounts.all,
      public: visibilityCounts.public,
      private: visibilityCounts.private,
      tickets: allBuckets.reduce((sum, b) => sum + (b._count?.tickets || 0), 0)
    };
  }, [visibilityCounts, allBuckets]);

  // Unique owners across all buckets, for the Owner dropdown
  const ownerOptions = useMemo<SearchableDropdownOption[]>(() => {
    const seen = new Map<string, { name: string; email?: string; avatarUrl?: string }>();
    allBuckets.forEach((b) => {
      if (b.createdBy?.id && !seen.has(b.createdBy.id)) {
        seen.set(b.createdBy.id, {
          name: b.createdBy.name,
          email: b.createdBy.workEmail,
          avatarUrl: b.createdBy.avatarUrl,
        });
      }
    });
    return Array.from(seen.entries()).map(([id, o]) => ({
      value: id,
      label: o.name || "Unknown",
      description: o.email,
      badge: (
        <Avatar
          src={o.avatarUrl || undefined}
          size={20}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {initialsOf(o.name)}
        </Avatar>
      ),
    }));
  }, [allBuckets]);

  const visibilityOptions = useMemo<SearchableDropdownOption[]>(
    () => [
      {
        value: "public",
        label: "Public",
        badge: (
          <span className="bh2-vis-badge bh2-vis-badge-public">
            <GlobalOutlined style={{ fontSize: 10 }} />
          </span>
        ),
      },
      {
        value: "private",
        label: "Private",
        badge: (
          <span className="bh2-vis-badge bh2-vis-badge-private">
            <LockOutlined style={{ fontSize: 10 }} />
          </span>
        ),
      },
    ],
    []
  );

  // ── Handlers ─────────────────────────────────────────────────────
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
      message.success("Deleted successfully");
      loadTableData();
    } catch (e) {
      console.error("Error deleting bucket:", e);
      message.error("Failed to delete bucket");
    }
  };
  const handleView = (bucketId: string) => router.push(`/tickets/buckets/${bucketId}`);
  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingBucket(null);
  };
  const handleModalSuccess = () => {
    handleModalClose();
    refetch();
    loadTableData();
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), loadTableData()]);
    setTimeout(() => setIsRefreshing(false), 500);
    message.success("Success, buckets refreshed");
  };
  /* The rail's project tree becomes the header's switcher; its size list and
     visibility list become filter options. */
  const projectSwitcherOptions = projectOrder.map((p: any) => ({
    value: p.key,
    label: p.name,
    code: (p.name || '?').slice(0, 3).toUpperCase(),
  }));
  const sizeFilterOptions = SIZE_BUCKETS.filter(s => s.key !== 'all').map(s => ({ value: s.key, label: s.label }));
  const VISIBILITY_SEGMENTS = [
    { k: 'all' as const, label: 'All hubs', icon: <AppstoreOutlined /> },
    { k: 'public' as const, label: 'Public', icon: <GlobalOutlined /> },
    { k: 'private' as const, label: 'Private', icon: <LockOutlined /> },
  ];

  /* ── Banner figures ─────────────────────────────────────────────────── */
  const activeProjectLabel = selectedProjectKey
    ? (projectOrder.find((p: any) => p.key === selectedProjectKey)?.name || 'Project')
    : 'All projects';
  const bannerAccent = metrics.total === 0 ? '#64748b' : metrics.public > 0 ? '#3b82f6' : '#10b981';

  const resetFilters = () => {
    setVisibilityFilter("all");
    setSelectedProjectKey(null);
    setSizeFilter("all");
    setSearchQuery("");
    setOwnerFilter(null);
    setDateRange(null);
  };
  const toggleProject = (key: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeFilterCount =
    (visibilityFilter !== "all" ? 1 : 0) +
    (selectedProjectKey ? 1 : 0) +
    (sizeFilter !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (ownerFilter ? 1 : 0) +
    (dateRange && (dateRange[0] || dateRange[1]) ? 1 : 0);

  const columns: ColumnsType<Bucket> = [
    {
      title: <ColumnTitle icon={<FolderOpenOutlined />} label="Bucket Name" />,
      dataIndex: "name",
      key: "name",
      width: 280,
      fixed: "left",
      render: (text, record) => {
        const accent = record.color || PALETTE_FALLBACK;
        const initial = record.name ? record.name[0].toUpperCase() : "B";
        return (
          <div className="flex items-center gap-3">
            <div className="dh-name-avatar">
              <span style={{ fontSize: 13, fontWeight: 700 }}>{initial}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-semibold truncate" style={{ color: "var(--text-slate-800)" }}>
                {text}
                {record.userRole === "owner" && (
                  <Tooltip title="You own this bucket">
                    <CrownOutlined style={{ fontSize: 11, marginLeft: 6, color: "#f59e0b" }} />
                  </Tooltip>
                )}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: <ColumnTitle icon={<ProjectOutlined />} label="Project" />,
      key: "project",
      width: 140,
      render: (_, record) => {
        if (record.project) {
          const accent = record.color || PALETTE_FALLBACK;
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] bmp-project-tag font-semibold truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
              {record.project.name}
            </span>
          );
        }
        return <span className="text-[12.5px] text-slate-400 italic">Cross-Project</span>;
      },
    },
    {
      title: <ColumnTitle icon={<GlobalOutlined />} label="Visibility" />,
      key: "visibility",
      width: 100,
      render: (_, record) => {
        return record.isShared ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bmp-tag-public">
            <GlobalOutlined /> Public
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bmp-tag-private">
            <LockOutlined /> Private
          </span>
        );
      },
    },
    {
      title: <ColumnTitle icon={<TagOutlined />} label="Tickets" />,
      key: "tickets",
      width: 100,
      render: (_, record) => {
        const ticketCount = record._count?.tickets || 0;
        return (
          <span className="text-[12.5px] font-medium" style={{ color: ticketCount > 0 ? "var(--text-slate-700)" : "var(--text-slate-400)" }}>
            {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
          </span>
        );
      },
    },
    {
      title: <ColumnTitle icon={<UserOutlined />} label="Created By" />,
      key: "createdBy",
      width: 140,
      render: (_, record) => {
        const owner = record.createdBy;
        if (!owner) return <span className="text-[12.5px] text-slate-400">Unknown</span>;
        const ownerName = owner.name?.trim() || "Unknown";
        const ownerInitials = (ownerName || "?")
          .split(" ")
          .map((n: string) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <div className="flex items-center gap-2">
            {owner.avatarUrl ? (
              <Avatar src={owner.avatarUrl} size={22} className="shrink-0 bmp-owner-avatar font-semibold text-[10px]" />
            ) : (
              <Avatar size={22} className="shrink-0 bmp-owner-avatar font-semibold text-[10px]">
                {ownerInitials}
              </Avatar>
            )}
            <span className="text-[12.5px] bmp-table-text-primary truncate">{ownerName.split(" ")[0]}</span>
          </div>
        );
      },
    },
    {
      title: <ColumnTitle icon={<CalendarOutlined />} label="Created" />,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => (
        <Tooltip title={dayjs(date).format("MMM D, YYYY h:mm A")}>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium bmp-table-text-primary">{dayjs(date).format("MMM D, YYYY")}</span>
            <span className="text-[10.5px] text-slate-400">{dayjs(date).format("h:mm A")}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: <ColumnTitle label="Actions" />,
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Bucket">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            />
          </Tooltip>
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            overlayClassName="pp-action-pop"
            menu={{
              items: [
                {
                  key: "view",
                  label: menuLabel("View bucket", "Open bucket details", <EyeOutlined />, "#3b82f6", "rgba(59,130,246,0.12)"),
                  onClick: () => handleView(record.id),
                },
                ...(canUpdateTicketBucket
                  ? [
                    {
                      key: "edit",
                      label: menuLabel("Configure", "Edit bucket settings", <EditOutlined />, "#64748b", "rgba(100,116,139,0.12)"),
                      onClick: () => handleEdit(record),
                    },
                  ]
                  : []),
                { type: "divider" as const },
                {
                  key: "move-sprint",
                  label: (
                    <div onClick={(e) => e.stopPropagation()}>
                      <MoveToSprintAction
                        bucket={record}
                        customTrigger={menuLabel("Move to Sprint", "Move tickets to sprint", <RocketOutlined />, "#8b5cf6", "rgba(139,92,246,0.12)")}
                        onMove={(sprintId) =>
                          moveBucketToSprint.mutate(
                            { bucketId: record.id, sprintId },
                            {
                              onSuccess: (result) => {
                                if (result.movedCount > 0)
                                  message.success("Tickets added to sprint");
                                else message.info("This bucket has no tickets to move");
                              },
                              onError: (err: any) =>
                                message.error(err.message || "Movement failed"),
                            }
                          )
                        }
                        loading={
                          moveBucketToSprint.isPending &&
                          moveBucketToSprint.variables?.bucketId === record.id
                        }
                        disabled={(record._count?.tickets || 0) === 0}
                      />
                    </div>
                  ),
                },
                {
                  key: "move-backlog",
                  label: menuLabel("Move to Backlog", "Move all tickets back", <RollbackOutlined />, "#64748b", "rgba(100,116,139,0.12)"),
                  disabled: (record._count?.tickets || 0) === 0,
                  onClick: () => {
                    import("antd").then(({ Modal }) => {
                      Modal.confirm({
                        title: "Move to backlog",
                        content: "Move all tickets back to backlog?",
                        onOk: () => {
                          moveBucketToBacklog.mutate(record.id, {
                            onSuccess: (result) => {
                              if (result.movedCount > 0)
                                message.success("Tickets removed from sprint");
                              else message.info("This bucket has no tickets to move");
                            },
                            onError: (err: any) =>
                              message.error(err.message || "Movement failed"),
                          });
                        },
                      });
                    });
                  },
                },
                ...(canDeleteTicketBucket
                  ? [
                    { type: "divider" as const },
                    {
                      key: "delete",
                      danger: true,
                      label: menuLabel("Delete bucket", "Remove this bucket", <DeleteOutlined />, "#ef4444", "rgba(239,68,68,0.12)"),
                      onClick: () => handleDelete(record.id),
                    },
                  ]
                  : []),
              ],
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined />}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            />
          </Dropdown>
        </div>
      ),
    },
  ];

  const renderTable = () => {
    return (
      <div className="bh2-table-shell">
        <Table
          columns={columns}
          dataSource={tableBuckets}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          className="premium-table dh-table"
          tableLayout="fixed"
          expandedRowRender={(record) => (
            <BucketManageInlinePanel
              bucketId={record.id}
              accent={record.color || PALETTE_FALLBACK}
              onClose={() => setExpandedBucketId(null)}
              nested
            />
          )}
          expandedRowKeys={expandedBucketId ? [expandedBucketId] : []}
          onExpand={(expanded, record) => {
            setExpandedBucketId(expanded ? record.id : null);
          }}
          onRow={(record) => ({
            onClick: () => {
              setExpandedBucketId((prev) => (prev === record.id ? null : record.id));
            },
            className: "cursor-pointer group",
          })} locale={{ emptyText: <NoData /> }}
        />
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="bh2-page">
      <div className="bh2-shell-wrap">
        <div className="bh2-shell">
          {/* ── Main ──────────────────────────────────────────────── */}
          <main className="bh2-main">
            {/* ── Header row — project, search, filters, view controls ── */}
            <div className="bh2-toolbar saas-header-container sc-header">
              <QaProjectSwitcher
                projects={projectSwitcherOptions}
                value={selectedProjectKey}
                onChange={(key: string | null) => setSelectedProjectKey(key)}
                placeholder="All projects"
              />

              <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

              <div className="sc-header-controls">
                <Input
                  placeholder="Quick search bucket name or description..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                  className="saas-input"
                  style={{ maxWidth: 280, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                />

                <Space.Compact className="ticket-filter-group">
                  <Popover
                    content={
                      <BucketFilters
                        filters={{ visibility: visibilityFilter, owner: ownerFilter || undefined, size: sizeFilter, dateRange: dateRange as any }}
                        onFilterChange={(key: any, val: any) => {
                          if (key === 'visibility') setVisibilityFilter((val as VisibilityKey) || 'all');
                          if (key === 'owner') setOwnerFilter(val || null);
                          if (key === 'size') setSizeFilter((val as SizeKey) || 'all');
                          if (key === 'dateRange') setDateRange(val);
                        }}
                        onReset={resetFilters}
                        visibilityOptions={visibilityOptions as any}
                        ownerOptions={ownerOptions as any}
                        sizeOptions={sizeFilterOptions}
                      />
                    }
                    trigger="click"
                    open={isFilterPanelOpen}
                    onOpenChange={setIsFilterPanelOpen}
                    placement="bottomLeft"
                    overlayClassName="tf-popover-overlay"
                    styles={{ body: { padding: 0 } }}
                  >
                    <Button
                      icon={<FilterOutlined />}
                      className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                      style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                    >
                      Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                  </Popover>
                  <Button
                    icon={<ExpandAltOutlined />}
                    style={{ height: 30 }}
                    aria-label="Expand filters"
                    onClick={() => setIsFilterRowOpen((v) => !v)}
                  />
                </Space.Compact>
              </div>

              {/* Right side — the visibility switch that used to live in the
                  rail, then the view controls. */}
              <Space size={10} className="sc-header-right">
                <Segmented
                  className="saas-segmented-premium sc-owner-seg"
                  value={visibilityFilter}
                  onChange={(v: any) => setVisibilityFilter(v as VisibilityKey)}
                  options={VISIBILITY_SEGMENTS.map(seg => ({
                    value: seg.k,
                    label: (
                      <span className="sc-owner-opt">
                        <span className="sc-owner-opt__ic">{seg.icon}</span>
                        <span className="sc-owner-opt__label">{seg.label}</span>
                        <span className="sc-owner-opt__count">{visibilityCounts[seg.k]}</span>
                      </span>
                    ),
                  }))}
                />

                <Segmented
                  className="saas-segmented-premium"
                  value={viewMode}
                  onChange={(v: any) => setViewMode(v)}
                  options={[
                    { value: 'list', label: (<Tooltip title="Table View" mouseEnterDelay={0.5}><span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}><UnorderedListOutlined style={{ fontSize: 13 }} /></span></Tooltip>) },
                    { value: 'cards', label: (<Tooltip title="Card View" mouseEnterDelay={0.5}><span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}><AppstoreOutlined style={{ fontSize: 13 }} /></span></Tooltip>) },
                  ]}
                />

                <Tooltip title="Refresh buckets">
                  <Button
                    icon={<ReloadOutlined spin={isRefreshing} />}
                    onClick={handleRefresh}
                    disabled={isLoading && !isRefreshing}
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>

                {canCreateTicketBucket && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
                  >
                    Create Bucket
                  </Button>
                )}
              </Space>
            </div>

            {/* ── Inline filter row — the pill strip the Ticket List uses ── */}
            {isFilterRowOpen && (
              <div className="tl-filter-row">
                <div className="tl-filter-row-label">
                  <FilterOutlined style={{ fontSize: 11 }} />
                  <span>Filters</span>
                  <span className="tl-filter-row-count">{activeFilterCount > 0 ? activeFilterCount : '0'}</span>
                </div>
                <div className="tl-filter-row-pills">
                  <TicketFilterPill
                    icon={<UserOutlined style={{ fontSize: 11 }} />}
                    label="Owner"
                    value={ownerFilter || ""}
                    options={ownerOptions as any}
                    onChange={(val: any) => setOwnerFilter(val || null)}
                    itemNoun="owners"
                    width={240}
                    multiple={false}
                    showAvatar
                    searchPlaceholder="Search by name..."
                  />
                  <TicketFilterPill
                    icon={<NumberOutlined style={{ fontSize: 11 }} />}
                    label="Bucket size"
                    value={sizeFilter !== 'all' ? sizeFilter : ""}
                    options={sizeFilterOptions}
                    onChange={(val: any) => setSizeFilter((val as SizeKey) || 'all')}
                    itemNoun="ranges"
                    multiple={false}
                  />
                  <DatePicker.RangePicker
                    className="premium-range-picker"
                    size="small"
                    style={{ height: 28 }}
                    value={dateRange as any}
                    onChange={(v) => setDateRange(v as any)}
                    format="DD MMM YY"
                    allowEmpty={[true, true]}
                  />
                </div>
                <div className="tl-filter-row-actions">
                  {activeFilterCount > 0 && (
                    <button type="button" className="tl-filter-row-reset" onClick={resetFilters}>
                      <ReloadOutlined style={{ fontSize: 10 }} />
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    className="tl-filter-row-close"
                    onClick={() => setIsFilterRowOpen(false)}
                    aria-label="Close filters"
                    title="Close filters"
                  >
                    <CloseOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Overview banner — the Ticket List's sprint head, reading
                 the bucket library instead. ─────────────────────────────── */}
            <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
              <div className="tl-sprint-row1">
                <div className="tl-sprint-title-block">
                  <span
                    className="tl-sprint-dot"
                    style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
                  />
                  <span className="tl-sprint-title bh2-banner-title">Buckets Hub — {activeProjectLabel}</span>
                  <span className="tl-sprint-tags">
                    <span className="tl-sprint-tag tl-sprint-tag-active">{metrics.total} HUBS</span>
                    <span className="tl-sprint-tag tl-sprint-tag-neutral">{metrics.tickets} TICKETS</span>
                    {activeFilterCount > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-running">{activeFilterCount} FILTERED</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="tl-sprint-row2">
                <span className="tl-sprint-meta">
                  <span className="bh2-pulse-dot" />
                  <b>{filteredBuckets.length}</b> {filteredBuckets.length === 1 ? 'result' : 'results'}
                </span>
                <span className="tl-sprint-meta"><b>{metrics.public}</b> public</span>
                <span className="tl-sprint-meta"><b>{metrics.private}</b> private</span>
                <span className="tl-sprint-meta"><b>{metrics.tickets}</b> tickets stored</span>
              </div>
            </div>

            {/* List or Cards */}
            <div className="bh2-main-body">
            {viewMode === "list" ? (
              (isLoading || isRefreshing) ? (
                <div style={{ padding: "24px" }}>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </div>
              ) : renderTable()
            ) : (
              <div className="bh2-list">
                {(isLoading || isRefreshing) ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bh2-list-card bh2-list-card-skel">
                      <Skeleton active avatar paragraph={{ rows: 2 }} />
                    </div>
                  ))
                ) : filteredBuckets.length === 0 ? (
                  <NoData description={
                    <div className="bh2-empty pp-empty">
                      <div className="bh2-empty-icon pp-empty-orb">
                        <FolderOpenOutlined style={{ fontSize: 28, color: "#3b82f6" }} />
                      </div>
                      <Title level={5} className="pp-empty-title" style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                        {allBuckets.length === 0 ? "No buckets yet" : "No matches for these filters"}
                      </Title>
                      <Text
                        className="pp-empty-sub"
                        style={{
                          fontSize: 13,
                          color: "var(--text-slate-500)",
                          display: "block",
                          marginBottom: 20,
                          maxWidth: 360,
                          textAlign: "center",
                        }}
                      >
                        {allBuckets.length === 0
                          ? "Organize tickets across projects with collaborative hubs."
                          : "Try adjusting visibility, project, size, or search."}
                      </Text>
                      {allBuckets.length === 0 && canCreateTicketBucket ? (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          style={{
                            height: 36,
                            fontWeight: 700,
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            border: "none",
                          }}
                        >
                          Create your first bucket
                        </Button>
                      ) : (
                        <Button onClick={resetFilters}>Reset filters</Button>
                      )}
                    </div>
                  } />
                ) : (
                  tableBuckets.map((bucket) => {
                    const accent = bucket.color || PALETTE_FALLBACK;
                    const ticketCount = bucket._count?.tickets || 0;
                    const memberCount = bucket._count?.members || bucket.members?.length || 0;
                    const owner = bucket.createdBy;
                    const initial = (bucket.name || "?").charAt(0).toUpperCase();
                    const isExpanded = expandedBucketId === bucket.id;

                    return (
                      <article
                        key={bucket.id}
                        ref={(el) => {
                          cardRefs.current[bucket.id] = el;
                        }}
                        className="bh2-list-card"
                        style={{ ["--row-accent" as any]: accent }}
                      >

                        <header className="bh2-list-head">
                          <div
                            className="bh2-list-row"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (ticketCount > 0) handleView(bucket.id);
                            }}
                            onKeyDown={(e) => {
                              if ((e.key === "Enter" || e.key === " ") && ticketCount > 0) {
                                e.preventDefault();
                                handleView(bucket.id);
                              }
                            }}
                          >
                            <div
                              className="bh2-list-avatar"
                              style={{
                                background: `linear-gradient(135deg, #3b82f622 0%, #3b82f63a 100%)`,
                                color: "#3b82f6",
                                borderColor: `#3b82f666`,
                              }}
                            >
                              <span className="bh2-list-avatar-letter">{initial}</span>
                            </div>

                            <div className="bh2-list-row-segments" style={{ alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span className="bh2-list-seg-name" title={bucket.name}>
                                    {bucket.name}
                                    {bucket.userRole === "owner" && (
                                      <Tooltip title="You own this hub">
                                        <CrownOutlined style={{ fontSize: 11, marginLeft: 6, color: "#f59e0b" }} />
                                      </Tooltip>
                                    )}
                                  </span>
                                </div>
                                <span className="bh2-list-seg bh2-list-seg-project">
                                  <span className="bh2-list-seg-label">Project:</span>
                                  {bucket.project ? (
                                    <span className="bh2-list-seg-value" title={bucket.project.name}>
                                      <span className="bh2-list-seg-dot" style={{ background: accent }} />
                                      {bucket.project.name}
                                    </span>
                                  ) : (
                                    <span className="bh2-list-seg-value muted">Cross-Project</span>
                                  )}
                                </span>
                              </div>

                              {bucket.isShared ? (
                                <span
                                  className="bh2-list-status"
                                  style={{
                                    background: "rgba(16,185,129,0.08)",
                                    borderColor: "rgba(16,185,129,0.2)",
                                    color: "#047857",
                                  }}
                                >
                                  <GlobalOutlined style={{ fontSize: 9 }} />
                                  Public
                                </span>
                              ) : (
                                <span
                                  className="bh2-list-status"
                                  style={{
                                    background: "rgba(245,158,11,0.08)",
                                    borderColor: "rgba(245,158,11,0.2)",
                                    color: "#b45309",
                                  }}
                                >
                                  <LockOutlined style={{ fontSize: 9 }} />
                                  Private
                                </span>
                              )}
                            </div>
                          </div>
                        </header>

                        {bucket.description && (
                          <p className="bh2-list-desc" title={bucket.description}>
                            {bucket.description.length > 160
                              ? `${bucket.description.substring(0, 160)}…`
                              : bucket.description}
                          </p>
                        )}

                        <div className="bh2-list-body">
                          {/* Allocation block */}
                          <div className="bh2-list-block">
                            <div className="bh2-list-block-head">
                              <div className="bh2-list-block-label">
                                <FileTextOutlined style={{ fontSize: 10 }} />
                                Allocation
                              </div>
                            </div>
                            <div className="bh2-list-stats">
                              <div className="bh2-list-stat">
                                <FileTextOutlined style={{ fontSize: 11, color: "#94a3b8" }} />
                                <span className="bh2-list-stat-value">{ticketCount}</span>
                                <span className="bh2-list-stat-label">tickets</span>
                              </div>
                              <span className="bh2-list-stat-sep" />
                              <div className="bh2-list-stat">
                                <TeamOutlined style={{ fontSize: 11, color: "#94a3b8" }} />
                                <span className="bh2-list-stat-value">{memberCount}</span>
                                <span className="bh2-list-stat-label">members</span>
                              </div>
                            </div>
                          </div>

                          {/* Owner block */}
                          <div className="bh2-list-block">
                            <div className="bh2-list-block-head">
                              <div className="bh2-list-block-label">
                                <CrownOutlined style={{ fontSize: 10 }} />
                                Owner
                              </div>
                            </div>
                            <div className="bh2-list-owner">
                              {owner?.avatarUrl ? (
                                <Avatar
                                  src={owner?.avatarUrl || undefined}
                                  size={26}
                                  style={{
                                    background: `linear-gradient(135deg, #3b82f6 0%, #3b82f6cc 100%)`,
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}
                                >
                                  {initialsOf(owner?.name)}
                                </Avatar>
                              ) : (
                                <Avatar
                                  size={26}
                                  style={{
                                    background: `linear-gradient(135deg, #3b82f6 0%, #3b82f6cc 100%)`,
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}
                                >
                                  {initialsOf(owner?.name)}
                                </Avatar>
                              )}
                              <div className="bh2-list-owner-info">
                                <span className="bh2-list-owner-name">{owner?.name || "—"}</span>
                                {owner?.workEmail && (
                                  <span className="bh2-list-owner-email">{owner.workEmail}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <footer className="bh2-list-foot">
                          <div className="bh2-list-foot-inline">
                            <span className="bh2-list-foot-item">
                              <span className="bh2-list-foot-label">Created:</span>
                              <b>
                                {new Date(bucket.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </b>
                            </span>
                            {bucket.updatedAt && bucket.updatedAt !== bucket.createdAt && (
                              <>
                                <span className="bh2-list-foot-div" />
                                <span className="bh2-list-foot-item">
                                  <span className="bh2-list-foot-label">Updated:</span>
                                  <b>
                                    {new Date(bucket.updatedAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </b>
                                </span>
                              </>
                            )}

                            <span className="bh2-list-foot-div" />

                            <button
                              type="button"
                              className={`bh2-manage-btn ${isExpanded ? "active" : ""}`}
                              style={{ ["--row-accent" as any]: accent }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBucketId((prev) => {
                                  const next = prev === bucket.id ? null : bucket.id;
                                  if (next) {
                                    // Wait for the panel to mount, then smooth-scroll the
                                    // card's top under the sticky header.
                                    requestAnimationFrame(() => {
                                      cardRefs.current[next]?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                      });
                                    });
                                  }
                                  return next;
                                });
                              }}
                            >
                              <SettingOutlined style={{ fontSize: 11 }} />
                              <span>Manage Tickets</span>
                              {isExpanded ? (
                                <UpOutlined style={{ fontSize: 9 }} />
                              ) : (
                                <DownOutlined style={{ fontSize: 9 }} />
                              )}
                            </button>
                          </div>

                          <div className="bh2-list-actions" onClick={(e) => e.stopPropagation()}>
                            <MoveToSprintAction
                              bucket={bucket}
                              showLabel
                              onMove={(sprintId) =>
                                moveBucketToSprint.mutate(
                                  { bucketId: bucket.id, sprintId },
                                  {
                                    onSuccess: (result) => {
                                      if (result.movedCount > 0)
                                        message.success("Tickets added to sprint");
                                      else message.info("This bucket has no tickets to move");
                                    },
                                    onError: (err: any) =>
                                      message.error(err.message || "Movement failed"),
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
                              title="Move to backlog"
                              description="Move all tickets back to backlog?"
                              onConfirm={() => {
                                moveBucketToBacklog.mutate(bucket.id, {
                                  onSuccess: (result) => {
                                    if (result.movedCount > 0)
                                      message.success("Tickets removed from sprint");
                                    else message.info("This bucket has no tickets to move");
                                  },
                                  onError: (err: any) =>
                                    message.error(err.message || "Movement failed"),
                                });
                              }}
                              okText="Move"
                              cancelText="Cancel"
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<RollbackOutlined style={{ fontSize: 12, color: "#64748b" }} />}
                                loading={
                                  moveBucketToBacklog.isPending &&
                                  moveBucketToBacklog.variables === bucket.id
                                }
                                disabled={ticketCount === 0}
                                className="bh2-foot-btn"
                              >
                                Move to Backlog
                              </Button>
                            </Popconfirm>
                            <Tooltip title={ticketCount === 0 ? "No tickets to view" : "View details"}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: "#64748b" }} />}
                                onClick={() => handleView(bucket.id)}
                                disabled={ticketCount === 0}
                                className="bh2-list-action-btn"
                              />
                            </Tooltip>
                            {canUpdateTicketBucket && (
                              <Tooltip title="Configure">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined style={{ color: "#64748b" }} />}
                                  onClick={() => handleEdit(bucket)}
                                  className="bh2-list-action-btn"
                                />
                              </Tooltip>
                            )}
                            {canDeleteTicketBucket && (
                              <Popconfirm
                                title="Delete bucket"
                                description="This permanently removes the bucket."
                                onConfirm={() => handleDelete(bucket.id)}
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                              >
                                <Tooltip title="Delete">
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={
                                      deleteBucket.isPending && deleteBucket.variables === bucket.id
                                    }
                                    className="bh2-list-action-btn"
                                  />
                                </Tooltip>
                              </Popconfirm>
                            )}
                          </div>
                        </footer>
                        {isExpanded && (
                          <>
                            <div className="bh2-list-divider" />
                            <BucketManageInlinePanel
                              bucketId={bucket.id}
                              accent={accent}
                              onClose={() => setExpandedBucketId(null)}
                              nested
                            />
                          </>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}
            </div>

            {!isLoading && !isRefreshing && tableBuckets.length > 0 && (
              <div className="bh2-main-foot">
                <Text style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>
                  Showing <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalTableBuckets)}
                  </span> of <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>{totalTableBuckets}</span> bucket{totalTableBuckets !== 1 ? 's' : ''}
                </Text>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalTableBuckets}
                  onChange={(p, s) => {
                    setCurrentPage(p);
                    setPageSize(s);
                  }}
                  showSizeChanger
                  pageSizeOptions={[10, 20, 25, 50, 100]}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <CreateBucketModal
        open={createModalOpen}
        bucket={editingBucket}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <style jsx global>{`
        /* ── Page shell ──────────────────────────────────────────── */
        .bh2-page {
          background: var(--bg-pure-white);
          min-height: calc(100vh - 54px);
          display: flex;
          flex-direction: column;
        }
        [data-theme="dark"] .bh2-page {
          background: var(--bg-pure-white) !important;
        }

        .bh2-shell-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .bh2-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 54px);
        }
        .bh2-main {
          min-width: 0;
          padding: 0;
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          grid-column: 1;
          height: calc(100vh - 54px);
          overflow: hidden;
        }
        .bh2-main-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        /* Cards keep a gutter; the table runs edge to edge. */
        .bh2-list { padding: 12px 16px 16px; }

        /* ── Header row, matched to the Ticket List ─────────────────────── */
        .bh2-toolbar.sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: auto;
          min-height: 0;
          margin: 0;
          padding: 9.7px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .bh2-toolbar.sc-header { background: #0f1419; border-bottom-color: #1f2937; }
        .sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .sc-header-right { flex-shrink: 0; }

        .sc-owner-seg .ant-segmented-item-label { padding: 0 4px; }
        .sc-owner-opt { display: inline-flex; align-items: center; gap: 6px; height: 100%; }
        .sc-owner-opt__ic { display: inline-flex; align-items: center; font-size: 11px; }
        .sc-owner-opt__label { font-size: 12px; font-weight: 600; white-space: nowrap; }
        .sc-owner-opt__count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 17px; padding: 0 5px;
          border-radius: 999px; background: var(--bg-slate-100); color: var(--text-slate-500);
          font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .ant-segmented-item-selected .sc-owner-opt__count { background: var(--bg-blue-50); color: #3B82F6; }
        [data-theme='dark'] .sc-owner-opt__count { background: #1e293b; color: #94a3b8; }
        @media (max-width: 1240px) { .sc-owner-opt__label { display: none; } }

        /* ── Overview banner ────────────────────────────────────────────── */
        .tl-section-head {
          padding: 10px 16px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-section-head { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-sprint-head-v2 { display: flex; flex-direction: column; gap: 6px; }
        .tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .tl-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .tl-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .bh2-banner-title {
          font-size: 14px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        [data-theme='dark'] .bh2-banner-title { color: #f1f5f9; }
        .tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .tl-sprint-tag {
          display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px;
          border: 1px solid transparent; text-transform: uppercase; line-height: 1;
        }
        .tl-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16,185,129,0.32); }
        .tl-sprint-tag-neutral { background: transparent; color: #64748b; border-color: rgba(100,116,139,0.32); }
        .tl-sprint-tag-running { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }
        [data-theme='dark'] .tl-sprint-tag-active { color: #34d399; }

        .tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
        .tl-sprint-meta {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
        }
        .tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
        [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
        [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

        /* ── Inline filter row ──────────────────────────────────────────── */
        .tl-filter-row {
          display: flex; align-items: center; gap: 10px; padding: 8px 16px;
          background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-filter-row { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-filter-row-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10.5px; font-weight: 800; color: var(--text-slate-500);
          text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
        }
        .tl-filter-row-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 6px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500); border-radius: 999px;
          font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .tl-filter-row-pills { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .tl-filter-row-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
        .tl-filter-row-reset {
          display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
          background: transparent; border: 1px dashed var(--border-slate-200); border-radius: 8px;
          font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-slate-500); cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8; border-color: rgba(59,130,246,0.45);
          background: rgba(59,130,246,0.06); border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; background: transparent;
          border: 1px solid var(--border-slate-200); border-radius: 8px;
          color: var(--text-slate-500); cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .tl-filter-row-close:hover { color: var(--text-slate-900); background: var(--bg-pure-white); border-color: var(--text-slate-400); }
        [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
        [data-theme='dark'] .tl-filter-row-count { background: #111720; border-color: #2d3748; color: #cbd5e1; }
        [data-theme='dark'] .tl-filter-row-reset,
        [data-theme='dark'] .tl-filter-row-close { border-color: #2d3748; color: #94a3b8; }
        @media (max-width: 900px) {
          .tl-filter-row-label { display: none; }
          .tl-sprint-row2 { padding-left: 0; }
        }

        /* ── Table pane: edge to edge, Ticket List proportions ──────────── */
        .bh2-table-shell {
          border: 1px solid var(--border-slate-200);
          border-left: none;
          border-right: none;
          border-radius: 0;
          overflow-x: auto;
        }
        [data-theme='dark'] .bh2-table-shell { border-color: #1f2937; }
        .bh2-table-shell .premium-table .ant-table-container,
        .bh2-table-shell .premium-table .ant-table-content,
        .bh2-table-shell .premium-table .ant-table {
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
        }
        .bh2-table-shell .premium-table .ant-table-thead > tr > th {
          padding: 5px 10px !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
        }
        .bh2-table-shell .premium-table .ant-table-tbody > tr > td {
          padding: 7px 10px !important;
          font-size: 11.5px !important;
          line-height: 1.35 !important;
        }

        /* ── Footer band, mirroring the pager on the other pages ────────── */
        .bh2-main-foot {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px; padding: 8px 16px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          flex-shrink: 0;
          box-shadow: 0 -4px 14px rgba(15,23,42,0.04);
        }
        [data-theme='dark'] .bh2-main-foot { background: #0f1419; border-top-color: #1f2937; }
        .bh2-main-body::-webkit-scrollbar { display: none; }
        [data-theme="dark"] .bh2-main {
          background: transparent !important;
        }

        /* ── Main toolbar ───────────────────────────────────────── */
        .bh2-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex-shrink: 0;
          background: var(--bg-pure-white);
          padding: 10px 24px;
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-toolbar {
          background: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
        }
        [data-theme="dark"] .bh2-search-kbd {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
          box-shadow: none !important;
        }
        [data-theme="dark"] .pp-search-wrap {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme="dark"] .pp-search {
          color: #FFFFFF !important;
        }
        [data-theme="dark"] .pp-search::placeholder {
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .pp-ghost-btn {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .pp-segmented {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme="dark"] .pp-segmented button {
          color: #8b949e !important;
        }
        [data-theme="dark"] .pp-segmented button.is-active {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        [data-theme="dark"] .bh2-range-picker.ant-picker {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme="dark"] .bh2-toolbar-chip {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        .bh2-main-search {
          flex: 1;
          max-width: 320px;
        }
        .premium-search-input{
          border-radius: 6px !important;
          height: 32px !important;
        }
        .bh2-search-kbd {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 6px;
          margin: 0 2px;
          border-radius: 5px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-700);
          box-shadow: 0 1px 0 var(--border-slate-200);
        }
        .bh2-main-stats {
          margin-left: 12px;
          color: var(--text-slate-500);
          font-size: 13px;
        }
        .bh2-pulse-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
          animation: bh2-pulse 2s infinite;
        }
        @keyframes bh2-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .bh2-main-controls {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bh2-vis-badge {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
        }
        .bh2-vis-badge-public {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.25);
          color: #047857;
        }
        .bh2-vis-badge-private {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.25);
          color: #b45309;
        }
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
        /* RangePicker — match the SearchableDropdown trigger height/border */
        .bh2-range-picker {
          height: 32px !important;
          border-radius: 6px !important;
          font-size: 12px;
        }
        .bh2-range-picker.ant-picker {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .bh2-range-picker.ant-picker {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        .bh2-toolbar-icon {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .bh2-toolbar-chip {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.01em;
        }
        [data-theme="dark"] .bh2-toolbar-chip {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        .bh2-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          width: 260px;
          transition: border-color 0.15s ease;
        }
        .bh2-search-box.active {
          border-color: rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .bh2-search-box {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme="dark"] .bh2-search-box.active {
          border-color: rgba(59, 130, 246, 0.5) !important;
        }

        /* ── List cards ─────────────────────────────────────────── */
        .bh2-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 10px;
        }
        
        .bh2-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding-top: 10px;
        }

        .bh2-table-shell {
       background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden;
        }
        
        @media (max-width: 1200px) {
          .bh2-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Fixed-height pagination footer ──────────────────────────── */
        .bh2-main-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 24px;
          flex-wrap: wrap;
          flex-shrink: 0;
          height: 52px;
          box-sizing: border-box;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.04);
        }
        [data-theme="dark"] .bh2-main-foot {
          background: #0B0F1A !important;
          border-top-color: #1F2937 !important;
        }
        [data-theme="dark"] .bh2-main-foot .ant-pagination-item,
        [data-theme="dark"] .bh2-main-foot .ant-pagination-prev .ant-pagination-item-link,
        [data-theme="dark"] .bh2-main-foot .ant-pagination-next .ant-pagination-item-link {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        [data-theme="dark"] .bh2-main-foot .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        [data-theme="dark"] .bh2-main-foot .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        [data-theme="dark"] .bh2-main-foot .ant-select-selector {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }

        /* Custom Pagination Styles */
        .bh2-main-foot .ant-pagination-item,
        .bh2-main-foot .ant-pagination-prev .ant-pagination-item-link,
        .bh2-main-foot .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500) !important;
        }
        .bh2-main-foot .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .bh2-main-foot .ant-pagination-item-active a {
          color: #fff !important;
        }
        .bh2-main-foot .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          color: var(--text-slate-500) !important;
        }

        .bh2-list-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          /* When we smooth-scroll a card into view on Manage-Tickets click,
             land its top 120px below the viewport so it clears the sticky
             page header (~52px) + sticky toolbar (~60px). */
          scroll-margin-top: 120px;
          padding: 2px 16px 6px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        [data-theme="dark"] .bh2-list-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .bh2-list-card:hover {
          border-color: #3b82f6 !important;
        }
        [data-theme="dark"] .bh2-list-card:hover {
          background: #1c232e !important;
        }
        .bh2-list-card-skel {
          min-height: 96px;
        }

        .bh2-list-head {
          display: flex;
          align-items: center;
        }
        .bh2-list-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          font-family: inherit;
          outline: none;
        }
        .bh2-list-row:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.3);
          outline-offset: 4px;
          border-radius: 8px;
        }
        .bh2-list-row-segments {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .bh2-list-row-div {
          width: 1px;
          height: 18px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme="dark"] .bh2-list-row-div {
          background: #2d3748 !important;
        }
        .bh2-list-seg {
          display: inline-flex;
          align-items: center;
          min-width: 0;
        }
        .bh2-list-seg-project {
          gap: 6px;
          flex-shrink: 0;
        }
        .bh2-list-seg-bucket {
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .bh2-list-seg-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-slate-400);
          text-transform: capitalize;
          letter-spacing: 0.05em;
        }
        [data-theme="dark"] .bh2-list-seg-label {
          color: #94a3b8 !important;
        }
        .bh2-list-seg-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-700);
          letter-spacing: -0.01em;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-seg-value {
          color: #cbd5e1 !important;
        }
        .bh2-list-seg-value.muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .bh2-list-seg-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bh2-list-seg-name {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-seg-name {
          color: #f1f5f9 !important;
        }
        .bh2-list-row:hover .bh2-list-seg-name {
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-list-row:hover .bh2-list-seg-name {
          color: #60a5fa !important;
        }
        .bh2-list-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.025em;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .bh2-list-avatar::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 75% 0%, rgba(255, 255, 255, 0.2), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0, 0, 0, 0.06), transparent 55%);
          pointer-events: none;
        }
        .bh2-list-avatar-letter {
          position: relative;
          z-index: 1;
          line-height: 1;
        }
        .bh2-list-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 9px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .bh2-list-desc {
          margin: 0;
          padding: 4px 8px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px dashed var(--border-slate-200);
          border-radius: 6px;
          align-self: flex-start;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-desc {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }

        /* Body */
        .bh2-list-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px;
        }
        .bh2-list-block {
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 8px;
          padding: 6px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        [data-theme="dark"] .bh2-list-block {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .bh2-list-block-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bh2-list-block-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .bh2-list-block-label {
          color: #94a3b8 !important;
        }
        .bh2-list-stats {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bh2-list-stat {
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
        }
        .bh2-list-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        [data-theme="dark"] .bh2-list-stat-value {
          color: #f1f5f9 !important;
        }
        .bh2-list-stat-label {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .bh2-list-stat-sep {
          width: 1px;
          height: 14px;
          background: var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-list-stat-sep {
          background: #2d3748 !important;
        }
        .bh2-list-owner {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bh2-list-owner-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.25;
        }
        .bh2-list-owner-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .bh2-list-owner-name {
          color: #e2e8f0 !important;
        }
        .bh2-list-owner-email {
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Footer */
        .bh2-list-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 4px;
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .bh2-list-foot {
          border-top-color: #1f2937 !important;
        }

        /* Divider between footer and the inline Manage-Tickets panel */
        .bh2-list-divider {
          height: 1px;
          background: var(--border-slate-100);
          /* Extend to the card's edges, eating the parent padding (10 14 10 16) */
          margin: 2px -14px 2px -16px;
        }
        [data-theme="dark"] .bh2-list-divider {
          background: #1f2937 !important;
        }
        .bh2-list-foot-inline {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .bh2-list-foot-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-500);
        }
        .bh2-list-foot-item b {
          color: var(--text-slate-800);
          font-weight: 700;
        }
        [data-theme="dark"] .bh2-list-foot-item b {
          color: #e2e8f0 !important;
        }
        .bh2-list-foot-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .bh2-list-foot-div {
          width: 1px;
          height: 12px;
          background: var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-list-foot-div {
          background: #2d3748 !important;
        }
        .bh2-list-actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        .bh2-list-action-btn {
          width: 28px;
          height: 28px;
          padding: 0 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px !important;
        }

        /* Labeled footer button (e.g. Move to Sprint / Move to Backlog) */
        .bh2-foot-btn {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          height: 28px !important;
          padding: 0 10px !important;
          border-radius: 7px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          color: var(--text-slate-700) !important;
          font-size: 11.5px !important;
          font-weight: 700 !important;
          letter-spacing: 0.005em;
          transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
        }
        .bh2-foot-btn:hover:not(:disabled) {
          border-color: #3b82f6 !important;
          color: #3b82f6 !important;
          background: var(--bg-slate-50) !important;
        }
        .bh2-foot-btn:disabled {
          opacity: 0.5;
        }
        [data-theme="dark"] .bh2-foot-btn {
          background: var(--bg-pure-white);
          border-color: var(--border-slate-200);
          color: var(--text-slate-700);
        }

        /* Manage Tickets button */
        .bh2-manage-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: transparent;
          border: 1px solid var(--border-slate-200);
          border-radius: 6px;
          color: var(--text-slate-600);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .bh2-manage-btn:hover {
          color: #fff !important;
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
        }
        .bh2-manage-btn.active {
          color: #fff !important;
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
        }
        [data-theme="dark"] .bh2-manage-btn {
          border-color: var(--border-slate-200);
          color: var(--text-slate-600);
        }

        /* Empty */
        .bh2-empty {
          padding: 64px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .bh2-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        /* ── Responsive ──────────────────────────────────────────── */

        /* Slim sidebar + tighter toolbar on smaller desktop */
        @media (max-width: 1200px) {
          .bh2-search-box {
            width: 220px;
          }
          .bh2-list-card {
            padding: 16px 18px 14px 20px;
          }
        }

        /* Tablet — toolbar filters wrap to their own row */
        @media (max-width: 1024px) {
          .bh2-toolbar-filters {
            margin-left: 0;
            width: 100%;
            order: 3;
          }
          .bh2-search-box {
            width: 200px;
          }
          .bh2-list-foot {
            flex-wrap: wrap;
            row-gap: 10px;
          }
        }

        /* ── Tablet / Mobile <1100px ────────────────────────── */
        @media (max-width: 1099.98px) {
          .bh2-shell {
            display: flex;
            flex-direction: column;
            grid-template-columns: none;
            min-height: auto;
          }
        }

        /* Sidebar collapses above content layout shifts */
        @media (max-width: 900px) {
          .bh2-page {
            margin: 0;
          }
          .bh2-list-body {
            grid-template-columns: 1fr;
          }
          .bh2-toolbar {
            margin: -14px -16px 0;
            padding: 12px 16px;
          }
          .bh2-pagination {
            margin: 14px -16px -28px;
            padding: 10px 16px;
          }
          .bh2-list-card {
            padding: 14px 16px 14px 18px;
            gap: 12px;
          }
          .bh2-list-stripe {
            top: 14px;
            bottom: 14px;
          }
          .bh2-list-card {
            scroll-margin-top: 88px;
          }
        }

        /* Phone */
        @media (max-width: 640px) {
          .bh2-page {
            margin: 0;
          }
          .bh2-toolbar {
            flex-direction: column;
            align-items: stretch;
            margin: -12px -12px 0;
            padding: 10px 12px;
          }
          .bh2-toolbar-title {
            width: 100%;
            justify-content: space-between;
          }
          .bh2-toolbar-filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
          }
          .bh2-toolbar-filters > * {
            width: 100% !important;
            min-width: 0 !important;
          }
          .bh2-range-picker {
            grid-column: 1 / -1;
          }
          .bh2-search-box {
            width: 100%;
          }
          /* Bucket cards */
          .bh2-list-card {
            padding: 14px 14px 12px 16px;
            scroll-margin-top: 76px;
          }
          .bh2-list-row {
            gap: 10px;
          }
          .bh2-list-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            font-size: 15px;
          }
          .bh2-list-seg-name {
            font-size: 14px;
            white-space: normal;
          }
          .bh2-list-foot {
            flex-direction: column;
            align-items: stretch;
          }
          .bh2-list-actions {
            flex-wrap: wrap;
            row-gap: 6px;
            justify-content: flex-start;
          }
          .bh2-foot-btn {
            flex: 1;
            justify-content: center;
          }
          /* Pagination */
          .bh2-pagination {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            margin: 12px -12px -24px;
            padding: 10px 12px;
          }
          .bh2-pagination-meta {
            text-align: center;
          }
        }

        /* Very small phones */
        @media (max-width: 400px) {
          .bh2-list-stripe {
            display: none;
          }
          .bh2-list-status {
            font-size: 9.5px;
          }
          .bh2-list-seg-name {
            font-size: 13px;
          }
        }
        /* ── Premium Table CSS ───────────────────────────────────── */
        .premium-table .ant-table {
          background: transparent !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
            text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
            white-space: nowrap !important;
        }
             .premium-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
          .premium-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .premium-table .ant-table-tbody > tr.premium-row:hover > td { background: var(--bg-slate-50) !important; }
          .premium-table .ant-table-tbody > tr.premium-row { cursor: pointer; }
          .premium-table .ant-table-selection-column { padding-inline: 6px !important; }
        .premium-table .ant-table-thead > tr > th::before {
          display: none;
        }

        /* Sticky Column Background Fixes */
        .premium-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .premium-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: var(--bg-slate-50) !important;
          z-index: 10 !important;
          position: sticky !important;
        }
        .premium-table .ant-table-tbody > tr > td.ant-table-cell-fix-left,
        .premium-table .ant-table-tbody > tr > td.ant-table-cell-fix-right {
          background: var(--bg-pure-white) !important;
          z-index: 10 !important;
          position: sticky !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left,
        .premium-table .ant-table-tbody > tr.premium-row:hover > td.ant-table-cell-fix-left,
        .premium-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
        .premium-table .ant-table-tbody > tr.premium-row:hover > td.ant-table-cell-fix-right {
          background: var(--bg-slate-50) !important;
        }

        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: #0f1419 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td.ant-table-cell-fix-left,
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td.ant-table-cell-fix-right {
          background: #0B0F1A !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left,
        [data-theme='dark'] .premium-table .ant-table-tbody > tr.premium-row:hover > td.ant-table-cell-fix-left,
        [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
        [data-theme='dark'] .premium-table .ant-table-tbody > tr.premium-row:hover > td.ant-table-cell-fix-right {
          background: #161B22 !important;
        }
  
        // .premium-table .ant-table-row:hover > td {
        //   background: #f8fafc !important;
        // }
        // [data-theme='dark'] .premium-table .ant-table-row:hover > td {
        //   background: rgba(255, 255, 255, 0.02);
        // }
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
        .dh-col-icon {
          color: #94a3b8;
          font-size: 13px;
        }
        [data-theme='dark'] .dh-col-icon {
          color: #475569;
        }

        .dh-name-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #3b82f6;
          color: #ffffff;
        }
        [data-theme='dark'] .dh-name-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .bmp-owner-avatar {
          background: #3b82f6 !important;
          color: #ffffff !important;
        }
        .bmp-owner-avatar .ant-avatar-string {
          font-size: 10px !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) scale(1) !important;
          line-height: 1 !important;
        }
        [data-theme='dark'] .bmp-owner-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border: none;
        }

        .bmp-table-text-primary {
          color: #334155;
        }
        [data-theme='dark'] .bmp-table-text-primary {
          color: #f1f5f9;
        }

        .bmp-project-tag {
          background: var(--bg-blue-50);
          color: #3b82f6;
        }

        .bmp-tag-public {
          background: var(--bg-green-50, #ecfdf5);
          color: #10b981;
          border: 1px solid var(--border-green-200, #a7f3d0);
        }

        .bmp-tag-private {
          background: var(--bg-slate-50);
          color: var(--text-slate-500);
          border: 1px solid var(--border-slate-200);
        }

        /* ── Status Cards ────────────────────────────────────────── */
        .bh2-stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 16px 0 8px 0;
        }
        @media (max-width: 1024px) {
          .bh2-stat-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .bh2-stat-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .bh2-stat-card {
       background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            border-radius: 0; padding: 12px 14px; min-height: 92px;
            display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
            box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        [data-theme="dark"] .bh2-stat-card {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }
        .bh2-stat-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
          border-color: var(--border-blue-300);
        }
        [data-theme="dark"] .bh2-stat-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .bh2-stat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .bh2-stat-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bh2-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 16px;
        }
        .bh2-stat-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .bh2-stat-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          animation: pulse-dot 2s infinite;
        }
        .bh2-stat-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .bh2-stat-value-wrap {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .bh2-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-slate-900);
          line-height: 1.1;
        }
        .bh2-stat-period {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-400);
        }

      `}</style>
    </div>
  );
}
