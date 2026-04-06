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
  message,
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
  LoadingOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BLUE_PRIMARY = '#2563eb';

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
  description?: string;
  color?: string;
}

interface Priority {
  id: string;
  name: string;
  description?: string;
  weight: number;
  color?: string;
}

interface Status {
  id: string;
  name: string;
  color?: string;
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
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resArray = await Promise.all([
          api.get('/api/members/select'),
          api.get('/api/escalation-settings/categories'),
          api.get('/api/escalation-settings/priorities'),
          api.get('/api/projects/select'),
          api.get('/api/escalation-settings/statuses')
        ]);

        const [membersRes, categoriesRes, prioritiesRes, projectsRes, statusesRes] = resArray;
        
        setMembers(membersRes || []);
        setCategories((categoriesRes || []).filter((c: any) => c.isActive));
        setPriorities((prioritiesRes || []).filter((p: any) => p.isActive).sort((a: any, b: any) => b.weight - a.weight));
        setProjects(projectsRes || []);
        
        const activeStatuses = (statusesRes || []).filter((s: any) => s.isActive);
        setStatuses(activeStatuses);

        // Pre-select default status
        const defaultStatus = activeStatuses.find((s: any) => s.isDefault);
        if (defaultStatus) {
          form.setFieldsValue({ statusId: defaultStatus.id });
        }
      } catch (error) {
        console.error('Failed to fetch escalation context data:', error);
        message.error('Failed to load some form data. Please try again.');
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
      const payload = {
        subject: values.subject,
        description: values.description,
        categoryId: values.categoryId,
        priorityId: values.priorityId,
        projectId: values.projectId,
        statusId: values.statusId,
        targetMemberIds: values.targetUsers,
        ticketIds: values.ticketIds || [],
        attachments: [], 
      };

      await api.post('/api/escalations', payload);
      message.success('Escalation created successfully!');
      router.push('/escalations');
    } catch (error) {
      console.error('Failed to create escalation:', error);
      message.error('Failed to create escalation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '16px 40px', background: '#ffffff', minHeight: '100vh' }}>
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Initializing Form...">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Top Navigation Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: '#ffffff',
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
                    color: '#64748b',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Raise Manual Escalation
                </Title>
                <Text type="secondary" style={{ fontSize: 15, color: '#64748b' }}>
                  Provide detailed context for performance or quality concerns.
                </Text>
              </Space>
              
              <Space size={12}>
                <Button 
                  size="large" 
                  style={{ borderRadius: 10, height: 44, fontWeight: 600, border: '1px solid #e2e8f0' }} 
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
                          <div style={{ background: `${BLUE_PRIMARY}15`, padding: 8, borderRadius: 8 }}>
                            <UserOutlined style={{ color: BLUE_PRIMARY, fontSize: 16 }} />
                          </div>
                          <Text strong style={{ fontSize: 16 }}>Team Context</Text>
                        </Space>
                      }
                      style={{ 
                        borderRadius: 20, 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' 
                      }}
                      bodyStyle={{ padding: '32px' }}
                    >
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item 
                            name="targetUsers" 
                            label={<Text strong>Select Developers / Team Members</Text>} 
                            rules={[{ required: true, message: 'Please select at least one team member' }]}
                          >
                            <Select 
                              mode="multiple"
                              showSearch 
                              placeholder="Search by name or role... (Select multiple if needed)" 
                              size="large" 
                              style={{ borderRadius: 8 }}
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
                                    {member.label} <Text type="secondary" style={{ fontSize: 12 }}>({member.position || member.role})</Text>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            name="categoryId" 
                            label={<Text strong>Escalation Category</Text>} 
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
                        description="Manual quality escalations are stored for performance review cycles and technical leadership audits."
                        type="info"
                        showIcon
                        style={{ borderRadius: 12, marginTop: 8, background: '#f0f9ff', borderColor: '#e0f2fe' }}
                      />
                    </Card>

                    {/* Section 2: Issue Details */}
                    <Card 
                      title={
                        <Space size={12}>
                          <div style={{ background: `${BLUE_PRIMARY}15`, padding: 8, borderRadius: 8 }}>
                            <BugOutlined style={{ color: BLUE_PRIMARY, fontSize: 16 }} />
                          </div>
                          <Text strong style={{ fontSize: 16 }}>Escalation Particulars</Text>
                        </Space>
                      }
                      style={{ 
                        borderRadius: 20, 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' 
                      }}
                      bodyStyle={{ padding: '32px' }}
                    >
                      <Form.Item 
                        name="subject" 
                        label={<Text strong>Subject / Short Summary</Text>} 
                        rules={[{ required: true, message: 'Please enter a subject' }]}
                      >
                        <Input placeholder="e.g. Repeated issues on Employee Profile page deployment" size="large" style={{ borderRadius: 8 }} />
                      </Form.Item>

                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item 
                            name="priorityId" 
                            label={<Text strong>Escalation Priority</Text>} 
                            rules={[{ required: true, message: 'Please select a priority' }]}
                          >
                            <Select size="large" style={{ borderRadius: 8 }} loading={loading} placeholder="Select severity">
                              {priorities.map(prio => (
                                <Option key={prio.id} value={prio.id}>
                                  <Space>
                                    <Badge color={prio.color || '#ff4d4f'} />
                                    {prio.name}
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item 
                            name="statusId" 
                            label={<Text strong>Initial Status</Text>} 
                            rules={[{ required: true, message: 'Please select a status' }]}
                          >
                            <Select size="large" style={{ borderRadius: 8 }} loading={loading} placeholder="Select status">
                              {statuses.map(status => (
                                <Option key={status.id} value={status.id}>
                                  <Space>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color || BLUE_PRIMARY }} />
                                    {status.name}
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item 
                            name="projectId" 
                            label={<Text strong>Related Project / Module</Text>} 
                          >
                            <Select size="large" style={{ borderRadius: 8 }} placeholder="e.g. HRMS" loading={loading} showSearch optionFilterProp="children">
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
                            label={<Text strong>Related Tickets</Text>} 
                          >
                            <Select 
                              mode="multiple" 
                              size="large" 
                              style={{ borderRadius: 8 }} 
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
                                      <Tag color="blue" style={{ margin: 0 }}>{ticket.ticketNumber}</Tag>
                                      <Text strong>{ticket.title}</Text>
                                    </Space>
                                    {ticket.assignee && (
                                      <Space size={4}>
                                        <UserOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>{ticket.assignee.name}</Text>
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
                      label={<Text strong>Detailed Description</Text>} 
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0 }}
                    >
                      <TextArea 
                        rows={6} 
                        placeholder="Provide clear evidence of the issues. Mention specific instances where the deployment failed on the developer's worked page." 
                        style={{ borderRadius: 12, padding: 16 }} 
                      />
                    </Form.Item>
                  </Card>

                  {/* Section 3: Evidence */}
                  <Card 
                    title={
                      <Space size={12}>
                        <div style={{ background: `${BLUE_PRIMARY}15`, padding: 8, borderRadius: 8 }}>
                          <SafetyOutlined style={{ color: BLUE_PRIMARY, fontSize: 16 }} />
                        </div>
                        <Text strong style={{ fontSize: 16 }}>Evidence & Supporting Material</Text>
                      </Space>
                    }
                    style={{ 
                      borderRadius: 20, 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' 
                    }}
                    bodyStyle={{ padding: '32px' }}
                  >
                    <Upload.Dragger 
                      multiple 
                      listType="picture" 
                      style={{ 
                        borderRadius: 16, 
                        border: '2px dashed #f1f5f9', 
                        background: '#fafafa',
                        padding: '24px 0'
                      }}
                    >
                      <p className="ant-upload-drag-icon"><UploadOutlined style={{ color: BLUE_PRIMARY, fontSize: 36 }} /></p>
                      <p className="ant-upload-text" style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Click or drag file to this area</p>
                      <p className="ant-upload-hint" style={{ color: '#64748b' }}>Support your case with screenshots, logs, or reference documents.</p>
                    </Upload.Dragger>
                  </Card>
                </Space>
              </Col>

              {/* Right Column: Sidebar Info */}
              <Col lg={8} xl={7}>
                <Space direction="vertical" size={24} style={{ width: '100%', position: 'sticky', top: 24 }}>
                  
                  {/* Notification Status Card */}
                  <Card 
                    style={{ 
                      borderRadius: 20, 
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                      border: 'none',
                      boxShadow: '0 12px 24px -12px rgba(15, 23, 42, 0.4)'
                    }} 
                    bodyStyle={{ padding: 28 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                      <div style={{ background: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 12 }}>
                        <ThunderboltOutlined style={{ color: '#fcd34d', fontSize: 22 }} />
                      </div>
                      <Title level={5} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>What happens next?</Title>
                    </div>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>1.</div>
                        <Text style={{ color: '#cbd5e1', fontSize: 13 }}>Technical leads are notified immediately.</Text>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>2.</div>
                        <Text style={{ color: '#cbd5e1', fontSize: 13 }}>They will review your report within 24 hours.</Text>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>3.</div>
                        <Text style={{ color: '#cbd5e1', fontSize: 13 }}>You'll see any updates here on your dashboard.</Text>
                      </div>
                    </Space>
                  </Card>

                  {/* Manager Cheat-Sheet */}
                  <Card 
                    title={<Text strong style={{ fontSize: 15, color: '#0f172a' }}>Escalation Best Practices</Text>}
                    style={{ borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}
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
                            background: '#f1f5f9', 
                            width: 44, 
                            height: 44, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderRadius: 12,
                            flexShrink: 0
                          }}>{item.icon}</div>
                          <div>
                            <Text strong style={{ display: 'block', fontSize: 14, color: '#334155', marginBottom: 2 }}>{item.title}</Text>
                            <Text type="secondary" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{item.desc}</Text>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </Card>

                  {/* Helpful Link */}
                  <div style={{ 
                    background: '#f0f9ff', 
                    padding: 24, 
                    borderRadius: 20, 
                    border: '1px solid #e0f2fe',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: -10, 
                      width: 60, 
                      height: 60, 
                      background: '#3b82f6', 
                      opacity: 0.03, 
                      borderRadius: '50%' 
                    }} />
                    <Space direction="vertical" size={8}>
                      <Space size={10}>
                        <div style={{ background: '#3b82f6', width: 6, height: 6, borderRadius: '50%' }} />
                        <Text strong style={{ fontSize: 14, color: '#1e40af' }}>Need help?</Text>
                      </Space>
                      <Paragraph style={{ margin: 0, fontSize: 12, color: '#3b82f6', lineHeight: 1.6 }}>
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
