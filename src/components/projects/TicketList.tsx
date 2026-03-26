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
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Ticket } from "@/services/ticketService";
import { ProjectService } from "@/services/projectService";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/utils/ticketUtils";
import { useTickets, useKanbanTickets, useUpdateTicket, useDeleteTicket } from "@/hooks/useTickets";
import { useTicketSocketEvents } from "@/hooks/useTicketSocketEvents";
import { useUserProjects, useMembers } from "@/hooks/useGlobalData";
import { InlineCreateTicket } from "./InlineCreateTicket";
import { TicketFilters } from "./TicketFilters";
import { TicketKanban } from './kanban/TicketKanban';
import ReleasePlanService from "@/services/releasePlanService";
import { TicketDetailDrawer } from "./drawer/TicketDetailDrawer";
import { SprintCompletionModal } from "./sprint-completion";
import { SprintCreationForm, type SprintFormData } from "./sprint-completion/SprintCreationForm";

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



  // Use cached global data hooks
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: members = [], isLoading: membersLoading } = useMembers();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // --- React Query Hooks ---

  // Base params (without pagination) for filters
  const baseQueryParams = {
    projectId, // From props, mandatory project context
    status: filters.status.length > 0 ? filters.status[0] : undefined,
    priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
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

  // Query Params for Backlog List (WITH PAGINATION)
  const backlogParams = {
    ...baseQueryParams,
    sprintId: 'null',
    page: pagination.current,
    limit: pagination.pageSize,
  };

  // 1. Fetch Active Sprint Tickets
  const {
    data: activeSprintData,
    isLoading: activeSprintLoading,
    refetch: refetchActive
  } = useTickets(activeSprintParams);

  // 2. Fetch Backlog Tickets
  const {
    data: backlogData,
    isLoading: backlogLoading,
    refetch: refetchBacklog
  } = useTickets(backlogParams);

  // Default "All Tickets" query (Legacy support or if we toggle off split view? 
  // User wants SPLIT view. So we might not need the unified query anymore for List view.
  // But we keep it if we want to support filtering without sprint context?
  // User asked for specific split. We will use these two data sources.)

  const activeTickets = activeSprintData?.data || [];
  const backlogTickets = backlogData?.data || [];
  const totalBacklog = backlogData?.pagination?.total || 0;

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
  const [notifyApi, notifyContextHolder] = notification.useNotification(); // Use notification hook

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
          placement: 'bottomLeft', // Jira style-ish
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
      placement: 'bottomLeft',
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
          placement: 'bottomLeft',
          style: { borderLeft: '4px solid #52c41a' }
        });
      } else {
        notifyApi.success({
          message: 'Planning Sprint Created',
          description: `${newSprint.version} created as a draft. You can start it after completing the current sprint.`,
          placement: 'bottomLeft',
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
    isLoading: isInitialKanbanLoading
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "processing";
      case "in_testing":
        return "warning";
      case "not_started":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "red";
      case "P2":
        return "orange";
      case "P3":
        return "green";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Bug":
        return "red";
      case "Task":
        return "blue";
      case "Feat":
        return "green";
      case "Overwrite":
        return "orange";
      default:
        return "default";
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
  };

  const handleDeleteTicket = async (ticket: Ticket, event?: React.MouseEvent) => {
    try {
      await deleteTicketMutation.mutateAsync(ticket.id);
      message.success("Ticket deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete ticket:", error);

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

  // Table columns generator
  const getColumns = (context: 'active' | 'backlog') => [
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
            color: '#1677ff',
            fontWeight: 500
          }}
          className="hover:underline"
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 300,
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
            />
          );
        }

        const displayText = text.length > 40 ? `${text.slice(0, 40)} ...` : text;

        return (
          <div
            className="group"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 22 }}
            onClick={() => setEditingField({ ticketId: record.id, field: "title" })}
            title={text} // Show full text on native tooltip as well
          >
            <Text ellipsis={{ tooltip: true }} style={{ flex: 1 }}>{displayText}</Text>
            <EditOutlined
              className="opacity-0 group-hover:opacity-70 transition-opacity"
              style={{ color: '#1677ff' }}
            />
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
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
              options={STATUS_OPTIONS}
            />
          );
        }

        return (
          <Tag
            color={getStatusColor(status)}
            style={{ cursor: "pointer" }}
            onClick={() =>
              setEditingField({ ticketId: record.id, field: "status" })
            }
          >
            {status.replace("_", " ").toUpperCase()}
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
              options={[
                { label: "High (P1)", value: "P1" },
                { label: "Medium (P2)", value: "P2" },
                { label: "Low (P3)", value: "P3" },
              ]}
            />
          );
        }

        return (
          <Tag color={getPriorityColor(priority)} style={{ cursor: 'pointer' }} onClick={() => setEditingField({ ticketId: record.id, field: "priority" })}>
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
          return <Text type="secondary" style={{ cursor: 'pointer' }} onClick={() => setEditingField({ ticketId: record.id, field: "type" })}>-</Text>;
        }
        return <Tag color={getTypeColor(type)} style={{ cursor: 'pointer' }} onClick={() => setEditingField({ ticketId: record.id, field: "type" })}>{type}</Tag>;
      },
    },
    {
      title: "Story Points",
      dataIndex: "storyPoint",
      key: "storyPoint",
      width: 100,
      render: (storyPoint: number | undefined, record: Ticket) => {
        const isEditing =
          editingField?.ticketId === record.id &&
          editingField?.field === "storyPoint";
        const isUpdating = updateTicketMutation.isPending && updateTicketMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <Input
              type="number"
              defaultValue={storyPoint}
              autoFocus={true}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                handleUpdateTicket(record.id, "storyPoint", isNaN(val) ? 0 : val);
              }}
              onPressEnter={(e) => {
                const val = parseFloat(e.currentTarget.value);
                handleUpdateTicket(record.id, "storyPoint", isNaN(val) ? 0 : val);
              }}
              style={{ width: '100%' }}
              disabled={isUpdating}
            />
          );
        }

        return (
          <div
            style={{ cursor: 'pointer', minHeight: 22 }}
            onClick={() => setEditingField({ ticketId: record.id, field: "storyPoint" })}
          >
            {storyPoint !== undefined && storyPoint !== null ? (
              <div style={{
                display: 'inline-block',
                background: '#f0f0f0',
                borderRadius: '12px',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#555'
              }}>
                {storyPoint}
              </div>
            ) : (
              <Text type="secondary">-</Text>
            )}
          </div>
        );
      }
    },
    {
      title: "Assignee",
      dataIndex: "assignee",
      key: "assignee",
      width: 200,
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
                  member.position
                    .toLowerCase()
                    .includes(input.toLowerCase())
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
            style={{ cursor: "pointer" }}
            onClick={() =>
              setEditingField({ ticketId: record.id, field: "assignee" })
            }
          >
            <Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
              {name.charAt(0)}
            </Avatar>
            <Text>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      pinned: true,
      width: 150,
      render: (_: any, record: Ticket) => {
        const handleShare = () => {
          const url = `${window.location.origin}/public/tickets/${record.id}`;
          navigator.clipboard.writeText(url);
        };

        const content = (
          <div>
            <p>Public link copied to clipboard!</p>
          </div>
        );

        return (
          <Space>
            {/* Sprint Management Actions */}
            <Space>
              {context === 'backlog' && (
                <Tooltip title="Add to Sprint">
                  <Button
                    type="text"
                    icon={<PlusCircleOutlined style={{ color: '#52c41a' }} />}
                    onClick={(e) => { e.stopPropagation(); handleSprintAssignment(record.id, 'add'); }}
                  />
                </Tooltip>
              )}
              {context === 'active' && (
                <Tooltip title="Remove from Sprint">
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleSprintAssignment(record.id, 'remove'); }}
                  />
                </Tooltip>
              )}
            </Space>

            {/* Share Action with Popover */}
            <Popover content="Link copied!" trigger="click">
              <Tooltip title="Share Public Link">
                <Button
                  type="text"
                  icon={<ShareAltOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                />
              </Tooltip>
            </Popover>

            {/* Delete Action with Popconfirm */}
            <Popconfirm
              title="Delete Ticket"
              description="Are you sure you want to delete this ticket?"
              onConfirm={() => handleDeleteTicket(record)}
              onCancel={(e) => e?.stopPropagation()}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>

            {/* View Details */}
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={(e) => { e.stopPropagation(); handleViewTicket(record); }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Helper to get columns based on context
  const columns = getColumns('backlog'); // Fallback/Default


  // Show empty state if user has no projects
  if (!activeSprintLoading && !backlogLoading && !projectsLoading && projects.length === 0) {
    return (
      <div>
        {contextHolder}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Title level={3}>Tickets</Title>
          </Col>
        </Row>
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">
                  You are not a member of any projects yet.
                </Text>
                <br />
                <Text type="secondary">
                  Contact your project manager to be added to a project.
                </Text>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100%', padding: '16px 24px' }}>
      {contextHolder}
      {notifyContextHolder}

      {/* Premium Header Row - Sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        margin: '0 -24px 20px -24px',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Row justify="space-between" align="middle">
          <Col flex="1">
            <Space size={16} align="center" style={{ width: '100%' }}>
              {/* Project Switcher Group */}
              <Space size={4} align="center">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                  onClick={() => router.push('/projects/select?select=true')}
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  onClick={() => router.push('/projects/select?select=true')}
                  style={{
                    fontSize: 12,
                    color: '#8c8c8c',
                    fontWeight: 500,
                    padding: '0 4px',
                    height: 28
                  }}
                >
                  Switch Project
                </Button>
              </Space>

              <Divider type="vertical" style={{ height: 20, margin: 0, borderLeft: '1px solid #e8e8e8' }} />

              {/* Project Name & Code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                  {projectName}
                </Title>
                <Tag
                  bordered={false}
                  color="blue"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 4,
                    padding: '0 8px',
                    margin: 0
                  }}
                >
                  {projectCode}
                </Tag>
              </div>

              <Divider type="vertical" style={{ height: 20, margin: 0, borderLeft: '1px solid #e8e8e8' }} />

              {/* Search Field */}
              <Input
                placeholder="Search tickets..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                style={{
                  width: 240,
                  borderRadius: 8,
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #f0f0f0',
                  height: 36
                }}
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                allowClear
              />
            </Space>
          </Col>

          <Col>
            <Space size={8}>
              {/* Action Group */}
              <div style={{ backgroundColor: '#f5f5f5', padding: '4px', borderRadius: 8, display: 'flex' }}>
                <Tooltip title="Reload tickets">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => { refetchActive(); refetchBacklog(); }}
                    loading={(activeSprintLoading || backlogLoading) && !activeSprintLoading}
                    type="text"
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>
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
                  placement="bottomRight"
                  open={isFilterPopoverOpen}
                  onOpenChange={setIsFilterPopoverOpen}
                >
                  <Button
                    icon={<FilterOutlined />}
                    type="text"
                    style={{
                      borderRadius: 6,
                      backgroundColor: activeFilterCount > 0 ? '#e6f4ff' : 'transparent',
                      color: activeFilterCount > 0 ? '#1677ff' : '#595959'
                    }}
                  >
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                </Popover>
              </div>

              <Button
                type="primary"
                icon={showCreateForm ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
              >
                {showCreateForm ? "Close" : "Create"}
              </Button>

              <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />

              {/* View & Scope Switchers Row */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* View Mode Switcher */}
                <div style={{
                  backgroundColor: '#f5f5f5',
                  padding: '2px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #f0f0f0'
                }}>
                  <Radio.Group
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    buttonStyle="solid"
                    size="middle"
                    className="premium-switcher"
                  >
                    <Radio.Button
                      value="list"
                      style={{
                        borderRadius: 8,
                        border: 'none',
                        height: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: viewMode === 'list' ? 600 : 400,
                        transition: 'all 0.2s ease',
                        boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <BarsOutlined style={{ marginRight: 6 }} /> List
                    </Radio.Button>
                    <Radio.Button
                      value="board"
                      style={{
                        borderRadius: 8,
                        border: 'none',
                        height: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: viewMode === 'board' ? 600 : 400,
                        transition: 'all 0.2s ease',
                        boxShadow: viewMode === 'board' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <AppstoreOutlined style={{ marginRight: 6 }} /> Board
                    </Radio.Button>
                  </Radio.Group>
                </div>

                {(viewMode === 'board' || viewMode === 'list') && (
                  <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '2px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #f0f0f0'
                  }}>
                    <Radio.Group
                      value={kanbanScope}
                      onChange={(e) => {
                        const newScope = e.target.value as 'active' | 'backlog';
                        setKanbanScope(newScope);

                        // If in list view, auto-scroll to the section
                        if (viewMode === 'list') {
                          const sectionId = newScope === 'active' ? 'active-section' : 'backlog-section';
                          const element = document.getElementById(sectionId);
                          if (element) {
                            // Find the scrollable container (MainLayout Content area)
                            const scrollContainer = element.closest('.ant-layout-content');
                            const headerOffset = 100; // Account for sticky header

                            if (scrollContainer) {
                              const elementTop = element.getBoundingClientRect().top;
                              const containerTop = scrollContainer.getBoundingClientRect().top;
                              const scrollAmount = elementTop - containerTop - headerOffset;

                              scrollContainer.scrollBy({
                                top: scrollAmount,
                                behavior: 'smooth'
                              });
                            } else {
                              // Fallback for window scroll
                              const elementPosition = element.getBoundingClientRect().top;
                              const offsetPosition = elementPosition + window.scrollY - headerOffset;
                              window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                              });
                            }
                          }
                        }
                      }}
                      buttonStyle="solid"
                      size="middle"
                      className="premium-switcher"
                    >
                      <Radio.Button
                        value="active"
                        style={{
                          borderRadius: 8,
                          border: 'none',
                          height: 32,
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0 12px',
                          fontSize: 13,
                          fontWeight: kanbanScope === 'active' ? 600 : 400,
                          transition: 'all 0.2s ease',
                          boxShadow: kanbanScope === 'active' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                      >
                        Active
                      </Radio.Button>
                      <Radio.Button
                        value="backlog"
                        style={{
                          borderRadius: 8,
                          border: 'none',
                          height: 32,
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0 12px',
                          fontSize: 13,
                          fontWeight: kanbanScope === 'backlog' ? 600 : 400,
                          transition: 'all 0.2s ease',
                          boxShadow: kanbanScope === 'backlog' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                      >
                        Backlog
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                )}
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Inline Creation - Controlled Visibility */}
      <InlineCreateTicket
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onTicketCreated={() => {
          // Optimistic update handles the UI, no need to refetch immediately, but we can if we want to be safe
          // refetchActive(); 
          // refetchBacklog();
          setShowCreateForm(false);
        }}
        projectId={projectId}
        filters={filters}
        projects={projects}
        members={members}
      />

      {/* Tickets View (List or Board) */}
      {viewMode === 'list' ? (
        <>
          {/* Active Sprint Section */}
          {activeSprint && (
            (typeof activeSprint.project === 'string' ? activeSprint.project === projectId : activeSprint.project?.id === projectId)
          ) && (
              <div id="active-section" style={{ scrollMarginTop: '100px' }}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Space size={8}>
                        <Text style={{ fontSize: '16px', fontWeight: 600 }}>
                          {/* Backend stores sprint name in 'version' field */}
                          {activeSprint?.version || activeSprint?.name || 'Active Sprint'}
                        </Text>
                        <Badge count={activeTickets.length} showZero style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', border: 'none', fontSize: 11 }} />
                        <Tag color="green" bordered={false} style={{ borderRadius: '4px' }}>RUNNING</Tag>
                      </Space>
                      <Space>
                        {activeSprint?.status === 'active' && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={handleCompleteSprint}
                          >
                            Complete Sprint
                          </Button>
                        )}
                        <Text type="secondary" style={{ fontSize: '13px', fontWeight: 400 }}>
                          {activeSprint.startDate ? dayjs(activeSprint.startDate).format('MMM D') : 'TBD'}
                          {' - '}
                          {activeSprint.endDate ? dayjs(activeSprint.endDate).format('MMM D') : 'TBD'}
                        </Text>
                      </Space>
                    </div>
                  }
                  style={{ marginBottom: 20 }}
                  styles={{ body: { padding: 10 } }} // Remove padding to flush table with card
                >
                  <Table
                    columns={getColumns('active')}
                    dataSource={activeTickets}
                    rowKey="id"
                    loading={activeSprintLoading}
                    pagination={false}
                    scroll={{ x: 1200 }}

                  />
                </Card>
              </div>
            )}

          {/* Backlog Section */}
          <div id="backlog-section" style={{ scrollMarginTop: '100px' }}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Space size={8}>
                    <Text style={{ fontSize: '16px', fontWeight: 600 }}>Backlog</Text>
                    <Badge count={totalBacklog} showZero style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', border: 'none', fontSize: 11 }} />
                  </Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateSprintModalOpen(true)}
                  >
                    Create Sprint
                  </Button>
                </div>
              }
              styles={{ body: { padding: 10 } }}
            >
              <Table
                columns={getColumns('backlog')}
                dataSource={backlogTickets}
                rowKey="id"
                loading={backlogLoading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: totalBacklog,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} tickets`,
                  onChange: (page, pageSize) => {
                    setPagination({
                      current: page,
                      pageSize: pageSize || pagination.pageSize,
                    });
                  },
                }}
                scroll={{ x: 1200 }}

                locale={{
                  emptyText:
                    backlogTickets.length === 0 && !backlogLoading ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No backlog tickets found"
                      />
                    ) : undefined,
                }}
              />
            </Card>
          </div>
        </>
      ) : (
        <>
          {isKanbanLoading ? (
            <Card style={{ textAlign: 'center', padding: '40px' }}>
              <Space direction="vertical" size="large">
                <div style={{ fontSize: '48px' }}>⏳</div>
                <Text type="secondary">Loading Kanban board...</Text>
              </Space>
            </Card>
          ) : kanbanData ? (
            <>
              {isKanbanFetching && (
                <div style={{
                  position: 'fixed',
                  top: 70,
                  right: 20,
                  zIndex: 1000,
                  background: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  <Space>
                    <ReloadOutlined spin />
                    <Text type="secondary">Refreshing...</Text>
                  </Space>
                </div>
              )}
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
            </>
          ) : (
            <Card>
              <Empty description="No tickets found" />
            </Card>
          )}
        </>
      )}
      <TicketDetailDrawer
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketIds={allTicketIds}
        onNavigate={(id) => setSelectedTicketId(id)}
      />

      {/* Sprint Completion Modal */}
      <SprintCompletionModal
        sprintId={activeSprint?.id || null}
        open={sprintCompletionModalOpen}
        onClose={() => setSprintCompletionModalOpen(false)}
        onSuccess={handleSprintCompletionSuccess}
      />

      {/* Create Sprint Modal */}
      <Modal
        title={
          <Space direction="vertical" size={0}>
            <Text strong>Create New Sprint</Text>
            {activeSprint ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Will be created as "Planning" (draft sprint)
              </Text>
            ) : (
              <Text type="success" style={{ fontSize: 12 }}>
                Will become your active sprint immediately
              </Text>
            )}
          </Space>
        }
        open={createSprintModalOpen}
        onCancel={() => setCreateSprintModalOpen(false)}
        footer={null}
        width={500}
      >
        {activeSprint && (
          <Alert
            message="Creating Planning Sprint"
            description={`You have an active sprint (${activeSprint.version}). This new sprint will be created as a draft and can be started after completing the current sprint.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {!activeSprint && (
          <Alert
            message="Creating Active Sprint"
            description="No active sprint found. This sprint will become active immediately and you can start adding tickets to it."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <SprintCreationForm
          projectId={projectId}
          loading={creatingSprintLoading}
          onSubmit={handleCreateSprintFromBacklog}
          onCancel={() => setCreateSprintModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

