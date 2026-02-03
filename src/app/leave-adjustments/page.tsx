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

import dayjs from "dayjs";
const { Text } = Typography;
const { Title } = Typography;

interface LeaveAdjustment {
  key: string;
  employee: string;
  leaveType: string;
  type: string;
  amount: number;
  unit?: string;
  reason: string;
  approvedBy: string;
  compOffWorkDate?: string | null;
  expiryDate?: string | null;
}

export default function LeaveAdjustmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dataSource, setDataSource] = useState<LeaveAdjustment[]>([]);
  const [api, contextHolder] = notification.useNotification();
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        // Simulating API call
        const data: LeaveAdjustment[] = [
          {
            key: "1",
            employee: "Alice Johnson",
            leaveType: "Sick Leave",
            type: "Credit",
            amount: 1,
            reason: "Worked on weekend (Comp-off)",
            approvedBy: "Manager Bob",
          },
          {
            key: "2",
            employee: "Bob Smith",
            leaveType: "Casual Leave",
            type: "Debit",
            amount: 0.5,
            reason: "Late arrival adjustment",
            approvedBy: "HR Admin",
          },
          {
            key: "3",
            employee: "Charlie Brown",
            leaveType: "Privilege Leave",
            type: "Credit",
            amount: 2,
            reason: "Unused leave carry forward correction",
            approvedBy: "System",
          },
          {
            key: "5",
            employee: "Charlie Brown",
            leaveType: "Privilege Leave",
            type: "Credit",
            amount: 2,
            reason: "Unused leave carry forward correction",
            approvedBy: "System",
          },
          {
            key: "4",
            employee: "Charlie Brown",
            leaveType: "Privilege Leave",
            type: "Credit",
            amount: 2,
            reason: "Unused leave carry forward correction",
            approvedBy: "System",
          },
          {
            key: "6",
            employee: "Charlie Brown",
            leaveType: "Privilege Leave",
            type: "Credit",
            amount: 2,
            reason: "Unused leave carry forward correction",
            approvedBy: "System",
          },
        ];
        setDataSource(data);
      } catch (error) {
        console.error("Error fetching adjustments:", error);
        api.error({
          message: "Error",
          description: "Failed to load leave adjustments.",
          placement: "bottomRight",
        });
      }
    };

    fetchAdjustments();
  }, [api]);

  const handleSaveAdjustment = (values: any) => {
    if (editingKey) {
      setDataSource((prev) =>
        prev.map((item) =>
          item.key === editingKey ? { ...item, ...values } : item,
        ),
      );
      api.success({
        message: "Adjustment updated successfully",
        placement: "bottomRight",
        duration: 3,
      });
    } else {
      const newEntry = {
        key: Date.now().toString(),
        ...values,
      };
      setDataSource((prev) => [...prev, newEntry]);
      api.success({
        message: "Adjustment added successfully",
        placement: "bottomRight",
        duration: 3,
      });
    }
    setIsModalVisible(false);
    form.resetFields();
    setSelectedLeaveType(null);
    setEditingKey(null);
  };

  const handleEdit = (record: LeaveAdjustment) => {
    setEditingKey(record.key);
    setSelectedLeaveType(record.leaveType);
    form.setFieldsValue({
      ...record,
      unit: record.unit || "Days",
      compOffWorkDate: record.compOffWorkDate
        ? dayjs(record.compOffWorkDate)
        : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    });
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
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
          style={{ borderRadius: 10 }}
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
      render: (amount: number, record: LeaveAdjustment) => {
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
      render: (_: any, record: LeaveAdjustment) => (
        <Space>
          <Tooltip title="Edit Leave Adjustment">
            <Button
              type="text"
              icon={<Settings2 size={16} />}
              onClick={() => handleEdit(record)}
            />
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
                <div style={{ marginLeft: 10, }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Handle special employee-specific leave cases, comp-offs, and
                    manual corrections.
                  </Text>
                </div>
              </div>
               <div style={{ display: "flex", gap: 12, margin: "8px 0 0 28px" }}>

  <Input.Search
    size="large"
    placeholder="Search adjustments...."
    allowClear
    style={{ width: 350,height: 35}}
    onChange={(e) => setSearchText(e.target.value)}
  />

  <Button
    type="primary"
    style={{ width: 160,height: 35 }}
    onClick={() => setIsModalVisible(true)}
  >
    + Add New Adjustment
  </Button>

</div>

            </div>
            <Table
              columns={columns}
              dataSource={dataSource.filter((item) =>
                item.employee.toLowerCase().includes(searchText.toLowerCase()),
              )}
              style={{ marginTop: 24 }}
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
            //height={100}
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
                      options={[
                        { label: "Alice Johnson", value: "Alice Johnson" },
                        { label: "Bob Smith", value: "Bob Smith" },
                        { label: "Charlie Brown", value: "Charlie Brown" },
                        { label: "David Wilson", value: "David Wilson" },
                        { label: "Eva Green", value: "Eva Green" },
                      ]}
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
                      onChange={(value) => {
                        setSelectedLeaveType(value);
                        if (value === "Permission") {
                          form.setFieldsValue({ unit: "Hours" });
                        } else {
                          form.setFieldsValue({ unit: "Days" });
                        }
                      }}
                      options={[
                        { label: "Sick Leave (SL)", value: "Sick Leave" },
                        { label: "Casual Leave (CL)", value: "Casual Leave" },
                        {
                          label: "Work From Home (WFH)",
                          value: "Work From Home",
                        },
                        { label: "Permission (PRM)", value: "Permission" },
                        { label: "Comp-Off (CO)", value: "Comp-Off" },
                      ]}
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
                      options={[
                        { label: "HR Manager", value: "HR" },
                        { label: "Team Leader", value: "Team Leader" },
                        { label: "Department Head", value: "Department Head" },
                      ]}
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
                <Col span={12}>
                  <Form.Item name="expiryDate" label="Expiry Date">
                    <DatePicker
                      style={{ width: "210%" }}
                      placeholder="Select expiry date"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    setSelectedLeaveType(null);
                    setEditingKey(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingKey ? "Update Adjustment" : "Save Adjustment"}
                </Button>
              </div>
            </Form>
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
