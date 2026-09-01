"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { AuthService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { MembersService } from "@/services/membersService";
import { useTheme } from "@/context/ThemeContext";
import { drawerFormStyles as formStyles, SectionCard, commonDrawerProps } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { Title, Text } = Typography;
const { Option } = Select;

interface Member {
  value: string;
  label: string;
  position: string;
  avatarUrl?: string | null;
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
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
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

        try {
          const nextCode = await ProjectService.getNextCode();
          if (nextCode) {
            form.setFieldsValue({ code: nextCode });
          }
        } catch (err) {
          console.error(err);
        }
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
        
        if (!user?.onboardingCompleted) {
          AuthService.completeOnboarding()
            .then(() => updateUser({ onboardingCompleted: true }))
            .catch(() => {});
        }
      }

      // Invalidate project queries to sync cached lists
      queryClient.invalidateQueries({ queryKey: ["global", "projects"] });
      queryClient.invalidateQueries({ queryKey: ["global", "allProjects"] });

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
      {...commonDrawerProps}
      open={visible}
      onClose={onClose}
      maskClosable={true}
    >
      <style>{formStyles}</style>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer Header */}
        <div
          className="customer-drawer-header"
          style={{
            padding: "16px 14px 12px 14px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
                borderRadius: 0,
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
            padding: "16px 16px",
            flex: 1,
            overflowY: "auto",
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
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              labelAlign="left"
              colon={false}
              className="customer-drawer-form"
              onFinish={handleSubmit}
              initialValues={{
                status: "planning",
                defaultPriority: "medium",
              }}
              requiredMark="optional"
            >
              {/* Section: Basic Information */}
              <SectionCard
                icon={<InfoCircleOutlined />}
                title="Basic Information"
                subtitle="The essential details that identify this project"
                step="STEP 1"
              >
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="name"
                  label="Project Name"
                  rules={[
                    { required: true, message: "Please enter project name" },
                    { min: 2, message: "Name must be at least 2 characters" },
                  ]}
                >
                  <Input placeholder="e.g. Website Redesign" size="large" style={{ borderRadius: 6 }} />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="code"
                  label="Project Code"
                >
                  <Input placeholder="e.g. WEB" size="large" style={{ borderRadius: 6, textTransform: "uppercase" }} />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="status"
                  label="Project Status"
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <SearchableDropdown
                    placeholder="Select status"
                    style={{ borderRadius: 6 }}
                    width="100%"
                    options={[
                      { label: "Planning", value: "planning" },
                      { label: "Active", value: "active" },
                      { label: "On Hold", value: "on-hold" },
                      { label: "Completed", value: "completed" },
                      { label: "Cancelled", value: "cancelled" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="description"
                  label="Project Description"
                  rules={[{ required: true, message: "Please enter description" }]}
                >
                  <Input.TextArea rows={4} placeholder="What is this project about?" style={{ borderRadius: 6 }} />
                </Form.Item>
              </SectionCard>

              {/* Section: Team & Responsibility */}
              <SectionCard
                icon={<TeamOutlined />}
                title="Team & Responsibility"
                subtitle="Assign a lead and the people who will contribute"
                step="STEP 2"
              >
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="projectManagerId"
                  label="Project Manager"
                  rules={[{ required: true, message: "Please select manager" }]}
                >
                  <SearchableDropdown
                    placeholder="Select lead"
                    style={{ borderRadius: 6 }}
                    width="100%"
                    itemNoun="managers"
                    showSelectedAvatar={true}
                    onChange={handleProjectManagerChange}
                    options={members.map((member) => ({
                      label: member.label,
                      value: member.value,
                      description: member.position,
                      avatarUrl: member.avatarUrl || undefined,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="defaultPriority"
                  label="Default Priority"
                  rules={[{ required: true, message: "Please select priority" }]}
                >
                  <SearchableDropdown
                    placeholder="Priority"
                    style={{ borderRadius: 6 }}
                    width="100%"
                    options={[
                      { label: "High", value: "high" },
                      { label: "Medium", value: "medium" },
                      { label: "Low", value: "low" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="teamMemberIds"
                  label="Team Members"
                  help={<span style={{ fontSize: 11, color: "var(--text-slate-400)" }}>The Project Manager is automatically included</span>}
                >
                  <SearchableDropdown
                    mode="multiple"
                    placeholder="Add contributors"
                    style={{ borderRadius: 6 }}
                    width="100%"
                    itemNoun="members"
                    onChange={handleTeamMembersChange}
                    options={members.map((member) => ({
                      label: member.label,
                      value: member.value,
                      description: member.position,
                      avatarUrl: member.avatarUrl || undefined,
                    }))}
                    showSelectedAvatar
                  />
                </Form.Item>
              </SectionCard>

              {/* Section: Timeline & Resources */}
              <SectionCard
                icon={<CalendarOutlined />}
                title="Timeline & Resources"
                subtitle="Set the schedule and link any external resources"
                step="STEP 3"
              >
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="startDate"
                  label="Estimated Start"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <DatePicker 
                    size="large" 
                    style={{ width: "100%", borderRadius: 6 }} 
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="endDate"
                  label="Estimated Completion"
                >
                  <DatePicker 
                    size="large" 
                    style={{ width: "100%", borderRadius: 6 }} 
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 14 }}
                  name="repositories"
                  label="Repository URL"
                >
                  <Input
                    placeholder="e.g. https://github.com/org/repo"
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </SectionCard>
            </Form>
          </ConfigProvider>
        </div>

        {/* Drawer Footer */}
        <div
          className="customer-drawer-footer"
          style={{
            padding: "14px 28px",
            borderTop: "1px solid var(--border-color)",
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
              style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: "0 18px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading || dataLoading}
              icon={(fullProject || project) ? <EditOutlined /> : <PlusOutlined />}
              style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: "0 18px" }}
            >
              {(fullProject || project) ? "Save Changes" : "Create Project"}
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  );
};
