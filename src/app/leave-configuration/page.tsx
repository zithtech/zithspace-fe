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
import { useRouter, usePathname } from "next/navigation";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;
const { Option } = Select;

const leaveTypesData = [
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

interface LeaveType {
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

export default function leaveConfiguration() {
  const router = useRouter();
  const pathname = usePathname();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<LeaveType[]>([]);
  const [searchText, setSearchText] = useState("");
  const [leaveUnit, setLeaveUnit] = useState("Days");
  const [isSaving, setIsSaving] = useState(false);

  const {
    leaveTypes: apiLeaveTypes,
    loading,
    error,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  } = useLeaveTypes();

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

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
      sorter: (a: LeaveType, b: LeaveType) => a.name.localeCompare(b.name),
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
              maxWidth: 400,
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
      title: "Type",
      key: "type",
      render: (record: LeaveType) => (
        <span>
          {record.type === "Days"
            ? (record.days || 1) === 1
              ? "Day"
              : `${record.days} Days`
            : "Hours"}
        </span>
      ),
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
          <Tooltip title="Delete Leave Type">
            <Popconfirm
              title="Delete this leave type?"
              description="Are you sure you want to delete this leave type?"
              onConfirm={() => handleDelete(record.key)}
              okButtonProps={{ loading: deletingKey === record.key }}
              cancelButtonProps={{ disabled: deletingKey === record.key }}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger type="text" icon={<DeleteOutlined />}
              />
            </Popconfirm>
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
      type: record.type,
      paid: record.paid,
      approval: record.approval === "Required",
      status: record.status === "Active",
      days: record.days,
      hours: record.hours,
    });
    setLeaveUnit(record.type);
    setIsModalVisible(true);
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      await deleteLeaveType(key);
      api.success({
        message: "Leave Type Deleted",
        placement: "topRight",
        duration: 2,
      });
    } catch (e: any) {
      api.error({
        message: "Deletion Failed",
        description: e.message || "Could not delete the leave type.",
        placement: "topRight",
      });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSaveLeaveType = async (values: {
    name: string;
    code: string;
    description: string;
    type: string;
    paid: boolean;
    approval: boolean;
    status: boolean;
    days: number;
    hours: number;
  }) => {
    const payload = {
      // ... (rest of the payload)
      name: values.name,
      code: values.code,
      description: values.description,
      type: values.type as "Days" | "Hours",
      isPaid: values.paid,
      requiresApproval: values.approval,
      isActive: values.status,
      days: values.type === "Days" ? values.days : null,
      hours: values.type === "Hours" ? values.hours : null,
    };

    // Check for duplicates locally before sending
    const isDuplicateName = dataSource.some(
      (item) =>
        item.name.toLowerCase() === values.name.toLowerCase() &&
        item.key !== editingKey,
    );
    const isDuplicateCode = dataSource.some(
      (item) =>
        item.code.toLowerCase() === values.code.toLowerCase() &&
        item.key !== editingKey,
    );

    if (isDuplicateName || isDuplicateCode) {
      api.error({
        message: "Duplicate Entry",
        description: `A leave type with this ${isDuplicateName ? "name" : "code"} already exists.`,
        placement: "topRight",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingKey) {
        await updateLeaveType(editingKey, payload);
        api.success({ message: `${values.name} Updated Successfully`, placement: "topRight", duration: 2 });
      } else {
        await createLeaveType(payload);
        api.success({ message: `${values.name} Added Successfully`, placement: "topRight", duration: 2 });
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingKey(null);
    } catch (e: any) {
      let errorMessage = e.message;
      if (e.response?.status === 409) {
        errorMessage = "Leave type with this name or code already exists.";
      }
      api.error({
        message: "Save Failed",
        description: errorMessage,
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div >
          {contextHolder}
          <div>
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
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Manage leave types and define allocation rules for each position.
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, margin: "8px 0 0 28px" }}>

  <Input.Search
    placeholder="Search Leave Types...."
    allowClear
    onChange={(e) => setSearchText(e.target.value)}
    style={{ width: 390, height: 36 }}
  />

  <Button
    type="primary"
    style={{ width: 150, height: 30 }}
    onClick={() => {
      setEditingKey(null);
      form.resetFields();
      setLeaveUnit("Days");
      setIsModalVisible(true);
    }}
  >
    + Add Leave Type
  </Button>

</div>

            </div>
            {/* <Divider /> */}
            <Space style={{ marginBottom: 8}}>
              <Tag color="blue" style={{borderRadius:10}}>
                Total Leave Types: {dataSource.length}
              </Tag>
              <Tag color="success" style={{borderRadius:10}}>
                Active:{" "}
                {dataSource.filter((item) => item.status === "Active").length}
              </Tag>
              <Tag style={{borderRadius:10}}>
                Inactive:{" "}
                {dataSource.filter((item) => item.status === "Inactive").length}
              </Tag>
            </Space>
            <Table
              columns={columns}
              dataSource={dataSource.filter(
                (item) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                  item.code.toLowerCase().includes(searchText.toLowerCase()),
              )}
              loading={loading}
              size="small"
              style={{ marginTop:5 }}
              pagination={{ pageSize:10}}
            />
         

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
                      style={{ width: "100%" }}
                      placeholder="Select or type to add a leave"
                      options={leaveTypesData
                        .filter(
                          (l) => !dataSource.some((existing) => existing.name.toLowerCase() === l.name.toLowerCase())
                        )
                        .map((l) => ({
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
                        let code = "";
                        if (value) {
                          const words = value.trim().split(/\s+/);
                          if (words.length === 1 && words[0].length > 0) {
                            code = words[0].substring(0, 2).toUpperCase();
                          } else if (words.length > 1) {
                            code = words
                              .map((x: string) => x[0])
                              .join("")
                              .toUpperCase();
                          }
                        }

                        if (code) {
                          let finalCode = code;
                          let counter = 1;
                          while (
                            dataSource.some(
                              (item) => item.code.toLowerCase() === finalCode.toLowerCase() && item.key !== editingKey,
                            )
                          ) {
                            finalCode = `${code}${counter}`;
                            counter++;
                          }
                          code = finalCode;
                        }

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
                    <Input size="large" placeholder="e.g. CL" />
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
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="type" label="Type" initialValue="Days">
                    <Select
                      onChange={(value) => {
                        setLeaveUnit(value);
                        if (value === "Days") {
                          form.setFieldsValue({ days: 1, hours: undefined });
                        } else {
                          form.setFieldsValue({ hours: 0.5, days: undefined });
                        }
                      }}
                    >
                      <Select.Option value="Days">Days</Select.Option>
                      <Select.Option value="Hours">Hours</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {leaveUnit === "Days" ? (
                    <Form.Item name="days" label="Days" initialValue={1}>
                      <InputNumber
                        style={{ width: "100%" }}
                        min={1}
                        disabled
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item name="hours" label="Hours" initialValue={0.5}>
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.5}
                        max={2.5}
                        step={0.5}
                      />
                    </Form.Item>
                  )}
                </Col>
              </Row>
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
                <Button
                  onClick={() => setIsModalVisible(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="primary" loading={isSaving} onClick={() => form.submit()}>
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
