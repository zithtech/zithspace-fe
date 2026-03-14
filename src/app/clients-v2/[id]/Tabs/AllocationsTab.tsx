"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, DatePicker, Select, InputNumber, Tag, message, Switch, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import dayjs from "dayjs";

const { Option } = Select;

interface Props {
    clientId: string;
    allocations: any[];
    onRefresh: () => void;
}

export default function AllocationsTab({ clientId, allocations, onRefresh }: Props) {
    const { tenantId } = useTenant();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<{ label: string; value: string }[]>([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<any>(null);
    const [editForm] = Form.useForm();

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await api.get<{ id: string, first_name: string, last_name: string }[]>("/api/clients-v2/employees/select");
                // The API structure might vary, adapting standard assumption
                const employeeOptions = (Array.isArray(response) ? response : (response as any).data || []).map((emp: any) => ({
                    label: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.id,
                    value: emp.id
                }));
                setEmployees(employeeOptions);
            } catch (err) {
                console.error("Failed to fetch employees", err);
            }
        };
        fetchEmployees();
    }, []);

    const handleAdd = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                startDate: values.startDate?.toISOString(),
                endDate: values.endDate?.toISOString(),
            };

            const data = await api.post(`/api/clients-v2/${clientId}/allocations`, payload);
            if (data) {
                message.success("Allocation added successfully");
                setIsModalOpen(false);
                form.resetFields();
                onRefresh();
            } else {
                message.error("Failed to add allocation");
            }
        } catch (err) {
            console.error(err);
            message.error("Error adding allocation");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (allocation: any) => {
        setEditingAllocation(allocation);
        editForm.setFieldsValue({
            employeeId: allocation.employeeId,
            billingType: allocation.billingType,
            billAmount: allocation.billAmount,
            startDate: allocation.startDate ? dayjs(allocation.startDate) : undefined,
            endDate: allocation.endDate ? dayjs(allocation.endDate) : undefined,
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                startDate: values.startDate?.toISOString(),
                endDate: values.endDate?.toISOString(),
            };

            const data = await api.put(`/api/clients-v2/allocations/${editingAllocation.id}`, payload);
            if (data) {
                message.success("Allocation updated successfully");
                setIsEditModalOpen(false);
                editForm.resetFields();
                setEditingAllocation(null);
                onRefresh();
            } else {
                message.error("Failed to update allocation");
            }
        } catch (err) {
            console.error(err);
            message.error("Error updating allocation");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (recordId: string, checked: boolean) => {
        const newStatus = checked ? "Active" : "Inactive";
        try {
            const data = await api.put(`/api/clients-v2/allocations/${recordId}`, { status: newStatus });
            if (data) {
                message.success("Status updated successfully");
                onRefresh();
            } else {
                message.error("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            message.error("Error updating status");
        }
    };

    const columns = [
        {
            title: "Employee",
            key: "employee",
            render: (_: any, record: any) => record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : record.employeeId,
        },
        {
            title: "Billing Type",
            dataIndex: "billingType",
            key: "billingType",
        },
        {
            title: "Bill Rate / Amount",
            dataIndex: "billAmount",
            key: "billAmount",
        },
        {
            title: "Start Date",
            dataIndex: "startDate",
            key: "startDate",
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string, record: any) => {
                const isActive = status === "Active";
                return (
                    <Popconfirm
                        title={`Make allocation ${isActive ? 'Inactive' : 'Active'}?`}
                        description={`Are you sure you want to change the status to ${isActive ? 'Inactive' : 'Active'}?`}
                        onConfirm={() => handleStatusChange(record.id, !isActive)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Switch
                            checked={isActive}
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                        />
                    </Popconfirm>
                );
            },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />,
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Add Allocation
                </Button>
            </div>
            <Table dataSource={allocations} columns={columns} rowKey="id" pagination={false} />

            <Modal
                title="Add Employee Client Allocation"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAdd}>
                    <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: "Please select an employee" }]}>
                        <Select
                            showSearch
                            placeholder="Select Employee"
                            loading={employees.length === 0}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={employees}
                        />
                    </Form.Item>
                    <Form.Item name="billingType" label="Billing Type" rules={[{ required: true }]}>
                        <Select>
                            <Option value="T&M">Time & Material (T&M)</Option>
                            <Option value="Fixed Price">Fixed Price</Option>
                            <Option value="Retainer">Retainer</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="billAmount" label="Bill Amount / Rate">
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endDate" label="End Date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Save Allocation
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Edit Employee Client Allocation"
                open={isEditModalOpen}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingAllocation(null);
                }}
                footer={null}
            >
                <Form form={editForm} layout="vertical" onFinish={handleEdit}>
                    <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: "Please select an employee" }]}>
                        <Select
                            showSearch
                            placeholder="Select Employee"
                            loading={employees.length === 0}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={employees}
                            disabled // Usually you don't change the employee after allocation
                        />
                    </Form.Item>
                    <Form.Item name="billingType" label="Billing Type" rules={[{ required: true }]}>
                        <Select>
                            <Option value="T&M">Time & Material (T&M)</Option>
                            <Option value="Fixed Price">Fixed Price</Option>
                            <Option value="Retainer">Retainer</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="billAmount" label="Bill Amount / Rate">
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endDate" label="End Date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
