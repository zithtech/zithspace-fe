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
  const [api, contextHolder] = notification.useNotification();

  // State management
  const [sprintPlans, setSprintPlans] = useState<ReleasePlan[]>([]);
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
      if (!loading && !activeFilters.search && !activeFilters.projectId && !activeFilters.status) { // Only show message if it's a manual refresh without filters
        api.success({
          message: "Refreshed",
          description: "Sprint plans updated successfully",
          placement: "bottomRight",
        });
      }
    } catch (error) {
      console.error("Failed to load sprint plans:", error);
      api.error({
        message: "Error",
        description: "Failed to load sprint plans",
        placement: "bottomRight",
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
          placement: "bottomRight",
        });
      } else {
        await ReleasePlanService.createReleasePlan(formData);
        api.success({
          message: "Success",
          description: "Sprint Plan created successfully",
          placement: "bottomRight",
        });
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error("Failed to save Sprint Plan:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to save Sprint Plan",
        placement: "bottomRight",
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
        placement: "bottomRight",
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
        placement: "bottomRight",
      });
      loadData();
    } catch (error: any) {
      api.error({
        message: "Error",
        description: error.message || "Failed to start sprint",
        placement: "bottomRight",
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
      placement: "bottomRight",
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

  // Metrics calculation
  const metrics = useMemo(() => {
    const active = sprintPlans.filter(p => p.status === 'active').length;
    const planning = sprintPlans.filter(p => p.status === 'planning').length;
    const completed = sprintPlans.filter(p => p.status === 'completed').length;

    // Average progress
    const avgProgress = sprintPlans.length > 0
      ? Math.round(sprintPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / sprintPlans.length)
      : 0;

    return { active, planning, completed, avgProgress };
  }, [sprintPlans]);

  const columns = [
    {
      title: "Sprint Name",
      dataIndex: "name",
      key: "name",
      width: 250,
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
      title: "Health & Progress",
      dataIndex: "progress",
      key: "progress",
      width: 220,
      render: (progress: number, record: ReleasePlan) => (
        <div style={{ width: 180 }}>
          <Progress
            percent={progress || 0}
            size="small"
            strokeColor={progress === 100 ? '#52c41a' : '#1677ff'}
            trailColor="var(--bg-secondary)"
          />
          <Space size={4} style={{ cursor: "pointer", color: "#1677ff", fontSize: 12 }} onClick={() => handleViewTickets(record)}>
            <CheckCircleOutlined style={{ fontSize: 11 }} />
            <span>{record?.completedTickets || 0}/{record?.totalTickets || 0} Tickets</span>
          </Space>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ borderRadius: 6, textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
          {status.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Timeline",
      key: "timeline",
      width: 200,
      render: (_: any, record: ReleasePlan) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Space size={6}>
            <CalendarOutlined style={{ color: 'var(--text-secondary)', fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>
              {record.startDate ? dayjs(record.startDate).format("MMM D") : "TBD"} - {record.endDate ? dayjs(record.endDate).format("MMM D") : "TBD"}
            </Text>
          </Space>
          {record.deadline && (
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 18 }}>
              Goal: {dayjs(record.deadline).format("MMM D, YYYY")}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: 'right' as const,
      render: (_: any, record: ReleasePlan) => (
        <Space size="small">
          {record.status === 'planning' && (
            <Popconfirm
              title="Start Sprint"
              description="Begin this sprint for the project?"
              onConfirm={() => handleStartSprint(record)}
              okText="Start"
            >
              <Tooltip title="Start Sprint">
                <Button
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'active' && (
            <Tooltip title="Complete Sprint">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined style={{ color: '#1677ff', fontSize: 16 }} />}
                onClick={() => handleCompleteSprint(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#8c8c8c' }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#8c8c8c' }} />}
              onClick={() => handleViewTickets(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Sprint"
            description="Are you sure?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 32px 32px", background: "var(--bg-pure-white)", minHeight: "100vh" }}>
      {contextHolder}

      {/* Header Section */}
      <div style={{
        padding: "24px 0",
        marginBottom: 32,
        borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-primary)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--bg-pure-white)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CalendarOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              </div>
              <Space direction="vertical" size={2}>
                <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Sprint Plans
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Plan, manage, and track your development sprints
                </Text>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadData()}
                loading={loading}
                style={{ height: 40, borderRadius: 8 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
                style={{ height: 40, borderRadius: 8, fontWeight: 600, boxShadow: "0 2px 4px rgba(22, 119, 255, 0.15)" }}
              >
                Create Sprint
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Summary Metrics Row */}
      {!loading && sprintPlans.length > 0 && (
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RocketOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Active Sprints</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{metrics.active}</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PieChartOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Planning Phase</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{metrics.planning}</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HistoryOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Avg Completion</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{metrics.avgProgress}%</Title>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BulbOutlined style={{ fontSize: 20, color: "#722ed1" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Total Finished</Text>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{metrics.completed}</Title>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters Section */}
      <div style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search sprint name..."
              prefix={<ProjectOutlined style={{ color: '#bfbfbf' }} />}
              value={tableFilters.search}
              onChange={(e) => setTableFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{ borderRadius: 8, height: 40 }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Filter by Project"
              style={{ width: '100%', minHeight: 40 }}
              allowClear
              value={tableFilters.projectId || undefined}
              onChange={(val) => setTableFilters(prev => ({ ...prev, projectId: val || "" }))}
              options={projects}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%', minHeight: 40 }}
              allowClear
              value={tableFilters.status || undefined}
              onChange={(val) => setTableFilters(prev => ({ ...prev, status: val || "" }))}
            >
              <Option value="planning">PLANNING</Option>
              <Option value="active">ACTIVE</Option>
              <Option value="completed">COMPLETED</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
             <Space>
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                        setTableFilters({ search: "", projectId: "", status: "" });
                        loadData({ search: "", projectId: "", status: "" });
                    }} 
                />
             </Space>
          </Col>
        </Row>
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
          <div style={{ padding: "12px 0" }}>
            <Title level={4} style={{ margin: 0, fontWeight: 700, lineHeight: 1.2 }}>
              {editingPlan ? "Edit Sprint Details" : "Plan New Sprint"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              schedule work, and assign issues for your team
            </Text>
          </div>
        }
        open={showCreateModal}
        onClose={handleCloseModal}
        width={620}
        maskClosable={true}
        destroyOnClose
        extra={
          <Space size="middle" style={{ paddingRight: 8 }}>
            <Button onClick={handleCloseModal} style={{ borderRadius: 6 }}>Cancel</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleCreateOrUpdate}
              style={{ fontWeight: 600, borderRadius: 6 }}
            >
              {editingPlan ? "Save Changes" : "Create Sprint"}
            </Button>
          </Space>
        }
        styles={{
          header: { borderBottom: '1px solid var(--border-color)', padding: '16px 24px' },
          body: { padding: "32px 24px" },
          mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.1)' }
        }}
      >
        <Form form={form} layout="vertical" requiredMark={false} size="large">
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 16, background: '#1677ff', borderRadius: 2 }} />
              <Text strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c8c8c' }}>Basic Information</Text>
            </div>

            <Form.Item
              label={<Text strong style={{ fontSize: 13 }}>Sprint Name</Text>}
              name="name"
              rules={[{ required: true, message: "Sprint Name is required" }]}
            >
              <Input placeholder="e.g. Q1 Development - Sprint 1" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: 13 }}>Project</Text>} name="project" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select project"
                    onChange={handleProjectChange}
                    disabled={!!editingPlan}
                    options={projects}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: 13 }}>Goal / Objective</Text>} name="goal">
                  <Input placeholder="What's the main focus?" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<Text strong style={{ fontSize: 13 }}>Description</Text>} name="description">
              <TextArea rows={3} placeholder="Briefly describe the scope of this sprint..." style={{ borderRadius: 8, resize: 'none' }} />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 16, background: '#fa8c16', borderRadius: 2 }} />
              <Text strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c8c8c' }}>Timeline & Schedule</Text>
            </div>

            <div style={{ background: 'var(--bg-pure-white)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <Row gutter={16}>
                <Col span={24} style={{ marginBottom: 16 }}>
                  <Form.Item label="Pre-set Duration" style={{ margin: 0 }}>
                    <Select
                      placeholder="Select duration"
                      onChange={(val) => {
                        if (val === 'custom') return;
                        const start = form.getFieldValue('startDate') || dayjs();
                        let end = dayjs(start);
                        if (val === '1w') end = end.add(1, 'week');
                        if (val === '2w') end = end.add(2, 'week');
                        if (val === '4w') end = end.add(1, 'month');
                        form.setFieldsValue({ startDate: start, endDate: end, deadline: end });
                      }}
                      style={{ borderRadius: 8 }}
                    >
                      <Option value="custom">Custom Range</Option>
                      <Option value="1w">1 Week</Option>
                      <Option value="2w">2 Weeks (Standard)</Option>
                      <Option value="4w">1 Month</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]} style={{ margin: 0 }}>
                    <DatePicker style={{ width: "100%", borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="End Date" name="endDate" rules={[{ required: true }]} style={{ margin: 0 }}>
                    <DatePicker style={{ width: "100%", borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 16, background: '#52c41a', borderRadius: 2 }} />
              <Text strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c8c8c' }}>Backlog Assignment</Text>
            </div>

            <Form.Item label={<Text strong style={{ fontSize: 13 }}>Include Issues</Text>} name="tickets" tooltip="Select existing issues to add to this sprint">
              <Select
                mode="multiple"
                placeholder="Search issues by number or title..."
                style={{ width: '100%' }}
                onSearch={handleTicketSearch}
                filterOption={false}
                notFoundContent={ticketLoading ? <Spin size="small" /> : null}
                options={availableTickets.map(t => ({
                  label: t.ticketNumber,
                  value: t.id,
                  item: t
                }))}
                optionRender={(option) => {
                  const t = option.data.item;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Tag style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#1677ff', fontWeight: 600 }}>{t.ticketNumber}</Tag>
                        <Text ellipsis style={{ maxWidth: 280 }}>{t.title}</Text>
                      </Space>
                      <Tag color={getStatusColor(t.status)} style={{ fontSize: 9 }}>{t.status.toUpperCase()}</Tag>
                    </div>
                  );
                }}
              />
            </Form.Item>
          </div>
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
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .drawer-ticket-item:hover {
          background: var(--bg-pure-white) !important;
          filter: brightness(0.98);
        }
      `}</style>
    </div>
  );
}
