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
  Avatar,
  Tooltip,
} from "antd";
import {
  Plus,
  Edit2,
  Search,
  User,
  Mail,
  Phone,
  ShieldCheck,
  MoreHorizontal,
  Trash2,
  Check,
  X,
} from "lucide-react";
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
          message: "Contact Added",
          description: "New contact has been created successfully.",
          placement: "top",
        });
        setIsModalOpen(false);
        form.resetFields();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Failed to add contact.",
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
          message: "Contact Updated",
          description: "Contact details have been updated successfully.",
          placement: "top",
        });
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditingContact(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Update Failed",
        description: "Failed to update contact details.",
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
          message: "Status Updated",
          description: `Contact is now ${newStatus}.`,
          placement: "top",
        });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Status Update Failed",
        description: "Failed to change contact status.",
        placement: "top",
      });
    }
  };

  const columns = [
    {
      title: "Contact Person",
      key: "name",
      render: (_: any, record: any) => (
        <Space size={12}>
          <Avatar 
            style={{ backgroundColor: record.isPrimary ? "#3b82f6" : "#f1f5f9", color: record.isPrimary ? "#fff" : "#64748b" }}
            icon={<User size={16} />}
          >
            {record.firstName?.[0]}{record.lastName?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
              {record.firstName} {record.lastName}
              {record.isPrimary && (
                <Tooltip title="Primary Contact">
                  <ShieldCheck size={14} style={{ marginLeft: 6, color: "#3b82f6", display: "inline" }} />
                </Tooltip>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{record.designation || "No Title"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Communication",
      key: "communication",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Space size={6} style={{ fontSize: 13, color: "#475569" }}>
            <Mail size={14} style={{ color: "#94a3b8" }} />
            {record.officialEmail}
          </Space>
          {record.mobileNumber && (
            <Space size={6} style={{ fontSize: 12, color: "#64748b" }}>
              <Phone size={14} style={{ color: "#94a3b8" }} />
              {record.mobileNumber}
            </Space>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "isPrimary",
      key: "isPrimary",
      render: (isPrimary: boolean) => (
        isPrimary ? (
          <Tag color="processing" style={{ borderRadius: 6, fontWeight: 500, border: 0 }}>PRIMARY</Tag>
        ) : (
          <Tag style={{ borderRadius: 6, fontWeight: 500, border: 0, background: "#f1f5f9", color: "#64748b" }}>SECONDARY</Tag>
        )
      ),
    },
    {
      title: "Account Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        const isActive = status === "Active";
        return (
          <Space size={12}>
            <Tooltip title={isActive ? "Deactivate" : "Activate"}>
              <Switch
                size="small"
                checked={isActive}
                onChange={(checked) => handleStatusChange(record.id, checked)}
                style={{ backgroundColor: isActive ? "#10b981" : "#cbd5e1" }}
              />
            </Tooltip>
            <Tag 
                style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }} 
                color={isActive ? "success" : "default"}
            >
                {status?.toUpperCase()}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space>
            <Button
                type="text"
                className="premium-action-btn"
                icon={<Edit2 size={16} />}
                onClick={() => openEditModal(record)}
                style={{ color: "#64748b" }}
            />
        </Space>
      ),
    },
  ];

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName || ""} ${
      contact.lastName || ""
    }`.toLowerCase();
    const email = (contact.officialEmail || "").toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      <Card 
        style={{ 
            borderRadius: 16, 
            border: "1px solid #f1f5f9",
            background: "#fff"
        }}
        bodyStyle={{ padding: "0" }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Points of Contact</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Manage multiple client representatives and communication details</div>
          </div>
          <Space size={12}>
            <Input
              placeholder="Filter by name or email..."
              prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: 10, width: 280, height: 40 }}
            />
            <Button
              type="primary"
              size="large"
              icon={<Plus size={18} />}
              onClick={() => setIsModalOpen(true)}
              style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center" }}
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
          className="premium-table"
          locale={{ emptyText: <div style={{ padding: "40px 0", color: "#64748b" }}>No contacts found matching your criteria</div> }}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 8, color: "#3b82f6", display: "flex" }}>
                <User size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Add New Contact</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={560}
        centered
        destroyOnClose
        className="premium-modal"
      >
        <div style={{ padding: "8px 0" }}>
            <Form form={form} layout="vertical" onFinish={handleAdd}>
            <Row gutter={16}>
                <Col span={12}>
                <Form.Item
                    name="firstName"
                    label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>First Name</span>}
                    rules={[{ required: true, message: "Required" }]}
                >
                    <Input placeholder="e.g. John" style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item
                    name="lastName"
                    label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Last Name</span>}
                    rules={[{ required: true, message: "Required" }]}
                >
                    <Input placeholder="e.g. Smith" style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
            </Row>
            
            <Form.Item
                name="officialEmail"
                label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Official Email Address</span>}
                rules={[{ required: true, type: "email", message: "Valid email required" }]}
            >
                <Input placeholder="john.smith@company.com" prefix={<Mail size={16} style={{ color: "#94a3b8" }} />} style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                <Form.Item
                    name="mobileNumber"
                    label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Contact Number</span>}
                >
                    <Input placeholder="+1 (555) 000-0000" prefix={<Phone size={16} style={{ color: "#94a3b8" }} />} style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item
                    name="designation"
                    label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Job Designation</span>}
                >
                    <Input placeholder="e.g. CTO, Hiring Manager" style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="isPrimary"
                label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Primary Contact Designation</span>}
                initialValue={false}
            >
                <Select style={{ borderRadius: 8, height: 40 }}>
                <Option value={true}>Yes, this is a Primary Contact</Option>
                <Option value={false}>No, this is a Secondary Contact</Option>
                </Select>
            </Form.Item>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Button 
                    onClick={() => setIsModalOpen(false)}
                    style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
                >
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: "0 24px" }}
                >
                    Create Contact
                </Button>
            </div>
            </Form>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#f0f9ff", padding: 8, borderRadius: 8, color: "#0ea5e9", display: "flex" }}>
                <Edit2 size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Update Contact Information</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingContact(null);
        }}
        footer={null}
        width={560}
        centered
        className="premium-modal"
      >
        <div style={{ padding: "8px 0" }}>
            <Form form={editForm} layout="vertical" onFinish={handleEdit}>
            <Row gutter={16}>
                <Col span={12}>
                <Form.Item
                    name="firstName"
                    label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>First Name</span>}
                    rules={[{ required: true }]}
                >
                    <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item
                    name="lastName"
                    label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Last Name</span>}
                    rules={[{ required: true }]}
                >
                    <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
            </Row>
            
            <Form.Item
                name="officialEmail"
                label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Official Email</span>}
                rules={[{ required: true, type: "email" }]}
            >
                <Input prefix={<Mail size={16} style={{ color: "#94a3b8" }} />} style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                <Form.Item name="mobileNumber" label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Mobile Number</span>}>
                    <Input prefix={<Phone size={16} style={{ color: "#94a3b8" }} />} style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item name="designation" label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Designation</span>}>
                    <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
                </Col>
            </Row>

            <Form.Item name="isPrimary" label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Primary Designation</span>}>
                <Select style={{ borderRadius: 8, height: 40 }}>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
                </Select>
            </Form.Item>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Button 
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ borderRadius: 8, height: 40 }}
                >
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: "0 24px" }}
                >
                    Save Changes
                </Button>
            </div>
            </Form>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .premium-action-btn:hover {
          background: #f1f5f9 !important;
          color: #3b82f6 !important;
        }
        .ant-form-item-label {
            padding-bottom: 6px !important;
        }
      `}} />
    </div>
  );
}
