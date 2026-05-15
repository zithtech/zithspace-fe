"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { usePermission } from "@/hooks/usePermission";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import { useLeaveOrigins } from "@/hooks/useLeaveOrigins";
import { MembersService } from "@/services/membersService";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;

interface OriginLeaveType {
  id: string;
  leaveTypeId: string;
  unit: number;
  period: string;
  carryForward: boolean;
  status: string;
}

export default function LeavesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const { leaveTypes: apiLeaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const { leaveOrigins } = useLeaveOrigins();
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
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [hasLeaveConfig, setHasLeaveConfig] = useState(false);

  // RBAC permissions
  const {
    canReadLeave,
    canCreateLeave,
    canUpdateLeave,
    canApproveLeave,
    canManageLeaves,
    canReadLeaveDashboard,
    canReadLeaveType,
    canReadLeavePolicy
  } = usePermission();
  
  // Determine if user has approval rights
  const hasApprovalRights = canApproveLeave || pendingApprovals.length > 0;

  // Protect route - requires leave.read permission
  useEffect(() => {
    if (!authLoading && !canReadLeave) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadLeave, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return null;
  }

  // Don't render if no read permission
  if (!canReadLeave) {
    return null;
  }

  // Calculate personal leave stats
  const myPendingLeaves = myLeaves.filter((l) => l.status === "pending").length;
  const myApprovedLeaves = myLeaves.filter(
    (l) => l.status === "approved",
  ).length;

  // Merge types from balances into available options if they are missing from apiLeaveTypes
  const availableLeaveTypes = useMemo(() => {
    const baseTypes = apiLeaveTypes || [];
    const baseTypeNames = new Set(
      baseTypes.map((lt: any) => lt.name?.toLowerCase()),
    );

    const extraTypes = leaveBalances
      .filter((b) => !baseTypeNames.has(b.type?.toLowerCase()))
      .map((b) => ({
        id: `generated-${b.type}`,
        name: b.type,
        isActive: true,
        type: "Days", // Default assumption for config-only types
      }));

    return [...baseTypes, ...extraTypes];
  }, [apiLeaveTypes, leaveBalances]);

  const leaveTypes = availableLeaveTypes
    ? availableLeaveTypes
        .filter((lt: any) => lt.isActive)
        .filter((lt: any) => {
          if (lt.name === "Loss of Pay") return true;
          if (hasLeaveConfig) {
            return leaveBalances.some(
              (b) => b.type?.toLowerCase() === lt.name?.toLowerCase(),
            );
          }
          return false;
        })
        .map((lt: any) => {
          const balance = leaveBalances.find(
            (b) => b.type?.toLowerCase() === lt.name?.toLowerCase(),
          );
          const isLossOfPay = lt.name === "Loss of Pay";
          const disabled = !isLossOfPay && balance && balance.remaining <= 0;
          let label = lt.name;
          if (balance && !isLossOfPay) {
            label += ` (${balance.remaining}/${balance.allowed})`;
          }
          return {
            label,
            value: lt.name,
            disabled,
          };
        })
    : [];

  const isSelectedLeaveHourly =
    availableLeaveTypes?.find(
      (lt: any) => lt.name?.toLowerCase() === selectedLeaveType?.toLowerCase(),
    )?.type === "Hours";

  // Dynamic duration types based on leave type
  const getDurationTypes = (leaveType: string) => {
    const isHourly =
      availableLeaveTypes?.find(
        (lt: any) => lt.name?.toLowerCase() === leaveType?.toLowerCase(),
      )?.type === "Hours";
    if (isHourly) {
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
    if (isSelectedLeaveHourly) {
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
  }, [
    dateRange,
    selectedDurationType,
    selectedLeaveType,
    form,
    isSelectedLeaveHourly,
  ]);
  // Add this useEffect after approval actions
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyLeaves();
      fetchPendingApprovals();
    }, 1000); // Refresh 1s after state changes

    return () => clearTimeout(timer);
  }, [approvingLeaveId, rejectingLeaveId, cancellingLeaveId]);

  useEffect(() => {
    router.push("/apply-leave");
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const fetchLeaveBalances = async () => {
      if (!user?.id || !leaveOrigins) return;
      try {
        // 1. Get Member details to find positionId
        let member;

        // Try to find member by email first to avoid 404 errors from missing ID endpoint
        if (user.email) {
          try {
            const response = await MembersService.getMembers({
              search: user.email,
            });
            member = response.data.find(
              (m: any) =>
                m.workEmail?.toLowerCase() === user.email.toLowerCase() ||
                m.personalEmail?.toLowerCase() === user.email.toLowerCase(),
            );
          } catch (e) {
            /* ignore */
          }
        }

        // Fallback to ID lookup if email search didn't find the member
        if (!member) {
          try {
            member = await MembersService.getMemberByUserId(user.id);
          } catch (error) {
            // ignore
          }
        }

        if (!isMounted) return;

        if (!member?.position?.id) {
          setHasLeaveConfig(false);
          setLeaveBalances([]);
          return;
        }

        // 2. Get Position Configuration from leaveOrigins
        const positionConfig = leaveOrigins.find(
          (config) =>
            config.origin === "Position" &&
            config.subOriginId === member.position?.id,
        );

        setHasLeaveConfig(!!positionConfig);

        // 3. Calculate balances based on configuration and history
        if (positionConfig?.leaveTypes) {
          const balances = positionConfig.leaveTypes
            .filter((config: OriginLeaveType) => config.status === "Active")
            .map((config: OriginLeaveType) => {
              const now = dayjs();
              const used = myLeaves
                .filter((l) => {
                  // Normalize types to handle "casual_leave" vs "Casual Leave" mismatch
                  const normalize = (s: string) =>
                    (s || "").toLowerCase().replace(/_/g, " ").trim();
                  if (normalize(l.type) !== normalize(config.leaveTypeId))
                    return false;

                  const status = l.status?.toLowerCase();
                  if (status !== "approved" && status !== "pending")
                    return false;

                  const leaveDate = dayjs(l.startDate);
                  return config.period === "MONTH"
                    ? leaveDate.isSame(now, "month")
                    : leaveDate.isSame(now, "year");
                })
                .reduce((sum, l) => sum + (l.duration || 0), 0);

              return {
                type: config.leaveTypeId,
                allowed: Number(config.unit),
                used,
                remaining: Number(config.unit) - used,
                period: config.period,
              };
            });
          if (isMounted) {
            setLeaveBalances(balances);
          }
        } else {
          if (isMounted) {
            setLeaveBalances([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch leave balances:", error);
      }
    };

    if (user && leaveOrigins) {
      fetchLeaveBalances();
    }

    return () => {
      isMounted = false;
    };
  }, [user, myLeaves, leaveOrigins]);

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
      // Check leave balance before submitting
      const balance = leaveBalances.find(
        (b) => b.type?.toLowerCase() === values.type?.toLowerCase(),
      );
      if (balance && balance.remaining <= 0 && values.type !== "Loss of Pay") {
        message.error(`Cannot apply for ${values.type}. Leave limit reached.`);
        return;
      }

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

  const myLeavesColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => type,
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
      render: (_: any, record: Leave) => {
        if (record.status === "pending" && (canUpdateLeave || canManageLeaves)) {
          return (
            <Button
              size="small"
              danger
              loading={cancellingLeaveId === record.id}
              disabled={!!cancellingLeaveId}
              onClick={() => handleCancel(record.id)}
            >
              Cancel
            </Button>
          );
        }
        return null;
      },
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
      render: (type: string) => type,
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
      render: (_: any, record: Leave) => {
        if (!canApproveLeave) return null;
        
        return (
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
        );
      },
    },
  ];
  const cardStyle = {
    borderRadius: 16,
    //boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div>
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
          <div style={{marginTop:20}}>
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
              if (key === "apply-leave") router.push("/apply-leave");
            }}
            items={[
              ...(canReadLeaveDashboard ? [{
                key: "dashboard",
                label: (
                  <span>
                    <AppstoreOutlined /> Dashboard
                  </span>
                ),
              }] : []),
              ...(canReadLeave ? [{
                key: "leaves",
                label: (
                  <span>
                    <ClockCircleOutlined /> Apply Leave
                  </span>
                ),
              }] : []),
              ...(canReadLeave ? [{
                key: "holidays",
                label: (
                  <span>
                    <ScheduleOutlined /> Government Holidays
                  </span>
                ),
              }] : []),
              ...(canManageLeaves ? [{
                key: "adjustments",
                label: (
                  <span>
                    <EditOutlined /> Leave Adjustment
                  </span>
                ),
              }] : []),
              ...(canReadLeaveType ? [{
                key: "configuration",
                label: (
                  <span>
                    <SettingOutlined /> Leave Types
                  </span>
                ),
              }] : []),
              ...(canReadLeavePolicy ? [{
                key: "positions",
                label: (
                  <span>
                    <ApartmentOutlined /> Leave Policy
                  </span>
                ),
              }] : []),
              ...(canManageLeaves ? [{
                key: "addLeaves",
                label: (
                  <span>
                    <PlusOutlined /> Add Government Leaves
                  </span>
                ),
              }] : []),
              ...(canCreateLeave ? [{
                key: "apply-leave",
                label: (
                  <span>
                    <PlusOutlined /> apply leave
                  </span>
                ),
              }] : []),
            ]}
          />
          </div>
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
              <Card title="Apply Leave" style={{ marginTop: 10, height: 410 }}>
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
                          allowClear
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

                            const isHourly =
                              availableLeaveTypes?.find(
                                (lt: any) => lt.name === value,
                              )?.type === "Hours";
                            // Auto-select HOURS for permission
                            if (isHourly) {
                              form.setFieldsValue({ durationType: "HOURS" });
                              setSelectedDurationType("HOURS");
                            }
                          }}
                        />
                      </Form.Item>
                      {selectedLeaveType && (
                        <div
                          style={{
                            marginTop: -20,
                            marginBottom: 20,
                            paddingLeft: 4,
                          }}
                        >
                          {(() => {
                            const balance = leaveBalances.find(
                              (b) =>
                                b.type?.toLowerCase() ===
                                selectedLeaveType?.toLowerCase(),
                            );
                            if (!balance) return null;
                            return (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Balance: <Text strong>{balance.remaining}</Text>{" "}
                                / {balance.allowed}
                                {balance.period && (
                                  <span style={{ marginLeft: 4 }}>
                                    (
                                    {balance.period === "MONTH"
                                      ? "Monthly"
                                      : "Yearly"}
                                    )
                                  </span>
                                )}
                                {balance.remaining === 0 && (
                                  <Text
                                    type="warning"
                                    style={{ marginLeft: 8 }}
                                  >
                                    (Limit Reached)
                                  </Text>
                                )}
                                {balance.remaining < 0 && (
                                  <Text type="danger" style={{ marginLeft: 8 }}>
                                    (Limit Exceeded)
                                  </Text>
                                )}
                              </Text>
                            );
                          })()}
                        </div>
                      )}
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
                          disabled={isSelectedLeaveHourly}
                          onChange={(value) => {
                            setSelectedDurationType(value);
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={isSelectedLeaveHourly ? 12 : 16}>
                      <Form.Item
                        name="dateRange"
                        label={isSelectedLeaveHourly ? "Date" : "Date Range"}
                        rules={[
                          {
                            required: true,
                            message: isSelectedLeaveHourly
                              ? "Please select date"
                              : "Please select date range",
                          },
                        ]}
                      >
                        {isSelectedLeaveHourly ? (
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

                    {isSelectedLeaveHourly ? (
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
                            max={2}
                          />
                        </Form.Item>
                      </Col>
                    ) : (
                      <Col span={8}>
                        <Form.Item label="Calculated">
                          <div
                            style={{
                              padding: "4px 8px", // ⬇️ reduced
                              background: "#f0f5ff",
                              border: "1px solid #adc6ff",
                              borderRadius: "6px",
                              textAlign: "center",
                              minHeight: 20, // ⬇️ fixed compact height
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
                      style={{ top: 10 }}
                    >
                      Submit Application
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card
                bodyStyle={{ paddingTop: 8 }}
                style={{ marginTop: 10, height: 410 }}
              >
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
                          pagination={{ pageSize: 4 }}
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
                                pagination={{ pageSize: 4 }}
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
                  <strong>Type:</strong> {selectedLeave.type}
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
                  {canApproveLeave && (
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
                  )}
                </div>
              </div>
            )}
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
