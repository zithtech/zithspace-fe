'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Form,
  Input,
  Select,
  Card,
  Space,
  Divider,
  Alert,
  Upload,
  notification,
  Avatar,
  Row,
  Col,
  Badge,
  Spin,
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  UserOutlined,
  BugOutlined,
  WarningOutlined,
  ProjectOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { EscalationSettingsService } from '@/services/escalationSettings';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BLUE_PRIMARY = 'var(--premium-blue)';

interface Member {
  value: string;
  label: string;
  email: string;
  position?: string;
  role?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
}

interface Priority {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  color?: string | null;
}

interface Status {
  id: string;
  name: string;
  color?: string | null;
  isDefault: boolean;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  assignee?: {
    name: string;
  };
}

interface Project {
  value: string;
  label: string;
}

export default function CreateEscalationPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [notify, contextHolder] = notification.useNotification();

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    notify[type]({
      message: <span className="premium-notif-title">{title}</span>,
      description: <span className="premium-notif-desc">{description}</span>,
      icon: type === 'success' ? <CheckCircleFilled style={{ color: '#10B981' }} /> : <CloseCircleFilled style={{ color: '#EF4444' }} />,
      className: 'premium-notification',
      placement: 'topRight',
      duration: 4,
    });
  };

  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersRes, categoriesRes, prioritiesRes, projectsRes, statusesRes] = await Promise.all([
          api.get('/api/members/select'),
          EscalationSettingsService.getCategories(),
          EscalationSettingsService.getPriorities(),
          api.get('/api/projects/select'),
          EscalationSettingsService.getStatuses()
        ]);

        // Members and Projects fallbacks for safety
        setMembers(membersRes || []);
        setProjects(projectsRes || []);

        // Categories, Priorities, and Statuses are explicitly typed Service arrays natively
        setCategories(categoriesRes.filter(c => c.isActive));
        setPriorities(prioritiesRes.filter(p => p.isActive));

        const activeStatuses = statusesRes.filter(s => s.isActive);
        setStatuses(activeStatuses);

        // Pre-select default status
        const defaultStatus = activeStatuses.find(s => s.isDefault);
        if (defaultStatus) {
          form.setFieldsValue({ statusId: defaultStatus.id });
        }
      } catch (error) {
        console.error('Failed to fetch escalation context data:', error);
        notifyPremium('error', 'Load Failed', 'Failed to load some form data. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedProjectId = Form.useWatch('projectId', form);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!selectedProjectId) {
        setTickets([]);
        return;
      }

      try {
        const res = await api.get(`/api/tickets?projectId=${selectedProjectId}&limit=100`);
        setTickets(res || []);
        // Reset ticket selection when project changes
        form.setFieldsValue({ ticketIds: [] });
      } catch (error) {
        console.error('Failed to fetch project tickets:', error);
      }
    };

    fetchTickets();
  }, [selectedProjectId, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const filePromises = fileList.map((fileItem) => {
        return new Promise<{ fileName: string, fileBase64: string }>((resolve, reject) => {
          const file = fileItem.originFileObj || fileItem;
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve({
            fileName: file.name,
            fileBase64: reader.result as string
          });
          reader.onerror = error => reject(error);
        });
      });

      const attachments = await Promise.all(filePromises);

      const payload = {
        subject: values.subject,
        description: values.description,
        categoryId: values.categoryId,
        priorityId: values.priorityId,
        projectId: values.projectId,
        statusId: values.statusId,
        targetMemberIds: values.targetUsers,
        ticketIds: values.ticketIds || [],
        attachments: attachments,
      };

      await EscalationServiceV2.createEscalation(payload);
      notifyPremium('success', 'Escalation Created', 'The manual escalation has been successfully posted to technical leadership.');
      router.push('/escalations');
    } catch (error) {
      console.error('Failed to create escalation:', error);
      notifyPremium('error', 'Submission Failed', 'Failed to create escalation. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {contextHolder}
      <div style={{ padding: '16px 40px', background: 'var(--bg-pure-white)', minHeight: '100vh' }}>
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Initializing Form...">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Top Navigation Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border-slate-100)',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: 'var(--bg-pure-white)',
              marginRight: -40,
              marginLeft: -40,
              paddingRight: 40,
              paddingLeft: 40
            }}>
              <Space direction="vertical" size={4}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/escalations')}
                  style={{
                    padding: 0,
                    height: 'auto',
                    color: 'var(--text-slate-400)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-slate-900)' }}>
                  Raise Manual Escalation
                </Title>
                <Text type="secondary" style={{ fontSize: 15, color: 'var(--text-slate-500)' }}>
                  Provide detailed context for performance or quality concerns.
                </Text>
              </Space>

              <Space size={12}>
                <Button
                  size="large"
                  style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', color: 'var(--text-slate-600)' }}
                  onClick={() => router.push('/escalations')}
                >
                  Discard
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  style={{
                    borderRadius: 10,
                    background: BLUE_PRIMARY,
                    height: 44,
                    padding: '0 28px',
                    fontWeight: 600,
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                  }}
                  onClick={() => form.submit()}
                  loading={loading}
                >
                  Post Escalation
                </Button>
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <Row gutter={32}>
                {/* Left Column: Form Sections */}
                <Col lg={16} xl={17}>
                  <Space direction="vertical" size={24} style={{ width: '100%' }}>

                    {/* Section 1: Target Team Member */}
                    <Card
                      title={
                        <Space size={12}>
                          <div style={{ background: 'var(--bg-blue-50)', padding: 8, borderRadius: 8 }}>
                            <UserOutlined style={{ color: 'var(--blue-primary)', fontSize: 16 }} />
                          </div>
                          <Text strong style={{ fontSize: 16, color: 'var(--text-slate-900)' }}>Team Context</Text>
                        </Space>
                      }
                      style={{
                        borderRadius: 20,
                        border: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-pure-white)',
                        boxShadow: 'var(--card-shadow)'
                      }}
                      bodyStyle={{ padding: '32px' }}
                    >
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="targetUsers"
                            label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Select Developers / Team Members</Text>}
                            rules={[{ required: true, message: 'Please select at least one team member' }]}
                          >
                            <Select
                              mode="multiple"
                              showSearch
                              placeholder="Search by name or role... (Select multiple if needed)"
                              size="large"
                              style={{ borderRadius: 8, background: 'var(--bg-secondary)' }}
                              loading={loading}
                              filterOption={(input, option) => {
                                const label = option?.children as any;
                                if (typeof label === 'string') return label.toLowerCase().includes(input.toLowerCase());
                                // Handle complex children correctly
                                const member = members.find(m => m.value === option?.value);
                                return (
                                  member?.label?.toLowerCase().includes(input.toLowerCase()) ||
                                  member?.position?.toLowerCase().includes(input.toLowerCase()) ||
                                  member?.email?.toLowerCase().includes(input.toLowerCase())
                                ) ?? false;
                              }}
                            >
                              {members.map(member => (
                                <Option key={member.value} value={member.value}>
                                  <Space>
                                    <Avatar size="small" style={{ backgroundColor: BLUE_PRIMARY }}>
                                      {(member.label as string).charAt(0)}
                                    </Avatar>
                                    <span style={{ color: 'var(--text-slate-900)' }}>{member.label}</span> <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>({member.position || member.role})</Text>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="categoryId"
                            label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Escalation Category</Text>}
                            rules={[{ required: true, message: 'Please select a category' }]}
                          >
                            <Select placeholder="Select issue type" size="large" style={{ borderRadius: 8 }} loading={loading}>
                              {categories.map(cat => (
                                <Option key={cat.id} value={cat.id}>
                                  <Space>
                                    <Badge color={cat.color || BLUE_PRIMARY} />
                                    {cat.name}
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Alert
                        message="Strictly Confidential"
                        description={<span style={{ color: 'var(--text-slate-600)' }}>Manual quality escalations are stored for performance review cycles and technical leadership audits.</span>}
                        type="info"
                        showIcon
                        style={{ borderRadius: 12, marginTop: 8, background: 'var(--bg-sky-50)' }}
                      />
                    </Card>

                    {/* Section 2: Issue Details */}
                    <Card
                      title={
                        <Space size={12}>
                          <div style={{ background: 'var(--bg-blue-50)', padding: 8, borderRadius: 8 }}>
                            <BugOutlined style={{ color: BLUE_PRIMARY, fontSize: 16 }} />
                          </div>
                          <Text strong style={{ fontSize: 16, color: 'var(--text-slate-900)' }}>Escalation Particulars</Text>
                        </Space>
                      }
                      style={{
                        borderRadius: 20,
                        border: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-pure-white)',
                        boxShadow: 'var(--card-shadow)'
                      }}
                      bodyStyle={{ padding: '32px' }}
                    >
                      <Form.Item
                        name="subject"
                        label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Subject / Short Summary</Text>}
                        rules={[{ required: true, message: 'Please enter a subject' }]}
                      >
                        <Input placeholder="e.g. Repeated issues on Employee Profile page deployment" size="large" style={{ borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-slate-900)' }} />
                      </Form.Item>

                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item
                            name="priorityId"
                            label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Escalation Priority</Text>}
                            rules={[{ required: true, message: 'Please select a priority' }]}
                          >
                            <Select size="large" style={{ borderRadius: 8, background: 'var(--bg-secondary)' }} loading={loading} placeholder="Select severity">
                              {priorities.map(prio => (
                                <Option key={prio.id} value={prio.id}>
                                  <Space>
                                    <Badge color={prio.color || 'var(--text-leave)'} />
                                    <span style={{ color: 'var(--text-slate-900)' }}>{prio.name}</span>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="statusId"
                            label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Initial Status</Text>}
                            rules={[{ required: true, message: 'Please select a status' }]}
                          >
                            <Select size="large" style={{ borderRadius: 8, background: 'var(--bg-secondary)' }} loading={loading} placeholder="Select status">
                              {statuses.map(status => (
                                <Option key={status.id} value={status.id}>
                                  <Space>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color || BLUE_PRIMARY }} />
                                    <span style={{ color: 'var(--text-slate-900)' }}>{status.name}</span>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="projectId"
                            label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Related Project / Module</Text>}
                          >
                            <Select size="large" style={{ borderRadius: 8, background: 'var(--bg-secondary)' }} placeholder="e.g. HRMS" loading={loading} showSearch optionFilterProp="children">
                              {projects.map(proj => (
                                <Option key={proj.value} value={proj.value}>{proj.label}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={24} style={{ marginTop: 16 }}>
                        <Col span={24}>
                          <Form.Item
                            name="ticketIds"
                            label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Related Tickets</Text>}
                          >
                            <Select
                              mode="multiple"
                              size="large"
                              style={{ borderRadius: 8, background: 'var(--bg-secondary)' }}
                              loading={loading}
                              placeholder="Link related development tickets"
                              optionFilterProp="label"
                              showSearch
                            >
                              {tickets.map(ticket => (
                                <Option
                                  key={ticket.id}
                                  value={ticket.id}
                                  label={`${ticket.ticketNumber} ${ticket.title} ${ticket.assignee?.name || ''}`}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <Space>
                                      <Tag color="blue" bordered={false} style={{ margin: 0, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)' }}>{ticket.ticketNumber}</Tag>
                                      <Text strong style={{ color: 'var(--text-slate-900)' }}>{ticket.title}</Text>
                                    </Space>
                                    {ticket.assignee && (
                                      <Space size={4}>
                                        <UserOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                                        <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>{ticket.assignee.name}</Text>
                                      </Space>
                                    )}
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="description"
                        label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Detailed Description</Text>}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea
                          rows={6}
                          placeholder="Provide clear evidence of the issues. Mention specific instances where the deployment failed on the developer's worked page."
                          style={{ borderRadius: 12, padding: 16, background: 'var(--bg-secondary)', color: 'var(--text-slate-900)' }}
                        />
                      </Form.Item>
                    </Card>

                    {/* Section 3: Evidence */}
                    <Card
                      title={
                        <Space size={12}>
                          <div style={{ background: 'var(--bg-blue-50)', padding: 8, borderRadius: 8 }}>
                            <SafetyOutlined style={{ color: BLUE_PRIMARY, fontSize: 16 }} />
                          </div>
                          <Text strong style={{ fontSize: 16, color: 'var(--text-slate-900)' }}>Evidence & Supporting Material</Text>
                        </Space>
                      }
                      style={{
                        borderRadius: 20,
                        border: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-pure-white)',
                        boxShadow: 'var(--card-shadow)'
                      }}
                      bodyStyle={{ padding: '32px' }}
                    >
                      <Upload.Dragger
                        multiple
                        listType="picture"
                        fileList={fileList}
                        onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                        beforeUpload={() => false}
                        style={{
                          borderRadius: 16,
                          border: '2px dashed var(--border-slate-200)',
                          background: 'var(--bg-slate-50)',
                          padding: '24px 0'
                        }}
                      >
                        <p className="ant-upload-drag-icon"><UploadOutlined style={{ color: BLUE_PRIMARY, fontSize: 36 }} /></p>
                        <p className="ant-upload-text" style={{ fontWeight: 700, color: 'var(--text-slate-900)', fontSize: 16 }}>Click or drag file to this area</p>
                        <p className="ant-upload-hint" style={{ color: 'var(--text-slate-400)' }}>Support your case with screenshots, logs, or reference documents.</p>
                      </Upload.Dragger>
                    </Card>
                  </Space>
                </Col>

                {/* Right Column: Sidebar Info */}
                <Col lg={8} xl={7}>
                  <Space direction="vertical" size={24} style={{ width: '100%', position: 'sticky', top: 24 }}>

                    {/* Notification Status Card - Forced Dark Theme Style */}
                    <div
                      style={{
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        boxShadow: '0 12px 24px -12px rgba(15, 23, 42, 0.6)',
                        padding: 28,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: 10, borderRadius: 12 }}>
                          <ThunderboltOutlined style={{ color: '#fbbf24', fontSize: 22 }} />
                        </div>
                        <span style={{ color: '#ffffff', fontSize: 16, margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>What happens next?</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, marginTop: 1 }}>1.</span>
                          <span style={{ color: '#e2e8f0', fontSize: 13, lineHeight: '1.5', fontWeight: 500 }}>Technical leads are notified immediately.</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, marginTop: 1 }}>2.</span>
                          <span style={{ color: '#e2e8f0', fontSize: 13, lineHeight: '1.5', fontWeight: 500 }}>They will review your report within 24 hours.</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, marginTop: 1 }}>3.</span>
                          <span style={{ color: '#e2e8f0', fontSize: 13, lineHeight: '1.5', fontWeight: 500 }}>You&apos;ll see any updates here on your dashboard.</span>
                        </div>
                      </div>
                    </div>

                    {/* Manager Cheat-Sheet */}
                    <Card
                      title={<Text strong style={{ fontSize: 15, color: 'var(--text-slate-900)' }}>Escalation Best Practices</Text>}
                      style={{ borderRadius: 20, border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}
                      bodyStyle={{ padding: '24px 20px' }}
                    >
                      <Space direction="vertical" size={24}>
                        {[
                          { icon: '🔍', title: 'Be Specific', desc: 'Instead of saying "it\'s broken", explain exactly what went wrong.' },
                          { icon: '🏗️', title: 'Show Proof', desc: 'Add a screenshot or link a ticket to help us understand faster.' },
                          { icon: '🤝', title: 'Stay Helpful', desc: 'The goal is to fix the issue and prevent it from happening again.' }
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 18 }}>
                            <div style={{
                              fontSize: 20,
                              background: 'var(--bg-slate-50)',
                              width: 44,
                              height: 44,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 12,
                              flexShrink: 0
                            }}>{item.icon}</div>
                            <div>
                              <Text strong style={{ display: 'block', fontSize: 14, color: 'var(--text-slate-700)', marginBottom: 2 }}>{item.title}</Text>
                              <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-slate-400)', lineHeight: 1.4 }}>{item.desc}</Text>
                            </div>
                          </div>
                        ))}
                      </Space>
                    </Card>

                    {/* Helpful Link */}
                    <div style={{
                      background: 'var(--bg-sky-50)',
                      padding: 24,
                      borderRadius: 20,
                      border: '1px solid var(--border-sky-100)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        width: 60,
                        height: 60,
                        background: 'var(--premium-blue)',
                        opacity: 0.05,
                        borderRadius: '50%'
                      }} />
                      <Space direction="vertical" size={8}>
                        <Space size={10}>
                          <div style={{ background: 'var(--premium-blue)', width: 6, height: 6, borderRadius: '50%' }} />
                          <Text strong style={{ fontSize: 14, color: 'var(--text-sky-600)' }}>Need help?</Text>
                        </Space>
                        <Paragraph style={{ margin: 0, fontSize: 12, color: 'var(--text-sky-600)', lineHeight: 1.6 }}>
                          If you're unsure about something, reach out to your team lead or check our internal documentation.
                        </Paragraph>
                      </Space>
                    </div>

                  </Space>
                </Col>
              </Row>
            </Form>
          </div>
        </Spin>
      </div>
    </MainLayout>
  );
}
