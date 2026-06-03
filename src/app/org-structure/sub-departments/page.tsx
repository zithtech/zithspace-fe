"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Typography,
  Button,
  Input,
  Table,
  Form,
  Select,
  notification,
  Spin,
  Tooltip,
  Switch,
  Drawer,
  Popconfirm,
} from "antd";
import {
  GitBranch,
  Edit,
  Plus,
  Search,
  Layers,
  ShieldCheck,
  User,
  X,
  Tag as TagIcon,
  Settings,
  Building2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgStatCard, OrgMiniBar } from "@/components/org-structure/OrgPageWidgets";
import { useActivitySource } from "@/hooks/useActivitySource";

const { Text } = Typography;

export default function SubDepartmentsPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureSubDepartments" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg, canManageOrg } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [submitting, setSubmitting] = useState(false);

  const { departments, loading: departmentsLoading } = useDepartments();
  const {
    subDepartments,
    loading: subDepartmentsLoading,
    fetchSubDepartments,
    createSubDepartment,
    updateSubDepartment,
    deleteSubDepartment,
  } = useSubDepartments();

  const filteredData = useMemo(() => {
    return subDepartments.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesDepartment =
        !departmentFilter || item.parentDepartmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [subDepartments, searchText, statusFilter, departmentFilter]);

  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrg, router]);

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin size="large" tip="Loading Sub-Departments..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrg) return null;

  const totalSubDepartments = subDepartments.length;
  const activeSubDepartments = subDepartments.filter((d) => d.isActive).length;
  const inactiveSubDepartments = totalSubDepartments - activeSubDepartments;
  const uniqueParents = new Set(subDepartments.map((s) => s.parentDepartmentId).filter(Boolean));

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSubDepartment(id);
    if (success) {
      api.success({
        message: "Sub-Department Removed",
        description: "The sub-department has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
      fetchSubDepartments();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const success = editingId
        ? await updateSubDepartment(editingId, values)
        : await createSubDepartment(values);
      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: `Sub-Department ${editingId ? "Updated" : "Created"}`,
          description: `The sub-department "${values.name}" has been successfully saved.`,
          placement: "topRight",
          duration: 2,
        });
        fetchSubDepartments();
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Sub-Department",
      key: "identity",
      width: "32%",
      render: (_: any, record: any) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "SD"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Parent Department",
      dataIndex: "parentDepartmentId",
      key: "parentDepartmentId",
      render: (parentDepartmentId: string, record: any) => {
        const deptName =
          record.parentDepartment?.name ||
          departments.find((d) => d.id === parentDepartmentId)?.name;
        return (
          <span className={`orgx-row-soft-tag${!deptName ? " is-muted" : ""}`}>
            {deptName || "Not assigned"}
          </span>
        );
      },
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
      render: (_: any, record: any) => (
        <div className="orgx-row-actions">
          {canManageOrg && (
            <>
              <Tooltip title="Edit Sub-Department">
                <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
              </Tooltip>
              <Popconfirm
                title="Remove sub-department?"
                description="This will permanently delete this sub-department."
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete">
                  <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
                </Tooltip>
              </Popconfirm>
            </>
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
            icon={<GitBranch size={20} color="#3b82f6" />}
            title="Sub-Departments"
            description="Define specialized organizational branches and nested business units."
            style={{
              borderBottom: "1px solid var(--border-slate-200)",
              padding: "8.5px 32px",
              marginBottom: 20,
            }}
            extra={
              canManageOrg && (
                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  onClick={handleAdd}
                  className="orgx-primary-btn"
                >
                  New Sub-Department
                </Button>
              )
            }
          />

          <div className="orgx-content">
            <div className="orgx-stat-grid">
              <OrgStatCard
                label="Total Sub-Departments"
                value={totalSubDepartments}
                icon={<Layers size={14} />}
                accent="#3b82f6"
                subtle="Nested business units"
                loading={subDepartmentsLoading && totalSubDepartments === 0}
                chart={
                  totalSubDepartments > 0 ? (
                    <OrgMiniBar
                      segments={[
                        { value: activeSubDepartments, color: "#10b981", label: `${activeSubDepartments} active` },
                        { value: inactiveSubDepartments, color: "#94a3b8", label: `${inactiveSubDepartments} inactive` },
                      ]}
                    />
                  ) : null
                }
              />
              <OrgStatCard
                label="Active"
                value={activeSubDepartments}
                icon={<ShieldCheck size={14} />}
                accent="#10b981"
                subtle={
                  totalSubDepartments > 0
                    ? `${Math.round((activeSubDepartments / totalSubDepartments) * 100)}% of total`
                    : "No sub-departments yet"
                }
                loading={subDepartmentsLoading && totalSubDepartments === 0}
              />
              <OrgStatCard
                label="Inactive"
                value={inactiveSubDepartments}
                icon={<User size={14} />}
                accent="#f59e0b"
                subtle="Currently disabled"
                loading={subDepartmentsLoading && totalSubDepartments === 0}
              />
              <OrgStatCard
                label="Parent Coverage"
                value={uniqueParents.size}
                icon={<Building2 size={14} />}
                accent="#8b5cf6"
                subtle="Departments with branches"
                loading={subDepartmentsLoading && totalSubDepartments === 0}
              />
            </div>

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
                <Select
                  className="orgx-select"
                  placeholder="All statuses"
                  allowClear
                  style={{ minWidth: 150 }}
                  value={statusFilter || undefined}
                  onChange={(v) => setStatusFilter(v || null)}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
                <Select
                  className="orgx-select"
                  placeholder="All departments"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ minWidth: 200 }}
                  loading={departmentsLoading}
                  value={departmentFilter || undefined}
                  onChange={(v) => setDepartmentFilter(v || null)}
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                />
                <div className="orgx-toolbar__divider" />
                <Text className="orgx-count-text">
                  <strong>{filteredData.length}</strong> of {totalSubDepartments}
                </Text>
              </div>

              <Table
                className="orgx-table"
                rowKey="id"
                columns={columns}
                dataSource={filteredData}
                loading={subDepartmentsLoading}
                size="middle"
                pagination={{ pageSize: 12, position: ["bottomRight"] }}
              />
            </div>
          </div>

          {/* Drawer */}
          <Drawer
            className="orgx-drawer"
            width={540}
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
                  {editingId ? "Save Changes" : "Create Sub-Department"}
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
                <GitBranch size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Sub-Department</div>
                <div className="orgx-drawer__hero-title">
                  {editingId ? "Edit Sub-Department" : "New Sub-Department"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Configure a specialized branch within a parent department.
                </div>
              </div>
            </div>

            <div className="orgx-drawer__body">
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={(changed) => {
                  if (changed.name !== undefined && !editingId) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.name) });
                  }
                }}
              >
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <TagIcon size={11} /> Identity
                  </div>
                  <Form.Item
                    name="name"
                    label="Sub-Department name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. Talent Acquisition" />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code (auto-generated)"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="Auto-generated from name" />
                  </Form.Item>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Building2 size={11} /> Parent Context
                  </div>
                  <Form.Item
                    name="parentDepartmentId"
                    label="Parent department"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select
                      placeholder="Select parent department"
                      loading={departmentsLoading}
                      showSearch
                      optionFilterProp="label"
                      options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    />
                  </Form.Item>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Settings size={11} /> Operations
                  </div>
                  <div className="orgx-toggle-row">
                    <div className="orgx-toggle-row__text">
                      <div className="orgx-toggle-row__title">Active status</div>
                      <div className="orgx-toggle-row__sub">
                        Enable or disable this organizational branch.
                      </div>
                    </div>
                    <Form.Item name="isActive" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Description (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Define the core responsibilities of this unit…"
                      maxLength={240}
                      showCount
                    />
                  </Form.Item>
                </div>
              </Form>
            </div>
          </Drawer>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
