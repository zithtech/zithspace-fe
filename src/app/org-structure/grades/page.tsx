"use client";

import React, { useMemo, useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Button, Table, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Row, Col, Switch, notification, Tooltip, Divider, Spin, Drawer } from "antd";
import { ShieldCheck, Edit, Plus, Search, Layers, User } from "lucide-react";
import { useGrades, GradeViewData } from "@/hooks/useGrades";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

const { Text } = Typography;

export default function GradesPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg, canManageOrg } = usePermission();
  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrg, router]);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  const { dataSource, loading, addGrade, updateGrade } = useGrades();

  const totalGrades = dataSource.length;
  const activeGrades = dataSource.filter((g) => g.status === "Active").length;
  const inactiveGrades = totalGrades - activeGrades;

  const filteredData = useMemo(() => {
    if (!search.trim()) return dataSource;
    const q = search.toLowerCase();
    return dataSource.filter((r) =>
      [
        r.code,
        r.codes,
        r.name,
        String(r.levelOrder),
        r.description || "",
        r.status,
      ]
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

    // Always return non-padded numeric suffix (e.g., G1, G2, ...)
    return `${prefix}${maxNum + 1}`;
  };
  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") {
      return "";
    }
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
    setIsModalOpen(true);
  };

  const handleEdit = (record: GradeViewData) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      ...record,
      status: record.isActive, // Map boolean for Switch
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();

      // Client-side check for duplicate code to provide instant feedback
      const isDuplicateCode = dataSource.some(
        (g) =>
          g.code.toLowerCase() === formValues.code.toLowerCase() &&
          g.key !== editingKey,
      );

      if (isDuplicateCode) {
        message.error(
          "A grade with this code already exists. Please use a different code.",
        );
        return; // Stop submission
      }

      const isDuplicateName = dataSource.some(
        (g) =>
          g.name.toLowerCase() === formValues.name.trim().toLowerCase() &&
          g.key !== editingKey,
      );

      if (isDuplicateName) {
        message.error("This grade name already exists.");
        return;
      }

      const values = {
        name: formValues.name,
        code: formValues.code,
        codes: formValues.codes,
        levelOrder: formValues.levelOrder,
        description: formValues.description,
        isActive: !!formValues.status, // Convert Switch value to boolean
      };

      setSubmitting(true);
      let success = false;
      if (editingKey) {
        success = await updateGrade(editingKey, values);
      } else {
        success = await addGrade(values);
      }
      setSubmitting(false);

      if (success) {
        setIsModalOpen(false);
        api.success({
          message: editingKey ? "Grade Updated" : "Grade Added",
          description: `Grade "${values.name}" successfully ${editingKey ? "updated" : "added"}.`,
          placement: "topRight",
          duration: 1,
        });
      }
    } catch (error) {
      // Validation failed
      setSubmitting(false);
    }
  };

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadOrg) {
    return null;
  }


  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card 
      bodyStyle={{ padding: "16px 20px" }} 
      style={{ 
        borderRadius: 12, 
        border: "1px solid #f1f5f9", 
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      }}
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
      title: "Grade Identity",
      key: "identity",
      width: "30%",
      onHeaderCell: () => ({
        style: { paddingLeft: 24 }
      }),
      onCell: () => ({
        style: { paddingLeft: 24 }
      }),
      render: (_: any, record: GradeViewData) => (
        <Space size={12}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: "rgba(22, 119, 255, 0.08)", 
            color: "#1677ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14
          }}>
            {record.code}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.codes}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Hierarchy Level",
      dataIndex: "levelOrder",
      key: "levelOrder",
      align: "center" as const,
      width: 150,
      render: (level: number) => (
        <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
          Level {level}
        </Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: {
        showTitle: false,
      },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {description || "No description provided"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag
          style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          color={status === "Active" ? "success" : "default"}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, record: GradeViewData) => {
        if (!canManageOrg) return null;
        return (
          <Space size={4}>
            <Tooltip title="Edit Grade">
              <Button
                type="text"
                icon={<Edit size={18} style={{ color: "#64748b" }} />}
                onClick={() => handleEdit(record)}
                className="action-btn"
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  if (authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
            <Spin size="large" tip="Loading Organization Data..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrg) {
    return null;
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ 
          margin: "0 -24px", 
          padding: "24px 32px", 
          background: "#ffffff", 
          minHeight: "calc(100vh - 64px)" 
        }}>
          {contextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{ 
                  background: "rgba(22, 119, 255, 0.08)", 
                  padding: 10, 
                  borderRadius: 12, 
                  color: "#1677ff",
                  display: "flex"
                }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Grades Management</Typography.Title>
                  <Text style={{ color: "#64748b", fontSize: 15 }}>Define and manage organization grade hierarchy and levels.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input 
                placeholder="Search grades..." 
                prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                style={{ width: 280, borderRadius: 10, height: 44 }}
                onChange={(e) => setSearch(e.target.value)}
              />
              {canManageOrg && (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<Plus size={18} />} 
                  style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                  onClick={handleAdd}
                >
                  New Grade
                </Button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}>
              <StatCard 
                label="Total Grades" 
                value={totalGrades} 
                icon={Layers} 
                color="#3b82f6" 
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard 
                label="Active Status" 
                value={activeGrades} 
                icon={ShieldCheck} 
                color="#10b981" 
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard 
                label="Inactive Grades" 
                value={inactiveGrades} 
                icon={User} 
                color="#f59e0b" 
              />
            </Col>
          </Row>

          {/* Table Card */}
          <Card 
            bodyStyle={{ padding: 0 }} 
            style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
          >
            <Table
              rowKey="key"
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
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                  {editingKey ? "Edit Grade Level" : "Create New Grade"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>
                  Configure hierarchy rules and grade identity
                </div>
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
                type="primary" 
                loading={submitting} 
                onClick={handleSave} 
                style={{ borderRadius: 8, height: 40, padding: "0 24px", fontWeight: 600 }}
              >
                {editingKey ? "Update Grade" : "Create Grade"}
              </Button>
            </div>
          }
          className="config-drawer"
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Identity & Label</Text>
              
              <Form.Item
                name="name"
                label={<Text strong style={{ fontSize: 13 }}>Grade Name</Text>}
                rules={[{ required: true, message: "Please enter grade name" }]}
              >
                <Input 
                  placeholder="e.g. Senior Manager" 
                  onChange={(e) => {
                    if (!editingKey) {
                      const codes = generateCodeFromName(e.target.value);
                      form.setFieldsValue({ codes });
                    }
                  }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label={<Text strong style={{ fontSize: 13 }}>Reference Code</Text>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. G1" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="codes"
                    label={<Text strong style={{ fontSize: 13 }}>ID Slug</Text>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. SENIOR_MANAGER" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 16 }}>Hierarchy Position</Text>
              <Form.Item
                name="levelOrder"
                label={<Text strong style={{ fontSize: 13 }}>Level Sequence Order</Text>}
                rules={[{ required: true, message: "Required" }]}
                extra="Higher numbers represent higher levels in the organization."
              >
                <InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
              </Form.Item>
            </div>

            <Divider />

            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <Text strong style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 20 }}>Operations & Visibility</Text>
              
              <Form.Item name="status" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Active Status</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Grading is visible and assignable to positions.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Internal Description</Text>}>
                <Input.TextArea rows={3} placeholder="Add specific roles or criteria for this grade..." />
              </Form.Item>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{ __html: `
          .action-btn:hover {
            background: #f1f5f9 !important;
            color: #1677ff !important;
          }
          .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #64748b !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
          }
          .ant-table-row:hover > td {
            background: #f8fafc !important;
          }
          .config-drawer .ant-drawer-header {
            border-bottom: 1px solid #f1f5f9 !important;
            padding: 24px !important;
          }
          .config-drawer .ant-drawer-footer {
            border-top: 1px solid #f1f5f9 !important;
            padding: 16px 24px !important;
          }
          .ant-input:focus, .ant-input-focused, .ant-input-number:focus, .ant-input-number-focused {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
