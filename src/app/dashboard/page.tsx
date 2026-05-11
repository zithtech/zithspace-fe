"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  dashboardService,
  DashboardData,
} from "@/services/dashboardService";
import { useCalendar } from "@/hooks/useCalendar";
import { CalendarService, CalendarProvider } from "@/services/calendarService";
import { DailyUpdateService } from "@/services/dailyUpdateService";
import TicketService from "@/services/ticketService";
import { AttendanceService } from "@/services/attendanceService";
import Organization from "@/components/organaization/Organization";
import LeadService from "@/services/leadService";
import InvoiceService from "@/services/invoiceService";
import { Permissions } from "@/types/permissions";
import { usePermission } from "@/hooks/usePermission";

import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Progress,
  Avatar,
  Tag,
  Button,
  Alert,
  Skeleton,
  Tooltip,
  Segmented,
  Empty,
  theme,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  FormOutlined,
  WalletOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  PlusCircleOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  RocketOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function DashboardContent() {
  const { token } = theme.useToken();
  const { user, hasPermission } = useAuth();
  const { canReadAttendanceDashboard, canClockInOut, canReadAttendance } = usePermission();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [todayUpdates, setTodayUpdates] = useState<{
    bod: any | null;
    eod: any | null;
  }>({
    bod: null,
    eod: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [myTicketsStats, setMyTicketsStats] = useState({
    open: 0,
    closed: 0,
    total: 0,
  });
  const [averageWorkHours, setAverageWorkHours] = useState("00:00:00");

  // ✅ SEGMENT STATE
  const [activeSegment, setActiveSegment] = useState<"me" | "organization" | "freelancer">(
    "me",
  );
  const [isClocking, setIsClocking] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [createdInvoices, setCreatedInvoices] = useState<any[]>([]);

  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    console.log("recentTickets", recentTickets);
  }, [recentTickets]);

  const [workDuration, setWorkDuration] = useState("00:00:00");

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (todayAttendance?.clockInTime && !todayAttendance.clockOutTime) {
      interval = setInterval(() => {
        const now = dayjs();
        const clockIn = dayjs(todayAttendance.clockInTime);
        const duration = now.diff(clockIn);
        const hours = Math.floor(duration / 3600000)
          .toString()
          .padStart(2, "0");
        const minutes = Math.floor((duration % 3600000) / 60000)
          .toString()
          .padStart(2, "0");
        const seconds = Math.floor((duration % 60000) / 1000)
          .toString()
          .padStart(2, "0");
        setWorkDuration(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    } else if (todayAttendance?.clockInTime && todayAttendance.clockOutTime) {
      const clockIn = dayjs(todayAttendance.clockInTime);
      const clockOut = dayjs(todayAttendance.clockOutTime);
      const duration = clockOut.diff(clockIn);
      const hours = Math.floor(duration / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((duration % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((duration % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setWorkDuration(`${hours}:${minutes}:${seconds}`);
    } else {
      setWorkDuration("00:00:00");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [todayAttendance]);

  // NEW: State for connected provider
  const [connectedProvider, setConnectedProvider] = useState<CalendarProvider | null>(null);

  // Dynamic Calendar Integration - works with any connected provider
  const {
    events: calendarEvents,
    loading: calendarLoading,
    syncing: calendarSyncing,
    syncAll: syncCalendar,
    error: calendarError,
    successMessage: calendarSuccess,
  } = useCalendar();

  // NEW: Fetch connected provider on mount
  useEffect(() => {
    const fetchConnectedProvider = async () => {
      const providers: CalendarProvider[] = ['GOOGLE', 'ZOHO', 'MICROSOFT'];
      for (const provider of providers) {
        try {
          const status = await CalendarService.getStatus(provider);
          if (status.connected) {
            setConnectedProvider(provider);
            break;
          }
        } catch (error) {
          console.error(`Failed to get ${provider} status:`, error);
        }
      }
    };

    fetchConnectedProvider();
  }, []);

  // Filter today's meetings with recurring support
  const todaysMeetings = calendarEvents.reduce((acc: any[], event: any) => {
    // Filter: User must be an attendee or the creator
    const isUserAttendee =
      event.attendees?.includes(user?.email) || event.userId === user?.id;
    if (!isUserAttendee) return acc;

    const today = dayjs().startOf("day");
    const start = dayjs(event.startTime);
    const end = dayjs(event.endTime);
    const exdates = Array.isArray(event.exdate)
      ? event.exdate
      : event.exdate
        ? [event.exdate]
        : [];

    // 1. Direct match
    if (start.isSame(today, "day")) {
      const isExcluded = exdates.some((ex: string) =>
        dayjs(ex).isSame(today, "day"),
      );
      if (!isExcluded) acc.push(event);
      return acc;
    }

    // 2. Recurring match
    if (
      event.isRecurring &&
      event.rrule &&
      start.isBefore(today.endOf("day"))
    ) {
      const isExcluded = exdates.some((ex: string) =>
        dayjs(ex).isSame(today, "day"),
      );
      if (isExcluded) return acc;

      let isMatch = false;
      if (event.rrule.includes("FREQ=DAILY")) {
        isMatch = true;
      } else if (event.rrule.includes("FREQ=WEEKLY")) {
        const dayMap: Record<string, number> = {
          SU: 0,
          MO: 1,
          TU: 2,
          WE: 3,
          TH: 4,
          FR: 5,
          SA: 6,
        };
        const match = event.rrule.match(/BYDAY=([^;]+)/);
        if (match) {
          const days = match[1].split(",");
          isMatch = days.some((d: string) => dayMap[d] === today.day());
        } else {
          isMatch = start.day() === today.day();
        }
      }

      if (isMatch) {
        const duration = end.diff(start);
        const occurrenceStart = today
          .hour(start.hour())
          .minute(start.minute())
          .second(start.second());
        const occurrenceEnd = occurrenceStart.add(duration, "ms");

        acc.push({
          ...event,
          startTime: occurrenceStart.toISOString(),
          endTime: occurrenceEnd.toISOString(),
        });
      }
    }
    return acc;
  }, []);

  useEffect(() => {
    if (
      dashboardData?.projectProgress &&
      dashboardData.projectProgress.length > 0 &&
      !selectedProjectId
    ) {
      setSelectedProjectId(dashboardData.projectProgress[0].id);
    }
  }, [dashboardData]);

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const attendance = await AttendanceService.getTodayAttendance();
        setTodayAttendance(attendance);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      }
    };

    if (user && (canReadAttendance || canClockInOut)) {
      fetchTodayAttendance();
    } else {
      setLoading(false);
    }
  }, [user, canReadAttendance, canClockInOut]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        try {
          setLoading(true);
          setError(null);
          const data = await dashboardService.getDashboardSummary();
          setDashboardData(data);
        } catch (err: any) {
          console.error("Failed to fetch dashboard data:", err);
          setError(err.message || "Failed to load dashboard data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const fetchTodayUpdate = async () => {
      if (user) {
        try {
          const today = new Date().toISOString().split("T")[0];

          const updates = await DailyUpdateService.getMyUpdates({
            date: today,
          });

          const bodUpdate = updates.find(
            (item: any) => item.updateType === "BOD",
          );

          const eodUpdate = updates.find(
            (item: any) => item.updateType === "EOD",
          );

          setTodayUpdates({
            bod: bodUpdate || null,
            eod: eodUpdate || null,
          });
        } catch (e) {
          console.log("Error", e);
        }
      }
    };

    fetchTodayUpdate();
  }, [user]);

  useEffect(() => {
    const fetchMyTicketsStats = async () => {
      if (user) {
        try {
          const [all, completed, live] = await Promise.all([
            TicketService.getMyTickets({ limit: 1 }),
            TicketService.getMyTickets({ status: "completed", limit: 1 }),
            TicketService.getMyTickets({ status: "live", limit: 1 }),
          ]);

          const total = all.pagination.total;
          const closed = completed.pagination.total + live.pagination.total;
          const open = total - closed;

          setMyTicketsStats({ open, closed, total });
        } catch (e) {
          console.error("Failed to fetch my tickets stats", e);
          setMyTicketsStats({ open: 0, closed: 0, total: 0 });
        }
      }
    };

    fetchMyTicketsStats();
  }, [user]);

  useEffect(() => {
    const get5DaysAverage = async () => {
      if (user) {
        try {
          const getAverageWorkingHours =
            await AttendanceService.getLast5DaysAverage();
          if (getAverageWorkingHours && getAverageWorkingHours.averageHours) {
            setAverageWorkHours(getAverageWorkingHours.averageHours);
          }
        } catch (error) {
          console.error("Failed to fetch last 5 days average", error);
        }
      }
    };
    get5DaysAverage();
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchRecentTickets = async () => {
        try {
          const response = await TicketService.getMyTickets({
            page: 1,
            limit: 20,
          });
          setTickets(response.data);
          setRecentTickets(response.data.slice(0, 5));
        } catch (error) {
          console.error("Failed to fetch recent tickets", error);
        }
      };

      fetchRecentTickets();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeSegment === "freelancer") {
      const fetchFreelancerData = async () => {
        try {
          const [leads, invoices] = await Promise.all([
            LeadService.getAll(),
            InvoiceService.getInvoices({ limit: 5 })
          ]);
          setRecentLeads((leads as any).data || leads);
          setCreatedInvoices(invoices.data);
        } catch (error) {
          console.error("Failed to fetch freelancer data", error);
        }
      };

      fetchFreelancerData();
    }
  }, [user, activeSegment]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ff4d4f";
      case "medium":
        return "#faad14";
      case "low":
        return "#52c41a";
      default:
        return "#8c8c8c";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60)
      return `${diffMins}m ago`;
    if (diffHours < 24)
      return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleClockIn = async () => {
    setIsClocking(true);
    try {
      const newAttendance = await AttendanceService.clockIn();
      setTodayAttendance(newAttendance);
    } catch (error) {
      console.error("Failed to clock in", error);
      setError("Failed to clock in. Please try again.");
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    setIsClocking(true);
    try {
      const newAttendance = await AttendanceService.clockOut();
      setTodayAttendance(newAttendance);
    } catch (error) {
      console.error("Failed to clock out", error);
      setError("Failed to clock out. Please try again.");
    } finally {
      setIsClocking(false);
    }
  };

  // ─── Premium Layout Helpers ───────────────────────────────────────────
  const hour = dayjs().hour();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    user?.name?.split(" ")[0] || user?.name || "there";

  const heroSubtext = todayAttendance?.canClockOut
    ? `You're clocked in — ${workDuration} elapsed today.`
    : todayAttendance?.canClockIn
      ? "Ready when you are. Clock in to start your day."
      : todayAttendance && !todayAttendance.canClockIn && !todayAttendance.canClockOut
        ? "Shift wrapped — nice work today."
        : "Here's a quick look at what's on your plate.";

  const totalTickets = tickets.length;
  const completedTickets = tickets.filter((t) =>
    ["completed", "live", "done"].includes(t.status?.toLowerCase()),
  ).length;
  const inProgressTickets = tickets.filter(
    (t) =>
      t.status?.toLowerCase() === "in_progress" ||
      t.status?.toLowerCase() === "doing",
  ).length;
  const blockedTickets = tickets.filter(
    (t) => t.status?.toLowerCase() === "blocked",
  ).length;
  const completionRate =
    totalTickets > 0
      ? Math.round((completedTickets / totalTickets) * 100)
      : 0;

  const cardBase: React.CSSProperties = {
    borderRadius: 16,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  };

  const sectionTitle = (
    icon: React.ReactNode,
    label: string,
    accent?: string,
  ) => (
    <Space size={10} align="center">
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: accent ? `${accent}14` : token.colorFillAlter,
          border: `1px solid ${accent ? `${accent}33` : token.colorBorderSecondary}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent || token.colorTextSecondary,
          fontSize: 13,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: token.colorText,
          letterSpacing: "-0.1px",
        }}
      >
        {label}
      </span>
    </Space>
  );

  const KpiCard = ({
    eyebrow,
    value,
    trend,
    trendTone = "neutral",
    icon,
    accent,
  }: {
    eyebrow: string;
    value: React.ReactNode;
    trend?: string;
    trendTone?: "positive" | "neutral" | "warning";
    icon: React.ReactNode;
    accent: string;
  }) => {
    const trendColors: Record<string, { bg: string; fg: string }> = {
      positive: { bg: "#ECFDF5", fg: "#047857" },
      neutral: { bg: token.colorFillAlter, fg: token.colorTextSecondary },
      warning: { bg: "#FEF3C7", fg: "#92400E" },
    };
    const tc = trendColors[trendTone];
    return (
      <Card
        size="small"
        style={{ ...cardBase, height: "100%" }}
        styles={{ body: { padding: "14px 16px" } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: token.colorTextSecondary,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: `${accent}14`,
              border: `1px solid ${accent}26`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              fontSize: 14,
            }}
          >
            {icon}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.05,
              color: token.colorText,
              letterSpacing: "-0.6px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
          {trend && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 999,
                background: tc.bg,
                color: tc.fg,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {trend}
            </span>
          )}
        </div>
      </Card>
    );
  };

  const QuickActionCard = ({
    icon,
    title,
    desc,
    onClick,
    accent,
  }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    onClick: () => void;
    accent: string;
  }) => (
    <Card
      hoverable
      style={{ ...cardBase, cursor: "pointer" }}
      styles={{ body: { padding: "14px 16px" } }}
      onClick={onClick}
      className="quick-action-card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${accent}14`,
            border: `1px solid ${accent}26`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: token.colorText,
              display: "block",
              lineHeight: 1.3,
            }}
          >
            {title}
          </Text>
          <Text
            type="secondary"
            style={{ fontSize: 11, lineHeight: 1.3 }}
          >
            {desc}
          </Text>
        </div>
        <ArrowRightOutlined
          style={{ fontSize: 12, color: token.colorTextTertiary }}
        />
      </div>
    </Card>
  );

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          padding: "16px 32px 40px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* ─── Hero Header ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: token.colorText,
                  fontWeight: 700,
                  letterSpacing: "-0.6px",
                  fontSize: 26,
                }}
              >
                {greeting}, {firstName} 👋
              </Title>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                  }}
                  className="live-pulse"
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: token.colorTextSecondary,
                    letterSpacing: "0.2px",
                  }}
                >
                  {dayjs().format("dddd, MMM D")}
                </Text>
              </div>
            </div>
            <Text
              style={{
                fontSize: 13,
                color: token.colorTextSecondary,
                marginTop: 6,
                display: "block",
              }}
            >
              {heroSubtext}
            </Text>
          </div>

          <Segmented
            size="large"
            options={[
              { label: "Me", value: "me", icon: <UserOutlined /> },
              { label: "Freelancer", value: "freelancer", icon: <SolutionOutlined /> },
              {
                label: "Organization",
                value: "organization",
                icon: <TeamOutlined />,
              },
            ]}
            value={activeSegment}
            onChange={(value) =>
              setActiveSegment(value as "me" | "organization" | "freelancer")
            }
            style={{
              padding: 4,
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorFillAlter,
            }}
          />
        </div>

        {/* ─── ME SEGMENT ───────────────────────────────────────── */}
        {activeSegment === "me" && (
          <>
            {/* Alerts */}
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 16, borderRadius: 12 }}
              />
            )}
            {calendarError && (
              <Alert
                message="Calendar Error"
                description={calendarError}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 16, borderRadius: 12 }}
              />
            )}
            {calendarSuccess && (
              <Alert
                message="Success"
                description={calendarSuccess}
                type="success"
                showIcon
                closable
                style={{ marginBottom: 16, borderRadius: 12 }}
              />
            )}

            {loading ? (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                      <Card
                        size="small"
                        style={{ ...cardBase }}
                        styles={{ body: { padding: 18 } }}
                      >
                        <Skeleton active paragraph={{ rows: 1 }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Card style={cardBase}>
                      <Skeleton active paragraph={{ rows: 5 }} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card style={cardBase}>
                      <Skeleton active paragraph={{ rows: 5 }} />
                    </Card>
                  </Col>
                </Row>
              </>
            ) : dashboardData ? (
              <>
                {/* ─── KPI Strip ──────────────────────────────────── */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  {/* BOD / EOD */}
                  <Col xs={24} sm={12} lg={6}>
                    <Card
                      style={{ ...cardBase, height: "100%" }}
                      styles={{ body: { padding: "14px 16px" } }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: token.colorTextSecondary,
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                          }}
                        >
                          Daily Updates
                        </Text>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 9,
                            background: "#EEF2FF",
                            border: "1px solid #C7D2FE",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#4F46E5",
                            fontSize: 13,
                          }}
                        >
                          <ThunderboltFilled />
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                        }}
                      >
                        {[
                          { label: "BOD", state: todayUpdates.bod },
                          { label: "EOD", state: todayUpdates.eod },
                        ].map((item) => (
                          <div
                            key={item.label}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 10,
                              background: token.colorFillAlter,
                              border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: token.colorTextSecondary,
                                letterSpacing: "0.5px",
                              }}
                            >
                              {item.label}
                            </Text>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 4,
                              }}
                            >
                              {item.state ? (
                                <CheckCircleFilled
                                  style={{ fontSize: 11, color: "#10B981" }}
                                />
                              ) : (
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#F59E0B",
                                    display: "inline-block",
                                  }}
                                />
                              )}
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: item.state ? "#10B981" : "#F59E0B",
                                }}
                              >
                                {item.state ? "Submitted" : "Pending"}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>

                  {/* Avg Working Hours */}
                  <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                      eyebrow="Avg Working Hours"
                      value={averageWorkHours}
                      trend="Last 5 days"
                      trendTone="neutral"
                      icon={<ClockCircleOutlined />}
                      accent="#0EA5E9"
                    />
                  </Col>

                  {/* My Tickets */}
                  <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                      eyebrow="Tickets · Closed / Total"
                      value={`${myTicketsStats.closed} / ${myTicketsStats.total}`}
                      trend={
                        dashboardData.trends.ticketCompletionRate || "—"
                      }
                      trendTone="positive"
                      icon={<TrophyOutlined />}
                      accent="#7C3AED"
                    />
                  </Col>

                  {/* Today's Attendance */}
                  {(canReadAttendanceDashboard || canReadAttendance) && (
                    <Col xs={24} sm={12} lg={6}>
                      <KpiCard
                        eyebrow="Team Attendance"
                        value={`${dashboardData.stats.attendance.present} / ${dashboardData.stats.totalMembers}`}
                        trend={`${dashboardData.stats.attendance.attendanceRate}% Present`}
                        trendTone="positive"
                        icon={<TeamOutlined />}
                        accent="#10B981"
                      />
                    </Col>
                  )}
                </Row>

                {/* ─── Main Grid ──────────────────────────────────── */}
                <Row gutter={[16, 16]}>
                  {/* Time Tracker */}
                  {(canReadAttendance || canClockInOut) && (
                    <Col xs={24} lg={8}>
                      <Card
                        style={{
                          ...cardBase,
                          background: todayAttendance?.canClockOut
                            ? `linear-gradient(135deg, ${token.colorPrimaryBg}33 0%, ${token.colorBgContainer} 60%)`
                            : token.colorBgContainer,
                          overflow: "hidden",
                          position: "relative",
                          height: 340,
                          display: "flex",
                          flexDirection: "column",
                        }}
                        styles={{ body: { padding: 18, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                      >
                        {todayAttendance?.canClockOut && (
                          <div
                            aria-hidden
                            style={{
                              position: "absolute",
                              top: -40,
                              right: -40,
                              width: 220,
                              height: 220,
                              borderRadius: "50%",
                              background: `radial-gradient(circle, ${token.colorPrimary}1A 0%, transparent 70%)`,
                              pointerEvents: "none",
                            }}
                          />
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 20,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          {sectionTitle(
                            <ClockCircleOutlined />,
                            "Daily Attendance",
                            token.colorPrimary,
                          )}
                          {todayAttendance && (
                            <Tag
                              style={{
                                borderRadius: 999,
                                border: "none",
                                padding: "2px 10px",
                                fontWeight: 600,
                                fontSize: 11,
                                background: todayAttendance.canClockOut
                                  ? "#ECFDF5"
                                  : todayAttendance.canClockIn
                                    ? token.colorFillAlter
                                    : "#F0F9FF",
                                color: todayAttendance.canClockOut
                                  ? "#047857"
                                  : todayAttendance.canClockIn
                                    ? token.colorTextSecondary
                                    : "#0369A1",
                              }}
                            >
                              {todayAttendance.canClockOut && (
                                <span
                                  className="live-pulse"
                                  style={{
                                    display: "inline-block",
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "#10B981",
                                    marginRight: 6,
                                  }}
                                />
                              )}
                              {todayAttendance.canClockIn
                                ? "Not Clocked In"
                                : todayAttendance.canClockOut
                                  ? "Active Now"
                                  : "Shift Completed"}
                            </Tag>
                          )}
                        </div>

                        {todayAttendance ? (
                          (() => {
                            const TARGET_HOURS = 8;
                            const parts = (workDuration || "00:00:00").split(":");
                            const elapsedSec =
                              (parseInt(parts[0] || "0", 10) || 0) * 3600 +
                              (parseInt(parts[1] || "0", 10) || 0) * 60 +
                              (parseInt(parts[2] || "0", 10) || 0);
                            const targetSec = TARGET_HOURS * 3600;
                            const progressPct = Math.min(
                              100,
                              Math.round((elapsedSec / targetSec) * 100),
                            );
                            const remainingSec = Math.max(0, targetSec - elapsedSec);
                            const remH = Math.floor(remainingSec / 3600)
                              .toString()
                              .padStart(2, "0");
                            const remM = Math.floor((remainingSec % 3600) / 60)
                              .toString()
                              .padStart(2, "0");
                            const isActive = !!todayAttendance.canClockOut;
                            const ringColor = isActive
                              ? token.colorPrimary
                              : todayAttendance.canClockIn
                                ? token.colorTextTertiary
                                : "#10B981";
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                  position: "relative",
                                  zIndex: 1,
                                  flex: 1,
                                  justifyContent: "space-between",
                                }}
                              >
                                {/* Hero ring with timer */}
                                <div
                                  style={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                  }}
                                >
                                  <div style={{ position: "relative" }}>
                                    <Progress
                                      type="circle"
                                      percent={progressPct}
                                      size={108}
                                      strokeWidth={6}
                                      strokeLinecap="round"
                                      strokeColor={
                                        isActive
                                          ? {
                                              "0%": token.colorPrimary,
                                              "100%": "#7C3AED",
                                            }
                                          : ringColor
                                      }
                                      trailColor={token.colorFillAlter}
                                      format={() => (
                                        <div>
                                          <div
                                            style={{
                                              fontSize: 16,
                                              fontWeight: 700,
                                              lineHeight: 1,
                                              color: isActive
                                                ? token.colorPrimary
                                                : token.colorText,
                                              letterSpacing: "-0.4px",
                                              fontVariantNumeric: "tabular-nums",
                                            }}
                                          >
                                            {workDuration || "00:00:00"}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 8,
                                              color: token.colorTextTertiary,
                                              fontWeight: 700,
                                              letterSpacing: "0.4px",
                                              marginTop: 3,
                                              fontVariantNumeric: "tabular-nums",
                                            }}
                                          >
                                            {progressPct}% / {TARGET_HOURS}h
                                          </div>
                                        </div>
                                      )}
                                    />
                                    {isActive && (
                                      <span
                                        className="live-pulse"
                                        style={{
                                          position: "absolute",
                                          top: 8,
                                          right: 8,
                                          width: 7,
                                          height: 7,
                                          borderRadius: "50%",
                                          background: "#10B981",
                                          boxShadow:
                                            "0 0 0 3px rgba(16, 185, 129, 0.18)",
                                        }}
                                      />
                                    )}
                                  </div>
                                  <Text
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 700,
                                      color: token.colorTextSecondary,
                                      letterSpacing: "0.5px",
                                      textTransform: "uppercase",
                                      marginTop: 6,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {isActive
                                      ? `${remH}h ${remM}m to target`
                                      : todayAttendance.canClockIn
                                        ? "Session not started"
                                        : "Daily target reached"}
                                  </Text>
                                </div>

                                {/* In / Out session pills */}
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 8,
                                  }}
                                >
                                  {[
                                    {
                                      icon: <LoginOutlined />,
                                      label: "Clock In",
                                      color: "#10B981",
                                      time: todayAttendance.clockInTime,
                                    },
                                    {
                                      icon: <LogoutOutlined />,
                                      label: "Clock Out",
                                      color: "#EF4444",
                                      time: todayAttendance.clockOutTime,
                                    },
                                  ].map((s) => (
                                    <div
                                      key={s.label}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 10px",
                                        borderRadius: 10,
                                        background: token.colorFillAlter,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 26,
                                          height: 26,
                                          borderRadius: 8,
                                          background: `${s.color}14`,
                                          border: `1px solid ${s.color}33`,
                                          color: s.color,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 12,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {s.icon}
                                      </div>
                                      <div style={{ minWidth: 0 }}>
                                        <Text
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: "0.5px",
                                            color: token.colorTextSecondary,
                                            textTransform: "uppercase",
                                            display: "block",
                                            lineHeight: 1,
                                          }}
                                        >
                                          {s.label}
                                        </Text>
                                        <Text
                                          strong
                                          style={{
                                            fontSize: 12,
                                            color: token.colorText,
                                            fontVariantNumeric: "tabular-nums",
                                            letterSpacing: "-0.2px",
                                            display: "block",
                                            marginTop: 2,
                                          }}
                                        >
                                          {s.time
                                            ? dayjs(s.time).format("hh:mm A")
                                            : "--:-- --"}
                                        </Text>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Action */}
                                <div>
                                  {todayAttendance.canClockIn ? (
                                    <Button
                                      type="primary"
                                      block
                                      icon={<PlayCircleOutlined />}
                                      onClick={handleClockIn}
                                      loading={isClocking}
                                      style={{
                                        borderRadius: 10,
                                        height: 40,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        boxShadow: `0 6px 16px -8px ${token.colorPrimary}99`,
                                        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #7C3AED 100%)`,
                                        border: "none",
                                      }}
                                    >
                                      Start Workday
                                    </Button>
                                  ) : todayAttendance.canClockOut ? (
                                    <Button
                                      danger
                                      block
                                      icon={<PauseCircleOutlined />}
                                      onClick={handleClockOut}
                                      loading={isClocking}
                                      style={{
                                        borderRadius: 10,
                                        height: 40,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        boxShadow:
                                          "0 6px 16px -8px rgba(239, 68, 68, 0.55)",
                                      }}
                                    >
                                      End Shift · Clock Out
                                    </Button>
                                  ) : (
                                    <div
                                      style={{
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        background: "#ECFDF5",
                                        border: "1px solid #A7F3D0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        color: "#047857",
                                        fontWeight: 600,
                                        fontSize: 12,
                                      }}
                                    >
                                      <CheckCircleFilled />
                                      <span>Shift Complete · Great work!</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <Skeleton active paragraph={{ rows: 3 }} />
                        )}
                      </Card>
                    </Col>
                  )}

                  {/* Today's Meetings */}
                  <Col xs={24} lg={8}>
                    <Card
                      style={{ ...cardBase, height: 340, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                      title={sectionTitle(
                        <VideoCameraOutlined />,
                        "Today's Meetings",
                        "#7C3AED",
                      )}
                          extra={
                            connectedProvider ? (
                              <Space size={4}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={
                                    <ClockCircleOutlined
                                      style={{ fontSize: 11 }}
                                    />
                                  }
                                  onClick={() =>
                                    syncCalendar(connectedProvider)
                                  }
                                  loading={calendarSyncing}
                                  style={{ fontSize: 11 }}
                                >
                                  Sync
                                </Button>
                                <Button
                                  type="text"
                                  size="small"
                                  onClick={() => router.push("/calendar")}
                                  style={{ fontSize: 11 }}
                                >
                                  View
                                </Button>
                              </Space>
                            ) : (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => router.push("/integrations")}
                                style={{ fontSize: 11 }}
                              >
                                Connect
                              </Button>
                            )
                          }
                        >
                          <div
                            style={{
                              flex: 1,
                              overflowY: "auto",
                              padding: 0,
                            }}
                            className="no-scrollbar"
                          >
                            {calendarLoading ? (
                              <div style={{ padding: 16 }}>
                                <Skeleton active paragraph={{ rows: 3 }} />
                              </div>
                            ) : !connectedProvider ? (
                              <div
                                style={{
                                  padding: 24,
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: token.colorFillAlter,
                                    margin: "0 auto 12px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: token.colorTextTertiary,
                                  }}
                                >
                                  <VideoCameraOutlined
                                    style={{ fontSize: 22 }}
                                  />
                                </div>
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                    display: "block",
                                    marginBottom: 12,
                                  }}
                                >
                                  Connect your calendar to see today's meetings
                                </Text>
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() =>
                                    router.push("/integrations")
                                  }
                                  style={{ borderRadius: 8 }}
                                >
                                  Connect Calendar
                                </Button>
                              </div>
                            ) : todaysMeetings.length > 0 ? (
                              (() => {
                                const now = dayjs();
                                const sorted = [...todaysMeetings].sort(
                                  (a: any, b: any) =>
                                    dayjs(a.startTime).valueOf() -
                                    dayjs(b.startTime).valueOf(),
                                );
                                const isLive = (m: any) =>
                                  dayjs(m.startTime).isBefore(now) &&
                                  dayjs(m.endTime).isAfter(now);
                                const isPast = (m: any) =>
                                  dayjs(m.endTime).isBefore(now);
                                const liveMeeting = sorted.find(isLive);
                                const upcoming = sorted.filter((m: any) =>
                                  dayjs(m.startTime).isAfter(now),
                                );
                                const ended = sorted.filter(isPast);
                                const heroMeeting = liveMeeting || upcoming[0];
                                const restMeetings = sorted.filter(
                                  (m: any) => m !== heroMeeting,
                                );

                                const formatRelative = (m: any) => {
                                  const s = dayjs(m.startTime);
                                  const e = dayjs(m.endTime);
                                  if (s.isBefore(now) && e.isAfter(now)) {
                                    const minLeft = e.diff(now, "minute");
                                    return `${minLeft}m left`;
                                  }
                                  if (s.isAfter(now)) {
                                    const diff = s.diff(now, "minute");
                                    if (diff < 60) return `in ${diff}m`;
                                    const h = Math.floor(diff / 60);
                                    const mm = diff % 60;
                                    return mm
                                      ? `in ${h}h ${mm}m`
                                      : `in ${h}h`;
                                  }
                                  const minAgo = now.diff(e, "minute");
                                  if (minAgo < 60) return `${minAgo}m ago`;
                                  return `${Math.floor(minAgo / 60)}h ago`;
                                };

                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 10,
                                      padding: "10px 14px 14px",
                                    }}
                                  >
                                    {/* Summary row */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 700,
                                          color: token.colorTextSecondary,
                                          letterSpacing: "0.6px",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        {sorted.length} meeting
                                        {sorted.length !== 1 ? "s" : ""}
                                        {liveMeeting && " · 1 live"}
                                        {!liveMeeting && upcoming.length > 0 &&
                                          ` · ${upcoming.length} upcoming`}
                                      </Text>
                                      {ended.length > 0 && (
                                        <Text
                                          style={{
                                            fontSize: 10,
                                            color: token.colorTextTertiary,
                                            fontWeight: 600,
                                          }}
                                        >
                                          {ended.length} done
                                        </Text>
                                      )}
                                    </div>

                                    {/* Hero meeting */}
                                    {heroMeeting &&
                                      (() => {
                                        const live = isLive(heroMeeting);
                                        const start = dayjs(heroMeeting.startTime);
                                        const end = dayjs(heroMeeting.endTime);
                                        const totalMin = Math.max(
                                          1,
                                          end.diff(start, "minute"),
                                        );
                                        const progressPct = live
                                          ? Math.min(
                                              100,
                                              Math.round(
                                                (now.diff(start, "minute") /
                                                  totalMin) *
                                                  100,
                                              ),
                                            )
                                          : 0;
                                        return (
                                          <div
                                            style={{
                                              position: "relative",
                                              borderRadius: 12,
                                              padding: 12,
                                              background: token.colorFillAlter,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                              overflow: "hidden",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginBottom: 4,
                                              }}
                                            >
                                              <Tooltip title={heroMeeting.title}>
                                                <div
                                                  style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: token.colorText,
                                                    letterSpacing: "-0.2px",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                  }}
                                                >
                                                  {heroMeeting.title}
                                                </div>
                                              </Tooltip>
                                              <span
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  gap: 5,
                                                  padding: "2px 8px",
                                                  borderRadius: 999,
                                                  background: live
                                                    ? "#ECFDF5"
                                                    : "rgba(79,70,229,0.10)",
                                                  border: live
                                                    ? "1px solid #A7F3D0"
                                                    : "1px solid rgba(79,70,229,0.25)",
                                                  color: live
                                                    ? "#047857"
                                                    : "#4F46E5",
                                                  fontSize: 9,
                                                  fontWeight: 700,
                                                  letterSpacing: "0.6px",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                <span
                                                  className={
                                                    live ? "live-pulse" : ""
                                                  }
                                                  style={{
                                                    width: 5,
                                                    height: 5,
                                                    borderRadius: "50%",
                                                    background: live
                                                      ? "#10B981"
                                                      : "#4F46E5",
                                                  }}
                                                />
                                                {live ? "LIVE NOW" : "NEXT UP"}
                                              </span>
                                              <Text
                                                style={{
                                                  fontSize: 10,
                                                  color: token.colorTextSecondary,
                                                  fontWeight: 600,
                                                  fontVariantNumeric:
                                                    "tabular-nums",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                {formatRelative(heroMeeting)}
                                              </Text>
                                            </div>

                                            <Text
                                              style={{
                                                fontSize: 11,
                                                color: token.colorTextSecondary,
                                                fontVariantNumeric:
                                                  "tabular-nums",
                                                fontWeight: 500,
                                                display: "block",
                                              }}
                                            >
                                              {start.format("h:mm A")} —{" "}
                                              {end.format("h:mm A")} ·{" "}
                                              {totalMin}m
                                            </Text>

                                            {live && (
                                              <div
                                                style={{
                                                  marginTop: 8,
                                                  height: 4,
                                                  background: token.colorBgContainer,
                                                  border: `1px solid ${token.colorBorderSecondary}`,
                                                  borderRadius: 999,
                                                  overflow: "hidden",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    height: "100%",
                                                    width: `${progressPct}%`,
                                                    background: token.colorPrimary,
                                                    borderRadius: 999,
                                                    transition:
                                                      "width 1s linear",
                                                  }}
                                                />
                                              </div>
                                            )}

                                            <Tooltip
                                              title={
                                                heroMeeting.meetingLink
                                                  ? "Join Meeting"
                                                  : "No meeting link"
                                              }
                                            >
                                              <Button
                                                type="primary"
                                                block
                                                size="small"
                                                icon={<VideoCameraOutlined />}
                                                onClick={() =>
                                                  heroMeeting.meetingLink &&
                                                  window.open(
                                                    heroMeeting.meetingLink,
                                                    "_blank",
                                                  )
                                                }
                                                disabled={!heroMeeting.meetingLink}
                                                style={{
                                                  marginTop: 10,
                                                  borderRadius: 8,
                                                  height: 30,
                                                  fontSize: 12,
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {live ? "Join now" : "Join meeting"}
                                              </Button>
                                            </Tooltip>
                                          </div>
                                        );
                                      })()}

                                    {/* Rest list */}
                                    {restMeetings.length > 0 && (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 6,
                                        }}
                                      >
                                        {restMeetings.map(
                                          (m: any, idx: number) => {
                                            const start = dayjs(m.startTime);
                                            const end = dayjs(m.endTime);
                                            const past = isPast(m);
                                            const totalMin = Math.max(
                                              1,
                                              end.diff(start, "minute"),
                                            );
                                            return (
                                              <div
                                                key={m.id || idx}
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 10,
                                                  padding: "6px 10px",
                                                  borderRadius: 10,
                                                  background:
                                                    token.colorFillAlter,
                                                  border: `1px solid ${token.colorBorderSecondary}`,
                                                  opacity: past ? 0.55 : 1,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    minWidth: 42,
                                                    textAlign: "center",
                                                    padding: "3px 0",
                                                    borderRadius: 8,
                                                    background:
                                                      token.colorBgContainer,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      fontSize: 11,
                                                      fontWeight: 700,
                                                      color: token.colorText,
                                                      fontVariantNumeric:
                                                        "tabular-nums",
                                                      lineHeight: 1,
                                                    }}
                                                  >
                                                    {start.format("h:mm")}
                                                  </div>
                                                  <div
                                                    style={{
                                                      fontSize: 8,
                                                      fontWeight: 700,
                                                      color:
                                                        token.colorTextTertiary,
                                                      letterSpacing: "0.5px",
                                                      marginTop: 1,
                                                    }}
                                                  >
                                                    {start.format("A")}
                                                  </div>
                                                </div>

                                                <div
                                                  style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                  }}
                                                >
                                                  <Tooltip title={m.title}>
                                                    <div
                                                      style={{
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color:
                                                          token.colorText,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                          "ellipsis",
                                                        lineHeight: 1.3,
                                                      }}
                                                    >
                                                      {m.title}
                                                    </div>
                                                  </Tooltip>
                                                  <Text
                                                    style={{
                                                      fontSize: 10,
                                                      color:
                                                        token.colorTextTertiary,
                                                      fontWeight: 500,
                                                    }}
                                                  >
                                                    {totalMin}m ·{" "}
                                                    {formatRelative(m)}
                                                  </Text>
                                                </div>

                                                <Tooltip
                                                  title={
                                                    m.meetingLink
                                                      ? past
                                                        ? "Meeting ended"
                                                        : "Join Meeting"
                                                      : "No meeting link"
                                                  }
                                                >
                                                  <Button
                                                    type={
                                                      m.meetingLink && !past
                                                        ? "primary"
                                                        : "default"
                                                    }
                                                    size="small"
                                                    icon={
                                                      <VideoCameraOutlined
                                                        style={{
                                                          fontSize: 11,
                                                        }}
                                                      />
                                                    }
                                                    onClick={() =>
                                                      m.meetingLink &&
                                                      window.open(
                                                        m.meetingLink,
                                                        "_blank",
                                                      )
                                                    }
                                                    disabled={
                                                      !m.meetingLink || past
                                                    }
                                                    style={{
                                                      borderRadius: 8,
                                                      height: 26,
                                                      fontSize: 11,
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    Join
                                                  </Button>
                                                </Tooltip>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div
                                style={{
                                  padding: 24,
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: `linear-gradient(135deg, #EEF2FF 0%, #FAFBFF 100%)`,
                                    border: "1px solid #C7D2FE",
                                    margin: "0 auto 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#4F46E5",
                                  }}
                                >
                                  <CalendarOutlined
                                    style={{ fontSize: 22 }}
                                  />
                                </div>
                                <Text
                                  strong
                                  style={{
                                    fontSize: 13,
                                    display: "block",
                                    color: token.colorText,
                                    marginBottom: 2,
                                  }}
                                >
                                  No meetings today
                                </Text>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: 11 }}
                                >
                                  Enjoy the deep focus time 🌿
                                </Text>
                              </div>
                            )}
                          </div>
                        </Card>
                      </Col>

                      <Col xs={24} lg={8}>
                        {(() => {
                          const pendingTickets = Math.max(
                            0,
                            totalTickets - completedTickets - inProgressTickets - blockedTickets,
                          );
                          const segments = [
                            { key: "done", label: "Done", value: completedTickets, color: "#10B981" },
                            { key: "active", label: "Active", value: inProgressTickets, color: "#0EA5E9" },
                            { key: "blocked", label: "Blocked", value: blockedTickets, color: "#EF4444" },
                            { key: "pending", label: "Pending", value: pendingTickets, color: "#F59E0B" },
                          ];
                          const pct = (n: number) =>
                            totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0;
                          return (
                        <Card
                          style={{ ...cardBase, height: 340, overflow: "hidden", position: "relative" }}
                          styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
                          title={sectionTitle(
                            <TrophyOutlined />,
                            "My Tickets",
                            "#7C3AED",
                          )}
                          extra={
                            <Button
                              type="link"
                              size="small"
                              onClick={() => router.push("/tickets")}
                              style={{ fontSize: 11 }}
                            >
                              View all
                            </Button>
                          }
                        >
                          {totalTickets === 0 ? (
                            <div style={{ padding: 24, textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    No tickets found
                                  </Text>
                                }
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                padding: "12px 16px 14px",
                              }}
                            >
                              {/* Hero row: completion % + closed/total */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-end",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  marginBottom: 8,
                                }}
                              >
                                <div>
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: token.colorTextSecondary,
                                      letterSpacing: "0.6px",
                                      textTransform: "uppercase",
                                      display: "block",
                                    }}
                                  >
                                    Completion
                                  </Text>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "baseline",
                                      gap: 6,
                                      marginTop: 2,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        color: token.colorText,
                                        letterSpacing: "-0.8px",
                                        fontVariantNumeric: "tabular-nums",
                                        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #7C3AED 100%)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                      }}
                                    >
                                      {completionRate}%
                                    </span>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    textAlign: "right",
                                    paddingBottom: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 16,
                                      fontWeight: 700,
                                      color: token.colorText,
                                      lineHeight: 1,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {completedTickets}
                                    <span style={{ color: token.colorTextTertiary, fontWeight: 500 }}>
                                      {" "}/ {totalTickets}
                                    </span>
                                  </div>
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: token.colorTextSecondary,
                                      fontWeight: 600,
                                      letterSpacing: "0.4px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Closed · Total
                                  </Text>
                                </div>
                              </div>

                              {/* Segmented progress bar */}
                              <div
                                style={{
                                  display: "flex",
                                  width: "100%",
                                  height: 6,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  background: token.colorFillAlter,
                                  border: `1px solid ${token.colorBorderSecondary}`,
                                  gap: 2,
                                  padding: 1,
                                  marginBottom: 10,
                                }}
                              >
                                {segments
                                  .filter((s) => s.value > 0)
                                  .map((s) => (
                                    <Tooltip
                                      key={s.key}
                                      title={`${s.label}: ${s.value} (${pct(s.value)}%)`}
                                    >
                                      <div
                                        style={{
                                          flex: s.value,
                                          background: s.color,
                                          borderRadius: 999,
                                          minWidth: 4,
                                          transition: "opacity 0.2s",
                                        }}
                                      />
                                    </Tooltip>
                                  ))}
                              </div>

                              {/* Status breakdown list */}
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                  flex: 1,
                                }}
                              >
                                {segments.map((s) => (
                                  <div
                                    key={s.key}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "5px 10px",
                                      borderRadius: 8,
                                      background: token.colorFillAlter,
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          background: s.color,
                                          boxShadow: `0 0 0 3px ${s.color}1F`,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: token.colorText,
                                        }}
                                      >
                                        {s.label}
                                      </Text>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 6,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 14,
                                          fontWeight: 700,
                                          color: token.colorText,
                                          fontVariantNumeric: "tabular-nums",
                                          lineHeight: 1,
                                        }}
                                      >
                                        {s.value}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 10,
                                          color: token.colorTextTertiary,
                                          fontWeight: 600,
                                          fontVariantNumeric: "tabular-nums",
                                          minWidth: 28,
                                          textAlign: "right",
                                        }}
                                      >
                                        {pct(s.value)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                          );
                        })()}
                      </Col>
                </Row>

                {/* Bottom Row: Recent Tickets + Quick Actions */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                      <Col xs={24} lg={16}>
                        <Card
                          style={{ ...cardBase, height: "100%" }}
                          styles={{ body: { padding: 16, display: "flex", flexDirection: "column" } }}
                          title={sectionTitle(
                            <FileTextOutlined />,
                            "Recent Tickets",
                            "#0EA5E9",
                          )}
                          extra={
                            <Space size={8}>
                              <Tag
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  borderRadius: 999,
                                  padding: "1px 8px",
                                  background: token.colorFillAlter,
                                  border: `1px solid ${token.colorBorderSecondary}`,
                                  color: token.colorTextSecondary,
                                }}
                              >
                                {recentTickets.length} recent
                              </Tag>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => router.push("/tickets")}
                                style={{ fontSize: 11 }}
                              >
                                View all
                              </Button>
                            </Space>
                          }
                        >
                          {recentTickets.length === 0 ? (
                            <div
                              style={{
                                padding: 40,
                                textAlign: "center",
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    No tickets yet
                                  </Text>
                                }
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(240px, 1fr))",
                                gap: 12,
                              }}
                            >
                              {recentTickets.map((item: any) => {
                                const status = item.status?.toLowerCase();
                                const statusMeta: Record<
                                  string,
                                  { label: string; color: string; bg: string }
                                > = {
                                  completed: { label: "Completed", color: "#10B981", bg: "#ECFDF5" },
                                  live: { label: "Live", color: "#10B981", bg: "#ECFDF5" },
                                  done: { label: "Done", color: "#10B981", bg: "#ECFDF5" },
                                  in_progress: { label: "In Progress", color: "#0EA5E9", bg: "#F0F9FF" },
                                  doing: { label: "In Progress", color: "#0EA5E9", bg: "#F0F9FF" },
                                  blocked: { label: "Blocked", color: "#EF4444", bg: "#FEF2F2" },
                                  not_started: { label: "Not Started", color: "#94A3B8", bg: token.colorFillAlter },
                                };
                                const sm =
                                  statusMeta[status] || {
                                    label: (item.status || "—")
                                      .replace(/_/g, " ")
                                      .toUpperCase(),
                                    color: token.colorTextSecondary,
                                    bg: token.colorFillAlter,
                                  };
                                const priorityColor = getPriorityColor(item.priority);
                                const priority = (item.priority || "")
                                  .toString()
                                  .toUpperCase();
                                const projectLabel =
                                  typeof item.project === "string"
                                    ? item.project
                                    : item.project?.code || item.project?.name || "—";

                                return (
                                  <div
                                    key={item.id}
                                    onClick={() =>
                                      router.push(`/tickets/${item.id}`)
                                    }
                                    className="ticket-list-item"
                                    style={{
                                      position: "relative",
                                      cursor: "pointer",
                                      borderRadius: 14,
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                      background: token.colorBgContainer,
                                      padding: "14px 14px 12px 18px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 10,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {/* Priority left bar */}
                                    <div
                                      aria-hidden
                                      style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        background: priorityColor,
                                      }}
                                    />

                                    {/* Header row */}
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                      }}
                                    >
                                      <Space size={6} align="center">
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: "0.4px",
                                            color: token.colorTextSecondary,
                                            background: token.colorFillAlter,
                                            border: `1px solid ${token.colorBorderSecondary}`,
                                            padding: "2px 6px",
                                            borderRadius: 6,
                                            fontVariantNumeric: "tabular-nums",
                                          }}
                                        >
                                          {item.ticketNumber}
                                        </span>
                                        {projectLabel && projectLabel !== "—" && (
                                          <span
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 600,
                                              color: token.colorTextTertiary,
                                              maxWidth: 100,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            · {projectLabel}
                                          </span>
                                        )}
                                      </Space>
                                      {priority && (
                                        <Tooltip title={`Priority: ${priority}`}>
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 4,
                                              fontSize: 9,
                                              fontWeight: 700,
                                              letterSpacing: "0.4px",
                                              color: priorityColor,
                                              padding: "2px 6px",
                                              borderRadius: 999,
                                              background: `${priorityColor}14`,
                                              border: `1px solid ${priorityColor}33`,
                                            }}
                                          >
                                            <span
                                              style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: "50%",
                                                background: priorityColor,
                                              }}
                                            />
                                            {priority}
                                          </span>
                                        </Tooltip>
                                      )}
                                    </div>

                                    {/* Title */}
                                    <Tooltip title={item.title}>
                                      <div
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 600,
                                          color: token.colorText,
                                          lineHeight: 1.35,
                                          letterSpacing: "-0.1px",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          minHeight: 36,
                                        }}
                                      >
                                        {item.title}
                                      </div>
                                    </Tooltip>

                                    {/* Footer row */}
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        paddingTop: 8,
                                        borderTop: `1px dashed ${token.colorBorderSecondary}`,
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                          fontSize: 10,
                                          fontWeight: 700,
                                          letterSpacing: "0.3px",
                                          color: sm.color,
                                          background: sm.bg,
                                          padding: "3px 8px",
                                          borderRadius: 999,
                                          border: `1px solid ${sm.color}26`,
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: "50%",
                                            background: sm.color,
                                            boxShadow: `0 0 6px ${sm.color}80`,
                                          }}
                                        />
                                        {sm.label.toUpperCase()}
                                      </span>

                                      <Space size={8} align="center">
                                        <Text
                                          style={{
                                            fontSize: 10,
                                            color: token.colorTextTertiary,
                                            fontWeight: 500,
                                          }}
                                        >
                                          {formatTimeAgo(item.createdAt)}
                                        </Text>
                                        {item.assignee && (
                                          <Tooltip
                                            title={`Assignee: ${item.assignee.name}`}
                                          >
                                            <Avatar
                                              size={22}
                                              src={item.assignee.avatar}
                                              style={{
                                                backgroundColor: "#7C3AED",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                border: `2px solid ${token.colorBgContainer}`,
                                                boxShadow:
                                                  "0 2px 6px rgba(15, 23, 42, 0.12)",
                                              }}
                                            >
                                              {item.assignee.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                            </Avatar>
                                          </Tooltip>
                                        )}
                                      </Space>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Card>
                      </Col>

                      <Col xs={24} lg={8}>
                        <Card
                          style={{ ...cardBase, height: "100%" }}
                          styles={{ body: { padding: 16 } }}
                          title={sectionTitle(
                            <ThunderboltFilled />,
                            "Quick Actions",
                            "#F59E0B",
                          )}
                        >
                          <Space
                            direction="vertical"
                            size={10}
                            style={{ width: "100%" }}
                          >
                            <QuickActionCard
                              icon={<PlusCircleOutlined />}
                              title="Create Ticket"
                              desc="Log a new task or issue"
                              accent="#7C3AED"
                              onClick={() => router.push("/tickets")}
                            />
                            <QuickActionCard
                              icon={<FolderOpenOutlined />}
                              title="Document Hub"
                              desc="Browse and manage documents"
                              accent="#10B981"
                              onClick={() => router.push("/documenthub")}
                            />
                            <QuickActionCard
                              icon={<AppstoreOutlined />}
                              title="Projects"
                              desc="View all active projects"
                              accent="#0EA5E9"
                              onClick={() => router.push("/projects")}
                            />
                          </Space>
                        </Card>
                      </Col>
                </Row>
              </>
            ) : null}
          </>
        )}

        {/* ─── FREELANCER SEGMENT ─────────────────────────────── */}
        {activeSegment === "freelancer" && (
          <>
            {loading ? (
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Col xs={24} sm={12} lg={6} key={i}>
                    <Card size="small" style={{ ...cardBase }} styles={{ body: { padding: 18 } }}>
                      <Skeleton active paragraph={{ rows: 1 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <>
                {/* ─── KPI Strip ──────────────────────────────────── */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                      eyebrow="Tickets · Closed / Total"
                      value={`${myTicketsStats.closed} / ${myTicketsStats.total}`}
                      trend={dashboardData?.trends.ticketCompletionRate || "—"}
                      trendTone="positive"
                      icon={<TrophyOutlined />}
                      accent="#7C3AED"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                      eyebrow="Recent Leads"
                      value={recentLeads.length}
                      trend="Total Active"
                      trendTone="neutral"
                      icon={<RocketOutlined />}
                      accent="#F59E0B"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    {hasPermission(Permissions.INVOICE_DASHBOARD_READ) && (
                      <KpiCard
                        eyebrow="Invoices"
                        value={createdInvoices.length}
                        trend="Last 5 Generated"
                        trendTone="neutral"
                        icon={<AuditOutlined />}
                        accent="#10B981"
                      />
                    )}
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                      eyebrow="Active Projects"
                      value={dashboardData?.stats.activeProjects || 0}
                      trend={`${dashboardData?.trends.projectGrowth || "0%"}`}
                      trendTone="positive"
                      icon={<AppstoreOutlined />}
                      accent="#0EA5E9"
                    />
                  </Col>
                </Row>

                {/* ─── Main Grid ──────────────────────────────────── */}
                <Row gutter={[16, 16]}>
                  {/* My Tickets Stats */}
                  <Col xs={24} lg={8}>
                    {(() => {
                      const pendingTickets = Math.max(0, totalTickets - completedTickets - inProgressTickets - blockedTickets);
                      const segments = [
                        { key: "done", label: "Done", value: completedTickets, color: "#10B981" },
                        { key: "active", label: "Active", value: inProgressTickets, color: "#0EA5E9" },
                        { key: "blocked", label: "Blocked", value: blockedTickets, color: "#EF4444" },
                        { key: "pending", label: "Pending", value: pendingTickets, color: "#F59E0B" },
                      ];
                      const pct = (n: number) => totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0;
                      return (
                        <Card
                          style={{ ...cardBase, height: 340, overflow: "hidden" }}
                          styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
                          title={sectionTitle(<TrophyOutlined />, "My Tickets", "#7C3AED")}
                          extra={<Button type="link" size="small" onClick={() => router.push("/tickets")} style={{ fontSize: 11 }}>View all</Button>}
                        >
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 16px 14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                              <div>
                                <Text style={{ fontSize: 10, fontWeight: 700, color: token.colorTextSecondary, letterSpacing: "0.6px", textTransform: "uppercase", display: "block" }}>Completion</Text>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                                  <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: token.colorText, letterSpacing: "-0.8px", fontVariantNumeric: "tabular-nums", background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #7C3AED 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                    {completionRate}%
                                  </span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right", paddingBottom: 4 }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: token.colorText, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                                  {completedTickets}
                                  <span style={{ color: token.colorTextTertiary, fontWeight: 500 }}> / {totalTickets}</span>
                                </div>
                                <Text style={{ fontSize: 10, color: token.colorTextSecondary, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase" }}>Closed · Total</Text>
                              </div>
                            </div>
                            <div style={{ display: "flex", width: "100%", height: 6, borderRadius: 999, overflow: "hidden", background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}`, gap: 2, padding: 1, marginBottom: 10 }}>
                              {segments.filter((s) => s.value > 0).map((s) => (
                                <Tooltip key={s.key} title={`${s.label}: ${s.value} (${pct(s.value)}%)`}>
                                  <div style={{ flex: s.value, background: s.color, borderRadius: 999, minWidth: 4 }} />
                                </Tooltip>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                              {segments.map((s) => (
                                <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 8, background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}` }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 0 3px ${s.color}1F` }} />
                                    <Text style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>{s.label}</Text>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: token.colorText, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.value}</span>
                                    <span style={{ fontSize: 10, color: token.colorTextTertiary, fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "right" }}>{pct(s.value)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      );
                    })()}
                  </Col>

                  {/* Today's Meetings */}
                  <Col xs={24} lg={8}>
                    <Card
                      style={{ ...cardBase, height: 340, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                      title={sectionTitle(
                        <VideoCameraOutlined />,
                        "Today's Meetings",
                        "#7C3AED",
                      )}
                      extra={
                        connectedProvider ? (
                          <Space size={4}>
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <ClockCircleOutlined
                                  style={{ fontSize: 11 }}
                                />
                              }
                              onClick={() =>
                                syncCalendar(connectedProvider)
                              }
                              loading={calendarSyncing}
                              style={{ fontSize: 11 }}
                            >
                              Sync
                            </Button>
                            <Button
                              type="text"
                              size="small"
                              onClick={() => router.push("/calendar")}
                              style={{ fontSize: 11 }}
                            >
                              View
                            </Button>
                          </Space>
                        ) : (
                          <Button
                            type="link"
                            size="small"
                            onClick={() => router.push("/integrations")}
                            style={{ fontSize: 11 }}
                          >
                            Connect
                          </Button>
                        )
                      }
                    >
                      <div
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          padding: 0,
                        }}
                        className="no-scrollbar"
                      >
                        {calendarLoading ? (
                          <div style={{ padding: 16 }}>
                            <Skeleton active paragraph={{ rows: 3 }} />
                          </div>
                        ) : !connectedProvider ? (
                          <div
                            style={{
                              padding: 24,
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: token.colorFillAlter,
                                margin: "0 auto 12px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: token.colorTextTertiary,
                              }}
                            >
                              <VideoCameraOutlined
                                style={{ fontSize: 22 }}
                              />
                            </div>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                display: "block",
                                marginBottom: 12,
                              }}
                            >
                              Connect your calendar to see today's meetings
                            </Text>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() =>
                                router.push("/integrations")
                              }
                              style={{ borderRadius: 8 }}
                            >
                              Connect Calendar
                            </Button>
                          </div>
                        ) : todaysMeetings.length > 0 ? (
                          (() => {
                            const now = dayjs();
                            const sorted = [...todaysMeetings].sort(
                              (a: any, b: any) =>
                                dayjs(a.startTime).valueOf() -
                                dayjs(b.startTime).valueOf(),
                            );
                            const isLive = (m: any) =>
                              dayjs(m.startTime).isBefore(now) &&
                              dayjs(m.endTime).isAfter(now);
                            const isPast = (m: any) =>
                              dayjs(m.endTime).isBefore(now);
                            const liveMeeting = sorted.find(isLive);
                            const upcoming = sorted.filter((m: any) =>
                              dayjs(m.startTime).isAfter(now),
                            );
                            const ended = sorted.filter(isPast);
                            const heroMeeting = liveMeeting || upcoming[0];
                            const restMeetings = sorted.filter(
                              (m: any) => m !== heroMeeting,
                            );

                            const formatRelative = (m: any) => {
                              const s = dayjs(m.startTime);
                              const e = dayjs(m.endTime);
                              if (s.isBefore(now) && e.isAfter(now)) {
                                const minLeft = e.diff(now, "minute");
                                return `${minLeft}m left`;
                              }
                              if (s.isAfter(now)) {
                                const diff = s.diff(now, "minute");
                                if (diff < 60) return `in ${diff}m`;
                                const h = Math.floor(diff / 60);
                                const mm = diff % 60;
                                return mm
                                  ? `in ${h}h ${mm}m`
                                  : `in ${h}h`;
                              }
                              const minAgo = now.diff(e, "minute");
                              if (minAgo < 60) return `${minAgo}m ago`;
                              return `${Math.floor(minAgo / 60)}h ago`;
                            };

                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                  padding: "10px 14px 14px",
                                }}
                              >
                                {/* Summary row */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: token.colorTextSecondary,
                                      letterSpacing: "0.6px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {sorted.length} meeting
                                    {sorted.length !== 1 ? "s" : ""}
                                    {liveMeeting && " · 1 live"}
                                    {!liveMeeting && upcoming.length > 0 &&
                                      ` · ${upcoming.length} upcoming`}
                                  </Text>
                                  {ended.length > 0 && (
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        color: token.colorTextTertiary,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {ended.length} done
                                    </Text>
                                  )}
                                </div>

                                {/* Hero meeting */}
                                {heroMeeting &&
                                  (() => {
                                    const live = isLive(heroMeeting);
                                    const start = dayjs(heroMeeting.startTime);
                                    const end = dayjs(heroMeeting.endTime);
                                    const totalMin = Math.max(
                                      1,
                                      end.diff(start, "minute"),
                                    );
                                    const progressPct = live
                                      ? Math.min(
                                          100,
                                          Math.round(
                                            (now.diff(start, "minute") /
                                              totalMin) *
                                              100,
                                          ),
                                        )
                                      : 0;
                                    return (
                                      <div
                                        style={{
                                          position: "relative",
                                          borderRadius: 12,
                                          padding: 12,
                                          background: token.colorFillAlter,
                                          border: `1px solid ${token.colorBorderSecondary}`,
                                          overflow: "hidden",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 4,
                                          }}
                                        >
                                          <Tooltip title={heroMeeting.title}>
                                            <div
                                              style={{
                                                flex: 1,
                                                minWidth: 0,
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: token.colorText,
                                                letterSpacing: "-0.2px",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                              }}
                                            >
                                              {heroMeeting.title}
                                            </div>
                                          </Tooltip>
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 5,
                                              padding: "2px 8px",
                                              borderRadius: 999,
                                              background: live
                                                ? "#ECFDF5"
                                                : "rgba(79,70,229,0.10)",
                                              border: live
                                                ? "1px solid #A7F3D0"
                                                : "1px solid rgba(79,70,229,0.25)",
                                              color: live
                                                ? "#047857"
                                                : "#4F46E5",
                                              fontSize: 9,
                                              fontWeight: 700,
                                              letterSpacing: "0.6px",
                                              flexShrink: 0,
                                            }}
                                          >
                                            <span
                                              className={
                                                live ? "live-pulse" : ""
                                              }
                                              style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: "50%",
                                                background: live
                                                  ? "#10B981"
                                                  : "#4F46E5",
                                              }}
                                            />
                                            {live ? "LIVE NOW" : "NEXT UP"}
                                          </span>
                                          <Text
                                            style={{
                                              fontSize: 10,
                                              color: token.colorTextSecondary,
                                              fontWeight: 600,
                                              fontVariantNumeric:
                                                "tabular-nums",
                                              flexShrink: 0,
                                            }}
                                          >
                                            {formatRelative(heroMeeting)}
                                          </Text>
                                        </div>

                                        <Text
                                          style={{
                                            fontSize: 11,
                                            color: token.colorTextSecondary,
                                            fontVariantNumeric:
                                              "tabular-nums",
                                            fontWeight: 500,
                                            display: "block",
                                          }}
                                        >
                                          {start.format("h:mm A")} —{" "}
                                          {end.format("h:mm A")} ·{" "}
                                          {totalMin}m
                                        </Text>

                                        {live && (
                                          <div
                                            style={{
                                              marginTop: 8,
                                              height: 4,
                                              background: token.colorBgContainer,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                              borderRadius: 999,
                                              overflow: "hidden",
                                            }}
                                          >
                                            <div
                                              style={{
                                                height: "100%",
                                                width: `${progressPct}%`,
                                                background: token.colorPrimary,
                                                borderRadius: 999,
                                                transition:
                                                  "width 1s linear",
                                              }}
                                            />
                                          </div>
                                        )}

                                        <Tooltip
                                          title={
                                            heroMeeting.meetingLink
                                              ? "Join Meeting"
                                              : "No meeting link"
                                          }
                                        >
                                          <Button
                                            type="primary"
                                            block
                                            size="small"
                                            icon={<VideoCameraOutlined />}
                                            onClick={() =>
                                              heroMeeting.meetingLink &&
                                              window.open(
                                                heroMeeting.meetingLink,
                                                "_blank",
                                              )
                                            }
                                            disabled={!heroMeeting.meetingLink}
                                            style={{
                                              marginTop: 10,
                                              borderRadius: 8,
                                              height: 30,
                                              fontSize: 12,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {live ? "Join now" : "Join meeting"}
                                          </Button>
                                        </Tooltip>
                                      </div>
                                    );
                                  })()}

                                {/* Rest list */}
                                {restMeetings.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 6,
                                    }}
                                  >
                                    {restMeetings.map(
                                      (m: any, idx: number) => {
                                        const start = dayjs(m.startTime);
                                        const end = dayjs(m.endTime);
                                        const past = isPast(m);
                                        const totalMin = Math.max(
                                          1,
                                          end.diff(start, "minute"),
                                        );
                                        return (
                                          <div
                                            key={m.id || idx}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 10,
                                              padding: "6px 10px",
                                              borderRadius: 10,
                                              background:
                                                token.colorFillAlter,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                              opacity: past ? 0.55 : 1,
                                            }}
                                          >
                                            <div
                                              style={{
                                                minWidth: 42,
                                                textAlign: "center",
                                                padding: "3px 0",
                                                borderRadius: 8,
                                                background:
                                                  token.colorBgContainer,
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize: 11,
                                                  fontWeight: 700,
                                                  color: token.colorText,
                                                  fontVariantNumeric:
                                                    "tabular-nums",
                                                  lineHeight: 1,
                                                }}
                                              >
                                                {start.format("h:mm")}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: 8,
                                                  fontWeight: 700,
                                                  color:
                                                    token.colorTextTertiary,
                                                  letterSpacing: "0.5px",
                                                  marginTop: 1,
                                                }}
                                              >
                                                {start.format("A")}
                                              </div>
                                            </div>

                                            <div
                                              style={{
                                                flex: 1,
                                                minWidth: 0,
                                              }}
                                            >
                                              <Tooltip title={m.title}>
                                                <div
                                                  style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color:
                                                      token.colorText,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow:
                                                      "ellipsis",
                                                    lineHeight: 1.3,
                                                  }}
                                                >
                                                  {m.title}
                                                </div>
                                              </Tooltip>
                                              <Text
                                                style={{
                                                  fontSize: 10,
                                                  color:
                                                    token.colorTextTertiary,
                                                  fontWeight: 500,
                                                }}
                                              >
                                                {totalMin}m ·{" "}
                                                {formatRelative(m)}
                                              </Text>
                                            </div>

                                            <Tooltip
                                              title={
                                                m.meetingLink
                                                  ? past
                                                    ? "Meeting ended"
                                                    : "Join Meeting"
                                                  : "No meeting link"
                                              }
                                            >
                                              <Button
                                                type={
                                                  m.meetingLink && !past
                                                    ? "primary"
                                                    : "default"
                                                }
                                                size="small"
                                                icon={
                                                  <VideoCameraOutlined
                                                    style={{
                                                      fontSize: 11,
                                                    }}
                                                  />
                                                }
                                                onClick={() =>
                                                  m.meetingLink &&
                                                  window.open(
                                                    m.meetingLink,
                                                    "_blank",
                                                  )
                                                }
                                                disabled={
                                                  !m.meetingLink || past
                                                }
                                                style={{
                                                  borderRadius: 8,
                                                  height: 26,
                                                  fontSize: 11,
                                                  fontWeight: 600,
                                                }}
                                              >
                                                Join
                                              </Button>
                                            </Tooltip>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div
                            style={{
                              padding: 24,
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: `linear-gradient(135deg, #EEF2FF 0%, #FAFBFF 100%)`,
                                border: "1px solid #C7D2FE",
                                margin: "0 auto 10px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#4F46E5",
                              }}
                            >
                              <CalendarOutlined
                                style={{ fontSize: 22 }}
                              />
                            </div>
                            <Text
                              strong
                              style={{
                                fontSize: 13,
                                display: "block",
                                color: token.colorText,
                                marginBottom: 2,
                              }}
                            >
                              No meetings today
                            </Text>
                            <Text
                              type="secondary"
                              style={{ fontSize: 11 }}
                            >
                              Enjoy the deep focus time 🌿
                            </Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>

                  {/* Recent Tickets List */}
                  <Col xs={24} lg={8}>
                    <Card
                      style={{ ...cardBase, height: 340, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                      title={sectionTitle(<FileTextOutlined />, "Recent Tickets", "#0EA5E9")}
                      extra={<Button type="link" size="small" onClick={() => router.push("/tickets")} style={{ fontSize: 11 }}>View all</Button>}
                    >
                      <div style={{ flex: 1, overflowY: "auto", padding: 12 }} className="no-scrollbar">
                        {recentTickets.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {recentTickets.slice(0, 5).map((ticket: any) => (
                              <div key={ticket.id} onClick={() => router.push(`/tickets/${ticket.id}`)} style={{ padding: "10px 12px", borderRadius: 12, background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}`, cursor: "pointer" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                  <Text strong style={{ fontSize: 13, color: token.colorText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{ticket.title}</Text>
                                  <Tag style={{ fontSize: 10, borderRadius: 6, margin: 0, marginLeft: 8 }}>{ticket.status}</Tag>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Text type="secondary" style={{ fontSize: 11 }}>{ticket.ticketId}</Text>
                                  <Text type="secondary" style={{ fontSize: 10 }}>{formatTimeAgo(ticket.createdAt)}</Text>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tickets found" />
                        )}
                      </div>
                    </Card>
                  </Col>

                  {/* Recent Leads */}
                  <Col xs={24} lg={12}>
                    <Card
                      style={{ ...cardBase, height: 340, display: "flex", flexDirection: "column" }}
                      styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                      title={sectionTitle(<RocketOutlined />, "Recent Leads", "#F59E0B")}
                      extra={<Button type="link" size="small" onClick={() => router.push("/leads")} style={{ fontSize: 11 }}>View all</Button>}
                    >
                      <div style={{ flex: 1, overflowY: "auto", padding: 12 }} className="no-scrollbar">
                        {recentLeads.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {recentLeads.slice(0, 5).map((lead: any) => (
                              <div key={lead.id} style={{ padding: "12px 14px", borderRadius: 14, background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text strong style={{ fontSize: 14, color: token.colorText, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.title}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{lead.client_name}</Text>
                                  </div>
                                  <Tag color={lead.status === "won" ? "success" : lead.status === "lost" ? "error" : "processing"} style={{ fontSize: 10, borderRadius: 6, margin: 0 }}>
                                    {(lead.status || "Open").toUpperCase()}
                                  </Tag>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Space size={4}>
                                    {lead.skills?.slice(0, 3).map((skill: string) => (
                                      <Tag key={skill} style={{ fontSize: 9, margin: 0, borderRadius: 4 }}>{skill}</Tag>
                                    ))}
                                  </Space>
                                  <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(lead.created_at).format("MMM D")}</Text>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: 40 }}>
                            <RocketOutlined style={{ fontSize: 32, color: token.colorTextTertiary, marginBottom: 12 }} />
                            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>No leads found</Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>

                  {/* Created Invoices */}
                  {hasPermission(Permissions.INVOICE_DASHBOARD_READ) && (
                    <Col xs={24} lg={12}>
                      <Card
                        style={{ ...cardBase, height: 340, display: "flex", flexDirection: "column" }}
                        styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                        title={sectionTitle(<AuditOutlined />, "Created Invoices", "#10B981")}
                        extra={<Button type="link" size="small" onClick={() => router.push("/invoice")} style={{ fontSize: 11 }}>View all</Button>}
                      >
                        <div style={{ flex: 1, overflowY: "auto", padding: 12 }} className="no-scrollbar">
                          {createdInvoices.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {createdInvoices.slice(0, 5).map((invoice: any) => (
                                <div key={invoice.id} style={{ padding: "12px 14px", borderRadius: 14, background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <div>
                                      <Text strong style={{ fontSize: 14, color: token.colorText, display: "block" }}>{invoice.invoiceNumber}</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>{invoice.customer?.companyName || "Client"}</Text>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <Text strong style={{ fontSize: 15, color: token.colorText }}>{invoice.currency} {invoice.grandTotal?.toLocaleString()}</Text>
                                      <div style={{ marginTop: 2 }}>
                                        <Tag color={invoice.status === "PAID" ? "success" : "warning"} style={{ fontSize: 10, borderRadius: 6, margin: 0 }}>
                                          {invoice.status}
                                        </Tag>
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Due: {dayjs(invoice.dueDate).format("MMM D, YYYY")}</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(invoice.createdAt).format("MMM D")}</Text>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", padding: 40 }}>
                              <AuditOutlined style={{ fontSize: 32, color: token.colorTextTertiary, marginBottom: 12 }} />
                              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>No invoices found</Text>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  )}
                </Row>
              </>
            )}
          </>
        )}

        {/* ─── ORGANIZATION SEGMENT ─────────────────────────────── */}
        {activeSegment === "organization" && <Organization />}
      </div>
    </MainLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
