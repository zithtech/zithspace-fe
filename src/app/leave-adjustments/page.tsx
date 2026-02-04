"use client";

import React, { useState, useEffect } from "react";
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
} from "@ant-design/icons";
import { Settings2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { MembersService } from "@/services/membersService";
import dayjs from "dayjs";
import { useLeaveAdjustments, LeaveAdjustmentViewData } from "@/hooks/useLeaveAdjustments";
import { LeaveAdjustmentPayload } from "@/services/leaveAdjustmentService";
const { Text } = Typography;
const { Title } = Typography;
const leaveTypesData = [
  {
    name: "Casual Leave",
    description: "Leave taken for personal reasons or short-term needs.",
  },
  {
    name: "Sick Leave",
    description: "Leave taken when an employee is ill or unwell.",
  },
  {
    name: "Earned Leave",
    description: "Leave accumulated over time based on work tenure.",
  },
  {
    name: "Paid Leave",
    description: "Leave where salary is fully paid during absence.",
  },
  {
    name: "Unpaid Leave",
    description: "Leave taken without salary payment.",
  },
  {
    name: "Loss of Pay",
    description:
      "Leave resulting in salary deduction due to insufficient balance.",
  },
  {
    name: "Comp-Off",
    description: "Leave granted for working on holidays or weekends.",
  },
  {
    name: "Permission",
    description: "Short-duration leave taken for a few hours.",
  },
  {
    name: "On Duty",
    description:
      "Marked when employee is working outside office for official work.",
  },
  {
    name: "Emergency Leave",
    description: "Leave taken due to urgent or unexpected situations.",
  },
  {
    name: "Medical Leave",
    description: "Extended leave taken for medical treatment or recovery.",
  },
  {
    name: "Festival Holiday",
    description: "Holiday granted for religious or cultural festivals.",
  },
  {
    name: "Weekly Off",
    description: "Regular weekly holiday such as Sunday or scheduled off day.",
  },
  {
    name: "Marriage Leave",
    description: "Leave granted for employee’s marriage.",
  },
  {
    name: "Bereavement Leave",
    description: "Leave taken due to death of a close family member.",
  },

  // Office / Corporate (IT + Non-IT)
  {
    name: "Work From Home",
    description: "Employee works remotely instead of office.",
  },
  {
    name: "Optional Holiday",
    description: "Employee can choose to take this holiday optionally.",
  },
  {
    name: "Floating Holiday",
    description: "Flexible holiday chosen by the employee.",
  },
  {
    name: "Privilege Leave",
    description: "Long-term leave granted as per company policy.",
  },
  {
    name: "Annual Leave",
    description: "Yearly leave entitlement for employees.",
  },
  {
    id: 21,
    name: "Training Leave",
    description: "Leave taken to attend training or skill programs.",
  },
  {
    name: "Sabbatical Leave",
    description: "Extended leave for personal or professional development.",
  },

  // Hospital / Healthcare
  {
    name: "Night Shift Off",
    description: "Off granted after night shift duty.",
  },
  {
    name: "Quarantine Leave",
    description: "Leave during isolation due to contagious illness.",
  },
  {
    name: "Accident Leave",
    description: "Leave taken due to injury or accident.",
  },
  {
    name: "Duty Roster Leave",
    description: "Leave based on duty roster schedule.",
  },
  {
    name: "Emergency Duty Off",
    description: "Off given after emergency duty hours.",
  },
  {
    name: "Maternity Leave",
    description: "Leave granted to female employees during childbirth.",
  },
  {
    name: "Paternity Leave",
    description: "Leave granted to male employees after childbirth.",
  },

  // Factory / Manufacturing
  {
    name: "Shift Leave",
    description: "Leave taken due to shift schedule changes.",
  },
  {
    name: "Production Shutdown Leave",
    description: "Leave during factory or production shutdown.",
  },
  {
    name: "Compensatory Leave",
    description: "Leave given in return for extra working hours.",
  },
  {
    name: "Special Leave",
    description: "Leave granted for special circumstances.",
  },
  {
    name: "Layoff Leave",
    description: "Leave during temporary workforce layoff.",
  },
  {
    name: "Menstrual Leave",
    description:
      "Menstrual Leave is a paid leave granted to eligible female employees to address health and wellness needs during their menstrual cycle. This leave is provided in accordance with company policy and may require prior approval.",
  },
  {
    name: "Sandwich Leave",
    description:
      "Sandwich Leave is applied when an employee takes leave before and after a holiday or weekend, causing the intervening non-working days to be counted as leave, as per company policy.",
  },
];

export default function LeaveAdjustmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [modal, modalContextHolder] = Modal.useModal();
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [employees, setEmployees] = useState<{ label: string; value: string }[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const {
    dataSource,
    loading,
    addAdjustment,
    updateAdjustment,
    deleteAdjustment,
  } = useLeaveAdjustments();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setEmployees(data);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleSaveAdjustment = async (values: any) => {
    setConfirmLoading(true);
    try {
      const payload: LeaveAdjustmentPayload = {
        userId: values.employee,
        leaveType: values.leaveType,
        adjustmentType: values.type,
        amount: values.amount,
        unit: values.unit,
        reason: values.reason,
        approvedById: values.approvedBy,
        compOffWorkDate: values.compOffWorkDate
          ? values.compOffWorkDate.toISOString()
          : null,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      };

      let success = false;
      if (editingKey) {
        success = await updateAdjustment(editingKey, payload);
      } else {
        success = await addAdjustment(payload);
      }

      if (success) {
        setIsModalVisible(false);
        form.resetFields();
        setSelectedLeaveType(null);
        setEditingKey(null);
      }
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
      sorter: (a: LeaveAdjustmentViewData, b: LeaveAdjustmentViewData) =>
        a.employee.localeCompare(b.employee),
      render: (text: string) => (
        <Space>
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
      render: (text: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
            {text[0]}
          </Avatar>
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: LeaveAdjustmentViewData) => (
        <Space>
          <Tooltip title="Edit Leave Adjustment">
            <Button
              type="text"
              icon={<Settings2 size={16} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Leave Adjustment">
            <Popconfirm
              title="Are you sure you want to delete?"
              onConfirm={() => deleteAdjustment(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          {contextHolder}
          {modalContextHolder}
          <div >
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
                        : pathname.includes("position-configuration")
                          ? "positions"
                          : "leaves"
              }
              onChange={(key) => {
                if (key === "dashboard") router.push("/leaves-dashboard");
                if (key === "leaves") router.push("/leaves");
                if (key === "holidays") router.push("/government-holidays");
                if (key === "adjustments") router.push("/leave-adjustments");
                if (key === "configuration")
                  router.push("/leave-configuration");
                if (key === "positions") router.push("/position-configuration");
                if (key === "addLeaves") router.push("/add-goverment-leaves");
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
                {
                  key: "leaves",
                  label: (
                    <span>
                      <ClockCircleOutlined /> Apply Leave
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
                      <SettingOutlined /> Leave Configuration
                    </span>
                  ),
                },
                {
                  key: "positions",
                  label: (
                    <span>
                      <ApartmentOutlined /> Position Configuration
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
              ]}
            />
          </div>
          <Card>
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
                  <Typography.Title level={4} style={{ margin: 0 }}>
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
    style={{ width: 180,height: 30}}
    onClick={() => setIsModalVisible(true)}
  >
    + Add New Adjustment
  </Button>

</div>


            </div>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag style={{ borderRadius: 12 }}>
                Total Adjustments: {dataSource.length}
              </Tag>
              <Tag color="success" style={{ borderRadius: 12 }}>
                Credits: {dataSource.filter((item) => item.type === "Credit").length}
              </Tag>
              <Tag color="error" style={{ borderRadius: 12 }}>
                Debits: {dataSource.filter((item) => item.type === "Debit").length}
              </Tag>
            </Space>
            <Table
              columns={columns}
              dataSource={dataSource.filter((item) =>
                item.employee.toLowerCase().includes(searchText.toLowerCase()),
              )}
              loading={loading}
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </Card>

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
                      options={employees}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>

                {/* Leave Type & Adjustment Type */}
                <Col span={12}>
                  <Form.Item
                    name="leaveType"
                    label="Leave Type"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select leave type"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={(value) => {
                        setSelectedLeaveType(value);
                        if (value === "Permission") {
                          form.setFieldsValue({ unit: "Hours" });
                        } else {
                          form.setFieldsValue({ unit: "Days" });
                        }
                      }}
                      options={leaveTypesData.map((l) => ({
                        label: l.name,
                        value: l.name,
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
                    <Select
                      placeholder="Credit / Debit"
                      options={[
                        { label: "Credit (Add)", value: "Credit" },
                        { label: "Debit (Deduct)", value: "Debit" },
                      ]}
                    />
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
                      options={employees}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
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
                <div style={{ display: "flex", gap: 12, marginLeft: 'auto' }}>
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
                <Button type="primary" htmlType="submit" loading={confirmLoading}>
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
