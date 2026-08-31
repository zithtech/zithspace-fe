"use client";

import NoData from "@/components/common/NoData";
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
  Popover,
} from "antd";
import { useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ProjectFilters from "./ProjectFilters";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import type { Dayjs } from "dayjs";
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
  FilterOutlined,
  ExpandAltOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PauseCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import {
  Eye,
  Settings2,
  Trash2,
  MoreHorizontal,
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
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  /* The rail's range picker was uncontrolled; the header's needs a value so
     the popover and the pill row agree on what is selected. */
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

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

  /* The rail's Views list and Filters group, now the header's switch and
     its Filters panel. */
  const PROJECT_STATUS_OPTIONS = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  const PROJECT_VIEW_SEGMENTS = [
    { k: 'all', label: 'All', icon: <ProjectOutlined style={{ fontSize: 12 }} />, count: stats.total },
    { k: 'active', label: 'Active', icon: <RocketOutlined style={{ fontSize: 12 }} />, count: stats.active },
    { k: 'on-hold', label: 'On Hold', icon: <PauseCircleOutlined style={{ fontSize: 12 }} />, count: stats.onHold },
    { k: 'completed', label: 'Completed', icon: <CheckCircleOutlined style={{ fontSize: 12 }} />, count: stats.completed },
  ];

  const activeFilterCount =
    (filters.search ? 1 : 0) + (filters.status ? 1 : 0) +
    (filters.projectManagerId ? 1 : 0) + (filters.startDate ? 1 : 0);

  const resetFilters = () => {
    setDateRange(null);
    setFilters({ page: 1, limit: 10 });
  };

  /* ── Banner figures ───────────────────────────────────────────────────
     The KPI cards folded into the banner; the bar tracks the share of the
     portfolio that has actually shipped. */
  const activeStatusLabel =
    PROJECT_STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || 'All projects';
  const bannerAccent =
    stats.total === 0 ? '#64748b' : stats.active > 0 ? '#3b82f6' : '#10b981';

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
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Text strong style={{ fontSize: 14, lineHeight: '1.2' }}>{record.name}</Text>
            <div style={{ fontSize: 10, color: "var(--text-slate-600)", marginTop: 2 }}>
              {record.code || `#${record.id.slice(0, 8)}`}
            </div>
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
          label: (
            <ConfirmDialog
              tone="danger"
              icon={<Trash2 size={16} />}
              title="Delete Project?"
              description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              placement="left"
              onConfirm={() => handleDelete(project.id)}
            >
              <div
                style={{
                  margin: '-5px -12px',
                  padding: '5px 12px',
                  width: 'calc(100% + 24px)',
                  height: '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {menuLabel('Delete', 'Remove this project', <Trash2 size={15} />, '#ef4444', 'rgba(239,68,68,0.12)')}
              </div>
            </ConfirmDialog>
          ),
        }
      ] : [])
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'view') {
        router.push(`/projects/${project.id}/overview`);
      } else if (key === 'edit') {
        handleEdit(project);
      }
    }
  });

  return (
    <MainLayout noPadding>
      <div className="pm2-page">
        <div className="pm2-shell-wrap">
          <div className="pm2-shell">
            {/* ── Main ──────────────────────────────────────────────── */}
            <main className="pm2-main">
              {/* ── Header row — search, filters, view controls ─────── */}
              <div className="pm2-toolbar saas-header-container sc-header">
                <div className="pm2-head-id">
                  <span className="pm2-head-ic"><ApartmentOutlined /></span>
                  <span className="pm2-head-text">
                    <span className="pm2-head-title">Projects Management</span>
                    <span className="pm2-head-sub">Oversee initiatives</span>
                  </span>
                </div>

                <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

                <div className="sc-header-controls">
                  <Input
                    placeholder="Quick search project name..."
                    prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                    className="saas-input"
                    style={{ maxWidth: 280, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
                    value={filters.search || ""}
                    onChange={(e) => handleSearch(e.target.value)}
                    allowClear
                  />

                  <Space.Compact className="ticket-filter-group">
                    <Popover
                      content={
                        <ProjectFilters
                          filters={{
                            status: filters.status || undefined,
                            projectManagerId: filters.projectManagerId || undefined,
                            dateRange,
                          }}
                          onFilterChange={(key: any, val: any) => {
                            if (key === 'status') handleStatusFilter(val ?? null);
                            if (key === 'projectManagerId') handleProjectManagerFilter(val ?? null);
                            if (key === 'dateRange') { setDateRange(val); handleDateRangeFilter(val); }
                          }}
                          onReset={resetFilters}
                          statusOptions={PROJECT_STATUS_OPTIONS}
                          managerOptions={members.map((m) => ({
                            value: m.value,
                            label: m.label,
                            description: m.position,
                            avatarUrl: m.avatarUrl,
                          }))}
                        />
                      }
                      trigger="click"
                      open={isFilterPanelOpen}
                      onOpenChange={setIsFilterPanelOpen}
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
                      onClick={() => setIsFilterRowOpen((v) => !v)}
                    />
                  </Space.Compact>
                </div>

                {/* Right side — the status switch that used to live in the
                    rail, then the view controls. */}
                <Space size={10} className="sc-header-right">
                  <Segmented
                    className="saas-segmented-premium sc-owner-seg"
                    value={filters.status || 'all'}
                    onChange={(v: any) => handleStatusFilter(v === 'all' ? null : String(v))}
                    options={PROJECT_VIEW_SEGMENTS.map((seg) => ({
                      value: seg.k,
                      label: (
                        <span className="sc-owner-opt">
                          <span className="sc-owner-opt__ic">{seg.icon}</span>
                          <span className="sc-owner-opt__label">{seg.label}</span>
                          <span className="sc-owner-opt__count">{seg.count}</span>
                        </span>
                      ),
                    }))}
                  />

                  <Segmented
                    className="saas-segmented-premium"
                    value={viewMode}
                    onChange={(v: any) => setViewMode(v)}
                    options={[
                      { value: 'table', label: (<Tooltip title="Table View" mouseEnterDelay={0.5}><span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}><UnorderedListOutlined style={{ fontSize: 13 }} /></span></Tooltip>) },
                      { value: 'card', label: (<Tooltip title="Card View" mouseEnterDelay={0.5}><span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}><AppstoreOutlined style={{ fontSize: 13 }} /></span></Tooltip>) },
                    ]}
                  />

                  <Tooltip title="Refresh projects">
                    <Button
                      icon={<ReloadOutlined spin={isRefreshing} />}
                      onClick={async () => {
                        setIsRefreshing(true);
                        await loadProjects();
                        setIsRefreshing(false);
                        message.success("Projects view synchronized");
                      }}
                      disabled={loading}
                      style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  </Tooltip>

                  {canCreateProject && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAdd}
                      style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
                    >
                      Add Project
                    </Button>
                  )}
                </Space>
              </div>

              {/* ── Inline filter row — the pill strip the Ticket List uses ── */}
              {isFilterRowOpen && (
                <div className="tl-filter-row">
                  <div className="tl-filter-row-label">
                    <FilterOutlined style={{ fontSize: 11 }} />
                    <span>Filters</span>
                    <span className="tl-filter-row-count">{activeFilterCount > 0 ? activeFilterCount : '0'}</span>
                  </div>
                  <div className="tl-filter-row-pills">
                    <TicketFilterPill
                      icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                      label="Status"
                      value={filters.status || ""}
                      options={PROJECT_STATUS_OPTIONS}
                      onChange={(val: any) => handleStatusFilter(val ?? null)}
                      itemNoun="statuses"
                      multiple={false}
                    />
                    <TicketFilterPill
                      icon={<UserOutlined style={{ fontSize: 11 }} />}
                      label="Project Manager"
                      value={filters.projectManagerId || ""}
                      options={members.map((m) => ({
                        value: m.value,
                        label: m.label,
                        description: m.position,
                        avatarUrl: m.avatarUrl,
                      }))}
                      onChange={(val: any) => handleProjectManagerFilter(val ?? null)}
                      itemNoun="managers"
                      width={260}
                      multiple={false}
                      showAvatar
                    />
                    <DatePicker.RangePicker
                      className="premium-range-picker"
                      size="small"
                      style={{ height: 28 }}
                      placeholder={["Start", "End"]}
                      value={dateRange as any}
                      onChange={(v) => { setDateRange(v as any); handleDateRangeFilter(v as any); }}
                      format="DD MMM YY"
                      allowEmpty={[true, true]}
                    />
                  </div>
                  <div className="tl-filter-row-actions">
                    {activeFilterCount > 0 && (
                      <button type="button" className="tl-filter-row-reset" onClick={resetFilters}>
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

              {/* ── Overview banner — the Ticket List's sprint head, reading
                   the project portfolio. ─────────────────────────────── */}
              <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
                <div className="tl-sprint-row1">
                  <div className="tl-sprint-title-block">
                    <span
                      className="tl-sprint-dot"
                      style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
                    />
                    <span className="tl-sprint-title pm2-banner-title">
                      Projects — {activeStatusLabel}
                    </span>
                    <span className="tl-sprint-tags">
                      <span className="tl-sprint-tag tl-sprint-tag-neutral">{stats.total} PROJECTS</span>
                      {stats.active > 0 && (
                        <span className="tl-sprint-tag tl-sprint-tag-active">{stats.active} ACTIVE</span>
                      )}
                      {activeFilterCount > 0 && (
                        <span className="tl-sprint-tag tl-sprint-tag-running">{activeFilterCount} FILTERED</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="tl-sprint-row2">
                  <span className="tl-sprint-meta">
                    <span className="pm2-pulse-dot" />
                    <b>{projects.length}</b> {projects.length === 1 ? "result" : "results"} on this page
                  </span>
                  <span className="tl-sprint-meta"><b>{stats.active}</b> active</span>
                  <span className="tl-sprint-meta"><b>{stats.onHold}</b> on hold</span>
                  <span className="tl-sprint-meta"><b>{stats.completed}</b> completed</span>
                </div>

                <div className="tl-sprint-row3">
                  <div className="tl-sprint-progress-bar">
                    <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, completedPct)}%` }} />
                  </div>
                  <span className="tl-sprint-progress-pct">{completedPct}%</span>
                </div>
              </div>

              <div className="pm2-main-content">
                <div className="pm2-list-area" >
                  {/* Projects Card View - DASHBOARD STYLE */}
                  {viewMode === "card" ? (
                    projects.length === 0 && !loading ? (
                      <div className="pm2-empty-wrap" style={{
                        padding: "20px 20px",
                        borderRadius: 16,
                        border: "1px dashed var(--border-color)",
                        textAlign: "center",
                        background: "var(--bg-pure-white)",
                      }}>
                        <NoData description={
                                                                          <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>
                                                                            {hasActiveFilters ? "No projects match your filters" : "No projects yet — create your first one"}
                                                                          </Text>
                                                                        } />
                      </div>
                    ) : (
                      <div className="pm2-grid">
                        {loading
                          ? [1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="pm2-card pm2-card--skel">
                              <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                            </div>
                          ))
                          : projects.map((project) => {
                            const memberCount = project.members?.length || 0;
                            const statusColorMap: Record<string, string> = {
                              planning: "#3b82f6",
                              active: "#10b981",
                              "on-hold": "#64748b",
                              completed: "#10b981",
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

                            /* The date line and its note, the way the reference card reads:
                               a range on top, and underneath either how far past due it is
                               or how it closed. */
                            const start = project.startDate ? dayjs(project.startDate) : null;
                            const end = project.endDate ? dayjs(project.endDate) : null;
                            const isClosed = ["completed", "cancelled"].includes(project.status?.toLowerCase());
                            const daysOver = end && !isClosed ? dayjs().diff(end, "day") : 0;
                            const dateLine = start && end
                              ? `${start.format("MMM D")} – ${end.format("MMM D")}`
                              : end
                                ? end.format("MMM D")
                                : start
                                  ? `${start.format("MMM D")} – TBD`
                                  : "—";
                            const dateNote = !end
                              ? "No end date set"
                              : isClosed
                                ? "Closed"
                                : daysOver > 0
                                  ? `${daysOver} day${daysOver === 1 ? "" : "s"} overdue`
                                  : `${Math.abs(daysOver)} days left`;

                            return (
                              <article
                                key={project.id}
                                className="pm2-card"
                                style={{ ["--card-accent" as any]: accent }}
                                role="button"
                                tabIndex={0}
                                onClick={() => router.push(`/projects/${project.id}/overview`)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    router.push(`/projects/${project.id}/overview`);
                                  }
                                }}
                              >
                                <span className="pm2-card__stripe" />

                                <div className="pm2-card__top">
                                  <span className="pm2-card__badge">
                                    {(project.code || project.name).slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="pm2-card__status">
                                    <span className="pm2-card__status-dot" />
                                    {project.status?.replace(/-/g, " ")}
                                  </span>
                                  <span className="pm2-card__more" onClick={(e) => e.stopPropagation()}>
                                    <Dropdown
                                      overlayClassName="pm2-action-pop"
                                      menu={actionMenu(project)}
                                      trigger={['click']}
                                      placement="bottomRight"
                                    >
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<MoreHorizontal size={15} style={{ color: "#94a3b8" }} />}
                                        style={{ padding: 2, height: 'auto', minWidth: 'auto' }}
                                      />
                                    </Dropdown>
                                  </span>
                                </div>

                                <h3 className="pm2-card__title" title={project.name}>{project.name}</h3>

                                <p className="pm2-card__meta">
                                  {[
                                    project.code || `#${project.id.slice(0, 8)}`,
                                    `${memberCount} member${memberCount === 1 ? "" : "s"}`,
                                    project.description || null,
                                  ].filter(Boolean).join(" · ")}
                                </p>

                                {/* The reference puts a priority meter here; a project's
                                    equivalent read is how far through its window it is. */}
                                <div className="pm2-card__gauge">
                                  <span className="pm2-card__bars">
                                    {[1, 2, 3, 4].map((i) => (
                                      <span
                                        key={i}
                                        className={`pm2-card__bar${progress >= i * 25 ? " is-on" : ""}`}
                                      />
                                    ))}
                                  </span>
                                  <span className="pm2-card__gauge-label">{progress}% elapsed</span>
                                </div>

                                <div className="pm2-card__foot">
                                  <span className="pm2-card__people" title={`Manager: ${pmFullName}`}>
                                    <Avatar size={22} src={pm?.avatarUrl} className="pm2-card__av">
                                      {pmFullName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    {memberCount > 0 && (
                                      <span className="pm2-card__av pm2-card__av--count">+{memberCount}</span>
                                    )}
                                  </span>
                                  <span className="pm2-card__dates">
                                    <span className="pm2-card__date">{dateLine}</span>
                                    <span className={`pm2-card__note${daysOver > 0 ? " is-late" : ""}`}>
                                      {daysOver > 0 && <span className="pm2-card__note-dot" />}
                                      {dateNote}
                                    </span>
                                  </span>
                                </div>
                              </article>
                            );
                          })}
                      </div>
                    )
                  ) : (
                    /* ===== TABLE VIEW ===== */
                    <div className="pm-table-wrap">
                      <ZukvoLoadingOverlay loading={loading} message="">
                        <Table
                          size="small"
                          className="premium-table"
                          columns={columns}
                          dataSource={projects}
                          rowKey="id"
                          pagination={false}
                          scroll={{ x: 1200 }}
                          onChange={handleTableChange}
                          onRow={(record) => ({
                            onClick: () => {
                              router.push(`/projects/${record.id}/overview`);
                            },
                          })} locale={{ emptyText: <NoData /> }}
                        />
                      </ZukvoLoadingOverlay>
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
        .pm2-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
          align-items: stretch;
          min-height: calc(100vh - 54px);
        }
        .pm2-main {
          min-width: 0;
          padding: 0;
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
        }
        /* The table runs edge to edge; the card grid keeps a gutter. */
        .pm2-main-content { padding: 0; }
        .pm2-grid { padding: 12px 16px 16px; }
        .pm2-empty-wrap { margin: 12px 16px 16px; }
        .pm2-pagination { padding: 8px 16px; margin: 0; }

        /* ── Header row, matched to the Ticket List ─────────────────────── */
        .pm2-toolbar.sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: auto;
          min-height: 0;
          margin: 0;
          padding: 9.7px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .pm2-toolbar.sc-header { background: #0f1419; border-bottom-color: #1f2937; }
        .sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .sc-header-right { flex-shrink: 0; }

        .pm2-head-id { display: flex; align-items: center; gap: 9px; min-width: 0; flex-shrink: 0; }
        .pm2-head-ic {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px; font-size: 14px;
          color: #3B82F6; background: rgba(59,130,246,0.10); border: 1px solid rgba(59,130,246,0.18);
        }
        .pm2-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pm2-head-title { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.2; }
        .pm2-head-sub { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-slate-400); margin-top: 1px; }
        [data-theme='dark'] .pm2-head-title { color: #f1f5f9; }

        .sc-owner-seg .ant-segmented-item-label { padding: 0 4px; }
        .sc-owner-opt { display: inline-flex; align-items: center; gap: 6px; height: 100%; }
        .sc-owner-opt__ic { display: inline-flex; align-items: center; font-size: 11px; }
        .sc-owner-opt__label { font-size: 12px; font-weight: 600; white-space: nowrap; }
        .sc-owner-opt__count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 17px; padding: 0 5px;
          border-radius: 999px; background: var(--bg-slate-100); color: var(--text-slate-500);
          font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .ant-segmented-item-selected .sc-owner-opt__count { background: var(--bg-blue-50); color: #3B82F6; }
        [data-theme='dark'] .sc-owner-opt__count { background: #1e293b; color: #94a3b8; }
        @media (max-width: 1360px) { .sc-owner-opt__label { display: none; } }

        /* ── Overview banner ────────────────────────────────────────────── */
        .tl-section-head {
          padding: 10px 16px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-section-head { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-sprint-head-v2 { display: flex; flex-direction: column; gap: 6px; }
        .tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .tl-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .tl-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .pm2-banner-title {
          font-size: 14px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        [data-theme='dark'] .pm2-banner-title { color: #f1f5f9; }
        .tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .tl-sprint-tag {
          display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px;
          border: 1px solid transparent; text-transform: uppercase; line-height: 1;
        }
        .tl-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16,185,129,0.32); }
        .tl-sprint-tag-neutral { background: transparent; color: #64748b; border-color: rgba(100,116,139,0.32); }
        .tl-sprint-tag-running { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }
        [data-theme='dark'] .tl-sprint-tag-active { color: #34d399; }

        .tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
        .tl-sprint-meta {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
        }
        .tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
        [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
        [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

        .tl-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 15px; }
        .tl-sprint-progress-bar {
          flex: 1 1 auto; position: relative; height: 6px;
          background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px;
        }
        [data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
        .tl-sprint-progress-fill {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px; transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900);
          font-variant-numeric: tabular-nums; min-width: 36px; text-align: right;
        }
        [data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        /* ── Inline filter row ──────────────────────────────────────────── */
        .tl-filter-row {
          display: flex; align-items: center; gap: 10px; padding: 8px 16px;
          background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-filter-row { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-filter-row-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10.5px; font-weight: 800; color: var(--text-slate-500);
          text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
        }
        .tl-filter-row-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 6px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500); border-radius: 999px;
          font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .tl-filter-row-pills { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .tl-filter-row-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
        .tl-filter-row-reset {
          display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
          background: transparent; border: 1px dashed var(--border-slate-200); border-radius: 8px;
          font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-slate-500); cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8; border-color: rgba(59,130,246,0.45);
          background: rgba(59,130,246,0.06); border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; background: transparent;
          border: 1px solid var(--border-slate-200); border-radius: 8px;
          color: var(--text-slate-500); cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .tl-filter-row-close:hover { color: var(--text-slate-900); background: var(--bg-pure-white); border-color: var(--text-slate-400); }
        [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
        [data-theme='dark'] .tl-filter-row-count { background: #111720; border-color: #2d3748; color: #cbd5e1; }
        [data-theme='dark'] .tl-filter-row-reset,
        [data-theme='dark'] .tl-filter-row-close { border-color: #2d3748; color: #94a3b8; }
        @media (max-width: 900px) {
          .tl-filter-row-label { display: none; }
          .tl-sprint-row2, .tl-sprint-row3 { padding-left: 0; }
        }
        [data-theme="dark"] .pm2-main {
          background: transparent !important;
        }

        /* ── Action Menu Dropdown (Premium Style) ────────────────────────────────── */
        .pm2-action-pop .ant-dropdown-menu {
          padding: 6px !important;
          border-radius: 0px !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04) !important;
          border: 1px solid var(--border-slate-200) !important;
        }
        .pm2-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
        .pm2-action-pop,
        .pm2-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .pm2-action-pop ::-webkit-scrollbar { display: none !important; }
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

        /* Dark Theme overrides */
        [data-theme='dark'] .pm2-action-pop .ant-dropdown-menu,
        [data-theme="dark"] .pm2-action-pop .ant-dropdown-menu {
          background-color: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .pm2-action-pop .ant-dropdown-menu-item:hover,
        [data-theme="dark"] .pm2-action-pop .ant-dropdown-menu-item:hover {
          background: #161B22 !important;
        }
        [data-theme='dark'] .pm2-action-pop .pm2-menu-title,
        [data-theme="dark"] .pm2-action-pop .pm2-menu-title {
          color: #FFFFFF !important;
        }
        [data-theme='dark'] .pm2-action-pop .pm2-menu-desc,
        [data-theme="dark"] .pm2-action-pop .pm2-menu-desc {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .pm2-action-pop .ant-dropdown-menu-item-divider,
        [data-theme="dark"] .pm2-action-pop .ant-dropdown-menu-item-divider {
          background: #1F2937 !important;
        }
        [data-theme='dark'] .pm2-action-pop .ant-dropdown-menu-item-danger:hover,
        [data-theme="dark"] .pm2-action-pop .ant-dropdown-menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.15) !important;
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
          background: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
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
        [data-theme='dark'] .pp-segmented {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .pp-segmented button.is-active {
          background: #161B22 !important;
          color: #FFFFFF !important;
        }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        [data-theme='dark'] .pp-ghost-btn {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .pp-ghost-btn:hover {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #3B82F6 !important;
        }
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
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
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
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #cbd5e1 !important;
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
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
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
        
        /* The card is designed narrow, so the grid flows to fit rather than
           stretching two of them across the pane. */
        .pm2-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
          gap: 12px;
        }
        @media (max-width: 640px) {
          .pm2-grid { grid-template-columns: 1fr; }
        }

        /* ── Project card ───────────────────────────────────────────────── */
        .pm2-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .pm2-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(15,23,42,0.07);
        }
        .pm2-card:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
        .pm2-card--skel { cursor: default; padding: 14px; min-height: 168px; }
        .pm2-card--skel:hover { border-color: var(--border-slate-200); box-shadow: none; }
        [data-theme='dark'] .pm2-card { background: #0f1419; border-color: #1f2937; }
        [data-theme='dark'] .pm2-card:hover { border-color: #334155; }

        /* The status reads twice: as a stripe along the top edge and as a pill. */
        .pm2-card__stripe {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--card-accent, #3b82f6);
        }

        .pm2-card__top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .pm2-card__badge {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 34px; height: 34px; border-radius: 8px;
          background: color-mix(in srgb, var(--card-accent, #3b82f6) 12%, transparent);
          color: var(--card-accent, #3b82f6);
          font-size: 11.5px; font-weight: 800; letter-spacing: -0.01em;
        }
        .pm2-card__status {
          display: inline-flex; align-items: center; gap: 5px; margin-left: auto;
          height: 22px; padding: 0 9px; border-radius: 999px;
          background: color-mix(in srgb, var(--card-accent, #3b82f6) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--card-accent, #3b82f6) 24%, transparent);
          color: var(--card-accent, #3b82f6);
          font-size: 11px; font-weight: 700; text-transform: capitalize; white-space: nowrap;
        }
        .pm2-card__status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .pm2-card__more { flex-shrink: 0; display: inline-flex; }

        .pm2-card__title {
          margin: 0 0 4px;
          font-size: 14.5px; font-weight: 700; line-height: 1.3;
          color: var(--text-slate-900); letter-spacing: -0.01em;
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
        }
        [data-theme='dark'] .pm2-card__title { color: #f1f5f9; }
        .pm2-card__meta {
          margin: 0 0 12px;
          font-size: 12px; line-height: 1.45; color: var(--text-slate-500);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 34px;
        }

        .pm2-card__gauge { display: flex; align-items: center; gap: 8px; padding-bottom: 12px; }
        .pm2-card__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
        .pm2-card__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
        .pm2-card__bar.is-on { background: var(--card-accent, #3b82f6); }
        [data-theme='dark'] .pm2-card__bar { background: #1f2937; }
        .pm2-card__gauge-label { font-size: 12px; font-weight: 500; color: var(--text-slate-600); }
        [data-theme='dark'] .pm2-card__gauge-label { color: #94a3b8; }

        .pm2-card__foot {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          margin: 0 -14px; padding: 10px 14px;
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .pm2-card__foot { border-top-color: #1f2937; }
        .pm2-card__people { display: inline-flex; align-items: center; }
        .pm2-card__av.ant-avatar,
        .pm2-card__av {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--bg-slate-100); color: var(--text-slate-600);
          border: 2px solid var(--bg-pure-white);
          font-size: 9.5px; font-weight: 800;
        }
        .pm2-card__av + .pm2-card__av { margin-left: -7px; }
        .pm2-card__av--count { background: var(--bg-blue-50); color: #3B82F6; }
        [data-theme='dark'] .pm2-card__av { border-color: #0f1419; background: #1e293b; color: #cbd5e1; }

        .pm2-card__dates { display: flex; flex-direction: column; align-items: flex-end; min-width: 0; }
        .pm2-card__date {
          font-size: 12px; font-weight: 600; color: var(--text-slate-700);
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        [data-theme='dark'] .pm2-card__date { color: #cbd5e1; }
        .pm2-card__note {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--text-slate-400); white-space: nowrap; margin-top: 1px;
        }
        .pm2-card__note.is-late { color: #dc2626; font-weight: 600; }
        .pm2-card__note-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .pm2-main-content {
          padding-bottom: 24px;
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
          background: #0B0F1A !important;
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
          .pm2-search-box {
            width: 220px;
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
        }

        /* Sidebar collapses above content */
        @media (max-width: 900px) {
          .pm2-shell {
            grid-template-columns: 1fr;
          }
        }

        /* Phone */
        @media (max-width: 640px) {
          .pm2-toolbar {
            flex-direction: column;
            align-items: stretch;
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
          /* Pagination */
          .pm2-pagination {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            margin: 0;
            padding: 10px 12px;
          }
          .pm2-pagination-meta {
            text-align: center;
          }
        }

        /* ── Premium Table CSS ───────────────────────────────────── */
        .pm-table-wrap {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-left: none;
          border-right: none;
          border-radius: 0;
          overflow-x: auto;
          margin-top: 0 !important;
        }
        [data-theme='dark'] .pm-table-wrap { background: #0f1419; border-color: #1f2937; }
        .premium-table .ant-table, .premium-table .ant-table-wrapper, .premium-table .ant-table-container, .premium-table .ant-table-content, .premium-table .ant-table-header, .premium-table .ant-table-body {
          background: transparent !important;
          border-radius: 0 !important;
        }
        .premium-table .ant-table-thead > tr > th, .premium-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 800 !important; letter-spacing: 0.04em !important;
          text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 5px 10px !important;
          white-space: nowrap !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
        }
        .premium-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th,
        [data-theme='dark'] .premium-table .ant-table-thead > tr > td {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 6px 10px !important;
          font-size: 11.5px !important;
          line-height: 1.35 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
        }
        .premium-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .premium-table .ant-table-row { cursor: pointer; }
        .premium-table .ant-table-row:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td {
          background: #1e293b !important;
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

        /* ── Tablet / Mobile <1100px ────────────────────────── */
        @media (max-width: 1099.98px) {
          .pm2-shell {
            display: flex;
            flex-direction: column;
            grid-template-columns: none;
            min-height: auto;
          }
        }
      `}</style>
      </div>
    </MainLayout>
  );
};

export default function ProjectsManagePage() {
  console.log("Forcing HMR reload for ProjectsManagePage");
  return (
    <React.Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading projects...</div>}>
      <ProjectsManageContent />
    </React.Suspense>
  );
}
