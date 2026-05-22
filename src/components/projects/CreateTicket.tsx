"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  InputNumber,
  notification,
  Divider,
  List,
  Badge,
  Avatar,
  Spin,
  Tooltip,
  Breadcrumb,
  Steps,
  Empty,
  Progress,
} from "antd";
import type { NotificationArgsProps } from "antd";
import {
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusCircleFilled,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ProjectService } from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import TicketService from "@/services/ticketService";
import {
  SettingsService,
  TicketConfigurations,
} from "@/services/settingsService";
import TiptapEditor from "@/components/common/TiptapEditor";
import { useCreateTicket } from "@/hooks/useTickets";
import { useUserProjects, useMembers, useTicketConfig } from "@/hooks/useGlobalData";
import { PRIORITY_OPTIONS, TYPE_OPTIONS, getPriorityColor } from "@/utils/ticketUtils";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TicketFormData {
  title: string;
  platform: string;
  project: string;
  parentTickets: string[];
  stack?: string;
  description: string;
  priority: string;
  taskLevel: string;
  type: string;
  storyPoint: number;
  estimateHours: number;
  reportTo: string;
  assignee: string;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  releasePlan?: string;
}

export default function CreateTicket() {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification({
    placement: 'top',
  });
  const [loading, setLoading] = useState(false);
  const [ticketId] = useState(`TKT-${Date.now().toString().slice(-6)}`);

  // Use cached global data hooks
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: ticketConfig, isLoading: configLoading } = useTicketConfig();

  // Local state for project-specific data
  const [projectMembers, setProjectMembers] = useState<
    Array<{ value: string; label: string; position: string }>
  >([]);
  const [parentTickets, setParentTickets] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [releasePlans, setReleasePlans] = useState<
    Array<{ 
      value: string; 
      label: string; 
      status?: string; 
      startDate?: string; 
      endDate?: string;
      releaseDate?: string;
      totalTickets?: number;
      completedTickets?: number;
    }>
  >([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);

  // Watch form values for dynamic step completion tracking
  const formValues = Form.useWatch([], form);

  // Step 1: Basic Information Completion
  const isStep1Complete = !!(
    formValues?.title &&
    formValues?.platform &&
    formValues?.project &&
    formValues?.description &&
    formValues?.description !== "<p></p>" &&
    (formValues?.platform !== "Development" || formValues?.stack)
  );

  // Step 2: Task Configuration Completion
  const isStep2Complete = !!(
    formValues?.priority &&
    formValues?.taskLevel &&
    formValues?.taskType &&
    formValues?.storyPoint !== undefined &&
    formValues?.estimateHours !== undefined
  );

  // Step 3: Responsibility & Timeline Completion
  const isStep3Complete = !!(
    formValues?.reportTo &&
    formValues?.assignee &&
    formValues?.startDate &&
    formValues?.endDate
  );

  // Extract dropdown options from cached config
  const platforms = ticketConfig?.platforms || [];
  const stacks = ticketConfig?.stacks || [];
  const priorities = ticketConfig?.priorities || PRIORITY_OPTIONS.map(opt => ({ value: opt.value, label: opt.label, color: 'default', description: undefined }));
  const taskLevels = ticketConfig?.taskLevels || [];
  const taskTypes = ticketConfig?.taskTypes || TYPE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label, color: 'default' }));

  // Combined loading state
  const dataLoading = projectsLoading || membersLoading || configLoading;

  const recentActivities = [
    { user: "John Doe", action: "created ticket #TKT-001", time: "2 mins ago" },
    { user: "Jane Smith", action: "updated priority", time: "5 mins ago" },
    { user: "Mike Johnson", action: "assigned to Sarah", time: "10 mins ago" },
    { user: "David Brown", action: "completed testing", time: "15 mins ago" },
  ];

  // Load project-dependent data when project changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProject) {
        setParentTickets([]);
        setReleasePlans([]);
        setProjectMembers([]);
        // Clear assignee and reportTo when project is cleared
        form.setFieldsValue({
          assignee: undefined,
          reportTo: undefined,
        });
        return;
      }

      try {
        // Load project members
        const membersData = await ProjectService.getProjectMembers(
          selectedProject
        );
        setProjectMembers(membersData || []);

        // Clear assignee and reportTo when project changes
        form.setFieldsValue({
          assignee: undefined,
          reportTo: undefined,
        });

        // Load parent tickets and release plans for selected project
        const [parentTicketsData, releasePlansData] = await Promise.all([
          TicketService.getParentTickets(selectedProject),
          TicketService.getReleasePlansByProject(selectedProject)
        ]);

        setParentTickets(parentTicketsData || []);
        setReleasePlans(releasePlansData || []);
      } catch (error) {
        console.error("Error loading project data:", error);
        api.error({
          message: "Error",
          description: "Failed to load project-specific data.",
          
          duration: 4,
        });
        setProjectMembers([]);
      }
    };

    loadProjectData();
  }, [selectedProject, form]);

  // React Query Mutation
  const createTicketMutation = useCreateTicket();

  const handleCreateTicket = async (values: TicketFormData) => {
    try {
      setLoading(true);

      // Prepare ticket data for API
      const ticketData = {
        title: values.title || "New Ticket",
        description: values.description,
        platform: values.platform,
        project: values.project,
        parentTickets: values.parentTickets || [],
        stack: values.stack,
        priority: values.priority,
        taskLevel: values.taskLevel,
        type: values.type, 
        storyPoint: values.storyPoint,
        estimateHours: values.estimateHours,
        reportTo: values.reportTo,
        assignee: values.assignee,
        startDate: values.startDate?.format("YYYY-MM-DD") || "",
        endDate: values.endDate?.format("YYYY-MM-DD") || "",
        releasePlan: values.releasePlan,
      };

      // Create ticket using API via Mutation
      const createdTicket = await createTicketMutation.mutateAsync(ticketData);

      api.success({
        message: "Success",
        description: `Ticket ${
          createdTicket?.ticketNumber || ticketId
        } created successfully!`,
        
        duration: 4,
      });

      // Reset form and selected project
      form.resetFields();
      setSelectedProject("");
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to create ticket",
        
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    api.info({
      message: "Form cleared",
      
      duration: 2,
    });
  };


  return (
    <div style={{ 
      maxWidth: 1600, 
      margin: "0 auto", 
      height: "100%", // Fit parent (MainLayout Content)
      display: "flex", 
      flexDirection: "column", 
      overflow: "hidden",
      padding: "16px 24px 0",
      background: "var(--bg-pure-white)"
    }}>
      {/* Premium Sticky Header Card */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "var(--bg-pure-white)",
        backdropFilter: "blur(15px)",
        padding: "16px 24px",
        margin: "0 0 12px 0", // Reduced margin to bring content closer
        borderRadius: "0 0 12px 12px",
        borderBottom: "1px solid var(--border-color)",
        borderLeft: "1px solid var(--border-color)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Space direction="vertical" size={0}>
          <Breadcrumb 
            items={[
              { title: <a href="/projects" style={{ color: "#8c8c8c" }}><ProjectOutlined /> Projects</a> },
              { title: <Text type="secondary">New Ticket</Text> }
            ]} 
            style={{ marginBottom: 4, fontSize: 12 }}
          />
          <Space size={16}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1677ff 0%, #003eb3 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: 20
            }}>
              <PlusCircleFilled />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, letterSpacing: -0.5, fontWeight: 700 }}>
                Create New Ticket
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Configure and initialize a new project task
              </Text>
            </div>
          </Space>
        </Space>

        <Space size={12}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => window.history.back()}
            style={{ 
              borderRadius: 8, 
              height: 40, 
              border: "1px solid #d9d9d9",
              fontWeight: 500
            }}
          >
            Back
          </Button>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={() => form.submit()}
            loading={loading}
            style={{ 
              borderRadius: 8, 
              height: 40, 
              fontWeight: 600,
              background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
              border: "none",
              display: "flex",
              alignItems: "center"
            }}
          >
            Create Ticket
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]} style={{ flex: 1, overflow: "hidden", marginTop: 4 }}>
        {/* Left Side - Main Form (70%) */}
        <Col xs={24} lg={17} style={{ height: "100%", overflowY: "auto", paddingBottom: 60, scrollbarWidth: "none" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateTicket}
            initialValues={{
              storyPoint: 2,
              estimateHours: 8,
            }}
            requiredMark="optional"
          >
            {/* Form Progress Steps - Sticky behavior - Outside Space to ensure stickiness */}
            <div style={{ 
              position: "sticky",
              top: 0, 
              zIndex: 900,
              padding: "20px 24px", 
              background: "var(--bg-pure-white)", 
              backdropFilter: "blur(10px)",
              borderRadius: 12, 
              border: "1px solid var(--border-color)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              marginBottom: 16 // Add margin manually since it's out of Space
            }}>
              <Steps
                size="small"
                items={[
                  {
                    title: <Text strong style={{ fontSize: 13 }}>Basic Information</Text>,
                    status: isStep1Complete ? "finish" : "wait",
                  },
                  {
                    title: <Text strong style={{ fontSize: 13 }}>Task Configuration</Text>,
                    status: isStep2Complete ? "finish" : "wait",
                  },
                  {
                    title: <Text strong style={{ fontSize: 13 }}>Responsibility & Timeline</Text>,
                    status: isStep3Complete ? "finish" : "wait",
                  },
                ]}
              />
            </div>

            <Space direction="vertical" size={16} style={{ width: "100%" }}>

              {/* Basic Information Section */}
              <Card
                className="premium-card"
                title={
                  <Space>
                    <FileTextOutlined style={{ color: "#1677ff" }} />
                    <Text strong>Basic Information</Text>
                  </Space>
                }
                styles={{ 
                  header: { borderBottom: "1px solid var(--border-color)", padding: "0 24px" },
                  body: { padding: 24 }
                }}
                style={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-pure-white)" }}
              >
                <Form.Item
                  name="title"
                  label={<Text strong>Title</Text>}
                  rules={[{ required: true, message: "Please enter a title" }]}
                >
                  <Input placeholder="What needs to be done?" size="large" style={{ borderRadius: 8 }} />
                </Form.Item>

                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="platform"
                      label={<Text strong>Platform</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select placeholder="Select platform" size="large" style={{ borderRadius: 8 }}>
                        {platforms.map((platform) => (
                          <Option key={platform.value} value={platform.value}>
                            {platform.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="project"
                      label={<Text strong>Target Project</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select
                        placeholder="Assign to project"
                        size="large"
                        style={{ borderRadius: 8 }}
                        loading={dataLoading}
                        onChange={(value) => setSelectedProject(value)}
                        suffixIcon={<ProjectOutlined />}
                      >
                        {projects.map((project) => (
                          <Option key={project.value} value={project.value}>
                            {project.label} ({project.code})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.platform !== currentValues.platform
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue("platform") === "Development" ? (
                      <Form.Item
                        name="stack"
                        label={<Text strong>Technology Stack</Text>}
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select placeholder="Select tech stack" size="large" style={{ borderRadius: 8 }}>
                          {stacks.map((stack) => (
                            <Option key={stack.value} value={stack.value}>
                              {stack.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<Text strong>Description</Text>}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <TiptapEditor
                    placeholder="Provide detailed requirements, reproduction steps, or any relevant context..."
                    minHeight={250}
                    maxHeight={500}
                    onChange={(html) => {
                      const currentValue = form.getFieldValue("description");
                      if (currentValue !== html) {
                        form.setFieldValue("description", html);
                      }
                    }}
                  />
                </Form.Item>
              </Card>

              {/* Task Configuration Section */}
              <Card
                title={
                  <Space>
                    <SettingOutlined style={{ color: "#faad14" }} />
                    <Text strong>Task Configuration</Text>
                  </Space>
                }
                styles={{ 
                  header: { borderBottom: "1px solid var(--border-color)", padding: "0 24px" },
                  body: { padding: 24 }
                }}
                style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)" }}
              >
                <Row gutter={20}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="priority"
                      label={<Text strong>Priority</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select placeholder="Select" size="large" style={{ borderRadius: 8 }}>
                        {priorities.map((priority) => (
                          <Option key={priority.value} value={priority.value}>
                            <Space>
                              <Badge color={getPriorityColor(priority.value)} />
                              {priority.label}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="taskLevel"
                      label={<Text strong>Complexity</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select placeholder="Select" size="large" style={{ borderRadius: 8 }}>
                        {taskLevels.map((level) => (
                          <Option key={level.value} value={level.value}>
                            {level.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="taskType"
                      label={<Text strong>Category</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select placeholder="Select" size="large" style={{ borderRadius: 8 }}>
                        {taskTypes.map((type) => (
                          <Option key={type.value} value={type.value}>
                            <Tag color={type.color} style={{ borderRadius: 4, border: "none" }}>{type.label}</Tag>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="storyPoint"
                      label={<Text strong>Story Points</Text>}
                      tooltip="Estimation based on Fibonacci sequence or points"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <InputNumber
                        min={1}
                        max={13}
                        placeholder="1-13"
                        style={{ width: "100%", borderRadius: 8 }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="estimateHours"
                      label={<Text strong>Total Effort (Hrs)</Text>}
                      tooltip="Calculated engineering hours"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <InputNumber
                        min={1}
                        placeholder="Hours"
                        style={{ width: "100%", borderRadius: 8 }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Assignment & Timeline Section */}
              <Card
                title={
                  <Space>
                    <UserOutlined style={{ color: "#52c41a" }} />
                    <Text strong>Responsibility & Timeline</Text>
                  </Space>
                }
                styles={{ 
                  header: { borderBottom: "1px solid var(--border-color)", padding: "0 24px" },
                  body: { padding: 24 }
                }}
                style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)" }}
              >
                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="reportTo"
                      label={<Text strong>Reports To</Text>}
                      rules={[{ required: true, message: "Required" }]}
                      help={!selectedProject && <Text type="warning" style={{ fontSize: 11 }}>Choose project first</Text>}
                    >
                      <Select
                        placeholder={selectedProject ? "Select person" : "Project required"}
                        size="large"
                        style={{ borderRadius: 8 }}
                        loading={dataLoading}
                        disabled={!selectedProject}
                        showSearch
                        optionFilterProp="label"
                        optionLabelProp="label" // Ensure only the 'label' prop of Option is shown in the field
                      >
                        {projectMembers.map((member) => (
                          <Option key={member.value} value={member.value} label={member.label}>
                            <Space align="center" size={12}>
                              <Avatar size="small" style={{ backgroundColor: "#87d068", flexShrink: 0 }}>
                                {member.label.charAt(0)}
                              </Avatar>
                              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.4 }}>
                                <Text strong style={{ fontSize: 13, color: "inherit", display: "block" }}>{member.label}</Text>
                                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                                  {typeof member.position === 'object' ? (member.position as any)?.title : member.position}
                                </Text>
                              </div>
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="assignee"
                      label={<Text strong>Assigned To</Text>}
                      rules={[{ required: true, message: "Required" }]}
                      help={!selectedProject && <Text type="warning" style={{ fontSize: 11 }}>Choose project first</Text>}
                    >
                      <Select
                        placeholder={selectedProject ? "Select assignee" : "Project required"}
                        size="large"
                        style={{ borderRadius: 8 }}
                        loading={dataLoading}
                        disabled={!selectedProject}
                        showSearch
                        optionFilterProp="label"
                        optionLabelProp="label" // Ensure only the 'label' prop of Option is shown in the field
                      >
                        {projectMembers.map((member) => (
                          <Option key={member.value} value={member.value} label={member.label}>
                            <Space align="center" size={12}>
                              <Avatar size="small" style={{ backgroundColor: "#1677ff", flexShrink: 0 }}>
                                {member.label.charAt(0)}
                              </Avatar>
                              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.4 }}>
                                <Text strong style={{ fontSize: 13, color: "inherit", display: "block" }}>{member.label}</Text>
                                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                                  {typeof member.position === 'object' ? (member.position as any)?.title : member.position}
                                </Text>
                              </div>
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="startDate"
                      label={<Text strong>Planned Start</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <DatePicker
                        style={{ width: "100%", borderRadius: 8 }}
                        size="large"
                        placeholder="Start date"
                        suffixIcon={<CalendarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="endDate"
                      label={<Text strong>Target Delivery</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <DatePicker
                        style={{ width: "100%", borderRadius: 8 }}
                        size="large"
                        placeholder="End date"
                        suffixIcon={<CalendarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="releasePlan" label={<Text strong>Associated Plan</Text>}>
                  <Select
                    placeholder="Link to a release plan (Optional)"
                    allowClear
                    size="large"
                    style={{ borderRadius: 8 }}
                    loading={dataLoading}
                    disabled={!selectedProject}
                    suffixIcon={<ThunderboltOutlined />}
                  >
                    {releasePlans.map((plan) => (
                      <Option key={plan.value} value={plan.value}>
                        {plan.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>

            </Space>
          </Form>
        </Col>

        {/* Right Side - Useful Information Panel (30%) */}
        <Col xs={24} lg={7} style={{ height: "100%", overflowY: "auto", paddingBottom: 60, scrollbarWidth: "none" }}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {/* Current Sprint Card */}
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: "#1677ff" }} />
                  <Text strong>Active Sprint</Text>
                </Space>
              }
              styles={{ 
                header: { borderBottom: "1px solid var(--border-color)", padding: "0 20px" },
                body: { padding: 20 }
              }}
              style={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-pure-white)" }}
            >
              {!selectedProject ? (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 12 }}>Select a project to view sprint details</Text>} />
                </div>
              ) : releasePlans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>No release plans found for this project</Text>
                </div>
              ) : (
                (() => {
                  const activeSprint = releasePlans.find(p => p.status?.toUpperCase() === "ACTIVE") || releasePlans[0];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ 
                        padding: "12px", 
                        background: "var(--bg-pure-white)", 
                        borderRadius: 8, 
                        border: "1px solid var(--border-color)" 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>Current Sprint</Text>
                            <Title level={4} style={{ margin: "4px 0", color: "#262626", fontWeight: 700, fontSize: 16 }}>
                              {activeSprint.label}
                            </Title>
                          </div>
                          <Tag color={activeSprint.status?.toUpperCase() === "ACTIVE" ? "processing" : "warning"} style={{ borderRadius: 4, margin: 0 }}>
                            {activeSprint.status?.toUpperCase() || "PLANNED"}
                          </Tag>
                        </div>
                      </div>
                      
                      <Row gutter={0} style={{ border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden" }}>
                        <Col span={12} style={{ padding: "8px 12px", borderRight: "1px solid var(--border-color)", background: "var(--bg-pure-white)" }}>
                          <Text type="secondary" style={{ fontSize: 10, display: "block", textTransform: "uppercase", letterSpacing: "0.02em" }}>Start Date</Text>
                          <Text strong style={{ fontSize: 12 }}>{activeSprint.startDate ? dayjs(activeSprint.startDate).format("MMM DD, YYYY") : "Pending"}</Text>
                        </Col>
                        <Col span={12} style={{ padding: "8px 12px", background: "var(--bg-pure-white)" }}>
                          <Text type="secondary" style={{ fontSize: 10, display: "block", textTransform: "uppercase", letterSpacing: "0.02em" }}>Deadline</Text>
                          <Text strong style={{ fontSize: 12 }}>{activeSprint.releaseDate ? dayjs(activeSprint.releaseDate).format("MMM DD, YYYY") : "No Date"}</Text>
                        </Col>
                      </Row>

                      <Divider style={{ margin: "8px 0" }} />
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Sprint Tickets</Text>
                        <Badge count={activeSprint.totalTickets || 0} style={{ backgroundColor: "#1677ff" }} />
                      </div>
                      
                      {activeSprint.totalTickets !== undefined && activeSprint.totalTickets > 0 && (
                        <Progress 
                          percent={Math.round(((activeSprint.completedTickets || 0) / activeSprint.totalTickets) * 100)} 
                          size="small" 
                          status={activeSprint.status?.toUpperCase() === "ACTIVE" ? "active" : "normal"}
                        />
                      )}
                    </div>
                  );
                })()
              )}
            </Card>

            {/* Writing Best Practices */}
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: "#52c41a" }} />
                  <Text strong>Ticket Best Practices</Text>
                </Space>
              }
              styles={{ 
                header: { borderBottom: "1px solid #f0f0f0", padding: "0 20px" },
                body: { padding: "16px 20px" }
              }}
               style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Clear & Concise Titles</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Use action-oriented verbs (e.g., "Implement", "Fix", "Research").</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Detailed Context</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Include business value, technical constraints, and acceptance criteria.</Text>
                </div>
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#f6ffed", borderRadius: 6, border: "1px solid #b7eb8f" }}>
                  <Text strong style={{ color: "#389e0d", fontSize: 12 }}>Pro-Tip:</Text>
                  <Text style={{ fontSize: 12, color: "#389e0d", marginLeft: 4 }}>Break large tasks into sub-tasks using list points.</Text>
                </div>
              </div>
            </Card>

            {/* Priority Framework */}
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: "#faad14" }} />
                  <Text strong>Priority Framework</Text>
                </Space>
              }
              styles={{ 
                header: { borderBottom: "1px solid #f0f0f0", padding: "0 20px" },
                body: { padding: "12px 20px" }
              }}
               style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)" }}
            >
              <List
                size="small"
                dataSource={priorities}
                renderItem={(priority) => (
                  <List.Item style={{ padding: "10px 0", borderBottom: "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Badge color={getPriorityColor(priority.value)} style={{ marginTop: 4 }} />
                      <div>
                        <Text strong style={{ display: "block", fontSize: 13 }}>{priority.label}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {priority.description || `standard ${priority.value.toLowerCase()} tier mapping`}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>
      </Row>
      {contextHolder}
    </div>
  );
}
