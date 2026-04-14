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
  Tabs,
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
  StopOutlined,
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

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type NotificationPlacement = NotificationArgsProps["placement"];

export default function ReleasePlanComponent() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // State management
  const [releasePlans, setReleasePlans] = useState<ReleasePlan[]>([]);
  const [activeTab, setActiveTab] = useState("sprint_plan");
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

  // Drawer state for ticket details
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerReleasePlan, setDrawerReleasePlan] =
    useState<ReleasePlan | null>(null);

  // Search debounce timer
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Sprint Completion Modal state
  const [sprintCompletionModalOpen, setSprintCompletionModalOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadProjects();
  }, [activeTab]);

  // Auto-refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !showCreateModal) {
        loadData(); // Refresh when user returns to tab
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showCreateModal]);

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  // Update selected ticket details when selection changes
  // Ticket details effect removed

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ReleasePlanService.getReleasePlans({
        type: activeTab,
      });
      setReleasePlans(data?.data || []);
      if (!loading) { // Only show message if it's a manual refresh
        api.success({
          message: "Refreshed",
          description: "Plans updated successfully",
          placement: "bottomRight",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Failed to load release plans:", error);
      api.error({
        message: "Error",
        description: "Failed to load release plans",
        placement: "bottomRight",
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
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
        api.error({
          message: "Error",
          description: "Failed to load tickets",
          placement: "bottomRight",
          duration: 4,
        });
        setAvailableTickets([]);
      } finally {
        setTicketLoading(false);
        setSearchLoading(false);
      }
    },
    [editingPlan, api]
  );

  const handleProjectChange = useCallback(
    (projectId: string) => {
      // Clear search timer
      if (searchTimer) {
        clearTimeout(searchTimer);
        setSearchTimer(null);
      }

      // Reset all related states
      setSelectedProject(projectId);
      setTicketSearch("");
      setAvailableTickets([]);
      setSearchLoading(false);

      // Load tickets for new project
      if (projectId) {
        loadTicketsByProject(projectId);
      }
    },
    [loadTicketsByProject, searchTimer]
  );

  const handleTicketSearch = useCallback(
    (value: string) => {
      setTicketSearch(value);

      // Clear existing timer
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      // Set new timer for debounced search
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

  // Ticket selection handlers removed

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Transform form values to match backend API expectations
      const formData: ReleasePlanFormData = {
        version: values?.name || "", // Map 'name' to 'version'
        description: values?.description || "",
        projectId: values?.project || "", // Map 'project' to 'projectId'
        releaseDate: values?.deadline?.toISOString() || "", // Map 'deadline' to 'releaseDate'
        startDate: values?.startDate?.toISOString() || undefined,
        endDate: values?.endDate?.toISOString() || undefined,
        goal: values?.goal || "",
        status: "planning", // Default status
        type: activeTab as any,
        tickets: values?.tickets || [],
      };

      if (editingPlan) {
        await ReleasePlanService.updateReleasePlan(editingPlan.id, formData);
        api.success({
          message: "Success",
          description: "Plans updated successfully",
          placement: "bottomRight",
          duration: 3,
        });
      } else {
        await ReleasePlanService.createReleasePlan(formData);
        api.success({
          message: "Success",
          description: "Plans created successfully",
          placement: "bottomRight",
          duration: 3,
        });
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error("Failed to save Plans:", error);
      const errorMessage = error?.message || "Failed to save Plans";
      api.error({
        message: "Error",
        description: errorMessage,
        placement: "bottomRight",
        duration: 4,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan: ReleasePlan) => {
    setEditingPlan(plan);
    const projectId =
      typeof plan?.project === "string"
        ? plan.project
        : plan?.project?.id || "";
    setSelectedProject(projectId);

    // Set selected tickets and their details
    const ticketIds = plan?.tickets?.map((t) => t?.id) || [];

    // setSelectedTickets removed



    form.setFieldsValue({
      name: plan?.name,
      description: plan?.description,
      project: projectId,
      deadline: plan?.deadline ? dayjs(plan.deadline) : null,
      startDate: plan?.startDate ? dayjs(plan.startDate) : null,
      endDate: plan?.endDate ? dayjs(plan.endDate) : null,
      goal: plan?.goal,
      priority: plan?.priority,
      tickets: ticketIds, // Pre-fill tickets
      notes: plan?.notes,
    });

    // Load available tickets (excluding current Plans tickets)
    loadTicketsByProject(projectId);
    setShowCreateModal(true);
  };

  const handleDelete = async (planId: string) => {
    try {
      await ReleasePlanService.deleteReleasePlan(planId);
      api.success({
        message: "Success",
        description: "Plans deleted successfully",
        placement: "bottomRight",
        duration: 3,
      });
      loadData();
    } catch (error) {
      console.error("Failed to delete Plans:", error);
      api.error({
        message: "Error",
        description: "Failed to delete Plans",
        placement: "bottomRight",
        duration: 4,
      });
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
    // Clear search timer
    if (searchTimer) {
      clearTimeout(searchTimer);
      setSearchTimer(null);
    }

    setShowCreateModal(false);
    setEditingPlan(null);
    setSelectedProject("");
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
    setDrawerReleasePlan(plan); // Show cached data first
    
    // Fetch fresh data in the background
    try {
      const freshPlan = await ReleasePlanService.getReleasePlanById(plan.id);
      setDrawerReleasePlan(freshPlan); // Update with current ticket statuses
    } catch (error) {
      console.error('Failed to fetch fresh plan:', error);
      // Fallback to cached data (already set above)
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "active":
        return "processing";
      case "planning":
        return "default";
      case "cancelled":
        return "error";
      case "on_hold":
        return "warning";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "red";
      case "Medium":
        return "orange";
      case "Low":
        return "green";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ReleasePlan) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description?.length > 50
              ? `${record.description.substring(0, 50)}...`
              : record.description}
          </Text>
        </div>
      ),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 200,
      render: (progress: number, record: ReleasePlan) => (
        <div>
          <Progress percent={progress || 0} size="small" />
          <Text
            style={{ fontSize: 12, cursor: "pointer", color: "#1677ff" }}
            onClick={() => handleViewTickets(record)}
          >
            {record?.completedTickets || 0}/{record?.totalTickets || 0} tickets
            completed
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      render: (deadline: string) => (
        <div>
          <Text style={{ fontSize: 12 }}>
            {dayjs(deadline).format("MMM DD, YYYY")}
          </Text>
        </div>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {date ? dayjs(date).format("MMM DD") : "-"}
        </Text>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {date ? dayjs(date).format("MMM DD") : "-"}
        </Text>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: any, record: ReleasePlan) => (
        <Space size="small">
          {activeTab === 'sprint_plan' && record.status === 'planning' && (
             <Popconfirm
                title="Start Sprint"
                description="Are you sure you want to start this sprint? This will be the active sprint for the project."
                onConfirm={() => handleStartSprint(record)}
                okText="Start"
                cancelText="Cancel"
              >
              <Tooltip title="Start Sprint">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />} 
                />
              </Tooltip>
            </Popconfirm>
          )}
          {activeTab === 'sprint_plan' && record.status === 'active' && (
            <Tooltip title="Complete Sprint">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined style={{ color: '#1677ff' }} />}
                onClick={() => handleCompleteSprint(record)}
              />
            </Tooltip>
          )}

          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="View Tickets">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTickets(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Plans"
            description="Are you sure you want to delete this Plans?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="link"
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
    <div>
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Plans
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadData()}
              loading={loading}
              title="Refresh to see latest ticket statuses"
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Plans
            </Button>
          </Space>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: "sprint_plan",
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarOutlined />
                Sprint Plans
              </span>
            ),
          },
          {
            key: "demo_plan",
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlayCircleOutlined />
                Demo Plans
              </span>
            ),
          },
          {
            key: "release_plan",
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RocketOutlined />
                Release Plans
              </span>
            ),
          },
        ]}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={releasePlans}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <div style={{ marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>
              {editingPlan ? "Edit Sprint" : "Create Sprint"}
            </Title>
            <Text type="secondary">
              Plan and schedule your work
            </Text>
          </div>
        }
        open={showCreateModal}
        onCancel={handleCloseModal}
        width={600}
        maskClosable={false}
        footer={null}
        styles={{
          body: { maxHeight: "70vh", overflowY: "auto", padding: "0 12px" },
        }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<Text strong>Sprint Name</Text>}
            name="name"
            rules={[{ required: true, message: "Sprint Name is required" }]}
          >
            <Input placeholder="e.g. Sprint 1, Release 2.0" size="large" />
          </Form.Item>

          <Form.Item label={<Text strong>Sprint Goal</Text>} name="goal">
            <TextArea 
              rows={3} 
              placeholder="What is the main objective of this sprint?" 
              style={{ resize: 'none' }}
            />
          </Form.Item>

          <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>Schedule</Text>
            <Row gutter={16}>
               <Col span={24} style={{ marginBottom: 16 }}>
                 <Form.Item label="Duration" style={{ margin: 0 }}>
                   <Select 
                     placeholder="Select duration" 
                     onChange={(val) => {
                       const start = form.getFieldValue('startDate') || dayjs();
                       let end = dayjs(start);
                       if (val === '1w') end = end.add(1, 'week');
                       if (val === '2w') end = end.add(2, 'week');
                       if (val === '3w') end = end.add(3, 'week');
                       if (val === '4w') end = end.add(4, 'week');
                       form.setFieldsValue({ startDate: start, endDate: end, deadline: end }); 
                     }}
                   >
                     <Select.Option value="custom">Custom</Select.Option>
                     <Select.Option value="1w">1 Week</Select.Option>
                     <Select.Option value="2w">2 Weeks</Select.Option>
                     <Select.Option value="3w">3 Weeks</Select.Option>
                     <Select.Option value="4w">4 Weeks</Select.Option>
                   </Select>
                 </Form.Item>
               </Col>
               <Col span={12}>
                <Form.Item
                  label="Start Date"
                  name="startDate"
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="End Date"
                  name="endDate"
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item label="Project" name="project" rules={[{ required: true }]}>
            <Select
              placeholder="Select project"
              onChange={handleProjectChange}
              disabled={!!editingPlan}
              options={projects}
            />
          </Form.Item>
          
          <Form.Item label="Issues" name="tickets" tooltip="Select issues to include in this sprint">
             <Select
                mode="multiple"
                placeholder="Search and select issues..."
                style={{ width: '100%' }}
                optionLabelProp="label"
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
                     <Space align="center">
                       <Tag>{t.ticketNumber}</Tag>
                       <Text ellipsis style={{ maxWidth: 300 }}>{t.title}</Text>
                       <Tag color={getStatusColor(t.status)} style={{ fontSize: 10 }}>{t.status.replace("_", " ")}</Tag>
                     </Space>
                   );
                }}
             />
          </Form.Item>
          
           {/* Hidden field for legacy mapping if needed, or handle in submit */}
           <Form.Item name="deadline" hidden><Input /></Form.Item>
        </Form>

        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            paddingTop: 16,
            marginTop: 24,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleCreateOrUpdate}
          >
            {editingPlan ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      {/* Ticket Details Drawer */}
      <Drawer
        title={`${drawerReleasePlan?.name} - Tickets`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
        extra={
          drawerReleasePlan?.status === 'active' && activeTab === 'sprint_plan' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                handleCompleteSprint(drawerReleasePlan);
                setDrawerVisible(false);
              }}
            >
              Complete Sprint
            </Button>
          )
        }
      >
        {drawerReleasePlan && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Progress
                percent={drawerReleasePlan?.progress || 0}
                status="active"
                style={{ marginBottom: 8 }}
              />
              <Text type="secondary">
                {drawerReleasePlan?.completedTickets || 0} of{" "}
                {drawerReleasePlan?.totalTickets || 0} tickets completed
              </Text>
            </div>

            <List
              dataSource={drawerReleasePlan?.tickets || []}
              renderItem={(ticket) => (
                <List.Item
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      size="small"
                      onClick={() => router.push(`/tickets/${ticket?.id}`)}
                    >
                      View
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: "#1677ff" }}>
                        {ticket?.ticketNumber}
                      </Avatar>
                    }
                    title={ticket?.title}
                    description={
                      <Space>
                        <Tag
                          color={
                            ticket?.status === "completed"
                              ? "success"
                              : ticket?.status === "in_progress"
                              ? "processing"
                              : "default"
                          }
                        >
                          {ticket?.status?.replace("_", " ")}
                        </Tag>
                        <Tag
                          color={
                            ticket?.priority === "P1"
                              ? "red"
                              : ticket?.priority === "P2"
                              ? "orange"
                              : "green"
                          }
                        >
                          {ticket?.priority}
                        </Tag>
                        {ticket?.assignee && (
                          <Text type="secondary">{ticket?.assignee?.name}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      {/* Sprint Completion Modal */}
      <SprintCompletionModal
        sprintId={selectedSprintId}
        open={sprintCompletionModalOpen}
        onClose={() => {
          setSprintCompletionModalOpen(false);
          setSelectedSprintId(null);
        }}
        onSuccess={handleSprintCompletionSuccess}
      />
    </div>
  );
}
