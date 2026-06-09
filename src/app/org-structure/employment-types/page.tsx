"use client";

import React, { useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Typography,
  Button,
  Input,
  Table,
  Form,
  Switch,
  notification,
  Spin,
  Tooltip,
  Drawer,
  Popconfirm,
} from "antd";
import {
  Briefcase,
  Edit,
  Plus,
  Search,
  Layers,
  ShieldCheck,
  User,
  X,
  Tag as TagIcon,
  Settings,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { EmploymentType } from "@/services/employmentTypeService";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgStatCard, OrgMiniBar } from "@/components/org-structure/OrgPageWidgets";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

const { Text } = Typography;

export default function EmploymentTypesPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureEmploymentTypes" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const {
    canReadOrgEmploymentType,
    canCreateOrgEmploymentType,
    canUpdateOrgEmploymentType,
    canDeleteOrgEmploymentType,
    canReadActivityLog
  } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    employmentTypes,
    loading,
    createEmploymentType,
    updateEmploymentType,
    deleteEmploymentType,
  } = useEmploymentTypes();

  useEffect(() => {
    if (!authLoading && !canReadOrgEmploymentType) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgEmploymentType, router]);

  const totalTypes = employmentTypes.length;
  const activeTypes = employmentTypes.filter((t) => t.isActive).length;
  const inactiveTypes = totalTypes - activeTypes;

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: EmploymentType) => {
    setEditingKey(record.id);
    form.setFieldsValue({ ...record, typeName: record.name });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteEmploymentType(id);
    if (success) {
      api.success({
        message: "Employment Type Removed",
        description: "The employment type has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
    }
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = {
        code: formValues.code,
        name: formValues.typeName,
        description: formValues.description,
        isActive: formValues.isActive,
      };
      setSubmitting(true);
      const success = editingKey
        ? await updateEmploymentType(editingKey, payload)
        : await createEmploymentType(payload);
      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: `Employment Type ${editingKey ? "Updated" : "Added"}`,
          description: `Employment type "${formValues.typeName}" was successfully saved.`,
          placement: "topRight",
          duration: 2,
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return employmentTypes;
    const q = searchText.toLowerCase();
    return employmentTypes.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q),
    );
  }, [employmentTypes, searchText]);

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin size="large" tip="Loading Employment Types..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrgEmploymentType) return null;

  const columns = [
    {
      title: "Employment Type",
      key: "identity",
      width: 250,
      render: (_: any, record: EmploymentType) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "ET"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 300,
      ellipsis: { showTitle: false },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <span className="orgx-row-desc">{description || "No description provided"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <span className={`orgx-status-pill ${isActive ? "is-active" : "is-inactive"}`}>
          <span className="orgx-status-dot" />
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, record: EmploymentType) => (
        <div className="orgx-row-actions">
          {canUpdateOrgEmploymentType && (
            <Tooltip title="Edit Type">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgEmploymentType && (
            <Popconfirm
              title="Remove employment type?"
              description="This will permanently delete this employment type."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div className="orgx-shell">
          <TimeTrackingHeader
            icon={<Briefcase size={20} color="#3b82f6" />}
            title="Employment Types"
            description="Define and manage workforce contract types and employment structures."
            style={{
              borderBottom: "1px solid var(--border-slate-200)",
              padding: "9.5px 32px",
              marginBottom: 20,
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
            extra={
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {canReadActivityLog && (
                  <Button
                    icon={<History size={15} />}
                    onClick={() => setHistoryOpen(true)}
                    style={{ borderRadius: 10, height: 38, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    History
                  </Button>
                )}
                {canCreateOrgEmploymentType && (
                  <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={handleAdd}
                    className="orgx-primary-btn"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    New Type
                  </Button>
                )}
              </div>
            }
          />

          <div className="orgx-content">
            {/* Stats */}
            <div className="orgx-stat-grid">
              <OrgStatCard
                label="Total Types"
                value={totalTypes}
                icon={<Layers size={14} />}
                accent="#3b82f6"
                subtle="Contract categories"
                loading={loading && totalTypes === 0}
                chart={
                  totalTypes > 0 ? (
                    <OrgMiniBar
                      segments={[
                        { value: activeTypes, color: "#10b981", label: `${activeTypes} active` },
                        { value: inactiveTypes, color: "#94a3b8", label: `${inactiveTypes} inactive` },
                      ]}
                    />
                  ) : null
                }
              />
              <OrgStatCard
                label="Active"
                value={activeTypes}
                icon={<ShieldCheck size={14} />}
                accent="#10b981"
                subtle={totalTypes > 0 ? `${Math.round((activeTypes / totalTypes) * 100)}% of total` : "No types yet"}
                loading={loading && totalTypes === 0}
              />
              <OrgStatCard
                label="Inactive"
                value={inactiveTypes}
                icon={<User size={14} />}
                accent="#f59e0b"
                subtle="Currently unavailable"
                loading={loading && totalTypes === 0}
              />
              <OrgStatCard
                label="Coverage"
                value={`${totalTypes > 0 ? Math.round((activeTypes / totalTypes) * 100) : 0}%`}
                icon={<Briefcase size={14} />}
                accent="#8b5cf6"
                subtle="Active utilization rate"
                loading={loading && totalTypes === 0}
                chart={
                  totalTypes > 0 ? (
                    <div className="orgx-progress-row">
                      <div className="orgx-progress-track">
                        <span
                          className="orgx-progress-fill"
                          style={{
                            width: `${(activeTypes / totalTypes) * 100}%`,
                            background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                          }}
                        />
                      </div>
                      <span className="orgx-progress-label">
                        {activeTypes}/{totalTypes}
                      </span>
                    </div>
                  ) : null
                }
              />
            </div>

            {/* Panel */}
            <div className="orgx-panel">
              <div className="orgx-toolbar">
                <Input
                  className="orgx-search"
                  prefix={<Search size={14} color="var(--text-slate-400)" style={{ marginRight: 4 }} />}
                  placeholder="Search by name, code, or description…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <div className="orgx-toolbar__divider" />
                <Text className="orgx-count-text">
                  <strong>{filteredData.length}</strong> of {totalTypes}
                </Text>
              </div>

              <Table
                className="orgx-table"
                rowKey="id"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                size="middle"
                pagination={{ pageSize: 12, position: ["bottomRight"] }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>

          {/* Create / Edit Drawer */}
          <Drawer
            className="orgx-drawer"
            width={520}
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            closable={false}
            styles={{ header: { display: "none" }, footer: { padding: 0, border: "none" } }}
            footer={
              <div className="orgx-drawer__footer">
                <Button onClick={() => setIsDrawerOpen(false)} className="orgx-btn-ghost">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={handleSave}
                  className="orgx-btn-primary"
                >
                  {editingKey ? "Save Changes" : "Create Type"}
                </Button>
              </div>
            }
          >
            <button
              type="button"
              className="orgx-drawer__close"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close"
            >
              <X size={14} />
            </button>

            <div className="orgx-drawer__hero">
              <div className="orgx-drawer__hero-icon">
                <Briefcase size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Employment Type</div>
                <div className="orgx-drawer__hero-title">
                  {editingKey ? "Edit Type" : "New Employment Type"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Configure a contract type used when onboarding members.
                </div>
              </div>
            </div>

            <div className="orgx-drawer__body">
              <Form form={form} layout="vertical" requiredMark={false}>
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <TagIcon size={11} /> Identity
                  </div>
                  <Form.Item
                    name="typeName"
                    label="Type name"
                    rules={[{ required: true, message: "Please enter type name" }]}
                  >
                    <Input
                      placeholder="e.g. Full-Time Regular"
                      onChange={(e) => {
                        if (!editingKey) {
                          form.setFieldsValue({ code: generateCodeFromName(e.target.value) });
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. FULL_TIME" />
                  </Form.Item>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Settings size={11} /> Controls
                  </div>
                  <div className="orgx-toggle-row">
                    <div className="orgx-toggle-row__text">
                      <div className="orgx-toggle-row__title">Active status</div>
                      <div className="orgx-toggle-row__sub">
                        Allow using this type for new employee contracts.
                      </div>
                    </div>
                    <Form.Item name="isActive" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Description (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Requirements or details for this employment category…"
                      maxLength={240}
                      showCount
                    />
                  </Form.Item>
                </div>
              </Form>
            </div>
          </Drawer>
        </div>
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          module="OrgStructure"
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
