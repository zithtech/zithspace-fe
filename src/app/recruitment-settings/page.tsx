"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Segmented,
  Button,
  Divider,
  Table,
  Space,
  Input,
  Tag,
  Avatar,
  Tooltip,
  Form,
  Row,
  Col,
  Select,
  Modal,
  notification,
  InputNumber,
  DatePicker,
  Tabs,
  Popconfirm,
  Switch,
  ColorPicker,
} from "antd";
import {
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
  SettingOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
  FileOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  SendOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { Settings2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useRecruitmentSettings } from "@/hooks/useRecruitmentSettings";

const { Text } = Typography;
const { Title } = Typography;

export default function actionStatus(){
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("1");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();

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
    } = useRecruitmentSettings();

    const [dataSource, setDataSource] = useState<any[]>([]);
    const [actionDataSource, setActionDataSource] = useState<any[]>([]);

    useEffect(() => {
        fetchStatuses();
        fetchActions();
    }, [fetchStatuses, fetchActions]);

    // Map backend statuses to Ant Design table format
    useEffect(() => {
        setDataSource(statuses.map((s, i) => ({
            key: s.id, id: s.id, sno: i + 1, statusName: s.name, 
            category: s.category, appliesTo: s.appliesTo?.join(', '), color: s.color, 
            isDefault: s.isDefault, isFinal: s.isFinalStage, isActive: s.isActive,
        })));
    }, [statuses]);

    // Map backend actions to Ant Design table format
    useEffect(() => {
        setActionDataSource(actions.map((a, i) => ({
            key: a.id, id: a.id, sno: i + 1, actionName: a.name, type: a.type, 
            icon: a.icon, color: a.color, isActive: a.isActive, 
            created: new Date(a.createdAt).toLocaleDateString(),
        })));
    }, [actions]);

    const moveRow = (data: any[], setData: React.Dispatch<React.SetStateAction<any[]>>, index: number, direction: 'up' | 'down') => {
        const newData = [...data];
        if (direction === 'up' && index > 0) {
            const temp = newData[index];
            newData[index] = newData[index - 1];
            newData[index - 1] = temp;
        } else if (direction === 'down' && index < newData.length - 1) {
            const temp = newData[index];
            newData[index] = newData[index + 1];
            newData[index + 1] = temp;
        }
        
        const updatedData = newData.map((item, i) => ({
            ...item,
            ...(item.sno !== undefined ? { sno: i + 1 } : {})
        }));

        setData(updatedData);
    };

    const showModal = () => {
        setEditingId(null);
        form.resetFields();
        setIsModalOpen(true);
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
        setIsModalOpen(true);
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
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (activeTab === '1') {
                const payload = {
                    name: values.statusName,
                    category: values.category,
                    color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || values.color,
                    appliesTo: values.appliesTo || [],
                    isDefault: values.isDefault ?? false,
                    isFinalStage: values.isFinalStage ?? false,
                    isActive: values.isActive ?? true
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
                    isActive: values.isActive ?? true
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
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
        } catch (error: any) {
            console.log('Validation or API Failed:', error);
            if (error.response?.data?.error) {
                api.error({ 
                    message: 'Error',
                    description: error.response.data.error,
                    placement: 'topRight'
                });
            }
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingId(null);
        form.resetFields();
    };

    const handleDeleteStatus = async (id: string) => {
        try {
            await deleteStatus(id);
            api.success({ message: 'Success', description: 'Status deleted successfully', placement: 'topRight' });
        } catch (error: any) {
            api.error({ message: 'Error', description: error?.response?.data?.error || error?.message || 'Failed to delete status', placement: 'topRight' });
        }
    };

    const handleDeleteAction = async (id: string) => {
        try {
            await deleteAction(id);
            api.success({ message: 'Success', description: 'Action deleted successfully', placement: 'topRight' });
        } catch (error: any) {
            api.error({ message: 'Error', description: error?.response?.data?.error || error?.message || 'Failed to delete action', placement: 'topRight' });
        }
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
        { title: 'S.No', dataIndex: 'sno', key: 'sno' },
        { 
            title: 'Status Name', 
            dataIndex: 'statusName', 
            key: 'statusName',
            render: (text: string, record: any) => <Tag color={record.color}>{text}</Tag>
        },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        { title: 'Applies To', dataIndex: 'appliesTo', key: 'appliesTo' },
        { title: 'Color', dataIndex: 'color', key: 'color', render: (color: string) => <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: color, border: '1px solid #d9d9d9' }} title={color} /> },
        { title: 'Default', dataIndex: 'isDefault', key: 'isDefault', render: (isDefault: boolean) => <Switch checked={isDefault} size="small" /> },
        { title: 'Final Stage', dataIndex: 'isFinal', key: 'isFinal', render: (isFinal: boolean) => <Switch checked={isFinal} size="small" /> },
        { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Switch checked={isActive} size="small" /> },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any, index: number) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<ArrowUpOutlined />} 
                        disabled={index === 0}
                        onClick={() => moveRow(dataSource, setDataSource, index, 'up')}
                    />
                    <Button 
                        type="text" 
                        icon={<ArrowDownOutlined />} 
                        disabled={index === dataSource.length - 1}
                        onClick={() => moveRow(dataSource, setDataSource, index, 'down')}
                    />
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditStatus(record)} />
                    <Popconfirm 
                        title="Are you sure you want to delete this?" 
                        onConfirm={() => handleDeleteStatus(record.id)} 
                        okText="Yes" 
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const actionColumns = [
        { 
            title: 'Action Name', 
            dataIndex: 'actionName', 
            key: 'actionName',
            render: (text: string, record: any) => (
                <Space>
                    {renderIcon(record.icon)}
                    <span>{text}</span>
                </Space>
            )
        },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { 
            title: 'Icon', 
            dataIndex: 'icon', 
            key: 'icon',
            render: (icon: string) => renderIcon(icon)
        },
        { title: 'Color', dataIndex: 'color', key: 'color', render: (color: string) => <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color, border: '1px solid #d9d9d9' }} title={color} /> },
        { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Switch checked={isActive} size="small" /> },
        { title: 'Created', dataIndex: 'created', key: 'created' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditAction(record)} />
                    <Popconfirm 
                        title="Are you sure you want to delete this action?" 
                        onConfirm={() => handleDeleteAction(record.id)} 
                        okText="Yes" 
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const tabItems = [
        { key: '1', label: 'Status Configuration', children: <Table loading={loading} columns={columns} dataSource={dataSource} pagination={false} /> },
        { key: '2', label: 'Action Configurations', children: <Table loading={loading} columns={actionColumns} dataSource={actionDataSource} pagination={false} /> },
    ];

    return(
        <MainLayout>
            {contextHolder}
            <div style={{ padding:24 }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>
                            {activeTab === '1' ? 'Status Settings' : 'Action Settings'}
                        </Title>
                        <Text type="secondary">
                            {activeTab === '1' ? 'Configure recruitment pipeline stages' : 'Configure recruiter activities'}
                        </Text>
                    </Col>
                    <Col>
                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                            {activeTab === '1' ? 'Add Status' : 'Add Action'}
                        </Button>
                    </Col>
                </Row>

                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

                <Modal 
                    width={400} 
                    title={
                        editingId 
                            ? (activeTab === '1' ? "Edit Status" : "Edit Action") 
                            : (activeTab === '1' ? "Add Status" : "Add Action")
                    } 
                    open={isModalOpen} 
                    onOk={handleOk} 
                    onCancel={handleCancel} 
                    okText={editingId ? "Update" : "Save"} 
                    destroyOnClose
                >
                    <Form form={form} layout="vertical" initialValues={{ isDefault: false, isFinalStage: false, isActive: true }}>
                        {activeTab === '1' ? (
                            <>
                                <Form.Item name="statusName" label="Status Name" rules={[{ required: true, message: 'Please enter the status name' }]}>
                                    <Input placeholder="Enter status name" />
                                </Form.Item>
                                <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please enter a category' }]}>
                                    <Input placeholder="Enter category" />
                                </Form.Item>
                                <Form.Item name="color" label="Color" rules={[{ required: true, message: 'Please select a color' }]} getValueFromEvent={(e) => typeof e === 'string' ? e : e?.toHexString?.() || e}>
                                    <ColorPicker showText />
                                </Form.Item>
                                {/* <Form.Item name="appliesTo" label="Applies To" rules={[{ required: true, message: 'Please select what this applies to' }]}>
                                    <Select mode="multiple" placeholder="Select applies to">
                                        <Select.Option value="candidatelifecycle">Candidate Lifecycle</Select.Option>
                                        <Select.Option value="jobpipeline">Job Pipeline</Select.Option>
                                    </Select>
                                </Form.Item> */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Default</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Set this as the default status</Text>
                                    </div>
                                    <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 0 }}>
                                        <Switch />
                                    </Form.Item>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Final Stage</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Mark as the final stage in the pipeline</Text>
                                    </div>
                                    <Form.Item name="isFinalStage" valuePropName="checked" style={{ marginBottom: 0 }}>
                                        <Switch />
                                    </Form.Item>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Active</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Make this status available for use</Text>
                                    </div>
                                    <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
                                        <Switch />
                                    </Form.Item>
                                </div>
                            </>
                        ) : (
                            <>
                                <Form.Item name="actionName" label="Action Name" rules={[{ required: true, message: 'Please enter the action name' }]}>
                                    <Input placeholder="Enter action name" />
                                </Form.Item>
                                <Form.Item name="actionType" label="Action Type" rules={[{ required: true, message: 'Please enter an action type' }]}>
                                    <Input placeholder="Enter action type" />
                                </Form.Item>
                                <Form.Item name="icon" label="Icon" rules={[{ required: true, message: 'Please select an icon' }]}>
                                    <Select
                                        showSearch
                                        placeholder="Search icon"
                                        options={iconOptions}
                                        filterOption={(input, option) =>
                                            (option?.value as string).toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </Form.Item>
                                <Form.Item name="color" label="Color" rules={[{ required: true, message: 'Please select a color' }]} getValueFromEvent={(e) => typeof e === 'string' ? e : e?.toHexString?.() || e}>
                                    <ColorPicker showText />
                                </Form.Item>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Active</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Make this action available for use</Text>
                                    </div>
                                    <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
                                        <Switch />
                                    </Form.Item>
                                </div>
                            </>
                        )}
                    </Form>
                </Modal>
            </div>
        </MainLayout>
    )
}
