"use client";

import NoData from "@/components/common/NoData";
import React, { useState, useEffect, useRef, useMemo } from "react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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
  Drawer,
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
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
  CopyOutlined,
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
  WarningOutlined, CloudSyncOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useTheme } from "@/context/ThemeContext";

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
import { useAllProjects, useProjectMembers } from "@/hooks/useGlobalData";
import { InlineCreateTicket } from "./InlineCreateTicket";
import { TicketFilters } from "./TicketFilters";
import { TicketKanban } from './kanban/TicketKanban';
import ReleasePlanService from "@/services/releasePlanService";
import { TicketDetailDrawer } from "./drawer/TicketDetailDrawer";
import { SprintCompletionModal } from "./sprint-completion";
import { SprintCreationForm, type SprintFormData } from "./sprint-completion/SprintCreationForm";
import { commonDrawerProps, drawerFormStyles } from '@/components/common/DrawerSection';
import { ManualCreateTicketModal } from "./ManualCreateTicketModal";
import { AiCreateTicketModal } from "./AiCreateTicketModal";
import TicketSkeleton from "./TicketSkeleton";
import JiraMigrationWizard from "../jira/JiraMigrationWizard";
import LinearMigrationWizard from "../linear/LinearMigrationWizard";
import { api } from "@/lib/axios";
import TicketSidebar from "./TicketSidebar";
import TicketFilterPill, { initialsFor, avatarColorFor } from "./TicketFilterPill";
import { TablePreferenceService } from "@/services/tablePreferenceService";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { Title, Text } = Typography;

// Stable hue (0-359) derived from a string — gives each project a consistent
// accent color for its code badge in the project switcher.
const projHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

type TicketDensity = "compact" | "comfortable" | "spacious";
const TICKETS_TABLE_KEY = "tickets_list_v1";
const SIDEBAR_OPEN_STORAGE_KEY = "tl_sidebar_open_v1";
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
  const { theme } = useTheme();
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

  const [jiraWizardVisible, setJiraWizardVisible] = useState(false);
  const [linearWizardVisible, setLinearWizardVisible] = useState(false);
  const { data: jiraStatus } = useQuery({
    queryKey: ["jiraStatus"],
    queryFn: async () => {
      try {
        const res = await api.get('/api/integrations/jira/status');
        return res; // api.get already unwraps response.data.data
      } catch (err) {
        return null;
      }
    }
  });
  const jiraConnected = !!jiraStatus?.connected;
  const { data: linearStatus } = useQuery({
    queryKey: ["linearStatus"],
    queryFn: async () => {
      try {
        const res = await api.get('/api/integrations/linear/status');
        return res; 
      } catch (err) {
        return null;
      }
    }
  });
  const linearConnected = !!linearStatus?.connected;

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
  /** Set when the manual modal is opened from a kanban column "+" button — the
   * column's status is applied to the new ticket instead of the default. */
  const [manualCreateDefaultStatus, setManualCreateDefaultStatus] = useState<string | undefined>(undefined);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  // Sprint actions bar state
  const [buckets, setBuckets] = useState<any[]>([]);
  const [bucketsLoading, setBucketsLoading] = useState(false);
  const [bucketDropdownOpen, setBucketDropdownOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [sprintDropdownOpen, setSprintDropdownOpen] = useState(false);
  const [allSprints, setAllSprints] = useState<any[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  // Sidebar visibility. Defaults to OPEN for every user; once the user
  // toggles it (via the header show/hide button or the mobile drawer
  // trigger), the choice is persisted in localStorage and restored on
  // subsequent visits. No automatic resize/breakpoint override — the
  // user's last explicit choice wins across viewport changes.
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {
      // localStorage unavailable (private mode etc.) — fall through to default
    }
    return true;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(isSidebarOpen));
    } catch {
      // ignore quota / privacy errors — UI still works without persistence
    }
  }, [isSidebarOpen]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [allTicketIds, setAllTicketIds] = useState<string[]>([]);
  const [sidebarActiveSection, setSidebarActiveSection] = useState<"sprint" | "backlog" | "filtered" | null>("sprint");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1099.98px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent | any) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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
  const { data: members = [], isLoading: membersLoading } = useProjectMembers(projectId);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [activePagination, setActivePagination] = useState({
    current: 1,
    pageSize: 20,
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
  const baseQueryParams = {
    projectId, // From props, mandatory project context
    status: filters.status.length > 0 ? filters.status.join(",") : undefined,
    priority: filters.priority.length > 0 ? filters.priority.join(",") : undefined,
    assigneeId:
      filters.assignee.length > 0 ? filters.assignee.join(",") : undefined,
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

  // Query Params for Active Sprint List (WITH PAGINATION)
  const activeSprintParams = {
    ...baseQueryParams,
    sprintId: 'active',
    page: activePagination.current,
    limit: activePagination.pageSize,
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

  // Unfiltered backlog data query to keep total backlog count in sidebar constant
  const { data: unfilteredBacklogData } = useTickets({
    projectId,
    sprintId: 'null',
    limit: 1
  }, {
    enabled: !!projectId && canReadTicket,
  });
  const totalBacklogCount = unfilteredBacklogData?.pagination?.total || 0;

  // Logged-in user's backlog data query to show correct count for My Backlog Tickets in sidebar
  const { data: myBacklogData } = useTickets({
    projectId,
    sprintId: 'null',
    assigneeId: user?.id?.toString() || undefined,
    limit: 1
  }, {
    enabled: !!projectId && !!user?.id && canReadTicket,
  });
  const myBacklogCount = myBacklogData?.pagination?.total || 0;

  // Default "All Tickets" query (Legacy support or if we toggle off split view? 
  // User wants SPLIT view. So we might not need the unified query anymore for List view.
  // But we keep it if we want to support filtering without sprint context?
  // User asked for specific split. We will use these two data sources.)

  const activeTickets = activeSprintData?.data || [];
  const totalActiveTickets = activeSprintData?.pagination?.total || 0;

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
    kind: 'added' | 'removed' | 'error' | 'no-active-sprint',
    label?: string
  ) => {
    if (kind === 'added') {
      message.success(`Ticket added to ${label} successfully`);
    } else if (kind === 'removed') {
      message.success(`Ticket removed from sprint successfully`);
    } else if (kind === 'error') {
      message.error(`Sprint update failed`);
    } else if (kind === 'no-active-sprint') {
      modal.info({
        title: 'Action Required',
        content: 'First create a sprint, then move the ticket into the sprint.',
        okText: 'Got it',
        centered: true,
      });
    }
  };

  const handleSprintAssignment = (ticketId: string, action: 'add' | 'remove') => {
    if (action === 'add' && !activeSprint) {
      showSprintTinyToast('no-active-sprint');
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
      setPagination(prev => ({ ...prev, current: 1, pageSize: 20 }));
    } else {
      setPagination(prev => ({ ...prev, current: 1, pageSize: 20 }));
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
        width: 100,
        render: (text: string, record: Ticket) => (
          <span
            onClick={(e) => { e.stopPropagation(); handleViewTicket(record); }}
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
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            className="hover:opacity-80 transition-opacity pp-ticket-tag-group"
          >
            {text}
            <CopyOutlined
              style={{ fontSize: 10, opacity: 0.6 }}
              className="hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(text);
                message.success("Ticket ID copied!");
              }}
            />
          </span>
        ),
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        width: 350,
        ellipsis: true,
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
              className="group pp-name-cell"
              style={{ cursor: canUpdateTicket ? 'pointer' : 'default', minHeight: 24, maxWidth: 500, overflow: 'hidden' }}
              onClick={(e) => {
                e.stopPropagation();
                if (canUpdateTicket) setEditingField({ ticketId: record.id, field: "title" });
              }}
              title={text}
            >
              <span className="pp-name-title">{text}</span>
              {canUpdateTicket && (
                <EditOutlined
                  className="opacity-0 group-hover:opacity-40 transition-opacity"
                  style={{ color: 'var(--premium-blue)', fontSize: 12, marginLeft: 6, flexShrink: 0 }}
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
              <SearchableDropdown
                value={status}
                defaultOpen
                loading={isUpdating}
                options={finalStatusOptions}
                searchPlaceholder="Search status…"
                itemNoun="statuses"
                allowClear={false}
                style={{ width: "100%", minWidth: 0, height: 32 }}
                onChange={(value) => {
                  if (value !== undefined) handleUpdateTicket(record.id, "status", value);
                  setEditingField(null);
                }}
                onOpenChange={(open) => { if (!open) setEditingField(null); }}
              />
            );
          }

          const getTicketStatusMeta = (sVal: string) => {
            const k = (sVal || '').toLowerCase();
            if (k === 'completed' || k === 'done') {
              return { label: 'Done', color: '#10b981', bg: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.25)' };
            }
            if (k === 'in_progress' || k === 'active') {
              return { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)' };
            }
            if (k === 'review') {
              return { label: 'Review', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', ring: 'rgba(139,92,246,0.25)' };
            }
            if (k === 'open' || k === 'todo' || k === 'pending') {
              return { label: 'To Do', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', ring: 'rgba(245,158,11,0.25)' };
            }
            return { label: getStatusLabel(sVal, finalStatusOptions), color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)' };
          };

          const meta = getTicketStatusMeta(status);

          return (
            <span
              className="pp-vis-pill"
              style={{
                color: meta.color,
                background: meta.bg,
                borderColor: meta.ring,
                cursor: canUpdateTicket ? "pointer" : "default"
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (canUpdateTicket) setEditingField({ ticketId: record.id, field: "status" });
              }}
            >
              <span className="pp-vis-dot" style={{ background: meta.color }} />
              {meta.label}
              {canUpdateTicket && <CaretDownOutlined style={{ fontSize: 9, opacity: 0.6, marginLeft: 2 }} />}
            </span>
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
              <SearchableDropdown
                value={assigneeId || undefined}
                defaultOpen
                loading={isUpdating}
                placeholder="Select assignee"
                searchPlaceholder="Search by name or role…"
                itemNoun="members"
                showSelectedAvatar={true}
                style={{ width: "100%", minWidth: 0, height: 32 }}
                options={members.map((member) => ({
                  value: member.value,
                  label: member.label,
                  description: member.position,
                  avatarUrl: member.avatarUrl || undefined,
                }))}
                onChange={(value) => {
                  handleUpdateTicket(record.id, "assignee", value ?? null);
                  setEditingField(null);
                }}
                onOpenChange={(open) => { if (!open) setEditingField(null); }}
              />
            );
          }

          const isUnassigned = !assignee || (typeof assignee === "string" ? assignee === "unassigned" : !assignee.id);
          const avatarBgColor = isUnassigned ? "#94a3b8" : avatarColorFor(name);
          const initials = isUnassigned ? "UN" : initialsFor(name);

          return (
            <div
              className="pp-creator"
              style={{ cursor: canUpdateTicket ? 'pointer' : 'default' }}
              onClick={(e) => {
                e.stopPropagation();
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
                size={20}
                style={{ backgroundColor: avatarBgColor, fontSize: 9, fontWeight: 700 }}
                src={typeof assignee === "object" ? assignee?.avatarUrl || undefined : undefined}
              >
                {initials}
              </Avatar>
              <span className="pp-creator-name">{name.split(" ")[0]}</span>
            </div>
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
              <SearchableDropdown
                value={priority}
                defaultOpen
                loading={isUpdating}
                allowClear={false}
                searchPlaceholder="Search priority…"
                itemNoun="priorities"
                style={{ width: "100%", minWidth: 0, height: 32 }}
                options={dbPriorityOptions.length > 0 ? dbPriorityOptions : [
                  { label: "High (P1)", value: "P1" },
                  { label: "Medium (P2)", value: "P2" },
                  { label: "Low (P3)", value: "P3" },
                ]}
                onChange={(value) => {
                  if (value !== undefined) handleUpdateTicket(record.id, "priority", value);
                  setEditingField(null);
                }}
                onOpenChange={(open) => { if (!open) setEditingField(null); }}
              />
            );
          }

          return (
            <Tag
              className={`saas-tag ${getPriorityColorClass(priority)}`}
              style={{ cursor: canUpdateTicket ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={(e) => {
                e.stopPropagation();
                if (canUpdateTicket) setEditingField({ ticketId: record.id, field: "priority" });
              }}
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
              <SearchableDropdown
                value={type}
                defaultOpen
                loading={isUpdating}
                allowClear={false}
                searchPlaceholder="Search type…"
                itemNoun="types"
                style={{ width: "100%", minWidth: 0, height: 32 }}
                options={finalTypeOptions.length > 0 ? finalTypeOptions : [
                  { label: "Bug", value: "Bug" },
                  { label: "Task", value: "Task" },
                  { label: "Feature", value: "Feat" },
                  { label: "Overwrite", value: "Overwrite" },
                ]}
                onChange={(value) => {
                  if (value !== undefined) handleUpdateTicket(record.id, "type", value);
                  setEditingField(null);
                }}
                onOpenChange={(open) => { if (!open) setEditingField(null); }}
              />
            );
          }

          if (!type) {
            return (
              <Text
                type="secondary"
                style={{ cursor: canUpdateTicket ? 'pointer' : 'default', fontSize: 13 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canUpdateTicket) setEditingField({ ticketId: record.id, field: "type" });
                }}
              >
                -
              </Text>
            );
          }
          return (
            <Tag
              className={`saas-tag ${getTypeColorClass(type)}`}
              style={{ cursor: canUpdateTicket ? 'pointer' : 'default' }}
              onClick={(e) => {
                e.stopPropagation();
                if (canUpdateTicket) setEditingField({ ticketId: record.id, field: "type" });
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setEditingField({ ticketId: record.id, field: "storyPoint" });
              }}
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
            return <Text type="secondary" style={{ fontSize: 12 }}>{typeof reportTo === 'string' ? reportTo.split(" ")[0] : '-'}</Text>;
          }
          return (
            <Space size={6}>
              <Avatar size="small" style={{ backgroundColor: avatarColorFor(reportTo.name) }} src={reportTo.avatarUrl || undefined}>
                {!reportTo.avatarUrl && initialsFor(reportTo.name)}
              </Avatar>
              <Text style={{ fontSize: 12.5, fontWeight: 500 }}>{reportTo.name.split(" ")[0]}</Text>
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
              <Avatar size="small" style={{ backgroundColor: avatarColorFor(createdBy.name) }} src={createdBy.avatarUrl || undefined}>
                {!createdBy.avatarUrl && initialsFor(createdBy.name)}
              </Avatar>
              <Text style={{ fontSize: 12.5, fontWeight: 500 }}>{createdBy.name.split(" ")[0]}</Text>
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
                <ConfirmDialog
                  tone="primary"
                  title="Add to Sprint"
                  description="Are you sure you want to add this ticket to the active sprint?"
                  confirmText="Add to Sprint"
                  onConfirm={() => handleSprintAssignment(record.id, 'add')}
                  placement="topRight"
                >
                  <Button
                    type="text"
                    size="small"
                    aria-label="Add to Sprint"
                    icon={<PlusCircleOutlined style={{ color: '#52c41a' }} />}
                    onClick={(e) => e.stopPropagation()}
                    className="saas-button-item"
                  />
                </ConfirmDialog>
              )}
              {context === 'active' && canUpdateTicket && (
                <ConfirmDialog
                  tone="danger"
                  title="Remove from Sprint"
                  description="Are you sure you want to remove this ticket from the active sprint?"
                  confirmText="Remove"
                  onConfirm={() => handleSprintAssignment(record.id, 'remove')}
                  placement="topRight"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    aria-label="Remove from Sprint"
                    icon={<MinusCircleOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    className="saas-button-item"
                  />
                </ConfirmDialog>
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
                overlayClassName="tl-action-pop"
                menu={{
                  items: [
                    {
                      key: 'share',
                      label: (
                        <div className="tl-menu-item">
                          <span className="tl-menu-ic" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}>
                            <ShareAltOutlined />
                          </span>
                          <span className="tl-menu-text">
                            <span className="tl-menu-title">Copy Public Link</span>
                            <span className="tl-menu-desc">Share with anyone</span>
                          </span>
                        </div>
                      ),
                      onClick: handleShare
                    },
                    canDeleteTicket && {
                      key: 'delete',
                      danger: true,
                      label: (
                        <ConfirmDialog
                          tone="danger"
                          icon={<DeleteOutlined />}
                          title="Delete Ticket"
                          description={
                            <div style={{ marginTop: 8 }}>
                              <Text style={{ color: 'var(--text-slate-900)' }}>
                                Are you sure you want to move <b>{record.ticketNumber}</b> to trash?
                              </Text>
                              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                                You can restore it for up to 7 days from the Trash Repository.
                              </Text>
                            </div>
                          }
                          confirmText="Delete"
                          cancelText="Cancel"
                          placement="left"
                          onConfirm={() => handleDeleteTicket(record.id)}
                        >
                          <div
                            className="tl-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <span className="tl-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}>
                              <DeleteOutlined />
                            </span>
                            <span className="tl-menu-text">
                              <span className="tl-menu-title">Delete Ticket</span>
                              <span className="tl-menu-desc">Move to trash</span>
                            </span>
                          </div>
                        </ConfirmDialog>
                      )
                    }
                  ].filter(Boolean) as any
                }}
                trigger={['click']}
                placement="bottomRight"
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
  const renderActiveSprintHeader = (
    variant: 'list' | 'compact' = 'compact',
    sticky: boolean = true,
  ) => {
    if (!activeSprint) return null;
    const showBulkActions = variant === 'list' && activeSelectedRowKeys.length > 0;

    const completedCount = overallSprintTickets.filter((t) => ['completed'].includes(t.status?.toLowerCase() || '')).length;
    const totalSprintTickets = overallSprintTickets.length;
    const remainingCount = Math.max(0, totalSprintTickets - completedCount);
    const progressPct = totalSprintTickets > 0 ? Math.round((completedCount / totalSprintTickets) * 100) : 0;
    const start = activeSprint.startDate ? dayjs(activeSprint.startDate) : null;
    const end = activeSprint.endDate ? dayjs(activeSprint.endDate) : null;
    const now = dayjs();
    const isDelayed = !!end && now.isAfter(end, 'day');
    const isToday = !!end && now.isSame(end, 'day');
    const daysFromEnd = end ? Math.abs(now.diff(end, 'day')) : 0;
    const accent = isDelayed ? '#ef4444' : isToday ? '#f59e0b' : '#10b981';

    return (
      <div
        ref={setSprintHeadEl}
        className={`tl-section-head tl-sprint-head-v2${statsCollapsed ? ' is-stats-collapsed' : ''}${sticky ? '' : ' tl-section-head--static'}`}
      >
        {/* Row 1: dot + title + status tags + action buttons */}
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{ background: accent, boxShadow: `0 0 0 3px ${accent}33` }}
            />
            <Text
              className="tl-sprint-title"
              ellipsis={{ tooltip: `${projectName} — ${activeSprint?.version || 'Active Sprint'}` }}
            >
              {projectName} — {activeSprint?.version || 'Active Sprint'}
            </Text>
            {end && (
              <span className="tl-sprint-tags">
                {isDelayed && (
                  <span className="tl-sprint-tag tl-sprint-tag-delayed">{daysFromEnd}D DELAYED</span>
                )}
                {isToday && (
                  <span className="tl-sprint-tag tl-sprint-tag-today">ENDS TODAY</span>
                )}
                {!isDelayed && !isToday && (
                  <span className="tl-sprint-tag tl-sprint-tag-active">{daysFromEnd}D LEFT</span>
                )}
                {isDelayed && (
                  <span className="tl-sprint-tag tl-sprint-tag-overdue">OVERDUE</span>
                )}
              </span>
            )}
          </div>
          <div className="tl-sprint-actions">
            {activeSprint?.id && (
              <Button
                type="default"
                size="small"
                icon={<LineChartOutlined />}
                onClick={() => router.push(`/tickets/reports/${activeSprint.id}`)}
                className="saas-button-item tl-sprint-burndown-btn"
              >
                Burndown
              </Button>
            )}
            {canUpdateTicketPlan && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={handleCompleteSprint}
                className="saas-button-item tl-sprint-complete-btn"
              >
                Complete Sprint
              </Button>
            )}
          </div>


        </div>

        {/* Row 2: date range + ticket counts */}
        <div className="tl-sprint-row2">
          {start && end && (
            <span className="tl-sprint-meta">
              <CalendarOutlined style={{ fontSize: 11 }} />
              <span>{start.format('MMM D')}</span>
              <span className="tl-sprint-meta-arrow">→</span>
              <span>{end.format('MMM D')}</span>
            </span>
          )}
          <span className="tl-sprint-meta">
            <b>{completedCount}</b>/{totalSprintTickets} tickets completed
          </span>
          <span className="tl-sprint-meta">
            <b>{remainingCount}</b> remaining
          </span>
        </div>

        {/* Row 3: wide ticket-completion progress bar + % */}
        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{progressPct}%</span>
        </div>
      </div>
    );
  };

  const renderCustomPagination = (
    current: number,
    pageSize: number,
    total: number,
    selectedCount: number,
    onPageChange: (page: number) => void,
    onPageSizeChange: (size: number) => void
  ) => {
    if (total === 0) return null;
    const pageStart = (current - 1) * pageSize + 1;
    const pageEnd = Math.min(current * pageSize, total);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return (
      <div className="pp-footer">
        <div className="pp-footer-info">
          Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          {selectedCount > 0 && <span className="pp-footer-sel"> · {selectedCount} selected</span>}
        </div>
        <div className="pp-pager">
          <button
            type="button"
            className="pp-pager-btn"
            disabled={current <= 1}
            onClick={() => onPageChange(Math.max(1, current - 1))}
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .slice(Math.max(0, current - 3), Math.max(0, current - 3) + 5)
            .map((p) => (
              <button
                key={p}
                type="button"
                className={`pp-pager-num ${p === current ? 'is-active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ))}
          <button
            type="button"
            className="pp-pager-btn"
            disabled={current >= pageCount}
            onClick={() => onPageChange(Math.min(pageCount, current + 1))}
          >
            ›
          </button>
          <Select
            className="pp-pagesize"
            value={pageSize}
            onChange={(v) => onPageSizeChange(v)}
            options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
            popupMatchSelectWidth={120}
            size="small"
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-pure-white)',
      height: 'calc(100vh - 54px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ['--tl-header-h' as any]: `${saasHeaderHeight}px`,
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* ── Proposals-like Table Styling overrides ── */
        .project-switch-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 236px;
          overflow: hidden !important;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .project-switch-pop .ant-dropdown-menu-item { padding: 0 !important; border-radius: 6px !important; margin-bottom: 2px; }
        .project-switch-pop .ant-dropdown-menu-item:last-child { margin-bottom: 0; }
        .project-switch-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }

        /* Dark Theme Action Popup */
        [data-theme='dark'] .project-switch-pop .ant-dropdown-menu {
          background: #0B0F1A !important;
          border-radius: 0 !important;
          overflow: hidden !important;
          border: 1px solid #1E293B !important;
        }
        [data-theme='dark'] .project-switch-pop .ant-dropdown-menu-item:hover {
          background: #111720 !important;
        }


        .pp-table-wrap {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-left: none;
          border-right: none;
          border-radius: 0;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          margin: 0;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pp-table-wrap::-webkit-scrollbar,
        .pp-table-wrap .ant-table-body::-webkit-scrollbar,
        .pp-table-wrap .ant-table-content::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .pp-table-wrap .ant-table-body,
        .pp-table-wrap .ant-table-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        [data-theme='dark'] .pp-table-wrap {
          background: #0f1419;
          border-color: #1f2937;
        }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 10px !important;
          white-space: nowrap !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
        }
        [data-theme='dark'] .pp-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .pp-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 8px 10px !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
        }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: #1e293b !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
        .pp-table .ant-table-selection-column { padding-inline: 6px !important; }

        /* Hide Ant Design default pagination */
        .pp-table .ant-table-pagination {
          display: none !important;
        }

        /* Footer + pager styling matching proposals */
        .pp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-sizing: border-box;
          flex-shrink: 0;
          box-shadow: 0 -4px 14px rgba(15,23,42,0.04);
          margin: 0;
        }
        [data-theme='dark'] .pp-footer {
          background: #0f1419;
          border-top-color: #1f2937;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        [data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }
        .pp-footer-sel { color: #3B82F6; font-weight: 600; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        [data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num {
          background: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        [data-theme='dark'] .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Name cell */
        .pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; overflow: hidden; }
        .pp-name-icon {
          width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
          background: var(--bg-blue-50);
        }
        [data-theme='dark'] .pp-name-icon {
          background: rgba(59,130,246,0.15);
        }
        .pp-name-icon .anticon { font-size: 12px !important; }
        .pp-name-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        [data-theme='dark'] .pp-name-title { color: #f1f5f9; }

        /* Status pill styling */
        .pp-vis-pill {
          display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* Creator/Assignee styling */
        .pp-creator { display: flex; align-items: center; gap: 6px; }
        .pp-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; font-weight: 500; }
        [data-theme='dark'] .pp-creator-name { color: #cbd5e1; }

        /* Premium tag adjustments */
        .saas-table .saas-tag {
          display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .saas-table .saas-tag-red { color: #ef4444; background: rgba(239,68,68,0.10); border-color: rgba(239,68,68,0.25); }
        .saas-table .saas-tag-orange { color: #f59e0b; background: rgba(245,158,11,0.10); border-color: rgba(245,158,11,0.25); }
        .saas-table .saas-tag-blue { color: #3b82f6; background: rgba(59,130,246,0.10); border-color: rgba(59,130,246,0.25); }
        .saas-table .saas-tag-green { color: #10b981; background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.25); }
        .saas-table .saas-tag-purple { color: #8b5cf6; background: rgba(139,92,246,0.10); border-color: rgba(139,92,246,0.25); }
        .saas-table .saas-tag-cyan { color: #06b6d4; background: rgba(6,182,212,0.10); border-color: rgba(6,182,212,0.25); }
        .saas-table .saas-tag-geekblue { color: #6366f1; background: rgba(99,102,241,0.10); border-color: rgba(99,102,241,0.25); }
        .saas-table .saas-tag-default { color: #64748b; background: rgba(100,116,139,0.10); border-color: rgba(100,116,139,0.25); }

        .project-switch-trigger:hover {
          background: var(--bg-slate-50);
          color: var(--premium-blue);
        }

        /* Instant Creation overrides to act like a flush header bar */
        .ict-shell {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px !important;
          margin: 0 !important;
          background: var(--bg-pure-white) !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          animation: none !important;
        }
        [data-theme='dark'] .ict-shell {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
        }

        /* Scoped Table Settings custom dropdown overlays */
        .ts-popover-overlay .ant-popover-inner {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border: 0 !important;
          border-radius: 12px !important;
        }
        .ts-popover-overlay .ant-popover-arrow { display: none !important; }

        .ts-panel {
          width: 250px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
        }
        [data-theme='dark'] .ts-panel {
          background: #0f1419;
          border-color: #2d3748;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3);
        }

        .ts-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .ts-head {
          background: #111720;
          border-bottom-color: #1f2937;
        }
        .ts-head-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme='dark'] .ts-head-title { color: #94a3b8; }

        .ts-reset {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 24px;
          padding: 0 9px;
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 999px;
          font-family: inherit;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .ts-reset:hover {
          color: #3b82f6;
          border-color: rgba(59,130,246,0.4);
          background: rgba(59,130,246,0.06);
          border-style: solid;
        }
        [data-theme='dark'] .ts-reset {
          border-color: #2d3748;
          color: #94a3b8;
        }

        .ts-body {
          padding: 10px 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ts-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 5px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.1s ease;
        }
        .ts-row:hover {
          background: var(--bg-slate-50);
        }
        [data-theme='dark'] .ts-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .ts-row-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-700);
          letter-spacing: -0.005em;
          min-width: 0;
        }
        [data-theme='dark'] .ts-row-label { color: #cbd5e1; }

        .ts-foot {
          padding: 8px 14px;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        [data-theme='dark'] .ts-foot {
          border-top-color: #1f2937;
          background: #111720;
        }
        .ts-foot-hint {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-400);
        }
        [data-theme='dark'] .ts-foot-hint { color: #64748b; }
        
        /* ── Premium project switcher panel ── */
        .proj-switch-panel {
          width: 340px;
          padding: 6px;
          background: var(--bg-pure-white, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 14px;
          box-shadow: 0 16px 44px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06);
          animation: proj-switch-in 0.14s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes proj-switch-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .proj-switch-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px 8px;
          margin-bottom: 4px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }
        .proj-switch-title {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-slate-400, #94a3b8);
        }
        .proj-switch-count {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-500, #64748b);
          background: var(--bg-slate-100, #f1f5f9);
          border-radius: 6px;
          padding: 1px 7px;
          line-height: 1.5;
        }
        .proj-switch-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-height: 360px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .proj-switch-item:not(:last-child) {
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }
        .proj-switch-list::-webkit-scrollbar { width: 6px; }
        .proj-switch-list::-webkit-scrollbar-track { background: transparent; }
        .proj-switch-list::-webkit-scrollbar-thumb { background: var(--border-slate-200, #e2e8f0); border-radius: 3px; }
        .proj-switch-list::-webkit-scrollbar-thumb:hover { background: var(--text-slate-400, #94a3b8); }
        .proj-switch-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 6px 8px;
          border: none;
          background: transparent;
          border-radius: 9px;
          cursor: pointer;
          text-align: left;
          transition: background 0.14s ease;
        }
        .proj-switch-item:hover { background: var(--bg-slate-50, #f8fafc); }
        .proj-switch-item.is-active { background: var(--bg-blue-50, #eff6ff); }
        .proj-switch-badge {
          flex-shrink: 0;
          min-width: 30px;
          max-width: 72px;
          height: 24px;
          padding: 0 7px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .proj-switch-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .proj-switch-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-900, #0f172a);
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .proj-switch-code {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-slate-400, #94a3b8);
          line-height: 1.25;
        }
        .proj-switch-check {
          flex-shrink: 0;
          color: var(--premium-blue, #2563eb);
          font-size: 13px;
        }

        /* Remove default shadow from fixed columns (e.g. Actions) */
        .ant-table-cell-fix-left-first::after, .ant-table-cell-fix-left-last::after,
        .ant-table-cell-fix-right-first::after, .ant-table-cell-fix-right-last::after {
          box-shadow: none !important;
        }.tickets-table-shell[data-density='compact'] .ant-table-tbody > tr > td { padding: 4px 10px !important; }
        .tickets-table-shell[data-density='comfortable'] .ant-table-tbody > tr > td { padding: 7px 14px !important; }
        .tickets-table-shell[data-density='spacious'] .ant-table-tbody > tr > td { padding: 11px 18px !important; }
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
        /* Left bleed (-24px) tucks the sidebar bg under the global SideNav
           so the seam disappears. When the sidebar is hidden the bleed is
           removed so the main column doesn't slide under the SideNav.
           Animate margin-left for a smooth shift. */
        .tl-shell-wrap {
          margin: 0;
          transition: margin-left 0.28s cubic-bezier(0.25, 1, 0.5, 1);
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        .tl-shell-wrap.is-sidebar-closed { margin-left: 0; }
        .tl-shell {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          height: 100%;
          overflow: hidden;
          transition: grid-template-columns 0.28s cubic-bezier(0.25, 1, 0.5, 1);
        }
        /* Sidebar collapse animation — width via grid-template-columns,
           contents fade + clip so they don't bleed during the transition. */
        .tl-shell > aside.tl-sidebar {
          transition: opacity 0.22s ease, padding 0.28s cubic-bezier(0.25, 1, 0.5, 1);
          overflow-y: auto;
          overflow-x: hidden;
          height: 100%;
        }
        .tl-main {
          min-width: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
          height: 100%;
          overflow: hidden;
        }
        /* ── Sidebar show/hide toggle (always visible in top header) ── */
        .tl-sidebar-show-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          color: var(--text-slate-600, #475569);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-sidebar-show-toggle:hover {
          background: var(--bg-slate-100, #f1f5f9);
          border-color: var(--text-slate-400, #94a3b8);
          color: var(--text-slate-900, #0f172a);
        }
        .tl-sidebar-show-toggle[aria-pressed='true'] {
          background: rgba(59, 130, 246, 0.10);
          border-color: rgba(59, 130, 246, 0.32);
          color: var(--premium-blue, #3b82f6);
        }
        [data-theme='dark'] .tl-sidebar-show-toggle {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        [data-theme='dark'] .tl-sidebar-show-toggle:hover {
          background: #1c232e;
          border-color: #475569;
          color: #f1f5f9;
        }
        [data-theme='dark'] .tl-sidebar-show-toggle[aria-pressed='true'] {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(59, 130, 246, 0.38);
          color: #93c5fd;
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

        .saas-header-container {
          margin: 0 -24px 0 -24px;
          padding: 9.7px 16px;
          gap: 10px;
        }


        /* ── Desktop ≥1100px ────────────────────────────────── */
        @media (min-width: 1100px) {
          .tl-sidebar-toggle-btn { display: none !important; }
          .tl-shell-wrap.is-sidebar-closed .tl-shell {
            /* Animate the first track from 220px → 0 instead of removing
               the column entirely; keeps grid-template-columns smoothly
               interpolatable so the main column slides in. */
            grid-template-columns: 0px minmax(0, 1fr);
          }
          .tl-shell-wrap.is-sidebar-closed > .tl-shell > aside.tl-sidebar {
            opacity: 0;
            padding-left: 0;
            padding-right: 0;
            pointer-events: none;
            border-right-color: transparent;
          }
        }

        /* ── Tablet / Mobile <1100px ──────────────────────────
           Vertical stack: sidebar moves ABOVE the main content as a
           horizontal pill bar (rather than overlapping it as a drawer).
           Items scroll horizontally; show/hide collapses the bar to 0
           height, animated via max-height. */
        @media (max-width: 1099.98px) {
          .saas-header-container {
            margin: 0;
            padding: 9.7px 12px;
          }
          /* Hide the legacy hamburger button — the header toggle handles
             open/close uniformly across viewports now. */
          .tl-sidebar-toggle-btn { display: none !important; }
          .tl-shell {
            display: flex;
            flex-direction: column;
            grid-template-columns: none;
            min-height: auto;
            transition: none;
          }
          .tl-shell > aside.tl-sidebar {
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
          }
          [data-theme='dark'] .tl-shell > aside.tl-sidebar {
            background: #0B0F1A;
            border-right-color: #1f2937;
          }
          .tl-shell-wrap.is-sidebar-open > .tl-shell > aside.tl-sidebar {
            transform: translateX(0);
          }
          .tl-shell-wrap.is-sidebar-closed > .tl-shell > aside.tl-sidebar {
            transform: translateX(-100%);
          }
          /* Main column reclaims full width below the sidebar bar. */
          .tl-main { padding-left: 0; padding-right: 8px; }
          .tl-action-controls {
            order: 3;
            flex: 1 1 100% !important;
            margin-top: 8px;
            flex-wrap: nowrap;
          }
          .tl-action-controls > .saas-input {
            max-width: none !important;
            flex: 1;
            min-width: 120px;
          }
          .tl-right-actions {
            order: 2;
            margin-left: auto;
          }
        }

        /* ── Tablet Portrait <769px ──────────────────────────── */
        @media (max-width: 768.98px) {
          .tl-action-controls {
            flex-wrap: wrap;
          }
          .tl-action-controls > .saas-input {
            flex: 1 1 100%;
          }
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
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        [data-theme='dark'] .tl-section {
          background: transparent;
          border-top-color: #1f2937;
          border-bottom-color: #1f2937;
        }
        .tl-section-head {
          padding: 6px 12px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          position: relative;
        }
        .tl-section-head.tl-section-head--static {
          position: relative;
        }
        .saas-card-sticky > .ant-card-head {
          top: var(--tl-header-h, 56px) !important;
        }
        [data-theme='dark'] .tl-section-head {
          background: #0f1419;
          border-bottom-color: #1f2937;
        }
        .tl-section-body {
          padding: 0;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ── Sprint head v2: vertical 3-row layout ──────────── */
        .tl-sprint-head-v2 {
          display: flex !important;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px !important;
        }
        .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tl-sprint-title {
          font-size: 14px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.01em;
          max-width: 460px;
        }
        [data-theme='dark'] .tl-sprint-title { color: #f1f5f9 !important; }
        .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tl-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 4px;
          border: 1px solid transparent;
          text-transform: uppercase;
          line-height: 1;
        }
        .tl-sprint-tag-delayed {
          background: transparent;
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.32);
        }
        .tl-sprint-tag-overdue {
          background: transparent;
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.32);
        }
        .tl-sprint-tag-today {
          background: transparent;
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.32);
        }
        .tl-sprint-tag-active {
          background: transparent;
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.32);
        }
        [data-theme='dark'] .tl-sprint-tag-delayed {
          background: transparent;
          color: #fca5a5;
        }
        .tl-sprint-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .tl-sprint-burndown-btn.ant-btn {
          height: 28px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
        }
        .tl-sprint-complete-btn.ant-btn.ant-btn-primary {
          height: 28px;
          font-size: 12px;
          font-weight: 700;
          background: #10b981;
          border-color: #10b981;
          border-radius: 6px;
        }
        .tl-sprint-complete-btn.ant-btn.ant-btn-primary:hover {
          background: #059669 !important;
          border-color: #059669 !important;
        }

        /* Sprint actions bar dropdown items */
        .tl-action-item:hover {
          background: #f8fafc !important;
        }
        [data-theme='dark'] .tl-action-item:hover {
          background: #1e293b !important;
        }

        .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-left: 15px;
        }
        .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          letter-spacing: -0.005em;
        }
        .tl-sprint-meta b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
        [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }
        .tl-sprint-meta-arrow {
          color: var(--text-slate-400);
          font-weight: 600;
        }
        [data-theme='dark'] .tl-sprint-meta-arrow { color: #64748b !important; }

        .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px;
          background: var(--bg-slate-100);
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        [data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
        .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: right;
        }
        [data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        /* Tight table rows — applies on top of size="small" */
        .tl-table .ant-table-thead > tr > th {
          padding: 5px 10px !important;
          font-size: 10px !important;
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
          padding: 4px 10px !important;
          font-size: 11.5px !important;
        }
        .tl-table .ant-table-cell {
          line-height: 1.3 !important;
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
          padding: 6px 12px !important;
          background: var(--bg-pure-white) !important;
          border-top: 1px solid var(--border-slate-200) !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 4px !important;
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
          min-width: 24px !important;
          height: 24px !important;
          line-height: 22px !important;
          font-size: 11px !important;
        }
        .tl-table-sticky-pagination .ant-pagination-options-size-changer .ant-select-selector {
          height: 24px !important;
          font-size: 11px !important;
        }
        .tl-table-sticky-pagination .ant-pagination-total-text {
          margin-right: auto !important;
        }

        /* Ensure ancestor stacking contexts don't clip sticky pagination */
        .tickets-table-shell { overflow: visible !important; }

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
          border-radius: 8px;
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
          border-radius: 8px;
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
          border-radius: 8px;
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

      {/* Inline Filter Row moved into tl-main (renders after the sprint details header) */}



      {/* Tickets View — wrapped in a 2-column shell (sidebar + main) */}
      <div className={`tl-shell-wrap ${isSidebarOpen ? 'is-sidebar-open' : 'is-sidebar-closed'}`}>
        <div className="tl-shell">

          {isMobile ? (
            <Drawer
              className={theme === "dark" ? "hb-dark" : "hb-light"}
              placement="left"
              open={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              styles={{
                body: { padding: 0, background: theme === "dark" ? "#0B0F1A" : "#FFFFFF" },
                header: { display: "none" },
                mask: { background: "rgba(0, 0, 0, 0.45)" },
                content: { background: theme === "dark" ? "#0B0F1A" : "#FFFFFF" }
              }}
              width={260}
              closeIcon={null}
            >
              <TicketSidebar
                activeSprint={activeSprint as any}
                overallSprintTickets={sidebarSprintPool as any}
                totalBacklog={totalBacklogCount}
                myBacklogCount={myBacklogCount}
                currentUserId={user?.id}
                currentUserName={user?.name}
                typeOptions={finalTypeOptions as any}
                recentComments={recentActivity?.comments || []}
                recentAttachments={recentActivity?.attachments || []}
                activeSection={effectiveSection}
                isMySprintActive={!!user?.id && effectiveSection === 'sprint' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString()}
                isMyBacklogActive={!!user?.id && effectiveSection === 'backlog' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString()}
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
                  // If the user was in a "My Sprint/Backlog Tickets" view (assignee
                  // pinned to self), clicking the plain Sprint/Backlog row should
                  // drop that filter and show the full section.
                  if (user?.id && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString()) {
                    setFilters(prev => ({ ...prev, assignee: [] }));
                  }
                  setSidebarActiveSection(section);
                  // In Board view, switch the kanban scope to match instead of
                  // dragging the user into List view. Calendar stays as-is.
                  if (viewMode === 'board') {
                    setKanbanScope(section === 'sprint' ? 'active' : 'backlog');
                  } else if (viewMode === 'calendar' && section === 'backlog') {
                    // Calendar has no backlog representation — fall back to List
                    // so the user actually sees the backlog table.
                    setViewMode('list');
                  }
                }}
                onShowMySprintTickets={() => {
                  if (!user?.id) return;
                  const isOn = sidebarActiveSection === 'sprint' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString();
                  const newAssignee = isOn ? [] : [user.id];
                  if (sidebarActiveSection !== 'sprint') {
                    filterSnapshotsRef.current.sprint.assignee = newAssignee;
                  }
                  setFilters(prev => ({
                    ...prev,
                    assignee: newAssignee,
                  }));
                  if (isFilteredView) setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                  setSidebarActiveSection('sprint');
                  if (viewMode === 'board') setKanbanScope('active');
                }}
                onShowMyBacklog={() => {
                  if (!user?.id) return;
                  const isOn = sidebarActiveSection === 'backlog' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString();
                  const newAssignee = isOn ? [] : [user.id];
                  if (sidebarActiveSection !== 'backlog') {
                    filterSnapshotsRef.current.backlog.assignee = newAssignee;
                  }
                  setFilters(prev => ({
                    ...prev,
                    assignee: newAssignee,
                  }));
                  if (isFilteredView) setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                  setSidebarActiveSection('backlog');
                  if (viewMode === 'board') setKanbanScope('backlog');
                  else if (viewMode === 'calendar') setViewMode('list');
                }}
                onTicketClick={(id) => setSelectedTicketId(id)}
              />
            </Drawer>
          ) : (
            <TicketSidebar
              activeSprint={activeSprint as any}
              overallSprintTickets={sidebarSprintPool as any}
              totalBacklog={totalBacklogCount}
              myBacklogCount={myBacklogCount}
              currentUserId={user?.id}
              currentUserName={user?.name}
              typeOptions={finalTypeOptions as any}
              recentComments={recentActivity?.comments || []}
              recentAttachments={recentActivity?.attachments || []}
              activeSection={effectiveSection}
              isMySprintActive={!!user?.id && effectiveSection === 'sprint' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString()}
              isMyBacklogActive={!!user?.id && effectiveSection === 'backlog' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString()}
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
                // If the user was in a "My Sprint/Backlog Tickets" view (assignee
                // pinned to self), clicking the plain Sprint/Backlog row should
                // drop that filter and show the full section.
                if (user?.id && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString()) {
                  setFilters(prev => ({ ...prev, assignee: [] }));
                }
                setSidebarActiveSection(section);
                // In Board view, switch the kanban scope to match instead of
                // dragging the user into List view. Calendar stays as-is.
                if (viewMode === 'board') {
                  setKanbanScope(section === 'sprint' ? 'active' : 'backlog');
                } else if (viewMode === 'calendar' && section === 'backlog') {
                  // Calendar has no backlog representation — fall back to List
                  // so the user actually sees the backlog table.
                  setViewMode('list');
                }
              }}
              onShowMySprintTickets={() => {
                if (!user?.id) return;
                const isOn = sidebarActiveSection === 'sprint' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString();
                const newAssignee = isOn ? [] : [user.id];
                if (sidebarActiveSection !== 'sprint') {
                  filterSnapshotsRef.current.sprint.assignee = newAssignee;
                }
                setFilters(prev => ({
                  ...prev,
                  assignee: newAssignee,
                }));
                if (isFilteredView) setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                setSidebarActiveSection('sprint');
                if (viewMode === 'board') setKanbanScope('active');
              }}
              onShowMyBacklog={() => {
                if (!user?.id) return;
                const isOn = sidebarActiveSection === 'backlog' && filters.assignee.length === 1 && filters.assignee[0]?.toString() === user.id.toString();
                const newAssignee = isOn ? [] : [user.id];
                if (sidebarActiveSection !== 'backlog') {
                  filterSnapshotsRef.current.backlog.assignee = newAssignee;
                }
                setFilters(prev => ({
                  ...prev,
                  assignee: newAssignee,
                }));
                if (isFilteredView) setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                setSidebarActiveSection('backlog');
                if (viewMode === 'board') setKanbanScope('backlog');
                else if (viewMode === 'calendar') setViewMode('list');
              }}
              onTicketClick={(id) => setSelectedTicketId(id)}
            />
          )}
          <div className="tl-main">
            {/* Premium Header Row - Sticky Solid Background */}
            <div ref={saasHeaderRef} className="saas-header-container" style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              margin: '0',
              padding: '9.7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              background: 'var(--bg-pure-white)',
              borderBottom: '1px solid var(--border-slate-200)'
            }}>
              {/* Mobile Sidebar toggle (only visible on narrow screens via CSS) */}
              <button
                type="button"
                className="tl-sidebar-toggle-btn"
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                <BarsOutlined style={{ fontSize: 14 }} />
              </button>

              {/* Desktop Sidebar show/hide toggle */}
              <Tooltip title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} placement="bottom">
                <button
                  type="button"
                  className="tl-sidebar-show-toggle"
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

              <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

              {/* Project Switcher */}
              <Dropdown
                menu={{
                  items: (projects || []).map(p => ({
                    key: p.value,
                    label: (
                      <div className="pp-menu-item" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 9px' }}>
                        <span className="pp-menu-ic" style={{
                          width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                          color: p.value === projectId ? '#fff' : 'var(--text-slate-500)',
                          background: p.value === projectId ? 'var(--premium-gradient)' : 'var(--bg-slate-100)',
                          fontWeight: 800,
                          boxShadow: p.value === projectId ? 'var(--premium-shadow)' : 'none',
                        }}>
                          {(p.code || p.label || "?").slice(0, 3).toUpperCase()}
                        </span>
                        <span className="pp-menu-text" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span className="pp-menu-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>{p.label}</span>
                          <span className="pp-menu-desc" style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 1 }}>#{p.code}</span>
                        </span>
                        {p.value === projectId && <CheckCircleOutlined style={{ color: '#10b981', fontSize: 12, marginLeft: 'auto' }} />}
                      </div>
                    ),
                    onClick: () => router.push(`/projects/${p.value}/tickets`)
                  })),
                }}
                overlayClassName="project-switch-pop"
                trigger={['click']}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '2px 6px', borderRadius: 8 }} className="project-switch-trigger transition-colors">
                  <div style={{
                    padding: '0 6px',
                    height: 26,
                    borderRadius: 6,
                    background: 'var(--premium-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                    boxShadow: 'var(--premium-shadow-lg)',
                    minWidth: 30
                  }}>
                    {projectCode?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>{projectName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-slate-500)', fontWeight: 600 }}>Switch Project <CaretRightOutlined style={{ fontSize: 7 }} /></div>
                  </div>
                </div>
              </Dropdown>

              {/* Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Input
                  placeholder="Quick search tickets..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                  className="saas-input"
                  style={{ maxWidth: 240, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
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
                      style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                    >
                      Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                  </Popover>
                  <Button
                    icon={<ExpandAltOutlined />}
                    style={{ height: 30 }}
                    aria-label="Expand filters"
                    onClick={() => setIsFilterRowOpen(prev => !prev)}
                  />
                </Space.Compact>

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

                {viewMode === 'list' && (
                  <Popover
                    trigger={['click']}
                    placement="bottomRight"
                    overlayClassName="ts-popover-overlay"
                    styles={{ body: { padding: 0 } }}
                    content={
                      <div className="ts-panel">
                        {/* Head */}
                        <div className="ts-head">
                          <div className="ts-head-title">
                            <SettingOutlined style={{ fontSize: 12 }} />
                            <span>Table Settings</span>
                          </div>
                          <button
                            type="button"
                            className="ts-reset"
                            onClick={() => {
                              setHiddenCols({ ...TICKETS_DEFAULT_HIDDEN_COLS });
                              setTableDensity('comfortable');
                            }}
                          >
                            <ReloadOutlined style={{ fontSize: 10 }} />
                            Reset
                          </button>
                        </div>

                        {/* Body */}
                        <div className="ts-body">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: 'var(--text-slate-400)',
                              marginBottom: 4,
                            }}
                          >
                            <span>Visible Columns</span>
                          </div>
                          <div
                            className="tickets-cols-scroll"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                              maxHeight: 220,
                              overflowY: 'auto',
                              paddingRight: 2,
                            }}
                          >
                            {toggleableColumns.map((c) => (
                              <label
                                key={c.key}
                                className="ts-row"
                              >
                                <span className="ts-row-label">{c.label}</span>
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
                        </div>

                        {/* Foot */}
                        <div className="ts-foot">
                          <span className="ts-foot-hint">Saved automatically</span>
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

                <Segmented
                  value={viewMode}
                  onChange={(v) => setViewMode(v as 'list' | 'board' | 'calendar')}
                  options={[
                    {
                      value: 'list',
                      label: (
                        <Tooltip title="List View" mouseEnterDelay={0.5}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%', verticalAlign: 'middle' }}>
                            <UnorderedListOutlined style={{ fontSize: 13 }} />
                          </span>
                        </Tooltip>
                      )
                    },
                    {
                      value: 'board',
                      label: (
                        <Tooltip title="Board View" mouseEnterDelay={0.5}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%', verticalAlign: 'middle' }}>
                            <AppstoreOutlined style={{ fontSize: 13 }} />
                          </span>
                        </Tooltip>
                      )
                    },
                    {
                      value: 'calendar',
                      label: (
                        <Tooltip title="Calendar View" mouseEnterDelay={0.5}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%', verticalAlign: 'middle' }}>
                            <CalendarOutlined style={{ fontSize: 13 }} />
                          </span>
                        </Tooltip>
                      )
                    },
                  ]}
                  className="saas-segmented-premium"
                />

                <Tooltip title="Refresh view">
                  <Button
                    icon={<ReloadOutlined spin={isRefreshing} />}
                    onClick={async () => {
                      setIsRefreshing(true);
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
                
                {(linearConnected || jiraConnected) && (
                  <Dropdown
                    menu={{
                      items: [
                        ...(linearConnected ? [{
                          key: 'linear',
                          label: 'Import from Linear',
                          icon: <span style={{ fontSize: 13 }}>◆</span>,
                          onClick: () => setLinearWizardVisible(true)
                        }] : []),
                        ...(jiraConnected ? [{
                          key: 'jira',
                          label: 'Import from Jira',
                          icon: <span style={{ fontSize: 13 }}>⬡</span>,
                          onClick: () => setJiraWizardVisible(true)
                        }] : []),
                      ],
                      style: { padding: 4, borderRadius: 10, border: '1px solid var(--border-color)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }
                    }}
                    trigger={['hover', 'click']}
                    placement="bottomRight"
                  >
                    <Tooltip title="Import tickets">
                      <Button
                        icon={<CloudSyncOutlined />}
                        style={{
                          width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-elevated)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      />
                    </Tooltip>
                  </Dropdown>
                )}
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
                    options={[
                      {
                        label: "Unassigned",
                        value: "unassigned",
                        description: "No assignee",
                      },
                      ...members.map((m) => ({
                        label: m.label,
                        value: m.value,
                        description: m.position || undefined,
                        avatarUrl: m.avatarUrl || undefined,
                      })),
                    ]}
                    onChange={(val) => handleFilterChange('assignee', val)}
                    itemNoun="members"
                    width={290}
                    showAvatar={true}
                  />
                  <TicketFilterPill
                    icon={<EditOutlined style={{ fontSize: 11 }} />}
                    label="Created By"
                    values={filters.createdBy}
                    options={members.map((m) => ({
                      label: m.label,
                      value: m.value,
                      description: m.position || undefined,
                      avatarUrl: m.avatarUrl || undefined,
                    }))}
                    onChange={(val) => handleFilterChange('createdBy', val)}
                    itemNoun="members"
                    width={290}
                    showAvatar={true}
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

            {/* Legacy ticketIds chip replaced by the dedicated Filtered View section
          driven by activeQuickFilters. Kept here only as a marker. */}
            {(isRefreshing || (viewMode === 'list' ? (activeSprintLoading || backlogLoading) : viewMode === 'calendar' ? (allSprintsLoading || calendarTicketsLoading) : isKanbanLoading)) ? (
              <TicketSkeleton viewMode={viewMode === 'calendar' ? 'list' : viewMode} />
            ) : viewMode === 'calendar' ? (
              <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {activeSprint && !isFilteredView && renderActiveSprintHeader('compact', false)}
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
                                                  {t.assignee.name.split(" ")[0]}
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

                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Active Sprint Section (only when Sprint selected in left nav) */}
                {activeSprint && !isFilteredView && sidebarActiveSection === 'sprint' && (
                  <div id="active-section" style={{ scrollMarginTop: `calc(var(--tl-header-h, 56px) + 4px)` }} className="tl-section">
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
                      {/* ── Sprint Actions Bar — visible when rows are selected ── */}
                      {activeSelectedRowKeys.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: 'var(--bg-pure-white)',
                          borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#94a3b8' : '#475569', minWidth: 80 }}>
                            {activeSelectedRowKeys.length} selected
                          </span>

                          {/* Assignee / Reassign */}
                          {canAssignTicket && (
                            <Dropdown
                              open={assigneeDropdownOpen}
                              onOpenChange={setAssigneeDropdownOpen}
                              trigger={['click']}
                              menu={{ items: [] }}
                              dropdownRender={() => (
                                <div style={{
                                  background: theme === 'dark' ? '#1e293b' : '#fff',
                                  borderRadius: 10,
                                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                  boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.10)',
                                  padding: '6px 4px',
                                  minWidth: 200,
                                  maxHeight: 280,
                                  overflowY: 'auto',
                                }}>
                                  <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Assign to</div>
                                  {members.map(m => (
                                    <div
                                      key={m.value}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                                      className="tl-action-item"
                                      onClick={() => {
                                        activeSelectedRowKeys.forEach(ticketId => {
                                          updateTicketMutation.mutate({ id: ticketId as string, data: { assignee: m.value }, optimisticData: {} });
                                        });
                                        setAssigneeDropdownOpen(false);
                                        message.success(`Assigned ${activeSelectedRowKeys.length} ticket(s) to ${m.label}`);
                                      }}
                                    >
                                      <Avatar src={(m as any).avatarUrl} size={24} style={{ background: '#3b82f6', fontSize: 10 }}>{m.label?.[0]?.toUpperCase()}</Avatar>
                                      <span style={{ fontWeight: 500, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{m.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            >
                              <Button
                                size="small"
                                icon={<UserOutlined style={{ fontSize: 11 }} />}
                                style={{
                                  height: 28,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  borderColor: theme === 'dark' ? '#1e3a8a' : '#bfdbfe',
                                  color: theme === 'dark' ? '#94a3b8' : '#475569',
                                  background: 'transparent'
                                }}
                              >
                                {activeSelectedRowKeys.length === 1 &&
                                  activeTickets.find((t: any) => t.id === activeSelectedRowKeys[0])?.assignee
                                  ? 'Reassign' : 'Assignee'}
                              </Button>
                            </Dropdown>
                          )}

                          {/* Move to Archive */}
                          {canManageTickets && (
                            <Button
                              size="small"
                              icon={<FolderAddOutlined style={{ fontSize: 11 }} />}
                              loading={bulkArchiveMutation.isPending}
                              style={{
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                borderColor: theme === 'dark' ? '#064e3b' : '#bbf7d0',
                                color: theme === 'dark' ? '#34d399' : '#15803d',
                                background: 'transparent'
                              }}
                              onClick={() => bulkArchiveMutation.mutate(activeSelectedRowKeys as string[])}
                            >
                              Move to Archive
                            </Button>
                          )}

                          {/* Move to Bucket */}
                          <Dropdown
                            open={bucketDropdownOpen}
                            onOpenChange={(open) => {
                              setBucketDropdownOpen(open);
                              if (open && buckets.length === 0 && !bucketsLoading) {
                                setBucketsLoading(true);
                                import('@/services/bucketService').then(mod => {
                                  mod.default.getBuckets(projectId).then(data => {
                                    setBuckets(data);
                                  }).catch(() => { }).finally(() => setBucketsLoading(false));
                                });
                              }
                            }}
                            trigger={['click']}
                            menu={{ items: [] }}
                            dropdownRender={() => (
                              <div style={{
                                background: theme === 'dark' ? '#1e293b' : '#fff',
                                borderRadius: 10,
                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.10)',
                                padding: '6px 4px',
                                minWidth: 220,
                                maxHeight: 320,
                                overflowY: 'auto',
                              }}>
                                <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Move to Bucket</div>
                                {bucketsLoading ? (
                                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>Loading...</div>
                                ) : buckets.length === 0 ? (
                                  <div style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 12 }}>No buckets found</div>
                                ) : (
                                  buckets.map((b: any) => (
                                    <div
                                      key={b.id}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                                      className="tl-action-item"
                                      onClick={() => {
                                        import('@/services/bucketService').then(mod => {
                                          mod.default.assignTicketsToBucket(b.id, activeSelectedRowKeys as string[]).then(() => {
                                            message.success(`Moved ${activeSelectedRowKeys.length} ticket(s) to "${b.name}"`);
                                            setActiveSelectedRowKeys([]);
                                            setBacklogSelectedRowKeys([]);
                                            refetchActive();
                                            refetchBacklog();
                                            queryClient.invalidateQueries({ queryKey: ['tickets'] });
                                            setBucketDropdownOpen(false);
                                          }).catch((e: any) => message.error(e.message || 'Failed to move to bucket'));
                                        });
                                      }}
                                    >
                                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color || '#8b5cf6', flexShrink: 0 }} />
                                      <span style={{ fontWeight: 500, flex: 1, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{b.name}</span>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{b._count?.tickets ?? 0} tickets</span>
                                    </div>
                                  ))
                                )}
                                <div style={{ borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9', margin: '6px 4px 4px', paddingTop: 6 }}>
                                  <div style={{ padding: '4px 8px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Create New Bucket</div>
                                  <div style={{ padding: '4px 8px', display: 'flex', gap: 6 }}>
                                    <input
                                      placeholder="Bucket name..."
                                      value={newBucketName}
                                      onChange={e => setNewBucketName(e.target.value)}
                                      onKeyDown={e => e.stopPropagation()}
                                      style={{
                                        flex: 1,
                                        height: 28,
                                        borderRadius: 6,
                                        border: theme === 'dark' ? '1px solid #475569' : '1px solid #e2e8f0',
                                        padding: '0 8px',
                                        fontSize: 12,
                                        outline: 'none',
                                        background: theme === 'dark' ? '#0f172a' : '#fff',
                                        color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                                      }}
                                    />
                                    <button
                                      disabled={!newBucketName.trim() || creatingBucket}
                                      style={{
                                        height: 28, padding: '0 10px', borderRadius: 6, border: 'none',
                                        background: newBucketName.trim() ? '#8b5cf6' : (theme === 'dark' ? '#334155' : '#e2e8f0'),
                                        color: newBucketName.trim() ? '#fff' : '#94a3b8',
                                        cursor: newBucketName.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: 12, fontWeight: 700,
                                      }}
                                      onClick={() => {
                                        if (!newBucketName.trim()) return;
                                        setCreatingBucket(true);
                                        import('@/services/bucketService').then(mod => {
                                          mod.default.createBucket({ name: newBucketName.trim(), projectId }).then(newB => {
                                            setBuckets(prev => [newB, ...prev]);
                                            return mod.default.assignTicketsToBucket(newB.id, activeSelectedRowKeys as string[]);
                                          }).then(() => {
                                            message.success(`Created bucket "${newBucketName.trim()}" and moved ${activeSelectedRowKeys.length} ticket(s)`);
                                            setActiveSelectedRowKeys([]);
                                            setBacklogSelectedRowKeys([]);
                                            refetchActive();
                                            refetchBacklog();
                                            queryClient.invalidateQueries({ queryKey: ['tickets'] });
                                            setNewBucketName('');
                                            setBucketDropdownOpen(false);
                                          }).catch((e: any) => message.error(e.message || 'Failed')).finally(() => setCreatingBucket(false));
                                        });
                                      }}
                                    >
                                      {creatingBucket ? '...' : 'Create'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          >
                            <Button
                              size="small"
                              icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
                              style={{
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                borderColor: '#8b5cf6',
                                color: '#8b5cf6',
                                background: 'transparent'
                              }}
                            >
                              Move to Bucket
                            </Button>
                          </Dropdown>

                          {/* Move to Sprint */}
                          <Dropdown
                            open={sprintDropdownOpen}
                            onOpenChange={(open) => {
                              setSprintDropdownOpen(open);
                              if (open && allSprints.length === 0 && !sprintsLoading) {
                                setSprintsLoading(true);
                                ReleasePlanService.getReleasePlans({ type: 'sprint_plan', projectId, limit: 100 }).then(res => {
                                  setAllSprints(res.data || []);
                                }).catch(() => { }).finally(() => setSprintsLoading(false));
                              }
                            }}
                            trigger={['click']}
                            menu={{ items: [] }}
                            dropdownRender={() => (
                              <div style={{
                                background: theme === 'dark' ? '#1e293b' : '#fff',
                                borderRadius: 10,
                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.10)',
                                padding: '6px 4px',
                                minWidth: 220,
                                maxHeight: 300,
                                overflowY: 'auto',
                              }}>
                                <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Move to Sprint</div>
                                {sprintsLoading ? (
                                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>Loading sprints...</div>
                                ) : allSprints.length === 0 ? (
                                  <div style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 12 }}>No sprints found</div>
                                ) : (
                                  allSprints.map((s: any) => (
                                    <div
                                      key={s.id}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                                      className="tl-action-item"
                                      onClick={() => {
                                        activeSelectedRowKeys.forEach(ticketId => {
                                          updateTicketMutation.mutate({ id: ticketId as string, data: { releasePlan: s.id }, optimisticData: { releasePlan: s.id } });
                                        });
                                        setActiveSelectedRowKeys([]);
                                        setBacklogSelectedRowKeys([]);
                                        refetchActive();
                                        refetchBacklog();
                                        queryClient.invalidateQueries({ queryKey: ['tickets'] });
                                        message.success(`Moved ${activeSelectedRowKeys.length} ticket(s) to ${s.version || s.name}`);
                                        setSprintDropdownOpen(false);
                                      }}
                                    >
                                      <PlayCircleOutlined style={{ color: s.status === 'active' ? '#10b981' : '#94a3b8', fontSize: 12 }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{s.version || s.name}</div>
                                        {s.status && <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{s.status}</div>}
                                      </div>
                                      {s.status === 'active' && <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', background: '#d1fae5', borderRadius: 4, padding: '2px 5px' }}>ACTIVE</span>}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          >
                            <Button
                              size="small"
                              icon={<PlayCircleOutlined style={{ fontSize: 11 }} />}
                              style={{
                                height: 28,
                                width: 110,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                                background: 'transparent'
                              }}
                            >
                              Move to Sprint
                            </Button>
                          </Dropdown>

                          {/* Delete */}
                          {canDeleteTicket && (
                            <ConfirmDialog
                              tone="danger"
                              title="Move to Trash"
                              description={`Move ${activeSelectedRowKeys.length} selected ticket(s) to trash?`}
                              confirmText="Move to Trash"
                              onConfirm={() => bulkDeleteMutation.mutateAsync(activeSelectedRowKeys as string[])}
                              placement="bottom"
                            >
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                loading={bulkDeleteMutation.isPending}
                                style={{ height: 28, width: 110, fontSize: 11, fontWeight: 700, borderRadius: 6, background: 'transparent' }}
                              >
                                Delete
                              </Button>
                            </ConfirmDialog>
                          )}

                          {/* Clear selection */}
                          <button
                            type="button"
                            onClick={() => setActiveSelectedRowKeys([])}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <CloseOutlined style={{ fontSize: 10 }} /> Clear
                          </button>
                        </div>
                      )}

                      <div className="pp-table-wrap">
                        <Table
                          rowSelection={activeRowSelection}
                          columns={(getColumns('active') || []).filter((c: any) => !hiddenCols[c.key as string])}
                          dataSource={activeTickets}
                          loading={activeSprintFetching}
                          rowKey="id"
                          pagination={false}
                          scroll={{ x: 'max-content' }}
                          tableLayout="fixed"
                          className="saas-table tl-table tl-table-sticky-pagination pp-table"
                          size="small"

                          onRow={(record) => ({
                            onClick: (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger, .premium-input-field, .ant-input-number, .ant-input, .saas-select-minimal, .saas-button-item, a')) return;
                              handleViewTicket(record);
                            },
                            className: 'pp-row',
                          })} locale={{ emptyText: <NoData /> }}
                        />
                      </div>
                      {renderCustomPagination(
                        activePagination.current,
                        activePagination.pageSize,
                        totalActiveTickets,
                        activeSelectedRowKeys.length,
                        (page) => setActivePagination((prev) => ({ ...prev, current: page })),
                        (size) => setActivePagination((prev) => ({ ...prev, current: 1, pageSize: size }))
                      )}
                    </div>
                  </div>
                )}

                {/* Empty State for Sprint Section */}
                {!activeSprint && !isFilteredView && sidebarActiveSection === 'sprint' && (
                  <div className="tl-section" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 460 }}>
                      <div style={{ marginBottom: 24 }}>
                        <div style={{
                          width: 80, height: 80, margin: '0 auto', borderRadius: 40,
                          background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <AppstoreOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', marginBottom: 12, letterSpacing: '-0.02em' }}>
                        No Active Sprint
                      </h2>
                      <p style={{ fontSize: 15, color: 'var(--text-slate-500)', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
                        It looks like this project doesn't have an active sprint right now. Start planning your next cycle of work to get the team moving!
                      </p>
                      {canManageTickets ? (
                        <Button
                          type="primary"
                          size="large"
                          icon={<PlusOutlined />}
                          onClick={() => setCreateSprintModalOpen(true)}
                          style={{ borderRadius: 8, height: 44, fontWeight: 600, padding: '0 24px' }}
                        >
                          Create Sprint
                        </Button>
                      ) : (
                        <p style={{ fontSize: 14, color: 'var(--text-slate-400)', background: 'var(--bg-slate-50)', padding: '12px 16px', borderRadius: 8, display: 'inline-block' }}>
                          Contact a project manager to create a sprint.
                        </p>
                      )}
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
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: '1' }}>
                        <ProjectOutlined style={{ color: 'var(--text-slate-500)', fontSize: 14 }} />
                        <Text style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-slate-900)' }}>Backlog</Text>
                        <Tag bordered={false} style={{
                          margin: 0,
                          height: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 78,
                          background: 'var(--bg-slate-50)',
                          color: 'var(--text-slate-500)',
                          fontWeight: 800,
                          fontSize: 9,
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          border: '1px solid var(--border-color)'
                        }}>
                          {totalBacklog} Tickets
                        </Tag>
                      </div>
                      <Space size={8}>
                        <Input
                          placeholder="Search backlog..."
                          prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 11 }} />}
                          className="saas-input"
                          style={{ width: 180, borderRadius: 6, height: 28, fontSize: 11.5, background: 'transparent' }}
                          value={backlogSearchValue}
                          onChange={(e) => setBacklogSearchValue(e.target.value)}
                          allowClear
                        />
                        <Divider type="vertical" style={{ height: 18, margin: 0 }} />
                        {activeSprint && (
                          <Button
                            type="default"
                            size="small"
                            icon={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
                            onClick={() => setSidebarActiveSection('sprint')}
                            className="saas-button-item"
                            style={{ height: 28, fontWeight: 600, fontSize: 12 }}
                          >
                            Go To Sprint
                          </Button>
                        )}
                        {canCreateTicketPlan && (
                          activeSprint ? (
                            // A sprint is already running — creating another one only
                            // produces a draft, so confirm the intent first.
                            <ConfirmDialog
                              tone="warning"
                              title="Sprint Already Running"
                              description={`${activeSprint.version || activeSprint.name || 'A sprint'} is already running — you can create this sprint now and use it later. Continue?`}
                              confirmText="Yes"
                              cancelText="No"
                              placement="bottomRight"
                              onConfirm={() => setCreateSprintModalOpen(true)}
                            >
                              <Button
                                type="default"
                                size="small"
                                icon={<PlusOutlined />}
                                className="saas-button-item"
                                style={{ height: 28, fontWeight: 600, fontSize: 12 }}
                              >
                                New Sprint
                              </Button>
                            </ConfirmDialog>
                          ) : (
                            <Button
                              type="default"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => setCreateSprintModalOpen(true)}
                              className="saas-button-item"
                              style={{ height: 28, fontWeight: 600, fontSize: 12 }}
                            >
                              New Sprint
                            </Button>
                          )
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
                      {/* ── Backlog Actions Bar — visible when rows are selected ── */}
                      {backlogSelectedRowKeys.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: 'var(--bg-pure-white)',
                          borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#94a3b8' : '#475569', minWidth: 80 }}>
                            {backlogSelectedRowKeys.length} selected
                          </span>

                          {/* Assignee / Reassign */}
                          {canAssignTicket && (
                            <Dropdown
                              open={assigneeDropdownOpen}
                              onOpenChange={setAssigneeDropdownOpen}
                              trigger={['click']}
                              menu={{ items: [] }}
                              dropdownRender={() => (
                                <div style={{
                                  background: theme === 'dark' ? '#1e293b' : '#fff',
                                  borderRadius: 10,
                                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                  boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.10)',
                                  padding: '6px 4px',
                                  minWidth: 200,
                                  maxHeight: 280,
                                  overflowY: 'auto',
                                }}>
                                  <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Assign to</div>
                                  {members.map(m => (
                                    <div
                                      key={m.value}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                                      className="tl-action-item"
                                      onClick={() => {
                                        backlogSelectedRowKeys.forEach(ticketId => {
                                          updateTicketMutation.mutate({ id: ticketId as string, data: { assignee: m.value }, optimisticData: {} });
                                        });
                                        setAssigneeDropdownOpen(false);
                                        message.success(`Assigned ${backlogSelectedRowKeys.length} ticket(s) to ${m.label}`);
                                      }}
                                    >
                                      <Avatar src={(m as any).avatarUrl} size={24} style={{ background: '#3b82f6', fontSize: 10 }}>{m.label?.[0]?.toUpperCase()}</Avatar>
                                      <span style={{ fontWeight: 500, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{m.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            >
                              <Button
                                size="small"
                                icon={<UserOutlined style={{ fontSize: 11 }} />}
                                style={{
                                  height: 28,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  borderColor: theme === 'dark' ? '#1e3a8a' : '#bfdbfe',
                                  color: theme === 'dark' ? '#94a3b8' : '#475569',
                                  background: 'transparent'
                                }}
                              >
                                {backlogSelectedRowKeys.length === 1 &&
                                  backlogTickets.find(t => t.id === backlogSelectedRowKeys[0])?.assignee
                                  ? 'Reassign' : 'Assignee'}
                              </Button>
                            </Dropdown>
                          )}

                          {/* Move to Archive */}
                          {canManageTickets && (
                            <Button
                              size="small"
                              icon={<FolderAddOutlined style={{ fontSize: 11 }} />}
                              loading={bulkArchiveMutation.isPending}
                              style={{
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                borderColor: theme === 'dark' ? '#064e3b' : '#bbf7d0',
                                color: theme === 'dark' ? '#34d399' : '#15803d',
                                background: 'transparent'
                              }}
                              onClick={() => bulkArchiveMutation.mutate(backlogSelectedRowKeys as string[])}
                            >
                              Move to Archive
                            </Button>
                          )}

                          {/* Move to Bucket */}
                          <Dropdown
                            open={bucketDropdownOpen}
                            onOpenChange={(open) => {
                              setBucketDropdownOpen(open);
                              if (open && buckets.length === 0 && !bucketsLoading) {
                                setBucketsLoading(true);
                                import('@/services/bucketService').then(mod => {
                                  mod.default.getBuckets(projectId).then(data => {
                                    setBuckets(data);
                                  }).catch(() => { }).finally(() => setBucketsLoading(false));
                                });
                              }
                            }}
                            trigger={['click']}
                            menu={{ items: [] }}
                            dropdownRender={() => (
                              <div style={{
                                background: theme === 'dark' ? '#1e293b' : '#fff',
                                borderRadius: 10,
                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.10)',
                                padding: '6px 4px',
                                minWidth: 220,
                                maxHeight: 320,
                                overflowY: 'auto',
                              }}>
                                <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Move to Bucket</div>
                                {bucketsLoading ? (
                                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>Loading...</div>
                                ) : buckets.length === 0 ? (
                                  <div style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 12 }}>No buckets found</div>
                                ) : (
                                  buckets.map((b: any) => (
                                    <div
                                      key={b.id}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                                      className="tl-action-item"
                                      onClick={() => {
                                        import('@/services/bucketService').then(mod => {
                                          mod.default.assignTicketsToBucket(b.id, backlogSelectedRowKeys as string[]).then(() => {
                                            message.success(`Moved ${backlogSelectedRowKeys.length} ticket(s) to "${b.name}"`);
                                            setBacklogSelectedRowKeys([]);
                                            setBacklogSelectedRowKeys([]);
                                            refetchActive();
                                            refetchBacklog();
                                            queryClient.invalidateQueries({ queryKey: ['tickets'] });
                                            setBucketDropdownOpen(false);
                                          }).catch((e: any) => message.error(e.message || 'Failed to move to bucket'));
                                        });
                                      }}
                                    >
                                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color || '#8b5cf6', flexShrink: 0 }} />
                                      <span style={{ fontWeight: 500, flex: 1, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{b.name}</span>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{b._count?.tickets ?? 0} tickets</span>
                                    </div>
                                  ))
                                )}
                                <div style={{ borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9', margin: '6px 4px 4px', paddingTop: 6 }}>
                                  <div style={{ padding: '4px 8px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Create New Bucket</div>
                                  <div style={{ padding: '4px 8px', display: 'flex', gap: 6 }}>
                                    <input
                                      placeholder="Bucket name..."
                                      value={newBucketName}
                                      onChange={e => setNewBucketName(e.target.value)}
                                      onKeyDown={e => e.stopPropagation()}
                                      style={{
                                        flex: 1,
                                        height: 28,
                                        borderRadius: 6,
                                        border: theme === 'dark' ? '1px solid #475569' : '1px solid #e2e8f0',
                                        padding: '0 8px',
                                        fontSize: 12,
                                        outline: 'none',
                                        background: theme === 'dark' ? '#0f172a' : '#fff',
                                        color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                                      }}
                                    />
                                    <button
                                      disabled={!newBucketName.trim() || creatingBucket}
                                      style={{
                                        height: 28, padding: '0 10px', borderRadius: 6, border: 'none',
                                        background: newBucketName.trim() ? '#8b5cf6' : (theme === 'dark' ? '#334155' : '#e2e8f0'),
                                        color: newBucketName.trim() ? '#fff' : '#94a3b8',
                                        cursor: newBucketName.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: 12, fontWeight: 700,
                                      }}
                                      onClick={() => {
                                        if (!newBucketName.trim()) return;
                                        setCreatingBucket(true);
                                        import('@/services/bucketService').then(mod => {
                                          mod.default.createBucket({ name: newBucketName.trim(), projectId }).then(newB => {
                                            setBuckets(prev => [newB, ...prev]);
                                            return mod.default.assignTicketsToBucket(newB.id, backlogSelectedRowKeys as string[]);
                                          }).then(() => {
                                            message.success(`Created bucket "${newBucketName.trim()}" and moved ${backlogSelectedRowKeys.length} ticket(s)`);
                                            setBacklogSelectedRowKeys([]);
                                            setBacklogSelectedRowKeys([]);
                                            refetchActive();
                                            refetchBacklog();
                                            queryClient.invalidateQueries({ queryKey: ['tickets'] });
                                            setNewBucketName('');
                                            setBucketDropdownOpen(false);
                                          }).catch((e: any) => message.error(e.message || 'Failed')).finally(() => setCreatingBucket(false));
                                        });
                                      }}
                                    >
                                      {creatingBucket ? '...' : 'Create'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          >
                            <Button
                              size="small"
                              icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
                              style={{
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                borderColor: '#8b5cf6',
                                color: '#8b5cf6',
                                background: 'transparent'
                              }}
                            >
                              Move to Bucket
                            </Button>
                          </Dropdown>

                          {/* Move to Sprint */}
                          <Dropdown
                            open={sprintDropdownOpen}
                            onOpenChange={(open) => {
                              setSprintDropdownOpen(open);
                              if (open && allSprints.length === 0 && !sprintsLoading) {
                                setSprintsLoading(true);
                                ReleasePlanService.getReleasePlans({ type: 'sprint_plan', projectId, limit: 100 }).then(res => {
                                  setAllSprints(res.data || []);
                                }).catch(() => { }).finally(() => setSprintsLoading(false));
                              }
                            }}
                            trigger={['click']}
                            menu={{ items: [] }}
                            dropdownRender={() => (
                              <div style={{
                                background: theme === 'dark' ? '#1e293b' : '#fff',
                                borderRadius: 10,
                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.10)',
                                padding: '6px 4px',
                                minWidth: 220,
                                maxHeight: 300,
                                overflowY: 'auto',
                              }}>
                                <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Move to Sprint</div>
                                {sprintsLoading ? (
                                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>Loading sprints...</div>
                                ) : allSprints.length === 0 ? (
                                  <div style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 12 }}>No sprints found</div>
                                ) : (
                                  allSprints.map((s: any) => (
                                    <div
                                      key={s.id}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                                      className="tl-action-item"
                                      onClick={() => {
                                        backlogSelectedRowKeys.forEach(ticketId => {
                                          updateTicketMutation.mutate({ id: ticketId as string, data: { releasePlan: s.id }, optimisticData: { releasePlan: s.id } });
                                        });
                                        setBacklogSelectedRowKeys([]);
                                        setBacklogSelectedRowKeys([]);
                                        refetchActive();
                                        refetchBacklog();
                                        queryClient.invalidateQueries({ queryKey: ['tickets'] });
                                        message.success(`Moved ${backlogSelectedRowKeys.length} ticket(s) to ${s.version || s.name}`);
                                        setSprintDropdownOpen(false);
                                      }}
                                    >
                                      <PlayCircleOutlined style={{ color: s.status === 'active' ? '#10b981' : '#94a3b8', fontSize: 12 }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{s.version || s.name}</div>
                                        {s.status && <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{s.status}</div>}
                                      </div>
                                      {s.status === 'active' && <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', background: '#d1fae5', borderRadius: 4, padding: '2px 5px' }}>ACTIVE</span>}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          >
                            <Button
                              size="small"
                              icon={<PlayCircleOutlined style={{ fontSize: 11 }} />}
                              style={{
                                height: 28,
                                width: 118,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 6,
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                                background: 'transparent'
                              }}
                            >
                              Move to Sprint
                            </Button>
                          </Dropdown>

                          {/* Delete */}
                          {canDeleteTicket && (
                            <ConfirmDialog
                              tone="danger"
                              title="Move to Trash"
                              description={`Move ${backlogSelectedRowKeys.length} selected ticket(s) to trash?`}
                              confirmText="Move to Trash"
                              onConfirm={() => bulkDeleteMutation.mutateAsync(backlogSelectedRowKeys as string[])}
                              placement="bottom"
                            >
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                loading={bulkDeleteMutation.isPending}
                                style={{ height: 28, width: 118, fontSize: 11, fontWeight: 700, borderRadius: 6, background: 'transparent' }}
                              >
                                Delete
                              </Button>
                            </ConfirmDialog>
                          )}

                          {/* Clear selection */}
                          <button
                            type="button"
                            onClick={() => setBacklogSelectedRowKeys([])}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <CloseOutlined style={{ fontSize: 10 }} /> Clear
                          </button>
                        </div>
                      )}

                      <div className="pp-table-wrap">
                        <Table
                          rowSelection={backlogRowSelection}
                          columns={(getColumns('backlog') || []).filter((c: any) => !hiddenCols[c.key as string])}
                          loading={backlogFetching}
                          dataSource={backlogTickets}
                          rowKey="id"
                          className="saas-table tl-table tl-table-sticky-pagination pp-table"
                          size="small"
                          pagination={false}
                          scroll={{ x: 'max-content' }}

                          onRow={(record) => ({
                            onClick: (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger, .premium-input-field, .ant-input-number, .ant-input, .saas-select-minimal, .saas-button-item, a')) return;
                              handleViewTicket(record);
                            },
                            className: 'pp-row',
                          })} locale={{ emptyText: <NoData /> }}
                        />
                      </div>
                      {renderCustomPagination(
                        pagination.current,
                        pagination.pageSize,
                        totalBacklog,
                        backlogSelectedRowKeys.length,
                        (page) => setPagination((prev) => ({ ...prev, current: page })),
                        (size) => setPagination((prev) => ({ ...prev, current: 1, pageSize: size }))
                      )}
                    </div>
                  </div>
                )}

                {/* Filtered View — unified set of tickets matching the sidebar quick filters.
              Pulls from across the project (no sprint/backlog scope) so commented +
              attached tickets from either side land in one table. */}
                {isFilteredView && (
                  <div id="filtered-section" className="tl-section">
                    <div className="tl-section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: '1', minWidth: 0 }}>
                        <button
                          type="button"
                          className="tl-back-btn"
                          onClick={() => {
                            setActiveQuickFilters({ commented: false, attached: false, overdue: false });
                            setSidebarActiveSection(previousSection);
                          }}
                        >
                          <ArrowLeftOutlined style={{ fontSize: 10 }} />
                          Back to {previousSection === 'sprint' ? 'Sprint' : 'Backlog'}
                        </button>
                        <Text style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-slate-900)' }}>
                          {filteredViewKindLabel}
                        </Text>
                        <Tag bordered={false} style={{
                          margin: 0, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-slate-50)', color: 'var(--text-slate-500)',
                          fontWeight: 800, fontSize: 9, borderRadius: 4, textTransform: 'uppercase',
                          border: '1px solid var(--border-slate-200)', padding: '0 6px'
                        }}>
                          {filteredViewTotal || quickFilterTicketIds.length} Tickets
                        </Tag>
                        {activeQuickFilters.commented && (
                          <Tag bordered={false} style={{
                            margin: 0, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(59,130,246,0.10)', color: '#1d4ed8',
                            fontWeight: 800, fontSize: 9, borderRadius: 4, textTransform: 'uppercase',
                            border: '1px solid rgba(59,130,246,0.25)', padding: '0 6px'
                          }}>
                            <MessageOutlined style={{ fontSize: 9, marginRight: 3 }} />
                            Commented
                          </Tag>
                        )}
                        {activeQuickFilters.attached && (
                          <Tag bordered={false} style={{
                            margin: 0, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(99,102,241,0.10)', color: '#4338ca',
                            fontWeight: 800, fontSize: 9, borderRadius: 4, textTransform: 'uppercase',
                            border: '1px solid rgba(99,102,241,0.25)', padding: '0 6px'
                          }}>
                            <PaperClipOutlined style={{ fontSize: 9, marginRight: 3 }} />
                            Attached
                          </Tag>
                        )}
                        {activeQuickFilters.overdue && (
                          <Tag bordered={false} style={{
                            margin: 0, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(239,68,68,0.10)', color: '#b91c1c',
                            fontWeight: 800, fontSize: 9, borderRadius: 4, textTransform: 'uppercase',
                            border: '1px solid rgba(239,68,68,0.28)', padding: '0 6px'
                          }}>
                            <WarningOutlined style={{ fontSize: 9, marginRight: 3 }} />
                            Overdue
                          </Tag>
                        )}
                      </div>
                    </div>
                    <div className="tl-section-body">
                      <div className="pp-table-wrap">
                        <Table
                          columns={(getColumns('backlog') || []).filter((c: any) => !hiddenCols[c.key as string])}
                          dataSource={filteredViewTickets}
                          loading={filteredViewFetching}
                          rowKey="id"
                          className="saas-table tl-table tl-table-sticky-pagination pp-table"
                          size="small"
                          pagination={false}
                          scroll={{ x: 'max-content' }}

                          onRow={(record) => ({
                            onClick: (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger, .premium-input-field, .ant-input-number, .ant-input, .saas-select-minimal, .saas-button-item, a')) return;
                              handleViewTicket(record);
                            },
                            className: 'pp-row',
                          })} locale={{ emptyText: <NoData /> }}
                        />
                      </div>
                      {renderCustomPagination(
                        pagination.current,
                        pagination.pageSize,
                        filteredViewTotal,
                        0,
                        (page) => setPagination((prev) => ({ ...prev, current: page })),
                        (size) => setPagination((prev) => ({ ...prev, current: 1, pageSize: size }))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {activeSprint && !isFilteredView && kanbanScope === 'active' && renderActiveSprintHeader('compact')}
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
                    onAddTicketToColumn={canCreateTicket ? (statusId: string) => {
                      setManualCreateDefaultStatus(statusId);
                      setManualModalOpen(true);
                    } : undefined}
                    onBulkArchive={(ids) => bulkArchiveMutation.mutate(ids)}
                    onBulkDelete={(ids) => {
                      bulkDeleteMutation.mutate(ids);
                    }}
                  />
                ) : (
                  <Card className="saas-card"><NoData description="No tickets found" /></Card>
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

      <Drawer
        {...commonDrawerProps}
        open={createSprintModalOpen}
        onClose={() => setCreateSprintModalOpen(false)}
        placement="right"
        title={null}
        width={700}
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        <SprintCreationForm
          projectId={projectId}
          isDraft={!!activeSprint}
          loading={creatingSprintLoading}
          onSubmit={handleCreateSprintFromBacklog}
          onCancel={() => setCreateSprintModalOpen(false)}
        />
      </Drawer>
      <ManualCreateTicketModal
        open={manualModalOpen}
        onClose={() => {
          setManualModalOpen(false);
          setManualCreateDefaultStatus(undefined);
        }}
        projectId={projectId}
        onTicketCreated={handleTicketCreated}
        defaultStatus={manualCreateDefaultStatus}
      />

      <AiCreateTicketModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        projectId={projectId}
        onTicketCreated={handleTicketCreated}
      />

      <style jsx global>{`
        /* ── Ticket Calendar view ──────────────────────────────
           The card sits flush against the sprint detail header above —
           drop the top border + top-radius so the seam between them
           disappears. Bottom + sides keep their card chrome. */
        .tcal-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-top: 0;
          border-radius: 0 0 12px 12px;
          position: relative;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
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
          position: relative;
          z-index: 5;
          border-radius: 0;
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
          flex: 1;
          min-height: 0;
          overflow-y: auto;
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
        /* Premium action dropdown */
        .tl-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .tl-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .tl-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .tl-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .tl-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .tl-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-slate-50); color: var(--text-slate-500); font-size: 13px;
        }
        .tl-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .tl-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .tl-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .tl-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .tl-action-pop .ant-dropdown-menu-item-danger .tl-menu-title { color: #ef4444; }
        .tl-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .tl-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
      `}</style>
      
      {/* Jira Migration Wizard Drawer */}
      <JiraMigrationWizard visible={jiraWizardVisible} onClose={() => setJiraWizardVisible(false)} />
      <LinearMigrationWizard visible={linearWizardVisible} onClose={() => setLinearWizardVisible(false)} />
    </div>
  );
}


