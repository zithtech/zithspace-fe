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
  const tagsValue: string[] = Form.useWatch("tags", form) || [];

  useEffect(() => {
    if (open) {
      loadCompanyMembers();
    }
    if (open && projectId) {
      form.setFieldsValue({ project: projectId });
    }
  }, [open, projectId, form]);

  const loadCompanyMembers = async () => {
    try {
      const members = await MembersService.getMembersForSelect();
      setCompanyMembers(members || []);
    } catch (error) {
      console.error("Error loading company members:", error);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const ticketData = {
        ...values,
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
        initialValues={{ storyPoint: 2, estimateHours: 8, priority: 'P2', type: 'Task', tags: [] }}
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
                    <Select size="middle" placeholder="Select platform" style={{ width: '100%' }}>
                      {platforms.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="project" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Target Project</Text>}>
                    <Select size="middle" placeholder="Select project" style={{ width: '100%' }}>
                      {projects.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                    </Select>
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
                    <Select
                      size="middle"
                      style={{ width: '100%', height: 36 }}
                      optionLabelProp="label"
                      dropdownStyle={{ borderRadius: 0 }}
                    >
                      {priorities.map(p => (
                        <Option key={p.value} value={p.value} label={p.label}>
                          <Space size={8}>
                            <Badge color={getPriorityColor(p.value)} />
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="type" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Technical Category</Text>}>
                    <Select
                      size="middle"
                      style={{ width: '100%', height: 36 }}
                      optionLabelProp="label"
                      dropdownStyle={{ borderRadius: 0 }}
                    >
                      {taskTypes.map(t => (
                        <Option key={t.value} value={t.value} label={t.label}>
                          <Tag bordered={false} color="blue" style={{ margin: 0, fontWeight: 600, borderRadius: 0 }}>{t.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                {selectedPlatform?.toLowerCase() === 'development' && (
                     <Form.Item name="stack" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Technical Stack</Text>} rules={[{ required: true }]}>
                        <Select size="middle" placeholder="Select technology stack" style={{ width: '100%', borderRadius: 0 }} dropdownStyle={{ borderRadius: 0 }}>
                          {stacks.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                        </Select>
                      </Form.Item>
                )}

                  
                        <Form.Item name="storyPoint" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Story Points</Text>}>
                          <Select size="middle" placeholder="Points" style={{ width: '100%', height: 32 }} dropdownStyle={{ borderRadius: 0 }}>
                            {[1, 2, 3, 5, 8, 13, 21, 40].map(pt => (
                              <Option key={pt} value={pt}>{pt} Pts</Option>
                            ))}
                          </Select>
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

                  <Form.Item name="assignee" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Primary Owner</Text>}>
                    <Select size="middle" showSearch optionFilterProp="label" placeholder="Select owner" style={{ height: 36 }} dropdownStyle={{ borderRadius: 0 }}>
                      {companyMembers.map(m => (
                        <Option key={m.value} value={m.value} label={m.label}>
                          <Space size={8}>
                            <Avatar size={20} src={m.avatarUrl || undefined} style={{ fontSize: 10, backgroundColor: '#3b82f6' }}>{m.label[0]}</Avatar>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="reportTo" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Reporter</Text>}>
                    <Select size="middle" showSearch optionFilterProp="label" placeholder="Select reporter" style={{ height: 36 }} dropdownStyle={{ borderRadius: 0 }}>
                      {companyMembers.map(m => (
                        <Option key={m.value} value={m.value} label={m.label}>
                          <Space size={8}>
                            <Avatar size={20} src={m.avatarUrl || undefined} style={{ fontSize: 10, backgroundColor: 'var(--text-slate-500)' }}>{m.label[0]}</Avatar>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
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
              <Form.Item name="tags" label={null}>
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
