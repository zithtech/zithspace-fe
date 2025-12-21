"use client";

import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Ticket } from "@/services/ticketService";
import { ProjectService } from "@/services/projectService";
import { useTickets, useUpdateTicket, useDeleteTicket } from "@/hooks/useTickets";
import { useTicketSocketEvents } from "@/hooks/useTicketSocketEvents";
import { InlineCreateTicket } from "./InlineCreateTicket";

const { Title, Text } = Typography;

interface FilterState {
  status: string[];
  priority: string[];
  project: string[];
  assignee: string[];
  search: string;
}

export default function TicketList() {
  const router = useRouter();
  const [modal, contextHolder] = Modal.useModal();
  
  // Local state for filters only
  const [projects, setProjects] = useState<
    Array<{ value: string; label: string; code: string }>
  >([]);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    project: [],
    assignee: [],
    search: "",
  });

  // Inline editing state
  const [editingField, setEditingField] = useState<{
    ticketId: string;
    field: "status" | "assignee" | "title" | "priority" | "type" | "storyPoint";
  } | null>(null);
  
  // For hover effect on title
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);

  const [members, setMembers] = useState<
    Array<{ value: string; label: string; position: string }>
  >([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // --- React Query Hooks ---

  // Prepare params for useTickets
  const queryParams = {
    page: pagination.current,
    limit: pagination.pageSize,
    status: filters.status.length > 0 ? filters.status[0] : undefined,
    priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
    projectId: filters.project.length > 0 ? filters.project[0] : undefined,
    assigneeId:
      filters.assignee.length > 0 ? filters.assignee.join(",") : undefined,
    search: filters.search || undefined,
  };

  const { 
    data: ticketData, 
    isLoading: loading, 
    isFetching: isRefetching,
    refetch 
  } = useTickets(queryParams);

  const updateTicketMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();

  // Enable live updates
  useTicketSocketEvents();

  const tickets = ticketData?.data || [];
  const totalTickets = ticketData?.pagination?.total || 0;

  // --- Effects ---

  useEffect(() => {
    fetchProjects();
    fetchMembers();
  }, []);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { MembersService } = await import("@/services/membersService");
      const membersData = await MembersService.getMembersForSelect();
      setMembers(membersData || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const handleUpdateTicket = async (
    ticketId: string,
    field: "status" | "assignee" | "title" | "priority" | "type" | "storyPoint",
    value: string | number | null
  ) => {
    try {
      // Prepare update data
      const updateData: any = {};
      if (field === "status") updateData.status = value;
      else if (field === "assignee") updateData.assignee = value;
      else if (field === "title") updateData.title = value;
      else if (field === "priority") updateData.priority = value;
      else if (field === "type") updateData.type = value; // OR taskType based on backend? Backend maps type->type usually
      else if (field === "storyPoint") updateData.storyPoint = value;

      // Use mutation
      await updateTicketMutation.mutateAsync({ id: ticketId, data: updateData });

      message.success(`${field} updated successfully`);
      setEditingField(null);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      message.error(`Failed to update ${field}`);
    }
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
    router.push(`/tickets/${ticket.id}`);
  };

  const handleDeleteTicket = async(ticket: Ticket, event?: React.MouseEvent) => {
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

  // Table columns
  const columns = [
    {
      title: "Ticket",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 100,
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

        return (
          <div 
             style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 22 }}
             onClick={() => setEditingField({ ticketId: record.id, field: "title" })}
          >
            <Text ellipsis={{ tooltip: true }} style={{ flex: 1 }}>{text}</Text>
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
                    <InputNumber
                        defaultValue={storyPoint}
                        autoFocus
                        onBlur={(e) => {
                            // Antd InputNumber onBlur targets input element, value might need manual retrieval or state
                            // Using onChange for InputNumber is better for value control, but for inline simple edit, 
                            // e.target.value is string.
                            const val = parseFloat(e.target.value);
                            handleUpdateTicket(record.id, "storyPoint", isNaN(val) ? null : val);
                        }}
                        onPressEnter={(e) => {
                             const val = parseFloat(e.currentTarget.value);
                             handleUpdateTicket(record.id, "storyPoint", isNaN(val) ? null : val);
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
      title: "Project",
      dataIndex: "project",
      key: "project",
      width: 150,
      render: (project: any) => {
        if (typeof project === "string") {
          return <Tag color="blue">{project}</Tag>;
        }
        return (
          <Tag color="blue">
            {project.name} ({project.code})
          </Tag>
        );
      },
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
      width: 120,
      render: (_: any, record: Ticket) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            View
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTicket(record)}
            loading={deleteTicketMutation.isPending && deleteTicketMutation.variables === record.id}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Show empty state if user has no projects
  if (!loading && projects.length === 0) {
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
    <div>
      {contextHolder}
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Tickets</Title>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Search tickets..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Status"
              style={{ width: "100%" }}
              value={filters.status}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
              options={[
                { label: "Not Started", value: "not_started" },
                { label: "In Progress", value: "in_progress" },
                { label: "In Testing", value: "in_testing" },
                { label: "Completed", value: "completed" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Priority"
              style={{ width: "100%" }}
              value={filters.priority}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, priority: value }))
              }
              options={[
                { label: "High (P1)", value: "P1" },
                { label: "Medium (P2)", value: "P2" },
                { label: "Lite (P3)", value: "P3" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Project"
              style={{ width: "100%" }}
              value={filters.project}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, project: value }))
              }
              options={projects.map((project) => ({
                label: project.label,
                value: project.value,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Assignee"
              style={{ width: "100%" }}
              value={filters.assignee}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, assignee: value }))
              }
              showSearch
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
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
             <Button 
               icon={<ReloadOutlined />} 
               onClick={() => refetch()} 
               loading={isRefetching && !loading}
             >
               Refresh
             </Button>
          </Col>
        </Row>
      </Card>

      {/* Inline Creation */}
      <InlineCreateTicket 
        filters={filters} 
        projects={projects} 
        members={members} 
      />

      {/* Tickets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: totalTickets,
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
          scroll={{ x: 1000 }}
          onRow={(record) => {
            return {
              onMouseEnter: () => setHoveredTicketId(record.id),
              onMouseLeave: () => setHoveredTicketId(null),
            };
          }}
          locale={{
            emptyText:
              tickets.length === 0 && !loading ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No tickets found for your projects"
                />
              ) : undefined,
          }}
        />
      </Card>
    </div>
  );
}
