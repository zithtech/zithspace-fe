"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { 
  Settings2, 
  Briefcase, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Drawer,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  InputNumber,
  Divider,
  ConfigProvider,
  AutoComplete,
  Avatar
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";

const { TextArea } = Input;
const { Text, Title } = Typography;

const leaveTypesData = [
  { name: "Sick Leave", code: "SL", description: "Leave granted when an employee is ill or needs medical attention." },
  { name: "Casual Leave", code: "CL", description: "Short-term leave taken for personal reasons or emergencies." },
  { name: "Earned Leave", code: "EL", description: "Leave accumulated over time based on work tenure." },
  { name: "Paid Leave", code: "PL", description: "Leave where salary is fully paid during absence." },
  { name: "Unpaid Leave", code: "UL", description: "Leave taken without salary payment." },
  { name: "Comp-Off", code: "CO", description: "Leave granted for working on holidays or weekends." },
  { name: "Maternity Leave", code: "ML", description: "Leave granted to female employees during childbirth." },
  { name: "Paternity Leave", code: "PTL", description: "Leave granted to male employees after childbirth." },
  { name: "Work From Home", code: "WFH", description: "Employee works remotely instead of office." },
  { name: "Sabbatical Leave", code: "SBL", description: "Extended leave for personal or professional development." },
  { name: "Emergency Leave", code: "EGL", description: "Leave for urgent, unforeseen circumstances." },
];

interface LeaveTypeRecord {
  key: string;
  name: string;
  code: string;
  description: string;
  type: string;
  paid: boolean;
  approval: string;
  status: string;
  days?: number;
  hours?: number;
}

export default function LeaveTypePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<LeaveTypeRecord[]>([]);
  const [searchText, setSearchText] = useState("");
  const [leaveUnit, setLeaveUnit] = useState("Days");
  const [isSaving, setIsSaving] = useState(false);

  const {
    leaveTypes: apiLeaveTypes,
    loading,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  } = useLeaveTypes();

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  useEffect(() => {
    if (apiLeaveTypes) {
      const mappedData = apiLeaveTypes.map((lt) => ({
        key: lt.id,
        name: lt.name,
        code: lt.code,
        description: lt.description || "",
        type: lt.type,
        paid: lt.isPaid,
        approval: lt.requiresApproval ? "Required" : "Auto",
        status: lt.isActive ? "Active" : "Inactive",
        days: lt.days ?? undefined,
        hours: lt.hours ?? undefined,
      }));
      setDataSource(mappedData);
    }
  }, [apiLeaveTypes]);

  const columns = [
    {
      title: "Leave Policy",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text: string, record: LeaveTypeRecord) => (
        <Space size={12}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: "#f0f9ff", 
            color: "#0369a1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14
          }}>
            {record.code}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description.length > 50 ? record.description.substring(0, 50) + "..." : record.description}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (record: LeaveTypeRecord) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
            {record.type}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.type === "Days" ? `${record.days || 1} Day Unit` : "Hourly Basis"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Structure",
      key: "structure",
      render: (record: LeaveTypeRecord) => (
        <Space size={16}>
          <Tooltip title={record.paid ? "Fully Paid" : "Unpaid"}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {record.paid ? <CheckCircle2 size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
              <Text style={{ fontSize: 13, color: "#475569" }}>{record.paid ? "Paid" : "Unpaid"}</Text>
            </div>
          </Tooltip>
          <Tooltip title={record.approval === "Required" ? "Approval Needed" : "Auto Approved"}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} color={record.approval === "Required" ? "#f59e0b" : "#64748b"} />
              <Text style={{ fontSize: 13, color: "#475569" }}>{record.approval}</Text>
            </div>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
      render: (_: unknown, record: LeaveTypeRecord) => (
        <Space size={4}>
          <Tooltip title="Edit Rules">
            <Button
              type="text"
              icon={<Settings2 size={18} style={{ color: "#64748b" }} />}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="Delete Policy">
            <Popconfirm
              title="Delete this leave policy?"
              description="This will affect current balances and historical records."
              onConfirm={() => handleDelete(record.key)}
              okButtonProps={{ loading: deletingKey === record.key, danger: true }}
              cancelButtonProps={{ disabled: deletingKey === record.key }}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button 
                danger 
                type="text" 
                icon={<DeleteOutlined style={{ fontSize: 18 }} />} 
                className="action-btn-danger"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: LeaveTypeRecord) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      type: record.type,
      paid: record.paid,
      approval: record.approval === "Required",
      status: record.status === "Active",
      days: record.days,
      hours: record.hours,
    });
    setLeaveUnit(record.type);
    setIsDrawerVisible(true);
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      await deleteLeaveType(key);
      api.success({
        message: "Policy Removed",
        description: "Leave type has been successfully deleted.",
        placement: "topRight",
      });
    } catch (e: any) {
      api.error({
        message: "Action Failed",
        description: e.message || "Could not delete policy.",
        placement: "topRight",
      });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSaveLeaveType = async (values: any) => {
    const payload = {
      name: values.name,
      code: values.code,
      description: values.description,
      type: values.type as "Days" | "Hours",
      isPaid: values.paid,
      requiresApproval: values.approval,
      isActive: values.status,
      days: values.type === "Days" ? (values.days || 1) : null,
      hours: values.type === "Hours" ? (values.hours || 0.5) : null,
    };

    setIsSaving(true);
    try {
      if (editingKey) {
        await updateLeaveType(editingKey, payload);
        api.success({
          message: `${values.name} Updated`,
          description: "Policy configuration saved successfully.",
          placement: "topRight",
        });
      } else {
        await createLeaveType(payload);
        api.success({
          message: `${values.name} Created`,
          description: "New leave policy added to the system.",
          placement: "topRight",
        });
      }
      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
    } catch (e: any) {
      api.error({
        message: "Sync Failed",
        description: e.message || "An error occurred while saving.",
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                  background: "#eff6ff", 
                  padding: 10, 
                  borderRadius: 12, 
                  color: "#2563eb",
                  display: "flex"
                }}>
                  <Briefcase size={24} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Leave Types</Title>
                  <Text style={{ color: "#64748b", fontSize: 15 }}>Define and manage leave types, accrual rules, and approval workflows.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input 
                placeholder="Search policies..." 
                prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                style={{ width: 280, borderRadius: 10, height: 44 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button 
                type="primary" 
                size="large" 
                icon={<Plus size={18} />} 
                style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                onClick={() => {
                  setEditingKey(null);
                  form.resetFields();
                  setIsDrawerVisible(true);
                }}
              >
                New Leave Type
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}>
              <StatCard 
                label="Total Policy Types" 
                value={dataSource.length} 
                icon={Zap} 
                color="#3b82f6" 
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard 
                label="Active Policies" 
                value={dataSource.filter(d => d.status === "Active").length} 
                icon={CheckCircle2} 
                color="#10b981" 
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard 
                label="Requires Approval" 
                value={dataSource.filter(d => d.approval === "Required").length} 
                icon={AlertCircle} 
                color="#f59e0b" 
              />
            </Col>
          </Row>

          {/* Table Card */}
          <Card 
            bodyStyle={{ padding: 0 }} 
            style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden" }}
          >
            <Table
              columns={columns}
              dataSource={dataSource.filter(
                (item) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                  item.code.toLowerCase().includes(searchText.toLowerCase()),
              )}
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
              <div style={{ background: "#eff6ff", padding: 8, borderRadius: 10, color: "#2563eb", display: "flex" }}>
                <Settings2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                  {editingKey ? "Edit Policy" : "Create New Policy"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>
                  Configure rules and accrual frequency
                </div>
              </div>
            </Space>
          }
          width={480}
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
              <Button onClick={() => setIsDrawerVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
              <Button 
                type="primary" 
                loading={isSaving} 
                onClick={() => form.submit()} 
                style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
              >
                Save Configuration
              </Button>
            </div>
          }
          className="config-drawer"
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLeaveType} requiredMark={false}>
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, color: "#334155" }}>Basic Information</Title>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="name"
                    label={<Text strong style={{ fontSize: 13 }}>Policy Name</Text>}
                    rules={[{ required: true, message: "Required" }]}
                    getValueFromEvent={(e) => e.target.value.replace(/[^a-zA-Z\s]/g, "")}
                  >
                    <AutoComplete
                      placeholder="e.g. Sick Leave"
                      options={leaveTypesData.map(l => ({ 
                        label: (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text>{l.name}</Text>
                            <Tag style={{ margin: 0, fontSize: 10 }}>{l.code}</Tag>
                          </div>
                        ), 
                        value: l.name 
                      }))}
                      onChange={(value) => {
                        const selected = leaveTypesData.find(l => l.name === value);
                        const initials = value
                          .split(/\s+/)
                          .map((word: string) => word.charAt(0))
                          .join("")
                          .toUpperCase();
                        
                        if (selected) {
                          form.setFieldsValue({ 
                            description: selected.description,
                            code: selected.code || initials
                          });
                        } else {
                          form.setFieldsValue({ code: initials });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="code"
                    label={<Text strong style={{ fontSize: 13 }}>Code</Text>}
                    rules={[{ required: true, message: "Required" }]}
                    getValueFromEvent={(e) => e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()}
                  >
                    <Input placeholder="e.g. SL" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="description"
                label={<Text strong style={{ fontSize: 13 }}>Description</Text>}
              >
                <TextArea rows={3} placeholder="Provide details about this leave type..." />
              </Form.Item>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, color: "#334155" }}>Accrual & Units</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="type" label="Measurement Unit" initialValue="Days">
                    <Select onChange={setLeaveUnit}>
                      <Select.Option value="Days">Days</Select.Option>
                      <Select.Option value="Hours">Hours</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {leaveUnit === "Days" ? (
                    <Form.Item name="days" label="Default Increment" initialValue={1}>
                      <InputNumber style={{ width: "100%" }} min={1} />
                    </Form.Item>
                  ) : (
                    <Form.Item name="hours" label="Default Increment" initialValue={0.5}>
                      <InputNumber style={{ width: "100%" }} min={0.5} step={0.5} />
                    </Form.Item>
                  )}
                </Col>
              </Row>
            </div>

            <Divider />

            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <Title level={5} style={{ marginBottom: 20, fontSize: 14, color: "#334155" }}>Policy Controls</Title>
              
              <Form.Item name="paid" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Paid Salary</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Employee salary is not deducted during this leave.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              <Form.Item name="approval" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Requires Approval</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Manager or Admin review is mandatory.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              <Form.Item name="status" valuePropName="checked" initialValue={true}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>Active Policy</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Allow employees to apply for this leave.</Text>
                  </div>
                  <Switch />
                </div>
              </Form.Item>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{ __html: `
          .action-btn:hover {
            background: #f1f5f9 !important;
            color: #2563eb !important;
          }
          .action-btn-danger:hover {
            background: #fff1f2 !important;
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
          .ant-input:focus, .ant-input-focused {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
          .config-drawer .ant-drawer-header {
            border-bottom: 1px solid #f1f5f9 !important;
            padding: 24px !important;
          }
          .config-drawer .ant-drawer-footer {
            border-top: 1px solid #f1f5f9 !important;
            padding: 16px 24px !important;
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
