"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Segmented,
  Button,
  Divider,
  Table,
  Space,
  Input,
  Tag,
  Avatar,
  Tooltip,
  Form,
  Row,
  Col,
  Select,
  Modal,
  notification,
  InputNumber,
  DatePicker,
  Tabs,
  Popconfirm,
  Switch,
  Checkbox,
  Drawer,
} from "antd";
import {
  Settings2,
  Plus,
  Search,
  User,
  Trash2,
  Maximize2,
  Edit2,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  AlertCircle,
  Clock
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { MembersService } from "@/services/membersService";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import dayjs from "dayjs";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import {
  useLeaveAdjustments,
  LeaveAdjustmentViewData,
} from "@/hooks/useLeaveAdjustments";
import { LeaveAdjustmentPayload } from "@/services/leaveAdjustmentService";
import {
  LeaveBalanceService,
  LeaveBalance,
} from "@/services/leaveBalanceService";
const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color, background: `${color}12`, padding: 12, borderRadius: 12 }}><Icon size={24} /></div>
    </div>
  </Card>
);

export default function LeaveAdjustmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: authLoading, user } = useAuth();
  const {
    canManageLeaves,
    canReadLeaveAdjustment,
    canCreateLeaveAdjustment,
    canUpdateLeaveAdjustment,
    canDeleteLeaveAdjustment,
  } = usePermission();
  const hasAccess = canManageLeaves || canReadLeaveAdjustment;
  const [form] = Form.useForm();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [modal, modalContextHolder] = Modal.useModal();
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [approvers, setApprovers] = useState<
    { label: string; value: string }[]
  >([]);
  const [employeeList, setEmployeeList] = useState<
    { label: string; value: string }[]
  >([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const hasApprovalRights =
    (user as any)?.role === "super_admin" ||
    (user as any)?.role === "admin";

  const {
    dataSource,
    loading,
    addAdjustment,
    updateAdjustment,
    deleteAdjustment,
  } = useLeaveAdjustments();
  const {
    leaveTypes: apiLeaveTypes,
    loading: leaveTypesLoading,
    fetchLeaveTypes,
  } = useLeaveTypes();

  // Watch for form value changes in the modal to fetch balances reactively
  const employeeId = Form.useWatch("employee", form);
  const leaveTypeId = Form.useWatch("leaveTypeId", form);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, employeesData] = await Promise.all([
          MembersService.getMembersForSelect(),
          EmployeeOnboardingService.getAllEmployees(),
        ]);
        setApprovers(membersData);

        if (Array.isArray(employeesData)) {
          const formattedEmployees = employeesData.map((emp: any) => ({
            label: `${emp.firstName}---(${emp.employee_code})`,
            value: emp.id,
          }));

          setEmployeeList(formattedEmployees);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  // Handle protected routing
  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/dashboard');
    }
  }, [authLoading, hasAccess, router]);

  useEffect(() => {
    if (employeeId) {
      const fetchEmployeeBalances = async () => {
        try {
          const balances = await LeaveBalanceService.getLeaveBalances(employeeId);
          setLeaveBalances(balances);
        } catch (error) {
          console.error("Failed to fetch employee balances:", error);
          setLeaveBalances([]);
        }
      };
      fetchEmployeeBalances();
    } else {
      setLeaveBalances([]);
    }
  }, [employeeId]);

  useEffect(() => {
    if (leaveTypeId && leaveBalances.length > 0) {
      const relevantBalance = leaveBalances.find(
        (b) => b.leaveTypeId === leaveTypeId,
      );
      setBalance(relevantBalance?.balance ?? 0);
    } else {
      // Reset balance if no leave type is selected or no balances are loaded
      setBalance(null);
    }
  }, [leaveTypeId, leaveBalances]);

  // Show loading while auth is being checked
  if (authLoading) {
    return null;
  }

  // Don't render if no manage/read permission
  if (!hasAccess) {
    return null;
  }

  const handleSaveAdjustment = async (values: any) => {
    setConfirmLoading(true);

    try {
      const payload: LeaveAdjustmentPayload = {
        employeeId: values.employee,
        leaveTypeId: values.leaveTypeId,
        adjustmentType: values.type,
        amount: values.amount,
        unit: values.unit,
        reason: values.reason,
        approvedById: values.approvedBy,
        compOffWorkDate: values.compOffWorkDate
          ? values.compOffWorkDate.toISOString()
          : null,
        expiryDate: values.expiryDate
          ? values.expiryDate.toISOString()
          : null,
      };

      let success = false;

      if (editingKey) {
        success = await updateAdjustment(editingKey, payload);
      } else {
        success = await addAdjustment(payload);
      }

      if (success) {
        api.success({
          message: "Leave adjustment saved successfully",
        });

        setIsModalVisible(false);
        form.resetFields();
        setSelectedLeaveType(null);
        setEditingKey(null);
      }
    } catch (error: any) {
      api.error({
        message: "Adjustment Failed",
        description:
          error?.response?.data?.error ||
          "This leave is already debited.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleEdit = (record: LeaveAdjustmentViewData) => {
    setEditingKey(record.id);
    setSelectedLeaveType(record.leaveType);
    form.setFieldsValue({
      ...record,
      employee: record.employeeId,
      leaveTypeId: record.leaveTypeId,
      approvedBy: record.approvedById,
      unit: record.unit || "Days",
      compOffWorkDate: record.compOffWorkDate
        ? dayjs(record.compOffWorkDate)
        : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Are you sure you want to delete this adjustment?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await deleteAdjustment(id);
      },
    });
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
      width: 280,
      sorter: (a: LeaveAdjustmentViewData, b: LeaveAdjustmentViewData) =>
        a.employee.localeCompare(b.employee),
      render: (text: string) => (
        <Space size={12}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--bg-slate-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-slate-400)",
            fontSize: 14,
            fontWeight: 600
          }}>
            {text.charAt(0)}
          </div>
          <Text strong style={{ color: "var(--text-slate-900)" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      key: "leaveType",
      width: 140,
      render: (text: string) => <Tag style={{ borderRadius: 6, background: "var(--bg-slate-50)", border: "1px solid var(--border-slate-100)", color: "var(--text-slate-500)" }}>{text}</Tag>
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => (
        <Tag
          style={{ borderRadius: 8, margin: 0, fontWeight: 600, padding: "2px 10px" }}
          color={type === "Credit" ? "success" : "error"}
        >
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 160,
      render: (amount: number, record: LeaveAdjustmentViewData) => {
        const unit = record.unit || "Days";
        const displayUnit = amount === 1 ? unit.slice(0, -1) : unit;
        return (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            color: record.type === "Credit" ? "#10b981" : "#ef4444"
          }}>
            {record.type === "Credit" ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
            {amount} {displayUnit}
          </div>
        );
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      width: 320,

      key: "reason",
      ellipsis: {
        showTitle: false,
      },
      render: (reason: string) => (
        <Tooltip placement="topLeft" title={reason}>
          {reason}
        </Tooltip>
      ),
    },
    {
      title: "Approved By",
      dataIndex: "approvedBy",
      key: "approvedBy",
      width: 180,
      render: (text: string) => (
        <Space size={10}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--bg-blue-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--premium-blue)",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border-slate-100)"
          }}>
            {text[0]}
          </div>
          <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: LeaveAdjustmentViewData) => (
        <Space>
          {(canManageLeaves || canUpdateLeaveAdjustment) && (
            <Tooltip title="Edit Adjustment">
              <Button
                type="text"
                size="small"
                icon={<Edit2 size={16} color="#64748b" />}
                style={{ borderRadius: 6 }}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {(canManageLeaves || canDeleteLeaveAdjustment) && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete Adjustment?"
                description="Are you sure you want to delete this correction?"
                onConfirm={() => deleteAdjustment(record.id)}
                okText="Delete"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={16} />}
                  style={{ borderRadius: 6 }}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-secondary)",
          minHeight: "calc(100vh - 64px)"
        }}>
          {contextHolder}
          {modalContextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Space size={14} align="center">
                <div style={{ background: "var(--bg-blue-50)", padding: 12, borderRadius: 14, color: "var(--premium-blue)", display: "flex" }}>
                  <History size={28} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Leave Adjustments</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Handle special cases, comp-offs, and manual leave corrections.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                placeholder="Search adjustments..."
                prefix={<Search size={16} color="var(--text-slate-400)" />}
                style={{ width: 280, borderRadius: 12, height: 44, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)", color: "var(--text-slate-900)" }}
                onChange={e => setSearchText(e.target.value)}
              />
              {(canManageLeaves || canCreateLeaveAdjustment) && (
                <Button
                  type="primary"
                  size="large"
                  icon={<Plus size={18} />}
                  style={{ borderRadius: 12, height: 44, padding: "0 24px", fontWeight: 600, background: "var(--premium-blue)" }}
                  onClick={() => {
                    setEditingKey(null);
                    form.resetFields();
                    setIsModalVisible(true);
                  }}
                >
                  New Adjustment
                </Button>
              )}
            </div>
          </div>

          {/* Metrics */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}>
              <StatCard label="Total Adjustments" value={dataSource.length} icon={History} color="#3b82f6" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Monthly Credits" value={dataSource.filter(i => i.type === "Credit").length} icon={ArrowUpCircle} color="#10b981" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Monthly Debits" value={dataSource.filter(i => i.type === "Debit").length} icon={ArrowDownCircle} color="#ef4444" />
            </Col>
          </Row>

          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              border: "1px solid var(--border-slate-100)",
              background: "var(--bg-pure-white)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              overflow: "hidden"
            }}
            bodyStyle={{ padding: "0" }}
          >
            <Table
              columns={columns}
              dataSource={dataSource.filter((item) =>
                item.employee.toLowerCase().includes(searchText.toLowerCase()),
              )}
              loading={loading}
              size="middle"
              pagination={{
                pageSize: 10,
                position: ["bottomRight"],
                style: { padding: "12px 24px", margin: 0 }
              }}
              rowClassName={() => "history-table-row"}
            />
          </Card>


          <Drawer
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)" }}>
                  <Clock size={20} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 18, color: "var(--text-slate-900)", display: "block" }}>
                    {editingKey ? "Edit Adjustment" : "New Leave Adjustment"}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>
                    {editingKey ? "Modify existing leave correction" : "Create a manual leave credit or debit"}
                  </Text>
                </div>
              </div>
            }
            open={isModalVisible}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedLeaveType(null);
              setEditingKey(null);
              form.resetFields();
            }}
            width={480}
            destroyOnClose
            headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
            bodyStyle={{ background: "var(--bg-pure-white)" }}
            footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "10px 0" }}>
                {editingKey && (
                  <Button
                    danger
                    onClick={() => handleDelete(editingKey)}
                    loading={confirmLoading}
                    style={{ marginRight: "auto" }}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    setSelectedLeaveType(null);
                    setEditingKey(null);
                    form.resetFields();
                  }}
                  disabled={confirmLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  loading={confirmLoading}
                >
                  {editingKey ? "Update Adjustment" : "Save Adjustment"}
                </Button>
              </div>
            }
          >
            <Form form={form} layout="vertical" onFinish={handleSaveAdjustment} requiredMark="optional">
              <Row gutter={[16, 0]}>
                <Col span={24}>
                  <Form.Item
                    name="employee"
                    label="Employee"
                    rules={[{ required: true, message: "Employee is required" }]}
                  >
                    <Select
                      placeholder="Select Employee"
                      showSearch
                      size="large"
                      options={employeeList}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="leaveTypeId" label="Leave Type" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select leave type"
                      loading={leaveTypesLoading}
                      showSearch
                      size="large"
                      onChange={(value) => {
                        const selected = apiLeaveTypes?.find(lt => lt.id === value);
                        setSelectedLeaveType(selected?.name || null);
                        form.setFieldsValue({ unit: selected?.name === "Permission" ? "Hours" : "Days" });
                      }}
                      options={apiLeaveTypes?.map(l => ({ label: l.name, value: l.id }))}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="type" label="Adjustment Type" rules={[{ required: true }]}>
                    <Select placeholder="Select Type" size="large">
                      <Select.Option value="Credit">Credit</Select.Option>
                      <Select.Option value="Debit" disabled={balance === null || balance <= 0}>Debit</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Amount & Unit" required>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item name="amount" noStyle rules={[{ required: true }]}>
                        <InputNumber min={0.5} step={0.5} style={{ width: "65%" }} size="large" placeholder="Value" />
                      </Form.Item>
                      <Form.Item name="unit" noStyle initialValue="Days">
                        <Select size="large" style={{ width: "35%" }} options={[{ label: "Days", value: "Days" }, { label: "Hours", value: "Hours" }]} />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="approvedBy" label="Approved By" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select Approver"
                      showSearch
                      size="large"
                      options={approvers}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>

                {selectedLeaveType === "Comp-Off" && (
                  <Col span={24}>
                    <Form.Item name="compOffWorkDate" label="Work Date for Comp-Off" rules={[{ required: true }]}>
                      <DatePicker size="large" style={{ width: "100%" }} placeholder="Select date worked" />
                    </Form.Item>
                  </Col>
                )}

                <Col span={24}>
                  <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                    <Input.TextArea rows={3} placeholder="Enter reason for adjustment" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="isTaken" valuePropName="checked" initialValue={false}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-slate-50)", borderRadius: 8 }}>
                      <span style={{ fontWeight: 500, color: "var(--text-slate-500)" }}>Is Leave Already Taken?</span>
                      <Switch />
                    </div>
                  </Form.Item>
                </Col>

                {selectedLeaveType === "Comp-Off" && (
                  <Col span={24}>
                    <Form.Item name="expiryDate" label="Expiry Date">
                      <DatePicker size="large" style={{ width: "100%" }} placeholder="Select expiry date" />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Form>
          </Drawer>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          .history-table-row:hover {
            background-color: var(--bg-slate-50) !important;
          }
          .ant-table-thead > tr > th {
            background-color: var(--bg-slate-50) !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
            padding: 12px 16px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .ant-table-tbody > tr > td {
            padding: 12px 16px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            color: var(--text-slate-900) !important;
          }
          .ant-drawer-header {
            padding: 24px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .ant-drawer-body {
            padding: 24px !important;
          }
          .ant-drawer-footer {
            padding: 16px 24px !important;
            border-top: 1px solid var(--border-slate-100) !important;
          }
          .ant-pagination-item a { color: var(--text-slate-500) !important; }
          .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
