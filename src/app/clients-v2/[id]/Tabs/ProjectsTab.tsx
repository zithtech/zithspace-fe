"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Tag, Space, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { api } from "@/lib/axios";
import dayjs from "dayjs";

interface ProjectsTabProps {
    clientId: string;
    onRefresh: () => void;
}

export default function ProjectsTab({ clientId, onRefresh }: ProjectsTabProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [editForm] = Form.useForm();

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/api/clients-v2/${clientId}/projects`);
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
            message.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await api.get('/api/clients-v2/employees/select');
            setEmployees(data || []);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchEmployees();
    }, [clientId]);

    const handleCreateProject = async (values: any) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : undefined,
                endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
            };

            await api.post(`/api/clients-v2/${clientId}/projects`, payload);
            message.success("Project created successfully");
            setIsModalVisible(false);
            form.resetFields();
            fetchProjects();
            onRefresh();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to create project";
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (project: any) => {
        setEditingProject(project);
        editForm.setFieldsValue({
            name: project.name,
            code: project.code,
            billingType: project.billingType,
            budget: project.budget,
            status: project.status,
            projectManagerId: project.projectManager?.id || project.projectManagerId, // Depending on relation response
            startDate: project.startDate ? dayjs(project.startDate) : undefined,
            endDate: project.endDate ? dayjs(project.endDate) : undefined,
        });
        setIsEditModalVisible(true);
    };

    const handleEditProject = async (values: any) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : undefined,
                endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
            };

            await api.put(`/api/clients-v2/projects/${editingProject.id}`, payload);
            message.success("Project updated successfully");
            setIsEditModalVisible(false);
            editForm.resetFields();
            setEditingProject(null);
            fetchProjects();
            onRefresh();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to update project";
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { title: "Project Name", dataIndex: "name", key: "name", width: 200 },
        { title: "Code", dataIndex: "code", key: "code" },
        { title: "Billing Type", dataIndex: "billingType", key: "billingType" },
        {
            title: "Budget",
            key: "budget",
            render: (_: any, record: any) => record.budget ? `$${Number(record.budget).toLocaleString()}` : 'N/A'
        },
        {
            title: "Invoiced",
            key: "invoicedAmount",
            render: (_: any, record: any) => record.invoicedAmount ? `$${Number(record.invoicedAmount).toLocaleString()}` : '$0'
        },
        {
            title: "Outstanding",
            key: "outstanding",
            render: (_: any, record: any) => {
                const budget = Number(record.budget || 0);
                const invoiced = Number(record.invoicedAmount || 0);
                const outstanding = budget - invoiced;
                return `$${Math.max(0, outstanding).toLocaleString()}`;
            }
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const color = {
                    Active: "green",
                    Draft: "default",
                    "On Hold": "orange",
                    Completed: "blue",
                    Closed: "red"
                }[status] || "default";
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: "Manager",
            dataIndex: ["projectManager", "name"],
            key: "projectManager",
            render: (name: string, record: any) => {
                // Handle fallback if legacy first_name / last_name structure is fetched
                if (!name && record.projectManager) {
                    return `${record.projectManager.first_name || ''} ${record.projectManager.last_name || ''}`.trim() || 'N/A';
                }
                return name || "N/A";
            }
        },
        {
            title: "Start Date",
            dataIndex: "startDate",
            key: "startDate",
            render: (date: string) => date ? dayjs(date).format("MMM DD, YYYY") : "N/A"
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} size="small" />
                    <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)} />
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Create Project
                </Button>
            </div>

            <Table
                dataSource={projects}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1200 }}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Project"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleCreateProject}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item label="Project Name" name="name" rules={[{ required: true }]}>
                            <Input placeholder="E.g. Website Redesign" />
                        </Form.Item>
                        <Form.Item label="Project Code" name="code" rules={[{ required: true }]}>
                            <Input placeholder="E.g. PRJ-001" />
                        </Form.Item>

                        <Form.Item label="Billing Type" name="billingType" rules={[{ required: true }]}>
                            <Select placeholder="Select Billing Type">
                                <Select.Option value="Hourly">Hourly</Select.Option>
                                <Select.Option value="Monthly">Monthly</Select.Option>
                                <Select.Option value="Daily">Daily</Select.Option>
                                <Select.Option value="Fixed">Fixed</Select.Option>
                                <Select.Option value="Non-Billable">Non-Billable</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Budget" name="budget">
                            <InputNumber
                                style={{ width: '100%' }}
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                            />
                        </Form.Item>

                        <Form.Item label="Status" name="status" initialValue="Draft" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="Draft">Draft</Select.Option>
                                <Select.Option value="Active">Active</Select.Option>
                                <Select.Option value="On Hold">On Hold</Select.Option>
                                <Select.Option value="Completed">Completed</Select.Option>
                                <Select.Option value="Closed">Closed</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Project Manager" name="projectManagerId" rules={[{ required: true }]}>
                            <Select placeholder="Select Manager" showSearch optionFilterProp="children">
                                {employees.map(emp => (
                                    <Select.Option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]}>
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item label="End Date" name="endDate">
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </div>

                    <Form.Item style={{ textAlign: "right", marginTop: 24, marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)} disabled={submitting}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>Create Project</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Edit Project"
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    editForm.resetFields();
                    setEditingProject(null);
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Form form={editForm} layout="vertical" onFinish={handleEditProject}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item label="Project Name" name="name" rules={[{ required: true }]}>
                            <Input placeholder="E.g. Website Redesign" />
                        </Form.Item>
                        <Form.Item label="Project Code" name="code" rules={[{ required: true }]}>
                            <Input placeholder="E.g. PRJ-001" disabled />
                        </Form.Item>

                        <Form.Item label="Billing Type" name="billingType" rules={[{ required: true }]}>
                            <Select placeholder="Select Billing Type">
                                <Select.Option value="Hourly">Hourly</Select.Option>
                                <Select.Option value="Monthly">Monthly</Select.Option>
                                <Select.Option value="Daily">Daily</Select.Option>
                                <Select.Option value="Fixed">Fixed</Select.Option>
                                <Select.Option value="Non-Billable">Non-Billable</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Budget" name="budget">
                            <InputNumber
                                style={{ width: '100%' }}
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                            />
                        </Form.Item>

                        <Form.Item label="Status" name="status" initialValue="Draft" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="Draft">Draft</Select.Option>
                                <Select.Option value="Active">Active</Select.Option>
                                <Select.Option value="On Hold">On Hold</Select.Option>
                                <Select.Option value="Completed">Completed</Select.Option>
                                <Select.Option value="Closed">Closed</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Project Manager" name="projectManagerId" rules={[{ required: true }]}>
                            <Select placeholder="Select Manager" showSearch optionFilterProp="children">
                                {employees.map((emp: any) => (
                                    <Select.Option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]}>
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item label="End Date" name="endDate">
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </div>

                    <Form.Item style={{ textAlign: "right", marginTop: 24, marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsEditModalVisible(false)} disabled={submitting}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>Save Changes</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
