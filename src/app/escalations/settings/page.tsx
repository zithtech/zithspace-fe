'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Card,
  Tabs,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  message,
  Popconfirm,
  Tooltip,
  ColorPicker,
  Switch
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BlockOutlined,
  UpSquareOutlined,
  BgColorsOutlined,
  InfoCircleOutlined,
  CheckSquareOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { EscalationSettingsService } from '@/services/escalationSettings';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const BLUE_PRIMARY = 'var(--premium-blue)';

interface EscalationCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
}

interface EscalationPriority {
  id: string;
  name: string;
  weight: number;
  color: string | null;
  isActive: boolean;
}

export default function EscalationSettingsPage() {
  const [activeTab, setActiveTab] = useState('1');
  const [categories, setCategories] = useState<EscalationCategory[]>([]);
  const [priorities, setPriorities] = useState<EscalationPriority[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await EscalationSettingsService.getCategories();
      setCategories(data);
    } catch (error: any) {
      message.error('Failed to fetch categories: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPriorities = async () => {
    setLoading(true);
    try {
      const data = await EscalationSettingsService.getPriorities();
      setPriorities(data);
    } catch (error: any) {
      message.error('Failed to fetch priorities: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const data = await EscalationSettingsService.getStatuses();
      setStatuses(data);
    } catch (error: any) {
      message.error('Failed to fetch statuses: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === '1') fetchCategories();
    else if (activeTab === '2') fetchPriorities();
    else fetchStatuses();
  }, [activeTab]);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        color: item.color || BLUE_PRIMARY
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ color: BLUE_PRIMARY, weight: 0, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values: any) => {
    const isCategory = activeTab === '1';
    const isPriority = activeTab === '2';
    const isStatus = activeTab === '3';

    // Convert color to hex string if it's from AntD ColorPicker
    const colorValue = typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || values.color;

    const payload = { ...values, color: colorValue };

    try {
      if (isCategory) {
        if (editingItem) await EscalationSettingsService.updateCategory(editingItem.id, payload);
        else await EscalationSettingsService.createCategory(payload);
        message.success(`Category ${editingItem ? 'updated' : 'created'} successfully`);
      } else if (isPriority) {
        if (editingItem) await EscalationSettingsService.updatePriority(editingItem.id, payload);
        else await EscalationSettingsService.createPriority(payload);
        message.success(`Priority ${editingItem ? 'updated' : 'created'} successfully`);
      } else if (isStatus) {
        if (editingItem) await EscalationSettingsService.updateStatus(editingItem.id, payload);
        else await EscalationSettingsService.createStatus(payload);
        message.success(`Status ${editingItem ? 'updated' : 'created'} successfully`);
      }

      setIsModalOpen(false);

      if (isCategory) fetchCategories();
      else if (isPriority) fetchPriorities();
      else fetchStatuses();
    } catch (error: any) {
      message.error('Failed to save: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === '1') {
        await EscalationSettingsService.deleteCategory(id);
        fetchCategories();
      } else if (activeTab === '2') {
        await EscalationSettingsService.deletePriority(id);
        fetchPriorities();
      } else if (activeTab === '3') {
        await EscalationSettingsService.deleteStatus(id);
        fetchStatuses();
      }
      message.success('Item deleted successfully');
    } catch (error: any) {
      message.error('Delete failed: ' + (error.message || 'Unknown error'));
    }
  };

  const categoryColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: EscalationCategory) => (
        <Space>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: record.color || BLUE_PRIMARY }} />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <Text type="secondary" style={{ fontSize: 13, color: 'var(--text-slate-400)' }}>{desc || 'No description'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'} bordered={false}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: EscalationCategory) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm title="Are you sure you want to delete this category?" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const priorityColumns = [
    {
      title: 'Priority Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: EscalationPriority) => (
        <Space>
          <Tag color={record.color || BLUE_PRIMARY} style={{ fontWeight: 600 }}>{name}</Tag>
        </Space>
      )
    },
    {
      title: 'Weight (Complexity)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => <Text strong>{weight}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'} bordered={false}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: EscalationPriority) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm title="Are you sure you want to delete this priority?" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const statusColumns = [
    {
      title: 'Status Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: record.color || BLUE_PRIMARY }} />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'} bordered={false}>
          {active ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Default',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean) => (
        isDefault ? <Tag color="blue" bordered={false}>DEFAULT</Tag> : null
      )
    },
    {
      title: 'Final',
      dataIndex: 'isFinal',
      key: 'isFinal',
      render: (isFinal: boolean) => (
        isFinal ? <Tag color="orange" bordered={false}>FINAL</Tag> : null
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm title="Are you sure you want to delete this status?" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ padding: '16px 40px', background: 'var(--bg-pure-white)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border-slate-100)'
          }}>
            <Space direction="vertical" size={4}>
              <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-slate-900)' }}>Escalation Settings</Title>
              <Text type="secondary" style={{ fontSize: 14, color: 'var(--text-slate-400)' }}>Manage master data for categories, priorities, and statuses.</Text>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => handleOpenModal()}
              style={{
                borderRadius: 10,
                background: BLUE_PRIMARY,
                fontWeight: 600,
                height: 44,
                padding: '0 24px',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              Add {activeTab === '1' ? 'Category' : activeTab === '2' ? 'Priority' : 'Status'}
            </Button>
          </div>

          <Card
            style={{
              borderRadius: 20,
              border: '1px solid var(--border-slate-200)',
              background: 'var(--bg-pure-white)',
              boxShadow: 'var(--card-shadow)',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ padding: '0 24px' }}
              items={[
                {
                  key: '1',
                  label: <Space><BlockOutlined /> Categories</Space>,
                  children: (
                    <div style={{ padding: '24px 0' }}>
                      <Table
                        dataSource={categories}
                        columns={categoryColumns}
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                        className="premium-table"
                      />
                    </div>
                  )
                },
                {
                  key: '2',
                  label: <Space><UpSquareOutlined /> Priorities</Space>,
                  children: (
                    <div style={{ padding: '24px 0' }}>
                      <Table
                        dataSource={priorities}
                        columns={priorityColumns}
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                        className="premium-table"
                      />
                    </div>
                  )
                },
                {
                  key: '3',
                  label: <Space><CheckSquareOutlined /> Statuses</Space>,
                  children: (
                    <div style={{ padding: '24px 0' }}>
                      <Table
                        dataSource={statuses}
                        columns={statusColumns}
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                        className="premium-table"
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>

          {/* Modal for CRUD */}
          <Modal
            title={<Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)' }}>{editingItem ? 'Edit' : 'Create'} {activeTab === '1' ? 'Escalation Category' : activeTab === '2' ? 'Escalation Priority' : 'Escalation Status'}</Title>}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            okText="Save Changes"
            centered
            width={520}
            bodyStyle={{ padding: '24px 0', background: 'var(--bg-pure-white)' }}
          >
            <Form form={form} layout="vertical" onFinish={handleSave} style={{ padding: '0 24px' }}>
              <Form.Item name="name" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Display Name</Text>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Deployment Failure" size="large" style={{ borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)', color: 'var(--text-slate-900)' }} />
              </Form.Item>

              {activeTab === '1' ? (
                <Form.Item name="description" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Description</Text>}>
                  <Input.TextArea rows={3} placeholder="Briefly describe when this category should be used" style={{ borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)', color: 'var(--text-slate-900)' }} />
                </Form.Item>
              ) : (
                <Form.Item name="weight" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Priority Weight (Order)</Text>}>
                  <InputNumber min={0} max={100} style={{ width: '100%', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)' }} size="large" />
                </Form.Item>
              )}

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="color" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Visual Color</Text>}>
                    <ColorPicker showText />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isActive" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Status</Text>} initialValue={true}>
                    <Select size="large" style={{ borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)' }}>
                      <Option value={true}>Active</Option>
                      <Option value={false}>Inactive</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {activeTab === '3' && (
                <div style={{ background: 'var(--bg-sky-50)', padding: '16px 20px', borderRadius: 12, marginBottom: 20, border: '1px solid var(--border-sky-100)' }}>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="isDefault" valuePropName="checked" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Default Status</Text>} style={{ marginBottom: 0 }}>
                        <Switch />
                      </Form.Item>
                      <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>Set as default for new escalations.</Text>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="isFinal" valuePropName="checked" label={<Text strong style={{ color: 'var(--text-slate-900)' }}>Final State</Text>} style={{ marginBottom: 0 }}>
                        <Switch />
                      </Form.Item>
                      <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>Mark as a terminal/closed state.</Text>
                    </Col>
                  </Row>
                </div>
              )}

              <div style={{ background: 'var(--bg-slate-50)', padding: 16, borderRadius: 12, marginTop: 8 }}>
                <Space>
                  <InfoCircleOutlined style={{ color: BLUE_PRIMARY }} />
                  <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>
                    Changes will reflect immediately across all new and existing manual escalations.
                  </Text>
                </Space>
              </div>
            </Form>
          </Modal>

        </div>

        <style jsx global>{`
          .premium-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50);
            color: var(--text-slate-600);
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border-slate-200);
            padding: 12px 16px;
          }
          .premium-table .ant-table-tbody > tr > td {
            padding: 16px;
            border-bottom: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white);
            color: var(--text-slate-700);
          }
          .premium-table .ant-table-row:hover > td {
            background: var(--bg-slate-50) !important;
          }
          .ant-tabs-nav {
            margin-bottom: 0 !important;
            padding: 8px 24px 0 !important;
            background: var(--bg-slate-50);
            border-bottom: 1px solid var(--border-slate-200);
          }
          .ant-tabs-tab {
            padding: 12px 16px !important;
            margin: 0 8px 0 0 !important;
            font-weight: 500 !important;
            color: var(--text-slate-400) !important;
          }
          .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: var(--premium-blue) !important;
            font-weight: 700 !important;
          }
          .ant-tabs-ink-bar {
            height: 3px !important;
            background: var(--premium-blue) !important;
            border-radius: 3px 3px 0 0;
          }
          .ant-modal-content, .ant-modal-header {
            background: var(--bg-pure-white) !important;
          }
          .ant-modal-title {
            color: var(--text-slate-900) !important;
            background: var(--bg-pure-white) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
