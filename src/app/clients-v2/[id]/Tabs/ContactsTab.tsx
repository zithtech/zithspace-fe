"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Switch,
  Popconfirm,
  notification,
  Card,
  Space,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
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
  const [notify, contextHolder] = notification.useNotification();
  const [searchTerm, setSearchTerm] = useState("");

  const handleAdd = async (values: any) => {
    setLoading(true);
    try {
      const data = await api.post(
        `/api/clients-v2/${clientId}/contacts`,
        values,
      );
      if (data) {
        notify.success({
          message: "Success",
          description: "Contact added successfully",
          placement: "top",
        });
        setIsModalOpen(false);
        form.resetFields();
        onRefresh();
      } else {
        notify.error({
          message: "Error",
          description: "Failed to add contact",
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Error adding contact",
        placement: "top",
      });
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
      const data = await api.put(
        `/api/clients-v2/contacts/${editingContact.id}`,
        values,
      );
      if (data) {
        notify.success({
          message: "Success",
          description: "Contact updated successfully",
          placement: "top",
        });
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditingContact(null);
        onRefresh();
      } else {
        notify.error({
          message: "Error",
          description: "Failed to update contact",
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Error updating contact",
        placement: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recordId: string, checked: boolean) => {
    const newStatus = checked ? "Active" : "Inactive";
    try {
      const data = await api.put(`/api/clients-v2/contacts/${recordId}`, {
        status: newStatus,
      });
      if (data) {
        notify.success({
          message: "Success",
          description: "Status updated successfully",
          placement: "top",
        });
        onRefresh();
      } else {
        notify.error({
          message: "Error",
          description: "Failed to update status",
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Error updating status",
        placement: "top",
      });
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
      render: (isPrimary: boolean) =>
        isPrimary ? <Tag color="blue">Primary</Tag> : null,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        const isActive = status === "Active";
        return (
          <Popconfirm
            title={`Make contact ${isActive ? "Inactive" : "Active"}?`}
            description={`Are you sure you want to change the status to ${isActive ? "Inactive" : "Active"}?`}
            onConfirm={() => handleStatusChange(record.id, !isActive)}
            okText="Yes"
            cancelText="No"
          >
            <Switch
              checked={isActive}
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              style={{
                backgroundColor: isActive ? "#95de64" : "#ff7875",
              }}
            />
          </Popconfirm>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openEditModal(record)}
        />
      ),
    },
  ];

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName || ""} ${
      contact.lastName || ""
    }`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <Card style={{ backgroundColor: "white", height: "60vh" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{ fontSize: 12, fontWeight: 600, margin: 0, color: "grey" }}
          >
            Manage all points of contact for this client, including primary and
            billing contacts.
          </p>
        </div>
        <Space>
          <Input
            placeholder="Search contacts..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Contact
          </Button>
        </Space>
      </div>
      <Table
        dataSource={filteredContacts}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: "#1677ff" }} />
            <span>Add New Contact</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: "#666" }}>
          Enter the details for the new contact.
        </div>
        <Divider style={{ margin: "0 0 16px 0" }} />
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label={<span style={{ fontSize: "12px" }}>First Name</span>}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label={<span style={{ fontSize: "12px" }}>Last Name</span>}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="officialEmail"
                label={<span style={{ fontSize: "12px" }}>Official Email</span>}
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mobileNumber"
                label={<span style={{ fontSize: "12px" }}>Mobile Number</span>}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="designation"
                label={<span style={{ fontSize: "12px" }}>Designation</span>}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isPrimary"
                label={
                  <span style={{ fontSize: "12px" }}>Primary Contact</span>
                }
                initialValue={false}
              >
                <Select>
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 16, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Contact
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: "#1677ff" }} />
            <span>Edit Contact Details</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingContact(null);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24, color: "#666" }}>
          Update the contact details below. Ensure the information is accurate.
        </div>
        <Divider style={{ margin: "12px 0 16px 0" }} />

        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label={<span style={{ fontSize: "12px" }}>First Name</span>}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label={<span style={{ fontSize: "12px" }}>Last Name</span>}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="officialEmail"
                label={<span style={{ fontSize: "12px" }}>Official Email</span>}
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mobileNumber" label="Mobile Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="designation" label="Designation">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPrimary" label="Primary Contact">
                <Select>
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 16, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
