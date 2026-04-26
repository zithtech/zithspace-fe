"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  notification,
  Progress,
  Tag,
  Drawer,
  List,
  Avatar,
  Spin,
  Empty,
  Popconfirm,
  Tooltip,
  ConfigProvider,
  Divider,
} from "antd";
import type { NotificationArgsProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
  PieChartOutlined,
  HistoryOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import ReleasePlanService, {
  ReleasePlan,
  ReleasePlanFormData,
  ProjectTicket,
} from "@/services/releasePlanService";
import { ProjectService } from "@/services/projectService";
import { SprintCompletionModal } from "./sprint-completion";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function SprintPlanComponent() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification({
    placement: 'top',
  });

  // State management
  const [sprintPlans, setSprintPlans] = useState<ReleasePlan[]>([]);
  const [allPlans, setAllPlans] = useState<ReleasePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ReleasePlan | null>(null);
  const [projects, setProjects] = useState<
    Array<{ value: string; label: string; code: string }>
  >([]);

  // Ticket selection state
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [availableTickets, setAvailableTickets] = useState<ProjectTicket[]>([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Drawer state for ticket details
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerSprintPlan, setDrawerSprintPlan] = useState<ReleasePlan | null>(null);

  // Sprint Completion Modal state
  const [sprintCompletionModalOpen, setSprintCompletionModalOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Table Filters state
  const [tableFilters, setTableFilters] = useState({
    search: "",
    projectId: "",
    status: "",
  });

  useEffect(() => {
    loadData();
    loadProjects();
  }, []);

  const loadData = async (filtersOverride?: any) => {
    try {
      setLoading(true);
      const activeFilters = filtersOverride || tableFilters;
      // Only fetch sprint_plan type
      const data = await ReleasePlanService.getReleasePlans({
        type: "sprint_plan",
        search: activeFilters.search || undefined,
        projectId: activeFilters.projectId || undefined,
        status: activeFilters.status || undefined,
      });
      setSprintPlans(data?.data || []);
      // Also fetch all plans for metrics if this is the first load or filters cleared
      if (!activeFilters.search && !activeFilters.projectId && !activeFilters.status) {
        setAllPlans(data?.data || []);
      } else if (allPlans.length === 0) {
        // Fallback for first load with filters
        const allData = await ReleasePlanService.getReleasePlans({ type: "sprint_plan" });
        setAllPlans(allData?.data || []);
      }


    } catch (error) {
      console.error("Failed to load sprint plans:", error);
      api.error({
        message: "Error",
        description: "Failed to load sprint plans",
        
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [tableFilters.search]);

  // Immediate load for status/project
  useEffect(() => {
    loadData();
  }, [tableFilters.projectId, tableFilters.status]);

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.getProjectsForSelect();
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadTicketsByProject = useCallback(
    async (projectId: string, search?: string, isSearching?: boolean) => {
      if (!projectId) return;

      try {
        if (isSearching) {
          setSearchLoading(true);
        } else {
          setTicketLoading(true);
        }

        const tickets = await ReleasePlanService.getTicketsByProject(
          projectId,
          {
            search: search || undefined,
            limit: search ? 50 : 20,
            excludeReleasePlan: editingPlan?.id,
          }
        );

        setAvailableTickets(tickets || []);
      } catch (error) {
        console.error("Failed to load tickets:", error);
        setAvailableTickets([]);
      } finally {
        setTicketLoading(false);
        setSearchLoading(false);
      }
    },
    [editingPlan]
  );

  const handleProjectChange = useCallback(
    (projectId: string) => {
      if (searchTimer) {
        clearTimeout(searchTimer);
        setSearchTimer(null);
      }

      setSelectedProject(projectId);
      setTicketSearch("");
      setAvailableTickets([]);
      if (projectId) {
        loadTicketsByProject(projectId);
      }
    },
    [loadTicketsByProject, searchTimer]
  );

  const handleTicketSearch = useCallback(
    (value: string) => {
      setTicketSearch(value);
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      const newTimer = setTimeout(() => {
        if (selectedProject) {
          loadTicketsByProject(
            selectedProject,
            value.trim() || undefined,
            true
          );
        }
      }, 300);

      setSearchTimer(newTimer);
    },
    [selectedProject, loadTicketsByProject, searchTimer]
  );

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const formData: ReleasePlanFormData = {
        version: values?.name || "",
        description: values?.description || "",
        projectId: values?.project || "",
        releaseDate: values?.deadline?.toISOString() || "",
        startDate: values?.startDate?.toISOString() || undefined,
        endDate: values?.endDate?.toISOString() || undefined,
        goal: values?.goal || "",
        status: "planning",
        type: "sprint_plan",
        tickets: values?.tickets || [],
      };

      if (editingPlan) {
        await ReleasePlanService.updateReleasePlan(editingPlan.id, formData);
        api.success({
          message: "Success",
          description: "Sprint Plan updated successfully",
          
        });
      } else {
        await ReleasePlanService.createReleasePlan(formData);
        api.success({
          message: "Success",
          description: "Sprint Plan created successfully",
          
        });
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error("Failed to save Sprint Plan:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to save Sprint Plan",
        
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan: ReleasePlan) => {
    setEditingPlan(plan);
    const projectId = typeof plan?.project === "object" ? plan.project?.id : "";
    setSelectedProject(projectId || "");

    const ticketIds = plan?.tickets?.map((t) => t?.id) || [];

    form.setFieldsValue({
      name: plan?.name,
      description: plan?.description,
      project: projectId,
      deadline: plan?.deadline ? dayjs(plan.deadline) : null,
      startDate: plan?.startDate ? dayjs(plan.startDate) : null,
      endDate: plan?.endDate ? dayjs(plan.endDate) : null,
      goal: plan?.goal,
      priority: plan?.priority,
      tickets: ticketIds,
    });

    if (projectId) {
      loadTicketsByProject(projectId);
    }
    setShowCreateModal(true);
  };

  const handleDelete = async (planId: string) => {
    try {
      await ReleasePlanService.deleteReleasePlan(planId);
      api.success({
        message: "Success",
        description: "Sprint Plan deleted successfully",
        
      });
      loadData();
    } catch (error) {
      console.error("Failed to delete Sprint Plan:", error);
    }
  };

  const handleStartSprint = async (plan: ReleasePlan) => {
    try {
      await ReleasePlanService.startSprint(plan.id);
      api.success({
        message: "Success",
        description: "Sprint started successfully",
        
      });
      loadData();
    } catch (error: any) {
      api.error({
        message: "Error",
        description: error.message || "Failed to start sprint",
        
      });
    }
  };

  const handleCompleteSprint = (plan: ReleasePlan) => {
    setSelectedSprintId(plan.id);
    setSprintCompletionModalOpen(true);
  };

  const handleSprintCompletionSuccess = () => {
    setSprintCompletionModalOpen(false);
    setSelectedSprintId(null);
    loadData();
    api.success({
      message: "Success",
      description: "Sprint completed successfully",
      
    });
  };

  const handleCloseModal = () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      setSearchTimer(null);
    }
    setShowCreateModal(false);
    setEditingPlan(null);
    setSelectedProject("");
    setTicketSearch("");
    setAvailableTickets([]);
    setTicketLoading(false);
    setSearchLoading(false);
    form.resetFields();
  };

  const handleViewTickets = async (plan: ReleasePlan) => {
    setDrawerVisible(true);
    setDrawerSprintPlan(plan);
    try {
      const freshPlan = await ReleasePlanService.getReleasePlanById(plan.id);
      setDrawerSprintPlan(freshPlan);
    } catch (error) {
      console.error('Failed to fetch fresh sprint details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "active": return "processing";
      case "planning": return "default";
      case "cancelled": return "error";
      case "on_hold": return "warning";
      default: return "default";
    }
  };

  // Metrics calculation (Universal - based on allPlans)
  const metrics = useMemo(() => {
    const active = allPlans.filter(p => p.status === 'active').length;
    const planning = allPlans.filter(p => p.status === 'planning').length;
    const completed = allPlans.filter(p => p.status === 'completed').length;

    // Average progress
    const avgProgress = allPlans.length > 0
      ? Math.round(allPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / allPlans.length)
      : 0;

    return { active, planning, completed, avgProgress };
  }, [allPlans]);

  const columns = [
    {
      title: "Sprint Name",
      dataIndex: "name",
      key: "name",
      width: 420,
      render: (text: string, record: ReleasePlan) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description?.length > 40
              ? `${record.description.substring(0, 40)}...`
              : record.description || "No description"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Project",
      key: "project",
      width: 180,
      render: (_: any, record: ReleasePlan) => {
        const project = typeof record.project === 'object' ? record.project : null;
        return (
          <div style={{ padding: '4px 0' }}>
            {project ? (
              <Text strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>
                {project.name}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>{typeof record.project === 'string' ? record.project : 'N/A'}</Text>
            )}
          </div>
        );
      },
    },

    {
      title: "Current Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config = {
          active: { color: 'green', label: 'ACTIVE' },
          planning: { color: 'orange', label: 'PLANNING' },
          completed: { color: 'blue', label: 'COMPLETED' },
        }[status as 'active' | 'planning' | 'completed'] || { color: 'default', label: status?.toUpperCase() };

        return (
          <Tag className={`saas-tag saas-tag-${config.color}`} style={{ borderRadius: 4, fontWeight: 800 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Metric Progress",
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (progress: number, record: ReleasePlan) => (
        <Space size={8} style={{ width: '100%', minWidth: 150 }}>
          <Progress
            percent={progress || 0}
            size="small"
            strokeColor={progress >= 100 ? '#10b981' : '#3b82f6'}
            showInfo={false}
            trailColor="#f1f5f9"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: 900, color: progress >= 100 ? '#10b981' : '#3b82f6' }}>
              {progress || 0}%
            </Text>
            <Divider type="vertical" style={{ margin: 0, height: 12, background: 'var(--border-slate-200)' }} />
            <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', whiteSpace: 'nowrap' }}>
              {record?.completedTickets || 0}/{record?.totalTickets || 0}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Schedule",
      key: "timeline",
      width: 140,
      render: (_: any, record: ReleasePlan) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-slate-900)' }}>
            {record.startDate ? dayjs(record.startDate).format("MMM D") : "TBD"} — {record.endDate ? dayjs(record.endDate).format("MMM D") : "TBD"}
          </Text>
          <Text style={{ fontSize: 10, color: 'var(--text-slate-400)', fontWeight: 600 }}>
            {record.endDate && record.startDate ? `${dayjs(record.endDate).diff(dayjs(record.startDate), 'day')} days duration` : 'Duration TBD'}
          </Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: ReleasePlan) => (
        <Space size={4}>
          {record.status === 'planning' && (
            <Popconfirm
              title="Activate this cycle?"
              onConfirm={() => handleStartSprint(record)}
            >
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined style={{ color: '#10b981' }} />}
                className="saas-table-action"
              />
            </Popconfirm>
          )}
          {record.status === 'active' && (
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined style={{ color: '#3b82f6' }} />}
              onClick={() => handleCompleteSprint(record)}
              className="saas-table-action"
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: '#64748b' }} />}
            onClick={() => handleEdit(record)}
            className="saas-table-action"
          />
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: '#64748b' }} />}
            onClick={() => handleViewTickets(record)}
            className="saas-table-action"
          />
          <Popconfirm
            title="Purge this cycle record?"
            onConfirm={() => handleDelete(record.id)}
            okText="Purge"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="saas-table-action"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: "var(--bg-pure-white)", minHeight: "100vh" }}>
      {contextHolder}

      {/* Workstation Header */}
      <div className="saas-header-container" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        padding: '10.5px 48px',
        margin: '0 -24px 24px',
        marginBottom: 24
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size={16}>
              <div className="sp-header-icon-box">
                <CalendarOutlined style={{ fontSize: 18, color: '#3b82f6' }} />
              </div>
              <Space split={<Divider type="vertical" className="sp-header-divider" />} size={16}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                  Sprint Cycles
                </Title>
                <Text style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>
                  Engineered for continuous delivery and milestone tracking
                </Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space size={12}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadData()}
                loading={loading}
                className="saas-button-item"
                style={{ height: 36, fontWeight: 600 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
                className="saas-button-item"
                style={{
                  height: 36,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none'
                }}
              >
                Plan New Sprint
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "0 32px 32px" }}>
        {/* Unified High-Density Sprint Control Bar */}
        <div className="sp-control-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
            {/* 1. Technical Metrics Group */}
            <div className="sp-metrics-group">
              {/* Active Phase */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="sp-metric-icon blue">
                  <RocketOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
                </div>
                <div>
                  <Text style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>{metrics.active}</Text>
                  <Text style={{ fontSize: 9, color: 'var(--text-slate-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACTIVE</Text>
                </div>
              </div>

              {/* Shipped Cycles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="sp-metric-icon green">
                  <CheckCircleOutlined style={{ color: '#10b981', fontSize: 16 }} />
                </div>
                <div>
                  <Text style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>{metrics.completed}</Text>
                  <Text style={{ fontSize: 9, color: 'var(--text-slate-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>COMPLETED</Text>
                </div>
              </div>
            </div>

            {/* 2. Advanced Selection Suite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Project Context */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-slate-600)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>PROJECT:</Text>
                <Select
                  placeholder="All Projects"
                  variant="borderless"
                  className="sp-filter-select"
                  allowClear
                  value={tableFilters.projectId || undefined}
                  onChange={(val) => setTableFilters(prev => ({ ...prev, projectId: val || "" }))}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 320 }}
                >
                  <Option value="">
                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>PROJECT</Text>
                  </Option>
                  {projects?.map((project: any) => (
                    <Option key={project.value} value={project.value} label={project.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Text style={{ fontSize: 11, fontWeight: 600 }}>{project.label}</Text>
                        <Tag className="sp-project-code-tag">{project.code}</Tag>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Cycle State */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-slate-600)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>STATUS:</Text>
                <Select
                  variant="borderless"
                  className="sp-filter-select sp-filter-select-sm"
                  value={tableFilters.status || "all"}
                  onChange={(val) => setTableFilters(prev => ({ ...prev, status: val === "all" ? "" : val }))}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 220 }}
                >
                  <Option value="all">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                      <Text style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>ALL STATUS</Text>
                    </div>
                  </Option>
                  <Option value="active">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PlayCircleOutlined style={{ fontSize: 12, color: '#10b981' }} />
                        <Text style={{ fontSize: 11, fontWeight: 600 }}>ACTIVE PHASE</Text>
                      </div>
                      <Tag className="sp-status-tag green">LIVE</Tag>
                    </div>
                  </Option>
                  <Option value="planning">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PieChartOutlined style={{ fontSize: 12, color: '#f59e0b' }} />
                        <Text style={{ fontSize: 11, fontWeight: 600 }}>IN PLANNING</Text>
                      </div>
                      <Tag className="sp-status-tag orange">WAIT</Tag>
                    </div>
                  </Option>
                  <Option value="completed">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircleOutlined style={{ fontSize: 12, color: '#3b82f6' }} />
                        <Text style={{ fontSize: 11, fontWeight: 600 }}>COMPLETED</Text>
                      </div>
                      <Tag className="sp-status-tag blue">DONE</Tag>
                    </div>
                  </Option>
                </Select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 3. Deep Scan Search Module */}
            <div className={`sp-search-box ${tableFilters.search ? 'active' : ''}`}>
              <SearchOutlined style={{ color: tableFilters.search ? '#3b82f6' : '#94a3b8', fontSize: 13 }} />
              <Input
                placeholder="Seacrh Sprint Plans"
                variant="borderless"
                style={{ fontSize: 12, fontWeight: 700, padding: '8px 0', flex: 1 }}
                value={tableFilters.search}
                onChange={(e) => setTableFilters(prev => ({ ...prev, search: e.target.value }))}
                allowClear
              />

              {tableFilters.search ? (
                <div className="sp-search-active-badge">
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />
                  <Text style={{ fontSize: 9, fontWeight: 900, color: '#1d4ed8', letterSpacing: '0.04em' }}>ACTIVE</Text>
                </div>
              ) : (
                <div className="sp-search-kbd">
                  <Text style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-slate-400)' }}>⌘K</Text>
                </div>
              )}
            </div>

            {/* 4. Reset Command */}
            <div className="sp-reset-wrapper">
              <Button
                size="small"
                type="text"
                icon={<ReloadOutlined />}
                style={{ color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}
                onClick={() => {
                  setTableFilters({ search: "", projectId: "", status: "" });
                  loadData({ search: "", projectId: "", status: "" });
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Table */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
            background: "var(--bg-secondary)"
          }}
        >
          <Table
            columns={columns}
            dataSource={sprintPlans}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => <Text type="secondary" style={{ fontSize: 13 }}>Total <b>{total}</b> Sprints</Text>,
              style: { padding: '16px 24px' }
            }}
            className="premium-table"
            locale={{
              emptyText: (
                <Empty
                  image={<CalendarOutlined style={{ fontSize: 48, color: 'var(--border-color)' }} />}
                  description={
                    <div style={{ padding: '20px 0' }}>
                      <Text type="secondary" style={{ display: "block", fontSize: 16, fontWeight: 500 }}>No sprint plans found</Text>
                      <Button type="primary" onClick={() => setShowCreateModal(true)} style={{ marginTop: 16, borderRadius: 6 }}>
                        Create Your First Sprint
                      </Button>
                    </div>
                  }
                />
              )
            }}
          />
        </Card>

        {/* Create/Edit Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sp-drawer-icon-box">
                <RocketOutlined style={{ color: '#0369a1', fontSize: 20 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {editingPlan ? "Refine Sprint Parameters" : "Initiate New Sprint"}
                </Title>
                <Text style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-slate-600)' }}>
                  Configure the Plan
                </Text>
              </div>
            </div>
          }
          open={showCreateModal}
          onClose={handleCloseModal}
          width={560}
          maskClosable={true}
          destroyOnClose
          extra={
            <Space size="middle">
              <Button onClick={handleCloseModal} style={{ borderRadius: 0, fontWeight: 600 }}>Cancel</Button>
              <Button
                type="primary"
                loading={saving}
                onClick={handleCreateOrUpdate}
                style={{ fontWeight: 700, borderRadius: 0, background: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
              >
                {editingPlan ? "Update Sprint" : "Kick-off Sprint"}
              </Button>
            </Space>
          }
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-200)', padding: '20px 24px', background: 'var(--bg-pure-white)' },
            body: { padding: "24px", background: 'var(--bg-slate-50)' },
            mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.1)' }
          }}
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            <ConfigProvider theme={{ components: { Input: { borderRadius: 0 }, Select: { borderRadius: 0 }, DatePicker: { borderRadius: 0 } } }}>
              {/* Section: Basic Information */}
              <div className="sp-form-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div className="sp-section-icon slate">
                    <InfoCircleOutlined style={{ color: 'var(--text-slate-600)', fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>General Details</Text>
                </div>

                <Form.Item
                  label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Sprint Name</Text>}
                  name="name"
                  rules={[{ required: true, message: "Sprint Name is required" }]}
                  style={{ marginBottom: 20 }}
                >
                  <Input placeholder="e.g. Q2 Core Infrastructure - Sprint 04" size="middle" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Target Project</Text>} name="project" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select
                        placeholder="Select project"
                        size="middle"
                        onChange={handleProjectChange}
                        disabled={!!editingPlan}
                        options={projects}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Primary Objective</Text>} name="goal" style={{ marginBottom: 0 }}>
                      <Input placeholder="High-level goal..." size="middle" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Section: Timeline & Planning */}
              <div className="sp-form-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div className="sp-section-icon orange">
                    <CalendarOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Planning & Schedule</Text>
                </div>

                <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Release Cycle Duration</Text>} style={{ marginBottom: 20 }}>
                  <Select
                    placeholder="Select duration"
                    size="middle"
                    onChange={(val) => {
                      if (val === 'custom') return;
                      const start = form.getFieldValue('startDate') || dayjs();
                      let end = dayjs(start);
                      if (val === '1w') end = end.add(1, 'week');
                      if (val === '2w') end = end.add(2, 'week');
                      if (val === '4w') end = end.add(1, 'month');
                      form.setFieldsValue({ startDate: start, endDate: end, deadline: end });
                    }}
                  >
                    <Option value="custom">Manual Range</Option>
                    <Option value="1w">1 Week Sprint</Option>
                    <Option value="2w">2 Weeks (Standard)</Option>
                    <Option value="4w">Monthly Release</Option>
                  </Select>
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Start Date</Text>} name="startDate" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <DatePicker size="middle" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>End Date</Text>} name="endDate" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <DatePicker size="middle" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Section: Backlog Allocation */}
              <div className="sp-form-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div className="sp-section-icon green">
                    <ProjectOutlined style={{ color: '#10b981', fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-slate-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Backlog Allocation</Text>
                </div>

                <Form.Item
                  label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>Assign Selected Issues</Text>}
                  name="tickets"
                  tooltip="Map existing backlog tickets to this sprint session"
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    mode="multiple"
                    size="middle"
                    placeholder="ID or Title search..."
                    style={{ width: '100%' }}
                    onSearch={handleTicketSearch}
                    filterOption={false}
                    notFoundContent={ticketLoading ? <Spin size="small" /> : null}
                    options={availableTickets.map(t => ({
                      label: t.ticketNumber,
                      value: t.id,
                      item: t
                    }))}
                    dropdownStyle={{ borderRadius: 0 }}
                    optionRender={(option) => {
                      const t = option.data.item;
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                          <Space>
                            <Tag className="sp-ticket-num-tag">{t.ticketNumber}</Tag>
                            <Text ellipsis style={{ maxWidth: 220, fontSize: 13, fontWeight: 500 }}>{t.title}</Text>
                          </Space>
                          <Tag color={getStatusColor(t.status)} style={{ fontSize: 9, borderRadius: 0, fontWeight: 600 }}>{t.status.toUpperCase()}</Tag>
                        </div>
                      );
                    }}
                  />
                </Form.Item>
                <div className="sp-info-hint">
                  <HistoryOutlined style={{ fontSize: 12, color: 'var(--text-slate-600)' }} />
                  <Text style={{ fontSize: 10, color: 'var(--text-slate-600)', fontWeight: 500 }}>Only unassigned tickets from the selected project are visible</Text>
                </div>
              </div>
            </ConfigProvider>
            <Form.Item name="deadline" hidden><Input /></Form.Item>
          </Form>
        </Drawer>

        {/* Ticket Details Drawer */}
        <Drawer
          title={
            <div style={{ paddingTop: 8 }}>
              <Title level={4} style={{ margin: 0 }}>{drawerSprintPlan?.name}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Sprint Progress & Issue Tracking</Text>
            </div>
          }
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={600}
          extra={
            drawerSprintPlan?.status === 'active' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  handleCompleteSprint(drawerSprintPlan);
                  setDrawerVisible(false);
                }}
                style={{ borderRadius: 6 }}
              >
                Complete Sprint
              </Button>
            )
          }
        >
          {drawerSprintPlan && (
            <div>
              <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                  <Col><Text strong style={{ fontSize: 16 }}>Overall Completion</Text></Col>
                  <Col><Title level={4} style={{ margin: 0, color: '#1677ff' }}>{drawerSprintPlan?.progress || 0}%</Title></Col>
                </Row>
                <Progress
                  percent={drawerSprintPlan?.progress || 0}
                  status="active"
                  strokeWidth={12}
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  style={{ marginBottom: 12 }}
                />
                <Text type="secondary">
                  {drawerSprintPlan?.completedTickets || 0} of {drawerSprintPlan?.totalTickets || 0} issues resolved in this sprint
                </Text>
              </div>

              <Title level={5} style={{ marginBottom: 16 }}>Included Issues</Title>
              <List
                dataSource={drawerSprintPlan?.tickets || []}
                renderItem={(ticket) => (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid var(--border-color)',
                      marginBottom: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-pure-white)',
                      transition: 'all 0.3s'
                    }}
                    className="drawer-ticket-item"
                  >
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontFamily: 'monospace', color: '#1677ff', fontSize: 12, fontWeight: 700 }}>{ticket?.ticketNumber}</Text>
                        <Tag color={getStatusColor(ticket?.status)} style={{ fontSize: 10, borderRadius: 4 }}>{ticket?.status.toUpperCase()}</Tag>
                      </div>
                      <Text strong style={{ fontSize: 14 }}>{ticket?.title}</Text>
                      {ticket?.assignee && (
                        <div style={{ marginTop: 4 }}>
                          <Avatar size="small" style={{ fontSize: 10, backgroundColor: '#f56a00' }}>{ticket.assignee.name.charAt(0)}</Avatar>
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>{ticket.assignee.name}</Text>
                        </div>
                      )}
                    </div>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => router.push(`/tickets/${ticket?.id}`)}
                    >
                      View
                    </Button>
                  </div>
                )}
              />
            </div>
          )}
        </Drawer>

        {/* Completion Modal */}
        <SprintCompletionModal
          sprintId={selectedSprintId}
          open={sprintCompletionModalOpen}
          onClose={() => {
            setSprintCompletionModalOpen(false);
            setSelectedSprintId(null);
          }}
          onSuccess={handleSprintCompletionSuccess}
        />

        <style jsx global>{`
        /* ── Premium Table ────────────────────────────────────── */
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-pure-white);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #161b22 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          background: #161b22 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td {
          background: #1f2937 !important;
        }
        [data-theme='dark'] .premium-table .ant-table {
          background: #161b22 !important;
        }
        .drawer-ticket-item:hover {
          background: var(--bg-pure-white) !important;
          filter: brightness(0.98);
        }
        [data-theme='dark'] .drawer-ticket-item:hover {
          filter: brightness(1.1) !important;
        }

        /* ── Header icon ──────────────────────────────────────── */
        .sp-header-icon-box {
          width: 36px;
          height: 36px;
          background: var(--bg-blue-50);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-blue-200);
        }
        [data-theme='dark'] .sp-header-icon-box {
          background: rgba(59, 130, 246, 0.15) !important;
          border-color: rgba(59, 130, 246, 0.25) !important;
        }
        .sp-header-divider {
          height: 18px;
          border-left: 1.5px solid var(--border-slate-200);
          margin: 0;
        }

        /* ── Control bar ──────────────────────────────────────── */
        .sp-control-bar {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }
        [data-theme='dark'] .sp-control-bar {
          background: #161b22 !important;
          border-color: #1f2937 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }

        /* ── Metrics group ────────────────────────────────────── */
        .sp-metrics-group {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-right: 28px;
          border-right: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .sp-metrics-group {
          border-right-color: #1f2937 !important;
        }

        .sp-metric-icon {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-metric-icon.blue {
          background: var(--bg-blue-50);
          border: 1px solid var(--border-blue-200);
        }
        .sp-metric-icon.green {
          background: var(--bg-green-50);
          border: 1px solid var(--border-green-200);
        }
        [data-theme='dark'] .sp-metric-icon.blue {
          background: rgba(59, 130, 246, 0.15) !important;
          border-color: rgba(59, 130, 246, 0.2) !important;
        }
        [data-theme='dark'] .sp-metric-icon.green {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: rgba(16, 185, 129, 0.2) !important;
        }

        /* ── Filter selects ───────────────────────────────────── */
        .sp-filter-select {
          width: 190px;
          font-size: 13px;
          font-weight: 700;
          background: var(--bg-slate-50) !important;
          border-radius: 4px;
          border: 1px solid var(--border-slate-100);
          height: 38px;
          display: flex;
          align-items: center;
        }
        .sp-filter-select-sm { width: 150px; }
        [data-theme='dark'] .sp-filter-select {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .sp-filter-select .ant-select-selector {
          background: transparent !important;
          border: none !important;
          color: var(--text-slate-900) !important;
        }
        .sp-project-code-tag {
          margin: 0;
          font-size: 9px;
          font-weight: 800;
          background: var(--bg-slate-50);
          border: none;
          color: var(--text-slate-600);
        }
        [data-theme='dark'] .sp-project-code-tag {
          background: #374151 !important;
          color: #94a3b8 !important;
        }
        .sp-status-tag {
          margin: 0;
          font-size: 8px;
          font-weight: 900;
          border: none;
        }
        .sp-status-tag.green { background: var(--bg-green-50); color: #10b981; }
        .sp-status-tag.orange { background: var(--bg-orange-50); color: #f59e0b; }
        .sp-status-tag.blue { background: var(--bg-blue-50); color: #3b82f6; }
        [data-theme='dark'] .sp-status-tag.green { background: rgba(16,185,129,0.15) !important; color: #34d399 !important; }
        [data-theme='dark'] .sp-status-tag.orange { background: rgba(245,158,11,0.15) !important; color: #fbbf24 !important; }
        [data-theme='dark'] .sp-status-tag.blue { background: rgba(59,130,246,0.15) !important; color: #60a5fa !important; }

        /* ── Search box ───────────────────────────────────────── */
        .sp-search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-slate-50);
          padding: 2px 6px 2px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-100);
          width: 320px;
          transition: all 0.2s ease;
        }
        .sp-search-box.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.05);
        }
        [data-theme='dark'] .sp-search-box {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .sp-search-box.active {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        .sp-search-active-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-blue-50);
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid var(--border-blue-200);
          animation: pulse 2s infinite;
        }
        [data-theme='dark'] .sp-search-active-badge {
          background: rgba(59,130,246,0.15) !important;
          border-color: rgba(59,130,246,0.25) !important;
        }
        .sp-search-kbd {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 2px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        [data-theme='dark'] .sp-search-kbd {
          background: #0b0f1a !important;
          border-color: #374151 !important;
        }

        /* ── Reset wrapper ────────────────────────────────────── */
        .sp-reset-wrapper {
          border-left: 1px solid var(--border-slate-100);
          padding-left: 16px;
        }
        [data-theme='dark'] .sp-reset-wrapper {
          border-left-color: #1f2937 !important;
        }

        /* ── Create/Edit Drawer form sections ─────────────────── */
        .sp-form-section {
          background: var(--bg-pure-white);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-slate-200);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          margin-bottom: 20px;
        }
        [data-theme='dark'] .sp-form-section {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .sp-section-icon {
          padding: 6px;
          border-radius: 6px;
          display: flex;
        }
        .sp-section-icon.slate { background: var(--bg-slate-50); }
        .sp-section-icon.orange { background: var(--bg-orange-50); }
        .sp-section-icon.green { background: var(--bg-green-50); }
        [data-theme='dark'] .sp-section-icon.slate { background: #1f2937 !important; }
        [data-theme='dark'] .sp-section-icon.orange { background: rgba(249,115,22,0.12) !important; }
        [data-theme='dark'] .sp-section-icon.green { background: rgba(16,185,129,0.12) !important; }

        /* ── Info hint ────────────────────────────────────────── */
        .sp-info-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-slate-50);
          border-radius: 6px;
          border: 1px dashed var(--border-slate-200);
        }
        [data-theme='dark'] .sp-info-hint {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }

        /* ── Ticket number tag in dropdown ────────────────────── */
        .sp-ticket-num-tag {
          background: var(--bg-blue-50);
          border: 1px solid var(--border-blue-200);
          color: #2563eb;
          font-weight: 700;
          border-radius: 2px;
          font-size: 10px;
        }
        [data-theme='dark'] .sp-ticket-num-tag {
          background: rgba(59,130,246,0.15) !important;
          border-color: rgba(59,130,246,0.25) !important;
          color: #60a5fa !important;
        }

        /* ── Create/Edit Drawer header icon ───────────────────── */
        .sp-drawer-icon-box {
          padding: 8px;
          background: var(--bg-sky-50);
          border-radius: 8px;
          display: flex;
        }
        [data-theme='dark'] .sp-drawer-icon-box {
          background: rgba(14,165,233,0.15) !important;
        }

        /* ── Drawer dark overrides (Ant Design) ───────────────── */
        [data-theme='dark'] .ant-drawer-header {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
        }
        [data-theme='dark'] .ant-drawer-body {
          background: #0b0f1a !important;
        }
        [data-theme='dark'] .ant-drawer-title {
          color: var(--text-slate-900) !important;
        }
      `}</style>
      </div>
    </div>
  );
}
