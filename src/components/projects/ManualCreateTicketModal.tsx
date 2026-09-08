"use client";

import { SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import React, { useState, useEffect } from "react";
import { Drawer, Form, Input, Select, DatePicker, Button, Row, Col, Typography, Space, Tag, InputNumber, notification, Divider, Avatar, Tooltip, Slider, ConfigProvider, Badge, App } from "antd";
import {
  FileTextOutlined, UserOutlined, CalendarOutlined, ThunderboltOutlined,
  CheckCircleOutlined, InfoCircleOutlined, CloseOutlined, PlusOutlined,
  ProjectOutlined, RocketOutlined, FieldTimeOutlined, TeamOutlined,
  LineChartOutlined, FundProjectionScreenOutlined, TagsOutlined
} from "@ant-design/icons";
import { ProjectService } from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import { useCreateTicket, useAllTicketTags } from "@/hooks/useTickets";
import { useUserProjects, useTicketConfig } from "@/hooks/useGlobalData";
import { PRIORITY_OPTIONS, TYPE_OPTIONS, getPriorityColor } from "@/utils/ticketUtils";
import { Ticket } from "@/services/ticketService";
import TiptapEditor from "@/components/common/TiptapEditor";
import { EditableTags } from "@/components/projects/drawer/editable/EditableTags";
import SearchableDropdown, { SearchableDropdownOption } from "@/components/common/SearchableDropdown";

const { Text, Title } = Typography;
const { Option } = Select;

interface ManualCreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onTicketCreated?: (ticket: Ticket) => void;
  /** Status to apply when the new ticket is submitted. Defaults to 'not_started'. */
  defaultStatus?: string;
}

export const ManualCreateTicketModal: React.FC<ManualCreateTicketModalProps> = ({
  open,
  onClose,
  projectId,
  onTicketCreated,
  defaultStatus,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  // const [api, contextHolder] = notification.useNotification({
  //   placement: 'top',
  // });
  const [loading, setLoading] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  const { data: projects = [] } = useUserProjects();
  const { data: ticketConfig } = useTicketConfig();
  const { data: tagSuggestions = [] } = useAllTicketTags();
  const createTicketMutation = useCreateTicket();

  const platforms = ticketConfig?.platforms || [];
  const taskLevels = ticketConfig?.taskLevels || [];
  const stacks = ticketConfig?.stacks || [];
  const priorities = ticketConfig?.priorities?.length ? ticketConfig.priorities : PRIORITY_OPTIONS;
  const taskTypes = ticketConfig?.taskTypes?.length ? ticketConfig.taskTypes : TYPE_OPTIONS;

  // Watch for platform changes
  const selectedPlatform = Form.useWatch("platform", form);
  const selectedProject = Form.useWatch("project", form) || projectId;
  const tagsValue: string[] = Form.useWatch("tags", form) || [];

  const platformOptions: SearchableDropdownOption[] = platforms.map((p: any) => ({ value: p.value, label: p.label }));
  const projectOptions: SearchableDropdownOption[] = projects.map((p: any) => ({ value: p.value, label: p.label }));
  const priorityOptions: SearchableDropdownOption[] = priorities.map((p: any) => ({
    value: p.value,
    label: p.label,
    badge: <Badge color={getPriorityColor(p.value)} />
  }));
  const typeOptions: SearchableDropdownOption[] = taskTypes.map((t: any) => ({
    value: t.value,
    label: t.label,
    badge: <Tag bordered={false} color="blue" style={{ margin: 0, fontWeight: 600, borderRadius: 0 }}>{t.label}</Tag>
  }));
  const stackOptions: SearchableDropdownOption[] = stacks.map((s: any) => ({ value: s.value, label: s.label }));
  const pointOptions: SearchableDropdownOption[] = [1, 2, 3, 5, 8, 13, 21, 40].map(pt => ({
    value: pt.toString(),
    label: `${pt} Pts`
  }));
  const memberOptions: SearchableDropdownOption[] = companyMembers.map((m: any) => ({
    value: m.value,
    label: m.label,
    avatarUrl: m.avatarUrl || undefined,
  }));
  const projectMemberOptions: SearchableDropdownOption[] = projectMembers.map((m: any) => ({
    value: m.value,
    label: m.label,
    avatarUrl: m.avatarUrl || undefined,
  }));

  useEffect(() => {
    if (open) {
      loadCompanyMembers();
    }
    if (open && selectedProject) {
      loadProjectMembers(selectedProject);
    }
    if (open && projectId && !form.getFieldValue("project")) {
      form.setFieldsValue({ project: projectId });
    }
  }, [open, selectedProject, projectId, form]);

  const loadCompanyMembers = async () => {
    try {
      const members = await MembersService.getMembersForSelect();
      setCompanyMembers(members || []);
    } catch (error) {
      console.error("Error loading company members:", error);
    }
  };

  const loadProjectMembers = async (projId: string) => {
    try {
      const members = await ProjectService.getProjectMembers(projId);
      setProjectMembers(members || []);
    } catch (error) {
      console.error("Error loading project members:", error);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const ticketData = {
        ...values,
        storyPoint: values.storyPoint ? Number(values.storyPoint) : undefined,
        startDate: values.startDate?.format("YYYY-MM-DD") || "",
        endDate: values.endDate?.format("YYYY-MM-DD") || "",
        status: defaultStatus || "not_started"
      };

      const savedTicket = await createTicketMutation.mutateAsync(ticketData);
      // Removed local success message, let handleTicketCreated in TicketList handle it
      if (onTicketCreated) onTicketCreated(savedTicket);
      form.resetFields();
      onClose();
    } catch (error: any) {
      message.error(error?.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <RocketOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>New Ticket Creation</div>
            <div style={{ fontSize: 10, color: 'var(--text-slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manual Entry Node</div>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      width={680}
      styles={{
        header: { borderBottom: '1px solid var(--border-color)', padding: '12px 16px', background: 'var(--bg-secondary)' },
        body: { padding: '12px 16px', backgroundColor: 'var(--bg-primary)' },
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.1)' }
      }}
      extra={
        <Space size={8}>
          <Button onClick={onClose} style={{ borderRadius: 0, fontWeight: 600, fontSize: 12, height: 32 }}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
            icon={<CheckCircleOutlined style={{ fontSize: 13 }} />}
            style={{
              borderRadius: 0,
              fontSize: 12,
              fontWeight: 700,
              background: '#2563eb',
              border: 'none',
              height: 32,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
            }}
          >
            Create Ticket
          </Button>
        </Space>
      }
      className="ticket-creation-slider"
    >
      <style>{drawerFormStyles}</style>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
        colon={false}
        className="lead-drawer-form customer-drawer-form"
        onFinish={onFinish}
        initialValues={{ storyPoint: '2', estimateHours: 8, priority: 'P2', type: 'Task', tags: [] }}
        requiredMark={false}
      >
        <ConfigProvider
          theme={{
            token: {
              borderRadius: 0,
              borderRadiusSM: 0,
              borderRadiusLG: 0,
              borderRadiusXS: 0,
            },
            components: {
              Select: { borderRadius: 0 },
              Input: { borderRadius: 0 },
              InputNumber: { borderRadius: 0 },
              DatePicker: { borderRadius: 0 },
              Button: { borderRadius: 0 }
            }
          }}
        >
          

            {/* Field Section: Core Context */}
            <SectionCard step="STEP 1" icon={<ProjectOutlined style={{ color: '#475569', fontSize: 13 }} />} title="Core Context" subtitle="General ticket information">

              <Form.Item name="title" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Subject</Text>} rules={[{ required: true }]}>
                <Input placeholder="Enter brief summary of the task..." size="middle" style={{ borderRadius: 0, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </Form.Item>

                  <Form.Item name="platform" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Platform</Text>} rules={[{ required: true }]}>
                    <SearchableDropdown options={platformOptions} placeholder="Select platform" hideAvatar allowClear />
                  </Form.Item>
                  <Form.Item name="project" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Target Project</Text>}>
                    <SearchableDropdown options={projectOptions} placeholder="Select project" hideAvatar allowClear />
                  </Form.Item>
            </SectionCard>

            {/* Field Section: Documentation */}
            <SectionCard step="STEP 2" icon={<FileTextOutlined style={{ color: '#475569', fontSize: 13 }} />} title="Description" subtitle="Technical requirements and context">
              <Form.Item name="description" label={null} rules={[{ required: true }]} wrapperCol={{ span: 24 }}>
                <div className="tiptap-minimized-wrapper" style={{ borderRadius: 0, border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                  <TiptapEditor
                    placeholder="Provide full technical requirements or context here..."
                    minHeight={160}
                    onChange={(html) => form.setFieldValue("description", html)}
                  />
                </div>
              </Form.Item>
            </SectionCard>

            {/* Field Section: Execution Specs */}
            <SectionCard step="STEP 3" icon={<ThunderboltOutlined style={{ color: '#f59e0b', fontSize: 13 }} />} title="Execution Specs" subtitle="Priority, type, and effort">

                  <Form.Item name="priority" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Priority Level</Text>}>
                    <SearchableDropdown options={priorityOptions} placeholder="Select priority" allowClear />
                  </Form.Item>
                  <Form.Item name="type" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Technical Category</Text>}>
                    <SearchableDropdown options={typeOptions} placeholder="Select category" allowClear />
                  </Form.Item>

                {selectedPlatform?.toLowerCase() === 'development' && (
                     <Form.Item name="stack" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Technical Stack</Text>} rules={[{ required: true }]}>
                        <SearchableDropdown options={stackOptions} placeholder="Select technology stack" hideAvatar allowClear />
                      </Form.Item>
                )}

                  
                        <Form.Item name="storyPoint" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Story Points</Text>}>
                          <SearchableDropdown options={pointOptions} placeholder="Points" hideAvatar allowClear />
                        </Form.Item>
                        <Form.Item name="estimateHours" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Est. Hours</Text>}>
                          <InputNumber
                            min={1}
                            max={1000}
                            style={{ width: '100%', height: 32, borderRadius: 0 }}
                            placeholder="Hours"
                          />
                        </Form.Item>
            </SectionCard>

            {/* Field Section: Ownership & Timeline */}
            <SectionCard step="STEP 4" icon={<TeamOutlined style={{ color: '#10b981', fontSize: 13 }} />} title="Ownership & Timeline" subtitle="Assignments and schedule">

                  <Form.Item name="assignee" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Assignee</Text>}>
                    <SearchableDropdown options={projectMemberOptions} placeholder="Select assignee" allowClear />
                  </Form.Item>
                  <Form.Item name="reportTo" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Reporter</Text>}>
                    <SearchableDropdown options={memberOptions} placeholder="Select reporter" allowClear />
                  </Form.Item>
                  <Form.Item name="startDate" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Start Date</Text>}>
                    <DatePicker size="middle" style={{ width: '100%', height: 36 }} placeholder="Select" />
                  </Form.Item>
                  <Form.Item name="endDate" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>End Date</Text>}>
                    <DatePicker size="middle" style={{ width: '100%', height: 36 }} placeholder="Select" />
                  </Form.Item>
            </SectionCard>

            {/* Field Section: Tags */}
            <SectionCard step="STEP 5" icon={<TagsOutlined style={{ color: '#3b82f6', fontSize: 13 }} />} title="Tags" subtitle="Label categorization">
              <Form.Item name="tags" label={null} noStyle>
                <Input type="hidden" />
              </Form.Item>
              <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', borderRadius: 0, minHeight: 44 }}>
                <EditableTags
                  value={tagsValue}
                  suggestions={tagSuggestions}
                  onSave={async (next) => {
                    form.setFieldValue("tags", next);
                  }}
                />
              </div>
            </SectionCard>
        </ConfigProvider>
      </Form>
    </Drawer>
  );
};
