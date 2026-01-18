"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  
  // Sprint Completion Modal state
  const [sprintCompletionModalOpen, setSprintCompletionModalOpen] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<{
    ticketId: string;
    field: "status" | "assignee" | "title" | "priority" | "type" | "storyPoint";
  } | null>(null);

  // For hover effect on title
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);

  // Use cached global data hooks
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: members = [], isLoading: membersLoading } = useMembers();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // --- React Query Hooks ---

  // Prepare params for useTickets - always scoped to projectId
  const queryParams = {
    page: pagination.current,
    limit: pagination.pageSize,
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
  console.log("Active Sprint:", activeSprint);

  // Query Params for Active Sprint List
  const activeSprintParams = {
    ...queryParams,
    sprintId: 'active'
  };

  // Query Params for Backlog List
  const backlogParams = {
    ...queryParams,
    sprintId: 'null'
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
    // Refresh both ticket lists
    refetchActive();
    refetchBacklog();
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
      title: "Ticket",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 130,
      render: (text: string) => (
        <Text strong style={{ color: "#1677ff" }}>
          {text}
        </Text>
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
        const isHovered = hoveredTicketId === record.id;
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 22 }}
            onClick={() => setEditingField({ ticketId: record.id, field: "title" })}
            title={text} // Show full text on native tooltip as well
          >
            <Text ellipsis={{ tooltip: true }} style={{ flex: 1 }}>{displayText}</Text>
            {isHovered && <EditOutlined style={{ color: '#1677ff', opacity: 0.7 }} />}
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
              options={[
                { label: "Not Started", value: "not_started" },
                { label: "In Progress", value: "in_progress" },
                { label: "In Testing", value: "in_testing" },
                { label: "Completed", value: "completed" },
              ]}
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
      render: (_: any, record: Ticket) => (
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
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          />
          <Popconfirm
            title="Delete Ticket"
            description="Are you sure you want to delete this ticket?"
            onConfirm={() => handleDeleteTicket(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteTicketMutation.isPending && deleteTicketMutation.variables === record.id}
            >

            </Button>
          </Popconfirm>
        </Space>
      ),
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
    <div style={{ padding: 20 }}>
      {contextHolder}
      {notifyContextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
        <Col>
          <Space size="large">
            {/* Project Name with Back Button */}
            <Space size="small" className="items-center">
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/projects/select')}
                style={{ padding: '4px 0', height: 'auto' }}
              />
              <Title level={3} style={{ margin: 0 }}>{projectName}</Title>
              <Tag color="blue">{projectCode}</Tag>
            </Space>
            {/* Search in Top Bar */}
            <Input
              placeholder="Search requests..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              allowClear
            />
          </Space>
        </Col>
        <Col>
          <Space split={<Divider type="vertical" />}>
            {/* Action Buttons */}
            <Space>
              <Tooltip title="Refresh">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => { refetchActive(); refetchBacklog(); }}
                  loading={(activeSprintLoading || backlogLoading) && !activeSprintLoading}
                  type="text"
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
                <Button icon={<FilterOutlined />} type={activeFilterCount > 0 ? "primary" : "default"} ghost={activeFilterCount > 0}>
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Popover>

              <Button
                type={showCreateForm ? "primary" : "default"}
                icon={showCreateForm ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                Create
              </Button>
            </Space>

            {/* View Toggles */}
            <Space>
              {viewMode === 'board' && (
                <Radio.Group value={kanbanScope} onChange={(e) => setKanbanScope(e.target.value as 'active' | 'backlog')} buttonStyle="solid" size="middle">
                  <Radio.Button value="active">Active Sprint</Radio.Button>
                  <Radio.Button value="backlog">Backlog</Radio.Button>
                </Radio.Group>
              )}
              <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid" size="middle">
                <Radio.Button value="list"><BarsOutlined /> List</Radio.Button>
                <Radio.Button value="board"><AppstoreOutlined /> Board</Radio.Button>
              </Radio.Group>
            </Space>
          </Space>
        </Col>
      </Row>

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
          {/* Active Sprint Section */}
          {activeSprint && (
            (typeof activeSprint.project === 'string' ? activeSprint.project === projectId : activeSprint.project?.id === projectId)
          ) && (
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Space>
                      <Text style={{ fontSize: '16px', fontWeight: 600 }}>
                        {/* Backend stores sprint name in 'version' field */}
                        {activeSprint?.version || activeSprint?.name || 'Active Sprint'}
                      </Text>
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
                bodyStyle={{ padding: 10 }} // Remove padding to flush table with card
              >
                <Table
                  columns={getColumns('active')}
                  dataSource={activeTickets}
                  rowKey="id"
                  loading={activeSprintLoading}
                  pagination={false}
                  scroll={{ x: 1200 }}
                  onRow={(record) => {
                    return {
                      onMouseEnter: () => setHoveredTicketId(record.id),
                      onMouseLeave: () => setHoveredTicketId(null),
                    };
                  }}
                />
              </Card>
            )}

          {/* Backlog Section */}
          <Card title="Backlog" bodyStyle={{ padding: 10 }}>
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
              onRow={(record) => {
                return {
                  onMouseEnter: () => setHoveredTicketId(record.id),
                  onMouseLeave: () => setHoveredTicketId(null),
                };
              }}
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
      />

      {/* Sprint Completion Modal */}
      <SprintCompletionModal
        sprintId={activeSprint?.id || null}
        open={sprintCompletionModalOpen}
        onClose={() => setSprintCompletionModalOpen(false)}
        onSuccess={handleSprintCompletionSuccess}
      />
    </div>
  );
}

