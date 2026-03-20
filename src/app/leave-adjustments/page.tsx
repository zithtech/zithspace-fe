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
} from "antd";
import {
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
  SettingOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  PlusOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { Settings2 } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import {
  LeaveBalanceService,
  LeaveBalance,
} from "@/services/leaveBalanceService";
const { Text } = Typography;
const { Title } = Typography;

export default function LeaveAdjustmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const { canManageLeaves } = usePermission();
  const [form] = Form.useForm();

  // Protect route - requires leave.manage permission
  useEffect(() => {
    if (!authLoading && !canManageLeaves) {
      router.push('/dashboard');
    }
  }, [authLoading, canManageLeaves, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return null;
  }

  // Don't render if no manage permission
  if (!canManageLeaves) {
    return null;
  }
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
    const { user } = useAuth();
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
      width:300,
      sorter: (a: LeaveAdjustmentViewData, b: LeaveAdjustmentViewData) =>
        a.employee.localeCompare(b.employee),
      render: (text: string) => (
        <Space style={{gap:15}}>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#e6f0f7ff", color: "#0769b5ff" }}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      key: "leaveType",
       width:150,
    },
    {
      title: " Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag
          style={{ borderRadius: 12 }}
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
      render: (amount: number, record: LeaveAdjustmentViewData) => {
        const unit = record.unit || "Days";
        const displayUnit = amount === 1 ? unit.slice(0, -1) : unit;
        return (
          <Text type={record.type === "Credit" ? "success" : "danger"}>
            {record.type === "Credit" ? "+" : "-"}
            {amount} {displayUnit}
          </Text>
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
     width: 150,
      render: (text: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
            {text[0]}
          </Avatar>
          <Text>{text}</Text>
        </Space>
      ),
    },
    // {
    //   title: "Actions",
    //   key: "actions",
    //   render: (_: any, record: LeaveAdjustmentViewData) => (
    //     <Space>
    //       <Tooltip title="Edit Leave Adjustment">
    //         <Button
    //           type="text"
    //           icon={<Settings2 size={16} />}
    //           onClick={() => handleEdit(record)}
    //         />
    //       </Tooltip>
    //       <Tooltip title="Delete Leave Adjustment">
    //         <Popconfirm
    //           title="Are you sure you want to delete this leave  Adjustments ?"
    //           onConfirm={() => deleteAdjustment(record.id)}
    //           okText="Yes"
    //           cancelText="No"
    //         >
    //           <Button danger> Cancel</Button>
    //         </Popconfirm>
    //       </Tooltip>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div >
          {contextHolder}
          {modalContextHolder}
          <div>
            <Tabs
              activeKey={
                pathname.includes("leave-adjustments")
                  ? "adjustments"
                  : pathname.includes("leaves-dashboard")
                    ? "dashboard"
                    : pathname.includes("government-holidays")
                      ? "holidays"
                      : pathname.includes("leave-configuration")
                        ? "configuration"
                        : pathname.includes("leave-policy")
                          ? "positions"
                          : "leaves"
              }
              onChange={(key) => {
                if (key === "dashboard") router.push("/leaves-dashboard");
                // if (key === "leaves") router.push("/leaves");
                if (key === "holidays") router.push("/government-holidays");
                if (key === "adjustments") router.push("/leave-adjustments");
                if (key === "configuration")
                  router.push("/leave-type");
                if (key === "positions") router.push("/leave-policy");
                if (key === "addLeaves") router.push("/add-goverment-leaves");
                if (key === "apply-leave") router.push("/apply-leave");
                if (key === "approvals") router.push("/leave-approvals")
              }}
              items={[
                {
                  key: "dashboard",
                  label: (
                    <span>
                      <AppstoreOutlined /> Dashboard
                    </span>
                  ),
                },
                // {
                //   key: "leaves",
                //   label: (
                //     <span>
                //       <ClockCircleOutlined /> Apply Leave
                //     </span>
                //   ),
                // },
                {
                  key: "apply-leave",
                  label: (
                    <span>
                      <PlusOutlined /> Apply leave
                    </span>
                  ),
                },
                 hasApprovalRights && {
                                  key: "approvals",
                                  label: (
                                    <span>
                                      <CheckCircleOutlined /> Approvals
                                    </span>
                                  ),
                                },
                {
                  key: "holidays",
                  label: (
                    <span>
                      <ScheduleOutlined /> Government Holidays
                    </span>
                  ),
                },
                {
                  key: "adjustments",
                  label: (
                    <span>
                      <EditOutlined /> Leave Adjustment
                    </span>
                  ),
                },
                {
                  key: "configuration",
                  label: (
                    <span>
                      <SettingOutlined /> Leave Type
                    </span>
                  ),
                },
                {
                  key: "positions",
                  label: (
                    <span>
                      <ApartmentOutlined /> Leave Policy
                    </span>
                  ),
                },
                {
                  key: "addLeaves",
                  label: (
                    <span>
                      <PlusOutlined /> Add Government Leaves
                    </span>
                  ),
                },
              ].filter(Boolean) as any}
            />
          </div>
          
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <Space align="center" size={8}>
                  <ScheduleOutlined
                     style={{ color: "#1a64c4ff", fontSize: 20 }}
                  />
                  <Typography.Title  level={4} >
                    Leave Adjustments
                  </Typography.Title>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Handle special employee-specific leave cases, comp-offs, and
                    manual corrections.
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Input.Search
                  placeholder="Search adjustments...."
                  allowClear
                  style={{ width: 390 }}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                <Button
                  type="primary"
                  style={{ width: 180, height: 30 }}
                  onClick={() => setIsModalVisible(true)}
                >
                  + Add New Adjustment
                </Button>
              </div>
            </div>
            <Space wrap>
              <Tag style={{ borderRadius: 12 }}>
                Total Adjustments: {dataSource.length}
              </Tag>
              <Tag color="success" style={{ borderRadius: 12 }}>
                Credits:{" "}
                {dataSource.filter((item) => item.type === "Credit").length}
              </Tag>
              <Tag color="error" style={{ borderRadius: 12 }}>
                Debits:{" "}
                {dataSource.filter((item) => item.type === "Debit").length}
              </Tag>
            </Space>
            <Divider style={{marginTop:20}} />
            <Table
              columns={columns}
              dataSource={dataSource.filter((item) =>
                item.employee.toLowerCase().includes(searchText.toLowerCase()),
              )}
              loading={loading}
              size="small"
              pagination={{ pageSize: 10 }}
            />
        

          <Modal
            title={
              <div>
                <Typography.Title level={4} style={{ marginBottom: 0 }}>
                  {editingKey
                    ? "Edit Leave Adjustment"
                    : "New Leave Adjustment"}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Record a leave credit, debit, or comp-off for an employee.
                </Typography.Text>
              </div>
            }
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              setSelectedLeaveType(null);
              setEditingKey(null);
              form.resetFields();
            }}
            footer={null}
            width={420}
            // height={100}
            destroyOnClose
          >
            <Form form={form} layout="vertical" onFinish={handleSaveAdjustment}>
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {/* Employee */}
                <Col span={24}>
                  <Form.Item
                    name="employee"
                    label="Employee"
                    rules={[
                      { required: true, message: "Employee is required" },
                    ]}
                  >
                    <Select
                      placeholder="Select Employee"
                      showSearch
                      options={employeeList}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>

                {/* Leave Type & Adjustment Type */}
                <Col span={12}>
                  <Form.Item
                    name="leaveTypeId"
                    label="Leave Type"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select leave type"
                      loading={leaveTypesLoading}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(value) => {
                        const selected = apiLeaveTypes?.find(
                          (lt) => lt.id === value,
                        );
                        setSelectedLeaveType(selected?.name || null);
                        if (selected?.name === "Permission") {
                          form.setFieldsValue({ unit: "Hours" });
                        } else {
                          form.setFieldsValue({ unit: "Days" });
                        }
                      }}
                      options={apiLeaveTypes?.map((l) => ({
                        label: l.name,
                        value: l.id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Adjustment Type"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select Type">
                      <Select.Option value="Credit">Credit</Select.Option>
                      <Select.Option
                        value="Debit"
                        disabled={balance === null || balance <= 0}
                      >
                        Debit
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                {/* Amount & Approved By */}
                <Col span={12}>
                  <Form.Item label="Amount" required>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item
                        name="amount"
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          min={0}
                          style={{ width: "60%" }}
                          placeholder="Value"
                        />
                      </Form.Item>

                      <Form.Item name="unit" noStyle initialValue="Days">
                        <Select
                          style={{ width: "50%" }}
                          options={[
                            { label: "Day", value: "Days" },
                            { label: "Hours", value: "Hours" },
                          ]}
                        />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="approvedBy"
                    label="Approved By"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select Approver"
                      showSearch
                      options={approvers}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>

                {selectedLeaveType === "Comp-Off" && (
                  <Col span={24}>
                    <Form.Item
                      name="compOffWorkDate"
                      label="Work Date for Comp-Off"
                      rules={[
                        {
                          required: true,
                          message: "Please select the work date",
                        },
                      ]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        placeholder="Select date worked"
                      />
                    </Form.Item>
                  </Col>
                )}

                {/* Reason */}
                <Col span={24}>
                  <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Enter reason for adjustment"
                    />
                  </Form.Item>
                </Col>

               <Col span={12}>
  <Form.Item
    name="isTaken"
    valuePropName="checked"
    initialValue={false}
    style={{ marginBottom: 0 }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",   // 👈 important
      }}
    >
      <span style={{ fontWeight: 500 }}>
        Is Leave Taken?
      </span>

      <Switch style={{left:200}}/>
    </div>
  </Form.Item>
</Col>

                {/* Expiry Date */}
                {selectedLeaveType === "Comp-Off" && (
                  <Col span={12}>
                    <Form.Item name="expiryDate" label="Expiry Date">
                      <DatePicker
                        style={{ width: "210%" }}
                        placeholder="Select expiry date"
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                {editingKey && (
                  <Button
                    danger
                    onClick={() => handleDelete(editingKey)}
                    loading={confirmLoading}
                  >
                    Delete
                  </Button>
                )}
                <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
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
                    htmlType="submit"
                    loading={confirmLoading}
                  >
                    {editingKey ? "Update Adjustment" : "Save Adjustment"}
                  </Button>
                </div>
              </div>
            </Form>
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
