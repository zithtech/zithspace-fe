"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, Typography, Button, Space, Input, Table, Tag, Form, Select, Row, Col, Divider, notification, Spin, Tooltip, Switch, Drawer } from "antd";
import { Building2, Edit, Plus, Search, Filter, Layers, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { MembersService } from "@/services/membersService";
import { useDepartments } from "@/hooks/useDepartments";
import { Department } from "@/services/departmentService";

const { Text } = Typography;

export default function DepartmentsPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg, canManageOrg } = usePermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [submitting, setSubmitting] = useState(false);

  const { employmentTypes, loading: employmentTypesLoading } = useEmploymentTypes();
  const { departments, loading, createDepartment, updateDepartment } = useDepartments();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setMembers(data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrg, router]);

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
            <Spin size="large" tip="Loading Department Data..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrg) return null;

  const totalDepartments = departments.length;
  const activeDepartments = departments.filter((d) => d.isActive).length;
  const inactiveDepartments = totalDepartments - activeDepartments;

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';
    return name.trim().toUpperCase().replace(/\s+/g, '_');
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Department) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      departmentName: record.name,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = {
        code: formValues.code,
        name: formValues.departmentName,
        employmentType: formValues.employmentType,
        headId: formValues.headId,
        description: formValues.description,
        isActive: formValues.isActive,
      };

      setSubmitting(true);
      let success = false;
      if (editingKey) {
        success = await updateDepartment(editingKey, payload);
      } else {
        success = await createDepartment(payload);
      }
      
      if (success) {
        setIsModalOpen(false);
        api.success({
          message: `Department ${editingKey ? "Updated" : "Added"}`,
          description: `The department "${payload.name}" has been successfully saved.`,
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
    return departments.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.employmentType || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchText, statusFilter]);

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
      title: "Department Identity",
      key: "identity",
      width: "30%",
      onHeaderCell: () => ({
        style: { paddingLeft: 24 }
      }),
      onCell: () => ({
        style: { paddingLeft: 24 }
      }),
      render: (_: any, record: Department) => (
        <Space size={12}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, background: "rgba(22, 119, 255, 0.08)", color: "#1677ff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14
          }}>
            {record.code?.substring(0, 2) || "DP"}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>CODE: {record.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Employment Context",
      dataIndex: "employmentType",
      key: "employmentType",
      render: (type: string) => (
        <Tag style={{ borderRadius: 6, fontWeight: 500, background: "#f1f5f9", border: 0, color: "#475569" }}>
          {type || "NOT ASSIGNED"}
        </Tag>
      ),
    },
    {
      title: "Unit Leadership",
      dataIndex: "head",
      key: "head",
      render: (head: any) => (
        <Space size={8}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#475569" }}>
            {head?.name?.charAt(0) || "U"}
          </div>
          <Text style={{ fontSize: 13, color: "#1e293b" }}>{head?.name || "No Head Assigned"}</Text>
        </Space>
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
      width: 100,
      render: (_: any, record: Department) => {
        if (!canManageOrg) return null;
        return (
          <Tooltip title="Edit Department">
            <Button
              type="text"
              icon={<Edit size={18} style={{ color: "#64748b" }} />}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
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
                  <Building2 size={24} />
                </div>
                <div>
                  <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Departments</Typography.Title>
                  <Text style={{ color: "#64748b", fontSize: 15 }}>Manage organizational units, reporting lines, and strategic divisions.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Select
                placeholder="Status"
                allowClear
                prefix={<Filter size={14} style={{ marginRight: 4 }} />}
                style={{ width: 140, height: 44 }}
                onChange={(value) => setStatusFilter(value)}
                dropdownStyle={{ borderRadius: 10 }}
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
              <Input 
                placeholder="Search departments..." 
                prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                style={{ width: 240, borderRadius: 10, height: 44 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {canManageOrg && (
                <Button 
                  type="primary" size="large" icon={<Plus size={18} />} 
                  style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                  onClick={handleAdd}
                >
                  New Unit
                </Button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}><StatCard label="Total Departments" value={totalDepartments} icon={Layers} color="#3b82f6" /></Col>
            <Col xs={24} sm={8}><StatCard label="Active Units" value={activeDepartments} icon={ShieldCheck} color="#10b981" /></Col>
            <Col xs={24} sm={8}><StatCard label="Inactive Units" value={inactiveDepartments} icon={User} color="#f59e0b" /></Col>
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
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{editingKey ? "Edit Department" : "Create New Unit"}</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>Configure organizational structure and leadership</div>
              </div>
            </Space>
          }
          width={480}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
              <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
              <Button 
                type="primary" loading={submitting} onClick={handleSave} 
                style={{ borderRadius: 8, height: 40, padding: "0 24px", fontWeight: 600 }}
              >
                {editingKey ? "Update Unit" : "Create Unit"}
              </Button>
            </div>
          }
          className="config-drawer"
        >
          <Form form={form} layout="vertical" requiredMark={false} onValuesChange={(changed) => { if (changed.departmentName !== undefined && !editingKey) { form.setFieldsValue({ code: generateCodeFromName(changed.departmentName) }); } }}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Identity & Label</Text>
              <Form.Item name="departmentName" label={<Text strong style={{ fontSize: 13 }}>Department Name</Text>} rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="e.g. Research & Development" />
              </Form.Item>
              <Form.Item name="code" label={<Text strong style={{ fontSize: 13 }}>Identity Code</Text>} rules={[{ required: true }]}>
                <Input placeholder="e.g. RD_DEPT" />
              </Form.Item>
            </div>
            <Divider />
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Leadership & Context</Text>
              <Form.Item name="employmentType" label={<Text strong style={{ fontSize: 13 }}>Employment Context</Text>}>
                <Select placeholder="Select context" loading={employmentTypesLoading} allowClear>
                  {employmentTypes.filter(et => et.isActive).map(type => (
                    <Select.Option key={type.id} value={type.name}>{type.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="headId" label={<Text strong style={{ fontSize: 13 }}>Department Head</Text>}>
                <Select placeholder="Select leader" allowClear showSearch optionFilterProp="children">
                  {members.map(m => (
                    <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <Divider />
            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 20 }}>Operational Controls</Text>
              <Form.Item name="isActive" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Active Status</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Allow units and positions within this department.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>
              <Divider style={{ margin: "16px 0" }} />
              <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Internal Scope</Text>}>
                <Input.TextArea rows={4} placeholder="Define strategic objectives..." />
              </Form.Item>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{ __html: `
          .action-btn:hover { background: #f1f5f9 !important; color: #1677ff !important; }
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