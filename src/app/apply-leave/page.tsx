"use client";

import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Button,
  Table,
  Segmented,
  Tabs,
  Statistic,
  Typography,
  Space,
  Tag,
  Input,
  Popconfirm,
  notification,
} from "antd";
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  SettingOutlined,
  ApartmentOutlined,
  PlusOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useLeave } from "@/hooks/useLeave";
import {
  LeaveBalance,
  LeaveBalanceService,
} from "@/services/leaveBalanceService";
import {
  LeaveRequest,
  LeaveRequestService,
} from "@/services/leaveRequestService";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const LOP_LEAVE_TYPE_ID = "lop";
export default function LeavePage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    leaveBalances,
    leaveHistory,
    loading,
    applyLeave,
    submitting,
    updateLeaveStatus,
    cancelLeaveRequest,
  } = useLeave();

  const [currentLeaveBalances, setCurrentLeaveBalances] =
    useState<LeaveBalance[]>(leaveBalances);
  const [currentLeaveHistory, setCurrentLeaveHistory] =
    useState<LeaveRequest[]>(leaveHistory);
  const [api, contextHolder] = notification.useNotification();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [dates, setDates] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [activeView, setActiveView] = useState("pending");

  const hasApprovalRights =
    (user as any)?.role === "super_admin" || (user as any)?.role === "admin";

  useEffect(() => {
    setCurrentLeaveBalances(leaveBalances);
  }, [leaveBalances]);

  useEffect(() => {
    setCurrentLeaveHistory(leaveHistory);
  }, [leaveHistory]);

  const effectiveActiveView = hasApprovalRights ? activeView : "history";

  const handleApply = async () => {
    if (!leaveTypeId || !dates || dates.length !== 2) {
      api.error({
        message: "Missing Information",
        description: "Please select leave type and dates.",
        placement: "topRight",
      });
      return;
    }

    const success = await applyLeave({
      leaveTypeId,
      fromDate: dates[0].toISOString(),
      toDate: dates[1].toISOString(),
      reason,
    });

    if (success) {
      api.success({
        message: "Leave Applied Successfully",
        description: `Leave from ${dates[0].format("YYYY-MM-DD")} to ${dates[1].format("YYYY-MM-DD")}`,
        placement: "topRight",
        duration: 2,
      });

      setDates(null);
      setLeaveTypeId("");
      setReason("");

      // refresh data
      LeaveBalanceService.getLeaveBalances().then(setCurrentLeaveBalances);
      LeaveRequestService.getLeaveRequests().then(setCurrentLeaveHistory);
    }
  };

  const pendingRequests = currentLeaveHistory.filter(
    (req) => req.status === "PENDING",
  );
  const processedHistory = currentLeaveHistory;

  const employeeColumn = {
    title: "Employee Name",
    key: "employeeName",
    render: (_: any, record: any) =>
      `${record.employee?.first_name || ""} ${
        record.employee?.last_name || ""
      }`,
  };

  const baseColumns = [
    {
      title: "Leave Type",
      dataIndex: ["leaveType", "name"],
      key: "leaveType",
    },
    {
      title: "From Date",
      dataIndex: "fromDate",
      key: "fromDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "To Date",
      dataIndex: "toDate",
      key: "toDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
    },
  ];

  const statusColumn = {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      let color = "default";
      if (status === "APPROVED") color = "green";
      if (status === "REJECTED") color = "red";
      if (status === "PENDING") color = "orange";
      if (status === "CANCELLED") color = "gray";

      return <Tag color={color}>{status}</Tag>;
    },
  };
  const cancelColumn = {
    title: "Action",
    key: "cancel",
    render: (_: any, record: any) => {
      if (record.status !== "PENDING") return null;

      return (
        <Popconfirm
          title="Cancel this leave?"
          onConfirm={() => handleWithdraw(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger size="small" icon={<DeleteOutlined />}>
            Withdraw
          </Button>
        </Popconfirm>
      );
    },
  };

  const actionColumn = {
    title: "Action",
    key: "action",
    render: (_: any, record: any) => (
      <Space size="middle">
        <Button
          type="primary"
          size="small"
          style={{ backgroundColor: "green", borderColor: "green" }}
          onClick={() => updateLeaveStatus(record.id, "APPROVED")}
        >
          Approve
        </Button>
        <Button
          type="primary"
          danger
          size="small"
          onClick={() => updateLeaveStatus(record.id, "REJECTED")}
        >
          Reject
        </Button>
      </Space>
    ),
  };

  const pendingColumns = hasApprovalRights
    ? [employeeColumn, ...baseColumns, actionColumn]
    : [...baseColumns, cancelColumn];

  const historyColumns = [
    ...baseColumns,
    statusColumn,
    cancelColumn,
  ];
  const handleWithdraw = async (id: string) => {
    try {
      await cancelLeaveRequest(id);

      api.success({
        message: "Leave Withdrawn",
        description: "Your leave request has been withdrawn successfully.",
        placement: "topRight",
        duration: 2,
      });
    } catch (error: any) {
      api.error({
        message: "Withdraw Failed",
        description: error.message || "Could not withdraw leave.",
        placement: "topRight",
      });
    }
  };
  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          {contextHolder}
          <div>
            <Tabs
              activeKey="apply-leave"
              onChange={(key) => {
                const routes: any = {
                  dashboard: "/leaves-dashboard",
                  // leaves: "/leaves",
                  holidays: "/government-holidays",
                  adjustments: "/leave-adjustments",
                  configuration: "/leave-type",
                  positions: "/leave-policy",
                  addLeaves: "/add-goverment-leaves",
                  "apply-leave": "/apply-leave",
                };
                if (routes[key]) router.push(routes[key]);
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
              ]}
            />
          </div>

          <Row gutter={24} >
  
  {/* Apply Leave Card - Left Side */}
  <Col xs={24} lg={10}>
    <Card title="Apply Leave"  style={{ marginTop: 10, height: 410 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Text strong>Leave Type</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Select Leave Type"
            loading={loading}
            value={leaveTypeId || undefined}
            onChange={(value) => setLeaveTypeId(value)}
            options={[
              ...currentLeaveBalances.map((lb: LeaveBalance) => ({
                label: `${lb.leaveTypeName} (${lb.balance || 0}/${lb.total || 0})`,
                value: lb.leaveTypeId,
                disabled: !lb.balance || lb.balance <= 0,
              })),
              {
                label: "Loss Of Pay (LOP)",
                value: LOP_LEAVE_TYPE_ID,
              },
            ]}
          />
        </Col>

        <Col span={24}>
          <Text strong>Select Dates</Text>
          <RangePicker
            style={{ width: "100%", marginTop: 8 }}
            value={dates}
            onChange={(values) => setDates(values)}
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
          />
        </Col>

        <Col span={24}>
          <Text strong>Reason</Text>
          <TextArea
            rows={4}
            placeholder="Enter reason for leave..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </Col>

        <Col span={24}>
          <Button
            type="primary"
            onClick={handleApply}
            loading={submitting}
            disabled={!leaveTypeId || !dates}
          >
            Apply Leave
          </Button>
        </Col>
      </Row>
    </Card>
  </Col>

  {/* Leave Requests Card - Right Side */}
  <Col xs={24} lg={14}>
    <Card title="Leave Requests"
     bodyStyle={{ paddingTop: 8 }}
                style={{ marginTop: 10, height: 410 }}
    >
      <Segmented
        options={
          hasApprovalRights
            ? [
                { label: `Pending (${pendingRequests.length})`, value: "pending" },
                { label: "History", value: "history" },
              ]
            : [{ label: "History", value: "history" }]
        }
        value={effectiveActiveView}
        onChange={(value) => setActiveView(value as string)}
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={
          effectiveActiveView === "pending" ? pendingRequests : processedHistory
        }
        columns={effectiveActiveView === "pending" ? pendingColumns : historyColumns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </Card>
  </Col>

</Row>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
