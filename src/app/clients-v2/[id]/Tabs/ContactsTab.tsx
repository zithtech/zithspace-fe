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
  message,
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
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

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
  const [messageApi, contextHolder] = message.useMessage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [projects, setProjects] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get(`/api/clients-v2/${clientId}/projects`);
        setProjects(data || []);
      } catch (err) {
        console.error("Failed to fetch projects for filters:", err);
      }
    };
    fetchProjects();
  }, [clientId]);

  const handleAdd = async (values: any) => {
    setLoading(true);
    try {
      const data = await api.post(
        `/api/clients-v2/${clientId}/contacts`,
        values,
      );
      if (data) {
        messageApi.success("Contact added successfully");
        setIsModalOpen(false);
        form.resetFields();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to add contact");
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
        messageApi.success("Contact updated successfully");
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditingContact(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to update contact details");
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
        messageApi.success(`Contact is now ${newStatus}`);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to change contact status");
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
      title: "Actions",
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
    const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
    const email = (contact.officialEmail || "").toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

    let matchesCategory = true;
    if (selectedCategory === "primary") {
      matchesCategory = contact.isPrimary === true;
    } else if (selectedCategory === "secondary") {
      matchesCategory = contact.isPrimary === false;
    }

    let matchesProject = true;
    if (selectedProject && selectedProject !== "all") {
      matchesProject = contact.projectId === selectedProject;
    }

    return matchesSearch && matchesCategory && matchesProject;
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}

      <div className="contacts-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<Users size={20} color="#8b5cf6" />}
          title="Points of Contact"
          description="Manage multiple client representatives and communication details"
          extra={
            canUpdateClient && (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
                className="ptab-primary-btn"
                style={{
                  // background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",

                  borderColor: "transparent",
                  borderRadius: "8px",
                  height: "32px",
                  fontWeight: 600,
                  // boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Add Contact
              </Button>
            )
          }
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
        />
      </div>

      <div style={{ margin: "20px 0 16px 0", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder="Search by name or email..."
          prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="contacts-search-input"
          style={{ width: "320px" }}
          allowClear
        />

        <Select
          defaultValue="all"
          onChange={(val) => setSelectedCategory(val)}
          style={{ width: "160px" }}
          className="contacts-filter-select"
          placeholder="Category"
          options={[
            { value: "all", label: "All Categories" },
            { value: "primary", label: "Primary Contact" },
            { value: "secondary", label: "Secondary Contact" },
          ]}
        />

        <Select
          defaultValue="all"
          onChange={(val) => setSelectedProject(val)}
          style={{ width: "200px" }}
          className="contacts-filter-select"
          placeholder="Project"
          options={[
            { value: "all", label: "All Projects" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      </div>

      <Card className="ptab-card" styles={{ body: { padding: 0 } }}>
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
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingContact(null);
        }}
        footer={null}
        title={null}
        width={540}
        centered
        destroyOnClose
        className="pmodal pmodal-compact"
        closeIcon={<X size={16} />}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <div className="pmodal-hero pmodal-hero-slim">
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <Edit2 size={18} />
              </div>
              <div className="pmodal-hero-text">
                <div className="pmodal-hero-title">Update Contact Information</div>
                <div className="pmodal-hero-sub">Modify details for this representative</div>
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
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingContact(null);
              }}
              className="pmodal-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<Check size={14} />}
              className="pmodal-btn-primary"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        html body .contacts-header-wrap .ptab-primary-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25) !important;
        }
        .premium-modal .ant-modal-header {
          background: transparent !important;
          border-bottom: none !important;
          padding: 20px 24px 0 !important;
        }
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
        .contacts-search-input.ant-input-affix-wrapper {
          height: 38px !important;
          border-radius: 10px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
        }
        .contacts-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        .contacts-search-input.ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          background: var(--bg-pure-white) !important;
        }
        .contacts-search-input .ant-input {
          background: transparent !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:focus-within {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        .contacts-filter-select.ant-select {
          height: 38px !important;
          border-radius: 10px !important;
        }
        .contacts-filter-select.ant-select .ant-select-selector {
          border-radius: 10px !important;
          height: 38px !important;
          display: flex !important;
          align-items: center !important;
          background: var(--bg-slate-50) !important;
          background-color: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 0 12px !important;
        }
        .contacts-filter-select.ant-select:hover .ant-select-selector {
          border-color: var(--border-slate-200) !important;
          background-color: var(--bg-slate-50) !important;
        }
        .contacts-filter-select.ant-select.ant-select-focused .ant-select-selector {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          background: var(--bg-pure-white) !important;
          background-color: var(--bg-pure-white) !important;
        }
        .contacts-filter-select.ant-select .ant-select-selection-item,
        .contacts-filter-select.ant-select .ant-select-selection-placeholder {
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
          line-height: 36px !important;
        }
        .contacts-filter-select.ant-select .ant-select-arrow {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-selector {
          background: var(--bg-secondary) !important;
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select:hover .ant-select-selector {
          border-color: var(--border-slate-200) !important;
          background-color: var(--bg-secondary) !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select.ant-select-focused .ant-select-selector {
          background: var(--bg-slate-900) !important;
          background-color: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-selection-item,
        [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-selection-placeholder {
          color: var(--text-slate-200) !important;
          font-weight: 500 !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-arrow {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn:hover {
          background: rgba(139, 92, 246, 0.16) !important;
          color: #a78bfa !important;
        }

        /* Input Fields Inside Modals (Add and Edit Modal) */
        .pmodal-body .ant-input-affix-wrapper,
        .pmodal-body .ant-select-selector,
        .pmodal-body .ant-input-number,
        .premium-modal .ant-input-affix-wrapper,
        .premium-modal .ant-select-selector,
        .premium-modal .ant-input-number {
          border: 1px solid var(--border-slate-200) !important;
        }
        .pmodal-body .ant-input,
        .premium-modal .ant-input {
          border: 1px solid var(--border-slate-200) !important;
        }
        .pmodal-body .ant-input-affix-wrapper .ant-input,
        .pmodal-body .ant-input-affix-wrapper .ant-input:focus,
        .pmodal-body .ant-input-affix-wrapper .ant-input:hover,
        .premium-modal .ant-input-affix-wrapper .ant-input,
        .premium-modal .ant-input-affix-wrapper .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper .ant-input:hover,
        .pmodal-body .ant-input-number .ant-input-number-input,
        .pmodal-body .ant-input-number .ant-input-number-input:focus,
        .pmodal-body .ant-input-number .ant-input-number-input:hover,
        .premium-modal .ant-input-number .ant-input-number-input,
        .premium-modal .ant-input-number .ant-input-number-input:focus,
        .premium-modal .ant-input-number .ant-input-number-input:hover {
          border: 0 !important;
          border-width: 0 !important;
          box-shadow: none !important;
        }

        /* Input Hover state */
        .pmodal-body .ant-input:hover,
        .pmodal-body .ant-input-affix-wrapper:hover,
        .pmodal-body .ant-select:hover .ant-select-selector,
        .pmodal-body .ant-input-number:hover,
        .premium-modal .ant-input:hover,
        .premium-modal .ant-input-affix-wrapper:hover,
        .premium-modal .ant-select:hover .ant-select-selector,
        .premium-modal .ant-input-number:hover {
          border-color: rgba(139, 92, 246, 0.45) !important;
        }

        /* Input Focus state */
        .pmodal-body .ant-input-affix-wrapper-focused,
        .pmodal-body .ant-select-focused .ant-select-selector,
        .pmodal-body .ant-input-number-focused,
        .pmodal-body .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper-focused,
        .premium-modal .ant-select-focused .ant-select-selector,
        .premium-modal .ant-input-number-focused,
        .premium-modal .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          background: var(--bg-pure-white) !important;
        }

        /* Dark theme overrides for inputs */
        [data-theme="dark"] .pmodal-body .ant-input,
        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper,
        [data-theme="dark"] .pmodal-body .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number,
        [data-theme="dark"] .premium-modal .ant-input,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper,
        [data-theme="dark"] .premium-modal .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number {
          background: var(--bg-primary) !important;
          border-color: var(--border-slate-200) !important;
          color: var(--text-slate-900) !important;
        }
        
        [data-theme="dark"] .pmodal-body .ant-input:hover,
        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper:hover,
        [data-theme="dark"] .pmodal-body .ant-select:hover .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number:hover,
        [data-theme="dark"] .premium-modal .ant-input:hover,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper:hover,
        [data-theme="dark"] .premium-modal .ant-select:hover .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number:hover {
          border-color: rgba(167, 139, 250, 0.55) !important;
        }

        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper-focused,
        [data-theme="dark"] .pmodal-body .ant-select-focused .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number-focused,
        [data-theme="dark"] .pmodal-body .ant-input:focus,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper-focused,
        [data-theme="dark"] .premium-modal .ant-select-focused .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number-focused,
        [data-theme="dark"] .premium-modal .ant-input:focus,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper:focus-within {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18) !important;
          background: var(--bg-secondary) !important;
        }

        /* Add Contact Modal Header Polish */
        .pmodal-hero {
          background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%) !important;
          color: var(--text-slate-900) !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .pmodal-hero-slim {
          background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%) !important;
          color: var(--text-slate-900) !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .pmodal-hero-title {
          color: var(--text-slate-900) !important;
        }
        .pmodal-hero-sub {
          color: var(--text-slate-500) !important;
        }
        .pmodal-hero-icon {
          background: rgba(139, 92, 246, 0.1) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          color: #8b5cf6 !important;
          box-shadow: none !important;
        }
        .pmodal-hero-mesh {
          background-image:
            linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px) !important;
        }
        .pmodal-hero-blob {
          opacity: 0.25 !important;
        }
        .pmodal .ant-modal-close {
          background: rgba(15, 23, 42, 0.05) !important;
          color: var(--text-slate-500) !important;
        }
        .pmodal .ant-modal-close:hover {
          background: rgba(15, 23, 42, 0.1) !important;
          color: var(--text-slate-900) !important;
        }

        /* Dark theme header overrides */
        [data-theme="dark"] .pmodal-hero {
          background:
            radial-gradient(800px 220px at -10% 0%, rgba(139, 92, 246, 0.4), transparent 60%),
            radial-gradient(600px 220px at 110% 100%, rgba(59, 130, 246, 0.35), transparent 60%),
            linear-gradient(135deg, #0b1220 0%, #111827 100%) !important;
          color: #fff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        [data-theme="dark"] .pmodal-hero-slim {
          background:
            radial-gradient(500px 140px at -10% 0%, rgba(139, 92, 246, 0.4), transparent 65%),
            radial-gradient(420px 140px at 110% 100%, rgba(99, 102, 241, 0.35), transparent 65%),
            linear-gradient(135deg, #0b1220 0%, #111827 100%) !important;
          color: #fff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        [data-theme="dark"] .pmodal-hero-title {
          color: #fff !important;
        }
        [data-theme="dark"] .pmodal-hero-sub {
          color: rgba(226, 232, 240, 0.78) !important;
        }
        [data-theme="dark"] .pmodal-hero-icon {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          color: #fff !important;
        }
        [data-theme="dark"] .pmodal-hero-mesh {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) !important;
        }
        [data-theme="dark"] .pmodal-hero-blob {
          opacity: 0.45 !important;
        }
        [data-theme="dark"] .pmodal .ant-modal-close {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }
        [data-theme="dark"] .pmodal .ant-modal-close:hover {
          background: rgba(255, 255, 255, 0.16) !important;
          color: #fff !important;
        }


        /* Force header elements to stay on the exact same line, overriding TimeTrackingHeader media query */
        @media (max-width: 1200px) {
          html body .contacts-header-wrap .saas-header-container .saas-header-row {
            flex-wrap: nowrap !important;
          }
          html body .contacts-header-wrap .saas-header-container .saas-header-left-col {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          html body .contacts-header-wrap .saas-header-container .saas-header-extra-col {
            width: auto !important;
            flex: 0 0 auto !important;
            margin-top: 0 !important;
          }
          html body .contacts-header-wrap .saas-header-container .saas-header-left-group {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
          html body .contacts-header-wrap .saas-header-container .bh-header-divider {
            display: inline-block !important;
          }
        }

        /* Prevent horizontal overflow from edge-to-edge header bleed */
        .cd-tabs .ant-tabs-content-holder {
          overflow-x: hidden !important;
        }
      `}} />
    </div>
  );
}
