"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, message, Switch, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";

const { Option } = Select;

interface Props {
    clientId: string;
    contacts: any[];
    onRefresh: () => void;
}

export default function ContactsTab({ clientId, contacts, onRefresh }: Props) {
    const { tenantId } = useTenant();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [editForm] = Form.useForm();

    const handleAdd = async (values: any) => {
        setLoading(true);
        try {
            const data = await api.post(`/api/clients-v2/${clientId}/contacts`, values);
            if (data) {
                message.success("Contact added successfully");
                setIsModalOpen(false);
                form.resetFields();
                onRefresh();
            } else {
                message.error("Failed to add contact");
            }
        } catch (err) {
            console.error(err);
            message.error("Error adding contact");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (contact: any) => {
        setEditingContact(contact);
        editForm.setFieldsValue({
            firstName: contact.firstName,
            lastName: contact.lastName,
            officialEmail: contact.officialEmail,
            mobileNumber: contact.mobileNumber,
            designation: contact.designation,
            isPrimary: contact.isPrimary,
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = async (values: any) => {
        setLoading(true);
        try {
            const data = await api.put(`/api/clients-v2/contacts/${editingContact.id}`, values);
            if (data) {
                message.success("Contact updated successfully");
                setIsEditModalOpen(false);
                editForm.resetFields();
                setEditingContact(null);
                onRefresh();
            } else {
                message.error("Failed to update contact");
            }
        } catch (err) {
            console.error(err);
            message.error("Error updating contact");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (recordId: string, checked: boolean) => {
        const newStatus = checked ? "Active" : "Inactive";
        try {
            const data = await api.put(`/api/clients-v2/contacts/${recordId}`, { status: newStatus });
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
            title: "Name",
            key: "name",
            render: (_: any, record: any) => `${record.firstName} ${record.lastName}`,
        },
        {
            title: "Email",
            dataIndex: "officialEmail",
            key: "officialEmail",
        },
        {
            title: "Phone",
            dataIndex: "mobileNumber",
            key: "mobileNumber",
        },
        {
            title: "Designation",
            dataIndex: "designation",
            key: "designation",
        },
        {
            title: "Primary",
            dataIndex: "isPrimary",
            key: "isPrimary",
            render: (isPrimary: boolean) => isPrimary ? <Tag color="blue">Primary</Tag> : null,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string, record: any) => {
                const isActive = status === "Active";
                return (
                    <Popconfirm
                        title={`Make contact ${isActive ? 'Inactive' : 'Active'}?`}
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
            render: (_: any, record: any) => (
                <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Add Contact
                </Button>
            </div>
            <Table dataSource={contacts} columns={columns} rowKey="id" pagination={false} />

            <Modal
                title="Add New Contact"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAdd}>
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="officialEmail" label="Official Email" rules={[{ required: true, type: "email" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="mobileNumber" label="Mobile Number">
                        <Input />
                    </Form.Item>
                    <Form.Item name="designation" label="Designation">
                        <Input />
                    </Form.Item>
                    <Form.Item name="isPrimary" label="Primary Contact">
                        <Select defaultValue={false}>
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Save Contact
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Edit Contact"
                open={isEditModalOpen}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingContact(null);
                }}
                footer={null}
            >
                <Form form={editForm} layout="vertical" onFinish={handleEdit}>
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="officialEmail" label="Official Email" rules={[{ required: true, type: "email" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="mobileNumber" label="Mobile Number">
                        <Input />
                    </Form.Item>
                    <Form.Item name="designation" label="Designation">
                        <Input />
                    </Form.Item>
                    <Form.Item name="isPrimary" label="Primary Contact">
                        <Select>
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
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
