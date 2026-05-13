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
  Segmented,
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
  Users,
  Mail,
  Phone,
  ShieldCheck,
  MoreHorizontal,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { usePermission } from "@/hooks/usePermission";
import { api } from "@/lib/axios";

const { Option } = Select;

interface Props {
  clientId: string;
  contacts: any[];
  onRefresh: () => void;
}

export default function ContactsTab({ clientId, contacts, onRefresh }: Props) {
  const { tenantId } = useTenant();
  const { canUpdateClient } = usePermission();
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
            style={{ backgroundColor: record.isPrimary ? "#3b82f6" : "var(--bg-slate-50)", color: record.isPrimary ? "#fff" : "var(--text-slate-500)" }}
            icon={<User size={16} />}
          >
            {record.firstName?.[0]}{record.lastName?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 14 }}>
              {record.firstName} {record.lastName}
              {record.isPrimary && (
                <Tooltip title="Primary Contact">
                  <ShieldCheck size={14} style={{ marginLeft: 6, color: "#3b82f6", display: "inline" }} />
                </Tooltip>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.designation || "No Title"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Communication",
      key: "communication",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Space size={6} style={{ fontSize: 13, color: "var(--text-slate-700)" }}>
            <Mail size={14} style={{ color: "var(--text-slate-400)" }} />
            {record.officialEmail}
          </Space>
          {record.mobileNumber && (
            <Space size={6} style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
              <Phone size={14} style={{ color: "var(--text-slate-400)" }} />
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
          <Tag style={{ borderRadius: 6, fontWeight: 500, border: 0, background: "var(--bg-slate-50)", color: "var(--text-slate-500)" }}>SECONDARY</Tag>
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
                style={{ backgroundColor: isActive ? "#10b981" : "var(--border-slate-200)" }}
                disabled={!canUpdateClient}
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
          {canUpdateClient && (
            <Button
              type="text"
              className="premium-action-btn"
              icon={<Edit2 size={16} />}
              onClick={() => openEditModal(record)}
              style={{ color: "var(--text-slate-500)" }}
            />
          )}
        </Space>
      ),
    },
  ];

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName || ""} ${contact.lastName || ""
      }`.toLowerCase();
    const email = (contact.officialEmail || "").toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      <Card className="ptab-card" styles={{ body: { padding: 0 } }}>
        <div className="ptab-header">
          <div className="ptab-header-left">
            <div className="ptab-header-icon violet">
              <Users size={20} />
            </div>
            <div className="ptab-header-titlewrap">
              <div className="ptab-header-title">
                Points of Contact
                <span className="ptab-header-count">{contacts.length}</span>
              </div>
              <div className="ptab-header-desc">
                Manage multiple client representatives and communication details
              </div>
            </div>
          </div>
          <div className="ptab-header-right">
            <Input
              placeholder="Filter by name..."
              prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ptab-search"
              allowClear
            />
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
              className="ptab-primary-btn"
            >
              Add Contact
            </Button>
          </div>
        </div>

        <Table
          dataSource={filteredContacts}
          columns={columns}
          rowKey="id"
          pagination={false}
          className="premium-table"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <div className="ptab-empty">
                <div className="ptab-empty-icon">
                  <Users size={26} />
                </div>
                <div className="ptab-empty-title">No contacts yet</div>
                <div className="ptab-empty-desc">
                  Add representatives, emails, and phone numbers to keep client communication organized.
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title={null}
        width={540}
        centered
        destroyOnClose
        className="pmodal pmodal-compact"
        closeIcon={<X size={16} />}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <div className="pmodal-hero pmodal-hero-slim">
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <User size={18} />
              </div>
              <div className="pmodal-hero-text">
                <div className="pmodal-hero-title">Add New Contact</div>
                <div className="pmodal-hero-sub">A new representative for this client account</div>
              </div>
            </div>
          </div>

          <div className="pmodal-body pmodal-body-compact">
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="firstName"
                  label="First name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input
                    placeholder="e.g. John"
                    onKeyDown={(e) => {
                      if (
                        !/^[A-Za-z\s-]$/.test(e.key) &&
                        e.key !== "Backspace" &&
                        e.key !== "ArrowLeft" &&
                        e.key !== "ArrowRight" &&
                        e.key !== "Tab"
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="lastName"
                  label="Last name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input
                    placeholder="e.g. Smith"
                    onKeyDown={(e) => {
                      if (
                        !/^[A-Za-z\s-]$/.test(e.key) &&
                        e.key !== "Backspace" &&
                        e.key !== "ArrowLeft" &&
                        e.key !== "ArrowRight" &&
                        e.key !== "Tab"
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="designation" label="Job designation">
              <Input placeholder="e.g. CTO, Hiring Manager" />
            </Form.Item>

            <Form.Item
              name="officialEmail"
              label="Official email"
              rules={[{ required: true, type: "email", message: "Valid email required" }]}
            >
              <Input
                placeholder="john.smith@company.com"
                prefix={<Mail size={14} style={{ color: "var(--text-slate-400)" }} />}
              />
            </Form.Item>

            <Row gutter={12} align="top">
              <Col xs={24} sm={12}>
                <Form.Item name="mobileNumber" label="Contact number">
                  <Input
                    placeholder="+1 (555) 000-0000"
                    type="number"
                    prefix={<Phone size={14} style={{ color: "var(--text-slate-400)" }} />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="isPrimary"
                  label="Designation"
                  initialValue={false}
                >
                  <Segmented
                    block
                    className="pmodal-segmented"
                    options={[
                      {
                        label: (
                          <span className="pmodal-seg-label">
                            <ShieldCheck size={12} /> Primary
                          </span>
                        ),
                        value: true,
                      },
                      { label: "Secondary", value: false },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="pmodal-footer pmodal-footer-compact">
            <Button
              onClick={() => setIsModalOpen(false)}
              className="pmodal-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<Plus size={14} />}
              className="pmodal-btn-primary"
            >
              Create Contact
            </Button>
          </div>
        </Form>
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
              <Col xs={24} sm={12}>
                <Form.Item
                  name="firstName"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>First Name</span>}
                  rules={[{ required: true }]}
                >
                  <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="lastName"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Last Name</span>}
                  rules={[{ required: true }]}
                >
                  <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="officialEmail"
              label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Official Email</span>}
              rules={[{ required: true, type: "email" }]}
            >
              <Input prefix={<Mail size={16} style={{ color: "var(--text-slate-400)" }} />} style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="mobileNumber" label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Mobile Number</span>}>
                  <Input prefix={<Phone size={16} style={{ color: "var(--text-slate-400)" }} />} style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="designation" label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Designation</span>}>
                  <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="isPrimary" label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Primary Designation</span>}>
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        @media (max-width: 576px) {
          .premium-table .ant-table-thead > tr > th,
          .premium-table .ant-table-tbody > tr > td {
            padding: 12px 16px !important;
          }
          .ant-modal-content {
            padding: 20px !important;
          }
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }
        .premium-action-btn:hover {
          background: var(--bg-slate-50) !important;
          color: #8b5cf6 !important;
        }
        .ant-form-item-label {
            padding-bottom: 6px !important;
        }
        [data-theme="dark"] .premium-action-btn {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn:hover {
          background: rgba(139, 92, 246, 0.16) !important;
          color: #a78bfa !important;
        }
      `}} />
    </div>
  );
}
