"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Settings2, Columns3Cog } from "lucide-react";
import {
  Card,
  Tabs,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  message,
  notification,
  Space,
  Statistic,
  Row,
  Col,
  Badge,
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  Checkbox,
  List,
  InputNumber,
  Divider,
  Segmented,
  ConfigProvider,
  AutoComplete,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import leaveService, { Leave, ApplyLeaveData } from "@/services/leaveService";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;
const { Option } = Select;

const leaveTypesData = [
  {
    id: 1,
    name: "Casual Leave",
    description: "Leave taken for personal reasons or short-term needs.",
  },
  {
    id: 2,
    name: "Sick Leave",
    description: "Leave taken when an employee is ill or unwell.",
  },
  {
    id: 3,
    name: "Earned Leave",
    description: "Leave accumulated over time based on work tenure.",
  },
  {
    id: 4,
    name: "Paid Leave",
    description: "Leave where salary is fully paid during absence.",
  },
  {
    id: 5,
    name: "Unpaid Leave",
    description: "Leave taken without salary payment.",
  },
  {
    id: 6,
    name: "Loss of Pay",
    description:
      "Leave resulting in salary deduction due to insufficient balance.",
  },
  {
    id: 7,
    name: "Comp-Off",
    description: "Leave granted for working on holidays or weekends.",
  },
  {
    id: 8,
    name: "Permission",
    description: "Short-duration leave taken for a few hours.",
  },
  {
    id: 9,
    name: "On Duty",
    description:
      "Marked when employee is working outside office for official work.",
  },
  {
    id: 10,
    name: "Emergency Leave",
    description: "Leave taken due to urgent or unexpected situations.",
  },
  {
    id: 11,
    name: "Medical Leave",
    description: "Extended leave taken for medical treatment or recovery.",
  },
  {
    id: 12,
    name: "Festival Holiday",
    description: "Holiday granted for religious or cultural festivals.",
  },
  {
    id: 13,
    name: "Weekly Off",
    description: "Regular weekly holiday such as Sunday or scheduled off day.",
  },
  {
    id: 14,
    name: "Marriage Leave",
    description: "Leave granted for employee’s marriage.",
  },
  {
    id: 15,
    name: "Bereavement Leave",
    description: "Leave taken due to death of a close family member.",
  },

  // Office / Corporate (IT + Non-IT)
  {
    id: 16,
    name: "Work From Home",
    description: "Employee works remotely instead of office.",
  },
  {
    id: 17,
    name: "Optional Holiday",
    description: "Employee can choose to take this holiday optionally.",
  },
  {
    id: 18,
    name: "Floating Holiday",
    description: "Flexible holiday chosen by the employee.",
  },
  {
    id: 19,
    name: "Privilege Leave",
    description: "Long-term leave granted as per company policy.",
  },
  {
    id: 20,
    name: "Annual Leave",
    description: "Yearly leave entitlement for employees.",
  },
  {
    id: 21,
    name: "Training Leave",
    description: "Leave taken to attend training or skill programs.",
  },
  {
    id: 22,
    name: "Sabbatical Leave",
    description: "Extended leave for personal or professional development.",
  },

  // Hospital / Healthcare
  {
    id: 23,
    name: "Night Shift Off",
    description: "Off granted after night shift duty.",
  },
  {
    id: 24,
    name: "Quarantine Leave",
    description: "Leave during isolation due to contagious illness.",
  },
  {
    id: 25,
    name: "Accident Leave",
    description: "Leave taken due to injury or accident.",
  },
  {
    id: 26,
    name: "Duty Roster Leave",
    description: "Leave based on duty roster schedule.",
  },
  {
    id: 27,
    name: "Emergency Duty Off",
    description: "Off given after emergency duty hours.",
  },
  {
    id: 28,
    name: "Maternity Leave",
    description: "Leave granted to female employees during childbirth.",
  },
  {
    id: 29,
    name: "Paternity Leave",
    description: "Leave granted to male employees after childbirth.",
  },

  // Factory / Manufacturing
  {
    id: 30,
    name: "Shift Leave",
    description: "Leave taken due to shift schedule changes.",
  },
  {
    id: 31,
    name: "Production Shutdown Leave",
    description: "Leave during factory or production shutdown.",
  },
  {
    id: 32,
    name: "Compensatory Leave",
    description: "Leave given in return for extra working hours.",
  },
  {
    id: 33,
    name: "Special Leave",
    description: "Leave granted for special circumstances.",
  },
  {
    id: 34,
    name: "Layoff Leave",
    description: "Leave during temporary workforce layoff.",
  },
  {
    id: 35,
    name: "Menstrual Leave",
    description:
      "Menstrual Leave is a paid leave granted to eligible female employees to address health and wellness needs during their menstrual cycle. This leave is provided in accordance with company policy and may require prior approval.",
  },
  {
    id: 36,
    name: "Sandwich Leave",
    description:
      "Sandwich Leave is applied when an employee takes leave before and after a holiday or weekend, causing the intervening non-working days to be counted as leave, as per company policy.",
  },
];

interface LeaveType {
  key: string;
  name: string;
  code: string;
  description: string;
  unit: string;
  paid: boolean;
  approval: string;
  status: string;
}

export default function leaveConfiguration() {
  const router = useRouter();
  const pathname = usePathname();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<LeaveType[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDataSource([
        {
          key: "1",
          name: "Casual Leave",
          code: "CL",
          description: "Leave taken for personal reasons or short-term needs.",
          unit: "Days",
          paid: true,
          approval: "Auto",
          status: "Active",
        },
        {
          key: "2",
          name: "Sick Leave",
          code: "SL",
          description: "Leave taken when an employee is ill or unwell.",
          unit: "Days",
          paid: true,
          approval: "Required",
          status: "Active",
        },
        {
          key: "3",
          name: "Loss of Pay",
          code: "LOP",
          description: "Leave during temporary workforce layoff.",
          unit: "Days",
          paid: false,
          approval: "Required",
          status: "Inactive",
        },
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const switchRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  };

  const switchTitle: React.CSSProperties = {
    fontWeight: 500,
    color: "#333",
  };

  const switchDesc: React.CSSProperties = {
    fontSize: 12,
    color: "#888",
  };

  const columns = [
    {
      title: "Leave Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Tooltip title={text}>
          <div
            style={{
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Paid",
      dataIndex: "paid",
      key: "paid",
      render: (paid: boolean) => (paid ? "Yes" : "No"),
    },
    {
      title: "Approval",
      dataIndex: "approval",
      key: "approval",
      render: (approval: string) => (
        <Tag
          style={{ borderRadius: 10 }}
          color={approval === "Required" ? "orange" : "green"}
        >
          {approval}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          style={{ borderRadius: 10 }}
          color={status === "Active" ? "success" : "default"}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: LeaveType) => (
        <Space>
          <Tooltip title="Edit Leave Type">
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

  const handleEdit = (record: LeaveType) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      unit: record.unit,
      paid: record.paid,
      approval: record.approval === "Required",
      status: record.status === "Active",
    });
    setIsModalVisible(true);
  };

  const handleSaveLeaveType = (values: {
    name: string;
    code: string;
    description: string;
    unit: string;
    paid: boolean;
    approval: boolean;
    status: boolean;
  }) => {
    if (editingKey) {
      setDataSource((prev) =>
        prev.map((item) =>
          item.key === editingKey
            ? {
                ...item,
                name: values.name,
                code: values.code,
                description: values.description || "",
                unit: values.unit,
                paid: values.paid,
                approval: values.approval ? "Required" : "Auto",
                status: values.status ? "Active" : "Inactive",
              }
            : item,
        ),
      );
      setEditingKey(null);
      api.success({
        message: `${values.name} Updated Successfully`,
        placement: "bottomRight",
        duration: 1,
      });
    } else {
      const newLeave = {
        key: Date.now().toString(),
        name: values.name,
        code: values.code,
        description: values.description || "",
        unit: values.unit,
        paid: values.paid,
        approval: values.approval ? "Required" : "Auto",
        status: values.status ? "Active" : "Inactive",
      };
      setDataSource([...dataSource, newLeave]);
      api.success({
        message: `${values.name} Added Successfully`,
        placement: "bottomRight",
        duration: 1,
      });
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          {contextHolder}
          <div style={{ marginBottom: 16 }}>
            <Tabs
              activeKey="configuration"
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
                  <Columns3Cog style={{ color: "#1a64c4ff", fontSize: 20 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Leave Configuration
                  </Typography.Title>
                </Space>
                <div style={{ marginLeft: 28, marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Configure leave types and assign limits per position.
                  </Text>
                </div>
              </div>

              <Button
                type="primary"
                style={{ height: 40 }}
                onClick={() => {
                  setEditingKey(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                + Add Leave Type
              </Button>
            </div>
            <Divider />
            <div style={{ display: "flex", gap: 12, margin: "8px 0 0 28px" }}>
              <Input.Search
                placeholder="Search Leave Types...."
                allowClear
                style={{ width: 480 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <Table
              columns={columns}
              dataSource={dataSource.filter(
                (item) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                  item.code.toLowerCase().includes(searchText.toLowerCase()),
              )}
              loading={loading}
              style={{ marginTop: 24 }}
              pagination={{ pageSize: 6 }}
            />
          </Card>

          <Modal
            title={
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {editingKey ? "Edit Leave Type" : "Add Leave Type"}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Configure leave rules and availability
                </div>
              </div>
            }
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            width={440}
            destroyOnClose
          >
            <Form form={form} layout="vertical" onFinish={handleSaveLeaveType}>
              {/* Leave Name & Code */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Leave Name"
                    rules={[
                      { required: true, message: "Please select leave name" },
                    ]}
                  >
                    <AutoComplete
                      size="large"
                      placeholder="Select or type to add a leave"
                      options={leaveTypesData.map((l) => ({
                        label: l.name,
                        value: l.name,
                      }))}
                      filterOption={(inputValue, option) =>
                        option!.value
                          .toUpperCase()
                          .indexOf(inputValue.toUpperCase()) !== -1
                      }
                      onChange={(value) => {
                        const selectedLeave = leaveTypesData.find(
                          (l) => l.name === value,
                        );
                        const code = value
                          ? value
                              .split(" ")
                              .map((x: string) => x[0])
                              .join("")
                              .toUpperCase()
                          : "";
                        form.setFieldsValue({
                          code,
                          description: selectedLeave?.description || "",
                        });
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Leave Code"
                    rules={[{ required: true, message: "Please enter code" }]}
                  >
                    <Input placeholder="e.g. CL" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Description */}
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: "Please Description" }]}
              >
                <TextArea rows={2} placeholder="Enter description" />
              </Form.Item>

              {/* Unit */}
              <Form.Item name="unit" label="Unit" initialValue="Days">
                <Select>
                  <Select.Option value="Days">Days</Select.Option>
                  <Select.Option value="Hours">Hours</Select.Option>
                </Select>
              </Form.Item>

              {/* Settings Section */}
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                }}
              >
                {/* Paid Leave */}
                <div style={{ ...switchRow, marginBottom: 16 }}>
                  <div>
                    <div style={switchTitle}>Paid Leave</div>
                    <div style={switchDesc}>
                      Employee salary is not deducted
                    </div>
                  </div>
                  <ConfigProvider
                    theme={{
                      components: {
                        Switch: {
                          colorPrimary: "#52c41a",
                          colorPrimaryHover: "#73d13d",
                        },
                      },
                    }}
                  >
                    <Form.Item
                      name="paid"
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Switch />
                    </Form.Item>
                  </ConfigProvider>
                </div>

                {/* Requires Approval */}
                <div style={{ ...switchRow, marginBottom: 16 }}>
                  <div>
                    <div style={switchTitle}>Requires Approval</div>
                    <div style={switchDesc}>
                      Manager must approve this leave
                    </div>
                  </div>
                  <ConfigProvider
                    theme={{
                      components: {
                        Switch: {
                          colorPrimary: "#eeae0bff",
                          colorPrimaryHover: "#eeae0bff",
                        },
                      },
                    }}
                  >
                    <Form.Item
                      name="approval"
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Switch />
                    </Form.Item>
                  </ConfigProvider>
                </div>

                {/* Status */}
                <div style={switchRow}>
                  <div>
                    <div style={switchTitle}>Status</div>
                    <div style={switchDesc}>Leave type is active</div>
                  </div>
                  <ConfigProvider
                    theme={{
                      components: {
                        Switch: {
                          colorPrimary: "#9f00fcff",
                          colorPrimaryHover: "#9f00fcff",
                        },
                      },
                    }}
                  >
                    <Form.Item
                      name="status"
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Switch />
                    </Form.Item>
                  </ConfigProvider>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" onClick={() => form.submit()}>
                  {editingKey ? "Update Leave Type" : "Create Leave Type"}
                </Button>
              </div>
            </Form>
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
