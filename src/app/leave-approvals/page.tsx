"use client";

import { Table, Card, Button, Space, message, Tabs, Tag } from "antd";
import { useEffect, useState } from "react";
import { LeaveRequestService } from "@/services/leaveRequestService";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  SettingOutlined,
  ApartmentOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

export default function LeaveApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const router = useRouter();
  const { user } = useAuth();

  const hasApprovalRights =
    (user as any)?.role === "super_admin" || (user as any)?.role === "admin";

  const fetchApprovals = async () => {
    const data = await LeaveRequestService.getPendingApprovals();
    
    // Show all requests but sort to display newest first
    const sortedData = data.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.fromDate).getTime();
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.fromDate).getTime();
      return dateB - dateA;
    });
      
    setApprovals(sortedData);
  };

  useEffect(() => {
    fetchApprovals();
  }, []);
  const columns = [
    {
      title: "Employee",
      render: (_: any, record: any) =>
        `${record.employee.first_name} ${record.employee.last_name}`,
    },
    {
      title: "Leave Type",
      dataIndex: ["leaveType", "name"],
    },
    {
      title: "From",
      dataIndex: "fromDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "To",
      dataIndex: "toDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: any, record: any) => {
        let start = dayjs(record.fromDate);
        const end = dayjs(record.toDate);
        let duration = 0;

        if (start.isValid() && end.isValid()) {
          while (start.isBefore(end, "day") || start.isSame(end, "day")) {
            if (start.day() !== 0 && start.day() !== 6) {
              duration++;
            }
            start = start.add(1, "day");
          }
        }
        return `${duration} Day${duration !== 1 ? 's' : ''}`;
      },
    },
    {
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
    },
    {
      title: "Action",
      render: (_: any, record: any) => {
        if (record.status !== "PENDING") return null;

        return (
          <Space>
            <Button
              type="primary"
              onClick={() => updateLeaveStatus(record.id, "APPROVED")}
            >
              Approve
            </Button>
            <Button
              danger
              onClick={() => updateLeaveStatus(record.id, "REJECTED")}
            >
              Reject
            </Button>
          </Space>
        );
      },
    },
  ];
  const updateLeaveStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      await LeaveRequestService.updateLeaveStatus(id, status);
      message.success(`Leave ${status.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          <div>
            <Tabs
              activeKey="approvals"
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
                  approvals: "/leave-approvals",
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
          <Card title="Leave Approvals" style={{ marginTop: 10 }}>
            <Table rowKey="id" dataSource={approvals} columns={columns} />
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}