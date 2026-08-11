"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
  Row,
  Col,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { SearchableDropdown, SearchableDropdownOption } from "@/components/common/SearchableDropdown";
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
  RightOutlined,
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
  CloseCircleOutlined,
  RocketOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
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
import type { Bucket } from "@/services/bucketService";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";

/* -------------------------------------------------------------------------- */
/*                                Sparkline                                   */
/* -------------------------------------------------------------------------- */

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1100);
    }
  }, []);

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
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Data ─────────────────────────────────────────────────────────
  const { data: projects } = useUserProjects();
  const { data: bucketsData, isLoading, refetch } = useBuckets(undefined);
  const allBuckets = bucketsData || [];

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

  const pagedBuckets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBuckets.slice(start, start + pageSize);
  }, [filteredBuckets, currentPage, pageSize]);

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
    } catch (e) {
      console.error("Error deleting bucket:", e);
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
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    message.success("Success, buckets refreshed");
  };
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
      <div className="bh2-table-shell" style={{ position: 'relative' }}>
        {(isLoading || isRefreshing) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner size="medium" fullScreen={false} />
          </div>
        )}
        <Table
          columns={columns}
          dataSource={pagedBuckets}
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
          })}
        />
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="bh2-page">
      <div className={`bh2-shell-wrap ${isSidebarOpen ? 'is-sidebar-open' : 'is-sidebar-closed'}`}>
        {/* Mobile backdrop — closes the sidebar drawer when tapped */}
        <div
          className="bh2-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
        <div className="bh2-shell">
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="bh2-sidebar">
            <div className="bh2-sidebar-top">
              <div className="bh2-sidebar-brand">
                <div className="bh2-hero-icon-box">
                  <FolderOpenOutlined style={{ fontSize: 24, color: 'var(--text-slate-900)' }} />
                </div>
                <div className="min-w-0">
                  <h1 className="bh2-sidebar-title">Buckets Hub</h1>
                  <p className="bh2-sidebar-subtitle"> Task organization</p>
                </div>
              </div>
              {canCreateTicketBucket && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="bh2-side-create"
                  block
                  onClick={handleCreate}
                >
                  Create Bucket
                </Button>
              )}
            </div>

            <div className="bh2-sidebar-scroll">
              {/* Visibility */}
              <div className="bh2-side-group">
                <div className="bh2-side-label">VIEWS</div>
                <div className="flex flex-col gap-0.5">
                  {(
                    [
                      { k: "all", label: "All hubs", icon: <AppstoreOutlined /> },
                      { k: "public", label: "Public", icon: <GlobalOutlined /> },
                      { k: "private", label: "Private", icon: <LockOutlined /> },
                    ] as const
                  ).map((item) => {
                    const active = visibilityFilter === item.k;
                    return (
                      <button
                        key={item.k}
                        className={`bh2-view-btn ${active ? "active" : ""}`}
                        onClick={() => setVisibilityFilter(item.k as VisibilityKey)}
                      >
                        <span className="bh2-view-icon">{item.icon}</span>
                        <span className="bh2-view-label">{item.label}</span>
                        <span className="bh2-view-count">{visibilityCounts[item.k]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="bh2-side-group" style={{ marginTop: 22 }}>
                <div className="bh2-side-label">Filters</div>
                <div className="bh2-side-filters flex flex-col gap-2">
                  <SearchableDropdown
                    placeholder="Visibility"
                    options={visibilityOptions}
                    value={visibilityFilter === "all" ? undefined : visibilityFilter}
                    onChange={(v) =>
                      setVisibilityFilter((v as VisibilityKey) || "all")
                    }
                    itemNoun="options"
                    width={220}
                    style={{ width: '100%' }}
                  />
                  <SearchableDropdown
                    placeholder="Owner"
                    options={ownerOptions}
                    value={ownerFilter || undefined}
                    onChange={(v) => setOwnerFilter(v || null)}
                    itemNoun="owners"
                    width={260}
                    style={{ width: '100%' }}
                  />
                  <DatePicker.RangePicker
                    className="premium-range-picker"
                    style={{ width: '100%', background: 'var(--bg-pure-white)', height: 35 }}
                    value={dateRange as any}
                    onChange={(v) => setDateRange(v as any)}
                    format="MMM D, YYYY"
                    allowEmpty={[true, true]}
                  />
                  {(visibilityFilter !== "all" || ownerFilter || (dateRange && (dateRange[0] || dateRange[1]))) && (
                    <button
                      type="button"
                      className="bh2-sidebar-clear"
                      onClick={() => {
                        setVisibilityFilter("all");
                        setOwnerFilter(null);
                        setDateRange(null);
                      }}
                    >
                      <CloseCircleOutlined style={{ fontSize: 12 }} />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Projects + nested buckets */}
              <div className="bh2-side-group">
                <div className="bh2-side-label">Projects</div>
                <div className="flex flex-col gap-0.5">
                  <button
                    className={`bh2-view-btn ${!selectedProjectKey ? "active" : ""}`}
                    onClick={() => setSelectedProjectKey(null)}
                  >
                    <span className="bh2-view-icon">
                      <ProjectOutlined />
                    </span>
                    <span className="bh2-view-label">All projects</span>
                    <span className="bh2-view-count">{allBuckets.length}</span>
                  </button>

                  {projectOrder
                    .slice(0, showAllProjects ? projectOrder.length : 5)
                    .map((proj, i) => {
                      const group = bucketsByProject.get(proj.key);
                      const buckets = group?.buckets || [];
                      const isExpanded = expandedProjects.has(proj.key);
                      const isActive = selectedProjectKey === proj.key;
                      const color = PROJECT_PALETTE[i % PROJECT_PALETTE.length];
                      const initial = proj.name.charAt(0).toUpperCase();
                      return (
                        <React.Fragment key={proj.key}>
                          <div className={`bh2-sidebar-proj-row ${isActive ? "active" : ""}`}>
                            <button
                              className="bh2-sidebar-proj-toggle"
                              onClick={() => toggleProject(proj.key)}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <DownOutlined style={{ fontSize: 8 }} />
                              ) : (
                                <RightOutlined style={{ fontSize: 8 }} />
                              )}
                            </button>
                            <button
                              className="bh2-sidebar-proj-main"
                              onClick={() =>
                                setSelectedProjectKey((prev) => (prev === proj.key ? null : proj.key))
                              }
                              title={proj.name}
                            >
                              <span className="bh2-view-icon" style={{ color }}>
                                <ProjectOutlined />
                              </span>
                              <span className="bh2-view-label">{proj.name}</span>
                              <span className="bh2-view-count">{buckets.length}</span>
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="bh2-sidebar-children">
                              {buckets.length === 0 ? (
                                <div className="bh2-sidebar-empty-mini">No buckets</div>
                              ) : (
                                buckets.map((b) => (
                                  <button
                                    key={b.id}
                                    className="bh2-sidebar-bucket"
                                    onClick={() => handleView(b.id)}
                                    title={b.name}
                                  >
                                    <span
                                      className="bh2-sidebar-bucket-dot"
                                      style={{ background: b.color || PALETTE_FALLBACK }}
                                    />
                                    <span className="bh2-sidebar-bucket-label">{b.name}</span>
                                    <span className="bh2-sidebar-bucket-count">{b._count?.tickets || 0}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                  {projectOrder.length > 5 && (
                    <button
                      className="bh2-sidebar-proj-more"
                      onClick={() => setShowAllProjects(!showAllProjects)}
                    >
                      {showAllProjects ? "Show less" : `Show ${projectOrder.length - 5} more`}
                    </button>
                  )}

                  {projectOrder.length === 0 && !isLoading && (
                    <div className="bh2-sidebar-empty">No projects yet</div>
                  )}
                </div>
              </div>

              {/* Bucket Size */}
              <div className="bh2-side-group" style={{ marginTop: 22 }}>
                <div className="bh2-side-label">Bucket Size</div>
                <div className="flex flex-col gap-0.5">
                  {SIZE_BUCKETS.map((seg) => {
                    const active = sizeFilter === seg.key;
                    return (
                      <button
                        key={seg.key}
                        className={`bh2-view-btn ${active ? "active" : ""}`}
                        onClick={() => setSizeFilter(seg.key)}
                      >
                        <span className="bh2-view-icon">
                          <span className="bh2-sidebar-item-dot" style={{ background: seg.color }} />
                        </span>
                        <span className="bh2-view-label">{seg.label}</span>
                        <span className="bh2-view-count">{sizeCounts[seg.key] || 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>


              {activeFilterCount > 0 && (
                <button className="bh2-sidebar-clear" onClick={resetFilters}>
                  <CloseCircleOutlined style={{ fontSize: 12 }} />
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* ── Main ──────────────────────────────────────────────── */}
          <main className="bh2-main">
            {/* Toolbar */}
            <div className="bh2-toolbar">
              <Tooltip title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} placement="bottom">
                <button
                  type="button"
                  className="bh2-sidebar-show-toggle"
                  onClick={() => setIsSidebarOpen((v) => !v)}
                  aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                  aria-pressed={!isSidebarOpen}
                >
                  {isSidebarOpen ? (
                    <MenuFoldOutlined style={{ fontSize: 14 }} />
                  ) : (
                    <MenuUnfoldOutlined style={{ fontSize: 14 }} />
                  )}
                </button>
              </Tooltip>

              <Divider type="vertical" style={{ height: 24, margin: '0 12px 0 0', opacity: 0.5 }} className="bh2-sidebar-divider" />

              <div className="pp-search-wrap" style={{ flex: 1, maxWidth: 320 }}>
                <SearchOutlined className="pp-search-icon" />
                <input
                  className="pp-search"
                  placeholder="Search bucket name or description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* {!searchQuery && <span className="pp-kbd">⌘K</span>} */}
              </div>

              <div className="bh2-main-stats">
                <span className="inline-flex items-center gap-1.5">
                  <span className="bh2-pulse-dot" />
                  <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{filteredBuckets.length}</span> {filteredBuckets.length === 1 ? "result" : "results"}
                </span>
              </div>

              <div className="bh2-main-controls">
                <div className="pp-segmented">
                  <button type="button" className={viewMode === 'cards' ? 'is-active' : ''} onClick={() => setViewMode('cards')} aria-label="Grid view"><AppstoreOutlined /></button>
                  <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-label="List view"><UnorderedListOutlined /></button>
                </div>
                <Tooltip title="Refresh buckets">
                  <button
                    type="button"
                    className="pp-ghost-btn"
                    onClick={handleRefresh}
                    disabled={isLoading && !isRefreshing}
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
                      <FolderOpenOutlined />
                    </span>
                    <span className="pp-stat-label">Total Hubs</span>
                  </div>
                  <span className="bh2-stat-pulse" />
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{metrics.total}</span>
                    <span className="pp-stat-period">hubs</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0].map(r => r * metrics.total)} color="#3b82f6" />
                  </div>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(100,116,139,0.10)', color: '#64748b' }}>
                      <LockOutlined />
                    </span>
                    <span className="pp-stat-label">Private Hubs</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{metrics.private}</span>
                    <span className="pp-stat-period">restricted</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.3, 0.25, 0.5, 0.65, 0.8, 1.0].map(r => r * metrics.private)} color="#64748b" />
                  </div>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                      <GlobalOutlined />
                    </span>
                    <span className="pp-stat-label">Public Hubs</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{metrics.public}</span>
                    <span className="pp-stat-period">shared</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map(r => r * metrics.public)} color="#3b82f6" />
                  </div>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981' }}>
                      <FileTextOutlined />
                    </span>
                    <span className="pp-stat-label">Total Tickets</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{metrics.tickets}</span>
                    <span className="pp-stat-period">items stored</span>
                  </div>
                  <div className="pp-stat-spark">
                    <Sparkline data={[0.0, 0.2, 0.3, 0.45, 0.6, 0.8, 1.0].map(r => r * metrics.tickets)} color="#10b981" />
                  </div>
                </div>
              </div>
            </div>

            {/* List or Cards */}
            <div className="bh2-main-body">
            {viewMode === "list" ? renderTable() : (
              <div className="bh2-list">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bh2-list-card bh2-list-card-skel">
                      <Skeleton active avatar paragraph={{ rows: 2 }} />
                    </div>
                  ))
                ) : filteredBuckets.length === 0 ? (
                  <div className="bh2-empty">
                    <div className="bh2-empty-icon">
                      <FolderOpenOutlined style={{ fontSize: 28, color: "#3b82f6" }} />
                    </div>
                    <Title level={5} style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                      {allBuckets.length === 0 ? "No buckets yet" : "No matches for these filters"}
                    </Title>
                    <Text
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
                ) : (
                  pagedBuckets.map((bucket) => {
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

            {!isLoading && filteredBuckets.length > 0 && (
              <div className="bh2-main-foot">
                <Text style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>
                  Showing <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredBuckets.length)}
                  </span> of <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>{filteredBuckets.length}</span> bucket{filteredBuckets.length !== 1 ? 's' : ''}
                </Text>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredBuckets.length}
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
        .bh2-sidebar-backdrop { display: none; }

        /* ── Sidebar show/hide toggle (always visible in top header) ── */
        .bh2-sidebar-show-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 8px;
          color: var(--text-slate-600, #475569);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .bh2-sidebar-show-toggle:hover {
          background: var(--bg-slate-100, #f1f5f9);
          border-color: var(--text-slate-400, #94a3b8);
          color: var(--text-slate-900, #0f172a);
        }
        .bh2-sidebar-show-toggle[aria-pressed='true'] {
          background: rgba(59, 130, 246, 0.10);
          border-color: rgba(59, 130, 246, 0.32);
          color: var(--premium-blue, #3b82f6);
        }
        [data-theme='dark'] .bh2-sidebar-show-toggle {
          background: #111720 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1;
        }
        [data-theme='dark'] .bh2-sidebar-show-toggle:hover {
          background: #1c232e !important;
          border-color: #475569 !important;
          color: #f1f5f9;
        }

        /* ── Desktop ≥1100px ────────────────────────────────── */
        @media (min-width: 1100px) {
          .bh2-shell-wrap.is-sidebar-closed .bh2-shell {
            grid-template-columns: 0px minmax(0, 1fr);
          }
          .bh2-shell-wrap.is-sidebar-closed > .bh2-shell > aside.bh2-sidebar {
            opacity: 0;
            padding-left: 0;
            padding-right: 0;
            pointer-events: none;
            border-right-color: transparent;
          }
        }

        .bh2-shell {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 54px);
          transition: grid-template-columns 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .bh2-main {
          min-width: 0;
          padding: 0;
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          grid-column: 2;
          height: calc(100vh - 54px);
          overflow: hidden;
        }
        .bh2-main-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 14px 24px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .bh2-main-body::-webkit-scrollbar { display: none; }
        [data-theme="dark"] .bh2-main {
          background: transparent !important;
        }

        /* ── Sidebar ─────────────────────────────────────────────── */
        .bh2-sidebar {
          width: 240px;
          background: var(--bg-pure-white);
          border-right: 1px solid var(--border-slate-200);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          align-self: flex-start;
          transition: opacity 0.3s ease, border-color 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), padding 0.3s ease;
          position: fixed;
          top: 54px;
          bottom: 0;
          height: calc(100vh - 54px);
          overflow: hidden;
          z-index: 10;
        }
        [data-theme="dark"] .bh2-sidebar {
          background: #0B0F1A !important;
          border-right: 1px solid #1F2937 !important;
        }

        .bh2-sidebar-top { 
          padding: 14px 14px 12px 14px; 
        }
        [data-theme="dark"] .bh2-sidebar-top {
        }
        .bh2-sidebar-brand { 
          display: flex; align-items: center; gap: 12px; 
          padding-bottom: 14px; margin-bottom: 10px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .bh2-sidebar-brand {
          border-bottom-color: #1F2937 !important;
        }
        .bh2-hero-icon-box {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: none;
          flex-shrink: 0;
        }
        /* removed dark override */
        .bh2-sidebar-title { font-size: 14.5px; font-weight: 700; color: var(--text-slate-900); margin: 0 0 2px 0; letter-spacing: -0.01em; line-height: 1.2; }
        [data-theme='dark'] .bh2-sidebar-title { color: #f1f5f9; }
        .bh2-sidebar-subtitle {
          font-size: 10.5px;
          color: var(--text-slate-400);
          font-weight: 700;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .bh2-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          background: linear-gradient(135deg, #3980f2 0%, #3980f2 100%) !important;
          border: none !important;
        }

        .bh2-sidebar-scroll {
          flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 6px 10px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .bh2-sidebar-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        .bh2-side-group { margin-bottom: 22px; }
        .bh2-side-label {
          font-size: 10px; font-weight: 800; color: var(--text-slate-400);
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 0 10px; margin-bottom: 8px;
        }
        .premium-range-picker{
          border-radius: 6px !important;
        }

        .bh2-view-btn {
          display: flex; align-items: center; gap: 8px; padding: 7px 10px;
          border-radius: 8px; background: transparent; border: none; cursor: pointer;
          width: 100%; text-align: left; font-family: inherit; font-size: 13px; font-weight: 500;
          color: var(--text-slate-600); transition: all 0.15s ease;
        }
        .bh2-view-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .bh2-view-btn.active { background: var(--bg-blue-50); color: var(--text-slate-900); font-weight: 600; }
        [data-theme='dark'] .bh2-view-btn { color: #94A3B8 !important; }
        [data-theme='dark'] .bh2-view-btn:hover { background: #161B22 !important; color: #FFFFFF !important; }
        [data-theme='dark'] .bh2-view-btn.active { background: rgba(59, 130, 246, 0.15) !important; color: #FFFFFF !important; }

        .bh2-view-icon { font-size: 14px; color: var(--text-slate-400); display: flex; align-items: center; }
        .bh2-view-btn.active .bh2-view-icon { color: #3b82f6 !important; }
        [data-theme='dark'] .bh2-view-icon { color: #94A3B8 !important; }
        [data-theme='dark'] .bh2-view-btn.active .bh2-view-icon { color: #3b82f6 !important; }

        .bh2-view-count {
          margin-left: auto; font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); padding: 2px 6px; border-radius: 6px;
        }
        .bh2-view-btn.active .bh2-view-count {
          background: rgba(59, 130, 246, 0.15); color: var(--text-blue-700);
        }
        [data-theme='dark'] .bh2-view-count { background: #161B22 !important; color: #94A3B8 !important; }
        [data-theme='dark'] .bh2-view-btn.active .bh2-view-count { background: rgba(59, 130, 246, 0.15) !important; color: #60a5fa !important; }

        .bh2-view-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .bh2-sidebar-item:hover {
          background: #161B22 !important;
        }
        .bh2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          color: var(--text-slate-900);
          font-weight: 600;
        }
        .bh2-sidebar-item.active .bh2-sidebar-item-icon,
        .bh2-sidebar-item.active .bh2-sidebar-item-dot {
          color: #3b82f6 !important;
          border: none !important;
        }
        [data-theme="dark"] .bh2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.15) !important;
          border: none !important;
          color: #FFFFFF !important;
          font-weight: 600 !important;
        }
        [data-theme="dark"] .bh2-sidebar-item.active .bh2-sidebar-item-icon,
        [data-theme="dark"] .bh2-sidebar-item.active .bh2-sidebar-item-dot {
          color: #60a5fa !important;
          border: none !important;
        }
        .bh2-sidebar-item-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
          background: var(--bg-slate-50);
          border-radius: 999px;
          padding: 0 6px;
          line-height: 1.6;
          border: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme="dark"] .bh2-sidebar-item-count {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        .bh2-sidebar-item.active .bh2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.14);
          border-color: rgba(59, 130, 246, 0.28);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-item.active .bh2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.15) !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
          color: #60a5fa !important;
        }

        /* Project row with expandable toggle */
        .bh2-sidebar-proj-row {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .bh2-sidebar-proj-row:hover {
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .bh2-sidebar-proj-row:hover {
          background: #161B22 !important;
        }
        .bh2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }
        [data-theme="dark"] .bh2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.15) !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        .bh2-sidebar-proj-toggle {
          flex-shrink: 0;
          width: 18px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-slate-500);
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.12s ease;
        }
        .bh2-sidebar-proj-toggle:hover {
          color: #1d4ed8;
        }
        .bh2-sidebar-proj-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 6px 10px 6px 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-700);
          text-align: left;
          min-width: 0;
        }
        [data-theme="dark"] .bh2-sidebar-proj-main {
          color: #cbd5e1 !important;
        }
        .bh2-sidebar-proj-row.active .bh2-sidebar-proj-main {
          color: var(--text-slate-900);
          font-weight: 600;
        }
        [data-theme="dark"] .bh2-sidebar-proj-row.active .bh2-sidebar-proj-main {
          color: #f1f5f9 !important;
          font-weight: 600 !important;
        }
 
        /* Nested buckets under project */
        .bh2-sidebar-children {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 2px 0 4px 22px;
          padding-left: 8px;
          border-left: 1px dashed var(--border-slate-200);
        }
        [data-theme="dark"] .bh2-sidebar-children {
          border-left-color: #1F2937 !important;
        }
        .bh2-sidebar-bucket {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-600);
          text-align: left;
          width: 100%;
          transition: background 0.12s ease, color 0.12s ease;
          min-width: 0;
        }
        .bh2-sidebar-bucket:hover {
          background: var(--bg-slate-50);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-bucket {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .bh2-sidebar-bucket:hover {
          background: #161B22 !important;
          color: #60a5fa !important;
        }
        .bh2-sidebar-bucket-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bh2-sidebar-bucket-label {
          flex: 1;
          font-size: 11.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bh2-sidebar-bucket-count {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-400);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .bh2-sidebar-proj-more {
          background: transparent;
          border: none;
          padding: 6px 8px;
          margin: 4px 8px 0;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-blue-600);
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .bh2-sidebar-proj-more:hover {
          background: var(--bg-blue-50);
          color: var(--text-blue-700);
        }
        [data-theme="dark"] .bh2-sidebar-proj-more {
          color: var(--text-blue-500);
        }
        [data-theme="dark"] .bh2-sidebar-proj-more:hover {
          background: rgba(59, 130, 246, 0.15) !important;
          color: var(--text-blue-400);
        }
        .bh2-sidebar-bucket-count {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-400);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .bh2-sidebar-proj-more {
          background: transparent;
          border: none;
          padding: 6px 8px;
          margin: 4px 8px 0;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-blue-600);
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .bh2-sidebar-proj-more:hover {
          background: var(--bg-blue-50);
          color: var(--text-blue-700);
        }
        [data-theme="dark"] .bh2-sidebar-proj-more {
          color: var(--text-blue-500);
        }
        [data-theme="dark"] .bh2-sidebar-proj-more:hover {
          background: rgba(59, 130, 246, 0.1);
          color: var(--text-blue-400);
        }
        .bh2-sidebar-empty-mini {
          padding: 6px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
          font-style: italic;
        }
        .bh2-sidebar-empty {
          padding: 10px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
        }
        .bh2-sidebar-divider {
          height: 1px;
          background: var(--border-slate-100);
          margin: 6px 4px;
        }
        [data-theme="dark"] .bh2-sidebar-divider {
          background: #1f2937 !important;
        }
        .bh2-sidebar-clear {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #ef4444; margin-top: 6px; width: auto; justify-content: flex-start;
        }
        .bh2-sidebar-clear:hover {
          opacity: 0.8;
        }
        [data-theme="dark"] .bh2-sidebar-clear {
          color: #ef4444 !important;
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
          .bh2-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }
          // .bh2-sidebar {
          //   padding: 12px 8px 14px 10px;
          // }
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
          .bh2-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 260px;
            height: 100vh;
            max-height: none;
            z-index: 1050;
            background: var(--bg-pure-white);
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            padding: 16px 12px;
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
            border-right: 1px solid var(--border-slate-200);
            border-top: none;
            border-bottom: none;
            overflow-y: auto;
            overflow-x: hidden;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          [data-theme='dark'] .bh2-sidebar {
            background: #0B0F1A !important;
            border-right-color: #1F2937 !important;
          }
          .bh2-shell-wrap.is-sidebar-open .bh2-sidebar {
            transform: translateX(0);
          }
          .bh2-shell-wrap.is-sidebar-closed .bh2-sidebar {
            transform: translateX(-100%);
          }
          .bh2-sidebar-backdrop {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.45);
            z-index: 1040;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .bh2-shell-wrap.is-sidebar-open .bh2-sidebar-backdrop {
            opacity: 1;
            pointer-events: auto;
          }
          .bh2-main {
            padding-left: 16px;
            padding-right: 16px;
          }
          .bh2-sidebar-divider {
            display: none !important;
          }
        }

        /* Sidebar collapses above content layout shifts */
        @media (max-width: 900px) {
          .bh2-page {
            margin: 0 -16px;
          }
          .bh2-main {
            padding: 14px 16px 28px;
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
            margin: 0 -8px;
          }
          .bh2-main {
            padding: 12px 12px 24px;
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
          .bh2-sidebar-section-head {
            padding: 4px 6px 6px;
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

        /* ── Proposals Status Cards ────────────────────────────────────────── */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; margin-top: 10px; padding: 0 24px; }
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
        @media (max-width: 800px) {
          .pp-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .pp-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
