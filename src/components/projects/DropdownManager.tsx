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
  Tooltip,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UpOutlined,
  DownOutlined,
  DatabaseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { SettingsService, DropdownOption, CreateDropdownOptionData, UpdateDropdownOptionData } from '@/services/settingsService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
    { key: 'platform', label: 'Platforms', description: 'Core team platforms and delivery departments' },
    { key: 'stack', label: 'Stacks', description: 'Available technology stacks for project tagging' },
    { key: 'priority', label: 'Priorities', description: 'Urgency levels and visual indicators' },
    { key: 'taskLevel', label: 'Complexity', description: 'Difficulty and story point weighting' },
    { key: 'taskType', label: 'Work Types', description: 'Classifications for development activities' },
    { key: 'status', label: 'Lifecycles', description: 'Global status mapping for ticket workflows' }
  ];

  // Load dropdown options
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  const loadDropdownOptions = async () => {
    try {
      setDataLoading(true);
      const options = await SettingsService.getDropdownOptions();
      
      // Sort each category by order
      const sortedOptions: Record<string, DropdownOption[]> = {};
      Object.keys(options).forEach(type => {
        sortedOptions[type] = [...options[type]].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      setDropdownOptions(sortedOptions);
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
      message.success('Configuration removed');
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
      message.success(`Value ${option.isActive ? 'deactivated' : 'activated'}`);
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error toggling option status:', error);
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // const handleMoveOrder = async (option: DropdownOption, direction: 'up' | 'down') => {
  //   try {
  //     setLoading(true);
  //     const currentOptions = dropdownOptions[option.type] || [];
  //     const currentIndex = currentOptions.findIndex(opt => opt.id === option.id);
      
  //     if (direction === 'up' && currentIndex > 0) {
  //       const newOrder = currentOptions[currentIndex - 1].order;
  //       await SettingsService.updateDropdownOption(option.id, { order: newOrder });
  //     } else if (direction === 'down' && currentIndex < currentOptions.length - 1) {
  //       const newOrder = currentOptions[currentIndex + 1].order;
  //       await SettingsService.updateDropdownOption(option.id, { order: newOrder });
  //     }
      
  //     message.success('Sequence updated');
  //     await loadDropdownOptions();
  //     onDataChange?.();
  //   } catch (error) {
  //     console.error('Error updating order:', error);
  //     message.error('Failed to update sequence');
  //   } finally {
  //     setLoading(false);
  //   }
  // };





// const handleMoveOrder = async (option: DropdownOption, direction: 'up' | 'down') => {
//   try {
//     setLoading(true);
//     const currentOptions = [...(dropdownOptions[option.type] || [])];
//     const currentIndex = currentOptions.findIndex(opt => opt.id === option.id);
    
//     if (direction === 'up' && currentIndex > 0) {
//       const prevOption = currentOptions[currentIndex - 1];
      
//       // ✅ Store the orders properly
//       const currentOrder = option.order;
//       const prevOrder = prevOption.order;
      
//       console.log('Swapping orders:', { currentOrder, prevOrder }); // Debug
      
//       // Swap orders - current gets prev's order, prev gets current's order
//       await SettingsService.updateDropdownOption(option.id, { 
//         order: prevOrder,  // Current item gets PREV item's order
//         value: option.value,
//         label: option.label,
//         isActive: option.isActive,
//         description: option.description,
//         color: option.color
//       });
//      const result1 = await SettingsService.updateDropdownOption(option.id, { 
//   order: prevOrder,
//   value: option.value,
//   label: option.label,
//   isActive: option.isActive,
//   description: option.description,
//   color: option.color
// });
// console.log('RESULT 1 - New order:', result1.order); // 👈 ADD THIS
      
//       await SettingsService.updateDropdownOption(prevOption.id, { 
//         order: currentOrder,  // PREV item gets CURRENT item's order
//         value: prevOption.value,
//         label: prevOption.label,
//         isActive: prevOption.isActive,
//         description: prevOption.description,
//         color: prevOption.color
//       });
//       const result2 = await SettingsService.updateDropdownOption(prevOption.id, { 
//   order: currentOrder,
//   value: prevOption.value,
//   label: prevOption.label,
//   isActive: prevOption.isActive,
//   description: prevOption.description,
//   color: prevOption.color
// });
// console.log('RESULT 2 - New order:', result2.order); // 👈 ADD THIS
      
//     } else if (direction === 'down' && currentIndex < currentOptions.length - 1) {
//       const nextOption = currentOptions[currentIndex + 1];
      
//       // ✅ Store the orders properly
//       const currentOrder = option.order;
//       const nextOrder = nextOption.order;
      
//       console.log('Swapping orders:', { currentOrder, nextOrder }); // Debug
      
//       // Swap orders - current gets next's order, next gets current's order
//       await SettingsService.updateDropdownOption(option.id, { 
//         order: nextOrder,  // Current item gets NEXT item's order
//         value: option.value,
//         label: option.label,
//         isActive: option.isActive,
//         description: option.description,
//         color: option.color
//       });
      
//       await SettingsService.updateDropdownOption(nextOption.id, { 
//         order: currentOrder,  // NEXT item gets CURRENT item's order
//         value: nextOption.value,
//         label: nextOption.label,
//         isActive: nextOption.isActive,
//         description: nextOption.description,
//         color: nextOption.color
//       });
//     }
    
//     // ✅ Force refresh to see changes
//     await loadDropdownOptions();
//     message.success('Order updated successfully');
    
//   } catch (error) {
//     console.error('Error:', error);
//     message.error('Failed to update order');
//   } finally {
//     setLoading(false);
//   }
// };





// const handleMoveOrder = async (option: DropdownOption, direction: 'up' | 'down') => {
//   try {
//     setLoading(true);
//     const currentOptions = [...(dropdownOptions[option.type] || [])];
//     const currentIndex = currentOptions.findIndex(opt => opt.id === option.id);
    
//     if (direction === 'up' && currentIndex > 0) {
//       const prevOption = currentOptions[currentIndex - 1];
      
//       // Swap orders - Update BOTH items
//       await SettingsService.updateDropdownOption(option.id, { 
//         order: prevOption.order,
//         value: option.value,
//         label: option.label,
//         isActive: option.isActive
//       });
      
//       await SettingsService.updateDropdownOption(prevOption.id, { 
//         order: option.order,
//         value: prevOption.value,
//         label: prevOption.label,
//         isActive: prevOption.isActive
//       });
      
//       // Update UI immediately
//       const newOptions = [...currentOptions];
//       newOptions[currentIndex - 1] = { ...newOptions[currentIndex - 1], order: option.order };
//       newOptions[currentIndex] = { ...newOptions[currentIndex], order: prevOption.order };
      
//       setDropdownOptions({
//         ...dropdownOptions,
//         [option.type]: newOptions
//       });
      
//       message.success('Order updated');
      
//     } else if (direction === 'down' && currentIndex < currentOptions.length - 1) {
//       const nextOption = currentOptions[currentIndex + 1];
      
//       await SettingsService.updateDropdownOption(option.id, { 
//         order: nextOption.order,
//         value: option.value,
//         label: option.label,
//         isActive: option.isActive
//       });
      
//       await SettingsService.updateDropdownOption(nextOption.id, { 
//         order: option.order,
//         value: nextOption.value,
//         label: nextOption.label,
//         isActive: nextOption.isActive
//       });
      
//       // Update UI immediately
//       const newOptions = [...currentOptions];
//       newOptions[currentIndex] = { ...newOptions[currentIndex], order: nextOption.order };
//       newOptions[currentIndex + 1] = { ...newOptions[currentIndex + 1], order: option.order };
      
//       setDropdownOptions({
//         ...dropdownOptions,
//         [option.type]: newOptions
//       });
      
//       message.success('Order updated');
//     }
    
//     // Refresh from database in background
//     setTimeout(async () => {
//       await loadDropdownOptions();
//     }, 500);
    
//   } catch (error) {
//     console.error('Error:', error);
//     message.error('Failed to update order');
//   } finally {
//     setLoading(false);
//   }
// };





const handleMoveOrder = async (option: DropdownOption, direction: 'up' | 'down') => {
  try {
    setLoading(true);
    const currentOptions = [...(dropdownOptions[option.type] || [])];
    const currentIndex = currentOptions.findIndex(opt => opt.id === option.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevOption = currentOptions[currentIndex - 1];
      
      // Swap the 'order' values
      const currentOrder = option.order;
      const prevOrder = prevOption.order;

      // Update backend using the specialized reorder endpoint
      await SettingsService.reorderDropdownOptions([
        { id: option.id, order: prevOrder, value: option.value, label: option.label },
        { id: prevOption.id, order: currentOrder, value: prevOption.value, label: prevOption.label }
      ]);
      
      // Update local state - swap items in array AND update their order property
      const newOptions = [...currentOptions];
      const updatedCurrent = { ...option, order: prevOrder };
      const updatedPrev = { ...prevOption, order: currentOrder };
      
      newOptions[currentIndex] = updatedPrev;
      newOptions[currentIndex - 1] = updatedCurrent;
      
      // Ensure the final list is still sorted
      const sorted = newOptions.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setDropdownOptions(prev => ({
        ...prev,
        [option.type]: sorted
      }));
      
      onDataChange?.();
      message.success('Sequence updated');
      
    } else if (direction === 'down' && currentIndex < currentOptions.length - 1) {
      const nextOption = currentOptions[currentIndex + 1];
      
      const currentOrder = option.order;
      const nextOrder = nextOption.order;

      // Update backend
      await SettingsService.reorderDropdownOptions([
        { id: option.id, order: nextOrder, value: option.value, label: option.label },
        { id: nextOption.id, order: currentOrder, value: nextOption.value, label: nextOption.label }
      ]);
      
      // Update local state
      const newOptions = [...currentOptions];
      const updatedCurrent = { ...option, order: nextOrder };
      const updatedNext = { ...nextOption, order: currentOrder };
      
      newOptions[currentIndex] = updatedNext;
      newOptions[currentIndex + 1] = updatedCurrent;
      
      // Re-sort
      const sorted = newOptions.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setDropdownOptions(prev => ({
        ...prev,
        [option.type]: sorted
      }));
      
      onDataChange?.();
      message.success('Sequence updated');
    }
  } catch (error) {
    console.error('Error reordering:', error);
    message.error('Failed to update sequence');
    // Reload to original state if error
    await loadDropdownOptions();
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
        message.success('Configuration updated');
      } else {
        await SettingsService.createDropdownOption(data as CreateDropdownOptionData);
        message.success('New configuration added');
      }

      setModalVisible(false);
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error saving option:', error);
      message.error('Failed to save configuration');
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
      title: 'Seq',
      dataIndex: 'order',
      key: 'order',
      width: 100,
      render: (order: number, record: DropdownOption) => (
        <Space size={12}>
          <Text strong style={{ minWidth: 20 }}>{order}</Text>
          <Space direction="vertical" size={0}>
            <Button
              type="text"
              size="small"
              icon={<UpOutlined style={{ fontSize: 10 }} />}
              onClick={() => handleMoveOrder(record, 'up')}
              disabled={loading}
              style={{ height: 16 }}
            />
            <Button
              type="text"
              size="small"
              icon={<DownOutlined style={{ fontSize: 10 }} />}
              onClick={() => handleMoveOrder(record, 'down')}
              disabled={loading}
              style={{ height: 16 }}
            />
          </Space>
        </Space>
      )
    },
    {
      title: 'Visual Indicator & Label',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: DropdownOption) => (
        <Space size="middle">
          {record.color ? (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                backgroundColor: record.color,
                boxShadow: `0 2px 8px ${record.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 10,
                fontWeight: 700
              }}
            >
              {label.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div style={{ width: 24, height: 24, background: 'var(--bg-secondary)', borderRadius: 8 }} />
          )}
          <Text strong style={{ fontSize: 14 }}>{label}</Text>
        </Space>
      )
    },
    {
      title: 'Key Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => <Tag style={{ borderRadius: 6, fontWeight: 500 }}>{value}</Tag>
    },
    {
      title: 'Usage Context',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>{description || 'No description provided'}</Text>
      )
    },
    {
      title: 'State',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: DropdownOption) => (
        <Tooltip title={isActive ? 'Deactivate' : 'Activate'}>
          <Switch 
            size="small" 
            checked={isActive} 
            onChange={() => handleToggleStatus(record)} 
            loading={loading}
          />
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: DropdownOption) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: '#1677ff' }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete mapping?"
            description="This might affect existing tickets using this value."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card 
        bordered={false} 
        style={{ 
          borderRadius: 20, 
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-pure-white)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
        bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '16px 32px', background: 'var(--bg-pure-white)', borderBottom: '1px solid var(--border-color)' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center">
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  background: 'var(--bg-pure-white)', 
                  borderRadius: 10, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <DatabaseOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Lookup Metadata</Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>Define global taxonomies for ticket tracking.</Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Add Option
              </Button>
            </Col>
          </Row>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabPosition="left"
          className="manager-tabs"
          style={{ flex: 1, height: 'calc(100% - 65px)' }}
          items={dropdownTypes.map(type => ({
            key: type.key,
            label: (
              <div style={{ padding: '4px 0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{type.label}</span>
                  <Badge 
                    count={dropdownOptions[type.key]?.length || 0} 
                    style={{ backgroundColor: activeTab === type.key ? '#1677ff' : '#d9d9d9', fontSize: 10 }} 
                  />
                </div>
              </div>
            ),
            children: (
              <div style={{ 
                padding: '24px 32px', 
                height: '100%', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ marginBottom: 20 }}>
                  <Title level={4} style={{ marginBottom: 4 }}>{type.label} Configuration</Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>{type.description}</Text>
                  <Divider style={{ margin: '12px 0' }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <Table
                    columns={columns}
                    dataSource={dropdownOptions[type.key] || []}
                    rowKey="id"
                    loading={dataLoading}
                    pagination={false}
                    size="small"
                    className="premium-table"
                    scroll={{ y: 'calc(100vh - 400px)' }}
                  />
                </div>
              </div>
            )
          }))}
        />
      </Card>

      <Modal
        title={
          <Space>
            <div style={{ width: 32, height: 32, background: 'rgba(22, 119, 255, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editingOption ? <EditOutlined style={{ color: '#1677ff' }} /> : <PlusOutlined style={{ color: '#1677ff' }} />}
            </div>
            <Text strong style={{ fontSize: 18 }}>{editingOption ? 'Edit Mapping' : 'New Mapping Definition'}</Text>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={640}
        centered
        okText="Save Configuration"
        cancelText="Discard"
        okButtonProps={{ style: { borderRadius: 8, height: 40, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
      >
        <div style={{ padding: '16px 0' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark="optional"
          >
            <Row gutter={24}>
              <Col span={14}>
                <Form.Item
                  name="type"
                  label={<Text strong>Classification Type</Text>}
                  rules={[{ required: true }]}
                >
                  <Select disabled={!!editingOption} size="large" style={{ borderRadius: 8 }}>
                    {dropdownTypes.map(type => (
                      <Select.Option key={type.key} value={type.key}>
                        {type.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="order"
                  label={<Text strong>Display Priority</Text>}
                  rules={[{ required: true }]}
                  tooltip="Lower numbers appear first in dropdowns"
                >
                  <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Divider dashed style={{ margin: '12px 0 24px' }} />

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="label"
                  label={<Text strong>Display Label</Text>}
                  rules={[{ required: true, message: 'Label is required' }]}
                >
                  <Input placeholder="e.g. High Priority" size="large" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="value"
                  label={<Text strong>System Key (Value)</Text>}
                  rules={[{ required: true, message: 'Key is required' }]}
                  tooltip="Internal identifier (usually uppercase/lowercase without spaces)"
                >
                  <Input placeholder="e.g. HIGH" size="large" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24} align="middle">
              <Col span={12}>
                <Form.Item
                  name="color"
                  label={<Text strong>Visual Identity (Color)</Text>}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', border: '1px solid #d9d9d9', borderRadius: 8 }}>
                    <ColorPicker showText />
                    <Text type="secondary" style={{ fontSize: 12 }}>Pick representative color</Text>
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="isActive"
                  label={<Text strong>Availability Status</Text>}
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <Space size="small">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                      <Text style={{ fontSize: 13 }}>Enable for all projects</Text>
                    </Space>
                    <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label={<Text strong>Usage Instructions</Text>}
            >
              <TextArea
                rows={4}
                placeholder="Explain when to use this specific classification..."
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <style jsx global>{`
        .manager-tabs .ant-tabs-nav {
          width: 240px;
          background: var(--bg-pure-white);
          margin-bottom: 0 !important;
          border-right: 1px solid var(--border-color);
        }
        .manager-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 16px 24px !important;
          border-left: 3px solid transparent;
          transition: all 0.3s;
        }
        .manager-tabs .ant-tabs-tab-active {
          background: var(--bg-pure-white) !important;
          border-left-color: #1677ff !important;
        }
        .manager-tabs .ant-tabs-ink-bar {
          display: none;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-pure-white);
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border-color);
        }
        .premium-table .ant-table-row:hover {
          filter: brightness(0.98);
        }
      `}</style>
    </div>
  );
}
