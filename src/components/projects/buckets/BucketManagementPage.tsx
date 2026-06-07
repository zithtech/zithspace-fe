"use client";

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
} from "antd";
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
  { key: "11-20", label: "11 – 20 Tickets", color: "#3b82f6", test: (n) => n >= 11 && n <= 20 },
  { key: "21-30", label: "21 – 30 Tickets", color: "#3b82f6", test: (n) => n >= 21 && n <= 30 },
  { key: "31-50", label: "31 – 50 Tickets", color: "#f59e0b", test: (n) => n >= 31 && n <= 50 },
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

export default function BucketManagementPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canCreateTicketBucket, canUpdateTicketBucket, canDeleteTicketBucket } = usePermission();

  // ── State ────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityKey>("all");
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [defaultExpandSet, setDefaultExpandSet] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<SizeKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedBucketId, setExpandedBucketId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  // Unique owners across all buckets, for the Owner dropdown
  const ownerOptions = useMemo<SearchableDropdownOption[]>(() => {
    const seen = new Map<string, { name: string; email?: string }>();
    allBuckets.forEach((b) => {
      if (b.createdBy?.id && !seen.has(b.createdBy.id)) {
        seen.set(b.createdBy.id, {
          name: b.createdBy.name,
          email: b.createdBy.workEmail,
        });
      }
    });
    return Array.from(seen.entries()).map(([id, o]) => ({
      value: id,
      label: o.name || "Unknown",
      description: o.email,
      badge: (
        <Avatar
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

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="bh2-page">
      <TimeTrackingHeader
        style={{
          padding: "9.5px 32px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          marginBottom: 0,
          borderBottom: "1px solid var(--border-slate-200)",
        }}
        icon={<FolderOpenOutlined style={{ fontSize: 20, color: "#3b82f6" }} />}
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
              style={{ height: 36, fontWeight: 600 }}
            />
            {canCreateTicketBucket && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                style={{
                  height: 36,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  border: "none",
                }}
              >
                Create New Bucket
              </Button>
            )}
          </div>
        }
      />

      <div className="bh2-shell-wrap">
        <div className="bh2-shell">
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="bh2-sidebar">
            {/* Visibility */}
            <div className="bh2-sidebar-section">
              <div className="bh2-sidebar-section-head">
                <FilterOutlined style={{ fontSize: 10 }} />
                <span>Visibility</span>
              </div>
              <div className="bh2-sidebar-list">
                {(
                  [
                    { k: "all", label: "All", icon: <AppstoreOutlined style={{ fontSize: 11 }} />, count: visibilityCounts.all, color: "#64748b" },
                    { k: "public", label: "Public", icon: <GlobalOutlined style={{ fontSize: 11 }} />, count: visibilityCounts.public, color: "#10b981" },
                    { k: "private", label: "Private", icon: <LockOutlined style={{ fontSize: 11 }} />, count: visibilityCounts.private, color: "#f59e0b" },
                  ] as const
                ).map((item) => {
                  const active = visibilityFilter === item.k;
                  return (
                    <button
                      key={item.k}
                      className={`bh2-sidebar-item ${active ? "active" : ""}`}
                      onClick={() => setVisibilityFilter(item.k as VisibilityKey)}
                    >
                      <span
                        className="bh2-sidebar-item-icon"
                        style={{ color: item.color, background: `${item.color}14`, borderColor: `${item.color}33` }}
                      >
                        {item.icon}
                      </span>
                      <span className="bh2-sidebar-item-label">{item.label}</span>
                      <span className="bh2-sidebar-item-count">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bh2-sidebar-divider" />

            {/* Projects + nested buckets */}
            <div className="bh2-sidebar-section">
              <div className="bh2-sidebar-section-head">
                <ProjectOutlined style={{ fontSize: 10 }} />
                <span>Projects</span>
                <span className="bh2-sidebar-section-count">{projectOrder.length}</span>
              </div>
              <div className="bh2-sidebar-list">
                <button
                  className={`bh2-sidebar-item ${!selectedProjectKey ? "active" : ""}`}
                  onClick={() => setSelectedProjectKey(null)}
                >
                  <span className="bh2-sidebar-item-icon bh2-icon-all">
                    <AppstoreOutlined style={{ fontSize: 11 }} />
                  </span>
                  <span className="bh2-sidebar-item-label">All projects</span>
                  <span className="bh2-sidebar-item-count">{allBuckets.length}</span>
                </button>

                {projectOrder.map((proj, i) => {
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
                          <span
                            className="bh2-sidebar-item-icon"
                            style={{ background: `${color}14`, color, borderColor: `${color}33` }}
                          >
                            {initial}
                          </span>
                          <span className="bh2-sidebar-item-label">{proj.name}</span>
                          <span className="bh2-sidebar-item-count">{buckets.length}</span>
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

                {projectOrder.length === 0 && !isLoading && (
                  <div className="bh2-sidebar-empty">No projects yet</div>
                )}
              </div>
            </div>

            <div className="bh2-sidebar-divider" />

            {/* Bucket Size */}
            <div className="bh2-sidebar-section">
              <div className="bh2-sidebar-section-head">
                <FileTextOutlined style={{ fontSize: 10 }} />
                <span>Bucket Size</span>
              </div>
              <div className="bh2-sidebar-list">
                {SIZE_BUCKETS.map((seg) => {
                  const active = sizeFilter === seg.key;
                  return (
                    <button
                      key={seg.key}
                      className={`bh2-sidebar-item ${active ? "active" : ""}`}
                      onClick={() => setSizeFilter(seg.key)}
                    >
                      <span className="bh2-sidebar-item-dot" style={{ background: seg.color }} />
                      <span className="bh2-sidebar-item-label">{seg.label}</span>
                      <span className="bh2-sidebar-item-count">{sizeCounts[seg.key] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <>
                <div className="bh2-sidebar-divider" />
                <button className="bh2-sidebar-clear" onClick={resetFilters}>
                  <ReloadOutlined style={{ fontSize: 10 }} />
                  Clear filters · {activeFilterCount}
                </button>
              </>
            )}
          </aside>

          {/* ── Main ──────────────────────────────────────────────── */}
          <main className="bh2-main">
            {/* Toolbar */}
            <div className="bh2-toolbar">
              <div className="bh2-toolbar-title">
                <span className="bh2-toolbar-icon">
                  <FolderOpenOutlined style={{ fontSize: 13, color: "#3b82f6" }} />
                </span>
                <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  Buckets
                </Text>
                <span className="bh2-toolbar-chip">
                  {filteredBuckets.length} {filteredBuckets.length === 1 ? "result" : "results"}
                </span>
              </div>

              <div className="bh2-toolbar-filters">
                <SearchableDropdown
                  placeholder="Visibility"
                  options={visibilityOptions}
                  value={visibilityFilter === "all" ? undefined : visibilityFilter}
                  onChange={(v) =>
                    setVisibilityFilter((v as VisibilityKey) || "all")
                  }
                  itemNoun="options"
                  style={{ height: 32, minWidth: 140, borderRadius: 8 }}
                  width={220}
                />
                <SearchableDropdown
                  placeholder="Owner"
                  options={ownerOptions}
                  value={ownerFilter || undefined}
                  onChange={(v) => setOwnerFilter(v || null)}
                  itemNoun="owners"
                  style={{ height: 32, minWidth: 160, borderRadius: 8 }}
                  width={260}
                />
                <DatePicker.RangePicker
                  size="small"
                  value={dateRange as any}
                  onChange={(v) => setDateRange(v as any)}
                  format="MMM D, YYYY"
                  allowEmpty={[true, true]}
                  className="bh2-range-picker"
                />
              </div>

              <div className={`bh2-search-box ${searchQuery ? "active" : ""}`}>
                <SearchOutlined
                  style={{ color: searchQuery ? "#3b82f6" : "#94a3b8", fontSize: 13 }}
                />
                <Input
                  placeholder="Search bucket name or description"
                  variant="borderless"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    padding: "4px 0",
                    flex: 1,
                    background: "transparent",
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                />
              </div>
            </div>

            {/* List */}
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
                      <span className="bh2-list-stripe" style={{ background: accent }} />

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
                              background: `linear-gradient(135deg, ${accent}22 0%, ${accent}3a 100%)`,
                              color: accent,
                              borderColor: `${accent}66`,
                            }}
                          >
                            <span className="bh2-list-avatar-letter">{initial}</span>
                          </div>

                          <div className="bh2-list-row-segments">
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

                            <span className="bh2-list-row-div" />

                            <span className="bh2-list-seg bh2-list-seg-bucket">
                              <span className="bh2-list-seg-label">Bucket:</span>
                              <span className="bh2-list-seg-name" title={bucket.name}>
                                {bucket.name}
                                {bucket.userRole === "owner" && (
                                  <Tooltip title="You own this hub">
                                    <CrownOutlined style={{ fontSize: 11, marginLeft: 6, color: "#f59e0b" }} />
                                  </Tooltip>
                                )}
                              </span>
                            </span>

                            <span className="bh2-list-row-div" />

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
                            <Avatar
                              size={26}
                              style={{
                                background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {initialsOf(owner?.name)}
                            </Avatar>
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

            {!isLoading && filteredBuckets.length > 0 && (
              <div className="bh2-pagination">
                <Text className="bh2-pagination-meta">
                  <b>{(currentPage - 1) * pageSize + 1}</b>–
                  <b>{Math.min(currentPage * pageSize, filteredBuckets.length)}</b>{" "}
                  of <b>{filteredBuckets.length}</b>{" "}
                  {filteredBuckets.length === 1 ? "bucket" : "buckets"}
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
                  size="small"
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
          margin: 0 -24px;
          background: #f8fafc;
          min-height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
        }
        [data-theme="dark"] .bh2-page {
          background: var(--bg-pure-white) !important;
        }

        .bh2-shell-wrap {
          flex: 1;
        }
        .bh2-shell {
          display: grid;
          grid-template-columns: 268px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 64px - 52px);
        }
        .bh2-main {
          min-width: 0;
          padding: 14px 24px 32px;
          background: #f8fafc;
        }
        [data-theme="dark"] .bh2-main {
          background: transparent !important;
        }

        /* ── Sidebar ─────────────────────────────────────────────── */
        .bh2-sidebar {
          background: var(--bg-slate-50);
          border-right: 1px solid var(--border-slate-200);
          padding: 12px 12px 14px 20px;
          position: sticky;
          top: 52px;
          height: calc(100vh - 64px - 52px);
          overflow-y: auto;
          align-self: start;
          /* Hide the scrollbar UI but keep scrolling */
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        [data-theme="dark"] .bh2-sidebar {
          background: #0f1419 !important;
          border-right-color: #1f2937 !important;
        }
        .bh2-sidebar::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .bh2-sidebar-section {
          padding: 4px 2px;
        }
        .bh2-sidebar-section-head {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px 8px;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .bh2-sidebar-section-head {
          color: #94a3b8 !important;
        }
        .bh2-sidebar-section-count {
          margin-left: auto;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          padding: 0 6px;
          font-size: 9.5px;
          color: var(--text-slate-500);
          letter-spacing: 0;
          text-transform: none;
        }
        [data-theme="dark"] .bh2-sidebar-section-count {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }

        .bh2-sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .bh2-sidebar-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 10px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-700);
          text-align: left;
          width: 100%;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
          min-width: 0;
        }
        .bh2-sidebar-item:hover {
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .bh2-sidebar-item {
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .bh2-sidebar-item:hover {
          background: #1c232e !important;
        }
        .bh2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.18) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
          color: #60a5fa !important;
        }
        .bh2-sidebar-item-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        .bh2-icon-all {
          background: var(--bg-slate-50);
          border-color: var(--border-slate-200);
          color: var(--text-slate-600);
        }
        [data-theme="dark"] .bh2-icon-all {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .bh2-sidebar-item-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin: 0 6px 0 7px;
        }
        .bh2-sidebar-item-label {
          flex: 1;
          font-size: 12.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
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
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }
        .bh2-sidebar-item.active .bh2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.14);
          border-color: rgba(59, 130, 246, 0.28);
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-item.active .bh2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.22) !important;
          border-color: rgba(59, 130, 246, 0.38) !important;
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
          background: #1c232e !important;
        }
        .bh2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }
        [data-theme="dark"] .bh2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.18) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
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
          color: #1d4ed8;
        }
        [data-theme="dark"] .bh2-sidebar-proj-row.active .bh2-sidebar-proj-main {
          color: #60a5fa !important;
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
          border-left-color: #2d3748 !important;
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
          background: #1c232e !important;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 6px;
          padding: 8px;
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 8px;
          color: var(--text-slate-500);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.12s ease, border-color 0.12s ease;
        }
        .bh2-sidebar-clear:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .bh2-sidebar-clear {
          border-color: #2d3748 !important;
          color: #94a3b8 !important;
        }

        /* ── Main toolbar ───────────────────────────────────────── */
        .bh2-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          position: sticky;
          top: 52px;
          z-index: 10;
          background: var(--bg-pure-white);
          margin: -14px -24px 0;
          padding: 12px 24px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .bh2-toolbar {
          background: #0d1117 !important;
          border-bottom-color: #1f2937 !important;
        }
        .bh2-toolbar-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bh2-toolbar-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-left: auto;
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
        /* RangePicker — match the SearchableDropdown trigger height/border */
        .bh2-range-picker {
          height: 32px !important;
          border-radius: 8px !important;
          font-size: 12px;
        }
        .bh2-range-picker.ant-picker {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .bh2-range-picker.ant-picker {
          background: #161b22 !important;
          border-color: #2d3748 !important;
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
          background: #1c232e !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
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
          background: #161b22 !important;
          border-color: #2d3748 !important;
        }
        [data-theme="dark"] .bh2-search-box.active {
          border-color: rgba(59, 130, 246, 0.5) !important;
        }

        /* ── List cards ─────────────────────────────────────────── */
        .bh2-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 10px;
        }

        /* ── Sticky pagination footer ──────────────────────────── */
        .bh2-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: sticky;
          bottom: 0;
          z-index: 10;
          background: var(--bg-pure-white);
          margin: 14px -24px -32px;
          padding: 12px 24px;
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme="dark"] .bh2-pagination {
          background: #0d1117 !important;
          border-top-color: #1f2937 !important;
        }
        .bh2-pagination-meta {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
        }
        .bh2-pagination-meta b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        [data-theme="dark"] .bh2-pagination-meta b {
          color: #f1f5f9 !important;
        }
        .bh2-list-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          /* When we smooth-scroll a card into view on Manage-Tickets click,
             land its top 120px below the viewport so it clears the sticky
             page header (~52px) + sticky toolbar (~60px). */
          scroll-margin-top: 120px;
          padding: 10px 14px 10px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        [data-theme="dark"] .bh2-list-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .bh2-list-card:hover {
          border-color: var(--row-accent, #3b82f6);
        }
        [data-theme="dark"] .bh2-list-card:hover {
          background: #1c232e !important;
        }
        .bh2-list-card-skel {
          min-height: 96px;
        }
        .bh2-list-stripe {
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          opacity: 0.85;
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
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .bh2-list-seg-label {
          color: #94a3b8 !important;
        }
        .bh2-list-seg-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-700);
          letter-spacing: -0.005em;
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
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
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
          border-color: var(--row-accent, #3b82f6) !important;
          color: var(--row-accent, #3b82f6) !important;
          background: var(--bg-slate-50) !important;
        }
        .bh2-foot-btn:disabled {
          opacity: 0.5;
        }
        [data-theme="dark"] .bh2-foot-btn {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .bh2-foot-btn:hover:not(:disabled) {
          background: #1c232e !important;
        }

        /* Manage Tickets button */
        .bh2-manage-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: transparent;
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          color: var(--text-slate-600);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .bh2-manage-btn:hover {
          color: var(--row-accent, #3b82f6);
          border-color: var(--row-accent, #3b82f6);
          background: var(--bg-slate-50);
        }
        .bh2-manage-btn.active {
          color: var(--row-accent, #3b82f6);
          border-color: var(--row-accent, #3b82f6);
          background: rgba(59, 130, 246, 0.08);
        }
        [data-theme="dark"] .bh2-manage-btn {
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .bh2-manage-btn:hover {
          background: #1c232e !important;
        }
        [data-theme="dark"] .bh2-manage-btn.active {
          background: rgba(59, 130, 246, 0.18) !important;
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
          .bh2-sidebar {
            padding: 12px 8px 14px 14px;
          }
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

        /* Sidebar collapses above content */
        @media (max-width: 900px) {
          .bh2-page {
            margin: 0 -16px;
          }
          .bh2-shell {
            grid-template-columns: 1fr;
          }
          .bh2-sidebar {
            position: relative;
            top: 0;
            height: auto;
            max-height: 320px;
            padding: 10px 16px 12px;
            border-right: none;
            border-bottom: 1px solid var(--border-slate-200);
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
          /* When sidebar is above the main column, drop the desktop scroll-margin
             since the user no longer has to clear a fixed left rail. */
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
          /* Sidebar items more compact */
          .bh2-sidebar {
            padding: 8px 14px 10px;
            max-height: 280px;
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
      `}</style>
    </div>
  );
}
