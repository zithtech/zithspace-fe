"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  Input,
  InputNumber,
  Tag,
  Avatar,
  Table,
  Empty,
  Modal,
  Popconfirm,
  Radio,
  Popover,
  Tooltip,
  Divider,
  Collapse,
  notification,
  Dropdown,
  MenuProps,
  Badge,
  Progress,
  Spin,
  Segmented,
  Switch,
  App,
  type TableProps,
} from "antd";
import {
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  AppstoreOutlined,
  BarsOutlined,
  FilterOutlined,
  TagsOutlined,
  ExpandAltOutlined,
  UserOutlined,
  PlusOutlined,
  MinusOutlined,
  CaretRightOutlined,
  ArrowLeftOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  ShareAltOutlined,
  MoreOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  CaretDownOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  FolderAddOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  ColumnHeightOutlined,
  LineChartOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  FlagOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  PaperClipOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import dayjs from "dayjs";
import TicketService, { Ticket } from "@/services/ticketService";
import { ProjectService } from "@/services/projectService";
import {
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getTypeColor,
  getPlatformColor,
  getTaskLevelColor,
  getStackColor
} from "@/utils/ticketUtils";
import { SettingsService } from "@/services/settingsService";
import { useTickets, useKanbanTickets, useUpdateTicket, useDeleteTicket, useAllTicketTags } from "@/hooks/useTickets";
import { useAllProjects, useMembers } from "@/hooks/useGlobalData";
import { InlineCreateTicket } from "./InlineCreateTicket";
import { TicketFilters } from "./TicketFilters";
import { TicketKanban } from './kanban/TicketKanban';
import ReleasePlanService from "@/services/releasePlanService";
import { TicketDetailDrawer } from "./drawer/TicketDetailDrawer";
import { SprintCompletionModal } from "./sprint-completion";
import { SprintCreationForm, type SprintFormData } from "./sprint-completion/SprintCreationForm";
import { ManualCreateTicketModal } from "./ManualCreateTicketModal";
import { AiCreateTicketModal } from "./AiCreateTicketModal";
import TicketSkeleton from "./TicketSkeleton";
import TicketSidebar from "./TicketSidebar";
import TicketFilterPill from "./TicketFilterPill";
import { TablePreferenceService } from "@/services/tablePreferenceService";

const { Title, Text } = Typography;

type TicketDensity = "compact" | "comfortable" | "spacious";
const TICKETS_TABLE_KEY = "tickets_list_v1";
const TICKETS_TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: "ticketNumber", label: "ID" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "type", label: "Type" },
  { key: "storyPoint", label: "Story Points" },
  { key: "platform", label: "Platform" },
  { key: "stack", label: "Stack" },
  { key: "taskLevel", label: "Task Level" },
  { key: "tags", label: "Tags" },
  { key: "estimateHours", label: "Estimate (h)" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "reportTo", label: "Report To" },
  { key: "createdBy", label: "Created By" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Updated" },
  { key: "actions", label: "Actions" },
];

// Columns hidden by default (everything outside the canonical 8: ID, Title,
// Status, Priority, Assignee, Type, SP, Actions).
const TICKETS_DEFAULT_HIDDEN_COLS: Record<string, boolean> = {
  platform: true,
  stack: true,
  taskLevel: true,
  tags: true,
  estimateHours: true,
  startDate: true,
  endDate: true,
  reportTo: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
};

interface FilterState {
  status: string[];
  priority: string[];
  assignee: string[];
  createdBy: string[];
  type: string[];
  tags: string[];
  search: string;
  ticketIds: string[];
}

interface TicketListProps {
  projectId: string;
  projectName: string;
  projectCode: string;
}

export default function TicketList({ projectId, projectName, projectCode }: TicketListProps) {
  const { user } = useAuth();
  const { 
    canCreateTicket, 
    canReadTicket, 
    canUpdateTicket, 
    canDeleteTicket, 
    canAssignTicket,
    canManageTickets,
    canCreateTicketPlan,
    canReadTicketPlan,
    canUpdateTicketPlan
  } = usePermission();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message, modal, notification } = App.useApp();
  // const [modal, contextHolder] = Modal.useModal();

  // Local state for filters only
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    assignee: [],
    createdBy: [],
    type: [],
    tags: [],
    search: "",
    ticketIds: [],
  });
  // Label that explains an active ticketIds filter ("commented tickets", "tickets with attachments")
  // Quick-filter toggles for the sidebar's "Show commented tickets" and
  // "Show tickets with attachments" CTAs. Each can be on independently; when
  // either is on the right side switches to a unified "filtered view" that
  // pulls matching tickets from across the project (no sprint/backlog scope).
  const [activeQuickFilters, setActiveQuickFilters] = useState<{
    commented: boolean;
    attached: boolean;
    overdue: boolean;
  }>({ commented: false, attached: false, overdue: false });
  // Remember which section the user came from so the filtered view can offer
  // a "Back to Sprint / Backlog" button. Defaults to 'sprint' (the initial section).
  const [previousSection, setPreviousSection] = useState<"sprint" | "backlog">("sprint");

  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [kanbanScope, setKanbanScope] = useState<'active' | 'backlog'>('active');
  // "My Tickets" toggle in the active-sprint header — when on, the sprint
  // table is filtered to tickets assigned to the signed-in user.
  const [myTicketsOnly, setMyTicketsOnly] = useState(false);
  // Calendar view state
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs());
  const [calLegendExpanded, setCalLegendExpanded] = useState(false);
  const CAL_LEGEND_LIMIT = 8;
  const SPRINT_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6', '#a855f7'];

  // Table settings — density + column visibility, persisted per-user in DB
  // via user_table_preferences (raw psql, no Prisma).
  const [tableDensity, setTableDensity] = useState<TicketDensity>('comfortable');
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>(TICKETS_DEFAULT_HIDDEN_COLS);
  const [tablePrefsLoaded, setTablePrefsLoaded] = useState(false);
  const tablePrefsSaveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await TablePreferenceService.get<{
          density?: TicketDensity;
          hiddenCols?: Record<string, boolean>;
        }>(TICKETS_TABLE_KEY);
        if (cancelled) return;
        if (saved?.density && ['compact', 'comfortable', 'spacious'].includes(saved.density)) {
          setTableDensity(saved.density);
        }
        if (saved?.hiddenCols && typeof saved.hiddenCols === 'object') {
          // Merge: explicit user choices win, but newly-added columns inherit
          // their default-hidden state for users who saved before they existed.
          setHiddenCols({ ...TICKETS_DEFAULT_HIDDEN_COLS, ...saved.hiddenCols });
        }
      } catch (err) {
        console.warn('Failed to load ticket table preferences', err);
      } finally {
        if (!cancelled) setTablePrefsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tablePrefsLoaded) return;
    if (tablePrefsSaveTimer.current !== null) {
      window.clearTimeout(tablePrefsSaveTimer.current);
    }
    tablePrefsSaveTimer.current = window.setTimeout(() => {
      TablePreferenceService.save(TICKETS_TABLE_KEY, {
        density: tableDensity,
        hiddenCols,
      }).catch((err) => console.warn('Failed to save ticket table preferences', err));
    }, 300);
    return () => {
      if (tablePrefsSaveTimer.current !== null) {
        window.clearTimeout(tablePrefsSaveTimer.current);
        tablePrefsSaveTimer.current = null;
      }
    };
  }, [tablePrefsLoaded, tableDensity, hiddenCols]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  // Sidebar visibility on narrow screens. Below ~1100px the sidebar is a
  // drawer overlay (default closed); above it stays inline in the shell.
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1100px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1100px)");
    const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [allTicketIds, setAllTicketIds] = useState<string[]>([]);
  const [sidebarActiveSection, setSidebarActiveSection] = useState<"sprint" | "backlog" | "filtered" | null>("sprint");

  // Sprint Completion Modal state
  const [sprintCompletionModalOpen, setSprintCompletionModalOpen] = useState(false);

  // Create Sprint Modal state
  const [createSprintModalOpen, setCreateSprintModalOpen] = useState(false);
  const [creatingSprintLoading, setCreatingSprintLoading] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<{
    ticketId: string;
    field: "status" | "assignee" | "title" | "priority" | "type" | "storyPoint";
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState("");
  const [backlogSearchValue, setBacklogSearchValue] = useState("");
  const [debouncedBacklogSearch, setDebouncedBacklogSearch] = useState("");
  const [backlogStatusFilter, setBacklogStatusFilter] = useState<string[]>([]);
  const [recentTicket, setRecentTicket] = useState<Ticket | null>(null);
  const [activeSelectedRowKeys, setActiveSelectedRowKeys] = useState<React.Key[]>([]);
  const [backlogSelectedRowKeys, setBacklogSelectedRowKeys] = useState<React.Key[]>([]);
  const recentTicketCardRef = useRef<HTMLDivElement | null>(null);

  // Measure the sticky top header so the sidebar and section anchors line up
  // with its real rendered height (it can wrap on narrow screens). Cascades
  // into a CSS variable used by the sidebar + scroll-margin computations.
  const saasHeaderRef = useRef<HTMLDivElement | null>(null);
  const [saasHeaderHeight, setSaasHeaderHeight] = useState<number>(56);
  useEffect(() => {
    const el = saasHeaderRef.current;
    if (!el) return;
    const update = () => setSaasHeaderHeight(el.offsetHeight || 56);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure active-sprint section head so the table column headers stick flush below it
  const activeSprintCardRef = useRef<HTMLDivElement | null>(null);
  const [activeSprintHeadOffset, setActiveSprintHeadOffset] = useState<number>(128);
  useEffect(() => {
    const el = activeSprintCardRef.current?.querySelector('.tl-section-head') as HTMLElement | null;
    if (!el) return;
    const update = () => setActiveSprintHeadOffset(saasHeaderHeight + el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeSprintCardRef.current, saasHeaderHeight]);

  // ── Sprint header: collapse Progress/Tickets/Timeline cluster to a compact
  // popover button when the section-head wraps to a second row. Detection is
  // JS-based (not CSS media/container queries) because the wrap depends on
  // the actual rendered cluster widths — sprint-name length, sidebar state,
  // etc. — not just viewport or container width.
  //
  // Hysteresis: once collapsed at width W, we only re-expand when the
  // section-head grows past W + 100px. Prevents oscillation since the
  // compact button is much narrower than inline stats and would otherwise
  // re-fit immediately, triggering a re-wrap → re-collapse loop.
  const [sprintHeadEl, setSprintHeadEl] = useState<HTMLDivElement | null>(null);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const collapsedWidthRef = useRef<number | null>(null);
  useEffect(() => {
    if (!sprintHeadEl) return;
    const measure = () => {
      const w = sprintHeadEl.offsetWidth;
      if (statsCollapsed) {
        const expandAt = (collapsedWidthRef.current ?? 0) + 100;
        if (w >= expandAt) {
          collapsedWidthRef.current = null;
          setStatsCollapsed(false);
        }
        return;
      }
      // Detect wrap: last direct child sits lower than first direct child.
      const children = sprintHeadEl.children;
      if (children.length < 2) return;
      const first = children[0] as HTMLElement;
      const last = children[children.length - 1] as HTMLElement;
      if (last.offsetTop > first.offsetTop + 3) {
        collapsedWidthRef.current = w;
        setStatsCollapsed(true);
      }
    };
    // Defer the first measurement a tick so antd's Space children settle.
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(sprintHeadEl);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sprintHeadEl, statsCollapsed]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearchValue }));
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearchValue]);

  useEffect(() => {
    // Immediate reset when cleared
    if (backlogSearchValue.length === 0) {
      setDebouncedBacklogSearch("");
      return;
    }

    const handler = setTimeout(() => {
      // Only set debounced value if length is >= 2, otherwise clear it
      if (backlogSearchValue.length >= 2) {
        setDebouncedBacklogSearch(backlogSearchValue);
      } else {
        setDebouncedBacklogSearch("");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [backlogSearchValue]);



  // Use cached global data hooks
  const { data: projects = [], isLoading: projectsLoading } = useAllProjects();
  const { data: members = [], isLoading: membersLoading } = useMembers();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
  });







  // Add this after all useState declarations
  const [dbStatusOptions, setDbStatusOptions] = useState<{ label: string; value: string }[]>([]);
  const [dbPriorityOptions, setDbPriorityOptions] = useState<{ label: string; value: string }[]>([]);
  const [dbTypeOptions, setDbTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [dbPlatformOptions, setDbPlatformOptions] = useState<{ label: string; value: string }[]>([]);
  const [dbStackOptions, setDbStackOptions] = useState<{ label: string; value: string }[]>([]);
  const [dbTaskLevelOptions, setDbTaskLevelOptions] = useState<{ label: string; value: string }[]>([]);

  // Add this useEffect to fetch from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await SettingsService.getDropdownOptions();

        // Status options from DB
        const statusOpts = (options.status || [])
          .filter(opt => opt.isActive)
          .sort((a, b) => a.order - b.order)
          .map(opt => ({ label: opt.label, value: opt.value }));
        setDbStatusOptions(statusOpts);

        // Priority options from DB
        const priorityOpts = (options.priority || [])
          .filter(opt => opt.isActive)
          .sort((a, b) => a.order - b.order)
          .map(opt => ({ label: opt.label, value: opt.value }));
        setDbPriorityOptions(priorityOpts);

        // Type options from DB
        const typeOpts = (options.taskType || [])
          .filter(opt => opt.isActive)
          .sort((a, b) => a.order - b.order)
          .map(opt => ({ label: opt.label, value: opt.value }));
        setDbTypeOptions(typeOpts);

        // Platform options from DB
        const platformOpts = (options.platform || [])
          .filter(opt => opt.isActive)
          .sort((a, b) => a.order - b.order)
          .map(opt => ({ label: opt.label, value: opt.value }));
        setDbPlatformOptions(platformOpts);

        // Stack options from DB
        const stackOpts = (options.stack || [])
          .filter(opt => opt.isActive)
          .sort((a, b) => a.order - b.order)
          .map(opt => ({ label: opt.label, value: opt.value }));
        setDbStackOptions(stackOpts);

        // Task Level options from DB
        const taskLevelOpts = (options.taskLevel || [])
          .filter(opt => opt.isActive)
          .sort((a, b) => a.order - b.order)
          .map(opt => ({ label: opt.label, value: opt.value }));
        setDbTaskLevelOptions(taskLevelOpts);

      } catch (error) {
        console.error('Error fetching dropdown options:', error);
      }
    };

    fetchOptions();
  }, []);

  const finalStatusOptions = useMemo(() => {
    const opts = dbStatusOptions.length > 0 ? [...dbStatusOptions] : [...STATUS_OPTIONS];
    // Ensure "Completed" is always available for archive workflows
    if (!opts.some(o => o.value?.toLowerCase() === 'completed')) {
      opts.push({ label: "Completed", value: "completed" });
    }
    return opts;
  }, [dbStatusOptions]);

  const finalPriorityOptions = useMemo(() => {
    return dbPriorityOptions.length > 0 ? dbPriorityOptions : PRIORITY_OPTIONS;
  }, [dbPriorityOptions]);

  const finalTypeOptions = useMemo(() => {
    return dbTypeOptions.length > 0 ? dbTypeOptions : TYPE_OPTIONS;
  }, [dbTypeOptions]);

  const activeColumnsSet = useMemo(() => {
    const set = new Set(TICKETS_TOGGLEABLE_COLUMNS.map(c => c.key));
    // Filter out columns that have NO active options in settings
    if (dbPlatformOptions.length === 0) set.delete('platform');
    if (dbStackOptions.length === 0) set.delete('stack');
    if (dbTaskLevelOptions.length === 0) set.delete('taskLevel');
    return set;
  }, [dbPlatformOptions, dbStackOptions, dbTaskLevelOptions]);

  const toggleableColumns = useMemo(() => {
    return TICKETS_TOGGLEABLE_COLUMNS.filter(c => activeColumnsSet.has(c.key));
  }, [activeColumnsSet]);

  // --- React Query Hooks ---

  // Base params (without pagination) for filters.
  // "My Tickets" toggle (top header) overrides the assignee filter to the
  // signed-in user — applies to whichever section (Sprint / Backlog /
  // Filtered) the user is currently viewing.
  const baseQueryParams = {
    projectId, // From props, mandatory project context
    status: filters.status.length > 0 ? filters.status.join(",") : undefined,
    priority: filters.priority.length > 0 ? filters.priority.join(",") : undefined,
    assigneeId:
      myTicketsOnly && user?.id
        ? user.id
        : filters.assignee.length > 0
          ? filters.assignee.join(",")
          : undefined,
    createdById:
      filters.createdBy.length > 0 ? filters.createdBy.join(",") : undefined,
    type: filters.type.length > 0 ? filters.type.join(",") : undefined,
    tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,
    search: filters.search || undefined,
    ticketIds: filters.ticketIds.length > 0 ? filters.ticketIds.join(",") : undefined,
  };

  // Fetch Active Sprint to get ID for assignments (scoped to project)
  const { data: activeSprints } = useQuery({
    queryKey: ['activeSprint', projectId],
    queryFn: () => ReleasePlanService.getActiveReleasePlans(projectId),
    staleTime: 60 * 1000,
    enabled: !!projectId && canReadTicketPlan,
  });
  const activeSprint = activeSprints && activeSprints.length > 0 ? activeSprints[0] : null;

  // Recent comments + attachments for the sidebar (project-scoped, tenant-aware,
  // and user-relevance filtered: items the current user authored OR items on
  // tickets assigned to them).
  const { data: recentActivity } = useQuery({
    queryKey: ['ticketRecentActivity', projectId, user?.id],
    queryFn: () => TicketService.getRecentActivity({ projectId, userId: user?.id, limit: 10 }),
    enabled: !!projectId && !!user?.id && canReadTicket,
    staleTime: 30 * 1000,
  });

  // Persist current project as last visited
  useEffect(() => {
    if (projectId) {
      localStorage.setItem('lastProjectId', projectId);
    }
  }, [projectId]);

  // Query Params for Active Sprint List (NO PAGINATION - fetch ALL tickets)
  const activeSprintParams = {
    ...baseQueryParams,
    sprintId: 'active',
    limit: 9999 // Fetch all tickets in active sprint (no pagination)
  };

  // Combine global and local backlog search
  const backlogCombinedSearch = [filters.search, debouncedBacklogSearch].filter(Boolean).join(" ");

  // Query Params for Backlog List (WITH PAGINATION)
  const backlogParams = {
    ...baseQueryParams,
    status: backlogStatusFilter.length > 0 ? backlogStatusFilter.join(",") : baseQueryParams.status,
    sprintId: 'null',
    search: backlogCombinedSearch || undefined,
    page: pagination.current,
    limit: pagination.pageSize,
  };

  // 1. Fetch Active Sprint Tickets
  const {
    data: activeSprintData,
    isLoading: activeSprintLoading,
    isFetching: activeSprintFetching,
    refetch: refetchActive
  } = useTickets(activeSprintParams);

  // 2. Fetch Backlog Tickets
  const {
    data: backlogData,
    isLoading: backlogLoading,
    isFetching: backlogFetching,
    refetch: refetchBacklog
  } = useTickets(backlogParams);

  // Default "All Tickets" query (Legacy support or if we toggle off split view? 
  // User wants SPLIT view. So we might not need the unified query anymore for List view.
  // But we keep it if we want to support filtering without sprint context?
  // User asked for specific split. We will use these two data sources.)

  const activeTickets = activeSprintData?.data || [];
  const backlogTickets = backlogData?.data || [];
  const totalBacklog = backlogData?.pagination?.total || 0;

  // 3. Fetch ALL Active Sprint Tickets for progress calculation (UNFILTERED).
  // Intentionally NOT gated on `activeSprint` resolving — the backend
  // already returns an empty set if there's no active sprint, and gating
  // here causes the sidebar's "Your Sprint Contribution" stats to flash
  // empty before the activeSprint query lands.
  const { data: overallSprintData } = useTickets({
    projectId,
    sprintId: 'active',
    limit: 9999
  }, {
    enabled: !!projectId && canReadTicket,
  });
  const overallSprintTickets = overallSprintData?.data || [];

  // Sidebar source-of-truth: union of the unfiltered "overall" sprint pool
  // and the right-side `activeTickets`, deduped by id. The user already sees
  // their tickets on the right, so this guarantees the sidebar sees them too
  // even if the parallel `overallSprintData` query is delayed or empty.
  const sidebarSprintPool = useMemo<Ticket[]>(() => {
    const byId = new Map<string, Ticket>();
    for (const t of overallSprintTickets) byId.set(t.id, t);
    for (const t of activeTickets) if (!byId.has(t.id)) byId.set(t.id, t);
    return Array.from(byId.values());
  }, [overallSprintTickets, activeTickets]);

  // Quick-filter derived state — drives the unified "filtered view" section.
  const isFilteredView = activeQuickFilters.commented || activeQuickFilters.attached || activeQuickFilters.overdue;
  const recentCommentedIds = useMemo(
    () => Array.from(new Set((recentActivity?.comments || []).map((c) => c.ticket.id))),
    [recentActivity]
  );
  const recentAttachedIds = useMemo(
    () => Array.from(new Set((recentActivity?.attachments || []).map((a) => a.ticket.id))),
    [recentActivity]
  );
  const overdueIds = useMemo(
    () => Array.from(new Set((recentActivity?.overdue || []).map((o) => o.id))),
    [recentActivity]
  );
  const quickFilterTicketIds = useMemo(() => {
    const set = new Set<string>();
    if (activeQuickFilters.commented) recentCommentedIds.forEach((id) => set.add(id));
    if (activeQuickFilters.attached) recentAttachedIds.forEach((id) => set.add(id));
    if (activeQuickFilters.overdue) overdueIds.forEach((id) => set.add(id));
    return Array.from(set);
  }, [activeQuickFilters, recentCommentedIds, recentAttachedIds, overdueIds]);

  // Unified filtered-view query: project-wide tickets matching the active
  // quick-filter set (no sprint/backlog scope restriction). Honors other
  // filters (status/priority/etc) so the user can keep narrowing.
  const filteredViewParams = {
    ...baseQueryParams,
    ticketIds: quickFilterTicketIds.length > 0 ? quickFilterTicketIds.join(",") : undefined,
    page: pagination.current,
    limit: pagination.pageSize,
  };
  const {
    data: filteredViewData,
    isFetching: filteredViewFetching,
  } = useTickets(filteredViewParams, {
    enabled: isFilteredView && quickFilterTicketIds.length > 0,
  });
  const filteredViewTickets = filteredViewData?.data || [];
  const filteredViewTotal = filteredViewData?.pagination?.total || 0;

  const filteredViewKindLabel = (() => {
    const parts: string[] = [];
    if (activeQuickFilters.commented) parts.push("Commented");
    if (activeQuickFilters.attached) parts.push("Attached");
    if (activeQuickFilters.overdue) parts.push("Overdue");
    if (parts.length === 0) return "Filtered tickets";
    return `${parts.join(" · ")} tickets`;
  })();

  const effectiveSection: "sprint" | "backlog" | "filtered" | null = isFilteredView ? "filtered" : sidebarActiveSection;

  // ── Per-section filter scoping ───────────────────────────
  // Filters are section-scoped (Sprint / Backlog / Filtered each keep their
  // own status/priority/assignee/etc). Global `search` and `ticketIds` stay
  // shared so the global search box behaves intuitively.
  //
  // On every scope change we (1) save the OUTGOING scope's section filters
  // and (2) restore the INCOMING scope's snapshot into the live `filters`
  // state. The backend queries already read off `filters`, so scoping is
  // invisible to the rest of the component.
  type SectionScope = "sprint" | "backlog" | "filtered";
  type SectionScopedFilters = Pick<
    FilterState,
    "status" | "priority" | "assignee" | "createdBy" | "type" | "tags"
  >;
  const EMPTY_SECTION_SCOPED: SectionScopedFilters = {
    status: [],
    priority: [],
    assignee: [],
    createdBy: [],
    type: [],
    tags: [],
  };
  const currentScope: SectionScope = isFilteredView
    ? "filtered"
    : sidebarActiveSection === "backlog"
    ? "backlog"
    : "sprint";
  const filterSnapshotsRef = useRef<Record<SectionScope, SectionScopedFilters>>({
    sprint: { ...EMPTY_SECTION_SCOPED },
    backlog: { ...EMPTY_SECTION_SCOPED },
    filtered: { ...EMPTY_SECTION_SCOPED },
  });
  const prevScopeRef = useRef<SectionScope>(currentScope);
  // Mirror `filters` into a ref so the scope-change effect can read the latest
  // value without re-running on every keystroke.
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (prevScopeRef.current === currentScope) return;
    const outgoingScope = prevScopeRef.current;
    const f = filtersRef.current;
    filterSnapshotsRef.current = {
      ...filterSnapshotsRef.current,
      [outgoingScope]: {
        status: f.status,
        priority: f.priority,
        assignee: f.assignee,
        createdBy: f.createdBy,
        type: f.type,
        tags: f.tags,
      },
    };
    const incoming = filterSnapshotsRef.current[currentScope];
    setFilters((prev) => ({
      ...prev,
      ...incoming,
    }));
    setPagination((prev) => ({ ...prev, current: 1 }));
    prevScopeRef.current = currentScope;
  }, [currentScope]);

  // ── Calendar view data (only when viewMode === 'calendar') ──────
  // Fetch ALL sprints for the project to get color/name mapping and date bounds
  const { data: allProjectSprintsRaw, isLoading: allSprintsLoading } = useQuery({
    queryKey: ['allProjectSprints', projectId],
    queryFn: () => ReleasePlanService.getReleasePlans({ type: 'sprint_plan', projectId, limit: 100 }),
    enabled: !!projectId && viewMode === 'calendar' && canReadTicketPlan,
    staleTime: 60 * 1000,
  });
  const allProjectSprints = useMemo(() => allProjectSprintsRaw?.data || [], [allProjectSprintsRaw]);

  // Fetch ALL tickets in any sprint for this project (no pagination)
  const { data: calendarTicketsData, isLoading: calendarTicketsLoading } = useTickets(
    { projectId, limit: 9999 },
    { enabled: !!projectId && viewMode === 'calendar' }
  );

  // Helper: resolve a ticket's sprint ID across the field-name variants used by the backend
  const getTicketSprintId = (t: Ticket): string | null => {
    return (
      (t as any).sprintPlanId ||
      (t as any).releasePlanId ||
      (t as any).metadata?.releasePlan ||
      null
    );
  };

  // Map sprint ID → { name, color, status, dates }
  const sprintInfoMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string; status?: string; startDate?: string; endDate?: string }>();
    allProjectSprints.forEach((s: any, i: number) => {
      map.set(s.id, {
        name: s.version || s.name || `Sprint ${i + 1}`,
        color: SPRINT_PALETTE[i % SPRINT_PALETTE.length],
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
      });
    });
    return map;
  }, [allProjectSprints]);

  // Resolve calendar tickets: must have sprint id AND a date range (own or sprint's)
  const calendarSprintTickets = useMemo(() => {
    const all = calendarTicketsData?.data || [];
    return all
      .map((t: Ticket) => {
        const sprintId = getTicketSprintId(t);
        if (!sprintId) return null;
        const sprintInfo = sprintInfoMap.get(sprintId);
        const startDate = t.startDate || sprintInfo?.startDate;
        const endDate = t.endDate || sprintInfo?.endDate;
        if (!startDate || !endDate) return null;
        return { ticket: t, sprintId, startDate, endDate, sprintInfo };
      })
      .filter(Boolean) as Array<{ ticket: Ticket; sprintId: string; startDate: string; endDate: string; sprintInfo?: { name: string; color: string; status?: string; startDate?: string; endDate?: string } }>;
  }, [calendarTicketsData, sprintInfoMap]);

  // Calendar navigation bounds — clamp to actual ticket date range
  const calendarBounds = useMemo(() => {
    const dates: dayjs.Dayjs[] = [];
    calendarSprintTickets.forEach((r) => {
      dates.push(dayjs(r.startDate));
      dates.push(dayjs(r.endDate));
    });
    if (!dates.length) return null;
    const earliest = dates.reduce((a, b) => (a.isBefore(b) ? a : b)).startOf('month');
    const latest = dates.reduce((a, b) => (a.isAfter(b) ? a : b)).startOf('month');
    return { earliest, latest };
  }, [calendarSprintTickets]);

  const canCalPrev = !calendarBounds || calendarMonth.isAfter(calendarBounds.earliest, 'month');
  const canCalNext = !calendarBounds || calendarMonth.isBefore(calendarBounds.latest.add(3, 'month'), 'month');

  // Snap calendarMonth into range when data loads
  useEffect(() => {
    if (!calendarBounds || viewMode !== 'calendar') return;
    if (calendarMonth.isBefore(calendarBounds.earliest, 'month')) {
      setCalendarMonth(calendarBounds.earliest);
    } else if (calendarMonth.isAfter(calendarBounds.latest.add(3, 'month'), 'month')) {
      setCalendarMonth(calendarBounds.latest);
    }
  }, [calendarBounds, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats for header
  const calendarMonthStats = useMemo(() => {
    const monthStart = calendarMonth.startOf('month');
    const monthEnd = calendarMonth.endOf('month');
    const inMonth = calendarSprintTickets.filter((r) => {
      const s = dayjs(r.startDate);
      const e = dayjs(r.endDate);
      return !(e.isBefore(monthStart) || s.isAfter(monthEnd));
    });
    const uniqueSprints = new Set<string>();
    inMonth.forEach((r) => uniqueSprints.add(r.sprintId));
    return { ticketCount: inMonth.length, sprintCount: uniqueSprints.size };
  }, [calendarSprintTickets, calendarMonth]);

  // Build week-grouped ribbons
  const calendarData = useMemo(() => {
    const startOfWeekMon = (d: dayjs.Dayjs) => {
      const dow = d.day();
      const offset = (dow + 6) % 7;
      return d.subtract(offset, 'day').startOf('day');
    };
    const endOfWeekMon = (d: dayjs.Dayjs) => startOfWeekMon(d).add(6, 'day').endOf('day');

    const calStart = startOfWeekMon(calendarMonth.startOf('month'));
    const calEnd = endOfWeekMon(calendarMonth.endOf('month'));

    const weeks: dayjs.Dayjs[][] = [];
    let cursor = calStart;
    while (cursor.isBefore(calEnd) || cursor.isSame(calEnd, 'day')) {
      const days: dayjs.Dayjs[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(cursor);
        cursor = cursor.add(1, 'day');
      }
      weeks.push(days);
      if (weeks.length > 8) break;
    }

    type Ribbon = {
      ticket: Ticket;
      startCol: number;
      span: number;
      continuesLeft: boolean;
      continuesRight: boolean;
      color: string;
      sprintName?: string;
      sprintId: string;
      startDate: string;
      endDate: string;
      lane: number;
    };

    const weekRibbons: Ribbon[][] = weeks.map(week => {
      const weekStart = week[0];
      const weekEnd = week[6].endOf('day');

      const overlapping = calendarSprintTickets
        .filter((r) => {
          const s = dayjs(r.startDate);
          const e = dayjs(r.endDate);
          return !(e.isBefore(weekStart) || s.isAfter(weekEnd));
        })
        .map((r): Ribbon => {
          const s = dayjs(r.startDate);
          const e = dayjs(r.endDate);
          const clipStart = s.isBefore(weekStart) ? weekStart : s.startOf('day');
          const clipEnd = e.isAfter(weekEnd) ? weekEnd : e.endOf('day');
          const startCol = clipStart.diff(weekStart, 'day');
          const span = Math.max(clipEnd.startOf('day').diff(clipStart.startOf('day'), 'day') + 1, 1);
          return {
            ticket: r.ticket,
            startCol,
            span,
            continuesLeft: s.isBefore(weekStart),
            continuesRight: e.isAfter(weekEnd),
            color: r.sprintInfo?.color || '#94a3b8',
            sprintName: r.sprintInfo?.name,
            sprintId: r.sprintId,
            startDate: r.startDate,
            endDate: r.endDate,
            lane: 0,
          };
        })
        .sort((a: Ribbon, b: Ribbon) => a.startCol - b.startCol || b.span - a.span);

      const lanes: number[] = [];
      overlapping.forEach((r: Ribbon) => {
        let li = lanes.findIndex(end => end <= r.startCol);
        if (li === -1) {
          li = lanes.length;
          lanes.push(0);
        }
        lanes[li] = r.startCol + r.span;
        r.lane = li;
      });

      return overlapping;
    });

    const maxLanesByWeek = weekRibbons.map(rs => rs.reduce((m, x) => Math.max(m, x.lane), -1) + 1);

    return { weeks, weekRibbons, maxLanesByWeek };
  }, [calendarSprintTickets, calendarMonth, sprintInfoMap]);


  // Sync all ticket IDs for navigation
  useEffect(() => {
    const ids = [...activeTickets.map(t => t.id), ...backlogTickets.map(t => t.id)];
    // Only update if the IDs are different to prevent infinite loops
    setAllTicketIds(prev => {
      if (prev.length === ids.length && prev.every((id, index) => id === ids[index])) {
        return prev;
      }
      return ids;
    });
  }, [activeTickets, backlogTickets]);

  const updateTicketMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();

  const bulkArchiveMutation = useMutation({
    mutationFn: (ids: string[]) => TicketService.bulkArchive(ids),
    onSuccess: (_, variables) => {
      message.success("Tickets archived successfully");
      setActiveSelectedRowKeys(prev => prev.filter(id => !variables.includes(id as string)));
      setBacklogSelectedRowKeys(prev => prev.filter(id => !variables.includes(id as string)));
      refetchActive();
      refetchBacklog();
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => message.error(err.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => TicketService.bulkDelete(ids),
    onSuccess: (_, variables) => {
      message.success("Tickets moved to trash");
      setActiveSelectedRowKeys(prev => prev.filter(id => !variables.includes(id as string)));
      setBacklogSelectedRowKeys(prev => prev.filter(id => !variables.includes(id as string)));
      refetchActive();
      refetchBacklog();
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => message.error(err.message),
  });

  const { data: tagSuggestions = [] } = useAllTicketTags();

  // Handle Add/Remove from Sprint
  // Handle Add/Remove from Sprint
  // const [notifyApi, notifyContextHolder] = notification.useNotification({
  //   placement: 'top',
  // }); // Use notification hook

  // Handle Add/Remove from Sprint
  // Handle Add/Remove from Sprint
  const showSprintTinyToast = (
    kind: 'added' | 'removed' | 'error',
    label?: string
  ) => {
    if (kind === 'added') {
      message.success(`Ticket added to ${label} successfully`);
    } else if (kind === 'removed') {
      message.success(`Ticket removed from sprint successfully`);
    } else if (kind === 'error') {
      message.error(`Sprint update failed`);
    }
  };

  const handleSprintAssignment = (ticketId: string, action: 'add' | 'remove') => {
    if (action === 'add' && !activeSprint) {
      showSprintTinyToast('error');
      return;
    }

    // Explicitly set releasePlan to the ID for add, or null for remove
    const releasePlanId = action === 'add' && activeSprint ? activeSprint.id : (action === 'remove' ? null as any : undefined);

    updateTicketMutation.mutate({
      id: ticketId,
      data: { releasePlan: releasePlanId },
      optimisticData: { releasePlan: releasePlanId } // Critical for optimistic move
    }, {
      onSuccess: () => {
        if (action === 'add') {
          showSprintTinyToast('added', activeSprint?.version || activeSprint?.name || 'Sprint');
        } else {
          showSprintTinyToast('removed');
        }
      },
      onError: (err) => {
        console.error(err);
        showSprintTinyToast('error');
      }
    });
  };



  const handleCompleteSprint = () => {
    if (!activeSprint?.id) return;
    setSprintCompletionModalOpen(true);
  };

  const handleSprintCompletionSuccess = () => {
    setSprintCompletionModalOpen(false);
    message.success('Sprint completed successfully');
    // Refresh both ticket lists and active sprint query
    refetchActive();
    refetchBacklog();
    queryClient.invalidateQueries({ queryKey: ['activeSprint', projectId] });
  };

  // Handle sprint creation from backlog
  const handleCreateSprintFromBacklog = async (data: SprintFormData) => {
    try {
      setCreatingSprintLoading(true);

      // Determine sprint status based on whether active sprint exists
      const hasActiveSprint = !!activeSprint;
      const sprintStatus = hasActiveSprint ? 'planning' : 'active';

      // Create sprint
      const newSprint = await ReleasePlanService.createReleasePlan({
        version: data.name,
        description: data.goal || '',
        projectId: projectId,
        releaseDate: data.endDate.format('YYYY-MM-DD'),
        startDate: data.startDate.format('YYYY-MM-DD'),
        endDate: data.endDate.format('YYYY-MM-DD'),
        type: 'sprint_plan',
        status: sprintStatus,
      });

      setCreateSprintModalOpen(false);

      // Show appropriate success message
      if (sprintStatus === 'active') {
        message.success(`${newSprint.version} is now your active sprint!`);
      } else {
        message.success(`${newSprint.version} created in planning`);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['activeSprint', projectId] });
      refetchActive();
      refetchBacklog();

    } catch (error: any) {
      message.error(error.message || 'Failed to create sprint');
    } finally {
      setCreatingSprintLoading(false);
    }
  };

  // useTicketSocketEvents(); // Moved to MainLayout for global coverage

  // --- Effects ---

  // Dual Query Strategy for Kanban
  // 1. Fast initial load (20 tickets/column = 80 total)
  const initialKanbanParams = viewMode === 'board' ? {
    projectId, // From props, mandatory project context
    assigneeId: filters.assignee.length > 0 ? filters.assignee.join(',') : undefined,
    priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
    type: filters.type.length > 0 ? filters.type.join(',') : undefined,
    search: filters.search || undefined,
    limitPerColumn: 20, // Fast initial load
    sprintId: kanbanScope === 'active' ? 'active' : 'null',
  } : null;

  const {
    data: initialKanbanData,
    isLoading: isInitialKanbanLoading,
    isFetching: isInitialKanbanFetching
  } = useKanbanTickets(initialKanbanParams);

  // 2. Background complete load (50 tickets/column = 200 total)
  const backgroundKanbanParams = viewMode === 'board' && initialKanbanData ? {
    projectId, // From props, mandatory project context
    assigneeId: filters.assignee.length > 0 ? filters.assignee.join(',') : undefined,
    priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
    type: filters.type.length > 0 ? filters.type.join(',') : undefined,
    search: filters.search || undefined,
    limitPerColumn: 50, // Complete load
    sprintId: kanbanScope === 'active' ? 'active' : 'null',
  } : null;

  const {
    data: backgroundKanbanData,
    isFetching: isBackgroundKanbanLoading
  } = useKanbanTickets(backgroundKanbanParams, {
    enabled: !!initialKanbanData, // Only after initial load
  });

  // 3. Use best available data
  const kanbanData: any = backgroundKanbanData || initialKanbanData;
  const isKanbanLoading = isInitialKanbanLoading;
  const isKanbanFetching = isBackgroundKanbanLoading && !isInitialKanbanLoading;

  // Update limit based on view mode
  useEffect(() => {
    if (viewMode === 'board') {
      // Board mode uses Kanban endpoint, no pagination needed
      setPagination(prev => ({ ...prev, current: 1, pageSize: 15 }));
    } else {
      setPagination(prev => ({ ...prev, current: 1, pageSize: 15 }));
    }
  }, [viewMode]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [filters]);

  // Helper to update individual filter keys
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false;
    return Array.isArray(value) && value.length > 0;
  }).length;


  const handleUpdateTicket = (
    ticketId: string,
    field: "status" | "assignee" | "title" | "priority" | "type" | "storyPoint",
    value: string | number | null
  ) => {
    if (field === "assignee" && !canAssignTicket) {
      message.error("Access Denied: You do not have permission to assign tickets.");
      return;
    }
    // Prepare update data
    const updateData: any = {};
    // Prepare optimistic cache data (optional override)
    let optimisticData: any = null;

    if (field === "status") updateData.status = value;
    else if (field === "assignee") {
      updateData.assignee = (value === undefined || value === "") ? null : value;
      // Find full member object for seamless optimistic update
      const member = value ? members.find(m => m.value === value) : null;
      if (member) {
        optimisticData = {
          assignee: {
            id: member.value,
            name: member.label,
            email: "" // Email might not be in the lightweight members list, empty string satisfies type
          }
        };
      } else {
        optimisticData = {
          assignee: null
        };
      }
    }
    else if (field === "title") updateData.title = value;
    else if (field === "priority") updateData.priority = value;
    else if (field === "type") updateData.type = value;
    else if (field === "storyPoint") {
      updateData.storyPoint = value; // Assumed to be number or null
    }

    // 2. Fire-and-forget mutation (errors handled by hook queries rollback)
    updateTicketMutation.mutate(
      { id: ticketId, data: updateData, optimisticData },
      {
        onError: (error) => {
          console.error(`Failed to update ${field}:`, error);
          message.error(`Failed to update ${field}`);
          // Note: The optimistic update hook will handle rolling back the data in the cache
        },
        onSuccess: () => {
          const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
          message.success(`${formattedField} updated`);
        }
      }
    );

    // 1. Optimistic UI: Close the editing field IMMEDIATELY
    // We do this AFTER triggering mutate so that 'isPending' becomes true immediately
    setEditingField(null);
  };

  /* 
   * Handle updates from Kanban board
   * Maps partial ticket updates including special fields like assigneeId to handleUpdateTicket
   */
  const handleKanbanUpdate = (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => {
    Object.entries(updates).forEach(([key, value]) => {
      // Translate backend keys (assigneeId) to frontend keys (assignee) for the optimistic logic
      const fieldMap: Record<string, string> = {
        'assigneeId': 'assignee'
      };
      const mappedKey = fieldMap[key] || key;

      handleUpdateTicket(ticketId, mappedKey as any, value as any);
    });
  };

  const getStatusColorClass = (status: string) => {
    const color = getStatusColor(status);
    switch (color) {
      case 'success': return 'saas-tag-green';
      case 'processing': return 'saas-tag-blue';
      case 'warning': return 'saas-tag-orange';
      case 'purple': return 'saas-tag-purple';
      case 'blue': return 'saas-tag-blue';
      case 'cyan': return 'saas-tag-cyan';
      case 'geekblue': return 'saas-tag-geekblue';
      case 'orange': return 'saas-tag-orange';
      default: return 'saas-tag-default';
    }
  };

  const getPriorityColorClass = (priority: string) => {
    const color = getPriorityColor(priority);
    return `saas-tag-${color}`;
  };

  const getTypeColorClass = (type: string) => {
    const color = getTypeColor(type);
    return `saas-tag-${color}`;
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    console.log("handleDeleteTicket triggered for ID:", ticketId);
    try {
      if (!ticketId) {
        console.error("No ticket ID provided for deletion");
        return;
      }
      await deleteTicketMutation.mutateAsync(ticketId);
      console.log("Delete mutation successful for ID:", ticketId);
      message.success("Ticket moved to trash");
    } catch (error: any) {
      console.error("Delete mutation failed for ID:", ticketId, error);

      // Check if it's a permission error
      const errorMessage = error?.message || "Failed to delete ticket";
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("admin") ||
        errorMessage.includes("403")
      ) {
        message.error("Only administrators can delete tickets");
      } else {
        message.error(errorMessage);
      }
    }
  };

  const fireConfettiAtCard = () => {
    try {
      // @ts-ignore
      import('canvas-confetti').then((confetti) => {
        const el = recentTicketCardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti.default({
          particleCount: 60,
          spread: 70,
          startVelocity: 28,
          ticks: 80,
          scalar: 0.8,
          origin: { x, y },
          zIndex: 1000,
        });
      }).catch(err => {
        console.warn('Confetti module not found, skipping animation', err);
      });
    } catch (e) {
      console.error('Error firing confetti:', e);
    }
  };

  const handleTicketCreated = (ticket: Ticket) => {
    setRecentTicket(ticket);
    requestAnimationFrame(() => fireConfettiAtCard());
    message.success(`1 ticket(s) created successfully`);
  };
  const activeRowSelection = {
    selectedRowKeys: activeSelectedRowKeys,
    onChange: (keys: React.Key[]) => setActiveSelectedRowKeys(keys),
  };

  const backlogRowSelection = {
    selectedRowKeys: backlogSelectedRowKeys,
    onChange: (keys: React.Key[]) => setBacklogSelectedRowKeys(keys),
  };

  const isCompletedFilterActive = filters.status.includes('completed') || filters.status.includes('Completed');


  // Table columns generator
  const getColumns = (context: 'active' | 'backlog'): TableProps<Ticket>['columns'] => {
    const allCols: TableProps<Ticket>['columns'] = [
    {
      title: "ID",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 180,
      render: (text: string, record: Ticket) => (
        <span
          onClick={() => handleViewTicket(record)}
          style={{
            cursor: 'pointer',
            color: 'var(--premium-blue)',
            fontWeight: 700,
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '-0.02em',
            padding: '2px 6px',
            background: 'var(--bg-blue-50)',
            borderRadius: '4px',
            border: '1px solid var(--border-blue-200)',
            whiteSpace: 'nowrap'
          }}
          className="hover:opacity-80 transition-opacity"
        >
          {text}
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 350,
      render: (text: string, record: Ticket) => {
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "title";

        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <Input
              defaultValue={text}
              autoFocus
              onBlur={(e) => handleUpdateTicket(record.id, "title", e.target.value)}
              onPressEnter={(e) => handleUpdateTicket(record.id, "title", e.currentTarget.value)}
              disabled={isUpdating}
              className="premium-input-field"
            />
          );
        }

        return (
          <div
            className="group"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: canUpdateTicket ? 'pointer' : 'default', minHeight: 24 }}
            onClick={() => canUpdateTicket && setEditingField({ ticketId: record.id, field: "title" })}
            title={text}
          >
            <Text
              strong
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-slate-900)',
                letterSpacing: '-0.01em'
              }}
              ellipsis={{ tooltip: true }}
            >
              {text}
            </Text>
            {canUpdateTicket && (
              <EditOutlined
                className="opacity-0 group-hover:opacity-40 transition-opacity"
                style={{ color: 'var(--premium-blue)', fontSize: 12 }}
              />
            )}
          </div>
        );

      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string, record: Ticket) => {
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "status";
        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <Select
              value={status}
              style={{ width: "100%" }}
              onChange={(value) =>
                handleUpdateTicket(record.id, "status", value)
              }
              onBlur={() => setEditingField(null)}
              autoFocus
              loading={isUpdating}
              options={finalStatusOptions}
            />
          );
        }

        return (
          <Tag
            className={`saas-tag ${getStatusColorClass(status)}`}
            style={{ cursor: canUpdateTicket ? "pointer" : "default", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 80 }}
            onClick={() =>
              canUpdateTicket && setEditingField({ ticketId: record.id, field: "status" })
            }
          >
            {getStatusLabel(status, finalStatusOptions)}
          </Tag>
        );
      },
    },
    {
      title: "Assignee",
      dataIndex: "assignee",
      key: "assignee",
      width: 180,
      render: (assignee: any, record: Ticket) => {
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "assignee";
        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;
        const assigneeId =
          typeof assignee === "string" ? assignee : assignee?.id || "";
        const name =
          assignee && typeof assignee === "string"
            ? assignee
            : assignee
              ? assignee?.name
              : "Unassigned";

        if (isEditing) {
          return (
            <Select
              value={assigneeId || undefined}
              style={{ width: "100%" }}
              onChange={(value) =>
                handleUpdateTicket(record.id, "assignee", value)
              }
              onBlur={() => setEditingField(null)}
              autoFocus
              loading={isUpdating}
              showSearch
              allowClear
              placeholder="Select assignee"
              filterOption={(input, option) => {
                const member = members.find((m) => m.value === option?.value);
                return member
                  ? member.label.toLowerCase().includes(input.toLowerCase()) ||
                  (member.position?.toLowerCase() ?? "").includes(input.toLowerCase())
                  : false;
              }}
              options={members.map((member) => ({
                label: `${member.label} - ${member.position}`,
                value: member.value,
              }))}
            />
          );
        }

        return (
          <Space
            style={{ cursor: canUpdateTicket ? "pointer" : "default", transition: 'all 0.2s' }}
            className={canUpdateTicket ? "hover:translate-x-1" : ""}
            onClick={() => {
              if (canUpdateTicket) {
                if (!canAssignTicket) {
                  message.error("Access Denied: You do not have permission to assign tickets.");
                  return;
                }
                setEditingField({ ticketId: record.id, field: "assignee" });
              }
            }}
          >
            <Avatar
              size="small"
              style={{ backgroundColor: "#1677ff" }}
              src={assignee?.avatarUrl}
            >
              {!assignee?.avatarUrl && name?.charAt(0)}
            </Avatar>
            <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-slate-700)' }}>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string, record: Ticket) => {
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "priority";
        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <Select
              value={priority}
              style={{ width: "100%" }}
              onChange={(value) =>
                handleUpdateTicket(record.id, "priority", value)
              }
              onBlur={() => setEditingField(null)}
              autoFocus
              loading={isUpdating}
              options={dbPriorityOptions.length > 0 ? dbPriorityOptions : [
                { label: "High (P1)", value: "P1" },
                { label: "Medium (P2)", value: "P2" },
                { label: "Low (P3)", value: "P3" },
              ]}
            />
          );
        }

        return (
          <Tag
            className={`saas-tag ${getPriorityColorClass(priority)}`}
            style={{ cursor: canUpdateTicket ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => canUpdateTicket && setEditingField({ ticketId: record.id, field: "priority" })}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
            {priority}
          </Tag>
        );
      },
    },
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_: any, record: Ticket) => {
        const type = record?.type || "";
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "type";
        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <Select
              value={type}
              style={{ width: "100%" }}
              onChange={(value) =>
                handleUpdateTicket(record.id, "type", value)
              }
              onBlur={() => setEditingField(null)}
              autoFocus
              loading={isUpdating}
              options={[
                { label: "Bug", value: "Bug" },
                { label: "Task", value: "Task" },
                { label: "Feature", value: "Feat" },
                { label: "Overwrite", value: "Overwrite" },
              ]}
            />
          );
        }

        if (!type) {
          return <Text type="secondary" style={{ cursor: canUpdateTicket ? 'pointer' : 'default', fontSize: 13 }} onClick={() => canUpdateTicket && setEditingField({ ticketId: record.id, field: "type" })}>-</Text>;
        }
        return (
          <Tag
            className={`saas-tag ${getTypeColorClass(type)}`}
            style={{ cursor: canUpdateTicket ? 'pointer' : 'default' }}
            onClick={() => canUpdateTicket && setEditingField({ ticketId: record.id, field: "type" })}
          >
            {type}
          </Tag>
        );
      },
    },
    {
      title: "SP",
      dataIndex: "storyPoint",
      key: "storyPoint",
      width: 70,
      render: (storyPoint: number | undefined, record: Ticket) => {
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "storyPoint";
        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <InputNumber
              defaultValue={storyPoint}
              autoFocus
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                handleUpdateTicket(record.id, "storyPoint", isNaN(val) ? 0 : val);
              }}
              onPressEnter={(e) => handleUpdateTicket(record.id, "storyPoint", parseFloat(e.currentTarget.value))}
              style={{ width: '100%' }}
              disabled={isUpdating}
            />
          );
        }

        return (
          <div
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'var(--bg-slate-100)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-slate-500)'
            }}
            onClick={() => setEditingField({ ticketId: record.id, field: "storyPoint" })}
          >
            {storyPoint || 0}
          </div>
        );
      }
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
      render: (platform: string) => platform
        ? <Tag className="saas-tag" bordered={false} style={{ fontSize: 11 }}>{platform}</Tag>
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "Stack",
      dataIndex: "stack",
      key: "stack",
      width: 120,
      render: (stack: string) => stack
        ? <Tag className="saas-tag" bordered={false} style={{ fontSize: 11 }}>{stack}</Tag>
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "Task Level",
      dataIndex: "taskLevel",
      key: "taskLevel",
      width: 120,
      render: (level: string) => level
        ? <Tag className="saas-tag" bordered={false} style={{ fontSize: 11 }}>{level}</Tag>
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: 180,
      render: (tags: string[] | undefined) => {
        if (!tags || tags.length === 0) {
          return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
        }
        const visible = tags.slice(0, 3);
        const extra = tags.length - visible.length;
        return (
          <Space size={4} wrap>
            {visible.map((t) => (
              <Tag key={t} bordered={false} style={{ fontSize: 10.5, margin: 0 }}>{t}</Tag>
            ))}
            {extra > 0 && (
              <Tooltip title={tags.slice(3).join(', ')}>
                <Tag bordered={false} style={{ fontSize: 10.5, margin: 0 }}>+{extra}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Estimate (h)",
      dataIndex: "estimateHours",
      key: "estimateHours",
      width: 110,
      render: (hours: number | undefined) => (
        <Text style={{ fontSize: 12, color: 'var(--text-slate-700)' }}>
          {hours != null ? hours : <span style={{ color: 'var(--text-slate-400)' }}>-</span>}
        </Text>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 130,
      render: (date: string | undefined) => date
        ? <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 130,
      render: (date: string | undefined) => date
        ? <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "Report To",
      dataIndex: "reportTo",
      key: "reportTo",
      width: 170,
      render: (reportTo: Ticket["reportTo"]) => {
        if (!reportTo || typeof reportTo === 'string') {
          return <Text type="secondary" style={{ fontSize: 12 }}>{typeof reportTo === 'string' ? reportTo : '-'}</Text>;
        }
        return (
          <Space size={6}>
            <Avatar size="small" style={{ backgroundColor: '#8b5cf6' }} src={reportTo.avatarUrl || undefined}>
              {!reportTo.avatarUrl && reportTo.name?.charAt(0)}
            </Avatar>
            <Text style={{ fontSize: 12.5, fontWeight: 500 }}>{reportTo.name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 170,
      render: (createdBy: Ticket["createdBy"]) => {
        if (!createdBy) return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
        return (
          <Space size={6}>
            <Avatar size="small" style={{ backgroundColor: '#10b981' }} src={createdBy.avatarUrl || undefined}>
              {!createdBy.avatarUrl && createdBy.name?.charAt(0)}
            </Avatar>
            <Text style={{ fontSize: 12.5, fontWeight: 500 }}>{createdBy.name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date: string | undefined) => date
        ? (
          <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm')}>
            <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
          </Tooltip>
        )
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      render: (date: string | undefined) => date
        ? (
          <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm')}>
            <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
          </Tooltip>
        )
        : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 116,
      align: "right" as const,
      fixed: "right",
      render: (_: any, record: Ticket) => {
        const handleShare = () => {
          const url = `${window.location.origin}/public/tickets/${record.id}`;
          navigator.clipboard.writeText(url);
        };

        return (
          <Space size={4}>
            {/* Context based actions */}
            {context === 'backlog' && canUpdateTicket && (
              <Tooltip title="Add to Sprint">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusCircleOutlined style={{ color: '#52c41a' }} />}
                  onClick={(e) => { e.stopPropagation(); handleSprintAssignment(record.id, 'add'); }}
                  className="saas-button-item"
                />
              </Tooltip>
            )}
            {context === 'active' && canUpdateTicket && (
              <Tooltip title="Remove from Sprint">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={(e) => { e.stopPropagation(); handleSprintAssignment(record.id, 'remove'); }}
                  className="saas-button-item"
                />
              </Tooltip>
            )}

            <Divider type="vertical" style={{ margin: '0 4px' }} />

            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: 'var(--premium-blue)' }} />}
                onClick={(e) => { e.stopPropagation(); handleViewTicket(record); }}
                className="saas-button-item"
              />
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'share',
                    label: 'Copy Public Link',
                    icon: <ShareAltOutlined />,
                    onClick: handleShare
                  },
                  canDeleteTicket && {
                    key: 'delete',
                    label: 'Delete Ticket',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: (info: any) => {
                      if (info.domEvent) info.domEvent.stopPropagation();
                      modal.confirm({
                        title: 'Confirm Deletion',
                        content: (
                          <div style={{ marginTop: 8 }}>
                            <Text>Are you sure you want to move <b>{record.ticketNumber}</b> to trash?</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                              You can restore it for up to 7 days from the Trash Repository.
                            </Text>
                          </div>
                        ),
                        okText: 'Move to Trash',
                        okType: 'danger',
                        centered: true,
                        okButtonProps: { style: { fontWeight: 700 } },
                        onOk: () => handleDeleteTicket(record.id)
                      });
                    }
                  }
                ].filter(Boolean) as any
              }}
              trigger={['click']}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
                className="saas-button-item"
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return allCols.filter(c => activeColumnsSet.has(c?.key as string));
};

  // Active-sprint header used at the top of List, Board, and Calendar views.
  // `variant: 'list'` enables the bulk-action branch driven by activeSelectedRowKeys
  // (the table row-selection state only exists in List view).
  const renderActiveSprintHeader = (variant: 'list' | 'compact' = 'compact') => {
    if (!activeSprint) return null;
    const showBulkActions = variant === 'list' && activeSelectedRowKeys.length > 0;
    return (
      <div
        ref={setSprintHeadEl}
        className={`tl-section-head${statsCollapsed ? ' is-stats-collapsed' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Space size={[12, 8]} wrap>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />
          <Text
            style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-slate-900)', maxWidth: 350 }}
            ellipsis={{ tooltip: true }}
          >
            {activeSprint?.version || 'Active Sprint'}
          </Text>
          <Space size={6}>
            {activeSprint.endDate && (() => {
              const isDelayed = dayjs().isAfter(dayjs(activeSprint.endDate), 'day');
              const isToday = dayjs().isSame(dayjs(activeSprint.endDate), 'day');
              const days = Math.abs(dayjs().diff(dayjs(activeSprint.endDate), 'day'));
              return (
                <Tag bordered={false} style={{
                  margin: 0,
                  height: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 90,
                  fontSize: 10,
                  fontWeight: 800,
                  background: isDelayed ? 'rgba(239, 68, 68, 0.15)' : isToday ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isDelayed ? '#fb7185' : isToday ? '#fbbf24' : '#34d399',
                  borderRadius: 4,
                  border: `1px solid ${isDelayed ? 'rgba(239, 68, 68, 0.2)' : isToday ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                  {isDelayed ? `${days}d Delayed` : isToday ? 'Ends Today' : `${days}d Left`}
                </Tag>
              );
            })()}
            <Tag bordered={false} style={{
              margin: 0,
              height: 24,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 90,
              background: '#f1f5f9',
              color: '#64748b',
              fontWeight: 800,
              fontSize: 10,
              borderRadius: 4,
              textTransform: 'uppercase'
            }}>
              {activeTickets.length} Tickets
            </Tag>
          </Space>
        </Space>
        <Space size={[16, 8]} wrap>
          {showBulkActions ? (
            <>
              {canManageTickets && (
                <Button
                  type="primary"
                  size="small"
                  icon={<FolderAddOutlined style={{ fontSize: 11 }} />}
                  onClick={() => bulkArchiveMutation.mutate(activeSelectedRowKeys as string[])}
                  style={{
                    background: 'var(--premium-blue)',
                    borderColor: 'var(--premium-blue)',
                    fontWeight: 800,
                    borderRadius: 4,
                    height: 24,
                    fontSize: 10,
                    textTransform: 'uppercase'
                  }}
                >
                  Move to Archive
                </Button>
              )}
              {canDeleteTicket && (
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                  onClick={() => {
                    modal.confirm({
                      title: 'Move to Trash',
                      content: `Are you sure you want to move ${activeSelectedRowKeys.length} selected tickets to trash?`,
                      okText: 'Move to Trash',
                      okType: 'danger',
                      onOk: () => bulkDeleteMutation.mutate(activeSelectedRowKeys as string[])
                    });
                  }}
                  style={{
                    fontWeight: 800,
                    borderRadius: 4,
                    height: 24,
                    fontSize: 10,
                    textTransform: 'uppercase'
                  }}
                >
                  Delete
                </Button>
              )}
            </>
          ) : (
            (() => {
              const completedCount = overallSprintTickets.filter((t) => ['completed'].includes(t.status?.toLowerCase() || '')).length;
              const progressPct = overallSprintTickets.length > 0 ? Math.round((completedCount / overallSprintTickets.length) * 100) : 0;
              const start = dayjs(activeSprint.startDate);
              const end = dayjs(activeSprint.endDate);
              const now = dayjs();
              const totalDays = Math.max(end.diff(start, 'day'), 1);
              const elapsedDays = Math.max(0, Math.min(totalDays, now.diff(start, 'day')));
              const timelinePct = Math.round((elapsedDays / totalDays) * 100);
              const isOverdue = now.isAfter(end, 'day');
              const accent = isOverdue ? '#ef4444' : timelinePct >= 75 ? '#f59e0b' : '#10b981';

              const inlineStats = (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Progress</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{progressPct}%</div>
                    </div>
                    <Divider type="vertical" style={{ height: 28, margin: 0, borderColor: '#e2e8f0', opacity: 0.8 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tickets</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-slate-900)' }}>
                        {completedCount}/{overallSprintTickets.length}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left', minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sprint Timeline</div>
                      <Text style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>
                        {isOverdue ? 'OVERDUE' : `${Math.max(0, totalDays - elapsedDays)}d LEFT`}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{start.format('MMM D')}</Text>
                      <div style={{ flex: 1, position: 'relative', height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', minWidth: 80 }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          width: `${Math.min(100, timelinePct)}%`,
                          background: accent,
                          opacity: 0.9,
                          borderRadius: 999,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{end.format('MMM D')}</Text>
                    </div>
                  </div>
                </>
              );

              const popoverContent = (
                <div style={{ width: 280, padding: '4px 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>{progressPct}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>
                        {completedCount}<span style={{ color: '#94a3b8', fontWeight: 700 }}>/{overallSprintTickets.length}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${Math.min(100, progressPct)}%`,
                      background: '#10b981',
                      borderRadius: 999,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ height: 1, background: 'var(--border-color, #e2e8f0)', opacity: 0.7, margin: '0 0 12px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sprint Timeline</div>
                    <Text style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '0.02em' }}>
                      {isOverdue ? 'OVERDUE' : `${Math.max(0, totalDays - elapsedDays)}d LEFT`}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{start.format('MMM D')}</Text>
                    <div style={{ flex: 1, position: 'relative', height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', minWidth: 80 }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${Math.min(100, timelinePct)}%`,
                        background: accent,
                        opacity: 0.9,
                        borderRadius: 999,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{end.format('MMM D')}</Text>
                  </div>
                </div>
              );

              return (
                <>
                  <div className="tl-sprint-stats-inline" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {inlineStats}
                  </div>
                  <Popover
                    content={popoverContent}
                    trigger={['hover', 'click']}
                    placement="bottomRight"
                    overlayClassName="tl-sprint-stats-popover"
                  >
                    <button
                      type="button"
                      className="tl-sprint-stats-compact-btn"
                      style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: 8,
                        height: 32,
                        padding: '0 12px',
                        background: 'var(--bg-slate-50, #f8fafc)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: 6,
                        color: 'var(--text-slate-700, #334155)',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        transition: 'background 120ms ease, border-color 120ms ease',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                        }}
                      />
                      Sprint Ticket Progress
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{progressPct}%</span>
                    </button>
                  </Popover>
                </>
              );
            })()
          )}
          {canUpdateTicketPlan && (
            <Button
              type="primary"
              size="middle"
              icon={<CheckCircleOutlined />}
              onClick={handleCompleteSprint}
              className="saas-button-item"
              style={{ height: 32, background: '#10b981', borderColor: '#10b981' }}
            >
              Complete Sprint
            </Button>
          )}
          {activeSprint?.id && (
            <Tooltip title="View Report">
              <Button
                type="default"
                size="middle"
                icon={<LineChartOutlined style={{ color: '#6366f1' }} />}
                onClick={() => router.push(`/tickets/reports/${activeSprint.id}`)}
                className="saas-button-item"
                style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
          )}
        </Space>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-pure-white)',
      minHeight: 'calc(100vh - 64px)',
      padding: '0 24px 24px 24px',
      margin: '0 -24px',
      ['--tl-header-h' as any]: `${saasHeaderHeight}px`,
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .project-switch-trigger:hover {
          background: var(--bg-slate-50);
          color: var(--premium-blue);
        }
        
        /* Remove default shadow from fixed columns (e.g. Actions) */
        .ant-table-cell-fix-left-first::after, .ant-table-cell-fix-left-last::after,
        .ant-table-cell-fix-right-first::after, .ant-table-cell-fix-right-last::after {
          box-shadow: none !important;
        }.tickets-table-shell[data-density='compact'] .ant-table-tbody > tr > td { padding: 5px 12px !important; }
        .tickets-table-shell[data-density='comfortable'] .ant-table-tbody > tr > td { padding: 9px 16px !important; }
        .tickets-table-shell[data-density='spacious'] .ant-table-tbody > tr > td { padding: 14px 20px !important; }
        .tickets-table-settings-popover .ant-popover-inner { padding: 14px !important; border-radius: 12px !important; }
        .tickets-cols-scroll::-webkit-scrollbar { width: 6px; }
        .tickets-cols-scroll::-webkit-scrollbar-track { background: transparent; }
        .tickets-cols-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
        .tickets-cols-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-slate-400); }

        /* ── Sprint stats: inline by default, compact popover button when the
           sprint header container can't fit the row. Uses container queries so
           the trigger follows actual available width (sidebars open/closed),
           not viewport. ── */
        .tl-sprint-stats-compact-btn:hover {
          background: var(--bg-slate-100, #f1f5f9) !important;
          border-color: var(--text-slate-300, #cbd5e1) !important;
          color: var(--text-slate-900, #0f172a) !important;
        }
        .tl-sprint-stats-popover .ant-popover-inner {
          border-radius: 12px !important;
          padding: 14px 16px !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14), 0 2px 4px rgba(15, 23, 42, 0.06) !important;
          border: 1px solid var(--border-color, #e2e8f0) !important;
        }
        [data-theme='dark'] .tl-sprint-stats-popover .ant-popover-inner {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3) !important;
          border-color: #1f2937 !important;
        }
        /* Visibility toggled at runtime by JS — see "statsCollapsed" state.
           Default rendering (no class on host) shows inline. When the section
           head wraps to a second row, the host gets "is-stats-collapsed". */
        .tl-section-head .tl-sprint-stats-compact-btn { display: none; }
        .tl-section-head.is-stats-collapsed .tl-sprint-stats-inline { display: none !important; }
        .tl-section-head.is-stats-collapsed .tl-sprint-stats-compact-btn { display: inline-flex !important; }

        /* ── Two-column shell (sidebar + main) ───────────────
           Left bleeds -24px so the sidebar background slips under the
           global SideNav (cleaner edge). Right does NOT bleed because
           the parent <Content> only has 8px padding — bleeding right
           by -24px would push content 16px past the viewport-clipped
           Content right edge, hiding the Complete-Sprint button / chart
           icon / right-most table columns. */
        .tl-shell-wrap { margin: 0 0 0 -24px; }
        .tl-shell {
          display: grid;
          grid-template-columns: 264px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 64px - 56px);
        }
        .tl-main {
          min-width: 0;
          padding: 0 8px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        /* ── Sidebar toggle button (mobile/tablet) ──────────── */
        .tl-sidebar-toggle-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          color: var(--text-slate-700);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-sidebar-toggle-btn:hover {
          background: var(--bg-slate-50);
          border-color: var(--text-slate-400);
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .tl-sidebar-toggle-btn {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        [data-theme='dark'] .tl-sidebar-toggle-btn:hover {
          background: #1c232e;
          border-color: #475569;
          color: #f1f5f9;
        }

        /* ── Sidebar backdrop (only used as overlay on narrow widths) ── */
        .tl-sidebar-backdrop { display: none; }

        /* ── Desktop ≥1100px ────────────────────────────────── */
        @media (min-width: 1100px) {
          .tl-sidebar-toggle-btn { display: none !important; }
          .tl-shell-wrap.is-sidebar-closed .tl-shell {
            grid-template-columns: minmax(0, 1fr);
          }
          .tl-shell-wrap.is-sidebar-closed > .tl-shell > aside.tl-sidebar {
            display: none;
          }
        }

        /* ── Tablet / Mobile <1100px ────────────────────────── */
        @media (max-width: 1099.98px) {
          .tl-sidebar-toggle-btn { display: inline-flex; }
          .tl-shell { grid-template-columns: minmax(0, 1fr); }
          /* Sidebar becomes a drawer overlay */
          .tl-shell > aside.tl-sidebar {
            position: fixed;
            top: var(--tl-header-h, 56px);
            left: 0;
            width: 280px;
            height: calc(100vh - 64px - var(--tl-header-h, 56px));
            z-index: 60;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 1px 0 0 var(--border-slate-200);
            padding: 10px 14px 16px;
          }
          [data-theme='dark'] .tl-shell > aside.tl-sidebar {
            box-shadow: 1px 0 0 #1f2937;
          }
          .tl-shell-wrap.is-sidebar-open > .tl-shell > aside.tl-sidebar {
            transform: translateX(0);
          }
          .tl-shell-wrap.is-sidebar-open > .tl-sidebar-backdrop {
            display: block;
            position: fixed;
            top: var(--tl-header-h, 56px);
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.35);
            z-index: 55;
          }
          /* Main column reclaims full width when sidebar is drawer */
          .tl-main { padding-left: 0; padding-right: 8px; }
        }

        /* ── Narrow phone <640px ────────────────────────────── */
        @media (max-width: 639.98px) {
          .tl-section-head {
            padding: 8px 10px !important;
            gap: 6px !important;
          }
          .tl-filter-row {
            padding: 6px 10px;
            gap: 6px;
          }
          .tl-filter-row-label { display: none; }
          .tl-filter-row-pills { gap: 4px; }
          .tl-shell > aside.tl-sidebar { width: 86vw; }
        }

        /* ── Flat section (no card, borders for separation) ─ */
        .tl-section {
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          border-bottom: 1px solid var(--border-slate-200);
          margin-bottom: 0;
        }
        [data-theme='dark'] .tl-section {
          background: transparent;
          border-top-color: #1f2937;
          border-bottom-color: #1f2937;
        }
        .tl-section-head {
          padding: 10px 16px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          /* Sticks below the page-level header so the sprint info / actions
             stay reachable while the user scrolls long ticket lists. */
          position: sticky;
          top: var(--tl-header-h, 56px);
          z-index: 4;
        }
        [data-theme='dark'] .tl-section-head {
          background: #0f1419;
          border-bottom-color: #1f2937;
        }
        .tl-section-body { padding: 12px 0 0; }

        /* Tight table rows — applies on top of size="small" */
        .tl-table .ant-table-thead > tr > th {
          padding: 7px 12px !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        [data-theme='dark'] .tl-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          color: #94a3b8 !important;
        }
        .tl-table .ant-table-tbody > tr > td {
          padding: 6px 12px !important;
          font-size: 12.5px !important;
        }
        .tl-table .ant-table-cell {
          line-height: 1.35 !important;
        }

        /* Sticky pagination — pins to viewport bottom (inside the scrolling
           Content area) so the user always sees totals + page controls
           even with hundreds of rows above. Selector matches both Ant v5
           variants: the wrapper-element form (.ant-table-pagination) and
           the merged-class form (.ant-pagination.ant-table-pagination). */
        .tl-table-sticky-pagination .ant-table-pagination,
        .tl-table-sticky-pagination > .ant-spin-nested-loading > .ant-spin-container > .ant-pagination,
        .tl-table-sticky-pagination .ant-pagination.ant-table-pagination {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 5 !important;
          margin: 0 !important;
          padding: 8px 14px !important;
          background: var(--bg-pure-white) !important;
          border-top: 1px solid var(--border-slate-200) !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 6px !important;
        }
        [data-theme='dark'] .tl-table-sticky-pagination .ant-table-pagination,
        [data-theme='dark'] .tl-table-sticky-pagination > .ant-spin-nested-loading > .ant-spin-container > .ant-pagination,
        [data-theme='dark'] .tl-table-sticky-pagination .ant-pagination.ant-table-pagination {
          background: #0f1419 !important;
          border-top-color: #1f2937 !important;
        }
        /* Trim Ant's default pagination item heights to match small table size */
        .tl-table-sticky-pagination .ant-pagination-item,
        .tl-table-sticky-pagination .ant-pagination-prev,
        .tl-table-sticky-pagination .ant-pagination-next,
        .tl-table-sticky-pagination .ant-pagination-jump-prev,
        .tl-table-sticky-pagination .ant-pagination-jump-next {
          min-width: 28px !important;
          height: 28px !important;
          line-height: 26px !important;
          font-size: 12px !important;
        }
        .tl-table-sticky-pagination .ant-pagination-options-size-changer .ant-select-selector {
          height: 28px !important;
          font-size: 12px !important;
        }
        .tl-table-sticky-pagination .ant-pagination-total-text {
          margin-right: auto !important;
        }

        /* Ensure ancestor stacking contexts don't clip sticky pagination */
        .tl-section, .tl-section-body, .tickets-table-shell { overflow: visible !important; }

        /* ── Back-to button (filtered view section head) ─────── */
        .tl-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-700);
          letter-spacing: -0.005em;
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-back-btn:hover {
          background: var(--bg-slate-50);
          border-color: var(--text-slate-400);
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .tl-back-btn {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        [data-theme='dark'] .tl-back-btn:hover {
          background: #1c232e;
          border-color: #475569;
          color: #f1f5f9;
        }

        /* ── Cross-section search banner ──────────────────────
           Surfaces matches that live in the other section (Sprint ↔ Backlog)
           so users don't think a ticket "doesn't exist" when it's just on
           the section they aren't viewing. */
        .tl-cross-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 12px 10px;
          padding: 8px 12px;
          background: rgba(59,130,246,0.06);
          border: 1px solid rgba(59,130,246,0.22);
          border-radius: 8px;
          color: var(--text-slate-700);
        }
        [data-theme='dark'] .tl-cross-banner {
          background: rgba(59,130,246,0.14);
          border-color: rgba(59,130,246,0.35);
          color: #cbd5e1;
        }
        .tl-cross-banner-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: rgba(59,130,246,0.12);
          color: #1d4ed8;
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-cross-banner-icon {
          background: rgba(59,130,246,0.22);
          color: #93c5fd;
        }
        .tl-cross-banner-text {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: -0.005em;
        }
        .tl-cross-banner-text b {
          font-weight: 800;
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .tl-cross-banner-text b { color: #f1f5f9; }
        .tl-cross-banner-cta {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 12px;
          background: #2563eb;
          border: 1px solid #1d4ed8;
          color: #fff;
          border-radius: 999px;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: -0.005em;
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .tl-cross-banner-cta:hover {
          background: #1d4ed8;
          border-color: #1e40af;
        }

        /* ── Inline filter row (compact pill strip) ────────── */
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tl-filter-row {
          background: #0f1419;
          border-bottom-color: #1f2937;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tl-filter-row-count {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tl-filter-row-actions {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tl-filter-row-reset {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 999px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-500);
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8;
          border-color: rgba(59,130,246,0.45);
          background: rgba(59,130,246,0.06);
          border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          color: var(--text-slate-500);
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .tl-filter-row-close:hover {
          color: var(--text-slate-900);
          background: var(--bg-pure-white);
          border-color: var(--text-slate-400);
        }
        [data-theme='dark'] .tl-filter-row-reset,
        [data-theme='dark'] .tl-filter-row-close {
          border-color: #2d3748;
          color: #94a3b8;
        }

        /* ── Filter indicator chip (ticketIds filter) ──────── */
        .tl-ticketids-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px 6px 12px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.22);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: #1d4ed8;
          width: fit-content;
          margin: 0 0 4px;
          letter-spacing: -0.005em;
        }
        .tl-ticketids-chip b { font-weight: 800; }
        [data-theme='dark'] .tl-ticketids-chip {
          background: rgba(59,130,246,0.15) !important;
          border-color: rgba(59,130,246,0.32) !important;
          color: #93c5fd !important;
        }
        .tl-ticketids-clear {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 0;
          padding: 2px 6px;
          margin-left: 4px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: currentColor;
          cursor: pointer;
          font-family: inherit;
          opacity: 0.85;
          transition: opacity 0.12s ease, background 0.12s ease;
        }
        .tl-ticketids-clear:hover {
          opacity: 1;
          background: rgba(59,130,246,0.10);
        }
      `}} />

      {/* Premium Header Row - Sticky Glassmorphism */}
      <div ref={saasHeaderRef} className="saas-header-container" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        margin: '0 -24px 0 -24px',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Sidebar toggle (only visible on narrow screens via CSS) */}
        <button
          type="button"
          className="tl-sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen((v) => !v)}
          aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <BarsOutlined style={{ fontSize: 14 }} />
        </button>
        {/* Project Switcher */}
        <Dropdown
          menu={{
            items: (projects || []).map(p => ({
              key: p.value,
              label: (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 10px',
                  minWidth: 210,
                  borderRadius: 8,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: p.value === projectId ? 'var(--bg-blue-50)' : 'transparent',
                }}>
                  <div style={{
                    padding: '0 6px',
                    height: 26,
                    borderRadius: 6,
                    background: p.value === projectId
                      ? 'var(--premium-gradient)'
                      : 'var(--bg-slate-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: p.value === projectId ? '#fff' : 'var(--text-slate-500)',
                    fontSize: 9,
                    fontWeight: 800,
                    boxShadow: p.value === projectId ? 'var(--premium-shadow)' : 'none',
                    minWidth: 32
                  }}>
                    {p.code?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-slate-900)', lineHeight: '1.4' }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-slate-400)', fontWeight: 500 }}>#{p.code}</div>
                  </div>
                  {p.value === projectId && <CheckCircleOutlined style={{ color: '#10b981', fontSize: 12 }} />}
                </div>
              ),
              onClick: () => router.push(`/projects/${p.value}/tickets`)
            })),
            style: { padding: 4, borderRadius: 10, border: '1px solid var(--border-color)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }
          }}
          trigger={['click']}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }} className="project-switch-trigger transition-colors">
            <div style={{
              padding: '0 8px',
              height: 32,
              borderRadius: 6,
              background: 'var(--premium-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              boxShadow: 'var(--premium-shadow-lg)',
              minWidth: 36
            }}>
              {projectCode?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>{projectName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-slate-500)', fontWeight: 600 }}>Switch Project <CaretRightOutlined style={{ fontSize: 8 }} /></div>
            </div>
          </div>
        </Dropdown>

        <Divider type="vertical" style={{ height: 32, margin: 0, opacity: 0.5 }} />

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {!!user?.id && (
            <Tooltip
              title={
                myTicketsOnly
                  ? `Showing only ${effectiveSection === 'backlog' ? 'backlog' : effectiveSection === 'filtered' ? 'filtered' : 'sprint'} tickets assigned to you`
                  : 'Show only tickets assigned to you in the current section'
              }
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 12px',
                  background: myTicketsOnly ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-slate-50, #f8fafc)',
                  border: `1px solid ${myTicketsOnly ? 'rgba(59, 130, 246, 0.45)' : 'var(--border-color, #e2e8f0)'}`,
                  color: myTicketsOnly ? 'var(--premium-blue, #3b82f6)' : 'var(--text-slate-600, #475569)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <UserOutlined style={{ fontSize: 12 }} />
                My Tickets
                <Switch
                  size="small"
                  checked={myTicketsOnly}
                  onChange={(v) => setMyTicketsOnly(v)}
                />
              </label>
            </Tooltip>
          )}
          <Input
            placeholder="Quick search tickets..."
            prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
            className="saas-input"
            style={{ maxWidth: 280, borderRadius: 8, height: 36, background: 'transparent' }}
            value={localSearchValue}
            onChange={(e) => setLocalSearchValue(e.target.value)}
            allowClear
          />

          <Space.Compact className="ticket-filter-group">
            <Popover
              content={
                <TicketFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  members={members}
                  onReset={() => { setFilters({ status: [], priority: [], assignee: [], createdBy: [], type: [], tags: [], search: filters.search, ticketIds: [] }); setActiveQuickFilters({ commented: false, attached: false, overdue: false }); }}
                  statusOptions={finalStatusOptions}
                  priorityOptions={finalPriorityOptions}
                  typeOptions={finalTypeOptions}
                />
              }
              trigger="click"
              placement="bottomLeft"
              overlayClassName="tf-popover-overlay"
              styles={{ body: { padding: 0 } }}
            >
              <Button
                icon={<FilterOutlined />}
                className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                style={{ height: 36, fontWeight: 600 }}
              >
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </Popover>
            <Button
              icon={<ExpandAltOutlined />}
              style={{ height: 36 }}
              aria-label="Expand filters"
              onClick={() => setIsFilterRowOpen(prev => !prev)}
            />
          </Space.Compact>

          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'list' | 'board' | 'calendar')}
            options={[
              { label: 'List', value: 'list', icon: <UnorderedListOutlined style={{ fontSize: 13 }} /> },
              { label: 'Board', value: 'board', icon: <AppstoreOutlined style={{ fontSize: 13 }} /> },
              { label: 'Calendar', value: 'calendar', icon: <CalendarOutlined style={{ fontSize: 13 }} /> },
            ]}
            className="saas-segmented-premium"
          />

          {viewMode === 'list' && (
            <Popover
              trigger={['click']}
              placement="bottomRight"
              classNames={{ root: 'tickets-table-settings-popover' }}
              content={
                <div style={{ width: 240 }}>
                  {/*
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-slate-500)',
                      marginBottom: 8,
                    }}
                  >
                    <ColumnHeightOutlined style={{ fontSize: 11 }} />
                    <span>Density</span>
                  </div>
                  <Segmented
                    block
                    value={tableDensity}
                    onChange={(v) => setTableDensity(v as TicketDensity)}
                    options={[
                      { label: 'Compact', value: 'compact' },
                      { label: 'Cozy', value: 'comfortable' },
                      { label: 'Roomy', value: 'spacious' },
                    ]}
                  />
                  */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-slate-500)',
                      marginTop: 14,
                      marginBottom: 8,
                    }}
                  >
                    <UnorderedListOutlined style={{ fontSize: 11 }} />
                    <span>Columns</span>
                  </div>
                  <div
                    className="tickets-cols-scroll"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      maxHeight: 256,
                      overflowY: 'auto',
                      paddingRight: 4,
                    }}
                  >
                    {toggleableColumns.map((c) => (
                      <label
                        key={c.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          flex: '0 0 auto',
                        }}
                      >
                        <span style={{ fontSize: 12.5, color: 'var(--text-slate-700)' }}>{c.label}</span>
                        <Switch
                          size="small"
                          checked={!hiddenCols[c.key]}
                          onChange={(checked) =>
                            setHiddenCols((prev) => ({ ...prev, [c.key]: !checked }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-slate-200)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setHiddenCols({ ...TICKETS_DEFAULT_HIDDEN_COLS });
                        setTableDensity('comfortable');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#3b82f6',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: 0,
                      }}
                    >
                      Reset to defaults
                    </button>
                    <span style={{ fontSize: 10.5, color: 'var(--text-slate-400)' }}>
                      Saved automatically
                    </span>
                  </div>
                </div>
              }
            >
              <Tooltip title="Table settings">
                <Button
                  icon={<SettingOutlined />}
                  aria-label="Table settings"
                  style={{
                    height: 36,
                    width: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                  }}
                />
              </Tooltip>
            </Popover>
          )}
        </div>

        {/* Right Side Actions */}
        <Space size={12}>
          {recentTicket && (
            <div
              ref={recentTicketCardRef}
              className="ticket-highlight-glow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'var(--bg-blue-50)',
                border: '1px solid var(--border-blue-200)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div className="highlight-point" />
              <Text
                strong
                onClick={() => setSelectedTicketId(recentTicket.id)}
                style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--premium-blue)',
                  letterSpacing: '-0.01em'
                }}
                className="hover:underline"
              >
                {recentTicket.ticketNumber} Created
              </Text>
              <Divider type="vertical" style={{ margin: '0 4px', height: 14, opacity: 0.3 }} />
              <CloseOutlined
                onClick={(e) => { e.stopPropagation(); setRecentTicket(null); }}
                style={{ fontSize: 10, color: 'var(--text-slate-400)', cursor: 'pointer' }}
                className="hover:text-slate-600 transition-colors"
              />
            </div>
          )}
          <Tooltip title="Refresh view">
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={async () => {
                setIsRefreshing(true);
                // Tickets + sidebar (recent comments / attachments / overdue) in parallel.
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['tickets'] }),
                  queryClient.invalidateQueries({ queryKey: ['ticketRecentActivity'] }),
                ]);
                setIsRefreshing(false);
                message.success("View refreshed");
              }}
              style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
          {canCreateTicket && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'manual',
                    label: 'Manual Creation',
                    icon: <FileTextOutlined />,
                    onClick: () => setManualModalOpen(true)
                  },
                  {
                    key: 'instant',
                    label: 'Instant Creation',
                    icon: <ThunderboltOutlined />,
                    onClick: () => setShowCreateForm(true)
                  },
                  {
                    key: 'zai',
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        Create with Zai
                        <Tag color="purple" bordered={false} style={{ margin: 0, fontSize: 9 }}>AI</Tag>
                      </div>
                    ),
                    icon: <ThunderboltOutlined style={{ color: '#722ed1' }} />,
                    onClick: () => setAiModalOpen(true)
                  }
                ],
                style: { padding: 4, borderRadius: 10, border: '1px solid var(--border-color)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }
              }}
              trigger={['hover', 'click']}
              placement="bottomRight"
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  height: 36,
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: '0 16px',
                  background: 'var(--premium-gradient)',
                  border: 'none',
                  boxShadow: 'var(--premium-shadow-lg)'
                }}
              >
                Create Ticket <CaretDownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
              </Button>
            </Dropdown>
          )}
        </Space>
      </div>

      {/* Inline Filter Row moved into tl-main (renders after the sprint details header) */}

      {/* Inline Creation */}
      <InlineCreateTicket
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        projectId={projectId}
        filters={filters}
        projects={projects}
        members={members}
        onTicketCreated={handleTicketCreated}
      />

      {/* Tickets View — wrapped in a 2-column shell (sidebar + main) */}
      <div className={`tl-shell-wrap ${isSidebarOpen ? 'is-sidebar-open' : 'is-sidebar-closed'}`}>
        {/* Mobile backdrop — closes the sidebar drawer when tapped */}
        <div
          className="tl-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
        <div className="tl-shell">
          <TicketSidebar
            activeSprint={activeSprint as any}
            overallSprintTickets={sidebarSprintPool as any}
            totalBacklog={totalBacklog}
            currentUserId={user?.id}
            currentUserName={user?.name}
            typeOptions={finalTypeOptions as any}
            recentComments={recentActivity?.comments || []}
            recentAttachments={recentActivity?.attachments || []}
            activeSection={effectiveSection}
            isMyBacklogActive={!!user?.id && filters.assignee.length === 1 && filters.assignee[0] === user.id}
            commentedFilterActive={activeQuickFilters.commented}
            attachedFilterActive={activeQuickFilters.attached}
            overdueFilterActive={activeQuickFilters.overdue}
            overdueTickets={recentActivity?.overdue || []}
            onShowOverdueTickets={() => {
              if (!isFilteredView && (sidebarActiveSection === 'sprint' || sidebarActiveSection === 'backlog')) {
                setPreviousSection(sidebarActiveSection);
              }
              setActiveQuickFilters((prev) => ({ ...prev, overdue: !prev.overdue }));
              setPagination((prev) => ({ ...prev, current: 1 }));
              if (viewMode !== 'list') setViewMode('list');
            }}
            onShowCommentedTickets={() => {
              // Remember where the user was so the filtered view can go back.
              if (!isFilteredView && (sidebarActiveSection === 'sprint' || sidebarActiveSection === 'backlog')) {
                setPreviousSection(sidebarActiveSection);
              }
              setActiveQuickFilters((prev) => ({ ...prev, commented: !prev.commented }));
              setPagination((prev) => ({ ...prev, current: 1 }));
              if (viewMode !== 'list') setViewMode('list');
            }}
            onShowAttachedTickets={() => {
              if (!isFilteredView && (sidebarActiveSection === 'sprint' || sidebarActiveSection === 'backlog')) {
                setPreviousSection(sidebarActiveSection);
              }
              setActiveQuickFilters((prev) => ({ ...prev, attached: !prev.attached }));
              setPagination((prev) => ({ ...prev, current: 1 }));
              if (viewMode !== 'list') setViewMode('list');
            }}
            onNavigate={(section) => {
              // Leaving the filtered view should clear the quick filters too,
              // so the user goes back to a clean Sprint/Backlog view.
              if (isFilteredView) setActiveQuickFilters({ commented: false, attached: false, overdue: false });
              setSidebarActiveSection(section);
              if (viewMode !== 'list') setViewMode('list');
            }}
            onShowMyBacklog={() => {
              if (!user?.id) return;
              const isOn = filters.assignee.length === 1 && filters.assignee[0] === user.id;
              setFilters(prev => ({
                ...prev,
                assignee: isOn ? [] : [user.id],
              }));
              if (isFilteredView) setActiveQuickFilters({ commented: false, attached: false, overdue: false });
              setSidebarActiveSection('backlog');
              if (viewMode !== 'list') setViewMode('list');
            }}
            onTicketClick={(id) => setSelectedTicketId(id)}
          />
          <div className="tl-main">
      {/* Inline Filter Row — compact pill row, sits at top of main column */}
      {isFilterRowOpen && (
        <div className="tl-filter-row">
          <div className="tl-filter-row-label">
            <FilterOutlined style={{ fontSize: 11 }} />
            <span>Filters</span>
            <span className="tl-filter-row-count">
              {activeFilterCount > 0 ? activeFilterCount : '0'}
            </span>
          </div>
          <div className="tl-filter-row-pills">
            <TicketFilterPill
              icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
              label="Status"
              values={filters.status}
              options={finalStatusOptions}
              onChange={(val) => handleFilterChange('status', val)}
              itemNoun="statuses"
            />
            <TicketFilterPill
              icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
              label="Priority"
              values={filters.priority}
              options={finalPriorityOptions}
              onChange={(val) => handleFilterChange('priority', val)}
              itemNoun="priorities"
            />
            <TicketFilterPill
              icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
              label="Type"
              values={filters.type}
              options={finalTypeOptions}
              onChange={(val) => handleFilterChange('type', val)}
              itemNoun="types"
            />
            <TicketFilterPill
              icon={<UserOutlined style={{ fontSize: 11 }} />}
              label="Assignee"
              values={filters.assignee}
              options={members.map((m) => ({
                label: m.label,
                value: m.value,
                description: m.position || undefined,
              }))}
              onChange={(val) => handleFilterChange('assignee', val)}
              itemNoun="members"
              width={290}
            />
            <TicketFilterPill
              icon={<EditOutlined style={{ fontSize: 11 }} />}
              label="Created By"
              values={filters.createdBy}
              options={members.map((m) => ({
                label: m.label,
                value: m.value,
                description: m.position || undefined,
              }))}
              onChange={(val) => handleFilterChange('createdBy', val)}
              itemNoun="members"
              width={290}
            />
            <TicketFilterPill
              icon={<TagsOutlined style={{ fontSize: 11 }} />}
              label="Tags"
              values={filters.tags}
              options={tagSuggestions.map((t) => ({ label: t, value: t }))}
              onChange={(val) => handleFilterChange('tags', val)}
              itemNoun="tags"
            />
          </div>
          <div className="tl-filter-row-actions">
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="tl-filter-row-reset"
                onClick={() => {
                  setFilters({ status: [], priority: [], assignee: [], createdBy: [], type: [], tags: [], search: filters.search, ticketIds: [] });
                  setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                }}
              >
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
      {/* Legacy ticketIds chip replaced by the dedicated Filtered View section
          driven by activeQuickFilters. Kept here only as a marker. */}
      {(isRefreshing || (viewMode === 'list' ? (activeSprintLoading || backlogLoading) : viewMode === 'calendar' ? (allSprintsLoading || calendarTicketsLoading) : isKanbanLoading)) ? (
        <TicketSkeleton viewMode={viewMode === 'calendar' ? 'list' : viewMode} />
      ) : viewMode === 'calendar' ? (
        <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeSprint && !isFilteredView && (
            <div className="tl-section">
              {renderActiveSprintHeader('compact')}
            </div>
          )}
        <div className="tcal-card">
          {/* Sticky header */}
          <div className="tcal-header">
            <div className="tcal-title-block">
              <Text className="tcal-title">{calendarMonth.format('MMMM YYYY')}</Text>
              <div className="tcal-stat-row">
                <span className="tcal-stat">
                  <span className="tcal-stat-num">{calendarMonthStats.sprintCount}</span>
                  <span className="tcal-stat-label">Sprint{calendarMonthStats.sprintCount !== 1 ? 's' : ''}</span>
                </span>
                <span className="tcal-stat-sep" />
                <span className="tcal-stat">
                  <span className="tcal-stat-num">{calendarMonthStats.ticketCount}</span>
                  <span className="tcal-stat-label">Ticket{calendarMonthStats.ticketCount !== 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>
            <div className="tcal-nav">
              <Tooltip title={canCalPrev ? 'Previous month' : `No tickets before ${calendarBounds?.earliest.format('MMM YYYY')}`}>
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  onClick={() => canCalPrev && setCalendarMonth(m => m.subtract(1, 'month'))}
                  disabled={!canCalPrev}
                  className="tcal-nav-btn"
                />
              </Tooltip>
              <Button
                size="small"
                onClick={() => {
                  const today = dayjs();
                  if (!calendarBounds) { setCalendarMonth(today); return; }
                  if (today.isBefore(calendarBounds.earliest, 'month')) setCalendarMonth(calendarBounds.earliest);
                  else if (today.isAfter(calendarBounds.latest.add(3, 'month'), 'month')) setCalendarMonth(calendarBounds.latest);
                  else setCalendarMonth(today);
                }}
                className="tcal-nav-btn tcal-nav-today"
              >
                Current Month
              </Button>
              <Tooltip title={canCalNext ? 'Next month' : 'No tickets further ahead'}>
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  onClick={() => canCalNext && setCalendarMonth(m => m.add(1, 'month'))}
                  disabled={!canCalNext}
                  className="tcal-nav-btn"
                />
              </Tooltip>
            </div>
          </div>

          {/* Body — week sections */}
          <div className="tcal-body">
            {calendarSprintTickets.length === 0 ? (
              <div className="tcal-empty">
                <CalendarOutlined style={{ fontSize: 28, color: 'var(--text-slate-400)' }} />
                <div className="tcal-empty-title">No scheduled sprint tickets</div>
                <div className="tcal-empty-sub">Tickets need a sprint and date range to appear on the calendar.</div>
              </div>
            ) : (
              calendarData.weeks.map((week, wi) => {
                const lanes = calendarData.maxLanesByWeek[wi];
                const ribbonHeight = lanes > 0 ? lanes * 24 + 14 : 0;
                const ribbons = calendarData.weekRibbons[wi];
                const weekStart = week[0];
                const weekEnd = week[6];
                const dayOfYear = weekStart.diff(weekStart.startOf('year'), 'day');
                const weekNum = Math.floor(dayOfYear / 7) + 1;
                const containsToday = week.some(d => d.isSame(dayjs(), 'day'));
                return (
                  <section className={`tcal-week ${containsToday ? 'has-today' : ''}`} key={wi}>
                    <header className="tcal-week-label">
                      <div className="tcal-week-label-left">
                        <span className="tcal-week-num">Week {weekNum}</span>
                        <span className="tcal-week-range">{weekStart.format('MMM D')} – {weekEnd.format(weekStart.month() === weekEnd.month() ? 'D, YYYY' : 'MMM D, YYYY')}</span>
                      </div>
                      <span className="tcal-week-count">
                        {ribbons.length === 0 ? 'No tickets' : `${ribbons.length} ticket${ribbons.length !== 1 ? 's' : ''}`}
                      </span>
                    </header>
                    <div className="tcal-week-grid">
                      <div className="tcal-week-days">
                        {week.map((day, di) => {
                          const isOutside = day.month() !== calendarMonth.month();
                          const isToday = day.isSame(dayjs(), 'day');
                          const isWeekend = day.day() === 0 || day.day() === 6;
                          return (
                            <div key={di} className={`tcal-day ${isOutside ? 'outside' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                              <span className="tcal-day-wd">{day.format('ddd')}</span>
                              <span className={`tcal-day-num ${isToday ? 'today' : ''}`}>{day.format('D')}</span>
                            </div>
                          );
                        })}
                      </div>
                      {ribbonHeight > 0 ? (
                        <div className="tcal-week-ribbons" style={{ height: ribbonHeight }}>
                          {ribbons.map(r => {
                            const left = (r.startCol / 7) * 100;
                            const width = (r.span / 7) * 100;
                            const t = r.ticket;
                            const statusCfg = (() => {
                              const k = (t.status || '').toLowerCase();
                              if (k === 'completed' || k === 'done') return { dot: '#10b981', label: 'Done' };
                              if (k === 'in_progress' || k === 'active') return { dot: '#3b82f6', label: 'In Progress' };
                              if (k === 'review') return { dot: '#8b5cf6', label: 'Review' };
                              if (k === 'open' || k === 'todo' || k === 'pending') return { dot: '#f59e0b', label: 'To Do' };
                              return { dot: '#94a3b8', label: t.status || '—' };
                            })();
                            const prio = (t.priority || '').toLowerCase();
                            return (
                              <Tooltip
                                key={`${t.id}-${wi}`}
                                overlayClassName="tcal-tooltip-wrap"
                                mouseEnterDelay={0.15}
                                placement="top"
                                title={
                                  <div className="tcal-tooltip">
                                    <span className="tcal-tooltip-accent" style={{ background: r.color }} />
                                    <div className="tcal-tooltip-head">
                                      <div className="tcal-tooltip-title-block">
                                        <div className="tcal-tooltip-num">{t.ticketNumber}</div>
                                        <div className="tcal-tooltip-name">{t.title}</div>
                                        {r.sprintName && (
                                          <div className="tcal-tooltip-sprint">
                                            <span className="tcal-tooltip-sprint-dot" style={{ background: r.color }} />
                                            {r.sprintName}
                                          </div>
                                        )}
                                      </div>
                                      <div className="tcal-tooltip-badges">
                                        <span className="tcal-tooltip-status" style={{ color: statusCfg.dot, background: `${statusCfg.dot}1f`, borderColor: `${statusCfg.dot}40` }}>
                                          <span className="tcal-tooltip-status-dot" style={{ background: statusCfg.dot }} />
                                          {statusCfg.label}
                                        </span>
                                        {t.priority && (
                                          <span className={`tcal-tooltip-prio tcal-tooltip-prio-${prio}`}>
                                            <FlagOutlined style={{ fontSize: 9 }} />
                                            {t.priority}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="tcal-tooltip-divider" />
                                    <div className="tcal-tooltip-meta">
                                      <span className="tcal-tooltip-meta-item">
                                        <CalendarOutlined style={{ fontSize: 9 }} />
                                        <b>{dayjs(r.startDate).format('MMM D')}</b>
                                        <span className="tcal-tooltip-arrow">→</span>
                                        <b>{dayjs(r.endDate).format('MMM D, YYYY')}</b>
                                      </span>
                                      {t.assignee && (
                                        <span className="tcal-tooltip-meta-item">
                                          <UserOutlined style={{ fontSize: 9 }} />
                                          {t.assignee.name}
                                        </span>
                                      )}
                                      {typeof t.storyPoint === 'number' && (
                                        <span className="tcal-tooltip-meta-item">
                                          <ThunderboltOutlined style={{ fontSize: 9 }} />
                                          {t.storyPoint} pt{t.storyPoint !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                    <div className="tcal-tooltip-footer">
                                      Click to view ticket
                                    </div>
                                  </div>
                                }
                              >
                                <button
                                  className={`tcal-ribbon ${r.continuesLeft ? 'cont-left' : ''} ${r.continuesRight ? 'cont-right' : ''}`}
                                  style={{
                                    left: `calc(${left}% + 4px)`,
                                    width: `calc(${width}% - 8px)`,
                                    top: 6 + r.lane * 24,
                                    background: `linear-gradient(135deg, ${r.color}1f, ${r.color}40)`,
                                    borderColor: `${r.color}66`,
                                    color: r.color,
                                  }}
                                  onClick={() => setSelectedTicketId(t.id)}
                                >
                                  <span className="tcal-ribbon-dot" style={{ background: statusCfg.dot }} />
                                  <span className="tcal-ribbon-num">{t.ticketNumber}</span>
                                  {r.span > 1 && (
                                    <span className="tcal-ribbon-title">{t.title}</span>
                                  )}
                                </button>
                              </Tooltip>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="tcal-week-empty">No tickets scheduled this week</div>
                      )}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          {/* Sticky footer — sprint legend */}
          {allProjectSprints.length > 0 && (
            <div className="tcal-legend">
              <span className="tcal-legend-label">Sprints</span>
              {(calLegendExpanded ? allProjectSprints : allProjectSprints.slice(0, CAL_LEGEND_LIMIT)).map((s: any, i: number) => {
                const c = SPRINT_PALETTE[i % SPRINT_PALETTE.length];
                return (
                  <span key={s.id} className="tcal-legend-chip" title={s.version || s.name}>
                    <span className="tcal-legend-dot" style={{ background: c }} />
                    {s.version || s.name}
                  </span>
                );
              })}
              {allProjectSprints.length > CAL_LEGEND_LIMIT && (
                <button className="tcal-legend-toggle" onClick={() => setCalLegendExpanded(v => !v)}>
                  {calLegendExpanded ? 'Show less' : `+${allProjectSprints.length - CAL_LEGEND_LIMIT} more`}
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Sprint Section (only when Sprint selected in left nav) */}
          {activeSprint && !isFilteredView && sidebarActiveSection === 'sprint' && (
            <div id="active-section" ref={activeSprintCardRef} style={{ scrollMarginTop: `calc(var(--tl-header-h, 56px) + 4px)` }} className="tl-section">
              {renderActiveSprintHeader('list')}
              <div className="tl-section-body">
                {filters.search && !activeSprintFetching && activeTickets.length === 0 && totalBacklog > 0 && (
                  <div className="tl-cross-banner">
                    <span className="tl-cross-banner-icon">
                      <SearchOutlined style={{ fontSize: 12 }} />
                    </span>
                    <span className="tl-cross-banner-text">
                      No matches for <b>“{filters.search}”</b> in this sprint —{' '}
                      <b>{totalBacklog}</b> match{totalBacklog === 1 ? '' : 'es'} in the backlog.
                    </span>
                    <button
                      type="button"
                      className="tl-cross-banner-cta"
                      onClick={() => setSidebarActiveSection('backlog')}
                    >
                      View in Backlog
                      <RightOutlined style={{ fontSize: 10 }} />
                    </button>
                  </div>
                )}
                <Table
                  rowSelection={activeRowSelection}
                  columns={(getColumns('active') || []).filter((c: any) => !hiddenCols[c.key as string])}
                  dataSource={activeTickets}
                  loading={activeSprintFetching}
                  rowKey="id"
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '15', '25', '50'],
                    showTotal: (total) => <Text type="secondary" style={{ fontSize: 12 }}>Total <b>{total}</b> tickets</Text>,
                  }}
                  scroll={{ x: 'max-content' }}
                  tableLayout="fixed"
                  className="saas-table tl-table tl-table-sticky-pagination"
                  size="small"
                />
              </div>
            </div>
          )}

          {/* Backlog Section (only when Backlog selected in left nav) */}
          {!isFilteredView && sidebarActiveSection === 'backlog' && (
          <div id="backlog-section" style={{ scrollMarginTop: `calc(var(--tl-header-h, 56px) + 4px)` }} className="tl-section">
            <div
              className="tl-section-head"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flex: '1' }}>
                    <ProjectOutlined style={{ color: 'var(--text-slate-500)', fontSize: 18 }} />
                    <Text style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-slate-900)' }}>Backlog</Text>
                    <Tag bordered={false} style={{
                      margin: 0,
                      height: 24,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 90,
                      background: 'var(--bg-slate-50)',
                      color: 'var(--text-slate-500)',
                      fontWeight: 800,
                      fontSize: 10,
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      border: '1px solid var(--border-color)'
                    }}>
                      {totalBacklog} Tickets
                    </Tag>
                  </div>
                  <Space size={12}>
                    <Select
                      mode="multiple"
                      placeholder="Filter Status"
                      style={{ width: 160 }}
                      value={backlogStatusFilter}
                      onChange={setBacklogStatusFilter}
                      options={finalStatusOptions}
                      allowClear
                      maxTagCount={1}
                      className="saas-select-minimal"
                    />
                    {backlogSelectedRowKeys.length > 0 && (
                      <Space size={8}>
                        {canManageTickets && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<FolderAddOutlined style={{ fontSize: 11 }} />}
                            onClick={() => bulkArchiveMutation.mutate(backlogSelectedRowKeys as string[])}
                            style={{ 
                              background: 'var(--premium-blue)', 
                              borderColor: 'var(--premium-blue)', 
                              fontWeight: 800, 
                              height: 24, 
                              fontSize: 10, 
                              borderRadius: 4,
                              textTransform: 'uppercase'
                            }}
                          >
                            Move to Archive
                          </Button>
                        )}
                        {canDeleteTicket && (
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                            onClick={() => {
                              modal.confirm({
                                title: 'Move to Trash',
                                content: `Are you sure you want to move ${backlogSelectedRowKeys.length} selected tickets to trash?`,
                                okText: 'Move to Trash',
                                okType: 'danger',
                                onOk: () => bulkDeleteMutation.mutate(backlogSelectedRowKeys as string[])
                              });
                            }}
                            style={{ 
                              fontWeight: 800, 
                              height: 24, 
                              fontSize: 10, 
                              borderRadius: 4,
                              textTransform: 'uppercase'
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </Space>
                    )}
                    <Input
                      placeholder="Search backlog..."
                      prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                      className="saas-input"
                      style={{ width: 220, borderRadius: 6, height: 32, fontSize: 12, background: 'transparent' }}
                      value={backlogSearchValue}
                      onChange={(e) => setBacklogSearchValue(e.target.value)}
                      allowClear
                    />
                    <Divider type="vertical" style={{ height: 20, margin: 0 }} />
                    {activeSprint && (
                      <Button
                        type="default"
                        icon={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
                        onClick={() => setSidebarActiveSection('sprint')}
                        className="saas-button-item"
                        style={{ height: 32, fontWeight: 600 }}
                      >
                        Go To Sprint
                      </Button>
                    )}
                    {canCreateTicketPlan && (
                      <Button
                        type="default"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateSprintModalOpen(true)}
                        className="saas-button-item"
                        style={{ height: 32, fontWeight: 600 }}
                      >
                        New Sprint
                      </Button>
                    )}
                  </Space>


                </div>
            <div className="tl-section-body">
              {filters.search && !backlogFetching && totalBacklog === 0 && activeTickets.length > 0 && (
                <div className="tl-cross-banner">
                  <span className="tl-cross-banner-icon">
                    <SearchOutlined style={{ fontSize: 12 }} />
                  </span>
                  <span className="tl-cross-banner-text">
                    No matches for <b>“{filters.search}”</b> in the backlog —{' '}
                    <b>{activeTickets.length}</b> match{activeTickets.length === 1 ? '' : 'es'} in the active sprint.
                  </span>
                  <button
                    type="button"
                    className="tl-cross-banner-cta"
                    onClick={() => setSidebarActiveSection('sprint')}
                  >
                    View in Sprint
                    <RightOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              )}
              <div className="tickets-table-shell" data-density="compact">
                <Table
                  rowSelection={backlogRowSelection}
                  columns={(getColumns('backlog') || []).filter((c: any) => !hiddenCols[c.key as string])}
                  loading={backlogFetching}
                  dataSource={backlogTickets}
                  rowKey="id"
                  className="saas-table tl-table tl-table-sticky-pagination"
                  size="small"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: totalBacklog,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '15', '25', '50'],
                    showTotal: (total) => <Text type="secondary" style={{ fontSize: 12 }}>Total <b>{total}</b> tickets</Text>,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 15 })
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </div>
          </div>
          )}

          {/* Filtered View — unified set of tickets matching the sidebar quick filters.
              Pulls from across the project (no sprint/backlog scope) so commented +
              attached tickets from either side land in one table. */}
          {isFilteredView && (
            <div id="filtered-section" className="tl-section">
              <div className="tl-section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flex: '1', minWidth: 0 }}>
                  <button
                    type="button"
                    className="tl-back-btn"
                    onClick={() => {
                      setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                      setSidebarActiveSection(previousSection);
                    }}
                  >
                    <ArrowLeftOutlined style={{ fontSize: 11 }} />
                    Back to {previousSection === 'sprint' ? 'Sprint' : 'Backlog'}
                  </button>
                  <Text style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-slate-900)' }}>
                    {filteredViewKindLabel}
                  </Text>
                  <Tag bordered={false} style={{
                    margin: 0, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-slate-50)', color: 'var(--text-slate-500)',
                    fontWeight: 800, fontSize: 10, borderRadius: 4, textTransform: 'uppercase',
                    border: '1px solid var(--border-slate-200)', padding: '0 8px'
                  }}>
                    {filteredViewTotal || quickFilterTicketIds.length} Tickets
                  </Tag>
                  {activeQuickFilters.commented && (
                    <Tag bordered={false} style={{
                      margin: 0, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(59,130,246,0.10)', color: '#1d4ed8',
                      fontWeight: 800, fontSize: 10, borderRadius: 4, textTransform: 'uppercase',
                      border: '1px solid rgba(59,130,246,0.25)', padding: '0 8px'
                    }}>
                      <MessageOutlined style={{ fontSize: 10, marginRight: 4 }} />
                      Commented
                    </Tag>
                  )}
                  {activeQuickFilters.attached && (
                    <Tag bordered={false} style={{
                      margin: 0, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(99,102,241,0.10)', color: '#4338ca',
                      fontWeight: 800, fontSize: 10, borderRadius: 4, textTransform: 'uppercase',
                      border: '1px solid rgba(99,102,241,0.25)', padding: '0 8px'
                    }}>
                      <PaperClipOutlined style={{ fontSize: 10, marginRight: 4 }} />
                      Attached
                    </Tag>
                  )}
                  {activeQuickFilters.overdue && (
                    <Tag bordered={false} style={{
                      margin: 0, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(239,68,68,0.10)', color: '#b91c1c',
                      fontWeight: 800, fontSize: 10, borderRadius: 4, textTransform: 'uppercase',
                      border: '1px solid rgba(239,68,68,0.28)', padding: '0 8px'
                    }}>
                      <WarningOutlined style={{ fontSize: 10, marginRight: 4 }} />
                      Overdue
                    </Tag>
                  )}
                </div>
              </div>
              <div className="tl-section-body">
                <Table
                  columns={(getColumns('backlog') || []).filter((c: any) => !hiddenCols[c.key as string])}
                  dataSource={filteredViewTickets}
                  loading={filteredViewFetching}
                  rowKey="id"
                  className="saas-table tl-table tl-table-sticky-pagination"
                  size="small"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredViewTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '15', '25', '50'],
                    showTotal: (total) => <Text type="secondary" style={{ fontSize: 12 }}>Total <b>{total}</b> tickets</Text>,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 15 })
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeSprint && !isFilteredView && kanbanScope === 'active' && (
            <div className="tl-section">
              {renderActiveSprintHeader('compact')}
            </div>
          )}
          {kanbanData ? (
            <TicketKanban
              tickets={kanbanData.columns ? Object.values(kanbanData.columns).flatMap((col: any) => col.tickets) : []}
              projects={projects}
              members={members}
              onTicketUpdate={handleKanbanUpdate}
              activeSprint={activeSprint}
              kanbanScope={kanbanScope}
              onScopeChange={setKanbanScope}
              onSprintAssignment={handleSprintAssignment}
              onCompleteSprint={handleCompleteSprint}
              filters={filters}
              onFilterChange={handleFilterChange}
              onTicketClick={setSelectedTicketId}
              hideSprintMeta={!!activeSprint && !isFilteredView && kanbanScope === 'active'}
              permissions={{ canUpdateTicket, canDeleteTicket, canAssignTicket, canManageTickets }}
            />
          ) : (
            <Card className="saas-card"><Empty description="No tickets found" /></Card>
          )}
        </div>
      )}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <TicketDetailDrawer
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketIds={allTicketIds}
        onNavigate={setSelectedTicketId}
      />

      <SprintCompletionModal
        sprintId={activeSprint?.id || null}
        open={sprintCompletionModalOpen}
        onClose={() => setSprintCompletionModalOpen(false)}
        onSuccess={handleSprintCompletionSuccess}
      />

      <Modal
        open={createSprintModalOpen}
        onCancel={() => setCreateSprintModalOpen(false)}
        footer={null}
        title={null}
        closable={false}
        width={580}
        centered
        destroyOnHidden
        className="sprint-creation-modal"
        styles={{
          body: { padding: 0 },
          content: {
            padding: 0,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid var(--border-slate-200)",
            boxShadow: "none",
          },
        }}
      >
        <SprintCreationForm
          projectId={projectId}
          isDraft={!!activeSprint}
          loading={creatingSprintLoading}
          onSubmit={handleCreateSprintFromBacklog}
          onCancel={() => setCreateSprintModalOpen(false)}
        />
      </Modal>
      <ManualCreateTicketModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        projectId={projectId}
        onTicketCreated={handleTicketCreated}
      />

      <AiCreateTicketModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        projectId={projectId}
        onTicketCreated={handleTicketCreated}
      />

      <style jsx global>{`
        /* ── Ticket Calendar view ────────────────────────────── */
        .tcal-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          position: relative;
        }
        [data-theme='dark'] .tcal-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .tcal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          gap: 12px;
          position: sticky;
          top: 52px;
          z-index: 5;
          border-radius: 12px 12px 0 0;
        }
        [data-theme='dark'] .tcal-header {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .tcal-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .tcal-title {
          font-size: 18px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        [data-theme='dark'] .tcal-title { color: #f1f5f9 !important; }
        .tcal-stat-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .tcal-stat {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
        }
        .tcal-stat-num {
          font-size: 12.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tcal-stat-num { color: #f1f5f9 !important; }
        .tcal-stat-label {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        [data-theme='dark'] .tcal-stat-label { color: #94a3b8 !important; }
        .tcal-stat-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--text-slate-300);
        }
        [data-theme='dark'] .tcal-stat-sep { background: #475569; }
        .tcal-nav {
          display: inline-flex;
          gap: 4px;
        }
        .tcal-nav-btn {
          border-radius: 8px !important;
          height: 32px !important;
          font-weight: 700 !important;
        }
        .tcal-nav-today {
          padding: 0 12px !important;
          font-size: 11.5px !important;
        }

        /* Body */
        .tcal-body {
          background: var(--bg-slate-50);
        }
        [data-theme='dark'] .tcal-body {
          background: #0b0f1a !important;
        }
        .tcal-week {
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tcal-week {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        .tcal-week:last-child { border-bottom: none; }
        .tcal-week.has-today {
          background: linear-gradient(180deg, rgba(59,130,246,0.025), var(--bg-pure-white));
        }
        [data-theme='dark'] .tcal-week.has-today {
          background: linear-gradient(180deg, rgba(59,130,246,0.06), #161b22) !important;
        }
        .tcal-week-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          gap: 12px;
        }
        [data-theme='dark'] .tcal-week-label {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
        }
        .tcal-week.has-today .tcal-week-label {
          background: rgba(59,130,246,0.06);
          border-bottom-color: rgba(59,130,246,0.2);
        }
        [data-theme='dark'] .tcal-week.has-today .tcal-week-label {
          background: rgba(59,130,246,0.12) !important;
          border-bottom-color: rgba(59,130,246,0.3) !important;
        }
        .tcal-week-label-left {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }
        .tcal-week-num {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-slate-700);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .tcal-week-num { color: #cbd5e1 !important; }
        .tcal-week.has-today .tcal-week-num {
          color: #1d4ed8;
        }
        [data-theme='dark'] .tcal-week.has-today .tcal-week-num {
          color: #60a5fa !important;
        }
        .tcal-week-range {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tcal-week-range { color: #94a3b8 !important; }
        .tcal-week-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
        }
        [data-theme='dark'] .tcal-week-count { color: #94a3b8 !important; }
        .tcal-week-grid {
          position: relative;
        }
        .tcal-week-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }
        .tcal-day {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 12px;
          border-right: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .tcal-day {
          border-right-color: #1f2937 !important;
        }
        .tcal-day:last-child { border-right: none; }
        .tcal-day.weekend:not(.outside) {
          background: linear-gradient(180deg, rgba(148,163,184,0.04), transparent);
        }
        .tcal-day.today {
          background: rgba(59,130,246,0.04);
        }
        [data-theme='dark'] .tcal-day.today {
          background: rgba(59,130,246,0.1) !important;
        }
        .tcal-day.outside .tcal-day-wd,
        .tcal-day.outside .tcal-day-num {
          opacity: 0.45;
        }
        .tcal-day-wd {
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .tcal-day-wd { color: #94a3b8 !important; }
        .tcal-day.today .tcal-day-wd {
          color: #1d4ed8;
        }
        [data-theme='dark'] .tcal-day.today .tcal-day-wd {
          color: #60a5fa !important;
        }
        .tcal-day-num {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-700);
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tcal-day-num { color: #cbd5e1 !important; }
        .tcal-day-num.today {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: #3b82f6;
          color: #fff !important;
          border-radius: 999px;
          font-weight: 800;
        }
        .tcal-week-ribbons {
          position: relative;
          padding: 0 0 12px;
        }
        .tcal-week-empty {
          padding: 14px 18px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-400);
          font-style: italic;
        }
        [data-theme='dark'] .tcal-week-empty {
          color: #64748b !important;
        }

        /* Ribbon */
        .tcal-ribbon {
          position: absolute;
          height: 20px;
          padding: 0 7px;
          border-radius: 5px;
          border: 1px solid;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: -0.005em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          overflow: hidden;
          white-space: nowrap;
          text-align: left;
          transition: filter 0.15s ease, transform 0.15s ease;
          pointer-events: auto;
        }
        .tcal-ribbon:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .tcal-ribbon.cont-left {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          border-left: none;
          padding-left: 5px;
        }
        .tcal-ribbon.cont-right {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-right: none;
          padding-right: 5px;
        }
        .tcal-ribbon-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tcal-ribbon-num {
          font-family: ui-monospace, monospace;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
          opacity: 0.85;
        }
        .tcal-ribbon-title {
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 1;
        }

        /* Empty state */
        .tcal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 8px;
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .tcal-empty {
          background: #161b22 !important;
        }
        .tcal-empty-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.015em;
          margin-top: 8px;
        }
        [data-theme='dark'] .tcal-empty-title { color: #f1f5f9 !important; }
        .tcal-empty-sub {
          font-size: 12px;
          color: var(--text-slate-500);
          font-weight: 500;
          max-width: 360px;
          text-align: center;
        }
        [data-theme='dark'] .tcal-empty-sub { color: #94a3b8 !important; }

        /* Legend (sticky footer) */
        .tcal-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          flex-wrap: wrap;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          position: sticky;
          bottom: 0;
          z-index: 5;
          border-radius: 0 0 12px 12px;
        }
        [data-theme='dark'] .tcal-legend {
          background: #0f1419 !important;
          border-top-color: #1f2937 !important;
        }
        .tcal-legend-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-right: 4px;
        }
        [data-theme='dark'] .tcal-legend-label { color: #94a3b8 !important; }
        .tcal-legend-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-700);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .tcal-legend-chip {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1 !important;
        }
        .tcal-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tcal-legend-toggle {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: transparent;
          border: 1px dashed var(--border-slate-300, #cbd5e1);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          cursor: pointer;
          font-family: inherit;
        }
        .tcal-legend-toggle:hover {
          background: rgba(59,130,246,0.08);
          border-color: rgba(59,130,246,0.4);
          color: #1d4ed8;
        }
        [data-theme='dark'] .tcal-legend-toggle {
          color: #60a5fa;
          border-color: #2d3748;
        }

        /* Hover tooltip card */
        .tcal-tooltip-wrap .ant-tooltip-arrow { display: none !important; }
        .tcal-tooltip-wrap .ant-tooltip-inner {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          min-width: 300px !important;
          max-width: 340px !important;
        }
        .tcal-tooltip {
          width: 300px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          padding: 12px 14px 10px 16px;
          position: relative;
          overflow: hidden;
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .tcal-tooltip {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          color: #f1f5f9 !important;
        }
        .tcal-tooltip-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }
        .tcal-tooltip-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .tcal-tooltip-title-block {
          min-width: 0;
          flex: 1;
        }
        .tcal-tooltip-num {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          letter-spacing: 0.04em;
        }
        [data-theme='dark'] .tcal-tooltip-num { color: #94a3b8 !important; }
        .tcal-tooltip-name {
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.3;
          margin-top: 2px;
          color: var(--text-slate-900);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        [data-theme='dark'] .tcal-tooltip-name { color: #f1f5f9 !important; }
        .tcal-tooltip-sprint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-600);
          margin-top: 4px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .tcal-tooltip-sprint { color: #cbd5e1 !important; }
        .tcal-tooltip-sprint-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tcal-tooltip-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }
        .tcal-tooltip-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 999px;
          border: 1px solid;
        }
        .tcal-tooltip-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .tcal-tooltip-prio {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 6px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-radius: 4px;
        }
        .tcal-tooltip-prio-high { color: #dc2626; background: rgba(239,68,68,0.1); }
        .tcal-tooltip-prio-medium { color: #d97706; background: rgba(245,158,11,0.1); }
        .tcal-tooltip-prio-low { color: #059669; background: rgba(16,185,129,0.1); }
        [data-theme='dark'] .tcal-tooltip-prio-high { color: #f87171; background: rgba(239,68,68,0.15); }
        [data-theme='dark'] .tcal-tooltip-prio-medium { color: #fbbf24; background: rgba(245,158,11,0.15); }
        [data-theme='dark'] .tcal-tooltip-prio-low { color: #34d399; background: rgba(16,185,129,0.15); }
        .tcal-tooltip-divider {
          height: 1px;
          background: var(--border-slate-100);
          margin: 10px 0 8px;
        }
        [data-theme='dark'] .tcal-tooltip-divider { background: #1f2937 !important; }
        .tcal-tooltip-meta {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .tcal-tooltip-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-600);
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tcal-tooltip-meta-item { color: #cbd5e1 !important; }
        .tcal-tooltip-meta-item b {
          color: var(--text-slate-900);
          font-weight: 700;
        }
        [data-theme='dark'] .tcal-tooltip-meta-item b { color: #f1f5f9 !important; }
        .tcal-tooltip-arrow {
          color: var(--text-slate-400);
          font-weight: 600;
        }
        .tcal-tooltip-footer {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px dashed var(--border-slate-200);
          font-size: 9.5px;
          font-weight: 800;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .tcal-tooltip-footer {
          border-top-color: #2d3748 !important;
          color: #64748b !important;
        }

        @media (max-width: 900px) {
          .tcal-day { padding: 6px 8px; }
          .tcal-ribbon { font-size: 9px; padding: 0 5px; height: 18px; }
          .tcal-ribbon-title { display: none; }
        }
      `}</style>
    </div>
  );
}

