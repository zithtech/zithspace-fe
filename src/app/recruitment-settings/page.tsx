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

    const { 
        statuses, 
        actions, 
        fetchStatuses, 
        fetchActions, 
        createStatus, 
        createAction, 
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
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (activeTab === '1') {
                await createStatus({
                    name: values.statusName,
                    category: values.category,
                    color: values.color,
                    appliesTo: values.appliesTo || [],
                    isDefault: values.isDefault ?? false,
                    isFinalStage: values.isFinalStage ?? false,
                    isActive: values.isActive ?? true
                });
            } else {
                await createAction({
                    name: values.actionName,
                    type: values.actionType,
                    icon: values.icon,
                    color: values.color,
                    isActive: values.isActive ?? true
                });
            }
            notification.success({ message: `${activeTab === '1' ? 'Status' : 'Action'} created successfully` });
            setIsModalOpen(false);
            form.resetFields();
        } catch (error: any) {
            console.log('Validation or API Failed:', error);
            if (error.response?.data?.error) notification.error({ message: error.response.data.error });
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const columns = [
        { title: 'S.No', dataIndex: 'sno', key: 'sno' },
        { title: 'Status Name', dataIndex: 'statusName', key: 'statusName' },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        { title: 'Applies To', dataIndex: 'appliesTo', key: 'appliesTo' },
        { title: 'Color', dataIndex: 'color', key: 'color', render: (color: string) => <Tag color={color}>{color}</Tag> },
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
                    <Button type="text" icon={<EditOutlined />} />
                    <Popconfirm 
                        title="Are you sure you want to delete this?" 
                        onConfirm={() => deleteStatus(record.id)} 
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
        { title: 'Action Name', dataIndex: 'actionName', key: 'actionName' },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Icon', dataIndex: 'icon', key: 'icon' },
        { title: 'Color', dataIndex: 'color', key: 'color', render: (color: string) => <Tag color={color}>{color}</Tag> },
        { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Switch checked={isActive} size="small" /> },
        { title: 'Created', dataIndex: 'created', key: 'created' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} />
                    <Popconfirm 
                        title="Are you sure you want to delete this action?" 
                        onConfirm={() => deleteAction(record.id)} 
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
            <div style={{ padding: '24px' }}>
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

                <Modal width={400} title={activeTab === '1' ? "Add Status" : "Add Action"} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText="Save" destroyOnClose>
                    <Form form={form} layout="vertical" initialValues={{ isDefault: false, isFinalStage: false, isActive: true }}>
                        {activeTab === '1' ? (
                            <>
                                <Form.Item name="statusName" label="Status Name" rules={[{ required: true, message: 'Please enter the status name' }]}>
                                    <Input placeholder="Enter status name" />
                                </Form.Item>
                                <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select a category' }]}>
                                    <Select placeholder="Select category">
                                        <Select.Option value="candidate">Candidate</Select.Option>
                                        <Select.Option value="submission">Submission</Select.Option>
                                        <Select.Option value="interview">Interview</Select.Option>
                                        <Select.Option value="offer">Offer</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="color" label="Color" rules={[{ required: true, message: 'Please select a color' }]}>
                                    <Select placeholder="Select color">
                                        <Select.Option value="blue">Blue</Select.Option>
                                        <Select.Option value="purple">Purple</Select.Option>
                                        <Select.Option value="orange">Orange</Select.Option>
                                        <Select.Option value="green">Green</Select.Option>
                                        <Select.Option value="red">Red</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="appliesTo" label="Applies To" rules={[{ required: true, message: 'Please select what this applies to' }]}>
                                    <Select mode="multiple" placeholder="Select applies to">
                                        <Select.Option value="candidatelifecycle">Candidate Lifecycle</Select.Option>
                                        <Select.Option value="jobpipeline">Job Pipeline</Select.Option>
                                    </Select>
                                </Form.Item>
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
                                <Form.Item name="actionType" label="Action Type" rules={[{ required: true, message: 'Please select an action type' }]}>
                                    <Select placeholder="Select action type">
                                        <Select.Option value="call">Call</Select.Option>
                                        <Select.Option value="email">Email</Select.Option>
                                        <Select.Option value="system">System</Select.Option>
                                        <Select.Option value="submission">Submission</Select.Option>
                                        <Select.Option value="interview">Interview</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="icon" label="Icon" rules={[{ required: true, message: 'Please select an icon' }]}>
                                    <Select placeholder="Select icon">
                                        <Select.Option value="phone"><Space><PhoneOutlined /> Phone</Space></Select.Option>
                                        <Select.Option value="mail"><Space><MailOutlined /> Mail</Space></Select.Option>
                                        <Select.Option value="clock"><Space><ClockCircleOutlined /> Clock</Space></Select.Option>
                                        <Select.Option value="user"><Space><UserOutlined /> User</Space></Select.Option>
                                        <Select.Option value="file"><Space><FileOutlined /> File</Space></Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="color" label="Color" rules={[{ required: true, message: 'Please select a color' }]}>
                                    <Select placeholder="Select color">
                                        <Select.Option value="green">Green</Select.Option>
                                        <Select.Option value="red">Red</Select.Option>
                                        <Select.Option value="blue">Blue</Select.Option>
                                        <Select.Option value="orange">Orange</Select.Option>
                                        <Select.Option value="purple">Purple</Select.Option>
                                    </Select>
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
