"use client";

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Button,
  Table,
  Typography,
  Space,
  Tag,
  Input,
  Popconfirm,
  notification,
  Progress,
} from "antd";
import { 
  Clock, 
  Calendar, 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  History,
  Info,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useLeave } from "@/hooks/useLeave";
import { LeaveBalance, LeaveBalanceService } from "@/services/leaveBalanceService";
import { LeaveRequest, LeaveRequestService } from "@/services/leaveRequestService";

dayjs.extend(isBetween);

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;


export default function LeavePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [api, contextHolder] = notification.useNotification();

  const {
    leaveBalances: initialBalances,
    leaveHistory: initialHistory,
    loading,
    applyLeave,
    submitting,
    cancelLeaveRequest,
  } = useLeave();

  const [currentLeaveBalances, setCurrentLeaveBalances] = useState<LeaveBalance[]>([]);
  const [currentLeaveHistory, setCurrentLeaveHistory] = useState<LeaveRequest[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [dates, setDates] = useState<any>(null);
  const [reason, setReason] = useState("");
  
  // Carousel state
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 4; // Show 4 cards at a time on Desktop

  useEffect(() => {
    setCurrentLeaveBalances(initialBalances);
  }, [initialBalances]);

  useEffect(() => {
    setCurrentLeaveHistory(initialHistory);
  }, [initialHistory]);

  const isDateBooked = (date: dayjs.Dayjs) => {
    return currentLeaveHistory.some((leave) => {
      if (leave.status === "REJECTED" || leave.status === "CANCELLED") return false;
      const from = dayjs(leave.fromDate);
      const to = dayjs(leave.toDate);
      return date.isBetween(from, to, "day", "[]");
    });
  };

  const handleApply = async () => {
    if (!leaveTypeId || !dates || dates.length !== 2) {
      api.error({ message: "Missing Information", description: "Please select leave type and dates." });
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
        duration: 2,
      });
      setDates(null);
      setLeaveTypeId("");
      setReason("");
      LeaveBalanceService.getLeaveBalances().then(setCurrentLeaveBalances);
      LeaveRequestService.getLeaveRequests().then(setCurrentLeaveHistory);
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await cancelLeaveRequest(id);
      api.success({ message: "Leave Withdrawn", duration: 2 });
    } catch (error: any) {
      api.error({ message: "Withdraw Failed", description: error.message });
    }
  };

  const currentEmployeeId = currentLeaveBalances?.[0]?.employeeId || (user as any)?.employeeId || user?.id;
  const processedHistory = currentLeaveHistory.filter(req => !currentEmployeeId || req.employee?.id === currentEmployeeId);

  const historyColumns = [
    {
      title: "Leave Type",
      dataIndex: ["leaveType", "name"],
      key: "leaveType",
      render: (text: string) => <Text strong style={{ color: "#1e293b" }}>{text}</Text>,
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: any, record: LeaveRequest) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "4px 8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <Text style={{ fontSize: 13, color: "#475569" }}>{dayjs(record.fromDate).format("MMM DD")}</Text>
          </div>
          <ArrowRight size={14} color="#94a3b8" />
          <div style={{ padding: "4px 8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <Text style={{ fontSize: 13, color: "#475569" }}>{dayjs(record.toDate).format("MMM DD, YYYY")}</Text>
          </div>
        </div>
      )
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      width: 200,
      render: (text: string) => <Text type="secondary" style={{ fontSize: 13 }}>{text || "—"}</Text>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const configs: any = {
          APPROVED: { color: "#10b981", bg: "#ecfdf5", icon: <CheckCircle2 size={12} /> },
          REJECTED: { color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={12} /> },
          PENDING: { color: "#f59e0b", bg: "#fffbeb", icon: <Clock size={12} /> },
          CANCELLED: { color: "#64748b", bg: "#f1f5f9", icon: <AlertCircle size={12} /> },
        };
        const config = configs[status] || configs.PENDING;
        return (
          <Tag style={{ 
            borderRadius: 20, 
            background: config.bg, 
            color: config.color, 
            border: `1px solid ${config.color}20`,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 600,
            padding: "0 10px"
          }}>
            {config.icon} {status}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "cancel",
      render: (_: any, record: LeaveRequest) => record.status === "PENDING" && (
        <Popconfirm title="Withdraw leave?" onConfirm={() => handleWithdraw(record.id)}>
          <Button type="text" danger size="small" icon={<Trash2 size={14} />} style={{ background: "#fef2f2", borderRadius: 6 }}>
            Withdraw
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Carousel Logic
  const filteredBalances = currentLeaveBalances.filter(
    (lb) => !lb.leaveTypeName.toLowerCase().includes("loss of pay") && lb.leaveTypeId !== "lop"
  );

  const handleBackward = () => setStartIndex(prev => Math.max(0, prev - 1));
  const handleForward = () => setStartIndex(prev => Math.min(filteredBalances.length - visibleCount, prev + 1));

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "#ffffff", minHeight: "calc(100vh - 64px)" }}>
          {contextHolder}

          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Space align="center" size={16}>
              <div style={{ background: "#eff6ff", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                <Clock size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Apply Leave</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Submit and track your leave requests and balances.</Text>
              </div>
            </Space>
          </div>

          {/* Leave Balances Carousel */}
          <div style={{ marginBottom: 32, position: "relative", padding: "0 40px" }}>
            {filteredBalances.length > visibleCount && (
              <>
                <Button 
                  icon={<ChevronLeft size={20} />} 
                  onClick={handleBackward} 
                  disabled={startIndex === 0}
                  style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 44, width: 44, borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Button 
                  icon={<ChevronRight size={20} />} 
                  onClick={handleForward} 
                  disabled={startIndex >= filteredBalances.length - visibleCount}
                  style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 10, height: 44, width: 44, borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
              </>
            )}
            
            <Row gutter={[16, 16]} style={{ overflow: "hidden", flexWrap: "nowrap" }}>
              {filteredBalances
                .slice(startIndex, startIndex + visibleCount)
                .map((balance) => {
                const used = balance.total - balance.balance;
                const percent = balance.total > 0 ? (used / balance.total) * 100 : 0;
                return (
                  <Col key={balance.leaveTypeId} style={{ flex: "0 0 25%", minWidth: 0 }}>
                    <Card
                      bordered={true}
                      style={{ borderRadius: 16, borderColor: "#f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)", overflow: "hidden" }}
                      bodyStyle={{ padding: "16px 20px" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 13, fontWeight: 600, color: "#64748b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {balance.leaveTypeName}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>{balance.balance}</span>
                            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>/ {balance.total}</span>
                          </div>
                        </div>
                        <div style={{ background: "#f1f7ff", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
                          <ClipboardList size={16} />
                        </div>
                      </div>
                      
                      <Progress
                        percent={Number(percent.toFixed(1))}
                        strokeColor="#2563eb"
                        trailColor="#f1f5f9"
                        showInfo={false}
                        size="small"
                        strokeWidth={6}
                        style={{ marginBottom: 6 }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 500 }}>
                        <Text type="secondary">Used: <span style={{ color: "#1e293b" }}>{used}</span></Text>
                        <Text style={{ color: "#2563eb" }}>{Math.round(percent)}%</Text>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space size={10} align="center">
                    <div style={{ background: "#eff6ff", height: 32, width: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                      <Plus size={18} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 16, color: "#1e293b" }}>New Application</span>
                  </Space>
                } 
                bordered={true}
                style={{ borderRadius: 16, borderColor: "#f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", height: "100%" }}
                headStyle={{ borderBottom: "1px solid #f1f5f9", padding: "16px 24px" }}
                bodyStyle={{ padding: "24px" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <Text strong style={{ color: "#475569", display: "block", marginBottom: 8, fontSize: 13 }}>Leave Type</Text>
                    <Select
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select Leave Type"
                      loading={loading}
                      value={leaveTypeId || undefined}
                      onChange={setLeaveTypeId}
                      className="premium-select"
                      options={currentLeaveBalances.map((lb: LeaveBalance) => {
                        const isLOP = lb.leaveTypeId === "lop" || lb.leaveTypeName.toLowerCase().includes("loss of pay");
                        return {
                          label: isLOP 
                            ? lb.leaveTypeName 
                            : `${lb.leaveTypeName} (${lb.balance || 0}/${lb.total || 0})`,
                          value: lb.leaveTypeId,
                          disabled: !isLOP && (!lb.balance || lb.balance <= 0),
                        };
                      })}
                    />
                  </div>

                  <div>
                    <Text strong style={{ color: "#475569", display: "block", marginBottom: 8, fontSize: 13 }}>Select Dates</Text>
                    <RangePicker
                      style={{ width: "100%" }}
                      size="large"
                      value={dates}
                      onChange={setDates}
                      className="premium-select"
                      disabledDate={(current) => current && current < dayjs().startOf("day") || isDateBooked(current)}
                    />
                  </div>

                  <div>
                    <Text strong style={{ color: "#475569", display: "block", marginBottom: 8, fontSize: 13 }}>Reason</Text>
                    <TextArea
                      rows={4}
                      placeholder="Give a brief reason for your leave request..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{ resize: "none", borderRadius: 12, border: "1px solid #e2e8f0" }}
                    />
                  </div>

                  <div style={{ paddingTop: 8 }}>
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleApply}
                      loading={submitting}
                      disabled={!leaveTypeId || !dates}
                      style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
                      icon={<CheckCircle2 size={18} />}
                    >
                      Submit Application
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space size={10} align="center">
                    <div style={{ background: "#f0fdf4", height: 32, width: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                      <History size={18} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 16, color: "#1e293b" }}>Request History</span>
                  </Space>
                }
                bordered={true}
                style={{ borderRadius: 16, borderColor: "#f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", height: "100%" }}
                headStyle={{ borderBottom: "1px solid #f1f5f9", padding: "16px 24px" }}
                bodyStyle={{ padding: "0" }}
              >
                <Table
                  dataSource={processedHistory}
                  columns={historyColumns as any}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 6, position: ["bottomRight"], style: { padding: "16px 24px", margin: 0 } }}
                  rowClassName={() => "history-table-row"}
                />
              </Card>
            </Col>
          </Row>

          <style dangerouslySetInnerHTML={{__html: `
            .history-table-row:hover { background-color: #f8fafc !important; }
            .ant-table-thead > tr > th {
              background-color: #f1f5f9 !important;
              color: #475569 !important;
              font-weight: 600 !important;
              padding: 16px 24px !important;
              border-bottom: 2px solid #e2e8f0 !important;
            }
            .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
            .premium-select { height: 44px !important; border-radius: 12px !important; }
            .premium-select .ant-select-selector { border-radius: 12px !important; height: 44px !important; display: flex !important; alignItems: center !important; }
          `}} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
