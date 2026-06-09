'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  ColorPicker,
  Switch,
  Space,
  message,
  Popconfirm,
  Tabs,
  Row,
  Col,
  Typography,
  InputNumber,
  Badge,
  Tooltip,
  theme as antdTheme,
  ConfigProvider,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DeploymentUnitOutlined,
  CodeOutlined,
  BlockOutlined,
  AppstoreOutlined,
  ControlOutlined,
  HolderOutlined,
  SearchOutlined,
  CheckCircleFilled,
  EyeInvisibleFilled,
  AppstoreFilled,
  StarFilled,
  ReloadOutlined,
  FilterOutlined
} from "@ant-design/icons";
import { SettingsService, DropdownOption, CreateDropdownOptionData, UpdateDropdownOptionData } from '@/services/settingsService';
import { useSocket } from "@/providers/SocketProvider";
import { usePermission } from "@/hooks/usePermission";
import { useTheme } from "@/context/ThemeContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DropdownManagerProps {
  onDataChange?: () => void;
}

export default function DropdownManager({ onDataChange }: DropdownManagerProps) {
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [activeTab, setActiveTab] = useState('platform');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const { socket, connected } = useSocket();
  const { canCreateTicketSetting, canUpdateTicketSetting, canDeleteTicketSetting } = usePermission();
  const screens = Grid.useBreakpoint();

  // State for dropdown options grouped by type
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownOption[]>>({});

  const dropdownTypes = [
    { key: 'platform', label: 'Platforms', icon: <DeploymentUnitOutlined />, description: 'Core team platforms and delivery departments', color: '#1677ff' },
    { key: 'stack', label: 'Stacks', icon: <CodeOutlined />, description: 'Available technology stacks for project tagging', color: '#52c41a' },
    { key: 'priority', label: 'Priorities', icon: <ThunderboltOutlined />, description: 'Urgency levels and visual indicators', color: '#faad14' },
    { key: 'taskLevel', label: 'Complexity', icon: <BlockOutlined />, description: 'Difficulty and story point weighting', color: '#13c2c2' },
    { key: 'taskType', label: 'Work Types', icon: <AppstoreOutlined />, description: 'Classifications for development activities', color: '#722ed1' },
    { key: 'status', label: 'Lifecycles', icon: <ControlOutlined />, description: 'Global status mapping for ticket workflows', color: '#eb2f96' }
  ];

  // Load dropdown options
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleSettingsUpdate = () => {
      console.log("Socket: Settings updated, reloading data...");
      loadDropdownOptions();
    };

    socket.on("settings:updated", handleSettingsUpdate);

    return () => {
      socket.off("settings:updated", handleSettingsUpdate);
    };
  }, [socket, connected]);

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
      messageApi.error('Failed to load dropdown options');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreate = () => {
    if (!canCreateTicketSetting) {
      messageApi.error("You don't have permission to create configurations");
      return;
    }
    setEditingOption(null);
    form.resetFields();
    form.setFieldsValue({ type: activeTab, isActive: true, order: getNextOrder(activeTab) });
    setModalVisible(true);
  };

  const handleEdit = (option: DropdownOption) => {
    if (!canUpdateTicketSetting) {
      messageApi.error("You don't have permission to update configurations");
      return;
    }
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
      messageApi.success('Configuration removed');
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error deleting option:', error);
      messageApi.error('Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (option: DropdownOption) => {
    try {
      setLoading(true);
      await SettingsService.updateDropdownOption(option.id, { isActive: !option.isActive });
      messageApi.success(`Value ${option.isActive ? 'deactivated' : 'activated'}`);
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error toggling option status:', error);
      messageApi.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };


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
        messageApi.success('Sequence updated');

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
        messageApi.success('Sequence updated');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      messageApi.error('Failed to update sequence');
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
        messageApi.success('Configuration updated');
      } else {
        await SettingsService.createDropdownOption(data as CreateDropdownOptionData);
        messageApi.success('New configuration added');
      }

      setModalVisible(false);
      await loadDropdownOptions();
      onDataChange?.();
    } catch (error) {
      console.error('Error saving option:', error);
      messageApi.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardizeLifecycles = async () => {
    try {
      setLoading(true);
      messageApi.loading({ content: 'Synchronizing system lifecycles...', key: 'status-sync' });

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
      messageApi.success({ content: '9-step workflow standardized successfully', key: 'status-sync' });
    } catch (error) {
      console.error('Error standardizing lifecycles:', error);
      messageApi.error({ content: 'Failed to synchronize lifecycles', key: 'status-sync' });
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
        <div className="dm-identity-cell">
          <div
            className="dm-color-swatch"
            style={{
              background: record.color
                ? `linear-gradient(135deg, ${record.color} 0%, ${record.color}cc 100%)`
                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              boxShadow: record.color ? `0 4px 12px ${record.color}40, inset 0 1px 0 rgba(255,255,255,0.3)` : 'none',
            }}
          >
            {!record.color && <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>?</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 13, display: 'block', color: 'var(--text-slate-900)', lineHeight: 1.3 }}>{label}</Text>
            <div className="dm-value-pill">
              <span className="dm-value-dot" />
              <span style={{ fontFamily: 'JetBrains Mono, Menlo, monospace' }}>{record.value}</span>
            </div>
          </div>
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
        <Switch
          size="small"
          checked={isActive}
          onChange={() => handleToggleStatus(record)}
          loading={loading}
          disabled={!canUpdateTicketSetting}
          className="premium-switch"
        />
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
              disabled={!canUpdateTicketSetting}
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
              disabled={!canDeleteTicketSetting}
              className="action-btn-delete"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {contextHolder}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabPosition={!screens.lg ? 'top' : 'left'}
        className="manager-tabs"
        style={{ flex: 1, height: '100%' }}
        items={dropdownTypes.map(type => ({
          key: type.key,
          label: (
            <div className="tab-label-container dm-tab-item">
              <div className={`tab-icon-box ${activeTab === type.key ? 'active' : ''}`} style={{ color: type.color }}>
                {type.icon}
              </div>
              <div className="tab-text-box">
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
                  <span className="tab-subtitle-text" style={{ marginLeft: 6 }}>Definitions</span>
                </div>
              </div>
            </div>
          ),
          children: (() => {
            const allItems = dropdownOptions[type.key] || [];
            const activeCount = allItems.filter(o => o.isActive).length;
            const hiddenCount = allItems.length - activeCount;
            const colorCount = allItems.filter(o => !!o.color).length;
            const filteredItems = allItems
              .filter(o => {
                if (filterStatus === 'active') return o.isActive;
                if (filterStatus === 'hidden') return !o.isActive;
                return true;
              })
              .filter(o => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  o.label.toLowerCase().includes(q) ||
                  o.value.toLowerCase().includes(q) ||
                  (o.description || '').toLowerCase().includes(q)
                );
              });

            return (
              <div className="tab-content-area">
                {/* Premium Hero Header */}
                <div
                  className="dm-hero"
                  style={{
                    background: `linear-gradient(135deg, ${type.color}14 0%, ${type.color}05 60%, transparent 100%)`,
                    borderColor: `${type.color}26`,
                  }}
                >
                  <div
                    className="dm-hero-glow"
                    style={{ background: `radial-gradient(circle at 80% 20%, ${type.color}40 0%, transparent 60%)` }}
                  />
                  <div className="dm-hero-content">
                    <div className="dm-hero-left">
                      <div
                        className="dm-hero-icon"
                        style={{
                          background: `linear-gradient(135deg, ${type.color} 0%, ${type.color}cc 100%)`,
                          boxShadow: `0 12px 32px ${type.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
                        }}
                      >
                        {React.cloneElement(type.icon as React.ReactElement, {
                          style: { fontSize: 18, color: '#fff' },
                        })}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <div className="dm-hero-eyebrow">
                          <span style={{ color: type.color }}>●</span>
                          CONFIGURATION · {type.key.toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                          <Title level={3} className="dm-hero-title">
                            {type.label}
                          </Title>
                          <Text className="dm-hero-desc">{type.description}</Text>
                        </div>
                      </div>
                    </div>
                    <div className="dm-stats-grid">
                      <div className="dm-stat-card" title="Total Definitions">
                        <div className="dm-stat-icon" style={{ background: `${type.color}1a`, color: type.color }}>
                          <AppstoreFilled />
                        </div>
                        <span className="dm-stat-value">{allItems.length}</span>
                        <span className="dm-stat-label">Total</span>
                      </div>
                      <div className="dm-stat-card" title="Active & Visible">
                        <div className="dm-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                          <CheckCircleFilled />
                        </div>
                        <span className="dm-stat-value">{activeCount}</span>
                        <span className="dm-stat-label">Active</span>
                      </div>
                      <div className="dm-stat-card" title="Hidden / Archived">
                        <div className="dm-stat-icon" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#64748b' }}>
                          <EyeInvisibleFilled />
                        </div>
                        <span className="dm-stat-value">{hiddenCount}</span>
                        <span className="dm-stat-label">Hidden</span>
                      </div>
                      <div className="dm-stat-card" title="With Visual Identity">
                        <div className="dm-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                          <StarFilled />
                        </div>
                        <span className="dm-stat-value">{colorCount}</span>
                        <span className="dm-stat-label">Themed</span>
                      </div>
                    </div>
                    <div className="dm-hero-right">
                      <Space size={8}>
                        {type.key === 'status' && canUpdateTicketSetting && (
                          <Button
                            icon={<ThunderboltOutlined />}
                            onClick={handleStandardizeLifecycles}
                            loading={loading}
                            className="dm-sync-btn"
                          >
                            Synchronize
                          </Button>
                        )}
                        {canCreateTicketSetting && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            className="dm-primary-btn"
                            style={{
                              background: `linear-gradient(135deg, ${type.color} 0%, ${type.color}d9 100%)`,
                              boxShadow: `0 6px 14px ${type.color}40`,
                            }}
                          >
                            New Definition
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                </div>

                {/* Toolbar: search + filter chips */}
                <div className="dm-toolbar">
                  <div className="dm-search-box">
                    <SearchOutlined className="dm-search-icon" />
                    <input
                      className="dm-search-input"
                      placeholder={`Search ${type.label.toLowerCase()} by label, key, or context…`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="dm-search-clear" onClick={() => setSearchQuery('')}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="dm-filter-chips">
                    <button
                      className={`dm-chip ${filterStatus === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('all')}
                    >
                      <FilterOutlined />
                      All
                      <span className="dm-chip-count">{allItems.length}</span>
                    </button>
                    <button
                      className={`dm-chip ${filterStatus === 'active' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('active')}
                    >
                      <CheckCircleFilled style={{ color: '#10b981' }} />
                      Active
                      <span className="dm-chip-count">{activeCount}</span>
                    </button>
                    <button
                      className={`dm-chip ${filterStatus === 'hidden' ? 'active' : ''}`}
                      onClick={() => setFilterStatus('hidden')}
                    >
                      <EyeInvisibleFilled style={{ color: '#94a3b8' }} />
                      Hidden
                      <span className="dm-chip-count">{hiddenCount}</span>
                    </button>
                    <Tooltip title="Reload from server">
                      <button className="dm-chip dm-chip-icon" onClick={loadDropdownOptions}>
                        <ReloadOutlined spin={dataLoading} />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Table */}
                <div className="dm-table-wrapper">
                  <Table
                    columns={columns}
                    dataSource={filteredItems}
                    rowKey="id"
                    loading={dataLoading}
                    pagination={false}
                    size="middle"
                    className="premium-table workstation-grid"
                    scroll={{ x: 800, y: screens.lg ? 'calc(100vh - 420px)' : 'calc(100vh - 520px)' }}
                    locale={{
                      emptyText: (
                        <div className="dm-empty-state">
                          <div className="dm-empty-icon" style={{ background: `${type.color}14`, color: type.color }}>
                            {React.cloneElement(type.icon as React.ReactElement, { style: { fontSize: 28 } })}
                          </div>
                          <div className="dm-empty-title">
                            {searchQuery || filterStatus !== 'all'
                              ? 'No matching definitions'
                              : `No ${type.label.toLowerCase()} configured yet`}
                          </div>
                          <div className="dm-empty-desc">
                            {searchQuery || filterStatus !== 'all'
                              ? 'Try a different search term or clear your filters.'
                              : `Create your first ${type.label.toLowerCase().replace(/s$/, '')} definition to get started.`}
                          </div>
                          {canCreateTicketSetting && (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={handleCreate}
                              style={{
                                marginTop: 16,
                                borderRadius: 8,
                                height: 38,
                                fontWeight: 700,
                                background: type.color,
                                borderColor: type.color,
                              }}
                            >
                              Create Definition
                            </Button>
                          )}
                        </div>
                      ),
                    }}
                  />
                </div>
              </div>
            );
          })()
        }))}
      />

      <Drawer
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        width={560}
        placement="right"
        closable={false}
        className="dm-drawer"
        rootClassName="dm-drawer-root"
        maskClosable={!loading}
        title={
          (() => {
            const drawerType =
              dropdownTypes.find(t => t.key === (editingOption?.type || activeTab)) ||
              dropdownTypes[0];
            return (
              <div
                className="dm-drawer-header"
                style={{
                  background: `linear-gradient(135deg, ${drawerType.color}1f 0%, ${drawerType.color}08 60%, transparent 100%)`,
                  borderBottom: `1px solid ${drawerType.color}26`,
                }}
              >
                <div
                  className="dm-drawer-header-glow"
                  style={{ background: `radial-gradient(circle at 90% 0%, ${drawerType.color}40 0%, transparent 60%)` }}
                />
                <div className="dm-drawer-header-row">
                  <div
                    className="dm-drawer-icon"
                    style={{
                      background: `linear-gradient(135deg, ${drawerType.color} 0%, ${drawerType.color}cc 100%)`,
                      boxShadow: `0 10px 24px ${drawerType.color}45, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    }}
                  >
                    {editingOption ? <EditOutlined style={{ color: '#fff', fontSize: 18 }} /> : <PlusOutlined style={{ color: '#fff', fontSize: 18 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dm-drawer-eyebrow">
                      <span style={{ color: drawerType.color }}>●</span>
                      {editingOption ? 'EDITING' : 'NEW'} · {drawerType.label.toUpperCase()}
                    </div>
                    <div className="dm-drawer-title">
                      {editingOption ? 'Edit Mapping Definition' : 'New Mapping Definition'}
                    </div>
                    <div className="dm-drawer-sub">
                      Configure synchronization parameters for ticket taxonomies.
                    </div>
                  </div>
                  <button className="dm-drawer-close" onClick={() => setModalVisible(false)} aria-label="Close">
                    ×
                  </button>
                </div>
              </div>
            );
          })()
        }
        styles={{
          header: { padding: 0, border: 'none' },
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          wrapper: { boxShadow: '-24px 0 60px rgba(15, 23, 42, 0.2)' },
        }}
        footer={
          <div className="dm-drawer-footer">
            <div className="dm-drawer-footer-hint">
              <InfoCircleOutlined />
              {editingOption ? 'Changes apply across all projects after save.' : 'New definitions are activated immediately.'}
            </div>
            <Space size={10}>
              <Button
                onClick={() => setModalVisible(false)}
                className="dm-drawer-cancel"
              >
                Discard
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
                icon={editingOption ? <EditOutlined /> : <PlusOutlined />}
                className="dm-drawer-submit"
              >
                {editingOption ? 'Update Definition' : 'Deploy Definition'}
              </Button>
            </Space>
          </div>
        }
      >
        <div className="dm-drawer-body">
          <ConfigProvider
            theme={{
              algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
              token: {
                colorBgContainer: theme === 'dark' ? '#161B22' : '#ffffff',
                colorText: theme === 'dark' ? '#F1F5F9' : '#1E293B',
              }
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark="optional"
            >
              <DefinitionPreview form={form} dropdownTypes={dropdownTypes} />
              {/* ── Section: Taxonomy ─────────────────────────────── */}
              <div className="dm-form-section">
                <div className="dm-form-section-title">
                  <span className="dm-form-section-num">01</span>
                  Taxonomy
                </div>
                <Row gutter={20}>
                  <Col span={14}>
                    <Form.Item
                      name="type"
                      label={<span className="dm-form-label"><AppstoreOutlined /> Classification Type</span>}
                      rules={[{ required: true }]}
                    >
                      <Select disabled={!!editingOption} size="large" className="dm-input">
                        {dropdownTypes.map(type => (
                          <Select.Option key={type.key} value={type.key}>
                            <Space size={8}>
                              <span className="dm-select-dot" style={{ background: type.color }} />
                              {type.label}
                            </Space>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="order"
                      label={<span className="dm-form-label"><HolderOutlined /> Display Priority</span>}
                      rules={[{ required: true }]}
                      tooltip="Lower numbers appear first in dropdowns"
                    >
                      <InputNumber min={1} style={{ width: '100%' }} size="large" className="dm-input" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ── Section: Identity ─────────────────────────────── */}
              <div className="dm-form-section">
                <div className="dm-form-section-title">
                  <span className="dm-form-section-num">02</span>
                  Identity
                </div>
                <Row gutter={20}>
                  <Col span={12}>
                    <Form.Item
                      name="label"
                      label={<span className="dm-form-label"><EditOutlined /> Display Label</span>}
                      rules={[{ required: true, message: 'Label is required' }]}
                    >
                      <Input placeholder="e.g. High Priority" size="large" className="dm-input" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="value"
                      label={<span className="dm-form-label"><CodeOutlined /> System Key (Value)</span>}
                      rules={[{ required: true, message: 'Key is required' }]}
                      tooltip="Internal identifier (usually uppercase/lowercase without spaces)"
                    >
                      <Input placeholder="e.g. HIGH" size="large" className="dm-input dm-input-mono" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ── Section: Appearance & Visibility ──────────────── */}
              <div className="dm-form-section">
                <div className="dm-form-section-title">
                  <span className="dm-form-section-num">03</span>
                  Appearance &amp; Visibility
                </div>
                <Row gutter={[20, 16]} align="top">
                  <Col span={24}>
                    <Form.Item
                      name="color"
                      label={<span className="dm-form-label"><StarFilled style={{ color: '#a855f7' }} /> Visual Identity</span>}
                      style={{ marginBottom: 12 }}
                    >
                      <div className="dm-color-picker-row">
                        <ColorPicker showText />
                        <Text type="secondary" style={{ fontSize: 12 }}>Pick representative color</Text>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="isActive"
                      label={<span className="dm-form-label"><CheckCircleFilled style={{ color: '#10b981' }} /> Availability</span>}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <div className="dm-availability-toggle">
                        <Space size={8}>
                          <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                          <Text style={{ fontSize: 13 }}>Enable for all projects</Text>
                        </Space>
                        <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ── Section: Context ──────────────────────────────── */}
              <div className="dm-form-section dm-form-section-last">
                <div className="dm-form-section-title">
                  <span className="dm-form-section-num">04</span>
                  Context
                </div>
                <Form.Item
                  name="description"
                  label={<span className="dm-form-label"><InfoCircleOutlined /> Usage Instructions</span>}
                >
                  <TextArea
                    rows={3}
                    placeholder="Explain when to use this specific classification…"
                    className="dm-input"
                    showCount
                    maxLength={280}
                  />
                </Form.Item>
              </div>
            </Form>
          </ConfigProvider>
        </div>
      </Drawer>

      <style jsx global>{`
        /* ── Tabs structural fix ──────────────────────────────────── */
        .manager-tabs, 
        .manager-tabs .ant-tabs-content, 
        .manager-tabs .ant-tabs-content-holder,
        .manager-tabs .ant-tabs-tabpane {
          height: 100% !important;
        }

        /* ── Desktop Left Sidebar Nav ──────────────────────────────────────── */
        .manager-tabs.ant-tabs-left > .ant-tabs-nav {
          width: 264px;
          background: linear-gradient(180deg, #fafbff 0%, var(--bg-pure-white) 100%);
          margin-bottom: 0 !important;
          border-right: 1px solid var(--border-slate-100);
          padding: 20px 10px;
        }
        [data-theme='dark'] .manager-tabs.ant-tabs-left > .ant-tabs-nav {
          background: linear-gradient(180deg, #0a0e17 0%, #0d1117 100%) !important;
          border-right-color: #1f2937 !important;
        }
        
        /* ── Mobile/Tablet Top Nav ─────────────────────────────────────────── */
        .manager-tabs.ant-tabs-top > .ant-tabs-nav {
          width: 100%;
          background: linear-gradient(180deg, #fafbff 0%, var(--bg-pure-white) 100%);
          margin-bottom: 0 !important;
          border-bottom: 1px solid var(--border-slate-100);
          padding: 10px 16px 0;
        }
        [data-theme='dark'] .manager-tabs.ant-tabs-top > .ant-tabs-nav {
          background: linear-gradient(180deg, #0a0e17 0%, #0d1117 100%) !important;
          border-bottom-color: #1f2937 !important;
        }
        .manager-tabs.ant-tabs-top .tab-label-container {
          width: auto;
        }
        .manager-tabs.ant-tabs-top .tab-subtitle-count span:last-child,
        .manager-tabs.ant-tabs-top .tab-subtitle-text {
          display: none !important; /* Hide "Definitions" text to save space on mobile */
        }
        .manager-tabs.ant-tabs-top .dm-tab-item {
          gap: 8px !important;
        }
        .manager-tabs.ant-tabs-top .tab-icon-box {
          display: none !important;
        }
        .manager-tabs.ant-tabs-top .tab-text-box {
          align-items: center;
          text-align: center;
        }
        .manager-tabs.ant-tabs-top .tab-title {
          font-size: 13px !important;
        }
        .manager-tabs.ant-tabs-top .ant-tabs-tab {
          padding: 8px 10px !important;
          margin: 0 4px !important;
        }

        .manager-tabs .ant-tabs-tab {
          margin: 4px 0 !important;
          padding: 10px 12px !important;
          border-radius: 12px !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent !important;
          position: relative;
        }
        .manager-tabs.ant-tabs-left .ant-tabs-tab:hover {
          background: rgba(15, 23, 42, 0.03) !important;
          transform: translateX(2px);
        }
        .manager-tabs.ant-tabs-top .ant-tabs-tab:hover {
          background: rgba(15, 23, 42, 0.03) !important;
          transform: translateY(-2px);
        }
        [data-theme='dark'] .manager-tabs .ant-tabs-tab:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .manager-tabs .ant-tabs-tab-active {
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%) !important;
          border-color: rgba(59, 130, 246, 0.18) !important;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.08), 0 1px 0 rgba(255,255,255,0.6) inset !important;
        }
        .manager-tabs.ant-tabs-left .ant-tabs-tab-active::before {
          content: '';
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 2px;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
        }
        [data-theme='dark'] .manager-tabs .ant-tabs-tab-active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%) !important;
          border-color: rgba(59, 130, 246, 0.25) !important;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.18) !important;
        }
        .manager-tabs .ant-tabs-ink-bar {
          display: none;
        }

        /* ── Tab labels ───────────────────────────────────────────── */
        .tab-label-container {
          width: 100%;
          text-align: left;
        }
        .dm-tab-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tab-text-box {
          display: flex;
          flex-direction: column;
        }
        .tab-icon-box {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .tab-icon-box {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
        }
        .tab-icon-box.active {
          background: var(--bg-pure-white);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8);
          transform: scale(1.05);
        }
        [data-theme='dark'] .tab-icon-box.active {
          background: #1a2035 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .tab-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .tab-subtitle-count {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 3px;
          display: flex;
          align-items: center;
          font-weight: 500;
        }

        /* ── Premium Hero Header ──────────────────────────────────── */
        .dm-hero {
          position: relative;
          border-radius: 14px;
          padding: 14px 18px;
          border: 1px solid;
          overflow: hidden;
          margin-bottom: 12px;
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        [data-theme='dark'] .dm-hero {
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%) !important;
        }
        .dm-hero-glow {
          position: absolute;
          inset: 0;
          opacity: 0.6;
          pointer-events: none;
        }
        .dm-hero-content {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .dm-hero-left {
          display: flex;
          gap: 12px;
          align-items: center;
          flex: 1;
          min-width: 280px;
        }
        .dm-hero-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dm-hero-icon .anticon {
          font-size: 18px !important;
        }
        .dm-hero-eyebrow {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: var(--text-slate-600);
          text-transform: uppercase;
          margin-bottom: 1px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          line-height: 1.1;
        }
        [data-theme='dark'] .dm-hero-eyebrow {
          color: #94a3b8 !important;
        }
        .dm-hero-title {
          margin: 0 !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.02em !important;
          font-size: 16px !important;
          line-height: 1.2 !important;
          display: inline-block;
          margin-right: 10px !important;
        }
        .dm-hero-desc {
          font-size: 12px;
          color: var(--text-slate-600);
          font-weight: 500;
          line-height: 1.4;
        }
        .dm-hero-right {
          position: relative;
        }
        .dm-primary-btn {
          height: 34px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          padding: 0 14px !important;
          border: none !important;
          color: #fff !important;
          letter-spacing: -0.01em;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .dm-primary-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
        .dm-sync-btn {
          height: 34px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          padding: 0 12px !important;
          border: 1px solid #fcd34d !important;
          background: rgba(251, 191, 36, 0.08) !important;
          color: #d97706 !important;
        }
        .dm-sync-btn:hover {
          background: rgba(251, 191, 36, 0.15) !important;
          border-color: #f59e0b !important;
        }
        [data-theme='dark'] .dm-sync-btn {
          background: rgba(251, 191, 36, 0.08) !important;
          color: #fbbf24 !important;
          border-color: rgba(251, 191, 36, 0.3) !important;
        }

        /* ── Stats Grid (inline pills) ────────────────────────────── */
        .dm-stats-grid {
          position: relative;
          display: inline-flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .dm-stat-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid var(--border-slate-100);
          border-radius: 8px;
          padding: 4px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(12px);
          transition: all 0.15s ease;
          height: 28px;
        }
        .dm-stat-card:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: var(--border-slate-200);
        }
        [data-theme='dark'] .dm-stat-card {
          background: rgba(22, 27, 34, 0.6) !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .dm-stat-card:hover {
          background: rgba(31, 41, 55, 0.7) !important;
          border-color: #374151 !important;
        }
        .dm-stat-icon {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .dm-stat-value {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-slate-900);
          line-height: 1;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .dm-stat-value {
          color: #f1f5f9 !important;
        }
        .dm-stat-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-slate-600);
          letter-spacing: 0;
          text-transform: none;
          margin: 0;
        }
        [data-theme='dark'] .dm-stat-label {
          color: #94a3b8 !important;
        }

        /* ── Toolbar (search + filter chips) ──────────────────────── */
        .dm-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .dm-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          height: 40px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          flex: 1;
          max-width: 420px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .dm-search-box:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        [data-theme='dark'] .dm-search-box {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .dm-search-box:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
        }
        .dm-search-icon {
          color: #94a3b8;
          font-size: 15px;
        }
        .dm-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: var(--text-slate-900);
          font-weight: 500;
        }
        .dm-search-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        [data-theme='dark'] .dm-search-input {
          color: #f1f5f9 !important;
        }
        .dm-search-clear {
          background: var(--bg-slate-50);
          border: none;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-600);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dm-search-clear:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        [data-theme='dark'] .dm-search-clear {
          background: #1f2937 !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .dm-search-clear:hover {
          background: rgba(220, 38, 38, 0.15) !important;
          color: #f87171 !important;
        }

        .dm-filter-chips {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .dm-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 0 12px;
          height: 36px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-600);
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        .dm-chip:hover {
          background: var(--bg-slate-50);
          border-color: #cbd5e1;
        }
        .dm-chip.active {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-color: #1e293b;
          color: #fff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }
        [data-theme='dark'] .dm-chip {
          background: #161b22 !important;
          border-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .dm-chip:hover {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        [data-theme='dark'] .dm-chip.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          border-color: #3b82f6 !important;
          color: #fff !important;
        }
        .dm-chip-count {
          background: rgba(0, 0, 0, 0.06);
          padding: 1px 7px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 800;
          margin-left: 2px;
        }
        .dm-chip.active .dm-chip-count {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        [data-theme='dark'] .dm-chip-count {
          background: rgba(255, 255, 255, 0.06);
        }
        .dm-chip-icon {
          padding: 0 10px;
        }

        /* ── Table wrapper ────────────────────────────────────────── */
        .dm-table-wrapper {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        [data-theme='dark'] .dm-table-wrapper {
          background: #0d1117 !important;
          border-color: #1f2937 !important;
        }

        /* ── Identity cell with color swatch ──────────────────────── */
        .dm-identity-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dm-color-swatch {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .dm-color-swatch::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(15, 23, 42, 0.06);
          pointer-events: none;
        }
        .dm-value-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
          padding: 1px 7px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          border-radius: 5px;
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
        }
        [data-theme='dark'] .dm-value-pill {
          background: #161b22 !important;
          border-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .dm-value-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        /* ── Empty State ──────────────────────────────────────────── */
        .dm-empty-state {
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .dm-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .dm-empty-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }
        [data-theme='dark'] .dm-empty-title {
          color: #f1f5f9 !important;
        }
        .dm-empty-desc {
          font-size: 13px;
          color: var(--text-slate-600);
          max-width: 380px;
          text-align: center;
          line-height: 1.5;
        }
        [data-theme='dark'] .dm-empty-desc {
          color: #94a3b8 !important;
        }

        /* ── Content area ─────────────────────────────────────────── */
        .tab-content-area {
          padding: 24px 32px 32px;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.04) 0%, transparent 35%),
            radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.03) 0%, transparent 35%),
            var(--bg-pure-white);
        }
        [data-theme='dark'] .tab-content-area {
          background:
            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.06) 0%, transparent 35%),
            radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.05) 0%, transparent 35%),
            #0b0f1a !important;
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
          background: linear-gradient(180deg, #fafbfd 0%, #f5f7fb 100%) !important;
          font-weight: 800;
          color: var(--text-slate-600) !important;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1.2px;
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table-thead > tr > th {
          background: linear-gradient(180deg, #0e1320 0%, #0b0f1a 100%) !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .workstation-grid .ant-table {
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table {
          background: #0d1117 !important;
        }
        .workstation-grid .ant-table-row {
          transition: all 0.2s ease;
        }
        .workstation-grid .ant-table-row:hover > td {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.04) 0%, rgba(168, 85, 247, 0.02) 100%) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table-row:hover > td {
          background: rgba(59, 130, 246, 0.06) !important;
        }
        .workstation-grid .ant-table-cell {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .workstation-grid .ant-table-cell {
          border-bottom-color: #1f2937 !important;
          background: #0d1117 !important;
        }
        .workstation-grid .ant-table-row:last-child .ant-table-cell {
          border-bottom: none !important;
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

        /* ── Drawer polish ────────────────────────────────────────── */
        .dm-drawer .ant-drawer-content {
          background: var(--bg-pure-white) !important;
          border-radius: 20px 0 0 20px;
          overflow: hidden;
        }
        [data-theme='dark'] .dm-drawer .ant-drawer-content {
          background: #0d1117 !important;
        }
        .dm-drawer .ant-drawer-header {
          padding: 0 !important;
          border-bottom: none !important;
        }
        .dm-drawer .ant-drawer-body {
          padding: 0 !important;
          overflow-y: auto;
        }
        .dm-drawer .ant-drawer-footer {
          padding: 0 !important;
          border-top: none !important;
        }
        .dm-drawer-root .ant-drawer-mask {
          background: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(2px);
        }

        .dm-drawer-header {
          position: relative;
          padding: 22px 24px;
          overflow: hidden;
        }
        .dm-drawer-header-glow {
          position: absolute;
          inset: 0;
          opacity: 0.7;
          pointer-events: none;
        }
        .dm-drawer-header-row {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .dm-drawer-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dm-drawer-eyebrow {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: var(--text-slate-600);
          text-transform: uppercase;
          margin-bottom: 4px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          line-height: 1;
        }
        [data-theme='dark'] .dm-drawer-eyebrow {
          color: #94a3b8 !important;
        }
        .dm-drawer-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.5px;
          line-height: 1.25;
        }
        [data-theme='dark'] .dm-drawer-title {
          color: #f1f5f9 !important;
        }
        .dm-drawer-sub {
          font-size: 12px;
          color: var(--text-slate-600);
          font-weight: 500;
          margin-top: 4px;
          line-height: 1.5;
        }
        [data-theme='dark'] .dm-drawer-sub {
          color: #94a3b8 !important;
        }
        .dm-drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid var(--border-slate-100);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 400;
          color: var(--text-slate-600);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
          line-height: 1;
        }
        .dm-drawer-close:hover {
          background: #fff;
          color: #ef4444;
          border-color: #fecaca;
          transform: rotate(90deg);
        }
        [data-theme='dark'] .dm-drawer-close {
          background: rgba(22, 27, 34, 0.7) !important;
          border-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .dm-drawer-close:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #f87171 !important;
        }

        .dm-drawer-body {
          padding: 22px 24px 28px;
        }

        /* ── Drawer footer (sticky action bar) ────────────────────── */
        .dm-drawer-footer {
          padding: 14px 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, var(--bg-pure-white) 50%);
          border-top: 1px solid var(--border-slate-100);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          backdrop-filter: blur(8px);
        }
        [data-theme='dark'] .dm-drawer-footer {
          background: linear-gradient(180deg, rgba(13, 17, 23, 0.6) 0%, #0d1117 50%) !important;
          border-top-color: #1f2937 !important;
        }
        .dm-drawer-footer-hint {
          font-size: 11.5px;
          color: var(--text-slate-600);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }
        .dm-drawer-footer-hint .anticon {
          color: #94a3b8;
        }
        [data-theme='dark'] .dm-drawer-footer-hint {
          color: #94a3b8 !important;
        }
        .dm-drawer-cancel {
          border-radius: 10px !important;
          height: 40px !important;
          padding: 0 18px !important;
          font-weight: 700 !important;
          font-size: 13px !important;
        }
        .dm-drawer-submit {
          border-radius: 10px !important;
          height: 40px !important;
          padding: 0 22px !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          border: none !important;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35) !important;
        }
        .dm-drawer-submit:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        /* Scope existing dm-modal input styles to the drawer too */
        .dm-drawer .dm-input,
        .dm-drawer .dm-input.ant-input,
        .dm-drawer .dm-input .ant-select-selector,
        .dm-drawer .dm-input .ant-input-number,
        .dm-drawer .ant-input,
        .dm-drawer .ant-input-number,
        .dm-drawer .ant-select-selector {
          border-radius: 10px !important;
          transition: all 0.2s ease !important;
        }
        .dm-drawer .ant-input:hover,
        .dm-drawer .ant-input-number:hover,
        .dm-drawer .ant-select:hover .ant-select-selector {
          border-color: #93c5fd !important;
        }
        .dm-drawer .ant-input:focus,
        .dm-drawer .ant-input-focused,
        .dm-drawer .ant-input-number-focused,
        .dm-drawer .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
        }
        .dm-drawer .dm-input-mono input,
        .dm-drawer .dm-input-mono.ant-input {
          font-family: 'JetBrains Mono', Menlo, monospace !important;
          letter-spacing: -0.01em;
          font-size: 13px !important;
        }

        /* ── Form sections in modal ───────────────────────────────── */
        .dm-form-section {
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px dashed var(--border-slate-100);
        }
        .dm-form-section-last {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        [data-theme='dark'] .dm-form-section {
          border-bottom-color: #1f2937 !important;
        }
        .dm-form-section-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-slate-600);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 12px;
        }
        [data-theme='dark'] .dm-form-section-title {
          color: #94a3b8 !important;
        }
        .dm-form-section-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
          color: #3b82f6;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          border: 1px solid rgba(59, 130, 246, 0.18);
        }
        [data-theme='dark'] .dm-form-section-num {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(168, 85, 247, 0.16) 100%) !important;
          color: #60a5fa !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        .dm-form-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .dm-form-label {
          color: #e2e8f0 !important;
        }
        .dm-form-label .anticon {
          font-size: 12px;
          color: #94a3b8;
        }

        /* ── Inputs (consistent shape) ────────────────────────────── */
        .dm-modal .dm-input,
        .dm-modal .dm-input.ant-input,
        .dm-modal .dm-input .ant-select-selector,
        .dm-modal .dm-input .ant-input-number-input-wrap,
        .dm-modal .dm-input .ant-input-number {
          border-radius: 10px !important;
        }
        .dm-modal .ant-input,
        .dm-modal .ant-input-number,
        .dm-modal .ant-select-selector {
          border-radius: 10px !important;
          transition: all 0.2s ease !important;
        }
        .dm-modal .ant-input:hover,
        .dm-modal .ant-input-number:hover,
        .dm-modal .ant-select:hover .ant-select-selector {
          border-color: #93c5fd !important;
        }
        .dm-modal .ant-input:focus,
        .dm-modal .ant-input-focused,
        .dm-modal .ant-input-number-focused,
        .dm-modal .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
        }
        .dm-input-mono input,
        .dm-input-mono.ant-input {
          font-family: 'JetBrains Mono', Menlo, monospace !important;
          letter-spacing: -0.01em;
          font-size: 13px !important;
        }
        .dm-select-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
        }

        /* ── Live preview card in modal ───────────────────────────── */
        .dm-preview-card {
          margin: 4px 0 20px;
          padding: 16px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #fafbff 0%, #f4f7ff 100%);
          border: 1px solid var(--border-slate-100);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        [data-theme='dark'] .dm-preview-card {
          background: linear-gradient(135deg, #0e1320 0%, #0a0e17 100%) !important;
          border-color: #1f2937 !important;
        }
        .dm-preview-eyebrow {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: var(--text-slate-600);
          text-transform: uppercase;
          margin-bottom: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        [data-theme='dark'] .dm-preview-eyebrow {
          color: #94a3b8 !important;
        }
        .dm-preview-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-pure-white);
          border-radius: 10px;
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
          width: fit-content;
        }
        [data-theme='dark'] .dm-preview-chip {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        .dm-preview-swatch {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          flex-shrink: 0;
          border: 1px solid rgba(15, 23, 42, 0.06);
        }
        .dm-preview-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .dm-preview-status.on {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }
        .dm-preview-status.off {
          background: rgba(148, 163, 184, 0.15);
          color: #64748b;
        }
        [data-theme='dark'] .dm-preview-status.on {
          background: rgba(16, 185, 129, 0.18) !important;
          color: #34d399 !important;
        }
        [data-theme='dark'] .dm-preview-status.off {
          background: rgba(148, 163, 184, 0.15) !important;
          color: #94a3b8 !important;
        }
        .dm-drawer textarea.ant-input,
        .dm-modal textarea.ant-input {
          height: auto !important;
          min-height: 80px !important;
          resize: vertical;
          padding: 10px 12px !important;
        }
      `}</style>
    </div>
  );
}

/* ── Live preview component (uses Form.useWatch) ───────────────── */
function DefinitionPreview({
  form,
  dropdownTypes,
}: {
  form: any;
  dropdownTypes: { key: string; label: string; color: string }[];
}) {
  const label = Form.useWatch('label', form);
  const value = Form.useWatch('value', form);
  const colorRaw = Form.useWatch('color', form);
  const isActive = Form.useWatch('isActive', form);
  const type = Form.useWatch('type', form);

  const color =
    typeof colorRaw === 'string'
      ? colorRaw
      : colorRaw?.toHexString?.() || '#cbd5e1';

  const typeMeta = dropdownTypes.find((t) => t.key === type);

  return (
    <div className="dm-preview-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
      <div className="dm-preview-eyebrow" style={{ marginBottom: 0 }}>
        <span style={{ color: typeMeta?.color || '#3b82f6' }}>●</span>
        LIVE PREVIEW · {typeMeta?.label || 'Definition'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div className="dm-preview-chip" style={{ margin: 0 }}>
          <span className="dm-preview-swatch" style={{ background: color }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-slate-900)' }}>
            {label?.trim() || 'Untitled definition'}
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: 11,
              color: '#94a3b8',
              padding: '1px 6px',
              background: 'rgba(148, 163, 184, 0.1)',
              borderRadius: 4,
            }}
          >
            {value?.trim() || 'system_key'}
          </span>
        </div>
        <div className={`dm-preview-status ${isActive ? 'on' : 'off'}`} style={{ margin: 0, flexShrink: 0 }}>
          {isActive ? <CheckCircleFilled /> : <EyeInvisibleFilled />}
          {isActive ? 'Visible to users' : 'Hidden / Archived'}
        </div>
      </div>
    </div>
  );
}
