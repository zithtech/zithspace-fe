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
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
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
  type: string[];
  tags: string[];
  search: string;
}

interface TicketListProps {
  projectId: string;
  projectName: string;
  projectCode: string;
}

export default function TicketList({ projectId, projectName, projectCode }: TicketListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message, modal, notification } = App.useApp();
  // const [modal, contextHolder] = Modal.useModal();

  // Local state for filters only
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    assignee: [],
    type: [],
    tags: [],
    search: "",
  });

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [kanbanScope, setKanbanScope] = useState<'active' | 'backlog'>('active');

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
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [allTicketIds, setAllTicketIds] = useState<string[]>([]);

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

  // Measure active-sprint card head so the table column headers stick flush below it
  const activeSprintCardRef = useRef<HTMLDivElement | null>(null);
  const [activeSprintHeadOffset, setActiveSprintHeadOffset] = useState<number>(128);
  useEffect(() => {
    const el = activeSprintCardRef.current?.querySelector('.ant-card-head') as HTMLElement | null;
    if (!el) return;
    const update = () => setActiveSprintHeadOffset(56 + el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeSprintCardRef.current]);

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
    pageSize: 10,
  });







  // Add this after all useState declarations
  const [dbStatusOptions, setDbStatusOptions] = useState<{ label: string; value: string }[]>([]);
  const [dbPriorityOptions, setDbPriorityOptions] = useState<{ label: string; value: string }[]>([]);

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

  // --- React Query Hooks ---

  // Base params (without pagination) for filters
  const baseQueryParams = {
    projectId, // From props, mandatory project context
    status: filters.status.length > 0 ? filters.status.join(",") : undefined,
    priority: filters.priority.length > 0 ? filters.priority.join(",") : undefined,
    assigneeId:
      filters.assignee.length > 0 ? filters.assignee.join(",") : undefined,
    type: filters.type.length > 0 ? filters.type.join(",") : undefined,
    tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,
    search: filters.search || undefined,
  };

  // Fetch Active Sprint to get ID for assignments (scoped to project)
  const { data: activeSprints } = useQuery({
    queryKey: ['activeSprint', projectId],
    queryFn: () => ReleasePlanService.getActiveReleasePlans(projectId),
    staleTime: 60 * 1000,
    enabled: !!projectId,
  });
  const activeSprint = activeSprints && activeSprints.length > 0 ? activeSprints[0] : null;

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

  // 3. Fetch ALL Active Sprint Tickets for progress calculation (UNFILTERED)
  const { data: overallSprintData } = useTickets({
    projectId,
    sprintId: 'active',
    limit: 9999
  }, {
    enabled: !!activeSprint // Only fetch if we have an active sprint
  });
  const overallSprintTickets = overallSprintData?.data || [];


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
      setPagination(prev => ({ ...prev, current: 1, pageSize: 10 }));
    } else {
      setPagination(prev => ({ ...prev, current: 1, pageSize: 10 }));
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
    // Prepare update data
    const updateData: any = {};
    // Prepare optimistic cache data (optional override)
    let optimisticData: any = null;

    if (field === "status") updateData.status = value;
    else if (field === "assignee") {
      updateData.assignee = value;
      // Find full member object for seamless optimistic update
      const member = members.find(m => m.value === value);
      if (member) {
        optimisticData = {
          assignee: {
            id: member.value,
            name: member.label,
            email: "" // Email might not be in the lightweight members list, empty string satisfies type
          }
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
          message.success(`${field} updated`);
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
  const getColumns = (context: 'active' | 'backlog'): TableProps<Ticket>['columns'] => [
    {
      title: "ID",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 100,
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
            border: '1px solid var(--border-blue-200)'
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 24 }}
            onClick={() => setEditingField({ ticketId: record.id, field: "title" })}
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
            <EditOutlined
              className="opacity-0 group-hover:opacity-40 transition-opacity"
              style={{ color: 'var(--premium-blue)', fontSize: 12 }}
            />
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
            style={{ cursor: "pointer", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 80 }}
            onClick={() =>
              setEditingField({ ticketId: record.id, field: "status" })
            }
          >
            {getStatusLabel(status, finalStatusOptions)}
          </Tag>
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
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => setEditingField({ ticketId: record.id, field: "priority" })}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
            {priority}
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
              value={assigneeId}
              style={{ width: "100%" }}
              onChange={(value) =>
                handleUpdateTicket(record.id, "assignee", value)
              }
              onBlur={() => setEditingField(null)}
              autoFocus
              loading={isUpdating}
              showSearch
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
            style={{ cursor: "pointer", transition: 'all 0.2s' }}
            className="hover:translate-x-1"
            onClick={() =>
              setEditingField({ ticketId: record.id, field: "assignee" })
            }
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
          return <Text type="secondary" style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => setEditingField({ ticketId: record.id, field: "type" })}>-</Text>;
        }
        return (
          <Tag
            className={`saas-tag ${getTypeColorClass(type)}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setEditingField({ ticketId: record.id, field: "type" })}
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
      fixed: 'right',
      width: 160,
      render: (_: any, record: Ticket) => {
        const handleShare = () => {
          const url = `${window.location.origin}/public/tickets/${record.id}`;
          navigator.clipboard.writeText(url);
        };

        return (
          <Space size={4}>
            {/* Context based actions */}
            {context === 'backlog' && (
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
            {context === 'active' && (
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
                  {
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
                ]
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

  return (
    <div style={{
      backgroundColor: 'var(--bg-pure-white)',
      minHeight: 'calc(100vh - 64px)',
      padding: '0 24px 24px 24px',
      margin: '0 -24px'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .project-switch-trigger:hover {
          background-color: var(--bg-slate-50);
        }
        .tickets-table-shell[data-density='compact'] .ant-table-tbody > tr > td { padding: 5px 12px !important; }
        .tickets-table-shell[data-density='comfortable'] .ant-table-tbody > tr > td { padding: 9px 16px !important; }
        .tickets-table-shell[data-density='spacious'] .ant-table-tbody > tr > td { padding: 14px 20px !important; }
        .tickets-table-settings-popover .ant-popover-inner { padding: 14px !important; border-radius: 12px !important; }
        .tickets-cols-scroll::-webkit-scrollbar { width: 6px; }
        .tickets-cols-scroll::-webkit-scrollbar-track { background: transparent; }
        .tickets-cols-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
        .tickets-cols-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-slate-400); }
      `}} />

      {/* Premium Header Row - Sticky Glassmorphism */}
      <div className="saas-header-container" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        margin: '0 -24px 16px -24px',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
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
                  onReset={() => setFilters({ status: [], priority: [], assignee: [], type: [], tags: [], search: filters.search })}
                />
              }
              trigger="click"
              placement="bottomLeft"
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
            onChange={(v) => setViewMode(v as 'list' | 'board')}
            options={[
              { label: 'List', value: 'list', icon: <UnorderedListOutlined style={{ fontSize: 13 }} /> },
              { label: 'Board', value: 'board', icon: <AppstoreOutlined style={{ fontSize: 13 }} /> },
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
                    {TICKETS_TOGGLEABLE_COLUMNS.map((c) => (
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
                await queryClient.invalidateQueries({ queryKey: ['tickets'] });
                setIsRefreshing(false);
                message.success("View refreshed");
              }}
              style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
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
        </Space>
      </div>

      {/* Inline Filter Row */}
      {isFilterRowOpen && (
        <div className="ticket-filter-row">
          <div className="ticket-filter-row__header">
            <span className="ticket-filter-row__badge">
              <FilterOutlined />
            </span>
            <div className="ticket-filter-row__title">
              <span className="ticket-filter-row__title-text">View Filters</span>
              <span className="ticket-filter-row__title-sub">
                {activeFilterCount > 0 ? `${activeFilterCount} active` : 'No filters applied'}
              </span>
            </div>
          </div>

          <div className="ticket-filter-row__fields">
            <div className="ticket-filter-row__field">
              <label className="ticket-filter-row__label">
                <CheckCircleOutlined /> Status
              </label>
              <Select
                mode="multiple"
                placeholder="Any status"
                value={filters.status}
                onChange={(val) => handleFilterChange('status', val)}
                options={STATUS_OPTIONS}
                allowClear
                maxTagCount={1}
                className="ticket-filter-row__select"
              />
            </div>

            <div className="ticket-filter-row__field">
              <label className="ticket-filter-row__label">
                <ThunderboltOutlined /> Priority
              </label>
              <Select
                mode="multiple"
                placeholder="Any priority"
                value={filters.priority}
                onChange={(val) => handleFilterChange('priority', val)}
                options={PRIORITY_OPTIONS}
                allowClear
                maxTagCount={1}
                className="ticket-filter-row__select"
              />
            </div>

            <div className="ticket-filter-row__field">
              <label className="ticket-filter-row__label">
                <AppstoreOutlined /> Type
              </label>
              <Select
                mode="multiple"
                placeholder="Any type"
                value={filters.type}
                onChange={(val) => handleFilterChange('type', val)}
                options={TYPE_OPTIONS}
                allowClear
                maxTagCount={1}
                className="ticket-filter-row__select"
              />
            </div>

            <div className="ticket-filter-row__field">
              <label className="ticket-filter-row__label">
                <UserOutlined /> Assignee
              </label>
              <Select
                mode="multiple"
                placeholder="All members"
                value={filters.assignee}
                onChange={(val) => handleFilterChange('assignee', val)}
                options={members.map((m) => ({ label: m.label, value: m.value }))}
                allowClear
                showSearch
                maxTagCount={1}
                filterOption={(input, option) => {
                  const member = members.find((m) => m.value === option?.value);
                  return member
                    ? member.label.toLowerCase().includes(input.toLowerCase()) ||
                    (member.position || '').toLowerCase().includes(input.toLowerCase())
                    : false;
                }}
                className="ticket-filter-row__select"
              />
            </div>

            <div className="ticket-filter-row__field">
              <label className="ticket-filter-row__label">
                <TagsOutlined /> Tags
              </label>
              <Select
                mode="multiple"
                placeholder="Any tag"
                value={filters.tags}
                onChange={(val) => handleFilterChange('tags', val)}
                options={tagSuggestions.map((t) => ({ label: t, value: t }))}
                allowClear
                showSearch
                maxTagCount={1}
                notFoundContent="No tags yet"
                filterOption={(input, option) =>
                  String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                }
                className="ticket-filter-row__select"
              />
            </div>
          </div>

          <div className="ticket-filter-row__actions">
            {activeFilterCount > 0 && (
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setFilters({ status: [], priority: [], assignee: [], type: [], tags: [], search: filters.search })}
                className="ticket-filter-row__reset"
              >
                Reset
              </Button>
            )}

            <Tooltip title="Close filters">
              <Button
                type="text"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={() => setIsFilterRowOpen(false)}
                aria-label="Close filter row"
                className="ticket-filter-row__close"
              />
            </Tooltip>
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

      {/* Tickets View */}
      {(isRefreshing || (viewMode === 'list' ? (activeSprintLoading || backlogLoading) : isKanbanLoading)) ? (
        <TicketSkeleton viewMode={viewMode} />
      ) : viewMode === 'list' ? (
        <div className="fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Sprint Section */}
          {activeSprint && (
            <div id="active-section" ref={activeSprintCardRef} style={{ scrollMarginTop: '100px' }}>
              <Card
                className="saas-card saas-card-sticky"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Space size={12}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />
                      <Text style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-slate-900)' }}>
                        {activeSprint?.version || 'Active Sprint'}
                      </Text>
                      <Space size={6}>
                        <Tag className="saas-tag saas-tag-green" style={{
                          margin: 0,
                          height: 24,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 70,
                          fontSize: 10,
                          fontWeight: 800,
                          borderRadius: 4
                        }}>
                          Current
                        </Tag>
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
                    <Space size={12} split={<Divider type="vertical" style={{ height: 20, margin: 0, opacity: 1, borderColor: '#e2e8f0', borderWidth: 1 }} />}>
                      {activeSelectedRowKeys.length > 0 ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Progress</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                              {overallSprintTickets.length > 0 ? Math.round((overallSprintTickets.filter(t => ['completed'].includes(t.status?.toLowerCase() || '')).length / overallSprintTickets.length) * 100) : 0}%
                            </div>
                          </div>
                          {(() => {
                            const start = dayjs(activeSprint.startDate);
                            const end = dayjs(activeSprint.endDate);
                            const now = dayjs();
                            const totalDays = Math.max(end.diff(start, 'day'), 1);
                            const elapsedDays = Math.max(0, Math.min(totalDays, now.diff(start, 'day')));
                            const pct = Math.round((elapsedDays / totalDays) * 100);
                            const isOverdue = now.isAfter(end, 'day');
                            const accent = isOverdue ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';

                            return (
                              <div style={{ textAlign: 'left', minWidth: 180 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Sprint Timeline
                                  </div>
                                  <Text style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>
                                    {isOverdue ? 'OVERDUE' : `${Math.max(0, totalDays - elapsedDays)}d LEFT`}
                                  </Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                                    {start.format('MMM D')}
                                  </Text>
                                  <div style={{ flex: 1, position: 'relative', height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', minWidth: 80 }}>
                                    <div style={{
                                      position: 'absolute',
                                      inset: 0,
                                      width: `${Math.min(100, pct)}%`,
                                      background: accent,
                                      opacity: 0.9,
                                      borderRadius: 999,
                                      transition: 'width 0.4s ease',
                                    }} />
                                  </div>
                                  <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                                    {end.format('MMM D')}
                                  </Text>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}

                      <Button
                        type="default"
                        size="middle"
                        icon={<UnorderedListOutlined style={{ color: '#64748b' }} />}
                        onClick={() => document.getElementById('backlog-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="saas-button-item"
                        style={{ height: 32, fontWeight: 600 }}
                      >
                        Go To Backlogs
                      </Button>
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
                    </Space>
                  </div>
                }
              >
                <div className="tickets-table-shell" data-density={tableDensity}>
                  <Table
                    rowSelection={activeRowSelection}
                    columns={(getColumns('active') || []).filter((c: any) => !hiddenCols[c.key as string])}
                    dataSource={activeTickets}
                    loading={activeSprintFetching}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    sticky={{ offsetHeader: activeSprintHeadOffset }}
                    className="saas-table"
                    size="middle"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Backlog Section */}
          <div id="backlog-section" style={{ scrollMarginTop: '100px' }}>
            <Card
              className="saas-card"
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space size={12}>
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
                  </Space>
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
                    <Button
                      type="default"
                      icon={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
                      onClick={() => document.getElementById('active-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="saas-button-item"
                      style={{ height: 32, fontWeight: 600 }}
                    >
                      Go To Sprint
                    </Button>
                    <Button
                      type="default"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateSprintModalOpen(true)}
                      className="saas-button-item"
                      style={{ height: 32, fontWeight: 600 }}
                    >
                      New Sprint
                    </Button>
                  </Space>

                </div>
              }
            >
              <div className="tickets-table-shell" data-density={tableDensity}>
                <Table
                  rowSelection={backlogRowSelection}
                  columns={(getColumns('backlog') || []).filter((c: any) => !hiddenCols[c.key as string])}
                  loading={backlogFetching}
                  dataSource={backlogTickets}
                  rowKey="id"
                  className="saas-table"
                  size="middle"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: totalBacklog,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],
                    showTotal: (total) => <Text type="secondary" style={{ fontSize: 12 }}>Total <b>{total}</b> tickets</Text>,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 10 })
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="fadeIn">
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
            />
          ) : (
            <Card className="saas-card"><Empty description="No tickets found" /></Card>
          )}
        </div>
      )}

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
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            boxShadow: "0 24px 60px -20px rgba(15, 23, 42, 0.45)",
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
    </div>
  );
}

