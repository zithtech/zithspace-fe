"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Settings2 } from "lucide-react";
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

export default function LeavesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
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
  const [approvingLeaveId, setApprovingLeaveId] = useState<string | null>(null);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [cancellingLeaveId, setCancellingLeaveId] = useState<string | null>(
    null,
  );

  // Determine if user has approval rights
  const hasApprovalRights =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    pendingApprovals.length > 0;

  // Calculate personal leave stats
  const myPendingLeaves = myLeaves.filter((l) => l.status === "pending").length;
  const myApprovedLeaves = myLeaves.filter(
    (l) => l.status === "approved",
  ).length;

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

      const response = await leaveService.applyLeave(data);

      // Optimistic update: Add new leave to state immediately
      const newLeave = response;
      setMyLeaves((prev) => [newLeave, ...prev]);

      message.success("Leave application submitted successfully");
      form.resetFields();
      // Removed fetchMyLeaves() - using optimistic update instead
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to apply for leave");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    if (approvingLeaveId) return; // Prevent multiple clicks

    try {
      setApprovingLeaveId(leaveId);
      await leaveService.approveLeave(leaveId);

      // Optimistic update: Remove from pending approvals immediately
      setPendingApprovals((prev) => prev.filter((l) => l.id !== leaveId));

      // Update status in myLeaves if it exists (for managers viewing their own leaves)
      setMyLeaves((prev) =>
        prev.map((l) =>
          l.id === leaveId
            ? {
                ...l,
                status: "approved",
                approvedAt: new Date().toISOString(),
                approvedById: user?.id,
              }
            : l,
        ),
      );

      message.success("Leave approved successfully");
      setApprovalModalVisible(false);
      setSelectedLeave(null);
      // Removed fetchPendingApprovals() and fetchMyLeaves() - using optimistic updates
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to approve leave");
      // On error, refetch to restore correct state
      fetchPendingApprovals();
      fetchMyLeaves();
    } finally {
      setApprovingLeaveId(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!rejectionReason.trim()) {
      message.error("Please provide a rejection reason");
      return;
    }

    if (rejectingLeaveId) return; // Prevent multiple clicks

    try {
      setRejectingLeaveId(leaveId);
      await leaveService.rejectLeave(leaveId, rejectionReason);

      // Optimistic update: Remove from pending approvals immediately
      setPendingApprovals((prev) => prev.filter((l) => l.id !== leaveId));

      // Update status in myLeaves if it exists
      setMyLeaves((prev) =>
        prev.map((l) =>
          l.id === leaveId
            ? {
                ...l,
                status: "rejected",
                rejectionReason,
                approvedAt: new Date().toISOString(),
                approvedById: user?.id,
              }
            : l,
        ),
      );

      message.success("Leave rejected");
      setApprovalModalVisible(false);
      setRejectionReason("");
      setSelectedLeave(null);
      // Removed fetchPendingApprovals() and fetchMyLeaves() - using optimistic updates
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to reject leave");
      // On error, refetch to restore correct state
      fetchPendingApprovals();
      fetchMyLeaves();
    } finally {
      setRejectingLeaveId(null);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (cancellingLeaveId) return; // Prevent multiple clicks

    try {
      setCancellingLeaveId(leaveId);
      await leaveService.cancelLeave(leaveId);

      // Optimistic update: Update status immediately
      setMyLeaves((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: "cancelled" } : l)),
      );

      message.success("Leave cancelled successfully");
      // Removed fetchMyLeaves() - using optimistic update instead
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to cancel leave");
      // On error, refetch to restore correct state
      fetchMyLeaves();
    } finally {
      setCancellingLeaveId(null);
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
          <Button
            size="small"
            danger
            loading={cancellingLeaveId === record.id}
            disabled={!!cancellingLeaveId}
            onClick={() => handleCancel(record.id)}
          >
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
  const cardStyle = {
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          <div>
            {/* {user && (
              <Tag 
                color={hasApprovalRights ? "orange" : "blue"} 
                style={{ marginLeft: 16, fontSize: 14 }}
              >
                {hasApprovalRights ? "Manager/Admin" : "Employee"}
              </Tag>
            )} */}
          </div>

          <Tabs
            activeKey="leaves"
            onChange={(key) => {
              if (key === "dashboard") router.push("/leaves-dashboard");
              if (key === "leaves") router.push("/leaves");
              if (key === "holidays") router.push("/government-holidays");
              if (key === "adjustments") router.push("/leave-adjustments");
              if (key === "configuration") router.push("/leave-configuration");
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

          {/* My Leave Status Section */}
          <div style={{ marginBottom: 8 }}>
            {/* <Typography.Title
              level={4}
              style={{ marginBottom: 8, color: "#5884c1ff" }}
            >
              Apply Leave Status
            </Typography.Title> */}
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Card
                  size="small"
                  bodyStyle={{ padding: 16 }}
                  style={{
                    borderRadius: 12,
                  }}
                >
                  <Row align="middle" justify="space-between">
                    {/* LEFT - Title */}
                    <Col>
                      <div style={{ color: "#595959", fontSize: 14 }}>
                        My Total Leaves
                      </div>
                    </Col>

                    {/* RIGHT - Icon + Number */}
                    <Col>
                      <Row align="middle" gutter={12}>
                        {/* ICON */}
                        <Col>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#1677ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 18,
                            }}
                          >
                            <ClockCircleOutlined />
                          </div>
                        </Col>

                        {/* NUMBER */}
                        <Col>
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 600,
                              color: "#1677ff",
                            }}
                          >
                            {myLeaves.length}
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  bodyStyle={{ padding: 16 }}
                  style={{
                    borderRadius: 12,
                  }}
                >
                  <Row align="middle" justify="space-between">
                    {/* LEFT - Title */}
                    <Col>
                      <div style={{ color: "#595959", fontSize: 14 }}>
                        Approved Leaves
                      </div>
                    </Col>

                    {/* RIGHT - Icon + Number */}
                    <Col>
                      <Row align="middle" gutter={12}>
                        {/* ICON */}
                        <Col>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#52c41a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 18,
                            }}
                          >
                            <CheckCircleOutlined />
                          </div>
                        </Col>

                        {/* NUMBER */}
                        <Col>
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 600,
                              color: "#3f8600",
                            }}
                          >
                            {myApprovedLeaves}
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  bodyStyle={{ padding: 16 }}
                  style={{
                    borderRadius: 12,
                  }}
                >
                  <Row align="middle" justify="space-between">
                    {/* LEFT - Title */}
                    <Col>
                      <div style={{ color: "#595959", fontSize: 14 }}>
                        Pending Leaves
                      </div>
                    </Col>

                    {/* RIGHT - Icon + Number */}
                    <Col>
                      <Row align="middle" gutter={12}>
                        {/* ICON */}
                        <Col>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#faad14",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 18,
                            }}
                          >
                            <ClockCircleOutlined />
                          </div>
                        </Col>

                        {/* NUMBER */}
                        <Col>
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 600,
                              color: "#faad14",
                            }}
                          >
                            {myPendingLeaves}
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Team Management Section - Only for Managers/Admins */}
          {hasApprovalRights && (
            <div style={{ marginBottom: 10 }}>
              {/* <Typography.Title
                level={4}
                style={{ marginBottom: 10, color: "#fa8c16" }}
              >
                Team Management
              </Typography.Title> */}
              <Row gutter={16}>
                <Col span={8}>
                  <Card
                    bodyStyle={{ padding: 16 }}
                    style={{
                      ...cardStyle,
                    }}
                  >
                    <Row align="middle" justify="space-between">
                      {/* LEFT - Title */}
                      <Col>
                        <div style={{ color: "#595959", fontSize: 14 }}>
                          Team Pending Approvals
                        </div>
                      </Col>

                      {/* RIGHT - Icon + Number */}
                      <Col>
                        <Row align="middle" gutter={12}>
                          {/* ICON */}
                          <Col>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#fa8c16",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 18,
                              }}
                            >
                              <ClockCircleOutlined />
                            </div>
                          </Col>

                          {/* NUMBER */}
                          <Col>
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 600,
                                color: "#fa8c16",
                              }}
                            >
                              {pendingApprovals.length}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    bodyStyle={{ padding: 16 }}
                    style={{
                      ...cardStyle,
                    }}
                  >
                    <Row align="middle" justify="space-between">
                      {/* LEFT - Title */}
                      <Col>
                        <div style={{ color: "#595959", fontSize: 14 }}>
                          Approved This Month
                        </div>
                      </Col>

                      {/* RIGHT - Icon + Number */}
                      <Col>
                        <Row align="middle" gutter={12}>
                          {/* ICON */}
                          <Col>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#52c41a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 18,
                              }}
                            >
                              <CheckCircleOutlined />
                            </div>
                          </Col>

                          {/* NUMBER */}
                          <Col>
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 600,
                                color: "#52c41a",
                              }}
                            >
                              {0}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    bodyStyle={{ padding: 16 }}
                    style={{
                      ...cardStyle,
                    }}
                  >
                    <Row align="middle" justify="space-between">
                      {/* LEFT - Title */}
                      <Col>
                        <div style={{ color: "#595959", fontSize: 14 }}>
                          Rejected This Month
                        </div>
                      </Col>

                      {/* RIGHT - Icon + Number */}
                      <Col>
                        <Row align="middle" gutter={12}>
                          {/* ICON */}
                          <Col>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#ff4d4f",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 18,
                              }}
                            >
                              <CloseCircleOutlined />
                            </div>
                          </Col>

                          {/* NUMBER */}
                          <Col>
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 600,
                                color: "#ff4d4f",
                              }}
                            >
                              {0}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          <Row gutter={24}>
            <Col xs={24} lg={10}>
              <Card title="Apply Leave" style={{ marginTop: 10, height: 380 }}>
                <Form form={form} layout="vertical" onFinish={handleApplyLeave}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="type"
                        label="Leave Type"
                        rules={[
                          {
                            required: true,
                            message: "Please select leave type",
                          },
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
                          {
                            required: true,
                            message: "Please select duration type",
                          },
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
                          selectedLeaveType === "permission"
                            ? "Date"
                            : "Date Range"
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
                            {
                              required: true,
                              message: "Please enter duration",
                            },
                            {
                              validator: (_, value) => {
                                if (value > 4) {
                                  return Promise.reject(
                                    "Maximum 4 hours allowed for permission",
                                  );
                                }
                                if (value <= 0) {
                                  return Promise.reject(
                                    "Duration must be greater than 0",
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
                              padding: "4px 8px", // ⬇️ reduced
                              background: "#f0f5ff",
                              border: "1px solid #adc6ff",
                              borderRadius: "6px",
                              textAlign: "center",
                              minHeight: 34, // ⬇️ fixed compact height
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "16px", // ⬇️ smaller
                                fontWeight: 600,
                                color: "#1677ff",
                                lineHeight: 1,
                              }}
                            >
                              {calculatedDuration > 0
                                ? calculatedDuration
                                : "-"}
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
                            dayjs(dateRange[1]).diff(
                              dayjs(dateRange[0]),
                              "days",
                            ) > 0 && (
                              <Paragraph
                                type="warning"
                                style={{
                                  fontSize: "12px",
                                  marginTop: "4px",
                                  marginBottom: 0,
                                }}
                              >
                                Half-day is only available for single day.
                                Switched to Full Day.
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
                    rules={[
                      { required: true, message: "Please provide a reason" },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Enter reason for leave" />
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
            </Col>
            <Col xs={24} lg={14}>
              <Card bodyStyle={{ paddingTop: 8 }} style={{ marginTop: 10, height: 380 }}>
                <Tabs
                  defaultActiveKey="history"
                  items={[
                    {
                      key: "history",
                      label: (
                        <span>
                          My Leave History
                          <Badge
                            count={myLeaves.length}
                            style={{ marginLeft: 8 }}
                          />
                        </span>
                      ),
                      children: (
                        <Table
                          columns={myLeavesColumns}
                          dataSource={myLeaves}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                        />
                      ),
                    },
                    ...(hasApprovalRights
                      ? [
                          {
                            key: "approvals",
                            label: (
                              <span>
                                Pending Approvals
                                <Badge
                                  count={pendingApprovals.length}
                                  style={{ marginLeft: 8 }}
                                />
                              </span>
                            ),
                            children: (
                              <Table
                                columns={approvalsColumns}
                                dataSource={pendingApprovals}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                              />
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </Card>
            </Col>
          </Row>

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
                      loading={approvingLeaveId === selectedLeave.id}
                      disabled={!!approvingLeaveId || !!rejectingLeaveId}
                      onClick={() => handleApprove(selectedLeave.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={rejectingLeaveId === selectedLeave.id}
                      disabled={!!approvingLeaveId || !!rejectingLeaveId}
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
