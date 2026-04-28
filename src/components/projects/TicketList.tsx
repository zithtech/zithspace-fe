"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  message,
  Modal,
  Popconfirm,
  Radio,
  Popover,
  Tooltip,
  Divider,
  Collapse,
  notification,
  Alert,
  Dropdown,
  MenuProps,
  Badge,
  Progress,
  Spin,
  Segmented,
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
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Ticket } from "@/services/ticketService";
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
import { useTickets, useKanbanTickets, useUpdateTicket, useDeleteTicket } from "@/hooks/useTickets";
import { useTicketSocketEvents } from "@/hooks/useTicketSocketEvents";
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

const { Title, Text } = Typography;

interface FilterState {
  status: string[];
  priority: string[];
  assignee: string[];
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
  const [modal, contextHolder] = Modal.useModal();

  // Local state for filters only
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    assignee: [],
    search: "",
  });

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [kanbanScope, setKanbanScope] = useState<'active' | 'backlog'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
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
  const [recentTicket, setRecentTicket] = useState<Ticket | null>(null);

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

  // --- React Query Hooks ---

  // Base params (without pagination) for filters
  const baseQueryParams = {
    projectId, // From props, mandatory project context
    status: filters.status.length > 0 ? filters.status.join(",") : undefined,
    priority: filters.priority.length > 0 ? filters.priority.join(",") : undefined,
    assigneeId:
      filters.assignee.length > 0 ? filters.assignee.join(",") : undefined,
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

  // Handle Add/Remove from Sprint
  // Handle Add/Remove from Sprint
  const [notifyApi, notifyContextHolder] = notification.useNotification({
    placement: 'top',
  }); // Use notification hook

  // Handle Add/Remove from Sprint
  // Handle Add/Remove from Sprint
  const handleSprintAssignment = (ticketId: string, action: 'add' | 'remove') => {
    if (action === 'add' && !activeSprint) {
      notifyApi.error({ message: "Action Failed", description: "No active sprint found for this project." });
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
        notifyApi.success({
          message: action === 'add' ? "Ticket Added to Sprint" : "Ticket Removed from Sprint",
          description: action === 'add'
            ? `${activeSprint?.name || 'Sprint'} updated.`
            : "Ticket returned to backlog.",
          placement: 'top', // Premium top-center placement
          className: 'custom-notification',
          style: {
            borderLeft: `4px solid ${action === 'add' ? '#52c41a' : '#ff4d4f'}`,
          }
        });
      },
      onError: (err) => {
        console.error(err);
        notifyApi.error({ message: "Update Failed", description: "Failed to update sprint assignment." });
      }
    });
  };



  const handleCompleteSprint = () => {
    if (!activeSprint?.id) return;
    setSprintCompletionModalOpen(true);
  };

  const handleSprintCompletionSuccess = () => {
    setSprintCompletionModalOpen(false);
    notifyApi.success({
      message: 'Sprint Completed',
      description: 'Sprint completed successfully',
      placement: 'top',
      style: {
        borderLeft: '4px solid #52c41a',
      }
    });
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
        notifyApi.success({
          message: 'Active Sprint Created',
          description: `${newSprint.version} is now your active sprint! Start adding tickets.`,
          placement: 'top',
          style: { borderLeft: '4px solid #52c41a' }
        });
      } else {
        notifyApi.success({
          message: 'Planning Sprint Created',
          description: `${newSprint.version} created as a draft. You can start it after completing the current sprint.`,
          placement: 'top',
          style: { borderLeft: '4px solid #1890ff' }
        });
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

  // Enable live updates
  useTicketSocketEvents();

  // --- Effects ---

  // Dual Query Strategy for Kanban
  // 1. Fast initial load (20 tickets/column = 80 total)
  const initialKanbanParams = viewMode === 'board' ? {
    projectId, // From props, mandatory project context
    assigneeId: filters.assignee.length > 0 ? filters.assignee.join(',') : undefined,
    priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
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

  const fireConfetti = () => {
    try {
      // @ts-ignore
      import('canvas-confetti').then((confetti) => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          // since particles fall down, start a bit higher than random
          confetti.default({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti.default({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }).catch(err => {
        console.warn('Confetti module not found, skipping animation', err);
      });
    } catch (e) {
      console.error('Error firing confetti:', e);
    }
  };

  const handleTicketCreated = (ticket: Ticket) => {
    fireConfetti();
    setRecentTicket(ticket);
  };

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
              options={dbStatusOptions.length > 0 ? dbStatusOptions : STATUS_OPTIONS}
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
            {getStatusLabel(status, dbStatusOptions.length > 0 ? dbStatusOptions : STATUS_OPTIONS)}
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
      {contextHolder}
      {notifyContextHolder}

      <style dangerouslySetInnerHTML={{
        __html: `
        .project-switch-trigger:hover {
          background-color: var(--bg-slate-50);
        }
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
            style={{ maxWidth: 280, borderRadius: 8, height: 36 }}
            value={localSearchValue}
            onChange={(e) => setLocalSearchValue(e.target.value)}
            allowClear
          />

          <Popover
            content={
              <TicketFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                members={members}
                onReset={() => setFilters({ status: [], priority: [], assignee: [], search: filters.search })}
              />
            }
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              icon={<FilterOutlined />}
              className={`saas-button-item ${activeFilterCount > 0 ? 'saas-tag-blue' : ''}`}
              style={{ height: 36, fontWeight: 600 }}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </Popover>

          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'list' | 'board')}
            options={[
              { label: 'List', value: 'list', icon: <UnorderedListOutlined style={{ fontSize: 13 }} /> },
              { label: 'Board', value: 'board', icon: <AppstoreOutlined style={{ fontSize: 13 }} /> },
            ]}
            className="saas-segmented-premium"
          />
        </div>

        {/* Right Side Actions */}
        <Space size={12}>
          {recentTicket && (
            <div 
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
            <div id="active-section" style={{ scrollMarginTop: '100px' }}>
              <Card
                className="saas-card"
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
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Progress</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                          {overallSprintTickets.length > 0 ? Math.round((overallSprintTickets.filter(t => ['live', 'live_testing', 'completed'].includes(t.status?.toLowerCase() || '')).length / overallSprintTickets.length) * 100) : 0}%
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          Sprint Timeline
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start', color: '#475569' }}>
                          <CalendarOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                          <Text style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                            {dayjs(activeSprint.startDate).format('MMM D')} — {dayjs(activeSprint.endDate).format('MMM D')}
                          </Text>
                        </div>
                      </div>
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
                <Table
                  columns={getColumns('active')}
                  dataSource={activeTickets}
                  loading={activeSprintFetching}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  className="saas-table"
                  size="middle"
                />
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
                    <Input
                      placeholder="Search backlog..."
                      prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                      className="saas-input"
                      style={{ width: 220, borderRadius: 6, height: 32, fontSize: 12 }}
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
              <Table
                columns={getColumns('backlog')}
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
              onSprintAssignment={handleSprintAssignment}
              onCompleteSprint={handleCompleteSprint}
              filters={filters}
              onFilterChange={handleFilterChange}
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
        title={<Text strong style={{ fontSize: 16 }}>Create New Sprint</Text>}
        open={createSprintModalOpen}
        onCancel={() => setCreateSprintModalOpen(false)}
        footer={null}
        width={480}
        centered
        className="saas-modal"
      >
        <Alert
          message={activeSprint ? "Draft Sprint" : "Active Sprint"}
          description={activeSprint ? "You already have a running sprint. This will be created as a draft." : "This will become your primary active sprint immediately."}
          type={activeSprint ? "info" : "success"}
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
        <SprintCreationForm
          projectId={projectId}
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

