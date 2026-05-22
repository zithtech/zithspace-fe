"use client";

import React, { Suspense, useState, useEffect } from "react";
import {
  App,
  Table,
  Button,
  Input,
  Select,
  Space,
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
  Divider,
  Segmented,
  Empty,
  theme as antdTheme,
  ConfigProvider,
} from "antd";
import { useSearchParams } from "next/navigation";
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
  ArrowRightOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  FolderKanban,
  Rocket,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";
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
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import { useTheme } from "@/context/ThemeContext";
import { ColumnsType } from "antd/es/table";
import { ProjectFormDrawer } from "@/components/projects/ProjectFormDrawer";

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

/* -------------------------------------------------------------------------- */
/*                              Premium StatCard                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<any>;
  accent: string;
  subtle?: string;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  accent,
  subtle,
  chart,
}) => (
  <div className="pm-stat-card" style={{ ["--pm-accent" as any]: accent }}>
    <div className="pm-stat-head">
      <div
        className="pm-stat-icon"
        style={{
          background: `${accent}12`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        <Icon size={16} color={accent} />
      </div>
      <Text className="pm-stat-label">{label}</Text>
      <div className="pm-stat-value-wrap">
        <span className="pm-stat-value">{value}</span>
      </div>
    </div>
    {subtle && <Text className="pm-stat-subtle">{subtle}</Text>}
    {chart && <div className="pm-stat-chart">{chart}</div>}
    <span
      className="pm-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="pm-minibar">
      <div className="pm-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="pm-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="pm-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="pm-minibar-legend-item">
            <span className="pm-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// The original component code
const ProjectsManageContent: React.FC = () => {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const { notification, message } = App.useApp();
  const [form] = Form.useForm();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { canReadProject, canCreateProject, canUpdateProject, canDeleteProject } = usePermission();
  const router = useRouter();
  const searchParams = useSearchParams();


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

  useEffect(() => {
    const handleEditFromQuery = async () => {
      const editId = searchParams.get("edit");
      if (!editId) return;

      // If projects are still loading, wait
      if (loading) return;

      // Try to find in current list
      const projectToEdit = projects.find((p) => p.id === editId);
      if (projectToEdit) {
        handleEdit(projectToEdit);
        // Clear param to avoid re-triggering
        router.replace("/projects/manage");
      } else if (projects.length > 0) {
        // If not in list, fetch it specifically
        try {
          const specificProject = await ProjectService.getProject(editId);
          if (specificProject) {
            handleEdit(specificProject);
            // Clear param to avoid re-triggering
            router.replace("/projects/manage");
          }
        } catch (error) {
          console.error("Failed to fetch project for editing:", error);
          message.error("Could not find the project to edit");
        }
      }
    };

    handleEditFromQuery();
  }, [searchParams, projects, loading]);

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

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDrawerVisible(true);
  };

  // Handle add new
  const handleAdd = () => {
    setEditingProject(null);
    setDrawerVisible(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await ProjectService.deleteProject(id);
      message.success("Project deleted successfully");
      loadProjects();
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      message.error(error.message || "Failed to delete project");
    } finally {
      setLoading(false);
    }
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
      title: "Client",
      key: "clients",
      width: 200,
      render: (_: any, record: any) => {
        const clients: { id: string; companyName: string; clientCode: string | null }[] =
          record?.clients || [];
        if (clients.length === 0) {
          return (
            <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
              —
            </Text>
          );
        }
        if (clients.length === 1) {
          const c = clients[0];
          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.companyName}</div>
              {c.clientCode && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#8c8c8c",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {c.clientCode}
                </div>
              )}
            </div>
          );
        }
        // Multiple clients — show first + "+N more"
        const [first, ...rest] = clients;
        return (
          <Tooltip
            title={
              <div style={{ fontSize: 12 }}>
                {clients.map((c) => (
                  <div key={c.id}>
                    {c.companyName}
                    {c.clientCode ? ` · ${c.clientCode}` : ""}
                  </div>
                ))}
              </div>
            }
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {first.companyName}
              </div>
              <div
                style={{
                  marginTop: 2,
                  display: "inline-block",
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "1px 7px",
                  background: "#f5f3ff",
                  border: "1px solid #ddd6fe",
                  color: "#6d28d9",
                  borderRadius: 999,
                }}
              >
                +{rest.length} more
              </div>
            </div>
          </Tooltip>
        );
      },
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
          {canUpdateProject && (
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
          {canDeleteProject && (
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
    !canReadProject
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


  const activePct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const onHoldPct = stats.total > 0 ? Math.round((stats.onHold / stats.total) * 100) : 0;
  const completedPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const hasActiveFilters = !!(filters.search || filters.status || filters.projectManagerId || filters.startDate);

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* Premium Header */}
        <TimeTrackingHeader
          icon={<ApartmentOutlined style={{ fontSize: 18, color: "var(--premium-blue)" }} />}
          title="Projects Management"
          description="Oversee and orchestrate every initiative across your organization"
          style={{
            padding: '10.5px 32px',
            borderBottom: '1px solid var(--border-slate-200)',
            marginBottom: 20,
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "var(--bg-pure-white)"
          }}
          extra={
            <Space size={10} align="center">
              <Tooltip title="Refresh view">
                <Button
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={async () => {
                    setIsRefreshing(true);
                    await loadProjects();
                    setIsRefreshing(false);
                    message.success("Projects view synchronized");
                  }}
                  loading={loading}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    borderColor: "var(--border-color)"
                  }}
                />
              </Tooltip>
              <Segmented
                value={viewMode}
                onChange={(v) => setViewMode(v as "card" | "table")}
                options={[
                  { label: "Card", value: "card", icon: <AppstoreOutlined style={{ fontSize: 12 }} /> },
                  { label: "List", value: "table", icon: <BarsOutlined style={{ fontSize: 12 }} /> },
                ]}
                className="saas-segmented-premium"
              />
              {canCreateProject && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  Add Project
                </Button>
              )}
            </Space>
          }
        />

        <div style={{ padding: "0 32px 32px" }}>

          {/* Stats Row */}
          <div className="pm-stat-grid">
            <StatCard
              label="Total Projects"
              value={stats.total}
              icon={FolderKanban}
              accent="#3b82f6"
              subtle="Across all statuses"
              chart={
                stats.total > 0 ? (
                  <MiniBar
                    segments={[
                      { value: stats.active, color: "#10b981", label: `${stats.active} active` },
                      { value: stats.onHold, color: "#f59e0b", label: `${stats.onHold} on hold` },
                      { value: stats.completed, color: "#8b5cf6", label: `${stats.completed} completed` },
                    ]}
                  />
                ) : null
              }
            />
            <StatCard
              label="Active"
              value={stats.active}
              icon={Rocket}
              accent="#10b981"
              subtle={stats.total > 0 ? `${activePct}% of total` : "No projects yet"}
              chart={
                stats.total > 0 ? (
                  <div className="pm-progress-row">
                    <div className="pm-progress-track">
                      <span
                        className="pm-progress-fill"
                        style={{
                          width: `${activePct}%`,
                          background: "linear-gradient(90deg, #10b981, #34d399)",
                        }}
                      />
                    </div>
                    <span className="pm-progress-label">{activePct}%</span>
                  </div>
                ) : null
              }
            />
            <StatCard
              label="On Hold"
              value={stats.onHold}
              icon={PauseCircle}
              accent="#f59e0b"
              subtle={stats.total > 0 ? `${onHoldPct}% of total` : "No projects yet"}
              chart={
                stats.total > 0 ? (
                  <div className="pm-progress-row">
                    <div className="pm-progress-track">
                      <span
                        className="pm-progress-fill"
                        style={{
                          width: `${onHoldPct}%`,
                          background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        }}
                      />
                    </div>
                    <span className="pm-progress-label">{onHoldPct}%</span>
                  </div>
                ) : null
              }
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              accent="#8b5cf6"
              subtle={stats.total > 0 ? `${completedPct}% of total` : "No projects yet"}
              chart={
                stats.total > 0 ? (
                  <div className="pm-progress-row">
                    <div className="pm-progress-track">
                      <span
                        className="pm-progress-fill"
                        style={{
                          width: `${completedPct}%`,
                          background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                        }}
                      />
                    </div>
                    <span className="pm-progress-label">{completedPct}%</span>
                  </div>
                ) : null
              }
            />
          </div>

          {/* Filter / All Projects Bar */}
          <div style={{
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: 12,
            background: "var(--bg-secondary, #f8fafc)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 16, background: "var(--premium-blue)", borderRadius: 2 }} />
              <Text strong style={{ fontSize: 14, fontWeight: 700, color: "var(--text-slate-900)", letterSpacing: "-0.01em" }}>
                All Projects
              </Text>
              <span style={{
                padding: "1px 8px",
                borderRadius: 999,
                background: "var(--bg-blue-50)",
                color: "var(--premium-blue)",
                border: "1px solid var(--border-blue-200)",
                fontSize: 11,
                fontWeight: 700,
              }}>
                {projects.length}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Input
                placeholder="Search projects..."
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="saas-input"
                style={{ width: 240, height: 36, borderRadius: 8, background: 'transparent' }}
                allowClear
              />
              <Select
                placeholder="Status"
                value={filters.status}
                onChange={handleStatusFilter}
                style={{ width: 150, height: 36 }}
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
                style={{ width: 200, height: 36 }}
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
                style={{ width: 220, height: 36, borderRadius: 8 }}
              />
              {hasActiveFilters && (
                <Button
                  type="text"
                  danger
                  onClick={() => setFilters({ page: 1, limit: 10 })}
                  style={{ fontWeight: 600, height: 36 }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>


          {/* Projects Card View - DASHBOARD STYLE */}
          {viewMode === "card" ? (
            projects.length === 0 && !loading ? (
              <div style={{
                padding: "64px 24px",
                borderRadius: 16,
                border: "1px dashed var(--border-color)",
                textAlign: "center",
                background: "var(--bg-pure-white)",
              }}>
                <Empty
                  description={
                    <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>
                      {hasActiveFilters ? "No projects match your filters" : "No projects yet — create your first one"}
                    </Text>
                  }
                >
                  {!hasActiveFilters && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAdd}
                      style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                      Add Project
                    </Button>
                  )}
                </Empty>
              </div>
            ) : (
              <Row gutter={[20, 20]}>
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
                    const statusColorMap: Record<string, string> = {
                      planning: "#3b82f6",
                      active: "#10b981",
                      "on-hold": "#f59e0b",
                      completed: "#8b5cf6",
                      cancelled: "#ef4444",
                    };
                    const accentColor = statusColorMap[project.status] || "#3b82f6";
                    const priorityColor =
                      project.defaultPriority === "high" ? "#ef4444" :
                        project.defaultPriority === "medium" ? "#f59e0b" : "#10b981";

                    let progress = 0;
                    if (project.startDate && project.endDate) {
                      const start = dayjs(project.startDate);
                      const end = dayjs(project.endDate);
                      const total = end.diff(start, "day");
                      const elapsed = dayjs().diff(start, "day");
                      if (total > 0) progress = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
                    }
                    if (project.status === "completed") progress = 100;



                    return (
                      <Col xs={24} sm={12} lg={8} xl={8} key={project.id}>
                        <Card
                          onClick={() => router.push(`/projects/${project.id}/overview`)}
                          style={{
                            ...glassStyle,
                            height: "100%",
                            overflow: "hidden",
                            position: "relative",
                            cursor: "pointer",
                            transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                            border: "1px solid var(--border-color)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.06)";
                            e.currentTarget.style.borderColor = "var(--border-blue-200)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = "var(--border-color)";
                          }}
                          styles={{ body: { padding: 0 } }}
                        >
                          <div style={{ padding: "18px 20px 14px" }}>
                            {/* Top: icon + name + status pill */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                              <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: 10,
                                  background: `${accentColor}12`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  <Text style={{ color: accentColor, fontWeight: 700, fontSize: 11, letterSpacing: "0.02em" }}>
                                    {(project.code || project.name).slice(0, 3).toUpperCase()}
                                  </Text>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text strong style={{ fontSize: 14.5, display: "block", color: "var(--text-slate-900)", letterSpacing: "-0.01em" }} ellipsis>
                                    {project.name}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>
                                    #{project.code || "—"}
                                  </Text>
                                </div>
                              </div>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: `${accentColor}10`,
                                flexShrink: 0,
                              }}>
                                <span style={{
                                  width: 5, height: 5, borderRadius: "50%",
                                  background: accentColor,
                                }} />
                                <Text style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: accentColor,
                                  textTransform: "capitalize",
                                  letterSpacing: "0.02em",
                                }}>
                                  {project.status.replace("-", " ")}
                                </Text>
                              </div>
                            </div>

                            {/* Description */}
                            <Typography.Paragraph
                              style={{ fontSize: 12.5, color: "var(--text-slate-500)", marginBottom: 14, lineHeight: 1.5, minHeight: 36 }}
                              ellipsis={{ rows: 2 }}
                            >
                              {project.description || "No description provided."}
                            </Typography.Paragraph>

                            {/* Progress */}
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-slate-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  Timeline
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: 600, color: "var(--text-slate-600)" }}>
                                  {progress}%
                                </Text>
                              </div>
                              <div style={{
                                height: 4,
                                borderRadius: 999,
                                background: "var(--bg-secondary, #f1f5f9)",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${progress}%`,
                                  height: "100%",
                                  background: accentColor,
                                  opacity: 0.85,
                                  borderRadius: 999,
                                  transition: "width 0.4s ease",
                                }} />
                              </div>
                            </div>

                            {/* Priority + dates */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: priorityColor }} />
                                <Text style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-slate-600)", textTransform: "capitalize" }}>
                                  {project.defaultPriority}
                                </Text>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <CalendarOutlined style={{ fontSize: 11, color: "var(--text-slate-400)" }} />
                                <Text style={{ fontSize: 11, color: "var(--text-slate-500)", fontWeight: 500 }}>
                                  {dayjs(project.startDate).format("MMM DD")}
                                  {project.endDate && ` → ${dayjs(project.endDate).format("MMM DD")}`}
                                </Text>
                              </div>
                            </div>

                            {/* Manager + team avatars */}
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingTop: 12,
                              borderTop: "1px solid var(--border-color)",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <Avatar
                                  size={26}
                                  src={project.projectManager?.avatarUrl}
                                  style={{
                                    background: "var(--bg-secondary, #f1f5f9)",
                                    color: "var(--text-slate-600)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    border: "1px solid var(--border-color)",
                                  }}
                                >
                                  {project.projectManager?.name?.charAt(0)}
                                </Avatar>
                                <div style={{ minWidth: 0 }}>
                                  <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-900)", display: "block", lineHeight: 1.2 }} ellipsis>
                                    {project.projectManager?.name?.split(" ")[0] || "Unassigned"}
                                  </Text>
                                  <Text style={{ fontSize: 10, color: "var(--text-slate-400)", fontWeight: 500 }}>
                                    Project Lead
                                  </Text>
                                </div>
                              </div>
                              <Tooltip title={`${memberCount} members`}>
                                <Avatar.Group
                                  max={{ count: 3, style: { background: "var(--bg-secondary, #f1f5f9)", color: "var(--text-slate-600)", fontSize: 10, fontWeight: 600, border: "2px solid var(--bg-pure-white)" } }}
                                  size={24}
                                >
                                  {(project.members || []).slice(0, 4).map((m: any, idx: number) => (
                                    <Avatar
                                      key={m.user?.id || idx}
                                      src={m.user?.avatarUrl}
                                      style={{
                                        background: ["#94a3b8", "#a3a3a3", "#cbd5e1", "#9ca3af"][idx % 4],
                                        fontSize: 10,
                                        fontWeight: 600,
                                        border: "2px solid var(--bg-pure-white)",
                                      }}
                                    >
                                      {m.user?.name?.charAt(0) || "?"}
                                    </Avatar>
                                  ))}
                                </Avatar.Group>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Footer actions */}
                          <div style={{
                            padding: "8px 16px",
                            borderTop: "1px solid var(--border-color)",
                            background: "var(--bg-secondary, #fafbfc)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                            <Text style={{ fontSize: 11, color: "var(--text-slate-500)", fontWeight: 600 }}>
                              <TeamOutlined style={{ marginRight: 4 }} />
                              {memberCount} {memberCount === 1 ? "member" : "members"}
                            </Text>
                            <Space size={4}>
                              {canUpdateProject && (
                                <Tooltip title="Edit">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined style={{ color: "var(--premium-blue)" }} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(project);
                                    }}
                                  />
                                </Tooltip>
                              )}
                              {canDeleteProject && (
                                <Popconfirm
                                  title="Delete project?"
                                  onConfirm={(e) => {
                                    e?.stopPropagation();
                                    handleDelete(project.id);
                                  }}
                                  okText="Yes"
                                  cancelText="No"
                                >
                                  <Tooltip title="Delete">
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </Tooltip>
                                </Popconfirm>
                              )}
                              <Tooltip title="Open">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<ArrowRightOutlined style={{ fontSize: 13, color: "var(--premium-blue)" }} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/projects/${project.id}/overview`);
                                  }}
                                />
                              </Tooltip>
                            </Space>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
              </Row>
            )
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
          <ProjectFormDrawer
            visible={drawerVisible}
            onClose={() => {
              setDrawerVisible(false);
              setEditingProject(null);
            }}
            project={editingProject}
            onSuccess={loadProjects}
          />

        </div>
      </div>

      <style jsx global>{`
        .pm-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 1100px) {
          .pm-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 600px) {
          .pm-stat-grid { grid-template-columns: 1fr; }
        }
        .pm-stat-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 14px;
          padding: 14px 16px 14px;
          overflow: hidden;
          transition: transform .25s cubic-bezier(.2,.8,.2,1),
                      box-shadow .25s cubic-bezier(.2,.8,.2,1),
                      border-color .25s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .pm-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px -22px rgba(15,23,42,0.22);
          border-color: var(--border-slate-200);
        }
        .pm-stat-card:hover .pm-stat-accent { opacity: 1; }
        .pm-stat-accent {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 2px;
          opacity: 0.55;
          transition: opacity .25s ease;
          pointer-events: none;
        }
        .pm-stat-head {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .pm-stat-icon {
          width: 32px; height: 32px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pm-stat-label {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-700);
          letter-spacing: -0.005em;
          text-transform: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pm-stat-value-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .pm-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .pm-stat-subtle {
          display: block;
          font-size: 11.5px;
          color: var(--text-slate-500);
          margin-top: 8px;
          padding-left: 42px;
          font-weight: 500;
          line-height: 1.4;
        }
        .pm-stat-chart {
          margin-top: 10px;
          padding-top: 10px;
          padding-left: 42px;
          border-top: 1px dashed var(--border-slate-100);
        }

        /* MiniBar */
        .pm-minibar { display: flex; flex-direction: column; gap: 7px; }
        .pm-minibar-track {
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          display: flex;
          overflow: hidden;
          border: 1px solid var(--border-slate-100);
        }
        .pm-minibar-seg {
          display: block;
          height: 100%;
          transition: width .4s ease;
        }
        .pm-minibar-seg + .pm-minibar-seg {
          border-left: 1px solid var(--bg-pure-white);
        }
        .pm-minibar-legend {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pm-minibar-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-slate-600);
          font-weight: 500;
        }
        .pm-minibar-dot {
          width: 7px; height: 7px;
          border-radius: 2px;
          display: inline-block;
        }

        /* Inline progress */
        .pm-progress-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pm-progress-track {
          flex: 1;
          height: 6px;
          background: var(--bg-slate-50);
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid var(--border-slate-100);
        }
        .pm-progress-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          transition: width .4s ease;
        }
        .pm-progress-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-700);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        [data-theme='dark'] .pm-stat-card { background: var(--bg-secondary); }
      `}</style>
    </MainLayout >
  );
};

export default function ProjectsManagePage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading projects...</div>}>
      <ProjectsManageContent />
    </React.Suspense>
  );
}
