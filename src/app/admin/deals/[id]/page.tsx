'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Tabs, Button, Tag, Space, Typography, Card, Skeleton, message, Breadcrumb } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  SwapOutlined, 
  RocketOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { dealService, Deal } from '@/services/dealService';
import { userService } from '@/services/userService';
import dayjs from 'dayjs';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Avatar, Tooltip } from 'antd';

// Tab Components
import OverviewTab from './components/OverviewTab';
import ActivitiesTab from './components/ActivitiesTab';
import CommunicationTab from './components/CommunicationTab';
import TasksTab from './components/TasksTab';
import FilesTab from './components/FilesTab';
import FinancialsTab from './components/FinancialsTab';
import ConvertProjectModal from './components/ConvertProjectModal';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const DealDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [moveForm] = Form.useForm();

  useEffect(() => {
    if (dealId) {
      fetchDealDetails();
      fetchStages();
      fetchUsers();
    }
  }, [dealId]);

  const fetchDealDetails = async () => {
    try {
      setLoading(true);
      const data = await dealService.getDealById(dealId);
      setDeal(data);
    } catch (error) {
      console.error('Failed to fetch deal details:', error);
      message.error('Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const data = await dealService.getPipelineStages();
      setStages(data);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleEditDeal = async (values: any) => {
    try {
      setSubmitting(true);
      const updated = await dealService.updateDeal(dealId, values);
      setDeal(updated);
      message.success('Deal updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      message.error('Failed to update deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStage = async (values: any) => {
    try {
      setSubmitting(true);
      const updated = await dealService.updateDeal(dealId, { stageId: values.stageId });
      setDeal(updated);
      message.success('Deal moved to new stage');
      setIsMoveModalOpen(false);
    } catch (error) {
      message.error('Failed to move deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertDeal = async (values: any) => {
    try {
      setSubmitting(true);
      const result = await dealService.convertToProject(dealId, values);
      message.success('Deal converted to project successfully!');
      router.push(`/admin/projects/manage`); // The projects list or the specific project
      // Note: If you have a specific project detail page, use result.project.id
      if (result.project?.id) {
        router.push(`/admin/projects/manage?projectId=${result.project.id}`); 
        // Or if there's a specific route: router.push(`/admin/projects/${result.project.id}`);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to convert deal');
    } finally {
      setSubmitting(false);
      setIsConvertModalOpen(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '24px' }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Title level={3}>Deal not found</Title>
          <Button type="primary" onClick={() => router.push('/admin/deals')}>Back to Deals</Button>
        </div>
      </MainLayout>
    );
  }

  const items = [
    { key: '1', label: 'Overview', children: <OverviewTab deal={deal} /> },
    { key: '2', label: 'Activities', children: <ActivitiesTab dealId={dealId} /> },
    { key: '3', label: 'Communication', children: <CommunicationTab dealId={dealId} /> },
    { key: '4', label: 'Tasks', children: <TasksTab dealId={dealId} /> },
    { key: '5', label: 'Files', children: <FilesTab dealId={dealId} /> },
    { key: '6', label: 'Financials', children: <FinancialsTab dealId={dealId} /> },
  ];

  const premiumCardStyle = {
    backgroundColor: 'var(--bg-pure-white)',
    borderRadius: '12px',
    border: '1px solid var(--border-slate-100)',
    boxShadow: 'none',
  };

  return (
    <MainLayout>
      <div style={{ padding: '16px', minHeight: '100vh', background: 'var(--bg-pure-white)' }}>
        {/* Breadcrumbs */}
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item>
             <a onClick={() => router.push('/admin/dashboard')}>Dashboard</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
             <a onClick={() => router.push('/admin/deals')}>Deals</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{deal.title}</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ 
          ...premiumCardStyle,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          padding: '16px',
        }}>
          <div>
            <Space direction="vertical" size={1}>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.push('/admin/deals')}
                style={{ padding: 0, height: 'auto', marginBottom: 8 }}
              >
                Back to Pipeline
              </Button>
              <Space align="center" size="middle">
                <Title level={2} style={{ margin: 0, color: 'var(--premium-blue)' }}>
                  {deal.title}
                </Title>
                <Tag 
                  color={deal.stage?.color || 'blue'} 
                  style={{ 
                    fontSize: '14px', 
                    padding: '4px 12px', 
                    borderRadius: '20px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {deal.stage?.name || 'Unknown Stage'}
                </Tag>
                {deal.status === 'Won' && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />}
              </Space>
              <Text type="secondary" style={{ fontSize: '16px' }}>{deal.companyName || 'No Company'}</Text>
            </Space>
          </div>
          
          <Space size="large">
            <div style={{ textAlign: 'right', marginRight: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Value</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--premium-blue)' }}>
                {deal.currency} {deal.estimatedValue?.toLocaleString()}
              </div>
            </div>
            <Space size="small">
              <Button 
                shape="round" 
                icon={<EditOutlined />} 
                onClick={() => {
                  form.setFieldsValue({
                    title: deal.title,
                    estimatedValue: deal.estimatedValue,
                    currency: deal.currency,
                    probability: deal.probability,
                    expectedClosingDate: deal.expectedClosingDate ? dayjs(deal.expectedClosingDate) : null,
                    notes: deal.notes,
                    assigneeIds: deal.assignees?.map(a => a.user.id) || []
                  });
                  setIsEditModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button 
                shape="round" 
                icon={<SwapOutlined />} 
                onClick={() => {
                  moveForm.setFieldsValue({ stageId: deal.stageId });
                  setIsMoveModalOpen(true);
                }}
              >
                Move Stage
              </Button>
              {deal.status !== 'Won' && (
                <Button 
                  type="primary" 
                  shape="round" 
                  icon={<RocketOutlined />}
                  onClick={() => setIsConvertModalOpen(true)}
                  style={{ background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                >
                  Convert to Project
                </Button>
              )}
            </Space>
          </Space>
        </div>

        <Layout style={{ background: 'transparent' }}>
          <Content>
            <div style={{ 
              ...premiumCardStyle,
              padding: '4px 16px', 
            }}>
              <Tabs 
                defaultActiveKey="1" 
                items={items} 
                size="large" 
                style={{ marginTop: 8 }}
                tabBarStyle={{ borderBottom: '1px solid var(--border-slate-100)' }}
              />
            </div>
          </Content>
          
          <Sider width={320} style={{ background: 'transparent', marginLeft: '24px' }}>
            <Card 
              title={<Space><RocketOutlined style={{ color: 'var(--premium-blue)' }} /> Deal Summary</Space>} 
              variant="borderless" 
              style={{ ...premiumCardStyle, height: 'fit-content' }}
              styles={{ header: { borderBottom: '1px solid var(--border-slate-100)' }, body: { padding: '16px' } }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ backgroundColor: 'var(--bg-blue-50)', padding: '16px', borderRadius: '12px' }}>
                  <Text style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-slate-500)' }}>Assigned Team</Text>
                  
                  <div style={{ marginTop: 12 }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {deal.assignees && deal.assignees.length > 0 ? (
                        deal.assignees.map(assignee => (
                          <div key={assignee.user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                            <Space>
                              <Avatar 
                                size="small" 
                                src={assignee.user.avatar}
                                style={{ backgroundColor: '#1890ff' }}
                              >
                                {assignee.user.name?.[0]}
                              </Avatar>
                              <Text style={{ fontSize: '13px' }}>
                                {assignee.user.name}
                              </Text>
                            </Space>
                          </div>
                        ))
                      ) : (
                        <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>No members assigned</Text>
                      )}
                    </Space>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-slate-500)' }}>Win Probability</Text>
                    <Text strong style={{ color: deal.probability && deal.probability > 70 ? 'var(--text-holiday)' : (deal.probability && deal.probability > 30 ? 'var(--premium-blue)' : 'var(--text-slate-700)') }}>
                      {deal.probability || 0}%
                    </Text>
                  </div>
                  <div style={{ width: '100%', height: 10, backgroundColor: 'var(--bg-slate-50)', borderRadius: 5 }}>
                    <div style={{ 
                      width: `${deal.probability || 0}%`, 
                      height: '100%', 
                      background: 'var(--premium-blue)',
                      borderRadius: 5,
                    }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Expect Closing</div>
                      <Text strong style={{ fontSize: '16px' }}>
                        {deal.expectedClosingDate ? dayjs(deal.expectedClosingDate).format('MMM DD, YYYY') : 'Not set'}
                      </Text>
                    </div>
                  </Space>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Source</Text>
                  <Tag style={{ borderRadius: '12px' }}>{deal.source || 'Direct'}</Tag>
                </div>
              </Space>
            </Card>

            <Card 
              title={<Text strong style={{ color: 'var(--text-slate-900)' }}>Quick Actions</Text>} 
              variant="borderless" 
              style={{ ...premiumCardStyle, marginTop: '16px' }}
              styles={{ header: { borderBottom: '1px solid var(--border-slate-100)' }, body: { padding: '16px' } }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block shape="round" type="default" style={{ transition: 'all 0.3s' }}>Schedule Meeting</Button>
                <Button block shape="round" type="default">Log Email</Button>
                <Button block shape="round" type="default">New Task</Button>
              </Space>
            </Card>
          </Sider>
        </Layout>

        {/* Edit Deal Modal */}
        <Modal
          title="Edit Deal Details"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={submitting}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleEditDeal}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="title" label="Deal Title" rules={[{ required: true }]}>
              <Input placeholder="Enter deal title" />
            </Form.Item>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="estimatedValue" label="Estimated Value" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} prefix={deal.currency} />
              </Form.Item>
              <Form.Item name="probability" label="Probability (%)" style={{ flex: 1 }}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item name="expectedClosingDate" label="Expected Closing Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="assigneeIds" label="Assigned Team">
              <Select
                mode="multiple"
                placeholder="Select team members"
                style={{ width: '100%' }}
                optionFilterProp="children"
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="notes" label="Internal Notes">
              <Input.TextArea rows={4} placeholder="Add any background notes here..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Move Stage Modal */}
        <Modal
          title="Move Deal to Stage"
          open={isMoveModalOpen}
          onCancel={() => setIsMoveModalOpen(false)}
          onOk={() => moveForm.submit()}
          confirmLoading={submitting}
        >
          <Form
            form={moveForm}
            layout="vertical"
            onFinish={handleMoveStage}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="stageId" label="Pipeline Stage" rules={[{ required: true }]}>
              <Select placeholder="Select new stage">
                {stages.map(stage => (
                  <Option key={stage.id} value={stage.id}>
                    <Space>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: stage.color }} />
                      {stage.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Convert to Project Modal */}
        <ConvertProjectModal
          open={isConvertModalOpen}
          onCancel={() => setIsConvertModalOpen(false)}
          onSuccess={(project) => {
            message.success('Project created!');
            router.push(`/admin/projects/manage`);
          }}
          deal={deal}
          submitting={submitting}
          onConvert={handleConvertDeal}
        />
      </div>
    </MainLayout>
  );
};

export default DealDetailsPage;
