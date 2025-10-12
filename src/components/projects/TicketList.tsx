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
  Tag,
  Avatar,
  Alert,
  Table,
  Empty,
  Progress,
  message,
  Modal,
} from "antd";
import {
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import TicketService, { Ticket } from "@/services/ticketService";
import { ProjectService } from "@/services/projectService";

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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
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
    field: "status" | "assignee";
  } | null>(null);
  const [members, setMembers] = useState<
    Array<{ value: string; label: string; position: string }>
  >([]);
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchTickets();
    fetchProjects();
    fetchMembers();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await TicketService.getTickets({
        page: 1,
        limit: 50,
        status: filters.status.length > 0 ? filters.status[0] : undefined,
        priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
        projectId: filters.project.length > 0 ? filters.project[0] : undefined,
        assigneeId:
          filters.assignee.length > 0 ? filters.assignee.join(",") : undefined,
        search: filters.search || undefined,
      });
      setTickets(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      message.error("Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

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
    field: "status" | "assignee",
    value: string
  ) => {
    // Add to updating set
    setUpdatingTickets((prev) => new Set(prev).add(ticketId));

    try {
      // Prepare update data
      const updateData: any = {};
      if (field === "status") {
        updateData.status = value;
      } else if (field === "assignee") {
        updateData.assignee = value;
      }

      // Update ticket
      await TicketService.updateTicket(ticketId, updateData);

      // Update local state optimistically
      setTickets((prevTickets) =>
        prevTickets.map((ticket) => {
          if (ticket.id === ticketId) {
            if (field === "status") {
              return { ...ticket, status: value };
            } else if (field === "assignee") {
              const member = members.find((m) => m.value === value);
              return {
                ...ticket,
                assignee: member
                  ? { id: value, name: member.label, email: "" }
                  : ticket.assignee,
              };
            }
          }
          return ticket;
        })
      );

      message.success(
        `${field === "status" ? "Status" : "Assignee"} updated successfully`
      );
      setEditingField(null);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      message.error(`Failed to update ${field}`);
      // Refresh to get correct data
      fetchTickets();
    } finally {
      // Remove from updating set
      setUpdatingTickets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
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

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
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

  const handleCreateTicket = () => {
    router.push("/projects/create");
  };

  const handleDeleteTicket = async(ticket: Ticket, event?: React.MouseEvent) => {
    console.log({ ticket });
    try {
      await TicketService.deleteTicket(ticket.id);
      message.success("Ticket deleted successfully");
      fetchTickets(); // Refresh the list
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
      width: 250,
      render: (text: string, record: Ticket) => (
        <div>
          <Text strong>{text}</Text>
          {/* <br /> */}
          {/* <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description.substring(0, 50)}...
          </Text> */}
        </div>
      ),
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
        const isUpdating = updatingTickets.has(record.id);

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
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_: any, record: any) => {
        const taskType = record?.type || "";
        if (!taskType) {
          return <Text type="secondary">-</Text>;
        }
        return <Tag color={getTaskTypeColor(taskType)}>{taskType}</Tag>;
      },
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
        const isUpdating = updatingTickets.has(record.id);
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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (createdAt: string) => (
        <Text type="secondary">{dayjs(createdAt).format("MMM DD, YYYY")}</Text>
      ),
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
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];
  console.log("Projects:", tickets);
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Tickets</Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTickets}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleCreateTicket}
              disabled
            >
              Create Ticket
            </Button>
          </Space>
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
            <Button type="primary" onClick={fetchTickets} loading={loading}>
              Apply Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tickets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} tickets`,
          }}
          scroll={{ x: 1000 }}
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
