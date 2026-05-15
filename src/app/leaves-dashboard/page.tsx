"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Avatar,
  Space,
  Calendar,
  Badge,
  Button,
  Tooltip,
  Divider,
} from "antd";
import { 
  TrendingUpDown, 
  AudioLines, 
  Clock, 
  Users, 
  ArrowRight, 
  ChevronRight,
  Activity,
  Calendar as CalendarIcon,
  CheckCircle2,
  Settings2
} from "lucide-react";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  SettingOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import { useCompanyGovernmentHolidays } from "@/hooks/useCompanyGovernmentHolidays";
import dayjs from "dayjs";
import { useLeaveOrigins } from "@/hooks/useLeaveOrigins";
import { useLeaveAdjustments } from "@/hooks/useLeaveAdjustments";
import { leaveService, Leave as LeaveModel } from "@/services/leaveService";
import { LeaveBalanceService } from "@/services/leaveBalanceService";

// Import images from assets
import bhogiImage from "../../assets/holidays/bhogi.jpg";
import pongalImage from "../../assets/holidays/pongal.jpg";
import mattuPongalImage from "../../assets/holidays/mattupongal.jpg";
import defaultHolidayImage from "../../assets/holidays/default.jpg";

const { Text } = Typography;

const holidayImageMap: { [key: string]: any } = {
  Bhogi: bhogiImage,
  "Thai Pongal": pongalImage,
  "Mattu Pongal": mattuPongalImage,
};

interface DashboardStats {
  totalLeaveTypes: number;
  activeLeaveTypes: number;
  totalPositions: number;
  avgLeavePerPosition: number;
  adjustmentsThisMonth: number;
  credits: number;
  debits: number;
  upcomingHolidays: number;
  activeHolidays: number;
  inactiveHolidays: number;
  nextHoliday?: { name: string; from_date: string };
  isHolidayToday?: boolean;
}

export default function LeavesDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadLeaveDashboard } = usePermission();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [onLeaveToday, setOnLeaveToday] = useState<LeaveModel[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  
  const hasApprovalRights =
    (user as any)?.role === "super_admin" ||
    (user as any)?.role === "admin";

  // Protect route - requires leave.manage permission (admin dashboard)
  useEffect(() => {
    if (!authLoading && !canReadLeaveDashboard) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadLeaveDashboard, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return null;
  }

  // Don't render if no manage permission
  if (!canReadLeaveDashboard) {
    return null;
  }

  const {
    leaveTypes,
    loading: leaveTypesLoading,
    fetchLeaveTypes,
  } = useLeaveTypes();
  const {
    holidays,
    loading: holidaysLoading,
    fetchHolidays,
  } = useCompanyGovernmentHolidays();
  const { leaveOrigins, loading: leaveOriginsLoading } = useLeaveOrigins();
  const { dataSource: adjustments, loading: adjustmentsLoading } =
    useLeaveAdjustments();

  const loading =
    leaveTypesLoading ||
    holidaysLoading ||
    leaveOriginsLoading ||
    adjustmentsLoading;

  useEffect(() => {
    fetchLeaveTypes();
    fetchHolidays();
    
    const fetchDashboardExtras = async () => {
      try {
        setLoadingExtras(true);
        const [pending, allLeaves] = await Promise.all([
          leaveService.getPendingApprovals(),
          leaveService.getAllLeaves({ 
            startDate: dayjs().format("YYYY-MM-DD"),
            endDate: dayjs().format("YYYY-MM-DD"),
            status: "APPROVED"
          })
        ]);
        setPendingApprovalsCount(pending.length);
        setOnLeaveToday(allLeaves.data);
      } catch (err) {
        console.error("Error fetching dashboard extras:", err);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchDashboardExtras();
  }, [fetchLeaveTypes, fetchHolidays]);

  useEffect(() => {
    if (loading || !leaveTypes || !holidays || !leaveOrigins || !adjustments) {
      return;
    }

    const calculateStats = () => {
      // Leave Config Stats
      const totalLeaveTypes = leaveTypes.length;
      const activeLeaveTypes = leaveTypes.filter((lt) => lt.isActive).length;

      // Position Config Stats
      const uniqueOrigins = new Set(leaveOrigins.map((item) => item.origin));
      const totalPositions = uniqueOrigins.size;
      const allLeaveTypeConfigs = leaveOrigins.flatMap(
        (origin) => origin.leaveTypes,
      );
      const totalLeaves = allLeaveTypeConfigs.reduce((sum, p) => {
        const yearlyLeaves =
          p.period === "MONTH" ? Number(p.unit) * 12 : Number(p.unit);
        return sum + yearlyLeaves;
      }, 0);
      const avgLeavePerPosition =
        leaveOrigins.length > 0
          ? Math.round(totalLeaves / leaveOrigins.length)
          : 0;

      // Adjustments Stats
      const adjustmentsThisMonth = adjustments.length;
      const credits = adjustments
        .filter((adj) => adj.type === "Credit")
        .reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0);
      const debits = adjustments
        .filter((adj) => adj.type === "Debit")
        .reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0);

      // Holidays Stats
      const today = dayjs().startOf("day");
      const upcomingHolidays = holidays.filter(
        (h) =>
          h.status === "ACTIVE" &&
          dayjs(h.fromDate).isAfter(today, "day") &&
          dayjs(h.fromDate).diff(today, "day") <= 90,
      ).length;
      const nextHolidayRaw = holidays
        .filter(
          (h) =>
            h.status === "ACTIVE" &&
            (dayjs(h.fromDate).isAfter(today, "day") ||
              dayjs(h.fromDate).isSame(today, "day")),
        )
        .sort(
          (a, b) => dayjs(a.fromDate).valueOf() - dayjs(b.fromDate).valueOf(),
        )[0];

      const nextHoliday = nextHolidayRaw
        ? {
            name: nextHolidayRaw.holidayName,
            from_date: nextHolidayRaw.fromDate,
          }
        : undefined;

      const isHolidayToday = nextHolidayRaw
        ? dayjs(nextHolidayRaw.fromDate).isSame(today, "day")
        : false;

      const activeHolidays = holidays.filter(
        (h) => h.status === "ACTIVE",
      ).length;
      const inactiveHolidays = holidays.length - activeHolidays;

      setStats({
        totalLeaveTypes,
        activeLeaveTypes,
        totalPositions,
        avgLeavePerPosition,
        adjustmentsThisMonth,
        credits,
        debits,
        upcomingHolidays,
        activeHolidays,
        inactiveHolidays,
        nextHoliday,
        isHolidayToday,
      });
    };

    calculateStats();
  }, [loading, leaveTypes, holidays, leaveOrigins, adjustments]);

  const QuickActionCard = ({ icon: Icon, title, desc, path, color }: any) => (
    <Card 
      hoverable 
      className="quick-action-card"
      onClick={() => router.push(path)}
      bodyStyle={{ padding: 20 }}
      style={{ borderRadius: 16, border: "1px solid var(--border-color)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ 
          background: `${color}10`, 
          color: color,
          width: 48, 
          height: 48, 
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text strong style={{ fontSize: 16, display: "block", color: "var(--text-primary)" }}>{title}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{desc}</Typography.Text>
        </div>
        <ChevronRight size={18} style={{ color: "#cbd5e1" }} />
      </div>
    </Card>
  );

  const StatBox = ({ label, value, icon: Icon, color, subText }: any) => (
    <Card bodyStyle={{ padding: 24 }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <Typography.Text style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: 14 }}>{label}</Typography.Text>
        <div style={{ color: color, background: `${color}15`, padding: 8, borderRadius: 10 }}>
          <Icon size={20} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{value}</div>
      {subText && <Typography.Text style={{ fontSize: 12, color: "#94a3b8" }}>{subText}</Typography.Text>}
    </Card>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-pure-white)",
          minHeight: "100vh"
        }}>
          {/* Header & Welcome */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>
                Leave Dashboard
              </Typography.Title>
              <Typography.Text style={{ color: "var(--text-secondary)", fontSize: 15 }}>
                Greetings, {user?.name || "Admin"}! Here&apos;s what&apos;s happening in your workspace today.
              </Typography.Text>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                style={{ borderRadius: 10, height: 44, fontWeight: 500 }}
                onClick={() => router.push("/apply-leave")}
              >
                Apply Leave
              </Button>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {/* Top Metrics Row */}
            <Col xs={24} sm={12} lg={6}>
              <StatBox 
                label="On Leave Today" 
                value={onLeaveToday.length} 
                icon={Users} 
                color="#0ea5e9"
                subText={`${onLeaveToday.length > 0 ? "Employee list updated" : "All staff present"}`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatBox 
                label="Approval Queue" 
                value={pendingApprovalsCount} 
                icon={CheckCircle2} 
                color="#f59e0b"
                subText={`${pendingApprovalsCount} requests awaiting review`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatBox 
                label="Next Holiday" 
                value={stats?.nextHoliday ? dayjs(stats.nextHoliday.from_date).format("DD MMM") : "N/A"} 
                icon={CalendarIcon} 
                color="#ef4444"
                subText={stats?.nextHoliday?.name || "No upcoming holidays"}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatBox 
                label="Active Policies" 
                value={stats?.activeLeaveTypes || 0} 
                icon={Settings2} 
                color="#8b5cf6"
                subText={`${stats?.totalLeaveTypes} total types configured`}
              />
            </Col>

            {/* Main Content Area */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Management Center */}
                <div>
                  <Typography.Title level={4} style={{ marginBottom: 16, color: "#334155" }}>Management Center</Typography.Title>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <QuickActionCard 
                        title="Leave Configuration" 
                        desc="Manage leave types and allocation rules"
                        path="/leave-type"
                        icon={Settings2}
                        color="#8b5cf6"
                      />
                    </Col>
                    <Col span={12}>
                      <QuickActionCard 
                        title="Government Holidays" 
                        desc="View and update company holiday list"
                        path="/government-holidays"
                        icon={CalendarIcon}
                        color="#ef4444"
                      />
                    </Col>
                    <Col span={12}>
                      <QuickActionCard 
                        title="Leave Adjustments" 
                        desc="Manual corrections and comp-offs"
                        path="/leave-adjustments"
                        icon={Activity}
                        color="#0ea5e9"
                      />
                    </Col>
                    <Col span={12}>
                      <QuickActionCard 
                        title="Position Config" 
                        desc="Assign leave rules to designations"
                        path="/leave-policy"
                        icon={ApartmentOutlined}
                        color="#22c55e"
                      />
                    </Col>
                  </Row>
                </div>

                {/* Who's Out Today List */}
                <Card 
                  title={<span style={{ color: "#334155", fontWeight: 600 }}>Who&apos;s on Leave Today</span>}
                  style={{ borderRadius: 16, border: "1px solid var(--border-color)" }}
                  extra={<Tag color="blue" style={{ borderRadius: 6 }}>{onLeaveToday.length} Out</Tag>}
                >
                  <List
                    dataSource={onLeaveToday}
                    locale={{ emptyText: <div style={{ padding: 40, color: "#94a3b8" }}>No employees are on leave today.</div> }}
                    renderItem={(item: LeaveModel) => (
                      <List.Item style={{ padding: "12px 0" }}>
                        <List.Item.Meta
                          avatar={<Avatar size={40} style={{ backgroundColor: "#f0f9ff", color: "#0ea5e9" }}>{item.user?.name[0]}</Avatar>}
                          title={<span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.user?.name}</span>}
                          description={<span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.user?.position || "Staff Member"}</span>}
                        />
                        <Tag style={{ borderRadius: 8, background: "#f1f5f9", border: 0, fontWeight: 500, color: "#475569" }}>
                          {item.type}
                        </Tag>
                        <Tag color="warning" style={{ borderRadius: 8, fontWeight: 500 }}>
                          {item.duration} {item.durationType === "FULL_DAY" ? "Day" : "Half Day"}
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Space>
            </Col>

            {/* Sidebar Column */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Holiday Calendar */}
                <Card 
                  title={<span style={{ color: "#334155", fontWeight: 600 }}>Holiday Calendar</span>}
                  style={{ borderRadius: 16, border: "1px solid var(--border-color)" }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Calendar
                    fullscreen={false}
                    headerRender={({ value, onChange }) => (
                      <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography.Text strong style={{ fontSize: 16, color: "var(--text-primary)" }}>
                          {value.format("MMMM YYYY")}
                        </Typography.Text>
                        <Space>
                          <Button size="small" shape="circle" icon={<ChevronRight style={{ transform: "rotate(180deg)" }} size={14} />} onClick={() => onChange(value.clone().subtract(1, "month"))} />
                          <Button size="small" shape="circle" icon={<ChevronRight size={14} />} onClick={() => onChange(value.clone().add(1, "month"))} />
                        </Space>
                      </div>
                    )}
                    fullCellRender={(value) => {
                      const current = value.startOf("day");
                      const holiday = holidays.find(h => {
                        const start = dayjs(h.fromDate).startOf("day");
                        const end = dayjs(h.toDate || h.fromDate).startOf("day");
                        return h.status === "ACTIVE" && 
                          (current.isSame(start) || current.isSame(end) || (current.isAfter(start) && current.isBefore(end)));
                      });
                      
                      const content = (
                        <div style={{ height: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <div style={{ 
                            width: 28, 
                            height: 28, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            borderRadius: 8,
                            background: holiday ? "#fee2e2" : "transparent",
                            color: holiday ? "#ef4444" : "inherit",
                            fontWeight: holiday ? 600 : 400
                          }}>
                            {value.date()}
                          </div>
                          {holiday && <div style={{ width: 4, height: 4, background: "#ef4444", borderRadius: "50%", marginTop: 2 }}></div>}
                        </div>
                      );

                      return holiday ? (
                        <Tooltip title={holiday.holidayName}>
                          {content}
                        </Tooltip>
                      ) : content;
                    }}
                  />
                </Card>

                {/* Recent Adjustments */}
                <Card 
                  title={<span style={{ color: "#334155", fontWeight: 600 }}>Recent Adjustments</span>}
                  style={{ borderRadius: 16, border: "1px solid var(--border-color)" }}
                  extra={<Typography.Link onClick={() => router.push("/leave-adjustments")}>View All</Typography.Link>}
                >
                  <List
                    dataSource={adjustments.slice(0, 5)}
                    renderItem={(item) => (
                      <List.Item style={{ padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <Typography.Text strong style={{ fontSize: 14, display: "block" }}>{item.employee.split(" (")[0]}</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.leaveType}</Typography.Text>
                          </div>
                          <Tag color={item.type === "Credit" ? "success" : "error"} style={{ borderRadius: 6, border: 0, fontWeight: 600 }}>
                            {item.type === "Credit" ? "+" : "-"}{item.amount}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Space>
            </Col>
          </Row>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .quick-action-card:hover {
            border-color: #0ea5e9 !important;
            transform: translateY(-2px);
            transition: all 0.2s ease;
          }
          .ant-card-head {
            border-bottom: 1px solid #f1f5f9 !important;
            min-height: 56px !important;
          }
          .ant-list-item {
            border-bottom: 1px solid #f8fafc !important;
          }
          .ant-list-item:last-child {
            border-bottom: none !important;
          }
          .ant-picker-calendar-full .ant-picker-panel {
            background: transparent !important;
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
