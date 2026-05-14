"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, Typography, Button, Space, Input, Table, Tag, Form, Select, Row, Col, Divider, notification, Spin, Tooltip, Switch, Drawer, Popconfirm } from "antd";
import { Trophy, Edit, Plus, Search, Filter, Layers, ShieldCheck, User, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useDepartments } from "@/hooks/useDepartments";
import { useGrades } from "@/hooks/useGrades";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions, PositionViewData } from "@/hooks/usePositions";

const { Text } = Typography;

export default function PositionsPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { 
    canReadOrgPosition, 
    canCreateOrgPosition, 
    canUpdateOrgPosition, 
    canDeleteOrgPosition 
  } = usePermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
            <Spin size="large" tip="Loading Position Data..." />
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

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';
    return name.trim().toUpperCase().replace(/\s+/g, '_');
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record: PositionViewData) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      status: record.isActive,
    });
    setIsModalOpen(true);
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
      const payload = {
        ...formValues,
        isActive: formValues.status,
      };
      setSubmitting(true);
      let success = false;
      if (editingKey) {
        success = await updatePosition(editingKey, payload);
      } else {
        success = await createPosition(payload);
      }
      
      if (success) {
        setIsModalOpen(false);
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
      const matchesSubDepartment = !subDepartmentFilter || item.subDepartmentId === subDepartmentFilter;
      
      return matchesSearch && matchesStatus && matchesGrade && matchesDepartment && matchesSubDepartment;
    });
  }, [positions, searchText, statusFilter, gradeFilter, departmentFilter, subDepartmentFilter]);

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card 
      bodyStyle={{ padding: "16px 20px" }} 
      style={{ borderRadius: 12, border: "1px solid #f1f5f9", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );

  const columns = [
    {
      title: "Position Identity",
      key: "identity",
      width: "30%",
      onHeaderCell: () => ({
        style: { paddingLeft: 24 }
      }),
      onCell: () => ({
        style: { paddingLeft: 24 }
      }),
      render: (_: any, record: PositionViewData) => (
        <Space size={12}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, background: "rgba(22, 119, 255, 0.08)", color: "#1677ff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14
          }}>
            {record.code?.substring(0, 2) || "PS"}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{record.title}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>CODE: {record.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Organization Context",
      key: "context",
      render: (_: any, record: PositionViewData) => (
        <div>
          <Text style={{ display: "block", fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{record.departmentName || "General"}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.subDepartmentName || "—"}</Text>
        </div>
      ),
    },
    {
      title: "Grade Level",
      dataIndex: "gradeName",
      key: "gradeName",
      render: (grade: string) => (
        <Tag style={{ borderRadius: 6, fontWeight: 500, background: "#f1f5f9", border: 0, color: "#475569" }}>
          {grade || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <Tag style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }} color={isActive ? "success" : "default"}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 120,
      render: (_: any, record: PositionViewData) => {
        return (
          <Space size={8}>
            {canUpdateOrgPosition && (
              <Tooltip title="Edit Position">
                <Button
                  type="text"
                  icon={<Edit size={18} style={{ color: "#64748b" }} />}
                  onClick={() => handleEdit(record)}
                  className="action-btn"
                />
              </Tooltip>
            )}
            {canDeleteOrgPosition && (
              <Popconfirm
                title="Remove Position"
                description="Are you sure you want to delete this role?"
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  icon={<Trash2 size={18} />}
                  className="action-btn-danger"
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "#ffffff", minHeight: "calc(100vh - 64px)" }}>
          {contextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{ background: "rgba(22, 119, 255, 0.08)", padding: 10, borderRadius: 12, color: "#1677ff", display: "flex" }}>
                  <Trophy size={24} />
                </div>
                <div>
                  <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Positions</Typography.Title>
                  <Text style={{ color: "#64748b", fontSize: 15 }}>Define and manage organization roles, grade assignments, and designations.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Select
                placeholder="Status"
                allowClear
                prefix={<Filter size={14} style={{ marginRight: 4 }} />}
                style={{ width: 120, height: 44 }}
                onChange={(value) => setStatusFilter(value)}
                dropdownStyle={{ borderRadius: 10 }}
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
              <Select
                placeholder="Grade"
                allowClear
                style={{ width: 140, height: 44 }}
                onChange={(value) => setGradeFilter(value)}
                loading={gradesLoading}
                dropdownStyle={{ borderRadius: 10 }}
              >
                {grades?.map((g: any) => (
                  <Select.Option key={g.key} value={g.key}>{g.name}</Select.Option>
                ))}
              </Select>
              <Input 
                placeholder="Search positions..." 
                prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                style={{ width: 220, borderRadius: 10, height: 44 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {canCreateOrgPosition && (
                <Button 
                  type="primary" size="large" icon={<Plus size={18} />} 
                  style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                  onClick={handleAdd}
                >
                   Add Role
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
             <Select
                placeholder="Department"
                allowClear
                style={{ width: 200, height: 40 }}
                onChange={(value) => setDepartmentFilter(value)}
                loading={departmentsLoading}
                dropdownStyle={{ borderRadius: 10 }}
              >
                {departments.map((d) => (
                  <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                ))}
            </Select>
            <Select
                placeholder="Sub-Department"
                allowClear
                style={{ width: 200, height: 40 }}
                onChange={(value) => setSubDepartmentFilter(value)}
                loading={subDepartmentsLoading}
                dropdownStyle={{ borderRadius: 10 }}
              >
                {subDepartments
                  .filter((sd) => !departmentFilter || sd.parentDepartmentId === departmentFilter)
                  .map((sd) => (
                    <Select.Option key={sd.id} value={sd.id}>{sd.name}</Select.Option>
                  ))}
            </Select>
          </div>

          {/* Metrics Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}><StatCard label="Total Positions" value={totalPositions} icon={Layers} color="#3b82f6" /></Col>
            <Col xs={24} sm={8}><StatCard label="Active Roles" value={activePositions} icon={ShieldCheck} color="#10b981" /></Col>
            <Col xs={24} sm={8}><StatCard label="Inactive Roles" value={inactivePositions} icon={User} color="#f59e0b" /></Col>
          </Row>

          {/* Table Card */}
          <Card 
            bodyStyle={{ padding: 0 }} 
            style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              size="middle"
              pagination={{ pageSize: 12, position: ["bottomRight"] }}
            />
          </Card>
        </div>

        {/* Configuration Drawer */}
        <Drawer
          title={
            <Space size={12}>
              <div style={{ background: "rgba(22, 119, 255, 0.08)", padding: 8, borderRadius: 10, color: "#1677ff", display: "flex" }}>
                <Edit size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{editingKey ? "Edit Position" : "Create New Role"}</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>Configure role designations and grade assignments</div>
              </div>
            </Space>
          }
          width={520}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
              <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
              <Button 
                type="primary" loading={submitting} onClick={handleSave} 
                style={{ borderRadius: 8, height: 40, padding: "0 24px", fontWeight: 600 }}
              >
                {editingKey ? "Update Role" : "Create Role"}
              </Button>
            </div>
          }
          className="config-drawer"
        >
          <Form form={form} layout="vertical" requiredMark={false} onValuesChange={(changed) => { if (changed.title !== undefined && !editingKey) { form.setFieldsValue({ code: generateCodeFromName(changed.title) }); } }}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Identity & Label</Text>
              <Row gutter={16}>
                <Col span={14}>
                  <Form.Item name="title" label={<Text strong style={{ fontSize: 13 }}>Position Title</Text>} rules={[{ required: true, message: "Required" }]}>
                    <Input placeholder="e.g. Senior Software Engineer" />
                  </Form.Item>
                </Col>
                <Col span={10}>
                   <Form.Item name="code" label={<Text strong style={{ fontSize: 13 }}>Code</Text>} rules={[{ required: true }]}>
                    <Input placeholder="Auto-generated" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <Divider />
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Classification & Sorting</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="gradeId" label={<Text strong style={{ fontSize: 13 }}>Grade Assignment</Text>} rules={[{ required: true, message: "Required" }]}>
                    <Select placeholder="Select Grade" loading={gradesLoading} dropdownStyle={{ borderRadius: 8 }}>
                      {grades.map((g) => (
                        <Select.Option key={g.key} value={g.key}>{g.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                   <Form.Item name="departmentId" label={<Text strong style={{ fontSize: 13 }}>Primary Department</Text>} rules={[{ required: true, message: "Required" }]}>
                    <Select placeholder="Select Dept" loading={departmentsLoading} dropdownStyle={{ borderRadius: 8 }}>
                      {departments.map((d) => (
                        <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="subDepartmentId" label={<Text strong style={{ fontSize: 13 }}>Specialized Sub-Unit (Optional)</Text>}>
                <Select placeholder="Select Sub-Dept" loading={subDepartmentsLoading} allowClear dropdownStyle={{ borderRadius: 8 }}>
                  {subDepartments.map((sd) => (
                    <Select.Option key={sd.id} value={sd.id}>{sd.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <Divider />
            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 20 }}>Operational Controls</Text>
              <Form.Item name="status" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Display Status</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Enable this position for active recruitment and usage.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>
              <Divider style={{ margin: "16px 0" }} />
              <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Role description</Text>}>
                <Input.TextArea rows={4} placeholder="Briefly define the core responsibilities..." />
              </Form.Item>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{ __html: `
          .action-btn:hover { background: #f1f5f9 !important; color: #1677ff !important; }
          .action-btn-danger:hover { background: #fef2f2 !important; color: #ef4444 !important; }
          .ant-table-thead > tr > th {
            background: #f8fafc !important; color: #64748b !important; font-weight: 600 !important;
            text-transform: uppercase !important; font-size: 11px !important; letter-spacing: 0.05em !important;
          }
          .ant-table-row:hover > td { background: #f8fafc !important; }
          .config-drawer .ant-drawer-header { border-bottom: 1px solid #f1f5f9 !important; padding: 24px !important; }
          .config-drawer .ant-drawer-footer { border-top: 1px solid #f1f5f9 !important; padding: 16px 24px !important; }
          .ant-input:focus, .ant-input-focused, .ant-select:focus, .ant-select-focused { border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
