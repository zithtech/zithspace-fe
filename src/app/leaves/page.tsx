"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
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
  Space,
  Statistic,
  Row,
  Col,
  Badge,
  Typography,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import leaveService, { Leave, ApplyLeaveData } from "@/services/leaveService";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Paragraph } = Typography;

export default function LeavesPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Leave[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [selectedDurationType, setSelectedDurationType] = useState<string>("");
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [calculatedDuration, setCalculatedDuration] = useState<number>(0);

  const leaveTypes = [
    { label: "Sick Leave", value: "sick_leave" },
    { label: "Casual Leave", value: "casual_leave" },
    { label: "Work From Home", value: "work_from_home" },
    { label: "Permission", value: "permission" },
  ];

  // Dynamic duration types based on leave type
  const getDurationTypes = (leaveType: string) => {
    if (leaveType === "permission") {
      return [{ label: "Hours", value: "HOURS" }];
    }
    return [
      { label: "Full Day", value: "FULL_DAY" },
      { label: "Half Day", value: "HALF_DAY" },
    ];
  };

  const durationTypes = getDurationTypes(selectedLeaveType);

  // Auto-calculate duration when date range or duration type changes
  useEffect(() => {
    if (selectedLeaveType === "permission") {
      // For permission, duration is manual (hours)
      setCalculatedDuration(0);
      return;
    }

    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const startDate = dayjs(dateRange[0]);
      const endDate = dayjs(dateRange[1]);

      // Calculate number of days (inclusive)
      const days = endDate.diff(startDate, "days") + 1;

      // Apply duration type multiplier
      let duration = days;
      if (selectedDurationType === "HALF_DAY") {
        // For half-day, only allow single day
        if (days === 1) {
          duration = 0.5;
        } else {
          // Reset to full day if multiple days selected
          form.setFieldsValue({ durationType: "FULL_DAY" });
          setSelectedDurationType("FULL_DAY");
          duration = days;
        }
      }

      setCalculatedDuration(duration);
      form.setFieldsValue({ duration });
    } else {
      setCalculatedDuration(0);
    }
  }, [dateRange, selectedDurationType, selectedLeaveType, form]);

  useEffect(() => {
    fetchMyLeaves();
    fetchPendingApprovals();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const response = await leaveService.getMyLeaves();
      setMyLeaves(response.data);
    } catch (error: any) {
      console.error("Failed to fetch leaves:", error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const leaves = await leaveService.getPendingApprovals();
      setPendingApprovals(leaves);
    } catch (error: any) {
      console.error("Failed to fetch pending approvals:", error);
    }
  };

  const handleApplyLeave = async (values: any) => {
    try {
      setLoading(true);
      const startDate = values.dateRange[0].format("YYYY-MM-DD");
      const endDate = values.dateRange[1].format("YYYY-MM-DD");

      const data: ApplyLeaveData = {
        type: values.type,
        startDate,
        endDate,
        duration: parseFloat(values.duration),
        durationType: values.durationType,
        reason: values.reason,
      };

      await leaveService.applyLeave(data);
      message.success("Leave application submitted successfully");
      form.resetFields();
      fetchMyLeaves();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to apply for leave");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await leaveService.approveLeave(leaveId);
      message.success("Leave approved successfully");
      fetchPendingApprovals();
      fetchMyLeaves();
      setApprovalModalVisible(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to approve leave");
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!rejectionReason.trim()) {
      message.error("Please provide a rejection reason");
      return;
    }

    try {
      await leaveService.rejectLeave(leaveId, rejectionReason);
      message.success("Leave rejected");
      fetchPendingApprovals();
      fetchMyLeaves();
      setApprovalModalVisible(false);
      setRejectionReason("");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to reject leave");
    }
  };

  const handleCancel = async (leaveId: string) => {
    try {
      await leaveService.cancelLeave(leaveId);
      message.success("Leave cancelled successfully");
      fetchMyLeaves();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to cancel leave");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const leaveType = leaveTypes.find((lt) => lt.value === type);
    return leaveType?.label || type;
  };

  const myLeavesColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => getLeaveTypeLabel(type),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number, record: Leave) =>
        `${duration} ${record.durationType === "HOURS" ? "hrs" : "days"}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Applied On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Leave) =>
        record.status === "pending" && (
          <Button size="small" danger onClick={() => handleCancel(record.id)}>
            Cancel
          </Button>
        ),
    },
  ];

  const approvalsColumns = [
    {
      title: "Employee",
      dataIndex: ["user", "name"],
      key: "employee",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => getLeaveTypeLabel(type),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number, record: Leave) =>
        `${duration} ${record.durationType === "HOURS" ? "hrs" : "days"}`,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Leave) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedLeave(record);
              setApprovalModalVisible(true);
            }}
          >
            Review
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "apply",
      label: "Apply Leave",
      children: (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Card>
            <Form form={form} layout="vertical" onFinish={handleApplyLeave}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Leave Type"
                  rules={[
                    { required: true, message: "Please select leave type" },
                  ]}
                >
                  <Select
                    options={leaveTypes}
                    placeholder="Select leave type"
                    onChange={(value) => {
                      setSelectedLeaveType(value);
                      // Reset fields when leave type changes
                      form.setFieldsValue({
                        durationType: undefined,
                        duration: undefined,
                        dateRange: undefined,
                      });
                      setDateRange([]);
                      setSelectedDurationType("");
                      setCalculatedDuration(0);

                      // Auto-select HOURS for permission
                      if (value === "permission") {
                        form.setFieldsValue({ durationType: "HOURS" });
                        setSelectedDurationType("HOURS");
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="durationType"
                  label="Duration Type"
                  rules={[
                    { required: true, message: "Please select duration type" },
                  ]}
                >
                  <Select
                    options={durationTypes}
                    placeholder="Select duration type"
                    disabled={selectedLeaveType === "permission"}
                    onChange={(value) => {
                      setSelectedDurationType(value);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={selectedLeaveType === "permission" ? 12 : 16}>
                <Form.Item
                  name="dateRange"
                  label={
                    selectedLeaveType === "permission" ? "Date" : "Date Range"
                  }
                  rules={[
                    {
                      required: true,
                      message:
                        selectedLeaveType === "permission"
                          ? "Please select date"
                          : "Please select date range",
                    },
                  ]}
                >
                  {selectedLeaveType === "permission" ? (
                    <DatePicker
                      style={{ width: "100%" }}
                      onChange={(date) => {
                        if (date) {
                          setDateRange([date, date]);
                        } else {
                          setDateRange([]);
                        }
                      }}
                    />
                  ) : (
                    <RangePicker
                      style={{ width: "100%" }}
                      onChange={(dates) => {
                        setDateRange(dates || []);
                      }}
                    />
                  )}
                </Form.Item>
              </Col>

              {selectedLeaveType === "permission" ? (
                <Col span={12}>
                  <Form.Item
                    name="duration"
                    label="Duration (Hours)"
                    rules={[
                      { required: true, message: "Please enter duration" },
                      {
                        validator: (_, value) => {
                          if (value > 4) {
                            return Promise.reject(
                              "Maximum 4 hours allowed for permission"
                            );
                          }
                          if (value <= 0) {
                            return Promise.reject(
                              "Duration must be greater than 0"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                    help="Maximum 4 hours allowed"
                  >
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Enter hours (max 4)"
                      max={4}
                    />
                  </Form.Item>
                </Col>
              ) : (
                <Col span={8}>
                  <Form.Item label="Calculated Duration">
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "#f0f5ff",
                        border: "1px solid #adc6ff",
                        borderRadius: "6px",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#1677ff",
                        }}
                      >
                        {calculatedDuration > 0 ? calculatedDuration : "-"}
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          marginLeft: "4px",
                        }}
                      >
                        {calculatedDuration === 1 ? "day" : "days"}
                      </span>
                    </div>
                    {selectedDurationType === "HALF_DAY" &&
                      dateRange.length === 2 &&
                      dateRange[0] &&
                      dateRange[1] &&
                      dayjs(dateRange[1]).diff(dayjs(dateRange[0]), "days") >
                        0 && (
                        <Paragraph
                          type="warning"
                          style={{
                            fontSize: "12px",
                            marginTop: "4px",
                            marginBottom: 0,
                          }}
                        >
                          Half-day is only available for single day. Switched to
                          Full Day.
                        </Paragraph>
                      )}
                  </Form.Item>
                  {/* Hidden field to store calculated duration */}
                  <Form.Item name="duration" hidden>
                    <Input type="hidden" />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: "Please provide a reason" }]}
            >
              <TextArea rows={4} placeholder="Enter reason for leave" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Submit Application
              </Button>
            </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: "history",
      label: (
        <span>
          My Leaves
          <Badge count={myLeaves.length} style={{ marginLeft: 8 }} />
        </span>
      ),
      children: (
        <Card>
          <Table
            columns={myLeavesColumns}
            dataSource={myLeaves}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: "approvals",
      label: (
        <span>
          Pending Approvals
          <Badge count={pendingApprovals.length} style={{ marginLeft: 8 }} />
        </span>
      ),
      children: (
        <Card>
          <Table
            columns={approvalsColumns}
            dataSource={pendingApprovals}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          <h1>Leave & Permission Management</h1>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Leaves"
                  value={myLeaves.length}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Approved"
                  value={myLeaves.filter((l) => l.status === "approved").length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Pending Approvals"
                  value={pendingApprovals.length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
          </Row>

          <Tabs items={tabItems} />

          <Modal
            title="Review Leave Application"
            open={approvalModalVisible}
            onCancel={() => {
              setApprovalModalVisible(false);
              setRejectionReason("");
            }}
            footer={null}
            width={600}
          >
            {selectedLeave && (
              <div>
                <p>
                  <strong>Employee:</strong> {selectedLeave.user?.name}
                </p>
                <p>
                  <strong>Type:</strong> {getLeaveTypeLabel(selectedLeave.type)}
                </p>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {dayjs(selectedLeave.startDate).format("DD MMM YYYY")}
                </p>
                <p>
                  <strong>End Date:</strong>{" "}
                  {dayjs(selectedLeave.endDate).format("DD MMM YYYY")}
                </p>
                <p>
                  <strong>Duration:</strong> {selectedLeave.duration}{" "}
                  {selectedLeave.durationType === "HOURS" ? "hours" : "days"}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedLeave.reason}
                </p>

                <div style={{ marginTop: 24 }}>
                  <TextArea
                    rows={3}
                    placeholder="Rejection reason (required for rejection)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApprove(selectedLeave.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleReject(selectedLeave.id)}
                    >
                      Reject
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
