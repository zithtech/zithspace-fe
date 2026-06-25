"use client";

import React, { Suspense, useState, useEffect } from "react";
import {
  App,
  Skeleton,
  Dropdown,
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
  Pagination,
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
  UnorderedListOutlined,
  ArrowRightOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from "@ant-design/icons";
import {
  FolderKanban,
  Eye,
  Settings2,
  Trash2,
  MoreHorizontal,
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
import { useActivitySource } from "@/hooks/useActivitySource";
import MainLayout from "@/components/layout/MainLayout";
import { useTheme } from "@/context/ThemeContext";
import { ColumnsType } from "antd/es/table";
import { ProjectFormDrawer } from "@/components/projects/ProjectFormDrawer";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 22 }) => {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;
  const width = 72;
  const bottomPadding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    let y = height - bottomPadding;
    if (max > min) {
      y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
    }
    return { x, y };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x},${points[i].y}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isFlat = data.every(d => d === data[0]);
  const flatY = 2;
  const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
  const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
      <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Member {
  value: string;
  label: string;
  position: string;
  avatarUrl?: string | null;
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
  const { notification, message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { canReadProject, canCreateProject, canUpdateProject, canDeleteProject } = usePermission();
  useActivitySource({ section: "WORK", module: "Projects", page: "ProjectList" });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1100);
    }
  }, []);

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [viewMode, setViewMode] = useState<"card" | "table">("card");


  // Filters
  const [filters, setFilters] = useState<ProjectsFilters>({
    page: 1,
    limit: 20,
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
      const { status, ...apiFilters } = filters;
      const response = await ProjectService.getProjects(apiFilters);

      let filteredProjects = response.data;
      if (status) {
        filteredProjects = filteredProjects.filter(
          (project) => project.status?.toLowerCase() === status.toLowerCase()
        );
      }

      setProjects(filteredProjects);
      console.log({ projects: filteredProjects });
      setPagination({
        current: response.pagination.current,
        pageSize: response.pagination.pageSize,
        total: status ? filteredProjects.length : response.pagination.total,
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
    active: projects.filter((p) => p.status?.toLowerCase() === "active").length,
    onHold: projects.filter((p) => p.status?.toLowerCase() === "on-hold").length,
    completed: projects.filter((p) => p.status?.toLowerCase() === "completed").length,
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
  const handleStatusFilter = (status: string | null) => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  // Handle project manager filter
  const handleProjectManagerFilter = (projectManager: string | null) => {
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
      medium: "blue",
      low: "green",
    };
    return colors[priority as keyof typeof colors] || "default";
  };

  // Table columns
  const columns: ColumnsType<Project> = [
    {
      title: "Project",
      key: "project",
      width: 240,
      render: (_: any, record: any) => (
        <Space size={12}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6',
            background: 'var(--bg-blue-50)',
          }}>
            <ProjectOutlined style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", background: "var(--bg-blue-50)" }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14 }}>{record.name}</Text>
            <div style={{ fontSize: 10, color: "var(--text-slate-600)" }}>{record.code}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: any) => (
        <Tag
          color={getStatusColor(status.toLowerCase())}
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
            size='small'
            src={record?.projectManager?.avatarUrl}
            style={{ backgroundColor: '#3b82f6' }}
          >
            {record?.projectManager?.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 12 }}>{record?.projectManager?.name}</div>
            {/* <div style={{ fontSize: 10, color: "#8c8c8c" }}>
              {renderPosition(record.projectManager?.position)}
            </div> */}
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
              {c.companyName && <span className="pp-tag pp-tag--blue"><span className="pp-tag-dot" />{c.companyName}</span>}
              {/* <div style={{ fontSize: 12, fontWeight: 500 }}>{c.companyName}</div> */}
              {/* {c.clientCode && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#8c8c8c",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {c.clientCode}
                </div> */}
              {/* )} */}
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
                  color: "#3b82f6",
                  borderRadius: 0,
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
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 140,
      render: (date: string) => (
        <>
          <CalendarOutlined
            style={{
              marginRight: 6,
              color: "var(--primary-color)",
              fontSize: 11,
            }}
          />
          <Text style={{ fontSize: 12 }}>
            {date ? dayjs(date).format("MMM DD, YYYY") : "-"}
          </Text>
        </>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 140,
      render: (date: string) => (
        <>
          <CalendarOutlined
            style={{
              marginRight: 6,
              color: "#8c8c8c",
              fontSize: 11,
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {date ? dayjs(date).format("MMM DD, YYYY") : "-"}
          </Text>
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 72,
      fixed: "right",
      render: (_: any, record: any) => (
        <Dropdown
          overlayClassName="pm2-action-pop"
          menu={actionMenu(record)}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreHorizontal size={16} style={{ color: "#94a3b8" }} />}
            style={{ padding: '4px', height: 'auto', minWidth: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
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

  // ─── Premium dropdown action menu ──────────────────────────────────────────
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pm2-menu-item">
      <span className="pm2-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pm2-menu-text">
        <span className="pm2-menu-title">{title}</span>
        <span className="pm2-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const actionMenu = (project: any) => ({
    items: [
      {
        key: 'view',
        label: menuLabel('View project', 'Open the full view', <Eye size={15} />, '#3b82f6', 'rgba(59,130,246,0.12)'),
      },
      ...(canUpdateProject ? [{
        key: 'edit',
        label: menuLabel('Configure', 'Open in the builder', <Settings2 size={15} />, '#64748b', 'rgba(100,116,139,0.12)'),
      }] : []),
      ...(canDeleteProject ? [
        { type: 'divider' as const },
        {
          key: 'delete',
          danger: true,
          label: menuLabel('Delete', 'Remove this project', <Trash2 size={15} />, '#ef4444', 'rgba(239,68,68,0.12)'),
        }
      ] : [])
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'view') {
        router.push(`/projects/${project.id}/overview`);
      } else if (key === 'edit') {
        handleEdit(project);
      } else if (key === 'delete') {
        modal.confirm({
          title: 'Delete Project',
          content: 'Are you sure you want to delete this project? This action cannot be undone.',
          okText: 'Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => handleDelete(project.id),
        });
      }
    }
  });

  return (
    <MainLayout noPadding>
      <div className="pm2-page">
        <div className={`pm2-shell-wrap ${isSidebarOpen ? 'is-sidebar-open' : 'is-sidebar-closed'}`}>
          {/* Mobile backdrop — closes the sidebar drawer when tapped */}
          <div
            className="pm2-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden
          />
          <div className="pm2-shell">
            {/* ── Sidebar ───────────────────────────────────────────── */}
            <aside className="pm2-sidebar">
              <div className="pm2-sidebar-top">
                <div className="pm2-sidebar-brand">
                  <div className="pm2-hero-icon-box">
                    <ApartmentOutlined style={{ fontSize: 24, color: 'var(--text-slate-900)' }} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="pm2-sidebar-title">Projects Management</h1>
                    <p className="pm2-sidebar-subtitle">Oversee initiatives</p>
                  </div>
                </div>
                {canCreateProject && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="pm2-side-create"
                    block
                    onClick={handleAdd}
                  >
                    Add Project
                  </Button>
                )}
              </div>

              <div className="pm2-sidebar-scroll">
                {/* Views */}
                <div className="pm2-side-group" >
                  <div className="pm2-side-label">Views</div>
                  <div className="flex flex-col gap-1">
                    <button
                      className={`pm2-view-btn ${!hasActiveFilters ? 'active' : ''}`}
                      onClick={() => setFilters({ page: 1, limit: 10 })}
                    >
                      <FolderKanban className="pm2-view-icon" size={16} />
                      <span className="pm2-view-label">All projects</span>
                      <span className="pm2-view-count">{stats.total}</span>
                    </button>
                    <button
                      className={`pm2-view-btn ${filters.status === 'active' ? 'active' : ''}`}
                      onClick={() => setFilters({ page: 1, limit: 10, status: 'active' })}
                    >
                      <Rocket className="pm2-view-icon" size={16} />
                      <span className="pm2-view-label">Active</span>
                      <span className="pm2-view-count">{stats.active}</span>
                    </button>
                    <button
                      className={`pm2-view-btn ${filters.status === 'on-hold' ? 'active' : ''}`}
                      onClick={() => setFilters({ page: 1, limit: 10, status: 'on-hold' })}
                    >
                      <PauseCircle className="pm2-view-icon" size={16} />
                      <span className="pm2-view-label">On Hold</span>
                      <span className="pm2-view-count">{stats.onHold}</span>
                    </button>
                    <button
                      className={`pm2-view-btn ${filters.status === 'completed' ? 'active' : ''}`}
                      onClick={() => setFilters({ page: 1, limit: 10, status: 'completed' })}
                    >
                      <CheckCircle2 className="pm2-view-icon" size={16} />
                      <span className="pm2-view-label">Completed</span>
                      <span className="pm2-view-count">{stats.completed}</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="pm2-side-group" >
                  <div className="pm2-side-label">Filters</div>
                  <div className="pm2-side-filters flex flex-col gap-2">
                    <SearchableDropdown
                      className="pm2-side-filter-select"
                      placeholder="Status"
                      searchPlaceholder="Search statuses"
                      itemNoun="statuses"
                      value={filters.status || undefined}
                      onChange={(v) => handleStatusFilter(v ?? null)}
                      options={[
                        { label: 'Planning', value: 'planning' },
                        { label: 'Active', value: 'active' },
                        { label: 'On Hold', value: 'on-hold' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                      ]}
                      width="100%"
                    />

                    <SearchableDropdown
                      className="pm2-side-filter-select"
                      placeholder="Project Manager"
                      searchPlaceholder="Search managers"
                      itemNoun="managers"
                      value={filters.projectManagerId || undefined}
                      onChange={(v) => handleProjectManagerFilter(v ?? null)}
                      options={members.map((member) => ({
                        label: member.label,
                        value: member.value,
                        description: member.position,
                        avatarUrl: member.avatarUrl,
                      }))}
                      width="100%"
                    />

                    <DatePicker.RangePicker
                      className="premium-range-picker"
                      placeholder={["Start", "End"]}
                      onChange={handleDateRangeFilter}
                      style={{ width: '100%', background: 'var(--bg-pure-white)', height: 35 }}
                      format="MMM D, YYYY"
                    />

                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="pm2-sidebar-clear"
                        onClick={() => setFilters({ page: 1, limit: 10 })}
                      >
                        <CloseCircleOutlined style={{ fontSize: 12 }} />
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Main ──────────────────────────────────────────────── */}
            <main className="pm2-main">
              {/* Toolbar */}
              <div className="pm2-toolbar">
                <Tooltip title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} placement="bottom">
                  <button
                    type="button"
                    className="pm2-sidebar-show-toggle"
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

                <Divider type="vertical" style={{ height: 24, margin: '0 12px 0 0', opacity: 0.5 }} className="pm2-sidebar-divider" />

                <div className="pp-search-wrap" style={{ maxWidth: 320, flex: 1 }}>
                  <SearchOutlined className="pp-search-icon" />
                  <input
                    className="pp-search"
                    placeholder="Search project name..."
                    value={filters.search || ""}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {/* {!filters.search && <span className="pp-kbd">⌘K</span>} */}
                </div>

                <div className="pm2-main-stats">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="pm2-pulse-dot" />
                    <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{projects.length}</span> {projects.length === 1 ? "result" : "results"}
                  </span>
                </div>

                <div className="pm2-main-controls">
                  <div className="pp-segmented">
                    <button type="button" className={viewMode === 'card' ? 'is-active' : ''} onClick={() => setViewMode('card')} aria-label="Grid view"><AppstoreOutlined /></button>
                    <button type="button" className={viewMode === 'table' ? 'is-active' : ''} onClick={() => setViewMode('table')} aria-label="List view"><UnorderedListOutlined /></button>
                  </div>
                  <Tooltip title="Refresh projects">
                    <button
                      type="button"
                      className="pp-ghost-btn"
                      onClick={async () => {
                        setIsRefreshing(true);
                        await loadProjects();
                        setIsRefreshing(false);
                        message.success("Projects view synchronized");
                      }}
                      disabled={loading}
                    >
                      <ReloadOutlined spin={isRefreshing} />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Premium KPI Hero Row */}
              <div className="pp-stats">
                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                        <FolderKanban size={14} />
                      </span>
                      <span className="pp-stat-label">Total Projects</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{stats.total}</span>
                      <span className="pp-stat-period">projects</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0].map(r => r * (stats.total || 1))} color="#3b82f6" />
                    </div>
                  </div>
                </div>

                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.10)', color: '#10b981' }}>
                        <Rocket size={14} />
                      </span>
                      <span className="pp-stat-label">Active</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{stats.active}</span>
                      <span className="pp-stat-period">projects</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.1, 0.3, 0.4, 0.6, 0.8, 1.0].map(r => r * (stats.active || 1))} color="#10b981" />
                    </div>
                  </div>
                </div>

                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(151, 151, 151, 0.10)', color: '#979797' }}>
                        <PauseCircle size={14} />
                      </span>
                      <span className="pp-stat-label">On Hold</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{stats.onHold}</span>
                      <span className="pp-stat-period">projects</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.2, 0.4, 0.5, 0.7, 0.9, 1.0].map(r => r * (stats.onHold || 1))} color="#979797" />
                    </div>
                  </div>
                </div>

                <div className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6' }}>
                        <CheckCircle2 size={14} />
                      </span>
                      <span className="pp-stat-label">Completed</span>
                    </div>
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{stats.completed}</span>
                      <span className="pp-stat-period">projects</span>
                    </div>
                    <div className="pp-stat-spark">
                      <Sparkline data={[0.0, 0.15, 0.3, 0.45, 0.65, 0.8, 1.0].map(r => r * (stats.completed || 1))} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pm2-main-content">
                <div className="pm2-list-area" >
                  {/* Projects Card View - DASHBOARD STYLE */}
                  {viewMode === "card" ? (
                    projects.length === 0 && !loading ? (
                      <div style={{
                        padding: "20px 20px",
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
                      <div className="pm2-grid">
                        {loading
                          ? [1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="pm2-list-card pm2-list-card-skel">
                              <Skeleton active paragraph={{ rows: 2 }} />
                            </div>
                          ))
                          : projects.map((project) => {
                            const memberCount = project.members?.length || 0;
                            const statusColorMap: Record<string, string> = {
                              planning: "#3b82f6",
                              active: "#10b981",
                              "on-hold": "#f59e0b",
                              completed: "#43A047",
                              cancelled: "#ef4444",
                              'in-progress': "#10b981",
                            };
                            const accent = statusColorMap[project.status?.toLowerCase()] || "#3b82f6";

                            let progress = 0;
                            if (project.startDate && project.endDate) {
                              const start = dayjs(project.startDate);
                              const end = dayjs(project.endDate);
                              const total = end.diff(start, "day");
                              const elapsed = dayjs().diff(start, "day");
                              if (total > 0) progress = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
                            }
                            if (project.status === "completed") progress = 100;

                            const pm = project.projectManager;
                            const pmFullName = pm?.name ? pm.name : "Unassigned";

                            return (
                              <article
                                key={project.id}
                                className="pm2-list-card"
                                style={{ ["--row-accent" as any]: accent, borderRadius: 0 }}
                              >
                                <header className="pm2-list-head" style={{ padding: '8px 12px' }}>
                                  <div
                                    className="pm2-list-row"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.push(`/projects/${project.id}/overview`)}
                                  >
                                    <div className="pm2-list-avatar" style={{ background: '#3b82f6', color: '#fff', top: "-3px" }}>
                                      <span className="pm2-list-avatar-letter">{(project.code || project.name).slice(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                      <span className="pm2-title">
                                        {project.name}
                                      </span>
                                      <span className="pm2-project-line" >
                                        <span className="pm2-project-key">Code:</span>
                                        <span className="pm2-project-value">{project.code || `#${project.id.slice(0, 8)}`}</span>
                                        <span
                                          className="pm2-list-status"
                                          style={{
                                            background: `${accent}12`,
                                            borderColor: `${accent}30`,
                                            color: accent,
                                          }}
                                        >
                                          {project.status.toUpperCase()}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                  {/* Right side more icon */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="pm2-list-more" onClick={e => e.stopPropagation()}>
                                      <Dropdown
                                        overlayClassName="pm2-action-pop"
                                        menu={actionMenu(project)}
                                        trigger={['click']}
                                        placement="bottomRight"
                                      >
                                        <Button
                                          type="text"
                                          icon={<MoreHorizontal size={16} style={{ color: "#94a3b8" }} />}
                                          style={{ padding: '4px', height: 'auto', minWidth: 'auto', marginLeft: '12px' }}
                                        />
                                      </Dropdown>
                                    </div>
                                  </div>
                                </header>

                                <div className="pm2-list-foot">
                                  <div className="pm2-list-foot-row">
                                    <Typography.Paragraph
                                      style={{ fontSize: 12.5, color: "var(--text-slate-500)", margin: 0, lineHeight: 1.5, minHeight: 36 }}
                                      ellipsis={{ rows: 2 }}
                                    >
                                      {project.description || "No description provided."}
                                    </Typography.Paragraph>
                                  </div>

                                  <div className="pm2-list-foot-row">
                                    <span className="pm2-list-foot-item">
                                      <span className="pm2-list-foot-key" >Manager:</span>
                                      <Avatar size={18} src={pm?.avatarUrl} style={{ fontSize: 9, background: '#e2e8f0', color: '#64748b' }}>
                                        {pmFullName.charAt(0)}
                                      </Avatar>
                                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)' }}>
                                        {pmFullName.split(' ')[0]}
                                      </span>
                                    </span>
                                    <span className="pm2-list-foot-div"></span>
                                    <span className="pm2-list-foot-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span className="pm2-list-foot-key" >Members:</span>
                                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)' }}>
                                        {memberCount}
                                      </span>
                                    </span>
                                    <span className="pm2-list-foot-div"></span>
                                    <span className="pm2-list-foot-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span className="pm2-list-foot-key" >Timeline:</span>
                                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)' }}>
                                        {progress}%
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                      </div>
                    )
                  ) : (
                    /* ===== TABLE VIEW ===== */
                    <div className="pm-table-wrap">
                      <Table
                        size="small"
                        className="premium-table"
                        columns={columns}
                        dataSource={projects}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 1200 }}
                        onChange={handleTableChange}
                        onRow={(record) => ({
                          onClick: () => {
                            router.push(`/projects/${record.id}/overview`);
                          },
                        })}
                      />
                    </div>
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

              {!loading && projects.length > 0 && (
                <div className="pm2-pagination">
                  <Typography.Text style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>
                    Showing <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>
                      {(pagination.current - 1) * pagination.pageSize + 1}–{Math.min(pagination.current * pagination.pageSize, pagination.total)}
                    </span> of <span style={{ color: 'var(--text-slate-700)', fontWeight: 700 }}>{pagination.total}</span> project{pagination.total !== 1 ? 's' : ''}
                  </Typography.Text>
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={(page, pageSize) => handleTableChange({ current: page, pageSize })}
                    showSizeChanger
                    pageSizeOptions={[10, 20, 25, 50, 100]}
                  />
                </div>
              )}
            </main>
          </div>
        </div>

        <style jsx global>{`
        /* ── Page shell ──────────────────────────────────────────── */
        .pm2-page {
          background: var(--bg-pure-white);
          min-height: calc(100vh - 54px);
          display: flex;
          flex-direction: column;
        }
        [data-theme="dark"] .pm2-page {
          background: var(--bg-pure-white) !important;
        }

        .pm2-shell-wrap {
          flex: 1;
        }
        .pm2-sidebar-backdrop { display: none; }

        /* ── Sidebar show/hide toggle (always visible in top header) ── */
        .pm2-sidebar-show-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 8px;
          color: var(--text-slate-600, #475569);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .pm2-sidebar-show-toggle:hover {
          background: var(--bg-slate-100, #f1f5f9);
          border-color: var(--text-slate-400, #94a3b8);
          color: var(--text-slate-900, #0f172a);
        }
        .pm2-sidebar-show-toggle[aria-pressed='true'] {
          background: rgba(59, 130, 246, 0.10);
          border-color: rgba(59, 130, 246, 0.32);
          color: var(--premium-blue, #3b82f6);
        }
        [data-theme='dark'] .pm2-sidebar-show-toggle {
          background: #111720 !important;
          border-color: #2d3748 !important;
          color: #cbd5e1;
        }
        [data-theme='dark'] .pm2-sidebar-show-toggle:hover {
          background: #1c232e !important;
          border-color: #475569 !important;
          color: #f1f5f9;
        }

        .pm2-shell {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 54px);
          transition: grid-template-columns 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* ── Desktop ≥1100px ────────────────────────────────── */
        @media (min-width: 1100px) {
          .pm2-shell-wrap.is-sidebar-closed .pm2-shell {
            grid-template-columns: 0px minmax(0, 1fr);
          }
          .pm2-shell-wrap.is-sidebar-closed > .pm2-shell > aside.pm2-sidebar {
            opacity: 0;
            padding-left: 0;
            padding-right: 0;
            pointer-events: none;
            border-right-color: transparent;
          }
        }
        .pm2-main {
          min-width: 0;
          padding: 14px 24px 32px;
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
        }
        [data-theme="dark"] .pm2-main {
          background: transparent !important;
        }

        /* ── Sidebar ─────────────────────────────────────────────── */
        .pm2-sidebar {
          width: 240px;
          background: var(--bg-pure-white);
          border-right: 1px solid var(--border-slate-200);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: opacity 0.3s ease, border-color 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          overflow: hidden;
          z-index: 10;
        }
        [data-theme="dark"] .pm2-sidebar {
          background: #0f1419 !important;
          border-right-color: #1f2937 !important;
        }

        .pm2-sidebar-top { 
          padding: 14px 14px 12px 14px; 
        }
        [data-theme="dark"] .pm2-sidebar-top {
          border-bottom-color: #1f2937 !important;
        }
        .pm2-sidebar-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .pm2-hero-icon-box {
          width: 38px; height: 38px; border-radius: 10px;
          background: transparent !important;
          display: flex; align-items: center; justify-content: center;
          border: none;
          flex-shrink: 0;
        }
        [data-theme='dark'] .pm2-hero-icon-box {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.28);
        }
        .pm2-sidebar-title { font-size: 14.5px; font-weight: 700; color: var(--text-slate-900); margin: 0 0 2px 0; letter-spacing: -0.01em; line-height: 1.2; }
        
        .pm2-sidebar-subtitle {
          font-size: 10.5px;
          color: var(--text-slate-400);
          font-weight: 700;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .pm2-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          background: linear-gradient(135deg, #3980f2 0%, #3980f2 100%) !important;
          border: none !important;
        }

        .pm2-sidebar-scroll {
          flex: 1; min-height: 0; overflow-y: auto; padding: 6px 10px 6px 10px;
        }

        .pm2-side-group { margin-bottom: 22px; }
        .pm2-side-label {
          font-size: 10px; font-weight: 800; color: var(--text-slate-400);
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 0 10px; margin-bottom: 8px;
        }
        .pm2-sidebar .ant-select-selector,
        .pm2-sidebar .ant-picker {
          border-radius: 6px !important;
        }
        .pm2-sidebar .ant-select:hover .ant-select-selector,
        .pm2-sidebar .ant-select-focused .ant-select-selector,
        .pm2-sidebar .ant-select-open .ant-select-selector,
        .pm2-sidebar .ant-picker:hover,
        .pm2-sidebar .ant-picker-focused {
          background-color: #f8f9fa !important;
          border-color: var(--text-slate-600) !important;
        }
        [data-theme='dark'] .pm2-sidebar .ant-select:hover .ant-select-selector,
        [data-theme='dark'] .pm2-sidebar .ant-select-focused .ant-select-selector,
        [data-theme='dark'] .pm2-sidebar .ant-select-open .ant-select-selector,
        [data-theme='dark'] .pm2-sidebar .ant-picker:hover,
        [data-theme='dark'] .pm2-sidebar .ant-picker-focused {
          background-color: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .pm2-sidebar .ant-select-selection-item,
        .pm2-sidebar .ant-select-selection-placeholder,
        .pm2-sidebar .ant-picker-input > input,
        .pm2-sidebar .ant-picker-input > input::placeholder {
          color: var(--text-slate-600) !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          padding: 6px  !important;
        }

        .pm2-side-filter-select .ant-select-selection-item,
        .pm2-side-filter-select .ant-select-selection-placeholder {
          font-size: 13px !important;
          height: 22px !important;
          line-height: 22px !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
        }

        .pm2-side-filter-select .ant-select-selector {
          height: 36px !important;
          padding: 0px 10px !important;
          display: flex;
          align-items: center;
        }

        .pm2-sidebar .premium-range-picker {
          border-radius: 6px !important;
          border: 1px dashed var(--border-slate-200) !important;
          height: 36px !important;
        }

        .pm2-sidebar .premium-range-picker:hover{
          border: 1px dashed var(--border-color) !important;    
        }
        .pm2-sidebar .premium-range-picker .ant-picker-input > input {
          font-size: 13px !important;
          padding: 8px !important;
          color: var(--text-slate-600) !important; 
        }

        .pm2-view-btn {
          display: flex; align-items: center; gap: 10px; padding: 7px 10px;
          border-radius: 8px; background: transparent; border: none; cursor: pointer;
          width: 100%; text-align: left; font-family: inherit; font-size: 12.5px; font-weight: 500;
          color: var(--text-slate-600); transition: all 0.15s ease;
        }

        /* ── Action Menu Dropdown (Premium Style) ────────────────────────────────── */
        .pm2-action-pop .ant-dropdown-menu {
          padding: 6px !important;
          border-radius: 0px !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04) !important;
          border: 1px solid var(--border-slate-200) !important;
        }
        .pm2-action-pop .ant-dropdown-menu-item {
          border-radius: 0px !important;
          padding: 0 !important;
          margin-bottom: 2px !important;
          transition: background .12s ease;
        }
        .pm2-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pm2-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pm2-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pm2-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pm2-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pm2-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pm2-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pm2-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pm2-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pm2-action-pop .ant-dropdown-menu-item-danger .pm2-menu-title { color: #ef4444; }
        .pm2-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pm2-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        .pm2-view-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pm2-view-btn.active { background: var(--bg-blue-50); color: var(--text-slate-900); }
        [data-theme='dark'] .pm2-view-btn { color: #94a3b8; }
        [data-theme='dark'] .pm2-view-btn:hover { background: rgba(255,255,255,0.03); color: #f1f5f9; }
        [data-theme='dark'] .pm2-view-btn.active { background: rgba(59, 130, 246, 0.15); color: #f1f5f9; }

        .pm2-view-icon { font-size: 14px; color: var(--text-slate-400); display: flex; align-items: center; }
        .pm2-view-btn.active .pm2-view-icon { color: #3b82f6; }
        .pm2-view-btn.active .pm2-view-label { font-weight: 600; }
        [data-theme='dark'] .pm2-view-icon { color: #64748b; }
        [data-theme='dark'] .pm2-view-btn.active .pm2-view-icon { color: #60a5fa; }

        .pm2-view-count {
          margin-left: auto; font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); padding: 2px 6px; border-radius: 6px;
        }
        .pm2-view-btn.active .pm2-view-count {
          background: #BFDBFE; color: #1E3A8A; border-radius: 6px;
        }
        [data-theme='dark'] .pm2-view-count { background: #1c232e; color: #64748b; }
        [data-theme='dark'] .pm2-view-btn.active .pm2-view-count { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

        .pm2-view-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
          
        }
        [data-theme="dark"] .pm2-sidebar-item:hover {
          background: #1c232e !important;
        }
        .pm2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          color: #1d4ed8;
        }
        [data-theme="dark"] .pm2-sidebar-item.active {
          background: rgba(59, 130, 246, 0.18) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
          color: #60a5fa !important;
        }
        .pm2-sidebar-item-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        .pm2-icon-all {
          background: var(--bg-slate-50);
          border-color: var(--border-slate-200);
          color: var(--text-slate-600);
        }
        [data-theme="dark"] .pm2-icon-all {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          
        }
        .pm2-sidebar-item-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin: 0 6px 0 7px;
        }
        .pm2-sidebar-item-label {
          flex: 1;
          font-size: 12.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }
        .pm2-sidebar-item-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-500);
          font-variant-numeric: tabular-nums;
          background: var(--bg-slate-50);
          border-radius: 999px;
          padding: 0 6px;
          line-height: 1.6;
          border: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme="dark"] .pm2-sidebar-item-count {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          
        }
        .pm2-sidebar-item.active .pm2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.14);
          border-color: rgba(59, 130, 246, 0.28);
          color: #1d4ed8;
        }
        [data-theme="dark"] .pm2-sidebar-item.active .pm2-sidebar-item-count {
          background: rgba(59, 130, 246, 0.22) !important;
          border-color: rgba(59, 130, 246, 0.38) !important;
          color: #60a5fa !important;
        }

        /* Project row with expandable toggle */
        .pm2-sidebar-proj-row {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .pm2-sidebar-proj-row:hover {
          background: var(--bg-slate-50);
        }
        [data-theme="dark"] .pm2-sidebar-proj-row:hover {
          background: #1c232e !important;
        }
        .pm2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }
        [data-theme="dark"] .pm2-sidebar-proj-row.active {
          background: rgba(59, 130, 246, 0.18) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
        }
        .pm2-sidebar-proj-toggle {
          flex-shrink: 0;
          width: 18px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-slate-500);
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.12s ease;
        }
        .pm2-sidebar-proj-toggle:hover {
          color: #1d4ed8;
        }
        .pm2-sidebar-proj-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 6px 10px 6px 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-700);
          text-align: left;
          min-width: 0;
        }
        [data-theme="dark"] .pm2-sidebar-proj-main {
          
        }
        .pm2-sidebar-proj-row.active .pm2-sidebar-proj-main {
          color: #1d4ed8;
        }
        [data-theme="dark"] .pm2-sidebar-proj-row.active .pm2-sidebar-proj-main {
          color: #60a5fa !important;
        }

        /* Nested buckets under project */
        .pm2-sidebar-children {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 2px 0 4px 22px;
          padding-left: 8px;
          border-left: 1px dashed var(--border-slate-200);
        }
        [data-theme="dark"] .pm2-sidebar-children {
          border-left-color: #2d3748 !important;
        }
        .pm2-sidebar-bucket {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          color: var(--text-slate-600);
          text-align: left;
          width: 100%;
          transition: background 0.12s ease, color 0.12s ease;
          min-width: 0;
        }
        .pm2-sidebar-bucket:hover {
          background: var(--bg-slate-50);
          color: #1d4ed8;
        }
        [data-theme="dark"] .pm2-sidebar-bucket {
          
        }
        [data-theme="dark"] .pm2-sidebar-bucket:hover {
          background: #1c232e !important;
          color: #60a5fa !important;
        }
        .pm2-sidebar-bucket-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pm2-sidebar-bucket-label {
          flex: 1;
          font-size: 11.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pm2-sidebar-bucket-count {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-slate-400);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .pm2-sidebar-empty-mini {
          padding: 6px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
          font-style: italic;
        }
        .pm2-sidebar-empty {
          padding: 10px 8px;
          font-size: 11px;
          color: var(--text-slate-400);
        }
        .pm2-sidebar-divider {
          height: 1px;
          background: var(--border-slate-100);
          margin: 6px 4px;
        }
        [data-theme="dark"] .pm2-sidebar-divider {
          background: #1f2937 !important;
        }
        .pm2-sidebar-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 6px;
          padding: 8px;
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 8px;
          color: var(--text-slate-500);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.12s ease, border-color 0.12s ease;
        }
        .pm2-sidebar-clear:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .pm2-sidebar-clear {
          border-color: #2d3748 !important;
          
        }

        /* ── Main toolbar ───────────────────────────────────────── */
        .pm2-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-pure-white);
          margin: -14px -24px 0;
          padding: 6px 20px;
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme="dark"] .pm2-toolbar {
          background: #0d1117 !important;
          border-bottom-color: #1f2937 !important;
        }
        .pm2-main-search {
          flex: 1;
          max-width: 320px;
        }
        .premium-search-input{
          border-radius: 6px !important;
          height: 32px !important;
        }
        .pm2-search-kbd {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 6px;
          margin: 0 2px;
          border-radius: 5px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-700);
          box-shadow: 0 1px 0 var(--border-slate-200);
        }
        .pm2-main-stats {
          margin-left: 12px;
          color: var(--text-slate-500);
          font-size: 13px;
        }
        .pm2-pulse-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
          animation: pm2-pulse 2s infinite;
        }
        @keyframes pm2-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .pm2-main-controls {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-search-wrap {
          position: relative; flex: 1; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900); min-width: 0;
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        .pm2-vis-badge {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
        }
        .pm2-vis-badge-public {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.25);
          color: #047857;
        }
        .pm2-vis-badge-private {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.25);
          color: #b45309;
        }
        /* RangePicker — match the SearchableDropdown trigger height/border */
        .pm2-range-picker {
          height: 32px !important;
          border-radius: 6px !important;
          font-size: 12px;
        }
        .pm2-range-picker.ant-picker {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .pm2-range-picker.ant-picker {
          background: #161b22 !important;
          border-color: #2d3748 !important;
        }
        .pm2-toolbar-icon {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pm2-toolbar-chip {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.01em;
        }
        [data-theme="dark"] .pm2-toolbar-chip {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          
        }
        .pm2-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          width: 260px;
          transition: border-color 0.15s ease;
        }
        .pm2-search-box.active {
          border-color: rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .pm2-search-box {
          background: #161b22 !important;
          border-color: #2d3748 !important;
        }
        [data-theme="dark"] .pm2-search-box.active {
          border-color: rgba(59, 130, 246, 0.5) !important;
        }

        /* ── List cards ─────────────────────────────────────────── */
        .pm2-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          // padding-top: 10px;
        }
        
        .pm2-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          // padding-top: 10px;
        }
        
        @media (max-width: 1300px) {
          .pm2-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .pm2-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Sticky pagination footer ──────────────────────────── */
        .pm2-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 24px;
          margin: auto -24px -32px -24px;
          flex-wrap: wrap;
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          z-index: 10;
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.04);
        }
        [data-theme="dark"] .pm2-pagination {
          background: #161b22 !important;
          border-top-color: #1f2937 !important;
        }

        /* Custom Pagination Styles */
        .pm2-pagination .ant-pagination-item,
        .pm2-pagination .ant-pagination-prev .ant-pagination-item-link,
        .pm2-pagination .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500) !important;
        }
        .pm2-pagination .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .pm2-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .pm2-pagination .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          color: var(--text-slate-500) !important;
        }

        .pm2-list-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          /* When we smooth-scroll a card into view on Manage-Tickets click,
             land its top 120px below the viewport so it clears the sticky
             page header (~52px) + sticky toolbar (~60px). */
          scroll-margin-top: 120px;
          padding: 0px 0px 0px 0px;
          display: flex;
          flex-direction: column;
          gap: 0px;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        [data-theme="dark"] .pm2-list-card {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .pm2-list-card:hover {
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
          border-color: #cbd5e1 !important;
        }
        [data-theme="dark"] .pm2-list-card:hover {
          background: #1c232e !important;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
          border-color: transparent !important;
        }
        .pm2-list-card-skel {
          min-height: 96px;
        }

        .pm2-list-head {
          display: flex;
          align-items: center;
        }
        .pm2-list-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          font-family: inherit;
          outline: none;
        }
        .pm2-list-row:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.3);
          outline-offset: 4px;
          border-radius: 8px;
        }
        .pm2-list-row-segments {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .pm2-list-row-div {
          width: 1px;
          height: 18px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme="dark"] .pm2-list-row-div {
          background: #2d3748 !important;
        }
        .pm2-list-seg {
          display: inline-flex;
          align-items: center;
          min-width: 0;
        }
        .pm2-list-seg-project {
          gap: 6px;
          flex-shrink: 0;
        }
        .pm2-list-seg-bucket {
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .pm2-list-seg-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .pm2-list-seg-label {
          
        }
        .pm2-list-seg-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-700);
          letter-spacing: -0.005em;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .pm2-list-seg-value {
          
        }
        .pm2-list-seg-value.muted {
          color: var(--text-slate-400);
          font-style: italic;
          font-weight: 600;
        }
        .pm2-list-seg-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pm2-list-seg-name {
          flex: 1;
          min-width: 0;
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .pm2-list-seg-name {
          color: #f1f5f9 !important;
        }
        .pm2-list-row:hover .pm2-list-seg-name {
          color: #1d4ed8;
        }
        [data-theme="dark"] .pm2-list-row:hover .pm2-list-seg-name {
          color: #60a5fa !important;
        }
        .pm2-list-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.025em;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        [data-theme="dark"] .pm2-list-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2) !important;
        }
        .pm2-list-avatar::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 75% 0%, rgba(255, 255, 255, 0.2), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0, 0, 0, 0.06), transparent 55%);
          pointer-events: none;
        }
        .pm2-list-avatar-letter {
          position: relative;
          z-index: 1;
          line-height: 1;
        }
        .pm2-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 2px;
        }
        .pm2-project-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pm2-project-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pm2-project-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pm2-list-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 9px;
          border-radius: 0px;
          border: 1px solid;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .pm2-list-desc {
          margin: 0;
          padding: 4px 8px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px dashed var(--border-slate-200);
          border-radius: 6px;
          align-self: flex-start;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .pm2-list-desc {
          background: #1c232e !important;
          border-color: #2d3748 !important;
          
        }

        /* Body */
        .pm2-list-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px;
        }
        .pm2-list-block {
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 8px;
          padding: 6px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        [data-theme="dark"] .pm2-list-block {
          background: #1c232e !important;
          border-color: #2d3748 !important;
        }
        .pm2-list-block-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pm2-list-block-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        [data-theme="dark"] .pm2-list-block-label {
          
        }
        .pm2-list-stats {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pm2-list-stat {
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
        }
        .pm2-list-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        [data-theme="dark"] .pm2-list-stat-value {
          color: #f1f5f9 !important;
        }
        .pm2-list-stat-label {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .pm2-list-stat-sep {
          width: 1px;
          height: 14px;
          background: var(--border-slate-200);
        }
        [data-theme="dark"] .pm2-list-stat-sep {
          background: #2d3748 !important;
        }
        .pm2-list-owner {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pm2-list-owner-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.25;
        }
        .pm2-list-owner-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme="dark"] .pm2-list-owner-name {
          color: #e2e8f0 !important;
        }
        .pm2-list-owner-email {
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-slate-500);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pm2-list-foot { display: flex !important; flex-direction: column !important; padding: 0; border-top: 1px solid var(--border-slate-200) !important; background: var(--bg-slate-50) !important; margin-top: auto !important; }
        .pm2-list-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pm2-list-foot-row + .pm2-list-foot-row { border-top: 1px solid var(--border-slate-200) !important; }
        .pm2-list-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pm2-list-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pm2-list-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

        /* Divider between footer and the inline Manage-Tickets panel */
        .pm2-list-divider {
          height: 1px;
          background: var(--border-slate-100);
          /* Extend to the card's edges, eating the parent padding (10 14 10 16) */
          margin: 2px -14px 2px -16px;
        }
        [data-theme="dark"] .pm2-list-divider {
          background: #1f2937 !important;
        }
        .pm2-list-foot-inline {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }
        // .pm2-list-foot-item {
        //   display: inline-flex;
        //   align-items: center;
        //   gap: 5px;
        //   font-size: 11.5px;
        //   font-weight: 500;
        //   color: var(--text-slate-500);
        // }
        // .pm2-list-foot-item b {
        //   color: var(--text-slate-800);
        //   font-weight: 700;
        // }
        [data-theme="dark"] .pm2-list-foot-item b {
          color: #e2e8f0 !important;
        }
        // .pm2-list-foot-label {
        //   font-size: 10px;
        //   font-weight: 800;
        //   color: var(--text-slate-400);
        //   text-transform: uppercase;
        //   letter-spacing: 0.08em;
        // }
        .pm2-list-foot-div {
          width: 1px;
          height: 12px;
          background: var(--border-slate-200);
        }
        [data-theme="dark"] .pm2-list-foot-div {
          background: #2d3748 !important;
        }
        .pm2-list-actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .pm2-list-action-btn {
          width: 28px;
          height: 28px;
          padding: 0 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px !important;
        }

        /* Labeled footer button (e.g. Move to Sprint / Move to Backlog) */
        .pm2-foot-btn {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          height: 28px !important;
          padding: 0 10px !important;
          border-radius: 7px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          color: var(--text-slate-700) !important;
          font-size: 11.5px !important;
          font-weight: 700 !important;
          letter-spacing: 0.005em;
          transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
        }
        .pm2-foot-btn:hover:not(:disabled) {
          border-color: #3b82f6 !important;
          color: #3b82f6 !important;
          background: var(--bg-slate-50) !important;
        }
        .pm2-foot-btn:disabled {
          opacity: 0.5;
        }
        [data-theme="dark"] .pm2-foot-btn {
          background: #161b22 !important;
          border-color: #2d3748 !important;
          
        }
        [data-theme="dark"] .pm2-foot-btn:hover:not(:disabled) {
          background: #1c232e !important;
        }

        /* Manage Tickets button */
        .pm2-manage-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          background: transparent;
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          color: var(--text-slate-600);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .pm2-manage-btn:hover {
          color: #fff !important;
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
        }
        .pm2-manage-btn.active {
          color: #fff !important;
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
        }
        [data-theme="dark"] .pm2-manage-btn {
          border-color: #2d3748 !important;
          
        }
        [data-theme="dark"] .pm2-manage-btn:hover {
          background: #1c232e !important;
        }
        [data-theme="dark"] .pm2-manage-btn.active {
          background: rgba(59, 130, 246, 0.18) !important;
        }

        /* Empty */
        .pm2-empty {
          padding: 64px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .pm2-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        /* ── Responsive ──────────────────────────────────────────── */

        /* Slim sidebar + tighter toolbar on smaller desktop */
        @media (max-width: 1200px) {
          .pm2-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }
          .pm2-sidebar {
            padding: 12px 8px 14px 14px;
          }
          .pm2-search-box {
            width: 220px;
          }
          .pm2-list-card {
            padding: 16px 18px 14px 20px;
          }
        }

        /* Tablet — toolbar filters wrap to their own row */
        @media (max-width: 1024px) {
          .pm2-toolbar-filters {
            margin-left: 0;
            width: 100%;
            order: 3;
          }
          .pm2-search-box {
            width: 200px;
          }
          .pm2-list-foot {
            flex-wrap: wrap;
            row-gap: 10px;
          }
        }

        /* Sidebar collapses above content */
        @media (max-width: 900px) {
          .pm2-page {
            margin: 0 -16px;
          }
          .pm2-shell {
            grid-template-columns: 1fr;
          }
          .pm2-sidebar {
            position: relative;
            top: 0;
            height: auto;
            max-height: 320px;
            padding: 10px 16px 12px;
            border-right: none;
            border-bottom: 1px solid var(--border-slate-200);
          }
          .pm2-main {
            padding: 14px 16px 28px;
          }
          .pm2-list-body {
            grid-template-columns: 1fr;
          }
          .pm2-toolbar {
            margin: -14px -16px 0;
            padding: 12px 16px;
          }
          .pm2-pagination {
            margin: 14px -16px -28px;
            padding: 10px 16px;
          }
          .pm2-list-card {
            padding: 14px 16px 14px 18px;
            gap: 12px;
          }
          .pm2-list-stripe {
            top: 14px;
            bottom: 14px;
          }
          /* When sidebar is above the main column, drop the desktop scroll-margin
             since the user no longer has to clear a fixed left rail. */
          .pm2-list-card {
            scroll-margin-top: 88px;
          }
        }

        /* Phone */
        @media (max-width: 640px) {
          .pm2-page {
            margin: 0 -8px;
          }
          .pm2-main {
            padding: 12px 12px 24px;
          }
          .pm2-toolbar {
            flex-direction: column;
            align-items: stretch;
            margin: -12px -12px 0;
            padding: 10px 12px;
          }
          .pm2-toolbar-title {
            width: 100%;
            justify-content: space-between;
          }
          .pm2-toolbar-filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
          }
          .pm2-toolbar-filters > * {
            width: 100% !important;
            min-width: 0 !important;
          }
          .pm2-range-picker {
            grid-column: 1 / -1;
          }
          .pm2-search-box {
            width: 100%;
          }
          /* Bucket cards */
          .pm2-list-card {
            padding: 14px 14px 12px 16px;
            scroll-margin-top: 76px;
          }
          .pm2-list-row {
            gap: 10px;
          }
          .pm2-list-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            font-size: 15px;
          }
          .pm2-list-seg-name {
            font-size: 14px;
            white-space: normal;
          }
          .pm2-list-foot {
            flex-direction: column;
            align-items: stretch;
          }
          .pm2-list-actions {
            flex-wrap: wrap;
            row-gap: 6px;
            justify-content: flex-start;
          }
          .pm2-foot-btn {
            flex: 1;
            justify-content: center;
          }
          /* Pagination */
          .pm2-pagination {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            margin: 12px -12px -24px;
            padding: 10px 12px;
          }
          .pm2-pagination-meta {
            text-align: center;
          }
          /* Sidebar items more compact */
          .pm2-sidebar {
            padding: 8px 14px 10px;
            max-height: 280px;
          }
          .pm2-sidebar-section-head {
            padding: 4px 6px 6px;
          }
        }

        /* Very small phones */
        @media (max-width: 400px) {
          .pm2-list-stripe {
            display: none;
          }
          .pm2-list-status {
            font-size: 9.5px;
          }
          .pm2-list-seg-name {
            font-size: 13px;
          }
        }
        /* ── Premium Table CSS ───────────────────────────────────── */
        .pm-table-wrap{
        background: var(--bg-pure-white); 
        border: 1px solid var(--border-slate-200);
        border-radius: 0; 
        overflow: hidden;
        margin-top: 0px !important; 
        }
        .premium-table .ant-table {
          background: transparent !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before {
          display: none;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #1e293b;
          border-bottom-color: #334155;
          color: #94a3b8;
        }
        .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important; 
          padding: 6.5px 10px !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          border-bottom-color: #1e293b;
        }
        .premium-table .ant-table-row:hover > td {
           background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td {
          background: rgba(255, 255, 255, 0.02);
        }
        .premium-table .ant-table-row-expand-icon-cell {
          padding: 0 4px !important;
        }
        .premium-table .ant-table-expanded-row > td {
          padding: 0 !important;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        [data-theme='dark'] .premium-table .ant-table-expanded-row > td {
          background: rgba(15, 23, 42, 0.5);
          border-bottom-color: #1e293b;
        }
        .dh-col-icon {
          color: #94a3b8;
          font-size: 13px;
        }
        [data-theme='dark'] .dh-col-icon {
          color: #475569;
        }

        .dh-name-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #3b82f6;
          color: #ffffff;
        }
        [data-theme='dark'] .dh-name-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .bmp-owner-avatar {
          background: #3b82f6 !important;
          color: #ffffff !important;
        }
        [data-theme='dark'] .bmp-owner-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border: none;
        }

        .bmp-table-text-primary {
          color: #334155;
        }
        [data-theme='dark'] .bmp-table-text-primary {
          color: #f1f5f9;
        }

        .bmp-project-tag {
          background: #eff6ff;
          color: #2563eb;
        }
        [data-theme='dark'] .bmp-project-tag {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }

        .bmp-tag-public {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #d1fae5;
        }
        [data-theme='dark'] .bmp-tag-public {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .bmp-tag-private {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        [data-theme='dark'] .bmp-tag-private {
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .pp-tag {
            display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;
          }
          .pp-tag--blue { background: var(--bg-blue-50); color: #3B82F6; }
          .pp-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        @media (max-width: 1024px) {
          .pm2-stat-cards-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .pm2-stat-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .pm2-stat-card {
          background: #ffffff;
          border-radius: 0px;
          padding: 12px 14px;
          border: 1px solid var(--border-slate-200);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
        }
        [data-theme="dark"] .pm2-stat-card {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }
        .pm2-stat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .pm2-stat-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pm2-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 16px;
        }
        .pm2-stat-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .pm2-stat-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          animation: pulse-dot 2s infinite;
        }
        .pm2-stat-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .pm2-stat-value-wrap {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          gap: 6px;
        }
        .pm2-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-slate-900);
          line-height: 1.1;
        }
        .pm2-stat-period {
          font-size: 12px;
          color: var(--text-slate-400);
          margin-top: 2px;
        }

        /* ── Proposals Status Cards ────────────────────────────────────────── */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; margin-top: 10px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-delta {
          display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
          color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .pp-stat-spark { opacity: 0.95; }

        @media (max-width: 1024px) {
          .pp-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .pp-stats {
            grid-template-columns: 1fr;
          }
        }

        /* ── Tablet / Mobile <1100px ────────────────────────── */
        @media (max-width: 1099.98px) {
          .pm2-shell {
            display: flex;
            flex-direction: column;
            grid-template-columns: none;
            min-height: auto;
          }
          .pm2-sidebar {
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
            pointer-events: auto !important;
          }
          [data-theme='dark'] .pm2-sidebar {
            background: #0B0F1A !important;
            border-right-color: #1f2937 !important;
          }
          .pm2-shell-wrap.is-sidebar-open .pm2-sidebar {
            transform: translateX(0);
          }
          .pm2-shell-wrap.is-sidebar-closed .pm2-sidebar {
            transform: translateX(-100%);
          }
          .pm2-sidebar-backdrop {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.45);
            z-index: 1040;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .pm2-shell-wrap.is-sidebar-open .pm2-sidebar-backdrop {
            opacity: 1;
            pointer-events: auto;
          }
          .pm2-main {
            padding-left: 16px;
            padding-right: 16px;
          }
          .pm2-sidebar-divider {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </MainLayout>
  );
};

export default function ProjectsManagePage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading projects...</div>}>
      <ProjectsManageContent />
    </React.Suspense>
  );
}
