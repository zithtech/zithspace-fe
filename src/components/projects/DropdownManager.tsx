'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Tabs,
  Row,
  Col,
  Typography,
  InputNumber,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import { SettingsService, DropdownOption, CreateDropdownOptionData, UpdateDropdownOptionData } from '@/services/settingsService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface DropdownManagerProps {
  onDataChange?: () => void;
}

export default function DropdownManager({ onDataChange }: DropdownManagerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [activeTab, setActiveTab] = useState('platform');
  
  // State for dropdown options grouped by type
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownOption[]>>({});

  const dropdownTypes = [
    { key: 'platform', label: 'Platforms', description: 'Team platforms and departments' },
    { key: 'stack', label: 'Stacks', description: 'Technology stacks for development' },
    { key: 'priority', label: 'Priorities', description: 'Task priority levels' },
    { key: 'taskLevel', label: 'Task Levels', description: 'Task complexity levels' },
    { key: 'taskType', label: 'Task Types', description: 'Types of tasks and activities' },
    { key: 'status', label: 'Statuses', description: 'Task status options' }
  ];

  // Load dropdown options
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  const loadDropdownOptions = async () => {
    try {
      setDataLoading(true);
      const options = await SettingsService.getDropdownOptions();
      setDropdownOptions(options);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
      message.error('Failed to load dropdown options');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingOption(null);
    form.resetFields();
    form.setFieldsValue({ type: activeTab, isActive: true, order: getNextOrder(activeTab) });
    setModalVisible(true);
  };

  const handleEdit = (option: DropdownOption) => {
    setEditingOption(option);
    form.setFieldsValue({
      ...option,
      color: option.color || undefined
    });
    setModalVisible(true);
  };

  const handleDelete = async (option: DropdownOption) => {
    try {
      setLoading(true);
      await SettingsService.deleteDropdownOption(option.id);
      message.success('Option deleted successfully');
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error deleting option:', error);
      message.error('Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (option: DropdownOption) => {
    try {
      setLoading(true);
      await SettingsService.updateDropdownOption(option.id, { isActive: !option.isActive });
      message.success(`Option ${option.isActive ? 'disabled' : 'enabled'} successfully`);
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error toggling option status:', error);
      message.error('Failed to update option status');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveOrder = async (option: DropdownOption, direction: 'up' | 'down') => {
    try {
      setLoading(true);
      const currentOptions = dropdownOptions[option.type] || [];
      const currentIndex = currentOptions.findIndex(opt => opt.id === option.id);
      
      if (direction === 'up' && currentIndex > 0) {
        const newOrder = currentOptions[currentIndex - 1].order;
        await SettingsService.updateDropdownOption(option.id, { order: newOrder });
      } else if (direction === 'down' && currentIndex < currentOptions.length - 1) {
        const newOrder = currentOptions[currentIndex + 1].order;
        await SettingsService.updateDropdownOption(option.id, { order: newOrder });
      }
      
      message.success('Order updated successfully');
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error updating order:', error);
      message.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const data: CreateDropdownOptionData | UpdateDropdownOptionData = {
        type: values.type,
        value: values.value,
        label: values.label,
        color: values.color?.toHexString?.() || values.color,
        description: values.description,
        order: values.order,
        isActive: values.isActive
      };

      if (editingOption) {
        await SettingsService.updateDropdownOption(editingOption.id, data);
        message.success('Option updated successfully');
      } else {
        await SettingsService.createDropdownOption(data as CreateDropdownOptionData);
        message.success('Option created successfully');
      }

      setModalVisible(false);
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error saving option:', error);
      message.error('Failed to save option');
    } finally {
      setLoading(false);
    }
  };

  const getNextOrder = (type: string): number => {
    const options = dropdownOptions[type] || [];
    return options.length > 0 ? Math.max(...options.map(opt => opt.order)) + 1 : 1;
  };

  const columns = [
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      sorter: (a: DropdownOption, b: DropdownOption) => a.order - b.order,
      render: (order: number, record: DropdownOption) => (
        <Space>
          <Text strong>{order}</Text>
          <Space direction="vertical" size={0}>
            <Button
              type="text"
              size="small"
              icon={<UpOutlined />}
              onClick={() => handleMoveOrder(record, 'up')}
              disabled={loading}
            />
            <Button
              type="text"
              size="small"
              icon={<DownOutlined />}
              onClick={() => handleMoveOrder(record, 'down')}
              disabled={loading}
            />
          </Space>
        </Space>
      )
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: DropdownOption) => (
        <Space>
          {record.color && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: record.color,
                border: '1px solid #d9d9d9'
              }}
            />
          )}
          <Text strong={record.isActive}>{label}</Text>
        </Space>
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => <Tag>{value}</Tag>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Text type="secondary">{description || '-'}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: DropdownOption) => (
        <Tooltip title={`Click to ${isActive ? 'disable' : 'enable'}`}>
          <Button
            type="text"
            size="small"
            icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => handleToggleStatus(record)}
            style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}
          />
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: DropdownOption) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Option"
            description="Are you sure you want to delete this option?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Dropdown Options Management</Title>
          <Text type="secondary">
            Manage all dropdown options used throughout the application
          </Text>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add New Option
            </Button>
          }
        >
          {dropdownTypes.map(type => (
            <TabPane
              tab={
                <Space>
                  {type.label}
                  <Badge count={dropdownOptions[type.key]?.length || 0} />
                </Space>
              }
              key={type.key}
            >
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">{type.description}</Text>
              </div>
              
              <Table
                columns={columns}
                dataSource={dropdownOptions[type.key] || []}
                rowKey="id"
                loading={dataLoading}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />
            </TabPane>
          ))}
        </Tabs>
      </Card>

      <Modal
        title={editingOption ? 'Edit Option' : 'Create New Option'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select a type' }]}
              >
                <Select disabled={!!editingOption}>
                  {dropdownTypes.map(type => (
                    <Select.Option key={type.key} value={type.key}>
                      {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order"
                label="Order"
                rules={[{ required: true, message: 'Please enter order' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Value"
                rules={[{ required: true, message: 'Please enter value' }]}
              >
                <Input placeholder="Internal value (e.g., 'P1')" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="label"
                label="Label"
                rules={[{ required: true, message: 'Please enter label' }]}
              >
                <Input placeholder="Display label (e.g., 'High Priority')" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="color"
                label="Color (Optional)"
              >
                <ColorPicker showText />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Brief description of this option..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
