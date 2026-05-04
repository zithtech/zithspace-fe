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
  InfoCircleOutlined,
  ThunderboltOutlined,
  DeploymentUnitOutlined,
  CodeOutlined,
  BlockOutlined,
  AppstoreOutlined,
  ControlOutlined,
  MoreOutlined,
  HolderOutlined
} from "@ant-design/icons";
import { SettingsService, DropdownOption, CreateDropdownOptionData, UpdateDropdownOptionData } from '@/services/settingsService';
import { useDropdownOptions } from '@/hooks/useGlobalData';
import { useMemo } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DropdownManagerProps {
  onDataChange?: () => void;
}

export default function DropdownManager({ onDataChange }: DropdownManagerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // Use real-time hook
  const { data: serverOptions, isLoading: isQueryLoading, refetch } = useDropdownOptions();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [activeTab, setActiveTab] = useState('platform');

  const dropdownTypes = [
    { key: 'platform', label: 'Platforms', icon: <DeploymentUnitOutlined />, description: 'Core team platforms and delivery departments', color: '#1677ff' },
    { key: 'stack', label: 'Stacks', icon: <CodeOutlined />, description: 'Available technology stacks for project tagging', color: '#52c41a' },
    { key: 'priority', label: 'Priorities', icon: <ThunderboltOutlined />, description: 'Urgency levels and visual indicators', color: '#faad14' },
    { key: 'taskLevel', label: 'Complexity', icon: <BlockOutlined />, description: 'Difficulty and story point weighting', color: '#13c2c2' },
    { key: 'taskType', label: 'Work Types', icon: <AppstoreOutlined />, description: 'Classifications for development activities', color: '#722ed1' },
    { key: 'status', label: 'Lifecycles', icon: <ControlOutlined />, description: 'Global status mapping for ticket workflows', color: '#eb2f96' }
  ];

  // State for dropdown options grouped by type
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownOption[]>>({});

  // Synchronize local state with server data
  useEffect(() => {
    if (serverOptions) {
      const sortedOptions: Record<string, DropdownOption[]> = {};
      Object.keys(serverOptions).forEach(type => {
        sortedOptions[type] = [...serverOptions[type]].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      setDropdownOptions(sortedOptions);
    }
  }, [serverOptions]);

  // Combined loading state
  const dataLoading = isQueryLoading || (!serverOptions && Object.keys(dropdownOptions).length === 0);

  const loadDropdownOptions = async () => {
    await refetch();
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

  const handleStandardizeLifecycles = async () => {
    try {
      setLoading(true);
      message.loading({ content: 'Synchronizing system lifecycles...', key: 'status-sync' });
      
      const currentStatusList = dropdownOptions.status || [];
      const newStatusOrder = [
        { label: "Not Started", value: "not_started", color: "#8c8c8c" },
        { label: "In Progress", value: "in_progress", color: "#1677ff" },
        { label: "Dev Complete", value: "dev_complete", color: "#13c2c2" },
        { label: "Dev Testing", value: "dev_testing", color: "#faad14" },
        { label: "In Review", value: "in_review", color: "#722ed1" },
        { label: "Live", value: "live", color: "#2f54eb" },
        { label: "Live Testing", value: "live_testing", color: "#1d39c4" },
        { label: "Completed", value: "completed", color: "#52c41a" },
        { label: "Pause", value: "pause", color: "#fa8c16" },
      ];

      // Update existing or create missing
      for (let i = 0; i < newStatusOrder.length; i++) {
        const target = newStatusOrder[i];
        const existing = currentStatusList.find(s => s.value === target.value);
        
        const data = {
          label: target.label,
          value: target.value,
          color: target.color,
          order: i + 1,
          isActive: true,
          type: 'status' as const
        };

        if (existing) {
          await SettingsService.updateDropdownOption(existing.id, data);
        } else {
          await SettingsService.createDropdownOption(data);
        }
      }

      // Deactivate statuses not in the new list
      const newValues = newStatusOrder.map(s => s.value);
      for (const status of currentStatusList) {
        if (!newValues.includes(status.value) && status.isActive) {
          await SettingsService.updateDropdownOption(status.id, { isActive: false });
        }
      }

      await loadDropdownOptions();
      if (onDataChange) onDataChange();
      message.success({ content: '9-step workflow standardized successfully', key: 'status-sync' });
    } catch (error) {
      console.error('Error standardizing lifecycles:', error);
      message.error({ content: 'Failed to synchronize lifecycles', key: 'status-sync' });
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
      title: 'Sequence',
      dataIndex: 'order',
      key: 'order',
      width: 100,
      render: (order: number, record: DropdownOption) => (
        <Space size={8} className="order-control">
          <div className="drag-handle">
            <HolderOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />
          </div>
          <Text strong style={{ minWidth: 20, color: 'var(--text-secondary)' }}>{order}</Text>
          <div className="order-buttons">
            <Button
              type="text"
              size="small"
              icon={<UpOutlined style={{ fontSize: 10 }} />}
              onClick={() => handleMoveOrder(record, 'up')}
              disabled={loading}
              className="order-btn"
            />
            <Button
              type="text"
              size="small"
              icon={<DownOutlined style={{ fontSize: 10 }} />}
              onClick={() => handleMoveOrder(record, 'down')}
              disabled={loading}
              className="order-btn"
            />
          </div>
        </Space>
      )
    },
    {
      title: 'Identity & Display Label',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: DropdownOption) => (
        <div>
          <Text strong style={{ fontSize: 13, display: 'block', color: 'var(--text-slate-900)' }}>{label}</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{record.value}</Text>
        </div>
      )
    },
    {
      title: 'Context & Rules',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <div style={{ maxWidth: 300 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {description || 'No specialized context defined.'}
          </Text>
        </div>
      )
    },
    {
      title: 'Visibility',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center' as const,
      render: (isActive: boolean, record: DropdownOption) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Switch 
            size="small" 
            checked={isActive} 
            onChange={() => handleToggleStatus(record)} 
            loading={loading}
            className="premium-switch"
          />
          <Badge 
            status={isActive ? 'success' : 'default'} 
            text={<span style={{ fontSize: 10, color: isActive ? '#52c41a' : '#bfbfbf', fontWeight: 600 }}>{isActive ? 'ACTIVE' : 'HIDDEN'}</span>} 
          />
        </div>
      )
    },
    {
      title: 'Management',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: DropdownOption) => (
        <Space>
          <Tooltip title="Modify Configuration">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="action-btn-edit"
            />
          </Tooltip>
          <Popconfirm
            title="Delete mapping?"
            description="Warning: This may break ticket integrity."
            onConfirm={() => handleDelete(record)}
            okText="Confirm Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, style: { borderRadius: 8 } }}
            cancelButtonProps={{ style: { borderRadius: 8 } }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              className="action-btn-delete"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabPosition="left"
          className="manager-tabs"
          style={{ flex: 1, height: '100%' }}
          items={dropdownTypes.map(type => ({
            key: type.key,
            label: (
              <div className="tab-label-container">
                <Space size={12}>
                  <div className={`tab-icon-box ${activeTab === type.key ? 'active' : ''}`} style={{ color: type.color }}>
                    {type.icon}
                  </div>
                  <div>
                    <div className="tab-title">{type.label}</div>
                    <div className="tab-subtitle-count">
                      <Badge 
                        count={dropdownOptions[type.key]?.length || 0} 
                        size="small"
                        style={{ 
                          backgroundColor: activeTab === type.key ? type.color : 'rgba(0,0,0,0.06)', 
                          color: activeTab === type.key ? '#fff' : 'var(--text-secondary)',
                          fontSize: 10,
                          boxShadow: 'none',
                          border: 'none'
                        }} 
                      />
                      <span style={{ marginLeft: 6 }}>Definitions</span>
                    </div>
                  </div>
                </Space>
              </div>
            ),
            children: (
              <div className="tab-content-area no-scrollbar">
                <div className="category-header">
                  <Row justify="space-between" align="middle">
                    <Col>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 4, height: 24, background: type.color, borderRadius: 2, flexShrink: 0 }} />
                        <Space split={<Divider type="vertical" style={{ height: 18, borderLeft: '1.5px solid #cbd5e1', margin: '0 4px' }} />} size={16}>
                          <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                            {type.label}
                          </Title>
                          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                            {type.description}
                          </Text>
                        </Space>
                      </div>
                    </Col>
                    <Col>
                      <Space size={12}>
                        {type.key === 'status' && (
                          <Button
                            size="small"
                            icon={<ThunderboltOutlined />}
                            onClick={handleStandardizeLifecycles}
                            loading={loading}
                            style={{ borderRadius: 6, fontWeight: 700, border: '1px solid #faad14', color: '#faad14', height: 32 }}
                          >
                            Synchronize
                          </Button>
                        )}
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          style={{ borderRadius: 6, fontWeight: 700, height: 32, padding: '0 16px' }}
                        >
                          New Definition
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '16px 0 0' }} />
                </div>
                
                <div style={{ flex: 1, marginTop: 16 }}>
                  <Table
                    columns={columns}
                    dataSource={dropdownOptions[type.key] || []}
                    rowKey="id"
                    loading={dataLoading}
                    pagination={false}
                    size="middle"
                    className="premium-table workstation-grid"
                  />
                </div>
              </div>
            )
          }))}
        />

      <Modal
        title={
          <div style={{ padding: '8px 4px' }}>
            <Space size={12}>
              <div style={{ 
                width: 40, 
                height: 40, 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: 12, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                {editingOption ? <EditOutlined style={{ color: '#3B82F6', fontSize: 20 }} /> : <PlusOutlined style={{ color: '#3B82F6', fontSize: 20 }} />}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  {editingOption ? 'Edit Mapping Definition' : 'New Mapping Definition'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
                  Configure synchronization parameters for ticket taxonomies.
                </div>
              </div>
            </Space>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={680}
        centered
        okText={editingOption ? "Update Definition" : "Deploy Definition"}
        cancelText="Discard"
        okButtonProps={{ style: { borderRadius: 10, height: 44, fontWeight: 700, padding: '0 24px' } }}
        cancelButtonProps={{ style: { borderRadius: 10, height: 44, padding: '0 24px' } }}
        styles={{ body: { padding: '24px 8px' } }}
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
                  <div className="dm-color-picker-row">
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
                  <div className="dm-availability-toggle">
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
        /* ── Left sidebar nav ─────────────────────────────────────── */
        .manager-tabs .ant-tabs-nav {
          width: 240px;
          background: var(--bg-pure-white);
          margin-bottom: 0 !important;
          border-right: 1px solid var(--border-slate-100);
          padding: 16px 0;
        }
        [data-theme='dark'] .manager-tabs .ant-tabs-nav {
          background: #0d1117 !important;
          border-right-color: #1f2937 !important;
        }

        .manager-tabs .ant-tabs-tab {
          margin: 2px 8px !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent !important;
        }
        .manager-tabs .ant-tabs-tab:hover {
          background: rgba(0, 0, 0, 0.02) !important;
        }
        [data-theme='dark'] .manager-tabs .ant-tabs-tab:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .manager-tabs .ant-tabs-tab-active {
          background: #f8faff !important;
          border-color: #dbeafe !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05) !important;
        }
        [data-theme='dark'] .manager-tabs .ant-tabs-tab-active {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: rgba(59, 130, 246, 0.2) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
        }
        .manager-tabs .ant-tabs-ink-bar {
          display: none;
        }

        /* ── Tab labels ───────────────────────────────────────────── */
        .tab-label-container {
          width: 100%;
          text-align: left;
        }
        .tab-icon-box {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        [data-theme='dark'] .tab-icon-box {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .tab-icon-box.active {
          background: var(--bg-pure-white);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        [data-theme='dark'] .tab-icon-box.active {
          background: #161b22 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        .tab-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .tab-subtitle-count {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
          display: flex;
          align-items: center;
        }

        /* ── Content area ─────────────────────────────────────────── */
        .tab-content-area {
          padding: 20px 32px;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .tab-content-area {
          background: #0b0f1a !important;
        }

        /* ── Category header ──────────────────────────────────────── */
        .category-header {
          position: relative;
        }
        .category-tag {
          font-size: 10px;
          font-weight: 900;
          color: var(--text-slate-400);
          letter-spacing: 1.5px;
          padding-left: 10px;
          text-transform: uppercase;
        }

        /* ── Stats pill ───────────────────────────────────────────── */
        .stats-pill {
          background: var(--bg-slate-50);
          padding: 12px 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
        .stat-label {
          font-size: 10px;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 700;
          margin-top: 4px;
        }

        /* ── Workstation grid (table) ─────────────────────────────── */
        .workstation-grid .ant-table-thead > tr > th {
          background: var(--bg-pure-white) !important;
          font-weight: 800;
          color: var(--text-slate-600) !important;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1.2px;
          padding: 12px 12px;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table-thead > tr > th {
          background: #0b0f1a !important;
          border-bottom-color: #1f2937 !important;
        }
        .workstation-grid .ant-table {
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table {
          background: #0b0f1a !important;
        }
        .workstation-grid .ant-table-row {
          transition: all 0.2s ease;
        }
        .workstation-grid .ant-table-row:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table-row:hover > td {
          background: #1f2937 !important;
        }
        .workstation-grid .ant-table-cell {
          padding: 10px 12px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table-cell {
          border-bottom-color: #1f2937 !important;
          background: #0b0f1a !important;
        }

        /* ── Header divider in category header ────────────────────── */
        [data-theme='dark'] .category-header .ant-divider {
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .category-header .ant-divider-vertical {
          border-color: #374151 !important;
        }

        /* ── Order controls ───────────────────────────────────────── */
        .order-control {
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .ant-table-row:hover .order-control {
          opacity: 1;
        }
        .order-btn {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .order-btn:hover {
          background: rgba(0, 0, 0, 0.05) !important;
        }
        [data-theme='dark'] .order-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        /* ── Action buttons ───────────────────────────────────────── */
        .action-btn-edit:hover {
          background: #e6f4ff !important;
          color: #1677ff !important;
        }
        [data-theme='dark'] .action-btn-edit:hover {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .action-btn-delete:hover {
          background: #fff1f0 !important;
          color: #ff4d4f !important;
        }
        [data-theme='dark'] .action-btn-delete:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }

        /* ── Premium switch ───────────────────────────────────────── */
        .premium-switch.ant-switch-checked {
          background: #10B981;
        }

        /* ── Modal form helpers ───────────────────────────────────── */
        .dm-color-picker-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
        }
        [data-theme='dark'] .dm-color-picker-row {
          border-color: #374151 !important;
          background: #161b22 !important;
        }

        .dm-availability-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        [data-theme='dark'] .dm-availability-toggle {
          background: #161b22 !important;
          border-color: #374151 !important;
        }

        /* ── Left sidebar badge counts ────────────────────────────── */
        [data-theme='dark'] .manager-tabs .ant-tabs-tab .ant-badge-count {
          box-shadow: none !important;
        }

        /* ── Drag handle color ────────────────────────────────────── */
        [data-theme='dark'] .drag-handle .anticon {
          color: #4b5563 !important;
        }
      `}</style>
    </div>
  );
}
