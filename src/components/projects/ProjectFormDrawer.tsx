"use client";

import React, { useState, useEffect } from "react";
import {
  App,
  Button,
  Input,
  Select,
  Space,
  Form,
  Tag,
  DatePicker,
  Row,
  Col,
  Typography,
  Drawer,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  ProjectService,
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import { useTheme } from "@/context/ThemeContext";

const { Title, Text } = Typography;
const { Option } = Select;

interface Member {
  value: string;
  label: string;
  position: string;
}

interface ProjectFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  project?: Project | null;
  projectId?: string | null;
  onSuccess: () => void;
}

export const ProjectFormDrawer: React.FC<ProjectFormDrawerProps> = ({
  visible,
  onClose,
  project,
  projectId,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { notification, message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [fullProject, setFullProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersList = await MembersService.getMembersForSelect();
        setMembers(membersList);
      } catch (error) {
        console.error("Failed to load members:", error);
      }
    };
    loadMembers();
  }, []);

  useEffect(() => {
    const prepareData = async () => {
      if (!visible) {
        setFullProject(null);
        return;
      }

      let p = project;

      // If we only have projectId or an incomplete project object (missing members/manager)
      if (projectId && (!p || !p.members || !p.projectManager)) {
        try {
          setDataLoading(true);
          p = await ProjectService.getProject(projectId);
          setFullProject(p);
        } catch (error) {
          console.error("Failed to fetch project for editing:", error);
          message.error("Could not load project details");
          onClose();
          return;
        } finally {
          setDataLoading(false);
        }
      } else if (p) {
        setFullProject(p);
      }

      if (p) {
        form.setFieldsValue({
          ...p,
          startDate: dayjs(p.startDate),
          endDate: p.endDate ? dayjs(p.endDate) : null,
          projectManagerId: p.projectManager?.id,
          teamMemberIds: p.members?.map((member) => member.user.id) || [],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: "planning",
          defaultPriority: "medium",
        });
      }
    };

    prepareData();
  }, [visible, project, projectId, form]);

  const handleProjectManagerChange = (projectManagerId: string) => {
    const teamMemberIds = form.getFieldValue("teamMemberIds") || [];
    if (projectManagerId && !teamMemberIds.includes(projectManagerId)) {
      form.setFieldsValue({
        teamMemberIds: [...teamMemberIds, projectManagerId],
      });
    }
  };

  const handleTeamMembersChange = (selectedIds: string[]) => {
    const projectManagerId = form.getFieldValue("projectManagerId");
    if (projectManagerId && !selectedIds.includes(projectManagerId)) {
      message.warning("Project Manager must be included in the team");
      form.setFieldsValue({
        teamMemberIds: [...selectedIds, projectManagerId],
      });
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const projectData = {
        ...values,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        code: values.code || null,
        repositories: values.repositories || null,
      };

      if (fullProject || project) {
        const id = fullProject?.id || project?.id;
        if (!id) throw new Error("Project ID missing");
        await ProjectService.updateProject(
          id,
          projectData as UpdateProjectData
        );
        message.success(`Project "${values.name}" has been successfully updated.`);
      } else {
        await ProjectService.createProject(projectData as CreateProjectData);
        message.success(`Project "${values.name}" has been successfully created.`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      notification.error({
        message: "Operation Failed",
        description: error.message || "Failed to save project",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={null}
      open={visible}
      onClose={onClose}
      width={720}
      closable={false}
      maskClosable={true}
      styles={{
        body: { padding: 0, background: "var(--bg-pure-white)" },
        header: { display: "none" },
        mask: { backdropFilter: "blur(2px)", background: "rgba(15, 23, 42, 0.45)" },
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-pure-white)",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-pure-white)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: (fullProject || project)
                  ? "rgba(245, 158, 11, 0.10)"
                  : "rgba(59, 130, 246, 0.10)",
                color: (fullProject || project) ? "#f59e0b" : "var(--premium-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {(fullProject || project) ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div style={{ minWidth: 0 }}>
              <Title
                level={5}
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-slate-900)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {(fullProject || project) ? "Edit Project" : "Create New Project"}
              </Title>
              <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                {(fullProject || project)
                  ? `Update details for ${(fullProject || project)?.name}`
                  : "Set up a new workspace for your team"}
              </Text>
            </div>
          </div>
          <Button
            type="text"
            shape="circle"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ color: "var(--text-slate-500)" }}
          />
        </div>

        {/* Drawer Form Content */}
        <div
          style={{
            padding: "24px 28px",
            flex: 1,
            overflowY: "auto",
            background: "var(--bg-secondary, #f8fafc)",
          }}
        >
          <ConfigProvider
            theme={{
              algorithm:
                theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
              token: {
                colorBgContainer: theme === "dark" ? "#161B22" : "#ffffff",
                colorText: theme === "dark" ? "#F1F5F9" : "#1E293B",
              },
            }}
          >
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
              <div
                style={{
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  padding: "20px 22px",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "rgba(59, 130, 246, 0.10)",
                      color: "var(--premium-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <InfoCircleOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-slate-900)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Basic Information
                    </Title>
                    <Text style={{ fontSize: 11.5, color: "var(--text-slate-500)", fontWeight: 500 }}>
                      The essential details that identify this project
                    </Text>
                  </div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--bg-secondary, #f1f5f9)",
                      color: "var(--text-slate-500)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    STEP 1
                  </span>
                </div>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="name"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Project Name
                        </span>
                      }
                      rules={[
                        { required: true, message: "Please enter project name" },
                        { min: 2, message: "Name must be at least 2 characters" },
                      ]}
                    >
                      <Input
                        placeholder="e.g. Website Redesign"
                        size="large"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="code"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Project Code
                        </span>
                      }
                      rules={[{ required: true, message: "Please enter code" }]}
                    >
                      <Input
                        placeholder="e.g. WEB"
                        size="large"
                        style={{ borderRadius: 10, textTransform: "uppercase" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="status"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Project Status
                        </span>
                      }
                      rules={[{ required: true, message: "Please select status" }]}
                    >
                      <Select
                        placeholder="Select status"
                        size="large"
                        style={{ borderRadius: 10 }}
                      >
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
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Project Description
                        </span>
                      }
                      rules={[{ required: true, message: "Please enter description" }]}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder="What is this project about?"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Section: Team & Responsibility */}
              <div
                style={{
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  padding: "20px 22px",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "rgba(16, 185, 129, 0.10)",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <TeamOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-slate-900)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Team & Responsibility
                    </Title>
                    <Text style={{ fontSize: 11.5, color: "var(--text-slate-500)", fontWeight: 500 }}>
                      Assign a lead and the people who will contribute
                    </Text>
                  </div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--bg-secondary, #f1f5f9)",
                      color: "var(--text-slate-500)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    STEP 2
                  </span>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="projectManagerId"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Project Manager
                        </span>
                      }
                      rules={[{ required: true, message: "Please select manager" }]}
                    >
                      <Select
                        placeholder="Select lead"
                        size="large"
                        onChange={handleProjectManagerChange}
                        showSearch
                        style={{ borderRadius: 10 }}
                        filterOption={(input, option) => {
                          const member = members.find((m) => m.value === option?.value);
                          return member
                            ? String(member.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            : false;
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
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Default Priority
                        </span>
                      }
                      rules={[{ required: true, message: "Please select priority" }]}
                    >
                      <Select
                        placeholder="Priority"
                        size="large"
                        style={{ borderRadius: 10 }}
                      >
                        <Option value="high">High</Option>
                        <Option value="medium">Medium</Option>
                        <Option value="low">Low</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="teamMemberIds"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Team Members
                        </span>
                      }
                      help={
                        <span style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                          The Project Manager is automatically included
                        </span>
                      }
                    >
                      <Select
                        mode="multiple"
                        placeholder="Add contributors"
                        size="large"
                        onChange={handleTeamMembersChange}
                        showSearch
                        style={{ borderRadius: 10 }}
                        filterOption={(input, option) => {
                          const member = members.find((m) => m.value === option?.value);
                          return member
                            ? member.label.toLowerCase().includes(input.toLowerCase())
                            : false;
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

              {/* Section: Timeline & Resources */}
              <div
                style={{
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  padding: "20px 22px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "rgba(139, 92, 246, 0.10)",
                      color: "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    <CalendarOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-slate-900)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Timeline & Resources
                    </Title>
                    <Text style={{ fontSize: 11.5, color: "var(--text-slate-500)", fontWeight: 500 }}>
                      Set the schedule and link any external resources
                    </Text>
                  </div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--bg-secondary, #f1f5f9)",
                      color: "var(--text-slate-500)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    STEP 3
                  </span>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="startDate"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Estimated Start
                        </span>
                      }
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <DatePicker size="large" style={{ width: "100%", borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="endDate"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Estimated Completion
                        </span>
                      }
                    >
                      <DatePicker size="large" style={{ width: "100%", borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="repositories"
                      label={
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
                          Repository URL{" "}
                          <span style={{ fontWeight: 500, color: "var(--text-slate-400)" }}>
                            (optional)
                          </span>
                        </span>
                      }
                    >
                      <Input
                        placeholder="e.g. https://github.com/org/repo"
                        size="large"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Form>
          </ConfigProvider>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "14px 28px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-pure-white)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            bottom: 0,
          }}
        >
          <Text style={{ fontSize: 11.5, color: "var(--text-slate-400)", fontWeight: 500 }}>
            {(fullProject || project)
              ? "Changes will be saved immediately"
              : "All fields marked required must be filled"}
          </Text>
          <Space size={10}>
            <Button
              onClick={onClose}
              style={{ borderRadius: 8, height: 38, fontWeight: 600, padding: "0 18px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading || dataLoading}
              icon={(fullProject || project) ? <EditOutlined /> : <PlusOutlined />}
              style={{ borderRadius: 8, height: 38, fontWeight: 600, padding: "0 18px" }}
            >
              {(fullProject || project) ? "Save Changes" : "Create Project"}
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  );
};
