"use client";
import React, { useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Button, Space, Input, Table, Tag, Form, Switch, notification, Spin, Divider, Tooltip, Drawer, Row, Col } from "antd";
import { Briefcase, Edit, Plus, Search, Layers, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { EmploymentType } from "@/services/employmentTypeService";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

const { Text } = Typography;

export default function EmploymentTypesPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { 
    canReadOrgEmploymentType, 
    canCreateOrgEmploymentType, 
    canUpdateOrgEmploymentType 
  } = usePermission();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const {
    employmentTypes,
    loading,
    createEmploymentType,
    updateEmploymentType
  } = useEmploymentTypes();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadOrgEmploymentType) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrgEmploymentType, router]);

  const totalTypes = employmentTypes.length;
  const activeTypes = employmentTypes.filter(type => type.isActive).length;
  const inactiveTypes = totalTypes - activeTypes;

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

  const handleEdit = (record: EmploymentType) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      typeName: record.name,
    });
    setIsModalOpen(true);
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
      let success = false;
      if (editingKey) {
        success = await updateEmploymentType(editingKey, payload);
      } else {
        success = await createEmploymentType(payload);
      }
      
      if (success) {
        setIsModalOpen(false);
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
        item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q)
    );
  }, [employmentTypes, searchText]);

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
      title: "Type Identity",
      key: "identity",
      width: "30%",
      onHeaderCell: () => ({
        style: { paddingLeft: 24 }
      }),
      onCell: () => ({
        style: { paddingLeft: 24 }
      }),
      render: (_: any, record: EmploymentType) => (
        <Space size={12}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, background: "rgba(22, 119, 255, 0.08)", color: "#1677ff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14
          }}>
            {record.code?.substring(0, 2) || "ET"}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>CODE: {record.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <Text type="secondary" style={{ fontSize: 13 }}>{description || "No description provided"}</Text>
        </Tooltip>
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
      render: (_: any, record: EmploymentType) => {
        if (!canUpdateOrgEmploymentType) return null;
        return (
          <Tooltip title="Edit Type">
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

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
            <Spin size="large" tip="Loading Employment Data..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrgEmploymentType) return null;

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
                  <Briefcase size={24} />
                </div>
                <div>
                  <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Employment Types</Typography.Title>
                  <Text style={{ color: "#64748b", fontSize: 15 }}>Define and manage workforce contract types and employment structures.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input 
                placeholder="Search types..." 
                prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                style={{ width: 280, borderRadius: 10, height: 44 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {canCreateOrgEmploymentType && (
                <Button 
                  type="primary" size="large" icon={<Plus size={18} />} 
                  style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                  onClick={handleAdd}
                >
                  New Type
                </Button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}><StatCard label="Total Categories" value={totalTypes} icon={Layers} color="#3b82f6" /></Col>
            <Col xs={24} sm={8}><StatCard label="Active Status" value={activeTypes} icon={ShieldCheck} color="#10b981" /></Col>
            <Col xs={24} sm={8}><StatCard label="Inactive Types" value={inactiveTypes} icon={User} color="#f59e0b" /></Col>
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
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{editingKey ? "Edit Employment Type" : "Create New Type"}</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>Configure workforce contract and status rules</div>
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
                {editingKey ? "Update Type" : "Create Type"}
              </Button>
            </div>
          }
          className="config-drawer"
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Identity & Label</Text>
              <Form.Item
                name="typeName"
                label={<Text strong style={{ fontSize: 13 }}>Employment Type Name</Text>}
                rules={[{ required: true, message: "Please enter type name" }]}
              >
                <Input placeholder="e.g. Full-Time Regular" onChange={(e) => { if (!editingKey) { form.setFieldsValue({ code: generateCodeFromName(e.target.value) }); } }} />
              </Form.Item>
              <Form.Item name="code" label={<Text strong style={{ fontSize: 13 }}>Identity Code</Text>} rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="e.g. FULL_TIME" />
              </Form.Item>
            </div>

            <Divider />

            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 20 }}>Contract Controls</Text>
              <Form.Item name="isActive" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Active Status</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Allow using this type for new employee contracts.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>
              <Divider style={{ margin: "16px 0" }} />
              <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Internal Description</Text>}>
                <Input.TextArea rows={4} placeholder="Define requirements or details for this employment category..." />
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
          .ant-input:focus, .ant-input-focused { border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
