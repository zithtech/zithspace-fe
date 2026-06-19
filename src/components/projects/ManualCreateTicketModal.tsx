"use client";

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
      width={500}
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
      <Form
        form={form}
        layout="vertical"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Field Section: Core Context */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: 6, background: 'var(--bg-blue-50)', borderRadius: 0, display: 'flex' }}>
                  <ProjectOutlined style={{ color: 'var(--premium-blue)', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Core Context</Text>
              </div>

              <Form.Item name="title" label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)' }}>Subject</Text>} rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                <Input placeholder="Enter brief summary of the task..." size="middle" style={{ borderRadius: 0, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="platform" label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)' }}>Platform</Text>} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                    <Select size="middle" placeholder="Select platform" style={{ width: '100%' }}>
                      {platforms.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="project" label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)' }}>Target Project</Text>} style={{ marginBottom: 0 }}>
                    <Select size="middle" placeholder="Select project" style={{ width: '100%' }}>
                      {projects.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Field Section: Documentation */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: 6, background: 'var(--bg-slate-50)', borderRadius: 0, display: 'flex' }}>
                  <FileTextOutlined style={{ color: 'var(--text-slate-500)', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Description</Text>
              </div>
              <Form.Item name="description" label={null} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <div className="tiptap-minimized-wrapper" style={{ borderRadius: 0, border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                  <TiptapEditor
                    placeholder="Provide full technical requirements or context here..."
                    minHeight={160}
                    onChange={(html) => form.setFieldValue("description", html)}
                  />
                </div>
              </Form.Item>
            </div>

            {/* Field Section: Execution Specs */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: 6, background: 'var(--bg-orange-50)', borderRadius: 0, display: 'flex' }}>
                  <ThunderboltOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Execution Specs</Text>
              </div>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item name="priority" label={<Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-500)' }}>Priority Level</Text>} style={{ marginBottom: 0 }}>
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
                </Col>
                <Col span={12}>
                  <Form.Item name="type" label={<Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-500)' }}>Technical Category</Text>} style={{ marginBottom: 0 }}>
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
                </Col>

                {selectedPlatform?.toLowerCase() === 'development' && (
                  <Col span={24}>
                     <Form.Item name="stack" label={<Text style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Technical Stack</Text>} rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                        <Select size="middle" placeholder="Select technology stack" style={{ width: '100%', borderRadius: 0 }} dropdownStyle={{ borderRadius: 0 }}>
                          {stacks.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                        </Select>
                      </Form.Item>
                  </Col>
                )}

                <Col span={24}>
                  <div style={{ background: 'var(--bg-slate-50)', padding: '12px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
                    <Row gutter={16} align="middle">
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <LineChartOutlined style={{ fontSize: 13, color: 'var(--premium-blue)' }} />
                          <Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-500)' }}>Story Points</Text>
                        </div>
                        <Form.Item name="storyPoint" label={null} style={{ marginBottom: 0 }}>
                          <Select size="middle" placeholder="Points" style={{ width: '100%', height: 32 }} dropdownStyle={{ borderRadius: 0 }}>
                            {[1, 2, 3, 5, 8, 13, 21, 40].map(pt => (
                              <Option key={pt} value={pt}>{pt} Pts</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <FieldTimeOutlined style={{ fontSize: 13, color: 'var(--premium-blue)' }} />
                          <Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-500)' }}>Est. Hours</Text>
                        </div>
                        <Form.Item name="estimateHours" label={null} style={{ marginBottom: 0 }}>
                          <InputNumber
                            min={1}
                            max={1000}
                            style={{ width: '100%', height: 32, borderRadius: 0 }}
                            placeholder="Hours"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Field Section: Ownership & Timeline */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: 6, background: 'var(--bg-green-50)', borderRadius: 0, display: 'flex' }}>
                  <TeamOutlined style={{ color: '#10b981', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Ownership & Timeline</Text>
              </div>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item name="assignee" label={<Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-500)' }}>Primary Owner</Text>} style={{ marginBottom: 0 }}>
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
                </Col>
                <Col span={12}>
                  <Form.Item name="reportTo" label={<Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-500)' }}>Reporter</Text>} style={{ marginBottom: 0 }}>
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
                </Col>
                <Col span={12}>
                  <Form.Item name="startDate" label={<Text style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Start Date</Text>} style={{ marginBottom: 0 }}>
                    <DatePicker size="middle" style={{ width: '100%', height: 36 }} placeholder="Select" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="endDate" label={<Text style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>End Date</Text>} style={{ marginBottom: 0 }}>
                    <DatePicker size="middle" style={{ width: '100%', height: 36 }} placeholder="Select" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Field Section: Tags */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 0, border: '1px solid var(--border-color)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: 6, background: 'var(--bg-blue-50)', borderRadius: 0, display: 'flex' }}>
                  <TagsOutlined style={{ color: 'var(--premium-blue)', fontSize: 14 }} />
                </div>
                <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tags</Text>
                {tagsValue.length > 0 && (
                  <Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-400)', marginLeft: 'auto' }}>
                    {tagsValue.length} added
                  </Text>
                )}
              </div>
              <Form.Item name="tags" label={null} style={{ marginBottom: 0 }}>
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
            </div>
          </div>
        </ConfigProvider>
      </Form>
    </Drawer>
  );
};
