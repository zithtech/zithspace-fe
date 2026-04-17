"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  message,
  Tag,
  Typography,
  Avatar,
  Row,
  Col,
  Tooltip,
  Input,
  Popconfirm
} from "antd";
import {
  CheckCircle2,
  Clock,
  Users,
  Search,
  XCircle,
  Check,
  X,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { LeaveRequestService } from "@/services/leaveRequestService";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color, background: `${color}12`, padding: 12, borderRadius: 12 }}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

export default function LeaveApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await LeaveRequestService.getPendingApprovals();
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.fromDate).getTime();
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.fromDate).getTime();
        return dateB - dateA;
      });
      setApprovals(sortedData);
    } catch (err: any) {
      message.error("Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const updateLeaveStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await LeaveRequestService.updateLeaveStatus(id, status);
      message.success(`Leave ${status.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const filteredApprovals = approvals.filter(item => {
    const fullName = `${item.employee.first_name} ${item.employee.last_name}`.toLowerCase();
    const leaveType = (item.leaveType?.name || "").toLowerCase();
    const searchLower = searchText.toLowerCase();
    return fullName.includes(searchLower) || leaveType.includes(searchLower);
  });

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_: any, record: any) => (
        <Space size={12}>
          <Avatar
            src={record.employee.profile_pic}
            icon={<User size={16} />}
            style={{ backgroundColor: "var(--bg-slate-50)", color: "var(--text-slate-400)" }}
          />
          <div>
            <Text strong style={{ color: "var(--text-slate-900)", display: "block" }}>
              {record.employee.first_name} {record.employee.last_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Requested {dayjs(record.createdAt).format("MMM DD, hh:mm A")}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Leave Type",
      dataIndex: ["leaveType", "name"],
      key: "leaveType",
      render: (name: string) => (
        <Tag style={{ borderRadius: 6, background: "var(--bg-slate-50)", border: "1px solid var(--border-slate-100)", color: "var(--text-slate-500)" }}>
          {name}
        </Tag>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-100)" }}>
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{dayjs(record.fromDate).format("MMM DD")}</Text>
          </div>
          <ArrowRight size={14} color="var(--text-slate-400)" />
          <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-100)" }}>
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{dayjs(record.toDate).format("MMM DD, YYYY")}</Text>
          </div>
        </div>
      )
    },
    {
      title: "Total Days",
      key: "totalUnits",
      render: (_: any, record: any) => {
        const units = Number(record.totalUnits) || 0;
        return (
          <Tag style={{ borderRadius: 20, background: "var(--bg-blue-50)", border: "1px solid var(--border-slate-100)", color: "var(--premium-blue)", fontWeight: 600, padding: "0 12px" }}>
            {units} {units === 1 ? 'Day' : 'Days'}
          </Tag>
        );
      }
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ color: "var(--text-slate-500)", maxWidth: 180 }} ellipsis>{text || "No reason provided"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "PENDING" ? "#f59e0b" : status === "APPROVED" ? "#10b981" : "#ef4444";
        const icon = status === "PENDING" ? <Clock size={14} /> : status === "APPROVED" ? <Check size={14} /> : <X size={14} />;
        return (
          <Tag
            icon={icon}
            style={{
              borderRadius: 6,
              background: `${color}12`,
              color: color,
              border: `1px solid ${color}30`,
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Popconfirm
            title="Approve leave?"
            description="This will update the employee's balance."
            onConfirm={() => updateLeaveStatus(record.id, "APPROVED")}
            okText="Approve"
            cancelText="Cancel"
            okButtonProps={{ style: { background: "#10b981", borderColor: "#10b981" } }}
          >
            <Button
              type="text"
              size="small"
              style={{ color: "#10b981", background: "var(--bg-green-50)", borderRadius: 6, fontWeight: 600 }}
              icon={<Check size={14} />}
            >
              Approve
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Reject leave?"
            description="Please provide a reason if required."
            onConfirm={() => updateLeaveStatus(record.id, "REJECTED")}
            okText="Reject"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              style={{ background: "var(--bg-red-50)", borderRadius: 6, fontWeight: 600 }}
              icon={<X size={14} />}
            >
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "var(--bg-secondary)", minHeight: "calc(100vh - 64px)" }}>

          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Space size={14} align="center">
                <div style={{ background: "var(--bg-green-50)", padding: 12, borderRadius: 14, color: "var(--text-holiday)", display: "flex" }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Leave Approvals</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Review and manage pending leave applications from your team.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                placeholder="Search by employee or leave type..."
                prefix={<Search size={16} color="var(--text-slate-400)" />}
                style={{ width: 320, borderRadius: 12, height: 44, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)", color: "var(--text-slate-900)" }}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </div>
          </div>

          {/* Metrics */}
          <Row gutter={[24, 24]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <StatCard
                label="Pending Approvals"
                value={approvals.filter(a => a.status === 'PENDING').length}
                icon={Clock}
                color="#f59e0b"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                label="Approval Velocity"
                value="98%"
                icon={CheckCircle2}
                color="#10b981"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                label="Team on Leave"
                value={approvals.filter(a => a.status === 'APPROVED').length}
                icon={Users}
                color="#7c3aed"
              />
            </Col>
          </Row>

          <Card
            bordered={false}
            style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", overflow: "hidden" }}
            bodyStyle={{ padding: "0" }}
          >
            <Table
              loading={loading}
              columns={columns as any}
              dataSource={filteredApprovals}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, position: ["bottomRight"], style: { padding: "12px 24px", margin: 0 } }}
              rowClassName={() => "history-table-row"}
              scroll={{ x: 1000 }}
            />
          </Card>

          <style dangerouslySetInnerHTML={{
            __html: `
            .history-table-row:hover {
              background-color: var(--bg-slate-50) !important;
            }
            .ant-table-thead > tr > th {
              background-color: var(--bg-slate-50) !important;
              color: var(--text-slate-500) !important;
              font-weight: 600 !important;
              padding: 12px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
            }
            .ant-table-tbody > tr > td {
              padding: 14px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              color: var(--text-slate-900) !important;
            }
            .ant-btn-text:hover { background-color: var(--bg-secondary) !important; }
            .ant-pagination-item a { color: var(--text-slate-500) !important; }
            .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
          `}} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}