"use client";

import React, { useMemo, useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Typography,
  Button,
  Table,
  Input,
  Form,
  InputNumber,
  message,
  Row,
  Col,
  Switch,
  notification,
  Tooltip,
  Spin,
  Drawer,
  Popconfirm,
} from "antd";
import {
  ShieldCheck,
  Edit,
  Plus,
  Search,
  Layers,
  User,
  X,
  Tag as TagIcon,
  Hash,
  Settings,
  Trash2,
} from "lucide-react";
import { useGrades, GradeViewData } from "@/hooks/useGrades";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgStatCard, OrgMiniBar } from "@/components/org-structure/OrgPageWidgets";
import { useActivitySource } from "@/hooks/useActivitySource";

const { Text } = Typography;

export default function GradesPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureGrades" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrgGrade, canCreateOrgGrade, canUpdateOrgGrade, canDeleteOrgGrade } = usePermission();

  useEffect(() => {
    if (!authLoading && !canReadOrgGrade) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgGrade, router]);

  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  const { dataSource, loading, addGrade, updateGrade, deleteGrade } = useGrades();

  const totalGrades = dataSource.length;
  const activeGrades = dataSource.filter((g) => g.status === "Active").length;
  const inactiveGrades = totalGrades - activeGrades;
  const maxLevel = dataSource.reduce((m, g) => Math.max(m, g.levelOrder || 0), 0);

  const filteredData = useMemo(() => {
    if (!search.trim()) return dataSource;
    const q = search.toLowerCase();
    return dataSource.filter((r) =>
      [r.code, r.codes, r.name, String(r.levelOrder), r.description || "", r.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search, dataSource]);

  const generateNextCode = () => {
    let maxNum = 0;
    let prefix = "G";
    dataSource.forEach((g) => {
      const match = g.code.match(/^([^\d]*)(\d+)$/);
      if (match) {
        prefix = match[1] || "G";
        const num = parseInt(match[2], 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${maxNum + 1}`;
  };

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({
      code: generateNextCode(),
      status: true,
      levelOrder: dataSource.length + 1,
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: GradeViewData) => {
    setEditingKey(record.key);
    form.setFieldsValue({ ...record, status: record.isActive });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteGrade(id);
    if (success) {
      api.success({
        message: "Grade Removed",
        description: "The grade has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
    }
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();

      const isDuplicateCode = dataSource.some(
        (g) =>
          g.code.toLowerCase() === formValues.code.toLowerCase() && g.key !== editingKey,
      );
      if (isDuplicateCode) {
        message.error("A grade with this code already exists. Please use a different code.");
        return;
      }

      const isDuplicateName = dataSource.some(
        (g) =>
          g.name.toLowerCase() === formValues.name.trim().toLowerCase() && g.key !== editingKey,
      );
      if (isDuplicateName) {
        message.error("This grade name already exists.");
        return;
      }

      const values = {
        name: formValues.name,
        code: formValues.code,
        codes: formValues.codes,
        levelOrder: formValues.levelOrder ?? (editingKey ? (dataSource.find((g) => g.key === editingKey)?.levelOrder ?? 999) : (dataSource.length + 1)),
        description: formValues.description,
        isActive: !!formValues.status,
      };

      setSubmitting(true);
      const success = editingKey
        ? await updateGrade(editingKey, values)
        : await addGrade(values);
      setSubmitting(false);

      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: editingKey ? "Grade Updated" : "Grade Added",
          description: `Grade "${values.name}" successfully ${editingKey ? "updated" : "added"}.`,
          placement: "topRight",
          duration: 2,
        });
      }
    } catch (error) {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin size="large" tip="Loading Grades..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrgGrade) return null;

  const columns = [
    {
      title: "Grade",
      key: "identity",
      width: "30%",
      render: (_: any, record: GradeViewData) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.codes}</span>
          </div>
        </div>
      ),
    },
    /*
    {
      title: "Hierarchy Level",
      dataIndex: "levelOrder",
      key: "levelOrder",
      align: "center" as const,
      width: 160,
      render: (level: number) => (
        <span className="orgx-row-level">
          <Hash size={11} />
          Level {level}
        </span>
      ),
    },
    */
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: { showTitle: false },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <span className="orgx-row-desc">{description || "No description provided"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <span className={`orgx-status-pill ${status === "Active" ? "is-active" : "is-inactive"}`}>
          <span className="orgx-status-dot" />
          {status}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, record: GradeViewData) => (
        <div className="orgx-row-actions">
          {canUpdateOrgGrade && (
            <Tooltip title="Edit Grade">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgGrade && (
            <Popconfirm
              title="Remove grade?"
              description="This will permanently delete this grade level."
              onConfirm={() => handleDelete(record.key)}
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
            icon={<ShieldCheck size={20} color="#3b82f6" />}
            title="Grade Hierarchy"
            description="Define and manage organization grade levels and reporting tiers."
            style={{
              borderBottom: "1px solid var(--border-slate-200)",
              padding: "8.5px 32px",
              marginBottom: 20,
            }}
            extra={
              canCreateOrgGrade && (
                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  onClick={handleAdd}
                  className="orgx-primary-btn"
                >
                  New Grade
                </Button>
              )
            }
          />

          <div className="orgx-content">
            {/* Stats */}
            <div className="orgx-stat-grid">
              <OrgStatCard
                label="Total Grades"
                value={totalGrades}
                icon={<Layers size={14} />}
                accent="#3b82f6"
                subtle="Defined hierarchy levels"
                loading={loading && totalGrades === 0}
                chart={
                  totalGrades > 0 ? (
                    <OrgMiniBar
                      segments={[
                        { value: activeGrades, color: "#10b981", label: `${activeGrades} active` },
                        { value: inactiveGrades, color: "#94a3b8", label: `${inactiveGrades} inactive` },
                      ]}
                    />
                  ) : null
                }
              />
              <OrgStatCard
                label="Active Grades"
                value={activeGrades}
                icon={<ShieldCheck size={14} />}
                accent="#10b981"
                subtle={totalGrades > 0 ? `${Math.round((activeGrades / totalGrades) * 100)}% of all grades` : "No grades yet"}
                loading={loading && totalGrades === 0}
              />
              <OrgStatCard
                label="Inactive Grades"
                value={inactiveGrades}
                icon={<User size={14} />}
                accent="#f59e0b"
                subtle="Retired or paused"
                loading={loading && totalGrades === 0}
              />
              {/*
              <OrgStatCard
                label="Top Tier"
                value={`L${maxLevel}`}
                icon={<Hash size={14} />}
                accent="#8b5cf6"
                subtle="Highest level reached"
                loading={loading && totalGrades === 0}
              />
              */}
            </div>

            {/* Panel */}
            <div className="orgx-panel">
              <div className="orgx-toolbar">
                <Input
                  className="orgx-search"
                  prefix={<Search size={14} color="var(--text-slate-400)" style={{ marginRight: 4 }} />}
                  placeholder="Search by name, code, or level…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                />
                <div className="orgx-toolbar__divider" />
                <Text className="orgx-count-text">
                  <strong>{filteredData.length}</strong> of {totalGrades}
                </Text>
              </div>

              <Table
                className="orgx-table"
                rowKey="key"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                size="middle"
                pagination={{ pageSize: 12, position: ["bottomRight"] }}
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
                  {editingKey ? "Save Changes" : "Create Grade"}
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
                <ShieldCheck size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Grade Hierarchy</div>
                <div className="orgx-drawer__hero-title">
                  {editingKey ? "Edit Grade" : "New Grade Level"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Define a tier in the organization hierarchy with its code and order.
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
                    name="name"
                    label="Grade name"
                    rules={[{ required: true, message: "Please enter grade name" }]}
                  >
                    <Input
                      placeholder="e.g. Senior Manager"
                      onChange={(e) => {
                        if (!editingKey) {
                          form.setFieldsValue({ codes: generateCodeFromName(e.target.value) });
                        }
                      }}
                    />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="code"
                        label="Reference code"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input placeholder="e.g. G1" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="codes"
                        label="ID slug"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input placeholder="e.g. SENIOR_MANAGER" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/*
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Hash size={11} /> Hierarchy
                  </div>
                  <Form.Item
                    name="levelOrder"
                    label="Level order"
                    rules={[{ required: true, message: "Required" }]}
                    extra="Higher numbers represent higher levels in the organization."
                  >
                    <InputNumber min={1} placeholder="1" />
                  </Form.Item>
                </div>
                */}

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Settings size={11} /> Operations
                  </div>
                  <div className="orgx-toggle-row">
                    <div className="orgx-toggle-row__text">
                      <div className="orgx-toggle-row__title">Active status</div>
                      <div className="orgx-toggle-row__sub">
                        When active, this grade is assignable to positions.
                      </div>
                    </div>
                    <Form.Item name="status" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Description (optional)">
                    <Input.TextArea rows={3} placeholder="Roles or criteria for this grade…" maxLength={200} showCount />
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
