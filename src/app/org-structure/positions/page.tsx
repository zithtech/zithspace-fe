"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Typography,
  Button,
  Input,
  Table,
  Form,
  Select,
  Row,
  Col,
  notification,
  Spin,
  Tooltip,
  Switch,
  Drawer,
  Popconfirm,
} from "antd";
import {
  Trophy,
  Edit,
  Plus,
  Search,
  Layers,
  ShieldCheck,
  User,
  Trash2,
  X,
  Tag as TagIcon,
  Settings,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useDepartments } from "@/hooks/useDepartments";
import { useGrades } from "@/hooks/useGrades";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions, PositionViewData } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgStatCard, OrgMiniBar } from "@/components/org-structure/OrgPageWidgets";

const { Text } = Typography;

export default function PositionsPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const {
    canReadOrgPosition,
    canCreateOrgPosition,
    canUpdateOrgPosition,
    canDeleteOrgPosition,
  } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [subDepartmentFilter, setSubDepartmentFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [submitting, setSubmitting] = useState(false);

  const { departments, loading: departmentsLoading } = useDepartments();
  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
  const {
    dataSource: positions,
    loading,
    createPosition,
    updatePosition,
    deletePosition,
  } = usePositions();

  useEffect(() => {
    if (!authLoading && !canReadOrgPosition) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgPosition, router]);

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin size="large" tip="Loading Positions..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrgPosition) return null;

  const validPositions = Array.isArray(positions) ? positions : [];
  const totalPositions = validPositions.length;
  const activePositions = validPositions.filter((p) => p.isActive).length;
  const inactivePositions = totalPositions - activePositions;
  const uniqueDepts = new Set(validPositions.map((p) => p.departmentId).filter(Boolean)).size;
  const uniqueGrades = new Set(validPositions.map((p) => p.gradeId).filter(Boolean)).size;

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: PositionViewData) => {
    setEditingKey(record.id);
    form.setFieldsValue({ ...record, status: record.isActive });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deletePosition(id);
    if (success) {
      api.success({
        message: "Position Removed",
        description: "The position has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
    }
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = { ...formValues, isActive: formValues.status };
      setSubmitting(true);
      const success = editingKey
        ? await updatePosition(editingKey, payload)
        : await createPosition(payload);
      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: `Position ${editingKey ? "Updated" : "Created"}`,
          description: `The role "${payload.title}" has been successfully saved.`,
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
    return validPositions.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.title?.toLowerCase()?.includes(q) ||
        item.code?.toLowerCase()?.includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesGrade = !gradeFilter || item.gradeId === gradeFilter;
      const matchesDepartment = !departmentFilter || item.departmentId === departmentFilter;
      const matchesSubDepartment =
        !subDepartmentFilter || item.subDepartmentId === subDepartmentFilter;
      return matchesSearch && matchesStatus && matchesGrade && matchesDepartment && matchesSubDepartment;
    });
  }, [validPositions, searchText, statusFilter, gradeFilter, departmentFilter, subDepartmentFilter]);

  const columns = [
    {
      title: "Position",
      key: "identity",
      width: "30%",
      render: (_: any, record: PositionViewData) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "PS"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.title}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Context",
      key: "context",
      render: (_: any, record: PositionViewData) => (
        <div className="orgx-row-context">
          <span className="orgx-row-context__main">{record.departmentName || "General"}</span>
          {record.subDepartmentName && (
            <span className="orgx-row-context__sub">{record.subDepartmentName}</span>
          )}
        </div>
      ),
    },
    {
      title: "Grade",
      dataIndex: "gradeName",
      key: "gradeName",
      render: (grade: string) => (
        <span className={`orgx-row-soft-tag${!grade ? " is-muted" : ""}`}>{grade || "Not assigned"}</span>
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
      render: (_: any, record: PositionViewData) => (
        <div className="orgx-row-actions">
          {canUpdateOrgPosition && (
            <Tooltip title="Edit Position">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgPosition && (
            <Popconfirm
              title="Remove position?"
              description="This will permanently delete this role."
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

  const hasAdvancedFilter = !!gradeFilter || !!departmentFilter || !!subDepartmentFilter;

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div className="orgx-shell">
          <TimeTrackingHeader
            icon={<Trophy size={20} color="#3b82f6" />}
            title="Positions"
            description="Define and manage organization roles, grade assignments, and designations."
            style={{
              borderBottom: "1px solid var(--border-slate-200)",
              padding: "8.5px 32px",
              marginBottom: 20,
            }}
            extra={
              canCreateOrgPosition && (
                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  onClick={handleAdd}
                  className="orgx-primary-btn"
                >
                  New Position
                </Button>
              )
            }
          />

          <div className="orgx-content">
            <div className="orgx-stat-grid">
              <OrgStatCard
                label="Total Positions"
                value={totalPositions}
                icon={<Layers size={14} />}
                accent="#3b82f6"
                subtle="Defined roles"
                loading={loading && totalPositions === 0}
                chart={
                  totalPositions > 0 ? (
                    <OrgMiniBar
                      segments={[
                        { value: activePositions, color: "#10b981", label: `${activePositions} active` },
                        { value: inactivePositions, color: "#94a3b8", label: `${inactivePositions} inactive` },
                      ]}
                    />
                  ) : null
                }
              />
              <OrgStatCard
                label="Active"
                value={activePositions}
                icon={<ShieldCheck size={14} />}
                accent="#10b981"
                subtle={
                  totalPositions > 0
                    ? `${Math.round((activePositions / totalPositions) * 100)}% open for hiring`
                    : "No positions yet"
                }
                loading={loading && totalPositions === 0}
              />
              <OrgStatCard
                label="Departments"
                value={uniqueDepts}
                icon={<Building2 size={14} />}
                accent="#8b5cf6"
                subtle="With assigned roles"
                loading={loading && totalPositions === 0}
              />
              <OrgStatCard
                label="Grade Levels"
                value={uniqueGrades}
                icon={<User size={14} />}
                accent="#f59e0b"
                subtle="Distinct levels in use"
                loading={loading && totalPositions === 0}
              />
            </div>

            <div className="orgx-panel">
              <div className="orgx-toolbar">
                <Input
                  className="orgx-search"
                  prefix={<Search size={14} color="var(--text-slate-400)" style={{ marginRight: 4 }} />}
                  placeholder="Search by title or code…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <Select
                  className="orgx-select"
                  placeholder="All statuses"
                  allowClear
                  style={{ minWidth: 140 }}
                  value={statusFilter || undefined}
                  onChange={(v) => setStatusFilter(v || null)}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
                <Select
                  className="orgx-select"
                  placeholder="All grades"
                  allowClear
                  style={{ minWidth: 160 }}
                  loading={gradesLoading}
                  value={gradeFilter || undefined}
                  onChange={(v) => setGradeFilter(v || null)}
                  options={grades?.map((g: any) => ({ value: g.key, label: g.name }))}
                />
                <Select
                  className="orgx-select"
                  placeholder="All departments"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ minWidth: 180 }}
                  loading={departmentsLoading}
                  value={departmentFilter || undefined}
                  onChange={(v) => {
                    setDepartmentFilter(v || null);
                    setSubDepartmentFilter(null);
                  }}
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                />
                <Select
                  className="orgx-select"
                  placeholder="All sub-depts"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ minWidth: 180 }}
                  loading={subDepartmentsLoading}
                  value={subDepartmentFilter || undefined}
                  onChange={(v) => setSubDepartmentFilter(v || null)}
                  options={subDepartments
                    .filter((sd) => !departmentFilter || sd.parentDepartmentId === departmentFilter)
                    .map((sd) => ({ value: sd.id, label: sd.name }))}
                />
                {hasAdvancedFilter && (
                  <Button
                    className="orgx-clear-btn"
                    onClick={() => {
                      setGradeFilter(null);
                      setDepartmentFilter(null);
                      setSubDepartmentFilter(null);
                    }}
                  >
                    Reset
                  </Button>
                )}
                <div className="orgx-toolbar__divider" />
                <Text className="orgx-count-text">
                  <strong>{filteredData.length}</strong> of {totalPositions}
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
              />
            </div>
          </div>

          {/* Drawer */}
          <Drawer
            className="orgx-drawer"
            width={560}
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
                  {editingKey ? "Save Changes" : "Create Position"}
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
                <Trophy size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Position</div>
                <div className="orgx-drawer__hero-title">
                  {editingKey ? "Edit Position" : "New Position"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Configure a role with its grade and department classification.
                </div>
              </div>
            </div>

            <div className="orgx-drawer__body">
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={(changed) => {
                  if (changed.title !== undefined && !editingKey) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.title) });
                  }
                }}
              >
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <TagIcon size={11} /> Identity
                  </div>
                  <Row gutter={12}>
                    <Col span={15}>
                      <Form.Item
                        name="title"
                        label="Position title"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input placeholder="e.g. Senior Software Engineer" />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item
                        name="code"
                        label="Code"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input placeholder="Auto-generated" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Building2 size={11} /> Classification
                  </div>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="gradeId"
                        label="Grade"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select
                          placeholder="Select grade"
                          loading={gradesLoading}
                          showSearch
                          optionFilterProp="label"
                          options={grades.map((g: any) => ({ value: g.key, label: g.name }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="departmentId"
                        label="Department"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select
                          placeholder="Select department"
                          loading={departmentsLoading}
                          showSearch
                          optionFilterProp="label"
                          options={departments.map((d) => ({ value: d.id, label: d.name }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="subDepartmentId" label="Sub-department (optional)">
                    <Select
                      placeholder="Select sub-department"
                      loading={subDepartmentsLoading}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={subDepartments.map((sd) => ({ value: sd.id, label: sd.name }))}
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
                        Enable this position for recruitment and assignment.
                      </div>
                    </div>
                    <Form.Item name="status" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Role description (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Define the core responsibilities…"
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
