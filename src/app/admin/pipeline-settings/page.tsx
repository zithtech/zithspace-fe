'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Tag,
  message,
  Typography,
  Card,
  ColorPicker,
  Tabs,
  Badge,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  MenuOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  PartitionOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  QuestionCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MainLayout from '@/components/layout/MainLayout';
import pipelineStageService, { PipelineStage, CreatePipelineStagePayload } from '@/services/pipelineStageService';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';

const { Title, Text } = Typography;

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row = (props: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    cursor: 'move',
    zIndex: isDragging ? 9999 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('stages');

  const fetchStages = async () => {
    try {
      setLoading(true);
      const data = await pipelineStageService.getAll();
      setStages(data);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
      message.error('Failed to load pipeline stages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
  );

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const oldIndex = stages.findIndex((i) => i.id === active.id);
      const newIndex = stages.findIndex((i) => i.id === over?.id);
      const newStages = arrayMove(stages, oldIndex, newIndex);
      
      setStages(newStages);

      try {
        await pipelineStageService.reorder(newStages.map(s => s.id));
        message.success('Order updated successfully');
      } catch (error) {
        console.error('Failed to update order:', error);
        message.error('Failed to save new order');
        fetchStages(); // Revert on failure
      }
    }
  };

  const handleAdd = () => {
    setEditingStage(null);
    form.resetFields();
    form.setFieldsValue({ color: '#1677ff', probability: 0, isFinal: false, isDefault: false });
    setIsModalVisible(true);
  };

  const handleEdit = (stage: PipelineStage) => {
    setEditingStage(stage);
    form.setFieldsValue({
        ...stage,
        color: stage.color || '#1677ff'
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await pipelineStageService.delete(id);
      message.success('Stage deleted successfully');
      fetchStages();
    } catch (error) {
      console.error('Failed to delete stage:', error);
      message.error('Failed to delete stage');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Extract hex from ColorPicker if it's an object
      const colorValue = typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1677ff';

      if (editingStage) {
        await pipelineStageService.update(editingStage.id, { ...values, color: colorValue });
        message.success('Stage updated successfully');
      } else {
        await pipelineStageService.create({ ...values, color: colorValue });
        message.success('Stage added successfully');
      }
      setIsModalVisible(false);
      fetchStages();
    } catch (error: any) {
      console.error('Form validation failed:', error);
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('An error occurred');
      }
    }
  };

  const addDefaultStages = async () => {
    const defaults = [
      { name: 'Lead', color: '#8c8c8c', probability: 10, isFinal: false },
      { name: 'Qualified', color: '#1890ff', probability: 20, isFinal: false },
      { name: 'Proposal Sent', color: '#722ed1', probability: 40, isFinal: false },
      { name: 'Negotiation', color: '#fa8c16', probability: 60, isFinal: false },
      { name: 'Awaiting Signature', color: '#13c2c2', probability: 80, isFinal: false },
      { name: 'Won', color: '#52c41a', probability: 100, isFinal: true },
      { name: 'Lost', color: '#f5222d', probability: 0, isFinal: true },
    ];

    try {
      setLoading(true);
      for (const stage of defaults) {
        await pipelineStageService.create(stage);
      }
      message.success('Default stages added successfully');
      fetchStages();
    } catch (error) {
      console.error('Failed to add default stages:', error);
      message.error('Failed to add some default stages');
      fetchStages();
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<PipelineStage> = [
    {
      key: 'sort',
      width: 50,
      render: () => <MenuOutlined style={{ cursor: 'grab', color: 'var(--text-slate-400)' }} />,
    },
    {
      title: 'Stage Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Text strong style={{ fontSize: '15px' }}>{text}</Text>
          {record.isFinal && (
            <Tooltip title="This is a final stage (Won or Lost)">
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          {record.isDefault && (
            <Tag color="gold" style={{ fontSize: '10px', height: '18px', lineHeight: '16px' }}>DEFAULT</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: color, border: '1px solid var(--border-slate-200)' }} />
          <Text code style={{ background: 'var(--bg-slate-50)', color: 'var(--text-slate-700)', border: '1px solid var(--border-slate-100)' }}>{color}</Text>
        </div>
      ),
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob) => (
        <Space size={4}>
          <Text strong>{prob}%</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>chance</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          {record.isFinal ? (
            <Tag color="success">Closing Stage</Tag>
          ) : (
            <Tag color="processing">Active Pipeline</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_, record) => (
        <Space size={8}>
          <Button 
            type="text"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            className="hover-btn"
          />
          <Button 
            type="text"
            icon={<DeleteOutlined />} 
            danger 
            onClick={() => handleDelete(record.id)} 
            className="hover-btn"
          />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'stages',
      label: (
        <span>
          <PartitionOutlined />
          Pipeline Stages
        </span>
      ),
      children: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <Text style={{ color: 'var(--text-slate-500)' }}>
                Define and reorder the stages of your sales process. These will appear in the Deal Board and Sales Pipeline views.
              </Text>
            </div>
            <Space>
              {stages.length === 0 && (
                <Button onClick={addDefaultStages} loading={loading}>
                  Add Default Stages
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                Add New Stage
              </Button>
            </Space>
          </div>

          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid var(--border-slate-100)', background: 'var(--bg-pure-white)' }}>
            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
              <SortableContext
                items={stages.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  components={{
                    body: {
                      row: Row,
                    },
                  }}
                  rowKey="id"
                  columns={columns}
                  dataSource={stages}
                  pagination={false}
                  loading={loading}
                  className="pipeline-table"
                />
              </SortableContext>
            </DndContext>
          </Card>
        </div>
      ),
    },
    {
      key: 'automations',
      label: (
        <span>
          <ThunderboltOutlined />
          Automations
        </span>
      ),
      children: (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <ThunderboltOutlined style={{ fontSize: '48px', color: 'var(--text-slate-300)', marginBottom: '16px' }} />
          <Title level={4} style={{ color: 'var(--text-slate-900)' }}>Pipeline Automations</Title>
          <Text style={{ color: 'var(--text-slate-500)' }}>Automate actions when deals move between stages. (Coming Soon)</Text>
          <div style={{ marginTop: '24px' }}>
            <Button disabled style={{ borderRadius: 8 }}>Create Automation Rule</Button>
          </div>
        </div>
      ),
    },
    {
      key: 'fields',
      label: (
        <span>
          <UnorderedListOutlined />
          Custom Fields
        </span>
      ),
      children: (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <UnorderedListOutlined style={{ fontSize: '48px', color: 'var(--text-slate-300)', marginBottom: '16px' }} />
          <Title level={4} style={{ color: 'var(--text-slate-900)' }}>Deal Custom Fields</Title>
          <Text style={{ color: 'var(--text-slate-500)' }}>Add custom data specific to your business deals. (Coming Soon)</Text>
          <div style={{ marginTop: '24px' }}>
            <Button disabled style={{ borderRadius: 8 }}>Add Custom Field</Button>
          </div>
        </div>
      ),
    },
    {
       key: 'reasons',
       label: (
         <span>
           <QuestionCircleOutlined />
           Loss Reasons
         </span>
       ),
       children: (
         <div style={{ padding: '40px', textAlign: 'center' }}>
           <QuestionCircleOutlined style={{ fontSize: '48px', color: 'var(--text-slate-300)', marginBottom: '16px' }} />
           <Title level={4} style={{ color: 'var(--text-slate-900)' }}>Loss Reason Configuration</Title>
           <Text style={{ color: 'var(--text-slate-500)' }}>Configure common reasons why deals are lost to improve your sales insights.</Text>
           <div style={{ marginTop: '24px' }}>
             <Button disabled style={{ borderRadius: 8 }}>Manage Loss Reasons</Button>
           </div>
         </div>
       ),
    }
  ];

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        <TimeTrackingHeader
          style={{ padding: '10.5px 32px' }}
          icon={<FireOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Pipeline Settings"
          description="Configure your sales funnel, stages, and automation rules"
        />

        <div style={{ padding: "0 32px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems}
            size="large"
            type="line"
            tabBarStyle={{ marginBottom: '16px' }}
          />
        </div>
      </div>

      <Modal
        title={editingStage ? 'Edit Pipeline Stage' : 'Add Pipeline Stage'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
        zIndex={99999}
        getContainer={() => document.body}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Stage Name"
            rules={[{ required: true, message: 'Please enter stage name' }]}
          >
            <Input placeholder="e.g. Lead, Qualified" />
          </Form.Item>

          <Form.Item
            name="color"
            label="Color Tag"
            rules={[{ required: true, message: 'Please select a color' }]}
          >
            <ColorPicker showText />
          </Form.Item>

          <Form.Item
            name="probability"
            label="Probability (%)"
            rules={[
              { required: true, message: 'Please enter probability' },
              { type: 'number', min: 0, max: 100, message: 'Probability must be between 0 and 100' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={100} formatter={value => `${value}%`} parser={value => value!.replace('%', '') as any} />
          </Form.Item>

          <Form.Item
            name="isFinal"
            label="Is Final Stage (Won/Lost)"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item
            name="isDefault"
            label="Set as Default Stage"
            valuePropName="checked"
            help="Designating this will automatically unset any other default stage."
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .pipeline-table .ant-table-thead > tr > th {
          background: var(--bg-table-header) !important;
          color: var(--text-slate-900) !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .hover-btn:hover {
          background: var(--bg-slate-50) !important;
        }
        .ant-tabs-tab {
          font-weight: 500;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          font-weight: 600;
        }
      `}</style>
    </MainLayout>
  );
}
