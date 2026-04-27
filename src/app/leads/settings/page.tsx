"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
    Settings2,
    ChevronRight,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Layers,
    ShieldCheck,
    Zap,
    Tag as TagIcon,
    Palette,
    Activity,
    ArrowUp,
    ArrowDown,
    Trash2,
    Edit2
} from "lucide-react";
import {
    Typography,
    Button,
    Table,
    Space,
    Input,
    Tag,
    Form,
    Row,
    Col,
    Select,
    notification,
    Tabs,
    Popconfirm,
    Switch,
    ColorPicker,
    Card,
    Drawer,
    Divider,
    Tooltip
} from "antd";
import {
    ClockCircleOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    FileOutlined,
    CalendarOutlined,
    MessageOutlined,
    VideoCameraOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TeamOutlined,
    SendOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import { useLeadSettings } from "@/hooks/useLeadSettings";

const { Text, Title } = Typography;

export default function LeadSettingsPage() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("1");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();
    const [searchText, setSearchText] = useState("");

    const {
        statuses,
        actions,
        fetchStatuses,
        fetchActions,
        createStatus,
        updateStatus,
        createAction,
        updateAction,
        deleteStatus,
        deleteAction,
        loading
    } = useLeadSettings();

    const [dataSource, setDataSource] = useState<any[]>([]);
    const [actionDataSource, setActionDataSource] = useState<any[]>([]);

    useEffect(() => {
        fetchStatuses();
        fetchActions();
    }, [fetchStatuses, fetchActions]);

    // Map backend statuses to Ant Design table format
    useEffect(() => {
        setDataSource(statuses.map((s, i) => ({
            key: s.id,
            id: s.id,
            sno: i + 1,
            statusName: s.name,
            category: s.category,
            appliesTo: s.applies_to?.join(', '),
            color: s.color,
            isDefault: s.is_default,
            isFinal: s.is_final_stage,
            isActive: s.is_active,
            order: s.order
        })));
    }, [statuses]);

    // Map backend actions to Ant Design table format
    useEffect(() => {
        setActionDataSource(actions.map((a, i) => ({
            key: a.id,
            id: a.id,
            sno: i + 1,
            actionName: a.name,
            type: a.type,
            icon: a.icon,
            color: a.color,
            isActive: a.is_active,
            created: new Date(a.createdAt || Date.now()).toLocaleDateString(),
        })));
    }, [actions]);

    const moveRow = async (index: number, direction: 'up' | 'down') => {
        const newData = [...statuses];
        if (direction === 'up' && index > 0) {
            const temp = newData[index];
            newData[index] = newData[index - 1];
            newData[index - 1] = temp;
        } else if (direction === 'down' && index < newData.length - 1) {
            const temp = newData[index];
            newData[index] = newData[index + 1];
            newData[index + 1] = temp;
        }

        // Update orders in backend
        try {
            await Promise.all(newData.map((item, i) => updateStatus(item.id, { order: i })));
            api.success({ message: 'Order Updated', placement: 'topRight' });
        } catch (error) {
            api.error({ message: 'Failed to update order', placement: 'topRight' });
        }
    };

    const showDrawer = () => {
        setEditingId(null);
        form.resetFields();
        setIsDrawerOpen(true);
    };

    const handleToggleStatusProperty = async (id: string, property: string, value: boolean) => {
        try {
            const backendField = property === 'isDefault' ? 'is_default' :
                property === 'isFinal' ? 'is_final_stage' : 'is_active';

            // Enforce single default logic if setting to true
            if (property === 'isDefault' && value === true) {
                const existingDefault = statuses.find(s => s.is_default && s.id !== id);
                if (existingDefault) {
                    await updateStatus(existingDefault.id, { is_default: false });
                }
            }

            await updateStatus(id, { [backendField]: value });
            api.success({ message: 'Status Updated', placement: 'topRight' });
        } catch (error) {
            api.error({ message: 'Failed to update status', placement: 'topRight' });
        }
    };

    const handleToggleActionProperty = async (id: string, value: boolean) => {
        try {
            await updateAction(id, { is_active: value });
            api.success({ message: 'Action Updated', placement: 'topRight' });
        } catch (error) {
            api.error({ message: 'Failed to update action', placement: 'topRight' });
        }
    };

    const handleEditStatus = (record: any) => {
        setEditingId(record.id);
        form.setFieldsValue({
            statusName: record.statusName,
            category: record.category,
            color: record.color,
            appliesTo: record.appliesTo ? record.appliesTo.split(', ') : [],
            isDefault: record.isDefault,
            isFinalStage: record.isFinal,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleEditAction = (record: any) => {
        setEditingId(record.id);
        form.setFieldsValue({
            actionName: record.actionName,
            actionType: record.type,
            icon: record.icon,
            color: record.color,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (activeTab === '1') {
                const payload = {
                    name: values.statusName,
                    category: values.category,
                    color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || values.color,
                    applies_to: values.appliesTo || [],
                    is_default: values.isDefault ?? false,
                    is_final_stage: values.isFinalStage ?? false,
                    is_active: values.isActive ?? true
                };
                if (editingId) {
                    await updateStatus(editingId, payload);
                } else {
                    await createStatus(payload);
                }
            } else {
                const payload = {
                    name: values.actionName,
                    type: values.actionType,
                    icon: values.icon,
                    color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || values.color,
                    is_active: values.isActive ?? true
                };
                if (editingId) {
                    await updateAction(editingId, payload);
                } else {
                    await createAction(payload);
                }
            }
            api.success({
                message: 'Success',
                description: `${activeTab === '1' ? 'Status' : 'Action'} ${editingId ? 'updated' : 'created'} successfully`,
                placement: 'topRight'
            });
            setIsDrawerOpen(false);
            setEditingId(null);
            form.resetFields();
        } catch (error: any) {
            console.error('Validation or API Failed:', error);
            const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
            api.error({
                message: 'Error',
                description: errorMessage,
                placement: 'topRight'
            });
        }
    };

    const handleCancel = () => {
        setIsDrawerOpen(false);
        setEditingId(null);
        form.resetFields();
    };

    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case 'phone': return <PhoneOutlined />;
            case 'mail': return <MailOutlined />;
            case 'clock': return <ClockCircleOutlined />;
            case 'user': return <UserOutlined />;
            case 'file': return <FileOutlined />;
            case 'calendar': return <CalendarOutlined />;
            case 'message': return <MessageOutlined />;
            case 'video': return <VideoCameraOutlined />;
            case 'check': return <CheckCircleOutlined />;
            case 'close': return <CloseCircleOutlined />;
            case 'team': return <TeamOutlined />;
            case 'send': return <SendOutlined />;
            case 'link': return <LinkOutlined />;
            default: return null;
        }
    };

    const iconOptions = [
        { value: 'phone', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><PhoneOutlined /> Phone</span> },
        { value: 'mail', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MailOutlined /> Mail</span> },
        { value: 'clock', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClockCircleOutlined /> Clock</span> },
        { value: 'user', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserOutlined /> User</span> },
        { value: 'file', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileOutlined /> File</span> },
        { value: 'calendar', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarOutlined /> Calendar</span> },
        { value: 'message', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageOutlined /> Message</span> },
        { value: 'video', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><VideoCameraOutlined /> Video</span> },
        { value: 'check', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircleOutlined /> Check</span> },
        { value: 'close', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CloseCircleOutlined /> Close</span> },
        { value: 'team', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TeamOutlined /> Team</span> },
        { value: 'send', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SendOutlined /> Send</span> },
        { value: 'link', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><LinkOutlined /> Link</span> },
    ];

    const columns = [
        {
            title: 'Rank',
            dataIndex: 'sno',
            key: 'sno',
            width: 80,
            render: (text: number) => <Text style={{ color: "var(--text-slate-500)", fontWeight: 600 }}>#{text}</Text>
        },
        {
            title: 'Status Label',
            dataIndex: 'statusName',
            key: 'statusName',
            render: (text: string, record: any) => (
                <Tag style={{
                    backgroundColor: `${record.color}15`,
                    color: record.color,
                    border: `1px solid ${record.color}30`,
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: "2px 10px",
                    fontSize: 12,
                    letterSpacing: "0.02em"
                }}>
                    {text.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Pipeline Category',
            dataIndex: 'category',
            key: 'category',
            render: (text: string) => <Tag style={{ borderRadius: 6, fontWeight: 500 }}>{text}</Tag>
        },
        {
            title: 'Configurations',
            key: 'configs',
            width: 180,
            render: (_: any, record: any) => (
                <Space size={16}>
                    <Tooltip title="Toggle Default Starter Status">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Switch
                                size="small"
                                checked={record.isDefault}
                                onChange={(val) => handleToggleStatusProperty(record.id, 'isDefault', val)}
                                loading={loading}
                            />
                            <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>DEF</Text>
                        </div>
                    </Tooltip>
                    <Tooltip title="Toggle Final Milestone Status">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Switch
                                size="small"
                                checked={record.isFinal}
                                onChange={(val) => handleToggleStatusProperty(record.id, 'isFinal', val)}
                                loading={loading}
                            />
                            <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>FINAL</Text>
                        </div>
                    </Tooltip>
                </Space>
            )
        },
        {
            title: 'Visibility',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            render: (isActive: boolean, record: any) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Switch
                        size="small"
                        checked={isActive}
                        onChange={(val) => handleToggleStatusProperty(record.id, 'isActive', val)}
                        loading={loading}
                    />
                    <Text style={{ fontSize: 12, fontWeight: 600, color: isActive ? "var(--text-holiday)" : "var(--text-slate-400)" }}>
                        {isActive ? "ACTIVE" : "OFF"}
                    </Text>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any, index: number) => (
                <Space size={4}>
                    <Tooltip title="Move Up">
                        <Button
                            type="text"
                            icon={<ArrowUp size={16} />}
                            disabled={index === 0}
                            onClick={() => moveRow(index, 'up')}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="Move Down">
                        <Button
                            type="text"
                            icon={<ArrowDown size={16} />}
                            disabled={index === dataSource.length - 1}
                            onClick={() => moveRow(index, 'down')}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="Edit Properties">
                        <Button
                            type="text"
                            icon={<Settings2 size={16} style={{ color: "var(--text-slate-400)" }} />}
                            onClick={() => handleEditStatus(record)}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this status?"
                        description="This might affect leads currently using this status."
                        onConfirm={() => deleteStatus(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<Trash2 size={16} />} className="action-btn-danger" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const actionColumns = [
        {
            title: 'Operational Action',
            dataIndex: 'actionName',
            key: 'actionName',
            render: (text: string, record: any) => (
                <Space size={12}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${record.color}15`,
                        color: record.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        {renderIcon(record.icon)}
                    </div>
                    <Text strong style={{ color: "var(--text-slate-900)" }}>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Classification',
            dataIndex: 'type',
            key: 'type',
            render: (text: string) => <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>{text}</Tag>
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: any) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Switch
                        size="small"
                        checked={isActive}
                        onChange={(val) => handleToggleActionProperty(record.id, val)}
                        loading={loading}
                    />
                    <Text style={{ fontSize: 12, fontWeight: 600, color: isActive ? "var(--text-holiday)" : "var(--text-slate-400)" }}>
                        {isActive ? "ACTIVE" : "DISABLED"}
                    </Text>
                </div>
            )
        },
        {
            title: 'Provisioned',
            dataIndex: 'created',
            key: 'created',
            render: (text: string) => <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>{text}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space size={4}>
                    <Tooltip title="Edit Action">
                        <Button
                            type="text"
                            icon={<Edit2 size={16} style={{ color: "var(--text-slate-400)" }} />}
                            onClick={() => handleEditAction(record)}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Remove this action?"
                        onConfirm={() => deleteAction(record.id)}
                        okText="Remove"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<Trash2 size={16} />} className="action-btn-danger" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: '1',
            label: (
                <Space size={8}>
                    <Activity size={16} />
                    <span>Pipeline Statuses</span>
                </Space>
            ),
            children: (
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={dataSource.filter(d =>
                        d.statusName.toLowerCase().includes(searchText.toLowerCase()) ||
                        d.category.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    pagination={false}
                    size="middle"
                />
            )
        },
        {
            key: '2',
            label: (
                <Space size={8}>
                    <Zap size={16} />
                    <span>Workflow Actions</span>
                </Space>
            ),
            children: (
                <Table
                    loading={loading}
                    columns={actionColumns}
                    dataSource={actionDataSource.filter(d =>
                        d.actionName.toLowerCase().includes(searchText.toLowerCase()) ||
                        d.type.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    pagination={false}
                    size="middle"
                />
            )
        },
    ];

    return (
        <ProtectedRoute>
            <MainLayout>
                <div className="settings-page-wrapper" style={{
                    margin: "0 -24px",
                    padding: "16px 32px",
                    background: "var(--bg-secondary)",
                    minHeight: "calc(100vh - 64px)"
                }}>
                    {contextHolder}

                    {/* Header Section */}
                    <div style={{ marginBottom: 0, paddingBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                            <Space size={8} align="center">
                                <div style={{
                                    background: "rgba(99, 102, 241, 0.1)",
                                    padding: "6px",
                                    borderRadius: "8px",
                                    color: "#6366f1",
                                    display: "flex",
                                    boxShadow: "0 2px 6px -2px rgba(99, 102, 241, 0.12)"
                                }}>
                                    <Settings2 size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Title level={4} className="premium-title" style={{ margin: 0, fontWeight: 800, color: "var(--text-slate-900)", fontSize: 16, letterSpacing: "-0.01em" }}>Workflow Settings</Title>
                                    <Text className="premium-text-sec" style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500, display: 'block', lineHeight: 1.2 }}>Configure stages and actions.</Text>
                                </div>
                            </Space>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Input
                                placeholder="Search..."
                                prefix={<Search size={13} style={{ color: "var(--text-slate-400)" }} />}
                                className="premium-input-search"
                                style={{ width: 220, borderRadius: 8, height: 32, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)", color: "var(--text-slate-900)", fontSize: 12 }}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Button
                                type="primary"
                                size="small"
                                icon={<Plus size={14} />}
                                style={{ borderRadius: 6, height: 32, fontWeight: 700, display: "flex", alignItems: "center", background: "#6366f1", border: "none", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)", padding: "0 12px", fontSize: 12 }}
                                onClick={showDrawer}
                            >
                                {activeTab === '1' ? 'Add Status' : 'Add Action'}
                            </Button>
                        </div>
                    </div>

                    <Divider className="hub-divider-premium" style={{ margin: '0 -32px 16px -32px', width: 'calc(100% + 64px)', borderTop: '1px solid #e2e8f0' }} />

                    {/* Table Card */}
                    <Card
                        bodyStyle={{ padding: 0 }}
                        className="settings-card-premium"
                        style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", overflow: "hidden" }}
                    >
                        <Tabs 
                            activeKey={activeTab} 
                            onChange={setActiveTab} 
                            items={tabItems} 
                            className="premium-tabs"
                            style={{ padding: "0 24px" }}
                        />
                    </Card>
                </div>

                {/* Configuration Drawer */}
                <Drawer
                    title={
                        <Space size={12}>
                            <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)", display: "flex" }}>
                                {activeTab === "1" ? <TagIcon size={20} /> : <Zap size={20} />}
                            </div>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                                    {editingId ? `Edit ${activeTab === "1" ? "Status" : "Action"}` : `Create New ${activeTab === "1" ? "Status" : "Action"}`}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>
                                    Configure workflow properties and appearance
                                </div>
                            </div>
                        </Space>
                    }
                    width={440}
                    open={isDrawerOpen}
                    onClose={handleCancel}
                    headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
                    bodyStyle={{ background: "var(--bg-pure-white)" }}
                    footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
                    footer={
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
                            <Button onClick={handleCancel} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
                            <Button
                                type="primary"
                                loading={loading}
                                onClick={handleSave}
                                style={{ borderRadius: 8, height: 40, padding: "0 24px", background: "var(--premium-blue)" }}
                            >
                                {editingId ? "Update Configuration" : "Save Configuration"}
                            </Button>
                        </div>
                    }
                >
                    <Form form={form} layout="vertical" initialValues={{ isDefault: false, isFinalStage: false, isActive: true }} requiredMark={false}>
                        {activeTab === '1' ? (
                            <>
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={5} style={{ marginBottom: 16, color: "var(--text-slate-700)", fontSize: 14 }}>Identity & Appearance</Title>
                                    <Form.Item name="statusName" label={<Text strong style={{ fontSize: 13 }}>Label Name</Text>} rules={[{ required: true, message: 'Required' }]}>
                                        <Input placeholder="e.g. IN PROPOSAL" />
                                    </Form.Item>
                                    <Form.Item name="category" label={<Text strong style={{ fontSize: 13 }}>Internal Category</Text>} rules={[{ required: true, message: 'Required' }]}>
                                        <Input placeholder="e.g. negotiation" />
                                    </Form.Item>
                                    <Form.Item name="color" label={<Text strong style={{ fontSize: 13 }}>Brand Color</Text>} rules={[{ required: true, message: 'Required' }]} getValueFromEvent={(e) => typeof e === 'string' ? e : e?.toHexString?.() || e}>
                                        <ColorPicker showText style={{ width: '100%' }} />
                                    </Form.Item>
                                </div>

                                <Divider style={{ borderColor: "var(--border-slate-100)" }} />

                                <div style={{ background: "var(--bg-slate-50)", padding: 20, borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
                                    <Title level={5} style={{ marginBottom: 20, fontSize: 14, color: "var(--text-slate-700)" }}>Behavioral Rules</Title>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <div>
                                            <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Default Starter</Text>
                                            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Assign this status automatically to new leads.</Text>
                                        </div>
                                        <Tooltip title={!(editingId && statuses.find(s => s.id === editingId)?.is_default) ? "Manage default status from the settings table" : ""}>
                                            <span>
                                                <Form.Item name="isDefault" valuePropName="checked" noStyle>
                                                    <Switch disabled={!(editingId && statuses.find(s => s.id === editingId)?.is_default)} />
                                                </Form.Item>
                                            </span>
                                        </Tooltip>
                                    </div>

                                    <Divider style={{ margin: "16px 0" }} />

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <div>
                                            <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Final Milestone</Text>
                                            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Marks the completion of the lead process.</Text>
                                        </div>
                                        <Form.Item name="isFinalStage" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>

                                    <Divider style={{ margin: "16px 0" }} />

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Enabled</Text>
                                            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Make this status available for use across leads.</Text>
                                        </div>
                                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={5} style={{ marginBottom: 16, color: "var(--text-slate-700)", fontSize: 14 }}>Action Configuration</Title>
                                    <Form.Item name="actionName" label={<Text strong style={{ fontSize: 13 }}>Display Name</Text>} rules={[{ required: true, message: 'Required' }]}>
                                        <Input placeholder="e.g. Schedule Call" />
                                    </Form.Item>
                                    <Form.Item name="actionType" label={<Text strong style={{ fontSize: 13 }}>Action Category</Text>} rules={[{ required: true, message: 'Required' }]}>
                                        <Input placeholder="e.g. Communication" />
                                    </Form.Item>
                                    <Row gutter={16}>
                                        <Col span={14}>
                                            <Form.Item name="icon" label={<Text strong style={{ fontSize: 13 }}>Visual Icon</Text>} rules={[{ required: true, message: 'Required' }]}>
                                                <Select
                                                    showSearch
                                                    placeholder="Search icon"
                                                    options={iconOptions}
                                                    filterOption={(input, option) =>
                                                        (option?.value as string).toLowerCase().includes(input.toLowerCase())
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item name="color" label={<Text strong style={{ fontSize: 13 }}>Color</Text>} rules={[{ required: true, message: 'Required' }]} getValueFromEvent={(e) => typeof e === 'string' ? e : e?.toHexString?.() || e}>
                                                <ColorPicker showText style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>

                                <Divider style={{ borderColor: "var(--border-slate-100)" }} />

                                <div style={{ background: "var(--bg-slate-50)", padding: 20, borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Operational</Text>
                                            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Action is active and selectable in lead views.</Text>
                                        </div>
                                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        )}
                    </Form>
                </Drawer>

                <style dangerouslySetInnerHTML={{
                    __html: `
                  .premium-table .ant-table { background: transparent; }
                  .premium-table .ant-table-thead > tr > th { 
                    background: #f8fafc; 
                    color: #64748b; 
                    font-weight: 700; 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 16px 20px;
                  }
                  .premium-table .ant-table-tbody > tr > td { 
                    padding: 16px 20px; 
                    border-bottom: 1px solid #f8fafc;
                    transition: all 0.2s ease;
                  }
                  
                  .action-btn:hover {
                    background: var(--bg-slate-50) !important;
                    color: var(--premium-blue) !important;
                  }
                  .action-btn-danger:hover {
                    background: #fff1f2 !important;
                  }
                  .ant-table-thead > tr > th {
                    background: var(--bg-slate-50) !important;
                    color: var(--text-slate-500) !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    font-size: 11px !important;
                    letter-spacing: 0.05em !important;
                    border-bottom: 1px solid var(--border-slate-100) !important;
                  }
                  .ant-table-row:hover > td {
                    background: var(--bg-slate-50) !important;
                  }
                  .premium-tabs .ant-tabs-nav {
                    margin-bottom: 0 !important;
                  }
                  .premium-tabs .ant-tabs-tab {
                    padding: 16px 8px !important;
                    font-weight: 600 !important;
                    color: var(--text-slate-500) !important;
                  }
                  .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: var(--premium-blue) !important;
                  }
                  .premium-tabs .ant-tabs-ink-bar {
                    background: var(--premium-blue) !important;
                    height: 3px !important;
                    border-radius: 3px 3px 0 0 !important;
                  }

                  /* DARK THEME OVERRIDES */
                  [data-theme='dark'] .settings-page-wrapper { background: #0d1117 !important; }
                  [data-theme='dark'] .settings-card-premium { 
                    background: #161b22 !important; 
                    border-color: #30363d !important; 
                  }
                  [data-theme='dark'] .ant-table { background: transparent !important; }
                  [data-theme='dark'] .ant-table-thead > tr > th { 
                    background: #0d1117 !important; 
                    color: #8b949e !important; 
                    border-bottom-color: #30363d !important; 
                  }
                  [data-theme='dark'] .ant-table-tbody > tr > td { 
                    border-bottom-color: #21262d !important; 
                    color: #c9d1d9 !important;
                  }
                  [data-theme='dark'] .ant-table-row:hover > td { 
                    background: #1c2128 !important; 
                  }
                  [data-theme='dark'] .premium-tabs .ant-tabs-tab { 
                    color: #8b949e !important; 
                  }
                  [data-theme='dark'] .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { 
                    color: var(--premium-blue) !important; 
                  }
                  [data-theme='dark'] .hub-divider-premium { 
                    border-top-color: #30363d !important; 
                  }
                  [data-theme='dark'] .premium-title { color: #f0f6fc !important; }
                  [data-theme='dark'] .premium-text-sec { color: #8b949e !important; }
                  [data-theme='dark'] .premium-input-search { 
                    background: #0d1117 !important; 
                    border-color: #30363d !important; 
                    color: #c9d1d9 !important; 
                  }
                  [data-theme='dark'] .ant-card-head { border-bottom-color: #30363d !important; }
                  [data-theme='dark'] .ant-card-head-title { color: #f0f6fc !important; }
                `}} />
            </MainLayout>
        </ProtectedRoute>
    );
}
