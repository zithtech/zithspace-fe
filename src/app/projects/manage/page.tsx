"use client";

import React, { useState, useEffect } from "react";
import {
  App,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Popconfirm,
  Tag,
  DatePicker,
  Card,
  Row,
  Col,
  Tooltip,
  Avatar,
  Typography,
  message,
  Drawer,
  Progress,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
  CalendarOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  BarsOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import {
  ProjectService,
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectsFilters,
} from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import { useAuth } from "@/context/AuthContext";
import { RBAC } from "@/lib/rbac";
import MainLayout from "@/components/layout/MainLayout";
import { ColumnsType } from "antd/es/table";

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Member {
  value: string;
  label: string;
  position: string;

}

const ProjectsManagePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { notification, message: antMessage } = App.useApp();
  const [form] = Form.useForm();
  const router = useRouter();

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [viewMode, setViewMode] = useState<"card" | "table">("card");


  // Filters
  const [filters, setFilters] = useState<ProjectsFilters>({
    page: 1,
    limit: 10,
  });

  const renderPosition = (position: any) => {
    if (!position) return "";
    if (typeof position === 'string') return position;
    if (typeof position === 'object') {
      return position.title || position.name || "N/A";
    }
    return "";
  };

  // Load data
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.getProjects(filters);
      setProjects(response.data);
      console.log({ projects: response.data });
      setPagination({
        current: response.pagination.current,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total,
      });
    } catch (error) {
      message.error("Failed to load projects");
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const membersList = await MembersService.getMembersForSelect();
      setMembers(membersList);
    } catch (error) {
      message.error("Failed to load members");
      console.error("Error loading members:", error);
    }
  };

  useEffect(() => {
    loadProjects();
    loadMembers();
  }, [filters]);

  const glassStyle = {
    background: "var(--bg-pure-white)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    transition: "all 0.3s ease",
  };

  // Stats calculation
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    onHold: projects.filter((p) => p.status === "on-hold").length,
    completed: projects.filter((p) => p.status === "completed").length,
  };

  // Handle project manager change - automatically add to team members
  const handleProjectManagerChange = (projectManagerId: string) => {
    const teamMemberIds = form.getFieldValue("teamMemberIds") || [];

    if (projectManagerId && !teamMemberIds.includes(projectManagerId)) {
      // Add project manager to team members if not already included
      form.setFieldsValue({
        teamMemberIds: [...teamMemberIds, projectManagerId],
      });
    }
  };

  // Handle team members change - prevent removing project manager
  const handleTeamMembersChange = (selectedIds: string[]) => {
    const projectManagerId = form.getFieldValue("projectManagerId");

    if (projectManagerId && !selectedIds.includes(projectManagerId)) {
      // If project manager was removed, add them back
      message.warning("Project Manager must be included in the team");
      form.setFieldsValue({
        teamMemberIds: [...selectedIds, projectManagerId],
      });
    }
  };

  // Handle table pagination
  const handleTableChange = (pagination: any) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  // Handle project manager filter
  const handleProjectManagerFilter = (projectManager: string) => {
    setFilters((prev) => ({
      ...prev,
      projectManagerId: projectManager || undefined,
      page: 1,
    }));
  };

  // Handle date range filter
  const handleDateRangeFilter = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
        page: 1,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      }));
    }
  };

  // Handle create/edit project
  const handleSubmit = async (values: any) => {
    try {
      const projectData = {
        ...values,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        code: values.code || null,
        repositories: values.repositories || null,
      };

      if (editingProject) {
        await ProjectService.updateProject(
          editingProject.id,
          projectData as UpdateProjectData
        );
        notification.success({
          message: "Project Updated",
          description: `Project "${values.name}" has been successfully updated.`,
          placement: "topRight"
        });
      } else {
        await ProjectService.createProject(projectData as CreateProjectData);
        notification.success({
          message: "Project Created",
          description: `Project "${values.name}" has been successfully created.`,
          placement: "topRight"
        });
      }

      setDrawerVisible(false);
      setEditingProject(null);
      form.resetFields();
      loadProjects();
    } catch (error: any) {
      notification.error({
        message: "Operation Failed",
        description: error.message || "Failed to save project",
        placement: "topRight"
      });
    }
  };

  // Handle delete project
  const handleDelete = async (id: string) => {
    try {
      await ProjectService.deleteProject(id);
      notification.success({
        message: "Project Deleted",
        description: "The project has been permanently removed.",
        placement: "topRight"
      });
      loadProjects();
    } catch (error: any) {
      notification.error({
        message: "Deletion Failed",
        description: error.message || "Failed to delete project",
        placement: "topRight"
      });
    }
  };

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      startDate: dayjs(project.startDate),
      endDate: project.endDate ? dayjs(project.endDate) : null,
      projectManagerId: project.projectManager.id,
      teamMemberIds: project.members.map((member) => member.user.id),
    });
    setDrawerVisible(true);
  };

  // Handle add new
  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({
      status: "planning",
      defaultPriority: "medium",
    });
    setDrawerVisible(true);
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      planning: "blue",
      active: "green",
      "on-hold": "orange",
      completed: "purple",
      cancelled: "red",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "red",
      medium: "orange",
      low: "green",
    };
    return colors[priority as keyof typeof colors] || "default";
  };

  // Table columns
  const columns: ColumnsType<Project> = [
    {
      title: "Project",
      key: "project",
      width: 250,
      render: (_: any, record: any) => (
        <Space size={12}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--bg-pure-white)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid var(--border-color)"
          }}>
            <ProjectOutlined style={{ color: "#1677ff", fontSize: 16 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14 }}>{record.name}</Text>
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>{record.code}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: any) => (
        <Tag
          color={getStatusColor(status)}
          style={{
            borderRadius: 6,
            padding: "2px 10px",
            fontWeight: 600,
            fontSize: 11,
            textTransform: "uppercase",
            border: "none",
            margin: 0
          }}
        >
          {status.replace("-", " ")}
        </Tag>
      ),
    },
    {
      title: "Project Manager",
      key: "projectManager",
      width: 200,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Avatar
            size="small"
            src={record?.projectManager?.avatarUrl}
            style={{ backgroundColor: "rgba(245, 106, 0, 0.2)", border: "1px solid var(--border-color)" }}
          >
            {record?.projectManager?.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{record?.projectManager?.name}</div>
            <div style={{ fontSize: 11, color: "#8c8c8c" }}>
              {renderPosition(record.projectManager?.position)}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Team",
      key: "teamMembers",
      width: 130,
      render: (_: any, record: any) => (
        <Space size={4}>
          <TeamOutlined style={{ color: "#8c8c8c" }} />
          <Text style={{ fontSize: 13 }}>{record?.members?.length || 0} members</Text>
        </Space>
      ),
    },
    {
      title: "Priority",
      dataIndex: "defaultPriority",
      key: "defaultPriority",
      width: 120,
      render: (priority: any) => (
        <Tag
          color={getPriorityColor(priority)}
          style={{
            borderRadius: 6,
            padding: "2px 10px",
            fontWeight: 600,
            fontSize: 11,
            textTransform: "uppercase",
            border: "none",
            margin: 0
          }}
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      width: 180,
      render: (_: any, record: any) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 2 }}>
            <CalendarOutlined style={{ marginRight: 6, color: "var(--primary-color)", fontSize: 11 }} />
            <Text style={{ fontSize: 12 }}>{dayjs(record?.startDate).format("MMM DD, YYYY")}</Text>
          </div>
          {record.endDate && (
            <div>
              <CalendarOutlined style={{ marginRight: 6, color: "#8c8c8c", fontSize: 11 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(record?.endDate).format("MMM DD, YYYY")}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: 15 }} />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${record.id}/overview`);
              }}
            />
          </Tooltip>
          {user?.role &&
            RBAC.hasPermission(user.role as any, "projects", "update") && (
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 15 }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                />
              </Tooltip>
            )}
          {user?.role &&
            RBAC.hasPermission(user.role as any, "projects", "delete") && (
              <Popconfirm
                title="Delete project?"
                description="Are you sure you want to delete this project?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDelete(record.id);
                }}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 15 }} />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ];

  // Don't render if no user and not loading
  if (!user && !isLoading) {
    return null;
  }

  // Check permissions
  if (
    user &&
    (!user.role || !RBAC.hasPermission(user.role as any, "projects", "read"))
  ) {
    return (
      <MainLayout>
        <div style={{ padding: 20 }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="text-gray-500">
                You don't have permission to view projects.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
      <div style={{ padding: "16px", background: "transparent", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            {/* Left title */}
            <Space align="center" size={12}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "var(--bg-pure-white)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border-color)"
                }}
              >
                <ProjectOutlined style={{ fontSize: 22, color: "#1677ff" }} />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                  Projects Management
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Oversee and manage your organization's projects and teams
                </Text>
              </div>
            </Space>

            {/* Right controls */}
            <Space size={16}>
              {/* Card / List Toggle */}
              <div
                style={{
                  display: "flex",
                  background: "var(--bg-secondary)",
                  borderRadius: 10,
                  padding: 3,
                }}
              >
                {/* Card View Button */}
                <Button
                  type="text"
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("card")}
                  style={{
                    borderRadius: 8,
                    padding: "4px 16px",
                    fontWeight: 600,
                    height: 36,
                    background: viewMode === "card" ? "var(--bg-pure-white)" : "transparent",
                    color: viewMode === "card" ? "var(--primary-color)" : "var(--text-secondary)",
                    boxShadow: viewMode === "card" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  Card
                </Button>

                {/* Table View Button */}
                <Button
                  type="text"
                  icon={<BarsOutlined />}
                  onClick={() => setViewMode("table")}
                  style={{
                    borderRadius: 8,
                    padding: "4px 16px",
                    fontWeight: 600,
                    height: 36,
                    background: viewMode === "table" ? "var(--bg-pure-white)" : "transparent",
                    color: viewMode === "table" ? "var(--primary-color)" : "var(--text-secondary)",
                    boxShadow: viewMode === "table" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  List
                </Button>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{
                  height: 42,
                  padding: "0 20px",
                  borderRadius: 10,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(22, 119, 255, 0.2)"
                }}
              >
                Add Project
              </Button>
            </Space>
          </Space>
        </div>

        {/* Stats Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ ...glassStyle, background: "var(--bg-pure-white)" }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "var(--bg-pure-white)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--border-color)"
                }}>
                  <ProjectOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Total Projects</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{stats.total}</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ ...glassStyle, background: "var(--bg-pure-white)" }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(82, 196, 26, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#52c41a" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Active</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{stats.active}</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ ...glassStyle, background: "var(--bg-pure-white)" }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(250, 173, 20, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#faad14" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>On Hold</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{stats.onHold}</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ ...glassStyle, background: "var(--bg-pure-white)" }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(114, 46, 209, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#722ed1" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Completed</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{stats.completed}</Title>
                </div>
              </div>
            </Card>
          </Col>
        </Row>



        {/* Filters & All Projects Section */}
        <div style={{
          marginBottom: 16,
          padding: "16px 0px",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between"
        }}>
          {/* All Projects Text - Left Aligned */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 4, height: 18, background: "#1677ff", borderRadius: 2 }} />
            <Text strong style={{ fontSize: 16, color: "#1f1f1f", whiteSpace: "nowrap" }}>
              All Projects
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
              ({projects.length})
            </Text>
          </div>

          {/* Filters Group - Right Aligned */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Input
              placeholder="Search projects..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 260, height: 40, borderRadius: 10 }}
              allowClear
            />

            <Select
              placeholder="Status"
              value={filters.status}
              onChange={handleStatusFilter}
              style={{ width: 160, height: 40 }}
              allowClear
              styles={{ popup: { root: { borderRadius: 12 } } }}
            >
              <Option value="planning">Planning</Option>
              <Option value="active">Active</Option>
              <Option value="on-hold">On Hold</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>

            <Select
              placeholder="Project Manager"
              value={filters.projectManagerId}
              onChange={handleProjectManagerFilter}
              style={{ width: 220, height: 40 }}
              allowClear
              showSearch
              styles={{ popup: { root: { borderRadius: 12 } } }}
              filterOption={(input, option) => {
                const member = members.find((m) => m.value === option?.value);
                return member
                  ? String(member.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                  String(member.position ?? "").toLowerCase().includes(input.toLowerCase())
                  : false;
              }}
            >
              {members.map((member) => (
                <Option key={member.value} value={member.value}>
                  {member.label}
                </Option>
              ))}
            </Select>

            <RangePicker
              placeholder={["Start", "End"]}
              onChange={handleDateRangeFilter}
              style={{ width: 240, height: 40, borderRadius: 10 }}
            />

            {(filters.search || filters.status || filters.projectManagerId || filters.startDate) && (
              <Button
                type="text"
                danger
                onClick={() => setFilters({ page: 1, limit: 10 })}
                style={{ fontWeight: 500 }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>


        {/* Projects Card View - DASHBOARD STYLE */}
        {viewMode === "card" ? (
          <Row gutter={[24, 24]}>
            {loading
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                <Col xs={24} sm={12} lg={8} xl={8} key={i}>
                  <Card
                    loading
                    style={{
                      height: 240,
                      ...glassStyle,
                      borderRadius: 16,
                    }}
                  />
                </Col>
              ))
              : projects.map((project) => {
                const memberCount = project.members?.length || 0;

                return (
                  <Col xs={24} sm={12} lg={8} xl={8} key={project.id}>
                    <Card
                      hoverable
                      onClick={() => router.push(`/projects/${project.id}/overview`)}
                      style={{
                        ...glassStyle,
                        height: "100%",
                        overflow: "hidden",
                        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      styles={{ body: { padding: 0 } }}
                    >
                      <div style={{ padding: "16px 20px" }}>
                        {/* Top Section: Status at top right */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: "rgba(22, 119, 255, 0.1)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <ProjectOutlined style={{ color: "#1677ff", fontSize: 16 }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                              <Text strong style={{ fontSize: 15, display: "block" }} ellipsis>
                                {project.name}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {project.code || "No code"}
                              </Text>
                            </div>
                          </div>
                          <Tag
                            color={getStatusColor(project.status)}
                            style={{
                              margin: 0,
                              borderRadius: 4,
                              padding: "1px 8px",
                              fontWeight: 600,
                              fontSize: 10,
                              textTransform: "uppercase",
                              border: "none",
                              alignSelf: "flex-start"
                            }}
                          >
                            {project.status.replace("-", " ")}
                          </Tag>
                        </div>

                        {/* Description - more compact */}
                        <div style={{ marginBottom: 16 }}>
                          <Typography.Paragraph
                            type="secondary"
                            style={{ fontSize: 12, marginBottom: 0, lineHeight: "1.4" }}
                            ellipsis={{ rows: 2 }}
                          >
                            {project.description || "No description provided."}
                          </Typography.Paragraph>
                        </div>

                        {/* Priority and Date - Row style */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: getPriorityColor(project.defaultPriority) === 'red' ? '#ff4d4f' :
                                getPriorityColor(project.defaultPriority) === 'orange' ? '#faad14' : '#52c41a',
                            }} />
                            <Text style={{ fontSize: 11, textTransform: "capitalize", color: "#595959" }}>
                              {project.defaultPriority} Priority
                            </Text>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {dayjs(project.startDate).format("MMM DD")}
                            </Text>
                          </div>
                        </div>

                        {/* Manager and Team - Thin Border Top */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: 12,
                          borderTop: "1px solid #f0f0f0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Avatar size={20} style={{ background: "#f56a00", fontSize: 10 }}
                              src={project.projectManager?.avatarUrl}
                            >

                              {project.projectManager?.name.charAt(0)}
                            </Avatar>
                            <Text style={{ fontSize: 12, fontWeight: 500 }}>
                              {project.projectManager?.name.split(' ')[0]}
                            </Text>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <TeamOutlined style={{ color: "#8c8c8c", fontSize: 11 }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {memberCount} members
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions (Hover only or subtle) */}
                      <div style={{
                        padding: "10px 24px",
                        background: "rgba(0,0,0,0.01)",
                        borderTop: "1px solid rgba(0,0,0,0.04)",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8
                      }}>
                        {user?.role && RBAC.hasPermission(user.role as any, "projects", "update") && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(project);
                            }}
                          />
                        )}
                        {user?.role && RBAC.hasPermission(user.role as any, "projects", "delete") && (
                          <Popconfirm
                            title="Delete project?"
                            description="Are you sure you want to delete this project?"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDelete(project.id);
                            }}
                            okText="Yes"
                            cancelText="No"
                            placement="topRight"
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        )}
                        <Button
                          type="text"
                          size="small"
                          icon={<ArrowRightOutlined style={{ fontSize: 14 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${project.id}/overview`);
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                );
              })}
          </Row>
        ) : (
          /* ===== TABLE VIEW ===== */
          <Card size="small">
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} projects`,
              }}
              scroll={{ x: 1200 }}
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => {
                  router.push(`/projects/${record.id}/overview`);
                },
              })}
            />
          </Card>
        )}

        {/* Create/Edit Project Drawer */}
        <Drawer
          title={null}
          open={drawerVisible}
          onClose={() => {
            setDrawerVisible(false);
            setEditingProject(null);
            form.resetFields();
          }}
          width={650}
          closable={false}
          maskClosable={true}
          styles={{
            body: { padding: 0 },
            header: { display: "none" }
          }}
        >
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Drawer Header */}
            <div style={{
              padding: "24px 32px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "transparent",
              position: "sticky",
              top: 0,
              zIndex: 10
            }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {editingProject ? "Edit Project" : "Create New Project"}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {editingProject ? `Update details for ${editingProject.name}` : "Set up a new workspace for your team"}
                </Text>
              </div>
              <Space>
                <Button
                  onClick={() => {
                    setDrawerVisible(false);
                    setEditingProject(null);
                    form.resetFields();
                  }}
                  style={{ borderRadius: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  style={{ borderRadius: 8 }}
                >
                  {editingProject ? "Save Changes" : "Create Project"}
                </Button>
              </Space>
            </div>

            {/* Drawer Form Content */}
            <div style={{ padding: "32px", flex: 1, overflowY: "auto" }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  status: "planning",
                  defaultPriority: "medium",
                }}
                requiredMark="optional"
              >
                {/* Section: Basic Information */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 4, height: 18, background: '#1677ff', borderRadius: 2 }} />
                    <Title level={5} style={{ margin: 0 }}>Basic Information</Title>
                  </div>

                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item
                        name="name"
                        label="Project Name"
                        rules={[
                          { required: true, message: "Please enter project name" },
                          { min: 2, message: "Name must be at least 2 characters" },
                        ]}
                      >
                        <Input placeholder="e.g. Website Redesign" size="large" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="code"
                        label="Project Code"
                        rules={[{ required: true, message: "Please enter code" }]}
                      >
                        <Input placeholder="e.g. WEB" size="large" style={{ borderRadius: 8, textTransform: 'uppercase' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="status"
                        label="Project Status"
                        rules={[{ required: true, message: "Please select status" }]}
                      >
                        <Select placeholder="Select status" size="large" style={{ borderRadius: 8 }}>
                          <Option value="planning">Planning</Option>
                          <Option value="active">Active</Option>
                          <Option value="on-hold">On Hold</Option>
                          <Option value="completed">Completed</Option>
                          <Option value="cancelled">Cancelled</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="description"
                        label="Project Description"
                        rules={[{ required: true, message: "Please enter description" }]}
                      >
                        <Input.TextArea
                          rows={4}
                          placeholder="What is this project about?"
                          style={{ borderRadius: 8 }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Divider style={{ margin: "32px 0" }} />

                {/* Section: Team & Responsibility */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 4, height: 18, background: '#52c41a', borderRadius: 2 }} />
                    <Title level={5} style={{ margin: 0 }}>Team & Responsibility</Title>
                  </div>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="projectManagerId"
                        label="Project Manager"
                        rules={[{ required: true, message: "Please select manager" }]}
                      >
                        <Select
                          placeholder="Select lead"
                          size="large"
                          onChange={handleProjectManagerChange}
                          showSearch
                          style={{ borderRadius: 8 }}
                          filterOption={(input, option) => {
                            const member = members.find((m) => m.value === option?.value);
                            return member ? String(member.label ?? "").toLowerCase().includes(input.toLowerCase()) : false;
                          }}
                        >
                          {members.map((member) => (
                            <Option key={member.value} value={member.value}>
                              {member.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="defaultPriority"
                        label="Default Priority"
                        rules={[{ required: true, message: "Please select priority" }]}
                      >
                        <Select placeholder="Priority" size="large" style={{ borderRadius: 8 }}>
                          <Option value="high">High</Option>
                          <Option value="medium">Medium</Option>
                          <Option value="low">Low</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="teamMemberIds"
                        label="Team Members"
                        help="Project Manager is automatically included"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Add contributors"
                          size="large"
                          onChange={handleTeamMembersChange}
                          showSearch
                          style={{ borderRadius: 8 }}
                          filterOption={(input, option) => {
                            const member = members.find((m) => m.value === option?.value);
                            return member ? member.label.toLowerCase().includes(input.toLowerCase()) : false;
                          }}
                        >
                          {members.map((member) => (
                            <Option key={member.value} value={member.value}>
                              {member.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Divider style={{ margin: "32px 0" }} />

                {/* Section: Timeline & Resources */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 4, height: 18, background: '#faad14', borderRadius: 2 }} />
                    <Title level={5} style={{ margin: 0 }}>Timeline & Resources</Title>
                  </div>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="startDate"
                        label="Estimated Start"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <DatePicker size="large" style={{ width: "100%", borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="endDate" label="Estimated Completion">
                        <DatePicker size="large" style={{ width: "100%", borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="repositories" label="Repository URL (Optional)">
                        <Input placeholder="e.g. https://github.com/org/repo" size="large" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Form>
            </div>
          </div>
        </Drawer>
        {/* <Button
          block
          style={{ height: 44, borderRadius: 10, fontWeight: 600 }}
          onClick={() => setViewDrawerOpen(false)}
        >
          Close
        </Button> */}
      </div>




    </MainLayout >
  );
};

export default ProjectsManagePage;
