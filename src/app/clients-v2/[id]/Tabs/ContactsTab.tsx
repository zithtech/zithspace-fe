"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
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
  Dropdown,
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
  LayoutGrid,
  List,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { usePermission } from "@/hooks/usePermission";
import { api } from "@/lib/axios";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import SearchableDropdown from "@/components/common/SearchableDropdown";

const { Option } = Select;

interface Props {
  clientId: string;
  contacts: any[];
  onRefresh: () => void;
}

export default function ContactsTab({ clientId, contacts, onRefresh }: Props) {
  const { tenantId } = useTenant();
  const { canUpdateClient } = usePermission();

  const accentFor = (key: string) => {
    return ["#3b82f6", "#1d4ed8"];
  };

  const contactActionMenu = (contact: any) => ({
    className: "pp-action-pop",
    items: [
      {
        key: "edit",
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><Edit2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit</span>
              <span className="pp-menu-desc">Modify contact details</span>
            </span>
          </div>
        )
      },
      {
        key: "delete",
        danger: true,
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete</span>
              <span className="pp-menu-desc">Remove representative</span>
            </span>
          </div>
        )
      }
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent?.stopPropagation();
      if (key === "edit") {
        openEditModal(contact);
      } else if (key === "delete") {
        modal.confirm({
          title: "Delete Contact",
          content: `Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`,
          okText: "Delete",
          okType: "danger",
          cancelText: "Cancel",
          onOk: () => handleDelete(contact.id),
        });
      }
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

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

  const handleDelete = async (contactId: string) => {
    try {
      await api.delete(`/api/clients-v2/contacts/${contactId}`);
      messageApi.success("Contact deleted successfully");
      onRefresh();
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to delete contact");
    }
  };

  const columns = [
    {
      title: "Contact Person",
      key: "name",
      render: (_: any, record: any) => {
        const accent = accentFor(record.id || `${record.firstName} ${record.lastName}`);
        return (
          <Space size={12}>
            <Avatar
              style={{
                background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)`,
                color: "#fff",
                borderRadius: "6px",
              }}
            >
              {(record.firstName?.[0] || "").toUpperCase()}
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
      );
    },
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
          <Space size={8}>
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
      title: "Created By",
      key: "createdBy",
      render: (_: any, record: any) => {
        const creator = record.createdBy;
        if (!creator?.name) return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
        return (
          <div className="pp-creator" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar size={20} src={creator.avatarUrl || creator.avatar} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
              {(creator.name?.[0] || "").toUpperCase()}
            </Avatar>
            <span className="pp-creator-name" style={{ fontSize: "11.5px", color: "var(--text-slate-700)", whiteSpace: "nowrap" }}>{creator.name}</span>
          </div>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? (
          <div className="pp-date" style={{ display: "flex", flexDirection: "column" }}>
            <span className="pp-date-main" style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span className="pp-date-sub" style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 72,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={contactActionMenu(record)}
          overlayClassName="pp-action-pop"
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="pp-icon-btn"
            icon={<MoreHorizontal size={16} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
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
      {modalContextHolder}

      <div className="cd-tab-sticky-head">
      <div className="contacts-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Users size={20} color="#3b82f6" />}
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
            style={{
              background: "transparent",
              borderBottom: "1px solid var(--border-slate-100)",
              padding: "4px 32px",
              marginBottom: "8px",
            }}
          />
        </div>
  
        <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 }}>
            <Input
              placeholder="Search by name or email..."
              prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contacts-search-input"
              style={{ width: "320px" }}
              allowClear
            />
  
            <SearchableDropdown
              placeholder="Category"
              searchPlaceholder="Search categories"
              itemNoun="categories"
              value={selectedCategory === "all" ? undefined : selectedCategory}
              onChange={(v) => setSelectedCategory(v ?? "all")}
              options={[
                { value: "primary", label: "Primary Contact" },
                { value: "secondary", label: "Secondary Contact" },
              ]}
              width={180}
              className="contacts-filter-select-sd"
            />
  
            <SearchableDropdown
              placeholder="Project"
              searchPlaceholder="Search projects"
              itemNoun="projects"
              value={selectedProject === "all" ? undefined : selectedProject}
              onChange={(v) => setSelectedProject(v ?? "all")}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              width={220}
              disabled={projects.length === 0}
              className="contacts-filter-select-sd"
            />
          </div>
  
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
  
        <div className="ptab-divider" />
      </div>

      {viewMode === "list" ? (
        <div className="pp-table-wrap">
          <Table
            dataSource={filteredContacts}
            columns={columns}
            rowKey="id"
            pagination={false}
            className="pp-table"
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
        </div>
      ) : (
        <div className="pp-grid">
          {filteredContacts.length === 0 ? (
            <div className="ptab-empty-wrapper">
              <div className="ptab-empty">
                <div className="ptab-empty-icon">
                  <Users size={26} />
                </div>
                <div className="ptab-empty-title">No contacts yet</div>
                <div className="ptab-empty-desc">
                  Add representatives, emails, and phone numbers to keep client communication organized.
                </div>
              </div>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const name = `${contact.firstName || ""} ${contact.lastName || ""}`;
              const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`;
              const isActive = contact.status === "Active";
              const accent = accentFor(contact.id || name);
              const created = contact.createdAt ? dayjs(contact.createdAt) : null;
              const updated = contact.updatedAt ? dayjs(contact.updatedAt) : null;

              return (
                <div key={contact.id} className="pc-card">
                  <div className="pc-top">
                    <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
                      {(contact.firstName?.[0] || "").toUpperCase()}
                    </div>
                    <div className="pc-identity-body">
                      <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span>{name}</span>
                        {contact.isPrimary && (
                          <Tooltip title="Primary Contact">
                            <ShieldCheck size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
                          </Tooltip>
                        )}
                        <span
                          className="pc-status-tag"
                          style={{
                            marginLeft: "4px",
                            fontSize: "10px",
                            padding: "1px 6px",
                            color: isActive ? "#10b981" : "var(--text-slate-400)",
                            background: isActive ? "rgba(16, 185, 129, 0.12)" : "var(--bg-slate-100)"
                          }}
                        >
                          {contact.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="pc-client-line">
                        <span className="pc-client-key">Title:</span>
                        <span className="pc-client-val">{contact.designation || "No Title"}</span>
                      </div>
                    </div>
                    <Dropdown
                      menu={contactActionMenu(contact)}
                      overlayClassName="pp-action-pop"
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal size={14} />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="pc-foot">
                    <div className="pc-foot-row">
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Created by</span>
                        <Avatar size={16} src={contact.createdBy?.avatarUrl || contact.createdBy?.avatar} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                          {(contact.createdBy?.name?.[0] || "—").toUpperCase()}
                        </Avatar>
                        <span className="pc-foot-val">{contact.createdBy?.name || "—"}</span>
                      </span>
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Created</span>
                        <span className="pc-foot-val">{created ? created.format("MMM D, YYYY · h:mm A") : "—"}</span>
                      </span>
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Updated</span>
                        <span className="pc-foot-val">{updated ? updated.format("MMM D, YYYY · h:mm A") : "—"}</span>
                      </span>
                    </div>

                    <div className="pc-foot-row">
                      <span className="pc-foot-item">
                        <Mail size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                        <a href={`mailto:${contact.officialEmail}`} className="cc-comm-link" style={{ fontSize: "11.5px" }}>
                          {contact.officialEmail}
                        </a>
                      </span>
                      {contact.mobileNumber && (
                        <>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <Phone size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                            <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)", fontWeight: 600 }}>{contact.mobileNumber}</span>
                          </span>
                        </>
                      )}
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Type:</span>
                        {contact.isPrimary ? (
                          <span className="pc-status-tag" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}>
                            PRIMARY
                          </span>
                        ) : (
                          <span className="pc-status-tag" style={{ color: "var(--text-slate-500)", background: "var(--bg-slate-100)" }}>
                            SECONDARY
                          </span>
                        )}
                      </span>
                      {canUpdateClient && (
                        <>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <Switch
                              size="small"
                              checked={isActive}
                              onChange={(checked) => handleStatusChange(contact.id, checked)}
                              style={{ backgroundColor: isActive ? "#10b981" : "var(--border-slate-200)" }}
                            />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
                <Form.Item
                  name="mobileNumber"
                  label="Contact number"
                  rules={[
                    { required: true, message: "Contact number is required" },
                    { pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, message: "Please enter a valid phone number" },
                    { validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const digitCount = (value.match(/\d/g) || []).length;
                        if (digitCount < 7 || digitCount > 15) {
                          return Promise.reject("Phone number must contain between 7 and 15 digits");
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input
                    placeholder="+1 (555) 000-0000"
                    prefix={<Phone size={14} style={{ color: "var(--text-slate-400)" }} />}
                    onKeyDown={(e) => {
                      if (
                        !/^[0-9+\-()\s]$/.test(e.key) &&
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
                <Form.Item
                  name="mobileNumber"
                  label="Contact number"
                  rules={[
                    { required: true, message: "Contact number is required" },
                    { pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, message: "Please enter a valid phone number" },
                    { validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const digitCount = (value.match(/\d/g) || []).length;
                        if (digitCount < 7 || digitCount > 15) {
                          return Promise.reject("Phone number must contain between 7 and 15 digits");
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input
                    placeholder="+1 (555) 000-0000"
                    prefix={<Phone size={14} style={{ color: "var(--text-slate-400)" }} />}
                    onKeyDown={(e) => {
                      if (
                        !/^[0-9+\-()\s]$/.test(e.key) &&
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
          border-radius: 8px !important;
        }
        html body .pmodal .ant-modal-content {
          border-radius: 8px !important;
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
          color: var(--text-slate-400) !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        .premium-table .ant-table-tbody > tr > td {
          padding: 6.5px 10px !important;
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
          height: 32px !important;
          border-radius: 8px !important;
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
          height: 32px !important;
          border-radius: 8px !important;
        }
        .contacts-filter-select.ant-select .ant-select-selector {
          border-radius: 8px !important;
          height: 32px !important;
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
          line-height: 30px !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-arrow {
          color: var(--text-slate-400) !important;
        }

        /* Searchable Dropdown Overrides */
        .contacts-filter-select-sd.sd-trigger {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
          width: auto !important;
          min-width: 160px;
        }
        .contacts-filter-select-sd.sd-trigger:hover {
          border-color: var(--border-slate-200) !important;
          background: var(--bg-slate-50) !important;
        }
        .contacts-filter-select-sd.sd-trigger.is-active {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
        }
        .contacts-filter-select-sd.sd-trigger.is-open {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger:hover {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-active,
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-open {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        /* Segmented Toggles */
        .ptab-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .ptab-segmented button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .ptab-segmented button:hover {
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
        }
        .ptab-segmented button.is-active {
          background: var(--bg-blue-50) !important;
          color: #3b82f6 !important;
        }
        [data-theme='dark'] .ptab-segmented {
          border-color: var(--border-slate-200);
          background: var(--bg-secondary);
        }
        [data-theme='dark'] .ptab-segmented button.is-active {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }

        /* Proposal Style Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-thead > tr > th::before { display: none !important; }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-placeholder > td { background: transparent !important; }

        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        /* Proposal Style Cards Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        .pc-status-tag .anticon { font-size: 9px; }

        /* Dropdown Action Popover */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 200px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

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
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
          color: var(--text-slate-900) !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .pmodal-hero-slim {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
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
          background: rgba(59, 130, 246, 0.1) !important;
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
          color: #3b82f6 !important;
          box-shadow: none !important;
        }
        .pmodal-hero-mesh {
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px) !important;
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
            radial-gradient(800px 220px at -10% 0%, rgba(59, 130, 246, 0.4), transparent 60%),
            radial-gradient(600px 220px at 110% 100%, rgba(59, 130, 246, 0.35), transparent 60%),
            linear-gradient(135deg, #0b1220 0%, #111827 100%) !important;
          color: #fff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        [data-theme="dark"] .pmodal-hero-slim {
          background:
            radial-gradient(500px 140px at -10% 0%, rgba(59, 130, 246, 0.4), transparent 65%),
            radial-gradient(420px 140px at 110% 100%, rgba(59, 130, 246, 0.35), transparent 65%),
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

        /* Prevent horizontal overflow from edge-to-edge header bleed */
        .cd-tabs .ant-tabs-content-holder {
          overflow-x: hidden !important;
        }
      `}} />
    </div>
  );
}
